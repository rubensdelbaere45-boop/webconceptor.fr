import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/* ══════════════════════════════════════════
   POST /api/gmb/checkout

   Crée une session Stripe Checkout pour
   l'abonnement Agent Avis Google (149€/mois).
   ══════════════════════════════════════════ */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

const str = (v: unknown, max = 300): string => String(v ?? "").slice(0, max).trim();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const businessName  = str(body.business_name, 200);
    const ownerEmail    = str(body.email, 200).toLowerCase();
    const ownerName     = str(body.name, 200);
    const phone         = str(body.phone, 30);
    const businessType  = str(body.business_type, 50) || "general";
    const city          = str(body.city, 100);
    const responseTone  = str(body.response_tone, 30) || "professionnel";

    if (!businessName || !ownerEmail || !ownerName) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ownerEmail)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const priceId = process.env.STRIPE_GMB_PRICE_ID || "price_gmb_149_monthly";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://klyora.fr";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: ownerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        source:         "gmb_subscription",
        business_name:  businessName.slice(0, 500),
        owner_name:     ownerName.slice(0, 500),
        owner_email:    ownerEmail.slice(0, 500),
        phone:          phone.slice(0, 100),
        business_type:  businessType.slice(0, 100),
        city:           city.slice(0, 100),
        response_tone:  responseTone.slice(0, 50),
      },
      success_url: `${baseUrl}/services/avis-google/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/services/avis-google`,
      locale: "fr",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[gmb/checkout] error:", err);
    return NextResponse.json({ error: "Erreur lors de la création du paiement" }, { status: 500 });
  }
}
