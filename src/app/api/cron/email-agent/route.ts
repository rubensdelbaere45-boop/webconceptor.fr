/**
 * GET|POST /api/cron/email-agent
 *
 * Cron qui lit les mails entrants sur contact@klyora.fr (IMAP IONOS),
 * classifie l'intention via LLM, et exécute auto-réponses ou escalades.
 *
 * Tourne 4×/jour (9h, 12h, 15h, 18h Paris) via vercel.json crons.
 *
 * Auth : Bearer CRON_SECRET OU x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";
import { runEmailAgent } from "@/lib/email-agent";

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
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const limit = parseInt(req.nextUrl.searchParams.get("limit") || "30", 10);
  try {
    const result = await runEmailAgent({ limit });
    return NextResponse.json({ success: true, ...result });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
