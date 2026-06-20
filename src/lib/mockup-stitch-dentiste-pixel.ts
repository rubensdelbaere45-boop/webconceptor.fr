/**
 * Template Stitch DENTISTE — pixel-pixel copy de :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/dentiste_name_1/code.html
 */
export type DentistePixelProspect = {
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

export function generateStitchDentistePixelMockupHtml(p: DentistePixelProspect): string {
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
<title>Cabinet Dentaire - ${city}</title>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&amp;family=Plus+Jakarta+Sans:wght@400;600;700&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<!-- Tailwind CSS -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<!-- Tailwind Configuration -->
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
        /* Grain Overlay */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: none;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.04;
            z-index: 9999;
        }

        .grain-image {
            position: relative;
        }
        .grain-image::after {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.04;
            z-index: 10;
        }

        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .material-symbols-outlined.fill-icon {
            font-variation-settings: 'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    </style>
</head>
<body class="bg-surface text-on-surface min-h-screen relative font-body-md text-body-md antialiased">
<!-- TopNavBar -->
<header class="bg-surface/95 dark:bg-surface-container-highest/95 backdrop-blur-sm sticky top-[54px] z-40 border-b border-outline-variant shadow-sm w-full">
<div class="max-w-[1200px] mx-auto flex justify-between items-center px-mobile-padding md:px-desktop-padding py-4">
<!-- Brand -->
<div class="font-headline-lg text-headline-lg font-bold text-primary flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full">
                ${name}
            </div>
<!-- Web Navigation -->
<nav class="hidden md:flex gap-8 items-center">
<a class="text-primary border-b-2 border-primary pb-1 font-label-lg text-label-lg hover:opacity-80 transition-opacity duration-300" href="#accueil">Accueil</a>
<a class="text-on-surface-variant hover:text-primary font-label-lg text-label-lg hover:opacity-80 transition-opacity duration-300" href="#savoir-faire">Savoir-faire</a>
<a class="text-on-surface-variant hover:text-primary font-label-lg text-label-lg hover:opacity-80 transition-opacity duration-300" href="#services">Services</a>
<a class="text-on-surface-variant hover:text-primary font-label-lg text-label-lg hover:opacity-80 transition-opacity duration-300" href="#contact">Contact</a>
</nav>
<!-- Trailing Action (Doctolib / Devis) -->
<div class="hidden md:flex items-center gap-4">
<a class="text-primary font-label-lg text-label-lg border border-outline px-4 py-2 rounded uppercase tracking-wider hover:bg-surface-variant transition-colors flex items-center gap-2" href="https://www.doctolib.fr" target="_blank">
<span class="material-symbols-outlined">event_available</span>
                    Doctolib
                </a>
<a class="bg-primary text-on-primary font-label-lg text-label-lg px-6 py-2 rounded uppercase tracking-wider hover:opacity-80 transition-opacity duration-300" href="#contact">
                    Devis
                </a>
</div>
<!-- Mobile Menu Toggle -->
<button class="md:hidden text-primary p-2">
<span class="material-symbols-outlined">menu</span>
</button>
</div>
</header>
<main>
<!-- Hero Section -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-stack-gap items-center" id="accueil">
<div class="space-y-6">
<h1 class="font-headline-display text-headline-display text-primary">
                    Cabinet dentaire — ${city}
                </h1>
<p class="text-on-surface-variant max-w-lg">
                    Une approche moderne de la santé bucco-dentaire, alliant précision clinique et esthétique naturelle. Notre équipe vous accueille dans un environnement serein dédié à l'hygiène absolue.
                </p>
<div class="flex flex-col sm:flex-row gap-4 pt-4">
<a class="bg-primary text-on-primary font-label-lg text-label-lg px-8 py-3 rounded uppercase tracking-wider text-center hover:opacity-80 transition-opacity" href="#contact">
                        Prendre rendez-vous
                    </a>
</div>
</div>
<div class="relative h-[400px] md:h-[500px] rounded-lg overflow-hidden grain-image shadow-sm border border-outline-variant/30">
<img class="w-full h-full object-cover" data-alt="A pristine, modern dental clinic room featuring a sleek, minimalist dental chair illuminated by bright, cool-toned surgical lights. The aesthetic is extremely clean, hygienic, and serene, characterized by high-key lighting, soft shadows, and a color palette of pure whites, soft grays, and subtle turquoise accents. No people are visible, emphasizing the state-of-the-art equipment and immaculate environment." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC6tz6T6HSd4eAs6h-HgorJ4-pZamddhlKPgLhkvHoS77XxRfv__Z2A-UkPVZP9i3jZIOJY3YkUSHyRRBmVXITFDiVU2GTmT8YkIhXtEOvHwSoQ6hItqfXDDzzsbZMmdMZytYhrSV9yt4eRlWpNjZ4HNZ5h6LI7_zEQ0UtM1MrtIYCfvZ1XDW-uXXyCcMvpWg3Zxe4nEkWBpjYCYwuDIpTwCj0Ycstmi2D4yz0ZEF-uQRlEbC5I-7rExcNAWeKiWCN2_4qbQyppOJc"/>
</div>
</section>
<!-- Savoir-faire Section -->
<section class="py-section-gap bg-surface-container-low px-mobile-padding md:px-desktop-padding border-t border-b border-outline-variant" id="savoir-faire">
<div class="max-w-[1200px] mx-auto">
<div class="text-center mb-12">
<h2 class="font-headline-lg text-headline-lg text-primary mb-4">Savoir-faire &amp; Rigueur</h2>
<p class="text-on-surface-variant max-w-2xl mx-auto">L'excellence technique au service de votre sourire, soutenue par des protocoles d'hygiène stricts et une technologie de pointe.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-stack-gap">
<div class="bg-surface p-8 rounded-lg shadow-sm grain-image h-[300px] relative overflow-hidden group">
<img class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A close-up, highly detailed macro photograph of sterilized metallic dental instruments meticulously arranged on a sterile white tray. The lighting is crisp and analytical, highlighting the precision engineering of the tools. The background is softly blurred, focusing entirely on the gleam of the metal and the immaculate cleanliness of the setup, reflecting a modern, clinical, and trustworthy vibe." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCkJIiN6E8gyf4fOrhGjgIB6gBHyYKKOO7GJHzc9jgNcF57ckUfO9AySnY7PPR6zdD-Vor_n3OdTI6qBTfhZ0xkuT4LOMsKOSnYzb2uVyjGAXpo3ino8bm8QCCFvk_d7CelxZ5TvDbRDYPtx0R1vxPxq_M9O0Plgf0elAKZr4dLWUxEp1jpG5MymTW11qY8w5AIbR0paDEhju91DzuYJRPZeVT3z_9_W7umsPVLivClokXdfsalHDtMmh_z4KqEiZ93wvv7e3x3kR4"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
<div class="absolute bottom-0 left-0 p-6 z-20">
<h3 class="font-headline-lg text-headline-lg-mobile text-on-primary mb-2">Stérilisation</h3>
</div>
</div>
<div class="bg-surface p-8 rounded-lg shadow-sm grain-image h-[300px] relative overflow-hidden group">
<img class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="A macro shot of a flawlessly crafted ceramic dental crown or veneer resting on a clean, neutral surface. Soft, diffused lighting accentuates the natural translucency, texture, and delicate shading of the ceramic material, showcasing the artistry and precision of modern dental prosthetics. The scene exudes high-end craftsmanship, clinical purity, and a serene, minimalist aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDad9kszDkf5DjjS-KFCcSBZL1UbFrf7dS2qQYKClU6IY10WkV6S98dNZQffiVIbXaK3lYVcHqvANU_DyNUQH6rRvwUhY0sUfUX3ulPUSIO69q_pFprzZZRPBThZN9UyIvL-ZULk4FDdvAwCnWf955HpB3yoHRPtX44oRgSnMEe6mcr6lze8_xdGh4vxyXlUGuehrWbmcu8uVEDGZDPoSSR7F1-yTW94xXc0QMYQpa2oxNs12JVrsWIOxMq1i3xWnuq795fgIBmqKk"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
<div class="absolute bottom-0 left-0 p-6 z-20">
<h3 class="font-headline-lg text-headline-lg-mobile text-on-primary mb-2">Précision</h3>
</div>
</div>
<div class="bg-surface p-8 rounded-lg shadow-sm grain-image h-[300px] relative overflow-hidden group">
<img class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="An abstract, modern view of high-tech dental imaging equipment in a pristine, softly lit clinic setting. The focus is on the sleek curves and glowing indicator lights of the machinery, conveying a sense of advanced technology, safety, and modern healthcare. The color palette relies on cool whites and calming turquoise tones, ensuring a serene and highly professional atmosphere without any visible human presence." src="https://lh3.googleusercontent.com/aida-public/AB6AXuCmbQqfs9Ndd98XOGVaNc_w2Y7dc9lyOYDBkNBqV4lNa-W_RWpwddcCMNdRB9fmuINzHLm8Aj5bHkLV8LR1dGhIIaMbBk1PGnHAOkSINsTomZxVECTZBkfNrG01pXHN-4gSsrLhQdHn1KYrsNtyVswWN_uW5t1b_kh4xlOW75hvZmqnva5O5jnn7w_FmN92Er6diWYiHd8qozyc3LVVvt7SikBxj9AWZLrlLJ2P7dNivrZ5LoiZq3EMtp7Mnz9_I5H1EmlaSYk8kas"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary/80 to-transparent"></div>
<div class="absolute bottom-0 left-0 p-6 z-20">
<h3 class="font-headline-lg text-headline-lg-mobile text-on-primary mb-2">Technologie</h3>
</div>
</div>
</div>
</div>
</section>
<!-- Services Section (Bento Grid) -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding max-w-[1200px] mx-auto" id="services">
<h2 class="font-headline-lg text-headline-lg text-primary mb-12 border-b border-outline-variant pb-4">Nos Services</h2>
<div class="grid grid-cols-1 md:grid-cols-4 gap-stack-gap auto-rows-[200px]">
<!-- Soins -->
<div class="md:col-span-2 md:row-span-2 bg-surface-container-high rounded-lg p-8 relative overflow-hidden group shadow-sm border border-outline-variant/50">
<div class="absolute top-6 right-6 text-primary">
<span class="material-symbols-outlined text-4xl">medical_services</span>
</div>
<div class="relative z-10 flex flex-col justify-end h-full">
<h3 class="font-headline-lg text-headline-lg text-primary mb-2">Soins Dentaires</h3>
<p class="text-on-surface-variant max-w-sm">Prévention, détartrage et traitements conservateurs pour maintenir une santé bucco-dentaire optimale sur le long terme.</p>
</div>
</div>
<!-- Esthétique -->
<div class="md:col-span-2 bg-surface rounded-lg p-6 relative overflow-hidden group shadow-sm border border-outline-variant/50">
<div class="absolute top-4 right-4 text-primary">
<span class="material-symbols-outlined text-3xl">diamond</span>
</div>
<h3 class="font-headline-lg text-headline-lg-mobile text-primary mb-2">Esthétique</h3>
<p class="text-on-surface-variant text-sm">Blanchiment, facettes et harmonisation du sourire.</p>
</div>
<!-- Implantologie -->
<div class="bg-surface rounded-lg p-6 relative overflow-hidden group shadow-sm border border-outline-variant/50">
<div class="absolute top-4 right-4 text-primary">
<span class="material-symbols-outlined text-3xl">architecture</span>
</div>
<h3 class="font-headline-lg text-headline-lg-mobile text-primary mb-2">Implantologie</h3>
<p class="text-on-surface-variant text-sm">Remplacement pérenne de dents absentes.</p>
</div>
<!-- Orthodontie -->
<div class="bg-surface rounded-lg p-6 relative overflow-hidden group shadow-sm border border-outline-variant/50">
<div class="absolute top-4 right-4 text-primary">
<span class="material-symbols-outlined text-3xl">align_horizontal_center</span>
</div>
<h3 class="font-headline-lg text-headline-lg-mobile text-primary mb-2">Orthodontie</h3>
<p class="text-on-surface-variant text-sm">Alignement dentaire discret pour adultes.</p>
</div>
<!-- Urgences -->
<div class="md:col-span-4 bg-error-container text-on-error-container rounded-lg p-6 flex items-center justify-between border border-error/20">
<div class="flex items-center gap-4">
<span class="material-symbols-outlined text-3xl">emergency</span>
<div>
<h3 class="font-label-lg text-label-lg font-bold">Urgences Dentaires</h3>
<p class="text-sm opacity-80">Prise en charge rapide de la douleur et des traumatismes.</p>
</div>
</div>
<a class="bg-on-error-container text-error-container font-label-lg text-label-lg px-4 py-2 rounded uppercase tracking-wider hover:opacity-90" href="tel:${phoneDigits}">Appeler</a>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="bg-surface-container-high dark:bg-tertiary-container border-t border-outline-variant mt-section-gap w-full">
<div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-stack-gap px-mobile-padding md:px-desktop-padding py-section-gap">
<!-- Brand -->
<div>
<div class="font-headline-lg text-headline-lg text-on-surface dark:text-on-tertiary-container mb-4">
                    ${name}
                </div>
<p class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70">
                    Cabinet dentaire dédié à l'excellence et à la sérénité à ${city}.
                </p>
</div>
<!-- Contact -->
<div id="contact">
<h4 class="font-label-lg text-label-lg font-bold text-on-surface dark:text-on-tertiary-container mb-4 uppercase tracking-wider">Contact</h4>
<address class="not-italic font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 space-y-2">
<p>123 Avenue de la Précision<br/>${city}</p>
<p>Tél : ${phoneDisplay}</p>
</address>
</div>
<!-- Links -->
<div>
<h4 class="font-label-lg text-label-lg font-bold text-on-surface dark:text-on-tertiary-container mb-4 uppercase tracking-wider">Légal</h4>
<ul class="space-y-2">
<li><a class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary" href="#">Mentions Légales</a></li>
<li><a class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary" href="#">Confidentialité</a></li>
<li><a class="font-body-md text-body-md text-on-surface-variant dark:text-on-tertiary-container/70 hover:text-primary dark:hover:text-tertiary-fixed-dim underline transition-all focus:outline-none focus:ring-2 focus:ring-primary" href="#">CGV</a></li>
</ul>
</div>
</div>
<!-- Copyright -->
<div class="border-t border-outline-variant/30 py-4 text-center">
<p class="font-label-sm text-label-sm text-on-surface-variant dark:text-on-tertiary-container/70">
                © ${year} ${name}. Tous droits réservés.
            </p>
</div>
</footer>
<!-- Mobile FAB (Doctolib / RDV) -->
<a class="md:hidden fixed bottom-6 right-6 bg-primary text-on-primary w-14 h-14 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex items-center justify-center z-50 hover:scale-95 transition-transform" href="https://www.doctolib.fr" target="_blank">
<span class="material-symbols-outlined fill-icon text-2xl">event</span>
</a>
</body></html>`;
}
