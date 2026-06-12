import { NextRequest, NextResponse } from "next/server";
import { requireAdminGuard } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/admin/test-sms
   Auth : x-admin-key

   Envoie un SMS test via Brevo pour vérifier la chaîne de délivrabilité
   (crédits + signature + numéro accepté + réception).

   Body / query params :
     to       — numéro destinataire (E.164 ou 06/07)
     content  — message à envoyer (défaut : ping Klyora Sites)

   Ne s'enregistre nulle part, n'écrit pas en DB. Strictement test.
   ══════════════════════════════════════════ */

function toE164(raw: string): string | null {
  const digits = String(raw || "").replace(/[^0-9+]/g, "");
  if (!digits) return null;
  let normalized = digits;
  if (normalized.startsWith("+33")) normalized = "0" + normalized.slice(3);
  else if (normalized.startsWith("33") && normalized.length === 11) normalized = "0" + normalized.slice(2);
  if (!/^0[67]\d{8}$/.test(normalized)) return null;
  return "+33" + normalized.slice(1);
}

function gsmSafe(s: string): string {
  return String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E\n\r]/g, "");
}

// KILL SWITCH SMS — contrôlable via env (cohérent avec autres routes SMS)
const SMS_DISABLED = process.env.SMS_DISABLED === "true";

async function handler(req: NextRequest) {
  // Auth + rate-limit : max 10 tests SMS / min (évite gaspillage crédits)
  const guard = requireAdminGuard(req, { limit: 10, windowSec: 60, routeKey: "test-sms" });
  if (guard) return guard;

  if (SMS_DISABLED) {
    return NextResponse.json({
      success: false,
      disabled: true,
      message: "SMS temporairement désactivés (kill switch) — remettre SMS_DISABLED=false après validation sender ARCEP",
    });
  }

  const url = new URL(req.url);
  let to = url.searchParams.get("to") || "";
  let content = url.searchParams.get("content") || "Test Klyora Sites — SMS de verification infra. Si vous recevez ceci, tout marche.";

  // Aussi accepter le body JSON si présent
  try {
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      const body = await req.json();
      if (typeof body?.to === "string") to = body.to;
      if (typeof body?.content === "string") content = body.content;
    }
  } catch { /* ignore */ }

  const e164 = toE164(to);
  if (!e164) return NextResponse.json({ error: "Numéro invalide, attendu format 06XX ou +336XX (mobile uniquement)" }, { status: 400 });

  // Cascade OVHcloud → Brevo (voir src/lib/sms-provider.ts)
  const { sendSms, getSmsProviderStatus } = await import("@/lib/sms-provider");
  const safeContent = gsmSafe(content).slice(0, 160);
  const r = await sendSms({ to: e164, content: safeContent });
  if (!r.ok) {
    return NextResponse.json({
      success: false,
      provider_used: r.provider,
      error: r.error,
      provider_status: getSmsProviderStatus(),
    }, { status: 502 });
  }
  return NextResponse.json({
      success: true,
      provider_used: r.provider,
      sender_used: r.sender_used,
      to: e164,
      content: safeContent,
      remaining_credits: r.credits_remaining,
  });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
