/**
 * Template Stitch COUVREUR — pixel-pixel copy de :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/couvreur_name_1/code.html
 *
 * Substitutions minimales (le DESIGN n'est PAS touché) :
 * - {{NAME}} → p.name | {{CITY}} → p.city
 * - tous les téléphones → p.phone (auto-detect via regex)
 * - "12 rue des Artisans" et similaires → p.address
 * - nav sticky top-0 → sticky top-[54px] (passe sous la sales-ui-bar 54px)
 * - année footer dynamique
 */

export type CouvreurPixelProspect = {
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

export function generateStitchCouvreurPixelMockupHtml(p: CouvreurPixelProspect): string {
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
<title>Couvreur &amp; Charpentier - ${name}</title>
<!-- Tailwind CSS Config -->
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            "colors": {
                "on-tertiary-fixed": "#1c1b1a",
                "primary-container": "#1c1b1b",
                "on-tertiary": "#ffffff",
                "surface-variant": "#e5e2e1",
                "outline-variant": "#c4c7c7",
                "surface-container-low": "#f7f3f2",
                "surface-container-lowest": "#ffffff",
                "primary-fixed": "#e5e2e1",
                "on-surface-variant": "#444748",
                "on-error": "#ffffff",
                "secondary-fixed-dim": "#c7c6c6",
                "surface-dim": "#ddd9d8",
                "on-tertiary-fixed-variant": "#484645",
                "tertiary-container": "#1c1b1a",
                "outline": "#747878",
                "tertiary-fixed": "#e6e2df",
                "primary-fixed-dim": "#c8c6c5",
                "on-surface": "#1c1b1b",
                "error-container": "#ffdad6",
                "surface-container-high": "#ebe7e6",
                "on-tertiary-container": "#868382",
                "on-secondary": "#ffffff",
                "on-primary-fixed-variant": "#474746",
                "surface-container-highest": "#e5e2e1",
                "surface-container": "#f1edec",
                "secondary": "#5e5e5e",
                "background": "#fdf8f8",
                "tertiary": "#000000",
                "primary": "#000000",
                "inverse-on-surface": "#f4f0ef",
                "on-primary-fixed": "#1c1b1b",
                "on-background": "#1c1b1b",
                "inverse-primary": "#c8c6c5",
                "error": "#ba1a1a",
                "secondary-container": "#e1dfdf",
                "on-secondary-fixed": "#1b1c1c",
                "surface": "#fdf8f8",
                "on-secondary-fixed-variant": "#464747",
                "on-error-container": "#93000a",
                "surface-tint": "#5f5e5e",
                "inverse-surface": "#313030",
                "tertiary-fixed-dim": "#cac6c4",
                "surface-bright": "#fdf8f8",
                "secondary-fixed": "#e4e2e2",
                "on-secondary-container": "#626263",
                "on-primary-container": "#858383",
                "on-primary": "#ffffff"
            },
            "borderRadius": {
                "DEFAULT": "0.25rem",
                "lg": "0.5rem",
                "xl": "0.75rem",
                "full": "9999px"
            },
            "spacing": {
                "container-max": "1200px",
                "desktop-padding": "4rem",
                "section-gap": "7rem",
                "stack-gap": "1.5rem",
                "mobile-padding": "1.5rem"
            },
            "fontFamily": {
                "label-lg": ["Plus Jakarta Sans"],
                "headline-lg": ["EB Garamond"],
                "headline-display": ["EB Garamond"],
                "label-sm": ["Plus Jakarta Sans"],
                "body-md": ["Plus Jakarta Sans"],
                "headline-lg-mobile": ["EB Garamond"]
            },
            "fontSize": {
                "label-lg": ["14px", { "lineHeight": "1.2", "letterSpacing": "0.08em", "fontWeight": "700" }],
                "headline-lg": ["42px", { "lineHeight": "1.2", "fontWeight": "500" }],
                "headline-display": ["64px", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "600" }],
                "label-sm": ["12px", { "lineHeight": "1.2", "letterSpacing": "0.05em", "fontWeight": "600" }],
                "body-md": ["17px", { "lineHeight": "1.7", "fontWeight": "400" }],
                "headline-lg-mobile": ["34px", { "lineHeight": "1.3", "fontWeight": "600" }]
            }
          }
        }
      }
    </script>
