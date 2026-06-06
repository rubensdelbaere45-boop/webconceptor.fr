/**
 * GET /api/admin/mockup-videos — liste les vidéos générées (20 plus récentes)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminGuard } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 60, windowSec: 60, routeKey: "mockup-videos" });
  if (guard) return guard;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  const { data, error } = await supabase
    .from("mockup_videos")
    .select("id, video_id, business_name, business_type, city, niche, status, download_url, posted_to_tiktok, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    // Si la table n'existe pas encore (avant migration), retourne liste vide
    if (/relation .* does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({ videos: [], warning: "Table mockup_videos absente — lance le setup pipeline" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ videos: data || [] });
}
