/**
 * POST /api/admin/vider-brevo
 *
 * Vide le quota Brevo restant en lançant TOUTES les routes outbound
 * en séquence, ignore le couvre-feu (force=true), max ~2400 emails/run.
 *
 * Usage urgent : "j'ai X mails à vider avant la fin du mois".
 *
 * Sécurités :
 *   - x-admin-key requis
 *   - Pas de re-envoi : chaque route a déjà son propre dedup (sent_at IS NOT NULL)
 *   - Respect des hard bounces : Brevo filtre côté serveur
 *
 * Body : {} (rien)
 * Query : ?dry_run=true pour voir les volumes sans envoyer
 *
 * Cron suggéré : appeler 3x/jour (8h, 13h, 18h) pendant 8 jours →
 *   3 × 2400 = 7200/jour théorique → vide 17000+ en moins d'une semaine.
 */
import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 600;

const ORIGIN = "https://webconceptor.fr";
const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || "";

// Routes outbound à enchaîner. force=true bypasse couvre-feu.
const OUTBOUND_ROUTES = [
  { name: "sniper",           path: "/api/admin/sniper",                     method: "POST" },
  { name: "closer-opened",    path: "/api/prospect/closer-opened",           method: "POST" },
  { name: "outdated-blast",   path: "/api/prospect/outdated-blast",          method: "POST" },
  { name: "distress-signals", path: "/api/prospect/distress-signals",        method: "POST" },
  { name: "follow-up",        path: "/api/prospect/follow-up",               method: "POST" },
  { name: "email-reminders",  path: "/api/prospect/email-reminders",         method: "POST" },
  { name: "blast-flash",      path: "/api/prospect/blast-flash",             method: "POST" },
  { name: "final-push",       path: "/api/prospect/final-push",              method: "POST" },
];

interface RouteResult {
  name: string;
  ok: boolean;
  http_status: number;
  duration_ms: number;
  emails_sent?: number;
  emails_errors?: number;
  processed?: number;
  error?: string;
}

async function callRoute(route: typeof OUTBOUND_ROUTES[number], dryRun: boolean): Promise<RouteResult> {
  const t0 = Date.now();
  const url = `${ORIGIN}${route.path}${dryRun ? "?dry_run=true" : "?force=true"}`;
  try {
    const res = await fetch(url, {
      method: route.method,
      headers: {
        "x-admin-key": ADMIN_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      signal: AbortSignal.timeout(280_000),
    });
    const data = await res.json().catch(() => ({}));
    const ms = Date.now() - t0;

    // Différentes routes utilisent des noms différents :
    // "sent" / "emails_sent" / "processed" — on fait un best-effort
    const sent = data.sent ?? data.emails_sent ?? data.successful_sends ?? data.success_count ?? 0;
    const errors = data.errors ?? data.failed ?? 0;
    const processed = data.processed ?? data.scanned ?? 0;

    return {
      name: route.name,
      ok: res.ok,
      http_status: res.status,
      duration_ms: ms,
      emails_sent: sent,
      emails_errors: errors,
      processed,
    };
  } catch (e) {
    return {
      name: route.name,
      ok: false,
      http_status: 0,
      duration_ms: Date.now() - t0,
      error: e instanceof Error ? e.message : "network",
    };
  }
}

export async function POST(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", ADMIN_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dry_run") === "true";
  const tStart = Date.now();

  const results: RouteResult[] = [];
  let totalSent = 0;
  let totalErrors = 0;
  let totalProcessed = 0;

  for (const route of OUTBOUND_ROUTES) {
    const r = await callRoute(route, dryRun);
    results.push(r);
    totalSent += r.emails_sent || 0;
    totalErrors += r.emails_errors || 0;
    totalProcessed += r.processed || 0;
    // Pause 1s entre routes pour ne pas saturer Brevo
    await new Promise(res => setTimeout(res, 1000));
  }

  const totalDuration = Date.now() - tStart;

  // Notif Telegram récap
  const tg = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat) {
    const lines = results.map(r =>
      `• <code>${r.name}</code>: ${r.emails_sent || 0} envoyés${r.processed ? ` / ${r.processed} traités` : ""}${r.error ? ` ❌ ${r.error.slice(0, 40)}` : ""}`
    ).join("\n");
    const msg = `🚀 <b>Vidage Brevo — récap</b>\n\n` +
      `<b>Total envoyés :</b> ${totalSent}\n` +
      `<b>Total erreurs :</b> ${totalErrors}\n` +
      `<b>Durée :</b> ${Math.round(totalDuration / 1000)}s\n\n` +
      `${lines}`;
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: msg, parse_mode: "HTML" }),
    }).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    dry_run: dryRun,
    total_emails_sent: totalSent,
    total_errors: totalErrors,
    total_processed: totalProcessed,
    duration_ms: totalDuration,
    routes_called: results.length,
    results,
  });
}

export async function GET(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", ADMIN_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    endpoint: "POST /api/admin/vider-brevo",
    description: "Lance les 8 routes outbound en séquence pour vider le quota Brevo",
    capacity_per_run: "~2400 emails (sniper200 + closer250 + outdated250 + follow-up300 + reminders250 + distress600 + blast500 + push300)",
    suggested_usage: "3x/jour (8h, 13h, 18h Paris) pour vider 17k+ en 8 jours",
    routes: OUTBOUND_ROUTES.map(r => r.path),
  });
}
