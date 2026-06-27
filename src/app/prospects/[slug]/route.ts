import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { escapeTelegram } from "@/lib/security";
import { generateCallScript } from "@/lib/call-script";
import { buildSalesUiSnippet } from "@/lib/sales-ui-snippet";
import { generateAdaptiveMockupHtml, type AdaptiveProspect } from "@/lib/mockup-adaptive";
import { generatePremiumUniversalMockupHtml } from "@/lib/mockup-premium-universal";
import { generateFleuristePremiumMockupHtml } from "@/lib/mockup-fleuriste-premium";
import { buildDemoWatermarkSnippet, stripOldDemoWatermark } from "@/lib/demo-watermark";

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

// Retire un <div id="..."> et tout son contenu (gère les divs imbriquées correctement)
function stripDivById(html: string, id: string): string {
  const marker = `id="${id}"`;
  const markerIdx = html.indexOf(marker);
  if (markerIdx === -1) return html;
  const divStart = html.lastIndexOf('<div', markerIdx);
  if (divStart === -1) return html;
  let depth = 0;
  let i = divStart;
  while (i < html.length) {
    if (html[i] === '<') {
      if (/^<div[\s>]/i.test(html.slice(i, i + 5))) {
        depth++;
        i += 4;
      } else if (/^<\/div>/i.test(html.slice(i, i + 6))) {
        depth--;
        if (depth === 0) return html.slice(0, divStart) + html.slice(i + 6);
        i += 6;
      } else {
        i++;
      }
    } else {
      i++;
    }
  }
  return html;
}

