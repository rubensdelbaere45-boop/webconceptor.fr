/* ══════════════════════════════════════════
   MOCKUP STITCH ÉLECTRICIEN — pixel-pixel intégral
   Source : stitch_klyora_stitch_templates/lectricien_name_1
   ══════════════════════════════════════════ */
import { resolveHeroPhoto, resolveSecondaryPhotos } from "@/lib/photo-resolver";

export interface ElectricienProspect {
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

export function generateStitchElectricienMockupHtml(p: ElectricienProspect): string {
  const name = escape(p.name);
  const nameUpper = name.toUpperCase();
  const city = escape(p.city || "");
  const cityClause = city ? ` à ${city}` : "";
  const address = escape(p.address || "");
  const phone = escape(p.phone || "");
  const phoneNoSpace = (p.phone || "").replace(/\s/g, "");
  const email = escape(p.email || "");

  const heroImg = resolveHeroPhoto(p.website_photos || null, "electricien");
  const sec = resolveSecondaryPhotos(p.website_photos || null, "electricien", 3, p.slug);
  const techImg = sec[0] || heroImg;
  const matImg = sec[1] || heroImg;
  const navQuery = address ? encodeURIComponent(`${address}${city ? ", " + city : ""}`) : "";

  return `<!DOCTYPE html>
<!-- Design Klyora Sites — https://klyora.fr · Maquette personnalisée pour ${name} -->
<html class="light" lang="fr">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<meta name="robots" content="noindex,noarchive">
<title>${name} — Électricien${cityClause}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
<script>
  tailwind.config = {
    darkMode: "class",
    theme: { extend: {
      colors: {
        "surface-container-lowest": "#ffffff", "surface-container-low": "#f7f3f2",
        "surface-container": "#f1edec", "surface-container-high": "#ebe7e6",
        "surface-container-highest": "#e5e2e1", "surface": "#fdf8f8",
        "surface-variant": "#e5e2e1", "surface-bright": "#fdf8f8", "surface-dim": "#ddd9d8",
        "background": "#fdf8f8", "on-background": "#1c1b1b",
        "primary": "#000000", "on-primary": "#ffffff", "primary-container": "#1c1b1b",
        "secondary": "#5e5e5e", "on-secondary": "#ffffff",
        "on-surface": "#1c1b1b", "on-surface-variant": "#444748",
        "outline": "#747878", "outline-variant": "#c4c7c7"
      },
      borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
      spacing: { "stack-gap": "1rem", "desktop-padding": "4rem", "container-max": "1200px", "section-gap": "5rem", "mobile-padding": "1.5rem" },
      fontFamily: { "headline-lg-mobile": ["EB Garamond"], "headline-display": ["EB Garamond"], "headline-lg": ["EB Garamond"], "label-sm": ["Plus Jakarta Sans"], "body-md": ["Plus Jakarta Sans"], "label-lg": ["Plus Jakarta Sans"] },
      fontSize: {
        "headline-lg-mobile": ["30px", { lineHeight: "1.3", fontWeight: "600" }],
        "headline-display": ["48px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        "headline-lg": ["36px", { lineHeight: "1.3", fontWeight: "500" }],
        "label-sm": ["12px", { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "600" }],
        "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
        "label-lg": ["14px", { lineHeight: "1.2", letterSpacing: "0.08em", fontWeight: "700" }]
      }
    }}
  };
</script>
<style>
  .texture-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.05;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
  .shadow-level-1 { box-shadow: 0 4px 20px rgba(0,0,0,0.08); }
  .text-accent { color: #ca8a04; }
  .bg-accent { background-color: #ca8a04; }
  .border-accent { border-color: #ca8a04; }
  .img-mask { clip-path: polygon(0 0, 100% 0, 100% 90%, 0% 100%); }
  body { font-family: "Plus Jakarta Sans", sans-serif; background: #fdf8f8; color: #1c1b1b; }
</style>
</head>
<body class="bg-background text-on-background font-body-md antialiased overflow-x-hidden selection:bg-accent selection:text-white relative">
<div class="texture-overlay"></div>

<!-- TopNavBar -->
<nav class="bg-surface/90 backdrop-blur-md fixed top-0 w-full z-50 border-b border-outline-variant">
  <div class="flex justify-between items-center h-20 px-mobile-padding md:px-desktop-padding max-w-container-max mx-auto">
    <a class="font-headline-lg text-3xl tracking-tighter text-primary" href="#">${nameUpper}</a>
    <div class="hidden md:flex items-center gap-8">
      <a class="font-label-lg text-primary border-b-2 border-primary pb-1" href="#">Savoir-faire</a>
      <a class="font-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#technique">Précision</a>
      <a class="font-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#materiaux">Matériaux</a>
      <a class="font-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#contact">Contact</a>
    </div>
    <div class="hidden md:block">
      ${phoneNoSpace ? `<a class="font-label-lg bg-primary text-on-primary px-6 py-3 rounded-none hover:bg-zinc-800 transition-all" href="tel:${phoneNoSpace}">DEVIS GRATUIT</a>` : ""}
    </div>
    <button class="md:hidden text-primary"><span class="material-symbols-outlined" style="font-size: 32px;">menu</span></button>
  </div>
</nav>

<main class="pt-20">
<!-- Hero Immersive Split Layout -->
<section class="relative min-h-[90vh] flex items-center bg-surface-container-lowest overflow-hidden">
  <div class="grid grid-cols-1 lg:grid-cols-12 w-full max-w-full">
    <div class="lg:col-span-5 flex flex-col justify-center px-mobile-padding md:px-desktop-padding py-12 md:py-24 z-10">
      <div class="flex flex-col gap-8 max-w-xl">
        <div class="space-y-4">
          <span class="font-label-sm text-accent uppercase tracking-[0.2em] bg-accent/10 px-4 py-1.5 inline-block">
            Expertise Électrique de Pointe
          </span>
          <h1 class="font-headline-display text-[40px] md:text-[56px] leading-[1.1] text-primary">${name}</h1>
          <p class="text-lg text-on-surface-variant leading-relaxed">
            ${city ? `À ${city}, ` : ""}nous redéfinissons l'art de l'installation électrique. Une précision technique sans compromis pour une sécurité absolue de vos infrastructures.
          </p>
        </div>
        <div class="flex flex-wrap gap-4 pt-4">
          ${phoneNoSpace ? `<a class="font-label-lg bg-primary text-on-primary px-10 py-5 hover:bg-zinc-800 transition-all uppercase tracking-widest" href="tel:${phoneNoSpace}">Lancer votre projet</a>` : ""}
          <a class="font-label-lg bg-transparent text-primary border border-primary px-10 py-5 hover:bg-surface-variant transition-all uppercase tracking-widest" href="#technique">Découvrir nos solutions</a>
        </div>
        <div class="grid grid-cols-3 gap-6 pt-12 border-t border-outline-variant">
          <div class="flex flex-col gap-2"><span class="material-symbols-outlined text-accent text-3xl">verified</span><span class="font-label-sm text-on-surface uppercase tracking-tight">Qualifelec</span></div>
          <div class="flex flex-col gap-2"><span class="material-symbols-outlined text-accent text-3xl">description</span><span class="font-label-sm text-on-surface uppercase tracking-tight">Étude Gratuite</span></div>
          <div class="flex flex-col gap-2"><span class="material-symbols-outlined text-accent text-3xl">shield</span><span class="font-label-sm text-on-surface uppercase tracking-tight">Décennale</span></div>
        </div>
      </div>
    </div>
    <div class="lg:col-span-7 relative h-[50vh] lg:h-auto min-h-[500px]">
      <div class="absolute inset-0 bg-gradient-to-r from-surface-container-lowest to-transparent z-10 hidden lg:block"></div>
      <img alt="${name}" class="object-cover w-full h-full grayscale-[10%] contrast-110" src="${heroImg}"/>
      <div class="absolute bottom-12 right-12 w-32 h-32 border-r-4 border-b-4 border-accent opacity-50"></div>
    </div>
  </div>
</section>

<!-- Technical Mastery Section -->
<section id="technique" class="bg-primary text-on-primary py-section-gap relative overflow-hidden">
  <div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding relative z-10">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
      <div class="relative group">
        <div class="absolute -inset-4 bg-accent/20 scale-95 group-hover:scale-100 transition-transform duration-700"></div>
        <img alt="Composants électriques de précision" class="relative z-10 w-full h-[600px] object-cover shadow-2xl" src="${techImg}"/>
      </div>
      <div class="flex flex-col gap-8">
        <h2 class="font-headline-display text-3xl md:text-5xl">La Précision comme Signature</h2>
        <div class="space-y-6 text-surface-variant text-lg">
          <p>Chaque raccordement, chaque gainage et chaque module est installé avec une rigueur mathématique. Nous croyons que la beauté d'une installation électrique réside dans son organisation invisible.</p>
          <ul class="space-y-4">
            <li class="flex items-start gap-4"><span class="material-symbols-outlined text-accent mt-1">check_circle</span><div><h4 class="font-bold text-white">Domotique Intégrée</h4><p class="text-sm opacity-80">Systèmes intelligents pour une gestion optimisée de l'énergie.</p></div></li>
            <li class="flex items-start gap-4"><span class="material-symbols-outlined text-accent mt-1">check_circle</span><div><h4 class="font-bold text-white">Mise en Conformité</h4><p class="text-sm opacity-80">Remise aux normes NF C 15-100 pour une sécurité totale.</p></div></li>
            <li class="flex items-start gap-4"><span class="material-symbols-outlined text-accent mt-1">check_circle</span><div><h4 class="font-bold text-white">Bornes Véhicules Électriques</h4><p class="text-sm opacity-80">Installation IRVE certifiée, éligible aux aides nationales.</p></div></li>
            <li class="flex items-start gap-4"><span class="material-symbols-outlined text-accent mt-1">check_circle</span><div><h4 class="font-bold text-white">Dépannage 7j/7</h4><p class="text-sm opacity-80">Intervention rapide pour les urgences électriques${city ? ` à ${city}` : ""}.</p></div></li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- Materiality Section -->
<section id="materiaux" class="grid grid-cols-1 md:grid-cols-2 bg-surface-container-low">
  <div class="h-[600px] relative overflow-hidden">
    <img alt="Matériaux nobles" class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" src="${matImg}"/>
    <div class="absolute inset-0 bg-primary/20"></div>
  </div>
  <div class="flex flex-col justify-center p-12 md:p-24 bg-white border-l border-outline-variant">
    <span class="font-label-sm text-accent tracking-widest mb-4">L'ART DE LA MATIÈRE</span>
    <h3 class="font-headline-lg text-4xl mb-6">Matériaux Nobles, Sécurité Durable</h3>
    <p class="text-on-surface-variant leading-relaxed mb-8">Nous sélectionnons exclusivement des composants de rang industriel pour garantir la pérennité de vos installations. Du cuivre haute pureté aux disjoncteurs de dernière génération, la qualité ne souffre d'aucune concession.</p>
    <div class="grid grid-cols-2 gap-8">
      <div class="border-l-2 border-accent pl-4"><span class="block font-headline-lg text-3xl">100%</span><span class="text-xs uppercase tracking-widest opacity-60">Matériel Certifié</span></div>
      <div class="border-l-2 border-accent pl-4"><span class="block font-headline-lg text-3xl">15+</span><span class="text-xs uppercase tracking-widest opacity-60">Ans d'Expertise</span></div>
    </div>
  </div>
</section>

<!-- Contact Section -->
<section id="contact" class="py-section-gap bg-surface px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto text-center">
    <span class="font-label-sm text-accent uppercase tracking-[0.2em] mb-4 inline-block">Nous joindre</span>
    <h2 class="font-headline-display text-3xl md:text-5xl text-primary mb-4">Parlons de votre projet</h2>
    <div class="w-24 h-1 bg-accent mx-auto mb-16"></div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
      ${phoneNoSpace ? `<a href="tel:${phoneNoSpace}" class="group bg-white p-10 border border-outline-variant hover:border-accent transition-all"><span class="material-symbols-outlined text-accent text-4xl mb-4 group-hover:scale-110 inline-block transition-transform" style="font-variation-settings: 'FILL' 1;">call</span><div class="font-headline-lg text-xl mb-2">Téléphone</div><div class="text-on-surface-variant">${phone}</div></a>` : ""}
      ${email ? `<a href="mailto:${email}" class="group bg-white p-10 border border-outline-variant hover:border-accent transition-all"><span class="material-symbols-outlined text-accent text-4xl mb-4 group-hover:scale-110 inline-block transition-transform" style="font-variation-settings: 'FILL' 1;">mail</span><div class="font-headline-lg text-xl mb-2">Email</div><div class="text-on-surface-variant text-sm break-all">${email}</div></a>` : ""}
      ${address ? `<div class="group bg-white p-10 border border-outline-variant hover:border-accent transition-all"><span class="material-symbols-outlined text-accent text-4xl mb-4 inline-block" style="font-variation-settings: 'FILL' 1;">location_on</span><div class="font-headline-lg text-xl mb-2">Atelier</div><div class="text-on-surface-variant text-sm">${address}${city ? `<br/>${city}` : ""}</div>${navQuery ? `<a href="https://www.google.com/maps/dir/?api=1&destination=${navQuery}" target="_blank" rel="noopener" class="text-accent text-xs uppercase tracking-widest mt-3 inline-block">M'y rendre →</a>` : ""}</div>` : ""}
    </div>
  </div>
</section>
</main>

<!-- Footer -->
<footer class="bg-surface-container-highest w-full border-t border-outline-variant">
  <div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding py-16">
    <div class="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
      <div class="md:col-span-4">
        <div class="font-headline-lg text-3xl text-primary mb-4">${nameUpper}</div>
        <p class="text-on-surface-variant max-w-xs">L'excellence de l'installation électrique au service du patrimoine et de l'innovation${city ? `, à ${city}` : ""}.</p>
      </div>
      <div class="md:col-span-4 flex flex-col gap-4">
        <span class="font-label-lg text-primary uppercase tracking-widest">Notre savoir-faire</span>
        <nav class="flex flex-col gap-2">
          <a class="text-on-surface-variant hover:text-accent transition-colors" href="#technique">Précision technique</a>
          <a class="text-on-surface-variant hover:text-accent transition-colors" href="#materiaux">Matériaux nobles</a>
          <a class="text-on-surface-variant hover:text-accent transition-colors" href="#contact">Contact</a>
        </nav>
      </div>
      <div class="md:col-span-4 flex flex-col gap-4">
        <span class="font-label-lg text-primary uppercase tracking-widest">Contact</span>
        ${phoneNoSpace ? `<a href="tel:${phoneNoSpace}" class="text-on-surface-variant hover:text-accent transition-colors">${phone}</a>` : ""}
        ${email ? `<a href="mailto:${email}" class="text-on-surface-variant hover:text-accent transition-colors text-sm">${email}</a>` : ""}
        <p class="text-on-surface-variant italic text-sm">Disponible pour vos projets${city ? ` à ${city} et ses environs` : ""}.</p>
        <div class="h-px bg-outline-variant w-full my-2"></div>
        <div class="text-sm text-on-surface-variant">© 2026 ${nameUpper} · Site Klyora Sites · Maître artisan</div>
      </div>
    </div>
  </div>
</footer>
</body></html>`;
}
