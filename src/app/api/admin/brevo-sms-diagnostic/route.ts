/**
 * POST /api/admin/brevo-sms-diagnostic
 *
 * Diagnostic ULTIME : envoie 3 SMS en parallèle avec 3 senders différents
 * pour identifier exactement ce que Brevo accepte ou pas.
 *
 * Tests :
 *   A) sender = "WebConcept"           (alphanumeric validé en théorie)
 *   B) sender = "Tom"                   (alphanumeric court non validé)
 *   C) sender = "36034"                 (numeric shortcode universel)
 *
 * Conclusion :
 *   - Si A,B,C tous arrivent sous "BatiPilote" → bug Brevo compte, on bascule OVH
 *   - Si A arrive WebConcept, B & C BatiPilote → validation OK, juste un timing
 *   - Si A & C OK, B BatiPilote → cohérent (B pas validé, A validé)
 *
 * ⚠️ Coût : 3 crédits SMS consommés. Lance avec parcimonie.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminGuard } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function toE164(raw: string): string | null {
  const d = String(raw || "").replace(/[^0-9+]/g, "");
  let n = d;
  if (n.startsWith("+33")) n = "0" + n.slice(3);
  else if (n.startsWith("33") && n.length === 11) n = "0" + n.slice(2);
  if (!/^0[67]\d{8}$/.test(n)) return null;
  return "+33" + n.slice(1);
}

interface SendOutcome {
  sender_sent: string;
  http_status: number;
  brevo_full_response: unknown;
  message_id?: string | null;
  reference?: string | null;
  remaining_credits?: number | null;
  total_credits_used?: number | null;
  error?: string | null;
}

async function sendOne(apiKey: string, sender: string, to: string, marker: string): Promise<SendOutcome> {
  const content = `[${marker}] Test sender "${sender}" — webconceptor.fr. STOP arret.`;
  try {
    const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        sender,
        recipient: to,
        content,
        type: "transactional",
        unicodeEnabled: false,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json().catch(() => ({}));
    return {
      sender_sent: sender,
      http_status: res.status,
      brevo_full_response: data,
      message_id: data?.messageId ?? null,
      reference: data?.reference ?? null,
      remaining_credits: typeof data?.remainingCredits === "number" ? data.remainingCredits : null,
      total_credits_used: typeof data?.usedCredits === "number" ? data.usedCredits : null,
      error: res.ok ? null : (data?.message || `HTTP ${res.status}`),
    };
  } catch (e) {
    return {
      sender_sent: sender,
      http_status: 0,
      brevo_full_response: null,
      error: e instanceof Error ? e.message : "network",
    };
  }
}

export async function POST(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 3, windowSec: 60, routeKey: "brevo-diag" });
  if (guard) return guard;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "BREVO_API_KEY manquante" }, { status: 503 });

  let body: { to?: string } = {};
  try { body = await req.json(); } catch { /* opt */ }
  const to = toE164(body.to || "0635592471");
  if (!to) return NextResponse.json({ error: "Numéro invalide" }, { status: 400 });

  // ── 3 envois en parallèle pour gagner du temps ──
  const [resultA, resultB, resultC] = await Promise.all([
    sendOne(apiKey, "WebConcept", to, "A"),
    sendOne(apiKey, "Tom",        to, "B"),
    sendOne(apiKey, "36034",      to, "C"),
  ]);

  // ── Récupère aussi le compte Brevo pour le contexte SMS ──
  let accountSmsInfo: Record<string, unknown> = {};
  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      // Trouve le plan SMS dans data.plan (array de tous les plans)
      const smsPlans = (data.plan || []).filter((p: { type: string }) => /sms/i.test(p.type));
      accountSmsInfo = {
        company: data.companyName,
        email: data.email,
        all_plans: data.plan,
        sms_plans: smsPlans,
      };
    }
  } catch (e) {
    accountSmsInfo = { error: e instanceof Error ? e.message : "network" };
  }

  // ── Diagnostic automatique ──
  const allHttpOk = [resultA, resultB, resultC].every(r => r.http_status === 201 || r.http_status === 200);

  let conclusion: string;
  let action_recommandee: string;

  if (!allHttpOk) {
    const errors = [resultA, resultB, resultC].filter(r => r.error).map(r => `${r.sender_sent}: ${r.error}`);
    conclusion = `❌ Brevo a refusé au moins un envoi par API. Erreurs : ${errors.join(" | ")}`;
    action_recommandee = "Vérifie BREVO_API_KEY et le solde SMS dans account_sms_info.";
  } else {
    conclusion = `✅ Brevo a accepté les 3 envois côté API (HTTP 201). Regarde maintenant ton téléphone et IDENTIFIE le nom de l'expéditeur de chaque SMS :
- SMS marqué [A] → tu devrais voir "WebConcept"
- SMS marqué [B] → tu devrais voir "Tom"
- SMS marqué [C] → tu devrais voir "36034" (numérique)

Si TOUS les 3 SMS arrivent sous "BatiPilote" → bug compte Brevo, validation pas effective → BASCULE OVH (action ci-dessous).
Si seulement [B] arrive sous BatiPilote → normal (Tom pas validé), MAIS [A] doit être OK.
Si [A] et [B] arrivent BatiPilote mais [C] arrive "36034" → bug spécifique sender alphanumeric → BASCULE OVH.`;
    action_recommandee = `Si BatiPilote partout → set ces 5 env vars sur Vercel : OVH_APP_KEY, OVH_APP_SECRET, OVH_CONSUMER_KEY, OVH_SMS_SERVICE_NAME, OVH_SMS_SENDER=WebConcept. Détails : /docs/OVH_SMS_SETUP.md`;
  }

  return NextResponse.json({
    conclusion,
    action_recommandee,
    recipient: to,
    test_A_alphanumeric_validé: resultA,
    test_B_alphanumeric_non_validé: resultB,
    test_C_numeric_shortcode: resultC,
    account_sms_info: accountSmsInfo,
    next_step: "Regarde ton iPhone pour les 3 SMS marqués [A] [B] [C]. Dis-moi pour CHACUN sous quel nom il arrive.",
  });
}

export async function GET(req: NextRequest) { return POST(req); }
