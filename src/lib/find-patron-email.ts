/**
 * Cascade pour trouver l'email du patron d'un garage indépendant.
 *
 * Ordre (du moins coûteux au plus coûteux) :
 *  1. API INSEE / recherche-entreprises (gratuit, pas de clé)
 *     → trouve SIREN + dirigeants. Pas d'email direct, mais parfois.
 *  2. Pages Jaunes via Scrapling Railway (déjà payé)
 *     → POST /scrape-pj avec activité + ville
 *  3. Scrape mentions légales du site si site existe (gratuit)
 *  4. Fallback : email déjà en DB (Vroomly, etc.) ou null
 *
 * Tom : pas de Hunter.io. Ressources gratuites uniquement.
 */

export type EmailFinderResult = {
  email: string | null;
  source: "insee" | "pagesjaunes" | "mentions_legales" | "db_fallback" | null;
  siren?: string | null;
  patronName?: string | null;
  details?: Record<string, unknown>;
};

/** 1. Recherche INSEE par nom + ville (API publique gratuite). */
async function tryInsee(garageName: string, city: string | null): Promise<EmailFinderResult | null> {
  try {
    const q = encodeURIComponent(`${garageName}${city ? " " + city : ""}`);
    const url = `https://recherche-entreprises.api.gouv.fr/search?q=${q}&page=1&per_page=3`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json() as { results?: Array<{ siren?: string; dirigeants?: Array<{ nom?: string; prenoms?: string }>; nom_complet?: string; matching_etablissements?: Array<{ adresse?: string }> }> };
    if (!data.results?.length) return null;
    const first = data.results[0];
    const dirigeant = first.dirigeants?.[0];
    const patronName = dirigeant ? `${dirigeant.prenoms || ""} ${dirigeant.nom || ""}`.trim() : null;
    // INSEE ne renvoie PAS d'email malheureusement. Mais on récup SIREN + dirigeant.
    return {
      email: null,
      source: "insee",
      siren: first.siren || null,
      patronName,
      details: { nom_complet: first.nom_complet, adresse: first.matching_etablissements?.[0]?.adresse },
    };
  } catch {
    return null;
  }
}

/** 2. Pages Jaunes via Scrapling Railway. */
async function tryPagesJaunes(garageName: string, city: string | null): Promise<EmailFinderResult | null> {
  const url = (process.env.SCRAPLING_SERVICE_URL || "").replace(/\/+$/, "");
  const secret = process.env.SCRAPLING_SECRET || "";
  if (!url || !secret) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);
    const res = await fetch(`${url}/scrape-pj`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${secret}`,
      },
      body: JSON.stringify({
        activity: garageName,
        location: city || "France",
        pages: 1,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json() as { results?: Array<{ name?: string; email?: string; phone?: string; address?: string; city?: string }> };
    const firstWithEmail = (data.results || []).find(r => r.email);
    if (firstWithEmail?.email) {
      return {
        email: firstWithEmail.email,
        source: "pagesjaunes",
        details: { name: firstWithEmail.name, address: firstWithEmail.address },
      };
    }
    return null;
  } catch {
    return null;
  }
}

/** 3. Scrape mentions légales du site existant. */
async function tryMentionsLegales(websiteUrl: string | null): Promise<EmailFinderResult | null> {
  if (!websiteUrl) return null;
  try {
    // Cherche /mentions-legales /contact /cgv sur le site
    const candidates = ["/mentions-legales", "/mentions", "/contact", "/about", "/a-propos", "/cgv", "/legal"];
    const base = websiteUrl.replace(/\/+$/, "");
    for (const path of candidates) {
      const url = base + path;
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 6000);
        const res = await fetch(url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; KlyoraBot/1.0)" },
          signal: controller.signal,
        });
        clearTimeout(timeout);
        if (!res.ok) continue;
        const html = await res.text();
        // Skip emails génériques
        const emails = (html.match(/[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [])
          .filter(e => !/no-?reply|contact-form|wordpress|automattic|assistance@|webmaster@|@vroomly|@autosphere|@autoscout24|@example/i.test(e));
        if (emails.length) {
          return { email: emails[0], source: "mentions_legales", details: { found_in_path: path, sample: emails.slice(0, 3) } };
        }
      } catch { /* try next path */ }
    }
    return null;
  } catch {
    return null;
  }
}

/** Cascade complète. Retourne le 1er email trouvé. */
export async function findPatronEmail(opts: {
  garageName: string;
  city?: string | null;
  websiteUrl?: string | null;
  dbEmail?: string | null;
}): Promise<EmailFinderResult> {
  // 1. INSEE (toujours, pour récup SIREN + nom dirigeant)
  const insee = await tryInsee(opts.garageName, opts.city ?? null);

  // 2. Pages Jaunes Scrapling
  const pj = await tryPagesJaunes(opts.garageName, opts.city ?? null);
  if (pj?.email) {
    return { ...pj, siren: insee?.siren ?? undefined, patronName: insee?.patronName ?? undefined };
  }

  // 3. Mentions légales si site existant
  if (opts.websiteUrl) {
    const ml = await tryMentionsLegales(opts.websiteUrl);
    if (ml?.email) {
      return { ...ml, siren: insee?.siren ?? undefined, patronName: insee?.patronName ?? undefined };
    }
  }

  // 4. Fallback DB (Vroomly/Autoscout/etc) si on n'a rien d'autre
  if (opts.dbEmail && !/no-?reply|assistance@|webmaster@|@vroomly|@autosphere|@autoscout24/i.test(opts.dbEmail)) {
    return { email: opts.dbEmail, source: "db_fallback", siren: insee?.siren ?? undefined, patronName: insee?.patronName ?? undefined };
  }

  return { email: null, source: null, siren: insee?.siren ?? undefined, patronName: insee?.patronName ?? undefined };
}
