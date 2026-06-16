/* ══════════════════════════════════════════
   Nodemailer fallback (IONOS SMTP)

   Activé automatiquement quand l'envoi Brevo échoue (HTTP 401, 402, 429, etc.)
   ou quand BREVO_API_KEY n'est plus configurée.

   Limites IONOS gratuit : ~250 mails/jour par boîte. Sert de roue de secours
   en attendant que les crédits Brevo soient renouvelés.

   Variables d'env attendues :
     - IONOS_SMTP_HOST    (défaut: smtp.ionos.fr)
     - IONOS_SMTP_PORT    (défaut: 465 → SSL)
     - IONOS_SMTP_USER    (= contact@klyora.fr)
     - IONOS_SMTP_PASS    (= mot de passe boîte mail IONOS)
   ══════════════════════════════════════════ */
import nodemailer, { type Transporter } from "nodemailer";

let _transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (_transporter) return _transporter;

  const host = process.env.IONOS_SMTP_HOST || "smtp.ionos.fr";
  const port = parseInt(process.env.IONOS_SMTP_PORT || "465", 10);
  const user = process.env.IONOS_SMTP_USER || "";
  const pass = process.env.IONOS_SMTP_PASS || "";

  if (!user || !pass) {
    console.warn("[nodemailer-fallback] IONOS_SMTP_USER ou IONOS_SMTP_PASS manquant");
    return null;
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    tls: { minVersion: "TLSv1.2" },
  });

  return _transporter;
}

export interface NodemailerSendOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  senderName?: string;
  senderEmail?: string;
  unsubscribeUrl?: string;
}

export async function sendViaIonosSmtp(opts: NodemailerSendOptions): Promise<boolean> {
  const t = getTransporter();
  if (!t) return false;

  const fromEmail = opts.senderEmail || process.env.IONOS_SMTP_USER || "contact@klyora.fr";
  const fromName = opts.senderName || "Tom Bauer";

  const headers: Record<string, string> = {};
  if (opts.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${opts.unsubscribeUrl}>, <mailto:unsubscribe@klyora.fr?subject=unsubscribe>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  try {
    await t.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: opts.toName ? `"${opts.toName}" <${opts.to}>` : opts.to,
      subject: opts.subject,
      text: opts.textContent || stripHtml(opts.htmlContent),
      html: opts.htmlContent,
      headers,
    });
    return true;
  } catch (err) {
    console.error("[nodemailer-fallback] send error:", err);
    return false;
  }
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

/** Diagnostic SMTP — utile pour /api/admin/test-ionos-smtp */
export async function verifyIonosSmtp(): Promise<{ ok: boolean; error?: string }> {
  const t = getTransporter();
  if (!t) return { ok: false, error: "IONOS_SMTP_USER ou IONOS_SMTP_PASS manquant" };
  try {
    await t.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown" };
  }
}
