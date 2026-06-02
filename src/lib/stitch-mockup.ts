/**
 * stitch-mockup.ts
 * ─────────────────────────────────────────────────────────────
 * Génère une maquette HTML via Google Stitch SDK pour les prospects
 * LUXURY (score ≥ 80 + critères prestige) et les artisans haut-de-gamme.
 *
 * Flux :
 *   1. Construit un prompt riche à partir des données du prospect
 *   2. Appelle stitch.createProject() + project.generate()
 *   3. Télécharge le HTML depuis l'URL renvoyée
 *   4. Retourne le HTML final (prêt à stocker dans mockup_html)
 *
 * Fallback : si Stitch échoue (quota, timeout, pas de clé), retourne null
 * → la route send/ bascule sur les templates Node existants.
 *
 * Variable d'env requise : STITCH_API_KEY
 * ─────────────────────────────────────────────────────────────
 */

import type { DeepAudit } from "@/lib/deep-audit";

/* ══════════════════════════════════════════
   Types locaux (sous-ensemble de ce que
   send/route.ts passe déjà)
   ══════════════════════════════════════════ */

export interface StitchProspect {
  id: string;
  slug: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  business_type?: string;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  about_scraped?: string | null;
  menu_items?: Array<{ category: string; name: string; description: string; price: string }> | null;
  reviews?: Array<{ author: string; rating: number; text: string; timeAgo: string }> | null;
  site_style_dna?: {
    dominantColors?: string[];
    fontFamilies?: string[];
    keywords?: string[];
  } | null;
  rich_audit?: DeepAudit | null;
}

/* ══════════════════════════════════════════
   Labels métier → langage naturel Stitch
   ══════════════════════════════════════════ */

const STITCH_BUSINESS_LABELS: Record<string, { en: string; style: string }> = {
  restaurant:    { en: "upscale restaurant",           style: "warm, sophisticated, French bistro feel" },
  gastronomique: { en: "gastronomic fine-dining restaurant", style: "luxury, refined, michelin-star aesthetic" },
  brasserie:     { en: "classic French brasserie",     style: "convivial, heritage, warm brass tones" },
  bistrot:       { en: "charming neighbourhood bistro",style: "intimate, cozy, authentic French" },
  cafe:          { en: "elegant Parisian café",        style: "light, airy, classic Parisian atmosphere" },
  glacier:       { en: "artisan ice cream shop",       style: "playful, fresh, summer vibes" },
  boulangerie:   { en: "artisan French bakery",        style: "warm, rustic, craft bread and pastries" },
  patisserie:    { en: "luxury French pastry shop",    style: "elegant, feminine, premium confectionery" },
  chocolatier:   { en: "artisan chocolate maker",      style: "rich, indulgent, dark premium tones" },
  coiffeur:      { en: "premium hair salon",           style: "clean, modern, professional beauty" },
  institut:      { en: "luxury beauty institute",      style: "spa-like, serene, premium wellness" },
  spa:           { en: "luxury spa and wellness",      style: "zen, minimalist, high-end relaxation" },
  plombier:      { en: "trusted local plumbing company",style: "professional, reliable, clean and modern" },
  electricien:   { en: "expert electrical services",   style: "professional, technical, trustworthy" },
  garage:        { en: "independent auto garage",      style: "professional, straightforward, trustworthy" },
  menuisier:     { en: "artisan carpentry workshop",   style: "craft, natural wood tones, artisanal warmth" },
  fleuriste:     { en: "premium florist",              style: "elegant, fresh, botanical, natural tones" },
  dentiste:      { en: "modern dental practice",       style: "clean, clinical yet welcoming, professional" },
  osteo:         { en: "osteopathy practice",          style: "calm, health-focused, professional wellness" },
};

function getStitchLabel(bt?: string): { en: string; style: string } {
  return STITCH_BUSINESS_LABELS[bt || ""] ?? {
    en: "local business",
    style: "professional, clean, modern",
  };
}

/* ══════════════════════════════════════════
   Construction du prompt Stitch
   ══════════════════════════════════════════ */

