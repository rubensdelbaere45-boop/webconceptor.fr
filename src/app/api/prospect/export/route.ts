import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

/* ══════════════════════════════════════════
   GET /api/prospect/export?id=<uuid>
   Télécharge la maquette HTML (attachment) pour que Rubens
   puisse la donner à Claude pour finaliser le site de production.
   Auth : x-admin-key header.
   ══════════════════════════════════════════ */

function slugifyFilename(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "mockup";
}

export async function GET(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return new NextResponse("Non autorise", { status: 401 });
  }

  const id = req.nextUrl.searchParams.get("id") || "";
  if (!/^[0-9a-f-]{10,64}$/i.test(id)) {
    return new NextResponse("id invalide", { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("prospects")
    .select("name, slug, mockup_html")
    .eq("id", id)
    .maybeSingle();

  if (error || !data || !data.mockup_html) {
    return new NextResponse("Maquette introuvable", { status: 404 });
  }

  const filename = `mockup-${slugifyFilename(data.name)}.html`;

  return new NextResponse(data.mockup_html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
