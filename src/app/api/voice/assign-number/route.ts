/**
 * POST /api/voice/assign-number
 * → Assigne un numéro Vapi à un compte Klyora Director.
 *   Le client reçoit ce numéro Vapi pour son standard IA (resto/coiffeur/etc.)
 *
 * Body : {
 *   account_id: string (Klyora Director account)
 *   vapi_number: "+33XXXXXXXXX" (numéro acheté sur Vapi)
 *   business_type: "restaurant_reservation" | "coiffeur_rdv" | "webconceptor_demarchage"
 * }
 *
 * Auth : x-admin-key uniquement (action sensible)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

export const dynamic = "force-dynamic";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const VALID_TYPES = new Set([
  "restaurant_reservation",
  "coiffeur_rdv",
  "webconceptor_demarchage",
  "plombier_urgence",
]);

export async function POST(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* opt */ }

  const accountId = String(body.account_id || "").trim();
  const vapiNumber = String(body.vapi_number || "").trim();
  const businessType = String(body.business_type || "").trim();

  if (!accountId) return NextResponse.json({ error: "account_id requis" }, { status: 400 });
  if (!/^\+\d{8,15}$/.test(vapiNumber)) {
    return NextResponse.json({ error: "vapi_number format E.164 requis (+33...)" }, { status: 400 });
  }
  if (!VALID_TYPES.has(businessType)) {
    return NextResponse.json({ error: "business_type invalide", valid: [...VALID_TYPES] }, { status: 400 });
  }

  const supabase = db();

  // Vérifie que le compte existe
  const { data: acc } = await supabase
    .from("director_accounts")
    .select("id, email, business_name")
    .eq("id", accountId)
    .maybeSingle();
  if (!acc) return NextResponse.json({ error: "Compte Klyora Director introuvable" }, { status: 404 });

  // Vérifie que le numéro n'est pas déjà utilisé par un autre compte
  const { data: existing } = await supabase
    .from("director_accounts")
    .select("id, business_name")
    .eq("vapi_inbound_number", vapiNumber)
    .neq("id", accountId)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({
      error: "Ce numéro est déjà assigné à un autre compte",
      conflicting_account: existing.business_name,
    }, { status: 409 });
  }

  // Vérifie que le script existe pour ce business_type
  const { data: script } = await supabase
    .from("ai_call_scripts")
    .select("id, agent_name, greeting")
    .eq("business_type", businessType)
    .eq("is_active", true)
    .maybeSingle();
  if (!script) {
    return NextResponse.json({
      error: `Aucun script actif pour ${businessType}`,
      hint: "Vérifie sql/2026_06_08_ai_voice.sql (seed des scripts par défaut)",
    }, { status: 404 });
  }

  // Assigne
  await supabase.from("director_accounts").update({
    vapi_inbound_number: vapiNumber,
    business_type: businessType,
    updated_at: new Date().toISOString(),
  }).eq("id", accountId);

  // Telegram
  const tg = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat) {
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: `📞 <b>Voice Agent assigné</b>\n\n` +
              `<b>Client :</b> ${acc.business_name || acc.email}\n` +
              `<b>Numéro :</b> <code>${vapiNumber}</code>\n` +
              `<b>Type :</b> ${businessType}\n` +
              `<b>Agent :</b> ${script.agent_name}`,
        parse_mode: "HTML",
      }),
    }).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    account_id: accountId,
    vapi_number: vapiNumber,
    business_type: businessType,
    agent: {
      name: script.agent_name,
      greeting: script.greeting.slice(0, 100) + "…",
    },
    next_step: `Configure le numéro Vapi → serverUrl = https://klyora.fr/api/voice/inbound-call`,
  });
}
