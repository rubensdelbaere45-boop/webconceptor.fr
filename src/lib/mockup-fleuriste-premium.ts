/**
 * Template FLEURISTE PREMIUM — inspiré "Les Filles Les Fleurs" (LFLF Bordeaux).
 *
 * Univers : artisanal bohème premium, storytelling personnel, palette douce,
 * photos lifestyle. + améliorations : Ken Burns hero, reveal au scroll,
 * galerie masonry asymétrique, typo serif éditoriale, storytelling
 * auto-personnalisé via DB.
 *
 * 3 variants pickés via p.id.charCodeAt(0) % 3 :
 *   A "Bohème Rose"        crème chaud + rose poudré mat + vert sauge
 *                          Cormorant Garamond italic + Manrope
 *   B "Atelier Botanique"  blanc cassé chaud + vert sauge profond + beige
 *                          Fraunces + Inter
 *   C "Paris Romantique"   cream chaud + presque noir + terre brûlée
 *                          DM Serif Display + Inter
 *
 * Sections (style LFLF + mieux) :
 *   - Bandeau horaires top (info pratique discrète)
 *   - Header sticky logo serif + nav + Commander
 *   - HERO plein écran : photo immense Ken Burns + headline italic overlay
 *     + 2 CTAs ghost + rating Google bas
 *   - Narratif "Une histoire de fleurs, de [ville]..." pleine largeur photo
 *   - 3 collections cards immenses (Bouquets / Mariage / Deuil)
 *   - "Pour vos événements" 4 services typo-driven (Mariage / Pro / Particulier / Carte cadeau)
 *   - Galerie MASONRY asymétrique (8-10 photos taillées différemment)
 *   - À propos éditorial : photo grande + storytelling
 *   - 3 témoignages guillemet serif géant
 *   - Contact + Maps + horaires
 *   - Footer 3 colonnes
 *   - Modal simple inputs underline
 *   - Sticky FAB mobile
 */
import { getStockPhotosForMetier, getHeroPhotoForMetier } from "./stock-photos";
import { buildBouquetComposer } from "./bouquet-composer";

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
  primary: string;
  accent: string;
  bg: string;
  surface: string;
  fg: string;
  fgSoft: string;
  line: string;
  fontHeading: string;
  fontBody: string;
  fontsImport: string;
  serifWeight: string;
};

