// GET /api/admin/orders/[id]/logs — logs de déploiement
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = db();
  const { data, error } = await supabase
    .from("deploy_logs")
    .select("timestamp, level, message")
    .eq("order_id", id)
    .order("timestamp", { ascending: true });
  if (error && !/relation .* does not exist/i.test(error.message)) {
    return NextResponse.json({ logs: [], error: error.message });
  }
  return NextResponse.json({ logs: data ?? [] });
}
