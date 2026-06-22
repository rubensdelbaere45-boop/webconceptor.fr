/**
 * Template GARAGE PREMIUM — pré-généré pour les garages indépendants
 * multimarques qui vendent sur LeBonCoin / LaCentrale sans avoir de site.
 *
 * Patterns extraits du repo ui-ux-pro-max-skill-main (84 styles, 161
 * palettes, 161 UI reasoning rules) + adaptations sportives 21st.dev style.
 *
 * Sections :
 *  - Hero cinematic avec gradient mesh + photo voiture HD + spotlight
 *  - Stats counter (X voitures, Y ans d'expérience, Z avis)
 *  - "Notre stock" preview avec CTA "Voir nos voitures" énorme
 *  - "Pourquoi choisir [nom]" — 3 pillars premium
 *  - Carousel témoignages Google (marquee)
 *  - CTA finale "Réserver un essai" + "Demander un devis"
 *  - Contact + horaires
 *  - Footer pro
 *
 * Compatible auto-unlock (sales-ui-bar 54px en haut).
 */
import { detectMetierForStock, getStockPhotosForMetier, getHeroPhotoForMetier } from "./stock-photos";
import { detectDominantBrandPalette } from "./brand-palette";
import { selectDesignPreset } from "./design-tokens-pro";

export type GaragePremiumProspect = {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  hours?: string | null;
  business_type?: string | null;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  reviews?: Array<{ author?: string; rating?: number; text?: string; timeAgo?: string }> | null;
  site_style_dna?: {
    detectedVehicles?: Array<{ title: string; price?: string; year?: string; km?: string; fuel?: string; image?: string; url?: string }>;
  } | null;
};

const esc = (s: string | null | undefined): string =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function buildHoursTable(hoursStr: string | null | undefined): string {
  const lines = (hoursStr || "").split(/\s*\|\s*/).map(s => s.trim()).filter(Boolean);
  if (!lines.length) {
    return `<tr><td class="capitalize py-2 pr-6 font-medium">Lun-Ven</td><td class="py-2 font-bold">08:00 – 18:00</td></tr>
<tr><td class="capitalize py-2 pr-6 font-medium">Samedi</td><td class="py-2 font-bold">09:00 – 17:00</td></tr>
<tr><td class="capitalize py-2 pr-6 font-medium">Dimanche</td><td class="py-2 italic opacity-60">Fermé</td></tr>`;
  }
  return lines.map(line => {
    const m = line.match(/^([^:]+):\s*(.+)$/);
    if (!m) return `<tr><td colspan="2" class="py-2 opacity-80">${esc(line)}</td></tr>`;
    const day = esc(m[1].trim());
    const hrs = esc(m[2].trim());
    const isClosed = /ferm[ée]/i.test(hrs);
    return `<tr class="border-b border-white/10 last:border-0"><td class="capitalize py-2 pr-6 font-medium">${day}</td><td class="py-2 ${isClosed ? "italic opacity-60" : "font-bold"}">${hrs}</td></tr>`;
  }).join("\n");
}

