/**
 * POST /api/admin/scrape-all-sites?offset=0&limit=50[&force=1]
 *
 * Scrape en bulk les websites des prospects et stocke leur DNA dans
 * prospects.site_style_dna.
 *
 * Limit max 50 par run pour rester sous les 300s Vercel timeout.
 *
 * Auth : x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { scrapeWebsiteDnaDeep as scrapeWebsiteDna } from "@/lib/scrape-prospect-site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const offset = Math.max(0, parseInt(req.nextUrl.searchParams.get("offset") || "0", 10));
  const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get("limit") || "50", 10));
  const force = req.nextUrl.searchParams.get("force") === "1";

  const supabase = db();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, slug, name, city, business_type, website, site_style_dna")
    .not("website", "is", null)
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const list = data || [];
  let scraped = 0;
  let skipped = 0;
  let failed = 0;
  const samples: Array<{ slug: string; primaryColor: string | null; logoUrl: string | null }> = [];

  for (const p of list) {
    if (!p.website || !/^https?:\/\//.test(p.website)) { skipped++; continue; }
    if (!force && p.site_style_dna && (p.site_style_dna as { scrapedAt?: string }).scrapedAt) {
      skipped++; continue;
    }
    const isGarage = /\b(garage|garagi|m[eé]canicien|carrosseri|concession|automobile|auto)\b/i.test(((p.business_type as string) || "") + " " + ((p.name as string) || ""));
    // Cache économe : skip Scrapling Railway si déjà tenté (évite frais Tom)
    const prevDnaForCache = (p.site_style_dna || {}) as { scrapling?: { triedAt?: string } };
    const skipScraplingForCache = !!prevDnaForCache.scrapling?.triedAt;
    const dna = await scrapeWebsiteDna(p.website, {
      timeoutMs: 12000,
      garageName: isGarage ? (p.name as string) : undefined,
      garageCity: isGarage ? (p.city as string) : undefined,
      skipScrapling: skipScraplingForCache,
    });
    if (dna.error) { failed++; continue; }
    const { error: upErr } = await supabase
      .from("prospects")
      .update({ site_style_dna: dna, updated_at: new Date().toISOString() })
      .eq("id", p.id);
    if (upErr) { failed++; continue; }
    scraped++;
    if (samples.length < 10) samples.push({ slug: p.slug, primaryColor: dna.primaryColor, logoUrl: dna.logoUrl });
  }

  return NextResponse.json({
    success: true,
    offset, limit,
    scanned: list.length,
    scraped, skipped, failed,
    samples,
  });
}

export const GET = POST;
