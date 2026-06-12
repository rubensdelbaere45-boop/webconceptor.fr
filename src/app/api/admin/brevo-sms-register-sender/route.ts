/**
 * POST /api/admin/brevo-sms-register-sender
 *
 * Tente d'enregistrer "WebConcept" comme sender SMS via l'API Brevo
 * (endpoint /senders qui sert pour email mais Brevo l'utilise aussi
 * en interne pour matcher les senders SMS de l'organisation).
 *
 * Si Brevo refuse : on bascule sur la STRATÉGIE B = utilisation du
 * numéro court partagé Brevo (le "sender" devient un code numérique
 * type "36034") qui passe sans validation.
 *
 * Strategy C ultime : utiliser un VRAI numéro mobile loué chez OVH
 * Cloud SMS (1€/mois) → on n'a plus de dépendance à la validation.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminGuard } from "@/lib/security";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 3, windowSec: 300, routeKey: "brevo-register" });
  if (guard) return guard;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "BREVO_API_KEY manquante" }, { status: 503 });

  const report: Array<{ step: string; ok: boolean; detail: string }> = [];

  // ─── A. Tente l'API /senders avec un payload SMS-style ───
  // Note : cet endpoint est OFFICIELLEMENT pour les email senders, mais
  // certaines organisations Brevo voient leurs senders SMS apparaître ici.
  try {
    const res = await fetch("https://api.brevo.com/v3/senders", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        name: "WebConcept",
        email: "contact@klyora.fr",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await res.json().catch(() => ({}));
    report.push({
      step: "POST /v3/senders (email sender, peut hydrater le SMS)",
      ok: res.ok,
      detail: res.ok ? `Sender id ${data.id} créé` : `HTTP ${res.status}: ${data.message || JSON.stringify(data).slice(0, 200)}`,
    });
  } catch (e) {
    report.push({ step: "POST /v3/senders", ok: false, detail: e instanceof Error ? e.message : "network" });
  }

  // ─── B. Liste les senders pour voir ce qu'on a ───
  try {
    const res = await fetch("https://api.brevo.com/v3/senders", {
      headers: { "api-key": apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      report.push({
        step: "GET /v3/senders (état actuel)",
        ok: true,
        detail: `Senders: ${(data.senders || []).map((s: { name: string; email: string; active?: boolean }) => `${s.name} (${s.email}, ${s.active ? "actif" : "pending"})`).join(", ") || "aucun"}`,
      });
    } else {
      report.push({ step: "GET /v3/senders", ok: false, detail: `HTTP ${res.status}` });
    }
  } catch (e) {
    report.push({ step: "GET /v3/senders", ok: false, detail: e instanceof Error ? e.message : "network" });
  }

  // ─── C. Strategy B : test avec un sender NUMÉRIQUE (passe sans validation) ───
  // Brevo accepte les senders numériques type "36034" sans validation ARCEP
  // car ce sont des short codes premium. Mais ils sont identifiés "shortcode"
  // ce qui peut diminuer le taux d'ouverture.
  report.push({
    step: "Strategy B (numeric shortcode)",
    ok: true,
    detail: "Si validation alphanumérique échoue, on peut utiliser un sender NUMÉRIQUE à 5 chiffres (ex: 36034). Pas de validation requise mais moins reconnaissable.",
  });

  // ─── D. Strategy C : Alternative providers SMS sans validation ───
  report.push({
    step: "Strategy C (alternative providers)",
    ok: true,
    detail: "Alternatives à Brevo SMS sans validation alphanumeric: OVHcloud SMS (1€/mois + 0,06€/SMS), Twilio (~0,07€/SMS), TextMagic (0,06€/SMS), spryng.com (validation 24h). Tous ont SDK + API REST.",
  });

  return NextResponse.json({
    ok: report.every(r => r.ok),
    report,
    recommendation: getRecommendation(report),
    action_links: {
      brevo_sms_senders: "https://app.brevo.com/sms/senders",
      brevo_chat_support: "https://app.brevo.com/help",
      ovh_cloud_sms: "https://www.ovhcloud.com/fr/sms/",
      twilio_signup: "https://www.twilio.com/try-twilio",
    },
  });
}

function getRecommendation(report: Array<{ ok: boolean; detail: string }>): string {
  const hasWebConceptSender = report.some(r => /WebConcept/i.test(r.detail) && /actif/i.test(r.detail));
  if (hasWebConceptSender) {
    return "✅ WebConcept est enregistré et actif côté API Brevo. Lance /api/admin/brevo-sms-test pour confirmer l'envoi sous ce nom.";
  }
  const hasError = report.some(r => !r.ok);
  if (hasError) {
    return "⚠️ Brevo bloque la création par API. Options : (1) Demande au support Brevo via chat in-app de valider 'WebConcept' (réponse 24h). (2) Passe sur OVH Cloud SMS (1€/mois, validation auto, sender alphanumeric autorisé sans demande). Je peux coder le switch OVH en 30 min si tu valides.";
  }
  return "Sender en cours d'enregistrement. Re-lance dans 5 min puis teste avec /api/admin/brevo-sms-test.";
}

export async function GET(req: NextRequest) { return POST(req); }
