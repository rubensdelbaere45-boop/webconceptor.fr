/**
 * POST /api/admin/scrape-prospect-site?slug=XXX[&force=1]
 *
 * Scrape le site web du prospect (prospect.website), extrait son DNA visuel
 * et le stocke dans prospects.site_style_dna (JSONB).
 *
 * - Skip si déjà scrapé sauf ?force=1
 * - Si pas de website → 200 { skipped: "no_website" }
 *
 * Auth : x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { scrapeWebsiteDna } from "@/lib/scrape-prospect-site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

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
  const slug = req.nextUrl.searchParams.get("slug") || "";
  const force = req.nextUrl.searchParams.get("force") === "1";
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

  const supabase = db();
  const { data: p } = await supabase
    .from("prospects")
    .select("id, slug, website, site_style_dna")
    .eq("slug", slug)
    .maybeSingle();
  if (!p) return NextResponse.json({ error: "prospect introuvable" }, { status: 404 });
  if (!p.website || !/^https?:\/\//.test(p.website)) {
    return NextResponse.json({ skipped: "no_website", slug, website: p.website });
  }
  if (!force && p.site_style_dna && (p.site_style_dna as { scrapedAt?: string }).scrapedAt) {
    return NextResponse.json({ skipped: "already_scraped", slug, website: p.website, scrapedAt: (p.site_style_dna as { scrapedAt?: string }).scrapedAt });
  }

  const dna = await scrapeWebsiteDna(p.website);
  const { error: upErr } = await supabase
    .from("prospects")
    .update({ site_style_dna: dna, updated_at: new Date().toISOString() })
    .eq("id", p.id);

  return NextResponse.json({
    success: !upErr,
    slug,
    website: p.website,
    dna_summary: {
      primaryColor: dna.primaryColor,
      accentColor: dna.accentColor,
      dominantColors: dna.dominantColors,
      logoUrl: dna.logoUrl,
      heroImageUrl: dna.heroImageUrl,
      fontFamilies: dna.fontFamilies,
      keywordsCount: dna.keywords.length,
      sectionTitlesCount: dna.sectionTitles.length,
      navLinksCount: dna.navLinks.length,
      error: dna.error,
    },
    upErr: upErr?.message,
  });
}

export const GET = POST;
