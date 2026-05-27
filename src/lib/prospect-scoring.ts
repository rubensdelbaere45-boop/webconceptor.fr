/* ══════════════════════════════════════════
   PROSPECT SCORING — 0 à 100 points
   Détermine automatiquement si un prospect vaut un email (HOT/WARM)
   ou doit être ignoré (COLD).

   Logique de scoring :
   • Note Google       → jusqu'à 25 pts
   • Nombre d'avis     → jusqu'à 20 pts
   • Qualité du site   → jusqu'à 30 pts (le plus important : sans site = opportunité max)
   • Type de commerce  → jusqu'à 15 pts (restauration/beauté convertissent mieux)
   • Signal réservation→ jusqu'à 10 pts

   Tiers :
   • HOT  ≥ 70  → email prioritaire, ton urgent, forte personnalisation
   • WARM 40–69 → email standard, ton neutre
   • COLD < 40  → ignoré (mauvaise cible ou déjà bien servi)
   ══════════════════════════════════════════ */

export type ProspectTier = "HOT" | "WARM" | "COLD";

export interface ProspectScore {
  score: number;           // 0-100
  tier: ProspectTier;
  reasons: string[];       // explications lisibles (debug + Telegram)
  recommended_angle: string; // angle commercial adapté au profil
}

// Types HOT — fort taux de conversion observé
const HOT_BUSINESS_TYPES = new Set([
  "restaurant", "brasserie", "bistrot", "gastronomique",
  "coiffeur", "spa", "institut",
  "glacier", "boulangerie", "patisserie",
  "creperie", "cafe",
]);

// Types WARM — conversion correcte
const WARM_BUSINESS_TYPES = new Set([
  "plombier", "electricien", "garage", "menuisier", "peintre",
  "chocolatier", "pizzeria", "food_truck", "bar",
  "fleuriste", "epicerie",
]);

// Types avec fort potentiel de réservation en ligne (+10 pts)
const BOOKING_TYPES = new Set([
  "restaurant", "brasserie", "bistrot", "gastronomique", "coiffeur",
  "spa", "institut", "dentiste", "osteo", "kine", "salle_sport", "auto_ecole",
]);

export function scoreProspect(p: {
  google_rating?: number | null;
  google_reviews_count?: number | null;
  site_quality?: "none" | "poor" | "average" | "good" | null;
  business_type?: string | null;
}): ProspectScore {
  let score = 0;
  const reasons: string[] = [];
  const bt = p.business_type || "";

  // ── Note Google (0–25 pts) ────────────────────────────────────────────────
  if (p.google_rating && p.google_rating > 0) {
    if (p.google_rating >= 4.6) {
      score += 25;
      reasons.push(`Note excellente ${p.google_rating}★ — réputation premium`);
    } else if (p.google_rating >= 4.2) {
      score += 15;
      reasons.push(`Bonne note ${p.google_rating}★`);
    } else {
      score += 5;
      reasons.push(`Note correcte ${p.google_rating}★`);
    }
  }

  // ── Nombre d'avis (0–20 pts) ──────────────────────────────────────────────
  if (p.google_reviews_count && p.google_reviews_count > 0) {
    if (p.google_reviews_count >= 200) {
      score += 20;
      reasons.push(`Forte notoriété (${p.google_reviews_count} avis)`);
    } else if (p.google_reviews_count >= 50) {
      score += 10;
      reasons.push(`Notoriété correcte (${p.google_reviews_count} avis)`);
    } else {
      score += 5;
    }
  }

  // ── Qualité du site existant (0–30 pts) — le facteur le plus important ───
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
    // "good" — site déjà bien, plus dur à convaincre
    score += 3;
  }

  // ── Type de commerce (0–15 pts) ───────────────────────────────────────────
  if (HOT_BUSINESS_TYPES.has(bt)) {
    score += 15;
    reasons.push(`Secteur à forte conversion (${bt})`);
  } else if (WARM_BUSINESS_TYPES.has(bt)) {
    score += 10;
  } else {
    score += 5;
  }

  // ── Signal réservation en ligne (0–10 pts) ────────────────────────────────
  if (BOOKING_TYPES.has(bt)) {
    score += 10;
    reasons.push("Fort potentiel réservation/RDV en ligne");
  }

  score = Math.min(100, Math.max(0, score));

  // ── Tier ─────────────────────────────────────────────────────────────────
  const tier: ProspectTier = score >= 70 ? "HOT" : score >= 40 ? "WARM" : "COLD";

  // ── Angle commercial recommandé ───────────────────────────────────────────
  let recommended_angle: string;
  if (p.site_quality === "none") {
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

  return { score, tier, reasons, recommended_angle };
}
