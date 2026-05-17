import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/demo-booking
   PUBLIC — appelé depuis la maquette quand un visiteur remplit
   le formulaire de réservation démo.

   ➡ Envoie un SMS au téléphone du prospect (le patron du commerce)
     depuis "WebConceptor" pour démontrer la feature en temps réel.
   ➡ Notifie Rubens sur Telegram.

   Body :
   {
     slug: string,                // identifie le prospect
     guest_name: string,          // nom du client fictif
     guest_phone?: string,        // téléphone du client (optionnel)
     guests: number,              // nombre de couverts
     date: string,                // "2026-05-20"
     time: string,                // "20:00"
     message?: string             // message optionnel
   }
   ══════════════════════════════════════════ */

const RESTAURANT_TYPES = new Set([
  "restaurant", "brasserie", "bistrot", "gastronomique", "pizzeria",
  "creperie", "food_truck", "bar", "cafe", "glacier", "boulangerie",
  "patisserie", "traiteur", "sushi", "kebab", "burger",
]);

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

function formatFrenchPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("33")) return "+" + digits;
  if (digits.startsWith("0")) return "+33" + digits.slice(1);
  if (digits.length === 9) return "+33" + digits;
  return "+" + digits;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  } catch {
    return dateStr;
  }
}

function buildSmsText(guestName: string, guests: number, date: string, time: string, businessName: string): string {
  const dateLabel = formatDate(date);
  const guestsLabel = guests === 1 ? "1 personne" : `${guests} personnes`;
  return `🍽 Nouvelle réservation !\n${guestName} — ${guestsLabel}\n${dateLabel} à ${time}\n\nVia votre site web — WebConceptor`;
}

export async function POST(req: NextRequest) {
  // Rate limit : 3 démos / 10 min / IP (anti-abus)
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`demo-booking:${ip}`, 3, 600);
  if (!rl.ok) {
    return NextResponse.json({ error: "Trop de tentatives" }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const slug       = String(body.slug || "").slice(0, 100).trim();
  const guestName  = String(body.guest_name || "").slice(0, 60).trim() || "Un client";
  const guests     = Math.min(20, Math.max(1, Number(body.guests) || 2));
  const date       = String(body.date || "").slice(0, 20).trim();
  const time       = String(body.time || "").slice(0, 10).trim() || "20h00";
  const message    = String(body.message || "").slice(0, 200).trim();

  if (!slug) return NextResponse.json({ error: "Maquette non identifiée" }, { status: 400 });
  if (!date) return NextResponse.json({ error: "Date requise" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data: prospect } = await supabase
    .from("prospects")
    .select("id, name, slug, phone, business_type, city")
    .eq("slug", slug)
    .maybeSingle();

  if (!prospect) {
    return NextResponse.json({ error: "Maquette introuvable" }, { status: 404 });
  }

  const businessType = prospect.business_type || "restaurant";
  const isFood = RESTAURANT_TYPES.has(businessType);

  // ─── SMS au patron du commerce ──────────────────────────────────────────
  let smsSent = false;
  const prospectPhone = prospect.phone;

  if (prospectPhone) {
    const formattedPhone = formatFrenchPhone(prospectPhone);
    const smsText = isFood
      ? buildSmsText(guestName, guests, date, time, prospect.name)
      : `📋 Nouvelle demande de ${guestName} (${guests} pers.) le ${formatDate(date)} à ${time}.\n\nVia votre site web — WebConceptor`;

    const brevoKey = process.env.BREVO_API_KEY;
    if (brevoKey) {
      try {
        const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
          method: "POST",
          headers: { "api-key": brevoKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: "WebConceptor",
            recipient: formattedPhone,
            content: smsText,
            type: "transactional",
          }),
          signal: AbortSignal.timeout(8000),
        });
        smsSent = res.ok;
      } catch { /* silent */ }
    }
  }

  // ─── Notification Telegram à Rubens ─────────────────────────────────────
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId  = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId) {
    const emoji = smsSent ? "✅" : "⚠️";
    const msg =
      `🎯 <b>DÉMO RÉSERVATION — ${prospect.name}</b>\n\n` +
      `<b>Client :</b> ${guestName}${guests > 1 ? ` (${guests} pers.)` : ""}\n` +
      `<b>Date :</b> ${formatDate(date)} à ${time}\n` +
      (message ? `<b>Message :</b> ${message}\n` : "") +
      `\n${emoji} SMS envoyé au patron : ${smsSent ? prospectPhone : "❌ pas de téléphone"}\n\n` +
      `💡 <i>Le patron vient de recevoir une notif sur son téléphone — il sait maintenant que ça marche !</i>`;

    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "HTML" }),
    }).catch(() => {});
  }

  // ─── Log en DB ──────────────────────────────────────────────────────────
  await supabase
    .from("prospects")
    .update({
      notes: `Démo réservation par ${guestName} le ${date} à ${time} — SMS ${smsSent ? "envoyé" : "échec"} — ${new Date().toISOString()}`,
    })
    .eq("id", prospect.id);

  return NextResponse.json({
    success: true,
    sms_sent: smsSent,
    message: smsSent
      ? `SMS envoyé à ${prospect.name} — ils voient la notification maintenant !`
      : `Réservation enregistrée`,
  });
}
