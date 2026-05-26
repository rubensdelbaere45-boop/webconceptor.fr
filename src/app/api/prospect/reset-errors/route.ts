import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

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

  // Compte d'abord pour le rapport
  const { data: toReset, error: selectErr } = await supabase
    .from("prospects")
    .select("id, name, error")
    .eq("status", "error")
    .not("email", "is", null);

  if (selectErr) {
    return NextResponse.json({ error: selectErr.message }, { status: 500 });
  }

  if (!toReset || toReset.length === 0) {
    return NextResponse.json({ success: true, reset: 0, message: "Rien à réinitialiser" });
  }

  // Remet TOUS les prospects en erreur (avec email) en 'found' pour retry
  const { error: updateErr } = await supabase
    .from("prospects")
    .update({ status: "found", error: null })
    .eq("status", "error")
    .not("email", "is", null);

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
