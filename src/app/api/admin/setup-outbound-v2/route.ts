/**
 * POST /api/admin/setup-outbound-v2
 *
 * Setup tout-en-un pour la mission Outbound V2 :
 *   1. Vérifie colonnes prospects (closer_sent_at, distress_*)
 *   2. Importe + active workflow N8N "09 — Closer leads chauds"
 *   3. Importe + active workflow N8N "10 — Signaux de détresse"
 *   4. Notif Telegram avec rapport
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminGuard } from "@/lib/security";
import { createWorkflow, findWorkflowByName, activateWorkflow } from "@/lib/n8n-client";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const WF_CLOSER = "09 — Closer les leads chauds (status=opened) 3x/jour";
const WF_DISTRESS = "10 — Signaux de détresse (pas de site OU note < 3.8) 2x/jour";

interface SetupReport { step: string; ok: boolean; detail?: string; }

async function importAndActivate(name: string, jsonFile: string, report: SetupReport[]) {
  try {
    const existing = await findWorkflowByName(name);
    let id = existing?.id;
    if (!id) {
      const raw = await readFile(path.join(process.cwd(), "n8n-workflows", jsonFile), "utf-8");
      const wf = JSON.parse(raw);
      const created = await createWorkflow(wf);
      if (!created.ok || !created.id) {
        report.push({ step: `n8n.import.${jsonFile}`, ok: false, detail: created.error });
        return;
      }
      id = created.id;
      report.push({ step: `n8n.import.${jsonFile}`, ok: true, detail: `Créé id ${id}` });
    } else {
      report.push({ step: `n8n.import.${jsonFile}`, ok: true, detail: `Déjà importé id ${id}` });
    }
    const act = await activateWorkflow(id);
    report.push({ step: `n8n.activate.${jsonFile}`, ok: act.ok, detail: act.error || `activé` });
  } catch (e) {
    report.push({ step: `n8n.${jsonFile}`, ok: false, detail: e instanceof Error ? e.message : "unknown" });
  }
}

export async function POST(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 1, windowSec: 300, routeKey: "setup-outbound-v2" });
  if (guard) return guard;

  const report: SetupReport[] = [];

  // 1) Vérifier colonnes
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");
    const probe = await supabase.from("prospects").select("closer_sent_at,distress_email_sent_at,distress_segment").limit(1);
    if (probe.error && /column .* does not exist/i.test(probe.error.message)) {
      report.push({
        step: "supabase.columns",
        ok: false,
        detail: "⚠️ Colonnes outbound V2 absentes. Exécute sql/2026_06_06_outbound_v2.sql dans Supabase SQL editor.",
      });
    } else {
      report.push({ step: "supabase.columns", ok: true, detail: "Colonnes outbound V2 présentes" });
    }
  } catch (e) {
    report.push({ step: "supabase.columns", ok: false, detail: e instanceof Error ? e.message : "unknown" });
  }

  if (!process.env.N8N_API_KEY) {
    report.push({ step: "n8n", ok: false, detail: "N8N_API_KEY manquante" });
  } else {
    await importAndActivate(WF_CLOSER, "09_closer_leads_chauds.json", report);
    await importAndActivate(WF_DISTRESS, "10_signaux_detresse.json", report);
  }

  if (!process.env.BREVO_API_KEY) {
    report.push({ step: "brevo", ok: false, detail: "BREVO_API_KEY manquante" });
  } else {
    report.push({ step: "brevo", ok: true, detail: "Brevo OK" });
  }

  // Notif Telegram
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat) {
    const lines = report.map(r => `${r.ok ? "✅" : "❌"} <b>${r.step}</b> — ${r.detail || ""}`);
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: `🚀 <b>Setup outbound V2</b>\n\n${lines.join("\n")}`, parse_mode: "HTML" }),
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: report.every(r => r.ok),
    report,
    cadence_total: "200 emails ultra-ciblés / jour (50×3 closer + 50×2 detress A + 50×2 detress B)",
  });
}

export async function GET(req: NextRequest) { return POST(req); }
