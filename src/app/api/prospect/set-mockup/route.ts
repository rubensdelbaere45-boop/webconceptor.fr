import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/set-mockup
   Auth : x-admin-key (ADMIN_SECRET_KEY)

   Injecte un HTML personnalisé directement en DB pour un prospect.
   Utile pour les maquettes sur-mesure qui ne passent pas par la génération Claude.

   Body : { slug: string, html: string }
   Retourne : { success, name, slug, chars }
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const slug = String(body.slug || "").slice(0, 100).trim();
  const html = String(body.html || "").trim();

  if (!slug || !html) {
    return NextResponse.json({ error: "slug et html requis" }, { status: 400 });
  }
  if (html.length < 1000) {
    return NextResponse.json({ error: "HTML trop court (< 1000 chars)" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  const { data: prospect, error } = await supabase
    .from("prospects")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !prospect) {
    return NextResponse.json({ error: "Prospect introuvable pour ce slug" }, { status: 404 });
  }

  const { error: updateError } = await supabase
    .from("prospects")
    .update({
      mockup_html: html,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prospect.id);

  if (updateError) {
    return NextResponse.json({ error: "Erreur DB: " + updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    name: prospect.name,
    slug: prospect.slug,
    chars: html.length,
  });
}
