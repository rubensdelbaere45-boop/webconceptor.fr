/**
 * POST /api/admin/auto-qa-bootstrap
 *
 * Bootstrap tout-en-un pour rattraper le bug "Hero moderne avec photos
 * existantes + nom + ville" en automatisé :
 *
 *   1. Importe + active le workflow N8N "16 — QA Recheck quotidien"
 *      (cron 4h30 Paris tous les jours)
 *   2. Lance IMMÉDIATEMENT 1 qa-recheck-all en dry-run pour voir le dégât
 *   3. Lance IMMÉDIATEMENT 1 qa-recheck-all en apply pour marquer error
 *   4. Notif Telegram avec rapport
 *
 * → 1 seul appel, tout est fait. Tom n'a plus rien à exécuter.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminGuard } from "@/lib/security";
import { createWorkflow, findWorkflowByName, activateWorkflow } from "@/lib/n8n-client";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const WF_NAME = "16 — QA Recheck rétroactif quotidien (4h30 Paris)";

export async function POST(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 1, windowSec: 60, routeKey: "auto-qa-bootstrap" });
  if (guard) return guard;

  const report: Array<{ step: string; ok: boolean; detail?: string }> = [];

  // 1) Import + activate workflow N8N
  try {
    if (!process.env.N8N_API_KEY) {
      report.push({ step: "n8n.import", ok: false, detail: "N8N_API_KEY manquante" });
    } else {
      const existing = await findWorkflowByName(WF_NAME);
      let id: string | undefined = existing?.id;
      if (!id) {
        const raw = await readFile(path.join(process.cwd(), "n8n-workflows", "16_qa_recheck_daily.json"), "utf-8");
        const created = await createWorkflow(JSON.parse(raw));
        id = created.id;
        report.push({ step: "n8n.import", ok: !!id, detail: id ? `Créé id ${id}` : created.error });
      } else {
        report.push({ step: "n8n.import", ok: true, detail: `Déjà importé id ${id}` });
      }
      if (id) {
        const act = await activateWorkflow(id);
        report.push({ step: "n8n.activate", ok: act.ok, detail: act.error || `Cron 4h30 Paris activé` });
      }
    }
  } catch (e) {
    report.push({ step: "n8n", ok: false, detail: e instanceof Error ? e.message : "unknown" });
  }

  // 2) Lance qa-recheck-all en DRY-RUN pour voir
  const origin = req.nextUrl.origin;
  let dryRunResult: Record<string, unknown> = {};
  try {
    const res = await fetch(`${origin}/api/admin/qa-recheck-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": process.env.ADMIN_SECRET_KEY || "" },
      body: JSON.stringify({ dry_run: true, include_sent: true, limit: 1000 }),
      signal: AbortSignal.timeout(180_000),
    });
    dryRunResult = await res.json().catch(() => ({}));
    report.push({
      step: "qa-recheck dry-run",
      ok: !!dryRunResult.success,
      detail: `${dryRunResult.processed || 0} maquettes scannées, ${dryRunResult.newly_rejected || 0} à rejeter`,
    });
  } catch (e) {
    report.push({ step: "qa-recheck dry-run", ok: false, detail: e instanceof Error ? e.message : "unknown" });
  }

  // 3) Lance qa-recheck-all en APPLY (effectif)
  let applyResult: Record<string, unknown> = {};
  try {
    const res = await fetch(`${origin}/api/admin/qa-recheck-all`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": process.env.ADMIN_SECRET_KEY || "" },
      body: JSON.stringify({ dry_run: false, include_sent: true, limit: 1000 }),
      signal: AbortSignal.timeout(180_000),
    });
    applyResult = await res.json().catch(() => ({}));
    report.push({
      step: "qa-recheck apply",
      ok: !!applyResult.success,
      detail: `${applyResult.newly_rejected || 0} maquettes marquées en status=error, ${applyResult.still_passing || 0} OK conservées`,
    });
  } catch (e) {
    report.push({ step: "qa-recheck apply", ok: false, detail: e instanceof Error ? e.message : "unknown" });
  }

  // 4) Notif Telegram
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat) {
    const lines = report.map(r => `${r.ok ? "✅" : "❌"} <b>${r.step}</b> — ${r.detail || ""}`);
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: `🛡️ <b>Auto QA Bootstrap exécuté</b>\n\n${lines.join("\n")}\n\n` +
              `📅 Cron quotidien actif (4h30 Paris) — rattrape les maquettes pourries automatiquement chaque nuit.\n` +
              `🌙 Régénération nocturne 20h-5h reprendra les maquettes en error.`,
        parse_mode: "HTML",
      }),
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: report.every(r => r.ok),
    report,
    dry_run_summary: dryRunResult,
    apply_summary: applyResult,
    next_step: "Tout est en place. Le cron N8N 4h30 quotidien refera le check chaque nuit. Tu n'as plus rien à exécuter.",
  });
}

export async function GET(req: NextRequest) { return POST(req); }
