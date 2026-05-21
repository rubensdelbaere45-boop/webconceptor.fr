import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/**
 * GET /api/caissio/subscription?session_id=cs_xxx
 * GET /api/caissio/subscription?customer_id=cus_xxx
 *
 * Retourne le statut d'abonnement d'un utilisateur depuis Stripe.
 * Appelé côté client après le retour de Stripe Checkout ou au démarrage.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const sessionId = searchParams.get("session_id");
  const customerId = searchParams.get("customer_id");

  if (!sessionId && !customerId) {
    return NextResponse.json({ error: "session_id ou customer_id requis" }, { status: 400 });
  }

  try {
    let stripeCustomerId: string | undefined;
    let subscriptionId: string | undefined;

    if (sessionId) {
      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["subscription", "customer"],
      });
      stripeCustomerId = typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;
      subscriptionId = typeof session.subscription === "string"
        ? session.subscription
        : (session.subscription as Stripe.Subscription | null)?.id;
    } else {
      stripeCustomerId = customerId!;
    }

    if (!stripeCustomerId) {
      return NextResponse.json({ status: "no_customer" });
    }

    // Récupère les abonnements actifs du customer
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "all",
      limit: 1,
      expand: ["data.items.data.price"],
    });

    const sub = subscriptions.data[0];

    if (!sub) {
      return NextResponse.json({
        stripe_customer_id: stripeCustomerId,
        status: "no_subscription",
      });
    }

    // Détermine le plan à partir du price ID
    const priceId = sub.items.data[0]?.price?.id;
    const plan = detectPlan(priceId);

    return NextResponse.json({
      stripe_customer_id: stripeCustomerId,
      subscription_id: subscriptionId || sub.id,
      subscription_status: mapStatus(sub.status),
      subscription_plan: plan,
      verified_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[Caissio] Subscription verify error:", err);
    return NextResponse.json(
      { error: "Impossible de vérifier l'abonnement" },
      { status: 500 }
    );
  }
}

function mapStatus(s: string): "trialing" | "active" | "past_due" | "cancelled" {
  if (s === "trialing") return "trialing";
  if (s === "active") return "active";
  if (s === "past_due") return "past_due";
  return "cancelled";
}

function detectPlan(priceId: string | undefined): "starter" | "pro" | "business" {
  if (!priceId) return "starter";
  if (priceId === process.env.STRIPE_CAISSIO_STARTER_PRICE_ID) return "starter";
  if (priceId === process.env.STRIPE_CAISSIO_PRO_PRICE_ID) return "pro";
  if (priceId === process.env.STRIPE_CAISSIO_BUSINESS_PRICE_ID) return "business";
  return "starter";
}
