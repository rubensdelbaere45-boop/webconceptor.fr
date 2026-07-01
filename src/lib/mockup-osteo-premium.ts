/**
 * Template OSTÉO PREMIUM — univers soft-wellness, apaisant, naturel.
 * Réutilise le RDV composer (calendrier 14 jours) déjà validé sur dentiste.
 *
 * 3 variants pickés via p.id.charCodeAt(0) % 3 :
 *   A "Sauge Zen"        blanc + vert sauge doux + terre brûlée mate
 *                        Fraunces serif (éditorial nature)
 *   B "Pierre Naturelle" ivoire + beige sable + bordeaux profond
 *                        Cormorant italic (sophistiqué)
 *   C "Lin Ocre"         lin chaud + ocre doré + vert forêt
 *                        DM Serif Display (classique wellness)
 *
 * Sections (production-ready) :
 *   - Top bandeau horaires + tel + RDV en ligne
 *   - Header sticky : logo + nav (Consultations / RDV / À propos / Contact)
 *   - Hero split éditorial : photo + headline "Retrouvez votre équilibre"
 *     + 4 trust badges (D.O. / Assurance pro / Remboursement mutuelle / Sur RDV)
 *   - Section "Nos consultations" : 6 cards
 *     (Bilan / Dos & cervicales / Sport / Périnatalité / Nourrisson / Sportif pro)
 *   - Section CTA RDV grande (renvoie vers le composer)
 *   - Stats animées (années / patients / séances / Google)
 *   - Section "Notre approche" éditoriale (philosophie ostéo)
 *   - 3 témoignages calmes
 *   - FAQ accordéon (remboursement / durée / nourrisson / sport / grossesse)
 *   - Galerie cabinet 6 photos
 *   - Contact + Maps + Horaires
 *   - Composer RDV (calendrier 14 jours réutilisé)
 *   - Sticky FAB mobile (tel + WhatsApp)
 */
import { getStockPhotosForMetier, getHeroPhotoForMetier } from "./stock-photos";
import { buildRdvComposer } from "./rdv-composer";
import { safeEscHtml as esc } from "./html-utils";

export type OsteoPremiumProspect = {
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

function initials(name: string): string {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase().slice(0, 2) || "O";
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
    id: "sauge-zen",
    name: "Sauge Zen",
    primary: "#7a9b76",   // vert sauge doux
    accent: "#b08968",    // terre brûlée mate
    bg: "#fcfcfa",
    surface: "#f2efe8",
    fg: "#1f2421",
    fgSoft: "#6b6f6a",
    line: "#e0dcd0",
    fontHeading: "Fraunces",
    fontBody: "Inter",
    fontsImport: "https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,500;0,9..144,600;1,9..144,400&family=Inter:wght@300;400;500;600;700&display=swap",
  },
  {
    id: "pierre-naturelle",
    name: "Pierre Naturelle",
    primary: "#8b3a3a",   // bordeaux profond mat
    accent: "#c4a484",    // beige sable
    bg: "#faf6f0",
    surface: "#f0e8dc",
    fg: "#2a1d1d",
    fgSoft: "#7a6868",
    line: "#e2d5c5",
    fontHeading: "Cormorant Garamond",
    fontBody: "Manrope",
    fontsImport: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@300;400;500;600;700&display=swap",
  },
  {
    id: "lin-ocre",
    name: "Lin Ocre",
    primary: "#a8752f",   // ocre doré
    accent: "#4a5d3a",    // vert forêt
    bg: "#faf7f0",
    surface: "#efe8d8",
    fg: "#2c231a",
    fgSoft: "#75695a",
    line: "#e0d4bd",
    fontHeading: "DM Serif Display",
    fontBody: "Inter",
    fontsImport: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap",
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
        ["Lundi – Vendredi", "08:00 – 20:00"],
        ["Samedi", "09:00 – 13:00"],
        ["Dimanche", "Fermé"],
      ] as [string, string][];
  return rows.map(([d, h]) => {
    const isClosed = /ferm[ée]/i.test(h);
    return `<tr class="border-b last:border-0" style="border-color:${v.line}">
      <td class="py-3.5 pr-6 text-sm">${esc(d)}</td>
      <td class="py-3.5 text-right text-sm ${isClosed ? "italic opacity-60" : "font-semibold"}" style="color:${isClosed ? v.fgSoft : v.primary}">${esc(h)}</td>
    </tr>`;
  }).join("");
}

