/**
 * POST /api/admin/resend-direct-link
 *
 * RELANCE CRITIQUE — envoie un mail "votre lien direct" aux prospects qui :
 *   - Ont OUVERT le mail initial (opened_at NOT NULL)
 *   - N'ont JAMAIS saisi le code (access_code_first_unlocked_at IS NULL)
 *   - Ne sont pas désabonnés / convertis
 *   - Ont un access_code
 *
 * Le lien contient ?code=XXXX-XXXX → 1 clic = maquette ouverte (gate auto-unlock).
 * Marque dans la DB pour éviter double envoi : direct_link_sent_at.
 *
 * Auth : x-admin-key
 * Query : ?dry_run=1
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
  const directUrl = `https://klyora.fr/prospects/${p.slug}?code=${encodeURIComponent(p.access_code)}`;
  const unsub = `https://klyora.fr/unsubscribe?slug=${p.slug}`;

  const subject = `${firstName}, votre maquette en 1 clic`;

  const htmlContent = `<!DOCTYPE html>
<html lang="fr"><head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:600px;margin:0 auto;padding:24px;color:#0F172A;line-height:1.7">
  <p>Bonjour ${firstName},</p>

  <p>J'ai vu que vous avez ouvert mon précédent mail mais que vous n'aviez pas eu le temps d'aller voir la maquette de votre site web.</p>

  <p>Pour vous simplifier la vie, voici un <strong>lien direct</strong> qui vous emmène
  sur votre maquette en <strong>1 seul clic</strong>, sans code à saisir :</p>

  <p style="margin:28px 0;text-align:center">
    <a href="${directUrl}" style="display:inline-block;background:#0066ff;color:#fff;padding:16px 36px;border-radius:8px;text-decoration:none;font-weight:700;font-size:16px">
      Voir ma maquette →
    </a>
  </p>

  <p style="font-size:13px;color:#475569">
    La maquette est personnalisée à votre nom et à votre métier.
    Vous y retrouverez votre adresse, vos coordonnées, et un design pensé pour votre activité.
    Si elle vous plaît, vous pouvez commander directement depuis la page (Stripe sécurisé,
    paiement en 3 fois sans frais possible).
  </p>

  <p>Si vous avez des questions, répondez simplement à ce mail.</p>

  <p>À bientôt,<br>
  Tom — <strong>Klyora Sites</strong><br>
  <a href="mailto:contact@klyora.fr" style="color:#0066ff">contact@klyora.fr</a></p>

  <hr style="margin-top:32px;border:none;border-top:1px solid #E2E8F0">
  <p style="font-size:11px;color:#94A3B8;text-align:center">
    <a href="${unsub}" style="color:#94A3B8">Se désabonner</a>
  </p>
</body></html>`;

  const textContent = `Bonjour ${firstName},

J'ai vu que vous avez ouvert mon précédent mail mais que vous n'aviez pas eu le temps d'aller voir la maquette.

Voici un lien direct qui vous emmène sur votre maquette en 1 clic, sans code à saisir :

${directUrl}

La maquette est personnalisée à votre nom et à votre métier. Si elle vous plaît, vous pouvez commander directement depuis la page.

À bientôt,
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
    .select("id, name, email, slug, access_code")
    .not("opened_at", "is", null)
    .is("access_code_first_unlocked_at", null)
    .not("access_code", "is", null)
    .is("unsubscribed_at", null)
    .neq("status", "converted")
    .is("direct_link_sent_at", null)
    .not("email", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const eligible = data || [];
  if (dryRun) {
    return NextResponse.json({
      dry_run: true,
      eligible_count: eligible.length,
      sample: eligible.slice(0, 5).map((p) => ({
        name: p.name,
        email: p.email,
        url: `https://klyora.fr/prospects/${p.slug}?code=${p.access_code}`,
      })),
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
          .update({ direct_link_sent_at: nowIso })
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
