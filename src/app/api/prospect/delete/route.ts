import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/delete
   Auth : x-admin-key

   Supprime définitivement un prospect de la DB (destructif).
   Utilisé depuis l'admin quand Rubens a appelé le prospect et que celui-ci
   n'est PAS intéressé → libère de la place dans la liste, évite de le
   recontacter par erreur.

   Body : { id: string }
   ou query : ?id=...
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

  let id = new URL(req.url).searchParams.get("id") || "";

  if (!id) {
    try {
      const body = await req.json();
      if (typeof body?.id === "string") id = body.id;
    } catch { /* ignore */ }
  }

  if (!id || !/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "ID prospect invalide" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // On récupère d'abord le prospect pour le logger avant suppression
  const { data: existing, error: fetchErr } = await supabase
    .from("prospects")
    .select("id, name, slug")
    .eq("id", id)
    .maybeSingle();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  }

  const { error: deleteErr } = await supabase
    .from("prospects")
    .delete()
    .eq("id", id);

  if (deleteErr) {
    console.error("[delete] supabase error:", deleteErr);
    return NextResponse.json({ error: "Échec suppression" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    deleted: { id: existing.id, name: existing.name, slug: existing.slug },
  });
}

export async function POST(req: NextRequest) { return handler(req); }
export async function DELETE(req: NextRequest) { return handler(req); }
