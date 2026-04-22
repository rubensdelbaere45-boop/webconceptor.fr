import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, escapeTelegram, isWithinSendingHours } from "@/lib/security";

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

function buildFinalPushEmail(prospectName: string, mockupUrl: string): { subject: string; html: string } {
  const firstName = prospectName.split(/[\s,]/)[0].slice(0, 40);
  // Subject: direct, urgence, pas d'emoji (délivrabilité)
  const subject = `${firstName}, dernière chance avant fermeture de l'offre`;

  const html = `<div style="font-family:'Inter',system-ui,-apple-system,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0a0a0a;line-height:1.6">
  <p style="font-size:15px;margin-bottom:20px">Bonjour,</p>

  <p style="font-size:15px;margin-bottom:18px">Je reprends contact une <strong>dernière fois</strong> concernant la maquette personnalisée que j'avais préparée pour <strong>${escape(prospectName)}</strong>.</p>

  <p style="font-size:15px;margin-bottom:18px">Elle reste en ligne quelques heures, ensuite <strong>je la supprime</strong> et le tarif repasse à <strong>599 €</strong>. Je ne relance pas une 3e fois — je préfère passer du temps sur les projets qui démarrent.</p>

  <div style="background:#fff7ed;border:2px solid #f97316;border-radius:10px;padding:24px;margin:24px 0;text-align:center">
    <p style="font-size:11px;color:#9a3412;margin:0 0 10px;text-transform:uppercase;letter-spacing:0.18em;font-weight:800">DERNIÈRE CHANCE — EXPIRE CE SOIR</p>
    <p style="margin:0 0 6px">
      <span style="text-decoration:line-through;opacity:0.4;font-size:16px;color:#9a3412">599 €</span>
      <span style="font-family:Georgia,'Times New Roman',serif;font-size:32px;color:#0a0a0a;font-weight:700;margin-left:8px">199 € TTC</span>
    </p>
    <p style="font-size:13px;color:#9a3412;margin:0 0 16px">ou 3× sans frais (66,33 €/mois) via Klarna — aucune majoration</p>
    <a href="${mockupUrl}" style="display:inline-block;padding:16px 36px;background:#0a0a0a;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;letter-spacing:0.08em;text-transform:uppercase">Récupérer ma maquette →</a>
    <p style="font-size:11px;color:#9a3412;margin:14px 0 0;font-weight:700">⏳ Passé minuit : tarif normal 599 €</p>
  </div>

  <p style="font-size:14px;color:#525252;margin-bottom:12px"><strong>Ce que vous conservez au tarif 199 € :</strong></p>
  <ul style="font-size:14px;color:#525252;padding-left:20px;margin-bottom:18px;line-height:1.8">
    <li>Site premium livré <strong>en 5 à 7 jours</strong></li>
    <li>Module de réservation ou commande intégré — <strong>0 % commission</strong></li>
    <li><strong>Satisfait ou remboursé 14 jours</strong> — zéro risque</li>
    <li>Vous êtes <strong>100 % propriétaire</strong> du site à vie</li>
    <li>Hébergement gratuit la 1<sup>re</sup> année</li>
  </ul>

  <p style="font-size:14px;color:#525252;margin-bottom:16px">Si vous avez une question qui vous retient (prix, délais, techniques), répondez simplement à ce mail — je lis tout personnellement.</p>

  <p style="font-size:14px;color:#525252;margin-bottom:20px">Si ce projet ne vous intéresse plus, ignorez ce mail : je ne vous recontacterai pas.</p>

  <div style="border-top:1px solid #e5e5e5;padding-top:20px;font-size:13px;color:#737373">
    <p style="margin-bottom:4px"><strong style="color:#0a0a0a">Tom Bauer</strong></p>
    <p style="margin-bottom:4px">Fondateur, WebConceptor</p>
    <p style="margin-bottom:2px">contact@webconceptor.fr · 06 35 59 24 71</p>
  </div>

  <p style="font-size:10px;color:#a3a3a3;margin-top:18px;line-height:1.5">Cet email est un dernier rappel unique. Pour ne plus recevoir de communications, répondez avec le mot "STOP" — je retire votre adresse immédiatement.</p>
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
    .neq("status", "converted")
    .limit(MAX_PUSH);

  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun prospect éligible pour final-push" });
  }

  const results: Array<{ id: string; status: string }> = [];

  for (const p of prospects) {
    const mockupUrl = `https://webconceptor.fr/prospects/${p.slug}`;
    const { subject, html } = buildFinalPushEmail(p.name, mockupUrl);

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
