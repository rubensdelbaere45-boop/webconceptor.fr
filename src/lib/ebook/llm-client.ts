/**
 * Client LLM multi-provider avec fallback automatique.
 *
 * Cascade gratuite → payante :
 *   1. Gemini 2.0 Flash       (GEMINI_API_KEY)        — GRATUIT 1500 req/jour
 *   2. OpenRouter modèles free (OPENROUTER_API_KEY)    — GRATUIT (Llama 3.3 70B free)
 *   3. Mistral large           (MISTRAL_API_KEY)       — GRATUIT free tier
 *   4. Anthropic Claude        (ANTHROPIC_API_KEY)     — payant, premium
 *
 * Première clé trouvée = utilisée. Si elle échoue, on passe à la suivante.
 *
 * Tom n'a besoin d'AUCUNE clé pour démarrer : il suffit de récupérer
 * une clé Gemini gratuite sur https://aistudio.google.com/app/apikey (30 sec).
 */

import Anthropic from "@anthropic-ai/sdk";

export interface LlmMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LlmCallOpts {
  system: string;
  messages: LlmMessage[];
  maxTokens?: number;
  json?: boolean;
}

type Provider = "gemini" | "openrouter" | "mistral" | "anthropic";

/** Récupère la clé OpenRouter quelle que soit la variable env utilisée par Tom. */
function getOpenRouterKey(): string | undefined {
  return (
    process.env.OPENROUTER_API_KEY_KIMI ||   // ← variable nommée par Tom sur Vercel
    process.env.OPENROUTER_API_KEY ||
    process.env.OPENROUTER_KEY
  );
}

function availableProviders(): Provider[] {
  // ORDRE PRIORITAIRE :
  //  1. OpenRouter Kimi K2 (Moonshot) — contexte 1M, excellent FR
  //  2. Anthropic Claude (premium)
  //  3. Gemini Flash (gratuit)
  //  4. Mistral (free tier)
  const list: Provider[] = [];
  if (getOpenRouterKey()) list.push("openrouter");
  if (process.env.ANTHROPIC_API_KEY) list.push("anthropic");
  if (process.env.GEMINI_API_KEY) list.push("gemini");
  if (process.env.MISTRAL_API_KEY) list.push("mistral");
  return list;
}

export async function llmCall(opts: LlmCallOpts): Promise<string> {
  const providers = availableProviders();
  if (providers.length === 0) {
    throw new Error("Aucune clé LLM configurée. Set GEMINI_API_KEY (gratuit, aistudio.google.com) ou ANTHROPIC_API_KEY.");
  }

  let lastError = "";
  for (const p of providers) {
    try {
      return await callProvider(p, opts);
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      // continue au suivant
    }
  }
  throw new Error(`Tous les providers LLM ont échoué. Dernière erreur : ${lastError}`);
}

async function callProvider(p: Provider, opts: LlmCallOpts): Promise<string> {
  switch (p) {
    case "gemini":     return callGemini(opts);
    case "openrouter": return callOpenRouter(opts);
    case "mistral":    return callMistral(opts);
    case "anthropic":  return callAnthropic(opts);
  }
}

/* ── Gemini 2.0 Flash (GRATUIT) ──────────────────────── */

async function callGemini(opts: LlmCallOpts): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY!;
  // Combine system + messages en un seul prompt (Gemini gère un format différent)
  const contents = [
    {
      role: "user",
      parts: [{ text: `${opts.system}\n\n---\n\n${opts.messages.map((m) => m.content).join("\n\n")}` }],
    },
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents,
      generationConfig: {
        maxOutputTokens: opts.maxTokens ?? 8000,
        temperature: 0.7,
        ...(opts.json ? { responseMimeType: "application/json" } : {}),
      },
    }),
    signal: AbortSignal.timeout(90_000),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Gemini HTTP ${res.status}: ${txt.slice(0, 200)}`);
  }
  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini: réponse vide");
  return text;
}

/* ── OpenRouter (modèles gratuits) ───────────────────── */

async function callOpenRouter(opts: LlmCallOpts): Promise<string> {
  const apiKey = getOpenRouterKey()!;
  // Kimi K2 (Moonshot AI) par défaut : 1M tokens contexte, excellent FR,
  // ~0.15$ / 1M tokens input — meilleur ratio prix/qualité pour livres longs.
  // Override possible via OPENROUTER_MODEL.
  const model = process.env.OPENROUTER_MODEL || "moonshotai/kimi-k2";

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://webconceptor.fr",
      "X-Title": "WebConceptor Ebooks",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: opts.system }, ...opts.messages],
      max_tokens: opts.maxTokens ?? 8000,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenRouter: réponse vide");
  return text;
}

/* ── Mistral (free tier) ─────────────────────────────── */

async function callMistral(opts: LlmCallOpts): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY!;
  const res = await fetch("https://api.mistral.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "mistral-large-latest",
      messages: [{ role: "system", content: opts.system }, ...opts.messages],
      max_tokens: opts.maxTokens ?? 8000,
      ...(opts.json ? { response_format: { type: "json_object" } } : {}),
    }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!res.ok) throw new Error(`Mistral HTTP ${res.status}`);
  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (!text) throw new Error("Mistral: réponse vide");
  return text;
}

/* ── Anthropic Claude (premium) ──────────────────────── */

async function callAnthropic(opts: LlmCallOpts): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
  const res = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: opts.maxTokens ?? 8000,
    system: opts.system,
    messages: opts.messages.map((m) => ({ role: m.role, content: m.content })),
  });
  const text = res.content[0]?.type === "text" ? res.content[0].text : "";
  if (!text) throw new Error("Anthropic: réponse vide");
  return text;
}

/** Helper : parse JSON robuste depuis la réponse LLM (extrait le bloc JSON). */
export function parseJsonResponse<T>(text: string): T {
  // Cherche le 1er bloc { ... } valide
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error("Réponse LLM ne contient pas de JSON");
  return JSON.parse(match[0]) as T;
}
