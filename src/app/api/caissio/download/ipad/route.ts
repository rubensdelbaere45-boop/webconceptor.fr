import { NextResponse } from "next/server";

/**
 * GET /api/caissio/download/ipad
 * iPad/iPhone : pas de .ipa sans App Store.
 * On ouvre directement l'app Caissio dans Safari avec un paramètre
 * qui déclenche la bannière d'installation PWA.
 */
export async function GET() {
  return NextResponse.redirect(
    "https://www.webconceptor.fr/caissio/login?install=1",
    { status: 302 }
  );
}
