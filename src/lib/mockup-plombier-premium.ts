/**
 * Template PLOMBIER PREMIUM — niveau garage-premium pour artisans plombiers
 * (#1 métier en base, 150 prospects). Univers brutalist-BTP : couleurs
 * franches, géométrie nette, transitions sharp, confiance + urgence.
 *
 * 3 variants palette pickés via p.id.charCodeAt(0) % 3 :
 *   A "Bleu Marine Pro"  — bleu marine + cyan + jaune (pro/fiable)
 *   B "Orange Urgence"   — orange vif + noir + rouge (dynamique, urgence)
 *   C "Vert Éco"         — vert sapin + cyan + blanc cassé (écolo/moderne)
 *
 * Sections (tous boutons câblés, mobile-first) :
 *   - Header sticky avec badge URGENCE 24/7 + tel direct
 *   - Hero plein écran : photo + headline + 4 trust badges (Devis gratuit /
 *     Garantie 2 ans / Sous 2h / Décennale) + 3 CTAs (Appeler / Devis / WA)
 *   - Bandeau rouge sticky "Urgence ? Appel immédiat" (collapsible)
 *   - Section "Nos interventions" : 8 cards (Fuite / Débouchage /
 *     Chauffe-eau / WC bouché / Chaudière / Sanitaire / Recherche fuite /
 *     Rénovation SDB) avec icônes
 *   - Section "Pourquoi nous" : 4 pillars différenciants
 *   - Stats animées au scroll BIG
 *   - Galerie chantiers
 *   - Témoignages cards 3 colonnes
 *   - Zone d'intervention (texte + Maps centré)
 *   - Tarifs indicatifs (transparence)
 *   - Contact + horaires + mention astreinte
 *   - Modal multi-étape (intervention → urgence ? → coordonnées)
 *   - Sticky mobile : tel BIG + WhatsApp + devis
 */
import { detectMetierForStock, getStockPhotosForMetier, getHeroPhotoForMetier } from "./stock-photos";

export type PlombierPremiumProspect = {
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
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "P";
}

type Variant = {
  id: string;
  name: string;
  primary: string;
  accent: string;
  danger: string;
  bg: string;
  cardBg: string;
  fg: string;
  muted: string;
  border: string;
  fontHeading: string;
  fontBody: string;
  fontsImport: string;
  uppercaseHero: boolean;
  heroBgGradient: string;
};

const VARIANTS: Variant[] = [
  {
    id: "bleu-marine-pro",
    name: "Bleu Marine Pro",
    primary: "#1e3a8a",
    accent: "#fbbf24",
    danger: "#dc2626",
    bg: "#f8fafc",
    cardBg: "#ffffff",
    fg: "#0f172a",
    muted: "#f1f5f9",
    border: "#e2e8f0",
    fontHeading: "Barlow Condensed",
    fontBody: "Inter",
    fontsImport: "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap",
    uppercaseHero: true,
    heroBgGradient: "linear-gradient(135deg, #f1f5f9 0%, #e0f2fe 50%, #f8fafc 100%)",
  },
  {
    id: "orange-urgence",
    name: "Orange Urgence",
    primary: "#ea580c",
    accent: "#0a0a0a",
    danger: "#dc2626",
    bg: "#fefce8",
    cardBg: "#ffffff",
    fg: "#1c1917",
    muted: "#fef3c7",
    border: "#fed7aa",
    fontHeading: "Oswald",
    fontBody: "Inter",
    fontsImport: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Oswald:wght@500;600;700&display=swap",
    uppercaseHero: true,
    heroBgGradient: "linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fefce8 100%)",
  },
  {
    id: "vert-eco",
    name: "Vert Éco",
    primary: "#166534",
    accent: "#0891b2",
    danger: "#dc2626",
    bg: "#f0fdf4",
    cardBg: "#ffffff",
    fg: "#052e16",
    muted: "#dcfce7",
    border: "#bbf7d0",
    fontHeading: "Archivo",
    fontBody: "Plus Jakarta Sans",
    fontsImport: "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
    uppercaseHero: false,
    heroBgGradient: "linear-gradient(135deg, #f0fdf4 0%, #cffafe 50%, #ecfeff 100%)",
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
        ["Lundi – Vendredi", "08:00 – 19:00"],
        ["Samedi", "09:00 – 17:00"],
        ["Dimanche", "Astreinte uniquement"],
        ["Urgence 24/7", "Toute l'année"],
      ] as [string, string][];
  return rows.map(([d, h]) => {
    const isAstreinte = /astreinte|urgence|24/i.test(h);
    return `<tr class="border-b last:border-0" style="border-color:${v.border}">
      <td class="py-3 pr-6 font-bold capitalize">${esc(d)}</td>
      <td class="py-3 text-right ${isAstreinte ? "font-bold" : "font-semibold"}" style="color:${isAstreinte ? v.danger : v.primary}">${esc(h)}</td>
    </tr>`;
  }).join("");
}

function pickHeroImage(p: PlombierPremiumProspect): string {
  const dna = p.site_style_dna || {};
  if (dna.heroImageUrl && dna.heroImageUrl.startsWith("http")) return dna.heroImageUrl;
  const photos = (p.website_photos || []).filter(u => typeof u === "string" && u.startsWith("http"));
  if (photos.length) return photos[0];
  const dnaImgs = (dna.allImages || []).filter(u => u.startsWith("http"));
  if (dnaImgs.length) return dnaImgs[0];
  return getHeroPhotoForMetier("plombier");
}

function pickGallery(p: PlombierPremiumProspect, n: number): string[] {
  const dna = p.site_style_dna || {};
  const sources = [
    ...(p.website_photos || []).filter(u => typeof u === "string" && u.startsWith("http")),
    ...((dna.allImages || []).filter(u => u.startsWith("http"))),
  ];
  const uniq = Array.from(new Set(sources)).slice(0, n);
  if (uniq.length >= n) return uniq;
  const fillers = getStockPhotosForMetier("plombier", n - uniq.length);
  return [...uniq, ...fillers].slice(0, n);
}

