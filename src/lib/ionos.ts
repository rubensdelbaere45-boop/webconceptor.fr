/* ══════════════════════════════════════════
   IONOS Developer API — achat automatisé de domaines

   Stratégie : achat TOUJOURS tenté dès que le webhook Stripe valide un
   paiement avec l'option Sérénité + un domaine. Le temps est critique :
   chaque seconde perdue = risque que le domaine soit pris par quelqu'un
   d'autre. Retry 3× en cas d'erreur temporaire.

   Variables d'env attendues :
   - IONOS_API_KEY = "{public_prefix}.{secret}" (une seule string)
     OU IONOS_API_PUBLIC_PREFIX + IONOS_API_SECRET séparés
   ══════════════════════════════════════════ */

const IONOS_BASE = "https://api.hosting.ionos.com";

export interface IonosContactInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;       // format E.164 +33...
  street: string;
  city: string;
  postalCode: string;
  country: string;     // ISO 3166 (ex: "FR")
  organization?: string;
}

export interface IonosBuyResult {
  success: boolean;
  domainName: string;
  orderId?: string;
  contactId?: string;
  attempts: number;
  error?: string;
  httpStatus?: number;
  requestBody?: unknown;  // pour debug / log Telegram en cas d'échec
  responseBody?: unknown;
}

function getApiKey(): string | null {
  // Format 1 : IONOS_API_KEY = "prefix.secret" (concaténé)
  const full = process.env.IONOS_API_KEY;
  if (full && full.trim().length > 0) return full.trim();
  // Format 2 : prefix + secret séparés — accepte plusieurs noms de variables
  // pour être tolérant aux variations (Rubens utilise IONOS_API_PREFIX)
  const pub = process.env.IONOS_API_PREFIX
    || process.env.IONOS_API_PUBLIC_PREFIX
    || process.env.IONOS_PREFIX;
  const secret = process.env.IONOS_API_SECRET
    || process.env.IONOS_SECRET;
  if (pub && secret) return `${pub.trim()}.${secret.trim()}`;
  return null;
}

// Normalise un numéro français en E.164 (+33...) attendu par IONOS
export function normalizePhoneE164(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (/^\+33[1-9]\d{8}$/.test(digits)) return digits;
  if (/^33[1-9]\d{8}$/.test(digits)) return "+" + digits;
  if (/^0[1-9]\d{8}$/.test(digits)) return "+33" + digits.slice(1);
  return digits;
}

function pause(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Vérifie la disponibilité d'un domaine chez IONOS.
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
 * Retry automatique 3× avec backoff (5s, 15s) en cas d'erreur temporaire (5xx / timeout).
 * Les erreurs définitives (domaine déjà pris, données invalides) ne sont pas retry.
 */
export async function buyDomain(domainName: string, buyer: IonosContactInfo): Promise<IonosBuyResult> {
  const apiKey = getApiKey();
  if (!apiKey) {
    return {
      success: false,
      domainName,
      attempts: 0,
      error: "IONOS_API_KEY manquante dans l'environnement Render",
    };
  }

  const phone = normalizePhoneE164(buyer.phone);

  // Body standardisé pour l'API v1 domain-orders d'IONOS
  const requestBody = {
    properties: {
      name: domainName,
      period: 1, // 1 an
    },
    contacts: {
      ownerc: {
        type: buyer.organization ? "ORGANIZATION" : "INDIVIDUAL",
        firstName: (buyer.firstName || "").slice(0, 60),
        lastName: (buyer.lastName || "").slice(0, 60),
        organization: buyer.organization ? buyer.organization.slice(0, 120) : undefined,
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

  const MAX_ATTEMPTS = 3;
  let lastError: string | undefined;
  let lastStatus: number | undefined;
  let lastResponseBody: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${IONOS_BASE}/domains/v1/domain-orders`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000),
      });

      const respText = await res.text();
      let respJson: unknown;
      try { respJson = JSON.parse(respText); } catch { respJson = { raw: respText.slice(0, 1000) }; }
      lastResponseBody = respJson;
      lastStatus = res.status;

      if (res.ok) {
        const orderId = (respJson as { orderId?: string; id?: string })?.orderId
          || (respJson as { id?: string })?.id;
        return {
          success: true,
          domainName,
          orderId,
          attempts: attempt,
          httpStatus: res.status,
          requestBody,
          responseBody: respJson,
        };
      }

      // Erreurs 4xx (sauf 429) = définitives, pas la peine de retry
      if (res.status >= 400 && res.status < 500 && res.status !== 429) {
        lastError = `IONOS HTTP ${res.status} (erreur client — pas de retry)`;
        break;
      }

      // 5xx / 429 / timeout → retry après pause
      lastError = `IONOS HTTP ${res.status} (tentative ${attempt}/${MAX_ATTEMPTS})`;
      if (attempt < MAX_ATTEMPTS) await pause(attempt === 1 ? 5000 : 15000);
    } catch (err) {
      lastError = err instanceof Error ? err.message : "unknown";
      if (attempt < MAX_ATTEMPTS) await pause(attempt === 1 ? 5000 : 15000);
    }
  }

  return {
    success: false,
    domainName,
    attempts: MAX_ATTEMPTS,
    error: lastError,
    httpStatus: lastStatus,
    requestBody,
    responseBody: lastResponseBody,
  };
}

/* ══════════════════════════════════════════
   DNS — pointe un domaine acheté chez IONOS vers Vercel
   ══════════════════════════════════════════ */

/**
 * Récupère la zoneId d'un domaine (nécessaire pour modifier les DNS).
 */
async function getZoneId(domainName: string): Promise<string | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;
  const res = await fetch(`${IONOS_BASE}/dns/v1/zones?filter.q=${encodeURIComponent(domainName)}`, {
    headers: { "X-API-Key": apiKey, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => []);
  const arr = Array.isArray(data) ? data : data.items || [];
  for (const z of arr) {
    if (z?.name?.toLowerCase() === domainName.toLowerCase()) return z.id;
  }
  return null;
}

/**
 * Pointe le domaine vers Vercel :
 *   - A @         → 216.198.79.1
 *   - CNAME www   → cname.vercel-dns.com
 * Garde les records mail (MX, SPF, DKIM, DMARC) intacts.
 *
 * Retourne true si les 2 records ont bien été appliqués.
 */
export async function pointDomainToVercel(domainName: string): Promise<{ ok: boolean; error?: string; zoneId?: string }> {
  const apiKey = getApiKey();
  if (!apiKey) return { ok: false, error: "IONOS_API_KEY manquante" };

  const zoneId = await getZoneId(domainName);
  if (!zoneId) return { ok: false, error: `zone ${domainName} introuvable chez IONOS` };

  const records = [
    { name: domainName,            type: "A",     content: "216.198.79.1",        ttl: 3600, prio: 0, disabled: false },
    { name: `www.${domainName}`,   type: "CNAME", content: "cname.vercel-dns.com", ttl: 3600, prio: 0, disabled: false },
  ];

  const res = await fetch(`${IONOS_BASE}/dns/v1/zones/${zoneId}/records`, {
    method: "PATCH",
    headers: {
      "X-API-Key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(records),
    signal: AbortSignal.timeout(30000),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    return { ok: false, error: `IONOS DNS HTTP ${res.status}: ${detail.slice(0, 200)}`, zoneId };
  }

  return { ok: true, zoneId };
}
