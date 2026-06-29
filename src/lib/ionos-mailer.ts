/**
 * Mailer IONOS SMTP — remplacement de Brevo.
 *
 * Pourquoi IONOS : contact@klyora.fr est déjà payé chez IONOS (inclus
 * dans l'hébergement). SMTP IONOS = ~500-1000 mails/jour selon le forfait,
 * réputation déjà établie (pas besoin de warm-up IP), DKIM/SPF déjà
 * configurés sur le domaine klyora.fr.
 *
 * Env vars Vercel à set :
 *   IONOS_SMTP_HOST=smtp.ionos.fr
 *   IONOS_SMTP_PORT=587
 *   IONOS_SMTP_USER=contact@klyora.fr
 *   IONOS_SMTP_PASS=<mot de passe IONOS>
 *   IONOS_FROM_EMAIL=contact@klyora.fr
 *   IONOS_FROM_NAME=Tom Bauer
 *
 * API : drop-in replacement de l'ancienne `sendBrevoEmail()`.
 */
import nodemailer, { type Transporter } from "nodemailer";

let _transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (_transporter) return _transporter;
  const host = process.env.IONOS_SMTP_HOST || "smtp.ionos.fr";
  const port = parseInt(process.env.IONOS_SMTP_PORT || "587", 10);
  const user = process.env.IONOS_SMTP_USER;
  const pass = process.env.IONOS_SMTP_PASS;
  if (!user || !pass) {
    throw new Error("IONOS_SMTP_USER / IONOS_SMTP_PASS non configurés");
  }
  _transporter = nodemailer.createTransport({
    host,
    port,
    // 587 = STARTTLS (secure: false + requireTLS), 465 = SSL (secure: true)
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    // IONOS a des connexions parfois lentes
    connectionTimeout: 30_000,
    greetingTimeout: 30_000,
    socketTimeout: 60_000,
  });
  return _transporter;
}

export type SendEmailOpts = {
  to: string;
  toName?: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  cc?: string;
  bcc?: string;
};

export type SendEmailResult = {
  ok: boolean;
  messageId?: string;
  error?: string;
};

export async function sendIonosEmail(opts: SendEmailOpts): Promise<SendEmailResult> {
  try {
    const transporter = getTransporter();
    const fromEmail = process.env.IONOS_FROM_EMAIL || process.env.IONOS_SMTP_USER || "contact@klyora.fr";
    const fromName = process.env.IONOS_FROM_NAME || "Tom Bauer";

    const info = await transporter.sendMail({
      from: `"${fromName}" <${fromEmail}>`,
      to: opts.toName ? `"${opts.toName}" <${opts.to}>` : opts.to,
      subject: opts.subject,
      html: opts.html,
      text: opts.text || opts.html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim(),
      replyTo: opts.replyTo || fromEmail,
      cc: opts.cc,
      bcc: opts.bcc,
    });
    return { ok: true, messageId: info.messageId };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "send_failed";
    return { ok: false, error: msg };
  }
}

/** Vérifie la connexion SMTP IONOS sans envoyer. */
export async function verifyIonosSmtp(): Promise<{ ok: boolean; error?: string }> {
  try {
    const transporter = getTransporter();
    await transporter.verify();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "verify_failed" };
  }
}
