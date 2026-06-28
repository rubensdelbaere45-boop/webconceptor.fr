/**
 * Template FLEURISTE PREMIUM — refonte épurée éditoriale.
 *
 * Univers boutique de luxe / éditorial magazine. Beaucoup d'espace blanc,
 * photos grand format, typo serif soignée, transitions lentes, palettes
 * douces (jamais saturées).
 *
 * 3 variants pickés via p.id.charCodeAt(0) % 3 :
 *   A "Blanc & Nature"  blanc cassé + vert sauge doux + terre brûlée
 *                       DM Serif Display + Inter (éditorial pur)
 *   B "Rose Poudré"     crème blush + rose poudré + or rosé mat
 *                       Cormorant Garamond italic + Manrope (féminin sophistiqué)
 *   C "Vert Argenté"    ivoire + vert eucalyptus + argent doux
 *                       Fraunces + Inter (moderne nature)
 *
 * Sections (réduites pour respirer) :
 *   - Header minimal (logo + 3 nav + 1 CTA discret)
 *   - Hero éditorial split (texte gauche + grosse photo droite Ken Burns lent)
 *   - 3 collections en grande grille avec hover lent
 *   - Section éditorial "À propos" full-width photo
 *   - Pour vos événements : 4 services typo-driven (pas d'icônes flashy)
 *   - Galerie pleine largeur 4 col, photos qui parlent
 *   - 3 témoignages en grille calme
 *   - Stats discrètes (3 chiffres clés)
 *   - Contact + Maps + horaires sobres
 *   - Modal formulaire simple
 *   - Sticky mobile : tel + WhatsApp
 */
import { getStockPhotosForMetier, getHeroPhotoForMetier } from "./stock-photos";

export type FleuristePremiumProspect = {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  hours?: string | null;
  business_type?: string | null;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  reviews?: Array<{ author?: string; rating?: number; text?: string; timeAgo?: string }> | null;
  about_scraped?: string | null;
  website_photos?: string[] | null;
  site_style_dna?: {
    logoUrl?: string | null;
    primaryColor?: string | null;
    accentColor?: string | null;
    allImages?: string[];
    heroImageUrl?: string | null;
  } | null;
};

const esc = (s: string | null | undefined): string =>
  (s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "F";
}

type Variant = {
  id: string;
  name: string;
  primary: string;   // couleur signature, jamais saturée
  accent: string;    // ton complémentaire discret
  bg: string;        // background page
  surface: string;   // background sections décalées
  fg: string;        // texte principal
  fgSoft: string;    // texte secondaire
  line: string;      // bordures fines
  fontHeading: string;
  fontBody: string;
  fontsImport: string;
  serifWeight: string; // 400/500 pour serif fin
};

const VARIANTS: Variant[] = [
  {
    id: "blanc-nature",
    name: "Blanc & Nature",
    primary: "#7a9b76",    // vert sauge doux
    accent: "#b08968",     // terre brûlée mate
    bg: "#fcfcfa",         // blanc cassé
    surface: "#f5f3ee",    // crème pâle
    fg: "#1a1a1a",
    fgSoft: "#6b6b6b",
    line: "#e8e6e0",
    fontHeading: "DM Serif Display",
    fontBody: "Inter",
    fontsImport: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap",
    serifWeight: "400",
  },
  {
    id: "rose-poudre",
    name: "Rose Poudré",
    primary: "#c89697",    // rose poudré mat (jamais flash)
    accent: "#b8956d",     // or rosé mat
    bg: "#fdf8f5",         // crème blush
    surface: "#f8eee8",    // pêche très pâle
    fg: "#2a1d1d",         // brun très foncé
    fgSoft: "#7a6868",
    line: "#ecd9d3",
    fontHeading: "Cormorant Garamond",
    fontBody: "Manrope",
    fontsImport: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Manrope:wght@300;400;500;600;700&display=swap",
    serifWeight: "500",
  },
  {
    id: "vert-argente",
    name: "Vert Argenté",
    primary: "#5e7c5e",    // vert eucalyptus
    accent: "#9a9590",     // argent doux mat
    bg: "#faf9f4",         // ivoire
    surface: "#f0ede5",    // ivoire profond
    fg: "#1f2421",
    fgSoft: "#6b6f6a",
    line: "#dcdcd2",
    fontHeading: "Fraunces",
    fontBody: "Inter",
    fontsImport: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;1,9..144,400&family=Inter:wght@300;400;500;600;700&display=swap",
    serifWeight: "400",
  },
];

function pickVariant(id: string): Variant {
  const idx = id ? id.charCodeAt(0) % VARIANTS.length : 0;
  return VARIANTS[idx];
}

