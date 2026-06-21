/**
 * Design Tokens Pro : presets condensés du repo ui-ux-pro-max-skill-main
 * (84 styles, 161 palettes, 74 typographies, 161 reasoning rules → distillés
 * en 10 presets actionnables pour Klyora).
 *
 * Chaque preset combine : style visuel + palette + typo + effects + reasoning.
 * Sélection runtime par métier + vibe (sport, premium, classic, modern, etc.).
 *
 * Source : /Users/rubensdelbaere/Downloads/ui-ux-pro-max-skill-main
 * (Apache 2.0)
 */

export type DesignPreset = {
  id: string;
  label: string;
  vibe: "sport" | "premium" | "classic" | "modern" | "youth" | "luxury" | "tech" | "artisan" | "wellness" | "racing";
  style: string;          // ex: "Cyberpunk UI", "Kinetic Brutalism"
  fonts: { heading: string; body: string; importUrl: string };
  colors: {
    primary: string;
    accent: string;
    background: string;
    foreground: string;
    muted: string;
    cardBg: string;
  };
  effects: string;        // ex: "Sharp transitions + neon glow"
  bestFor: string[];      // métiers/situations idéaux
  reasoning: string;      // règle UX clef
};

const PRESETS: DesignPreset[] = [
  // 1. RACING SPORT — pour garages indépendants
  {
    id: "racing-sport",
    label: "Racing Sport",
    vibe: "racing",
    style: "Kinetic Brutalism + Cyberpunk hints",
    fonts: {
      heading: "Barlow Condensed",
      body: "Barlow",
      importUrl: "https://fonts.googleapis.com/css2?family=Barlow:wght@400;600;800&family=Barlow+Condensed:wght@600;700;800;900&display=swap",
    },
    colors: {
      primary: "#dc143c",     // Rouge ferrari
      accent: "#facc15",      // Jaune signal
      background: "#0a0a0a",  // Noir charbon
      foreground: "#fafafa",
      muted: "#262626",
      cardBg: "#171717",
    },
    effects: "Hover scale 1.05 + sharp transitions 150ms + neon glow on primary CTA + parallax hero",
    bestFor: ["garage", "concession", "automotive", "motorsport"],
    reasoning: "Bold typography + dark mode OLED + immédiate confiance via stats/témoignages",
  },

  // 2. PREMIUM AUTOMOTIVE — pour concessions Mercedes/BMW/Audi
  {
    id: "premium-automotive",
    label: "Premium Automotive",
    vibe: "premium",
    style: "Modern Dark Cinema + Glassmorphism",
    fonts: {
      heading: "Inter",
      body: "Inter",
      importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap",
    },
    colors: {
      primary: "#0c1e3e",     // Bleu profond
      accent: "#d4af37",      // Or
      background: "#0f0f0f",
      foreground: "#fafafa",
      muted: "#1a1a1a",
      cardBg: "#1c1c1c",
    },
    effects: "Backdrop blur 20px + smooth transitions 300ms + subtle gold accents on hover",
    bestFor: ["concession-luxe", "mercedes-jaguar-aston"],
    reasoning: "Glassmorphism inspire confiance, palette dark luxury évoque haut de gamme",
  },

  // 3. ARTISAN CLASSIQUE — boulangeries, pâtisseries
  {
    id: "artisan-classique",
    label: "Artisan Classique",
    vibe: "artisan",
    style: "Classic Elegant + Storytelling",
    fonts: {
      heading: "EB Garamond",
      body: "Plus Jakarta Sans",
      importUrl: "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,500;0,600;1,500&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap",
    },
    colors: {
      primary: "#c2410c",     // Orange brûlé
      accent: "#f59e0b",      // Ambre
      background: "#fdf8f8",
      foreground: "#1c1b1b",
      muted: "#f5f3ee",
      cardBg: "#ffffff",
    },
    effects: "Serif italic mid-words + soft hover lift + warm gradient washes",
    bestFor: ["boulangerie", "patisserie", "chocolat", "traiteur"],
    reasoning: "Serif Garamond évoque tradition, palette chaude = appétit + savoir-faire",
  },

  // 4. NATURE DISTILLED — instituts beauté, spa
  {
    id: "nature-distilled",
    label: "Nature Distilled",
    vibe: "wellness",
    style: "Nature Distilled + Soft Minimalism",
    fonts: {
      heading: "Cormorant Garamond",
      body: "Manrope",
      importUrl: "https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Manrope:wght@300;400;500;600;700&display=swap",
    },
    colors: {
      primary: "#7e22ce",     // Violet sourd
      accent: "#fae8ff",      // Lavande pâle
      background: "#fdf6fb",
      foreground: "#1c1b1b",
      muted: "#f5f0f7",
      cardBg: "#ffffff",
    },
    effects: "Soft shadows + breathing animations + lavender gradient backgrounds",
    bestFor: ["institut", "spa", "esthetique", "wellness", "fleuriste"],
    reasoning: "Palette pastel + fonts élégantes inspirent sérénité et soin de soi",
  },

  // 5. FASHION FORWARD — coiffeurs, mode
  {
    id: "fashion-forward",
    label: "Fashion Forward",
    vibe: "modern",
    style: "Fashion Forward + Exaggerated Minimalism",
    fonts: {
      heading: "Syne",
      body: "Manrope",
      importUrl: "https://fonts.googleapis.com/css2?family=Syne:wght@500;600;700;800&family=Manrope:wght@400;500;600;700&display=swap",
    },
    colors: {
      primary: "#000000",
      accent: "#facc15",
      background: "#fafafa",
      foreground: "#0a0a0a",
      muted: "#f4f4f5",
      cardBg: "#ffffff",
    },
    effects: "Bold typography + asymmetric layouts + scroll-triggered reveals",
    bestFor: ["coiffeur", "salon", "barber", "mode"],
    reasoning: "Syne moderne géométrique + accent jaune = identité forte, jeune",
  },

  // 6. MODERN PRO — café, restauration
  {
    id: "modern-pro",
    label: "Modern Professional",
    vibe: "modern",
    style: "Modern Professional + Vibrant Block",
    fonts: {
      heading: "Poppins",
      body: "Open Sans",
      importUrl: "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600;700&family=Poppins:wght@500;600;700;800&display=swap",
    },
    colors: {
      primary: "#78350f",
      accent: "#fbbf24",
      background: "#fffbeb",
      foreground: "#1c1b1b",
      muted: "#fef3c7",
      cardBg: "#ffffff",
    },
    effects: "Card hover lift + warm gradients + smooth transitions 200ms",
    bestFor: ["cafe", "restaurant", "brunch", "bar"],
    reasoning: "Couleurs warm food + fonts approachables = ambiance accueillante",
  },

  // 7. HEALTH MEDICAL — ostéo, dentiste, véto
  {
    id: "health-medical",
    label: "Health & Medical",
    vibe: "wellness",
    style: "Inclusive Design + Calm Trust",
    fonts: {
      heading: "Inter",
      body: "Inter",
      importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap",
    },
    colors: {
      primary: "#0891b2",
      accent: "#059669",
      background: "#f0fdfa",
      foreground: "#1c1b1b",
      muted: "#ecfeff",
      cardBg: "#ffffff",
    },
    effects: "Soft shadows + WCAG AAA contrast + clear hierarchy",
    bestFor: ["dentiste", "osteo", "veterinaire", "kine", "medical"],
    reasoning: "Cyan/vert apaisants + accessibilité maximale = confiance médicale",
  },

  // 8. ARTISAN BTP — plombier, électricien, couvreur, menuisier
  {
    id: "artisan-btp",
    label: "Artisan BTP",
    vibe: "classic",
    style: "Brutalist Direct + High Contrast",
    fonts: {
      heading: "Bebas Neue",
      body: "Source Sans 3",
      importUrl: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Source+Sans+3:wght@400;500;600;700&display=swap",
    },
    colors: {
      primary: "#1e40af",
      accent: "#0ea5e9",
      background: "#fafafa",
      foreground: "#0a0a0a",
      muted: "#f4f4f5",
      cardBg: "#ffffff",
    },
    effects: "Hard borders + bold caps headlines + reliability blue palette",
    bestFor: ["plombier", "electricien", "couvreur", "menuisier", "btp"],
    reasoning: "Bebas Neue caps = solidité + bleu confiance = bandeau urgence efficace",
  },

  // 9. SPORTS FITNESS — auto-école, salle de sport
  {
    id: "sports-fitness",
    label: "Sports & Fitness",
    vibe: "youth",
    style: "Vibrant & Block + Motion-Driven",
    fonts: {
      heading: "Barlow Condensed",
      body: "Barlow",
      importUrl: "https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700&family=Barlow+Condensed:wght@700;800;900&display=swap",
    },
    colors: {
      primary: "#1e40af",
      accent: "#facc15",
      background: "#fafafa",
      foreground: "#0a0a0a",
      muted: "#f4f4f5",
      cardBg: "#ffffff",
    },
    effects: "Bold caps + energetic transitions + scroll-triggered animations",
    bestFor: ["autoecole", "fitness", "coach", "sport"],
    reasoning: "Typo condensed + accents fluo = énergie + dynamisme",
  },

  // 10. EPICERIE FINE — produits du terroir
  {
    id: "epicerie-terroir",
    label: "Épicerie du Terroir",
    vibe: "premium",
    style: "Editorial + Nature Distilled",
    fonts: {
      heading: "Playfair Display",
      body: "Inter",
      importUrl: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap",
    },
    colors: {
      primary: "#65a30d",
      accent: "#fbbf24",
      background: "#fefce8",
      foreground: "#1c1b1b",
      muted: "#fef9c3",
      cardBg: "#ffffff",
    },
    effects: "Serif italic + warm gradient + storytelling layout",
    bestFor: ["epicerie", "cave", "terroir", "produits"],
    reasoning: "Serif Playfair + verts/jaunes naturels = artisanat de qualité",
  },
];

/** Sélectionne le meilleur preset pour un métier donné. */
export function selectDesignPreset(metier: string | null | undefined, hint?: { vibe?: DesignPreset["vibe"]; isFranchise?: boolean }): DesignPreset {
  const m = (metier || "").toLowerCase();
  // Si garage franchise → premium-automotive
  if (hint?.isFranchise && /garage|automobile|concession/.test(m)) {
    return PRESETS[1]; // premium-automotive
  }
  // Vibe explicite : prend le 1er preset avec cette vibe
  if (hint?.vibe) {
    const match = PRESETS.find(p => p.vibe === hint.vibe);
    if (match) return match;
  }
  // Match par métier
  for (const p of PRESETS) {
    if (p.bestFor.some(b => m.includes(b))) return p;
  }
  // Fallback : artisan classique
  return PRESETS[2];
}

export { PRESETS };
