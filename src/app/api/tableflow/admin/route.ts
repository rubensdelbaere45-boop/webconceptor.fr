import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

interface MenuItem {
  name: string;
  description?: string;
  price?: string | number;
  category?: string;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/* ── GET — récupérer le restaurant via admin_token ───────────────────────── */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const slug  = searchParams.get("slug");

  if (!token || !slug) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  const { data, error } = await getSupabase()
    .from("tableflow_prospects")
    .select("id,slug,name,city,address,phone,website,google_rating,google_reviews_count,photos,cuisine_type,menu_items,is_live,admin_token")
    .eq("slug", slug)
    .eq("admin_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Token invalide ou restaurant introuvable" }, { status: 401 });
  }

  return NextResponse.json(data);
}

/* ── PUT — mettre à jour la carte complète ───────────────────────────────── */
export async function PUT(req: NextRequest) {
  let body: { slug?: string; token?: string; menu_items?: MenuItem[] };
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide" }, { status: 400 }); }

  const { slug, token, menu_items } = body;

  if (!slug || !token || !Array.isArray(menu_items)) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
  }

  /* Vérifier le token */
  const { data: existing } = await getSupabase()
    .from("tableflow_prospects")
    .select("id")
    .eq("slug", slug)
    .eq("admin_token", token)
    .single();

  if (!existing) {
    return NextResponse.json({ error: "Token invalide" }, { status: 401 });
  }

  /* Nettoyer les items */
  const cleaned: MenuItem[] = menu_items
    .filter((it) => it.name && it.name.trim())
    .map((it) => ({
      name: it.name.trim(),
      ...(it.description ? { description: it.description.trim() } : {}),
      ...(it.price !== undefined && it.price !== "" ? { price: it.price } : {}),
      ...(it.category ? { category: it.category.trim() } : {}),
    }));

  const { error } = await getSupabase()
    .from("tableflow_prospects")
    .update({ menu_items: cleaned })
    .eq("slug", slug);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, count: cleaned.length });
}
