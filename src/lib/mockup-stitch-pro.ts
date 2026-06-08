/**
 * mockup-stitch-pro.ts
 * ─────────────────────────────────────────────────────────────
 * 3 renderers Stitch pixel-pixel pour les professions premium :
 *   - renderStitchAvocat       (Lambert & Associés)
 *   - renderStitchImmobilier   (Iconic Properties / Provençal Heritage)
 *   - renderStitchFleuriste    (Petals & Bloom / Botanical Vitality)
 *
 * Chacun :
 *   - Tailwind CDN + Google Fonts spécifiques au design system
 *   - Palette exacte du DESIGN.md Stitch
 *   - Photos Google AI Imagen (aida-public) HD stables
 *   - Sections caractéristiques (domaines / biens / collections)
 * ─────────────────────────────────────────────────────────────
 */

interface P {
  id: string; slug: string; name: string;
  city?: string | null; address?: string | null;
  phone?: string | null; email?: string | null;
  google_rating?: number | null; google_reviews_count?: number | null;
  hours?: string | null;
  reviews?: Array<{ author: string; rating: number; text: string; timeAgo?: string }> | null;
}

interface C {
  hero_caps: string; hero_title: string; hero_subtitle: string;
  cta_primary: string; cta_secondary: string;
  univers_title: string; univers_paragraph1: string; univers_paragraph2: string;
  univers_badge: string;
  savoir_faire_title: string; savoir_faire_subtitle: string;
  savoir_faire_cards: Array<{ title: string; body: string }>;
  testimonials: Array<{ author: string; quote: string }>;
  cta_final_title: string; cta_final_paragraph: string; cta_final_button: string;
  footer_tagline: string;
}

function esc(s: string | null | undefined): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function parseHours(raw: string | null | undefined): Array<{ day: string; hours: string }> | null {
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

// ═══════════════════════════════════════════════════════════════
// 1) AVOCAT — Lambert & Associés
// Palette: cream #fbf9fa + black #000 + gold #fdd48f
// Polices: EB Garamond + Inter
// ═══════════════════════════════════════════════════════════════

const PHOTOS_AVOCAT = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuD5QrQgAGXWVCxUJE11s_IGaWP4_uhg-DC2Gl3Yoejcs8Fly3a7TbvORsAIy4oBvup-Hxvj8Ji4GzOnGpPaS5eoJbT-SpfGVoNWImXsCEkSgXwDHYKkTBa3j9FgnQnKA_VFFcWvcWI2xu5LE1GDUva6vZ-LKcPR9nbECNP4CRQTu0ZX4_rYKLruw6Ezmk66PaV6UeTIVS5ushXZ5jHCqLgTPhBIc1TDARyLyq65S71orujEz9sbT-AKz-n_7DtihUlmuyNVTXRsTNA",
};