const INTERVENTIONS = [
  { icon: "💧", title: "Fuite d'eau", desc: "Détection sans casse, réparation sous 2h.", urgent: true },
  { icon: "🚰", title: "Débouchage", desc: "WC, éviers, canalisations. Caméra d'inspection.", urgent: true },
  { icon: "🔥", title: "Chauffe-eau", desc: "Dépannage, remplacement, entretien annuel.", urgent: false },
  { icon: "🚽", title: "WC bouché", desc: "Furet professionnel, remise en service rapide.", urgent: true },
  { icon: "🛁", title: "Salle de bain", desc: "Rénovation complète clé en main. Devis sous 48h.", urgent: false },
  { icon: "🏠", title: "Chaudière", desc: "Installation, entretien, mise aux normes gaz.", urgent: false },
  { icon: "📡", title: "Recherche de fuite", desc: "Caméra thermique, détection acoustique.", urgent: true },
  { icon: "🔧", title: "Sanitaire", desc: "Installation, remplacement, mise en conformité.", urgent: false },
];

const PRICING = [
  { service: "Déplacement + diagnostic", price: "45 €", note: "Gratuit si intervention" },
  { service: "Débouchage WC standard", price: "à partir de 90 €", note: "Forfait main d'œuvre" },
  { service: "Remplacement chauffe-eau", price: "à partir de 480 €", note: "Pose incluse" },
  { service: "Recherche de fuite", price: "à partir de 180 €", note: "Sans casse" },
];

