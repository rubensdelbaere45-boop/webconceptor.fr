import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   CRON : prospection quotidienne automatique.
   Appelle /find puis /send en sequence, avec gestion d'erreur.
   Authentification : header "x-cron-secret" ou Bearer token.
   Utilisable depuis n8n (HTTP Request) ou Render Cron Job.
   ══════════════════════════════════════════ */

const DEFAULT_QUERIES = [
  "Proxi épicerie France",
  "Proxi Super France",
  "Proxi proximité France",
];

export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  return runCron(req);
}

async function runCron(req: NextRequest) {
  // Auth : soit x-cron-secret (header), soit Authorization Bearer
  const cronSecret = process.env.CRON_SECRET || "";
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET non configure sur le serveur" },
      { status: 500 }
    );
  }
  const sent = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!safeCompare(sent, cronSecret)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  // Parametres : ?query= et ?batch= via URL (pour flexibilite n8n)
  const query = req.nextUrl.searchParams.get("query")?.trim().slice(0, 200) || "";
  const batchParam = Number(req.nextUrl.searchParams.get("batch"));
  const batch_size = Number.isFinite(batchParam) && batchParam > 0
    ? Math.min(20, Math.max(1, Math.floor(batchParam)))
    : 5;

  // Rotate through default queries if nothing specified
  const queries = query ? [query] : [
    DEFAULT_QUERIES[new Date().getDay() % DEFAULT_QUERIES.length],
  ];

  const origin = "https://webconceptor.fr";
  const adminKey = process.env.ADMIN_SECRET_KEY || "";

  const log: string[] = [];
  const results = { found: 0, inserted: 0, sent: 0, errors: [] as string[] };

  try {
    // ─── Étape 1 : chercher de nouveaux prospects ───
    for (const q of queries) {
      log.push(`[find] Recherche "${q}"`);
      try {
        const r = await fetch(`${origin}/api/prospect/find`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
          body: JSON.stringify({ query: q }),
          signal: AbortSignal.timeout(120000),
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.stats) {
          results.found += Number(data.stats.found || 0);
          results.inserted += Number(data.stats.inserted || 0);
          log.push(`[find] ${data.stats.inserted}/${data.stats.found} inserted (${data.stats.withEmail} emails, ${data.stats.skippedNearby} nearby, ${data.stats.skippedDuplicate} dup)`);
        } else {
          const msg = `find failed for "${q}": ${data.error || r.status}`;
          results.errors.push(msg);
          log.push(`[find] ERREUR: ${msg}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown";
        results.errors.push(`find "${q}": ${msg}`);
        log.push(`[find] EXCEPTION: ${msg}`);
      }
    }

    // ─── Laisse les inserts se propager ───
    await new Promise((res) => setTimeout(res, 2000));

    // ─── Étape 2 : envoyer les emails aux prospects "found" ───
    log.push(`[send] Envoi batch_size=${batch_size}, dry_run=false`);
    try {
      const r = await fetch(`${origin}/api/prospect/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ batch_size, dry_run: false }),
        signal: AbortSignal.timeout(300000),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        const ok = Array.isArray(data.results)
          ? data.results.filter((x: { status: string }) => x.status === "sent").length
          : 0;
        results.sent = ok;
        log.push(`[send] ${ok}/${data.processed || 0} emails envoyés`);
      } else {
        const msg = `send failed: ${data.error || r.status}`;
        results.errors.push(msg);
        log.push(`[send] ERREUR: ${msg}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      results.errors.push(`send: ${msg}`);
      log.push(`[send] EXCEPTION: ${msg}`);
    }

    // ─── Notification Telegram de synthèse ───
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (token && chatId) {
      const status = results.errors.length === 0 ? "✅" : "⚠️";
      const text =
        `${status} <b>Prospection automatique</b>\n\n` +
        `<b>Ajoutés :</b> ${results.inserted}\n` +
        `<b>Emails envoyés :</b> ${results.sent}\n` +
        (results.errors.length ? `<b>Erreurs :</b>\n${results.errors.map(e => "• " + e.slice(0, 150)).join("\n").slice(0, 800)}` : "");
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
          signal: AbortSignal.timeout(10000),
        });
      } catch { /* silent */ }
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      results,
      log,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[cron] fatal:", err);
    return NextResponse.json({ success: false, error: msg, log }, { status: 500 });
  }
}
