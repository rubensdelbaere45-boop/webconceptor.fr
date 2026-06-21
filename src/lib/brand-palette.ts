/**
 * Palette de couleurs "sport" adaptée à la marque dominante d'un garage.
 *
 * Quand on scrape un garage indépendant qui vend par ex. surtout des
 * Ferrari/Maserati → palette rouge/noir racing.
 * Si beaucoup de BMW → bleu/blanc.
 * Si Mercedes → bleu profond/argent.
 * Sinon → rouge ferrari + noir charbon par défaut (vibe sport générique).
 */

export type SportPalette = {
  primary: string;
  accent: string;
  vibe: string; // "racing" | "luxury" | "premium" | "youth" | "classic"
};

/** Map marque → palette sport correspondante. */
const BRAND_PALETTES: Record<string, SportPalette> = {
  Ferrari:        { primary: "#dc143c", accent: "#1a1a1a", vibe: "racing" },
  Lamborghini:    { primary: "#000000", accent: "#facc15", vibe: "youth" },
  Porsche:        { primary: "#d4001a", accent: "#1a1a1a", vibe: "racing" },
  Maserati:       { primary: "#0c1e3e", accent: "#d4af37", vibe: "luxury" },
  Bugatti:        { primary: "#0c2340", accent: "#d4af37", vibe: "luxury" },
  Mercedes:       { primary: "#003388", accent: "#c0c0c0", vibe: "premium" },
  BMW:            { primary: "#0066b2", accent: "#1c1c1c", vibe: "premium" },
  Audi:           { primary: "#bb0a30", accent: "#000000", vibe: "premium" },
  Tesla:          { primary: "#cc0000", accent: "#1a1a1a", vibe: "youth" },
  Aston:          { primary: "#0c2340", accent: "#d4af37", vibe: "luxury" },
  Jaguar:         { primary: "#1d4d36", accent: "#1a1a1a", vibe: "luxury" },
  "Land Rover":   { primary: "#1d4d36", accent: "#c0c0c0", vibe: "luxury" },
  "Range Rover":  { primary: "#1d4d36", accent: "#c0c0c0", vibe: "luxury" },
  Volkswagen:     { primary: "#001e50", accent: "#0066b2", vibe: "premium" },
  Volvo:          { primary: "#003057", accent: "#c0c0c0", vibe: "premium" },
  Peugeot:        { primary: "#1c1c1c", accent: "#dc143c", vibe: "racing" },
  Renault:        { primary: "#efdf00", accent: "#000000", vibe: "youth" },
  Citroën:        { primary: "#dc143c", accent: "#1a1a1a", vibe: "youth" },
  DS:             { primary: "#1a1a1a", accent: "#d4af37", vibe: "luxury" },
  Alfa:           { primary: "#a0001f", accent: "#1a1a1a", vibe: "racing" },
  Fiat:           { primary: "#cc0000", accent: "#1a1a1a", vibe: "youth" },
  Jeep:           { primary: "#1c1c1c", accent: "#c8a45e", vibe: "classic" },
  Ford:           { primary: "#003478", accent: "#1a1a1a", vibe: "youth" },
  Opel:           { primary: "#f7ce30", accent: "#000000", vibe: "youth" },
  Toyota:         { primary: "#eb0a1e", accent: "#1a1a1a", vibe: "youth" },
  Lexus:          { primary: "#1a1a1a", accent: "#b8a26b", vibe: "luxury" },
  Honda:          { primary: "#cc0000", accent: "#1a1a1a", vibe: "youth" },
  Nissan:         { primary: "#c3002f", accent: "#1a1a1a", vibe: "youth" },
  Hyundai:        { primary: "#002c5f", accent: "#c0c0c0", vibe: "premium" },
  Kia:            { primary: "#bb162b", accent: "#1a1a1a", vibe: "youth" },
  Mazda:          { primary: "#a30000", accent: "#1a1a1a", vibe: "premium" },
  Mini:           { primary: "#000000", accent: "#ff5300", vibe: "youth" },
  Smart:          { primary: "#1a1a1a", accent: "#facc15", vibe: "youth" },
  Cupra:          { primary: "#996a51", accent: "#1a1a1a", vibe: "racing" },
  Seat:           { primary: "#9d0a0e", accent: "#1a1a1a", vibe: "youth" },
  Skoda:          { primary: "#4ba82e", accent: "#1a1a1a", vibe: "premium" },
  Subaru:         { primary: "#1f3565", accent: "#dc143c", vibe: "racing" },
  Suzuki:         { primary: "#0a4a99", accent: "#dc143c", vibe: "youth" },
  Dacia:          { primary: "#dcaa42", accent: "#1a1a1a", vibe: "youth" },
};

const DEFAULT_SPORT_PALETTE: SportPalette = {
  primary: "#dc143c", // Rouge ferrari racing
  accent: "#1a1a1a",  // Noir charbon
  vibe: "racing",
};

/**
 * Détecte la marque dominante à partir d'une liste de titres de véhicules
 * et retourne la palette sport adaptée.
 */
export function detectDominantBrandPalette(
  vehicles: Array<{ title?: string }> | null | undefined
): SportPalette {
  if (!vehicles || vehicles.length === 0) return DEFAULT_SPORT_PALETTE;
  const counts: Record<string, number> = {};
  for (const v of vehicles) {
    const t = (v.title || "");
    for (const brand of Object.keys(BRAND_PALETTES)) {
      if (new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(t)) {
        counts[brand] = (counts[brand] || 0) + 1;
      }
    }
  }
  const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
  if (sorted.length === 0) return DEFAULT_SPORT_PALETTE;
  return BRAND_PALETTES[sorted[0][0]] || DEFAULT_SPORT_PALETTE;
}

export { DEFAULT_SPORT_PALETTE };
