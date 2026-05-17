import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   GET /api/prospect/stats
   Auth : x-admin-key
   Retourne un résumé léger des métriques prospects
   (pas de mockup_html → aucun risque de crash N8N)
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

export async function GET(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // Counts by status — léger, pas de mockup_html
  const { data, error } = await supabase
    .from("prospects")
    .select("status, email_sent_at, email_opened_at, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data || [];
  const total = rows.length;
  const now = Date.now();
  const oneDayMs = 86400000;

  // Count by status
  const byStatus: Record<string, number> = {};
  for (const r of rows) {
    byStatus[r.status] = (byStatus[r.status] || 0) + 1;
  }

  const sent      = rows.filter(r => r.email_sent_at).length;
  const opened    = rows.filter(r => r.email_opened_at).length;
  const converted = byStatus["converted"] || 0;
  const ready     = byStatus["mockup_ready"] || byStatus["found"] || 0;

  // Last 24h
  const last24h = rows.filter(r => r.created_at && (now - new Date(r.created_at).getTime()) < oneDayMs).length;

  // Conversion rate
  const openRate  = sent > 0 ? Math.round(opened / sent * 100) : 0;
  const convRate  = sent > 0 ? Math.round(converted / sent * 100) : 0;

  return NextResponse.json({
    stats: {
      total,
      sent,
      opened,
      converted,
      ready,
      last24h,
      openRate,
      convRate,
      byStatus,
    },
  });
}
