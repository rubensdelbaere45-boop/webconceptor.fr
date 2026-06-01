/* ══════════════════════════════════════════
   PROSPECT SCORING — 0 à 100 points

   Logique de scoring :
   • Note Google       → jusqu'à 25 pts
   • Nombre d'avis     → jusqu'à 20 pts
   • Qualité du site   → jusqu'à 30 pts
   • Type de commerce  → jusqu'à 15 pts
   • Signal réservation→ jusqu'à 10 pts

   Tiers :
   • LUXURY ≥ 80 + critères prestige → maquette Stitch, prix 860€
   • HOT    ≥ 70 → email prioritaire, ton urgent
   • WARM  40–69 → email standard, ton neutre
   • COLD   < 40 → ignoré
   ══════════════════════════════════════════ */

export type ProspectTier = "LUXURY" | "HOT" | "WARM" | "COLD";

export interface ProspectScore {
  score: number;           // 0-100
  tier: ProspectTier;
  reasons: string[];
  recommended_angle: string;
  is_luxury: boolean;      // raccourci pour la logique d'envoi
}

// ── Métiers luxury ─────────────────────────────────────────────────────────
// Ces établissements ont la capacité budgétaire pour 860€ et valorisent
// un site haut-de-gamme. Combiné avec une note excellente = LUXURY tier.
const LUXURY_BUSINESS_TYPES = new Set([
  "gastronomique",
  "spa", "hotel", "boutique_luxe", "bijouterie",
  "cabinet_medical", "avocat", "notaire", "architecte",
  "golf", "yacht", "vignoble", "chateau",
]);

// ── Métiers HOT standard ───────────────────────────────────────────────────
const HOT_BUSINESS_TYPES = new Set([
  "restaurant", "brasserie", "bistrot",
  "coiffeur", "institut",
  "glacier", "boulangerie", "patisserie",
  "creperie", "cafe",
]);

// ── Métiers WARM ───────────────────────────────────────────────────────────
const WARM_BUSINESS_TYPES = new Set([
  "plombier", "electricien", "garage", "menuisier", "peintre",
  "chocolatier", "pizzeria", "food_truck", "bar",
  "fleuriste", "epicerie",
]);

// ── Fort potentiel de réservation en ligne ─────────────────────────────────
const BOOKING_TYPES = new Set([
  "restaurant", "brasserie", "bistrot", "gastronomique", "coiffeur",
  "spa", "hotel", "institut", "dentiste", "osteo", "kine",
  "salle_sport", "auto_ecole",
]);

// ── Villes premium — poids prestige supplémentaire ──────────────────────────
const LUXURY_CITIES = new Set([
  "paris", "monaco", "cannes", "saint-tropez", "courchevel",
  "megève", "deauville", "biarritz", "annecy", "aix-en-provence",
  "lyon", "bordeaux", "nice", "strasbourg",
]);

