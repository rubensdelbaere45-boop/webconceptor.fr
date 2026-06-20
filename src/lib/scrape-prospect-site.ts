/**
 * Scrape le site web existant d'un prospect pour extraire son DNA visuel.
 *
 * Output (stocké dans prospects.site_style_dna JSONB) :
 * {
 *   primaryColor: "#c2410c",          // couleur dominante (hex)
 *   accentColor: "#f59e0b",           // couleur secondaire
 *   dominantColors: ["#c2410c", ...], // top 5 couleurs (compat ancien schéma)
 *   logoUrl: "https://...",           // logo absolu
 *   heroImageUrl: "https://...",      // image hero candidate
 *   fontFamilies: ["Roboto", ...],    // polices détectées
 *   keywords: ["artisanal", ...],     // mots-clés meta description / titre
 *   sectionTitles: ["Nos services", ...], // h1/h2 trouvés
 *   navLinks: ["Accueil", "Produits", ...], // nav text
 *   scrapedAt: "2026-06-20T16:45:00Z",
 *   sourceUrl: "https://prospect.fr",
 * }
 */
import * as cheerio from "cheerio";

export type WebsiteDna = {
  primaryColor: string | null;
  accentColor: string | null;
  dominantColors: string[];
  logoUrl: string | null;
  heroImageUrl: string | null;
  fontFamilies: string[];
  keywords: string[];
  sectionTitles: string[];
  navLinks: string[];
  scrapedAt: string;
  sourceUrl: string;
  error?: string;
  // === V2 : extraction profonde pour reproduire la richesse du vrai site ===
  /** Toutes les images (jusqu'à 30) avec leurs URLs absolues. */
  allImages?: string[];
  /** Tous les headings H1/H2/H3 (jusqu'à 30) — pas juste 8. */
  allHeadings?: string[];
  /** Liste détectée de services/produits (cards, listes, repeated patterns). */
  detectedServices?: Array<{ title: string; desc?: string; image?: string }>;
  /** Liens internes détectés (sitemap) avec leur texte + URL. */
  internalLinks?: Array<{ text: string; url: string }>;
  /** Texte hero (h1 principal + paragraphe d'intro). */
  heroTitle?: string;
  heroSubtitle?: string;
  /** "About / Qui sommes-nous" text si détecté. */
  aboutText?: string;
  /** Téléphones additionnels trouvés sur le site (formats français). */
  detectedPhones?: string[];
  /** Adresses additionnelles (rue, code postal). */
  detectedAddresses?: string[];
  /** Email contact trouvé. */
  detectedEmails?: string[];
  /** Réseaux sociaux (Facebook, Instagram, LinkedIn, X). */
  socialLinks?: Array<{ network: string; url: string }>;
  /** Indicateur : le site a-t-il un blog/actualités ? */
  hasBlog?: boolean;
  /** Pages atteintes (au-delà de la home) — sample 3-5 URLs. */
  scrapedPages?: number;
  /**
   * Véhicules détectés sur le site (uniquement si garage/concession).
   * Pattern : carte/section avec marque + modèle + année + prix + km
   * souvent dans une grille "nos occasions" / "véhicules disponibles".
   */
  detectedVehicles?: Array<{
    title: string;       // "Mercedes Classe A 200d AMG Line"
    price?: string;      // "29 990 €"
    year?: string;       // "2021"
    km?: string;         // "45 000 km"
    fuel?: string;       // "Diesel", "Essence", "Hybride", "Électrique"
    image?: string;
    url?: string;        // lien vers la fiche véhicule
  }>;
};

