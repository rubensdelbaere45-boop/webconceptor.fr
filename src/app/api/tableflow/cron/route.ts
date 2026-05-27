import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   TableFlow — Cron automatique
   Find (restaurants) + Send (emails) en 2 phases.
   Tourne 8h–18h UTC (9h–19h Paris).
   ══════════════════════════════════════════ */

const RESTAURANT_QUERIES = [
  // ── ZONE AUBENTON (≤60km) — priorité haute ──
  "restaurant Laon", "restaurant Vervins", "restaurant Hirson", "restaurant Guise", "restaurant Fourmies",
  "brasserie Laon", "brasserie Charleville-Mézières", "brasserie Guise",
  "pizzeria Laon", "pizzeria Vervins", "pizzeria Fourmies", "pizzeria Charleville-Mézières",
  "café restaurant Laon", "café restaurant Vervins", "café restaurant Hirson",
  "crêperie Laon", "crêperie Charleville-Mézières",
  "boulangerie café Laon", "boulangerie café Vervins", "boulangerie café Hirson",
  "bistrot Laon", "bistrot Vervins", "bistrot Charleville-Mézières",
  "restaurant gastronomique Laon", "restauration rapide Laon",
  // ── Restaurants génériques ──
  "restaurant Albi", "restaurant Angoulême", "restaurant Arles", "restaurant Aubagne",
  "restaurant Avignon", "restaurant Bayonne", "restaurant Belfort", "restaurant Béziers",
  "restaurant Blois", "restaurant Brest", "restaurant Brive-la-Gaillarde", "restaurant Caen",
  "restaurant Calais", "restaurant Carcassonne", "restaurant Chambéry", "restaurant Chartres",
  "restaurant Cherbourg", "restaurant Clermont-Ferrand", "restaurant Colmar",
  "restaurant Dunkerque", "restaurant Évreux", "restaurant Gap", "restaurant Hyères",
  "restaurant La Rochelle", "restaurant Laval", "restaurant Le Mans", "restaurant Lens",
  "restaurant Limoges", "restaurant Lorient", "restaurant Mâcon", "restaurant Metz",
  "restaurant Montauban", "restaurant Mulhouse", "restaurant Niort", "restaurant Orléans",
  "restaurant Pau", "restaurant Perpignan", "restaurant Poitiers", "restaurant Quimper",
  "restaurant Roanne", "restaurant Rodez", "restaurant Saint-Brieuc", "restaurant Saint-Malo",
  "restaurant Saint-Nazaire", "restaurant Tarbes", "restaurant Thionville",
  "restaurant Troyes", "restaurant Valence", "restaurant Valenciennes", "restaurant Vannes",
  // ── Brasseries ──
  "brasserie Amiens", "brasserie Angers", "brasserie Avignon", "brasserie Bayonne",
  "brasserie Béziers", "brasserie Brest", "brasserie Caen", "brasserie Chambéry",
  "brasserie Clermont-Ferrand", "brasserie Colmar", "brasserie Dunkerque",
  "brasserie La Rochelle", "brasserie Le Mans", "brasserie Limoges", "brasserie Metz",
  "brasserie Nancy", "brasserie Orléans", "brasserie Rouen", "brasserie Toulon",
  "brasserie Troyes", "brasserie Valence", "brasserie Vannes",
  // ── Pizzerias ──
  "pizzeria Albi", "pizzeria Amiens", "pizzeria Angers", "pizzeria Avignon",
  "pizzeria Bayonne", "pizzeria Béziers", "pizzeria Brest", "pizzeria Caen",
  "pizzeria Chambéry", "pizzeria Chartres", "pizzeria Clermont-Ferrand", "pizzeria Colmar",
  "pizzeria Dunkerque", "pizzeria La Rochelle", "pizzeria Le Mans", "pizzeria Lens",
  "pizzeria Limoges", "pizzeria Lorient", "pizzeria Metz", "pizzeria Mulhouse",
  "pizzeria Nancy", "pizzeria Niort", "pizzeria Orléans", "pizzeria Pau",
  "pizzeria Perpignan", "pizzeria Rouen", "pizzeria Saint-Étienne", "pizzeria Toulon",
  "pizzeria Troyes", "pizzeria Valence", "pizzeria Vannes",
  // ── Bistrots ──
  "bistrot Amiens", "bistrot Angers", "bistrot Avignon", "bistrot Brest",
  "bistrot Caen", "bistrot Clermont-Ferrand", "bistrot Dijon", "bistrot Le Mans",
  "bistrot Limoges", "bistrot Metz", "bistrot Nancy", "bistrot Orléans",
  "bistrot Rouen", "bistrot Toulon",
  // ── Cuisine du monde ──
  "restaurant japonais Amiens", "restaurant japonais Angers", "restaurant japonais Avignon",
  "restaurant japonais Brest", "restaurant japonais Caen", "restaurant japonais Clermont-Ferrand",
  "restaurant japonais Dijon", "restaurant japonais Le Mans", "restaurant japonais Limoges",
  "restaurant japonais Metz", "restaurant japonais Nancy", "restaurant japonais Orléans",
  "restaurant chinois Amiens", "restaurant chinois Angers", "restaurant chinois Avignon",
  "restaurant chinois Brest", "restaurant chinois Caen", "restaurant chinois Clermont-Ferrand",
  "restaurant libanais Amiens", "restaurant libanais Angers", "restaurant libanais Avignon",
  "restaurant libanais Brest", "restaurant libanais Caen", "restaurant libanais Clermont-Ferrand",
  "restaurant indien Amiens", "restaurant indien Angers", "restaurant indien Avignon",
  "restaurant indien Clermont-Ferrand", "restaurant indien Nancy", "restaurant indien Orléans",
  // ── Crêperies ──
  "crêperie Amiens", "crêperie Angers", "crêperie Avignon", "crêperie Brest",
  "crêperie Caen", "crêperie Chambéry", "crêperie Clermont-Ferrand",
  "crêperie Le Mans", "crêperie Limoges", "crêperie Metz", "crêperie Nancy",
  "crêperie Orléans", "crêperie Rouen", "crêperie Toulon",
  // ── Burger / snack ──
  "burger restaurant Amiens", "burger restaurant Angers", "burger restaurant Avignon",
  "burger restaurant Brest", "burger restaurant Caen", "burger restaurant Clermont-Ferrand",
  "burger restaurant Le Mans", "burger restaurant Limoges", "burger restaurant Metz",
  "burger restaurant Nancy", "burger restaurant Orléans", "burger restaurant Rouen",
  // ── Gastronomique ──
  "restaurant gastronomique Amiens", "restaurant gastronomique Angers",
  "restaurant gastronomique Avignon", "restaurant gastronomique Brest",
  "restaurant gastronomique Caen", "restaurant gastronomique Clermont-Ferrand",
  "restaurant gastronomique Le Mans", "restaurant gastronomique Metz",
  "restaurant gastronomique Nancy", "restaurant gastronomique Rouen",
  // ── Terroir / cuisine régionale ──
  "cuisine régionale Amiens", "cuisine régionale Angers", "cuisine régionale Avignon",
  "cuisine provençale Avignon", "cuisine bretonne Brest", "cuisine alsacienne Colmar",
  "cuisine basque Bayonne", "cuisine lyonnaise bouchon Lyon",
  "gastronomie locale Limoges", "gastronomie locale Périgueux",
];

