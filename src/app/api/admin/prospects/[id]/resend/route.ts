// POST /api/admin/prospects/[id]/resend — relance email à 1 prospect
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const origin = process.env.NEXT_PUBLIC_BASE_URL || "https://webconceptor.fr";
  const adminKey = process.env.ADMIN_SECRET_KEY || "";

  // Délègue à /api/prospect/send avec prospect_id ciblé
  const res = await fetch(`${origin}/api/prospect/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify({ prospect_id: id, force: true }),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: res.ok, ...data });
}
