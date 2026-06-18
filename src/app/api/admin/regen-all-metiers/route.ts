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
    .select("id, slug, name, city, address, phone, email, website_photos, business_type")
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const list = data || [];
  const counts: Record<string, number> = {};
  let updated = 0;
  let skipped = 0;
  let errors = 0;
  const samples: Array<{ slug: string; metier: string }> = [];

  for (const p of list) {
    const config = findMetierConfig({ name: p.name, slug: p.slug, business_type: p.business_type });
    if (!config) {
      skipped++;
      continue;
    }
    // Skip plombier (template dédié géré ailleurs)
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
          if (samples.length < 15) samples.push({ slug: p.slug, metier: config.key });
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
  });
}

export const GET = POST;
