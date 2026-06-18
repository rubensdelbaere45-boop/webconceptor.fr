/* ══════════════════════════════════════════
   MOCKUP STITCH — PLOMBIER (Artisan de Confiance)

   Template pixel-pixel adapté du design Stitch "Plombier — Artisan
   de Confiance". Cible : artisans plombiers locaux français.

   Caractéristiques :
   - Hero avec photo cuivre/tuyauterie + CTA "INTERVENTION URGENTE"
   - Bandeau d'urgence "Disponible 7j/7 — Délai 2h max"
   - Bento grid 4 services (Urgence fuite, Chauffe-eau, Débouchage,
     Rénovation)
   - Palette : noir Material 3 + accent bleu #1e40af (acier)
     + bleu #0ea5e9 (eau)
   - Typo : EB Garamond (titres) + Plus Jakarta Sans (corps)

   Source : Stitch design Pro export juin 2026.
   Images : Unsplash safe (NO-PEOPLE policy).
   ══════════════════════════════════════════ */

import { resolveHeroPhoto, resolveSecondaryPhotos } from "@/lib/photo-resolver";

export interface PlombierProspect {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website_photos?: string[] | null;
}

function escape(s: string | null | undefined): string {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function generateStitchPlombierMockupHtml(p: PlombierProspect): string {
  const name = escape(p.name);
  const nameUpper = name.toUpperCase();
  const city = escape(p.city || "");
  const address = escape(p.address || "");
  const phone = escape(p.phone || "");
  const phoneNoSpace = (p.phone || "").replace(/\s/g, "");
  const email = escape(p.email || "");

  const heroPhoto = resolveHeroPhoto(p.website_photos || null, "plombier");
  const sec = resolveSecondaryPhotos(p.website_photos || null, "plombier", 3, p.slug);
  const photo2 = sec[0] || heroPhoto;
  const photo3 = sec[1] || heroPhoto;

  const navQuery = address ? encodeURIComponent(`${address}${city ? ", " + city : ""}`) : "";

  return `<!DOCTYPE html>
<!--
  ─────────────────────────────────────────────────────
  Design, code et intégration : Klyora Sites
  https://klyora.fr
  Maquette personnalisée pour ${name}
  Toute reproduction, même partielle, est interdite.
  ─────────────────────────────────────────────────────
-->
<html class="light" lang="fr">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<meta name="robots" content="noindex,noarchive">
<meta name="author" content="Klyora Sites">
<title>${name} - Plombier${city ? ` à ${city}` : ""}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
<script>
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          "surface-container-lowest": "#ffffff",
          "surface-container-low": "#f7f3f2",
          "surface-container": "#f1edec",
          "surface-container-high": "#ebe7e6",
          "surface-container-highest": "#e5e2e1",
          "surface": "#fdf8f8",
          "surface-variant": "#e5e2e1",
          "surface-bright": "#fdf8f8",
          "surface-dim": "#ddd9d8",
          "background": "#fdf8f8",
          "primary": "#000000",
          "on-primary": "#ffffff",
          "primary-container": "#1c1b1b",
          "secondary": "#5e5e5e",
          "on-secondary": "#ffffff",
          "on-background": "#1c1b1b",
          "on-surface": "#1c1b1b",
          "on-surface-variant": "#444748",
          "outline": "#747878",
          "outline-variant": "#c4c7c7",
        },
        borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
        spacing: { "desktop-padding": "4rem", "container-max": "1200px", "section-gap": "5rem", "mobile-padding": "1.5rem", "stack-gap": "1rem" },
        fontFamily: { "headline-lg-mobile": ["EB Garamond"], "headline-display": ["EB Garamond"], "headline-lg": ["EB Garamond"], "label-sm": ["Plus Jakarta Sans"], "body-md": ["Plus Jakarta Sans"], "label-lg": ["Plus Jakarta Sans"] },
        fontSize: {
          "headline-lg-mobile": ["30px", { lineHeight: "1.3", fontWeight: "600" }],
          "headline-display": ["48px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
          "headline-lg": ["36px", { lineHeight: "1.3", fontWeight: "500" }],
          "label-sm": ["12px", { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "600" }],
          "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
          "label-lg": ["14px", { lineHeight: "1.2", letterSpacing: "0.08em", fontWeight: "700" }]
        }
      }
    }
  };
</script>
<style>
  body { background: #fdf8f8; color: #1c1b1b; font-family: "Plus Jakarta Sans", sans-serif; }
  .texture-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
  .paper-shadow { box-shadow: 0 4px 8px -2px rgba(0,0,0,0.04); }
</style>
</head>
<body class="antialiased min-h-screen flex flex-col">
<div class="texture-overlay"></div>

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 bg-surface/95 backdrop-blur-sm border-b border-outline-variant shadow-sm" id="navbar">
  <div class="flex justify-between items-center h-20 px-mobile-padding md:px-desktop-padding max-w-container-max mx-auto">
    <a class="font-headline-lg text-2xl md:text-3xl tracking-tighter text-primary flex items-center gap-2" href="#">
      <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">plumbing</span>
      ${nameUpper}
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a class="font-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#services">Services</a>
      <a class="font-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#contact">Contact</a>
      ${phoneNoSpace ? `<a class="inline-flex items-center justify-center bg-primary text-on-primary font-label-lg px-6 py-3 rounded hover:bg-primary-container transition-colors" href="tel:${phoneNoSpace}">DEVIS GRATUIT</a>` : ""}
    </div>
    <button class="md:hidden text-primary p-2"><span class="material-symbols-outlined text-2xl">menu</span></button>
  </div>
</nav>

<!-- Bandeau urgence -->
<div class="bg-[#1e40af] text-white pt-24 pb-3 px-mobile-padding md:px-desktop-padding text-center shadow-md">
  <div class="max-w-container-max mx-auto flex items-center justify-center gap-2">
    <span class="material-symbols-outlined animate-pulse text-[#0ea5e9]" style="font-variation-settings: 'FILL' 1;">emergency</span>
    <span class="font-label-lg tracking-widest uppercase text-sm">Disponible 7j/7 — Intervention rapide</span>
  </div>
</div>

<main class="flex-grow">
<!-- Hero -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto flex flex-col md:flex-row items-center gap-12">
    <div class="flex-1 space-y-8">
      <h1 class="font-headline-display text-4xl md:text-5xl text-primary leading-tight">
        Confiance, urgence maîtrisée.
      </h1>
      <p class="font-body-md text-on-surface-variant max-w-lg text-lg">
        Dépannage rapide et travaux propres${city ? ` à <span class="font-bold text-[#1e40af]">${city}</span>` : ""}.
        Une expertise artisanale pour vos installations sanitaires, avec la garantie d'un travail soigné.
      </p>
      <div class="flex flex-col sm:flex-row gap-4 pt-4">
        ${phoneNoSpace ? `<a class="inline-flex items-center justify-center gap-2 bg-[#1e40af] text-white font-label-lg px-8 py-4 rounded hover:bg-[#1e3a8a] transition-all shadow-md hover:shadow-lg" href="tel:${phoneNoSpace}"><span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">call</span>INTERVENTION URGENTE</a>` : ""}
        <a class="inline-flex items-center justify-center bg-surface border border-outline font-label-lg text-primary px-8 py-4 rounded hover:bg-surface-container-low transition-colors" href="#services">NOS PRESTATIONS</a>
      </div>
    </div>
    <div class="flex-1 w-full aspect-[4/3] rounded-xl overflow-hidden relative paper-shadow border border-outline-variant bg-surface-container">
      <img class="object-cover w-full h-full absolute inset-0" alt="Plomberie ${name}" src="${heroPhoto}"/>
    </div>
  </div>
</section>

<!-- Services -->
<section class="py-section-gap bg-surface-container-lowest px-mobile-padding md:px-desktop-padding border-t border-b border-outline-variant" id="services">
  <div class="max-w-container-max mx-auto">
    <div class="mb-12">
      <h2 class="font-headline-lg text-3xl md:text-4xl text-primary mb-4">Notre Savoir-Faire</h2>
      <div class="w-24 h-1 bg-[#1e40af]"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="col-span-1 md:col-span-2 bg-surface rounded-xl p-8 border border-outline-variant paper-shadow group hover:border-[#1e40af] transition-colors relative overflow-hidden flex flex-col justify-end min-h-[300px]">
        <div class="absolute inset-0 z-0">
          <img class="object-cover w-full h-full opacity-40 group-hover:opacity-60 transition-opacity duration-500 mix-blend-multiply" alt="" src="${photo2}"/>
        </div>
        <div class="relative z-10">
          <div class="w-12 h-12 bg-[#1e40af] text-white rounded-full flex items-center justify-center mb-6 shadow-md">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">water_drop</span>
          </div>
          <h3 class="font-headline-lg text-2xl leading-tight text-primary mb-2">Urgence fuite</h3>
          <p class="text-on-surface-variant max-w-md">Intervention immédiate pour limiter les dégâts. Recherche de fuite non destructive et réparation pérenne.</p>
        </div>
      </div>
      <div class="col-span-1 bg-surface rounded-xl p-8 border border-outline-variant paper-shadow group hover:border-[#0ea5e9] transition-colors flex flex-col">
        <div class="w-12 h-12 bg-surface-container-highest text-[#1e40af] rounded-full flex items-center justify-center mb-6">
          <span class="material-symbols-outlined">water_heater</span>
        </div>
        <h3 class="font-headline-lg text-2xl leading-tight text-primary mb-2">Chauffe-eau</h3>
        <p class="text-on-surface-variant flex-grow">Dépannage, détartrage et remplacement de ballons d'eau chaude électriques et thermodynamiques.</p>
      </div>
      <div class="col-span-1 bg-surface rounded-xl p-8 border border-outline-variant paper-shadow group hover:border-[#1e40af] transition-colors flex flex-col">
        <div class="w-12 h-12 bg-surface-container-highest text-[#1e40af] rounded-full flex items-center justify-center mb-6">
          <span class="material-symbols-outlined">plumbing</span>
        </div>
        <h3 class="font-headline-lg text-2xl leading-tight text-primary mb-2">Débouchage</h3>
        <p class="text-on-surface-variant flex-grow">Intervention sur canalisations engorgées, siphons et colonnes d'évacuation. Outils professionnels adaptés.</p>
      </div>
      <div class="col-span-1 md:col-span-2 bg-surface rounded-xl p-8 border border-outline-variant paper-shadow flex flex-col md:flex-row gap-8 items-center">
        <div class="flex-1">
          <div class="w-12 h-12 bg-[#0ea5e9] text-white rounded-full flex items-center justify-center mb-6 shadow-md">
            <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">bathtub</span>
          </div>
          <h3 class="font-headline-lg text-2xl leading-tight text-primary mb-2">Rénovation &amp; Installation</h3>
          <p class="text-on-surface-variant mb-6">Création ou rénovation complète de salles de bain. Installation de sanitaires haut de gamme, douches à l'italienne et réseaux complets.</p>
          <a class="inline-flex items-center justify-center bg-surface border border-outline font-label-lg text-primary px-6 py-3 rounded hover:bg-surface-container-low transition-colors uppercase" href="#contact">Demander une étude</a>
        </div>
        <div class="w-full md:w-1/2 aspect-square md:aspect-auto md:h-full rounded-lg overflow-hidden relative">
          <img class="object-cover w-full h-full absolute inset-0" alt="Outils plomberie" src="${photo3}"/>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Contact -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding" id="contact">
  <div class="max-w-container-max mx-auto text-center">
    <h2 class="font-headline-lg text-3xl md:text-4xl text-primary mb-4">Contactez-nous</h2>
    <div class="w-24 h-1 bg-[#1e40af] mx-auto mb-12"></div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
      ${phoneNoSpace ? `<div class="bg-surface rounded-xl p-8 border border-outline-variant paper-shadow"><span class="material-symbols-outlined text-3xl text-[#1e40af] mb-3" style="font-variation-settings: 'FILL' 1;">call</span><h3 class="font-headline-lg text-xl text-primary mb-2">Téléphone</h3><a href="tel:${phoneNoSpace}" class="text-on-surface-variant hover:text-primary">${phone}</a></div>` : ""}
      ${email ? `<div class="bg-surface rounded-xl p-8 border border-outline-variant paper-shadow"><span class="material-symbols-outlined text-3xl text-[#1e40af] mb-3" style="font-variation-settings: 'FILL' 1;">mail</span><h3 class="font-headline-lg text-xl text-primary mb-2">Email</h3><a href="mailto:${email}" class="text-on-surface-variant hover:text-primary text-sm break-all">${email}</a></div>` : ""}
      ${address ? `<div class="bg-surface rounded-xl p-8 border border-outline-variant paper-shadow"><span class="material-symbols-outlined text-3xl text-[#1e40af] mb-3" style="font-variation-settings: 'FILL' 1;">location_on</span><h3 class="font-headline-lg text-xl text-primary mb-2">Adresse</h3><p class="text-on-surface-variant text-sm">${address}${city ? `<br/>${city}` : ""}</p>${navQuery ? `<a href="https://www.google.com/maps/dir/?api=1&destination=${navQuery}" target="_blank" rel="noopener" class="inline-block mt-3 text-xs text-[#1e40af] underline">M'y rendre</a>` : ""}</div>` : ""}
    </div>
  </div>
</section>
</main>

<!-- Footer -->
<footer class="w-full mt-section-gap bg-surface-container-highest border-t border-outline-variant">
  <div class="flex flex-col md:flex-row justify-between items-center py-12 px-mobile-padding md:px-desktop-padding max-w-container-max mx-auto gap-stack-gap">
    <div class="flex flex-col items-center md:items-start gap-4">
      <span class="font-headline-lg text-2xl text-primary">${nameUpper}</span>
      <span class="text-on-surface text-sm">© 2026 ${nameUpper} · Site Klyora Sites · Artisan plombier${city ? ` à ${city}` : ""}</span>
    </div>
    <div class="flex flex-wrap justify-center gap-6">
      <a class="font-label-sm text-on-surface-variant hover:text-primary underline decoration-1 underline-offset-4 transition-all uppercase text-xs" href="#services">Services</a>
      <a class="font-label-sm text-on-surface-variant hover:text-primary underline decoration-1 underline-offset-4 transition-all uppercase text-xs" href="#contact">Contact</a>
    </div>
  </div>
</footer>

<script>
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) { window.scrollY > 10 ? nav.classList.add('shadow-md') : nav.classList.remove('shadow-md'); }
  });
</script>
</body>
</html>`;
}
