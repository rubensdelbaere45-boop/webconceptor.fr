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
  const action = req.nextUrl.searchParams.get("action") || "enrich";
  const configured = isScraplingConfigured();

  // Test 1 : health (depuis Vercel pour vérifier connectivité)
  const serviceUrl = (process.env.SCRAPLING_SERVICE_URL || "").replace(/\/+$/, "");
  let healthCheck: { ok: boolean; status?: number; ms?: number; error?: string } = { ok: false };
  if (serviceUrl) {
    const t0 = Date.now();
    try {
      const r = await fetch(`${serviceUrl}/health`, { signal: AbortSignal.timeout(10000) });
      healthCheck = { ok: r.ok, status: r.status, ms: Date.now() - t0 };
    } catch (e) {
      healthCheck = { ok: false, error: (e as Error).message, ms: Date.now() - t0 };
    }
  }

  // Test 2 : enrich call (seulement si demandé)
  let result = null;
  if (action === "enrich" && configured) {
    result = await scraplingEnrichSite(url, ["photos", "about"], { timeoutMs: 60000 });
  }

  return NextResponse.json({
    configured,
    hasSecret: !!process.env.SCRAPLING_SECRET,
    hasUrl: !!process.env.SCRAPLING_SERVICE_URL,
    urlPrefix: (process.env.SCRAPLING_SERVICE_URL || "").slice(0, 60),
    secretLength: (process.env.SCRAPLING_SECRET || "").length,
    healthCheck,
    result,
  });
}

export const POST = GET;
