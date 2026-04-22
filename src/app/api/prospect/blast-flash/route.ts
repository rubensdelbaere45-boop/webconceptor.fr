import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, escapeTelegram, isWithinSendingHours } from "@/lib/security";

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

function buildBlastEmail(prospectName: string, mockupUrl: string): { subject: string; html: string } {
  const firstName = prospectName.split(/[\s,]/)[0].slice(0, 40);
  const subject = `${firstName} — offre flash 24h sur votre site`;
  const html = `<div style="font-family:'Inter',system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0a0a0a;line-height:1.6">
  <p style="font-size:15px;margin-bottom:16px">Bonjour,</p>
  <p style="font-size:15px;margin-bottom:20px">Je vous recontacte rapidement pour vous signaler une <strong>offre flash valable 24h seulement</strong> sur la maquette de site que je vous ai préparée pour <strong>${escape(prospectName)}</strong>.</p>

  <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border:2px solid #c19a56;border-radius:8px;padding:26px;margin:24px 0;text-align:center">
    <p style="font-size:11px;color:#92400e;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.2em;font-weight:800">⚡ FLASH 24H — dernier jour à ce prix</p>
    <p style="margin:0 0 6px"><span style="text-decoration:line-through;opacity:0.4;font-size:18px;color:#78350f">599 €</span> <span style="font-family:Georgia,serif;font-size:30px;color:#1a1310;font-weight:700">199 € TTC</span></p>
    <p style="font-size:13px;color:#78350f;margin:0 0 14px">ou 3× sans frais — 66,33 €/mois via Klarna</p>
    <a href="${mockupUrl}" style="display:inline-block;padding:16px 36px;background:#c19a56;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;box-shadow:0 6px 16px rgba(193,154,86,0.4)">Commander maintenant →</a>
    <p style="font-size:11px;color:#92400e;margin:14px 0 0;font-weight:700">⏳ L'offre passe à 599 € demain à minuit</p>
  </div>

  <p style="font-size:14px;color:#525252;margin-bottom:14px"><strong>Ce que vous obtenez :</strong></p>
  <ul style="font-size:14px;color:#525252;padding-left:20px;margin-bottom:20px;line-height:1.8">
    <li>Site premium livré sous <strong>5 à 7 jours</strong></li>
    <li>Module de réservation / commande intégré (0 commission)</li>
    <li><strong>Satisfait ou remboursé 14 jours</strong> — zéro risque</li>
    <li>100 % propriétaire du site à vie</li>
  </ul>

  <p style="font-size:14px;color:#525252;margin-bottom:16px">Si vous avez une question, répondez à ce mail ou écrivez-moi directement au chat en bas à droite de votre maquette.</p>

  <div style="border-top:1px solid #e5e5e5;padding-top:20px;font-size:13px;color:#737373">
    <p style="margin-bottom:4px"><strong style="color:#0a0a0a">Tom Bauer</strong></p>
    <p style="margin-bottom:4px">Fondateur, WebConceptor</p>
    <p style="margin-bottom:2px">contact@webconceptor.fr · 06 35 59 24 71</p>
  </div>
</div>`;
  return { subject, html };
}

async function sendEmail(to: string, name: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Tom Bauer - WebConceptor", email: "contact@webconceptor.fr" },
        to: [{ email: to, name }],
        subject,
        htmlContent: html,
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
    .neq("status", "converted")
    .limit(MAX_BLAST);

  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun prospect éligible pour blast" });
  }

  const results: Array<{ id: string; status: string }> = [];

  for (const p of prospects) {
    const mockupUrl = `https://webconceptor.fr/prospects/${p.slug}`;
    const { subject, html } = buildBlastEmail(p.name, mockupUrl);

    const targets: string[] = [p.email];
    if (Array.isArray(p.additional_emails)) {
      for (const extra of p.additional_emails) {
        if (typeof extra === "string" && extra.toLowerCase() !== p.email.toLowerCase() && targets.length < 2) {
          targets.push(extra);
        }
      }
    }

    const sends = await Promise.all(targets.map((addr) => sendEmail(addr, p.name, subject, html)));
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
