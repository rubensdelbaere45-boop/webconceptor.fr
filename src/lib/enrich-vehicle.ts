/**
 * Enrichit les données d'un véhicule scrapé avec :
 * - Description AI-style (basée sur titre + année + km + énergie)
 * - Consommation moyenne (par énergie)
 * - Coût plein réservoir / charge complète
 * - Autonomie estimée
 * - Coût pour 100 km
 *
 * Tom : "chaque voiture qui va sur le site, il faut ajouter une plus-value
 * en mettant combien va coûter un plein etc. Faut vraiment qu'il y ait
 * un agent qui prenne les informations et qui décrit un maximum la voiture
 * pour que le client se dise 'OK c'est la voiture qu'il me faut'".
 */

export type EnrichedVehicle = {
  // Données originales
  title: string;
  price?: string;
  priceNumber?: number;
  year?: string;
  km?: string;
  kmNumber?: number;
  fuel?: string;
  fuelKind: "diesel" | "essence" | "hybride" | "electrique" | "gpl" | "unknown";
  image?: string;
  url?: string;
  // Enrichissements
  brand?: string;
  description: string;
  highlights: string[]; // 3 bullets vendeurs
  consumption: { value: number; unit: "L/100km" | "kWh/100km" }; // moyenne estimée
  tankCapacity: { value: number; unit: "L" | "kWh" }; // réservoir/batterie
  fullPrice: { value: number; unit: "€" }; // coût plein
  rangeKm: number; // autonomie estimée
  costPer100km: number; // coût/100km
  cleanedTitle: string; // titre sans bruit
};

// Fuel costs (France 2026 moyens)
const FUEL_PRICES_EUR = {
  diesel: 1.85,
  essence: 1.95,
  hybride: 1.95,
  electrique: 0.25,
  gpl: 1.20,
};

// Consommations moyennes par énergie (estimation conservatrice)
const CONSUMPTION_AVG = {
  diesel: 6.0,
  essence: 7.0,
  hybride: 4.0,
  electrique: 18.0, // kWh/100km
  gpl: 8.0,
};

// Réservoirs typiques (litres ou kWh selon énergie)
const TANK_CAPACITY = {
  diesel: 55,
  essence: 50,
  hybride: 45,
  electrique: 70, // kWh batterie
  gpl: 60,
};

function detectFuelKind(fuel?: string, title?: string): EnrichedVehicle["fuelKind"] {
  const s = `${fuel || ""} ${title || ""}`.toLowerCase();
  if (/electric|[eé]lectrique|\bev\b|bev|pure[\s-]?elec|e-tron|id\.?\d|mustang mach|tesla/.test(s)) return "electrique";
  if (/hybride|hybrid|phev|hybr/.test(s)) return "hybride";
  if (/diesel|hdi|tdi|cdi|dci|cdti|d4d|dtec/.test(s)) return "diesel";
  if (/gpl|bicarbur/.test(s)) return "gpl";
  if (/essence|tsi|tfsi|i-?vtec|gasolin|tce|puretech|petrol|gpf/.test(s)) return "essence";
  return "unknown";
}

