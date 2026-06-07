/**
 * POST /api/admin/setup-intercepteur
 *
 * Importe + active le workflow N8N "18 — L'Intercepteur" (cron 6h Paris).
 * Lance aussi un 1er run immédiat pour rattraper les leads du jour.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminGuard } from "@/lib/security";
import { createWorkflow, findWorkflowByName, activateWorkflow } from "@/lib/n8n-client";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const WF_NAME = "18 — L'Intercepteur (Timing d'achat) 6h Paris";

export async function POST(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 2, windowSec: 60, routeKey: "setup-intercepteur" });
  if (guard) return guard;

  const report: Array<{ step: string; ok: boolean; detail?: string }> = [];

  // Import + activate
  try {
    if (!process.env.N8N_API_KEY) {
      report.push({ step: "n8n.key", ok: false, detail: "N8N_API_KEY manquante" });
    } else {
      const existing = await findWorkflowByName(WF_NAME);
      let id: string | undefined = existing?.id;
      if (!id) {
        const raw = await readFile(path.join(process.cwd(), "n8n-workflows", "18_intercepteur_6h.json"), "utf-8");
        const created = await createWorkflow(JSON.parse(raw));
        id = created.id;
        report.push({ step: "n8n.import", ok: !!id, detail: id ? `Créé id ${id}` : created.error });
      } else {
        report.push({ step: "n8n.import", ok: true, detail: `Déjà importé id ${id}` });
      }
      if (id) {
        const act = await activateWorkflow(id);
        report.push({ step: "n8n.activate", ok: act.ok, detail: act.error || `Activé (cron 6h Paris)` });
      }
    }
  } catch (e) {
    report.push({ step: "n8n", ok: false, detail: e instanceof Error ? e.message : "unknown" });
  }

  // Lance immédiatement 1 premier scan pour rattraper la journée
  try {
    const origin = req.nextUrl.origin;
    const res = await fetch(`${origin}/api/admin/intercepteur`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": process.env.ADMIN_SECRET_KEY || "" },
      body: JSON.stringify({ checkGoogle: true }),
      signal: AbortSignal.timeout(270_000),
    });
    const data = await res.json().catch(() => ({}));
    report.push({
      step: "intercepteur.first_run",
      ok: !!data.ok,
      detail: data.ok
        ? `🆕 nouveaux: ${data.scenario_A_new}, 📈 upgrades: ${data.scenario_B_status_upgrade}, inserted: ${data.inserted}`
        : (data.error || "échec"),
    });
  } catch (e) {
    report.push({ step: "intercepteur.first_run", ok: false, detail: e instanceof Error ? e.message : "unknown" });
  }

  // Telegram récap
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat) {
    const lines = report.map(r => `${r.ok ? "✅" : "❌"} <b>${r.step}</b> — ${r.detail || ""}`);
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: `🦅 <b>Setup L'Intercepteur</b>\n\n${lines.join("\n")}`, parse_mode: "HTML" }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: report.every(r => r.ok), report });
}

export async function GET(req: NextRequest) { return POST(req); }
