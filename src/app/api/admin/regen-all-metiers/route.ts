/**
 * POST /api/admin/regen-all-metiers
 *
 * Bulk regen : pour chaque prospect avec un métier matché par le Stitch
 * engine (électricien, garage, dentiste, ostéo, café, auto-école, épicerie
 * fine, boulangerie, fleuriste, menuisier, couvreur, vétérinaire, coiffeur,
 * institut), génère un nouveau mockup_html avec le template Material 3.
 *
 * Le plombier passe par /api/admin/regen-plombiers (template dédié).
 *
 * Auth : x-admin-key
 * Query : ?metier=electricien → restrict à un seul métier
 *         ?offset=0&limit=500
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { generateStitchMetierMockupHtml, findMetierConfig, METIER_CONFIGS } from "@/lib/mockup-stitch-engine";
import { generateStitchMetierFullMockupHtml, isMetierSupported } from "@/lib/mockup-stitch-metiers-all";

function detectMetierFullKey(p: { business_type?: string | null; name?: string | null; slug?: string | null }): string | null {
  const haystack = `${p.business_type || ""} ${p.name || ""} ${p.slug || ""}`.toLowerCase();
  if (/\bost[eé]o/.test(haystack)) return "osteo";
  if (/\bgarage|garagi|m[eé]canicien|carrosseri/.test(haystack)) return "garage";
  if (/\binstitut|esth[eé]ti|beaut[eé]/.test(haystack)) return "institut";
  if (/\bcaf[eé](?!fer)/.test(haystack)) return "cafe";
  if (/\bboulanger/.test(haystack)) return "boulangerie";
  if (/\bmenuis/.test(haystack)) return "menuisier";
  if (/\bfleurist/.test(haystack)) return "fleuriste";
  if (/\bcoiffeu|salon\s*de\s*coiffure/.test(haystack)) return "coiffeur";
  if (/\bauto[\s-]*[eé]cole/.test(haystack)) return "autoecole";
  if (/\b[eé]picerie/.test(haystack)) return "epicerie";
  if (/\bcouvreur|toitur|zinguer/.test(haystack)) return "couvreur";
  if (/\bv[eé]t[eé]rinaire|clinique\s*animal/.test(haystack)) return "veterinaire";
  return null;
}

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

  const metierFilter = req.nextUrl.searchParams.get("metier") || null;
  const offset = Math.max(0, parseInt(req.nextUrl.searchParams.get("offset") || "0", 10));
  const limit = Math.min(500, parseInt(req.nextUrl.searchParams.get("limit") || "500", 10));

  const supabase = db();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, slug, name, city, address, phone, email, website_photos, business_type, hours, reviews, google_rating, google_reviews_count")
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const list = data || [];
  const counts: Record<string, number> = {};
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  const samples: Array<{ slug: string; metier: string }> = [];

  const samplesByMetier: Record<string, { slug: string; name: string }> = {};

  for (const p of list) {
    // PRIORITÉ 1 : Stitch FULL lib (12 métiers avec fixes nav/bandeau/horaires)
    const fullKey = detectMetierFullKey({ business_type: p.business_type, name: p.name, slug: p.slug });
    if (fullKey && isMetierSupported(fullKey)) {
      if (metierFilter && fullKey !== metierFilter) {
        skipped++;
        continue;
      }
      try {
        const html = generateStitchMetierFullMockupHtml({
          id: p.id, slug: p.slug, name: p.name,
          city: p.city || null, address: p.address || null,
          phone: p.phone || null, email: p.email || null,
          hours: (p as { hours?: string }).hours || null,
          google_rating: (p as { google_rating?: number }).google_rating || null,
          google_reviews_count: (p as { google_reviews_count?: number }).google_reviews_count || null,
          reviews: (p as { reviews?: Array<{ author?: string; rating?: number; text?: string; timeAgo?: string }> }).reviews || null,
        }, fullKey);
        if (html && html.length > 5000) {
          const { error: upErr } = await supabase
            .from("prospects")
            .update({ mockup_html: html, updated_at: new Date().toISOString() })
            .eq("id", p.id);
          if (!upErr) {
            updated++;
            counts[`full:${fullKey}`] = (counts[`full:${fullKey}`] || 0) + 1;
            if (!samplesByMetier[fullKey]) samplesByMetier[fullKey] = { slug: p.slug, name: p.name };
            if (samples.length < 30) samples.push({ slug: p.slug, metier: `full:${fullKey}` });
            continue;
          }
        }
        errors++;
      } catch {
        errors++;
      }
      continue;
    }

    // PRIORITÉ 2 : engine legacy (autres métiers non supportés par lib full)
    const config = findMetierConfig({ name: p.name, slug: p.slug, business_type: p.business_type });
    if (!config) {
      skipped++;
      continue;
    }
    if (config.key === "plombier") {
      skipped++;
      continue;
    }
    if (metierFilter && config.key !== metierFilter) {
      skipped++;
      continue;
    }

    try {
      const html = generateStitchMetierMockupHtml({
        id: p.id, slug: p.slug, name: p.name,
        city: p.city || null, address: p.address || null,
        phone: p.phone || null, email: p.email || null,
        website_photos: (p.website_photos as string[]) || null,
      }, p.business_type);

      if (html && html.length > 5000) {
        const { error: upErr } = await supabase
          .from("prospects")
          .update({ mockup_html: html, updated_at: new Date().toISOString() })
          .eq("id", p.id);
        if (!upErr) {
          updated++;
          counts[config.key] = (counts[config.key] || 0) + 1;
          if (samples.length < 30) samples.push({ slug: p.slug, metier: config.key });
        } else { errors++; }
      } else {
        errors++;
      }
    } catch {
      errors++;
    }
  }

  return NextResponse.json({
    success: true,
    offset, limit,
    scanned: list.length,
    updated,
    skipped,
    errors,
    by_metier: counts,
    available_metiers: METIER_CONFIGS.map((c) => c.key),
    samples,
    samples_by_metier_full: samplesByMetier,
  });
}

export const GET = POST;
