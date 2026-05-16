import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { escapeTelegram } from "@/lib/security";
import { buyDomain, type IonosContactInfo } from "@/lib/ionos";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET || "";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

/* ══════════════════════════════════════════
   Telegram notification
   ══════════════════════════════════════════ */

async function notifyTelegram(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
      }),
    });
  } catch {
    // silent
  }
}

/* ══════════════════════════════════════════
   Brevo email notification to admin (Rubens)
   ══════════════════════════════════════════ */

async function sendAdminEmail({
  buyerName,
  buyerEmail,
  buyerTel,
  prospectName,
  isSerenite,
  domain,
  amountPaid,
  adresse,
  cp,
  ville,
}: {
  buyerName: string;
  buyerEmail: string;
  buyerTel: string;
  prospectName: string;
  isSerenite: boolean;
  domain: string;
  amountPaid: number;
  adresse?: string;
  cp?: string;
  ville?: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL || "contact@webconceptor.fr";
  if (!apiKey) return;

  const hasDomain = isSerenite && domain && domain !== "(aucun)";
  const now = new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris", dateStyle: "full", timeStyle: "short" });
  const domainBase = hasDomain ? domain.split(".")[0] : "";
  const domainTld  = hasDomain ? domain.split(".").slice(1).join(".") : "";

  const subject = isSerenite
    ? `💰 Paiement Sérénité — ${prospectName} — ${hasDomain ? `domaine ${domain} à acheter` : "sans domaine"}`
    : `💰 Paiement Simple — ${prospectName} — ${amountPaid} €`;

  const checklist = [
    hasDomain ? `<li style="margin-bottom:8px">🌐 <strong>Acheter le domaine <code>${domain}</code> sur IONOS</strong> dès maintenant (avant qu'il soit pris)</li>` : "",
    `<li style="margin-bottom:8px">📞 Appeler le client : <a href="tel:${buyerTel}" style="color:#00287a">${buyerTel}</a></li>`,
    `<li style="margin-bottom:8px">🎨 Collecter logo, photos, contenus manquants</li>`,
    `<li style="margin-bottom:8px">🚀 Finaliser et déployer le site</li>`,
    isSerenite ? `<li style="margin-bottom:0">💳 Configurer l'abonnement Sérénité 50 €/mois dans Stripe</li>` : "",
  ].filter(Boolean).join("\n");

  const htmlContent = `
<div style="font-family:Inter,Arial,sans-serif;max-width:580px;margin:0 auto;color:#1a1a18">
  <!-- Header -->
  <div style="background:${isSerenite ? "#00287a" : "#1a1a18"};padding:24px 28px;border-radius:8px 8px 0 0">
    <p style="margin:0;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:${isSerenite ? "#e8a800" : "rgba(255,255,255,.5)"}">WebConceptor — Nouveau paiement</p>
    <h1 style="margin:6px 0 0;font-size:22px;font-weight:800;color:#fff">${isSerenite ? "⭐ Formule Sérénité" : "📄 Formule Simple"}</h1>
    <p style="margin:4px 0 0;font-size:13px;color:rgba(255,255,255,.65)">${now}</p>
  </div>

  <!-- Body -->
  <div style="border:1px solid #e8e4db;border-top:none;border-radius:0 0 8px 8px;padding:24px 28px;background:#fff">

    <!-- Amount -->
    <div style="display:inline-block;background:${isSerenite ? "#faf8f3" : "#f5f5f5"};border:1.5px solid ${isSerenite ? "#e8a800" : "#ddd"};border-radius:6px;padding:12px 24px;margin-bottom:20px">
      <span style="font-size:28px;font-weight:800;color:${isSerenite ? "#00287a" : "#1a1a18"}">${amountPaid} €</span>
      ${isSerenite ? `<span style="font-size:13px;color:#6b6b62;margin-left:6px">+ 50 €/mois</span>` : `<span style="font-size:13px;color:#6b6b62;margin-left:6px">TTC · paiement unique</span>`}
    </div>

    <!-- Client table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;font-size:14px">
      <tr style="border-bottom:1px solid #f0ece3">
        <td style="padding:9px 0;color:#6b6b62;width:130px">Prospect</td>
        <td style="padding:9px 0;font-weight:600">${prospectName}</td>
      </tr>
      <tr style="border-bottom:1px solid #f0ece3">
        <td style="padding:9px 0;color:#6b6b62">Client</td>
        <td style="padding:9px 0;font-weight:600">${buyerName}</td>
      </tr>
      <tr style="border-bottom:1px solid #f0ece3">
        <td style="padding:9px 0;color:#6b6b62">Email</td>
        <td style="padding:9px 0"><a href="mailto:${buyerEmail}" style="color:#00287a">${buyerEmail}</a></td>
      </tr>
      <tr style="border-bottom:1px solid #f0ece3">
        <td style="padding:9px 0;color:#6b6b62">Téléphone</td>
        <td style="padding:9px 0"><a href="tel:${buyerTel}" style="color:#00287a;font-weight:600">${buyerTel}</a></td>
      </tr>
      ${adresse ? `<tr>
        <td style="padding:9px 0;color:#6b6b62">Adresse</td>
        <td style="padding:9px 0">${adresse}${cp ? `, ${cp}` : ""}${ville ? ` ${ville}` : ""}</td>
      </tr>` : ""}
    </table>

    ${hasDomain ? `
    <!-- Domain alert -->
    <div style="background:#fffcf0;border:2px solid #e8a800;border-radius:8px;padding:16px 20px;margin-bottom:20px">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#e8a800">🌐 Domaine à enregistrer maintenant</p>
      <p style="margin:0 0 4px;font-size:24px;font-weight:800;color:#00287a">${domain}</p>
      <p style="margin:0;font-size:12px;color:#856404">⚡ Agis rapidement — un concurrent pourrait le prendre !</p>
    </div>
    <a href="https://www.ionos.fr/domains/enregistrement-domaine?domain=${domainBase}&tld=${domainTld}" style="display:inline-block;background:#00287a;color:#fff;padding:12px 28px;border-radius:6px;text-decoration:none;font-weight:700;font-size:14px;margin-bottom:24px">→ Acheter le domaine sur IONOS</a>
    ` : ""}

    <!-- Checklist -->
    <div style="background:#faf8f3;border:1px solid #e8e4db;border-radius:8px;padding:16px 20px">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#1a1a18">📋 À faire maintenant :</p>
      <ul style="margin:0;padding:0 0 0 20px;font-size:14px;color:#2e2e2b;line-height:1.6">
        ${checklist}
      </ul>
    </div>
  </div>
</div>`;

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "WebConceptor Bot", email: "contact@webconceptor.fr" },
        to: [{ email: adminEmail, name: "Rubens" }],
        subject,
        htmlContent,
      }),
    });
  } catch {
    // silent
  }
}

