/**
 * POST /api/director/launch-action
 * Body : { target, tokens_cost }
 * → débite les crédits, log l'action, trigger webhook N8N.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, getSessionUser } from "@/lib/director/auth";

export const dynamic = "force-dynamic";

const N8N_WEBHOOK_BASE = process.env.N8N_WEBHOOK_BASE || "https://n8n-production-3b6a.up.railway.app/webhook";

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { target?: string; tokens_cost?: number } = {};
  try { body = await req.json(); } catch { /* opt */ }
  const target = (body.target || "").slice(0, 50);
  const cost = Math.max(1, Math.min(1000, Math.floor(body.tokens_cost || 0)));
  if (!target || !cost) return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });

  const supabase = getServiceClient();
  const { data: acc } = await supabase
    .from("director_accounts")
    .select("id, tokens_balance, business_name, email, city")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!acc) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  if (acc.tokens_balance < cost) {
    return NextResponse.json({ error: "Crédits insuffisants", need_credits: true, missing: cost - acc.tokens_balance }, { status: 402 });
  }

  const newBalance = acc.tokens_balance - cost;

  // Récupère total_tokens_spent actuel pour l'incrémenter
  const { data: full } = await supabase
    .from("director_accounts")
    .select("total_tokens_spent")
    .eq("id", acc.id)
    .maybeSingle();
  const newTotalSpent = (full?.total_tokens_spent || 0) + cost;

  await supabase.from("director_accounts").update({
    tokens_balance: newBalance,
    total_tokens_spent: newTotalSpent,
    updated_at: new Date().toISOString(),
  }).eq("id", acc.id);

  const { data: actRow } = await supabase.from("director_actions").insert({
    account_id: acc.id,
    action_type: "launch_" + target,
    tokens_delta: -cost,
    tokens_balance_after: newBalance,
    details: { target, business_name: acc.business_name, city: acc.city },
  }).select("id").maybeSingle();

  // Crée campagne
  await supabase.from("director_campaigns").insert({
    account_id: acc.id,
    campaign_type: target,
    status: "pending",
    tokens_cost: cost,
    config: { business_name: acc.business_name, city: acc.city, email: acc.email },
  });

  // Notifie Telegram
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat) {
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: `🚀 <b>WebDirector — Action lancée</b>\n\n<b>${acc.business_name || acc.email}</b>\n${target} — ${cost} crédits\nSolde restant : ${newBalance}`,
        parse_mode: "HTML",
      }),
    }).catch(() => {});
  }

  // Trigger N8N webhook (si configuré, sinon no-op)
  try {
    await fetch(`${N8N_WEBHOOK_BASE}/director-action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action_id: actRow?.id,
        account_id: acc.id,
        email: acc.email,
        business_name: acc.business_name,
        city: acc.city,
        target,
        tokens_cost: cost,
      }),
      signal: AbortSignal.timeout(5000),
    });
  } catch { /* webhook optionnel */ }

  return NextResponse.json({ success: true, new_balance: newBalance });
}
