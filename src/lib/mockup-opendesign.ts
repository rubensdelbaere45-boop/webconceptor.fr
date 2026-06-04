/**
 * Mockup Open Design — Générateur de maquettes basé sur les design systems d'Open Design
 * (https://github.com/nexu-io/open-design)
 *
 * Avantages vs Stitch :
 * - Gratuit, illimité, instantané
 * - 1 design system unique par métier (cafe, premium, elegant, etc.)
 * - Toujours beau, jamais de banners moches
 * - Tokens CSS pro (couleurs, typo, spacing)
 *
 * Le design est unique par métier + variations par hash du nom (mêmes inputs = même maquette).
 */

// Mapping métier → design system Open Design
// Artisans (plombier, electricien, garage) = budget élevé → design "artisan-premium" sur-mesure.
const BUSINESS_TO_DESIGN: Record<string, { name: string; emoji: string }> = {
  // ── HORECA ────────────────────────────────────────────
  restaurant:   { name: "warm-editorial",   emoji: "🍽️" },
  boulangerie:  { name: "cafe",             emoji: "🥖" },
  patisserie:   { name: "elegant",          emoji: "🍰" },
  cafe:         { name: "cafe",             emoji: "☕" },
  glacier:      { name: "warm-editorial",   emoji: "🍦" },
  // ── BEAUTÉ / BIEN-ÊTRE ───────────────────────────────
  coiffeur:     { name: "premium",          emoji: "💇" },
  institut:     { name: "elegant",          emoji: "💆" },
  // ── ARTISANS — design premium métier ─────────────────
  // Style "artisan-premium" : sombre, doré, robuste, confiance
  // → ces métiers paient plus, méritent du sur-mesure
  plombier:     { name: "artisan-premium",  emoji: "🔧" },
  electricien:  { name: "artisan-premium",  emoji: "⚡" },
  garage:       { name: "artisan-premium",  emoji: "🚙" },
  menuisier:    { name: "artisan-premium",  emoji: "🪚" },
  serrurier:    { name: "artisan-premium",  emoji: "🔐" },
  carreleur:    { name: "artisan-premium",  emoji: "🧱" },
  peintre:      { name: "artisan-premium",  emoji: "🎨" },
  couvreur:     { name: "artisan-premium",  emoji: "🏠" },
  macon:        { name: "artisan-premium",  emoji: "🧱" },
  charpentier:  { name: "artisan-premium",  emoji: "🪵" },
  // ── SANTÉ ─────────────────────────────────────────────
  osteo:        { name: "minimal",          emoji: "🦴" },
  dentiste:     { name: "minimal",          emoji: "🦷" },
  // ── AUTRES ───────────────────────────────────────────
  fleuriste:    { name: "warm-editorial",   emoji: "💐" },
  salle_sport:  { name: "energetic",        emoji: "💪" },
  auto_ecole:   { name: "professional",     emoji: "🚗" },
  epicerie:     { name: "warm-editorial",   emoji: "🛒" },
};

