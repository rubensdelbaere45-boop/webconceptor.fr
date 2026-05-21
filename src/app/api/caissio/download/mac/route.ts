import { NextResponse } from "next/server";

const MAC_DMG_URL =
  "https://github.com/rubensdelbaere45-boop/webconceptor.fr/releases/download/caissio-latest/Caissio.dmg";

/**
 * GET /api/caissio/download/mac
 * Redirige directement vers le .dmg GitHub Release.
 * Le navigateur lance le téléchargement immédiatement.
 */
export async function GET() {
  return NextResponse.redirect(MAC_DMG_URL, {
    status: 302,
    headers: {
      "Content-Disposition": 'attachment; filename="Caissio.dmg"',
    },
  });
}
