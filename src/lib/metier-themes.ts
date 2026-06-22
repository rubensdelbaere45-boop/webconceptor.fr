/**
 * Univers visuel par métier — chaque métier a son thème complet.
 *
 * Tom : "chaque maquette doit avoir son univers. Fleuriste joyeux arc-en-ciel,
 * pâtisserie chaleureux, etc. Tous les boutons cliquables avec logique."
 *
 * Pour chaque métier, on définit :
 *  - vibe : style général (dark-sport / light-joyful / warm-artisan / etc.)
 *  - palette : primary + accent + bg + cards (light ou dark mode)
 *  - fonts : Google Fonts heading + body
 *  - hero : copy + emoji + image stock par défaut
 *  - sections : ordre + activation (showVehicles, showBouquets, showMenu, etc.)
 *  - cta : actions principales (essai/réserver/commander/devis/rdv)
 *  - effects : animations à activer
 */

export type MetierTheme = {
  id: string;
  label: string;
  vibe: "dark-racing" | "light-joyful" | "warm-artisan" | "cinematic-luxury" | "fashion-bold" | "soft-wellness" | "medical-trust" | "brutalist-btp" | "warm-food" | "rainbow-floral";
  mode: "dark" | "light" | "warm";
  palette: { primary: string; accent: string; secondary?: string; background: string; foreground: string; cardBg: string; muted: string };
  fonts: { heading: string; body: string; importUrl: string; displayTransform?: "uppercase" | "none" };
  hero: { headlinePre: string; headlinePost: string; subtitle: string; emoji: string };
  sections: {
    showVehicles?: boolean;       // garages
    showBouquets?: boolean;       // fleuriste
    showMenu?: boolean;           // resto/café/boulangerie
    showServices?: boolean;       // BTP/santé
    showPortfolio?: boolean;      // coiffeur/menuisier
    showCatalog?: boolean;        // épicerie
    showBookingCalendar?: boolean; // dentiste/osteo/coiffeur
  };
  cta: { primary: { label: string; modalType: "essai" | "rdv" | "devis" | "commander" | "contact" | "brochure" }; secondary?: { label: string; modalType: "essai" | "rdv" | "devis" | "commander" | "contact" | "brochure" } };
  effects: {
    heroMesh: boolean;
    rainbowGradient?: boolean;
    softShadows?: boolean;
    sharpTransitions?: boolean;
    bouncyHover?: boolean;
    serifItalic?: boolean;
  };
};

