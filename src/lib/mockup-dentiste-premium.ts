/**
 * Template DENTISTE PREMIUM — univers medical-trust, blanc épuré +
 * accents bleu confiance / vert thérapeutique. Inclut le composer RDV
 * (calendrier interactif) accessible depuis tous les CTAs.
 *
 * 3 variants pickés via p.id.charCodeAt(0) % 3 :
 *   A "Médical Bleu"      blanc pur + bleu confiance #3b82f6 + turquoise
 *                         Inter (sans-serif clean médical)
 *   B "Calme Vert"        blanc cassé + vert thérapeutique #10b981 + sage
 *                         DM Sans (rassurant, doux)
 *   C "Pro Anthracite"    anthracite + cyan vif + blanc (moderne luxe)
 *                         Manrope (techy, ferme)
 *
 * Sections (production-ready) :
 *   - Top bandeau horaires + tel urgence
 *   - Header sticky : logo + nav (Équipe / Spécialités / RDV / Contact)
 *   - Hero épuré : photo cabinet + headline confiance + 2 CTAs principaux
 *     (Prendre RDV en ligne + Urgence)
 *   - Bandeau certifications : Conseil Ordre, DPC, RDV en ligne, Carte Vitale
 *   - Section "Notre équipe" : 3 médecins avec photo + spécialité
 *   - Section "Nos spécialités" : 6 cards (Soins, Ortho, Implanto, etc.)
 *   - Section "Prise de RDV" : preview avec CTA composer
 *   - Stats animées (années / patients / médecins / Google)
 *   - 3 témoignages éditoriaux
 *   - FAQ accordéon (remboursement / urgence / anesthésie / tarifs)
 *   - Galerie cabinet (8 photos)
 *   - Contact + Maps + Horaires
 *   - Composer RDV (modal calendrier 14 jours)
 *   - Sticky FAB mobile (tel + WhatsApp)
 */
import { getStockPhotosForMetier, getHeroPhotoForMetier } from "./stock-photos";
import { buildRdvComposer } from "./rdv-composer";

export type DentistePremiumProspect = {
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
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "D";
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
};

const VARIANTS: Variant[] = [
  {
    id: "medical-bleu",
    name: "Médical Bleu",
    primary: "#0ea5e9",
    accent: "#06b6d4",
    bg: "#ffffff",
    surface: "#f0f9ff",
    fg: "#0f172a",
    fgSoft: "#64748b",
    line: "#e2e8f0",
    fontHeading: "Inter",
    fontBody: "Inter",
    fontsImport: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap",
  },
  {
    id: "calme-vert",
    name: "Calme Vert",
    primary: "#10b981",
    accent: "#0891b2",
    bg: "#fbfdfc",
    surface: "#ecfdf5",
    fg: "#0f172a",
    fgSoft: "#64748b",
    line: "#d1fae5",
    fontHeading: "DM Sans",
    fontBody: "DM Sans",
    fontsImport: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap",
  },
  {
    id: "pro-anthracite",
    name: "Pro Anthracite",
    primary: "#06b6d4",
    accent: "#3b82f6",
    bg: "#fafafa",
    surface: "#f1f5f9",
    fg: "#0f172a",
    fgSoft: "#64748b",
    line: "#e2e8f0",
    fontHeading: "Manrope",
    fontBody: "Manrope",
    fontsImport: "https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap",
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
        ["Lundi", "08:30 – 19:00"],
        ["Mardi – Vendredi", "08:30 – 19:00"],
        ["Samedi", "08:30 – 12:30"],
        ["Dimanche", "Fermé"],
      ] as [string, string][];
  return rows.map(([d, h]) => {
    const isClosed = /ferm[ée]/i.test(h);
    return `<tr class="border-b last:border-0" style="border-color:${v.line}">
      <td class="py-3 pr-6 text-sm font-medium">${esc(d)}</td>
      <td class="py-3 text-right text-sm ${isClosed ? "italic opacity-60" : "font-semibold"}" style="color:${isClosed ? v.fgSoft : v.primary}">${esc(h)}</td>
    </tr>`;
  }).join("");
}

function pickHeroImage(p: DentistePremiumProspect): string {
  // Cabinet/équipe : index 0-12 du stock (photos clinic)
  const stock = getStockPhotosForMetier("dentiste", 25);
  const idx = p.id ? (p.id.charCodeAt(1) || 0) % 13 : 0;
  return stock[idx] || getHeroPhotoForMetier("dentiste");
}

