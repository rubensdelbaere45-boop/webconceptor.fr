import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp, escapeTelegram } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/modal-opened
   Endpoint PUBLIC — appelé dès qu'un visiteur ouvre le modal d'achat
   "Obtenir ce site" sur la maquette.

   Objectif : détecter les ABANDONS DE PANIER et notifier Rubens en direct
   → il sait qu'un prospect est en hésitation = HOT LEAD ULTRA chaud.

   Notif Telegram SONORE (événement critique, Rubens doit réagir vite).
   Trackable via la colonne "notes" du prospect : "[timestamp] 🛒 Modal ouvert".
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
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

export async function POST(req: NextRequest) {
  // Rate limit : 5 ouvertures/10min/IP (protection spam)
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`modal-opened:${ip}`, 5, 600);
  if (!rl.ok) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const prospect_slug = String(body.prospect_slug || "").slice(0, 100).trim();
  if (!prospect_slug) {
    return NextResponse.json({ error: "Slug manquant" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: prospect } = await supabase
    .from("prospects")
    .select("id, name, phone, email, city, notes, status")
    .eq("slug", prospect_slug)
    .maybeSingle();

  if (!prospect) {
    return NextResponse.json({ ok: true, message: "Prospect introuvable" });
  }

  // Si le prospect a déjà payé, on ignore
  if (prospect.status === "converted") {
    return NextResponse.json({ ok: true, message: "Déjà converti" });
  }

  // Log dans les notes pour tracking admin
  const noteLine = `[${parisTimestamp()}] 🛒 MODAL ACHAT OUVERT`;
  const currentNotes = typeof prospect.notes === "string" ? prospect.notes : "";
  const newNotes = currentNotes.includes(noteLine.slice(0, 22))
    ? currentNotes // déjà loggé dans la même minute, pas de double
    : (currentNotes ? `${noteLine}\n${currentNotes}` : noteLine);

  // cart_opened_at permet au cron de détecter les paniers abandonnés 1h+ plus tard
  await supabase
    .from("prospects")
    .update({
      notes: newNotes,
      cart_opened_at: new Date().toISOString(),
    })
    .eq("id", prospect.id);

  // Notif Telegram SONORE — événement critique, Rubens doit réagir
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    const mockupUrl = `https://klyora.fr/prospects/${prospect_slug}`;
    const msg =
      `🛒 <b>PANIER OUVERT — ULTRA HOT LEAD</b>\n\n` +
      `<b>${escapeTelegram(prospect.name)}</b>\n` +
      `📍 ${escapeTelegram(prospect.city || "—")}\n` +
      `📞 ${escapeTelegram(prospect.phone || "—")}\n` +
      `✉️ ${escapeTelegram(prospect.email || "—")}\n\n` +
      `⚡ Le prospect est sur l'écran de paiement en ce moment même. ` +
      `S'il ne paie pas dans les 5 min, appelle-le ou écris-lui un message personnel — ` +
      `il hésite probablement sur un détail.\n\n` +
      `<a href="${mockupUrl}">→ Voir sa maquette</a>`;

    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        // disable_notification: false → SONORE (événement critique)
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
