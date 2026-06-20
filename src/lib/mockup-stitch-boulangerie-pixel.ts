/**
 * Template Stitch BOULANGERIE — pixel-pixel copy du dossier officiel :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/boulangerie_name_1/code.html
 *
 * Modifications minimes (NE PAS toucher au design) :
 * 1. {{NAME}} → p.name escape
 * 2. {{CITY}} → p.city escape (fallback "votre ville")
 * 3. {{PHONE}} → p.phone réel
 * 4. {{PHONE_DIGITS}} → p.phone sans espaces (pour tel:)
 * 5. {{ADDRESS}} → p.address + p.city
 * 6. {{HOURS}} → p.hours parsé en grille jour/horaire
 * 7. {{REVIEWS}} → top 3 reviews Google si dispo, sinon témoignages fictifs originaux
 * 8. NAV : sticky top-[54px] z-40 (au lieu de top-0 z-50) pour ne pas
 *    être cachée par la sales-ui-bar (54px de haut, injectée par
 *    /prospects/[slug]/route.ts).
 *
 * Tout le reste est COPIÉ TEL QUEL.
 */

export type BoulangeriePixelProspect = {
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
};

const esc = (s: string | null | undefined): string =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

// Parser horaires Google "lundi: 08:30 – 12:00, 13:30 – 18:00 | mardi: …"
// → ligne par ligne pour la grille
function buildHoursRows(hoursStr: string | null | undefined): string {
  if (!hoursStr) {
    // Fallback : horaires fictifs originaux du template Stitch
    return `<p>Mar - Sam</p> <p class="font-bold">06:30 — 19:30</p>
                <p>Dimanche</p> <p class="font-bold">07:00 — 13:00</p>
                <p>Lundi</p> <p>Fermé</p>`;
  }
  const lines = hoursStr.split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean);
  if (lines.length === 0) {
    return `<p>Mar - Sam</p> <p class="font-bold">06:30 — 19:30</p>
                <p>Dimanche</p> <p class="font-bold">07:00 — 13:00</p>
                <p>Lundi</p> <p>Fermé</p>`;
  }
  return lines.map(line => {
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (!m) return `<p>${esc(line)}</p> <p></p>`;
    const day = esc(m[1].trim());
    const hrs = esc(m[2].trim());
    const isClosed = /ferm[ée]/i.test(hrs);
    return `<p class="capitalize">${day}</p> <p class="${isClosed ? "" : "font-bold"}">${hrs}</p>`;
  }).join("\n                ");
}

// Top 3 reviews Google → garde la STRUCTURE EXACTE du template Stitch original.
// Si aucun avis → fallback aux 3 témoignages originaux du template.
function buildReviewsHtml(reviews: BoulangeriePixelProspect["reviews"]): string {
  const orig = [
    {
      text: "On ne vient pas ici seulement pour acheter du pain, mais pour retrouver une émotion, une odeur d'enfance. Le pain de campagne est tout simplement inégalable.",
      author: "Marie-Laure D.",
    },
    {
      text: "La qualité des farines se ressent immédiatement. Une digestibilité parfaite et une conservation incroyable. On sent la passion dans chaque miche.",
      author: "Julien R.",
    },
    {
      text: "Leurs viennoiseries sont de véritables bijoux. Le feuilletage est une œuvre d'art. Une adresse indispensable pour tous les amoureux du vrai goût.",
      author: "Sophie L.",
    },
  ];
  const real = (reviews || [])
    .filter(r => r.text && (r.text || "").length > 30)
    .slice(0, 3)
    .map(r => ({ text: (r.text || "").slice(0, 280), author: r.author || "Client" }));
  const chosen = real.length === 3 ? real : (real.length > 0 ? [...real, ...orig.slice(real.length)] : orig);
  return chosen.map(r => `<div class="bg-white p-10 rounded-2xl shadow-sm italic text-lg leading-relaxed text-on-surface-variant relative">
                    "${esc(r.text)}"
                    <p class="not-italic font-bold text-sm text-on-surface mt-6 uppercase tracking-widest">— ${esc(r.author)}</p>
</div>`).join("\n");
}

