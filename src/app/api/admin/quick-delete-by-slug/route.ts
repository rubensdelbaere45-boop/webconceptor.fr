import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const key = req.headers.get("x-admin-key") || "";
  if (key !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const slug = req.nextUrl.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
  const { data: ex } = await supabase
    .from("prospects").select("id, name").eq("slug", slug).maybeSingle();
  if (!ex) return NextResponse.json({ error: "introuvable" }, { status: 404 });
  const { error } = await supabase.from("prospects").delete().eq("id", ex.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true, deleted: ex });
}
