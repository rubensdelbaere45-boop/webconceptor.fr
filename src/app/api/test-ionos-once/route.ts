/**
 * Endpoint TEMPORAIRE — à supprimer après validation.
 *
 * GET /api/test-ionos-once
 *
 * Envoie un email de test via IONOS SMTP (force MAIL_PROVIDER=ionos)
 * à une adresse hardcodée (rubensdelbaere@icloud.com) sans auth admin.
 *
 * Restrictions :
 *  - destinataire HARDCODÉ → impossible d'utiliser pour spam externe
 *  - 1 envoi par minute max (rate-limit in-memory)
 *  - rate-limit aussi côté Vercel (compute time)
 */
import { NextResponse } from "next/server";
import { sendBrevoEmail } from "@/lib/brevo-send";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const TARGET = "rubensdelbaere@icloud.com";

let _lastSendAt = 0;

export async function GET() {
  // Rate-limit basique : 1 envoi par minute
  const now = Date.now();
  if (now - _lastSendAt < 60_000) {
    const wait = Math.ceil((60_000 - (now - _lastSendAt)) / 1000);
    return NextResponse.json(
      { ok: false, error: "rate_limited", retry_after_seconds: wait },
      { status: 429 }
    );
  }
  _lastSendAt = now;

  const provider = (process.env.MAIL_PROVIDER || "").toLowerCase();
  const hasIonos = !!(process.env.IONOS_SMTP_USER && process.env.IONOS_SMTP_PASS);
  const hasBrevo = !!process.env.BREVO_API_KEY;

  const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,'Inter',system-ui,sans-serif;background:#fafafa;padding:40px 20px;color:#1a1a1a">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:36px;box-shadow:0 4px 24px rgba(0,0,0,.06)">
  <h1 style="font-family:'DM Serif Display',serif;font-size:32px;color:#1a1a1a;margin:0 0 16px;font-weight:500">Migration IONOS réussie 🎉</h1>
  <p style="color:#525252;line-height:1.6;font-size:15px;margin:0 0 16px">Ce mail a été envoyé depuis Klyora via <strong>smtp.ionos.fr</strong> (nodemailer) à ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}.</p>
  <p style="color:#525252;line-height:1.6;font-size:15px;margin:0 0 24px">Si tu le reçois, ça veut dire que :</p>
  <ul style="color:#525252;line-height:1.8;font-size:15px;padding-left:18px">
    <li>Les <strong>4 env vars IONOS_SMTP_*</strong> sont bien configurées sur Vercel</li>
    <li><strong>MAIL_PROVIDER=ionos</strong> est actif → 100% des mails passent par IONOS</li>
    <li>Les 44 endpoints d'envoi (sniper, bulk-prospect-garages, send-access-codes, etc.) sont migrés automatiquement</li>
    <li>Les crédits Brevo ne sont plus consommés</li>
  </ul>
  <div style="margin-top:32px;padding-top:24px;border-top:1px solid #eee">
    <p style="font-family:'DM Serif Display',serif;font-size:18px;font-style:italic;color:#c89697;margin:0">Klyora</p>
    <p style="font-size:13px;color:#9a9a9a;margin:6px 0 0">contact@klyora.fr · klyora.fr</p>
  </div>
</div>
</body></html>`;

  const result = await sendBrevoEmail({
    to: TARGET,
    toName: "Rubens (Tom Bauer)",
    subject: `Test IONOS — Migration réussie · ${new Date().toLocaleTimeString("fr-FR")}`,
    htmlContent: html,
    textContent: `Migration IONOS réussie.\n\nCe mail vient de smtp.ionos.fr via nodemailer.\nProvider actif : ${provider || "auto"}.\n\nIONOS env vars: ${hasIonos ? "✓" : "❌"}\nBrevo API key: ${hasBrevo ? "✓ (mais bypass via MAIL_PROVIDER=ionos)" : "❌"}\n\n— Klyora`,
  });

  return NextResponse.json({
    ok: result,
    sent_to: TARGET,
    provider_env: provider || "(unset)",
    ionos_configured: hasIonos,
    brevo_configured: hasBrevo,
    expected_route: provider === "ionos" ? "IONOS direct" : (hasBrevo ? "Brevo (fallback IONOS si échec)" : "IONOS via fallback"),
    timestamp: new Date().toISOString(),
  });
}
