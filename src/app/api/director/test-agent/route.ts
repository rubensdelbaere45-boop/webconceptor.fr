/**
 * POST /api/director/test-agent
 * → Test admin d'un agent Hermes sans débiter de crédits.
 *
 * Body : {
 *   agent_id: "google_ads" | "meta_ads" | "reputation" | "seo" | "chatbot" | "pack_local"
 *   business_name?: string  (default: "Boulangerie Test")
 *   city?: string           (default: "Paris")
 *   business_type?: string  (default: "boulangerie_patisserie")
 *   all?: boolean           (si true → teste les 6 agents en série)
 * }
 *
 * Auth : x-admin-key uniquement.
 *
 * Retourne :
 *   - source utilisé (hermes ou openrouter_persona)
 *   - durée d'exécution
 *   - extrait du report_md
 *   - nb deliverables
 *
 * Sert à valider que la cascade Hermes Bridge → Hermes Agent (Railway) ou
 * → Kimi K2 (OpenRouter fallback) fonctionne, avant d'engager les vrais
 * clients de Klyora Director.
 */
import { NextRequest, NextResponse } from "next/server";
import { executeAgent, type AgentId, type AgentContext } from "@/lib/director/hermes-bridge";
import { safeCompare } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ALL_AGENTS: AgentId[] = ["google_ads", "meta_ads", "reputation", "seo", "chatbot", "pack_local"];

interface TestResult {
  agent_id: AgentId;
  ok: boolean;
  source: string;
  duration_ms: number;
  agent_name?: string;
  report_excerpt?: string;
  deliverables_count?: number;
  next_actions_count?: number;
  estimated_results?: string;
  error?: string;
}

async function testOne(agentId: AgentId, ctx: AgentContext): Promise<TestResult> {
  const t0 = Date.now();
  try {
    const result = await executeAgent(agentId, ctx);
    const ms = Date.now() - t0;
    return {
      agent_id: agentId,
      ok: result.ok,
      source: result.source,
      duration_ms: ms,
      agent_name: result.agent_name,
      report_excerpt: result.report_md.slice(0, 300) + (result.report_md.length > 300 ? "…" : ""),
      deliverables_count: result.deliverables.length,
      next_actions_count: result.next_actions.length,
      estimated_results: result.estimated_results.slice(0, 200),
      error: result.error,
    };
  } catch (e) {
    return {
      agent_id: agentId,
      ok: false,
      source: "error",
      duration_ms: Date.now() - t0,
      error: e instanceof Error ? e.message : "unknown",
    };
  }
}

export async function POST(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  let body: any = {};
  try { body = await req.json(); } catch { /* opt */ }

  const ctx: AgentContext = {
    business_name: body.business_name || "Boulangerie Test",
    city: body.city || "Paris",
    business_type: body.business_type || "boulangerie_patisserie",
    email: body.email || "test@example.com",
    phone: body.phone || "+33635592471",
    website: body.website || null,
    google_rating: body.google_rating || 4.7,
  };

  // Diagnostic env
  const env = {
    HERMES_AGENT_URL_set: !!process.env.HERMES_AGENT_URL,
    HERMES_AGENT_TOKEN_set: !!process.env.HERMES_AGENT_TOKEN,
    OPENROUTER_API_KEY_KIMI_set: !!(process.env.OPENROUTER_API_KEY_KIMI || process.env.OPENROUTER_API_KEY),
  };

  // Mode "all" → teste les 6 agents en série
  if (body.all === true) {
    const results: TestResult[] = [];
    for (const a of ALL_AGENTS) {
      results.push(await testOne(a, ctx));
    }
    const okCount = results.filter(r => r.ok).length;
    const sources = [...new Set(results.map(r => r.source))];
    return NextResponse.json({
      success: okCount === ALL_AGENTS.length,
      summary: `${okCount}/${ALL_AGENTS.length} agents OK`,
      sources_used: sources,
      env,
      results,
    });
  }

  // Mode "1 agent" → test ciblé
  const agentId = (body.agent_id || "").trim() as AgentId;
  if (!ALL_AGENTS.includes(agentId)) {
    return NextResponse.json({
      error: "agent_id invalide (ou body.all manquant)",
      valid_agents: ALL_AGENTS,
      env,
    }, { status: 400 });
  }

  const result = await testOne(agentId, ctx);
  return NextResponse.json({ success: result.ok, env, result });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    endpoint: "POST /api/director/test-agent",
    auth: "x-admin-key",
    valid_agents: ALL_AGENTS,
    examples: {
      single: { agent_id: "google_ads", business_name: "Boulangerie Marx", city: "Lyon" },
      all_six: { all: true, business_name: "Boulangerie Marx", city: "Lyon" },
    },
  });
}
