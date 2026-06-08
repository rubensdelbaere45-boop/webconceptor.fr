/**
 * POST /api/voice/vapi-webhook
 *
 * Webhook unifié appelé par Vapi.ai à chaque événement d'un appel IA.
 * Types d'events : call.started | transcript | function-call | call.ended.
 *
 * - call.started      → crée / met à jour ai_calls.status = 'in_progress'
 * - transcript        → append au transcript
 * - call.ended        → status='completed', extrait outcome + données + sentiment
 *                       → si business_type='restaurant_reservation' → INSERT ai_reservations
 *                       → notif Telegram au business
 *
 * Sécurité : VAPI_WEBHOOK_SECRET via header `x-vapi-signature` (HMAC SHA256).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.VAPI_WEBHOOK_SECRET;
  if (!secret) return true; // dev mode : pas de secret = on accepte
  if (!signature) return false;
  try {
    const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(signature, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch { return false; }
}

async function notifyTelegram(text: string) {
  const tg = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (!tg || !chat) return;
  fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!verifySignature(raw, req.headers.get("x-vapi-signature"))) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let body: any;
  try { body = JSON.parse(raw); }
  catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const supabase = db();
  const evt = body?.message?.type || body?.type;
  const call = body?.message?.call || body?.call || {};
  const providerCallId: string = call.id || body?.callId || "";
  if (!providerCallId) return NextResponse.json({ ok: true, ignored: "no callId" });

  // Récupère ou crée l'enregistrement ai_calls
  let { data: row } = await supabase
    .from("ai_calls")
    .select("*")
    .eq("provider_call_id", providerCallId)
    .maybeSingle();

  if (!row) {
    const ins = await supabase
      .from("ai_calls")
      .insert({
        provider: "vapi",
        provider_call_id: providerCallId,
        direction: call?.type === "inboundPhoneCall" ? "inbound" : "outbound",
        from_number: call?.customer?.number || call?.phoneNumber?.number || null,
        to_number: call?.assistantOverrides?.metadata?.to_number || null,
        business_type: call?.assistantOverrides?.metadata?.business_type || null,
        business_account_id: call?.assistantOverrides?.metadata?.business_account_id || null,
        prospect_id: call?.assistantOverrides?.metadata?.prospect_id || null,
        script_id: call?.assistantOverrides?.metadata?.script_id || null,
        status: "in_progress",
      })
      .select("*")
      .single();
    row = ins.data;
  }

  switch (evt) {
    case "status-update": {
      const status = body?.message?.status;
      if (status) await supabase.from("ai_calls").update({ status, updated_at: new Date().toISOString() }).eq("id", row.id);
      break;
    }
    case "transcript": {
      const t = body?.message?.transcript || "";
      await supabase.from("ai_calls").update({
        transcript: (row.transcript || "") + "\n" + t,
        updated_at: new Date().toISOString(),
      }).eq("id", row.id);
      break;
    }
    case "end-of-call-report":
    case "call-ended": {
      const transcript = body?.message?.transcript || body?.message?.artifact?.transcript || row.transcript || "";
      const summary = body?.message?.summary || body?.message?.analysis?.summary || "";
      const extracted = body?.message?.analysis?.structuredData || {};
      const cost = body?.message?.cost || null;
      const durationSec = body?.message?.durationSeconds || null;
      const endedReason = body?.message?.endedReason || "completed";

      // Déterminer outcome
      let outcome: string | null = null;
      const sLower = (summary + " " + transcript).toLowerCase();
      if (sLower.includes("réservation") || sLower.includes("table") || extracted?.reservation_date) outcome = "reservation";
      else if (sLower.includes("rendez-vous") || sLower.includes("rdv") || extracted?.service_type) outcome = "rdv_pris";
      else if (sLower.includes("rappel") || extracted?.callback_time) outcome = "callback";
      else if (sLower.includes("pas intéressé") || sLower.includes("non merci")) outcome = "no_interest";
      else outcome = "completed";

      await supabase.from("ai_calls").update({
        status: endedReason === "completed" ? "completed" : "failed",
        ended_at: new Date().toISOString(),
        duration_seconds: durationSec,
        transcript, summary,
        extracted_data: extracted,
        outcome,
        cost_eur: cost,
        updated_at: new Date().toISOString(),
      }).eq("id", row.id);

      // Si réservation restaurant → insert ai_reservations
      if (row.business_type === "restaurant_reservation" && extracted?.reservation_date) {
        await supabase.from("ai_reservations").insert({
          call_id: row.id,
          business_account_id: row.business_account_id,
          customer_name: extracted.customer_name || "Inconnu",
          customer_phone: extracted.customer_phone || row.from_number || "?",
          customer_email: extracted.customer_email || null,
          reservation_date: extracted.reservation_date,
          reservation_time: extracted.reservation_time || "20:00",
          guests: Number(extracted.guests) || 2,
          special_request: extracted.special_request || null,
        });
        notifyTelegram(
          `🍽️ <b>Nouvelle réservation IA</b>\n\n` +
          `👤 ${extracted.customer_name || "?"} (${extracted.customer_phone || row.from_number})\n` +
          `📅 ${extracted.reservation_date} à ${extracted.reservation_time || "?"}\n` +
          `👥 ${extracted.guests || "?"} personnes\n` +
          (extracted.special_request ? `💬 ${extracted.special_request}\n` : "") +
          `\nCall ID: <code>${providerCallId.slice(0, 12)}</code>`
        );
      } else if (row.business_type === "coiffeur_rdv" && extracted?.service_type) {
        notifyTelegram(
          `✂️ <b>Nouveau RDV coiffeur (IA)</b>\n\n` +
          `👤 ${extracted.customer_name || "?"} (${extracted.customer_phone || row.from_number})\n` +
          `💇 ${extracted.service_type}\n` +
          `📅 ${extracted.reservation_date || "?"} (${extracted.time_preference || "?"})\n`
        );
      } else if (row.business_type === "webconceptor_demarchage" && outcome === "callback") {
        notifyTelegram(
          `📞 <b>Lead à rappeler (Camille IA)</b>\n\n` +
          `👤 ${extracted.caller_name || "?"} — ${extracted.callback_phone || row.to_number}\n` +
          `⏰ Préférence : ${extracted.callback_time || "?"}\n` +
          `\nTranscript : ${transcript.slice(0, 300)}…`
        );
      }
      break;
    }
    default:
      // Event inconnu : on logue silencieusement
      break;
  }

  return NextResponse.json({ ok: true });
}

export async function GET() { return NextResponse.json({ ok: true, route: "vapi-webhook" }); }
