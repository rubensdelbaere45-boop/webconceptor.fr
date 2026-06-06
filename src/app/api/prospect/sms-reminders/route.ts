import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, escapeTelegram, isWithinSendingHours } from "@/lib/security";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

/* ══════════════════════════════════════════
   GET|POST /api/prospect/sms-reminders
   Auth : x-admin-key OU x-cron-secret
   Envoie un SMS de relance gentille aux prospects qui ont OUVERT leur
   maquette il y a au moins 2 jours mais n'ont pas répondu / pas payé.
   Idempotent : une seule relance par prospect (colonne sms_reminder_sent_at).
   ══════════════════════════════════════════ */

// Convertit un numéro FR vers +33XXXXXXXXX. Retourne null si invalide ou non-mobile.
// Brevo SMS marche surtout avec les mobiles (06/07), les fixes (01-05, 08, 09)
// peuvent être acceptés mais ne reçoivent pas de SMS → on skip.
function toMobileE164(raw: string): string | null {
  const digits = String(raw || "").replace(/[^0-9+]/g, "");
  if (!digits) return null;
  let normalized = digits;
  if (normalized.startsWith("+33")) normalized = "0" + normalized.slice(3);
  else if (normalized.startsWith("33") && normalized.length === 11) normalized = "0" + normalized.slice(2);
  if (!/^0[67]\d{8}$/.test(normalized)) return null; // seulement mobiles 06/07
  return "+33" + normalized.slice(1);
}

// Retire accents + caractères non-ASCII pour rester en encodage GSM-7 (160 chars/segment)
function gsmSafe(s: string): string {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E\n\r]/g, "");
}

function buildSmsContent(prospectName: string, mockupUrl: string): string {
  const name = gsmSafe(prospectName).slice(0, 30);
  return `Bonjour, votre maquette ${name} est toujours disponible et 100% personnalisable : ${mockupUrl}. Tom - WebConceptor. STOP pour arreter.`;
}

// ─── SMS via cascade OVHcloud → Brevo (voir src/lib/sms-provider.ts) ───
// Si OVH_* configurées → OVH (sender custom validé), sinon → Brevo.
import { sendSms as cascadeSendSms } from "@/lib/sms-provider";

async function sendBrevoSms(to: string, content: string): Promise<{ ok: boolean; credits?: number; error?: string; provider?: string }> {
  const r = await cascadeSendSms({ to, content });
  return { ok: r.ok, credits: r.credits_remaining, error: r.error, provider: r.provider };
}

// KILL SWITCH SMS — défaut DÉSACTIVÉ tant qu'OVH n'est pas configuré.
// Brevo est cassé pour notre cas (test prod 2026-06-06 : 4.5 crédits/SMS,
// 1/4 délivrés, sender custom ignoré). On bloque les envois jusqu'à
// ce qu'OVH soit en place (voir /admin/sms-provider-status).
// Si OVH configuré → envois automatiques actifs via cascade sms-provider.
import { getSmsProviderStatus as getSmsStatus } from "@/lib/sms-provider";
const SMS_DISABLED = !getSmsStatus().ovh_configured;

