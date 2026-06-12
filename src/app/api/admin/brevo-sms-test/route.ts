/**
 * POST /api/admin/brevo-sms-test
 *
 * Diagnostic + test SMS Brevo SANS passer par leur dashboard.
 *
 * Body : { to?: string, sender?: string }
 *   - to     : numéro destinataire (défaut : Tom 0635592471)
 *   - sender : nom expéditeur à tester (défaut : "WebConcept", max 11 chars)
 *
 * Renvoie :
 *   - account_info : solde SMS + état compte Brevo
 *   - test_send    : résultat de l'envoi (success/échec + message erreur)
 *   - diagnosis    : interprétation Tom-friendly (sender validé ou pas)
 *
 * Si Brevo refuse l'envoi parce que le sender n'est pas validé,
 * on récupère le message d'erreur EXACT. Ça t'évite de naviguer
 * dans leur UI cassée.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminGuard } from "@/lib/security";

export const dynamic = "force-dynamic";

function toMobileE164(raw: string): string | null {
  const digits = String(raw || "").replace(/[^0-9+]/g, "");
  if (!digits) return null;
  let n = digits;
  if (n.startsWith("+33")) n = "0" + n.slice(3);
  else if (n.startsWith("33") && n.length === 11) n = "0" + n.slice(2);
  if (!/^0[67]\d{8}$/.test(n)) return null;
  return "+33" + n.slice(1);
}

export async function POST(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 10, windowSec: 60, routeKey: "brevo-sms-test" });
  if (guard) return guard;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "BREVO_API_KEY manquante" }, { status: 503 });

  let body: { to?: string; sender?: string } = {};
  try { body = await req.json(); } catch { /* opt */ }

  const sender = (body.sender || "WebConcept").slice(0, 11);
  const toRaw = body.to || "0635592471";
  const to = toMobileE164(toRaw);
  if (!to) return NextResponse.json({ error: "Numéro invalide (doit être un mobile FR 06/07)" }, { status: 400 });

  // ── 1. Info compte Brevo (solde SMS) ──
  let accountInfo: Record<string, unknown> = {};
  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": apiKey, Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = await res.json();
      // On extrait seulement les infos utiles
      accountInfo = {
        email: data.email,
        company: data.companyName,
        plan: data.plan,
        credits: data.plan?.[0]?.credits || data.plan,
      };
    } else {
      accountInfo = { error: `HTTP ${res.status}` };
    }
  } catch (e) {
    accountInfo = { error: e instanceof Error ? e.message : "network" };
  }

  // ── 2. Test d'envoi SMS ──
  const testContent = `[TEST Klyora Sites] Si tu vois ce SMS arriver sous "${sender}" c'est valide. Sinon c'est BatiPilote ou bloque.`;
  let sendResult: Record<string, unknown> = {};

  try {
    const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender,
        recipient: to,
        content: testContent,
        type: "transactional",
        unicodeEnabled: false,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    const data = await res.json().catch(() => ({}));
    sendResult = {
      http_status: res.status,
      brevo_response: data,
      success: res.ok,
    };
  } catch (e) {
    sendResult = { error: e instanceof Error ? e.message : "network" };
  }

  // ── 3. Diagnostic Tom-friendly ──
  const httpOk = sendResult.success === true;
  const brevoMsg = ((sendResult.brevo_response as Record<string, unknown>)?.message || "") as string;
  const senderInvalid = /sender.*invalid|sender.*not.*valid|invalid.*sender|expéditeur.*invalide|sender.*not.*authorized|alpha.*not.*allowed|not.*registered/i.test(brevoMsg);

  let diagnosis: string;
  let next_step: string;

  if (!httpOk) {
    if (senderInvalid) {
      diagnosis = `❌ Brevo a refusé : le sender "${sender}" N'EST PAS VALIDÉ.`;
      next_step = `Va sur https://app.brevo.com/sms/senders (ou contacte le support Brevo via chat in-app pour ajouter le sender). Sinon utilise un short code temporaire en attendant.`;
    } else {
      diagnosis = `❌ Erreur Brevo : ${brevoMsg || "inconnue"}`;
      next_step = "Vérifie BREVO_API_KEY et les crédits SMS.";
    }
  } else {
    diagnosis = `✅ Brevo a accepté l'envoi. Vérifie sur ton téléphone : si l'expéditeur affiché est "${sender}", c'est bon. Si c'est "BatiPilote" ou un numéro court, alors le sender custom n'est PAS encore validé (Brevo a quand même envoyé en fallback).`;
    next_step = `Regarde ton téléphone. Si "BatiPilote" → garde SMS_DISABLED=true sur Vercel, contacte Brevo chat support pour activer "${sender}". Si "${sender}" → tu peux passer SMS_DISABLED=false sur Vercel.`;
  }

  return NextResponse.json({
    sender_tested: sender,
    recipient: to,
    account_info: accountInfo,
    test_send: sendResult,
    diagnosis,
    next_step,
    brevo_dashboard_urls: {
      sms_senders: "https://app.brevo.com/sms/senders",
      sms_settings: "https://app.brevo.com/settings/keys/api",
      account: "https://app.brevo.com/account",
      support_chat: "https://app.brevo.com/help (utilise le chat support en bas à droite)",
    },
  });
}

export async function GET(req: NextRequest) { return POST(req); }
