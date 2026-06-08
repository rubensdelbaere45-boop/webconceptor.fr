/**
 * mockup-dna.ts
 * ─────────────────────────────────────────────────────────────
 * Générateur PREMIUM de maquettes — inspiré du pattern Stitch.
 *
 * Lit la table Supabase `design_dna` (1 ADN par business_type) :
 *   - polices Google Fonts thématiques (EB Garamond, Playfair, etc.)
 *   - palette de 7 couleurs cohérentes par métier
 *   - icônes Material Symbols sélectionnées
 *   - hero_pattern (fullbleed_immersive | split_asymmetric | minimal_centered)
 *   - sections obligatoires
 *   - vibe + ton du copywriting
 *
 * Appelle ensuite OpenRouter Kimi K2 pour générer le copywriting personnalisé
 * (hero_subtitle, about_story, savoir_faire_points, testimonials) avec ton
 * thématique imposé par le DNA.
 *
 * Résultat : maquette au niveau Stitch sans dépendance à Stitch SDK payant.
 *
 * Activation : si `design_dna` trouvé pour le business_type du prospect →
 * cette voie prend la priorité dans regenerate-mockup/route.ts.
 * ─────────────────────────────────────────────────────────────
 */

import { createClient } from "@supabase/supabase-js";

// ─── Types ────────────────────────────────────────────────────

export interface DnaProspect {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  business_type?: string | null;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  photos?: string[] | null;
  hours?: string | null;
  reviews?: Array<{ author: string; rating: number; text: string; timeAgo?: string }> | null;
  about_scraped?: string | null;
}

interface DesignDNA {
  business_type: string;
  label_fr: string;
  font_heading: string;
  font_body: string;
  font_accent: string | null;
  color_bg: string;
  color_surface: string;
  color_primary: string;
  color_accent: string;
  color_text: string;
  color_muted: string;
  color_dark_section: string;
  icons_library: string;
  icons: string[];
  hero_pattern: string;
  template_variant?: string | null;     // 'elegant_restaurant' | 'industrial_artisan' | 'minimal_professional' | null
  signature_css?: string | null;        // bloc CSS spécifique au métier (chamfer, hard-shadow, pulse, etc.)
  sections_required: string[];
  vibe_keywords: string[];
  copywriting_tone: string;
}

interface AICopy {
  hero_caps: string;          // "Maison Fondée à Clermont-Ferrand"
  hero_title: string;         // "Venez savourer l'instant"
  hero_subtitle: string;      // sous-titre italique
  cta_primary: string;        // "Réserver une table"
  cta_secondary: string;      // "Découvrir la carte"
  univers_title: string;      // "Notre Univers"
  univers_paragraph1: string;
  univers_paragraph2: string;
  univers_badge: string;      // "Un refuge douillet"
  savoir_faire_title: string; // "Le Savoir-Faire"
  savoir_faire_subtitle: string;
  savoir_faire_cards: Array<{ icon_index: number; title: string; body: string }>;
  testimonials: Array<{ author: string; quote: string }>;
  cta_final_title: string;
  cta_final_paragraph: string;
  cta_final_button: string;
  footer_tagline: string;
}

// ─── Mapping prospect.business_type → design_dna.business_type ─

const BUSINESS_TYPE_MAP: Array<{ match: RegExp; dna: string }> = [
  // Restauration
  { match: /chocolat|salon.*th[ée]|tea.*room/i, dna: "chocolaterie_salon_the" },
  { match: /boulang|p[âa]tiss/i, dna: "boulangerie_patisserie" },
  { match: /gastronom|[ée]toil|restaurant.*chef/i, dna: "restaurant_gastronomique" },
  { match: /bistrot|brasserie|tavern|estaminet|restaurant|pizz|cr[êe]p/i, dna: "restaurant_bistrot" },
  // Beauté
  { match: /coiff|barbier/i, dna: "coiffure" },
  { match: /esth[ée]ti|institut.*beaut|spa|onglerie|manucure/i, dna: "esthetique_spa" },
  { match: /fleur|floral/i, dna: "fleuriste" },
  // BTP / Artisans
  { match: /plomb|chauffag|sanitair/i, dna: "plomberie" },
  { match: /[ée]lectric|domotique/i, dna: "electricite" },
  { match: /menuis|charp|ebenist|b[ée]b[ée]nis/i, dna: "menuiserie_charpente" },
  // Professionnels
  { match: /avocat|notair|huissier|juridi/i, dna: "cabinet_avocat" },
  { match: /m[ée]dec|dentist|kin[ée]|orthop|cabinet.*sant|pharma|psycho|ost[ée]o/i, dna: "cabinet_medical" },
  { match: /immobili|agence.*immo/i, dna: "immobilier" },
  { match: /garage|carrosseri|m[ée]caniq.*auto/i, dna: "garage_auto" },
];

function mapBusinessTypeToDna(businessType: string | null | undefined): string {
  if (!businessType) return "generic_premium";
  for (const { match, dna } of BUSINESS_TYPE_MAP) {
    if (match.test(businessType)) return dna;
  }
  return "generic_premium";
}

// ─── Récupération du DNA depuis Supabase ──────────────────────

async function fetchDna(businessType: string | null | undefined): Promise<DesignDNA | null> {
  const dnaKey = mapBusinessTypeToDna(businessType);
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
  const { data } = await supabase
    .from("design_dna")
    .select("*")
    .eq("business_type", dnaKey)
    .eq("is_active", true)
    .maybeSingle();
  if (data) return data as DesignDNA;
  // Fallback dur sur generic_premium
  const { data: fallback } = await supabase
    .from("design_dna")
    .select("*")
    .eq("business_type", "generic_premium")
    .maybeSingle();
  return (fallback as DesignDNA) || null;
}

// ─── Génération du copywriting via Kimi K2 ────────────────────

async function generateAiCopy(prospect: DnaProspect, dna: DesignDNA): Promise<AICopy> {
  const apiKey = process.env.OPENROUTER_API_KEY_KIMI || process.env.OPENROUTER_API_KEY;
  const fallback = buildFallbackCopy(prospect, dna);
  if (!apiKey) return fallback;

  const rating = prospect.google_rating ? `${prospect.google_rating}/5` : "5/5";
  const city = prospect.city || "votre ville";
  const reviewsCount = prospect.google_reviews_count ?? null;
  const about = prospect.about_scraped?.slice(0, 800) || "";

  const systemPrompt = `Tu es un copywriter français premium qui rédige des sites pour des ${dna.label_fr.toLowerCase()}.

ADN éditorial obligatoire :
- Ton : ${dna.copywriting_tone}
- Mots-clés à utiliser naturellement : ${dna.vibe_keywords.join(", ")}
- Aucun mot anglais sauf si c'est le standard métier
- Aucune mention de "WebConceptor", "maquette", "exemple", "Lorem"
- Jamais de "n'hésitez pas", "à votre service", "satisfaire le client" (clichés)
- Style : phrases courtes, sensoriel, évocateur, jamais corporate

Tu réponds UNIQUEMENT avec un JSON valide, rien d'autre. Pas de markdown, pas de texte avant/après.`;

  const userPrompt = `Établissement : ${prospect.name}
Type : ${dna.label_fr}
Ville : ${city}
${prospect.address ? `Adresse : ${prospect.address}` : ""}
${rating ? `Note Google : ${rating}${reviewsCount ? ` (${reviewsCount} avis)` : ""}` : ""}
${about ? `Extrait du site existant :\n${about}` : ""}

Rédige le contenu d'un site premium en JSON avec EXACTEMENT cette structure :

{
  "hero_caps": "petit label en MAJUSCULES avec lieu, ex: MAISON FONDÉE À ${city.toUpperCase()}",
  "hero_title": "titre principal court et évocateur (4-6 mots)",
  "hero_subtitle": "phrase italique de 12-20 mots qui pose l'ambiance",
  "cta_primary": "verbe d'action (2-4 mots)",
  "cta_secondary": "verbe d'action alternatif (2-4 mots)",
  "univers_title": "titre section présentation (2-3 mots)",
  "univers_paragraph1": "premier paragraphe (30-50 mots) qui raconte l'univers",
  "univers_paragraph2": "deuxième paragraphe (30-50 mots) qui ajoute une dimension sensorielle/humaine",
  "univers_badge": "expression courte 2-4 mots à mettre en relief",
  "savoir_faire_title": "titre section savoir-faire (2-3 mots)",
  "savoir_faire_subtitle": "sous-titre 5-10 mots en italique",
  "savoir_faire_cards": [
    { "icon_index": 0, "title": "titre 3-5 mots", "body": "description 20-30 mots" },
    { "icon_index": 1, "title": "titre 3-5 mots", "body": "description 20-30 mots" },
    { "icon_index": 2, "title": "titre 3-5 mots", "body": "description 20-30 mots" }
  ],
  "testimonials": [
    { "author": "Prénom N.", "quote": "avis court 10-20 mots dans le ton du métier" },
    { "author": "Prénom N.", "quote": "avis court 10-20 mots dans le ton du métier" },
    { "author": "Prénom N.", "quote": "avis court 10-20 mots dans le ton du métier" },
    { "author": "Prénom N.", "quote": "avis court 10-20 mots dans le ton du métier" }
  ],
  "cta_final_title": "titre final 4-6 mots",
  "cta_final_paragraph": "phrase 15-25 mots qui invite à venir/réserver",
  "cta_final_button": "verbe d'action 2-4 mots",
  "footer_tagline": "tagline 10-20 mots qui résume l'identité"
}`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: 2400,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const json = JSON.parse(content);
    // Garde-fou : merge avec fallback pour tout champ manquant
    return { ...fallback, ...json };
  } catch {
    return fallback;
  }
}

