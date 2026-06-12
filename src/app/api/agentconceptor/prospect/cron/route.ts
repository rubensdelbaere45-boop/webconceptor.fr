import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   GET|POST /api/agentconceptor/prospect/cron

   Cron quotidien AGENTConceptor.
   Lance l'envoi d'emails froids vers les
   entreprises de la base prospects.

   8h et 14h, lun–ven (via Vercel crons).
   Auth : x-cron-secret ou x-admin-key.
   ══════════════════════════════════════════ */

async function runCron(req: NextRequest) {
  const cronSecret = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const adminKey   = req.headers.get("x-admin-key") || "";
  const cronOK     = safeCompare(cronSecret, process.env.CRON_SECRET);
  const adminOK    = safeCompare(adminKey, process.env.ADMIN_SECRET_KEY);

  if (!cronOK && !adminOK) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const batchSize = Number(req.nextUrl.searchParams.get("batch")) || 10;
  const origin    = process.env.NEXT_PUBLIC_APP_URL || "https://klyora.fr";
  const ak        = process.env.ADMIN_SECRET_KEY || "";

  const log: string[] = [];
  let sent = 0;
  let errors = 0;

  log.push(`[agentconceptor/prospect/cron] batch_size=${batchSize}`);

  try {
    const res = await fetch(`${origin}/api/agentconceptor/prospect/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": ak,
      },
      body: JSON.stringify({ batch_size: batchSize, dry_run: false }),
      signal: AbortSignal.timeout(100_000),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      sent   = data.sent   || 0;
      errors = data.errors || 0;
      log.push(`[send] ${sent} emails AGENTConceptor envoyés, ${errors} erreurs`);
    } else {
      log.push(`[send] ERREUR: ${data.error || res.status}`);
      errors++;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    log.push(`[send] EXCEPTION: ${msg}`);
    errors++;
  }

  // Telegram recap
  if (sent > 0) {
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId  = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && chatId) {
      const status = errors === 0 ? "✅" : "⚠️";
      fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `${status} <b>AGENTConceptor — Prospection</b>\n\n<b>Emails envoyés :</b> ${sent}\n<b>Erreurs :</b> ${errors}`,
          parse_mode: "HTML",
          disable_notification: true,
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: errors === 0, sent, errors, log });
}

export async function GET(req: NextRequest) { return runCron(req); }
export async function POST(req: NextRequest) { return runCron(req); }
