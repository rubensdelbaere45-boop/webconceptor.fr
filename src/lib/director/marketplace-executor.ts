/**
 * marketplace-executor.ts
 * ─────────────────────────────────────────────────────────────
 * Exécute un agent marketplace via le même backend que Hermes Bridge
 * (Hermes Agent Railway si HERMES_AGENT_URL set, sinon OpenRouter Kimi K2).
 *
 * Diffère de Hermes Bridge ainsi :
 *   - 30+ personas (vs 6 fixes)
 *   - Personas définis en .md (parsed by marketplace-loader)
 *   - Coût en crédits variable (75-120) selon division
 *
 * Format du livrable : markdown structuré, identique à Hermes Bridge.
 * ─────────────────────────────────────────────────────────────
 */
import { getAgentBySlug, type MarketplaceAgentFull } from "@/lib/director/marketplace-loader";
import type { AgentContext, AgentExecutionResult } from "@/lib/director/hermes-bridge";

const HERMES_MODEL = "moonshotai/kimi-k2.6:free";

function buildUserPrompt(agent: MarketplaceAgentFull, ctx: AgentContext): string {
  return `Client : **${ctx.business_name}**${ctx.business_type ? ` (${ctx.business_type})` : ""}
Ville : ${ctx.city}
${ctx.website ? `Site existant : ${ctx.website}\n` : ""}${ctx.email ? `Email : ${ctx.email}\n` : ""}${ctx.phone ? `Téléphone : ${ctx.phone}\n` : ""}${ctx.google_rating ? `Note Google : ${ctx.google_rating}/5\n` : ""}
Marché : France, PME locale.

Mission : applique TON expertise (telle que définie dans ton persona ci-dessus) au contexte de ce client.

Tu DOIS produire un livrable Markdown structuré avec :

# [Titre de la mission]

## 1. Diagnostic flash (état actuel ${ctx.business_name} en 2026)

## 2. [Section spécifique à ton expertise — ex : Brief campagne / Plan SEO / Stratégie d'acquisition / etc.]

## 3. [2-3 sous-sections actionnables, chacune avec un livrable concret]

## 4. Next actions 7 jours (5-7 étapes concrètes que le client doit faire)

## 5. Résultats attendus (chiffrés si possible, ex : "+30% trafic local en 60j")

Contraintes :
- Style : pragmatique, FR business, jamais corporate-bullshit
- Données : adaptées au marché français 2026 (prix en €, plateformes pertinentes FR)
- Évite : "n'hésitez pas", "à votre service", "satisfaire le client"
- Préfère : noms d'outils précis, chiffres réalistes, étapes datées

Réponds UNIQUEMENT avec le Markdown, sans phrase d'intro/outro.`;
}

async function executeViaOpenRouter(agent: MarketplaceAgentFull, ctx: AgentContext): Promise<AgentExecutionResult> {
  const apiKey = process.env.OPENROUTER_API_KEY_KIMI || process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      agent_id: agent.slug as any,
      agent_name: agent.name,
      report_md: "",
      deliverables: [],
      next_actions: [],
      estimated_results: "",
      source: "openrouter_persona",
      error: "OPENROUTER_API_KEY non configurée",
    };
  }

  const userPrompt = buildUserPrompt(agent, ctx);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://webconceptor.fr",
        "X-Title": "Klyora Director — Marketplace Agent",
      },
      body: JSON.stringify({
        model: HERMES_MODEL,
        messages: [
          { role: "system", content: `Tu es ${agent.name}.\n\n${agent.system_prompt}` },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.75,
        max_tokens: 3500,
      }),
      signal: AbortSignal.timeout(120_000),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        ok: false,
        agent_id: agent.slug as any,
        agent_name: agent.name,
        report_md: "",
        deliverables: [],
        next_actions: [],
        estimated_results: "",
        source: "openrouter_persona",
        error: `OpenRouter HTTP ${res.status}: ${errText.slice(0, 200)}`,
      };
    }

    const data = await res.json();
    const reportMd: string = data?.choices?.[0]?.message?.content || "";

    if (!reportMd || reportMd.length < 300) {
      return {
        ok: false,
        agent_id: agent.slug as any,
        agent_name: agent.name,
        report_md: reportMd,
        deliverables: [],
        next_actions: [],
        estimated_results: "",
        source: "openrouter_persona",
        error: "Réponse LLM trop courte",
      };
    }

    // Extraction simple : "deliverables" = bullets ou ## sections
    const deliverables: string[] = [];
    const headingRegex = /^##\s+(.+)$/gm;
    let m;
    while ((m = headingRegex.exec(reportMd)) !== null) {
      const h = m[1].trim().slice(0, 80);
      if (!/diagnostic|résultats? attendus?|next actions?/i.test(h)) deliverables.push(h);
    }

    const nextActions: string[] = [];
    const naSection = reportMd.match(/##\s*\d?\.?\s*Next actions?[\s\S]*?(?=^##|\z)/im);
    if (naSection) {
      const lines = naSection[0].split("\n").filter(l => /^[-*\d]+\.?\s+/.test(l.trim()));
      for (const l of lines.slice(0, 8)) {
        nextActions.push(l.replace(/^[-*\d]+\.?\s+/, "").trim().slice(0, 120));
      }
    }

    const estResults = (reportMd.match(/##\s*\d?\.?\s*Résultats? attendus?\s*\n([\s\S]*?)(?=^##|\z)/im)?.[1] || "")
      .slice(0, 300)
      .trim();

    return {
      ok: true,
      agent_id: agent.slug as any,
      agent_name: agent.name,
      report_md: reportMd,
      deliverables: deliverables.slice(0, 10),
      next_actions: nextActions,
      estimated_results: estResults,
      source: "openrouter_persona",
    };
  } catch (e) {
    return {
      ok: false,
      agent_id: agent.slug as any,
      agent_name: agent.name,
      report_md: "",
      deliverables: [],
      next_actions: [],
      estimated_results: "",
      source: "openrouter_persona",
      error: e instanceof Error ? e.message : "network",
    };
  }
}

/**
 * Exécute un agent marketplace par slug.
 */
export async function executeMarketplaceAgent(slug: string, ctx: AgentContext): Promise<AgentExecutionResult> {
  const agent = getAgentBySlug(slug);
  if (!agent) {
    return {
      ok: false,
      agent_id: slug as any,
      agent_name: "Agent introuvable",
      report_md: "",
      deliverables: [],
      next_actions: [],
      estimated_results: "",
      source: "openrouter_persona",
      error: `Agent marketplace introuvable : ${slug}`,
    };
  }

  // TODO : si HERMES_AGENT_URL set, déléguer à Hermes Agent (Railway) avec un wrapper.
  // Pour l'instant, fallback OpenRouter Kimi K2 (gratuit).
  return executeViaOpenRouter(agent, ctx);
}
