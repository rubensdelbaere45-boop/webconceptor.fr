import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp, escapeTelegram } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/message
   Endpoint PUBLIC — appelé depuis le modal "Demander une modification"
   de la maquette. Stocke le message dans le champ notes du prospect +
   envoie une notif Telegram SONORE à Rubens (c'est un hot lead qui écrit).
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

function parisTimestamp(): string {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`msg:${ip}`, 5, 600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Trop de messages. Réessayez dans ${rl.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const str = (v: unknown, max: number): string => String(v ?? "").slice(0, max).trim();
  const prospect_slug = str(body.prospect_slug, 100);
  const senderName = str(body.name, 80);
  const senderEmail = str(body.email, 200).toLowerCase();
  const senderPhone = str(body.phone, 30);
  const message = str(body.message, 1500);

  if (!prospect_slug || !message) {
    return NextResponse.json({ error: "Slug et message requis" }, { status: 400 });
  }
  if (message.length < 5) {
    return NextResponse.json({ error: "Votre message est trop court" }, { status: 400 });
  }
  if (!senderName || senderName.length < 2) {
    return NextResponse.json({ error: "Votre nom est requis" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: prospect } = await supabase
    .from("prospects")
    .select("id, name, notes, phone, email, city")
    .eq("slug", prospect_slug)
    .maybeSingle();

  if (!prospect) {
    return NextResponse.json({ error: "Maquette introuvable" }, { status: 404 });
  }

  // Append le message dans notes avec horodatage
  const contactLine = [senderEmail, senderPhone].filter(Boolean).join(" · ");
  const noteLine = `[${parisTimestamp()}] 💬 MESSAGE CLIENT de ${senderName}${contactLine ? ` (${contactLine})` : ""} : ${message}`;
  const existingNotes = typeof prospect.notes === "string" ? prospect.notes : "";
  const newNotes = existingNotes ? `${noteLine}\n${existingNotes}` : noteLine;

  await supabase
    .from("prospects")
    .update({ notes: newNotes })
    .eq("id", prospect.id);

  // Notif Telegram SONORE à Rubens — c'est un hot lead qui demande quelque chose
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    const mockupUrl = `https://webconceptor.fr/prospects/${prospect_slug}`;
    const tgMsg =
      `💬 <b>MESSAGE CLIENT — ${escapeTelegram(prospect.name)}</b>\n\n` +
      `<b>De :</b> ${escapeTelegram(senderName)}\n` +
      (senderEmail ? `<b>Email :</b> ${escapeTelegram(senderEmail)}\n` : "") +
      (senderPhone ? `<b>Tél :</b> ${escapeTelegram(senderPhone)}\n` : "") +
      `<b>Ville :</b> ${escapeTelegram(prospect.city || "—")}\n\n` +
      `<b>Message :</b>\n${escapeTelegram(message.slice(0, 1000))}\n\n` +
      `💡 Le prospect demande des modifications sur sa maquette — c'est un prospect ULTRA chaud, réponds-lui vite !\n\n` +
      `<a href="${mockupUrl}">→ Voir la maquette</a>`;
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: tgMsg,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        // disable_notification: false → SONORE : événement critique
      }),
    }).catch(() => { /* silent */ });
  }

  return NextResponse.json({
    success: true,
    message: "Message envoyé ! Tom vous répond dans la journée.",
  });
}