// Tokens CSS embarqués (extraits d'Open Design)
const DESIGN_TOKENS: Record<string, string> = {
  "warm-editorial": `
    --bg:#fdfaf3;--surface:#fff;--surface-warm:#f5ead4;--fg:#1a1612;--fg-2:#4a3f33;--muted:#7a6b5a;
    --accent:#b8794d;--accent-hover:#9d6840;--border:#e8dfd1;--success:#4f8a4f;
    --font-display:"Playfair Display",Georgia,serif;--font-body:"Inter",system-ui,sans-serif;
    --text-base:17px;--text-2xl:42px;--text-3xl:64px;--text-4xl:88px;--leading-body:1.62;
    --radius:4px;
  `,
  "cafe": `
    --bg:#fbf6ee;--surface:#fffdf8;--surface-warm:#f1e3cf;--fg:#201914;--fg-2:#4c4037;--muted:#7a6d63;
    --accent:#9b5b32;--accent-hover:#83502c;--border:#ded2c3;--success:#4f8a4f;
    --font-display:Georgia,"Times New Roman",serif;--font-body:Inter,system-ui,sans-serif;
    --text-base:17px;--text-2xl:42px;--text-3xl:64px;--text-4xl:88px;--leading-body:1.62;
    --radius:6px;
  `,
  "premium": `
    --bg:#faf8f4;--surface:#fff;--surface-warm:#f0e7d8;--fg:#1c1b19;--fg-2:#4b4740;--muted:#746d63;
    --accent:#a06a3b;--accent-hover:#88582e;--border:#ded6c9;--success:#3f8f5f;
    --font-display:"Canela",Georgia,serif;--font-body:Inter,system-ui,sans-serif;
    --text-base:16px;--text-2xl:40px;--text-3xl:60px;--text-4xl:84px;--leading-body:1.58;
    --radius:2px;
  `,
  "elegant": `
    --bg:#faf8f5;--surface:#fff;--surface-warm:#ede3d4;--fg:#171513;--fg-2:#3d3631;--muted:#766c63;
    --accent:#8c6a47;--accent-hover:#735839;--border:#dfd5c5;--success:#5a8a5a;
    --font-display:"Cormorant Garamond",Georgia,serif;--font-body:Inter,system-ui,sans-serif;
    --text-base:17px;--text-2xl:44px;--text-3xl:68px;--text-4xl:92px;--leading-body:1.65;
    --radius:0;
  `,
  "minimal": `
    --bg:#fff;--surface:#fff;--surface-warm:#f5f5f5;--fg:#0a0a0a;--fg-2:#404040;--muted:#737373;
    --accent:#171717;--accent-hover:#000;--border:#e5e5e5;--success:#16a34a;
    --font-display:"Inter Display",Inter,system-ui,sans-serif;--font-body:Inter,system-ui,sans-serif;
    --text-base:16px;--text-2xl:36px;--text-3xl:56px;--text-4xl:80px;--leading-body:1.55;
    --radius:8px;
  `,
  "clean": `
    --bg:#fafafa;--surface:#fff;--surface-warm:#f0f4f8;--fg:#0f172a;--fg-2:#334155;--muted:#64748b;
    --accent:#0066ff;--accent-hover:#0052cc;--border:#e2e8f0;--success:#16a34a;
    --font-display:"Inter",system-ui,sans-serif;--font-body:"Inter",system-ui,sans-serif;
    --text-base:16px;--text-2xl:36px;--text-3xl:54px;--text-4xl:78px;--leading-body:1.55;
    --radius:10px;
  `,
  "bold": `
    --bg:#0a0a0a;--surface:#171717;--surface-warm:#262626;--fg:#fafafa;--fg-2:#d4d4d4;--muted:#a3a3a3;
    --accent:#FFD700;--accent-hover:#e6c200;--border:#404040;--success:#22c55e;
    --font-display:"Space Grotesk",Inter,sans-serif;--font-body:Inter,system-ui,sans-serif;
    --text-base:16px;--text-2xl:40px;--text-3xl:64px;--text-4xl:96px;--leading-body:1.55;
    --radius:0;
  `,
  "energetic": `
    --bg:#fff;--surface:#fff;--surface-warm:#ffedd5;--fg:#1c1917;--fg-2:#44403c;--muted:#78716c;
    --accent:#ea580c;--accent-hover:#c2410c;--border:#fed7aa;--success:#16a34a;
    --font-display:"Inter Tight",Inter,sans-serif;--font-body:Inter,system-ui,sans-serif;
    --text-base:16px;--text-2xl:38px;--text-3xl:58px;--text-4xl:82px;--leading-body:1.55;
    --radius:16px;
  `,
  "professional": `
    --bg:#fff;--surface:#fff;--surface-warm:#f1f5f9;--fg:#0f172a;--fg-2:#334155;--muted:#64748b;
    --accent:#1e40af;--accent-hover:#1e3a8a;--border:#cbd5e1;--success:#15803d;
    --font-display:"Inter",system-ui,sans-serif;--font-body:"Inter",system-ui,sans-serif;
    --text-base:16px;--text-2xl:38px;--text-3xl:56px;--text-4xl:80px;--leading-body:1.55;
    --radius:6px;
  `,
  // Design sur-mesure pour les artisans (plombier, électricien, garage, menuisier...)
  // Style : sombre/anthracite, accent doré chaleureux, robuste, confiance
  // Cible un budget premium et un univers métier (chantier, savoir-faire)
  "artisan-premium": `
    --bg:#0f1419;--surface:#1a1f26;--surface-warm:#252b33;--fg:#f5f1e8;--fg-2:#c9c2b3;--muted:#8a8275;
    --accent:#d4a557;--accent-hover:#b8893c;--border:#2d343d;--success:#5fa066;
    --font-display:"Bebas Neue","Inter Tight",Inter,sans-serif;--font-body:Inter,system-ui,sans-serif;
    --text-base:16px;--text-2xl:44px;--text-3xl:68px;--text-4xl:96px;--leading-body:1.6;
    --radius:4px;
  `,
};

