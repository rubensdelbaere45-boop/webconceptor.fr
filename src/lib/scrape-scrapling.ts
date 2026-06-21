/**
 * Wrapper Node pour le service Scrapling Railway de Tom.
 *
 * Service FastAPI : https://webconceptorfr-production-cebb.up.railway.app
 * Auth : header bearer SCRAPLING_SECRET (variable Vercel)
 *
 * 2 endpoints utiles :
 *   POST /enrich        → enrichit un site (extract photos/emails/about avec stealth)
 *   POST /scrape-pj     → scrape Pages Jaunes par activité+location
 *
 * RÈGLE D'OR : économe en ressources (Tom paie Railway au usage).
 * - Appelé UNIQUEMENT si le scrape Node a échoué (< 3 photos OU 0 véhicule)
 * - Résultat caché dans site_style_dna.scraplingTriedAt pour éviter re-scrape
 * - Timeout strict 20s pour ne pas bloquer Vercel
 */

export type ScraplingEnrichRequest = {
  url: string;
  tasks?: string[]; // ex: ['photos', 'emails', 'about', 'vehicles']
};

export type ScraplingEnrichResponse = {
  emails?: string[];
  about?: string | null;
  photos?: string[];
  used_stealth?: boolean;
  error?: string | null;
};

function getConfig() {
  const url = (process.env.SCRAPLING_SERVICE_URL || "").replace(/\/+$/, "");
  const secret = process.env.SCRAPLING_SECRET || "";
  return { url, secret, configured: !!url && !!secret };
}

/**
 * Enrichit un site via Scrapling (utilise stealth/anti-bot).
 * Retourne null si pas configuré ou si erreur — caller doit gérer.
 */
export async function scraplingEnrichSite(
  websiteUrl: string,
  tasks: string[] = ["photos", "about"],
  opts: { timeoutMs?: number } = {}
): Promise<ScraplingEnrichResponse | null> {
  const { url, secret, configured } = getConfig();
  if (!configured) {
    console.warn("[scrapling] SCRAPLING_SERVICE_URL ou SCRAPLING_SECRET manquant — skip");
    return null;
  }
  const timeoutMs = opts.timeoutMs ?? 20000;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(`${url}/enrich`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secret}`,
      },
      body: JSON.stringify({ url: websiteUrl, tasks } satisfies ScraplingEnrichRequest),
      signal: controller.signal,
    });
    clearTimeout(t);
    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      console.warn(`[scrapling] HTTP ${res.status} pour ${websiteUrl}: ${txt.slice(0, 200)}`);
      return { error: `HTTP ${res.status}` };
    }
    return (await res.json()) as ScraplingEnrichResponse;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.warn(`[scrapling] error pour ${websiteUrl}: ${msg}`);
    return { error: msg };
  }
}

/** Vrai si SCRAPLING_SECRET + SCRAPLING_SERVICE_URL sont set en env Vercel. */
export function isScraplingConfigured(): boolean {
  return getConfig().configured;
}
