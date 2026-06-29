/**
 * Template PREMIUM UNIVERSEL — un seul template qui s'adapte à TOUS les
 * métiers via le module `metier-themes` (16 univers visuels distincts).
 *
 * Remplace `mockup-adaptive.ts` en fallback de /prospects/[slug].
 *
 * Architecture :
 *  - `detectMetierTheme()` → choisit palette + fonts + sections + CTAs
 *  - Sections conditionnelles selon `theme.sections.*`
 *  - CSS custom-properties (--primary, --accent, --font-heading…)
 *  - Tailwind CDN + Google Fonts dynamiques
 *  - Photo hero : DNA scraping > stock par métier
 *  - Modal universel (essai/rdv/devis/commander/contact/brochure)
 *
 * Compatible avec :
 *  - Watermark opt-out (injecté côté route)
 *  - Sales UI bar (injecté côté route)
 *  - Patches runtime (price, hours, promo) déjà en place
 */
import { detectMetierTheme, type MetierTheme } from "./metier-themes";
import { detectMetierForStock, getStockPhotosForMetier, getHeroPhotoForMetier } from "./stock-photos";

export type PremiumProspect = {
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
  menu_items?: Array<{ name: string; price?: string; description?: string }> | null;
  site_style_dna?: {
    logoUrl?: string | null;
    heroImageUrl?: string | null;
    primaryColor?: string | null;
    accentColor?: string | null;
    detectedServices?: Array<{ title: string; description?: string; price?: string }>;
    detectedVehicles?: Array<{ title: string; price?: string; year?: string; km?: string; fuel?: string; image?: string }>;
    allImages?: string[];
  } | null;
};

import { safeEscHtml as esc } from "./html-utils";

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "K";
}

function buildHoursTable(hoursStr: string | null | undefined): string {
  const lines = (hoursStr || "").split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean);
  if (!lines.length) {
    return [
      ["Lundi – Vendredi", "08:00 – 19:00"],
      ["Samedi", "09:00 – 18:00"],
      ["Dimanche", "Fermé"],
    ].map(([d, h]) =>
      `<tr class="border-b border-[color:var(--muted)] last:border-0"><td class="py-3 pr-6 font-medium">${d}</td><td class="py-3 ${h === "Fermé" ? "italic opacity-60" : "font-semibold text-right"}">${h}</td></tr>`
    ).join("\n");
  }
  return lines.map(line => {
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (!m) return `<tr><td colspan="2" class="py-3 opacity-80">${esc(line)}</td></tr>`;
    const day = esc(m[1].trim());
    const hrs = esc(m[2].trim());
    const isClosed = /ferm[ée]/i.test(hrs);
    return `<tr class="border-b border-[color:var(--muted)] last:border-0"><td class="py-3 pr-6 font-medium">${day}</td><td class="py-3 ${isClosed ? "italic opacity-60" : "font-semibold text-right"}">${hrs}</td></tr>`;
  }).join("\n");
}

function buildReviewCards(reviews: PremiumProspect["reviews"]): string {
  const filtered = (reviews || []).filter(r => r.text && r.text.length > 30).slice(0, 3);
  if (filtered.length === 0) return "";
  return filtered.map(r => {
    const stars = "★".repeat(Math.round(r.rating || 5));
    const author = esc(r.author || "Client vérifié");
    const text = esc((r.text || "").slice(0, 220) + ((r.text || "").length > 220 ? "…" : ""));
    const time = esc(r.timeAgo || "récemment");
    return `
<article class="rounded-2xl bg-[color:var(--card-bg)] p-6 ring-1 ring-[color:var(--muted)] hover:ring-[color:var(--accent)]/40 transition">
  <div class="flex items-center justify-between mb-3">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full bg-[color:var(--primary)] text-white grid place-items-center font-bold text-sm">${initials(author)}</div>
      <div>
        <div class="font-semibold leading-tight">${author}</div>
        <div class="text-xs opacity-60">${time}</div>
      </div>
    </div>
    <div class="text-[color:var(--accent)] text-sm tracking-wider">${stars}</div>
  </div>
  <p class="text-sm leading-relaxed opacity-85">${text}</p>
</article>`;
  }).join("\n");
}

