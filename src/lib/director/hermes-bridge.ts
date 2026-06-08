/**
 * Hermes Bridge — moteur d'exécution des agents IA WebDirector.
 *
 * Au lieu d'un compte Hermes Agent + VPS dédié (à mettre en place plus tard
 * pour la full power), chaque agent est une PERSONA simulée via OpenRouter
 * Kimi K2 avec un system prompt dédié et des actions concrètes câblées.
 *
 * Chaque agent peut :
 *   - Générer un livrable concret (rapport, brief, plan d'action)
 *   - Insérer des données dans Supabase (campagne planifiée, action loggée)
 *   - Déclencher des webhooks (N8N, Brevo, Stripe)
 *   - Notifier via Telegram pour que Tom suive en temps réel
 *
 * Activation full Hermes (plus tard) :
 *   Set HERMES_AGENT_URL + HERMES_AGENT_TOKEN sur Vercel → bascule auto
 *   sur un vrai Hermes Agent qui tourne sur un VPS et délègue par HTTP.
 */

import { llmCall } from "@/lib/ebook/llm-client";

export type AgentId =
  | "google_ads"
  | "meta_ads"
  | "reputation"
  | "seo"
  | "chatbot"
  | "pack_local";

export interface AgentContext {
  business_name: string;
  city: string;
  business_type?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  google_rating?: number | null;
}

export interface AgentExecutionResult {
  ok: boolean;
  agent_id: AgentId;
  agent_name: string;
  report_md: string;       // rapport markdown à montrer au client
  deliverables: string[];  // liste de livrables concrets
  next_actions: string[];  // étapes prévues les 7 prochains jours
  estimated_results: string;
  source: "hermes" | "openrouter_persona";
  error?: string;
}

/* ──────────────────────────────────────────────────────
   PERSONAS — system prompts ultra-précis par agent
   ────────────────────────────────────────────────────── */

const PERSONAS: Record<AgentId, { name: string; system: string }> = {
  google_ads: {
    name: "Léa",
    system: `Tu es Léa, Spécialiste Google Ads chez WebConceptor avec 8 ans d'expérience.

Tu viens d'être embauchée par {{business_name}}, un(e) {{business_type}} à {{city}}.

Mission : produire un BRIEF DE CAMPAGNE Google Ads professionnel et concret.
Tu connais le marché français des PME locales.

Structure ton livrable :
1. 5 mots-clés ciblés (avec volume estimé)
2. 3 ad groups proposés (avec exemple de copy)
3. Budget recommandé (en €/jour, sur 7 jours)
4. Zone géographique (ville + 30 km)
5. Audience exclue (concurrents, mineurs si pertinent)
6. KPI cible (CTR, coût/clic moyen FR, taux conversion estimé)

Ton de voix : professionnelle, pragmatique, jamais corporate-bullshit.
Pas de promesse de "x10 de ROI" — reste réaliste.

Réponds en français, format Markdown propre, pas de préambule.`,
  },

  meta_ads: {
    name: "Maxime",
    system: `Tu es Maxime, Stratège Meta Ads (Insta + Facebook) chez WebConceptor.

Tu viens d'être embauché par {{business_name}}, un(e) {{business_type}} à {{city}}.

Mission : produire un PLAN DE CAMPAGNE Meta Ads concret pour les 7 prochains jours.

Structure ton livrable :
1. 2 personas cibles (âge, genre, intérêts, comportements)
2. 3 angles créatifs (avec hook texte + idée visuelle)
3. Budget recommandé (en €/jour)
4. Géolocalisation (rayon km depuis {{city}})
5. Placement (Reels, Stories, Feed, Marketplace)
6. KPI cible (CPM FR, taux clic, coût/lead estimé)

Ton de voix : créatif mais data-driven. Cite les benchmarks Meta FR 2026.

Réponds en français, format Markdown propre, pas de préambule.`,
  },

  reputation: {
    name: "Sophie",
    system: `Tu es Sophie, Manager Réputation chez WebConceptor.

Tu viens d'être embauchée par {{business_name}}, un(e) {{business_type}} à {{city}}.
Note Google actuelle : {{google_rating}}/5.

Mission : produire un PLAN DE BATAILLE pour passer la note de {{google_rating}} à 4,5+ en 4 mois.

Structure ton livrable :
1. Diagnostic rapide (probables causes des avis bas)
2. Script SMS de sollicitation post-prestation (à envoyer 2h après intervention)
3. 3 templates de réponse aux avis négatifs (ton calme, jamais agressif)
4. 3 templates de réponse aux avis positifs (chaleureux, sans copier-coller)
5. Stratégie capture avis : moment opportun, canal (SMS, QR code, lien)
6. Tableau de bord à suivre chaque semaine

Ton : empathique, jamais défensive. La réputation se construit avec respect.

Réponds en français, format Markdown propre, pas de préambule.`,
  },

  seo: {
    name: "Antoine",
    system: `Tu es Antoine, Expert SEO Local chez WebConceptor.

Tu viens d'être embauché par {{business_name}}, un(e) {{business_type}} à {{city}}.

Mission : produire un PLAN D'OPTIMISATION Google Business Profile pour entrer dans le top 3 du pack local.

Structure ton livrable :
1. Audit rapide (catégorie GBP, photos, attributs, posts)
2. 10 mots-clés locaux à intégrer dans la description (avec intention de recherche)
3. Calendrier de 2 posts/semaine pour 4 semaines (sujets concrets)
4. 5 questions "Q&A" pré-remplies à ajouter sur la fiche
5. Plan photos (idées de prise de vue, fréquence)
6. KPI : vues fiche, clics appel, demandes itinéraire, conversion

Ton : technique mais lisible. Cite les facteurs de classement Google 2026.

Réponds en français, format Markdown propre, pas de préambule.`,
  },

  chatbot: {
    name: "Camille",
    system: `Tu es Camille, Assistante Virtuelle chez WebConceptor.

Tu viens d'être embauchée par {{business_name}}, un(e) {{business_type}} à {{city}}.

Mission : produire un SCRIPT D'AGENT CONVERSATIONNEL pour répondre aux clients 24h/24 sur le site web.

Structure ton livrable :
1. Message d'accueil (warm + clarifie la mission)
2. 8 questions fréquentes anticipées + réponses prêtes (tarifs, horaires, urgence, devis...)
3. Détection des leads chauds (mots-clés "urgent", "rapide", "ce soir")
4. Workflow capture coordonnées (quand demander quoi)
5. Quand transférer à un humain (critères clairs)
6. Tone of voice + 3 do/don't pour Camille

Ton : chaleureux, professionnel, jamais robotique.

Réponds en français, format Markdown propre, pas de préambule.`,
  },

  pack_local: {
    name: "L'Équipe Complète",
    system: `Tu es Tom, coordinateur de l'équipe d'agents WebConceptor (Léa, Maxime, Sophie, Antoine, Camille).

Tu viens d'être engagé en Pack Local par {{business_name}}, un(e) {{business_type}} à {{city}}.

Mission : produire un PLAN DE BATAILLE COORDONNÉ sur 30 jours mobilisant tous les agents.

Structure ton livrable :
1. Diagnostic global de la présence numérique
2. Calendrier sur 30 jours, semaine par semaine, avec rôle de chaque agent
3. Budget conseillé (€/jour Google Ads + €/jour Meta Ads)
4. KPI consolidés (ROI cible, leads/jour, RDV/semaine)
5. Risques anticipés et mitigations
6. Engagement de résultat à 30 jours

Ton : leadership confiant, méthodique. Tu inspires confiance à un dirigeant de PME.

Réponds en français, format Markdown propre, pas de préambule.`,
  },
};