export function renderStitchAvocat(prospect: P, copy: C): string {
  const city = prospect.city || "Paris";
  const phoneClean = (prospect.phone || "").replace(/\s/g, "");
  const hoursList = parseHours(prospect.hours);
  const upper = prospect.name.toUpperCase();
  const reviewsList = prospect.reviews && prospect.reviews.length >= 2
    ? prospect.reviews.slice(0, 3)
    : copy.testimonials.slice(0, 3).map(t => ({ author: t.author, rating: 5, text: t.quote }));

  return `<!DOCTYPE html>
<html class="light" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${esc(prospect.name)} | Cabinet d'Avocats ${esc(city)}</title>
<meta name="description" content="${esc(copy.footer_tagline)}"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800;1,400..800&amp;family=Inter:wght@100..900&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style>
  .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
  body { background-color: #fbf9fa; }
  .hero-gradient { background: radial-gradient(circle at 50% 50%, rgba(253, 212, 143, 0.05) 0%, rgba(251, 249, 250, 0) 70%); }
</style>
<script id="tailwind-config">
  tailwind.config = { darkMode: "class", theme: { extend: {
    colors: {
      "primary": "#000000", "primary-container": "#0e1c2d",
      "on-primary": "#ffffff", "on-primary-container": "#778599",
      "secondary": "#775921", "secondary-container": "#fdd48f",
      "on-secondary-container": "#785a21",
      "tertiary": "#000000", "tertiary-container": "#2a1704",
      "surface": "#fbf9fa", "surface-bright": "#fbf9fa",
      "surface-container": "#efedef", "surface-container-lowest": "#ffffff",
      "surface-container-low": "#f5f3f4", "surface-container-high": "#eae7e9",
      "surface-container-highest": "#e4e2e3",
      "background": "#fbf9fa", "on-background": "#1b1b1d",
      "on-surface": "#1b1b1d", "on-surface-variant": "#44474c",
      "outline": "#74777d", "outline-variant": "#c4c6cd",
      "inverse-surface": "#303032", "inverse-on-surface": "#f2f0f1",
      "inverse-primary": "#b9c8dd"
    },
    borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
    spacing: { base: "8px", xs: "4px", sm: "12px", md: "24px", lg: "48px", xl: "80px",
               gutter: "24px", "container-max": "1200px" },
    fontFamily: {
      "headline-md": ["EB Garamond"], "headline-sm": ["EB Garamond"],
      "display-lg": ["EB Garamond"], "display-lg-mobile": ["EB Garamond"],
      "body-lg": ["Inter"], "body-md": ["Inter"], "label-sm": ["Inter"]
    },
    fontSize: {
      "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "500" }],
      "display-lg-mobile": ["32px", { lineHeight: "1.2", fontWeight: "500" }],
      "headline-md": ["32px", { lineHeight: "1.2", fontWeight: "500" }],
      "headline-sm": ["24px", { lineHeight: "1.3", fontWeight: "500" }],
      "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
      "body-md": ["16px", { lineHeight: "1.5", fontWeight: "400" }],
      "label-sm": ["12px", { lineHeight: "1", letterSpacing: "0.05em", fontWeight: "600" }]
    }
  } } }
</script>
</head>
<body class="bg-background text-on-background font-body-md">

<header class="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/40">
<div class="max-w-container-max mx-auto px-gutter h-20 flex items-center justify-between">
<div class="font-headline-md text-2xl text-primary tracking-tight">${esc(prospect.name)}</div>
<nav class="hidden md:flex items-center gap-8">
<a class="font-label-sm text-label-sm text-on-surface-variant hover:text-primary uppercase tracking-wider" href="#domaines">Domaines</a>
<a class="font-label-sm text-label-sm text-on-surface-variant hover:text-primary uppercase tracking-wider" href="#associes">Les Associés</a>
<a class="font-label-sm text-label-sm text-on-surface-variant hover:text-primary uppercase tracking-wider" href="#contact">Contact</a>
</nav>
<a href="${phoneClean ? `tel:${phoneClean}` : "#contact"}" class="bg-primary text-on-primary px-6 py-3 font-label-sm uppercase tracking-wider hover:bg-secondary hover:text-primary transition-all">
${esc(copy.cta_primary).toUpperCase()}
</a>
</div>
</header>

<main class="pt-20">

<!-- Hero minimalist centered -->
<section class="hero-gradient py-xl">
<div class="max-w-container-max mx-auto px-gutter">
<div class="grid grid-cols-1 md:grid-cols-12 gap-md items-center">
<div class="md:col-span-7">
<span class="font-label-sm text-label-sm text-secondary uppercase tracking-[0.2em]">${esc(copy.hero_caps)}</span>
<h1 class="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary mt-md mb-md leading-tight">
${esc(copy.hero_title)}
</h1>
<p class="font-body-lg text-body-lg text-on-surface-variant mb-lg max-w-xl">${esc(copy.hero_subtitle)}</p>
<div class="flex flex-wrap gap-md">
<a href="#contact" class="bg-primary text-on-primary px-lg py-md font-label-sm uppercase tracking-wider hover:bg-secondary hover:text-primary transition-all inline-flex items-center gap-2">
${esc(copy.cta_primary).toUpperCase()} <span class="material-symbols-outlined text-base">arrow_forward</span>
</a>
<a href="#domaines" class="border border-primary text-primary px-lg py-md font-label-sm uppercase tracking-wider hover:bg-primary hover:text-on-primary transition-all">
${esc(copy.cta_secondary).toUpperCase()}
</a>
</div>
</div>
<div class="md:col-span-5">
<div class="aspect-[4/5] overflow-hidden">
<img class="w-full h-full object-cover" src="${PHOTOS_AVOCAT.hero}" alt="${esc(prospect.name)}"/>
</div>
</div>
</div>
</div>
</section>

<!-- Domaines d'intervention -->
<section id="domaines" class="py-xl bg-surface-container-low">
<div class="max-w-container-max mx-auto px-gutter">
<div class="mb-lg">
<span class="font-label-sm text-label-sm text-secondary uppercase tracking-[0.2em]">Notre Expertise</span>
<h2 class="font-headline-md text-headline-md text-primary mt-sm">${esc(copy.savoir_faire_title)}</h2>
<p class="font-body-md text-on-surface-variant mt-sm max-w-2xl">${esc(copy.savoir_faire_subtitle)}</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
${copy.savoir_faire_cards.slice(0, 6).map((c, i) => `
<div class="bg-surface p-lg border border-outline-variant/40 hover:border-primary transition-all group">
<div class="flex items-center justify-between mb-md">
<span class="material-symbols-outlined text-3xl text-primary">${["gavel","balance","description","verified_user","handshake","family_restroom"][i] || "gavel"}</span>
<span class="font-label-sm text-secondary opacity-60">0${i + 1}</span>
</div>
<h3 class="font-headline-sm text-headline-sm text-primary mb-sm">${esc(c.title)}</h3>
<p class="font-body-md text-on-surface-variant">${esc(c.body)}</p>
</div>`).join("")}
</div>
</div>
</section>

<!-- Les Associés / La Maison -->
<section id="associes" class="py-xl">
<div class="max-w-container-max mx-auto px-gutter">
<div class="grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
<div>
<span class="font-label-sm text-label-sm text-secondary uppercase tracking-[0.2em]">Le Cabinet</span>
<h2 class="font-headline-md text-headline-md text-primary mt-sm mb-md">${esc(copy.univers_title)}</h2>
<p class="font-body-lg text-on-surface-variant mb-md leading-relaxed">${esc(copy.univers_paragraph1)}</p>
<p class="font-body-md text-on-surface-variant leading-relaxed">${esc(copy.univers_paragraph2)}</p>
<div class="mt-lg flex gap-lg pt-md border-t border-outline-variant/40">
<div>
<div class="font-headline-sm text-headline-sm text-primary">${prospect.google_rating ? prospect.google_rating.toFixed(1) : "5,0"}/5</div>
<div class="flex text-secondary mt-1">${starsHtml(prospect.google_rating)}</div>
<div class="font-label-sm text-on-surface-variant mt-1 uppercase tracking-wider">${prospect.google_reviews_count || "Avis"} sur Google</div>
</div>
<div class="border-l border-outline-variant/40 pl-lg">
<div class="font-headline-sm text-headline-sm text-primary">${esc(city)}</div>
<div class="font-label-sm text-on-surface-variant mt-1 uppercase tracking-wider">Notre place</div>
</div>
</div>
</div>
<div>
<div class="bg-primary text-on-primary p-lg">
<div class="grid grid-cols-2 gap-md">
${["Confiance", "Discrétion", "Rigueur", "Expertise"].map(v => `
<div class="border-l border-secondary pl-md">
<div class="font-headline-sm text-secondary mb-1">${esc(v)}</div>
<div class="font-label-sm uppercase tracking-wider opacity-70">Notre valeur</div>
</div>`).join("")}
</div>
</div>
</div>
</div>
</div>
</section>

<!-- Témoignages -->
<section class="py-xl bg-primary text-on-primary">
<div class="max-w-container-max mx-auto px-gutter text-center">
<span class="font-label-sm text-label-sm text-secondary uppercase tracking-[0.2em]">Témoignages</span>
<div class="mt-lg space-y-lg">
${reviewsList.map((r, i) => `
<blockquote class="max-w-3xl mx-auto">
<div class="flex justify-center gap-1 text-secondary mb-md">${starsHtml(("rating" in r ? (r as any).rating : 5) as number)}</div>
<p class="font-headline-sm italic leading-relaxed">"${esc((r as any).text || (r as any).quote)}"</p>
<cite class="font-label-sm not-italic text-secondary mt-md block uppercase tracking-wider">— ${esc((r as any).author).toUpperCase()}</cite>
</blockquote>
${i < reviewsList.length - 1 ? '<div class="w-16 h-px bg-on-primary/20 mx-auto"></div>' : ""}
`).join("")}
</div>
</div>
</section>

<!-- Contact -->
<section id="contact" class="py-xl">
<div class="max-w-container-max mx-auto px-gutter">
<div class="grid grid-cols-1 md:grid-cols-2 gap-xl">
<div>
<span class="font-label-sm text-label-sm text-secondary uppercase tracking-[0.2em]">Prendre Rendez-vous</span>
<h2 class="font-headline-md text-headline-md text-primary mt-sm mb-md">${esc(copy.cta_final_title)}</h2>
<p class="font-body-lg text-on-surface-variant mb-lg">${esc(copy.cta_final_paragraph)}</p>
${prospect.address ? `<p class="font-body-md mb-sm"><span class="material-symbols-outlined align-middle mr-2">place</span>${esc(prospect.address)}</p>` : ""}
${prospect.phone ? `<p class="font-body-md mb-sm"><span class="material-symbols-outlined align-middle mr-2">call</span><a href="tel:${phoneClean}" class="hover:text-secondary">${esc(prospect.phone)}</a></p>` : ""}
${prospect.email ? `<p class="font-body-md mb-sm"><span class="material-symbols-outlined align-middle mr-2">mail</span><a href="mailto:${esc(prospect.email)}" class="hover:text-secondary">${esc(prospect.email)}</a></p>` : ""}
</div>
<div class="bg-surface-container-low p-lg">
<span class="font-label-sm text-label-sm text-secondary uppercase tracking-[0.2em]">Horaires</span>
${hoursList
  ? `<ul class="mt-md border-l border-outline-variant/40 pl-md space-y-sm">
    ${hoursList.map(h => `<li class="flex justify-between font-body-md ${/ferm/i.test(h.hours) ? "text-on-surface-variant" : "text-on-surface"}"><span>${esc(h.day)}</span><span>${esc(h.hours)}</span></li>`).join("")}
   </ul>`
  : `<p class="mt-md font-body-md text-on-surface-variant">Sur rendez-vous</p>`
}
<a href="${phoneClean ? `tel:${phoneClean}` : "#"}" class="mt-lg block bg-primary text-on-primary px-lg py-md text-center font-label-sm uppercase tracking-wider hover:bg-secondary hover:text-primary transition-all">
${esc(copy.cta_final_button).toUpperCase()}
</a>
</div>
</div>
</div>
</section>

</main>

<footer class="bg-primary text-on-primary border-t border-secondary/30">
<div class="max-w-container-max mx-auto px-gutter py-lg">
<div class="grid grid-cols-1 md:grid-cols-3 gap-lg">
<div>
<div class="font-headline-sm text-headline-sm text-secondary mb-sm">${esc(prospect.name)}</div>
<p class="font-body-md opacity-70">${esc(copy.footer_tagline)}</p>
</div>
<div>
<div class="font-label-sm uppercase tracking-wider text-secondary mb-md">Contact</div>
${prospect.address ? `<p class="font-body-md opacity-70 mb-sm">${esc(prospect.address)}</p>` : ""}
${prospect.phone ? `<a href="tel:${phoneClean}" class="font-body-md opacity-70 hover:opacity-100 hover:text-secondary block mb-sm">${esc(prospect.phone)}</a>` : ""}
${prospect.email ? `<a href="mailto:${esc(prospect.email)}" class="font-body-md opacity-70 hover:opacity-100 hover:text-secondary block">${esc(prospect.email)}</a>` : ""}
</div>
<div>
<div class="font-label-sm uppercase tracking-wider text-secondary mb-md">Navigation</div>
<a href="#domaines" class="font-body-md opacity-70 hover:opacity-100 hover:text-secondary block mb-sm">Domaines</a>
<a href="#associes" class="font-body-md opacity-70 hover:opacity-100 hover:text-secondary block mb-sm">Les Associés</a>
<a href="#contact" class="font-body-md opacity-70 hover:opacity-100 hover:text-secondary block">Contact</a>
</div>
</div>
<div class="mt-lg pt-md border-t border-on-primary/10 text-center">
<p class="font-label-sm uppercase tracking-wider opacity-50">© ${new Date().getFullYear()} ${esc(upper)} — Tous droits réservés</p>
</div>
</div>
</footer>

</body></html>`;
}

