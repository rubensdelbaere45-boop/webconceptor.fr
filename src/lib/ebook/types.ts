/**
 * Types partagés du pipeline e-book.
 * Inclut tous les champs requis par le formulaire Amazon KDP.
 */

export interface NicheCandidate {
  topic: string;            // ex: "L'invasion mongole de la Hongrie en 1241"
  rationale: string;        // pourquoi cette niche est rentable
  target_audience: string;  // public cible
  keywords: string[];       // mots-clés Amazon BSR / Google
  estimated_competition: "low" | "medium" | "high";
  angle: string;            // angle narratif spécifique (histoire / actualité)
}

/** Catégories Amazon KDP — chaîne hiérarchique. Ex: "Livres > Histoire > Histoire du monde > Asie" */
export interface KdpCategory {
  path: string;
}

export interface KdpFields {
  language: string;              // "Français"
  title: string;
  subtitle: string;
  author: string;                // pseudo
  description_amazon: string;    // ≤ 4000 chars, formaté Amazon
  categories: KdpCategory[];     // 3 max
  keywords: string[];            // exactement 7, ≤ 50 chars chacun, inclut concourskdp2026
  audience_adult: boolean;       // contenu sexuel ? toujours false pour nous
  main_marketplace: "Amazon.fr" | "Amazon.com";
  recommended_price_eur: number; // prix Kindle en euros, 0.99 - 9.99
  royalty_percent: 35 | 70;      // 70% si prix entre 2.99-9.99 sur Amazon.fr
  estimated_royalty_per_sale_eur: number;
}

export interface EbookOutline {
  title: string;
  subtitle: string;
  author_name: string;
  description: string;           // description longue (interne)
  niche: NicheCandidate;
  chapters: Array<{
    number: number;
    title: string;
    summary: string;
    target_words: number;
  }>;
  cover_prompt: string;          // prompt EN pour Pollinations/DALL-E
  kdp: KdpFields;                // tous les champs prêts à coller dans KDP
}

export interface EbookChapter {
  number: number;
  title: string;
  content_md: string;
  word_count: number;
}

export interface EbookFinal {
  outline: EbookOutline;
  chapters: EbookChapter[];
  pdf_url: string | null;
  cover_url: string | null;
  total_words: number;
  total_pages_estimate: number;
}
