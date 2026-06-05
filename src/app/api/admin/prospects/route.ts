// GET /api/admin/prospects — liste des prospects pour le dashboard admin
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

interface DbProspect {
  id: string;
  slug: string | null;
  name: string | null;
  city: string | null;
  business_type: string | null;
  google_rating: number | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  stitch_generated: boolean | null;
  mockup_html: string | null;
  updated_at: string;
  opened_at: string | null;
}

export async function GET() {
  const supabase = db();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, slug, name, city, business_type, google_rating, email, phone, status, stitch_generated, mockup_html, updated_at, opened_at")
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Mapping DB → format attendu par le frontend admin (handoff Claude Design)
  const prospects = (data as DbProspect[] | null ?? []).map((p) => ({
    id: p.id,
    slug: p.slug ?? "",
    name: p.name ?? "",
    city: p.city ?? "",
    type: p.business_type ?? "",            // ← business_type → type
    rating: p.google_rating ?? 0,           // ← google_rating → rating
    email: p.email ?? "",
    phone: p.phone ?? "",
    status: p.status ?? "found",
    mockup: p.stitch_generated ? "stitch" : "template",  // ← stitch_generated → mockup
    mockup_url: p.slug ? `/prospects/${p.slug}` : undefined,
    updated_at: p.updated_at,
    opened_at: p.opened_at ?? undefined,
  }));

  return NextResponse.json({ prospects });
}
