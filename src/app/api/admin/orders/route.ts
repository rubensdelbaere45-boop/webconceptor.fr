// GET /api/admin/orders — liste des commandes payées
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
    .from("orders")
    .select("*")
    .order("paid_at", { ascending: false })
    .limit(200);
  // Si la table n'existe pas encore, on retourne [] au lieu d'une 500
  if (error && !/relation .* does not exist/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ orders: data ?? [] });
}
