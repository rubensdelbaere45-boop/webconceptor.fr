import { NextResponse } from "next/server";

/**
 * GET /api/caissio/download/mac
 * Redirige vers le dernier DMG macOS sur GitHub Releases.
 */
export async function GET() {
  return NextResponse.redirect(
    "https://github.com/rubensdelbaere45-boop/webconceptor.fr/releases/latest/download/Caissio.dmg",
    { status: 302 }
  );
}
