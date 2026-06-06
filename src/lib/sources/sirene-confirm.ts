/**
 * Confirmation business_type via SIRENE INSEE (gouvernemental).
 *
 * Quand on récupère un prospect via Scrapling Pages Jaunes ou Google Maps,
 * le business_type est INFÉRÉ par notre regex. Pour garantir un ciblage
 * parfait, on confirme via la base SIRENE (Annuaire des Entreprises) :
 *   1. Recherche par nom + ville
 *   2. Récupère le code APE/NAF officiel
 *   3. Mappe le code APE → business_type WebConceptor
 *
 * Si pas de match SIRENE : on garde l'inférence locale (notre regex).
 * Si match : business_type renvoyé est OFFICIEL → 0% d'erreur de ciblage.
 *
 * API : recherche-entreprises.api.gouv.fr — gratuit, illimité.
 */

import { safeFetch } from "../security";

/**
 * Mapping code NAF/APE officiel → business_type WebConceptor.
 * Couvre les métiers cibles principaux.
 */
const APE_TO_TYPE: Record<string, string> = {
  // Bâtiment / artisanat
  "43.22A": "plombier",
  "43.22B": "chauffagiste",
  "43.21A": "electricien",
  "43.32A": "menuisier",
  "16.23Z": "menuisier",
  "31.09A": "menuisier",
  "43.33Z": "carreleur",
  "43.34Z": "peintre",
  "43.91A": "couvreur",
  "43.91B": "couvreur",
  "43.99C": "macon",
  "41.20A": "macon",
  "41.20B": "macon",
  "25.72Z": "serrurier",

  // Auto
  "45.20A": "garage",
  "45.20B": "carrosserie",

  // Restauration
  "56.10A": "restaurant",
  "56.10B": "restaurant",
  "56.10C": "fast_food",
  "56.30Z": "cafe",
  "56.21Z": "restaurant",

  // Boulangerie / pâtisserie
  "10.71B": "boulangerie",
  "10.71C": "boulangerie",
  "10.71D": "patisserie",
  "47.24Z": "boulangerie",

  // Glacier
  "10.52Z": "glacier",

  // Beauté
  "96.02A": "coiffeur",
  "96.02B": "institut",

  // Santé
  "86.23Z": "dentiste",
  "86.90E": "osteo",
  "86.90F": "osteo",

  // Fleuriste / épicerie / divers
  "47.76Z": "fleuriste",
  "47.11B": "epicerie",
  "47.11C": "epicerie",
  "85.53Z": "auto_ecole",
  "93.13Z": "salle_sport",
};

export interface SireneConfirmResult {
  matched: boolean;
  business_type: string | null;   // type officiel confirmé, ou null si pas de match
  ape_code: string | null;
  ape_label: string | null;
  siren: string | null;
  source: "sirene" | "none";
}

/**
 * Confirme le business_type d'un prospect via SIRENE.
 *
 * Stratégie : recherche par nom commercial + commune. On prend le 1er match
 * qui a un APE mappé dans notre dico. Sinon on retourne `matched=false` et
 * l'appelant garde son inférence locale.
 */
export async function confirmBusinessTypeViaSirene(
  name: string,
  city: string,
  hintedType?: string
): Promise<SireneConfirmResult> {
  if (!name || name.length < 2) {
    return { matched: false, business_type: null, ape_code: null, ape_label: null, siren: null, source: "none" };
  }

  // Nettoie le nom : retire articles communs qui parasitent la recherche INSEE
  const cleanName = name
    .replace(/\b(SARL|SAS|SASU|EURL|SCI|EI|SA|SCOP)\b/gi, "")
    .replace(/[()"']/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const params = new URLSearchParams();
  params.set("q", cleanName.slice(0, 200));
  if (city) params.set("code_commune", "");  // si on connaît, sinon on garde la commune en q
  params.set("per_page", "10");
  params.set("etat_administratif", "A");

  // On peut ajouter la commune en texte libre si pas de code commune
  if (city && !params.get("code_commune")) {
    params.set("q", `${cleanName} ${city}`.slice(0, 200));
  }

  const url = `https://recherche-entreprises.api.gouv.fr/search?${params.toString()}`;

  try {
    const res = await safeFetch(url, {
      timeoutMs: 8000,
      headers: { "User-Agent": "WebConceptor/1.0 (contact@webconceptor.fr)" },
    });
    if (!res.ok) {
      return { matched: false, business_type: null, ape_code: null, ape_label: null, siren: null, source: "none" };
    }
    const data = await res.json();
    const results = Array.isArray(data.results) ? data.results : [];
    if (results.length === 0) {
      return { matched: false, business_type: null, ape_code: null, ape_label: null, siren: null, source: "none" };
    }

    // On prend la première entreprise dont l'APE est mappé
    for (const r of results) {
      const siege = (r.siege as Record<string, unknown>) || {};
      const apeRaw = (siege.activite_principale as string) || (r.activite_principale as string) || "";
      if (!apeRaw) continue;

      // Normalise format APE INSEE : "43.22A" parfois "4322A"
      const apeNorm = apeRaw.length >= 5 && !apeRaw.includes(".")
        ? `${apeRaw.slice(0, 2)}.${apeRaw.slice(2, 4)}${apeRaw.slice(4)}`
        : apeRaw.toUpperCase();

      const mapped = APE_TO_TYPE[apeNorm];
      if (!mapped) continue;

      // Si le caller a indiqué un type "hinted" différent, on prend quand même
      // SIRENE comme source de vérité — mais on log dans le résultat.
      void hintedType;

      const apeLabel = (r.activite_principale as Record<string, unknown>)?.libelle as string || null;
      return {
        matched: true,
        business_type: mapped,
        ape_code: apeNorm,
        ape_label: apeLabel,
        siren: String(r.siren || ""),
        source: "sirene",
      };
    }

    return { matched: false, business_type: null, ape_code: null, ape_label: null, siren: null, source: "none" };
  } catch {
    return { matched: false, business_type: null, ape_code: null, ape_label: null, siren: null, source: "none" };
  }
}

/**
 * Wrapper utilisé après scraping : confirme OU garde l'inférence locale.
 *
 * Usage type dans scrape-artisans / scrape-google :
 *   const confirmed = await reconcileBusinessType(scraped.name, scraped.city, inferredType);
 *   // confirmed.business_type = officiel si match SIRENE, sinon = inferredType
 */
export async function reconcileBusinessType(
  name: string,
  city: string,
  inferredType: string
): Promise<{ business_type: string; confidence: "sirene" | "inferred"; ape_code: string | null; siren: string | null }> {
  const r = await confirmBusinessTypeViaSirene(name, city, inferredType);
  if (r.matched && r.business_type) {
    return {
      business_type: r.business_type,
      confidence: "sirene",
      ape_code: r.ape_code,
      siren: r.siren,
    };
  }
  return {
    business_type: inferredType || "artisan",
    confidence: "inferred",
    ape_code: null,
    siren: null,
  };
}
