/**
 * GET /api/admin/ebooks — liste les 30 derniers e-books générés
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminGuard } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 60, windowSec: 60, routeKey: "ebooks-list" });
  if (guard) return guard;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );

  const { data, error } = await supabase
    .from("ebooks")
    .select("id, title, subtitle, author_pseudo, niche_topic, niche_angle, status, kdp_price_eur, kdp_royalty_percent, total_words, estimated_pages, pdf_url, cover_url, cover_source, sent_at, published_on_kdp, total_sales, total_revenue_eur, created_at")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) {
    if (/relation .* does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({ ebooks: [], warning: "Table ebooks absente — lance setup pipeline" });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ebooks: data || [] });
}