function buildServiceCards(services: Array<{ title: string; description?: string; price?: string }> | undefined, fallback: { title: string; desc: string; icon: string }[]): string {
  const detected = services || [];
  const items = detected.length >= 3 ? detected.slice(0, 6).map(s => ({
    title: s.title, desc: s.description || "Service proposé sur rendez-vous.", price: s.price, icon: "★",
  })) : fallback.map(f => ({ title: f.title, desc: f.desc, price: undefined, icon: f.icon }));

  return items.map(s => `
<div class="group rounded-2xl bg-[color:var(--card-bg)] p-7 ring-1 ring-[color:var(--muted)] hover:ring-[color:var(--primary)]/40 transition relative overflow-hidden">
  <div class="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-[color:var(--primary)]/5 group-hover:scale-150 transition-transform duration-500"></div>
  <div class="relative">
    <div class="w-12 h-12 rounded-xl bg-[color:var(--primary)]/10 text-[color:var(--primary)] grid place-items-center text-xl mb-4">${s.icon}</div>
    <h3 class="font-[var(--font-heading)] text-xl font-bold mb-2">${esc(s.title)}</h3>
    <p class="text-sm opacity-75 leading-relaxed mb-3">${esc(s.desc)}</p>
    ${s.price ? `<div class="text-sm font-semibold text-[color:var(--primary)]">${esc(s.price)}</div>` : ""}
  </div>
</div>`).join("\n");
}

function buildMenuCards(items: PremiumProspect["menu_items"]): string {
  const list = (items || []).slice(0, 6);
  if (list.length === 0) return "";
  return list.map(it => `
<div class="flex items-baseline gap-4 py-4 border-b border-[color:var(--muted)] last:border-0">
  <div class="flex-1">
    <div class="font-[var(--font-heading)] text-lg font-semibold">${esc(it.name)}</div>
    ${it.description ? `<div class="text-sm opacity-70 mt-1">${esc(it.description)}</div>` : ""}
  </div>
  ${it.price ? `<div class="font-bold text-[color:var(--primary)] tabular-nums">${esc(it.price)}</div>` : ""}
</div>`).join("\n");
}

/** Hero : stock photos curées du métier détecté (qualité garantie,
 * pas de logo scrappé en gros qui défigure le site). */
function pickHeroImage(p: PremiumProspect): string {
  const metier = detectMetierForStock(`${p.business_type || ""} ${p.name}`);
  const stock = getStockPhotosForMetier(metier, 10);
  const idx = p.id ? (p.id.charCodeAt(1) || 0) % stock.length : 0;
  return stock[idx] || getHeroPhotoForMetier(metier);
}

function pickGalleryImages(p: PremiumProspect, n: number): string[] {
  const dna = p.site_style_dna || {};
  const sources = [
    ...(p.website_photos || []).filter(u => typeof u === "string" && u.startsWith("http")),
    ...((dna.allImages || []).filter(u => u.startsWith("http"))),
  ];
  const uniq = Array.from(new Set(sources)).slice(0, n);
  if (uniq.length >= n) return uniq;
  const metier = detectMetierForStock(`${p.business_type || ""} ${p.name}`);
  const fillers = getStockPhotosForMetier(metier, n - uniq.length);
  return [...uniq, ...fillers].slice(0, n);
}

/**
 * Fallback services par vibe — utilisé si le DNA n'a pas détecté assez de services.
 */
