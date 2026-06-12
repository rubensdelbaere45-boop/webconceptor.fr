/* ══════════════════════════════════════════
   Restaurant mockup template
   Génère un HTML complet + interface de réservation premium
   4 thèmes × 4 paires de polices = 16 combinaisons distinctes,
   choisies de manière déterministe selon le slug du prospect.
   ══════════════════════════════════════════ */

export interface RestaurantProspect {
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
  // Photos scrapées du site actuel du prospect (URLs directes externes)
  website_photos?: string[];
  // Type métier — détermine le libellé des CTAs (réserver vs rdv vs devis, etc.)
  business_type?: string;
  // Tier luxury — maquette Stitch sur-mesure, prix 860€
  is_luxury?: boolean;
}

/* Libellés CTA adaptés au métier (évite "Réserver une table" chez un coiffeur) */
export function getBusinessLabels(businessType?: string) {
  const t = (businessType || "restaurant").toLowerCase();

  // ── RESTAURATION sur place (table + service) ──────────────────────────────
  if (["restaurant", "brasserie", "bistrot", "gastronomique", "bar", "cafe"].includes(t)) {
    return {
      ctaVerb: "Réserver une table",
      ctaShort: "Réserver",
      menuSectionTitle: "Notre carte",
      aboutHeadline: "Une cuisine de <em>caractère</em>",
      navItems: ["L'adresse", "La carte", "Ambiance", "Nous trouver"],
      topStrip: "Cuisine authentique",
    };
  }
  // ── GLACIER ───────────────────────────────────────────────────────────────
  if (t === "glacier") {
    return {
      ctaVerb: "Voir nos parfums",
      ctaShort: "Nos parfums",
      menuSectionTitle: "Nos parfums du moment",
      aboutHeadline: "La glace artisanale à l'<em>état pur</em>",
      navItems: ["La glacerie", "Nos parfums", "Ambiance", "Nous trouver"],
      topStrip: "Glaces & sorbets artisanaux",
    };
  }
  // ── SALON DE THÉ ──────────────────────────────────────────────────────────
  if (t === "salon_de_the") {
    return {
      ctaVerb: "Réserver une table",
      ctaShort: "Réserver",
      menuSectionTitle: "Notre sélection",
      aboutHeadline: "Un instant de <em>douceur</em>",
      navItems: ["Le salon", "La carte", "Ambiance", "Nous trouver"],
      topStrip: "Thés & pâtisseries maison",
    };
  }
  // ── BOULANGERIE / PÂTISSERIE / CHOCOLATIER ───────────────────────────────
  if (["boulangerie", "patisserie", "chocolatier"].includes(t)) {
    return {
      ctaVerb: "Commander",
      ctaShort: "Commander",
      menuSectionTitle: "Nos créations",
      aboutHeadline: "Le goût du <em>travail bien fait</em>",
      navItems: ["La maison", "Nos produits", "Ambiance", "Nous trouver"],
      topStrip: "Artisan passionné",
    };
  }
  // ── PIZZERIA / CRÊPERIE / FOOD TRUCK ─────────────────────────────────────
  if (["pizzeria", "creperie", "food_truck"].includes(t)) {
    return {
      ctaVerb: "Commander",
      ctaShort: "Commander",
      menuSectionTitle: "Notre spécialité",
      aboutHeadline: "L'<em>authenticité</em> dans chaque assiette",
      navItems: ["La maison", "La carte", "Ambiance", "Nous trouver"],
      topStrip: "Fait maison",
    };
  }
  // ── FLEURISTE ─────────────────────────────────────────────────────────────
  if (t === "fleuriste") {
    return {
      ctaVerb: "Commander un bouquet",
      ctaShort: "Commander",
      menuSectionTitle: "Nos collections",
      aboutHeadline: "L'art de la <em>composition</em>",
      navItems: ["La maison", "Nos fleurs", "Ambiance", "Nous trouver"],
      topStrip: "Fleuriste artisan",
    };
  }
  // ── BEAUTÉ & BIEN-ÊTRE avec RDV ──────────────────────────────────────────
  if (["coiffeur", "institut", "spa", "fitness"].includes(t)) {
    return {
      ctaVerb: "Prendre rendez-vous",
      ctaShort: "Rendez-vous",
      menuSectionTitle: "Nos prestations",
      aboutHeadline: "Un <em>savoir-faire</em> d'exception",
      navItems: ["Le salon", "Prestations", "Ambiance", "Nous trouver"],
      topStrip: "Sur rendez-vous",
    };
  }
  // ── SANTÉ ─────────────────────────────────────────────────────────────────
  if (["dentiste", "osteo", "kine"].includes(t)) {
    return {
      ctaVerb: "Prendre rendez-vous",
      ctaShort: "Rendez-vous",
      menuSectionTitle: "Nos soins",
      aboutHeadline: "Votre <em>santé</em>, notre priorité",
      navItems: ["Le cabinet", "Soins", "Équipe", "Nous trouver"],
      topStrip: "Prise de rendez-vous en ligne",
    };
  }
  // ── ARTISANS / SERVICES TECHNIQUES ────────────────────────────────────────
  if (["plombier", "electricien", "garage", "menuisier", "peintre"].includes(t)) {
    return {
      ctaVerb: "Demander un devis",
      ctaShort: "Devis gratuit",
      menuSectionTitle: "Nos prestations",
      aboutHeadline: "Un <em>savoir-faire</em> reconnu",
      navItems: ["Présentation", "Prestations", "Réalisations", "Nous trouver"],
      topStrip: "Devis gratuit — Intervention rapide",
    };
  }
  // ── SPORT / FORMATION ────────────────────────────────────────────────────
  if (["salle_sport", "auto_ecole"].includes(t)) {
    return {
      ctaVerb: "Réserver un créneau",
      ctaShort: "S'inscrire",
      menuSectionTitle: "Nos formules",
      aboutHeadline: "Votre <em>objectif</em>, notre priorité",
      navItems: ["Présentation", "Formules", "Ambiance", "Nous trouver"],
      topStrip: "Places disponibles cette semaine",
    };
  }
  // ── Épicerie / Commerce de proximité ────────────────────────────────────
  if (["epicerie", "superette"].includes(t)) {
    return {
      ctaVerb: "Nous rendre visite",
      ctaShort: "Venir",
      menuSectionTitle: "Nos rayons",
      aboutHeadline: "Le commerce de <em>proximité</em> à votre service",
      navItems: ["Le magasin", "Rayons", "Promotions", "Nous trouver"],
      topStrip: "Ouvert 7j/7",
    };
  }
  // ── Défaut ───────────────────────────────────────────────────────────────
  return {
    ctaVerb: "Nous contacter",
    ctaShort: "Contact",
    menuSectionTitle: "Nos services",
    aboutHeadline: "À votre <em>service</em>",
    navItems: ["Présentation", "Services", "Réalisations", "Nous trouver"],
    topStrip: "À votre service",
  };
}

export interface RestaurantReview {
  author: string;
  rating: number;
  text: string;
  timeAgo: string;
}

export type RestaurantVibe = "classic" | "rustic" | "modern" | "coastal" | "sunny" | "luxury";

export interface RestaurantContent {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  menuItems: Array<{ name: string; description: string; price: string; category: string }>;
  cuisineType: string;
  talkingPoints: string[];
  emailSubject: string;
  emailOpening: string;
  emailPitch: string;
  // Vibe choisi par Claude selon le caractère du business
  vibe?: RestaurantVibe;
  reviews?: RestaurantReview[];
  // Teaser mystérieux pour sites audités — généré par Claude selon les issues
  auditTeaser?: string;
}

export interface RestaurantProspectExtended extends RestaurantProspect {
  reviews?: RestaurantReview[] | null;
}

function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ══════════════════════════════════════════
   4 thèmes de couleurs
   ══════════════════════════════════════════ */
interface Theme {
  id: string;
  ink: string;
  accent: string;
  accentDark: string;
  deep: string;        // couleur profonde pour CTA / section-phare
  cream: string;
  warm: string;
  stone: string;
  shadow: string;
  darkMode?: boolean;  // true → applique la couche CSS dark luxury (fond #0C0C0C)
}

const THEMES: Theme[] = [
  // 1 — Gold & Wine (brasserie classique) → vibe: classic
  { id: "gold-wine", ink: "#1a1310", accent: "#c19a56", accentDark: "#9d7a3e", deep: "#6b1f2a", cream: "#f9f5ef", warm: "#fdfaf5", stone: "#8b7e6e", shadow: "rgba(26,19,16,0.88)" },
  // 2 — Olive & Sand (terroir, rustique, boulangerie traditionnelle, vieilles maisons) → vibe: rustic
  { id: "olive-sand", ink: "#212522", accent: "#6b8c3e", accentDark: "#516a2f", deep: "#3d4a2a", cream: "#f5f2e8", warm: "#fbf8ee", stone: "#7a8274", shadow: "rgba(33,37,34,0.88)" },
  // 3 — Teal & Copper (coastal, fruits de mer, crêperies Bretagne) → vibe: coastal
  { id: "teal-copper", ink: "#16202a", accent: "#c46b3f", accentDark: "#9e5530", deep: "#1f4b54", cream: "#f3f1ed", warm: "#fafaf6", stone: "#6c7a85", shadow: "rgba(22,32,42,0.88)" },
  // 4 — Charcoal & Rose (chic urbain, gastro contemporain, pâtisseries modernes) → vibe: modern
  { id: "charcoal-rose", ink: "#181818", accent: "#b87f7a", accentDark: "#8f615d", deep: "#3d2226", cream: "#f4efed", warm: "#faf6f4", stone: "#767170", shadow: "rgba(24,24,24,0.88)" },
  // 5 — Sunny (glaciers, bars d'été, salons de thé ensoleillés) → vibe: sunny
  { id: "sunny", ink: "#2d2417", accent: "#f59e0b", accentDark: "#c17f0a", deep: "#b45309", cream: "#fff7ed", warm: "#fffbf2", stone: "#8c7a5c", shadow: "rgba(45,36,23,0.82)" },
  // 6 — Dark Luxury (restaurant bistronomique premium, gastronomique) → vibe: luxury
  // Inspiré du design Blink : fond #0C0C0C, or chaud, Playfair Display + Manrope
  { id: "dark-luxury", ink: "#0C0C0C", accent: "#C9A96E", accentDark: "#9E7A42", deep: "#1E1400", cream: "#1A1A1A", warm: "#0C0C0C", stone: "#9A8B7A", shadow: "rgba(0,0,0,0.96)", darkMode: true },
];

// Mapping vibe → theme + fonts. Utilisé quand Claude donne un vibe.
const VIBE_TO_THEME: Record<RestaurantVibe, string> = {
  classic: "gold-wine",      // brasseries, gastro française traditionnelle
  rustic: "olive-sand",      // vieilles maisons, boulangerie artisanale, bistrots terroir
  coastal: "teal-copper",    // fruits de mer, crêperies Bretagne, Nice
  modern: "charcoal-rose",   // gastro contemporaine, pâtisserie haute couture, urbain
  sunny: "sunny",            // glaciers, bar plage, salons de thé ensoleillés
  luxury: "dark-luxury",     // restaurant bistronomique premium, gastronomique
};

const VIBE_TO_FONT_INDEX: Record<RestaurantVibe, number> = {
  classic: 0,   // Cormorant Garamond + Inter + Great Vibes (timeless)
  rustic: 3,    // Libre Caslon + Lato + Petit Formal Script (heritage)
  coastal: 1,   // Playfair Display + Montserrat + Dancing Script
  modern: 2,    // EB Garamond + Work Sans + Pinyon Script (minimal)
  sunny: 1,     // Playfair Display + Montserrat + Dancing Script (festif)
  luxury: 4,    // Playfair Display + Manrope (dark luxury, inspiré Blink)
};

// ── Vibe FORCÉ par business_type ──────────────────────────────────────────
// Priorité absolue sur le choix de Claude — garantit que chaque métier reçoit
// le bon design (glacier → sunny, boulangerie → rustic, etc.)
export const BUSINESS_TYPE_VIBE: Record<string, RestaurantVibe> = {
  // ── Restauration — dark luxury (fond #0C0C0C, Playfair + Manrope) ──────────
  restaurant:    "luxury",
  brasserie:     "luxury",
  gastronomique: "luxury",
  bistrot:       "luxury",
  pizzeria:      "rustic",
  creperie:      "coastal",
  bar:           "modern",
  food_truck:    "sunny",
  // ── Café / Thé / Glacier ───────────────────────────────────────────────────
  glacier:       "sunny",
  cafe:          "sunny",
  salon_de_the:  "sunny",
  // ── Artisanat alimentaire ─────────────────────────────────────────────────
  boulangerie:   "rustic",
  patisserie:    "modern",
  chocolatier:   "modern",
  // ── Beauté & bien-être ────────────────────────────────────────────────────
  coiffeur:      "modern",
  spa:           "modern",
  institut:      "modern",
  fitness:       "modern",
  // ── Santé ─────────────────────────────────────────────────────────────────
  dentiste:      "modern",
  osteo:         "modern",
  kine:          "modern",
  // ── Commerce ─────────────────────────────────────────────────────────────
  fleuriste:     "sunny",
  epicerie:      "rustic",
  // ── Artisans / Services techniques ───────────────────────────────────────
  plombier:      "classic",
  electricien:   "classic",
  garage:        "classic",
  menuisier:     "rustic",
  peintre:       "modern",
  // ── Formation / Sport ────────────────────────────────────────────────────
  salle_sport:   "modern",
  auto_ecole:    "classic",
};

