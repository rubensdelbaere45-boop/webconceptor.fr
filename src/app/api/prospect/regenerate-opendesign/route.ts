/**
 * POST /api/prospect/regenerate-opendesign
 *
 * Régénère les maquettes avec le générateur Open Design (gratuit, illimité).
 * Cible les prospects RÉCEMMENT ouverts/envoyés (≤ N jours) qui ont encore
 * un ancien template moche (pas Stitch, pas opendesign).
 *
 * N'envoie AUCUN email. Le but : si le prospect revient sur sa maquette,
 * il voit la nouvelle version premium.
 *
 * Auth : x-admin-key uniquement.
 *
 * Body :
 *   { days?: number, limit?: number, dry_run?: boolean }
 *     days     = fenêtre d'ouverture en jours (défaut 30)
 *     limit    = nombre max de prospects par run (défaut 50, max 200)
 *     dry_run  = ne sauvegarde rien, retourne juste la liste cible
 *
 * Retourne :
 *   { ok, processed, regenerated, errors, results: [...] }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, isBusinessTypeCoherent } from "@/lib/security";
import { generateOpenDesignMockup } from "@/lib/mockup-opendesign";
import { buildContentFromProspect } from "@/lib/build-opendesign-content";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

export async function POST(req: NextRequest) {
  // ── Auth ────────────────────────────────────────────────
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY) && !safeCompare(cronSecret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Body ───────────────────────────────────────────────
  let raw: Record<string, unknown> = {};
  try { raw = await req.json(); } catch { /* body vide accepté */ }

  // ⚠️ COUVRE-FEU NUIT — la génération OpenDesign tourne UNIQUEMENT entre
  // 20h et 5h Paris (sauf override raw.force = true).
  if (!raw.force) {
    const { isWithinNightGenerationWindow, nightWindowStatus } = await import("@/lib/night-window");
    if (!isWithinNightGenerationWindow()) {
      const st = nightWindowStatus();
      return NextResponse.json({
        success: true,
        processed: 0,
        skipped_curfew: true,
        message: `Couvre-feu nuit (${st.window}). Heure actuelle ${st.current_hour}h.`,
      });
    }
  }

  const days = Math.min(90, Math.max(1, Math.floor(Number(raw.days) || 30)));
  const limit = Math.min(200, Math.max(1, Math.floor(Number(raw.limit) || 50)));
  const dryRun = Boolean(raw.dry_run);

  // ── Sélection des cibles ─────────────────────────────
  const supabase = db();
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  // Critères :
  //  - status in (opened, sent, replied) → prospect actif
  //  - opened_at >= cutoff               → ouvert récemment
  //  - stitch_generated = false          → pas déjà Stitch (qu'on ne touche pas)
  //  - mockup_html NOT NULL              → a une maquette existante
  //  - email NOT NULL                    → vrai prospect
  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, slug, name, city, business_type, phone, email, google_rating, google_reviews_count, about_scraped, hours, reviews, menu_items, status")
    .in("status", ["opened", "sent", "replied"])
    .gte("opened_at", cutoff)
    .eq("stitch_generated", false)
    .not("mockup_html", "is", null)
    .not("email", "is", null)
    .order("opened_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "DB query failed", detail: error.message }, { status: 500 });
  }
  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ ok: true, processed: 0, regenerated: 0, errors: 0, message: "Aucun prospect à régénérer" });
  }

  // ── Génération ─────────────────────────────────────────
  const results: Array<{ id: string; name: string; status: string; reason?: string }> = [];
  let regenerated = 0;
  let errors = 0;
  const origin = req.nextUrl.origin || "https://klyora.fr";

  for (const p of prospects) {
    // Garde-fou métier : si le nom révèle un métier ≠ business_type → on saute
    if (!isBusinessTypeCoherent(p.name || "", p.business_type || "")) {
      results.push({ id: p.id, name: p.name || "?", status: "skipped_type_mismatch" });
      continue;
    }

    try {
      const content = buildContentFromProspect({
        name: p.name || "",
        city: p.city,
        business_type: p.business_type,
        about_scraped: p.about_scraped,
        menu_items: p.menu_items,
      });

      const html = generateOpenDesignMockup({
        name: p.name || "",
        city: p.city || undefined,
        phone: p.phone || undefined,
        email: p.email || undefined,
        business_type: p.business_type || undefined,
        google_rating: p.google_rating || undefined,
        google_reviews_count: p.google_reviews_count || undefined,
        about_scraped: p.about_scraped || undefined,
        hours: p.hours || undefined,
        reviews: p.reviews || undefined,
      }, content, origin);

      if (!html || html.length < 2000) {
        errors++;
        results.push({ id: p.id, name: p.name || "?", status: "error", reason: "HTML trop court" });
        continue;
      }

      if (!dryRun) {
        const { error: updErr } = await supabase
          .from("prospects")
          .update({
            mockup_html: html,
            updated_at: new Date().toISOString(),
          })
          .eq("id", p.id);

        if (updErr) {
          errors++;
          results.push({ id: p.id, name: p.name || "?", status: "error", reason: updErr.message });
          continue;
        }
      }

      regenerated++;
      results.push({ id: p.id, name: p.name || "?", status: dryRun ? "would_regenerate" : "regenerated" });
    } catch (e) {
      errors++;
      results.push({
        id: p.id,
        name: p.name || "?",
        status: "error",
        reason: e instanceof Error ? e.message.slice(0, 100) : "unknown",
      });
    }
  }

  return NextResponse.json({
    ok: true,
    processed: prospects.length,
    regenerated,
    errors,
    dry_run: dryRun,
    cutoff_days: days,
    results: results.slice(0, 100), // limite la réponse
  });
}