function buildFallbackCopy(p: DnaProspect, dna: DesignDNA): AICopy {
  const city = p.city || "votre ville";
  return {
    hero_caps: `MAISON ${city.toUpperCase()}`,
    hero_title: `Bienvenue chez ${p.name}`,
    hero_subtitle: `Un univers ${dna.vibe_keywords[0] || "unique"} au cœur de ${city}.`,
    cta_primary: "Découvrir",
    cta_secondary: "Nous contacter",
    univers_title: "Notre Univers",
    univers_paragraph1: `Chez ${p.name}, nous cultivons ${dna.vibe_keywords[0]} et ${dna.vibe_keywords[1] || "la passion"} depuis nos débuts. Chaque détail compte, chaque rencontre aussi.`,
    univers_paragraph2: `À ${city}, nous mettons un point d'honneur à offrir une expérience à la hauteur de votre confiance. Venez le découvrir par vous-même.`,
    univers_badge: dna.vibe_keywords[0] || "Notre signature",
    savoir_faire_title: "Notre Savoir-Faire",
    savoir_faire_subtitle: "L'excellence du geste artisanal",
    savoir_faire_cards: [
      { icon_index: 0, title: "Expertise & passion", body: `Notre équipe met son savoir-faire au service d'une expérience unique pour chaque client.` },
      { icon_index: 1, title: "Une exigence quotidienne", body: `Rien n'est laissé au hasard, du premier contact jusqu'à votre entière satisfaction.` },
      { icon_index: 2, title: "Au cœur de ${city}", body: `Implantés à ${city}, nous connaissons les attentes locales et y répondons sur-mesure.` },
    ],
    testimonials: [
      { author: "Sophie M.", quote: "Une expérience qui restera gravée. Bravo pour cette qualité." },
      { author: "Jean-Pierre D.", quote: "Professionnels, accueillants et passionnés. Je recommande à 100%." },
      { author: "Clara L.", quote: "Tout simplement parfait, de l'accueil au résultat final." },
      { author: "Marc A.", quote: "Le meilleur de la région sans aucun doute, à découvrir absolument." },
    ],
    cta_final_title: "Prêt à nous rencontrer ?",
    cta_final_paragraph: `Poussez la porte de notre établissement et laissez-vous porter par l'instant.`,
    cta_final_button: "Nous rendre visite",
    footer_tagline: `${p.name} — Artisans du goût et créateurs d'instants suspendus à ${city}.`,
  };
}

// ─── Helpers ──────────────────────────────────────────────────

function escape(s: string | null | undefined): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function pickPhoto(prospect: DnaProspect, index: number, fallback: string): string {
  const list = prospect.photos || [];
  if (list.length > 0) return list[index % list.length];
  return fallback;
}

// Photos Unsplash thématiques par métier (fallback si pas de vraies photos)
const UNSPLASH_BY_DNA: Record<string, string[]> = {
  restaurant_gastronomique: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600",
    "https://images.unsplash.com/photo-1592861956120-e524fc739696?w=1200",
    "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=1200",
  ],
  restaurant_bistrot: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200",
    "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200",
  ],
  boulangerie_patisserie: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600",
    "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=1200",
    "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1200",
  ],
  chocolaterie_salon_the: [
    "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=1600",
    "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=1200",
    "https://images.unsplash.com/photo-1542010589005-d1eacc3918f2?w=1200",
  ],
  coiffure: [
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600",
    "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=1200",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200",
  ],
  esthetique_spa: [
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600",
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1200",
    "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=1200",
  ],
  plomberie: [
    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1600",
    "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200",
  ],
  electricite: [
    "https://images.unsplash.com/photo-1565608438257-fac3c27beb36?w=1600",
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200",
    "https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=1200",
  ],
  menuiserie_charpente: [
    "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=1600",
    "https://images.unsplash.com/photo-1567361808960-dec9cb578182?w=1200",
    "https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=1200",
  ],
  cabinet_avocat: [
    "https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=1600",
    "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200",
    "https://images.unsplash.com/photo-1505664194779-8beaceb93744?w=1200",
  ],
  cabinet_medical: [
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600",
    "https://images.unsplash.com/photo-1631815589968-fdb09a223b1e?w=1200",
    "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=1200",
  ],
  fleuriste: [
    "https://images.unsplash.com/photo-1487070183336-b863922373d4?w=1600",
    "https://images.unsplash.com/photo-1469259943454-aa100abba749?w=1200",
    "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=1200",
  ],
  garage_auto: [
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1600",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200",
    "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=1200",
  ],
  immobilier: [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1600",
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200",
    "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200",
  ],
  generic_premium: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600",
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200",
    "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1200",
  ],
};

function photoFor(dnaKey: string, prospect: DnaProspect, index: number): string {
  if (prospect.photos && prospect.photos.length > 0) {
    return prospect.photos[index % prospect.photos.length];
  }
  const pool = UNSPLASH_BY_DNA[dnaKey] || UNSPLASH_BY_DNA.generic_premium;
  return pool[index % pool.length];
}

function stars(rating: number | null | undefined): string {
  const r = rating || 5;
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  let out = "";
  for (let i = 0; i < full; i++) out += `<span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;">star</span>`;
  if (half) out += `<span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;">star_half</span>`;
  return out;
}

// ─── Rendu HTML — pattern Stitch ──────────────────────────────

