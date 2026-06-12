/**
 * POST /api/prospect/closer-opened
 *
 * "Closer les 191" — workflow BOFU (Bottom of Funnel).
 * Cible UNIQUEMENT les prospects status='opened' (ont cliqué sur la maquette)
 * et qui n'ont PAS encore reçu d'email closer.
 *
 * Angle : urgence + offre partenaire (frais de setup OFFERTS si abonnement
 * mensuel pris avant vendredi).
 *
 * Cadence stricte : max 50 prospects / appel (volume contrôlé pour
 * délivrabilité). Le cron N8N peut tourner plusieurs fois / jour pour
 * étaler.
 *
 * Auth : x-admin-key OU x-cron-secret
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, isWithinSendingHours, escapeTelegram } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

interface Prospect {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  city: string | null;
  business_type: string | null;
  opened_at: string | null;
}

function buildCloserEmail(p: Prospect): { subject: string; html: string; text: string } {
  // Vendredi prochain (= deadline urgence)
  const now = new Date();
  const day = now.getDay(); // 0=dim, 5=ven
  const daysUntilFriday = day <= 5 ? 5 - day : 12 - day; // si on est sam ou dim → vendredi suivant
  const friday = new Date(now);
  friday.setDate(now.getDate() + daysUntilFriday);
  const fridayStr = friday.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  const mockupUrl = `https://webconceptor.fr/prospects/${p.slug}`;
  const firstName = p.name.split(/[ -]/)[0];

  const subject = `${firstName}, frais de setup offerts si abonnement avant ${fridayStr.split(" ")[0]}`;

  const text = `Bonjour,

Je vois que vous avez ouvert la maquette que je vous ai préparée pour ${p.name} — merci !

J'ai une offre limitée à ${fridayStr} :

→ Les frais de setup (320 € pour le site Simple, 860 € en Luxury) sont OFFERTS si vous démarrez avec l'abonnement mensuel cette semaine.

Vous payez juste 17,90 €/mois (193 €/an si annuel) pour l'hébergement + maintenance + modifications illimitées.

→ Voir votre maquette : ${mockupUrl}

Pourquoi cette offre ? Je teste un nouveau module d'analytics que je veux roder avec 5 clients cette semaine — vous êtes parmi les profils que j'ai sélectionnés.

Si vous êtes intéressé, répondez simplement à cet email ou appelez-moi au 06 35 59 24 71.

Tom — Klyora Sites`;

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;max-width:580px;margin:0 auto;padding:20px;color:#1a1a1a;background:#fff">

<p>Bonjour,</p>

<p>Je vois que vous avez ouvert la maquette que je vous ai préparée pour <strong>${escapeHtml(p.name)}</strong> — merci d'y avoir jeté un œil.</p>

<div style="background:#fef3c7;border-left:4px solid #f59e0b;padding:16px;margin:18px 0;border-radius:4px">
<p style="margin:0 0 8px;font-weight:700;color:#92400e">⏰ Offre limitée jusqu'au ${escapeHtml(fridayStr)}</p>
<p style="margin:0;font-size:15px">→ Les <strong>frais de setup (320 € en Simple, 860 € en Luxury) sont OFFERTS</strong> si vous démarrez avec l'abonnement mensuel cette semaine.</p>
</div>

<p>Vous payez juste <strong>17,90 €/mois</strong> (45 €/mois si annuel) pour :</p>
<ul style="font-size:14px;line-height:1.7">
  <li>Hébergement + sauvegardes + SSL</li>
  <li>Modifications illimitées sur le site</li>
  <li>Support prioritaire 24h</li>
  <li>Sans engagement, résiliable à tout moment</li>
</ul>

<p style="text-align:center;margin:24px 0">
<a href="${mockupUrl}" style="display:inline-block;padding:14px 28px;background:#0a0a0a;color:#FFD700;text-decoration:none;font-weight:800;border-radius:100px;letter-spacing:0.06em;text-transform:uppercase;font-size:13px">Revoir ma maquette →</a>
</p>

<p style="font-size:13px;color:#555">Pourquoi cette offre ? Je teste un nouveau module d'analytics que je veux roder avec 5 clients cette semaine — votre profil correspond à ce que je cherche.</p>

<p style="font-size:13px">Si vous êtes intéressé, <strong>répondez simplement à cet email</strong> ou appelez-moi au <strong>06 35 59 24 71</strong>.</p>

<p style="margin-top:24px">— Tom<br><span style="color:#777;font-size:12px">Klyora Sites</span></p>

</body></html>`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

async function sendBrevoEmail(to: string, name: string, subject: string, html: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, error: "BREVO_API_KEY manquante" };
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Tom — Klyora Sites", email: "tom@webconceptor.fr" },
        replyTo: { name: "Tom", email: "tom@webconceptor.fr" },
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
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  // Couvre-feu (cohérent avec autres routes email : 5h-19h Paris)
  if (!isWithinSendingHours(5, 19)) {
    return NextResponse.json({ success: true, processed: 0, skipped_curfew: true });
  }

  const supabase = db();
  const MAX_PER_RUN = 250; // cadence : 50 par run

  // Cible : status='opened' + closer_sent_at IS NULL + email valide
  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, name, slug, email, city, business_type, opened_at")
    .eq("status", "opened")
    .is("closer_sent_at", null)
    .not("email", "is", null)
    .order("opened_at", { ascending: false })
    .limit(MAX_PER_RUN);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun lead à closer" });
  }

  let sent = 0;
  let errors = 0;
  const results: Array<{ id: string; name: string; status: string; error?: string }> = [];

  for (const p of prospects) {
    if (!p.email) continue;
    const { subject, html, text } = buildCloserEmail(p as Prospect);
    const r = await sendBrevoEmail(p.email, p.name, subject, html, text);
    if (r.ok) {
      sent++;
      await supabase.from("prospects").update({ closer_sent_at: new Date().toISOString() }).eq("id", p.id);
      results.push({ id: p.id, name: p.name, status: "sent" });
    } else {
      errors++;
      // marque aussi pour pas retry infini
      await supabase.from("prospects").update({ closer_sent_at: new Date().toISOString() }).eq("id", p.id);
      results.push({ id: p.id, name: p.name, status: "error", error: r.error });
    }
    // Petit délai entre emails pour pas surcharger Brevo
    await new Promise(r => setTimeout(r, 350));
  }

  // Telegram résumé
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId && results.length > 0) {
    const msg =
      `💰 <b>Closer les leads chauds (status=opened)</b>\n\n` +
      `<b>Envoyés :</b> ${sent}\n` +
      `<b>Erreurs :</b> ${errors}\n\n` +
      `Angle : frais setup offerts si abonnement avant vendredi.`;
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "HTML", disable_notification: true }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, processed: prospects.length, sent, errors, results });
}

export async function GET(req: NextRequest) { return POST(req); }