<!-- Google Fonts -->
<link href="https://fonts.googleapis.com" rel="preconnect"/>
<link crossorigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,500;0,600;1,500&amp;family=Plus+Jakarta+Sans:wght@400;600;700&amp;display=swap" rel="stylesheet"/>
<!-- Material Symbols -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
        .texture-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            opacity: 0.05;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        
        .stone-texture {
            background-image: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='f'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.05' numOctaves='2'/%3E%3CfeDisplacementMap in='SourceGraphic' scale='5'/%3E%3C/filter%3E%3Crect width='100' height='100' fill='%23f1edec' filter='url(%23f)' opacity='0.1'/%3E%3C/svg%3E");
        }

        html { scroll-behavior: smooth; }
        .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; }
        .hero-gradient { background: linear-gradient(to bottom, rgba(28,27,27,0.4) 0%, rgba(28,27,27,0.8) 100%); }
    </style>
</head>
<body class="bg-surface text-on-surface font-body-md antialiased relative">
<div class="texture-overlay"></div>
<!-- Navigation -->
<header class="bg-surface/80 backdrop-blur-md sticky top-[54px] z-40 border-b border-outline-variant/30">
<div class="max-w-[1400px] mx-auto flex justify-between items-center px-mobile-padding md:px-desktop-padding py-5">
<div class="font-headline-lg text-2xl font-bold tracking-tighter text-primary flex items-center gap-2">
<span class="w-2.5 h-2.5 bg-primary rounded-full"></span>
            ${name}
        </div>
<nav class="hidden lg:flex items-center gap-12">
<a class="text-on-surface-variant hover:text-primary font-label-lg text-label-sm uppercase tracking-widest transition-colors" href="#heritage">Héritage</a>
<a class="text-on-surface-variant hover:text-primary font-label-lg text-label-sm uppercase tracking-widest transition-colors" href="#expertise">Expertise</a>
<a class="text-on-surface-variant hover:text-primary font-label-lg text-label-sm uppercase tracking-widest transition-colors" href="#temoignages">Témoignages</a>
<a class="text-on-surface-variant hover:text-primary font-label-lg text-label-sm uppercase tracking-widest transition-colors" href="#contact">Contact</a>
</nav>
<a class="hidden md:inline-flex items-center justify-center border border-primary text-primary px-8 py-3 rounded-none font-label-lg text-label-sm uppercase tracking-widest hover:bg-primary hover:text-on-primary transition-all duration-500" href="#contact">
            Demander un devis
        </a>
<button aria-label="Menu" class="lg:hidden text-primary p-2">
<span class="material-symbols-outlined">menu</span>
</button>
</div>
</header>
<!-- Hero Section -->
<section class="relative h-[95vh] w-full flex items-center justify-center overflow-hidden bg-primary">
<div class="absolute inset-0 z-0">
<div class="bg-cover bg-center w-full h-full scale-105 animate-[pulse_10s_ease-in-out_infinite]" style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBrsGv3sB-uHMwfsv49HeoxbR6BCarAVB17fN43RCQyfH6C76X0K65SUWD9wt8q7WpSMtEQAqMaVbA6lEWmV-E1Fc97DVTWJMt6psWc72jAluy9G0asoygrudMeCa-TxZMFX8N_Vts_krqd7JOtMdYqL_NZ_PKbckzft2gQfVPSe0tGoKAkbt0-gDX2IGmaatWjQ9WthD5pGmyrfTefchB030WeA3IZ20y-Ycvds3F9IpcHjh3ZlB2uC9G10A67AouA6ey6Vkf3rx8');"></div>
<div class="absolute inset-0 hero-gradient"></div>
</div>
<div class="relative z-10 text-center px-mobile-padding max-w-4xl mx-auto text-on-tertiary">
<span class="font-label-lg text-label-sm uppercase tracking-[0.3em] mb-8 block opacity-80">Maîtres Artisans depuis 1984</span>
<h1 class="font-headline-display text-headline-display md:text-[80px] mb-8 leading-none">
            L'Art de Couvrir <br/><span class="italic font-normal">votre Patrimoine à ${city}</span>
