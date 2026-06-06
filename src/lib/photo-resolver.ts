/**
 * Photo Resolver — sélection robuste des photos pour les maquettes.
 *
 * Priorité (la 1ère valide gagne) :
 *   1. Photos scrapées du prospect (Google Places, Pages Jaunes)
 *      → filtrage des junk patterns (badges, logos, sprites)
 *   2. Unsplash DYNAMIQUE avec mots-clés métier précis
 *      (source.unsplash.com/featured/?keywords)
 *   3. Unsplash STATIC hardcodé (fallback dernier recours)
 *
 * ⚠️ JAMAIS d'image data: vide ou de blank.gif.
 * ⚠️ Toujours garantir au moins 1 image valide.
 */

const JUNK_PATTERNS = [
  /banner/i, /badge/i, /sprite/i, /avatar/i, /favicon/i,
  /button/i, /\bbtn\b/i, /icon.*\d+x\d+/i, /widget/i, /tracking/i,
  /pixel/i, /1x1/i, /spacer/i, /blank/i, /transparent/i,
  /adservice/i, /doubleclick/i, /googletagmanager/i, /analytics/i,
  /facebook.*pixel/i, /fbcdn/i, /twimg/i, /240_240/i, /160x/i, /120x/i,
  /static\.pro\./i, /logo.*\.(png|svg|ico)/i,
];

/**
 * Mots-clés métier pour Unsplash dynamique.
 * Plus ils sont spécifiques, plus les photos collent au métier.
 */
const UNSPLASH_KEYWORDS: Record<string, string[]> = {
  restaurant:    ["french-restaurant", "cuisine-bistro", "plated-food", "wine-glass"],
  gastronomique: ["fine-dining", "plated-dish", "michelin", "elegant-restaurant"],
  brasserie:     ["french-brasserie", "bistro", "wine-bar"],
  bistrot:       ["bistro-france", "cozy-restaurant", "wine-cellar"],
  cafe:          ["parisian-cafe", "espresso", "croissant-coffee", "cafe-terrace"],
  glacier:       ["ice-cream-shop", "gelato", "summer-cone", "artisan-ice-cream"],
  boulangerie:   ["french-bakery", "fresh-bread", "boulangerie-paris", "baguette"],
  patisserie:    ["french-pastry", "macarons", "patisserie-window", "eclair"],
  chocolatier:   ["chocolate-shop", "artisan-chocolate", "truffles", "praline"],
  coiffeur:      ["hair-salon", "hairdresser", "barber-shop-modern", "stylish-hair"],
  institut:      ["beauty-spa", "facial-treatment", "wellness-massage", "skin-care"],
  spa:           ["luxury-spa", "massage-stones", "relaxation", "zen-spa"],
  plombier:      ["plumber-tools", "pipes-modern-bathroom", "wrench-work", "plumbing-repair"],
  electricien:   ["electrician-work", "electrical-panel", "wiring-house", "circuit-breaker"],
  chauffagiste:  ["heating-boiler", "radiator-modern", "furnace-installation"],
  garage:        ["auto-repair", "mechanic-garage", "car-workshop", "automotive-service"],
  carrosserie:   ["body-shop", "car-paint", "automotive-bodywork"],
  menuisier:     ["woodworker", "carpenter-workshop", "wooden-furniture-craft", "custom-cabinets"],
  serrurier:     ["locksmith-tools", "secure-door", "modern-lock", "security-door"],
  carreleur:     ["tile-installation", "bathroom-tiles", "modern-tiles", "tiler-work"],
  peintre:       ["interior-paint", "house-painting", "brush-roller", "wall-paint"],
  couvreur:      ["roofer-work", "modern-roof", "tile-roof", "roofing-construction"],
  macon:         ["mason-work", "brick-laying", "construction-site", "stone-house"],
  charpentier:   ["timber-frame", "wooden-roof-structure", "carpenter-roof"],
  fleuriste:     ["flower-shop", "bouquet-roses", "florist-arrangement", "fresh-flowers"],
  dentiste:      ["dental-office", "modern-dentist", "dentist-chair", "dental-care"],
  osteo:         ["osteopath", "physiotherapy", "massage-therapy", "wellness-treatment"],
  salle_sport:   ["gym-modern", "fitness-class", "weight-training", "crossfit-gym"],
  auto_ecole:    ["driving-lesson", "driving-school", "car-instructor"],
  epicerie:      ["grocery-store", "fresh-produce", "organic-market", "fruits-vegetables"],
  default:       ["small-business", "local-shop-france", "artisan-workshop"],
};