// ═══════════════════════════════════════════════════════════════
// 2) IMMOBILIER — Iconic Properties (Provençal Heritage Editorial)
// Palette: cream #fcf8fa + dark #00000b + tan #fecb97
// Polices: EB Garamond + Inter
// ═══════════════════════════════════════════════════════════════

const PHOTOS_IMMO = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuDL5IhPmJfUexfU5DXFteaF_-Y2Mkf_0wNVl-AvfkWCtj3m9WAGaPIsAkTA5NMLaXlfM9VU6fxrXIQnkAekxckuF7cD21sV2KqQmRgN-NK9286La3Y8aSEalW-AFuFUZpjfegRC7xPErg_ob7uMSthdB00rFR5zsM6Y82MIsj7dmPCZJCIYbxu2854prWp7_EaZxVxcMr4o-ko_IX4SOZl9JKaWiwhKliOX7oZ1C6UTQhTHtr1jLeT5Psvk3ES-XbNzr0FVDktFPbQ",
  bien1: "https://lh3.googleusercontent.com/aida-public/AB6AXuBwLmeNfjjhTt_ksyklOItnzVdDAOFjy1knQHOfMPVOcbNoCtphHVqkTtQPoLbvXgWDewDFpvBpsPtcXuccdMjnwheNbm_9YwWVJpUmo_2fRg3mp4OIHtRDGUp3Jvq8QwfC4V84EgLla3HpHVRhFfKE1-y2Ca5RTjJj8BSDxspu6ypRgvlAGURzk-FUCPC8xTsuFfMXiMkadlireivXhg72N13qvNmYlEb8qgGYm6oiw8rpXCRwzqfLbSZ1F6oenLt1lRFAoQksMr4",
  bien2: "https://lh3.googleusercontent.com/aida-public/AB6AXuCMJPOisMBy2ZVOO-ITQ6Wv_L5rstB4F6B4-RICusAw9ekvek0UWsLnCPq-yBktVYKeXkzdmZcGiTHfFmaqvy_f-Mz9iD6Vm6BxZ-cjUCTSPmzHzK4vzRQ2TKSTZLjpCkjYZnho_Fv-jbCGxyMxMuEa6rddUlMSr6SJNMgESVvdeih_bC0KRNMp1JJtpQQF92ijCIdvQQeD0DLHfQCNqCczk-RrN14gdtRKKGAJbZa9g40rbUhV0lmRhADplQt9kr_BlxMLHHpLVEY",
  bien3: "https://lh3.googleusercontent.com/aida-public/AB6AXuBgVg4KpGkBauFQy9d0hXpMcVaK60I9o_5zRKRV0waLuEOumOwhrRiuhV_sjZXuhrX6WtQUTr6KoNTNHrrtj3w16WvV9f8v8kHSlbcrrF9HEOjJH6TAtwqjvkusXDchpYuTzwJzoR6Cs-_2Zy6XDMAw9kyiMZWZdWdI56QkIUzhItJG96gUPaSvaEnbY3pMkI66Imodtt6-PHn-SqxqzRNB_pLoo6KDXXYcJawAy0pAfnNcq6L2AjVngowYxn69BqYSHxnI42QYfww",
  quartier: "https://lh3.googleusercontent.com/aida-public/AB6AXuB6L2WBo1F-VCQi0qC8WwSHgxaAMHXwfnPRwcGbn8h8oQ-ZDPj-21NH8dRP05WUkN0EcLNZdH8-vPi4TDO9f6enVjp8YK4ZMf4H0H-eVmYQbumY-csEjBvTS1zbI0SJtMwPv77ds0FBfoDMAb8_vDodPfGAv9iwg0yJJCd1w2oDMHa0r9ug2VspBFJoQ5p6b5gdp4kRJT318A_5QBCAtruJ-bJL_lxA-MhIObrhSNmmIBTB1EtXBlshwCs6D4wVaZf0FAmApcR0VFc",
};

