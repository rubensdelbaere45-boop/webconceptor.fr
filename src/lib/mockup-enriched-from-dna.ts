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
};

const esc = (s: string | null | undefined): string =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Détermine si le DNA est suffisamment riche pour utiliser le template enrichi. */
export function isEnrichedDnaWorthIt(dna: WebsiteDna | null | undefined): boolean {
  if (!dna || dna.error) return false;
  const headings = dna.allHeadings?.length || 0;
  const services = dna.detectedServices?.length || 0;
  const images = dna.allImages?.length || 0;
  return headings >= 8 || services >= 4 || (images >= 3 && headings >= 4);
}

export function generateEnrichedMockupHtml(p: EnrichedProspect): string {
  const dna = p.site_style_dna!;
  const name = esc(p.name);
  const city = esc(p.city || "");
  const phoneDisplay = esc(p.phone || dna.detectedPhones?.[0] || "");
  const phoneDigits = (p.phone || dna.detectedPhones?.[0] || "").replace(/[^\d+]/g, "");
  const allPhones = Array.from(new Set([p.phone, ...(dna.detectedPhones || [])].filter(Boolean))) as string[];
  const allEmails = Array.from(new Set([p.email, ...(dna.detectedEmails || [])].filter(Boolean))) as string[];
  const allAddresses = Array.from(new Set([p.address, ...(dna.detectedAddresses || [])].filter(Boolean))) as string[];

  // Couleurs marque (DNA scrapé du vrai site)
  const primary = (dna.primaryColor || "#000000").toLowerCase();
  const accent = (dna.accentColor || "#666666").toLowerCase();

  // Hero : vraie image + vrai titre + vrai sous-titre du site
  const heroImage = dna.heroImageUrl || dna.allImages?.[0] || "";
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

  // Photos pour galerie : jusqu'à 6 images
  const galleryImages = (dna.allImages || []).slice(1, 7);

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
      <div class="flex flex-wrap gap-4 fade-up fade-up-delay-2">
        ${phoneDigits ? `<a href="tel:${phoneDigits}" class="bg-primary text-white px-8 py-4 rounded-full font-bold hover:opacity-90 transition inline-flex items-center gap-2 hover-lift" style="box-shadow: 0 10px 30px ${primary}55"><span class="material-symbols-outlined">call</span>Nous appeler</a>` : ""}
        <a href="#services" class="glass border-2 border-primary text-primary px-8 py-4 rounded-full font-bold hover:bg-primary hover:text-white transition">Découvrir nos services</a>
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

${galleryImages.length >= 3 ? `
<!-- GALERIE photos avec fond cream -->
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

</body>
</html>`;
}