function buildHoursTable(hoursStr: string | null | undefined, v: Variant): string {
  const lines = (hoursStr || "").split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean);
  const rows = lines.length
    ? lines.map(line => {
        const m = line.match(/^([^:]+):\s*(.+)$/);
        if (!m) return [line, ""] as [string, string];
        return [m[1].trim(), m[2].trim()] as [string, string];
      })
    : [
        ["Mardi – Vendredi", "09:00 – 19:30"],
        ["Samedi", "09:00 – 19:00"],
        ["Dimanche", "09:00 – 13:00"],
        ["Lundi", "Fermé"],
      ] as [string, string][];
  return rows.map(([d, h]) => {
    const isClosed = /ferm[ée]/i.test(h);
    return `<tr class="border-b last:border-0" style="border-color:${v.line}">
      <td class="py-3.5 pr-6 text-sm">${esc(d)}</td>
      <td class="py-3.5 text-right text-sm ${isClosed ? "italic" : ""}" style="color:${isClosed ? v.fgSoft : v.fg}">${esc(h)}</td>
    </tr>`;
  }).join("");
}

function pickHeroImage(p: FleuristePremiumProspect): string {
  const dna = p.site_style_dna || {};
  if (dna.heroImageUrl && dna.heroImageUrl.startsWith("http")) return dna.heroImageUrl;
  const photos = (p.website_photos || []).filter(u => typeof u === "string" && u.startsWith("http"));
  if (photos.length) return photos[0];
  const dnaImgs = (dna.allImages || []).filter(u => u.startsWith("http"));
  if (dnaImgs.length) return dnaImgs[0];
  return getHeroPhotoForMetier("fleuriste");
}

function pickGallery(p: FleuristePremiumProspect, n: number): string[] {
  const dna = p.site_style_dna || {};
  const sources = [
    ...(p.website_photos || []).filter(u => typeof u === "string" && u.startsWith("http")),
    ...((dna.allImages || []).filter(u => u.startsWith("http"))),
  ];
  const uniq = Array.from(new Set(sources)).slice(0, n);
  if (uniq.length >= n) return uniq;
  const fillers = getStockPhotosForMetier("fleuriste", n - uniq.length);
  return [...uniq, ...fillers].slice(0, n);
}

/** 3 collections "éditoriales" — moins, mais avec présence. */
function collections(): Array<{ title: string; subtitle: string; note: string; image: string }> {
  const stock = getStockPhotosForMetier("fleuriste", 5);
  return [
    {
      title: "Bouquets du jour",
      subtitle: "Au gré du marché",
      note: "Composé chaque matin avec les fleurs reçues du producteur. Jamais le même bouquet deux jours de suite.",
      image: stock[0] || "",
    },
    {
      title: "Mariages & cérémonies",
      subtitle: "Sur-mesure",
      note: "Bouquet de mariée, boutonnières, centres de table, arches florales. Devis personnalisé en 48h.",
      image: stock[1] || "",
    },
    {
      title: "Abonnement bureaux",
      subtitle: "Hebdomadaire",
      note: "Renouvellement chaque semaine, formule clé en main, livraison incluse. À partir de 35 €/semaine.",
      image: stock[2] || "",
    },
  ];
}