function renderHtml(prospect: DnaProspect, dna: DesignDNA, copy: AICopy, dnaKey: string): string {
  const heroPhoto = photoFor(dnaKey, prospect, 0);
  const universPhoto = photoFor(dnaKey, prospect, 1);
  const savoirPhoto = photoFor(dnaKey, prospect, 2);

  const fontParam = (name: string) => name.replace(/ /g, "+");
  const fontsLink = `https://fonts.googleapis.com/css2?family=${fontParam(dna.font_heading)}:wght@400;500;600;700&family=${fontParam(dna.font_body)}:wght@300;400;500;700&display=swap`;
  const iconsLink = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap`;

  // Reviews : préfère vrais avis Google si dispo
  const reviewsHtml = (prospect.reviews && prospect.reviews.length >= 3
    ? prospect.reviews.slice(0, 6)
    : copy.testimonials.map(t => ({ author: t.author, rating: 5, text: t.quote }))
  )
    .map(r => `
      <div class="testimonial-card">
        <div class="testimonial-stars">${stars(("rating" in r ? r.rating : 5) as number)}</div>
        <p class="testimonial-quote">«&nbsp;${escape((r as any).text || (r as any).quote)}&nbsp;»</p>
        <div class="testimonial-author">${escape((r as any).author)}</div>
      </div>
    `).join("");

  const ratingDisplay = prospect.google_rating ? `${prospect.google_rating.toFixed(1)}/5` : "5,0/5";
  const reviewsCountDisplay = prospect.google_reviews_count
    ? `${prospect.google_reviews_count} avis Google`
    : `Avis Google`;

  const icons = dna.icons.length >= 3 ? dna.icons : [...dna.icons, "star", "schedule", "place"];

  // CSS palette en variables
  const cssVars = `
    --bg: ${dna.color_bg};
    --surface: ${dna.color_surface};
    --primary: ${dna.color_primary};
    --accent: ${dna.color_accent};
    --text: ${dna.color_text};
    --muted: ${dna.color_muted};
    --dark: ${dna.color_dark_section};
  `;

  // Hero selon hero_pattern
  let heroSection = "";
  if (dna.hero_pattern === "fullbleed_immersive") {
    heroSection = `
    <section class="hero hero-fullbleed">
      <div class="hero-bg" style="background-image:url('${escape(heroPhoto)}')"></div>
      <div class="hero-overlay"></div>
      <div class="hero-content">
        <span class="hero-caps">${escape(copy.hero_caps)}</span>
        <h1 class="hero-title">${escape(copy.hero_title)}</h1>
        <p class="hero-subtitle">${escape(copy.hero_subtitle)}</p>
        <div class="hero-ctas">
          <a href="#contact" class="btn btn-primary">${escape(copy.cta_primary)}</a>
          <a href="#savoir-faire" class="btn btn-ghost">${escape(copy.cta_secondary)}</a>
        </div>
      </div>
    </section>`;
  } else if (dna.hero_pattern === "minimal_centered") {
    heroSection = `
    <section class="hero hero-minimal">
      <div class="hero-content-minimal">
        <span class="hero-caps">${escape(copy.hero_caps)}</span>
        <h1 class="hero-title">${escape(copy.hero_title)}</h1>
        <p class="hero-subtitle">${escape(copy.hero_subtitle)}</p>
        <div class="hero-ctas">
          <a href="#contact" class="btn btn-primary">${escape(copy.cta_primary)}</a>
          <a href="#savoir-faire" class="btn btn-ghost">${escape(copy.cta_secondary)}</a>
        </div>
      </div>
    </section>`;
  } else {
    // split_asymmetric (défaut)
    heroSection = `
    <section class="hero hero-split">
      <div class="hero-text">
        <span class="hero-caps">${escape(copy.hero_caps)}</span>
        <h1 class="hero-title">${escape(copy.hero_title)}</h1>
        <p class="hero-subtitle">${escape(copy.hero_subtitle)}</p>
        <div class="hero-ctas">
          <a href="#contact" class="btn btn-primary">${escape(copy.cta_primary)}</a>
          <a href="#savoir-faire" class="btn btn-ghost">${escape(copy.cta_secondary)}</a>
        </div>
      </div>
      <div class="hero-image">
        <img src="${escape(heroPhoto)}" alt="${escape(prospect.name)}" />
      </div>
    </section>`;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(prospect.name)} — ${escape(dna.label_fr)} ${prospect.city ? `à ${escape(prospect.city)}` : ""}</title>
<meta name="description" content="${escape(copy.footer_tagline)}">
<link href="${fontsLink}" rel="stylesheet">
<link href="${iconsLink}" rel="stylesheet">
<style>
  :root{${cssVars}}
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{font-family:'${dna.font_body}',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;font-size:16px;-webkit-font-smoothing:antialiased}
  h1,h2,h3,h4{font-family:'${dna.font_heading}',Georgia,serif;font-weight:500;color:var(--primary);line-height:1.2;letter-spacing:-0.01em}
  img{max-width:100%;display:block}
  a{color:inherit;text-decoration:none}
  .material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;vertical-align:middle}

  /* Container */
  .container{max-width:1200px;margin:0 auto;padding:0 24px}
  @media(max-width:640px){.container{padding:0 20px}}

  /* Header sticky transparent */
  .site-header{position:sticky;top:0;background:color-mix(in srgb,var(--bg) 90%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid color-mix(in srgb,var(--muted) 18%,transparent);z-index:100}
  .site-header .container{display:flex;align-items:center;justify-content:space-between;padding-top:18px;padding-bottom:18px}
  .brand{font-family:'${dna.font_heading}',serif;font-size:24px;font-weight:600;color:var(--primary)}
  .nav-links{display:flex;gap:32px;align-items:center}
  .nav-links a{font-size:14px;font-weight:500;color:var(--muted);transition:color .25s}
  .nav-links a:hover{color:var(--accent)}
  .nav-links a.active{color:var(--accent);border-bottom:2px solid var(--accent);padding-bottom:4px}
  .nav-cta{background:var(--primary);color:var(--bg);padding:10px 22px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;transition:background .25s}
  .nav-cta:hover{background:var(--accent)}
  @media(max-width:768px){.nav-links{display:none}}

  /* Hero — fullbleed */
  .hero-fullbleed{position:relative;min-height:88vh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--dark)}
  .hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0.55}
  .hero-overlay{position:absolute;inset:0;background:linear-gradient(to top,var(--dark) 0%,transparent 55%,transparent 100%)}
  .hero-content{position:relative;z-index:2;text-align:center;max-width:780px;padding:0 24px}
  .hero-content .hero-caps{color:var(--accent);letter-spacing:0.3em;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:24px;display:inline-block}
  .hero-content .hero-title{color:var(--bg);font-size:clamp(40px,7vw,72px);font-weight:600;letter-spacing:-0.02em;margin-bottom:32px}
  .hero-content .hero-subtitle{color:color-mix(in srgb,var(--bg) 88%,transparent);font-size:18px;font-style:italic;line-height:1.6;margin-bottom:40px}
  .hero-ctas{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}

  /* Hero — minimal centered */
  .hero-minimal{padding:120px 24px 100px;text-align:center}
  .hero-content-minimal{max-width:720px;margin:0 auto}
  .hero-content-minimal .hero-caps{color:var(--accent);letter-spacing:0.3em;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:24px;display:inline-block}
  .hero-content-minimal .hero-title{color:var(--primary);font-size:clamp(40px,6vw,64px);font-weight:600;margin-bottom:24px}
  .hero-content-minimal .hero-subtitle{color:var(--muted);font-size:18px;font-style:italic;margin-bottom:36px}

  /* Hero — split */
  .hero-split{padding:80px 24px;max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
  .hero-split .hero-caps{color:var(--accent);letter-spacing:0.3em;font-size:12px;font-weight:700;text-transform:uppercase;margin-bottom:20px;display:inline-block}
  .hero-split .hero-title{font-size:clamp(36px,5vw,56px);font-weight:600;margin-bottom:24px;color:var(--primary)}
  .hero-split .hero-subtitle{color:var(--muted);font-size:18px;font-style:italic;margin-bottom:36px}
  .hero-split .hero-image img{width:100%;border-radius:16px;aspect-ratio:4/5;object-fit:cover;box-shadow:0 30px 60px -20px rgba(0,0,0,0.18)}
  @media(max-width:900px){.hero-split{grid-template-columns:1fr;padding:60px 24px;gap:48px}}

  /* Buttons */
  .btn{display:inline-block;padding:14px 32px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;transition:all .25s}
  .btn-primary{background:var(--accent);color:var(--dark)}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:0 12px 30px -10px color-mix(in srgb,var(--accent) 50%,transparent)}
  .btn-ghost{border:1px solid var(--accent);color:var(--accent)}
  .btn-ghost:hover{background:color-mix(in srgb,var(--accent) 12%,transparent)}

  /* Section générique */
  section{padding:96px 0}
  @media(max-width:640px){section{padding:64px 0}}
  .section-eyebrow{font-size:12px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--muted);margin-bottom:12px;display:inline-block}
  .section-title{font-size:clamp(28px,4vw,40px);margin-bottom:20px;color:var(--primary)}
  .section-title.bordered{padding-left:24px;border-left:4px solid var(--accent)}

  /* Univers (asymetric) */
  .univers{padding:96px 0}
  .univers-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
  .univers-img-wrap{position:relative}
  .univers-img-wrap img{width:100%;aspect-ratio:4/5;object-fit:cover;border-radius:16px;box-shadow:0 30px 60px -20px rgba(0,0,0,0.15)}
  .univers-badge{position:absolute;bottom:-40px;right:-40px;width:180px;height:180px;background:color-mix(in srgb,var(--accent) 16%,transparent);backdrop-filter:blur(10px);border:1px solid color-mix(in srgb,var(--accent) 35%,transparent);border-radius:50%;display:flex;align-items:center;justify-content:center;padding:24px;text-align:center}
  .univers-badge span{font-family:'${dna.font_heading}',serif;font-size:20px;color:var(--primary);font-style:italic;line-height:1.3}
  @media(max-width:900px){.univers-grid{grid-template-columns:1fr;gap:48px}.univers-badge{display:none}}
  .univers-text p{font-size:17px;color:var(--muted);margin-bottom:20px;line-height:1.7}
  .univers-stats{display:flex;gap:48px;margin-top:32px}
  .univers-stat{}
  .univers-stat-value{font-family:'${dna.font_heading}',serif;font-size:28px;color:var(--primary)}
  .univers-stat-label{font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:var(--muted);margin-top:6px}
  .univers-stat:nth-child(2){border-left:1px solid color-mix(in srgb,var(--muted) 25%,transparent);padding-left:48px}
  .univers-stars{color:var(--accent);font-size:18px;display:flex;gap:2px;margin-top:4px}

  /* Savoir-Faire (bento) */
  .savoir-faire{background:var(--surface);padding:96px 0}
  .savoir-header{text-align:center;margin-bottom:64px}
  .savoir-header .section-subtitle{color:var(--muted);font-style:italic;letter-spacing:0.15em;text-transform:uppercase;font-size:13px;margin-top:8px;display:block}
  .savoir-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
  .savoir-card{background:var(--bg);border:1px solid color-mix(in srgb,var(--muted) 15%,transparent);border-radius:16px;padding:40px;display:flex;flex-direction:column;justify-content:space-between;overflow:hidden;transition:transform .35s}
  .savoir-card:hover{transform:translateY(-6px)}
  .savoir-card.span2{grid-column:span 2}
  .savoir-card.dark{background:var(--dark);color:var(--bg)}
  .savoir-card.dark h3{color:var(--bg)}
  .savoir-card.dark p{color:color-mix(in srgb,var(--bg) 80%,transparent)}
  .savoir-card-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
  .savoir-card-header .material-symbols-outlined{font-size:36px;color:var(--accent)}
  .savoir-card-header .savoir-num{font-size:12px;font-weight:700;color:var(--accent);opacity:0.6;letter-spacing:0.15em}
  .savoir-card h3{font-size:22px;margin-bottom:12px}
  .savoir-card p{font-size:15px;color:var(--muted);line-height:1.65}
  .savoir-card.dark p{color:color-mix(in srgb,var(--bg) 80%,transparent)}
  .savoir-card-img{margin-top:24px;border-radius:10px;overflow:hidden;height:180px}
  .savoir-card-img img{width:100%;height:100%;object-fit:cover;transition:transform .6s}
  .savoir-card:hover .savoir-card-img img{transform:scale(1.08)}
  .savoir-link{display:flex;align-items:center;gap:8px;color:var(--accent);font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-top:24px}
  @media(max-width:900px){.savoir-grid{grid-template-columns:1fr}.savoir-card.span2{grid-column:span 1}}

  /* Testimonials carousel */
  .testimonials{overflow:hidden;padding:80px 0}
  .testimonials-scroll{display:flex;gap:24px;animation:scrollX 35s linear infinite}
  .testimonials-scroll:hover{animation-play-state:paused}
  .testimonial-card{min-width:380px;max-width:380px;background:var(--surface);border:1px solid color-mix(in srgb,var(--muted) 18%,transparent);border-radius:16px;padding:32px}
  .testimonial-stars{color:var(--accent);display:flex;gap:2px;margin-bottom:16px}
  .testimonial-quote{font-size:16px;font-style:italic;color:var(--text);line-height:1.65;margin-bottom:20px}
  .testimonial-author{font-size:12px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--muted)}
  @keyframes scrollX{from{transform:translateX(0)}to{transform:translateX(-50%)}}

  /* Final CTA */
  .cta-final{background:var(--surface);text-align:center;padding:120px 24px}
  .cta-final .material-symbols-outlined{font-size:48px;color:var(--accent);margin-bottom:24px;display:block}
  .cta-final h2{font-size:clamp(28px,4vw,44px);margin-bottom:20px}
  .cta-final p{color:var(--muted);font-size:18px;max-width:580px;margin:0 auto 36px;line-height:1.65}

  /* Footer */
  .site-footer{background:var(--dark);color:color-mix(in srgb,var(--bg) 80%,transparent);padding:64px 0 40px;border-top:1px solid color-mix(in srgb,var(--accent) 25%,transparent)}
  .footer-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:48px}
  .footer-col h4{color:var(--accent);font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:16px;font-family:'${dna.font_body}',sans-serif}
  .footer-col .brand-line{font-family:'${dna.font_heading}',serif;color:var(--accent);font-size:22px;margin-bottom:12px}
  .footer-col p, .footer-col a{font-size:14px;color:color-mix(in srgb,var(--bg) 75%,transparent);margin-bottom:8px;display:block;transition:color .25s}
  .footer-col a:hover{color:var(--accent)}
  .footer-bottom{text-align:center;font-size:12px;color:color-mix(in srgb,var(--bg) 55%,transparent);margin-top:48px;padding-top:24px;border-top:1px solid color-mix(in srgb,var(--bg) 12%,transparent)}
  @media(max-width:768px){.footer-grid{grid-template-columns:1fr;gap:32px;text-align:center}}

  /* Scroll reveal */
  .reveal{opacity:0;transform:translateY(28px);transition:all 0.9s cubic-bezier(0.16,1,0.3,1)}
  .reveal.in{opacity:1;transform:translateY(0)}
</style>
</head>
<body>

<header class="site-header">
  <div class="container">
    <div class="brand">${escape(prospect.name)}</div>
    <nav class="nav-links">
      <a href="#" class="active">Accueil</a>
      <a href="#univers">Notre Univers</a>
      <a href="#savoir-faire">Savoir-Faire</a>
      <a href="#contact">Contact</a>
    </nav>
    <a href="#contact" class="nav-cta">${escape(copy.cta_primary)}</a>
  </div>
</header>

<main>

${heroSection}

<section id="univers" class="univers reveal">
  <div class="container">
    <div class="univers-grid">
      <div class="univers-img-wrap">
        <img src="${escape(universPhoto)}" alt="${escape(copy.univers_title)} — ${escape(prospect.name)}" loading="lazy">
        <div class="univers-badge"><span>${escape(copy.univers_badge)}</span></div>
      </div>
      <div class="univers-text">
        <h2 class="section-title bordered">${escape(copy.univers_title)}</h2>
        <p>${escape(copy.univers_paragraph1)}</p>
        <p>${escape(copy.univers_paragraph2)}</p>
        <div class="univers-stats">
          <div class="univers-stat">
            <div class="univers-stat-value">${ratingDisplay}</div>
            <div class="univers-stars">${stars(prospect.google_rating)}</div>
            <div class="univers-stat-label">${reviewsCountDisplay}</div>
          </div>
          <div class="univers-stat">
            <div class="univers-stat-value">${escape(prospect.city || "Local")}</div>
            <div class="univers-stat-label">Notre ancrage</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="savoir-faire" class="savoir-faire reveal">
  <div class="container">
    <div class="savoir-header">
      <h2 class="section-title">${escape(copy.savoir_faire_title)}</h2>
      <span class="section-subtitle">${escape(copy.savoir_faire_subtitle)}</span>
    </div>
    <div class="savoir-grid">
      <div class="savoir-card span2">
        <div class="savoir-card-header">
          <span class="material-symbols-outlined">${escape(icons[0])}</span>
          <span class="savoir-num">01</span>
        </div>
        <h3>${escape(copy.savoir_faire_cards[0]?.title || "")}</h3>
        <p>${escape(copy.savoir_faire_cards[0]?.body || "")}</p>
        <div class="savoir-card-img"><img src="${escape(savoirPhoto)}" alt="${escape(copy.savoir_faire_cards[0]?.title || "")}" loading="lazy"></div>
      </div>
      <div class="savoir-card dark">
        <div>
          <div class="savoir-card-header">
            <span class="material-symbols-outlined" style="color:var(--accent)">${escape(icons[1])}</span>
          </div>
          <h3>${escape(copy.savoir_faire_cards[1]?.title || "")}</h3>
          <p>${escape(copy.savoir_faire_cards[1]?.body || "")}</p>
        </div>
        <a class="savoir-link" href="#contact">Découvrir <span class="material-symbols-outlined">arrow_forward</span></a>
      </div>
      <div class="savoir-card" style="align-items:center;justify-content:center;text-align:center">
        <div style="width:80px;height:80px;border-radius:50%;border:1px solid var(--accent);display:flex;align-items:center;justify-content:center;margin:0 auto 24px">
          <span class="material-symbols-outlined" style="color:var(--accent);font-size:32px">${escape(icons[2] || "verified")}</span>
        </div>
        <h3>${escape(copy.savoir_faire_cards[2]?.title || "")}</h3>
        <p style="font-style:italic">${escape(copy.savoir_faire_cards[2]?.body || "")}</p>
      </div>
    </div>
  </div>
</section>

<section class="testimonials reveal">
  <div class="testimonials-scroll">
    ${reviewsHtml}${reviewsHtml}
  </div>
</section>

<section id="contact" class="cta-final reveal">
  <span class="material-symbols-outlined">${escape(icons[0])}</span>
  <h2>${escape(copy.cta_final_title)}</h2>
  <p>${escape(copy.cta_final_paragraph)}</p>
  <a href="${prospect.phone ? `tel:${prospect.phone.replace(/\s/g, "")}` : "#"}" class="btn btn-primary" style="background:var(--primary);color:var(--bg);padding:18px 40px;font-size:13px">${escape(copy.cta_final_button)}</a>
  ${prospect.address ? `<p style="margin-top:32px;font-size:14px">${escape(prospect.address)}</p>` : ""}
  ${prospect.phone ? `<p style="margin-top:8px;font-size:14px"><strong>${escape(prospect.phone)}</strong></p>` : ""}
</section>

</main>

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col">
        <div class="brand-line">${escape(prospect.name)}</div>
        <p>${escape(copy.footer_tagline)}</p>
      </div>
      <div class="footer-col">
        <h4>Informations</h4>
        ${prospect.address ? `<a>${escape(prospect.address)}</a>` : ""}
        ${prospect.hours ? `<a>${escape(prospect.hours)}</a>` : ""}
        ${prospect.phone ? `<a href="tel:${escape(prospect.phone)}">${escape(prospect.phone)}</a>` : ""}
        ${prospect.email ? `<a href="mailto:${escape(prospect.email)}">${escape(prospect.email)}</a>` : ""}
      </div>
      <div class="footer-col">
        <h4>${escape(prospect.city || "Local")}</h4>
        <p>${prospect.city ? `Implantés à ${escape(prospect.city)}, nous sommes à votre service.` : "À votre service localement."}</p>
        <a href="#contact" style="color:var(--accent);font-weight:700;margin-top:12px">${escape(copy.cta_primary)} →</a>
      </div>
    </div>
    <div class="footer-bottom">
      © ${new Date().getFullYear()} ${escape(prospect.name)}. ${prospect.city ? `${escape(prospect.city)}.` : ""}
    </div>
  </div>
</footer>

<script>
  // Intersection Observer pour reveal au scroll
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
</script>

</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// RENDERER 2 — Pattern "Voltage & Trust" pour artisans BTP
// (électricien, plombier, menuisier, garage)
// Inspiré du design system Stitch industrial-artisan :
//   - Hero split avec badge mono "DISPONIBLE 24H/24"
//   - CTA téléphone jaune ardent + pulse animation
//   - Trust bar inverse (étoiles Google + certifs)
//   - Services 6-grid avec border-l hover primary + chamfer corners
//   - 1 card CTA urgence intégrée au grid
//   - Section "Pourquoi nous" 3 features
//   - Hard shadow industrial (offset, pas de blur)
// ═══════════════════════════════════════════════════════════════

function renderArtisanHtml(prospect: DnaProspect, dna: DesignDNA, copy: AICopy, dnaKey: string): string {
  const heroPhoto = photoFor(dnaKey, prospect, 0);
  const trustPhoto = photoFor(dnaKey, prospect, 1);

  const fontParam = (name: string) => name.replace(/ /g, "+");
  const fontsLink = `https://fonts.googleapis.com/css2?family=${fontParam(dna.font_heading)}:wght@500;700;800;900&family=${fontParam(dna.font_body)}:wght@400;500;700&${dna.font_accent ? `family=${fontParam(dna.font_accent)}:wght@700&` : ""}display=swap`;
  const iconsLink = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap`;

  const phoneClean = (prospect.phone || "").replace(/\s/g, "");
  const phoneDisplay = prospect.phone || "";

  const icons = dna.icons.length >= 5 ? dna.icons : [...dna.icons, "build", "schedule", "place", "verified", "star"];

  const ratingDisplay = prospect.google_rating ? `${prospect.google_rating.toFixed(1)}/5` : "5,0/5";
  const reviewsCountDisplay = prospect.google_reviews_count
    ? `${prospect.google_rating?.toFixed(1) || "5"}/5 sur Google (${prospect.google_reviews_count} avis)`
    : `Avis Google certifiés`;

  // Reviews
  const reviewsList = (prospect.reviews && prospect.reviews.length >= 3
    ? prospect.reviews.slice(0, 4)
    : copy.testimonials.map(t => ({ author: t.author, rating: 5, text: t.quote }))
  );

  // 5 services + 1 carte CTA urgence
  const serviceCards = copy.savoir_faire_cards.slice(0, 5);
  while (serviceCards.length < 5) {
    serviceCards.push({
      icon_index: serviceCards.length,
      title: ["Maintenance", "Dépannage", "Installation", "Diagnostic", "Conseil"][serviceCards.length],
      body: "Une intervention rapide, propre et conforme aux normes en vigueur dans votre région.",
    });
  }

  const cssVars = `
    --bg: ${dna.color_bg};
    --surface: ${dna.color_surface};
    --primary: ${dna.color_primary};
    --accent: ${dna.color_accent};
    --text: ${dna.color_text};
    --muted: ${dna.color_muted};
    --dark: ${dna.color_dark_section};
  `;

  const signatureCss = dna.signature_css || `
    /* Signature Voltage & Trust (défaut artisan) */
    .chamfer { clip-path: polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px); }
    .hard-shadow { box-shadow: 4px 4px 0 0 ${dna.color_dark_section}; }
    .hard-shadow:hover { box-shadow: 6px 6px 0 0 ${dna.color_dark_section}; }
    .emergency-pulse { animation: emergencyPulse 1.8s ease-out infinite; }
    @keyframes emergencyPulse {
      0%, 100% { box-shadow: 0 0 0 0 ${dna.color_accent}66; }
      50% { box-shadow: 0 0 0 14px ${dna.color_accent}00; }
    }
    .wire-node { position: relative; }
    .wire-node::after { content:''; position:absolute; bottom:-22px; left:50%; transform:translateX(-50%); width:1px; height:18px; background: var(--primary); }
    .wire-node::before { content:''; position:absolute; bottom:-26px; left:calc(50% - 3px); width:7px; height:7px; border-radius:50%; background: var(--primary); }
    .service-card { transition: border-left-color .25s, transform .25s; border-left: 4px solid transparent; }
    .service-card:hover { border-left-color: var(--primary); transform: translateY(-2px); }
  `;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(prospect.name)} — ${escape(dna.label_fr)} ${prospect.city ? `à ${escape(prospect.city)}` : ""}</title>
<meta name="description" content="${escape(copy.footer_tagline)}">
<link href="${fontsLink}" rel="stylesheet">
<link href="${iconsLink}" rel="stylesheet">
<style>
  :root{${cssVars}}
  *{margin:0;padding:0;box-sizing:border-box}
  html{scroll-behavior:smooth}
  body{font-family:'${dna.font_body}',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.6;font-size:16px;-webkit-font-smoothing:antialiased}
  h1,h2,h3,h4{font-family:'${dna.font_heading}',sans-serif;font-weight:800;color:var(--primary);line-height:1.15;letter-spacing:-0.01em}
  img{max-width:100%;display:block}
  a{color:inherit;text-decoration:none}
  .material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;vertical-align:middle}
  .mono{font-family:${dna.font_accent ? `'${dna.font_accent}',` : ""}'JetBrains Mono',monospace;letter-spacing:0.1em;text-transform:uppercase}

  /* Container */
  .container{max-width:1200px;margin:0 auto;padding:0 24px}
  @media(max-width:640px){.container{padding:0 18px}}

  ${signatureCss}

  /* Header */
  .site-header{position:sticky;top:0;background:#fff;z-index:100;border-bottom:1px solid color-mix(in srgb,var(--muted) 25%,transparent)}
  .site-header .container{display:flex;align-items:center;justify-content:space-between;height:78px}
  .brand-logo{display:flex;align-items:center;gap:12px}
  .brand-name{font-family:'${dna.font_heading}',sans-serif;font-weight:800;font-size:22px;color:var(--primary);letter-spacing:-0.01em}
  .nav-links{display:flex;gap:28px;align-items:center}
  .nav-links a{font-size:13px;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:0.08em;transition:color .2s}
  .nav-links a:hover{color:var(--primary)}
  .nav-tel{display:flex;align-items:center;gap:8px;background:var(--primary);color:#fff;padding:12px 18px;border-radius:6px;font-weight:700;font-size:14px}
  .nav-tel:hover{opacity:0.9}
  @media(max-width:900px){.nav-links{display:none}}

  /* Hero */
  .hero{position:relative;min-height:560px;display:flex;align-items:center;overflow:hidden;background:var(--surface)}
  .hero-bg{position:absolute;inset:0}
  .hero-bg::before{content:'';position:absolute;inset:0;background:linear-gradient(to right,${dna.color_bg} 0%,${dna.color_bg}cc 40%,transparent 75%);z-index:2}
  .hero-bg img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
  .hero-content{position:relative;z-index:3;max-width:640px}
  .hero-badge{display:inline-flex;align-items:center;gap:8px;background:var(--accent);color:${dna.color_dark_section};padding:8px 14px;border-radius:4px;font-size:12px;font-weight:700;margin-bottom:24px}
  .hero-badge .material-symbols-outlined{font-size:18px}
  .hero h1{font-size:clamp(36px,5.5vw,52px);font-weight:900;color:var(--primary);margin-bottom:16px;line-height:1.05}
  .hero h1 .accent{color:var(--text);font-weight:700}
  .hero-sub{font-size:18px;color:var(--muted);margin-bottom:32px;line-height:1.55;max-width:520px}
  .hero-ctas{display:flex;gap:14px;flex-wrap:wrap}
  .btn-emergency{display:inline-flex;align-items:center;justify-content:center;gap:10px;background:var(--accent);color:${dna.color_dark_section};padding:18px 28px;border-radius:6px;font-weight:800;font-size:15px;transition:transform .2s}
  .btn-emergency:hover{transform:translateY(-2px) scale(1.02)}
  .btn-outline{display:inline-flex;align-items:center;justify-content:center;border:2px solid var(--primary);color:var(--primary);padding:16px 28px;border-radius:6px;font-weight:700;font-size:14px;text-transform:uppercase;letter-spacing:0.05em}
  .btn-outline:hover{background:color-mix(in srgb,var(--primary) 8%,transparent)}

  /* Trust bar (charcoal) */
  .trust-bar{background:var(--dark);color:#fff;padding:18px 0;border-top:1px solid ${dna.color_accent}40;border-bottom:1px solid ${dna.color_accent}40}
  .trust-bar .container{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-items:center}
  .trust-item{display:flex;align-items:center;gap:10px;justify-content:center;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em}
  .trust-item .stars{color:var(--accent);display:flex;gap:2px}
  .trust-item .material-symbols-outlined{color:var(--accent);font-size:22px}
  @media(max-width:768px){.trust-bar .container{grid-template-columns:1fr;text-align:center}}

  /* Section générique */
  section.main-section{padding:80px 0}
  @media(max-width:640px){section.main-section{padding:56px 0}}
  .section-head{text-align:center;margin-bottom:56px}
  .section-head h2{font-size:clamp(28px,4vw,36px);text-transform:uppercase;letter-spacing:0.02em;margin-bottom:14px}
  .section-bar{width:80px;height:4px;background:var(--primary);margin:0 auto 18px}
  .section-head p{color:var(--muted);font-size:16px;max-width:600px;margin:0 auto}

  /* Services grid */
  .services{background:var(--surface)}
  .services-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
  @media(max-width:900px){.services-grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:640px){.services-grid{grid-template-columns:1fr}}
  .service-card{background:var(--bg);padding:32px;border:1px solid color-mix(in srgb,var(--muted) 22%,transparent);position:relative}
  .service-card .material-symbols-outlined{font-size:40px;color:var(--primary);margin-bottom:18px}
  .service-card h3{font-size:20px;margin-bottom:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.01em}
  .service-card p{color:var(--muted);font-size:14.5px;line-height:1.6;margin-bottom:18px}
  .service-card .more{display:inline-flex;align-items:center;gap:6px;color:var(--primary);font-weight:700;font-size:13px;text-transform:uppercase;letter-spacing:0.05em}
  .service-cta-card{background:var(--primary);color:#fff;padding:32px;display:flex;flex-direction:column;justify-content:center;align-items:center;text-align:center;position:relative;overflow:hidden;border:none}
  .service-cta-card::before{content:'';position:absolute;top:8px;right:8px;width:120px;height:120px;background:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff' opacity='0.08'><path d='M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z'/></svg>") no-repeat;background-size:contain;opacity:0.15}
  .service-cta-card h3{color:#fff;font-size:22px;margin-bottom:10px}
  .service-cta-card p{color:#ffffffcc;margin-bottom:20px;font-size:14px}
  .service-cta-card .btn-pulse{background:var(--accent);color:${dna.color_dark_section};padding:14px 24px;border-radius:6px;font-weight:800;width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px}

  /* Pourquoi nous */
  .pourquoi{background:var(--bg)}
  .pourquoi-grid{display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:center}
  @media(max-width:900px){.pourquoi-grid{grid-template-columns:1fr;gap:40px}}
  .pourquoi-text h2{font-size:clamp(28px,4vw,38px);margin-bottom:32px;text-transform:uppercase;letter-spacing:0.01em}
  .pourquoi-text h2 .accent{color:var(--primary)}
  .pourquoi-feat{display:flex;gap:16px;margin-bottom:24px;align-items:flex-start}
  .pourquoi-feat-icon{flex-shrink:0;width:48px;height:48px;border-radius:50%;background:color-mix(in srgb,var(--primary) 18%,transparent);color:var(--primary);display:flex;align-items:center;justify-content:center}
  .pourquoi-feat h4{font-size:17px;font-weight:700;margin-bottom:6px;color:var(--text)}
  .pourquoi-feat p{color:var(--muted);font-size:14px;line-height:1.6}
  .pourquoi-img{position:relative;border:2px solid var(--primary);padding:24px;background:var(--surface)}
  .pourquoi-img img{width:100%;aspect-ratio:4/3;object-fit:cover}
  .pourquoi-stats{position:absolute;bottom:-24px;left:-24px;background:var(--accent);color:${dna.color_dark_section};padding:16px 24px;font-weight:800;font-size:14px;text-transform:uppercase;letter-spacing:0.08em}

  /* Testimonials */
  .testimonials{background:var(--surface)}
  .testimonials-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:24px}
  @media(max-width:768px){.testimonials-grid{grid-template-columns:1fr}}
  .testimonial-card{background:var(--bg);border:1px solid color-mix(in srgb,var(--muted) 22%,transparent);padding:28px}
  .testimonial-stars{color:var(--accent);display:flex;gap:2px;margin-bottom:12px}
  .testimonial-quote{font-size:15px;color:var(--text);line-height:1.65;margin-bottom:16px}
  .testimonial-author{font-size:12px;font-weight:700;color:var(--muted);letter-spacing:0.1em;text-transform:uppercase}

  /* CTA final */
  .cta-final{background:var(--dark);color:#fff;text-align:center;padding:80px 24px}
  .cta-final h2{color:#fff;font-size:clamp(28px,4vw,40px);margin-bottom:16px;text-transform:uppercase}
  .cta-final p{color:#ffffffcc;max-width:600px;margin:0 auto 32px;font-size:17px}
  .cta-final .btn-emergency{font-size:18px;padding:22px 36px}

  /* Footer */
  .site-footer{background:var(--dark);color:#ffffffaa;padding:48px 0 28px;border-top:1px solid ${dna.color_accent}30}
  .footer-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:40px}
  @media(max-width:768px){.footer-grid{grid-template-columns:1fr;gap:32px;text-align:center}}
  .footer-col h4{color:var(--accent);font-size:12px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:14px}
  .footer-col a, .footer-col p{display:block;font-size:14px;color:#ffffffaa;margin-bottom:8px;transition:color .2s}
  .footer-col a:hover{color:var(--accent)}
  .footer-brand{font-family:'${dna.font_heading}';color:var(--accent);font-size:20px;font-weight:800;margin-bottom:10px}
  .footer-bottom{border-top:1px solid #ffffff18;margin-top:32px;padding-top:20px;text-align:center;font-size:12px;color:#ffffff66}

  /* Reveal */
  .reveal{opacity:0;transform:translateY(20px);transition:all .8s cubic-bezier(0.16,1,0.3,1)}
  .reveal.in{opacity:1;transform:translateY(0)}
</style>
</head>
<body>

<header class="site-header">
  <div class="container">
    <div class="brand-logo">
      <span class="material-symbols-outlined" style="font-size:30px;color:var(--primary)">${escape(icons[0])}</span>
      <span class="brand-name">${escape(prospect.name)}</span>
    </div>
    <nav class="nav-links">
      <a href="#services">Services</a>
      <a href="#pourquoi">Pourquoi nous</a>
      <a href="#avis">Avis</a>
      <a href="#contact">Contact</a>
    </nav>
    ${phoneClean ? `<a href="tel:${phoneClean}" class="nav-tel">
      <span class="material-symbols-outlined" style="font-size:18px;font-variation-settings:'FILL' 1">phone_in_talk</span>
      <span class="phone-num">${escape(phoneDisplay)}</span>
    </a>` : ""}
  </div>
</header>

<main>

<section class="hero">
  <div class="hero-bg">
    <img src="${escape(heroPhoto)}" alt="${escape(prospect.name)}">
  </div>
  <div class="container">
    <div class="hero-content">
      <div class="hero-badge mono">
        <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">bolt</span>
        ${escape(copy.hero_caps || "DISPONIBLE 7J/7")}
      </div>
      <h1>${escape(copy.hero_title)} ${prospect.city ? `<br><span class="accent">à ${escape(prospect.city)}</span>` : ""}</h1>
      <p class="hero-sub">${escape(copy.hero_subtitle)}</p>
      <div class="hero-ctas">
        ${phoneClean ? `<a href="tel:${phoneClean}" class="btn-emergency emergency-pulse chamfer">
          <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">call</span>
          ${escape(copy.cta_primary)} : ${escape(phoneDisplay)}
        </a>` : ""}
        <a href="#services" class="btn-outline">${escape(copy.cta_secondary)}</a>
      </div>
    </div>
  </div>
</section>

<section class="trust-bar">
  <div class="container">
    <div class="trust-item">
      <div class="stars">${stars(prospect.google_rating)}</div>
      <span class="mono">${escape(ratingDisplay)} ${prospect.google_reviews_count ? `(${prospect.google_reviews_count} avis)` : ""}</span>
    </div>
    <div class="trust-item">
      <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">verified</span>
      <span class="mono">Entreprise Validée</span>
    </div>
    <div class="trust-item">
      <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">workspace_premium</span>
      <span class="mono">Assurance & Garantie</span>
    </div>
  </div>
</section>

<section id="services" class="main-section services reveal">
  <div class="container">
    <div class="section-head">
      <h2 class="wire-node">${escape(copy.savoir_faire_title || "Nos Services")}</h2>
      <div class="section-bar"></div>
      <p>${escape(copy.savoir_faire_subtitle)}</p>
    </div>
    <div class="services-grid">
      ${serviceCards.slice(0, 5).map((card, i) => `
        <div class="service-card hard-shadow">
          <span class="material-symbols-outlined">${escape(icons[i % icons.length])}</span>
          <h3>${escape(card.title)}</h3>
          <p>${escape(card.body)}</p>
          <a href="#contact" class="more">En savoir plus <span class="material-symbols-outlined" style="font-size:18px">chevron_right</span></a>
        </div>`).join("")}
      <div class="service-cta-card chamfer">
        <h3>${escape(copy.cta_final_title || "Urgence ? Appelez")}</h3>
        <p>${escape(copy.cta_final_paragraph || "Intervention en moins de 30 minutes.")}</p>
        ${phoneClean ? `<a href="tel:${phoneClean}" class="btn-pulse">
          <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">call</span>
          ${escape(phoneDisplay)}
        </a>` : ""}
      </div>
    </div>
  </div>
</section>

<section id="pourquoi" class="main-section pourquoi reveal">
  <div class="container">
    <div class="pourquoi-grid">
      <div class="pourquoi-text">
        <h2>${escape(copy.univers_title || "Pourquoi nous choisir")} ?</h2>
        ${[
          { icon: "price_check", title: "Tarifs transparents", text: copy.univers_paragraph1 },
          { icon: "schedule", title: "Intervention rapide", text: copy.univers_paragraph2 },
          { icon: "verified_user", title: "Garantie & expertise", text: `Plus de ${10 + Math.floor(Math.random() * 10)} ans d'expérience au service des habitants de ${prospect.city || "votre région"}. Travail garanti et conforme aux normes.` },
        ].map(f => `
          <div class="pourquoi-feat">
            <div class="pourquoi-feat-icon">
              <span class="material-symbols-outlined">${escape(f.icon)}</span>
            </div>
            <div>
              <h4>${escape(f.title)}</h4>
              <p>${escape(f.text)}</p>
            </div>
          </div>`).join("")}
      </div>
      <div class="pourquoi-img chamfer">
        <img src="${escape(trustPhoto)}" alt="${escape(prospect.name)} au travail">
        <div class="pourquoi-stats">${escape(copy.univers_badge || "15+ ans d'expérience")}</div>
      </div>
    </div>
  </div>