async function handler(req: NextRequest) {
  // Auth : accepte admin-key OU cron-secret
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const adminOK = safeCompare(adminKey, process.env.ADMIN_SECRET_KEY);
  const cronOK = safeCompare(cronSecret, process.env.CRON_SECRET);
  if (!adminOK && !cronOK) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  if (SMS_DISABLED) {
    return NextResponse.json({
      success: true,
      processed: 0,
      sent: 0,
      message: "SMS temporairement désactivés — en attente validation sender ARCEP",
    });
  }

  // COUVRE-FEU : pas de SMS entre 19h et 9h (heure Paris)
  if (!isWithinSendingHours(9, 19)) {
    return NextResponse.json({
      success: true,
      processed: 0,
      skipped_curfew: true,
      message: "SMS bloqués — hors plage horaire (9h-19h heure Paris)",
    });
  }

  const supabase = getSupabaseAdmin();

  // Ceil max 30 SMS par run pour protéger les crédits (et éviter spam)
  const MAX_SMS_PER_RUN = 30;

  // opened_at >= il y a 20h ET <= il y a 32h (~ J+1)
  // → Tom veut un SMS le LENDEMAIN de l'ouverture de la maquette,
  //   pas 2 jours après. Fenêtre 20-32h pour attraper aussi ceux
  //   manqués si le cron ne tourne pas exactement à H+24.
  const now = Date.now();
  const minAge = new Date(now - 20 * 60 * 60 * 1000).toISOString(); // ≤ 20h
  const maxAge = new Date(now - 32 * 60 * 60 * 1000).toISOString(); // ≥ 32h

  // Prospects éligibles :
  // - opened_at IS NOT NULL (il a ouvert la maquette)
  // - opened_at entre J-32h et J-20h (≈ lendemain)
  // - sms_reminder_sent_at IS NULL (jamais relancé)
  // - phone IS NOT NULL
  // - status IN ('opened', 'sent')  — pas 'converted' (déjà payé) ni 'replied' (déjà répondu)
  const { data: prospects, error: findErr } = await supabase
    .from("prospects")
    .select("id, name, slug, phone, email, city, opened_at, status")
    .not("opened_at", "is", null)
    .is("sms_reminder_sent_at", null)
    .not("phone", "is", null)
    .in("status", ["opened", "sent"])
    .lte("opened_at", minAge)
    .gte("opened_at", maxAge)
    .limit(MAX_SMS_PER_RUN);

  if (findErr) {
    console.error("[sms-reminders] query error:", findErr);
    return NextResponse.json({ error: "Impossible de charger les prospects" }, { status: 500 });
  }

  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucune relance nécessaire" });
  }

  const results: Array<{ id: string; name: string; status: string; error?: string; phone?: string }> = [];
  let lastCredits: number | undefined;

  for (const p of prospects) {
    const mobile = toMobileE164(p.phone || "");
    if (!mobile) {
      // Marque comme "tenté" pour ne pas réessayer en boucle
      await supabase
        .from("prospects")
        .update({ sms_reminder_sent_at: new Date().toISOString() })
        .eq("id", p.id);
      results.push({ id: p.id, name: p.name, status: "skipped_not_mobile", phone: p.phone || "" });
      continue;
    }

    const mockupUrl = `https://webconceptor.fr/prospects/${p.slug}`;
    const content = buildSmsContent(p.name, mockupUrl);

    const sms = await sendBrevoSms(mobile, content);
    if (!sms.ok) {
      // Marque aussi comme tenté → pas de retry infini
      await supabase
        .from("prospects")
        .update({ sms_reminder_sent_at: new Date().toISOString() })
        .eq("id", p.id);
      results.push({ id: p.id, name: p.name, status: "error", error: sms.error, phone: mobile });
      continue;
    }

    if (typeof sms.credits === "number") lastCredits = sms.credits;

    await supabase
      .from("prospects")
      .update({ sms_reminder_sent_at: new Date().toISOString() })
      .eq("id", p.id);

    results.push({ id: p.id, name: p.name, status: "sent", phone: mobile });
  }

  // Notif Telegram de synthèse
  const sent = results.filter((r) => r.status === "sent").length;
  const errors = results.filter((r) => r.status === "error");
  const skipped = results.filter((r) => r.status === "skipped_not_mobile").length;

  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId && results.length > 0) {
    const msg =
      `📱 <b>SMS de relance envoyés</b>\n\n` +
      `<b>Envoyés :</b> ${sent}\n` +
      `<b>Non mobile :</b> ${skipped}\n` +
      `<b>Erreurs :</b> ${errors.length}\n` +
      (typeof lastCredits === "number" ? `<b>Crédits restants :</b> ${lastCredits}\n` : "") +
      (errors.length > 0
        ? `\n<b>Détails erreurs :</b>\n${errors
            .slice(0, 3)
            .map((e) => `• ${escapeTelegram(e.name)} : ${escapeTelegram(e.error || "?")}`)
            .join("\n")}`
        : "");
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        disable_notification: true,
      }),
    }).catch(() => { /* silent */ });
  }

  return NextResponse.json({
    success: true,
    processed: results.length,
    sent,
    skipped,
    errors: errors.length,
    remaining_credits: lastCredits,
    results,
  });
}

export async function GET(req: NextRequest) {
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