export function renderStitchImmobilier(prospect: P, copy: C): string {
  const city = prospect.city || "Aix-en-Provence";
  const phoneClean = (prospect.phone || "").replace(/\s/g, "");
  const hoursList = parseHours(prospect.hours);
  const reviewsList = prospect.reviews && prospect.reviews.length >= 2
    ? prospect.reviews.slice(0, 3)
    : copy.testimonials.slice(0, 3).map(t => ({ author: t.author, rating: 5, text: t.quote }));

  return `<!DOCTYPE html>
<html class="light" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${esc(prospect.name)} | Agence immobilière ${esc(city)}</title>
<meta name="description" content="${esc(copy.footer_tagline)}"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400..800&amp;family=Inter:wght@100..900&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style>
  .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24; }
  body { background-color: #fcf8fa; }
</style>
<script id="tailwind-config">
  tailwind.config = { darkMode: "class", theme: { extend: {
    colors: {
      "primary": "#00000b", "primary-container": "#1a1a2e",
      "on-primary": "#ffffff",
      "secondary": "#7c572d", "secondary-container": "#fecb97",
      "on-secondary-container": "#79542a",
      "surface": "#fcf8fa", "surface-bright": "#fcf8fa",
      "surface-container": "#f1edef", "surface-container-lowest": "#ffffff",
      "surface-container-low": "#f6f2f4", "surface-container-high": "#ebe7e9",
      "background": "#fcf8fa", "on-background": "#1c1b1d",
      "on-surface": "#1c1b1d", "on-surface-variant": "#47464c",
      "outline": "#78767d", "outline-variant": "#c8c5cd",
      "inverse-primary": "#c6c4df"
    },
    borderRadius: { DEFAULT: "0", lg: "0.25rem", xl: "0.5rem", full: "9999px" },
    spacing: { gutter: "24px", "container-max": "1200px",
               "margin-desktop": "80px", "section-gap": "120px" },
    fontFamily: {
      "display-lg": ["EB Garamond"], "display-lg-mobile": ["EB Garamond"],
      "headline-lg": ["EB Garamond"], "headline-md": ["EB Garamond"],
      "body-lg": ["Inter"], "body-md": ["Inter"],
      "label-lg": ["Inter"], "label-sm": ["Inter"]
    },
    fontSize: {
      "display-lg": ["64px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "400" }],
      "display-lg-mobile": ["40px", { lineHeight: "1.2", fontWeight: "400" }],
      "headline-lg": ["36px", { lineHeight: "1.3", fontWeight: "400" }],
      "headline-md": ["28px", { lineHeight: "1.4", fontWeight: "400" }],
      "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
      "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
      "label-lg": ["14px", { lineHeight: "1.2", letterSpacing: "0.1em", fontWeight: "600" }],
      "label-sm": ["12px", { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "500" }]
    }
  } } }
</script>
</head>
<body class="bg-background text-on-background font-body-md">

<header class="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/30">
<div class="max-w-container-max mx-auto px-gutter h-24 flex items-center justify-between">
<div class="font-display-lg text-2xl text-primary tracking-tight">${esc(prospect.name)}</div>
<nav class="hidden md:flex items-center gap-8">
<a class="font-label-lg text-on-surface-variant hover:text-primary uppercase" href="#biens">Biens</a>
<a class="font-label-lg text-on-surface-variant hover:text-primary uppercase" href="#quartiers">Quartiers</a>
<a class="font-label-lg text-on-surface-variant hover:text-primary uppercase" href="#equipe">L'équipe</a>
<a class="font-label-lg text-on-surface-variant hover:text-primary uppercase" href="#estimation">Estimation</a>
</nav>
<a href="${phoneClean ? `tel:${phoneClean}` : "#estimation"}" class="bg-primary text-on-primary px-6 py-3 font-label-lg uppercase hover:bg-secondary-container hover:text-primary transition-all">
${esc(copy.cta_primary).toUpperCase()}
</a>
</div>
</header>

<main class="pt-24">

<!-- Hero fullbleed -->
<section class="relative h-screen min-h-[700px] overflow-hidden bg-primary">
<div class="absolute inset-0">
<img class="w-full h-full object-cover opacity-65" src="${PHOTOS_IMMO.hero}" alt="${esc(prospect.name)}"/>
<div class="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent"></div>
</div>
<div class="relative z-10 h-full flex items-center">
<div class="max-w-container-max mx-auto px-gutter w-full">
<div class="max-w-3xl">
<span class="font-label-lg text-secondary-container uppercase tracking-[0.2em]">${esc(copy.hero_caps)}</span>
<h1 class="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-primary mt-8 mb-8">${esc(copy.hero_title)}</h1>
<p class="font-body-lg text-on-primary/85 italic mb-12 max-w-2xl">${esc(copy.hero_subtitle)}</p>
<div class="flex gap-4 flex-wrap">
<a href="#biens" class="bg-secondary-container text-on-secondary-container px-8 py-4 font-label-lg uppercase hover:bg-on-primary transition-all">${esc(copy.cta_primary).toUpperCase()}</a>
<a href="#estimation" class="border border-on-primary text-on-primary px-8 py-4 font-label-lg uppercase hover:bg-on-primary hover:text-primary transition-all">${esc(copy.cta_secondary).toUpperCase()}</a>
</div>
</div>
</div>
</div>
</section>

<!-- Biens d'exception -->
<section id="biens" class="py-section-gap">
<div class="max-w-container-max mx-auto px-gutter">
<div class="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
<div>
<span class="font-label-lg text-secondary uppercase tracking-[0.2em]">Sélection signée</span>
<h2 class="font-headline-lg text-headline-lg text-primary mt-4">${esc(copy.savoir_faire_title)}</h2>
</div>
<p class="font-body-md text-on-surface-variant max-w-sm md:text-right">${esc(copy.savoir_faire_subtitle)}</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
${[
  { img: PHOTOS_IMMO.bien1, title: copy.savoir_faire_cards[0]?.title || "Villa contemporaine", price: "Sur demande", typeLabel: "VILLA" },
  { img: PHOTOS_IMMO.bien2, title: copy.savoir_faire_cards[1]?.title || "Mas provençal", price: "Sur demande", typeLabel: "MAS" },
  { img: PHOTOS_IMMO.bien3, title: copy.savoir_faire_cards[2]?.title || "Appartement de prestige", price: "Sur demande", typeLabel: "APPT." },
].map(b => `
<a href="#estimation" class="group cursor-pointer block">
<div class="overflow-hidden aspect-[4/5] mb-6 relative">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="${b.img}" alt="${esc(b.title)}"/>
<span class="absolute top-4 left-4 bg-surface text-primary px-3 py-1 font-label-sm uppercase">${b.typeLabel}</span>
</div>
<h3 class="font-headline-md text-headline-md text-primary mb-2">${esc(b.title)}</h3>
<div class="flex items-center justify-between">
<span class="font-label-lg text-secondary uppercase">${esc(b.price)}</span>
<span class="material-symbols-outlined text-on-surface-variant group-hover:translate-x-1 transition-transform">arrow_forward</span>
</div>
</a>`).join("")}
</div>
</div>
</section>

<!-- Notre Maison + Quartiers -->
<section id="quartiers" class="py-section-gap bg-surface-container-low">
<div class="max-w-container-max mx-auto px-gutter">
<div class="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
<div class="aspect-[4/5]"><img class="w-full h-full object-cover" src="${PHOTOS_IMMO.quartier}" alt="${esc(city)}"/></div>
<div>
<span class="font-label-lg text-secondary uppercase tracking-[0.2em]">Notre Maison</span>
<h2 class="font-headline-lg text-headline-lg text-primary mt-4 mb-6">${esc(copy.univers_title)}</h2>
<p class="font-body-lg text-on-surface-variant mb-6 leading-relaxed">${esc(copy.univers_paragraph1)}</p>
<p class="font-body-md text-on-surface-variant mb-8">${esc(copy.univers_paragraph2)}</p>
<div class="grid grid-cols-2 gap-6 pt-6 border-t border-outline-variant/30">
<div>
<div class="font-display-lg-mobile text-3xl text-primary">${prospect.google_rating ? prospect.google_rating.toFixed(1) : "5,0"}</div>
<div class="flex text-secondary mt-1">${starsHtml(prospect.google_rating)}</div>
<div class="font-label-sm text-on-surface-variant uppercase mt-1">${prospect.google_reviews_count || ""} avis Google</div>
</div>
<div class="border-l border-outline-variant/30 pl-6">
<div class="font-display-lg-mobile text-3xl text-primary">${esc(city)}</div>
<div class="font-label-sm text-on-surface-variant uppercase mt-1">Notre territoire</div>
</div>
</div>
</div>
</div>
</div>
</section>

<!-- Témoignages -->
<section class="py-section-gap">
<div class="max-w-4xl mx-auto px-gutter text-center">
<span class="font-label-lg text-secondary uppercase tracking-[0.2em]">Témoignages clients</span>
<div class="mt-12 space-y-12">
${reviewsList.map((r, i) => `
<blockquote>
<div class="flex justify-center gap-1 text-secondary-container mb-6">${starsHtml(("rating" in r ? (r as any).rating : 5) as number)}</div>
<p class="font-headline-md text-headline-md italic text-primary leading-relaxed">"${esc((r as any).text || (r as any).quote)}"</p>
<cite class="font-label-lg not-italic text-secondary mt-4 block uppercase">— ${esc((r as any).author).toUpperCase()}</cite>
</blockquote>
${i < reviewsList.length - 1 ? '<div class="w-12 h-px bg-outline-variant mx-auto"></div>' : ""}
`).join("")}
</div>
</div>
</section>

<!-- Estimation -->
<section id="estimation" class="py-section-gap bg-primary text-on-primary">
<div class="max-w-container-max mx-auto px-gutter text-center">
<span class="font-label-lg text-secondary-container uppercase tracking-[0.2em]">Estimation</span>
<h2 class="font-headline-lg text-headline-lg text-on-primary mt-4 mb-6">${esc(copy.cta_final_title)}</h2>
<p class="font-body-lg text-on-primary/80 max-w-2xl mx-auto mb-12">${esc(copy.cta_final_paragraph)}</p>
<a href="${phoneClean ? `tel:${phoneClean}` : "#"}" class="inline-block bg-secondary-container text-on-secondary-container px-12 py-5 font-label-lg uppercase hover:bg-on-primary transition-all">${esc(copy.cta_final_button).toUpperCase()}</a>
${prospect.phone ? `<p class="mt-6 font-headline-md text-headline-md text-secondary-container">${esc(prospect.phone)}</p>` : ""}
${prospect.address ? `<p class="mt-2 font-body-md text-on-primary/70">${esc(prospect.address)}</p>` : ""}
${hoursList ? `<div class="mt-8 max-w-md mx-auto"><ul class="space-y-2">${hoursList.map(h => `<li class="flex justify-between font-body-md text-on-primary/80"><span>${esc(h.day)}</span><span>${esc(h.hours)}</span></li>`).join("")}</ul></div>` : ""}
</div>
</section>

</main>

<footer class="bg-primary text-on-primary border-t border-secondary-container/30">
<div class="max-w-container-max mx-auto px-gutter py-12">
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
<div>
<div class="font-display-lg-mobile text-2xl text-secondary-container mb-4">${esc(prospect.name)}</div>
<p class="font-body-md opacity-70">${esc(copy.footer_tagline)}</p>
</div>
<div>
<div class="font-label-lg uppercase text-secondary-container mb-4">Contact</div>
${prospect.address ? `<p class="font-body-md opacity-70 mb-2">${esc(prospect.address)}</p>` : ""}
${prospect.phone ? `<a href="tel:${phoneClean}" class="font-body-md opacity-70 hover:opacity-100 block mb-2">${esc(prospect.phone)}</a>` : ""}
${prospect.email ? `<a href="mailto:${esc(prospect.email)}" class="font-body-md opacity-70 hover:opacity-100 block">${esc(prospect.email)}</a>` : ""}
</div>
<div>
<div class="font-label-lg uppercase text-secondary-container mb-4">Liens</div>
<a href="#biens" class="font-body-md opacity-70 hover:opacity-100 block mb-2">Biens d'exception</a>
<a href="#quartiers" class="font-body-md opacity-70 hover:opacity-100 block mb-2">Nos quartiers</a>
<a href="#estimation" class="font-body-md opacity-70 hover:opacity-100 block">Estimation</a>
</div>
</div>
<div class="mt-12 pt-6 border-t border-on-primary/10 text-center font-label-sm opacity-50 uppercase">
© ${new Date().getFullYear()} ${esc(prospect.name.toUpperCase())}
</div>
</div>
</footer>

</body></html>`;
}