</h1>
<p class="font-body-md text-xl md:text-2xl max-w-2xl mx-auto mb-12 opacity-80 font-light">
            Une expertise séculaire au service de la protection et de l'esthétique de votre demeure.
        </p>
<div class="flex flex-col md:flex-row gap-6 justify-center">
<a class="inline-flex items-center justify-center bg-white text-primary px-10 py-5 rounded-none font-label-lg text-label-sm uppercase tracking-widest hover:bg-surface-variant transition-colors" href="#expertise">
                Explorer nos réalisations
            </a>
<a class="inline-flex items-center justify-center border border-white/30 text-white px-10 py-5 rounded-none font-label-lg text-label-sm uppercase tracking-widest hover:bg-white/10 transition-colors" href="#contact">
                Diagnostic expert
            </a>
</div>
</div>
</section>
<!-- Heritage Section -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding bg-surface stone-texture" id="heritage">
<div class="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
<div class="relative group">
<div class="absolute -top-10 -left-10 w-full h-full border border-primary/10 -z-10 group-hover:top-0 group-hover:left-0 transition-all duration-700"></div>
<img class="w-full aspect-[4/5] object-cover rounded-none grayscale hover:grayscale-0 transition-all duration-1000 shadow-2xl" data-alt="Macro of hand-cut slate tiles with irregular edges and natural mineral textures." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDEQp7m1tyUnaLA6yihh30mh7Q8dw9HO2yuOo0VaHWMx1VDRj65alMAGXAOMEDSHTLLWxSNLEemJLbHQZQJbANZeDOJEUBaZrLLIMKJ4Q-v5XaRk5iv1L9oBw6irBadisEsK784oTsL-UIEQElnml5SnJnwNxyGZPbwAzQkRP0SUeVLGji0rFL_xUkmgKnsbAAeqRVKQi2y4sgPTlyBRff8aVgRQXjDN4deRXHqLWEj_71s5WAgA18qX66-gZLwBFFFxxKUGkek-rc"/>
</div>
<div class="space-y-8">
<span class="font-label-lg text-label-sm uppercase tracking-[0.2em] text-primary/60">Notre Histoire</span>
<h2 class="font-headline-lg text-headline-lg text-primary leading-tight">Héritage et Transmission : <br/>Le Geste Immuable</h2>
<p class="font-body-md text-on-surface-variant leading-relaxed text-lg">
                Au sein de ${name}, nous considérons chaque toit comme une œuvre singulière. Notre savoir-faire ne se limite pas à la technique ; il s'agit d'une transmission de gestes ancestraux, du tracé de la charpente à la taille précise de l'ardoise au marteau.
            </p>
<p class="font-body-md text-on-surface-variant leading-relaxed italic border-l-4 border-primary/20 pl-8 py-2">
                "Nous ne couvrons pas seulement des bâtiments, nous protégeons l'histoire de ceux qui les habitent, avec la même rigueur que les compagnons d'autrefois."
            </p>
