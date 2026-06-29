/**
 * Template ELECTRICIEN PREMIUM — univers tech/néon, niveau au-dessus du
 * plombier. 14 prospects en DB.
 *
 * 3 variants palette (p.id.charCodeAt(0) % 3) :
 *   A "Néon Jaune"  noir profond + jaune électrique + cyan néon (Inter Black)
 *   B "Cuivre Pro"  anthracite + cuivre brossé + crème (Archivo)
 *   C "Tech Bleu"   bleu nuit + cyan néon + blanc (Space Grotesk)
 *
 * Sections nouvelles vs plombier :
 *   - Animation SVG "courant électrique" sur le hero
 *   - FAQ accordéon interactif
 *   - Mini calculateur de devis (surface + type → estimation)
 *   - Badges certifications (Qualifelec / RGE / Consuel)
 *   - Carrousel témoignages avec contrôles (au lieu de marquee)
 *   - Compteur urgences "en ligne maintenant" pulse animé
 *   - Modal avec upload photo
 *
 * Toutes les optims mobile (safe-area, modal scrollable, fonts clamp).
 */
import { detectMetierForStock, getStockPhotosForMetier, getHeroPhotoForMetier } from "./stock-photos";

export type ElectricienPremiumProspect = {
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

import { safeEscHtml as esc } from "./html-utils";

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "E";
}

type Variant = {
  id: string;
  name: string;
  primary: string;
  accent: string;
  glow: string;
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
  isDark: boolean;
};

const VARIANTS: Variant[] = [
  {
    id: "neon-jaune",
    name: "Néon Jaune",
    primary: "#facc15",
    accent: "#06b6d4",
    glow: "#fde047",
    danger: "#ef4444",
    bg: "#0a0a0b",
    cardBg: "#16161a",
    fg: "#fafafa",
    muted: "#1f1f23",
    border: "#2a2a30",
    fontHeading: "Inter",
    fontBody: "Inter",
    fontsImport: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap",
    uppercaseHero: true,
    heroBgGradient: "radial-gradient(ellipse at top left, #facc1520 0%, #0a0a0b 40%), radial-gradient(ellipse at bottom right, #06b6d420 0%, #0a0a0b 50%), #0a0a0b",
    isDark: true,
  },
  {
    id: "cuivre-pro",
    name: "Cuivre Pro",
    primary: "#b45309",
    accent: "#0ea5e9",
    glow: "#d97706",
    danger: "#dc2626",
    bg: "#fafaf9",
    cardBg: "#ffffff",
    fg: "#1c1917",
    muted: "#f5f5f4",
    border: "#e7e5e4",
    fontHeading: "Archivo",
    fontBody: "Inter",
    fontsImport: "https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap",
    uppercaseHero: false,
    heroBgGradient: "linear-gradient(135deg, #fafaf9 0%, #fef3c7 50%, #fafaf9 100%)",
    isDark: false,
  },
  {
    id: "tech-bleu",
    name: "Tech Bleu",
    primary: "#0ea5e9",
    accent: "#a855f7",
    glow: "#38bdf8",
    danger: "#ef4444",
    bg: "#0c1729",
    cardBg: "#152238",
    fg: "#f0f9ff",
    muted: "#1e293b",
    border: "#334155",
    fontHeading: "Space Grotesk",
    fontBody: "Space Grotesk",
    fontsImport: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
    uppercaseHero: false,
    heroBgGradient: "radial-gradient(ellipse at top, #0ea5e920 0%, #0c1729 50%), #0c1729",
    isDark: true,
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
        ["Dimanche", "Astreinte 24/7"],
        ["Urgence électrique", "24/7"],
      ] as [string, string][];
  return rows.map(([d, h]) => {
    const isAstreinte = /astreinte|urgence|24/i.test(h);
    return `<tr class="border-b last:border-0" style="border-color:${v.border}">
      <td class="py-3 pr-6 font-semibold capitalize">${esc(d)}</td>
      <td class="py-3 text-right ${isAstreinte ? "font-bold" : "font-semibold"}" style="color:${isAstreinte ? v.danger : v.primary}">${esc(h)}</td>
    </tr>`;
  }).join("");
}

/** Hero : uniquement stock photos curées (DNA scraping ramène trop
 * souvent des logos électricien type "ELEC PRO" en gros). */
function pickHeroImage(p: ElectricienPremiumProspect): string {
  const stock = getStockPhotosForMetier("electricien", 8);
  const idx = p.id ? (p.id.charCodeAt(1) || 0) % stock.length : 0;
  return stock[idx] || getHeroPhotoForMetier("electricien");
}

function pickGallery(p: ElectricienPremiumProspect, n: number): string[] {
  const dna = p.site_style_dna || {};
  const sources = [
    ...(p.website_photos || []).filter(u => typeof u === "string" && u.startsWith("http")),
    ...((dna.allImages || []).filter(u => u.startsWith("http"))),
  ];
  const uniq = Array.from(new Set(sources)).slice(0, n);
  if (uniq.length >= n) return uniq;
  const fillers = getStockPhotosForMetier("electricien", n - uniq.length);
  return [...uniq, ...fillers].slice(0, n);
}

const INTERVENTIONS = [
  { icon: "⚡", title: "Dépannage urgent", desc: "Coupure, court-circuit, panne totale. Intervention sous 1h en zone.", urgent: true },
  { icon: "🔌", title: "Tableau électrique", desc: "Mise aux normes NF C 15-100, remplacement, ajout de circuits.", urgent: false },
  { icon: "💡", title: "Éclairage", desc: "Spots, LED, suspensions, variateurs. Étude et pose clé en main.", urgent: false },
  { icon: "🏠", title: "Domotique & smart-home", desc: "Volets, chauffage, alarmes pilotables depuis votre smartphone.", urgent: false },
  { icon: "🚗", title: "Borne de recharge VE", desc: "Wallbox 7-22kW agréée IRVE. Certificat installateur fourni.", urgent: false },
  { icon: "📋", title: "Diagnostic + Consuel", desc: "Mise en conformité avant vente, attestation Consuel.", urgent: false },
  { icon: "🔒", title: "Sécurité & alarme", desc: "Détecteurs incendie, alarmes, vidéosurveillance.", urgent: false },
  { icon: "⚠️", title: "Recherche de panne", desc: "Diagnostic complet, multimètre + caméra thermique.", urgent: true },
];

