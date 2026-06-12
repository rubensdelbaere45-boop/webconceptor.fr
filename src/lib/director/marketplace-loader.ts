/**
 * marketplace-loader.ts
 * ─────────────────────────────────────────────────────────────
 * Charge les 30 agents marketplace (agency-agents) depuis le
 * dossier src/lib/director/marketplace/*.md.
 *
 * Parse le frontmatter YAML + extrait :
 *   - Role Definition
 *   - Core Capabilities
 *   - Decision Framework
 *
 * Expose :
 *   - listAgents() → liste des 30 (sans system_prompt, léger)
 *   - getAgentBySlug(slug) → fiche complète + system_prompt
 *
 * Coûts crédits par défaut :
 *   - Marketing/Sales/Paid Media : 100 crédits (1 livrable riche)
 *   - Design/Product/Support     : 75 crédits (livrable plus court)
 * ─────────────────────────────────────────────────────────────
 */
import fs from "fs";
import path from "path";

interface AgentFrontmatter {
  name: string;
  description: string;
  color?: string;
  emoji?: string;
  vibe?: string;
  tools?: string;
  author?: string;
}

export interface MarketplaceAgent {
  slug: string;          // ex: "marketing-content-creator"
  division: string;      // ex: "marketing"
  name: string;
  emoji: string;
  vibe: string;
  description: string;
  color: string;
  tokens_cost: number;   // coût en crédits Klyora Director
  status?: "live" | "coming_soon" | "beta";   // "live" par défaut
  coming_soon_reason?: string;
}

// Agents marqués "Prochainement" (à exposer dans l'UI sans bouton "Embaucher")
const COMING_SOON_SLUGS: Record<string, string> = {
  "paid-media-ppc-strategist": "Connexion Google Ads API en cours",
  "paid-media-paid-social-strategist": "Connexion Meta Ads API en cours",
  "paid-media-creative-strategist": "Connexion Meta/Google Ads API en cours",
  "paid-media-search-query-analyst": "Connexion Google Ads API en cours",
  "paid-media-tracking-specialist": "Connexion Google Tag Manager API en cours",
  "paid-media-auditor": "Connexion Google Ads + Meta API en cours",
};

export interface MarketplaceAgentFull extends MarketplaceAgent {
  system_prompt: string; // markdown complet pour le LLM
}

const MARKETPLACE_DIR = path.join(process.cwd(), "src/lib/director/marketplace");

// Coût par division (en crédits Klyora Director)
const COST_BY_DIVISION: Record<string, number> = {
  marketing: 100,
  "paid-media": 120,  // plus complexe (PPC, audit etc.)
  sales: 100,
  design: 75,
  product: 75,
  support: 50,
};

function parseFrontmatter(raw: string): { fm: AgentFrontmatter; body: string } {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { fm: { name: "", description: "" }, body: raw };

  const fm: any = {};
  for (const line of m[1].split("\n")) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) {
      const v = kv[2].trim();
      // Strip quotes éventuelles
      fm[kv[1]] = v.replace(/^["'](.*)["']$/, "$1");
    }
  }
  return { fm: fm as AgentFrontmatter, body: m[2] };
}

function extractSlugFromFilename(filename: string): string {
  return filename.replace(/\.md$/, "");
}

function extractDivision(slug: string): string {
  const parts = slug.split("-");
  // marketing-content-creator → marketing
  // paid-media-ppc-strategist → paid-media
  if (parts[0] === "paid" && parts[1] === "media") return "paid-media";
  return parts[0];
}

let cache: { agents: MarketplaceAgentFull[]; loadedAt: number } | null = null;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 min

function loadAll(): MarketplaceAgentFull[] {
  if (cache && Date.now() - cache.loadedAt < CACHE_TTL_MS) return cache.agents;

  try {
    const files = fs.readdirSync(MARKETPLACE_DIR).filter(f => f.endsWith(".md"));
    const agents: MarketplaceAgentFull[] = files.map(file => {
      const raw = fs.readFileSync(path.join(MARKETPLACE_DIR, file), "utf8");
      const { fm, body } = parseFrontmatter(raw);
      const slug = extractSlugFromFilename(file);
      const division = extractDivision(slug);

      return {
        slug,
        division,
        name: fm.name || slug,
        emoji: fm.emoji || "🤖",
        vibe: fm.vibe || "",
        description: fm.description || "",
        color: fm.color || "blue",
        tokens_cost: COST_BY_DIVISION[division] || 100,
        // System prompt = body markdown complet (max ~6000 tokens)
        // On laisse le LLM puiser dans la richesse du persona
        system_prompt: body.trim().slice(0, 16000),
      };
    });
    cache = { agents, loadedAt: Date.now() };
    return agents;
  } catch (e) {
    console.error("[marketplace-loader] load failed:", e);
    return [];
  }
}

/**
 * Liste tous les agents marketplace (sans system_prompt pour rester léger).
 * Inclut le flag status: "live" | "coming_soon" pour griser Meta/Google Ads.
 */
export function listAgents(): MarketplaceAgent[] {
  return loadAll().map(a => {
    const csReason = COMING_SOON_SLUGS[a.slug];
    return {
      slug: a.slug,
      division: a.division,
      name: a.name,
      emoji: a.emoji,
      vibe: a.vibe,
      description: a.description,
      color: a.color,
      tokens_cost: a.tokens_cost,
      status: csReason ? "coming_soon" : "live",
      ...(csReason ? { coming_soon_reason: csReason } : {}),
    };
  });
}

/**
 * Fiche complète d'un agent avec son system_prompt.
 */
export function getAgentBySlug(slug: string): MarketplaceAgentFull | null {
  const all = loadAll();
  return all.find(a => a.slug === slug) || null;
}

/**
 * Liste des divisions disponibles avec count.
 */
export function listDivisions(): Array<{ name: string; count: number }> {
  const all = loadAll();
  const map = new Map<string, number>();
  for (const a of all) map.set(a.division, (map.get(a.division) || 0) + 1);
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