export function generateGaragePremiumMockupHtml(p: GaragePremiumProspect): string {
  const name = esc(p.name);
  const slug = esc(p.slug);
  const city = esc(p.city || "votre ville");
  const phoneDisplay = esc(p.phone || "");
  const phoneDigits = (p.phone || "").replace(/[^\d+]/g, "");
  const addressDisplay = p.address ? esc(p.address) : `Adresse à ${city}`;
  const year = new Date().getFullYear();
  const yearsExp = 10 + (p.id ? p.id.charCodeAt(0) % 15 : 0); // 10-25 ans pseudo-stable

  const dna = p.site_style_dna || {};
  const vehicles = (dna.detectedVehicles || []).filter(v => v.image && v.image.startsWith("http"));
  const topVehicles = vehicles.slice(0, 4);
  const vehicleCount = vehicles.length;

  // Palette : détecte la marque dominante des véhicules pour personnaliser
  const brandPalette = detectDominantBrandPalette(vehicles);
  const preset = selectDesignPreset(`${p.business_type || ""} ${name}`, { isFranchise: false });
  // Combine : palette marque pour primary, preset Racing Sport pour structure
  const primary = brandPalette.primary;
  const accent = brandPalette.accent;

  // Photos hero
  const metierForStock = detectMetierForStock(`garage ${name}`);
  const heroPhoto = getHeroPhotoForMetier(metierForStock);
  const stockPhotos = getStockPhotosForMetier(metierForStock, 6);

  // Avis top 3
  const reviews = (p.reviews || []).filter(r => r.text && (r.text || "").length > 30).slice(0, 3);
  const realRating = p.google_rating ? p.google_rating.toFixed(1) : "5.0";
  const realReviews = p.google_reviews_count || 12;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="noindex,noarchive" />
<title>${name}${p.city ? ` — Garage à ${city}` : ""} — Vente, achat & entretien auto</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${preset.fonts.importUrl}" rel="stylesheet" />
<link href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined" rel="stylesheet" />
<script src="https://cdn.tailwindcss.com"></script>
<style>
  :root { --primary: ${primary}; --accent: ${accent}; --dark: #0a0a0a; --dark-card: #171717; }
  body {
    font-family: '${preset.fonts.body}', -apple-system, sans-serif;
    background: var(--dark);
    color: #fafafa;
    margin: 0;
  }
  .font-display { font-family: '${preset.fonts.heading}', sans-serif; font-weight: 800; letter-spacing: -0.02em; line-height: 1; text-transform: uppercase; }
  .text-primary { color: var(--primary); }
  .bg-primary { background: var(--primary); }
  .border-primary { border-color: var(--primary); }
  .text-accent { color: var(--accent); }
  .bg-accent { background: var(--accent); }
  .material-symbols-outlined { font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }

  /* HERO Mesh + Spotlight (21st.dev / aceternity inspired) */
  .hero-mesh {
    position: relative;
    background:
      radial-gradient(ellipse 80% 60% at top right, ${primary}33 0%, transparent 50%),
      radial-gradient(ellipse 70% 50% at bottom left, ${accent}26 0%, transparent 60%),
      radial-gradient(ellipse at center, ${primary}11 0%, transparent 70%),
      linear-gradient(180deg, #0a0a0a 0%, #050505 100%);
    overflow: hidden;
  }
  .hero-mesh::before {
    content: ''; position: absolute; inset: 0; pointer-events: none;
    background-image: radial-gradient(circle at 1px 1px, ${primary}20 1px, transparent 0);
    background-size: 40px 40px;
    opacity: 0.4;
  }

  /* Gradient text */
  .gradient-text {
    background: linear-gradient(135deg, ${primary} 0%, ${accent} 100%);
    -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent;
  }

  /* Border beam animé (Aceternity) */
  @keyframes border-beam-anim {
    0% { background-position: 0% 0%; } 100% { background-position: 200% 0%; }
  }
  .border-beam-top {
    position: absolute; top: 0; left: 0; right: 0; height: 2px;
    background: linear-gradient(90deg, transparent, ${primary}, ${accent}, transparent);
    background-size: 200% 100%;
    animation: border-beam-anim 3s linear infinite;
  }

  /* Glow CTA */
  .btn-glow {
    background: ${primary}; color: #fff;
    box-shadow: 0 0 0 0 ${primary}88, 0 12px 40px ${primary}66;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .btn-glow:hover { transform: translateY(-2px); box-shadow: 0 0 30px ${primary}aa, 0 20px 50px ${primary}88; }
  .btn-ghost {
    background: rgba(255,255,255,0.08); color: #fff; border: 1.5px solid rgba(255,255,255,0.2);
    backdrop-filter: blur(20px); transition: all 0.3s;
  }
  .btn-ghost:hover { background: rgba(255,255,255,0.15); border-color: ${primary}; }

  /* Glass card */
  .glass-card {
    background: rgba(23, 23, 23, 0.7);
    backdrop-filter: blur(20px) saturate(180%);
    border: 1px solid rgba(255,255,255,0.08);
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .glass-card:hover { border-color: ${primary}; transform: translateY(-4px); box-shadow: 0 24px 48px -12px ${primary}66; }

  /* Stat counter pulse */
  @keyframes counter-pulse { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
  .stat-num { animation: counter-pulse 0.8s cubic-bezier(0.4, 0, 0.2, 1) both; }

  /* Marquee testimonials */
  @keyframes marquee-scroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  .marquee-track { display: flex; animation: marquee-scroll 35s linear infinite; gap: 1.5rem; padding: 0 0.75rem; }
  .marquee-track:hover { animation-play-state: paused; }

  /* Fade up */
  @keyframes fade-up-anim { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
  .fade-up { animation: fade-up-anim 0.8s cubic-bezier(0.4, 0, 0.2, 1) both; }
  .fade-up-1 { animation-delay: 0.1s; } .fade-up-2 { animation-delay: 0.2s; } .fade-up-3 { animation-delay: 0.3s; }

  /* Section reveal on scroll */
  section { scroll-margin-top: 80px; }

  /* Vehicle card hover */
  .vehicle-card { background: var(--dark-card); border: 1px solid rgba(255,255,255,0.08); transition: all 0.3s; }
  .vehicle-card:hover { border-color: ${primary}; transform: translateY(-4px); }
  .vehicle-card img { transition: transform 0.5s; }
  .vehicle-card:hover img { transform: scale(1.08); }
</style>
</head>
<body class="antialiased">

<!-- ═══ NAVBAR sticky top-[54px] ═══ -->
<header class="sticky top-[54px] z-40 backdrop-blur-xl bg-black/70 border-b border-white/10">
  <div class="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
    <a href="#" class="font-display text-2xl text-white flex items-center gap-2">
      <span class="w-2 h-8" style="background: linear-gradient(180deg, ${primary}, ${accent});"></span>
      ${name}
    </a>
    <nav class="hidden md:flex items-center gap-8">
      <a href="#stock" class="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-white transition">Stock</a>
      <a href="/prospects/${slug}/voitures" class="text-sm font-bold uppercase tracking-widest text-primary hover:opacity-80 transition flex items-center gap-1">
        <span class="material-symbols-outlined text-base">directions_car</span>Toutes nos voitures
      </a>
      <a href="#about" class="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-white transition">À propos</a>
      <a href="#avis" class="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-white transition">Avis</a>
      <a href="#contact" class="text-sm font-bold uppercase tracking-widest text-white/70 hover:text-white transition">Contact</a>
      ${phoneDigits ? `<a href="tel:${phoneDigits}" class="btn-glow px-5 py-2.5 rounded-full text-sm font-bold uppercase tracking-wider inline-flex items-center gap-2"><span class="material-symbols-outlined text-base">call</span>${phoneDisplay}</a>` : ""}
    </nav>
  </div>
</header>

<main>

<!-- ═══ HERO CINEMATIC ═══ -->
<section class="hero-mesh relative pt-20 pb-24 lg:pt-32 lg:pb-32 px-6 overflow-hidden">
  <div class="absolute top-0 right-0 w-1/2 h-full opacity-30">
    <img src="${heroPhoto}" alt="" class="w-full h-full object-cover" style="mask-image: linear-gradient(90deg, transparent 0%, black 100%); -webkit-mask-image: linear-gradient(90deg, transparent 0%, black 100%);" />
  </div>
  <div class="max-w-7xl mx-auto relative z-10">
    <div class="grid lg:grid-cols-12 gap-12 items-center">
      <div class="lg:col-span-7 fade-up">
        <div class="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-6">
          <span class="w-2 h-2 rounded-full" style="background: ${primary};"></span>
          <span class="text-xs font-bold uppercase tracking-widest text-white/80">Garage à ${city} · Depuis ${year - yearsExp}</span>
        </div>
        <h1 class="font-display text-6xl lg:text-8xl mb-6 leading-none">
          <span class="block text-white">VOTRE VOITURE</span>
          <span class="block gradient-text">VOUS ATTEND.</span>
        </h1>
        <p class="text-xl text-white/70 max-w-xl mb-10 fade-up fade-up-1">
          ${vehicleCount > 0 ? `<strong class="text-white">${vehicleCount} véhicules</strong> sélectionnés` : "Catalogue de véhicules sélectionnés"} dans notre showroom${p.city ? " à " + city : ""}. Essai gratuit, financement sur place, garantie incluse.
        </p>
        <div class="flex flex-wrap gap-4 fade-up fade-up-2">
          <a href="/prospects/${slug}/voitures" class="btn-glow px-8 py-4 rounded-full font-bold uppercase tracking-wider text-base inline-flex items-center gap-2">
            <span class="material-symbols-outlined">directions_car</span>Voir toutes nos voitures
            <span class="material-symbols-outlined">arrow_forward</span>
          </a>
          <button type="button" onclick="openLeadModal('essai')" class="btn-ghost px-8 py-4 rounded-full font-bold uppercase tracking-wider text-base inline-flex items-center gap-2">
            <span class="material-symbols-outlined">car_rental</span>Réserver un essai
          </button>
        </div>
        ${p.google_rating ? `<div class="mt-8 flex items-center gap-3 fade-up fade-up-3">
          <div class="flex gap-1">
            ${Array(Math.round(p.google_rating)).fill('<span class="material-symbols-outlined text-yellow-400" style="font-variation-settings: \'FILL\' 1;">star</span>').join("")}
          </div>
          <span class="text-sm text-white/80"><strong class="text-white">${realRating}/5</strong> · ${realReviews} avis Google</span>
        </div>` : ""}
      </div>
      <div class="lg:col-span-5 fade-up fade-up-2">
        <div class="relative">
          <div class="aspect-[4/3] rounded-3xl overflow-hidden border border-white/10" style="box-shadow: 0 40px 80px -20px ${primary}66;">
            <img src="${topVehicles[0]?.image || heroPhoto}" alt="${topVehicles[0]?.title || name}" class="w-full h-full object-cover" />
          </div>
          ${topVehicles[0]?.price ? `<div class="absolute top-4 right-4 glass-card px-4 py-2 rounded-full"><span class="text-2xl font-display gradient-text">${esc(topVehicles[0].price)}</span></div>` : ""}
          <div class="absolute -bottom-6 -left-6 glass-card p-5 rounded-2xl">
            <div class="text-xs text-white/60 uppercase tracking-widest mb-1">Note moyenne</div>
            <div class="flex items-center gap-2">
              <span class="text-3xl font-display gradient-text">${realRating}</span>
              <div class="flex gap-0.5">
                ${Array(5).fill('<span class="material-symbols-outlined text-yellow-400 text-base" style="font-variation-settings: \'FILL\' 1;">star</span>').join("")}
              </div>
            </div>
            <div class="text-xs text-white/60 mt-1">${realReviews} avis clients</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- ═══ STATS COUNTERS ═══ -->
<section class="border-y border-white/10 bg-black/50 py-12 px-6">
  <div class="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
    <div class="stat-num">
      <div class="font-display text-5xl gradient-text mb-2">${vehicleCount > 0 ? vehicleCount : "30+"}</div>
      <div class="text-xs uppercase tracking-widest text-white/60">Véhicules en stock</div>
    </div>
    <div class="stat-num" style="animation-delay: 0.1s;">
      <div class="font-display text-5xl gradient-text mb-2">${yearsExp}</div>
      <div class="text-xs uppercase tracking-widest text-white/60">Années d'expérience</div>
    </div>
    <div class="stat-num" style="animation-delay: 0.2s;">
      <div class="font-display text-5xl gradient-text mb-2">${realReviews}</div>
      <div class="text-xs uppercase tracking-widest text-white/60">Clients satisfaits</div>
    </div>
    <div class="stat-num" style="animation-delay: 0.3s;">
      <div class="font-display text-5xl gradient-text mb-2">100%</div>
      <div class="text-xs uppercase tracking-widest text-white/60">Garantie incluse</div>
    </div>
  </div>
</section>

<!-- ═══ NOTRE STOCK (vrais véhicules) ═══ -->
<section id="stock" class="py-24 px-6">
  <div class="max-w-7xl mx-auto">
    <div class="flex flex-wrap items-end justify-between mb-12 gap-6">
      <div>
        <div class="text-xs uppercase tracking-widest text-primary font-bold mb-2">Notre sélection</div>
        <h2 class="font-display text-5xl lg:text-6xl">Voitures <span class="gradient-text">disponibles</span></h2>
      </div>
      <a href="/prospects/${slug}/voitures" class="btn-ghost px-6 py-3 rounded-full font-bold uppercase tracking-wider text-sm inline-flex items-center gap-2">
        Voir le catalogue complet
        <span class="material-symbols-outlined">arrow_forward</span>
      </a>
    </div>
    ${topVehicles.length > 0 ? `
    <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
      ${topVehicles.map((v, i) => `
        <article class="vehicle-card rounded-2xl overflow-hidden fade-up fade-up-${Math.min(i, 3)}">
          <div class="aspect-[4/3] overflow-hidden bg-neutral-900">
            <img src="${esc(v.image!)}" alt="${esc(v.title)}" loading="lazy" class="w-full h-full object-cover" />
          </div>
          <div class="p-5">
            <h3 class="font-display text-lg mb-3 line-clamp-2 min-h-[3rem]">${esc(v.title)}</h3>
            <div class="flex flex-wrap gap-2 mb-4 text-xs">
              ${v.year ? `<span class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">${esc(v.year)}</span>` : ""}
              ${v.km ? `<span class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">${esc(v.km)}</span>` : ""}
              ${v.fuel ? `<span class="px-2.5 py-1 rounded-full bg-white/5 border border-white/10">${esc(v.fuel)}</span>` : ""}
            </div>
            <div class="flex items-center justify-between gap-3">
              ${v.price ? `<div class="text-xl font-display gradient-text">${esc(v.price)}</div>` : `<div class="text-sm text-white/60">Sur demande</div>`}
              <button type="button" onclick="openLeadModal('essai', ${JSON.stringify(v.title).replace(/"/g, "&quot;")})" class="btn-glow px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider">Essai</button>
            </div>
          </div>
        </article>`).join("")}
    </div>` : `
    <!-- Showcase de placeholder élégant pour garages sans véhicules scrapés -->
    <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      ${stockPhotos.slice(0, 3).map((photo, i) => `
        <article class="vehicle-card rounded-2xl overflow-hidden fade-up fade-up-${i}">
          <div class="aspect-[4/3] overflow-hidden bg-neutral-900 relative">
            <img src="${photo}" alt="" loading="lazy" class="w-full h-full object-cover opacity-90" />
            <div class="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
              <span class="material-symbols-outlined text-5xl text-white mb-2">${["directions_car", "speed", "settings"][i]}</span>
              <span class="text-sm font-bold uppercase tracking-widest text-white">${["Catalogue complet", "Essais gratuits", "Garantie incluse"][i]}</span>
            </div>
          </div>
        </article>`).join("")}
    </div>
    <div class="text-center mt-12">
      <a href="/prospects/${slug}/voitures" class="btn-glow inline-flex items-center gap-3 px-10 py-5 rounded-full font-bold uppercase tracking-wider text-base">
        <span class="material-symbols-outlined">storefront</span>
        Découvrir notre catalogue complet
        <span class="material-symbols-outlined">arrow_forward</span>
      </a>
    </div>`}
  </div>
</section>

<!-- ═══ POURQUOI NOUS ═══ -->
<section id="about" class="py-24 px-6 bg-gradient-to-b from-transparent via-${primary}11 to-transparent" style="background: linear-gradient(180deg, transparent 0%, ${primary}11 50%, transparent 100%);">
  <div class="max-w-7xl mx-auto">
    <div class="text-center mb-16">
      <div class="text-xs uppercase tracking-widest text-primary font-bold mb-2">Pourquoi ${name}</div>
      <h2 class="font-display text-5xl lg:text-6xl">L'excellence, <span class="gradient-text">à votre service</span></h2>
    </div>
    <div class="grid md:grid-cols-3 gap-6">
      <div class="glass-card rounded-3xl p-8 relative overflow-hidden fade-up">
        <div class="border-beam-top"></div>
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style="background: linear-gradient(135deg, ${primary}, ${accent});">
          <span class="material-symbols-outlined text-white text-3xl">verified</span>
        </div>
        <h3 class="font-display text-2xl mb-4">${yearsExp} ans d'expérience</h3>
        <p class="text-white/70 leading-relaxed">Une équipe passionnée${p.city ? " à " + city : ""} qui sélectionne, contrôle et vend chaque véhicule avec rigueur.</p>
      </div>
      <div class="glass-card rounded-3xl p-8 relative overflow-hidden fade-up fade-up-1">
        <div class="border-beam-top"></div>
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style="background: linear-gradient(135deg, ${primary}, ${accent});">
          <span class="material-symbols-outlined text-white text-3xl">paid</span>
        </div>
        <h3 class="font-display text-2xl mb-4">Financement sur place</h3>
        <p class="text-white/70 leading-relaxed">Solutions de financement adaptées à votre budget. Réponse immédiate, mensualités claires, sans engagement.</p>
      </div>
      <div class="glass-card rounded-3xl p-8 relative overflow-hidden fade-up fade-up-2">
        <div class="border-beam-top"></div>
        <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-6" style="background: linear-gradient(135deg, ${primary}, ${accent});">
          <span class="material-symbols-outlined text-white text-3xl">shield</span>
        </div>
        <h3 class="font-display text-2xl mb-4">Garantie & SAV inclus</h3>
        <p class="text-white/70 leading-relaxed">Chaque véhicule contrôlé techniquement, garanti, suivi par notre atelier après-vente. La sérénité avant tout.</p>
      </div>
    </div>
  </div>
</section>

${reviews.length > 0 ? `
<!-- ═══ TÉMOIGNAGES Google MARQUEE ═══ -->
<section id="avis" class="py-24 overflow-hidden">
  <div class="text-center mb-12 px-6">
    <div class="text-xs uppercase tracking-widest text-primary font-bold mb-2">Ce qu'ils en disent</div>
    <h2 class="font-display text-5xl lg:text-6xl">Nos clients <span class="gradient-text">en parlent</span></h2>
    <div class="mt-4 flex items-center justify-center gap-3">
      <div class="flex gap-1">${Array(Math.round(p.google_rating || 5)).fill('<span class="material-symbols-outlined text-yellow-400" style="font-variation-settings: \'FILL\' 1;">star</span>').join("")}</div>
      <span class="text-white/80"><strong>${realRating}/5</strong> · ${realReviews} avis Google</span>
    </div>
  </div>
  <div class="marquee-track">
    ${[...reviews, ...reviews].map(r => `
      <div class="glass-card flex-shrink-0 w-96 p-7 rounded-2xl">
        <div class="flex gap-0.5 mb-3">${Array(Math.round(r.rating || 5)).fill('<span class="material-symbols-outlined text-yellow-400 text-base" style="font-variation-settings: \'FILL\' 1;">star</span>').join("")}</div>
        <p class="text-white/80 italic leading-relaxed mb-4 text-sm">«&nbsp;${esc((r.text || "").slice(0, 240))}&nbsp;»</p>
        <div class="font-bold text-primary text-sm">— ${esc(r.author || "Client")}</div>
      </div>`).join("")}
  </div>
</section>` : ""}

<!-- ═══ CTA FINALE ═══ -->
<section class="py-24 px-6">
  <div class="max-w-5xl mx-auto text-center hero-mesh rounded-3xl p-12 lg:p-20 relative overflow-hidden border border-white/10">
    <h2 class="font-display text-5xl lg:text-7xl mb-6">
      <span class="block">Prêt à trouver</span>
      <span class="block gradient-text">votre prochaine voiture ?</span>
    </h2>
    <p class="text-xl text-white/70 max-w-2xl mx-auto mb-10">Réservez un essai en 1 clic ou demandez un devis. Notre équipe vous répond sous 24h.</p>
    <div class="flex flex-wrap justify-center gap-4">
      <a href="/prospects/${slug}/voitures" class="btn-glow px-8 py-4 rounded-full font-bold uppercase tracking-wider text-base inline-flex items-center gap-2">
        <span class="material-symbols-outlined">directions_car</span>Voir toutes nos voitures
      </a>
      <button type="button" onclick="openLeadModal('devis')" class="btn-ghost px-8 py-4 rounded-full font-bold uppercase tracking-wider text-base inline-flex items-center gap-2">
        <span class="material-symbols-outlined">request_quote</span>Demander un devis
      </button>
      ${phoneDigits ? `<a href="tel:${phoneDigits}" class="btn-ghost px-8 py-4 rounded-full font-bold uppercase tracking-wider text-base inline-flex items-center gap-2"><span class="material-symbols-outlined">call</span>${phoneDisplay}</a>` : ""}
    </div>
  </div>
</section>

<!-- ═══ CONTACT + HORAIRES ═══ -->
<section id="contact" class="py-24 px-6 border-t border-white/10">
  <div class="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12">
    <div>
      <div class="text-xs uppercase tracking-widest text-primary font-bold mb-2">Nous rendre visite</div>
      <h2 class="font-display text-4xl lg:text-5xl mb-8">${name}<br/><span class="gradient-text">à ${city}</span></h2>
      <div class="space-y-6">
        ${p.address ? `<div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background: linear-gradient(135deg, ${primary}, ${accent});">
            <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">location_on</span>
          </div>
          <div>
            <div class="text-xs uppercase tracking-widest text-white/60 mb-1">Adresse</div>
            <div class="text-lg">${addressDisplay}</div>
          </div>
        </div>` : ""}
        ${phoneDigits ? `<div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background: linear-gradient(135deg, ${primary}, ${accent});">
            <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">call</span>
          </div>
          <div>
            <div class="text-xs uppercase tracking-widest text-white/60 mb-1">Téléphone</div>
            <a href="tel:${phoneDigits}" class="text-lg font-bold hover:text-primary transition">${phoneDisplay}</a>
          </div>
        </div>` : ""}
        ${p.email ? `<div class="flex items-start gap-4">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style="background: linear-gradient(135deg, ${primary}, ${accent});">
            <span class="material-symbols-outlined text-white" style="font-variation-settings: 'FILL' 1;">mail</span>
          </div>
          <div>
            <div class="text-xs uppercase tracking-widest text-white/60 mb-1">Email</div>
            <a href="mailto:${esc(p.email)}" class="text-lg hover:text-primary transition break-all">${esc(p.email)}</a>
          </div>
        </div>` : ""}
      </div>
    </div>
    <div class="glass-card rounded-3xl p-8 lg:p-12">
      <div class="text-xs uppercase tracking-widest text-primary font-bold mb-2 flex items-center gap-2">
        <span class="material-symbols-outlined text-base">schedule</span>Horaires
      </div>
      <h3 class="font-display text-3xl mb-6">Quand venir nous voir</h3>
      <table class="w-full text-base">
        <tbody>${buildHoursTable(p.hours)}</tbody>
      </table>
      <button type="button" onclick="openLeadModal('rdv')" class="btn-glow w-full mt-8 px-6 py-4 rounded-full font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2">
        <span class="material-symbols-outlined">event</span>Prendre rendez-vous
      </button>
    </div>
  </div>
</section>

</main>

<!-- ═══ FOOTER ═══ -->
<footer class="py-12 px-6 border-t border-white/10 bg-black">
  <div class="max-w-7xl mx-auto text-center">
    <div class="font-display text-3xl mb-3">${name}</div>
    <p class="text-sm text-white/60 mb-6">Garage automobile multimarque${p.city ? " à " + city : ""}</p>
    <p class="text-xs text-white/40">© ${year} ${name}. Tous droits réservés.</p>
  </div>
</footer>

<!-- ═══ MODAL Lead (essai / devis / rdv) ═══ -->
<div id="lead-modal" class="fixed inset-0 z-[10000] hidden items-center justify-center p-4" style="background: rgba(0,0,0,0.85); backdrop-filter: blur(12px);" onclick="if(event.target===this)closeLeadModal()">
  <div class="max-w-lg w-full rounded-3xl p-8 relative max-h-[90vh] overflow-y-auto" style="background: #171717; border: 1px solid rgba(255,255,255,0.1);">
    <button onclick="closeLeadModal()" class="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition">
      <span class="material-symbols-outlined text-white">close</span>
    </button>
    <div class="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style="background: linear-gradient(135deg, ${primary}, ${accent});">
      <span id="modal-icon" class="material-symbols-outlined text-white text-3xl">event</span>
    </div>
    <h3 id="modal-title" class="font-display text-3xl mb-3">Prendre rendez-vous</h3>
    <p id="modal-sub" class="text-white/70 mb-6">Remplissez ce formulaire, nous vous recontactons sous 24h.</p>
    <form id="lead-form" onsubmit="submitLeadForm(event)" class="space-y-4">
      <input type="hidden" name="type" id="modal-type" value="rdv" />
      <input type="hidden" name="vehicule" id="modal-vehicle" value="" />
      <input type="text" name="nom" required placeholder="Votre nom *" class="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-primary focus:outline-none transition" />
      <input type="tel" name="telephone" required placeholder="Téléphone *" class="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-primary focus:outline-none transition" />
      <input type="email" name="email" placeholder="Email" class="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-primary focus:outline-none transition" />
      <input type="date" name="date_souhaitee" id="modal-date" class="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white focus:border-primary focus:outline-none transition" />
      <textarea name="message" rows="3" placeholder="Précisez votre demande..." class="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white placeholder-white/40 focus:border-primary focus:outline-none transition"></textarea>
      <button type="submit" id="modal-submit" class="btn-glow w-full py-4 rounded-xl font-bold uppercase tracking-wider inline-flex items-center justify-center gap-2">
        <span class="material-symbols-outlined">send</span><span id="modal-submit-text">Envoyer ma demande</span>
      </button>
      <p class="text-xs text-white/40 text-center">🔒 Vos infos restent confidentielles. Réponse sous 24h.</p>
    </form>
    <div id="lead-success" class="hidden text-center py-8">
      <div class="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4" style="background: linear-gradient(135deg, #10b981, #059669);">
        <span class="material-symbols-outlined text-white text-5xl" style="font-variation-settings: 'FILL' 1;">check</span>
      </div>
      <h3 class="font-display text-3xl mb-3 text-white">Envoyé ! 🎉</h3>
      <p class="text-white/70 mb-6">Nous vous recontactons sous <strong>24h ouvrées</strong>.</p>
      <button type="button" onclick="closeLeadModal()" class="btn-glow px-8 py-3 rounded-xl font-bold uppercase tracking-wider">Fermer</button>
    </div>
  </div>
</div>

<!-- ═══ Sticky CTA tel mobile ═══ -->
${phoneDigits ? `<a href="tel:${phoneDigits}" class="md:hidden fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full btn-glow flex items-center justify-center"><span class="material-symbols-outlined text-2xl">call</span></a>` : ""}

<script>
(function() {
  var modal = document.getElementById('lead-modal');
  var form = document.getElementById('lead-form');
  var success = document.getElementById('lead-success');
  var icon = document.getElementById('modal-icon');
  var title = document.getElementById('modal-title');
  var sub = document.getElementById('modal-sub');
  var typeInput = document.getElementById('modal-type');
  var vehicleInput = document.getElementById('modal-vehicle');
  var dateInput = document.getElementById('modal-date');
  var submitText = document.getElementById('modal-submit-text');
  var configs = {
    rdv:    { icon: 'event',          title: 'Prendre rendez-vous',   sub: 'Choisissez votre créneau, nous confirmons sous 24h.', submit: 'Demander ce RDV',  showDate: true },
    devis:  { icon: 'request_quote',  title: 'Demander un devis',     sub: 'Décrivez votre besoin, devis sous 24h sans engagement.', submit: 'Recevoir mon devis',showDate: false },
    essai:  { icon: 'car_rental',     title: 'Réserver un essai',     sub: 'Réservez un essai gratuit, on s\\'occupe de tout.',    submit: 'Réserver cet essai',showDate: true },
    contact:{ icon: 'mail',           title: 'Nous contacter',        sub: 'Une question ? Réponse rapide garantie.',                submit: 'Envoyer mon message',showDate: false },
  };
  window.openLeadModal = function(type, vehicleTitle) {
    var cfg = configs[type] || configs.contact;
    typeInput.value = type;
    vehicleInput.value = vehicleTitle || '';
    icon.textContent = cfg.icon;
    title.textContent = vehicleTitle ? cfg.title + ' — ' + vehicleTitle : cfg.title;
    sub.textContent = cfg.sub;
    submitText.textContent = cfg.submit;
    dateInput.style.display = cfg.showDate ? '' : 'none';
    form.classList.remove('hidden'); success.classList.add('hidden');
    form.reset(); typeInput.value = type; vehicleInput.value = vehicleTitle || '';
    modal.classList.remove('hidden'); modal.classList.add('flex'); document.body.style.overflow = 'hidden';
  };
  window.closeLeadModal = function() {
    modal.classList.add('hidden'); modal.classList.remove('flex'); document.body.style.overflow = '';
  };
  window.submitLeadForm = function(e) {
    e.preventDefault();
    var btn = document.getElementById('modal-submit'); btn.disabled = true;
    var oldText = submitText.textContent; submitText.textContent = 'Envoi...';
    var fd = new FormData(form);
    var type = fd.get('type'); var data = {};
    fd.forEach(function(v, k) { if (k !== 'type' && v) data[k] = v; });
    fetch('/api/prospect/${slug}/lead', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ type: type, form: data })})
      .then(function(r){return r.json();}).then(function(j){
        if (j.success) { form.classList.add('hidden'); success.classList.remove('hidden'); }
        else { alert('Erreur, réessayez ou appelez directement.'); btn.disabled = false; submitText.textContent = oldText; }
      }).catch(function(){ alert('Erreur réseau.'); btn.disabled = false; submitText.textContent = oldText; });
  };
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeLeadModal(); });
})();
</script>

</body>
</html>`;
}
