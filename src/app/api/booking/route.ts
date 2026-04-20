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

  // Load prospect to link + get restaurant name/contact
  const supabase = getSupabaseAdmin();
  const { data: prospect, error: findErr } = await supabase
    .from("prospects")
    .select("id, name, email, city")
    .eq("slug", prospect_slug)
    .maybeSingle();

  if (findErr || !prospect) {
    return NextResponse.json({ error: "Restaurant introuvable" }, { status: 404 });
  }

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

  // Notify Telegram (admin)
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    const mockupUrl = `https://webconceptor.fr/prospects/${prospect_slug}`;
    const msg =
      `🍽️ <b>Nouvelle réservation !</b>\n\n` +
      `<b>Restaurant :</b> ${escapeTelegram(prospect.name)}\n` +
      `<b>Client :</b> ${escapeTelegram(customer_name)}\n` +
      `<b>Email :</b> ${escapeTelegram(customer_email)}\n` +
      `<b>Téléphone :</b> ${escapeTelegram(customer_phone)}\n\n` +
      `<b>📅 Date :</b> ${escapeTelegram(booking_date)}\n` +
      `<b>🕐 Heure :</b> ${escapeTelegram(booking_time)}\n` +
      `<b>👥 Convives :</b> ${guests}\n` +
      (notes ? `\n<b>Note :</b> ${escapeTelegram(notes.slice(0, 200))}\n` : "") +
      `\n<a href="${mockupUrl}">Voir la maquette du restaurant</a>`;

    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    }).catch(() => { /* silent */ });
  }

  return NextResponse.json({
    success: true,
    booking_id: booking.id,
    message: "Réservation enregistrée. Le restaurant vous contactera pour confirmer.",
  });
}