/**
 * Photos hardcodées (dernier fallback, garantie de validité).
 * Issues de mockup-opendesign.ts pour cohérence.
 */
const STATIC_FALLBACK: Record<string, string> = {
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

function isValidPhoto(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  if (url.startsWith("data:") || url.startsWith("blob:")) return false;
  if (!/^https?:\/\//.test(url)) return false;
  return !JUNK_PATTERNS.some((p) => p.test(url));
}

/**
 * URL Unsplash dynamique (Source API publique gratuite).
 * Génère une URL différente à chaque appel (idéal pour photos secondaires variées).
 */
function unsplashDynamic(keywords: string[], width = 2000, height = 1200, seed?: string): string {
  // Format Unsplash Source : https://source.unsplash.com/{w}x{h}/?keyword1,keyword2
  const kw = keywords.slice(0, 4).map((k) => k.replace(/\s+/g, "-")).join(",");
  const dim = `${width}x${height}`;
  const sig = seed ? `?sig=${encodeURIComponent(seed.slice(0, 30))}&${kw}` : `?${kw}`;
  return `https://source.unsplash.com/${dim}/${sig}`;
}

/**
 * Résout la photo HERO (grande image principale) pour un prospect.
 * Priorité : photos scrapées valides → Unsplash dynamique → Static.
 */
export function resolveHeroPhoto(prospectPhotos: string[] | undefined | null, businessType: string): string {
  // 1. Première photo scrapée valide
  if (Array.isArray(prospectPhotos)) {
    for (const p of prospectPhotos) {
      if (isValidPhoto(p)) return p;
    }
  }
  // 2. Unsplash dynamique
  const kws = UNSPLASH_KEYWORDS[businessType] || UNSPLASH_KEYWORDS.default;
  return unsplashDynamic(kws, 2000, 1200);
}

/**
 * Résout N photos SECONDAIRES (galerie, sections, témoignages).
 * Garantit au moins N photos uniques.
 */
export function resolveSecondaryPhotos(
  prospectPhotos: string[] | undefined | null,
  businessType: string,
  count = 6,
  seedPrefix = ""
): string[] {
  const out: string[] = [];

  // 1. Toutes les photos scrapées valides
  if (Array.isArray(prospectPhotos)) {
    for (const p of prospectPhotos) {
      if (isValidPhoto(p) && !out.includes(p)) out.push(p);
      if (out.length >= count) return out;
    }
  }

  // 2. Compléter avec Unsplash dynamique varié
  const kws = UNSPLASH_KEYWORDS[businessType] || UNSPLASH_KEYWORDS.default;
  let i = 0;
  while (out.length < count) {
    const url = unsplashDynamic(kws, 1200, 800, `${seedPrefix}${i++}`);
    out.push(url);
    if (i > 30) break; // safety
  }

  return out;
}

/**
 * Static fallback ultime (utile pour la balise <noscript> ou meta og:image).
 */
export function staticFallbackPhoto(businessType: string): string {
  return STATIC_FALLBACK[businessType] || STATIC_FALLBACK.default;
}

/**
 * Filtre une liste de photos pour ne garder que les valides.
 * Utilisé en amont du stockage Supabase pour éviter d'enregistrer
 * des junk en DB.
 */
export function filterValidPhotos(photos: string[] | undefined | null): string[] {
  if (!Array.isArray(photos)) return [];
  return photos.filter(isValidPhoto);
}
