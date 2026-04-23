import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/admin/test-sms
   Auth : x-admin-key

   Envoie un SMS test via Brevo pour vérifier la chaîne de délivrabilité
   (crédits + signature + numéro accepté + réception).

   Body / query params :
     to       — numéro destinataire (E.164 ou 06/07)
     content  — message à envoyer (défaut : ping WebConceptor)

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

async function handler(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const url = new URL(req.url);
  let to = url.searchParams.get("to") || "";
  let content = url.searchParams.get("content") || "Test WebConceptor — SMS de verification infra. Si vous recevez ceci, tout marche.";

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

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "BREVO_API_KEY manquante côté serveur" }, { status: 500 });

  try {
    const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: "WebConcept",
        recipient: e164,
        content: gsmSafe(content).slice(0, 160),
        type: "transactional",
        unicodeEnabled: false,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json({
        success: false,
        error: data?.message || `HTTP ${res.status}`,
        httpStatus: res.status,
        detail: data,
      }, { status: 502 });
    }
    return NextResponse.json({
      success: true,
      to: e164,
      content: gsmSafe(content).slice(0, 160),
      remaining_credits: typeof data?.remainingCredits === "number" ? data.remainingCredits : undefined,
      brevo: data,
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "network error",
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
