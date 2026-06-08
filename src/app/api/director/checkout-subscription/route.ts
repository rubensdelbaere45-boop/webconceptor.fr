/**
 * POST /api/director/checkout-subscription
 * Body : { plan: "monthly" | "yearly" }
 * → crée une session Stripe Checkout en mode subscription.
 *
 * Tarifs WebDirector :
 *   - monthly : 29,90 €/mois
 *   - yearly  : 320 €/an
 */
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceClient, getSessionUser } from "@/lib/director/auth";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

const PLANS = {
  monthly: { amount: 2990, interval: "month" as const, label: "Mensuel" },
  yearly:  { amount: 32000, interval: "year" as const,  label: "Annuel" },
};

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { plan?: "monthly" | "yearly" } = {};
  try { body = await req.json(); } catch { /* opt */ }
  const plan = body.plan || "monthly";
  if (!PLANS[plan]) return NextResponse.json({ error: "plan invalide (monthly | yearly)" }, { status: 400 });

  const supabase = getServiceClient();
  const { data: acc } = await supabase
    .from("director_accounts")
    .select("id, email, business_name, stripe_customer_id, is_subscribed")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!acc) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  if (acc.is_subscribed) {
    return NextResponse.json({ error: "Vous êtes déjà abonné. Voir le portail de facturation." }, { status: 400 });
  }

  const p = PLANS[plan];
  const origin = req.nextUrl.origin;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: acc.stripe_customer_id ? undefined : acc.email,
      customer: acc.stripe_customer_id || undefined,
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: `WebDirector — Abonnement ${p.label}`,
            description: plan === "yearly"
              ? "Accès illimité à tous les agents IA. Économie de 38,80 € vs mensuel."
              : "Accès illimité à tous les agents IA. Résiliable à tout moment.",
          },
          unit_amount: p.amount,
          recurring: { interval: p.interval },
        },
        quantity: 1,
      }],
      success_url: `${origin}/director/dashboard?subscribed=${plan}`,
      cancel_url: `${origin}/director/billing?canceled=true`,
      locale: "fr",
      subscription_data: {
        metadata: {
          source: "director_subscription",
          account_id: acc.id,
          plan,
        },
      },
      metadata: {
        source: "director_subscription",
        account_id: acc.id,
        plan,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur Stripe" }, { status: 500 });
  }
}
