/* ══════════════════════════════════════════
   SOURCE : OpenStreetMap (via Overpass API)
   Gratuit, illimité, dataset énorme. Trouve tous les commerces
   cartographiés par la communauté OSM — souvent plus complet que
   Google Places sur les petites villes et les quartiers.

   Endpoint : https://overpass-api.de/api/interpreter
   Syntaxe : Overpass QL
   Doc : https://wiki.openstreetmap.org/wiki/Overpass_API
   ══════════════════════════════════════════ */

export interface OverpassResult {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  website: string;
  email: string; // OSM a parfois des emails dans les tags
  lat: number;
  lng: number;
}

// Mapping business_type → tags OSM (amenity ou shop)
// Doc tags : https://wiki.openstreetmap.org/wiki/Map_features
const BUSINESS_TO_OSM_TAGS: Record<string, string[]> = {
  restaurant:   [`amenity=restaurant`, `amenity=fast_food`, `amenity=pub`, `amenity=bar`],
  boulangerie:  [`shop=bakery`],
  patisserie:   [`shop=pastry`, `shop=confectionery`],
  cafe:         [`amenity=cafe`],
  glacier:      [`amenity=ice_cream`, `shop=ice_cream`],
  coiffeur:     [`shop=hairdresser`],
  institut:     [`shop=beauty`, `shop=cosmetics`, `leisure=spa`],
  plombier:     [`craft=plumber`],
  electricien:  [`craft=electrician`],
  garage:       [`shop=car_repair`, `amenity=car_repair`],
  dentiste:     [`amenity=dentist`, `healthcare=dentist`],
  osteo:        [`healthcare=physiotherapist`, `healthcare=alternative`],
  salle_sport:  [`leisure=fitness_centre`, `leisure=sports_centre`],
  fleuriste:    [`shop=florist`],
  auto_ecole:   [`amenity=driving_school`],
  epicerie:     [`shop=convenience`, `shop=grocery`, `shop=supermarket`],
};

/**
 * Recherche des commerces dans OpenStreetMap pour une ville donnée.
 * Retourne jusqu'à 50 résultats avec leurs coordonnées et tags.
 */
export async function searchOverpass(
  businessType: string,
  city: string,
  maxResults = 50
): Promise<OverpassResult[]> {
  const tags = BUSINESS_TO_OSM_TAGS[businessType];
  if (!tags || !tags.length) return [];
  if (!city) return [];

  try {
    // Construction de la query Overpass QL
    // 1. On définit la zone via "area[name='city']"
    // 2. On récupère les nodes + ways qui matchent nos tags dans cette zone
    // 3. On sort seulement les centres (pour les ways) et le tout
    const tagQueries = tags.map((tag) => {
      const [key, val] = tag.split("=");
      return `
        node["${key}"="${val}"](area.searchArea);
        way["${key}"="${val}"](area.searchArea);
      `;
    }).join("");

    const query = `
[out:json][timeout:25];
area["name"="${escapeOverpass(city)}"]["boundary"="administrative"]->.searchArea;
(
  ${tagQueries}
);
out center tags ${maxResults};
`;

    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) return [];

    const data = await res.json();
    const elements = Array.isArray(data.elements) ? data.elements : [];

    return elements
      .map((el: unknown) => parseElement(el))
      .filter((r: OverpassResult | null): r is OverpassResult => r !== null && r.name.length >= 2);
  } catch {
    return [];
  }
}

function escapeOverpass(s: string): string {
  // Overpass QL accepte les strings entre quotes ; on évite les injections
  return s.replace(/["\\]/g, "\\$&").slice(0, 60);
}

function parseElement(el: unknown): OverpassResult | null {
  if (typeof el !== "object" || el === null) return null;
  const e = el as {
    lat?: number; lon?: number;
    center?: { lat?: number; lon?: number };
    tags?: Record<string, string>;
  };

  const tags = e.tags || {};
  const name = String(tags.name || tags["brand"] || "").trim();
  if (!name || name.length < 2) return null;

  const lat = typeof e.lat === "number" ? e.lat : e.center?.lat;
  const lng = typeof e.lon === "number" ? e.lon : e.center?.lon;

  // Adresse reconstituée depuis addr:housenumber + addr:street
  const street = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ").trim();
  const postalCode = tags["addr:postcode"] || "";
  const city = tags["addr:city"] || "";
  const address = [street, postalCode, city].filter(Boolean).join(" ");

  const phone = (tags.phone || tags["contact:phone"] || "").trim();
  const website = (tags.website || tags["contact:website"] || tags.url || "").trim();
  const email = (tags.email || tags["contact:email"] || "").trim();

  return {
    name,
    address,
    city,
    postalCode,
    phone,
    website: website.startsWith("http") ? website : (website ? `https://${website}` : ""),
    email,
    lat: typeof lat === "number" ? lat : 0,
    lng: typeof lng === "number" ? lng : 0,
  };
}