function pickGallery(p: DentistePremiumProspect, n: number): string[] {
  const stock = getStockPhotosForMetier("dentiste", 25);
  const offset = p.id ? (p.id.charCodeAt(2) || 0) % Math.max(1, stock.length - n) : 0;
  return [...stock.slice(offset), ...stock.slice(0, offset)].slice(0, n);
}

function pickTeamPhotos(p: DentistePremiumProspect): string[] {
  // Pour l'équipe : prend des portraits du stock (smile images, index 13-24)
  const stock = getStockPhotosForMetier("dentiste", 25);
  const portraits = stock.slice(13);
  const offset = p.id ? (p.id.charCodeAt(3) || 0) % Math.max(1, portraits.length - 3) : 0;
  return portraits.slice(offset, offset + 3);
}

const SPECIALITES = [
  { icon: "🦷", title: "Soins courants", desc: "Caries, détartrages, dévitalisations. Pris en charge Sécu + mutuelle." },
  { icon: "✨", title: "Esthétique dentaire", desc: "Facettes, blanchiment, alignement Invisalign. Devis transparent." },
  { icon: "🪥", title: "Orthodontie", desc: "Adultes et enfants. Bagues métal, céramique, Invisalign." },
  { icon: "🔧", title: "Implantologie", desc: "Implants titane bio-compatibles, prothèses sur-mesure." },
  { icon: "👶", title: "Pédiatrie", desc: "Premier RDV dès 3 ans, approche douce, salle d'attente kids." },
  { icon: "🚨", title: "Urgences", desc: "Créneaux d'urgence quotidiens. Douleur intense ? Appelez direct." },
];

const FAQ_ITEMS = [
  { q: "Êtes-vous conventionné Sécurité Sociale ?", a: "Oui, secteur 1 conventionné. Tarifs conventionnés + mutuelle pour tous les soins courants. Pour les actes hors nomenclature (implants, esthétique), un devis détaillé vous est remis avant tout acte." },
  { q: "Comment se passe une urgence ?", a: "Appelez le cabinet — nous avons toujours des créneaux d'urgence réservés en journée. Pour les urgences vitales (traumatisme, hémorragie importante), composez le 15." },
  { q: "Acceptez-vous le tiers payant ?", a: "Oui, sur la part Sécurité Sociale + sur les mutuelles partenaires (la plupart des grandes mutuelles françaises). Vérifiez votre carte mutuelle à l'accueil." },
  { q: "L'anesthésie est-elle douloureuse ?", a: "Nous utilisons une technique de pré-anesthésie de surface (gel) avant la piqûre, ce qui rend l'injection quasi-indolore. La plupart de nos patients sont rassurés." },
  { q: "Combien coûte un implant dentaire ?", a: "Un implant dentaire complet (implant + pilier + couronne) coûte entre 1800 € et 2400 € selon la complexité. Devis détaillé fourni avant tout acte, prise en charge mutuelle variable." },
];

const CERTIFS = [
  { code: "Ordre", desc: "Inscrit à l'Ordre" },
  { code: "Conv. Sécu", desc: "Secteur 1" },
  { code: "Tiers payant", desc: "Sécu + mutuelles" },
  { code: "DPC", desc: "Formation continue" },
];