// Retire toute ancienne version du snippet (avec ou sans marqueurs WC-SX-START/END).
// Garantit que la version fraîche est toujours injectée, même si le mockup_html en DB
// a été sauvegardé avec une ancienne version du snippet déjà embarquée.
function stripOldSnippet(html: string): string {
  let clean = html;
  // Cas 1 : snippet récent avec marqueurs (rapide et précis)
  clean = clean.replace(/<!--\s*WC-SX-START\s*-->[\s\S]*?<!--\s*WC-SX-END\s*-->/g, '');
  // Cas 2 : ancien snippet sans marqueurs (contenu DB historique)
  clean = clean.replace(/<script>\s*\(function wcSxInit\b[\s\S]*?<\/script>/g, '');
  clean = clean.replace(/<style>\s*\/\* ─── CTA bar fixe en haut[\s\S]*?<\/style>/g, '');
  clean = stripDivById(clean, 'wc-sx-cta');
  clean = stripDivById(clean, 'wc-sx-overlay');
  // Cas 3 : ancienne barre Stitch injectée directement dans le mockup_html en DB
  clean = clean.replace(/<!--\s*STITCH_GENERATED\s*-->[\s\S]*?<div style="height:44px"><\/div>/g, '');
  // Cas 4 : badges Klyora Sites des anciens templates mockup-adaptive / mockup-custom
  // → bouton "W Klyora Sites" en haut à gauche, badge "MAQUETTE RETIRÉE À L'ACHAT" en haut à droite,
  //   barre flottante "Badges Klyora Sites retirés automatiquement",
  //   footer "APERÇU KLYORA SITES — les mentions ci-présentes...",
  //   watermark CSS qui répète "Klyora Sites" en fond
  clean = stripDivByClass(clean, 'wc-home-btn');
  clean = stripDivByClass(clean, 'wc-demo-badge');
  clean = stripDivByClass(clean, 'wc-watermark');
  clean = stripDivByClass(clean, 'wc-info-banner');
  clean = stripDivByClass(clean, 'wc-footer-info');
  clean = stripDivByClass(clean, 'wc-aperçu-footer');
  // Footer "Design, code et intégration : Klyora Sites" / "Maquette générée par Klyora Sites"
  clean = clean.replace(/<footer[^>]*>[^<]*Klyora Sites[^<]*<\/footer>/gi, '');
  clean = clean.replace(/<div[^>]*class="[^"]*wc-aperçu[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');
  // Meta tags author/copyright Klyora Sites
  clean = clean.replace(/<meta[^>]+(?:author|copyright)[^>]*Klyora Sites[^>]*>/gi, '');
  return clean;
}

function stripDivByClass(html: string, className: string): string {
  // Trouve un <div class="...className..."> et retire tout jusqu'à son </div> correspondant
  const re = new RegExp(`<div\\s+[^>]*class="[^"]*\\b${className}\\b[^"]*"[^>]*>`, 'i');
  let result = html;
  let match;
  while ((match = re.exec(result)) !== null) {
    const start = match.index;
    let depth = 1;
    let i = start + match[0].length;
    while (depth > 0 && i < result.length) {
      const nextOpen = result.indexOf('<div', i);
      const nextClose = result.indexOf('</div>', i);
      if (nextClose === -1) break;
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        i = nextOpen + 4;
      } else {
        depth--;
        i = nextClose + 6;
      }
    }
    if (depth === 0) {
      result = result.slice(0, start) + result.slice(i);
    } else {
      break; // structure cassée → on s'arrête
    }
  }
  return result;
}

// Normalise un numéro français pour le lien tel: (garde seulement digits + préfixe +33)
function phoneToTelLink(raw: string): string {
  const digits = raw.replace(/[^0-9+]/g, "");
  if (!digits) return "";
  // 06/07 → +336/+337
  if (/^0[1-9]/.test(digits)) return "+33" + digits.slice(1);
  return digits;
}

// Détecte les bots (Gmail link preview, antispam scanners, crawlers, Brevo,
// Outlook SafeLinks, etc.) qui ouvrent la maquette AUTOMATIQUEMENT dès la
// réception du mail. Sans ce filtre, on reçoit des faux HOT LEAD pour rien.
function isBotUserAgent(ua: string): boolean {
  if (!ua || ua.trim().length === 0) return true; // pas d'UA = bot
  const lower = ua.toLowerCase();
  const botSignatures = [
    "bot", "crawl", "spider", "scrape", "fetch", "curl", "wget", "python",
    "java/", "httpclient", "okhttp", "headless", "phantom", "selenium",
    "puppeteer", "playwright",
    // Mail preview / antispam / link scanners
    "google-image", "googlebot", "gmail", "googlewebpreview", "googleother",
    "outlook", "office365", "microsoft-webscraper", "safelinks", "defender",
    "symantec", "mimecast", "proofpoint", "barracuda", "trendmicro",
    "brevo", "sendinblue", "sendgrid", "mailgun", "mandrill", "postmark",
    "messagelabs", "forcepoint", "urldefense", "tineye",
    // Preview services
    "slackbot", "twitterbot", "facebookexternalhit", "linkedinbot",
    "whatsapp", "telegrambot", "discordbot",
    // Uptime monitors
    "uptime", "pingdom", "statuscake", "monitis", "newrelic",
  ];
  return botSignatures.some((sig) => lower.includes(sig));
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const promoParam = new URL(req.url).searchParams.get("promo");
  const promoDiscount = promoParam === "20" ? 20 : promoParam === "15" ? 15 : 0;
  const promoCode = promoDiscount === 15 ? "AMELIE15" : promoDiscount === 20 ? "PROMO20" : null;

  if (!slug || slug.length > 100) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, name, mockup_html, opened_at, phone, email, address, city, google_rating, google_reviews_count, business_type, website, site_quality, menu_items, reviews, about_scraped, website_photos, site_style_dna, hours, is_luxury, access_code")
    .eq("slug", slug)
    .maybeSingle();

  // ─── GATE PAR CODE D'ACCÈS (protection légale anti-huissier) ─────────
  // Si le prospect a un code :
  //   1. Si ?code=XXXX-XXXX dans l'URL et qu'il matche → auto-unlock,
  //      set cookie + redirige vers URL sans le code (propre).
  //   2. Sinon si cookie valide → laisse passer.
  //   3. Sinon → page de gate.
  //
  // Le pré-fill ?code= dans les mails élimine 99% de la friction tout en
  // restant légalement protégé (l'huissier qui veut faire constat n'a aucun
  // code donc tombe sur le gate ; chaque prospect a un code unique non
  // partageable car traçable en DB via prospect_access_attempts).
  if (data?.access_code) {
    const { hasValidAccessCookie, renderGatePage, buildAccessCookie, normalizeAccessCode } = await import("@/lib/access-code");
    const urlCode = new URL(req.url).searchParams.get("code") || "";

    // ── MASTER CODE (Tom uniquement) ──────────────────────────────────
    // Si MASTER_ACCESS_CODE est défini en env Vercel et que le code dans
    // l'URL matche, unlock toutes les maquettes sans contraintes.
    // Cookie séparé "klyora_master_access" valable 30 jours.
    // Pas de log dans prospect_access_attempts pour ne pas polluer
    // les stats funnel.
    const masterCode = (process.env.MASTER_ACCESS_CODE || "").trim();
    const masterCookieMatch = (req.headers.get("cookie") || "").match(/klyora_master_access=([^;]+)/);
    const hasMasterCookie = masterCode && masterCookieMatch && decodeURIComponent(masterCookieMatch[1]) === masterCode;
    const masterFromUrl = masterCode && urlCode.trim() === masterCode;

    if (hasMasterCookie) {
      // Master cookie présent → laisse passer sans rien faire
    } else if (masterFromUrl) {
      // Master code dans l'URL → set cookie 30j + redirige clean
      const cleanUrl = `/prospects/${encodeURIComponent(slug)}`;
      return new NextResponse(null, {
        status: 302,
        headers: {
          Location: cleanUrl,
          "Set-Cookie": `klyora_master_access=${encodeURIComponent(masterCode)}; Path=/; Max-Age=2592000; SameSite=Lax; HttpOnly; Secure`,
          "Cache-Control": "no-store",
        },
      });
    } else if (urlCode) {
      // 1) Code dans l'URL → tente l'auto-unlock prospect
      const normalized = normalizeAccessCode(urlCode);
      if (normalized === data.access_code) {
        // Log dans prospect_access_attempts (visite réussie via URL)
        await supabase.from("prospect_access_attempts").insert({
          prospect_id: data.id,
          slug,
          code_tried: urlCode.slice(0, 32),
          success: true,
          ip: req.headers.get("x-forwarded-for") || null,
          user_agent: (req.headers.get("user-agent") || "").slice(0, 500),
          referer: (req.headers.get("referer") || "").slice(0, 500),
        });
        // Increment unlock counter + set first_unlocked
        const { data: cur } = await supabase
          .from("prospects")
          .select("access_code_first_unlocked_at, access_code_unlock_count")
          .eq("id", data.id)
          .maybeSingle();
        const firstUnlock = !cur?.access_code_first_unlocked_at;
        await supabase
          .from("prospects")
          .update({
            access_code_unlock_count: (cur?.access_code_unlock_count || 0) + 1,
            ...(firstUnlock ? { access_code_first_unlocked_at: new Date().toISOString() } : {}),
          })
          .eq("id", data.id);

        // Redirect vers URL sans le code + set cookie 30j
        const cleanUrl = `/prospects/${encodeURIComponent(slug)}`;
        return new NextResponse(null, {
          status: 302,
          headers: {
            Location: cleanUrl,
            "Set-Cookie": buildAccessCookie(slug, normalized),
            "Cache-Control": "no-store",
          },
        });
      }
      // Code dans URL invalide → on continue vers le check cookie / gate
    }

    // 2) Cookie déjà set ? (master OU prospect)
    const valid = hasMasterCookie || hasValidAccessCookie(req, slug, data.access_code);
    if (!valid) {
      // 3) Affiche le gate
      return new NextResponse(renderGatePage({ slug, prospectName: data.name || undefined, error: false }), {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }
  }

  if (error || !data) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Maquette introuvable</title><meta charset="UTF-8"><style>body{font-family:system-ui,sans-serif;text-align:center;padding:60px 20px;color:#525252}h1{color:#0a0a0a}a{color:#0066ff}</style></head><body><h1>Maquette introuvable</h1><p>Cette maquette n'existe pas ou a été retirée.</p><p><a href="https://klyora.fr">Retour à Klyora Sites</a></p></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // GÉNÉRATION À LA VOLÉE si mockup_html absent (prospects status=found,
  // purgés précédemment et jamais emailés). Permet à Rubens d'ouvrir la
  // maquette d'un cold-call prospect depuis l'admin sans devoir passer par
  // "Envoyer/Générer" au préalable. Les restaurants et les types food sont
  // exclus de la génération adaptive (ils ont leur propre template restaurant
  // — génération côté send/route uniquement). Pour eux, on affiche un message.
  if (!data.mockup_html) {
    const FOOD_METIERS = new Set(["restaurant", "boulangerie", "patisserie", "cafe", "glacier"]);
    const isRestoMetier = FOOD_METIERS.has(data.business_type || "");

    if (isRestoMetier) {
      // Message clair : maquette pas encore générée, cliquer Envoyer dans l'admin
      return new NextResponse(
        `<!DOCTYPE html><html><head><title>Maquette pas encore générée</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:system-ui,sans-serif;text-align:center;padding:60px 20px;color:#525252}h1{color:#0a0a0a;margin-bottom:8px}h2{color:#525252;font-size:16px;font-weight:500;margin-bottom:30px}p{max-width:540px;margin:0 auto 20px}a{color:#0066ff}.btn{display:inline-block;padding:12px 24px;background:#0a0a0a;color:#fff;border-radius:999px;text-decoration:none;font-weight:600;margin-top:12px}</style></head><body><h1>Maquette pas encore générée</h1><h2>${data.name}</h2><p>La maquette n'a pas encore été préparée pour ce prospect (type restaurant/boulangerie — nécessite génération complète avec Claude).</p><p>Dans ton admin, clique sur <strong>« Envoyer »</strong> (mode dry-run) ou <strong>« Générer »</strong> pour ce prospect. La maquette sera alors disponible sous ce lien.</p><a class="btn" href="https://klyora.fr/admin/prospects">Retour à l'admin</a></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Génération à la volée — dispatcher par métier.
    // Chaque template métier (~700 lignes) propose une identité visuelle
    // dédiée avec 3 variants palette (pour que 2 prospects du même métier
    // ne reçoivent jamais le même design). Fallback : universel.
    try {
      const baseInput = {
        id: data.id,
        slug,
        name: data.name,
        city: data.city, address: data.address, phone: data.phone,
        website: data.website, email: data.email,
        google_rating: data.google_rating, google_reviews_count: data.google_reviews_count,
        hours: data.hours, business_type: data.business_type,
        menu_items: data.menu_items, reviews: data.reviews,
        about_scraped: data.about_scraped,
        website_photos: data.website_photos,
        site_style_dna: data.site_style_dna,
      };
      const haystack = `${data.business_type || ""} ${data.name || ""} ${slug}`.toLowerCase();
      let generated: string;
      if (/\bfleurist/.test(haystack)) {
        generated = generateFleuristePremiumMockupHtml(baseInput);
      } else {
        generated = generatePremiumUniversalMockupHtml(baseInput);
      }
      await supabase.from("prospects").update({ mockup_html: generated }).eq("id", data.id);
      data.mockup_html = generated;
    } catch (err) {
      console.error("[prospects/slug] on-demand generation failed:", err);
      return new NextResponse(
        `<!DOCTYPE html><html><head><title>Maquette indisponible</title><meta charset="UTF-8"><style>body{font-family:system-ui,sans-serif;text-align:center;padding:60px 20px;color:#525252}h1{color:#0a0a0a}a{color:#0066ff}</style></head><body><h1>Génération de maquette impossible</h1><p>Une erreur est survenue. Essayez "Envoyer" dans l'admin pour forcer la génération.</p><p><a href="https://klyora.fr/admin/prospects">Retour à l'admin</a></p></body></html>`,
        { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }
  }

  // VIEW_COUNT désormais 100% côté client via /api/prospect/track-view
  // (JS beacon qui ne fire QU'APRÈS une vraie interaction humaine). Les
  // scanners email ne comptent plus de fausses views.
  //
  // Ici on garde juste :
  //   - isBot (UA check) pour ne pas notifier Telegram sur les previews
  //   - opened_at set sur la 1ère visite non-bot (pour le flag "mail ouvert"
  //     qui sert ailleurs : critères SMS hot lead, email-reminders, etc.)
  //   - Telegram HOT LEAD fire sur la 1ère visite non-bot UA (accepter un
  //     petit risque de faux positif pour les scanners qui spoofent un
  //     UA réaliste — la confirmation définitive vient du JS beacon)
  const userAgent = req.headers.get("user-agent") || "";
  const isBot = isBotUserAgent(userAgent);
  const isFirstOpen = !data.opened_at && !isBot;

  if (isFirstOpen) {
    // Set opened_at + status=opened sans toucher view_count (c'est track-view
    // qui gère le compteur maintenant)
    (async () => {
      try {
        await supabase
          .from("prospects")
          .update({ opened_at: new Date().toISOString(), status: "opened" })
          .eq("id", data.id);
      } catch { /* silent */ }
    })();
  }

  // Notify Telegram SEULEMENT à la 1ère ouverture PAR UN HUMAIN (hot lead) —
  // riche notif avec SCRIPT D'APPEL personnalisé généré par Claude Haiku.
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
          `<b>🎯 Objectif principal :</b> fixer un RDV TÉLÉPHONIQUE 15-20 min — sauf si le prospect veut acheter tout de suite (alors on envoie le lien Stripe).\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `<b>🎬 OUVERTURE (lis-la mot à mot)</b>\n` +
          `<i>« ${escapeTelegram(script.opening)} »</i>\n\n` +
          `<b>❓ QUESTIONS À POSER PENDANT L'APPEL</b>\n${questionsBlock}\n\n` +
          `<b>🎯 Accroches RDV si hésitation :</b>\n${hooksBlock}\n\n` +
          `<b>🛡 Objections :</b>\n${objectionsBlock}\n` +
          `━━━━━━━━━━━━━━━━━━━━\n\n` +
          `🎯 <a href="https://klyora.fr/prospects/${escapeTelegram(slug)}">Voir la maquette envoyée</a>` +
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

  // ═══════════════════════════════════════════════════════════════════
  // PATCH RUNTIME de l'offre Sérénité
  // Les maquettes déjà envoyées aux prospects contiennent 2 mentions fausses
  // qu'on corrige à la volée sans toucher la DB :
  //   - "Hébergement inclus à vie" → dépend du paiement du 50 €/mois
  //   - "Emails pros (contact@votresite.fr)" → on ne fournit pas ce service
  // Les nouvelles maquettes (depuis commit 93fc606) sont déjà correctes,
  // ces remplacements ne modifient rien en plus.
  // ═══════════════════════════════════════════════════════════════════
  const patchedHtml = data.mockup_html
    .replace(
      /<li>Hébergement inclus à vie<\/li>/g,
      "<li>Hébergement inclus (tant que l'abonnement est actif)</li>"
    )
    .replace(
      /<li>Emails pros \(contact@votresite\.fr\)<\/li>/g,
      "<li>Sauvegardes automatiques + monitoring</li>"
    )
    // ═══════════════════════════════════════════════════════════════════
    // PATCH PRIX 599€ → 320€ TTC
    // Les maquettes stockées en DB avant le changement de prix affichent
    // encore 599€. On remplace à la volée pour que les prospects voient
    // le nouveau prix quel que soit l'ancienneté de la maquette.
    // ═══════════════════════════════════════════════════════════════════
    .replace(/599\s*€\s*TTC/g, "320 € TTC")
    .replace(/599\s*€(?!\w)/g, "320 €")
    .replace(/599,00\s*€/g, "320,00 €")
    .replace(/599\s*€/g, "320 €")
    .replace(/3\s*×\s*199,67\s*€/g, "3 × 106,67 €")
    .replace(/199,67\s*€/g, "106,67 €")
    .replace(/Obtenez-le pour 599/g, "Obtenez-le pour 320")
    .replace(/prix\s*[:=]\s*599/gi, "prix: 320");

  // ═══════════════════════════════════════════════════════════════════
  // PATCH PROMO -20% : appliqué si ?promo=20 dans l'URL
  // Agent 5 envoie ce lien aux prospects hésitants (2+ vues sans achat).
  // 320€ → 256€  |  3×106,67€ → 3×85,33€
  // Un bandeau rouge compte à rebours 24h est injecté en haut de page.
  // ═══════════════════════════════════════════════════════════════════
  const promoPrice = promoDiscount > 0 ? Math.round(320 * (1 - promoDiscount / 100)) : 320;
  const promoHtml = promoDiscount > 0
    ? patchedHtml
        .replace(/320\s*€\s*TTC/g, `<span style="text-decoration:line-through;opacity:.5;font-size:.85em">320&nbsp;€</span> <strong style="color:#e53e3e">${promoPrice}&nbsp;€ TTC</strong>`)
        .replace(/320\s*€(?!\s*TTC)(?!\s*<)/g, `${promoPrice}&nbsp;€`)
        .replace(/3\s*×\s*106[,.]67\s*€/g, `3 × ${(promoPrice / 3).toFixed(2).replace(".", ",")} €`)
        .replace(/Obtenez-le pour 320/g, `Obtenez-le pour ${promoPrice}`)
        .replace(
          /(<body[^>]*>)/i,
          `$1<script>window.__WC_PROMO={percent:${promoDiscount},price:${promoPrice},code:"${promoCode}"}<\/script>
<div id="wc-promo-banner" style="background:#e53e3e;color:#fff;text-align:center;padding:12px 16px;font-family:sans-serif;font-size:14px;font-weight:600;position:sticky;top:0;z-index:9999">
  🎁 Offre exclusive -${promoDiscount}&nbsp;% · <strong>${promoPrice}&nbsp;€ au lieu de 320&nbsp;€</strong> · Expire dans <span id="wc-promo-timer">48:00:00</span>
  <script>(function(){var e=document.getElementById('wc-promo-timer');if(!e)return;
  var k='wc_promo_exp_${slug}';var exp=parseInt(localStorage.getItem(k)||'0');
  if(!exp){exp=Date.now()+172800000;localStorage.setItem(k,exp);}
  function upd(){var s=Math.max(0,Math.floor((exp-Date.now())/1000));
  if(s===0){e.textContent='Expirée';return;}
  e.textContent=[Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(function(n){return n<10?'0'+n:n;}).join(':');
  setTimeout(upd,1000);}upd();})();<\/script>
</div>`
        )
    : patchedHtml;

  // ═══════════════════════════════════════════════════════════════════
  // PATCH RUNTIME : retirer le bouton "Réserver une table" pour les métiers
  // qui ne font pas de réservation (glaciers, boulangeries, etc.)
  // Le template génère systématiquement un bouton bkOpen() — on le remplace
  // ici à la volée pour éviter de régénérer toutes les maquettes.
  // ═══════════════════════════════════════════════════════════════════
  const NO_BOOKING_TYPES = new Set(["glacier", "boulangerie", "patisserie", "cafe", "epicerie", "fleuriste"]);
  const phoneLink = data.phone ? `tel:+33${data.phone.replace(/^0/, "").replace(/[^0-9]/g, "")}` : "#contact";
  const phoneLabel = data.phone || "Nous appeler";
  const noBookingHtml = NO_BOOKING_TYPES.has(data.business_type || "")
    ? promoHtml
        // Bouton nav (petit)
        .replace(
          /<button class="nav-cta"[^>]*onclick="bkOpen\(\)"[^>]*>[^<]*<\/button>/g,
          `<a href="${phoneLink}" class="nav-cta">${phoneLabel}</a>`
        )
        // Boutons hero / CTA (grands)
        .replace(
          /<button class="btn-primary"[^>]*onclick="bkOpen\(\)"[^>]*>[^<]*<\/button>/g,
          `<a href="${phoneLink}" class="btn-primary">Nous appeler →</a>`
        )
        // Section "Coupes spéciales"
        .replace(
          /<div class="menu-section-title">Coupes spéciales<\/div>/g,
          `<div class="menu-section-title">Nos spécialités</div>`
        )
        // Masquer le widget de réservation (calendrier)
        .replace(
          /<div[^>]*id="wc-booking-modal"[^>]*>[\s\S]*?<\/div>\s*<!-- \/booking/,
          "<!-- booking-modal masqué pour ce type de commerce -->"
        )
    : promoHtml;

  // ═══════════════════════════════════════════════════════════════════
  // INJECTION LEVIERS DE CONVERSION (pour les anciennes maquettes)
  // Les maquettes générées AVANT le commit 3eb4e0c n'ont pas :
  //   - compteur 48h dans la CTA bar
  //   - chat IA proactif après 30s
  //   - cart abandon tracking quand modal d'achat ouvert
  //   - badge -47% prix barré
  // On injecte un <script> qui ajoute ces features à la volée si absents.
  // Les nouvelles maquettes les ont déjà → le script détecte et skip.
  // ═══════════════════════════════════════════════════════════════════
  const mockupSlug = slug.replace(/[^a-z0-9_-]/gi, "").slice(0, 100);
  const injectedHtml = noBookingHtml.includes("wc-countdown")
    ? noBookingHtml // déjà les nouveaux features
    : noBookingHtml.replace(
        /<\/body>/i,
        `<script>
(function wcInjectLevers() {
  var SLUG = ${JSON.stringify(mockupSlug)};

  // LEVIER 2 : cart abandon tracking sur le bouton "J'achète"
  var ctaBtn = document.querySelector('.wc-cta-bar-btn');
  if (ctaBtn && !ctaBtn.hasAttribute('data-wc-tracked')) {
    ctaBtn.setAttribute('data-wc-tracked', '1');
    ctaBtn.addEventListener('click', function() {
      try {
        fetch('/api/prospect/modal-opened', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prospect_slug: SLUG }),
        }).catch(function() {});
      } catch (e) {}
    });
  }

  // LEVIER 3 : chat IA proactif après 30s (badge rouge + message d'accueil)
  try {
    var PKEY = 'wc_chat_pinged_' + SLUG;
    if (!sessionStorage.getItem(PKEY)) {
      setTimeout(function() {
        var panel = document.getElementById('wc-chat-panel');
        var btn = document.getElementById('wc-chat-btn');
        if (!panel || !btn || panel.classList.contains('open')) return;
        var badge = document.createElement('span');
        badge.style.cssText = 'position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-size:11px;font-weight:800;width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;border:2px solid #fff';
        badge.textContent = '1';
        btn.style.position = 'relative';
        btn.appendChild(badge);
        var msgs = document.getElementById('wc-chat-messages');
        if (msgs) {
          var m = document.createElement('div');
          m.className = 'wc-chat-msg bot';
          m.innerHTML = "Bonjour 👋 Je vois que vous consultez votre maquette. Avez-vous des questions sur le prix, la livraison ou la personnalisation ? Je réponds instantanément.";
          msgs.appendChild(m);
        }
        try { sessionStorage.setItem(PKEY, '1'); } catch (e) {}
      }, 30000);
    }
  } catch (e) {}
})();
</script>
</body>`
      );

  // ═══════════════════════════════════════════════════════════════════
  // INJECTION SALES UI UNIVERSELLE
  // On retire toute ancienne version du snippet déjà embarquée dans le
  // mockup_html stocké en DB, puis on injecte TOUJOURS la version fraîche.
  // Cela garantit que les corrections du snippet (IIFE, prix, domaine…)
  // sont effectives immédiatement sans avoir à regénérer les maquettes.
  //
  // Le snippet lui-même gère les templates avec `.wc-cta-bar` native
  // (restaurant) : il cache cette barre et redirige pmOpen → wcSxOpen.
  // ═══════════════════════════════════════════════════════════════════
  const cleanedHtml = stripOldSnippet(injectedHtml);
  const withSalesUi = cleanedHtml.replace(/<\/body>/i, buildSalesUiSnippet(mockupSlug, data.name || "votre site", Boolean(data.is_luxury)) + "</body>");

  // ═══════════════════════════════════════════════════════════════════
  // BEACON VIEW TRACKING — fire uniquement sur interaction humaine réelle
  // ═══════════════════════════════════════════════════════════════════
  // Les scanners email (Mimecast, Proofpoint, Microsoft Defender) exécutent
  // rarement le JS et ne simulent jamais de scroll/mouse/touch. Ce beacon :
  //   1. Attend 3 s après load (filtre les bots headless ultra-rapides)
  //   2. Écoute mousemove / scroll / click / touchstart / keydown
  //   3. Au 1er événement, POST /api/prospect/track-view → incrémente view_count
  //   4. Auto-disarm après le premier fire (une interaction = une vue)
  //
  // Résultat : view_count reflète enfin le nombre de VRAIS humains qui ont
  // interagi avec la maquette. Les 7× "ouvertures" de scanner ne comptent plus.
  const beaconScript = `<script>
(function wcBeacon() {
  try {
    var SLUG = ${JSON.stringify(mockupSlug)};
    var fired = false;
    var armed = false;
    function fire() {
      if (fired) return;
      fired = true;
      try {
        fetch('/api/prospect/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: SLUG }),
          keepalive: true,
        }).catch(function(){});
      } catch (e) {}
    }
    function arm() {
      if (armed) return;
      armed = true;
      var opts = { passive: true, once: true };
      window.addEventListener('scroll', fire, opts);
      window.addEventListener('mousemove', fire, opts);
      window.addEventListener('click', fire, opts);
      window.addEventListener('touchstart', fire, opts);
      window.addEventListener('keydown', fire, opts);
      // Filet de sécurité : si 25 s sur la page sans interaction (rare mais
      // arrive quand l'utilisateur lit sans bouger), on fire quand même —
      // 25 s dépasse le timeout typique d'un scanner JS-capable (1-5 s).
      setTimeout(fire, 25000);
    }
    // Attente 3 s avant d'armer les listeners → filtre les scanners headless
    // qui déclenchent mousemove/scroll au chargement
    setTimeout(arm, 3000);
  } catch (e) {}
})();
</script>`;

  // ═══════════════════════════════════════════════════════════════════
  // LIVE EDIT — intercept chat API responses pour modifier la maquette
  // en direct quand le prospect demande un changement de texte simple.
  // Works sur TOUS les mockups (anciens et nouveaux) via fetch monkey-patch.
  // Le script ne fait rien si la réponse ne contient pas de champ "edit".
  // ═══════════════════════════════════════════════════════════════════
  const liveEditScript = `<script>
(function wcLiveEditInit() {
  try {
    var SLUG = ${JSON.stringify(mockupSlug)};
    var SELECTOR_MAP = {
      'hero-h1':    '.hero-inner h1, section.hero h1, .hero h1, h1.hero-title',
      'hero-sub':   '.hero-desc, .hero-subtitle, section.hero p.lead, .hero-inner p',
      'about-p':    '.about-text p, .about p, section.about p, .about-body p',
      'phone':      'a[href^="tel:"]',
      'strip-text': '.top-strip, .wc-strip, .strip-bar',
      'cta-verb':   '.btn-primary, a.btn-primary, button.btn-primary',
    };

    // Monkey-patch window.fetch pour intercepter les réponses du chat
    var _origFetch = window.fetch;
    window.fetch = function(resource, init) {
      var url = typeof resource === 'string' ? resource :
                (resource && typeof resource.url === 'string' ? resource.url : '');
      if (url.indexOf('/api/prospect/chat') !== -1) {
        return _origFetch.apply(this, arguments).then(function(res) {
          var clone = res.clone();
          clone.json().then(function(data) {
            if (data && data.edit && data.edit.selector && data.edit.newText) {
              wcApplyEdit(data.edit.selector, data.edit.newText);
            }
            if (data && data.shouldEscalate && data.complexRequest) {
              wcSendComplexRequest(data.complexRequest);
            }
          }).catch(function() {});
          return res; // le caller consomme l'original
        });
      }
      return _origFetch.apply(this, arguments);
    };

    function wcApplyEdit(selector, newText) {
      var css = SELECTOR_MAP[selector];
      if (!css) return;
      var el = document.querySelector(css);
      if (!el) return;

      // Animation : flash doré → update texte → flash vert → retour normal
      var prevTransition = el.style.transition;
      el.style.transition = 'background-color 0.35s ease, box-shadow 0.35s ease';
      el.style.backgroundColor = 'rgba(193,154,86,0.28)';
      el.style.boxShadow = '0 0 0 3px rgba(193,154,86,0.55)';
      el.style.borderRadius = '6px';

      setTimeout(function() {
        // Appliquer le nouveau texte
        el.textContent = newText;

        // Confirmation verte
        el.style.backgroundColor = 'rgba(16,185,129,0.22)';
        el.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.45)';

        // Badge "✓ Modifié"
        var badge = document.createElement('span');
        badge.textContent = ' ✓';
        badge.style.cssText = 'color:#10b981;font-weight:800;font-size:0.78em;vertical-align:middle;margin-left:4px';
        el.appendChild(badge);

        setTimeout(function() {
          el.style.backgroundColor = '';
          el.style.boxShadow = '';
          el.style.borderRadius = '';
          el.style.transition = prevTransition || '';
          if (badge.parentNode === el) el.removeChild(badge);
        }, 1800);
      }, 380);

      // Persister en base
      try {
        fetch('/api/prospect/save-edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: SLUG, selector: selector, newText: newText }),
          keepalive: true,
        }).catch(function() {});
      } catch(e) {}
    }

    function wcSendComplexRequest(request) {
      try {
        fetch('/api/prospect/request-edit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slug: SLUG, request: request }),
          keepalive: true,
        }).catch(function() {});
      } catch(e) {}
    }
  } catch(e) {}
})();
</script>`;

  // Watermark "Maquette de démonstration" + lien suppression auto-service
  // Strip d'abord toute version stale, puis injection fraîche
  const demoWatermark = buildDemoWatermarkSnippet(slug);
  const withWatermark = stripOldDemoWatermark(withSalesUi)
    .replace(/<\/body>/i, demoWatermark + "</body>");

  const finalHtml = withWatermark.replace(/<\/body>/i, liveEditScript + beaconScript + "</body>");

  return new NextResponse(finalHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store",
    },
  });
}
