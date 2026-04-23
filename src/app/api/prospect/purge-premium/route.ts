import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/purge-premium
   Auth : x-admin-key

   PURGE MASSIVE : marque unsubscribed_at sur TOUS les prospects qui ont
   un `site_quality` == 'good' ou 'average'. Ces gens ont déjà un site
   pro ou correct — notre maquette template leur paraîtra inférieure.
   → Tenter de les démarcher fait perdre du temps et abîme la marque.

   Préserve la ligne (pour analytics) : on set unsubscribed_at, on ne DELETE pas.
   Ajoute une note "Purge premium (site déjà correct/bon)" pour traçabilité.

   Query : ?dry_run=1 pour juste compter sans modifier.
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

async function handler(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") === "1" || url.searchParams.get("dry_run") === "true";
  const supabase = getSupabaseAdmin();

  const { data: targets, error } = await supabase
    .from("prospects")
    .select("id, name, city, site_quality")
    .in("site_quality", ["good", "average"])
    .is("unsubscribed_at", null);

  if (error) {
    return NextResponse.json({ error: "DB query failed" }, { status: 500 });
  }
  if (!targets || targets.length === 0) {
    return NextResponse.json({ success: true, purged: 0, message: "Aucun prospect à purger" });
  }

  if (dryRun) {
    return NextResponse.json({
      success: true,
      dry_run: true,
      would_purge: targets.length,
      breakdown: {
        good: targets.filter((t) => t.site_quality === "good").length,
        average: targets.filter((t) => t.site_quality === "average").length,
      },
    });
  }

  const now = new Date().toISOString();
  const ids = targets.map((t) => t.id);
  const { error: updateErr } = await supabase
    .from("prospects")
    .update({
      unsubscribed_at: now,
      notes: `Purge premium (site déjà correct/bon) — ${now}`,
    })
    .in("id", ids);

  if (updateErr) {
    return NextResponse.json({ error: "Purge failed" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    purged: targets.length,
    breakdown: {
      good: targets.filter((t) => t.site_quality === "good").length,
      average: targets.filter((t) => t.site_quality === "average").length,
    },
  });
}

export async function POST(req: NextRequest) { return handler(req); }
export async function GET(req: NextRequest) { return handler(req); }
