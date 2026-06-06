/**
 * Génère outline (avec tous les champs KDP) + chapitres via LLM cascade gratuite.
 *
 * Le LLM remplit AUSSI :
 *   - Description Amazon 4000 chars max, formatée (paragraphes, emojis pertinents)
 *   - 3 catégories KDP avec hiérarchie complète
 *   - 7 mots-clés Amazon (≤ 50 chars chacun, inclut concourskdp2026 en dernier)
 *   - Prix recommandé en fonction de la longueur et de la concurrence
 *
 * Tom n'a qu'à copier-coller dans KDP. 2 minutes par livre.
 */

import { llmCall, parseJsonResponse } from "./llm-client";
import type { NicheCandidate, EbookOutline, EbookChapter, KdpFields } from "./types";

const PSEUDONYMES = [
  "Marc Lefèvre", "Camille Berger", "Sophie Marchand", "Antoine Dubreuil",
  "Hélène Rousseau", "Jean-Pierre Vasseur", "Claire Mouret", "Vincent Lemoine",
  "Laurent Aubrac", "Pauline Ferrand", "Thomas Marquis", "Béatrice Noiret",
];

/* ──────────────────────────────────────────────
   OUTLINE — plan + tous les champs KDP
   ────────────────────────────────────────────── */

const SYSTEM_OUTLINE = `Tu es un éditeur Amazon KDP expert français, spécialisé en HISTOIRE & ACTUALITÉ.

Tu construis un outline COMPLET d'un e-book qui va se vendre.

Règles ABSOLUES :

📖 Titre & sous-titre :
- Titre accrocheur, ≤ 60 caractères, promesse claire
- Sous-titre qualifie le bénéfice ("Tout comprendre en 2 heures", "L'histoire vraie de...")
- Évite les guillemets dans le titre (KDP refuse)

📝 Description Amazon (≤ 4000 caractères, formatage Amazon HTML léger autorisé) :
- Accroche puissante en 1ère phrase (question, statistique, fait choc)
- 3-4 paragraphes : problème → contenu → bénéfices → appel à acheter
- Tu PEUX utiliser <b>gras</b> et listes <ul><li>…</li></ul> (Amazon les rend)
- Termine par "Ce livre est fait pour vous si…" + 3-4 bullets
- ⚠️ AUCUNE promesse fausse, aucune comparaison avec d'autres livres,
  aucun "best-seller" ou "n°1" (KDP supprime)

📂 Catégories KDP (3, chaînes hiérarchiques) :
Exemples valides :
- "Livres > Histoire > Histoire du monde > Antiquité"
- "Livres > Histoire > Europe > France"
- "Livres > Actualité, politique et société > Géopolitique"
- "Livres > Études supérieures > Histoire"
Toujours commencer par "Livres > "

🔑 Mots-clés (exactement 7, ≤ 50 chars chacun) :
- 6 mots-clés de recherche concrets (pas de mots vagues)
- Le 7ème DOIT être : "concourskdp2026"

💰 Prix Kindle :
- 0.99 € si livre court (< 50 pages) ou actualité jetable → royalty 35%
- 2.99 - 4.99 € si livre moyen (50-100 pages) → royalty 70%
- 5.99 - 9.99 € si livre long ou très niché → royalty 70%
- Tu calcules en fonction de la longueur estimée et de la concurrence

📚 Chapitres :
- 10 à 12 chapitres logiques, progression claire
- 1500-1800 mots par chapitre = ~80 pages total
- Titres factuels et précis, pas de "Chapitre 1 : Introduction"

🎨 Cover prompt (en ANGLAIS, pour Pollinations/DALL-E) :
- Décris une SCÈNE visuelle évocatrice de la niche, pas un livre
- Style : "vintage illustration", "oil painting", "historical engraving",
  "dramatic photography", "minimalist editorial"
- TOUJOURS finir par : "no text, no letters, vertical portrait 2:3 ratio"
- Ex : "Vintage oil painting of a 15th century Mediterranean naval battle at dusk, golden light, dramatic clouds, no text, no letters, vertical portrait 2:3 ratio"

Réponds STRICTEMENT en JSON valide, structure exacte :
{
  "title": "string",
  "subtitle": "string",
  "description": "version markdown longue pour le PDF",
  "kdp": {
    "description_amazon": "string ≤ 4000 chars avec HTML léger autorisé",
    "categories": ["Livres > ...", "Livres > ...", "Livres > ..."],
    "keywords": ["kw1", "kw2", "kw3", "kw4", "kw5", "kw6", "concourskdp2026"],
    "recommended_price_eur": 4.99,
    "royalty_percent": 70
  },
  "chapters": [
    { "number": 1, "title": "string", "summary": "string", "target_words": 1600 }
  ],
  "cover_prompt": "english prompt for image generation"
}`;

