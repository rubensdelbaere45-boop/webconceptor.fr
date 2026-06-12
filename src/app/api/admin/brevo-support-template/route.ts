/**
 * GET /api/admin/brevo-support-template
 *
 * Génère un message PRÊT À COLLER dans le chat support Brevo pour
 * demander la validation manuelle du sender "WebConcept".
 *
 * Tom n'a qu'à :
 *   1. Ouvrir https://app.brevo.com (chat support en bas à droite)
 *   2. Coller le message
 *   3. Joindre les screenshots demandés
 *   4. Attendre 24-72h
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminGuard } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 30, windowSec: 60, routeKey: "brevo-template" });
  if (guard) return guard;

  const template = `Bonjour,

Je souhaite faire valider mon expéditeur SMS alphanumérique sur mon compte Brevo.

📛 Nom de l'expéditeur souhaité : WebConcept (10 caractères)
🏢 Activité : Création de sites web professionnels pour artisans et commerces de proximité (TPE françaises)
🌐 Site web : https://klyora.fr
📞 Téléphone du gérant : 06 35 59 24 71

📋 Contexte :
- J'envoie des SMS transactionnels à des prospects qui ont ouvert leur maquette de site web sur klyora.fr
- Tous les destinataires ont eu un point de contact préalable (email de prospection avec lien vers leur maquette personnalisée)
- Les SMS contiennent toujours la mention "STOP pour arrêter" et un opt-out actif
- Volume estimé : 50-100 SMS/mois

🔍 Justificatifs disponibles (je peux joindre des screenshots) :
- Mentions légales de mon site mentionnant "Klyora Sites" comme nom commercial
- Page de checkout avec opt-in client pour les communications SMS
- Exemple de message type que j'envoie

❓ Actuellement, les SMS partent sous "BatiPilote" alors que j'utilise sender="WebConcept" dans mes appels API.
Pouvez-vous m'expliquer la procédure de validation et combien de temps cela prendrait ?

Merci d'avance pour votre aide.

Tom — Klyora Sites
SIRET / SIREN disponible sur demande.`;

  return NextResponse.json({
    message_to_copy: template,
    where_to_paste: "Chat support Brevo (bouton bleu en bas à droite de https://app.brevo.com)",
    files_to_attach: [
      "Screenshot https://klyora.fr (page d'accueil)",
      "Screenshot des mentions légales mentionnant 'Klyora Sites'",
      "Screenshot du checkout avec opt-in SMS",
    ],
    expected_delay: "24-72h de validation après envoi des justificatifs",
    alternative_if_refused: "OVHcloud SMS (sender alphanumeric autorisé sans validation, voir /admin/brevo-sms)",
  });
}

export async function POST(req: NextRequest) { return GET(req); }
