/**
 * POST /api/admin/analyze-outdated
 *
 * Scanne les prospects qui ont un website mais pas encore d'analyse
 * d'obsolescence. Pour chacun :
 *   - Récupère le HTML (via safeFetch direct, ou Scrapling si configuré)
 *   - Lance analyzeSiteForObsolescence()
 *   - Stocke is_outdated, is_pre_2015, obsolete_score, obsolete_signals
 *   - Si email extrait du vieux site → met à jour email_scraped
 *
 * Cadence : 30 sites/run, concurrence 4. Cron 2h Paris (nuit, avant la
 * génération des maquettes 20h-5h).
 *
 * Auth : x-admin-key OU x-cron-secret
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, requireAdminGuard } from "@/lib/security";
import { analyzeSiteForObsolescence } from "@/lib/site-archeology";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY) && !safeCompare(cronSecret, process.env.CRON_SECRET)) {
    const guard = requireAdminGuard(req, { limit: 6, windowSec: 60, routeKey: "analyze-outdated" });
    if (guard) return guard;
  }

  let body: { limit?: number; force_recheck?: boolean } = {};
  try { body = await req.json(); } catch { /* opt */ }
  const limit = Math.min(50, Math.max(1, body.limit || 30));

  const supabase = db();

  // Cible : prospects avec website non vide ET (obsolete_score IS NULL OU force_recheck)
  let query = supabase
    .from("prospects")
    .select("id, name, slug, website, email")
    .not("website", "is", null)
    .neq("website", "")
    .limit(limit);

  if (!body.force_recheck) {
    query = query.is("obsolete_score", null);
  }

  const { data: prospects, error } = await query.order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun site à analyser" });
  }

  let analyzed = 0;
  let outdated = 0;
  let pre2015 = 0;
  let emailsExtracted = 0;
  const sample: Array<{ name: string; url: string; score: number; pre_2015: boolean }> = [];

  const CONC = 4;
  const queue = [...prospects];
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (queue.length > 0) {
      const p = queue.shift();
      if (!p?.website) continue;
      try {
        const url = p.website.startsWith("http") ? p.website : `http://${p.website}`;
        const r = await analyzeSiteForObsolescence(url);

        const updates: Record<string, unknown> = {
          is_outdated: r.is_outdated,
          is_pre_2015: r.is_pre_2015,
          obsolete_score: r.obsolete_score,
          obsolete_signals: r.signals,
          obsolete_checked_at: new Date().toISOString(),
        };
        if (r.extracted_email && !p.email) {
          updates.email = r.extracted_email;
          emailsExtracted++;
        }
        // Si pré-2015 ou outdated → tag automatique sales_angle (priorité forte)
        if (r.is_pre_2015) {
          updates.sales_angle = "site_pre_2015";
        } else if (r.is_outdated) {
          updates.sales_angle = "site_outdated";
        }

        await supabase.from("prospects").update(updates).eq("id", p.id);

        analyzed++;
        if (r.is_outdated) outdated++;
        if (r.is_pre_2015) pre2015++;
        if (sample.length < 10 && r.obsolete_score >= 30) {
          sample.push({ name: p.name, url, score: r.obsolete_score, pre_2015: r.is_pre_2015 });
        }
      } catch { /* skip */ }
    }
  }));

  // Notif Telegram
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat && analyzed > 0) {
    const msg =
      `🦕 <b>Archéologue/Rénovateur — analyse obsolescence</b>\n\n` +
      `🔍 Analysés : <b>${analyzed}</b>\n` +
      `⚠️ Outdated (score ≥ 35) : <b>${outdated}</b>\n` +
      `🦕 Pré-2015 (dinosaures) : <b>${pre2015}</b>\n` +
      `📧 Emails extraits : <b>${emailsExtracted}</b>\n\n` +
      (sample.length > 0 ? `<b>Top 5 sites obsolètes :</b>\n${sample.slice(0, 5).map(s => `• ${s.name} — score ${s.score}${s.pre_2015 ? " 🦕" : ""}`).join("\n")}` : "");
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: msg, parse_mode: "HTML" }),
    }).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    analyzed,
    outdated,
    pre_2015: pre2015,
    emails_extracted: emailsExtracted,
    sample,
  });
}

export async function GET(req: NextRequest) { return POST(req); }
