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

// ─── API publique ─────────────────────────────────────────────

export async function generatePremiumDnaMockup(prospect: DnaProspect): Promise<string | null> {
  const dna = await fetchDna(prospect.business_type);
  if (!dna) return null;
  const dnaKey = mapBusinessTypeToDna(prospect.business_type);
  const copy = await generateAiCopy(prospect, dna);
  return renderHtml(prospect, dna, copy, dnaKey);
}

export { mapBusinessTypeToDna, fetchDna };