function fallbackServices(theme: MetierTheme): { title: string; desc: string; icon: string }[] {
  const map: Record<MetierTheme["vibe"], { title: string; desc: string; icon: string }[]> = {
    "dark-racing": [
      { title: "Achat & vente", desc: "Véhicules sélectionnés, contrôlés 50 points, garantie incluse.", icon: "🚗" },
      { title: "Essai gratuit", desc: "Réservez votre essai en 30 secondes, livraison possible.", icon: "🔑" },
      { title: "Financement", desc: "Crédit sur place sous 48h, reprise de votre ancien véhicule.", icon: "💳" },
    ],
    "rainbow-floral": [
      { title: "Bouquets sur mesure", desc: "Composition à la minute, livraison locale, fleurs fraîches du marché.", icon: "💐" },
      { title: "Événements", desc: "Mariages, baptêmes, deuils, événements pros. Devis gratuit sous 24h.", icon: "💒" },
      { title: "Abonnement bureaux", desc: "Livraison hebdo de bouquets pour entreprises, formule clé en main.", icon: "🏢" },
    ],
    "warm-artisan": [
      { title: "Pains au levain", desc: "Levain naturel, longue fermentation, farines bio locales.", icon: "🥖" },
      { title: "Viennoiseries", desc: "Beurre AOP, feuilletage maison, croissants tout chauds le matin.", icon: "🥐" },
      { title: "Pâtisseries événements", desc: "Pièces montées, gâteaux d'anniversaire, commandes sur mesure.", icon: "🎂" },
    ],
    "warm-food": [
      { title: "Cafés de spécialité", desc: "Sélection de torréfacteurs français, mouture à la commande.", icon: "☕" },
      { title: "Brunch & pâtisseries", desc: "Brunch tous les week-ends, pâtisseries maison renouvelées.", icon: "🥞" },
      { title: "Espace cocooning", desc: "Wi-Fi gratuit, prises, terrasse l'été. Idéal pour télétravailler.", icon: "💻" },
    ],
    "cinematic-luxury": [
      { title: "Cuisine de marché", desc: "Carte renouvelée à chaque saison, produits frais sélectionnés.", icon: "🍽️" },
      { title: "Cave de prestige", desc: "Sélection de vins natures et grands crus accordés par le sommelier.", icon: "🍷" },
      { title: "Privatisation", desc: "Salle privative pour vos événements, menus dégustation sur mesure.", icon: "🥂" },
    ],
    "fashion-bold": [
      { title: "Coupe & coiffage", desc: "Diagnostic capillaire personnalisé, produits haut de gamme.", icon: "✂️" },
      { title: "Couleur experte", desc: "Balayage, ombré hair, gloss. Techniques douces respectueuses.", icon: "🎨" },
      { title: "Soins & rituels", desc: "Soin profond Kérastase, rituel détox cuir chevelu.", icon: "💆" },
    ],
    "soft-wellness": [
      { title: "Soins visage", desc: "Diagnostic peau personnalisé, protocoles haute exigence.", icon: "✨" },
      { title: "Massages signature", desc: "Modelage californien, drainage lymphatique, ayurvédique.", icon: "🌿" },
      { title: "Onglerie & beauté", desc: "Manucure semi-permanente, pose résine, soins des mains.", icon: "💅" },
    ],
    "medical-trust": [
      { title: "Consultations", desc: "Bilans complets, suivi régulier, prise en charge personnalisée.", icon: "🩺" },
      { title: "Urgences douleur", desc: "Créneaux d'urgence réservés, prise en charge sous 24h.", icon: "🆘" },
      { title: "Prévention", desc: "Programme de suivi, conseils ergonomie, exercices à domicile.", icon: "📋" },
    ],
    "brutalist-btp": [
      { title: "Dépannage urgent", desc: "Intervention sous 2h en zone d'intervention. Devis gratuit.", icon: "🔧" },
      { title: "Rénovation complète", desc: "Études, plans, exécution. Maître d'œuvre de A à Z.", icon: "🏗️" },
      { title: "Installation neuve", desc: "Mise en conformité, garantie décennale, factures certifiées.", icon: "⚙️" },
    ],
    "light-joyful": [
      { title: "Produits frais", desc: "Sélection quotidienne des meilleurs producteurs locaux.", icon: "🥬" },
      { title: "Commande sur mesure", desc: "Paniers thématiques, livraison à domicile.", icon: "📦" },
      { title: "Conseils & dégustation", desc: "Conseils personnalisés, dégustations gratuites en boutique.", icon: "👨‍🍳" },
    ],
  };
  return map[theme.vibe] || map["light-joyful"];
}