// Photos Unsplash de haute qualité par métier
const HERO_PHOTOS: Record<string, string> = {
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=2000&q=90&auto=format&fit=crop",
  boulangerie: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=2000&q=90&auto=format&fit=crop",
  patisserie: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=2000&q=90&auto=format&fit=crop",
  cafe: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=2000&q=90&auto=format&fit=crop",
  glacier: "https://images.unsplash.com/photo-1567206563114-c179900d7065?w=2000&q=90&auto=format&fit=crop",
  coiffeur: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=2000&q=90&auto=format&fit=crop",
  institut: "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=2000&q=90&auto=format&fit=crop",
  plombier: "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=2000&q=90&auto=format&fit=crop",
  electricien: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=2000&q=90&auto=format&fit=crop",
  garage: "https://images.unsplash.com/photo-1632823471565-1ecdf5664c1e?w=2000&q=90&auto=format&fit=crop",
  menuisier: "https://images.unsplash.com/photo-1601058268499-e52658b8bb88?w=2000&q=90&auto=format&fit=crop",
  serrurier: "https://images.unsplash.com/photo-1582138825658-c5dc3b3a1ec1?w=2000&q=90&auto=format&fit=crop",
  carreleur: "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=2000&q=90&auto=format&fit=crop",
  peintre: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=2000&q=90&auto=format&fit=crop",
  couvreur: "https://images.unsplash.com/photo-1599692392708-09c0a59d6c7c?w=2000&q=90&auto=format&fit=crop",
  macon: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=2000&q=90&auto=format&fit=crop",
  charpentier: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=2000&q=90&auto=format&fit=crop",
  osteo: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=2000&q=90&auto=format&fit=crop",
  dentiste: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=2000&q=90&auto=format&fit=crop",
  fleuriste: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=2000&q=90&auto=format&fit=crop",
  salle_sport: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=2000&q=90&auto=format&fit=crop",
  auto_ecole: "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=2000&q=90&auto=format&fit=crop",
  epicerie: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=2000&q=90&auto=format&fit=crop",
  default: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=2000&q=90&auto=format&fit=crop",
};

const SECONDARY_PHOTOS: Record<string, string[]> = {
  restaurant: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&q=80",
    "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1200&q=80",
  ],
  boulangerie: [
    "https://images.unsplash.com/photo-1585478259715-4d3db5d97f74?w=1200&q=80",
    "https://images.unsplash.com/photo-1555507036-ab794f4afe5a?w=1200&q=80",
    "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=1200&q=80",
  ],
  patisserie: [
    "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=1200&q=80",
    "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?w=1200&q=80",
    "https://images.unsplash.com/photo-1579740765855-71bb79656e97?w=1200&q=80",
  ],
  glacier: [
    "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=1200&q=80",
    "https://images.unsplash.com/photo-1576506542790-51244b486a6b?w=1200&q=80",
    "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=1200&q=80",
  ],
  plombier: [
    "https://images.unsplash.com/photo-1521207418485-99c705420785?w=1200&q=80",  // robinet pro
    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1200&q=80",  // intervention
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",     // chaudière
  ],
  electricien: [
    "https://images.unsplash.com/photo-1565608438257-fac3c27beb36?w=1200&q=80",  // tableau électrique
    "https://images.unsplash.com/photo-1565514020179-026b92b84bb6?w=1200&q=80",  // installation
    "https://images.unsplash.com/photo-1573164574572-cb89e39749b4?w=1200&q=80",  // câblage
  ],
  garage: [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&q=80",  // garage moderne
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&q=80",  // voiture luxe
    "https://images.unsplash.com/photo-1487754180451-c456f719a1fc?w=1200&q=80",  // moteur
  ],
  menuisier: [
    "https://images.unsplash.com/photo-1565195456-ab0a8b25b85b?w=1200&q=80",     // atelier bois
    "https://images.unsplash.com/photo-1572297972019-2d61e7a5fa5b?w=1200&q=80",  // travail bois
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&q=80",     // meuble pro
  ],
  default: [
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&q=80",
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&q=80",
    "https://images.unsplash.com/photo-1542744095-291d1f67b221?w=1200&q=80",
  ],
};

