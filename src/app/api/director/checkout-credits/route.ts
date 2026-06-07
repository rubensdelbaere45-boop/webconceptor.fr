/**
 * POST /api/director/checkout-credits
 * Body : { pack_id }
 * → crée une session Stripe Checkout pour recharger des crédits.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getServiceClient, getSessionUser } from "@/lib/director/auth";

export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { pack_id?: string } = {};
  try { body = await req.json(); } catch { /* opt */ }
  if (!body.pack_id) return NextResponse.json({ error: "pack_id requis" }, { status: 400 });

  const supabase = getServiceClient();
  const { data: pack } = await supabase
    .from("director_credit_packs")
    .select("*")
    .eq("id", body.pack_id)
    .eq("is_active", true)
    .maybeSingle();
  if (!pack) return NextResponse.json({ error: "Pack introuvable" }, { status: 404 });

  const { data: acc } = await supabase
    .from("director_accounts")
    .select("id, email, business_name, stripe_customer_id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!acc) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  const origin = req.nextUrl.origin;
  const totalCredits = pack.credits + (pack.bonus_credits || 0);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      customer_email: acc.stripe_customer_id ? undefined : acc.email,
      customer: acc.stripe_customer_id || undefined,
      line_items: [{
        price_data: {
          currency: "eur",
          product_data: {
            name: `Pack ${pack.name} — ${totalCredits} crédits WebDirector`,
            description: `${pack.credits} crédits${pack.bonus_credits > 0 ? ` + ${pack.bonus_credits} bonus` : ""}`,
          },
          unit_amount: Math.round(pack.price_eur * 100),
        },
        quantity: 1,
      }],
      success_url: `${origin}/director/dashboard?recharged=${pack.id}`,
      cancel_url: `${origin}/director/dashboard?canceled=true`,
      locale: "fr",
      metadata: {
        source: "director_recharge",
        account_id: acc.id,
        pack_id: pack.id,
        credits: String(pack.credits),
        bonus_credits: String(pack.bonus_credits || 0),
        total_credits: String(totalCredits),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Erreur Stripe" }, { status: 500 });
  }
}
