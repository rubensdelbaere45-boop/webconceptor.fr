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
import { scraplingEnrich, scrapingPagesJaunes, isScraplingConfigured } from "@/lib/scrapling-client";
import { fetchInseeBySiret, fetchInseeBySiren, isInseeConfigured } from "@/lib/sources/sirene-insee";

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

// ──────────────────────────────────────────────────────────────
// ENRICHISSEMENT VIA SCRAPLING + INSEE
// ──────────────────────────────────────────────────────────────

interface EnrichedContext {
  scrapling: {
    website_scraped: boolean;
    emails_found: string[];
    about_text: string | null;
    photos_count: number;
    pj_results_count: number;
    has_pj_listing: boolean;
  };
  insee: {
    found: boolean;
    legal_form: string | null;     // catégorie juridique
    naf_code: string | null;
    creation_date: string | null;
    is_active: boolean | null;
    official_name: string | null;
    official_address: string | null;
  };
}

async function enrichAccount(account: any): Promise<EnrichedContext> {
  const ctx: EnrichedContext = {
    scrapling: {
      website_scraped: false,
      emails_found: [],
      about_text: null,
      photos_count: 0,
      pj_results_count: 0,
      has_pj_listing: false,
    },
    insee: {
      found: false,
      legal_form: null,
      naf_code: null,
      creation_date: null,
      is_active: null,
      official_name: null,
      official_address: null,
    },
  };

  // 1) Scrapling /enrich sur le site (si dispo)
  if (account.website_url && isScraplingConfigured()) {
    const enr = await scraplingEnrich(account.website_url, ["emails", "about", "photos"]);
    if (enr) {
      ctx.scrapling.website_scraped = true;
      ctx.scrapling.emails_found = enr.emails || [];
      ctx.scrapling.about_text = enr.about;
      ctx.scrapling.photos_count = (enr.photos || []).length;
    }
  }

  // 2) Scrapling /scrape-pj — vérifie la présence sur Pages Jaunes
  if (account.business_type && account.city && isScraplingConfigured()) {
    const pj = await scrapingPagesJaunes(account.business_type, account.city, 1);
    if (pj) {
      ctx.scrapling.pj_results_count = pj.results?.length || 0;
      // Match approximatif sur le nom
      const nameLower = (account.business_name || "").toLowerCase();
      ctx.scrapling.has_pj_listing = !!pj.results?.some(r =>
        nameLower && r.name?.toLowerCase().includes(nameLower.slice(0, Math.min(12, nameLower.length)))
      );
    }
  }

  // 3) INSEE par SIRET (si dispo)
  if (isInseeConfigured()) {
    let insee = null;
    if (account.siret && /^\d{14}$/.test(account.siret)) {
      insee = await fetchInseeBySiret(account.siret);
    } else if (account.siret && /^\d{9}$/.test(account.siret)) {
      // Probablement un SIREN
      insee = await fetchInseeBySiren(account.siret);
    }
    if (insee) {
      ctx.insee.found = true;
      ctx.insee.legal_form = insee.nature_juridique;
      ctx.insee.naf_code = insee.ape_code;
      ctx.insee.creation_date = insee.date_creation;
      ctx.insee.is_active = insee.is_active;
      ctx.insee.official_name = insee.name;
      ctx.insee.official_address = insee.address;
    }
  }

  return ctx;
}

async function generateDiagnosticWithKimi(account: any, enriched: EnrichedContext): Promise<Faille[]> {
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

  // Contexte enrichi via Scrapling + INSEE
  const scrapBlock = enriched.scrapling.website_scraped
    ? `\nDONNÉES SCRAPPÉES DU SITE (${account.website_url}) :
- Emails de contact trouvés : ${enriched.scrapling.emails_found.length > 0 ? enriched.scrapling.emails_found.join(", ") : "AUCUN — gros problème de joignabilité"}
- Texte 'À propos' : ${enriched.scrapling.about_text ? enriched.scrapling.about_text.slice(0, 300) : "AUCUN texte de présentation trouvé sur le site"}
- Photos sur le site : ${enriched.scrapling.photos_count} ${enriched.scrapling.photos_count < 5 ? "(insuffisant pour convertir)" : ""}`
    : (account.website_url
        ? `\nSCRAPLING ÉCHEC sur ${account.website_url} (site probablement cassé ou bloqué)`
        : `\nAUCUN SITE WEB renseigné — invisible sur Google direct`);

  const pjBlock = enriched.scrapling.pj_results_count > 0
    ? `\nPAGES JAUNES (${account.business_type} ${account.city}) : ${enriched.scrapling.pj_results_count} résultats — ${enriched.scrapling.has_pj_listing ? "présence confirmée" : "PAS dans le top — invisible en recherche locale"}`
    : `\nPAGES JAUNES : aucune présence détectée pour ${account.business_type} à ${account.city}`;

  const inseeBlock = enriched.insee.found
    ? `\nDONNÉES OFFICIELLES INSEE :
- Nom officiel : ${enriched.insee.official_name}
- Adresse officielle : ${enriched.insee.official_address || "?"}
- Forme juridique : ${enriched.insee.legal_form || "?"}
- Code NAF : ${enriched.insee.naf_code || "?"}
- Date de création : ${enriched.insee.creation_date || "?"}
- Statut : ${enriched.insee.is_active ? "Actif" : "INACTIF / FERMÉ"}`
    : (account.siret ? `\nINSEE : SIRET ${account.siret} non trouvé (probable erreur de saisie)` : "\nINSEE : pas de SIRET renseigné");

  const userPrompt = `Entreprise (données validées par sources officielles) :
- Nom : ${account.business_name || "?"}
- Type : ${account.business_type || "?"}
- Ville : ${account.city || "?"}
- Note Google : ${account.google_rating || "?"}/5
- Nb d'avis Google : ${account.google_reviews_count || 0}
- Instagram : ${account.instagram_url || "non renseigné"}
- Facebook : ${account.facebook_url || "non renseigné"}
${scrapBlock}
${pjBlock}
${inseeBlock}

Audite cette entreprise. Renvoie 5-8 failles concrètes prioritaires en JSON.
PRIVILÉGIE les failles évidemment confirmées par les données scrappées/INSEE ci-dessus.`;

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

  // 🆕 ENRICHISSEMENT : Scrapling + INSEE (peut prendre 20-40s)
  const enriched = await enrichAccount(acc);

  // Met à jour director_accounts avec les vraies données INSEE (si trouvées)
  if (enriched.insee.found) {
    await supabase.from("director_accounts").update({
      code_naf: enriched.insee.naf_code,
      business_address: enriched.insee.official_address,
    }).eq("id", acc.id);
  }

  // Tente IA Kimi K2 avec contexte enrichi, fallback déterministe
  let failles = await generateDiagnosticWithKimi(acc, enriched);
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
    enrichment: {
      scrapling_used: enriched.scrapling.website_scraped || enriched.scrapling.pj_results_count > 0,
      insee_used: enriched.insee.found,
      emails_scrapped: enriched.scrapling.emails_found.length,
      photos_count: enriched.scrapling.photos_count,
      pj_listings: enriched.scrapling.pj_results_count,
      official_name: enriched.insee.official_name,
      naf_code: enriched.insee.naf_code,
    },
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
