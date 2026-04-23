import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/delete-unsubscribed
   Auth : x-admin-key

   Supprime DÉFINITIVEMENT (DELETE) tous les prospects qui ont un
   `unsubscribed_at` non-null. Ce flag couvre :
     - Les 244 "premium" purgés (site correct/bon — pas notre cible)
     - Les 8 franchises exclues (Basic-Fit, Fitness Park, Keepcool)
     - Les futurs prospects qui cliqueront "se désabonner"

   Rubens veut avoir un admin propre, sans ces lignes inutiles.
   Action destructive et IRRÉVERSIBLE — les lignes disparaissent de la DB.

   Query : ?dry_run=1 pour juste compter sans supprimer.
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
    .select("id, name, site_quality, notes")
    .not("unsubscribed_at", "is", null);

  if (error) {
    return NextResponse.json({ error: "DB query failed" }, { status: 500 });
  }
  if (!targets || targets.length === 0) {
    return NextResponse.json({ success: true, deleted: 0, message: "Aucun prospect unsubscribed à supprimer" });
  }

  const breakdown = {
    premium: targets.filter((t) => (t.notes || "").includes("Purge premium")).length,
    franchise: targets.filter((t) => (t.notes || "").includes("Franchise")).length,
    other: targets.filter((t) => !(t.notes || "").includes("Purge premium") && !(t.notes || "").includes("Franchise")).length,
  };

  if (dryRun) {
    return NextResponse.json({
      success: true,
      dry_run: true,
      would_delete: targets.length,
      breakdown,
    });
  }

  const ids = targets.map((t) => t.id);
  const { error: deleteErr } = await supabase
    .from("prospects")
    .delete()
    .in("id", ids);

  if (deleteErr) {
    console.error("[delete-unsubscribed] error:", deleteErr);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    deleted: targets.length,
    breakdown,
  });
}

export async function POST(req: NextRequest) { return handler(req); }
export async function GET(req: NextRequest) { return handler(req); }
