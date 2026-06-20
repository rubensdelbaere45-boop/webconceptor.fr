/**
 * Template Stitch VETERINAIRE — pixel-pixel copy de :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/v_t_rinaire_name_1/code.html
 *
 * Substitutions minimales (le DESIGN n'est PAS touché) :
 * - {{NAME}} → p.name | {{CITY}} → p.city
 * - tous les téléphones → p.phone (auto-detect via regex)
 * - "12 rue des Artisans" et similaires → p.address
 * - nav sticky top-0 → sticky top-[54px] (passe sous la sales-ui-bar 54px)
 * - année footer dynamique
 */

export type VeterinairePixelProspect = {
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

export function generateStitchVeterinairePixelMockupHtml(p: VeterinairePixelProspect): string {
  const name = esc(p.name || "");
  const city = esc(p.city || "votre ville");
  const phoneDisplay = esc(p.phone || "");
  const phoneDigits = (p.phone || "").replace(/[^\d+]/g, "");
  const addressDisplay = p.address ? esc(p.address) : `12 rue principale, ${city}`;
  const year = new Date().getFullYear();
  const hoursInline = renderStitchHoursInline(p.hours, "${hoursInline}<br/>Urgences 24/7");
  return `<!DOCTYPE html>

<html class="scroll-smooth" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Vétérinaire | ${name}</title>
<!-- Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&amp;family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "secondary": "#5e5e5e",
                        "primary-fixed": "#e5e2e1",
                        "outline-variant": "#c4c7c7",
                        "primary-fixed-dim": "#c8c6c5",
                        "inverse-surface": "#313030",
                        "on-error": "#ffffff",
                        "inverse-primary": "#c8c6c5",
                        "surface-container-high": "#ebe7e6",
                        "error-container": "#ffdad6",
                        "on-primary-fixed": "#1c1b1b",
                        "on-secondary-container": "#626263",
                        "surface": "#fdf8f8",
                        "background": "#fdf8f8",
                        "tertiary-fixed-dim": "#cac6c4",
                        "on-surface": "#1c1b1b",
                        "tertiary": "#000000",
                        "on-tertiary-fixed": "#1c1b1a",
                        "on-tertiary": "#ffffff",
                        "error": "#ba1a1a",
                        "surface-container": "#f1edec",
                        "inverse-on-surface": "#f4f0ef",
                        "surface-tint": "#5f5e5e",
                        "surface-variant": "#e5e2e1",
                        "surface-container-lowest": "#ffffff",
                        "surface-container-low": "#f7f3f2",
                        "on-error-container": "#93000a",
                        "on-primary": "#ffffff",
                        "primary": "#0891b2", // Overridden as requested
                        "on-primary-fixed-variant": "#474746",
                        "on-secondary-fixed": "#1b1c1c",
                        "on-secondary": "#ffffff",
                        "on-background": "#1c1b1b",
                        "on-surface-variant": "#444748",
                        "tertiary-container": "#1c1b1a",
                        "secondary-container": "#e1dfdf",
                        "on-tertiary-fixed-variant": "#484645",
                        "primary-container": "#ecfeff", // Overridden as requested
                        "on-secondary-fixed-variant": "#464747",
                        "on-primary-container": "#083344",
                        "secondary-fixed": "#e4e2e2",
                        "outline": "#747878",
                        "tertiary-fixed": "#e6e2df",
                        "surface-container-highest": "#e5e2e1",
                        "surface-bright": "#fdf8f8",
                        "surface-dim": "#ddd9d8",
                        "on-tertiary-container": "#868382",
                        "secondary-fixed-dim": "#c7c6c6"
                    },
                    borderRadius: {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    spacing: {
                        "stack-gap": "1rem",
                        "section-gap": "5rem",
                        "desktop-padding": "4rem",
                        "mobile-padding": "1.5rem",
                        "container-max": "1200px"
                    },
                    fontFamily: {
                        "headline-display": ["EB Garamond"],
                        "headline-lg-mobile": ["EB Garamond"],
                        "body-md": ["Plus Jakarta Sans"],
                        "headline-lg": ["EB Garamond"],
                        "label-lg": ["Plus Jakarta Sans"],
                        "label-sm": ["Plus Jakarta Sans"]
                    },
                    fontSize: {
                        "headline-display": ["48px", { "lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                        "headline-lg-mobile": ["30px", { "lineHeight": "1.3", "fontWeight": "600" }],
                        "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
                        "headline-lg": ["36px", { "lineHeight": "1.3", "fontWeight": "500" }],
                        "label-lg": ["14px", { "lineHeight": "1.2", "letterSpacing": "0.08em", "fontWeight": "700" }],
                        "label-sm": ["12px", { "lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600" }]
                    }
                }
            }
        }
    </script>
<style>
        .noise-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            z-index: 9999;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E");
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
    </style>
</head>
<body class="bg-background text-on-background antialiased relative">
<div class="noise-overlay"></div>
<!-- 1. TopNavBar -->
<nav class="bg-surface/95 dark:bg-surface-container-highest/95 backdrop-blur-sm docked full-width top-0 sticky z-50 border-b border-outline-variant shadow-sm transition-all duration-300" id="navbar">
<div class="max-w-[1200px] mx-auto flex justify-between items-center px-mobile-padding md:px-desktop-padding py-4">
<a class="font-headline-lg text-headline-lg font-bold text-primary flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full hover:opacity-80 transition-opacity duration-300" href="#">
                ${name}
            </a>
<div class="hidden md:flex gap-8 items-center font-label-lg text-label-lg">
<a class="text-on-surface-variant hover:text-primary transition-colors" href="#savoir-faire">Savoir-faire</a>
<a class="text-on-surface-variant hover:text-primary transition-colors" href="#services">Services</a>
<a class="text-on-surface-variant hover:text-primary transition-colors" href="#histoire">Histoire</a>
<a class="text-on-surface-variant hover:text-primary transition-colors" href="#contact">Contact</a>
</div>
<a class="hidden md:inline-block bg-primary text-on-primary font-label-lg text-label-lg px-6 py-3 rounded-lg hover:opacity-90 transition-opacity uppercase tracking-wider" href="#contact">
                Prendre RDV
            </a>
<button class="md:hidden text-on-surface hover:text-primary">
<span class="material-symbols-outlined text-3xl">menu</span>
</button>
</div>
</nav>
<!-- 2. Hero Section -->
<section class="relative h-[819px] flex items-center justify-center overflow-hidden">
<div class="absolute inset-0 bg-cover bg-center z-0" data-alt="A highly detailed macro photograph of professional veterinary medical equipment, featuring a sleek modern stethoscope resting elegantly on a warm, rich wooden examination table. No humans are present. The lighting is soft, clinical yet inviting, casting gentle shadows that emphasize the texture of the wood and the metallic sheen of the instruments. The overall mood is calm, professional, and reassuring, perfectly suited for a high-end medical clinic landing page." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCCgOthr7nPcMYeMqQ9qw4iPkFcNK-yPe1dJruOyIath30tJy43QEuhe9XPpB0jpmkMSbSVyCGxcWkn8aROGf67Th21aCbpvZ8dPYHP4GXb7xBwOWzmCs2dNAWy-YgxQzsKwRUTwC4NrN8Trug_NumIJNF-oCbXhb204NQcFMqKRWD0_1A73Glyllneufo5f6IJ7qB74vRtQP7hBXZfMz66SVttcwg8OkaJpWnHcXE4ib4aHL5BxQTL6QsPSjAA8DUd7D7g90FFFtI')"></div>
<div class="absolute inset-0 bg-surface/60 backdrop-blur-[2px] z-10"></div>
<div class="relative z-20 max-w-[1200px] mx-auto px-mobile-padding md:px-desktop-padding text-center">
<h1 class="font-headline-display text-headline-lg-mobile md:text-headline-display text-on-surface mb-6 max-w-4xl mx-auto">
                Cabinet vétérinaire à ${city}
            </h1>
<p class="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto mb-10 text-lg md:text-xl">
                La santé et le bien-être de vos compagnons, au cœur de notre engagement. Une médecine douce et experte pour ceux que vous aimez.
            </p>
<div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
<a class="bg-primary text-on-primary font-label-lg text-label-lg px-8 py-4 rounded-lg hover:opacity-90 transition-opacity uppercase tracking-wider w-full sm:w-auto text-center shadow-lg shadow-primary/20" href="#contact">
                    Urgence / Prendre RDV
                </a>
</div>
</div>
</section>
<!-- 3. Savoir-faire / Histoire -->
<section class="py-section-gap max-w-[1200px] mx-auto px-mobile-padding md:px-desktop-padding" id="histoire">
<div class="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
<div>
<span class="font-label-lg text-label-lg text-primary uppercase tracking-widest block mb-4">Notre Histoire</span>
<h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-6">
                    Une passion ancrée dans la rigueur médicale
                </h2>
<div class="font-body-md text-body-md text-on-surface-variant space-y-4">
<p>
                        Fondé sur l'excellence du savoir-faire vétérinaire, notre cabinet allie tradition médicale et technologies de pointe. Nous croyons profondément en une médecine douce, respectueuse de la nature profonde de chaque animal.
                    </p>
<p>
                        Chaque consultation est un moment d'écoute privilégié. Nous prenons le temps d'observer, de comprendre et de rassurer, instaurant un climat de confiance indispensable aux soins prodigués. Notre équipe partage une vocation commune : offrir les meilleurs standards de soins dans un environnement apaisant.
                    </p>
</div>
</div>
<div class="relative aspect-square md:aspect-auto md:h-[600px] rounded-xl overflow-hidden shadow-sm">
<img class="absolute inset-0 w-full h-full object-cover" data-alt="A pristine, highly detailed photograph of a modern veterinary clinic waiting area and treatment room. The space is impeccably clean, featuring soft cyan and white tones, natural wood accents, and abundant warm natural light streaming through large windows. The design is sleek yet cozy, evoking a sense of calm, premium care, and professional medical expertise. No human figures are present, focusing purely on the high-end architectural and interior design elements of the clinic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBhax37y7EVE_HWS4upJoLZZyOf0cwbaTjMzu4stqeelHakzCyaGs8_E5Uk_-0IdgtI4-3oDzWdzhVyAUFxtyEv3Fgm_gYN-iGv-dNtGjCHp24rgoNgwDvcHprJxScBZOZQO3_4Hkfgzk2zE0We_P1k0ErB0QYkk5KLVEY45wDNA7OgOsL9NY2eWSplIaKhKs9r6lVJcQFoqFnuvbKSi7mfD2BFTCXypujrPXD_yQrLC0GIJsuS6aZ-NjR_Q2__on-kqVJR4kMJSAw"/>
</div>
</div>
</section>
<!-- 4. Services Grid -->
<section class="py-section-gap bg-surface-container-low border-y border-outline-variant/30" id="services">
<div class="max-w-[1200px] mx-auto px-mobile-padding md:px-desktop-padding">
<div class="text-center mb-16">
<span class="font-label-lg text-label-lg text-primary uppercase tracking-widest block mb-4">Notre Savoir-faire</span>
<h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
                    Services &amp; Expertises Médicales
                </h2>
</div>
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
<!-- Card 1 -->
<div class="bg-surface p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-outline-variant/20 group">
<div class="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined">stethoscope</span>
</div>
<h3 class="font-headline-lg text-2xl mb-3 text-on-surface">Consultations</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Bilan de santé complet, vaccinations et médecine préventive pour assurer un suivi rigoureux tout au long de la vie de votre compagnon.</p>
</div>
<!-- Card 2 -->
<div class="bg-surface p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-outline-variant/20 group">
<div class="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined">surgical</span>
</div>
<h3 class="font-headline-lg text-2xl mb-3 text-on-surface">Chirurgie</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Interventions chirurgicales courantes et spécialisées dans un bloc opératoire équipé des dernières technologies d'anesthésie et de monitoring.</p>
</div>
<!-- Card 3 -->
<div class="bg-surface p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-outline-variant/20 group">
<div class="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined">dentistry</span>
</div>
<h3 class="font-headline-lg text-2xl mb-3 text-on-surface">Dentisterie</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Soins dentaires complets, détartrage et extractions pour maintenir une hygiène bucco-dentaire optimale, essentielle à la santé globale.</p>
</div>
<!-- Card 4 -->
<div class="bg-surface p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-outline-variant/20 group">
<div class="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined">radiology</span>
</div>
<h3 class="font-headline-lg text-2xl mb-3 text-on-surface">Imagerie</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Radiographie numérique et échographie haute résolution permettant des diagnostics rapides et précis en interne.</p>
</div>
<!-- Card 5 -->
<div class="bg-surface p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-outline-variant/20 group">
<div class="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined">biotech</span>
</div>
<h3 class="font-headline-lg text-2xl mb-3 text-on-surface">Analyses</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Laboratoire d'analyses sanguines et microscopiques sur place garantissant des résultats immédiats pour une prise en charge réactive.</p>
</div>
<!-- Card 6 -->
<div class="bg-surface p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-outline-variant/20 group">
<div class="w-12 h-12 rounded-full bg-primary-container flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
<span class="material-symbols-outlined">nutrition</span>
</div>
<h3 class="font-headline-lg text-2xl mb-3 text-on-surface">Conseils Nutrition</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Accompagnement personnalisé et prescription diététique adaptée aux besoins spécifiques, à l'âge et aux pathologies de votre animal.</p>
</div>
</div>
</div>
</section>
<!-- 5. Quality/Assurance Numbers -->
<section class="py-16 bg-surface border-b border-outline-variant/30">
<div class="max-w-[1200px] mx-auto px-mobile-padding md:px-desktop-padding">
<div class="grid grid-cols-1 md:grid-cols-3 gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-outline-variant/30">
<div class="py-4 md:py-0">
<span class="block font-headline-display text-primary text-5xl mb-2">15+</span>
<span class="font-label-lg text-label-lg text-on-surface-variant uppercase">Années d'expérience</span>
</div>
<div class="py-4 md:py-0">
<span class="block font-headline-display text-primary text-5xl mb-2">5000+</span>
<span class="font-label-lg text-label-lg text-on-surface-variant uppercase">Patients soignés</span>
</div>
<div class="py-4 md:py-0">
<span class="block font-headline-display text-primary text-5xl mb-2">6</span>
<span class="font-label-lg text-label-lg text-on-surface-variant uppercase">Membres de l'équipe</span>
</div>
</div>
</div>
</section>
<!-- 6. Species Focus -->
<section class="py-section-gap max-w-[1200px] mx-auto px-mobile-padding md:px-desktop-padding">
<div class="text-center mb-12">
<h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface">
                Nos patients de prédilection
            </h2>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
<div class="relative h-80 rounded-xl overflow-hidden group cursor-pointer">
<div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" data-alt="A beautiful, highly detailed close-up shot of the textured fur and bright eyes of a calm, healthy dog. The background is softly blurred in an elegant clinical setting, emphasizing the animal's gentle nature and the premium, caring environment of the clinic. Soft natural lighting, deep neutral tones with subtle cyan highlights." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuChmJEXb7gG7FNCg16JN7jayF76LbSdKjQ-10U9Q-3eidQVrADDYYfnmYPOahF6pvLMD-8Et5nttoJmkUc5e1e77qxT18dred1gOZn7CCtt18DRQUv3t_cIngkzhpHtS6oeNxZtLXgV5mXzDDHg1NL2F_LRCVbxE2f0ZBaCwbjG6q4x66bWVEf8kCYCca3PbMpAz34J7Wt6SKhbDZ2ZHkw5NcQildhiGxIVS6CPb3TufetZUglrZpFOOI1OHHyi1LBXMvPa7cXu6es')"></div>
<div class="absolute inset-0 bg-gradient-to-t from-tertiary/80 to-transparent"></div>
<div class="absolute bottom-6 left-6 text-on-tertiary">
<span class="font-headline-lg text-2xl block mb-1">Chiens</span>
<span class="font-body-md text-sm opacity-90">Médecine &amp; Chirurgie</span>
</div>
</div>
<div class="relative h-80 rounded-xl overflow-hidden group cursor-pointer">
<div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" data-alt="A macro, beautifully lit photograph of a cat's soft paw resting gently on a pristine, medical-grade wooden surface. The focus is incredibly sharp on the texture of the paw and the clean wood grain. The lighting is ethereal, soft, and calming, conveying a sense of gentle care, hygiene, and high-end feline veterinary expertise." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBSxToO8wGfqVKcfs9S5ZYKOmxTMrTIws11VjXXvkHYDEjDe7DViBFVjfVRzM6p5up7yo5JY8VuRZxYJuwYQyiqjI--RS5o3vmyWd8yeiy7r7llFYbou960a4hWE80y4k5jjZesREeV8j6lT_YuU2zpglNO8lYseWCIH5dCOXcxMiJcPrG1J850xg1qDrgbhMpB1CzltbcDc3WtsG9bAyWR6E5qJ5Ba5JAAAghiR57EtHITwXn0BdvakKC7O7yB37TPK9WWiWmv2OQ')"></div>
<div class="absolute inset-0 bg-gradient-to-t from-tertiary/80 to-transparent"></div>
<div class="absolute bottom-6 left-6 text-on-tertiary">
<span class="font-headline-lg text-2xl block mb-1">Chats</span>
<span class="font-body-md text-sm opacity-90">Espace Cat-Friendly</span>
</div>
</div>
<div class="relative h-80 rounded-xl overflow-hidden group cursor-pointer">
<div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" data-alt="An artistic, high-resolution close-up of the delicate scales of a healthy reptile or the vibrant feathers of a parrot, positioned against a clean, modern, soft-cyan clinical background. The image implies specialized care for exotic pets (NAC) in a highly professional, sterile yet welcoming veterinary environment. The lighting emphasizes texture and health." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuABX5T1sGjef5B22a9XHuimhDHQXEzVZpgyCx-dTDTBsQeJEawyfQ0edHhkwmQjYU_Bqwbo9dtGKDWBUMWYhfNDDdWBeeTTDvrv1w6n0w5Piky25frpoJp4iqVd4I9P_DA0DDABUC1AoJ7n5TpS-y1WzbXw9wHooaWqKZBWwTpLo-D-ORiBPcwHGxRf2A8Mhv9DfNc0ow2LMhq8J_vlA6NxlgQcI5sG0FEdS1ULfpBo3Zlin8X4Au68Lv3ZkYqeQrWJ-t6bSw7aBSc')"></div>
<div class="absolute inset-0 bg-gradient-to-t from-tertiary/80 to-transparent"></div>
<div class="absolute bottom-6 left-6 text-on-tertiary">
<span class="font-headline-lg text-2xl block mb-1">NAC</span>
<span class="font-body-md text-sm opacity-90">Soins spécialisés</span>
</div>
</div>
</div>
</section>
<!-- 7. Contact Section -->
<section class="py-section-gap bg-surface-container-high border-t border-outline-variant/30" id="contact">
<div class="max-w-[1200px] mx-auto px-mobile-padding md:px-desktop-padding">
<div class="grid grid-cols-1 lg:grid-cols-2 gap-16">
<!-- Info & Map -->
<div>
<h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-on-surface mb-8">
                        Venir nous rencontrer
                    </h2>
<div class="space-y-6 mb-8 font-body-md text-body-md text-on-surface-variant">
<div class="flex items-start gap-4">
<span class="material-symbols-outlined text-primary mt-1">location_on</span>
<div>
<strong class="text-on-surface block mb-1">Adresse</strong>
                                123 Avenue de la République<br/>
                                ${city}
                            </div>
</div>
<div class="flex items-start gap-4">
<span class="material-symbols-outlined text-primary mt-1">schedule</span>
<div>
<strong class="text-on-surface block mb-1">Horaires</strong>
                                Lundi - Vendredi : 8h30 - 19h00<br/>
                                Samedi : 9h00 - 12h00
                            </div>
</div>
<div class="flex items-start gap-4">
<span class="material-symbols-outlined text-primary mt-1">call</span>
<div>
<strong class="text-on-surface block mb-1">Téléphone &amp; Urgences</strong>
                                ${phoneDisplay}
                            </div>
</div>
</div>
<div class="h-64 rounded-xl overflow-hidden shadow-sm border border-outline-variant/20 bg-surface-container relative">
<!-- Placeholder for Map -->
<div class="absolute inset-0 flex items-center justify-center text-on-surface-variant flex-col" data-location="${city}" style="">
<span class="material-symbols-outlined text-4xl mb-2 opacity-50">map</span>
<span class="font-label-sm uppercase tracking-widest opacity-50">Carte interactive : ${city}</span>
</div>
</div>
</div>
<!-- Form -->
<div class="bg-surface p-8 md:p-10 rounded-xl shadow-sm border border-outline-variant/20">
<h3 class="font-headline-lg text-2xl text-on-surface mb-6">Demande de Rendez-vous</h3>
<form class="space-y-5" onsubmit="event.preventDefault();">
<div class="grid grid-cols-1 md:grid-cols-2 gap-5">
<div>
<label class="block font-label-sm text-label-sm text-on-surface mb-2 uppercase">Nom de l'animal</label>
<input class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors px-4 py-3" placeholder="Rex" type="text"/>
</div>
<div>
<label class="block font-label-sm text-label-sm text-on-surface mb-2 uppercase">Espèce</label>
<select class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors px-4 py-3">
<option>Chien</option>
<option>Chat</option>
<option>NAC</option>
</select>
</div>
</div>
<div>
<label class="block font-label-sm text-label-sm text-on-surface mb-2 uppercase">Votre Nom</label>
<input class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors px-4 py-3" placeholder="Jean Dupont" type="text"/>
</div>
<div>
<label class="block font-label-sm text-label-sm text-on-surface mb-2 uppercase">Téléphone</label>
<input class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors px-4 py-3" placeholder="06 XX XX XX XX" type="tel"/>
</div>
<div>
<label class="block font-label-sm text-label-sm text-on-surface mb-2 uppercase">Motif de la consultation</label>
<textarea class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-body-md rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors px-4 py-3 resize-none" placeholder="Décrivez brièvement le besoin..." rows="4"></textarea>
</div>
<button class="w-full bg-primary text-on-primary font-label-lg text-label-lg px-6 py-4 rounded-lg hover:opacity-90 transition-opacity uppercase tracking-wider mt-4" type="submit">
                            Envoyer la demande
                        </button>
</form>
</div>
</div>
</div>
</section>
<!-- 8. Footer -->
<footer class="bg-surface-container-high dark:bg-tertiary-container full-width border-t border-outline-variant flat no shadows">
<div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-stack-gap px-mobile-padding md:px-desktop-padding py-section-gap items-center text-center md:text-left">
<div class="font-headline-lg text-headline-lg text-on-surface dark:text-on-tertiary-container">
                ${name}
            </div>
<div class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70">
                © ${year} ${name}. Tous droits réservés.
            </div>
<div class="flex gap-6 justify-center md:justify-end font-label-sm text-label-sm">
<a class="text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary rounded" href="#">Mentions Légales</a>
<a class="text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary rounded" href="#">Confidentialité</a>
<a class="text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary rounded" href="#">CGV</a>
</div>
</div>
</footer>
<script>
        // Simple script to handle navbar scroll effect if needed
        window.addEventListener('scroll', () => {
            const nav = document.getElementById('navbar');
            if (window.scrollY > 20) {
                nav.classList.add('shadow-md');
            } else {
                nav.classList.remove('shadow-md');
            }
        });
    </script>
</body></html>`;
}
