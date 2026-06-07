/**
 * POST /api/admin/setup-archeologue
 *
 * Setup tout-en-un :
 *   - Import + active workflow 19 (analyse obsolescence 2h Paris)
 *   - Import + active workflow 20 (blast 11h/16h Lun-Ven)
 *   - Lance 1 premier scan obsolescence immédiat (30 prospects)
 *   - Telegram récap
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminGuard } from "@/lib/security";
import { createWorkflow, findWorkflowByName, activateWorkflow } from "@/lib/n8n-client";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const FLOW_NAMES = [
  { name: "19 — L'Archéologue (analyse obsolescence) 2h Paris quotidien", file: "19_archeologue_2h.json" },
  { name: "20 — Outdated Blast (Rénovateur + Archéologue) 11h/16h Lun-Ven", file: "20_outdated_blast.json" },
];

export async function POST(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 2, windowSec: 60, routeKey: "setup-archeo" });
  if (guard) return guard;

  const report: Array<{ step: string; ok: boolean; detail?: string }> = [];

  if (!process.env.N8N_API_KEY) {
    report.push({ step: "n8n.key", ok: false, detail: "N8N_API_KEY manquante" });
  } else {
    for (const wf of FLOW_NAMES) {
      try {
        const existing = await findWorkflowByName(wf.name);
        let id: string | undefined = existing?.id;
        if (!id) {
          const raw = await readFile(path.join(process.cwd(), "n8n-workflows", wf.file), "utf-8");
          const created = await createWorkflow(JSON.parse(raw));
          id = created.id;
        }
        if (id) {
          const act = await activateWorkflow(id);
          report.push({ step: `n8n.${wf.file}`, ok: act.ok, detail: act.error || `id ${id} activé` });
        } else {
          report.push({ step: `n8n.${wf.file}`, ok: false, detail: "création échouée" });
        }
      } catch (e) {
        report.push({ step: `n8n.${wf.file}`, ok: false, detail: e instanceof Error ? e.message : "unknown" });
      }
    }
  }

  // 1er scan immédiat
  try {
    const origin = req.nextUrl.origin;
    const res = await fetch(`${origin}/api/admin/analyze-outdated`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": process.env.ADMIN_SECRET_KEY || "" },
      body: JSON.stringify({ limit: 30 }),
      signal: AbortSignal.timeout(270_000),
    });
    const data = await res.json().catch(() => ({}));
    report.push({
      step: "first_scan",
      ok: !!data.success,
      detail: data.success
        ? `analyzed: ${data.analyzed}, outdated: ${data.outdated}, pre_2015: ${data.pre_2015}, emails: ${data.emails_extracted}`
        : (data.error || "échec"),
    });
  } catch (e) {
    report.push({ step: "first_scan", ok: false, detail: e instanceof Error ? e.message : "unknown" });
  }

  // Telegram
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat) {
    const lines = report.map(r => `${r.ok ? "✅" : "❌"} <b>${r.step}</b> — ${r.detail || ""}`);
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: `🦕 <b>Setup Rénovateur + Archéologue</b>\n\n${lines.join("\n")}`, parse_mode: "HTML" }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: report.every(r => r.ok), report });
}

export async function GET(req: NextRequest) { return POST(req); }
