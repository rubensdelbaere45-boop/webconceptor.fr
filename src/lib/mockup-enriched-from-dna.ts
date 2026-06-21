/**
 * Template enrichi qui s'adapte au contenu réellement scrapé du site
 * existant du prospect (WebsiteDna v2).
 *
 * Génère une maquette MEILLEURE que le site existant en :
 * 1. Réutilisant TOUS les vrais titres/services/photos/about du site
 * 2. Imposant un design moderne (Tailwind + EB Garamond + animations)
 * 3. Ajoutant des sections que le site existant n'a peut-être pas
 *    (témoignages Google si on en a, CTA sticky, prise de RDV)
 *
 * Activé automatiquement quand le DNA scrapé est profond
 * (allHeadings.length >= 10 OU detectedServices.length >= 5).
 */
import type { WebsiteDna } from "./scrape-prospect-site";
import { detectMetierForStock, getStockPhotosForMetier, getHeroPhotoForMetier } from "./stock-photos";
import { selectDesignPreset, type DesignPreset } from "./design-tokens-pro";
import { analyzeGarageFranchise } from "./franchise-detector";

export type EnrichedProspect = {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  hours?: string | null;
  business_type?: string | null;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  reviews?: Array<{ author?: string; rating?: number; text?: string; timeAgo?: string }> | null;
  site_style_dna?: WebsiteDna | null;
  /** Forcer un preset Design Pro (ex: "racing-sport"). Si absent, auto-detect par métier. */
  forceDesignPreset?: string;
};

const esc = (s: string | null | undefined): string =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Détermine si le DNA est suffisamment riche pour utiliser le template enrichi.
 * Pour les garages, on est plus permissif car ils DOIVENT avoir le template enriched
 * (sections véhicules + page /voitures + modals essai). */
export function isEnrichedDnaWorthIt(dna: WebsiteDna | null | undefined, businessType?: string | null): boolean {
  if (!dna || dna.error) return false;
  const headings = dna.allHeadings?.length || 0;
  const services = dna.detectedServices?.length || 0;
  const images = dna.allImages?.length || 0;
  const isGarage = /\b(garage|garagi|m[eé]canicien|carrosseri|concession|automobile|auto)\b/i.test((businessType || ""));
  if (isGarage) {
    // Pour garages, seuil minimal — TOUS les garages avec un DNA scrape doivent
    // avoir le template enriched (avec section véhicules + onglet Voitures)
    return headings >= 2 || images >= 1 || services >= 1;
  }
  return headings >= 8 || services >= 4 || (images >= 3 && headings >= 4);
}

