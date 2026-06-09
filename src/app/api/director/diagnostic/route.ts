/**
 * POST /api/director/diagnostic
 * → Lance un diagnostic complet de l'entreprise du user connecté.
 *   Détecte les failles concrètes via IA Kimi K2 + données existantes
 *   (Google reviews, business_type, photos, INSEE, etc.)
 *
 *   Retourne 5-8 failles structurées avec agent recommandé + gain potentiel.
 *   Stocke en director_diagnostics + flag director_accounts.diagnostic_completed_at.
 *
 * GET /api/director/diagnostic
 * → Retourne le dernier diagnostic du user (si existe).
 *
 * Auth : session WebDirector (cookie)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, getSessionUser } from "@/lib/director/auth";
import { listAgents } from "@/lib/director/marketplace-loader";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface Faille {
  titre: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  evidence: string; // ce qu'on voit dans les données
  agent_slug: string;
  agent_name: string;
  agent_emoji: string;
  agent_price_eur: string;
  gain_potentiel: string;
}

async function generateDiagnosticWithKimi(account: any): Promise<Faille[]> {
  const apiKey = process.env.OPENROUTER_API_KEY_KIMI || process.env.OPENROUTER_API_KEY;
  if (!apiKey) return [];

  const marketplaceAgents = listAgents();
  // Prépare un catalogue compact des agents disponibles pour l'IA
  const agentsCatalog = marketplaceAgents.map(a =>
    `- ${a.slug} | ${a.name} ${a.emoji} | ${a.tokens_cost} crédits | ${a.vibe.slice(0, 80)}`
  ).join("\n");

  const systemPrompt = `Tu es un consultant senior PME France qui audite une entreprise locale en 3 minutes.

OBJECTIF : produire un diagnostic ULTRA concret de 5-8 failles MAJEURES qui pénalisent le business du prospect.

RÈGLES :
- Reste FACTUEL : base-toi UNIQUEMENT sur les données fournies (note Google, nb avis, business_type, ville…). Pas de spéculation hors-données.
- Chaque faille = un problème CONCRET visible dans les données ou évident pour le métier.
- À chaque faille → propose UN agent de la marketplace ci-dessous (utilise le slug exact).
- Gain potentiel = chiffré et réaliste (+X% de RDV / +Y avis / -Z appels manqués), pas de promesse de "x10".
- Sévérité : 'critical' (perte directe €), 'high' (image marque), 'medium' (manque à gagner), 'low' (optim').

CATALOG des agents (slug + nom + crédits + vibe) :
${agentsCatalog}

Format JSON STRICT (ne renvoie QUE ce JSON, rien d'autre) :
{
  "failles": [
    {
      "titre": "titre court 6-10 mots",
      "severity": "critical|high|medium|low",
      "description": "1-2 phrases factuelles décrivant le problème",
      "evidence": "ce que tu vois dans les données (ex: 'note 4.2/5 sur 2085 avis sans réponses du gérant')",
      "agent_slug": "slug-exact-du-catalogue-ci-dessus",
      "gain_potentiel": "ex: +12 RDV/mois ou -25% appels manqués"
    }
  ]
}`;

  const userPrompt = `Entreprise :
- Nom : ${account.business_name || "?"}
- Type : ${account.business_type || "?"}
- Ville : ${account.city || "?"}
- Note Google : ${account.google_rating || "?"}/5
- Nb d'avis Google : ${account.google_reviews_count || 0}
- Site web : ${account.website_url || "non renseigné"}
- Instagram : ${account.instagram_url || "non renseigné"}
- Facebook : ${account.facebook_url || "non renseigné"}
${account.code_naf ? `- Code NAF (INSEE) : ${account.code_naf}` : ""}
${account.siret ? `- SIRET : ${account.siret}` : ""}

Audite cette entreprise. Renvoie 5-8 failles concrètes prioritaires en JSON.`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://webconceptor.fr",
        "X-Title": "WebDirector — Diagnostic",
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2.6:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2200,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(90_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const json = JSON.parse(content);
    const rawFailles = (json.failles || []) as any[];

    // Enrichit chaque faille avec le name/emoji/prix de l'agent depuis le catalogue
    const enriched: Faille[] = rawFailles.slice(0, 8).map((f: any) => {
      const agent = marketplaceAgents.find(a => a.slug === f.agent_slug)
        || marketplaceAgents.find(a => a.slug === "marketing-content-creator")!;
      return {
        titre: String(f.titre || "Faille à identifier").slice(0, 200),
        severity: ["critical", "high", "medium", "low"].includes(f.severity) ? f.severity : "medium",
        description: String(f.description || "").slice(0, 500),
        evidence: String(f.evidence || "").slice(0, 300),
        agent_slug: agent.slug,
        agent_name: agent.name,
        agent_emoji: agent.emoji,
        agent_price_eur: `${agent.tokens_cost} crédits`,
        gain_potentiel: String(f.gain_potentiel || "").slice(0, 200),
      };
    });
    return enriched;
  } catch {
    return [];
  }
}

// Fallback déterministe si Kimi K2 indisponible
function buildFallbackDiagnostic(account: any): Faille[] {
  const failles: Faille[] = [];
  const marketplaceAgents = listAgents();
  const agentMap = Object.fromEntries(marketplaceAgents.map(a => [a.slug, a]));

  const rating = Number(account.google_rating) || 0;
  const reviews = Number(account.google_reviews_count) || 0;

  if (rating > 0 && rating < 4) {
    const a = agentMap["marketing-ai-citation-strategist"] || agentMap["support-support-responder"];
    failles.push({
      titre: `Note Google ${rating}/5 — image de marque pénalisée`,
      severity: "high",
      description: `Une note inférieure à 4/5 fait fuir 30 à 50% des prospects qui découvrent votre business via Google.`,
      evidence: `Note actuelle ${rating}/5 sur ${reviews} avis.`,
      agent_slug: a.slug, agent_name: a.name, agent_emoji: a.emoji,
      agent_price_eur: `${a.tokens_cost} crédits`,
      gain_potentiel: "Remonter à 4.5/5 en 90j = +25% de fréquentation Google",
    });
  }
  if (reviews >= 50 && rating >= 4) {
    const a = agentMap["support-support-responder"];
    failles.push({
      titre: `${reviews} avis Google sans réponses du gérant`,
      severity: "medium",
      description: `Vos prospects voient que vous ne répondez pas aux avis — ça envoie un signal d'indifférence qui pénalise votre conversion.`,
      evidence: `${reviews} avis, taux de réponse estimé < 5%.`,
      agent_slug: a.slug, agent_name: a.name, agent_emoji: a.emoji,
      agent_price_eur: `${a.tokens_cost} crédits`,
      gain_potentiel: "+8% conversion Google Business",
    });
  }
  if (!account.website_url) {
    const a = agentMap["marketing-seo-specialist"];
    failles.push({
      titre: "Aucun site web actif",
      severity: "critical",
      description: `Vos prospects ne trouvent rien sur Google quand ils cherchent votre nom. Vous perdez tous les leads avant même qu'ils vous appellent.`,
      evidence: "Champ website_url vide en base.",
      agent_slug: a.slug, agent_name: a.name, agent_emoji: a.emoji,
      agent_price_eur: `${a.tokens_cost} crédits`,
      gain_potentiel: "Pack WebConceptor 320€ + ce qui suit",
    });
  }
  const bt = (account.business_type || "").toLowerCase();
  if (["restaurant", "brasserie", "boulangerie", "patisserie", "cafe", "pizzeria"].includes(bt) && !account.instagram_url) {
    const a = agentMap["marketing-instagram-curator"];
    failles.push({
      titre: "Aucune présence Instagram pour un commerce de bouche",
      severity: "high",
      description: `60% des restaurants en France obtiennent leurs nouveaux clients via Instagram. Sans Insta = vous fermez la porte à un client sur deux.`,
      evidence: "Champ instagram_url vide.",
      agent_slug: a.slug, agent_name: a.name, agent_emoji: a.emoji,
      agent_price_eur: `${a.tokens_cost} crédits`,
      gain_potentiel: "+15% nouveaux clients en 4 mois",
    });
  }
  return failles.slice(0, 8);
}

// ────────────────────────────────────────────────────────────
// HANDLER
// ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = getServiceClient();
  const { data: acc } = await supabase
    .from("director_accounts")
    .select("*")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!acc) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  // Tente IA Kimi K2, fallback déterministe
  let failles = await generateDiagnosticWithKimi(acc);
  const usedAi = failles.length > 0;
  if (failles.length === 0) failles = buildFallbackDiagnostic(acc);

  // Agents uniques recommandés
  const agentsSet = new Set(failles.map(f => f.agent_slug));
  const agents = [...agentsSet];

  // Persiste le diagnostic
  const { data: diag } = await supabase.from("director_diagnostics").insert({
    account_id: acc.id,
    completed_at: new Date().toISOString(),
    failles_detected: failles,
    agents_recommended: agents,
    source: "user_action",
  }).select("id").single();

  // Met à jour le flag sur director_accounts
  await supabase.from("director_accounts").update({
    diagnostic_completed_at: new Date().toISOString(),
    last_diagnostic_at: new Date().toISOString(),
    diagnostic_report: { failles, agents, generated_at: new Date().toISOString() },
  }).eq("id", acc.id);

  // Telegram récap admin
  const tg = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat) {
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        parse_mode: "HTML",
        text: `🔍 <b>WebDirector — Diagnostic lancé</b>\n\n` +
              `<b>Client :</b> ${acc.business_name || acc.email}\n` +
              `<b>Failles détectées :</b> ${failles.length}\n` +
              `<b>Agents recommandés :</b> ${agents.length}\n` +
              `<b>Source :</b> ${usedAi ? "IA Kimi K2" : "fallback déterministe"}`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    diagnostic_id: diag?.id,
    business_name: acc.business_name,
    failles,
    agents_recommended_count: agents.length,
    is_subscribed: !!acc.is_subscribed,
    source: usedAi ? "ai" : "fallback",
    upsell: acc.is_subscribed ? null : {
      title: "Pour embaucher tous ces agents, abonnez-vous à WebDirector",
      monthly_price_eur: 29.9,
      yearly_price_eur: 320,
      cta_url: "/director/billing",
    },
  });
}

export async function GET() {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const supabase = getServiceClient();
  const { data: acc } = await supabase
    .from("director_accounts")
    .select("diagnostic_report, last_diagnostic_at")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!acc?.diagnostic_report) {
    return NextResponse.json({ has_diagnostic: false });
  }
  return NextResponse.json({
    has_diagnostic: true,
    completed_at: acc.last_diagnostic_at,
    report: acc.diagnostic_report,
  });
}
