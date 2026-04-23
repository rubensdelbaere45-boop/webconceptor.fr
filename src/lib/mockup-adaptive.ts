/* ══════════════════════════════════════════
   MOCKUP ADAPTIF — généré à partir des vraies données du prospect

   REMPLACE le vieux template "Proxi épicerie" hardcodé qui était identique
   pour chocolatier, coiffeur, plombier… (une photo unique, mêmes 8 rayons,
   même couleur purple). Désormais la maquette reprend :
     - les vraies couleurs dominantes extraites du site actuel (`site_style_dna`)
     - les vraies photos scrapées de leur site (`website_photos`)
     - le texte "à propos" scrapé (`about_scraped`)
     - les vrais produits/plats (`menu_items` — si dispo)
     - des libellés adaptés au business_type (boulanger ≠ plombier ≠ coiffeur)

   Le prospect doit se dire : "C'est MON site, mais en mieux" — pas "encore
   un template générique." C'est ça qui fait vendre.
   ══════════════════════════════════════════ */

export interface AdaptiveProspect {
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
  photos?: string[];
  hours?: string;
  business_type?: string;
  menu_items?: Array<{ category: string; name: string; description: string; price: string }> | null;
  reviews?: Array<{ author: string; rating: number; text: string; timeAgo: string }> | null;
  about_scraped?: string | null;
  website_photos?: string[] | null;
  site_style_dna?: {
    dominantColors?: string[];
    fontFamilies?: string[];
    keywords?: string[];
  } | null;
}

export interface AdaptiveContent {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
}

/* ══════════════════════════════════════════
   Config par business_type : libellés, catégories, CTAs
   ══════════════════════════════════════════ */

interface BusinessConfig {
  metaTitle: string;         // <title> du site
  heroTag: string;           // petit badge au-dessus du h1
  sectionTag: string;        // badge au-dessus de "À propos"
  productsTitle: string;     // titre de la section produits/services
  productsIntro: string;     // phrase d'intro
  fallbackCategories: Array<{ emoji: string; title: string; desc: string }>;
  topStripText: string;      // bandeau haut
  ctaBottom: string;         // bouton du bas
  fallbackColor: string;     // couleur par défaut si site_style_dna vide
  fallbackAccent: string;    // accent
  iconHero: string;          // SVG ou emoji
}

