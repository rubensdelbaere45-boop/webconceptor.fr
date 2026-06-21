/**
 * Détecte si un garage est une concession franchise (à éviter pour la prospection)
 * ou un garage indépendant multimarque (cible idéale).
 *
 * Tom : "pas ceux qui sont en franchise comme Volkswagen Skoda, mais des
 * garages multimarques à leur compte". Critères :
 *  - nom commence/contient un nom de marque officielle → franchise probable
 *  - nom contient des mots-clés franchise (concession, distributeur, agent)
 *  - nom multimarque (mécanicien, garage générique, prénom de patron, etc.)
 */

const FRANCHISE_BRAND_NAMES = [
  "Volkswagen", "VW", "Audi", "Skoda", "Seat", "Cupra", "Porsche",
  "BMW", "Mini", "Mercedes", "Mercedes-Benz", "Smart",
  "Renault", "Dacia", "Alpine",
  "Peugeot", "Citroën", "Citroen", "DS",
  "Ford", "Opel",
  "Toyota", "Lexus",
  "Honda", "Nissan", "Infiniti",
  "Hyundai", "Kia",
  "Mazda", "Mitsubishi", "Suzuki",
  "Volvo", "Polestar",
  "Fiat", "Alfa Romeo", "Jeep", "Maserati", "Ferrari",
  "Tesla",
  "Land Rover", "Range Rover", "Jaguar", "Aston Martin", "Bentley", "Bugatti", "Rolls-Royce",
  "MG", "Subaru",
];

const FRANCHISE_KEYWORDS = /\b(concession|distributeur|agent\s+(officiel|exclusif)|succursale|filiale|groupe\s+(LG|ByMyCar|Emil Frey|PSA|Stellantis|BNP|Edenauto|GCA|Bauer|Renault Retail|JEAN-LAIN))/i;

const INDEPENDENT_KEYWORDS = /\b(multimarques?|toutes\s+marques|garage\s+(de|du|des)?\s+[A-Z]|m[eé]canique|auto[\s-]?service|carrosseri|repcars|autocenter|car\s+select|tradition|familial)/i;

export type FranchiseAnalysis = {
  isFranchise: boolean;
  isMultibrand: boolean;
  detectedBrand: string | null;
  confidence: number; // 0-1
  reason: string;
};

export function analyzeGarageFranchise(name: string | null | undefined): FranchiseAnalysis {
  const n = (name || "").trim();
  if (!n) return { isFranchise: false, isMultibrand: false, detectedBrand: null, confidence: 0, reason: "no_name" };

  // Détection mot-clé indépendant explicite (gagne sur franchise)
  if (INDEPENDENT_KEYWORDS.test(n)) {
    return { isFranchise: false, isMultibrand: true, detectedBrand: null, confidence: 0.85, reason: "keyword_independent" };
  }

  // Détection mot-clé franchise explicite
  if (FRANCHISE_KEYWORDS.test(n)) {
    return { isFranchise: true, isMultibrand: false, detectedBrand: null, confidence: 0.9, reason: "keyword_franchise" };
  }

  // Détection nom de marque officielle dans le nom
  for (const brand of FRANCHISE_BRAND_NAMES) {
    const re = new RegExp(`\\b${brand.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (re.test(n)) {
      // Cas spécial : "Garage Mercedes" pour pluri-marques avec une seule mention.
      // Si le nom commence par "Garage" ou "Auto", on considère comme indépendant
      // qui mentionne juste les marques travaillées.
      if (/^(Garage|Auto|M[eé]canique|Carrosseri)/i.test(n)) {
        return { isFranchise: false, isMultibrand: true, detectedBrand: brand, confidence: 0.5, reason: "garage_prefix_with_brand_mention" };
      }
      return { isFranchise: true, isMultibrand: false, detectedBrand: brand, confidence: 0.75, reason: `brand_in_name:${brand}` };
    }
  }

  // Pas de marque détectée → probable indépendant (nom générique)
  return { isFranchise: false, isMultibrand: true, detectedBrand: null, confidence: 0.6, reason: "no_brand_detected" };
}

/** Filtre une liste : ne garde que les indépendants multimarques. */
export function filterIndependents<T extends { name?: string | null }>(garages: T[]): T[] {
  return garages.filter(g => !analyzeGarageFranchise(g.name).isFranchise);
}