<div class="grid grid-cols-2 gap-12 pt-8">
<div>
<div class="text-4xl font-headline-lg text-primary mb-2">40+</div>
<div class="font-label-sm uppercase tracking-widest text-on-surface-variant">Années d'Expérience</div>
</div>
<div>
<div class="text-4xl font-headline-lg text-primary mb-2">1200+</div>
<div class="font-label-sm uppercase tracking-widest text-on-surface-variant">Toitures Restaurées</div>
</div>
</div>
</div>
</div>
</section>
<!-- Immersive Expertise Grid -->
<section class="bg-primary text-on-primary py-section-gap overflow-hidden" id="expertise">
<div class="max-w-[1400px] mx-auto px-mobile-padding md:px-desktop-padding">
<div class="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
<div class="max-w-2xl">
<span class="font-label-lg text-label-sm uppercase tracking-[0.2em] text-on-primary/50 mb-6 block">Matériaux &amp; Savoir-faire</span>
<h2 class="font-headline-lg text-headline-display text-white">L'Exigence de la Matière</h2>
</div>
<p class="font-body-md text-on-primary/60 max-w-sm pb-2">Une sélection rigoureuse de matériaux nobles pour une longévité garantie sur plusieurs générations.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10">
<!-- Ardoise -->
<div class="group relative aspect-[3/4] overflow-hidden bg-primary">
<img class="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0" data-alt="Macro photography of slate textures" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBZEDM076FsTuPGi6kGzJt_yEeVSKI2tcKso7WecLkac4yrrr6_RPz7PzUz4_r4Rvx8I8tw6dSPzjyGgdO43z4qKUnjUN4x6T44CTf156QN6rPvGOxG2boiup9B1PtZ40tvYXfmcrNyhYGTni4y0je6j1gak-gKN3d0HCssXzPVEtYqi1A_DxKv5YNPMJoXkVaL0qcAhX7fBwjZTg2Wes8ayrWQlb-q536VS0TCBp3dCXel9e-EPnFggSlvibghidlJALymwR1sHXc"/>
<div class="absolute inset-0 p-12 flex flex-col justify-end bg-gradient-to-t from-primary via-transparent to-transparent">
<h3 class="font-headline-lg text-3xl mb-4">Ardoise Naturelle</h3>
<p class="font-body-md text-sm text-on-primary/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">Pose aux crochets ou clouée, pour une élégance intemporelle et une résistance absolue aux intempéries.</p>
</div>
</div>
<!-- Tuile -->
<div class="group relative aspect-[3/4] overflow-hidden bg-primary">
<img class="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0" data-alt="Macro photography of terracotta roof tiles" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDJXgVSUK-R8mKzwfEeYtRvUfDAFxT1sdTlRhKsS_pvzhPPRan4jvX3kJh6gl-459p1Xa22XkOTz8h5RMzv9nCenblRNxro6EyXldmY73eph8uuxehI2sR0mioFbB3RBlMdd__Pnt3DDkD_PTejqbQpqyzHfDKq-DM-oSmqnD5fDM9pgG38CayNzcdL1kpkQh9Q7mEyq-aS1npOBa3aAPIyCKJ01FWhr0DlAtB9e-vqo-dIoE9t0aLwPNjpN-MWOy2WWL6qal7IevE"/>
<div class="absolute inset-0 p-12 flex flex-col justify-end bg-gradient-to-t from-primary via-transparent to-transparent">
<h3 class="font-headline-lg text-3xl mb-4">Terre Cuite</h3>
<p class="font-body-md text-sm text-on-primary/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">Rénovation de toitures traditionnelles avec des tuiles sélectionnées pour leur patine et leur densité.</p>
</div>
</div>
<!-- Zinc -->
<div class="group relative aspect-[3/4] overflow-hidden bg-primary">
<img class="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-1000 grayscale group-hover:grayscale-0" data-alt="Close up of architectural zinc work" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDbAhuv2AfvYX3nPp7A_-tqnrpHsyFftuRePZrZ6LYDt4FcVT-q0Jk6N5kh86CLOVDhX3mrebZ0naTpkvsJsZO7NE_SqmBAjkmVgwNr31MHS4RyoL4va9I7TYg5e5nAKvMAld0eSo2GwOllIRTiSshjtAjiMMvx8vF-8Tu0OgW5_6FxmInBex4X7x7Z6ULjVNfgZ-ysxfCp3N93Q9CG4mK8fLaWy_tRz_ajBfNUdov9N5v7nNC0nUDZyTi-Z8iO0d4dBOigElkGNtY"/>
<div class="absolute inset-0 p-12 flex flex-col justify-end bg-gradient-to-t from-primary via-transparent to-transparent">
<h3 class="font-headline-lg text-3xl mb-4">Zinguerie d'Art</h3>
<p class="font-body-md text-sm text-on-primary/70 opacity-0 group-hover:opacity-100 transition-opacity duration-500">Façonnage sur mesure, ornementation et étanchéité pérenne pour des toitures de caractère.</p>
</div>
</div>
</div>
</div>
</section>
<!-- Social Proof / Reviews -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding bg-surface-container-low" id="temoignages">
<div class="max-w-container-max mx-auto">
<div class="text-center mb-20">
<span class="font-label-lg text-label-sm uppercase tracking-[0.2em] text-primary/60 mb-4 block">Satisfaction Client</span>
<h2 class="font-headline-lg text-headline-lg text-primary italic">La voix de nos clients</h2>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-12">
<!-- Review 1 -->
<div class="p-10 border border-outline-variant bg-white flex flex-col">
<div class="flex gap-1 mb-6 text-primary">
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
</div>
<p class="font-body-md text-on-surface-variant italic mb-8 grow">"Une intervention d'une précision remarquable sur notre maison de maître. L'équipe a respecté l'architecture d'origine tout en apportant une isolation moderne."</p>
<div>
<p class="font-label-lg text-primary uppercase">Marc L.</p>
<p class="font-label-sm text-on-surface-variant/60">Propriétaire à ${city}</p>
</div>
</div>
<!-- Review 2 -->
<div class="p-10 border border-outline-variant bg-white flex flex-col">
<div class="flex gap-1 mb-6 text-primary">
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
</div>
<p class="font-body-md text-on-surface-variant italic mb-8 grow">"Réactifs, professionnels et d'un conseil précieux. On sent la passion du métier dans chaque détail du chantier. Je recommande vivement ${name}."</p>
<div>
<p class="font-label-lg text-primary uppercase">Sophie D.</p>
<p class="font-label-sm text-on-surface-variant/60">Architecte</p>
</div>
</div>
<!-- Review 3 -->
<div class="p-10 border border-outline-variant bg-white flex flex-col">
<div class="flex gap-1 mb-6 text-primary">
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
<span class="material-symbols-outlined fill-1">star</span>
</div>
<p class="font-body-md text-on-surface-variant italic mb-8 grow">"Travail de zinguerie exceptionnel. Un véritable orfèvre du toit. Le résultat dépasse nos attentes tant sur l'aspect technique qu'esthétique."</p>
<div>
<p class="font-label-lg text-primary uppercase">Jean-Pierre R.</p>
<p class="font-label-sm text-on-surface-variant/60">Rénovation Patrimoine</p>
</div>
</div>
</div>
</div>
</section>
<!-- Contact Section -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding bg-surface" id="contact">
<div class="max-w-container-max mx-auto grid grid-cols-1 lg:grid-cols-12 gap-20">
<div class="lg:col-span-5 space-y-10">
<div>
<h2 class="font-headline-lg text-headline-display text-primary mb-6">Confiez-nous <br/>votre projet</h2>
<p class="font-body-md text-on-surface-variant text-lg">Qu'il s'agisse d'une restauration complète ou d'un diagnostic préventif, nous mettons notre expertise à votre disposition.</p>
</div>
<div class="space-y-6">
<div class="flex items-start gap-4 p-6 bg-surface-container-low border-l-4 border-primary">
<span class="material-symbols-outlined text-3xl text-primary mt-1">emergency</span>
<div>
<p class="font-label-lg text-primary uppercase mb-1">Service d'Urgence</p>
<p class="font-body-md text-sm text-on-surface-variant mb-2">Intervention rapide 24h/24 pour fuites et sinistres à ${city}.</p>
<p class="text-xl font-headline-lg text-primary">${phoneDisplay}</p>
</div>
</div>
<div class="space-y-4 pt-4">
<div class="flex items-center gap-4 text-on-surface-variant">
<span class="material-symbols-outlined text-primary">location_on</span>
<span class="font-body-md">${addressDisplay}'Artisanat, ${city}</span>
</div>
<div class="flex items-center gap-4 text-on-surface-variant">
<span class="material-symbols-outlined text-primary">mail</span>
<span class="font-body-md">contact@${name}.fr</span>
</div>
</div>
</div>
</div>
<div class="lg:col-span-7 bg-surface-container-highest p-10 md:p-16 relative">
<div class="absolute top-0 right-0 p-8 opacity-10">
<span class="material-symbols-outlined text-9xl">architecture</span>
</div>
<form class="space-y-8 relative z-10">
<div class="grid grid-cols-1 md:grid-cols-2 gap-8">
<div class="space-y-2">
<label class="block font-label-sm uppercase tracking-widest text-on-surface-variant">Nom Complet</label>
<input class="w-full bg-transparent border-b border-outline text-primary py-3 px-0 focus:border-primary outline-none transition-colors font-body-md" placeholder="Jean Dupont" type="text"/>
</div>
<div class="space-y-2">
<label class="block font-label-sm uppercase tracking-widest text-on-surface-variant">Téléphone</label>
<input class="w-full bg-transparent border-b border-outline text-primary py-3 px-0 focus:border-primary outline-none transition-colors font-body-md" placeholder="${phoneDisplay}" type="tel"/>
</div>
</div>
<div class="space-y-2">
<label class="block font-label-sm uppercase tracking-widest text-on-surface-variant">Type d'intervention</label>
<select class="w-full bg-transparent border-b border-outline text-primary py-3 px-0 focus:border-primary outline-none transition-colors font-body-md appearance-none">
<option>Rénovation Totale</option>
<option>Zinguerie &amp; Étanchéité</option>
<option>Charpente &amp; Ossature</option>
<option>Entretien &amp; Diagnostic</option>
</select>
</div>
<div class="space-y-2">
<label class="block font-label-sm uppercase tracking-widest text-on-surface-variant">Votre Message</label>
<textarea class="w-full bg-transparent border-b border-outline text-primary py-3 px-0 focus:border-primary outline-none transition-colors font-body-md min-h-[120px]" placeholder="Décrivez votre projet..."></textarea>
</div>
<button class="w-full bg-primary text-on-primary py-6 rounded-none font-label-lg text-label-sm uppercase tracking-[0.2em] hover:bg-on-surface-variant transition-colors shadow-xl" type="button">
                    Envoyer ma demande de devis
                </button>
