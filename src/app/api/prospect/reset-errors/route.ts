import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/reset-errors
   Remet en status='found' les prospects qui ont été marqués 'error' par
   l'ancienne logique de skip "good site" (avant commit bb3ae3e).
   Ces prospects ont un email valide et méritent d'être recontactés.
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  // On reset SEULEMENT les prospects qui ont été skippés par l'ancien code
  // (error commence par "skipped:"). Pas les vrais échecs Brevo.
  const { data: toReset, error: selectErr } = await supabase
    .from("prospects")
    .select("id, name")
    .eq("status", "error")
    .like("error", "skipped:%");

  if (selectErr) {
    return NextResponse.json({ error: selectErr.message }, { status: 500 });
  }

  if (!toReset || toReset.length === 0) {
    return NextResponse.json({ success: true, reset: 0, message: "Rien à réinitialiser" });
  }

  const { error: updateErr } = await supabase
    .from("prospects")
    .update({ status: "found", error: null })
    .eq("status", "error")
    .like("error", "skipped:%");

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    reset: toReset.length,
    names: toReset.slice(0, 10).map((p) => p.name),
    message: `${toReset.length} prospects remis en file d'attente`,
  });
}
