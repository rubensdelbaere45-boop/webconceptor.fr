import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, escapeTelegram, isWithinSendingHours } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/hot-lead-sms
   Auth : x-admin-key OU x-cron-secret

   Envoie un SMS ultra-personnalisé aux ULTRA HOT LEADS :
   prospects qui ont ouvert leur maquette 2 fois ou + SANS acheter.
   Ces gens hésitent → le SMS les pousse à décider.

   Idempotent : 1 seul SMS par prospect (colonne hot_sms_sent_at).
   Max 10 SMS par run pour protéger le budget Brevo (195 crédits restants).
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

function toMobileE164(raw: string): string | null {
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

function buildHotLeadSms(prospectName: string, mockupUrl: string): string {
  const name = gsmSafe(prospectName).slice(0, 40);
  // 160 chars max pour 1 SMS Brevo = 1 crédit
  return `Bonjour, Tom de WebConceptor. J'ai vu que vous revenez sur la maquette ${name}. Une question qui vous bloque ? Prix 320 EUR (-47%) valable 48h: ${mockupUrl}. Stop: STOP`.slice(0, 160);
}

async function sendBrevoSms(to: string, content: string): Promise<{ ok: boolean; credits?: number; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, error: "BREVO_API_KEY manquante" };
  try {
    const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: "WebConcept",
        recipient: to,
        content,
        type: "transactional",
        unicodeEnabled: false,
      }),
      signal: AbortSignal.timeout(10000),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.message || `HTTP ${res.status}` };
    return { ok: true, credits: typeof data?.remainingCredits === "number" ? data.remainingCredits : undefined };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "network error" };
  }
}

async function handler(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const adminOK = safeCompare(adminKey, process.env.ADMIN_SECRET_KEY);
  const cronOK = safeCompare(cronSecret, process.env.CRON_SECRET);
  if (!adminOK && !cronOK) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  // Couvre-feu 9h-19h (heure Paris) — pas de SMS le soir ou le matin très tôt
  if (!isWithinSendingHours(9, 19)) {
    return NextResponse.json({
      success: true,
      processed: 0,
      skipped_curfew: true,
      message: "SMS bloqués — hors plage horaire (9h-19h Paris)",
    });
  }

  const supabase = getSupabaseAdmin();
  const MAX_SMS = 10;

  // ULTRA HOT LEADS :
  //   - view_count >= 2 (ouvert au moins 2 fois la maquette)
  //   - hot_sms_sent_at IS NULL (jamais reçu de SMS hot)
  //   - phone NOT NULL
  //   - status IN ('opened', 'sent') — pas 'converted' ni 'replied'
  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, name, slug, phone, view_count, status")
    .gte("view_count", 2)
    .is("hot_sms_sent_at", null)
    .not("phone", "is", null)
    .in("status", ["opened", "sent"])
    .limit(MAX_SMS);

  if (error) {
    console.error("[hot-lead-sms] query error:", error);
    return NextResponse.json({ error: "DB query failed" }, { status: 500 });
  }

  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun hot lead" });
  }

  const results: Array<{ id: string; name: string; status: string; error?: string }> = [];
  let lastCredits: number | undefined;

  for (const p of prospects) {
    const mobile = toMobileE164(p.phone || "");
    if (!mobile) {
      await supabase
        .from("prospects")
        .update({ hot_sms_sent_at: new Date().toISOString() })
        .eq("id", p.id);
      results.push({ id: p.id, name: p.name, status: "skipped_not_mobile" });
      continue;
    }

    const mockupUrl = `https://webconceptor.fr/prospects/${p.slug}`;
    const content = buildHotLeadSms(p.name, mockupUrl);
    const sms = await sendBrevoSms(mobile, content);

    if (!sms.ok) {
      await supabase
        .from("prospects")
        .update({ hot_sms_sent_at: new Date().toISOString() })
        .eq("id", p.id);
      results.push({ id: p.id, name: p.name, status: "error", error: sms.error });
      continue;
    }

    if (typeof sms.credits === "number") lastCredits = sms.credits;

    await supabase
      .from("prospects")
      .update({ hot_sms_sent_at: new Date().toISOString() })
      .eq("id", p.id);

    results.push({ id: p.id, name: p.name, status: "sent" });
  }

  const sent = results.filter((r) => r.status === "sent").length;

  // Notif Telegram SONORE — envoi d'un SMS hot = action critique
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId && sent > 0) {
    const sentProspects = results.filter((r) => r.status === "sent").slice(0, 5);
    const list = sentProspects.map((p) => `• ${escapeTelegram(p.name)}`).join("\n");
    const msg =
      `🔥🔥 <b>SMS HOT LEAD ENVOYÉS (${sent})</b>\n\n` +
      list +
      (typeof lastCredits === "number" ? `\n\n<b>💳 Crédits SMS :</b> ${lastCredits}` : "") +
      `\n\n<i>Ces prospects ont ouvert leur maquette 2+ fois sans acheter. Le SMS les incite à se décider. S'ils répondent, tu peux converser par SMS avec eux depuis ton Brevo.</i>`;
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "HTML" }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, processed: results.length, sent, remaining_credits: lastCredits, results });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