function buildStitchPrompt(p: StitchProspect): string {
  const label = getStitchLabel(p.business_type);
  const city = p.city || "France";
  const rating = p.google_rating ? `${p.google_rating}/5 (${p.google_reviews_count ?? "several"} reviews)` : "";

  // Couleurs dominantes extraites du site existant (garde la cohérence visuelle)
  const colorsHint = p.site_style_dna?.dominantColors?.slice(0, 3).join(", ");
  const ambianceHint = p.site_style_dna?.keywords?.slice(0, 3).join(", ");
  const fontHint = p.site_style_dna?.fontFamilies?.[0];

  // Résumé "à propos" (150 mots max pour ne pas polluer le prompt)
  const aboutSnippet = p.about_scraped
    ? p.about_scraped.slice(0, 600).replace(/\s+/g, " ")
    : "";

  // Meilleurs services/plats (max 6)
  const topItems = (p.menu_items ?? [])
    .slice(0, 6)
    .map((m) => `${m.name}${m.price ? ` (${m.price})` : ""}`)
    .join(", ");

  // Meilleur avis client
  const bestReview = (p.reviews ?? []).find((r) => r.rating >= 4 && r.text.length > 30);

  // ── Prompt structuré ──────────────────────────────────────────────────────
  const lines: string[] = [
    `Design a beautiful, professional single-page website for "${p.name}", a ${label.en} located in ${city}, France.`,
    "",
    `Overall style: ${label.style}.`,
  ];

  if (colorsHint) lines.push(`Color palette: ${colorsHint}.`);
  if (ambianceHint) lines.push(`Ambiance: ${ambianceHint}.`);

  lines.push("", "=== SECTION 1 — HERO ===");
  lines.push(`Full-width hero with a beautiful background image of a massage/spa setting.`);
  lines.push(`Business name displayed prominently: "${p.name}" — use a large, bold, WHITE font with a dark semi-transparent overlay (rgba 0,0,0,0.45) so the text is clearly readable.`);
  lines.push(`Subtitle: "Votre instant de détente personnalisé au cœur d'${city}"`);
  lines.push(`CTA button: "Réserver votre séance"`);

  if (aboutSnippet) {
    lines.push("", "=== SECTION 2 — À PROPOS ===");
    lines.push(`Use this real content: "${aboutSnippet.slice(0, 400)}"`);
    lines.push(`Philosophy quote in italics: "Notre corps est notre élément de vie, prenons soin de lui."`);
  }

  if (topItems) {
    lines.push("", "=== SECTION 3 — NOS SOINS ===");
    lines.push(`Display these REAL services as beautiful cards with icon, name, description and price:`);
    lines.push(topItems);
    lines.push(`Also include: Massages en duo (sur réservation), Cartes cadeaux valables 1 an.`);
  }

  if (bestReview) {
    lines.push("", "=== SECTION 4 — AVIS CLIENTS ===");
    lines.push(`Include this real Google review: "${bestReview.text.slice(0, 200)}" — ${bestReview.author} ★${bestReview.rating}`);
    if (rating) lines.push(`Google rating: ${rating}`);
  }

  lines.push("", "=== SECTION 5 — CONTACT & HORAIRES ===");
  if (p.phone) lines.push(`Phone: ${p.phone}`);
  if (p.address) lines.push(`Address: ${p.address}`);
  lines.push(`Hours: Lundi au Vendredi 10h–19h`);
  lines.push(`Include a simple booking/contact form.`);

  lines.push(
    "",
    "=== DESIGN REQUIREMENTS ===",
    "- CRITICAL: Hero title must be WHITE and fully readable — use a dark overlay on the background image.",
    "- Mobile-first, fully responsive.",
    "- Sticky navigation bar with the business name and a 'Réserver' button.",
    "- Smooth hover effects on service cards.",
    "- All text in French.",
    "- Elegant, zen, wellness aesthetic — soft greens, warm beiges, white space.",
    "- Service cards: icon + name + short description + price badge.",
    "- No WebConceptor branding.",
  );

  return lines.join("\n");
}

/* ══════════════════════════════════════════
   Prompt LUXURY — ultra-complet pour 860 €
   ══════════════════════════════════════════ */

