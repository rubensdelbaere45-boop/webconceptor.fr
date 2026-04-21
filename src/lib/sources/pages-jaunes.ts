/* ══════════════════════════════════════════
   SOURCE : Pages Jaunes
   Scraping HTML des résultats de recherche.
   Pages Jaunes n'a pas d'API publique gratuite, donc on parse le HTML
   de leur page de résultats. Rate-limit respectueux + User-Agent légitime.
   ══════════════════════════════════════════ */

import { safeFetch } from "@/lib/security";

export interface PagesJaunesResult {
  name: string;
  address: string;
  city: string;
  postalCode: string;
  phone: string;
  website: string;
}

/**
 * Scrape Pages Jaunes pour une query + localisation.
 * Retourne jusqu'à 20 résultats.
 * Timeout 15s, User-Agent navigateur.
 */
export async function searchPagesJaunes(activity: string, location: string): Promise<PagesJaunesResult[]> {
  try {
    const quoiqui = encodeURIComponent(activity.slice(0, 80));
    const ou = encodeURIComponent(location.slice(0, 60));
    const url = `https://www.pagesjaunes.fr/annuaire/chercherlespros?quoiqui=${quoiqui}&ou=${ou}`;

    const res = await safeFetch(url, {
      timeoutMs: 15000,
      maxRedirects: 3,
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
      },
    });

    if (!res.ok) return [];
    const html = await res.text();
    if (html.length < 1000) return []; // page de blocage anti-bot

    return parseResults(html);
  } catch {
    return [];
  }
}

/**
 * Parse les résultats HTML Pages Jaunes.
 * La structure HTML peut changer — on utilise des regex défensives qui tolèrent
 * les variations mineures. Si le parseur trouve 0 résultat, on retourne [].
 */
function parseResults(html: string): PagesJaunesResult[] {
  const results: PagesJaunesResult[] = [];

  // Pages Jaunes structure : chaque résultat est un <article class="bi ...">
  // On repère les blocs article et on extrait les infos.
  const articleBlocks = html.split(/<article[^>]+class="[^"]*\bbi\b/gi);
  // Premier split = header, le reste contient les blocs résultats

  for (let i = 1; i < articleBlocks.length && results.length < 25; i++) {
    const block = articleBlocks[i];

    // Nom : <a class="...denomination..." title="Nom du commerce">
    // ou <h3 ...>Nom</h3>
    const nameMatch = block.match(/class="[^"]*denomination[^"]*"[^>]*title="([^"]+)"/i)
      || block.match(/<h3[^>]*>([^<]+)<\/h3>/i)
      || block.match(/itemprop="name"[^>]*>([^<]+)</i);
    const name = nameMatch ? decodeHtmlEntities(nameMatch[1]).trim() : "";
    if (!name || name.length < 2) continue;

    // Adresse : <span itemprop="streetAddress"> ou <a ... class="address">
    const streetMatch = block.match(/itemprop="streetAddress"[^>]*>([^<]+)</i)
      || block.match(/class="[^"]*address[^"]*"[^>]*>\s*<[^>]*>([^<]+)</i);
    const cpMatch = block.match(/itemprop="postalCode"[^>]*>([^<]+)</i)
      || block.match(/>(\d{5})\s+[A-ZÀ-ÿ]/);
    const cityMatch = block.match(/itemprop="addressLocality"[^>]*>([^<]+)</i);

    const street = streetMatch ? decodeHtmlEntities(streetMatch[1]).trim() : "";
    const postalCode = cpMatch ? cpMatch[1].trim() : "";
    const city = cityMatch ? decodeHtmlEntities(cityMatch[1]).trim() : "";
    const address = [street, postalCode, city].filter(Boolean).join(" ");

    // Téléphone : <span class="...-num"> ou data-phone="..."
    const phoneMatch = block.match(/class="[^"]*(num-tel|coord-numero)[^"]*"[^>]*>\s*([^<]+)/i)
      || block.match(/itemprop="telephone"[^>]*>([^<]+)</i)
      || block.match(/data-phone="([^"]+)"/i)
      || block.match(/"phoneNumber":"([^"]+)"/i);
    const phone = phoneMatch ? cleanPhone(decodeHtmlEntities(phoneMatch[phoneMatch.length - 1])) : "";

    // Site web : lien externe "click-to-website"
    const websiteMatch = block.match(/href="([^"]+)"[^>]*class="[^"]*(site-internet|website-link|lvs-link)/i)
      || block.match(/data-pjlb='\{[^}]*"url":"([^"]+)"[^}]*"type":"website"/i)
      || block.match(/itemprop="url"[^>]*href="([^"]+)"/i);
    let website = websiteMatch ? decodeHtmlEntities(websiteMatch[1]).trim() : "";
    // Certains liens sont de la forme /pj.cgi?XYZ qui redirigent → on garde que les https://
    if (website && !/^https?:\/\//i.test(website)) website = "";

    results.push({
      name,
      address,
      city,
      postalCode,
      phone,
      website,
    });
  }

  return results;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function cleanPhone(raw: string): string {
  // Garde chiffres, espaces, points, tirets, +
  return raw
    .replace(/\s+/g, " ")
    .replace(/[^\d +.\-()]/g, "")
    .trim()
    .slice(0, 20);
}
