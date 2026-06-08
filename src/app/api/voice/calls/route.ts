/**
 * GET /api/voice/calls
 * → liste les appels IA de l'utilisateur connecté (WebDirector)
 *   ou tous les appels en mode admin (x-admin-key)
 *
 * Query params :
 *   ?limit=N         (défaut 30, max 100)
 *   ?outcome=...     (filtre: 'reservation' | 'rdv_pris' | 'callback' | 'no_interest')
 *   ?business_type=... (filtre: 'restaurant_reservation' | 'coiffeur_rdv' | etc.)
 *   ?id=XXX          (détail d'un appel : transcript complet + extracted_data)
 *
 * GET /api/voice/calls/stats
 * → métriques agrégées (taux conversion, durée moyenne, coût total, etc.)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { getSessionUser, getServiceClient } from "@/lib/director/auth";

export const dynamic = "force-dynamic";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function GET(req: NextRequest) {
  // Auth : admin (x-admin-key) OU user WebDirector connecté
  const adminKey = req.headers.get("x-admin-key") || "";
  const isAdmin = safeCompare(adminKey, process.env.ADMIN_SECRET_KEY);

  let accountId: string | null = null;
  if (!isAdmin) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    const supa = getServiceClient();
    const { data: acc } = await supa
      .from("director_accounts")
      .select("id")
      .eq("auth_user_id", user.id)
      .maybeSingle();
    if (!acc) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });
    accountId = acc.id;
  }

  const sp = req.nextUrl.searchParams;
  const callId = sp.get("id");
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "30", 10)));
  const outcome = sp.get("outcome");
  const businessType = sp.get("business_type");

  const supabase = db();

  // Détail d'un appel
  if (callId) {
    let q = supabase
      .from("ai_calls")
      .select("*")
      .eq("id", callId);
    if (!isAdmin) q = q.eq("business_account_id", accountId);
    const { data: call, error } = await q.maybeSingle();
    if (error || !call) return NextResponse.json({ error: "Appel introuvable" }, { status: 404 });
    return NextResponse.json({ call });
  }

  // Liste
  let q = supabase
    .from("ai_calls")
    .select("id, direction, provider, from_number, to_number, caller_name, business_type, status, started_at, ended_at, duration_seconds, outcome, summary, sentiment, cost_eur, extracted_data")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (!isAdmin) q = q.eq("business_account_id", accountId);
  if (outcome) q = q.eq("outcome", outcome);
  if (businessType) q = q.eq("business_type", businessType);

  const { data: calls, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Stats rapides
  const total = calls?.length || 0;
  const completed = calls?.filter(c => c.status === "completed").length || 0;
  const conversions = calls?.filter(c => ["reservation", "rdv_pris", "sale_closed"].includes(c.outcome || "")).length || 0;
  const totalCost = (calls || []).reduce((s, c) => s + (Number(c.cost_eur) || 0), 0);
  const avgDuration = total > 0
    ? Math.round((calls || []).reduce((s, c) => s + (c.duration_seconds || 0), 0) / total)
    : 0;

  return NextResponse.json({
    calls,
    count: total,
    stats: {
      completed,
      conversions,
      conversion_rate: total > 0 ? Math.round((conversions / total) * 100) : 0,
      total_cost_eur: parseFloat(totalCost.toFixed(2)),
      avg_duration_seconds: avgDuration,
    },
  });
}