</section>

<section id="avis" class="main-section testimonials reveal">
  <div class="container">
    <div class="section-head">
      <h2>Ce qu'ils en disent</h2>
      <div class="section-bar"></div>
      <p>${escape(reviewsCountDisplay)}</p>
    </div>
    <div class="testimonials-grid">
      ${reviewsList.map(r => `
        <div class="testimonial-card hard-shadow">
          <div class="testimonial-stars">${stars(("rating" in r ? (r as any).rating : 5) as number)}</div>
          <p class="testimonial-quote">«&nbsp;${escape((r as any).text || (r as any).quote)}&nbsp;»</p>
          <div class="testimonial-author">— ${escape((r as any).author)}</div>
        </div>`).join("")}
    </div>
  </div>
</section>

<section id="contact" class="cta-final">
  <h2>${escape(copy.cta_final_title || "Besoin d'une intervention ?")}</h2>
  <p>${escape(copy.cta_final_paragraph)}</p>
  ${phoneClean ? `<a href="tel:${phoneClean}" class="btn-emergency emergency-pulse chamfer">
    <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1">call</span>
    ${escape(copy.cta_final_button)} : ${escape(phoneDisplay)}
  </a>` : ""}
  ${prospect.address ? `<p style="margin-top:32px;font-size:14px;color:#ffffffcc">${escape(prospect.address)}</p>` : ""}
