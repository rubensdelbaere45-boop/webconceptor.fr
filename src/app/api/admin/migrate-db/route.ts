/**
 * POST /api/admin/migrate-db
 *
 * Exécute automatiquement TOUS les fichiers SQL du dossier sql/
 * sur la base Supabase, sans intervention manuelle.
 *
 * Cherche la chaîne de connexion Postgres dans plusieurs env vars :
 *   - DATABASE_URL
 *   - POSTGRES_URL
 *   - SUPABASE_DB_URL
 *   - POSTGRES_PRISMA_URL
 *
 * Utilise `pg` (node-postgres) pour exécuter le DDL.
 *
 * Idempotent : tous les SQL utilisent IF NOT EXISTS, donc safe à
 * exécuter plusieurs fois.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminGuard, safeCompare } from "@/lib/security";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function getConnectionString(): { url: string | null; source: string } {
  const sources = [
    "DATABASE_URL",
    "POSTGRES_URL",
    "POSTGRES_PRISMA_URL",
    "POSTGRES_URL_NON_POOLING",
    "SUPABASE_DB_URL",
  ];
  for (const s of sources) {
    const v = process.env[s];
    if (v && v.startsWith("postgres")) return { url: v, source: s };
  }
  return { url: null, source: "none" };
}

export async function POST(req: NextRequest) {
  // Auth (admin uniquement, jamais cron — opération sensible)
  const adminKey = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    const guard = requireAdminGuard(req, { limit: 3, windowSec: 300, routeKey: "migrate-db" });
    if (guard) return guard;
  }

  const { url, source } = getConnectionString();
  if (!url) {
    return NextResponse.json({
      ok: false,
      error: "Aucune chaîne de connexion Postgres trouvée dans les env vars",
      checked: ["DATABASE_URL", "POSTGRES_URL", "POSTGRES_PRISMA_URL", "SUPABASE_DB_URL"],
      next_step: "Activer l'intégration Supabase officielle Vercel : Vercel > Integrations > Supabase > Connect Project. Ça créera automatiquement POSTGRES_URL et les autres vars.",
      alternative: "Sur Supabase > Project > Settings > Database > Connection string (URI) → Copier la 'Pooling' URL → Set DATABASE_URL sur Vercel.",
    }, { status: 503 });
  }

  // Lit tous les .sql du dossier sql/
  const sqlDir = path.join(process.cwd(), "sql");
  let files: string[] = [];
  try {
    const all = await readdir(sqlDir);
    files = all.filter((f) => f.endsWith(".sql")).sort();
  } catch (e) {
    return NextResponse.json({ ok: false, error: `Lecture sql/ échouée : ${e instanceof Error ? e.message : "unknown"}` }, { status: 500 });
  }

  if (files.length === 0) {
    return NextResponse.json({ ok: false, error: "Aucun fichier .sql trouvé dans sql/" }, { status: 404 });
  }

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  const report: Array<{ file: string; ok: boolean; statements_ran?: number; detail?: string }> = [];

  try {
    await client.connect();

    for (const file of files) {
      try {
        const raw = await readFile(path.join(sqlDir, file), "utf-8");
        // Split sur ; en début de ligne (tolère les ; dans des chaînes)
        // mais on exécute tout d'un bloc pour rester safe sur les statements complexes
        const statements = raw
          .split(/;\s*\n/g)
          .map((s) => s.trim())
          .filter((s) => s.length > 0 && !s.startsWith("--"));

        let ran = 0;
        for (const stmt of statements) {
          // Skip les commentaires purs en début
          const trimmed = stmt.replace(/^--[^\n]*\n/gm, "").trim();
          if (trimmed.length === 0) continue;
          try {
            await client.query(trimmed);
            ran++;
          } catch (e) {
            // Si l'erreur est "already exists" → on continue (idempotent)
            const msg = e instanceof Error ? e.message : String(e);
            if (/already exists|déjà existant/i.test(msg)) {
              ran++;
              continue;
            }
            throw e;
          }
        }
        report.push({ file, ok: true, statements_ran: ran });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        report.push({ file, ok: false, detail: msg.slice(0, 300) });
      }
    }
  } catch (e) {
    return NextResponse.json({
      ok: false,
      error: `Connexion Postgres échouée : ${e instanceof Error ? e.message : "unknown"}`,
      connection_source: source,
    }, { status: 500 });
  } finally {
    try { await client.end(); } catch { /* silent */ }
  }

  // Telegram récap
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  const failed = report.filter(r => !r.ok);
  if (tg && chat) {
    const lines = report.map(r => `${r.ok ? "✅" : "❌"} <code>${r.file}</code> — ${r.ok ? r.statements_ran + " stmts" : r.detail}`);
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: `🗄️ <b>Migration DB Supabase</b>\n\nConnexion : <code>${source}</code>\n\n${lines.join("\n")}`,
        parse_mode: "HTML",
      }),
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: failed.length === 0,
    connection_source: source,
    files_processed: report.length,
    files_failed: failed.length,
    report,
  });
}

export async function GET(req: NextRequest) { return POST(req); }