/** Normalise une couleur en hex 6-char minuscule. */
function normalizeColor(input: string): string | null {
  const s = input.trim().toLowerCase();
  // #rgb → #rrggbb
  if (/^#[0-9a-f]{3}$/.test(s)) {
    return "#" + s[1] + s[1] + s[2] + s[2] + s[3] + s[3];
  }
  // #rrggbb
  if (/^#[0-9a-f]{6}$/.test(s)) return s;
  // rgb(r,g,b)
  const m = s.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (m) {
    const r = parseInt(m[1], 10), g = parseInt(m[2], 10), b = parseInt(m[3], 10);
    if ([r, g, b].some(v => v < 0 || v > 255)) return null;
    return "#" + [r, g, b].map(v => v.toString(16).padStart(2, "0")).join("");
  }
  // named colors (subset)
  const named: Record<string, string> = {
    red: "#ff0000", green: "#008000", blue: "#0000ff", black: "#000000",
    white: "#ffffff", gray: "#808080", grey: "#808080", orange: "#ffa500",
    yellow: "#ffff00", purple: "#800080", pink: "#ffc0cb", brown: "#a52a2a",
  };
  return named[s] || null;
}

/** Filtre couleurs trop claires (proche blanc) ou trop sombres (proche noir). */
function isInterestingColor(hex: string): boolean {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
  // Ignore quasi-blanc (>240) et quasi-noir (<20)
  if (luminance > 240 || luminance < 20) return false;
  // Ignore gris saturation < 10 (variations entre R/G/B très faibles)
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  if (max - min < 25) return false;
  return true;
}

/** Compte les occurrences de couleurs dans HTML+CSS. */
function extractDominantColors(html: string, css: string, max = 5): string[] {
  const allText = html + "\n" + css;
  const colorMatches: string[] = [];
  // Hex colors
  const hexMatches = allText.match(/#[0-9a-fA-F]{3,8}\b/g) || [];
  for (const m of hexMatches) {
    if (m.length === 4 || m.length === 7) {
      const norm = normalizeColor(m);
      if (norm) colorMatches.push(norm);
    }
  }
  // RGB colors
  const rgbMatches = allText.match(/rgba?\([^)]+\)/g) || [];
  for (const m of rgbMatches) {
    const norm = normalizeColor(m);
    if (norm) colorMatches.push(norm);
  }
  // Count + filter
  const counts: Record<string, number> = {};
  for (const c of colorMatches) {
    if (!isInterestingColor(c)) continue;
    counts[c] = (counts[c] || 0) + 1;
  }
  return Object.entries(counts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, max)
    .map(([c]) => c);
}

/** Résolve URL relative en absolue. */
function absoluteUrl(src: string, base: string): string | null {
  try {
    return new URL(src, base).toString();
  } catch {
    return null;
  }
}

/** Scrape le site web du prospect. Retourne le DNA visuel. */
export async function scrapeWebsiteDna(websiteUrl: string, opts: { timeoutMs?: number } = {}): Promise<WebsiteDna> {
  const sourceUrl = websiteUrl;
  const timeoutMs = opts.timeoutMs ?? 15000;
  const baseDna: WebsiteDna = {
    primaryColor: null, accentColor: null, dominantColors: [],
    logoUrl: null, heroImageUrl: null,
    fontFamilies: [], keywords: [], sectionTitles: [], navLinks: [],
    scrapedAt: new Date().toISOString(), sourceUrl,
  };

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(websiteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; KlyoraBot/1.0; +https://klyora.fr)",
        "Accept": "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(timeout);
    if (!res.ok) return { ...baseDna, error: `HTTP ${res.status}` };
    const html = await res.text();
    const $ = cheerio.load(html);

    // === Polices ===
    const fontFamilies = new Set<string>();
    $('link[href*="fonts.googleapis.com"]').each((_, el) => {
      const href = $(el).attr("href") || "";
      const m = href.match(/family=([^&:]+)/g) || [];
      for (const f of m) {
        const name = decodeURIComponent(f.replace(/^family=/, "")).replace(/\+/g, " ").split(":")[0];
        if (name) fontFamilies.add(name);
      }
    });
    // CSS inline font-family
    const inlineCss = $("style").map((_, el) => $(el).html() || "").get().join("\n");
    const ffMatches = inlineCss.match(/font-family\s*:\s*([^;}]+)/g) || [];
    for (const m of ffMatches) {
      const cleaned = m.replace(/font-family\s*:\s*/, "").replace(/[!"'].*$/, "").trim();
      const firstFont = cleaned.split(",")[0].replace(/['"]/g, "").trim();
      if (firstFont && firstFont.length < 40 && !/inherit|sans-serif|serif|monospace/i.test(firstFont)) {
        fontFamilies.add(firstFont);
      }
    }

    // === Couleurs ===
    let primaryColor: string | null = null;
    // Meta theme-color
    const metaTheme = $('meta[name="theme-color"]').attr("content");
    if (metaTheme) primaryColor = normalizeColor(metaTheme);
    // Si pas, extract dominante
    const dominantColors = extractDominantColors(html, inlineCss, 5);
    if (!primaryColor && dominantColors.length) primaryColor = dominantColors[0];
    const accentColor = dominantColors.length > 1 ? dominantColors[1] : null;

    // === Logo ===
    let logoUrl: string | null = null;
    const candidates = [
      $('link[rel="apple-touch-icon"]').attr("href"),
      $('link[rel="icon"]').attr("href"),
      $('header img').first().attr("src"),
      $('nav img').first().attr("src"),
      $('a[href="/"] img').first().attr("src"),
      $('img[alt*="logo" i]').first().attr("src"),
      $('img[class*="logo" i]').first().attr("src"),
      $('meta[property="og:image"]').attr("content"),
    ];
    for (const c of candidates) {
      if (!c) continue;
      const abs = absoluteUrl(c, websiteUrl);
      if (abs) { logoUrl = abs; break; }
    }

    // === Hero image ===
    let heroImageUrl: string | null = null;
    const heroCandidates = [
      $('section img').first().attr("src"),
      $('main img').first().attr("src"),
      $('img[class*="hero" i]').first().attr("src"),
      $('img[class*="banner" i]').first().attr("src"),
      $('meta[property="og:image"]').attr("content"),
    ];
    for (const c of heroCandidates) {
      if (!c) continue;
      const abs = absoluteUrl(c, websiteUrl);
      if (abs && abs !== logoUrl) { heroImageUrl = abs; break; }
    }

    // === Keywords (meta description + title) ===
    const keywords: string[] = [];
    const desc = $('meta[name="description"]').attr("content") || "";
    const title = $("title").text() || "";
    const text = (title + " " + desc).toLowerCase();
    // Mots-clés métier intéressants
    const stopwords = new Set(["le", "la", "les", "de", "du", "des", "à", "en", "un", "une", "et", "ou", "pour", "avec", "sur", "votre", "notre", "vous", "nous", "qui", "que", "dont", "sont", "est", "ce", "ces", "cette", "tout", "tous", "site", "web", "page", "accueil", "professionnel"]);
    const words = text.match(/[a-zà-ÿ]{4,}/gi) || [];
    const wordCounts: Record<string, number> = {};
    for (const w of words) {
      const lw = w.toLowerCase();
      if (stopwords.has(lw)) continue;
      wordCounts[lw] = (wordCounts[lw] || 0) + 1;
    }
    keywords.push(...Object.entries(wordCounts).sort(([, a], [, b]) => b - a).slice(0, 8).map(([w]) => w));

    // === Section titles + nav links ===
    const sectionTitles: string[] = [];
    $("h1, h2").each((_, el) => {
      const t = $(el).text().trim();
      if (t && t.length < 80 && sectionTitles.length < 8) sectionTitles.push(t);
    });
    const navLinks: string[] = [];
    $("nav a, header a").each((_, el) => {
      const t = $(el).text().trim();
      if (t && t.length < 40 && navLinks.length < 10 && !navLinks.includes(t)) navLinks.push(t);
    });

    // === V2 : extraction profonde ===

    // Toutes les images (résolues en absolu, max 30)
    const allImages: string[] = [];
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src") || "";
      if (!src || /favicon|sprite|spacer|pixel|tracking/i.test(src)) return;
      const abs = absoluteUrl(src, websiteUrl);
      if (abs && !allImages.includes(abs) && allImages.length < 30) allImages.push(abs);
    });

    // Tous les headings (max 30, > 4 chars, < 120 chars)
    const allHeadings: string[] = [];
    $("h1, h2, h3").each((_, el) => {
      const t = $(el).text().trim().replace(/\s+/g, " ");
      if (t.length >= 4 && t.length <= 120 && !allHeadings.includes(t) && allHeadings.length < 30) {
        allHeadings.push(t);
      }
    });

    // Hero title + subtitle (h1 principal + 1er <p> non vide après)
    let heroTitle: string | undefined;
    let heroSubtitle: string | undefined;
    const firstH1 = $("h1").first();
    if (firstH1.length) {
      const t = firstH1.text().trim().replace(/\s+/g, " ");
      if (t && t.length <= 120) heroTitle = t;
      const nextP = firstH1.nextAll("p").first();
      if (nextP.length) {
        const pt = nextP.text().trim().replace(/\s+/g, " ");
        if (pt && pt.length >= 20 && pt.length <= 300) heroSubtitle = pt;
      }
    }

    // Services détectés : patterns répétés (cards avec h3 + p, ou liste de divs avec image)
    const detectedServices: Array<{ title: string; desc?: string; image?: string }> = [];
    $("section, .services, .features, .card, [class*='service'], [class*='product']").each((_, sec) => {
      $(sec).find("h2, h3, h4").each((_, h) => {
        if (detectedServices.length >= 12) return false;
        const title = $(h).text().trim().replace(/\s+/g, " ");
        if (title.length < 4 || title.length > 80) return;
        if (detectedServices.some(s => s.title === title)) return;
        const descEl = $(h).nextAll("p").first();
        const desc = descEl.length ? descEl.text().trim().replace(/\s+/g, " ").slice(0, 200) : undefined;
        const imgEl = $(h).parent().find("img").first();
        const imgSrc = imgEl.attr("src");
        const img = imgSrc ? absoluteUrl(imgSrc, websiteUrl) : undefined;
        detectedServices.push({ title, desc, image: img || undefined });
      });
    });

    // Liens internes (sitemap) — uniques par URL
    const internalLinks: Array<{ text: string; url: string }> = [];
    const baseDomain = (() => { try { return new URL(websiteUrl).hostname; } catch { return null; } })();
    $("a[href]").each((_, el) => {
      if (internalLinks.length >= 30) return false;
      const href = $(el).attr("href") || "";
      const text = $(el).text().trim().replace(/\s+/g, " ");
      if (!text || text.length < 2 || text.length > 60) return;
      const abs = absoluteUrl(href, websiteUrl);
      if (!abs) return;
      try {
        const u = new URL(abs);
        if (baseDomain && u.hostname === baseDomain && !internalLinks.some(l => l.url === abs)) {
          internalLinks.push({ text, url: abs });
        }
      } catch { /* ignore */ }
    });

    // About text : 1er paragraphe long dans une section "qui sommes-nous" ou "à propos"
    let aboutText: string | undefined;
    $("section, div").each((_, el) => {
      if (aboutText) return false;
      const txt = ($(el).find("h1, h2, h3").first().text() || "").toLowerCase();
      if (/qui sommes|à propos|about|notre histoire|notre groupe|notre entreprise/.test(txt)) {
        const p = $(el).find("p").first().text().trim().replace(/\s+/g, " ");
        if (p.length > 60) aboutText = p.slice(0, 500);
      }
    });

    // Téléphones FR détectés (au format 0X XX XX XX XX ou +33...)
    const phoneRegex = /\b(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}\b/g;
    const phoneMatches = (html.match(phoneRegex) || []).map(p => p.replace(/\s+/g, " ").trim());
    const detectedPhones = Array.from(new Set(phoneMatches)).slice(0, 5);

    // Adresses FR détectées (rue + code postal)
    const addressRegex = /\d+[^,\n]{3,50}\b\d{5}\s+[A-ZÉÈ][a-zé-]+/g;
    const addressMatches = (html.match(addressRegex) || []).map(a => a.trim().replace(/\s+/g, " "));
    const detectedAddresses = Array.from(new Set(addressMatches)).slice(0, 5);

    // Emails
    const emailRegex = /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emailMatches = (html.match(emailRegex) || []).filter(e => !/\.(png|jpg|svg|gif)$/i.test(e));
    const detectedEmails = Array.from(new Set(emailMatches)).slice(0, 3);

    // Réseaux sociaux
    const socialLinks: Array<{ network: string; url: string }> = [];
    const socialPatterns: Array<{ network: string; re: RegExp }> = [
      { network: "facebook", re: /facebook\.com\/[^\s"'<>]+/i },
      { network: "instagram", re: /instagram\.com\/[^\s"'<>]+/i },
      { network: "linkedin", re: /linkedin\.com\/[^\s"'<>]+/i },
      { network: "x", re: /(?:twitter|x)\.com\/[^\s"'<>]+/i },
      { network: "youtube", re: /youtube\.com\/[^\s"'<>]+/i },
      { network: "tiktok", re: /tiktok\.com\/[^\s"'<>]+/i },
    ];
    for (const { network, re } of socialPatterns) {
      const m = html.match(re);
      if (m && !socialLinks.some(s => s.network === network)) {
        const url = "https://" + m[0].replace(/^https?:\/\//, "");
        socialLinks.push({ network, url });
      }
    }

    // Blog/actualités détecté ?
    const hasBlog = internalLinks.some(l => /blog|actualit|news|article/i.test(l.url + " " + l.text));

    // === Véhicules d'occasion (garages/concessions) ===
    // Heuristique : marque + (année 4 chiffres) + (prix €) ou (km)
    const CAR_BRANDS = /\b(Mercedes|BMW|Audi|Volkswagen|VW|Peugeot|Renault|Citro[eë]n|DS|Ford|Opel|Fiat|Toyota|Honda|Nissan|Hyundai|Kia|Mazda|Mitsubishi|Suzuki|Skoda|Seat|Volvo|Mini|Smart|Tesla|Porsche|Jeep|Land Rover|Range Rover|Jaguar|Alfa Romeo|Dacia|Lexus|Cupra|Polestar|MG|XPENG|BYD|Genesis|Subaru|Yamaha|Kawasaki|Ducati|Harley|Honda Moto|Vespa)\b/i;
    const PRICE_RE = /(\d[\d\s]{2,6})\s*€/;
    const YEAR_RE = /\b(20[0-2]\d|201\d)\b/;
    const KM_RE = /(\d[\d\s]{2,6})\s*km/i;
    const FUEL_RE = /\b(diesel|essence|hybride|[eé]lectrique|gpl|hybride rechargeable|phev|bev|ev)\b/i;

    const detectedVehicles: NonNullable<WebsiteDna["detectedVehicles"]> = [];
    // Cherche dans des conteneurs candidats (cards, articles, listings)
    $("article, .car, .vehicle, .product, .vehicle-card, .car-card, [class*='vehicle'], [class*='car-listing'], [class*='occasion'], .listing-item, .product-item").each((_, el) => {
      if (detectedVehicles.length >= 12) return false;
      const $el = $(el);
      const textFull = $el.text().replace(/\s+/g, " ").trim();
      if (textFull.length < 30 || textFull.length > 1500) return;
      const brandMatch = textFull.match(CAR_BRANDS);
      if (!brandMatch) return;
      const priceMatch = textFull.match(PRICE_RE);
      const yearMatch = textFull.match(YEAR_RE);
      const kmMatch = textFull.match(KM_RE);
      const fuelMatch = textFull.match(FUEL_RE);
      // Au minimum : marque + (prix OU km OU année) pour valider
      if (!priceMatch && !kmMatch && !yearMatch) return;
      // Title : heading le plus court (h2/h3/h4) ou data attribute
      const heading = $el.find("h1, h2, h3, h4").first().text().trim().replace(/\s+/g, " ");
      const title = (heading && heading.length < 100 && heading.length > 5)
        ? heading
        : `${brandMatch[1]} ${(textFull.match(/\b[A-Z][A-Za-z0-9]+\b/g) || []).slice(0, 2).join(" ")}`.slice(0, 80);
      // Image
      const imgEl = $el.find("img").first();
      const imgSrc = imgEl.attr("src") || imgEl.attr("data-src");
      const image = imgSrc ? absoluteUrl(imgSrc, websiteUrl) || undefined : undefined;
      // URL fiche
      const linkEl = $el.find("a").first();
      const linkHref = linkEl.attr("href");
      const url = linkHref ? absoluteUrl(linkHref, websiteUrl) || undefined : undefined;

      const v = {
        title,
        price: priceMatch ? priceMatch[1].replace(/\s+/g, " ").trim() + " €" : undefined,
        year: yearMatch ? yearMatch[1] : undefined,
        km: kmMatch ? kmMatch[1].replace(/\s+/g, " ").trim() + " km" : undefined,
        fuel: fuelMatch ? fuelMatch[1].charAt(0).toUpperCase() + fuelMatch[1].slice(1).toLowerCase() : undefined,
        image,
        url,
      };
      // Dédup par title + prix
      if (!detectedVehicles.some(x => x.title === v.title && x.price === v.price)) {
        detectedVehicles.push(v);
      }
    });

    return {
      ...baseDna,
      primaryColor,
      accentColor,
      dominantColors,
      logoUrl,
      heroImageUrl,
      fontFamilies: Array.from(fontFamilies).slice(0, 5),
      keywords,
      sectionTitles,
      navLinks,
      allImages,
      allHeadings,
      detectedServices,
      internalLinks,
      heroTitle,
      heroSubtitle,
      aboutText,
      detectedPhones,
      detectedAddresses,
      detectedEmails,
      socialLinks,
      hasBlog,
      scrapedPages: 1,
      detectedVehicles,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return { ...baseDna, error: msg };
  }
}
