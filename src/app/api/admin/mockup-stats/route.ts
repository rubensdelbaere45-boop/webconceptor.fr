/**
 * GET /api/admin/mockup-stats — stats du load balancer Stitch ↔ OpenDesign.
 * Compteur en mémoire (par instance Vercel). Pour stats persistantes,
 * croiser avec Supabase prospects.mockup_source.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminGuard } from "@/lib/security";
import { getMockupStats } from "@/lib/mockup-orchestrator";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 60, windowSec: 60, routeKey: "mockup-stats" });
  if (guard) return guard;
  return NextResponse.json({
    ok: true,
    stats: getMockupStats(),
    note: "Compteur en mémoire — reset à chaque cold start Vercel. Pour persistance, voir colonne prospects.mockup_source.",
  });
}