const THEMES: Record<string, MetierTheme> = {
  // ════════════ GARAGE INDEPENDANT ════════════
  garage: {
    id: "garage",
    label: "Garage indépendant",
    vibe: "dark-racing",
    mode: "dark",
    palette: { primary: "#dc143c", accent: "#facc15", background: "#0a0a0a", foreground: "#fafafa", cardBg: "#171717", muted: "#262626" },
    fonts: { heading: "Barlow Condensed", body: "Barlow", importUrl: "https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;800&family=Barlow+Condensed:wght@600;700;800;900&display=swap", displayTransform: "uppercase" },
    hero: { headlinePre: "VOTRE VOITURE", headlinePost: "VOUS ATTEND.", subtitle: "Véhicules sélectionnés, essai gratuit, financement sur place, garantie incluse.", emoji: "🏎️" },
    sections: { showVehicles: true, showServices: true },
    cta: { primary: { label: "Voir nos voitures", modalType: "essai" }, secondary: { label: "Réserver un essai", modalType: "essai" } },
    effects: { heroMesh: true, sharpTransitions: true },
  },

  // ════════════ FLEURISTE — ARC-EN-CIEL JOYEUX ════════════
  fleuriste: {
    id: "fleuriste",
    label: "Fleuriste joyeux",
    vibe: "rainbow-floral",
    mode: "light",
    palette: { primary: "#ec4899", accent: "#fbbf24", secondary: "#a855f7", background: "#fffafc", foreground: "#1c1b1b", cardBg: "#ffffff", muted: "#fdf2f8" },
    fonts: { heading: "Cormorant Garamond", body: "Manrope", importUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Manrope:wght@400;500;600;700&display=swap" },
    hero: { headlinePre: "L'émotion en", headlinePost: "fleurs.", subtitle: "Bouquets composés à la minute, mariages, deuil, abonnement bureau. Fleurs fraîches du marché, savoir-faire artisanal.", emoji: "💐" },
    sections: { showBouquets: true, showServices: true, showBookingCalendar: true },
    cta: { primary: { label: "Commander un bouquet", modalType: "commander" }, secondary: { label: "Composer sur-mesure", modalType: "devis" } },
    effects: { heroMesh: false, rainbowGradient: true, softShadows: true, bouncyHover: true, serifItalic: true },
  },

  // ════════════ BOULANGERIE / PÂTISSERIE ════════════
  boulangerie: {
    id: "boulangerie",
    label: "Boulangerie / Pâtisserie",
    vibe: "warm-artisan",
    mode: "warm",
    palette: { primary: "#c2410c", accent: "#f59e0b", background: "#fdf8f8", foreground: "#1c1b1b", cardBg: "#ffffff", muted: "#fef3c7" },
    fonts: { heading: "EB Garamond", body: "Plus Jakarta Sans", importUrl: "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,500;0,600;0,700;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" },
    hero: { headlinePre: "Le pain", headlinePost: "comme une œuvre.", subtitle: "Pains au levain longue fermentation, viennoiseries pur beurre AOP, pâtisseries faites maison.", emoji: "🥖" },
    sections: { showMenu: true, showServices: true, showBookingCalendar: false },
    cta: { primary: { label: "Découvrir la carte", modalType: "commander" }, secondary: { label: "Commander un gâteau", modalType: "commander" } },
    effects: { heroMesh: false, softShadows: true, serifItalic: true },
  },

  // ════════════ CAFÉ ════════════
  cafe: {
    id: "cafe",
    label: "Café de quartier",
    vibe: "warm-food",
    mode: "warm",
    palette: { primary: "#78350f", accent: "#fbbf24", background: "#fffbeb", foreground: "#1c1b1b", cardBg: "#ffffff", muted: "#fef3c7" },
    fonts: { heading: "Poppins", body: "Open Sans", importUrl: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap" },
    hero: { headlinePre: "Votre café", headlinePost: "de quartier.", subtitle: "Cafés de spécialité, pâtisseries maison, brunch du week-end. Wi-Fi, terrasse, ambiance cocooning.", emoji: "☕" },
    sections: { showMenu: true, showServices: true, showBookingCalendar: true },
    cta: { primary: { label: "Voir la carte", modalType: "commander" }, secondary: { label: "Réserver une table", modalType: "rdv" } },
    effects: { heroMesh: false, softShadows: true },
  },

  // ════════════ RESTAURANT ════════════
  restaurant: {
    id: "restaurant",
    label: "Restaurant",
    vibe: "cinematic-luxury",
    mode: "dark",
    palette: { primary: "#1a1a1a", accent: "#d4af37", background: "#0a0a0a", foreground: "#fafafa", cardBg: "#171717", muted: "#262626" },
    fonts: { heading: "Playfair Display", body: "Inter", importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500;1,600&display=swap" },
    hero: { headlinePre: "Une table,", headlinePost: "une émotion.", subtitle: "Cuisine de marché, produits frais sélectionnés, savoir-faire du chef. Réservation conseillée.", emoji: "🍽️" },
    sections: { showMenu: true, showServices: true, showBookingCalendar: true },
    cta: { primary: { label: "Réserver une table", modalType: "rdv" }, secondary: { label: "Découvrir la carte", modalType: "commander" } },
    effects: { heroMesh: true, serifItalic: true },
  },

  // ════════════ COIFFEUR ════════════
  coiffeur: {
    id: "coiffeur",
    label: "Salon de coiffure",
    vibe: "fashion-bold",
    mode: "light",
    palette: { primary: "#000000", accent: "#facc15", background: "#fafafa", foreground: "#0a0a0a", cardBg: "#ffffff", muted: "#f4f4f5" },
    fonts: { heading: "Syne", body: "Manrope", importUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap", displayTransform: "none" },
    hero: { headlinePre: "Votre style,", headlinePost: "notre signature.", subtitle: "Diagnostic capillaire, coupes tendance, colorations végétales. Votre coiffeur attitré.", emoji: "✂️" },
    sections: { showPortfolio: true, showServices: true, showBookingCalendar: true },
    cta: { primary: { label: "Prendre RDV", modalType: "rdv" }, secondary: { label: "Voir nos réalisations", modalType: "contact" } },
    effects: { heroMesh: false, sharpTransitions: true, bouncyHover: true },
  },

  // ════════════ INSTITUT BEAUTÉ ════════════
  institut: {
    id: "institut",
    label: "Institut beauté / Spa",
    vibe: "soft-wellness",
    mode: "light",
    palette: { primary: "#be185d", accent: "#d4af37", secondary: "#fbcfe8", background: "#fff5f7", foreground: "#1c1b1b", cardBg: "#ffffff", muted: "#fce7f3" },
    fonts: { heading: "Cormorant Garamond", body: "Manrope", importUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600&display=swap" },
    hero: { headlinePre: "Votre parenthèse", headlinePost: "beauté & bien-être.", subtitle: "Soins visage, épilations, massages, manucure. Cabines cocon, produits cosmétiques haute qualité.", emoji: "💆" },
    sections: { showServices: true, showBookingCalendar: true },
    cta: { primary: { label: "Réserver un soin", modalType: "rdv" }, secondary: { label: "Voir la carte des soins", modalType: "brochure" } },
    effects: { heroMesh: false, softShadows: true, serifItalic: true },
  },

  // ════════════ DENTISTE ════════════
  dentiste: {
    id: "dentiste",
    label: "Cabinet dentaire",
    vibe: "medical-trust",
    mode: "light",
    palette: { primary: "#0ea5e9", accent: "#facc15", background: "#f0f9ff", foreground: "#1c1b1b", cardBg: "#ffffff", muted: "#e0f2fe" },
    fonts: { heading: "Inter", body: "Inter", importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" },
    hero: { headlinePre: "Votre sourire,", headlinePost: "notre métier.", subtitle: "Consultations, soins, esthétique, implants, orthodontie. Équipe expérimentée, équipement moderne.", emoji: "🦷" },
    sections: { showServices: true, showBookingCalendar: true },
    cta: { primary: { label: "Prendre rendez-vous", modalType: "rdv" }, secondary: { label: "Urgence dentaire", modalType: "contact" } },
    effects: { heroMesh: false, softShadows: true },
  },

  // ════════════ OSTÉOPATHE ════════════
  osteo: {
    id: "osteo",
    label: "Ostéopathe",
    vibe: "medical-trust",
    mode: "light",
    palette: { primary: "#0e7c3a", accent: "#84cc16", background: "#f0fdf4", foreground: "#1c1b1b", cardBg: "#ffffff", muted: "#dcfce7" },
    fonts: { heading: "Inter", body: "Inter", importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" },
    hero: { headlinePre: "Soulagez", headlinePost: "vos douleurs durablement.", subtitle: "Approche douce et manuelle. Du nourrisson au sportif, soin personnalisé pour mobilité et bien-être.", emoji: "🌿" },
    sections: { showServices: true, showBookingCalendar: true },
    cta: { primary: { label: "Prendre rendez-vous", modalType: "rdv" }, secondary: { label: "Découvrir l'approche", modalType: "contact" } },
    effects: { heroMesh: false, softShadows: true },
  },

  // ════════════ VÉTÉRINAIRE ════════════
  veterinaire: {
    id: "veterinaire",
    label: "Clinique vétérinaire",
    vibe: "medical-trust",
    mode: "light",
    palette: { primary: "#0e7c3a", accent: "#fbbf24", background: "#f0fdf4", foreground: "#1c1b1b", cardBg: "#ffffff", muted: "#dcfce7" },
    fonts: { heading: "Plus Jakarta Sans", body: "Plus Jakarta Sans", importUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" },
    hero: { headlinePre: "Pour la santé", headlinePost: "de vos compagnons.", subtitle: "Consultations, vaccins, chirurgie, urgences. Équipe bienveillante, équipement moderne, suivi personnalisé.", emoji: "🐾" },
    sections: { showServices: true, showBookingCalendar: true },
    cta: { primary: { label: "Prendre rendez-vous", modalType: "rdv" }, secondary: { label: "Urgences 24/7", modalType: "contact" } },
    effects: { heroMesh: false, softShadows: true, bouncyHover: true },
  },

  // ════════════ PLOMBIER / ÉLECTRICIEN / BTP ════════════
  plombier: {
    id: "plombier",
    label: "Plombier / Électricien",
    vibe: "brutalist-btp",
    mode: "light",
    palette: { primary: "#1e40af", accent: "#facc15", background: "#fafafa", foreground: "#0a0a0a", cardBg: "#ffffff", muted: "#f4f4f5" },
    fonts: { heading: "Bebas Neue", body: "Source Sans 3", importUrl: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+3:wght@400;500;600;700&display=swap", displayTransform: "uppercase" },
    hero: { headlinePre: "INTERVENTION RAPIDE", headlinePost: "7J/7.", subtitle: "Dépannage urgence, installation neuve, mise aux normes. Devis gratuit en 24h, garantie écrite.", emoji: "🔧" },
    sections: { showServices: true, showBookingCalendar: false },
    cta: { primary: { label: "Demander un devis", modalType: "devis" }, secondary: { label: "Urgence — appel direct", modalType: "rdv" } },
    effects: { heroMesh: false, sharpTransitions: true },
  },

  // ════════════ MENUISIER ════════════
  menuisier: {
    id: "menuisier",
    label: "Menuiserie",
    vibe: "warm-artisan",
    mode: "warm",
    palette: { primary: "#78350f", accent: "#fde68a", background: "#fef3c7", foreground: "#1c1b1b", cardBg: "#ffffff", muted: "#fef9c3" },
    fonts: { heading: "Cormorant Garamond", body: "Inter", importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap" },
    hero: { headlinePre: "Le bois sur-mesure,", headlinePost: "façonné à la main.", subtitle: "Cuisines, dressings, escaliers, mobilier unique. Bois français, finitions parfaites.", emoji: "🪵" },
    sections: { showPortfolio: true, showServices: true },
    cta: { primary: { label: "Demander un devis", modalType: "devis" }, secondary: { label: "Voir nos réalisations", modalType: "contact" } },
    effects: { heroMesh: false, softShadows: true, serifItalic: true },
  },

  // ════════════ COUVREUR ════════════
  couvreur: {
    id: "couvreur",
    label: "Couvreur / Toiture",
    vibe: "brutalist-btp",
    mode: "light",
    palette: { primary: "#0f172a", accent: "#ef4444", background: "#fafafa", foreground: "#0a0a0a", cardBg: "#ffffff", muted: "#f1f5f9" },
    fonts: { heading: "Bebas Neue", body: "Source Sans 3", importUrl: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+3:wght@400;500;600;700&display=swap", displayTransform: "uppercase" },
    hero: { headlinePre: "VOTRE TOIT,", headlinePost: "NOTRE ENGAGEMENT.", subtitle: "Réfection complète, dépannage urgent, isolation, zinguerie. 25 ans d'expertise, RGE Qualibat, garantie décennale.", emoji: "🏠" },
    sections: { showServices: true, showPortfolio: true },
    cta: { primary: { label: "Devis gratuit", modalType: "devis" }, secondary: { label: "Urgence fuite", modalType: "rdv" } },
    effects: { heroMesh: false, sharpTransitions: true },
  },

  // ════════════ ÉPICERIE FINE ════════════
  epicerie: {
    id: "epicerie",
    label: "Épicerie du Terroir",
    vibe: "warm-artisan",
    mode: "warm",
    palette: { primary: "#65a30d", accent: "#fbbf24", background: "#fefce8", foreground: "#1c1b1b", cardBg: "#ffffff", muted: "#fef9c3" },
    fonts: { heading: "Playfair Display", body: "Inter", importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" },
    hero: { headlinePre: "Le meilleur du terroir,", headlinePost: "sélectionné pour vous.", subtitle: "Fromages affinés, charcuteries de producteurs, huiles d'olive, vins natures. Des saveurs introuvables ailleurs.", emoji: "🧀" },
    sections: { showCatalog: true, showServices: true },
    cta: { primary: { label: "Découvrir la cave", modalType: "commander" }, secondary: { label: "Coffrets cadeaux", modalType: "brochure" } },
    effects: { heroMesh: false, softShadows: true, serifItalic: true },
  },

  // ════════════ AUTO-ÉCOLE ════════════
  autoecole: {
    id: "autoecole",
    label: "Auto-école",
    vibe: "fashion-bold",
    mode: "light",
    palette: { primary: "#1e40af", accent: "#facc15", background: "#fafafa", foreground: "#0a0a0a", cardBg: "#ffffff", muted: "#f4f4f5" },
    fonts: { heading: "Barlow Condensed", body: "Barlow", importUrl: "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@700;800;900&display=swap", displayTransform: "uppercase" },
    hero: { headlinePre: "VOTRE PERMIS,", headlinePost: "SANS STRESS.", subtitle: "Code en ligne illimité, leçons individuelles, simulateur, conduite accompagnée. Formation à votre rythme.", emoji: "🚦" },
    sections: { showServices: true, showBookingCalendar: true },
    cta: { primary: { label: "S'inscrire", modalType: "rdv" }, secondary: { label: "Tarifs & forfaits", modalType: "brochure" } },
    effects: { heroMesh: false, sharpTransitions: true },
  },
};

/** Détecte le thème métier depuis business_type + name + slug. */
export function detectMetierTheme(input: { businessType?: string | null; name?: string | null; slug?: string | null }): MetierTheme {
  const s = `${input.businessType || ""} ${input.name || ""} ${input.slug || ""}`.toLowerCase();
  if (/\bgarage|garagi|m[eé]canicien|carrosseri|concession|automobile|auto[^c]/.test(s)) return THEMES.garage;
  if (/\bfleurist/.test(s)) return THEMES.fleuriste;
  if (/\b(boulanger|p[aâ]tisser|chocolat)/.test(s)) return THEMES.boulangerie;
  if (/\bcaf[eé](?!fer)/.test(s)) return THEMES.cafe;
  if (/\b(restaurant|bistro|brasseri|gastro)/.test(s)) return THEMES.restaurant;
  if (/\bcoiffeu|salon\s*de\s*coiffure/.test(s)) return THEMES.coiffeur;
  if (/\binstitut|esth[eé]ti|beaut[eé]|spa/.test(s)) return THEMES.institut;
  if (/\bdentiste|dental|orthodont|cabinet[ -]dentaire/.test(s)) return THEMES.dentiste;
  if (/\bost[eé]o/.test(s)) return THEMES.osteo;
  if (/\bv[eé]t[eé]rinaire|clinique\s*animal/.test(s)) return THEMES.veterinaire;
  if (/\bplomb|electric|électrici|électrique/.test(s)) return THEMES.plombier;
  if (/\bmenuis|ebeniste|carpenter/.test(s)) return THEMES.menuisier;
  if (/\bcouvreur|toitur|zinguer/.test(s)) return THEMES.couvreur;
  if (/\b[eé]picerie/.test(s)) return THEMES.epicerie;
  if (/\bauto[\s-]*[eé]cole/.test(s)) return THEMES.autoecole;
  // Fallback artisan
  return THEMES.boulangerie;
}

export { THEMES };