// ═══════════════════════════════════════════════════════════════
// 3) FLEURISTE — Petals & Bloom (Botanical Vitality)
// Palette: ivoire #fff8f1 + magenta #b80049 + violet #6d4ea2 + gold #cda721
// Polices: Playfair Display + Plus Jakarta Sans
// ═══════════════════════════════════════════════════════════════

const PHOTOS_FLEUR = {
  hero: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXBZ1VzTou8BHyjIPEhCbTVypDVXumparT3tSb9gBHuAhF52kO9rBVAdnWSTelYYvsU8wE3uftCat9Byv6THDHKoONetiEBdOOX2gfzt-sm5KXVjqqSBloWTPJUVujbgAgbBn_2u1BOxv8K8X_SpJ-Ds9I-HJ-iorCDRKVDHkF42odoCvqqPEwNwpAeNuKjw-QRRE3AS8ODFVJ2zGr8o318-jthsoIiHsh9tyAMJ18K4A6UbbnR9blL5flhhuoj-mYlDjc2SHcTu8",
  collec1: "https://lh3.googleusercontent.com/aida-public/AB6AXuC9Pps6oVU3WSkYyuMjJLRrnw9fANSrIrs1bL083GmXzCk7vwlbq0osYWVvEx1Q34cj85-EaSsy9v-pGpknmsbhG7-YCABPWW_Cxcveo1s9clxq4jQi7kbyDYnMhIJaN48U_RvNh_ThoDYLllCgPg_hVuDI6mFtmLitOY86uBIsKHnyaVsAO7OW0oWPkFaz7yUhZTVjUjsZt1orl1ST3jEjhIuHLdgGhAdItWJSB82swW8SnLpeY_WuuUDgl7r2egcCO6T8TbJTxlQ",
  collec2: "https://lh3.googleusercontent.com/aida-public/AB6AXuCFQgLwHT0dnIsncoWOIwrN26R-qIQ8Pocm5YnFMHmf0VNOXL4uF7Z9gbX2CcDTxNY0BUFTMbFlLh55nltRdoboF5qIx-iuYxu_5hyI0nZ6arnhVF15XkROzBHkDJ77F0Bt4jjGnS2mV9LoWUK3Rx2qPTmd3mk2hhtLBk4fXpDIMaq_p6c58YI7gTu8cJszHYdblf42HlVnmZ0NEP1YAmbj4zDBQp9nJKVg1hgF1-nvUnus0ULgGN2GQXg-TjzR1bZFxrn-nrSmkbM",
  collec3: "https://lh3.googleusercontent.com/aida-public/AB6AXuAi1mw2WbcQUKwM-I1xFPdlwWEmrCUOpR7soW-IPTYV2M1Xv7IFGTXJ1_bLSuSp-aLseAAa-gxGNJ4iIQlbqTF_tj-2Y7yubjP1nmqnTxSvfTggKnNq_2LEApt4HRpocWyxyaUbwX5jDiiV1Xjpwwsn5DIDnCG7JXtuhC9siBsVOwK8ddeYfM0cIEa4Kj--jaJIWolcknuCb-CehSfbN_xiICM9fsW2WsU5d68pIPfsEL6Y3DNHEQg4r0xBEEGa2qU_o6DW0u0rjBs",
  atelier: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXccBQIOYN7yCWGhdCbmrb0vZYbEfbo3vYbeS56Q0m9OgG2NZo9G8a9aPxRjYcQ8ao9LvRlpRKWLosZ7ojid8ZxdiQ3iCDFyXadoaHOaGuVwhXixN2o7HdD0_obc8k7EaJhv0AT25bQ--OFbcZ1isfUgXP8TMdyFteioeiD_iQWWOmuZLHIFjm5kQe30DpOka2C7aB0NI27XwoioYP45iOQJBX1qkQgFYOhwH2Y2UPt0R9pH0pDOarqygej81bO3wX9TqYrZGtE48",
};

