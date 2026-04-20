import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

// Use service role key for admin operations
function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

// GET: fetch project by code
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code || code.length !== 6) {
    return NextResponse.json({ error: "Code invalide" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("projects")
    .select("*")
    .eq("code", code)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Code introuvable" }, { status: 404 });
  }

  return NextResponse.json(data);
}

// POST: create a new project (admin only)
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");

  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  const { data, error } = await getSupabaseAdmin().from("projects").insert({
    code,
    title: body.title,
    description: body.description || "",
    client_name: body.client_name || "",
    client_email: body.client_email || "",
    price_cents: body.price_cents || 0,
    preview_url: body.preview_url || "",
    contract_text: body.contract_text || "",
    stripe_payment_link: body.stripe_payment_link || "",
    status: "sent",
  }).select().single();

  if (error) {
    console.error("[projects] insert error:", error);
    return NextResponse.json({ error: "Impossible de creer le projet" }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
