/**
 * POST /api/admin/send-access-codes
 * GET  /api/admin/send-access-codes?dry_run=1
 *
 * Envoie un mail "Voici votre code d'accès" à tous les prospects qui :
 *   - Ont un access_code généré
 *   - Ont déjà reçu un mail (sent_at IS NOT NULL)
 *   - Ne sont pas désabonnés / convertis
 *   - N'ont pas encore reçu le mail code (access_code_sent_at IS NULL)
 *
 * Idempotent : marque access_code_sent_at à chaque envoi réussi.
 * Auth : x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { sendBrevoEmail } from "@/lib/brevo-send";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

function buildEmail(p: { name: string; slug: string; access_code: string }) {
  const firstName = (p.name || "").split(" ")[0] || "";
  const url = `https://klyora.fr/prospects/${p.slug}`;
  const unsub = `https://klyora.fr/unsubscribe?slug=${p.slug}`;

  const subject = `${firstName}, votre code d'accès à votre maquette`;
  const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0F172A;line-height:1.6">
  <p>Bonjour ${firstName},</p>

  <p>Pour des raisons de confidentialité, votre maquette personnalisée est désormais protégée par un code d'accès.</p>

  <div style="background:#0F172A;color:#FFD700;padding:24px;border-radius:12px;text-align:center;margin:24px 0">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:8px">Votre code d'accès</div>
    <div style="font-size:32px;font-weight:800;letter-spacing:0.25em;font-family:'SFMono-Regular',ui-monospace,Menlo,monospace">${p.access_code}</div>
  </div>

  <p style="margin:28px 0">
    <a href="${url}" style="display:inline-block;background:#0066ff;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600">Accéder à ma maquette →</a>
  </p>

  <p style="font-size:13px;color:#475569">Sur la page, saisissez le code ci-dessus pour débloquer votre maquette.</p>

  <p>Bien cordialement,<br>Tom — <strong>Klyora Sites</strong><br><a href="mailto:contact@klyora.fr" style="color:#0F172A">contact@klyora.fr</a></p>

  <hr style="margin-top:32px;border:none;border-top:1px solid #E2E8F0">
  <p style="font-size:11px;color:#94A3B8;text-align:center"><a href="${unsub}" style="color:#94A3B8">Se désabonner</a></p>
</body></html>`;

  const textContent = `Bonjour ${firstName},

Pour des raisons de confidentialité, votre maquette est désormais protégée par un code d'accès.

Votre code : ${p.access_code}

Accédez à votre maquette : ${url}

(Sur la page, saisissez le code pour débloquer.)

Bien cordialement,
Tom — Klyora Sites
contact@klyora.fr

Se désabonner : ${unsub}`;

  return { subject, htmlContent, textContent, unsubscribeUrl: unsub };
}

async function handler(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dry_run") === "1";
  const supabase = db();

  const { data, error } = await supabase
    .from("prospects")
    .select("id, name, email, slug, access_code, status")
    .not("sent_at", "is", null)
    .not("access_code", "is", null)
    .is("access_code_sent_at", null)
    .is("unsubscribed_at", null)
    .neq("status", "converted")
    .not("email", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const eligible = data || [];
  if (dryRun) {
    return NextResponse.json({
      dry_run: true,
      eligible_count: eligible.length,
      sample: eligible.slice(0, 5).map((p) => ({ name: p.name, email: p.email, code: p.access_code })),
    });
  }

  let sent = 0;
  let failed = 0;
  const errors: Array<{ email: string; reason: string }> = [];
  const nowIso = new Date().toISOString();

  for (const p of eligible) {
    if (!p.slug || !p.access_code || !p.email) continue;
    const mail = buildEmail({ name: p.name || "", slug: p.slug, access_code: p.access_code });
    try {
      const ok = await sendBrevoEmail({
        to: p.email,
        toName: p.name,
        ...mail,
      });
      if (ok) {
        sent++;
        await supabase
          .from("prospects")
          .update({ access_code_sent_at: nowIso })
          .eq("id", p.id);
      } else {
        failed++;
        errors.push({ email: p.email, reason: "Brevo refusé" });
      }
    } catch (err) {
      failed++;
      errors.push({ email: p.email, reason: err instanceof Error ? err.message : "unknown" });
    }
  }

  return NextResponse.json({
    success: true,
    eligible_count: eligible.length,
    sent,
    failed,
    errors: errors.slice(0, 20),
  });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
