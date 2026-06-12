import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════════════════════════════
   GET|POST /api/caissio/prospect/cron
   Cron quotidien — campagne prospection Caissio.
   Envoie ~25 emails par run vers les commerces de proximité.
   Auth : x-cron-secret ou Bearer (Vercel injecte automatiquement).
   ══════════════════════════════════════════════════════════════════ */

async function runCron(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || "";
  const sent = req.headers.get("x-cron-secret")
    || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "")
    || "";

  if (!safeCompare(sent, cronSecret)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const batchSize = Number(req.nextUrl.searchParams.get("batch")) || 25;
  const origin    = process.env.NEXT_PUBLIC_APP_URL || "https://klyora.fr";
  const ak        = process.env.ADMIN_SECRET_KEY || "";
  const log: string[] = [];

  log.push(`[caissio/prospect/cron] batch_size=${batchSize}`);

  let sent_count = 0;
  let errors = 0;

  try {
    const res = await fetch(`${origin}/api/caissio/prospect/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": ak },
      body: JSON.stringify({ batch_size: batchSize, dry_run: false }),
      signal: AbortSignal.timeout(100_000),
    });

    const data = await res.json().catch(() => ({})) as { sent?: number; errors?: number; message?: string };

    if (res.ok) {
      sent_count = data.sent || 0;
      errors     = data.errors || 0;
      log.push(`[send] ✓ ${sent_count} emails Caissio envoyés, ${errors} erreurs`);
      if (data.message) log.push(`[send] ℹ ${data.message}`);
    } else {
      log.push(`[send] ✗ ERREUR ${res.status}: ${JSON.stringify(data)}`);
      errors++;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    log.push(`[send] ✗ EXCEPTION: ${msg}`);
    errors++;
  }

  // ─── Telegram ─────────────────────────────────────────────────────────────
  if (sent_count > 0 || errors > 0) {
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId  = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && chatId) {
      const status = errors === 0 ? "🖥️" : "⚠️";
      fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `${status} <b>Caissio — Prospection</b>\n\n<b>Emails envoyés :</b> ${sent_count}\n<b>Erreurs :</b> ${errors}`,
          parse_mode: "HTML",
          disable_notification: true,
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: errors === 0, sent: sent_count, errors, log });
}

export async function GET(req: NextRequest)  { return runCron(req); }
export async function POST(req: NextRequest) { return runCron(req); }
