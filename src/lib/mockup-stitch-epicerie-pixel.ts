/**
 * Template Stitch EPICERIE — pixel-pixel copy de :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/picerie_fine_name_1/code.html
 *
 * Substitutions minimales (le DESIGN n'est PAS touché) :
 * - {{NAME}} → p.name | {{CITY}} → p.city
 * - tous les téléphones → p.phone (auto-detect via regex)
 * - "12 rue des Artisans" et similaires → p.address
 * - nav sticky top-0 → sticky top-[54px] (passe sous la sales-ui-bar 54px)
 * - année footer dynamique
 */

export type EpiceriePixelProspect = {
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
  site_style_dna?: unknown;
};

import { renderStitchHoursInline } from "./mockup-stitch-pixel-helpers";

const esc = (s: string | null | undefined): string =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function generateStitchEpiceriePixelMockupHtml(p: EpiceriePixelProspect): string {
  const name = esc(p.name || "");
  const city = esc(p.city || "votre ville");
  const phoneDisplay = esc(p.phone || "");
  const phoneDigits = (p.phone || "").replace(/[^\d+]/g, "");
  const addressDisplay = p.address ? esc(p.address) : `12 rue principale, ${city}`;
  const year = new Date().getFullYear();
  const hoursInline = renderStitchHoursInline(p.hours, "${hoursInline}");
  return `<!DOCTYPE html>

<html class="scroll-smooth" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Épicerie Fine à ${city} | ${name}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700;800&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
        .material-symbols-outlined {
            font-family: 'Material Symbols Outlined';
            font-weight: normal;
            font-style: normal;
            font-size: 24px;
            line-height: 1;
            letter-spacing: normal;
            text-transform: none;
            display: inline-block;
            white-space: nowrap;
            word-wrap: normal;
            direction: ltr;
            -webkit-font-feature-settings: 'liga';
            -webkit-font-smoothing: antialiased;
        }

        /* Texture de grain subtile */
        body::before {
            content: "";
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 9999;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.04;
        }

        .img-overlay::after {
             content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.04;
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "tertiary-fixed-dim": "#cac6c4",
                        "surface-container-lowest": "#ffffff",
                        "tertiary-container": "#1c1b1a",
                        "on-tertiary-container": "#868382",
                        "primary": "#000000",
                        "surface-tint": "#5f5e5e",
                        "secondary": "#5e5e5e",
                        "primary-fixed": "#e5e2e1",
                        "tertiary-fixed": "#e6e2df",
                        "on-tertiary": "#ffffff",
                        "tertiary": "#000000",
                        "secondary-fixed-dim": "#c7c6c6",
                        "surface-container-high": "#ebe7e6",
                        "inverse-on-surface": "#f4f0ef",
                        "secondary-container": "#e1dfdf",
                        "on-surface": "#1c1b1b",
                        "outline-variant": "#c4c7c7",
                        "on-secondary": "#ffffff",
                        "error-container": "#ffdad6",
                        "surface-bright": "#fdf8f8",
                        "primary-container": "#1c1b1b",
                        "on-background": "#1c1b1b",
                        "on-error-container": "#93000a",
                        "surface-dim": "#ddd9d8",
                        "outline": "#747878",
                        "surface-container-highest": "#e5e2e1",
                        "surface-container-low": "#f7f3f2",
                        "secondary-fixed": "#e4e2e2",
                        "inverse-primary": "#c8c6c5",
                        "on-tertiary-fixed-variant": "#484645",
                        "on-tertiary-fixed": "#1c1b1a",
                        "primary-fixed-dim": "#c8c6c5",
                        "on-primary-container": "#858383",
                        "on-primary": "#ffffff",
                        "on-primary-fixed": "#1c1b1b",
                        "on-error": "#ffffff",
                        "surface": "#fdf8f8",
                        "on-surface-variant": "#444748",
                        "inverse-surface": "#313030",
                        "on-secondary-fixed": "#1b1c1c",
                        "surface-container": "#f1edec",
                        "on-secondary-container": "#626263",
                        "background": "#fdf8f8",
                        "error": "#ba1a1a",
                        "on-secondary-fixed-variant": "#464747",
                        "surface-variant": "#e5e2e1",
                        "on-primary-fixed-variant": "#474746"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-gap": "1rem",
                        "section-gap": "5rem",
                        "container-max": "1200px",
                        "mobile-padding": "1.5rem",
                        "desktop-padding": "4rem"
                    },
                    "fontFamily": {
                        "headline-lg": ["EB Garamond", "serif"],
                        "label-sm": ["Plus Jakarta Sans", "sans-serif"],
                        "headline-lg-mobile": ["EB Garamond", "serif"],
                        "label-lg": ["Plus Jakarta Sans", "sans-serif"],
                        "body-md": ["Plus Jakarta Sans", "sans-serif"],
                        "headline-display": ["EB Garamond", "serif"]
                    },
                    "fontSize": {
                        "headline-lg": ["36px", { "lineHeight": "1.3", "fontWeight": "500" }],
                        "label-sm": ["12px", { "lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600" }],
                        "headline-lg-mobile": ["30px", { "lineHeight": "1.3", "fontWeight": "600" }],
                        "label-lg": ["14px", { "lineHeight": "1.2", "letterSpacing": "0.08em", "fontWeight": "700" }],
                        "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
                        "headline-display": ["48px", { "lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-surface text-on-surface antialiased min-h-screen selection:bg-primary selection:text-on-primary">
<!-- TopNavBar -->
<header class="bg-surface/95 dark:bg-surface-container-highest/95 backdrop-blur-sm full-width top-0 sticky z-50 shadow-sm border-b border-outline-variant dark:border-outline">
<div class="max-w-[1200px] mx-auto flex justify-between items-center px-mobile-padding md:px-desktop-padding py-4">
<a class="font-headline-lg text-headline-lg md:font-headline-lg font-bold text-primary dark:text-on-primary flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm" href="#">
                ${name}
            </a>
<nav aria-label="Menu principal" class="hidden md:flex gap-8 items-center">
<a aria-current="page" class="text-primary dark:text-inverse-primary border-b-2 border-primary pb-1 font-label-lg text-label-lg hover:opacity-80 transition-opacity duration-300 active:scale-95 transition-transform" href="#accueil">Accueil</a>
<a class="text-on-surface-variant dark:text-surface-variant hover:text-primary font-label-lg text-label-lg hover:opacity-80 transition-opacity duration-300 active:scale-95 transition-transform" href="#savoir-faire">Savoir-faire</a>
<a class="text-on-surface-variant dark:text-surface-variant hover:text-primary font-label-lg text-label-lg hover:opacity-80 transition-opacity duration-300 active:scale-95 transition-transform" href="#services">Services</a>
<a class="text-on-surface-variant dark:text-surface-variant hover:text-primary font-label-lg text-label-lg hover:opacity-80 transition-opacity duration-300 active:scale-95 transition-transform" href="#contact">Contact</a>
</nav>
<div class="hidden md:block">
<a class="inline-flex items-center justify-center px-6 py-3 bg-primary text-on-primary rounded-DEFAULT font-label-lg text-label-lg uppercase tracking-wider hover:opacity-80 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary active:scale-95" href="#contact">
                    Devis
                </a>
</div>
<!-- Mobile Menu Button -->
<button aria-label="Ouvrir le menu" class="md:hidden text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary p-2 rounded-sm">
<span class="material-symbols-outlined" data-icon="menu">menu</span>
</button>
</div>
</header>
<main>
<!-- Hero Section -->
<section class="relative pt-section-gap pb-section-gap px-mobile-padding md:px-desktop-padding max-w-[1200px] mx-auto flex flex-col md:flex-row items-center gap-12 min-h-[819px]" id="accueil">
<div class="flex-1 space-y-6 z-10">
<p class="font-label-lg text-label-lg text-primary uppercase tracking-widest flex items-center gap-2">
<span class="w-8 h-[1px] bg-primary"></span> Circuit court, sélection rare
                </p>
<h1 class="font-headline-display text-headline-lg-mobile md:text-headline-display text-primary leading-tight">
                    Épicerie fine à <br/><span class="italic text-surface-tint">${city}</span>
</h1>
<p class="font-body-md text-body-md text-on-surface-variant max-w-md">
                    Une sélection rigoureuse de produits d'exception. Vins rares, conserves artisanales et fromages affinés, choisis directement chez nos producteurs passionnés.
                </p>
<div class="pt-4 flex flex-wrap gap-4">
<a class="inline-flex items-center justify-center px-8 py-4 bg-primary text-on-primary rounded-DEFAULT font-label-lg text-label-lg uppercase tracking-wider hover:opacity-80 transition-opacity shadow-[0_8px_30px_rgb(0,0,0,0.12)]" href="#contact">
                        Venir en boutique
                    </a>
</div>
</div>
<div class="flex-1 relative w-full aspect-[4/5] md:aspect-square img-overlay rounded-xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-surface-container-low border border-outline-variant/30">
<div class="absolute inset-0 bg-gradient-to-tr from-surface-container to-surface-bright mix-blend-multiply opacity-50 z-10"></div>
<img alt="Intérieur de notre épicerie fine" class="w-full h-full object-cover z-0" data-alt="Une vue rapprochée de l'intérieur d'une épicerie fine haut de gamme. Des étagères en chêne massif remplies de conserves vintage et de bouteilles de vin avec des étiquettes texturées. La lumière naturelle douce d'une fenêtre crée des ombres délicates sur les surfaces en bois et souligne la texture des bocaux en verre. Ambiance chaleureuse, élégante, corporative et intemporelle. Couleurs dominantes: tons bois, crème, et légères touches d'olive." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDWuHoOJ08J2l6VU_0uIKzgE7X_jC8JCs_fP28epRLLnizYv9Y1yTtLRL2x_TCjRWm9XUB6FellaL42x5R7ssJzW8SIeXGjxuAQIPAvMGEJAmD60O54c0n8FcU0_M4Iwf_I7uH1DvQiVvH_wcnnYvmpEiHxxEPYA31qkXpf-UioAB9GgHsmvuXipzw-AnbI9e8A20GzvDKfXGGdzcQQo0GcvBdoJ7mSbZDY9PhhUtK4Uq34Hkx2hvkhvEvucvYIOvXHaA4lum-UWHE"/>
</div>
</section>
<!-- Savoir-faire Section -->
<section class="bg-surface-container-low py-section-gap border-y border-outline-variant/50" id="savoir-faire">
<div class="max-w-[1200px] mx-auto px-mobile-padding md:px-desktop-padding">
<div class="grid md:grid-cols-2 gap-12 items-center">
<div class="order-2 md:order-1 relative img-overlay rounded-xl overflow-hidden aspect-[3/4] shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
<img alt="Sélection de fromages et vins" class="w-full h-full object-cover" data-alt="Une composition photographique serrée sur des produits artisanaux: un fromage fermier à croûte naturelle sur une épaisse planche à découper en bois vieilli, à côté d'une belle bouteille de vin rouge français posée de biais. Quelques grains de poivre et brins de romarin frais parsèment la scène. Éclairage directionnel dramatique mettant en valeur les textures authentiques. Style éditorial culinaire classique." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMAFSHMgVgjUzX6DOQceIeG16lpa6VJE06KgwSC6x0VRC_MLGs1huPcz499USMiMSbEodx6osNI44qNHW54SxdxfjMn5-aJCiMBw3DcwbFORC-K1t1UDysC6AsZdGWi8rk_FCesqphuw5XfGW5P0_wiyLKkMPW7pOWufRJqTE79DjwyuDjb9_1KaqDKBR5N9TFNmw7tj1xySqTx1OXMQ-fyf1trhTj4V6Dp0AVIiujF-PPIud773cZzTfozQpdW0JLaAsdRF0G1Qg"/>
</div>
<div class="order-1 md:order-2 space-y-6">
<h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">L'Art de la Sélection</h2>
<div class="w-16 h-[2px] bg-primary"></div>
<p class="font-body-md text-body-md text-on-surface-variant">
                            Notre démarche est simple : nous parcourons les terroirs à la recherche de l'excellence. Chaque produit présenté dans notre boutique a été goûté, évalué et sélectionné pour son caractère unique et le savoir-faire de l'artisan qui l'a conçu.
                        </p>
<p class="font-body-md text-body-md text-on-surface-variant">
                            Nous privilégions les circuits courts et les méthodes de production traditionnelles, garantes d'une qualité gustative supérieure et d'un respect absolu du produit originel.
                        </p>
</div>
</div>
</div>
</section>
<!-- Services (Bento Grid) -->
<section class="py-section-gap max-w-[1200px] mx-auto px-mobile-padding md:px-desktop-padding" id="services">
<div class="text-center mb-12">
<h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-4">Notre Cave &amp; Épicerie</h2>
<p class="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">Découvrez les trésors de notre sélection quotidienne.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-6 auto-rows-[300px]">
<!-- Bento Item 1: Vins -->
<div class="md:col-span-2 md:row-span-1 relative rounded-xl overflow-hidden group bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/30 flex items-end">
<img alt="Cave à vins" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="Un alignement de bouteilles de vin rouge et blanc haut de gamme sur des présentoirs métalliques élégants dans une cave voûtée. La mise au point est faite sur l'étiquette d'un Grand Cru au centre, avec un flou de profondeur de champ. Éclairage chaud et tamisé accentuant les reflets sur le verre sombre des bouteilles. Ambiance de cave traditionnelle française, luxueuse et feutrée." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAt9J9hNox11B5Fxwp4hAXsEPIwkNmYVfIMJ_9IKeFktKbTWCeBAd3q_u-oj8aeYKTsHrqMZL5cMEyNA8mzGxFDevEWZb5gk0tIIyZNCKM76ziDPPbwkyl0VxPgB6ssEJ_Wc9ABh95XOiitF01LuM3afBVQcZW2ePIHvXdnBs6ChRfMJ7ojarELD880zOCkA7cngoLapVhwE8R5TqxndNDmJ12jInLUnSlBEynWK6paxglfP2ysVaMUZnaHGYrU44Mc9pOH9xJ4lOE"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/40 to-transparent"></div>
<div class="relative z-10 p-6 md:p-8 w-full">
<span class="material-symbols-outlined text-surface mb-2" data-icon="wine_bar">wine_bar</span>
<h3 class="font-headline-lg text-headline-lg text-surface mb-2">Vins d'Exception</h3>
<p class="font-body-md text-body-md text-surface-container-low/90 hidden md:block">Une sélection minutieuse de cuvées confidentielles et de grands classiques.</p>
</div>
</div>
<!-- Bento Item 2: Conserves -->
<div class="md:col-span-1 md:row-span-1 relative rounded-xl overflow-hidden group bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/30 flex items-end">
<img alt="Conserves artisanales" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="Gros plan sur une collection de conserves artisanales au design vintage empilées soigneusement. Des sardines à l'huile d'olive, des rillettes de la mer, avec des emballages en papier texturé et des typographies anciennes. Lumière douce mettant en valeur les détails d'impression dorée sur les boîtes. Atmosphère authentique de garde-manger chic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBtcVyBTGYW7W313pghgRAhKZ1jlWQfbI85mIJkDNlLdWhcS9kb_1PZM4N-j6UhWeCwD_NqDpYgw6TzsNcB_vihCnGTvO3E9fXI5ByuRNAQwUIYvMEyxXGzDlVnpUIvjlCeLAiINbldqjYznM5l5agPwJq858OvtUjyCU6MIdzzwrPYdgse853_wWcqucuQtioYQm56nussgHkWVnwylSDZNQWlhYPl9A7beLXNDpXGCWzkQ43GUyhFFT7sPB7GktA7dNayGv3KfAA"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent"></div>
<div class="relative z-10 p-6 w-full">
<span class="material-symbols-outlined text-surface mb-2" data-icon="inventory_2">inventory_2</span>
<h3 class="font-headline-lg text-2xl font-medium text-surface mb-1">Conserves</h3>
</div>
</div>
<!-- Bento Item 3: Fromages -->
<div class="md:col-span-1 md:row-span-1 relative rounded-xl overflow-hidden group bg-surface shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-outline-variant/30 flex items-end">
<img alt="Fromages affinés" class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="Une meule de fromage de montagne rustique partiellement découpée sur un plateau en bois noble, accompagnée d'un couteau à fromage au manche en corne. Le grain de la croûte fleurie est détaillé. Éclairage latéral soulignant la pâte généreuse du fromage. Style rustique-chic, photographié en gros plan, atmosphère d'authenticité terroir." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAThIEBRoCQi_tv-rG-GwQe5DfZfwNFW8Zdg7XeYLX7T10xNDuncAOfysB_4DhnTjWPNqKdeNyOIhIf4LrL8QL3XNE5DDCfFxinxKHa5ayGUCKG0dEuHdZvCG7kHz662ho57Cl2AyJO1IJaf0S2TYZ7t4lrToJnyf0UJhlEQuMd5QmUXNPuY_-EUVpF_nzrrXixbPZ_BYKyIZQgy7GukTj0HczJO6SevUK3x8sH3gxrA2KGzpuJIRS2xpiwkL5kR6RapIbnEpIqdA4"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary/90 via-primary/30 to-transparent"></div>
<div class="relative z-10 p-6 w-full">
<span class="material-symbols-outlined text-surface mb-2" data-icon="restaurant">restaurant</span>
<h3 class="font-headline-lg text-2xl font-medium text-surface mb-1">Fromages</h3>
</div>
</div>
<!-- Bento Item 4: Producteurs & Coffrets -->
<div class="md:col-span-2 md:row-span-1 bg-surface-container-high rounded-xl p-8 flex flex-col justify-center border border-outline-variant/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
<div class="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
<div>
<h3 class="font-headline-lg text-headline-lg text-primary mb-3">Nos Producteurs &amp; Coffrets</h3>
<p class="font-body-md text-body-md text-on-surface-variant max-w-md mb-6">Soutenez les artisans locaux et offrez le meilleur de notre terroir grâce à nos compositions sur mesure.</p>
<a class="inline-flex items-center gap-2 font-label-lg text-label-lg text-primary uppercase tracking-widest hover:opacity-70 transition-opacity" href="#contact">
                                Découvrir nos offres <span class="material-symbols-outlined text-sm" data-icon="arrow_forward">arrow_forward</span>
</a>
</div>
<div class="grid grid-cols-2 gap-4 w-full md:w-auto">
<div class="w-full aspect-square bg-surface rounded-lg img-overlay relative overflow-hidden">
<img alt="Producteurs" class="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity" data-alt="Gros plan sur les mains calleuses d'un artisan arrangeant méticuleusement des grappes de raisin dans une cagette en bois brut, sous un soleil matinal. Lumière dorée, détails de la peau et de la poussière. Style documentaire haut de gamme célébrant le travail manuel." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCzJ1hCUByGoX47R3qlaFIk8hI6Uu3wzIsxyZGWeRXoP4QhgWnKS6F5m55N1CqXQlCO3gfpohWddmFVNzbY1JpmqoqlPwGXZV9YUQmjyTP7UX9v-rzJCUwazJ-gDlRVUntTyNfO8XWbx40JP-NG4ahNCEoyaQMrvUI-IVlCNno3w7DN0Pq-aOItwxTkX1RYn569Q97lklky1aAwhN1p_1XiVhXGE3OtVP7ZGpSXBvLmf-WkEzzjiVxQuKJwsAOmv1CHKsXTpUgfUtY"/>
</div>
<div class="w-full aspect-square bg-surface rounded-lg img-overlay relative overflow-hidden">
<img alt="Coffrets" class="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity" data-alt="Un luxueux coffret cadeau ouvert en carton fort beige, rempli de frisure de bois protégeant un assortiment de produits d'épicerie fine: terrines, confitures et une petite bouteille. Un ruban en coton brut lie l'ensemble. Posé sur une table en chêne. Minimaliste, élégant, lumière studio soignée." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAVZeNDw-e3hX7ObSZ0ciKAXez3O_ROvKRgD7KYGp3Esb5KxQb7zXWfMRf9271U2_jsGhgtLJdgmnAD1kRbauGFZljpGhun2PD2e2V1LS7V6k17fVrLi9p7OFUomI8hlcze8j_xPOZGXUuEzSy7RKoGk6-xB6oj2v6_sxN9N3REvn7ib8jfzYizWv_AEyuW0s8ltOkVKr5ymxxGgPQvkyXqWZ3cf89yNUxMrysqIYElmd2ZEVNb5Z2pAJ0JkPdlBjzp3DNgNrEsTuo"/>
</div>
</div>
</div>
</div>
</div>
</section>
<!-- Contact Section -->
<section class="bg-surface py-section-gap border-t border-outline-variant/30" id="contact">
<div class="max-w-[1200px] mx-auto px-mobile-padding md:px-desktop-padding grid md:grid-cols-2 gap-16">
<div>
<h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-6">Nous Rendre Visite</h2>
<p class="font-body-md text-body-md text-on-surface-variant mb-8">Venez découvrir notre sélection en boutique ou contactez-nous pour préparer vos coffrets sur-mesure.</p>
<ul class="space-y-6">
<li class="flex items-start gap-4">
<span class="material-symbols-outlined text-surface-tint mt-1" data-icon="location_on">location_on</span>
<div>
<p class="font-label-lg text-label-lg text-primary">Adresse</p>
<p class="font-body-md text-body-md text-on-surface-variant">${addressDisplay}, Centre Ville<br/>${city}</p>
</div>
</li>
<li class="flex items-start gap-4">
<span class="material-symbols-outlined text-surface-tint mt-1" data-icon="schedule">schedule</span>
<div>
<p class="font-label-lg text-label-lg text-primary">Horaires</p>
<p class="font-body-md text-body-md text-on-surface-variant">${hoursInline}</p>
</div>
</li>
</ul>
</div>
<div class="bg-surface-container-low p-8 rounded-xl border border-outline-variant/50 shadow-[0_4px_20px_rgb(0,0,0,0.03)]">
<form class="space-y-4">
<div>
<label class="block font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-widest" for="name">Nom complet</label>
<input class="w-full bg-surface border-outline-variant focus:border-primary focus:ring-primary rounded-md shadow-sm font-body-md text-body-md" id="name" placeholder="Votre nom" type="text"/>
</div>
<div>
<label class="block font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-widest" for="email">Email</label>
<input class="w-full bg-surface border-outline-variant focus:border-primary focus:ring-primary rounded-md shadow-sm font-body-md text-body-md" id="email" placeholder="vous@exemple.com" type="email"/>
</div>
<div>
<label class="block font-label-sm text-label-sm text-on-surface-variant mb-1 uppercase tracking-widest" for="message">Message (Demande de devis, coffrets...)</label>
<textarea class="w-full bg-surface border-outline-variant focus:border-primary focus:ring-primary rounded-md shadow-sm font-body-md text-body-md" id="message" placeholder="Comment pouvons-nous vous aider ?" rows="4"></textarea>
</div>
<button class="w-full px-6 py-3 bg-surface-tint text-on-primary rounded-DEFAULT font-label-lg text-label-lg uppercase tracking-wider hover:bg-primary transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary mt-4" type="submit">
                            Envoyer la demande
                        </button>
</form>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="bg-surface-container-high dark:bg-tertiary-container full-width border-t border-outline-variant py-section-gap">
<div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-stack-gap px-mobile-padding md:px-desktop-padding">
<!-- Brand -->
<div class="flex flex-col gap-4">
<span class="font-headline-lg text-headline-lg text-on-surface dark:text-on-tertiary-container font-bold">
                    ${name}
                </span>
<p class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 max-w-xs">
                    L'excellence de l'épicerie fine et de la cave à vins, au cœur de ${city}.
                </p>
</div>
<!-- Links -->
<div class="flex flex-col gap-3 md:items-center">
<nav class="flex flex-col gap-2">
<a class="font-label-sm text-label-sm text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary w-fit" href="#">Mentions Légales</a>
<a class="font-label-sm text-label-sm text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary w-fit" href="#">Confidentialité</a>
<a class="font-label-sm text-label-sm text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary w-fit" href="#">CGV</a>
</nav>
</div>
<!-- Copyright -->
<div class="flex md:justify-end items-end">
<p class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70">
                    © ${year} ${name}. Tous droits réservés.
                </p>
</div>
</div>
</footer>
<!-- FAB Mobile (Hidden on Desktop) -->
<a aria-label="Nous contacter" class="md:hidden fixed bottom-6 right-6 bg-primary text-on-primary w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.2)] z-50 hover:scale-105 active:scale-95 transition-transform" href="#contact">
<span class="material-symbols-outlined" data-icon="storefront">storefront</span>
</a>
</body></html>`;
}