</form>
</div>
</div>
</section>
<!-- Footer -->
<footer class="bg-primary text-on-primary py-20 border-t border-white/5">
<div class="max-w-[1400px] mx-auto px-mobile-padding md:px-desktop-padding">
<div class="grid grid-cols-1 md:grid-cols-12 gap-16 items-start">
<div class="md:col-span-5 space-y-8">
<div class="font-headline-lg text-4xl font-bold tracking-tighter text-white">
                    ${name}
                </div>
<p class="font-body-md text-on-primary/60 max-w-sm leading-relaxed">
                    L'excellence en couverture et charpente à ${city} depuis plus de trois décennies. Une signature de qualité pour les toits qui durent.
                </p>
<div class="flex gap-6">
<a class="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-primary transition-all" href="#"><span class="material-symbols-outlined text-sm">share</span></a>
<a class="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center hover:bg-white hover:text-primary transition-all" href="#"><span class="material-symbols-outlined text-sm">favorite</span></a>
</div>
</div>
<div class="md:col-span-3 space-y-6">
<h4 class="font-label-lg text-label-sm uppercase tracking-widest text-white/40">Navigation</h4>
<ul class="space-y-4 font-body-md">
<li><a class="hover:text-primary-fixed transition-colors" href="#heritage">Héritage</a></li>
<li><a class="hover:text-primary-fixed transition-colors" href="#expertise">Nos Services</a></li>
<li><a class="hover:text-primary-fixed transition-colors" href="#temoignages">Témoignages</a></li>
<li><a class="hover:text-primary-fixed transition-colors" href="#contact">Devis gratuit</a></li>
</ul>
</div>
<div class="md:col-span-4 space-y-6">
<h4 class="font-label-lg text-label-sm uppercase tracking-widest text-white/40">Horaires</h4>
<div class="space-y-2 font-body-md text-on-primary/70">
<p>${hoursInline}</p>
<p>Samedi : Sur rendez-vous</p>
<p class="pt-4 italic">Urgences 24/7 pour les interventions toiture</p>
</div>
</div>
</div>
<div class="mt-20 pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-on-primary/40 font-label-sm uppercase tracking-widest text-[10px]">
<p>© ${year} ${name}. Tous droits réservés.</p>
<div class="flex gap-10">
<a class="hover:text-white transition-colors" href="#">Mentions Légales</a>
<a class="hover:text-white transition-colors" href="#">Confidentialité</a>
<a class="hover:text-white transition-colors" href="#">CGV</a>
</div>
</div>
</div>
</footer>
</body></html>`;
}
