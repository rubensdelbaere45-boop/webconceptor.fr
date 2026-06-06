/**
 * POST /api/admin/setup-tiktok-pipeline
 *
 * Setup TOUT-EN-UN du pipeline TikTok. Tom appelle 1 fois → infra prête.
 *
 * Ce que ça fait :
 *   1. Crée la table `mockup_videos` dans Supabase (idempotent)
 *   2. Importe le workflow N8N "07 — Génération vidéos TikTok"
 *      (skip si déjà importé)
 *   3. Active le workflow
 *   4. Vérifie que SHORT_VIDEO_MAKER_URL répond
 *   5. Renvoie un rapport complet de ce qui marche / ce qui manque
 *
 * Auth : x-admin-key + rate-limit (1 / 5min, c'est un endpoint d'install)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminGuard, safeFetch } from "@/lib/security";
import { createWorkflow, findWorkflowByName, activateWorkflow } from "@/lib/n8n-client";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WORKFLOW_NAME = "07 — Génération vidéos TikTok (3x/jour aux heures d'affluence)";

interface SetupReport {
  step: string;
  ok: boolean;
  detail?: string;
}

export async function POST(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 1, windowSec: 300, routeKey: "setup-tiktok" });
  if (guard) return guard;

  const report: SetupReport[] = [];

  // ─── 1. Migration Supabase ───────────────────────────────
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      report.push({ step: "supabase.migration", ok: false, detail: "credentials Supabase manquants" });
    } else {
      const supabase = createClient(supabaseUrl, serviceKey);
      // Test si la table existe : si oui, skip. Sinon, on demande à Tom de
      // l'exécuter manuellement (Supabase REST API ne permet pas DDL via PostgREST).
      const probe = await supabase.from("mockup_videos").select("id").limit(1);
      if (probe.error && /relation .* does not exist|schema cache/i.test(probe.error.message)) {
        report.push({
          step: "supabase.migration",
          ok: false,
          detail: "⚠️ Table mockup_videos n'existe pas. Va dans Supabase > SQL editor et exécute le contenu de sql/2026_06_06_mockup_videos.sql (60s)",
        });
      } else {
        report.push({ step: "supabase.migration", ok: true, detail: "Table mockup_videos OK" });
      }
    }
  } catch (err) {
    report.push({ step: "supabase.migration", ok: false, detail: err instanceof Error ? err.message : "unknown" });
  }

  // ─── 2. Import workflow N8N ──────────────────────────────
  let workflowId: string | null = null;
  try {
    if (!process.env.N8N_API_KEY) {
      report.push({ step: "n8n.import", ok: false, detail: "N8N_API_KEY manquante sur Vercel" });
    } else {
      // Idempotence : si déjà importé, on récupère l'id existant
      const existing = await findWorkflowByName(WORKFLOW_NAME);
      if (existing) {
        workflowId = existing.id;
        report.push({ step: "n8n.import", ok: true, detail: `Workflow déjà importé (id ${existing.id}, actif: ${existing.active})` });
      } else {
        // Charger le JSON depuis le repo (déployé en read-only sur Vercel)
        const jsonPath = path.join(process.cwd(), "n8n-workflows", "07_tiktok_video_generation.json");
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

  // ─── 3. Activer workflow ─────────────────────────────────
  if (workflowId) {
    try {
      const act = await activateWorkflow(workflowId);
      report.push({ step: "n8n.activate", ok: act.ok, detail: act.error || `Workflow ${workflowId} activé` });
    } catch (err) {
      report.push({ step: "n8n.activate", ok: false, detail: err instanceof Error ? err.message : "unknown" });
    }
  }

  // ─── 4. Health-check short-video-maker ────────────────────
  try {
    const svmUrl = process.env.SHORT_VIDEO_MAKER_URL;
    if (!svmUrl) {
      report.push({
        step: "svm.health",
        ok: false,
        detail: "⚠️ SHORT_VIDEO_MAKER_URL non configurée — déployer le service Railway et set la var sur Vercel. Voir docs/TIKTOK_VIDEO_DEPLOY.md",
      });
    } else {
      const ping = await safeFetch(`${svmUrl}/api/voices`, { timeoutMs: 5000 }).catch(() => null);
      if (!ping || !ping.ok) {
        report.push({ step: "svm.health", ok: false, detail: `${svmUrl} ne répond pas (vérifier Railway logs)` });
      } else {
        report.push({ step: "svm.health", ok: true, detail: `${svmUrl} répond OK` });
      }
    }
  } catch (err) {
    report.push({ step: "svm.health", ok: false, detail: err instanceof Error ? err.message : "unknown" });
  }

  // ─── 5. Notif Telegram ────────────────────────────────────
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId) {
    const lines = report.map((r) => `${r.ok ? "✅" : "❌"} <b>${r.step}</b> — ${r.detail || ""}`);
    const summary = `🛠️ <b>Setup pipeline TikTok</b>\n\n${lines.join("\n")}`;
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: summary, parse_mode: "HTML", disable_web_page_preview: true }),
    }).catch(() => { /* silent */ });
  }

  const allOk = report.every((r) => r.ok);
  return NextResponse.json({
    ok: allOk,
    report,
    next_steps: allOk
      ? ["Vidéos générées auto à 8h, 14h, 18h Paris", "Tu reçois lien MP4 Telegram", "Upload TikTok manuel iPhone aux heures de prime"]
      : report.filter((r) => !r.ok).map((r) => `Fix : ${r.step} — ${r.detail}`),
  });
}

export async function GET(req: NextRequest) { return POST(req); }
