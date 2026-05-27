import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

/* ══════════════════════════════════════════════════════════════════
   GET /api/tableflow/checkout?slug=xxx
   Crée une Stripe Checkout Session (abonnement 49€/mois)
   et redirige le restaurateur vers la page de paiement Stripe.
   ══════════════════════════════════════════════════════════════════ */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://webconceptor.fr";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug");

  if (!slug) {
    return NextResponse.json({ error: "slug manquant" }, { status: 400 });
  }

  /* Récupérer le restaurant */
  const { data: restaurant, error } = await getSupabase()
    .from("tableflow_prospects")
    .select("slug, name, email, city, is_live")
    .eq("slug", slug)
    .single();

  if (error || !restaurant) {
    return NextResponse.redirect(`${BASE_URL}/restaurant/${slug}`);
  }

  /* Si déjà actif → rediriger vers l'admin */
  if (restaurant.is_live) {
    return NextResponse.redirect(`${BASE_URL}/restaurant/${slug}`);
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: `TableFlow — Menu digital ${restaurant.name}`,
              description: "QR code sur vos tables · Carte interactive · Visualisation IA · Admin en ligne · Sans engagement",
              images: [],
            },
            unit_amount: 3900, // 39 € TTC
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      customer_email: restaurant.email || undefined,
      subscription_data: {
        trial_period_days: 14, // 14 jours gratuits
        metadata: {
          source:          "tableflow",
          slug:            restaurant.slug,
          restaurant_name: restaurant.name,
        },
      },
      metadata: {
        source:          "tableflow",
        slug:            restaurant.slug,
        restaurant_name: restaurant.name,
        city:            restaurant.city || "",
      },
      success_url: `${BASE_URL}/restaurant/${slug}/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${BASE_URL}/restaurant/${slug}`,
      locale: "fr",
      allow_promotion_codes: true,
    });

    if (!session.url) throw new Error("No session URL");

    return NextResponse.redirect(session.url);
  } catch (err) {
    console.error("[tableflow/checkout]", err);
    return NextResponse.redirect(`${BASE_URL}/restaurant/${slug}`);
  }
}
