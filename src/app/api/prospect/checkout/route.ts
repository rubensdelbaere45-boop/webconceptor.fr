import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { rateLimit, getClientIp } from "@/lib/security";

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
   POST /api/prospect/checkout
   Endpoint PUBLIC — appelé directement depuis le modal "Obtenir ce site"
   de la maquette. Crée une Stripe Checkout Session avec les line items
   adaptés au plan choisi, retourne l'URL de redirection.

   Pas d'authentification (n'importe quel prospect peut payer).
   Rate limit protège contre les abus.

   Body :
   {
     prospect_slug: string,          // identifie le prospect/maquette
     plan: "simple" | "serenite",   // plan choisi
     domain?: { name, tld, priceCents },  // si serenite
     buyer: { nom, email, telephone, adresse, ville, cp }
   }

   Retourne : { url: string }  // Stripe Checkout URL
   ══════════════════════════════════════════ */

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const DOMAIN_RE = /^[a-z0-9](-?[a-z0-9])+$/i;
const TLD_RE = /^[a-z]{2,8}$/i;

const ALLOWED_ORIGINS = new Set([
  "https://webconceptor.fr",
  "https://www.webconceptor.fr",
  "http://localhost:3000",
]);

export async function POST(req: NextRequest) {
  // Rate limit : 5 tentatives / 10 min / IP (protection contre abus)
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`prospect-checkout:${ip}`, 5, 600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Trop de tentatives. Reessayez dans ${rl.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let raw: Record<string, unknown>;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const str = (v: unknown, max = 450): string => String(v ?? "").slice(0, max).trim();

  const prospect_slug = str(raw.prospect_slug, 100);
  const plan = raw.plan === "serenite" ? "serenite" : "simple";
  const rawDomain = (raw.domain ?? null) as Record<string, unknown> | null;
  const rawBuyer = (raw.buyer ?? {}) as Record<string, unknown>;

  if (!prospect_slug) {
    return NextResponse.json({ error: "Maquette non identifiée" }, { status: 400 });
  }

  const buyer = {
    nom: str(rawBuyer.nom, 120),
    email: str(rawBuyer.email, 200).toLowerCase(),
    telephone: str(rawBuyer.telephone, 30),
    adresse: str(rawBuyer.adresse, 200),
    ville: str(rawBuyer.ville, 100),
    cp: str(rawBuyer.cp, 20),
  };

  if (!buyer.nom || !buyer.email || !buyer.telephone || !buyer.adresse || !buyer.ville || !buyer.cp) {
    return NextResponse.json({ error: "Coordonnées acheteur incomplètes" }, { status: 400 });
  }
  if (!EMAIL_RE.test(buyer.email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (buyer.telephone.length < 6) {
    return NextResponse.json({ error: "Téléphone invalide" }, { status: 400 });
  }

  // Validate domain if provided
  let domainFull = "";
  let domainPriceCents = 0;
  if (plan === "serenite" && rawDomain) {
    const domainName = str(rawDomain.name, 63).toLowerCase();
    const domainTld = str(rawDomain.tld, 10).toLowerCase();
    const priceNum = typeof rawDomain.priceCents === "number" ? rawDomain.priceCents : NaN;
    if (!DOMAIN_RE.test(domainName) || !TLD_RE.test(domainTld)) {
      return NextResponse.json({ error: "Nom de domaine invalide" }, { status: 400 });
    }
    if (!Number.isFinite(priceNum) || priceNum < 0 || priceNum > 50000) {
      return NextResponse.json({ error: "Prix de domaine invalide" }, { status: 400 });
    }
    domainFull = `${domainName}.${domainTld}`;
    domainPriceCents = Math.round(priceNum);
  }

  // Load prospect
  const supabase = getSupabaseAdmin();
  const { data: prospect, error: findErr } = await supabase
    .from("prospects")
    .select("id, name, slug, city, business_type, mockup_html")
    .eq("slug", prospect_slug)
    .maybeSingle();

  if (findErr || !prospect) {
    return NextResponse.json({ error: "Maquette introuvable" }, { status: 404 });
  }
  if (!prospect.mockup_html) {
    return NextResponse.json({ error: "Cette maquette n'est pas finalisée" }, { status: 400 });
  }

  // Construct line items
  type LineItem = NonNullable<NonNullable<Parameters<typeof stripe.checkout.sessions.create>[0]>["line_items"]>[number];
  const lineItems: LineItem[] = [
    {
      price_data: {
        currency: "eur",
        product_data: {
          name: `Site web WebConceptor — ${prospect.name}`,
          description: plan === "serenite"
            ? "Création sur-mesure + hébergement + modifications illimitées"
            : "Création sur-mesure, livraison 5 jours",
        },
        unit_amount: 59900,
      },
      quantity: 1,
    },
  ];

  if (plan === "serenite" && domainFull && domainPriceCents > 0) {
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: {
          name: `Nom de domaine ${domainFull}`,
          description: "Enregistrement pour 1 an",
        },
        unit_amount: domainPriceCents,
      },
      quantity: 1,
    });
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: {
          name: "Formule Sérénité — 1er mois",
          description: "Hébergement + mises à jour illimitées + support",
        },
        unit_amount: 5000,
      },
      quantity: 1,
    });
  }

  // Origin allow-list (empêche qu'un attaquant forge le success_url)
  const reqOrigin = req.headers.get("origin") || "";
  const origin = ALLOWED_ORIGINS.has(reqOrigin) ? reqOrigin : "https://webconceptor.fr";

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card", "klarna", "paypal"],
      line_items: lineItems,
      customer_email: buyer.email,
      success_url: `${origin}/prospect/success?slug=${encodeURIComponent(prospect.slug)}&s={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/prospects/${encodeURIComponent(prospect.slug)}`,
      locale: "fr",
      metadata: {
        source: "self_serve_mockup",
        prospect_id: prospect.id,
        prospect_slug: prospect.slug,
        prospect_name: prospect.name.slice(0, 200),
        plan,
        domain: domainFull || "",
        has_serenite: plan === "serenite" ? "true" : "false",
        buyer_nom: buyer.nom,
        buyer_email: buyer.email,
        buyer_tel: buyer.telephone,
        buyer_adresse: buyer.adresse.slice(0, 200),
        buyer_cp: buyer.cp,
        buyer_ville: buyer.ville,
      },
    });

    // Log la tentative de paiement en DB (prospect → status="payment_initiated")
    // On ne change pas "status" (il a un CHECK constraint) mais on log en notes.
    await supabase
      .from("prospects")
      .update({
        notes: `Stripe session created ${new Date().toISOString()} — ${plan} — session ${session.id}`,
      })
      .eq("id", prospect.id);

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[prospect/checkout] Stripe error:", err);
    return NextResponse.json(
      { error: "Impossible de créer la session de paiement. Réessayez ou contactez contact@webconceptor.fr." },
      { status: 500 }
    );
  }
}
