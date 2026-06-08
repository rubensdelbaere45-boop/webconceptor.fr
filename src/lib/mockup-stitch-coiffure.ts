/**
 * mockup-stitch-coiffure.ts
 * ─────────────────────────────────────────────────────────────
 * Copie pixel-pixel de la maquette Stitch "L'Élite Coiffure"
 * (design system "Haute Coiffure Narrative") — accueil_l_lite_coiffure.
 *
 * Tailwind CDN + Google Fonts (Playfair Display + Hanken Grotesk) +
 * Material Symbols, EXACTEMENT comme Stitch.
 *
 * Sharp angles (0px radius), hero full-bleed avec slow-zoom animation,
 * services 3-cards aspect 3:4, témoignages éditoriaux, footer 4-cols
 * avec newsletter.
 *
 * Photos Google AI Imagen (aida-public) STABLES et HD.
 *
 * S'applique à : coiffure (et étendable à esthétique/fleuriste/avocat/
 * immobilier ultérieurement).
 * ─────────────────────────────────────────────────────────────
 */

interface StitchProspect {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  hours?: string | null;
  reviews?: Array<{ author: string; rating: number; text: string; timeAgo?: string }> | null;
}

interface StitchCopy {
  hero_caps: string;
  hero_title: string;
  hero_subtitle: string;
  cta_primary: string;
  cta_secondary: string;
  univers_title: string;
  univers_paragraph1: string;
  univers_paragraph2: string;
  univers_badge: string;
  savoir_faire_title: string;
  savoir_faire_subtitle: string;
  savoir_faire_cards: Array<{ title: string; body: string }>;
  testimonials: Array<{ author: string; quote: string }>;
  cta_final_title: string;
  cta_final_paragraph: string;
  cta_final_button: string;
  footer_tagline: string;
}

