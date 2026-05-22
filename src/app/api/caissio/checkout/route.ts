import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

const PRICE_MAP: Record<string, string | undefined> = {
  starter: process.env.STRIPE_CAISSIO_STARTER_PRICE_ID,
  pro: process.env.STRIPE_CAISSIO_PRO_PRICE_ID,
  business: process.env.STRIPE_CAISSIO_BUSINESS_PRICE_ID,
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      plan: string;
      user_id: string;
      user_email: string;
      user_name: string;
    };

    const { plan, user_id, user_email, user_name } = body;

    if (!plan || !user_id || !user_email) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const priceId = PRICE_MAP[plan];
    if (!priceId || priceId.startsWith("price_REMPLACER") || priceId === "") {
      return NextResponse.json(
        { error: "Prix non configuré. Ajoutez STRIPE_CAISSIO_*_PRICE_ID dans Vercel" },
        { status: 503 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: user_email,
      client_reference_id: user_id,
      metadata: { user_id, plan, user_name },
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${baseUrl}/caissio/app/abonnement?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/caissio/app/abonnement?cancelled=true`,
      subscription_data: {
        metadata: { user_id, plan },
        trial_period_days: undefined, // trial géré en local
      },
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      locale: "fr",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[Caissio] Checkout error:", err);
    return NextResponse.json(
      { error: "Impossible de créer la session de paiement" },
      { status: 500 }
    );
  }
}
