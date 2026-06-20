/**
 * Template Stitch OSTEO — pixel-pixel copy de :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/ost_opathe_name_1/code.html
 *
 * Substitutions minimales (le DESIGN n'est PAS touché) :
 * - {{NAME}} → p.name | {{CITY}} → p.city
 * - tous les téléphones → p.phone (auto-detect via regex)
 * - "12 rue des Artisans" et similaires → p.address
 * - nav sticky top-0 → sticky top-[54px] (passe sous la sales-ui-bar 54px)
 * - année footer dynamique
 */

export type OsteoPixelProspect = {
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

export function generateStitchOsteoPixelMockupHtml(p: OsteoPixelProspect): string {
  const name = esc(p.name || "");
  const city = esc(p.city || "votre ville");
  const phoneDisplay = esc(p.phone || "");
  const phoneDigits = (p.phone || "").replace(/[^\d+]/g, "");
  const addressDisplay = p.address ? esc(p.address) : `12 rue principale, ${city}`;
  const year = new Date().getFullYear();
  const hoursInline = renderStitchHoursInline(p.hours, "\${hoursInline}<br/>Dimanche : Fermé");
  return `<!DOCTYPE html>

<html class="light" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Ostéopathe / Kinésithérapeute à ${city}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&amp;family=Plus+Jakarta+Sans:wght@400;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
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
        /* Grain Overlay */
        body::before {
            content: "";
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            pointer-events: none;
            z-index: 9999;
            opacity: 0.04;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        
        /* Smooth Scrolling */
        html {
            scroll-behavior: smooth;
        }

        /* Hide scrollbar for clean aesthetic */
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #fdf8f8;
        }
        ::-webkit-scrollbar-thumb {
            background: #e5e2e1;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #c4c7c7;
        }
    </style>
</head>
<body class="bg-background text-on-background font-body-md text-body-md relative antialiased selection:bg-surface-variant selection:text-on-surface">
<!-- TopNavBar -->
<header class="bg-surface/95 dark:bg-surface-container-highest/95 backdrop-blur-sm sticky top-[54px] z-40 border-b border-outline-variant shadow-sm w-full">
<div class="max-w-[1200px] mx-auto flex justify-between items-center px-mobile-padding md:px-desktop-padding py-4">
<a class="font-headline-lg text-headline-lg font-bold text-primary dark:text-on-primary flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full hover:opacity-80 transition-opacity duration-300" href="#">
                ${name}
            </a>
<nav class="hidden md:flex items-center gap-8">
<a class="text-primary border-b-2 border-primary pb-1 font-label-lg text-label-lg hover:opacity-80 transition-opacity duration-300" href="#accueil">Accueil</a>
<a class="text-on-surface-variant hover:text-primary font-label-lg text-label-lg hover:opacity-80 transition-opacity duration-300" href="#savoir-faire">Savoir-faire</a>
<a class="text-on-surface-variant hover:text-primary font-label-lg text-label-lg hover:opacity-80 transition-opacity duration-300" href="#services">Services</a>
<a class="text-on-surface-variant hover:text-primary font-label-lg text-label-lg hover:opacity-80 transition-opacity duration-300" href="#contact">Contact</a>
</nav>
<a class="hidden md:inline-flex items-center justify-center bg-primary text-on-primary font-label-lg text-label-lg uppercase px-6 py-3 rounded hover:opacity-80 transition-opacity duration-300 shadow-sm" href="#contact">
                Devis
            </a>
<!-- Mobile Menu Toggle (Decorative) -->
<button class="md:hidden text-primary p-2">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">menu</span>
</button>
</div>
</header>
<!-- Hero Section -->
<section class="pt-section-gap pb-12 md:pb-section-gap px-mobile-padding md:px-desktop-padding max-w-[1200px] mx-auto relative" id="accueil">
<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
<div class="flex flex-col gap-6 relative z-10">
<div class="inline-flex items-center gap-2 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
<span class="w-8 h-px bg-outline-variant"></span>
                    Ostéopathie &amp; Kinésithérapie
                </div>
<h1 class="font-headline-display text-headline-display text-primary">
                    Ostéopathie à ${city}
                </h1>
<p class="text-on-surface-variant max-w-lg">
                    Une approche douce et experte pour rétablir l'équilibre de votre corps. Soins personnalisés dans un cadre apaisant, dédiés à votre bien-être durable.
                </p>
<div class="pt-4 flex flex-col sm:flex-row gap-4">
<a class="inline-flex items-center justify-center bg-primary text-on-primary font-label-lg text-label-lg uppercase px-8 py-4 rounded shadow-sm hover:shadow-md hover:opacity-90 transition-all duration-300" href="#contact">
                        Réserver une séance
                    </a>
<a class="inline-flex items-center justify-center border border-outline text-on-surface font-label-lg text-label-lg uppercase px-8 py-4 rounded hover:bg-surface-variant transition-colors duration-300" href="#savoir-faire">
                        Découvrir
                    </a>
</div>
</div>
<div class="relative h-[400px] lg:h-[600px] rounded-lg overflow-hidden shadow-sm bg-surface-container">
<img class="absolute inset-0 w-full h-full object-cover rounded-lg" data-alt="A serene, minimalist osteopathy and physiotherapy treatment room. A pristine white treatment table sits empty in the center, bathed in soft, natural daylight streaming through a large window. The space is decorated with calming elements: smooth zen stones on a small wooden stool, a healthy green potted plant in the corner, and subtly glowing candles casting a warm light. The overall color palette is composed of soft creams, gentle greys, and natural wood tones, creating a highly professional yet deeply relaxing atmosphere typical of a high-end wellness clinic. No people are visible." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCbK_050uEsko0yByJQV7zD630-9JBQ2y8mIPlYHPJZFii4dS7CrA_R3x2M1OVS7wPhWQpd4r1WigA3AROpj7jedQwc7VrHUxIdymXMteo05D6PFZ7iJGM6SfPaTjtgodZtVsHsjH2kKoD9DFCfD9ZsgKuBO94FsSUaxb-AukcvtsUYdyVMO0vMqhoyODux_N2tCBxH3GX78e26ZJiFmi693bKrNSUlUBlgGs0cSHz3e6EPN_kyYhIzpPGSZKWOoZjeZSORABr3-Sk"/>
<div class="absolute inset-0 bg-gradient-to-t from-surface-container-highest/20 to-transparent"></div>
</div>
</div>
</section>
<!-- Savoir-faire (Expertise) Section -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding bg-surface-container-low border-y border-outline-variant" id="savoir-faire">
<div class="max-w-[1200px] mx-auto">
<div class="flex flex-col md:flex-row justify-between items-end gap-8 mb-16">
<div class="max-w-2xl">
<h2 class="font-headline-lg text-headline-lg text-primary mb-4">Notre Savoir-faire</h2>
<p class="text-on-surface-variant">L'alliance de la tradition ostéopathique et des techniques modernes de kinésithérapie pour un traitement global et précis des dysfonctionnements du corps.</p>
</div>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-stack-gap">
<!-- Card 1 -->
<div class="bg-surface p-8 rounded-lg shadow-sm border border-transparent hover:border-outline-variant hover:shadow-md transition-all duration-300">
<span class="material-symbols-outlined text-primary mb-6" style="font-size: 32px; font-variation-settings: 'FILL' 0;">front_hand</span>
<h3 class="font-headline-lg text-headline-lg text-primary text-[24px] mb-3">Thérapie Manuelle</h3>
<p class="text-on-surface-variant text-sm">Des manipulations douces et précises pour relâcher les tensions musculaires et articulaires, favorisant la mobilité naturelle.</p>
</div>
<!-- Card 2 -->
<div class="bg-surface p-8 rounded-lg shadow-sm border border-transparent hover:border-outline-variant hover:shadow-md transition-all duration-300">
<span class="material-symbols-outlined text-primary mb-6" style="font-size: 32px; font-variation-settings: 'FILL' 0;">psychiatry</span>
<h3 class="font-headline-lg text-headline-lg text-primary text-[24px] mb-3">Approche Holistique</h3>
<p class="text-on-surface-variant text-sm">Nous considérons le corps dans son ensemble pour identifier la cause profonde de la douleur, au-delà du symptôme apparent.</p>
</div>
<!-- Card 3 -->
<div class="bg-surface p-8 rounded-lg shadow-sm border border-transparent hover:border-outline-variant hover:shadow-md transition-all duration-300">
<span class="material-symbols-outlined text-primary mb-6" style="font-size: 32px; font-variation-settings: 'FILL' 0;">spa</span>
<h3 class="font-headline-lg text-headline-lg text-primary text-[24px] mb-3">Réhabilitation</h3>
<p class="text-on-surface-variant text-sm">Programmes d'exercices personnalisés pour consolider les bénéfices du traitement et prévenir les récidives à long terme.</p>
</div>
</div>
</div>
</section>
<!-- Services Section (Bento Grid) -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding max-w-[1200px] mx-auto" id="services">
<div class="text-center mb-16">
<h2 class="font-headline-lg text-headline-lg text-primary mb-4">À qui s'adressent nos soins ?</h2>
<p class="text-on-surface-variant max-w-2xl mx-auto">Une prise en charge adaptée à chaque étape de la vie et à chaque besoin spécifique.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-12 gap-stack-gap">
<!-- Adultes (Large) -->
<div class="md:col-span-8 relative h-[300px] rounded-lg overflow-hidden group bg-surface-container">
<img class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A close-up shot of a modern, ergonomic office chair and a standing desk in a softly lit workspace, suggesting the environment of a working adult. The scene is immaculate, with neutral tones of slate grey and cream, subtly illuminated by natural light. No people are present. The focus is on the tools of modern life that often require osteopathic care." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC0i6arfreLTjkfNB2v2Yq0GhaRpA87iv0g7kCny2Yq_pxSAEZsEa5jVa7ItsQ6egssgeZ-PXR1oN8sUJqX6NX97_OEFdaUWDR8ExaldRseX3G6R_yU93DsFaYeh-1ttI9qlX5KPTy6_MzyJDUlSfp0Gb32K-qmtZTDZzTARXpNGKcxsA8Eo52P8ixY80rVSvw7MHgrg93sGlnNowBSLaaPaTsT3_ZpPvQ0v2KUeKuE3zmhKJlPzgdJFGPln1lmaegWoN4iolWFuOI"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>
<div class="absolute bottom-0 left-0 p-8">
<h3 class="font-headline-lg text-headline-lg text-on-primary mb-2">Adultes &amp; Actifs</h3>
<p class="text-on-primary/90 text-sm max-w-md hidden md:block">Soulagement des troubles musculo-squelettiques liés au travail et au stress quotidien.</p>
</div>
</div>
<!-- Sportifs (Tall) -->
<div class="md:col-span-4 relative h-[300px] rounded-lg overflow-hidden group bg-surface-container">
<img class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A macro detail shot of professional athletic recovery equipment: a textured foam roller and clean, folded towels resting on a polished wooden floor. The lighting is crisp and dramatic, highlighting the textures of the gear. The color palette features cool greys and warm wood tones, evoking a premium sports therapy environment. Sincere and focused on the objects. No people." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDhyCO1pHUVGu_VtCDTYOec2gAYqnQzj4-HuXoO3KNFRDGex8IoOubviKoH7Qe-FKuhzXwMdic53wbJ3D-3T_vjww7JkyeSRwji1Sy7nWBeC1VEUKQ43_jp_e1qlBOaZPNlEImXSvwvAeVETJiob6yG6L8lRQZrwc5HkKj6YscG8Ob0WbwOGSbxw451Fc79ytqDbhXRNrs78HOWMvT53I60IxsCDXjRJYd2ObQNIjUnxCs1ikvbSFggfnlHJmqXfE_NgRx1wwq2oEU"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>
<div class="absolute bottom-0 left-0 p-8">
<h3 class="font-headline-lg text-headline-lg text-on-primary mb-2 text-[24px]">Sportifs</h3>
<p class="text-on-primary/90 text-sm hidden md:block">Optimisation des performances et récupération.</p>
</div>
</div>
<!-- Femmes Enceintes -->
<div class="md:col-span-4 relative h-[250px] rounded-lg overflow-hidden group bg-surface-container">
<img class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A soft, comforting still life featuring a large, plush maternity support pillow in cream fabric, resting on a neatly made bed with high-quality linen sheets. A small, delicate vase with dried flowers sits on an adjacent wooden nightstand. The lighting is extremely soft, warm, and nurturing, reflecting a calm maternal environment. No people." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCdMpoqgDFH8z-Z0Ohr27o38ma4Q6TUiPBuSZcK--PbUsYQNEzIcNlfuNyK2-BX9jbh2OmAWwdg9-b4ccUfwiVNesDE2nlEhs14ZbNfZxsTBcg0KEwLJCc3lswnGXcETLmwGGxLZNu6J3xJVZNC2Sfel5u7pb--Hz5y7LkbPusWYurwrI3F3fBy1wKhjRgH2N5dYg0OYOH3ssVpUBauMN5YEnQdWhnztYNF6wyhYxa39CcRP5QiSUy-EEIeyS8n_LuY7lqa5GQfM98"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>
<div class="absolute bottom-0 left-0 p-6">
<h3 class="font-headline-lg text-headline-lg text-on-primary mb-2 text-[24px]">Femmes Enceintes</h3>
</div>
</div>
<!-- Nourrissons -->
<div class="md:col-span-4 relative h-[250px] rounded-lg overflow-hidden group bg-surface-container">
<img class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A pristine, minimalist baby changing station in a clinical yet warm setting. The surface is covered with a soft, clean white towel. Nearby are gentle, natural baby care items: a soft bristle brush and a small bottle of massage oil. The light is pure and bright, signifying cleanliness and gentle care. High aesthetic quality, corporate modern vibe. No people." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAKplKQaSCkRcWp-E1SUVnX717RUClAIbgY8hgthzYnh3b0blm8sSr2mUTbLjRTXgMDdiAHTu1-pfXxu5Bt50xyt8isFA-F6GP5puT6AUfQ3UpCdBv4lG-XZsVVWMNld8eVKKkkpq9nsfu0du52sAzmhCf4olYYU6WDoLXw8SMcVBHFTc1Bx5oTIjpGufZn1UN5-OU615115c8SrMQSPf29Lny7BGyT7MjmOzsbB0EeLKqfQdzawVGpgWV25hXPuCB0J3mWg7gnpUs"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>
<div class="absolute bottom-0 left-0 p-6">
<h3 class="font-headline-lg text-headline-lg text-on-primary mb-2 text-[24px]">Nourrissons</h3>
</div>
</div>
<!-- Seniors -->
<div class="md:col-span-4 relative h-[250px] rounded-lg overflow-hidden group bg-surface-container">
<img class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A beautifully worn, classic wooden walking cane resting against a comfortable, high-quality upholstered armchair in a sunlit room. The scene conveys dignity, stability, and thoughtful care. The textures of the wood and fabric are highlighted by soft afternoon sunlight. The overall tone is respectful and grounded, utilizing slate and warm neutral colors. No people." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBTAGpqPpuChntrCqmYDWWRPxLqZLcwY7nclzCzgiuR8aQKJ5xUnsdzZKYABNIglAwpYjqYwEOFd3h1VS7ICxDFNvSQFpvN5WcwpDVygX4h6NR1I_u8XcuFinfHMeNt8mCaADjI5JoZBTInAtk8erb5Kif5K_e5FHgehMAzXqDKTEFqtJXM3q5_6uWx3OEHxGsuES69DAePFiuzSXzY6evRzKJFj4we2ZE6B8sACLkxXOyq4w038F6xeCYIiz6tj5d8Ikf0t3g1LD0"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary/80 via-primary/20 to-transparent"></div>
<div class="absolute bottom-0 left-0 p-6">
<h3 class="font-headline-lg text-headline-lg text-on-primary mb-2 text-[24px]">Seniors</h3>
</div>
</div>
</div>
</section>
<!-- Contact & Map Section -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding bg-surface-container-low border-t border-outline-variant" id="contact">
<div class="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
<!-- Contact Form -->
<div class="bg-surface p-8 rounded-lg shadow-sm">
<h2 class="font-headline-lg text-headline-lg text-primary mb-6">Prendre Rendez-vous</h2>
<form class="space-y-6">
<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
<div>
<label class="block font-label-sm text-label-sm text-on-surface-variant mb-2" for="name">Nom complet</label>
<input class="w-full bg-surface-container-lowest border border-outline-variant rounded px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" id="name" placeholder="Jean Dupont" type="text"/>
</div>
<div>
<label class="block font-label-sm text-label-sm text-on-surface-variant mb-2" for="phone">Téléphone</label>
<input class="w-full bg-surface-container-lowest border border-outline-variant rounded px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" id="phone" placeholder="${phoneDisplay}" type="tel"/>
</div>
</div>
<div>
<label class="block font-label-sm text-label-sm text-on-surface-variant mb-2" for="motif">Motif de consultation</label>
<select class="w-full bg-surface-container-lowest border border-outline-variant rounded px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" id="motif">
<option>Première consultation</option>
<option>Suivi</option>
<option>Urgence</option>
</select>
</div>
<div>
<label class="block font-label-sm text-label-sm text-on-surface-variant mb-2" for="message">Message (optionnel)</label>
<textarea class="w-full bg-surface-container-lowest border border-outline-variant rounded px-4 py-3 font-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all" id="message" placeholder="Précisez vos disponibilités..." rows="4"></textarea>
</div>
<button class="w-full bg-primary text-on-primary font-label-lg text-label-lg uppercase px-8 py-4 rounded shadow-sm hover:opacity-90 transition-opacity duration-300" type="submit">
                        Envoyer la demande
                    </button>
</form>
</div>
<!-- Info & Map -->
<div class="flex flex-col gap-8">
<div>
<h3 class="font-headline-lg text-headline-lg text-primary text-[24px] mb-4">Informations Pratiques</h3>
<ul class="space-y-4 text-on-surface-variant">
<li class="flex items-start gap-3">
<span class="material-symbols-outlined text-primary mt-1" style="font-variation-settings: 'FILL' 0;">location_on</span>
<div>
<strong class="text-on-surface block">Cabinet d'Ostéopathie</strong>
                                ${addressDisplay}, ${city}
                            </div>
</li>
<li class="flex items-start gap-3">
<span class="material-symbols-outlined text-primary mt-1" style="font-variation-settings: 'FILL' 0;">schedule</span>
<div>
<strong class="text-on-surface block">Horaires d'ouverture</strong>
                                Lundi - Vendredi : 8h00 - 20h00<br/>
                                Samedi : 9h00 - 13h00
                            </div>
</li>
<li class="flex items-start gap-3">
<span class="material-symbols-outlined text-primary mt-1" style="font-variation-settings: 'FILL' 0;">call</span>
<div>
<strong class="text-on-surface block">Contact téléphonique</strong>
                                ${phoneDisplay}
                            </div>
</li>
</ul>
</div>
<div class="flex-grow min-h-[300px] rounded-lg overflow-hidden border border-outline-variant bg-surface-container relative">
<!-- Map placeholder image -->
<img class="absolute inset-0 w-full h-full object-cover" data-alt="A highly detailed, clean, and modern street map focusing on the city of ${city}. The map style is minimalist, using subtle greys, crisp white lines for roads, and a single, elegant slate-grey pin marker indicating a location. The map avoids bright, distracting colors, maintaining the corporate modern and sophisticated aesthetic of a premium healthcare provider. No text or labels are visible on the map itself." data-location="${city}" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCP9VJN1EblSLiBFegSRdfH0iSdzsAq1DDqog6OMqcYe6IXE5l3Ket7zMdOZuGIUp_Za0GVdsWFH0hy2_5LGrUGv986YbER2xKKjCoqNQP1wi2YXIJ_qylfYQYbg2IezcuAOCyQbODLSuXTh-2bhSbmW4e-thfjUgRIUeGKw_LRWY8h8MkAwiQB_2bnZfq2lJEH3WK6dI0N7iOkjZOPcU_8lct4c4II2auOeaZnP-W2GnJl0xIFUGqqEf2BfhMiTTPQ03BCD4LGWgo"/>
</div>
</div>
</div>
</section>
<!-- Footer -->
<footer class="bg-surface-container-high dark:bg-tertiary-container border-t border-outline-variant w-full">
<div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-stack-gap px-mobile-padding md:px-desktop-padding py-section-gap">
<div class="flex flex-col gap-4">
<span class="font-headline-lg text-headline-lg text-on-surface dark:text-on-tertiary-container">
                    ${name}
                </span>
<p class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70">
                    Ostéopathe &amp; Kinésithérapeute D.O. à ${city}. Soins de qualité pour un équilibre retrouvé.
                </p>
</div>
<div class="flex flex-col gap-2">
<h4 class="font-label-sm text-label-sm text-on-surface uppercase tracking-wider mb-2">Liens Utiles</h4>
<a class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary w-fit" href="#Mentions L\\u00e9gales">Mentions Légales</a>
<a class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary w-fit" href="#Confidentialit\\u00e9">Confidentialité</a>
<a class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary w-fit" href="#CGV">CGV</a>
</div>
<div class="flex flex-col gap-2 md:items-end">
<p class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 mt-auto">
                    © ${year} ${name}. Tous droits réservés.
                 </p>
</div>
</div>
</footer>
<!-- Mobile Floating Action Button (FAB) -->
<a class="md:hidden fixed bottom-6 right-6 bg-primary text-on-primary w-14 h-14 rounded-full flex items-center justify-center shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 z-50" href="#contact">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">calendar_month</span>
</a>
</body></html>`;
}
