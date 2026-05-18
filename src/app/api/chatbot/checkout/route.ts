import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

/* ══════════════════════════════════════════
   POST /api/chatbot/checkout

   Crée une session Stripe Checkout pour
   l'abonnement Chatbot IA (79€/mois).

   Le webhook Stripe gérera la livraison
   automatique (email + création du record).
   ══════════════════════════════════════════ */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const str = (v: unknown, max = 300): string => String(v ?? "").slice(0, max).trim();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const businessName = str(body.business_name, 200);
    const ownerEmail   = str(body.email, 200).toLowerCase();
    const ownerName    = str(body.name, 200);
    const phone        = str(body.phone, 30);
    const businessType = str(body.business_type, 50) || "general";
    const city         = str(body.city, 100);

    if (!businessName || !ownerEmail || !ownerName) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ownerEmail)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    // Prix Stripe — variable d'env ou price_id hardcodé
    const priceId = process.env.STRIPE_CHATBOT_PRICE_ID || "price_chatbot_79_monthly";

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: ownerEmail,
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        source:        "chatbot_subscription",
        business_name: businessName.slice(0, 500),
        owner_name:    ownerName.slice(0, 500),
        owner_email:   ownerEmail.slice(0, 500),
        phone:         phone.slice(0, 100),
        business_type: businessType.slice(0, 100),
        city:          city.slice(0, 100),
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://webconceptor.fr"}/services/chatbot/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.NEXT_PUBLIC_APP_URL || "https://webconceptor.fr"}/services/chatbot`,
      locale: "fr",
      subscription_data: {
        metadata: {
          source:        "chatbot_subscription",
          business_name: businessName.slice(0, 500),
          owner_email:   ownerEmail.slice(0, 500),
        },
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[chatbot/checkout] error:", err);
    return NextResponse.json({ error: "Erreur lors de la création du paiement" }, { status: 500 });
  }
}