/** Uniquement stock photos curées (DNA scraping ostéo ramène souvent
 * logos cabinet ou photos identités). */
function pickHeroImage(p: OsteoPremiumProspect): string {
  const stock = getStockPhotosForMetier("osteo", 20);
  const idx = p.id ? (p.id.charCodeAt(1) || 0) % stock.length : 0;
  return stock[idx] || getHeroPhotoForMetier("osteo");
}

function pickGallery(p: OsteoPremiumProspect, n: number): string[] {
  const stock = getStockPhotosForMetier("osteo", 20);
  const offset = p.id ? (p.id.charCodeAt(2) || 0) % Math.max(1, stock.length - n) : 0;
  return [...stock.slice(offset), ...stock.slice(0, offset)].slice(0, n);
}

const CONSULTATIONS = [
  { icon: "🌿", title: "Bilan ostéopathique", desc: "Séance découverte, examen postural complet, diagnostic personnalisé." },
  { icon: "🔄", title: "Dos & cervicales", desc: "Lombalgies, cervicalgies, sciatiques, hernies discales. Approche douce et progressive." },
  { icon: "🏃", title: "Sport & performance", desc: "Récupération, préparation compétition, blessures musculaires et articulaires." },
  { icon: "🤰", title: "Grossesse & périnatalité", desc: "Suivi tout au long de la grossesse. Retour au corps post-partum en douceur." },
  { icon: "👶", title: "Nourrisson & enfant", desc: "Coliques, torticolis congénital, plagiocéphalie, troubles du sommeil." },
  { icon: "⚡", title: "Migraines & stress", desc: "Céphalées, vertiges, troubles digestifs liés au stress. Rééquilibrage global." },
];

const APPROACH_POINTS = [
  {
    title: "Approche globale",
    desc: "L'ostéopathie considère le corps comme un tout. Chaque douleur a une cause qu'il faut identifier au-delà du symptôme.",
  },
  {
    title: "Techniques douces",
    desc: "Aucune manipulation brutale. Mobilisations articulaires, fascias, viscéral, crâniens — adaptés à chaque patient.",
  },
  {
    title: "Suivi personnalisé",
    desc: "1 à 3 séances généralement suffisent. Bilan complet à chaque consultation, exercices personnalisés à faire chez soi.",
  },
  {
    title: "Complémentarité",
    desc: "Nous travaillons en collaboration avec votre médecin traitant, kinésithérapeute, sage-femme si besoin.",
  },
];

const FAQ_ITEMS = [
  { q: "Combien coûte une séance et suis-je remboursé(e) ?", a: "Une séance dure environ 45 min et coûte entre 55 et 75 € selon la région. L'Assurance Maladie ne rembourse pas, mais la majorité des mutuelles prennent en charge partiellement ou intégralement (généralement 2 à 6 séances/an). Consultez votre contrat mutuelle." },
  { q: "Combien de séances sont nécessaires ?", a: "Cela dépend du motif. Pour une douleur aiguë récente, 1 à 2 séances suffisent souvent. Pour un problème chronique ou une pathologie plus complexe, 2 à 4 séances espacées de 2-3 semaines. Nous prenons toujours le temps de vous expliquer notre plan." },
  { q: "L'ostéopathie est-elle sans risque pour les nourrissons ?", a: "Absolument. Les techniques utilisées sur les nourrissons sont extrêmement douces (pression <100g), souvent invisibles à l'œil nu. Cela peut soulager coliques, régurgitations, difficultés de sommeil, torticolis congénital. Formation post-grade obligatoire." },
  { q: "Puis-je consulter pendant ma grossesse ?", a: "Oui, à tout moment. L'ostéopathie soulage les douleurs pelviennes, lombalgies, sciatalgies, troubles digestifs, sommeil difficile. Séances adaptées à chaque trimestre. Un rendez-vous post-partum est aussi vivement recommandé." },
  { q: "Quelle différence avec un kinésithérapeute ?", a: "Le kiné rééduque (exercices, massages, physiothérapie) souvent sur prescription. L'ostéopathe diagnostique et traite en une séance des dysfonctions manuelles, sans prescription requise. Les deux sont complémentaires — nous vous orienterons si nécessaire." },
];