export function generateDentistePremiumMockupHtml(p: DentistePremiumProspect): string {
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
  const addressDisplay = p.address ? esc(p.address) : `Cabinet à ${city}`;

  const whatsappDigits = phoneDigits.replace(/\D/g, "").replace(/^0/, "33");
  const whatsappUrl = phoneDigits ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Bonjour, je souhaiterais prendre RDV chez ${p.name}.`)}` : "";

  const mapsQuery = encodeURIComponent(`${p.address || p.name} ${p.city || ""}`);
  const mapsEmbedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const mapsLinkUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const heroImg = pickHeroImage(p);
  const gallery = pickGallery(p, 8);
  const teamPhotos = pickTeamPhotos(p);

  const logoHtml = dna.logoUrl && dna.logoUrl.startsWith("http")
    ? `<img src="${esc(dna.logoUrl)}" alt="${name}" class="h-10 w-auto max-w-[160px] object-contain" onerror="this.style.display='none'"/>`
    : `<div class="w-11 h-11 rounded-xl grid place-items-center font-bold text-base shadow-md" style="background:linear-gradient(135deg,${primary},${accent});color:#fff">${initials(p.name)}</div>`;

  const yearsExp = 10 + (p.id ? p.id.charCodeAt(0) % 20 : 0);
  const patientsCount = 2400 + (p.id ? (p.id.charCodeAt(1) || 0) * 20 : 0);
  const ratingDisplay = p.google_rating ? p.google_rating.toFixed(1) : "4.9";
  const reviewsCount = p.google_reviews_count || 110 + (p.id ? p.id.charCodeAt(2) % 200 : 0);
  const docsCount = 2 + (p.id ? p.id.charCodeAt(3) % 3 : 0); // 2-4 médecins

  const aboutText = p.about_scraped
    ? esc(p.about_scraped.slice(0, 600))
    : `Cabinet dentaire installé à ${city} depuis ${yearsExp} ans. Notre équipe de ${docsCount} chirurgiens-dentistes vous accueille pour l'ensemble des soins : soins courants, orthodontie, implantologie, esthétique. Pris en charge Sécurité Sociale et mutuelles, créneaux d'urgence quotidiens, prise de RDV en ligne 24/7.`;

  const reviews = (p.reviews || []).filter(r => r.text && r.text.length > 30).slice(0, 3);
  const fallbackReviews = [
    { author: "Caroline M.", text: "Cabinet très accueillant, équipe rassurante et compétente. Le Dr explique très bien les soins et prend le temps avec les patients anxieux. Je recommande vivement.", rating: 5, timeAgo: "il y a 2 semaines" },
    { author: "Mathieu R.", text: "J'ai fait poser un implant dentaire. Tout s'est passé parfaitement, suivi excellent, devis respecté. Une vraie expertise.", rating: 5, timeAgo: "il y a 1 mois" },
    { author: "Sophie B.", text: "On a amené notre fille de 4 ans pour sa première visite. Approche très douce, salle d'attente adaptée aux enfants. Elle veut y retourner !", rating: 5, timeAgo: "il y a 3 mois" },
  ];
  const reviewsToShow = reviews.length >= 2 ? reviews : fallbackReviews;

  const hoursHtml = buildHoursTable(p.hours, v);
  const year = new Date().getFullYear();

  // Team générique
  const teamMembers = [
    { name: "Dr Martin Dubois", title: "Chirurgien-dentiste · Implantologie", photo: teamPhotos[0] || "" },
    { name: "Dr Sarah Lambert", title: "Chirurgien-dentiste · Orthodontie", photo: teamPhotos[1] || "" },
    { name: "Dr Pierre Mercier", title: "Chirurgien-dentiste · Esthétique", photo: teamPhotos[2] || "" },
  ].slice(0, docsCount);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="${primary}">
<meta name="apple-mobile-web-app-capable" content="yes">
<title>${name} — Cabinet dentaire ${city} · RDV en ligne</title>
<meta name="description" content="${name}, cabinet dentaire à ${city}. RDV en ligne 24/7, soins courants, orthodontie, implantologie, esthétique. Conventionné Sécu, tiers payant.">
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
    --font-heading: "${v.fontHeading}", system-ui, sans-serif;
    --font-body: "${v.fontBody}", system-ui, sans-serif;
  }
  html, body { background: var(--bg); color: var(--fg); font-family: var(--font-body); font-weight: 400; -webkit-font-smoothing: antialiased; }
  h1, h2, h3, h4 { font-family: var(--font-heading); letter-spacing: -0.025em; line-height: 1.1; font-weight: 700; }
  .upper-thin {
    font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 600;
  }
  .heading-accent { color: var(--primary); }

  .btn-primary {
    background: var(--primary); color: #fff;
    padding: 14px 28px;
    border-radius: 999px;
    font-size: 13px; font-weight: 700;
    letter-spacing: 0.06em;
    border: 1px solid var(--primary);
    transition: background 0.25s, transform 0.2s, box-shadow 0.25s;
    display: inline-flex; align-items: center; gap: 10px;
    text-decoration: none;
    cursor: pointer;
    text-transform: uppercase;
    box-shadow: 0 8px 24px -8px ${primary}66;
  }
  .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 12px 32px -8px ${primary}99; }

  .btn-ghost {
    background: transparent; color: var(--fg);
    padding: 14px 28px;
    border-radius: 999px;
    font-size: 13px; font-weight: 700;
    letter-spacing: 0.06em;
    border: 1.5px solid var(--line);
    transition: border-color 0.25s, transform 0.2s;
    display: inline-flex; align-items: center; gap: 10px;
    text-decoration: none;
    cursor: pointer;
    text-transform: uppercase;
  }
  .btn-ghost:hover { border-color: var(--fg); transform: translateY(-2px); }

  .btn-urgent {
    background: #ef4444; color: #fff;
    padding: 14px 26px;
    border-radius: 999px;
    font-size: 13px; font-weight: 700;
    letter-spacing: 0.06em;
    border: 1px solid #ef4444;
    transition: background 0.25s, transform 0.2s, box-shadow 0.25s;
    display: inline-flex; align-items: center; gap: 10px;
    text-decoration: none;
    cursor: pointer;
    text-transform: uppercase;
    box-shadow: 0 8px 24px -8px #ef444466;
  }
  .btn-urgent:hover { transform: translateY(-2px); box-shadow: 0 12px 32px -8px #ef444499; }

  .link-arrow {
    display: inline-flex; align-items: center; gap: 10px;
    font-size: 13px; font-weight: 600; letter-spacing: 0.04em;
    color: var(--primary);
    text-decoration: none;
    transition: gap 0.25s;
  }
  .link-arrow:hover { gap: 14px; }

  /* Cards */
  .card-trust {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 18px;
    transition: transform 0.3s, border-color 0.3s, box-shadow 0.3s;
  }
  .card-trust:hover {
    transform: translateY(-4px);
    border-color: var(--primary);
    box-shadow: 0 16px 32px -16px ${primary}33;
  }

  /* Reveal */
  @keyframes reveal-up {
    from { opacity: 0; transform: translateY(28px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .reveal { opacity: 0; }
  .reveal.in { animation: reveal-up 0.9s cubic-bezier(.2,.8,.2,1) forwards; }

  /* Ken Burns */
  @keyframes kenburns-slow {
    0% { transform: scale(1) translate(0,0); }
    50% { transform: scale(1.06) translate(-1%,-0.5%); }
    100% { transform: scale(1.02) translate(0.5%,0.5%); }
  }
  .kenburns-slow { animation: kenburns-slow 30s ease-in-out infinite alternate; }

  /* FAQ */
  .faq-item summary {
    cursor: pointer; list-style: none;
    padding: 22px 0;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    font-family: var(--font-heading);
    font-weight: 600; font-size: 16px;
    transition: color 0.15s;
  }
  .faq-item summary::-webkit-details-marker { display: none; }
  .faq-item summary:hover { color: var(--primary); }
  .faq-item summary::after {
    content: '+';
    font-size: 28px; font-weight: 300;
    color: var(--primary);
    transition: transform 0.25s;
    line-height: 1;
  }
  .faq-item[open] summary::after { transform: rotate(45deg); }
  .faq-item[open] summary { color: var(--primary); }
  .faq-content {
    padding: 0 0 22px;
    font-size: 14.5px;
    line-height: 1.7;
    color: var(--fg-soft);
    animation: reveal-up 0.3s ease;
  }

  /* Sticky FAB */
  .sticky-fab {
    position: fixed; right: max(16px, env(safe-area-inset-right));
    z-index: 50;
    border-radius: 50%;
    display: grid; place-items: center;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    transition: transform 0.18s;
  }
  .sticky-fab:active { transform: scale(.92); }
  .sticky-fab:hover { transform: scale(1.08); }
  @media (min-width: 768px) { .sticky-fab { display: none; } }

  @media (max-width: 640px) {
    h1 { font-size: clamp(2.4rem, 9vw, 3.4rem) !important; line-height: 1.05 !important; }
    h2 { font-size: clamp(2rem, 7vw, 2.6rem) !important; }
    .btn-primary, .btn-ghost, .btn-urgent { padding: 12px 22px; font-size: 12px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .kenburns-slow { animation: none !important; }
    .reveal { opacity: 1 !important; transform: none !important; }
  }
</style>
</head>
<body class="antialiased overflow-x-hidden">

<!-- ═══════════════════ TOP BANDEAU ═══════════════════ -->
<div class="hidden md:block border-b" style="background:${v.surface};border-color:${v.line}">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10 py-2 flex items-center justify-between text-xs">
    <div class="flex items-center gap-5">
      <span class="upper-thin" style="color:${v.fgSoft}">Cabinet ouvert · Lun-Sam</span>
      ${addressDisplay !== `Cabinet à ${city}` ? `<span style="color:${v.fgSoft}">${addressDisplay}</span>` : ""}
    </div>
    <div class="flex items-center gap-4">
      ${phoneDisplay ? `<a href="${phoneLink}" class="font-semibold hover:opacity-70 transition-opacity" style="color:${primary}">📞 ${phoneDisplay}</a>` : ""}
      <button onclick="rdvOpen()" class="font-semibold hover:opacity-70 transition-opacity" style="color:${primary}">Prendre RDV</button>
    </div>
  </div>
</div>

<!-- ═══════════════════ HEADER STICKY ═══════════════════ -->
<header class="sticky top-0 z-40 border-b" style="background:${v.bg}f0;backdrop-filter:blur(16px);border-color:${v.line}">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10 py-4 flex items-center justify-between gap-6">
    <a href="#hero" class="flex items-center gap-3 min-w-0">
      ${logoHtml}
      <div class="min-w-0">
        <div class="font-bold text-base md:text-lg leading-none truncate" style="font-family:var(--font-heading)">${name}</div>
        <div class="text-[10px] md:text-[11px] tracking-[0.18em] mt-1 uppercase truncate font-semibold" style="color:${v.fgSoft}">Cabinet dentaire · ${city}</div>
      </div>
    </a>
    <nav class="hidden lg:flex items-center gap-9 text-[13px] font-semibold">
      <a href="#equipe" class="hover:opacity-60 transition-opacity">Équipe</a>
      <a href="#specialites" class="hover:opacity-60 transition-opacity">Spécialités</a>
      <a href="#avis" class="hover:opacity-60 transition-opacity">Avis</a>
      <a href="#faq" class="hover:opacity-60 transition-opacity">FAQ</a>
      <a href="#contact" class="hover:opacity-60 transition-opacity">Contact</a>
    </nav>
    <button onclick="rdvOpen()" class="btn-primary text-[11px] py-3 px-5">
      Prendre RDV
    </button>
  </div>
</header>

<!-- ═══════════════════ HERO ÉPURÉ ═══════════════════ -->
<section id="hero" class="relative overflow-hidden">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10 pt-12 md:pt-20 pb-14 md:pb-24 grid md:grid-cols-12 gap-10 md:gap-14 items-center">
    <div class="md:col-span-6 reveal">
      <div class="inline-flex items-center gap-2 mb-6 px-3.5 py-1.5 rounded-full text-xs font-bold" style="background:${primary}15;color:${primary}">
        <span>●</span>
        <span class="upper-thin tracking-[0.18em]">Cabinet dentaire · ${city}</span>
      </div>
      <h1 class="text-[3rem] md:text-[4.5rem] leading-[1.04] mb-7">
        Votre sourire, <br><span class="heading-accent">notre priorité.</span>
      </h1>
      <p class="text-lg md:text-xl leading-[1.7] mb-9 max-w-xl" style="color:${v.fgSoft}">
        Cabinet conventionné Sécurité Sociale, équipe de ${docsCount} praticiens, RDV en ligne 24/7. Créneaux d'urgence quotidiens.
      </p>
      <div class="flex flex-col sm:flex-row gap-3 mb-10">
        <button onclick="rdvOpen()" class="btn-primary">
          Prendre RDV en ligne
          <span aria-hidden>→</span>
        </button>
        ${phoneDisplay ? `<a href="${phoneLink}" class="btn-urgent">
          🚨 Urgence : ${phoneDisplay}
        </a>` : ""}
      </div>

      <!-- Trust badges -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
        ${CERTIFS.map(c => `<div class="flex items-start gap-2.5">
          <div class="w-9 h-9 rounded-full grid place-items-center font-bold text-[10px] shrink-0" style="background:${primary}15;color:${primary}">${c.code.slice(0, 3).toUpperCase()}</div>
          <div>
            <div class="font-bold text-xs leading-tight">${c.code}</div>
            <div class="text-[11px] mt-0.5" style="color:${v.fgSoft}">${c.desc}</div>
          </div>
        </div>`).join("")}
      </div>
    </div>

    <div class="md:col-span-6 reveal" style="animation-delay:.2s">
      <div class="relative aspect-[4/5] md:aspect-[5/6] rounded-3xl overflow-hidden" style="border:1px solid ${v.line};box-shadow:0 24px 60px -16px rgba(0,0,0,0.18)">
        <img src="${esc(heroImg)}" alt="${name}" class="kenburns-slow w-full h-full object-cover" loading="eager" onerror="this.style.display='none';this.parentElement.style.background='${v.surface}'"/>
        <div class="absolute inset-0" style="background:linear-gradient(180deg,transparent 60%,rgba(0,0,0,0.4))"></div>
        <div class="absolute bottom-6 left-6 right-6 text-white">
          <div class="upper-thin opacity-85">${city}</div>
          <div class="font-bold text-2xl mt-1" style="font-family:var(--font-heading)">${name}</div>
        </div>
      </div>
      <div class="flex items-center gap-3 mt-5 px-4">
        <span class="font-bold text-2xl" style="color:${primary}">${ratingDisplay}</span>
        <span style="color:${accent}">${"★".repeat(5)}</span>
        <span class="text-sm" style="color:${v.fgSoft}">· ${reviewsCount} avis Google</span>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ NOTRE ÉQUIPE ═══════════════════ -->
<section id="equipe" class="py-20 md:py-28 border-t" style="border-color:${v.line};background:${v.surface}">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10">
    <div class="text-center max-w-2xl mx-auto mb-14 reveal">
      <div class="upper-thin mb-4" style="color:${primary}">— Notre équipe</div>
      <h2 class="text-4xl md:text-5xl mb-4">${docsCount} praticien${docsCount > 1 ? 's' : ''} à votre <span class="heading-accent">écoute.</span></h2>
      <p class="text-base md:text-lg" style="color:${v.fgSoft}">Une équipe expérimentée, formée en continu, qui prend le temps avec chaque patient.</p>
    </div>
    <div class="grid md:grid-cols-3 gap-6 md:gap-8">
      ${teamMembers.map((m, i) => `
      <article class="card-trust p-6 text-center reveal" style="animation-delay:${0.1 + i * 0.1}s">
        <div class="aspect-square rounded-full overflow-hidden mx-auto mb-5 max-w-[200px]" style="background:${v.line}">
          ${m.photo ? `<img src="${esc(m.photo)}" alt="${m.name}" class="w-full h-full object-cover" loading="lazy" onerror="this.style.display='none'"/>` : ''}
        </div>
        <h3 class="text-xl mb-1">${m.name}</h3>
        <p class="text-sm" style="color:${v.fgSoft}">${m.title}</p>
      </article>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ NOS SPÉCIALITÉS ═══════════════════ -->
<section id="specialites" class="py-20 md:py-28">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10">
    <div class="max-w-2xl mb-14 reveal">
      <div class="upper-thin mb-4" style="color:${primary}">— Nos soins</div>
      <h2 class="text-4xl md:text-5xl mb-4">Tous les soins, <span class="heading-accent">un seul cabinet.</span></h2>
      <p class="text-base md:text-lg" style="color:${v.fgSoft}">Du soin courant à l'esthétique, en passant par l'orthodontie et l'implantologie. Tout sous le même toit.</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      ${SPECIALITES.map((s, i) => `
      <article class="card-trust p-7 reveal" style="animation-delay:${0.05 + i * 0.06}s">
        <div class="text-4xl mb-4">${s.icon}</div>
        <h3 class="text-xl mb-2">${s.title}</h3>
        <p class="text-sm leading-[1.7]" style="color:${v.fgSoft}">${s.desc}</p>
      </article>`).join("")}
    </div>
    <div class="text-center mt-12">
      <button onclick="rdvOpen()" class="btn-primary">
        Prendre RDV pour un soin
        <span aria-hidden>→</span>
      </button>
    </div>
  </div>
</section>

<!-- ═══════════════════ PRISE DE RDV CTA SECTION ═══════════════════ -->
<section class="py-20 md:py-24 border-y" style="border-color:${v.line};background:linear-gradient(135deg,${primary}10,${accent}08)">
  <div class="max-w-[900px] mx-auto px-6 md:px-10 text-center reveal">
    <div class="upper-thin mb-4" style="color:${primary}">— RDV en ligne 24/7</div>
    <h2 class="text-4xl md:text-5xl mb-6">Prenez votre RDV <span class="heading-accent">en 2 minutes.</span></h2>
    <p class="text-lg leading-[1.7] mb-9 max-w-xl mx-auto" style="color:${v.fgSoft}">
      Calendrier en temps réel, choix du créneau qui vous convient, confirmation immédiate par SMS. Pas besoin d'appeler.
    </p>
    <button onclick="rdvOpen()" class="btn-primary" style="padding:18px 36px;font-size:14px">
      📅 Ouvrir le calendrier
      <span aria-hidden>→</span>
    </button>
    <p class="text-xs mt-6" style="color:${v.fgSoft}">
      Patient en urgence ? Appelez directement : <a href="${phoneLink}" class="font-bold" style="color:${primary}">${phoneDisplay || "le cabinet"}</a>
    </p>
  </div>
</section>

<!-- ═══════════════════ STATS ═══════════════════ -->
<section class="py-16">
  <div class="max-w-5xl mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    ${[
      { n: yearsExp, suffix: " ans", label: "d'expérience" },
      { n: patientsCount, suffix: "+", label: "patients suivis" },
      { n: docsCount, suffix: "", label: "praticiens" },
      { n: parseFloat(ratingDisplay), suffix: "/5", label: "Google", decimals: 1 },
    ].map(s => `
    <div class="reveal">
      <div class="text-5xl md:text-6xl font-bold counter" data-target="${s.n}" data-decimals="${(s as { decimals?: number }).decimals || 0}" data-suffix="${s.suffix}" style="color:${primary};font-family:var(--font-heading)">0${s.suffix}</div>
      <div class="upper-thin mt-3" style="color:${v.fgSoft}">${s.label}</div>
    </div>`).join("")}
  </div>
</section>

<!-- ═══════════════════ AVIS PATIENTS ═══════════════════ -->
<section id="avis" class="py-20 md:py-28" style="background:${v.surface}">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10">
    <div class="text-center max-w-2xl mx-auto mb-12 reveal">
      <div class="upper-thin mb-4" style="color:${primary}">— Avis vérifiés</div>
      <h2 class="text-4xl md:text-5xl mb-3"><span class="heading-accent">${ratingDisplay}/5</span> sur ${reviewsCount} avis.</h2>
      <div class="text-2xl tracking-widest" style="color:${accent}">${"★".repeat(5)}</div>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      ${reviewsToShow.map(r => `
      <article class="card-trust p-7 reveal">
        <div class="text-lg mb-4 tracking-wider" style="color:${accent}">${"★".repeat(r.rating || 5)}</div>
        <blockquote class="text-base leading-[1.75] mb-5">"${esc((r.text || "").slice(0, 240))}${(r.text || "").length > 240 ? "…" : ""}"</blockquote>
        <div class="flex items-center gap-3 pt-4 border-t" style="border-color:${v.line}">
          <div class="w-10 h-10 rounded-full grid place-items-center text-xs font-bold text-white" style="background:${primary}">${initials(r.author || "P")}</div>
          <div>
            <div class="text-sm font-semibold">${esc(r.author || "Patient")}</div>
            <div class="text-[11px]" style="color:${v.fgSoft}">${esc(r.timeAgo || "récemment")}</div>
          </div>
        </div>
      </article>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ FAQ ═══════════════════ -->
<section id="faq" class="py-20 md:py-28">
  <div class="max-w-3xl mx-auto px-6 md:px-10">
    <div class="text-center mb-12 reveal">
      <div class="upper-thin mb-4" style="color:${primary}">— FAQ</div>
      <h2 class="text-4xl md:text-5xl">Vos questions, <span class="heading-accent">nos réponses.</span></h2>
    </div>
    <div class="divide-y" style="border-color:${v.line}">
      ${FAQ_ITEMS.map((it, i) => `
      <details class="faq-item" ${i === 0 ? "open" : ""} style="border-color:${v.line}">
        <summary>${esc(it.q)}</summary>
        <div class="faq-content">${esc(it.a)}</div>
      </details>`).join("")}
    </div>
    <div class="text-center mt-10">
      <p class="text-sm mb-4" style="color:${v.fgSoft}">Une question spécifique ? On vous répond.</p>
      <button onclick="rdvOpen()" class="btn-ghost">
        Prendre RDV
        <span aria-hidden>→</span>
      </button>
    </div>
  </div>
</section>

<!-- ═══════════════════ GALERIE CABINET ═══════════════════ -->
<section class="py-16" style="background:${v.surface}">
  <div class="max-w-[1500px] mx-auto px-3 md:px-5">
    <div class="text-center mb-10">
      <div class="upper-thin mb-3" style="color:${primary}">— Le cabinet</div>
      <h2 class="text-3xl md:text-4xl">En images.</h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
      ${gallery.slice(0, 8).map(url => `
      <div class="aspect-square overflow-hidden rounded-2xl">
        <img src="${esc(url)}" alt="" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" onerror="this.parentElement.style.display='none'"/>
      </div>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ CONTACT + MAPS ═══════════════════ -->
<section id="contact" class="py-20 md:py-28">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10">
    <div class="text-center mb-12 reveal">
      <div class="upper-thin mb-4" style="color:${primary}">— Contact</div>
      <h2 class="text-4xl md:text-5xl">Nous trouver <span class="heading-accent">à ${city}.</span></h2>
    </div>
    <div class="grid lg:grid-cols-5 gap-10">
      <div class="lg:col-span-3">
        <div class="aspect-[4/3] lg:aspect-[16/10] overflow-hidden rounded-2xl" style="border:1px solid ${v.line}">
          <iframe src="${mapsEmbedUrl}" width="100%" height="100%" style="border:0" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
        <a href="${mapsLinkUrl}" target="_blank" rel="noopener" class="link-arrow mt-5 inline-flex">
          Itinéraire vers ${name} <span aria-hidden>→</span>
        </a>
      </div>
      <div class="lg:col-span-2 space-y-8">
        <div>
          <div class="upper-thin mb-3" style="color:${v.fgSoft}">Adresse</div>
          <div class="font-bold text-lg" style="font-family:var(--font-heading)">${addressDisplay}</div>
          <div style="color:${v.fgSoft}">${city}</div>
        </div>
        ${phoneDisplay ? `<div>
          <div class="upper-thin mb-3" style="color:${v.fgSoft}">Téléphone</div>
          <a href="${phoneLink}" class="font-bold text-2xl hover:opacity-70 transition-opacity" style="color:${primary};font-family:var(--font-heading)">${phoneDisplay}</a>
        </div>` : ""}
        <div>
          <div class="upper-thin mb-3" style="color:${v.fgSoft}">Horaires</div>
          <table class="w-full">${hoursHtml}</table>
        </div>
        <div class="flex flex-col sm:flex-row gap-3 pt-2">
          <button onclick="rdvOpen()" class="btn-primary">Prendre RDV <span aria-hidden>→</span></button>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ FOOTER ═══════════════════ -->
<footer class="py-12 pb-32 md:pb-12 border-t" style="border-color:${v.line};background:${v.surface}">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sm">
    <div class="flex items-center gap-3">
      ${logoHtml}
      <div>
        <div class="font-bold" style="font-family:var(--font-heading)">${name}</div>
        <div class="text-xs" style="color:${v.fgSoft}">${city}${phoneDisplay ? ` · ${phoneDisplay}` : ""}</div>
      </div>
    </div>
    <div class="text-[11px] tracking-[0.15em] uppercase" style="color:${v.fgSoft}">
      © ${year} ${name} · Site <a href="https://klyora.fr" class="font-bold" style="color:${primary}">Klyora</a>
    </div>
  </div>
</footer>

<!-- ═══════════════════ RDV COMPOSER (calendrier modal) ═══════════════════ -->
${buildRdvComposer(slug)}

<!-- ═══════════════════ STICKY MOBILE FAB ═══════════════════ -->
${phoneDisplay ? `<a href="${phoneLink}" class="sticky-fab" style="bottom:calc(82px + env(safe-area-inset-bottom, 0px));width:56px;height:56px;background:${primary}" aria-label="Appeler">
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
</a>` : ""}
${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" rel="noopener" class="sticky-fab" style="bottom:calc(18px + env(safe-area-inset-bottom, 0px));width:54px;height:54px;background:#25D366" aria-label="WhatsApp">
  <svg width="24" height="24" viewBox="0 0 32 32" fill="white" aria-hidden><path d="M16 0C7.16 0 0 7.16 0 16c0 2.83.74 5.49 2.03 7.79L0 32l8.42-2.21A15.92 15.92 0 0 0 16 32c8.84 0 16-7.16 16-16S24.84 0 16 0zm7.42 19.39c-.4-.2-2.4-1.18-2.77-1.32-.37-.13-.64-.2-.91.2-.27.4-1.05 1.32-1.29 1.59-.24.27-.47.3-.87.1-.4-.2-1.7-.63-3.24-2-1.2-1.07-2-2.39-2.24-2.79-.24-.4-.03-.62.17-.82.18-.18.4-.47.6-.71.2-.24.27-.4.4-.67.13-.27.07-.5-.03-.71-.1-.2-.91-2.2-1.25-3.01-.33-.79-.66-.69-.91-.7l-.78-.01c-.27 0-.71.1-1.08.5-.37.4-1.42 1.39-1.42 3.39 0 2 1.45 3.93 1.65 4.2.2.27 2.85 4.35 6.91 6.1.97.42 1.72.67 2.31.86.97.31 1.85.27 2.55.16.78-.12 2.4-.98 2.74-1.93.34-.94.34-1.75.24-1.92-.1-.17-.37-.27-.77-.47z"/></svg>
</a>` : ""}

<script>
  /* ── Counter animation ── */
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
    }, { threshold: 0.4 });
    counters.forEach(function(c){ io.observe(c); });
  })();

  /* ── Reveal au scroll ── */
  (function(){
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal').forEach(function(el){ el.classList.add('in'); });
      return;
    }
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    document.querySelectorAll('.reveal').forEach(function(el){ io.observe(el); });
  })();
</script>

</body>
</html>`;
}
