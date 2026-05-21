import { NextResponse } from "next/server";

const DMG_URL =
  "https://github.com/rubensdelbaere45-boop/webconceptor.fr/releases/download/caissio-latest/Caissio.dmg";

/**
 * GET /api/caissio/download/mac
 * Proxy direct — le .dmg est servi depuis webconceptor.fr,
 * GitHub n'est jamais visible pour l'utilisateur.
 */
export async function GET() {
  try {
    const upstream = await fetch(DMG_URL, { redirect: "follow" });
    if (!upstream.ok || !upstream.body) {
      return new NextResponse(
        "Le fichier Mac n'est pas encore disponible. Réessayez dans quelques minutes.",
        { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }
    const headers = new Headers({
      "Content-Type": "application/x-apple-diskimage",
      "Content-Disposition": 'attachment; filename="Caissio.dmg"',
      "Cache-Control": "no-store",
    });
    const len = upstream.headers.get("content-length");
    if (len) headers.set("Content-Length", len);
    return new NextResponse(upstream.body as BodyInit, { status: 200, headers });
  } catch {
    return new NextResponse("Erreur lors de la récupération du fichier.", {
      status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}