export function generatePlombierPremiumMockupHtml(p: PlombierPremiumProspect): string {
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
  const addressDisplay = p.address ? esc(p.address) : `Intervention à ${city}`;

  // WhatsApp
  const whatsappDigits = phoneDigits.replace(/\D/g, "").replace(/^0/, "33");
  const whatsappUrl = phoneDigits ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Bonjour, j'ai besoin d'un plombier (urgence ou devis) — ${p.name}`)}` : "";

  // Maps
  const mapsQuery = encodeURIComponent(`${p.address || p.name} ${p.city || ""}`);
  const mapsEmbedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const mapsLinkUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  // Hero & galerie
  const heroImg = pickHeroImage(p);
  const gallery = pickGallery(p, 8);

  // Logo
  const logoHtml = dna.logoUrl && dna.logoUrl.startsWith("http")
    ? `<img src="${esc(dna.logoUrl)}" alt="${name}" class="h-11 w-auto max-w-[160px] object-contain"/>`
    : `<div class="w-11 h-11 rounded-xl grid place-items-center font-extrabold text-white text-base shadow-md" style="background:linear-gradient(135deg,${primary},${accent})">${initials(p.name)}</div>`;

  // Stats
  const yearsExp = 8 + (p.id ? p.id.charCodeAt(0) % 20 : 0);
  const interventionsCount = 1500 + (p.id ? (p.id.charCodeAt(1) || 0) * 25 : 0);
  const ratingDisplay = p.google_rating ? p.google_rating.toFixed(1) : "4.9";
  const reviewsCount = p.google_reviews_count || 65 + (p.id ? p.id.charCodeAt(2) % 200 : 0);
  const responseTime = 90 + (p.id ? p.id.charCodeAt(3) % 60 : 0); // 90-150 min

  // About
  const aboutText = p.about_scraped
    ? esc(p.about_scraped.slice(0, 700))
    : `Plombier indépendant à ${city} depuis ${yearsExp} ans, ${name} intervient pour vos urgences plomberie 7j/7 ainsi que vos projets d'installation et de rénovation. Devis gratuit, garantie pièces et main d'œuvre 2 ans, assurance décennale. Nous intervenons partout sur ${city} et dans un rayon de 30 km.`;

  // Reviews top 3 — fallback réalistes plombier
  const reviews = (p.reviews || []).filter(r => r.text && r.text.length > 30).slice(0, 3);
  const fallbackReviews = [
    { author: "Marc P.", text: "Intervention en urgence un dimanche soir pour une fuite, ils étaient là en 45 min. Travail propre, prix correct, je recommande à 200 %.", rating: 5, timeAgo: "il y a 2 semaines" },
    { author: "Sophie L.", text: "Remplacement de mon chauffe-eau qui avait lâché. Devis détaillé sous 24h, pose impeccable, ils ont même nettoyé après. Top.", rating: 5, timeAgo: "il y a 1 mois" },
    { author: "Karim B.", text: "J'ai fait refaire toute ma salle de bain. Chantier livré dans les délais, qualité au RDV, équipe pro et sympa. Je referai appel à eux sans hésiter.", rating: 5, timeAgo: "il y a 3 mois" },
  ];
  const reviewsToShow = reviews.length >= 2 ? reviews : fallbackReviews;

  const hoursHtml = buildHoursTable(p.hours, { ...v, primary });
  const year = new Date().getFullYear();
  const headingTransform = v.uppercaseHero ? "uppercase" : "none";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="${primary}">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>${name} — Plombier ${city} · Urgence 24/7</title>
<meta name="description" content="${name}, plombier à ${city}. Urgence 24/7, devis gratuit, garantie 2 ans. Fuite, débouchage, chauffe-eau, rénovation salle de bain.">
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${v.fontsImport}" rel="stylesheet">
<style>
  :root {
    --primary: ${primary};
    --accent: ${accent};
    --danger: ${v.danger};
    --bg: ${v.bg};
    --card-bg: ${v.cardBg};
    --fg: ${v.fg};
    --muted: ${v.muted};
    --border: ${v.border};
    --font-heading: "${v.fontHeading}", system-ui, sans-serif;
    --font-body: "${v.fontBody}", system-ui, sans-serif;
  }
  html, body { background: var(--bg); color: var(--fg); font-family: var(--font-body); }
  h1, h2, h3, h4 { font-family: var(--font-heading); letter-spacing: -0.01em; font-weight: 800; }
  .heading-uppercase { text-transform: ${headingTransform}; }
  .accent-text { color: var(--primary); }
  .heading-gradient {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
  }
  /* ─── Boutons brutalist ─── */
  .btn-primary {
    background: var(--primary); color: #fff;
    box-shadow: 4px 4px 0 0 ${v.fg};
    transition: transform .12s, box-shadow .12s;
  }
  .btn-primary:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 0 ${v.fg}; }
  .btn-primary:active { transform: translate(0,0); box-shadow: 2px 2px 0 0 ${v.fg}; }
  .btn-danger {
    background: var(--danger); color: #fff;
    box-shadow: 4px 4px 0 0 ${v.fg};
    transition: transform .12s, box-shadow .12s;
  }
  .btn-danger:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 0 ${v.fg}; }
  .btn-ghost {
    background: transparent; color: var(--fg); border: 2px solid var(--fg);
    transition: background .15s, transform .12s;
  }
  .btn-ghost:hover { background: var(--fg); color: ${v.bg}; transform: translateY(-2px); }
  .btn-wa {
    background: #25D366; color: #fff;
    box-shadow: 4px 4px 0 0 ${v.fg};
    transition: transform .12s, box-shadow .12s;
  }
  .btn-wa:hover { transform: translate(-2px,-2px); box-shadow: 6px 6px 0 0 ${v.fg}; }
  /* ─── Cards block ─── */
  .card-block {
    background: var(--card-bg);
    border: 2px solid var(--fg);
    transition: transform .15s, box-shadow .15s, border-color .15s;
  }
  .card-block:hover {
    transform: translate(-3px,-3px);
    box-shadow: 6px 6px 0 0 var(--primary);
  }
  .card-block:active { transform: scale(.985); }
  .urgent-dot {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--danger);
    box-shadow: 0 0 0 4px ${v.danger}30;
    animation: pulse 2s infinite;
  }
  @keyframes pulse {
    0%, 100% { box-shadow: 0 0 0 4px ${v.danger}30; }
    50%      { box-shadow: 0 0 0 8px ${v.danger}15; }
  }
  /* ─── Hero photo Ken Burns ─── */
  @keyframes kenburns {
    0% { transform: scale(1) translate(0,0); }
    50% { transform: scale(1.08) translate(-1%,-1%); }
    100% { transform: scale(1.04) translate(1%,1%); }
  }
  .kenburns { animation: kenburns 22s ease-in-out infinite alternate; }
  /* ─── Block décoratif rotatif (BTP vibe) ─── */
  @keyframes rotate-slow {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  .deco-block { animation: rotate-slow 30s linear infinite; }
  /* ─── Fade-in stagger ─── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-up { opacity: 0; animation: fadeUp .8s cubic-bezier(.2,.8,.2,1) forwards; }
  /* ─── Urgence banner ─── */
  .urgence-banner {
    background: var(--danger); color: #fff;
    box-shadow: 0 4px 12px ${v.danger}40;
  }
  .urgence-banner a { color: #fff; }
  /* ─── Modal ─── */
  .kr-modal-bg { backdrop-filter: blur(12px); background: rgba(0,0,0,.6); padding-bottom: max(16px, env(safe-area-inset-bottom)); }
  .kr-step { display: none; }
  .kr-step.active { display: block; animation: fadeUp .35s ease forwards; }
  /* ─── Sticky FAB mobile ─── */
  .sticky-fab {
    position: fixed; right: max(14px, env(safe-area-inset-right));
    z-index: 50;
    border-radius: 50%;
    display: grid; place-items: center;
    box-shadow: 0 8px 24px rgba(0,0,0,.25), 0 2px 6px rgba(0,0,0,.15);
    transition: transform .15s;
  }
  .sticky-fab:active { transform: scale(.92); }
  .sticky-fab:hover { transform: scale(1.08); }
  @media (min-width: 768px) { .sticky-fab { display: none; } }
  /* ─── Mobile font tuning ─── */
  @media (max-width: 480px) {
    h1 { font-size: clamp(2.6rem, 10vw, 3.4rem) !important; line-height: 1.04 !important; }
    h2 { font-size: clamp(2rem, 7.5vw, 2.6rem) !important; }
  }
  /* ─── A11y motion ─── */
  @media (prefers-reduced-motion: reduce) {
    .kenburns, .deco-block, .urgent-dot, .fade-up { animation: none !important; opacity: 1 !important; }
  }
</style>
</head>
<body class="antialiased overflow-x-hidden">

<!-- ═══════════════════ URGENCE BANNER (sticky top) ═══════════════════ -->
${phoneDisplay ? `<div id="urgence-banner" class="urgence-banner relative z-50 py-2 px-4">
  <div class="max-w-7xl mx-auto flex items-center justify-center gap-2 text-xs sm:text-sm font-bold">
    <span class="urgent-dot"></span>
    <span class="hidden sm:inline">Urgence plomberie ?</span>
    <a href="${phoneLink}" class="underline font-extrabold hover:opacity-90">Appel immédiat ${phoneDisplay}</a>
    <button onclick="this.parentElement.parentElement.style.display='none'" class="absolute right-3 opacity-70 hover:opacity-100" aria-label="Fermer">×</button>
  </div>
</div>` : ""}

<!-- ═══════════════════ HEADER ═══════════════════ -->
<header class="sticky top-0 z-40 backdrop-blur-xl border-b" style="background:${v.bg}ee;border-color:${v.border}">
  <div class="max-w-7xl mx-auto px-4 md:px-5 py-2.5 md:py-3 flex items-center justify-between gap-3">
    <a href="#hero" class="flex items-center gap-2.5 md:gap-3 min-w-0">
      ${logoHtml}
      <div class="min-w-0">
        <div class="font-[var(--font-heading)] heading-uppercase text-base md:text-lg font-extrabold leading-none truncate">${name}</div>
        <div class="text-[10px] md:text-[11px] opacity-60 tracking-widest mt-1 uppercase truncate">Plombier · ${city}</div>
      </div>
    </a>
    <nav class="hidden md:flex items-center gap-7 text-sm font-semibold uppercase tracking-wider shrink-0">
      <a href="#interventions" class="hover:text-[color:var(--primary)] transition">Interventions</a>
      <a href="#tarifs" class="hover:text-[color:var(--primary)] transition">Tarifs</a>
      <a href="#avis" class="hover:text-[color:var(--primary)] transition">Avis</a>
      <a href="#contact" class="hover:text-[color:var(--primary)] transition">Contact</a>
    </nav>
    <a href="${phoneLink}" class="btn-primary px-3.5 py-2 md:px-5 md:py-2.5 rounded-lg text-xs md:text-sm font-extrabold uppercase whitespace-nowrap shrink-0 inline-flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      <span class="hidden sm:inline">Appeler</span>
      <span class="sm:hidden">Tel</span>
    </a>
  </div>
</header>

<!-- ═══════════════════ HERO ═══════════════════ -->
<section id="hero" class="relative overflow-hidden pt-8 pb-14 md:pt-16 md:pb-32" style="background:${v.heroBgGradient}">
  <!-- Décor géométrique BTP -->
  <div class="absolute top-10 right-10 w-48 h-48 opacity-10 pointer-events-none deco-block" style="background:${primary}">
    <div class="w-full h-full" style="background:repeating-linear-gradient(45deg,transparent,transparent 8px,${v.fg}30 8px,${v.fg}30 16px)"></div>
  </div>
  <div class="absolute -bottom-20 -left-20 w-72 h-72 rounded-full opacity-10 pointer-events-none" style="background:${accent}"></div>

  <div class="max-w-7xl mx-auto px-5 grid md:grid-cols-2 gap-10 md:gap-12 items-center relative">
    <div class="fade-up" style="animation-delay:.1s">
      <div class="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-md text-xs font-extrabold uppercase tracking-wider" style="background:${v.danger}15;color:${v.danger}">
        <span class="urgent-dot"></span>
        <span>Disponible 24/7 · ${city}</span>
      </div>
      <h1 class="text-5xl md:text-7xl font-extrabold leading-[1.04] mb-5 heading-uppercase">
        Plombier <span class="heading-gradient">de confiance.</span><br>
        Intervention sous ${responseTime} min.
      </h1>
      <p class="text-lg md:text-xl opacity-80 leading-relaxed mb-7 max-w-xl">
        Dépannage urgence, fuites, débouchage, chauffe-eau, rénovation salle de bain. Devis gratuit, garantie 2 ans pièces et main d'œuvre, assurance décennale.
      </p>

      <div class="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3 mb-8">
        <a href="${phoneLink}" class="btn-danger px-7 py-4 rounded-lg text-base font-extrabold uppercase inline-flex items-center justify-center gap-2.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
          ${phoneDisplay || "Nous appeler"}
        </a>
        <button onclick="krOpen('devis')" class="btn-primary px-7 py-4 rounded-lg text-base font-extrabold uppercase inline-flex items-center justify-center gap-2">
          Devis gratuit
        </button>
        ${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" rel="noopener" class="btn-wa px-6 py-4 rounded-lg text-base font-extrabold uppercase inline-flex items-center justify-center gap-2">
          <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-hidden><path d="M16 0C7.16 0 0 7.16 0 16c0 2.83.74 5.49 2.03 7.79L0 32l8.42-2.21A15.92 15.92 0 0 0 16 32c8.84 0 16-7.16 16-16S24.84 0 16 0zm7.42 19.39c-.4-.2-2.4-1.18-2.77-1.32-.37-.13-.64-.2-.91.2-.27.4-1.05 1.32-1.29 1.59-.24.27-.47.3-.87.1-.4-.2-1.7-.63-3.24-2-1.2-1.07-2-2.39-2.24-2.79-.24-.4-.03-.62.17-.82.18-.18.4-.47.6-.71.2-.24.27-.4.4-.67.13-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.69-.91-.7l-.78-.01c-.27 0-.71.1-1.08.5-.37.4-1.42 1.39-1.42 3.39 0 2 1.45 3.93 1.65 4.2.2.27 2.85 4.35 6.91 6.1.97.42 1.72.67 2.31.86.97.31 1.85.27 2.55.16.78-.12 2.4-.98 2.74-1.93.34-.94.34-1.75.24-1.92-.1-.17-.37-.27-.77-.47z"/></svg>
          WhatsApp
        </a>` : ""}
      </div>

      <!-- Trust badges plombier -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
        ${[
          { emo: "✅", t: "Devis gratuit", s: "Sous 24h" },
          { emo: "🛡️", t: "Garantie 2 ans", s: "Pièces + main d'œuvre" },
          { emo: "⚡", t: `Sous ${responseTime} min`, s: "Sur ${city} et 30km" },
          { emo: "📜", t: "Décennale", s: "Assurance pro" },
        ].map(b => `<div class="flex items-start gap-2.5 text-sm">
          <span class="text-xl shrink-0">${b.emo}</span>
          <div>
            <div class="font-extrabold uppercase tracking-wide leading-tight text-xs sm:text-sm">${b.t}</div>
            <div class="text-xs opacity-65 mt-0.5">${b.s}</div>
          </div>
        </div>`).join("")}
      </div>
    </div>

    <div class="relative fade-up" style="animation-delay:.3s">
      <div class="relative aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5] rounded-2xl overflow-hidden" style="border:3px solid ${v.fg};box-shadow:8px 8px 0 0 ${v.fg}">
        <img src="${esc(heroImg)}" alt="${name}" class="kenburns w-full h-full object-cover" loading="eager"/>
        <div class="absolute inset-0" style="background:linear-gradient(180deg,transparent 40%,${v.fg}60 100%)"></div>
        <div class="absolute bottom-6 left-6 right-6 text-white">
          <div class="text-xs font-extrabold tracking-widest opacity-80 mb-1 uppercase">${city}</div>
          <div class="font-[var(--font-heading)] heading-uppercase text-3xl font-extrabold">${name}</div>
        </div>
      </div>
      <!-- Floating Google rating brutalist -->
      <div class="absolute -bottom-5 -left-4 bg-[color:var(--card-bg)] rounded-lg px-5 py-4 shadow-xl" style="border:3px solid ${v.fg}">
        <div class="flex items-center gap-3">
          <span class="text-3xl font-extrabold" style="color:${primary}">${ratingDisplay}</span>
          <div>
            <div class="text-sm" style="color:${accent}">${"★".repeat(5)}</div>
            <div class="text-xs opacity-70 font-semibold">${reviewsCount} avis Google</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ NOS INTERVENTIONS ═══════════════════ -->
<section id="interventions" class="py-14 md:py-28">
  <div class="max-w-7xl mx-auto px-5">
    <div class="max-w-2xl mb-12">
      <div class="text-sm font-extrabold tracking-widest uppercase mb-3" style="color:${primary}">Nos interventions</div>
      <h2 class="text-4xl md:text-5xl font-extrabold heading-uppercase mb-4">Tout ce qu'un plombier doit savoir <span class="heading-gradient">faire.</span></h2>
      <p class="text-lg opacity-75">${INTERVENTIONS.filter(i => i.urgent).length} interventions d'urgence + ${INTERVENTIONS.filter(i => !i.urgent).length} prestations sur RDV. Une équipe formée, équipée, assurée.</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      ${INTERVENTIONS.map((it, i) => `
      <article class="card-block rounded-xl p-6 fade-up relative" style="animation-delay:${0.05 + i * 0.05}s">
        ${it.urgent ? `<div class="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider" style="color:${v.danger}">
          <span class="urgent-dot"></span>Urgence
        </div>` : ""}
        <div class="text-4xl mb-4">${it.icon}</div>
        <h3 class="text-xl font-extrabold heading-uppercase mb-2">${it.title}</h3>
        <p class="text-sm opacity-75 leading-snug mb-4">${it.desc}</p>
        <button onclick="krOpen('${esc(it.title)}')" class="text-sm font-extrabold uppercase tracking-wide inline-flex items-center gap-1 hover:gap-2 transition-all" style="color:${primary}">
          Demander un devis →
        </button>
      </article>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ POURQUOI NOUS ═══════════════════ -->
<section class="py-14 md:py-28 relative overflow-hidden" style="background:${v.muted}">
  <div class="absolute top-1/2 -right-32 w-96 h-96 rounded-full opacity-5 pointer-events-none" style="background:${primary}"></div>
  <div class="max-w-7xl mx-auto px-5 relative">
    <div class="text-center max-w-2xl mx-auto mb-12">
      <div class="text-sm font-extrabold tracking-widest uppercase mb-3" style="color:${primary}">Pourquoi ${name}</div>
      <h2 class="text-4xl md:text-5xl font-extrabold heading-uppercase">Le plombier <span class="heading-gradient">que vous rappellerez.</span></h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
      ${[
        { num: "01", title: "Tarification claire", desc: "Devis détaillé avant intervention, pas de surprise sur la facture finale." },
        { num: "02", title: "Pros certifiés", desc: `${yearsExp} ans d'expérience, formation continue, équipement de pointe.` },
        { num: "03", title: "Intervention rapide", desc: `En moyenne ${responseTime} min de délai sur ${city} et 30 km autour.` },
        { num: "04", title: "Travail garanti", desc: "Garantie 2 ans pièces et main d'œuvre. Assurance décennale Axa." },
      ].map((p, i) => `
      <div class="card-block rounded-xl p-6 fade-up" style="animation-delay:${0.1 + i * 0.05}s">
        <div class="text-5xl font-extrabold mb-3 opacity-20" style="color:${primary}">${p.num}</div>
        <h3 class="text-xl font-extrabold heading-uppercase mb-2">${p.title}</h3>
        <p class="text-sm opacity-75 leading-relaxed">${p.desc}</p>
      </div>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ STATS BIG ═══════════════════ -->
<section class="py-12 md:py-16">
  <div class="max-w-6xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
    ${[
      { n: yearsExp, suffix: " ans", label: "d'expérience" },
      { n: interventionsCount, suffix: "+", label: "interventions" },
      { n: responseTime, suffix: " min", label: "temps moyen" },
      { n: parseFloat(ratingDisplay), suffix: "/5", label: "note Google", decimals: 1 },
    ].map(s => `
    <div>
      <div class="text-5xl md:text-6xl font-extrabold heading-gradient counter" data-target="${s.n}" data-decimals="${(s as { decimals?: number }).decimals || 0}" data-suffix="${s.suffix}">0${s.suffix}</div>
      <div class="text-sm opacity-70 mt-2 font-semibold uppercase tracking-wide">${s.label}</div>
    </div>`).join("")}
  </div>
</section>

<!-- ═══════════════════ TARIFS INDICATIFS ═══════════════════ -->
<section id="tarifs" class="py-14 md:py-28" style="background:${v.muted}">
  <div class="max-w-5xl mx-auto px-5">
    <div class="text-center max-w-2xl mx-auto mb-10">
      <div class="text-sm font-extrabold tracking-widest uppercase mb-3" style="color:${primary}">Transparence</div>
      <h2 class="text-4xl md:text-5xl font-extrabold heading-uppercase mb-3">Tarifs <span class="heading-gradient">indicatifs.</span></h2>
      <p class="text-base opacity-75">Devis personnalisé sous 24h après visite ou photo. Pas de mauvaise surprise.</p>
    </div>
    <div class="card-block rounded-xl divide-y" style="border-color:${v.fg}">
      ${PRICING.map(t => `
      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-2" style="border-color:${v.border}">
        <div>
          <div class="font-extrabold uppercase tracking-wide text-base">${t.service}</div>
          <div class="text-xs opacity-65 mt-1">${t.note}</div>
        </div>
        <div class="text-xl font-extrabold tabular-nums whitespace-nowrap" style="color:${primary}">${t.price}</div>
      </div>`).join("")}
    </div>
    <div class="text-center mt-8">
      <button onclick="krOpen('devis')" class="btn-primary px-8 py-4 rounded-lg text-base font-extrabold uppercase">
        Demander un devis personnalisé
      </button>
    </div>
  </div>
</section>

<!-- ═══════════════════ GALERIE CHANTIERS ═══════════════════ -->
<section class="py-12 md:py-16">
  <div class="max-w-7xl mx-auto px-5">
    <div class="text-center mb-10">
      <div class="text-sm font-extrabold tracking-widest uppercase mb-3" style="color:${primary}">Réalisations</div>
      <h2 class="text-3xl md:text-4xl font-extrabold heading-uppercase">Nos derniers <span class="heading-gradient">chantiers.</span></h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      ${gallery.slice(0, Math.min(gallery.length, 8)).map(url => `
      <div class="aspect-square overflow-hidden rounded-lg" style="border:2px solid ${v.fg}">
        <img src="${esc(url)}" alt="" class="w-full h-full object-cover hover:scale-110 transition-transform duration-700" loading="lazy" onerror="this.parentElement.style.display='none'"/>
      </div>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ TÉMOIGNAGES ═══════════════════ -->
<section id="avis" class="py-14 md:py-28" style="background:${v.muted}">
  <div class="max-w-7xl mx-auto px-5">
    <div class="text-center max-w-2xl mx-auto mb-12">
      <div class="text-sm font-extrabold tracking-widest uppercase mb-3" style="color:${primary}">Avis vérifiés</div>
      <h2 class="text-4xl md:text-5xl font-extrabold heading-uppercase mb-3">${ratingDisplay}/5 · <span class="heading-gradient">${reviewsCount} avis Google.</span></h2>
      <div class="text-2xl tracking-widest" style="color:${accent}">${"★".repeat(5)}</div>
    </div>
    <div class="grid md:grid-cols-3 gap-5">
      ${reviewsToShow.map(r => `
      <article class="card-block rounded-xl p-6">
        <div class="flex items-center gap-3 mb-3">
          <div class="w-11 h-11 grid place-items-center font-extrabold text-white text-sm" style="background:${primary}">${initials(r.author || "Client")}</div>
          <div>
            <div class="font-extrabold uppercase text-sm leading-tight">${esc(r.author || "Client")}</div>
            <div class="text-xs opacity-60">${esc(r.timeAgo || "récemment")}</div>
          </div>
        </div>
        <div class="text-sm tracking-wider mb-3" style="color:${accent}">${"★".repeat(r.rating || 5)}</div>
        <p class="text-sm leading-relaxed opacity-85">"${esc((r.text || "").slice(0, 220))}${(r.text || "").length > 220 ? "…" : ""}"</p>
      </article>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ ZONE D'INTERVENTION ═══════════════════ -->
<section id="zone" class="py-14 md:py-28">
  <div class="max-w-7xl mx-auto px-5 grid md:grid-cols-2 gap-10 items-center">
    <div>
      <div class="text-sm font-extrabold tracking-widest uppercase mb-3" style="color:${primary}">Zone d'intervention</div>
      <h2 class="text-4xl md:text-5xl font-extrabold heading-uppercase mb-5">Tout ${city} <span class="heading-gradient">et 30 km autour.</span></h2>
      <p class="text-lg leading-relaxed opacity-85 mb-6">${aboutText}</p>
      <ul class="space-y-2.5 text-base font-medium mb-6">
        ${[
          `Intervention urgence 7j/7 sur ${city}`,
          `Déplacement gratuit dans un rayon de 15 km`,
          `Astreinte nuit et week-end pour fuites majeures`,
          `Facture détaillée par mail, paiement CB/virement`,
        ].map(t => `<li class="flex items-start gap-3">
          <span class="mt-2 w-2 h-2 shrink-0" style="background:${primary}"></span>
          <span>${t}</span>
        </li>`).join("")}
      </ul>
      <a href="${mapsLinkUrl}" target="_blank" rel="noopener" class="btn-ghost inline-flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-extrabold uppercase">
        Voir sur Maps →
      </a>
    </div>
    <div class="aspect-[4/3] overflow-hidden rounded-xl" style="border:3px solid ${v.fg};box-shadow:8px 8px 0 0 ${v.fg}">
      <iframe src="${mapsEmbedUrl}" width="100%" height="100%" style="border:0" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>
  </div>
</section>

<!-- ═══════════════════ CONTACT + HORAIRES ═══════════════════ -->
<section id="contact" class="py-14 md:py-28" style="background:${v.muted}">
  <div class="max-w-7xl mx-auto px-5">
    <div class="text-center mb-12">
      <div class="text-sm font-extrabold tracking-widest uppercase mb-3" style="color:${primary}">Contact</div>
      <h2 class="text-4xl md:text-5xl font-extrabold heading-uppercase">Appelez maintenant. <span class="heading-gradient">On arrive.</span></h2>
    </div>
    <div class="grid lg:grid-cols-3 gap-5">
      <div class="card-block rounded-xl p-6">
        <div class="text-xs font-extrabold tracking-widest opacity-60 mb-3 uppercase">Adresse</div>
        <div class="font-extrabold text-lg mb-1 heading-uppercase">${addressDisplay}</div>
        <div class="opacity-70">${city}</div>
        <a href="${mapsLinkUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 mt-3 text-sm font-extrabold uppercase hover:underline" style="color:${primary}">
          Itinéraire →
        </a>
      </div>
      ${phoneDisplay ? `<div class="card-block rounded-xl p-6">
        <div class="text-xs font-extrabold tracking-widest opacity-60 mb-3 uppercase">Téléphone 24/7</div>
        <a href="${phoneLink}" class="font-extrabold text-2xl heading-uppercase hover:opacity-70 transition" style="color:${primary}">${phoneDisplay}</a>
        <div class="text-xs opacity-70 mt-2 font-medium">Urgence : nous décrochons dans la minute.</div>
      </div>` : ""}
      <div class="card-block rounded-xl p-6">
        <div class="text-xs font-extrabold tracking-widest opacity-60 mb-3 uppercase">Horaires</div>
        <table class="w-full text-sm">${hoursHtml}</table>
      </div>
    </div>
    <div class="text-center mt-12 flex flex-col sm:flex-row justify-center gap-3">
      ${phoneDisplay ? `<a href="${phoneLink}" class="btn-danger px-10 py-5 rounded-lg text-lg font-extrabold uppercase inline-flex items-center justify-center gap-3">
        Appeler ${phoneDisplay} →
      </a>` : ""}
      <button onclick="krOpen('devis')" class="btn-primary px-10 py-5 rounded-lg text-lg font-extrabold uppercase">
        Devis gratuit
      </button>
    </div>
  </div>
</section>

<!-- ═══════════════════ FOOTER ═══════════════════ -->
<footer class="py-10 pb-32 md:pb-10 border-t-2" style="border-color:${v.fg}">
  <div class="max-w-7xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
    <div class="flex items-center gap-3">
      ${logoHtml}
      <div>
        <div class="font-extrabold uppercase">${name}</div>
        <div class="opacity-60 text-xs">${city}${phoneDisplay ? ` · ${phoneDisplay}` : ""}</div>
      </div>
    </div>
    <div class="opacity-60 text-xs">
      © ${year} ${name} · Site réalisé par <a href="https://klyora.fr" class="font-extrabold" style="color:${primary}">Klyora</a>
    </div>
  </div>
</footer>

<!-- ═══════════════════ MODAL multi-step ═══════════════════ -->
<div id="kr-modal" class="hidden fixed inset-0 z-50 items-end sm:items-center justify-center kr-modal-bg p-0 sm:p-4 overflow-y-auto" onclick="if(event.target===this) krClose()">
  <div class="bg-[color:var(--card-bg)] rounded-t-2xl sm:rounded-2xl max-w-md w-full relative max-h-[92vh] overflow-y-auto" style="border:3px solid ${v.fg};box-shadow:6px 6px 0 0 ${v.fg}">
    <button onclick="krClose()" class="absolute top-3 right-3 w-9 h-9 rounded-md grid place-items-center hover:opacity-70 z-10 font-bold" style="background:${v.muted}" aria-label="Fermer">×</button>
    <div class="p-6 sm:p-8">
      <div id="kr-title">
        <div class="text-xs font-extrabold tracking-widest uppercase mb-2" style="color:${primary}">Demande</div>
        <h3 class="text-2xl font-extrabold heading-uppercase">Devis en <span class="heading-gradient">2 minutes.</span></h3>
      </div>
      <!-- Progress -->
      <div class="flex gap-1.5 mt-5 mb-6">
        <div class="flex-1 h-1.5 rounded transition" id="kr-prog-1" style="background:${primary}"></div>
        <div class="flex-1 h-1.5 rounded transition" id="kr-prog-2" style="background:${v.muted}"></div>
        <div class="flex-1 h-1.5 rounded transition" id="kr-prog-3" style="background:${v.muted}"></div>
      </div>

      <!-- Step 1 : type d'intervention -->
      <div class="kr-step active" data-step="1">
        <label class="text-sm font-extrabold uppercase tracking-wide block mb-3">1. Type d'intervention</label>
        <div class="grid grid-cols-2 gap-2.5" id="kr-type-grid">
          ${["Fuite d'eau","Débouchage","Chauffe-eau","Chaudière","Rénovation SDB","Autre"].map(o =>
            `<button type="button" data-type="${o}" class="kr-type text-sm font-bold py-3 rounded-md transition" style="border:2px solid ${v.border}">${o}</button>`
          ).join("")}
        </div>
        <button type="button" onclick="krNext()" disabled id="kr-next-1" class="btn-primary w-full mt-6 py-3.5 rounded-lg text-sm font-extrabold uppercase disabled:opacity-40 disabled:cursor-not-allowed">Suivant →</button>
      </div>

      <!-- Step 2 : urgence ? -->
      <div class="kr-step" data-step="2">
        <label class="text-sm font-extrabold uppercase tracking-wide block mb-3">2. C'est urgent ?</label>
        <div class="grid grid-cols-2 gap-2.5" id="kr-urg-grid">
          <button type="button" data-urg="oui" class="kr-urg text-sm font-bold py-4 rounded-md transition" style="border:2px solid ${v.danger};color:${v.danger}">🚨 OUI urgence</button>
          <button type="button" data-urg="non" class="kr-urg text-sm font-bold py-4 rounded-md transition" style="border:2px solid ${v.border}">📅 Sur RDV</button>
        </div>
        <div class="flex gap-3 mt-6">
          <button type="button" onclick="krPrev()" class="btn-ghost px-5 py-3.5 rounded-lg text-sm font-extrabold uppercase">← Retour</button>
          <button type="button" onclick="krNext()" disabled id="kr-next-2" class="btn-primary flex-1 py-3.5 rounded-lg text-sm font-extrabold uppercase disabled:opacity-40 disabled:cursor-not-allowed">Suivant →</button>
        </div>
      </div>

      <!-- Step 3 : coordonnées -->
      <div class="kr-step" data-step="3">
        <form onsubmit="krSubmit(event)" class="space-y-3">
          <label class="text-sm font-extrabold uppercase tracking-wide block">3. Vos coordonnées</label>
          <input type="text" id="kr-name" placeholder="Votre nom" required class="w-full px-4 py-3 rounded-md bg-transparent focus:outline-none font-medium" style="border:2px solid ${v.border}">
          <input type="tel" id="kr-phone" placeholder="Téléphone (on vous rappelle vite)" required class="w-full px-4 py-3 rounded-md bg-transparent focus:outline-none font-medium" style="border:2px solid ${v.border}">
          <input type="text" id="kr-addr" placeholder="Adresse d'intervention" class="w-full px-4 py-3 rounded-md bg-transparent focus:outline-none font-medium" style="border:2px solid ${v.border}">
          <textarea id="kr-msg" rows="3" placeholder="Décrivez le problème (et joignez photo si possible)" class="w-full px-4 py-3 rounded-md bg-transparent focus:outline-none font-medium resize-none" style="border:2px solid ${v.border}"></textarea>
          <div class="flex gap-3 mt-2">
            <button type="button" onclick="krPrev()" class="btn-ghost px-5 py-3.5 rounded-lg text-sm font-extrabold uppercase">← Retour</button>
            <button type="submit" class="btn-primary flex-1 py-3.5 rounded-lg text-sm font-extrabold uppercase">Envoyer ma demande</button>
          </div>
        </form>
      </div>

      <!-- Success -->
      <div id="kr-success" class="hidden text-center py-6">
        <div class="w-16 h-16 mx-auto mb-4 grid place-items-center rounded-lg" style="background:${primary}15">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${primary}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 class="text-2xl font-extrabold uppercase mb-2">Demande envoyée ✓</h3>
        <p class="text-sm opacity-70 leading-relaxed">${phoneDisplay ? `On vous rappelle sous 1h ouvrée. Pour urgence : <a href="${phoneLink}" class="underline font-bold" style="color:${primary}">${phoneDisplay}</a>` : "On vous recontacte rapidement."}</p>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════ STICKY MOBILE FAB ═══════════════════ -->
${phoneDisplay ? `<a href="${phoneLink}" class="sticky-fab" style="bottom:calc(82px + env(safe-area-inset-bottom, 0px));width:64px;height:64px;background:${v.danger}" aria-label="Appeler urgence">
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
</a>` : ""}
${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" rel="noopener" class="sticky-fab" style="bottom:calc(18px + env(safe-area-inset-bottom, 0px));width:56px;height:56px;background:#25D366" aria-label="WhatsApp">
  <svg width="26" height="26" viewBox="0 0 32 32" fill="white" aria-hidden><path d="M16 0C7.16 0 0 7.16 0 16c0 2.83.74 5.49 2.03 7.79L0 32l8.42-2.21A15.92 15.92 0 0 0 16 32c8.84 0 16-7.16 16-16S24.84 0 16 0zm7.42 19.39c-.4-.2-2.4-1.18-2.77-1.32-.37-.13-.64-.2-.91.2-.27.4-1.05 1.32-1.29 1.59-.24.27-.47.3-.87.1-.4-.2-1.7-.63-3.24-2-1.2-1.07-2-2.39-2.24-2.79-.24-.4-.03-.62.17-.82.18-.18.4-.47.6-.71.2-.24.27-.4.4-.67.13-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.69-.91-.7l-.78-.01c-.27 0-.71.1-1.08.5-.37.4-1.42 1.39-1.42 3.39 0 2 1.45 3.93 1.65 4.2.2.27 2.85 4.35 6.91 6.1.97.42 1.72.67 2.31.86.97.31 1.85.27 2.55.16.78-.12 2.4-.98 2.74-1.93.34-.94.34-1.75.24-1.92-.1-.17-.37-.27-.77-.47z"/></svg>
</a>` : ""}

<script>
  /* ── Modal multi-step ── */
  var krStep = 1, krData = {};
  function krOpen(kind) {
    krStep = 1; krData = { type_pref: kind || 'devis' };
    document.getElementById('kr-modal').classList.remove('hidden');
    document.getElementById('kr-modal').classList.add('flex');
    krShow(1);
    document.getElementById('kr-success').classList.add('hidden');
    document.getElementById('kr-title').style.display = '';
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

  document.querySelectorAll('.kr-type').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.kr-type').forEach(function(b){
        b.style.background = ''; b.style.color = ''; b.style.borderColor = '${v.border}';
      });
      btn.style.background = '${primary}'; btn.style.color = '#fff'; btn.style.borderColor = '${primary}';
      krData.type = btn.dataset.type;
      document.getElementById('kr-next-1').disabled = false;
    });
  });
  document.querySelectorAll('.kr-urg').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.kr-urg').forEach(function(b){
        b.style.background = ''; b.style.color = ''; b.style.borderColor = '${v.border}';
      });
      var isUrg = btn.dataset.urg === 'oui';
      btn.style.background = isUrg ? '${v.danger}' : '${primary}';
      btn.style.color = '#fff';
      btn.style.borderColor = isUrg ? '${v.danger}' : '${primary}';
      krData.urgent = btn.dataset.urg;
      document.getElementById('kr-next-2').disabled = false;
    });
  });

  function krSubmit(e){
    e.preventDefault();
    krData.name = document.getElementById('kr-name').value;
    krData.phone = document.getElementById('kr-phone').value;
    krData.address = document.getElementById('kr-addr').value;
    krData.message = document.getElementById('kr-msg').value;
    krData.slug = ${JSON.stringify(slug)};
    fetch('/api/prospect/contact-request', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(krData), keepalive: true
    }).catch(function(){});
    document.querySelectorAll('.kr-step').forEach(function(el){ el.classList.remove('active'); });
    document.getElementById('kr-title').style.display = 'none';
    document.getElementById('kr-success').classList.remove('hidden');
    setTimeout(function(){ krClose(); }, 3500);
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
