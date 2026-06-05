/**
 * Email Provider — abstraction Brevo / Listmonk
 *
 * Permet de basculer entre Brevo (payant, jusqu'au 17 juin) et
 * Listmonk + Resend (gratuit, à partir du 18 juin) sans toucher au code
 * des routes qui envoient des emails.
 *
 * Configuration via variable EMAIL_PROVIDER :
 * - "brevo" (défaut)  → utilise BREVO_API_KEY
 * - "listmonk"        → utilise LISTMONK_URL + LISTMONK_USER + LISTMONK_TOKEN
 *
 * Migration zéro code : il suffit de changer la variable d'env le 17 juin soir.
 */

export interface SendEmailParams {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  fromEmail?: string;
  fromName?: string;
  headers?: Record<string, string>;
  listUnsubscribeUrl?: string;
}

export interface SendEmailResult {
  ok: boolean;
  messageId?: string;
  provider: "brevo" | "listmonk";
  error?: string;
}

const FROM_EMAIL_DEFAULT = "contact@webconceptor.fr";
const FROM_NAME_DEFAULT = "WebConceptor";

// ── Brevo (jusqu'au 17 juin) ─────────────────────────────────────
async function sendViaBrevo(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, provider: "brevo", error: "BREVO_API_KEY manquante" };

  const body = {
    sender: {
      name: params.fromName || FROM_NAME_DEFAULT,
      email: params.fromEmail || FROM_EMAIL_DEFAULT,
    },
    to: [{ email: params.to, ...(params.toName ? { name: params.toName } : {}) }],
    subject: params.subject,
    htmlContent: params.html,
    ...(params.text ? { textContent: params.text } : {}),
    ...(params.listUnsubscribeUrl || params.headers
      ? {
          headers: {
            ...(params.listUnsubscribeUrl
              ? {
                  "List-Unsubscribe": `<${params.listUnsubscribeUrl}>`,
                  "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
                }
              : {}),
            ...params.headers,
          },
        }
      : {}),
  };

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, provider: "brevo", error: `HTTP ${res.status}: ${t.slice(0, 150)}` };
    }
    const data = await res.json();
    return { ok: true, provider: "brevo", messageId: data.messageId || "" };
  } catch (e) {
    return { ok: false, provider: "brevo", error: e instanceof Error ? e.message : "error" };
  }
}

// ── Listmonk (à partir du 18 juin) ───────────────────────────────
async function sendViaListmonk(params: SendEmailParams): Promise<SendEmailResult> {
  const url = process.env.LISTMONK_URL;
  const user = process.env.LISTMONK_USER;
  const token = process.env.LISTMONK_TOKEN;
  if (!url || !user || !token) {
    return { ok: false, provider: "listmonk", error: "Listmonk env vars manquantes (LISTMONK_URL/USER/TOKEN)" };
  }

  const headers = {
    ...(params.listUnsubscribeUrl
      ? {
          "List-Unsubscribe": `<${params.listUnsubscribeUrl}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        }
      : {}),
    ...params.headers,
  };

  const body = {
    subscriber_email: params.to,
    subscriber_name: params.toName || params.to,
    subject: params.subject,
    content_type: "html",
    body: params.html,
    ...(Object.keys(headers).length ? { headers } : {}),
    from_email: `${params.fromName || FROM_NAME_DEFAULT} <${params.fromEmail || FROM_EMAIL_DEFAULT}>`,
  };

  try {
    const res = await fetch(`${url.replace(/\/$/, "")}/api/tx`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `token ${user}:${token}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, provider: "listmonk", error: `HTTP ${res.status}: ${t.slice(0, 150)}` };
    }
    return { ok: true, provider: "listmonk", messageId: `listmonk-${Date.now()}` };
  } catch (e) {
    return { ok: false, provider: "listmonk", error: e instanceof Error ? e.message : "error" };
  }
}

// ── Entrée publique ──────────────────────────────────────────────
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const provider = (process.env.EMAIL_PROVIDER || "brevo").toLowerCase();
  if (provider === "listmonk") return sendViaListmonk(params);
  return sendViaBrevo(params);
}

/**
 * Renvoie le quota emails restants chez le provider actif.
 * Utile pour les dashboards admin et alertes.
 */
export async function getEmailCredits(): Promise<{ provider: string; credits: number | null }> {
  const provider = (process.env.EMAIL_PROVIDER || "brevo").toLowerCase();
  if (provider === "brevo") {
    try {
      const res = await fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": process.env.BREVO_API_KEY || "" },
        signal: AbortSignal.timeout(5_000),
      });
      if (!res.ok) return { provider: "brevo", credits: null };
      const data = await res.json();
      const credits = (data.plan || []).find((p: { credits?: number }) => p.credits)?.credits ?? null;
      return { provider: "brevo", credits };
    } catch {
      return { provider: "brevo", credits: null };
    }
  }
  // Listmonk = pas de quota (self-hosted), Resend a 3000/mois (à check via API Resend si besoin)
  return { provider: "listmonk", credits: 3_000 };
}
