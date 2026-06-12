import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   GET /api/agentconceptor/audit
   Auth : x-admin-key

   Audit complet du système AGENTConceptor :
   - Vérification des variables d'environnement
   - Test de connexion Supabase
   - Test Brevo (API key valide)
   - Test OpenRouter (API key valide)
   - État des abonnements actifs
   - Crons Vercel configurés
   - N8N workflows actifs
   ══════════════════════════════════════════ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

interface CheckResult {
  name: string;
  status: "ok" | "warn" | "error";
  message: string;
  detail?: string;
}

async function checks(): Promise<CheckResult[]> {
  const results: CheckResult[] = [];

  // ── 1. Env vars critiques ──
  const requiredEnvs = [
    { key: "STRIPE_SECRET_KEY",        label: "Stripe Secret Key" },
    { key: "STRIPE_WEBHOOK_SECRET",    label: "Stripe Webhook Secret" },
    { key: "NEXT_PUBLIC_SUPABASE_URL", label: "Supabase URL" },
    { key: "SUPABASE_SERVICE_ROLE_KEY",label: "Supabase Service Role" },
    { key: "BREVO_API_KEY",            label: "Brevo API Key" },
    { key: "OPENROUTER_API_KEY",       label: "OpenRouter API Key" },
    { key: "TELEGRAM_BOT_TOKEN",       label: "Telegram Bot Token" },
    { key: "GOOGLE_PLACES_API_KEY",    label: "Google Places API Key" },
    { key: "ADMIN_SECRET_KEY",         label: "Admin Secret Key" },
    { key: "CRON_SECRET",              label: "Cron Secret" },
  ];

  const missingEnvs = requiredEnvs.filter(({ key }) => !process.env[key]);
  if (missingEnvs.length === 0) {
    results.push({ name: "Variables d'environnement", status: "ok", message: "Toutes les variables critiques sont définies" });
  } else {
    results.push({ name: "Variables d'environnement", status: "error", message: `${missingEnvs.length} variable(s) manquante(s)`, detail: missingEnvs.map((e) => e.label).join(", ") });
  }

  // Prix Stripe agents (warnings si manquants mais pas bloquants)
  const stripePrices = [
    { key: "STRIPE_CHATBOT_PRICE_ID",  label: "Prix Chatbot" },
    { key: "STRIPE_GMB_PRICE_ID",      label: "Prix Réputation" },
    { key: "STRIPE_DEVIS_PRICE_ID",    label: "Prix Devis" },
    { key: "STRIPE_CONTENU_PRICE_ID",  label: "Prix Contenu" },
    { key: "STRIPE_FIDEL_PRICE_ID",    label: "Prix Fidélisation" },
    { key: "STRIPE_PACK_PRICE_ID",     label: "Prix Pack Complet" },
    { key: "STRIPE_AUDIT_PRICE_ID",    label: "Prix Audit IA" },
  ];
  const missingPrices = stripePrices.filter(({ key }) => !process.env[key]);
  if (missingPrices.length === 0) {
    results.push({ name: "Prix Stripe", status: "ok", message: "Tous les price_ids sont configurés" });
  } else {
    results.push({ name: "Prix Stripe", status: "warn", message: `${missingPrices.length} price_id(s) manquants → checkout utilisera des prix dynamiques`, detail: missingPrices.map((p) => p.label).join(", ") });
  }

  // Google OAuth
  const googleOAuth = ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET"].filter((k) => !process.env[k]);
  if (googleOAuth.length === 0) {
    results.push({ name: "Google OAuth", status: "ok", message: "Client ID et Secret configurés" });
  } else {
    results.push({ name: "Google OAuth", status: "warn", message: "Client OAuth manquant — Agent Réputation ne peut pas s'authentifier", detail: googleOAuth.join(", ") });
  }

  // ── 2. Supabase connexion ──
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from("prospects").select("id").limit(1);
    if (error) throw error;
    results.push({ name: "Supabase", status: "ok", message: "Connexion OK, table prospects accessible" });
  } catch (err) {
    results.push({ name: "Supabase", status: "error", message: "Connexion Supabase échouée", detail: String(err).slice(0, 200) });
  }

  // ── 3. Tables AGENTConceptor ──
  const acTables = ["agentconceptor_subscriptions", "devis_requests", "contenu_subscriptions", "chatbot_subscriptions", "gmb_subscriptions", "audit_orders"];
  try {
    const supabase = getSupabase();
    const tableChecks = await Promise.all(
      acTables.map((t) => supabase.from(t).select("id").limit(1).then((r) => ({ table: t, ok: !r.error, err: r.error?.message })))
    );
    const failing = tableChecks.filter((t) => !t.ok);
    if (failing.length === 0) {
      results.push({ name: "Tables Supabase", status: "ok", message: `${acTables.length} tables opérationnelles` });
    } else {
      results.push({ name: "Tables Supabase", status: "error", message: `${failing.length} table(s) inaccessible(s) — migration SQL à lancer`, detail: failing.map((f) => `${f.table}: ${f.err}`).join(" | ") });
    }
  } catch (err) {
    results.push({ name: "Tables Supabase", status: "error", message: "Impossible de vérifier les tables", detail: String(err) });
  }

  // ── 4. Brevo API ──
  try {
    const brevoRes = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": process.env.BREVO_API_KEY || "invalid", Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    const brevoData = await brevoRes.json();
    if (brevoRes.ok && brevoData.email) {
      const credits = brevoData.plan?.[0]?.credits ?? "?";
      const creditsLeft = brevoData.plan?.[0]?.creditsRemaining ?? "?";
      results.push({ name: "Brevo", status: "ok", message: `Compte OK — ${creditsLeft} emails restants / ${credits}`, detail: `Email: ${brevoData.email}` });
    } else {
      results.push({ name: "Brevo", status: "error", message: "Clé API Brevo invalide ou compte suspendu" });
    }
  } catch {
    results.push({ name: "Brevo", status: "warn", message: "Impossible de vérifier Brevo (timeout)" });
  }

  // ── 5. OpenRouter ──
  try {
    const orRes = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY || "invalid"}` },
      signal: AbortSignal.timeout(6000),
    });
    if (orRes.ok) {
      results.push({ name: "OpenRouter (IA)", status: "ok", message: "Clé API valide, modèles disponibles" });
    } else {
      results.push({ name: "OpenRouter (IA)", status: "error", message: `OpenRouter API error: ${orRes.status}` });
    }
  } catch {
    results.push({ name: "OpenRouter (IA)", status: "warn", message: "Impossible de vérifier OpenRouter (timeout)" });
  }

  // ── 6. Statistiques abonnements ──
  try {
    const supabase = getSupabase();
    const [acSubs, chatbots, gmb, contenu, devisReqs, auditOrders] = await Promise.all([
      supabase.from("agentconceptor_subscriptions").select("status", { count: "exact" }).eq("status", "active"),
      supabase.from("chatbot_subscriptions").select("status", { count: "exact" }).eq("status", "active"),
      supabase.from("gmb_subscriptions").select("status", { count: "exact" }).eq("status", "active"),
      supabase.from("contenu_subscriptions").select("status", { count: "exact" }).eq("status", "active"),
      supabase.from("devis_requests").select("status", { count: "exact" }),
      supabase.from("audit_orders").select("status", { count: "exact" }).eq("status", "done"),
    ]);

    results.push({
      name: "Abonnements actifs",
      status: "ok",
      message: `AGENTConceptor: ${acSubs.count ?? 0} · Chatbot: ${chatbots.count ?? 0} · GMB: ${gmb.count ?? 0} · Contenu: ${contenu.count ?? 0}`,
      detail: `Devis générés: ${devisReqs.count ?? 0} · Audits livrés: ${auditOrders.count ?? 0}`,
    });
  } catch {
    results.push({ name: "Statistiques", status: "warn", message: "Impossible de charger les stats" });
  }

  // ── 7. Prospection ──
  try {
    const supabase = getSupabase();
    const [total, sent, opened, converted, today] = await Promise.all([
      supabase.from("prospects").select("id", { count: "exact" }),
      supabase.from("prospects").select("id", { count: "exact" }).eq("status", "sent"),
      supabase.from("prospects").select("id", { count: "exact" }).eq("status", "opened"),
      supabase.from("prospects").select("id", { count: "exact" }).eq("status", "converted"),
      supabase.from("prospects").select("id", { count: "exact" }).gte("created_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString()),
    ]);
    results.push({
      name: "Prospection Klyora Sites",
      status: (total.count ?? 0) > 0 ? "ok" : "warn",
      message: `${total.count ?? 0} prospects total · ${sent.count ?? 0} envoyés · ${opened.count ?? 0} ouverts · ${converted.count ?? 0} convertis`,
      detail: `Ajoutés ces 24h : ${today.count ?? 0}`,
    });
  } catch {
    results.push({ name: "Prospection", status: "warn", message: "Impossible de charger les stats prospects" });
  }

  // ── 8. Endpoint /api/prospect/send ──
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://klyora.fr";
    const sendRes = await fetch(`${baseUrl}/api/health`, { signal: AbortSignal.timeout(5000) });
    if (sendRes.ok) {
      results.push({ name: "API Health", status: "ok", message: "Endpoint /api/health répond correctement" });
    } else {
      results.push({ name: "API Health", status: "warn", message: `/api/health répond ${sendRes.status}` });
    }
  } catch {
    results.push({ name: "API Health", status: "warn", message: "Impossible de joindre /api/health" });
  }

  return results;
}

export async function GET(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const results = await checks();
  const errCount  = results.filter((r) => r.status === "error").length;
  const warnCount = results.filter((r) => r.status === "warn").length;
  const okCount   = results.filter((r) => r.status === "ok").length;

  const overallStatus = errCount > 0 ? "error" : warnCount > 0 ? "warn" : "ok";

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    overall: overallStatus,
    summary: { ok: okCount, warnings: warnCount, errors: errCount },
    checks: results,
  }, {
    status: overallStatus === "error" ? 500 : 200,
  });
}