function esc(s: string | null | undefined): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// Photos Google AI Imagen — exactement celles de la maquette Stitch coiffure
const PHOTOS = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuCALo4NTD8Knk0v1YZDsNJ5D6vh61DiCx5wjvY6F4PlsZ4eV_1K_jkdpT2ZtfLYHShtO0_yzSDr4R1wzAV0yk5BAPk5juLEQUAYEZzc8ht7-BbEwPxlgW7hpK3Bs8Mv65n7tRDTzBsacA7_vJgZefuPmYT4eRoJTKIy1FjYl0bAidUcHCpdtW5zsp0h5iMJY2VKPuPUTzDwHY0JG4kv2lerJNn76qSvxP9RNBKbnYCPVQhxWjP4GCDZ381gU23lUMgOw9vz5iQ6a9c",
  salonInterior: "https://lh3.googleusercontent.com/aida-public/AB6AXuDsfWUrh68lGyqGO48SYq48EdK6wP03wXM070omJ3dsxIa3o863tlpNFSl8Idosky_1dLwT8kbSBAsDsEMxJKFm1o1t3WVwkQA2jugzp_-s6QAvfkzGjf2BStm7cZbrezaViAfg3Af4vydzImM7-TObwpgIGMolvAKOoEiIgfZkiKleN8bQSFAp1rfu8ugdRBt6OsHNYJUOYPt1hfxKXWM5O72pcXYMtAlryADdb6kV2b959YVN3dg-nMf-yrec_k0YahQfDNh5zBg",
  tools: "https://lh3.googleusercontent.com/aida-public/AB6AXuAAo7du6bS8ZJcgVWVLaninsKvL_54piF5pIyP2ZGwea6Onc-hqzAQm5l0eRc-AHYCkFCQF9zt9TbUg_Xji8QkPcYz6qSLKShds9RqGr1I5UlpRuY2NmPFx6ZcOaQKJM-sPBCO_H-x-OhMq-qhgFxI3x2NLsuEPCQrCPG5jlN4YN9VYTLys-vK3CwCohwckfthRcLP2ig_HIQVRlLZa6IEQmd3DfETHLvw5pUWIS0xSsH0GDXA-3K4awUfiTuhGTPGV-C05j60GfR0",
  service1: "https://lh3.googleusercontent.com/aida-public/AB6AXuA5RzWisTpOS_hDuwVzT3Td7SkYb6eInqhTtlQAhYRJ8Jla8NBPA5oBuAixzSAYU-qXT4ROD3aXiYDWGv_bn8xSSsefiI5SckfUaMyOQJhJwnGpGFJGKKHHXmDN8bVwTrXqkUhN5fRmVIkAwhtdonjNslroAODmH7_LqAvmO2o1Eca3UEzsUy3z1pjsIJVG6LCFBnQWCKu4CQY3qZJ-IvlmlWb6Oko7osou3OTvQRhp-I89vwodw4MqpoYgd619m7PzSvvxOSP1jp0",
  service2: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6KymmMYUlTZEofTVaJ26-fwpG2dCT9JgYNoVXFhl9bNYeId2W80DCybUhuGJri8sDH88i3Xg56KuwOHuiYxEML82tfnEEWPXIozH-X5WDUMfsfPxkqxFr4bY8BEV6Vlz21FeuVF77GJbUw9q-Lve4FI4w3fVKbXH5oFlC447NPKbcHmF4xwD0dOBWOXKysL_WjtcthxUQBOobjQ0adEuyF8aaiqcLJGmp57ddUap4hB_m0FJVlN-XCJreMxxD_k_TxzZIGWqP1rI",
  service3: "https://lh3.googleusercontent.com/aida-public/AB6AXuBdIt-xG5-bFg2igrpNMiKqYRYgamspfJhbDdZB1Wjny36Yl8-2efmqEBBV8B3pEXxbc-XEkcW2iscqBMDdQXMYqCib6Nl51spUiVDb5rR-6IJjQnEX-jbIx6qot4KgJGy0SUfjQG2O_sa-CWDZ2WzP4qGpIX53pDQkGZ8woEr4Jl2DfqG3_pSvBJ-H3SzvlE33-1rXQ3O_9bG3NEr0myY8IEAwNtSrpAOSIDgccf1m9bPXqtIZmBlExnB6QgqVwYvlv8t9t-Qv_s4",
};

function parseHoursList(raw: string | null | undefined): Array<{ day: string; hours: string }> | null {
  if (!raw) return null;
  const lines = raw.split(/\s*[\|\n]\s*/).map(s => s.trim()).filter(Boolean);
  if (lines.length < 2) return null;
  const dayMap: Record<string, string> = {
    lun: "Lundi", lundi: "Lundi", mar: "Mardi", mardi: "Mardi",
    mer: "Mercredi", mercredi: "Mercredi", jeu: "Jeudi", jeudi: "Jeudi",
    ven: "Vendredi", vendredi: "Vendredi", sam: "Samedi", samedi: "Samedi",
    dim: "Dimanche", dimanche: "Dimanche",
  };
  const out: Array<{ day: string; hours: string }> = [];
  for (const line of lines) {
    const m = line.match(/^(lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|lun|mar|mer|jeu|ven|sam|dim)\s*[:\-]?\s*(.+)$/i);
    if (m) out.push({ day: dayMap[m[1].toLowerCase()] || m[1], hours: m[2].trim() });
  }
  return out.length >= 2 ? out : null;
}

function starsHtml(rating: number | null | undefined): string {
  const r = rating || 5;
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  let out = "";
  for (let i = 0; i < full; i++) out += `<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star</span>`;
  if (half) out += `<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">star_half</span>`;
  return out;
}