const BUSINESS_CONFIG: Record<string, BusinessConfig> = {
  restaurant: {
    metaTitle: "Restaurant",
    heroTag: "Cuisine de saison",
    sectionTag: "Notre maison",
    productsTitle: "Notre carte",
    productsIntro: "Des plats travaillés à partir de produits frais",
    fallbackCategories: [
      { emoji: "🥗", title: "Entrées", desc: "Frais & de saison" },
      { emoji: "🍽️", title: "Plats", desc: "Cuisine maison" },
      { emoji: "🍰", title: "Desserts", desc: "Faits ici" },
      { emoji: "🍷", title: "Cave", desc: "Sélection vignerons" },
    ],
    topStripText: "Réservation en ligne · 0% de commission · Paiement sécurisé",
    ctaBottom: "Réserver une table",
    fallbackColor: "#8B2332",
    fallbackAccent: "#D4A574",
    iconHero: "🍽️",
  },
  boulangerie: {
    metaTitle: "Boulangerie artisanale",
    heroTag: "Pain & viennoiseries",
    sectionTag: "La boulangerie",
    productsTitle: "Nos pains & viennoiseries",
    productsIntro: "Pétris et cuits sur place chaque jour",
    fallbackCategories: [
      { emoji: "🥖", title: "Pains", desc: "Tradition, complet, céréales" },
      { emoji: "🥐", title: "Viennoiseries", desc: "Beurre AOP" },
      { emoji: "🥧", title: "Tartes & quiches", desc: "Salées & sucrées" },
      { emoji: "🎂", title: "Pâtisseries", desc: "Du classique au créatif" },
    ],
    topStripText: "Fournée du matin · Cuisson à l'ancienne · Ingrédients français",
    ctaBottom: "Nous trouver",
    fallbackColor: "#C08957",
    fallbackAccent: "#5C3A21",
    iconHero: "🥖",
  },
  patisserie: {
    metaTitle: "Pâtisserie artisanale",
    heroTag: "Pâtisserie & chocolaterie",
    sectionTag: "La pâtisserie",
    productsTitle: "Nos créations",
    productsIntro: "Chaque pièce est fabriquée à la main dans notre laboratoire",
    fallbackCategories: [
      { emoji: "🍰", title: "Gâteaux", desc: "À la part ou entiers" },
      { emoji: "🍫", title: "Chocolats", desc: "Tablettes, bonbons, ganaches" },
      { emoji: "🍪", title: "Petits fours", desc: "Pour vos événements" },
      { emoji: "🎂", title: "Sur commande", desc: "Anniversaires, mariages" },
    ],
    topStripText: "Créations artisanales · Commandes événements · Tempérage chocolat",
    ctaBottom: "Voir nos créations",
    fallbackColor: "#9B4A7B",
    fallbackAccent: "#E8A87C",
    iconHero: "🍰",
  },
  cafe: {
    metaTitle: "Café & restauration",
    heroTag: "Café & petits-déjeuners",
    sectionTag: "Le café",
    productsTitle: "Notre carte",
    productsIntro: "Cafés de spécialité, pâtisseries maison, restauration légère",
    fallbackCategories: [
      { emoji: "☕", title: "Cafés", desc: "Spécialité, filtre, latte art" },
      { emoji: "🥐", title: "Petit-déj", desc: "Formule complète" },
      { emoji: "🥪", title: "Déjeuner", desc: "Salades, sandwichs, brunch" },
      { emoji: "🍰", title: "Douceurs", desc: "Pâtisseries maison" },
    ],
    topStripText: "Ouvert tôt · Wifi offert · Brunch le weekend",
    ctaBottom: "Nos horaires",
    fallbackColor: "#3E2723",
    fallbackAccent: "#C19A6B",
    iconHero: "☕",
  },
  glacier: {
    metaTitle: "Glacier artisanal",
    heroTag: "Glaces & sorbets artisanaux",
    sectionTag: "La maison",
    productsTitle: "Nos parfums",
    productsIntro: "Fabrication quotidienne, ingrédients frais, sans arômes artificiels",
    fallbackCategories: [
      { emoji: "🍦", title: "Glaces", desc: "Au lait entier" },
      { emoji: "🍧", title: "Sorbets", desc: "Fruits pressés" },
      { emoji: "🍨", title: "Coupes", desc: "Créations du maître glacier" },
      { emoji: "🎂", title: "Gâteaux glacés", desc: "Sur commande" },
    ],
    topStripText: "Turbine artisanale · Fruits de saison · Zéro arôme artificiel",
    ctaBottom: "Découvrir nos parfums",
    fallbackColor: "#F4B8C1",
    fallbackAccent: "#6AB7B8",
    iconHero: "🍦",
  },
  coiffeur: {
    metaTitle: "Salon de coiffure",
    heroTag: "Coiffure femme, homme, enfant",
    sectionTag: "Le salon",
    productsTitle: "Nos prestations",
    productsIntro: "Coupes, colorations, soins, événementiel — prise de rendez-vous en ligne",
    fallbackCategories: [
      { emoji: "✂️", title: "Coupes", desc: "Femme, homme, enfant" },
      { emoji: "🎨", title: "Coloration", desc: "Naturelle, balayage, mèches" },
      { emoji: "💆", title: "Soins", desc: "Kératine, hydratation" },
      { emoji: "👰", title: "Événement", desc: "Mariage, cérémonie" },
    ],
    topStripText: "Prise de RDV en ligne · Fidélité client · Produits pro",
    ctaBottom: "Prendre rendez-vous",
    fallbackColor: "#2D2D2D",
    fallbackAccent: "#C9A66B",
    iconHero: "✂️",
  },
  institut: {
    metaTitle: "Institut de beauté",
    heroTag: "Beauté, soins, bien-être",
    sectionTag: "L'institut",
    productsTitle: "Nos soins",
    productsIntro: "Soins visage, épilations, manucures, massages — sur rendez-vous",
    fallbackCategories: [
      { emoji: "💆‍♀️", title: "Visage", desc: "Soins anti-âge, éclat" },
      { emoji: "🌿", title: "Corps", desc: "Modelages, gommages" },
      { emoji: "💅", title: "Mains & pieds", desc: "Manucure, beauté des pieds" },
      { emoji: "✨", title: "Épilation", desc: "Traditionnelle ou laser" },
    ],
    topStripText: "Rendez-vous en ligne · Cartes cadeaux · Offres fidélité",
    ctaBottom: "Prendre rendez-vous",
    fallbackColor: "#C48B9F",
    fallbackAccent: "#6E4555",
    iconHero: "✨",
  },
  fleuriste: {
    metaTitle: "Fleuriste",
    heroTag: "Bouquets & compositions florales",
    sectionTag: "La boutique",
    productsTitle: "Nos compositions",
    productsIntro: "Bouquets du jour, événements, abonnements, livraison",
    fallbackCategories: [
      { emoji: "💐", title: "Bouquets", desc: "Du jour ou sur mesure" },
      { emoji: "💒", title: "Mariages", desc: "Cérémonies, réceptions" },
      { emoji: "🌿", title: "Plantes", desc: "Intérieur & extérieur" },
      { emoji: "🚴", title: "Livraison", desc: "Ville & alentours" },
    ],
    topStripText: "Livraison rapide · Fleurs fraîches · Commande en ligne",
    ctaBottom: "Commander un bouquet",
    fallbackColor: "#D4668C",
    fallbackAccent: "#2F7045",
    iconHero: "💐",
  },
  plombier: {
    metaTitle: "Plombier chauffagiste",
    heroTag: "Intervention rapide 7j/7",
    sectionTag: "L'entreprise",
    productsTitle: "Nos prestations",
    productsIntro: "Dépannage urgence, sanitaire, chauffage, rénovation salle de bain",
    fallbackCategories: [
      { emoji: "🚿", title: "Sanitaire", desc: "Pose, dépannage, rénovation" },
      { emoji: "🔥", title: "Chauffage", desc: "Chaudière, pompe à chaleur" },
      { emoji: "🚰", title: "Fuite & dégât", desc: "Détection, réparation" },
      { emoji: "🛁", title: "Salle de bain", desc: "Rénovation complète" },
    ],
    topStripText: "Intervention 24/7 · Devis gratuit · Garantie décennale",
    ctaBottom: "Demander un devis",
    fallbackColor: "#1E4D8C",
    fallbackAccent: "#F4A900",
    iconHero: "🔧",
  },
  electricien: {
    metaTitle: "Électricien",
    heroTag: "Installation & dépannage électrique",
    sectionTag: "L'entreprise",
    productsTitle: "Nos prestations",
    productsIntro: "Mise aux normes, installation, domotique, dépannage urgence",
    fallbackCategories: [
      { emoji: "⚡", title: "Installation", desc: "Neuf & rénovation" },
      { emoji: "🏠", title: "Mise aux normes", desc: "Consuel, diagnostic" },
      { emoji: "🔌", title: "Dépannage", desc: "Urgence 24/7" },
      { emoji: "📡", title: "Domotique", desc: "Maison connectée" },
    ],
    topStripText: "Qualifelec RGE · Devis gratuit · Garantie décennale",
    ctaBottom: "Demander un devis",
    fallbackColor: "#F4A900",
    fallbackAccent: "#1E4D8C",
    iconHero: "⚡",
  },
  dentiste: {
    metaTitle: "Cabinet dentaire",
    heroTag: "Soins dentaires & prothèses",
    sectionTag: "Le cabinet",
    productsTitle: "Nos soins",
    productsIntro: "Soins conservateurs, prothèses, implantologie, orthodontie",
    fallbackCategories: [
      { emoji: "🦷", title: "Soins", desc: "Conservateurs & prévention" },
      { emoji: "✨", title: "Esthétique", desc: "Blanchiment, facettes" },
      { emoji: "🔩", title: "Implants", desc: "Solutions durables" },
      { emoji: "😁", title: "Orthodontie", desc: "Adulte & enfant" },
    ],
    topStripText: "Prise de RDV en ligne · Tiers payant · Urgences dentaires",
    ctaBottom: "Prendre rendez-vous",
    fallbackColor: "#4A90E2",
    fallbackAccent: "#50C878",
    iconHero: "🦷",
  },
  osteo: {
    metaTitle: "Ostéopathe D.O.",
    heroTag: "Ostéopathie adulte, enfant, sportif",
    sectionTag: "Le cabinet",
    productsTitle: "Nos consultations",
    productsIntro: "Ostéopathie structurelle, viscérale, crânienne — sur rendez-vous",
    fallbackCategories: [
      { emoji: "🧘", title: "Adulte", desc: "Douleurs, stress, posture" },
      { emoji: "👶", title: "Nourrisson", desc: "Régurgitations, sommeil" },
      { emoji: "🏃", title: "Sportif", desc: "Prévention, récupération" },
      { emoji: "🤰", title: "Périnatal", desc: "Grossesse & post-partum" },
    ],
    topStripText: "RDV en ligne · Remboursé mutuelle · Domicile possible",
    ctaBottom: "Prendre rendez-vous",
    fallbackColor: "#5D9B9B",
    fallbackAccent: "#2D5F5F",
    iconHero: "🤲",
  },
  salle_sport: {
    metaTitle: "Salle de sport",
    heroTag: "Musculation, cardio, cours collectifs",
    sectionTag: "La salle",
    productsTitle: "Nos offres",
    productsIntro: "Abonnements sans engagement, cours collectifs, coaching personnalisé",
    fallbackCategories: [
      { emoji: "🏋️", title: "Musculation", desc: "Zone libre & guidée" },
      { emoji: "🚴", title: "Cardio", desc: "Vélo, tapis, rameurs" },
      { emoji: "🧘", title: "Cours collectifs", desc: "Yoga, HIIT, crossfit" },
      { emoji: "💪", title: "Coaching", desc: "Individuel ou duo" },
    ],
    topStripText: "Ouvert 7j/7 · Sans engagement · Coaching inclus",
    ctaBottom: "Essai gratuit",
    fallbackColor: "#FF4500",
    fallbackAccent: "#0F1E2E",
    iconHero: "💪",
  },
  auto_ecole: {
    metaTitle: "Auto-école",
    heroTag: "Permis B, AAC, conduite supervisée",
    sectionTag: "L'école",
    productsTitle: "Nos forfaits",
    productsIntro: "Permis B, boîte auto, AAC, stages accélérés — à partir de 18 ans",
    fallbackCategories: [
      { emoji: "🚗", title: "Permis B", desc: "Forfait 20h classique" },
      { emoji: "📚", title: "Code", desc: "Forfait illimité en ligne" },
      { emoji: "⚡", title: "Stage accéléré", desc: "2 semaines" },
      { emoji: "🎓", title: "AAC", desc: "Conduite accompagnée" },
    ],
    topStripText: "Taux de réussite 85% · Inscription en ligne · Aide CPF",
    ctaBottom: "Voir les forfaits",
    fallbackColor: "#0066CC",
    fallbackAccent: "#FFCC00",
    iconHero: "🚗",
  },
  garage: {
    metaTitle: "Garage automobile",
    heroTag: "Entretien, réparation, carrosserie",
    sectionTag: "Le garage",
    productsTitle: "Nos prestations",
    productsIntro: "Révision, pneumatiques, freinage, carrosserie, contrôle technique",
    fallbackCategories: [
      { emoji: "🔧", title: "Mécanique", desc: "Révision & réparation" },
      { emoji: "🛞", title: "Pneumatiques", desc: "Montage & équilibrage" },
      { emoji: "🎨", title: "Carrosserie", desc: "Peinture & redressage" },
      { emoji: "✅", title: "CT", desc: "Contrôle technique" },
    ],
    topStripText: "Devis gratuit · Véhicule de prêt · Toutes marques",
    ctaBottom: "Demander un devis",
    fallbackColor: "#2D2D2D",
    fallbackAccent: "#FF4500",
    iconHero: "🔧",
  },
  epicerie: {
    metaTitle: "Épicerie de proximité",
    heroTag: "Votre commerce de proximité",
    sectionTag: "Le magasin",
    productsTitle: "Nos rayons",
    productsIntro: "Produits frais, spécialités locales, service client",
    fallbackCategories: [
      { emoji: "🧀", title: "Fromagerie", desc: "Sélection locale" },
      { emoji: "🥖", title: "Boulangerie", desc: "Pain & pâtisseries" },
      { emoji: "🍎", title: "Fruits & Légumes", desc: "De saison" },
      { emoji: "🍷", title: "Cave", desc: "Vins & spiritueux" },
    ],
    topStripText: "Arrivages frais · Produits locaux · Service à l'ancienne",
    ctaBottom: "Nous contacter",
    fallbackColor: "#872175",
    fallbackAccent: "#4CAF50",
    iconHero: "🛒",
  },
};

