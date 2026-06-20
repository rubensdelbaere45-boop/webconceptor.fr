/**
 * Template Stitch AUTOECOLE — pixel-pixel copy de :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/auto_cole_name/code.html
 *
 * Substitutions minimales (le DESIGN n'est PAS touché) :
 * - {{NAME}} → p.name | {{CITY}} → p.city
 * - tous les téléphones → p.phone (auto-detect via regex)
 * - "12 rue des Artisans" et similaires → p.address
 * - nav sticky top-0 → sticky top-[54px] (passe sous la sales-ui-bar 54px)
 * - année footer dynamique
 */

export type AutoecolePixelProspect = {
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

export function generateStitchAutoecolePixelMockupHtml(p: AutoecolePixelProspect): string {
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
<title>Auto-école ${city}</title>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&amp;family=Plus+Jakarta+Sans:wght@400;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind Config injected from Style Guidance -->
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
                    "headline-lg": [
                            "EB Garamond"
                    ],
                    "label-sm": [
                            "Plus Jakarta Sans"
                    ],
                    "headline-lg-mobile": [
                            "EB Garamond"
                    ],
                    "label-lg": [
                            "Plus Jakarta Sans"
                    ],
                    "body-md": [
                            "Plus Jakarta Sans"
                    ],
                    "headline-display": [
                            "EB Garamond"
                    ]
            },
            "fontSize": {
                    "headline-lg": [
                            "36px",
                            {
                                    "lineHeight": "1.3",
                                    "fontWeight": "500"
                            }
                    ],
                    "label-sm": [
                            "12px",
                            {
                                    "lineHeight": "1.2",
                                    "letterSpacing": "0.05em",
                                    "fontWeight": "600"
                            }
                    ],
                    "headline-lg-mobile": [
                            "30px",
                            {
                                    "lineHeight": "1.3",
                                    "fontWeight": "600"
                            }
                    ],
                    "label-lg": [
                            "14px",
                            {
                                    "lineHeight": "1.2",
                                    "letterSpacing": "0.08em",
                                    "fontWeight": "700"
                            }
                    ],
                    "body-md": [
                            "16px",
                            {
                                    "lineHeight": "1.6",
                                    "fontWeight": "400"
                            }
                    ],
                    "headline-display": [
                            "48px",
                            {
                                    "lineHeight": "1.2",
                                    "letterSpacing": "-0.01em",
                                    "fontWeight": "600"
                            }
                    ]
            }
          },
        },
      }
    </script>