export function generatePremiumUniversalMockupHtml(p: PremiumProspect): string {
  const theme = detectMetierTheme({ businessType: p.business_type, name: p.name, slug: p.slug });
  const dna = p.site_style_dna || {};

  const name = esc(p.name);
  const slug = esc(p.slug);
  const city = esc(p.city || "votre ville");
  const phoneDisplay = esc(p.phone || "");
  const phoneDigits = (p.phone || "").replace(/[^\d+]/g, "");
  const phoneLink = phoneDigits ? `tel:${phoneDigits.replace(/^33/, "+33").replace(/^0/, "+33")}` : "#contact";
  const addressDisplay = p.address ? esc(p.address) : `Adresse à ${city}`;
  const emailDisplay = esc(p.email || `contact@${(p.website || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/.*$/, "") || "klyora.fr"}`);

  // WhatsApp
  const whatsappDigits = phoneDigits.replace(/\D/g, "").replace(/^0/, "33");
  const whatsappUrl = phoneDigits ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Bonjour, je suis intéressé par vos services chez ${p.name}.`)}` : "";

  // Maps
  const mapsQuery = encodeURIComponent(`${p.address || p.name} ${p.city || ""}`);
  const mapsEmbedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const mapsLinkUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  // Couleurs (DNA scraping en priorité si présent et non foireux)
  const dnaPrimary = (dna.primaryColor || "").startsWith("#") ? dna.primaryColor! : null;
  const dnaAccent = (dna.accentColor || "").startsWith("#") ? dna.accentColor! : null;
  const primary = dnaPrimary || theme.palette.primary;
  const accent = dnaAccent || theme.palette.accent;
  const bg = theme.palette.background;
  const fg = theme.palette.foreground;
  const cardBg = theme.palette.cardBg;
  const muted = theme.palette.muted;
  const isDark = theme.mode === "dark";

  // Hero & galerie
  const heroImg = pickHeroImage(p);
  const gallery = pickGalleryImages(p, 6);

  // Logo
  const logoHtml = dna.logoUrl && dna.logoUrl.startsWith("http")
    ? `<img src="${esc(dna.logoUrl)}" alt="${name}" class="h-10 w-auto max-w-[140px] object-contain"/>`
    : `<div class="w-10 h-10 rounded-xl grid place-items-center font-bold text-white text-sm" style="background:${primary}">${initials(p.name)}</div>`;

  // Stats
  const yearsExp = 8 + (p.id ? p.id.charCodeAt(0) % 18 : 0);
  const reviewsCount = p.google_reviews_count || 47 + (p.id ? p.id.charCodeAt(1) % 250 : 0);
  const ratingDisplay = p.google_rating ? p.google_rating.toFixed(1) : "4.9";

  // Sections conditionnelles
  const showServices = theme.sections.showServices || theme.sections.showPortfolio;
  const showMenu = theme.sections.showMenu && (p.menu_items || []).length > 0;
  const services = fallbackServices(theme);
  const detectedSv = dna.detectedServices;
  const servicesHtml = showServices ? buildServiceCards(detectedSv, services) : "";
  const menuHtml = showMenu ? buildMenuCards(p.menu_items) : "";
  const reviewsHtml = buildReviewCards(p.reviews);
  const hoursHtml = buildHoursTable(p.hours);

  // Hero headline du theme
  const heroH = theme.hero;
  const headlineTransform = theme.fonts.displayTransform === "uppercase" ? "uppercase" : "none";

  // CTA labels du theme
  const ctaPrimary = theme.cta.primary;
  const ctaSecondary = theme.cta.secondary;
  const modalTypeMap: Record<string, string> = {
    essai: "Réserver un essai",
    rdv: "Prendre rendez-vous",
    devis: "Demander un devis",
    commander: "Passer commande",
    contact: "Nous contacter",
    brochure: "Recevoir la brochure",
  };
  const modalSubmitLabel = modalTypeMap[ctaPrimary.modalType] || "Envoyer";

  // About text
  const aboutText = p.about_scraped
    ? esc(p.about_scraped.slice(0, 600))
    : `Depuis ${yearsExp} ans, ${name}${p.city ? ` à ${city}` : ""} accompagne ses clients avec un savoir-faire reconnu et une exigence de qualité absolue. Chaque prestation est pensée pour vous offrir une expérience à la hauteur de vos attentes.`;

  // Vibe-specific decorations
  const heroMeshBg = theme.effects.heroMesh
    ? `background:
         radial-gradient(at 20% 30%, ${primary}40 0px, transparent 50%),
         radial-gradient(at 80% 0%, ${accent}30 0px, transparent 50%),
         radial-gradient(at 0% 100%, ${primary}30 0px, transparent 50%),
         ${bg};`
    : `background: ${bg};`;
  const rainbowGradient = theme.effects.rainbowGradient
    ? `background: linear-gradient(135deg, ${primary} 0%, ${accent} 50%, ${theme.palette.secondary || primary} 100%);`
    : "";
  const fontImportTag = `<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${theme.fonts.importUrl}" rel="stylesheet">`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${name} — ${theme.label}</title>
<meta name="description" content="${name}${p.city ? ` à ${city}` : ""} — ${esc(heroH.subtitle)}">
<script src="https://cdn.tailwindcss.com"></script>
${fontImportTag}
<style>
  :root {
    --primary: ${primary};
    --accent: ${accent};
    --bg: ${bg};
    --fg: ${fg};
    --card-bg: ${cardBg};
    --muted: ${muted};
    --font-heading: "${theme.fonts.heading}", serif;
    --font-body: "${theme.fonts.body}", system-ui, sans-serif;
  }
  html, body { background: var(--bg); color: var(--fg); font-family: var(--font-body); }
  h1, h2, h3, h4 { font-family: var(--font-heading); letter-spacing: -0.02em; }
  .hero-mesh { ${heroMeshBg} }
  ${theme.effects.bouncyHover ? `.bouncy:hover { transform: translateY(-4px) scale(1.02); }` : ""}
  ${theme.effects.softShadows ? `.soft-shadow { box-shadow: 0 1px 2px rgba(0,0,0,.04), 0 12px 32px rgba(0,0,0,.06); }` : ""}
  ${theme.effects.sharpTransitions ? `* { transition-duration: 100ms !important; }` : ""}
  .gradient-text { ${rainbowGradient || `background: ${primary};`} -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
  .btn-primary { background: ${primary}; color: ${isDark ? "#fff" : "#fff"}; }
  .btn-primary:hover { filter: brightness(1.1); transform: translateY(-1px); }
  .btn-secondary { background: transparent; color: ${fg}; border: 1.5px solid ${isDark ? "rgba(255,255,255,.2)" : "rgba(0,0,0,.12)"}; }
  .btn-secondary:hover { background: ${isDark ? "rgba(255,255,255,.05)" : "rgba(0,0,0,.04)"}; }
  ${theme.effects.serifItalic ? `.serif-italic { font-style: italic; font-family: var(--font-heading); }` : ""}
  .kr-modal-bg { backdrop-filter: blur(8px); background: rgba(0,0,0,.6); }
</style>
</head>
<body class="antialiased">

<!-- ═══════════════════ HEADER ═══════════════════ -->
<header class="sticky top-0 z-40 backdrop-blur-lg bg-[color:var(--bg)]/85 border-b border-[color:var(--muted)]">
  <div class="max-w-7xl mx-auto px-5 py-3 flex items-center justify-between">
    <a href="#hero" class="flex items-center gap-3">
      ${logoHtml}
      <span class="font-[var(--font-heading)] text-lg font-bold tracking-tight">${name}</span>
    </a>
    <nav class="hidden md:flex items-center gap-7 text-sm font-medium opacity-90">
      <a href="#services" class="hover:opacity-100 hover:text-[color:var(--primary)] transition">Services</a>
      <a href="#avis" class="hover:opacity-100 hover:text-[color:var(--primary)] transition">Avis</a>
      <a href="#contact" class="hover:opacity-100 hover:text-[color:var(--primary)] transition">Contact</a>
    </nav>
    <button onclick="krOpen()" class="btn-primary px-5 py-2.5 rounded-full text-sm font-semibold">${esc(ctaPrimary.label)}</button>
  </div>
</header>

<!-- ═══════════════════ HERO ═══════════════════ -->
<section id="hero" class="hero-mesh relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32">
  <div class="max-w-7xl mx-auto px-5 grid md:grid-cols-2 gap-12 items-center relative">
    <div>
      <div class="inline-flex items-center gap-2 mb-6 px-3 py-1.5 rounded-full text-xs font-semibold bg-[color:var(--primary)]/10 text-[color:var(--primary)]">
        <span>${heroH.emoji}</span>
        <span>${esc(theme.label)} · ${city}</span>
      </div>
      <h1 class="text-5xl md:text-7xl font-bold leading-[1.05] mb-6" style="text-transform:${headlineTransform}">
        ${esc(heroH.headlinePre)} <span class="gradient-text${theme.effects.serifItalic ? " serif-italic" : ""}">${esc(heroH.headlinePost)}</span>
      </h1>
      <p class="text-lg md:text-xl opacity-80 leading-relaxed mb-8 max-w-xl">${esc(heroH.subtitle)}</p>

      <div class="flex flex-wrap items-center gap-4 mb-8">
        <button onclick="krOpen()" class="btn-primary px-7 py-4 rounded-full text-base font-semibold inline-flex items-center gap-2">
          ${esc(ctaPrimary.label)} →
        </button>
        ${ctaSecondary ? `<button onclick="krOpen()" class="btn-secondary px-7 py-4 rounded-full text-base font-semibold">${esc(ctaSecondary.label)}</button>` : ""}
        ${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" rel="noopener" class="px-7 py-4 rounded-full text-base font-semibold inline-flex items-center gap-2" style="background:#25D366;color:#fff">
          <svg width="18" height="18" viewBox="0 0 32 32" fill="currentColor" aria-hidden><path d="M16 0C7.16 0 0 7.16 0 16c0 2.83.74 5.49 2.03 7.79L0 32l8.42-2.21A15.92 15.92 0 0 0 16 32c8.84 0 16-7.16 16-16S24.84 0 16 0zm0 29.33c-2.5 0-4.83-.67-6.83-1.83l-.5-.29-5 1.32 1.34-4.88-.32-.5A13.28 13.28 0 0 1 2.67 16C2.67 8.65 8.65 2.67 16 2.67S29.33 8.65 29.33 16 23.35 29.33 16 29.33zm7.42-9.94c-.4-.2-2.4-1.18-2.77-1.32-.37-.13-.64-.2-.91.2-.27.4-1.05 1.32-1.29 1.59-.24.27-.47.3-.87.1-.4-.2-1.7-.63-3.24-2-.12-.11-2.07-2.07-2.07-2.07-.12-.13-1.04-1.04-1.04-1.04-.27-.27-.03-.42.18-.62.18-.18.4-.47.6-.71.2-.24.27-.4.4-.67.13-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.69-.91-.7l-.78-.01c-.27 0-.71.1-1.08.5-.37.4-1.42 1.39-1.42 3.39 0 2 1.45 3.93 1.65 4.2.2.27 2.85 4.35 6.91 6.1.97.42 1.72.67 2.31.86.97.31 1.85.27 2.55.16.78-.12 2.4-.98 2.74-1.93.34-.94.34-1.75.24-1.92-.1-.17-.37-.27-.77-.47z"/></svg>
          WhatsApp
        </a>` : ""}
      </div>

      <!-- Trust badges -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
        ${["⭐", "🛡️", "⚡", "🤝"].map((emo, i) => {
          const labels = [
            `${ratingDisplay}/5 · ${reviewsCount} avis`,
            `${yearsExp} ans d'expérience`,
            "Réponse < 24h",
            "Devis gratuit",
          ];
          return `<div class="flex items-center gap-2 text-sm">
            <span class="text-xl">${emo}</span>
            <span class="font-medium opacity-90">${labels[i]}</span>
          </div>`;
        }).join("")}
      </div>
    </div>

    <div class="relative">
      <div class="relative aspect-[4/5] rounded-3xl overflow-hidden ${theme.effects.softShadows ? "soft-shadow" : "shadow-2xl"}">
        <img src="${heroImg}" alt="${name}" class="w-full h-full object-cover" loading="eager"/>
        <div class="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
        <div class="absolute bottom-6 left-6 right-6 text-white">
          <div class="text-xs font-semibold tracking-wider opacity-80 mb-1">${city.toUpperCase()}</div>
          <div class="font-[var(--font-heading)] text-2xl font-bold">${name}</div>
        </div>
      </div>
      <!-- Floating badge -->
      <div class="absolute -bottom-6 -left-6 bg-[color:var(--card-bg)] rounded-2xl p-4 ${theme.effects.softShadows ? "soft-shadow" : "shadow-xl"} ring-1 ring-[color:var(--muted)] hidden md:block">
        <div class="text-xs font-semibold opacity-60 mb-1">Note Google</div>
        <div class="flex items-center gap-2">
          <span class="text-2xl font-bold text-[color:var(--accent)]">${ratingDisplay}</span>
          <div>
            <div class="text-[color:var(--accent)] text-sm">${"★".repeat(5)}</div>
            <div class="text-xs opacity-60">${reviewsCount} avis</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ SERVICES / PRESTATIONS ═══════════════════ -->
