/**
 * scrapling-client.ts
 * ─────────────────────────────────────────────────────────────
 * Wrapper minimaliste autour du service Scrapling self-hosted sur Railway.
 *
 * URL : https://webconceptorfr-production-cebb.up.railway.app (env: SCRAPLING_URL)
 * Auth : Bearer token (env: SCRAPLING_SECRET)
 *
 * Endpoints :
 *   POST /enrich     {url, tasks:["emails","about","photos"]}
 *   POST /scrape-pj  {activity, location, pages?:1}
 *   GET  /health
 *
 * Utilisé par le diagnostic WebDirector pour récolter des VRAIES données :
 *   - Site existant : emails de contact, "à propos", photos publiées
 *   - Pages Jaunes : confirmation présence + horaires
 * ─────────────────────────────────────────────────────────────
 */

export interface EnrichResult {
  emails: string[];
  about: string | null;
  photos: string[];
  used_stealth: boolean;
  error: string | null;
}

export interface ScrapePjResult {
  results: Array<{
    name: string;
    address: string | null;
    phone: string | null;
    website: string | null;
    activity: string | null;
  }>;
  pages_scraped: number;
  used_stealth: boolean;
  error: string | null;
}

const SCRAPLING_URL = process.env.SCRAPLING_URL || "https://webconceptorfr-production-cebb.up.railway.app";
const SCRAPLING_SECRET = process.env.SCRAPLING_SECRET || "";

export function isScraplingConfigured(): boolean {
  return !!(SCRAPLING_URL && SCRAPLING_SECRET);
}

export async function scraplingEnrich(url: string, tasks: string[] = ["emails", "about", "photos"]): Promise<EnrichResult | null> {
  if (!isScraplingConfigured()) return null;
  if (!url || !/^https?:\/\//i.test(url)) return null;
  try {
    const res = await fetch(`${SCRAPLING_URL}/enrich`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SCRAPLING_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, tasks }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data as EnrichResult;
  } catch {
    return null;
  }
}

export async function scrapingPagesJaunes(activity: string, location: string, pages = 1): Promise<ScrapePjResult | null> {
  if (!isScraplingConfigured()) return null;
  try {
    const res = await fetch(`${SCRAPLING_URL}/scrape-pj`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SCRAPLING_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ activity, location, pages }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function scraplingHealthCheck(): Promise<boolean> {
  if (!SCRAPLING_URL) return false;
  try {
    const res = await fetch(`${SCRAPLING_URL}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}