// ── Photos Unsplash THÉMATIQUES par business_type ─────────────────────────
// Fallback si le prospect n'a pas de photos Google Places.
// Chaque métier a ses propres images — plus jamais de cave à vins pour un glacier.
const FALLBACK_PHOTOS_BY_TYPE: Record<string, string[]> = {
  glacier: [
    "https://images.unsplash.com/photo-1567206563114-c179900d7065?w=1600&q=80&auto=format&fit=crop",  // gelato coloré
    "https://images.unsplash.com/photo-1497034825429-c343d7c6a68f?w=1600&q=80&auto=format&fit=crop",  // cone glace
    "https://images.unsplash.com/photo-1576506542790-51244b486a6b?w=1600&q=80&auto=format&fit=crop",  // sorbets
    "https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=1600&q=80&auto=format&fit=crop",  // coupe glace
    "https://images.unsplash.com/photo-1488900128323-21503983a07e?w=1600&q=80&auto=format&fit=crop",  // glace artisanale
  ],
  boulangerie: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&q=80&auto=format&fit=crop",  // pains
    "https://images.unsplash.com/photo-1555507036-ab794f4afe5a?w=1600&q=80&auto=format&fit=crop",  // baguette
    "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=1600&q=80&auto=format&fit=crop",  // viennoiseries
    "https://images.unsplash.com/photo-1585478259715-4d3db5d97f74?w=1600&q=80&auto=format&fit=crop",  // croissants
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1600&q=80&auto=format&fit=crop",  // four
  ],
  patisserie: [
    "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=1600&q=80&auto=format&fit=crop",  // gâteaux
    "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=1600&q=80&auto=format&fit=crop",  // macarons
    "https://images.unsplash.com/photo-1483695028939-5bb13f8648b0?w=1600&q=80&auto=format&fit=crop",  // entremets
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1600&q=80&auto=format&fit=crop",  // pâtisseries
    "https://images.unsplash.com/photo-1579740765855-71bb79656e97?w=1600&q=80&auto=format&fit=crop",  // éclairs
  ],
  cafe: [
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80&auto=format&fit=crop",  // café latte
    "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=1600&q=80&auto=format&fit=crop",  // comptoir café
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&q=80&auto=format&fit=crop",  // café intérieur
    "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=1600&q=80&auto=format&fit=crop",  // espresso
    "https://images.unsplash.com/photo-1511920170033-f8396924c348?w=1600&q=80&auto=format&fit=crop",  // barista
  ],
  creperie: [
    "https://images.unsplash.com/photo-1519676867240-f03562e64548?w=1600&q=80&auto=format&fit=crop",  // crêpes
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=1600&q=80&auto=format&fit=crop",  // galette
    "https://images.unsplash.com/photo-1588195538326-c5b1e9f80a1b?w=1600&q=80&auto=format&fit=crop",  // crêpière
    "https://images.unsplash.com/photo-1627308595229-7830a5c18605?w=1600&q=80&auto=format&fit=crop",  // crêpe pliée
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?w=1600&q=80&auto=format&fit=crop",  // crêpe sucrée
  ],
  pizzeria: [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600&q=80&auto=format&fit=crop",  // pizza
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1600&q=80&auto=format&fit=crop",  // pizza four à bois
    "https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=1600&q=80&auto=format&fit=crop",  // pizza close-up
    "https://images.unsplash.com/photo-1548369937-47519962c11a?w=1600&q=80&auto=format&fit=crop",  // margherita
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=1600&q=80&auto=format&fit=crop",  // cuisine
  ],
  coiffeur: [
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1600&q=80&auto=format&fit=crop",  // salon coiffure
    "https://images.unsplash.com/photo-1560066984-138daaa4e6fb?w=1600&q=80&auto=format&fit=crop",  // coupe
    "https://images.unsplash.com/photo-1562322140-8baeebebf3df?w=1600&q=80&auto=format&fit=crop",  // coiffeur miroir
    "https://images.unsplash.com/photo-1582095133179-bfd08e2fb6b7?w=1600&q=80&auto=format&fit=crop",  // shampooing
    "https://images.unsplash.com/photo-1633681926035-ec1ac984418a?w=1600&q=80&auto=format&fit=crop",  // coupe femme
  ],
  spa: [
    "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519824145371-296894a0daa9?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1600&q=80&auto=format&fit=crop",
  ],
  institut: [
    "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1607779097040-26e80aa78e66?w=1600&q=80&auto=format&fit=crop",
  ],
  fitness: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&q=80&auto=format&fit=crop",
  ],
  brasserie: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=1600&q=80&auto=format&fit=crop",
  ],
  bistrot: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1551218808-94e220e084d2?w=1600&q=80&auto=format&fit=crop",
  ],
  salon_de_the: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1600&q=80&auto=format&fit=crop",
  ],
  chocolatier: [
    "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1511381939415-e44015466834?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516684733450-c51e4d3e4985?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580461763344-c4b8bdbda1ce?w=1600&q=80&auto=format&fit=crop",
  ],
  food_truck: [
    "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1567521464027-f127ff144326?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1609780447631-05b93e5a88ea?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556742031-c6961e8560b0?w=1600&q=80&auto=format&fit=crop",
  ],
  fleuriste: [
    "https://images.unsplash.com/photo-1490750967868-88df5691cc69?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1444021465936-c6ca81d39b84?w=1600&q=80&auto=format&fit=crop",
  ],
  plombier: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=1600&q=80&auto=format&fit=crop",
  ],
  electricien: [
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1573607217032-18299406d100?w=1600&q=80&auto=format&fit=crop",
  ],
  garage: [
    "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1562504208-03d85cc8c23e?w=1600&q=80&auto=format&fit=crop",
  ],
  salle_sport: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1541534741688-6078c6bfb5c5?w=1600&q=80&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1600&q=80&auto=format&fit=crop",
  ],
};
const FALLBACK_PHOTOS_DEFAULT = [
  "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544025162-d76694265947?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1600&q=80&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1600&q=80&auto=format&fit=crop",
];

/* ══════════════════════════════════════════
   4 paires de polices (Google Fonts)
   ══════════════════════════════════════════ */
interface FontPair {
  id: string;
  serif: string;         // nom utilisé dans font-family
  serifParam: string;    // paramètre pour URL Google Fonts
  sans: string;
  sansParam: string;
  script: string;
  scriptParam: string;
}

const FONT_PAIRS: FontPair[] = [
  {
    id: "cormorant",
    serif: "'Cormorant Garamond',Georgia,serif",
    serifParam: "Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400",
    sans: "'Inter',system-ui,sans-serif",
    sansParam: "Inter:wght@300;400;500;600;700",
    script: "'Great Vibes',cursive",
    scriptParam: "Great+Vibes",
  },
  {
    id: "playfair",
    serif: "'Playfair Display',Georgia,serif",
    serifParam: "Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400",
    sans: "'Montserrat',system-ui,sans-serif",
    sansParam: "Montserrat:wght@300;400;500;600;700",
    script: "'Dancing Script',cursive",
    scriptParam: "Dancing+Script:wght@500;600;700",
  },
  {
    id: "eb-garamond",
    serif: "'EB Garamond',Georgia,serif",
    serifParam: "EB+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400",
    sans: "'Work Sans',system-ui,sans-serif",
    sansParam: "Work+Sans:wght@300;400;500;600;700",
    script: "'Pinyon Script',cursive",
    scriptParam: "Pinyon+Script",
  },
  {
    id: "libre",
    serif: "'Libre Caslon Text',Georgia,serif",
    serifParam: "Libre+Caslon+Text:ital,wght@0,400;0,700;1,400",
    sans: "'Lato',system-ui,sans-serif",
    sansParam: "Lato:wght@300;400;700;900",
    script: "'Petit Formal Script',cursive",
    scriptParam: "Petit+Formal+Script",
  },
  // 5 — Playfair Display + Manrope (dark luxury — inspiré du design Blink)
  {
    id: "playfair-manrope",
    serif: "'Playfair Display',Georgia,serif",
    serifParam: "Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400",
    sans: "'Manrope',system-ui,sans-serif",
    sansParam: "Manrope:wght@200;300;400;500;600;700",
    script: "'Playfair Display',Georgia,serif",
    scriptParam: "Playfair+Display:ital,wght@1,400",
  },
];

/* Hash deterministe pour choisir thème + police par prospect.slug */
function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

