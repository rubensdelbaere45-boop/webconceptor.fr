import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

/* ══════════════════════════════════════════════════════════════════
   POST /api/tableflow/webhook
   Webhook Stripe dédié à TableFlow.

   À configurer dans Stripe Dashboard :
   → Endpoint : https://webconceptor.fr/api/tableflow/webhook
   → Events   : checkout.session.completed
                customer.subscription.deleted

   Env vars nécessaires :
   → STRIPE_WEBHOOK_SECRET_TABLEFLOW  (clé fournie par Stripe après création)
   → STRIPE_SECRET_KEY                (déjà en place)
   ══════════════════════════════════════════════════════════════════ */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET_TABLEFLOW || "";
const BASE_URL       = process.env.NEXT_PUBLIC_APP_URL || "https://webconceptor.fr";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/* ─── Telegram ───────────────────────────────────────────────────────────── */
async function notifyTelegram(msg: string) {
  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "HTML" }),
    });
  } catch { /* silent */ }
}

/* ─── Email Brevo vers le restaurateur ──────────────────────────────────── */
async function sendActivationEmail({
  restaurantName, adminUrl, menuUrl, qrUrl, toEmail, toName,
}: {
  restaurantName: string;
  adminUrl: string;
  menuUrl: string;
  qrUrl: string;
  toEmail: string;
  toName: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || !toEmail) return;

  const htmlBody = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#F9FAFB;font-family:'Helvetica Neue',Arial,sans-serif}
  .wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
  .hero{background:linear-gradient(135deg,#1a1310 0%,#2d1f0e 100%);padding:40px 32px;text-align:center}
  .hero-badge{display:inline-block;background:rgba(193,154,86,0.15);border:1px solid rgba(193,154,86,0.4);color:#c19a56;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:6px 16px;border-radius:30px;margin-bottom:20px}
  .hero h1{color:#fff;font-size:26px;font-weight:700;margin:0 0 8px}
  .hero p{color:rgba(255,255,255,0.6);font-size:14px;margin:0}
  .body{padding:32px}
  .body p{font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px}
  .btn-primary{display:block;background:#1a1310;color:#fff;text-decoration:none;padding:16px 24px;border-radius:12px;font-weight:700;font-size:15px;text-align:center;margin:24px 0}
  .btn-secondary{display:block;background:#F9FAFB;color:#374151;text-decoration:none;padding:13px 24px;border-radius:12px;font-weight:600;font-size:14px;text-align:center;border:1.5px solid #E5E7EB;margin:12px 0}
  .step{display:flex;gap:14px;margin:12px 0;align-items:flex-start}
  .step-num{width:28px;height:28px;border-radius:50%;background:#1a1310;color:#c19a56;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
  .step p{margin:0;font-size:14px;color:#6B7280;line-height:1.6}
  .url-box{background:#F9FAFB;border:1.5px solid #E5E7EB;border-radius:10px;padding:12px 16px;font-family:monospace;font-size:13px;color:#374151;word-break:break-all;margin:12px 0}
  .footer{background:#F9FAFB;border-top:1px solid #E5E7EB;padding:24px 32px;text-align:center;font-size:12px;color:#9CA3AF}
  .footer a{color:#c19a56;text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="hero">
    <div class="hero-badge">🎉 Menu activé</div>
    <h1>Bienvenue sur TableFlow !</h1>
    <p>Votre menu digital est en ligne pour <strong style="color:#fff">${restaurantName}</strong></p>
  </div>
  <div class="body">
    <p>Bonjour ${toName},</p>
    <p>Votre abonnement TableFlow est confirmé. Vos clients peuvent désormais scanner le QR code sur leurs tables et accéder à votre carte interactive.</p>

    <a href="${adminUrl}" class="btn-primary">
      🔧 Accéder à mon espace admin →
    </a>

    <p style="font-size:13px;color:#9CA3AF;text-align:center;margin-top:-12px">Lien unique et sécurisé — gardez-le précieusement</p>

    <div style="background:#FEF9C3;border:1px solid #FDE68A;border-radius:10px;padding:14px 16px;margin:20px 0">
      <p style="margin:0;font-size:13px;color:#78350F">⚠️ <strong>Conservez ce lien.</strong> C'est votre accès admin. Si vous le perdez, contactez-nous à <a href="mailto:contact@webconceptor.fr" style="color:#c19a56">contact@webconceptor.fr</a></p>
    </div>

    <p style="font-weight:700;color:#111827">Vos 3 premières actions :</p>
    <div class="step">
      <div class="step-num">1</div>
      <p>Accédez à votre espace admin et vérifiez que votre carte est complète. Ajoutez ou modifiez vos plats.</p>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <p>Téléchargez votre QR code et imprimez-le. Placez-le sur chaque table avec un petit chevalet.</p>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <p>Partagez le lien de votre carte sur vos réseaux sociaux : vos clients adorent découvrir le menu avant de venir.</p>
    </div>

    <a href="${qrUrl}" class="btn-secondary">⬇ Télécharger mon QR code (PNG)</a>
    <a href="${menuUrl}" class="btn-secondary">👁 Voir ma carte comme mes clients</a>
  </div>
  <div class="footer">
    <p>Une question ? Répondez directement à cet email ou écrivez à <a href="mailto:contact@webconceptor.fr">contact@webconceptor.fr</a></p>
    <p style="margin-top:8px">TableFlow par <a href="https://webconceptor.fr">WebConceptor</a> · <a href="#">Se désabonner</a></p>
  </div>
</div>
</body>
</html>`;

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender:  { name: "TableFlow", email: "contact@webconceptor.fr" },
        to:      [{ email: toEmail, name: toName }],
        subject: `🎉 Votre menu TableFlow est activé — ${restaurantName}`,
        htmlContent: htmlBody,
      }),
    });
  } catch (e) {
    console.error("[tableflow/webhook] Brevo email error:", e);
  }
}

/* ─── Handler principal ──────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const rawBody  = await req.text();
  const sigHeader = req.headers.get("stripe-signature") || "";

  /* Vérifier la signature Stripe */
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sigHeader, WEBHOOK_SECRET);
  } catch (err) {
    console.error("[tableflow/webhook] Signature invalide", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  /* ── checkout.session.completed ─────────────────────────────────── */
  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    /* Vérifier que c'est bien un paiement TableFlow */
    if (session.metadata?.source !== "tableflow") {
      return NextResponse.json({ received: true });
    }

    const slug            = session.metadata?.slug;
    const restaurantName  = session.metadata?.restaurant_name || "votre restaurant";
    const customerEmail   = session.customer_details?.email || session.customer_email || "";
    const customerName    = session.customer_details?.name || restaurantName;

    if (!slug) {
      console.error("[tableflow/webhook] Pas de slug dans les métadonnées");
      return NextResponse.json({ error: "Slug manquant" }, { status: 400 });
    }

    const supabase = getSupabase();

    /* Activer le restaurant */
    const { data: restaurant, error } = await supabase
      .from("tableflow_prospects")
      .update({ is_live: true, status: "live" })
      .eq("slug", slug)
      .select("slug, name, email, admin_token, city")
      .single();

    if (error || !restaurant) {
      console.error("[tableflow/webhook] Activation failed:", error);
      return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
    }

    /* Construire les URLs */
    const adminToken = restaurant.admin_token;
    const adminUrl   = `${BASE_URL}/restaurant/${slug}/admin?token=${adminToken}`;
    const menuUrl    = `${BASE_URL}/restaurant/${slug}`;
    const qrUrl      = `${BASE_URL}/api/tableflow/qrcode?slug=${slug}&size=500x500`;

    /* Email au restaurateur */
    const emailDest = customerEmail || restaurant.email || "";
    if (emailDest) {
      await sendActivationEmail({
        restaurantName,
        adminUrl,
        menuUrl,
        qrUrl,
        toEmail: emailDest,
        toName:  customerName,
      });
    }

    /* Notification Telegram */
    const amountCents = session.amount_total || 0;
    await notifyTelegram(
      `🎉 <b>NOUVEAU CLIENT TABLEFLOW</b>\n\n` +
      `🏪 ${restaurantName}\n` +
      `📍 ${restaurant.city || "—"}\n` +
      `📧 ${emailDest || "—"}\n` +
      `💶 ${(amountCents / 100).toFixed(2)} € / mois\n` +
      `🔗 <a href="${menuUrl}">Voir la carte</a>`
    );

    return NextResponse.json({ received: true, activated: slug });
  }

  /* ── customer.subscription.deleted → désactiver ─────────────────── */
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const slug = sub.metadata?.slug;

    if (!slug) return NextResponse.json({ received: true });

    await getSupabase()
      .from("tableflow_prospects")
      .update({ is_live: false, status: "cancelled" })
      .eq("slug", slug);

    await notifyTelegram(`⚠️ <b>Résiliation TableFlow</b>\n🏪 slug: ${slug}`);

    return NextResponse.json({ received: true, deactivated: slug });
  }

  return NextResponse.json({ received: true });
}