export function generateStitchBoulangeriePixelMockupHtml(p: BoulangeriePixelProspect): string {
  const name = esc(p.name || "Boulangerie");
  const city = esc(p.city || "votre ville");
  const phoneDisplay = esc(p.phone || "01 23 45 67 89");
  const phoneDigits = (p.phone || "01 23 45 67 89").replace(/[^\d+]/g, "");
  const address = p.address ? esc(p.address) : `12 rue des Artisans, ${city}`;
  const hoursRows = buildHoursRows(p.hours);
  const reviewsHtml = buildReviewsHtml(p.reviews);
  const mapQuery = encodeURIComponent(`${p.address || p.name} ${p.city || ""}`);

  return `<!DOCTYPE html>

<html class="light" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Boulangerie Artisanale - ${name}</title>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Tailwind Configuration -->
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "primary": "#c2410c",
                        "on-primary": "#ffffff",
                        "secondary": "#f59e0b",
                        "surface": "#fdf8f8",
                        "on-surface": "#1c1b1b",
                        "surface-container-low": "#f7f3f2",
                        "surface-container-high": "#ebe7e6",
                        "on-surface-variant": "#444748",
                        "outline-variant": "#c4c7c7",
                        "tertiary": "#1c1b1a",
                        "on-tertiary": "#ffffff"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-gap": "1rem",
                        "section-gap": "8rem",
                        "container-max": "1200px",
                        "mobile-padding": "1.5rem",
                        "desktop-padding": "4rem"
                    },
                    "fontFamily": {
                        "headline-lg": ["EB Garamond"],
                        "label-sm": ["Plus Jakarta Sans"],
                        "headline-lg-mobile": ["EB Garamond"],
                        "label-lg": ["Plus Jakarta Sans"],
                        "body-md": ["Plus Jakarta Sans"],
                        "headline-display": ["EB Garamond"]
                    },
                    "fontSize": {
                        "headline-lg": ["36px", { "lineHeight": "1.3", "fontWeight": "500" }],
                        "label-sm": ["12px", { "lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600" }],
                        "headline-lg-mobile": ["30px", { "lineHeight": "1.3", "fontWeight": "600" }],
                        "label-lg": ["14px", { "lineHeight": "1.2", "letterSpacing": "0.08em", "fontWeight": "700" }],
                        "body-md": ["18px", { "lineHeight": "1.7", "fontWeight": "400" }],
                        "headline-display": ["64px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
        .texture-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 9999;
            opacity: 0.05;
            background-image: url('data:image/svg+xml,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        html { scroll-behavior: smooth; }
        .serif-italic { font-family: 'EB Garamond'; font-style: italic; }
        .hero-gradient { background: linear-gradient(to right, rgba(253, 248, 248, 1) 20%, rgba(253, 248, 248, 0.6) 50%, rgba(253, 248, 248, 0) 100%); }
    </style>
</head>
<body class="bg-surface text-on-surface antialiased min-h-screen font-body-md overflow-x-hidden">
<div class="texture-overlay"></div>
<!-- Navigation (sticky top-[54px] z-40 pour passer SOUS la sales-ui-bar de 54px) -->
<header class="bg-surface/90 backdrop-blur-md sticky top-[54px] z-40 border-b border-outline-variant/30">
<div class="max-w-[1400px] mx-auto flex justify-between items-center px-6 md:px-desktop-padding py-6">
<a class="font-headline-lg text-3xl font-bold text-primary flex items-center gap-2" href="#">
            ${name}<span class="w-1.5 h-1.5 bg-secondary rounded-full"></span>
</a>
<nav class="hidden md:flex gap-10 items-center">
<a class="font-label-lg text-on-surface hover:text-primary transition-colors uppercase tracking-widest text-[11px]" href="#histoire">Notre Histoire</a>
<a class="font-label-lg text-on-surface hover:text-primary transition-colors uppercase tracking-widest text-[11px]" href="#levain">L'Art du Levain</a>
<a class="font-label-lg text-on-surface hover:text-primary transition-colors uppercase tracking-widest text-[11px]" href="#produits">La Vitrine</a>
<a class="font-label-lg text-on-surface hover:text-primary transition-colors uppercase tracking-widest text-[11px]" href="#contact">L'Atelier</a>
</nav>
<a class="font-label-lg bg-primary text-on-primary px-8 py-3 rounded-full uppercase tracking-widest text-[12px] hover:bg-secondary transition-all shadow-sm" href="#contact">
            Commander
        </a>
</div>
</header>
<main>
<!-- Hero Section -->
<section class="relative h-[90vh] flex items-center overflow-hidden">
<div class="absolute inset-0 z-0">
<img alt="Bread crust macro" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyabXdVsmaiXhTFJBZSIWuoqN8_BqcOg1vE_dX2ReL7oIpQp7Lpcg2RdZrbBZJMse5ggVWK9_3uqg5Nt2EpB_hz-_N2mqQ2jNGwv7xM7E6n5-9h1P8w6PIuPtG8C5PaC2dH-55YzF15IlKSP6XwSmNxE3TIxHgTQBmUG4fUdJM2Z2_sanaN_tzPTubFZ_kmNs2NEl0WrTH8ugMwSlgKW-nrcgrzypV1rxhatbHFi-smdM0mNw6dt6ZUxmGGqg68FY5gQ1uCJJc6Ug"/>
<div class="absolute inset-0 hero-gradient"></div>
</div>
<div class="max-w-container-max mx-auto px-6 md:px-desktop-padding relative z-10 w-full">
<div class="max-w-3xl">
<span class="font-label-lg text-primary uppercase tracking-[0.3em] mb-6 block text-sm">Depuis 1924 • ${city}</span>
<h1 class="font-headline-display text-headline-display text-on-surface mb-8">
                    Le pain comme une <span class="serif-italic">œuvre de patience.</span>
</h1>
<p class="text-xl text-on-surface-variant mb-12 max-w-xl leading-relaxed">
                    Une immersion sensorielle au cœur de l'artisanat français. Entre farines anciennes et fermentations lentes.
                </p>
<div class="flex items-center gap-8">
<a class="bg-primary text-on-primary px-10 py-5 rounded-full uppercase tracking-widest text-sm hover:scale-105 transition-transform shadow-xl" href="#produits">Découvrir la vitrine</a>
<a class="group flex items-center gap-3 font-label-lg uppercase tracking-widest text-xs" href="#histoire">
                        Notre héritage
                        <span class="material-symbols-outlined group-hover:translate-x-2 transition-transform text-primary">east</span>
</a>
</div>
</div>
</div>
</section>
<!-- Narrative Storytelling: L'Art du Levain -->
<section class="py-section-gap bg-surface" id="levain">
<div class="max-w-container-max mx-auto px-6 md:px-desktop-padding">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
<div class="lg:col-span-7 space-y-12">
<div>
<span class="font-label-lg text-primary uppercase tracking-widest mb-4 block">Manifeste</span>
<h2 class="font-headline-display text-5xl mb-8 leading-tight">L'Art du Levain &amp; la Renaissance des Blés</h2>
<div class="prose prose-lg text-on-surface-variant font-body-md space-y-6 max-w-2xl">
<p class="text-xl leading-relaxed">
                                Au cœur de notre atelier, le temps est suspendu. Contrairement à la boulangerie industrielle qui force la pâte, nous la laissons respirer. Notre levain naturel, entretenu chaque jour comme un héritage vivant, est le secret de cette croûte ambrée et de cette mie alvéolée si caractéristique.
                            </p>
<p>
                                Nous travaillons exclusivement avec des variétés de blés anciens, oubliés par la productivité mais redécouverts pour leur richesse nutritionnelle et leur complexité aromatique. Chaque sac de farine porte le nom d'un paysan-meunier local qui partage notre vision de la terre.
                            </p>
</div>
</div>
<div class="grid grid-cols-2 gap-12 border-t border-outline-variant pt-12">
<div>
<h4 class="font-headline-lg text-2xl mb-2 italic">Fermentation</h4>
<p class="text-sm uppercase tracking-widest text-primary font-bold">24 à 48 Heures</p>
</div>
<div>
<h4 class="font-headline-lg text-2xl mb-2 italic">Ingrédients</h4>
<p class="text-sm uppercase tracking-widest text-primary font-bold">100% Bio &amp; Local</p>
</div>
</div>
</div>
<div class="lg:col-span-5">
<div class="relative aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl">
<img alt="Flour dusting macro" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBLmr46ZN8bumDYHv3ts3iWml45a0GcrnfFXL4sJi90vVf7Bheb_opDTPAKnkBY-0_73FoUFGFBbo8lW6jXPgTUgOhEiA1X3wUXO7FcGO2ioKteM8-4voZKwu63bIEMpFIG9lGabfP_sbbPVwW8Dx3qbHMtHq8W1yyroPkGWZz7KYqAFdwDBIRFsTAQKGjMkZdcLOnnt2nBoNCxqeTPse2mtk2HH50og10As3IOHeX23tRaRxVAI6wkOzUov4mEbuMCoAW0GW0RYHQ"/>
<div class="absolute inset-0 bg-black/10"></div>
</div>
</div>
</div>
</div>
</section>
<!-- Visual Interlude -->
<section class="h-[60vh] relative overflow-hidden">
<img alt="Oven fire macro" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDtuTEnOocvwVhcasdSUInGiEnoUqeREoiKV85px-yjtTcIkLuxZq5G555Yx2t1aVOWb17Xm4Ody3yDR7ODPpLwTb_6j4wFcSWtOQpk4al9ePKueO71HOmEMpo4UTq3L0F3d4noPuxhzS18klUpByKZI-QpBIMQr9CjT7_UMETipanjSMdSBP1n2_jRMJljruVLdzjwtjlp4eBe0wpvLweID28WKJXRU8X-EZ35uSGEis8abynfj-DKv-DaKLrKfe00M3R9kBYsO1E"/>
<div class="absolute inset-0 bg-black/40 flex items-center justify-center text-center">
<h2 class="font-headline-display text-white text-5xl md:text-7xl italic px-4">"Le feu, la pierre, le grain."</h2>
</div>
</section>
<!-- History Section -->
<section class="py-section-gap bg-surface-container-low" id="histoire">
<div class="max-w-container-max mx-auto px-6 md:px-desktop-padding text-center">
<span class="font-label-lg text-primary uppercase tracking-widest mb-4 block">Notre Histoire</span>
<h2 class="font-headline-display text-5xl mb-16">Un siècle de gestes immuables</h2>
<div class="grid grid-cols-1 md:grid-cols-3 gap-12 text-left">
<div class="bg-white p-10 rounded-2xl shadow-sm border border-outline-variant/50">
<span class="font-headline-display text-primary text-4xl mb-6 block">1924</span>
<h3 class="font-headline-lg text-2xl mb-4">La Fondation</h3>
<p class="text-on-surface-variant leading-relaxed">Premier fournil ouvert à ${city} par Jean-Baptiste, avec la volonté de nourrir le quartier de pain pur.</p>
</div>
<div class="bg-white p-10 rounded-2xl shadow-sm border border-outline-variant/50">
<span class="font-headline-display text-primary text-4xl mb-6 block">1970</span>
<h3 class="font-headline-lg text-2xl mb-4">La Résistance</h3>
<p class="text-on-surface-variant leading-relaxed">Face à l'industrialisation, nous avons fait le choix de rester artisanaux, conservant nos méthodes ancestrales.</p>
</div>
<div class="bg-white p-10 rounded-2xl shadow-sm border border-outline-variant/50">
<span class="font-headline-display text-primary text-4xl mb-6 block">Aujourd'hui</span>
<h3 class="font-headline-lg text-2xl mb-4">L'Innovation</h3>
<p class="text-on-surface-variant leading-relaxed">Nous marions le savoir-faire de nos aînés avec une approche contemporaine du goût et de l'éthique.</p>
</div>
</div>
</div>
</section>
<!-- Products: La Vitrine -->
<section class="py-section-gap bg-surface" id="produits">
<div class="max-w-container-max mx-auto px-6 md:px-desktop-padding">
<div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
<div class="max-w-xl">
<span class="font-label-lg text-primary uppercase tracking-widest mb-4 block">La Vitrine</span>
<h2 class="font-headline-display text-5xl">Les Incontournables de ${name}</h2>
</div>
<p class="text-on-surface-variant uppercase tracking-widest text-xs border-b border-primary pb-2">Mise à jour à 06h30 ce matin</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-12 gap-6">
<div class="md:col-span-8 relative group overflow-hidden rounded-2xl aspect-video md:aspect-auto">
<img alt="Viennoiserie assortment" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDj2eISbjx0nHiyp91XJPaubIiqMmA8zE9xh04CN4hF3fXho4ji0rv8LyrTo33B2Ub4tV4_uWukP_1rCh_-M6v1mml8LH2rpiZcNzK_OeXKGbDP6EYfkiDlw125N_rdd8-UuovFiPgf0C2SyHd-WKPnqXF3FBks8_D7aPPMGBdzmg5cL0Ud2Bl7R5fwMqcW-Pr9WYTfKzD9I1JdgrxxlO-mnvRz6JMIqerU01mzEE7g9V-7slDMwRsqDEVbseNs9-sybVszb012XhI"/>
<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
<div class="absolute bottom-10 left-10 text-white">
<h3 class="font-headline-display text-4xl mb-2 italic">L'Excellence du Feuilletage</h3>
<p class="text-white/80 max-w-md">Croissants et pains au chocolat au beurre de baratte, 72h de préparation.</p>
</div>
</div>
<div class="md:col-span-4 space-y-6">
<div class="relative group overflow-hidden rounded-2xl aspect-square">
<img alt="Sourdough bread" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBglhe4mdom7W9Ivbh_fWBJVEXFFFHqKHvXig5TsvHM8yXdaHbbfO_ooNUbNvINnPC00-tnCs7OwpamlcxkBm3wmBUW2BHmCjTiUxtA7vfGz3VNtnGUqRc7IXaTr_UpGXe1SpFnT08nnZk37-USR3okuMvNaCmoy1wB99aXsS8iNnshzmqvW9BOZiEHRIwsBsrusHFXuyRW0KBvkrmnl9_0R1NfFgTXmVXsXlwtGdLngonde17Op1_18RLL8wWfapOk-t74wGn9BAQ"/>
<div class="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors"></div>
<div class="absolute inset-0 flex flex-col justify-center items-center text-white p-8 text-center">
<h3 class="font-headline-lg text-3xl mb-2">Pain de Campagne</h3>
<p class="text-sm uppercase tracking-[0.2em]">Levain Naturel</p>
</div>
</div>
<div class="bg-surface-container-high p-10 rounded-2xl flex flex-col justify-center border border-outline-variant/30">
<h3 class="font-headline-lg text-2xl mb-4 italic">Sur commande</h3>
<p class="text-on-surface-variant mb-6">Plateaux traiteur, pains géants pour vos événements ou pâtisseries de saison.</p>
<a class="text-primary font-bold uppercase tracking-widest text-xs flex items-center gap-2 group" href="#contact">
                            Consulter la carte
                            <span class="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">arrow_forward</span>
</a>
</div>
</div>
</div>
</div>
</section>
<!-- Social Proof -->
<section class="py-section-gap bg-surface-container-low overflow-hidden relative">
<div class="absolute top-0 right-0 p-20 opacity-10 rotate-12 pointer-events-none">
<span class="material-symbols-outlined text-[200px] text-primary">format_quote</span>
</div>
<div class="max-w-container-max mx-auto px-6 md:px-desktop-padding relative z-10">
<div class="text-center mb-16">
<span class="font-label-lg text-primary uppercase tracking-widest mb-4 block">Témoignages</span>
<h2 class="font-headline-display text-5xl">Nos clients adorent</h2>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
${reviewsHtml}
</div>
</div>
</section>
<!-- Contact & Map -->
<section class="py-section-gap bg-surface" id="contact">
<div class="max-w-container-max mx-auto px-6 md:px-desktop-padding">
<div class="grid grid-cols-1 lg:grid-cols-2 gap-20">
<div class="space-y-12">
<div>
<span class="font-label-lg text-primary uppercase tracking-widest mb-4 block">L'Atelier</span>
<h2 class="font-headline-display text-5xl mb-8">Venez nous voir à ${city}</h2>
<p class="text-xl text-on-surface-variant leading-relaxed">Située au cœur du quartier historique, notre boutique vous accueille dans une ambiance chaleureuse où l'odeur du pain chaud vous guide dès l'aurore.</p>
</div>
<div class="space-y-8">
<div class="flex gap-6">
<div class="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
<span class="material-symbols-outlined">location_on</span>
</div>
<div>
<h4 class="font-label-lg uppercase tracking-widest text-xs mb-2">Adresse</h4>
<p class="text-on-surface-variant">${address}</p>
</div>
</div>
<div class="flex gap-6">
<div class="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
<span class="material-symbols-outlined">schedule</span>
</div>
<div>
<h4 class="font-label-lg uppercase tracking-widest text-xs mb-2">Horaires d'ouverture</h4>
<div class="text-on-surface-variant grid grid-cols-2 gap-x-12 gap-y-1">
${hoursRows}
</div>
</div>
</div>
<div class="flex gap-6">
<div class="w-12 h-12 rounded-full bg-surface-container-high flex items-center justify-center text-primary shrink-0">
<span class="material-symbols-outlined">phone</span>
</div>
<div>
<h4 class="font-label-lg uppercase tracking-widest text-xs mb-2">Contact Direct</h4>
<a href="tel:${phoneDigits}" class="text-on-surface-variant font-bold text-lg hover:text-primary">${phoneDisplay}</a>
</div>
</div>
</div>
</div>
<div class="relative h-[500px] lg:h-auto rounded-3xl overflow-hidden shadow-2xl border border-outline-variant/30">
<a href="https://www.google.com/maps/search/?api=1&amp;query=${mapQuery}" target="_blank" rel="noopener" class="block w-full h-full">
<img alt="Map of ${city}" class="w-full h-full object-cover grayscale opacity-80" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbd6gAaOvFnpXygK_ONzSk2XfWWBi9wo1eAK1I6oYXljcFJcL63ERixZ6cGZVsKy3aWFS-p_aFlVMSqdepyJxbtdfw_wXbVJxGItmudbxLqxrJt_e3_sxypWU-xOtUW5hH6OUy2ZDl3ShHnbMcWIGcoe-yWjwlq9CEzBFmO8OxVdMeGHAqtdcpLxYknJ6-ZDm4KraIdWEG3E0hRGfEuG3DagTsF8ShRMelX9CFWlDI-okDz-IgsN59hemLeS2KjklwzjR4cZbLR5c"/>
</a>
<div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
<div class="bg-primary text-on-primary p-6 rounded-2xl shadow-2xl animate-bounce">
<span class="material-symbols-outlined text-3xl">storefront</span>
</div>
</div>
</div>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="bg-tertiary text-on-tertiary pt-24 pb-12">
<div class="max-w-[1400px] mx-auto px-6 md:px-desktop-padding">
<div class="grid grid-cols-1 md:grid-cols-4 gap-16 mb-20">
<div class="md:col-span-2">
<a class="font-headline-lg text-4xl font-bold text-white mb-8 block" href="#">
                    ${name}<span class="w-2 h-2 bg-secondary inline-block rounded-full ml-1"></span>
</a>
<p class="text-on-tertiary/60 max-w-md text-lg leading-relaxed mb-8">
                    Gardiens du goût et défenseurs du savoir-faire artisanal. Nous pétrissons chaque jour une part de notre héritage pour vous offrir l'exceptionnel.
                </p>
<div class="flex gap-6">
<a class="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-tertiary transition-all" href="#">
<span class="material-symbols-outlined text-xl">camera</span>
</a>
<a class="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-tertiary transition-all" href="#">
<span class="material-symbols-outlined text-xl">share</span>
</a>
</div>
</div>
<div>
<h4 class="font-label-lg uppercase tracking-widest text-xs mb-8 text-white/40">Navigation</h4>
<ul class="space-y-4 font-label-lg text-sm">
<li><a class="hover:text-secondary transition-colors" href="#histoire">Notre Histoire</a></li>
<li><a class="hover:text-secondary transition-colors" href="#levain">L'Art du Levain</a></li>
<li><a class="hover:text-secondary transition-colors" href="#produits">La Vitrine</a></li>
<li><a class="hover:text-secondary transition-colors" href="#contact">Commander</a></li>
</ul>
</div>
<div>
<h4 class="font-label-lg uppercase tracking-widest text-xs mb-8 text-white/40">Légal</h4>
<ul class="space-y-4 font-label-lg text-sm text-on-tertiary/60">
<li><a class="hover:text-white transition-colors" href="#">Mentions Légales</a></li>
<li><a class="hover:text-white transition-colors" href="#">Confidentialité</a></li>
<li><a class="hover:text-white transition-colors" href="#">CGV</a></li>
</ul>
</div>
</div>
<div class="border-t border-white/10 pt-12 flex flex-col md:flex-row justify-between items-center gap-6 text-xs uppercase tracking-widest text-white/30">
<p>© ${new Date().getFullYear()} ${name}. Tous droits réservés.</p>
<p>Conçu avec passion à ${city}</p>
</div>
</div>
</footer>
<!-- Floating Action Button -->
<a class="fixed bottom-8 right-8 w-16 h-16 bg-primary text-on-primary rounded-full shadow-2xl flex items-center justify-center z-50 hover:scale-110 hover:bg-secondary transition-all" href="tel:${phoneDigits}">
<span class="material-symbols-outlined text-2xl">call</span>
</a>
</body></html>`;
}
