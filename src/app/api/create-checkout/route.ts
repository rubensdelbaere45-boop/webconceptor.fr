import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

/* ══════════════════════════════════════════
   POST: Create Stripe Checkout Session
   ══════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      code,
      domain,
      domainPriceCents,
      wantsSerenite,
      buyerInfo,
    } = body;

    // Validate
    if (!code || !domain || typeof domainPriceCents !== "number" || !buyerInfo) {
      return NextResponse.json({ error: "Donnees manquantes" }, { status: 400 });
    }
    if (!buyerInfo.nom || !buyerInfo.adresse || !buyerInfo.ville || !buyerInfo.cp || !buyerInfo.email) {
      return NextResponse.json({ error: "Coordonnees acheteur incompletes" }, { status: 400 });
    }

    // Load project
    const supabase = getSupabaseAdmin();
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("code", code)
      .single();

    if (error || !project) {
      return NextResponse.json({ error: "Projet introuvable" }, { status: 404 });
    }

    if (project.status !== "sent" && project.status !== "viewed") {
      return NextResponse.json({ error: "Ce projet n'est plus disponible au paiement" }, { status: 400 });
    }

    // Save config to project
    await supabase
      .from("projects")
      .update({
        domain_name: domain,
        domain_price_cents: domainPriceCents,
        has_serenite: !!wantsSerenite,
        buyer_info: buyerInfo,
      })
      .eq("code", code);

    // Determine origin for success/cancel URLs
    const origin = req.headers.get("origin") || "https://webconceptor.fr";

    // Build line items (inferred type from usage)
    type LineItem = NonNullable<NonNullable<Parameters<typeof stripe.checkout.sessions.create>[0]>["line_items"]>[number];
    const lineItems: LineItem[] = [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Site web WebConceptor — ${project.title}`,
            description: "Creation de site web professionnel sur-mesure (livraison 5 jours)",
          },
          unit_amount: project.price_cents || 59900,
        },
        quantity: 1,
      },
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Nom de domaine ${domain}`,
            description: "Enregistrement pour 1 an",
          },
          unit_amount: domainPriceCents,
        },
        quantity: 1,
      },
    ];

    if (wantsSerenite) {
      lineItems.push({
        price_data: {
          currency: "eur",
          product_data: {
            name: "Formule Serenite — 1er mois",
            description: "Maintenance, mises a jour, hebergement, support 24h",
          },
          unit_amount: 5000,
        },
        quantity: 1,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: buyerInfo.email,
      success_url: `${origin}/code/success?c=${code}&s={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/code?c=${code}`,
      locale: "fr",
      metadata: {
        project_id: project.id,
        code: project.code,
        domain,
        has_serenite: String(!!wantsSerenite),
        buyer_nom: buyerInfo.nom,
        buyer_adresse: buyerInfo.adresse,
        buyer_cp: buyerInfo.cp,
        buyer_ville: buyerInfo.ville,
        buyer_tel: buyerInfo.telephone || "",
        buyer_email: buyerInfo.email,
      },
    });

    // Store session ID
    await supabase
      .from("projects")
      .update({ stripe_session_id: session.id })
      .eq("code", code);

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur inconnue";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
