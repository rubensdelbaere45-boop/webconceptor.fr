import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/track-view
   Public — appelé par le JS embarqué dans la maquette quand un HUMAIN
   interagit réellement avec la page (scroll, click, tap, mouvement souris).

   Body : { slug, fp?: string }  (fp = fingerprint léger client)

   C'est la SEULE façon d'incrémenter view_count désormais. Les scanners
   email (Mimecast, Proofpoint, Microsoft Defender, etc.) ouvrent la maquette
   mais n'exécutent presque jamais le JS et ne simulent jamais d'interactions
   utilisateur → ils n'atteignent pas cet endpoint.

   Protections :
   - Rate-limit : max 1 view count incrémenté par IP+slug toutes les 30 min
     (même si un humain reload, on ne compte pas ça comme 2 vues distinctes)
   - Vérif UA + headers suspicieux (bot en user-agent réaliste = refus)
   - Pas de Referer = suspect (mais pas rejet immédiat, certains navigateurs
     le cachent legitimement)
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

// Réutilise la liste bot du slug route (dupliqué volontairement pour éviter
// un import cyclique). Si tu modifies l'une, modifie l'autre.
function isBotUserAgent(ua: string): boolean {
  if (!ua || ua.trim().length === 0) return true;
  const lower = ua.toLowerCase();
  const botSignatures = [
    "bot", "crawl", "spider", "scrape", "fetch", "curl", "wget", "python",
    "java/", "httpclient", "okhttp", "headless", "phantom", "selenium",
    "puppeteer", "playwright",
    "google-image", "googlebot", "gmail", "googlewebpreview", "googleother",
    "outlook", "office365", "microsoft-webscraper", "safelinks", "defender",
    "symantec", "mimecast", "proofpoint", "barracuda", "trendmicro",
    "brevo", "sendinblue", "sendgrid", "mailgun", "mandrill", "postmark",
    "messagelabs", "forcepoint", "urldefense", "tineye",
    "slackbot", "twitterbot", "facebookexternalhit", "linkedinbot",
    "whatsapp", "telegrambot", "discordbot",
    "uptime", "pingdom", "statuscake", "monitis", "newrelic",
  ];
  return botSignatures.some((sig) => lower.includes(sig));
}

// Détecte les signatures de scanner qui FAKE un navigateur :
//   - headers d'intégration browser (sec-fetch-*) totalement absents
//   - Accept-Language absent (99 % des vrais navigateurs le mettent)
//   - Accept-Encoding absent (99 % des vrais navigateurs l'envoient)
function looksLikeFakeBrowser(req: NextRequest): boolean {
  const h = req.headers;
  const secFetchMode = h.get("sec-fetch-mode");
  const secFetchSite = h.get("sec-fetch-site");
  const acceptLang = h.get("accept-language");
  const acceptEnc = h.get("accept-encoding");

  // Tous les signaux manquants ensemble = très forte probabilité scanner
  const missing = [!secFetchMode, !secFetchSite, !acceptLang, !acceptEnc].filter(Boolean).length;
  return missing >= 3;
}

export async function POST(req: NextRequest) {
  // Rate-limit IP+slug : max 1 vue comptée par IP+slug toutes les 30 min
  // (évite les multi-pings du même humain ou les bots qui retentent)
  const ip = getClientIp(req.headers);

  let body: { slug?: string; fp?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const slug = typeof body.slug === "string" ? body.slug.slice(0, 100) : "";
  if (!slug || !/^[a-z0-9_-]+$/i.test(slug)) {
    return NextResponse.json({ error: "Slug invalide" }, { status: 400 });
  }

  // Clé rate-limit : la même IP ne peut compter qu'1 vue par 30 min pour le même slug
  const rl = rateLimit(`trackview:${ip}:${slug}`, 1, 1800);
  if (!rl.ok) {
    // Reload du même humain → ne compte pas
    return NextResponse.json({ success: true, counted: false, reason: "rate_limited" });
  }

  // Vérification double UA + headers suspects
  const ua = req.headers.get("user-agent") || "";
  if (isBotUserAgent(ua)) {
    return NextResponse.json({ success: true, counted: false, reason: "bot_ua" });
  }
  if (looksLikeFakeBrowser(req)) {
    return NextResponse.json({ success: true, counted: false, reason: "fake_browser" });
  }

  const supabase = getSupabaseAdmin();

  // Récupère et incrémente view_count de manière (presque) atomique
  const { data: current, error: fetchErr } = await supabase
    .from("prospects")
    .select("id, view_count, opened_at, status, name, phone, email, city, google_rating, google_reviews_count, site_quality")
    .eq("slug", slug)
    .maybeSingle();

  if (fetchErr || !current) {
    return NextResponse.json({ success: false, error: "Prospect introuvable" }, { status: 404 });
  }

  const prevCount = ((current.view_count as number | null) ?? 0);
  const nextCount = prevCount + 1;
  const updates: Record<string, unknown> = { view_count: nextCount };
  const isFirstView = !current.opened_at;

  // Première ouverture humaine vérifiée ? On met à jour opened_at et status
  if (isFirstView) {
    updates.opened_at = new Date().toISOString();
    if (current.status === "sent" || current.status === "ready") {
      updates.status = "opened";
    }
  }

  await supabase.from("prospects").update(updates).eq("id", current.id);

  // ── Alerte Telegram IMMÉDIATE sur 1ère vue ────────────────────────────────
  // C'est le signal le plus chaud possible : un prospect HUMAIN regarde ta maquette.
  // Appelle-le dans les 5 minutes → taux de conversion 9× plus élevé.
  if (isFirstView || nextCount === 2) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (token && chatId) {
      const p = current as Record<string, unknown>;
      const name = String(p.name || "Inconnu");
      const city = String(p.city || "—");
      const phone = String(p.phone || "—");
      const email = String(p.email || "—");
      const rating = p.google_rating ? `${p.google_rating}/5 · ${p.google_reviews_count || 0} avis` : "—";
      const siteLabel = p.site_quality === "none" ? "❌ AUCUN site" : p.site_quality === "poor" ? "⚠️ Site vieillissant" : "Site existant";
      const mockupUrl = `https://klyora.fr/prospects/${slug}`;
      const phoneLink = phone !== "—" ? `\n\n<a href="tel:${phone.replace(/\s/g, "")}">📞 Appeler ${phone}</a>` : "";

      const msg = isFirstView
        ? `🔥 <b>MAQUETTE OUVERTE — APPELLE MAINTENANT</b>\n\n` +
          `<b>${name}</b> · ${city}\n` +
          `📞 ${phone}\n` +
          `✉️ ${email}\n` +
          `⭐ ${rating}\n` +
          `🌐 ${siteLabel}\n` +
          `${phoneLink}\n\n` +
          `⏱ <i>Appelle dans les 5 min = 9× plus de chances de vendre</i>\n\n` +
          `<a href="${mockupUrl}">→ Voir sa maquette</a>`
        : `👀 <b>2ÈME VUE</b> — ${name} revient sur sa maquette !\n` +
          `📞 ${phone} · ${city}\n<a href="${mockupUrl}">→ Maquette</a>`;

      fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: msg,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, counted: true, view_count: nextCount });
}