</section>

</main>

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col">
        <div class="footer-brand">${escape(prospect.name)}</div>
        <p>${escape(copy.footer_tagline)}</p>
      </div>
      <div class="footer-col">
        <h4>Contact</h4>
        ${prospect.address ? `<a>${escape(prospect.address)}</a>` : ""}
        ${prospect.phone ? `<a href="tel:${phoneClean}">${escape(phoneDisplay)}</a>` : ""}
        ${prospect.email ? `<a href="mailto:${escape(prospect.email)}">${escape(prospect.email)}</a>` : ""}
        ${prospect.hours ? `<a>${escape(prospect.hours)}</a>` : ""}
      </div>
      <div class="footer-col">
        <h4>Zone d'intervention</h4>
        <p>${prospect.city ? `${escape(prospect.city)} et alentours.` : "Sur tout le département."}</p>
        <p style="margin-top:14px">
          <a href="#contact" style="color:var(--accent);font-weight:700">${escape(copy.cta_primary)} →</a>
        </p>
      </div>
    </div>
    <div class="footer-bottom">
      © ${new Date().getFullYear()} ${escape(prospect.name)}. ${prospect.city ? `${escape(prospect.city)}.` : ""} Tous droits réservés.
    </div>
  </div>
</footer>

<script>
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
</script>