const VARIANTS: Variant[] = [
  {
    id: "boheme-rose",
    name: "Bohème Rose",
    primary: "#c89697",    // rose poudré mat
    accent: "#87a96b",     // vert sauge (touche botanique)
    bg: "#fdfbf7",         // crème chaud
    surface: "#f7eee8",    // pêche poudré
    fg: "#2a2424",
    fgSoft: "#7a6868",
    line: "#ead9d0",
    fontHeading: "Cormorant Garamond",
    fontBody: "Manrope",
    fontsImport: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600&family=Manrope:wght@300;400;500;600;700&display=swap",
    serifWeight: "500",
  },
  {
    id: "atelier-botanique",
    name: "Atelier Botanique",
    primary: "#6b8e5a",    // vert sauge profond
    accent: "#c4a484",     // beige sable
    bg: "#fafaf7",         // blanc cassé chaud
    surface: "#eee9df",    // ivoire
    fg: "#1f2421",
    fgSoft: "#6b6f6a",
    line: "#d8d4c8",
    fontHeading: "Fraunces",
    fontBody: "Inter",
    fontsImport: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400;1,9..144,500&family=Inter:wght@300;400;500;600;700&display=swap",
    serifWeight: "500",
  },
  {
    id: "paris-romantique",
    name: "Paris Romantique",
    primary: "#1f1f1f",    // presque noir
    accent: "#b08968",     // terre brûlée mate
    bg: "#faf6f2",         // cream chaud
    surface: "#f0e8de",    // beige sable
    fg: "#1a1a1a",
    fgSoft: "#6e6e6e",
    line: "#e2d5c5",
    fontHeading: "DM Serif Display",
    fontBody: "Inter",
    fontsImport: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap",
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
        ["Mardi – Samedi", "10:00 – 19:00"],
        ["Dimanche", "10:00 – 13:00"],
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

function buildShortHours(hoursStr: string | null | undefined): string {
  const lines = (hoursStr || "").split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean);
  if (lines.length === 0) return "Mar – Sam 10h – 19h";
  const first = lines.find(l => !/ferm[ée]/i.test(l)) || lines[0];
  return first.replace(/^[^:]+:\s*/, "").slice(0, 30);
}

/** Skip URLs scrapées qui ne sont JAMAIS de belles photos : logos, icônes,
 * favicons, banners, panneaux "interdit"/stop, watermarks, captchas, etc. */
const BAD_IMAGE_PATTERNS = /\b(logo|icon|favicon|banner|sprite|pixel|tracker|placeholder|stop|interdit|forbidden|404|error|loading|spinner|watermark|captcha|btn|button|arrow|chevron|menu|burger|close|cross|x-mark|no-image|nophoto|default|avatar|profile)\b/i;
const BAD_IMAGE_EXTENSIONS = /\.(svg|gif|ico)(\?|$)/i;

function isLikelyBadImage(url: string): boolean {
  if (!url || !url.startsWith("http")) return true;
  if (BAD_IMAGE_PATTERNS.test(url)) return true;
  if (BAD_IMAGE_EXTENSIONS.test(url)) return true;
  // Petites images (size dans URL) = souvent logos/icones
  if (/[?&](w|width)=([1-9]\d?|1[0-9]{2})\b/i.test(url)) return true;
  return false;
}

/** Pour fleuriste : PRIVILÉGIE les stock photos curées (qualité garantie).
 * Le DNA scraping fleuriste donne 95% de photos foireuses (logos, panneaux,
 * banners). On préfère un beau stock photo qu'un truc à l'arrache. */
function pickHeroImage(p: FleuristePremiumProspect): string {
  // Stock photo curée TOUJOURS en priorité pour le hero fleuriste
  const stock = getStockPhotosForMetier("fleuriste", 15);
  // On choisit un index stable basé sur l'id du prospect (chaque prospect a
  // un hero différent, mais toujours le même pour ce prospect)
  const idx = p.id ? (p.id.charCodeAt(1) || 0) % stock.length : 0;
  return stock[idx] || getHeroPhotoForMetier("fleuriste");
}

function pickGallery(p: FleuristePremiumProspect, n: number): string[] {
  // Stock photos curées en priorité (15 dispo, on en prend n distinctes)
  const stock = getStockPhotosForMetier("fleuriste", 15);
  // Index de départ stable par prospect pour varier l'ordre entre prospects
  const offset = p.id ? (p.id.charCodeAt(2) || 0) % Math.max(1, stock.length - n) : 0;
  const rotated = [...stock.slice(offset), ...stock.slice(0, offset)];

  // Optionnel : on AJOUTE les images scrappées de qualité (filtrées) en bonus
  // si elles passent le filtre anti-shit
  const dna = p.site_style_dna || {};
  const scraped = [
    ...(p.website_photos || []).filter(u => typeof u === "string"),
    ...((dna.allImages || []) as string[]),
  ].filter(u => !isLikelyBadImage(u));

  // Mix : on prend 70% de stock curé + 30% de scrapé qualité (si présent)
  const stockCount = Math.ceil(n * 0.7);
  const scrapedCount = n - stockCount;
  const result = [
    ...rotated.slice(0, stockCount),
    ...scraped.slice(0, scrapedCount),
  ];
  // Si pas assez, complète avec stock
  while (result.length < n && rotated.length > result.length) {
    const next = rotated[result.length];
    if (next && !result.includes(next)) result.push(next);
    else break;
  }
  return Array.from(new Set(result)).slice(0, n);
}

/** 3 collections — style LFLF, photos grandes + texte court */
function collections(): Array<{ title: string; tagline: string; image: string; modal: string }> {
  const stock = getStockPhotosForMetier("fleuriste", 4);
  return [
    {
      title: "Bouquets du jour",
      tagline: "Composés à la minute, au gré du marché",
      image: stock[0] || "",
      modal: "bouquet",
    },
    {
      title: "Mariage",
      tagline: "Bouquet de mariée, cérémonie, centres de table",
      image: stock[1] || "",
      modal: "mariage",
    },
    {
      title: "Deuil & sympathie",
      tagline: "Couronnes, gerbes, raquettes — livraison directe",
      image: stock[2] || "",
      modal: "deuil",
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
  const gallery = pickGallery(p, 10);
  const cols = collections();

  const logoHtml = dna.logoUrl && dna.logoUrl.startsWith("http")
    ? `<img src="${esc(dna.logoUrl)}" alt="${name}" class="h-10 w-auto max-w-[160px] object-contain" onerror="this.style.display='none'"/>`
    : `<div class="serif text-2xl md:text-[26px] leading-none" style="color:${v.fg};font-style:italic">${name}</div>`;

  const yearsExp = 8 + (p.id ? p.id.charCodeAt(0) % 18 : 0);
  const bouquetsLivres = 1200 + (p.id ? (p.id.charCodeAt(1) || 0) * 17 : 0);
  const ratingDisplay = p.google_rating ? p.google_rating.toFixed(1) : "4.9";
  const reviewsCount = p.google_reviews_count || 87 + (p.id ? p.id.charCodeAt(2) % 180 : 0);
  const foundedYear = new Date().getFullYear() - yearsExp;
  const shortHours = buildShortHours(p.hours);

  const aboutTextLong = p.about_scraped
    ? esc(p.about_scraped.slice(0, 800))
    : `Une histoire de fleurs, de famille, et de passion. ${name} a ouvert ses portes en ${foundedYear} dans le quartier${p.city ? ` de ${city}` : ""}, avec une obsession simple : proposer chaque matin les plus belles fleurs reçues directement des producteurs.

Aujourd'hui, on compose toujours à la minute, on n'a jamais voulu industrialiser, on garde la même équipe, le même soin. Pour un anniversaire, un mariage, un deuil, un mardi sans raison. Le bouquet qu'on prépare est unique — comme l'émotion qu'il porte.`;

  const reviews = (p.reviews || []).filter(r => r.text && r.text.length > 30).slice(0, 3);
  const fallbackReviews = [
    { author: "Camille D.", text: "Un bouquet absolument sublime pour l'anniversaire de ma maman. La composition est délicate, fraîche, exactement comme je l'imaginais. La boutique est elle-même un écrin. Merci.", rating: 5, timeAgo: "il y a 2 semaines" },
    { author: "Mathieu L.", text: "On leur a confié les fleurs de notre mariage. Du conseil à la livraison, tout a été d'une justesse rare. Le bouquet de mariée était une œuvre, les centres de table un enchantement.", rating: 5, timeAgo: "il y a 1 mois" },
    { author: "Sarah B.", text: "Ma fleuriste depuis trois ans. Toujours fraîche, toujours juste, jamais déçue. Et l'accueil est aussi soigné que les compositions. La référence du quartier.", rating: 5, timeAgo: "il y a 2 mois" },
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
<meta name="description" content="${name}, fleuriste à ${city} depuis ${yearsExp} ans. Bouquets composés à la minute, mariages, abonnement bureaux. Fleurs reçues chaque matin des producteurs.">
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
  html, body { background: var(--bg); color: var(--fg); font-family: var(--font-body); font-weight: 400; -webkit-font-smoothing: antialiased; }
  h1, h2, h3, h4 { font-family: var(--font-heading); font-weight: ${v.serifWeight}; letter-spacing: -0.01em; line-height: 1.05; }
  .serif { font-family: var(--font-heading); font-weight: ${v.serifWeight}; }
  .serif-italic { font-family: var(--font-heading); font-weight: ${v.serifWeight}; font-style: italic; }
  .upper-thin { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 500; }

  /* ─── Boutons type LFLF (rounded doux, padding généreux) ───────────────────── */
  .btn-primary {
    background: var(--fg); color: var(--bg);
    padding: 14px 30px;
    border-radius: 999px;
    font-size: 13px; font-weight: 600;
    letter-spacing: 0.05em;
    border: 1px solid var(--fg);
    transition: background 0.3s, color 0.3s, transform 0.2s;
    display: inline-flex; align-items: center; gap: 10px;
    text-decoration: none;
    cursor: pointer;
  }
  .btn-primary:hover { background: transparent; color: var(--fg); transform: translateY(-1px); }
  .btn-ghost {
    background: transparent; color: var(--fg);
    padding: 14px 30px;
    border-radius: 999px;
    font-size: 13px; font-weight: 600;
    letter-spacing: 0.05em;
    border: 1px solid var(--fg);
    transition: background 0.3s, color 0.3s, transform 0.2s;
    display: inline-flex; align-items: center; gap: 10px;
    text-decoration: none;
    cursor: pointer;
  }
  .btn-ghost:hover { background: var(--fg); color: var(--bg); transform: translateY(-1px); }
  .btn-light {
    background: var(--bg); color: var(--fg);
    padding: 14px 30px;
    border-radius: 999px;
    font-size: 13px; font-weight: 600;
    letter-spacing: 0.05em;
    border: 1px solid transparent;
    transition: background 0.3s, color 0.3s, transform 0.2s;
    display: inline-flex; align-items: center; gap: 10px;
    text-decoration: none;
    cursor: pointer;
  }
  .btn-light:hover { transform: translateY(-1px); background: var(--surface); }

  .link-underline {
    display: inline-flex; align-items: center; gap: 10px;
    font-size: 13px; font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--fg);
    text-decoration: none;
    border-bottom: 1px solid var(--fg);
    padding-bottom: 4px;
    transition: gap 0.3s, color 0.3s, border-color 0.3s;
  }
  .link-underline:hover { gap: 16px; color: var(--primary); border-color: var(--primary); }

  /* ─── Hero Ken Burns lent ───────────────────── */
  @keyframes kenburns-slow {
    0% { transform: scale(1) translate(0,0); }
    50% { transform: scale(1.06) translate(-1%,-0.5%); }
    100% { transform: scale(1.02) translate(0.5%,0.5%); }
  }
  .kenburns-slow { animation: kenburns-slow 32s ease-in-out infinite alternate; }

  /* ─── Reveal au scroll éditorial ───────────────────── */
  @keyframes editorial-up {
    from { opacity: 0; transform: translateY(34px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .reveal { opacity: 0; }
  .reveal.in { animation: editorial-up 1.1s cubic-bezier(.2,.8,.2,1) forwards; }

  /* ─── Collection cards hover lent ───────────────────── */
  .col-card img { transition: transform 1.4s cubic-bezier(.2,.8,.2,1); }
  .col-card:hover img { transform: scale(1.05); }

  /* ─── Galerie masonry asymétrique ───────────────────── */
  .gallery-img { transition: opacity 0.5s ease, transform 1s cubic-bezier(.2,.8,.2,1); cursor: pointer; }
  .gallery-img:hover { opacity: 0.85; transform: scale(1.02); }

  /* ─── Modal ───────────────────── */
  .modal-bg { background: rgba(20,15,15,0.55); backdrop-filter: blur(10px); padding-bottom: max(20px, env(safe-area-inset-bottom)); }
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
    box-shadow: 0 8px 24px rgba(0,0,0,0.18), 0 2px 6px rgba(0,0,0,0.08);
    transition: transform 0.2s;
  }
  .sticky-fab:active { transform: scale(.92); }
  .sticky-fab:hover { transform: scale(1.07); }
  @media (min-width: 768px) { .sticky-fab { display: none; } }

  /* ─── Inputs underline ───────────────────── */
  .input-underline {
    width: 100%;
    padding: 14px 0;
    background: transparent;
    border: none;
    border-bottom: 1px solid var(--line);
    color: var(--fg);
    font-family: var(--font-body);
    font-size: 15px;
    outline: none;
    transition: border-color 0.25s;
  }
  .input-underline:focus { border-color: var(--fg); }
  .input-underline::placeholder { color: var(--fg-soft); opacity: 0.7; }

  /* ─── Top bandeau infos ───────────────────── */
  .top-banner {
    background: var(--surface);
    border-bottom: 1px solid var(--line);
    color: var(--fg);
  }

  /* ─── Mobile ───────────────────── */
  @media (max-width: 640px) {
    h1 { font-size: clamp(2.8rem, 13vw, 4.5rem) !important; line-height: 1.04 !important; }
    h2 { font-size: clamp(2rem, 8vw, 2.8rem) !important; }
    .btn-primary, .btn-ghost, .btn-light { padding: 13px 24px; font-size: 12px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .kenburns-slow, .col-card img, .gallery-img { animation: none !important; transition: none !important; }
    .reveal { opacity: 1 !important; transform: none !important; }
  }
</style>
</head>
<body class="antialiased overflow-x-hidden">

<!-- ═══════════════════ TOP BANDEAU INFOS ═══════════════════ -->
<div class="top-banner hidden md:block">
  <div class="max-w-[1400px] mx-auto px-6 md:px-10 py-2.5 flex items-center justify-between gap-6 text-[12px]">
    <div class="flex items-center gap-6">
      <span class="upper-thin">${shortHours}</span>
      ${addressDisplay !== `Boutique à ${city}` ? `<span style="color:${v.fgSoft}">${addressDisplay}</span>` : ""}
    </div>
    <div class="flex items-center gap-4">
      ${phoneDisplay ? `<a href="${phoneLink}" class="hover:opacity-60 transition-opacity">${phoneDisplay}</a>` : ""}
      ${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" rel="noopener" class="hover:opacity-60 transition-opacity">WhatsApp</a>` : ""}
    </div>
  </div>
</div>

<!-- ═══════════════════ HEADER STICKY ═══════════════════ -->
<header class="sticky top-0 z-40 border-b" style="background:${v.bg}f5;backdrop-filter:blur(16px);border-color:${v.line}">
  <div class="max-w-[1400px] mx-auto px-6 md:px-10 py-4 md:py-5 flex items-center justify-between gap-6">
    <a href="#hero" class="flex items-center gap-3 min-w-0">
      ${logoHtml}
    </a>
    <nav class="hidden lg:flex items-center gap-10 text-[12px] font-medium uppercase tracking-[0.15em]">
      <a href="#collections" class="hover:opacity-60 transition-opacity">Collections</a>
      <a href="#evenements" class="hover:opacity-60 transition-opacity">Événements</a>
      <a href="#galerie" class="hover:opacity-60 transition-opacity">Galerie</a>
      <a href="#contact" class="hover:opacity-60 transition-opacity">Contact</a>
    </nav>
    <button onclick="composerOpen()" class="btn-primary text-[12px] py-3 px-6 hidden sm:inline-flex">
      Commander
    </button>
    <button onclick="composerOpen()" class="btn-primary text-[12px] py-2.5 px-5 sm:hidden">
      Commander
    </button>
  </div>
</header>

<!-- ═══════════════════ HERO PLEIN ÉCRAN (style LFLF) ═══════════════════ -->
<section id="hero" class="relative overflow-hidden">
  <div class="relative h-[80vh] min-h-[600px] max-h-[900px] md:h-[88vh]">
    <img src="${esc(heroImg)}" alt="${name}" class="kenburns-slow absolute inset-0 w-full h-full object-cover" loading="eager" onerror="this.style.display='none';this.parentElement.style.background='${v.surface}'"/>
    <div class="absolute inset-0" style="background:linear-gradient(180deg, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.05) 30%, rgba(0,0,0,0.4) 100%)"></div>

    <div class="absolute inset-0 flex flex-col justify-end">
      <div class="max-w-[1400px] w-full mx-auto px-6 md:px-10 pb-14 md:pb-20">
        <div class="max-w-2xl reveal">
          <div class="upper-thin text-white/85 mb-6">— Fleuriste artisan · ${city}</div>
          <h1 class="text-white text-[3.5rem] md:text-[5.5rem] mb-8" style="font-weight:${v.serifWeight}">
            Les fleurs, <span class="serif-italic">comme une émotion.</span>
          </h1>
          <div class="flex flex-col sm:flex-row gap-3 mb-10">
            <button onclick="composerOpen()" class="btn-light">
              Composer mon bouquet <span aria-hidden>→</span>
            </button>
            <button onclick="kOpen('mariage')" class="btn-ghost" style="color:#fff;border-color:#fff">
              Devis mariage
            </button>
          </div>
          <div class="flex items-center gap-5 text-white/85 text-sm">
            <span class="flex items-center gap-2">
              <span class="text-base" style="color:#fde68a">${"★".repeat(5)}</span>
              <span class="font-medium">${ratingDisplay}/5</span>
            </span>
            <span class="opacity-60">·</span>
            <span>${reviewsCount} avis Google</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ NARRATIF PLEINE LARGEUR ═══════════════════ -->
<section class="py-20 md:py-32 border-b" style="border-color:${v.line}">
  <div class="max-w-[900px] mx-auto px-6 md:px-10 text-center reveal">
    <div class="upper-thin mb-8" style="color:${primary}">— Une histoire</div>
    <h2 class="text-4xl md:text-6xl mb-8 leading-[1.1]" style="font-weight:${v.serifWeight}">
      Une histoire de fleurs, de <span class="serif-italic" style="color:${primary}">${city}</span>.
    </h2>
    <p class="text-lg md:text-xl leading-[1.85] mb-10" style="color:${v.fg};white-space:pre-line">${aboutTextLong}</p>
    <button onclick="composerOpen()" class="link-underline">
      Découvrir nos compositions <span aria-hidden>→</span>
    </button>
  </div>
</section>

<!-- ═══════════════════ 3 COLLECTIONS (cards immenses, style LFLF) ═══════════════════ -->
<section id="collections" class="py-20 md:py-32">
  <div class="max-w-[1400px] mx-auto px-6 md:px-10">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14 md:mb-20">
      <div>
        <div class="upper-thin mb-5" style="color:${primary}">— Collections</div>
        <h2 class="text-4xl md:text-6xl" style="font-weight:${v.serifWeight}">Choisissez votre <span class="serif-italic">émotion.</span></h2>
      </div>
      <p class="max-w-sm text-base leading-[1.75]" style="color:${v.fgSoft}">
        Trois univers, une même exigence : la fleur fraîche, la composition juste, la livraison soignée.
      </p>
    </div>
    <div class="grid md:grid-cols-3 gap-6 md:gap-8">
      ${cols.map((c, i) => `
      <article class="col-card reveal" style="animation-delay:${0.1 + i * 0.15}s">
        <div class="aspect-[4/5] overflow-hidden mb-6" style="background:${v.surface}">
          <img src="${esc(c.image)}" alt="${esc(c.title)}" class="w-full h-full object-cover" loading="lazy" onerror="this.parentElement.style.background='${v.surface}'"/>
        </div>
        <h3 class="text-3xl md:text-4xl mb-3" style="font-weight:${v.serifWeight}">${esc(c.title)}</h3>
        <p class="text-base leading-[1.7] mb-5" style="color:${v.fgSoft}">${esc(c.tagline)}.</p>
        <button onclick="kOpen('${c.modal}')" class="link-underline">
          Découvrir <span aria-hidden>→</span>
        </button>
      </article>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ POUR VOS ÉVÉNEMENTS (4 services typo) ═══════════════════ -->
<section id="evenements" class="py-20 md:py-32" style="background:${v.surface}">
  <div class="max-w-[1400px] mx-auto px-6 md:px-10">
    <div class="text-center mb-14 md:mb-20 max-w-2xl mx-auto reveal">
      <div class="upper-thin mb-5" style="color:${primary}">— Sur-mesure</div>
      <h2 class="text-4xl md:text-6xl" style="font-weight:${v.serifWeight}">On vous accompagne <span class="serif-italic" style="color:${primary}">de A à Z.</span></h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-px" style="background:${v.line}">
      ${[
        { title: "Mariages", desc: "Bouquet de mariée, boutonnières, centres de table, arches florales. Devis sous 48 h, accompagnement complet du brief au jour J.", modal: "mariage" },
        { title: "Particuliers", desc: "Anniversaire, Saint-Valentin, naissance, juste comme ça. Livraison locale ou retrait en boutique le jour même.", modal: "particulier" },
        { title: "Professionnels", desc: "Abonnement bureaux hebdomadaire ou bimensuel, cadeaux d'entreprise, événements pros. Facturation centralisée.", modal: "pro" },
        { title: "Carte cadeau", desc: "Offrez la liberté du choix. Cartes à partir de 30 €, valables un an, utilisables sur tout ce qui est en boutique.", modal: "cadeau" },
      ].map(s => `
      <div class="p-10 md:p-12 reveal" style="background:${v.bg}">
        <h3 class="text-2xl md:text-3xl mb-4" style="font-weight:${v.serifWeight}">${s.title}</h3>
        <p class="text-sm md:text-base leading-[1.7] mb-7" style="color:${v.fgSoft}">${s.desc}</p>
        <button onclick="kOpen('${s.modal}')" class="link-underline">
          En savoir plus <span aria-hidden>→</span>
        </button>
      </div>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ GALERIE MASONRY ASYMÉTRIQUE ═══════════════════ -->
<section id="galerie" class="py-20 md:py-32">
  <div class="max-w-[1400px] mx-auto px-6 md:px-10 mb-12 md:mb-16">
    <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
      <div class="reveal">
        <div class="upper-thin mb-5" style="color:${primary}">— Portfolio</div>
        <h2 class="text-4xl md:text-6xl" style="font-weight:${v.serifWeight}">Nos derniers <span class="serif-italic">bouquets.</span></h2>
      </div>
      ${p.website ? `<a href="${esc(p.website)}" target="_blank" rel="noopener" class="link-underline">
        Tout voir <span aria-hidden>→</span>
      </a>` : ""}
    </div>
  </div>
  <!-- Masonry asymétrique : grid 4 colonnes desktop, tailles variables -->
  <div class="max-w-[1500px] mx-auto px-3 md:px-5">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
      ${gallery.slice(0, Math.min(gallery.length, 10)).map((url, i) => {
        // Layout asymétrique : certaines images plus grandes
        const tall = [0, 5, 7].includes(i);
        const wide = [2].includes(i);
        const aspect = tall ? "aspect-[3/4]" : wide ? "aspect-[2/1] col-span-2" : "aspect-square";
        return `<div class="overflow-hidden ${aspect}" style="background:${v.surface}">
          <img src="${esc(url)}" alt="" class="gallery-img w-full h-full object-cover" loading="lazy" onerror="this.parentElement.style.display='none'"/>
        </div>`;
      }).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ À PROPOS ÉDITORIAL (photo + texte) ═══════════════════ -->
<section class="py-20 md:py-32" style="background:${v.surface}">
  <div class="max-w-[1400px] mx-auto px-6 md:px-10 grid md:grid-cols-2 gap-12 md:gap-20 items-center">
    <div class="reveal">
      <div class="aspect-[4/5] overflow-hidden">
        <img src="${esc(gallery[4] || heroImg)}" alt="" class="w-full h-full object-cover" loading="lazy" onerror="this.style.display='none'"/>
      </div>
    </div>
    <div class="reveal" style="animation-delay:.15s">
      <div class="upper-thin mb-5" style="color:${primary}">— Notre atelier</div>
      <h2 class="text-4xl md:text-5xl mb-7" style="font-weight:${v.serifWeight}">
        Une boutique<br><span class="serif-italic" style="color:${primary}">comme un écrin.</span>
      </h2>
      <ul class="space-y-5 mb-8">
        ${[
          ["Fleurs reçues chaque matin", "Producteurs français en priorité, sourcing exigeant."],
          ["Aucune fleur stockée > 3 jours", "Roulement quotidien, fraîcheur garantie."],
          ["Composition à la commande", "Jamais préfabriqué, jamais répété."],
          [`Plus de ${reviewsCount} clients fidèles`, `${ratingDisplay}/5 sur Google, cinq étoiles de cœur.`],
        ].map(([t, sub]) => `<li class="flex items-start gap-4">
          <span class="serif text-xl shrink-0 mt-0.5" style="color:${primary}">→</span>
          <div>
            <div class="font-semibold text-base mb-1">${t}</div>
            <div class="text-sm" style="color:${v.fgSoft}">${sub}</div>
          </div>
        </li>`).join("")}
      </ul>
      <button onclick="composerOpen()" class="btn-primary">
        Venir nous voir <span aria-hidden>→</span>
      </button>
    </div>
  </div>
</section>

<!-- ═══════════════════ TÉMOIGNAGES (3 cards éditoriales) ═══════════════════ -->
<section id="avis" class="py-20 md:py-32">
  <div class="max-w-[1400px] mx-auto px-6 md:px-10">
    <div class="text-center max-w-xl mx-auto mb-14 md:mb-20">
      <div class="upper-thin mb-5" style="color:${primary}">— Ils nous ont confié leurs émotions</div>
      <h2 class="text-4xl md:text-5xl mb-4" style="font-weight:${v.serifWeight}">
        <span style="color:${primary}">${ratingDisplay}</span>/5 sur ${reviewsCount} avis.
      </h2>
    </div>
    <div class="grid md:grid-cols-3 gap-10 md:gap-12">
      ${reviewsToShow.map(r => `
      <figure class="reveal">
        <div class="serif text-6xl leading-none mb-5" style="color:${primary};font-weight:${v.serifWeight}">"</div>
        <blockquote class="text-base md:text-lg leading-[1.85] mb-7 italic serif" style="color:${v.fg};font-weight:${v.serifWeight}">${esc((r.text || "").slice(0, 260))}${(r.text || "").length > 260 ? "…" : ""}</blockquote>
        <figcaption class="flex items-center gap-3 pt-5 border-t" style="border-color:${v.line}">
          <div class="w-10 h-10 rounded-full grid place-items-center text-xs serif-italic" style="background:${primary};color:${v.bg};font-weight:${v.serifWeight}">${initials(r.author || "Client")}</div>
          <div>
            <div class="text-sm font-medium">${esc(r.author || "Client vérifié")}</div>
            <div class="upper-thin mt-1" style="color:${v.fgSoft}">${esc(r.timeAgo || "récemment")}</div>
          </div>
        </figcaption>
      </figure>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ CONTACT + MAPS ═══════════════════ -->
<section id="contact" class="py-20 md:py-32 border-t" style="border-color:${v.line}">
  <div class="max-w-[1400px] mx-auto px-6 md:px-10">
    <div class="text-center mb-14 md:mb-20 reveal">
      <div class="upper-thin mb-5" style="color:${primary}">— Nous rendre visite</div>
      <h2 class="text-4xl md:text-6xl" style="font-weight:${v.serifWeight}">
        Passez en boutique <span class="serif-italic" style="color:${primary}">à ${city}.</span>
      </h2>
    </div>
    <div class="grid lg:grid-cols-5 gap-12 md:gap-16">
      <div class="lg:col-span-3">
        <div class="aspect-[4/3] lg:aspect-[16/10] overflow-hidden" style="background:${v.surface}">
          <iframe src="${mapsEmbedUrl}" width="100%" height="100%" style="border:0" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
        <a href="${mapsLinkUrl}" target="_blank" rel="noopener" class="link-underline mt-6 inline-flex">
          Itinéraire vers ${name} <span aria-hidden>→</span>
        </a>
      </div>
      <div class="lg:col-span-2 space-y-10">
        <div>
          <div class="upper-thin mb-4" style="color:${v.fgSoft}">Adresse</div>
          <div class="serif text-xl md:text-2xl mb-1">${addressDisplay}</div>
          <div class="text-base" style="color:${v.fgSoft}">${city}</div>
        </div>
        ${phoneDisplay ? `<div>
          <div class="upper-thin mb-4" style="color:${v.fgSoft}">Téléphone</div>
          <a href="${phoneLink}" class="serif text-3xl md:text-4xl hover:opacity-70 transition-opacity" style="color:${primary}">${phoneDisplay}</a>
        </div>` : ""}
        <div>
          <div class="upper-thin mb-4" style="color:${v.fgSoft}">Horaires</div>
          <table class="w-full">${hoursHtml}</table>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 pt-3">
          <button onclick="composerOpen()" class="btn-primary">Commander un bouquet <span aria-hidden>→</span></button>
          ${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" rel="noopener" class="btn-ghost" style="border-color:#25D366;color:#25D366">
            <svg width="16" height="16" viewBox="0 0 32 32" fill="currentColor" aria-hidden><path d="M16 0C7.16 0 0 7.16 0 16c0 2.83.74 5.49 2.03 7.79L0 32l8.42-2.21A15.92 15.92 0 0 0 16 32c8.84 0 16-7.16 16-16S24.84 0 16 0zm7.42 19.39c-.4-.2-2.4-1.18-2.77-1.32-.37-.13-.64-.2-.91.2-.27.4-1.05 1.32-1.29 1.59-.24.27-.47.3-.87.1-.4-.2-1.7-.63-3.24-2-1.2-1.07-2-2.39-2.24-2.79-.24-.4-.03-.62.17-.82.18-.18.4-.47.6-.71.2-.24.27-.4.4-.67.13-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.69-.91-.7l-.78-.01c-.27 0-.71.1-1.08.5-.37.4-1.42 1.39-1.42 3.39 0 2 1.45 3.93 1.65 4.2.2.27 2.85 4.35 6.91 6.1.97.42 1.72.67 2.31.86.97.31 1.85.27 2.55.16.78-.12 2.4-.98 2.74-1.93.34-.94.34-1.75.24-1.92-.1-.17-.37-.27-.77-.47z"/></svg>
            WhatsApp
          </a>` : ""}
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ FOOTER 3 COLONNES ═══════════════════ -->
<footer class="py-16 md:py-20 pb-36 md:pb-20 border-t" style="border-color:${v.line};background:${v.surface}">
  <div class="max-w-[1400px] mx-auto px-6 md:px-10">
    <div class="grid md:grid-cols-3 gap-12 mb-12">
      <div>
        <div class="serif text-2xl md:text-3xl italic mb-4">${name}</div>
        <div class="text-sm leading-[1.7]" style="color:${v.fgSoft}">
          Fleuriste artisan à ${city} depuis ${yearsExp} ans.<br>
          Bouquets composés à la minute, fleurs reçues chaque matin.
        </div>
      </div>
      <div>
        <div class="upper-thin mb-5" style="color:${v.fg}">Boutique</div>
        <ul class="space-y-3 text-sm">
          <li><a href="#collections" class="hover:opacity-60 transition-opacity">Collections</a></li>
          <li><a href="#evenements" class="hover:opacity-60 transition-opacity">Événements</a></li>
          <li><a href="#galerie" class="hover:opacity-60 transition-opacity">Galerie</a></li>
          <li><a href="#contact" class="hover:opacity-60 transition-opacity">Contact</a></li>
        </ul>
      </div>
      <div>
        <div class="upper-thin mb-5" style="color:${v.fg}">Nous joindre</div>
        <ul class="space-y-3 text-sm" style="color:${v.fg}">
          <li>${addressDisplay}</li>
          ${phoneDisplay ? `<li><a href="${phoneLink}" class="hover:opacity-60 transition-opacity">${phoneDisplay}</a></li>` : ""}
          <li style="color:${v.fgSoft}">${shortHours}</li>
        </ul>
      </div>
    </div>
    <div class="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-[11px] tracking-[0.15em] uppercase" style="border-color:${v.line};color:${v.fgSoft}">
      <div>© ${year} ${name}</div>
      <div>Design <a href="https://klyora.fr" style="color:${primary};border-bottom:1px solid ${primary}">Klyora</a></div>
    </div>
  </div>
</footer>

<!-- ═══════════════════ MODAL ─ simple, élégant ═══════════════════ -->
<div id="k-modal" class="hidden fixed inset-0 z-50 items-end sm:items-center justify-center modal-bg p-0 sm:p-6 overflow-y-auto" onclick="if(event.target===this) kClose()">
  <div class="modal-content max-w-md w-full max-h-[92vh] overflow-y-auto relative" style="background:${v.bg};border-top:3px solid ${primary}">
    <button onclick="kClose()" class="absolute top-5 right-5 w-9 h-9 grid place-items-center hover:opacity-50 z-10" style="color:${v.fg}" aria-label="Fermer">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <div class="p-8 sm:p-12">
      <div id="k-default-view">
        <div class="upper-thin mb-4" style="color:${primary}">— Demande</div>
        <h3 class="text-3xl md:text-4xl mb-4" style="font-weight:${v.serifWeight}">
          <span id="k-title">Commander un bouquet</span>
        </h3>
        <p class="text-sm leading-[1.7] mb-8" style="color:${v.fgSoft}">
          Laissez-nous quelques détails. Nous vous rappelons sous 24 h pour préciser ensemble la composition, la date et la livraison.
        </p>
        <form onsubmit="kSubmit(event)" class="space-y-2">
          <input type="text" id="k-name" placeholder="Votre nom" required class="input-underline">
          <input type="tel" id="k-phone" placeholder="Téléphone" required class="input-underline">
          <input type="email" id="k-email" placeholder="Email (facultatif)" class="input-underline">
          <textarea id="k-msg" rows="3" placeholder="Occasion, couleurs souhaitées, date, dédicace…" class="input-underline resize-none"></textarea>
          <button type="submit" class="btn-primary w-full mt-6 justify-center">Envoyer ma demande <span aria-hidden>→</span></button>
        </form>
      </div>
      <div id="k-success" class="hidden text-center py-6">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="${primary}" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-6"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
        <h3 class="text-3xl mb-3" style="font-weight:${v.serifWeight}">Merci.</h3>
        <p class="text-sm leading-[1.7]" style="color:${v.fgSoft}">Nous vous rappelons sous 24 h pour préciser la composition.</p>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════ BOUQUET COMPOSER (modal full-screen) ═══════════════════ -->
${buildBouquetComposer(slug)}

<!-- ═══════════════════ STICKY MOBILE FAB ═══════════════════ -->
${phoneDisplay ? `<a href="${phoneLink}" class="sticky-fab" style="bottom:calc(82px + env(safe-area-inset-bottom, 0px));width:54px;height:54px;background:${primary}" aria-label="Appeler">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
</a>` : ""}
${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" rel="noopener" class="sticky-fab" style="bottom:calc(18px + env(safe-area-inset-bottom, 0px));width:54px;height:54px;background:#25D366" aria-label="WhatsApp">
  <svg width="24" height="24" viewBox="0 0 32 32" fill="white" aria-hidden><path d="M16 0C7.16 0 0 7.16 0 16c0 2.83.74 5.49 2.03 7.79L0 32l8.42-2.21A15.92 15.92 0 0 0 16 32c8.84 0 16-7.16 16-16S24.84 0 16 0zm7.42 19.39c-.4-.2-2.4-1.18-2.77-1.32-.37-.13-.64-.2-.91.2-.27.4-1.05 1.32-1.29 1.59-.24.27-.47.3-.87.1-.4-.2-1.7-.63-3.24-2-1.2-1.07-2-2.39-2.24-2.79-.24-.4-.03-.62.17-.82.18-.18.4-.47.6-.71.2-.24.27-.4.4-.67.13-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.69-.91-.7l-.78-.01c-.27 0-.71.1-1.08.5-.37.4-1.42 1.39-1.42 3.39 0 2 1.45 3.93 1.65 4.2.2.27 2.85 4.35 6.91 6.1.97.42 1.72.67 2.31.86.97.31 1.85.27 2.55.16.78-.12 2.4-.98 2.74-1.93.34-.94.34-1.75.24-1.92-.1-.17-.37-.27-.77-.47z"/></svg>
</a>` : ""}

<script>
  function kOpen(kind){
    var t = {
      'bouquet':'Commander un bouquet',
      'mariage':'Devis mariage',
      'deuil':'Composition deuil',
      'particulier':'Bouquet pour particulier',
      'pro':'Demande pro / abonnement',
      'cadeau':'Carte cadeau'
    };
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
        type: window.__kKind || 'bouquet',
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

  /* Reveal au scroll */
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
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  })();
</script>

</body>
</html>`;
}
