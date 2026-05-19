import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/* ══════════════════════════════════════════
   POST /api/agentconceptor/checkout

   Crée une session Stripe Checkout avec
   plusieurs agents IA en souscription.

   Body :
   {
     agents: ["chatbot", "reputation", "devis", "contenu", "fidelisation"],
     pack: boolean,
     name, email, business_name, phone, city, business_type
   }
   ══════════════════════════════════════════ */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

// Map agent ID → variable d'env du price_id Stripe
const AGENT_PRICES: Record<string, string> = {
  chatbot:      process.env.STRIPE_CHATBOT_PRICE_ID      || "",
  reputation:   process.env.STRIPE_GMB_PRICE_ID          || "",
  devis:        process.env.STRIPE_DEVIS_PRICE_ID        || "",
  contenu:      process.env.STRIPE_CONTENU_PRICE_ID      || "",
  fidelisation: process.env.STRIPE_FIDEL_PRICE_ID        || "",
};
const PACK_PRICE_ID = process.env.STRIPE_PACK_PRICE_ID || "";

// Prix unitaires (centimes) pour calcul fallback
const AGENT_AMOUNTS: Record<string, number> = {
  chatbot: 7900, reputation: 9900, devis: 14900, contenu: 9900, fidelisation: 7900,
};
const PACK_AMOUNT = 34900;

const VALID_AGENTS = Object.keys(AGENT_PRICES);
const str = (v: unknown, max = 300): string => String(v ?? "").slice(0, max).trim();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const agents: string[] = (Array.isArray(body.agents) ? body.agents : [])
      .filter((id: string) => VALID_AGENTS.includes(id))
      .slice(0, 5);
    const isPack       = Boolean(body.pack);
    const ownerEmail   = str(body.email, 200).toLowerCase();
    const ownerName    = str(body.name, 200);
    const businessName = str(body.business_name, 200);
    const phone        = str(body.phone, 30);
    const city         = str(body.city, 100);
    const businessType = str(body.business_type, 50) || "general";

    if (!ownerEmail || !ownerName || !businessName) {
      return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(ownerEmail)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }
    if (!isPack && agents.length === 0) {
      return NextResponse.json({ error: "Aucun agent sélectionné" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://webconceptor.fr";

    // Construire la liste des agents finaux
    const finalAgents = isPack ? VALID_AGENTS : agents;
    const agentsParam = encodeURIComponent(finalAgents.join(","));

    // ── Build line_items ──
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lineItems: any[] = [];
    let monthlyAmount = 0;

    if (isPack && PACK_PRICE_ID) {
      lineItems = [{ price: PACK_PRICE_ID, quantity: 1 }];
      monthlyAmount = PACK_AMOUNT;
    } else if (isPack) {
      // Pas de price_id pack → créer un price dynamique
      const customPrice = await stripe.prices.create({
        currency: "eur",
        unit_amount: PACK_AMOUNT,
        recurring: { interval: "month" },
        product_data: { name: "AGENTConceptor — Pack Complet (5 agents)" },
      });
      lineItems = [{ price: customPrice.id, quantity: 1 }];
      monthlyAmount = PACK_AMOUNT;
    } else {
      // Agents individuels
      for (const agentId of finalAgents) {
        const priceId = AGENT_PRICES[agentId];
        if (priceId) {
          lineItems.push({ price: priceId, quantity: 1 });
        } else {
          // Créer un price dynamique si pas de price_id configuré
          const agentNames: Record<string, string> = {
            chatbot: "Agent Chatbot IA", reputation: "Agent Réputation Google",
            devis: "Agent Devis IA", contenu: "Agent Contenu Réseaux", fidelisation: "Agent Fidélisation",
          };
          const customPrice = await stripe.prices.create({
            currency: "eur",
            unit_amount: AGENT_AMOUNTS[agentId] || 7900,
            recurring: { interval: "month" },
            product_data: { name: `AGENTConceptor — ${agentNames[agentId] || agentId}` },
          });
          lineItems.push({ price: customPrice.id, quantity: 1 });
        }
        monthlyAmount += AGENT_AMOUNTS[agentId] || 0;
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer_email: ownerEmail,
      line_items: lineItems,
      metadata: {
        source:         "agentconceptor",
        agents:         finalAgents.join(","),
        pack:           isPack ? "true" : "false",
        owner_name:     ownerName.slice(0, 500),
        owner_email:    ownerEmail.slice(0, 500),
        business_name:  businessName.slice(0, 500),
        phone:          phone.slice(0, 100),
        city:           city.slice(0, 100),
        business_type:  businessType.slice(0, 100),
        monthly_amount: String(monthlyAmount),
      },
      subscription_data: {
        metadata: {
          source: "agentconceptor",
          agents: finalAgents.join(","),
          owner_email: ownerEmail.slice(0, 500),
        },
      },
      success_url: `${baseUrl}/agentconceptor/merci?agents=${agentsParam}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${baseUrl}/agentconceptor`,
      locale: "fr",
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[agentconceptor/checkout] error:", err);
    return NextResponse.json({ error: "Erreur serveur lors de la création du paiement" }, { status: 500 });
  }
}