const QUERIES_PER_RUN = 3;

export async function GET(req: NextRequest) {
  return runCron(req);
}
export async function POST(req: NextRequest) {
  return runCron(req);
}

async function runCron(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || "";
  const sent = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!safeCompare(sent, cronSecret)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const origin = "https://webconceptor.fr";
  const adminKey = process.env.ADMIN_SECRET_KEY || "";
  const log: string[] = [];
  const results = { found: 0, inserted: 0, sent: 0, errors: [] as string[] };

  // Rotation 1h — décalée par rapport au cron WebConceptor (+50 offset)
  const runIndex = Math.floor(Date.now() / (1 * 60 * 60 * 1000));
  const offset = ((runIndex * QUERIES_PER_RUN) + 50) % RESTAURANT_QUERIES.length;
  const queries: string[] = [];
  for (let i = 0; i < QUERIES_PER_RUN; i++) {
    queries.push(RESTAURANT_QUERIES[(offset + i) % RESTAURANT_QUERIES.length]);
  }

  // ─── Phase 1 : FIND ───────────────────────────────────────────────────────
  for (const q of queries) {
    log.push(`[find] "${q}"`);
    try {
      const r = await fetch(`${origin}/api/tableflow/find`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ query: q }),
        signal: AbortSignal.timeout(55_000),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.stats) {
        results.found += data.stats.found || 0;
        results.inserted += data.stats.inserted || 0;
        log.push(`[find] ✓ ${data.stats.inserted} insérés / ${data.stats.withEmail} avec email`);
      } else {
        const msg = `find failed "${q}": ${data.error || r.status}`;
        results.errors.push(msg);
        log.push(`[find] ✗ ${msg}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      results.errors.push(`find "${q}": ${msg}`);
      log.push(`[find] ✗ ${msg}`);
    }
  }

  await new Promise((r) => setTimeout(r, 1500));

  // ─── Phase 2 : SEND ───────────────────────────────────────────────────────
  log.push(`[send] batch=60`);
  try {
    const r = await fetch(`${origin}/api/tableflow/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
      body: JSON.stringify({ batch_size: 60, dry_run: false }),
      signal: AbortSignal.timeout(130_000),
    });
    const data = await r.json().catch(() => ({}));
    if (r.ok) {
      results.sent = Array.isArray(data.results)
        ? data.results.filter((x: { status: string }) => x.status === "sent").length
        : 0;
      log.push(`[send] ✓ ${results.sent} emails envoyés`);
    } else {
      results.errors.push(`send: ${data.error || r.status}`);
      log.push(`[send] ✗ ${data.error || r.status}`);
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "timeout";
    results.errors.push(`send: ${msg}`);
    log.push(`[send] ✗ ${msg}`);
  }

  // ─── Notification Telegram ────────────────────────────────────────────────
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    const status = results.errors.length === 0 ? "✅" : "⚠️";
    const text = `${status} <b>TableFlow auto</b>\n\n`
      + `<b>Restaurants trouvés :</b> ${results.inserted}\n`
      + `<b>Emails envoyés :</b> ${results.sent}\n`
      + (results.errors.length
        ? `<b>Erreurs :</b>\n${results.errors.slice(0, 3).map((e) => "• " + e.slice(0, 100)).join("\n")}`
        : "");
    try {
      await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_notification: true }),
        signal: AbortSignal.timeout(8000),
      });
    } catch { /* silent */ }
  }

  return NextResponse.json({ success: results.errors.length === 0, results, log });
}
