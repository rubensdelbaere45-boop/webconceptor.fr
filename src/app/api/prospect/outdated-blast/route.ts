/**
 * POST /api/prospect/outdated-blast
 *
 * Envoie le template "Rénovateur" (sites_outdated) ou "Archéologue"
 * (sites pre_2015) à des prospects QUALIFIÉS avec maquette ready.
 *
 * Conditions :
 *   - sales_angle IN ('site_outdated', 'site_pre_2015')
 *   - status = 'ready' + qa_passed = true (Gatekeeper)
 *   - mockup_html non null (lien maquette possible)
 *   - outdated_email_sent_at IS NULL
 *   - email valide
 *
 * Couvre-feu 5h-19h Paris.
 * Cadence : 50/run × 2 runs/jour = 100/jour max.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, isWithinSendingHours, requireAdminGuard } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

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
  website: string | null;
  sales_angle: string | null;
  is_pre_2015: boolean | null;
  obsolete_score: number | null;
  obsolete_signals: Record<string, unknown> | null;
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ──────── Template RÉNOVATEUR (sites obsolètes < 10 ans) ──────── */

function buildRenovatorEmail(p: Prospect): { subject: string; html: string; text: string } {
  const firstName = p.name.split(/[ -]/)[0];
  const cityTxt = p.city ? ` à ${p.city}` : "";
  const mockupUrl = `https://klyora.fr/prospects/${p.slug}`;
  const websiteHost = p.website ? p.website.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "votre site";

  const signals = (p.obsolete_signals || {}) as Record<string, unknown>;
  const issueList: string[] = [];
  if (signals.no_https) issueList.push("⚠️ pas en HTTPS (alerte rouge sécurité Google)");
  if (signals.no_viewport) issueList.push("📱 pas adapté aux mobiles (70 % de vos prospects vous fuient)");
  if (signals.old_jquery) issueList.push("🐛 jQuery obsolète (vieilles bibliothèques 2010-2014)");
  if (signals.tables_for_layout) issueList.push("🗂️ mise en page par tableaux (technique d'avant 2010)");
  if (signals.copyright_too_old) issueList.push(`📅 copyright ${signals.copyright_year} (jamais mis à jour)`);

  const subject = `${firstName}, j'ai visité ${websiteHost} — il fait fuir vos clients`;

  const text = `Bonjour,

J'ai visité votre site actuel (${websiteHost}). Il a dû vous être très utile pendant des années — mais aujourd'hui, il n'est plus adapté aux standards de 2026.

Ce que j'ai vu en 2 minutes :
${issueList.map(i => `  ${i}`).join("\n")}

Concrètement, ce que ça veut dire pour vous : vos prospects qui cherchent un ${p.city ? `professionnel à ${p.city}` : "professionnel"} sur Google ferment votre page en 3 secondes et appellent vos concurrents.

J'ai pris la liberté de recoder entièrement votre site avec les standards de 2026 (responsive mobile, HTTPS, vitesse optimisée). Voici la maquette prête à l'emploi :

→ ${mockupUrl}

Si elle vous plaît : 320 € one-shot ou 0 € + 17,90 €/mois (hébergement + maintenance + modifications illimitées).

Un mot et je l'active dans la semaine.

Tom — Klyora Sites — 06 35 59 24 71`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:580px;margin:0 auto;padding:20px;color:#1a1a1a;line-height:1.6">

<p>Bonjour,</p>

<p>J'ai visité votre site actuel (<strong>${escapeHtml(websiteHost)}</strong>). Il a dû vous être très utile pendant des années — mais aujourd'hui, il n'est plus adapté aux standards de 2026.</p>

<div style="background:#fef2f2;border-left:4px solid #dc2626;padding:14px 16px;margin:18px 0;border-radius:4px">
<p style="margin:0 0 8px;font-weight:700;color:#991b1b">Ce que j'ai vu en 2 minutes :</p>
<ul style="margin:0;padding-left:20px;color:#7f1d1d">
${issueList.map(i => `  <li>${escapeHtml(i)}</li>`).join("\n")}
</ul>
</div>

<p>Concrètement : vos prospects qui cherchent un ${escapeHtml(cityTxt ? "professionnel" + cityTxt : "professionnel")} sur Google <strong>ferment votre page en 3 secondes</strong> et appellent vos concurrents qui ont, eux, un site moderne.</p>

<p><strong>J'ai pris la liberté de recoder entièrement votre site avec les standards de 2026</strong> (responsive mobile, HTTPS, vitesse optimisée). Voici la maquette prête à l'emploi :</p>

<p style="text-align:center;margin:22px 0">
<a href="${mockupUrl}" style="display:inline-block;padding:14px 28px;background:#0a0a0a;color:#FFD700;text-decoration:none;font-weight:800;border-radius:100px;letter-spacing:0.06em;text-transform:uppercase;font-size:13px">Voir votre nouveau site →</a>
</p>

<p style="font-size:14px">Si elle vous plaît : <strong>320 € one-shot</strong> ou <strong>0 € + 17,90 €/mois</strong> (hébergement + maintenance + modifications illimitées).</p>

<p style="font-size:14px">Un mot et je l'active dans la semaine.</p>

<p style="margin-top:24px">Tom — <strong>06 35 59 24 71</strong><br><span style="color:#777;font-size:12px">Klyora Sites</span></p>

</body></html>`;

  return { subject, html, text };
}

/* ──────── Template ARCHÉOLOGUE (sites pre-2015, dinosaures) ──────── */

function buildArchaeologistEmail(p: Prospect): { subject: string; html: string; text: string } {
  const firstName = p.name.split(/[ -]/)[0];
  const mockupUrl = `https://klyora.fr/prospects/${p.slug}`;
  const websiteHost = p.website ? p.website.replace(/^https?:\/\/(www\.)?/, "").split("/")[0] : "votre site";

  const signals = (p.obsolete_signals || {}) as Record<string, unknown>;
  const domainYear = signals.domain_created_year as number | null;
  const yearsAge = domainYear ? new Date().getFullYear() - domainYear : 10;

  const subject = `${firstName}, votre site est en ligne depuis ${yearsAge} ans — c'est admirable mais...`;

  const text = `Bonjour,

J'ai visité le site actuel de ${p.name} (${websiteHost}).

D'abord, bravo : votre site est en ligne depuis ${yearsAge >= 8 ? "près de " + yearsAge + " ans" : "plus de 8 ans"}. C'est rare et ça prouve la longévité de votre entreprise — la plupart des concurrents n'auraient pas tenu.

Cependant, les standards du web ont radicalement changé depuis 2015. Aujourd'hui :
  📱 90 % des recherches locales se font sur mobile
  🔒 Google affiche "site non sécurisé" sur tous les sites en HTTP
  ⚡ Un site qui charge en plus de 3 secondes perd 53 % de ses visiteurs
  🎯 La géolocalisation Google priorise les sites modernes

Votre site n'étant plus adapté à ces standards, vous perdez des prospects locaux au profit de concurrents plus récents — sans même le savoir.

J'ai donc pris l'initiative de recoder entièrement votre site avec les technologies de 2026. Voici la maquette prête à l'emploi :

→ ${mockupUrl}

L'ancien site, on l'archive proprement. Le nouveau prend le relais en quelques minutes.

Tarif : 320 € one-shot ou 0 € + 17,90 €/mois (tout inclus, modifiable à volonté).

Un mot et je m'occupe de tout.

Tom — Klyora Sites — 06 35 59 24 71`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:580px;margin:0 auto;padding:20px;color:#1a1a1a;line-height:1.6">

<p>Bonjour,</p>

<p>J'ai visité le site actuel de <strong>${escapeHtml(p.name)}</strong> (<a href="${escapeHtml(p.website || "#")}" style="color:#666">${escapeHtml(websiteHost)}</a>).</p>

<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:14px 16px;margin:18px 0;border-radius:4px">
<p style="margin:0;color:#78350f;line-height:1.5"><strong>D'abord, bravo</strong> : votre site est en ligne depuis ${yearsAge >= 8 ? "près de " + yearsAge + " ans" : "plus de 8 ans"}. C'est rare et ça prouve la <strong>longévité de votre entreprise</strong> — la plupart des concurrents n'auraient pas tenu.</p>
</div>

<p>Cependant, les standards du web ont radicalement changé depuis 2015. Aujourd'hui :</p>

<ul style="font-size:14px">
  <li><strong>90 %</strong> des recherches locales se font sur mobile</li>
  <li>Google affiche <strong>"site non sécurisé"</strong> sur tous les sites en HTTP</li>
  <li>Un site qui charge en plus de 3 secondes perd <strong>53 %</strong> de ses visiteurs</li>
  <li>La géolocalisation Google <strong>priorise les sites modernes</strong></li>
</ul>

<p>Votre site n'étant plus adapté à ces standards, vous perdez des prospects locaux au profit de concurrents plus récents — sans même le savoir.</p>

<p><strong>J'ai donc pris l'initiative de recoder entièrement votre site avec les technologies de 2026.</strong> Voici la maquette prête à l'emploi :</p>

<p style="text-align:center;margin:22px 0">
<a href="${mockupUrl}" style="display:inline-block;padding:14px 28px;background:#0a0a0a;color:#FFD700;text-decoration:none;font-weight:800;border-radius:100px;letter-spacing:0.06em;text-transform:uppercase;font-size:13px">Voir le nouveau site →</a>
</p>

<p style="font-size:14px;color:#666">L'ancien site, on l'archive proprement. Le nouveau prend le relais en quelques minutes.</p>

<p style="font-size:14px">Tarif : <strong>320 €</strong> one-shot ou <strong>0 € + 17,90 €/mois</strong> (tout inclus, modifiable à volonté).</p>

<p style="font-size:14px">Un mot et je m'occupe de tout.</p>

<p style="margin-top:24px">Tom — <strong>06 35 59 24 71</strong><br><span style="color:#777;font-size:12px">Klyora Sites</span></p>

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
        sender: { name: "Tom — Klyora Sites", email: "contact@klyora.fr" },
        replyTo: { name: "Tom", email: "contact@klyora.fr" },
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
    const guard = requireAdminGuard(req, { limit: 20, windowSec: 60, routeKey: "outdated-blast" });
    if (guard) return guard;
  }
  if (!isWithinSendingHours(5, 19)) {
    return NextResponse.json({ success: true, processed: 0, skipped_curfew: true });
  }

  const supabase = db();

  const { data: prospects } = await supabase
    .from("prospects")
    .select("id, name, slug, email, city, website, sales_angle, is_pre_2015, obsolete_score, obsolete_signals")
    .in("sales_angle", ["site_outdated", "site_pre_2015"])
    .eq("status", "ready")
    .eq("qa_passed", true)
    .not("mockup_html", "is", null)
    .is("outdated_email_sent_at", null)
    .not("email", "is", null)
    .limit(250);

  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun lead obsolète à blaster" });
  }

  let sent = 0, errors = 0, archeo = 0, reno = 0;
  for (const p of prospects as Prospect[]) {
    if (!p.email) continue;
    const isPre = p.is_pre_2015 === true;
    const tpl = isPre ? buildArchaeologistEmail(p) : buildRenovatorEmail(p);
    const r = await sendBrevoEmail(p.email, p.name, tpl.subject, tpl.html, tpl.text);
    if (r.ok) {
      sent++;
      if (isPre) archeo++; else reno++;
    } else {
      errors++;
    }
    await supabase.from("prospects")
      .update({ outdated_email_sent_at: new Date().toISOString() })
      .eq("id", p.id);
    await new Promise(r => setTimeout(r, 350));
  }

  // Telegram récap
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat && sent > 0) {
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: `🦕 <b>Rénovateur/Archéologue blast</b>\n\n✅ Envoyés : <b>${sent}</b>\n🦕 Archéologue (pre-2015) : ${archeo}\n🔧 Rénovateur (outdated) : ${reno}\n❌ Erreurs : ${errors}`,
        parse_mode: "HTML",
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, processed: prospects.length, sent, archeologist: archeo, renovator: reno, errors });
}

export async function GET(req: NextRequest) { return POST(req); }
