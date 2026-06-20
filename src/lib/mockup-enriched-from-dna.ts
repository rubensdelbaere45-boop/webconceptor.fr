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
  body { font-family: 'Plus Jakarta Sans', sans-serif; background: #fefefe; color: #1a1a1a; }
  .font-serif { font-family: 'EB Garamond', serif; }
  .text-primary { color: var(--primary); }
  .bg-primary { background: var(--primary); }
  .border-primary { border-color: var(--primary); }
  .text-accent { color: var(--accent); }
  .bg-accent { background: var(--accent); }
  .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
  /* Spotlight effect (21st.dev style) */
  .spotlight-hero { position: relative; overflow: hidden; }
  .spotlight-hero::before {
    content: ''; position: absolute; inset: -50%;
    background: radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), ${primary}22 0%, transparent 50%);
    pointer-events: none; opacity: 0; transition: opacity 0.3s;
  }
  .spotlight-hero:hover::before { opacity: 1; }
  /* Border beam (aceternity style) */
  @keyframes border-beam {
    0% { background-position: 0% 0%; }
    100% { background-position: 200% 0%; }
  }
  .border-beam {
    position: relative;
    background: linear-gradient(90deg, transparent, ${primary}, ${accent}, transparent);
    background-size: 200% 100%;
    animation: border-beam 3s linear infinite;
  }
  /* Marquee infinite */
  @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  .marquee { display: flex; animation: marquee 30s linear infinite; }
  .marquee:hover { animation-play-state: paused; }
  /* Hover lift */
  .hover-lift { transition: transform 0.3s, box-shadow 0.3s; }
  .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -10px ${primary}33; }
  /* Gradient text */
  .gradient-text {
    background: linear-gradient(135deg, ${primary}, ${accent});
    -webkit-background-clip: text; background-clip: text; color: transparent;
  }
</style>
</head>
<body class="antialiased">

<!-- Nav sticky sous sales-ui-bar (54px) -->
<header class="sticky top-[54px] z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
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
      ${phoneDigits ? `<a href="tel:${phoneDigits}" class="bg-primary text-white px-5 py-2.5 rounded-full text-sm font-bold hover:opacity-90 transition flex items-center gap-2"><span class="material-symbols-outlined text-base">call</span>${phoneDisplay}</a>` : ""}
    </nav>
  </div>
</header>

<main>
<!-- HERO -->
<section class="spotlight-hero relative bg-neutral-50" onmousemove="this.style.setProperty('--mouse-x', (event.offsetX/this.offsetWidth*100)+'%'); this.style.setProperty('--mouse-y', (event.offsetY/this.offsetHeight*100)+'%');">
  <div class="max-w-7xl mx-auto px-6 py-20 lg:py-28 grid lg:grid-cols-2 gap-12 items-center">
    <div>
      <span class="inline-block text-xs font-bold uppercase tracking-widest text-primary mb-4">${esc(p.business_type || "Professionnel")}${city ? " · " + city : ""}</span>
      <h1 class="font-serif text-5xl lg:text-7xl leading-tight mb-6">
        <span class="gradient-text">${heroTitle}</span>
      </h1>
      <p class="text-xl text-neutral-700 leading-relaxed mb-8 max-w-xl">${heroSubtitle}</p>
      <div class="flex flex-wrap gap-4">
        ${phoneDigits ? `<a href="tel:${phoneDigits}" class="bg-primary text-white px-8 py-4 rounded-full font-bold hover:opacity-90 transition inline-flex items-center gap-2 hover-lift"><span class="material-symbols-outlined">call</span>Nous appeler</a>` : ""}
        <a href="#services" class="border-2 border-primary text-primary px-8 py-4 rounded-full font-bold hover:bg-primary hover:text-white transition">Découvrir nos services</a>
      </div>
      ${p.google_rating && p.google_reviews_count ? `<div class="mt-8 flex items-center gap-3"><div class="flex">${Array(Math.round(p.google_rating)).fill('<span class="material-symbols-outlined text-accent" style="font-variation-settings: \'FILL\' 1;">star</span>').join("")}</div><span class="text-sm text-neutral-700"><strong>${p.google_rating.toFixed(1)}/5</strong> · ${p.google_reviews_count} avis Google</span></div>` : ""}
    </div>
    ${heroImage ? `<div class="relative">
      <div class="aspect-square rounded-3xl overflow-hidden shadow-2xl hover-lift">
        <img src="${esc(heroImage)}" alt="${name}" class="w-full h-full object-cover" />
      </div>
      <div class="absolute -bottom-6 -left-6 bg-white border border-neutral-200 p-6 rounded-2xl shadow-xl max-w-xs">
        <div class="text-xs uppercase tracking-widest text-neutral-500 mb-1">Le saviez-vous ?</div>
        <div class="font-serif text-xl">${esc(name.split(/[\s,—-]/)[0] || name)} ${city ? "à " + city : ""}</div>
        ${dna.detectedAddresses && dna.detectedAddresses.length > 1 ? `<div class="text-xs text-neutral-600 mt-2"><strong>${dna.detectedAddresses.length}</strong> points de vente</div>` : ""}
      </div>
    </div>` : ""}
  </div>