export function renderStitchCoiffure(prospect: StitchProspect, copy: StitchCopy): string {
  const city = prospect.city || "votre ville";
  const phoneClean = (prospect.phone || "").replace(/\s/g, "");
  const ratingDisplay = prospect.google_rating ? prospect.google_rating.toFixed(1) : "5.0";
  const reviewsCount = prospect.google_reviews_count || 100;
  const hoursList = parseHoursList(prospect.hours);
  const prospectUpper = prospect.name.toUpperCase();

  const reviewsForTestimonials = (prospect.reviews && prospect.reviews.length >= 2
    ? prospect.reviews.slice(0, 3)
    : copy.testimonials.slice(0, 3).map(t => ({ author: t.author, rating: 5, text: t.quote }))
  );

  // 3 services à partir de copy.savoir_faire_cards
  const services = [
    { ...copy.savoir_faire_cards[0], img: PHOTOS.service1, price: "À PARTIR DE 95€" },
    { ...copy.savoir_faire_cards[1], img: PHOTOS.service2, price: "À PARTIR DE 65€" },
    { ...copy.savoir_faire_cards[2], img: PHOTOS.service3, price: "SUR DEVIS" },
  ];

  return `<!DOCTYPE html>
<html class="light" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${esc(prospect.name)} | ${esc(city)}</title>
<meta name="description" content="${esc(copy.footer_tagline)}"/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&amp;family=Hanken+Grotesk:wght@400;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          "primary": "#000000",
          "primary-container": "#1b1b1b",
          "on-primary": "#ffffff",
          "on-primary-container": "#848484",
          "secondary": "#735c00",
          "secondary-container": "#fed65b",
          "secondary-fixed": "#ffe088",
          "secondary-fixed-dim": "#e9c349",
          "on-secondary": "#ffffff",
          "on-secondary-container": "#745c00",
          "tertiary": "#000000",
          "surface": "#fcf9f8",
          "surface-bright": "#fcf9f8",
          "surface-dim": "#dcd9d9",
          "surface-container": "#f0eded",
          "surface-container-lowest": "#ffffff",
          "surface-container-low": "#f6f3f2",
          "surface-container-high": "#eae7e7",
          "surface-container-highest": "#e5e2e1",
          "background": "#fcf9f8",
          "on-background": "#1c1b1b",
          "on-surface": "#1c1b1b",
          "on-surface-variant": "#4c4546",
          "outline": "#7e7576",
          "outline-variant": "#cfc4c5",
          "inverse-primary": "#c6c6c6",
          "inverse-surface": "#313030",
          "inverse-on-surface": "#f3f0ef"
        },
        borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
        spacing: { unit: "8px", "section-padding-desktop": "120px", gutter: "24px",
                   "section-padding-mobile": "64px", "container-max-width": "1280px" },
        fontFamily: {
          "headline-sm": ["Playfair Display"], "display-lg-mobile": ["Playfair Display"],
          "label-caps": ["Hanken Grotesk"], "headline-md": ["Playfair Display"],
          "body-md": ["Hanken Grotesk"], "body-lg": ["Hanken Grotesk"],
          "display-lg": ["Playfair Display"]
        },
        fontSize: {
          "headline-sm": ["24px", { lineHeight: "1.4", fontWeight: "600" }],
          "display-lg-mobile": ["40px", { lineHeight: "1.2", fontWeight: "700" }],
          "label-caps": ["12px", { lineHeight: "1", letterSpacing: "0.15em", fontWeight: "700" }],
          "headline-md": ["32px", { lineHeight: "1.3", fontWeight: "600" }],
          "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
          "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
          "display-lg": ["64px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }]
        }
      }
    }
  }
</script>
<style>
  .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; }
  .hero-zoom { animation: slow-zoom 20s linear infinite alternate; }
  @keyframes slow-zoom { from { transform: scale(1); } to { transform: scale(1.1); } }
</style>
</head>
<body class="bg-surface text-on-surface font-body-md selection:bg-secondary-fixed selection:text-on-secondary-fixed">

<!-- Top Nav -->
<nav class="bg-surface border-b border-outline-variant fixed top-0 left-0 right-0 z-50 h-20 transition-all duration-200">
<div class="flex justify-between items-center w-full px-gutter max-w-container-max-width mx-auto h-full">
<a class="font-headline-md text-headline-md tracking-tighter text-primary uppercase" href="#">
${esc(prospectUpper)}
</a>
<div class="hidden md:flex space-x-8 items-center h-full">
<a class="font-label-caps text-label-caps text-secondary border-b border-secondary h-full flex items-center" href="#services">Services</a>
<a class="font-label-caps text-label-caps text-primary hover:text-secondary transition-colors h-full flex items-center" href="#lookbook">Lookbook</a>
<a class="font-label-caps text-label-caps text-primary hover:text-secondary transition-colors h-full flex items-center" href="#salon">Salon</a>
<a class="font-label-caps text-label-caps text-primary hover:text-secondary transition-colors h-full flex items-center" href="#rendez-vous">Rendez-vous</a>
</div>
<a href="${phoneClean ? `tel:${phoneClean}` : "#rendez-vous"}" class="bg-primary text-on-primary font-label-caps text-label-caps px-8 py-3 hover:bg-secondary transition-all duration-300">
${esc(copy.cta_primary).toUpperCase()}
</a>
</div>
</nav>

<main class="pt-20">

<!-- Hero -->
<section class="relative h-[921px] overflow-hidden bg-primary flex items-center justify-center">
<div class="absolute inset-0">
<img class="w-full h-full object-cover opacity-70 hero-zoom" src="${PHOTOS.hero}" alt="${esc(prospect.name)}"/>
</div>
<div class="relative z-10 text-center text-on-primary px-gutter max-w-4xl mx-auto">
<h1 class="font-display-lg text-display-lg-mobile md:text-display-lg mb-8 drop-shadow-lg">
${esc(copy.hero_title)}${prospect.city ? ` à ${esc(city)}` : ""}
</h1>
<div class="flex flex-col md:flex-row gap-4 justify-center items-center">
<a href="#rendez-vous" class="bg-surface text-primary px-10 py-4 font-label-caps text-label-caps hover:bg-secondary-fixed transition-all">
${esc(copy.cta_primary).toUpperCase()}
</a>
<a href="#lookbook" class="border border-surface text-surface px-10 py-4 font-label-caps text-label-caps hover:bg-surface hover:text-primary transition-all">
${esc(copy.cta_secondary).toUpperCase()}
</a>
</div>
</div>
</section>

<!-- Philosophy / Experience -->
<section class="py-section-padding-mobile md:py-section-padding-desktop px-gutter max-w-container-max-width mx-auto" id="salon">
<div class="grid grid-cols-1 md:grid-cols-2 gap-20 items-center">
<div class="space-y-8">
<span class="font-label-caps text-label-caps text-secondary tracking-[0.3em]">${esc(copy.hero_caps).toUpperCase()}</span>
<h2 class="font-headline-md text-headline-md leading-tight">${esc(copy.univers_title)}</h2>
<p class="font-body-lg text-body-lg text-on-surface-variant leading-relaxed">${esc(copy.univers_paragraph1)}</p>
<p class="font-body-md text-body-md text-on-surface-variant">${esc(copy.univers_paragraph2)}</p>
<div class="pt-4">
<a class="inline-flex items-center gap-2 font-label-caps text-label-caps text-primary hover:text-secondary transition-colors" href="#services">
DÉCOUVRIR LE SALON <span class="material-symbols-outlined">arrow_right_alt</span>
</a>
</div>
</div>
<div class="relative grid grid-cols-2 gap-4">
<img class="w-full aspect-[3/4] object-cover mt-12" src="${PHOTOS.salonInterior}" alt="Salon"/>
<img class="w-full aspect-[3/4] object-cover" src="${PHOTOS.tools}" alt="Outils"/>
</div>
</div>
</section>

<!-- Services -->
<section class="bg-surface-container-low py-section-padding-mobile md:py-section-padding-desktop" id="services">
<div class="px-gutter max-w-container-max-width mx-auto">
<div class="flex flex-col md:flex-row justify-between items-end mb-16 gap-4">
<div class="max-w-xl">
<span class="font-label-caps text-label-caps text-secondary tracking-[0.3em]">NOS SERVICES</span>
<h2 class="font-headline-md text-headline-md mt-4 uppercase">${esc(copy.savoir_faire_title)}</h2>
</div>
<p class="font-body-md text-body-md text-on-surface-variant md:text-right max-w-xs">
${esc(copy.savoir_faire_subtitle)}
</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
${services.map(s => `
<div class="group cursor-pointer">
<div class="overflow-hidden aspect-[3/4] mb-6 relative">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="${s.img}" alt="${esc(s.title || "")}"/>
<div class="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors duration-500"></div>
</div>
<h3 class="font-headline-sm text-headline-sm mb-2">${esc(s.title || "Service signature")}</h3>
<div class="flex items-center gap-4">
<span class="font-label-caps text-label-caps text-secondary">${esc(s.price)}</span>
<div class="h-[1px] flex-grow bg-outline-variant"></div>
</div>
</div>`).join("")}
</div>
</div>
</section>

<!-- Testimonials -->
<section class="py-section-padding-mobile md:py-section-padding-desktop border-y border-outline-variant" id="lookbook">
<div class="px-gutter max-w-4xl mx-auto text-center">
<span class="font-label-caps text-label-caps text-secondary tracking-[0.3em]">TÉMOIGNAGES</span>
<div class="mt-16 space-y-20">
${reviewsForTestimonials.map((r, idx) => `
<blockquote class="space-y-6">
<div class="flex justify-center gap-1 text-secondary-fixed-dim">
${starsHtml(("rating" in r ? (r as any).rating : 5) as number)}
</div>
<p class="font-headline-sm text-headline-sm italic leading-relaxed">"${esc((r as any).text || (r as any).quote)}"</p>
<cite class="font-label-caps text-label-caps not-italic text-primary">— ${esc((r as any).author).toUpperCase()}</cite>
</blockquote>
${idx < reviewsForTestimonials.length - 1 ? '<div class="w-12 h-[1px] bg-outline-variant mx-auto"></div>' : ""}
`).join("")}
</div>
</div>
</section>

<!-- Location & Hours -->
<section class="py-section-padding-mobile md:py-section-padding-desktop" id="rendez-vous">
<div class="px-gutter max-w-container-max-width mx-auto">
<div class="grid grid-cols-1 md:grid-cols-2 gap-24">
<div class="space-y-12">
<div>
<h2 class="font-headline-md text-headline-md mb-8 uppercase">Nous Trouver</h2>
${prospect.address
  ? prospect.address.split(",").map((line, i) => `<p class="font-body-lg text-body-lg ${i === 0 ? "mb-2" : ""}">${esc(line.trim())}</p>`).join("")
  : `<p class="font-body-lg text-body-lg">${esc(city)}</p>`
}
${prospect.phone ? `<a class="block mt-4 font-label-caps text-label-caps text-secondary underline" href="tel:${phoneClean}">${esc(prospect.phone)}</a>` : ""}
</div>
<div>
<h3 class="font-label-caps text-label-caps text-secondary mb-6 tracking-widest">HORAIRES D'OUVERTURE</h3>
${hoursList
  ? `<ul class="space-y-4 border-l border-outline-variant pl-6">
    ${hoursList.map(h => `<li class="flex justify-between font-body-md ${/ferm/i.test(h.hours) ? "text-on-surface-variant" : ""}"><span>${esc(h.day)}</span><span>${esc(h.hours)}</span></li>`).join("")}
   </ul>`
  : `<p class="font-body-md text-on-surface-variant">Sur rendez-vous</p>`
}
</div>
</div>
<div class="h-[500px] bg-surface-container-highest relative overflow-hidden">
<div class="absolute inset-0 flex items-center justify-center bg-gray-200">
<img class="w-full h-full object-cover grayscale opacity-50" src="https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(prospect.address || city)}&zoom=15&size=800x600&maptype=roadmap" alt="Plan ${esc(prospect.name)}"/>
<div class="absolute inset-0 flex items-center justify-center">
<div class="bg-primary text-on-primary p-6 shadow-2xl">
<span class="material-symbols-outlined text-4xl block text-center mb-2">location_on</span>
<p class="font-label-caps text-label-caps whitespace-nowrap">${esc(prospectUpper)}</p>
</div>
</div>
</div>
</div>
</div>
</div>
</section>

</main>

<!-- Footer -->
<footer class="bg-surface-container-lowest border-t border-primary">
<div class="grid grid-cols-1 md:grid-cols-4 gap-gutter px-gutter py-section-padding-desktop max-w-container-max-width mx-auto">
<div class="space-y-6">
<span class="font-headline-sm text-headline-sm text-primary uppercase">${esc(prospectUpper)}</span>
<p class="font-body-md text-body-md text-on-surface-variant">${esc(copy.footer_tagline)}</p>
</div>
<div class="flex flex-col gap-4">
<span class="font-label-caps text-label-caps text-primary">NAVIGATION</span>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline" href="#services">Services</a>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline" href="#lookbook">Témoignages</a>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline" href="#salon">Salon</a>
<a class="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline" href="#rendez-vous">Rendez-vous</a>
</div>
<div class="flex flex-col gap-4">
<span class="font-label-caps text-label-caps text-primary">CONTACT</span>
${prospect.address ? `<span class="font-body-md text-body-md text-on-surface-variant">${esc(prospect.address)}</span>` : ""}
${prospect.phone ? `<a class="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline" href="tel:${phoneClean}">${esc(prospect.phone)}</a>` : ""}
${prospect.email ? `<a class="font-body-md text-body-md text-on-surface-variant hover:text-secondary underline" href="mailto:${esc(prospect.email)}">${esc(prospect.email)}</a>` : ""}
${hoursList ? `<span class="font-body-md text-body-md text-on-surface-variant text-xs mt-2">${ratingDisplay}/5 sur ${reviewsCount} avis Google</span>` : ""}
</div>
<div class="space-y-6">
<span class="font-label-caps text-label-caps text-primary">RENDEZ-VOUS</span>
<p class="font-body-md text-body-md text-on-surface-variant">${esc(copy.cta_final_paragraph)}</p>
<a href="${phoneClean ? `tel:${phoneClean}` : "#"}" class="bg-primary text-on-primary px-6 py-3 font-label-caps text-label-caps w-full text-center hover:bg-secondary transition-colors block">${esc(copy.cta_final_button).toUpperCase()}</a>
</div>
</div>
<div class="px-gutter py-8 max-w-container-max-width mx-auto border-t border-outline-variant/30 text-center">
<p class="font-label-caps text-label-caps text-on-surface-variant tracking-widest opacity-60">
© ${new Date().getFullYear()} ${esc(prospectUpper)}. TOUS DROITS RÉSERVÉS.
</p>
</div>
</footer>

<script>
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function(e){
      e.preventDefault();
      const t = document.querySelector(this.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior: 'smooth' });
    });
  });
  const nav = document.querySelector('nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      nav.classList.add('shadow-sm');
      nav.classList.replace('h-20', 'h-16');
    } else {
      nav.classList.remove('shadow-sm');
      nav.classList.replace('h-16', 'h-20');
    }
  });
</script>

</body></html>`;
}

export type { StitchProspect as StitchCoiffureProspect, StitchCopy as StitchCoiffureCopy };
export { renderStitchCoiffure as _renderStitchCoiffure };