export function generateEnrichedMockupHtml(p: EnrichedProspect): string {
  const dna = p.site_style_dna!;
  const name = esc(p.name);
  const slug = esc(p.slug);
  const city = esc(p.city || "");
  const phoneDisplay = esc(p.phone || dna.detectedPhones?.[0] || "");
  const phoneDigits = (p.phone || dna.detectedPhones?.[0] || "").replace(/[^\d+]/g, "");
  const allPhones = Array.from(new Set([p.phone, ...(dna.detectedPhones || [])].filter(Boolean))) as string[];
  const allEmails = Array.from(new Set([p.email, ...(dna.detectedEmails || [])].filter(Boolean))) as string[];
  const allAddresses = Array.from(new Set([p.address, ...(dna.detectedAddresses || [])].filter(Boolean))) as string[];

  // Detect métier pour fallback stock photos
  const metierForStock = detectMetierForStock(`${p.business_type || ""} ${name}`);
  const stockPhotos = getStockPhotosForMetier(metierForStock, 8);

  // ═══ DESIGN PRESET PRO (10 systems distillés du repo UI UX Pro Max) ═══
  // Sélection auto par métier OU forcée via forceDesignPreset
  const franchiseInfo = analyzeGarageFranchise(p.name);
  const designPreset: DesignPreset = (() => {
    if (p.forceDesignPreset) {
      const { PRESETS } = require("./design-tokens-pro") as { PRESETS: DesignPreset[] };
      const forced = PRESETS.find((x: DesignPreset) => x.id === p.forceDesignPreset);
      if (forced) return forced;
    }
    return selectDesignPreset(`${p.business_type || ""} ${name}`, {
      isFranchise: franchiseInfo.isFranchise && franchiseInfo.confidence > 0.7,
    });
  })();

  // Détection SaaS : si le DNA vient d'une plateforme SaaS (Vroomly,
  // Autoscout, Autosphere, etc.), on ignore les couleurs scrapées car
  // elles reflètent la palette du SaaS, pas du garage. On utilise alors
  // le preset Pro adapté au métier.
  const dnaSrc = (dna.sourceUrl || "").toLowerCase();
  const dnaLogo = (dna.logoUrl || "").toLowerCase();
  const isFromSaas = /vroomly|autoscout|autosphere|lacentrale|leboncoin|paruvendu|facebook|instagram|wordpress\.com/.test(dnaSrc + " " + dnaLogo);

  // Couleurs : priorité DNA scrapé (si pas SaaS) > Design Preset Pro > fallback noir
  const primary = ((!isFromSaas && dna.primaryColor && dna.primaryColor.match(/^#[0-9a-f]{6}$/i))
    ? dna.primaryColor
    : designPreset.colors.primary).toLowerCase();
  const accent = ((!isFromSaas && dna.accentColor && dna.accentColor.match(/^#[0-9a-f]{6}$/i))
    ? dna.accentColor
    : designPreset.colors.accent).toLowerCase();

  // Hero : vraie image OU fallback stock Unsplash métier
  // (filtre encore les images < 300px implicite via heuristique URL)
  const isLowQualityImage = (url: string): boolean => {
    if (!url) return true;
    // Skip si URL contient des indices de basse qualité
    if (/favicon|cropped-|thumb|-50x50|-100x100|-150x150|-180x180|-200x200/i.test(url)) return true;
    // Force la skip d'extensions douteuses
    if (/\.(ico|gif|svg)(\?|$)/i.test(url)) return true;
    return false;
  };
  const cleanScrapedImages = (dna.allImages || []).filter(img => !isLowQualityImage(img));
  const heroImage = (dna.heroImageUrl && !isLowQualityImage(dna.heroImageUrl))
    ? dna.heroImageUrl
    : (cleanScrapedImages[0] || getHeroPhotoForMetier(metierForStock));
  const heroTitle = esc(dna.heroTitle || name);
  const heroSubtitle = esc(dna.heroSubtitle || `Votre partenaire ${p.business_type || ""}${city ? " à " + city : ""}`);

  // About : vraie copy du site OU fallback
  const aboutTitle = esc(dna.allHeadings?.find(h => /qui sommes|à propos|notre histoire|notre groupe/i.test(h)) || "Qui sommes-nous");
  const aboutText = esc(dna.aboutText || `${name}, votre référence ${p.business_type || ""}${city ? " à " + city : ""}. Une équipe passionnée à votre service.`);

  // Services : vrais services scrapés du site (jusqu'à 8)
  const services = (dna.detectedServices || []).slice(0, 8);

  // Actualités : si hasBlog, prendre headings qui ressemblent à des titres d'articles
  const articles = (dna.allHeadings || [])
    .filter(h => !services.some(s => s.title === h))
    .filter(h => !/qui sommes|à propos|formulaire|menu|suivez|contact|trouver/i.test(h))
    .slice(0, 4);

  // Photos galerie : priorité images scrapées propres, sinon fallback stock par métier
  const galleryImages = (() => {
    const scraped = cleanScrapedImages.slice(1, 7);
    if (scraped.length >= 3) return scraped;
    // Pas assez de photos propres scrapées → use stock photos métier
    return stockPhotos.slice(0, 6);
  })();

  // Véhicules détectés (uniquement garages/concessions)
  const isGarage = /\b(garage|garagi|m[eé]canicien|carrosseri|concession|automobile|auto)\b/i.test((p.business_type || "") + " " + name);
  // On ne garde QUE les véhicules avec une vraie image (sinon le placeholder gris est dégueu)
  const detectedVehicles = (dna.detectedVehicles || [])
    .filter(v => v.image && v.image.startsWith("http"))
    .slice(0, 12);
  // Section affichée uniquement si garage ET vrais véhicules avec photos
  const showVehiclesSection = isGarage && detectedVehicles.length > 0;
  const vehiclesToShow = detectedVehicles;

  // Top 3 avis Google
  const topReviews = (p.reviews || []).filter(r => r.text && (r.text || "").length > 30).slice(0, 3);

  // Horaires parsés
  const hoursLines = (p.hours || "").split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex,noarchive" />
<title>${name}${city ? ` — ${city}` : ""}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
<link href="${designPreset.fonts.importUrl}" rel="stylesheet" />
<link href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined" rel="stylesheet" />
<script src="https://cdn.tailwindcss.com"></script>
<style>
  :root { --primary: ${primary}; --accent: ${accent}; }
  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background: linear-gradient(180deg, #fafaf9 0%, #f4f4f5 100%);
    color: #1a1a1a;
  }
  .font-serif { font-family: 'EB Garamond', serif; }
  .text-primary { color: var(--primary); }
  .bg-primary { background: var(--primary); }
  .border-primary { border-color: var(--primary); }
  .text-accent { color: var(--accent); }
  .bg-accent { background: var(--accent); }
  .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }

  /* Fonds adaptatifs teintés primary (subtle) */
  .bg-tint-light  { background: linear-gradient(180deg, #ffffff 0%, ${primary}06 100%); }
  .bg-tint-medium { background: linear-gradient(135deg, #f8f8f7 0%, ${primary}0d 50%, #f8f8f7 100%); }
  .bg-tint-cream  { background: linear-gradient(180deg, #fafaf9 0%, #f4f4f5 100%); }

  /* Gradient mesh hero (Apple/Stripe style) */
  .hero-mesh {
    position: relative;
    background:
      radial-gradient(ellipse at top left, ${primary}1a 0%, transparent 50%),
      radial-gradient(ellipse at bottom right, ${accent}26 0%, transparent 50%),
      radial-gradient(ellipse at center, ${primary}0d 0%, transparent 70%),
      linear-gradient(180deg, #fafaf9 0%, #f4f4f5 100%);
  }
  .hero-mesh::before {
    content: ''; position: absolute; inset: 0;
    background-image:
      radial-gradient(circle at 1px 1px, ${primary}10 1px, transparent 0);
    background-size: 32px 32px;
    pointer-events: none;
  }

  /* Spotlight effect (21st.dev) */
  .spotlight-hero { position: relative; overflow: hidden; }
  .spotlight-hero::after {
    content: ''; position: absolute; inset: -50%;
    background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${primary}33 0%, transparent 40%);
    pointer-events: none; opacity: 0; transition: opacity 0.4s;
  }
  .spotlight-hero:hover::after { opacity: 1; }

  /* Border beam animé (aceternity) */
  @keyframes border-beam {
    0% { background-position: 0% 0%; }
    100% { background-position: 200% 0%; }
  }
  .border-beam {
    background: linear-gradient(90deg, transparent, ${primary}, ${accent}, transparent);
    background-size: 200% 100%;
    animation: border-beam 3s linear infinite;
  }

  /* Marquee infinite (21st.dev) */
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  .marquee { display: flex; animation: marquee 30s linear infinite; }
  .marquee:hover { animation-play-state: paused; }

  /* Hover lift (Linear/Vercel style) */
  .hover-lift { transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s; }
  .hover-lift:hover { transform: translateY(-6px); box-shadow: 0 24px 48px -12px ${primary}40; }

  /* Glassmorphism (Apple style) */
  .glass {
    background: rgba(255, 255, 255, 0.7);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.5);
  }
  .glass-dark {
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(20px) saturate(180%);
    -webkit-backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  /* Gradient text (Linear style) */
  .gradient-text {
    background: linear-gradient(135deg, ${primary}, ${accent});
    -webkit-background-clip: text; background-clip: text; color: transparent;
    -webkit-text-fill-color: transparent;
  }

  /* Floating decoration */
  .float-deco-1 {
    position: absolute; width: 300px; height: 300px;
    background: radial-gradient(circle, ${primary}26 0%, transparent 70%);
    border-radius: 50%; filter: blur(40px);
    pointer-events: none; z-index: 0;
  }
  .float-deco-2 {
    position: absolute; width: 400px; height: 400px;
    background: radial-gradient(circle, ${accent}1a 0%, transparent 70%);
    border-radius: 50%; filter: blur(60px);
    pointer-events: none; z-index: 0;
  }

  /* Animation au scroll */
  @keyframes fade-up {
    from { opacity: 0; transform: translateY(30px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .fade-up { animation: fade-up 0.8s cubic-bezier(0.4, 0, 0.2, 1) both; }
  .fade-up-delay-1 { animation-delay: 0.1s; }
  .fade-up-delay-2 { animation-delay: 0.2s; }
  .fade-up-delay-3 { animation-delay: 0.3s; }

  /* Stat number animée */
  @keyframes count-up {
    from { opacity: 0; transform: scale(0.8); }
    to   { opacity: 1; transform: scale(1); }
  }
  .stat-num { animation: count-up 1s cubic-bezier(0.4, 0, 0.2, 1) both; }

  /* Section reveal on scroll (CSS only via :target) */
  section { scroll-margin-top: 80px; }
</style>
</head>
<body class="antialiased">

<!-- Nav glass sticky sous sales-ui-bar (54px) -->
<header class="sticky top-[54px] z-40 glass border-b border-white/40">
  <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <a href="#" class="flex items-center gap-3">
      ${dna.logoUrl ? `<img src="${esc(dna.logoUrl)}" alt="${name}" class="h-10 w-auto" />` : ""}
      <span class="font-serif text-2xl font-bold text-primary">${name}</span>
    </a>
    <nav class="hidden md:flex items-center gap-8">
      <a href="#apropos" class="text-sm font-medium hover:text-primary transition">À propos</a>
      <a href="#services" class="text-sm font-medium hover:text-primary transition">Services</a>
      ${isGarage ? `<a href="/prospects/${slug}/voitures" class="text-sm font-bold hover:text-primary transition flex items-center gap-1" style="color: ${primary};"><span class="material-symbols-outlined text-base">directions_car</span>Voitures</a>` : ""}
      ${articles.length ? '<a href="#actualites" class="text-sm font-medium hover:text-primary transition">Actualités</a>' : ""}
      <a href="#contact" class="text-sm font-medium hover:text-primary transition">Contact</a>
      ${phoneDigits ? `<a href="tel:${phoneDigits}" class="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition flex items-center gap-2 shadow-lg" style="box-shadow: 0 4px 16px ${primary}40"><span class="material-symbols-outlined text-base">call</span>${phoneDisplay}</a>` : ""}
    </nav>
  </div>
</header>

<main>
<!-- HERO avec gradient mesh + spotlight + decorations flottantes -->
<section class="hero-mesh spotlight-hero relative overflow-hidden" onmousemove="this.style.setProperty('--mouse-x', (event.offsetX/this.offsetWidth*100)+'%'); this.style.setProperty('--mouse-y', (event.offsetY/this.offsetHeight*100)+'%');">
  <div class="float-deco-1" style="top: -100px; left: -100px;"></div>
  <div class="float-deco-2" style="bottom: -150px; right: -150px;"></div>

  <div class="max-w-7xl mx-auto px-6 py-24 lg:py-32 grid lg:grid-cols-2 gap-12 items-center relative z-10">
    <div class="fade-up">
      <span class="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-6 text-xs font-bold uppercase tracking-widest text-primary">
        <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">verified</span>
        ${esc(p.business_type || "Professionnel")}${city ? " · " + city : ""}
      </span>
      <h1 class="font-serif text-5xl lg:text-7xl leading-tight mb-6">
        <span class="gradient-text">${heroTitle}</span>
      </h1>
      <p class="text-xl text-neutral-700 leading-relaxed mb-8 max-w-xl fade-up fade-up-delay-1">${heroSubtitle}</p>
      <div class="flex flex-wrap gap-3 fade-up fade-up-delay-2">
        <button type="button" onclick="openKlyoraModal('rdv')" class="bg-primary text-white px-8 py-4 rounded-full font-bold hover:opacity-90 transition inline-flex items-center gap-2 hover-lift" style="box-shadow: 0 10px 30px ${primary}55"><span class="material-symbols-outlined">event</span>Prendre rendez-vous</button>
        <button type="button" onclick="openKlyoraModal('devis')" class="glass border-2 border-primary text-primary px-8 py-4 rounded-full font-bold hover:bg-primary hover:text-white transition inline-flex items-center gap-2"><span class="material-symbols-outlined">request_quote</span>Demander un devis</button>
        ${phoneDigits ? `<a href="tel:${phoneDigits}" class="text-primary px-6 py-4 font-bold hover:underline transition inline-flex items-center gap-2"><span class="material-symbols-outlined">call</span>${phoneDisplay}</a>` : ""}
      </div>
      ${p.google_rating && p.google_reviews_count ? `<div class="mt-8 flex items-center gap-3 fade-up fade-up-delay-3"><div class="flex">${Array(Math.round(p.google_rating)).fill('<span class="material-symbols-outlined text-accent" style="font-variation-settings: \'FILL\' 1;">star</span>').join("")}</div><span class="text-sm text-neutral-700"><strong>${p.google_rating.toFixed(1)}/5</strong> · ${p.google_reviews_count} avis Google</span></div>` : ""}
    </div>
    ${heroImage ? `<div class="relative fade-up fade-up-delay-2">
      <div class="aspect-square rounded-3xl overflow-hidden shadow-2xl hover-lift" style="box-shadow: 0 30px 60px -15px ${primary}40">
        <img src="${esc(heroImage)}" alt="${name}" class="w-full h-full object-cover" />
      </div>
      <div class="absolute -bottom-6 -left-6 glass p-6 rounded-2xl shadow-xl max-w-xs">
        <div class="text-xs uppercase tracking-widest text-primary mb-1 font-bold">Le saviez-vous ?</div>
        <div class="font-serif text-xl">${esc(name.split(/[\s,—-]/)[0] || name)} ${city ? "à " + city : ""}</div>
        ${dna.detectedAddresses && dna.detectedAddresses.length > 1 ? `<div class="text-xs text-neutral-600 mt-2"><strong class="text-primary">${dna.detectedAddresses.length}</strong> points de vente</div>` : ""}
      </div>
      <div class="absolute -top-4 -right-4 stat-num glass px-4 py-3 rounded-2xl">
        <div class="text-2xl font-bold gradient-text">${p.google_rating ? p.google_rating.toFixed(1) : "5.0"}<span class="text-sm text-neutral-500">/5</span></div>
        <div class="text-xs text-neutral-600">Google ${p.google_reviews_count ? `(${p.google_reviews_count})` : ""}</div>
      </div>
    </div>` : ""}
  </div>
</section>

<!-- Bandeau stats compact (parsed du DNA) -->
${(dna.detectedAddresses?.length || dna.detectedPhones?.length || dna.allHeadings?.length) ? `
<section class="py-12 bg-tint-light border-y border-neutral-200">
  <div class="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    ${dna.detectedAddresses && dna.detectedAddresses.length > 0 ? `<div class="fade-up"><div class="text-4xl font-bold gradient-text mb-1">${dna.detectedAddresses.length}</div><div class="text-xs uppercase tracking-widest text-neutral-600">${dna.detectedAddresses.length > 1 ? "Points de vente" : "Adresse"}</div></div>` : ""}
    ${dna.detectedPhones && dna.detectedPhones.length > 0 ? `<div class="fade-up fade-up-delay-1"><div class="text-4xl font-bold gradient-text mb-1">${dna.detectedPhones.length}</div><div class="text-xs uppercase tracking-widest text-neutral-600">Numéros directs</div></div>` : ""}
    ${services.length > 0 ? `<div class="fade-up fade-up-delay-2"><div class="text-4xl font-bold gradient-text mb-1">${services.length}+</div><div class="text-xs uppercase tracking-widest text-neutral-600">Services</div></div>` : ""}
    ${p.google_reviews_count ? `<div class="fade-up fade-up-delay-3"><div class="text-4xl font-bold gradient-text mb-1">${p.google_reviews_count}</div><div class="text-xs uppercase tracking-widest text-neutral-600">Avis clients</div></div>` : ""}
  </div>
</section>` : ""}

<!-- ABOUT avec fond tinted + decorations -->
<section id="apropos" class="py-24 bg-tint-cream relative overflow-hidden">
  <div class="float-deco-1" style="top: 20%; right: -150px;"></div>
  <div class="max-w-5xl mx-auto px-6 text-center relative z-10">
    <span class="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Notre histoire</span>
    <h2 class="font-serif text-4xl lg:text-5xl mb-8 gradient-text">${aboutTitle}</h2>
    <p class="text-xl leading-relaxed text-neutral-700">${aboutText}</p>
  </div>
</section>

${services.length ? `
<!-- SERVICES avec fond tinted medium + cards glass -->
<section id="services" class="py-24 bg-tint-medium relative overflow-hidden">
  <div class="float-deco-2" style="top: -200px; left: 30%;"></div>
  <div class="max-w-7xl mx-auto px-6 relative z-10">
    <div class="text-center mb-16">
      <span class="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Ce que nous proposons</span>
      <h2 class="font-serif text-4xl lg:text-5xl">Nos <span class="gradient-text">services</span></h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-${Math.min(services.length, 4)} gap-6">
      ${services.map((s, i) => `
        <div class="glass rounded-2xl p-8 hover-lift relative overflow-hidden fade-up fade-up-delay-${Math.min(i, 3)}">
          <div class="absolute top-0 left-0 right-0 h-1 border-beam"></div>
          ${s.image ? `<div class="aspect-video rounded-lg overflow-hidden mb-5"><img src="${esc(s.image)}" alt="${esc(s.title)}" class="w-full h-full object-cover" /></div>` : `<div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-5" style="background: linear-gradient(135deg, ${primary}, ${accent});"><span class="font-bold text-white text-xl">${i + 1}</span></div>`}
          <h3 class="font-serif text-xl mb-3">${esc(s.title)}</h3>
          ${s.desc ? `<p class="text-sm text-neutral-700 leading-relaxed">${esc(s.desc)}</p>` : ""}
        </div>`).join("")}
    </div>
  </div>
</section>` : ""}

${articles.length ? `
<!-- ACTUALITES avec fond tinted light + cards modernes -->
<section id="actualites" class="py-24 bg-tint-light">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Restez informés</span>
      <h2 class="font-serif text-4xl lg:text-5xl">Nos dernières <span class="gradient-text">actualités</span></h2>
    </div>
    <div class="grid md:grid-cols-${Math.min(articles.length, 4)} gap-6">
      ${articles.map((a, i) => `
        <article class="bg-white rounded-2xl overflow-hidden hover-lift shadow-sm border border-neutral-100 fade-up fade-up-delay-${Math.min(i, 3)}">
          ${galleryImages[i] ? `<div class="aspect-video overflow-hidden"><img src="${esc(galleryImages[i])}" alt="${esc(a)}" class="w-full h-full object-cover hover:scale-105 transition duration-500" /></div>` : `<div class="aspect-video" style="background: linear-gradient(135deg, ${primary}, ${accent});"></div>`}
          <div class="p-6">
            <span class="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-primary mb-2"><span class="w-1.5 h-1.5 rounded-full bg-primary"></span>Actualité</span>
            <h3 class="font-serif text-lg leading-snug">${esc(a)}</h3>
          </div>
        </article>`).join("")}
    </div>
  </div>
</section>` : ""}

${showVehiclesSection && vehiclesToShow.length > 0 ? `
<!-- VÉHICULES DISPONIBLES (garages avec vraies photos détectées) -->
<section id="vehicules" class="py-24 bg-tint-medium relative overflow-hidden">
  <div class="float-deco-1" style="top: 20%; right: -150px;"></div>
  <div class="max-w-7xl mx-auto px-6 relative z-10">
    <div class="text-center mb-16">
      <span class="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Nos stocks${city ? ` à ${city}` : ""}</span>
      <h2 class="font-serif text-4xl lg:text-5xl mb-4">Nos véhicules <span class="gradient-text">disponibles</span></h2>
      <p class="text-neutral-600 max-w-xl mx-auto">${vehiclesToShow.length} véhicule${vehiclesToShow.length > 1 ? "s" : ""} en stock — réservez votre essai en 1 clic</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      ${vehiclesToShow.map((v, i) => `
        <div class="bg-white rounded-2xl overflow-hidden hover-lift shadow-lg border border-neutral-100 fade-up fade-up-delay-${Math.min(i % 4, 3)} relative group">
          <div class="aspect-[4/3] overflow-hidden bg-neutral-100">
            <img src="${esc(v.image!)}" alt="${esc(v.title)}" class="w-full h-full object-cover group-hover:scale-110 transition duration-700" loading="lazy" />
          </div>
          ${v.price ? `<div class="absolute top-3 right-3 bg-white px-3 py-1.5 rounded-full text-sm font-bold shadow-md" style="color: ${primary}">${esc(v.price)}</div>` : ""}
          <div class="p-5">
            <h3 class="font-serif text-lg leading-tight mb-3 line-clamp-2 min-h-[3rem]">${esc(v.title)}</h3>
            <div class="flex flex-wrap gap-2 mb-4 text-xs">
              ${v.year ? `<span class="inline-flex items-center gap-1 bg-neutral-100 px-2.5 py-1 rounded-full"><span class="material-symbols-outlined text-sm">event</span>${esc(v.year)}</span>` : ""}
              ${v.km ? `<span class="inline-flex items-center gap-1 bg-neutral-100 px-2.5 py-1 rounded-full"><span class="material-symbols-outlined text-sm">speed</span>${esc(v.km)}</span>` : ""}
              ${v.fuel ? `<span class="inline-flex items-center gap-1 bg-neutral-100 px-2.5 py-1 rounded-full"><span class="material-symbols-outlined text-sm">local_gas_station</span>${esc(v.fuel)}</span>` : ""}
            </div>
            <div class="flex gap-2">
              <button type="button" onclick="openKlyoraModal('essai', ${JSON.stringify(v.title).replace(/"/g, "&quot;")})" class="flex-1 bg-primary text-white py-2.5 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2 text-sm" style="box-shadow: 0 4px 14px ${primary}40">
                <span class="material-symbols-outlined text-base">car_rental</span>Essai
              </button>
              ${v.url ? `<a href="${esc(v.url)}" target="_blank" rel="noopener" class="bg-neutral-100 text-neutral-700 px-3 py-2.5 rounded-xl font-bold hover:bg-neutral-200 transition flex items-center justify-center" title="Voir la fiche"><span class="material-symbols-outlined text-base">open_in_new</span></a>` : ""}
            </div>
          </div>
        </div>`).join("")}
    </div>
    <div class="text-center mt-12">
      <a href="/prospects/${slug}/voitures" class="bg-primary text-white px-8 py-4 rounded-full font-bold hover:opacity-90 transition inline-flex items-center gap-3 hover-lift" style="box-shadow: 0 10px 30px ${primary}55">
        <span class="material-symbols-outlined">directions_car</span>Voir tout le catalogue (${vehiclesToShow.length})
        <span class="material-symbols-outlined">arrow_forward</span>
      </a>
    </div>
  </div>
</section>` : ""}

${isGarage && vehiclesToShow.length === 0 ? `
<!-- Garage SANS véhicules détectés : CTA fort vers la page catalogue -->
<section id="vehicules" class="py-24 bg-tint-medium relative overflow-hidden">
  <div class="float-deco-1" style="top: 20%; right: -150px;"></div>
  <div class="max-w-3xl mx-auto px-6 relative z-10 text-center">
    <span class="material-symbols-outlined text-6xl text-primary opacity-40 mb-4 block">directions_car</span>
    <span class="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Votre catalogue, en ligne</span>
    <h2 class="font-serif text-4xl lg:text-5xl mb-6">Vos véhicules <span class="gradient-text">vendus en ligne</span></h2>
    <p class="text-lg text-neutral-700 leading-relaxed mb-8">
      Ce site est prêt à recevoir <strong>tout votre catalogue de véhicules</strong> : photos, prix, kilométrage, fiches techniques avec filtres marque/prix/km/carburant. Les visiteurs réservent leur essai en 1 clic — vous recevez la demande par SMS et email.
    </p>
    <a href="/prospects/${slug}/voitures" class="bg-primary text-white px-8 py-4 rounded-full font-bold hover:opacity-90 transition inline-flex items-center gap-2 hover-lift" style="box-shadow: 0 10px 30px ${primary}55">
      <span class="material-symbols-outlined">storefront</span>Voir le catalogue
      <span class="material-symbols-outlined">arrow_forward</span>
    </a>
  </div>
</section>` : ""}

${galleryImages.length >= 3 ? `
<!-- GALERIE photos avec fond cream (images scrapées propres OU stock métier) -->
<section class="py-24 bg-tint-cream">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">En images</span>
      <h2 class="font-serif text-4xl lg:text-5xl gradient-text">${name}</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${Math.min(galleryImages.length, 4)} gap-4">
      ${galleryImages.slice(0, 8).map((img, i) => `<div class="aspect-square rounded-2xl overflow-hidden hover-lift fade-up fade-up-delay-${Math.min(i % 4, 3)} shadow-md"><img src="${esc(img)}" alt="" class="w-full h-full object-cover hover:scale-110 transition duration-700" /></div>`).join("")}
    </div>
  </div>
</section>` : ""}

${topReviews.length ? `
<!-- TÉMOIGNAGES Google (marquee défilant) avec fond tinted -->
<section class="py-24 bg-tint-medium overflow-hidden relative">
  <div class="float-deco-1" style="bottom: -100px; right: 10%;"></div>
  <div class="text-center mb-12 px-6 relative z-10">
    <span class="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Ce qu'ils en disent</span>
    <h2 class="font-serif text-4xl lg:text-5xl">Nos clients <span class="gradient-text">adorent</span></h2>
    ${p.google_rating && p.google_reviews_count ? `<div class="mt-4 flex items-center justify-center gap-3"><div class="flex">${Array(Math.round(p.google_rating)).fill('<span class="material-symbols-outlined text-accent" style="font-variation-settings: \'FILL\' 1;">star</span>').join("")}</div><span class="text-sm"><strong>${p.google_rating.toFixed(1)}/5</strong> · ${p.google_reviews_count} avis Google</span></div>` : ""}
  </div>
  <div class="marquee relative z-10">
    ${[...topReviews, ...topReviews].map(r => `
      <div class="flex-shrink-0 w-80 mx-3 glass p-6 rounded-2xl">
        <div class="flex mb-3">${Array(Math.round(r.rating || 5)).fill('<span class="material-symbols-outlined text-accent" style="font-variation-settings: \'FILL\' 1; font-size: 18px;">star</span>').join("")}</div>
        <p class="text-sm italic text-neutral-800 leading-relaxed mb-4">«&nbsp;${esc((r.text || "").slice(0, 240))}&nbsp;»</p>
        <div class="font-bold text-sm text-primary">— ${esc(r.author || "Client")}</div>
      </div>`).join("")}
  </div>
</section>` : ""}

<!-- CONTACT (multi-adresses + multi-téléphones) -->
<section id="contact" class="py-24 bg-primary text-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-xs font-bold uppercase tracking-widest text-accent mb-3 block">Parlons</span>
      <h2 class="font-serif text-4xl lg:text-5xl">Contactez ${name}</h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-${Math.min(2 + (allAddresses.length > 0 ? 1 : 0) + (hoursLines.length > 0 ? 1 : 0), 4)} gap-6">
      ${allPhones.length ? `<div class="bg-white/10 backdrop-blur border border-white/20 p-8 rounded-2xl">
        <span class="material-symbols-outlined text-accent text-3xl mb-4 block">call</span>
        <h3 class="font-serif text-xl mb-3">Téléphone</h3>
        ${allPhones.map(ph => `<a href="tel:${ph.replace(/[^\d+]/g,'')}" class="block text-white/90 hover:text-white font-bold mb-1">${esc(ph)}</a>`).join("")}
      </div>` : ""}
      ${allEmails.length ? `<div class="bg-white/10 backdrop-blur border border-white/20 p-8 rounded-2xl">
        <span class="material-symbols-outlined text-accent text-3xl mb-4 block">mail</span>
        <h3 class="font-serif text-xl mb-3">Email</h3>
        ${allEmails.map(e => `<a href="mailto:${e}" class="block text-white/90 hover:text-white break-all text-sm mb-1">${esc(e)}</a>`).join("")}
      </div>` : ""}
      ${allAddresses.length ? `<div class="bg-white/10 backdrop-blur border border-white/20 p-8 rounded-2xl">
        <span class="material-symbols-outlined text-accent text-3xl mb-4 block">location_on</span>
        <h3 class="font-serif text-xl mb-3">${allAddresses.length > 1 ? "Nos adresses" : "Adresse"}</h3>
        ${allAddresses.map(a => `<p class="text-sm text-white/90 mb-2">${esc(a)}</p>`).join("")}
      </div>` : ""}
      ${hoursLines.length ? `<div class="bg-white/10 backdrop-blur border border-white/20 p-8 rounded-2xl">
        <span class="material-symbols-outlined text-accent text-3xl mb-4 block">schedule</span>
        <h3 class="font-serif text-xl mb-3">Horaires</h3>
        ${hoursLines.map(line => {
          const m = line.match(/^([^:]+):\s*(.+)$/);
          if (!m) return `<p class="text-xs text-white/80">${esc(line)}</p>`;
          return `<p class="text-xs text-white/80"><span class="capitalize font-bold">${esc(m[1].trim())}:</span> ${esc(m[2].trim())}</p>`;
        }).join("")}
      </div>` : ""}
    </div>
  </div>
</section>

</main>

<footer class="bg-neutral-900 text-white py-12">
  <div class="max-w-7xl mx-auto px-6 text-center">
    <div class="font-serif text-2xl mb-3">${name}</div>
    <p class="text-sm text-white/60 mb-6">${city ? city + " · " : ""}${esc(p.business_type || "")}</p>
    ${dna.socialLinks?.length ? `<div class="flex justify-center gap-4 mb-6">${dna.socialLinks.map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener" class="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center"><span class="material-symbols-outlined text-sm">${s.network === 'facebook' ? 'thumb_up' : s.network === 'instagram' ? 'photo_camera' : 'link'}</span></a>`).join("")}</div>` : ""}
    <p class="text-xs text-white/40">© ${new Date().getFullYear()} ${name}. Tous droits réservés.</p>
  </div>
</footer>

<!-- Sticky CTA tel (mobile) -->
${phoneDigits ? `<a href="tel:${phoneDigits}" class="fixed bottom-6 right-6 z-50 bg-primary text-white w-16 h-16 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition md:hidden"><span class="material-symbols-outlined text-2xl">call</span></a>` : ""}

<!-- ═══ MODAL universel (RDV / Devis / Contact / Brochure) ═══ -->
<div id="klyora-modal" class="fixed inset-0 z-[10000] hidden items-center justify-center p-4" style="background: rgba(0,0,0,0.6); backdrop-filter: blur(8px);" onclick="if(event.target===this)closeKlyoraModal()">
  <div class="glass max-w-lg w-full rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto" style="background: rgba(255,255,255,0.98);">
    <button type="button" onclick="closeKlyoraModal()" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition">
      <span class="material-symbols-outlined">close</span>
    </button>
    <div id="klyora-modal-header" class="mb-6">
      <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style="background: linear-gradient(135deg, ${primary}, ${accent});">
        <span id="klyora-modal-icon" class="material-symbols-outlined text-white text-3xl">event</span>
      </div>
      <h3 id="klyora-modal-title" class="font-serif text-3xl mb-2">Prendre rendez-vous</h3>
      <p id="klyora-modal-sub" class="text-neutral-600">Remplissez ce formulaire, nous vous recontactons sous 24h.</p>
    </div>
    <form id="klyora-modal-form" onsubmit="submitKlyoraModal(event)" class="space-y-4">
      <input type="hidden" name="type" id="klyora-modal-type" value="rdv" />
      <div>
        <label class="block text-xs font-bold uppercase tracking-widest text-neutral-700 mb-1.5">Votre nom <span class="text-red-500">*</span></label>
        <input type="text" name="nom" required class="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary focus:outline-none transition" placeholder="Prénom Nom" />
      </div>
      <div>
        <label class="block text-xs font-bold uppercase tracking-widest text-neutral-700 mb-1.5">Téléphone <span class="text-red-500">*</span></label>
        <input type="tel" name="telephone" required pattern="[0-9 +\\-\\.]{8,}" class="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary focus:outline-none transition" placeholder="06 XX XX XX XX" />
      </div>
      <div>
        <label class="block text-xs font-bold uppercase tracking-widest text-neutral-700 mb-1.5">Email</label>
        <input type="email" name="email" class="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary focus:outline-none transition" placeholder="vous@email.fr" />
      </div>
      <div id="klyora-modal-date" class="hidden">
        <label class="block text-xs font-bold uppercase tracking-widest text-neutral-700 mb-1.5">Date souhaitée</label>
        <input type="date" name="date_souhaitee" class="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary focus:outline-none transition" />
      </div>
      <div>
        <label id="klyora-modal-msglabel" class="block text-xs font-bold uppercase tracking-widest text-neutral-700 mb-1.5">Votre message</label>
        <textarea name="message" rows="3" class="w-full px-4 py-3 rounded-xl border-2 border-neutral-200 focus:border-primary focus:outline-none transition" placeholder="Précisez votre besoin..."></textarea>
      </div>
      <button type="submit" id="klyora-modal-submit" class="w-full bg-primary text-white py-4 rounded-xl font-bold hover:opacity-90 transition flex items-center justify-center gap-2" style="box-shadow: 0 8px 24px ${primary}50;">
        <span class="material-symbols-outlined">send</span>
        <span id="klyora-modal-submit-text">Envoyer ma demande</span>
      </button>
      <p class="text-xs text-neutral-500 text-center">🔒 Vos informations restent confidentielles. Réponse sous 24h ouvrées.</p>
    </form>
    <div id="klyora-modal-success" class="hidden text-center py-8">
      <div class="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4" style="background: linear-gradient(135deg, #10b981, #059669);">
        <span class="material-symbols-outlined text-white text-5xl" style="font-variation-settings: 'FILL' 1;">check</span>
      </div>
      <h3 class="font-serif text-3xl mb-3">C'est envoyé ! 🎉</h3>
      <p class="text-neutral-700 mb-6">Merci pour votre message. Nous vous recontactons dans les <strong>24h ouvrées</strong>.</p>
      <button type="button" onclick="closeKlyoraModal()" class="bg-primary text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition">Fermer</button>
    </div>
  </div>
</div>

<script>
(function() {
  var modal = document.getElementById('klyora-modal');
  var form = document.getElementById('klyora-modal-form');
  var success = document.getElementById('klyora-modal-success');
  var icon = document.getElementById('klyora-modal-icon');
  var title = document.getElementById('klyora-modal-title');
  var sub = document.getElementById('klyora-modal-sub');
  var typeInput = document.getElementById('klyora-modal-type');
  var dateBlock = document.getElementById('klyora-modal-date');
  var msgLabel = document.getElementById('klyora-modal-msglabel');
  var submitText = document.getElementById('klyora-modal-submit-text');

  var configs = {
    rdv:      { icon: 'event',           title: 'Prendre rendez-vous',        sub: 'Choisissez votre créneau, nous confirmons sous 24h.', msglabel: 'Précisez (optionnel)',        submit: 'Demander ce RDV',     date: true },
    devis:    { icon: 'request_quote',   title: 'Demander un devis gratuit',  sub: 'Décrivez votre besoin, devis sous 24h sans engagement.', msglabel: 'Votre besoin',             submit: 'Recevoir mon devis',  date: false },
    contact:  { icon: 'mail',            title: 'Nous contacter',             sub: 'Une question ? Nous vous répondons rapidement.',         msglabel: 'Votre message',            submit: 'Envoyer mon message', date: false },
    brochure: { icon: 'description',     title: 'Recevoir la brochure',       sub: 'Laissez votre email pour recevoir notre catalogue PDF.', msglabel: 'Vos questions (optionnel)', submit: 'Recevoir la brochure',date: false },
    callback: { icon: 'phone_callback',  title: 'Être rappelé(e)',            sub: 'Quand préférez-vous que l\\'on vous appelle ?',          msglabel: 'Créneaux préférés',        submit: 'Demander un rappel',  date: false },
    essai:    { icon: 'car_rental',      title: 'Réserver un essai',          sub: 'Réservez un essai gratuit, on s\\'occupe de tout.',      msglabel: 'Précisez vos préférences',  submit: 'Réserver cet essai',  date: true },
  };

  window.openKlyoraModal = function(type, vehicleTitle) {
    var cfg = configs[type] || configs.contact;
    typeInput.value = type;
    icon.textContent = cfg.icon;
    title.textContent = cfg.title;
    sub.textContent = cfg.sub;
    msgLabel.textContent = cfg.msglabel;
    submitText.textContent = cfg.submit;
    dateBlock.classList.toggle('hidden', !cfg.date);
    form.classList.remove('hidden');
    success.classList.add('hidden');
    form.reset();
    typeInput.value = type; // re-set après reset
    // Pré-remplit le message avec le véhicule choisi (pour 'essai')
    if (type === 'essai' && vehicleTitle) {
      var msgField = form.querySelector('textarea[name="message"]');
      if (msgField) msgField.value = 'Je souhaite essayer : ' + vehicleTitle;
      title.textContent = 'Réserver un essai — ' + vehicleTitle;
    }
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  };
  window.closeKlyoraModal = function() {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    document.body.style.overflow = '';
  };
  window.submitKlyoraModal = function(e) {
    e.preventDefault();
    var btn = document.getElementById('klyora-modal-submit');
    btn.disabled = true;
    submitText.textContent = 'Envoi...';
    var formData = new FormData(form);
    var type = formData.get('type');
    var data = {};
    formData.forEach(function(v, k) { if (k !== 'type') data[k] = v; });
    fetch('/api/prospect/${slug}/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: type, form: data }),
    }).then(function(r) { return r.json(); }).then(function(j) {
      if (j.success) {
        form.classList.add('hidden');
        success.classList.remove('hidden');
      } else {
        alert('Erreur lors de l\\'envoi : ' + (j.error || 'inconnu') + '. Réessayez ou appelez directement.');
        btn.disabled = false;
        submitText.textContent = configs[type].submit;
      }
    }).catch(function() {
      alert('Erreur réseau. Réessayez ou appelez directement.');
      btn.disabled = false;
      submitText.textContent = configs[type].submit;
    });
  };

  // ESC ferme le modal
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeKlyoraModal();
  });

  // Wire tous les liens/boutons qui mentionnent RDV / Devis / Contact / Brochure / Rappel
  document.querySelectorAll('a, button').forEach(function(el) {
    var t = (el.textContent || '').trim().toLowerCase();
    if (!t) return;
    var match = null;
    if (/^rdv|rendez[ -]?vous|prendre rdv|prenez rdv|réserver|reserver|booker|réserve|reserve/.test(t)) match = 'rdv';
    else if (/devis|estimat|tarif|chiffrage/.test(t)) match = 'devis';
    else if (/brochure|catalogue|plaquette|téléch|telech/.test(t)) match = 'brochure';
    else if (/rappel|être rappelé|on me rappelle|me rappeler/.test(t)) match = 'callback';
    else if (/nous contacter|nous écrire|nous ecrire|écrivez-nous|ecrivez-nous|envoyer un message|formulaire de contact|contactez/.test(t)) match = 'contact';
    if (match) {
      // Évite de capturer les liens téléphone/mailto (laisse comportement natif)
      var href = el.getAttribute('href') || '';
      if (href.startsWith('tel:') || href.startsWith('mailto:')) return;
      el.removeAttribute('href');
      el.setAttribute('role', 'button');
      el.style.cursor = 'pointer';
      el.addEventListener('click', function(e) {
        e.preventDefault();
        window.openKlyoraModal(match);
      });
    }
  });
})();
</script>

</body>
</html>`;
}
