/**
 * Découverte de niche pour Amazon KDP — focus HISTOIRE & ACTUALITÉ.
 *
 * Stratégie qui marche réellement (data 2024-2026 KDP FR) :
 *   - Histoire = niche éternelle MAIS éviter les sujets ultra-saturés
 *     (Napoléon, WW2 général, Antiquité grecque). Cibler des ANGLES ÉTROITS :
 *     batailles oubliées, personnages secondaires, événements régionaux,
 *     "histoire en 30 minutes" pour public pressé.
 *   - Actualité = surfer les recherches Google récentes (élections,
 *     conflits, scandales). Court (40-60 pages), prix bas (2.99-4.99 €),
 *     volume de ventes élevé pendant 2-3 mois → rotation rapide.
 *
 * Ces 2 catégories = ~40% du top KDP Histoire en 2024-2026.
 */

import { createClient } from "@supabase/supabase-js";
import { llmCall, parseJsonResponse } from "./llm-client";
import type { NicheCandidate } from "./types";

const SYSTEM_PROMPT_NICHE = `Tu es un expert Amazon KDP français avec 10 ans d'expérience sur les niches HISTOIRE et ACTUALITÉ.

Mission : proposer des niches RENTABLES qui se vendent VRAIMENT.

✅ BONNES NICHES (faible concurrence, intent d'achat clair) :

HISTOIRE — angles étroits :
- "La bataille de Lépante 1571 — la victoire chrétienne oubliée"
- "Les femmes pirates des Caraïbes — Anne Bonny et Mary Read"
- "La Commune de Paris en 30 minutes"
- "L'expédition Franklin — disparition dans l'Arctique 1845"
- "Catherine de Médicis — la reine empoisonneuse"
- "Le génocide arménien 1915 — comprendre en 2 heures"

ACTUALITÉ — surfer les sujets brûlants :
- "Comprendre la guerre Israël-Hamas en 2 heures"
- "L'élection américaine 2024 — comment Trump est revenu"
- "La crise BRICS+ — la fin du dollar ?"
- "Le pape François et son héritage"
- "La fin de TikTok aux USA — chronologie"
- "Mayotte et Chido — anatomie d'un cyclone"

❌ MAUVAISES NICHES (saturées, n'achetez plus) :
- Napoléon (10 000 titres)
- WW2 généralités (20 000 titres)
- Antiquité grecque/romaine générale
- Histoire de France version manuel scolaire
- "Réussir sa vie"
- Mindset / motivation

CRITÈRES pour chaque niche :
- Public clair avec intent achat (curiosité, devoir, formation)
- Faible concurrence (≤ 100 livres sur la requête principale)
- Angle ÉTROIT (un événement précis, un personnage, une période courte)
- Vendable 4.99 - 9.99 € en Kindle
- ÉVITER les sujets sensibles qui font supprimer un livre KDP (violence
  glorifiée, désinformation, atteinte personne publique vivante)

Réponds STRICTEMENT en JSON valide :
{
  "niches": [
    {
      "topic": "Titre niche court et précis",
      "angle": "histoire" | "actualite",
      "rationale": "Pourquoi rentable (1-2 phrases avec data si possible)",
      "target_audience": "Qui achète en 1 phrase",
      "keywords": ["mot-clé 1", "mot-clé 2", "mot-clé 3", "mot-clé 4", "mot-clé 5"],
      "estimated_competition": "low" | "medium" | "high"
    }
  ]
}`;

export async function discoverNiches(count = 6): Promise<NicheCandidate[]> {
  const existingTopics = await getExistingTopics();
  const exclusion = existingTopics.length > 0
    ? `\n\nNiches DÉJÀ utilisées (à éviter absolument) :\n${existingTopics.map((t) => `- ${t}`).join("\n")}`
    : "";

  const userPrompt = `Propose ${count} niches e-book français Amazon KDP rentables en ${new Date().getFullYear()}.

Répartition demandée :
- ${Math.ceil(count / 2)} niches HISTOIRE (angles étroits, événements/personnages précis)
- ${Math.floor(count / 2)} niches ACTUALITÉ (sujets brûlants des 12 derniers mois)${exclusion}

Réponds en JSON valide uniquement, structure exacte donnée dans tes instructions.`;

  const text = await llmCall({
    system: SYSTEM_PROMPT_NICHE,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 2500,
    json: true,
  });

  const parsed = parseJsonResponse<{ niches: NicheCandidate[] }>(text);
  return parsed.niches || [];
}

async function getExistingTopics(): Promise<string[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
    const { data } = await supabase
      .from("ebooks")
      .select("niche_topic")
      .order("created_at", { ascending: false })
      .limit(80);
    return (data || []).map((d: { niche_topic: string }) => d.niche_topic).filter(Boolean);
  } catch {
    return [];
  }
}

/** Sélectionne la meilleure niche : low competition prioritaire, alterne H/A */
export function pickBestNiche(
  candidates: NicheCandidate[],
  preferredAngle?: "histoire" | "actualite"
): NicheCandidate {
  if (candidates.length === 0) throw new Error("Aucune niche candidate");
  const scored = candidates.map((n) => {
    let s = 0;
    s += n.estimated_competition === "low" ? 10 : n.estimated_competition === "medium" ? 5 : 1;
    if (preferredAngle && n.angle === preferredAngle) s += 3;
    return { n, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored[0].n;
}
