import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, escapeTelegram, isWithinSendingHours } from "@/lib/security";
import { checkEmailMx } from "@/lib/email-mx-check";

/* ══════════════════════════════════════════
   GET|POST /api/prospect/final-push
   Auth : x-admin-key OU x-cron-secret

   FINAL PUSH : deuxième blast agressif pour les prospects qui ont déjà reçu
   le blast_flash mais n'ont pas acheté. Ton beaucoup plus direct : "dernière
   chance avant la fin du mois, après on reprend le tarif normal".

   Idempotent via final_push_sent_at (1 seul email par prospect).
   Couvre-feu 9h-19h Paris.
   Limite 200/run (~400 crédits Brevo).
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

function buildFinalPushEmail(prospectName: string, mockupUrl: string, unsubscribeUrl: string): { subject: string; html: string; text: string } {
  const firstName = prospectName.split(/[\s,]/)[0].slice(0, 40);
  // Objet personnel, pas marketing. Pas de caps, pas d'emoji, pas de "dernière
  // chance" / "expire" — ces mots font augmenter le score spam de 3-5 points
  // chez la plupart des filtres ESP.
  const subject = `Un dernier message au sujet de votre maquette`;

  const html = `<div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.6">
  <p style="font-size:15px;margin:0 0 16px">Bonjour,</p>

  <p style="font-size:15px;margin:0 0 16px">Je me permets de vous écrire une dernière fois au sujet de la maquette de site que je vous avais préparée pour <strong>${escape(prospectName)}</strong>, sans réponse de votre côté.</p>

  <p style="font-size:15px;margin:0 0 16px">Je comprends tout à fait si ce n'est pas le bon moment. Dans ce cas, ignorez simplement ce message — je ne vous recontacterai plus, promis.</p>

  <p style="font-size:15px;margin:0 0 16px">Si vous souhaitez jeter un dernier œil à la maquette, elle est toujours consultable ici&nbsp;: <a href="${mockupUrl}" style="color:#0066ff;text-decoration:underline">${mockupUrl}</a></p>

  <p style="font-size:15px;margin:0 0 16px">Le tarif de 199&nbsp;€ TTC (ou 3 échéances sans frais) est toujours valable cette semaine. Livraison en 5 à 7 jours, 14 jours satisfait-ou-remboursé.</p>

  <p style="font-size:15px;margin:0 0 16px">Si vous avez une question qui vous retient (prix, délais, aspect technique), répondez-moi simplement à ce mail, je vous réponds personnellement.</p>

  <p style="font-size:15px;margin:0 0 16px">Bien cordialement,</p>

  <p style="font-size:14px;color:#525252;margin:0">
    <strong style="color:#1a1a1a">Tom Bauer</strong><br>
    WebConceptor<br>
    contact@webconceptor.fr · 06 35 59 24 71
  </p>

  <p style="font-size:11px;color:#999;margin:32px 0 0;padding-top:16px;border-top:1px solid #eee">
    Pour ne plus recevoir de messages de notre part, <a href="${unsubscribeUrl}" style="color:#999">cliquez ici pour vous désabonner</a>. Votre adresse sera supprimée immédiatement.
  </p>
</div>`;

  const text = `Bonjour,

Je me permets de vous écrire une dernière fois au sujet de la maquette de site que je vous avais préparée pour ${prospectName}, sans réponse de votre côté.

Je comprends tout à fait si ce n'est pas le bon moment. Dans ce cas, ignorez simplement ce message — je ne vous recontacterai plus, promis.

Si vous souhaitez jeter un dernier œil à la maquette, elle est toujours consultable ici :
${mockupUrl}

Le tarif de 199 € TTC (ou 3 échéances sans frais) est toujours valable cette semaine. Livraison en 5 à 7 jours, 14 jours satisfait-ou-remboursé.

Si vous avez une question qui vous retient (prix, délais, aspect technique), répondez-moi simplement à ce mail, je vous réponds personnellement.

Bien cordialement,

Tom Bauer
WebConceptor
contact@webconceptor.fr · 06 35 59 24 71

—
Pour ne plus recevoir de messages de notre part : ${unsubscribeUrl}`;

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
        // RFC 2369 + RFC 8058 — Gmail/Yahoo bulk sender policy depuis fév 2024
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

  // Couvre-feu 9h-19h Paris — pas d'emails le soir (mauvaise délivrabilité)
  if (!isWithinSendingHours(9, 19)) {
    return NextResponse.json({ success: true, processed: 0, skipped_curfew: true });
  }

  const supabase = getSupabaseAdmin();

  // FINAL PUSH : prospects avec email + maquette, pas encore convertis,
  // qui ont déjà reçu le blast_flash (donc chauds) mais n'ont pas acheté.
  // On évite ceux qui n'ont même pas été warm-up (blast_flash NULL) — on ne
  // tape pas 2× sur des gens qu'on n'a jamais touchés correctement.
  const MAX_PUSH = 200;
  const { data: prospects } = await supabase
    .from("prospects")
    .select("id, name, slug, email, additional_emails, status")
    .not("email", "is", null)
    .not("mockup_html", "is", null)
    .is("final_push_sent_at", null)
    .is("unsubscribed_at", null) // respecte les désabonnements one-click
    .neq("status", "converted")
    .limit(MAX_PUSH);

  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun prospect éligible pour final-push" });
  }

  const results: Array<{ id: string; status: string }> = [];

  for (const p of prospects) {
    const mockupUrl = `https://webconceptor.fr/prospects/${p.slug}`;
    const unsubscribeUrl = `https://webconceptor.fr/api/unsubscribe?id=${p.id}&email=${encodeURIComponent(p.email)}`;
    const { subject, html, text } = buildFinalPushEmail(p.name, mockupUrl, unsubscribeUrl);

    const targets: string[] = [p.email];
    if (Array.isArray(p.additional_emails)) {
      for (const extra of p.additional_emails) {
        if (typeof extra === "string" && extra.toLowerCase() !== p.email.toLowerCase() && targets.length < 2) {
          targets.push(extra);
        }
      }
    }

    // Pre-check MX : on n'envoie pas aux domaines sans MX record
    // (économise crédits + protège la réputation)
    const mxChecks = await Promise.all(targets.map((addr) => checkEmailMx(addr)));
    const validTargets = targets.filter((_, i) => mxChecks[i]);

    if (validTargets.length === 0) {
      await supabase
        .from("prospects")
        .update({ final_push_sent_at: new Date().toISOString() })
        .eq("id", p.id);
      results.push({ id: p.id, status: "skipped_no_mx" });
      continue;
    }

    const sends = await Promise.all(validTargets.map((addr) => sendEmail(addr, p.name, subject, html, text, unsubscribeUrl)));
    const ok = sends.some(Boolean);

    await supabase
      .from("prospects")
      .update({ final_push_sent_at: new Date().toISOString() })
      .eq("id", p.id);

    results.push({ id: p.id, status: ok ? "sent" : "error" });
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const errors = results.filter((r) => r.status === "error").length;

  // Notif Telegram SONORE (événement critique)
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId && sent > 0) {
    const msg =
      `🔥 <b>FINAL PUSH ENVOYÉ (${sent} emails)</b>\n\n` +
      `Deuxième blast "dernière chance" à tous les prospects non-convertis.\n` +
      `Ton plus direct, tarif 199 € maintenu, expiration "ce soir".\n\n` +
      `<b>Résultat :</b> ${sent} envoyés / ${errors} erreurs\n\n` +
      `<i>Les ouvertures vont déclencher les SMS hot-lead automatiquement.</i>`;
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
