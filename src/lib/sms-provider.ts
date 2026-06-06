/**
 * SMS Provider — cascade automatique OVHcloud → Brevo.
 *
 * Pourquoi ce cascade ?
 *   - Brevo refuse de valider le sender alphanumérique "WebConcept" et
 *     fallback sur "BatiPilote" → mauvaise pour la marque.
 *   - OVHcloud SMS autorise les senders alphanumériques sans validation
 *     ARCEP, validation instantanée → "WebConcept" arrive comme tel.
 *
 * Ordre priorité (la 1ère config trouvée gagne) :
 *   1. OVHcloud (si OVH_SMS_* configurées)
 *   2. Brevo (fallback)
 *
 * Pour activer OVH :
 *   - Va sur https://www.ovh.com/manager/sms → "Commander un pack SMS"
 *     (1€/mois minimum, ~16 SMS FR)
 *   - Génère un token API sur https://api.ovh.com/createToken
 *     Rights demandés :
 *       GET /sms
 *       GET /sms/(asterisk)
 *       POST /sms/(asterisk)/jobs
 *   - Set sur Vercel :
 *       OVH_APP_KEY
 *       OVH_APP_SECRET
 *       OVH_CONSUMER_KEY
 *       OVH_SMS_SERVICE_NAME (ex: "sms-xx12345-1")
 *       OVH_SMS_SENDER (ex: "WebConcept")
 */

import crypto from "node:crypto";

export interface SmsSendParams {
  to: string;        // +33XXXXXXXXX
  content: string;
  sender?: string;   // override
}

export interface SmsSendResult {
  ok: boolean;
  provider: "ovh" | "brevo" | "none";
  credits_remaining?: number;
  error?: string;
  sender_used?: string;
}

/* ══════════════════════════════════════════════
   OVHcloud SMS (priorité)
   ══════════════════════════════════════════════ */

function hasOvhConfig(): boolean {
  return !!(
    process.env.OVH_APP_KEY &&
    process.env.OVH_APP_SECRET &&
    process.env.OVH_CONSUMER_KEY &&
    process.env.OVH_SMS_SERVICE_NAME
  );
}

/**
 * OVH utilise un schéma de signature HMAC SHA1 :
 *   SHA1("AS" + "+" + AS_SECRET + "+" + CK + "+" + METHOD + "+" + URL + "+" + BODY + "+" + TSTAMP)
 */
function ovhSign(method: string, url: string, body: string, timestamp: number): string {
  const secret = process.env.OVH_APP_SECRET!;
  const ck = process.env.OVH_CONSUMER_KEY!;
  const toHash = `${secret}+${ck}+${method}+${url}+${body}+${timestamp}`;
  return "$1$" + crypto.createHash("sha1").update(toHash).digest("hex");
}

async function ovhTime(): Promise<number> {
  try {
    const res = await fetch("https://eu.api.ovh.com/1.0/auth/time", {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return Math.floor(Date.now() / 1000);
    const t = await res.text();
    return parseInt(t, 10);
  } catch {
    return Math.floor(Date.now() / 1000);
  }
}

async function sendViaOvh(params: SmsSendParams): Promise<SmsSendResult> {
  const sender = params.sender || process.env.OVH_SMS_SENDER || "WebConcept";
  const service = process.env.OVH_SMS_SERVICE_NAME!;
  const url = `https://eu.api.ovh.com/1.0/sms/${encodeURIComponent(service)}/jobs`;

  const body = JSON.stringify({
    message: params.content.slice(0, 160),
    receivers: [params.to],
    sender,
    charset: "UTF-8",
    senderForResponse: false,
    noStopClause: false,
  });

  const timestamp = await ovhTime();
  const signature = ovhSign("POST", url, body, timestamp);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Ovh-Application": process.env.OVH_APP_KEY!,
        "X-Ovh-Consumer": process.env.OVH_CONSUMER_KEY!,
        "X-Ovh-Signature": signature,
        "X-Ovh-Timestamp": String(timestamp),
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, provider: "ovh", error: `OVH HTTP ${res.status}: ${data.message || JSON.stringify(data).slice(0, 200)}` };
    }
    return {
      ok: true,
      provider: "ovh",
      sender_used: sender,
      credits_remaining: data.totalCreditsRemoved !== undefined ? undefined : undefined,
    };
  } catch (e) {
    return { ok: false, provider: "ovh", error: e instanceof Error ? e.message : "network" };
  }
}

/* ══════════════════════════════════════════════
   Brevo (fallback)
   ══════════════════════════════════════════════ */

async function sendViaBrevo(params: SmsSendParams): Promise<SmsSendResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, provider: "brevo", error: "BREVO_API_KEY manquante" };

  const sender = (params.sender || process.env.SMS_SENDER || "WebConcept").slice(0, 11);

  try {
    const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        recipient: params.to,
        content: params.content,
        type: "transactional",
        unicodeEnabled: false,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { ok: false, provider: "brevo", error: data.message || `HTTP ${res.status}` };
    }
    return {
      ok: true,
      provider: "brevo",
      sender_used: sender,
      credits_remaining: typeof data.remainingCredits === "number" ? data.remainingCredits : undefined,
    };
  } catch (e) {
    return { ok: false, provider: "brevo", error: e instanceof Error ? e.message : "network" };
  }
}

/* ══════════════════════════════════════════════
   Cascade : OVH → Brevo
   ══════════════════════════════════════════════ */

/**
 * Envoie 1 SMS avec cascade automatique.
 * Si OVH configuré → tente OVH (sender custom validé instantanément).
 * Si OVH down ou pas configuré → fallback Brevo.
 */
export async function sendSms(params: SmsSendParams): Promise<SmsSendResult> {
  if (hasOvhConfig()) {
    const r = await sendViaOvh(params);
    if (r.ok) return r;
    // OVH a échoué → on essaie Brevo
    const fallback = await sendViaBrevo(params);
    if (fallback.ok) return fallback;
    return { ok: false, provider: "ovh", error: `OVH+Brevo échoués : ${r.error}` };
  }
  return await sendViaBrevo(params);
}

/**
 * État du cascade : utile pour /admin/brevo-sms ou /admin/sms-status.
 */
export function getSmsProviderStatus() {
  return {
    ovh_configured: hasOvhConfig(),
    brevo_configured: !!process.env.BREVO_API_KEY,
    active_provider: hasOvhConfig() ? "ovh" : (process.env.BREVO_API_KEY ? "brevo" : "none"),
    ovh_sender: process.env.OVH_SMS_SENDER || "WebConcept",
    brevo_sender: process.env.SMS_SENDER || "WebConcept",
  };
}
