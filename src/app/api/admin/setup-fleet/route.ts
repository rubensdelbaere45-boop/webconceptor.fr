/**
 * POST /api/admin/setup-fleet
 *
 * Setup tout-en-un de la Klyora Sites Fleet :
 *   1. Vérifie colonnes Supabase (sales_angle, custom_hook, qa_*, etc.)
 *   2. Importe + active les 5 workflows N8N
 *     (11 Profiler, 12 Sniper, 13 Closer, 14 Déployeur, 15 QA Gatekeeper)
 *   3. Health-check LLM (OpenRouter Kimi) + Brevo
 *   4. Telegram récap
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminGuard } from "@/lib/security";
import { createWorkflow, findWorkflowByName, activateWorkflow } from "@/lib/n8n-client";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

interface SetupReport { step: string; ok: boolean; detail?: string; }

const FLEET = [
  { name: "11 — Fleet Agent 1 : Profiler (qualifie + custom_hook)",                file: "11_fleet_profiler.json" },
  { name: "12 — Fleet Agent 2 : Sniper (envoi email custom_hook)",                 file: "12_fleet_sniper.json" },
  { name: "13 — Fleet Agent 3 : Closer-Alert (Telegram leads chauds + relance J+1)", file: "13_fleet_closer.json" },
  { name: "14 — Fleet Agent 4 : Déployeur (IONOS + welcome post-paiement)",       file: "14_fleet_deployeur.json" },
  { name: "15 — QA Gatekeeper (filtre perfection après génération nocturne)",      file: "15_qa_gatekeeper.json" },
];

async function importAndActivate(name: string, file: string, report: SetupReport[]) {
  try {
    const existing = await findWorkflowByName(name);
    let id = existing?.id;
    if (!id) {
      const raw = await readFile(path.join(process.cwd(), "n8n-workflows", file), "utf-8");
      const created = await createWorkflow(JSON.parse(raw));
      if (!created.ok || !created.id) {
        report.push({ step: `n8n.${file}`, ok: false, detail: created.error });
        return;
      }
      id = created.id;
      report.push({ step: `n8n.${file}`, ok: true, detail: `Créé id ${id}` });
    } else {
      report.push({ step: `n8n.${file}`, ok: true, detail: `Déjà importé id ${id}` });
    }
    const act = await activateWorkflow(id);
    report.push({ step: `n8n.activate.${file}`, ok: act.ok, detail: act.error || `activé` });
  } catch (e) {
    report.push({ step: `n8n.${file}`, ok: false, detail: e instanceof Error ? e.message : "unknown" });
  }
}

export async function POST(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 1, windowSec: 300, routeKey: "setup-fleet" });
  if (guard) return guard;

  const report: SetupReport[] = [];

  // 1) Probe colonnes
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");
    const probe = await supabase.from("prospects").select("sales_angle,custom_hook,qa_passed,sniper_sent_at,hot_alert_sent_at").limit(1);
    if (probe.error && /column .* does not exist/i.test(probe.error.message)) {
      report.push({ step: "supabase.columns", ok: false, detail: "⚠️ Colonnes Fleet absentes. Exécute sql/2026_06_06_fleet.sql dans Supabase SQL editor." });
    } else {
      report.push({ step: "supabase.columns", ok: true, detail: "Colonnes Fleet OK" });
    }
  } catch (e) {
    report.push({ step: "supabase.columns", ok: false, detail: e instanceof Error ? e.message : "unknown" });
  }

  // 2) LLM + Brevo health
  const hasLlm = !!(process.env.OPENROUTER_API_KEY_KIMI || process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY || process.env.ANTHROPIC_API_KEY);
  report.push({ step: "llm", ok: hasLlm, detail: hasLlm ? "Kimi/Gemini/Claude OK" : "Set OPENROUTER_API_KEY_KIMI sur Vercel" });
  report.push({ step: "brevo", ok: !!process.env.BREVO_API_KEY, detail: process.env.BREVO_API_KEY ? "OK" : "BREVO_API_KEY manquante" });
  report.push({ step: "ionos", ok: !!(process.env.IONOS_API_KEY && process.env.IONOS_ORG_ID), detail: process.env.IONOS_API_KEY ? "Achat domaine auto OK" : "IONOS non configuré → activation manuelle" });

  // 3) Import + activation des 5 workflows
  if (!process.env.N8N_API_KEY) {
    report.push({ step: "n8n", ok: false, detail: "N8N_API_KEY manquante" });
  } else {
    for (const wf of FLEET) await importAndActivate(wf.name, wf.file, report);
  }

  // Telegram
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat) {
    const lines = report.map(r => `${r.ok ? "✅" : "❌"} <b>${r.step}</b> — ${r.detail || ""}`);
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: `🚀 <b>Setup Fleet</b>\n\n${lines.join("\n")}`, parse_mode: "HTML" }),
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: report.every(r => r.ok),
    report,
    architecture: {
      "Étape 1 — Scraping nocturne": "Couvre-feu génération Stitch/OpenDesign = 20h-5h Paris (sauf force=true)",
      "Étape 1bis — SIRENE": "src/lib/sources/sirene-confirm.ts : confirme business_type via API gouv",
      "Étape 2 — QA Gatekeeper": "POST /api/admin/qa-gatekeeper rejette HTML cassé/placeholder/incohérence métier",
      "Agent 1 Profiler": "4×/jour — qualifie + custom_hook via Kimi K2",
      "Agent 2 Sniper": "3×/jour Lun-Ven — email ultra-personnalisé avec custom_hook",
      "Agent 3 Closer-Alert": "1×/heure — Telegram lead chaud 2h+ + relance email J+1",
      "Agent 4 Déployeur": "Toutes les 15 min — IONOS + welcome (filet de sécurité du webhook Stripe)",
    },
  });
}

export async function GET(req: NextRequest) { return POST(req); }
