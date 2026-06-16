/**
 * GET /api/admin/test-ionos-smtp
 * GET /api/admin/test-ionos-smtp?to=test@example.com&send=1
 *
 * Diagnostic SMTP IONOS :
 *  - sans param   : juste verify() — vérifie l'auth + reachability
 *  - avec ?send=1 : envoie un mail de test à l'adresse `to`
 *
 * Auth : x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";
import { verifyIonosSmtp, sendViaIonosSmtp } from "@/lib/nodemailer-fallback";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const verify = await verifyIonosSmtp();
  const sendTo = req.nextUrl.searchParams.get("to") || "";
  const doSend = req.nextUrl.searchParams.get("send") === "1";

  let sentResult: { ok: boolean; to?: string; error?: string } | null = null;
  if (doSend && sendTo && verify.ok) {
    const ok = await sendViaIonosSmtp({
      to: sendTo,
      subject: "Klyora — test fallback IONOS SMTP",
      htmlContent: `<p>Hello,</p><p>Ce mail confirme que le fallback IONOS SMTP fonctionne. Envoyé depuis <code>${process.env.IONOS_SMTP_USER}</code> via <code>${process.env.IONOS_SMTP_HOST || "smtp.ionos.fr"}</code>.</p><p>—Klyora Sites</p>`,
      textContent: `Test fallback IONOS SMTP — envoyé depuis ${process.env.IONOS_SMTP_USER}`,
    });
    sentResult = { ok, to: sendTo, error: ok ? undefined : "send failed" };
  }

  return NextResponse.json({
    verify,
    config: {
      host: process.env.IONOS_SMTP_HOST || "smtp.ionos.fr (default)",
      port: process.env.IONOS_SMTP_PORT || "465 (default)",
      user: process.env.IONOS_SMTP_USER ? `${process.env.IONOS_SMTP_USER.slice(0, 3)}***` : "(missing)",
      has_pass: !!process.env.IONOS_SMTP_PASS,
    },
    sent: sentResult,
  });
}
