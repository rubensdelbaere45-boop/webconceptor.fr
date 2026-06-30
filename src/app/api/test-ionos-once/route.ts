/**
 * Endpoint TEMPORAIRE — à supprimer après validation IONOS.
 *
 * GET /api/test-ionos-once?to=<email>&verify=1
 *
 * - Whitelist destinataires : rubensdelbaere@icloud.com, gmail, contact@klyora.fr
 * - Fait un verify() SMTP avant + retourne les logs nodemailer pour diagnostic
 * - Rate-limit : 1 envoi par 30s
 */
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

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
  const doVerify = req.nextUrl.searchParams.get("verify") !== "0";

  _lastSendAt = now;

  const host = process.env.IONOS_SMTP_HOST || "smtp.ionos.fr";
  const port = parseInt(process.env.IONOS_SMTP_PORT || "465", 10);
  const user = process.env.IONOS_SMTP_USER || "";
  const pass = process.env.IONOS_SMTP_PASS || "";

  const config = {
    host,
    port,
    secure: port === 465,
    requireTLS: port === 587,
    auth: { user, pass },
    tls: { minVersion: "TLSv1.2" as const, rejectUnauthorized: true },
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 30_000,
    logger: false,
  };

  const diagnostics: Record<string, unknown> = {
    config: {
      host,
      port,
      secure: config.secure,
      requireTLS: config.requireTLS,
      user_set: !!user,
      user_preview: user ? user.slice(0, 4) + "***@" + user.split("@")[1] : null,
      pass_set: !!pass,
      pass_length: pass ? pass.length : 0,
    },
  };

  let transporter;
  try {
    transporter = nodemailer.createTransport(config);
  } catch (err) {
    return NextResponse.json({ ok: false, step: "createTransport", error: err instanceof Error ? err.message : "unknown", diagnostics }, { status: 500 });
  }

  if (doVerify) {
    try {
      await transporter.verify();
      diagnostics.verify = { ok: true };
    } catch (err) {
      diagnostics.verify = {
        ok: false,
        error: err instanceof Error ? err.message : "unknown",
        code: (err as { code?: string } | undefined)?.code,
        responseCode: (err as { responseCode?: number } | undefined)?.responseCode,
        command: (err as { command?: string } | undefined)?.command,
      };
      return NextResponse.json({ ok: false, step: "verify", diagnostics }, { status: 500 });
    }
  }

  const html = `<!DOCTYPE html><html><body style="font-family:-apple-system,'Inter',system-ui,sans-serif;background:#fafafa;padding:40px 20px;color:#1a1a1a">
<div style="max-width:560px;margin:auto;background:#fff;border-radius:16px;padding:36px;box-shadow:0 4px 24px rgba(0,0,0,.06)">
  <h1 style="font-family:'DM Serif Display',serif;font-size:32px;color:#1a1a1a;margin:0 0 16px;font-weight:500">Migration IONOS réussie 🎉</h1>
  <p style="color:#525252;line-height:1.6;font-size:15px;margin:0 0 16px">Ce mail vient de <strong>${host}:${port}</strong> via Nodemailer à ${new Date().toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}.</p>
  <p style="color:#525252;line-height:1.6;font-size:15px;margin:0 0 16px">Destinataire : <strong>${to}</strong></p>
  <div style="margin-top:32px;padding-top:24px;border-top:1px solid #eee">
    <p style="font-family:'DM Serif Display',serif;font-size:18px;font-style:italic;color:#c89697;margin:0">Klyora</p>
    <p style="font-size:13px;color:#9a9a9a;margin:6px 0 0">contact@klyora.fr · klyora.fr</p>
  </div>
</div>
</body></html>`;

  try {
    const info = await transporter.sendMail({
      from: `"Tom Bauer" <${user || "contact@klyora.fr"}>`,
      to,
      subject: `Test IONOS · ${new Date().toLocaleTimeString("fr-FR", { timeZone: "Europe/Paris" })}`,
      html,
      text: `Test IONOS migration. Envoyé depuis ${host}:${port} le ${new Date().toISOString()}. Si tu lis ça, ça marche.`,
      replyTo: user || "contact@klyora.fr",
    });
    diagnostics.sendMail = {
      messageId: info.messageId,
      response: info.response,
      accepted: info.accepted,
      rejected: info.rejected,
      pending: info.pending,
      envelope: info.envelope,
    };
    return NextResponse.json({ ok: true, sent_to: to, diagnostics });
  } catch (err) {
    diagnostics.sendMail = {
      error: err instanceof Error ? err.message : "unknown",
      code: (err as { code?: string } | undefined)?.code,
      responseCode: (err as { responseCode?: number } | undefined)?.responseCode,
      command: (err as { command?: string } | undefined)?.command,
    };
    return NextResponse.json({ ok: false, step: "sendMail", diagnostics }, { status: 500 });
  }
}
