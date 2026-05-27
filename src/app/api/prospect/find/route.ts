import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isPrivateOrUnsafeUrl, safeCompare, safeFetch } from "@/lib/security";
import { searchPagesJaunes } from "@/lib/sources/pages-jaunes";
import { searchOverpass } from "@/lib/sources/overpass";
import { checkEmailMx } from "@/lib/email-mx-check";
import { runDeepAudit, type DeepAudit } from "@/lib/deep-audit";

/* ══════════════════════════════════════════
   CONFIG
   ══════════════════════════════════════════ */

// Aubenton coordinates (02500)
const AUBENTON_LAT = 49.836;
const AUBENTON_LNG = 4.205;
const EXCLUSION_RADIUS_KM = 250; // ~3h drive (rayon d'exclusion Proxi autour d'Aubenton)

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
    signal: AbortSignal.timeout(12000),
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

    const prompt = `Voici le texte brut d'une page de carte/menu d'un établissement français (peut être un restaurant, glacier, boulangerie, pizzeria, crêperie, café, etc.).

Texte (peut contenir du bruit) :
"""
${bestMenuText}
"""

Retourne un JSON tableau de 6 à 14 items RÉELS trouvés dans ce texte. Format :
[
  { "category": "nom de catégorie adapté au type d'établissement", "name": "nom du produit", "description": "courte description 5-12 mots", "price": "XX€ ou XX,XX€" }
]

Règles STRICTES :
- N'invente RIEN : si tu n'es pas sûr qu'un item existe réellement, ignore-le.
- Catégories adaptées au type réel (exemples) :
    • Glacier/glace → "crèmes glacées", "sorbets", "coupes"
    • Boulangerie → "pains", "viennoiseries", "pâtisseries"
    • Crêperie → "galettes salées", "crêpes sucrées", "boissons"
    • Pizzeria → "antipasti", "pizzas", "desserts"
    • Café → "cafés & thés", "douceurs", "formules"
    • Restaurant → "entrée", "plat", "dessert"
- Prix : extrait le prix exact du texte. Si pas de prix trouvé → chaîne vide "".
- Description : prends celle du site si présente, sinon résume en 5-10 mots.
- Si moins de 4 items identifiables → retourne [].
- Réponds UNIQUEMENT avec le JSON valide, rien d'autre.`;

    const body = isOpenRouter
      ? {
          model: "deepseek/deepseek-v4-flash:free",
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
        typeof (m as { category?: string }).category === "string" &&
        (m as { category: string }).category.trim().length > 0 &&
        typeof (m as { name?: string }).name === "string" &&
        (m as { name: string }).name.trim().length > 0
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

    // Blacklist de domaines/mots de réseaux sociaux (éviter de ramener
    // les logos Tripadvisor, Instagram, Facebook, etc. dans la galerie)
    const SOCIAL_HOST_RE = /(tripadvisor|instagram|fbcdn|facebook|twimg|twitter|youtube|ytimg|pinterest|linkedin|yelp|trustpilot|gstatic|googletagmanager|googleusercontent|doubleclick|adservice|widgets\.)/i;
    const SOCIAL_PATH_RE = /(tripadvisor|instagram|facebook|twitter|youtube|pinterest|linkedin|yelp|trustpilot|snapchat|tiktok|whatsapp|telegram|email|mailto|phone|adresse|social)/i;

    const addUrl = (raw: string) => {
      if (!raw || raw.length > 500) return;
      let url: URL;
      try {
        url = new URL(raw, base.origin);
      } catch { return; }
      if (url.protocol !== "http:" && url.protocol !== "https:") return;

      const host = url.hostname.toLowerCase();
      const path = url.pathname.toLowerCase();

      // Rejet par format
      if (/\.(svg|ico|gif)$/.test(path)) return;
      // Rejet par mot-clé dans le path
      if (/(logo|icon|favicon|sprite|avatar|loader|spinner|button|btn|arrow|chevron|star|flag|badge|pictogram|social|network)/.test(path)) return;
      // Rejet explicite par domaine = réseau social / CDN externe
      if (SOCIAL_HOST_RE.test(host)) return;
      // Rejet par mot-clé "réseau social" dans le path
      if (SOCIAL_PATH_RE.test(path)) return;
      // Rejet thumbnails/petites dimensions dans le nom
      if (/\d{1,3}x\d{1,3}/.test(path)) return;
      if (/(thumb|thumbnail|mini|small|tiny|xs|sm\b|-s\.jpg|-s\.png)/.test(path)) return;

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

/**
 * Extrait l'ADN visuel du site actuel du prospect pour que la nouvelle maquette
 * s'inspire du MÊME univers (couleurs, ambiance) au lieu de proposer l'opposé.
 * Rubens : "si leur site a un style plage/décalé, il faut pas que tu fasses un truc opposé".
 */
interface SiteStyleDNA {
  dominantColors: string[];   // hex, triés par fréquence
  fontFamilies: string[];     // polices détectées
  keywords: string[];         // mots-clés ambiance (ex: "cosy", "traditionnel", "moderne")
}

async function extractSiteStyleDNA(website: string): Promise<SiteStyleDNA | null> {
  try {
    if (isPrivateOrUnsafeUrl(website)) return null;
    const base = new URL(website);
    const html = await fetchUrl(base.origin, 8000);
    if (!html) return null;

    // 1. Couleurs : cherche hex (#RRGGBB, #RGB), rgb(), rgba() dans le HTML/CSS inline
    const colorCounts = new Map<string, number>();
    const hexMatches = html.match(/#([0-9a-f]{6}|[0-9a-f]{3})\b/gi) || [];
    for (const c of hexMatches) {
      let normalized = c.toLowerCase();
      // Étendre les couleurs en 3 chiffres à 6 (ex: #fff → #ffffff)
      if (normalized.length === 4) normalized = "#" + normalized.slice(1).split("").map((x) => x + x).join("");
      // Ignorer le blanc/noir pur (trop génériques, dans les resets CSS)
      if (/^#(fff|000|ffffff|000000)$/i.test(normalized)) continue;
      // Ignorer les couleurs très claires / très foncées (probablement fonds/textes utilitaires)
      const r = parseInt(normalized.slice(1, 3), 16);
      const g = parseInt(normalized.slice(3, 5), 16);
      const b = parseInt(normalized.slice(5, 7), 16);
      const avg = (r + g + b) / 3;
      if (avg > 245 || avg < 15) continue;
      colorCounts.set(normalized, (colorCounts.get(normalized) || 0) + 1);
    }
    const dominantColors = Array.from(colorCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([hex]) => hex);

    // 2. Polices : cherche font-family:... et <link google fonts>
    const fontCounts = new Map<string, number>();
    const fontMatches = html.match(/font-family\s*:\s*["']?([A-Za-z0-9\s\-]+)/gi) || [];
    for (const m of fontMatches) {
      const name = m.replace(/font-family\s*:\s*["']?/i, "").trim().split(/,|"|'/)[0].trim();
      if (name.length > 2 && name.length < 40 && !/^(sans-serif|serif|monospace|arial|helvetica|verdana|tahoma|georgia|times|courier)$/i.test(name)) {
        fontCounts.set(name, (fontCounts.get(name) || 0) + 1);
      }
    }
    const fontFamilies = Array.from(fontCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    // 3. Mots-clés ambiance : on cherche dans tout le texte du HTML les indices
    const text = html.replace(/<[^>]+>/g, " ").toLowerCase();
    const keywords: string[] = [];
    const keywordPatterns: Array<[RegExp, string]> = [
      [/\btradition(nel|nels|nelle|nelles)?\b/, "traditionnel"],
      [/\bfamil(le|iale|ial)\b/, "familial"],
      [/\bdepuis\s+1[89]\d{2}\b/, "historique"],
      [/\bauthenti(que|ques)\b/, "authentique"],
      [/\bgastronomi(que|ques|e)\b/, "gastronomique"],
      [/\bbistronomi(que|ques|e)\b/, "bistronomique"],
      [/\bartisan(al|ale|aux|ales)?\b/, "artisanal"],
      [/\b(moderne|contemporai(n|ne|ns))\b/, "moderne"],
      [/\b(cosy|cozy|chaleureu(x|se))\b/, "cosy"],
      [/\b(élégan(t|te|ts|tes)|raffin(é|ée|és|ées))\b/, "élégant"],
      [/\b(plage|bord\s+de\s+mer|maritime|océan)\b/, "maritime"],
      [/\b(terroir|local|région(al|ale))\b/, "terroir"],
      [/\b(bio|organic)\b/, "bio"],
      [/\b(jeun(e|es)|branché(e|s)?|hipster|trendy)\b/, "jeune"],
      [/\b(festif|festive|ambiance|fête|soirée(s)?)\b/, "festif"],
    ];
    for (const [pattern, label] of keywordPatterns) {
      if (pattern.test(text)) keywords.push(label);
    }

    if (dominantColors.length === 0 && fontFamilies.length === 0 && keywords.length === 0) return null;
    return { dominantColors, fontFamilies, keywords };
  } catch {
    return null;
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

/**
 * Scrape TOUS les emails trouvés sur le site du prospect.
 * Retourne un tableau priorisé :
 *   1. Emails perso potentiels (gmail, outlook, hotmail, yahoo, free, orange, laposte, sfr, wanadoo, icloud, me)
 *      → souvent le MAIL PERSO DU PATRON, plus efficace pour la conversion
 *   2. Emails @domaine-du-site (ex: contact@monresto.fr)
 *      → mail pro de l'entreprise
 *   3. Autres emails professionnels
 * Max 3 emails retournés.
 */
const PERSONAL_EMAIL_DOMAINS = /@(gmail|outlook|hotmail|yahoo|live|free|orange|laposte|sfr|wanadoo|bbox|numericable|neuf|icloud|me|aol|protonmail|proton)\./i;

async function findEmailsOnWebsite(website: string): Promise<string[]> {
  try {
    if (isPrivateOrUnsafeUrl(website)) return [];
    const base = new URL(website);
    // Étendu : mentions légales, équipe, contact, etc. — le mail du patron est
    // souvent caché dans /mentions-legales (obligation légale) ou /equipe.
    const paths = [
      "",
      "/contact", "/contact-us", "/contactez-nous", "/nous-contacter",
      "/mentions-legales", "/mentions", "/legal", "/cgu", "/cgv",
      "/equipe", "/notre-equipe", "/team", "/a-propos", "/apropos", "/about",
      "/notre-histoire", "/histoire", "/qui-sommes-nous", "/who-we-are",
    ];

    const foundEmails = new Map<string, number>(); // email → priorité (plus bas = plus prioritaire)
    const domainHost = base.hostname.replace(/^www\./, "");

    const scoreEmail = (email: string): number => {
      const e = email.toLowerCase();
      // Priorité 0 : mail PERSONNEL (= probablement celui du patron)
      if (PERSONAL_EMAIL_DOMAINS.test(e)) return 0;
      // Priorité 1 : mail @domaine-du-site (ex: patron@monresto.fr, nominatif)
      //             avec un nom devant (pas juste "contact@")
      if (e.endsWith("@" + domainHost)) {
        const local = e.split("@")[0];
        // Nominatif (prenom.nom@, prenom@) > générique (contact@, info@)
        if (!/^(contact|info|hello|bonjour|reservation|reservations|bookings|commande|commandes|service|services|admin|webmaster|noreply|no-reply|accueil)$/i.test(local)) {
          return 1;
        }
        return 2;
      }
      // Priorité 3 : autre mail
      return 3;
    };

    for (const path of paths) {
      const url = base.origin + path;
      if (isPrivateOrUnsafeUrl(url)) continue;
      const html = await fetchUrl(url);
      if (!html) continue;

      // Extraction mailto: (les plus fiables, souvent mis volontairement)
      const mailtoMatches = html.matchAll(/mailto:([^"'\s?]+)/gi);
      for (const m of mailtoMatches) {
        const email = m[1].toLowerCase().trim();
        if (!BAD_DOMAINS.test(email) && /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(email)) {
          const current = foundEmails.get(email);
          const score = scoreEmail(email);
          if (current === undefined || score < current) foundEmails.set(email, score);
        }
      }

      // Extraction par regex (plain text)
      const emailMatches = html.match(EMAIL_REGEX) || [];
      for (const raw of emailMatches) {
        const email = raw.toLowerCase().trim();
        if (!BAD_DOMAINS.test(email)) {
          const current = foundEmails.get(email);
          const score = scoreEmail(email);
          if (current === undefined || score < current) foundEmails.set(email, score);
        }
      }

      // Si on a déjà 3+ emails, pas besoin de continuer à scraper d'autres pages
      if (foundEmails.size >= 3) break;
    }

    // Tri par priorité (0 = personnel = meilleur)
    const sorted = Array.from(foundEmails.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([email]) => email);

    // Vérification MX DNS : écarte les emails dont le domaine n'accepte pas de mail.
    // Réduit drastiquement les hard bounces Brevo (8,6% → ~3%) et préserve la
    // réputation du domaine d'envoi webconceptor.fr.
    const valid: string[] = [];
    for (const e of sorted) {
      if (valid.length >= 3) break;
      try {
        const ok = await checkEmailMx(e);
        if (ok) valid.push(e);
      } catch { /* doute → on garde */ valid.push(e); }
    }
    return valid;
  } catch {
    return [];
  }
}

// Wrapper retro-compatible pour l'ancien appel findEmailOnWebsite (1 email)
async function findEmailOnWebsite(website: string): Promise<string | null> {
  const emails = await findEmailsOnWebsite(website);
  return emails[0] || null;
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
    : "restaurant"; // défaut = restaurant (pas de filtre distance Aubenton)

  // Minimum Google rating filter (restaurants with rating ≥ this value = quality signal)
  const minRating: number = typeof rawBody.min_rating === "number"
    && rawBody.min_rating >= 0 && rawBody.min_rating <= 5
    ? rawBody.min_rating
    : 0;

  // Only epicerie triggers the 350km exclusion (father's Proxi competition zone)
  const applyDistanceFilter = businessType === "epicerie";

  const stats = {
    found: 0, inserted: 0,
    skippedNearby: 0, skippedDuplicate: 0, skippedLowRating: 0, skippedNoEmail: 0,
    skippedFranchise: 0, // prospects franchisés (Basic-Fit, McDo, etc.) skippés
    withEmail: 0,
    noSite: 0, poorSite: 0, averageSite: 0, goodSite: 0,
    timedOut: 0, // places ignorées parce qu'on a dépassé le budget temps
    // Source Pages Jaunes
    pjFound: 0, pjInserted: 0, pjSkippedDuplicate: 0, pjWithEmail: 0,
    // Source OpenStreetMap Overpass
    osmFound: 0, osmInserted: 0, osmSkippedDuplicate: 0, osmWithEmail: 0,
  };

  // Mode strict : on N'INSÈRE PAS les prospects sans email trouvé.
  // Par défaut = true (décision Rubens : pas d'appels, donc un prospect sans
  // email ne sert à rien → gaspillage de crédits Supabase + DB polluée).
  // On peut explicitement désactiver avec strict_email: false si besoin.
  const strictEmail = rawBody.strict_email !== false;

  // ═══════════════════════════════════════════════════════════════
  // BLACKLIST MEGA-FRANCHISES
  // Uniquement les chaînes nationales avec SITE CORPORATE FORT ou
  // POLITIQUE WEB CENTRALISÉE. Le gérant de l'enseigne locale n'a PAS le
  // pouvoir de décider de son propre site → 0% de conversion, donc skip.
  //
  // NE PAS METTRE ICI les petites franchises locales type Proxi, Vival, Utile,
  // Spar, G20, Casino Shop — ces gérants locaux sont indépendants, décident
  // seuls de leur présence web, et la majorité n'a pas de site → bonne cible.
  //
  // Idem pour les boulangeries dites "franchisées" type Paul ou La Mie Câline :
  // le réseau fournit la marque, mais l'exploitant local est souvent autonome
  // sur le digital. Laisser passer le scrape et laisser site_quality filtrer.
  // ═══════════════════════════════════════════════════════════════
  const FRANCHISE_BLACKLIST = [
    // Sport / fitness (mega, 0 autonomie locale — décision digitale = centrale)
    "basic-fit", "basic fit", "basicfit",
    "fitness park", "fitnesspark",
    "on air fitness",
    "l'orange bleue", "l orange bleue",
    "keepcool", "keep cool",
    "magic form",
    "club med gym", "club med",
    "gymlib", "neoness", "neofitness", "cmg sports", "planet fitness",
    "o2 coaching", "o2 switch", "o2 bien etre",
    "gofit", "go fit", "fitness first", "curves",
    "ucpa", "vita liberte", "vita liberté",
    "altéora", "alteora",
    // Fast-food chaînes internationales
    "mcdonald", "mcdo", "burger king", "kfc", "quick", "subway", "starbucks",
    "five guys", "pizza hut", "domino", "pret a manger", "pret manger",
    "columbus café", "exki", "pomme de pain",
    // Restaurants chaînes intégrées (pas franchises locales)
    "courtepaille", "buffalo grill", "memphis", "hippopotamus",
    "léon de bruxelles", "flunch", "bistro régent", "del arte",
    "la pizza de nico", "basilic & co", "la pataterie",
    // Supermarchés intégrés (Carrefour/Monoprix/Lidl/etc.)
    "franprix", "carrefour express", "carrefour city", "carrefour market",
    "monoprix", "lidl", "aldi", "leader price",
    "picard", "grand frais", "naturalia", "biocoop",
    // Beauté / parfumerie chaînes
    "yves rocher", "l'occitane", "marionnaud", "sephora", "nocibé",
    "body minute", "séphora", "the body shop", "lush", "kiko",
    // Coiffure chaînes nationales
    "jean louis david", "saint algue", "franck provost", "camille albane",
    "dessange", "coiff & co", "coiff&co", "coiff and co", "tchip",
    // Auto (chaînes nationales)
    "speedy", "midas", "feu vert", "point s", "norauto", "roady", "euromaster",
    "vulco", "first stop", "ad expert", "carglass", "mondial pare-brise",
    // Auto-école grands réseaux
    "ecf", "auto école.com", "permisecolenet", "codes rousseau",
    "ornikar", "en voiture simone",
    // Optique chaînes
    "phone house", "generale optique", "optic 2000", "krys", "afflelou",
    "optical center", "grandoptical", "ekotiq", "acuitis",
    // Dentaire chaînes
    "dentilibre", "dentego", "générations dentaire",
    // Services franchisés multi-sites
    "elek maison", "plomberie.com", "ménage service",
  ];
  // Matching par MOT ENTIER pour éviter les faux positifs type :
  //   "Jean-Paul Hévin" (artisan indé) matché par "paul"
  //   "Centre des Ostéopathes de Garibaldi" matché par "aldi"
  //   "Paulette Restaurant" matché par "paul"
  // On normalise le nom (lower + sépare ponctuation/diacritiques), on splitte
  // en tokens, et on matche UNIQUEMENT si la séquence blacklistée apparaît
  // comme mot(s) entier(s).
  const normalizeForMatch = (s: string): string =>
    s.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // vire accents
      .replace(/[^a-z0-9\s-]/g, " ") // ponctuation → espace
      .replace(/\s+/g, " ")
      .trim();

  const isFranchiseName = (name: string): boolean => {
    const normalized = ` ${normalizeForMatch(name)} `; // space-pad pour les bords
    return FRANCHISE_BLACKLIST.some((f) => {
      const normF = normalizeForMatch(f);
      if (!normF) return false;
      // Match mot(s) entier(s) : " <normF> " délimité par des espaces
      return normalized.includes(` ${normF} `);
    });
  };

  // Hard deadline — Render free tier coupe les requêtes à ~100 s.
  // On fixe 80 s pour laisser une marge confortable et garantir une réponse
  // 200 propre plutôt qu'un 502 qui tue le workflow n8n.
  const DEADLINE_MS = 50_000; // 50 s (Vercel free coupe à 60 s)
  const startedAt = Date.now();
  const timeLeft = () => DEADLINE_MS - (Date.now() - startedAt);

  try {
    const places = await searchProxiStores(query, googleKey);
    stats.found = places.length;

    const supabase = getSupabaseAdmin();

    for (const place of places) {
      if (!place.location || !place.displayName?.text) continue;

      // Budget temps : si on a moins de 8 s restantes, on s'arrête pour garantir
      // une réponse propre (pas de connection abort côté n8n / 502 Render).
      if (timeLeft() < 8_000) {
        stats.timedOut = places.length - (stats.inserted + stats.skippedNearby + stats.skippedDuplicate + stats.skippedLowRating);
        break;
      }

      // Blacklist franchises : skip direct (pas de site à leur vendre)
      if (isFranchiseName(place.displayName.text)) {
        stats.skippedFranchise++;
        continue;
      }

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
      let additionalEmails: string[] = [];
      let scrapedMenu: ScrapedMenuItem[] | null = null;
      let aboutScraped: string | null = null;
      let websitePhotos: string[] = [];
      let siteAudit: SiteAudit | null = null;
      let styleDna: SiteStyleDNA | null = null;
      let deepAudit: DeepAudit | null = null;
      if (place.websiteUri) {
        // Parallélise les 7 scrapers par place → ~5× plus rapide qu'en séquentiel.
        // NEW : ajout de runDeepAudit qui fait un audit riche Claude-assisté
        //       et stocke le brief d'amélioration en DB (utilisé par mockup-custom).
        const shouldScrapeMenu = businessType !== "epicerie";
        const results = await Promise.allSettled([
          findEmailsOnWebsite(place.websiteUri),
          shouldScrapeMenu ? scrapeRestaurantMenu(place.websiteUri) : Promise.resolve(null),
          scrapeAboutText(place.websiteUri),
          scrapeWebsitePhotos(place.websiteUri),
          auditWebsite(place.websiteUri),
          extractSiteStyleDNA(place.websiteUri),
          runDeepAudit({
            prospectName: place.displayName.text,
            siteUrl: place.websiteUri,
            businessType,
            city,
          }),
        ]);
        const allEmails = results[0].status === "fulfilled" ? (results[0].value as string[]) : [];
        email = allEmails[0] || null;
        additionalEmails = allEmails.slice(1);
        scrapedMenu = results[1].status === "fulfilled" ? (results[1].value as ScrapedMenuItem[] | null) : null;
        aboutScraped = results[2].status === "fulfilled" ? (results[2].value as string | null) : null;
        websitePhotos = results[3].status === "fulfilled" ? (results[3].value as string[]) : [];
        siteAudit = results[4].status === "fulfilled" ? (results[4].value as SiteAudit | null) : null;
        styleDna = results[5].status === "fulfilled" ? (results[5].value as SiteStyleDNA | null) : null;
        deepAudit = results[6].status === "fulfilled" ? (results[6].value as DeepAudit | null) : null;
        if (email) stats.withEmail++;
      }
      // Pas de site = opportunité max (site_quality = "none")
      const siteQuality: SiteQuality = place.websiteUri
        ? (siteAudit?.quality || "poor")
        : "none";
      if (siteQuality === "none") stats.noSite++;
      else if (siteQuality === "poor") stats.poorSite++;
      else if (siteQuality === "average") stats.averageSite++;
      else if (siteQuality === "good") stats.goodSite++;

      // Mode strict : skip si aucun email trouvé (pas de gaspillage sur un
      // prospect qu'on ne pourra jamais contacter par mail).
      if (strictEmail && !email) {
        stats.skippedNoEmail++;
        continue;
      }

      // Mode strict : skip si pas d'email (pas d'appels = pas de valeur pour un prospect sans email)
      if (strictEmail && !email) {
        stats.skippedNoEmail++;
        continue;
      }

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
        additional_emails: additionalEmails.length ? additionalEmails : null,
        google_rating: place.rating || null,
        google_reviews_count: place.userRatingCount || null,
        photos: photos.length ? photos : null,
        hours: place.regularOpeningHours?.weekdayDescriptions?.join(" | ") || "",
        business_type: businessType,
        // Priorité : scraper local > deep-audit Claude > null
        menu_items: scrapedMenu && scrapedMenu.length >= 4
          ? scrapedMenu
          : (deepAudit?.menuItems && deepAudit.menuItems.length >= 3 ? deepAudit.menuItems : null),
        reviews: topReviews.length ? topReviews : null,
        about_scraped: aboutScraped,
        website_photos: websitePhotos.length ? websitePhotos : null,
        site_quality: siteQuality,
        site_audit_score: siteAudit?.score ?? null,
        site_audit_issues: siteAudit?.issues && siteAudit.issues.length ? siteAudit.issues : null,
        site_style_dna: styleDna || null,
        rich_audit: deepAudit || null,
        status: email ? "found" : "no_email",
      });

      stats.inserted++;
    }

    // ═══════════════════════════════════════════════════════════════
    // SOURCE 2 : Pages Jaunes (scraping HTML public)
    // Complément à Google Places : les commerces qui ne sont pas bien
    // référencés sur Google mais présents dans Pages Jaunes.
    // ═══════════════════════════════════════════════════════════════
    const pjLocation = typeof rawBody.location === "string" && rawBody.location.trim()
      ? rawBody.location.trim().slice(0, 60)
      : extractLocationFromQuery(query);
    const pjActivity = typeof rawBody.pj_activity === "string" && rawBody.pj_activity.trim()
      ? rawBody.pj_activity.trim().slice(0, 60)
      : defaultPagesJaunesActivity(businessType);

    // Fonction utilitaire commune : insère un prospect externe (PJ ou OSM)
    // avec scraping emails/audit et déduplication.
    async function insertExternalProspect(p: {
      name: string;
      address: string;
      city: string;
      postalCode: string;
      phone: string;
      website: string;
      email?: string;
      lat?: number;
      lng?: number;
    }, sourcePrefix: "pj" | "osm"): Promise<"inserted" | "duplicate" | "no_email" | "timeout" | "franchise"> {
      if (timeLeft() < 8_000) return "timeout";
      if (!p.name || p.name.length < 2) return "duplicate";
      if (isFranchiseName(p.name)) return "franchise";

      // Dédup par téléphone OU name+postal_code
      let existing: { id: string } | null = null;
      if (p.phone && p.phone.length >= 8) {
        const { data } = await supabase.from("prospects").select("id").eq("phone", p.phone).maybeSingle();
        existing = data;
      }
      if (!existing && p.postalCode) {
        const { data } = await supabase.from("prospects").select("id").eq("name", p.name).eq("postal_code", p.postalCode).maybeSingle();
        existing = data;
      }
      if (existing) return "duplicate";

      const city = p.city || pjLocation;
      const slug = slugify(`${p.name}-${city}-${sourcePrefix}-${Math.random().toString(36).slice(2, 10)}`);

      // Scrape emails + audit si site dispo
      let email: string | null = p.email || null;
      let additionalEmails: string[] = [];
      let siteAudit: SiteAudit | null = null;
      let websitePhotos: string[] = [];
      if (p.website) {
        try {
          const results = await Promise.allSettled([
            findEmailsOnWebsite(p.website),
            scrapeWebsitePhotos(p.website),
            auditWebsite(p.website),
          ]);
          const allEmails = results[0].status === "fulfilled" ? (results[0].value as string[]) : [];
          if (allEmails[0]) email = email || allEmails[0];
          additionalEmails = allEmails.slice(email ? 0 : 1).filter((e) => e.toLowerCase() !== (email || "").toLowerCase()).slice(0, 2);
          websitePhotos = results[1].status === "fulfilled" ? (results[1].value as string[]) : [];
          siteAudit = results[2].status === "fulfilled" ? (results[2].value as SiteAudit | null) : null;
        } catch { /* silent */ }
      }

      // Mode strict : skip si pas d'email
      if (strictEmail && !email) return "no_email";

      const siteQuality: SiteQuality = p.website ? (siteAudit?.quality || "poor") : "none";
      if (siteQuality === "none") stats.noSite++;
      else if (siteQuality === "poor") stats.poorSite++;
      else if (siteQuality === "average") stats.averageSite++;
      else if (siteQuality === "good") stats.goodSite++;

      const syntheticId = `${sourcePrefix}_${Buffer.from(p.name + p.postalCode).toString("base64").slice(0, 30)}`;

      await supabase.from("prospects").insert({
        slug,
        google_place_id: syntheticId,
        name: p.name,
        address: p.address || "",
        city,
        postal_code: p.postalCode || "",
        lat: typeof p.lat === "number" ? p.lat : null,
        lng: typeof p.lng === "number" ? p.lng : null,
        distance_km: null,
        phone: p.phone || "",
        website: p.website || "",
        email: email || null,
        additional_emails: additionalEmails.length ? additionalEmails : null,
        google_rating: null,
        google_reviews_count: null,
        photos: null,
        hours: "",
        business_type: businessType,
        website_photos: websitePhotos.length ? websitePhotos : null,
        site_quality: siteQuality,
        site_audit_score: siteAudit?.score ?? null,
        site_audit_issues: siteAudit?.issues && siteAudit.issues.length ? siteAudit.issues : null,
        status: email ? "found" : "no_email",
      });

      return "inserted";
    }

    if (pjLocation && pjActivity && timeLeft() > 20_000) {
      try {
        const pjResults = await searchPagesJaunes(pjActivity, pjLocation);
        stats.pjFound = pjResults.length;

        for (const p of pjResults) {
          const result = await insertExternalProspect(p, "pj");
          if (result === "inserted") {
            stats.pjInserted++;
            if (p.website) stats.pjWithEmail++;
          } else if (result === "duplicate") {
            stats.pjSkippedDuplicate++;
          } else if (result === "no_email") {
            stats.skippedNoEmail++;
          } else if (result === "franchise") {
            stats.skippedFranchise++;
          } else if (result === "timeout") {
            break;
          }
        }
      } catch { /* silent : Pages Jaunes en bonus, ne doit jamais bloquer */ }
    }

    // ═══════════════════════════════════════════════════════════════
    // SOURCE 3 : OpenStreetMap (via Overpass API)
    // Complément gratuit et illimité — dataset communautaire énorme,
    // surtout fort sur les petites villes et les quartiers.
    // ═══════════════════════════════════════════════════════════════
    if (pjLocation && timeLeft() > 25_000) {
      try {
        const osmResults = await searchOverpass(businessType, pjLocation, 50);
        stats.osmFound = osmResults.length;

        for (const p of osmResults) {
          const result = await insertExternalProspect(p, "osm");
          if (result === "inserted") {
            stats.osmInserted++;
            if (p.email || p.website) stats.osmWithEmail++;
          } else if (result === "duplicate") {
            stats.osmSkippedDuplicate++;
          } else if (result === "no_email") {
            stats.skippedNoEmail++;
          } else if (result === "franchise") {
            stats.skippedFranchise++;
          } else if (result === "timeout") {
            break;
          }
        }
      } catch { /* silent : OSM en bonus, ne doit jamais bloquer */ }
    }

    return NextResponse.json({ success: true, stats });
  } catch (err) {
    // N'ÉCHOUE JAMAIS pour n8n — on renvoie 200 avec l'erreur dans le body.
    // Le workflow continue à la campagne suivante, il n'y a plus d'alerte "connection aborted".
    const msg = err instanceof Error ? err.message : "Erreur";
    return NextResponse.json({ success: false, error: msg, stats }, { status: 200 });
  }
}

// ═══════════════════════════════════════════════════════════════
// Utilitaires Pages Jaunes
// ═══════════════════════════════════════════════════════════════

/** Déduit la ville à partir d'un query type "restaurant italien Toulouse" */
function extractLocationFromQuery(query: string): string {
  const CITIES = [
    "Paris", "Lyon", "Marseille", "Toulouse", "Nice", "Nantes", "Montpellier",
    "Strasbourg", "Bordeaux", "Lille", "Rennes", "Reims", "Le Havre", "Saint-Étienne",
    "Toulon", "Grenoble", "Dijon", "Angers", "Nîmes", "Villeurbanne", "Clermont-Ferrand",
    "Aix-en-Provence", "Brest", "Limoges", "Tours", "Amiens", "Metz", "Perpignan",
    "Besançon", "Orléans", "Rouen", "Caen", "Nancy", "Argenteuil", "Montreuil",
    "Roubaix", "Tourcoing", "Nanterre", "Vitry-sur-Seine", "Avignon", "Créteil",
    "Poitiers", "La Rochelle", "Pau", "Calais", "Cannes", "Antibes", "Béziers",
  ];
  const lower = query.toLowerCase();
  for (const city of CITIES) {
    if (lower.includes(city.toLowerCase())) return city;
  }
  return "";
}

/** Retourne le terme à rechercher dans Pages Jaunes selon le business_type */
function defaultPagesJaunesActivity(businessType: string): string {
  const map: Record<string, string> = {
    restaurant: "Restaurants",
    boulangerie: "Boulangeries-patisseries",
    patisserie: "Patisseries",
    cafe: "Cafes-bars",
    glacier: "Glaciers",
    coiffeur: "Coiffeurs",
    institut: "Instituts de beaute",
    plombier: "Plombiers",
    electricien: "Electriciens",
    garage: "Garages automobiles",
    dentiste: "Dentistes",
    osteo: "Osteopathes",
    salle_sport: "Salles de sport",
    fleuriste: "Fleuristes",
    auto_ecole: "Auto-ecoles",
    epicerie: "Epiceries",
  };
  return map[businessType] || "";
}
