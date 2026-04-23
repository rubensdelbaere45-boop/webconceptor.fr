import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/purge-no-email
   Auth : x-admin-key

   DELETE définitivement tous les prospects qui n'ont PAS d'email.
   Raison : sans email, on ne peut pas :
     - envoyer la maquette par mail (levier principal)
     - faire de relance J+2
     - envoyer un code PIN
   Donc ça ne sert à rien de les garder, sauf cas exceptionnel.

   EXCEPTION (on les GARDE) : prospects "sûrs de dire oui" au téléphone :
     - site_quality = 'none' (aucun site web) ET
     - google_rating >= 4.5 (business actif, bien noté)
   Ces prospects méritent un cold call même sans email.

   Query : ?dry_run=1 pour simuler.
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

  // Tous les prospects sans email
  const { data: noEmailAll, error } = await supabase
    .from("prospects")
    .select("id, name, site_quality, google_rating, phone")
    .or("email.is.null,email.eq.")
    .is("unsubscribed_at", null); // ne re-delete pas les déjà unsubscribed

  if (error) {
    return NextResponse.json({ error: "DB query failed" }, { status: 500 });
  }
  if (!noEmailAll || noEmailAll.length === 0) {
    return NextResponse.json({ success: true, deleted: 0, kept: 0, message: "Aucun prospect sans email" });
  }

  // Sépare : à garder (hot cold-call) vs à supprimer
  const toKeep: typeof noEmailAll = [];
  const toDelete: typeof noEmailAll = [];
  for (const p of noEmailAll) {
    const isHotColdCall =
      p.site_quality === "none" &&
      typeof p.google_rating === "number" &&
      p.google_rating >= 4.5 &&
      !!p.phone; // faut un tel pour pouvoir appeler
    if (isHotColdCall) toKeep.push(p);
    else toDelete.push(p);
  }

  if (dryRun) {
    return NextResponse.json({
      success: true,
      dry_run: true,
      would_delete: toDelete.length,
      would_keep: toKeep.length,
      kept_examples: toKeep.slice(0, 5).map((p) => ({ name: p.name, rating: p.google_rating, phone: p.phone })),
    });
  }

  if (toDelete.length === 0) {
    return NextResponse.json({ success: true, deleted: 0, kept: toKeep.length });
  }

  const ids = toDelete.map((p) => p.id);
  const { error: deleteErr } = await supabase
    .from("prospects")
    .delete()
    .in("id", ids);

  if (deleteErr) {
    console.error("[purge-no-email] error:", deleteErr);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    deleted: toDelete.length,
    kept: toKeep.length,
    kept_prospects: toKeep.map((p) => ({ name: p.name, rating: p.google_rating })),
  });
}

export async function POST(req: NextRequest) { return handler(req); }
export async function GET(req: NextRequest) { return handler(req); }
