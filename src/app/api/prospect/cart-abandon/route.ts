import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, isWithinSendingHours } from "@/lib/security";

/* ══════════════════════════════════════════
   GET|POST /api/prospect/cart-abandon
   Auth : x-admin-key OU x-cron-secret

   Relance par email les prospects qui ont ouvert le modal d'achat
   mais n'ont pas payé dans l'heure qui a suivi (CART ABANDON).
   Ces gens sont les PLUS chauds du pipeline — une relance immédiate
   les fait souvent revenir au payment.

   Idempotent : 1 seule relance par prospect (cart_relance_sent_at).
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

function buildCartAbandonEmail(prospectName: string, mockupUrl: string): { subject: string; html: string } {
  const subject = `Un dernier clic pour votre site ${escape(prospectName)} ?`;
  const html = `<div style="font-family:'Inter',system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0a0a0a;line-height:1.6">
  <p style="font-size:15px;margin-bottom:16px">Bonjour,</p>
  <p style="font-size:15px;margin-bottom:16px">J'ai vu que vous étiez tout à l'heure sur la page de commande du site <strong>${escape(prospectName)}</strong> — il y a eu une hésitation ?</p>
  <p style="font-size:15px;margin-bottom:24px">Si c'est le prix, le design, ou un détail technique qui vous bloque, <strong>dites-le moi</strong>. Je réponds en quelques minutes.</p>

  <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border:2px solid #c19a56;border-radius:6px;padding:22px;margin:24px 0;text-align:center">
    <p style="font-size:11px;color:#92400e;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.2em;font-weight:800">🔥 Offre de lancement</p>
    <p style="margin:0 0 6px"><span style="text-decoration:line-through;opacity:0.5;font-size:18px;color:#78350f">599 €</span> <span style="font-family:Georgia,serif;font-size:28px;color:#1a1310;font-weight:700">199 € TTC</span></p>
    <p style="font-size:13px;color:#78350f;margin:0 0 14px">ou 3× sans frais via Klarna</p>
    <a href="${mockupUrl}" style="display:inline-block;padding:14px 32px;background:#c19a56;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;box-shadow:0 4px 12px rgba(193,154,86,0.4)">Finaliser ma commande →</a>
  </div>

  <p style="font-size:14px;color:#525252;margin-bottom:16px"><strong>Petit rappel :</strong></p>
  <ul style="font-size:14px;color:#525252;padding-left:20px;margin-bottom:20px">
    <li>Livraison sous <strong>5 à 7 jours</strong></li>
    <li><strong>Satisfait ou remboursé 14 jours</strong> (aucun justificatif)</li>
    <li>Paiement 100 % sécurisé Stripe</li>
  </ul>

  <p style="font-size:14px;color:#525252;margin-bottom:24px">Un simple mot de retour suffit — je suis à votre écoute.</p>

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

  // Paniers abandonnés : cart_opened_at >= 1h et <= 24h, pas encore relancés, pas convertis
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: prospects } = await supabase
    .from("prospects")
    .select("id, name, slug, email, additional_emails, status, cart_opened_at")
    .not("cart_opened_at", "is", null)
    .is("cart_relance_sent_at", null)
    .not("email", "is", null)
    .lte("cart_opened_at", oneHourAgo)
    .gte("cart_opened_at", twentyFourHoursAgo)
    .neq("status", "converted")
    .limit(30);

  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun panier abandonné" });
  }

  const results: Array<{ id: string; status: string }> = [];

  for (const p of prospects) {
    const mockupUrl = `https://webconceptor.fr/prospects/${p.slug}`;
    const { subject, html } = buildCartAbandonEmail(p.name, mockupUrl);

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
      .update({ cart_relance_sent_at: new Date().toISOString() })
      .eq("id", p.id);

    results.push({ id: p.id, status: ok ? "sent" : "error" });
  }

  const sent = results.filter((r) => r.status === "sent").length;

  // Notif Telegram silencieuse
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId && sent > 0) {
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🛒 <b>Relances panier abandonné</b>\n\n${sent} email(s) envoyés aux prospects qui ont ouvert le paiement sans conclure.`,
        parse_mode: "HTML",
        disable_notification: true,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, processed: results.length, sent });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
