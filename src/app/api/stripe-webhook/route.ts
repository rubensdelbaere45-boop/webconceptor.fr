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
        sender: { name: "WebConceptor", email: "contact@webconceptor.fr" },
        to: [{ email: to, name }],
        subject: "Paiement recu — votre site WebConceptor arrive",
        htmlContent: `
          <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0a0a0a">
            <h1 style="font-size:24px;font-weight:800;margin-bottom:16px">Merci ${name.split(" ")[0]} !</h1>
            <p style="font-size:15px;line-height:1.6;color:#525252">Votre paiement a bien ete recu. Nous lancons la creation de votre site maintenant.</p>
            <div style="background:#fafafa;border-radius:12px;padding:20px;margin:24px 0">
              <p style="font-size:13px;color:#737373;margin:0 0 4px">Domaine reserve</p>
              <p style="font-size:18px;font-weight:700;margin:0">${domain}</p>
            </div>
            <p style="font-size:15px;line-height:1.6;color:#525252">
              <strong>Prochaines etapes :</strong><br>
              1. Nous achetons votre nom de domaine dans les 24h<br>
              2. Nous finalisons votre site (delai 5 jours)<br>
              3. Mise en ligne sur votre domaine
            </p>
            <p style="font-size:15px;line-height:1.6;color:#525252">Code projet : <strong>${code}</strong> — suivez l'avancement sur <a href="https://webconceptor.fr/code" style="color:#0066ff">votre espace</a>.</p>
            <p style="font-size:13px;color:#a3a3a3;margin-top:32px">L'equipe WebConceptor</p>
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

      // ═══════════════════════════════════════════════════════
      // CRÉATION AUTO DE L'ABONNEMENT SÉRÉNITÉ 50€/mois
      // Trial 30 jours → le 1er mois déjà payé dans le checkout one-shot,
      // les prélèvements récurrents démarrent 30 jours après.
      // ═══════════════════════════════════════════════════════
      if (hasSerenite) {
        const serenitePriceId = process.env.STRIPE_SERENITE_PRICE_ID;
        const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;

        if (!serenitePriceId) {
          // Env var manquante : on prévient Rubens pour qu'il crée la sub manuellement
          if (tgToken && chatId) {
            fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: `⚠️ <b>STRIPE_SERENITE_PRICE_ID manquante dans Render</b>\n\nLe client ${escapeTelegram(buyerName)} a pris Sérénité mais l'abonnement 50€/mois n'a PAS été créé automatiquement.\n\n→ Crée-le manuellement dans Stripe.`,
                parse_mode: "HTML",
              }),
            }).catch(() => { /* silent */ });
          }
        } else if (!customerId) {
          if (tgToken && chatId) {
            fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: `⚠️ <b>Customer Stripe introuvable</b>\n\nLe client ${escapeTelegram(buyerName)} a pris Sérénité mais on n'a pas récupéré son customer_id → abonnement PAS créé.\n\n→ Crée-le manuellement.`,
                parse_mode: "HTML",
              }),
            }).catch(() => { /* silent */ });
          }
        } else {
          try {
            // Récupère la PaymentMethod du Customer pour la marquer comme default
            const pmList = await stripe.paymentMethods.list({ customer: customerId, type: "card", limit: 1 });
            const pm = pmList.data[0];
            if (pm) {
              await stripe.customers.update(customerId, {
                invoice_settings: { default_payment_method: pm.id },
              });
            }

            // Crée l'abonnement avec trial 30 jours (le 1er mois est déjà payé via le checkout one-shot)
            const subscription = await stripe.subscriptions.create({
              customer: customerId,
              items: [{ price: serenitePriceId }],
              trial_period_days: 30,
              metadata: {
                source: "self_serve_mockup",
                prospect_id: prospectId,
                prospect_slug: metadata.prospect_slug || "",
              },
            });

            if (tgToken && chatId) {
              fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `✅ <b>ABONNEMENT SÉRÉNITÉ CRÉÉ</b>\n\nClient : ${escapeTelegram(buyerName)}\nID abonnement : <code>${escapeTelegram(subscription.id)}</code>\n\nPrélèvement mensuel 50€/mois démarre automatiquement dans 30 jours.`,
                  parse_mode: "HTML",
                }),
              }).catch(() => { /* silent */ });
            }
          } catch (err) {
            const msg = err instanceof Error ? err.message : "erreur inconnue";
            if (tgToken && chatId) {
              fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  chat_id: chatId,
                  text: `❌ <b>ABONNEMENT SÉRÉNITÉ ÉCHOUÉ</b>\n\nClient : ${escapeTelegram(buyerName)}\nRaison : ${escapeTelegram(msg.slice(0, 300))}\n\n→ Crée-le manuellement dans Stripe.`,
                  parse_mode: "HTML",
                }),
              }).catch(() => { /* silent */ });
            }
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
