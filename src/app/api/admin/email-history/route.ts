/**
 * GET /api/admin/email-history
 *
 * Historique des mails traités par l'agent : derniers N messages avec
 * leur classification + action. Utile pour vérifier qu'aucun mail
 * important n'a été mal classé.
 *
 * Query :
 *   ?limit=50          → nb de messages (max 200)
 *   ?intent=OTHER       → filtre par intent
 *   ?search=webconceptor → recherche full-text dans from/subject/body
 *   ?hours=24           → derniers N heures
 *
 * Auth : x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function GET(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const limit = Math.min(200, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "50", 10)));
  const intent = req.nextUrl.searchParams.get("intent");
  const search = req.nextUrl.searchParams.get("search");
  const hours = parseInt(req.nextUrl.searchParams.get("hours") || "0", 10);

  const supabase = db();
  let q = supabase
    .from("prospect_email_messages")
    .select("id, prospect_id, from_email, from_name, subject, body_text, intent, reasoning, received_at, created_at")
    .order("received_at", { ascending: false })
    .limit(limit);

  if (intent) q = q.eq("intent", intent);
  if (hours > 0) {
    const since = new Date(Date.now() - hours * 3600 * 1000).toISOString();
    q = q.gte("received_at", since);
  }
  if (search) {
    const pattern = `%${search}%`;
    q = q.or(`from_email.ilike.${pattern},subject.ilike.${pattern},body_text.ilike.${pattern}`);
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Stats agrégées par intent (sur l'ensemble retourné)
  const byIntent: Record<string, number> = {};
  for (const m of data || []) {
    const k = m.intent || "UNKNOWN";
    byIntent[k] = (byIntent[k] || 0) + 1;
  }

  return NextResponse.json({
    count: data?.length || 0,
    by_intent: byIntent,
    messages: (data || []).map((m) => ({
      received_at: m.received_at,
      from: m.from_email,
      from_name: m.from_name,
      subject: m.subject,
      intent: m.intent,
      reasoning: m.reasoning,
      body_preview: (m.body_text || "").slice(0, 400),
      prospect_id: m.prospect_id,
    })),
  });
}
