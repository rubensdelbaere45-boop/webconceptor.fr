// GET /api/admin/prospects — liste des prospects pour le dashboard admin
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

export async function GET() {
  const supabase = db();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, slug, name, city, business_type, google_rating, email, phone, status, mockup_type, mockup_html, updated_at, opened_at")
    .order("updated_at", { ascending: false })
    .limit(500);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ prospects: data ?? [] });
}
