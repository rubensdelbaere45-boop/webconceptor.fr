import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-03-25.dahlia",
});

/**
 * POST /api/caissio/webhook
 *
 * Gère les événements Stripe :
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_failed
 *
 * Architecture localStorage : les données sont locales au navigateur,
 * le webhook ne peut pas mettre à jour directement localStorage.
 * Le client vérifie son statut au démarrage via /api/caissio/subscription.
 * Ce webhook est utile pour des logs serveur et pour une future base de données.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.CAISSIO_STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    console.warn("[Caissio Webhook] Signature ou secret manquant");
    return NextResponse.json({ error: "Configuration webhook manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("[Caissio Webhook] Signature invalide:", err);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        const plan = sub.metadata?.plan;
        console.info(`[Caissio Webhook] Abonnement ${sub.status} pour user=${userId} plan=${plan}`);
        // TODO: si base de données ajoutée — mettre à jour le statut
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = sub.metadata?.user_id;
        console.info(`[Caissio Webhook] Abonnement annulé pour user=${userId}`);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.warn(`[Caissio Webhook] Paiement échoué — customer=${invoice.customer}`);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.info(`[Caissio Webhook] Paiement OK — customer=${invoice.customer} montant=${invoice.amount_paid}`);
        break;
      }

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.info(`[Caissio Webhook] Checkout complété — user=${session.client_reference_id}`);
        break;
      }

      default:
        // Événement non géré — normal, on l'ignore
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[Caissio Webhook] Erreur de traitement:", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}

// Désactive le body parser par défaut de Next.js (Stripe a besoin du body brut)
export const config = {
  api: { bodyParser: false },
};
