/**
 * POST /api/admin/force-regen-one?slug=XXX
 *
 * Force la regénération d'UN seul prospect en utilisant le Stitch engine
 * en priorité. Renvoie l'aperçu HTML généré pour debug.
 *
 * Auth : x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { generateStitchMetierMockupHtml, findMetierConfig } from "@/lib/mockup-stitch-engine";
import { generateStitchPlombierMockupHtml } from "@/lib/mockup-stitch-plombier";
import { generateStitchPlombierFullMockupHtml } from "@/lib/mockup-stitch-plombier-full";
import { generateStitchDentisteFullMockupHtml } from "@/lib/mockup-stitch-dentiste-full";
import { generateStitchElectricienMockupHtml } from "@/lib/mockup-stitch-electricien-full";

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
  if (!slug) return NextResponse.json({ error: "slug param requis" }, { status: 400 });

  const supabase = db();
  const { data: p } = await supabase
    .from("prospects")
    .select("id, slug, name, city, address, phone, email, website_photos, business_type, hours, reviews, google_rating, google_reviews_count")
    .eq("slug", slug)
    .maybeSingle();
  if (!p) return NextResponse.json({ error: "prospect introuvable" }, { status: 404 });

  // Detect config
  const config = findMetierConfig({ name: p.name, slug: p.slug, business_type: p.business_type });

  let html: string | null = null;
  let templateUsed = "none";

  // Électricien priority (pixel-pixel Stitch)
  const looksLikeElectricien = p.business_type === "electricien" || /\b(electric|électrici|électrique)/i.test(p.name || "") || /\b(electric|électrici|électrique)/i.test(p.slug || "");
  if (looksLikeElectricien) {
    html = generateStitchElectricienMockupHtml({
      id: p.id, slug: p.slug, name: p.name,
      city: p.city || null, address: p.address || null,
      phone: p.phone || null, email: p.email || null,
      website_photos: (p.website_photos as string[]) || null,
    });
    templateUsed = "electricien-full";
  } else {

  // Dentiste priority — template Stitch FULL pixel-pixel
  const looksLikeDentiste = p.business_type === "dentiste" || /\b(dentiste|dental|orthodont|cabinet[ -]dentaire)/i.test(p.name || "") || /\b(dentiste|dental|orthodont|cabinet[ -]dentaire)/i.test(p.slug || "");
  if (looksLikeDentiste) {
    html = generateStitchDentisteFullMockupHtml({
      id: p.id, slug: p.slug, name: p.name,
      city: p.city || null, address: p.address || null,
      phone: p.phone || null, email: p.email || null,
      hours: (p as { hours?: string }).hours || null,
      google_rating: (p as { google_rating?: number }).google_rating || null,
      google_reviews_count: (p as { google_reviews_count?: number }).google_reviews_count || null,
      reviews: (p as { reviews?: Array<{ author?: string; rating?: number; text?: string; timeAgo?: string }> }).reviews || null,
    });
    templateUsed = "dentiste-full";
  } else {

  // Plombier priority — template Stitch FULL pixel-pixel
  const looksLikePlombier = p.business_type === "plombier" || /\bplomb/i.test(p.name || "") || /\bplomb/i.test(p.slug || "");
  if (looksLikePlombier) {
    html = generateStitchPlombierFullMockupHtml({
      id: p.id, slug: p.slug, name: p.name,
      city: p.city || null, address: p.address || null,
      phone: p.phone || null, email: p.email || null,
      hours: (p as { hours?: string }).hours || null,
      google_rating: (p as { google_rating?: number }).google_rating || null,
      google_reviews_count: (p as { google_reviews_count?: number }).google_reviews_count || null,
      reviews: (p as { reviews?: Array<{ author?: string; rating?: number; text?: string; timeAgo?: string }> }).reviews || null,
    });
    templateUsed = "plombier-full";
  } else if (config) {
    html = generateStitchMetierMockupHtml({
      id: p.id, slug: p.slug, name: p.name,
      city: p.city || null, address: p.address || null,
      phone: p.phone || null, email: p.email || null,
      website_photos: (p.website_photos as string[]) || null,
    }, p.business_type);
    templateUsed = `engine:${config.key}`;
  }
  }
  }

  if (!html || html.length < 5000) {
    return NextResponse.json({
      error: "No template matched or html too short",
      templateUsed,
      configFound: config?.key || null,
      htmlLength: html?.length || 0,
    }, { status: 400 });
  }

  const { error: upErr } = await supabase
    .from("prospects")
    .update({ mockup_html: html, updated_at: new Date().toISOString() })
    .eq("id", p.id);

  return NextResponse.json({
    success: !upErr,
    slug: p.slug,
    name: p.name,
    business_type: p.business_type,
    templateUsed,
    htmlLength: html.length,
    htmlHash: html.length,
    error: upErr?.message,
  });
}

export const GET = POST;
