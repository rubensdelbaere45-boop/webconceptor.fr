import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isPrivateOrUnsafeUrl, safeCompare, safeFetch } from "@/lib/security";

/* ══════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════ */

// Aubenton coordinates (02500)
const AUBENTON_LAT = 49.836;
const AUBENTON_LNG = 4.205;
const EXCLUSION_RADIUS_KM = 350; // 4h drive

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

/* ══════════════════════════════════════════
   UTILS
   ══════════════════════════════════════════ */

// Haversine distance in km
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/* ══════════════════════════════════════════
   GOOGLE PLACES — search + details
   ══════════════════════════════════════════ */

interface GooglePlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  shortFormattedAddress?: string;
  location?: { latitude: number; longitude: number };
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  rating?: number;
  userRatingCount?: number;
  regularOpeningHours?: { weekdayDescriptions?: string[] };
  photos?: Array<{ name: string }>;
  addressComponents?: Array<{ longText?: string; types?: string[] }>;
  reviews?: Array<{
    name?: string;
    rating?: number;
    text?: { text?: string; languageCode?: string };
    originalText?: { text?: string; languageCode?: string };
    authorAttribution?: { displayName?: string; uri?: string; photoUri?: string };
    relativePublishTimeDescription?: string;
    publishTime?: string;
  }>;
}

export interface StoredReview {
  author: string;
  rating: number;
  text: string;
  timeAgo: string;
}