${showServices ? `
<section id="services" class="py-20 md:py-28">
  <div class="max-w-7xl mx-auto px-5">
    <div class="max-w-2xl mb-12">
      <div class="text-sm font-semibold tracking-wider text-[color:var(--primary)] uppercase mb-3">Nos prestations</div>
      <h2 class="text-4xl md:text-5xl font-bold mb-4">Ce que nous faisons<span class="gradient-text${theme.effects.serifItalic ? " serif-italic" : ""}"> pour vous</span>.</h2>
      <p class="text-lg opacity-75">Une offre complète pensée pour vous offrir le meilleur, avec la qualité et l'exigence qui font notre réputation.</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      ${servicesHtml}
    </div>
  </div>
</section>
` : ""}

<!-- ═══════════════════ MENU (resto/boulangerie/café) ═══════════════════ -->
${showMenu ? `
<section id="menu" class="py-20 md:py-28 bg-[color:var(--card-bg)]">
  <div class="max-w-4xl mx-auto px-5">
    <div class="text-center mb-12">
      <div class="text-sm font-semibold tracking-wider text-[color:var(--primary)] uppercase mb-3">Notre carte</div>
      <h2 class="text-4xl md:text-5xl font-bold">Une sélection<span class="gradient-text${theme.effects.serifItalic ? " serif-italic" : ""}"> du chef</span>.</h2>
    </div>
    <div class="bg-[color:var(--bg)] rounded-3xl p-8 md:p-12 ring-1 ring-[color:var(--muted)]">
      ${menuHtml}
    </div>
  </div>
</section>
` : ""}

