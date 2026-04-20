import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { escapeTelegram } from "@/lib/security";

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
    const code = metadata.code;

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