async function searchProxiStores(query: string, apiKey: string): Promise<GooglePlace[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.shortFormattedAddress",
        "places.location",
        "places.nationalPhoneNumber",
        "places.websiteUri",
        "places.rating",
        "places.userRatingCount",
        "places.regularOpeningHours",
        "places.photos",
        "places.addressComponents",
        "places.reviews",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "fr",
      regionCode: "fr",
      pageSize: 20,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Google Places error ${res.status}: ${errText.slice(0, 200)}`);
  }
  const data = await res.json();
  return data.places || [];
}

function extractCityFromComponents(components?: Array<{ longText?: string; types?: string[] }>): { city: string; postalCode: string } {
  let city = "";
  let postalCode = "";
  for (const c of components || []) {
    if (c.types?.includes("locality")) city = c.longText || "";
    else if (c.types?.includes("postal_code")) postalCode = c.longText || "";
  }
  return { city, postalCode };
}

/* ══════════════════════════════════════════
   EMAIL SCRAPING — find contact emails on a website
   ══════════════════════════════════════════ */

const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const BAD_DOMAINS = /(wix|wixstatic|sentry|example|test|placeholder|noreply|no-reply|unsubscribe|spam)/i;

async function fetchUrl(url: string, timeout = 8000): Promise<string | null> {
  try {
    // safeFetch rejects redirects that point at internal/private addresses.
    const res = await safeFetch(url, {
      timeoutMs: timeout,
      maxRedirects: 5,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; WebConceptorBot/1.0)" },
    });
    if (!res.ok) return null;
    // Cap response size to avoid a malicious site OOMing the server (10 MB max)
    const text = await res.text();
    return text.slice(0, 10 * 1024 * 1024);
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════
   MENU SCRAPING — extract real dishes from restaurant website
   ══════════════════════════════════════════ */

interface ScrapedMenuItem {
  category: "entrée" | "plat" | "dessert";
  name: string;
  description: string;
  price: string;
}

// Rough heuristic to strip HTML to readable text (we only need keywords for Claude)
function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

async function scrapeRestaurantMenu(website: string): Promise<ScrapedMenuItem[] | null> {
  const claudeKey = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  if (!claudeKey) return null;

  try {
    if (isPrivateOrUnsafeUrl(website)) return null;
    const base = new URL(website);

    // Menu-related paths to try, in priority order
    const paths = [
      "/menu", "/carte", "/la-carte", "/notre-carte", "/nos-menus", "/menus",
      "/menu.html", "/carte.html", "/our-menu", "/our-menus", "/",
    ];

    let bestMenuText: string | null = null;
    for (const path of paths) {
      const url = base.origin + path;
      if (isPrivateOrUnsafeUrl(url)) continue;
      const html = await fetchUrl(url, 8000);
      if (!html) continue;

      const text = stripHtml(html);
      // Heuristic: a menu page usually contains € prices frequently
      const euroMatches = text.match(/[0-9]{1,3}[.,][0-9]{2}\s*€|€\s*[0-9]{1,3}/g) || [];
      if (euroMatches.length >= 3) {
        bestMenuText = text.slice(0, 12000); // cap for Claude
        break;
      }
    }

    if (!bestMenuText) return null;

    // Ask Claude to extract structured items
    const isOpenRouter = claudeKey.startsWith("sk-or-");
    const endpoint = isOpenRouter
      ? "https://openrouter.ai/api/v1/chat/completions"
      : "https://api.anthropic.com/v1/messages";

    const prompt = `Voici le texte brut extrait d'une page de menu de restaurant français. Extrait les plats dans un format JSON structuré.

Texte du menu (peut contenir du bruit) :
"""
${bestMenuText}
"""

Retourne un JSON tableau de 8 à 12 plats RÉELS trouvés dans ce texte. Format :
[
  { "category": "entrée" | "plat" | "dessert", "name": "nom du plat", "description": "courte description 5-12 mots", "price": "XX€" }
]

Règles STRICTES :
- N'invente AUCUN plat : si tu n'es pas sûr, ignore.
- Prix : extrait le prix exact du texte, format "24€" ou "24,50€".
- Catégorise correctement (entrée / plat / dessert).
- Description : prends celle du site si présente, sinon résume en 5-10 mots.
- Si moins de 4 plats identifiables → retourne un tableau vide [].
- Réponds UNIQUEMENT avec le JSON, rien d'autre.`;

    const body = isOpenRouter
      ? {
          model: "anthropic/claude-haiku-4.5",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1200,
        }
      : {
          model: "claude-haiku-4-5",
          max_tokens: 1200,
          messages: [{ role: "user", content: prompt }],
        };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: isOpenRouter
        ? { "Content-Type": "application/json", "Authorization": `Bearer ${claudeKey}` }
        : { "Content-Type": "application/json", "x-api-key": claudeKey, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(25000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const raw = isOpenRouter
      ? data.choices?.[0]?.message?.content
      : data.content?.[0]?.text;
    if (!raw) return null;

    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (!Array.isArray(parsed) || parsed.length < 4) return null;

    return parsed
      .filter((m: unknown) =>
        typeof m === "object" && m !== null &&
        ["entrée", "plat", "dessert"].includes((m as { category?: string }).category || "") &&
        typeof (m as { name?: string }).name === "string" &&
        typeof (m as { price?: string }).price === "string"
      )
      .slice(0, 12)
      .map((m: unknown) => {
        const x = m as { category: string; name: string; description?: string; price: string };
        return {
          category: x.category as "entrée" | "plat" | "dessert",
          name: String(x.name).slice(0, 60),
          description: String(x.description || "").slice(0, 120),
          price: String(x.price).slice(0, 10),
        };
      });
  } catch {
    return null;
  }
}

// Extrait les reviews Google Places au format propre (3 meilleures avec note ≥ 4)
function extractTopReviews(place: GooglePlace): StoredReview[] {
  if (!place.reviews || place.reviews.length === 0) return [];
  return place.reviews
    .filter((r) => typeof r.rating === "number" && r.rating >= 4 && r.text?.text)
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 3)
    .map((r) => ({
      author: (r.authorAttribution?.displayName || "Client").split(" ")[0].slice(0, 40), // prénom uniquement
      rating: Math.round(r.rating || 5),
      text: (r.text?.text || "").slice(0, 240), // ~240 chars = 3-4 lignes
      timeAgo: (r.relativePublishTimeDescription || "").slice(0, 30),
    }));
}

/* ══════════════════════════════════════════
   AUDIT DU SITE WEB — détecte les sites vieillis
   ══════════════════════════════════════════ */

export type SiteQuality = "none" | "poor" | "average" | "good";

export interface SiteAudit {
  score: number; // 0-100
  quality: SiteQuality;
  issues: string[]; // keys seulement, résolues en phrases par Claude
}

