/**
 * GET /api/cron/poll-published-sites
 *
 * Vérifie la finalisation SSL des sites publiés mais encore en attente
 * (publish_pending = true). Pour chaque site dont le domaine est désormais
 * vérifié par Vercel : envoie le mail "site en ligne" et marque comme live.
 *
 * Auth : Bearer CRON_SECRET OU x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";
import { pollPendingSites } from "@/lib/site-publisher";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") || "";
  const cronOk = auth.startsWith("Bearer ") && safeCompare(auth.slice(7), process.env.CRON_SECRET || "");
  const adminOk = safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY);
  return cronOk || adminOk;
}

async function handler(req: NextRequest) {
  if (!isAuthorized(req)) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  const res = await pollPendingSites();
  return NextResponse.json({ success: true, ...res });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
