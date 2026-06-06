/**
 * Couvre-feu nocturne pour la génération lourde (Stitch IA, OpenDesign).
 *
 * Règle Tom : la génération de maquettes via IA tourne EXCLUSIVEMENT
 * entre 20h00 et 05h00 (heure Paris). Le jour, on traite uniquement
 * l'envoi des emails (Brevo), la qualification, le closing.
 *
 * Pourquoi cette fenêtre ?
 *   - Coût des LLMs réduit la nuit (pas de pic de demande)
 *   - Le matin à 5h, on a un stock frais de maquettes prêtes à envoyer
 *     pendant la journée
 *   - Évite la pression sur Vercel/Railway aux heures de pointe métier
 */

const PARIS_TZ = "Europe/Paris";

/**
 * Renvoie l'heure courante 0-23 en zone Europe/Paris.
 */
function nowParisHour(): number {
  const h = new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TZ,
    hour: "2-digit",
    hour12: false,
  }).format(new Date());
  return parseInt(h, 10) % 24;
}

/**
 * Vrai si on est dans la fenêtre NOCTURNE de génération (20h-05h Paris).
 *
 * - 20h00 inclus → vrai
 * - 04h59 inclus → vrai
 * - 05h00 exclu → faux (on stoppe à 5h)
 */
export function isWithinNightGenerationWindow(): boolean {
  const h = nowParisHour();
  return h >= 20 || h < 5;
}

/**
 * Détaille pourquoi on est ou non dans la fenêtre (utile pour logs).
 */
export function nightWindowStatus(): { allowed: boolean; current_hour: number; window: string } {
  const h = nowParisHour();
  return {
    allowed: h >= 20 || h < 5,
    current_hour: h,
    window: "20h–05h Europe/Paris",
  };
}
