/* ══════════════════════════════════════════
   IONOS Developer API — achat automatisé de domaines
   Doc : https://developer.hosting.ionos.com/docs/domains

   Variables d'env attendues :
   - IONOS_API_KEY        = "{public_prefix}.{secret}" au format concaténé
   - IONOS_AUTO_BUY       = "true" pour activer l'achat réel (sinon dry-run)
   - IONOS_CONTACT_ID     = contact par défaut (optionnel, sinon créé à la volée)
   ══════════════════════════════════════════ */

const IONOS_BASE = "https://api.hosting.ionos.com";

export interface IonosContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string; // format E.164 +33...
  street: string;
  city: string;
  postalCode: string;
  country: string; // ISO 3166 (ex: "FR")
}

export interface IonosBuyResult {
  success: boolean;
  dryRun: boolean;
  domainName: string;
  orderId?: string;
  contactId?: string;
  error?: string;
  httpStatus?: number;
  details?: unknown;
}

function getApiKey(): string | null {
  const key = process.env.IONOS_API_KEY;
  if (!key) return null;
  // Si Rubens a stocké les 2 parties séparées par espace ou point, on accepte les 2
  // (format attendu : "public.secret" en une seule string)
  return key.trim();
}

function isAutoBuyEnabled(): boolean {
  return (process.env.IONOS_AUTO_BUY || "").toLowerCase() === "true";
}

// Normalise un numéro français en E.164 (+33...) attendu par IONOS
export function normalizePhoneE164(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (/^\+33[1-9]\d{8}$/.test(digits)) return digits;
  if (/^33[1-9]\d{8}$/.test(digits)) return "+" + digits;
  if (/^0[1-9]\d{8}$/.test(digits)) return "+33" + digits.slice(1);
  return digits;
}

/**
 * Vérifie la disponibilité d'un domaine chez IONOS.
 * Utilisé avant l'achat pour confirmer qu'il est libre.
 */
export async function checkDomainAvailability(domainName: string): Promise<{ available: boolean; price?: number; error?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) return { available: false, error: "IONOS_API_KEY manquante" };

  try {
    const res = await fetch(
      `${IONOS_BASE}/domains/v1/domainnames/${encodeURIComponent(domainName)}`,
      {
        method: "GET",
        headers: {
          "X-API-Key": apiKey,
          "Accept": "application/json",
        },
        signal: AbortSignal.timeout(15000),
      }
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { available: false, error: `IONOS HTTP ${res.status} : ${body.slice(0, 200)}` };
    }

    const data = await res.json().catch(() => ({}));
    // Le format exact dépend de l'API — on essaie plusieurs shapes
    const available = data.available === true || data.availability === "AVAILABLE" || data.status === "available";
    const price = typeof data.price === "number" ? data.price
      : typeof data.price?.gross === "number" ? data.price.gross
      : undefined;
    return { available, price };
  } catch (err) {
    return { available: false, error: err instanceof Error ? err.message : "unknown" };
  }
}

/**
 * Lance l'achat d'un domaine chez IONOS au nom de l'acheteur.
 * Si IONOS_AUTO_BUY !== "true" → mode dry-run (simule sans appeler l'API d'achat).
 */
export async function buyDomain(domainName: string, buyer: IonosContactInfo): Promise<IonosBuyResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      success: false,
      dryRun: true,
      domainName,
      error: "IONOS_API_KEY manquante dans l'environnement",
    };
  }

  const phone = normalizePhoneE164(buyer.phone);

  // Mode dry-run : on simule sans appeler l'API d'achat (juste check disponibilité)
  if (!isAutoBuyEnabled()) {
    const availability = await checkDomainAvailability(domainName);
    return {
      success: availability.available,
      dryRun: true,
      domainName,
      error: availability.error,
      details: {
        mode: "DRY_RUN",
        wouldRegister: {
          domainName,
          registrant: { ...buyer, phone },
          estimatedPrice: availability.price,
        },
      },
    };
  }

  // Mode production : création de l'ordre de domaine
  try {
    // IONOS API v1 attend un body de type "domain-orders"
    const body = {
      properties: {
        name: domainName,
        period: 1, // 1 an
      },
      contacts: {
        ownerc: {
          type: "INDIVIDUAL",
          firstName: buyer.firstName.slice(0, 60),
          lastName: buyer.lastName.slice(0, 60),
          email: buyer.email,
          phone,
          address: {
            countryCode: buyer.country || "FR",
            street: buyer.street.slice(0, 60),
            city: buyer.city.slice(0, 60),
            postalCode: buyer.postalCode,
          },
        },
      },
    };

    const res = await fetch(`${IONOS_BASE}/domains/v1/domain-orders`, {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    const respText = await res.text();
    let respJson: unknown;
    try { respJson = JSON.parse(respText); } catch { respJson = { raw: respText.slice(0, 500) }; }

    if (!res.ok) {
      return {
        success: false,
        dryRun: false,
        domainName,
        error: `IONOS HTTP ${res.status}`,
        httpStatus: res.status,
        details: respJson,
      };
    }

    const orderId = (respJson as { orderId?: string; id?: string })?.orderId
      || (respJson as { id?: string })?.id;

    return {
      success: true,
      dryRun: false,
      domainName,
      orderId,
      details: respJson,
    };
  } catch (err) {
    return {
      success: false,
      dryRun: false,
      domainName,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}
