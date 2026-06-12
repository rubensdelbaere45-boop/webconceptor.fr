/**
 * POST /api/admin/director-onboard — Pipeline Cheval de Troie Klyora Director
 *
 * Étapes :
 *   1. Cible des prospects qualifiés (qa_passed=true, profilés, avec email)
 *   2. Pour chaque, crée un compte Supabase Auth avec mot de passe TEMPORAIRE aléatoire
 *   3. Insert dans director_accounts avec is_first_login=true + 100 crédits offerts
 *   4. Envoie un email Brevo signé "Tom" avec identifiants et lien /director/login
 *   5. Marque le prospect onboarded
 *
 * Cadence : 30 prospects/run. Cron N8N tous les soirs 22h Paris.
 * Couvre-feu : 5h-22h (les emails partent en jour, pas en nuit).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, isWithinSendingHours, requireAdminGuard } from "@/lib/security";
import crypto from "node:crypto";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/** Génère un mot de passe temporaire mémorisable. */
function genTempPassword(): string {
  const words = ["Tom", "Director", "Pilote", "Cible", "Boost", "Velo", "Plage", "Soleil"];
  const w = words[Math.floor(Math.random() * words.length)];
  const n = Math.floor(1000 + Math.random() * 9000);
  const sym = ["!", "#", "$", "&", "@"][Math.floor(Math.random() * 5)];
  return `${w}${n}${sym}`;
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

/* ──────── Email "Cheval de Troie" signé Tom ──────── */

function buildOnboardEmail(args: {
  firstName: string;
  businessName: string;
  email: string;
  tempPassword: string;
  loginUrl: string;
}): { subject: string; html: string; text: string } {
  const { firstName, businessName, email, tempPassword, loginUrl } = args;

  const subject = `${firstName}, le tableau de bord de ${businessName} est prêt`;

  const text = `Bonjour,

J'ai préparé pour ${businessName} un tableau de bord personnalisé qui rassemble :

  • L'analyse de votre visibilité actuelle sur Google
  • Les actions prioritaires pour gagner des clients en ligne
  • Les leviers publicitaires (Google Ads, Meta) en 1 clic
  • Mes agents IA pour gérer la réputation et le SEO automatiquement

Vous avez 100 crédits offerts pour démarrer (suffisant pour lancer 1 campagne ou activer 1 agent).

Accès :
  → ${loginUrl}
  Email : ${email}
  Mot de passe temporaire : ${tempPassword}

À la 1ère connexion, vous changerez ce mot de passe. C'est rapide.

Si vous avez une question : répondez à cet email ou appelez 06 35 59 24 71.

Tom — Klyora Sites`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:580px;margin:0 auto;padding:24px;color:#1a1a1a;line-height:1.6;background:#f9f9f9">

<div style="background:linear-gradient(135deg,#0a0a0a 0%,#1a1a2e 100%);color:#fff;padding:32px 28px;border-radius:14px;margin-bottom:24px">
  <div style="font-size:11px;letter-spacing:0.2em;text-transform:uppercase;color:#FFD700;margin-bottom:6px">KLYORA SITES DIRECTOR</div>
  <h1 style="font-size:24px;margin:0 0 8px;font-weight:800">${escapeHtml(firstName)}, votre tableau de bord est prêt</h1>
  <div style="font-size:14px;color:#ccc">Préparé pour ${escapeHtml(businessName)}</div>
</div>

<p style="font-size:15px">J'ai préparé pour <strong>${escapeHtml(businessName)}</strong> un espace personnalisé qui rassemble :</p>

<ul style="font-size:14px;line-height:1.8">
  <li>L'analyse de votre visibilité actuelle sur Google</li>
  <li>Les actions prioritaires pour gagner des clients en ligne</li>
  <li>Les leviers publicitaires (Google Ads, Meta) en 1 clic</li>
  <li>Mes agents IA pour gérer la réputation et le SEO automatiquement</li>
</ul>

<div style="background:#FFFBEA;border:1px solid #FFE0A3;border-radius:10px;padding:16px;margin:20px 0">
  <div style="font-size:13px;color:#92400e">🎁 <strong>100 crédits offerts</strong> pour démarrer<br><span style="font-size:12px;color:#a16207">Suffisant pour lancer 1 campagne ou activer 1 agent IA.</span></div>
</div>

<div style="background:#0a0a0a;color:#fff;padding:18px 20px;border-radius:10px;margin:20px 0;font-family:'Courier New',monospace;font-size:13px">
  <div style="color:#FFD700;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:8px">ACCÈS</div>
  Email : <strong>${escapeHtml(email)}</strong><br>
  Mot de passe temporaire : <strong style="color:#FFD700">${escapeHtml(tempPassword)}</strong>
</div>

<p style="text-align:center;margin:24px 0">
<a href="${loginUrl}" style="display:inline-block;padding:14px 32px;background:#FFD700;color:#0a0a0a;text-decoration:none;font-weight:800;border-radius:100px;letter-spacing:0.06em;text-transform:uppercase;font-size:13px">Ouvrir mon tableau de bord →</a>
</p>

<p style="font-size:13px;color:#666;text-align:center">À la 1ère connexion, vous changerez ce mot de passe. C'est rapide.</p>

<p style="margin-top:30px;font-size:14px">Si vous avez une question : répondez à cet email ou appelez <strong>06 35 59 24 71</strong>.</p>

<p style="margin-top:18px">Tom<br><span style="color:#777;font-size:12px">Klyora Sites</span></p>

</body></html>`;

  return { subject, html, text };
}

async function sendBrevoEmail(to: string, name: string, subject: string, html: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, error: "BREVO_API_KEY manquante" };
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Tom — Klyora Sites", email: "contact@klyora.fr" },
        replyTo: { name: "Tom", email: "contact@klyora.fr" },
        to: [{ email: to, name }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
      signal: AbortSignal.timeout(20_000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, error: `Brevo HTTP ${res.status}: ${t.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "network" };
  }
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY) && !safeCompare(cronSecret, process.env.CRON_SECRET)) {
    const guard = requireAdminGuard(req, { limit: 5, windowSec: 60, routeKey: "director-onboard" });
    if (guard) return guard;
  }

  // Couvre-feu : on n'envoie pas la nuit (les comptes sont créés mais email retient)
  let body: { limit?: number; force_send?: boolean } = {};
  try { body = await req.json(); } catch { /* opt */ }
  const limit = Math.min(100, Math.max(1, body.limit || 30));
  const respectCurfew = !body.force_send;

  if (respectCurfew && !isWithinSendingHours(5, 22)) {
    return NextResponse.json({ success: true, processed: 0, skipped_curfew: true });
  }

  const supabase = db();

  // Cible : prospects QA-passés, profilés, avec email, jamais onboardés
  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, name, slug, email, city, business_type, phone, custom_hook, sales_angle")
    .eq("qa_passed", true)
    .not("email", "is", null)
    .not("custom_hook", "is", null)
    .is("director_onboarded_at", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun prospect à onboarder" });
  }

  const origin = req.nextUrl.origin;
  let created = 0, emailed = 0, errors = 0, skipped = 0;
  const sample: Array<{ email: string; business: string }> = [];

  for (const p of prospects) {
    if (!p.email) { skipped++; continue; }

    try {
      // 1) Cherche si compte Auth existe déjà
      const { data: existingList } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      const existing = existingList?.users.find((u) => u.email?.toLowerCase() === p.email!.toLowerCase());

      let authUserId: string | undefined = existing?.id;
      let tempPassword = "";

      if (!existing) {
        // 2) Crée compte Supabase Auth
        tempPassword = genTempPassword();
        const { data: createRes, error: createErr } = await supabase.auth.admin.createUser({
          email: p.email,
          password: tempPassword,
          email_confirm: true,
          user_metadata: { business_name: p.name, source: "director_onboard", phone: p.phone || null },
        });
        if (createErr || !createRes?.user) {
          errors++;
          continue;
        }
        authUserId = createRes.user.id;
      } else {
        // Cas où le user existe (re-onboard) : reset password
        tempPassword = genTempPassword();
        await supabase.auth.admin.updateUserById(existing.id, { password: tempPassword });
      }

      if (!authUserId) { errors++; continue; }

      // 3) Insert director_accounts (idempotent)
      const { error: accErr } = await supabase.from("director_accounts").upsert({
        auth_user_id: authUserId,
        prospect_id: p.id,
        email: p.email,
        business_name: p.name,
        business_type: p.business_type,
        city: p.city,
        phone: p.phone,
        is_first_login: true,
        tokens_balance: 100,
        temporary_password_used: false,
      }, { onConflict: "auth_user_id" });

      if (accErr) {
        errors++;
        continue;
      }
      created++;

      // 4) Email
      const firstName = (p.name || "").split(/[ -]/)[0] || "Bonjour";
      const tpl = buildOnboardEmail({
        firstName,
        businessName: p.name,
        email: p.email,
        tempPassword,
        loginUrl: `${origin}/director/login`,
      });
      const r = await sendBrevoEmail(p.email, p.name, tpl.subject, tpl.html, tpl.text);
      if (r.ok) {
        emailed++;
        await supabase.from("director_accounts").update({ welcome_email_sent_at: new Date().toISOString() }).eq("auth_user_id", authUserId);
        if (sample.length < 5) sample.push({ email: p.email, business: p.name });
      } else {
        errors++;
      }

      // 5) Marque prospect comme onboardé
      await supabase.from("prospects").update({ director_onboarded_at: new Date().toISOString() }).eq("id", p.id);

      await new Promise(r => setTimeout(r, 400));
    } catch {
      errors++;
    }
  }

  // Telegram récap
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat && created > 0) {
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: `🐴 <b>Cheval de Troie Klyora Director</b>\n\n✅ Comptes créés : <b>${created}</b>\n📧 Emails envoyés : <b>${emailed}</b>\n❌ Erreurs : ${errors}\n\nLes prospects vont recevoir leur accès et changer leur mdp.`,
        parse_mode: "HTML",
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, processed: prospects.length, created, emailed, errors, skipped, sample });
}

export async function GET(req: NextRequest) { return POST(req); }

// Suppression d'un import inutile mais préservation de crypto pour usage potentiel
void crypto;