interface OpenDesignProspect {
  name: string;
  city?: string;
  phone?: string;
  email?: string;
  business_type?: string;
  google_rating?: number;
  google_reviews_count?: number;
  about_scraped?: string;
  hours?: string;
  reviews?: Array<{ author: string; rating: number; text: string }>;
}

interface MockupContent {
  heroTitle: string;
  heroSubtitle: string;
  aboutTitle: string;
  aboutText: string;
  services: Array<{ name: string; description?: string; price?: string }>;
  servicesIntro?: string;
}

function esc(s: string): string {
  return String(s || "").replace(/[<>&"]/g, c => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c]!));
}

/**
 * Génère une maquette HTML complète avec un design system Open Design.
 * Indépendant de Stitch — gratuit, instantané, illimité.
 */
export function generateOpenDesignMockup(
  prospect: OpenDesignProspect,
  content: MockupContent,
  origin: string = "https://webconceptor.fr"
): string {
  const bt = prospect.business_type || "default";
  const designKey = BUSINESS_TO_DESIGN[bt]?.name || "warm-editorial";
  const tokens = DESIGN_TOKENS[designKey] || DESIGN_TOKENS["warm-editorial"];

  const heroPhoto = HERO_PHOTOS[bt] || HERO_PHOTOS.default;
  const photos = SECONDARY_PHOTOS[bt] || SECONDARY_PHOTOS.default;

  const phone = prospect.phone || "";
  const city = prospect.city || "";
  const phoneLink = phone ? `tel:+33${phone.replace(/^0/, "").replace(/[^0-9]/g, "")}` : "#contact";

  const rating = prospect.google_rating || 0;
  const ratingCount = prospect.google_reviews_count || 0;
  const stars = rating > 0 ? "★".repeat(Math.round(rating)) + "☆".repeat(5 - Math.round(rating)) : "";

  const reviews = (prospect.reviews || []).slice(0, 3).filter(r => r.rating >= 4 && r.text?.length > 20);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(prospect.name)} ${city ? `— ${esc(city)}` : ""}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Cormorant+Garamond:wght@400;500;600;700&family=Bebas+Neue&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
:root {${tokens}}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--font-body);background:var(--bg);color:var(--fg);line-height:var(--leading-body);-webkit-font-smoothing:antialiased;overflow-x:hidden}
img{max-width:100%;display:block}
a{color:inherit;text-decoration:none}

