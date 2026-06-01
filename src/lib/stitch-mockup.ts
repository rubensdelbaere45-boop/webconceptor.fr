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
    `Design a beautiful, professional website for "${p.name}", a ${label.en} located in ${city}, France.`,
    "",
    `Overall style: ${label.style}.`,
  ];

  if (colorsHint) lines.push(`Color palette inspired by their brand: ${colorsHint}.`);
  if (ambianceHint) lines.push(`Ambiance keywords: ${ambianceHint}.`);
  if (fontHint) lines.push(`Typography feel: inspired by ${fontHint}.`);

  lines.push("", "The website must include these sections:");
  lines.push("1. HERO — full-width header with business name, tagline, and a clear call-to-action button.");

  if (aboutSnippet) {
    lines.push(`2. ABOUT — short story paragraph. Use this real content: "${aboutSnippet.slice(0, 300)}"`);
  } else {
    lines.push("2. ABOUT — a compelling 'Our Story' section.");
  }

  if (topItems) {
    lines.push(`3. SERVICES / HIGHLIGHTS — showcase these real offerings: ${topItems}`);
  } else {
    lines.push("3. SERVICES — a clean grid showing key services or offerings.");
  }

  if (bestReview) {
    lines.push(`4. TESTIMONIALS — include this real customer review: "${bestReview.text.slice(0, 180)}" — ${bestReview.author} ★${bestReview.rating}`);
  } else if (rating) {
    lines.push(`4. SOCIAL PROOF — highlight their Google rating of ${rating}.`);
  }

  lines.push("5. CONTACT — phone number, address, opening hours, and a simple contact form.");

  if (p.phone) lines.push(``, `Phone: ${p.phone}`);
  if (p.address) lines.push(`Address: ${p.address}`);

  lines.push(
    "",
    "Design requirements:",
    "- Mobile-first, fully responsive layout.",
    "- Modern CSS (no tables for layout, no deprecated tags).",
    "- Clean typography hierarchy with contrast.",
    "- Smooth hover effects on buttons and cards.",
    "- Professional, conversion-optimised design.",
    "- Include a sticky navigation bar.",
    "- All text must be in French.",
  );

  return lines.join("\n");
}

/* ══════════════════════════════════════════
   Téléchargement du HTML depuis l'URL Stitch
   ══════════════════════════════════════════ */

async function downloadStitchHtml(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) return null;
    const html = await res.text();
    return html.length > 500 ? html : null;
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════
   Point d'entrée principal
   ══════════════════════════════════════════ */

/**
 * Génère une maquette HTML via Google Stitch.
 * Retourne null si STITCH_API_KEY absent, quota dépassé, ou toute erreur.
 * → la route send/ doit toujours prévoir un fallback template.
 */
export async function generateStitchMockup(
  prospect: StitchProspect
): Promise<string | null> {
  if (!process.env.STITCH_API_KEY) return null;

  try {
    // Import dynamique (package ESM uniquement)
    const { stitch } = await import("@google/stitch-sdk");

    const prompt = buildStitchPrompt(prospect);
    const projectName = `${prospect.name} — WebConceptor`;

    // Crée le projet et génère l'écran
    const project = await stitch.createProject(projectName);
    const screen = await project.generate(prompt);

    // Récupère l'URL de téléchargement du HTML
    const htmlUrl = await screen.getHtml();
    if (!htmlUrl) return null;

    // Télécharge le contenu HTML réel
    const html = await downloadStitchHtml(htmlUrl);
    return html;
  } catch (err) {
    // Ne jamais crasher send/ à cause de Stitch
    console.warn("[stitch-mockup] erreur (fallback template):", err instanceof Error ? err.message : err);
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
