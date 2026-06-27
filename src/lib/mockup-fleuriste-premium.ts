/**
 * Template FLEURISTE PREMIUM — niveau garage-premium pour les boutiques de
 * fleurs. Univers rainbow-floral joyeux, fonts serif italic, animations
 * douces, particules pétales en CSS.
 *
 * 3 variants palette pickés via p.id.charCodeAt(0) % 3 — deux fleuristes
 * ne reçoivent jamais le même design :
 *   A "Sweet Pastel"     — rose pastel + jaune + violet, Cormorant italic
 *   B "Elegant Ivory"    — ivoire + cuivre + bordeaux, Playfair Display
 *   C "Botanical Green"  — blanc + vert sauge + corail, DM Serif Display
 *
 * Sections (toutes fonctionnelles, tous boutons câblés) :
 *   - Header sticky (logo + nav + CTA)
 *   - Hero plein écran : photo parallaxe + headline + 4 trust badges + 3 CTAs
 *   - Particules pétales décoratives (8 spans CSS animation)
 *   - "Nos bouquets" : 6 cards (Saint-Valentin / Mariage / Anniversaire /
 *     Deuil / Naissance / Sur-mesure) avec hover scale + price + commander
 *   - "Pour vos événements" : 4 services (mariage / deuil / abonnement /
 *     cadeaux pros) avec icônes SVG
 *   - Stats animées au scroll (IntersectionObserver count-up)
 *   - Galerie Instagram-style 4 colonnes
 *   - Témoignages carrousel marquee
 *   - À propos + photo
 *   - Contact + Maps embed + horaires
 *   - Footer
 *   - Modal multi-étape "Commander un bouquet"
 *   - Sticky mobile : tel + WhatsApp + commander
 */
import { detectMetierForStock, getStockPhotosForMetier, getHeroPhotoForMetier } from "./stock-photos";

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
  secondary: string;
  bg: string;
  cardBg: string;
  fg: string;
  muted: string;
  border: string;
  petal: string;
  fontHeading: string;
  fontBody: string;
  fontsImport: string;
  serifItalic: boolean;
  heroBgGradient: string;
};