function buildStitchPromptLuxury(p: StitchProspect): string {
  const label = getStitchLabel(p.business_type);
  const city = p.city || "France";
  const rating = p.google_rating ? `${p.google_rating}/5 (${p.google_reviews_count ?? "many"} reviews)` : "";
  const colorsHint = p.site_style_dna?.dominantColors?.slice(0, 3).join(", ");
  const ambianceHint = p.site_style_dna?.keywords?.slice(0, 4).join(", ");
  const aboutSnippet = p.about_scraped?.slice(0, 500).replace(/\s+/g, " ") ?? "";
  const allItems = (p.menu_items ?? []).slice(0, 10)
    .map((m) => `• ${m.name}${m.price ? ` — ${m.price}` : ""}${m.description ? ` (${m.description})` : ""}`)
    .join("\n");
  const reviews = (p.reviews ?? []).slice(0, 3)
    .map((r) => `"${r.text.slice(0, 180)}" — ${r.author} ★${r.rating}`)
    .join("\n");

  return [
    `Design a PREMIUM, luxury website for "${p.name}", an exceptional ${label.en} in ${city}, France.`,
    `This is a high-end establishment that commands premium pricing. The design must reflect exclusivity, craftsmanship and prestige.`,
    "",
    `Style: ${label.style}. ${ambianceHint ? `Atmosphere: ${ambianceHint}.` : ""}`,
    colorsHint ? `Brand colors: ${colorsHint}.` : "",
    rating ? `Reputation: ${rating} — showcase this prominently.` : "",
    "",
    "=== SECTION 1 — HERO (cinematic) ===",
    `Full-screen hero with dramatic background. Business name "${p.name}" in large elegant serif font, WHITE with strong dark overlay.`,
    `Tagline: "L'excellence au cœur de ${city}"`,
    `Two CTAs: "Découvrir nos prestations" and "Prendre rendez-vous"`,
    "",
    "=== SECTION 2 — SIGNATURE / IDENTITÉ ===",
    aboutSnippet ? `Story section with this real content: "${aboutSnippet}"` : "Brand story and values section.",
    "Include a prestigious award/certification badge or 'Depuis [year]' heritage element.",
    "",
    "=== SECTION 3 — PRESTATIONS SIGNATURE ===",
    "Luxury card grid with full descriptions and prices:",
    allItems || "Showcase key premium services with elegant cards.",
    "",
    "=== SECTION 4 — GALERIE ===",
    "Full-width image gallery section with 6 placeholder spots — atmospheric, premium visuals.",
    "",
    "=== SECTION 5 — AVIS & RÉPUTATION ===",
    reviews ? `Real client testimonials:\n${reviews}` : "Premium testimonials section.",
    rating ? `Feature Google rating: ${rating}` : "",
    "",
    "=== SECTION 6 — RÉSERVATION / CONTACT ===",
    `Phone: ${p.phone ?? ""}`,
    `Address: ${p.address ?? city}`,
    "Elegant contact form with name, email, message, preferred date.",
    "Map embed placeholder.",
    "",
    "=== LUXURY DESIGN REQUIREMENTS ===",
    "- Dark, cinematic hero with overlay — text MUST be white and fully legible.",
    "- Refined typography: elegant serif for headings, clean sans-serif for body.",
    "- Generous whitespace — luxury breathes.",
    "- Gold or deep accent color for CTAs and decorative elements.",
    "- Sticky navigation with logo, menu links, and 'Réserver' CTA.",
    "- Smooth scroll animations (CSS only).",
    "- Premium card designs with subtle shadows and borders.",
    "- Footer with address, hours, social links.",
    "- All text in French.",
    "- No generic stock-photo feel — make it feel bespoke and prestigious.",
  ].filter(Boolean).join("\n");
}

/* ══════════════════════════════════════════
   Téléchargement du HTML depuis l'URL Stitch
   ══════════════════════════════════════════ */

async function downloadStitchHtml(url: string): Promise<string | null> {
  try {
    console.log("[stitch] download URL:", url.slice(0, 120));
    // Essaie d'abord sans auth (URL signée publique)
    let res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    // Si 401/403 → réessaie avec l'API key
    if (!res.ok && (res.status === 401 || res.status === 403)) {
      console.log("[stitch] retry avec Authorization header, status:", res.status);
      res = await fetch(url, {
        signal: AbortSignal.timeout(30_000),
        headers: { Authorization: `Bearer ${process.env.STITCH_API_KEY}` },
      });
    }
    console.log("[stitch] download status:", res.status);
    if (!res.ok) return null;
    const html = await res.text();
    console.log("[stitch] HTML length:", html.length);
    return html.length > 500 ? html : null;
  } catch (e) {
    console.warn("[stitch] download error:", e instanceof Error ? e.message : e);
    return null;
  }
}

