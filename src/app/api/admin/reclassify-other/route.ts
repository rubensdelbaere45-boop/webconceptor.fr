/**
 * POST /api/admin/reclassify-other
 *
 * Re-classifie les mails de prospect_email_messages dont intent='OTHER'
 * (souvent à cause de JSON parse fail dans l'ancien parser) avec la nouvelle
 * pré-classification rule-based + LLM fallback.
 *
 * Si la nouvelle classification est différente :
 *   - UPDATE la ligne en DB
 *   - Exécute l'action manquée (désabonner, reply, etc.) en se basant sur
 *     les colonnes from_email + prospect_id
 *
 * ⚠️ Notes :
 *   - On NE renvoie PAS de mail si > 24h depuis la réception (risque de
 *     dérouter le prospect avec un mail tardif sur un sujet ancien).
 *   - On désabonne quand même les UNSUBSCRIBE même si > 24h (sécu RGPD).
 *
 * Auth : x-admin-key
 * Query : ?limit=50, ?dry_run=1
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { classifyEmail } from "@/lib/email-agent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

async function handler(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dry_run") === "1";
  const limit = Math.min(200, Math.max(1, parseInt(req.nextUrl.searchParams.get("limit") || "100", 10)));

  const supabase = db();
  const { data: msgs, error } = await supabase
    .from("prospect_email_messages")
    .select("id, prospect_id, from_email, from_name, subject, body_text, intent, received_at")
    .eq("intent", "OTHER")
    .order("received_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let reclassified = 0;
  let unsubscribed = 0;
  const samples: Array<{ from: string; subject: string; was: string; now: string; reasoning: string }> = [];

  for (const m of msgs || []) {
    const fake = {
      uid: 0,
      from: m.from_email || "",
      fromName: m.from_name || "",
      subject: m.subject || "",
      text: m.body_text || "",
      html: "",
      date: new Date(m.received_at),
    };
    const result = await classifyEmail(fake);

    if (result.intent !== "OTHER") {
      reclassified++;
      if (samples.length < 20) {
        samples.push({
          from: m.from_email,
          subject: m.subject || "",
          was: "OTHER",
          now: result.intent,
          reasoning: result.reasoning,
        });
      }

      if (!dryRun) {
        // Update intent + reasoning
        await supabase
          .from("prospect_email_messages")
          .update({ intent: result.intent, reasoning: result.reasoning })
          .eq("id", m.id);

        // Action UNSUBSCRIBE → désabonner même si > 24h (RGPD)
        if (result.intent === "UNSUBSCRIBE" && m.prospect_id) {
          await supabase
            .from("prospects")
            .update({
              unsubscribed_at: new Date().toISOString(),
              unsubscribe_reason: "auto_reply: reclassified by agent",
              status: "unsubscribed",
            })
            .eq("id", m.prospect_id)
            .is("unsubscribed_at", null);
          unsubscribed++;
        }
      }
    }
  }

  return NextResponse.json({
    dry_run: dryRun,
    scanned: msgs?.length || 0,
    reclassified,
    unsubscribed,
    samples,
  });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
