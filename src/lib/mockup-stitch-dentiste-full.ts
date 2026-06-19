/* ══════════════════════════════════════════
   MOCKUP STITCH DENTISTE — pixel-pixel + sections vendeuses
   Source: stitch_klyora_stitch_templates/dentiste_name_1
   ══════════════════════════════════════════ */

export interface DentisteFullProspect {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  hours?: string | null;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  reviews?: Array<{ author?: string; rating?: number; text?: string; timeAgo?: string }> | null;
}

function escape(s: string | null | undefined): string {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

const STITCH_HERO = "https://lh3.googleusercontent.com/aida-public/AB6AXuC6tz6T6HSd4eAs6h-HgorJ4-pZamddhlKPgLhkvHoS77XxRfv__Z2A-UkPVZP9i3jZIOJY3YkUSHyRRBmVXITFDiVU2GTmT8YkIhXtEOvHwSoQ6hItqfXDDzzsbZMmdMZytYhrSV9yt4eRlWpNjZ4HNZ5h6LI7_zEQ0UtM1MrtIYCfvZ1XDW-uXXyCcMvpWg3Zxe4nEkWBpjYCYwuDIpTwCj0Ycstmi2D4yz0ZEF-uQRlEbC5I-7rExcNAWeKiWCN2_4qbQyppOJc";
const STITCH_STERILIZATION = "https://lh3.googleusercontent.com/aida-public/AB6AXuCkJIiN6E8gyf4fOrhGjgIB6gBHyYKKOO7GJHzc9jgNcF57ckUfO9AySnY7PPR6zdD-Vor_n3OdTI6qBTfhZ0xkuT4LOMsKOSnYzb2uVyjGAXpo3ino8bm8QCCFvk_d7CelxZ5TvDbRDYPtx0R1vxPxq_M9O0Plgf0elAKZr4dLWUxEp1jpG5MymTW11qY8w5AIbR0paDEhju91DzuYJRPZeVT3z_9_W7umsPVLivClokXdfsalHDtMmh_z4KqEiZ93wvv7e3x3kR4";
const STITCH_PRECISION = "https://lh3.googleusercontent.com/aida-public/AB6AXuDad9kszDkf5DjjS-KFCcSBZL1UbFrf7dS2qQYKClU6IY10WkV6S98dNZQffiVIbXaK3lYVcHqvANU_DyNUQH6rRvwUhY0sUfUX3ulPUSIO69q_pFprzZZRPBThZN9UyIvL-ZULk4FDdvAwCnWf955HpB3yoHRPtX44oRgSnMEe6mcr6lze8_xdGh4vxyXlUGuehrWbmcu8uVEDGZDPoSSR7F1-yTW94xXc0QMYQpa2oxNs12JVrsWIOxMq1i3xWnuq795fgIBmqKk";
const STITCH_TECH = "https://lh3.googleusercontent.com/aida-public/AB6AXuCmbQqfs9Ndd98XOGVaNc_w2Y7dc9lyOYDBkNBqV4lNa-W_RWpwddcCMNdRB9fmuINzHLm8Aj5bHkLV8LR1dGhIIaMbBk1PGnHAOkSINsTomZxVECTZBkfNrG01pXHN-4gSsrLhQdHn1KYrsNtyVswWN_uW5t1b_kh4xlOW75hvZmqnva5O5jnn7w_FmN92Er6diWYiHd8qozyc3LVVvt7SikBxj9AWZLrlLJ2P7dNivrZ5LoiZq3EMtp7Mnz9_I5H1EmlaSYk8kas";

export function generateStitchDentisteFullMockupHtml(p: DentisteFullProspect): string {
  const name = escape(p.name);
  const city = escape(p.city || "");
  const address = escape(p.address || "");
  const phone = escape(p.phone || "");
  const phoneNoSpace = (p.phone || "").replace(/\s/g, "");
  const email = escape(p.email || "");
  const navQuery = address ? encodeURIComponent(`${address}${city ? ", " + city : ""}`) : "";

  const reviews = (p.reviews || []).filter(r => r.text && r.text.length > 30).slice(0, 3);
  const hasReviews = reviews.length > 0;
  const reviewsHtml = hasReviews ? reviews.map(r => `
    <div class="bg-surface border border-outline-variant rounded-lg p-8 flex flex-col gap-4 hover:border-primary transition-colors">
      <div class="flex gap-1 text-primary">${Array(Math.max(1, Math.round(r.rating || 5))).fill('<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 1; font-size: 18px;">star</span>').join("")}</div>
      <p class="text-on-surface-variant italic leading-relaxed text-sm">«&nbsp;${escape(r.text || "").slice(0, 220)}${(r.text || "").length > 220 ? "…" : ""}&nbsp;»</p>
      <div class="mt-auto pt-4 border-t border-outline-variant"><div class="font-label-lg text-primary text-sm">${escape(r.author || "Patient Google")}</div>${r.timeAgo ? `<div class="text-xs text-on-surface-variant uppercase tracking-widest">${escape(r.timeAgo)}</div>` : ""}</div>
    </div>`).join("") : "";

  const ratingBadge = (p.google_rating && p.google_reviews_count)
    ? `<div class="flex items-center justify-center gap-3"><div class="flex gap-1 text-primary">${Array(Math.round(p.google_rating)).fill('<span class="material-symbols-outlined" style="font-variation-settings: \'FILL\' 1;">star</span>').join("")}</div><span class="font-label-lg">${p.google_rating}/5 — ${p.google_reviews_count} avis Google</span></div>`
    : "";

  return `<!DOCTYPE html>
<!-- Klyora Sites · ${name} -->
<html class="light" lang="fr">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<meta name="robots" content="noindex,noarchive">
<title>${name} — Cabinet dentaire${city ? ` à ${city}` : ""}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
<script>
  tailwind.config = { darkMode: "class", theme: { extend: {
    colors: {
      "surface-container-lowest": "#ffffff", "surface-container-low": "#f7f3f2",
      "surface-container": "#f1edec", "surface-container-high": "#ebe7e6",
      "surface-container-highest": "#e5e2e1", "surface": "#fdf8f8",
      "background": "#fdf8f8", "on-background": "#1c1b1b",
      "primary": "#000000", "on-primary": "#ffffff", "primary-container": "#1c1b1b",
      "on-surface": "#1c1b1b", "on-surface-variant": "#444748",
      "outline": "#747878", "outline-variant": "#c4c7c7",
      "error-container": "#ffdad6", "on-error-container": "#93000a", "error": "#ba1a1a"
    },
    borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
    spacing: { "stack-gap": "1rem", "desktop-padding": "4rem", "container-max": "1200px", "section-gap": "5rem", "mobile-padding": "1.5rem" },
    fontFamily: { "headline-display": ["EB Garamond"], "headline-lg": ["EB Garamond"], "headline-lg-mobile": ["EB Garamond"], "label-sm": ["Plus Jakarta Sans"], "body-md": ["Plus Jakarta Sans"], "label-lg": ["Plus Jakarta Sans"] },
    fontSize: {
      "headline-display": ["48px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
      "headline-lg": ["36px", { lineHeight: "1.3", fontWeight: "500" }],
      "headline-lg-mobile": ["30px", { lineHeight: "1.3", fontWeight: "600" }],
      "label-sm": ["12px", { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "600" }],
      "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
      "label-lg": ["14px", { lineHeight: "1.2", letterSpacing: "0.08em", fontWeight: "700" }]
    }
  }}};
</script>
<style>
  body { font-family: "Plus Jakarta Sans", sans-serif; background: #fdf8f8; color: #1c1b1b; }
  body::before { content: ''; position: fixed; inset: 0; pointer-events: none; opacity: 0.04; z-index: 9999;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
  .grain-image { position: relative; }
  .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
  .material-symbols-outlined.fill-icon { font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
</style>
</head>
<body class="bg-surface text-on-surface min-h-screen relative antialiased">

<!-- HEADER NAV (sticky sous la sales-ui-bar 54px) -->
<header class="bg-surface/95 backdrop-blur-sm sticky top-[54px] z-40 border-b border-outline-variant shadow-sm w-full">
  <div class="max-w-[1200px] mx-auto flex justify-between items-center px-mobile-padding md:px-desktop-padding py-4">
    <div class="font-headline-lg text-3xl font-bold text-primary flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full">${name}</div>
    <nav class="hidden md:flex gap-8 items-center">
      <a class="text-primary border-b-2 border-primary pb-1 font-label-lg" href="#accueil">Accueil</a>
      <a class="text-on-surface-variant hover:text-primary font-label-lg transition-opacity" href="#savoir-faire">Savoir-faire</a>
      <a class="text-on-surface-variant hover:text-primary font-label-lg transition-opacity" href="#services">Services</a>
      <a class="text-on-surface-variant hover:text-primary font-label-lg transition-opacity" href="#process">Comment ça marche</a>
      <a class="text-on-surface-variant hover:text-primary font-label-lg transition-opacity" href="#contact">Contact</a>
    </nav>
    <div class="hidden md:flex items-center gap-4">
      <a class="text-primary font-label-lg border border-outline px-4 py-2 rounded uppercase tracking-wider hover:bg-surface-container-low transition-colors flex items-center gap-2" href="#contact"><span class="material-symbols-outlined">event_available</span>Doctolib</a>
      ${phoneNoSpace ? `<a class="bg-primary text-on-primary font-label-lg px-6 py-2 rounded uppercase tracking-wider hover:opacity-80 transition-opacity" href="tel:${phoneNoSpace}">Devis</a>` : ""}
    </div>
    <button class="md:hidden text-primary p-2"><span class="material-symbols-outlined">menu</span></button>
  </div>
</header>

<main>
<!-- HERO (pixel-pixel) -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-stack-gap items-center" id="accueil">
  <div class="space-y-6">
    <h1 class="font-headline-display text-4xl md:text-5xl text-primary">Cabinet dentaire${city ? ` — ${city}` : ""}</h1>
    <p class="text-on-surface-variant max-w-lg">Une approche moderne de la santé bucco-dentaire, alliant précision clinique et esthétique naturelle. Notre équipe vous accueille dans un environnement serein dédié à l'hygiène absolue.</p>
    ${ratingBadge ? `<div>${ratingBadge}</div>` : ""}
    <div class="flex flex-col sm:flex-row gap-4 pt-4">
      ${phoneNoSpace ? `<a class="bg-primary text-on-primary font-label-lg px-8 py-3 rounded uppercase tracking-wider text-center hover:opacity-80 transition-opacity" href="tel:${phoneNoSpace}">Prendre rendez-vous</a>` : `<a class="bg-primary text-on-primary font-label-lg px-8 py-3 rounded uppercase tracking-wider text-center" href="#contact">Prendre rendez-vous</a>`}
    </div>
  </div>
  <div class="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden grain-image shadow-sm border border-outline-variant/30">
    <img class="w-full h-full object-cover" alt="Cabinet ${name}" src="${STITCH_HERO}"/>
  </div>
</section>

<!-- SAVOIR-FAIRE & RIGUEUR (pixel-pixel) -->
<section class="py-section-gap bg-surface-container-low px-mobile-padding md:px-desktop-padding border-t border-b border-outline-variant" id="savoir-faire">
  <div class="max-w-[1200px] mx-auto">
    <div class="text-center mb-12">
      <h2 class="font-headline-lg text-3xl md:text-4xl text-primary mb-4">Savoir-faire &amp; Rigueur</h2>
      <p class="text-on-surface-variant max-w-2xl mx-auto">L'excellence technique au service de votre sourire, soutenue par des protocoles d'hygiène stricts et une technologie de pointe.</p>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-stack-gap">
      <div class="bg-surface rounded-lg shadow-sm grain-image h-[300px] relative overflow-hidden group">
        <img class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Stérilisation" src="${STITCH_STERILIZATION}"/>
        <div class="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
        <div class="absolute bottom-0 left-0 p-6 z-20"><h3 class="font-headline-lg text-2xl text-on-primary mb-2">Stérilisation</h3></div>
      </div>
      <div class="bg-surface rounded-lg shadow-sm grain-image h-[300px] relative overflow-hidden group">
        <img class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Précision" src="${STITCH_PRECISION}"/>
        <div class="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
        <div class="absolute bottom-0 left-0 p-6 z-20"><h3 class="font-headline-lg text-2xl text-on-primary mb-2">Précision</h3></div>
      </div>
      <div class="bg-surface rounded-lg shadow-sm grain-image h-[300px] relative overflow-hidden group">
        <img class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt="Technologie" src="${STITCH_TECH}"/>
        <div class="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
        <div class="absolute bottom-0 left-0 p-6 z-20"><h3 class="font-headline-lg text-2xl text-on-primary mb-2">Technologie</h3></div>
      </div>
    </div>
  </div>
</section>

<!-- SERVICES BENTO (pixel-pixel) -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding max-w-[1200px] mx-auto" id="services">
  <h2 class="font-headline-lg text-3xl md:text-4xl text-primary mb-12 border-b border-outline-variant pb-4">Nos Services</h2>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-stack-gap auto-rows-[200px]">
    <div class="md:col-span-2 md:row-span-2 bg-surface-container-high rounded-lg p-8 relative overflow-hidden group shadow-sm border border-outline-variant/50">
      <div class="absolute top-6 right-6 text-primary"><span class="material-symbols-outlined text-4xl">medical_services</span></div>
      <div class="relative z-10 flex flex-col justify-end h-full"><h3 class="font-headline-lg text-3xl text-primary mb-2">Soins Dentaires</h3><p class="text-on-surface-variant max-w-sm">Prévention, détartrage et traitements conservateurs pour maintenir une santé bucco-dentaire optimale sur le long terme.</p></div>
    </div>
    <div class="md:col-span-2 bg-surface rounded-lg p-6 relative overflow-hidden group shadow-sm border border-outline-variant/50">
      <div class="absolute top-4 right-4 text-primary"><span class="material-symbols-outlined text-3xl">diamond</span></div>
      <h3 class="font-headline-lg text-2xl text-primary mb-2">Esthétique</h3><p class="text-on-surface-variant text-sm">Blanchiment, facettes et harmonisation du sourire.</p>
    </div>
    <div class="bg-surface rounded-lg p-6 relative overflow-hidden group shadow-sm border border-outline-variant/50">
      <div class="absolute top-4 right-4 text-primary"><span class="material-symbols-outlined text-3xl">architecture</span></div>
      <h3 class="font-headline-lg text-2xl text-primary mb-2">Implantologie</h3><p class="text-on-surface-variant text-sm">Remplacement pérenne de dents absentes.</p>
    </div>
    <div class="bg-surface rounded-lg p-6 relative overflow-hidden group shadow-sm border border-outline-variant/50">
      <div class="absolute top-4 right-4 text-primary"><span class="material-symbols-outlined text-3xl">align_horizontal_center</span></div>
      <h3 class="font-headline-lg text-2xl text-primary mb-2">Orthodontie</h3><p class="text-on-surface-variant text-sm">Alignement dentaire discret pour adultes.</p>
    </div>
    <div class="md:col-span-4 bg-error-container text-on-error-container rounded-lg p-6 flex items-center justify-between border border-error/20">
      <div class="flex items-center gap-4"><span class="material-symbols-outlined text-3xl">emergency</span><div><h3 class="font-label-lg font-bold">Urgences Dentaires</h3><p class="text-sm opacity-80">Prise en charge rapide de la douleur et des traumatismes.</p></div></div>
      ${phoneNoSpace ? `<a class="bg-on-error-container text-error-container font-label-lg px-4 py-2 rounded uppercase tracking-wider hover:opacity-90" href="tel:${phoneNoSpace}">Appeler</a>` : ""}
    </div>
  </div>
</section>

<!-- COMMENT ÇA MARCHE (nouveau) -->
<section id="process" class="py-section-gap bg-surface-container-low px-mobile-padding md:px-desktop-padding">
  <div class="max-w-[1200px] mx-auto">
    <div class="text-center mb-16"><span class="font-label-sm text-primary uppercase tracking-[0.2em] mb-4 inline-block">Notre méthode</span><h2 class="font-headline-display text-3xl md:text-5xl text-primary">Votre parcours de soin</h2><div class="w-24 h-1 bg-primary mx-auto mt-6"></div></div>
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div class="bg-surface p-8 border border-outline-variant relative shadow-sm"><span class="absolute -top-6 left-8 w-12 h-12 bg-primary text-on-primary flex items-center justify-center font-headline-lg text-xl rounded-full">1</span><h3 class="font-headline-lg text-xl mb-3 mt-4">Premier RDV</h3><p class="text-on-surface-variant text-sm">Bilan complet, examens nécessaires, écoute attentive de vos attentes. Aucune pression.</p></div>
      <div class="bg-surface p-8 border border-outline-variant relative shadow-sm"><span class="absolute -top-6 left-8 w-12 h-12 bg-primary text-on-primary flex items-center justify-center font-headline-lg text-xl rounded-full">2</span><h3 class="font-headline-lg text-xl mb-3 mt-4">Plan de traitement</h3><p class="text-on-surface-variant text-sm">Devis détaillé avec prise en charge mutuelle. Toutes les options vous sont expliquées.</p></div>
      <div class="bg-surface p-8 border border-outline-variant relative shadow-sm"><span class="absolute -top-6 left-8 w-12 h-12 bg-primary text-on-primary flex items-center justify-center font-headline-lg text-xl rounded-full">3</span><h3 class="font-headline-lg text-xl mb-3 mt-4">Soins personnalisés</h3><p class="text-on-surface-variant text-sm">Interventions douces avec technologie de pointe. Anesthésie indolore, suivi rigoureux.</p></div>
      <div class="bg-surface p-8 border border-outline-variant relative shadow-sm"><span class="absolute -top-6 left-8 w-12 h-12 bg-primary text-on-primary flex items-center justify-center font-headline-lg text-xl rounded-full">4</span><h3 class="font-headline-lg text-xl mb-3 mt-4">Suivi long terme</h3><p class="text-on-surface-variant text-sm">Contrôles annuels offerts les 2 premières années. Garantie sur tous nos travaux prothétiques.</p></div>
    </div>
  </div>
</section>

<!-- POURQUOI NOUS (nouveau) -->
<section class="py-section-gap bg-surface px-mobile-padding md:px-desktop-padding">
  <div class="max-w-[1200px] mx-auto">
    <div class="text-center mb-16"><span class="font-label-sm text-primary uppercase tracking-[0.2em] mb-4 inline-block">Nos engagements</span><h2 class="font-headline-display text-3xl md:text-5xl text-primary">Pourquoi nous choisir</h2><div class="w-24 h-1 bg-primary mx-auto mt-6"></div></div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
      <div class="flex gap-6 items-start"><span class="material-symbols-outlined text-primary text-5xl flex-shrink-0" style="font-variation-settings: 'FILL' 1;">verified_user</span><div><h3 class="font-headline-lg text-2xl mb-2">Hygiène absolue</h3><p class="text-on-surface-variant">Stérilisation par autoclave classe B, instruments à usage unique, protocoles certifiés ISO. Votre sécurité avant tout.</p></div></div>
      <div class="flex gap-6 items-start"><span class="material-symbols-outlined text-primary text-5xl flex-shrink-0" style="font-variation-settings: 'FILL' 1;">science</span><div><h3 class="font-headline-lg text-2xl mb-2">Technologie de pointe</h3><p class="text-on-surface-variant">Radiographie 3D cone beam, scanner intra-oral, laser. Diagnostics précis et soins confortables.</p></div></div>
      <div class="flex gap-6 items-start"><span class="material-symbols-outlined text-primary text-5xl flex-shrink-0" style="font-variation-settings: 'FILL' 1;">payments</span><div><h3 class="font-headline-lg text-2xl mb-2">Devis transparent</h3><p class="text-on-surface-variant">Pas de surprise sur la note. Devis remis avant chaque soin coûteux, paiement échelonné possible.</p></div></div>
      <div class="flex gap-6 items-start"><span class="material-symbols-outlined text-primary text-5xl flex-shrink-0" style="font-variation-settings: 'FILL' 1;">favorite</span><div><h3 class="font-headline-lg text-2xl mb-2">Écoute &amp; bienveillance</h3><p class="text-on-surface-variant">Anxiété dentaire ? Nous prenons le temps qu'il faut. Sédation consciente disponible sur demande.</p></div></div>
    </div>
  </div>
</section>

${hasReviews ? `
<!-- AVIS (nouveau) -->
<section class="py-section-gap bg-surface-container-low px-mobile-padding md:px-desktop-padding">
  <div class="max-w-[1200px] mx-auto">
    <div class="text-center mb-16"><span class="font-label-sm text-primary uppercase tracking-[0.2em] mb-4 inline-block">Ils en parlent</span><h2 class="font-headline-display text-3xl md:text-5xl text-primary">Nos patients témoignent</h2>${ratingBadge ? `<div class="flex justify-center mt-6">${ratingBadge}</div>` : ""}</div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8">${reviewsHtml}</div>
  </div>
</section>` : ""}

<!-- CTA FINALE -->
<section class="py-section-gap bg-primary text-on-primary px-mobile-padding md:px-desktop-padding text-center">
  <div class="max-w-[1200px] mx-auto">
    <h2 class="font-headline-display text-3xl md:text-5xl mb-6">Prêt à prendre soin de votre sourire ?</h2>
    <p class="text-lg max-w-2xl mx-auto mb-12 opacity-90">Premier rendez-vous en ligne ou par téléphone${city ? ` à ${city}` : ""}. Cabinet conventionné secteur 1.</p>
    <div class="flex flex-wrap gap-4 justify-center">
      ${phoneNoSpace ? `<a href="tel:${phoneNoSpace}" class="inline-flex items-center gap-2 bg-on-primary text-primary font-label-lg px-10 py-5 hover:opacity-90 uppercase tracking-widest transition-all"><span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">call</span>${phone}</a>` : ""}
      ${email ? `<a href="mailto:${email}" class="inline-flex items-center gap-2 bg-transparent text-white border border-white font-label-lg px-10 py-5 hover:bg-white hover:text-primary uppercase tracking-widest transition-all"><span class="material-symbols-outlined">mail</span>Envoyer un email</a>` : ""}
    </div>
  </div>
</section>

<!-- CONTACT -->
<section id="contact" class="py-section-gap bg-surface px-mobile-padding md:px-desktop-padding">
  <div class="max-w-[1200px] mx-auto text-center">
    <span class="font-label-sm text-primary uppercase tracking-[0.2em] mb-4 inline-block">Nous joindre</span>
    <h2 class="font-headline-display text-3xl md:text-5xl text-primary mb-4">Parlons de votre projet</h2>
    <div class="w-24 h-1 bg-primary mx-auto mb-16"></div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
      ${phoneNoSpace ? `<a href="tel:${phoneNoSpace}" class="bg-surface-container-low p-10 border border-outline-variant hover:border-primary transition-all rounded-lg"><span class="material-symbols-outlined text-primary text-4xl mb-4 inline-block" style="font-variation-settings: 'FILL' 1;">call</span><div class="font-headline-lg text-xl mb-2">Téléphone</div><div class="text-on-surface-variant">${phone}</div></a>` : ""}
      ${email ? `<a href="mailto:${email}" class="bg-surface-container-low p-10 border border-outline-variant hover:border-primary transition-all rounded-lg"><span class="material-symbols-outlined text-primary text-4xl mb-4 inline-block" style="font-variation-settings: 'FILL' 1;">mail</span><div class="font-headline-lg text-xl mb-2">Email</div><div class="text-on-surface-variant text-sm break-all">${email}</div></a>` : ""}
      ${address ? `<div class="bg-surface-container-low p-10 border border-outline-variant rounded-lg"><span class="material-symbols-outlined text-primary text-4xl mb-4 inline-block" style="font-variation-settings: 'FILL' 1;">location_on</span><div class="font-headline-lg text-xl mb-2">Adresse</div><div class="text-on-surface-variant text-sm">${address}${city ? `<br/>${city}` : ""}</div>${navQuery ? `<a href="https://www.google.com/maps/dir/?api=1&destination=${navQuery}" target="_blank" rel="noopener" class="text-primary text-xs uppercase tracking-widest mt-3 inline-block underline">M'y rendre →</a>` : ""}</div>` : ""}
    </div>
    ${p.hours ? `<div class="mt-12 max-w-2xl mx-auto p-8 bg-surface-container-low border border-outline-variant rounded-lg"><h3 class="font-headline-lg text-xl mb-4">Horaires d'ouverture</h3><div class="text-on-surface-variant text-sm whitespace-pre-line">${escape(p.hours)}</div></div>` : ""}
  </div>
</section>
</main>

<!-- FOOTER (pixel-pixel) -->
<footer class="bg-surface-container-high border-t border-outline-variant mt-section-gap w-full">
  <div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-stack-gap px-mobile-padding md:px-desktop-padding py-section-gap">
    <div>
      <div class="font-headline-lg text-3xl text-on-surface mb-4">${name}</div>
      <p class="text-on-surface-variant">Cabinet dentaire dédié à l'excellence et à la sérénité${city ? ` à ${city}` : ""}.</p>
    </div>
    <div>
      <h4 class="font-label-lg font-bold text-on-surface mb-4 uppercase tracking-wider">Contact</h4>
      <address class="not-italic text-on-surface-variant space-y-2 text-sm">
        ${address ? `<p>${address}${city ? `<br/>${city}` : ""}</p>` : ""}
        ${phone ? `<p>Tél : ${phone}</p>` : ""}
        ${email ? `<p>Email : ${email}</p>` : ""}
      </address>
    </div>
    <div>
      <h4 class="font-label-lg font-bold text-on-surface mb-4 uppercase tracking-wider">Navigation</h4>
      <ul class="space-y-2">
        <li><a class="text-on-surface-variant hover:text-primary underline transition-all text-sm" href="#savoir-faire">Savoir-faire</a></li>
        <li><a class="text-on-surface-variant hover:text-primary underline transition-all text-sm" href="#services">Services</a></li>
        <li><a class="text-on-surface-variant hover:text-primary underline transition-all text-sm" href="#process">Comment ça marche</a></li>
        <li><a class="text-on-surface-variant hover:text-primary underline transition-all text-sm" href="#contact">Contact</a></li>
      </ul>
    </div>
  </div>
  <div class="border-t border-outline-variant/30 py-4 text-center">
    <p class="text-xs text-on-surface-variant">© 2026 ${name} · Site Klyora Sites · Cabinet dentaire${city ? ` à ${city}` : ""}</p>
  </div>
</footer>

${phoneNoSpace ? `<a class="md:hidden fixed bottom-6 right-6 bg-primary text-on-primary w-14 h-14 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center z-50 hover:scale-95 transition-transform" href="tel:${phoneNoSpace}"><span class="material-symbols-outlined fill-icon text-2xl">call</span></a>` : ""}
</body></html>`;
}
