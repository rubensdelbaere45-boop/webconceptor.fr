/**
 * Générateur d'entreprises FICTIVES pour vidéos TikTok.
 *
 * ⚠️ JAMAIS de vraies entreprises — risque de plainte (diffamation,
 * usage non autorisé du nom). On invente des noms plausibles à partir
 * de prénoms communs + métier, sans matcher d'enseigne réelle.
 *
 * On garde une liste de noms générés en mémoire pour éviter les doublons
 * dans une session. Pour la persistance, voir table `mockup_videos`.
 */

const PRENOMS = [
  "Léopold", "Augustin", "Théodore", "Aurélien", "Côme",
  "Bénédicte", "Margaux", "Joséphine", "Adélaïde", "Romane",
  "Hippolyte", "Octave", "Eulalie", "Aliénor", "Clovis",
];

const ADJECTIFS = [
  "du Vieux Port", "des Halles", "de la Place", "du Marché",
  "de la Fontaine", "des Tilleuls", "du Parvis", "de la Tour",
];

const VILLES_FICTIVES = [
  "Beaumont-sur-Lac", "Saint-Verny", "Villevigne", "Montrelais",
  "La Combelette", "Auberives", "Roussac-le-Bourg", "Saint-Florent-en-Vaux",
];

export interface FakeBusiness {
  name: string;
  type: string;          // "plombier" | "boulangerie" | ...
  typeFr: string;        // libellé FR pour narration
  city: string;
  story: string;         // 1 phrase de contexte ("vient d'ouvrir", "fête ses 20 ans")
}

const TYPES: Array<{ key: string; fr: string; templates: string[] }> = [
  { key: "plombier", fr: "plombier-chauffagiste", templates: [
    "Plomberie {prenom}", "Atelier {prenom}", "{prenom} Plomberie", "Plomberie {adj}",
  ]},
  { key: "boulangerie", fr: "boulangerie artisanale", templates: [
    "Boulangerie {prenom}", "Le Pain de {prenom}", "Boulangerie {adj}", "Maison {prenom}",
  ]},
  { key: "menuisier", fr: "menuisier-ébéniste", templates: [
    "Menuiserie {prenom}", "Atelier {prenom}", "Bois & {prenom}", "Menuiserie {adj}",
  ]},
  { key: "coiffeur", fr: "salon de coiffure", templates: [
    "Salon {prenom}", "Coiffure {prenom}", "Studio {prenom}", "Salon {adj}",
  ]},
  { key: "restaurant", fr: "restaurant traditionnel", templates: [
    "Chez {prenom}", "Restaurant {prenom}", "La Table de {prenom}", "Auberge {adj}",
  ]},
  { key: "fleuriste", fr: "fleuriste de quartier", templates: [
    "Fleurs de {prenom}", "Atelier Floral {prenom}", "Fleuriste {adj}",
  ]},
];

const STORIES = [
  "vient d'ouvrir son atelier",
  "fête ses 10 ans cette année",
  "veut moderniser sa communication",
  "vient de reprendre l'affaire familiale",
  "cherche à toucher une nouvelle clientèle",
  "lance son activité après 15 ans en entreprise",
];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateFakeBusiness(seed?: string): FakeBusiness {
  // seed permet de générer la même entreprise pour une même clé (idempotence)
  if (seed) {
    let h = 0;
    for (const c of seed) h = (h * 31 + c.charCodeAt(0)) | 0;
    Math.random = mulberry32(Math.abs(h));
  }

  const type = pick(TYPES);
  const tpl = pick(type.templates);
  const name = tpl
    .replace("{prenom}", pick(PRENOMS))
    .replace("{adj}", pick(ADJECTIFS));

  return {
    name,
    type: type.key,
    typeFr: type.fr,
    city: pick(VILLES_FICTIVES),
    story: pick(STORIES),
  };
}

// PRNG déterministe pour les seeds
function mulberry32(seed: number): () => number {
  let a = seed;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
