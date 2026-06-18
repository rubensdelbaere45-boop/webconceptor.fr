/**
 * POST /api/admin/regen-plombiers
 *
 * Force la régénération de toutes les maquettes avec business_type='plombier'
 * (ou nom contenant 'plomb') en utilisant le template Stitch Plombier.
 * Idempotent — sûr à relancer plusieurs fois.
 *
 * Auth : x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { generateStitchPlombierMockupHtml } from "@/lib/mockup-stitch-plombier";

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

  const supabase = db();
  const { data } = await supabase
    .from("prospects")
    .select("id, slug, name, city, address, phone, email, website_photos, business_type")
    .or("business_type.eq.plombier,name.ilike.%plomb%,slug.ilike.%plomb%")
    .limit(500);

  const list = data || [];
  let updated = 0;
  let errors = 0;
  const samples: Array<{ slug: string; chars: number }> = [];

  for (const p of list) {
    try {
      const html = generateStitchPlombierMockupHtml({
        id: p.id, slug: p.slug, name: p.name,
        city: p.city || null, address: p.address || null,
        phone: p.phone || null, email: p.email || null,
        website_photos: (p.website_photos as string[]) || null,
      });
      if (html && html.length > 5000) {
        const { error: upErr } = await supabase
          .from("prospects")
          .update({ mockup_html: html, updated_at: new Date().toISOString() })
          .eq("id", p.id);
        if (!upErr) {
          updated++;
          if (samples.length < 10) samples.push({ slug: p.slug, chars: html.length });
        } else { errors++; }
      }
    } catch { errors++; }
  }

  return NextResponse.json({ success: true, total: list.length, updated, errors, samples });
}

export const GET = POST;
