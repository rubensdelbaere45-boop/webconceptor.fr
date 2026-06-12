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
    let raw: Record<string, unknown>;
    try {
      raw = await req.json();
    } catch {
      return NextResponse.json({ error: "Requete invalide" }, { status: 400 });
    }

    const str = (v: unknown, max = 450): string => String(v ?? "").slice(0, max);

    const code = str(raw.code, 6);
    const domain = str(raw.domain, 253).toLowerCase();
    const domainPriceCents = typeof raw.domainPriceCents === "number" ? raw.domainPriceCents : NaN;
    const wantsSerenite = Boolean(raw.wantsSerenite);
    const rawBuyer = (raw.buyerInfo ?? {}) as Record<string, unknown>;

    // Validate
    if (!code || code.length !== 6) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }
    if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain)) {
      return NextResponse.json({ error: "Domaine invalide" }, { status: 400 });
    }
    if (!Number.isFinite(domainPriceCents) || domainPriceCents < 0 || domainPriceCents > 50000) {
      return NextResponse.json({ error: "Prix domaine invalide" }, { status: 400 });
    }

    const buyerInfo = {
      nom: str(rawBuyer.nom, 200),
      adresse: str(rawBuyer.adresse, 200),
      ville: str(rawBuyer.ville, 100),
      cp: str(rawBuyer.cp, 20),
      telephone: str(rawBuyer.telephone, 30),
      email: str(rawBuyer.email, 200),
    };

    if (!buyerInfo.nom || !buyerInfo.adresse || !buyerInfo.ville || !buyerInfo.cp || !buyerInfo.email) {
      return NextResponse.json({ error: "Coordonnees acheteur incompletes" }, { status: 400 });
    }
    if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(buyerInfo.email)) {
      return NextResponse.json({ error: "Email acheteur invalide" }, { status: 400 });
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

    // Determine origin for success/cancel URLs — allow-list known origins,
    // otherwise fall back to prod. Prevents an attacker from crafting a checkout
    // that sends Stripe success redirect to a malicious site.
    const ALLOWED_ORIGINS = new Set([
      "https://webconceptor.fr",
      "https://www.webconceptor.fr",
      "http://localhost:3000",
    ]);
    const reqOrigin = req.headers.get("origin") || "";
    const origin = ALLOWED_ORIGINS.has(reqOrigin) ? reqOrigin : "https://webconceptor.fr";

    // Build line items (inferred type from usage)
    type LineItem = NonNullable<NonNullable<Parameters<typeof stripe.checkout.sessions.create>[0]>["line_items"]>[number];
    const lineItems: LineItem[] = [
      {
        price_data: {
          currency: "eur",
          product_data: {
            name: `Site web Klyora Sites — ${project.title}`,
            description: "Creation de site web professionnel sur-mesure (livraison 5 jours)",
          },
          unit_amount: project.price_cents || 32000,
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
      // Méthodes de paiement :
      // - 'card' : carte bancaire classique (Visa/MC/Amex)
      // - 'klarna' : Paiement en 3× OU 4× sans frais (client paye ~107€/mois,
      //   tu encaisses 199€ immédiatement, Klarna prend le risque)
      // - 'paypal' : au cas où certains préfèrent
      // Si Klarna pas encore activé dans le dashboard Stripe, ignoré silencieusement
      payment_method_types: ["card", "klarna", "paypal"],
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
    // Log full error server-side, return generic message to client (don't leak Stripe keys/IDs)
    console.error("[create-checkout] error:", err);
    return NextResponse.json({ error: "Impossible de creer la session de paiement." }, { status: 500 });
  }
}
