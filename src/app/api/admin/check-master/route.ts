/**
 * GET /api/admin/check-master
 *
 * Diagnostique si MASTER_ACCESS_CODE est bien chargé côté Vercel.
 * Ne révèle JAMAIS le code, uniquement sa longueur et son hash.
 *
 * Auth : x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";
import { createHash } from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const masterCode = (process.env.MASTER_ACCESS_CODE || "").trim();
  const isSet = masterCode.length > 0;
  const length = masterCode.length;
  const hash = isSet ? createHash("sha256").update(masterCode).digest("hex").slice(0, 12) : null;
  const isDigitsOnly = isSet && /^\d+$/.test(masterCode);

  return NextResponse.json({
    master_access_code_is_set: isSet,
    length,
    is_digits_only: isDigitsOnly,
    hash_preview: hash,
    expected_171717_match: hash === createHash("sha256").update("171717").digest("hex").slice(0, 12),
  });
}
