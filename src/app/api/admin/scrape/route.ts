// POST /api/admin/scrape — déclenche scrape via cron existant
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { query } = await req.json().catch(() => ({} as { query?: string }));
  const origin = process.env.NEXT_PUBLIC_BASE_URL || "https://klyora.fr";
  const cronSecret = process.env.CRON_SECRET || "";

  // Délègue au cron existant
  const url = new URL(`${origin}/api/prospect/cron`);
  if (query) url.searchParams.set("query", String(query).slice(0, 200));
  const res = await fetch(url.toString(), {
    method: "GET",
    headers: { "x-cron-secret": cronSecret },
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: res.ok, ...data });
}