export function generateFleuristePremiumMockupHtml(p: FleuristePremiumProspect): string {
  const v = pickVariant(p.id);
  const dna = p.site_style_dna || {};

  const primary = (dna.primaryColor && dna.primaryColor.startsWith("#")) ? dna.primaryColor : v.primary;
  const accent = (dna.accentColor && dna.accentColor.startsWith("#")) ? dna.accentColor : v.accent;

  const name = esc(p.name);
  const slug = esc(p.slug);
  const city = esc(p.city || "votre ville");
  const phoneDisplay = esc(p.phone || "");
  const phoneDigits = (p.phone || "").replace(/[^\d+]/g, "");
  const phoneLink = phoneDigits ? `tel:${phoneDigits.replace(/^0/, "+33")}` : "#contact";
  const addressDisplay = p.address ? esc(p.address) : `Boutique à ${city}`;

  const whatsappDigits = phoneDigits.replace(/\D/g, "").replace(/^0/, "33");
  const whatsappUrl = phoneDigits ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Bonjour, je souhaiterais commander un bouquet chez ${p.name}.`)}` : "";

  const mapsQuery = encodeURIComponent(`${p.address || p.name} ${p.city || ""}`);
  const mapsEmbedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const mapsLinkUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const heroImg = pickHeroImage(p);
  const gallery = pickGallery(p, 8);
  const cols = collections();

  const logoHtml = dna.logoUrl && dna.logoUrl.startsWith("http")
    ? `<img src="${esc(dna.logoUrl)}" alt="${name}" class="h-10 w-auto max-w-[140px] object-contain" onerror="this.style.display='none'"/>`
    : `<div class="w-10 h-10 rounded-full grid place-items-center font-medium text-sm" style="background:${primary};color:${v.bg};font-family:var(--font-heading);font-weight:${v.serifWeight}">${initials(p.name)}</div>`;

  const yearsExp = 8 + (p.id ? p.id.charCodeAt(0) % 18 : 0);
  const bouquetsLivres = 1200 + (p.id ? (p.id.charCodeAt(1) || 0) * 17 : 0);
  const ratingDisplay = p.google_rating ? p.google_rating.toFixed(1) : "4.9";
  const reviewsCount = p.google_reviews_count || 87 + (p.id ? p.id.charCodeAt(2) % 180 : 0);

  const aboutText = p.about_scraped
    ? esc(p.about_scraped.slice(0, 800))
    : `Depuis ${yearsExp} ans, ${name}${p.city ? ` à ${city}` : ""} compose des bouquets pensés comme une émotion juste. Fleurs reçues chaque matin de producteurs sélectionnés, savoir-faire artisanal, attention portée à chaque détail. Une boutique où l'on entre pour un cadeau, et d'où l'on repart avec une histoire.`;

  const reviews = (p.reviews || []).filter(r => r.text && r.text.length > 30).slice(0, 3);
  const fallbackReviews = [
    { author: "Camille D.", text: "Un bouquet absolument sublime pour l'anniversaire de ma maman. Le rendu dépassait mes attentes — composition fine, fleurs d'une fraîcheur remarquable. La boutique est un écrin.", rating: 5, timeAgo: "il y a 2 semaines" },
    { author: "Mathieu L.", text: "On leur a confié les fleurs de notre mariage. Du conseil à la livraison, tout a été d'une justesse rare. Le bouquet de mariée était une œuvre, les centres de table un enchantement.", rating: 5, timeAgo: "il y a 1 mois" },
    { author: "Sarah B.", text: "Ma fleuriste depuis trois ans. Toujours fraîche, toujours juste, jamais déçue. L'accueil est aussi soigné que les compositions. La référence.", rating: 5, timeAgo: "il y a 2 mois" },
  ];
  const reviewsToShow = reviews.length >= 2 ? reviews : fallbackReviews;

  const hoursHtml = buildHoursTable(p.hours, v);
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="${primary}">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>${name} — Fleuriste à ${city}</title>
<meta name="description" content="${name}, fleuriste à ${city}. Bouquets composés à la minute, mariages, abonnement bureaux. Fleurs reçues chaque matin de producteurs.">
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${v.fontsImport}" rel="stylesheet">
<style>
  :root {
    --primary: ${primary};
    --accent: ${accent};
    --bg: ${v.bg};
    --surface: ${v.surface};
    --fg: ${v.fg};
    --fg-soft: ${v.fgSoft};
    --line: ${v.line};
    --font-heading: "${v.fontHeading}", "EB Garamond", serif;
    --font-body: "${v.fontBody}", system-ui, sans-serif;
  }
  html, body { background: var(--bg); color: var(--fg); font-family: var(--font-body); font-weight: 400; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
  h1, h2, h3, h4 { font-family: var(--font-heading); font-weight: ${v.serifWeight}; letter-spacing: -0.015em; line-height: 1.1; }
  .serif { font-family: var(--font-heading); font-weight: ${v.serifWeight}; }
  .serif-italic { font-family: var(--font-heading); font-weight: ${v.serifWeight}; font-style: italic; }

  /* ─── Boutons (très sobres) ───────────────────── */
  .btn-primary {
    background: var(--fg); color: var(--bg);
    padding: 14px 28px;
    border-radius: 0;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    transition: background 0.4s ease, color 0.4s ease;
    border: 1px solid var(--fg);
    display: inline-flex; align-items: center; gap: 10px;
    text-decoration: none;
  }
  .btn-primary:hover { background: var(--primary); border-color: var(--primary); color: #fff; }

  .btn-ghost {
    background: transparent; color: var(--fg);
    padding: 14px 28px;
    border-radius: 0;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border: 1px solid var(--fg);
    transition: background 0.4s ease, color 0.4s ease;
    display: inline-flex; align-items: center; gap: 10px;
    text-decoration: none;
  }
  .btn-ghost:hover { background: var(--fg); color: var(--bg); }

  .btn-wa {
    background: transparent; color: var(--fg);
    padding: 14px 22px;
    border-radius: 0;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    border: 1px solid var(--line);
    transition: background 0.3s, border-color 0.3s, color 0.3s;
    display: inline-flex; align-items: center; gap: 8px;
    text-decoration: none;
  }
  .btn-wa:hover { background: #25D366; color: #fff; border-color: #25D366; }

  .link-arrow {
    display: inline-flex; align-items: center; gap: 8px;
    font-size: 13px; font-weight: 500;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--fg);
    text-decoration: none;
    border-bottom: 1px solid var(--fg);
    padding-bottom: 4px;
    transition: gap 0.3s, color 0.3s, border-color 0.3s;
  }
  .link-arrow:hover { gap: 14px; color: var(--primary); border-color: var(--primary); }

  /* ─── Cards : transition lente, hover subtil ───────────────────── */
  .collection-card { transition: transform 0.7s cubic-bezier(.2,.8,.2,1); }
  .collection-card img { transition: transform 1.2s cubic-bezier(.2,.8,.2,1); }
  .collection-card:hover img { transform: scale(1.04); }

  /* ─── Hero Ken Burns (très lent, presque imperceptible) ───────────────────── */
  @keyframes kenburns-slow {
    0% { transform: scale(1) translate(0,0); }
    50% { transform: scale(1.06) translate(-1%,-0.5%); }
    100% { transform: scale(1.02) translate(0.5%,0.5%); }
  }
  .kenburns-slow { animation: kenburns-slow 30s ease-in-out infinite alternate; }

  /* ─── Fade-in éditorial ───────────────────── */
  @keyframes editorial-up {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .reveal { opacity: 0; }
  .reveal.in { animation: editorial-up 1s cubic-bezier(.2,.8,.2,1) forwards; }

  /* ─── Galerie hover lent ───────────────────── */
  .gallery-img { transition: opacity 0.6s ease, transform 1.2s cubic-bezier(.2,.8,.2,1); cursor: pointer; }
  .gallery-img:hover { opacity: 0.85; transform: scale(1.025); }

  /* ─── Modal ───────────────────── */
  .modal-bg { background: rgba(20,20,20,0.55); backdrop-filter: blur(10px); padding-bottom: max(20px, env(safe-area-inset-bottom)); }
  @keyframes fade-up-modal {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .modal-content { animation: fade-up-modal 0.4s cubic-bezier(.2,.8,.2,1); }

  /* ─── Sticky FAB ───────────────────── */
  .sticky-fab {
    position: fixed; right: max(16px, env(safe-area-inset-right));
    z-index: 50;
    border-radius: 50%;
    display: grid; place-items: center;
    box-shadow: 0 6px 20px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.08);
    transition: transform 0.2s;
  }
  .sticky-fab:active { transform: scale(.92); }
  .sticky-fab:hover { transform: scale(1.06); }
  @media (min-width: 768px) { .sticky-fab { display: none; } }

  /* ─── Mobile tuning ───────────────────── */
  @media (max-width: 640px) {
    h1 { font-size: clamp(2.6rem, 12vw, 4rem) !important; line-height: 1.05 !important; }
    h2 { font-size: clamp(2rem, 8vw, 2.8rem) !important; }
    .btn-primary, .btn-ghost { padding: 13px 22px; font-size: 12px; width: 100%; justify-content: center; }
    .btn-wa { padding: 13px 22px; font-size: 12px; width: 100%; justify-content: center; }
  }

  @media (prefers-reduced-motion: reduce) {
    .kenburns-slow, .collection-card img { animation: none !important; transition: none !important; }
    .reveal { opacity: 1 !important; transform: none !important; }
  }
</style>
</head>
<body class="antialiased overflow-x-hidden">

<!-- ═══════════════════ HEADER MINIMAL ═══════════════════ -->
<header class="sticky top-0 z-40 border-b" style="background:${v.bg}f0;backdrop-filter:blur(20px);border-color:${v.line}">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between gap-6">
    <a href="#hero" class="flex items-center gap-3 min-w-0">
      ${logoHtml}
      <div class="min-w-0">
        <div class="serif text-base md:text-lg leading-none truncate">${name}</div>
        <div class="text-[10px] md:text-[11px] tracking-[0.2em] mt-1 uppercase truncate" style="color:${v.fgSoft}">Fleuriste · ${city}</div>
      </div>
    </a>
    <nav class="hidden md:flex items-center gap-9 text-[12px] uppercase tracking-[0.15em] font-medium">
      <a href="#collections" class="hover:opacity-60 transition-opacity">Collections</a>
      <a href="#evenements" class="hover:opacity-60 transition-opacity">Événements</a>
      <a href="#contact" class="hover:opacity-60 transition-opacity">Contact</a>
    </nav>
    <button onclick="kOpen('commander')" class="hidden sm:inline-flex link-arrow text-[11px]" style="border-color:${v.fg}">
      Commander
    </button>
  </div>
</header>

<!-- ═══════════════════ HERO ÉDITORIAL SPLIT ═══════════════════ -->
<section id="hero" class="relative overflow-hidden">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10 pt-14 md:pt-24 pb-16 md:pb-28 grid md:grid-cols-12 gap-10 md:gap-16 items-end">
    <!-- Texte gauche -->
    <div class="md:col-span-5 reveal">
      <div class="text-[11px] tracking-[0.25em] uppercase mb-6 md:mb-10" style="color:${v.fgSoft}">— Fleuriste artisan</div>
      <h1 class="text-[3.5rem] md:text-[5.5rem] leading-[1.02] mb-7" style="font-weight:${v.serifWeight}">
        L'émotion <span class="serif-italic" style="color:${primary}">en fleurs.</span>
      </h1>
      <p class="text-base md:text-lg leading-[1.7] mb-10 max-w-md" style="color:${v.fgSoft}">
        Compositions sur-mesure, mariages d'exception, abonnement bureaux. Fleurs reçues chaque matin chez des producteurs sélectionnés. Boutique à ${city} depuis ${yearsExp} ans.
      </p>
      <div class="flex flex-col sm:flex-row gap-3">
        <button onclick="kOpen('commander')" class="btn-primary">
          Commander un bouquet
          <span aria-hidden>→</span>
        </button>
        <button onclick="kOpen('mariage')" class="btn-ghost">Devis mariage</button>
      </div>
    </div>
    <!-- Photo droite — pleine hauteur -->
    <div class="md:col-span-7 reveal" style="animation-delay:.2s">
      <div class="relative aspect-[4/5] md:aspect-[3/4] overflow-hidden">
        <img src="${esc(heroImg)}" alt="${name}" class="kenburns-slow w-full h-full object-cover" loading="eager" onerror="this.style.display='none';this.parentElement.style.background='${v.surface}'"/>
      </div>
      <div class="flex items-center justify-between mt-5 text-[11px] tracking-[0.2em] uppercase" style="color:${v.fgSoft}">
        <span>${city}</span>
        <span class="flex items-center gap-2">
          <span style="color:${accent}">${"★".repeat(5)}</span>
          <span>${ratingDisplay}/5 · ${reviewsCount} avis</span>
        </span>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ COLLECTIONS ═══════════════════ -->
<section id="collections" class="py-20 md:py-32 border-t" style="border-color:${v.line}">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
      <div class="max-w-xl">
        <div class="text-[11px] tracking-[0.25em] uppercase mb-5" style="color:${v.fgSoft}">— Collections</div>
        <h2 class="text-4xl md:text-6xl" style="font-weight:${v.serifWeight}">
          Trois façons de <span class="serif-italic" style="color:${primary}">dire avec des fleurs.</span>
        </h2>
      </div>
      <p class="max-w-sm text-base leading-relaxed" style="color:${v.fgSoft}">
        Chaque création est composée à la main, à la commande. Aucune fleur ne reste plus de trois jours en boutique.
      </p>
    </div>
    <div class="grid md:grid-cols-3 gap-8 md:gap-10">
      ${cols.map((c, i) => `
      <article class="collection-card reveal" style="animation-delay:${0.1 + i * 0.15}s">
        <div class="aspect-[4/5] overflow-hidden mb-6" style="background:${v.surface}">
          <img src="${esc(c.image)}" alt="${esc(c.title)}" class="w-full h-full object-cover" loading="lazy" onerror="this.parentElement.style.background='${v.surface}'"/>
        </div>
        <div class="text-[11px] tracking-[0.2em] uppercase mb-3" style="color:${primary}">${esc(c.subtitle)}</div>
        <h3 class="text-2xl md:text-3xl mb-3" style="font-weight:${v.serifWeight}">${esc(c.title)}</h3>
        <p class="text-sm leading-[1.7] mb-5" style="color:${v.fgSoft}">${esc(c.note)}</p>
        <button onclick="kOpen('${esc(c.title)}')" class="link-arrow">
          Découvrir
          <span aria-hidden>→</span>
        </button>
      </article>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ À PROPOS — full-width photo ═══════════════════ -->
<section class="py-20 md:py-32" style="background:${v.surface}">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
    <div class="reveal">
      <div class="aspect-[4/5] overflow-hidden">
        <img src="${esc(gallery[4] || heroImg)}" alt="" class="w-full h-full object-cover" loading="lazy" onerror="this.style.display='none'"/>
      </div>
    </div>
    <div class="reveal" style="animation-delay:.15s">
      <div class="text-[11px] tracking-[0.25em] uppercase mb-5" style="color:${v.fgSoft}">— Notre atelier</div>
      <h2 class="text-4xl md:text-5xl mb-7" style="font-weight:${v.serifWeight}">
        Une boutique comme un <span class="serif-italic" style="color:${primary}">écrin.</span>
      </h2>
      <p class="text-base md:text-lg leading-[1.8] mb-7" style="color:${v.fgSoft}">${aboutText}</p>
      <div class="grid grid-cols-3 gap-6 pt-7 border-t" style="border-color:${v.line}">
        <div>
          <div class="text-3xl md:text-4xl mb-1 serif" style="color:${primary}">${yearsExp}</div>
          <div class="text-[10px] tracking-[0.2em] uppercase" style="color:${v.fgSoft}">années</div>
        </div>
        <div>
          <div class="text-3xl md:text-4xl mb-1 serif" style="color:${primary}">${bouquetsLivres}+</div>
          <div class="text-[10px] tracking-[0.2em] uppercase" style="color:${v.fgSoft}">bouquets livrés</div>
        </div>
        <div>
          <div class="text-3xl md:text-4xl mb-1 serif" style="color:${primary}">${ratingDisplay}<span class="text-xl">/5</span></div>
          <div class="text-[10px] tracking-[0.2em] uppercase" style="color:${v.fgSoft}">Google</div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ ÉVÉNEMENTS — typo-driven, pas d'icônes ═══════════════════ -->
<section id="evenements" class="py-20 md:py-32">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10">
    <div class="text-center max-w-xl mx-auto mb-14 md:mb-20">
      <div class="text-[11px] tracking-[0.25em] uppercase mb-5" style="color:${v.fgSoft}">— Sur-mesure</div>
      <h2 class="text-4xl md:text-5xl" style="font-weight:${v.serifWeight}">
        Pour vos <span class="serif-italic" style="color:${primary}">grands moments.</span>
      </h2>
    </div>
    <div class="grid md:grid-cols-2 gap-px" style="background:${v.line}">
      ${[
        { title: "Mariages", desc: "Bouquet de mariée, boutonnières, centres de table, cérémonie. Devis personnalisé sous 48 h.", modal: "mariage" },
        { title: "Deuil & sympathie", desc: "Couronnes, gerbes, raquettes, coussins florals. Livraison directe au funérarium.", modal: "deuil" },
        { title: "Abonnement bureaux", desc: "Composition renouvelée chaque semaine, formule clé en main. À partir de 35 €/semaine.", modal: "abonnement" },
        { title: "Cadeaux d'entreprise", desc: "Coffrets pour clients ou équipes. Livraison nationale, packaging premium.", modal: "cadeaux" },
      ].map(s => `
      <div class="p-10 md:p-14" style="background:${v.bg}">
        <h3 class="text-2xl md:text-3xl mb-4" style="font-weight:${v.serifWeight}">${s.title}</h3>
        <p class="text-base leading-[1.75] mb-7 max-w-sm" style="color:${v.fgSoft}">${s.desc}</p>
        <button onclick="kOpen('${s.modal}')" class="link-arrow">
          En savoir plus
          <span aria-hidden>→</span>
        </button>
      </div>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ GALERIE PLEINE LARGEUR ═══════════════════ -->
<section class="py-20 md:py-32 border-t" style="border-color:${v.line}">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10 mb-12 md:mb-16">
    <div class="flex items-end justify-between gap-6">
      <div>
        <div class="text-[11px] tracking-[0.25em] uppercase mb-5" style="color:${v.fgSoft}">— Notre boutique</div>
        <h2 class="text-4xl md:text-5xl" style="font-weight:${v.serifWeight}">En images.</h2>
      </div>
    </div>
  </div>
  <div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3 max-w-[1500px] mx-auto px-2 md:px-4">
    ${gallery.slice(0, Math.min(gallery.length, 8)).map(url => `
    <div class="aspect-square overflow-hidden" style="background:${v.surface}">
      <img src="${esc(url)}" alt="" class="gallery-img w-full h-full object-cover" loading="lazy" onerror="this.parentElement.style.display='none'"/>
    </div>`).join("")}
  </div>
</section>

<!-- ═══════════════════ TÉMOIGNAGES (3 cards calmes) ═══════════════════ -->
<section id="avis" class="py-20 md:py-32" style="background:${v.surface}">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10">
    <div class="text-center max-w-xl mx-auto mb-14 md:mb-20">
      <div class="text-[11px] tracking-[0.25em] uppercase mb-5" style="color:${v.fgSoft}">— Ils nous ont confié leurs émotions</div>
      <h2 class="text-4xl md:text-5xl mb-4" style="font-weight:${v.serifWeight}">
        <span style="color:${primary}">${ratingDisplay}</span>/5 sur ${reviewsCount} avis.
      </h2>
      <div class="text-xl tracking-widest" style="color:${accent}">${"★".repeat(5)}</div>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      ${reviewsToShow.map(r => `
      <figure class="reveal">
        <div class="text-3xl mb-5 serif" style="color:${primary}">"</div>
        <blockquote class="text-base md:text-lg leading-[1.8] mb-7 italic serif" style="color:${v.fg};font-weight:${v.serifWeight}">${esc((r.text || "").slice(0, 240))}${(r.text || "").length > 240 ? "…" : ""}</blockquote>
        <figcaption class="flex items-center gap-3 pt-5 border-t" style="border-color:${v.line}">
          <div class="w-10 h-10 rounded-full grid place-items-center font-medium text-xs serif" style="background:${primary};color:${v.bg};font-weight:${v.serifWeight}">${initials(r.author || "Client")}</div>
          <div>
            <div class="text-sm font-medium">${esc(r.author || "Client vérifié")}</div>
            <div class="text-[11px] tracking-[0.15em] uppercase" style="color:${v.fgSoft}">${esc(r.timeAgo || "récemment")}</div>
          </div>
        </figcaption>
      </figure>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ CONTACT + MAPS + HORAIRES ═══════════════════ -->
<section id="contact" class="py-20 md:py-32 border-t" style="border-color:${v.line}">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10">
    <div class="text-center mb-14 md:mb-20">
      <div class="text-[11px] tracking-[0.25em] uppercase mb-5" style="color:${v.fgSoft}">— Nous rendre visite</div>
      <h2 class="text-4xl md:text-5xl" style="font-weight:${v.serifWeight}">
        Passez en boutique <span class="serif-italic" style="color:${primary}">à ${city}.</span>
      </h2>
    </div>
    <div class="grid lg:grid-cols-2 gap-12 md:gap-16">
      <div>
        <div class="aspect-[4/3] overflow-hidden mb-8" style="background:${v.surface}">
          <iframe src="${mapsEmbedUrl}" width="100%" height="100%" style="border:0" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
        <a href="${mapsLinkUrl}" target="_blank" rel="noopener" class="link-arrow">
          Itinéraire vers ${name}
          <span aria-hidden>→</span>
        </a>
      </div>
      <div class="space-y-12">
        <div>
          <div class="text-[11px] tracking-[0.25em] uppercase mb-4" style="color:${v.fgSoft}">Adresse</div>
          <div class="serif text-xl md:text-2xl mb-1">${addressDisplay}</div>
          <div class="text-base" style="color:${v.fgSoft}">${city}</div>
        </div>
        ${phoneDisplay ? `<div>
          <div class="text-[11px] tracking-[0.25em] uppercase mb-4" style="color:${v.fgSoft}">Téléphone</div>
          <a href="${phoneLink}" class="serif text-3xl md:text-4xl hover:opacity-70 transition-opacity" style="color:${primary}">${phoneDisplay}</a>
        </div>` : ""}
        <div>
          <div class="text-[11px] tracking-[0.25em] uppercase mb-4" style="color:${v.fgSoft}">Horaires</div>
          <table class="w-full">${hoursHtml}</table>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <button onclick="kOpen('commander')" class="btn-primary">Commander un bouquet <span aria-hidden>→</span></button>
          ${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" rel="noopener" class="btn-wa">
            <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" aria-hidden><path d="M16 0C7.16 0 0 7.16 0 16c0 2.83.74 5.49 2.03 7.79L0 32l8.42-2.21A15.92 15.92 0 0 0 16 32c8.84 0 16-7.16 16-16S24.84 0 16 0zm7.42 19.39c-.4-.2-2.4-1.18-2.77-1.32-.37-.13-.64-.2-.91.2-.27.4-1.05 1.32-1.29 1.59-.24.27-.47.3-.87.1-.4-.2-1.7-.63-3.24-2-1.2-1.07-2-2.39-2.24-2.79-.24-.4-.03-.62.17-.82.18-.18.4-.47.6-.71.2-.24.27-.4.4-.67.13-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.69-.91-.7l-.78-.01c-.27 0-.71.1-1.08.5-.37.4-1.42 1.39-1.42 3.39 0 2 1.45 3.93 1.65 4.2.2.27 2.85 4.35 6.91 6.1.97.42 1.72.67 2.31.86.97.31 1.85.27 2.55.16.78-.12 2.4-.98 2.74-1.93.34-.94.34-1.75.24-1.92-.1-.17-.37-.27-.77-.47z"/></svg>
            WhatsApp
          </a>` : ""}
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ FOOTER ═══════════════════ -->
<footer class="py-12 md:py-16 pb-36 md:pb-16 border-t" style="border-color:${v.line}">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
    <div class="flex items-center gap-3">
      ${logoHtml}
      <div>
        <div class="serif text-base">${name}</div>
        <div class="text-[10px] tracking-[0.2em] uppercase mt-1" style="color:${v.fgSoft}">${city}${phoneDisplay ? ` · ${phoneDisplay}` : ""}</div>
      </div>
    </div>
    <div class="text-[10px] tracking-[0.15em] uppercase" style="color:${v.fgSoft}">
      © ${year} ${name} · Design <a href="https://klyora.fr" style="color:${primary};border-bottom:1px solid ${primary}">Klyora</a>
    </div>
  </div>
</footer>

<!-- ═══════════════════ MODAL — simple, élégant ═══════════════════ -->
<div id="k-modal" class="hidden fixed inset-0 z-50 items-end sm:items-center justify-center modal-bg p-0 sm:p-6 overflow-y-auto" onclick="if(event.target===this) kClose()">
  <div class="modal-content max-w-md w-full max-h-[92vh] overflow-y-auto relative" style="background:${v.bg};border-top:3px solid ${primary}">
    <button onclick="kClose()" class="absolute top-5 right-5 w-9 h-9 grid place-items-center hover:opacity-50 z-10" style="color:${v.fg}" aria-label="Fermer">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="p-8 sm:p-12">
      <div id="k-default-view">
        <div class="text-[11px] tracking-[0.25em] uppercase mb-4" style="color:${v.fgSoft}">— Demande</div>
        <h3 class="text-3xl md:text-4xl mb-3" style="font-weight:${v.serifWeight}">
          <span id="k-title">Commander un bouquet</span>
        </h3>
        <p class="text-sm leading-[1.7] mb-8" style="color:${v.fgSoft}">
          Laissez-nous quelques détails. Nous vous rappelons sous 24 h pour préciser ensemble la composition, la date et la livraison.
        </p>
        <form onsubmit="kSubmit(event)" class="space-y-4">
          <input type="text" id="k-name" placeholder="Votre nom" required class="w-full px-0 py-3.5 bg-transparent focus:outline-none text-base border-b" style="border-color:${v.line};color:${v.fg}">
          <input type="tel" id="k-phone" placeholder="Téléphone" required class="w-full px-0 py-3.5 bg-transparent focus:outline-none text-base border-b" style="border-color:${v.line};color:${v.fg}">
          <input type="email" id="k-email" placeholder="Email (facultatif)" class="w-full px-0 py-3.5 bg-transparent focus:outline-none text-base border-b" style="border-color:${v.line};color:${v.fg}">
          <textarea id="k-msg" rows="3" placeholder="Précisions (occasion, couleurs souhaitées, date, dédicace…)" class="w-full px-0 py-3.5 bg-transparent focus:outline-none text-base border-b resize-none" style="border-color:${v.line};color:${v.fg}"></textarea>
          <button type="submit" class="btn-primary w-full mt-4">Envoyer ma demande <span aria-hidden>→</span></button>
        </form>
      </div>
      <div id="k-success" class="hidden text-center py-6">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="${primary}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-6"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
        <h3 class="text-3xl mb-3" style="font-weight:${v.serifWeight}">Merci.</h3>
        <p class="text-sm leading-[1.7]" style="color:${v.fgSoft}">Nous vous rappelons sous 24 h pour préciser la composition.</p>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════ STICKY MOBILE FAB ═══════════════════ -->
${phoneDisplay ? `<a href="${phoneLink}" class="sticky-fab" style="bottom:calc(82px + env(safe-area-inset-bottom, 0px));width:54px;height:54px;background:${primary}" aria-label="Appeler">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
</a>` : ""}
${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" rel="noopener" class="sticky-fab" style="bottom:calc(18px + env(safe-area-inset-bottom, 0px));width:54px;height:54px;background:#25D366" aria-label="WhatsApp">
  <svg width="24" height="24" viewBox="0 0 32 32" fill="white" aria-hidden><path d="M16 0C7.16 0 0 7.16 0 16c0 2.83.74 5.49 2.03 7.79L0 32l8.42-2.21A15.92 15.92 0 0 0 16 32c8.84 0 16-7.16 16-16S24.84 0 16 0zm7.42 19.39c-.4-.2-2.4-1.18-2.77-1.32-.37-.13-.64-.2-.91.2-.27.4-1.05 1.32-1.29 1.59-.24.27-.47.3-.87.1-.4-.2-1.7-.63-3.24-2-1.2-1.07-2-2.39-2.24-2.79-.24-.4-.03-.62.17-.82.18-.18.4-.47.6-.71.2-.24.27-.4.4-.67.13-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.69-.91-.7l-.78-.01c-.27 0-.71.1-1.08.5-.37.4-1.42 1.39-1.42 3.39 0 2 1.45 3.93 1.65 4.2.2.27 2.85 4.35 6.91 6.1.97.42 1.72.67 2.31.86.97.31 1.85.27 2.55.16.78-.12 2.4-.98 2.74-1.93.34-.94.34-1.75.24-1.92-.1-.17-.37-.27-.77-.47z"/></svg>
</a>` : ""}

<script>
  /* ── Modal simple ── */
  function kOpen(kind){
    var t = { 'commander':'Commander un bouquet','mariage':'Devis mariage','deuil':'Composition deuil','abonnement':'Abonnement bureaux','cadeaux':"Cadeaux d'entreprise" };
    document.getElementById('k-title').textContent = t[kind] || 'Votre demande';
    document.getElementById('k-modal').classList.remove('hidden');
    document.getElementById('k-modal').classList.add('flex');
    document.getElementById('k-default-view').style.display = '';
    document.getElementById('k-success').classList.add('hidden');
    window.__kKind = kind;
  }
  function kClose(){
    document.getElementById('k-modal').classList.add('hidden');
    document.getElementById('k-modal').classList.remove('flex');
  }
  function kSubmit(e){
    e.preventDefault();
    fetch('/api/prospect/contact-request', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({
        slug: ${JSON.stringify(slug)},
        type: window.__kKind || 'commander',
        name: document.getElementById('k-name').value,
        phone: document.getElementById('k-phone').value,
        email: document.getElementById('k-email').value,
        message: document.getElementById('k-msg').value,
      }), keepalive: true
    }).catch(function(){});
    document.getElementById('k-default-view').style.display = 'none';
    document.getElementById('k-success').classList.remove('hidden');
    setTimeout(function(){ kClose(); }, 3500);
  }

  /* ── Reveal au scroll ── */
  (function(){
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  })();
</script>

</body>
</html>`;
}