<!-- ═══════════════════ À PROPOS + GALERIE ═══════════════════ -->
<section id="about" class="py-20 md:py-28 bg-[color:var(--card-bg)]">
  <div class="max-w-7xl mx-auto px-5 grid md:grid-cols-2 gap-12 items-center">
    <div>
      <div class="text-sm font-semibold tracking-wider text-[color:var(--primary)] uppercase mb-3">À propos</div>
      <h2 class="text-4xl md:text-5xl font-bold mb-6">${name}<span class="gradient-text${theme.effects.serifItalic ? " serif-italic" : ""}">, depuis toujours.</span></h2>
      <p class="text-lg opacity-80 leading-relaxed mb-8">${aboutText}</p>
      <div class="grid grid-cols-3 gap-6 pt-6 border-t border-[color:var(--muted)]">
        <div>
          <div class="text-3xl font-bold text-[color:var(--primary)]">${yearsExp}+</div>
          <div class="text-sm opacity-70">années d'exp.</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-[color:var(--primary)]">${reviewsCount}</div>
          <div class="text-sm opacity-70">clients satisfaits</div>
        </div>
        <div>
          <div class="text-3xl font-bold text-[color:var(--primary)]">${ratingDisplay}/5</div>
          <div class="text-sm opacity-70">note Google</div>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-2 gap-3">
      ${gallery.slice(0, 4).map((url, i) => `
        <div class="aspect-square rounded-2xl overflow-hidden ${i === 0 ? "row-span-2 aspect-[1/2]" : ""}">
          <img src="${esc(url)}" alt="" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy"/>
        </div>
      `).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ AVIS GOOGLE ═══════════════════ -->
${reviewsHtml ? `
<section id="avis" class="py-20 md:py-28">
  <div class="max-w-7xl mx-auto px-5">
    <div class="text-center mb-12">
      <div class="text-sm font-semibold tracking-wider text-[color:var(--primary)] uppercase mb-3">Ils nous ont fait confiance</div>
      <h2 class="text-4xl md:text-5xl font-bold mb-3">${ratingDisplay}/5 · ${reviewsCount} avis Google</h2>
      <div class="text-[color:var(--accent)] text-2xl tracking-widest">${"★".repeat(5)}</div>
    </div>
    <div class="grid md:grid-cols-3 gap-5">
      ${reviewsHtml}
    </div>
  </div>
</section>
` : ""}

<!-- ═══════════════════ CONTACT + MAPS + HORAIRES ═══════════════════ -->
<section id="contact" class="py-20 md:py-28 bg-[color:var(--card-bg)]">
  <div class="max-w-7xl mx-auto px-5">
    <div class="text-center mb-12">
      <div class="text-sm font-semibold tracking-wider text-[color:var(--primary)] uppercase mb-3">Nous rendre visite</div>
      <h2 class="text-4xl md:text-5xl font-bold">${esc(ctaPrimary.label)}<span class="gradient-text${theme.effects.serifItalic ? " serif-italic" : ""}"> aujourd'hui</span>.</h2>
    </div>
    <div class="grid lg:grid-cols-2 gap-10">
      <div class="space-y-6">
        <div class="rounded-2xl bg-[color:var(--bg)] p-6 ring-1 ring-[color:var(--muted)]">
          <div class="text-xs font-bold tracking-wider opacity-60 mb-2">ADRESSE</div>
          <div class="font-semibold text-lg mb-1">${addressDisplay}</div>
          <div class="opacity-70">${city}</div>
          <a href="${mapsLinkUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 mt-3 text-sm font-semibold text-[color:var(--primary)] hover:underline">
            Itinéraire vers ${name} →
          </a>
        </div>
        ${phoneDisplay ? `<div class="rounded-2xl bg-[color:var(--bg)] p-6 ring-1 ring-[color:var(--muted)]">
          <div class="text-xs font-bold tracking-wider opacity-60 mb-2">TÉLÉPHONE</div>
          <a href="${phoneLink}" class="font-semibold text-xl hover:text-[color:var(--primary)] transition">${phoneDisplay}</a>
        </div>` : ""}
        <div class="rounded-2xl bg-[color:var(--bg)] p-6 ring-1 ring-[color:var(--muted)]">
          <div class="text-xs font-bold tracking-wider opacity-60 mb-3">HORAIRES</div>
          <table class="w-full text-sm">${hoursHtml}</table>
        </div>
      </div>
      <div class="rounded-2xl overflow-hidden ring-1 ring-[color:var(--muted)] min-h-[400px]">
        <iframe src="${mapsEmbedUrl}" width="100%" height="100%" style="border:0;min-height:400px" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </div>
    <div class="text-center mt-12">
      <button onclick="krOpen()" class="btn-primary px-10 py-5 rounded-full text-lg font-semibold inline-flex items-center gap-3">
        ${esc(ctaPrimary.label)} →
      </button>
    </div>
  </div>
</section>

<!-- ═══════════════════ FOOTER ═══════════════════ -->
<footer class="py-10 border-t border-[color:var(--muted)] text-sm">
  <div class="max-w-7xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4">
    <div class="flex items-center gap-3">
      ${logoHtml}
      <div>
        <div class="font-bold">${name}</div>
        <div class="opacity-60">${city}${phoneDisplay ? ` · ${phoneDisplay}` : ""}</div>
      </div>
    </div>
    <div class="opacity-60 text-xs">
      © ${new Date().getFullYear()} ${name} · Site réalisé par <a href="https://klyora.fr" class="text-[color:var(--primary)] font-semibold">Klyora</a>
    </div>
  </div>
</footer>

<!-- ═══════════════════ MODAL CTA ═══════════════════ -->
<div id="kr-modal" class="hidden fixed inset-0 z-50 items-center justify-center kr-modal-bg p-5" onclick="if(event.target===this) krClose()">
  <div class="bg-[color:var(--card-bg)] rounded-3xl p-8 max-w-md w-full ring-1 ring-[color:var(--muted)] relative">
    <button onclick="krClose()" class="absolute top-4 right-4 w-8 h-8 rounded-full bg-[color:var(--muted)] grid place-items-center hover:opacity-80" aria-label="Fermer">×</button>
    <h3 class="font-[var(--font-heading)] text-2xl font-bold mb-2">${esc(ctaPrimary.label)}</h3>
    <p class="text-sm opacity-70 mb-6">Laissez-nous vos coordonnées, nous vous recontactons sous 24h.</p>
    <form onsubmit="krSubmit(event)" class="space-y-3">
      <input type="text" name="name" placeholder="Votre nom" required class="w-full px-4 py-3 rounded-xl bg-[color:var(--bg)] border border-[color:var(--muted)] focus:border-[color:var(--primary)] outline-none text-sm">
      <input type="tel" name="phone" placeholder="Téléphone" required class="w-full px-4 py-3 rounded-xl bg-[color:var(--bg)] border border-[color:var(--muted)] focus:border-[color:var(--primary)] outline-none text-sm">
      <textarea name="message" placeholder="Votre message (facultatif)" rows="3" class="w-full px-4 py-3 rounded-xl bg-[color:var(--bg)] border border-[color:var(--muted)] focus:border-[color:var(--primary)] outline-none text-sm"></textarea>
      <button type="submit" class="btn-primary w-full px-6 py-3.5 rounded-full text-sm font-semibold">${esc(modalSubmitLabel)}</button>
    </form>
    <div id="kr-success" class="hidden text-center pt-4">
      <div class="text-5xl mb-3">✓</div>
      <div class="font-bold text-lg mb-1">Demande envoyée</div>
      <div class="text-sm opacity-70">Nous vous recontactons sous 24h.</div>
    </div>
  </div>
</div>

<script>
  function krOpen(){ var m=document.getElementById('kr-modal'); m.classList.remove('hidden'); m.classList.add('flex'); }
  function krClose(){ var m=document.getElementById('kr-modal'); m.classList.add('hidden'); m.classList.remove('flex'); }
  function krSubmit(e){
    e.preventDefault();
    var form = e.target;
    var data = { slug: ${JSON.stringify(slug)}, name: form.name.value, phone: form.phone.value, message: form.message.value, type: ${JSON.stringify(ctaPrimary.modalType)} };
    fetch('/api/prospect/contact-request', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(data), keepalive: true }).catch(function(){});
    form.style.display = 'none';
    document.getElementById('kr-success').classList.remove('hidden');
    setTimeout(function(){ krClose(); form.style.display = ''; document.getElementById('kr-success').classList.add('hidden'); form.reset(); }, 2500);
  }
</script>

</body>
</html>`;
}
