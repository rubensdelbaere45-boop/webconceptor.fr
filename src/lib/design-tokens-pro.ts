/**
 * Design Tokens Pro v2 : 20 presets condensés du repo ui-ux-pro-max-skill-main
 * (84 styles + 161 palettes + 74 typographies + 161 UI reasoning rules
 * distillés en presets actionnables runtime).
 *
 * Chaque preset apporte :
 *  - Style visuel (architecture du design)
 *  - Palette colors (WCAG-checked)
 *  - Font pairing (Google Fonts avec import URL)
 *  - Landing pattern (Hero+Features+CTA, Hero+Social Proof+CTA, etc.)
 *  - Effects recommandés (CSS-level)
 *  - Anti-patterns à éviter (NE PAS appliquer ces choses)
 *  - Section order optimal pour conversion
 *
 * Source extraction : /Users/rubensdelbaere/Downloads/ui-ux-pro-max-skill-main
 * (Apache 2.0)
 */

export type DesignPreset = {
  id: string;
  label: string;
  vibe: "sport" | "premium" | "classic" | "modern" | "youth" | "luxury" | "tech" | "artisan" | "wellness" | "racing" | "warm";
  style: string;
  fonts: { heading: string; body: string; importUrl: string };
  colors: {
    primary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    cardBg: string;
  };
  effects: string;
  bestFor: string[];
  reasoning: string;
  // V2 enrichments (extracted from ui-reasoning.csv)
  landingPattern: string;        // ex: "Hero + Social Proof + CTA"
  recommendedEffects: string[];  // ex: ["Soft shadows", "Smooth transitions"]
  antiPatterns: string[];        // NE PAS appliquer ça
  sectionOrder: string[];        // ordre optimal des sections
};

