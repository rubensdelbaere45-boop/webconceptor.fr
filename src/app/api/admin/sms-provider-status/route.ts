/**
 * GET /api/admin/sms-provider-status
 *
 * Renvoie l'état en temps réel des providers SMS configurés.
 * Utile pour Tom : voir d'un coup d'œil quel provider est actif et
 * si OVH est bien configuré (sans avoir à tester un envoi).
 *
 * Auth : key=ADMIN_KEY dans l'URL OU x-admin-key.
 */

import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";
import { getSmsProviderStatus } from "@/lib/sms-provider";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const queryKey = req.nextUrl.searchParams.get("key") || "";
  const headerKey = req.headers.get("x-admin-key") || "";
  if (!safeCompare(queryKey, process.env.ADMIN_SECRET_KEY) && !safeCompare(headerKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const status = getSmsProviderStatus();

  // Diagnostic Brevo : si le user vient de constater que Brevo est cassé,
  // on lui propose de désactiver complètement via SMS_DISABLED=true
  const brevo_diagnostic = {
    issue_detected: "Brevo facture 4.5 crédits/SMS et délivre 1/4. Sender custom 'WebConcept' ignoré (fallback BatiPilote forcé).",
    impact_estimé: "Sur 155 crédits restants → seulement ~34 SMS réels (au lieu de 155 attendus).",
    recommandation: "DÉSACTIVE Brevo SMS et bascule sur OVH (coût 1 crédit/SMS, sender garanti).",
  };

  const ovh_setup_guide = {
    "Étape 1 — Pack SMS (3 min)": {
      url: "https://www.ovh.com/manager/sms",
      action: "Connecte-toi OVH. Bouton 'Commander un pack SMS' → 'Pack SMS France' → 100 SMS (8€). Paie. Note le service name affiché (format sms-xxxxx-1).",
    },
    "Étape 2 — Credentials API (2 min)": {
      url: "https://eu.api.ovh.com/createToken/?GET=/sms&GET=/sms/*&POST=/sms/*/jobs",
      action: "Connecte-toi avec Account ID + mot de passe OVH. Script name: 'webconceptor-sms'. Validity: 'Unlimited'. Clique 'Request' → tu obtiens 3 clés (App Key, App Secret, Consumer Key).",
    },
    "Étape 3 — Vars Vercel (3 min)": {
      url: "https://vercel.com/dashboard (Settings > Environment Variables du projet webconceptor)",
      vars_to_add: {
        OVH_APP_KEY: "Application Key obtenue",
        OVH_APP_SECRET: "Application Secret obtenu",
        OVH_CONSUMER_KEY: "Consumer Key obtenu",
        OVH_SMS_SERVICE_NAME: "sms-xxxxx-1 (le nom de ton service)",
        OVH_SMS_SENDER: "WebConcept",
      },
    },
    "Étape 4 — Vérifier que le switch a eu lieu": {
      action: "Recharge cette page (GET /api/admin/sms-provider-status). Si active_provider devient 'ovh', le pipeline est basculé. Test : /api/admin/brevo-sms-test envoie maintenant via OVH.",
    },
  };

  return NextResponse.json({
    status,
    brevo_diagnostic,
    ovh_setup_guide,
    sms_disabled_env: process.env.SMS_DISABLED === "true",
    next_step_global: status.ovh_configured
      ? "✅ OVH configuré. Test : POST /api/admin/brevo-sms-test pour envoyer un SMS via OVH."
      : "⚠️ OVH pas encore configuré. Suis ovh_setup_guide ci-dessus. Pendant ce temps, mets SMS_DISABLED=true sur Vercel pour stopper l'hémorragie Brevo.",
  });
}

export async function POST(req: NextRequest) { return GET(req); }
