/**
 * POST /api/admin/closer-alert — Agent 3 de la Fleet
 *
 * Mission : surveiller les leads CHAUDS (qui ont opened ou modal_opened)
 * et déclencher 2 actions selon le timing :
 *
 * A) ALERTE TÉLÉGRAM IMMÉDIATE (2h après l'événement, si pas payé) :
 *    "🔥 LEAD CHAUD : [Prénom] regarde la maquette, appelle le 06…"
 *
 * B) RELANCE J+1 (24h-30h après modal_opened, si pas payé) :
 *    Email "Frais de setup OFFERTS si vous démarrez aujourd'hui"
 *    (réutilise la logique closer-opened existante)
 *
 * Détection "payé" : on regarde prospect.status (converted) ou la table orders.
 *
 * Cadence : 1×/heure, couvre-feu 8h-22h pour les alertes Telegram (Tom
 * doit pouvoir agir), 5h-19h pour les relances email.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, isWithinSendingHours, escapeTelegram, requireAdminGuard } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

interface Prospect {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  business_type: string | null;
  status: string;
  modal_opened_at: string | null;
  opened_at: string | null;
  hot_alert_sent_at: string | null;
  closer_sent_at: string | null;
  custom_hook: string | null;
}

function isParisHourBetween(start: number, end: number): boolean {
  const hourStr = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false }).format(new Date());
  const h = parseInt(hourStr, 10) % 24;
  return h >= start && h < end;
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const adminOK = safeCompare(adminKey, process.env.ADMIN_SECRET_KEY);
  const cronOK = safeCompare(cronSecret, process.env.CRON_SECRET);
  if (!adminOK && !cronOK) {
    const guard = requireAdminGuard(req, { limit: 30, windowSec: 60, routeKey: "closer-alert" });
    if (guard) return guard;
  }

  const supabase = db();
  const now = Date.now();
  const minAge2h = new Date(now - 2 * 3600 * 1000).toISOString();
  const minAge24h = new Date(now - 24 * 3600 * 1000).toISOString();
  const maxAge48h = new Date(now - 48 * 3600 * 1000).toISOString();

  // ─── A) Leads CHAUDS depuis 2-12h, jamais alertés, pas convertis ───
  const phaseA = isParisHourBetween(8, 22);  // alertes Telegram aux heures où Tom peut agir
  let telegramSent = 0;
  if (phaseA) {
    const { data: hotLeads } = await supabase
      .from("prospects")
      .select("id, name, slug, email, phone, city, business_type, status, modal_opened_at, opened_at, hot_alert_sent_at, closer_sent_at, custom_hook")
      .or(`modal_opened_at.lte.${minAge2h},opened_at.lte.${minAge2h}`)
      .is("hot_alert_sent_at", null)
      .neq("status", "converted")
      .neq("status", "error")
      .order("modal_opened_at", { ascending: false, nullsFirst: false })
      .limit(20);

    const tgToken = process.env.TELEGRAM_BOT_TOKEN, chatId = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && chatId && hotLeads && hotLeads.length > 0) {
      for (const p of hotLeads as Prospect[]) {
        const opened = p.modal_opened_at || p.opened_at;
        if (!opened) continue;
        const minutesAgo = Math.floor((now - new Date(opened).getTime()) / 60000);

        const eventType = p.modal_opened_at ? "🟠 OUVERT LE MODAL ACHAT" : "🔵 ouvert la maquette";
        const phoneDisplay = p.phone || "(pas de numéro)";

        const msg =
          `🔥 <b>LEAD CHAUD à rappeler</b>\n\n` +
          `<b>${escapeTelegram(p.name)}</b>${p.city ? ` (${escapeTelegram(p.city)})` : ""}\n` +
          `Métier : ${escapeTelegram(p.business_type || "?")}\n` +
          `Status : ${eventType}\n` +
          `Il y a : <b>${minutesAgo} min</b>\n\n` +
          `📞 <b><a href="tel:${phoneDisplay}">Appelle : ${escapeTelegram(phoneDisplay)}</a></b>\n` +
          `📱 <a href="https://webconceptor.fr/prospects/${p.slug}">Voir sa maquette</a>\n\n` +
          (p.custom_hook ? `<i>Accroche : ${escapeTelegram(p.custom_hook)}</i>` : "");

        try {
          await fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "HTML", disable_web_page_preview: true }),
          });
          telegramSent++;
          await supabase.from("prospects").update({ hot_alert_sent_at: new Date().toISOString() }).eq("id", p.id);
        } catch { /* skip et continue */ }
      }
    }
  }

  // ─── B) Relances J+1 (24h-48h après opened/modal_opened, jamais relancé) ───
  let relanceSent = 0;
  if (isWithinSendingHours(5, 19)) {
    const { data: stale } = await supabase
      .from("prospects")
      .select("id, name, slug, email, phone, city, business_type, status, modal_opened_at, opened_at, closer_sent_at")
      .or(`modal_opened_at.gte.${maxAge48h},opened_at.gte.${maxAge48h}`)
      .or(`modal_opened_at.lte.${minAge24h},opened_at.lte.${minAge24h}`)
      .is("closer_sent_at", null)
      .neq("status", "converted")
      .not("email", "is", null)
      .limit(30);

    // Délègue au endpoint closer-opened pour le contenu de l'email
    if (stale && stale.length > 0) {
      try {
        const res = await fetch(`${req.nextUrl.origin}/api/prospect/closer-opened`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-key": process.env.ADMIN_SECRET_KEY || "" },
        });
        const data = await res.json().catch(() => ({}));
        relanceSent = data.sent || 0;
      } catch { /* silent */ }
    }
  }

  return NextResponse.json({
    success: true,
    phase_A_telegram_sent: telegramSent,
    phase_B_relance_sent: relanceSent,
  });
}

export async function GET(req: NextRequest) { return POST(req); }
