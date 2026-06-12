/**
 * GET /api/admin/notify-domain-migration?dry_run=1
 * POST /api/admin/notify-domain-migration
 *
 * Envoie à tous les prospects ACTIFS un mail unique les informant que
 * leur maquette est désormais hébergée sur klyora.fr (et non plus webconceptor.fr).
 *
 * Critères "actif" :
 *   - sent_at IS NOT NULL  (mail initial déjà envoyé)
 *   - converted_at IS NULL (pas encore client)
 *   - unsubscribed_at IS NULL (pas désabonné)
 *   - migration_notified_at IS NULL (pas déjà notifié par cette route)
 *   - slug IS NOT NULL (maquette existe)
 *
 * Auth : x-admin-key
 * dry_run=1 → ne fait QUE compter, n'envoie pas
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

function buildMigrationEmail(prospect: { name: string; slug: string }) {
  const firstName = prospect.name.split(" ")[0] || "";
  const newUrl = `https://klyora.fr/prospects/${prospect.slug}`;
  const unsubscribeUrl = `https://klyora.fr/unsubscribe?slug=${prospect.slug}`;

  const subject = `${firstName}, votre maquette change d'adresse`;

  const htmlContent = `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>${subject}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #0F172A; line-height: 1.6;">
  <p>Bonjour ${firstName},</p>

  <p>Suite à l'évolution de notre marque, notre site change de nom et passe désormais sous <strong>Klyora</strong>.</p>

  <p>Votre maquette personnalisée est <strong>toujours disponible</strong>, simplement à une nouvelle adresse :</p>

  <p style="margin: 28px 0;">
    <a href="${newUrl}"
       style="display: inline-block; background: #0F172A; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600;">
      Voir ma maquette
    </a>
  </p>

  <p style="font-size: 14px; color: #475569;">
    Lien direct : <a href="${newUrl}" style="color: #0F172A;">${newUrl}</a>
  </p>

  <p>L'ancien lien <em>webconceptor.fr</em> sera désactivé dans les prochains jours. Pensez à enregistrer la nouvelle adresse.</p>

  <p>Bien cordialement,<br>
  Tom — <strong>Klyora Sites</strong><br>
  <a href="mailto:contact@klyora.fr" style="color: #0F172A;">contact@klyora.fr</a></p>

  <hr style="margin-top: 32px; border: none; border-top: 1px solid #E2E8F0;">
  <p style="font-size: 11px; color: #94A3B8; text-align: center;">
    <a href="${unsubscribeUrl}" style="color: #94A3B8;">Se désabonner</a>
  </p>
</body>
</html>`;

  const textContent = `Bonjour ${firstName},

Suite à l'évolution de notre marque, notre site change de nom et passe désormais sous Klyora.

Votre maquette personnalisée est toujours disponible à cette nouvelle adresse :
${newUrl}

L'ancien lien webconceptor.fr sera désactivé dans les prochains jours.

Bien cordialement,
Tom — Klyora Sites
contact@klyora.fr

Se désabonner : ${unsubscribeUrl}`;

  return { subject, htmlContent, textContent, unsubscribeUrl };
}

async function handler(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dry_run") === "1";
  const supabase = db();

  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, name, email, slug")
    .not("sent_at", "is", null)
    .is("converted_at", null)
    .is("unsubscribed_at", null)
    .is("migration_notified_at", null)
    .not("slug", "is", null)
    .not("email", "is", null);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const eligible = prospects || [];

  if (dryRun) {
    return NextResponse.json({
      dry_run: true,
      eligible_count: eligible.length,
      sample: eligible.slice(0, 5).map(p => ({
        name: p.name,
        email: p.email,
        new_url: `https://klyora.fr/prospects/${p.slug}`,
      })),
    });
  }

  let sent = 0;
  let failed = 0;
  const errors: Array<{ email: string; reason: string }> = [];
  const nowIso = new Date().toISOString();

  for (const p of eligible) {
    const { subject, htmlContent, textContent, unsubscribeUrl } = buildMigrationEmail({
      name: p.name || "",
      slug: p.slug,
    });

    try {
      const ok = await sendBrevoEmail({
        to: p.email,
        toName: p.name,
        subject,
        htmlContent,
        textContent,
        unsubscribeUrl,
      });

      if (ok) {
        sent++;
        await supabase
          .from("prospects")
          .update({ migration_notified_at: nowIso })
          .eq("id", p.id);
      } else {
        failed++;
        errors.push({ email: p.email, reason: "Brevo refusé" });
      }
    } catch (err) {
      failed++;
      errors.push({
        email: p.email,
        reason: err instanceof Error ? err.message : "unknown",
      });
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