const VARIANTS: Variant[] = [
  {
    id: "sweet-pastel",
    name: "Sweet Pastel",
    primary: "#ec4899",
    accent: "#fbbf24",
    secondary: "#a855f7",
    bg: "#fffafc",
    cardBg: "#ffffff",
    fg: "#1c1b1b",
    muted: "#fdf2f8",
    border: "#fce7f3",
    petal: "#fbcfe8",
    fontHeading: "Cormorant Garamond",
    fontBody: "Manrope",
    fontsImport: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500;1,600&family=Manrope:wght@400;500;600;700;800&display=swap",
    serifItalic: true,
    heroBgGradient: "linear-gradient(135deg, #fdf2f8 0%, #fef3c7 50%, #faf5ff 100%)",
  },
  {
    id: "elegant-ivory",
    name: "Elegant Ivory",
    primary: "#be185d",
    accent: "#d97706",
    secondary: "#7c2d12",
    bg: "#fefce8",
    cardBg: "#ffffff",
    fg: "#1c1917",
    muted: "#fef9c3",
    border: "#fef08a",
    petal: "#fbbf24",
    fontHeading: "Playfair Display",
    fontBody: "Inter",
    fontsImport: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;0,700;1,500;1,600&display=swap",
    serifItalic: true,
    heroBgGradient: "linear-gradient(135deg, #fefce8 0%, #fef9c3 50%, #fff7ed 100%)",
  },
  {
    id: "botanical-green",
    name: "Botanical Green",
    primary: "#16a34a",
    accent: "#f43f5e",
    secondary: "#1c1917",
    bg: "#f7fee7",
    cardBg: "#ffffff",
    fg: "#14532d",
    muted: "#ecfccb",
    border: "#d9f99d",
    petal: "#fda4af",
    fontHeading: "DM Serif Display",
    fontBody: "Plus Jakarta Sans",
    fontsImport: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
    serifItalic: true,
    heroBgGradient: "linear-gradient(135deg, #f7fee7 0%, #ecfccb 50%, #ffe4e6 100%)",
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
    return `<tr class="border-b last:border-0" style="border-color:${v.border}">
      <td class="py-3 pr-6 font-medium capitalize">${esc(d)}</td>
      <td class="py-3 text-right ${isClosed ? "italic opacity-50" : "font-semibold"}" style="${isClosed ? "" : `color:${v.primary}`}">${esc(h)}</td>
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

/** Pré-définit 6 bouquets génériques à présenter, prix réalistes fleuriste. */
function defaultBouquets(): Array<{ title: string; subtitle: string; price: string; image: string; tag: string }> {
  const stock = getStockPhotosForMetier("fleuriste", 6);
  return [
    { title: "Saint-Valentin", subtitle: "Roses rouges premium, 25 tiges", price: "à partir de 65 €", image: stock[0] || "", tag: "Best-seller" },
    { title: "Mariage", subtitle: "Bouquet de mariée sur-mesure", price: "sur devis", image: stock[1] || "", tag: "Sur-mesure" },
    { title: "Anniversaire", subtitle: "Composition colorée joyeuse", price: "à partir de 45 €", image: stock[2] || "", tag: "Coup de cœur" },
    { title: "Deuil & sympathie", subtitle: "Couronne, gerbe ou raquette florale", price: "à partir de 80 €", image: stock[3] || "", tag: "Discrétion" },
    { title: "Naissance", subtitle: "Bouquet pastel doux, peluche en option", price: "à partir de 38 €", image: stock[4] || "", tag: "Tendre" },
    { title: "Composition sur-mesure", subtitle: "On crée d'après votre brief", price: "sur devis", image: stock[5] || "", tag: "Unique" },
  ];
}

export function generateFleuristePremiumMockupHtml(p: FleuristePremiumProspect): string {
  const v = pickVariant(p.id);
  const dna = p.site_style_dna || {};

  // Couleurs DNA override si scrapées correctement
  const primary = (dna.primaryColor && dna.primaryColor.startsWith("#")) ? dna.primaryColor : v.primary;
  const accent = (dna.accentColor && dna.accentColor.startsWith("#")) ? dna.accentColor : v.accent;

  const name = esc(p.name);
  const slug = esc(p.slug);
  const city = esc(p.city || "votre ville");
  const phoneDisplay = esc(p.phone || "");
  const phoneDigits = (p.phone || "").replace(/[^\d+]/g, "");
  const phoneLink = phoneDigits ? `tel:${phoneDigits.replace(/^0/, "+33")}` : "#contact";
  const addressDisplay = p.address ? esc(p.address) : `Boutique à ${city}`;

  // WhatsApp
  const whatsappDigits = phoneDigits.replace(/\D/g, "").replace(/^0/, "33");
  const whatsappUrl = phoneDigits ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Bonjour, je souhaiterais commander un bouquet chez ${p.name}.`)}` : "";

  // Maps
  const mapsQuery = encodeURIComponent(`${p.address || p.name} ${p.city || ""}`);
  const mapsEmbedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const mapsLinkUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  // Hero & galerie
  const heroImg = pickHeroImage(p);
  const gallery = pickGallery(p, 8);
  const bouquets = defaultBouquets();

  // Logo
  const logoHtml = dna.logoUrl && dna.logoUrl.startsWith("http")
    ? `<img src="${esc(dna.logoUrl)}" alt="${name}" class="h-11 w-auto max-w-[160px] object-contain"/>`
    : `<div class="w-11 h-11 rounded-2xl grid place-items-center font-bold text-white text-base shadow-md" style="background:linear-gradient(135deg,${primary},${accent})">${initials(p.name)}</div>`;

  // Stats
  const yearsExp = 8 + (p.id ? p.id.charCodeAt(0) % 18 : 0);
  const bouquetsLivres = 1200 + (p.id ? (p.id.charCodeAt(1) || 0) * 17 : 0);
  const ratingDisplay = p.google_rating ? p.google_rating.toFixed(1) : "4.9";
  const reviewsCount = p.google_reviews_count || 87 + (p.id ? p.id.charCodeAt(2) % 180 : 0);

  // About
  const aboutText = p.about_scraped
    ? esc(p.about_scraped.slice(0, 700))
    : `Depuis ${yearsExp} ans, ${name}${p.city ? ` à ${city}` : ""} célèbre l'art floral à la française. Bouquets composés à la minute, fleurs fraîches du marché chaque matin, sélection de producteurs locaux. Chaque création est pensée pour transmettre une émotion juste, à la hauteur de l'instant qu'elle accompagne.`;

  // Reviews top 3
  const reviews = (p.reviews || []).filter(r => r.text && r.text.length > 30).slice(0, 3);
  const fallbackReviews = [
    { author: "Camille D.", text: "Un bouquet absolument sublime pour l'anniversaire de ma maman. La fleuriste a parfaitement compris ce que je cherchais, et le résultat dépassait mes attentes. Je recommande à 200 %.", rating: 5, timeAgo: "il y a 2 semaines" },
    { author: "Mathieu L.", text: "On a fait appel à eux pour notre mariage et c'était parfait. Pro, à l'écoute, et le rendu le jour J était féérique. Bouquet de mariée, boutonnières, centres de table — tout était sublime.", rating: 5, timeAgo: "il y a 1 mois" },
    { author: "Sarah B.", text: "Mon fleuriste depuis 3 ans. Toujours frais, toujours créatif, jamais déçue. Et un accueil au top à chaque fois. La référence du quartier sans hésiter.", rating: 5, timeAgo: "il y a 3 mois" },
  ];
  const reviewsToShow = reviews.length >= 2 ? reviews : fallbackReviews;

  const hoursHtml = buildHoursTable(p.hours, { ...v, primary });
  const year = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name} — Fleuriste à ${city}</title>
