import { NextResponse } from "next/server";

const WINDOWS_EXE_URL =
  "https://github.com/rubensdelbaere45-boop/webconceptor.fr/releases/download/caissio-latest/Caissio-Setup.exe";

/**
 * GET /api/caissio/download
 * Redirige directement vers le .exe GitHub Release.
 * Le navigateur lance le téléchargement immédiatement.
 */
export async function GET() {
  return NextResponse.redirect(WINDOWS_EXE_URL, {
    status: 302,
    headers: {
      "Content-Disposition": 'attachment; filename="Caissio-Setup.exe"',
    },
  });
}
