/**
 * Source SIRENE — API publique recherche-entreprises.api.gouv.fr
 *
 * Avantage vs Google Maps / Pages Jaunes :
 *   - 11 millions d'entreprises (vs ~300k commerces référencés Google)
 *   - Date de création disponible → CIBLE entreprises < 6 mois (pas encore de site)
 *   - Code APE précis → ciblage métier exact
 *   - Gratuit, illimité, pas de quota
 *   - Données officielles INSEE mises à jour quotidiennement
 *
 * Stratégie WebConceptor :
 *   "Vous venez de créer votre entreprise — voici votre site offert"
 *   = argumentaire imparable, marché vierge.
 */

export interface SireneCompany {
  siren: string;
  name: string;                 // nom_complet
  address: string | null;       // adresse complète siège
  city: string | null;
  postal_code: string | null;
  ape_code: string | null;      // ex: "43.22A" = plomberie
  ape_label: string | null;     // libellé du code APE
  date_creation: string | null; // YYYY-MM-DD
  is_active: boolean;
  email: string | null;         // souvent absent — à enrichir
  website: string | null;       // souvent absent
}

export interface SireneSearchOptions {
  query?: string;          // texte libre (ex: "plombier")
  codePostal?: string;     // ex: "69001"
  codeCommune?: string;    // ex: "69381" (Lyon)
  departement?: string;    // ex: "69"
  region?: string;         // ex: "84" (Auvergne-Rhône-Alpes)
  codeNaf?: string;        // ex: "43.22A" (plomberie)
  estEntrepreneurIndividuel?: boolean;
  trancheEffectifSalarie?: string; // ex: "00" (0 salarié), "01" (1-2)
  minDateCreation?: string; // YYYY-MM-DD — cible entreprises récentes
  maxDateCreation?: string;
  perPage?: number;        // max 25
  page?: number;
}

// Map des codes NAF/APE pour les métiers WebConceptor
// Source : nomenclature NAF rév. 2 INSEE
export const APE_CODES: Record<string, string[]> = {
  plombier:     ["43.22A", "43.22B"],
  electricien:  ["43.21A"],
  chauffagiste: ["43.22B"],
  menuisier:    ["43.32A", "16.23Z", "31.09A"],
  serrurier:    ["25.72Z", "43.32A"],
  carreleur:    ["43.33Z"],
  peintre:      ["43.34Z"],
  couvreur:     ["43.91A", "43.91B"],
  macon:        ["43.99C", "41.20A", "41.20B"],
  garage:       ["45.20A", "45.20B"],
  carrosserie:  ["45.20A"],
  restaurant:   ["56.10A"],
  fast_food:    ["56.10C"],
  boulangerie:  ["10.71B", "10.71C", "47.24Z"],
  patisserie:   ["10.71D", "10.71B"],
  coiffeur:     ["96.02A"],
  institut:     ["96.02B"],
  fleuriste:    ["47.76Z"],
  glacier:      ["10.52Z", "56.10A"],
  cafe:         ["56.30Z"],
  osteo:        ["86.90E", "86.90F"],
  dentiste:     ["86.23Z"],
  auto_ecole:   ["85.53Z"],
  epicerie:     ["47.11B", "47.11C"],
};

/**
 * Recherche dans la base SIRENE via l'API publique.
 * Retourne jusqu'à 25 résultats par page.
 *
 * Doc API : https://recherche-entreprises.api.gouv.fr/docs/
 */
export async function searchSirene(opts: SireneSearchOptions): Promise<SireneCompany[]> {
  const params = new URLSearchParams();

  if (opts.query) params.set("q", opts.query.slice(0, 200));
  if (opts.codePostal) params.set("code_postal", opts.codePostal);
  if (opts.codeCommune) params.set("code_commune", opts.codeCommune);
  if (opts.departement) params.set("departement", opts.departement);
  if (opts.region) params.set("region", opts.region);
  if (opts.codeNaf) params.set("activite_principale", opts.codeNaf);
  if (opts.estEntrepreneurIndividuel !== undefined) {
    params.set("est_entrepreneur_individuel", String(opts.estEntrepreneurIndividuel));
  }
  if (opts.trancheEffectifSalarie) params.set("tranche_effectif_salarie", opts.trancheEffectifSalarie);
  // ⚠️ recherche-entreprises.api.gouv.fr utilise `date_creation_min` / `date_creation_max`
  // (pas `min_date_creation`). Source : https://recherche-entreprises.api.gouv.fr/docs/
  if (opts.minDateCreation) params.set("date_creation_min", opts.minDateCreation);
  if (opts.maxDateCreation) params.set("date_creation_max", opts.maxDateCreation);
  params.set("per_page", String(Math.min(25, Math.max(1, opts.perPage ?? 25))));
  if (opts.page) params.set("page", String(opts.page));
  params.set("etat_administratif", "A"); // actives uniquement

  const url = `https://recherche-entreprises.api.gouv.fr/search?${params.toString()}`;

  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "WebConceptor/1.0 (contact@webconceptor.fr)" },
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];

    const mapped = results.map((r: Record<string, unknown>) => {
      const siege = (r.siege as Record<string, unknown>) || {};
      const matching = Array.isArray(r.matching_etablissements) ? r.matching_etablissements[0] as Record<string, unknown> : null;
      const etab = matching || siege;
      return {
        siren: String(r.siren || ""),
        name: cleanName(String(r.nom_complet || r.nom_raison_sociale || "")),
        address: (etab.adresse as string) || null,
        city: (etab.libelle_commune as string) || null,
        postal_code: (etab.code_postal as string) || null,
        ape_code: (etab.activite_principale as string) || null,
        ape_label: ((r.activite_principale as Record<string, unknown>)?.libelle as string) || null,
        date_creation: (etab.date_creation as string) || (r.date_creation as string) || null,
        is_active: (etab.etat_administratif as string) === "A",
        email: null,   // L'API publique ne renvoie pas les emails
        website: null, // À enrichir via Scrapling
      };
    });

    // 🛡️ Filtre client de sécurité — au cas où l'API ignorerait silencieusement
    // les paramètres de date. Garantit "entreprise récente" même si l'amont change.
    const filtered = mapped.filter((c: SireneCompany) => {
      if (!c.date_creation) return false; // entreprise sans date = inutile pour notre pitch
      if (opts.minDateCreation && c.date_creation < opts.minDateCreation) return false;
      if (opts.maxDateCreation && c.date_creation > opts.maxDateCreation) return false;
      return true;
    });

    return filtered;
  } catch {
    return [];
  }
}

/**
 * Nettoie le nom_complet : retire SIREN dupliqué, normalise majuscules.
 * Ex : "ISMAEL BOURENNANE-FINAND (BOURENNANE) (IBOU ARTISAN PLOMBIER)"
 *  →   "Ibou Artisan Plombier"
 */
function cleanName(raw: string): string {
  if (!raw) return "";
  // Si parenthèses présentes, prend le nom commercial (dernière parenthèse)
  const matches = raw.match(/\(([^)]+)\)/g);
  if (matches && matches.length > 0) {
    const last = matches[matches.length - 1].slice(1, -1).trim();
    if (last.length > 3) return toTitleCase(last);
  }
  return toTitleCase(raw);
}

function toTitleCase(s: string): string {
  return s.toLowerCase().replace(/(^|\s|-)([a-zàâäéèêëîïôöùûüç])/g, (_, sep, c) => sep + c.toUpperCase());
}
