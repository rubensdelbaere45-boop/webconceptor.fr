import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/quick-reply
   Auth : x-admin-key

   Envoie un email HTML personnalisé one-shot à un prospect.
   Utile pour répondre à un lead chaud avec un message sur-mesure.

   Body JSON :
     - to       : adresse email du destinataire
     - name     : nom affiché (ex: "Le Glacier des Alpes")
     - subject  : objet de l'email
     - html     : contenu HTML complet
   ══════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const to = String(body.to || "").trim();
  const name = String(body.name || "").trim();
  const subject = String(body.subject || "").trim();
  const html = String(body.html || "").trim();

  if (!to || !subject || !html) {
    return NextResponse.json({ error: "to, subject et html sont requis" }, { status: 400 });
  }

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "BREVO_API_KEY manquant" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Tom Bauer", email: "contact@klyora.fr" },
        to: [{ email: to, name: name || to }],
        subject,
        htmlContent: html,
      }),
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const result = await res.json();
    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
