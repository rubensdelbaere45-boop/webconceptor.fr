/**
 * POST /api/admin/deployeur — Agent 4 de la Fleet
 *
 * Mission : onboarding automatique après paiement Stripe réussi.
 * Polling-based (alternative au webhook Stripe direct pour redondance) :
 *
 *   1. Trouve commandes status='paid' MAIS pas encore déployées
 *      (deployed_at IS NULL)
 *   2. Pour chaque :
 *      a. Vérifie qu'on a bien un nom de domaine choisi
 *      b. Appelle l'API IONOS pour enregistrer le domaine
 *      c. Envoie l'email de bienvenue avec lien dashboard + facture
 *      d. Notif Telegram "🎉 NOUVEAU CLIENT PAYÉ"
 *      e. Marque deployed_at + welcome_email_sent_at
 *
 * Notes :
 *   - Le webhook Stripe (/api/stripe-webhook) gère déjà la majorité des cas
 *     en temps réel. Ce déployeur sert de FILET DE SÉCURITÉ pour rattraper
 *     les commandes loupées par le webhook (cas: webhook timeout, retry,
 *     redéploiement Vercel pendant l'event).
 *   - Si IONOS_API_KEY absente, on saute juste l'achat domaine et on envoie
 *     quand même le welcome avec mention "domaine à activer manuellement".
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, requireAdminGuard, escapeTelegram } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

interface Order {
  id: string;
  prospect_id: string | null;
  prospect_slug: string | null;
  prospect_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  buyer_prenom: string | null;
  buyer_nom: string | null;
  buyer_adresse: string | null;
  buyer_cp: string | null;
  buyer_ville: string | null;
  domain: string | null;
  total_cents: number | null;
  stripe_session_id: string | null;
  stripe_subscription_id: string | null;
  tier: string | null;
  status: string;
  deployed_at: string | null;
  welcome_email_sent_at: string | null;
  ionos_domain_status: string | null;
}

async function registerDomainViaIonos(
  domain: string,
  buyer: { firstName: string; lastName: string; email: string; phone: string; address: string; postalCode: string; city: string }
): Promise<{ ok: boolean; status: "registered" | "pending" | "skipped" | "error"; detail?: string }> {
  const apiKey = process.env.IONOS_API_KEY;
  const orgId = process.env.IONOS_ORG_ID;
  if (!apiKey || !orgId) {
    return { ok: true, status: "skipped", detail: "IONOS credentials non configurées — domaine à activer manuellement" };
  }

  try {
    const res = await fetch(`https://api.hosting.ionos.com/domains/v1/domainorders`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        domainNames: [domain],
        ownerContact: {
          type: "INDIVIDUAL",
          firstName: buyer.firstName,
          lastName: buyer.lastName,
          email: buyer.email,
          phone: buyer.phone,
          street: buyer.address,
          postalCode: buyer.postalCode,
          city: buyer.city,
          country: "FR",
        },
        adminContact: { reuseOwnerContact: true },
        techContact:  { reuseOwnerContact: true },
        billingContact: { reuseOwnerContact: true },
        period: { unit: "YEAR", value: 1 },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      return { ok: false, status: "error", detail: `IONOS HTTP ${res.status}: ${txt.slice(0, 300)}` };
    }
    const data = await res.json().catch(() => ({}));
    const orderStatus = data?.status || "pending";
    return { ok: true, status: orderStatus === "DONE" ? "registered" : "pending", detail: data?.id };
  } catch (e) {
    return { ok: false, status: "error", detail: e instanceof Error ? e.message : "network" };
  }
}

async function sendWelcomeEmail(to: string, firstName: string, orderId: string, domain: string | null, totalEuros: number, tier: string, ionosStatus: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, error: "BREVO_API_KEY manquante" };

  const domainBlock = domain
    ? (ionosStatus === "registered"
        ? `<p>✅ Votre nom de domaine <strong>${domain}</strong> est en cours d'enregistrement (24-48h max).</p>`
        : ionosStatus === "skipped"
          ? `<p>📌 Votre nom de domaine <strong>${domain}</strong> sera activé manuellement sous 48h. Tom revient vers vous.</p>`
          : `<p>⚠️ Petit délai sur le domaine <strong>${domain}</strong> — Tom vous écrit dans la journée.</p>`)
    : "";

  const subject = `🎉 Bienvenue chez Klyora Sites, ${firstName} — commande #${orderId.slice(0, 8)}`;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:580px;margin:0 auto;padding:20px;color:#1a1a1a">

<h1 style="font-size:22px;margin:0 0 8px">Merci ${firstName} 🙏</h1>
<p>Votre commande Klyora Sites (formule <strong>${tier}</strong>) est confirmée pour <strong>${totalEuros.toFixed(2).replace(".", ",")} €</strong>.</p>

${domainBlock}

<h2 style="font-size:16px;margin-top:24px">Prochaines étapes</h2>
<ol style="font-size:14px;line-height:1.7">
  <li>Tom prend contact dans les 24h pour valider votre maquette finale</li>
  <li>Mise en ligne instantanément ouvrables (7 jours en Luxury)</li>
  <li>Vous recevrez un accès admin pour vos modifications</li>
</ol>

<p style="margin-top:20px">📱 Question urgente ? Appelez Tom : <strong>06 35 59 24 71</strong></p>

<p style="font-size:12px;color:#666;margin-top:30px">Votre facture est disponible dans votre espace Stripe (lien dans l'email Stripe séparé).</p>
<p style="font-size:12px;color:#666">Commande : #${orderId}</p>

</body></html>`;

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "Tom — Klyora Sites", email: "contact@klyora.fr" },
        replyTo: { name: "Tom", email: "contact@klyora.fr" },
        to: [{ email: to, name: firstName }],
        subject,
        htmlContent: html,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, error: `Brevo HTTP ${res.status}: ${t.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  }
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const adminOK = safeCompare(adminKey, process.env.ADMIN_SECRET_KEY);
  const cronOK = safeCompare(cronSecret, process.env.CRON_SECRET);
  if (!adminOK && !cronOK) {
    const guard = requireAdminGuard(req, { limit: 12, windowSec: 60, routeKey: "deployeur" });
    if (guard) return guard;
  }

  const supabase = db();

  // Cible : commandes payées mais pas encore déployées
  const { data: orders, error } = await supabase
    .from("orders")
    .select("*")
    .eq("status", "paid")
    .is("deployed_at", null)
    .order("created_at", { ascending: true })
    .limit(10);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!orders || orders.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucune commande à déployer" });
  }

  const results: Array<{ id: string; domain: string | null; ionos: string; welcome: boolean }> = [];

  for (const o of orders as Order[]) {
    // 1) Achat domaine (si fourni)
    let ionosStatus = "skipped";
    let ionosDetail = "";
    if (o.domain) {
      const buyer = {
        firstName: o.buyer_prenom || "",
        lastName: o.buyer_nom || "",
        email: o.customer_email || "",
        phone: o.customer_phone || "",
        address: o.buyer_adresse || "",
        postalCode: o.buyer_cp || "",
        city: o.buyer_ville || "",
      };
      if (buyer.firstName && buyer.lastName && buyer.email && buyer.phone && buyer.address && buyer.city && buyer.postalCode) {
        const r = await registerDomainViaIonos(o.domain, buyer);
        ionosStatus = r.status;
        ionosDetail = r.detail || "";
      } else {
        ionosStatus = "skipped";
        ionosDetail = "Coordonnées acheteur incomplètes pour IONOS";
      }
    }

    // 2) Welcome email
    let welcomeOk = false;
    if (o.customer_email && !o.welcome_email_sent_at) {
      const r = await sendWelcomeEmail(
        o.customer_email,
        o.buyer_prenom || "Bonjour",
        o.id,
        o.domain || null,
        (o.total_cents || 0) / 100,
        o.tier || "simple",
        ionosStatus,
      );
      welcomeOk = r.ok;
    }

    // 3) Update DB
    await supabase.from("orders").update({
      deployed_at: new Date().toISOString(),
      welcome_email_sent_at: welcomeOk ? new Date().toISOString() : o.welcome_email_sent_at,
      ionos_domain_status: ionosStatus,
      ionos_detail: ionosDetail.slice(0, 500),
    }).eq("id", o.id);

    // 4) Telegram alerte succès paiement
    const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
    if (tg && chat) {
      const msg =
        `🎉 <b>NOUVEAU CLIENT PAYÉ</b>\n\n` +
        `<b>${escapeTelegram(o.prospect_name || "Client")}</b>\n` +
        `Formule : ${escapeTelegram(o.tier || "?")}\n` +
        `Montant : <b>${((o.total_cents || 0) / 100).toFixed(2)} €</b>\n` +
        `Domaine : ${o.domain || "(non fourni)"} — ${ionosStatus}\n` +
        `Email : ${escapeTelegram(o.customer_email || "?")}\n` +
        `Welcome envoyé : ${welcomeOk ? "✅" : "❌"}\n\n` +
        `<i>Penser à lancer la maquette finale dans la journée.</i>`;
      fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text: msg, parse_mode: "HTML" }),
      }).catch(() => {});
    }

    results.push({ id: o.id, domain: o.domain || null, ionos: ionosStatus, welcome: welcomeOk });
  }

  return NextResponse.json({ success: true, processed: orders.length, results });
}

export async function GET(req: NextRequest) { return POST(req); }
