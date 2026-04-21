import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { escapeTelegram } from "@/lib/security";
import { generateCallScript } from "@/lib/call-script";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

/* ══════════════════════════════════════════
   GET /prospects/[slug]
   Sert le HTML de la maquette stocké dans la DB + log ouverture +
   notif Telegram "HOT LEAD" (1ère ouverture uniquement).
   ══════════════════════════════════════════ */

// Normalise un numéro français pour le lien tel: (garde seulement digits + préfixe +33)
function phoneToTelLink(raw: string): string {
  const digits = raw.replace(/[^0-9+]/g, "");
  if (!digits) return "";
  // 06/07 → +336/+337
  if (/^0[1-9]/.test(digits)) return "+33" + digits.slice(1);
  return digits;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug || slug.length > 100) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, name, mockup_html, opened_at, phone, email, address, city, google_rating, google_reviews_count, business_type, website, site_quality")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data || !data.mockup_html) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Maquette introuvable</title><meta charset="UTF-8"><style>body{font-family:system-ui,sans-serif;text-align:center;padding:60px 20px;color:#525252}h1{color:#0a0a0a}a{color:#0066ff}</style></head><body><h1>Maquette introuvable</h1><p>Cette maquette n'existe pas ou a été retirée.</p><p><a href="https://webconceptor.fr">Retour à WebConceptor</a></p></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  const isFirstOpen = !data.opened_at;

  // Log the view (non-blocking). is(opened_at, null) garantit un seul trigger.
  supabase
    .from("prospects")
    .update({
      opened_at: new Date().toISOString(),
      status: "opened",
    })
    .eq("id", data.id)
    .is("opened_at", null)
    .then(() => {});

  // Notify Telegram SEULEMENT à la 1ère ouverture (hot lead) — riche notif
  // avec SCRIPT D'APPEL personnalisé généré par Claude Haiku en parallèle
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (isFirstOpen && token && chatId) {
    // Pas bloquant pour la réponse HTML : on lance l'async et on ne l'attend pas
    (async () => {
      try {
        const phoneDisplay = data.phone || "";
        const phoneLink = phoneDisplay ? phoneToTelLink(phoneDisplay) : "";
        const isResto = data.business_type === "restaurant";
        const typeEmoji = isResto ? "🍽️" : "🛒";
        const typeLabel = isResto ? "Restaurant" : "Commerçant";

        const parisTime = new Date().toLocaleTimeString("fr-FR", {
          timeZone: "Europe/Paris",
          hour: "2-digit",
          minute: "2-digit",
        });

        // Génère le script d'appel via Claude (1-3s typiquement)
        const script = await generateCallScript({
          prospectName: data.name,
          city: data.city,
          businessType: data.business_type,
          googleRating: data.google_rating,
          googleReviewsCount: data.google_reviews_count,
          siteQuality: data.site_quality,
          address: data.address,
        });

        const phoneLine = phoneDisplay
          ? `📞 <a href="tel:${escapeTelegram(phoneLink)}"><b>${escapeTelegram(phoneDisplay)}</b></a>`
          : `📞 <i>Pas de numéro disponible</i>`;

        const questionsBlock = script.discoveryQuestions.slice(0, 5).map((q, i) => `${i + 1}. ${escapeTelegram(q)}`).join("\n");
        const hooksBlock = script.hooks.slice(0, 3).map((h, i) => `${i + 1}. ${escapeTelegram(h)}`).join("\n");
        const objectionsBlock = script.objectionHandlers.slice(0, 4).map((o) => `• ${escapeTelegram(o)}`).join("\n");

        const message =
          `🔥 <b>HOT LEAD — ${typeLabel} a ouvert sa maquette</b>\n\n` +
          `<b>${typeEmoji} ${escapeTelegram(data.name)}</b>\n` +
          `📍 ${escapeTelegram(data.address || data.city || "—")}\n` +
          phoneLine + "\n" +
          (data.email ? `✉️ ${escapeTelegram(data.email)}\n` : "") +
          (data.google_rating ? `⭐ ${data.google_rating}/5 (${data.google_reviews_count || 0} avis)\n` : "") +
          `⏰ Ouverte à ${escapeTelegram(parisTime)}\n\n` +
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `<b>⏰ Quand rappeler :</b> 45 min à 1 h après l'ouverture (ne PAS appeler dans les 5 min, ça fait tracking).\n\n` +
          `<b>🎯 Objectif principal :</b> fixer un RDV visio 15-20 min — sauf si le prospect veut acheter tout de suite (alors on envoie le lien Stripe).\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `<b>🎬 OUVERTURE (lis-la mot à mot)</b>\n` +
          `<i>« ${escapeTelegram(script.opening)} »</i>\n\n` +
          `<b>❓ QUESTIONS À POSER PENDANT L'APPEL</b>\n${questionsBlock}\n\n` +
          `<b>🎯 Accroches RDV si hésitation :</b>\n${hooksBlock}\n\n` +
          `<b>🛡 Objections :</b>\n${objectionsBlock}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🎯 <a href="https://webconceptor.fr/prospects/${escapeTelegram(slug)}">Voir la maquette envoyée</a>` +
          (data.website ? `\n🌐 <a href="${escapeTelegram(data.website)}">Son site actuel</a>` : "");

        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        });
      } catch {
        // Fallback : envoie au moins la notif de base sans le script si Claude foire
        const simpleMsg = `🔥 <b>HOT LEAD</b> · ${escapeTelegram(data.name)} vient d'ouvrir sa maquette. Tél : ${escapeTelegram(data.phone || "?")}`;
        fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: simpleMsg,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
        }).catch(() => {});
      }
    })();
  }

  return new NextResponse(data.mockup_html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=300",
    },
  });
}
