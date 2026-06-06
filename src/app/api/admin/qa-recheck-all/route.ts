/**
 * POST /api/admin/qa-recheck-all
 *
 * Re-passe TOUTES les maquettes existantes (status='ready' OU 'sent')
 * au crible du Gatekeeper DURCI (avec patterns META_INSTRUCTIONS).
 *
 * Pour chaque maquette qui maintenant échoue :
 *   - Marque status='error' (BLOQUÉE pour futurs envois)
 *   - Enregistre les issues dans qa_issues
 *   - Compte dans le rapport final
 *
 * Body : { dry_run?: boolean, limit?: number }
 *   - dry_run : si true, ne modifie rien, juste rapporte
 *   - limit   : max maquettes à analyser (défaut 500)
 *
 * Cadence : à lancer 1× après chaque mise à jour du Gatekeeper.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdminGuard } from "@/lib/security";
import { strictGatekeeper } from "@/lib/mockup-qa";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(req: NextRequest) {
  const guard = requireAdminGuard(req, { limit: 3, windowSec: 60, routeKey: "qa-recheck" });
  if (guard) return guard;

  let body: { dry_run?: boolean; limit?: number; include_sent?: boolean } = {};
  try { body = await req.json(); } catch { /* opt */ }

  const dryRun = body.dry_run !== false; // défaut = dry_run pour pas tout péter par accident
  const limit = Math.min(1000, Math.max(10, body.limit || 500));
  const includeSent = !!body.include_sent;

  const supabase = db();

  const statuses = includeSent ? ["ready", "sent", "opened"] : ["ready"];

  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, name, slug, city, business_type, phone, google_rating, mockup_html, status, qa_passed")
    .in("status", statuses)
    .not("mockup_html", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucune maquette à analyser" });
  }

  let newlyRejected = 0;
  let stillPassing = 0;
  let alreadyError = 0;
  const rejected_samples: Array<{ id: string; name: string; was_status: string; issues: string[] }> = [];

  for (const p of prospects) {
    if (!p.mockup_html) continue;

    const r = strictGatekeeper(p.mockup_html, {
      name: p.name,
      city: p.city || undefined,
      business_type: p.business_type || undefined,
      phone: p.phone || undefined,
      google_rating: p.google_rating || undefined,
    });

    if (r.pass) {
      stillPassing++;
      // On garantit que qa_passed=true (si avant c'était NULL ou false)
      if (!dryRun && p.qa_passed !== true) {
        await supabase.from("prospects").update({
          qa_passed: true,
          qa_issues: r.warnings,
          qa_checked_at: new Date().toISOString(),
        }).eq("id", p.id);
      }
    } else {
      if (p.status === "error") {
        alreadyError++;
      } else {
        newlyRejected++;
        if (rejected_samples.length < 15) {
          rejected_samples.push({
            id: p.id,
            name: p.name,
            was_status: p.status,
            issues: r.blocking_issues.slice(0, 4),
          });
        }
        if (!dryRun) {
          // ⚠️ Marque status='error' → ne sera plus envoyée par Sniper ni autres workflows
          await supabase.from("prospects").update({
            status: "error",
            qa_passed: false,
            qa_issues: r.blocking_issues,
            qa_checked_at: new Date().toISOString(),
          }).eq("id", p.id);
        }
      }
    }
  }

  // Telegram notif si pas dry_run et qu'on a rejeté du contenu
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat && !dryRun && newlyRejected > 0) {
    const sampleList = rejected_samples.slice(0, 5).map((s) =>
      `• <b>${s.name}</b> (${s.was_status}) → ${s.issues.slice(0, 2).join(" / ")}`
    ).join("\n");
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text: `🛡️ <b>QA Recheck rétroactif</b>\n\n` +
              `✅ Toujours OK : ${stillPassing}\n` +
              `🆕 Nouvellement rejetées : ${newlyRejected}\n` +
              `❌ Déjà en erreur : ${alreadyError}\n\n` +
              `<b>Exemples rejetés :</b>\n${sampleList}\n\n` +
              `Ces maquettes ne partiront plus jusqu'à régénération nocturne.`,
        parse_mode: "HTML",
      }),
    }).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    dry_run: dryRun,
    processed: prospects.length,
    still_passing: stillPassing,
    newly_rejected: newlyRejected,
    already_error: alreadyError,
    rejected_samples,
    next_step: dryRun
      ? "Re-lance avec { dry_run: false } pour appliquer les rejets en DB."
      : "Les maquettes rejetées sont en status=error. Lance regenerate-mockup la prochaine fenêtre nocturne (20h-5h) pour les régénérer.",
  });
}

export async function GET(req: NextRequest) { return POST(req); }
