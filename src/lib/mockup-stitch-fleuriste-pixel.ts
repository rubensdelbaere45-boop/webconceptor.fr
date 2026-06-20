/**
 * Template Stitch FLEURISTE — pixel-pixel copy de :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/fleuriste_name_1/code.html
 *
 * Substitutions minimales (le DESIGN n'est PAS touché) :
 * - {{NAME}} → p.name | {{CITY}} → p.city
 * - tous les téléphones → p.phone (auto-detect via regex)
 * - "12 rue des Artisans" et similaires → p.address
 * - nav sticky top-0 → sticky top-[54px] (passe sous la sales-ui-bar 54px)
 * - année footer dynamique
 */

export type FleuristePixelProspect = {
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

import { renderStitchHoursInline } from "./mockup-stitch-pixel-helpers";

const esc = (s: string | null | undefined): string =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function generateStitchFleuristePixelMockupHtml(p: FleuristePixelProspect): string {
  const name = esc(p.name || "");
  const city = esc(p.city || "votre ville");
  const phoneDisplay = esc(p.phone || "");
  const phoneDigits = (p.phone || "").replace(/[^\d+]/g, "");
  const addressDisplay = p.address ? esc(p.address) : `12 rue principale, ${city}`;
  const year = new Date().getFullYear();
  const hoursInline = renderStitchHoursInline(p.hours, "${hoursInline}");
  return `<!DOCTYPE html>

<html class="light" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Fleuriste artisan à ${city}</title>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&amp;family=Plus+Jakarta+Sans:wght@400;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Custom Theme Configuration -->
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
                    "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
                    "headline-display": ["48px", { "lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "600" }]
            }
          }
        }
      }
    </script>
<style>
        /* Add subtle grain texture overlay */
        .grain-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            opacity: 0.04;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        
        /* Smooth scrolling */
        html { scroll-behavior: smooth; }
        
        /* Button hover states */
        .btn-primary {
            transition: all 0.3s ease;
        }
        .btn-primary:hover {
            opacity: 0.8;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }
        
        /* Ensure specific colors for the prompt requirements via utility classes overriding config if absolutely necessary for the primary/secondary vibe requested while maintaining structure */
        .text-green-custom { color: #166534; }
        .bg-green-custom { background-color: #166534; }
        .border-green-custom { border-color: #166534; }
        .bg-yellow-custom { background-color: #fde68a; }
        
        /* Material symbols basic setup */
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
</head>
<body class="bg-surface text-on-surface antialiased relative">
<!-- Grain Texture -->
<div class="grain-overlay"></div>
<!-- TopNavBar (Shared Component) -->
<nav class="bg-surface/95 dark:bg-surface-container-highest/95 backdrop-blur-sm w-full sticky top-[54px] z-40 border-b border-outline-variant shadow-sm transition-transform duration-300" id="topNav">
<div class="max-w-[1200px] mx-auto flex justify-between items-center px-mobile-padding md:px-desktop-padding py-4">
<!-- Brand Logo -->
<a class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-primary dark:text-on-primary flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full" href="#">
                ${name}
            </a>
<!-- Desktop Navigation Links -->
<div class="hidden md:flex items-center gap-6">
<!-- Accueil is Active based on this being the home page -->
<a class="font-label-lg text-label-lg text-primary border-b-2 border-primary pb-1 hover:opacity-80 transition-opacity duration-300" href="#accueil">
                    Accueil
                </a>
<a class="font-label-lg text-label-lg text-on-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300" href="#savoir-faire">
                    Savoir-faire
                </a>
<a class="font-label-lg text-label-lg text-on-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300" href="#services">
                    Services
                </a>
<a class="font-label-lg text-label-lg text-on-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300" href="#contact">
                    Contact
                </a>
</div>
<!-- Trailing Action -->
<a class="hidden md:inline-flex bg-primary text-on-primary font-label-lg text-label-lg px-6 py-3 rounded uppercase tracking-[0.08em] btn-primary items-center gap-2" href="#contact">
                Devis
            </a>
<!-- Mobile Menu Toggle -->
<button aria-label="Menu" class="md:hidden text-on-surface p-2 focus:outline-none focus:ring-2 focus:ring-primary rounded" id="mobileMenuBtn">
<span class="material-symbols-outlined">menu</span>
</button>
</div>
<!-- Mobile Dropdown Menu -->
<div class="md:hidden hidden bg-surface border-t border-outline-variant absolute w-full left-0 top-full shadow-lg" id="mobileMenu">
<div class="flex flex-col px-mobile-padding py-4 gap-4">
<a class="font-label-lg text-label-lg text-primary border-l-2 border-primary pl-3 py-1" href="#accueil">Accueil</a>
<a class="font-label-lg text-label-lg text-on-surface-variant hover:text-primary pl-3 py-1" href="#savoir-faire">Savoir-faire</a>
<a class="font-label-lg text-label-lg text-on-surface-variant hover:text-primary pl-3 py-1" href="#services">Services</a>
<a class="font-label-lg text-label-lg text-on-surface-variant hover:text-primary pl-3 py-1" href="#contact">Contact</a>
<a class="bg-primary text-on-primary font-label-lg text-label-lg px-6 py-3 rounded uppercase tracking-[0.08em] text-center mt-2" href="#contact">Devis</a>
</div>
</div>
</nav>
<!-- Hero Section -->
<section class="relative pt-8 pb-16 md:pt-16 md:pb-24 px-mobile-padding md:px-desktop-padding overflow-hidden" id="accueil">
<div class="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
<div class="order-2 lg:order-1 flex flex-col gap-6 z-10">
<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container-high w-max border border-outline-variant/30">
<span class="material-symbols-outlined text-sm text-green-custom" style="font-variation-settings: 'FILL' 1;">eco</span>
<span class="font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider">Artisanat Floral</span>
</div>
<h1 class="font-headline-display text-headline-display text-primary max-w-lg leading-tight">
                    Fleuriste artisan à ${city}
                </h1>
<p class="font-body-md text-body-md text-on-surface-variant max-w-md">
                    Chaque composition est une poésie éphémère. Nous sélectionnons avec soin les fleurs les plus fraîches pour créer des arrangements qui racontent votre histoire avec élégance et simplicité.
                </p>
<div class="flex flex-col sm:flex-row gap-4 mt-4">
<a class="bg-green-custom text-white font-label-lg text-label-lg px-8 py-4 rounded uppercase tracking-[0.08em] text-center btn-primary inline-flex items-center justify-center gap-2" href="#contact">
                        Commander un bouquet
                        <span class="material-symbols-outlined text-sm">arrow_forward</span>
</a>
<a class="border border-outline text-on-surface font-label-lg text-label-lg px-8 py-4 rounded uppercase tracking-[0.08em] text-center hover:bg-surface-container-high transition-colors" href="#savoir-faire">
                        Découvrir
                    </a>
</div>
</div>
<div class="order-1 lg:order-2 relative z-0 h-[400px] lg:h-[600px] w-full rounded-xl overflow-hidden shadow-sm">
<img alt="Bouquet de fleurs artisan" class="w-full h-full object-cover" data-alt="A stunning, close-up photograph of a fresh, meticulously arranged floral bouquet featuring deep red roses and lush green foliage. The lighting is soft and natural, creating a poetic, elegant mood. The background is a slightly out-of-focus, neutral cream color, emphasizing the vibrant colors and intricate textures of the petals and leaves. High-end editorial style photography, completely devoid of human subjects, focusing purely on the botanical craftsmanship." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_zhS4WMkIeRLY9UMnlKlL8lEUhRx0evCaEa6ZQkF6e6ImKR9Rk6WbFLElLqtd77v_oQ9wrbrW8l-3NFbBz6NWY_YYxNBI8V_1PHnxVUdUE38dyeyMtxpuGO9pt6hXScL16r6c6f4GCjPMSc1LvQI84eC3nXO0f0X7jgOe2s1S41Nza0hzyhJHZLMJxm7CVrDRKr4shS2JYLcGB-cn9NRx4xH3U8WYUauJbEAyLhmO4zD7dklxig6lHYKSjeNi240VrQxPWLKDcoA"/>
<!-- Decorative element -->
<div class="absolute -bottom-6 -left-6 w-32 h-32 bg-yellow-custom rounded-full blur-3xl opacity-50 z-[-1]"></div>
</div>
</div>
</section>
<!-- Savoir-Faire Section -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding bg-surface-container-low" id="savoir-faire">
<div class="max-w-[1200px] mx-auto">
<div class="text-center mb-16">
<h2 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-4">Notre Savoir-faire</h2>
<div class="w-12 h-1 bg-green-custom mx-auto mb-6"></div>
<p class="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
                    L'exigence au service de la nature. Notre atelier sélectionne les plus belles tiges pour concevoir des créations authentiques, respectueuses du cycle des saisons.
                </p>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-stack-gap">
<!-- Card 1 -->
<div class="bg-surface rounded-[12px] p-6 shadow-[0_4px_8px_-2px_rgba(0,0,0,0.04)] h-full flex flex-col gap-4 border border-surface-container-high">
<div class="w-full h-48 rounded-lg overflow-hidden mb-2">
<img alt="Fleurs en préparation" class="w-full h-full object-cover" data-alt="A tight close-up shot of raw, fresh flowers lying on a rustic wooden workbench in a florist's studio. Dew drops are visible on delicate petals. Scissors and natural twine rest nearby. The lighting is bright and airy, casting soft shadows, highlighting the natural textures and the meticulous preparation process. Corporate modern yet poetic aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBclLQvLzZTfeFt7VVTa-BHZYMIBeG3QnZFYk4vB3ZoPzYXe5hNkeMpws0Ryqsh3WLq-ItAyuzjnf0l3aRD4FhvCUfTBBHobCzfc8q6j9pTw4QkQi7IHgV1Ac2EeYr4C-rmRoJoZ7ctR1HUJeFB6DYpNxy2nzs_z8mnSgXJ7Y4hDG6gQ1tuYIVNvqvMr02VquXdrF7uFWbKTNKUuZBVbFYxz981AkLd0E_6a7wNoTtoMlfOW0e_bOkNkyUmOw-_cbxdlAgcZkV-_rg"/>
</div>
<h3 class="font-headline-lg-mobile text-[24px] text-primary">Sélection Rigoureuse</h3>
<p class="font-body-md text-body-md text-on-surface-variant flex-grow">
                        Nous privilégions les producteurs locaux et les fleurs de saison pour garantir une fraîcheur optimale et une tenue exceptionnelle de vos bouquets.
                    </p>
</div>
<!-- Card 2 -->
<div class="bg-surface rounded-[12px] p-6 shadow-[0_4px_8px_-2px_rgba(0,0,0,0.04)] h-full flex flex-col gap-4 border border-surface-container-high transform md:-translate-y-4">
<div class="w-full h-48 rounded-lg overflow-hidden mb-2">
<img alt="Vitrine boutique fleuriste" class="w-full h-full object-cover" data-alt="An elegant, architectural shot of a Parisian-style florist boutique window display. The storefront features dark green framing and pristine glass. Inside, an abundance of fresh, vibrant botanical arrangements are beautifully curated on staggered stands. Natural daylight illuminates the scene, conveying high quality and established heritage. No people visible." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDjvW13NAb6A1BIwAHEy4IzkNm90Zday0_oeclh2NO0fr1mMJ3YQrA-kWucB5iqlBtd2ATwwBRdwFLTGhmTr3dH7mxvW80FfyqfdfPpcWwLmWZ4i_zsX7hIvcRdrcj7yhPpYSuAQCOwTpoeF2CHwrWi0nmQnxuxqMjtsF01I3mR2K72-j9fGFDuVwXxpo9TTa3tFvo4U_qajSeVk7simHAZA0Nsl3F9FZCcGenRR3UixGuIS6idGGNvfPpMKVDhB1GADElyAxTIO5c"/>
</div>
<h3 class="font-headline-lg-mobile text-[24px] text-primary">Atelier Créatif</h3>
<p class="font-body-md text-body-md text-on-surface-variant flex-grow">
                        Chaque composition est pensée comme une œuvre unique. Notre équipe assemble les couleurs et les textures avec précision pour susciter l'émotion.
                    </p>
</div>
<!-- Card 3 -->
<div class="bg-surface rounded-[12px] p-6 shadow-[0_4px_8px_-2px_rgba(0,0,0,0.04)] h-full flex flex-col gap-4 border border-surface-container-high">
<div class="w-full h-48 rounded-lg overflow-hidden mb-2">
<img alt="Le geste de l'artisan" class="w-full h-full object-cover" data-alt="A close-up, highly detailed photograph of a florist's hands expertly tying a natural jute ribbon around a thick, lush bundle of fresh seasonal flowers. The focus is entirely on the skilled gesture, the textures of the stems, and the rustic ribbon. The background is a clean, bright cream studio environment. Focus on craftsmanship." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDihv9GkhnXbqNVqQqu2_Q5gDO9NEP7t3UDHMENjHh2kOfBR8_PP4wWO91PKR1FC4JY1FcxAuZ1ea3v97BQnLVnnER6krvJJuKvGL-a_KWmhReeWxk5GPVijyBK3_TriMRWKQf0WFczHpcuAxehbD3RqFL_uW_SkPjDfc3yrSpt40yrvDH8lRvFLLynCVhWL_NH93kCBLOoOs0R-uaHKHTMwgjfx0Lj88fZ5I_e_xx416Fear0WUzihqMnFqkaBiYzFvIj35n6YIE4"/>
</div>
<h3 class="font-headline-lg-mobile text-[24px] text-primary">Geste Précis</h3>
<p class="font-body-md text-body-md text-on-surface-variant flex-grow">
                        De la coupe de la tige au nouage du ruban, nous appliquons des techniques traditionnelles pour assurer la pérennité et la beauté de chaque création.
                    </p>
</div>
</div>
</div>
</section>
<!-- Services Section (Bento Grid Style) -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding" id="services">
<div class="max-w-[1200px] mx-auto">
<div class="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
<div>
<h2 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary mb-2">Nos Services</h2>
<p class="font-body-md text-body-md text-on-surface-variant max-w-lg">
                        Des solutions florales adaptées à chaque instant de vie, livrées avec soin à ${city} et ses environs.
                    </p>
</div>
<a class="hidden md:inline-flex items-center gap-2 font-label-lg text-label-lg text-green-custom uppercase tracking-wider hover:underline" href="#contact">
                    Voir la carte complète <span class="material-symbols-outlined text-sm">arrow_forward</span>
</a>
</div>
<!-- Bento Grid Layout -->
<div class="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
<!-- Main Feature: Mariages (Spans 2 cols, 2 rows) -->
<div class="md:col-span-2 md:row-span-2 relative rounded-[12px] overflow-hidden group cursor-pointer shadow-sm">
<div class="absolute inset-0 bg-primary/40 z-10 transition-opacity group-hover:bg-primary/20"></div>
<img alt="Décoration de mariage" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A breathtaking, opulent floral installation for a wedding reception. Cascading white and pale pink blossoms adorn a structural archway, set against a classic, elegant venue background. Soft, romantic lighting highlights the lush greenery and delicate petals. High-end event design photography, devoid of people, conveying sophisticated celebration and artisanal mastery." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCi2txzFxf3Am4lE_ZpWM9aXM7nSDiJgw8I8g6DQcAIgdek-KdBi9M08vMG7uYkOZokueMCMsCDCTH0B4ek0Kr4wMKb_mckP4FkIQIfOA8SiaW1v4hQ4RjrVqyMlbOZ37dvqdsEcSA0RVEtHbf8UXNLe8OzhvGX5vojndHbg1fNf1LQkzGVPFR9ovHgt_mXf1jdiBzAFqgCamWW1C1rrjVOyTQEY8mPhfkyDAP-AViAWy9Ub57DAbNeb-CVJ18wGzZxELo4JxHVGY8"/>
<div class="absolute bottom-0 left-0 w-full p-8 z-20 flex flex-col gap-2">
<span class="font-label-sm text-label-sm text-white/80 uppercase tracking-widest">Événementiel</span>
<h3 class="font-headline-lg text-[32px] text-white">Mariages &amp; Réceptions</h3>
<p class="font-body-md text-body-md text-white/90 max-w-md hidden md:block">
                            Des scénographies florales sur-mesure pour sublimer vos plus beaux moments. Arche, centres de table, et bouquet de mariée.
                        </p>
<span class="inline-flex mt-2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full items-center justify-center text-white border border-white/30 group-hover:bg-white group-hover:text-primary transition-colors">
<span class="material-symbols-outlined text-sm">arrow_forward</span>
</span>
</div>
</div>
<!-- Bouquets (Spans 2 cols, 1 row) -->
<div class="md:col-span-2 md:row-span-1 bg-surface-container-high rounded-[12px] p-6 flex flex-col sm:flex-row items-center gap-6 shadow-sm border border-outline-variant/50 hover:border-outline transition-colors">
<div class="w-full sm:w-1/3 h-40 sm:h-full rounded-lg overflow-hidden">
<img alt="Bouquets de saison" class="w-full h-full object-cover" data-alt="A perfectly arranged, round bouquet of vibrant, mixed seasonal flowers resting on a clean, light-colored wooden table. The composition includes rich textures of foliage and delicate blooms. Shot straight down (flat lay style) with bright, even studio lighting. High contrast, clean, modern corporate aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuALRYynSD8mwwrYBevft-a9Q18RlpQDhIkfB41003jc6XJbtc4cJdVrj4Lf5_cmGavcECuuDrP4vjU_0zunjP398CO97tbNzsCSajqnZ19qY2d8zv6Uc2FtH8P-KWZHmjob16nXCoPXCJKmHyaNYHTc1PUXnS4qg_dOeUzrITEXiFr6uql32Lh6DTrq6BZbKB0GUMr6vUZAqJC8_p4Jp7HsToYAimXmPnlE6CM8u1HwDFztG8BNaoglUmAcvkl6SB6vLXWHlnumtXY"/>
</div>
<div class="w-full sm:w-2/3 flex flex-col gap-2">
<h3 class="font-headline-lg-mobile text-[24px] text-primary">Bouquets Signature</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Créations journalières composées selon l'inspiration de l'artisan et l'arrivage matinal.</p>
<a class="font-label-lg text-label-lg text-green-custom uppercase mt-2 inline-flex items-center gap-1 hover:underline w-max" href="#contact">
                            Commander
                        </a>
</div>
</div>
<!-- Deuil (1 col, 1 row) -->
<div class="md:col-span-1 md:row-span-1 bg-surface rounded-[12px] p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between group">
<div>
<span class="material-symbols-outlined text-green-custom text-3xl mb-4">spa</span>
<h3 class="font-headline-lg-mobile text-[22px] text-primary mb-2">Hommage &amp; Deuil</h3>
<p class="font-body-md text-body-md text-on-surface-variant text-sm">Couronnes, coussins et coupes de plantes pour accompagner vos proches avec dignité.</p>
</div>
<span class="material-symbols-outlined self-end text-outline group-hover:text-primary transition-colors mt-4">arrow_forward</span>
</div>
<!-- Livraison (1 col, 1 row) -->
<div class="md:col-span-1 md:row-span-1 bg-green-custom text-white rounded-[12px] p-6 shadow-sm flex flex-col justify-between relative overflow-hidden">
<div class="absolute -right-6 -bottom-6 opacity-10">
<span class="material-symbols-outlined text-9xl">local_shipping</span>
</div>
<div class="z-10">
<span class="material-symbols-outlined text-white text-3xl mb-4">local_shipping</span>
<h3 class="font-headline-lg-mobile text-[22px] text-white mb-2">Livraison Express</h3>
<p class="font-body-md text-body-md text-white/80 text-sm">Livraison soignée en main propre à ${city} dans la journée.</p>
</div>
</div>
</div>
<a class="md:hidden mt-8 w-full inline-flex items-center justify-center gap-2 font-label-lg text-label-lg text-primary border border-primary px-6 py-3 rounded uppercase" href="#contact">
                Voir tous les services
            </a>
</div>
</section>
<!-- Contact / Commande Section -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding bg-surface-container-high border-t border-outline-variant" id="contact">
<div class="max-w-[1000px] mx-auto bg-surface rounded-xl shadow-sm border border-outline-variant overflow-hidden flex flex-col md:flex-row">
<!-- Info Side -->
<div class="w-full md:w-2/5 bg-tertiary-container text-on-tertiary-container p-8 lg:p-12 flex flex-col justify-between">
<div>
<h2 class="font-headline-lg-mobile text-[28px] text-white mb-6">Passez commande</h2>
<p class="font-body-md text-body-md text-on-tertiary-container/80 mb-8">
                        Contactez notre atelier pour réserver votre composition ou demander un devis sur-mesure.
                    </p>
<div class="flex flex-col gap-6">
<div class="flex items-start gap-4">
<span class="material-symbols-outlined text-white/50">location_on</span>
<div>
<h4 class="font-label-lg text-label-lg text-white mb-1">Boutique</h4>
<p class="font-body-md text-body-md text-sm text-on-tertiary-container/80">${addressDisplay}<br/>${city}, France</p>
</div>
</div>
<div class="flex items-start gap-4">
<span class="material-symbols-outlined text-white/50">call</span>
<div>
<h4 class="font-label-lg text-label-lg text-white mb-1">Téléphone</h4>
<p class="font-body-md text-body-md text-sm text-on-tertiary-container/80">${phoneDisplay}</p>
</div>
</div>
<div class="flex items-start gap-4">
<span class="material-symbols-outlined text-white/50">schedule</span>
<div>
<h4 class="font-label-lg text-label-lg text-white mb-1">Horaires</h4>
<p class="font-body-md text-body-md text-sm text-on-tertiary-container/80">${hoursInline}</p>
</div>
</div>
</div>
</div>
</div>
<!-- Form Side -->
<div class="w-full md:w-3/5 p-8 lg:p-12">
<form class="flex flex-col gap-5">
<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
<div class="flex flex-col gap-1">
<label class="font-label-sm text-label-sm text-on-surface-variant uppercase" for="name">Nom</label>
<input class="border border-outline bg-transparent px-4 py-3 rounded font-body-md text-body-md focus:border-green-custom focus:ring-1 focus:ring-green-custom outline-none transition-colors" id="name" placeholder="Votre nom" type="text"/>
</div>
<div class="flex flex-col gap-1">
<label class="font-label-sm text-label-sm text-on-surface-variant uppercase" for="phone">Téléphone</label>
<input class="border border-outline bg-transparent px-4 py-3 rounded font-body-md text-body-md focus:border-green-custom focus:ring-1 focus:ring-green-custom outline-none transition-colors" id="phone" placeholder="${phoneDisplay}" type="tel"/>
</div>
</div>
<div class="flex flex-col gap-1">
<label class="font-label-sm text-label-sm text-on-surface-variant uppercase" for="service">Service souhaité</label>
<select class="border border-outline bg-transparent px-4 py-3 rounded font-body-md text-body-md focus:border-green-custom focus:ring-1 focus:ring-green-custom outline-none transition-colors appearance-none" id="service">
<option>Commande de bouquet</option>
<option>Demande de devis Mariage</option>
<option>Abonnement floral</option>
<option>Autre demande</option>
</select>
</div>
<div class="flex flex-col gap-1">
<label class="font-label-sm text-label-sm text-on-surface-variant uppercase" for="message">Message</label>
<textarea class="border border-outline bg-transparent px-4 py-3 rounded font-body-md text-body-md focus:border-green-custom focus:ring-1 focus:ring-green-custom outline-none transition-colors resize-none" id="message" placeholder="Précisez votre demande (budget, couleurs, date...)" rows="4"></textarea>
</div>
<button class="bg-primary text-on-primary font-label-lg text-label-lg px-6 py-4 rounded uppercase tracking-[0.08em] btn-primary mt-2" type="button">
                        Envoyer la demande
                    </button>
</form>
</div>
</div>
</section>
<!-- Footer (Shared Component) -->
<footer class="bg-surface-container-high dark:bg-tertiary-container border-t border-outline-variant full-width">
<div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-stack-gap px-mobile-padding md:px-desktop-padding py-section-gap">
<!-- Brand -->
<div class="flex flex-col gap-4">
<a class="font-headline-lg text-headline-lg text-on-surface dark:text-on-tertiary-container focus:outline-none ring-2 ring-primary ring-offset-2 ring-offset-surface-container-high rounded-sm w-max" href="#">
                    ${name}
                </a>
<p class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 max-w-xs">
                    Artisan fleuriste dédié à la création d'émotions botaniques à ${city}.
                </p>
</div>
<!-- Links -->
<div class="flex flex-col gap-3 md:items-center">
<h4 class="font-label-sm text-label-sm uppercase text-on-surface dark:text-on-tertiary-container mb-2 tracking-widest">Informations</h4>
<a class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none ring-2 ring-primary w-max" href="#">Mentions Légales</a>
<a class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none ring-2 ring-primary w-max" href="#">Confidentialité</a>
<a class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none ring-2 ring-primary w-max" href="#">CGV</a>
</div>
<!-- Copyright -->
<div class="flex items-end md:justify-end mt-8 md:mt-0">
<p class="font-label-sm text-label-sm text-on-surface-variant dark:text-on-tertiary-container/70 uppercase tracking-wider">
                    © ${year} ${name}. Tous droits réservés.
                </p>
</div>
</div>
</footer>
<!-- Mobile Floating Action Button (FAB) -->
<a class="md:hidden fixed bottom-6 right-6 z-40 bg-green-custom text-white w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_16px_rgba(22,101,52,0.3)] hover:scale-105 transition-transform" href="#contact">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">shopping_bag</span>
</a>
<!-- Simple Script for Mobile Menu Toggle -->
<script>
        document.addEventListener('DOMContentLoaded', () => {
            const mobileMenuBtn = document.getElementById('mobileMenuBtn');
            const mobileMenu = document.getElementById('mobileMenu');
            
            if(mobileMenuBtn && mobileMenu) {
                mobileMenuBtn.addEventListener('click', () => {
                    mobileMenu.classList.toggle('hidden');
                });
            }
            
            // Close menu on link click
            const links = mobileMenu.querySelectorAll('a');
            links.forEach(link => {
                link.addEventListener('click', () => {
                    mobileMenu.classList.add('hidden');
                });
            });
            
            // Hide nav on scroll down, show on scroll up for better mobile experience
            let lastScrollY = window.scrollY;
            const nav = document.getElementById('topNav');
            
            window.addEventListener('scroll', () => {
                if (window.scrollY > 100) {
                    if (window.scrollY > lastScrollY) {
                        // Scrolling down
                        nav.style.transform = 'translateY(-100%)';
                        mobileMenu.classList.add('hidden'); // Close menu if open
                    } else {
                        // Scrolling up
                        nav.style.transform = 'translateY(0)';
                    }
                }
                lastScrollY = window.scrollY;
            });
        });
    </script>
</body></html>`;
}
