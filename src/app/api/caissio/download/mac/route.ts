import { NextResponse } from "next/server";

/**
 * GET /api/caissio/download/mac
 * Redirige vers la page de téléchargement avec l'onglet Mac.
 * Safari / Chrome proposent l'installation PWA.
 */
export async function GET() {
  return NextResponse.redirect(
    "https://www.webconceptor.fr/caissio/telecharger?tab=mac",
    { status: 302 }
  );
}