const FAQ_ITEMS = [
  { q: "Combien coûte une intervention d'urgence ?", a: "Le déplacement + diagnostic coûte 65 €. Si vous validez la réparation, ces 65 € sont déduits de la facture finale. Tarif horaire main d'œuvre : 55 €/h." },
  { q: "Êtes-vous certifiés Qualifelec et IRVE ?", a: "Oui. Nous sommes certifiés Qualifelec (mention E1 - E4) pour l'installation électrique générale, et IRVE niveau 2 pour les bornes de recharge véhicule électrique. Tous nos chantiers sont validés Consuel." },
  { q: "Quelle garantie sur les travaux ?", a: "Garantie 2 ans sur la main d'œuvre, garantie fabricant sur les pièces (Schneider, Legrand, Hager — 2 à 10 ans selon le matériel). Assurance décennale Axa couverte." },
  { q: "Intervenez-vous le week-end et la nuit ?", a: "Oui, 24/7 pour les urgences vitales (panne totale, court-circuit, odeur de brûlé). Tarif majoré de 50 % en nuit/dimanche/jour férié, transparent sur le devis." },
  { q: "Comment se passe la mise aux normes ?", a: "1. Visite gratuite + diagnostic complet. 2. Devis détaillé sous 48h. 3. Travaux planifiés. 4. Test Consuel + attestation. 5. Vous recevez tout par mail. Pas de frais cachés." },
];

const CERTIFS = [
  { code: "Qualifelec", desc: "E1-E4" },
  { code: "RGE", desc: "Reconnu Garant Environnement" },
  { code: "IRVE", desc: "Bornes recharge niv. 2" },
  { code: "Consuel", desc: "Validation systématique" },
  { code: "Décennale", desc: "Assurance Axa" },
];

