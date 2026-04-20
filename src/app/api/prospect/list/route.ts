import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

export async function GET(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const status = req.nextUrl.searchParams.get("status") || "all";
  const supabase = getSupabaseAdmin();

  // select * pour survivre aux colonnes optionnelles (project_code, business_type)
  // qui peuvent ne pas encore exister si la migration n'a pas été lancée.
  let query = supabase
    .from("prospects")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[prospect/list] error:", error);
    return NextResponse.json({ error: "Impossible de charger les prospects" }, { status: 500 });
  }

  return NextResponse.json({ prospects: data || [] });
}
