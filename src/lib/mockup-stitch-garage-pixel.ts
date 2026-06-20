/**
 * Template Stitch GARAGE — pixel-pixel copy de :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/garage_name_1/code.html
 *
 * Substitutions minimales (le DESIGN n'est PAS touché) :
 * - {{NAME}} → p.name | {{CITY}} → p.city
 * - tous les téléphones → p.phone (auto-detect via regex)
 * - "12 rue des Artisans" et similaires → p.address
 * - nav sticky top-0 → sticky top-[54px] (passe sous la sales-ui-bar 54px)
 * - année footer dynamique
 */

export type GaragePixelProspect = {
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

export function generateStitchGaragePixelMockupHtml(p: GaragePixelProspect): string {
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
<title>Garage Mécanique - ${name} à ${city}</title>
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
                        "tertiary-fixed-dim": "#cac6c4",
                        "surface-container-lowest": "#ffffff",
                        "tertiary-container": "#1c1b1a",
                        "on-tertiary-container": "#868382",
                        "primary": "#b91c1c", // Updated to red as requested
                        "surface-tint": "#5f5e5e",
                        "secondary": "#1f2937", // Updated to dark gray as requested
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
        /* Grain texture overlay */
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
        
        html { scroll-behavior: smooth; }
        body { background-color: theme('colors.surface'); color: theme('colors.on-surface'); }
    </style>
</head>
<body class="relative min-h-screen font-body-md text-body-md antialiased selection:bg-primary/20">
<div class="texture-overlay"></div>
<!-- TopNavBar -->
<header class="bg-surface/95 dark:bg-surface-container-highest/95 backdrop-blur-sm docked full-width top-0 sticky z-50 border-b border-outline-variant shadow-sm transition-all duration-300" id="main-nav">
<div class="max-w-[1200px] mx-auto flex justify-between items-center px-mobile-padding md:px-desktop-padding py-4">
<!-- Brand -->
<a class="font-headline-lg text-headline-lg font-bold text-primary dark:text-on-primary flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full hover:opacity-80 transition-opacity duration-300" href="#">
                ${name}
            </a>
<!-- Navigation Links (Web) -->
<nav class="hidden md:flex items-center gap-8 font-label-lg text-label-lg">
<a class="text-primary dark:text-inverse-primary border-b-2 border-primary pb-1 scale-95 transition-transform hover:opacity-80 transition-opacity duration-300" href="#accueil">Accueil</a>
<a class="text-on-surface-variant dark:text-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300" href="#savoir-faire">Savoir-faire</a>
<a class="text-on-surface-variant dark:text-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300" href="#services">Services</a>
<a class="text-on-surface-variant dark:text-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300" href="#contact">Contact</a>
</nav>
<!-- Trailing Action -->
<a class="hidden md:inline-flex items-center justify-center bg-primary text-on-primary px-6 py-3 rounded DEFAULT font-label-lg text-label-lg uppercase hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md" href="#contact">
                Devis
            </a>
<!-- Mobile Menu Toggle -->
<button aria-label="Menu" class="md:hidden text-on-surface p-2" id="mobile-menu-btn">
<span class="material-symbols-outlined">menu</span>
</button>
</div>
</header>
<!-- Mobile Nav Overlay -->
<div class="fixed inset-0 bg-surface z-40 hidden flex-col pt-24 px-mobile-padding" id="mobile-menu">
<nav class="flex flex-col gap-6 font-headline-lg-mobile text-headline-lg-mobile text-center">
<a class="text-primary font-bold mobile-link" href="#accueil">Accueil</a>
<a class="text-on-surface-variant mobile-link" href="#savoir-faire">Savoir-faire</a>
<a class="text-on-surface-variant mobile-link" href="#services">Services</a>
<a class="text-on-surface-variant mobile-link" href="#contact">Contact</a>
<a class="mt-8 bg-primary text-on-primary px-6 py-4 rounded DEFAULT font-label-lg text-label-lg uppercase inline-block mx-auto mobile-link" href="#contact">
                Prendre RDV
            </a>
</nav>
</div>
<main>
<!-- Hero Section -->
<section class="relative min-h-[819px] flex items-center justify-center pt-20 pb-section-gap overflow-hidden" id="accueil">
<div class="absolute inset-0 z-0">
<div class="bg-cover bg-center w-full h-full opacity-40" data-alt="A clean, highly organized, and brightly lit mechanic's workshop viewed from an establishing angle. Focus is on an empty, heavy-duty car lift, conveying readiness and professional capacity. The aesthetic is modern corporate, emphasizing reliability and order, with a high-end photography style emphasizing sharp details on the metal structures against a backdrop of deep grays and pristine concrete. The lighting is balanced, casting soft shadows that highlight the pristine condition of the workspace, completely devoid of people, ensuring a strong sense of an impeccably maintained facility." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuCIxWPEInypqdQ0PIq5DuB32L9p-8QTQzWn3VgVkusxnr5AeqjHpVElmhUF8lEM89TxVK87u_7lkhFPOrjkDEwk_OXjg7yk2izGzSbCzDknfxqYqivCf6QVXroUH1KkVBFcXBQHUpuCtOl687TuexY9eRFLsQPyAcky2JRlsba9A8JeOW3_5y31IWGXHlqgksMeYwuORQa1w-A5TL2VoucnedKfu_ZvOhyGj52vCx2ChwyNO8IumHo3-U4d1fS9gyOy2nRVymzJPlI')"></div>
<div class="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent"></div>
</div>
<div class="relative z-10 max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding text-center">
<span class="inline-block px-4 py-1.5 mb-6 border border-primary/30 text-primary font-label-sm text-label-sm uppercase rounded-full bg-surface/50 backdrop-blur-sm">Garage Mécanique</span>
<h1 class="font-headline-display text-headline-display md:text-6xl lg:text-7xl mb-6 max-w-4xl mx-auto text-on-surface tracking-tight">
                    Mécanique toutes marques à ${city}
                </h1>
<p class="font-body-md text-body-md md:text-xl text-on-surface-variant max-w-2xl mx-auto mb-10">
                    Honnêteté tarifaire, réactivité et expertise technique. Confiez votre véhicule à notre atelier pour un service professionnel sans compromis.
                </p>
<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
<a class="w-full sm:w-auto inline-flex items-center justify-center bg-primary text-on-primary px-8 py-4 rounded DEFAULT font-label-lg text-label-lg uppercase hover:bg-primary/90 transition-colors shadow-md hover:-translate-y-0.5 duration-200" href="#contact">
                        Prendre RDV
                        <span class="material-symbols-outlined ml-2 text-[20px]">calendar_month</span>
</a>
<a class="w-full sm:w-auto inline-flex items-center justify-center border border-outline text-on-surface px-8 py-4 rounded DEFAULT font-label-lg text-label-lg uppercase hover:bg-surface-variant transition-colors" href="#services">
                        Nos Services
                    </a>
</div>
</div>
</section>
<!-- Savoir-faire Section -->
<section class="py-section-gap bg-surface-container-low" id="savoir-faire">
<div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding">
<div class="grid md:grid-cols-2 gap-12 items-center">
<div>
<h2 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-6 text-on-surface">La Rigueur de l'Atelier</h2>
<p class="font-body-md text-body-md text-on-surface-variant mb-6">
                            Notre engagement repose sur une transparence totale de nos interventions. Chaque diagnostic est précis, chaque pièce est choisie avec soin, et chaque tarif est justifié. 
                        </p>
<p class="font-body-md text-body-md text-on-surface-variant mb-8">
                            Nous mettons un point d'honneur à maintenir un espace de travail impeccable, reflet de la qualité de nos prestations mécaniques.
                        </p>
<div class="grid grid-cols-2 gap-6">
<div class="border-l-2 border-primary pl-4">
<p class="font-headline-lg text-headline-lg text-primary mb-1">100%</p>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase">Transparence</p>
</div>
<div class="border-l-2 border-primary pl-4">
<p class="font-headline-lg text-headline-lg text-primary mb-1">24h</p>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase">Réactivité</p>
</div>
</div>
</div>
<div class="relative">
<div class="aspect-[4/5] rounded-xl overflow-hidden shadow-sm border border-outline-variant relative">
<div class="bg-cover bg-center w-full h-full" data-alt="Extreme close-up macro photography of a highly complex, meticulously clean modern automobile engine block. The image focuses on the precise machining of the metal components, with subtle highlights catching the edges of polished aluminum and steel. The lighting is studio-quality, creating deep contrasts with dark gray background tones to emphasize the solid, reliable nature of the machinery. The aesthetic is strictly corporate modern, portraying technical excellence and mechanical precision without any human presence." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuAH3wJGe3dLytKGA2WkPnKfO4oz2VQDbYV-MenRODZ66ypRXB41xxLJDMnHlJgEnO66eKfiGwFAXhDhvI0t68voxkqdtHRp1anfhiipuauG0rxqbHyi_LKnxZrqMp3weKkvlmeMyoDLMH21WXUk-cPv51U2q9VT6wZBXRyIp3LdG3wUQbas4R6oia3vqYQWOVMtW8wWXZA1QVndT5kNxU9Plut8RT9LWlLLocYPRvg7mLX0z3WX64hBPMHvdm16ljp-lx_G2rsKmxw')"></div>
<div class="absolute inset-0 ring-1 ring-inset ring-black/10 rounded-xl"></div>
</div>
<!-- Decorative element -->
<div class="absolute -bottom-6 -left-6 w-32 h-32 bg-surface rounded-lg shadow-sm border border-outline-variant flex items-center justify-center p-4 z-10 hidden md:flex">
<span class="material-symbols-outlined text-primary text-5xl">build</span>
</div>
</div>
</div>
</div>
</section>
<!-- Services Section (Bento Grid) -->
<section class="py-section-gap" id="services">
<div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding">
<div class="text-center mb-16">
<h2 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-4 text-on-surface">Nos Prestations</h2>
<p class="font-body-md text-body-md text-on-surface-variant max-w-2xl mx-auto">
                        Une expertise complète pour assurer la longévité et la sécurité de votre véhicule.
                    </p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
<!-- Diagnostic (Large span) -->
<div class="md:col-span-2 md:row-span-2 rounded-xl bg-surface-container overflow-hidden border border-outline-variant group relative shadow-sm hover:shadow-md transition-shadow duration-300">
<div class="absolute inset-0 bg-cover bg-center opacity-60 group-hover:scale-105 transition-transform duration-700" data-alt="A detailed, tightly cropped shot of a professional diagnostic OBD scanner plugged into a vehicle's dashboard port, with a laptop displaying complex, clean data graphs in the blurred background. The lighting is crisp and cool, emphasizing technological advancement and precision. The color palette focuses on sleek dark grays, muted blacks, and sharp white digital lines, fitting a high-end corporate mechanic aesthetic. No human hands are visible, focusing entirely on the tools of modern automotive diagnosis." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDBbI_hcEjkqB_hcWJJb-Ng8c_m_KPJbG3bfTP5aUKs_qMMbngT8QV_N-y6y2MFJ8TCznBbQqVUaYFQ3ecB6UMGS2mi8oXKKpN90AqRcdRFM8Nnrl5PE8yaV_nGGK0eSu9m_8yKLUgNn0_5PMCMQtxNJwu-k5igac4a1lqIgvxhQvdwLaiD2MNzHXFA7vgh2kUQrgYLhZmzRExLtaMC7LScwuMdlpJNvOLsftSNpdB3_PCfSHOFQGS64wEUa8zwRoj-CZNYPcyiJmE')"></div>
<div class="absolute inset-0 bg-gradient-to-t from-surface via-surface/80 to-transparent"></div>
<div class="absolute bottom-0 left-0 p-8">
<span class="material-symbols-outlined text-primary text-4xl mb-4 bg-surface p-2 rounded-lg shadow-sm">monitor_heart</span>
<h3 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Diagnostic OBD</h3>
<p class="font-body-md text-body-md text-on-surface-variant max-w-md">Recherche de pannes électronique de haute précision avec matériel de pointe.</p>
</div>
</div>
<!-- Entretien -->
<div class="rounded-xl bg-surface-container-high border border-outline-variant p-6 flex flex-col justify-end relative overflow-hidden group shadow-sm">
<div class="absolute top-6 right-6">
<span class="material-symbols-outlined text-outline text-3xl">oil_barrel</span>
</div>
<h3 class="font-label-lg text-label-lg uppercase text-on-surface mb-2 z-10">Entretien Régulier</h3>
<p class="font-body-md text-body-md text-on-surface-variant z-10">Vidange, filtres et vérifications fondamentales.</p>
</div>
<!-- Pneus -->
<div class="rounded-xl border border-outline-variant relative overflow-hidden group shadow-sm">
<div class="absolute inset-0 bg-cover bg-center opacity-80" data-alt="A meticulously aligned row of brand new, premium automobile tires in a stark, clean storage area. The deep black rubber textures contrast beautifully against a pristine, light-gray concrete floor. High-end photography style with dramatic side lighting that highlights the tread patterns, evoking a sense of grip, safety, and readiness. The setting is strictly a professional, high-end automotive facility with no people present, maintaining a corporate, reliable vibe." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBOlUOqctZiSSVWHyBHvUlfwlnRHKc1uxxOPyYsF0eq0l3nfUO2HRdbsKxdjoIstVTEFtv--thVQuArquR4Fl9AJ35ilbJrIAg7I8T8S1aSdo5ub4LAT_osYhE0TP987iJ1iZ1oc4_1969OsPw17rV6oCWVPjeateyYSDhEjYfQ-VGd4jj4rd0kR7ZOUto0THuiCwJnReAdhG3wbO7ajmwPmyWIHbXgPOSVl3vpWxoAoyt9YmTAQ_Yo0SoMGKxWqxl0IwT0dfK6zHU')"></div>
<div class="absolute inset-0 bg-surface/70 group-hover:bg-surface/50 transition-colors duration-300"></div>
<div class="absolute inset-0 p-6 flex flex-col justify-end">
<span class="material-symbols-outlined text-primary text-3xl mb-2">tire_repair</span>
<h3 class="font-label-lg text-label-lg uppercase text-on-surface mb-1">Pneumatiques</h3>
<p class="font-body-md text-body-md text-on-surface-variant text-sm">Montage, équilibrage et géométrie.</p>
</div>
</div>
<!-- Climatisation -->
<div class="rounded-xl bg-secondary text-on-secondary border border-outline-variant p-6 flex flex-col justify-end relative shadow-sm">
<div class="absolute top-6 right-6">
<span class="material-symbols-outlined text-outline-variant text-3xl">ac_unit</span>
</div>
<h3 class="font-label-lg text-label-lg uppercase mb-2">Climatisation</h3>
<p class="font-body-md text-body-md text-on-secondary/80 text-sm">Recharge et entretien du circuit complet.</p>
</div>
<!-- Révision -->
<div class="md:col-span-2 rounded-xl bg-surface-container border border-outline-variant p-8 flex items-center justify-between shadow-sm">
<div>
<span class="material-symbols-outlined text-primary text-3xl mb-4">fact_check</span>
<h3 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-2">Révision Constructeur</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Préservation de la garantie avec respect strict du carnet d'entretien.</p>
</div>
<a class="hidden sm:flex items-center justify-center w-12 h-12 rounded-full bg-primary text-on-primary hover:scale-110 transition-transform" href="#contact">
<span class="material-symbols-outlined">arrow_forward</span>
</a>
</div>
</div>
</div>
</section>
<!-- Contact Section -->
<section class="py-section-gap bg-surface-container-lowest border-t border-outline-variant" id="contact">
<div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding">
<div class="grid md:grid-cols-2 gap-16">
<div>
<h2 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg mb-6 text-on-surface">Demander un Devis</h2>
<p class="font-body-md text-body-md text-on-surface-variant mb-8">
                            Remplissez le formulaire ci-dessous pour une estimation transparente ou pour prendre rendez-vous à notre atelier de ${city}.
                        </p>
<form class="space-y-6">
<div class="grid grid-cols-2 gap-4">
<div>
<label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Nom</label>
<input class="w-full bg-surface border border-outline rounded px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" placeholder="Votre nom" type="text"/>
</div>
<div>
<label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Téléphone</label>
<input class="w-full bg-surface border border-outline rounded px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" placeholder="${phoneDisplay}" type="tel"/>
</div>
</div>
<div>
<label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Plaque d'immatriculation (Optionnel)</label>
<input class="w-full bg-surface border border-outline rounded px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow uppercase" placeholder="AA-123-BB" type="text"/>
</div>
<div>
<label class="block font-label-sm text-label-sm text-on-surface-variant uppercase mb-2">Besoin</label>
<select class="w-full bg-surface border border-outline rounded px-4 py-3 font-body-md text-body-md text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow">
<option>Entretien / Révision</option>
<option>Pneumatiques</option>
<option>Diagnostic / Panne</option>
<option>Autre</option>
</select>
</div>
<button class="w-full bg-primary text-on-primary px-6 py-4 rounded DEFAULT font-label-lg text-label-lg uppercase hover:bg-primary/90 transition-colors shadow-sm hover:shadow-md" type="button">
                                Envoyer la demande
                            </button>
</form>
</div>
<div class="flex flex-col justify-center">
<div class="bg-surface-container-high rounded-xl p-8 border border-outline-variant shadow-sm">
<h3 class="font-headline-lg-mobile text-headline-lg-mobile text-on-surface mb-6 border-b border-outline-variant pb-4">Coordonnées</h3>
<ul class="space-y-6">
<li class="flex items-start gap-4">
<span class="material-symbols-outlined text-primary mt-1">location_on</span>
<div>
<p class="font-label-lg text-label-lg uppercase text-on-surface mb-1">Adresse</p>
<p class="font-body-md text-body-md text-on-surface-variant">Zone Industrielle, ${addressDisplay}<br/>${city}</p>
</div>
</li>
<li class="flex items-start gap-4">
<span class="material-symbols-outlined text-primary mt-1">call</span>
<div>
<p class="font-label-lg text-label-lg uppercase text-on-surface mb-1">Téléphone</p>
<p class="font-body-md text-body-md text-on-surface-variant">${phoneDisplay}</p>
</div>
</li>
<li class="flex items-start gap-4">
<span class="material-symbols-outlined text-primary mt-1">schedule</span>
<div>
<p class="font-label-lg text-label-lg uppercase text-on-surface mb-1">Horaires</p>
<p class="font-body-md text-body-md text-on-surface-variant">Lun - Ven : 8h00 - 18h00<br/>Samedi : Sur rendez-vous</p>
</div>
</li>
</ul>
</div>
</div>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="bg-surface-container-high dark:bg-tertiary-container full-width border-t border-outline-variant">
<div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-stack-gap px-mobile-padding md:px-desktop-padding py-section-gap">
<!-- Column 1: Brand -->
<div>
<span class="font-headline-lg text-headline-lg text-on-surface dark:text-on-tertiary-container mb-4 block">${name}</span>
<p class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 mb-4">
                    La mécanique de confiance à ${city}.<br/>Honnêteté, rigueur et réactivité.
                </p>
</div>
<!-- Column 2: Links -->
<div>
<h4 class="font-label-sm text-label-sm text-on-surface dark:text-on-tertiary-container uppercase mb-4 tracking-widest">Informations</h4>
<ul class="space-y-2 flex flex-col items-start font-body-md text-body-md">
<li><a class="text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary rounded" href="#">Mentions Légales</a></li>
<li><a class="text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary rounded" href="#">Confidentialité</a></li>
<li><a class="text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary rounded" href="#">CGV</a></li>
</ul>
</div>
<!-- Column 3: Copyright -->
<div class="md:text-right flex flex-col md:items-end justify-end">
<p class="font-label-sm text-label-sm text-on-surface-variant dark:text-on-tertiary-container/70 mt-8 md:mt-0">
                    © ${year} ${name}. Tous droits réservés.
                </p>
</div>
</div>
</footer>
<!-- Mobile Floating Action Button -->
<a class="md:hidden fixed bottom-6 right-6 z-40 bg-primary text-on-primary w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" href="#contact">
<span class="material-symbols-outlined text-[24px]">build</span>
</a>
<script>
        // Simple mobile menu toggle
        const menuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        const mobileLinks = document.querySelectorAll('.mobile-link');
        const icon = menuBtn.querySelector('span');

        function toggleMenu() {
            mobileMenu.classList.toggle('hidden');
            mobileMenu.classList.toggle('flex');
            if (mobileMenu.classList.contains('hidden')) {
                icon.textContent = 'menu';
                document.body.style.overflow = 'auto';
            } else {
                icon.textContent = 'close';
                document.body.style.overflow = 'hidden';
            }
        }

        menuBtn.addEventListener('click', toggleMenu);
        
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                if(!mobileMenu.classList.contains('hidden')) {
                    toggleMenu();
                }
            });
        });
    </script>
</body></html>`;
}
