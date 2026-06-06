/**
 * POST /api/ebook/generate-daily
 *
 * Cron quotidien — génère 2 e-books (1 histoire + 1 actualité) en SÉQUENTIEL
 * (2 × ≤ 5 min = ≤ 10 min total, donc N8N orchestre 2 appels Vercel).
 *
 * Stratégie : ce endpoint fait juste 1 ebook avec angle "histoire" si
 * appelé avec ?slot=1, ou "actualite" si ?slot=2. N8N appelle 2 fois
 * consécutivement avec sleep entre.
 *
 * Pourquoi pas tout en 1 ? Vercel timeout = 5 min, 1 ebook = 4 min max.
 *
 * Auth : x-cron-secret OU x-admin-key
 */

import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const slot = url.searchParams.get("slot") || "1";
  const angle = slot === "2" ? "actualite" : "histoire";

  // Proxy interne vers generate-one avec preferred_angle
  const origin = url.origin;
  const headers = new Headers();
  const adminKey = req.headers.get("x-admin-key");
  const cronSecret = req.headers.get("x-cron-secret");
  if (adminKey) headers.set("x-admin-key", adminKey);
  if (cronSecret) headers.set("x-cron-secret", cronSecret);
  headers.set("Content-Type", "application/json");

  const res = await fetch(`${origin}/api/ebook/generate-one`, {
    method: "POST",
    headers,
    body: JSON.stringify({ preferred_angle: angle }),
  });
  const data = await res.json().catch(() => ({}));
  return NextResponse.json({ slot, angle, ...data }, { status: res.status });
}

export async function GET(req: NextRequest) { return POST(req); }