export async function buildOutline(niche: NicheCandidate): Promise<EbookOutline> {
  const userPrompt = `Niche : ${niche.topic}
Angle : ${niche.angle}
Public : ${niche.target_audience}
Mots-clés détectés : ${niche.keywords.join(", ")}

Construis l'outline COMPLET de cet e-book français Amazon KDP de ~80 pages (~18 000 mots).
Donne uniquement le JSON, structure exacte de tes instructions.`;

  const text = await llmCall({
    system: SYSTEM_OUTLINE,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 4000,
    json: true,
  });

  const parsed = parseJsonResponse<{
    title: string;
    subtitle: string;
    description: string;
    kdp: {
      description_amazon: string;
      categories: string[];
      keywords: string[];
      recommended_price_eur: number;
      royalty_percent: 35 | 70;
    };
    chapters: EbookOutline["chapters"];
    cover_prompt: string;
  }>(text);

  // Garantit que concourskdp2026 est dans les 7 mots-clés
  let keywords = (parsed.kdp.keywords || []).slice(0, 7).map((k) => k.slice(0, 50));
  if (!keywords.includes("concourskdp2026")) {
    keywords = [...keywords.slice(0, 6), "concourskdp2026"];
  }
  while (keywords.length < 7) keywords.push("concourskdp2026");

  const author = PSEUDONYMES[Math.floor(Math.random() * PSEUDONYMES.length)];
  const price = clamp(parsed.kdp.recommended_price_eur, 0.99, 9.99);
  const royalty = price >= 2.99 && price <= 9.99 ? 70 : 35;

  const kdp: KdpFields = {
    language: "Français",
    title: parsed.title,
    subtitle: parsed.subtitle,
    author,
    description_amazon: (parsed.kdp.description_amazon || parsed.description).slice(0, 4000),
    categories: (parsed.kdp.categories || []).slice(0, 3).map((p) => ({ path: p })),
    keywords,
    audience_adult: false,
    main_marketplace: "Amazon.fr",
    recommended_price_eur: price,
    royalty_percent: royalty,
    estimated_royalty_per_sale_eur: Math.round(price * (royalty / 100) * 100) / 100,
  };

  return {
    title: parsed.title,
    subtitle: parsed.subtitle,
    description: parsed.description,
    niche,
    chapters: parsed.chapters,
    cover_prompt: parsed.cover_prompt,
    author_name: author,
    kdp,
  };
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

/* ──────────────────────────────────────────────
   CHAPITRES — écriture parallèle
   ────────────────────────────────────────────── */

const SYSTEM_CHAPTER = `Tu es un rédacteur professionnel d'e-books HISTOIRE & ACTUALITÉ en français.

Règles ABSOLUES :
- Style direct, clair, narratif (raconte comme une histoire)
- Inclus des dates précises, lieux, noms (vérifie la véracité)
- Sous-titres ## pour structurer (au moins 4-5 par chapitre)
- Anecdotes vraies, citations historiques sourcées si possible
- AUCUNE mention d'auteurs réels, livres réels, marques (risque KDP)
- Pas de figures publiques vivantes en jugement personnel
- Markdown propre (## titres, **gras**, listes -)
- Commence directement, pas d'intro "Dans ce chapitre nous allons..."
- Termine par 1 phrase de transition vers le chapitre suivant
- Reste FACTUEL : pas d'opinion politique, pas de prédiction
- Si tu cites un fait, sois précis ; si tu ne sais pas, reformule sans inventer

Tu réponds UNIQUEMENT avec le markdown du chapitre.
Commence par le titre H1 : # Chapitre N — [titre]`;

async function writeChapter(
  ebookTitle: string,
  niche: NicheCandidate,
  chapter: EbookOutline["chapters"][number],
  previousSummaries: string[]
): Promise<EbookChapter> {
  const ctx = previousSummaries.length > 0
    ? `\n\nContexte des chapitres précédents :\n${previousSummaries.slice(-3).join("\n---\n")}`
    : "";

  const userPrompt = `Livre : ${ebookTitle}
Niche : ${niche.topic} (${niche.angle})
Public : ${niche.target_audience}

Écris le chapitre ${chapter.number} : "${chapter.title}"
Résumé prévu : ${chapter.summary}
Longueur cible : ~${chapter.target_words} mots${ctx}

Réponds uniquement avec le markdown du chapitre.`;

  const text = await llmCall({
    system: SYSTEM_CHAPTER,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 6000,
  });

  const words = text.trim().split(/\s+/).length;
  return {
    number: chapter.number,
    title: chapter.title,
    content_md: text.trim(),
    word_count: words,
  };
}

/** Génère tous les chapitres en parallèle. Concurrence 3 (rate-limit Gemini free) */
export async function writeAllChapters(outline: EbookOutline): Promise<EbookChapter[]> {
  const CONCURRENCY = 3;
  const results: EbookChapter[] = [];
  const queue = [...outline.chapters];
  const summaries: string[] = [];

  async function worker() {
    while (queue.length > 0) {
      const ch = queue.shift();
      if (!ch) return;
      try {
        const written = await writeChapter(outline.title, outline.niche, ch, summaries);
        results.push(written);
        summaries.push(`Ch.${ch.number} ${ch.title} : ${written.content_md.slice(0, 250).replace(/\n/g, " ")}...`);
      } catch (e) {
        results.push({
          number: ch.number,
          title: ch.title,
          content_md: `# Chapitre ${ch.number} — ${ch.title}\n\n*[Contenu indisponible : ${e instanceof Error ? e.message : "erreur"}]*`,
          word_count: 0,
        });
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
  results.sort((a, b) => a.number - b.number);
  return results;
}
