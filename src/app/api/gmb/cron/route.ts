import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, isWithinSendingHours } from "@/lib/security";

/* ══════════════════════════════════════════
   GET|POST /api/gmb/cron
   Auth : x-admin-key OU x-cron-secret

   Tourne toutes les heures (9h-20h Paris).
   Pour chaque abonnement actif :
   1. Refresh le token Google si expiré
   2. Récupère les avis sans réponse
   3. Génère une réponse IA adaptée au ton
   4. Poste la réponse via Google My Business API
   ══════════════════════════════════════════ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

interface GmbSub {
  id: string;
  business_name: string;
  business_type: string;
  owner_email: string;
  google_account_id: string;
  google_location_id: string;
  google_access_token: string;
  google_refresh_token: string;
  google_token_expiry: string;
  response_tone: string;
  business_description: string | null;
  auto_respond: boolean;
  respond_to_positive: boolean;
  respond_to_negative: boolean;
  reviews_responded: number;
  reviews_checked: number;
}

// Refresh le token Google si nécessaire
async function refreshGoogleToken(sub: GmbSub): Promise<string | null> {
  const expiry = new Date(sub.google_token_expiry).getTime();
  const now    = Date.now();
  if (now < expiry - 5 * 60 * 1000) return sub.google_access_token; // Encore valide

  const clientId     = process.env.GOOGLE_OAUTH_CLIENT_ID     || "";
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET || "";

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     clientId,
        client_secret: clientSecret,
        refresh_token: sub.google_refresh_token,
        grant_type:    "refresh_token",
      }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.error);

    const newToken  = data.access_token;
    const expiresIn = data.expires_in || 3600;
    const newExpiry = new Date(Date.now() + expiresIn * 1000).toISOString();

    const supabase = getSupabase();
    await supabase
      .from("gmb_subscriptions")
      .update({ google_access_token: newToken, google_token_expiry: newExpiry })
      .eq("id", sub.id);

    return newToken;
  } catch (err) {
    console.error(`[gmb/cron] refresh token error for ${sub.id}:`, err);
    return null;
  }
}

// Génère une réponse IA au format court
async function generateReply(
  businessName: string,
  businessType: string,
  tone: string,
  reviewText: string,
  rating: number,
  reviewerName: string,
  businessDescription?: string | null
): Promise<string> {
  const apiKey   = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  const isOR     = Boolean(process.env.OPENROUTER_API_KEY);
  const apiUrl   = isOR ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.anthropic.com/v1/messages";
  const isPositive = rating >= 4;

  const systemPrompt = [
    `Tu es un community manager expert en gestion de réputation en ligne pour "${businessName}" (${businessType}).`,
    `Rédige des réponses aux avis Google en français, ton "${tone}".`,
    `Règles absolues :`,
    `- Réponse de 2-4 phrases maximum (jamais plus)`,
    `- Commence TOUJOURS par remercier le client par son prénom (${reviewerName.split(" ")[0] || "cher client"})`,
    `- Ne copie jamais mot pour mot l'avis du client`,
    `- Pour les avis négatifs (≤3 étoiles) : reconnaître, s'excuser, proposer de recontacter directement`,
    `- Pour les avis positifs (≥4 étoiles) : chaleureux, naturel, pas exagéré`,
    `- Signe toujours avec "L'équipe ${businessName}"`,
    `- Ne jamais utiliser d'emojis en excès (max 1)`,
    businessDescription ? `\nContexte : ${businessDescription}` : "",
  ].filter(Boolean).join("\n");

  const userMessage = isPositive
    ? `Réponds à cet avis ${rating} étoiles de ${reviewerName} : "${reviewText || "Très bien, je recommande !"}" `
    : `Réponds à cet avis négatif ${rating} étoiles de ${reviewerName} : "${reviewText || "Pas satisfait."}" Sois empathique et propose de recontacter en privé.`;

  try {
    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(isOR ? { "HTTP-Referer": "https://klyora.fr" } : {}),
      },
      body: JSON.stringify({
        model: isOR ? "anthropic/claude-haiku-4-5" : "claude-haiku-4-5",
        max_tokens: 200,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }),
      signal: AbortSignal.timeout(12_000),
    });

    const data = await res.json();
    return (data.choices?.[0]?.message?.content || data.content?.[0]?.text || "").trim();
  } catch {
    return `Merci ${reviewerName.split(" ")[0] || "pour votre retour"} ! Nous vous remercions de votre avis et espérons vous revoir bientôt. L'équipe ${businessName}`;
  }
}

// Récupère et répond aux avis d'un abonnement
async function processSubscription(sub: GmbSub): Promise<{ responded: number; errors: number }> {
  if (!sub.google_location_id || !sub.auto_respond) return { responded: 0, errors: 0 };

  const accessToken = await refreshGoogleToken(sub);
  if (!accessToken) return { responded: 0, errors: 1 };

  let responded = 0;
  let errors    = 0;

  try {
    // Récupérer les avis récents
    const reviewsUrl = `https://mybusiness.googleapis.com/v4/${sub.google_location_id}/reviews?pageSize=10&orderBy=updateTime desc`;
    const reviewsRes = await fetch(reviewsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!reviewsRes.ok) {
      console.error(`[gmb/cron] reviews fetch error for ${sub.id}: ${reviewsRes.status}`);
      return { responded: 0, errors: 1 };
    }

    const reviewsData = await reviewsRes.json();
    const reviews = reviewsData.reviews || [];

    for (const review of reviews) {
      // Skip si déjà répondu
      if (review.reviewReply) continue;

      const rating = { ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5 }[
        review.starRating as string
      ] || 3;

      // Respect des préférences du client
      if (rating >= 4 && !sub.respond_to_positive) continue;
      if (rating <= 3 && !sub.respond_to_negative) continue;

      const reviewText   = review.comment || "";
      const reviewerName = review.reviewer?.displayName || "Client";

      const reply = await generateReply(
        sub.business_name,
        sub.business_type,
        sub.response_tone,
        reviewText,
        rating,
        reviewerName,
        sub.business_description
      );

      if (!reply) { errors++; continue; }

      // Poster la réponse
      const replyUrl = `https://mybusiness.googleapis.com/v4/${review.name}/reply`;
      const replyRes = await fetch(replyUrl, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ comment: reply }),
      });

      if (replyRes.ok) {
        responded++;
      } else {
        const errText = await replyRes.text().catch(() => "");
        console.error(`[gmb/cron] reply error for review ${review.name}: ${replyRes.status} ${errText}`);
        errors++;
      }

      // Petite pause pour ne pas surcharger l'API
      await new Promise((r) => setTimeout(r, 500));
    }
  } catch (err) {
    console.error(`[gmb/cron] error processing ${sub.id}:`, err);
    errors++;
  }

  // Mise à jour des stats
  if (responded > 0) {
    const supabase = getSupabase();
    await supabase
      .from("gmb_subscriptions")
      .update({
        reviews_responded: (sub.reviews_responded || 0) + responded,
        reviews_checked:   (sub.reviews_checked   || 0) + responded + errors,
        last_check_at:     new Date().toISOString(),
      })
      .eq("id", sub.id);
  }

  return { responded, errors };
}

async function handler(req: NextRequest) {
  const adminKey   = req.headers.get("x-admin-key")   || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const adminOK    = safeCompare(adminKey,   process.env.ADMIN_SECRET_KEY);
  const cronOK     = safeCompare(cronSecret, process.env.CRON_SECRET);

  if (!adminOK && !cronOK) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Seulement 9h-20h Paris
  if (!isWithinSendingHours(9, 20)) {
    return NextResponse.json({ success: true, processed: 0, skipped_curfew: true });
  }

  const supabase = getSupabase();
  const { data: subscriptions, error } = await supabase
    .from("gmb_subscriptions")
    .select("*")
    .eq("status", "active")
    .not("google_location_id", "is", null)
    .limit(20);

  if (error || !subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun abonnement actif" });
  }

  let totalResponded = 0;
  let totalErrors    = 0;

  for (const sub of subscriptions as GmbSub[]) {
    const { responded, errors } = await processSubscription(sub);
    totalResponded += responded;
    totalErrors    += errors;
  }

  // Notif Telegram si activité
  if (totalResponded > 0) {
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId  = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && chatId) {
      fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🌟 <b>Agent Avis Google</b>\n\nRéponses postées : ${totalResponded}\nAbonnements traités : ${subscriptions.length}\nErreurs : ${totalErrors}`,
          parse_mode: "HTML",
          disable_notification: true,
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({
    success: true,
    processed: subscriptions.length,
    responded: totalResponded,
    errors: totalErrors,
  });
}

export async function GET(req: NextRequest)  { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
