import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════
   GET /api/health
   Healthcheck public — vérifie que toutes les intégrations critiques
   sont UP. Utilisable par un uptime monitor externe (UptimeRobot, Render, n8n).
   Retourne 200 si tout OK, 503 sinon.
   ══════════════════════════════════════════ */

async function checkSupabase(): Promise<{ ok: boolean; detail?: string }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
    const { error } = await supabase.from("prospects").select("id", { count: "exact", head: true }).limit(1);
    if (error) return { ok: false, detail: error.message.slice(0, 100) };
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message.slice(0, 100) : "unknown" };
  }
}

async function checkStripe(): Promise<{ ok: boolean; detail?: string }> {
  const hasKey = Boolean(process.env.STRIPE_SECRET_KEY);
  const hasWebhook = Boolean(process.env.STRIPE_WEBHOOK_SECRET);
  const hasSerenite = Boolean(process.env.STRIPE_SERENITE_PRICE_ID);
  if (!hasKey || !hasWebhook) return { ok: false, detail: "missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET" };
  if (!hasSerenite) return { ok: false, detail: "missing STRIPE_SERENITE_PRICE_ID (abonnement récurrent auto KO)" };
  return { ok: true };
}

async function checkIonos(): Promise<{ ok: boolean; detail?: string }> {
  const hasFull = Boolean(process.env.IONOS_API_KEY);
  const hasSplit = Boolean(
    (process.env.IONOS_API_PREFIX || process.env.IONOS_API_PUBLIC_PREFIX) &&
    (process.env.IONOS_API_SECRET || process.env.IONOS_SECRET)
  );
  if (!hasFull && !hasSplit) return { ok: false, detail: "IONOS_API_KEY ou (IONOS_API_PREFIX + IONOS_API_SECRET) manquante" };
  return { ok: true };
}

async function checkBrevo(): Promise<{ ok: boolean; detail?: string }> {
  if (!process.env.BREVO_API_KEY) return { ok: false, detail: "BREVO_API_KEY manquante" };
  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": process.env.BREVO_API_KEY, "accept": "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return { ok: false, detail: `Brevo HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message.slice(0, 100) : "Brevo unreachable" };
  }
}

async function checkClaude(): Promise<{ ok: boolean; detail?: string }> {
  const hasKey = Boolean(process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY);
  if (!hasKey) return { ok: false, detail: "OPENROUTER_API_KEY ou ANTHROPIC_API_KEY manquante" };
  return { ok: true };
}

async function checkTelegram(): Promise<{ ok: boolean; detail?: string }> {
  const hasToken = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const hasChat = Boolean(process.env.TELEGRAM_CHAT_ID);
  if (!hasToken || !hasChat) return { ok: false, detail: "TELEGRAM_BOT_TOKEN ou TELEGRAM_CHAT_ID manquant" };
  return { ok: true };
}

async function checkGooglePlaces(): Promise<{ ok: boolean; detail?: string }> {
  if (!process.env.GOOGLE_MAPS_API_KEY) return { ok: false, detail: "GOOGLE_MAPS_API_KEY manquante" };
  return { ok: true };
}

export async function GET() {
  const [supabase, stripe, ionos, brevo, claude, telegram, google] = await Promise.all([
    checkSupabase(),
    checkStripe(),
    checkIonos(),
    checkBrevo(),
    checkClaude(),
    checkTelegram(),
    checkGooglePlaces(),
  ]);

  const checks = {
    supabase: supabase.ok ? "✅" : `❌ ${supabase.detail}`,
    stripe: stripe.ok ? "✅" : `❌ ${stripe.detail}`,
    ionos: ionos.ok ? "✅" : `⚠️ ${ionos.detail}`,
    brevo: brevo.ok ? "✅" : `❌ ${brevo.detail}`,
    claude: claude.ok ? "✅" : `❌ ${claude.detail}`,
    telegram: telegram.ok ? "✅" : `❌ ${telegram.detail}`,
    google_places: google.ok ? "✅" : `❌ ${google.detail}`,
  };

  const criticalDown = !supabase.ok || !stripe.ok || !brevo.ok || !claude.ok || !google.ok;

  return NextResponse.json({
    status: criticalDown ? "degraded" : "ok",
    timestamp: new Date().toISOString(),
    checks,
  }, { status: criticalDown ? 503 : 200 });
}
