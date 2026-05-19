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
   SMS notification via Brevo (backup Telegram)
   Recipient : +33635592471 (Rubens)
   ══════════════════════════════════════════ */

async function notifySMS(message: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  // Truncate to 306 chars (2 SMS credits max)
  const content = message.slice(0, 306);

  try {
    await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: "WebConceptor",
        recipient: "+33635592471",
        content,
        type: "transactional",
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
   Brevo : email de relance J+25 (upsell Sérénité)
   Planifié via scheduledAt → Brevo envoie automatiquement
   5 jours avant la fin du mois offert.
   ══════════════════════════════════════════ */

async function scheduleUpsellEmail({
  buyerEmail,
  buyerFirstName,
  prospectName,
  prospectSlug,
  domain,
}: {
  buyerEmail: string;
  buyerFirstName: string;
  prospectName: string;
  prospectSlug: string;
  domain: string;
}) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || !buyerEmail) return;

  // J+25 : 5 jours avant la fin du mois offert
  const sendAt = new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString();
  const mockupUrl = `https://webconceptor.fr/prospects/${encodeURIComponent(prospectSlug)}`;
  const hasDomain = domain && domain !== "(aucun)";

  const htmlContent = `
<div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:0;color:#0a0a0a;background:#ffffff">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0d1b5e,#1a2d7a);padding:32px 32px 28px;border-radius:12px 12px 0 0">
    <p style="margin:0 0 16px;display:inline-block;background:rgba(255,255,255,.12);color:#FFD700;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:5px 12px;border-radius:100px">WebConceptor</p>
    <h1 style="margin:0;font-size:24px;font-weight:800;color:#fff;line-height:1.3">Votre mois Sérénité offert<br>se termine dans <span style="color:#FFD700">5 jours</span> ☀️</h1>
  </div>

  <!-- Body -->
  <div style="border:1px solid #e8e4db;border-top:none;border-radius:0 0 12px 12px;padding:28px 32px;background:#fff">

    <p style="font-size:15px;line-height:1.7;color:#333;margin:0 0 20px">Bonjour ${buyerFirstName},</p>

    <p style="font-size:15px;line-height:1.7;color:#333;margin:0 0 20px">
      Depuis un mois, votre site <strong>${prospectName}</strong>${hasDomain ? ` sur <strong>${domain}</strong>` : ""} est hébergé, mis à jour et surveillé dans le cadre de votre mois Sérénité offert.
      <strong>Dans 5 jours, ce service s'arrête</strong> — sauf si vous choisissez de continuer.
    </p>

    <!-- Ce que vous perdez -->
    <div style="background:#fff8f0;border:1.5px solid #f0c070;border-radius:10px;padding:18px 22px;margin:0 0 22px">
      <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#8a5a00;text-transform:uppercase;letter-spacing:.08em">Ce qui s'arrête dans 5 jours :</p>
      <ul style="margin:0;padding:0 0 0 18px;font-size:14px;color:#555;line-height:2">
        <li>❌ Hébergement sécurisé de votre site</li>
        <li>❌ Mises à jour illimitées sur simple email</li>
        <li>❌ Sauvegardes quotidiennes automatiques</li>
        <li>❌ Support prioritaire sous 24h</li>
        ${hasDomain ? "<li>❌ Renouvellement automatique de votre domaine</li>" : ""}
      </ul>
    </div>

    <!-- Offre Sérénité -->
    <div style="background:#f0f7ff;border:1.5px solid #b8d4f0;border-radius:10px;padding:18px 22px;margin:0 0 24px">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#0d1b5e;text-transform:uppercase;letter-spacing:.1em">✅ Continuez avec Sérénité</p>
      <p style="margin:0 0 4px;font-size:26px;font-weight:800;color:#0d1b5e"><strong>50 €</strong><span style="font-size:14px;font-weight:500;color:#555">/mois</span></p>
      <p style="margin:0;font-size:13px;color:#555">Ou <strong>480 €/an</strong> — économisez 120 €. Sans engagement, résiliable à tout moment.</p>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin:0 0 24px">
      <a href="${mockupUrl}" style="display:inline-block;background:#0d1b5e;color:#fff;font-size:15px;font-weight:700;padding:15px 36px;border-radius:100px;text-decoration:none;letter-spacing:.02em">Continuer avec Sérénité →</a>
      <p style="margin:12px 0 0;font-size:12px;color:#aaa">ou répondez à cet email pour qu'on s'en occupe ensemble</p>
    </div>

    <p style="font-size:13px;color:#888;border-top:1px solid #f0f0f0;padding-top:20px;margin:0;line-height:1.6">
      Une question ? Répondez directement à cet email.<br>
      <a href="mailto:contact@webconceptor.fr" style="color:#0d1b5e;text-decoration:none">contact@webconceptor.fr</a> — L'équipe WebConceptor
    </p>
  </div>
</div>`;

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "WebConceptor", email: "contact@webconceptor.fr" },
        to: [{ email: buyerEmail, name: buyerFirstName }],
        subject: `Votre mois Sérénité offert se termine dans 5 jours — ${prospectName}`,
        htmlContent,
        scheduledAt: sendAt,
      }),
    });
  } catch {
    // silent — non bloquant
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

      // SMS de secours (Brevo) — toujours envoyé même si Telegram tombe
      await notifySMS(
        `VENTE WebConceptor!\n` +
        `${prospect.name}\n` +
        `Client: ${buyerName} - ${buyerTel}\n` +
        `Plan: ${hasSerenite ? "Serenite" : "Simple"} - ${amountPaid}EUR` +
        (domain && domain !== "(aucun)" ? `\nDomaine: ${domain}` : "")
      );

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

      // ─── Email de relance J+25 pour formule Simple ─────────────────────
      // Planifié via Brevo scheduledAt : envoyé 5 jours avant la fin du mois offert
      if (!hasSerenite && buyerEmail) {
        const buyerFirstName = metadata.buyer_prenom || buyerName.split(" ")[0] || "vous";
        await scheduleUpsellEmail({
          buyerEmail,
          buyerFirstName,
          prospectName: prospect.name,
          prospectSlug: metadata.prospect_slug || "",
          domain,
        });
      }

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
      // AUTO-ACHAT DU DOMAINE via IONOS API (si Sérénité + domaine)
      // Achat TOUJOURS tenté — le temps est critique pour ne pas se faire
      // piquer le domaine. Retry 3× automatique en cas d'erreur temporaire.
      // ═══════════════════════════════════════════════════════
      if (domain && domain !== "(aucun)") {
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

          // SMS de secours domaine (Brevo)
          await notifySMS(
            result.success
              ? `DOMAINE ACHETE: ${domain}\nClient: ${firstName} ${lastName} - ${buyerTel}`
              : `URGENT! Domaine ${domain} ECHEC achat automatique!\nAchete manuellement sur IONOS maintenant!\nClient: ${firstName} ${lastName} - ${buyerTel}`
          );
        }
      }

      return NextResponse.json({ received: true, prospect_id: prospectId });
    }

    // ═══════════════════════════════════════════════════════
    // FLOW 2 : Chatbot IA (79€/mois)
    // source === "chatbot_subscription"
    // ═══════════════════════════════════════════════════════
    if (source === "chatbot_subscription") {
      const businessName = metadata.business_name || "";
      const ownerEmail   = metadata.owner_email   || "";
      const ownerName    = metadata.owner_name    || "";
      const phone        = metadata.phone         || "";
      const businessType = metadata.business_type || "general";
      const city         = metadata.city          || "";
      const customerId   = typeof session.customer === "string" ? session.customer : null;
      const subId        = typeof session.subscription === "string" ? session.subscription : null;

      if (!ownerEmail || !businessName) {
        console.error("[webhook] chatbot_subscription : metadata incomplet");
        return NextResponse.json({ received: true });
      }

      // Idempotence : vérifier si déjà traité
      const { data: existing } = await supabase
        .from("chatbot_subscriptions")
        .select("id")
        .eq("stripe_subscription_id", subId || "")
        .single();

      if (!existing) {
        // Créer l'abonnement chatbot
        const token = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");

        await supabase.from("chatbot_subscriptions").insert({
          token,
          stripe_customer_id:     customerId,
          stripe_subscription_id: subId,
          business_name:  businessName,
          business_type:  businessType,
          owner_email:    ownerEmail,
          owner_name:     ownerName,
          phone,
          city,
          status: "active",
        });

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://webconceptor.fr";
        const chatUrl   = `${baseUrl}/chat/${token}`;
        const widgetUrl = `${baseUrl}/api/chatbot/widget?token=${token}`;
        const scriptTag = `<script src="${widgetUrl}" defer></script>`;

        // Email de livraison automatique
        const brevoKey = process.env.BREVO_API_KEY;
        if (brevoKey && ownerEmail) {
          const firstName = ownerName.split(" ")[0] || "vous";
          await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: { "api-key": brevoKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              sender: { name: "Tom Bauer — WebConceptor", email: "contact@webconceptor.fr" },
              to: [{ email: ownerEmail, name: ownerName }],
              subject: `🤖 Votre Chatbot IA est prêt — ${businessName}`,
              htmlContent: `<div style="font-family:'Inter',system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0a0a0a">
<h1 style="font-size:22px;margin-bottom:8px">Votre chatbot est prêt ✅</h1>
<p style="color:#525252;font-size:15px;margin-bottom:24px">Bonjour ${firstName}, votre assistant IA pour <strong>${businessName}</strong> est actif et répond déjà aux questions de vos clients.</p>

<div style="background:#f0f9ff;border-left:3px solid #0066ff;padding:20px;border-radius:8px;margin-bottom:24px">
  <p style="font-weight:700;margin-bottom:12px">📎 Votre page de chat standalone</p>
  <p style="font-size:14px;color:#525252;margin-bottom:12px">Partagez ce lien sur WhatsApp, vos réseaux sociaux ou votre fiche Google :</p>
  <a href="${chatUrl}" style="display:block;background:#0066ff;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;text-align:center">${chatUrl}</a>
</div>

<div style="background:#f8f9fa;border-left:3px solid #6366f1;padding:20px;border-radius:8px;margin-bottom:24px">
  <p style="font-weight:700;margin-bottom:8px">🖥️ Intégration sur votre site existant</p>
  <p style="font-size:13px;color:#525252;margin-bottom:12px">Collez ce code avant la balise &lt;/body&gt; de votre site :</p>
  <code style="display:block;background:#1e1e2e;color:#a6e3a1;padding:16px;border-radius:8px;font-size:12px;word-break:break-all">${scriptTag}</code>
</div>

<div style="background:#fafafa;border:1px solid #e5e5e5;padding:20px;border-radius:8px;margin-bottom:24px">
  <p style="font-weight:700;margin-bottom:12px">⚙️ Personnaliser votre chatbot</p>
  <p style="font-size:14px;color:#525252;margin-bottom:12px">Répondez à cet email pour personnaliser :</p>
  <ul style="font-size:14px;color:#525252;padding-left:20px">
    <li>Horaires d'ouverture</li>
    <li>Questions fréquentes et réponses</li>
    <li>Lien de réservation / prise de RDV</li>
    <li>Couleur de l'interface</li>
  </ul>
</div>

<p style="font-size:14px;color:#525252">Des questions ? Répondez directement à cet email ou appelez le 06 35 59 24 71.</p>
<div style="border-top:1px solid #e5e5e5;margin-top:24px;padding-top:16px;font-size:13px;color:#737373">
  <strong>Tom Bauer</strong> — WebConceptor<br>contact@webconceptor.fr · webconceptor.fr
</div>
</div>`,
            }),
          }).catch(() => {});
        }

        // Notif Telegram
        await notifyTelegram(`🤖 <b>Nouveau Chatbot IA vendu</b>\n\n<b>Client :</b> ${escapeTelegram(ownerName)}\n<b>Email :</b> ${escapeTelegram(ownerEmail)}\n<b>Entreprise :</b> ${escapeTelegram(businessName)}\n<b>Token :</b> <code>${token}</code>\n<b>Chat URL :</b> ${chatUrl}`);
      }

      return NextResponse.json({ received: true });
    }

    // ═══════════════════════════════════════════════════════
    // FLOW 3 : Agent Avis Google (149€/mois)
    // source === "gmb_subscription"
    // ═══════════════════════════════════════════════════════
    if (source === "gmb_subscription") {
      const businessName  = metadata.business_name  || "";
      const ownerEmail    = metadata.owner_email     || "";
      const ownerName     = metadata.owner_name      || "";
      const phone         = metadata.phone           || "";
      const businessType  = metadata.business_type   || "general";
      const city          = metadata.city            || "";
      const responseTone  = metadata.response_tone   || "professionnel";
      const customerId    = typeof session.customer === "string" ? session.customer : null;
      const subId         = typeof session.subscription === "string" ? session.subscription : null;

      if (!ownerEmail || !businessName) {
        return NextResponse.json({ received: true });
      }

      const { data: existingGmb } = await supabase
        .from("gmb_subscriptions")
        .select("id, auth_token")
        .eq("stripe_subscription_id", subId || "")
        .single();

      let authToken = existingGmb?.auth_token;

      if (!existingGmb) {
        const newAuthToken = Array.from(crypto.getRandomValues(new Uint8Array(20)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("");
        authToken = newAuthToken;

        await supabase.from("gmb_subscriptions").insert({
          auth_token:             newAuthToken,
          stripe_customer_id:     customerId,
          stripe_subscription_id: subId,
          business_name:  businessName,
          business_type:  businessType,
          owner_email:    ownerEmail,
          owner_name:     ownerName,
          phone,
          city,
          response_tone:  responseTone,
          status:         "pending_auth",
        });
      }

      // Email avec lien de connexion Google
      const baseUrl   = process.env.NEXT_PUBLIC_APP_URL || "https://webconceptor.fr";
      const authUrl   = `${baseUrl}/api/gmb/auth?token=${authToken}`;
      const brevoKey  = process.env.BREVO_API_KEY;

      if (brevoKey && ownerEmail && !existingGmb) {
        const firstName = ownerName.split(" ")[0] || "vous";
        await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "api-key": brevoKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: { name: "Tom Bauer — WebConceptor", email: "contact@webconceptor.fr" },
            to: [{ email: ownerEmail, name: ownerName }],
            subject: `🌟 Activez votre Agent Avis Google — ${businessName}`,
            htmlContent: `<div style="font-family:'Inter',system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0a0a0a">
<h1 style="font-size:22px;margin-bottom:8px">Plus qu'une étape !</h1>
<p style="color:#525252;font-size:15px;margin-bottom:24px">Bonjour ${firstName}, votre abonnement Agent Avis Google pour <strong>${businessName}</strong> est confirmé. Il ne reste qu'une chose à faire : connecter votre compte Google My Business.</p>

<div style="text-align:center;margin:32px 0">
  <a href="${authUrl}" style="display:inline-block;background:#4285F4;color:#fff;padding:16px 32px;border-radius:100px;text-decoration:none;font-weight:700;font-size:15px">
    🔗 Connecter mon Google My Business
  </a>
  <p style="font-size:12px;color:#9ca3af;margin-top:12px">Cliquez une seule fois · Prend moins de 2 minutes</p>
</div>

<div style="background:#fafafa;border:1px solid #e5e5e5;padding:20px;border-radius:8px;margin-bottom:24px">
  <p style="font-size:14px;font-weight:700;margin-bottom:8px">Une fois connecté, votre agent :</p>
  <ul style="font-size:14px;color:#525252;padding-left:20px">
    <li>Répondra à tous vos avis Google sous 1 heure</li>
    <li>Adaptera son ton selon le type d'avis</li>
    <li>Vous enverra un rapport mensuel</li>
  </ul>
</div>

<p style="font-size:14px;color:#525252">Ce lien est personnel et valide 30 jours. Des questions ? Répondez à cet email.</p>
<div style="border-top:1px solid #e5e5e5;margin-top:24px;padding-top:16px;font-size:13px;color:#737373">
  <strong>Tom Bauer</strong> — WebConceptor<br>contact@webconceptor.fr
</div>
</div>`,
          }),
        }).catch(() => {});
      }

      await notifyTelegram(`🌟 <b>Nouvel abonnement Agent Avis Google</b>\n\n<b>Client :</b> ${escapeTelegram(ownerName)}\n<b>Email :</b> ${escapeTelegram(ownerEmail)}\n<b>Entreprise :</b> ${escapeTelegram(businessName)}\n⏳ En attente de connexion Google`);

      return NextResponse.json({ received: true });
    }

    // ═══════════════════════════════════════════════════════
    // FLOW 4 : Audit IA (49€ one-shot)
    // source === "audit_ia"
    // ═══════════════════════════════════════════════════════
    if (source === "audit_ia") {
      const businessName = metadata.business_name || "";
      const ownerEmail   = metadata.owner_email   || "";
      const ownerName    = metadata.owner_name    || "";
      const businessAddr = metadata.business_addr || "";
      const websiteUrl   = metadata.website_url   || "";
      const paymentIntent = typeof session.payment_intent === "string" ? session.payment_intent : null;

      if (!ownerEmail || !businessName) {
        return NextResponse.json({ received: true });
      }

      // Idempotence
      const { data: existingOrder } = await supabase
        .from("audit_orders")
        .select("id, status")
        .eq("stripe_session_id", session.id)
        .single();

      if (!existingOrder) {
        const { data: newOrder } = await supabase
          .from("audit_orders")
          .insert({
            stripe_session_id:    session.id,
            stripe_payment_intent: paymentIntent,
            owner_email:   ownerEmail,
            owner_name:    ownerName,
            business_name: businessName,
            business_address: businessAddr,
            website_url:   websiteUrl,
            status:        "pending",
          })
          .select("id")
          .single();

        if (newOrder) {
          // Déclencher la génération en arrière-plan
          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://webconceptor.fr";
          fetch(`${baseUrl}/api/audit-ia`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-admin-key": process.env.ADMIN_SECRET_KEY || "",
            },
            body: JSON.stringify({ mode: "generate", order_id: newOrder.id }),
          }).catch(() => {});

          await notifyTelegram(`📊 <b>Nouvel Audit IA vendu</b>\n\n<b>Client :</b> ${escapeTelegram(ownerName)}\n<b>Email :</b> ${escapeTelegram(ownerEmail)}\n<b>Entreprise :</b> ${escapeTelegram(businessName)}\n<b>Site :</b> ${escapeTelegram(websiteUrl || "—")}`);
        }
      }

      return NextResponse.json({ received: true });
    }

    // ═══════════════════════════════════════════════════════
    // FLOW 5 : AGENTConceptor — multi-agents (abonnement)
    // source === "agentconceptor"
    // ═══════════════════════════════════════════════════════
    if (source === "agentconceptor") {
      const agentsList   = (metadata.agents || "").split(",").filter(Boolean);
      const isPack       = metadata.pack === "true";
      const businessName = metadata.business_name || "";
      const ownerEmail   = metadata.owner_email   || "";
      const ownerName    = metadata.owner_name    || "";
      const phone        = metadata.phone         || "";
      const city         = metadata.city          || "";
      const businessType = metadata.business_type || "general";
      const monthlyAmt   = parseInt(metadata.monthly_amount || "0", 10);
      const customerId   = typeof session.customer === "string" ? session.customer : null;
      const subId        = typeof session.subscription === "string" ? session.subscription : null;

      if (!ownerEmail || !businessName || agentsList.length === 0) {
        return NextResponse.json({ received: true });
      }

      // Idempotence
      const { data: existingAC } = await supabase
        .from("agentconceptor_subscriptions")
        .select("id")
        .eq("stripe_subscription_id", subId || "")
        .single();

      if (!existingAC) {
        const hasAgent = (id: string) => agentsList.includes(id) || isPack;

        // Tokens pour les agents qui en ont besoin
        const chatbotToken = hasAgent("chatbot")
          ? Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("")
          : null;
        const devisToken = Array.from(crypto.getRandomValues(new Uint8Array(16))).map((b) => b.toString(16).padStart(2, "0")).join("");
        const gmbAuthToken = hasAgent("reputation")
          ? Array.from(crypto.getRandomValues(new Uint8Array(20))).map((b) => b.toString(16).padStart(2, "0")).join("")
          : null;

        // Créer l'abonnement principal
        const { data: newSub } = await supabase.from("agentconceptor_subscriptions").insert({
          stripe_customer_id:     customerId,
          stripe_subscription_id: subId,
          stripe_session_id:      session.id,
          owner_email:    ownerEmail,
          owner_name:     ownerName,
          business_name:  businessName,
          business_type:  businessType,
          phone,
          city,
          has_chatbot:      hasAgent("chatbot"),
          has_reputation:   hasAgent("reputation"),
          has_devis:        hasAgent("devis"),
          has_contenu:      hasAgent("contenu"),
          has_fidelisation: hasAgent("fidelisation"),
          has_pack:         isPack,
          chatbot_token:    chatbotToken,
          devis_token:      devisToken,
          gmb_auth_token:   gmbAuthToken,
          monthly_amount:   monthlyAmt,
          status:           "active",
        }).select("id").single();

        if (!newSub) {
          console.error("[webhook] AGENTConceptor: insert failed");
          return NextResponse.json({ received: true });
        }

        // Créer les sous-tables pour les agents actifs
        if (hasAgent("chatbot") && chatbotToken) {
          await supabase.from("chatbot_subscriptions").insert({
            token: chatbotToken,
            stripe_customer_id: customerId,
            stripe_subscription_id: subId,
            business_name: businessName,
            business_type: businessType,
            owner_email: ownerEmail,
            owner_name: ownerName,
            phone, city,
            status: "active",
          });
        }

        if (hasAgent("reputation") && gmbAuthToken) {
          await supabase.from("gmb_subscriptions").insert({
            auth_token: gmbAuthToken,
            stripe_customer_id: customerId,
            stripe_subscription_id: subId,
            business_name: businessName,
            business_type: businessType,
            owner_email: ownerEmail,
            owner_name: ownerName,
            phone, city,
            status: "pending_auth",
          });
        }

        if (hasAgent("contenu")) {
          await supabase.from("contenu_subscriptions").insert({
            agentconceptor_sub_id: newSub.id,
            owner_email: ownerEmail,
            owner_name: ownerName,
            business_name: businessName,
            business_type: businessType,
            city,
            status: "active",
          });
        }

        // ── Email de livraison complet ──
        const baseUrl   = process.env.NEXT_PUBLIC_APP_URL || "https://webconceptor.fr";
        const firstName = (ownerName || "").split(" ")[0] || "vous";
        const brevoKey  = process.env.BREVO_API_KEY;

        const agentBlocks: string[] = [];

        if (hasAgent("chatbot") && chatbotToken) {
          const chatUrl   = `${baseUrl}/chat/${chatbotToken}`;
          const widgetUrl = `${baseUrl}/api/chatbot/widget?token=${chatbotToken}`;
          agentBlocks.push(`
<div style="background:#eff6ff;border-left:3px solid #2563eb;padding:16px 20px;border-radius:8px;margin-bottom:12px">
  <p style="font-weight:800;font-size:15px;margin-bottom:8px">🤖 Agent Chatbot — Actif ✅</p>
  <p style="font-size:13px;color:#374151;margin-bottom:8px"><strong>Page standalone (partageable) :</strong><br>
  <a href="${chatUrl}" style="color:#2563eb;word-break:break-all">${chatUrl}</a></p>
  <p style="font-size:13px;color:#374151"><strong>Script pour votre site :</strong><br>
  <code style="background:#1e1e2e;color:#a6e3a1;padding:6px 10px;border-radius:6px;font-size:11px;display:block;margin-top:4px;word-break:break-all">&lt;script src="${widgetUrl}" defer&gt;&lt;/script&gt;</code></p>
</div>`);
        }

        if (hasAgent("devis")) {
          const devisUrl = `${baseUrl}/devis/${devisToken}`;
          agentBlocks.push(`
<div style="background:#f5f3ff;border-left:3px solid #7c3aed;padding:16px 20px;border-radius:8px;margin-bottom:12px">
  <p style="font-weight:800;font-size:15px;margin-bottom:8px">📝 Agent Devis — Actif ✅</p>
  <p style="font-size:13px;color:#374151;margin-bottom:8px">Partagez ce lien à vos clients pour qu'ils reçoivent un devis automatique :</p>
  <a href="${devisUrl}" style="display:inline-block;background:#7c3aed;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">${devisUrl}</a>
</div>`);
        }

        if (hasAgent("reputation") && gmbAuthToken) {
          const gmbAuthUrl = `${baseUrl}/api/gmb/auth?token=${gmbAuthToken}`;
          agentBlocks.push(`
<div style="background:#fefce8;border-left:3px solid #ca8a04;padding:16px 20px;border-radius:8px;margin-bottom:12px">
  <p style="font-weight:800;font-size:15px;margin-bottom:8px">⭐ Agent Réputation — Connexion requise ⚠️</p>
  <p style="font-size:13px;color:#374151;margin-bottom:10px">Cliquez ci-dessous pour connecter votre Google My Business (2 minutes) :</p>
  <a href="${gmbAuthUrl}" style="display:inline-block;background:#4285F4;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:700;font-size:13px">🔗 Connecter Google My Business</a>
</div>`);
        }

        if (hasAgent("contenu")) {
          agentBlocks.push(`
<div style="background:#fdf4ff;border-left:3px solid #ec4899;padding:16px 20px;border-radius:8px;margin-bottom:12px">
  <p style="font-weight:800;font-size:15px;margin-bottom:8px">📱 Agent Contenu — Actif ✅</p>
  <p style="font-size:13px;color:#374151">Votre premier email de posts sera envoyé <strong>lundi prochain à 9h</strong>. Vous recevrez chaque semaine 5 posts prêts-à-publier pour Instagram et Facebook.</p>
</div>`);
        }

        if (hasAgent("fidelisation")) {
          agentBlocks.push(`
<div style="background:#f0fdf4;border-left:3px solid #16a34a;padding:16px 20px;border-radius:8px;margin-bottom:12px">
  <p style="font-weight:800;font-size:15px;margin-bottom:8px">💌 Agent Fidélisation — Configuration en cours</p>
  <p style="font-size:13px;color:#374151">Répondez à cet email avec votre liste de clients (fichier CSV ou copie-collez les emails) et nous configurons vos campagnes sous 24h.</p>
</div>`);
        }

        if (brevoKey) {
          await fetch("https://api.brevo.com/v3/smtp/email", {
            method: "POST",
            headers: { "api-key": brevoKey, "Content-Type": "application/json" },
            body: JSON.stringify({
              sender: { name: "Tom — AGENTConceptor", email: "contact@webconceptor.fr" },
              to: [{ email: ownerEmail, name: ownerName }],
              subject: `🤖 Vos agents IA sont prêts — ${businessName}`,
              htmlContent: `<div style="font-family:'Inter',system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#0a0a0a">
<div style="background:linear-gradient(135deg,#7c3aed,#2563eb);border-radius:16px;padding:24px;text-align:center;margin-bottom:24px">
  <p style="color:rgba(255,255,255,.7);font-size:13px;margin-bottom:4px">AGENTConceptor</p>
  <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0">Vos agents sont déployés !</h1>
  <p style="color:rgba(255,255,255,.8);font-size:14px;margin-top:8px">${businessName} — ${isPack ? "Pack Complet" : agentsList.length + " agent" + (agentsList.length > 1 ? "s" : "")}</p>
</div>

<p style="font-size:15px;margin-bottom:20px">Bonjour ${firstName}, voici tout ce dont vous avez besoin pour activer vos agents :</p>

${agentBlocks.join("\n")}

<div style="background:#f8f9fa;border-radius:12px;padding:16px 20px;margin-top:20px">
  <p style="font-size:14px;color:#525252;margin-bottom:4px"><strong>Des questions ?</strong></p>
  <p style="font-size:14px;color:#525252">Répondez directement à cet email ou appelez le <strong>06 35 59 24 71</strong>. Je réponds sous 2h.</p>
</div>

<div style="border-top:1px solid #e5e5e5;padding-top:20px;margin-top:24px;font-size:13px;color:#737373">
  <strong style="color:#0a0a0a">Tom Bauer</strong> — AGENTConceptor / WebConceptor<br>
  contact@webconceptor.fr · webconceptor.fr
</div>
</div>`,
            }),
          }).catch(() => {});
        }

        const agentNames = agentsList.map((id: string) => ({ chatbot: "Chatbot", reputation: "Réputation", devis: "Devis", contenu: "Contenu", fidelisation: "Fidélisation" }[id] || id)).join(", ");
        await notifyTelegram(`🤖 <b>Nouveau client AGENTConceptor !</b>\n\n<b>Client :</b> ${escapeTelegram(ownerName)}\n<b>Email :</b> ${escapeTelegram(ownerEmail)}\n<b>Entreprise :</b> ${escapeTelegram(businessName)}\n<b>Agents :</b> ${isPack ? "Pack Complet" : escapeTelegram(agentNames)}\n<b>MRR :</b> +${(monthlyAmt / 100).toFixed(0)}€/mois`);
      }

      return NextResponse.json({ received: true });
    }

    // ═══════════════════════════════════════════════════════
    // FLOW 6 : Code PIN (existant, via /code)
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
