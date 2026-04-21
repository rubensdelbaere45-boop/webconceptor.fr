import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp, escapeTelegram } from "@/lib/security";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

/* ══════════════════════════════════════════
   POST /api/booking
   Reçoit une réservation depuis une maquette restaurant.
   Sauve + notifie Telegram. Pas d'admin key : endpoint public
   protégé par rate-limiting + validation stricte.
   ══════════════════════════════════════════ */

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
const PHONE_RE = /^[+0-9\s().-]{6,20}$/;
const TIME_RE = /^([01]?\d|2[0-3]):[0-5]\d$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function trim(s: unknown, max: number): string {
  return String(s ?? "").slice(0, max).trim();
}

export async function POST(req: NextRequest) {
  // Rate limit : 10 réservations / 10 min / IP
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`booking:${ip}`, 10, 600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Trop de tentatives. Reessayez dans ${rl.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requete invalide" }, { status: 400 });
  }

  // Validation
  const prospect_slug = trim(body.prospect_slug, 100);
  const customer_name = trim(body.customer_name, 80);
  const customer_email = trim(body.customer_email, 120).toLowerCase();
  const customer_phone = trim(body.customer_phone, 20);
  const booking_date = trim(body.booking_date, 10);
  const booking_time = trim(body.booking_time, 5);
  const guests = typeof body.guests === "number" ? Math.floor(body.guests) : parseInt(String(body.guests), 10);
  const notes = trim(body.notes, 400);

  if (!prospect_slug) return NextResponse.json({ error: "Restaurant manquant" }, { status: 400 });
  if (customer_name.length < 2) return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
  if (!EMAIL_RE.test(customer_email)) return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  if (!PHONE_RE.test(customer_phone)) return NextResponse.json({ error: "Téléphone invalide" }, { status: 400 });
  if (!DATE_RE.test(booking_date)) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  if (!TIME_RE.test(booking_time)) return NextResponse.json({ error: "Heure invalide" }, { status: 400 });
  if (!Number.isFinite(guests) || guests < 1 || guests > 20) {
    return NextResponse.json({ error: "Nombre de convives invalide" }, { status: 400 });
  }

  // Date must be today or future
  const todayIso = new Date().toISOString().slice(0, 10);
  if (booking_date < todayIso) {
    return NextResponse.json({ error: "La date doit être dans le futur" }, { status: 400 });
  }

  // Load prospect to link + get restaurant name/contact + demo SMS counter
  const supabase = getSupabaseAdmin();
  const { data: prospect, error: findErr } = await supabase
    .from("prospects")
    .select("id, name, email, city, demo_sms_count")
    .eq("slug", prospect_slug)
    .maybeSingle();

  if (findErr || !prospect) {
    return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
  }

  // PROTECTION BUDGET BREVO : max 2 SMS de démo par prospect
  // (Brevo = 195 crédits SMS restants, cap à 2 par resto = ~97 prospects testeurs possibles).
  // Le 1er SMS prouve que ça marche, le 2e permet de tester un autre créneau — suffisant.
  const DEMO_SMS_MAX = 2;
  const currentCount = Number(prospect.demo_sms_count || 0);
  const smsQuotaReached = currentCount >= DEMO_SMS_MAX;

  // Insert booking
  const { data: booking, error: insertErr } = await supabase
    .from("bookings")
    .insert({
      prospect_id: prospect.id,
      prospect_slug,
      prospect_name: prospect.name,
      customer_name,
      customer_email,
      customer_phone,
      booking_date,
      booking_time,
      guests,
      notes: notes || null,
      status: "pending",
    })
    .select()
    .single();

  if (insertErr) {
    console.error("[booking] insert error:", insertErr);
    return NextResponse.json({ error: "Impossible d'enregistrer la reservation" }, { status: 500 });
  }

  /* ═══════════════════════════════════════════════════
     Mode démo : on envoie un VRAI SMS au numéro entré
     → le prospect teste sa propre maquette, voit que
     le système fonctionne avec SON téléphone = preuve
     concrète qui augmente énormément la conversion.
     ═══════════════════════════════════════════════════ */

  const normalizedPhone = normalizeFrenchPhone(customer_phone);
  let smsStatus: "sent" | "failed" | "skipped" | "quota_reached" = "skipped";

  if (smsQuotaReached) {
    smsStatus = "quota_reached";
  } else if (normalizedPhone && process.env.BREVO_API_KEY) {
    const prettyDate = formatFrenchDate(booking_date);
    // SMS limite 160 chars unicode / 306 chars ascii — on reste sous 160 pour rester en 1 SMS (1 crédit Brevo)
    const smsContent =
      `Bonjour ${customer_name.split(" ")[0].slice(0, 20)}, votre reservation chez ${prospect.name.slice(0, 40)} est confirmee le ${prettyDate} a ${booking_time} pour ${guests} pers. A bientot !`.slice(0, 159);

    try {
      const smsRes = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
        method: "POST",
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
          "accept": "application/json",
        },
        body: JSON.stringify({
          type: "transactional",
          unicodeEnabled: false,
          sender: "WebConcept", // 11 chars max alphanumeric
          recipient: normalizedPhone,
          content: smsContent,
        }),
      });
      smsStatus = smsRes.ok ? "sent" : "failed";

      // Incrémente le compteur UNIQUEMENT si le SMS est parti (pas en cas de failed Brevo)
      if (smsStatus === "sent") {
        await supabase
          .from("prospects")
          .update({ demo_sms_count: currentCount + 1 })
          .eq("id", prospect.id);
      }
    } catch {
      smsStatus = "failed";
    }
  }

  /* ═══════════════════════════════════════════════════
     Notif Telegram SILENCIEUSE à Rubens — signal fort
     qu'un prospect teste sa maquette = ultra engagé.
     (Pas de son pour ne pas spammer la nuit.)
     ═══════════════════════════════════════════════════ */
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    const mockupUrl = `https://webconceptor.fr/prospects/${prospect_slug}`;
    const msg =
      `🧪 <b>DÉMO TESTÉE — prospect ultra chaud</b>\n\n` +
      `<b>🍽 Restaurant :</b> ${escapeTelegram(prospect.name)}\n` +
      `<b>📍 Ville :</b> ${escapeTelegram(prospect.city || "—")}\n\n` +
      `<b>Test effectué par :</b>\n` +
      `• Nom : ${escapeTelegram(customer_name)}\n` +
      `• Email : ${escapeTelegram(customer_email)}\n` +
      `• Téléphone : ${escapeTelegram(customer_phone)}\n\n` +
      `<b>📅 Date :</b> ${escapeTelegram(booking_date)} à ${escapeTelegram(booking_time)}\n` +
      `<b>👥 Convives :</b> ${guests}\n` +
      (notes ? `<b>📝 Note :</b> ${escapeTelegram(notes.slice(0, 200))}\n` : "") +
      `<b>📲 SMS envoyé :</b> ${
        smsStatus === "sent" ? `✅ OUI (${currentCount + 1}/${DEMO_SMS_MAX})` :
        smsStatus === "quota_reached" ? `🔒 QUOTA (${currentCount}/${DEMO_SMS_MAX} atteint)` :
        smsStatus === "failed" ? "❌ KO" : "—"
      }\n\n` +
      `💡 Le prospect vient de tester le module résa sur sa propre maquette — c'est LE moment de le rappeler dans l'heure pour closer.\n\n` +
      `<a href="${mockupUrl}">→ Voir sa maquette</a>`;

    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        disable_notification: true, // silencieux (pas de son)
      }),
    }).catch(() => { });
  }

  const message =
    smsStatus === "sent"
      ? `Réservation confirmée — vous recevez le SMS de confirmation dans quelques secondes. (${currentCount + 1}/${DEMO_SMS_MAX} SMS de démo utilisés)`
      : smsStatus === "quota_reached"
      ? `Réservation enregistrée, mais vous avez déjà utilisé les ${DEMO_SMS_MAX} SMS de démonstration disponibles pour cet établissement. Contactez-nous si vous souhaitez tester à nouveau : contact@webconceptor.fr`
      : smsStatus === "failed"
      ? "Réservation enregistrée, mais nous n'avons pas pu envoyer le SMS de confirmation. Vérifiez que votre numéro est au format français."
      : "Réservation enregistrée.";

  return NextResponse.json({
    success: true,
    booking_id: booking.id,
    sms_status: smsStatus,
    sms_remaining: Math.max(0, DEMO_SMS_MAX - (smsStatus === "sent" ? currentCount + 1 : currentCount)),
    message,
  });
}

/* ═══════════════════════════════════════════════════
   Utils
   ═══════════════════════════════════════════════════ */

// Normalise un numéro français en E.164 (+33...). Retourne null si invalide.
function normalizeFrenchPhone(raw: string): string | null {
  const digits = raw.replace(/[^\d+]/g, "");
  if (/^\+33[1-9]\d{8}$/.test(digits)) return digits;
  if (/^33[1-9]\d{8}$/.test(digits)) return "+" + digits;
  if (/^0[1-9]\d{8}$/.test(digits)) return "+33" + digits.slice(1);
  return null;
}

function formatFrenchDate(iso: string): string {
  // "2026-04-22" → "22/04"
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}