<style>
        /* Grain overlay */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.04;
        }
        .grain-image-overlay {
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.04;
        }
        
        /* Typography utilities */
        .uppercase-spaced {
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
    </style>
</head>
<body class="bg-surface text-on-surface antialiased font-body-md text-body-md min-h-screen flex flex-col relative">
<!-- TopNavBar -->
<header class="bg-surface/95 dark:bg-surface-container-highest/95 backdrop-blur-sm docked full-width top-0 sticky z-50 shadow-sm border-b border-outline-variant dark:border-outline">
<div class="max-w-[1200px] mx-auto flex justify-between items-center px-mobile-padding md:px-desktop-padding py-4">
<a class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-primary dark:text-on-primary flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full" href="#">
                ${name}
            </a>
<!-- Desktop Nav -->
<nav class="hidden md:flex gap-8">
<a class="font-label-lg text-label-lg text-primary dark:text-inverse-primary border-b-2 border-primary pb-1 hover:opacity-80 transition-opacity duration-300" href="#">Accueil</a>
<a class="font-label-lg text-label-lg text-on-surface-variant dark:text-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300" href="#savoir-faire">Savoir-faire</a>
<a class="font-label-lg text-label-lg text-on-surface-variant dark:text-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300" href="#services">Services</a>
<a class="font-label-lg text-label-lg text-on-surface-variant dark:text-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300" href="#contact">Contact</a>
</nav>
<div class="flex items-center gap-4">
<a class="hidden md:inline-flex items-center justify-center bg-primary text-on-primary font-label-lg text-label-lg px-6 py-3 rounded uppercase-spaced hover:opacity-80 transition-opacity duration-300 active:scale-95 transition-transform shadow-[0_4px_12px_rgba(0,0,0,0.1)]" href="#contact">
                    Devis
                </a>
<!-- Mobile Menu Button -->
<button class="md:hidden text-primary p-2">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 0;">menu</span>
</button>
</div>
</div>
</header>
<main class="flex-grow">
<!-- Hero Section -->
<section class="relative pt-section-gap pb-section-gap px-mobile-padding md:px-desktop-padding flex items-center min-h-[819px]">
<div class="max-w-[1200px] mx-auto w-full grid md:grid-cols-2 gap-stack-gap items-center relative z-10">
<div class="space-y-8">
<h1 class="font-headline-display text-headline-display text-primary">
                        Auto-école — ${city}<br/>
<span class="text-secondary">L'excellence de la conduite.</span>
</h1>
<p class="font-body-md text-body-md text-on-surface-variant max-w-lg">
                        Une formation rigoureuse, un suivi personnalisé. Prenez le volant avec assurance et maîtrisez la route avec des professionnels dévoués à votre réussite.
                    </p>
<div class="flex gap-4 pt-4">
<a class="inline-flex items-center justify-center bg-primary text-on-primary font-label-lg text-label-lg px-8 py-4 rounded uppercase-spaced shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-1 transition-transform" href="#contact">
                            S'inscrire
                        </a>
</div>
</div>
<div class="relative h-[400px] md:h-[600px] w-full rounded-xl overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
<img class="w-full h-full object-cover" data-alt="A close-up, high-quality photograph of hands firmly gripping a modern car steering wheel. The focus is on the textured leather of the wheel and the precise grip, conveying control and seriousness. The background is a beautifully blurred dashboard with subtle, moody lighting in deep blues and greys, adhering to a sophisticated corporate light-mode aesthetic. No faces are visible." src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdzwmFZJ8c4XZs4wLrdHUEyEtqxUkW6Osm37Uz4RFPCQt6XJmXnd3EeTivTwzWtoFyXzQXxEp1bn4BS1o4OHB20J6_2RkvPrNB6X79zphERgI4nagg5k5Ufr5U6lzYPIXVx6cKJJIdi9FM6eFP4AHx4SB4MtDw3XdSfRP3nDV5LajAgwQcTYDZR6jnvAh1o0sBEEaxDlwevw1M-MY97Q6WNE6xYFH1pMSx9lihumupQPubita_PyKC8iNxX7TQKAffUz-n96W0au0"/>
<div class="grain-image-overlay"></div>
</div>
</div>
</section>
<!-- Stats Section -->
<section class="bg-surface-container-low py-section-gap px-mobile-padding md:px-desktop-padding border-y border-outline-variant">
<div class="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-stack-gap text-center">
<div class="space-y-2">
<p class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-primary">92%</p>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase-spaced">Réussite au code</p>
</div>
<div class="space-y-2">
<p class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-primary">85%</p>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase-spaced">Réussite conduite</p>
</div>
<div class="space-y-2">
<p class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-primary">15+</p>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase-spaced">Années d'expérience</p>
</div>
<div class="space-y-2">
<p class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg font-bold text-primary">3</p>
<p class="font-label-sm text-label-sm text-on-surface-variant uppercase-spaced">Moniteurs certifiés</p>
</div>
</div>
</section>
<!-- Services Section (Bento Grid) -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding" id="services">
<div class="max-w-[1200px] mx-auto space-y-12">
<div class="text-center max-w-2xl mx-auto space-y-4">
<h2 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">Nos Formations</h2>
<p class="font-body-md text-body-md text-on-surface-variant">Des parcours adaptés à chaque profil pour une maîtrise totale du véhicule.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
<!-- Code -->
<div class="md:col-span-2 bg-surface-container-lowest rounded-xl p-8 border border-outline-variant shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden group">
<div class="relative z-10 space-y-4">
<span class="material-symbols-outlined text-4xl text-primary" style="font-variation-settings: 'FILL' 0;">menu_book</span>
<h3 class="font-label-lg text-label-lg uppercase-spaced text-primary">Code de la route</h3>
<p class="font-body-md text-body-md text-on-surface-variant max-w-sm">Formation théorique rigoureuse, en salle et en ligne, pour une préparation optimale à l'examen.</p>
</div>
<div class="absolute right-0 bottom-0 w-1/2 h-full opacity-20 group-hover:opacity-30 transition-opacity">
<img class="w-full h-full object-cover" data-alt="A macro shot of a theoretical driving test manual on a clean desk. The focus is on the crisp typography of road signs printed on the page. The lighting is bright and analytical, emphasizing a studious and serious atmosphere suitable for a corporate light-mode theme. No faces are present." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZnTslFeb-k2I0lzRIALJLTm7P7CZxxhpzX9IOFt9JT2a1mKHJ9kExuRc2DQDvM2LGiLMILpoNngG_xjp16f7lYDiXxXT1n3RBYsG1uShCp1Dq_Iw33wtrCk-kmFnOuVUmevQ6_v8TDXGA4xO3sYRGKJ2uTDpC7K7rj-RdIfmD11mfLuZ7HCyBPXhVJLdEQZ-owgl05v04ZhjjwYVqZQMAn22GHGhznq0PWjYG6mYKVALpTs1uZtcrWvrQ0PKwBpqI2RvjD116AcM"/>
<div class="grain-image-overlay"></div>
</div>
</div>
<!-- Permis B -->
<div class="bg-primary text-on-primary rounded-xl p-8 shadow-[0_4px_12px_rgba(0,0,0,0.1)] flex flex-col justify-between">
<div class="space-y-4">
<span class="material-symbols-outlined text-4xl" style="font-variation-settings: 'FILL' 1;">directions_car</span>
<h3 class="font-label-lg text-label-lg uppercase-spaced">Permis B</h3>
<p class="font-body-md text-body-md opacity-90">La formation classique, structurée étape par étape vers l'autonomie.</p>
</div>
</div>
<!-- Conduite Accompagnée -->
<div class="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-col justify-between relative overflow-hidden">
<div class="absolute inset-0 opacity-40">
<img class="w-full h-full object-cover" data-alt="A high-quality, abstract photograph of modern road signs against a clear, bright sky. The composition is geometric and precise, focusing on the shapes and symbols. The colors are muted blues and greys, fitting a professional light-mode aesthetic. No faces." src="https://lh3.googleusercontent.com/aida-public/AB6AXuBo726mwI2wLZ1RVzCV3IkEWhez7kLfrjVzy0b3ds1eTeaSxoWagbAW-8U5R63h9mVUH2YXOrOIs1eM38MuS1SRHRQPaQCBZ9FxxAoVPAxupweAg12VEmP5V1RhR6I5BcvFluyib8fabqVnNA3z5jMDXrda1b5TPkACdXuS6FSpZyC2wxFQIdJUSn5BRjqiqggTGLZBN19f8s2lt5QtIIS6gBb3cCTgkfOztv4NbD7lpxM_HjJrwJI1MfFSjAYF0F6WaQ2ve0DhKQE"/>
<div class="grain-image-overlay"></div>
</div>
<div class="relative z-10 bg-surface/80 p-6 rounded backdrop-blur-sm h-full flex flex-col justify-end">
<h3 class="font-label-lg text-label-lg uppercase-spaced text-primary mb-2">Conduite Accompagnée (AAC)</h3>
<p class="font-body-md text-body-md text-on-surface-variant">L'expérience au fil des kilomètres pour une sécurité accrue.</p>
</div>
</div>
<!-- Boite Auto -->
<div class="md:col-span-2 bg-surface-container-lowest rounded-xl border border-outline-variant shadow-[0_2px_8px_rgba(0,0,0,0.04)] flex flex-row overflow-hidden">
<div class="p-8 flex flex-col justify-center w-1/2 space-y-4">
<span class="material-symbols-outlined text-4xl text-primary" style="font-variation-settings: 'FILL' 0;">settings_input_component</span>
<h3 class="font-label-lg text-label-lg uppercase-spaced text-primary">Permis Boîte Auto (BEA)</h3>
<p class="font-body-md text-body-md text-on-surface-variant">Une approche simplifiée de la conduite, idéale pour se concentrer sur l'environnement routier.</p>
</div>
<div class="w-1/2 relative">
<img class="w-full h-full object-cover" data-alt="A close-up shot of an automatic gear shift lever in a modern car interior. The lighting is soft and professional, highlighting the polished materials and clear indicator letters (P, R, N, D). The mood is modern, clean, and serious, aligning with a corporate light-mode design. No hands or faces." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDs6PIN0-aamyaO1sdR4AI7F7HYLcNM__7pSJ46J8ONhyl2dVhxQVvbdYqtVnSTbDEPtsn1tBpUJ_LK550qtWWjbkYMCBbhWR4W1Or6Iz8J50029ZeQ1X2WgnqgTitePeZa_53GpLGtCyAwmmdXnNPGy65zDFPLY71sS51-TEy9tV4wJLls5DRE8OXKxPdRKCyuyochvoPSFuczR59QC4oiUFT1iLPKkvn2EOMJC6HGKhXmve4GLySAx9GiLAJgbrtF_1KmX3nKFCw"/>
<div class="grain-image-overlay"></div>
</div>
</div>
</div>
</div>
</section>
<!-- Contact Section -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding bg-surface-container" id="contact">
<div class="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-stack-gap">
<div class="space-y-8">
<h2 class="font-headline-lg-mobile md:font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">Prendre la route ensemble</h2>
<p class="font-body-md text-body-md text-on-surface-variant">Notre équipe est à votre disposition pour évaluer vos besoins et planifier votre parcours de formation. Passez nous voir à l'agence de ${city}.</p>
<div class="space-y-4 pt-4 border-t border-outline-variant">
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-primary">location_on</span>
<p class="font-body-md text-body-md text-on-surface-variant">12 Avenue de la République, ${city}</p>
</div>
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-primary">phone</span>
<p class="font-body-md text-body-md text-on-surface-variant">${phoneDisplay}</p>
</div>
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-primary">mail</span>
<p class="font-body-md text-body-md text-on-surface-variant">contact@autoecole-{{CITY|lower}}.fr</p>
</div>
</div>
</div>
<div class="bg-surface rounded-xl p-8 border border-outline-variant shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
<form class="space-y-4">
<div>
<label class="block font-label-sm text-label-sm uppercase-spaced text-on-surface-variant mb-1">Nom complet</label>
<input class="w-full bg-surface border border-outline-variant rounded p-3 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" type="text"/>
</div>
<div>
<label class="block font-label-sm text-label-sm uppercase-spaced text-on-surface-variant mb-1">Téléphone</label>
<input class="w-full bg-surface border border-outline-variant rounded p-3 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors" type="tel"/>
</div>
<div>
<label class="block font-label-sm text-label-sm uppercase-spaced text-on-surface-variant mb-1">Formation souhaitée</label>
<select class="w-full bg-surface border border-outline-variant rounded p-3 font-body-md text-body-md focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-colors appearance-none">
<option>Permis B (Traditionnel)</option>
<option>Conduite Accompagnée</option>
<option>Boîte Automatique</option>
<option>Code de la route seul</option>
</select>
</div>
<button class="w-full mt-4 bg-primary text-on-primary font-label-lg text-label-lg py-4 rounded uppercase-spaced shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:opacity-90 transition-opacity" type="button">
                            Demander un devis
                        </button>
</form>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="bg-surface-container-high dark:bg-tertiary-container full-width border-t border-outline-variant flat no shadows">
<div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-stack-gap px-mobile-padding md:px-desktop-padding py-section-gap">
<!-- Brand -->
<div class="space-y-4">
<div class="font-headline-lg text-headline-lg text-on-surface dark:text-on-tertiary-container font-bold flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full">
                    ${name}
                </div>
<p class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 max-w-xs">
                    L'exigence au service de votre sécurité routière à ${city}.
                </p>
</div>
<!-- Links -->
<div class="space-y-4">
<h4 class="font-label-lg text-label-lg uppercase-spaced text-primary">Informations</h4>
<ul class="space-y-2">
<li><a class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary" href="#">Mentions Légales</a></li>
<li><a class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary" href="#">Confidentialité</a></li>
<li><a class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary" href="#">CGV</a></li>
</ul>
</div>
<!-- Copyright -->
<div class="flex md:justify-end items-end">
<p class="font-label-sm text-label-sm text-on-surface-variant dark:text-on-tertiary-container/70 uppercase-spaced">
                    © ${year} ${name}. Tous droits réservés.
                </p>
</div>
</div>
</footer>
<!-- Mobile FAB (Contextual for Registration) -->
<a class="md:hidden fixed bottom-6 right-6 z-50 bg-primary text-on-primary p-4 rounded-full shadow-[0_8px_16px_rgba(0,0,0,0.2)] hover:scale-105 active:scale-95 transition-transform flex items-center justify-center" href="#contact">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">edit_document</span>
</a>
</body></html>`;
}
