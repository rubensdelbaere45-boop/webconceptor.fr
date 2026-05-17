/* ══════════════════════════════════════════
   MOCKUP CUSTOM — générateur qui utilise le DeepAudit pour produire
   une maquette VRAIMENT sur-mesure par prospect (pas un template).

   Différences clés vs mockup-adaptive (legacy) :
   - Couleurs = vraies couleurs dominantes extraites de leur site
   - Photos = leurs photos réelles (URLs absolues scrapées)
   - Textes = vraie prose "à propos" + titres scrapés
   - Sections ordonnées selon le brief d'amélioration Claude
   - Bloc "Améliorations apportées" qui liste les missingFeatures
   - Bloc "Comparatif" (leur site ↓ vs notre maquette ↑)
   - Style (tone) influence : typo, layout, densité, couleurs de fond
     → 6 variantes visuelles selon tone (luxe / chaleureux / moderne /
       artisanal / pro / simple)
   ══════════════════════════════════════════ */

import type { DeepAudit } from "@/lib/deep-audit";

// ─── Types ───────────────────────────────────────────────────

export interface CustomProspect {
  id: string;
  slug: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  google_rating?: number;
  google_reviews_count?: number;
  photos?: string[];     // Google Places references (fallback)
  website_photos?: string[] | null;
  hours?: string;
  business_type?: string;
  reviews?: Array<{ author: string; rating: number; text: string; timeAgo: string }> | null;
}

// ─── Utilitaires couleur ─────────────────────────────────────

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = (hex || "").replace(/^#/, "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return null;
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return "#" + [clamp(r), clamp(g), clamp(b)].map((n) => n.toString(16).padStart(2, "0")).join("");
}

function darken(hex: string, pct: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const f = 1 - pct;
  return rgbToHex(rgb.r * f, rgb.g * f, rgb.b * f);
}

function lighten(hex: string, pct: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r + (255 - rgb.r) * pct, rgb.g + (255 - rgb.g) * pct, rgb.b + (255 - rgb.b) * pct);
}

function isLightColor(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq > 160;
}

// ─── Helpers ─────────────────────────────────────────────────

