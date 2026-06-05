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
  provider: "brevo" | "listmonk" | "resend" | "smtp";
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

// ── Resend (fallback gratuit / production post-Brevo) ──────────
async function sendViaResend(params: SendEmailParams): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, provider: "resend", error: "RESEND_API_KEY manquante" };

  // Domaine vérifié obligatoire pour from sur ton domaine.
  // Tant que webconceptor.fr pas vérifié sur Resend → onboarding@resend.dev
  // ou utilise contact@webconceptor.fr SI domaine DNS validé.
  const from = `${params.fromName || FROM_NAME_DEFAULT} <${params.fromEmail || (process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev")}>`;

  const body = {
    from,
    to: [params.to],
    subject: params.subject,
    html: params.html,
    ...(params.text ? { text: params.text } : {}),
    ...(params.headers || params.listUnsubscribeUrl
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
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, provider: "resend", error: `HTTP ${res.status}: ${t.slice(0, 150)}` };
    }
    const data = await res.json();
    return { ok: true, provider: "resend", messageId: data.id || "" };
  } catch (e) {
    return { ok: false, provider: "resend", error: e instanceof Error ? e.message : "error" };
  }
}

// ── SMTP direct via Nodemailer (illimité, gratuit) ──────────────
// Utilise un compte SMTP réel : IONOS (pro@webconceptor.fr), Gmail,
// OVH, etc. Pas de quota fournisseur — limité uniquement par la
// politique anti-spam de ton hébergeur SMTP.
//
// Variables :
//   SMTP_HOST       (ex: smtp.ionos.fr)
//   SMTP_PORT       (defaut 587)
//   SMTP_SECURE     ('true' pour port 465, sinon false → STARTTLS)
//   SMTP_USER       (adresse complète : contact@webconceptor.fr)
//   SMTP_PASS       (mot de passe du compte mail)
//   SMTP_FROM_EMAIL (optionnel : adresse from override)
//   SMTP_FROM_NAME  (optionnel : nom from override)
let _smtpTransporter: ReturnType<typeof import("nodemailer").createTransport> | null = null;
async function getSmtpTransporter() {
  if (_smtpTransporter) return _smtpTransporter;
  const nodemailer = await import("nodemailer");
  _smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.ionos.fr",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER || "",
      pass: process.env.SMTP_PASS || "",
    },
    tls: { minVersion: "TLSv1.2" },
  });
  return _smtpTransporter;
}

async function sendViaSmtp(params: SendEmailParams): Promise<SendEmailResult> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    return { ok: false, provider: "smtp", error: "SMTP_USER ou SMTP_PASS manquant" };
  }
  try {
    const transporter = await getSmtpTransporter();
    const fromEmail = params.fromEmail || process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER!;
    const fromName = params.fromName || process.env.SMTP_FROM_NAME || FROM_NAME_DEFAULT;
    const headers: Record<string, string> = { ...(params.headers || {}) };
    if (params.listUnsubscribeUrl) {
      headers["List-Unsubscribe"] = `<${params.listUnsubscribeUrl}>`;
      headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
    }
    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: params.toName ? `"${params.toName}" <${params.to}>` : params.to,
      subject: params.subject,
      html: params.html,
      ...(params.text ? { text: params.text } : {}),
      ...(Object.keys(headers).length ? { headers } : {}),
    });
    return { ok: true, provider: "smtp", messageId: info.messageId };
  } catch (e) {
    return { ok: false, provider: "smtp", error: e instanceof Error ? e.message.slice(0, 200) : "smtp error" };
  }
}

// ── Entrée publique ──────────────────────────────────────────────
// EMAIL_PROVIDER = "brevo" (défaut) | "listmonk" | "resend" | "smtp"
//
// Failover automatique : si le provider principal échoue,
// on tente SMTP puis Resend (selon ce qui est configuré).
// Garantit que les emails partent même en cas de panne.
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const provider = (process.env.EMAIL_PROVIDER || "brevo").toLowerCase();
  const hasResendFallback = !!process.env.RESEND_API_KEY;
  const hasSmtpFallback = !!(process.env.SMTP_USER && process.env.SMTP_PASS);

  let result: SendEmailResult;
  if      (provider === "smtp")     result = await sendViaSmtp(params);
  else if (provider === "resend")   result = await sendViaResend(params);
  else if (provider === "listmonk") result = await sendViaListmonk(params);
  else                              result = await sendViaBrevo(params);

  // Failover en cascade : SMTP > Resend
  if (!result.ok && provider !== "smtp" && hasSmtpFallback) {
    console.warn(`[email-provider] ${result.provider} a échoué (${result.error?.slice(0, 80)}), failover SMTP`);
    const fallback = await sendViaSmtp(params);
    if (fallback.ok) return fallback;
  }
  if (!result.ok && provider !== "resend" && hasResendFallback) {
    console.warn(`[email-provider] ${result.provider} a échoué (${result.error?.slice(0, 80)}), failover Resend`);
    const fallback = await sendViaResend(params);
    if (fallback.ok) return fallback;
  }
  return result;
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
  if (provider === "resend") {
    // Resend free tier = 3000/mois. Pas d'API publique pour le quota restant.
    // On retourne le total pour info, le tracking précis se fait via Resend dashboard.
    return { provider: "resend", credits: 3_000 };
  }
  // Listmonk = pas de quota (self-hosted SMTP via Resend ou autre)
  return { provider: "listmonk", credits: null };
}
