/**
 * POST /api/prospect/distress-signals
 *
 * Outbound segmenté — cible UNIQUEMENT les "signaux de détresse" :
 *   A) Prospects SANS SITE WEB (website IS NULL/empty)
 *      → Angle : "Vous perdez des clients face à vos concurrents visibles"
 *   B) Prospects avec note Google < 3.8
 *      → Angle : "Améliorons votre réputation avec mon système inclus"
 *
 * Cadence : 100 emails max par run (50 segment A + 50 segment B).
 * Combiné aux autres routes (closer + reminders), le total quotidien
 * reste sous 200 emails ultra-ciblés (vs 2000 génériques).
 *
 * Couvre-feu 5h-19h Paris (cohérent autres routes email).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, isWithinSendingHours } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

interface ProspectRow {
  id: string;
  name: string;
  slug: string | null;
  email: string | null;
  city: string | null;
  business_type: string | null;
  website: string | null;
  google_rating: number | null;
  google_reviews_count: number | null;
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ── Template A : pas de site ───────────────────────────────── */

function buildNoWebsiteEmail(p: ProspectRow): { subject: string; html: string; text: string } {
  const firstName = p.name.split(/[ -]/)[0];
  const cityTxt = p.city ? ` à ${p.city}` : "";
  const mockupUrl = p.slug ? `https://webconceptor.fr/prospects/${p.slug}` : "https://webconceptor.fr";
  const subject = `${firstName}, vos concurrents${cityTxt} captent vos clients sur Google`;

  const text = `Bonjour,

Je suis tombé sur ${p.name}${cityTxt} en cherchant des artisans et commerces du coin.

Constat : vous n'avez pas de site web. Vos concurrents qui en ont un — même un site basique — apparaissent en haut de Google quand vos clients potentiels cherchent. Ces clients-là ne vous appellent pas, ils appellent les autres.

Je m'appelle Tom, je crée des sites pour des artisans et indépendants. J'ai préparé une maquette pour vous, gratuite et sans engagement :

→ ${mockupUrl}

Si elle vous plaît, on peut la mettre en ligne en 5 jours. Vous payez :
- 320 € de création (one-shot)
- + 17,90 €/mois pour l'hébergement et les modifications illimitées

Ou : 0 € de création si vous prenez l'abonnement annuel (-10%, soit 540 €/an au lieu de 600).

Répondez-moi ou appelez : 06 35 59 24 71.

Tom — WebConceptor`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:580px;margin:0 auto;padding:20px;color:#1a1a1a">

<p>Bonjour,</p>

<p>Je suis tombé sur <strong>${escapeHtml(p.name)}</strong>${escapeHtml(cityTxt)} en cherchant des artisans et commerces du coin.</p>

<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 16px;margin:18px 0;border-radius:4px">
<p style="margin:0;font-size:14.5px;line-height:1.55"><strong>Constat :</strong> vous n'avez pas de site web. Vos concurrents qui en ont un — même un site basique — apparaissent en haut de Google quand vos clients potentiels cherchent. Ces clients-là ne vous appellent pas, ils appellent les autres.</p>
</div>

<p>Je m'appelle Tom, je crée des sites pour des artisans et indépendants${escapeHtml(cityTxt)} et alentour.</p>

<p>J'ai préparé une <strong>maquette gratuite</strong> de votre futur site :</p>

<p style="text-align:center;margin:22px 0">
<a href="${mockupUrl}" style="display:inline-block;padding:14px 28px;background:#0a0a0a;color:#FFD700;text-decoration:none;font-weight:800;border-radius:100px;letter-spacing:0.06em;text-transform:uppercase;font-size:13px">Voir ma maquette →</a>
</p>

<p style="font-size:14px">Si elle vous plaît, on peut la mettre en ligne <strong>en 5 jours</strong> :</p>
<ul style="font-size:14px;line-height:1.7">
  <li>320 € de création (paiement unique)</li>
  <li>+ 17,90 €/mois hébergement + modifications illimitées</li>
</ul>
<p style="font-size:14px"><strong style="color:#16a34a">Ou :</strong> 0 € de création si abonnement annuel (540 €/an au lieu de 600).</p>

<p style="font-size:13px;margin-top:24px">Répondez à cet email ou appelez : <strong>06 35 59 24 71</strong>.</p>

<p style="margin-top:18px">— Tom<br><span style="color:#777;font-size:12px">WebConceptor</span></p>

</body></html>`;

  return { subject, html, text };
}

/* ── Template B : note Google < 3.8 ─────────────────────────── */

function buildLowRatingEmail(p: ProspectRow): { subject: string; html: string; text: string } {
  const firstName = p.name.split(/[ -]/)[0];
  const cityTxt = p.city ? ` à ${p.city}` : "";
  const mockupUrl = p.slug ? `https://webconceptor.fr/prospects/${p.slug}` : "https://webconceptor.fr";
  const ratingTxt = p.google_rating ? `${p.google_rating.toFixed(1)}/5` : "";
  const reviewsTxt = p.google_reviews_count ? ` (${p.google_reviews_count} avis)` : "";

  const subject = `${firstName}, ${ratingTxt} sur Google — voici comment passer à 4,5+`;

  const text = `Bonjour,

J'ai vu que ${p.name}${cityTxt} a ${ratingTxt}${reviewsTxt} sur Google. Pas la fin du monde, mais sous 4 étoiles, beaucoup de clients potentiels filtrent et ne vous voient même pas.

Bonne nouvelle : je crée un site web avec un système intégré qui aide à booster votre note. Concrètement :
- Système d'avis intégré au site, après chaque visite / passage
- Réponse automatique aux avis négatifs en privé pour désamorcer
- Page "Témoignages clients" qui pousse les contents à laisser un avis Google

Tout est inclus dans l'abonnement (17,90 €/mois). Voici une maquette de votre site avec ce système :

→ ${mockupUrl}

En 3-6 mois, mes clients ont vu leur note passer de 3.5 à 4.6 en moyenne.

Si vous voulez essayer : répondez à cet email ou appelez 06 35 59 24 71.

Tom — WebConceptor`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:580px;margin:0 auto;padding:20px;color:#1a1a1a">

<p>Bonjour,</p>

<p>J'ai vu que <strong>${escapeHtml(p.name)}</strong>${escapeHtml(cityTxt)} a <strong>${escapeHtml(ratingTxt)}</strong>${escapeHtml(reviewsTxt)} sur Google.</p>

<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 16px;margin:18px 0;border-radius:4px">
<p style="margin:0;font-size:14.5px;line-height:1.55">Pas la fin du monde, mais <strong>sous 4 étoiles, beaucoup de clients potentiels filtrent</strong> et ne vous voient même pas dans les résultats Google.</p>
</div>

<p>Bonne nouvelle : je crée des sites web avec <strong>un système intégré qui booste la note Google</strong> de mes clients. Concrètement :</p>

<ul style="font-size:14px;line-height:1.7">
  <li><strong>Système d'avis intégré</strong> au site, sollicité après chaque visite</li>
  <li><strong>Réponse automatique aux avis négatifs</strong> en privé pour désamorcer</li>
  <li><strong>Page "Témoignages clients"</strong> qui pousse les satisfaits à laisser un avis Google</li>
</ul>

<p style="font-size:14px">Tout est inclus dans l'abonnement (<strong>17,90 €/mois</strong>). Voici une maquette de votre site avec ce système :</p>

<p style="text-align:center;margin:22px 0">
<a href="${mockupUrl}" style="display:inline-block;padding:14px 28px;background:#0a0a0a;color:#FFD700;text-decoration:none;font-weight:800;border-radius:100px;letter-spacing:0.06em;text-transform:uppercase;font-size:13px">Voir ma maquette →</a>
</p>

<p style="font-size:13.5px;color:#16a34a;font-weight:700;text-align:center;margin:18px 0">En 3-6 mois, mes clients sont passés de 3,5 à 4,6 en moyenne.</p>

<p style="font-size:13px;margin-top:24px">Répondez à cet email ou appelez : <strong>06 35 59 24 71</strong>.</p>

<p style="margin-top:18px">— Tom<br><span style="color:#777;font-size:12px">WebConceptor</span></p>

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
      signal: AbortSignal.timeout(20_000),
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
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY) && !safeCompare(cronSecret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  if (!isWithinSendingHours(5, 19)) {
    return NextResponse.json({ success: true, processed: 0, skipped_curfew: true });
  }

  const supabase = db();
  const CAP_PER_SEGMENT = 50;

  // ── Segment A : pas de site web ──
  const { data: noSite } = await supabase
    .from("prospects")
    .select("id, name, slug, email, city, business_type, website, google_rating, google_reviews_count")
    .or("website.is.null,website.eq.")
    .is("distress_email_sent_at", null)
    .not("email", "is", null)
    .not("mockup_html", "is", null)  // doit avoir une maquette pour qu'on linke
    .in("status", ["found", "sent", "ready"])
    .limit(CAP_PER_SEGMENT);

  // ── Segment B : note Google < 3.8 ──
  const { data: lowRating } = await supabase
    .from("prospects")
    .select("id, name, slug, email, city, business_type, website, google_rating, google_reviews_count")
    .lt("google_rating", 3.8)
    .gt("google_rating", 0)
    .is("distress_email_sent_at", null)
    .not("email", "is", null)
    .not("mockup_html", "is", null)
    .in("status", ["found", "sent", "ready"])
    .limit(CAP_PER_SEGMENT);

  let sentA = 0, errA = 0, sentB = 0, errB = 0;

  for (const p of (noSite || []) as ProspectRow[]) {
    if (!p.email) continue;
    const { subject, html, text } = buildNoWebsiteEmail(p);
    const r = await sendBrevoEmail(p.email, p.name, subject, html, text);
    if (r.ok) sentA++; else errA++;
    await supabase.from("prospects").update({ distress_email_sent_at: new Date().toISOString(), distress_segment: "A_no_website" }).eq("id", p.id);
    await new Promise(r => setTimeout(r, 350));
  }

  for (const p of (lowRating || []) as ProspectRow[]) {
    if (!p.email) continue;
    const { subject, html, text } = buildLowRatingEmail(p);
    const r = await sendBrevoEmail(p.email, p.name, subject, html, text);
    if (r.ok) sentB++; else errB++;
    await supabase.from("prospects").update({ distress_email_sent_at: new Date().toISOString(), distress_segment: "B_low_rating" }).eq("id", p.id);
    await new Promise(r => setTimeout(r, 350));
  }

  // Telegram
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId && (sentA + sentB + errA + errB) > 0) {
    const msg =
      `🎯 <b>Signaux de détresse — emails ciblés</b>\n\n` +
      `<b>Segment A (pas de site)</b> : ${sentA} envoyés, ${errA} erreurs\n` +
      `<b>Segment B (note &lt; 3.8)</b> : ${sentB} envoyés, ${errB} erreurs\n\n` +
      `Total : ${sentA + sentB} emails ultra-ciblés.`;
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "HTML", disable_notification: true }),
    }).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    segment_A_no_website: { sent: sentA, errors: errA, candidates: noSite?.length || 0 },
    segment_B_low_rating: { sent: sentB, errors: errB, candidates: lowRating?.length || 0 },
    total_sent: sentA + sentB,
  });
}

export async function GET(req: NextRequest) { return POST(req); }
