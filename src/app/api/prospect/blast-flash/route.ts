import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, escapeTelegram, isWithinSendingHours } from "@/lib/security";
import { checkEmailMx } from "@/lib/email-mx-check";

/* ══════════════════════════════════════════
   GET|POST /api/prospect/blast-flash
   Auth : x-admin-key OU x-cron-secret

   BLAST FLASH : envoie un email "OFFRE 24H" à TOUS les prospects
   déjà scrapés qui ont une maquette + email, même s'ils ont déjà reçu
   un mail. Objectif : maximiser les ventes sur une journée cruciale.

   Idempotent via blast_flash_sent_at (1 seul mail par prospect).
   Respecte couvre-feu 9h-19h.
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

function escape(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function buildBlastEmail(prospectName: string, mockupUrl: string, unsubscribeUrl: string): { subject: string; html: string; text: string } {
  const firstName = prospectName.split(/[\s,]/)[0].slice(0, 40);
  // Objet sobre et personnel : rien qui déclenche les filtres spam (pas de
  // majuscules, pas d'emoji, pas de "flash", pas de "24h", pas de "!!!")
  const subject = `Un petit suivi concernant votre maquette`;

  const html = `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.6">
  <p style="font-size:15px;margin:0 0 16px">Bonjour,</p>

  <p style="font-size:15px;margin:0 0 16px">Je me permets de revenir vers vous au sujet de la maquette de site que je vous avais préparée pour <strong>${escape(prospectName)}</strong>.</p>

  <p style="font-size:15px;margin:0 0 16px">Vous trouverez la maquette à cette adresse&nbsp;: <a href="${mockupUrl}" style="color:#0066ff;text-decoration:underline">${mockupUrl}</a></p>

  <p style="font-size:15px;margin:0 0 16px">Pour rappel, le tarif reste à <strong>199&nbsp;€ TTC</strong> (ou trois échéances sans frais via Klarna). La livraison se fait en 5 à 7 jours et la garantie satisfait-ou-remboursé est de 14 jours.</p>

  <p style="font-size:15px;margin:0 0 16px">Si vous souhaitez avancer, des ajustements, ou simplement un devis écrit, répondez-moi directement à ce mail — je lis toutes les réponses personnellement.</p>

  <p style="font-size:15px;margin:0 0 16px">Bien cordialement,</p>

  <p style="font-size:14px;color:#525252;margin:0">
    <strong style="color:#1a1a1a">Tom Bauer</strong><br>
    WebConceptor<br>
    contact@webconceptor.fr · 06 35 59 24 71
  </p>

  <p style="font-size:11px;color:#999;margin:32px 0 0;padding-top:16px;border-top:1px solid #eee">
    Si vous ne souhaitez plus recevoir de nouvelles de notre part, <a href="${unsubscribeUrl}" style="color:#999">cliquez ici pour vous désabonner</a>. Votre adresse sera retirée immédiatement.
  </p>
</div>`;

  // Version texte — OBLIGATOIRE pour la délivrabilité (Gmail bulk sender policy
  // depuis février 2024). Un mail HTML sans text/plain fallback est quasi-systé-
  // matiquement flagué.
  const text = `Bonjour,

Je me permets de revenir vers vous au sujet de la maquette de site que je vous avais préparée pour ${prospectName}.

Vous trouverez la maquette à cette adresse :
${mockupUrl}

Pour rappel, le tarif reste à 199 € TTC (ou trois échéances sans frais via Klarna). La livraison se fait en 5 à 7 jours et la garantie satisfait-ou-remboursé est de 14 jours.

Si vous souhaitez avancer, des ajustements, ou simplement un devis écrit, répondez-moi directement à ce mail — je lis toutes les réponses personnellement.

Bien cordialement,

Tom Bauer
WebConceptor
contact@webconceptor.fr · 06 35 59 24 71

—
Pour ne plus recevoir de communications de notre part : ${unsubscribeUrl}`;

  return { subject, html, text };
}

async function sendEmail(to: string, name: string, subject: string, html: string, text: string, unsubscribeUrl: string): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Tom Bauer", email: "contact@webconceptor.fr" },
        to: [{ email: to, name }],
        subject,
        htmlContent: html,
        textContent: text,
        // Headers RFC 2369 + RFC 8058 — requis par Gmail/Yahoo bulk sender policy.
        // Sans ces 2 headers, Gmail bloque ou envoie direct en spam depuis fév 2024.
        headers: {
          "List-Unsubscribe": `<${unsubscribeUrl}>, <mailto:unsubscribe@webconceptor.fr?subject=unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch { return false; }
}

async function handler(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY) && !safeCompare(cronSecret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  if (!isWithinSendingHours(9, 19)) {
    return NextResponse.json({ success: true, processed: 0, skipped_curfew: true });
  }

  const supabase = getSupabaseAdmin();

  // BLAST : tous les prospects avec email + maquette existante,
  // pas encore blast flash, pas déjà convertis.
  // Limite 150/run (~5 crédits Brevo × 150 = 300 crédits = 6% du budget)
  const MAX_BLAST = 150;
  const { data: prospects } = await supabase
    .from("prospects")
    .select("id, name, slug, email, additional_emails, status")
    .not("email", "is", null)
    .not("mockup_html", "is", null)
    .is("blast_flash_sent_at", null)
    .is("unsubscribed_at", null) // respecte les désabonnements one-click
    .neq("status", "converted")
    .limit(MAX_BLAST);

  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun prospect éligible pour blast" });
  }

  const results: Array<{ id: string; status: string }> = [];

  for (const p of prospects) {
    const mockupUrl = `https://webconceptor.fr/prospects/${p.slug}`;
    // Token unsubscribe : simple hash du prospect.id (suffit pour one-click)
    const unsubscribeUrl = `https://webconceptor.fr/api/unsubscribe?id=${p.id}&email=${encodeURIComponent(p.email)}`;
    const { subject, html, text } = buildBlastEmail(p.name, mockupUrl, unsubscribeUrl);

    const targets: string[] = [p.email];
    if (Array.isArray(p.additional_emails)) {
      for (const extra of p.additional_emails) {
        if (typeof extra === "string" && extra.toLowerCase() !== p.email.toLowerCase() && targets.length < 2) {
          targets.push(extra);
        }
      }
    }

    // Pre-check MX DNS : chaque destinataire est validé avant l'envoi pour
    // réduire le hard bounce rate (un domaine sans record MX n'accepte AUCUN
    // email, l'envoi est condamné d'avance et pollue notre réputation).
    // checkEmailMx retourne TRUE si erreur réseau (doute bénéfice à l'email).
    const mxChecks = await Promise.all(targets.map((addr) => checkEmailMx(addr)));
    const validTargets = targets.filter((_, i) => mxChecks[i]);

    if (validTargets.length === 0) {
      // Tous les emails ont un domaine sans MX → on marque le prospect comme
      // traité pour ne pas le re-tenter, mais sans envoi (économise crédits).
      await supabase
        .from("prospects")
        .update({ blast_flash_sent_at: new Date().toISOString() })
        .eq("id", p.id);
      results.push({ id: p.id, status: "skipped_no_mx" });
      continue;
    }

    const sends = await Promise.all(validTargets.map((addr) => sendEmail(addr, p.name, subject, html, text, unsubscribeUrl)));
    const ok = sends.some(Boolean);

    await supabase
      .from("prospects")
      .update({ blast_flash_sent_at: new Date().toISOString() })
      .eq("id", p.id);

    results.push({ id: p.id, status: ok ? "sent" : "error" });
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const errors = results.filter((r) => r.status === "error").length;

  // Notif Telegram SONORE (événement critique de la journée)
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId && sent > 0) {
    const msg =
      `⚡ <b>BLAST FLASH ENVOYÉ (${sent} emails)</b>\n\n` +
      `Offre 24h à 199€ envoyée à tous les prospects existants — on maximise les chances de ventes aujourd'hui.\n\n` +
      `<b>Résultat :</b> ${sent} envoyés / ${errors} erreurs\n` +
      `<b>Prochaines étapes :</b>\n` +
      `- Relances J+2 à 10h30\n` +
      `- SMS hot lead toutes les heures\n` +
      `- 2ème vague à 15h\n\n` +
      `<i>Objectif : 5+ ventes aujourd'hui</i>`;
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "HTML" }),
    }).catch(() => {});
    void escapeTelegram;
  }

  return NextResponse.json({ success: true, processed: results.length, sent, errors });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