function getConfig(businessType?: string): BusinessConfig {
  return BUSINESS_CONFIG[businessType || ""] || BUSINESS_CONFIG.epicerie;
}

/* ══════════════════════════════════════════
   Utilitaires couleur — site_style_dna → CSS variables
   ══════════════════════════════════════════ */

// Convertit #RRGGBB → { r, g, b }
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace(/^#/, "").trim();
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
  const factor = 1 - pct;
  return rgbToHex(rgb.r * factor, rgb.g * factor, rgb.b * factor);
}

function lighten(hex: string, pct: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  return rgbToHex(rgb.r + (255 - rgb.r) * pct, rgb.g + (255 - rgb.g) * pct, rgb.b + (255 - rgb.b) * pct);
}

// Calcule la luminosité perçue (YIQ) pour choisir texte noir ou blanc sur fond
function isLight(hex: string): boolean {
  const rgb = hexToRgb(hex);
  if (!rgb) return false;
  const yiq = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
  return yiq > 160;
}

// Choisit le thème final en combinant site_style_dna et fallback par métier
function resolveTheme(prospect: AdaptiveProspect, config: BusinessConfig): {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  accent: string;
  text: string;
  cream: string;
  warm: string;
  font: string;
} {
  const dominantColors = prospect.site_style_dna?.dominantColors || [];
  // On IGNORE le blanc, noir pur, gris — ce sont des couleurs "de fond" pas de marque
  const brandColors = dominantColors.filter((c) => {
    const rgb = hexToRgb(c);
    if (!rgb) return false;
    const { r, g, b } = rgb;
    // Exclut gris (r≈g≈b)
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 20) return false;
    // Exclut quasi-blanc et quasi-noir
    if (max > 240 && min > 240) return false;
    if (max < 40) return false;
    return true;
  });

  const primary = brandColors[0] || config.fallbackColor;
  const accent = brandColors[1] || config.fallbackAccent;

  // Police : 1ère Google Font détectée, sinon fallback métier (serif pour food, sans pour tech)
  const detectedFont = prospect.site_style_dna?.fontFamilies?.[0];
  const font = detectedFont && /^[A-Za-z][A-Za-z0-9 \-]{1,30}$/.test(detectedFont) ? detectedFont : "Plus Jakarta Sans";

  return {
    primary,
    primaryDark: darken(primary, 0.2),
    primaryLight: lighten(primary, 0.85),
    accent,
    text: "#1a1a1a",
    cream: lighten(primary, 0.92),
    warm: "#FFFDF8",
    font,
  };
}

