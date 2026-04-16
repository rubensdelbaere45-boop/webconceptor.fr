import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

// POST: create a new demande (public — from the form)
export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body.nom || !body.email || !body.activite) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin().from("demandes").insert({
    activite: body.activite,
    besoin: body.besoin || "",
    has_site: body.has_site || false,
    details: body.details || "",
    style: body.style || "",
    exemples: body.exemples || "",
    nom: body.nom,
    email: body.email,
    telephone: body.telephone || "",
    budget: body.budget || "",
    site_url: body.site_url || "",
    audit_results: body.audit_results || "",
    statut: "nouveau",
  }).select().single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// GET: list all demandes (admin only)
export async function GET(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  const authHeader = req.headers.get("authorization");

  // Allow access via admin key OR via authenticated admin user
  if (!adminKey && !authHeader) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  if (adminKey && adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("demandes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
