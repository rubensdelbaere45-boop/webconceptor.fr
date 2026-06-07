/**
 * Client API SIRENE INSEE officielle (https://api.insee.fr/entreprises/sirene/V3.11)
 *
 * AVANTAGE vs API gratuite recherche-entreprises.api.gouv.fr :
 *   - Supporte VRAIMENT le filtre date_creation natif
 *   - Supporte categorieJuridique précis
 *   - 30 req/min (largement assez pour notre usage)
 *   - Données INSEE directes, à jour
 *
 * Activation :
 *   1. Compte gratuit https://api.insee.fr → "Mes applications" → Créer
 *   2. Souscrire à "Sirene - V3.11" (gratuit)
 *   3. Récupérer Consumer Key + Consumer Secret
 *   4. Set sur Vercel :
 *        INSEE_API_KEY    = Consumer Key
 *        INSEE_API_SECRET = Consumer Secret
 *   5. C'est tout. Le code détecte les vars et bascule auto.
 *
 * Le token OAuth2 dure 7 jours par défaut, on le cache en mémoire process.
 */

import type { SireneCompany, SireneSearchOptions } from "./sirene";

const INSEE_BASE = "https://api.insee.fr/entreprises/sirene/V3.11";
const INSEE_TOKEN_URL = "https://api.insee.fr/token";

/** Token caché en mémoire process. Renouvelé automatiquement avant expiration. */
let cachedToken: { value: string; expires_at: number } | null = null;

/** Vrai si les credentials INSEE sont configurées sur Vercel. */
export function isInseeConfigured(): boolean {
  return !!(process.env.INSEE_API_KEY && process.env.INSEE_API_SECRET);
}

/** Renvoie un access token valide (auto-renouvelle si expiré). */
async function getInseeToken(): Promise<string | null> {
  // Token encore valide ?
  if (cachedToken && cachedToken.expires_at > Date.now() + 60_000) {
    return cachedToken.value;
  }

  const key = process.env.INSEE_API_KEY;
  const secret = process.env.INSEE_API_SECRET;
  if (!key || !secret) return null;

  try {
    const basic = Buffer.from(`${key}:${secret}`).toString("base64");
    const res = await fetch(INSEE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const token = data.access_token;
    const expiresIn = (data.expires_in || 604800) * 1000; // défaut 7 jours
    if (!token) return null;
    cachedToken = { value: token, expires_at: Date.now() + expiresIn - 60_000 };
    return token;
  } catch {
    return null;
  }
}

/**
 * Recherche dans la base SIRENE INSEE officielle.
 * Supporte VRAIMENT les filtres date_creation, categorie_juridique, etc.
 *
 * Format query INSEE = syntaxe Lucene :
 *   dateCreationUniteLegale:[2025-01-01 TO 2025-12-31]
 *   activitePrincipaleUniteLegale:43.22A
 *   categorieJuridiqueUniteLegale:5710
 *   codePostalEtablissement:75001
 */
export async function searchInsee(opts: SireneSearchOptions): Promise<SireneCompany[]> {
  const token = await getInseeToken();
  if (!token) return [];

  const clauses: string[] = ["etatAdministratifUniteLegale:A"];

  if (opts.codeNaf) clauses.push(`activitePrincipaleUniteLegale:${opts.codeNaf}`);
  if (opts.codePostal) clauses.push(`codePostalEtablissement:${opts.codePostal}`);
  if (opts.codeCommune) clauses.push(`codeCommuneEtablissement:${opts.codeCommune}`);
  // Département : préfixe du code postal
  if (opts.departement) {
    const dep = opts.departement.padStart(2, "0");
    clauses.push(`codePostalEtablissement:${dep}*`);
  }
  // Dates de création (filtre NATIF — la grosse différence vs API gratuite)
  if (opts.minDateCreation || opts.maxDateCreation) {
    const min = opts.minDateCreation || "*";
    const max = opts.maxDateCreation || "*";
    clauses.push(`dateCreationUniteLegale:[${min} TO ${max}]`);
  }
  // Nature juridique (catégorie juridique INSEE : "5710" = SAS, "5499" = SARL, etc.)
  if (opts.natureJuridique && opts.natureJuridique.length > 0) {
    const njClause = opts.natureJuridique
      .map((n) => `categorieJuridiqueUniteLegale:${n}`)
      .join(" OR ");
    clauses.push(`(${njClause})`);
  }

  const q = clauses.join(" AND ");
  const nombre = Math.min(1000, Math.max(1, opts.perPage ?? 100));
  const debut = ((opts.page ?? 1) - 1) * nombre;

  const url = `${INSEE_BASE}/siret?q=${encodeURIComponent(q)}&nombre=${nombre}&debut=${debut}`;

  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      // Token peut être révoqué silencieusement → on flush le cache
      if (res.status === 401) cachedToken = null;
      return [];
    }
    const data = await res.json();
    const etabs = Array.isArray(data?.etablissements) ? data.etablissements : [];
    return etabs.map(mapInseeEtablissement).filter(Boolean) as SireneCompany[];
  } catch {
    return [];
  }
}

interface InseeEtablissement {
  siren?: string;
  siret?: string;
  uniteLegale?: {
    denominationUniteLegale?: string | null;
    nomUniteLegale?: string | null;
    prenom1UniteLegale?: string | null;
    dateCreationUniteLegale?: string;
    activitePrincipaleUniteLegale?: string;
    categorieJuridiqueUniteLegale?: string;
    etatAdministratifUniteLegale?: string;
  };
  adresseEtablissement?: {
    numeroVoieEtablissement?: string | null;
    typeVoieEtablissement?: string | null;
    libelleVoieEtablissement?: string | null;
    codePostalEtablissement?: string;
    libelleCommuneEtablissement?: string;
  };
  dateCreationEtablissement?: string;
}

function mapInseeEtablissement(e: InseeEtablissement): SireneCompany | null {
  if (!e?.siren) return null;
  const ul = e.uniteLegale || {};
  const adr = e.adresseEtablissement || {};

  // Reconstruit le nom : denominationUniteLegale (société) OU prenom + nom (EI)
  const denom = ul.denominationUniteLegale;
  const fullName = denom
    ? denom
    : `${ul.prenom1UniteLegale || ""} ${ul.nomUniteLegale || ""}`.trim();
  if (!fullName) return null;

  // Reconstruit l'adresse
  const addr = [adr.numeroVoieEtablissement, adr.typeVoieEtablissement, adr.libelleVoieEtablissement]
    .filter(Boolean).join(" ").trim() || null;

  return {
    siren: e.siren,
    name: titleCase(fullName),
    address: addr,
    city: adr.libelleCommuneEtablissement || null,
    postal_code: adr.codePostalEtablissement || null,
    ape_code: ul.activitePrincipaleUniteLegale || null,
    ape_label: null,
    date_creation: ul.dateCreationUniteLegale || e.dateCreationEtablissement || null,
    nature_juridique: ul.categorieJuridiqueUniteLegale || null,
    nature_juridique_label: null,
    is_active: ul.etatAdministratifUniteLegale === "A",
    email: null,
    website: null,
  };
}

function titleCase(s: string): string {
  return s.toLowerCase().replace(/(^|\s|-)([a-zàâäéèêëîïôöùûüç])/g, (_, sep, c) => sep + c.toUpperCase());
}