/* ══════════════════════════════════════════
   Point d'entrée principal
   ══════════════════════════════════════════ */

/**
 * Génère une maquette HTML via Google Stitch.
 * - isLuxury=true → prompt ultra-complet (6-8 sections, galerie, pricing) pour 860€
 * - isLuxury=false → prompt standard beau pour 320€
 * Retourne null si STITCH_API_KEY absent, quota dépassé, ou toute erreur.
 */
// Rotation des clés Stitch (6 comptes = 2400 crédits/jour)
let _stitchKeyIndex = 0;
function getStitchKey(): string | null {
  const keys = [
    process.env.STITCH_API_KEY_4,  // nouvelles clés en priorité
    process.env.STITCH_API_KEY_5,
    process.env.STITCH_API_KEY_6,
    process.env.STITCH_API_KEY_3,
    process.env.STITCH_API_KEY_2,
    process.env.STITCH_API_KEY,
  ].filter(Boolean) as string[];
  if (!keys.length) return null;
  return keys[_stitchKeyIndex % keys.length];
}
function rotateStitchKey() {
  _stitchKeyIndex++;
  const keys = [process.env.STITCH_API_KEY_4, process.env.STITCH_API_KEY_5, process.env.STITCH_API_KEY_6, process.env.STITCH_API_KEY_3, process.env.STITCH_API_KEY_2, process.env.STITCH_API_KEY].filter(Boolean);
  console.log("[stitch] 🔄 rotation clé →", (_stitchKeyIndex % keys.length) + 1 + "/" + keys.length);
}

async function getHtmlWithRetry(screen: { getHtml(): Promise<string> }, maxAttempts = 6, delayMs = 4000): Promise<string | null> {
  for (let i = 1; i <= maxAttempts; i++) {
    const url = await screen.getHtml();
    if (url) return url;
    if (i === Math.floor(maxAttempts / 2)) rotateStitchKey();
    if (i < maxAttempts) {
      console.log(`[stitch] ⏳ htmlCode pas prêt, tentative ${i}/${maxAttempts}…`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return null;
}

/**
 * Génère une maquette via le Stitch Generation Server (Railway).
 * Le serveur gère : rotation 6 clés, détection clés mortes, fallback OpenRouter.
 * Vercel n'a besoin que de l'URL du serveur — pas de clés Stitch en local.
 */
export async function generateStitchMockup(
  prospect: StitchProspect,
  isLuxury = false
): Promise<string | null> {
  const serverUrl = process.env.STITCH_SERVER_URL;
  if (!serverUrl) {
    console.warn("[stitch] STITCH_SERVER_URL non configurée — génération impossible");
    return null;
  }

  const prompt = isLuxury ? buildStitchPromptLuxury(prospect) : buildStitchPrompt(prospect);

  try {
    console.log(`[stitch] → ${serverUrl}/generate (${isLuxury ? "LUXURY" : "standard"})`);
    const res = await fetch(`${serverUrl}/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.STITCH_SERVER_SECRET || ""}`,
      },
      body: JSON.stringify({ prompt, slug: prospect.slug }),
      signal: AbortSignal.timeout(120_000), // 2 min max
    });

    if (!res.ok) {
      const err = await res.text().catch(() => "");
      console.warn(`[stitch] serveur erreur ${res.status}: ${err.slice(0, 100)}`);
      return null;
    }

    const data = await res.json();
    if (!data.html || data.html.length < 500) {
      console.warn("[stitch] HTML trop court ou absent");
      return null;
    }

    console.log(`[stitch] ✅ ${data.html.length} chars via ${data.source} — ${prospect.name}`);
    return `<!-- STITCH_GENERATED -->\n${data.html}`;
  } catch (err) {
    console.warn("[stitch-mockup] erreur:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

/**
 * Retourne true si la clé Stitch est configurée.
 * Utile pour logguer / alerter dans les dashboards.
 */
export function isStitchEnabled(): boolean {
  return Boolean(process.env.STITCH_API_KEY);
}