async function auditWebsite(website: string): Promise<SiteAudit | null> {
  try {
    if (isPrivateOrUnsafeUrl(website)) return null;
    const base = new URL(website);
    const html = await fetchUrl(base.origin, 8000);
    if (!html) return { score: 20, quality: "poor", issues: ["unreachable"] };

    let score = 50; // baseline
    const issues: string[] = [];

    // HTTPS (technique)
    if (base.protocol !== "https:") { score -= 15; issues.push("no_https"); }

    // Viewport mobile (critique !)
    if (/<meta[^>]+name=["']viewport["']/i.test(html)) score += 15;
    else { score -= 25; issues.push("no_viewport_mobile"); }

    // Meta description (SEO)
    if (/<meta[^>]+name=["']description["']/i.test(html)) score += 10;
    else issues.push("no_meta_description");

    // Open Graph (partage réseaux sociaux)
    if (/<meta[^>]+property=["']og:image["']/i.test(html)) score += 8;
    else issues.push("no_og_image");

    if (/<meta[^>]+property=["']og:title["']/i.test(html)) score += 4;

    // Structured data Schema.org (SEO avancé)
    if (/<script[^>]+type=["']application\/ld\+json["']/i.test(html)) score += 10;
    else issues.push("no_structured_data");

    // Semantic HTML (moderne)
    if (/<(header|main|footer|article|section|nav)[\s>]/i.test(html)) score += 5;
    else issues.push("no_semantic_html");

    // Modern CSS (grid/flex)
    if (/display\s*:\s*(grid|flex)/i.test(html) || /grid-template|flex-direction/i.test(html)) score += 5;
    else issues.push("legacy_css");

    // Favicon (détail pro)
    if (/<link[^>]+rel=["'](?:shortcut )?icon["']/i.test(html)) score += 3;
    else issues.push("no_favicon");

    // ANTI-SIGNAUX (vieux site)
    if (/<\b(font|marquee|center|blink|basefont)\b/i.test(html)) {
      score -= 25;
      issues.push("deprecated_tags");
    }

    // Tables pour layout (très vieux)
    const tablesCount = (html.match(/<table/gi) || []).length;
    if (tablesCount > 5) { score -= 15; issues.push("table_layout"); }

    // Inline styles massifs (généré par éditeur vieux)
    const inlineStyleCount = (html.match(/style=/gi) || []).length;
    if (inlineStyleCount > 80) { score -= 10; issues.push("too_many_inline_styles"); }

    // Flash / Java / ActiveX
    if (/<\b(object|embed|applet)[^>]+(flash|shockwave|activex)/i.test(html)) {
      score -= 30;
      issues.push("deprecated_plugins");
    }

    // Google Fonts / fonts modernes (signe moderne)
    if (/fonts\.googleapis\.com|fonts\.bunny\.net/i.test(html)) score += 5;

    // jQuery seul (signe pas moderne, ok pour petit +/-) — ignorable

    // Framework moderne ?
    if (/__next|nextjs|__nuxt|gatsby|astro|sveltekit|webflow/i.test(html)) score += 10;

    // Responsive images (picture, srcset)
    if (/<picture|srcset=/i.test(html)) score += 5;

    // Clamp
    score = Math.max(0, Math.min(100, score));

    let quality: SiteQuality;
    if (score < 40) quality = "poor";
    else if (score < 70) quality = "average";
    else quality = "good";

    return { score, quality, issues };
  } catch {
    return null;
  }
}

// Scrape les photos du site : og:image + premières images grandes trouvées
async function scrapeWebsitePhotos(website: string): Promise<string[]> {
  try {
    if (isPrivateOrUnsafeUrl(website)) return [];
    const base = new URL(website);
    const html = await fetchUrl(base.origin, 8000);
    if (!html) return [];

    const urls: string[] = [];
    const seen = new Set<string>();

    const addUrl = (raw: string) => {
      if (!raw || raw.length > 500) return;
      let url: URL;
      try {
        url = new URL(raw, base.origin);
      } catch { return; }
      if (url.protocol !== "http:" && url.protocol !== "https:") return;
      // Filtrer icônes / logos / svg / thumbnails
      const path = url.pathname.toLowerCase();
      if (/\.(svg|ico|gif)$/.test(path)) return;
      if (/(logo|icon|favicon|sprite|avatar|loader|spinner)/.test(path)) return;
      if (/\d{1,3}x\d{1,3}/.test(path)) return; // "150x150.jpg" thumbnails
      const full = url.toString();
      if (seen.has(full)) return;
      seen.add(full);
      urls.push(full);
    };

    // og:image / twitter:image (LA photo principale du site)
    const ogMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*property=["']og:image["']/i);
    if (ogMatch) addUrl(ogMatch[1]);

    const twMatch = html.match(/<meta[^>]*name=["']twitter:image["'][^>]*content=["']([^"']+)["']/i);
    if (twMatch) addUrl(twMatch[1]);

    // Balises <img> avec src réels (pas dans des attributs data-src lazy)
    const imgRegex = /<img[^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp))["']/gi;
    let m: RegExpExecArray | null;
    while ((m = imgRegex.exec(html)) !== null && urls.length < 6) {
      addUrl(m[1]);
    }

    return urls.slice(0, 5);
  } catch {
    return [];
  }
}

// Scrape l'"à propos" / "notre histoire" — utile pour détecter si c'est une vieille maison
async function scrapeAboutText(website: string): Promise<string | null> {
  try {
    if (isPrivateOrUnsafeUrl(website)) return null;
    const base = new URL(website);
    const paths = ["/a-propos", "/apropos", "/about", "/about-us", "/notre-histoire", "/histoire", "/notre-equipe", "/qui-sommes-nous"];
    for (const path of paths) {
      const url = base.origin + path;
      if (isPrivateOrUnsafeUrl(url)) continue;
      const html = await fetchUrl(url, 6000);
      if (!html) continue;
      const text = html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/\s+/g, " ")
        .trim();
      if (text.length >= 200) return text.slice(0, 4000);
    }
    return null;
  } catch {
    return null;
  }
}

async function findEmailOnWebsite(website: string): Promise<string | null> {
  try {
    // SSRF : even though URLs come from Google Places, a compromised/malicious
    // place could point websiteUri to an internal metadata endpoint.
    if (isPrivateOrUnsafeUrl(website)) return null;

    const base = new URL(website);
    const paths = ["", "/contact", "/contact-us", "/contactez-nous", "/nous-contacter", "/mentions-legales", "/legal"];

    for (const path of paths) {
      const url = base.origin + path;
      // Re-check each URL (origin could have changed) — belt and suspenders.
      if (isPrivateOrUnsafeUrl(url)) continue;
      const html = await fetchUrl(url);
      if (!html) continue;

      // Check mailto first (most reliable)
      const mailtoMatch = html.match(/mailto:([^"'\s?]+)/i);
      if (mailtoMatch && !BAD_DOMAINS.test(mailtoMatch[1])) {
        return mailtoMatch[1].toLowerCase().trim();
      }

      // Then regex for plain text
      const emails = html.match(EMAIL_REGEX) || [];
      for (const email of emails) {
        const e = email.toLowerCase();
        if (BAD_DOMAINS.test(e)) continue;
        // Prefer emails matching the domain
        if (e.endsWith("@" + base.hostname.replace(/^www\./, ""))) return e;
      }
      // Fallback: first non-bad email
      for (const email of emails) {
        const e = email.toLowerCase();
        if (!BAD_DOMAINS.test(e)) return e;
      }
    }
    return null;
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════
   POST — find + enrich + save
   ══════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const googleKey = process.env.GOOGLE_MAPS_API_KEY || "";
  if (!googleKey) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY manquante" }, { status: 500 });
  }

  const rawBody = await req.json().catch(() => ({}));
  const query = typeof rawBody.query === "string" && rawBody.query.trim()
    ? rawBody.query.trim().slice(0, 200)
    : "Proxi épicerie France";

  // business_type : whitelist de types métier pour filtres admin + templates adaptés
  const ALLOWED_TYPES = [
    "epicerie",      // Proxi (seul avec filtre 350km Aubenton)
    "restaurant",    // resto/brasserie/bistrot/pizzeria/crêperie
    "boulangerie",   // boulangeries + viennoiseries
    "patisserie",    // pâtissiers + chocolatiers
    "cafe",          // cafés + salons de thé
    "glacier",       // glaciers + bars d'été
    "coiffeur",      // salons de coiffure H/F
    "institut",      // instituts de beauté + spas
    "plombier",      // plombiers / chauffagistes
    "electricien",   // électriciens
    "garage",        // garages auto / mécaniciens
    "dentiste",      // dentistes / ortho
    "osteo",         // ostéopathes / kinés
    "salle_sport",   // salles de sport / coachs
    "fleuriste",     // fleuristes
    "auto_ecole",    // auto-écoles
  ];
  const businessType: string = typeof rawBody.business_type === "string"
    && ALLOWED_TYPES.includes(rawBody.business_type)
    ? rawBody.business_type
    : "epicerie";

  // Minimum Google rating filter (restaurants with rating ≥ this value = quality signal)
  const minRating: number = typeof rawBody.min_rating === "number"
    && rawBody.min_rating >= 0 && rawBody.min_rating <= 5
    ? rawBody.min_rating
    : 0;

  // Only epicerie triggers the 350km exclusion (father's Proxi competition zone)
  const applyDistanceFilter = businessType === "epicerie";

  let stats = {
    found: 0, inserted: 0,
    skippedNearby: 0, skippedDuplicate: 0, skippedLowRating: 0,
    withEmail: 0,
    noSite: 0, poorSite: 0, averageSite: 0, goodSite: 0,
  };

  try {
    const places = await searchProxiStores(query, googleKey);
    stats.found = places.length;

    const supabase = getSupabaseAdmin();

    for (const place of places) {
      if (!place.location || !place.displayName?.text) continue;

      // Distance filter (only for Proxi / épicerie prospects)
      const dKm = distanceKm(AUBENTON_LAT, AUBENTON_LNG, place.location.latitude, place.location.longitude);
      if (applyDistanceFilter && dKm < EXCLUSION_RADIUS_KM) {
        stats.skippedNearby++;
        continue;
      }

      // Rating filter (restaurants with rating < min_rating are skipped)
      if (minRating > 0 && (!place.rating || place.rating < minRating)) {
        stats.skippedLowRating++;
        continue;
      }

      // Check duplicate
      const { data: existing } = await supabase
        .from("prospects")
        .select("id")
        .eq("google_place_id", place.id)
        .maybeSingle();

      if (existing) {
        stats.skippedDuplicate++;
        continue;
      }

      const { city, postalCode } = extractCityFromComponents(place.addressComponents);
      const slug = slugify(`${place.displayName.text}-${city || "france"}-${place.id.slice(0, 8)}`);

      // Try scraping email from website (non-blocking)
      let email: string | null = null;
      let scrapedMenu: ScrapedMenuItem[] | null = null;
      let aboutScraped: string | null = null;
      let websitePhotos: string[] = [];
      let siteAudit: SiteAudit | null = null;
      if (place.websiteUri) {
        email = await findEmailOnWebsite(place.websiteUri);
        if (email) stats.withEmail++;

        // Pour tous les types food (sauf épicerie) : tente de scraper le vrai menu/carte
        if (businessType !== "epicerie") {
          scrapedMenu = await scrapeRestaurantMenu(place.websiteUri);
        }

        // Scrape "about" page to détecter si c'est une vieille maison / famille
        aboutScraped = await scrapeAboutText(place.websiteUri);

        // Scrape leurs vraies photos (og:image + img tags)
        websitePhotos = await scrapeWebsitePhotos(place.websiteUri);

        // AUDIT du site existant → détecte sites vieillis / non-optimisés
        siteAudit = await auditWebsite(place.websiteUri);
      }
      // Pas de site = opportunité max (site_quality = "none")
      const siteQuality: SiteQuality = place.websiteUri
        ? (siteAudit?.quality || "poor")
        : "none";
      if (siteQuality === "none") stats.noSite++;
      else if (siteQuality === "poor") stats.poorSite++;
      else if (siteQuality === "average") stats.averageSite++;
      else if (siteQuality === "good") stats.goodSite++;

      // Extract top Google reviews
      const topReviews = extractTopReviews(place);

      // Store Google photo references only (NO API key in DB) — served via /api/prospect/photo proxy
      const photos = (place.photos || [])
        .slice(0, 4)
        .map(p => p.name)
        .filter((n): n is string => typeof n === "string" && /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(n));

      await supabase.from("prospects").insert({
        slug,
        google_place_id: place.id,
        name: place.displayName.text,
        address: place.formattedAddress || place.shortFormattedAddress || "",
        city,
        postal_code: postalCode,
        lat: place.location.latitude,
        lng: place.location.longitude,
        distance_km: dKm,
        phone: place.nationalPhoneNumber || place.internationalPhoneNumber || "",
        website: place.websiteUri || "",
        email: email || null,
        google_rating: place.rating || null,
        google_reviews_count: place.userRatingCount || null,
        photos: photos.length ? photos : null,
        hours: place.regularOpeningHours?.weekdayDescriptions?.join(" | ") || "",
        business_type: businessType,
        menu_items: scrapedMenu && scrapedMenu.length >= 4 ? scrapedMenu : null,
        reviews: topReviews.length ? topReviews : null,
        about_scraped: aboutScraped,
        website_photos: websitePhotos.length ? websitePhotos : null,
        site_quality: siteQuality,
        site_audit_score: siteAudit?.score ?? null,
        site_audit_issues: siteAudit?.issues && siteAudit.issues.length ? siteAudit.issues : null,
        status: email ? "found" : "no_email",
      });

      stats.inserted++;
    }

    return NextResponse.json({ success: true, stats });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ error: msg, stats }, { status: 500 });
  }
}
