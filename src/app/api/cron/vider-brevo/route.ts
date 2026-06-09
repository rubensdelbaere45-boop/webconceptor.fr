/**
 * GET /api/cron/vider-brevo
 *
 * Cron Vercel — lance les 3 routes outbound LOURDES en parallèle.
 * Conçu pour tourner toutes les 4h jusqu'au 17/06/2026, pour vider
 * le quota Brevo (17 144 emails restants).
 *
 * Auth :
 *   - Header Vercel automatique: Authorization: Bearer $CRON_SECRET
 *   - OU x-admin-key (pour test manuel)
 *
 * Métrique : émet une notif Telegram avec le récap des 3 routes appelées.
 */
import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ORIGIN = "https://webconceptor.fr";
const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || "";
const CRON_SECRET = process.env.CRON_SECRET || "";

// 3 routes lourdes qui captent 90% du volume
const HEAVY_ROUTES = [
  { name: "blast-flash", path: "/api/prospect/blast-flash" },
  { name: "final-push",  path: "/api/prospect/final-push" },
  { name: "follow-up",   path: "/api/prospect/follow-up" },
];

function isAuthorized(req: NextRequest): boolean {
  // Vercel Cron envoie Authorization: Bearer <CRON_SECRET>
  const auth = req.headers.get("authorization") || "";
  const cronOk = auth.startsWith("Bearer ") && safeCompare(auth.slice(7), CRON_SECRET);
  const adminOk = safeCompare(req.headers.get("x-admin-key") || "", ADMIN_KEY);
  return cronOk || adminOk;
}

async function callRoute(route: typeof HEAVY_ROUTES[number]) {
  const t0 = Date.now();
  try {
    const res = await fetch(`${ORIGIN}${route.path}?force=true`, {
      method: "POST",
      headers: { "x-admin-key": ADMIN_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(280_000),
    });
    const data = await res.json().catch(() => ({}));
    return {
      name: route.name,
      ok: res.ok,
      sent: data.sent ?? data.emails_sent ?? data.successful_sends ?? 0,
      processed: data.processed ?? 0,
      errors: data.errors ?? data.failed ?? 0,
      duration_ms: Date.now() - t0,
    };
  } catch (e) {
    return {
      name: route.name,
      ok: false,
      sent: 0,
      processed: 0,
      errors: 0,
      duration_ms: Date.now() - t0,
      error: e instanceof Error ? e.message : "network",
    };
  }
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const tStart = Date.now();
  const results = await Promise.all(HEAVY_ROUTES.map(callRoute));

  const totalSent = results.reduce((s, r) => s + (r.sent || 0), 0);
  const totalProcessed = results.reduce((s, r) => s + (r.processed || 0), 0);
  const totalErrors = results.reduce((s, r) => s + (r.errors || 0), 0);

  // Telegram
  const tg = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat && totalSent > 0) {
    const lines = results.map(r => `• <code>${r.name}</code>: ${r.sent} envoyés${r.error ? ` ❌${r.error.slice(0, 30)}` : ""}`).join("\n");
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        parse_mode: "HTML",
        disable_notification: true,
        text: `📨 <b>Vidage Brevo auto</b>\n\n<b>Total envoyé :</b> ${totalSent}\n${lines}`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    total_emails_sent: totalSent,
    total_processed: totalProcessed,
    total_errors: totalErrors,
    duration_ms: Date.now() - tStart,
    results,
  });
}

// POST = identique au GET (Vercel envoie un GET mais on accepte les 2 pour tests)
export const POST = GET;
