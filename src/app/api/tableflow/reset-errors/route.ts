import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();

  const { data: toReset } = await supabase
    .from("tableflow_prospects")
    .select("id, name, error")
    .eq("status", "error")
    .not("email", "is", null);

  if (!toReset || toReset.length === 0) {
    return NextResponse.json({ success: true, reset: 0, message: "Rien à réinitialiser" });
  }

  await supabase
    .from("tableflow_prospects")
    .update({ status: "found", error: null })
    .eq("status", "error")
    .not("email", "is", null);

  return NextResponse.json({
    success: true,
    reset: toReset.length,
    names: toReset.slice(0, 10).map((p) => p.name),
    message: `${toReset.length} restaurants remis en file d'attente`,
  });
}
