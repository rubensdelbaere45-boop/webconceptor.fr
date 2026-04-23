import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { escapeTelegram } from "@/lib/security";
import { generateCallScript } from "@/lib/call-script";
import { buildSalesUiSnippet } from "@/lib/sales-ui-snippet";
import { generateAdaptiveMockupHtml, type AdaptiveProspect } from "@/lib/mockup-adaptive";

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

  if (!slug || slug.length > 100) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, name, mockup_html, opened_at, phone, email, address, city, google_rating, google_reviews_count, business_type, website, site_quality, menu_items, reviews, about_scraped, website_photos, site_style_dna, hours")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Maquette introuvable</title><meta charset="UTF-8"><style>body{font-family:system-ui,sans-serif;text-align:center;padding:60px 20px;color:#525252}h1{color:#0a0a0a}a{color:#0066ff}</style></head><body><h1>Maquette introuvable</h1><p>Cette maquette n'existe pas ou a été retirée.</p><p><a href="https://webconceptor.fr">Retour à WebConceptor</a></p></body></html>`,
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
        `<!DOCTYPE html><html><head><title>Maquette pas encore générée</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{font-family:system-ui,sans-serif;text-align:center;padding:60px 20px;color:#525252}h1{color:#0a0a0a;margin-bottom:8px}h2{color:#525252;font-size:16px;font-weight:500;margin-bottom:30px}p{max-width:540px;margin:0 auto 20px}a{color:#0066ff}.btn{display:inline-block;padding:12px 24px;background:#0a0a0a;color:#fff;border-radius:999px;text-decoration:none;font-weight:600;margin-top:12px}</style></head><body><h1>Maquette pas encore générée</h1><h2>${data.name}</h2><p>La maquette n'a pas encore été préparée pour ce prospect (type restaurant/boulangerie — nécessite génération complète avec Claude).</p><p>Dans ton admin, clique sur <strong>« Envoyer »</strong> (mode dry-run) ou <strong>« Générer »</strong> pour ce prospect. La maquette sera alors disponible sous ce lien.</p><a class="btn" href="https://webconceptor.fr/admin/prospects">Retour à l'admin</a></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    // Non-restaurant : on génère avec le fallback content (sans Claude, rapide)
    try {
      const label = ((bt: string) => {
        const m: Record<string, string> = {
          coiffeur: "un salon de coiffure", institut: "un institut de beauté",
          fleuriste: "une boutique de fleurs", plombier: "un artisan plombier",
          electricien: "un artisan électricien", dentiste: "un cabinet dentaire",
          osteo: "un cabinet d'ostéopathie", salle_sport: "une salle de sport",
          auto_ecole: "une auto-école locale", garage: "un garage indépendant",
          epicerie: "une épicerie de proximité",
        };
        return m[bt] || "un commerce local";
      })(data.business_type || "");

      const adaptive: AdaptiveProspect = {
        id: data.id,
        slug,
        name: data.name,
        city: data.city, address: data.address, phone: data.phone,
        website: data.website, email: data.email,
        google_rating: data.google_rating, google_reviews_count: data.google_reviews_count,
        photos: undefined, hours: data.hours, business_type: data.business_type,
        menu_items: data.menu_items, reviews: data.reviews,
        about_scraped: data.about_scraped,
        website_photos: data.website_photos,
        site_style_dna: data.site_style_dna,
      };
      const fallbackContent = {
        heroTitle: data.name,
        heroSubtitle: `${label.charAt(0).toUpperCase() + label.slice(1)}${data.city ? ` à ${data.city}` : ""}`,
        aboutText: `Notre équipe vous accueille${data.city ? ` à ${data.city}` : ""} avec un service attentionné et un savoir-faire reconnu.`,
      };
      const origin = new URL(req.url).origin;
      const generated = generateAdaptiveMockupHtml(adaptive, fallbackContent, origin);

      // Sauvegarde pour les prochaines visites (évite de re-générer à chaque fois)
      await supabase.from("prospects").update({ mockup_html: generated }).eq("id", data.id);
      data.mockup_html = generated;
    } catch (err) {
      console.error("[prospects/slug] on-demand generation failed:", err);
      return new NextResponse(
        `<!DOCTYPE html><html><head><title>Maquette indisponible</title><meta charset="UTF-8"><style>body{font-family:system-ui,sans-serif;text-align:center;padding:60px 20px;color:#525252}h1{color:#0a0a0a}a{color:#0066ff}</style></head><body><h1>Génération de maquette impossible</h1><p>Une erreur est survenue. Essayez "Envoyer" dans l'admin pour forcer la génération.</p><p><a href="https://webconceptor.fr/admin/prospects">Retour à l'admin</a></p></body></html>`,
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
    // PATCH PRIX 599€ → 199€ TTC
    // Les maquettes stockées en DB avant le changement de prix affichent
    // encore 599€. On remplace à la volée pour que les prospects voient
    // le nouveau prix quel que soit l'ancienneté de la maquette.
    // ═══════════════════════════════════════════════════════════════════
    .replace(/599\s*€\s*TTC/g, "199 € TTC")
    .replace(/599\s*€(?!\w)/g, "199 €")
    .replace(/599,00\s*€/g, "199,00 €")
    .replace(/599\s*€/g, "199 €")
    .replace(/3\s*×\s*199,67\s*€/g, "3 × 66,33 €")
    .replace(/199,67\s*€/g, "66,33 €")
    .replace(/Obtenez-le pour 599/g, "Obtenez-le pour 199")
    .replace(/prix\s*[:=]\s*599/gi, "prix: 199");

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
  const injectedHtml = patchedHtml.includes("wc-countdown")
    ? patchedHtml // déjà les nouveaux features
    : patchedHtml.replace(
        /<\/body>/i,
        `<script>
(function wcInjectLevers() {
  var SLUG = ${JSON.stringify(mockupSlug)};

  // LEVIER 1a : compteur 48h dans la CTA bar
  var ctaText = document.querySelector('.wc-cta-bar-text');
  if (ctaText && ctaText.innerHTML.indexOf('320') !== -1 && ctaText.innerHTML.indexOf('Offre expire') === -1) {
    try {
      var SKEY = 'wc_mockup_deadline_' + SLUG;
      var deadline = Number(localStorage.getItem(SKEY));
      if (!deadline || isNaN(deadline) || deadline < Date.now()) {
        deadline = Date.now() + 48 * 60 * 60 * 1000;
        localStorage.setItem(SKEY, String(deadline));
      }
      ctaText.innerHTML = '🔥 <strong style="text-decoration:line-through;opacity:0.5">599€</strong> <strong style="color:#c19a56">199 € TTC</strong> — <span id="wc-cd-inj">Offre expire dans <strong>--:--:--</strong></span>';
      var update = function() {
        var el = document.getElementById('wc-cd-inj');
        if (!el) return;
        var diff = deadline - Date.now();
        if (diff <= 0) { el.innerHTML = '<strong style="color:#ef4444">Offre expirée — contactez-nous</strong>'; return; }
        var h = Math.floor(diff / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        var s = Math.floor((diff % 60000) / 1000);
        var pad = function(n) { return String(n).padStart(2, '0'); };
        el.innerHTML = 'Offre expire dans <strong>' + pad(h) + ':' + pad(m) + ':' + pad(s) + '</strong>';
      };
      update();
      setInterval(update, 1000);
    } catch (e) {}
  }

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
  // Les maquettes non-restaurant (adaptive) et l'ancien template épicerie
  // n'ont AUCUN CTA d'achat. Sans ça, le prospect voit une belle maquette
  // mais n'a aucun moyen de commander. On injecte un CTA bar fixe + modal
  // d'achat si la maquette n'a pas de `.wc-cta-bar` natif (restaurant) ni
  // déjà été injectée (`.wc-sx-cta`).
  //
  // Le restaurant a son propre CTA riche (réservation, domaine, chat IA)
  // dans mockup-restaurant.ts → on ne re-injecte pas chez lui.
  // ═══════════════════════════════════════════════════════════════════
  const hasNativeSalesUi = injectedHtml.includes('class="wc-cta-bar"') || injectedHtml.includes('class="wc-sx-cta"');
  const withSalesUi = hasNativeSalesUi
    ? injectedHtml
    : injectedHtml.replace(/<\/body>/i, buildSalesUiSnippet(mockupSlug, data.name || "votre site") + "</body>");

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

  const finalHtml = withSalesUi.replace(/<\/body>/i, beaconScript + "</body>");

  return new NextResponse(finalHtml, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=300",
    },
  });
}
