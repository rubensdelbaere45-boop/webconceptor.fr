import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════
   GET /api/gmb/callback?code=XXX&state=AUTH_TOKEN

   Callback OAuth Google.
   - Échange le code contre access_token + refresh_token
   - Récupère l'account + location Google My Business
   - Active l'abonnement en base
   - Envoie email de confirmation
   ══════════════════════════════════════════ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://klyora.fr";

function htmlPage(title: string, body: string): string {
  return `<!DOCTYPE html><html lang="fr"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
body{font-family:-apple-system,sans-serif;background:#f8fafc;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px}
.card{background:#fff;max-width:480px;padding:40px 32px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,.08);text-align:center}
h1{font-size:22px;margin:0 0 12px}
p{font-size:15px;color:#525252;line-height:1.6;margin:0 0 10px}
.icon{font-size:48px;margin-bottom:16px}
a{color:#0066ff;text-decoration:none;font-weight:500}
</style>
</head><body><div class="card">${body}</div></body></html>`;
}

async function sendConfirmationEmail(ownerEmail: string, ownerName: string, businessName: string) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return;

  const firstName = (ownerName || "").split(" ")[0] || "vous";

  await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Tom Bauer — Klyora Sites", email: "contact@klyora.fr" },
      to: [{ email: ownerEmail, name: ownerName }],
      subject: `✅ Votre agent avis Google est actif — ${businessName}`,
      htmlContent: `<div style="font-family:'Inter',system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0a0a0a">
<h1 style="font-size:22px;margin-bottom:8px">Votre agent IA est maintenant actif ✅</h1>
<p style="color:#525252;font-size:15px;margin-bottom:24px">
  Bonjour ${firstName}, votre agent répond désormais automatiquement à tous les avis Google de <strong>${businessName}</strong>.
</p>
<div style="background:#f0fdf4;border-left:3px solid #22c55e;padding:20px;border-radius:8px;margin-bottom:24px">
  <p style="font-size:14px;color:#15803d;font-weight:600;margin:0 0 8px">Ce que l'agent fait automatiquement :</p>
  <ul style="font-size:14px;color:#166534;margin:0;padding-left:20px">
    <li>Répond à chaque nouvel avis Google sous 1h</li>
    <li>Adapte le ton selon le type d'avis (positif / négatif)</li>
    <li>Intègre le nom de votre établissement naturellement</li>
    <li>Vous envoie un rapport mensuel de réputation</li>
  </ul>
</div>
<p style="font-size:14px;color:#525252">Aucune action supplémentaire n'est requise de votre part. L'agent fonctionne en arrière-plan, 24h/24.</p>
<p style="font-size:14px;color:#525252;margin-top:16px">Une question ? Répondez directement à cet email.</p>
<div style="border-top:1px solid #e5e5e5;padding-top:20px;margin-top:24px;font-size:13px;color:#737373">
  <p style="margin-bottom:4px"><strong style="color:#0a0a0a">Tom Bauer</strong> — Klyora Sites</p>
  <p style="margin:0">contact@klyora.fr · 06 35 59 24 71</p>
</div>
</div>`,
    }),
  }).catch(() => {});
}

export async function GET(req: NextRequest) {
  const code      = req.nextUrl.searchParams.get("code")  || "";
  const authToken = req.nextUrl.searchParams.get("state") || "";
  const error     = req.nextUrl.searchParams.get("error") || "";

  if (error || !code || !authToken) {
    return new NextResponse(
      htmlPage("Connexion annulée", `
        <div class="icon">❌</div>
        <h1>Connexion annulée</h1>
        <p>Vous avez annulé la connexion Google. <a href="${baseUrl}/api/gmb/auth?token=${authToken}">Réessayer</a></p>
        <p>Besoin d'aide ? Écrivez à <a href="mailto:contact@klyora.fr">contact@klyora.fr</a></p>
      `),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const supabase = getSupabase();

  // Vérifier le auth_token
  const { data: sub } = await supabase
    .from("gmb_subscriptions")
    .select("id, owner_email, owner_name, business_name, status")
    .eq("auth_token", authToken)
    .single();

  if (!sub) {
    return new NextResponse(
      htmlPage("Lien invalide", `<div class="icon">⚠️</div><h1>Lien invalide</h1><p>Contactez <a href="mailto:contact@klyora.fr">contact@klyora.fr</a></p>`),
      { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Échanger le code contre les tokens
  const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID     || "";
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";
  const redirectUri  = `${baseUrl}/api/gmb/callback`;

  let accessToken  = "";
  let refreshToken = "";
  let tokenExpiry  = new Date().toISOString();

  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error_description || tokenData.error);

    accessToken  = tokenData.access_token  || "";
    refreshToken = tokenData.refresh_token || "";
    const expiresIn = tokenData.expires_in || 3600;
    tokenExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();
  } catch (err) {
    console.error("[gmb/callback] token exchange error:", err);
    return new NextResponse(
      htmlPage("Erreur OAuth", `<div class="icon">❌</div><h1>Erreur de connexion</h1><p>Problème technique lors de la connexion Google. <a href="${baseUrl}/api/gmb/auth?token=${authToken}">Réessayer</a></p>`),
      { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Récupérer le premier account + location Google My Business
  let googleAccountId  = "";
  let googleLocationId = "";

  try {
    const accountRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const accountData = await accountRes.json();
    const accounts = accountData.accounts || [];
    if (accounts.length > 0) {
      googleAccountId = accounts[0].name; // ex: "accounts/123456"

      const locRes = await fetch(
        `https://mybusinessbusinessinformation.googleapis.com/v1/${googleAccountId}/locations?readMask=name,title`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const locData = await locRes.json();
      const locations = locData.locations || [];
      if (locations.length > 0) {
        googleLocationId = locations[0].name; // ex: "locations/987654"
      }
    }
  } catch (err) {
    console.error("[gmb/callback] GMB API error:", err);
    // On continue quand même — le cron tentera de récupérer les locations
  }

  // Mettre à jour la base
  await supabase
    .from("gmb_subscriptions")
    .update({
      google_access_token:  accessToken,
      google_refresh_token: refreshToken,
      google_token_expiry:  tokenExpiry,
      google_account_id:    googleAccountId || null,
      google_location_id:   googleLocationId || null,
      status:               "active",
      updated_at:           new Date().toISOString(),
    })
    .eq("id", sub.id);

  // Email de confirmation
  await sendConfirmationEmail(sub.owner_email, sub.owner_name || "", sub.business_name);

  // Notif Telegram
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId  = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId) {
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `🌟 <b>Nouvel abonnement Agent Avis Google ACTIF</b>\n\n<b>Entreprise :</b> ${sub.business_name}\n<b>Email :</b> ${sub.owner_email}\n<b>Google Account :</b> ${googleAccountId || "Non détecté"}\n<b>Location :</b> ${googleLocationId || "Non détectée"}`,
        parse_mode: "HTML",
      }),
    }).catch(() => {});
  }

  return new NextResponse(
    htmlPage("Connexion réussie !", `
      <div class="icon">✅</div>
      <h1>Votre agent est actif !</h1>
      <p>Félicitations ! Votre agent IA va maintenant répondre automatiquement à tous les avis Google de <strong>${sub.business_name}</strong>.</p>
      <p>Vous allez recevoir un email de confirmation dans quelques instants.</p>
      <p style="margin-top:24px;font-size:13px;color:#9ca3af">Une question ? <a href="mailto:contact@klyora.fr">contact@klyora.fr</a></p>
    `),
    { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
