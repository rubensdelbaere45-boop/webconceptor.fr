/**
 * Template Stitch CAFE — pixel-pixel copy de :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/caf_name_1/code.html
 *
 * Substitutions minimales (le DESIGN n'est PAS touché) :
 * - {{NAME}} → p.name | {{CITY}} → p.city
 * - tous les téléphones → p.phone (auto-detect via regex)
 * - "12 rue des Artisans" et similaires → p.address
 * - nav sticky top-0 → sticky top-[54px] (passe sous la sales-ui-bar 54px)
 * - année footer dynamique
 */

export type CafePixelProspect = {
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

import { renderStitchHoursInline, renderStitchTestimonialsBoulangerieStyle } from "./mockup-stitch-pixel-helpers";

const esc = (s: string | null | undefined): string =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export function generateStitchCafePixelMockupHtml(p: CafePixelProspect): string {
  const name = esc(p.name || "");
  const city = esc(p.city || "votre ville");
  const phoneDisplay = esc(p.phone || "");
  const phoneDigits = (p.phone || "").replace(/[^\d+]/g, "");
  const addressDisplay = p.address ? esc(p.address) : `12 rue principale, ${city}`;
  const year = new Date().getFullYear();
  const hoursInline = renderStitchHoursInline(p.hours, "${hoursInline}");
  const testimonialsHtml = renderStitchTestimonialsBoulangerieStyle(p.reviews || null, [
    { text: "Le meilleur café du quartier, ambiance cosy et grains torréfiés sur place. Une vraie pépite.", author: "Sophie M., Journaliste" },
    { text: "Un endroit unique pour télétravailler. Wi-Fi rapide, prises partout, et le brunch est à tomber.", author: "Thomas L., Développeur" },
    { text: "Le service est attentionné, les pâtisseries faites maison sont incroyables. Mon QG du week-end.", author: "Marie K., Habituée" },
  ], 'bg-primary p-10 rounded-2xl italic text-lg leading-relaxed text-on-primary/90 relative shadow-xl');
  return `<!DOCTYPE html>

<html class="light" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>L'Art de Vivre - ${name}</title>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "primary": "#1c1b1b",
                        "on-primary": "#ffffff",
                        "secondary": "#78350f",
                        "surface": "#fdf8f8",
                        "on-surface": "#1c1b1b",
                        "surface-container": "#f1edec",
                        "surface-container-high": "#ebe7e6",
                        "outline": "#747878",
                        "outline-variant": "#c4c7c7",
                        "tertiary": "#78350f"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "stack-gap": "1.5rem",
                        "section-gap": "8rem",
                        "container-max": "1200px",
                        "mobile-padding": "1.5rem",
                        "desktop-padding": "4rem"
                    },
                    "fontFamily": {
                        "headline": ["EB Garamond", "serif"],
                        "body": ["Plus Jakarta Sans", "sans-serif"]
                    },
                    "fontSize": {
                        "headline-display": ["clamp(3.5rem, 8vw, 6rem)", { "lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "600" }],
                        "headline-lg": ["3.5rem", { "lineHeight": "1.2", "fontWeight": "500" }],
                        "body-lg": ["1.25rem", { "lineHeight": "1.7", "fontWeight": "400" }],
                        "label-lg": ["0.875rem", { "lineHeight": "1.2", "letterSpacing": "0.15em", "fontWeight": "700" }]
                    }
                }
            }
        }
    </script>
<style>
        .parallax-bg {
            background-attachment: fixed;
            background-position: center;
            background-repeat: no-repeat;
            background-size: cover;
        }
        .editorial-grid {
            display: grid;
            grid-template-columns: repeat(12, 1fr);
        }
        .text-overlap {
            z-index: 10;
        }
        ::selection {
            background: #78350f;
            color: white;
        }
    </style>
</head>
<body class="bg-surface text-on-surface font-body antialiased">
<!-- Navigation -->
<header class="fixed top-0 w-full z-50 mix-blend-difference">
<div class="max-w-container-max mx-auto flex justify-between items-center px-mobile-padding md:px-desktop-padding py-8">
<div class="font-headline text-3xl font-bold text-white tracking-tight italic">${name}</div>
<nav class="hidden md:flex items-center gap-12">
<a class="text-white font-label-lg uppercase hover:opacity-60 transition-opacity" href="#histoire">Histoire</a>
<a class="text-white font-label-lg uppercase hover:opacity-60 transition-opacity" href="#savoir-faire">Savoir-faire</a>
<a class="text-white font-label-lg uppercase hover:opacity-60 transition-opacity" href="#services">Services</a>
<a class="text-white font-label-lg uppercase hover:opacity-60 transition-opacity" href="#contact">Contact</a>
</nav>
<button class="md:hidden text-white">
<span class="material-symbols-outlined">menu</span>
</button>
</div>
</header>
<main>
<!-- Hero: Immersive Visual -->
<section class="relative h-screen flex items-end pb-24 overflow-hidden">
<div class="absolute inset-0 z-0">
<img alt="Vue immersive bar zinc" class="w-full h-full object-cover scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAM7ec9cTvoIf4Ow1Aocb-euegSRlLdEWhw_68RSjN008dDmDPERY2LM0K3OKM2v06ag5t8KSG33qWNJUCQy2ZNIiXlBvU8CAnWFWa5lxsYlgGVuwdd1Nppln04428UsmX-PcSV-fGdo6XMV52w1tq302mACqKcYvrWomqfxT_ya7d23_hnt0ixPhYcCXVoqzpvIqLjUZNeUvD55qKVCEBnF7DJyj5QOqNCLfERarJdDqWxQPjFY4ET0IEGFExwM40HW2fyVh_rsdM"/>
<div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
</div>
<div class="relative z-10 w-full max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding">
<div class="max-w-3xl">
<span class="text-white/60 font-label-lg uppercase mb-4 block tracking-widest italic">— ${city}</span>
<h1 class="font-headline text-headline-display text-white mb-8">L'Éveil des Sens au Cœur du Zinc.</h1>
<p class="font-body text-body-lg text-white/80 max-w-xl mb-12">Une institution où le temps s'arrête, portée par l'excellence du geste et la noblesse du grain.</p>
<div class="flex gap-6">
<a class="bg-white text-primary px-10 py-5 font-label-lg uppercase hover:bg-secondary hover:text-white transition-all" href="#contact">Réserver</a>
<a class="border border-white/30 text-white px-10 py-5 font-label-lg uppercase hover:bg-white hover:text-primary transition-all" href="#histoire">Notre Histoire</a>
</div>
</div>
</div>
</section>
<!-- Notre Histoire: Long-form Narrative -->
<section class="py-section-gap bg-surface overflow-hidden" id="histoire">
<div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding">
<div class="editorial-grid gap-y-12">
<div class="col-span-12 md:col-span-5 flex flex-col justify-center">
<span class="text-secondary font-label-lg uppercase mb-6 tracking-[0.2em] block">L'Héritage</span>
<h2 class="font-headline text-headline-lg mb-8 leading-tight">Une Tradition de Père en Fils.</h2>
<div class="space-y-6 text-on-surface/80 font-body text-body-lg leading-relaxed">
<p>Depuis plus de trois décennies, ${name} s'inscrit dans la lignée des grands bistrots parisiens, où chaque détail raconte une histoire d'artisanat et de passion. Nous ne servons pas simplement du café ; nous perpétuons un rituel.</p>
<p>Notre philosophie repose sur l'attente du moment parfait. De la sélection des fermes partenaires en Éthiopie jusqu'au dernier tour de cuillère, nous honorons la patience nécessaire à l'excellence.</p>
<blockquote class="border-l-4 border-secondary pl-6 py-2 italic font-headline text-2xl text-primary my-8">
                            "Le café est la grammaire du matin, et nous en soignons chaque ponctuation."
                        </blockquote>
</div>
</div>
<div class="col-span-12 md:col-start-7 md:col-span-6 relative">
<div class="aspect-[4/5] bg-surface-container relative overflow-hidden group">
<img alt="Ancien moulin à café texture" class="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBVIfAOwMmX5UHl0KGxJIgLMaFeDxkHbfqWKF2dfe4oT0nReqwPO3XLBI0-DBuoXGMiGLBqD6X8dgCsXmGFd0BVJYBCJ1v-TSOOXFVydH0S29JHAx0VL1XhjOST9kUrcRQUEDZA-JJVSTLtSGBQVOfITrGTsoV4ncEAU3l4iognnV-gz4_hAypQe2NbYax7Dk0JQL9juV5UWj_OQ_XqtGhW6kq8LFTzVCg7uacoSDvnkPniGUMR14peHDmrBwlIX6RNPZSjNZmFmtM"/>
</div>
<div class="absolute -bottom-12 -left-12 hidden lg:block w-64 h-64 border-8 border-surface-container-high z-10 overflow-hidden shadow-2xl">
<img alt="Détail grains" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDGIa_gsNBrjpyLrNtRK-ge13u3c6JOwU5BN0lNUclCOymCR9xpd7pl6-k_js6udPaxwYnEPDBQ2lryBQ6v7NujBOIp6SfFyT8BK14hjdvQIsbh1zoN4crAdaYBEQDES9TufKFsP9M1AjnWYM5ABU9rxNdba6vP6j4GzzVOVyKit0RzYEgAiZ507M9h_55tiJZONTijxpXFJhGWnKvgvD311tOTJ78aO5Maotv9zRzjlI-gB2lQFZvC5u2yT8u0c7hQ1UFbTRR22ig"/>
</div>
</div>
</div>
</div>
</section>
<!-- Savoir-faire: Full-width Macro Photography & Asymmetry -->
<section class="bg-primary text-on-primary py-section-gap overflow-hidden" id="savoir-faire">
<div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding mb-24">
<div class="flex flex-col md:flex-row justify-between items-baseline gap-8">
<h2 class="font-headline text-headline-lg italic">La Maîtrise du Geste</h2>
<p class="font-body text-xl text-on-primary/60 max-w-md">L'alchimie entre la chaleur, la pression et le grain rigoureusement sélectionné.</p>
</div>
</div>
<div class="space-y-40">
<!-- Feature 1 -->
<div class="editorial-grid items-center px-mobile-padding md:px-0">
<div class="col-span-12 md:col-span-8 overflow-hidden relative aspect-video">
<img alt="Extraction espresso macro" class="w-full h-full object-cover parallax-bg" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBMskj_7UvLsyVHSqJISzyQOUdOQgUnIZYcja_u9mxP4TIFMcmftJrmSFSySStYpDbk4ac9TfSpVkJVGamyBEItKpZn18TZ8zawHwrJFkeHxid8MOtSIr-usHybm70TcO4--qVvsIiB8eXzdLWti8De-vCttOnkLkI6IEzJUN_RR8NlP2OZfm3P8nTW0gN5RfFFdAY_fL0dfRJv81tRgfY8EDXQ0zshAuYRQXcatewKjlqYwz4nqaINUezcWVe6ougOB98WIKP1nlE"/>
</div>
<div class="col-span-12 md:col-start-8 md:col-span-4 bg-secondary p-12 md:-ml-24 text-overlap shadow-2xl mt-8 md:mt-0">
<span class="font-label-lg uppercase text-white/50 mb-4 block">01. L'Extraction</span>
<h3 class="font-headline text-4xl mb-6 italic text-white">L'Or Noir à 9 Bars.</h3>
<p class="text-white/80 leading-relaxed font-body">Nos baristas ajustent les moulins trois fois par jour pour compenser l'humidité de l'air, garantissant une créma onctueuse et une tasse équilibrée.</p>
</div>
</div>
<!-- Feature 2 -->
<div class="editorial-grid items-center px-mobile-padding md:px-0">
<div class="col-span-12 md:col-start-2 md:col-span-4 bg-white/5 p-12 backdrop-blur-sm border border-white/10 md:-mr-24 text-overlap order-2 md:order-1 mt-8 md:mt-0">
<span class="font-label-lg uppercase text-on-primary/50 mb-4 block">02. La Torréfaction</span>
<h3 class="font-headline text-4xl mb-6 italic text-on-primary">Une Cuisson à Cœur.</h3>
<p class="text-on-primary/70 leading-relaxed font-body">Une torréfaction "robe de moine", lente et progressive, qui laisse s'exprimer les notes de noisette grillée et de chocolat noir caractéristiques de nos assemblages.</p>
</div>
<div class="col-span-12 md:col-start-5 md:col-span-8 overflow-hidden aspect-video order-1 md:order-2">
<img alt="Torréfaction machine détail" class="w-full h-full object-cover grayscale contrast-125" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAPIBFvRqWYIKYe81eLHcnY23OssyvVcMxY6LPogIwDRko1ygKkcJ3fSP5nSAmcGgQEA_IRA_DuCkc0MY6JG25poG7CxoQy9jGgFLQsXmT-i0726kYQR8A-t0IgPjIyjOM3blImpuSzcF9ayxvKzrec3A83CerI2lcIVlt6ZwrB4vStclm0XngPIzz6Xx-zv0Cqg8YIKyJ1GEOLhNDzpX6OV3Hu5NxqQaqsioS0HA0AOUE3f8dv1joeg-tMFyZT2NaZLYTFKtlBAy8"/>
</div>
</div>
</div>
</section>
<!-- Services: Editorial Style -->
<section class="py-section-gap bg-surface-container-low border-b border-outline-variant" id="services">
<div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding">
<div class="text-center mb-20">
<h2 class="font-headline text-headline-lg mb-4 italic">Nos Univers Gastronomiques</h2>
<div class="w-24 h-0.5 bg-secondary mx-auto"></div>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-12">
<div class="group cursor-default">
<div class="aspect-[3/4] overflow-hidden mb-8 relative">
<img alt="Petit déjeuner" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBWd0I8whNnJgwE8X29ppX9b5Ax7xGjOChdKbQrC-Brsy41ElqC-Fv_g_f5skcswl-M-ethaCyPN29zbmj1Y85nAMjQe_wUkeru3SVW9Gr-QIUzzkbslOJXC97CA46GprXHt2jM7sLMyNGNckGxh-I82oh-aeHGOv7ARM9oBkQe3Zud_gmcmoXLVXJotggEjZBw5T52kAeNxrWaPyYC1-K9tVkILbhb8_oxSse0WxW_BzUriyuSy7AEX_JLkozcPT32BK0YcX-SnnY"/>
<div class="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
</div>
<h3 class="font-headline text-3xl mb-4 italic">Matinée Gourmande</h3>
<p class="text-on-surface-variant font-body">Viennoiseries au beurre AOP, levées durant 24 heures pour une texture feuilletée incomparable.</p>
</div>
<div class="group cursor-default md:mt-24">
<div class="aspect-[3/4] overflow-hidden mb-8 relative">
<img alt="Service déjeuner" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCoWHpv3mYMCgsrTs5br_W1VcHdhm2oMer0yZfWrT0_ykHP6cr6wd_XUZCf2ur42QrXUu0-c8SRL3gcV_kIlVotHtIsA7_52zS9P_PhRG4gykqXx8-GLG_SjNo2vmf-UMLt7WTSyVAhkpm4DefWH6QXi1UqoziWfDGvV50eTO5Bi1vFMsUwbzJ-GsB5_n0qcYSmHjBS2Zvwr-pKxcJuAKKfVndTawy4z6oAyEeNu2ucdGTSI9Pw7D7yeXQehf84yzrUXl0nFlIFths"/>
<div class="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
</div>
<h3 class="font-headline text-3xl mb-4 italic">L'Assiette Bistro</h3>
<p class="text-on-surface-variant font-body">Une cuisine de marché, sincère et de saison. Le classique revisité avec une exigence contemporaine.</p>
</div>
<div class="group cursor-default">
<div class="aspect-[3/4] overflow-hidden mb-8 relative">
<img alt="Vins et cocktails" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAb0r3_5E1mHcRuH-huZFQ-hIjzGwNY59Kakfd1fa716wEXZqTlrvs_n06TcQSKk3PVagTv8wstTsAmDKGeT2xHL-DwOzoMgbKGQpErDIiE8O7FXX7-YvI-JFOM95C0tRwD3d8XTN-Ct9PRIIXetpkYlhXRicZxuPXL4dF_vgqw938t6A3dPJW9xDJHLKuOAPIRQZWIw0mdfXArx2SsHLKSR5OWYvwC4zvoEuvtDlLy3yUDZ9DbJGir6Poo9ZEYEyAr_ZVS9QB9ie0"/>
<div class="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
</div>
<h3 class="font-headline text-3xl mb-4 italic">Cave &amp; Zinc</h3>
<p class="text-on-surface-variant font-body">Vins de vignerons indépendants et spiritueux rares pour des fins de journée suspendues.</p>
</div>
</div>
</div>
</section>
<!-- Social Proof: Testimonials -->
<section class="py-section-gap bg-primary text-on-primary">
<div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding">
<div class="text-center mb-16">
<span class="font-label-lg uppercase tracking-[0.3em] block mb-4 text-secondary italic">Témoignages</span>
<h2 class="font-headline text-headline-lg italic">Ce que nos clients disent</h2>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-12">
<div class="p-8 border border-white/10 italic">
<span class="material-symbols-outlined text-secondary mb-6 text-4xl">format_quote</span>
<p class="text-xl font-headline mb-6 leading-relaxed">"Un refuge de calme et d'élégance à ${city}. Leur espresso est sans doute le meilleur que j'ai goûté en dehors de l'Italie."</p>
<cite class="not-italic font-label-lg text-on-primary/60 uppercase">— Jean-Pierre L., Architecte</cite>
</div>
<div class="p-8 bg-white/5 border border-white/20 italic transform md:-translate-y-8">
<span class="material-symbols-outlined text-secondary mb-6 text-4xl">format_quote</span>
<p class="text-xl font-headline mb-6 leading-relaxed">"On sent la passion derrière chaque détail. De la texture des serviettes au goût profond du café, ${name} est une expérience sensorielle complète."</p>
<cite class="not-italic font-label-lg text-on-primary/60 uppercase">— Sophie M., Journaliste</cite>
</div>
<div class="p-8 border border-white/10 italic">
<span class="material-symbols-outlined text-secondary mb-6 text-4xl">format_quote</span>
<p class="text-xl font-headline mb-6 leading-relaxed">"Ma terrasse préférée pour lire. L'accueil est discret, efficace et d'une politesse rare de nos jours. Un vrai joyau local."</p>
<cite class="not-italic font-label-lg text-on-primary/60 uppercase">— Marc A., Écrivain</cite>
</div>
</div>
</div>
</section>
<!-- Contact: Elegant Layout -->
<section class="py-section-gap bg-surface" id="contact">
<div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding">
<div class="editorial-grid gap-16 items-center">
<div class="col-span-12 md:col-span-6">
<div class="aspect-square bg-surface-container relative overflow-hidden shadow-2xl">
<img alt="Intérieur boutique vide" class="w-full h-full object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCqugyFS-0rIKQ2fhoGveKKRRwlVFxk70tlup8JBkE5uO3fmZAD_Y3qHI96kNK4MLkJ0F-eq7OknI7yQNPvrnAxRns8xhUb9PEsOf4QPImNvAKywUqgT5iO7G5NIVqSNCet2z5yRh8x1Vkc5d-85X_SZWu8RzNMftzGCRhoZOI3qUtQVwVbI3iQjdMih2Tmhuy49XAwGVoxsHiosEvmXjAIuHILjPXkU8A1YeyWD8zgz45KOdfGPhJdghv6xwiLSquN5BnVdDyeqzs"/>
</div>
</div>
<div class="col-span-12 md:col-span-5 md:col-start-8">
<h2 class="font-headline text-headline-lg mb-12 italic">Nous Rendre Visite</h2>
<div class="space-y-10">
<div class="flex items-start gap-6 border-b border-outline-variant pb-6">
<span class="material-symbols-outlined text-secondary">location_on</span>
<div>
<p class="font-label-lg uppercase mb-2">Lieu</p>
<p class="font-body text-xl text-on-surface-variant">12 Place du Marché, ${city}</p>
</div>
</div>
<div class="flex items-start gap-6 border-b border-outline-variant pb-6">
<span class="material-symbols-outlined text-secondary">schedule</span>
<div>
<p class="font-label-lg uppercase mb-2">Horaires</p>
<p class="font-body text-xl text-on-surface-variant">${hoursInline}</p>
</div>
</div>
<div class="flex items-start gap-6">
<span class="material-symbols-outlined text-secondary">call</span>
<div>
<p class="font-label-lg uppercase mb-2">Réservation</p>
<p class="font-body text-xl text-on-surface-variant">${phoneDisplay}</p>
</div>
</div>
</div>
<button class="mt-16 bg-primary text-white w-full py-6 font-label-lg uppercase tracking-widest hover:bg-secondary transition-all shadow-xl">
                        Réserver votre table
                    </button>
</div>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="bg-primary text-on-primary py-24 border-t border-white/5">
<div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding">
<div class="flex flex-col md:flex-row justify-between items-center gap-12 text-center md:text-left">
<div class="font-headline text-4xl italic">${name}</div>
<div class="flex gap-12 font-label-lg uppercase text-on-primary/60">
<a class="hover:text-white" href="#">Instagram</a>
<a class="hover:text-white" href="#">Facebook</a>
<a class="hover:text-white" href="#">Newsletter</a>
</div>
</div>
<div class="mt-24 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between gap-6 text-on-primary/40 font-body text-sm uppercase tracking-widest">
<div class="flex gap-8">
<a class="hover:text-white" href="#">Mentions Légales</a>
<a class="hover:text-white" href="#">Confidentialité</a>
</div>
<div>© ${year} ${name}. Tous droits réservés.</div>
</div>
</div>
</footer>
<!-- Mobile FAB -->
<a class="md:hidden fixed bottom-8 right-8 bg-secondary text-white w-16 h-16 rounded-full flex items-center justify-center shadow-2xl z-50 animate-bounce" href="#contact">
<span class="material-symbols-outlined">calendar_month</span>
</a>
</body></html>`;
}