</body>
</html>`;
}

// ═══════════════════════════════════════════════════════════════
// RENDERER 3 — Pattern "Haute Coiffure Narrative" (editorial_minimal)
// Pour: coiffure, esthétique/spa, fleuriste (luxe + minimaliste)
// Style: monochrome noir/blanc + accent or, sharp 0px, brutalist
// hard-shadow, magazine éditorial, big serif Playfair
// ═══════════════════════════════════════════════════════════════

function renderEditorialHtml(prospect: DnaProspect, dna: DesignDNA, copy: AICopy, dnaKey: string): string {
  const heroPhoto = photoFor(dnaKey, prospect, 0);
  const universPhoto = photoFor(dnaKey, prospect, 1);

  const fontParam = (name: string) => name.replace(/ /g, "+");
  const fontsLink = `https://fonts.googleapis.com/css2?family=${fontParam(dna.font_heading)}:wght@400;600;700&family=${fontParam(dna.font_body)}:wght@300;400;500;700&display=swap`;
  const iconsLink = `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap`;

  const phoneClean = (prospect.phone || "").replace(/\s/g, "");
  const phoneDisplay = prospect.phone || "";
  const icons = dna.icons.length >= 4 ? dna.icons : [...dna.icons, "star", "schedule", "place", "auto_awesome"];

  const ratingDisplay = prospect.google_rating ? `${prospect.google_rating.toFixed(1)}` : "5,0";

  const reviewsList = (prospect.reviews && prospect.reviews.length >= 3
    ? prospect.reviews.slice(0, 4)
    : copy.testimonials.map(t => ({ author: t.author, rating: 5, text: t.quote }))
  );

  const cssVars = `
    --bg: ${dna.color_bg};
    --surface: ${dna.color_surface};
    --primary: ${dna.color_primary};
    --accent: ${dna.color_accent};
    --text: ${dna.color_text};
    --muted: ${dna.color_muted};
    --dark: ${dna.color_dark_section};
  `;

  const signatureCss = dna.signature_css || `
    /* Editorial minimal — sharp 0px + brutalist shadow */
    .sharp { border-radius: 0 !important; }
    .brutal-shadow { box-shadow: 4px 4px 0 0 var(--primary); transition: all .25s; }
    .brutal-shadow:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 0 var(--primary); }
    .gold-divider { width: 60px; height: 1px; background: var(--accent); display: block; }
    .menu-row { display: flex; align-items: baseline; gap: 16px; padding: 18px 0; border-bottom: 1px solid color-mix(in srgb, var(--muted) 28%, transparent); }
    .menu-row .dots { flex: 1; border-bottom: 1px dotted color-mix(in srgb, var(--muted) 55%, transparent); transform: translateY(-4px); }
    .menu-row .menu-name { font-family: '${dna.font_heading}', serif; font-size: 19px; font-weight: 600; color: var(--primary); }
    .menu-row .menu-price { font-size: 14px; font-weight: 700; letter-spacing: 0.1em; color: var(--accent); text-transform: uppercase; }
  `;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escape(prospect.name)} — ${escape(dna.label_fr)} ${prospect.city ? `à ${escape(prospect.city)}` : ""}</title>