/* ══════════════════════════════════════════
   Helpers photos : website_photos > Google Places > emoji fallback
   ══════════════════════════════════════════ */

function resolvePhotos(prospect: AdaptiveProspect, origin: string, max = 5): string[] {
  const out: string[] = [];

  // 1) Photos scrapées du site actuel — priorité absolue (authenticité)
  if (Array.isArray(prospect.website_photos)) {
    for (const url of prospect.website_photos) {
      if (typeof url === "string" && /^https?:\/\//.test(url) && out.length < max) {
        // Vérifie juste que l'URL est HTTPS et valide
        if (url.length < 2000 && !url.includes("<") && !url.includes(">")) {
          out.push(url);
        }
      }
    }
  }

  // 2) Photos Google Places via le proxy sécurisé
  if (Array.isArray(prospect.photos)) {
    for (const ref of prospect.photos) {
      if (out.length >= max) break;
      if (typeof ref === "string" && /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(ref)) {
        out.push(`${origin}/api/prospect/photo?ref=${encodeURIComponent(ref)}`);
      }
    }
  }

  return out;
}

function escape(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/* ══════════════════════════════════════════
   Rendu HTML
   ══════════════════════════════════════════ */

export function generateAdaptiveMockupHtml(
  prospect: AdaptiveProspect,
  content: AdaptiveContent,
  origin: string
): string {
  const config = getConfig(prospect.business_type);
  const theme = resolveTheme(prospect, config);
  const photos = resolvePhotos(prospect, origin);
  const heroPhoto = photos[0] || "";
  const galleryPhotos = photos.slice(1, 5); // 4 max en galerie

  // About text : on prend en priorité ce qui est scrapé de leur site (authentique),
  // sinon le texte généré par Claude
  const rawAbout = (prospect.about_scraped || "").trim();
  const aboutText = rawAbout.length >= 80 && rawAbout.length <= 800
    ? rawAbout
    : content.aboutText;

  const cityStr = prospect.city ? escape(prospect.city) : "";
  const addressStr = escape(prospect.address || "");
  const phoneStr = escape(prospect.phone || "");

  // Produits/services : utilise menu_items si dispo, sinon catégories fallback métier
  const hasItems = Array.isArray(prospect.menu_items) && prospect.menu_items.length >= 3;
  const itemsHtml = hasItems
    ? renderItems(prospect.menu_items!)
    : renderFallbackCategories(config.fallbackCategories);

  // Galerie photos : on n'affiche la section que s'il y a au moins 2 photos (sinon ça fait vide)
  const galleryHtml = galleryPhotos.length >= 2 ? renderGallery(galleryPhotos, prospect.name) : "";

  // Reviews : on affiche les avis Google s'il y en a
  const reviewsHtml = Array.isArray(prospect.reviews) && prospect.reviews.length > 0
    ? renderReviews(prospect.reviews.slice(0, 3))
    : "";

  return `<!DOCTYPE html>
<!--
  ─────────────────────────────────────────────────────
  Design, code et intégration : WebConceptor
  https://webconceptor.fr
  Maquette personnalisée pour ${escape(prospect.name)}
  Thème couleur extrait du site actuel — ${theme.primary}
  Toute reproduction, même partielle, est interdite.
  ─────────────────────────────────────────────────────
-->
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="author" content="WebConceptor — https://webconceptor.fr">
<meta name="copyright" content="© WebConceptor — Reproduction interdite">
<meta name="robots" content="noindex,noarchive">
<title>${escape(prospect.name)} — ${escape(config.metaTitle)}${cityStr ? ` à ${cityStr}` : ""}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;0,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{
  --primary:${theme.primary};
  --primary-dark:${theme.primaryDark};
  --primary-light:${theme.primaryLight};
  --accent:${theme.accent};
  --ink:${theme.text};
  --gray:#6b6b6b;
  --cream:${theme.cream};
  --warm:${theme.warm};
  --serif:'Fraunces',Georgia,serif;
  --sans:'${theme.font}','Plus Jakarta Sans',system-ui,sans-serif;
}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--warm);color:var(--ink);overflow-x:hidden;-webkit-font-smoothing:antialiased;position:relative}
::selection{background:var(--primary);color:#fff}
body::after{content:'WEBCONCEPTOR · DÉMO';position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:110px;font-weight:900;color:rgba(0,0,0,0.02);letter-spacing:0.1em;white-space:nowrap;pointer-events:none;z-index:0;user-select:none}
img{display:block;max-width:100%}
a{color:inherit;text-decoration:none}

.wc-demo-badge{position:fixed;top:14px;right:14px;z-index:9998;background:rgba(10,10,10,0.92);color:#fff;padding:7px 14px;border-radius:100px;font-size:10px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;backdrop-filter:blur(10px);pointer-events:none;display:inline-flex;align-items:center;gap:6px}
.wc-demo-badge::before{content:'';width:6px;height:6px;background:#ef4444;border-radius:50%;animation:pulse 2s infinite}
.wc-home-btn{position:fixed;top:14px;left:14px;z-index:9998;display:inline-flex;align-items:center;gap:8px;background:#fff;color:#0a0a0a;padding:8px 16px 8px 10px;border-radius:100px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.12);border:1px solid rgba(0,0,0,0.06);transition:all 0.2s;font-family:var(--sans)}
.wc-home-btn:hover{transform:translateY(-1px);box-shadow:0 8px 30px rgba(0,0,0,0.18)}
.wc-home-btn-logo{width:22px;height:22px;background:#0066ff;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:11px}
.wc-watermark{position:fixed;bottom:0;left:0;right:0;z-index:9999;background:linear-gradient(90deg,#2A1B26,var(--primary));padding:9px 20px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:11px;color:rgba(255,255,255,0.85);letter-spacing:0.08em;text-transform:uppercase;font-weight:600;font-family:var(--sans)}
.wc-watermark strong{color:#fff;letter-spacing:0.15em}
.wc-watermark a{color:#FFD700;font-weight:700}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}

.top-strip{background:var(--primary);color:${isLight(theme.primary) ? "#1a1a1a" : "#fff"};text-align:center;padding:9px 20px;font-size:12px;font-weight:500;position:relative;z-index:2;letter-spacing:0.01em}
nav{position:sticky;top:0;z-index:100;height:72px;padding:0 40px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,253,248,0.95);backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,0.05)}
.logo{display:flex;align-items:center;gap:12px;font-family:var(--serif);font-size:20px;color:var(--ink);font-weight:600}
.logo-icon{width:40px;height:40px;background:var(--primary);color:${isLight(theme.primary) ? "#1a1a1a" : "#fff"};border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:20px;font-weight:800}
.nav-links{display:flex;gap:32px;list-style:none}
.nav-links a{color:var(--ink);font-size:14px;font-weight:500;transition:color 0.2s}
.nav-links a:hover{color:var(--primary)}
.nav-cta{padding:11px 24px;background:var(--ink);color:#fff;font-size:13px;font-weight:600;border-radius:100px;transition:background 0.2s}
.nav-cta:hover{background:var(--primary)}

.hero{position:relative;padding:72px 40px 96px;background:linear-gradient(180deg,var(--cream),var(--warm));overflow:hidden}
.hero::before{content:'';position:absolute;top:-150px;right:-100px;width:500px;height:500px;background:radial-gradient(circle,${theme.primary}26,transparent 70%);border-radius:50%}
.hero::after{content:'';position:absolute;bottom:-100px;left:-80px;width:400px;height:400px;background:radial-gradient(circle,${theme.accent}22,transparent 70%);border-radius:50%}
.hero-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:${heroPhoto ? "1.1fr 1fr" : "1fr"};gap:60px;align-items:center;position:relative;z-index:2}
.hero-tag{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:${theme.primary}1a;color:var(--primary-dark);border-radius:100px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px}
.hero-tag .dot{width:8px;height:8px;background:var(--primary);border-radius:50%;animation:pulse 2s infinite}
.hero h1{font-family:var(--serif);font-size:clamp(2.2rem,4.5vw,4rem);font-weight:600;line-height:1.05;letter-spacing:-0.035em;margin-bottom:24px}
.hero h1 em{font-style:italic;color:var(--primary)}
.hero p{font-size:17px;color:var(--gray);line-height:1.65;margin-bottom:36px;max-width:480px}
.hero-ctas{display:flex;gap:12px;flex-wrap:wrap}
.btn-primary{padding:14px 32px;background:var(--primary);color:${isLight(theme.primary) ? "#1a1a1a" : "#fff"};font-weight:700;font-size:14px;border-radius:100px;transition:all 0.25s;display:inline-flex;align-items:center;gap:8px;border:none;cursor:pointer}
.btn-primary:hover{background:var(--primary-dark);color:#fff;transform:translateY(-2px)}
.btn-outline{padding:14px 32px;background:transparent;color:var(--ink);border:1.5px solid rgba(0,0,0,0.15);font-weight:600;font-size:14px;border-radius:100px;transition:all 0.25s}
.btn-outline:hover{border-color:var(--ink);background:var(--ink);color:#fff}
.hero-photo{width:100%;aspect-ratio:4/5;border-radius:24px;overflow:hidden;box-shadow:0 30px 60px -20px rgba(0,0,0,0.2);background:${heroPhoto ? "transparent" : `linear-gradient(135deg,var(--primary),var(--accent))`};display:flex;align-items:center;justify-content:center;font-size:120px;color:#fff;position:relative}
.hero-photo img{width:100%;height:100%;object-fit:cover;display:block}

.about{padding:96px 40px;max-width:1000px;margin:0 auto;text-align:center}
.section-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:var(--primary);margin-bottom:16px}
.about h2{font-family:var(--serif);font-size:clamp(2rem,4vw,3rem);font-weight:500;line-height:1.15;margin-bottom:24px}
.about p{font-size:17px;color:var(--gray);line-height:1.75;max-width:680px;margin:0 auto}
.about-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;max-width:700px;margin:56px auto 0;padding-top:48px;border-top:1px solid rgba(0,0,0,0.08)}
.stat-num{font-family:var(--serif);font-size:36px;color:var(--primary);font-weight:600;line-height:1}
.stat-label{font-size:12px;color:var(--gray);letter-spacing:0.05em;margin-top:8px}

.gallery{padding:40px 40px 80px;max-width:1200px;margin:0 auto}
.gallery-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px}
.gallery-grid img{width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:16px;transition:transform 0.3s ease}
.gallery-grid img:hover{transform:scale(1.02)}

.products{padding:80px 40px;background:var(--cream)}
.products-inner{max-width:1100px;margin:0 auto}
.products-header{text-align:center;margin-bottom:48px}
.products-header h2{font-family:var(--serif);font-size:clamp(1.8rem,3.5vw,2.6rem);font-weight:500;margin-bottom:12px}
.products-header p{color:var(--gray);font-size:15px;max-width:560px;margin:0 auto}
.cat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:18px}
.cat-item{background:#fff;padding:28px 22px;border-radius:16px;text-align:center;border:1px solid rgba(0,0,0,0.04);transition:all 0.3s}
.cat-item:hover{transform:translateY(-4px);border-color:var(--primary);box-shadow:0 12px 32px ${theme.primary}14}
.cat-emoji{font-size:36px;margin-bottom:14px;display:block}
.cat-item h3{font-family:var(--serif);font-size:17px;font-weight:500;margin-bottom:4px}
.cat-item p{font-size:12px;color:var(--gray)}

.items-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:18px}
.item-card{background:#fff;padding:24px;border-radius:14px;border:1px solid rgba(0,0,0,0.04);transition:all 0.25s}
.item-card:hover{border-color:var(--primary);transform:translateY(-2px)}
.item-card .item-cat{font-size:10px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--primary);margin-bottom:8px}
.item-card .item-name{font-family:var(--serif);font-size:18px;font-weight:500;margin-bottom:6px}
.item-card .item-desc{font-size:13px;color:var(--gray);line-height:1.5;margin-bottom:12px}
.item-card .item-price{font-family:var(--serif);font-size:18px;font-weight:600;color:var(--primary)}

.reviews{padding:80px 40px;max-width:1100px;margin:0 auto}
.reviews-header{text-align:center;margin-bottom:48px}
.reviews-header h2{font-family:var(--serif);font-size:clamp(1.8rem,3.5vw,2.6rem);font-weight:500;margin-bottom:12px}
.reviews-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}
.review-card{background:#fff;padding:26px;border-radius:16px;border:1px solid rgba(0,0,0,0.05);box-shadow:0 4px 18px rgba(0,0,0,0.03)}
.review-stars{color:#f5c518;margin-bottom:12px;font-size:14px;letter-spacing:2px}
.review-text{font-size:14px;color:var(--ink);line-height:1.65;margin-bottom:16px;font-style:italic}
.review-author{font-size:13px;color:var(--gray);display:flex;justify-content:space-between}
.review-author strong{color:var(--ink);font-weight:600}

.info{padding:80px 40px;max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.info-visual{aspect-ratio:4/3;background:linear-gradient(135deg,var(--primary),var(--accent));border-radius:24px;display:flex;align-items:center;justify-content:center;padding:40px;color:#fff;position:relative;overflow:hidden}
.info-visual::before{content:'';position:absolute;top:-50px;right:-50px;width:250px;height:250px;background:radial-gradient(circle,rgba(255,255,255,0.2),transparent 70%);border-radius:50%}
.info-visual-content{position:relative;z-index:1;text-align:center}
.info-visual-tag{font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:12px;opacity:0.85}
.info-visual h3{font-family:var(--serif);font-size:28px;font-weight:500;margin-bottom:8px}
.info-visual p{font-size:14px;opacity:0.9}
.info-text h2{font-family:var(--serif);font-size:clamp(1.8rem,3vw,2.4rem);font-weight:500;line-height:1.15;margin-bottom:20px}
.info-grid{display:grid;gap:16px;margin-top:24px}
.info-item{display:flex;gap:14px;align-items:flex-start}
.info-item-icon{width:36px;height:36px;background:${theme.primary}14;color:var(--primary);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.info-item-text{font-size:14px;line-height:1.6}
.info-item-text strong{display:block;color:var(--ink);font-weight:600;margin-bottom:2px}
.info-item-text span{color:var(--gray)}

.cta{padding:80px 40px 120px;background:var(--ink);color:#fff;text-align:center;position:relative;overflow:hidden}
.cta::before{content:'';position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:500px;height:500px;background:radial-gradient(circle,${theme.primary}4d,transparent 60%);border-radius:50%}
.cta-inner{position:relative;z-index:1;max-width:700px;margin:0 auto}
.cta h2{font-family:var(--serif);font-size:clamp(2rem,4vw,3rem);font-weight:500;margin-bottom:16px}
.cta p{font-size:16px;opacity:0.72;margin-bottom:32px}
.cta .btn-primary{background:#fff;color:var(--ink)}
.cta .btn-primary:hover{background:var(--cream);color:var(--primary)}

footer{padding:32px 40px 70px;background:var(--ink);color:rgba(255,255,255,0.5);text-align:center;font-size:12px}

@media(max-width:900px){
  nav{padding:0 20px;height:64px}.nav-links{display:none}
  .hero{padding:44px 20px 72px}.hero-inner{grid-template-columns:1fr;gap:32px}
  .about{padding:60px 20px}.about-stats{grid-template-columns:1fr;gap:20px}
  .products{padding:60px 20px}.cat-grid{grid-template-columns:repeat(2,1fr)}
  .items-grid{grid-template-columns:1fr}
  .reviews{padding:60px 20px}.reviews-grid{grid-template-columns:1fr}
  .info{padding:60px 20px;grid-template-columns:1fr;gap:32px}
  .gallery{padding:20px 20px 60px}.gallery-grid{grid-template-columns:repeat(2,1fr)}
  .cta{padding:60px 20px 100px}
  body::after{font-size:60px}
}
</style>
</head>
<body>

<a href="https://webconceptor.fr" class="wc-home-btn" title="Retour WebConceptor">
  <span class="wc-home-btn-logo">W</span>
  <span>WebConceptor</span>
</a>
<div class="wc-demo-badge">Maquette</div>

<div class="top-strip">${escape(config.topStripText)}</div>

<nav>
  <div class="logo">
    <span class="logo-icon">${config.iconHero}</span>
    <span>${escape(prospect.name)}</span>
  </div>
  <ul class="nav-links">
    <li><a href="#propos">À propos</a></li>
    <li><a href="#produits">${escape(config.productsTitle)}</a></li>
    ${galleryHtml ? `<li><a href="#galerie">Galerie</a></li>` : ""}
    ${reviewsHtml ? `<li><a href="#avis">Avis</a></li>` : ""}
    <li><a href="#contact">Contact</a></li>
  </ul>
  <a href="#contact" class="nav-cta">${escape(config.ctaBottom)}</a>
</nav>

<section class="hero">
  <div class="hero-inner">
    <div>
      <div class="hero-tag"><span class="dot"></span>${escape(config.heroTag)}${cityStr ? ` · ${cityStr}` : ""}</div>
      <h1>${escape(content.heroTitle)}</h1>
      <p>${escape(content.heroSubtitle)}</p>
      <div class="hero-ctas">
        <a href="#produits" class="btn-primary">Découvrir</a>
        <a href="#contact" class="btn-outline">${escape(config.ctaBottom)}</a>
      </div>
    </div>
    ${heroPhoto ? `<div class="hero-photo"><img src="${escape(heroPhoto)}" alt="${escape(prospect.name)}" loading="lazy"></div>` : `<div class="hero-photo">${config.iconHero}</div>`}
  </div>
</section>

<section id="propos" class="about">
  <span class="section-tag">${escape(config.sectionTag)}</span>
  <h2>${escape(prospect.name)}</h2>
  <p>${escape(aboutText)}</p>
  ${prospect.google_rating ? `
  <div class="about-stats">
    <div><div class="stat-num">${prospect.google_rating.toFixed(1)}/5</div><div class="stat-label">Note Google</div></div>
    <div><div class="stat-num">${prospect.google_reviews_count || 0}</div><div class="stat-label">Avis clients</div></div>
    <div><div class="stat-num">${prospect.city ? escape(prospect.city) : "France"}</div><div class="stat-label">Emplacement</div></div>
  </div>` : ""}
</section>

${galleryHtml ? `<section id="galerie" class="gallery">${galleryHtml}</section>` : ""}

<section id="produits" class="products">
  <div class="products-inner">
    <div class="products-header">
      <span class="section-tag">${escape(config.sectionTag)}</span>
      <h2>${escape(config.productsTitle)}</h2>
      <p>${escape(config.productsIntro)}</p>
    </div>
    ${itemsHtml}
  </div>
</section>

${reviewsHtml}

<section id="contact" class="info">
  <div class="info-visual">
    <div class="info-visual-content">
      <div class="info-visual-tag">Venez nous voir</div>
      <h3>${cityStr ? `À ${cityStr}` : "Près de chez vous"}</h3>
      <p>Un accueil chaleureux vous attend</p>
    </div>
  </div>
  <div class="info-text">
    <span class="section-tag">Informations pratiques</span>
    <h2>Nous contacter</h2>
    <div class="info-grid">
      ${addressStr ? infoItem("adresse", "Adresse", addressStr) : ""}
      ${phoneStr ? infoItem("phone", "Téléphone", phoneStr) : ""}
      ${prospect.hours ? infoItem("clock", "Horaires", escape(prospect.hours.slice(0, 200))) : ""}
      ${prospect.website ? infoItem("web", "Site actuel", escape(prospect.website)) : ""}
    </div>
  </div>
</section>

<section class="cta">
  <div class="cta-inner">
    <span class="section-tag" style="color:var(--accent)">Rencontrons-nous</span>
    <h2>${escape(config.ctaBottom)}</h2>
    <p>L&rsquo;équipe vous accueille avec le sourire${cityStr ? ` à ${cityStr}` : ""}.</p>
    <a href="#contact" class="btn-primary">${escape(config.ctaBottom)}</a>
  </div>
</section>

<footer>&copy; 2026 — Maquette générée par WebConceptor</footer>

<div class="wc-watermark">
  Maquette conçue par <strong>WEBCONCEPTOR</strong> &middot;
  <a href="https://webconceptor.fr" target="_blank">webconceptor.fr</a> &middot;
  Toute reproduction interdite
</div>

</body>
</html>`;
}

/* ══════════════════════════════════════════
   Sous-composants HTML
   ══════════════════════════════════════════ */

function renderItems(items: Array<{ category: string; name: string; description: string; price: string }>): string {
  return `<div class="items-grid">
    ${items.slice(0, 9).map((it) => `
      <div class="item-card">
        ${it.category ? `<div class="item-cat">${escape(it.category)}</div>` : ""}
        <div class="item-name">${escape(it.name)}</div>
        ${it.description ? `<div class="item-desc">${escape(it.description)}</div>` : ""}
        ${it.price ? `<div class="item-price">${escape(it.price)}</div>` : ""}
      </div>
    `).join("")}
  </div>`;
}

function renderFallbackCategories(cats: Array<{ emoji: string; title: string; desc: string }>): string {
  return `<div class="cat-grid">
    ${cats.map((c) => `
      <div class="cat-item">
        <span class="cat-emoji">${c.emoji}</span>
        <h3>${escape(c.title)}</h3>
        <p>${escape(c.desc)}</p>
      </div>
    `).join("")}
  </div>`;
}

function renderGallery(photos: string[], name: string): string {
  return `<div class="gallery-grid">
    ${photos.map((p, i) => `<img src="${escape(p)}" alt="${escape(name)} — photo ${i + 1}" loading="lazy">`).join("")}
  </div>`;
}

function renderReviews(reviews: Array<{ author: string; rating: number; text: string; timeAgo: string }>): string {
  return `<section id="avis" class="reviews">
    <div class="reviews-header">
      <span class="section-tag">Ils en parlent</span>
      <h2>Ce que disent nos clients</h2>
    </div>
    <div class="reviews-grid">
      ${reviews.map((r) => `
        <div class="review-card">
          <div class="review-stars">${"★".repeat(Math.max(1, Math.min(5, Math.round(r.rating || 5))))}</div>
          <div class="review-text">"${escape((r.text || "").slice(0, 260))}${r.text && r.text.length > 260 ? "…" : ""}"</div>
          <div class="review-author"><strong>${escape(r.author || "Client")}</strong><span>${escape(r.timeAgo || "")}</span></div>
        </div>
      `).join("")}
    </div>
  </section>`;
}

function infoItem(icon: string, label: string, value: string): string {
  const svgs: Record<string, string> = {
    adresse: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>`,
    phone: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>`,
    clock: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>`,
    web: `<svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9 9 0 100-18 9 9 0 000 18z"/><path stroke-linecap="round" stroke-linejoin="round" d="M3.6 9h16.8M3.6 15h16.8M11.5 3a17 17 0 000 18M12.5 3a17 17 0 010 18"/></svg>`,
  };
  return `<div class="info-item"><div class="info-item-icon">${svgs[icon] || ""}</div><div class="info-item-text"><strong>${escape(label)}</strong><span>${value}</span></div></div>`;
}