<meta name="description" content="${name}, fleuriste à ${city}. Bouquets, mariages, deuils, abonnement bureaux. Fleurs fraîches du marché, composition à la minute.">
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${v.fontsImport}" rel="stylesheet">
<style>
  :root {
    --primary: ${primary};
    --accent: ${accent};
    --secondary: ${v.secondary};
    --bg: ${v.bg};
    --card-bg: ${v.cardBg};
    --fg: ${v.fg};
    --muted: ${v.muted};
    --border: ${v.border};
    --petal: ${v.petal};
    --font-heading: "${v.fontHeading}", serif;
    --font-body: "${v.fontBody}", system-ui, sans-serif;
  }
  html, body { background: var(--bg); color: var(--fg); font-family: var(--font-body); }
  h1, h2, h3, h4 { font-family: var(--font-heading); letter-spacing: -0.01em; }
  .serif-italic { font-family: var(--font-heading); font-style: italic; font-weight: 500; }
  .heading-gradient {
    background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 50%, var(--secondary) 100%);
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: #fff;
    box-shadow: 0 8px 24px -8px var(--primary);
    transition: transform .2s, box-shadow .2s, filter .2s;
  }
  .btn-primary:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 12px 32px -8px var(--primary); filter: brightness(1.05); }
  .btn-ghost {
    background: transparent;
    color: var(--fg);
    border: 1.5px solid var(--border);
    transition: background .2s, border-color .2s, transform .2s;
  }
  .btn-ghost:hover { background: var(--muted); border-color: var(--primary); transform: translateY(-2px); }
  .btn-wa {
    background: #25D366;
    color: #fff;
    box-shadow: 0 8px 24px -8px #25D366;
    transition: transform .2s, box-shadow .2s;
  }
  .btn-wa:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 12px 32px -8px #25D366; }
  .card-soft {
    background: var(--card-bg);
    border: 1px solid var(--border);
    transition: transform .35s cubic-bezier(.2,.8,.2,1), box-shadow .35s, border-color .35s;
  }
  .card-soft:hover {
    transform: translateY(-6px) scale(1.015);
    box-shadow: 0 16px 40px -12px ${primary}40;
    border-color: var(--primary);
  }
  /* ─── Hero photo Ken Burns ───────────────────── */
  @keyframes kenburns {
    0% { transform: scale(1) translate(0,0); }
    50% { transform: scale(1.08) translate(-1%,-1%); }
    100% { transform: scale(1.04) translate(1%,1%); }
  }
  .kenburns { animation: kenburns 22s ease-in-out infinite alternate; }

  /* ─── Particules pétales ───────────────────── */
  @keyframes fall {
    0% { transform: translateY(-10vh) rotate(0deg); opacity: 0; }
    10% { opacity: 1; }
    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
  }
  .petal {
    position: absolute;
    top: 0;
    pointer-events: none;
    width: 14px; height: 14px;
    background: var(--petal);
    border-radius: 60% 40% 60% 40% / 70% 70% 30% 30%;
    opacity: .65;
    animation: fall linear infinite;
  }
  .petal:nth-child(1)  { left:  5%; animation-duration: 12s; animation-delay:  0s; }
  .petal:nth-child(2)  { left: 15%; animation-duration: 18s; animation-delay:  2s; background: var(--accent); }
  .petal:nth-child(3)  { left: 25%; animation-duration: 14s; animation-delay:  4s; }
  .petal:nth-child(4)  { left: 35%; animation-duration: 20s; animation-delay:  1s; background: var(--secondary); opacity:.4; }
  .petal:nth-child(5)  { left: 50%; animation-duration: 15s; animation-delay:  6s; }
  .petal:nth-child(6)  { left: 65%; animation-duration: 22s; animation-delay:  3s; background: var(--accent); }
  .petal:nth-child(7)  { left: 78%; animation-duration: 16s; animation-delay:  8s; }
  .petal:nth-child(8)  { left: 90%; animation-duration: 19s; animation-delay:  5s; background: var(--secondary); opacity:.4; }
  .petal:nth-child(9)  { left: 22%; animation-duration: 17s; animation-delay:  9s; background: var(--accent); opacity:.5; }
  .petal:nth-child(10) { left: 72%; animation-duration: 13s; animation-delay: 11s; }

  /* ─── Fade-in stagger ───────────────────── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-up { opacity: 0; animation: fadeUp .8s cubic-bezier(.2,.8,.2,1) forwards; }

  /* ─── Marquee témoignages ───────────────────── */
  @keyframes marquee {
    from { transform: translateX(0); }
    to { transform: translateX(-50%); }
  }
  .marquee { display: flex; gap: 1.5rem; width: max-content; animation: marquee 40s linear infinite; }
  .marquee:hover { animation-play-state: paused; }

  /* ─── Modal ───────────────────── */
  .kr-modal-bg { backdrop-filter: blur(14px); background: rgba(0,0,0,.55); }
  .kr-step { display: none; }
  .kr-step.active { display: block; animation: fadeUp .35s ease forwards; }

  /* ─── Sticky mobile bottom buttons ───────────────────── */
  .sticky-fab {
    position: fixed; right: 16px;
    z-index: 50;
    width: 56px; height: 56px;
    border-radius: 50%;
    display: grid; place-items: center;
    box-shadow: 0 8px 24px rgba(0,0,0,.18);
    transition: transform .2s;
  }
  .sticky-fab:hover { transform: scale(1.08); }
  @media (min-width: 768px) { .sticky-fab { display: none; } }
</style>
</head>
<body class="antialiased overflow-x-hidden">

<!-- ═══════════════════ HEADER ═══════════════════ -->
<header class="sticky top-0 z-40 backdrop-blur-xl border-b" style="background:${v.bg}cc;border-color:${v.border}">
  <div class="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
    <a href="#hero" class="flex items-center gap-3">
      ${logoHtml}
      <div>
        <div class="font-[var(--font-heading)] text-lg font-bold leading-none">${name}</div>
        <div class="text-[11px] opacity-60 tracking-widest mt-0.5 uppercase">Fleuriste · ${city}</div>
      </div>
    </a>
    <nav class="hidden md:flex items-center gap-7 text-sm font-medium">
      <a href="#bouquets" class="hover:text-[color:var(--primary)] transition">Nos bouquets</a>
      <a href="#evenements" class="hover:text-[color:var(--primary)] transition">Événements</a>
      <a href="#avis" class="hover:text-[color:var(--primary)] transition">Avis</a>
      <a href="#contact" class="hover:text-[color:var(--primary)] transition">Contact</a>
    </nav>
    <button onclick="krOpen('commander')" class="btn-primary px-5 py-2.5 rounded-full text-sm font-semibold">
      Commander
    </button>
  </div>
</header>

