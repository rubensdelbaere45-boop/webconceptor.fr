// GET/PATCH /api/admin/settings — config admin
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

// Clés non exposables (sensibles)
const SENSITIVE = new Set(["telegram_bot_token", "stripe_secret_key", "brevo_api_key"]);

export async function GET() {
  const supabase = db();
  const { data, error } = await supabase.from("settings").select("key, value");
  if (error && !/relation .* does not exist/i.test(error.message)) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // Masque les sensibles
  const safe = (data ?? []).map((s: { key: string; value: string }) => ({
    key: s.key,
    value: SENSITIVE.has(s.key) ? "•".repeat(8) : s.value,
  }));
  return NextResponse.json({ settings: safe });
}

export async function PATCH(req: NextRequest) {
  const { key, value } = await req.json().catch(() => ({} as { key?: string; value?: string }));
  if (!key) return NextResponse.json({ error: "key requis" }, { status: 400 });
  const supabase = db();
  const { error } = await supabase
    .from("settings")
    .upsert({ key: String(key), value: String(value ?? ""), updated_at: new Date().toISOString() });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
