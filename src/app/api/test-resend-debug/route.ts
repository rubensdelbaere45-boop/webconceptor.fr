/**
 * TEMPORAIRE — appelle Resend API direct et remonte l'erreur détaillée
 * pour diagnostiquer pourquoi l'envoi a échoué.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const to = req.nextUrl.searchParams.get("to") || "rubensdelbaere@icloud.com";
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "contact@klyora.fr";

  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY missing" }, { status: 400 });
  }

  const body = {
    from: `Tom Bauer <${fromEmail}>`,
    to: [to],
    subject: "Test Resend debug",
    html: "<p>Test Resend depuis Klyora</p>",
  };

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    return NextResponse.json({
      status: res.status,
      statusText: res.statusText,
      config: {
        from_email: fromEmail,
        api_key_prefix: apiKey.slice(0, 10) + "...",
        api_key_length: apiKey.length,
      },
      body_sent: body,
      response: parsed,
    });
  } catch (err) {
    return NextResponse.json({
      error: "fetch_failed",
      detail: err instanceof Error ? err.message : "unknown",
      config: { from_email: fromEmail },
    }, { status: 500 });
  }
}
