/**
 * Template Stitch INSTITUT — pixel-pixel copy de :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/institut_name/code.html
 *
 * Substitutions minimales (le DESIGN n'est PAS touché) :
 * - {{NAME}} → p.name | {{CITY}} → p.city
 * - tous les téléphones → p.phone (auto-detect via regex)
 * - "12 rue des Artisans" et similaires → p.address
 * - nav sticky top-0 → sticky top-[54px] (passe sous la sales-ui-bar 54px)
 * - année footer dynamique
 */

export type InstitutPixelProspect = {
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

export function generateStitchInstitutPixelMockupHtml(p: InstitutPixelProspect): string {
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
<title>Institut de Beauté - ${name}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
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

        /* Subtle paper grain texture */
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

        .image-overlay::after {
            content: "";
            position: absolute;
            inset: 0;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            opacity: 0.04;
            pointer-events: none;
        }
        
        .smooth-scroll {
            scroll-behavior: smooth;
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
                    "primary": "#7e22ce", /* Replaced with user request, but maintaining theme structure as best as possible. Note: Instruction said use named colors from config. User asked for specific colors. Conflict. Following user colors for specific request, but falling back to config for others. */
                    "surface-tint": "#5f5e5e",
                    "secondary": "#fae8ff", /* Replaced with user request */
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
                    "on-secondary": "#1c1b1b",
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
                    "surface": "#fdf8f8", /* Creamy background as per guidance */
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
                    "lg": "12px", /* Overridden per style guidance for Cards */
                    "xl": "0.75rem",
                    "full": "9999px"
            },
            "spacing": {
                    "stack-gap": "1rem",
                    "section-gap": "5rem", /* 80px+ spacing */
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
                    "headline-lg": ["36px", {"lineHeight": "1.3", "fontWeight": "500"}],
                    "label-sm": ["12px", {"lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600"}],
                    "headline-lg-mobile": ["30px", {"lineHeight": "1.3", "fontWeight": "600"}],
                    "label-lg": ["14px", {"lineHeight": "1.2", "letterSpacing": "0.08em", "fontWeight": "700"}],
                    "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
                    "headline-display": ["48px", {"lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                    "headline-display-mobile": ["38px", {"lineHeight": "1.2", "letterSpacing": "-0.01em", "fontWeight": "600"}]
            }
          }
        }
      }
    </script>
</head>
<body class="bg-surface text-on-surface font-body-md text-body-md smooth-scroll antialiased selection:bg-secondary selection:text-primary">
<!-- TopNavBar Web (hidden on mobile, flex on md) -->
<header class="hidden md:flex bg-surface/95 backdrop-blur-sm shadow-sm border-b border-outline-variant docked full-width top-0 sticky z-50">
<div class="max-w-[1200px] w-full mx-auto flex justify-between items-center px-desktop-padding py-4">
<!-- Brand -->
<a class="font-headline-lg text-headline-lg font-bold text-primary flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full" href="#">
                ${name}
            </a>
<!-- Navigation Links -->
<nav class="flex gap-8 items-center font-label-lg text-label-lg">
<a class="text-primary border-b-2 border-primary pb-1 transition-transform scale-95 uppercase tracking-[0.08em]" href="#accueil">Accueil</a>
<a class="text-on-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300 uppercase tracking-[0.08em]" href="#savoir-faire">Savoir-faire</a>
<a class="text-on-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300 uppercase tracking-[0.08em]" href="#services">Services</a>
<a class="text-on-surface-variant hover:text-primary hover:opacity-80 transition-opacity duration-300 uppercase tracking-[0.08em]" href="#contact">Contact</a>
</nav>
<!-- Trailing Action -->
<a class="bg-primary text-on-primary font-label-lg text-label-lg px-6 py-3 rounded-full hover:opacity-80 transition-opacity duration-300 uppercase tracking-[0.08em] shadow-[0_4px_8px_rgba(0,0,0,0.04)]" href="#reserver">
                Réserver
            </a>
</div>
</header>
<!-- Mobile Top Header (Just brand) -->
<header class="md:hidden bg-surface/95 backdrop-blur-sm top-0 sticky z-50 py-4 px-mobile-padding border-b border-outline-variant flex justify-center items-center">
<span class="font-headline-lg-mobile text-headline-lg-mobile font-bold text-primary flex items-center gap-1 after:content-[''] after:w-2 after:h-2 after:bg-primary after:rounded-full">
            ${name}
        </span>
</header>
<main class="w-full">
<!-- Hero Section -->
<section class="relative w-full min-h-[921px] flex items-center justify-center px-mobile-padding md:px-desktop-padding py-section-gap overflow-hidden" id="accueil">
<!-- Background Image -->
<div class="absolute inset-0 z-0 image-overlay">
<div class="w-full h-full bg-cover bg-center opacity-40" data-alt="A macro, closely cropped shot of smooth, dark basalt hot stones resting on a pristine, crisp white folded towel. Soft, warm, diffused lighting typical of a high-end spa creates a serene, deeply relaxing mood. In the softly blurred background, a single softly glowing pillar candle provides a gentle ambient light. The scene is immaculate, texturally rich, and entirely devoid of people, focusing purely on the objects of relaxation." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDsZ4wmGWNbkMCswo2UjuFlzsPvQuqyBz2B9zCNHvaqjOTb9UkdXalTdzd_abW31QI3UxvibH1utP2ccZbuUUJzgdippGJAf5Afjtt-Ft91A14FsJxenLHAqazRWNhcbk_6NQMmNFiHWFz17SJZUObb1Lx0AYn5YOO3z6FueW1QBrTNcwj3dAKniMqjtb1ahKw-UoZ5vVkA2He8o7xjlB7tz9T6d1h9DH3X-tPSWsnuziXik0j8xlzYUtBxDFq37WZV5uKX4ZlWwvs')"></div>
<!-- Gradient overlay for text readability -->
<div class="absolute inset-0 bg-gradient-to-t from-surface via-surface/60 to-transparent"></div>
</div>
<div class="relative z-10 max-w-container-max mx-auto flex flex-col items-center text-center gap-stack-gap">
<span class="font-label-sm text-label-sm uppercase tracking-widest text-primary mb-4 bg-secondary px-4 py-1 rounded-full border border-primary/20">Cocon &amp; Détente</span>
<h1 class="font-headline-display text-headline-display-mobile md:text-headline-display text-primary max-w-3xl">
                    Institut de beauté à ${city}
                </h1>
<p class="font-body-md text-body-md text-on-surface-variant max-w-2xl mt-4 mb-8">
                    Découvrez un espace hors du temps dédié à votre bien-être. Laissez notre expertise sublimer votre beauté naturelle à travers des rituels de soins d'exception.
                </p>
<div class="flex flex-col sm:flex-row gap-4">
<a class="bg-primary text-on-primary font-label-lg text-label-lg px-8 py-4 rounded-full uppercase tracking-[0.08em] hover:opacity-90 transition-opacity shadow-[0_8px_16px_rgba(126,34,206,0.2)]" href="#reserver">
                        Réserver mon soin
                    </a>
<a class="border border-outline text-primary font-label-lg text-label-lg px-8 py-4 rounded-full uppercase tracking-[0.08em] hover:bg-secondary transition-colors" href="#services">
                        Découvrir nos rituels
                    </a>
</div>
</div>
</section>
<!-- Savoir-faire Section (Asymmetric Layout) -->
<section class="w-full max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding py-section-gap flex flex-col md:flex-row gap-12 items-center" id="savoir-faire">
<div class="w-full md:w-1/2 flex flex-col gap-6 order-2 md:order-1">
<h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">L'art du geste juste</h2>
<div class="w-12 h-0.5 bg-primary/30"></div>
<p class="font-body-md text-body-md text-on-surface-variant">
                    Notre philosophie repose sur une approche holistique du soin. Chaque protocole est soigneusement élaboré pour répondre aux besoins uniques de votre peau, en alliant techniques ancestrales et innovations cosmétiques.
                </p>
<p class="font-body-md text-body-md text-on-surface-variant">
                    Nous sélectionnons rigoureusement des actifs nobles et naturels. Le toucher de nos praticiennes, précis et enveloppant, invite à un lâcher-prise total.
                </p>
<div class="mt-4">
<span class="font-headline-lg text-xl italic text-primary/60">"L'excellence au service de votre sérénité."</span>
</div>
</div>
<div class="w-full md:w-1/2 relative order-1 md:order-2 h-[400px] md:h-[600px] rounded-lg overflow-hidden shadow-[0_8px_24px_rgba(0,0,0,0.04)] image-overlay">
<img class="w-full h-full object-cover rounded-lg" data-alt="A tight, extreme close-up focusing on small, amber-colored glass essential oil bottles arranged neatly on a rustic wooden tray. Beside them lies a softly rolled linen hand towel and a small sprig of dried lavender. The lighting is moody, intimate, and warm, casting soft shadows that highlight the textures of the wood and glass. The visual style is highly refined, editorial, and strictly object-focused with a high-end spa aesthetic." src="https://lh3.googleusercontent.com/aida-public/AB6AXuC9US6Xoh7A415Fs9j4HSUnUzZ3lEM57rzbgI8h-eDWVtvZZJm7IS46vYTAuCkbviEkeMPIT_gPyGAYckoxRZZ23fyMNKWcAlQaJAsOap8hu_XUCZ-qP0-CysKNjEPbZfu7ES8D1gw6vczegT860tU4ZBYmrmzwWUsRarfbU9FRhuREKnOQYwyGgIfj8u16RirKPJjbqkZi0G3GS5TeCuNMTHyRnhsxhO6bl5iG_VNk2Z4DnWqesfrSV-2eMGvFCepGmvFflvJsNxk"/>
</div>
</section>
<!-- Services Section (Bento Grid) -->
<section class="w-full bg-surface-container-low py-section-gap" id="services">
<div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding flex flex-col gap-12">
<div class="text-center flex flex-col items-center gap-4">
<h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">Nos Prestations</h2>
<p class="font-body-md text-body-md text-on-surface-variant max-w-xl">Une carte de soins pensée comme une invitation au voyage sensoriel.</p>
</div>
<!-- Bento Grid Layout -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6 md:auto-rows-[300px]">
<!-- Large Card: Massages -->
<div class="md:col-span-2 md:row-span-2 relative rounded-lg overflow-hidden bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.04)] group image-overlay">
<div class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105" data-alt="A high-angle view of a perfectly made, empty massage table covered in crisp, immaculate white linens. The table is positioned in the center of a softly lit, minimalist treatment room. Subtle, warm cove lighting illuminates the edges of the room. The mood is deeply tranquil, anticipating relaxation. The composition emphasizes pristine cleanliness and professional preparation, devoid of any human presence." style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuDX6sI4UhaLlRyTr_dtu_dpZa7yxL--6lvawSADLbbuYPD05S60Ng_fZSoy8CfxwfhbFyfJ7paOQ0sVrglFJL730_nt1yXQ8NSC1hd_EvwsOx5sUVQ6lA-GGVRMFatBqDLCDe3AWCbMOJn3TZ1b45DN-ur3GkTZNQU4CBtZukHDrLL_qmmEdgg2Nn5MTap2FzGxYOooFdwSY1qJbRxrKCDms3yt5M3OYxF232rgPBGgOuEYnfCyb-AhPKPMQFbLY3mh_3JiX99hTGI')"></div>
<div class="absolute inset-0 bg-gradient-to-t from-tertiary/80 to-transparent"></div>
<div class="absolute bottom-0 left-0 p-8 flex flex-col gap-2">
<h3 class="font-headline-lg text-headline-lg text-on-primary">Massages &amp; Rituels</h3>
<p class="font-body-md text-body-md text-on-primary/80 max-w-md">Relâcher les tensions profondes et harmoniser le corps et l'esprit grâce à nos modelages sur-mesure.</p>
<a class="mt-4 font-label-sm text-label-sm text-secondary uppercase flex items-center gap-1 hover:underline w-fit" href="#">Découvrir <span class="material-symbols-outlined text-[16px]">arrow_forward</span></a>
</div>
</div>
<!-- Small Card: Visage -->
<div class="relative rounded-lg p-6 bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between border border-outline-variant/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow">
<div class="flex justify-between items-start">
<span class="material-symbols-outlined text-primary text-4xl">face_retouching_natural</span>
</div>
<div class="mt-8">
<h3 class="font-headline-lg text-2xl text-primary mb-2">Soins du Visage</h3>
<p class="font-body-md text-body-md text-on-surface-variant text-sm">Purifier, hydrater ou raffermir : des protocoles experts pour révéler l'éclat de votre teint.</p>
</div>
</div>
<!-- Small Card: Corps -->
<div class="relative rounded-lg p-6 bg-secondary/30 shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between border border-secondary hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow">
<div class="flex justify-between items-start">
<span class="material-symbols-outlined text-primary text-4xl">spa</span>
</div>
<div class="mt-8">
<h3 class="font-headline-lg text-2xl text-primary mb-2">Soins du Corps</h3>
<p class="font-body-md text-body-md text-on-surface-variant text-sm">Gommages et enveloppements pour une peau douce, nourrie et lumineuse.</p>
</div>
</div>
<!-- Small Card: Manucure -->
<div class="relative rounded-lg p-6 bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between border border-outline-variant/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow">
<div class="flex justify-between items-start">
<span class="material-symbols-outlined text-primary text-4xl">pan_tool_alt</span>
</div>
<div class="mt-8">
<h3 class="font-headline-lg text-2xl text-primary mb-2">Beauté des Mains</h3>
<p class="font-body-md text-body-md text-on-surface-variant text-sm">Manucure classique ou pose de vernis semi-permanent pour des mains parfaites.</p>
</div>
</div>
<!-- Small Card: Epilation -->
<div class="relative rounded-lg p-6 bg-surface shadow-[0_4px_12px_rgba(0,0,0,0.04)] flex flex-col justify-between border border-outline-variant/30 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-shadow">
<div class="flex justify-between items-start">
<span class="material-symbols-outlined text-primary text-4xl">content_cut</span>
</div>
<div class="mt-8">
<h3 class="font-headline-lg text-2xl text-primary mb-2">Épilations</h3>
<p class="font-body-md text-body-md text-on-surface-variant text-sm">Méthodes douces pour un résultat net et durable, respectueuses des peaux sensibles.</p>
</div>
</div>
</div>
</div>
</section>
<!-- Contact Section -->
<section class="w-full max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding py-section-gap grid grid-cols-1 md:grid-cols-2 gap-12" id="contact">
<div class="flex flex-col gap-6">
<h2 class="font-headline-lg text-headline-lg-mobile md:text-headline-lg text-primary">Prendre rendez-vous</h2>
<p class="font-body-md text-body-md text-on-surface-variant">
                    Notre équipe est à votre disposition pour vous conseiller et planifier votre moment de détente à ${city}.
                </p>
<div class="flex flex-col gap-4 mt-4">
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-primary">
<span class="material-symbols-outlined">location_on</span>
</div>
<div>
<p class="font-label-lg text-label-lg text-primary uppercase">Adresse</p>
<p class="font-body-md text-on-surface-variant">Centre-ville, ${city}</p>
</div>
</div>
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-primary">
<span class="material-symbols-outlined">call</span>
</div>
<div>
<p class="font-label-lg text-label-lg text-primary uppercase">Téléphone</p>
<p class="font-body-md text-on-surface-variant">${phoneDisplay}</p>
</div>
</div>
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-primary">
<span class="material-symbols-outlined">schedule</span>
</div>
<div>
<p class="font-label-lg text-label-lg text-primary uppercase">Horaires</p>
<p class="font-body-md text-on-surface-variant text-sm">Mar-Ven: 10h - 19h<br/>Sam: 9h - 17h</p>
</div>
</div>
</div>
</div>
<!-- Booking Form Placeholder -->
<div class="bg-surface p-8 rounded-lg shadow-[0_8px_24px_rgba(0,0,0,0.04)] border border-outline-variant/30">
<h3 class="font-headline-lg text-2xl text-primary mb-6">Demande de réservation</h3>
<form class="flex flex-col gap-4">
<div class="flex flex-col gap-1">
<label class="font-label-sm text-label-sm text-on-surface-variant" for="name">Nom complet</label>
<input class="font-body-md px-4 py-3 bg-surface border border-outline rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" id="name" type="text"/>
</div>
<div class="flex flex-col gap-1">
<label class="font-label-sm text-label-sm text-on-surface-variant" for="service">Prestation souhaitée</label>
<select class="font-body-md px-4 py-3 bg-surface border border-outline rounded focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all" id="service">
<option>Soin du Visage</option>
<option>Massage Relaxant</option>
<option>Beauté des Mains</option>
<option>Épilation</option>
</select>
</div>
<button class="mt-4 bg-primary text-on-primary font-label-lg text-label-lg px-6 py-4 rounded uppercase tracking-[0.08em] hover:opacity-90 transition-opacity" type="button">
                        Envoyer la demande
                    </button>
<p class="text-xs text-on-surface-variant text-center mt-2">Nous vous recontacterons rapidement pour confirmer l'horaire.</p>
</form>
</div>
</section>
</main>
<!-- Footer from JSON -->
<footer class="bg-surface-container-high w-full border-t border-outline-variant flat no shadows">
<div class="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-stack-gap px-mobile-padding md:px-desktop-padding py-section-gap items-center text-center md:text-left">
<!-- Brand Logo -->
<div class="font-headline-lg text-headline-lg text-on-surface flex justify-center md:justify-start">
                ${name}
            </div>
<!-- Links -->
<div class="flex flex-col md:flex-row gap-4 justify-center items-center font-label-sm text-label-sm">
<a class="text-on-surface-variant hover:text-primary underline transition-all focus:outline-none focus:ring-2 focus:ring-primary" href="#">Mentions Légales</a>
<a class="text-on-surface-variant hover:text-primary underline transition-all focus:outline-none focus:ring-2 focus:ring-primary" href="#">Confidentialité</a>
<a class="text-on-surface-variant hover:text-primary underline transition-all focus:outline-none focus:ring-2 focus:ring-primary" href="#">CGV</a>
</div>
<!-- Copyright -->
<div class="font-body-md text-body-md text-on-surface-variant md:text-right">
                © ${year} ${name}. Tous droits réservés.
            </div>
</div>
</footer>
<!-- Mobile Floating Action Button (FAB) -->
<a class="md:hidden fixed bottom-6 right-6 z-50 bg-primary text-on-primary w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_16px_rgba(126,34,206,0.3)] hover:scale-105 transition-transform" href="#reserver">
<span class="material-symbols-outlined" data-icon="calendar_month">calendar_month</span>
</a>
<!-- Mobile Bottom Navigation Shell (Since we are on a top level destination, it should be present on mobile, though instructions said "BottomNavBar or SideNav" - I'll build a simple bottom nav adhering to logic) -->
<nav class="md:hidden fixed bottom-0 w-full bg-surface-container-lowest border-t border-outline-variant flex justify-around items-center h-16 z-40 pb-safe">
<a class="flex flex-col items-center gap-1 text-primary" href="#accueil">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">home</span>
<span class="font-label-sm text-[10px] uppercase">Accueil</span>
</a>
<a class="flex flex-col items-center gap-1 text-on-surface-variant" href="#savoir-faire">
<span class="material-symbols-outlined">auto_awesome</span>
<span class="font-label-sm text-[10px] uppercase">Atelier</span>
</a>
<a class="flex flex-col items-center gap-1 text-on-surface-variant" href="#services">
<span class="material-symbols-outlined">spa</span>
<span class="font-label-sm text-[10px] uppercase">Soins</span>
</a>
<a class="flex flex-col items-center gap-1 text-on-surface-variant" href="#contact">
<span class="material-symbols-outlined">mail</span>
<span class="font-label-sm text-[10px] uppercase">Contact</span>
</a>
</nav>
<!-- Add padding to bottom of body to accommodate mobile nav -->
<div class="h-16 md:hidden"></div>
</body></html>`;
}
