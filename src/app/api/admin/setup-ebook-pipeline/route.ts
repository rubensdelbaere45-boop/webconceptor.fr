/**
 * POST /api/admin/setup-ebook-pipeline
 *
 * Setup TOUT-EN-UN du pipeline e-books KDP. Tom appelle 1 fois.
 *   1. Probe table `ebooks` (signale migration si absente)
 *   2. Probe bucket Supabase storage "ebooks"
 *   3. Importe workflow N8N "08 — E-books KDP quotidiens"
 *   4. Active workflow
 *   5. Vérifie LLM dispo (Gemini gratuit en priorité)
 *   6. Vérifie Brevo (envoi email)
 *   7. Notif Telegram avec rapport
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminGuard } from "@/lib/security";
import { createWorkflow, findWorkflowByName, activateWorkflow } from "@/lib/n8n-client";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WORKFLOW_NAME = "08 — E-books KDP quotidiens (2 livres / 6h Paris)";

interface SetupReport {
  step: string;
  ok: boolean;
  detail?: string;
}

export async function POST(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 1, windowSec: 300, routeKey: "setup-ebook" });
  if (guard) return guard;

  const report: SetupReport[] = [];

  // 1) Supabase table
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
    const probe = await supabase.from("ebooks").select("id").limit(1);
    if (probe.error && /relation .* does not exist|schema cache/i.test(probe.error.message)) {
      report.push({
        step: "supabase.table",
        ok: false,
        detail: "⚠️ Table ebooks absente. Exécute sql/2026_06_06_ebooks.sql dans Supabase > SQL Editor (60s).",
      });
    } else {
      report.push({ step: "supabase.table", ok: true, detail: "Table ebooks OK" });
    }

    // 2) Supabase bucket
    const buckets = await supabase.storage.listBuckets();
    const hasEbooksBucket = buckets.data?.some((b) => b.name === "ebooks");
    if (!hasEbooksBucket) {
      // Tente de le créer
      const create = await supabase.storage.createBucket("ebooks", { public: true });
      if (create.error) {
        report.push({
          step: "supabase.storage",
          ok: false,
          detail: `Bucket "ebooks" absent. Supabase > Storage > New bucket > nom "ebooks" > public. (Auto-create a échoué : ${create.error.message})`,
        });
      } else {
        report.push({ step: "supabase.storage", ok: true, detail: "Bucket ebooks créé" });
      }
    } else {
      report.push({ step: "supabase.storage", ok: true, detail: "Bucket ebooks OK" });
    }
  } catch (err) {
    report.push({ step: "supabase", ok: false, detail: err instanceof Error ? err.message : "unknown" });
  }

  // 3) LLM disponible
  const llmProviders = [
    process.env.GEMINI_API_KEY && "Gemini (gratuit)",
    process.env.OPENROUTER_API_KEY && "OpenRouter (gratuit)",
    process.env.MISTRAL_API_KEY && "Mistral",
    process.env.ANTHROPIC_API_KEY && "Anthropic Claude",
  ].filter(Boolean);
  if (llmProviders.length === 0) {
    report.push({
      step: "llm",
      ok: false,
      detail: "⚠️ Aucune clé LLM. Crée 1 clé GEMINI gratuite (30s) sur https://aistudio.google.com/app/apikey → set GEMINI_API_KEY sur Vercel.",
    });
  } else {
    report.push({ step: "llm", ok: true, detail: `Providers dispo : ${llmProviders.join(", ")}` });
  }

  // 4) Brevo
  if (!process.env.BREVO_API_KEY) {
    report.push({ step: "brevo.email", ok: false, detail: "BREVO_API_KEY manquante (déjà setté pour ton autre business, vérifie)" });
  } else {
    report.push({ step: "brevo.email", ok: true, detail: "BREVO_API_KEY OK" });
  }

  // 5) N8N workflow
  let workflowId: string | null = null;
  try {
    if (!process.env.N8N_API_KEY) {
      report.push({ step: "n8n.import", ok: false, detail: "N8N_API_KEY manquante" });
    } else {
      const existing = await findWorkflowByName(WORKFLOW_NAME);
      if (existing) {
        workflowId = existing.id;
        report.push({ step: "n8n.import", ok: true, detail: `Workflow déjà importé (id ${existing.id})` });
      } else {
        const jsonPath = path.join(process.cwd(), "n8n-workflows", "08_ebook_daily.json");
        const raw = await readFile(jsonPath, "utf-8");
        const wf = JSON.parse(raw);
        const created = await createWorkflow(wf);
        if (!created.ok || !created.id) {
          report.push({ step: "n8n.import", ok: false, detail: created.error || "échec création" });
        } else {
          workflowId = created.id;
          report.push({ step: "n8n.import", ok: true, detail: `Workflow créé id ${created.id}` });
        }
      }
    }
  } catch (err) {
    report.push({ step: "n8n.import", ok: false, detail: err instanceof Error ? err.message : "unknown" });
  }

  if (workflowId) {
    try {
      const act = await activateWorkflow(workflowId);
      report.push({ step: "n8n.activate", ok: act.ok, detail: act.error || `Workflow activé (cron 6h Paris)` });
    } catch (err) {
      report.push({ step: "n8n.activate", ok: false, detail: err instanceof Error ? err.message : "unknown" });
    }
  }

  // 6) Email destination
  const emailTo = process.env.EBOOK_EMAIL_TO;
  if (!emailTo) {
    report.push({
      step: "config.email_to",
      ok: false,
      detail: "EBOOK_EMAIL_TO non setté sur Vercel — fallback ru.delbaere@gmail.com utilisé",
    });
  } else {
    report.push({ step: "config.email_to", ok: true, detail: `Emails envoyés à ${emailTo}` });
  }

  // 7) Telegram
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId) {
    const lines = report.map((r) => `${r.ok ? "✅" : "❌"} <b>${r.step}</b> — ${r.detail || ""}`);
    const summary = `📚 <b>Setup pipeline e-books KDP</b>\n\n${lines.join("\n")}`;
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: summary, parse_mode: "HTML", disable_web_page_preview: true }),
    }).catch(() => {});
  }

  const allOk = report.every((r) => r.ok);
  return NextResponse.json({
    ok: allOk,
    report,
    next_steps: allOk
      ? [
          "Tu recevras 2 e-books chaque matin à ~6h30 par email",
          "Copier-coller depuis l'email vers kdp.amazon.com (5-10 min/livre)",
          "Upload PDF + cover joints à l'email",
          "Objectif 200€/mois = ≈ 60 ventes/mois si prix moyen 4.99€",
        ]
      : report.filter((r) => !r.ok).map((r) => `Fix : ${r.step} — ${r.detail}`),
  });
}

export async function GET(req: NextRequest) { return POST(req); }
