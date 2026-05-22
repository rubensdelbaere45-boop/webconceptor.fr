import { NextResponse } from "next/server";

/**
 * GET /api/caissio/download (Windows)
 * Redirige vers la page de téléchargement avec le bon onglet.
 * Chrome / Edge proposent l'installation PWA depuis la barre d'adresse.
 */
export async function GET() {
  return NextResponse.redirect(
    "https://www.webconceptor.fr/caissio/telecharger?tab=windows",
    { status: 302 }
  );
}
