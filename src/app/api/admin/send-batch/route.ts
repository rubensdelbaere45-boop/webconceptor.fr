// POST /api/admin/send-batch — déclenche envoi batch via /api/prospect/send
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
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