export function generateElectricienPremiumMockupHtml(p: ElectricienPremiumProspect): string {
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

  const whatsappDigits = phoneDigits.replace(/\D/g, "").replace(/^0/, "33");
  const whatsappUrl = phoneDigits ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Bonjour, je souhaiterais l'intervention d'un électricien chez ${p.name}.`)}` : "";

  const mapsQuery = encodeURIComponent(`${p.address || p.name} ${p.city || ""}`);
  const mapsEmbedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const mapsLinkUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const heroImg = pickHeroImage(p);
  const gallery = pickGallery(p, 8);

  const logoHtml = dna.logoUrl && dna.logoUrl.startsWith("http")
    ? `<img src="${esc(dna.logoUrl)}" alt="${name}" class="h-11 w-auto max-w-[160px] object-contain" onerror="this.style.display='none'"/>`
    : `<div class="w-11 h-11 rounded-xl grid place-items-center font-extrabold text-base shadow-lg" style="background:linear-gradient(135deg,${primary},${accent});color:${v.isDark ? '#0a0a0b' : '#fff'};box-shadow:0 0 16px ${primary}40">${initials(p.name)}</div>`;

  const yearsExp = 8 + (p.id ? p.id.charCodeAt(0) % 20 : 0);
  const interventionsCount = 1800 + (p.id ? (p.id.charCodeAt(1) || 0) * 22 : 0);
  const ratingDisplay = p.google_rating ? p.google_rating.toFixed(1) : "4.9";
  const reviewsCount = p.google_reviews_count || 72 + (p.id ? p.id.charCodeAt(2) % 200 : 0);
  const responseTime = 60 + (p.id ? p.id.charCodeAt(3) % 60 : 0);
  const electriciansOnline = 2 + (p.id ? p.id.charCodeAt(4) % 3 : 0); // 2-4

  const aboutText = p.about_scraped
    ? esc(p.about_scraped.slice(0, 700))
    : `Électricien indépendant à ${city} depuis ${yearsExp} ans, ${name} intervient sur l'ensemble des prestations électriques : urgences, dépannages, mise aux normes, installation neuve, domotique et bornes véhicule électrique. Certifié Qualifelec et IRVE, assurance décennale Axa. Toutes nos installations sont validées Consuel.`;

  const reviews = (p.reviews || []).filter(r => r.text && r.text.length > 30).slice(0, 5);
  const fallbackReviews = [
    { author: "Julien R.", text: "Intervention en urgence un samedi soir pour un court-circuit, ils étaient là en moins d'1h. Diagnostic clair, réparation rapide, prix annoncé respecté à l'euro près. Top.", rating: 5, timeAgo: "il y a 1 semaine" },
    { author: "Anne-Sophie M.", text: "Mise aux normes complète de l'installation électrique avant la vente de notre maison. Devis détaillé, travaux propres, Consuel obtenu sans souci. Je recommande sans hésiter.", rating: 5, timeAgo: "il y a 3 semaines" },
    { author: "Karim B.", text: "Installation d'une borne de recharge pour ma Tesla. Rapide, pro, et certificat IRVE fourni. Aucun stress, tout est aux normes.", rating: 5, timeAgo: "il y a 1 mois" },
    { author: "Marine L.", text: "Pose de spots LED dans toute la maison + variateurs. Le rendu est sublime, et ils ont fini pile dans les délais annoncés.", rating: 5, timeAgo: "il y a 2 mois" },
    { author: "François D.", text: "Domotique installée pour piloter chauffage + volets depuis l'app. Bien expliqué, bien posé, ça change la vie.", rating: 5, timeAgo: "il y a 3 mois" },
  ];
  const reviewsToShow = reviews.length >= 3 ? reviews : fallbackReviews;

  const hoursHtml = buildHoursTable(p.hours, { ...v, primary });
  const year = new Date().getFullYear();
  const headingTransform = v.uppercaseHero ? "uppercase" : "none";

  // Helper pour text color contrast sur primary
  const onPrimaryColor = v.isDark && v.id === "neon-jaune" ? "#0a0a0b" : "#ffffff";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="${primary}">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>${name} — Électricien ${city} · Urgence 24/7 · Qualifelec</title>
<meta name="description" content="${name}, électricien à ${city}. Urgence 24/7, devis gratuit, garantie 2 ans, Qualifelec + IRVE + RGE. Dépannage, tableau, domotique, borne VE.">
<script src="https://cdn.tailwindcss.com"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${v.fontsImport}" rel="stylesheet">
<style>
  :root {
    --primary: ${primary};
    --accent: ${accent};
    --glow: ${v.glow};
    --danger: ${v.danger};
    --bg: ${v.bg};
    --card-bg: ${v.cardBg};
    --fg: ${v.fg};
    --muted: ${v.muted};
    --border: ${v.border};
    --on-primary: ${onPrimaryColor};
    --font-heading: "${v.fontHeading}", system-ui, sans-serif;
    --font-body: "${v.fontBody}", system-ui, sans-serif;
  }
  html, body { background: var(--bg); color: var(--fg); font-family: var(--font-body); }
  h1, h2, h3, h4 { font-family: var(--font-heading); letter-spacing: -0.02em; font-weight: 800; }
  .heading-uppercase { text-transform: ${headingTransform}; }
  .heading-gradient {
    background: linear-gradient(135deg, var(--primary), var(--accent));
    -webkit-background-clip: text; background-clip: text;
    -webkit-text-fill-color: transparent; color: transparent;
  }
  .glow { text-shadow: 0 0 24px ${primary}80; }

  /* ─── Boutons ───────────────────── */
  .btn-primary {
    background: var(--primary); color: var(--on-primary);
    box-shadow: 0 0 0 0 ${primary}00, 0 4px 14px ${primary}40;
    transition: box-shadow .25s, transform .15s;
  }
  .btn-primary:hover {
    box-shadow: 0 0 32px ${primary}80, 0 8px 24px ${primary}60;
    transform: translateY(-2px);
  }
  .btn-danger {
    background: var(--danger); color: #fff;
    box-shadow: 0 4px 14px ${v.danger}50;
    transition: box-shadow .25s, transform .15s;
  }
  .btn-danger:hover { box-shadow: 0 0 32px ${v.danger}80, 0 8px 24px ${v.danger}70; transform: translateY(-2px); }
  .btn-ghost {
    background: transparent; color: var(--fg);
    border: 1.5px solid var(--border);
    transition: border-color .15s, background .15s, transform .15s;
  }
  .btn-ghost:hover { border-color: var(--primary); background: ${primary}10; transform: translateY(-1px); }
  .btn-wa {
    background: #25D366; color: #fff;
    box-shadow: 0 4px 14px #25D36650;
    transition: box-shadow .25s, transform .15s;
  }
  .btn-wa:hover { box-shadow: 0 0 32px #25D36680; transform: translateY(-2px); }

  /* ─── Cards tech ───────────────────── */
  .card-tech {
    background: var(--card-bg);
    border: 1px solid var(--border);
    transition: transform .35s, border-color .35s, box-shadow .35s;
    position: relative;
    overflow: hidden;
  }
  .card-tech:hover {
    transform: translateY(-4px);
    border-color: var(--primary);
    box-shadow: 0 16px 40px -16px ${primary}40;
  }
  .card-tech:active { transform: scale(.985); }
  .card-tech::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--primary), transparent);
    opacity: 0; transition: opacity .35s;
  }
  .card-tech:hover::before { opacity: 1; }

  /* ─── Pulse "en ligne" ───────────────────── */
  .pulse-dot {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    background: #22c55e;
    box-shadow: 0 0 0 4px #22c55e30;
    animation: pulse-online 2s infinite;
  }
  @keyframes pulse-online {
    0%, 100% { box-shadow: 0 0 0 4px #22c55e30; }
    50%      { box-shadow: 0 0 0 10px #22c55e10; }
  }

  /* ─── Pulse urgence ───────────────────── */
  .urgent-dot {
    display: inline-block;
    width: 8px; height: 8px;
    border-radius: 50%;
    background: var(--danger);
    box-shadow: 0 0 0 4px ${v.danger}30;
    animation: pulse-urgent 1.6s infinite;
  }
  @keyframes pulse-urgent {
    0%, 100% { box-shadow: 0 0 0 4px ${v.danger}30; }
    50%      { box-shadow: 0 0 0 12px ${v.danger}10; }
  }

  /* ─── Hero photo Ken Burns ───────────────────── */
  @keyframes kenburns {
    0% { transform: scale(1) translate(0,0); }
    50% { transform: scale(1.08) translate(-1%,-1%); }
    100% { transform: scale(1.04) translate(1%,1%); }
  }
  .kenburns { animation: kenburns 22s ease-in-out infinite alternate; }

  /* ─── Courant électrique animé SVG ───────────────────── */
  @keyframes spark-flow {
    0% { stroke-dashoffset: 1000; opacity: 0; }
    10% { opacity: 1; }
    90% { opacity: 1; }
    100% { stroke-dashoffset: 0; opacity: 0; }
  }
  .spark-path {
    fill: none;
    stroke: var(--primary);
    stroke-width: 2;
    stroke-dasharray: 1000;
    stroke-dashoffset: 1000;
    filter: drop-shadow(0 0 6px ${primary}80);
    animation: spark-flow 3.5s ease-in-out infinite;
  }
  .spark-path.s2 { animation-delay: 1.2s; stroke: var(--accent); filter: drop-shadow(0 0 6px ${accent}80); }
  .spark-path.s3 { animation-delay: 2.4s; }

  /* ─── Fade-in stagger ───────────────────── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .fade-up { opacity: 0; animation: fadeUp .8s cubic-bezier(.2,.8,.2,1) forwards; }

  /* ─── Mesh grid décoratif ───────────────────── */
  .grid-deco {
    background-image:
      linear-gradient(${v.border}80 1px, transparent 1px),
      linear-gradient(90deg, ${v.border}80 1px, transparent 1px);
    background-size: 40px 40px;
  }

  /* ─── FAQ accordéon ───────────────────── */
  .faq-item summary {
    cursor: pointer;
    list-style: none;
    padding: 22px 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    font-weight: 700;
    font-family: var(--font-heading);
    font-size: 17px;
    transition: color .15s;
  }
  .faq-item summary::-webkit-details-marker { display: none; }
  .faq-item summary:hover { color: var(--primary); }
  .faq-item summary::after {
    content: '+';
    font-size: 28px;
    font-weight: 300;
    color: var(--primary);
    transition: transform .25s;
    line-height: 1;
  }
  .faq-item[open] summary::after { transform: rotate(45deg); }
  .faq-item[open] summary { color: var(--primary); }
  .faq-content {
    padding: 0 0 22px;
    font-size: 15px;
    line-height: 1.7;
    opacity: .82;
    animation: fadeUp .35s ease;
  }

  /* ─── Témoignages carrousel ───────────────────── */
  .testi-carousel {
    display: flex;
    scroll-snap-type: x mandatory;
    overflow-x: auto;
    scrollbar-width: none;
    gap: 20px;
    padding: 0 20px;
    scroll-padding: 20px;
  }
  .testi-carousel::-webkit-scrollbar { display: none; }
  .testi-card {
    flex: 0 0 calc(100% - 40px);
    scroll-snap-align: start;
    max-width: 420px;
  }
  @media (min-width: 768px) {
    .testi-card { flex: 0 0 calc(50% - 10px); }
  }
  @media (min-width: 1024px) {
    .testi-card { flex: 0 0 calc(33.33% - 14px); }
  }

  /* ─── Modal ───────────────────── */
  .kr-modal-bg { backdrop-filter: blur(12px); background: rgba(0,0,0,.65); padding-bottom: max(16px, env(safe-area-inset-bottom)); }
  .kr-step { display: none; }
  .kr-step.active { display: block; animation: fadeUp .35s ease forwards; }

  /* ─── Calculateur devis ───────────────────── */
  .calc-result {
    background: linear-gradient(135deg, ${primary}15, ${accent}15);
    border: 1px solid ${primary}40;
  }

  /* ─── Sticky FAB ───────────────────── */
  .sticky-fab {
    position: fixed; right: max(14px, env(safe-area-inset-right));
    z-index: 50;
    border-radius: 50%;
    display: grid; place-items: center;
    box-shadow: 0 8px 24px rgba(0,0,0,.3);
    transition: transform .15s, box-shadow .25s;
  }
  .sticky-fab:hover { transform: scale(1.08); }
  .sticky-fab:active { transform: scale(.92); }
  @media (min-width: 768px) { .sticky-fab { display: none; } }

  /* ─── Mobile tuning ───────────────────── */
  @media (max-width: 480px) {
    h1 { font-size: clamp(2.4rem, 9vw, 3.2rem) !important; line-height: 1.04 !important; }
    h2 { font-size: clamp(1.9rem, 7vw, 2.4rem) !important; }
    .faq-item summary { font-size: 15px; padding: 18px 0; }
  }

  /* ─── A11y motion ───────────────────── */
  @media (prefers-reduced-motion: reduce) {
    .kenburns, .spark-path, .pulse-dot, .urgent-dot, .fade-up { animation: none !important; opacity: 1 !important; }
  }
</style>
</head>
<body class="antialiased overflow-x-hidden">

<!-- ═══════════════════ STATUT EN LIGNE BANNER ═══════════════════ -->
<div class="relative z-50 py-2 px-4 text-xs sm:text-sm font-semibold" style="background:${v.muted};border-bottom:1px solid ${v.border}">
  <div class="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-x-5 gap-y-1 opacity-90">
    <span class="inline-flex items-center gap-2">
      <span class="pulse-dot"></span>
      <span><strong style="color:#22c55e">${electriciansOnline} électricien${electriciansOnline > 1 ? "s" : ""}</strong> en ligne sur ${city}</span>
    </span>
    ${phoneDisplay ? `<span class="hidden sm:inline opacity-50">|</span>
    <a href="${phoneLink}" class="inline-flex items-center gap-1.5 hover:opacity-70" style="color:${primary}">
      <span class="urgent-dot"></span> Urgence : <strong>${phoneDisplay}</strong>
    </a>` : ""}
  </div>
</div>

<!-- ═══════════════════ HEADER ═══════════════════ -->
<header class="sticky top-0 z-40 backdrop-blur-xl border-b" style="background:${v.bg}ee;border-color:${v.border}">
  <div class="max-w-7xl mx-auto px-4 md:px-5 py-2.5 md:py-3 flex items-center justify-between gap-3">
    <a href="#hero" class="flex items-center gap-2.5 md:gap-3 min-w-0">
      ${logoHtml}
      <div class="min-w-0">
        <div class="font-[var(--font-heading)] text-base md:text-lg font-extrabold leading-none truncate">${name}</div>
        <div class="text-[10px] md:text-[11px] opacity-60 tracking-widest mt-1 uppercase truncate">Électricien · ${city}</div>
      </div>
    </a>
    <nav class="hidden md:flex items-center gap-7 text-sm font-semibold shrink-0">
      <a href="#services" class="hover:text-[color:var(--primary)] transition">Services</a>
      <a href="#calculateur" class="hover:text-[color:var(--primary)] transition">Estimer</a>
      <a href="#faq" class="hover:text-[color:var(--primary)] transition">FAQ</a>
      <a href="#contact" class="hover:text-[color:var(--primary)] transition">Contact</a>
    </nav>
    <a href="${phoneLink}" class="btn-primary px-3.5 py-2 md:px-5 md:py-2.5 rounded-lg text-xs md:text-sm font-bold whitespace-nowrap shrink-0 inline-flex items-center gap-1.5">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
      <span class="hidden sm:inline">Appeler</span><span class="sm:hidden">Tel</span>
    </a>
  </div>
</header>

<!-- ═══════════════════ HERO ═══════════════════ -->
<section id="hero" class="relative overflow-hidden pt-10 pb-14 md:pt-20 md:pb-32" style="background:${v.heroBgGradient}">
  <!-- Mesh grid décoratif -->
  <div class="absolute inset-0 grid-deco opacity-20 pointer-events-none"></div>

  <!-- Courant électrique SVG -->
  <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 1200 800" preserveAspectRatio="none" aria-hidden>
    <path class="spark-path" d="M0,150 Q300,100 600,200 T1200,180" />
    <path class="spark-path s2" d="M0,400 Q300,500 600,420 T1200,460" />
    <path class="spark-path s3" d="M0,650 Q300,580 600,680 T1200,620" />
  </svg>

  <div class="max-w-7xl mx-auto px-5 grid md:grid-cols-2 gap-10 md:gap-12 items-center relative">
    <div class="fade-up" style="animation-delay:.1s">
      <div class="inline-flex items-center gap-2 mb-5 px-3.5 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider" style="background:${primary}20;color:${primary};border:1px solid ${primary}40">
        <span>⚡</span>
        <span>Qualifelec · IRVE · ${city}</span>
      </div>
      <h1 class="text-5xl md:text-7xl font-extrabold leading-[1.04] mb-5 heading-uppercase">
        Votre électricien <span class="heading-gradient glow">de confiance.</span><br>
        <span class="text-3xl md:text-5xl opacity-80 font-bold">Intervention sous ${responseTime} min.</span>
      </h1>
      <p class="text-lg md:text-xl opacity-80 leading-relaxed mb-7 max-w-xl">
        Urgences, mise aux normes, domotique, borne véhicule électrique. Devis gratuit, garantie 2 ans, validation Consuel systématique.
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

      <!-- Trust badges -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl">
        ${[
          { emo: "⚡", t: "Sous " + responseTime + " min", s: city + " et 30km" },
          { emo: "✅", t: "Devis gratuit", s: "Sous 24h" },
          { emo: "🛡️", t: "Garantie 2 ans", s: "Pièces + main d'œuvre" },
          { emo: "📜", t: "Qualifelec + IRVE", s: "Décennale Axa" },
        ].map(b => `<div class="flex items-start gap-2.5 text-sm">
          <span class="text-xl shrink-0">${b.emo}</span>
          <div>
            <div class="font-bold leading-tight text-xs sm:text-sm">${b.t}</div>
            <div class="text-xs opacity-65 mt-0.5">${b.s}</div>
          </div>
        </div>`).join("")}
      </div>
    </div>

    <div class="relative fade-up" style="animation-delay:.3s">
      <div class="relative aspect-[4/5] sm:aspect-[3/4] md:aspect-[4/5] rounded-2xl overflow-hidden" style="border:1px solid ${v.border};box-shadow:0 0 60px ${primary}30, 0 30px 80px -20px rgba(0,0,0,.5)">
        <img src="${esc(heroImg)}" alt="${name}" class="kenburns w-full h-full object-cover" loading="eager" onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,${primary}40,${accent}40)'"/>
        <div class="absolute inset-0" style="background:linear-gradient(180deg,transparent 40%,${v.isDark ? '#000' : v.fg}80 100%)"></div>
        <div class="absolute bottom-6 left-6 right-6 text-white">
          <div class="text-xs font-extrabold tracking-widest opacity-80 mb-1 uppercase">${city}</div>
          <div class="font-[var(--font-heading)] text-3xl font-extrabold">${name}</div>
        </div>
      </div>
      <!-- Google rating floating -->
      <div class="absolute -bottom-5 -left-4 rounded-xl px-5 py-4 shadow-2xl" style="background:${v.cardBg};border:1px solid ${primary}40;box-shadow:0 0 40px ${primary}30">
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

<!-- ═══════════════════ CERTIFICATIONS ═══════════════════ -->
<section class="py-10 border-y" style="border-color:${v.border};background:${v.muted}">
  <div class="max-w-7xl mx-auto px-5">
    <div class="text-xs opacity-60 text-center uppercase tracking-widest font-bold mb-5">Certifications & assurances</div>
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-4">
      ${CERTIFS.map(c => `
      <div class="flex items-center gap-3 p-3 rounded-lg" style="background:${v.cardBg};border:1px solid ${v.border}">
        <div class="w-10 h-10 rounded grid place-items-center font-extrabold text-xs" style="background:${primary};color:${onPrimaryColor}">${c.code.slice(0, 3).toUpperCase()}</div>
        <div class="min-w-0">
          <div class="font-bold text-sm leading-tight">${c.code}</div>
          <div class="text-[11px] opacity-65 truncate">${c.desc}</div>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ NOS INTERVENTIONS ═══════════════════ -->
<section id="services" class="py-14 md:py-28">
  <div class="max-w-7xl mx-auto px-5">
    <div class="max-w-2xl mb-12">
      <div class="text-sm font-bold tracking-widest uppercase mb-3" style="color:${primary}">Nos interventions</div>
      <h2 class="text-4xl md:text-5xl font-extrabold heading-uppercase mb-4">8 prestations <span class="heading-gradient">électriques.</span></h2>
      <p class="text-lg opacity-75">De l'urgence vitale à la mise en service domotique. Chaque chantier validé Consuel.</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
      ${INTERVENTIONS.map((it, i) => `
      <article class="card-tech rounded-2xl p-6 fade-up" style="animation-delay:${0.05 + i * 0.05}s">
        ${it.urgent ? `<div class="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider" style="color:${v.danger}">
          <span class="urgent-dot"></span>24/7
        </div>` : ""}
        <div class="text-4xl mb-4">${it.icon}</div>
        <h3 class="text-xl font-extrabold mb-2">${it.title}</h3>
        <p class="text-sm opacity-75 leading-snug mb-4">${it.desc}</p>
        <button onclick="krOpen('${esc(it.title)}')" class="text-sm font-bold inline-flex items-center gap-1 hover:gap-2 transition-all" style="color:${primary}">
          En savoir plus →
        </button>
      </article>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ MINI CALCULATEUR DEVIS ═══════════════════ -->
<section id="calculateur" class="py-14 md:py-24" style="background:${v.muted}">
  <div class="max-w-4xl mx-auto px-5">
    <div class="text-center max-w-2xl mx-auto mb-10">
      <div class="text-sm font-bold tracking-widest uppercase mb-3" style="color:${primary}">Estimation rapide</div>
      <h2 class="text-4xl md:text-5xl font-extrabold heading-uppercase mb-3">Combien ça <span class="heading-gradient">coûte ?</span></h2>
      <p class="text-base opacity-75">Estimation indicative en 10 secondes. Devis détaillé sous 24h, gratuit et sans engagement.</p>
    </div>
    <div class="card-tech rounded-2xl p-6 md:p-8">
      <div class="grid md:grid-cols-2 gap-6">
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider mb-3 opacity-70">Type d'intervention</label>
          <div class="grid grid-cols-2 gap-2" id="calc-type-grid">
            ${[
              ["depannage", "Dépannage", 90],
              ["tableau", "Tableau élec.", 850],
              ["renovation", "Rénovation totale", 4200],
              ["domotique", "Domotique", 1800],
              ["borne", "Borne VE", 1200],
              ["normes", "Mise aux normes", 1500],
            ].map(([k, l, _p]) => `<button type="button" data-calc-type="${k}" data-calc-price="${_p}" class="calc-type text-sm font-semibold py-3 rounded-lg transition" style="border:1.5px solid ${v.border}">${l}</button>`).join("")}
          </div>
        </div>
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider mb-3 opacity-70">Surface (m²)</label>
          <input type="range" min="20" max="300" value="80" id="calc-surface" class="w-full accent-[color:var(--primary)]" oninput="document.getElementById('calc-surface-val').textContent = this.value + ' m²'; krCalc();" style="accent-color:${primary}">
          <div class="text-center mt-2 font-extrabold text-2xl" id="calc-surface-val" style="color:${primary}">80 m²</div>
        </div>
      </div>
      <div class="calc-result mt-6 p-6 rounded-xl">
        <div class="text-xs font-bold uppercase tracking-wider opacity-70 mb-2">Estimation indicative</div>
        <div class="flex items-baseline gap-3 mb-2">
          <div class="text-4xl md:text-5xl font-extrabold heading-gradient" id="calc-min">— €</div>
          <div class="text-2xl opacity-50">à</div>
          <div class="text-4xl md:text-5xl font-extrabold heading-gradient" id="calc-max">— €</div>
        </div>
        <div class="text-xs opacity-70 mb-4">Estimation indicative TTC. Devis final après visite gratuite.</div>
        <button onclick="krOpen('devis')" class="btn-primary w-full py-3 rounded-lg text-sm font-extrabold uppercase">
          Recevoir mon devis personnalisé →
        </button>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ STATS BIG ═══════════════════ -->
<section class="py-12 md:py-16">
  <div class="max-w-6xl mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
    ${[
      { n: yearsExp, suffix: " ans", label: "d'expérience" },
      { n: interventionsCount, suffix: "+", label: "chantiers livrés" },
      { n: responseTime, suffix: " min", label: "temps moyen" },
      { n: parseFloat(ratingDisplay), suffix: "/5", label: "note Google", decimals: 1 },
    ].map(s => `
    <div>
      <div class="text-5xl md:text-6xl font-extrabold heading-gradient glow counter" data-target="${s.n}" data-decimals="${(s as { decimals?: number }).decimals || 0}" data-suffix="${s.suffix}">0${s.suffix}</div>
      <div class="text-sm opacity-70 mt-2 font-semibold uppercase tracking-wide">${s.label}</div>
    </div>`).join("")}
  </div>
</section>

<!-- ═══════════════════ GALERIE CHANTIERS ═══════════════════ -->
<section class="py-12">
  <div class="max-w-7xl mx-auto px-5">
    <div class="text-center mb-10">
      <div class="text-sm font-bold tracking-widest uppercase mb-3" style="color:${primary}">Réalisations</div>
      <h2 class="text-3xl md:text-4xl font-extrabold heading-uppercase">Nos derniers <span class="heading-gradient">chantiers.</span></h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
      ${gallery.slice(0, Math.min(gallery.length, 8)).map(url => `
      <div class="aspect-square overflow-hidden rounded-xl" style="border:1px solid ${v.border}">
        <img src="${esc(url)}" alt="" class="w-full h-full object-cover hover:scale-110 transition-transform duration-700" loading="lazy" onerror="this.parentElement.style.display='none'"/>
      </div>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ TÉMOIGNAGES CARROUSEL ═══════════════════ -->
<section id="avis" class="py-14 md:py-28" style="background:${v.muted}">
  <div class="max-w-7xl mx-auto mb-10 px-5">
    <div class="flex items-end justify-between flex-wrap gap-4 mb-3">
      <div>
        <div class="text-sm font-bold tracking-widest uppercase mb-2" style="color:${primary}">Avis vérifiés</div>
        <h2 class="text-4xl md:text-5xl font-extrabold heading-uppercase">${ratingDisplay}/5 · <span class="heading-gradient">${reviewsCount} avis.</span></h2>
      </div>
      <div class="flex gap-2 hidden md:flex">
        <button onclick="krTestiScroll(-1)" class="btn-ghost w-12 h-12 rounded-full grid place-items-center" aria-label="Précédent">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <button onclick="krTestiScroll(1)" class="btn-ghost w-12 h-12 rounded-full grid place-items-center" aria-label="Suivant">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>
    </div>
  </div>
  <div class="testi-carousel max-w-7xl mx-auto" id="testi-carousel">
    ${reviewsToShow.map(r => `
    <article class="testi-card card-tech rounded-2xl p-6">
      <div class="flex items-center gap-3 mb-4">
        <div class="w-12 h-12 rounded-full grid place-items-center font-extrabold text-sm" style="background:${primary};color:${onPrimaryColor}">${initials(r.author || "Client")}</div>
        <div>
          <div class="font-bold text-base leading-tight">${esc(r.author || "Client")}</div>
          <div class="text-xs opacity-60">${esc(r.timeAgo || "récemment")}</div>
        </div>
      </div>
      <div class="text-lg tracking-widest mb-3" style="color:${accent}">${"★".repeat(r.rating || 5)}</div>
      <p class="text-sm leading-relaxed opacity-85">"${esc((r.text || "").slice(0, 280))}${(r.text || "").length > 280 ? "…" : ""}"</p>
    </article>`).join("")}
  </div>
</section>

<!-- ═══════════════════ FAQ ACCORDÉON ═══════════════════ -->
<section id="faq" class="py-14 md:py-28">
  <div class="max-w-3xl mx-auto px-5">
    <div class="text-center mb-12">
      <div class="text-sm font-bold tracking-widest uppercase mb-3" style="color:${primary}">FAQ</div>
      <h2 class="text-4xl md:text-5xl font-extrabold heading-uppercase">Vos questions <span class="heading-gradient">fréquentes.</span></h2>
    </div>
    <div class="divide-y" style="border-color:${v.border}">
      ${FAQ_ITEMS.map((item, i) => `
      <details class="faq-item" ${i === 0 ? "open" : ""} style="border-color:${v.border}">
        <summary>${esc(item.q)}</summary>
        <div class="faq-content">${esc(item.a)}</div>
      </details>`).join("")}
    </div>
    <div class="mt-10 text-center">
      <p class="text-sm opacity-70 mb-4">Une autre question ? On vous répond sous 24h.</p>
      <button onclick="krOpen('question')" class="btn-ghost px-6 py-3 rounded-lg text-sm font-bold uppercase">
        Poser une question
      </button>
    </div>
  </div>
</section>

<!-- ═══════════════════ CONTACT + HORAIRES + MAPS ═══════════════════ -->
<section id="contact" class="py-14 md:py-28" style="background:${v.muted}">
  <div class="max-w-7xl mx-auto px-5">
    <div class="text-center mb-12">
      <div class="text-sm font-bold tracking-widest uppercase mb-3" style="color:${primary}">Contact</div>
      <h2 class="text-4xl md:text-5xl font-extrabold heading-uppercase">Une panne ? <span class="heading-gradient">Appelez tout de suite.</span></h2>
    </div>
    <div class="grid lg:grid-cols-3 gap-5 mb-10">
      <div class="card-tech rounded-2xl p-6">
        <div class="text-xs font-bold tracking-widest opacity-60 mb-3 uppercase">Adresse</div>
        <div class="font-bold text-lg mb-1">${addressDisplay}</div>
        <div class="opacity-70">${city}</div>
        <a href="${mapsLinkUrl}" target="_blank" rel="noopener" class="inline-flex items-center gap-2 mt-3 text-sm font-bold hover:opacity-70" style="color:${primary}">
          Itinéraire →
        </a>
      </div>
      ${phoneDisplay ? `<div class="card-tech rounded-2xl p-6">
        <div class="text-xs font-bold tracking-widest opacity-60 mb-3 uppercase">Téléphone 24/7</div>
        <a href="${phoneLink}" class="font-extrabold text-2xl hover:opacity-70 transition" style="color:${primary}">${phoneDisplay}</a>
        <div class="text-xs opacity-70 mt-2 font-medium">Urgence : nous décrochons dans la minute.</div>
      </div>` : ""}
      <div class="card-tech rounded-2xl p-6">
        <div class="text-xs font-bold tracking-widest opacity-60 mb-3 uppercase">Horaires</div>
        <table class="w-full text-sm">${hoursHtml}</table>
      </div>
    </div>
    <div class="rounded-2xl overflow-hidden" style="border:1px solid ${v.border};min-height:400px">
      <iframe src="${mapsEmbedUrl}" width="100%" height="100%" style="border:0;min-height:400px;filter:${v.isDark ? 'invert(.9) hue-rotate(180deg)' : 'none'}" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
    </div>
    <div class="text-center mt-10 flex flex-col sm:flex-row justify-center gap-3">
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
<footer class="py-10 pb-32 md:pb-10 border-t" style="border-color:${v.border}">
  <div class="max-w-7xl mx-auto px-5 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
    <div class="flex items-center gap-3">
      ${logoHtml}
      <div>
        <div class="font-bold">${name}</div>
        <div class="opacity-60 text-xs">${city}${phoneDisplay ? ` · ${phoneDisplay}` : ""}</div>
      </div>
    </div>
    <div class="opacity-60 text-xs">
      © ${year} ${name} · Site réalisé par <a href="https://klyora.fr" class="font-bold" style="color:${primary}">Klyora</a>
    </div>
  </div>
</footer>

<!-- ═══════════════════ MODAL multi-step ═══════════════════ -->
<div id="kr-modal" class="hidden fixed inset-0 z-50 items-end sm:items-center justify-center kr-modal-bg p-0 sm:p-4 overflow-y-auto" onclick="if(event.target===this) krClose()">
  <div class="rounded-t-2xl sm:rounded-2xl max-w-md w-full relative max-h-[92vh] overflow-y-auto" style="background:${v.cardBg};border:1px solid ${v.border};box-shadow:0 0 60px ${primary}30">
    <button onclick="krClose()" class="absolute top-3 right-3 w-9 h-9 rounded-md grid place-items-center hover:opacity-70 z-10 font-bold" style="background:${v.muted}" aria-label="Fermer">×</button>
    <div class="p-6 sm:p-8">
      <div id="kr-title">
        <div class="text-xs font-bold tracking-widest uppercase mb-2" style="color:${primary}">Demande</div>
        <h3 class="text-2xl font-extrabold">Devis en <span class="heading-gradient">2 minutes.</span></h3>
      </div>
      <div class="flex gap-1.5 mt-5 mb-6">
        <div class="flex-1 h-1.5 rounded transition" id="kr-prog-1" style="background:${primary}"></div>
        <div class="flex-1 h-1.5 rounded transition" id="kr-prog-2" style="background:${v.muted}"></div>
        <div class="flex-1 h-1.5 rounded transition" id="kr-prog-3" style="background:${v.muted}"></div>
      </div>

      <!-- Step 1 -->
      <div class="kr-step active" data-step="1">
        <label class="text-sm font-bold uppercase tracking-wide block mb-3">1. Type d'intervention</label>
        <div class="grid grid-cols-2 gap-2.5">
          ${["Dépannage urgent","Tableau électrique","Domotique","Borne VE","Mise aux normes","Autre"].map(o =>
            `<button type="button" data-type="${o}" class="kr-type text-sm font-semibold py-3 rounded-lg transition" style="border:1.5px solid ${v.border}">${o}</button>`
          ).join("")}
        </div>
        <button type="button" onclick="krNext()" disabled id="kr-next-1" class="btn-primary w-full mt-6 py-3.5 rounded-lg text-sm font-extrabold uppercase disabled:opacity-40 disabled:cursor-not-allowed">Suivant →</button>
      </div>

      <!-- Step 2 -->
      <div class="kr-step" data-step="2">
        <label class="text-sm font-bold uppercase tracking-wide block mb-3">2. Quand ?</label>
        <div class="grid grid-cols-2 gap-2.5 mb-4">
          <button type="button" data-when="now" class="kr-when text-sm font-semibold py-4 rounded-lg transition" style="border:2px solid ${v.danger};color:${v.danger}">🚨 Tout de suite</button>
          <button type="button" data-when="planned" class="kr-when text-sm font-semibold py-4 rounded-lg transition" style="border:1.5px solid ${v.border}">📅 Sur RDV</button>
        </div>
        <label class="text-sm font-bold uppercase tracking-wide block mb-2">Photo de la panne (optionnel)</label>
        <input type="file" accept="image/*" id="kr-photo" class="w-full text-sm py-2.5 px-3 rounded-lg" style="background:${v.muted};border:1.5px dashed ${v.border}">
        <div class="flex gap-3 mt-6">
          <button type="button" onclick="krPrev()" class="btn-ghost px-5 py-3.5 rounded-lg text-sm font-bold uppercase">← Retour</button>
          <button type="button" onclick="krNext()" disabled id="kr-next-2" class="btn-primary flex-1 py-3.5 rounded-lg text-sm font-extrabold uppercase disabled:opacity-40 disabled:cursor-not-allowed">Suivant →</button>
        </div>
      </div>

      <!-- Step 3 -->
      <div class="kr-step" data-step="3">
        <form onsubmit="krSubmit(event)" class="space-y-3">
          <label class="text-sm font-bold uppercase tracking-wide block">3. Coordonnées</label>
          <input type="text" id="kr-name" placeholder="Votre nom" required class="w-full px-4 py-3 rounded-lg bg-transparent focus:outline-none font-medium" style="border:1.5px solid ${v.border};color:${v.fg}">
          <input type="tel" id="kr-phone" placeholder="Téléphone" required class="w-full px-4 py-3 rounded-lg bg-transparent focus:outline-none font-medium" style="border:1.5px solid ${v.border};color:${v.fg}">
          <input type="text" id="kr-addr" placeholder="Adresse d'intervention" class="w-full px-4 py-3 rounded-lg bg-transparent focus:outline-none font-medium" style="border:1.5px solid ${v.border};color:${v.fg}">
          <textarea id="kr-msg" rows="3" placeholder="Précisions sur la panne…" class="w-full px-4 py-3 rounded-lg bg-transparent focus:outline-none font-medium resize-none" style="border:1.5px solid ${v.border};color:${v.fg}"></textarea>
          <div class="flex gap-3 mt-2">
            <button type="button" onclick="krPrev()" class="btn-ghost px-5 py-3.5 rounded-lg text-sm font-bold uppercase">← Retour</button>
            <button type="submit" class="btn-primary flex-1 py-3.5 rounded-lg text-sm font-extrabold uppercase">Envoyer →</button>
          </div>
        </form>
      </div>

      <!-- Success -->
      <div id="kr-success" class="hidden text-center py-6">
        <div class="w-16 h-16 mx-auto mb-4 grid place-items-center rounded-full" style="background:${primary}20">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${primary}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h3 class="text-2xl font-extrabold mb-2">Demande envoyée ⚡</h3>
        <p class="text-sm opacity-70 leading-relaxed">${phoneDisplay ? `On vous rappelle sous 1h. Pour urgence vitale : <a href="${phoneLink}" class="underline font-bold" style="color:${primary}">${phoneDisplay}</a>` : "On vous recontacte rapidement."}</p>
      </div>
    </div>
  </div>
</div>

<!-- ═══════════════════ STICKY MOBILE FAB ═══════════════════ -->
${phoneDisplay ? `<a href="${phoneLink}" class="sticky-fab" style="bottom:calc(82px + env(safe-area-inset-bottom, 0px));width:64px;height:64px;background:${v.danger};box-shadow:0 0 32px ${v.danger}60" aria-label="Appeler urgence">
  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
</a>` : ""}
${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" rel="noopener" class="sticky-fab" style="bottom:calc(18px + env(safe-area-inset-bottom, 0px));width:56px;height:56px;background:#25D366;box-shadow:0 0 28px #25D36660" aria-label="WhatsApp">
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
      btn.style.background = '${primary}'; btn.style.color = '${onPrimaryColor}'; btn.style.borderColor = '${primary}';
      krData.type = btn.dataset.type;
      document.getElementById('kr-next-1').disabled = false;
    });
  });
  document.querySelectorAll('.kr-when').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.kr-when').forEach(function(b){
        b.style.background = ''; b.style.color = ''; b.style.borderColor = '${v.border}';
      });
      var isNow = btn.dataset.when === 'now';
      btn.style.background = isNow ? '${v.danger}' : '${primary}';
      btn.style.color = '#fff';
      btn.style.borderColor = isNow ? '${v.danger}' : '${primary}';
      krData.when = btn.dataset.when;
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

  /* ── Calculateur devis ── */
  var calcType = null, calcPrice = 0;
  document.querySelectorAll('.calc-type').forEach(function(btn){
    btn.addEventListener('click', function(){
      document.querySelectorAll('.calc-type').forEach(function(b){
        b.style.background = ''; b.style.color = ''; b.style.borderColor = '${v.border}';
      });
      btn.style.background = '${primary}'; btn.style.color = '${onPrimaryColor}'; btn.style.borderColor = '${primary}';
      calcType = btn.dataset.calcType;
      calcPrice = parseFloat(btn.dataset.calcPrice);
      krCalc();
    });
  });
  function krCalc(){
    if (!calcType) return;
    var surface = parseFloat(document.getElementById('calc-surface').value);
    var factor = Math.max(0.6, Math.min(2.2, surface / 80));
    var min = Math.round(calcPrice * factor * 0.9 / 10) * 10;
    var max = Math.round(calcPrice * factor * 1.3 / 10) * 10;
    document.getElementById('calc-min').textContent = min + ' €';
    document.getElementById('calc-max').textContent = max + ' €';
  }

  /* ── Témoignages carrousel ── */
  function krTestiScroll(dir){
    var car = document.getElementById('testi-carousel');
    if (!car) return;
    var card = car.querySelector('.testi-card');
    if (!card) return;
    car.scrollBy({ left: dir * (card.offsetWidth + 20), behavior: 'smooth' });
  }

  /* ── Compteurs animés ── */
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