/* ══════════════════════════════════════════
   Brevo email notification to client
   ══════════════════════════════════════════ */

async function sendConfirmationEmail(to: string, name: string, code: string, domain: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Tom Bauer", email: "contact@webconceptor.fr" },
        to: [{ email: to, name }],
        subject: "Paiement reçu — votre site WebConceptor arrive 🎉",
        htmlContent: `
          <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:40px 32px;color:#0a0a0a;background:#ffffff">
            <div style="margin-bottom:28px">
              <span style="display:inline-flex;align-items:center;gap:6px;background:#0066ff;color:#fff;font-size:12px;font-weight:700;padding:6px 14px;border-radius:100px;letter-spacing:0.05em">W WebConceptor</span>
            </div>
            <h1 style="font-size:26px;font-weight:800;margin:0 0 12px;line-height:1.2">Merci ${name.split(" ")[0]} ! 🙌</h1>
            <p style="font-size:15px;line-height:1.7;color:#525252;margin:0 0 24px">Votre paiement a bien été reçu. Nous lançons la création de votre site <strong>immédiatement</strong>.</p>
            <div style="background:#f0f7ff;border:1px solid #cce0ff;border-radius:12px;padding:20px 24px;margin:0 0 24px">
              <p style="font-size:12px;color:#0066ff;font-weight:600;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.08em">Domaine réservé</p>
              <p style="font-size:20px;font-weight:800;margin:0;color:#0a0a0a">${domain}</p>
            </div>
            <div style="background:#fafafa;border-radius:12px;padding:20px 24px;margin:0 0 24px">
              <p style="font-size:14px;font-weight:700;margin:0 0 12px;color:#0a0a0a">Prochaines étapes :</p>
              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px">
                <span style="background:#0066ff;color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;line-height:22px;text-align:center">1</span>
                <p style="font-size:14px;color:#525252;margin:0;line-height:1.5">Achat de votre nom de domaine dans les <strong>24h</strong></p>
              </div>
              <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:10px">
                <span style="background:#0066ff;color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;line-height:22px;text-align:center">2</span>
                <p style="font-size:14px;color:#525252;margin:0;line-height:1.5">Finalisation de votre site (délai <strong>5 jours ouvrés</strong>)</p>
              </div>
              <div style="display:flex;align-items:flex-start;gap:12px">
                <span style="background:#0066ff;color:#fff;border-radius:50%;width:22px;height:22px;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0;line-height:22px;text-align:center">3</span>
                <p style="font-size:14px;color:#525252;margin:0;line-height:1.5">Mise en ligne sur <strong>${domain}</strong> et remise des accès</p>
              </div>
            </div>
            <p style="font-size:14px;line-height:1.6;color:#525252;margin:0 0 8px">Votre code projet : <strong style="color:#0a0a0a;font-size:18px;letter-spacing:0.1em">${code}</strong></p>
            <a href="https://webconceptor.fr/code?c=${code}" style="display:inline-block;background:#0a0a0a;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:100px;text-decoration:none;margin:12px 0 28px">Suivre mon projet →</a>
            <p style="font-size:13px;color:#a3a3a3;border-top:1px solid #f0f0f0;padding-top:20px;margin:0">Une question ? Répondez directement à cet email ou écrivez à <a href="mailto:contact@webconceptor.fr" style="color:#0066ff;text-decoration:none">contact@webconceptor.fr</a><br>L'équipe WebConceptor</p>
          </div>
        `,
      }),
    });
  } catch {
    // silent
  }
}