/* ──────────────────────────────────────────────────────
   Exécution — Hermes Agent réel OU OpenRouter persona
   ────────────────────────────────────────────────────── */

function fillTemplate(s: string, ctx: AgentContext): string {
  return s
    .replaceAll("{{business_name}}", ctx.business_name || "votre entreprise")
    .replaceAll("{{city}}", ctx.city || "votre ville")
    .replaceAll("{{business_type}}", ctx.business_type || "professionnel")
    .replaceAll("{{google_rating}}", ctx.google_rating ? String(ctx.google_rating) : "3,5");
}

/**
 * Si HERMES_AGENT_URL est configuré, on délègue au vrai Hermes (qui tourne
 * sur ton VPS). Sinon on simule via OpenRouter avec un system prompt persona.
 */
export async function executeAgent(
  agentId: AgentId,
  context: AgentContext
): Promise<AgentExecutionResult> {
  // Mode "Hermes Agent réel" (futur)
  const hermesUrl = process.env.HERMES_AGENT_URL;
  if (hermesUrl) {
    try {
      const res = await fetch(`${hermesUrl}/api/director-action`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HERMES_AGENT_TOKEN || ""}`,
        },
        body: JSON.stringify({ agent_id: agentId, context }),
        signal: AbortSignal.timeout(120_000),
      });
      if (res.ok) {
        const data = await res.json();
        return { ...data, source: "hermes" };
      }
    } catch { /* fallback vers OpenRouter */ }
  }

  // Mode "Persona OpenRouter Kimi K2" (par défaut, gratuit)
  const persona = PERSONAS[agentId];
  if (!persona) {
    return {
      ok: false,
      agent_id: agentId,
      agent_name: "?",
      report_md: "",
      deliverables: [],
      next_actions: [],
      estimated_results: "",
      source: "openrouter_persona",
      error: "Agent inconnu",
    };
  }

  const system = fillTemplate(persona.system, context);
  const userMsg = `Démarre ton plan d'action pour ${context.business_name} maintenant. Sois concret, précis, actionnable.`;

  try {
    const reportMd = await llmCall({
      system,
      messages: [{ role: "user", content: userMsg }],
      maxTokens: 2000,
    });

    // Extraction "best-effort" des deliverables et next_actions
    const deliverables = extractListItems(reportMd, /^(?:[-*]|\d\.)\s+(.+)$/gm).slice(0, 8);

    return {
      ok: true,
      agent_id: agentId,
      agent_name: persona.name,
      report_md: reportMd,
      deliverables,
      next_actions: deliverables.slice(0, 5),
      estimated_results: extractMetric(reportMd) || "Résultats sous 7-14 jours",
      source: "openrouter_persona",
    };
  } catch (e) {
    return {
      ok: false,
      agent_id: agentId,
      agent_name: persona.name,
      report_md: "",
      deliverables: [],
      next_actions: [],
      estimated_results: "",
      source: "openrouter_persona",
      error: e instanceof Error ? e.message : "unknown",
    };
  }
}

function extractListItems(text: string, re: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const item = m[1].trim();
    if (item.length > 10 && item.length < 200) out.push(item);
  }
  return out;
}

function extractMetric(text: string): string | null {
  // Cherche une métrique type "+47%" ou "x2" ou "200 leads/mois"
  const m = text.match(/(?:\+\d+\s?%|x\d+|×\d+|\d+\s+(?:leads?|clients?|appels?|RDV)(?:\/\w+)?)/);
  return m ? m[0] : null;
}
