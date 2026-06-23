/**
 * POST /api/admin/bulk-prospect-garages?offset=0&limit=20&dry=1
 *
 * Itère sur les garages INDÉPENDANTS (filter franchise) et envoie le mail
 * pitch au patron via Brevo. Cascade INSEE + Pages Jaunes + mentions
 * légales pour trouver l'email.
 *
 * Rate-limit : 5 mails / 60s (Brevo Hobby tolère 100/jour).
 * Dry-run par défaut (?dry=0 pour vraiment envoyer).
 *
 * Auth : x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { analyzeGarageFranchise } from "@/lib/franchise-detector";
import { detectDominantBrandPalette } from "@/lib/brand-palette";
import { buildGaragePitchEmail } from "@/lib/garage-pitch-email";
import { getOrCreateAccessCode } from "@/lib/access-code";
import { findPatronEmail } from "@/lib/find-patron-email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

async function sendBrevoEmail(opts: { to: string; toName: string; subject: string; html: string; text: string }): Promise<{ ok: boolean; error?: string }> {
  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) return { ok: false, error: "no_brevo_key" };
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevoKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "Tom Bauer", email: "contact@klyora.fr" },
        to: [{ email: opts.to, name: opts.toName }],
        replyTo: { email: "contact@klyora.fr", name: "Tom Bauer" },
        subject: opts.subject,
        htmlContent: opts.html,
        textContent: opts.text,
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return { ok: false, error: `Brevo ${res.status}: ${t.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "send_failed" };
  }
}

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

export async function POST(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const offset = Math.max(0, parseInt(req.nextUrl.searchParams.get("offset") || "0", 10));
  const limit = Math.min(50, parseInt(req.nextUrl.searchParams.get("limit") || "20", 10));
  const dryRun = req.nextUrl.searchParams.get("dry") !== "0";

  const supabase = db();
  // Récupère les prospects qui ont un mockup garage-premium (= indépendants détectés)
  const { data, error } = await supabase
    .from("prospects")
    .select("id, slug, name, city, business_type, email, phone, website, site_style_dna, access_code")
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const list = data || [];

  const results: Array<Record<string, unknown>> = [];
  let sent = 0, skipped = 0, failed = 0;
  let mailsSinceLastBurst = 0;

  for (const p of list) {
    // Doit être garage
    const hay = `${p.business_type || ""} ${p.name || ""}`.toLowerCase();
    const isGar = /\b(garage|garagi|m[eé]canicien|carrosseri|concession|automobile|auto)\b/.test(hay);
    if (!isGar) { skipped++; continue; }
    // Doit être indépendant
    const fr = analyzeGarageFranchise(p.name);
    if (fr.isFranchise && fr.confidence > 0.7) { skipped++; results.push({ slug: p.slug, status: "skip_franchise", brand: fr.detectedBrand }); continue; }

    // Cascade email finder
    const emailRes = await findPatronEmail({
      garageName: p.name,
      city: p.city,
      websiteUrl: p.website,
      dbEmail: p.email,
    });
    if (!emailRes.email) {
      skipped++;
      results.push({ slug: p.slug, status: "skip_no_email", insee: emailRes.siren, patron: emailRes.patronName });
      continue;
    }

    // Build URL maquette
    let accessCode = p.access_code as string | null;
    if (!accessCode) accessCode = await getOrCreateAccessCode(p.id);
    const siteUrl = accessCode
      ? `https://klyora.fr/prospects/${p.slug}?code=${encodeURIComponent(accessCode)}`
      : `https://klyora.fr/prospects/${p.slug}`;

    // Vehicles count + top brand
    const dna = (p.site_style_dna || {}) as { detectedVehicles?: Array<{ title: string; image?: string }> };
    const vehicles = (dna.detectedVehicles || []).filter(v => v.image && v.image.startsWith("http"));
    const palette = detectDominantBrandPalette(dna.detectedVehicles || []);
    const topBrand = palette.vibe === "racing" ? null : palette.vibe;

    const pitch = buildGaragePitchEmail({
      garageName: p.name,
      city: p.city,
      vehicleCount: vehicles.length,
      topBrand,
      siteUrl,
    });

    if (dryRun) {
      results.push({ slug: p.slug, status: "dry_run", email: emailRes.email, source: emailRes.source, subject: pitch.subject });
      sent++;
      continue;
    }

    // SEND
    const sendRes = await sendBrevoEmail({
      to: emailRes.email,
      toName: p.name,
      subject: pitch.subject,
      html: pitch.htmlBody,
      text: pitch.textBody,
    });
    if (sendRes.ok) {
      sent++;
      results.push({ slug: p.slug, status: "sent", email: emailRes.email, source: emailRes.source });
    } else {
      failed++;
      results.push({ slug: p.slug, status: "failed", error: sendRes.error });
    }

    // Rate-limit : 5 mails / 60s
    mailsSinceLastBurst++;
    if (mailsSinceLastBurst >= 5 && !dryRun) {
      await sleep(60_000);
      mailsSinceLastBurst = 0;
    } else if (!dryRun) {
      await sleep(2_000);
    }
  }

  return NextResponse.json({
    success: true,
    offset, limit, dryRun,
    scanned: list.length,
    sent, skipped, failed,
    results,
  });
}

export const GET = POST;