const TRUST_BADGES = [
  { code: "D.O.", desc: "Ostéopathe Diplômé" },
  { code: "URSSAF", desc: "N° ADELI enregistré" },
  { code: "Assurance", desc: "Responsabilité pro" },
  { code: "Mutuelles", desc: "Prise en charge" },
];

export function generateOsteoPremiumMockupHtml(p: OsteoPremiumProspect): string {
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
  const whatsappUrl = phoneDigits ? `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(`Bonjour, je souhaiterais prendre un RDV avec ${p.name}.`)}` : "";

  const mapsQuery = encodeURIComponent(`${p.address || p.name} ${p.city || ""}`);
  const mapsEmbedUrl = `https://www.google.com/maps?q=${mapsQuery}&output=embed`;
  const mapsLinkUrl = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

  const heroImg = pickHeroImage(p);
  const gallery = pickGallery(p, 6);

  const logoHtml = dna.logoUrl && dna.logoUrl.startsWith("http")
    ? `<img src="${esc(dna.logoUrl)}" alt="${name}" class="h-10 w-auto max-w-[160px] object-contain" onerror="this.style.display='none'"/>`
    : `<div class="w-11 h-11 rounded-full grid place-items-center font-medium text-sm shadow-sm" style="background:${primary};color:#fff;font-family:var(--font-heading)">${initials(p.name)}</div>`;

  const yearsExp = 8 + (p.id ? p.id.charCodeAt(0) % 18 : 0);
  const patientsCount = 1200 + (p.id ? (p.id.charCodeAt(1) || 0) * 15 : 0);
  const seancesCount = 4500 + (p.id ? (p.id.charCodeAt(2) || 0) * 22 : 0);
  const ratingDisplay = p.google_rating ? p.google_rating.toFixed(1) : "4.9";
  const reviewsCount = p.google_reviews_count || 65 + (p.id ? p.id.charCodeAt(2) % 180 : 0);

  const aboutText = p.about_scraped
    ? esc(p.about_scraped.slice(0, 700))
    : `Ostéopathe diplômé(e) depuis ${yearsExp} ans, ${name} vous accueille dans un cabinet à ${city} pensé comme un lieu d'apaisement. Approche globale, techniques douces, écoute attentive. Séances adaptées à chaque âge : nourrissons, enfants, adultes, seniors, sportifs, femmes enceintes.`;

  const reviews = (p.reviews || []).filter(r => r.text && r.text.length > 30).slice(0, 3);
  const fallbackReviews = [
    { author: "Camille D.", text: "Une écoute exceptionnelle et un vrai soulagement dès la première séance. J'ai des cervicalgies chroniques et après trois consultations, je revis. Approche douce et professionnelle, je recommande vivement.", rating: 5, timeAgo: "il y a 2 semaines" },
    { author: "Julien M.", text: "Consultation pour préparer mon marathon. Diagnostic précis, techniques adaptées, exercices à faire à la maison. Récupération excellente le lendemain. Ostéopathe compétent et humain.", rating: 5, timeAgo: "il y a 1 mois" },
    { author: "Sarah B.", text: "J'ai amené mon bébé de 3 mois pour des coliques et un torticolis. Approche très douce, mon fils était détendu pendant la séance. Résultats visibles en 48h. Un grand merci.", rating: 5, timeAgo: "il y a 2 mois" },
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
<title>${name} — Ostéopathe ${city}</title>
<meta name="description" content="${name}, ostéopathe D.O. à ${city}. Consultations dos, sport, périnatalité, nourrisson. RDV en ligne 24/7. Prise en charge mutuelles.">
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
    --font-heading: "${v.fontHeading}", serif;
    --font-body: "${v.fontBody}", system-ui, sans-serif;
  }
  html, body { background: var(--bg); color: var(--fg); font-family: var(--font-body); font-weight: 400; -webkit-font-smoothing: antialiased; }
  h1, h2, h3, h4 { font-family: var(--font-heading); letter-spacing: -0.015em; line-height: 1.08; font-weight: 500; }
  .serif { font-family: var(--font-heading); font-weight: 500; }
  .serif-italic { font-family: var(--font-heading); font-weight: 500; font-style: italic; }
  .upper-thin { font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; font-weight: 600; }

  .btn-primary {
    background: var(--fg); color: var(--bg);
    padding: 14px 28px; border-radius: 999px;
    font-size: 13px; font-weight: 600; letter-spacing: 0.05em;
    border: 1px solid var(--fg);
    transition: background 0.3s, color 0.3s, transform 0.2s;
    display: inline-flex; align-items: center; gap: 10px;
    text-decoration: none; cursor: pointer;
  }
  .btn-primary:hover { background: var(--primary); border-color: var(--primary); transform: translateY(-1px); }
  .btn-ghost {
    background: transparent; color: var(--fg);
    padding: 14px 28px; border-radius: 999px;
    font-size: 13px; font-weight: 600; letter-spacing: 0.05em;
    border: 1px solid var(--line);
    transition: border-color 0.3s, background 0.3s, transform 0.2s;
    display: inline-flex; align-items: center; gap: 10px;
    text-decoration: none; cursor: pointer;
  }
  .btn-ghost:hover { border-color: var(--fg); background: var(--surface); transform: translateY(-1px); }
  .link-arrow {
    display: inline-flex; align-items: center; gap: 10px;
    font-size: 13px; font-weight: 600; letter-spacing: 0.04em;
    color: var(--primary); text-decoration: none;
    transition: gap 0.25s;
  }
  .link-arrow:hover { gap: 14px; }

  .card-soft {
    background: var(--bg);
    border: 1px solid var(--line);
    border-radius: 18px;
    transition: transform 0.35s, border-color 0.35s, box-shadow 0.35s;
  }
  .card-soft:hover {
    transform: translateY(-4px);
    border-color: var(--primary);
    box-shadow: 0 16px 40px -16px ${primary}30;
  }

  @keyframes kenburns-slow {
    0% { transform: scale(1); }
    50% { transform: scale(1.05); }
    100% { transform: scale(1.02); }
  }
  .kenburns-slow { animation: kenburns-slow 30s ease-in-out infinite alternate; }

  @keyframes reveal-up {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .reveal { opacity: 0; }
  .reveal.in { animation: reveal-up 0.9s cubic-bezier(.2,.8,.2,1) forwards; }

  .faq-item summary {
    cursor: pointer; list-style: none;
    padding: 22px 0;
    display: flex; align-items: center; justify-content: space-between; gap: 16px;
    font-family: var(--font-heading); font-weight: 500; font-size: 17px;
    transition: color 0.15s;
  }
  .faq-item summary::-webkit-details-marker { display: none; }
  .faq-item summary:hover { color: var(--primary); }
  .faq-item summary::after {
    content: '+'; font-size: 28px; font-weight: 300;
    color: var(--primary);
    transition: transform 0.25s; line-height: 1;
  }
  .faq-item[open] summary::after { transform: rotate(45deg); }
  .faq-item[open] summary { color: var(--primary); }
  .faq-content {
    padding: 0 0 22px; font-size: 15px; line-height: 1.75;
    color: var(--fg-soft);
    animation: reveal-up 0.3s ease;
  }

  .sticky-fab {
    position: fixed; right: max(16px, env(safe-area-inset-right));
    z-index: 50; border-radius: 50%;
    display: grid; place-items: center;
    box-shadow: 0 8px 24px rgba(0,0,0,0.16);
    transition: transform 0.18s;
  }
  .sticky-fab:active { transform: scale(.92); }
  .sticky-fab:hover { transform: scale(1.06); }
  @media (min-width: 768px) { .sticky-fab { display: none; } }

  @media (max-width: 640px) {
    h1 { font-size: clamp(2.6rem, 10vw, 3.6rem) !important; line-height: 1.05 !important; }
    h2 { font-size: clamp(2rem, 7vw, 2.6rem) !important; }
    .btn-primary, .btn-ghost { padding: 12px 22px; font-size: 12px; }
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
      <span class="upper-thin" style="color:${v.fgSoft}">Cabinet ouvert · Sur RDV uniquement</span>
    </div>
    <div class="flex items-center gap-4">
      ${phoneDisplay ? `<a href="${phoneLink}" class="font-semibold hover:opacity-70 transition-opacity" style="color:${primary}">${phoneDisplay}</a>` : ""}
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
        <div class="serif text-base md:text-lg leading-none truncate">${name}</div>
        <div class="text-[10px] md:text-[11px] tracking-[0.2em] mt-1 uppercase truncate" style="color:${v.fgSoft}">Ostéopathe D.O. · ${city}</div>
      </div>
    </a>
    <nav class="hidden lg:flex items-center gap-9 text-[13px] font-medium">
      <a href="#consultations" class="hover:opacity-60 transition-opacity">Consultations</a>
      <a href="#approche" class="hover:opacity-60 transition-opacity">Approche</a>
      <a href="#avis" class="hover:opacity-60 transition-opacity">Avis</a>
      <a href="#faq" class="hover:opacity-60 transition-opacity">FAQ</a>
      <a href="#contact" class="hover:opacity-60 transition-opacity">Contact</a>
    </nav>
    <button onclick="rdvOpen()" class="btn-primary text-[11px] py-3 px-6">
      Prendre RDV
    </button>
  </div>
</header>

<!-- ═══════════════════ HERO ═══════════════════ -->
<section id="hero" class="relative overflow-hidden">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10 pt-14 md:pt-24 pb-16 md:pb-28 grid md:grid-cols-12 gap-10 md:gap-16 items-end">
    <div class="md:col-span-6 reveal">
      <div class="upper-thin mb-6" style="color:${v.fgSoft}">— Ostéopathe D.O. · ${city}</div>
      <h1 class="text-[3.4rem] md:text-[5.2rem] leading-[1.02] mb-7">
        Retrouvez votre <span class="serif-italic" style="color:${primary}">équilibre.</span>
      </h1>
      <p class="text-lg md:text-xl leading-[1.7] mb-9 max-w-lg" style="color:${v.fgSoft}">
        Consultations sur rendez-vous. Approche globale et techniques douces adaptées à chaque âge — du nourrisson au sportif de haut niveau.
      </p>
      <div class="flex flex-col sm:flex-row gap-3 mb-10">
        <button onclick="rdvOpen()" class="btn-primary">
          Prendre RDV en ligne <span aria-hidden>→</span>
        </button>
        ${phoneDisplay ? `<a href="${phoneLink}" class="btn-ghost">📞 ${phoneDisplay}</a>` : ""}
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
        ${TRUST_BADGES.map(c => `<div class="flex items-start gap-2.5">
          <div class="w-9 h-9 rounded-full grid place-items-center font-bold text-[10px] shrink-0" style="background:${primary}15;color:${primary}">${c.code.slice(0, 3)}</div>
          <div>
            <div class="font-semibold text-xs leading-tight">${c.code}</div>
            <div class="text-[11px] mt-0.5" style="color:${v.fgSoft}">${c.desc}</div>
          </div>
        </div>`).join("")}
      </div>
    </div>

    <div class="md:col-span-6 reveal" style="animation-delay:.2s">
      <div class="relative aspect-[4/5] md:aspect-[5/6] rounded-[36px] overflow-hidden" style="border:1px solid ${v.line};box-shadow:0 24px 60px -18px rgba(0,0,0,0.16)">
        <img src="${esc(heroImg)}" alt="${name}" class="kenburns-slow w-full h-full object-cover" loading="eager" onerror="this.style.display='none';this.parentElement.style.background='${v.surface}'"/>
        <div class="absolute inset-0" style="background:linear-gradient(180deg,transparent 55%,rgba(20,20,20,0.35))"></div>
        <div class="absolute bottom-6 left-6 right-6 text-white">
          <div class="upper-thin opacity-85">${city}</div>
          <div class="serif text-2xl md:text-3xl mt-1">${name}</div>
        </div>
      </div>
      <div class="flex items-center gap-3 mt-5 px-4">
        <span class="serif text-2xl font-medium" style="color:${primary}">${ratingDisplay}</span>
        <span style="color:${accent}">${"★".repeat(5)}</span>
        <span class="text-sm" style="color:${v.fgSoft}">· ${reviewsCount} avis Google</span>
      </div>
    </div>
  </div>
</section>

<!-- ═══════════════════ NOS CONSULTATIONS ═══════════════════ -->
<section id="consultations" class="py-20 md:py-28" style="background:${v.surface}">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10">
    <div class="max-w-2xl mb-14 reveal">
      <div class="upper-thin mb-5" style="color:${primary}">— Nos consultations</div>
      <h2 class="text-4xl md:text-5xl mb-5">Un accompagnement <span class="serif-italic" style="color:${primary}">sur mesure.</span></h2>
      <p class="text-base md:text-lg leading-relaxed" style="color:${v.fgSoft}">Chaque motif de consultation appelle une approche adaptée. Nous prenons toujours le temps d'échanger avant, pendant et après la séance.</p>
    </div>
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
      ${CONSULTATIONS.map((c, i) => `
      <article class="card-soft p-7 reveal" style="animation-delay:${0.05 + i * 0.06}s">
        <div class="text-4xl mb-4">${c.icon}</div>
        <h3 class="text-xl mb-3">${c.title}</h3>
        <p class="text-sm leading-[1.7]" style="color:${v.fgSoft}">${c.desc}</p>
      </article>`).join("")}
    </div>
    <div class="text-center mt-14">
      <button onclick="rdvOpen()" class="btn-primary">
        Prendre RDV pour une consultation <span aria-hidden>→</span>
      </button>
    </div>
  </div>
</section>

<!-- ═══════════════════ PRISE DE RDV CTA ═══════════════════ -->
<section class="py-20 md:py-24 border-y" style="border-color:${v.line}">
  <div class="max-w-[900px] mx-auto px-6 md:px-10 text-center reveal">
    <div class="upper-thin mb-5" style="color:${primary}">— RDV en ligne 24/7</div>
    <h2 class="text-4xl md:text-5xl mb-7">Choisissez votre <span class="serif-italic" style="color:${primary}">créneau.</span></h2>
    <p class="text-lg leading-[1.7] mb-9 max-w-xl mx-auto" style="color:${v.fgSoft}">
      Calendrier en temps réel, choix du créneau qui vous convient, confirmation par SMS. Sans engagement.
    </p>
    <button onclick="rdvOpen()" class="btn-primary" style="padding:18px 40px;font-size:14px">
      📅 Ouvrir le calendrier
      <span aria-hidden>→</span>
    </button>
  </div>
</section>

<!-- ═══════════════════ STATS ═══════════════════ -->
<section class="py-16">
  <div class="max-w-5xl mx-auto px-6 md:px-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    ${[
      { n: yearsExp, suffix: " ans", label: "d'exercice" },
      { n: patientsCount, suffix: "+", label: "patients suivis" },
      { n: seancesCount, suffix: "+", label: "séances" },
      { n: parseFloat(ratingDisplay), suffix: "/5", label: "Google", decimals: 1 },
    ].map(s => `
    <div class="reveal">
      <div class="text-5xl md:text-6xl serif counter" data-target="${s.n}" data-decimals="${(s as { decimals?: number }).decimals || 0}" data-suffix="${s.suffix}" style="color:${primary};font-weight:500">0${s.suffix}</div>
      <div class="upper-thin mt-3" style="color:${v.fgSoft}">${s.label}</div>
    </div>`).join("")}
  </div>
</section>

<!-- ═══════════════════ NOTRE APPROCHE ═══════════════════ -->
<section id="approche" class="py-20 md:py-28" style="background:${v.surface}">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10 grid md:grid-cols-2 gap-14 md:gap-20 items-center">
    <div class="reveal">
      <div class="aspect-[4/5] rounded-[32px] overflow-hidden" style="background:${v.line}">
        <img src="${esc(gallery[2] || heroImg)}" alt="" class="w-full h-full object-cover" loading="lazy" onerror="this.style.display='none'"/>
      </div>
    </div>
    <div class="reveal" style="animation-delay:.15s">
      <div class="upper-thin mb-5" style="color:${primary}">— Notre approche</div>
      <h2 class="text-4xl md:text-5xl mb-6">Une écoute, <span class="serif-italic" style="color:${primary}">un savoir-faire.</span></h2>
      <p class="text-base md:text-lg leading-[1.75] mb-8" style="color:${v.fgSoft}">${aboutText}</p>
      <ul class="space-y-5">
        ${APPROACH_POINTS.map(pt => `<li>
          <div class="flex items-start gap-3">
            <span class="serif text-2xl leading-none mt-0.5" style="color:${primary}">→</span>
            <div>
              <div class="serif text-lg mb-1.5">${pt.title}</div>
              <div class="text-sm leading-[1.65]" style="color:${v.fgSoft}">${pt.desc}</div>
            </div>
          </div>
        </li>`).join("")}
      </ul>
    </div>
  </div>
</section>

<!-- ═══════════════════ AVIS PATIENTS ═══════════════════ -->
<section id="avis" class="py-20 md:py-28">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10">
    <div class="text-center max-w-2xl mx-auto mb-14 reveal">
      <div class="upper-thin mb-5" style="color:${primary}">— Avis vérifiés</div>
      <h2 class="text-4xl md:text-5xl mb-3"><span style="color:${primary}">${ratingDisplay}</span>/5 sur ${reviewsCount} avis.</h2>
      <div class="text-2xl tracking-widest" style="color:${accent}">${"★".repeat(5)}</div>
    </div>
    <div class="grid md:grid-cols-3 gap-10 md:gap-12">
      ${reviewsToShow.map(r => `
      <figure class="reveal">
        <div class="serif text-6xl leading-none mb-5" style="color:${primary}">"</div>
        <blockquote class="text-base md:text-lg leading-[1.85] mb-7 italic serif">${esc((r.text || "").slice(0, 260))}${(r.text || "").length > 260 ? "…" : ""}</blockquote>
        <figcaption class="flex items-center gap-3 pt-5 border-t" style="border-color:${v.line}">
          <div class="w-10 h-10 rounded-full grid place-items-center text-xs text-white" style="background:${primary}">${initials(r.author || "Patient")}</div>
          <div>
            <div class="text-sm font-medium">${esc(r.author || "Patient")}</div>
            <div class="upper-thin mt-1" style="color:${v.fgSoft}">${esc(r.timeAgo || "récemment")}</div>
          </div>
        </figcaption>
      </figure>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ FAQ ═══════════════════ -->
<section id="faq" class="py-20 md:py-28" style="background:${v.surface}">
  <div class="max-w-3xl mx-auto px-6 md:px-10">
    <div class="text-center mb-12 reveal">
      <div class="upper-thin mb-5" style="color:${primary}">— FAQ</div>
      <h2 class="text-4xl md:text-5xl">Vos questions, <span class="serif-italic" style="color:${primary}">nos réponses.</span></h2>
    </div>
    <div class="divide-y" style="border-color:${v.line}">
      ${FAQ_ITEMS.map((it, i) => `
      <details class="faq-item" ${i === 0 ? "open" : ""} style="border-color:${v.line}">
        <summary>${esc(it.q)}</summary>
        <div class="faq-content">${esc(it.a)}</div>
      </details>`).join("")}
    </div>
    <div class="text-center mt-10">
      <p class="text-sm mb-4" style="color:${v.fgSoft}">Une autre question ? Contactez-nous.</p>
      <button onclick="rdvOpen()" class="btn-ghost">Prendre RDV <span aria-hidden>→</span></button>
    </div>
  </div>
</section>

<!-- ═══════════════════ GALERIE CABINET ═══════════════════ -->
<section class="py-16">
  <div class="max-w-[1500px] mx-auto px-3 md:px-5">
    <div class="text-center mb-10">
      <div class="upper-thin mb-3" style="color:${primary}">— Le cabinet</div>
      <h2 class="text-3xl md:text-4xl">Un lieu <span class="serif-italic">apaisant.</span></h2>
    </div>
    <div class="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
      ${gallery.slice(0, 6).map(url => `
      <div class="aspect-square overflow-hidden rounded-2xl" style="background:${v.surface}">
        <img src="${esc(url)}" alt="" class="w-full h-full object-cover hover:scale-105 transition-transform duration-700" loading="lazy" onerror="this.parentElement.style.display='none'"/>
      </div>`).join("")}
    </div>
  </div>
</section>

<!-- ═══════════════════ CONTACT + MAPS ═══════════════════ -->
<section id="contact" class="py-20 md:py-28 border-t" style="border-color:${v.line}">
  <div class="max-w-[1340px] mx-auto px-6 md:px-10">
    <div class="text-center mb-14 reveal">
      <div class="upper-thin mb-5" style="color:${primary}">— Nous trouver</div>
      <h2 class="text-4xl md:text-5xl">Un cabinet <span class="serif-italic" style="color:${primary}">à ${city}.</span></h2>
    </div>
    <div class="grid lg:grid-cols-5 gap-10">
      <div class="lg:col-span-3">
        <div class="aspect-[4/3] lg:aspect-[16/10] overflow-hidden rounded-[32px]" style="border:1px solid ${v.line}">
          <iframe src="${mapsEmbedUrl}" width="100%" height="100%" style="border:0" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
        <a href="${mapsLinkUrl}" target="_blank" rel="noopener" class="link-arrow mt-6 inline-flex">
          Itinéraire vers ${name} <span aria-hidden>→</span>
        </a>
      </div>
      <div class="lg:col-span-2 space-y-8">
        <div>
          <div class="upper-thin mb-3" style="color:${v.fgSoft}">Adresse</div>
          <div class="serif text-xl md:text-2xl mb-1">${addressDisplay}</div>
          <div style="color:${v.fgSoft}">${city}</div>
        </div>
        ${phoneDisplay ? `<div>
          <div class="upper-thin mb-3" style="color:${v.fgSoft}">Téléphone</div>
          <a href="${phoneLink}" class="serif text-3xl md:text-4xl hover:opacity-70 transition-opacity" style="color:${primary}">${phoneDisplay}</a>
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
        <div class="serif text-lg">${name}</div>
        <div class="text-xs" style="color:${v.fgSoft}">${city}${phoneDisplay ? ` · ${phoneDisplay}` : ""}</div>
      </div>
    </div>
    <div class="text-[11px] tracking-[0.15em] uppercase" style="color:${v.fgSoft}">
      © ${year} ${name} · Site <a href="https://klyora.fr" style="color:${primary};border-bottom:1px solid ${primary}">Klyora</a>
    </div>
  </div>
</footer>

<!-- ═══════════════════ RDV COMPOSER (calendrier réutilisé) ═══════════════════ -->
${buildRdvComposer(slug)}

<!-- ═══════════════════ STICKY MOBILE FAB ═══════════════════ -->
${phoneDisplay ? `<a href="${phoneLink}" class="sticky-fab" style="bottom:calc(82px + env(safe-area-inset-bottom, 0px));width:54px;height:54px;background:${primary}" aria-label="Appeler">
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
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
