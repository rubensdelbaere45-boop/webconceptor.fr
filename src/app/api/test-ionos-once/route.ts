/**
 * Endpoint TEMPORAIRE — à supprimer après validation.
 *
 * GET /api/test-ionos-once?to=<email>
 *
 * Envoie via le HELPER UNIFIÉ sendBrevoEmail() qui route selon MAIL_PROVIDER :
 *   - resend → Resend API (DKIM auto)
 *   - ionos  → IONOS SMTP direct
 *   - sinon  → Brevo (comportement historique)
 *
 * Whitelist stricte destinataires + rate-limit 30s.
 */
import { NextRequest, NextResponse } from "next/server";
import { sendBrevoEmail } from "@/lib/brevo-send";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WHITELIST = new Set([
  "rubensdelbaere@icloud.com",
  "rubensdelbaere45@gmail.com",
  "contact@klyora.fr",
  "tom@klyora.fr",
]);

let _lastSendAt = 0;

export async function GET(req: NextRequest) {
  const now = Date.now();
  if (now - _lastSendAt < 30_000) {
    const wait = Math.ceil((30_000 - (now - _lastSendAt)) / 1000);
    return NextResponse.json({ ok: false, error: "rate_limited", retry_after_seconds: wait }, { status: 429 });
  }

  const to = (req.nextUrl.searchParams.get("to") || "rubensdelbaere@icloud.com").trim().toLowerCase();
  if (!WHITELIST.has(to)) {
    return NextResponse.json({ ok: false, error: "destinataire non autorisé", whitelist: Array.from(WHITELIST) }, { status: 400 });
  }

  _lastSendAt = now;

  const provider = (process.env.MAIL_PROVIDER || "").toLowerCase() || "auto";
  const hasResend = !!process.env.RESEND_API_KEY;
  const hasIonos = !!(process.env.IONOS_SMTP_USER && process.env.IONOS_SMTP_PASS);
  const hasBrevo = !!process.env.BREVO_API_KEY;

  const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,'Inter',system-ui,sans-serif;background:#fafafa;padding:40px 20px;color:#1a1a1a">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:36px;box-shadow:0 4px 24px rgba(0,0,0,.06)">
  <h1 style="font-family:'DM Serif Display',serif;font-size:32px;color:#1a1a1a;margin:0 0 16px;font-weight:500">Migration ${provider.toUpperCase()} 🎉</h1>
  <p style="color:#525252;line-height:1.6;font-size:15px;margin:0 0 16px">Ce mail vient de <strong>${provider}</strong> via le helper unifié à ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}.</p>
  <p style="color:#525252;line-height:1.6;font-size:15px;margin:0 0 16px">Destinataire : <strong>${to}</strong></p>
  <p style="color:#525252;line-height:1.6;font-size:15px;margin:0 0 24px">Si tu me lis en <strong>INBOX</strong> (pas Spam), la migration est validée.</p>
  <div style="margin-top:32px;padding-top:24px;border-top:1px solid #eee">
    <p style="font-family:'DM Serif Display',serif;font-size:18px;font-style:italic;color:#c89697;margin:0">Klyora</p>
    <p style="font-size:13px;color:#9a9a9a;margin:6px 0 0">contact@klyora.fr · klyora.fr</p>
  </div>
</div>
</body></html>`;

  const ok = await sendBrevoEmail({
    to,
    toName: to === "rubensdelbaere@icloud.com" ? "Tom Bauer (iCloud)" : "Test",
    subject: `Test ${provider} · ${new Date().toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris" })}`,
    htmlContent: html,
    textContent: `Test migration ${provider}. Envoyé via helper sendBrevoEmail() qui route selon MAIL_PROVIDER=${provider}. Si tu lis ça en INBOX (pas Spam), c'est validé.\n\n— Klyora`,
  });

  return NextResponse.json({
    ok,
    sent_to: to,
    provider_env: provider,
    routed_to: provider === "resend" ? "Resend API" : provider === "ionos" ? "IONOS SMTP (nodemailer)" : "Brevo API",
    config: {
      resend_configured: hasResend,
      ionos_configured: hasIonos,
      brevo_configured: hasBrevo,
    },
    note: "Vérifie ta boîte INBOX ET Spam. Si en INBOX = DKIM aligné = migration ok.",
    timestamp: new Date().toISOString(),
  });
}
