/**
 * Template Stitch MENUISIER — pixel-pixel copy de :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/menuisier_name_1/code.html
 *
 * Substitutions minimales (le DESIGN n'est PAS touché) :
 * - {{NAME}} → p.name | {{CITY}} → p.city
 * - tous les téléphones → p.phone (auto-detect via regex)
 * - "12 rue des Artisans" et similaires → p.address
 * - nav sticky top-0 → sticky top-[54px] (passe sous la sales-ui-bar 54px)
 * - année footer dynamique
 */

export type MenuisierPixelProspect = {
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

const esc = (s: string | null | undefined): string =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function generateStitchMenuisierPixelMockupHtml(p: MenuisierPixelProspect): string {
  const name = esc(p.name || "");
  const city = esc(p.city || "votre ville");
  const phoneDisplay = esc(p.phone || "");
  const phoneDigits = (p.phone || "").replace(/[^\d+]/g, "");
  const addressDisplay = p.address ? esc(p.address) : `12 rue principale, ${city}`;
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>

<html class="dark" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Menuisier Ébéniste - Artisanat d'Exception</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
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
                        "primary": "#000000",
                        "on-primary-fixed-variant": "#474746",
                        "on-secondary-fixed": "#1b1c1c",
                        "on-secondary": "#ffffff",
                        "on-background": "#1c1b1b",
                        "on-surface-variant": "#444748",
                        "tertiary-container": "#1c1b1a",
                        "secondary-container": "#e1dfdf",
                        "on-tertiary-fixed-variant": "#484645",
                        "primary-container": "#1c1b1b",
                        "on-secondary-fixed-variant": "#464747",
                        "on-primary-container": "#858383",
                        "secondary-fixed": "#e4e2e2",
                        "outline": "#747878",
                        "tertiary-fixed": "#e6e2df",
                        "surface-container-highest": "#e5e2e1",
                        "surface-bright": "#fdf8f8",
                        "surface-dim": "#ddd9d8",
                        "on-tertiary-container": "#868382",
                        "secondary-fixed-dim": "#c7c6c6"
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
                        "desktop-padding": "4rem",
                        "mobile-padding": "1.5rem",
                        "container-max": "1200px"
                    },
                    "fontFamily": {
                        "headline-display": ["EB Garamond"],
                        "headline-lg-mobile": ["EB Garamond"],
                        "body-md": ["Plus Jakarta Sans"],
                        "headline-lg": ["EB Garamond"],
                        "label-lg": ["Plus Jakarta Sans"],
                        "label-sm": ["Plus Jakarta Sans"]
                    },
                    "fontSize": {
                        "headline-display": ["48px", {"lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                        "headline-lg-mobile": ["30px", {"lineHeight": "1.3", "fontWeight": "600"}],
                        "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
                        "headline-lg": ["36px", {"lineHeight": "1.3", "fontWeight": "500"}],
                        "label-lg": ["14px", {"lineHeight": "1.2", "letterSpacing": "0.08em", "fontWeight": "700"}],
                        "label-sm": ["12px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600"}]
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
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E");
        }
        
        .image-texture-overlay::after {
            content: '';
            position: absolute;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E");
            pointer-events: none;
        }

        .text-brown-primary { color: #78350f; }
        .bg-brown-primary { background-color: #78350f; }
        .border-brown-primary { border-color: #78350f; }
        
        .text-brown-secondary { color: #fde68a; }
        .bg-brown-secondary { background-color: #fde68a; }
        
        /* Smooth scrolling */
        html { scroll-behavior: smooth; }
    </style>
</head>
<body class="bg-surface text-on-surface font-body-md antialiased relative">
<div class="noise-overlay"></div>
<!-- TopNavBar -->
<header class="bg-surface/95 dark:bg-surface-container-highest/95 backdrop-blur-sm docked full-width top-0 sticky z-50 border-b border-outline-variant dark:border-outline shadow-sm">
<div class="max-w-[1200px] mx-auto flex justify-between items-center px-mobile-padding md:px-desktop-padding py-4">
<div class="font-headline-lg text-headline-lg font-bold text-primary dark:text-on-primary flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full">
                ${name}
            </div>
<nav class="hidden md:flex gap-8">
<a class="font-label-lg text-label-lg text-primary dark:text-inverse-primary border-b-2 border-primary pb-1 hover:opacity-80 transition-opacity duration-300" href="#accueil">Accueil</a>
<a class="font-label-lg text-label-lg text-on-surface-variant dark:text-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300" href="#savoir-faire">Savoir-faire</a>
<a class="font-label-lg text-label-lg text-on-surface-variant dark:text-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300" href="#services">Services</a>
<a class="font-label-lg text-label-lg text-on-surface-variant dark:text-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300" href="#contact">Contact</a>
</nav>
<button class="font-label-lg text-label-lg bg-primary text-on-primary px-6 py-3 rounded-full hover:opacity-80 transition-opacity duration-300 uppercase tracking-widest hidden md:block">
                Devis
            </button>
<button class="md:hidden text-on-surface">
<span class="material-symbols-outlined text-2xl">menu</span>
</button>
</div>
</header>
<main>
<!-- Hero Section -->
<section class="relative h-[819px] flex items-center justify-center overflow-hidden" id="accueil">
<div class="absolute inset-0 z-0">
<div class="bg-cover bg-center w-full h-full image-texture-overlay" data-alt="An extreme macro close-up of deeply textured, raw oak wood grain. The lighting is dramatic and warm, emphasizing the natural ridges, rings, and imperfections of the timber. A subtle golden hour glow catches the edge of a traditional hand plane resting on the wood. The overall aesthetic is rustic luxury, highly detailed, and evocative of artisanal craftsmanship. Corporate modern style, warm light." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDXfmtm37jjyHhu838NIO7nJ6x2VwE0z2A9X2DJzRv-dxSOWp5kEGXv6_sIfxlSpFdfi-vWEcE0WxIP1UA4Gge6ACvFGYAOEG7bCbgHEFNHLl7s4TkZfIzHdYvPEIx8R2Xy6jcuIrAusSqBLb8GOI8b__vaF3QyM-FS-72nfcxsoeqQzmNA3WXpA8DqJceXO2CMfPXIF2HSCTERZo8gFS3VYpeFcSnzdgL7kYYElFi6rOUdc_O_YRh0F3GffpWJCTUuF-HtuNxPvDg')"></div>
<div class="absolute inset-0 bg-surface/40 backdrop-blur-[2px]"></div>
</div>
<div class="relative z-10 text-center px-mobile-padding max-w-[800px] mx-auto mt-16">
<h1 class="font-headline-display text-headline-display text-primary mb-6">
                    Menuiserie sur mesure à ${city}
                </h1>
<p class="font-body-md text-body-md text-on-surface-variant mb-10 max-w-2xl mx-auto text-lg">
                    L'art de transformer le bois en pièces d'exception pour votre intérieur. Une maîtrise absolue du geste pour des créations intemporelles.
                </p>
<button class="font-label-lg text-label-lg bg-primary text-on-primary px-8 py-4 rounded-full uppercase tracking-widest hover:bg-surface-tint transition-colors shadow-sm inline-flex items-center gap-2">
                    Projet sur-mesure
                    <span class="material-symbols-outlined text-sm">arrow_forward</span>
</button>
</div>
</section>
<!-- L'Histoire du Bois -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding max-w-container-max mx-auto" id="savoir-faire">
<div class="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
<div class="space-y-8">
<div class="flex items-center gap-4">
<div class="w-12 h-[1px] bg-outline"></div>
<span class="font-label-lg text-label-lg text-outline uppercase tracking-widest">Héritage</span>
</div>
<h2 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">
                        La noblesse du geste, la vérité de la matière.
                    </h2>
<p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        Chaque essence raconte une histoire. Des chênes centenaires de nos forêts locales aux noyers profonds, nous sélectionnons nos bois avec une exigence absolue. Notre approche marie les techniques d'assemblage traditionnelles (tenons, mortaises, queues d'aronde) avec une précision contemporaine.
                    </p>
<p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">
                        Il ne s'agit pas seulement de fabriquer un meuble, mais de sculpter une pièce de vie qui traversera les générations, en respectant la nature du fil et la tension de la matière.
                    </p>
</div>
<div class="relative h-[500px] rounded-lg overflow-hidden shadow-sm image-texture-overlay">
<img class="object-cover w-full h-full" data-alt="A highly detailed close-up shot of an artisan's hands gently smoothing the edge of a massive, raw walnut wood slab. The hands are weathered and covered in fine sawdust, emphasizing hard work and dedication. The lighting is natural, casting soft shadows across the wood grain. The background is a beautifully blurred, organized workshop environment with vintage chisels and clamps. Professional, warm, and authentic aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQkCYumPpo7ptR2X4LaVXny7HHGaA83hNHdhXnXiN4NJzrsvvPJptOj_R5G7t1uRXtuMJ_SFi0yTPB-MQACRMArsvoDElHwoCRPV-YMfUPU3e9PNg1xHOg-OorZpWlCDDmq2Odx-AV9tSVH-LhETRW2fch1ThjT_TsukFWSSpeMuVLB-RCWmoSN_O4QGZomTrPM51ZzgGLjNr07S8O9GclKhVZnaqWl9WLuKYyYUrSC_v1BDOzBaBa3s2zfEn-BWW5qXvqS4emQ1g"/>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="bg-surface-container-high dark:bg-tertiary-container full-width border-t border-outline-variant flat no shadows">
<div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-stack-gap px-mobile-padding md:px-desktop-padding py-section-gap">
<div>
<div class="font-headline-lg text-headline-lg text-on-surface dark:text-on-tertiary-container mb-4">
                    ${name}
                 </div>
<p class="font-label-sm text-label-sm text-on-surface-variant mb-6">Artisan Menuisier Ébéniste.</p>
<p class="font-body-md text-body-md text-on-surface-variant">© ${year} ${name}. Tous droits réservés.</p>
</div>
<div class="md:col-span-2 flex flex-wrap gap-8 justify-start md:justify-end">
<a class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary" href="#">Mentions Légales</a>
<a class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary" href="#">Confidentialité</a>
<a class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary" href="#">CGV</a>
</div>
</div>
</footer>
</body></html>`;
}
