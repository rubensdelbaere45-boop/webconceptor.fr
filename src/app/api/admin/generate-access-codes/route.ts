/**
 * POST /api/admin/generate-access-codes
 * GET  /api/admin/generate-access-codes?dry_run=1
 *
 * Génère un code d'accès unique pour chaque prospect qui n'en a pas encore.
 * Idempotent (n'écrase pas les codes existants).
 *
 * Auth : x-admin-key
 * Query : ?offset=0, ?limit=1000
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { generateAccessCode } from "@/lib/access-code";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

async function handler(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dry_run") === "1";
  const offset = Math.max(0, parseInt(req.nextUrl.searchParams.get("offset") || "0", 10));
  const limit = Math.min(1000, parseInt(req.nextUrl.searchParams.get("limit") || "1000", 10));
  const supabase = db();

  const { data, error } = await supabase
    .from("prospects")
    .select("id, slug")
    .is("access_code", null)
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const prospects = data || [];
  let generated = 0;
  const nowIso = new Date().toISOString();

  for (const p of prospects) {
    const code = generateAccessCode();
    if (!dryRun) {
      const { error: upErr } = await supabase
        .from("prospects")
        .update({ access_code: code, access_code_generated_at: nowIso })
        .eq("id", p.id);
      if (!upErr) generated++;
    } else {
      generated++;
    }
  }

  return NextResponse.json({
    dry_run: dryRun,
    offset,
    limit,
    scanned: prospects.length,
    codes_generated: generated,
  });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
