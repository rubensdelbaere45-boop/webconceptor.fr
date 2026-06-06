/**
 * POST /api/admin/qa-gatekeeper
 *
 * Filtre de perfection — passe au crible les maquettes status='ready'
 * qui n'ont pas encore été QA-validées.
 *
 * Pour chaque prospect :
 *   - Charge mockup_html
 *   - Lance strictGatekeeper(html, prospect)
 *   - Si pass : marque qa_passed=true (la maquette peut partir)
 *   - Si fail : marque status='error' + qa_issues=[...] (BLOQUÉE)
 *
 * ⚠️ Ne MODIFIE PAS le HTML (règle Tom : pas toucher au design).
 * Juste JUGE et marque pass/fail.
 *
 * Cadence : 50 prospects/run max. N8N appelle plusieurs fois la nuit
 * juste après la génération.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminGuard, safeCompare } from "@/lib/security";
import { strictGatekeeper } from "@/lib/mockup-qa";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(req: NextRequest) {
  // Accepte x-admin-key OU x-cron-secret (pour N8N)
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const adminOK = safeCompare(adminKey, process.env.ADMIN_SECRET_KEY);
  const cronOK = safeCompare(cronSecret, process.env.CRON_SECRET);
  if (!adminOK && !cronOK) {
    const guard = requireAdminGuard(req, { limit: 20, windowSec: 60, routeKey: "qa" });
    if (guard) return guard;
  }

  const supabase = db();

  // Cible : maquettes status='ready' avec qa_passed = NULL (jamais analysées)
  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, name, slug, city, business_type, google_rating, phone, mockup_html, status")
    .eq("status", "ready")
    .is("qa_passed", null)
    .not("mockup_html", "is", null)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucune maquette à QA" });
  }

  let passed = 0, rejected = 0;
  const results: Array<{ id: string; name: string; pass: boolean; issues?: string[] }> = [];

  for (const p of prospects) {
    if (!p.mockup_html) continue;
    const r = strictGatekeeper(p.mockup_html, {
      name: p.name,
      city: p.city || undefined,
      business_type: p.business_type || undefined,
      phone: p.phone || undefined,
      google_rating: p.google_rating || undefined,
    });

    if (r.pass) {
      await supabase.from("prospects").update({
        qa_passed: true,
        qa_issues: r.warnings,
        qa_checked_at: new Date().toISOString(),
      }).eq("id", p.id);
      passed++;
      results.push({ id: p.id, name: p.name, pass: true });
    } else {
      // REJET : status passe à "error", maquette ne part PAS
      await supabase.from("prospects").update({
        status: "error",
        qa_passed: false,
        qa_issues: r.blocking_issues,
        qa_checked_at: new Date().toISOString(),
      }).eq("id", p.id);
      rejected++;
      results.push({ id: p.id, name: p.name, pass: false, issues: r.blocking_issues });
    }
  }

  // Telegram récap si rejets
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat && rejected > 0) {
    const failedList = results.filter((r) => !r.pass).slice(0, 5).map((r) => `• ${r.name} : ${(r.issues || []).slice(0, 2).join(" / ")}`).join("\n");
    const msg = `🛡️ <b>QA Gatekeeper</b>\n\n✅ Validées : ${passed}\n❌ Rejetées : ${rejected}\n\n${failedList}`;
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: msg, parse_mode: "HTML", disable_notification: true }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, processed: prospects.length, passed, rejected, results });
}

export async function GET(req: NextRequest) { return POST(req); }
