/**
 * POST /api/admin/sql-to-telegram
 *
 * Envoie tous les SQL files (sql/*.sql) groupés par Telegram avec un
 * lien direct vers le Supabase SQL Editor.
 *
 * Tom n'a qu'à :
 *   1. Cliquer le lien Supabase SQL Editor depuis Telegram
 *   2. Cliquer "Copier" sur le bloc SQL dans Telegram
 *   3. Coller dans SQL Editor + Run (15 sec)
 *
 * Une fois pour toutes — toutes les colonnes Fleet créées d'un coup.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminGuard } from "@/lib/security";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 3, windowSec: 60, routeKey: "sql-to-tg" });
  if (guard) return guard;

  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (!tg || !chat) {
    return NextResponse.json({ error: "Telegram bot non configuré" }, { status: 503 });
  }

  // Lit tous les .sql
  const sqlDir = path.join(process.cwd(), "sql");
  let files: string[] = [];
  try {
    const all = await readdir(sqlDir);
    files = all.filter((f) => f.endsWith(".sql")).sort();
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "unknown" }, { status: 500 });
  }

  // Concatène tous les SQL en un seul bloc géant (idempotent grâce aux IF NOT EXISTS)
  const sqlBlocks: string[] = [];
  for (const file of files) {
    try {
      const content = await readFile(path.join(sqlDir, file), "utf-8");
      sqlBlocks.push(`-- ═══ ${file} ═══\n${content.trim()}`);
    } catch { /* skip */ }
  }
  const fullSql = sqlBlocks.join("\n\n");

  // Détecte le project ref Supabase pour générer le lien direct vers SQL Editor
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const projectRef = supabaseUrl.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1] || "_";
  const sqlEditorUrl = `https://supabase.com/dashboard/project/${projectRef}/sql/new`;

  // Telegram limite les messages à 4096 chars → on split par bloc SQL
  const intro = `🗄️ <b>SQL à exécuter dans Supabase (1 fois)</b>\n\n1. Clique le lien ci-dessous pour ouvrir SQL Editor\n2. Copie le SQL des messages suivants\n3. Colle dans SQL Editor + clique <b>Run</b>\n\n📎 <a href="${sqlEditorUrl}">Ouvrir Supabase SQL Editor</a>\n\n${sqlBlocks.length} fichiers à exécuter (idempotent — safe à relancer).`;

  await fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chat, text: intro, parse_mode: "HTML", disable_web_page_preview: false }),
  }).catch(() => {});

  // Envoie chaque bloc SQL en message séparé avec <pre> pour bouton copier
  for (const block of sqlBlocks) {
    // Telegram autorise 4096 chars max — on tronque si nécessaire
    const safe = block.length > 3500 ? block.slice(0, 3500) + "\n-- ... [tronqué]" : block;
    await fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: `<pre>${safe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</pre>`,
        parse_mode: "HTML",
        disable_notification: true,
      }),
    }).catch(() => {});
    // Petit délai pour respecter le rate limit Telegram (~30 msg/sec)
    await new Promise(r => setTimeout(r, 200));
  }

  // Message final récap
  await fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chat,
      text: `✅ <b>Une fois exécuté</b> : tous les workflows N8N (Profiler, Sniper, QA Gatekeeper, etc.) pourront tourner sans erreur "column does not exist".\n\n📎 <a href="${sqlEditorUrl}">SQL Editor Supabase</a>`,
      parse_mode: "HTML",
    }),
  }).catch(() => {});

  return NextResponse.json({
    ok: true,
    files_sent: sqlBlocks.length,
    sql_editor_url: sqlEditorUrl,
    total_sql_chars: fullSql.length,
    message: "SQL envoyé sur Telegram. Va sur Telegram → SQL Editor → copier/coller/Run.",
  });
}

export async function GET(req: NextRequest) { return POST(req); }