function detectBrand(title: string): string | null {
  const brands = ["Mercedes", "BMW", "Audi", "Volkswagen", "VW", "Peugeot", "Renault", "Citroën", "DS", "Ford", "Opel", "Fiat", "Toyota", "Honda", "Nissan", "Hyundai", "Kia", "Mazda", "Mitsubishi", "Suzuki", "Skoda", "Seat", "Volvo", "Mini", "Smart", "Tesla", "Porsche", "Jeep", "Alfa Romeo", "Dacia", "Lexus", "Cupra", "Polestar", "MG"];
  for (const b of brands) {
    if (new RegExp(`\\b${b.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(title)) return b;
  }
  return null;
}

function parseNumber(s?: string): number {
  if (!s) return 0;
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

/** Génère une description AI-style pour un véhicule. */
function buildDescription(opts: { title: string; year?: string; km?: number; fuelKind: EnrichedVehicle["fuelKind"]; brand?: string | null }): string {
  const { title, year, km, fuelKind, brand } = opts;
  const fuelLabel = {
    diesel: "diesel sobre",
    essence: "essence souple",
    hybride: "hybride économique",
    electrique: "100% électrique",
    gpl: "bicarburation GPL",
    unknown: "véhicule",
  }[fuelKind];
  const ageWord = year ? (parseInt(year, 10) >= new Date().getFullYear() - 3 ? "récente" : (parseInt(year, 10) >= new Date().getFullYear() - 7 ? "bien entretenue" : "éprouvée")) : "soignée";
  const kmWord = km && km > 0 ? (km < 50000 ? "faible kilométrage" : km < 100000 ? "kilométrage maîtrisé" : "kilométrage normal pour son âge") : "carnet d'entretien suivi";
  const brandWord = brand ? `${brand} ` : "";
  return `${brandWord}${ageWord}${year ? ` de ${year}` : ""}, motorisation ${fuelLabel}, ${kmWord}. Véhicule contrôlé technique en règle, garantie incluse, financement possible. Essai gratuit sur rendez-vous.`;
}

/** Génère 3 highlights vendeurs adaptés. */
function buildHighlights(opts: { fuelKind: EnrichedVehicle["fuelKind"]; year?: string; km?: number; priceNumber?: number }): string[] {
  const { fuelKind, year, km, priceNumber } = opts;
  const highlights: string[] = [];
  const currentYear = new Date().getFullYear();
  if (year && parseInt(year, 10) >= currentYear - 3) highlights.push("✓ Modèle récent (moins de 3 ans)");
  if (km && km > 0 && km < 60000) highlights.push("✓ Faible kilométrage");
  if (fuelKind === "electrique") highlights.push("✓ Zéro émission, écolo & économique");
  else if (fuelKind === "hybride") highlights.push("✓ Économies carburant (jusqu'à 40%)");
  else if (fuelKind === "diesel" && km && km < 150000) highlights.push("✓ Moteur diesel longévité éprouvée");
  if (priceNumber && priceNumber < 15000) highlights.push("✓ Excellent rapport qualité/prix");
  if (highlights.length < 3) highlights.push("✓ Garantie écrite incluse");
  if (highlights.length < 3) highlights.push("✓ Contrôle technique à jour");
  if (highlights.length < 3) highlights.push("✓ Financement & reprise possibles");
  return highlights.slice(0, 3);
}

/** Enrichit un véhicule avec consommation / coûts / description. */
export function enrichVehicle(v: {
  title: string;
  price?: string;
  year?: string;
  km?: string;
  fuel?: string;
  image?: string;
  url?: string;
}): EnrichedVehicle {
  const fuelKind = detectFuelKind(v.fuel, v.title);
  const brand = detectBrand(v.title);
  const priceNumber = parseNumber(v.price);
  const kmNumber = parseNumber(v.km);
  const cleanedTitle = v.title.replace(/\s+/g, " ").trim();

  // Consommation + autonomie + coût
  const isElectric = fuelKind === "electrique";
  const consUnit = isElectric ? "kWh/100km" : "L/100km";
  const tankUnit = isElectric ? "kWh" : "L";
  const consVal = CONSUMPTION_AVG[fuelKind === "unknown" ? "essence" : fuelKind];
  const tankVal = TANK_CAPACITY[fuelKind === "unknown" ? "essence" : fuelKind];
  const fuelPrice = FUEL_PRICES_EUR[fuelKind === "unknown" ? "essence" : fuelKind];
  const fullPrice = Math.round(tankVal * fuelPrice);
  const rangeKm = Math.round((tankVal / consVal) * 100);
  const costPer100km = Math.round(consVal * fuelPrice * 100) / 100;

  return {
    title: v.title,
    price: v.price,
    priceNumber: priceNumber || undefined,
    year: v.year,
    km: v.km,
    kmNumber: kmNumber || undefined,
    fuel: v.fuel,
    fuelKind,
    image: v.image,
    url: v.url,
    brand: brand || undefined,
    cleanedTitle,
    description: buildDescription({ title: cleanedTitle, year: v.year, km: kmNumber, fuelKind, brand }),
    highlights: buildHighlights({ fuelKind, year: v.year, km: kmNumber, priceNumber }),
    consumption: { value: consVal, unit: consUnit as "L/100km" | "kWh/100km" },
    tankCapacity: { value: tankVal, unit: tankUnit as "L" | "kWh" },
    fullPrice: { value: fullPrice, unit: "€" },
    rangeKm,
    costPer100km,
  };
}

/** Enrichit en bulk. */
export function enrichVehicles(vehicles: Array<Parameters<typeof enrichVehicle>[0]>): EnrichedVehicle[] {
  return vehicles.map(enrichVehicle);
}
