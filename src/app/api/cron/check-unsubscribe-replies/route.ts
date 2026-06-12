/**
 * GET /api/cron/check-unsubscribe-replies
 *
 * 🚧 TEMPORAIREMENT DÉSACTIVÉ (Vercel build incompatible avec imapflow)
 *
 * Logic IONOS IMAP + désabonnement auto à ré-câbler avec une autre lib
 * (node-imap ou via webhook entrant CloudMailin/Mailgun).
 *
 * Auth : Authorization: Bearer $CRON_SECRET OU x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") || "";
  const cronOk = auth.startsWith("Bearer ") && safeCompare(auth.slice(7), process.env.CRON_SECRET || "");
  const adminOk = safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY || "");
  return cronOk || adminOk;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  return NextResponse.json({
    success: true,
    status: "disabled",
    message: "IMAP IONOS temporairement désactivé (imapflow incompatible Vercel build). À ré-câbler avec node-imap ou webhook entrant.",
    scanned: 0,
    unsubscribed: 0,
  });
}

export const POST = GET;
