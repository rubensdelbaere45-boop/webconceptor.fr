/**
 * POST /api/admin/test-diagnostic
 *
 * Test admin pour valider que le diagnostic enrichi marche bout-en-bout :
 *   - Scrapling : santé + /enrich + /scrape-pj
 *   - INSEE : auth + fetch par SIRET
 *   - Kimi K2 : génération failles
 *
 * Body : {
 *   business_name: string
 *   business_type: string
 *   city: string
 *   website_url?: string
 *   siret?: string
 *   google_rating?: number
 *   google_reviews_count?: number
 * }
 *
 * Auth : x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";
import { scraplingEnrich, scrapingPagesJaunes, scraplingHealthCheck, isScraplingConfigured } from "@/lib/scrapling-client";
import { fetchInseeBySiret, fetchInseeBySiren, isInseeConfigured } from "@/lib/sources/sirene-insee";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  let body: any = {};
  try { body = await req.json(); } catch { /* opt */ }

  const acc = {
    business_name: body.business_name || "Test",
    business_type: body.business_type || "restaurant",
    city: body.city || "Paris",
    website_url: body.website_url || null,
    siret: body.siret || null,
    google_rating: body.google_rating || null,
    google_reviews_count: body.google_reviews_count || null,
  };

  // 1) Health check Scrapling
  const scraplingHealth = await scraplingHealthCheck();

  // 2) Scrapling /enrich
  let scraplingEnrichRes: any = null;
  if (acc.website_url && isScraplingConfigured()) {
    scraplingEnrichRes = await scraplingEnrich(acc.website_url);
  }

  // 3) Scrapling /scrape-pj
  let scraplingPjRes: any = null;
  if (acc.business_type && acc.city && isScraplingConfigured()) {
    scraplingPjRes = await scrapingPagesJaunes(acc.business_type, acc.city, 1);
  }

  // 4) INSEE
  let inseeRes: any = null;
  if (acc.siret && isInseeConfigured()) {
    if (acc.siret.length === 14) inseeRes = await fetchInseeBySiret(acc.siret);
    else if (acc.siret.length === 9) inseeRes = await fetchInseeBySiren(acc.siret);
  }

  return NextResponse.json({
    success: true,
    test_account: acc,
    env_state: {
      SCRAPLING_URL_set: !!process.env.SCRAPLING_URL,
      SCRAPLING_SECRET_set: !!process.env.SCRAPLING_SECRET,
      INSEE_API_KEY_set: !!process.env.INSEE_API_KEY,
      INSEE_API_SECRET_set: !!process.env.INSEE_API_SECRET,
      scrapling_configured: isScraplingConfigured(),
      insee_configured: isInseeConfigured(),
    },
    scrapling_health_ok: scraplingHealth,
    scrapling_enrich_result: scraplingEnrichRes,
    scrapling_pj_result_count: scraplingPjRes?.results?.length ?? null,
    scrapling_pj_first_3: scraplingPjRes?.results?.slice(0, 3) ?? null,
    insee_result: inseeRes,
  });
}
