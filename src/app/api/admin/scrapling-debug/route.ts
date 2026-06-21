/**
 * Route debug pour tester la config Scrapling Railway.
 * GET /api/admin/scrapling-debug?url=https://example.com
 */
import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";
import { isScraplingConfigured, scraplingEnrichSite } from "@/lib/scrape-scrapling";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 90;

export async function GET(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const url = req.nextUrl.searchParams.get("url") || "https://lggroupe.com/";
  const configured = isScraplingConfigured();
  const result = configured ? await scraplingEnrichSite(url, ["photos", "about"]) : null;
  return NextResponse.json({
    configured,
    hasSecret: !!process.env.SCRAPLING_SECRET,
    hasUrl: !!process.env.SCRAPLING_SERVICE_URL,
    urlPrefix: (process.env.SCRAPLING_SERVICE_URL || "").slice(0, 40),
    secretLength: (process.env.SCRAPLING_SECRET || "").length,
    result,
  });
}

export const POST = GET;