const PRESETS: DesignPreset[] = [
  // ════════ AUTOMOTIVE ════════
  {
    id: "racing-sport",
    label: "Racing Sport",
    vibe: "racing",
    style: "Motion-Driven + 3D & Hyperrealism",
    fonts: {
      heading: "Barlow Condensed", body: "Barlow",
      importUrl: "https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;800&family=Barlow+Condensed:wght@600;700;800;900&display=swap",
    },
    colors: { primary: "#dc143c", accent: "#facc15", background: "#0a0a0a", foreground: "#fafafa", muted: "#262626", cardBg: "#171717" },
    effects: "Hover scale 1.05 + sharp transitions 150ms + neon glow on CTA + parallax hero",
    bestFor: ["garage", "automotive", "concession", "motorsport", "garage-multimarque"],
    reasoning: "Bold typography + dark mode OLED + confiance via stats. Garages indépendants ciblent émotion sportive.",
    landingPattern: "Hero-Centric + Feature-Rich",
    recommendedEffects: ["360 product view", "Configurator animations", "Scroll-triggered car reveals", "Neon glow on CTA"],
    antiPatterns: ["Static product pages", "Poor UX", "Pastel colors", "Serif fonts"],
    sectionOrder: ["hero-fullscreen", "vehicules", "services", "about", "testimonials", "contact"],
  },
  {
    id: "premium-automotive",
    label: "Premium Automotive",
    vibe: "premium",
    style: "Modern Dark Cinema + Glassmorphism",
    fonts: {
      heading: "Inter", body: "Inter",
      importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
    },
    colors: { primary: "#0c1e3e", accent: "#d4af37", background: "#0f0f0f", foreground: "#fafafa", muted: "#1a1a1a", cardBg: "#1c1c1c" },
    effects: "Backdrop blur 20px + smooth transitions 300ms + subtle gold accents on hover",
    bestFor: ["concession-luxe", "mercedes", "bmw", "audi", "jaguar", "aston"],
    reasoning: "Glassmorphism inspire confiance, palette dark luxury évoque haut de gamme automobile.",
    landingPattern: "Hero-Centric + Feature-Rich",
    recommendedEffects: ["Glassmorphism cards", "Gold accent micro-interactions", "360 product views", "Premium video hero"],
    antiPatterns: ["Bright colors", "Comic sans", "Bargain bin styling"],
    sectionOrder: ["hero-cinematic", "vehicules", "services-premium", "about-heritage", "testimonials-vip", "contact"],
  },

  // ════════ FOOD & BEVERAGE ════════
  {
    id: "artisan-classique",
    label: "Artisan Classique",
    vibe: "artisan",
    style: "Classic Elegant + Storytelling",
    fonts: {
      heading: "EB Garamond", body: "Plus Jakarta Sans",
      importUrl: "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,500;0,600;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
    },
    colors: { primary: "#c2410c", accent: "#f59e0b", background: "#fdf8f8", foreground: "#1c1b1b", muted: "#f5f3ee", cardBg: "#ffffff" },
    effects: "Serif italic mid-words + soft hover lift + warm gradient washes",
    bestFor: ["boulangerie", "patisserie", "chocolat", "traiteur", "boulanger-patissier"],
    reasoning: "Serif Garamond évoque tradition + savoir-faire. Palette chaude = appétit.",
    landingPattern: "Hero-Centric + Conversion",
    recommendedEffects: ["Menu hover lift", "Order animations", "Warm gradient overlays", "Bread photo zoom"],
    antiPatterns: ["Cold blue palettes", "Tech fonts", "Dark mode", "Stock photos generic"],
    sectionOrder: ["hero-product", "story", "vitrine", "services", "testimonials", "horaires", "contact"],
  },
  {
    id: "modern-pro",
    label: "Café Moderne",
    vibe: "warm",
    style: "Modern Professional + Vibrant Block",
    fonts: {
      heading: "Poppins", body: "Open Sans",
      importUrl: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap",
    },
    colors: { primary: "#78350f", accent: "#fbbf24", background: "#fffbeb", foreground: "#1c1b1b", muted: "#fef3c7", cardBg: "#ffffff" },
    effects: "Card hover lift + warm gradients + smooth transitions 200ms",
    bestFor: ["cafe", "coffee", "brunch", "bar-cafe"],
    reasoning: "Couleurs warm food + fonts approachables = ambiance accueillante quotidien.",
    landingPattern: "Hero-Centric + Conversion",
    recommendedEffects: ["Menu hover lift", "Hours sticky widget", "Reservation modal", "Atmosphere photo gallery"],
    antiPatterns: ["Cold steel palettes", "Brutalist styling", "Hidden menu"],
    sectionOrder: ["hero-ambiance", "menu", "story", "horaires", "reservation", "testimonials", "contact"],
  },
  {
    id: "restaurant-gastro",
    label: "Restaurant Gastronomique",
    vibe: "luxury",
    style: "Editorial + Hero-Centric Cinema",
    fonts: {
      heading: "Playfair Display", body: "Inter",
      importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,500;0,600;1,500&display=swap",
    },
    colors: { primary: "#1a1a1a", accent: "#d4af37", background: "#fafaf9", foreground: "#1a1a1a", muted: "#f4f4f5", cardBg: "#ffffff" },
    effects: "Cinematic hero video + serif italic accents + gold dividers + slow elegant transitions",
    bestFor: ["restaurant", "gastronomique", "bistronomique", "etoile"],
    reasoning: "Editorial cinema + or + Playfair = haute gastronomie. Chef en avant.",
    landingPattern: "Hero-Centric + Storytelling",
    recommendedEffects: ["Cinematic hero video", "Chef portrait", "Dish detail hover", "Reservation modal premium"],
    antiPatterns: ["Cluttered layout", "Cartoon fonts", "Bright tropical colors"],
    sectionOrder: ["hero-cinema", "chef", "carte", "menu-dégustation", "wine-pairing", "reservation", "contact"],
  },
  {
    id: "epicerie-terroir",
    label: "Épicerie du Terroir",
    vibe: "premium",
    style: "Editorial + Nature Distilled",
    fonts: {
      heading: "Playfair Display", body: "Inter",
      importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap",
    },
    colors: { primary: "#65a30d", accent: "#fbbf24", background: "#fefce8", foreground: "#1c1b1b", muted: "#fef9c3", cardBg: "#ffffff" },
    effects: "Serif italic + warm gradient + storytelling layout + producer portraits",
    bestFor: ["epicerie", "cave", "terroir", "produits-fins", "fromager"],
    reasoning: "Serif Playfair + verts/jaunes naturels = artisanat de qualité régional.",
    landingPattern: "Hero-Centric + Storytelling",
    recommendedEffects: ["Producer portraits hover", "Product detail modal", "Map of origins"],
    antiPatterns: ["Mass-market styling", "Bright industrial colors", "Cluttered grids"],
    sectionOrder: ["hero-product", "producteurs", "selection", "story", "horaires", "contact"],
  },

  // ════════ BEAUTÉ & WELLNESS ════════
  {
    id: "nature-distilled",
    label: "Nature Distilled (Wellness)",
    vibe: "wellness",
    style: "Soft UI Evolution + Neumorphism",
    fonts: {
      heading: "Cormorant Garamond", body: "Manrope",
      importUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700&display=swap",
    },
    colors: { primary: "#7e22ce", accent: "#fae8ff", background: "#fdf6fb", foreground: "#1c1b1b", muted: "#f5f0f7", cardBg: "#ffffff" },
    effects: "Soft shadows + breathing animations + lavender gradient backgrounds + gentle hover",
    bestFor: ["spa", "wellness", "massage", "yoga", "meditation"],
    reasoning: "Palette pastel + fonts élégantes inspirent sérénité et soin de soi.",
    landingPattern: "Hero-Centric + Social Proof",
    recommendedEffects: ["Soft shadows multi-layers", "Smooth transitions 200-300ms", "Gentle hover lift", "Testimonial carousel"],
    antiPatterns: ["Bright neon colors", "Harsh animations", "Dark mode", "Brutalist styling"],
    sectionOrder: ["hero-zen", "services-soins", "team", "testimonials", "tarifs", "rendez-vous", "contact"],
  },
  {
    id: "institut-beaute",
    label: "Institut Beauté Premium",
    vibe: "luxury",
    style: "Soft UI Evolution + Editorial",
    fonts: {
      heading: "Cormorant Garamond", body: "Manrope",
      importUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@500;600;700&family=Manrope:wght@400;500;600&display=swap",
    },
    colors: { primary: "#be185d", accent: "#d4af37", background: "#fff5f7", foreground: "#1c1b1b", muted: "#fce7f3", cardBg: "#ffffff" },
    effects: "Soft pastel pink + gold accents + smooth transitions 250ms + before/after slider",
    bestFor: ["institut", "esthetique", "beaute", "soin-visage", "epilation"],
    reasoning: "Pastels Pink Sage Cream + Gold = beauté luxe accessible. Source ui-reasoning.csv.",
    landingPattern: "Hero-Centric + Social Proof",
    recommendedEffects: ["Before/after slider", "Treatment detail cards", "Gift card CTA", "Reservation flow"],
    antiPatterns: ["Bright neon", "Dark mode", "Comic sans", "Harsh transitions"],
    sectionOrder: ["hero-beauty", "soins", "before-after", "team", "tarifs", "reservation", "contact"],
  },
  {
    id: "fashion-forward",
    label: "Fashion Forward (Coiffeur)",
    vibe: "modern",
    style: "Fashion Forward + Exaggerated Minimalism",
    fonts: {
      heading: "Syne", body: "Manrope",
      importUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap",
    },
    colors: { primary: "#000000", accent: "#facc15", background: "#fafafa", foreground: "#0a0a0a", muted: "#f4f4f5", cardBg: "#ffffff" },
    effects: "Bold typography + asymmetric layouts + scroll-triggered reveals + portfolio gallery",
    bestFor: ["coiffeur", "salon", "barber", "hair", "mode"],
    reasoning: "Syne moderne géométrique + accent jaune = identité forte, jeune, créatif.",
    landingPattern: "Portfolio Grid + Social Proof",
    recommendedEffects: ["Portfolio masonry", "Before/after gallery", "Instagram feed embed", "Booking modal"],
    antiPatterns: ["Boring corporate", "Generic stock photos", "Static layouts"],
    sectionOrder: ["hero-bold", "portfolio", "services", "team-stylists", "tarifs", "booking", "contact"],
  },

  // ════════ HEALTH & MEDICAL ════════
  {
    id: "health-medical",
    label: "Santé Apaisante",
    vibe: "wellness",
    style: "Soft UI Evolution + Minimalism",
    fonts: {
      heading: "Inter", body: "Inter",
      importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
    },
    colors: { primary: "#0891b2", accent: "#059669", background: "#f0fdfa", foreground: "#1c1b1b", muted: "#ecfeff", cardBg: "#ffffff" },
    effects: "Soft shadows + WCAG AAA contrast + clear hierarchy + smooth booking flow",
    bestFor: ["medical", "kine", "podologue"],
    reasoning: "Cyan/vert apaisants + accessibilité maximale = confiance médicale (WCAG AAA).",
    landingPattern: "Social Proof-Focused + Trust",
    recommendedEffects: ["Patient testimonial carousel", "Before/after photos", "Online booking widget", "FAQ accordion"],
    antiPatterns: ["Poor imagery", "No testimonials", "Hidden hours"],
    sectionOrder: ["hero-trust", "team-doctors", "services", "testimonials", "horaires", "booking", "contact"],
  },
  {
    id: "dental-practice",
    label: "Cabinet Dentaire",
    vibe: "wellness",
    style: "Soft UI Evolution + Minimalism Friendly",
    fonts: {
      heading: "Inter", body: "Inter",
      importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
    },
    colors: { primary: "#0ea5e9", accent: "#facc15", background: "#f0f9ff", foreground: "#1c1b1b", muted: "#e0f2fe", cardBg: "#ffffff" },
    effects: "Friendly soft shadows + smile yellow accents + before/after gallery + appointment booking",
    bestFor: ["dentiste", "dental", "orthodont", "cabinet-dentaire", "implant"],
    reasoning: "Fresh Blue + White + Smile Yellow = confiance dentaire. Source ui-reasoning.csv #Dental Practice.",
    landingPattern: "Social Proof-Focused + Conversion",
    recommendedEffects: ["Before/after gallery", "Patient testimonial carousel", "Online appointment", "Smile design preview"],
    antiPatterns: ["Poor imagery", "No testimonials", "Tech jargon overload"],
    sectionOrder: ["hero-smile", "services", "before-after", "team-dentists", "testimonials", "doctolib", "contact"],
  },
  {
    id: "vet-clinic",
    label: "Clinique Vétérinaire",
    vibe: "warm",
    style: "Claymorphism + Accessible Ethical",
    fonts: {
      heading: "Plus Jakarta Sans", body: "Plus Jakarta Sans",
      importUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
    },
    colors: { primary: "#0e7c3a", accent: "#fbbf24", background: "#f0fdf4", foreground: "#1c1b1b", muted: "#dcfce7", cardBg: "#ffffff" },
    effects: "Warm clay shadows + pet photo gallery + service animations + appointment flow",
    bestFor: ["veterinaire", "clinique-animal", "veto", "soins-animaux"],
    reasoning: "Caring Blue + Pet colors + Warm = bienveillance animale. Source ui-reasoning.csv #Veterinary.",
    landingPattern: "Social Proof-Focused + Trust",
    recommendedEffects: ["Pet profile management", "Service animations", "Urgences badge sticky", "Before/after photo"],
    antiPatterns: ["Generic design", "Hidden services", "Cold corporate styling"],
    sectionOrder: ["hero-pets", "services", "urgences", "team", "tarifs", "appointment", "contact"],
  },

  // ════════ ARTISANAT & BTP ════════
  {
    id: "artisan-btp",
    label: "Artisan BTP",
    vibe: "classic",
    style: "Brutalist Direct + High Contrast",
    fonts: {
      heading: "Bebas Neue", body: "Source Sans 3",
      importUrl: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+3:wght@400;500;600;700&display=swap",
    },
    colors: { primary: "#1e40af", accent: "#0ea5e9", background: "#fafafa", foreground: "#0a0a0a", muted: "#f4f4f5", cardBg: "#ffffff" },
    effects: "Hard borders + bold caps headlines + reliability blue palette + emergency banner",
    bestFor: ["plombier", "electricien"],
    reasoning: "Bebas Neue caps = solidité + bleu confiance + bandeau urgence.",
    landingPattern: "Trust & Authority + Conversion",
    recommendedEffects: ["Emergency banner sticky", "Before/after work photos", "Quote request modal", "Tel CTA visible"],
    antiPatterns: ["Cluttered text", "Soft pastels", "Slow animations"],
    sectionOrder: ["hero-urgence", "services", "intervention-zone", "garanties", "avis", "devis", "contact"],
  },
  {
    id: "menuisier-bois",
    label: "Menuiserie Bois",
    vibe: "classic",
    style: "Artisanal + Warm Wood + Storytelling",
    fonts: {
      heading: "Cormorant Garamond", body: "Inter",
      importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cormorant+Garamond:wght@500;600;700&display=swap",
    },
    colors: { primary: "#78350f", accent: "#fde68a", background: "#fef3c7", foreground: "#1c1b1b", muted: "#fef9c3", cardBg: "#ffffff" },
    effects: "Warm wood tones + serif accents + portfolio gallery + before/after work",
    bestFor: ["menuisier", "ebeniste", "carpenter", "bois", "agencement"],
    reasoning: "Wood tones + serif = noblesse artisanale du bois.",
    landingPattern: "Portfolio Grid + Trust",
    recommendedEffects: ["Portfolio masonry", "Wood texture overlays", "Project detail modal", "Before/after slider"],
    antiPatterns: ["Cold steel palettes", "Tech fonts", "Stock photos generic"],
    sectionOrder: ["hero-workshop", "realisations", "savoir-faire", "essences-bois", "devis", "contact"],
  },
  {
    id: "couvreur-toiture",
    label: "Couvreur Toiture",
    vibe: "classic",
    style: "Brutalist Direct + Trust Blue + Before/After",
    fonts: {
      heading: "Bebas Neue", body: "Source Sans 3",
      importUrl: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+3:wght@400;500;600;700&display=swap",
    },
    colors: { primary: "#0f172a", accent: "#ef4444", background: "#fafafa", foreground: "#0a0a0a", muted: "#f1f5f9", cardBg: "#ffffff" },
    effects: "Dark navy + red emergency + before/after roof + RGE certifications badges",
    bestFor: ["couvreur", "toiture", "zinguer"],
    reasoning: "Navy + red emergency = sérieux btp + urgence intempérie.",
    landingPattern: "Trust & Authority + Conversion",
    recommendedEffects: ["RGE badge stickers", "Before/after roof slider", "Emergency CTA", "Devis modal"],
    antiPatterns: ["Pastel colors", "Cursive fonts", "No certifications shown"],
    sectionOrder: ["hero-roof", "urgence", "certifications-rge", "realisations", "devis", "contact"],
  },

  // ════════ LIFESTYLE & SERVICES ════════
  {
    id: "fleuriste-floral",
    label: "Fleuriste Floral",
    vibe: "wellness",
    style: "Soft UI + Storytelling Botanical",
    fonts: {
      heading: "Cormorant Garamond", body: "Manrope",
      importUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Manrope:wght@400;500;600&display=swap",
    },
    colors: { primary: "#9d174d", accent: "#fbcfe8", background: "#fdf2f8", foreground: "#1c1b1b", muted: "#fce7f3", cardBg: "#ffffff" },
    effects: "Soft pink gradients + floral pattern overlays + bouquet hover lift + serif italic",
    bestFor: ["fleuriste", "florist", "fleurs"],
    reasoning: "Pink soft + Cormorant italic = féminité + bouquets élégants.",
    landingPattern: "Hero-Centric + Conversion",
    recommendedEffects: ["Bouquet gallery hover", "Occasion picker (mariage/deuil/anniv)", "Livraison CTA", "Abonnement bureau"],
    antiPatterns: ["Cold colors", "Brutalist fonts", "Industrial styling"],
    sectionOrder: ["hero-bouquet", "collections", "occasions", "abonnement", "livraison", "contact"],
  },
  {
    id: "sports-fitness",
    label: "Sports & Auto-École",
    vibe: "youth",
    style: "Vibrant & Block + Motion-Driven",
    fonts: {
      heading: "Barlow Condensed", body: "Barlow",
      importUrl: "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@700;800;900&display=swap",
    },
    colors: { primary: "#1e40af", accent: "#facc15", background: "#fafafa", foreground: "#0a0a0a", muted: "#f4f4f5", cardBg: "#ffffff" },
    effects: "Bold caps + energetic transitions + scroll-triggered animations + progress rings",
    bestFor: ["autoecole", "fitness", "coach", "salle-sport", "gym"],
    reasoning: "Barlow condensed + accents fluo = énergie + dynamisme. Conversion bold.",
    landingPattern: "Feature-Rich + Data",
    recommendedEffects: ["Progress ring animations", "Achievement unlocks", "Stats counter", "Booking flow"],
    antiPatterns: ["Static design", "No gamification", "Soft pastels"],
    sectionOrder: ["hero-energy", "stats", "services-forfaits", "team-coaches", "testimonials", "inscription", "contact"],
  },

  // ════════ AGENCY & B2B ════════
  {
    id: "creative-agency",
    label: "Creative Agency / Studio",
    vibe: "modern",
    style: "Brutalism + Motion-Driven Bold",
    fonts: {
      heading: "Space Grotesk", body: "Space Grotesk",
      importUrl: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap",
    },
    colors: { primary: "#000000", accent: "#ef4444", background: "#fafafa", foreground: "#0a0a0a", muted: "#f4f4f5", cardBg: "#ffffff" },
    effects: "Brutalist layouts + motion-driven transitions + bold typography + portfolio reveals",
    bestFor: ["agence", "creative", "studio-design", "communication"],
    reasoning: "Brutalism + motion = créativité audacieuse. Source ui-reasoning.csv #Creative Agency.",
    landingPattern: "Portfolio Grid + Storytelling",
    recommendedEffects: ["Portfolio scroll reveals", "Project case studies", "Client logos marquee", "Bold transitions"],
    antiPatterns: ["Corporate minimalism", "Hidden portfolio", "Generic stock"],
    sectionOrder: ["hero-bold", "portfolio", "case-studies", "process", "team", "contact-brief"],
  },
  {
    id: "coworking-space",
    label: "Coworking & Bureaux",
    vibe: "modern",
    style: "Vibrant & Block + Glassmorphism",
    fonts: {
      heading: "Plus Jakarta Sans", body: "Plus Jakarta Sans",
      importUrl: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
    },
    colors: { primary: "#7c3aed", accent: "#fbbf24", background: "#faf5ff", foreground: "#1c1b1b", muted: "#f3e8ff", cardBg: "#ffffff" },
    effects: "Glass cards + space tour video + amenity reveal + booking calendar",
    bestFor: ["coworking", "bureaux", "espace-pro"],
    reasoning: "Vibrant + glass + warm tones = énergie collaborative.",
    landingPattern: "Hero-Centric + Feature-Rich",
    recommendedEffects: ["Space tour video", "Amenity reveal animations", "Plans/tarifs comparison", "Booking calendar"],
    antiPatterns: ["Outdated photos", "Confusing layout", "Static design"],
    sectionOrder: ["hero-video", "espaces", "amenities", "tarifs", "membres", "booking", "contact"],
  },
];

/** Sélectionne le meilleur preset pour un métier donné. */
export function selectDesignPreset(metier: string | null | undefined, hint?: { vibe?: DesignPreset["vibe"]; isFranchise?: boolean }): DesignPreset {
  const m = (metier || "").toLowerCase();
  // Garage franchise → premium-automotive
  if (hint?.isFranchise && /garage|automobile|concession/.test(m)) {
    return PRESETS.find(p => p.id === "premium-automotive")!;
  }
  if (hint?.vibe) {
    const match = PRESETS.find(p => p.vibe === hint.vibe);
    if (match) return match;
  }
  // Match précis par bestFor (longueur descendante pour matcher les + spécifiques d'abord)
  const sorted = [...PRESETS].sort((a, b) => Math.max(...b.bestFor.map(s => s.length)) - Math.max(...a.bestFor.map(s => s.length)));
  for (const p of sorted) {
    if (p.bestFor.some(b => m.includes(b))) return p;
  }
  // Fallback : artisan classique
  return PRESETS.find(p => p.id === "artisan-classique")!;
}

export { PRESETS };
