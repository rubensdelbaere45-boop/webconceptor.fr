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
/**
 * ⚠️ POLITIQUE STRICTE NO-PEOPLE (juin 2026) :
 * Aucune photo de visage humain dans une maquette — un cas passé nous a coûté
 * un préjudice. Les keywords ci-dessous sont volontairement orientés
 * "interior / product / object / texture" pour éviter les portraits.
 */
const UNSPLASH_KEYWORDS: Record<string, string[]> = {
  restaurant:    ["empty-restaurant-interior", "plated-dish", "wine-glass-table", "elegant-dining-room"],
  gastronomique: ["plated-dish-fine-dining", "michelin-plate", "minimalist-table", "wine-cellar"],
  brasserie:    ["empty-brasserie", "wine-bar-interior", "bistro-table", "pastis-glass"],
  bistrot:      ["bistro-interior", "wine-cellar", "table-setting", "wine-bottles"],
  cafe:         ["empty-cafe-interior", "espresso-cup", "croissant-coffee", "latte-art"],
  glacier:      ["gelato-display", "ice-cream-cone", "sorbet-bowl", "ice-cream-shop-window"],
  boulangerie:  ["fresh-bread-loaves", "baguette-display", "boulangerie-window", "wooden-bread-counter"],
  patisserie:   ["macarons-display", "patisserie-window", "eclair-row", "tart-display"],
  chocolatier:  ["chocolate-truffles", "artisan-chocolate-bar", "praline-display", "cocoa-beans"],
  coiffeur:     ["empty-salon-interior", "scissors-comb", "hair-products-display", "modern-salon-design"],
  institut:     ["spa-stones-flat-lay", "candles-relaxation", "essential-oils-display", "salon-interior-empty"],
  spa:          ["spa-stones-zen", "candles-bamboo", "essential-oils", "spa-treatment-room-empty"],
  plombier:     ["pipes-wrench", "modern-bathroom-empty", "bathroom-fixtures", "plumbing-tools-flat"],
  electricien:  ["electrical-panel", "circuit-breaker", "wiring-tools", "modern-light-installation"],
  chauffagiste: ["heating-boiler-installation", "modern-radiator", "thermostat-modern", "heating-system"],
  garage:       ["auto-workshop-interior", "car-on-lift", "mechanic-tools-flat", "tire-stack"],
  carrosserie:  ["car-paint-spray-booth", "polished-car-bodywork", "auto-painting-tools"],
  menuisier:    ["wood-workshop-interior", "wooden-furniture-detail", "carpenter-tools-flat", "wood-grain"],
  serrurier:    ["modern-lock-detail", "secure-door-installation", "lock-tools-flat"],
  carreleur:    ["tile-pattern", "modern-bathroom-tiles", "tile-installation-detail"],
  peintre:      ["interior-paint-colors", "brush-roller-flat", "wall-paint-texture", "painted-room-empty"],
  couvreur:     ["modern-roof-tiles", "roof-construction", "slate-roof-pattern"],
  macon:        ["stone-house-detail", "construction-site", "brick-wall-pattern"],
  charpentier:  ["timber-frame-structure", "wooden-roof-beam", "carpentry-detail"],
  fleuriste:    ["flower-bouquet-arrangement", "florist-shop-window", "rose-display", "wildflower-vase"],
  dentiste:     ["dental-office-interior-empty", "dental-tools-flat", "modern-dental-chair-empty"],
  osteo:        ["wellness-room-empty", "treatment-table-empty", "spa-stones-flat"],
  salle_sport:  ["empty-gym-interior", "dumbbell-rack", "modern-gym-equipment", "fitness-studio-empty"],
  auto_ecole:   ["dashboard-detail", "driving-school-car-exterior", "steering-wheel-close-up"],
  epicerie:     ["fresh-produce-display", "fruits-vegetables-stall", "organic-market-shelf", "artisan-products"],
  default:      ["artisan-workshop-empty", "small-shop-window", "storefront-france", "boutique-interior"],
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
  institut: "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=2000&q=90&auto=format&fit=crop",
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
 *
 * ⚠️ POLITIQUE NO-PEOPLE (juin 2026) : les photos scrapées du prospect
 * (Google Places, Pages Jaunes) sont volontairement IGNORÉES — elles
 * peuvent contenir des visages (gérant, employés, clients) et un cas
 * passé nous a coûté un préjudice. Seule Unsplash dynamique (avec
 * keywords orientés intérieur/produit/objet) est utilisée.
 */
export function resolveHeroPhoto(_prospectPhotos: string[] | undefined | null, businessType: string): string {
  const kws = UNSPLASH_KEYWORDS[businessType] || UNSPLASH_KEYWORDS.default;
  return unsplashDynamic(kws, 2000, 1200);
}

/**
 * Résout N photos SECONDAIRES (galerie, sections, témoignages).
 * Garantit au moins N photos uniques.
 */
export function resolveSecondaryPhotos(
  _prospectPhotos: string[] | undefined | null,
  businessType: string,
  count = 6,
  seedPrefix = ""
): string[] {
  // POLITIQUE NO-PEOPLE : on n'utilise PAS les photos scrapées (visages potentiels).
  // 100% Unsplash dynamique avec keywords orientés intérieur/objet/produit.
  const out: string[] = [];
  const kws = UNSPLASH_KEYWORDS[businessType] || UNSPLASH_KEYWORDS.default;
  let i = 0;
  while (out.length < count) {
    const url = unsplashDynamic(kws, 1200, 800, `${seedPrefix}${i++}`);
    out.push(url);
    if (i > 30) break;
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
