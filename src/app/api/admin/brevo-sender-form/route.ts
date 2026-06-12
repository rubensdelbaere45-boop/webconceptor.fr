/**
 * GET /api/admin/brevo-sender-form
 *
 * Retourne TOUS les champs du formulaire Brevo "Enregistrement Sender ID"
 * prêts à coller, ET un PDF de "preuve de marque" auto-généré à uploader.
 *
 * Tom n'a qu'à :
 *   1. Copier chaque champ depuis la réponse JSON dans le formulaire Brevo
 *   2. Télécharger le PDF via /api/admin/brevo-trademark-proof
 *   3. L'uploader dans le champ "Preuve de marque"
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminGuard } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 30, windowSec: 60, routeKey: "brevo-form" });
  if (guard) return guard;

  return NextResponse.json({
    instructions: "Copie chaque champ ci-dessous dans le formulaire Brevo (Senders > Add SMS Sender > Register Sender ID for France).",
    form_fields: {
      "ID d'expéditeur": {
        value: "WebConcept",
        length: "10/11",
        note: "Maximum 11 caractères. 'Klyora Sites' fait 12 → impossible. 'WebConcept' = max compact.",
      },
      "Localisation de l'entreprise": {
        value: "Oui",
        note: "Notre entreprise est située en France (même pays que la demande).",
      },
      "Nom de l'entreprise": {
        value: "Klyora Sites",
        length: "12/1000",
        note: "Si tu as une raison sociale officielle (SARL, EI, etc.), utilise-la à la place. Sinon 'Klyora Sites' suffit.",
      },
      "Site web de l'entreprise": {
        value: "https://webconceptor.fr",
        length: "23/253",
      },
      "Preuve de marque": {
        instructions: "Télécharge le PDF généré sur /api/admin/brevo-trademark-proof et upload-le ici.",
        download_url: "https://webconceptor.fr/api/admin/brevo-trademark-proof?key=Rubens2026-Klyora Sites",
        alternative: "Si Brevo refuse le PDF auto-généré, screenshot la home de webconceptor.fr en PDF.",
      },
    },
    sms_content_step: {
      note: "Brevo va te demander un EXEMPLE de SMS que tu envoies. Voici un template type :",
      example_sms: "Bonjour, votre maquette Klyora Sites (Chez Stephane) est disponible : https://webconceptor.fr/prospects/xxx. Tom 0635592471. STOP arret.",
      length: "~159/160 chars",
      compliance_notes: [
        "✅ Contient le nom de l'expéditeur (Klyora Sites)",
        "✅ Contient la mention 'STOP' pour opt-out",
        "✅ Lien vers le service (maquette du prospect)",
        "✅ Téléphone direct pour contact",
        "✅ Message clairement transactionnel (pas marketing de masse)",
      ],
    },
    after_submit: [
      "Brevo va valider sous 24 à 72h ouvrées",
      "Tu recevras un email Brevo confirmant l'approbation",
      "Une fois approuvé, mes routes SMS partiront automatiquement sous 'WebConcept'",
      "Si Brevo refuse → on bascule sur OVHcloud SMS (validation instantanée, voir docs/OVH_SMS_SETUP.md)",
    ],
  });
}

export async function POST(req: NextRequest) { return GET(req); }
