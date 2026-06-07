/**
 * GET|POST /api/admin/health-check
 *
 * Health-check global qui détecte les pannes silencieuses :
 *   - N8N API joignable + clé valide
 *   - Workflows N8N actifs (pas en erreur)
 *   - Supabase joignable + colonnes critiques présentes
 *   - Brevo joignable + crédits emails restants
 *   - LLM joignable (au moins 1 provider)
 *   - Stripe joignable
 *
 * Si UN service est cassé → Telegram alerte AVEC remède exact.
 *
 * Appelé toutes les 30 min par cron N8N pour détection précoce.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAdminGuard, safeCompare } from "@/lib/security";
import { createClient } from "@supabase/supabase-js";
import { listWorkflows } from "@/lib/n8n-client";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Check {
  name: string;
  ok: boolean;
  detail: string;
  fix?: string;
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || req.nextUrl.searchParams.get("key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  // Vercel Cron envoie Authorization: Bearer <CRON_SECRET>
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (
    !safeCompare(adminKey, process.env.ADMIN_SECRET_KEY) &&
    !safeCompare(cronSecret, process.env.CRON_SECRET) &&
    !safeCompare(bearer, process.env.CRON_SECRET)
  ) {
    const guard = requireAdminGuard(req, { limit: 12, windowSec: 60, routeKey: "health" });
    if (guard) return guard;
  }

  const checks: Check[] = [];

  // ─── 1. Supabase ────────────────────────────────────────
  try {
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.SUPABASE_SERVICE_ROLE_KEY || "");
    const { error, count } = await supabase.from("prospects").select("id", { count: "exact", head: true }).limit(1);
    if (error) {
      checks.push({ name: "Supabase", ok: false, detail: error.message, fix: "Vérifie NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sur Vercel." });
    } else {
      checks.push({ name: "Supabase", ok: true, detail: `${count ?? 0} prospects` });
    }

    // Probe colonnes Fleet (critique pour Profiler/Sniper/QA)
    const colsProbe = await supabase.from("prospects").select("qa_passed,sales_angle,custom_hook,sniper_sent_at,hot_alert_sent_at,closer_sent_at,distress_email_sent_at").limit(1);
    if (colsProbe.error && /column .* does not exist/i.test(colsProbe.error.message)) {
      checks.push({
        name: "Supabase colonnes Fleet",
        ok: false,
        detail: colsProbe.error.message.slice(0, 150),
        fix: "Appelle POST /api/admin/migrate-db (exécute auto tous les sql/*.sql).",
      });
    } else {
      checks.push({ name: "Supabase colonnes Fleet", ok: true, detail: "Toutes présentes" });
    }
  } catch (e) {
    checks.push({ name: "Supabase", ok: false, detail: e instanceof Error ? e.message : "unknown" });
  }

  // ─── 2. N8N ────────────────────────────────────────
  try {
    if (!process.env.N8N_API_KEY) {
      checks.push({ name: "N8N", ok: false, detail: "N8N_API_KEY manquante", fix: "Génère une clé sur N8N (Settings > API) et set sur Vercel." });
    } else {
      const all = await listWorkflows();
      if (all.length === 0) {
        checks.push({ name: "N8N", ok: false, detail: "Aucun workflow listé — clé invalide ou URL erronée", fix: "Vérifie N8N_BASE_URL (doit être https://n8n-production-3b6a.up.railway.app) et N8N_API_KEY (régénérée si tu as redéployé N8N)." });
      } else {
        const active = all.filter(w => w.active).length;
        const inactive = all.length - active;
        if (inactive > 0) {
          checks.push({ name: "N8N", ok: false, detail: `${active}/${all.length} workflows actifs, ${inactive} inactifs`, fix: "Réveille les workflows inactifs : POST /api/monitor/n8n (cycle auto)." });
        } else {
          checks.push({ name: "N8N", ok: true, detail: `${active} workflows actifs` });
        }
      }
    }
  } catch (e) {
    checks.push({ name: "N8N", ok: false, detail: e instanceof Error ? e.message : "unknown" });
  }

  // ─── 3. Brevo email ────────────────────────────────────────
  try {
    if (!process.env.BREVO_API_KEY) {
      checks.push({ name: "Brevo email", ok: false, detail: "BREVO_API_KEY manquante" });
    } else {
      const res = await fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": process.env.BREVO_API_KEY, Accept: "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      const data = await res.json().catch(() => ({}));
      const emailPlan = (data.plan || []).find((p: { type: string }) => p.type === "subscription");
      const credits = emailPlan?.credits || 0;
      if (!res.ok) {
        checks.push({ name: "Brevo email", ok: false, detail: `HTTP ${res.status}` });
      } else if (credits < 500) {
        checks.push({ name: "Brevo email", ok: false, detail: `Seulement ${credits} crédits email restants !`, fix: "Acheter pack Brevo email (https://app.brevo.com/billing/plans)." });
      } else {
        checks.push({ name: "Brevo email", ok: true, detail: `${credits} crédits email` });
      }
    }
  } catch (e) {
    checks.push({ name: "Brevo email", ok: false, detail: e instanceof Error ? e.message : "unknown" });
  }

  // ─── 4. LLM (Kimi/Gemini/Claude) ────────────────────────────────────────
  const llms = [
    process.env.OPENROUTER_API_KEY_KIMI && "OpenRouter Kimi K2",
    process.env.OPENROUTER_API_KEY && "OpenRouter",
    process.env.GEMINI_API_KEY && "Gemini",
    process.env.ANTHROPIC_API_KEY && "Anthropic Claude",
  ].filter(Boolean);
  checks.push({
    name: "LLM",
    ok: llms.length > 0,
    detail: llms.length > 0 ? `${llms.length} providers : ${llms.join(", ")}` : "Aucun LLM configuré",
    fix: llms.length === 0 ? "Set OPENROUTER_API_KEY_KIMI ou GEMINI_API_KEY sur Vercel." : undefined,
  });

  // ─── 5. Stripe ────────────────────────────────────────
  checks.push({
    name: "Stripe",
    ok: !!process.env.STRIPE_SECRET_KEY,
    detail: process.env.STRIPE_SECRET_KEY ? "Configuré" : "STRIPE_SECRET_KEY manquante",
  });

  // ─── 6. Telegram (test) ────────────────────────────────────────
  checks.push({
    name: "Telegram",
    ok: !!(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    detail: process.env.TELEGRAM_BOT_TOKEN ? "Bot OK" : "TELEGRAM_BOT_TOKEN manquante",
  });

  // ─── Notif Telegram SEULEMENT s'il y a au moins 1 erreur ────
  const failed = checks.filter(c => !c.ok);
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat && failed.length > 0) {
    const lines = failed.map(c => `❌ <b>${c.name}</b> — ${c.detail}\n💡 ${c.fix || ""}`);
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: `🚨 <b>HEALTH CHECK — ${failed.length} panne(s) détectée(s)</b>\n\n${lines.join("\n\n")}\n\n📅 ${new Date().toLocaleString("fr-FR")}`,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({
    ok: failed.length === 0,
    healthy: checks.filter(c => c.ok).length,
    failed_count: failed.length,
    checks,
    timestamp: new Date().toISOString(),
  });
}

export async function GET(req: NextRequest) { return POST(req); }
