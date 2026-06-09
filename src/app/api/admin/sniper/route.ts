/**
 * POST /api/admin/sniper — Agent 2 de la Fleet
 *
 * Mission : envoyer un email ULTRA-COURT et ULTRA-PERSONNALISÉ aux
 * prospects qui ont :
 *   - status='ready'
 *   - qa_passed=true (passé le Gatekeeper)
 *   - sales_angle ≠ NULL (profilés par l'Agent 1)
 *   - sniper_sent_at IS NULL (pas encore envoyé)
 *
 * L'email utilise le custom_hook comme accroche personnalisée, puis
 * pointe vers la maquette + propose le tarif MRR.
 *
 * Cadence : 40/run, couvre-feu 5h-19h.
 * Volume cible : 200/jour cumulé avec les autres workflows.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, isWithinSendingHours, requireAdminGuard } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 180;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

interface Prospect {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  city: string | null;
  custom_hook: string | null;
  sales_angle: string | null;
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildSniperEmail(p: Prospect): { subject: string; html: string; text: string } {
  const firstName = p.name.split(/[ -]/)[0];
  const hook = p.custom_hook || `Un site pro pour ${p.name}, livré en 5 jours.`;
  const mockupUrl = `https://webconceptor.fr/prospects/${p.slug}`;

  // Subject : on cherche un truc qui se démarque dans l'inbox
  const subjectByAngle: Record<string, string> = {
    no_website:           `${firstName}, vos clients vous cherchent sur Google`,
    low_rating:           `${firstName}, votre note Google vous coûte des appels`,
    restaurant_qr:        `${firstName}, un menu QR + un site = +30% de réservations`,
    artisan_devis:        `${firstName}, un devis 24/7 sans vous déranger`,
    new_business:         `${firstName}, vous venez de créer — voici comment vous faire connaître vite`,
    status_upgrade:       `${firstName}, votre passage en société mérite une vitrine en ligne pro`,
    young_business:       `${firstName}, vos premiers clients arrivent par Google maintenant`,
    mature_business:      `${firstName}, transformer le bouche-à-oreille en clics Google`,
    established_business: `${firstName}, votre expérience mérite une vitrine en ligne`,
    historic_business:    `${firstName}, votre histoire mérite d'être valorisée en ligne`,
    generic:              `${firstName}, votre site pro en 5 jours`,
  };
  const subject = subjectByAngle[p.sales_angle || "generic"] || subjectByAngle.generic;

  const text = `${hook}

J'ai préparé une maquette de votre futur site, gratuite et sans engagement :
${mockupUrl}

Si elle vous plaît : 320 € one-shot ou 0 € + 17,90 €/mois (193 €/an = 16,11 €/mois si annuel).

Un mot et je vous appelle.
Tom — 06 35 59 24 71`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:540px;margin:0 auto;padding:18px;color:#1a1a1a;font-size:15px;line-height:1.55">

<p style="font-size:15.5px">${escapeHtml(hook)}</p>

<p>J'ai préparé une maquette de votre futur site, gratuite et sans engagement :</p>

<p style="text-align:center;margin:18px 0">
<a href="${mockupUrl}" style="display:inline-block;padding:13px 26px;background:#0a0a0a;color:#FFD700;text-decoration:none;font-weight:800;border-radius:100px;letter-spacing:0.06em;text-transform:uppercase;font-size:13px">Voir ma maquette →</a>
</p>

<p style="font-size:14px">Si elle vous plaît : <strong>320 € one-shot</strong> ou <strong>0 € + 17,90 €/mois</strong> (193 €/an = 16,11 €/mois si annuel).</p>

<p style="font-size:14px">Un mot et je vous appelle.</p>

<p style="margin-top:18px">Tom — <strong>06 35 59 24 71</strong></p>

</body></html>`;

  return { subject, html, text };
}

async function sendBrevoEmail(to: string, name: string, subject: string, html: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, error: "BREVO_API_KEY manquante" };
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Tom — WebConceptor", email: "tom@webconceptor.fr" },
        replyTo: { name: "Tom", email: "tom@webconceptor.fr" },
        to: [{ email: to, name }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, error: `Brevo HTTP ${res.status}: ${t.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  }
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const adminOK = safeCompare(adminKey, process.env.ADMIN_SECRET_KEY);
  const cronOK = safeCompare(cronSecret, process.env.CRON_SECRET);
  if (!adminOK && !cronOK) {
    const guard = requireAdminGuard(req, { limit: 20, windowSec: 60, routeKey: "sniper" });
    if (guard) return guard;
  }

  if (!isWithinSendingHours(5, 19)) {
    return NextResponse.json({ success: true, processed: 0, skipped_curfew: true });
  }

  const supabase = db();

  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, name, slug, email, city, custom_hook, sales_angle")
    .eq("status", "ready")
    .eq("qa_passed", true)
    .not("custom_hook", "is", null)
    .is("sniper_sent_at", null)
    .not("email", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun lead à sniper" });
  }

  let sent = 0, errors = 0;

  for (const p of prospects) {
    if (!p.email) continue;
    const { subject, html, text } = buildSniperEmail(p as Prospect);
    const r = await sendBrevoEmail(p.email, p.name, subject, html, text);
    if (r.ok) sent++; else errors++;
    await supabase.from("prospects").update({
      sniper_sent_at: new Date().toISOString(),
      status: r.ok ? "sent" : "send_failed",
    }).eq("id", p.id);
    await new Promise(r => setTimeout(r, 300));
  }

  // Telegram récap
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat && sent > 0) {
    const msg = `🎯 <b>Sniper — emails ultra-personnalisés</b>\n\n✅ Envoyés : ${sent}\n❌ Erreurs : ${errors}`;
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: msg, parse_mode: "HTML", disable_notification: true }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, processed: prospects.length, sent, errors });
}

export async function GET(req: NextRequest) { return POST(req); }
