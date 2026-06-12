// POST /api/admin/prospects/[id]/resend — relance email à 1 prospect
import { NextRequest, NextResponse } from "next/server";
import { requireAdminGuard } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Auth + rate-limit (était GROS TROU : aucune auth, attaquant pouvait harceler
  // n'importe quel prospect en hitant POST /api/admin/prospects/[id]/resend)
  const guard = requireAdminGuard(req, { limit: 20, windowSec: 60, routeKey: "resend" });
  if (guard) return guard;

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const origin = process.env.NEXT_PUBLIC_BASE_URL || "https://klyora.fr";
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
