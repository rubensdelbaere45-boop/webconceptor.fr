/**
 * GET /api/voice/reservations
 * → liste les réservations restaurant générées par l'IA voice
 *   pour le compte WebDirector connecté (ou tout en mode admin)
 *
 * Query params :
 *   ?limit=N          (défaut 30)
 *   ?status=...       (filtre: 'pending' | 'confirmed' | 'cancelled')
 *   ?upcoming=true    (uniquement les réservations futures)
 *   ?date=YYYY-MM-DD  (un jour précis)
 *
 * PATCH /api/voice/reservations?id=XXX
 * Body : { status: 'confirmed' | 'cancelled' }
 * → marque manuellement une réservation comme traitée
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

async function getAccountId(req: NextRequest): Promise<{ accountId: string | null; isAdmin: boolean } | { error: string; status: number }> {
  const adminKey = req.headers.get("x-admin-key") || "";
  if (safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return { accountId: null, isAdmin: true };
  }
  const user = await getSessionUser();
  if (!user) return { error: "Non authentifié", status: 401 };
  const supa = getServiceClient();
  const { data: acc } = await supa
    .from("director_accounts")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!acc) return { error: "Compte introuvable", status: 404 };
  return { accountId: acc.id, isAdmin: false };
}

export async function GET(req: NextRequest) {
  const auth = await getAccountId(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { accountId, isAdmin } = auth;

  const sp = req.nextUrl.searchParams;
  const limit = Math.min(100, Math.max(1, parseInt(sp.get("limit") || "30", 10)));
  const status = sp.get("status");
  const upcoming = sp.get("upcoming") === "true";
  const date = sp.get("date");

  const supabase = db();
  let q = supabase
    .from("ai_reservations")
    .select("id, call_id, customer_name, customer_phone, customer_email, reservation_date, reservation_time, guests, special_request, status, notified_at, created_at")
    .order("reservation_date", { ascending: true })
    .order("reservation_time", { ascending: true })
    .limit(limit);

  if (!isAdmin) q = q.eq("business_account_id", accountId);
  if (status) q = q.eq("status", status);
  if (upcoming) q = q.gte("reservation_date", new Date().toISOString().slice(0, 10));
  if (date) q = q.eq("reservation_date", date);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Stats
  const total = data?.length || 0;
  const pending = data?.filter(r => r.status === "pending").length || 0;
  const confirmed = data?.filter(r => r.status === "confirmed").length || 0;
  const totalGuests = (data || []).reduce((s, r) => s + (r.guests || 0), 0);

  return NextResponse.json({
    reservations: data || [],
    count: total,
    stats: { pending, confirmed, total_guests: totalGuests },
  });
}

export async function PATCH(req: NextRequest) {
  const auth = await getAccountId(req);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: auth.status });
  const { accountId, isAdmin } = auth;

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  let body: any = {};
  try { body = await req.json(); } catch { /* opt */ }
  const newStatus = String(body.status || "").trim();
  if (!["confirmed", "cancelled", "pending"].includes(newStatus)) {
    return NextResponse.json({ error: "status doit être confirmed/cancelled/pending" }, { status: 400 });
  }

  const supabase = db();
  let q = supabase.from("ai_reservations").update({
    status: newStatus,
    notified_at: new Date().toISOString(),
  }).eq("id", id);
  if (!isAdmin) q = q.eq("business_account_id", accountId);

  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, id, status: newStatus });
}
