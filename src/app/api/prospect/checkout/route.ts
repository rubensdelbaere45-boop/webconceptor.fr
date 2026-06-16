import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { rateLimit, getClientIp } from "@/lib/security";
import {
  SETUP_FEE_CENTS,
  HOSTING_MONTHLY_CENTS,
  ADDON_MONTHLY_CENTS,
  ADDON_LABELS,
  recurringStripeUnitCents,
  type PlanTier,
  type Frequency,
  type AddonKey,
} from "@/lib/checkout-pricing";

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
   POST /api/prospect/checkout — V2 MRR
   ─ Site web (320€ Simple / 860€ Luxury) = setup fee one-time
   ─ Hébergement de base = abonnement récurrent (mois ou année -10%)
   ─ Upsells choisis = lignes récurrentes additionnelles
   ─ Stripe mode "subscription" avec mix one-time + recurring
   ══════════════════════════════════════════ */

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const DOMAIN_RE = /^[a-z0-9](-?[a-z0-9])+$/i;
const TLD_RE = /^[a-z]{2,8}$/i;

const ALLOWED_ORIGINS = new Set([
  "https://klyora.fr",
  "https://www.klyora.fr",
  "http://localhost:3000",
]);

const VALID_ADDONS: AddonKey[] = ["universel", "restaurant", "artisan"];

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`prospect-checkout:${ip}`, 20, 600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Trop de tentatives. Reessayez dans ${rl.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let raw: Record<string, unknown>;
  try { raw = await req.json(); } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const str = (v: unknown, max = 450): string => String(v ?? "").slice(0, max).trim();

  const prospect_slug = str(raw.prospect_slug, 100);

  // ─── Nouveau format V2 ───
  // tier : "simple" | "luxury"   (anciens noms : "simple" et "serenite" tolérés)
  // frequency : "monthly" | "yearly"
  // addons : ["universel", "restaurant", "artisan"]
  let tier: PlanTier =
    raw.tier === "luxury" || raw.plan === "luxury" ? "luxury" : "simple";
  // rétrocompat : ancien plan "serenite" = simple + hosting (toujours le cas désormais)
  if (raw.plan === "serenite") tier = tier === "luxury" ? "luxury" : "simple";

  const frequency: Frequency = raw.frequency === "yearly" ? "yearly" : "monthly";

  const rawAddons = Array.isArray(raw.addons) ? raw.addons : [];
  const addons: AddonKey[] = rawAddons
    .map((a) => String(a))
    .filter((a): a is AddonKey => VALID_ADDONS.includes(a as AddonKey));

  const rawDomain = (raw.domain ?? null) as Record<string, unknown> | null;
  const rawBuyer = (raw.buyer ?? {}) as Record<string, unknown>;
  const promoCode = typeof raw.promo_code === "string" ? raw.promo_code.slice(0, 30).toUpperCase() : null;

  if (!prospect_slug) {
    return NextResponse.json({ error: "Maquette non identifiée" }, { status: 400 });
  }

  const buyer = {
    prenom: str(rawBuyer.prenom, 60),
    nom: str(rawBuyer.nom, 60),
    email: str(rawBuyer.email, 200).toLowerCase(),
    telephone: str(rawBuyer.telephone, 30),
    adresse: str(rawBuyer.adresse, 200),
    ville: str(rawBuyer.ville, 100),
    cp: str(rawBuyer.cp, 20),
    entreprise: str(rawBuyer.entreprise, 120),
  };

  if (!buyer.prenom && buyer.nom.includes(" ")) {
    const parts = buyer.nom.trim().split(/\s+/);
    buyer.prenom = parts[0].slice(0, 60);
    buyer.nom = parts.slice(1).join(" ").slice(0, 60);
  }

  if (!buyer.prenom || !buyer.nom || !buyer.email || !buyer.telephone) {
    return NextResponse.json({ error: "Prénom, nom, email et téléphone requis" }, { status: 400 });
  }
  if (!buyer.adresse || !buyer.ville || !buyer.cp) {
    return NextResponse.json({ error: "Adresse complète requise pour l'enregistrement du nom de domaine" }, { status: 400 });
  }
  if (!EMAIL_RE.test(buyer.email)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }
  if (buyer.telephone.length < 6) {
    return NextResponse.json({ error: "Téléphone invalide" }, { status: 400 });
  }
  if (!/^\d{4,6}$/.test(buyer.cp)) {
    return NextResponse.json({ error: "Code postal invalide" }, { status: 400 });
  }

  // Domaine
  let domainFull = "";
  let domainPriceCents = 0;
  if (rawDomain) {
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

  const reqOrigin = req.headers.get("origin") || "";
  const origin = ALLOWED_ORIGINS.has(reqOrigin) ? reqOrigin : "https://klyora.fr";

  const sharedMeta = {
    source: "self_serve_mockup_v2",
    prospect_id: prospect.id,
    prospect_slug: prospect.slug,
    prospect_name: prospect.name.slice(0, 200),
    tier,
    frequency,
    addons: addons.join(","),
    domain: domainFull || "",
    buyer_prenom: buyer.prenom,
    buyer_nom: buyer.nom,
    buyer_nom_complet: `${buyer.prenom} ${buyer.nom}`.slice(0, 200),
    buyer_entreprise: buyer.entreprise.slice(0, 200),
    buyer_email: buyer.email,
    buyer_tel: buyer.telephone,
    buyer_adresse: buyer.adresse.slice(0, 200),
    buyer_cp: buyer.cp,
    buyer_ville: buyer.ville,
  };

  const successUrl = `${origin}/prospect/success?slug=${encodeURIComponent(prospect.slug)}&s={CHECKOUT_SESSION_ID}`;
  const cancelUrl  = `${origin}/prospects/${encodeURIComponent(prospect.slug)}`;

  // ─── Construit les line items pour Stripe Checkout en mode subscription ───
  // Stripe Checkout subscription accepte MIX one-time + recurring depuis 2023.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineItems: any[] = [];

  const interval = frequency === "yearly" ? "year" : "month";

  // 1) Setup fee site web (one-time)
  lineItems.push({
    price_data: {
      currency: "eur",
      product_data: {
        name: tier === "luxury"
          ? `Création Exclusive — ${prospect.name}`
          : `Site web Simple — ${prospect.name}`,
        description: tier === "luxury"
          ? "Design exclusif sur-mesure, livraison 7 jours · frais de configuration uniques"
          : "Création sur-mesure, livraison quelques minutes · frais de configuration uniques",
      },
      unit_amount: SETUP_FEE_CENTS[tier],
    },
    quantity: 1,
  });

  // 2) Hébergement de base (récurrent)
  lineItems.push({
    price_data: {
      currency: "eur",
      product_data: {
        name: `Hébergement ${tier === "luxury" ? "Luxury" : "Simple"} (${frequency === "yearly" ? "annuel" : "mensuel"})`,
        description: tier === "luxury"
          ? "Hébergement premium SSD, sauvegardes quotidiennes, SSL, modifications illimitées"
          : "Hébergement SSD, sauvegardes hebdo, SSL, support 24h",
      },
      unit_amount: recurringStripeUnitCents(HOSTING_MONTHLY_CENTS[tier], frequency),
      recurring: { interval: interval as "month" | "year" },
    },
    quantity: 1,
  });

  // 3) Addons (récurrents)
  for (const a of addons) {
    const lbl = ADDON_LABELS[a];
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: `${lbl.name} (${frequency === "yearly" ? "annuel" : "mensuel"})`, description: lbl.description },
        unit_amount: recurringStripeUnitCents(ADDON_MONTHLY_CENTS[a], frequency),
        recurring: { interval: interval as "month" | "year" },
      },
      quantity: 1,
    });
  }

  // 4) Domaine (one-time si fourni)
  if (domainFull && domainPriceCents > 0) {
    lineItems.push({
      price_data: {
        currency: "eur",
        product_data: { name: `Nom de domaine ${domainFull}`, description: "Enregistrement pour 1 an" },
        unit_amount: domainPriceCents,
      },
      quantity: 1,
    });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: buyer.email,
      ...(promoCode ? { discounts: [{ coupon: promoCode }] } : {}),
      success_url: successUrl,
      cancel_url:  cancelUrl,
      locale: "fr",
      metadata: sharedMeta,
      subscription_data: {
        description: `Abonnement Klyora Sites ${tier} — ${frequency === "yearly" ? "annuel" : "mensuel"}`,
        metadata: sharedMeta,
      },
    });

    await supabase
      .from("prospects")
      .update({
        notes: `Stripe V2 session created ${new Date().toISOString()} — tier=${tier} freq=${frequency} addons=${addons.join("|")} — session ${session.id}`,
      })
      .eq("id", prospect.id);

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("[prospect/checkout V2] Stripe error:", err);
    return NextResponse.json(
      { error: "Impossible de créer la session de paiement. Réessayez ou contactez contact@klyora.fr." },
      { status: 500 }
    );
  }
}
