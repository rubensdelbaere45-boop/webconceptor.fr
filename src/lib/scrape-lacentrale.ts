/**
 * Scrape les annonces véhicules d'un garage sur La Centrale.
 *
 * Best-effort : si Cloudflare bloque, retourne []. Tom peut configurer
 * SCRAPLING_API_KEY plus tard pour fiabilité.
 *
 * Recherche par : nom du garage (en mot-clé pro) + code postal.
 */
import * as cheerio from "cheerio";

export type LaCentraleVehicle = {
  title: string;       // "Mercedes Classe C 220 d AMG Line 9G-Tronic"
  price?: string;      // "29 990 €"
  year?: string;       // "2021"
  km?: string;         // "45 000 km"
  fuel?: string;       // "Diesel"
  image?: string;      // URL absolu
  url?: string;        // lien fiche La Centrale
  location?: string;   // "Limoges (87)"
};

function abs(p: string, base: string = "https://www.lacentrale.fr"): string {
  try { return new URL(p, base).toString(); } catch { return p; }
}

/**
 * Recherche La Centrale par nom de pro + ville/CP.
 * Fallback gracieux : si HTTP != 200 ou si Cloudflare, retourne [].
 */
export async function scrapeLaCentraleForGarage(opts: {
  garageName: string;
  city?: string | null;
  postalCode?: string | null;
  timeoutMs?: number;
  maxResults?: number;
}): Promise<LaCentraleVehicle[]> {
  const { garageName, city, postalCode } = opts;
  const timeoutMs = opts.timeoutMs ?? 10000;
  const maxResults = opts.maxResults ?? 12;

  // Construit l'URL de recherche
  // La Centrale utilise une URL type :
  // https://www.lacentrale.fr/listing?recherche={mot-clé}
  // Sans paramètres pro, on tape juste le nom du garage en recherche fulltext
  const searchQuery = encodeURIComponent(`${garageName}${city ? ` ${city}` : ""}`);
  const url = `https://www.lacentrale.fr/listing?recherche=${searchQuery}`;

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) {
      console.warn(`[lacentrale] HTTP ${res.status} pour ${garageName}`);
      return [];
    }
    const html = await res.text();
    // Détecte Cloudflare challenge
    if (/Cloudflare|cf-browser-verification|cf-please-wait/i.test(html.slice(0, 5000))) {
      console.warn(`[lacentrale] Cloudflare challenge pour ${garageName}`);
      return [];
    }
    const $ = cheerio.load(html);

    const vehicles: LaCentraleVehicle[] = [];

    // La Centrale utilise des classes dynamiques (Next.js hashed). On cible des patterns
    // génériques : <a> qui contiennent à la fois img + prix
    $("a, article").each((_, el) => {
      if (vehicles.length >= maxResults) return false;
      const $el = $(el);
      const text = $el.text().replace(/\s+/g, " ").trim();
      if (text.length < 30 || text.length > 800) return;
      // Recherche prix
      const priceMatch = text.match(/(\d[\d\s]{2,6})\s*€/);
      if (!priceMatch) return;
      // Recherche année
      const yearMatch = text.match(/\b(20[0-2]\d|201\d)\b/);
      // Recherche km
      const kmMatch = text.match(/(\d[\d\s]{2,6})\s*km/i);
      if (!yearMatch && !kmMatch) return; // pas une fiche véhicule
      // Carburant
      const fuelMatch = text.match(/\b(Diesel|Essence|Hybride|Électrique|GPL|Bicarburation)\b/i);
      // Image principale
      const imgSrc = $el.find("img").first().attr("src") || $el.find("img").first().attr("data-src");
      const image = imgSrc && imgSrc.startsWith("http") ? imgSrc : undefined;
      if (!image) return; // skip si pas d'image
      // URL fiche
      const href = $el.attr("href") || $el.find("a").first().attr("href");
      const fiche = href ? abs(href) : undefined;
      // Titre : 1er h2/h3 du conteneur OU titre extrait du texte (segment avant le prix)
      const heading = $el.find("h2, h3").first().text().trim();
      let title = heading.length > 5 && heading.length < 120
        ? heading
        : text.split(priceMatch[0])[0].slice(-120).trim().split("\n").pop() || "Véhicule";
      title = title.replace(/\s+/g, " ").slice(0, 100);

      // Localisation
      const locMatch = text.match(/([A-Z][a-zéèêà-]+(?:[\s-][A-Z][a-zéèêà-]+)*)\s*\((\d{2,3})\)/);
      const location = locMatch ? `${locMatch[1]} (${locMatch[2]})` : undefined;

      // Dedup par titre+prix
      const price = priceMatch[1].replace(/\s+/g, " ").trim() + " €";
      if (vehicles.some(v => v.title === title && v.price === price)) return;
      vehicles.push({
        title,
        price,
        year: yearMatch ? yearMatch[1] : undefined,
        km: kmMatch ? kmMatch[1].replace(/\s+/g, " ").trim() + " km" : undefined,
        fuel: fuelMatch ? fuelMatch[1].charAt(0).toUpperCase() + fuelMatch[1].slice(1).toLowerCase() : undefined,
        image,
        url: fiche,
        location,
      });
    });

    console.log(`[lacentrale] ${vehicles.length} véhicules trouvés pour ${garageName}`);
    return vehicles;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.warn(`[lacentrale] error pour ${garageName}: ${msg}`);
    return [];
  }
}
