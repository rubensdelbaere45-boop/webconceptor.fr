// POST /api/admin/send-batch — déclenche envoi batch via /api/prospect/send
import { NextRequest, NextResponse } from "next/server";
import { requireAdminGuard } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Auth + rate-limit (était GROS TROU : aucune auth → attaquant pouvait
  // déclencher 150 emails par appel et ruiner réputation/quota Brevo)
  const guard = requireAdminGuard(req, { limit: 3, windowSec: 60, routeKey: "send-batch" });
  if (guard) return guard;

  const { batchSize = 50 } = await req.json().catch(() => ({} as { batchSize?: number }));
  const origin = process.env.NEXT_PUBLIC_BASE_URL || "https://webconceptor.fr";
  const adminKey = process.env.ADMIN_SECRET_KEY || "";

  const res = await fetch(`${origin}/api/prospect/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
    body: JSON.stringify({ batch_size: Math.min(150, Math.max(1, Number(batchSize) || 50)) }),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json({ ok: res.ok, ...data });
}
