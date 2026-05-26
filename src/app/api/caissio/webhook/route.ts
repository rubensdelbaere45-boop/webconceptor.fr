import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET_CAISSIO || "";
const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://webconceptor.fr";

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

/* ─── Email Brevo ────────────────────────────────────────────────────────── */
async function sendWelcomeEmail({
  toEmail, toName, plan, appUrl,
}: {
  toEmail: string;
  toName: string;
  plan: string;
  appUrl: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || !toEmail) return;

  const planLabels: Record<string, { label: string; price: string; color: string }> = {
    starter:  { label: "Starter",  price: "15 €/mois", color: "#0f172a" },
    pro:      { label: "Pro",      price: "39 €/mois", color: "#4f46e5" },
    business: { label: "Business", price: "59 €/mois", color: "#7c3aed" },
  };
  const p = planLabels[plan] ?? { label: plan, price: "", color: "#0f172a" };

  const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#F9FAFB;font-family:'Helvetica Neue',Arial,sans-serif}
  .wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
  .hero{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:40px 32px;text-align:center}
  .hero-badge{display:inline-block;background:rgba(79,70,229,0.2);border:1px solid rgba(79,70,229,0.4);color:#818cf8;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:6px 16px;border-radius:30px;margin-bottom:20px}
  .hero h1{color:#fff;font-size:26px;font-weight:700;margin:0 0 8px}
  .hero p{color:rgba(255,255,255,0.6);font-size:14px;margin:0}
  .body{padding:32px}
  .body p{font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px}
  .plan-box{background:#f8fafc;border:2px solid ${p.color}30;border-radius:14px;padding:18px 20px;margin:20px 0;display:flex;align-items:center;justify-content:space-between}
  .plan-name{font-size:18px;font-weight:800;color:${p.color}}
  .plan-price{font-size:15px;color:#6b7280;font-weight:600}
  .btn-primary{display:block;background:#4f46e5;color:#fff;text-decoration:none;padding:16px 24px;border-radius:12px;font-weight:700;font-size:15px;text-align:center;margin:24px 0}
  .step{display:flex;gap:14px;margin:12px 0;align-items:flex-start}
  .step-num{width:28px;height:28px;border-radius:50%;background:#4f46e5;color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px}
  .step p{margin:0;font-size:14px;color:#6B7280;line-height:1.6}
  .footer{background:#F9FAFB;border-top:1px solid #E5E7EB;padding:24px 32px;text-align:center;font-size:12px;color:#9CA3AF}
  .footer a{color:#4f46e5;text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="hero">
    <div class="hero-badge">🎉 Abonnement activé</div>
    <h1>Bienvenue sur Caissio !</h1>
    <p>Votre logiciel de caisse est prêt, ${toName}</p>
  </div>
  <div class="body">
    <div class="plan-box">
      <div>
        <div class="plan-name">Plan ${p.label}</div>
        <div class="plan-price">${p.price}</div>
      </div>
      <div style="font-size:28px">✅</div>
    </div>

    <p>Votre abonnement est confirmé. Vous pouvez maintenant utiliser Caissio sans limitation depuis n'importe quel iPad, Mac ou PC.</p>

    <a href="${appUrl}" class="btn-primary">
      🖥 Accéder à mon espace Caissio →
    </a>

    <p style="font-weight:700;color:#111827">Pour démarrer rapidement :</p>
    <div class="step">
      <div class="step-num">1</div>
      <p>Connectez-vous et complétez votre profil (nom du commerce, SIRET, adresse).</p>
    </div>
    <div class="step">
      <div class="step-num">2</div>
      <p>Ajoutez vos produits ou importez votre catalogue Excel/CSV en 2 minutes.</p>
    </div>
    <div class="step">
      <div class="step-num">3</div>
      <p>Ouvrez la caisse sur votre iPad et commencez à encaisser !</p>
    </div>

    <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:14px 16px;margin:20px 0">
      <p style="margin:0;font-size:13px;color:#1e40af">💡 <strong>Conseil :</strong> Ajoutez Caissio à l'écran d'accueil de votre iPad (Safari → Partager → Sur l'écran d'accueil) pour une expérience plein écran.</p>
    </div>
  </div>
  <div class="footer">
    <p>Une question ? Écrivez-nous à <a href="mailto:contact@webconceptor.fr">contact@webconceptor.fr</a></p>
    <p style="margin-top:8px">Caissio par <a href="https://webconceptor.fr">WebConceptor</a></p>
  </div>
</div>
</body>
</html>`;

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender:  { name: "Caissio", email: "contact@webconceptor.fr" },
        to:      [{ email: toEmail, name: toName }],
        subject: `🎉 Votre abonnement Caissio ${p.label} est activé !`,
        htmlContent: html,
      }),
    });
  } catch (e) {
    console.error("[caissio/webhook] Brevo error:", e);
  }
}

/* ─── Handler principal ──────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature") || "";

  if (!sig || !WEBHOOK_SECRET) {
    console.warn("[Caissio Webhook] Signature ou secret manquant");
    return NextResponse.json({ error: "Configuration webhook manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err) {
    console.error("[Caissio Webhook] Signature invalide:", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    switch (event.type) {

      /* ── Paiement réussi → email + Telegram ─────────────────────── */
      case "checkout.session.completed": {
        const session     = event.data.object as Stripe.Checkout.Session;
        const userId      = session.client_reference_id || "—";
        const userEmail   = session.customer_details?.email || session.customer_email || "";
        const userName    = session.customer_details?.name || "Client";
        const plan        = session.metadata?.plan || "pro";
        const amountCents = session.amount_total || 0;
        const appUrl      = `${BASE_URL}/caissio/login`;

        /* Email de bienvenue */
        if (userEmail) {
          await sendWelcomeEmail({ toEmail: userEmail, toName: userName, plan, appUrl });
        }

        /* Notification Telegram */
        await notifyTelegram(
          `🖥 <b>NOUVEAU CLIENT CAISSIO</b>\n\n` +
          `👤 ${userName}\n` +
          `📧 ${userEmail || "—"}\n` +
          `📦 Plan : <b>${plan.toUpperCase()}</b>\n` +
          `💶 ${(amountCents / 100).toFixed(2)} € / mois\n` +
          `🆔 user_id : ${userId}`
        );

        console.info(`[Caissio Webhook] ✅ Nouveau client — ${userName} (${plan})`);
        break;
      }

      /* ── Abonnement mis à jour ───────────────────────────────────── */
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub    = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        const plan   = sub.metadata?.plan;
        console.info(`[Caissio Webhook] Abonnement ${sub.status} — user=${userId} plan=${plan}`);
        break;
      }

      /* ── Résiliation ─────────────────────────────────────────────── */
      case "customer.subscription.deleted": {
        const sub    = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        const plan   = sub.metadata?.plan;

        await notifyTelegram(
          `⚠️ <b>Résiliation Caissio</b>\n` +
          `👤 user_id : ${userId || "—"}\n` +
          `📦 Plan : ${plan || "—"}`
        );

        console.info(`[Caissio Webhook] ❌ Résiliation — user=${userId}`);
        break;
      }

      /* ── Paiement échoué ─────────────────────────────────────────── */
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;

        await notifyTelegram(
          `🔴 <b>Paiement échoué Caissio</b>\n` +
          `💳 customer : ${invoice.customer || "—"}\n` +
          `💶 Montant : ${((invoice.amount_due || 0) / 100).toFixed(2)} €`
        );

        console.warn(`[Caissio Webhook] ⚠️ Paiement échoué — customer=${invoice.customer}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.info(`[Caissio Webhook] 💶 Paiement OK — customer=${invoice.customer} montant=${invoice.amount_paid}`);
        break;
      }

      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Caissio Webhook] Erreur:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
