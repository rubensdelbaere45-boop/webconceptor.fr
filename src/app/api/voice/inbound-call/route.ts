/**
 * POST /api/voice/inbound-call
 *
 * Appelé par Vapi.ai au moment où un client compose le numéro
 * (mode "assistant request"). Renvoie la config assistant à utiliser,
 * sélectionnée en fonction du numéro composé (= du business).
 *
 * Vapi POST :
 *   { call: { phoneNumber: { number: "+33..." }, customer: { number: "+33..." } } }
 * Réponse attendue : { assistant: {...} }
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { body = {}; }

  const calledNumber: string = body?.call?.phoneNumber?.number || body?.phoneNumber?.number || "";
  const customerNumber: string = body?.call?.customer?.number || body?.customer?.number || "";

  const supabase = db();

  // Cherche le business associé à ce numéro Vapi reçu
  // Convention : director_accounts a un champ vapi_inbound_number (à ajouter ultérieurement)
  // Fallback : si pas trouvé, on prend le script restaurant_reservation par défaut
  let businessType = "restaurant_reservation";
  let businessAccountId: string | null = null;

  if (calledNumber) {
    const { data: account } = await supabase
      .from("director_accounts")
      .select("id, business_type, vapi_inbound_number")
      .eq("vapi_inbound_number", calledNumber)
      .maybeSingle();
    if (account) {
      businessAccountId = account.id;
      businessType = account.business_type || "restaurant_reservation";
    }
  }

  const { data: script } = await supabase
    .from("ai_call_scripts")
    .select("*")
    .eq("business_type", businessType)
    .eq("is_active", true)
    .maybeSingle();

  if (!script) {
    return NextResponse.json({
      assistant: {
        firstMessage: "Bonjour, je vous écoute.",
        model: { provider: "openai", model: "gpt-4o-mini", messages: [{ role: "system", content: "Tu es un standardiste poli." }] },
        voice: { provider: "openai", voiceId: "nova" },
      },
    });
  }

  return NextResponse.json({
    assistant: {
      name: script.agent_name,
      firstMessage: script.greeting,
      model: {
        provider: "openai",
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: script.system_prompt }],
      },
      voice: { provider: script.voice_provider || "openai", voiceId: script.voice_id || "nova" },
      maxDurationSeconds: script.max_duration_sec || 240,
      serverUrl: `https://webconceptor.fr/api/voice/vapi-webhook`,
      analysisPlan: {
        structuredDataSchema: {
          type: "object",
          properties: Object.fromEntries((script.collect_fields || []).map((f: string) => [f, { type: "string" }])),
        },
        summaryPrompt: "Résume cet appel en 2 phrases.",
      },
      metadata: {
        business_type: businessType,
        business_account_id: businessAccountId,
        script_id: script.id,
        from_number: customerNumber,
        to_number: calledNumber,
      },
    },
  });
}

export async function GET() { return NextResponse.json({ ok: true, route: "inbound-call" }); }
