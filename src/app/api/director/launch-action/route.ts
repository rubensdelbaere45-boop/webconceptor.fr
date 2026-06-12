/**
 * POST /api/director/launch-action
 * Body : { target, tokens_cost }
 *
 * Flux complet:
 *   1. Vérifie l'auth + le solde de crédits
 *   2. Débite les crédits + log director_actions + crée director_campaigns
 *   3. 🔥 EXÉCUTE l'agent IA via Hermes Bridge (Hermes Agent → Kimi K2 fallback)
 *   4. Stocke le livrable markdown dans la campagne
 *   5. Envoie email Brevo au client avec le rapport
 *   6. Notifie Telegram (admin)
 *
 * target valide : 'google_ads' | 'meta_ads' | 'reputation' | 'seo' | 'chatbot' | 'pack_local'
 * tokens_cost : 50 à 1000 selon l'agent (UI envoie le coût catalogue).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, getSessionUser } from "@/lib/director/auth";
import { executeAgent, type AgentId, type AgentContext } from "@/lib/director/hermes-bridge";
import { executeMarketplaceAgent } from "@/lib/director/marketplace-executor";
import { getAgentBySlug } from "@/lib/director/marketplace-loader";

export const dynamic = "force-dynamic";
export const maxDuration = 180; // 3 min — l'IA peut prendre 30-60s

const VALID_AGENTS: AgentId[] = ["google_ads", "meta_ads", "reputation", "seo", "chatbot", "pack_local"];

function isValidAgent(t: string): t is AgentId {
  return (VALID_AGENTS as string[]).includes(t);
}

// Mapping legacy : si l'UI envoie un label fr, on traduit
const LEGACY_MAP: Record<string, AgentId> = {
  "google ads": "google_ads", "googleads": "google_ads",
  "meta ads": "meta_ads", "metaads": "meta_ads", "facebook ads": "meta_ads",
  "avis google": "reputation", "réputation": "reputation", "reputation": "reputation",
  "seo local": "seo", "seo": "seo",
  "chatbot site": "chatbot", "chatbot": "chatbot",
  "pack local": "pack_local", "packlocal": "pack_local",
};

function normalizeTarget(raw: string): AgentId | null {
  const t = raw.trim().toLowerCase();
  if (isValidAgent(t)) return t;
  if (LEGACY_MAP[t]) return LEGACY_MAP[t];
  return null;
}

async function sendDeliverableEmail(email: string, businessName: string, agentName: string, reportMd: string): Promise<void> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey || !email) return;

  // Convertit Markdown basique en HTML
  const html = reportMd
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/^### (.*)$/gm, "<h3 style='color:#0A2540;margin-top:24px;font-size:18px'>$1</h3>")
    .replace(/^## (.*)$/gm, "<h2 style='color:#0A2540;margin-top:32px;font-size:22px;border-bottom:2px solid #FFD700;padding-bottom:8px'>$1</h2>")
    .replace(/^# (.*)$/gm, "<h1 style='color:#0A2540;font-size:28px'>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.*)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, "<ul style='line-height:1.7'>$&</ul>")
    .replace(/\n\n/g, "</p><p style='line-height:1.65;color:#374151'>")
    .replace(/^(.*)$/gm, (m) => (m.startsWith("<") ? m : `<p style='line-height:1.65;color:#374151'>${m}</p>`));

  const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:680px;margin:0 auto;padding:24px;background:#fff;color:#1F2937">
<div style="background:#0A2540;color:#fff;padding:24px;border-radius:12px;margin-bottom:24px">
<div style="font-size:13px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.7">Klyora Director — Rapport</div>
<div style="font-size:24px;font-weight:700;margin-top:4px">Mission terminée par ${agentName}</div>
</div>
${html}
<hr style="margin:32px 0;border:none;border-top:1px solid #E5E7EB">
<p style="font-size:13px;color:#6B7280">Connectez-vous à votre tableau de bord Klyora Director pour voir l'historique de toutes vos missions et lancer de nouvelles campagnes.</p>
<p style="text-align:center;margin:24px 0">
<a href="https://klyora.fr/director/dashboard" style="display:inline-block;background:#0A2540;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700">Mon Tableau de Bord →</a>
</p>
</body></html>`;

  try {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: `${agentName} (Klyora Director)`, email: "contact@klyora.fr" },
        replyTo: { name: "Tom — Klyora Director", email: "contact@klyora.fr" },
        to: [{ email, name: businessName }],
        subject: `${agentName} a terminé : votre rapport est prêt`,
        htmlContent: fullHtml,
      }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch { /* email opt */ }
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  let body: { target?: string; tokens_cost?: number } = {};
  try { body = await req.json(); } catch { /* opt */ }

  const rawTarget = (body.target || "").slice(0, 80);

  // 🆕 Détecte si c'est un agent marketplace (slug avec division-name-name)
  // Les agents marketplace ont des slugs du genre "marketing-content-creator"
  const marketplaceAgent = getAgentBySlug(rawTarget);
  let agentId: AgentId | null = null;
  let isMarketplace = false;

  if (marketplaceAgent) {
    isMarketplace = true;
  } else {
    agentId = normalizeTarget(rawTarget);
    if (!agentId) {
      return NextResponse.json({
        error: "Agent invalide (ni dans Hermes Bridge ni dans marketplace)",
        valid_agents: VALID_AGENTS,
        hint: "Pour un agent marketplace, utilise GET /api/director/marketplace pour les slugs",
      }, { status: 400 });
    }
  }

  // Coût : si marketplace → on prend le tarif de l'agent (et on vérifie que le client envoie le bon)
  const expectedCost = marketplaceAgent ? marketplaceAgent.tokens_cost : Math.floor(body.tokens_cost || 0);
  const cost = Math.max(1, Math.min(1000, expectedCost));
  if (!cost) return NextResponse.json({ error: "tokens_cost manquant" }, { status: 400 });

  const supabase = getServiceClient();
  const { data: acc } = await supabase
    .from("director_accounts")
    .select("id, tokens_balance, total_tokens_spent, business_name, business_type, email, city, phone, website, google_rating")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!acc) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  if ((acc.tokens_balance || 0) < cost) {
    return NextResponse.json({
      error: "Crédits insuffisants",
      need_credits: true,
      missing: cost - (acc.tokens_balance || 0),
    }, { status: 402 });
  }

  const newBalance = (acc.tokens_balance || 0) - cost;
  const newTotalSpent = (acc.total_tokens_spent || 0) + cost;

  // 1) Débit immédiat des crédits
  await supabase.from("director_accounts").update({
    tokens_balance: newBalance,
    total_tokens_spent: newTotalSpent,
    updated_at: new Date().toISOString(),
  }).eq("id", acc.id);

  const agentKey = isMarketplace ? marketplaceAgent!.slug : agentId!;

  // 2) Log action
  const { data: actRow } = await supabase.from("director_actions").insert({
    account_id: acc.id,
    action_type: `launch_${agentKey}`,
    tokens_delta: -cost,
    tokens_balance_after: newBalance,
    details: {
      agent_id: agentKey,
      source: isMarketplace ? "marketplace" : "hermes_bridge",
      business_name: acc.business_name,
      city: acc.city,
    },
  }).select("id").maybeSingle();

  // 3) Crée campagne en "running"
  const { data: campaign } = await supabase.from("director_campaigns").insert({
    account_id: acc.id,
    campaign_type: agentKey,
    status: "running",
    tokens_cost: cost,
    config: { business_name: acc.business_name, city: acc.city, email: acc.email, source: isMarketplace ? "marketplace" : "hermes_bridge" },
  }).select("id").single();

  // 4) 🔥 EXÉCUTION HERMES BRIDGE (sync — max 60s)
  const ctx: AgentContext = {
    business_name: acc.business_name || "Votre entreprise",
    city: acc.city || "votre ville",
    business_type: acc.business_type,
    email: acc.email,
    phone: acc.phone,
    website: acc.website,
    google_rating: acc.google_rating,
  };

  let result;
  try {
    result = isMarketplace
      ? await executeMarketplaceAgent(marketplaceAgent!.slug, ctx)
      : await executeAgent(agentId!, ctx);
  } catch (e) {
    // Échec dur → refund crédits + status failed
    await supabase.from("director_accounts").update({
      tokens_balance: (acc.tokens_balance || 0),
      total_tokens_spent: (acc.total_tokens_spent || 0),
    }).eq("id", acc.id);
    await supabase.from("director_campaigns").update({
      status: "failed",
      config: { error: e instanceof Error ? e.message : "agent_error" },
    }).eq("id", campaign?.id);
    return NextResponse.json({
      error: "L'agent a échoué. Vos crédits ont été remboursés.",
      details: e instanceof Error ? e.message : "unknown",
    }, { status: 500 });
  }

  // 5) Stocke le livrable dans la campagne
  await supabase.from("director_campaigns").update({
    status: result.ok ? "completed" : "failed",
    config: {
      business_name: acc.business_name,
      city: acc.city,
      email: acc.email,
      agent_name: result.agent_name,
      report_md: result.report_md,
      deliverables: result.deliverables,
      next_actions: result.next_actions,
      estimated_results: result.estimated_results,
      source: result.source,
    },
    completed_at: new Date().toISOString(),
  }).eq("id", campaign?.id);

  // Met aussi à jour director_actions avec un résumé
  if (actRow?.id) {
    await supabase.from("director_actions").update({
      details: {
        agent_id: agentKey,
        agent_name: result.agent_name,
        business_name: acc.business_name,
        city: acc.city,
        deliverables_count: result.deliverables.length,
        source: result.source,
        marketplace: isMarketplace,
      },
    }).eq("id", actRow.id);
  }

  // 6) Email Brevo au client avec le rapport
  if (acc.email && result.ok) {
    sendDeliverableEmail(acc.email, acc.business_name || "votre entreprise", result.agent_name, result.report_md)
      .catch(() => {});
  }

  // 7) Telegram admin
  const tg = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat) {
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: `🤖 <b>Klyora Director — ${result.agent_name} a fini</b>\n\n` +
              `<b>Client :</b> ${acc.business_name || acc.email}\n` +
              `<b>Mission :</b> ${agentKey}${isMarketplace ? " (marketplace)" : ""}\n` +
              `<b>Crédits :</b> -${cost} (solde: ${newBalance})\n` +
              `<b>Livrables :</b> ${result.deliverables.length}\n` +
              `<b>Source :</b> ${result.source}`,
        parse_mode: "HTML",
      }),
    }).catch(() => {});
  }

  // 8) Retourne le résultat à l'UI
  return NextResponse.json({
    success: true,
    new_balance: newBalance,
    campaign_id: campaign?.id,
    agent_name: result.agent_name,
    report_md: result.report_md,
    deliverables: result.deliverables,
    next_actions: result.next_actions,
    estimated_results: result.estimated_results,
    source: result.source,
  });
}
