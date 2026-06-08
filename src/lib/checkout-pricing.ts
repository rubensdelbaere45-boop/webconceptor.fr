/**
 * Source unique de vérité pour les prix du checkout V2.
 *
 * Le site web reste un paiement unique (320€ Simple / 860€ Luxury).
 * Tout le reste est récurrent (mensuel ou annuel avec -10% remise).
 */

export type PlanTier = "simple" | "luxury";
export type Frequency = "monthly" | "yearly";
export type AddonKey = "universel" | "restaurant" | "artisan";

/** Frais de setup one-time pour la création du site (en centimes EUR). */
export const SETUP_FEE_CENTS: Record<PlanTier, number> = {
  simple: 32000,   // 320 €
  luxury: 86000,   // 860 €
};

/** Hébergement de base — prix mensuel (centimes). Tarifs mis à jour 2026-06-07. */
export const HOSTING_MONTHLY_CENTS: Record<PlanTier, number> = {
  simple: 1790,    // Formule Sérénité — 17,90 €/mois
  luxury: 3590,    // Formule Sérénité Premium — 35,90 €/mois
};

/** Upsells récurrents (mensuel, centimes). */
export const ADDON_MONTHLY_CENTS: Record<AddonKey, number> = {
  universel:  3000,  // Google Ads + GMB = 30 €/mois
  restaurant: 1500,  // Menu QR digital  = 15 €/mois
  artisan:    2000,  // Module devis 24/7 = 20 €/mois
};

export const ADDON_LABELS: Record<AddonKey, { name: string; description: string }> = {
  universel: {
    name: "Pack Visibilité (Google Ads + GMB)",
    description: "Campagne Google Ads géolocalisée + gestion fiche Google Business optimisée",
  },
  restaurant: {
    name: "Menu QR Code digital",
    description: "Menu accessible depuis un QR code en salle, mis à jour en temps réel",
  },
  artisan: {
    name: "Module de Devis en ligne 24/7",
    description: "Vos clients génèrent un devis instantané sans vous déranger",
  },
};

/** Réduction si paiement annuel : 10% sur les abonnements (-10%). */
export const YEARLY_DISCOUNT = 0.10;

/**
 * Calcule le prix mensuel effectif (centimes) selon la fréquence.
 *  - monthly : prix mensuel inchangé
 *  - yearly  : prix mensuel × 12 × 0.9 = prix annuel
 *              (on stocke le prix annuel global dans Stripe avec interval=year)
 */
export function effectiveMonthlyCents(monthlyCents: number, freq: Frequency): number {
  if (freq === "monthly") return monthlyCents;
  // yearly : -10% sur 12 mois
  return Math.round(monthlyCents * (1 - YEARLY_DISCOUNT));
}

/** Prix à facturer dans Stripe pour 1 ligne récurrente (mensuel OU annuel total). */
export function recurringStripeUnitCents(monthlyCents: number, freq: Frequency): number {
  if (freq === "monthly") return monthlyCents;
  // yearly : monthlyCents × 12 × 0.9
  return Math.round(monthlyCents * 12 * (1 - YEARLY_DISCOUNT));
}

/** Détermine quels addons sont applicables au business_type. */
export function availableAddons(businessType: string): AddonKey[] {
  const t = (businessType || "").toLowerCase();
  const list: AddonKey[] = ["universel"]; // toujours dispo
  if (/restaur|brasser|bistr|pizz|crêper|creperie|café|cafe|glacier|fast.?food|boulang|patisser/.test(t)) {
    list.push("restaurant");
  }
  if (/plomb|electrici|electric|menuis|serrur|carrele|peintr|couvr|maçon|macon|garage|carross|artisan|chauffag/.test(t)) {
    list.push("artisan");
  }
  return list;
}