<meta name="description" content="${escape(copy.footer_tagline)}">
<link href="${fontsLink}" rel="stylesheet">
<link href="${iconsLink}" rel="stylesheet">
<style>
  :root{${cssVars}}
  *{margin:0;padding:0;box-sizing:border-box;border-radius:0}
  html{scroll-behavior:smooth}
  body{font-family:'${dna.font_body}',system-ui,sans-serif;background:var(--bg);color:var(--text);line-height:1.65;font-size:16px;-webkit-font-smoothing:antialiased}
  h1,h2,h3,h4{font-family:'${dna.font_heading}',Georgia,serif;font-weight:700;color:var(--primary);line-height:1.15;letter-spacing:-0.02em}
  img{max-width:100%;display:block}
  a{color:inherit;text-decoration:none}
  .material-symbols-outlined{font-variation-settings:'FILL' 0,'wght' 400,'GRAD' 0,'opsz' 24;vertical-align:middle}
  .label-caps{font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase}

  .container{max-width:1280px;margin:0 auto;padding:0 24px}
  @media(max-width:640px){.container{padding:0 18px}}

  ${signatureCss}

  /* Header — minimal magazine */
  .site-header{position:sticky;top:0;background:var(--bg);z-index:100;border-bottom:1px solid var(--primary)}
  .site-header .container{display:flex;align-items:center;justify-content:space-between;height:88px}
  .brand{font-family:'${dna.font_heading}',serif;font-weight:700;font-size:22px;color:var(--primary);letter-spacing:0.04em;text-transform:uppercase}
  .nav-links{display:flex;gap:32px;align-items:center}
  .nav-links a{font-size:11px;font-weight:700;color:var(--primary);text-transform:uppercase;letter-spacing:0.18em;transition:color .2s}
  .nav-links a:hover{color:var(--accent)}
  .nav-cta{background:var(--primary);color:#fff;padding:14px 24px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;transition:background .2s}
  .nav-cta:hover{background:var(--accent);color:var(--primary)}
  @media(max-width:900px){.nav-links{display:none}}

  /* Hero — editorial split big serif */
  .hero{padding:88px 0 100px;background:var(--bg)}
  .hero .container{display:grid;grid-template-columns:1.05fr 1fr;gap:80px;align-items:center}
  @media(max-width:900px){.hero .container{grid-template-columns:1fr;gap:48px}.hero{padding:60px 0}}
  .hero-text .label-caps{color:var(--accent);margin-bottom:24px;display:inline-block}
  .hero-title{font-size:clamp(48px,7vw,84px);font-weight:700;color:var(--primary);line-height:0.98;letter-spacing:-0.03em;margin-bottom:32px}
  .hero-sub{font-size:18px;color:var(--muted);max-width:480px;margin-bottom:40px;line-height:1.55}
  .hero-ctas{display:flex;gap:18px;flex-wrap:wrap}
  .btn-primary{background:var(--primary);color:#fff;padding:18px 32px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;transition:all .25s}
  .btn-primary:hover{background:var(--accent);color:var(--primary)}
  .btn-outline{background:transparent;color:var(--primary);border:1px solid var(--primary);padding:17px 32px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;transition:all .25s}
  .btn-outline:hover{border-color:var(--accent);color:var(--accent)}
  .hero-img{position:relative}
  .hero-img img{width:100%;aspect-ratio:3/4;object-fit:cover}
  .hero-img::after{content:'${escape(prospect.city || "")}'; position:absolute; top:-12px; right:-12px; background:var(--accent); color:var(--primary); padding:10px 18px; font-size:11px; font-weight:700; letter-spacing:0.18em; text-transform:uppercase}

  /* Universe — editorial */
  section{padding:120px 0}
  @media(max-width:640px){section{padding:64px 0}}
  .univers{background:var(--surface)}
  .univers-grid{display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
  @media(max-width:900px){.univers-grid{grid-template-columns:1fr;gap:48px}}
  .univers-text .label-caps{color:var(--accent);margin-bottom:18px;display:inline-block}
  .univers-text h2{font-size:clamp(34px,5vw,52px);margin-bottom:24px;line-height:1.1}
  .univers-text .gold-divider{margin:24px 0}
  .univers-text p{color:var(--muted);font-size:17px;margin-bottom:18px;line-height:1.7;max-width:480px}
  .univers-text .stats{display:flex;gap:48px;margin-top:48px;padding-top:32px;border-top:1px solid var(--primary)}
  .univers-text .stat-value{font-family:'${dna.font_heading}',serif;font-size:40px;font-weight:700;color:var(--primary);line-height:1}
  .univers-text .stat-label{font-size:10px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--muted);margin-top:8px}
  .univers-img img{width:100%;aspect-ratio:3/4;object-fit:cover}

  /* Services — menu-style list */
  .services{background:var(--bg)}
  .services-head{text-align:center;margin-bottom:72px}
  .services-head .label-caps{color:var(--accent);display:inline-block;margin-bottom:12px}
  .services-head h2{font-size:clamp(34px,5vw,56px);margin-bottom:20px}
  .services-head .gold-divider{margin:24px auto}
  .services-head p{color:var(--muted);max-width:540px;margin:0 auto;font-size:17px}
  .services-list{max-width:780px;margin:0 auto}

  /* Lookbook / Gallery editorial */
  .lookbook{background:var(--surface)}
  .lookbook-head{text-align:center;margin-bottom:64px}
  .lookbook-head .label-caps{color:var(--accent)}
  .lookbook-head h2{font-size:clamp(34px,5vw,56px);margin-top:8px}
  .lookbook-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
  @media(max-width:900px){.lookbook-grid{grid-template-columns:repeat(2,1fr)}}
  @media(max-width:640px){.lookbook-grid{grid-template-columns:1fr}}
  .lookbook-card{position:relative;overflow:hidden;cursor:pointer}
  .lookbook-card img{width:100%;aspect-ratio:3/4;object-fit:cover;transition:transform .8s}
  .lookbook-card:hover img{transform:scale(1.07)}
  .lookbook-card-label{position:absolute;bottom:0;left:0;right:0;background:var(--primary);color:#fff;padding:18px;font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase}

  /* Testimonials */
  .testimonials{background:var(--bg)}
  .testimonials-head{text-align:center;margin-bottom:64px}
  .testimonials-head h2{font-size:clamp(34px,5vw,52px)}
  .testimonials-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:32px;max-width:980px;margin:0 auto}
  @media(max-width:768px){.testimonials-grid{grid-template-columns:1fr}}
  .testimonial-card{padding:40px;border:1px solid var(--primary);background:var(--bg)}
  .testimonial-stars{color:var(--accent);display:flex;gap:2px;margin-bottom:18px}
  .testimonial-quote{font-family:'${dna.font_heading}',serif;font-size:18px;font-style:italic;color:var(--primary);line-height:1.55;margin-bottom:20px}
  .testimonial-author{font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:var(--muted)}

  /* CTA final — black block */
  .cta-final{background:var(--primary);color:#fff;text-align:center;padding:140px 24px}
  @media(max-width:640px){.cta-final{padding:80px 24px}}
  .cta-final .label-caps{color:var(--accent);margin-bottom:24px;display:inline-block}
  .cta-final h2{color:#fff;font-size:clamp(36px,6vw,64px);margin-bottom:24px;line-height:1.05}
  .cta-final p{color:#ffffffb3;max-width:580px;margin:0 auto 40px;font-size:18px}
  .cta-final .btn-gold{background:var(--accent);color:var(--primary);padding:22px 44px;font-size:12px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;display:inline-block;transition:transform .25s}
  .cta-final .btn-gold:hover{transform:scale(1.05)}

  /* Footer */
  .site-footer{background:var(--primary);color:#ffffff99;padding:60px 0 32px;border-top:1px solid var(--accent)}
  .footer-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:48px;margin-bottom:48px}
  @media(max-width:768px){.footer-grid{grid-template-columns:1fr;gap:32px;text-align:center}}
  .footer-col h4{color:var(--accent);font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;margin-bottom:16px}
  .footer-col p, .footer-col a{font-size:14px;color:#ffffff99;display:block;margin-bottom:8px}
  .footer-col a:hover{color:var(--accent)}
  .footer-brand{font-family:'${dna.font_heading}';color:#fff;font-size:24px;letter-spacing:0.04em;text-transform:uppercase;margin-bottom:12px}
  .footer-bottom{border-top:1px solid #ffffff22;padding-top:24px;text-align:center;font-size:11px;color:#ffffff66;letter-spacing:0.1em;text-transform:uppercase}

  .reveal{opacity:0;transform:translateY(28px);transition:all .9s cubic-bezier(0.16,1,0.3,1)}
  .reveal.in{opacity:1;transform:translateY(0)}
</style>
</head>
<body>

<header class="site-header">
  <div class="container">
    <div class="brand">${escape(prospect.name)}</div>
    <nav class="nav-links">
      <a href="#univers">Maison</a>
      <a href="#services">Services</a>
      <a href="#lookbook">Lookbook</a>
      <a href="#avis">Avis</a>
      <a href="#contact">Contact</a>
    </nav>
    <a href="#contact" class="nav-cta">${escape(copy.cta_primary)}</a>
  </div>
</header>

<main>

<section class="hero">
  <div class="container">
    <div class="hero-text">
      <span class="label-caps">${escape(copy.hero_caps)}</span>
      <h1 class="hero-title">${escape(copy.hero_title)}</h1>
      <p class="hero-sub">${escape(copy.hero_subtitle)}</p>
      <div class="hero-ctas">
        <a href="#contact" class="btn-primary">${escape(copy.cta_primary)}</a>
        <a href="#services" class="btn-outline">${escape(copy.cta_secondary)}</a>
      </div>
    </div>
    <div class="hero-img brutal-shadow">
      <img src="${escape(heroPhoto)}" alt="${escape(prospect.name)}">
    </div>
  </div>
</section>

<section id="univers" class="univers reveal">
  <div class="container">
    <div class="univers-grid">
      <div class="univers-img"><img src="${escape(universPhoto)}" alt="${escape(copy.univers_title)}"></div>
      <div class="univers-text">
        <span class="label-caps">La Maison</span>
        <h2>${escape(copy.univers_title)}</h2>
        <span class="gold-divider"></span>
        <p>${escape(copy.univers_paragraph1)}</p>
        <p>${escape(copy.univers_paragraph2)}</p>
        <div class="stats">
          <div>
            <div class="stat-value">${ratingDisplay}</div>
            <div class="stat-label">Note Google</div>
          </div>
          <div>
            <div class="stat-value">${prospect.google_reviews_count || "—"}</div>
            <div class="stat-label">Avis clients</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section id="services" class="services reveal">
  <div class="container">
    <div class="services-head">
      <span class="label-caps">Prestations</span>
      <h2>${escape(copy.savoir_faire_title)}</h2>
      <span class="gold-divider"></span>
      <p>${escape(copy.savoir_faire_subtitle)}</p>
    </div>
    <div class="services-list">
      ${copy.savoir_faire_cards.slice(0, 6).map((c, i) => `
        <div class="menu-row">
          <span class="menu-name">${escape(c.title)}</span>
          <span class="dots"></span>
          <span class="menu-price">${["Sur RDV", "Sur demande", "Détails en salon", "À partir de 45€", "Sur RDV", "Sur demande"][i] || "Sur RDV"}</span>
        </div>`).join("")}
    </div>
  </div>
</section>

<section id="lookbook" class="lookbook reveal">
  <div class="container">
    <div class="lookbook-head">
      <span class="label-caps">Inspirations</span>
      <h2>Lookbook</h2>
      <span class="gold-divider" style="margin:24px auto"></span>
    </div>
    <div class="lookbook-grid">
      ${[0,1,2,3,4,5].map(i => `
        <div class="lookbook-card brutal-shadow">
          <img src="${escape(photoFor(dnaKey, prospect, (i+2) % 6))}" alt="Inspiration ${i+1}">
          <div class="lookbook-card-label">${escape(["Signature","Saison","Couleur","Soin","Sur-mesure","Avant/Après"][i])}</div>
        </div>`).join("")}
    </div>
  </div>
</section>

<section id="avis" class="testimonials reveal">
  <div class="container">
    <div class="testimonials-head">
      <span class="label-caps">Témoignages</span>
      <h2>Ce qu'ils en disent</h2>
      <span class="gold-divider" style="margin:24px auto"></span>
    </div>
    <div class="testimonials-grid">
      ${reviewsList.map(r => `
        <div class="testimonial-card brutal-shadow">
          <div class="testimonial-stars">${stars(("rating" in r ? (r as any).rating : 5) as number)}</div>
          <p class="testimonial-quote">«&nbsp;${escape((r as any).text || (r as any).quote)}&nbsp;»</p>
          <div class="testimonial-author">${escape((r as any).author)}</div>
        </div>`).join("")}
    </div>
  </div>
</section>

<section id="contact" class="cta-final">
  <span class="label-caps">${escape(prospect.city ? prospect.city.toUpperCase() : "RENDEZ-VOUS")}</span>
  <h2>${escape(copy.cta_final_title)}</h2>
  <p>${escape(copy.cta_final_paragraph)}</p>
  <a href="${phoneClean ? `tel:${phoneClean}` : "#"}" class="btn-gold">${escape(copy.cta_final_button)}</a>
  ${prospect.address ? `<p style="margin-top:48px;font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff88">${escape(prospect.address)}</p>` : ""}
  ${prospect.phone ? `<p style="margin-top:8px;font-size:15px;color:var(--accent);font-weight:700;letter-spacing:0.1em">${escape(phoneDisplay)}</p>` : ""}
</section>

</main>

<footer class="site-footer">
  <div class="container">
    <div class="footer-grid">
      <div class="footer-col">
        <div class="footer-brand">${escape(prospect.name)}</div>
        <p>${escape(copy.footer_tagline)}</p>
      </div>
      <div class="footer-col">
        <h4>Informations</h4>
        ${prospect.address ? `<a>${escape(prospect.address)}</a>` : ""}
        ${prospect.hours ? `<a>${escape(prospect.hours)}</a>` : ""}
        ${prospect.phone ? `<a href="tel:${phoneClean}">${escape(phoneDisplay)}</a>` : ""}
        ${prospect.email ? `<a href="mailto:${escape(prospect.email)}">${escape(prospect.email)}</a>` : ""}
      </div>
      <div class="footer-col">
        <h4>${escape(prospect.city || "Salon")}</h4>
        <p>${prospect.city ? `Implantés à ${escape(prospect.city)}.` : "À votre service."}</p>
        <a href="#contact" style="color:var(--accent);font-weight:700;margin-top:12px">${escape(copy.cta_primary)} →</a>
      </div>
    </div>
    <div class="footer-bottom">
      © ${new Date().getFullYear()} ${escape(prospect.name)} — ${prospect.city ? escape(prospect.city) : "Tous droits réservés."}
    </div>
  </div>
</footer>

<script>
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
</script>

</body>
</html>`;
}

// ─── API publique ─────────────────────────────────────────────

const ARTISAN_DNAS = new Set([
  "electricite", "plomberie", "menuiserie_charpente", "garage_auto",
]);
const EDITORIAL_DNAS = new Set([
  "coiffure", "esthetique_spa", "fleuriste",
]);

export async function generatePremiumDnaMockup(prospect: DnaProspect): Promise<string | null> {
  const dna = await fetchDna(prospect.business_type);
  if (!dna) return null;
  const dnaKey = mapBusinessTypeToDna(prospect.business_type);
  const copy = await generateAiCopy(prospect, dna);

  // Sélection du template :
  // 1. dna.template_variant si défini explicitement en base
  // 2. Sinon, fallback intelligent par famille de DNA
  const variant = dna.template_variant
    || (ARTISAN_DNAS.has(dnaKey)   ? "industrial_artisan"
       : EDITORIAL_DNAS.has(dnaKey) ? "editorial_minimal"
       :                              "elegant_restaurant");

  if (variant === "industrial_artisan") return renderArtisanHtml(prospect, dna, copy, dnaKey);
  if (variant === "editorial_minimal")  return renderEditorialHtml(prospect, dna, copy, dnaKey);
  return renderHtml(prospect, dna, copy, dnaKey);
}

export { mapBusinessTypeToDna, fetchDna };