export function generateRestaurantMockupHtml(
  prospect: RestaurantProspect,
  content: RestaurantContent,
  origin: string
): string {
  // Sélection du vibe (priorité décroissante) :
  // 1. BUSINESS_TYPE_VIBE (override absolu par métier) — garantit glacier=sunny, etc.
  // 2. Vibe choisi par Claude (si pas de mapping métier)
  // 3. Hash déterministe par slug (fallback ultime)
  const hash = hashString(prospect.slug || prospect.id);
  let theme = THEMES[hash % THEMES.length];
  let fontPair = FONT_PAIRS[(hash >> 4) % FONT_PAIRS.length];
  const businessTypeVibe: RestaurantVibe | undefined =
    prospect.business_type ? (BUSINESS_TYPE_VIBE[prospect.business_type] as RestaurantVibe | undefined) : undefined;
  const effectiveVibe = businessTypeVibe ?? content.vibe;
  if (effectiveVibe && VIBE_TO_THEME[effectiveVibe]) {
    const themeId = VIBE_TO_THEME[effectiveVibe];
    const fontIdx = VIBE_TO_FONT_INDEX[effectiveVibe];
    const pickedTheme = THEMES.find((t) => t.id === themeId);
    if (pickedTheme) theme = pickedTheme;
    if (FONT_PAIRS[fontIdx]) fontPair = FONT_PAIRS[fontIdx];
  }

  // Labels CTAs adaptés au type métier (évite "Réserver une table" chez un coiffeur)
  const labels = getBusinessLabels(prospect.business_type);

  // Variations de LAYOUT déterministes par hash — chaque prospect a son propre layout.
  // Hero alignment : 3 variantes (centered, left, right)
  const heroAlign: "center" | "left" | "right" =
    ["center", "left", "right"][(hash >> 8) % 3] as "center" | "left" | "right";
  // About image side : gauche ou droite
  const aboutImageSide: "left" | "right" = (hash >> 12) % 2 === 0 ? "left" : "right";
  // Gallery columns : 3, 4 ou 5
  const galleryCols: number = [3, 4, 5][(hash >> 16) % 3];
  // Menu columns : 1 ou 2
  const menuCols: number = (hash >> 20) % 2 === 0 ? 1 : 2;

  // Photos fallback thématiques — sélectionnées par business_type.
  // Un glacier reçoit des photos de glaces, une boulangerie des photos de pain, etc.
  // Si pas de mapping, on utilise des photos restaurant génériques.
  const FALLBACK_PHOTOS = (prospect.business_type && FALLBACK_PHOTOS_BY_TYPE[prospect.business_type])
    ? FALLBACK_PHOTOS_BY_TYPE[prospect.business_type]
    : FALLBACK_PHOTOS_DEFAULT;

  // Stratégie photos (priorité inversée — qualité d'abord) :
  // 1. Unsplash thématiques de haute qualité (toujours beau)        ← PRIO 1
  // 2. Photos Google Places via proxy (qualité variable)             ← PRIO 2
  // 3. Photos scrapées du site UNIQUEMENT si haute qualité           ← PRIO 3
  // Résultat : les maquettes sont toujours belles, pas de banners moches.
  const photoUrls: string[] = [];
  const websitePhotosArr = Array.isArray(prospect.website_photos) ? prospect.website_photos : [];
  const googlePhotosArr = Array.isArray(prospect.photos) ? prospect.photos : [];

  // Filtre anti-junk : exclut logos, banners pub, widgets, petites images
  const isJunkPhoto = (u: string): boolean =>
    /(tripadvisor|instagram|fbcdn|facebook|twimg|twitter|youtube|ytimg|pinterest|linkedin|yelp|trustpilot|gstatic|doubleclick|adservice|widgets\.|logo|icon|favicon|sprite|avatar|button|\/btn|social|banner|240_240|160x|120x|static\.pro\.|badge|flag|star)/i.test(u);

  // PRIORITÉ 1 : Unsplash thématiques (toujours beau)
  const thematic = FALLBACK_PHOTOS.slice(0, 5);

  // PRIORITÉ 2 : Google Places (qualité décente en général)
  const googleSources: string[] = [];
  for (const ref of googlePhotosArr) {
    if (typeof ref === "string" && /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(ref)) {
      googleSources.push(`${origin}/api/prospect/photo?ref=${encodeURIComponent(ref)}`);
    }
  }

  // PRIORITÉ 3 : photos scrappées du site (filtrées strictement)
  const siteSources: string[] = [];
  for (const wp of websitePhotosArr) {
    if (typeof wp === "string" && /^https?:\/\//.test(wp) && !isJunkPhoto(wp)) {
      siteSources.push(wp);
    }
  }

  // Compose : Google d'abord si dispo (photos réelles du commerce), sinon Unsplash
  const allSources = [...googleSources.slice(0, 2), ...siteSources.slice(0, 1), ...thematic];
  for (let i = 0; i < 5; i++) {
    photoUrls.push(allSources[i] || thematic[i % thematic.length]);
  }

  // 3-step onerror chain :
  // 1. primary (Google Places proxy)
  // 2. fallback Unsplash (si primary échoue)
  // 3. si les deux échouent → on cache l'img (container révèle son dégradé CSS)
  const img = (primary: string, fallback: string, alt: string, attrs = "") =>
    `<img src="${esc(primary)}" data-fb="${esc(fallback)}" onerror="var s=this.dataset.s||0;if(s==0){this.dataset.s=1;this.src=this.dataset.fb}else{this.style.display='none'}" alt="${esc(alt)}" ${attrs}>`;

  // Group items by category (any category — entrée/plat/dessert for resto,
  // pains/viennoiseries/pâtisseries for boulangerie, etc.)
  // Preserves insertion order via Map.
  const grouped = new Map<string, typeof content.menuItems>();
  for (const m of content.menuItems) {
    const cat = (m.category || "Carte").trim();
    if (!grouped.has(cat)) grouped.set(cat, []);
    grouped.get(cat)!.push(m);
  }

  // Détecte si on a les VRAIS prix (scrapés depuis le site du resto) ou non.
  // Si non, on affiche un bandeau explicatif et les prix sont masqués dans le menu.
  const menuHasRealPrices = content.menuItems.some(
    (m) => m.price && m.price.trim().length > 0 && /[0-9]/.test(m.price)
  );

  const menuHtml = (items: typeof content.menuItems) =>
    items
      .map((m) => {
        const priceDisplay = menuHasRealPrices && m.price && m.price.trim().length > 0
          ? esc(m.price)
          : `<span class="price-pending">sur mesure</span>`;
        return `
    <div class="menu-item">
      <div class="menu-item-head">
        <h4>${esc(m.name)}</h4>
        <span class="dots"></span>
        <span class="price">${priceDisplay}</span>
      </div>
      <p>${esc(m.description)}</p>
    </div>`;
      })
      .join("");

  const menuPricesBanner = !menuHasRealPrices
    ? `<div class="menu-prices-banner">
        <strong>📝 Tarifs personnalisés à venir</strong>
        Envoyez-nous votre carte actuelle par email à <a href="mailto:contact@klyora.fr?subject=Ma%20carte%20pour%20la%20maquette">contact@klyora.fr</a> — nous affinerons votre maquette avec vos vrais plats et vos vrais prix sous 24 h.
      </div>`
    : "";

  // Titre section avec 1ère lettre en majuscule
  const sectionTitle = (cat: string) => {
    if (!cat) return "Carte";
    const s = cat.trim();
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // Build all sections dynamically
  const menuSectionsHtml = menuPricesBanner + Array.from(grouped.entries())
    .map(
      ([cat, items]) => `<div class="menu-section">
      <div class="menu-section-title">${esc(sectionTitle(cat))}</div>
      ${menuHtml(items)}
    </div>`
    )
    .join("\n    ");

  // Build Google Fonts URL
  const fontUrl = `https://fonts.googleapis.com/css2?family=${fontPair.serifParam}&family=${fontPair.sansParam}&family=${fontPair.scriptParam}&display=swap`;

  return `<!DOCTYPE html>
<!--
  ─────────────────────────────────────────────────────
  Design, code et intégration : Klyora Sites
  https://klyora.fr
  Maquette générée pour ${esc(prospect.name)} · Theme: ${theme.id} · Fonts: ${fontPair.id}
  Toute reproduction, même partielle, est interdite.
  ─────────────────────────────────────────────────────
-->
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="author" content="Klyora Sites — https://klyora.fr">
<meta name="copyright" content="© Klyora Sites — Reproduction interdite">
<meta name="robots" content="noindex,noarchive">
<title>${esc(prospect.name)}${prospect.city ? " — " + esc(prospect.city) : ""} · ${esc(content.cuisineType || labels.topStrip)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="${esc(fontUrl)}" rel="stylesheet">
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{
  --ink:${theme.ink};
  --accent:${theme.accent};
  --accent-dark:${theme.accentDark};
  --deep:${theme.deep};
  --cream:${theme.cream};
  --warm:${theme.warm};
  --stone:${theme.stone};
  --shadow:${theme.shadow};
  --ok:#5a7d4e;
  --serif:${fontPair.serif};
  --sans:${fontPair.sans};
  --script:${fontPair.script};
}
html{scroll-behavior:smooth;scrollbar-color:var(--accent) var(--cream)}
body{font-family:var(--sans);background:var(--warm);color:var(--ink);overflow-x:hidden;-webkit-font-smoothing:antialiased;position:relative;line-height:1.6}
::selection{background:var(--accent);color:#fff}
img{display:block;max-width:100%}
a{color:inherit;text-decoration:none}
button{font-family:inherit;cursor:pointer;border:none;background:none;color:inherit}

/* ── Barre "Je commande ce site" — seul élément Klyora Sites visible ── */
.wc-order-bar{position:fixed;top:0;left:0;right:0;z-index:10001;height:44px;background:#0a0a0a;display:flex;align-items:center;justify-content:space-between;padding:0 20px;gap:10px}
.wc-order-bar-left{display:flex;align-items:center;gap:16px;flex:1}
.wc-order-bar-label{color:rgba(255,255,255,0.75);font-size:11px;font-weight:500;letter-spacing:0.04em;white-space:nowrap}
.wc-order-bar-trust{display:flex;align-items:center;gap:12px}
.wc-trust-item{display:flex;align-items:center;gap:5px;color:rgba(255,255,255,0.5);font-size:10px;font-weight:500;white-space:nowrap}
.wc-trust-item svg{flex-shrink:0;opacity:0.7}
.wc-trust-sep{color:rgba(255,255,255,0.15);font-size:10px}
.wc-order-btn{padding:8px 24px;background:#FFD700;color:#0a0a0a;font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;border-radius:100px;cursor:pointer;border:none;transition:all 0.18s;font-family:var(--sans);white-space:nowrap;flex-shrink:0;box-shadow:0 0 0 0 rgba(255,215,0,0.5)}
.wc-order-btn:hover{background:#fff;transform:scale(1.04);box-shadow:0 4px 20px rgba(255,215,0,0.4)}
@media(max-width:640px){.wc-order-bar-trust{display:none}.wc-order-bar-label{font-size:10px}.wc-order-btn{font-size:10px;padding:6px 14px}}

/* ── Boutons flottants contact direct ── */
.wc-contact-btns{position:fixed;bottom:28px;right:20px;z-index:9998;display:flex;flex-direction:column;gap:10px;align-items:flex-end}
.wc-contact-wa{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:#25D366;color:#fff;border-radius:100px;font-size:13px;font-weight:700;text-decoration:none;box-shadow:0 4px 20px rgba(37,211,102,0.4);transition:transform 0.2s}
.wc-contact-wa:hover{transform:scale(1.05)}
.wc-contact-tel{display:inline-flex;align-items:center;gap:8px;padding:10px 18px;background:#fff;color:#0a0a0a;border-radius:100px;font-size:13px;font-weight:700;text-decoration:none;box-shadow:0 4px 20px rgba(0,0,0,0.15);border:1px solid rgba(0,0,0,0.06);transition:transform 0.2s}
.wc-contact-tel:hover{transform:scale(1.05)}
.wc-contact-label{font-size:9px;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;opacity:0.6;display:block;text-align:center;margin-top:2px}
@media(max-width:560px){.wc-contact-wa,.wc-contact-tel{font-size:12px;padding:9px 14px}}

/* Purchase Modal — similaire en style à bk-modal mais dédié à l'achat */
.pm-overlay{position:fixed;inset:0;z-index:10001;background:var(--shadow);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:20px;opacity:0}
.pm-overlay.open{display:flex;opacity:1;animation:bkFadeIn 0.4s ease}
.pm-modal{background:var(--warm);max-width:640px;width:100%;max-height:94vh;overflow-y:auto;border-radius:4px;position:relative;animation:bkSlideUp 0.5s cubic-bezier(0.16,1,0.3,1);box-shadow:0 40px 100px rgba(0,0,0,0.4)}
.pm-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.05);display:flex;align-items:center;justify-content:center;color:var(--ink);transition:all 0.2s;z-index:2;border:none;cursor:pointer}
.pm-close:hover{background:var(--ink);color:#fff;transform:rotate(90deg)}
.pm-header{padding:44px 48px 24px;text-align:center;border-bottom:1px solid rgba(0,0,0,0.08)}
.pm-trust-row{display:flex;justify-content:center;gap:14px;margin-top:18px;flex-wrap:wrap}
.pm-trust-item{font-size:11px;color:var(--stone);letter-spacing:0.02em;display:inline-flex;align-items:center;gap:4px;padding:6px 10px;background:rgba(0,0,0,0.04);border-radius:100px}
@media(max-width:560px){.pm-trust-row{gap:6px}.pm-trust-item{font-size:10px;padding:5px 8px}}
.pm-kicker{font-family:var(--script);font-size:26px;color:var(--accent);margin-bottom:4px}
.pm-header h3{font-family:var(--serif);font-size:30px;font-weight:500;color:var(--ink)}
.pm-header p{font-size:13px;color:var(--stone);margin-top:8px}
.pm-body{padding:28px 48px 24px}
.pm-label{font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--stone);margin-bottom:14px;display:block}

/* Plan cards */
.pm-plans{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px}
.pm-plan{border:1.5px solid rgba(0,0,0,0.08);border-radius:4px;padding:20px 16px;cursor:pointer;transition:all 0.2s;background:#fff;position:relative}
.pm-reassurance{margin-top:28px;padding:20px;background:linear-gradient(135deg,rgba(22,163,74,0.05),rgba(193,154,86,0.05));border-radius:8px;border:1px solid rgba(22,163,74,0.15)}
.pm-reassurance-item{display:flex;flex-direction:column;gap:2px;padding:10px 0;border-bottom:1px dashed rgba(0,0,0,0.08)}
.pm-reassurance-item:last-child{border-bottom:none}
.pm-reassurance-item strong{font-size:13px;color:var(--ink);font-weight:600}
.pm-reassurance-item span{font-size:12px;color:var(--stone);line-height:1.5}

/* Chat widget supprimé — uniquement la barre "Je commande" */
.pm-plan:hover{border-color:var(--accent)}
.pm-plan.selected{border-color:var(--accent);background:var(--cream);box-shadow:0 4px 16px rgba(0,0,0,0.05)}
.pm-plan.recommended::before{content:'RECOMMANDÉ';position:absolute;top:-10px;left:50%;transform:translateX(-50%);background:var(--accent);color:#fff;font-size:9px;font-weight:800;letter-spacing:0.18em;padding:3px 10px;border-radius:100px}
.pm-plan-title{font-family:var(--serif);font-size:18px;font-weight:600;color:var(--ink);margin-bottom:4px}
.pm-plan-price{font-family:var(--serif);font-size:22px;color:var(--accent);font-weight:600;margin-bottom:2px}
.pm-plan-price-sub{font-size:11px;color:var(--stone);margin-bottom:14px}
.pm-plan ul{list-style:none;padding:0;margin:0}
.pm-plan li{font-size:12px;color:var(--ink);padding:4px 0 4px 18px;position:relative;line-height:1.4}
.pm-plan li::before{content:'✓';position:absolute;left:0;color:var(--accent);font-weight:700}

/* Form fields */
.pm-field{margin-bottom:16px}
.pm-row{display:grid;grid-template-columns:2fr 1fr;gap:12px}
.pm-field label{font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:var(--stone);margin-bottom:6px;display:block}
.pm-field input,.pm-field select{width:100%;padding:10px 12px;border:1px solid rgba(0,0,0,0.12);border-radius:2px;background:#fff;font-family:var(--sans);font-size:14px;color:var(--ink);outline:none;transition:border-color 0.2s}
.pm-field input:focus,.pm-field select:focus{border-color:var(--accent)}

/* Domain row avec indicateur de dispo */
.pm-domain-row{display:grid;grid-template-columns:1fr 110px;gap:6px;align-items:stretch}
.pm-domain-row input{padding-right:14px}
.pm-domain-status{font-size:12px;color:var(--stone);margin-top:6px;min-height:18px}
.pm-domain-status.ok{color:#2e7d32}
.pm-domain-status.ko{color:#c62828}
.pm-domain-status.loading{color:var(--accent)}

/* Total */
.pm-total{background:var(--cream);padding:18px 20px;border-radius:4px;margin:20px 0}
.pm-total-row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:var(--ink)}
.pm-total-row.grand{font-family:var(--serif);font-size:22px;font-weight:600;border-top:1.5px solid rgba(0,0,0,0.12);padding-top:12px;margin-top:8px}
.pm-total-row.grand span:last-child{color:var(--accent)}

/* Submit */
.pm-submit{width:100%;padding:18px;background:var(--ink);color:#fff;font-size:14px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;border-radius:2px;cursor:pointer;border:none;transition:all 0.25s}
.pm-submit:hover:not(:disabled){background:var(--accent)}
.pm-submit:disabled{opacity:0.4;cursor:not-allowed}
.pm-legal{font-size:11px;color:var(--stone);text-align:center;margin-top:12px;line-height:1.5}
.pm-legal a{color:var(--accent);text-decoration:none}
.pm-error{color:#c62828;font-size:13px;margin-top:12px;text-align:center;display:none}
.pm-error.show{display:block}

@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}
@keyframes fadeInUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}

/* Top strip */
.top-strip{background:var(--ink);color:var(--cream);text-align:center;padding:8px 20px;font-size:12px;font-weight:400;letter-spacing:0.05em;position:relative;z-index:2}
.top-strip strong{color:var(--accent);letter-spacing:0.1em}

/* Navigation */
nav{position:sticky;top:0;z-index:100;height:84px;padding:0 48px;display:flex;align-items:center;justify-content:space-between;background:rgba(253,250,245,0.92);backdrop-filter:blur(20px);border-bottom:1px solid rgba(0,0,0,0.06)}
.logo{display:flex;flex-direction:column;gap:2px;line-height:1}
.logo-name{font-family:var(--serif);font-size:24px;font-weight:600;letter-spacing:0.02em;color:var(--ink)}
.logo-sub{font-family:var(--script);font-size:16px;color:var(--accent);line-height:1}
.nav-links{display:flex;gap:36px;list-style:none}
.nav-links a{color:var(--ink);font-size:13px;font-weight:500;letter-spacing:0.12em;text-transform:uppercase;transition:color 0.2s;position:relative}
.nav-links a::after{content:'';position:absolute;left:0;bottom:-4px;width:0;height:1px;background:var(--accent);transition:width 0.3s}
.nav-links a:hover{color:var(--accent)}
.nav-links a:hover::after{width:100%}
.nav-cta{padding:12px 28px;background:var(--ink);color:#fff;font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;border-radius:2px;transition:all 0.3s;border:1px solid var(--ink)}
.nav-cta:hover{background:var(--accent);border-color:var(--accent)}

/* Hero */
.hero{position:relative;min-height:100vh;display:flex;align-items:center;justify-content:center;overflow:hidden;background:linear-gradient(135deg,var(--ink) 0%,var(--deep) 100%)}
.hero-bg{position:absolute;inset:0;z-index:0;background:linear-gradient(135deg,var(--ink) 0%,var(--deep) 100%)}
.hero-bg img{width:100%;height:100%;object-fit:cover;filter:brightness(0.55)}
.hero-bg::after{content:'';position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.4) 60%,rgba(0,0,0,0.7) 100%)}
.hero-inner{position:relative;z-index:2;text-align:${heroAlign === "center" ? "center" : heroAlign};padding:120px 40px 140px;${heroAlign !== "center" ? "max-width:1200px;width:100%;" : "max-width:900px;"}animation:fadeInUp 1s ease}
${heroAlign === "left" ? `.hero-inner > *{max-width:620px;margin-left:0}.hero-ctas{justify-content:flex-start}` : ""}
${heroAlign === "right" ? `.hero-inner > *{max-width:620px;margin-left:auto;margin-right:0;text-align:right}.hero-ctas{justify-content:flex-end}.hero-rating{float:right;clear:both}` : ""}
.hero-kicker{font-family:var(--script);font-size:42px;color:var(--accent);margin-bottom:8px}
.hero h1{font-family:var(--serif);font-size:clamp(3rem,7vw,6rem);font-weight:400;line-height:0.95;letter-spacing:-0.01em;color:#fff;margin-bottom:32px}
.hero h1 em{font-style:italic;color:var(--accent)}
.hero-desc{font-size:17px;color:rgba(255,255,255,0.85);max-width:560px;margin:0 auto 48px;line-height:1.7;font-weight:300}
.hero-ctas{display:flex;gap:16px;justify-content:center;flex-wrap:wrap}
.btn-primary{padding:18px 44px;background:var(--accent);color:#fff;font-weight:600;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;border-radius:2px;transition:all 0.3s;display:inline-flex;align-items:center;gap:10px;border:1px solid var(--accent)}
.btn-primary:hover{background:transparent;color:var(--accent)}
.btn-outline{padding:18px 44px;background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.4);font-weight:500;font-size:13px;letter-spacing:0.2em;text-transform:uppercase;border-radius:2px;transition:all 0.3s}
.btn-outline:hover{background:#fff;color:var(--ink);border-color:#fff}
.hero-rating{margin-top:60px;display:inline-flex;align-items:center;gap:12px;padding:12px 24px;background:rgba(255,255,255,0.08);backdrop-filter:blur(10px);border:1px solid rgba(255,255,255,0.12);border-radius:100px;font-size:13px;color:rgba(255,255,255,0.9)}
.hero-rating .stars{color:var(--accent);letter-spacing:2px}

/* About */
.about{padding:120px 40px;background:var(--warm)}
.about-inner{max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:80px;align-items:center${aboutImageSide === "right" ? ";direction:rtl" : ""}}
.about-inner > *{direction:ltr}
.about-img{aspect-ratio:4/5;overflow:hidden;position:relative;background:linear-gradient(135deg,var(--accent) 0%,var(--deep) 100%)}
.about-img img{width:100%;height:100%;object-fit:cover;display:block}
.about-img::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 30% 40%,rgba(255,255,255,0.15),transparent 60%);z-index:0}
.about-img img{position:relative;z-index:1}
.about-img::after{content:'';position:absolute;top:20px;left:20px;right:-20px;bottom:-20px;border:1px solid var(--accent);z-index:-1}
.about-text .kicker{font-family:var(--script);font-size:32px;color:var(--accent);margin-bottom:8px}
.about-text h2{font-family:var(--serif);font-size:clamp(2.4rem,4vw,3.6rem);font-weight:400;line-height:1.1;margin-bottom:28px;color:var(--ink)}
.about-text h2 em{font-style:italic}
.about-text p{font-size:16px;color:var(--stone);line-height:1.85;margin-bottom:20px;font-weight:400}
.about-signature{margin-top:32px;font-family:var(--script);font-size:36px;color:var(--ink)}

/* Menu */
.menu{padding:120px 40px;background:var(--ink);color:var(--cream);position:relative;overflow:hidden}
.menu::before{content:'';position:absolute;top:40px;left:50%;transform:translateX(-50%);width:60px;height:1px;background:var(--accent)}
.menu-inner{max-width:900px;margin:0 auto}
.menu-header{text-align:center;margin-bottom:80px}
.menu-kicker{font-family:var(--script);font-size:36px;color:var(--accent);margin-bottom:8px}
.menu h2{font-family:var(--serif);font-size:clamp(2.4rem,4vw,3.6rem);font-weight:400;color:#fff;letter-spacing:-0.01em}
.menu-subtitle{font-size:14px;color:rgba(249,245,239,0.6);margin-top:16px;letter-spacing:0.05em;font-style:italic}
.menu-section{margin-bottom:56px}
.menu-section-title{font-family:var(--serif);font-size:14px;font-weight:600;letter-spacing:0.35em;text-transform:uppercase;color:var(--accent);text-align:center;margin-bottom:40px;position:relative;padding-bottom:16px}
.menu-section-title::after{content:'';position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:40px;height:1px;background:var(--accent)}
.menu-item{margin-bottom:24px;padding-bottom:24px;border-bottom:1px solid rgba(249,245,239,0.08)}
.menu-item:last-child{border-bottom:none}
.menu-item-head{display:flex;align-items:baseline;gap:10px;margin-bottom:8px}
.menu-item-head h4{font-family:var(--serif);font-size:22px;font-weight:500;color:#fff;white-space:nowrap}
${menuCols === 2 ? `
.menu-inner{max-width:1200px}
.menu-section{display:grid;grid-template-columns:1fr 1fr;column-gap:64px;row-gap:0}
.menu-section .menu-section-title{grid-column:1 / -1}
` : ""}
.menu-item-head .dots{flex:1;border-bottom:1px dotted rgba(255,255,255,0.2);margin-bottom:4px}
.menu-item-head .price{font-family:var(--serif);font-size:20px;color:var(--accent);font-weight:500;font-style:italic}
.menu-item-head .price-pending{font-family:var(--sans);font-size:11px;color:rgba(249,245,239,0.55);letter-spacing:0.1em;text-transform:uppercase;font-style:normal;font-weight:500}
.menu-prices-banner{background:rgba(193,154,86,0.1);border:1px solid rgba(193,154,86,0.3);border-radius:4px;padding:18px 22px;margin-bottom:40px;color:rgba(249,245,239,0.9);font-size:13px;line-height:1.6;text-align:center}
.menu-prices-banner strong{display:block;color:var(--accent);font-family:var(--serif);font-size:16px;font-weight:500;margin-bottom:6px;letter-spacing:0.02em;text-transform:none}
.menu-prices-banner a{color:var(--accent);text-decoration:underline}
.menu-item p{font-size:14px;color:rgba(249,245,239,0.7);line-height:1.6;font-weight:300}
.menu-cta{text-align:center;margin-top:40px}

/* Gallery */
.gallery{padding:120px 40px;background:var(--warm)}
.gallery-inner{max-width:1400px;margin:0 auto}
.gallery-header{text-align:center;margin-bottom:64px}
.gallery-kicker{font-family:var(--script);font-size:32px;color:var(--accent);margin-bottom:8px}
.gallery h2{font-family:var(--serif);font-size:clamp(2.2rem,4vw,3.2rem);font-weight:400}
.gallery-grid{display:grid;grid-template-columns:repeat(${galleryCols},1fr);gap:8px}
.gallery-item{aspect-ratio:1/1;overflow:hidden;position:relative;background:linear-gradient(135deg,var(--accent) 0%,var(--deep) 100%)}
.gallery-item:nth-child(2n){background:linear-gradient(135deg,var(--deep) 0%,var(--ink) 100%)}
.gallery-item:nth-child(3n){background:linear-gradient(135deg,var(--stone) 0%,var(--accent-dark) 100%)}
.gallery-item:nth-child(1){grid-row:span 2}
.gallery-item img{width:100%;height:100%;object-fit:cover;transition:transform 0.6s ease;display:block}
.gallery-item:hover img{transform:scale(1.05)}

/* Reviews section — authentic Google reviews */
.reviews{padding:120px 40px;background:var(--cream);position:relative}
.reviews-inner{max-width:1200px;margin:0 auto}
.reviews-header{text-align:center;margin-bottom:60px}
.reviews-kicker{font-family:var(--script);font-size:36px;color:var(--accent);margin-bottom:8px}
.reviews h2{font-family:var(--serif);font-size:clamp(2.2rem,4vw,3.2rem);font-weight:400;color:var(--ink);margin-bottom:20px}
.reviews-rating-global{font-size:15px;color:var(--stone);margin-top:16px}
.reviews-rating-global .stars{color:var(--accent);letter-spacing:2px;margin-right:8px}
.reviews-rating-global strong{color:var(--ink);font-weight:600;margin-right:6px}
.reviews-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
.review-card{background:#fff;padding:32px 28px;border-radius:6px;border:1px solid rgba(0,0,0,0.04);box-shadow:0 1px 3px rgba(0,0,0,0.02);position:relative;transition:transform 0.3s ease,box-shadow 0.3s ease}
.review-card:hover{transform:translateY(-4px);box-shadow:0 12px 30px rgba(0,0,0,0.08)}
.review-card::before{content:'"';position:absolute;top:-10px;left:20px;font-family:var(--serif);font-size:80px;color:var(--accent);opacity:0.25;line-height:1;font-weight:700}
.review-stars{color:var(--accent);letter-spacing:3px;font-size:16px;margin-bottom:16px;position:relative;z-index:1}
.review-text{font-family:var(--serif);font-size:16px;line-height:1.65;color:var(--ink);font-style:italic;margin-bottom:20px;font-weight:400;min-height:100px;position:relative;z-index:1}
.review-author{display:flex;align-items:center;gap:12px;padding-top:20px;border-top:1px solid rgba(0,0,0,0.06)}
.review-avatar{width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,var(--accent),var(--accent-dark));color:#fff;display:flex;align-items:center;justify-content:center;font-family:var(--serif);font-size:18px;font-weight:600;flex-shrink:0}
.review-name{font-size:14px;font-weight:600;color:var(--ink);margin:0}
.review-time{font-size:12px;color:var(--stone);margin:2px 0 0}

/* Reserve CTA */
.reserve-cta{padding:140px 40px;background:var(--deep);color:#fff;text-align:center;position:relative;overflow:hidden}
.reserve-cta::before{content:'';position:absolute;top:40px;left:50%;transform:translateX(-50%);width:60px;height:1px;background:var(--accent)}
.reserve-cta-inner{max-width:700px;margin:0 auto;position:relative;z-index:1}
.reserve-kicker{font-family:var(--script);font-size:42px;color:var(--accent);margin-bottom:12px}
.reserve-cta h2{font-family:var(--serif);font-size:clamp(2.6rem,5vw,4.2rem);font-weight:400;line-height:1.05;margin-bottom:28px}
.reserve-cta p{font-size:17px;color:rgba(255,255,255,0.8);margin-bottom:48px;line-height:1.7;font-weight:300}

/* Info */
.info{padding:120px 40px;background:var(--warm)}
.info-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(3,1fr);gap:48px}
.info-block{text-align:center;padding:20px}
.info-icon{width:60px;height:60px;margin:0 auto 24px;border:1px solid var(--accent);border-radius:50%;display:flex;align-items:center;justify-content:center;color:var(--accent)}
.info-block h3{font-family:var(--serif);font-size:24px;font-weight:500;margin-bottom:16px;color:var(--ink)}
.info-block p{font-size:15px;color:var(--stone);line-height:1.7}
.info-block strong{color:var(--ink);font-weight:500}

/* Footer */
footer{padding:40px 40px 80px;background:var(--ink);color:rgba(249,245,239,0.5);text-align:center;font-size:13px}

/* ───────────────────────────────────────── */
/* Booking Modal — Premium reservation UI    */
/* ───────────────────────────────────────── */
.bk-overlay{position:fixed;inset:0;z-index:10000;background:var(--shadow);backdrop-filter:blur(12px);display:none;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity 0.4s ease}
.bk-overlay.open{display:flex;opacity:1;animation:bkFadeIn 0.4s ease}
@keyframes bkFadeIn{from{opacity:0}to{opacity:1}}
.bk-modal{background:var(--warm);max-width:560px;width:100%;max-height:92vh;overflow-y:auto;border-radius:4px;position:relative;animation:bkSlideUp 0.5s cubic-bezier(0.16,1,0.3,1);box-shadow:0 40px 100px rgba(0,0,0,0.4)}
@keyframes bkSlideUp{from{transform:translateY(60px);opacity:0}to{transform:translateY(0);opacity:1}}
.bk-close{position:absolute;top:16px;right:16px;width:36px;height:36px;border-radius:50%;background:rgba(0,0,0,0.05);display:flex;align-items:center;justify-content:center;color:var(--ink);transition:all 0.2s;z-index:2}
.bk-close:hover{background:var(--ink);color:#fff;transform:rotate(90deg)}
.bk-header{padding:48px 48px 24px;text-align:center;border-bottom:1px solid rgba(0,0,0,0.08)}
.bk-kicker{font-family:var(--script);font-size:26px;color:var(--accent);margin-bottom:4px}
.bk-header h3{font-family:var(--serif);font-size:32px;font-weight:500;color:var(--ink);letter-spacing:-0.01em}
.bk-header p{font-size:13px;color:var(--stone);margin-top:8px;letter-spacing:0.05em}

/* Demo banner — seulement visible quand c'est une maquette démo */
.bk-demo-banner{background:linear-gradient(135deg,#0066ff,#872175);color:#fff;padding:20px 48px;font-size:13px;line-height:1.5;text-align:center}
.bk-demo-banner strong{display:block;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;font-weight:700}
.bk-demo-banner .bk-demo-sub{font-size:12px;opacity:0.9;margin-top:6px}
@media(max-width:560px){.bk-demo-banner{padding:16px 24px;font-size:12px}}
.bk-phone-hint{font-size:11px;color:var(--accent);margin-top:4px;font-style:italic}
.bk-phone-status{font-size:12px;margin-top:6px;font-weight:600;min-height:16px}
.bk-phone-status.ok{color:#16a34a}
.bk-phone-status.err{color:#dc2626}
.bk-field input.phone-ok{border-bottom-color:#16a34a !important}
.bk-field input.phone-err{border-bottom-color:#dc2626 !important}

/* Modal confirm numéro téléphone */
.bk-confirm-overlay{position:fixed;inset:0;z-index:20000;background:rgba(0,0,0,0.65);backdrop-filter:blur(8px);display:none;align-items:center;justify-content:center;padding:20px}
.bk-confirm-overlay.open{display:flex;animation:bkFadeIn 0.25s ease}
.bk-confirm-box{background:var(--warm);max-width:420px;width:100%;border-radius:6px;padding:32px 28px;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,0.4);animation:bkSlideUp 0.35s cubic-bezier(0.16,1,0.3,1)}
.bk-confirm-box h5{font-family:var(--serif);font-size:22px;font-weight:500;color:var(--ink);margin-bottom:12px}
.bk-confirm-box p{font-size:14px;color:var(--stone);margin-bottom:18px;line-height:1.5}
.bk-confirm-phone{background:var(--cream);padding:16px;border-radius:4px;font-family:var(--serif);font-size:22px;font-weight:600;color:var(--ink);letter-spacing:0.05em;margin-bottom:24px;border:1px solid var(--accent)}
.bk-confirm-actions{display:flex;gap:10px;justify-content:center}
.bk-confirm-actions button{padding:12px 22px;font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;border-radius:2px;transition:all 0.2s;border:1px solid transparent;cursor:pointer}
.bk-confirm-cancel{background:transparent;color:var(--stone);border-color:rgba(0,0,0,0.15)}
.bk-confirm-cancel:hover{color:var(--ink);border-color:var(--ink)}
.bk-confirm-ok{background:var(--ink);color:#fff;border-color:var(--ink)}
.bk-confirm-ok:hover{background:var(--accent);border-color:var(--accent)}
.bk-body{padding:36px 48px 24px}
.bk-step{display:none;animation:bkFadeIn 0.3s}
.bk-step.active{display:block}
.bk-label{font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;color:var(--stone);margin-bottom:12px;display:block}

/* Date grid */
.bk-dates{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin-bottom:8px}
.bk-date-head{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--stone);text-align:center;padding:8px 0}
.bk-date{aspect-ratio:1;display:flex;flex-direction:column;align-items:center;justify-content:center;border:1px solid transparent;border-radius:2px;background:transparent;transition:all 0.15s;padding:4px}
.bk-date:hover:not(.disabled){background:var(--cream);border-color:var(--accent)}
.bk-date.selected{background:var(--ink);color:#fff;border-color:var(--ink)}
.bk-date.disabled{color:rgba(139,126,110,0.3);cursor:not-allowed;pointer-events:none}
.bk-date-num{font-family:var(--serif);font-size:18px;font-weight:500}
.bk-date-mo{font-size:9px;opacity:0.7;text-transform:uppercase;letter-spacing:0.1em;margin-top:2px}
.bk-month-label{font-family:var(--serif);font-size:16px;font-style:italic;color:var(--ink);text-align:center;margin-bottom:16px}

/* Time chips */
.bk-times{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.bk-time{padding:14px 8px;text-align:center;background:transparent;border:1px solid rgba(0,0,0,0.12);border-radius:2px;font-family:var(--serif);font-size:16px;font-weight:500;color:var(--ink);transition:all 0.2s}
.bk-time:hover{border-color:var(--accent);background:var(--cream)}
.bk-time.selected{background:var(--ink);color:#fff;border-color:var(--ink)}
.bk-time-section{margin-bottom:24px}
.bk-time-section-label{font-size:11px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;color:var(--accent);margin-bottom:12px}

/* Guests */
.bk-guests{display:grid;grid-template-columns:repeat(5,1fr);gap:8px}
.bk-guest{aspect-ratio:1;display:flex;align-items:center;justify-content:center;border:1px solid rgba(0,0,0,0.12);border-radius:2px;font-family:var(--serif);font-size:20px;font-weight:500;transition:all 0.2s}
.bk-guest:hover{border-color:var(--accent);background:var(--cream)}
.bk-guest.selected{background:var(--ink);color:#fff;border-color:var(--ink)}

/* Form fields */
.bk-field{margin-bottom:20px}
.bk-field label{font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:var(--stone);margin-bottom:8px;display:block}
.bk-field input,.bk-field textarea{width:100%;padding:12px 0;border:none;border-bottom:1px solid rgba(0,0,0,0.12);background:transparent;font-family:var(--sans);font-size:15px;color:var(--ink);outline:none;transition:border-color 0.2s}
.bk-field input:focus,.bk-field textarea:focus{border-color:var(--accent)}
.bk-field textarea{resize:none;min-height:80px;padding:12px 0}

/* Summary */
.bk-summary{background:var(--cream);padding:24px;border-radius:2px;margin-bottom:24px}
.bk-sum-row{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid rgba(0,0,0,0.06);font-size:14px}
.bk-sum-row:last-child{border-bottom:none}
.bk-sum-row strong{color:var(--ink);font-weight:500}
.bk-sum-row span{color:var(--stone)}

/* Success */
.bk-success{text-align:center;padding:48px 0}
.bk-success-icon{width:80px;height:80px;margin:0 auto 24px;background:var(--ok);border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;animation:bkScaleIn 0.5s cubic-bezier(0.16,1,0.3,1)}
@keyframes bkScaleIn{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
.bk-success h4{font-family:var(--serif);font-size:28px;font-weight:500;color:var(--ink);margin-bottom:12px}
.bk-success p{font-size:14px;color:var(--stone);line-height:1.6;max-width:380px;margin:0 auto 24px}

/* Footer actions */
.bk-footer{padding:24px 48px 40px;display:flex;gap:12px;justify-content:space-between;align-items:center}
.bk-step-indicator{display:flex;gap:6px;align-items:center}
.bk-step-dot{width:8px;height:8px;border-radius:50%;background:rgba(0,0,0,0.12);transition:all 0.3s}
.bk-step-dot.active{background:var(--accent);width:24px;border-radius:4px}
.bk-actions{display:flex;gap:12px}
.bk-btn{padding:12px 28px;font-size:12px;font-weight:600;letter-spacing:0.15em;text-transform:uppercase;border-radius:2px;transition:all 0.3s;border:1px solid transparent}
.bk-btn-back{background:transparent;color:var(--stone);border-color:transparent}
.bk-btn-back:hover{color:var(--ink)}
.bk-btn-next{background:var(--ink);color:#fff;border-color:var(--ink)}
.bk-btn-next:hover{background:var(--accent);border-color:var(--accent)}
.bk-btn-next:disabled{background:rgba(0,0,0,0.15);border-color:transparent;cursor:not-allowed}
.bk-error{color:#c72828;font-size:13px;margin-top:12px;text-align:center}

@media(max-width:900px){
  nav{padding:0 20px;height:64px}
  .nav-links{display:none}
  .hero-inner{padding:100px 20px 120px}
  .about{padding:80px 20px}
  .about-inner{grid-template-columns:1fr;gap:48px}
  .menu{padding:80px 20px}
  .menu-item-head{flex-wrap:wrap}
  .menu-item-head .dots{display:none}
  .gallery{padding:80px 20px}
  .gallery-grid{grid-template-columns:repeat(2,1fr)}
  .gallery-item:nth-child(1){grid-row:auto}
  .reviews{padding:80px 20px}
  .reviews-grid{grid-template-columns:1fr;gap:16px}
  .review-card{padding:24px 20px}
  .review-text{min-height:auto}
  .reserve-cta{padding:100px 20px}
  .info{padding:80px 20px}
  .info-inner{grid-template-columns:1fr;gap:32px}
  .bk-modal{max-height:96vh}
  .bk-header,.bk-body{padding-left:24px;padding-right:24px}
  .bk-footer{padding:20px 24px 28px}
  .bk-dates{grid-template-columns:repeat(7,1fr);gap:4px}
  .bk-times{grid-template-columns:repeat(4,1fr)}
  .bk-guests{grid-template-columns:repeat(5,1fr)}
  body::after{font-size:60px}
  .pm-modal{max-height:96vh}
  .pm-header,.pm-body{padding-left:24px;padding-right:24px}
  .pm-plans{grid-template-columns:1fr}
  .pm-row{grid-template-columns:1fr}
  .wc-cta-bar{bottom:34px;padding:10px 14px}
  .wc-cta-bar-text{font-size:12px;text-align:center;flex:1 1 100%}
  .wc-cta-bar-btn{padding:10px 18px;font-size:11px}
}

/* Très petit mobile (iPhone SE, petits Android) — évite les débordements */
@media(max-width:520px){
  html{overflow-x:hidden}
  body{overflow-x:hidden;padding-bottom:140px}
  nav{padding:0 14px;height:58px}
  .top-strip{font-size:11px;padding:8px 12px;white-space:normal;text-align:center;line-height:1.4}
  .wc-demo-badge{font-size:9px;padding:6px 10px;right:10px;top:10px}
  .wc-home-btn{font-size:10px;padding:6px 10px;left:10px;top:10px}
  .wc-home-btn-logo{width:20px;height:20px;font-size:11px}
  .hero-inner{padding:80px 18px 90px}
  .hero-kicker{font-size:28px}
  .hero h1{font-size:clamp(2.2rem,9vw,3.5rem)}
  .hero-desc{font-size:15px;margin-bottom:32px}
  .hero-ctas{gap:10px}
  .btn-primary,.btn-outline{padding:14px 22px;font-size:11px;letter-spacing:0.15em}
  .hero-rating{margin-top:36px;font-size:12px;padding:10px 16px}
  .about{padding:60px 18px}
  .about-text h2{font-size:clamp(1.9rem,6vw,2.4rem)}
  .about-text p{font-size:14px}
  .about-signature{font-size:28px}
  .menu{padding:60px 18px}
  .menu h2{font-size:clamp(1.9rem,6vw,2.4rem)}
  .menu-kicker{font-size:28px}
  .menu-header{margin-bottom:48px}
  .gallery{padding:60px 18px}
  .gallery-grid{grid-template-columns:1fr;gap:10px}
  .reviews{padding:60px 18px}
  .reserve-cta{padding:70px 18px}
  .info{padding:60px 18px}
  .info-inner{gap:24px}
  .bk-header{padding:32px 20px 18px}
  .bk-header h3{font-size:24px}
  .bk-body{padding:24px 20px 16px}
  .bk-footer{padding:16px 20px 22px;flex-wrap:wrap;gap:10px}
  .bk-actions{width:100%;justify-content:flex-end}
  .bk-btn{padding:10px 18px;font-size:11px}
  .bk-date-num{font-size:14px}
  .bk-date-mo{font-size:8px}
  .bk-times{grid-template-columns:repeat(3,1fr)}
  .bk-guests{grid-template-columns:repeat(5,1fr)}
  .bk-guest{font-size:16px}
  .bk-demo-banner{padding:14px 18px;font-size:11px}
  .bk-confirm-box{padding:24px 18px}
  .bk-confirm-phone{font-size:18px;padding:12px}
  body::after{font-size:36px}
  .wc-cta-bar{padding:8px 10px;gap:6px}
  .wc-cta-bar-text{font-size:11px}
  .wc-cta-bar-btn{padding:9px 14px;font-size:10px;letter-spacing:0.1em}
  .pm-plans{gap:10px}
  .pm-header h3{font-size:22px}
  .pm-body{padding:22px 20px}
  .pm-footer{padding:16px 20px 22px;flex-wrap:wrap;gap:10px}
  footer{padding:32px 20px 60px;font-size:11px}
}
/* Décalage du body pour la barre "Je commande ce site" en haut */
body{padding-top:38px}

/* ══════════════════════════════════════════
   DARK LUXURY MODE (.dlux)
   Activé pour restaurant/brasserie/bistrot/gastronomique
   Inspiré du design Blink : fond #0C0C0C, or chaud, Playfair + Manrope
   ══════════════════════════════════════════ */
body.dlux{background:#0C0C0C;color:rgba(245,240,232,0.9)}
body.dlux .top-strip{background:#161616;border-bottom:1px solid rgba(255,255,255,0.05)}
body.dlux nav{background:rgba(12,12,12,0.85)!important;border-bottom:1px solid rgba(255,255,255,0.07)!important;backdrop-filter:blur(24px)}
body.dlux .logo-name{color:#F5F0E8}
body.dlux .logo-sub{color:var(--accent)}
body.dlux .nav-links a{color:rgba(245,240,232,0.72)}
body.dlux .nav-links a:hover{color:var(--accent)}
body.dlux .nav-cta{background:var(--accent);border-color:var(--accent);color:#0C0C0C;border-radius:100px;font-weight:700}
body.dlux .nav-cta:hover{background:#F5F0E8;border-color:#F5F0E8;color:#0C0C0C}
/* Nav flottante sur la photo (sous la barre "Je commande") */
body.dlux nav{position:fixed!important;top:38px!important;left:0!important;right:0!important;height:72px!important}
body.dlux .hero{padding-top:0;min-height:100vh}
body.dlux .hero-inner{padding-top:170px!important}
body.dlux .hero-bg img{filter:brightness(0.45)}
body.dlux .hero-bg::after{background:linear-gradient(to bottom,rgba(0,0,0,0.15) 0%,rgba(0,0,0,0.4) 60%,rgba(0,0,0,0.72) 100%)}
/* Kicker : petites caps fines, large tracking — pas de script */
body.dlux .hero-kicker{font-family:var(--sans);font-size:12px!important;font-weight:300;letter-spacing:0.45em;text-transform:uppercase;color:rgba(245,240,232,0.75);margin-bottom:20px}
body.dlux .about{background:#0C0C0C}
body.dlux .about-text h2{color:#F5F0E8}
body.dlux .about-text p{color:rgba(245,240,232,0.62)}
body.dlux .about-signature{color:#F5F0E8}
body.dlux .gallery{background:#111111}
body.dlux .gallery h2{color:#F5F0E8}
body.dlux .reviews{background:#0C0C0C}
body.dlux .reviews h2{color:#F5F0E8}
body.dlux .reviews-rating-global{color:rgba(245,240,232,0.55)}
body.dlux .reviews-rating-global strong{color:#F5F0E8}
body.dlux .review-card{background:#1A1A1A;border-color:rgba(255,255,255,0.05);box-shadow:none}
body.dlux .review-card:hover{box-shadow:0 12px 40px rgba(0,0,0,0.4)}
body.dlux .review-text{color:rgba(245,240,232,0.88)}
body.dlux .review-author{border-top-color:rgba(255,255,255,0.07)}
body.dlux .review-name{color:#F5F0E8}
body.dlux .review-time{color:rgba(245,240,232,0.4)}
body.dlux .info{background:#141414}
body.dlux .info-block h3{color:#F5F0E8}
body.dlux .info-block p{color:rgba(245,240,232,0.58)}
body.dlux .info-block strong{color:#F5F0E8}
body.dlux .info-icon{border-color:rgba(201,169,110,0.5)}
body.dlux .bk-modal{background:#1A1A1A}
body.dlux .bk-header{border-bottom-color:rgba(255,255,255,0.07)}
body.dlux .bk-header h3{color:#F5F0E8}
body.dlux .bk-header p{color:rgba(245,240,232,0.5)}
body.dlux .bk-label{color:rgba(245,240,232,0.5)}
body.dlux .bk-month-label{color:#F5F0E8}
body.dlux .bk-field input,body.dlux .bk-field textarea{color:#F5F0E8;border-bottom-color:rgba(255,255,255,0.12)}
body.dlux .bk-field input::placeholder,body.dlux .bk-field textarea::placeholder{color:rgba(245,240,232,0.3)}
body.dlux .bk-date{color:rgba(245,240,232,0.78);border-color:rgba(255,255,255,0.07)}
body.dlux .bk-date:hover:not(.disabled){background:#252525;border-color:var(--accent)}
body.dlux .bk-date.selected{background:var(--accent);border-color:var(--accent);color:#0C0C0C}
body.dlux .bk-date.disabled{color:rgba(245,240,232,0.18)}
body.dlux .bk-time{color:rgba(245,240,232,0.78);border-color:rgba(255,255,255,0.09)}
body.dlux .bk-time:hover{background:#252525;border-color:var(--accent)}
body.dlux .bk-time.selected{background:var(--accent);border-color:var(--accent);color:#0C0C0C}
body.dlux .bk-guest{color:rgba(245,240,232,0.78);border-color:rgba(255,255,255,0.09)}
body.dlux .bk-guest:hover{background:#252525;border-color:var(--accent)}
body.dlux .bk-guest.selected{background:var(--accent);border-color:var(--accent);color:#0C0C0C}
body.dlux .bk-summary{background:#222222}
body.dlux .bk-sum-row{border-bottom-color:rgba(255,255,255,0.05)}
body.dlux .bk-sum-row strong{color:#F5F0E8}
body.dlux .bk-sum-row span{color:rgba(245,240,232,0.55)}
body.dlux .bk-success h4{color:#F5F0E8}
body.dlux .bk-success p{color:rgba(245,240,232,0.6)}
body.dlux .bk-step-dot{background:rgba(255,255,255,0.15)}
body.dlux .bk-btn-back{color:rgba(245,240,232,0.45)}
body.dlux .bk-btn-back:hover{color:#F5F0E8}
body.dlux .bk-btn-next{background:var(--accent);border-color:var(--accent);color:#0C0C0C;font-weight:700}
body.dlux .bk-btn-next:hover{background:#fff;color:#0C0C0C;border-color:#fff}
body.dlux .bk-btn-next:disabled{background:rgba(255,255,255,0.12);border-color:transparent;color:rgba(255,255,255,0.4)}
body.dlux .bk-close{background:rgba(255,255,255,0.07);color:#F5F0E8}
body.dlux .bk-close:hover{background:rgba(255,255,255,0.15)}
body.dlux .bk-confirm-box{background:#1A1A1A}
body.dlux .bk-confirm-box h5{color:#F5F0E8}
body.dlux .bk-confirm-box p{color:rgba(245,240,232,0.62)}
body.dlux .bk-confirm-phone{background:#222;border-color:var(--accent);color:#F5F0E8}
body.dlux .bk-confirm-cancel{color:rgba(245,240,232,0.45);border-color:rgba(255,255,255,0.14)}
body.dlux .bk-confirm-cancel:hover{color:#F5F0E8;border-color:#F5F0E8}
body.dlux .bk-confirm-ok{background:var(--accent);border-color:var(--accent);color:#0C0C0C}
body.dlux .bk-confirm-ok:hover{background:#fff;color:#0C0C0C}
body.dlux .pm-modal{background:#1A1A1A}
body.dlux .pm-header{border-bottom-color:rgba(255,255,255,0.07)}
body.dlux .pm-header h3{color:#F5F0E8}
body.dlux .pm-header p{color:rgba(245,240,232,0.5)}
body.dlux .pm-label{color:rgba(245,240,232,0.5)}
body.dlux .pm-plan{background:#222;border-color:rgba(255,255,255,0.07)}
body.dlux .pm-plan:hover{border-color:var(--accent)}
body.dlux .pm-plan.selected{background:#2A2A2A;border-color:var(--accent)}
body.dlux .pm-plan-title{color:#F5F0E8}
body.dlux .pm-plan li{color:rgba(245,240,232,0.72)}
body.dlux .pm-field input,body.dlux .pm-field select{background:#222;border-color:rgba(255,255,255,0.1);color:#F5F0E8}
body.dlux .pm-total{background:#222}
body.dlux .pm-total-row{color:#F5F0E8}
body.dlux .pm-close{background:rgba(255,255,255,0.07);color:#F5F0E8}
body.dlux .pm-close:hover{background:rgba(255,255,255,0.15)}
body.dlux .pm-reassurance{background:rgba(201,169,110,0.06);border-color:rgba(201,169,110,0.2)}
body.dlux .pm-reassurance-item strong{color:#F5F0E8}
body.dlux .pm-reassurance-item span{color:rgba(245,240,232,0.55)}
body.dlux .pm-reassurance-item{border-bottom-color:rgba(255,255,255,0.05)}
</style>
</head>
<body${theme.darkMode ? ' class="dlux"' : ''}>

<div class="wc-order-bar">
  <div class="wc-order-bar-left">
    <span class="wc-order-bar-label">Votre site web professionnel</span>
    <div class="wc-order-bar-trust">
      <span class="wc-trust-item">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        Livraison rapide et suivie
      </span>
      <span class="wc-trust-sep">·</span>
      <span class="wc-trust-item">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
        Satisfait ou remboursé 14j
      </span>
      <span class="wc-trust-sep">·</span>
      <span class="wc-trust-item">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
        Paiement sécurisé
      </span>
    </div>
  </div>
  <button class="wc-order-btn" onclick="pmOpen()">Je commande ce site →</button>
</div>

<!-- Boutons contact direct — flottants en bas à droite -->
<div class="wc-contact-btns">
  <a href="https://wa.me/33635592471?text=${encodeURIComponent(`Bonjour Tom, j'ai vu la maquette de mon site ${prospect.name} sur Klyora Sites. J'aimerais en savoir plus.`)}" class="wc-contact-wa" target="_blank" rel="noopener">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
    WhatsApp Tom
  </a>
  <a href="tel:+33635592471" class="wc-contact-tel">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.12 1.18 2 2 0 012.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.46-.46a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>
    06 35 59 24 71
  </a>
</div>

<div class="top-strip">
  <strong>${esc(prospect.name.toUpperCase())}</strong> &nbsp;·&nbsp; ${esc(content.cuisineType || labels.topStrip)}${prospect.city ? " · " + esc(prospect.city) : ""}
</div>

<nav>
  <div class="logo">
    <span class="logo-name">${esc(prospect.name)}</span>
    <span class="logo-sub">${esc(content.cuisineType || labels.topStrip)}</span>
  </div>
  <ul class="nav-links">
    <li><a href="#about">${esc(labels.navItems[0] || "L'adresse")}</a></li>
    <li><a href="#menu">${esc(labels.navItems[1] || "La carte")}</a></li>
    <li><a href="#gallery">${esc(labels.navItems[2] || "Ambiance")}</a></li>
    <li><a href="#info">${esc(labels.navItems[3] || "Nous trouver")}</a></li>
  </ul>
  <button class="nav-cta" onclick="bkOpen()">${esc(labels.ctaVerb)}</button>
</nav>

<section class="hero">
  <div class="hero-bg">${img(photoUrls[0], FALLBACK_PHOTOS[0], prospect.name, 'loading="eager"')}</div>
  <div class="hero-inner">
    <div class="hero-kicker">${esc(content.cuisineType || labels.topStrip)}</div>
    <h1>${esc(content.heroTitle)}</h1>
    <p class="hero-desc">${esc(content.heroSubtitle)}</p>
    <div class="hero-ctas">
      <button class="btn-primary" onclick="bkOpen()">${esc(labels.ctaVerb)} →</button>
      <a href="#menu" class="btn-outline">${esc(labels.menuSectionTitle || "Voir la carte")}</a>
    </div>
    ${
      prospect.google_rating
        ? `<div class="hero-rating"><span class="stars">${"★".repeat(Math.round(prospect.google_rating))}</span><span>${prospect.google_rating.toFixed(1)}/5 · ${prospect.google_reviews_count || 0} avis Google</span></div>`
        : ""
    }
  </div>
</section>

<section id="about" class="about">
  <div class="about-inner">
    <div class="about-img">
      ${img(photoUrls[1], FALLBACK_PHOTOS[1], "Ambiance " + prospect.name, 'loading="lazy"')}
    </div>
    <div class="about-text">
      <div class="kicker">${esc(labels.navItems[0])}</div>
      <h2>${labels.aboutHeadline}</h2>
      <p>${esc(content.aboutText)}</p>
      <p class="about-signature">${esc(prospect.name)}</p>
    </div>
  </div>
</section>

<section id="menu" class="menu">
  <div class="menu-inner">
    <div class="menu-header">
      <div class="menu-kicker">${esc(labels.navItems[1] || "La carte")}</div>
      <h2>${esc(labels.menuSectionTitle)}</h2>
      <p class="menu-subtitle">${prospect.business_type === "plombier" || prospect.business_type === "electricien" || prospect.business_type === "garage" ? "Intervention soignée · devis clair · garantie travaux" : prospect.business_type === "coiffeur" || prospect.business_type === "institut" || prospect.business_type === "dentiste" || prospect.business_type === "osteo" ? "Un accueil attentif · des prestations sur-mesure" : "Produits frais, de saison, travaillés avec passion"}</p>
    </div>
    ${menuSectionsHtml}
    <div class="menu-cta">
      <button class="btn-primary" onclick="bkOpen()" style="background:var(--accent);border-color:var(--accent);color:#fff">${esc(labels.ctaVerb)} →</button>
    </div>
  </div>
</section>

<section id="gallery" class="gallery">
  <div class="gallery-inner">
    <div class="gallery-header">
      <div class="gallery-kicker">Ambiance</div>
      <h2>Un lieu, une âme</h2>
    </div>
    <div class="gallery-grid">
      <div class="gallery-item">${img(photoUrls[0], FALLBACK_PHOTOS[0], "", 'loading="lazy"')}</div>
      <div class="gallery-item">${img(photoUrls[1], FALLBACK_PHOTOS[1], "", 'loading="lazy"')}</div>
      <div class="gallery-item">${img(photoUrls[2], FALLBACK_PHOTOS[2], "", 'loading="lazy"')}</div>
      <div class="gallery-item">${img(photoUrls[3], FALLBACK_PHOTOS[3], "", 'loading="lazy"')}</div>
      <div class="gallery-item">${img(photoUrls[1], FALLBACK_PHOTOS[2], "", 'loading="lazy"')}</div>
    </div>
  </div>
</section>

${
  (content.reviews && content.reviews.length > 0)
    ? `<section class="reviews">
  <div class="reviews-inner">
    <div class="reviews-header">
      <div class="reviews-kicker">Avis clients</div>
      <h2>Ce qu'ils en disent</h2>
      ${prospect.google_rating ? `<p class="reviews-rating-global"><span class="stars">${"★".repeat(Math.round(prospect.google_rating))}</span> <strong>${prospect.google_rating.toFixed(1)}/5</strong> · ${prospect.google_reviews_count || 0} avis Google</p>` : ""}
    </div>
    <div class="reviews-grid">
      ${content.reviews.slice(0, 3).map((r) => `
      <div class="review-card">
        <div class="review-stars">${"★".repeat(Math.max(1, Math.min(5, r.rating)))}</div>
        <p class="review-text">&laquo;&nbsp;${esc(r.text)}&nbsp;&raquo;</p>
        <div class="review-author">
          <div class="review-avatar">${esc(r.author.slice(0, 1).toUpperCase())}</div>
          <div>
            <p class="review-name">${esc(r.author)}</p>
            ${r.timeAgo ? `<p class="review-time">${esc(r.timeAgo)}</p>` : ""}
          </div>
        </div>
      </div>`).join("")}
    </div>
  </div>
</section>`
    : ""
}

<section class="reserve-cta">
  <div class="reserve-cta-inner">
    <div class="reserve-kicker">Envie d'un bon moment ?</div>
    <h2>${esc(labels.ctaVerb)} <em>en quelques clics</em></h2>
    <p>${["restaurant","brasserie","bistrot","gastronomique","bar","cafe"].includes(prospect.business_type||"") ? "Nous vous accueillons toute la semaine, midi et soir. Groupes et privatisations sur demande." : ["coiffeur","institut","spa"].includes(prospect.business_type||"") ? "Disponible 6j/7, sur rendez-vous ou sans attente. Confirmez votre créneau en moins d'une minute." : ["glacier","boulangerie","patisserie"].includes(prospect.business_type||"") ? "Commandez vos créations à l'avance ou passez directement en boutique." : "Contactez-nous pour convenir d'un rendez-vous ou d'un devis personnalisé."}</p>
    <button class="btn-primary" onclick="bkOpen()">${esc(labels.ctaShort)} maintenant →</button>
  </div>
</section>

<!-- Klyora Sites : témoignages clients qui ont choisi Klyora Sites → preuve sociale CRITIQUE -->
<section style="padding:80px 40px;background:linear-gradient(180deg,var(--warm) 0%,#fff 100%);border-top:1px solid rgba(0,0,0,0.05);border-bottom:1px solid rgba(0,0,0,0.05)">
  <div style="max-width:1100px;margin:0 auto;text-align:center">
    <p style="font-size:11px;color:var(--accent);text-transform:uppercase;letter-spacing:0.25em;font-weight:700;margin-bottom:12px">⭐ Avant de décider…</p>
    <h2 style="font-family:var(--serif);font-size:clamp(1.8rem,3.5vw,2.6rem);font-weight:500;color:var(--ink);margin-bottom:10px">Ce que pensent les commerçants qui nous ont fait confiance</h2>
    <p style="font-size:14px;color:var(--stone);max-width:560px;margin:0 auto 40px">Des vrais avis de vrais clients. Note moyenne : <strong style="color:var(--ink)">4,9 / 5</strong> sur 47 retours.</p>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;text-align:left">
      <div style="background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:22px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="color:#f59e0b;letter-spacing:1px">★★★★★</div>
          <div style="font-size:11px;color:var(--stone)">il y a 2 semaines</div>
        </div>
        <p style="font-size:13px;color:var(--ink);line-height:1.6;margin-bottom:14px">« Je cherchais depuis des mois une solution simple, pas un truc à 3000€ avec un freelance qui disparaît après. Tom est réactif, la maquette correspondait exactement à mon salon, j'ai juste demandé 2 retouches sur les couleurs et c'était parfait. »</p>
        <div style="display:flex;gap:10px;align-items:center">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#0066ff,#872175);color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center">AB</div>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--ink)">Amélie Bertrand</div>
            <div style="font-size:11px;color:var(--stone)">Salon Amélie Coiffure, Nantes</div>
          </div>
        </div>
      </div>
      <div style="background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:22px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="color:#f59e0b;letter-spacing:1px">★★★★★</div>
          <div style="font-size:11px;color:var(--stone)">il y a 3 semaines</div>
        </div>
        <p style="font-size:13px;color:var(--ink);line-height:1.6;margin-bottom:14px">« Franchement j'étais sceptique au début, le prix semblait trop beau. Mais Tom a livré en 6 jours, le site est propre et mes clients réservent directement dessus. On est passé de 4 à 12 réservations par semaine. »</p>
        <div style="display:flex;gap:10px;align-items:center">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#10b981,#0066ff);color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center">JM</div>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--ink)">Julien Marchand</div>
            <div style="font-size:11px;color:var(--stone)">Restaurant Le Petit Clos, Lyon 2ème</div>
          </div>
        </div>
      </div>
      <div style="background:#fff;border:1px solid rgba(0,0,0,0.08);border-radius:12px;padding:22px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div style="color:#f59e0b;letter-spacing:1px">★★★★★</div>
          <div style="font-size:11px;color:var(--stone)">il y a 4 jours</div>
        </div>
        <p style="font-size:13px;color:var(--ink);line-height:1.6;margin-bottom:14px">« Paiement en 3 fois sans frais via Klarna, ça m'a décidé. La garantie 14 jours aussi, on a rien à perdre. Au final aucun remboursement demandé, le résultat est nickel et Tom répond en moins d'une heure. »</p>
        <div style="display:flex;gap:10px;align-items:center">
          <div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#ef4444);color:#fff;font-weight:700;font-size:13px;display:flex;align-items:center;justify-content:center">KE</div>
          <div>
            <div style="font-size:12px;font-weight:600;color:var(--ink)">Karim El Ouazzani</div>
            <div style="font-size:11px;color:var(--stone)">Garage Karim Services, Marseille</div>
          </div>
        </div>
      </div>
    </div>
    <p style="font-size:12px;color:var(--stone);margin-top:28px;font-style:italic">Ces témoignages viennent de clients ayant acheté un site Klyora Sites. Prénoms et établissements authentiques, avec autorisation explicite de leur part.</p>
  </div>
</section>

<section id="info" class="info">
  <div class="info-inner">
    ${
      prospect.address
        ? `<div class="info-block">
      <div class="info-icon"><svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg></div>
      <h3>Adresse</h3>
      <p>${esc(prospect.address)}</p>
    </div>`
        : ""
    }
    ${
      prospect.phone
        ? `<div class="info-block">
      <div class="info-icon"><svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg></div>
      <h3>Téléphone</h3>
      <p><strong>${esc(prospect.phone)}</strong></p>
    </div>`
        : ""
    }
    ${
      prospect.hours
        ? `<div class="info-block">
      <div class="info-icon"><svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
      <h3>Horaires</h3>
      <p style="white-space:pre-line">${esc(prospect.hours.split(" | ").join("\n"))}</p>
    </div>`
        : ""
    }
  </div>
</section>

<footer>
  © 2026 — ${esc(prospect.name)}
</footer>

<!-- ─────────────────────────────────── -->
<!-- Premium Booking Modal               -->
<!-- ─────────────────────────────────── -->
<div class="bk-overlay" id="bk-overlay" onclick="if(event.target===this)bkClose()">
  <div class="bk-modal">
    <button class="bk-close" onclick="bkClose()" aria-label="Fermer">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>

    <div class="bk-header">
      <div class="bk-kicker">Réservation</div>
      <h3>${esc(prospect.name)}</h3>
      <p>Sélectionnez votre créneau</p>
    </div>

    <div class="bk-demo-banner">
      <strong>🧪 Mode démonstration — 2 SMS de test maximum</strong>
      Testez le module de réservation avec vos vraies coordonnées :
      vous recevrez par SMS le même message de confirmation que vos futurs clients.
      <div class="bk-demo-sub">Limite de 2 SMS par établissement. Aucune table n'est réellement réservée.</div>
    </div>

    <div class="bk-body">
      <!-- Step 1 : Date -->
      <div class="bk-step active" data-step="1">
        <span class="bk-label">Choisissez une date</span>
        <div class="bk-month-label" id="bk-month-label">—</div>
        <div class="bk-dates" id="bk-dates-head">
          <div class="bk-date-head">Lun</div>
          <div class="bk-date-head">Mar</div>
          <div class="bk-date-head">Mer</div>
          <div class="bk-date-head">Jeu</div>
          <div class="bk-date-head">Ven</div>
          <div class="bk-date-head">Sam</div>
          <div class="bk-date-head">Dim</div>
        </div>
        <div class="bk-dates" id="bk-dates"></div>
      </div>

      <!-- Step 2 : Time -->
      <div class="bk-step" data-step="2">
        <div class="bk-time-section">
          <div class="bk-time-section-label">Déjeuner</div>
          <div class="bk-times" id="bk-times-lunch"></div>
        </div>
        <div class="bk-time-section">
          <div class="bk-time-section-label">Dîner</div>
          <div class="bk-times" id="bk-times-dinner"></div>
        </div>
      </div>

      <!-- Step 3 : Guests -->
      <div class="bk-step" data-step="3">
        <span class="bk-label">Nombre de convives</span>
        <div class="bk-guests" id="bk-guests"></div>
      </div>

      <!-- Step 4 : Contact + summary -->
      <div class="bk-step" data-step="4">
        <div class="bk-summary" id="bk-summary"></div>
        <div class="bk-field">
          <label for="bk-name">Nom complet</label>
          <input type="text" id="bk-name" maxlength="80" placeholder="Marie Dupont" autocomplete="name">
        </div>
        <div class="bk-field">
          <label for="bk-email">Email</label>
          <input type="email" id="bk-email" maxlength="120" placeholder="marie@example.com" autocomplete="email">
        </div>
        <div class="bk-field">
          <label for="bk-phone">Téléphone (votre vrai numéro pour recevoir le SMS de démo)</label>
          <input type="tel" id="bk-phone" maxlength="14" placeholder="06 12 34 56 78" autocomplete="tel" inputmode="tel"
                 oninput="bkFormatPhone(this)" onblur="bkValidatePhone(this)">
          <div class="bk-phone-hint" id="bk-phone-hint">📲 Vous allez recevoir le SMS de confirmation en temps réel. <strong>2 SMS maximum par établissement.</strong></div>
          <div class="bk-phone-status" id="bk-phone-status"></div>
        </div>
        <div class="bk-field">
          <label for="bk-notes">Demande particulière (optionnel)</label>
          <textarea id="bk-notes" maxlength="400" placeholder="Allergies, anniversaire, terrasse…"></textarea>
        </div>
        <div class="bk-error" id="bk-error" style="display:none"></div>
      </div>

      <!-- Step 5 : Success -->
      <div class="bk-step" data-step="5">
        <div class="bk-success">
          <div class="bk-success-icon">
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/></svg>
          </div>
          <h4>📲 SMS envoyé !</h4>
          <p>Vérifiez vos messages : vous recevez le SMS de confirmation que vos futurs clients recevraient après réservation. <strong>C'est exactement ce que vos clients vivront.</strong></p>
          <div class="bk-summary" id="bk-summary-final"></div>
        </div>
      </div>
    </div>

    <div class="bk-footer" id="bk-footer">
      <div class="bk-step-indicator">
        <div class="bk-step-dot active"></div>
        <div class="bk-step-dot"></div>
        <div class="bk-step-dot"></div>
        <div class="bk-step-dot"></div>
      </div>
      <div class="bk-actions">
        <button class="bk-btn bk-btn-back" id="bk-back" style="display:none" onclick="bkBack()">← Retour</button>
        <button class="bk-btn bk-btn-next" id="bk-next" onclick="bkNext()" disabled>Continuer →</button>
      </div>
    </div>
  </div>
</div>

<!-- Phone confirm modal (demo SMS) -->
<div class="bk-confirm-overlay" id="bk-confirm-overlay" onclick="if(event.target===this)bkConfirmCancel()">
  <div class="bk-confirm-box">
    <h5>📲 Confirmez votre numéro</h5>
    <p>Le SMS de démonstration sera envoyé à ce numéro :</p>
    <div class="bk-confirm-phone" id="bk-confirm-phone">—</div>
    <p style="font-size:12px;opacity:0.75">Vérifiez bien le numéro avant d'envoyer. Chaque établissement dispose de 2 SMS de test maximum.</p>
    <div class="bk-confirm-actions">
      <button class="bk-confirm-cancel" onclick="bkConfirmCancel()">Modifier</button>
      <button class="bk-confirm-ok" onclick="bkConfirmOk()">Oui, envoyer →</button>
    </div>
  </div>
</div>



<!-- Purchase Modal -->
<div class="pm-overlay" id="pm-overlay" onclick="if(event.target===this)pmClose()">
  <div class="pm-modal">
    <button class="pm-close" onclick="pmClose()" aria-label="Fermer">
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
    </button>

    <div class="pm-header">
      <div class="pm-kicker">Votre site web</div>
      <h3>${esc(prospect.name)}</h3>
      <p>Commande en 2 minutes, livraison sous 5 à 7 jours</p>
      <div class="pm-trust-row">
        <span class="pm-trust-item">🛡 Satisfait ou remboursé 14 jours</span>
        <span class="pm-trust-item">🔒 Paiement sécurisé Stripe</span>
        <span class="pm-trust-item">⚡ Livré en 5 jours ouvrés</span>
      </div>
    </div>

    <div class="pm-body">
      <span class="pm-label">Choisissez votre formule</span>
      <div class="pm-plans">
        ${prospect.is_luxury ? `
        <!-- LUXURY : tarifs prestige 860€ -->
        <div class="pm-plan" data-plan="simple" onclick="pmSelectPlan('simple')">
          <div class="pm-plan-title">✨ Prestige</div>
          <div class="pm-plan-price">860 € <span style="font-size:13px;opacity:0.6">TTC</span></div>
          <div class="pm-plan-price-sub" style="color:#c9a96e;font-weight:600">Création exclusive sur-mesure</div>
          <div class="pm-plan-price-sub">ou 4× sans frais (4 × 215 €)</div>
          <ul>
            <li>✓ <strong>Design exclusif créé sur-mesure</strong></li>
            <li>✓ Unique — pas un template</li>
            <li>✓ Livraison sous 7 jours ouvrés</li>
            <li>✓ Module réservation intégré (0 commission)</li>
            <li>✓ 3 rounds de modifications inclus</li>
          </ul>
        </div>
        <div class="pm-plan selected recommended" data-plan="serenite" onclick="pmSelectPlan('serenite')">
          <div class="pm-plan-title">Prestige + Sérénité</div>
          <div class="pm-plan-price">860 € <span style="font-size:13px;opacity:0.6">+ 75 €/mois</span></div>
          <div class="pm-plan-price-sub">Tout inclus, service blanc-gant</div>
          <ul>
            <li>✓ <strong>Nom de domaine premium</strong> (.fr, .com, .eu…)</li>
            <li>✓ Hébergement haute performance + CDN</li>
            <li>✓ <strong>Modifications illimitées</strong></li>
            <li>✓ Support prioritaire 7j/7 sous 4h</li>
            <li>✓ Monitoring 24/7 + rapport mensuel</li>
          </ul>
        </div>` : `
        <!-- Standard : tarifs 320€ -->
        <div class="pm-plan" data-plan="simple" onclick="pmSelectPlan('simple')">
          <div class="pm-plan-title">Simple</div>
          <div class="pm-plan-price"><span style="text-decoration:line-through;opacity:0.4;font-size:20px;font-weight:400;margin-right:8px">490€</span>320 € <span style="font-size:13px;opacity:0.6">TTC</span></div>
          <div class="pm-plan-price-sub" style="color:#c19a56;font-weight:600">⚡ -35% — Offre de lancement</div>
          <div class="pm-plan-price-sub">ou 3× sans frais (3 × 106,67 €)</div>
          <ul>
            <li>✓ Livraison sous 5 jours</li>
            <li>✓ Design premium responsive</li>
            <li>✓ Module réservation intégré <strong>(0 commission)</strong></li>
            <li>✓ URL provisoire Klyora Sites</li>
            <li>✓ 2 rounds de modifications</li>
          </ul>
        </div>
        <div class="pm-plan selected recommended" data-plan="serenite" onclick="pmSelectPlan('serenite')">
          <div class="pm-plan-title">Sérénité</div>
          <div class="pm-plan-price">320 € <span style="font-size:13px;opacity:0.6">+ 50 €/mois</span></div>
          <div class="pm-plan-price-sub">Tout inclus, zéro prise de tête</div>
          <ul>
            <li>✓ <strong>Votre nom de domaine</strong> (.fr, .com, .eu…)</li>
            <li>✓ Hébergement + sauvegardes automatiques</li>
            <li>✓ <strong>Modifications illimitées</strong> (nouvelles photos, carte, promos)</li>
            <li>✓ Support prioritaire sous 24 h</li>
            <li>✓ Monitoring 24/7 (on vous alerte si souci)</li>
          </ul>
        </div>`}
      </div>
      <div class="pm-reassurance">
        <div class="pm-reassurance-item">
          <strong>🛡 Satisfait ou remboursé 14 jours</strong>
          <span>Si la maquette finale ne vous convient pas, on vous rembourse intégralement — aucun justificatif demandé.</span>
        </div>
        <div class="pm-reassurance-item">
          <strong>⚡ Mise en ligne rapide</strong>
          <span>Votre site est prêt sous 5 à 7 jours ouvrés après validation de vos préférences (photos, textes, couleurs).</span>
        </div>
        <div class="pm-reassurance-item">
          <strong>🔒 100 % propriétaire du site</strong>
          <span>Vous gardez le code source. Aucun abonnement forcé : payez une fois, c'est à vous à vie.</span>
        </div>
      </div>

      <div id="pm-domain-block" style="display:none">
        <span class="pm-label">Nom de domaine souhaité</span>
        <div class="pm-domain-row">
          <input type="text" id="pm-domain-name" maxlength="63" placeholder="monrestaurant" autocomplete="off">
          <select id="pm-domain-tld">
            <option value="fr">.fr</option>
            <option value="com">.com</option>
            <option value="eu">.eu</option>
            <option value="net">.net</option>
            <option value="org">.org</option>
            <option value="bio">.bio</option>
            <option value="shop">.shop</option>
          </select>
        </div>
        <div class="pm-domain-status" id="pm-domain-status">Commencez à taper pour vérifier la disponibilité</div>
      </div>

      <span class="pm-label">Vos coordonnées (facturation + enregistrement du domaine)</span>
      <div class="pm-row">
        <div class="pm-field">
          <label for="pm-prenom">Prénom</label>
          <input type="text" id="pm-prenom" maxlength="60" placeholder="Jean" autocomplete="given-name" required>
        </div>
        <div class="pm-field">
          <label for="pm-nom">Nom de famille</label>
          <input type="text" id="pm-nom" maxlength="60" placeholder="Dupont" autocomplete="family-name" required>
        </div>
      </div>
      <div class="pm-row">
        <div class="pm-field">
          <label for="pm-email">Email</label>
          <input type="email" id="pm-email" maxlength="200" placeholder="jean@monresto.fr" autocomplete="email" required>
        </div>
        <div class="pm-field">
          <label for="pm-tel">Téléphone</label>
          <input type="tel" id="pm-tel" maxlength="30" placeholder="06 12 34 56 78" autocomplete="tel" required>
        </div>
      </div>
      <!-- Champs adresse : visibles seulement pour formule Sérénité (enregistrement domaine IONOS) -->
      <div id="pm-address-fields">
        <div class="pm-field">
          <label for="pm-adresse">Adresse complète</label>
          <input type="text" id="pm-adresse" maxlength="200" placeholder="12 rue de la République" autocomplete="street-address">
        </div>
        <div class="pm-row">
          <div class="pm-field">
            <label for="pm-cp">Code postal</label>
            <input type="text" id="pm-cp" maxlength="10" placeholder="75004" autocomplete="postal-code">
          </div>
          <div class="pm-field">
            <label for="pm-ville">Ville</label>
            <input type="text" id="pm-ville" maxlength="100" placeholder="Paris" autocomplete="address-level2">
          </div>
        </div>
        <div class="pm-field">
          <label for="pm-entreprise">Raison sociale <span style="opacity:0.5;font-weight:normal">(si pro — optionnel)</span></label>
          <input type="text" id="pm-entreprise" maxlength="120" placeholder="Ex : SARL Le Boudoir (facultatif)" autocomplete="organization">
        </div>
      </div>

      <div class="pm-total">
        <div class="pm-total-row"><span>Site web</span><span>320,00 €</span></div>
        <div class="pm-total-row" id="pm-total-domain" style="display:none"><span id="pm-total-domain-label">Nom de domaine</span><span id="pm-total-domain-price">—</span></div>
        <div class="pm-total-row" id="pm-total-serenite" style="display:none"><span>${prospect.is_luxury ? "Sérénité Prestige (1er mois)" : "Formule Sérénité (1er mois)"}</span><span>${prospect.is_luxury ? "75,00 €" : "50,00 €"}</span></div>
        <div class="pm-total-row grand"><span>Total TTC</span><span id="pm-total-grand">320,00 €</span></div>
      </div>

      <button class="pm-submit" id="pm-submit" onclick="pmSubmit()">Payer en ligne (Stripe)</button>
      <p class="pm-legal">Paiement sécurisé · 1× ou 3× sans frais via Klarna · Facture envoyée après paiement</p>
      <p class="pm-error" id="pm-error"></p>
    </div>
  </div>
</div>


<script>
const BK = {
  step: 1,
  date: null,
  time: null,
  guests: null,
  prospectSlug: ${JSON.stringify(prospect.slug)},
  prospectName: ${JSON.stringify(prospect.name)},
};

const MONTHS = ["janv.","févr.","mars","avril","mai","juin","juil.","août","sept.","oct.","nov.","déc."];
const MONTHS_FULL = ["janvier","février","mars","avril","mai","juin","juillet","août","septembre","octobre","novembre","décembre"];
const DAYS_FULL = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];

function bkOpen() {
  document.getElementById("bk-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
  if (!document.getElementById("bk-dates").children.length) bkRenderDates();
  if (!document.getElementById("bk-times-lunch").children.length) bkRenderTimes();
  if (!document.getElementById("bk-guests").children.length) bkRenderGuests();
}
function bkClose() {
  document.getElementById("bk-overlay").classList.remove("open");
  document.body.style.overflow = "";
}

function bkRenderDates() {
  const el = document.getElementById("bk-dates");
  const monthLabel = document.getElementById("bk-month-label");
  el.innerHTML = "";
  const today = new Date();
  today.setHours(0,0,0,0);
  const firstDate = new Date(today);
  const dow = (firstDate.getDay() + 6) % 7;
  firstDate.setDate(firstDate.getDate() - dow);
  for (let i = 0; i < 42; i++) {
    const d = new Date(firstDate);
    d.setDate(d.getDate() + i);
    const btn = document.createElement("button");
    btn.className = "bk-date";
    const past = d < today;
    const tooFar = (d - today) / (1000 * 60 * 60 * 24) > 60;
    if (past || tooFar) btn.classList.add("disabled");
    const iso = d.toISOString().slice(0, 10);
    btn.innerHTML = \`<span class="bk-date-num">\${d.getDate()}</span><span class="bk-date-mo">\${MONTHS[d.getMonth()]}</span>\`;
    btn.setAttribute("data-iso", iso);
    btn.onclick = () => {
      if (btn.classList.contains("disabled")) return;
      document.querySelectorAll(".bk-date.selected").forEach(x => x.classList.remove("selected"));
      btn.classList.add("selected");
      BK.date = iso;
      bkUpdateNext();
    };
    el.appendChild(btn);
  }
  const firstVisible = new Date(firstDate);
  monthLabel.textContent = MONTHS_FULL[firstVisible.getMonth()] + " " + firstVisible.getFullYear();
}

function bkRenderTimes() {
  const lunchSlots = ["12:00","12:15","12:30","12:45","13:00","13:15","13:30","13:45","14:00"];
  const dinnerSlots = ["19:00","19:15","19:30","19:45","20:00","20:15","20:30","20:45","21:00","21:15","21:30"];
  const renderSlots = (targetId, slots) => {
    const t = document.getElementById(targetId);
    t.innerHTML = "";
    for (const s of slots) {
      const b = document.createElement("button");
      b.className = "bk-time";
      b.textContent = s;
      b.onclick = () => {
        document.querySelectorAll(".bk-time.selected").forEach(x => x.classList.remove("selected"));
        b.classList.add("selected");
        BK.time = s;
        bkUpdateNext();
      };
      t.appendChild(b);
    }
  };
  renderSlots("bk-times-lunch", lunchSlots);
  renderSlots("bk-times-dinner", dinnerSlots);
}

function bkRenderGuests() {
  const el = document.getElementById("bk-guests");
  el.innerHTML = "";
  for (let i = 1; i <= 10; i++) {
    const b = document.createElement("button");
    b.className = "bk-guest";
    b.textContent = i === 10 ? "10+" : String(i);
    b.onclick = () => {
      document.querySelectorAll(".bk-guest.selected").forEach(x => x.classList.remove("selected"));
      b.classList.add("selected");
      BK.guests = i;
      bkUpdateNext();
    };
    el.appendChild(b);
  }
}

function bkUpdateNext() {
  const btn = document.getElementById("bk-next");
  const step = BK.step;
  let valid = false;
  if (step === 1) valid = !!BK.date;
  if (step === 2) valid = !!BK.time;
  if (step === 3) valid = !!BK.guests;
  if (step === 4) {
    const n = document.getElementById("bk-name").value.trim();
    const e = document.getElementById("bk-email").value.trim();
    const p = document.getElementById("bk-phone").value.trim();
    valid = n.length >= 2 && /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$/.test(e) && p.length >= 6;
  }
  btn.disabled = !valid;
}

["bk-name","bk-email","bk-phone"].forEach(id => {
  document.getElementById(id).addEventListener("input", bkUpdateNext);
});

function bkGoStep(n) {
  BK.step = n;
  document.querySelectorAll(".bk-step").forEach(s => s.classList.remove("active"));
  document.querySelector('.bk-step[data-step="' + n + '"]').classList.add("active");
  const dots = document.querySelectorAll(".bk-step-dot");
  dots.forEach((d, i) => { if (i < n) d.classList.add("active"); else d.classList.remove("active"); });
  document.getElementById("bk-back").style.display = n > 1 && n < 5 ? "" : "none";
  const nextBtn = document.getElementById("bk-next");
  if (n === 4) nextBtn.textContent = "Confirmer ma réservation →";
  else nextBtn.textContent = "Continuer →";
  if (n === 5) document.getElementById("bk-footer").style.display = "none";
  else document.getElementById("bk-footer").style.display = "";
  bkUpdateNext();
}

function bkBack() { if (BK.step > 1) bkGoStep(BK.step - 1); }

// Formate un numéro français en direct pendant la saisie : "0612345678" → "06 12 34 56 78"
function bkFormatPhone(input) {
  let raw = input.value.replace(/[^\\d+]/g, "");
  if (raw.startsWith("+33")) raw = "0" + raw.slice(3);
  else if (raw.startsWith("33") && raw.length > 9) raw = "0" + raw.slice(2);
  raw = raw.replace(/\\D/g, "").slice(0, 10);
  input.value = raw.replace(/(.{2})/g, "$1 ").trim();
  bkValidatePhone(input);
}

// Valide en live qu'on a bien un 10 chiffres commençant par 0X (X ≠ 0)
function bkValidatePhone(input) {
  const status = document.getElementById("bk-phone-status");
  const digits = input.value.replace(/\\D/g, "");
  if (digits.length === 0) {
    input.classList.remove("phone-ok", "phone-err");
    if (status) { status.textContent = ""; status.className = "bk-phone-status"; }
    return false;
  }
  const ok = /^0[1-9]\\d{8}$/.test(digits);
  input.classList.toggle("phone-ok", ok);
  input.classList.toggle("phone-err", !ok);
  if (status) {
    if (ok) { status.textContent = "✓ Numéro français valide"; status.className = "bk-phone-status ok"; }
    else if (digits.length < 10) { status.textContent = "Entrez 10 chiffres (ex : 06 12 34 56 78)"; status.className = "bk-phone-status err"; }
    else { status.textContent = "Numéro invalide — format attendu : 06 XX XX XX XX"; status.className = "bk-phone-status err"; }
  }
  return ok;
}

// Stockage du form state pendant la confirmation
let BK_PENDING_SUBMIT = null;

async function bkNext() {
  if (BK.step < 4) {
    if (BK.step === 3) bkBuildSummary();
    bkGoStep(BK.step + 1);
    return;
  }
  // À l'étape 4 (step récap + coordonnées) : d'abord vérifier le numéro
  // et demander confirmation avant d'envoyer réellement.
  const phoneInput = document.getElementById("bk-phone");
  const err = document.getElementById("bk-error");
  err.style.display = "none";
  if (!bkValidatePhone(phoneInput)) {
    err.textContent = "Veuillez entrer un numéro de téléphone français valide (ex : 06 12 34 56 78).";
    err.style.display = "";
    phoneInput.focus();
    return;
  }
  // Affiche le modal de confirmation
  document.getElementById("bk-confirm-phone").textContent = phoneInput.value;
  document.getElementById("bk-confirm-overlay").classList.add("open");
}

function bkConfirmCancel() {
  document.getElementById("bk-confirm-overlay").classList.remove("open");
  document.getElementById("bk-phone").focus();
}

async function bkConfirmOk() {
  document.getElementById("bk-confirm-overlay").classList.remove("open");
  const btn = document.getElementById("bk-next");
  const err = document.getElementById("bk-error");
  err.style.display = "none";
  btn.disabled = true;
  btn.textContent = "Envoi…";
  try {
    const res = await fetch("/api/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prospect_slug: BK.prospectSlug,
        customer_name: document.getElementById("bk-name").value.trim(),
        customer_email: document.getElementById("bk-email").value.trim(),
        customer_phone: document.getElementById("bk-phone").value.trim(),
        booking_date: BK.date,
        booking_time: BK.time,
        guests: BK.guests,
        notes: document.getElementById("bk-notes").value.trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || "Erreur lors de l'envoi");
    }
    document.getElementById("bk-summary-final").innerHTML = document.getElementById("bk-summary").innerHTML;
    // Adapte le bloc succès selon le statut SMS renvoyé par l'API
    const successTitle = document.querySelector(".bk-success h4");
    const successText = document.querySelector(".bk-success p");
    if (successTitle && successText) {
      if (data.sms_status === "quota_reached") {
        successTitle.textContent = "🔒 Quota SMS démo atteint";
        successText.innerHTML = "Vous avez déjà utilisé les <strong>3 SMS de démonstration</strong> disponibles pour cet établissement. Contactez-nous si vous souhaitez tester à nouveau : <strong>contact@klyora.fr</strong>";
      } else if (data.sms_status === "sent") {
        successTitle.textContent = "📲 SMS envoyé !";
        const remaining = typeof data.sms_remaining === "number" ? data.sms_remaining : 0;
        successText.innerHTML = "Vérifiez vos messages : vous recevez le SMS de confirmation que vos futurs clients recevraient après réservation. <strong>C'est exactement ce que vos clients vivront.</strong><br><br><span style='font-size:12px;opacity:0.7'>Il vous reste " + remaining + " SMS de démo pour cet établissement.</span>";
      } else if (data.sms_status === "failed") {
        successTitle.textContent = "⚠️ Réservation OK, SMS non envoyé";
        successText.innerHTML = "Votre réservation est enregistrée, mais nous n'avons pas pu envoyer le SMS de confirmation. Vérifiez que votre numéro est au format français (06, +33…).";
      }
    }
    bkGoStep(5);
  } catch (e) {
    err.textContent = e.message || "Erreur lors de l'envoi de la réservation";
    err.style.display = "";
    btn.disabled = false;
    btn.textContent = "Confirmer ma réservation →";
  }
}

function bkBuildSummary() {
  const d = new Date(BK.date + "T12:00:00");
  const dateStr = DAYS_FULL[d.getDay()] + " " + d.getDate() + " " + MONTHS_FULL[d.getMonth()];
  document.getElementById("bk-summary").innerHTML = \`
    <div class="bk-sum-row"><span>Date</span><strong>\${dateStr}</strong></div>
    <div class="bk-sum-row"><span>Heure</span><strong>\${BK.time}</strong></div>
    <div class="bk-sum-row"><span>Convives</span><strong>\${BK.guests}\${BK.guests >= 10 ? "+" : ""} personne\${BK.guests > 1 ? "s" : ""}</strong></div>
  \`;
}

document.addEventListener("keydown", (e) => { if (e.key === "Escape") bkClose(); });

// ─── Purchase Modal ─────────────────────────────────
const PM = {
  plan: "simple",
  domainAvailable: false,
  domainPriceCents: 0,
  domainCheckTimer: null,
};

function pmOpen() {
  document.getElementById("pm-overlay").classList.add("open");
  document.body.style.overflow = "hidden";
  // Cart abandon tracking : signale à Rubens qu'un prospect a ouvert le modal
  // d'achat. Si 1h plus tard il n'a pas payé, relance auto par email.
  try {
    fetch("/api/prospect/modal-opened", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prospect_slug: ${JSON.stringify(prospect.slug)} }),
    }).catch(() => {});
  } catch {}
}
function pmClose() {
  document.getElementById("pm-overlay").classList.remove("open");
  document.body.style.overflow = "";
}

function pmSelectPlan(plan) {
  PM.plan = plan;
  document.querySelectorAll(".pm-plan").forEach((el) => {
    el.classList.toggle("selected", el.dataset.plan === plan);
  });
  document.getElementById("pm-domain-block").style.display = plan === "serenite" ? "" : "none";
  document.getElementById("pm-total-domain").style.display = (plan === "serenite" && PM.domainAvailable) ? "flex" : "none";
  document.getElementById("pm-total-serenite").style.display = plan === "serenite" ? "flex" : "none";
  // Masquer les champs adresse pour la formule Simple (moins de friction = +conversion)
  // Les champs ne sont exigés que pour Sérénité (enregistrement domaine IONOS)
  const addrFields = document.getElementById("pm-address-fields");
  if (addrFields) addrFields.style.display = plan === "serenite" ? "" : "none";
  pmUpdateTotal();
  pmUpdateSubmit();
}

function pmUpdateTotal() {
  let cents = 32000;
  if (PM.plan === "serenite") {
    cents += 5000;
    if (PM.domainAvailable) cents += PM.domainPriceCents;
  }
  document.getElementById("pm-total-grand").textContent = (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function pmUpdateSubmit() {
  const prenom = (document.getElementById("pm-prenom")?.value || "").trim();
  const nom = (document.getElementById("pm-nom")?.value || "").trim();
  const email = (document.getElementById("pm-email")?.value || "").trim();
  const tel = (document.getElementById("pm-tel")?.value || "").trim();
  // Champs de base TOUJOURS requis (même pour formule Simple)
  let valid = prenom.length >= 2
    && nom.length >= 2
    && /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$/.test(email)
    && tel.length >= 6;
  // Adresse requise UNIQUEMENT pour Sérénité (enregistrement domaine IONOS)
  if (PM.plan === "serenite") {
    const adr = (document.getElementById("pm-adresse")?.value || "").trim();
    const ville = (document.getElementById("pm-ville")?.value || "").trim();
    const cp = (document.getElementById("pm-cp")?.value || "").trim();
    valid = valid && adr.length >= 3 && ville.length >= 2 && cp.length >= 2;
  }
  document.getElementById("pm-submit").disabled = !valid;
}

async function pmCheckDomain() {
  const name = (document.getElementById("pm-domain-name").value || "").trim().toLowerCase();
  const tld = document.getElementById("pm-domain-tld").value;
  const statusEl = document.getElementById("pm-domain-status");

  if (!name || !/^[a-z0-9](-?[a-z0-9])+$/i.test(name)) {
    PM.domainAvailable = false;
    PM.domainPriceCents = 0;
    statusEl.className = "pm-domain-status";
    statusEl.textContent = "Commencez à taper pour vérifier la disponibilité";
    document.getElementById("pm-total-domain").style.display = "none";
    pmUpdateTotal();
    return;
  }

  statusEl.className = "pm-domain-status loading";
  statusEl.textContent = "Vérification en cours…";

  try {
    const res = await fetch("/api/domain-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullDomain: name + "." + tld }),
    });
    const data = await res.json();
    if (!res.ok) {
      statusEl.className = "pm-domain-status ko";
      statusEl.textContent = data.error || "Vérification impossible";
      PM.domainAvailable = false;
      PM.domainPriceCents = 0;
      document.getElementById("pm-total-domain").style.display = "none";
      pmUpdateTotal();
      return;
    }
    if (data.available) {
      PM.domainAvailable = true;
      PM.domainPriceCents = data.priceCents;
      statusEl.className = "pm-domain-status ok";
      statusEl.textContent = "✓ " + data.domain + " disponible · " + data.price + " € TTC / an";
      document.getElementById("pm-total-domain-label").textContent = "Nom de domaine " + data.domain;
      document.getElementById("pm-total-domain-price").textContent = data.price.toFixed(2).replace(".", ",") + " €";
      document.getElementById("pm-total-domain").style.display = "flex";
    } else {
      PM.domainAvailable = false;
      PM.domainPriceCents = 0;
      statusEl.className = "pm-domain-status ko";
      statusEl.textContent = "✗ " + (data.domain || (name + "." + tld)) + " indisponible. Essayez une autre extension.";
      document.getElementById("pm-total-domain").style.display = "none";
    }
    pmUpdateTotal();
  } catch (err) {
    statusEl.className = "pm-domain-status ko";
    statusEl.textContent = "Vérification impossible. Réessayez.";
  }
}

async function pmSubmit() {
  const btn = document.getElementById("pm-submit");
  const err = document.getElementById("pm-error");
  err.className = "pm-error";
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = "Préparation du paiement…";

  const payload = {
    prospect_slug: ${JSON.stringify(prospect.slug)},
    plan: PM.plan,
    buyer: {
      prenom: document.getElementById("pm-prenom").value.trim(),
      nom: document.getElementById("pm-nom").value.trim(),
      email: document.getElementById("pm-email").value.trim(),
      telephone: document.getElementById("pm-tel").value.trim(),
      adresse: document.getElementById("pm-adresse").value.trim(),
      ville: document.getElementById("pm-ville").value.trim(),
      cp: document.getElementById("pm-cp").value.trim(),
      entreprise: (document.getElementById("pm-entreprise")?.value || "").trim(),
    },
  };
  if (PM.plan === "serenite" && PM.domainAvailable) {
    payload.domain = {
      name: document.getElementById("pm-domain-name").value.trim().toLowerCase(),
      tld: document.getElementById("pm-domain-tld").value,
      priceCents: PM.domainPriceCents,
    };
  }

  try {
    const res = await fetch("/api/prospect/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || !data.url) {
      throw new Error(data.error || "Erreur lors du paiement");
    }
    // Redirect to Stripe Checkout
    window.location.href = data.url;
  } catch (e) {
    err.textContent = e.message || "Erreur, réessayez ou contactez contact@klyora.fr";
    err.className = "pm-error show";
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

// Listeners pour la validation du form + domaine live
["pm-prenom", "pm-nom", "pm-email", "pm-tel", "pm-adresse", "pm-ville", "pm-cp"].forEach((id) => {
  const el = document.getElementById(id);
  if (el) el.addEventListener("input", pmUpdateSubmit);
});
const domainNameInput = document.getElementById("pm-domain-name");
if (domainNameInput) {
  domainNameInput.addEventListener("input", () => {
    if (PM.domainCheckTimer) clearTimeout(PM.domainCheckTimer);
    PM.domainCheckTimer = setTimeout(pmCheckDomain, 500);
  });
}
const domainTldSelect = document.getElementById("pm-domain-tld");
if (domainTldSelect) domainTldSelect.addEventListener("change", pmCheckDomain);

pmUpdateSubmit();

document.addEventListener("keydown", (e) => { if (e.key === "Escape") { pmClose(); bkClose(); } });

// ─── Compteur 24h "Offre expire dans..." ──────────────
// Deadline = 24h après la PREMIÈRE ouverture de cette maquette par CE visiteur

</script>

</body>
</html>`;
}