function escape(s: string): string {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function safePhoto(url: string, prospect: CustomProspect, origin: string): string {
  if (!url) return "";
  // Si c'est une référence Google Places, on proxy via notre endpoint
  if (/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(url)) {
    return `${origin}/api/prospect/photo?ref=${encodeURIComponent(url)}`;
  }
  // URL absolue du site du prospect (scrapée) — OK si HTTPS
  if (/^https:\/\//i.test(url)) return url;
  if (/^http:\/\//i.test(url)) return url; // accepte HTTP aussi (sites vieux)
  return "";
}

function resolvePhotos(audit: DeepAudit, prospect: CustomProspect, origin: string, max = 8): string[] {
  const out: string[] = [];
  // 1. Photos scrapées du site actuel (priorité — ce sont LEURS photos)
  for (const u of audit.contentToKeep.photos || []) {
    if (out.length >= max) break;
    const safe = safePhoto(u, prospect, origin);
    if (safe) out.push(safe);
  }
  // 2. Photos du site web du prospect (scrapées via website_photos)
  for (const u of prospect.website_photos || []) {
    if (out.length >= max) break;
    if (u && u.startsWith("http") && !out.includes(u)) out.push(u);
  }
  // 3. Fallback Google Places
  for (const u of prospect.photos || []) {
    if (out.length >= max) break;
    const safe = safePhoto(u, prospect, origin);
    if (safe && !out.includes(safe)) out.push(safe);
  }
  return out;
}

// ─── Theme derivation ────────────────────────────────────────
// À partir du tone du site actuel, on choisit une variante de design.
// Chaque variante = combinaison de CSS (font-family, spacing, border-radius,
// case display, etc.) qui donne une ambiance distincte.

type Tone = DeepAudit["brand"]["tone"];

interface ThemeVariant {
  fontSerif: string;       // stack serif
  fontSans: string;        // stack sans-serif
  baseFontSize: string;
  headingScale: string;
  borderRadius: string;
  buttonRadius: string;
  sectionPadding: string;
  bgNeutralLight: string;  // fond sections claires
  bgNeutralDark: string;   // fond sections sombres
  shadowStrength: string;
  letterSpacing: string;
  layoutDensity: "airy" | "dense" | "normal";
  heroLayout: "centered" | "split-left" | "split-right" | "overlay";
}

function pickThemeVariant(tone: Tone): ThemeVariant {
  switch (tone) {
    case "luxe":
      return {
        fontSerif: "'Fraunces', 'Playfair Display', Georgia, serif",
        fontSans: "'Inter', system-ui, sans-serif",
        baseFontSize: "16px",
        headingScale: "clamp(2.5rem, 5vw, 4.5rem)",
        borderRadius: "0px",
        buttonRadius: "0px",
        sectionPadding: "120px 40px",
        bgNeutralLight: "#F8F5EF",
        bgNeutralDark: "#1A1714",
        shadowStrength: "0 40px 80px rgba(0,0,0,0.15)",
        letterSpacing: "0.01em",
        layoutDensity: "airy",
        heroLayout: "centered",
      };
    case "chaleureux":
      return {
        fontSerif: "'Lora', 'Merriweather', Georgia, serif",
        fontSans: "'Nunito', 'Open Sans', system-ui, sans-serif",
        baseFontSize: "17px",
        headingScale: "clamp(2rem, 4vw, 3.5rem)",
        borderRadius: "16px",
        buttonRadius: "100px",
        sectionPadding: "80px 40px",
        bgNeutralLight: "#FFF9F4",
        bgNeutralDark: "#3A2815",
        shadowStrength: "0 20px 40px rgba(0,0,0,0.08)",
        letterSpacing: "-0.01em",
        layoutDensity: "normal",
        heroLayout: "split-right",
      };
    case "moderne":
      return {
        fontSerif: "'Syne', 'Space Grotesk', Georgia, serif",
        fontSans: "'Inter', 'Space Grotesk', system-ui, sans-serif",
        baseFontSize: "16px",
        headingScale: "clamp(2.5rem, 6vw, 5rem)",
        borderRadius: "8px",
        buttonRadius: "6px",
        sectionPadding: "100px 40px",
        bgNeutralLight: "#FAFAFA",
        bgNeutralDark: "#0A0A0A",
        shadowStrength: "0 24px 48px rgba(0,0,0,0.12)",
        letterSpacing: "-0.03em",
        layoutDensity: "airy",
        heroLayout: "split-left",
      };
    case "artisanal":
      return {
        fontSerif: "'Amaranth', 'Frank Ruhl Libre', Georgia, serif",
        fontSans: "'DM Sans', 'Work Sans', system-ui, sans-serif",
        baseFontSize: "17px",
        headingScale: "clamp(2rem, 4.5vw, 4rem)",
        borderRadius: "12px",
        buttonRadius: "8px",
        sectionPadding: "96px 40px",
        bgNeutralLight: "#F7F1E5",
        bgNeutralDark: "#2A1F13",
        shadowStrength: "0 16px 32px rgba(0,0,0,0.1)",
        letterSpacing: "0",
        layoutDensity: "normal",
        heroLayout: "overlay",
      };
    case "pro":
      return {
        fontSerif: "'Source Serif Pro', Georgia, serif",
        fontSans: "'Inter', 'IBM Plex Sans', system-ui, sans-serif",
        baseFontSize: "15px",
        headingScale: "clamp(2rem, 4vw, 3.5rem)",
        borderRadius: "6px",
        buttonRadius: "6px",
        sectionPadding: "80px 40px",
        bgNeutralLight: "#F5F7FA",
        bgNeutralDark: "#0F172A",
        shadowStrength: "0 10px 24px rgba(0,0,0,0.06)",
        letterSpacing: "-0.01em",
        layoutDensity: "dense",
        heroLayout: "split-left",
      };
    case "simple":
    default:
      return {
        fontSerif: "Georgia, serif",
        fontSans: "'Inter', system-ui, sans-serif",
        baseFontSize: "16px",
        headingScale: "clamp(2rem, 4vw, 3.2rem)",
        borderRadius: "10px",
        buttonRadius: "100px",
        sectionPadding: "72px 40px",
        bgNeutralLight: "#FBFBFB",
        bgNeutralDark: "#1F1F1F",
        shadowStrength: "0 12px 28px rgba(0,0,0,0.08)",
        letterSpacing: "-0.02em",
        layoutDensity: "normal",
        heroLayout: "centered",
      };
  }
}

// ─── Section renderers ───────────────────────────────────────

interface RenderCtx {
  audit: DeepAudit;
  prospect: CustomProspect;
  origin: string;
  theme: ThemeVariant;
  photos: string[];
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  textOnPrimary: string;  // "#fff" ou "#1a1a1a" selon luminosité primary
}

function renderHero(ctx: RenderCtx): string {
  const { prospect, audit, photos, theme, primary, textOnPrimary } = ctx;
  const name = escape(prospect.name);
  const city = prospect.city ? ` · ${escape(prospect.city)}` : "";
  const hero = photos[0] || "";
  const title = audit.contentToKeep.headingsH1H2?.[0] || prospect.name;
  const subtitle = audit.improvementBrief.heroConcept || `${audit.brand.tone === "luxe" ? "L'excellence" : "La qualité"} artisanale${city}`;
  const toneLabels: Record<string, string> = { luxe: "Haut de gamme", chaleureux: "Convivial", moderne: "Contemporain", artisanal: "Artisanal", pro: "Professionnel", simple: "Essentiel" };
  const heroTag = toneLabels[audit.brand.tone] || audit.brand.tone;

  // Layout variant
  if (theme.heroLayout === "overlay" && hero) {
    return `<section class="hero hero-overlay">
  <div class="hero-bg"><img src="${escape(hero)}" alt="${name}" loading="eager"></div>
  <div class="hero-overlay-content">
    <div class="hero-tag">${escape(heroTag)}${city}</div>
    <h1>${escape(title)}</h1>
    <p class="hero-sub">${escape(subtitle)}</p>
    <div class="hero-ctas">
      <a href="#services" class="btn-primary">Découvrir</a>
      <a href="#contact" class="btn-outline-light">Nous contacter</a>
    </div>
  </div>
</section>`;
  }

  if (theme.heroLayout === "centered") {
    return `<section class="hero hero-centered">
  <div class="hero-tag">${escape(heroTag)}${city}</div>
  <h1>${escape(title)}</h1>
  <p class="hero-sub">${escape(subtitle)}</p>
  <div class="hero-ctas">
    <a href="#services" class="btn-primary">Découvrir</a>
    <a href="#contact" class="btn-outline">Nous contacter</a>
  </div>
  ${hero ? `<div class="hero-photo-full"><img src="${escape(hero)}" alt="${name}" loading="eager"></div>` : ""}
</section>`;
  }

  // Split variants (gauche ou droite)
  const reverseOrder = theme.heroLayout === "split-right";
  return `<section class="hero hero-split ${reverseOrder ? "reverse" : ""}">
  <div class="hero-text">
    <div class="hero-tag">${escape(heroTag)}${city}</div>
    <h1>${escape(title)}</h1>
    <p class="hero-sub">${escape(subtitle)}</p>
    <div class="hero-ctas">
      <a href="#services" class="btn-primary">Découvrir</a>
      <a href="#contact" class="btn-outline">Nous contacter</a>
    </div>
  </div>
  <div class="hero-photo">
    ${hero ? `<img src="${escape(hero)}" alt="${name}" loading="eager">` : `<div class="hero-placeholder" style="background:linear-gradient(135deg,${primary},${darken(primary,0.3)});color:${textOnPrimary}">${name.slice(0, 2).toUpperCase()}</div>`}
  </div>
</section>`;
}

function renderAbout(ctx: RenderCtx): string {
  const { prospect, audit } = ctx;
  // On utilise en priorité l'aboutText audit, sinon on construit depuis les USPs
  let aboutText = audit.contentToKeep.aboutText || "";
  if (aboutText.length < 80 && audit.contentToKeep.uniqueSellingPoints?.length) {
    aboutText = audit.contentToKeep.uniqueSellingPoints.join(" ");
  }
  if (aboutText.length < 80) {
    const city = prospect.city ? ` à ${prospect.city}` : "";
    aboutText = `${prospect.name} vous accueille${city} avec le savoir-faire et l'attention qui font notre réputation.`;
  }
  const usps = audit.contentToKeep.uniqueSellingPoints?.slice(0, 3) || [];
  return `<section id="apropos" class="about">
  <div class="container">
    <div class="section-kicker">À propos</div>
    <h2>${escape(prospect.name)}</h2>
    <p class="about-text">${escape(aboutText)}</p>
    ${usps.length > 0 ? `
    <div class="usp-grid">
      ${usps.map((u) => `<div class="usp-item"><span class="usp-bullet">✓</span><span>${escape(u)}</span></div>`).join("")}
    </div>` : ""}
    ${prospect.google_rating ? `
    <div class="stats">
      <div class="stat"><div class="stat-num">${prospect.google_rating.toFixed(1)}/5</div><div class="stat-label">Note Google</div></div>
      <div class="stat"><div class="stat-num">${prospect.google_reviews_count || 0}</div><div class="stat-label">Avis clients</div></div>
      ${prospect.city ? `<div class="stat"><div class="stat-num">${escape(prospect.city)}</div><div class="stat-label">Emplacement</div></div>` : ""}
    </div>` : ""}
  </div>
</section>`;
}

function renderServices(ctx: RenderCtx): string {
  const { audit, prospect } = ctx;
  const headings = audit.contentToKeep.headingsH1H2 || [];
  // Services = on filtre les headings qui ressemblent à des offres
  const serviceHeadings = headings.filter((h) =>
    h.length < 50 && !/contact|propos|accueil|menu principal/i.test(h)
  ).slice(0, 6);

  const fallbackPerType: Record<string, string[]> = {
    restaurant: ["Notre carte", "Les entrées", "Les plats", "Les desserts"],
    boulangerie: ["Nos pains", "Viennoiseries", "Pâtisseries", "Sur commande"],
    patisserie: ["Gâteaux", "Chocolats", "Pièces événement", "Commandes mariage"],
    coiffeur: ["Coupes", "Colorations", "Soins", "Événements"],
    institut: ["Soins visage", "Massages", "Épilation", "Mains & pieds"],
    plombier: ["Sanitaire", "Chauffage", "Dépannage urgence", "Rénovation"],
    electricien: ["Installation", "Mise aux normes", "Dépannage", "Domotique"],
    fleuriste: ["Bouquets", "Mariages & événements", "Compositions", "Livraison"],
    garage: ["Mécanique", "Pneumatiques", "Carrosserie", "Contrôle technique"],
    dentiste: ["Soins", "Esthétique", "Implants", "Orthodontie"],
    osteo: ["Adulte", "Nourrisson", "Sportif", "Périnatal"],
    salle_sport: ["Musculation", "Cardio", "Cours collectifs", "Coaching perso"],
    chocolatier: ["Tablettes & barres", "Coffrets cadeaux", "Ganaches", "Sur commande"],
    creperie: ["Crêpes sucrées", "Galettes bretonnes", "Boissons", "Menus"],
    food_truck: ["Burgers", "Sandwichs", "Spécialités", "Menus"],
    epicerie: ["Fruits & légumes", "Produits locaux", "Épicerie fine", "Livraison"],
    kine: ["Rééducation", "Massages", "Bilan postural", "Sport & prévention"],
    auto_ecole: ["Permis B", "Code de la route", "Conduite accompagnée", "AAC"],
    menuisier: ["Menuiserie bois", "Escaliers", "Placards sur mesure", "Pose"],
    peintre: ["Peinture intérieure", "Extérieure", "Ravalement", "Décoration"],
  };
  const items = serviceHeadings.length >= 3
    ? serviceHeadings
    : (fallbackPerType[prospect.business_type || ""] || ["Notre expertise", "Qualité & savoir-faire", "Service sur-mesure", "Satisfaction garantie"]);

  return `<section id="services" class="services">
  <div class="container">
    <div class="section-kicker">Nos prestations</div>
    <h2>Ce que nous proposons</h2>
    <div class="services-grid">
      ${items.map((name) => `<div class="service-card">
        <div class="service-title">${escape(name)}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

// ── MENU AVEC VRAIS PRIX ────────────────────────────────────────────────────
// Utilisé pour les restaurants quand on a des plats scrapés avec prix réels.
const FOOD_TYPES = new Set(["restaurant","brasserie","bistrot","gastronomique","pizzeria","creperie","food_truck","bar","cafe","glacier","boulangerie","patisserie","traiteur","sushi","kebab","burger","salon_de_the","chocolatier"]);

function renderMenu(ctx: RenderCtx): string {
  const { audit, prospect, primary } = ctx;
  const businessType = prospect.business_type || "";
  if (!FOOD_TYPES.has(businessType)) return "";

  const items = audit.menuItems || [];
  if (items.length === 0) return ""; // pas de plats scrapés → on n'affiche pas

  // Grouper par catégorie
  const grouped = new Map<string, typeof items>();
  for (const item of items) {
    const cat = (item.category || "plat").toLowerCase();
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(item);
  }

  const catLabels: Record<string, string> = {
    "entrée": "Entrées",
    "entree": "Entrées",
    "plat": "Plats",
    "dessert": "Desserts",
    "boisson": "Boissons",
    "autre": "À la carte",
  };

  const hasRealPrices = items.some((m) => m.price && m.price !== "");
  const badge = hasRealPrices
    ? `<span style="display:inline-block;background:#22c55e;color:#fff;font-size:10px;font-weight:700;padding:3px 8px;border-radius:100px;margin-left:8px;vertical-align:middle;letter-spacing:0.1em">TARIFS RÉELS</span>`
    : "";

  let sectionsHtml = "";
  for (const [cat, catItems] of grouped) {
    const label = catLabels[cat] || cat;
    sectionsHtml += `
    <div class="menu-cat">
      <h3 class="menu-cat-title">${escape(label)}</h3>
      ${catItems.map((item) => `
      <div class="menu-item">
        <div class="menu-item-left">
          <span class="menu-item-name">${escape(item.name)}</span>
          ${item.description ? `<span class="menu-item-desc">${escape(item.description)}</span>` : ""}
        </div>
        ${item.price ? `<span class="menu-item-price">${escape(item.price)}</span>` : ""}
      </div>`).join("")}
    </div>`;
  }

  const menuKicker = ["boulangerie","patisserie","chocolatier"].includes(businessType) ? "Nos créations" : ["glacier"].includes(businessType) ? "Nos parfums" : "Notre carte";

  return `<section id="carte" class="menu-section">
  <div class="container">
    <div class="section-kicker">${menuKicker}</div>
    <h2>Notre carte ${badge}</h2>
    ${!hasRealPrices ? `<p style="font-size:13px;color:#888;margin-bottom:24px;font-style:italic">Tarifs à titre indicatif — contactez-nous pour les prix actuels</p>` : ""}
    <div class="menu-grid">
      ${sectionsHtml}
    </div>
  </div>
</section>
<style>
.menu-section{padding:80px 20px;background:#faf9f7}
.menu-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:48px;max-width:1100px;margin:0 auto;text-align:left}
.menu-cat-title{font-size:13px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;color:${primary};margin:0 0 16px;padding-bottom:10px;border-bottom:2px solid ${primary}20}
.menu-item{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.06)}
.menu-item:last-child{border-bottom:none}
.menu-item-left{flex:1}
.menu-item-name{display:block;font-size:15px;font-weight:600;color:#1a1a1a;margin-bottom:2px}
.menu-item-desc{display:block;font-size:13px;color:#888;line-height:1.4}
.menu-item-price{font-size:15px;font-weight:700;color:${primary};white-space:nowrap;flex-shrink:0}
@media(max-width:600px){.menu-grid{grid-template-columns:1fr}}
</style>`;
}

function renderImprovements(ctx: RenderCtx): string {
  const { audit } = ctx;
  const features = audit.improvementBrief.featuresToAdd?.slice(0, 6) || [];
  if (features.length === 0) return "";
  return `<section id="ameliorations" class="improvements">
  <div class="container">
    <div class="section-kicker">Ce qu'on apporte à votre site</div>
    <h2>Des fonctionnalités qui font la différence</h2>
    <p class="section-lead">Au-delà d'un design moderne, voici les fonctionnalités concrètes que nous ajoutons pour vous aider à gagner des clients.</p>
    <div class="improvements-grid">
      ${features.map((f, i) => `<div class="improvement-item">
        <div class="improvement-num">${String(i + 1).padStart(2, "0")}</div>
        <div class="improvement-text">${escape(f)}</div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

function renderComparison(ctx: RenderCtx): string {
  const { audit } = ctx;
  const weak = audit.weaknesses?.slice(0, 4) || [];
  const missing = audit.missingFeatures?.slice(0, 4) || [];
  const toAdd = audit.improvementBrief.featuresToAdd?.slice(0, 4) || [];
  if (weak.length === 0 && missing.length === 0) return "";

  const currentIssues = [...weak, ...missing].slice(0, 5);
  return `<section class="comparison">
  <div class="container">
    <div class="section-kicker">Votre site aujourd'hui · Notre maquette demain</div>
    <h2>La progression en un coup d'œil</h2>
    <div class="comp-grid">
      <div class="comp-col comp-col-old">
        <div class="comp-header">
          <span class="comp-emoji">🕰️</span>
          <div class="comp-title">Site actuel</div>
        </div>
        <ul>
          ${currentIssues.map((i) => `<li>✗ ${escape(i)}</li>`).join("")}
        </ul>
      </div>
      <div class="comp-col comp-col-new">
        <div class="comp-header">
          <span class="comp-emoji">✨</span>
          <div class="comp-title">Maquette WebConceptor</div>
        </div>
        <ul>
          ${toAdd.map((i) => `<li>✓ ${escape(i)}</li>`).join("")}
          <li>✓ Design premium responsive mobile</li>
          <li>✓ Livré en 5 jours, 100% propriétaire</li>
        </ul>
      </div>
    </div>
  </div>
</section>`;
}

function renderGallery(ctx: RenderCtx): string {
  const { photos, prospect } = ctx;
  if (photos.length < 3) return "";
  const shown = photos.slice(1, 7); // skip hero (used in renderHero)
  return `<section id="galerie" class="gallery">
  <div class="container">
    <div class="section-kicker">Galerie</div>
    <h2>Un aperçu en images</h2>
    <div class="gallery-grid">
      ${shown.map((p, i) => `<img src="${escape(p)}" alt="${escape(prospect.name)} — ${i + 1}" loading="lazy">`).join("")}
    </div>
  </div>
</section>`;
}

function renderReviews(ctx: RenderCtx): string {
  const { prospect } = ctx;
  const reviews = prospect.reviews?.slice(0, 3) || [];
  if (reviews.length === 0) return "";
  return `<section id="avis" class="reviews">
  <div class="container">
    <div class="section-kicker">Ils en parlent</div>
    <h2>Ce que disent vos clients</h2>
    <div class="reviews-grid">
      ${reviews.map((r) => `<div class="review-card">
        <div class="review-stars">${"★".repeat(Math.max(1, Math.min(5, Math.round(r.rating || 5))))}</div>
        <p class="review-text">« ${escape((r.text || "").slice(0, 240))}${(r.text || "").length > 240 ? "…" : ""} »</p>
        <div class="review-author"><strong>${escape(r.author || "Client")}</strong><span>${escape(r.timeAgo || "")}</span></div>
      </div>`).join("")}
    </div>
  </div>
</section>`;
}

function renderContact(ctx: RenderCtx): string {
  const { prospect, primary, accent } = ctx;
  const city = prospect.city ? escape(prospect.city) : "";
  const address = escape(prospect.address || "");
  const phone = escape(prospect.phone || "");
  const navQuery = address ? encodeURIComponent(prospect.address || "") : "";
  const hasNav = address.length > 0;

  return `<section id="contact" class="contact">
  <div class="container contact-grid">
    <div class="contact-visual" style="background:linear-gradient(135deg,${primary},${accent})">
      <div class="contact-visual-inner">
        <div class="contact-visual-tag">Nous trouver</div>
        <h3>${city ? `À ${city}` : "Près de chez vous"}</h3>
        <p>${address || "Contactez-nous pour l'adresse"}</p>
      </div>
    </div>
    <div class="contact-text">
      <div class="section-kicker">Informations pratiques</div>
      <h2>Nous contacter</h2>
      <div class="info-list">
        ${address ? `<div class="info-line"><span class="info-label">Adresse</span><span>${address}</span></div>` : ""}
        ${phone ? `<div class="info-line"><span class="info-label">Téléphone</span><span>${phone}</span></div>` : ""}
        ${prospect.hours ? `<div class="info-line"><span class="info-label">Horaires</span><span style="white-space:pre-line">${escape(prospect.hours.replace(/\s*\|\s*/g, "\n").slice(0, 400))}</span></div>` : ""}
      </div>
      ${hasNav ? `
      <div class="nav-btns">
        <a href="https://waze.com/ul?q=${navQuery}&navigate=yes" target="_blank" rel="noopener" class="nav-btn nav-waze">
          <span class="nav-ico" style="background:#33CCFF">🚗</span>
          <span>Waze</span>
        </a>
        <a href="https://maps.apple.com/?q=${navQuery}&dirflg=d" target="_blank" rel="noopener" class="nav-btn nav-plans">
          <span class="nav-ico" style="background:#007AFF;color:#fff">📍</span>
          <span>Plans</span>
        </a>
        <a href="https://www.google.com/maps/dir/?api=1&destination=${navQuery}" target="_blank" rel="noopener" class="nav-btn nav-gmaps">
          <span class="nav-ico" style="background:#4285F4;color:#fff">🗺️</span>
          <span>Google Maps</span>
        </a>
      </div>` : ""}
    </div>
  </div>
</section>`;
}

// ─── CSS generator (theme + brand variables) ─────────────────

function buildCss(ctx: RenderCtx): string {
  const { theme, primary, primaryDark, primaryLight, secondary, accent, textOnPrimary, audit } = ctx;
  const density = theme.layoutDensity;
  const sectionPadding = density === "airy" ? "120px 40px" : density === "dense" ? "60px 40px" : "88px 40px";

  return `:root{
  --primary:${primary};
  --primary-dark:${primaryDark};
  --primary-light:${primaryLight};
  --secondary:${secondary};
  --accent:${accent};
  --text:#1a1a1a;
  --text-muted:#6b6b6b;
  --bg-light:${theme.bgNeutralLight};
  --bg-dark:${theme.bgNeutralDark};
  --on-primary:${textOnPrimary};
  --serif:${theme.fontSerif};
  --sans:${theme.fontSans};
  --radius:${theme.borderRadius};
  --btn-radius:${theme.buttonRadius};
  --shadow:${theme.shadowStrength};
  --tracking:${theme.letterSpacing};
}
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
html{scroll-behavior:smooth}
body{font-family:var(--sans);font-size:${theme.baseFontSize};background:#fff;color:var(--text);line-height:1.6;letter-spacing:var(--tracking);-webkit-font-smoothing:antialiased;position:relative}
::selection{background:var(--primary);color:var(--on-primary)}
body::after{content:'WEBCONCEPTOR · APERÇU';position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:110px;font-weight:900;color:rgba(0,0,0,0.05);letter-spacing:0.1em;white-space:nowrap;pointer-events:none;z-index:0;user-select:none}
img{display:block;max-width:100%;height:auto}
a{color:inherit;text-decoration:none}
.container{max-width:1200px;margin:0 auto}

/* ─── Watermark + badges WebConceptor ─── */
.wc-demo-badge{position:fixed;top:72px;right:14px;z-index:9998;background:rgba(10,10,10,0.95);color:#fff;padding:9px 16px;border-radius:100px;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;box-shadow:0 6px 22px rgba(0,0,0,0.18);display:inline-flex;align-items:center;gap:8px}
.wc-demo-badge::before{content:'';width:7px;height:7px;background:#ef4444;border-radius:50%;animation:pulse 2s infinite}
.wc-home-btn{position:fixed;top:72px;left:14px;z-index:9998;display:inline-flex;align-items:center;gap:8px;background:#fff;color:#0a0a0a;padding:8px 16px 8px 10px;border-radius:100px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.12);border:1px solid rgba(0,0,0,0.06)}
.wc-home-btn-logo{width:22px;height:22px;background:#0066ff;color:#fff;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;font-weight:900;font-size:11px}
.wc-reassurance{position:fixed;bottom:52px;left:50%;transform:translateX(-50%);z-index:9997;background:#fff;color:#1a1a1a;padding:10px 20px;border-radius:100px;font-size:12px;font-weight:500;box-shadow:0 8px 28px rgba(0,0,0,0.14);border:1px solid rgba(0,102,255,0.2);display:inline-flex;align-items:center;gap:10px}
.wc-reassurance-ico{width:22px;height:22px;background:#0066ff;color:#fff;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:11px}
.wc-reassurance strong{color:#0066ff;font-weight:700}
.wc-watermark{position:fixed;bottom:0;left:0;right:0;z-index:9999;background:linear-gradient(90deg,#2A1B26,var(--primary));padding:10px 20px;text-align:center;font-size:11px;color:rgba(255,255,255,0.95);font-weight:600}
.wc-watermark strong{color:#fff;letter-spacing:0.12em;text-transform:uppercase}
.wc-watermark a{color:#FFD700;font-weight:700;text-decoration:underline}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}

/* ─── Hero variants ─── */
.hero{position:relative;overflow:hidden}
.hero-centered{padding:${sectionPadding};text-align:center;background:linear-gradient(180deg,var(--primary-light),#fff)}
.hero-centered h1{font-family:var(--serif);font-size:${theme.headingScale};font-weight:600;line-height:1.05;margin:16px auto 20px;max-width:900px}
.hero-centered .hero-sub{font-size:19px;color:var(--text-muted);max-width:620px;margin:0 auto 32px}
.hero-centered .hero-photo-full{margin-top:56px;border-radius:var(--radius);overflow:hidden;max-width:1100px;margin-left:auto;margin-right:auto;box-shadow:var(--shadow)}
.hero-centered .hero-photo-full img{width:100%;aspect-ratio:16/9;object-fit:cover}

.hero-split{padding:${sectionPadding};background:linear-gradient(135deg,${theme.bgNeutralLight},#fff);display:grid;grid-template-columns:1.1fr 1fr;gap:64px;align-items:center}
.hero-split.reverse{grid-template-columns:1fr 1.1fr}
.hero-split.reverse .hero-text{order:2}
.hero-split.reverse .hero-photo{order:1}
.hero-split h1{font-family:var(--serif);font-size:${theme.headingScale};font-weight:600;line-height:1.05;margin:16px 0 20px}
.hero-split .hero-sub{font-size:18px;color:var(--text-muted);margin-bottom:32px;max-width:520px}
.hero-split .hero-photo{aspect-ratio:4/5;border-radius:var(--radius);overflow:hidden;box-shadow:var(--shadow)}
.hero-split .hero-photo img{width:100%;height:100%;object-fit:cover}
.hero-placeholder{width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:96px;font-weight:700}

.hero-overlay{min-height:88vh;display:flex;align-items:flex-end;padding:0}
.hero-overlay .hero-bg{position:absolute;inset:0;z-index:0}
.hero-overlay .hero-bg img{width:100%;height:100%;object-fit:cover;filter:brightness(0.55)}
.hero-overlay .hero-bg::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.3),rgba(0,0,0,0.85))}
.hero-overlay .hero-overlay-content{position:relative;z-index:2;padding:60px 40px 80px;max-width:1200px;margin:0 auto;color:#fff;width:100%}
.hero-overlay h1{font-family:var(--serif);font-size:${theme.headingScale};font-weight:600;line-height:1.05;margin:16px 0 20px;color:#fff;max-width:780px}
.hero-overlay .hero-sub{font-size:19px;color:rgba(255,255,255,0.88);max-width:620px;margin-bottom:32px}

.hero-tag{display:inline-block;padding:8px 18px;background:rgba(0,0,0,0.05);color:var(--primary-dark);border-radius:100px;font-size:11px;font-weight:800;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px}
.hero-overlay .hero-tag{background:rgba(255,255,255,0.15);color:#fff}
.hero-ctas{display:flex;gap:12px;flex-wrap:wrap}

.btn-primary{padding:16px 32px;background:var(--primary);color:var(--on-primary);font-weight:700;font-size:14px;border-radius:var(--btn-radius);transition:all 0.2s;display:inline-flex;align-items:center;gap:8px;text-transform:uppercase;letter-spacing:0.1em;border:2px solid var(--primary)}
.btn-primary:hover{background:var(--primary-dark);border-color:var(--primary-dark)}
.btn-outline{padding:16px 32px;background:transparent;color:var(--text);border:2px solid rgba(0,0,0,0.15);font-weight:600;font-size:14px;border-radius:var(--btn-radius);text-transform:uppercase;letter-spacing:0.1em;transition:all 0.2s}
.btn-outline:hover{border-color:var(--text);background:var(--text);color:#fff}
.btn-outline-light{padding:16px 32px;background:transparent;color:#fff;border:2px solid rgba(255,255,255,0.4);font-weight:600;font-size:14px;border-radius:var(--btn-radius);text-transform:uppercase;letter-spacing:0.1em;transition:all 0.2s}
.btn-outline-light:hover{border-color:#fff;background:#fff;color:var(--text)}

/* ─── Section common styles ─── */
.section-kicker{font-size:11px;font-weight:800;letter-spacing:0.25em;text-transform:uppercase;color:var(--primary);margin-bottom:12px}
.section-lead{font-size:17px;color:var(--text-muted);max-width:620px;margin-top:12px;margin-bottom:40px}

/* About */
.about{padding:${sectionPadding};background:#fff;text-align:center}
.about h2{font-family:var(--serif);font-size:clamp(2rem,3.5vw,3rem);font-weight:500;margin:0 auto 24px;max-width:700px}
.about-text{font-size:18px;color:var(--text-muted);line-height:1.75;max-width:700px;margin:0 auto 40px}
.usp-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;max-width:900px;margin:0 auto;text-align:left}
.usp-item{display:flex;gap:12px;padding:16px 20px;background:var(--bg-light);border-radius:var(--radius)}
.usp-bullet{color:var(--primary);font-weight:800;font-size:20px;line-height:1}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;max-width:700px;margin:56px auto 0;padding-top:48px;border-top:1px solid rgba(0,0,0,0.08)}
.stat-num{font-family:var(--serif);font-size:36px;color:var(--primary);font-weight:600;line-height:1}
.stat-label{font-size:12px;color:var(--text-muted);letter-spacing:0.1em;margin-top:8px;text-transform:uppercase}

/* Services */
.services{padding:${sectionPadding};background:var(--bg-light)}
.services h2{font-family:var(--serif);font-size:clamp(2rem,3.5vw,3rem);font-weight:500;margin-bottom:32px}
.services-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}
.service-card{background:#fff;padding:32px 24px;border-radius:var(--radius);border:1px solid rgba(0,0,0,0.06);transition:all 0.25s}
.service-card:hover{transform:translateY(-4px);border-color:var(--primary);box-shadow:0 16px 36px rgba(0,0,0,0.08)}
.service-title{font-family:var(--serif);font-size:18px;font-weight:500}

/* Improvements */
.improvements{padding:${sectionPadding};background:#fff}
.improvements h2{font-family:var(--serif);font-size:clamp(2rem,3.5vw,3rem);font-weight:500}
.improvements-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;margin-top:40px}
.improvement-item{display:flex;gap:16px;align-items:flex-start;padding:24px;border-left:3px solid var(--primary);background:var(--bg-light);border-radius:0 var(--radius) var(--radius) 0}
.improvement-num{font-family:var(--serif);font-size:28px;color:var(--primary);font-weight:700;line-height:1;flex-shrink:0}
.improvement-text{font-size:15px;color:var(--text);line-height:1.55}

/* Comparison */
.comparison{padding:${sectionPadding};background:var(--bg-dark);color:#fff}
.comparison h2{font-family:var(--serif);font-size:clamp(2rem,3.5vw,3rem);font-weight:500;color:#fff;margin-bottom:40px}
.comp-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:30px}
.comp-col{background:rgba(255,255,255,0.06);padding:32px;border-radius:var(--radius);border:1px solid rgba(255,255,255,0.1)}
.comp-col-new{background:var(--primary);color:var(--on-primary);border-color:var(--primary)}
.comp-header{display:flex;align-items:center;gap:12px;margin-bottom:20px}
.comp-emoji{font-size:28px}
.comp-title{font-family:var(--serif);font-size:22px;font-weight:600}
.comp-col ul{list-style:none;padding:0}
.comp-col li{padding:10px 0;font-size:15px;line-height:1.5;border-bottom:1px solid rgba(255,255,255,0.1)}
.comp-col li:last-child{border-bottom:none}

/* Gallery */
.gallery{padding:${sectionPadding};background:#fff}
.gallery h2{font-family:var(--serif);font-size:clamp(2rem,3.5vw,3rem);font-weight:500;margin-bottom:40px}
.gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px}
.gallery-grid img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:var(--radius);transition:transform 0.3s}
.gallery-grid img:hover{transform:scale(1.02)}

/* Reviews */
.reviews{padding:${sectionPadding};background:var(--bg-light)}
.reviews h2{font-family:var(--serif);font-size:clamp(2rem,3.5vw,3rem);font-weight:500;margin-bottom:40px}
.reviews-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}
.review-card{background:#fff;padding:28px;border-radius:var(--radius);border:1px solid rgba(0,0,0,0.05);box-shadow:0 4px 18px rgba(0,0,0,0.03)}
.review-stars{color:#f5c518;margin-bottom:14px;font-size:14px;letter-spacing:2px}
.review-text{font-size:15px;color:var(--text);line-height:1.65;margin-bottom:16px;font-style:italic}
.review-author{font-size:13px;color:var(--text-muted);display:flex;justify-content:space-between;padding-top:14px;border-top:1px solid rgba(0,0,0,0.06)}
.review-author strong{color:var(--text);font-weight:600}

/* Contact */
.contact{padding:${sectionPadding};background:#fff}
.contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.contact-visual{aspect-ratio:4/3;border-radius:var(--radius);padding:48px;color:#fff;display:flex;align-items:center;justify-content:center;text-align:center;position:relative;overflow:hidden}
.contact-visual::before{content:'';position:absolute;top:-50px;right:-50px;width:300px;height:300px;background:radial-gradient(circle,rgba(255,255,255,0.2),transparent 70%);border-radius:50%}
.contact-visual-inner{position:relative;z-index:1}
.contact-visual-tag{font-size:11px;font-weight:800;letter-spacing:0.25em;text-transform:uppercase;opacity:0.85;margin-bottom:12px}
.contact-visual h3{font-family:var(--serif);font-size:32px;font-weight:500;margin-bottom:8px}
.contact-visual p{font-size:15px;opacity:0.9}
.contact-text h2{font-family:var(--serif);font-size:clamp(2rem,3.5vw,3rem);font-weight:500;margin-bottom:24px}
.info-list{display:flex;flex-direction:column;gap:14px;margin-bottom:24px}
.info-line{display:grid;grid-template-columns:120px 1fr;gap:16px;padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.06);font-size:14px}
.info-line:last-child{border-bottom:none}
.info-label{font-weight:700;color:var(--text);font-size:11px;letter-spacing:0.1em;text-transform:uppercase;padding-top:2px}
.nav-btns{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.nav-btn{display:inline-flex;align-items:center;justify-content:center;gap:10px;padding:12px 14px;border-radius:var(--btn-radius);font-size:13px;font-weight:600;border:1.5px solid rgba(0,0,0,0.08);background:#fff;color:var(--text);transition:all 0.15s}
.nav-btn:hover{transform:translateY(-1px);border-color:var(--primary);box-shadow:0 6px 16px rgba(0,0,0,0.08)}
.nav-ico{width:24px;height:24px;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;color:#1a1a1a;font-size:13px}

@media(max-width:900px){
  body{font-size:15px}
  .container{padding:0 20px}
  .hero-split,.hero-split.reverse{grid-template-columns:1fr;gap:32px;padding:44px 20px 72px}
  .hero-split.reverse .hero-text{order:1}
  .hero-split.reverse .hero-photo{order:2}
  .hero-centered{padding:44px 20px 72px}
  .hero-overlay{min-height:72vh}
  .hero-overlay .hero-overlay-content{padding:32px 20px 60px}
  .about,.services,.improvements,.comparison,.gallery,.reviews,.contact{padding:60px 20px}
  .contact-grid{grid-template-columns:1fr;gap:32px}
  .comp-grid{grid-template-columns:1fr}
  .stats{grid-template-columns:1fr;gap:20px}
  .info-line{grid-template-columns:1fr;gap:4px}
  .nav-btns{grid-template-columns:1fr}
  body::after{font-size:60px}
  .wc-home-btn,.wc-demo-badge{top:86px}
}`;
}

// ─── Main generator ──────────────────────────────────────────

export function generateCustomMockupHtml(
  prospect: CustomProspect,
  audit: DeepAudit,
  origin: string
): string {
  // Theme derivation
  const theme = pickThemeVariant(audit.brand.tone || "simple");

  // Colors (avec sanity check : si tout est null/invalide, fallback neutre)
  const primary = hexToRgb(audit.brand.primaryColor) ? audit.brand.primaryColor : "#0066ff";
  const primaryDark = darken(primary, 0.2);
  const primaryLight = lighten(primary, 0.9);
  const secondary = hexToRgb(audit.brand.secondaryColor) ? audit.brand.secondaryColor : darken(primary, 0.4);
  const accent = hexToRgb(audit.brand.accentColor) ? audit.brand.accentColor : lighten(primary, 0.3);
  const textOnPrimary = isLightColor(primary) ? "#1a1a1a" : "#ffffff";

  const photos = resolvePhotos(audit, prospect, origin, 8);

  const ctx: RenderCtx = {
    audit, prospect, origin, theme, photos,
    primary, primaryDark, primaryLight, secondary, accent, textOnPrimary,
  };

  // Liste des sections disponibles (noms stables)
  const sectionBuilders: Record<string, () => string> = {
    hero: () => renderHero(ctx),
    about: () => renderAbout(ctx),
    menu: () => renderMenu(ctx),          // vrais plats + prix scrapés
    services: () => renderServices(ctx),
    improvements: () => renderImprovements(ctx),
    comparison: () => renderComparison(ctx),
    gallery: () => renderGallery(ctx),
    reviews: () => renderReviews(ctx),
    contact: () => renderContact(ctx),
  };

  // Ordre des sections : suit le brief Claude (featuredSections) si possible,
  // sinon un défaut sensé selon verdict qualité.
  const requested = (audit.improvementBrief?.featuredSections || [])
    .map((s) => s.toLowerCase().trim())
    .filter((s) => sectionBuilders[s]);

  let order: string[];
  if (requested.length >= 3) {
    order = requested;
  } else if (audit.verdict.quality === "none") {
    order = ["hero", "about", "menu", "services", "improvements", "reviews", "contact"];
  } else if (audit.verdict.quality === "poor") {
    order = ["hero", "about", "menu", "services", "improvements", "comparison", "reviews", "contact"];
  } else {
    order = ["hero", "about", "menu", "services", "improvements", "comparison", "gallery", "reviews", "contact"];
  }

  // Toujours hero et contact en garantie
  if (!order.includes("hero")) order.unshift("hero");
  if (!order.includes("contact")) order.push("contact");

  const sectionsHtml = order.map((s) => sectionBuilders[s]?.() || "").filter(Boolean).join("\n");

  // Assemble le document
  return `<!DOCTYPE html>
<!--
  Maquette WebConceptor personnalisée · ${escape(prospect.name)}
  Générée à partir de l'audit approfondi du site actuel.
  Couleurs, photos et contenus puisés directement de leur site web.
  Mentions WebConceptor retirées automatiquement à l'achat.
-->
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="author" content="WebConceptor">
<meta name="robots" content="noindex,noarchive">
<title>${escape(prospect.name)}${prospect.city ? ` — ${escape(prospect.city)}` : ""}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;0,700&family=Lora:wght@500;600;700&family=Inter:wght@300;400;500;600;700&family=Syne:wght@600;700;800&family=Nunito:wght@400;600;700&family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
<style>
${buildCss(ctx)}
</style>
</head>
<body>
<a href="https://webconceptor.fr" class="wc-home-btn" title="Retour WebConceptor"><span class="wc-home-btn-logo">W</span><span>WebConceptor</span></a>
<div class="wc-demo-badge" title="Toutes les mentions WebConceptor disparaissent automatiquement à l'achat">Maquette · retirée à l'achat</div>

${sectionsHtml}

<div class="wc-reassurance"><span class="wc-reassurance-ico">W</span><span>Badges WebConceptor <strong>retirés automatiquement</strong> dès l'achat</span></div>
<div class="wc-watermark"><strong>APERÇU WEBCONCEPTOR</strong> &middot; les mentions ci-présentes sont retirées à l'achat &middot; <a href="https://webconceptor.fr" target="_blank">webconceptor.fr</a></div>
</body>
</html>`;
}