export function scoreProspect(p: {
  google_rating?: number | null;
  google_reviews_count?: number | null;
  site_quality?: "none" | "poor" | "average" | "good" | null;
  business_type?: string | null;
  city?: string | null;
}): ProspectScore {
  let score = 0;
  const reasons: string[] = [];
  const bt = p.business_type || "";
  const city = (p.city || "").toLowerCase().trim();

  // ── Note Google (0–25 pts) ─────────────────────────────────────────────────
  if (p.google_rating && p.google_rating > 0) {
    if (p.google_rating >= 4.7) {
      score += 25;
      reasons.push(`Note exceptionnelle ${p.google_rating}★ — réputation d'excellence`);
    } else if (p.google_rating >= 4.5) {
      score += 20;
      reasons.push(`Note excellente ${p.google_rating}★ — réputation premium`);
    } else if (p.google_rating >= 4.2) {
      score += 15;
      reasons.push(`Bonne note ${p.google_rating}★`);
    } else {
      score += 5;
      reasons.push(`Note correcte ${p.google_rating}★`);
    }
  }

  // ── Nombre d'avis (0–20 pts) ───────────────────────────────────────────────
  if (p.google_reviews_count && p.google_reviews_count > 0) {
    if (p.google_reviews_count >= 500) {
      score += 20;
      reasons.push(`Notoriété exceptionnelle (${p.google_reviews_count} avis)`);
    } else if (p.google_reviews_count >= 200) {
      score += 18;
      reasons.push(`Forte notoriété (${p.google_reviews_count} avis)`);
    } else if (p.google_reviews_count >= 100) {
      score += 12;
      reasons.push(`Bonne notoriété (${p.google_reviews_count} avis)`);
    } else if (p.google_reviews_count >= 50) {
      score += 8;
      reasons.push(`Notoriété correcte (${p.google_reviews_count} avis)`);
    } else {
      score += 3;
    }
  }

  // ── Qualité du site existant (0–30 pts) ───────────────────────────────────
  if (p.site_quality === "none") {
    score += 30;
    reasons.push("Pas de site web — argument de vente maximum");
  } else if (p.site_quality === "poor") {
    score += 20;
    reasons.push("Site web vieillissant — forte marge d'amélioration");
  } else if (p.site_quality === "average") {
    score += 10;
    reasons.push("Site web améliorable");
  } else {
    score += 3;
  }

  // ── Type de commerce (0–15 pts) ────────────────────────────────────────────
  if (LUXURY_BUSINESS_TYPES.has(bt)) {
    score += 15;
    reasons.push(`Secteur luxury (${bt}) — budget élevé, exigence prestige`);
  } else if (HOT_BUSINESS_TYPES.has(bt)) {
    score += 15;
    reasons.push(`Secteur à forte conversion (${bt})`);
  } else if (WARM_BUSINESS_TYPES.has(bt)) {
    score += 10;
  } else {
    score += 5;
  }

  // ── Signal réservation en ligne (0–10 pts) ─────────────────────────────────
  if (BOOKING_TYPES.has(bt)) {
    score += 10;
    reasons.push("Fort potentiel réservation/RDV en ligne");
  }

  score = Math.min(100, Math.max(0, score));

  // ── Détection LUXURY ───────────────────────────────────────────────────────
  // Critères stricts : établissement haut-de-gamme prouvé + budget disponible
  const ratingExcellent  = (p.google_rating ?? 0) >= 4.5;
  const reviewsStrong    = (p.google_reviews_count ?? 0) >= 100;
  const isLuxuryType     = LUXURY_BUSINESS_TYPES.has(bt);
  const isHotHighScore   = HOT_BUSINESS_TYPES.has(bt) && score >= 85;
  const inLuxuryCity     = LUXURY_CITIES.has(city);

  // LUXURY = (type luxury OU score très élevé) + réputation prouvée
  const is_luxury = (isLuxuryType || isHotHighScore || inLuxuryCity) &&
                    ratingExcellent && reviewsStrong && score >= 75;

  if (is_luxury) {
    reasons.push("✨ LUXURY — maquette Stitch sur-mesure, prix 860€");
  }

  // ── Tier final ─────────────────────────────────────────────────────────────
  let tier: ProspectTier;
  if (is_luxury) {
    tier = "LUXURY";
  } else if (score >= 70) {
    tier = "HOT";
  } else if (score >= 40) {
    tier = "WARM";
  } else {
    tier = "COLD";
  }

  // ── Angle commercial recommandé ────────────────────────────────────────────
  let recommended_angle: string;
  if (is_luxury) {
    recommended_angle = "Prestige exclusif — angle sur-mesure : votre réputation d'exception mérite un site qui vous ressemble vraiment";
  } else if (p.site_quality === "none") {
    recommended_angle = "Pas de site — angle opportunité : aucune excuse 'j'ai déjà un site', conversion maximale";
  } else if (p.google_rating && p.google_rating >= 4.5 && p.google_reviews_count && p.google_reviews_count >= 50) {
    recommended_angle = "Réputation premium — angle prestige : cette réputation mérite une vitrine à la hauteur";
  } else if (p.site_quality === "poor") {
    recommended_angle = "Site vieillissant — angle modernisation : montrer l'écart entre qualité réelle et site actuel";
  } else if (BOOKING_TYPES.has(bt)) {
    recommended_angle = "Réservation en ligne — angle gains directs : réservations 24/7 sans commission";
  } else {
    recommended_angle = "Visibilité locale — angle Google Maps : être trouvé avant la concurrence";
  }

  return { score, tier, reasons, recommended_angle, is_luxury };
}