/* ── Navigation ─────────────────────────────────────────── */
.nav{position:fixed;top:0;left:0;right:0;z-index:50;background:rgba(255,255,255,0.92);backdrop-filter:blur(20px);border-bottom:1px solid var(--border);padding:18px 40px;display:flex;align-items:center;justify-content:space-between}
.nav-brand{font-family:var(--font-display);font-size:22px;font-weight:700;letter-spacing:-0.01em}
.nav-links{display:flex;gap:36px;font-size:14px;font-weight:500}
.nav-links a{color:var(--fg-2);transition:color .2s}
.nav-links a:hover{color:var(--accent)}
.nav-cta{padding:10px 20px;background:var(--accent);color:var(--accent-on,#fff);border-radius:var(--radius);font-size:13px;font-weight:600;border:none;cursor:pointer}
.nav-cta:hover{background:var(--accent-hover)}
@media(max-width:768px){.nav{padding:14px 20px}.nav-links{display:none}}

/* ── Hero ─────────────────────────────────────────── */
.hero{min-height:90vh;position:relative;display:flex;align-items:center;justify-content:center;text-align:center;padding:120px 20px 80px;overflow:hidden}
.hero-bg{position:absolute;inset:0;background:url('${heroPhoto}') center/cover;z-index:-2}
.hero-overlay{position:absolute;inset:0;background:linear-gradient(180deg,rgba(20,15,10,0.55),rgba(20,15,10,0.75));z-index:-1}
.hero-content{max-width:900px;color:#fff}
.hero-kicker{font-size:13px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;opacity:0.8;margin-bottom:20px}
.hero h1{font-family:var(--font-display);font-size:clamp(2.5rem,7vw,5.5rem);font-weight:700;line-height:1.05;margin-bottom:28px;color:#fff;letter-spacing:-0.02em}
.hero-sub{font-size:clamp(1.1rem,2vw,1.4rem);opacity:0.92;margin-bottom:40px;font-weight:400;max-width:680px;margin-left:auto;margin-right:auto;line-height:1.55}
.hero-cta-row{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.btn-primary{padding:16px 36px;background:var(--accent);color:#fff;font-size:15px;font-weight:600;border-radius:var(--radius);border:none;cursor:pointer;transition:transform .15s,background .2s;letter-spacing:0.02em}
.btn-primary:hover{background:var(--accent-hover);transform:translateY(-2px)}
.btn-secondary{padding:16px 36px;background:transparent;color:#fff;font-size:15px;font-weight:600;border-radius:var(--radius);border:1.5px solid rgba(255,255,255,0.5);cursor:pointer;transition:all .2s}
.btn-secondary:hover{background:rgba(255,255,255,0.1);border-color:#fff}
${rating > 0 ? `.hero-rating{margin-top:36px;display:inline-flex;align-items:center;gap:10px;padding:8px 18px;background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2);border-radius:100px;font-size:14px;backdrop-filter:blur(8px)}
.hero-stars{color:#FFD700;letter-spacing:1px}` : ""}

/* ── About ─────────────────────────────────────────── */
.about{padding:120px 40px;background:var(--surface)}
.about-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center}
.about-img{aspect-ratio:4/5;overflow:hidden;border-radius:var(--radius)}
.about-img img{width:100%;height:100%;object-fit:cover}
.about-kicker{font-size:12px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:var(--accent);margin-bottom:18px}
.about h2{font-family:var(--font-display);font-size:clamp(2rem,4vw,3.2rem);font-weight:700;line-height:1.15;margin-bottom:28px;color:var(--fg);letter-spacing:-0.02em}
.about-text p{font-size:17px;color:var(--fg-2);line-height:1.75;margin-bottom:18px}
.about-text p:last-child{margin-bottom:0}
@media(max-width:768px){.about{padding:80px 20px}.about-inner{grid-template-columns:1fr;gap:40px}.about-img{aspect-ratio:16/10}}

/* ── Services ─────────────────────────────────────────── */
.services{padding:120px 40px;background:var(--bg)}
.services-inner{max-width:1200px;margin:0 auto}
.services-header{text-align:center;margin-bottom:64px}
.services-kicker{font-size:12px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:var(--accent);margin-bottom:16px}
.services h2{font-family:var(--font-display);font-size:clamp(2rem,4vw,3rem);font-weight:700;line-height:1.15;margin-bottom:18px;letter-spacing:-0.02em}
.services-intro{font-size:17px;color:var(--muted);max-width:600px;margin:0 auto}
.services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:24px}
.service-card{background:var(--surface);padding:32px;border-radius:var(--radius);border:1px solid var(--border);transition:transform .2s,box-shadow .2s}
.service-card:hover{transform:translateY(-4px);box-shadow:0 20px 60px rgba(0,0,0,0.08)}
.service-name{font-family:var(--font-display);font-size:22px;font-weight:600;margin-bottom:10px;color:var(--fg)}
.service-desc{font-size:14px;color:var(--muted);margin-bottom:18px;line-height:1.6}
.service-price{font-size:18px;font-weight:700;color:var(--accent);font-variant-numeric:tabular-nums}
@media(max-width:768px){.services{padding:80px 20px}.service-card{padding:24px}}

/* ── Gallery ─────────────────────────────────────────── */
.gallery{padding:120px 40px;background:var(--surface-warm)}
.gallery-inner{max-width:1200px;margin:0 auto}
.gallery-header{text-align:center;margin-bottom:48px}
.gallery h2{font-family:var(--font-display);font-size:clamp(2rem,4vw,3rem);font-weight:700;margin-bottom:14px;letter-spacing:-0.02em}
.gallery-sub{font-size:16px;color:var(--muted)}
.gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}
.gallery-item{aspect-ratio:4/3;overflow:hidden;border-radius:var(--radius);position:relative}
.gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform .6s}
.gallery-item:hover img{transform:scale(1.08)}
@media(max-width:768px){.gallery{padding:80px 20px}}

${reviews.length ? `/* ── Reviews ─────────────────────────────────────────── */
.reviews{padding:120px 40px;background:var(--surface)}
.reviews-inner{max-width:1200px;margin:0 auto}
.reviews-header{text-align:center;margin-bottom:64px}
.reviews-kicker{font-size:12px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:var(--accent);margin-bottom:16px}
.reviews h2{font-family:var(--font-display);font-size:clamp(2rem,4vw,3rem);font-weight:700;letter-spacing:-0.02em}
.reviews-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:24px}
.review-card{background:var(--bg);padding:32px;border-radius:var(--radius);border:1px solid var(--border)}
.review-stars{color:#FFD700;letter-spacing:2px;margin-bottom:14px;font-size:16px}
.review-text{font-size:15px;color:var(--fg-2);line-height:1.7;margin-bottom:18px;font-style:italic}
.review-author{font-size:13px;font-weight:600;color:var(--muted)}
@media(max-width:768px){.reviews{padding:80px 20px}.review-card{padding:24px}}` : ""}

/* ── Contact ─────────────────────────────────────────── */
.contact{padding:120px 40px;background:var(--fg);color:#fff}
.contact-inner{max-width:1100px;margin:0 auto;text-align:center}
.contact-kicker{font-size:12px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:var(--accent);margin-bottom:18px;opacity:0.9}
.contact h2{font-family:var(--font-display);font-size:clamp(2rem,4vw,3.2rem);font-weight:700;margin-bottom:36px;letter-spacing:-0.02em}
.contact-info{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:32px;margin-top:48px}
.contact-block-label{font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;opacity:0.6;margin-bottom:10px}
.contact-block-value{font-size:17px;font-weight:500}
.contact-block-value a{color:var(--accent);text-decoration:underline}
.contact-cta-row{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:48px}
@media(max-width:768px){.contact{padding:80px 20px}}

/* ── Footer ─────────────────────────────────────────── */
.footer{background:var(--fg);color:#fff;padding:32px 40px;text-align:center;border-top:1px solid rgba(255,255,255,0.1);font-size:13px;opacity:0.6}
</style>
</head>
<body>

<nav class="nav">
  <div class="nav-brand">${esc(prospect.name).slice(0, 40)}</div>
  <div class="nav-links">
    <a href="#about">À propos</a>
    <a href="#services">Services</a>
    <a href="#contact">Contact</a>
  </div>
  <a href="${phoneLink}" class="nav-cta">${phone ? "Nous appeler" : "Nous contacter"}</a>
</nav>

<section class="hero">
  <div class="hero-bg"></div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="hero-kicker">${city ? esc(city) : "France"} · ${BUSINESS_TO_DESIGN[bt]?.emoji || "✨"}</div>
    <h1>${esc(content.heroTitle || prospect.name)}</h1>
    <p class="hero-sub">${esc(content.heroSubtitle || `Votre ${bt} de confiance${city ? ` à ${city}` : ""}`)}</p>
    <div class="hero-cta-row">
      <a href="#services" class="btn-primary">Découvrir nos services</a>
      <a href="#contact" class="btn-secondary">Nous contacter</a>
    </div>
    ${rating > 0 ? `<div class="hero-rating"><span class="hero-stars">${stars}</span><span>${rating}/5 · ${ratingCount} avis</span></div>` : ""}
  </div>
</section>

<section id="about" class="about">
  <div class="about-inner">
    <div class="about-img"><img src="${photos[0] || heroPhoto}" alt="${esc(prospect.name)}" loading="lazy"></div>
    <div class="about-text">
      <div class="about-kicker">Notre histoire</div>
      <h2>${esc(content.aboutTitle || `Un ${bt} qui prend soin de vous`)}</h2>
      ${(content.aboutText || `${prospect.name} vous accueille${city ? ` au cœur de ${city}` : ""} avec une équipe passionnée et engagée. Notre savoir-faire et notre attention aux détails font toute la différence.`).split(/(?<=[.!?])\s+/).filter(s => s.length > 10).map(s => `<p>${esc(s)}</p>`).join("")}
    </div>
  </div>
</section>

<section id="services" class="services">
  <div class="services-inner">
    <div class="services-header">
      <div class="services-kicker">Nos prestations</div>
      <h2>Découvrez nos services</h2>
      ${content.servicesIntro ? `<p class="services-intro">${esc(content.servicesIntro)}</p>` : ""}
    </div>
    <div class="services-grid">
      ${content.services.slice(0, 6).map(s => `
        <div class="service-card">
          <div class="service-name">${esc(s.name)}</div>
          ${s.description ? `<div class="service-desc">${esc(s.description)}</div>` : ""}
          ${s.price ? `<div class="service-price">${esc(s.price)}</div>` : ""}
        </div>
      `).join("")}
    </div>
  </div>
</section>

<section class="gallery">
  <div class="gallery-inner">
    <div class="gallery-header">
      <h2>Notre univers</h2>
      <p class="gallery-sub">Plongez dans l'ambiance de ${esc(prospect.name)}</p>
    </div>
    <div class="gallery-grid">
      ${photos.slice(0, 3).map((p, i) => `<div class="gallery-item"><img src="${p}" alt="Photo ${i + 1}" loading="lazy"></div>`).join("")}
    </div>
  </div>
</section>

${reviews.length ? `<section class="reviews">
  <div class="reviews-inner">
    <div class="reviews-header">
      <div class="reviews-kicker">Témoignages</div>
      <h2>Ce qu'ils disent de nous</h2>
    </div>
    <div class="reviews-grid">
      ${reviews.map(r => `
        <div class="review-card">
          <div class="review-stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</div>
          <p class="review-text">« ${esc(r.text.slice(0, 200))}${r.text.length > 200 ? "…" : ""} »</p>
          <div class="review-author">— ${esc(r.author)}</div>
        </div>
      `).join("")}
    </div>
  </div>
</section>` : ""}

<section id="contact" class="contact">
  <div class="contact-inner">
    <div class="contact-kicker">Prenons contact</div>
    <h2>Une question ? Contactez-nous</h2>
    <div class="contact-info">
      ${phone ? `<div><div class="contact-block-label">Téléphone</div><div class="contact-block-value"><a href="${phoneLink}">${esc(phone)}</a></div></div>` : ""}
      ${city ? `<div><div class="contact-block-label">Adresse</div><div class="contact-block-value">${esc(city)}</div></div>` : ""}
      ${prospect.hours ? `<div><div class="contact-block-label">Horaires</div><div class="contact-block-value">${esc(prospect.hours)}</div></div>` : ""}
    </div>
    <div class="contact-cta-row">
      <a href="${phoneLink}" class="btn-primary">${phone ? `Appeler le ${esc(phone)}` : "Nous appeler"}</a>
    </div>
  </div>
</section>

<footer class="footer">
  © ${new Date().getFullYear()} ${esc(prospect.name)}${city ? ` — ${esc(city)}` : ""}
</footer>

<img src="${origin}/api/prospect/track-view" data-slug="${esc(prospect.name).toLowerCase().replace(/[^a-z0-9]+/g, "-")}" style="display:none" width="1" height="1" aria-hidden="true">
</body>
</html>`;
}
