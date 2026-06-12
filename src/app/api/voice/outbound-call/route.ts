/**
 * POST /api/voice/outbound-call
 *
 * Déclenche un appel IA sortant via Vapi.ai.
 * Body : { to_number, business_type, prospect_id?, business_account_id? }
 *
 * - Trouve le script (ai_call_scripts.business_type=...)
 * - POST Vapi /call/phone avec assistant + customer.number + metadata
 * - Stocke l'enregistrement ai_calls.status='queued'
 *
 * Auth : x-admin-key OU x-cron-secret
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY) && !safeCompare(cronSecret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const vapiKey = process.env.VAPI_API_KEY;
  const vapiPhoneId = process.env.VAPI_PHONE_NUMBER_ID;
  if (!vapiKey || !vapiPhoneId) {
    return NextResponse.json({ error: "VAPI_API_KEY ou VAPI_PHONE_NUMBER_ID manquant" }, { status: 500 });
  }

  let body: any;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "bad json" }, { status: 400 }); }

  const { to_number, business_type = "webconceptor_demarchage", prospect_id = null, business_account_id = null } = body || {};
  if (!to_number || !/^\+\d{8,15}$/.test(String(to_number))) {
    return NextResponse.json({ error: "to_number invalide (format E.164 requis : +33...)" }, { status: 400 });
  }

  const supabase = db();
  const { data: script } = await supabase
    .from("ai_call_scripts")
    .select("*")
    .eq("business_type", business_type)
    .eq("is_active", true)
    .maybeSingle();
  if (!script) return NextResponse.json({ error: `Aucun script actif pour ${business_type}` }, { status: 404 });

  // Construit la requête Vapi
  const vapiBody = {
    phoneNumberId: vapiPhoneId,
    customer: { number: to_number },
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
      serverUrl: `https://klyora.fr/api/voice/vapi-webhook`,
      analysisPlan: {
        structuredDataSchema: {
          type: "object",
          properties: Object.fromEntries((script.collect_fields || []).map((f: string) => [f, { type: "string" }])),
        },
        summaryPrompt: "Résume cet appel en 2 phrases. Indique l'outcome (réservation, RDV, callback, refus).",
      },
      metadata: {
        business_type,
        business_account_id,
        prospect_id,
        script_id: script.id,
        to_number,
      },
    },
  };

  const res = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: { Authorization: `Bearer ${vapiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(vapiBody),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) return NextResponse.json({ error: `Vapi HTTP ${res.status}`, details: data }, { status: 502 });

  // Enregistre dans ai_calls
  await supabase.from("ai_calls").insert({
    provider: "vapi",
    provider_call_id: data.id,
    direction: "outbound",
    to_number,
    business_type,
    business_account_id,
    prospect_id,
    script_id: script.id,
    status: "queued",
  });

  return NextResponse.json({ ok: true, call_id: data.id, status: data.status || "queued" });
}