</section>

<!-- ABOUT (vraie copy du site) -->
<section id="apropos" class="py-24 bg-white">
  <div class="max-w-5xl mx-auto px-6 text-center">
    <span class="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Notre histoire</span>
    <h2 class="font-serif text-4xl lg:text-5xl mb-8">${aboutTitle}</h2>
    <p class="text-xl leading-relaxed text-neutral-700">${aboutText}</p>
  </div>
</section>

${services.length ? `
<!-- SERVICES (vrais services scrapés) -->
<section id="services" class="py-24 bg-neutral-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Ce que nous proposons</span>
      <h2 class="font-serif text-4xl lg:text-5xl">Nos services</h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-${Math.min(services.length, 4)} gap-6">
      ${services.map((s, i) => `
        <div class="bg-white rounded-2xl p-8 shadow-sm border border-neutral-200 hover-lift relative overflow-hidden">
          <div class="absolute top-0 left-0 right-0 h-1 border-beam"></div>
          ${s.image ? `<div class="aspect-video rounded-lg overflow-hidden mb-5"><img src="${esc(s.image)}" alt="${esc(s.title)}" class="w-full h-full object-cover" /></div>` : `<div class="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-5"><span class="font-bold text-primary text-lg">${i + 1}</span></div>`}
          <h3 class="font-serif text-xl mb-3">${esc(s.title)}</h3>
          ${s.desc ? `<p class="text-sm text-neutral-600 leading-relaxed">${esc(s.desc)}</p>` : ""}
        </div>`).join("")}
    </div>
  </div>
</section>` : ""}

${articles.length ? `
<!-- ACTUALITES (vrais titres scrapés) -->
<section id="actualites" class="py-24 bg-white">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-16">
      <span class="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Restez informés</span>
      <h2 class="font-serif text-4xl lg:text-5xl">Nos dernières actualités</h2>
    </div>
    <div class="grid md:grid-cols-${Math.min(articles.length, 4)} gap-6">
      ${articles.map((a, i) => `
        <article class="bg-neutral-50 rounded-2xl overflow-hidden hover-lift">
          ${galleryImages[i] ? `<div class="aspect-video"><img src="${esc(galleryImages[i])}" alt="${esc(a)}" class="w-full h-full object-cover" /></div>` : `<div class="aspect-video bg-gradient-to-br" style="background-image:linear-gradient(135deg,${primary},${accent});"></div>`}
          <div class="p-6">
            <span class="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">Actualité</span>
            <h3 class="font-serif text-lg leading-snug">${esc(a)}</h3>
          </div>
        </article>`).join("")}
    </div>
  </div>
</section>` : ""}

${galleryImages.length >= 3 ? `
<!-- GALERIE photos -->
<section class="py-24 bg-neutral-50">
  <div class="max-w-7xl mx-auto px-6">
    <div class="text-center mb-12">
      <span class="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">En images</span>
      <h2 class="font-serif text-4xl lg:text-5xl">${name}</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-${Math.min(galleryImages.length, 4)} gap-4">
      ${galleryImages.slice(0, 8).map(img => `<div class="aspect-square rounded-xl overflow-hidden hover-lift"><img src="${esc(img)}" alt="" class="w-full h-full object-cover" /></div>`).join("")}
    </div>
  </div>
</section>` : ""}

${topReviews.length ? `
<!-- TÉMOIGNAGES Google (marquee défilant) -->
<section class="py-24 bg-white overflow-hidden">
  <div class="text-center mb-12 px-6">
    <span class="text-xs font-bold uppercase tracking-widest text-primary mb-3 block">Ce qu'ils en disent</span>
    <h2 class="font-serif text-4xl lg:text-5xl">Nos clients adorent</h2>
    ${p.google_rating && p.google_reviews_count ? `<div class="mt-4 flex items-center justify-center gap-3"><div class="flex">${Array(Math.round(p.google_rating)).fill('<span class="material-symbols-outlined text-accent" style="font-variation-settings: \'FILL\' 1;">star</span>').join("")}</div><span class="text-sm"><strong>${p.google_rating.toFixed(1)}/5</strong> · ${p.google_reviews_count} avis Google</span></div>` : ""}
  </div>
  <div class="marquee">
    ${[...topReviews, ...topReviews].map(r => `
      <div class="flex-shrink-0 w-80 mx-3 bg-neutral-50 p-6 rounded-2xl border border-neutral-200">
        <div class="flex mb-3">${Array(Math.round(r.rating || 5)).fill('<span class="material-symbols-outlined text-accent" style="font-variation-settings: \'FILL\' 1; font-size: 18px;">star</span>').join("")}</div>
        <p class="text-sm italic text-neutral-700 leading-relaxed mb-4">«&nbsp;${esc((r.text || "").slice(0, 240))}&nbsp;»</p>
        <div class="font-bold text-sm">— ${esc(r.author || "Client")}</div>
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
