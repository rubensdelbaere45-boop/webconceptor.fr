/**
 * Template Stitch PLOMBIER — pixel-pixel copy de :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/plombier_name_1/code.html
 */
export type PlombierPixelProspect = {
  id: string; slug: string; name: string;
  city?: string | null; address?: string | null;
  phone?: string | null; email?: string | null;
  hours?: string | null;
  google_rating?: number | null; google_reviews_count?: number | null;
  reviews?: Array<{ author?: string; rating?: number; text?: string; timeAgo?: string }> | null;
  site_style_dna?: unknown;
};

const esc = (s: string | null | undefined): string =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function generateStitchPlombierPixelMockupHtml(p: PlombierPixelProspect): string {
  const name = esc(p.name || "");
  const city = esc(p.city || "votre ville");
  const phoneDisplay = esc(p.phone || "");
  const phoneDigits = (p.phone || "").replace(/[^\d+]/g, "");
  const addressDisplay = p.address ? esc(p.address) : `12 rue principale, ${city}`;
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>

<html class="light" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Plombier - Artisan de Confiance</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&amp;family=Plus+Jakarta+Sans:wght@400;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    colors: {
                        "surface-container-lowest": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "on-primary-container": "#858383",
                        "secondary-fixed": "#e4e2e2",
                        "on-secondary-fixed-variant": "#464747",
                        "on-primary-fixed-variant": "#474746",
                        "surface-container-low": "#f7f3f2",
                        "primary": "#000000",
                        "on-background": "#1c1b1b",
                        "on-tertiary-container": "#868382",
                        "inverse-surface": "#313030",
                        "surface-variant": "#e5e2e1",
                        "secondary-container": "#e1dfdf",
                        "on-tertiary-fixed": "#1c1b1a",
                        "secondary-fixed-dim": "#c7c6c6",
                        "tertiary-container": "#1c1b1a",
                        "on-error": "#ffffff",
                        "error-container": "#ffdad6",
                        "primary-fixed-dim": "#c8c6c5",
                        "on-secondary-fixed": "#1b1c1c",
                        "secondary": "#5e5e5e",
                        "on-primary": "#ffffff",
                        "on-error-container": "#93000a",
                        "surface-container-high": "#ebe7e6",
                        "surface": "#fdf8f8",
                        "inverse-primary": "#c8c6c5",
                        "primary-fixed": "#e5e2e1",
                        "tertiary": "#000000",
                        "on-surface": "#1c1b1b",
                        "on-primary-fixed": "#1c1b1b",
                        "surface-container": "#f1edec",
                        "inverse-on-surface": "#f4f0ef",
                        "surface-tint": "#5f5e5e",
                        "background": "#fdf8f8",
                        "tertiary-fixed": "#e6e2df",
                        "surface-container-highest": "#e5e2e1",
                        "on-surface-variant": "#444748",
                        "surface-bright": "#fdf8f8",
                        "error": "#ba1a1a",
                        "outline-variant": "#c4c7c7",
                        "surface-dim": "#ddd9d8",
                        "primary-container": "#1c1b1b",
                        "outline": "#747878",
                        "tertiary-fixed-dim": "#cac6c4",
                        "on-tertiary-fixed-variant": "#484645",
                        "on-secondary-container": "#626263",
                        "on-secondary": "#ffffff"
                    },
                    borderRadius: {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    spacing: {
                        "stack-gap": "1rem",
                        "desktop-padding": "4rem",
                        "container-max": "1200px",
                        "section-gap": "5rem",
                        "mobile-padding": "1.5rem"
                    },
                    fontFamily: {
                        "headline-lg-mobile": ["EB Garamond"],
                        "headline-display": ["EB Garamond"],
                        "headline-lg": ["EB Garamond"],
                        "label-sm": ["Plus Jakarta Sans"],
                        "body-md": ["Plus Jakarta Sans"],
                        "label-lg": ["Plus Jakarta Sans"]
                    },
                    fontSize: {
                        "headline-lg-mobile": ["30px", { "lineHeight": "1.3", "fontWeight": "600" }],
                        "headline-display": ["48px", { "lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                        "headline-lg": ["36px", { "lineHeight": "1.3", "fontWeight": "500" }],
                        "label-sm": ["12px", { "lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600" }],
                        "body-md": ["16px", { "lineHeight": "1.6", "fontWeight": "400" }],
                        "label-lg": ["14px", { "lineHeight": "1.2", "letterSpacing": "0.08em", "fontWeight": "700" }]
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
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            opacity: 0.04;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        
        body {
            background-color: theme('colors.background');
            color: theme('colors.on-background');
        }

        .paper-shadow {
            box-shadow: 0 4px 8px -2px rgba(0, 0, 0, 0.04);
        }
    </style>
</head>
<body class="antialiased font-body-md text-body-md selection:bg-primary selection:text-on-primary min-h-screen flex flex-col">
<div class="texture-overlay"></div>
<!-- TopNavBar -->
<nav class="fixed top-0 w-full z-50 bg-surface/95 backdrop-blur-sm border-b border-outline-variant shadow-sm transition-all duration-300" id="navbar">
<div class="flex justify-between items-center h-20 px-mobile-padding md:px-desktop-padding max-w-container-max mx-auto">
<!-- Brand Logo -->
<a class="font-headline-lg text-headline-lg tracking-tighter text-primary flex items-center gap-2" href="#">
<span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1;">plumbing</span>
                ARTISANAT LOCAL
            </a>
<!-- Navigation Links (Desktop) -->
<div class="hidden md:flex items-center gap-8">
<a class="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#services">Services</a>
<a class="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#realisations">Réalisations</a>
<a class="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors" href="#contact">Contact</a>
<!-- Trailing Action -->
<a class="inline-flex items-center justify-center bg-primary text-on-primary font-label-lg text-label-lg px-6 py-3 rounded-DEFAULT hover:bg-inverse-surface transition-colors" href="tel:${phoneDigits}">
                    DEVIS GRATUIT
                </a>
</div>
<!-- Mobile Menu Button -->
<button class="md:hidden text-primary p-2">
<span class="material-symbols-outlined text-2xl">menu</span>
</button>
</div>
</nav>
<!-- Emergency Banner -->
<div class="bg-[#1e40af] text-white pt-24 pb-3 px-mobile-padding md:px-desktop-padding text-center shadow-md">
<div class="max-w-container-max mx-auto flex items-center justify-center gap-2">
<span class="material-symbols-outlined animate-pulse text-[#0ea5e9]" style="font-variation-settings: 'FILL' 1;">emergency</span>
<span class="font-label-lg text-label-lg tracking-widest uppercase">Disponible 7j/7 — Délai d'intervention 2h max</span>
</div>
</div>
<main class="flex-grow">
<!-- Hero Section -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding">
<div class="max-w-container-max mx-auto flex flex-col md:flex-row items-center gap-12">
<div class="flex-1 space-y-8">
<h1 class="font-headline-display text-headline-display text-primary leading-tight">
                        Confiance, urgence maîtrisée.
                    </h1>
<p class="font-body-md text-body-md text-on-surface-variant max-w-lg text-lg">
                        Dépannage rapide et travaux propres à <span class="font-bold text-[#1e40af]">Paris</span>. Une expertise artisanale pour vos installations sanitaires, avec la garantie d'un travail soigné.
                    </p>
<div class="flex flex-col sm:flex-row gap-4 pt-4">
<a class="inline-flex items-center justify-center gap-2 bg-[#1e40af] text-white font-label-lg text-label-lg px-8 py-4 rounded-DEFAULT hover:bg-[#1e3a8a] transition-all shadow-md hover:shadow-lg" href="tel:${phoneDigits}">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">call</span>
                            INTERVENTION URGENTE
                        </a>
<a class="inline-flex items-center justify-center bg-surface border border-outline font-label-lg text-label-lg text-primary px-8 py-4 rounded-DEFAULT hover:bg-surface-container-low transition-colors" href="#services">
                            NOS PRESTATIONS
                        </a>
</div>
</div>
<div class="flex-1 w-full aspect-[4/3] rounded-xl overflow-hidden relative paper-shadow border border-outline-variant bg-surface-container">
<img class="object-cover w-full h-full absolute inset-0" data-alt="A pristine, close-up photograph of newly installed, gleaming copper pipes and brass fittings against a clean, matte white wall. The lighting is bright and professional, highlighting the craftsmanship and precision of the joints. The scene conveys a sense of high-quality, reliable plumbing work. Modern corporate aesthetic, crisp details, cool color temperature with metallic warmth." src="https://lh3.googleusercontent.com/aida-public/AB6AXuD_v8DGCFuaDzVSF6HY8SEUReLIdYtZVsKKFQxYPBPZDq5WCbnl8szCG6FFSQUdCPviUj5NYbVDSAty2DPx-6aBX8abXu-t3XRSF_PMDTtYuPbwnazkYpcgtiQPBixyOYHA9hW2L-rB5bNn6Qf5zG8hWp-6OurtsUvjRu5nbyM9S2JtbjR5IwQR649jxS8AH9LUcmG0B3oBb51nIJEo2a54RfWxGpigcX7i3xSLWOI2b0vKfGKVSGExKK6ud-M9_4SZJGppCc4J5cY"/>
</div>
</div>
</section>
<!-- Services Bento Grid -->
<section class="py-section-gap bg-surface-container-lowest px-mobile-padding md:px-desktop-padding border-t border-b border-outline-variant" id="services">
<div class="max-w-container-max mx-auto">
<div class="mb-12">
<h2 class="font-headline-lg text-headline-lg text-primary mb-4">Notre Savoir-Faire</h2>
<div class="w-24 h-1 bg-[#1e40af]"></div>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
<!-- Urgent Leak -->
<div class="col-span-1 md:col-span-2 bg-surface rounded-xl p-8 border border-outline-variant paper-shadow group hover:border-[#1e40af] transition-colors relative overflow-hidden flex flex-col justify-end min-h-[300px]">
<div class="absolute inset-0 z-0">
<img class="object-cover w-full h-full opacity-40 group-hover:opacity-60 transition-opacity duration-500 mix-blend-multiply" data-alt="Close up of a modern, sleek designer chrome faucet over a clean, white ceramic sink. Water droplets gleam on the surface. Professional studio lighting emphasizes cleanliness and premium quality plumbing fixtures. Cool bluish-grey background tones. Corporate aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDpw6rGl1fm2ly721JZ2o-WXVT0Yx96hGoRKkbqLDsCucz6XIif7CaaM7K6ug37J2b6MY7Na3VSXrsR0iSXGb9aqCdYAfXFiGW9CMyOIH_TiPlP8f0YF3BI6j7q2DNr4SRApN3eg3OvgVUY8vbKI_oMY0_T05cjPbYyvDtiYyIZZbrrrPkabHzgH_-CO5ZFE1hGTjhJBZOrrw51ffXUdgnQcIBPVdns2BWtkgP2E2RRIDUDsJJgoO0gbdPH-y_ktdYL3g0ZHhtwhw0"/>
</div>
<div class="relative z-10">
<div class="w-12 h-12 bg-[#1e40af] text-white rounded-full flex items-center justify-center mb-6 shadow-md">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">water_drop</span>
</div>
<h3 class="font-headline-lg text-[24px] leading-tight text-primary mb-2">Urgence fuite</h3>
<p class="font-body-md text-body-md text-on-surface-variant max-w-md">Intervention immédiate pour limiter les dégâts. Recherche de fuite non destructive et réparation pérenne.</p>
</div>
</div>
<!-- Water Heater -->
<div class="col-span-1 bg-surface rounded-xl p-8 border border-outline-variant paper-shadow group hover:border-[#0ea5e9] transition-colors flex flex-col">
<div class="w-12 h-12 bg-surface-container-highest text-[#1e40af] rounded-full flex items-center justify-center mb-6">
<span class="material-symbols-outlined">water_heater</span>
</div>
<h3 class="font-headline-lg text-[24px] leading-tight text-primary mb-2">Chauffe-eau</h3>
<p class="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">Dépannage, détartrage et remplacement de ballons d'eau chaude électriques et thermodynamiques.</p>
<a class="inline-flex items-center gap-2 font-label-lg text-label-lg text-[#1e40af] hover:text-[#0ea5e9] transition-colors uppercase" href="#">
                            En savoir plus <span class="material-symbols-outlined text-sm">arrow_forward</span>
</a>
</div>
<!-- Unclogging -->
<div class="col-span-1 bg-surface rounded-xl p-8 border border-outline-variant paper-shadow group hover:border-[#1e40af] transition-colors flex flex-col">
<div class="w-12 h-12 bg-surface-container-highest text-[#1e40af] rounded-full flex items-center justify-center mb-6">
<span class="material-symbols-outlined">plumbing</span>
</div>
<h3 class="font-headline-lg text-[24px] leading-tight text-primary mb-2">Débouchage</h3>
<p class="font-body-md text-body-md text-on-surface-variant mb-6 flex-grow">Intervention rapide sur canalisations engorgées, siphons et colonnes d'évacuation. Outils professionnels adaptés.</p>
</div>
<!-- Renovation -->
<div class="col-span-1 md:col-span-2 bg-surface rounded-xl p-8 border border-outline-variant paper-shadow flex flex-col md:flex-row gap-8 items-center">
<div class="flex-1">
<div class="w-12 h-12 bg-[#0ea5e9] text-white rounded-full flex items-center justify-center mb-6 shadow-md">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">bathtub</span>
</div>
<h3 class="font-headline-lg text-[24px] leading-tight text-primary mb-2">Rénovation &amp; Installation</h3>
<p class="font-body-md text-body-md text-on-surface-variant mb-6">Création ou rénovation complète de salles de bain. Installation de sanitaires haut de gamme, douches à l'italienne et réseaux complets.</p>
<a class="inline-flex items-center justify-center bg-surface border border-outline font-label-lg text-label-lg text-primary px-6 py-3 rounded-DEFAULT hover:bg-surface-container-low transition-colors uppercase" href="#contact">
                                Demander une étude
                            </a>
</div>
<div class="w-full md:w-1/2 aspect-square md:aspect-auto md:h-full rounded-lg overflow-hidden relative">
<img class="object-cover w-full h-full absolute inset-0" data-alt="A highly professional layout of plumbing tools: pipe wrenches, a blowtorch, copper pipe cutters, and measuring tape, meticulously arranged on a clean, light grey work surface. Overhead shot. Crisp lighting, emphasizing the metallic textures and the precision of the trade. Corporate, reliable aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC1worMPDqAuwSCZI1Kq2c8U1GLiClQVAtuFXeB5c954_-589JfCRoL4dttZoZ3TI1Y7L95cX6ZXs1aCg462nPlGleeJQJLVQK0b6rwt18WQj9ERlKNEYT51oyomo-i_Md_zw1uxSGPSTz4zffziShZ1N6w3bwU_abcL51qjsOjvAt4yiysvFP2Qfp-qti3wvzuGRpb6AzP0py_PD8jGBTIjt7KNAi6MqJwMriW67kSzxL74b_R4avlo0IkfmPZYCSH6-KW_Gg4a1o"/>
</div>
</div>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="w-full mt-section-gap bg-surface-container-highest border-t border-outline-variant">
<div class="flex flex-col md:flex-row justify-between items-center py-12 px-mobile-padding md:px-desktop-padding max-w-container-max mx-auto gap-stack-gap">
<!-- Brand -->
<div class="flex flex-col items-center md:items-start gap-4">
<span class="font-headline-lg text-headline-lg text-primary">ARTISANAT LOCAL</span>
<span class="font-body-md text-body-md text-on-surface">© ${year} MAÎTRE ARTISAN. EXCELLENCE &amp; TRADITION.</span>
</div>
<!-- Links -->
<div class="flex flex-wrap justify-center gap-6">
<a class="font-label-sm text-label-sm text-on-surface-variant hover:text-primary underline decoration-1 underline-offset-4 transition-all duration-300 uppercase" href="#">Mentions Légales</a>
<a class="font-label-sm text-label-sm text-on-surface-variant hover:text-primary underline decoration-1 underline-offset-4 transition-all duration-300 uppercase" href="#">Confidentialité</a>
<a class="font-label-sm text-label-sm text-on-surface-variant hover:text-primary underline decoration-1 underline-offset-4 transition-all duration-300 uppercase" href="#">Conditions de Vente</a>
<a class="font-label-sm text-label-sm text-on-surface-variant hover:text-primary underline decoration-1 underline-offset-4 transition-all duration-300 uppercase" href="#">Presse</a>
</div>
</div>
</footer>
<script>
        // Simple navbar shadow on scroll
        window.addEventListener('scroll', () => {
            const nav = document.getElementById('navbar');
            if (window.scrollY > 10) {
                nav.classList.add('shadow-md');
            } else {
                nav.classList.remove('shadow-md');
            }
        });
    </script>
</body></html>`;
}
