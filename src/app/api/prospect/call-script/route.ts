import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { generateCallScript } from "@/lib/call-script";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

/* ══════════════════════════════════════════
   POST /api/prospect/call-script
   Body : { prospect_id }
   Renvoie un script d'appel personnalisé généré par Claude Haiku pour
   ce prospect précis — utile pour rappeler un HOT LEAD manqué.
   ══════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const prospect_id = typeof body.prospect_id === "string" && /^[0-9a-f-]{10,64}$/i.test(body.prospect_id)
    ? body.prospect_id
    : null;

  if (!prospect_id) {
    return NextResponse.json({ error: "prospect_id invalide" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("prospects")
    .select("name, city, business_type, google_rating, google_reviews_count, site_quality, address")
    .eq("id", prospect_id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  }

  const script = await generateCallScript({
    prospectName: data.name,
    city: data.city,
    businessType: data.business_type,
    googleRating: data.google_rating,
    googleReviewsCount: data.google_reviews_count,
    siteQuality: data.site_quality,
    address: data.address,
  });

  return NextResponse.json({ success: true, script });
}