export function renderStitchFleuriste(prospect: P, copy: C): string {
  const city = prospect.city || "votre ville";
  const phoneClean = (prospect.phone || "").replace(/\s/g, "");
  const hoursList = parseHours(prospect.hours);
  const reviewsList = prospect.reviews && prospect.reviews.length >= 2
    ? prospect.reviews.slice(0, 3)
    : copy.testimonials.slice(0, 3).map(t => ({ author: t.author, rating: 5, text: t.quote }));

  return `<!DOCTYPE html>
<html class="light" lang="fr"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>${esc(prospect.name)} | Fleuriste ${esc(city)}</title>
<meta name="description" content="${esc(copy.footer_tagline)}"/>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&amp;family=Plus+Jakarta+Sans:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<style>
  .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
  body { background-color: #fff8f1; }
</style>
<script id="tailwind-config">
  tailwind.config = { darkMode: "class", theme: { extend: {
    colors: {
      "primary": "#b80049", "primary-container": "#e2165f",
      "on-primary": "#ffffff", "on-primary-container": "#fffbff",
      "secondary": "#6d4ea2", "secondary-container": "#c5a3ff",
      "tertiary": "#735c00", "tertiary-container": "#cda721",
      "surface": "#fff8f1", "surface-bright": "#fff8f1",
      "surface-container": "#f6edde", "surface-container-lowest": "#ffffff",
      "surface-container-low": "#fcf2e4", "surface-container-high": "#f0e7d9",
      "background": "#fff8f1", "on-background": "#1f1b13",
      "on-surface": "#1f1b13", "on-surface-variant": "#5b3f43",
      "outline": "#8f6f73", "outline-variant": "#e4bdc2",
      "inverse-primary": "#ffb2be"
    },
    borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", "2xl": "1rem", full: "9999px" },
    spacing: { gutter: "24px", "container-max": "1280px",
               "margin-desktop": "64px", "stack-lg": "48px" },
    fontFamily: {
      "display-lg": ["Playfair Display"], "display-lg-mobile": ["Playfair Display"],
      "headline-lg": ["Playfair Display"], "headline-md": ["Playfair Display"],
      "body-lg": ["Plus Jakarta Sans"], "body-md": ["Plus Jakarta Sans"],
      "label-md": ["Plus Jakarta Sans"]
    },
    fontSize: {
      "display-lg": ["48px", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
      "display-lg-mobile": ["36px", { lineHeight: "1.2", fontWeight: "700" }],
      "headline-lg": ["32px", { lineHeight: "1.3", fontWeight: "600" }],
      "headline-md": ["24px", { lineHeight: "1.3", fontWeight: "600" }],
      "body-lg": ["18px", { lineHeight: "1.6", fontWeight: "400" }],
      "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
      "label-md": ["14px", { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "600" }]
    }
  } } }
</script>
</head>
<body class="bg-background text-on-background font-body-md">

<header class="fixed top-0 left-0 right-0 z-50 bg-surface/95 backdrop-blur-sm border-b border-outline-variant/30">
<div class="max-w-container-max mx-auto px-gutter h-20 flex items-center justify-between">
<div class="font-display-lg text-2xl text-primary">${esc(prospect.name)}</div>
<nav class="hidden md:flex items-center gap-8">
<a class="font-label-md text-on-surface-variant hover:text-primary uppercase" href="#collections">Collections</a>
<a class="font-label-md text-on-surface-variant hover:text-primary uppercase" href="#atelier">Atelier</a>
<a class="font-label-md text-on-surface-variant hover:text-primary uppercase" href="#mariage">Mariage</a>
<a class="font-label-md text-on-surface-variant hover:text-primary uppercase" href="#contact">Contact</a>
</nav>
<a href="${phoneClean ? `tel:${phoneClean}` : "#contact"}" class="bg-primary text-on-primary px-6 py-3 rounded-full font-label-md uppercase hover:bg-primary-container transition-all">
${esc(copy.cta_primary).toUpperCase()}
</a>
</div>
</header>

<main class="pt-20">

<!-- Hero magenta vibrant -->
<section class="relative min-h-[700px] flex items-center bg-primary overflow-hidden">
<div class="absolute inset-0 opacity-50">
<img class="w-full h-full object-cover" src="${PHOTOS_FLEUR.hero}" alt="${esc(prospect.name)}"/>
</div>
<div class="absolute inset-0 bg-gradient-to-r from-primary via-primary/50 to-transparent"></div>
<div class="relative z-10 max-w-container-max mx-auto px-gutter w-full py-20">
<div class="max-w-2xl">
<span class="font-label-md text-tertiary-container uppercase tracking-[0.3em]">${esc(copy.hero_caps)}</span>
<h1 class="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-on-primary mt-6 mb-6">${esc(copy.hero_title)}</h1>
<p class="font-body-lg text-on-primary/90 italic mb-10 max-w-xl">${esc(copy.hero_subtitle)}</p>
<div class="flex gap-4 flex-wrap">
<a href="#collections" class="bg-tertiary-container text-on-background px-8 py-4 rounded-full font-label-md uppercase hover:bg-on-primary transition-all">${esc(copy.cta_primary).toUpperCase()}</a>
<a href="#atelier" class="border border-on-primary text-on-primary px-8 py-4 rounded-full font-label-md uppercase hover:bg-on-primary hover:text-primary transition-all">${esc(copy.cta_secondary).toUpperCase()}</a>
</div>
</div>
</div>
</section>

<!-- Collections de saison -->
<section id="collections" class="py-24">
<div class="max-w-container-max mx-auto px-gutter">
<div class="text-center mb-16">
<span class="font-label-md text-tertiary uppercase tracking-[0.3em]">Collections de saison</span>
<h2 class="font-headline-lg text-headline-lg text-primary mt-4">${esc(copy.savoir_faire_title)}</h2>
<p class="font-body-md text-on-surface-variant max-w-xl mx-auto mt-4">${esc(copy.savoir_faire_subtitle)}</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
${[
  { img: PHOTOS_FLEUR.collec1, title: copy.savoir_faire_cards[0]?.title || "Collection signature" },
  { img: PHOTOS_FLEUR.collec2, title: copy.savoir_faire_cards[1]?.title || "Bouquets de saison" },
  { img: PHOTOS_FLEUR.collec3, title: copy.savoir_faire_cards[2]?.title || "Compositions sur-mesure" },
].map((c, i) => `
<a class="group cursor-pointer block" href="#contact">
<div class="overflow-hidden aspect-[4/5] rounded-xl mb-4 relative">
<img class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" src="${c.img}" alt="${esc(c.title)}"/>
<div class="absolute inset-0 bg-primary/0 group-hover:bg-primary/15 transition-colors duration-500"></div>
</div>
<h3 class="font-headline-md text-headline-md text-primary mb-2">${esc(c.title)}</h3>
<p class="font-body-md text-on-surface-variant">${esc(copy.savoir_faire_cards[i]?.body || "")}</p>
</a>`).join("")}
</div>
</div>
</section>

<!-- Atelier / Univers -->
<section id="atelier" class="py-24 bg-surface-container-low">
<div class="max-w-container-max mx-auto px-gutter">
<div class="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
<div class="aspect-square rounded-2xl overflow-hidden">
<img class="w-full h-full object-cover" src="${PHOTOS_FLEUR.atelier}" alt="${esc(copy.univers_title)}"/>
</div>
<div>
<span class="font-label-md text-tertiary uppercase tracking-[0.3em]">Notre Atelier</span>
<h2 class="font-headline-lg text-headline-lg text-primary mt-4 mb-6">${esc(copy.univers_title)}</h2>
<p class="font-body-lg text-on-surface-variant mb-4 leading-relaxed">${esc(copy.univers_paragraph1)}</p>
<p class="font-body-md text-on-surface-variant mb-8">${esc(copy.univers_paragraph2)}</p>
<div class="flex gap-8 pt-6 border-t border-outline-variant/30">
<div>
<div class="font-display-lg-mobile text-3xl text-primary">${prospect.google_rating ? prospect.google_rating.toFixed(1) : "5,0"}/5</div>
<div class="flex text-tertiary-container mt-1">${starsHtml(prospect.google_rating)}</div>
<div class="font-label-md text-on-surface-variant uppercase mt-1">${prospect.google_reviews_count || ""} avis</div>
</div>
<div class="border-l border-outline-variant/30 pl-8">
<div class="font-display-lg-mobile text-3xl text-primary">${esc(city)}</div>
<div class="font-label-md text-on-surface-variant uppercase mt-1">Notre boutique</div>
</div>
</div>
</div>
</div>
</div>
</section>

<!-- Témoignages -->
<section class="py-24">
<div class="max-w-4xl mx-auto px-gutter text-center">
<span class="font-label-md text-tertiary uppercase tracking-[0.3em]">Témoignages</span>
<div class="mt-12 space-y-12">
${reviewsList.map((r, i) => `
<blockquote>
<div class="flex justify-center gap-1 text-tertiary-container mb-6">${starsHtml(("rating" in r ? (r as any).rating : 5) as number)}</div>
<p class="font-headline-md text-headline-md italic text-primary leading-relaxed">"${esc((r as any).text || (r as any).quote)}"</p>
<cite class="font-label-md not-italic text-secondary mt-4 block uppercase">— ${esc((r as any).author).toUpperCase()}</cite>
</blockquote>
${i < reviewsList.length - 1 ? '<div class="w-12 h-px bg-outline-variant mx-auto"></div>' : ""}
`).join("")}
</div>
</div>
</section>

<!-- CTA Mariage -->
<section id="mariage" class="py-24 bg-primary text-on-primary text-center">
<div class="max-w-3xl mx-auto px-gutter">
<span class="material-symbols-outlined text-tertiary-container text-5xl mb-6">local_florist</span>
<h2 class="font-headline-lg text-headline-lg text-on-primary mb-6">${esc(copy.cta_final_title)}</h2>
<p class="font-body-lg text-on-primary/85 mb-10">${esc(copy.cta_final_paragraph)}</p>
<a href="${phoneClean ? `tel:${phoneClean}` : "#contact"}" class="inline-block bg-tertiary-container text-on-background px-12 py-5 rounded-full font-label-md uppercase hover:bg-on-primary transition-all">${esc(copy.cta_final_button).toUpperCase()}</a>
</div>
</section>

<!-- Contact -->
<section id="contact" class="py-24">
<div class="max-w-container-max mx-auto px-gutter">
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
<div class="bg-surface-container-low p-8 rounded-2xl">
<span class="material-symbols-outlined text-3xl text-primary mb-4">place</span>
<h3 class="font-headline-md text-headline-md text-primary mb-3">Boutique</h3>
<p class="font-body-md">${prospect.address ? esc(prospect.address) : esc(city)}</p>
</div>
<div class="bg-surface-container-low p-8 rounded-2xl">
<span class="material-symbols-outlined text-3xl text-primary mb-4">schedule</span>
<h3 class="font-headline-md text-headline-md text-primary mb-3">Horaires</h3>
${hoursList
  ? `<ul class="space-y-2 font-body-md">${hoursList.map(h => `<li class="flex justify-between"><span>${esc(h.day)}</span><span class="${/ferm/i.test(h.hours) ? "text-on-surface-variant" : ""}">${esc(h.hours)}</span></li>`).join("")}</ul>`
  : `<p class="font-body-md text-on-surface-variant">Sur rendez-vous</p>`
}
</div>
<div class="bg-surface-container-low p-8 rounded-2xl">
<span class="material-symbols-outlined text-3xl text-primary mb-4">call</span>
<h3 class="font-headline-md text-headline-md text-primary mb-3">Contact</h3>
${prospect.phone ? `<a href="tel:${phoneClean}" class="font-body-md hover:text-primary block mb-2">${esc(prospect.phone)}</a>` : ""}
${prospect.email ? `<a href="mailto:${esc(prospect.email)}" class="font-body-md hover:text-primary block">${esc(prospect.email)}</a>` : ""}
</div>
</div>
</div>
</section>

</main>

<footer class="bg-primary text-on-primary border-t border-tertiary-container/30">
<div class="max-w-container-max mx-auto px-gutter py-12">
<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
<div>
<div class="font-display-lg-mobile text-2xl text-tertiary-container mb-4">${esc(prospect.name)}</div>
<p class="font-body-md opacity-80">${esc(copy.footer_tagline)}</p>
</div>
<div>
<div class="font-label-md uppercase text-tertiary-container mb-4">Contact</div>
${prospect.address ? `<p class="font-body-md opacity-80 mb-2">${esc(prospect.address)}</p>` : ""}
${prospect.phone ? `<a href="tel:${phoneClean}" class="font-body-md opacity-80 hover:opacity-100 block mb-2">${esc(prospect.phone)}</a>` : ""}
${prospect.email ? `<a href="mailto:${esc(prospect.email)}" class="font-body-md opacity-80 hover:opacity-100 block">${esc(prospect.email)}</a>` : ""}
</div>
<div>
<div class="font-label-md uppercase text-tertiary-container mb-4">Navigation</div>
<a href="#collections" class="font-body-md opacity-80 hover:opacity-100 block mb-2">Collections</a>
<a href="#atelier" class="font-body-md opacity-80 hover:opacity-100 block mb-2">Atelier</a>
<a href="#mariage" class="font-body-md opacity-80 hover:opacity-100 block">Mariage & Événements</a>
</div>
</div>
<div class="mt-12 pt-6 border-t border-on-primary/15 text-center font-label-md opacity-50 uppercase">
© ${new Date().getFullYear()} ${esc(prospect.name)}
</div>
</div>
</footer>

</body></html>`;
}

export type { P as StitchProProspect, C as StitchProCopy };