<!-- ═══════════════════ HERO ═══════════════════ -->
<section id="hero" class="relative overflow-hidden pt-12 pb-20 md:pt-16 md:pb-32" style="background:${v.heroBgGradient}">
  <!-- Pétales -->
  <div class="absolute inset-0 pointer-events-none overflow-hidden">
    <span class="petal"></span><span class="petal"></span><span class="petal"></span><span class="petal"></span>
    <span class="petal"></span><span class="petal"></span><span class="petal"></span><span class="petal"></span>
    <span class="petal"></span><span class="petal"></span>
  </div>

  <div class="max-w-7xl mx-auto px-5 grid md:grid-cols-2 gap-12 items-center relative">
    <div class="fade-up" style="animation-delay:.1s">
      <div class="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full text-xs font-semibold" style="background:${primary}15;color:${primary}">
        <span class="text-base">💐</span>
        <span>Fleuriste artisan · ${city}</span>
      </div>
      <h1 class="text-5xl md:text-7xl font-bold leading-[1.04] mb-6">
        L'émotion <span class="serif-italic heading-gradient">en fleurs.</span>
      </h1>
      <p class="text-lg md:text-xl opacity-80 leading-relaxed mb-8 max-w-xl">
        Bouquets composés à la minute, mariages d'exception, abonnement bureaux. Fleurs fraîches du marché chaque matin, savoir-faire artisanal depuis ${yearsExp} ans.
      </p>

      <div class="flex flex-wrap items-center gap-3 mb-10">
        <button onclick="krOpen('commander')" class="btn-primary px-7 py-4 rounded-full text-base font-semibold inline-flex items-center gap-2">
          Commander un bouquet →
        </button>
        <button onclick="krOpen('mariage')" class="btn-ghost px-7 py-4 rounded-full text-base font-semibold">
          Devis mariage
        </button>
        ${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" rel="noopener" class="btn-wa px-6 py-4 rounded-full text-base font-semibold inline-flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden><path d="M16 0C7.16 0 0 7.16 0 16c0 2.83.74 5.49 2.03 7.79L0 32l8.42-2.21A15.92 15.92 0 0 0 16 32c8.84 0 16-7.16 16-16S24.84 0 16 0zm0 29.33c-2.5 0-4.83-.67-6.83-1.83l-.5-.29-5 1.32 1.34-4.88-.32-.5A13.28 13.28 0 0 1 2.67 16C2.67 8.65 8.65 2.67 16 2.67S29.33 8.65 29.33 16 23.35 29.33 16 29.33zm7.42-9.94c-.4-.2-2.4-1.18-2.77-1.32-.37-.13-.64-.2-.91.2-.27.4-1.05 1.32-1.29 1.59-.24.27-.47.3-.87.1-.4-.2-1.7-.63-3.24-2-1.2-1.07-2-2.39-2.24-2.79-.24-.4-.03-.62.17-.82.18-.18.4-.47.6-.71.2-.24.27-.4.4-.67.13-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.69-.91-.7l-.78-.01c-.27 0-.71.1-1.08.5-.37.4-1.42 1.39-1.42 3.39 0 2 1.45 3.93 1.65 4.2.2.27 2.85 4.35 6.91 6.1.97.42 1.72.67 2.31.86.97.31 1.85.27 2.55.16.78-.12 2.4-.98 2.74-1.93.34-.94.34-1.75.24-1.92-.1-.17-.37-.27-.77-.47z"/></svg>
          WhatsApp
        </a>` : ""}
      </div>

      <!-- Trust badges fleuriste -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
        ${[
          { emo: "🌸", t: "Fleurs fraîches", s: "Marché tous les matins" },
          { emo: "🚲", t: "Livraison locale", s: "${city} & alentours" },
          { emo: "💍", t: "Mariages & événements", s: "Devis 24h" },
          { emo: "📦", t: "Abonnement bureaux", s: "À partir de 35€/sem" },
        ].map(b => `<div class="flex items-start gap-2.5 text-sm">
          <span class="text-2xl shrink-0">${b.emo}</span>
          <div>
            <div class="font-semibold leading-tight">${b.t}</div>
            <div class="text-xs opacity-60 mt-0.5">${b.s}</div>
          </div>
        </div>`).join("")}
      </div>
    </div>

    <div class="relative fade-up" style="animation-delay:.3s">
      <div class="relative aspect-[4/5] rounded-[36px] overflow-hidden shadow-2xl">
        <img src="${esc(heroImg)}" alt="${name}" class="kenburns w-full h-full object-cover" loading="eager"/>
        <div class="absolute inset-0" style="background:linear-gradient(180deg,transparent 40%,${v.fg}60 100%)"></div>
        <div class="absolute bottom-6 left-6 right-6 text-white">
          <div class="text-xs font-semibold tracking-widest opacity-80 mb-1 uppercase">${city}</div>
          <div class="font-[var(--font-heading)] text-3xl font-bold">${name}</div>
        </div>
      </div>
      <!-- Floating Google rating -->
      <div class="absolute -bottom-7 -left-6 bg-[color:var(--card-bg)] rounded-2xl px-5 py-4 shadow-xl border" style="border-color:${v.border}">
        <div class="flex items-center gap-3">
          <span class="text-3xl font-bold" style="color:${primary}">${ratingDisplay}</span>
          <div>
            <div class="text-sm" style="color:${accent}">${"★".repeat(5)}</div>
            <div class="text-xs opacity-70">${reviewsCount} avis Google</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ NOS BOUQUETS ═══════════════════ -->
<section id="bouquets" class="py-20 md:py-28">
  <div class="max-w-7xl mx-auto px-5">
    <div class="text-center max-w-2xl mx-auto mb-14">
      <div class="text-sm font-bold tracking-widest uppercase mb-3" style="color:${primary}">Nos créations</div>
      <h2 class="text-4xl md:text-5xl font-bold mb-4">Un bouquet <span class="serif-italic heading-gradient">pour chaque émotion.</span></h2>
      <p class="text-lg opacity-75">Du coup de cœur improvisé au mariage de rêve, on cultive l'art floral comme on cuisine : avec passion, fraîcheur et goût du détail.</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      ${bouquets.map((b, i) => `
      <article class="card-soft rounded-3xl overflow-hidden fade-up" style="animation-delay:${0.1 + i * 0.05}s">
        <div class="relative aspect-[4/5] overflow-hidden">
          <img src="${esc(b.image)}" alt="${esc(b.title)}" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy"/>
          <span class="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-semibold" style="background:${v.cardBg}e6;color:${primary}">${esc(b.tag)}</span>
        </div>
        <div class="p-6">
          <h3 class="text-xl font-bold mb-1">${esc(b.title)}</h3>
          <p class="text-sm opacity-70 leading-snug mb-4">${esc(b.subtitle)}</p>
          <div class="flex items-center justify-between">
            <div class="font-semibold" style="color:${primary}">${esc(b.price)}</div>
            <button onclick="krOpen('commander','${esc(b.title)}')" class="text-sm font-semibold hover:underline" style="color:${v.fg}">Commander →</button>
          </div>
        </div>
      </article>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ POUR VOS ÉVÉNEMENTS ═══════════════════ -->
<section id="evenements" class="py-20 md:py-28" style="background:${v.muted}">
  <div class="max-w-7xl mx-auto px-5">
    <div class="text-center max-w-2xl mx-auto mb-14">
      <div class="text-sm font-bold tracking-widest uppercase mb-3" style="color:${primary}">Sur-mesure</div>
      <h2 class="text-4xl md:text-5xl font-bold mb-4">Pour vos <span class="serif-italic heading-gradient">grands moments.</span></h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
      ${[
        { icon: "💍", title: "Mariages", desc: "Bouquet de mariée, boutonnières, centres de table, cérémonie. Devis personnalisé sous 24h.", action: "Demander un devis", modal: "mariage" },
        { icon: "🕊️", title: "Deuil & sympathie", desc: "Couronnes, gerbes, raquettes, coussins. Livraison directe au funérarium ou au cimetière.", action: "Nous contacter", modal: "deuil" },
        { icon: "🏢", title: "Bureaux & pros", desc: "Abonnement hebdomadaire ou bimensuel. Fleurs renouvelées, facturation mensuelle.", action: "Demander un devis", modal: "abonnement" },
        { icon: "🎁", title: "Cadeaux d'entreprise", desc: "Coffrets pour clients/équipes. Livraison sur tout le territoire, packaging premium.", action: "Voir les offres", modal: "cadeaux" },
      ].map(s => `
      <div class="card-soft rounded-3xl p-7 relative overflow-hidden">
        <div class="absolute -top-8 -right-8 w-32 h-32 rounded-full opacity-10" style="background:${primary}"></div>
        <div class="relative">
          <div class="w-14 h-14 rounded-2xl grid place-items-center text-2xl mb-5" style="background:${primary}15;color:${primary}">${s.icon}</div>
          <h3 class="text-xl font-bold mb-2">${s.title}</h3>
          <p class="text-sm opacity-75 leading-relaxed mb-5">${s.desc}</p>
          <button onclick="krOpen('${s.modal}')" class="text-sm font-semibold inline-flex items-center gap-1 hover:gap-2 transition-all" style="color:${primary}">
            ${s.action} →
          </button>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ STATS ANIMÉES ═══════════════════ -->
<section class="py-16">
  <div class="max-w-6xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    ${[
      { n: yearsExp, suffix: " ans", label: "d'artisanat floral" },
      { n: bouquetsLivres, suffix: "+", label: "bouquets livrés" },
      { n: parseFloat(ratingDisplay), suffix: "/5", label: "note Google", decimals: 1 },
      { n: reviewsCount, suffix: "", label: "avis clients" },
    ].map(s => `
    <div>
      <div class="text-5xl md:text-6xl font-bold heading-gradient counter" data-target="${s.n}" data-decimals="${(s as { decimals?: number }).decimals || 0}" data-suffix="${s.suffix}">0${s.suffix}</div>
      <div class="text-sm opacity-70 mt-2 font-medium">${s.label}</div>
    </div>`).join("")}
  </div>
</section>

<!-- ═══════════════════ GALERIE INSTAGRAM-STYLE ═══════════════════ -->
<section class="py-12">
  <div class="max-w-7xl mx-auto px-5">
    <div class="text-center mb-10">
      <div class="text-sm font-bold tracking-widest uppercase mb-3" style="color:${primary}">Notre boutique en images</div>
      <h2 class="text-3xl md:text-4xl font-bold">Le plus beau s'admire <span class="serif-italic">en vrai.</span></h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      ${gallery.slice(0, 8).map(url => `
      <div class="aspect-square rounded-2xl overflow-hidden cursor-pointer">
        <img src="${esc(url)}" alt="" class="w-full h-full object-cover hover:scale-110 transition-transform duration-700" loading="lazy"/>
      </div>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ TÉMOIGNAGES MARQUEE ═══════════════════ -->
<section id="avis" class="py-20 md:py-28" style="background:${v.muted}">
  <div class="max-w-7xl mx-auto mb-10 px-5">
    <div class="text-center max-w-2xl mx-auto">
      <div class="text-sm font-bold tracking-widest uppercase mb-3" style="color:${primary}">Ils nous adorent</div>
      <h2 class="text-4xl md:text-5xl font-bold mb-3">${ratingDisplay}/5 · <span class="serif-italic heading-gradient">${reviewsCount} avis.</span></h2>
      <div class="text-2xl tracking-widest" style="color:${accent}">${"★".repeat(5)}</div>
    </div>
  </div>
  <div class="overflow-hidden">
    <div class="marquee">
      ${[...reviewsToShow, ...reviewsToShow].map(r => `
      <article class="card-soft rounded-3xl p-6 w-80 shrink-0">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-11 h-11 rounded-full grid place-items-center font-bold text-white" style="background:linear-gradient(135deg,${primary},${accent})">${initials(r.author || "Client")}</div>
          <div>
            <div class="font-bold text-sm leading-tight">${esc(r.author || "Client vérifié")}</div>
            <div class="text-xs opacity-60">${esc(r.timeAgo || "récemment")}</div>
          </div>
        </div>
        <div class="text-sm tracking-wider mb-3" style="color:${accent}">${"★".repeat(r.rating || 5)}</div>
        <p class="text-sm leading-relaxed opacity-85">"${esc((r.text || "").slice(0, 200))}${(r.text || "").length > 200 ? "…" : ""}"</p>
      </article>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ À PROPOS ═══════════════════ -->
<section class="py-20 md:py-28">
  <div class="max-w-7xl mx-auto px-5 grid md:grid-cols-2 gap-14 items-center">
    <div class="aspect-[5/6] rounded-[36px] overflow-hidden shadow-xl">
      <img src="${esc(gallery[4] || heroImg)}" alt="" class="w-full h-full object-cover hover:scale-105 transition-transform duration-1000" loading="lazy"/>
    </div>
    <div>
      <div class="text-sm font-bold tracking-widest uppercase mb-3" style="color:${primary}">À propos</div>
      <h2 class="text-4xl md:text-5xl font-bold mb-6">${name}<span class="serif-italic heading-gradient">, l'âme du quartier.</span></h2>
      <p class="text-lg leading-relaxed opacity-85 mb-6">${aboutText}</p>
      <ul class="space-y-3 text-base">
        ${[
          "Fleurs sourcées chez nos producteurs partenaires (Île-de-France principalement)",
          "Aucune fleur ne reste plus de 3 jours en boutique",
          "Composition à la minute, jamais préfabriquée",
          `Plus de ${reviewsCount} clients fidèles qui nous font confiance`,
        ].map(t => `<li class="flex items-start gap-3">
          <span class="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style="background:${primary}"></span>
          <span>${t}</span>
        </li>`).join("")}
      </ul>
    </div>
  </div>
</section>

<!-- ═══════════════════ CONTACT + MAPS + HORAIRES ═══════════════════ -->
<section id="contact" class="py-20 md:py-28" style="background:${v.muted}">
  <div class="max-w-7xl mx-auto px-5">
    <div class="text-center mb-12">
      <div class="text-sm font-bold tracking-widest uppercase mb-3" style="color:${primary}">Venez nous voir</div>
      <h2 class="text-4xl md:text-5xl font-bold">Passez en boutique <span class="serif-italic heading-gradient">à ${city}.</span></h2>
    </div>
    <div class="grid lg:grid-cols-2 gap-8">
      <div class="space-y-5">
        <div class="card-soft rounded-3xl p-6">
          <div class="text-xs font-bold tracking-widest opacity-60 mb-2 uppercase">Adresse</div>
          <div class="font-semibold text-lg mb-1">${addressDisplay}</div>
          <div class="opacity-70 mb-3">${city}</div>
          <a href="${mapsLinkUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 text-sm font-semibold hover:underline" style="color:${primary}">
            Itinéraire vers ${name} →
          </a>
        </div>
        ${phoneDisplay ? `<div class="card-soft rounded-3xl p-6">
          <div class="text-xs font-bold tracking-widest opacity-60 mb-2 uppercase">Téléphone</div>
          <a href="${phoneLink}" class="font-bold text-2xl hover:opacity-70 transition" style="color:${primary}">${phoneDisplay}</a>
        </div>` : ""}
        <div class="card-soft rounded-3xl p-6">
          <div class="text-xs font-bold tracking-widest opacity-60 mb-3 uppercase">Horaires</div>
          <table class="w-full text-sm">${hoursHtml}</table>
        </div>
      </div>
      <div class="rounded-3xl overflow-hidden shadow-xl border min-h-[450px]" style="border-color:${v.border}">
        <iframe src="${mapsEmbedUrl}" width="100%" height="100%" style="border:0;min-height:450px" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </div>
    <div class="text-center mt-12 flex flex-wrap justify-center gap-3">
      <button onclick="krOpen('commander')" class="btn-primary px-10 py-5 rounded-full text-lg font-semibold inline-flex items-center gap-2">
        Commander un bouquet →
      </button>
      ${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" rel="noopener" class="btn-wa px-10 py-5 rounded-full text-lg font-semibold inline-flex items-center gap-2">
        <svg width="22" height="22" viewBox="0 0 32 32" fill="currentColor" aria-hidden><path d="M16 0C7.16 0 0 7.16 0 16c0 2.83.74 5.49 2.03 7.79L0 32l8.42-2.21A15.92 15.92 0 0 0 16 32c8.84 0 16-7.16 16-16S24.84 0 16 0zm7.42 19.39c-.4-.2-2.4-1.18-2.77-1.32-.37-.13-.64-.2-.91.2-.27.4-1.05 1.32-1.29 1.59-.24.27-.47.3-.87.1-.4-.2-1.7-.63-3.24-2-1.2-1.07-2-2.39-2.24-2.79-.24-.4-.03-.62.17-.82.18-.18.4-.47.6-.71.2-.24.27-.4.4-.67.13-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.69-.91-.7l-.78-.01c-.27 0-.71.1-1.08.5-.37.4-1.42 1.39-1.42 3.39 0 2 1.45 3.93 1.65 4.2.2.27 2.85 4.35 6.91 6.1.97.42 1.72.67 2.31.86.97.31 1.85.27 2.55.16.78-.12 2.4-.98 2.74-1.93.34-.94.34-1.75.24-1.92-.1-.17-.37-.27-.77-.47z"/></svg>
        WhatsApp
      </a>` : ""}
    </div>
  </div>
</section>

<!-- ═══════════════════ FOOTER ═══════════════════ -->
<footer class="py-10 border-t" style="border-color:${v.border}">
  <div class="max-w-7xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
    <div class="flex items-center gap-3">
      ${logoHtml}
      <div>
        <div class="font-bold">${name}</div>
        <div class="opacity-60 text-xs">${city}${phoneDisplay ? ` · ${phoneDisplay}` : ""}</div>
      </div>
    </div>
    <div class="opacity-60 text-xs">
      © ${year} ${name} · Site réalisé par <a href="https://klyora.fr" class="font-semibold" style="color:${primary}">Klyora</a>
    </div>
  </div>
</footer>

<!-- ═══════════════════ MODAL COMMANDER (multi-étape) ═══════════════════ -->
<div id="kr-modal" class="hidden fixed inset-0 z-50 items-center justify-center kr-modal-bg p-4" onclick="if(event.target===this) krClose()">
  <div class="bg-[color:var(--card-bg)] rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden" style="border:1px solid ${v.border}">
    <button onclick="krClose()" class="absolute top-4 right-4 w-9 h-9 rounded-full grid place-items-center hover:opacity-70 transition" style="background:${v.muted}" aria-label="Fermer">×</button>
    <div class="p-8">
      <div id="kr-title" class="mb-1">
        <div class="text-xs font-bold tracking-widest uppercase mb-2" style="color:${primary}">Commander</div>
        <h3 class="text-2xl font-bold">Votre bouquet en <span class="serif-italic">3 étapes.</span></h3>
      </div>
      <!-- Progress -->
      <div class="flex gap-1.5 mt-5 mb-6">
        <div class="flex-1 h-1 rounded-full transition" id="kr-prog-1" style="background:${primary}"></div>
        <div class="flex-1 h-1 rounded-full transition" id="kr-prog-2" style="background:${v.muted}"></div>
        <div class="flex-1 h-1 rounded-full transition" id="kr-prog-3" style="background:${v.muted}"></div>
      </div>

      <!-- Step 1 : type d'occasion -->
      <div class="kr-step active" data-step="1">
        <label class="text-sm font-semibold block mb-2">1. Pour quelle occasion ?</label>
        <div class="grid grid-cols-2 gap-2.5" id="kr-occasion-grid">
          ${["Anniversaire", "Saint-Valentin", "Mariage", "Naissance", "Deuil", "Juste comme ça"].map(o =>
            `<button type="button" data-occasion="${o}" class="kr-occasion text-sm font-medium py-3 rounded-xl border transition" style="border-color:${v.border}">${o}</button>`
          ).join("")}
        </div>
        <button type="button" onclick="krNext()" disabled id="kr-next-1" class="btn-primary w-full mt-6 py-3.5 rounded-full text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">Suivant →</button>
      </div>

      <!-- Step 2 : budget + date -->
      <div class="kr-step" data-step="2">
        <label class="text-sm font-semibold block mb-2">2. Budget approximatif</label>
        <div class="grid grid-cols-3 gap-2 mb-5" id="kr-budget-grid">
          ${["30-50€", "50-80€", "80-150€", "150-300€", "300€+", "Sur devis"].map(b =>
            `<button type="button" data-budget="${b}" class="kr-budget text-sm font-medium py-2.5 rounded-xl border transition" style="border-color:${v.border}">${b}</button>`
          ).join("")}
        </div>
        <label class="text-sm font-semibold block mb-2">Date souhaitée</label>
        <input type="date" id="kr-date" class="w-full px-4 py-3 rounded-xl border bg-transparent focus:outline-none transition" style="border-color:${v.border}">
        <div class="flex gap-3 mt-6">
          <button type="button" onclick="krPrev()" class="btn-ghost px-5 py-3.5 rounded-full text-sm font-semibold">← Retour</button>
          <button type="button" onclick="krNext()" disabled id="kr-next-2" class="btn-primary flex-1 py-3.5 rounded-full text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed">Suivant →</button>
        </div>
      </div>

      <!-- Step 3 : coordonnées -->
      <div class="kr-step" data-step="3">
        <form onsubmit="krSubmit(event)" class="space-y-3">
          <label class="text-sm font-semibold block">3. Vos coordonnées</label>
          <input type="text" id="kr-name" placeholder="Votre nom" required class="w-full px-4 py-3 rounded-xl border bg-transparent focus:outline-none" style="border-color:${v.border}">
          <input type="tel" id="kr-phone" placeholder="Téléphone" required class="w-full px-4 py-3 rounded-xl border bg-transparent focus:outline-none" style="border-color:${v.border}">
          <input type="email" id="kr-email" placeholder="Email (facultatif)" class="w-full px-4 py-3 rounded-xl border bg-transparent focus:outline-none" style="border-color:${v.border}">
          <textarea id="kr-msg" rows="2" placeholder="Précisions (couleurs, dédicace…)" class="w-full px-4 py-3 rounded-xl border bg-transparent focus:outline-none resize-none" style="border-color:${v.border}"></textarea>
          <div class="flex gap-3 mt-2">
            <button type="button" onclick="krPrev()" class="btn-ghost px-5 py-3.5 rounded-full text-sm font-semibold">← Retour</button>
            <button type="submit" class="btn-primary flex-1 py-3.5 rounded-full text-sm font-semibold">Envoyer ma demande</button>
          </div>
        </form>
      </div>

      <!-- Success -->
      <div id="kr-success" class="hidden text-center py-6">
        <div class="w-16 h-16 rounded-full mx-auto mb-4 grid place-items-center" style="background:${primary}15">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${primary}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 class="text-2xl font-bold mb-2">Demande envoyée 💐</h3>
        <p class="text-sm opacity-70 leading-relaxed">Notre fleuriste vous rappelle sous 24h pour valider la composition et la livraison.</p>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════ STICKY MOBILE FAB ═══════════════════ -->
${phoneDisplay ? `<a href="${phoneLink}" class="sticky-fab" style="bottom:78px;background:linear-gradient(135deg,${primary},${v.secondary})" aria-label="Appeler">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
</a>` : ""}
${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" rel="noopener" class="sticky-fab" style="bottom:16px;background:#25D366" aria-label="WhatsApp">
  <svg width="26" height="26" viewBox="0 0 32 32" fill="white" aria-hidden><path d="M16 0C7.16 0 0 7.16 0 16c0 2.83.74 5.49 2.03 7.79L0 32l8.42-2.21A15.92 15.92 0 0 0 16 32c8.84 0 16-7.16 16-16S24.84 0 16 0zm7.42 19.39c-.4-.2-2.4-1.18-2.77-1.32-.37-.13-.64-.2-.91.2-.27.4-1.05 1.32-1.29 1.59-.24.27-.47.3-.87.1-.4-.2-1.7-.63-3.24-2-1.2-1.07-2-2.39-2.24-2.79-.24-.4-.03-.62.17-.82.18-.18.4-.47.6-.71.2-.24.27-.4.4-.67.13-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.69-.91-.7l-.78-.01c-.27 0-.71.1-1.08.5-.37.4-1.42 1.39-1.42 3.39 0 2 1.45 3.93 1.65 4.2.2.27 2.85 4.35 6.91 6.1.97.42 1.72.67 2.31.86.97.31 1.85.27 2.55.16.78-.12 2.4-.98 2.74-1.93.34-.94.34-1.75.24-1.92-.1-.17-.37-.27-.77-.47z"/></svg>
</a>` : ""}

<script>
  /* ── Modal multi-step ── */
  var krStep = 1, krData = {};
  function krOpen(kind, preset) {
    krStep = 1; krData = { type: kind || 'commander' };
    if (preset) krData.preset = preset;
    document.getElementById('kr-modal').classList.remove('hidden');
    document.getElementById('kr-modal').classList.add('flex');
    krShow(1);
    document.getElementById('kr-success').classList.add('hidden');
  }
  function krClose(){
    document.getElementById('kr-modal').classList.add('hidden');
    document.getElementById('kr-modal').classList.remove('flex');
  }
  function krShow(n) {
    document.querySelectorAll('.kr-step').forEach(function(el){ el.classList.remove('active'); });
    var step = document.querySelector('[data-step="'+n+'"]');
    if (step) step.classList.add('active');
    ['kr-prog-1','kr-prog-2','kr-prog-3'].forEach(function(id, i){
      document.getElementById(id).style.background = (i < n) ? '${primary}' : '${v.muted}';
    });
  }
  function krNext(){ if(krStep < 3){ krStep++; krShow(krStep); } }
  function krPrev(){ if(krStep > 1){ krStep--; krShow(krStep); } }

  document.querySelectorAll('.kr-occasion').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.kr-occasion').forEach(function(b){
        b.style.background = ''; b.style.color = ''; b.style.borderColor = '${v.border}';
      });
      btn.style.background = '${primary}'; btn.style.color = '#fff'; btn.style.borderColor = '${primary}';
      krData.occasion = btn.dataset.occasion;
      document.getElementById('kr-next-1').disabled = false;
    });
  });
  document.querySelectorAll('.kr-budget').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.kr-budget').forEach(function(b){
        b.style.background = ''; b.style.color = ''; b.style.borderColor = '${v.border}';
      });
      btn.style.background = '${primary}'; btn.style.color = '#fff'; btn.style.borderColor = '${primary}';
      krData.budget = btn.dataset.budget;
      document.getElementById('kr-next-2').disabled = false;
    });
  });

  function krSubmit(e){
    e.preventDefault();
    krData.name = document.getElementById('kr-name').value;
    krData.phone = document.getElementById('kr-phone').value;
    krData.email = document.getElementById('kr-email').value;
    krData.message = document.getElementById('kr-msg').value;
    krData.date = document.getElementById('kr-date').value;
    krData.slug = ${JSON.stringify(slug)};
    fetch('/api/prospect/contact-request', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(krData), keepalive: true
    }).catch(function(){});
    document.querySelectorAll('.kr-step').forEach(function(el){ el.classList.remove('active'); });
    document.getElementById('kr-title').style.display = 'none';
    document.getElementById('kr-success').classList.remove('hidden');
    setTimeout(function(){ krClose(); document.getElementById('kr-title').style.display = ''; }, 3000);
  }

  /* ── Compteurs animés au scroll ── */
  (function(){
    var counters = document.querySelectorAll('.counter');
    if (!counters.length || !('IntersectionObserver' in window)) return;
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (!e.isIntersecting) return;
        var el = e.target;
        var target = parseFloat(el.dataset.target) || 0;
        var dec = parseInt(el.dataset.decimals) || 0;
        var suf = el.dataset.suffix || '';
        var dur = 1600, t0 = performance.now();
        function tick(now){
          var p = Math.min(1, (now - t0) / dur);
          var val = target * (0.2 + 0.8 * (1 - Math.pow(1 - p, 3)));
          el.textContent = val.toFixed(dec) + suf;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = target.toFixed(dec) + suf;
        }
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: .4 });
    counters.forEach(function(c){ io.observe(c); });
  })();
</script>

</body>
</html>`;
}