/* ══════════════════════════════════════════
   Webhook handler
   ══════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature || !WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Signature manquante" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, WEBHOOK_SECRET);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Signature invalide";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const metadata = session.metadata || {};
    const source = metadata.source || "";
    const code = metadata.code || "";
    const prospectId = metadata.prospect_id || "";

    // ═══════════════════════════════════════════════════════
    // FLOW 1 : Self-serve depuis la maquette (pas de code PIN)
    // source === "self_serve_mockup" + prospect_id
    // ═══════════════════════════════════════════════════════
    if (source === "self_serve_mockup" && prospectId) {
      // Idempotence : si le prospect est déjà "converted", on skip
      const { data: prospect } = await supabase
        .from("prospects")
        .select("id, name, status, phone")
        .eq("id", prospectId)
        .single();

      if (!prospect) return NextResponse.json({ received: true });
      if (prospect.status === "converted") {
        return NextResponse.json({ received: true, duplicate: true });
      }

      await supabase
        .from("prospects")
        .update({
          status: "converted",
          updated_at: new Date().toISOString(),
          notes: `PAID via Stripe self-serve ${new Date().toISOString()} — session ${session.id}`,
        })
        .eq("id", prospectId);

      const amountPaid = (session.amount_total || 0) / 100;
      const buyerName = metadata.buyer_nom || "Client";
      const buyerEmail = metadata.buyer_email || "";
      const buyerTel = metadata.buyer_tel || "";
      const domain = metadata.domain || "(aucun)";
      const hasSerenite = metadata.has_serenite === "true";

      // Telegram : ÇA DOIT SONNER — paiement = event critique
      const tgToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;
      if (tgToken && chatId) {
        const telegramMsg = [
          `💰 <b>NOUVEAU PAIEMENT — Self-serve</b>`,
          ``,
          `<b>${escapeTelegram(prospect.name)}</b>`,
          `<b>Client :</b> ${escapeTelegram(buyerName)}`,
          `<b>Email :</b> ${escapeTelegram(buyerEmail)}`,
          `<b>Téléphone :</b> ${escapeTelegram(buyerTel)}`,
          ``,
          `<b>Plan :</b> ${hasSerenite ? "Sérénité 🟢" : "Simple"}`,
          hasSerenite ? `<b>Domaine :</b> ${escapeTelegram(domain)}` : "",
          `<b>TOTAL PAYÉ :</b> ${amountPaid} €`,
          ``,
          `<b>Adresse :</b>`,
          `${escapeTelegram(metadata.buyer_adresse || "—")}`,
          `${escapeTelegram(metadata.buyer_cp || "")} ${escapeTelegram(metadata.buyer_ville || "")}`,
          ``,
          `📋 <b>À FAIRE :</b>`,
          `1. Appeler le client pour valider les détails (logo, couleurs, photos)`,
          hasSerenite ? `2. Acheter le domaine ${escapeTelegram(domain)} sur IONOS au nom de l'acheteur` : "",
          `${hasSerenite ? "3" : "2"}. Finaliser le site & déployer`,
          hasSerenite ? `4. Créer la souscription Sérénité 50€/mois dans Stripe` : "",
        ].filter(Boolean).join("\n");

        // SON : pas de disable_notification → Rubens entend la notif
        fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: telegramMsg,
            parse_mode: "HTML",
          }),
        }).catch(() => { /* silent */ });
      }

      // Email de confirmation au client (Brevo)
      if (buyerEmail) {
        await sendConfirmationEmail(buyerEmail, buyerName, `Commande ${prospect.name}`, domain);
      }

      // ─── Email admin (Rubens) — pour TOUS les paiements ───────────────
      await sendAdminEmail({
        buyerName,
        buyerEmail,
        buyerTel,
        prospectName: prospect.name,
        isSerenite: hasSerenite,
        domain,
        amountPaid,
        adresse: metadata.buyer_adresse,
        cp: metadata.buyer_cp,
        ville: metadata.buyer_ville,
      });

      // ═══════════════════════════════════════════════════════
      // ABONNEMENT SÉRÉNITÉ 50€/mois
      // Depuis la migration vers mode:"subscription", Stripe crée l'abonnement
      // automatiquement lors du checkout. On ne le recrée PAS ici.
      // Pour les anciens checkouts (mode:"payment"), on le crée manuellement.
      // ═══════════════════════════════════════════════════════
      if (hasSerenite && session.mode !== "subscription") {
        // Ancien flow payment mode — création manuelle de l'abonnement
        const serenitePriceId = process.env.STRIPE_SERENITE_PRICE_ID || "price_1TOjkfBsbfiZwhRuq0YodxTP";
        const customerId = typeof session.customer === "string" ? session.customer : (session.customer as { id: string } | null)?.id;

        if (customerId) {
          try {
            const pmList = await stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 1 });
            const pm = pmList.data[0];
            if (pm) {
              await stripe.customers.update(customerId, {
                invoice_settings: { default_payment_method: pm.id },
              });
            }
            const subscription = await stripe.subscriptions.create({
              customer: customerId,
              items: [{ price: serenitePriceId }],
              trial_period_days: 30,
              metadata: { source: "self_serve_mockup", prospect_id: prospectId, prospect_slug: metadata.prospect_slug || "" },
            });
            if (tgToken && chatId) {
              fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: `✅ <b>ABONNEMENT SÉRÉNITÉ CRÉÉ (legacy)</b>\n\nClient : ${escapeTelegram(buyerName)}\nID : <code>${escapeTelegram(subscription.id)}</code>`, parse_mode: "HTML" }),
              }).catch(() => {});
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : "erreur inconnue";
            if (tgToken && chatId) {
              fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ chat_id: chatId, text: `❌ <b>ABONNEMENT SÉRÉNITÉ ÉCHOUÉ</b>\n\n${escapeTelegram(msg.slice(0, 300))}`, parse_mode: "HTML" }),
              }).catch(() => {});
            }
          }
        }
      }

      // (email admin déjà envoyé via sendAdminEmail ci-dessus)

      // ═══════════════════════════════════════════════════════
      // FORMULE SIMPLE → 2 MOIS SÉRÉNITÉ OFFERTS (trial automatique)
      // Si le client a payé par CB, on crée un abonnement Sérénité
      // avec 60 jours d'essai. Après 60 jours : 50€/mois ou résiliation.
      // Si paiement Klarna/PayPal → pas de CB sauvegardée → on skip.
      // ═══════════════════════════════════════════════════════
      if (!hasSerenite) {
        const serenitePriceId = process.env.STRIPE_SERENITE_PRICE_ID || "price_1TOjkfBsbfiZwhRuq0YodxTP";
        const customerId = typeof session.customer === "string"
          ? session.customer
          : (session.customer as { id: string } | null)?.id;

        if (customerId) {
          try {
            const pmList = await stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 1 });
            const pm = pmList.data[0];
            if (pm) {
              // Définir la CB comme moyen de paiement par défaut
              await stripe.customers.update(customerId, {
                invoice_settings: { default_payment_method: pm.id },
              });
              // Créer l'abonnement Sérénité avec 60 jours d'essai
              await stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: serenitePriceId }],
                trial_period_days: 60,
                trial_settings: { end_behavior: { missing_payment_method: "cancel" } },
                metadata: {
                  source: "simple_trial",
                  prospect_id: prospectId,
                  prospect_slug: metadata.prospect_slug || "",
                  buyer_email: buyerEmail,
                },
              });
              if (tgToken && chatId) {
                fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    chat_id: chatId,
                    text: `🎁 <b>TRIAL SÉRÉNITÉ 2 MOIS CRÉÉ</b>\n\n<b>Client :</b> ${escapeTelegram(buyerName)}\n<b>Email :</b> ${escapeTelegram(buyerEmail)}\n\nAbonnement Sérénité démarré (60 jours d'essai). Facturation automatique le ${new Date(Date.now() + 60 * 86400000).toLocaleDateString("fr-FR")} si non annulé.`,
                    parse_mode: "HTML",
                    disable_notification: true,
                  }),
                }).catch(() => {});
              }
            }
          } catch {
            // Si la création du trial échoue, ce n'est pas bloquant
          }
        }
      }

      // ═══════════════════════════════════════════════════════
      // AUTO-ACHAT DU DOMAINE via IONOS API (si Sérénité + domaine)
      // Achat TOUJOURS tenté — le temps est critique pour ne pas se faire
      // piquer le domaine. Retry 3× automatique en cas d'erreur temporaire.
      // ═══════════════════════════════════════════════════════
      if (hasSerenite && domain && domain !== "(aucun)") {
        // Priorité 1 : prénom/nom séparés depuis le Stripe metadata (nouveau format)
        // Priorité 2 : split du nom complet (prospects anciens avec nom combiné)
        let firstName = metadata.buyer_prenom || "";
        let lastName = metadata.buyer_nom || "";
        if (!firstName && lastName && lastName.includes(" ")) {
          const parts = lastName.trim().split(/\s+/);
          firstName = parts[0];
          lastName = parts.slice(1).join(" ");
        }
        if (!firstName) firstName = "Client";

        const contact: IonosContactInfo = {
          firstName: firstName.slice(0, 60),
          lastName: (lastName || buyerName).slice(0, 60),
          organization: metadata.buyer_entreprise || undefined,
          email: buyerEmail || "contact@webconceptor.fr",
          phone: buyerTel || "+33635592471",
          street: metadata.buyer_adresse || "",
          city: metadata.buyer_ville || "",
          postalCode: metadata.buyer_cp || "",
          country: "FR",
        };

        const result = await buyDomain(domain, contact);

        if (tgToken && chatId) {
          const statusLine = result.success
            ? `✅ <b>DOMAINE ACHETÉ AUTOMATIQUEMENT</b>\n${escapeTelegram(domain)} (order <code>${escapeTelegram(result.orderId || "?")}</code>)`
            : `❌ <b>ACHAT DOMAINE ÉCHOUÉ</b> — ${escapeTelegram(domain)}\n` +
              `Raison : ${escapeTelegram((result.error || "inconnue").slice(0, 300))}\n` +
              `Statut HTTP : ${result.httpStatus || "—"} · Tentatives : ${result.attempts}/3\n` +
              `\n🚨 <b>ACHÈTE MANUELLEMENT DÈS MAINTENANT sur IONOS avant que quelqu'un ne prenne le domaine !</b>`;

          const errorPayload = !result.success && result.responseBody
            ? `\n\n<b>Debug IONOS :</b>\n<code>${escapeTelegram(JSON.stringify(result.responseBody).slice(0, 500))}</code>`
            : "";

          fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: `${statusLine}\n\n<b>Client :</b> ${escapeTelegram(firstName)} ${escapeTelegram(lastName)}\n<b>Email :</b> ${escapeTelegram(buyerEmail)}\n<b>Téléphone :</b> ${escapeTelegram(buyerTel)}\n<b>Adresse :</b> ${escapeTelegram(metadata.buyer_adresse || "—")}, ${escapeTelegram(metadata.buyer_cp || "")} ${escapeTelegram(metadata.buyer_ville || "")}${metadata.buyer_entreprise ? `\n<b>Entreprise :</b> ${escapeTelegram(metadata.buyer_entreprise)}` : ""}${errorPayload}`,
              parse_mode: "HTML",
              // disable_notification: false → notif SONORE (succès OU échec = événement critique)
            }),
          }).catch(() => { /* silent */ });
        }
      }

      return NextResponse.json({ received: true, prospect_id: prospectId });
    }

    // ═══════════════════════════════════════════════════════
    // FLOW 2 : Code PIN (existant, via /code)
    // metadata.code présent
    // ═══════════════════════════════════════════════════════
    if (!code) {
      return NextResponse.json({ received: true });
    }

    // Idempotency : Stripe can replay this event. Only process on the FIRST transition
    // sent/viewed -> paid. If the project is already "paid" or beyond, skip side-effects.
    const { data: current } = await supabase
      .from("projects")
      .select("id, status")
      .eq("code", code)
      .single();

    if (!current) {
      return NextResponse.json({ received: true });
    }

    if (current.status === "paid" || current.status === "completed") {
      // Already processed — acknowledge and skip notifications.
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Update project status
    await supabase
      .from("projects")
      .update({
        status: "paid",
        updated_at: new Date().toISOString(),
      })
      .eq("code", code);

    // Fetch project for notifications
    const { data: project } = await supabase
      .from("projects")
      .select("*")
      .eq("code", code)
      .single();

    if (project) {
      const amountPaid = (session.amount_total || 0) / 100;
      const buyerName = metadata.buyer_nom || project.client_name || "Client";
      const buyerEmail = metadata.buyer_email || project.client_email || "";
      const domain = metadata.domain || "non specifie";
      const hasSerenite = metadata.has_serenite === "true";

      // Telegram (parse_mode=HTML requires user-supplied strings to be escaped)
      const telegramMsg = `
💰 <b>NOUVEAU PAIEMENT WebConceptor</b>

<b>Client :</b> ${escapeTelegram(buyerName)}
<b>Email :</b> ${escapeTelegram(buyerEmail)}
<b>Telephone :</b> ${escapeTelegram(metadata.buyer_tel || "—")}

<b>Projet :</b> ${escapeTelegram(project.title)}
<b>Code :</b> ${escapeTelegram(code)}

<b>Domaine :</b> ${escapeTelegram(domain)}
<b>Formule Serenite :</b> ${hasSerenite ? "✅ OUI (50€/mois)" : "❌ Non"}

<b>TOTAL PAYE :</b> ${amountPaid} €

<b>Adresse acheteur :</b>
${escapeTelegram(metadata.buyer_adresse || "—")}
${escapeTelegram(metadata.buyer_cp || "")} ${escapeTelegram(metadata.buyer_ville || "")}

📋 <b>A FAIRE :</b>
1. Acheter le domaine sur IONOS au nom de l'acheteur
2. Finaliser et deployer le site
3. Marquer "completed" + ajouter l'URL
${hasSerenite ? "4. Creer la souscription Stripe Formule Serenite (50€/mois)" : ""}
      `.trim();

      await notifyTelegram(telegramMsg);

      // Email client
      if (buyerEmail) {
        await sendConfirmationEmail(buyerEmail, buyerName, code, domain);
      }
    }

    return NextResponse.json({ received: true });
  }

  return NextResponse.json({ received: true });
}

// Stripe webhooks need the raw body — disable auto parsing
export const runtime = "nodejs";
