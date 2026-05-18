import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, escapeTelegram, isWithinSendingHours } from "@/lib/security";

/* ══════════════════════════════════════════
   GET|POST /api/prospect/email-reminders
   Auth : x-admin-key OU x-cron-secret

   Envoie un email de relance aux prospects qui ont OUVERT leur maquette
   il y a 2+ jours mais n'ont ni répondu ni payé.
   Idempotent via la colonne email_reminder_sent_at (1 relance par prospect).
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

function escape(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildReminderEmail(prospectName: string, mockupUrl: string, prospectId?: string): { subject: string; html: string } {
  const firstName = prospectName.split(/[\s,]/)[0].slice(0, 40);
  const subject = `${firstName}, votre maquette vous attend toujours`;
  const html = `<div style="font-family:'Inter',system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0a0a0a;line-height:1.6">
  <p style="font-size:15px;margin-bottom:16px">Bonjour,</p>
  <p style="font-size:15px;margin-bottom:16px">Je reviens vers vous au sujet de la maquette de site internet que j'ai préparée pour <strong>${escape(prospectName)}</strong>.</p>
  <p style="font-size:15px;margin-bottom:16px">Je vois que vous l'avez ouverte il y a quelques jours — j'espère qu'elle vous a plu. Je voulais m'assurer que vous aviez bien toutes les informations nécessaires pour décider.</p>

  <div style="background:#fafafa;border-left:3px solid #872175;padding:20px;margin:24px 0;border-radius:6px">
    <p style="font-size:13px;color:#525252;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.1em;font-weight:700">Votre maquette est toujours active</p>
    <p style="font-size:18px;font-weight:700;color:#0a0a0a;margin-bottom:16px">${escape(prospectName)}</p>
    <a href="${mockupUrl}" style="display:inline-block;padding:12px 24px;background:#0066ff;color:#fff;text-decoration:none;border-radius:100px;font-weight:600;font-size:14px">Revoir la maquette →</a>
  </div>

  <p style="font-size:14px;color:#525252;margin-bottom:12px"><strong>Pour rappel, ce que vous obtenez :</strong></p>
  <ul style="font-size:14px;color:#525252;padding-left:20px;margin-bottom:20px">
    <li>Site premium livré sous <strong>5 à 7 jours</strong></li>
    <li>Module de réservation intégré — <strong>0 commission</strong> (vous gardez 100 % de vos couverts)</li>
    <li><strong>320 € TTC</strong> tout compris — site livré en 5 jours</li>
    <li>Satisfait ou remboursé 14 jours</li>
  </ul>

  <p style="font-size:14px;color:#525252;margin-bottom:24px">Vous pouvez commander directement depuis la maquette (bouton "J'achète ce site") — tout est prêt, le paiement est sécurisé par Stripe.</p>

  <p style="font-size:14px;color:#525252;margin-bottom:24px">Si vous avez la moindre question ou souhaitez des modifications particulières (photos, couleurs, textes), répondez simplement à cet email, je m'en occupe.</p>

  <div style="background:#f8f9fa;border-left:3px solid #0066ff;padding:18px 20px;margin:24px 0;border-radius:6px">
    <p style="font-size:14px;color:#0a0a0a;margin-bottom:6px;font-weight:600">Une question ? Contactez-moi :</p>
    <p style="font-size:14px;color:#525252;margin-bottom:4px">📧 <a href="mailto:contact@webconceptor.fr" style="color:#0066ff;text-decoration:none"><strong>contact@webconceptor.fr</strong></a></p>
    <p style="font-size:14px;color:#525252;margin:0">📞 <a href="tel:+33635592471" style="color:#0066ff;text-decoration:none"><strong>06 35 59 24 71</strong></a></p>
  </div>

  <div style="border-top:1px solid #e5e5e5;padding-top:20px;font-size:13px;color:#737373">
    <p style="margin-bottom:4px"><strong style="color:#0a0a0a">Tom Bauer</strong></p>
    <p style="margin-bottom:4px">Fondateur, WebConceptor</p>
    <p style="margin-bottom:2px">contact@webconceptor.fr &middot; 06 35 59 24 71</p>
    <p><a href="https://webconceptor.fr" style="color:#0066ff;text-decoration:none">webconceptor.fr</a></p>
  </div>
  <p style="font-size:11px;color:#a3a3a3;margin-top:24px;border-top:1px solid #f5f5f5;padding-top:16px">Vous recevez cet email dans le cadre d'un premier contact commercial. Pour ne plus être contacté, <a href="https://webconceptor.fr/api/unsubscribe?id=${encodeURIComponent(prospectId || '')}" style="color:#a3a3a3">cliquez ici pour vous désabonner</a>.</p>
</div>`;
  return { subject, html };
}

async function sendBrevoEmail(to: string, name: string, subject: string, html: string, prospectId?: string): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;
  try {
    const baseUrl = "https://webconceptor.fr";
    const unsubUrl = prospectId
      ? `${baseUrl}/api/unsubscribe?id=${encodeURIComponent(prospectId)}&email=${encodeURIComponent(to)}`
      : `${baseUrl}/api/unsubscribe?email=${encodeURIComponent(to)}`;
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Tom Bauer", email: "contact@webconceptor.fr" },
        to: [{ email: to, name }],
        subject,
        htmlContent: html,
        headers: {
          "List-Unsubscribe": `<${unsubUrl}>, <mailto:contact@webconceptor.fr?subject=unsubscribe%20${encodeURIComponent(to)}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      }),
      signal: AbortSignal.timeout(10000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function handler(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const adminOK = safeCompare(adminKey, process.env.ADMIN_SECRET_KEY);
  const cronOK = safeCompare(cronSecret, process.env.CRON_SECRET);
  if (!adminOK && !cronOK) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  // COUVRE-FEU 9h-19h (heure Paris)
  if (!isWithinSendingHours(9, 19)) {
    return NextResponse.json({
      success: true,
      processed: 0,
      skipped_curfew: true,
      message: "Email bloqués — hors plage horaire (9h-19h Paris)",
    });
  }

  const supabase = getSupabaseAdmin();

  const MAX_PER_RUN = 50;
  // Relance après 2 jours d'ouverture sans conversion
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();

  // Prospects éligibles :
  // - opened_at IS NOT NULL (ouvert)
  // - opened_at <= now() - 2 jours
  // - email_reminder_sent_at IS NULL (jamais relancé par email)
  // - email NOT NULL
  // - status IN ('opened', 'sent') — pas 'converted' ni 'replied'
  const { data: prospects, error: findErr } = await supabase
    .from("prospects")
    .select("id, name, slug, email, additional_emails, city, opened_at, status")
    .not("opened_at", "is", null)
    .is("email_reminder_sent_at", null)
    .not("email", "is", null)
    .in("status", ["opened", "sent"])
    .lte("opened_at", twoDaysAgo)
    .limit(MAX_PER_RUN);

  if (findErr) {
    console.error("[email-reminders] query error:", findErr);
    return NextResponse.json({ error: "Impossible de charger les prospects" }, { status: 500 });
  }

  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucune relance email nécessaire" });
  }

  const results: Array<{ id: string; name: string; status: string; error?: string }> = [];

  for (const p of prospects) {
    const mockupUrl = `https://webconceptor.fr/prospects/${p.slug}`;
    const { subject, html } = buildReminderEmail(p.name, mockupUrl, p.id);

    // Envoi au mail principal + additional_emails (max 2 destinataires)
    const targets: string[] = [p.email];
    if (Array.isArray(p.additional_emails)) {
      for (const extra of p.additional_emails) {
        if (typeof extra === "string" && extra.toLowerCase() !== p.email.toLowerCase() && targets.length < 2) {
          targets.push(extra);
        }
      }
    }

    const sendResults = await Promise.all(targets.map((addr) => sendBrevoEmail(addr, p.name, subject, html, p.id)));
    const anySuccess = sendResults.some(Boolean);

    // Marque comme relancé même si échec (évite retry infini)
    await supabase
      .from("prospects")
      .update({ email_reminder_sent_at: new Date().toISOString() })
      .eq("id", p.id);

    if (anySuccess) {
      results.push({ id: p.id, name: p.name, status: "sent" });
    } else {
      results.push({ id: p.id, name: p.name, status: "error", error: "Brevo failed" });
    }
  }

  const sent = results.filter((r) => r.status === "sent").length;
  const errors = results.filter((r) => r.status === "error").length;

  // Notif Telegram silencieuse de synthèse
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId && results.length > 0) {
    const msg =
      `📧 <b>Relances email automatiques</b>\n\n` +
      `<b>Envoyées :</b> ${sent}\n` +
      (errors > 0 ? `<b>Erreurs :</b> ${errors}\n` : "") +
      `\nCes prospects ont ouvert leur maquette il y a 2+ jours sans acheter. Relance automatique pour les ramener.`;
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        disable_notification: true,
      }),
    }).catch(() => { /* silent */ });
    void escapeTelegram; // silence import warning si non utilisé ailleurs
  }

  return NextResponse.json({
    success: true,
    processed: results.length,
    sent,
    errors,
    results,
  });
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
