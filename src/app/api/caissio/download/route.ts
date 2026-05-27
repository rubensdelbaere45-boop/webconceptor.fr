import { NextResponse } from "next/server";

/**
 * GET /api/caissio/download (Windows)
 * Redirige vers le dernier installateur Windows (.exe) sur GitHub Releases.
 * L'URL /releases/latest/download/{asset} pointe toujours sur la dernière release.
 */
export async function GET() {
  return NextResponse.redirect(
    "https://github.com/rubensdelbaere45-boop/webconceptor.fr/releases/latest/download/Caissio-Setup.exe",
    { status: 302 }
  );
}
