/**
 * POST /api/admin/prospect-garage?slug=XXX[&send=1]
 *
 * Pipeline complet de prospection pour 1 garage indépendant :
 *  1. Analyse franchise (skip si franchise officielle)
 *  2. Lit le DNA scrapé en DB
 *  3. Détecte la marque dominante depuis les vehicles
 *  4. Génère la maquette enriched avec la palette sport adaptée
 *  5. Génère le mail de pitch humain
 *  6. Retourne preview (subject + html + url maquette) + dry-run par défaut
 *  7. ?send=1 → envoie réellement via Brevo
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

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const slug = req.nextUrl.searchParams.get("slug") || "";
  const send = req.nextUrl.searchParams.get("send") === "1";
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

  const supabase = db();
  const { data: p } = await supabase
    .from("prospects")
    .select("id, slug, name, city, business_type, email, phone, website, site_style_dna, access_code")
    .eq("slug", slug)
    .maybeSingle();
  if (!p) return NextResponse.json({ error: "prospect introuvable" }, { status: 404 });

  // 1. Analyse franchise
  const franchiseAnalysis = analyzeGarageFranchise(p.name);
  if (franchiseAnalysis.isFranchise && franchiseAnalysis.confidence > 0.7) {
    return NextResponse.json({
      success: false,
      skipped: "franchise",
      analysis: franchiseAnalysis,
      message: `${p.name} semble être une concession franchise (cible non prioritaire pour la prospection).`,
    });
  }

  // 2. Lecture DNA
  const dna = (p.site_style_dna || {}) as {
    detectedVehicles?: Array<{ title: string; price?: string; image?: string }>;
    primaryColor?: string;
  };
  const vehicles = dna.detectedVehicles || [];
  const vehiclesWithImage = vehicles.filter(v => v.image && v.image.startsWith("http"));

  // 3. Détection palette sport
  const palette = detectDominantBrandPalette(vehicles);
  const topBrand = (() => {
    const counts: Record<string, number> = {};
    for (const v of vehicles) {
      const m = (v.title || "").match(/\b(Mercedes|BMW|Audi|Volkswagen|Peugeot|Renault|Citroën|Ford|Opel|Fiat|Toyota|Honda|Nissan|Tesla|Porsche|Ferrari|Lamborghini|Maserati|Bugatti)\b/i);
      if (m) counts[m[1]] = (counts[m[1]] || 0) + 1;
    }
    const sorted = Object.entries(counts).sort(([, a], [, b]) => b - a);
    return sorted.length ? sorted[0][0] : null;
  })();

  // 4. URL maquette + access code (auto-unlock)
  let accessCode = p.access_code as string | null;
  if (!accessCode) accessCode = await getOrCreateAccessCode(p.id);
  const siteUrl = accessCode
    ? `https://klyora.fr/prospects/${p.slug}?code=${encodeURIComponent(accessCode)}`
    : `https://klyora.fr/prospects/${p.slug}`;

  // 5. Génère le mail pitch
  const pitch = buildGaragePitchEmail({
    garageName: p.name,
    city: p.city,
    vehicleCount: vehiclesWithImage.length || vehicles.length,
    topBrand,
    hasReviews: !!((p as { reviews?: unknown[] }).reviews?.length),
    siteUrl,
  });

  // 6. Send ou dry-run
  if (send) {
    if (!p.email) {
      return NextResponse.json({ success: false, skipped: "no_email", analysis: franchiseAnalysis, pitch_preview: { subject: pitch.subject } });
    }
    const brevoKey = process.env.BREVO_API_KEY;
    if (!brevoKey) return NextResponse.json({ error: "BREVO_API_KEY manquante" }, { status: 500 });
    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": brevoKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: { name: "Tom Bauer", email: "contact@klyora.fr" },
          to: [{ email: p.email, name: p.name }],
          replyTo: { email: "contact@klyora.fr", name: "Tom Bauer" },
          subject: pitch.subject,
          htmlContent: pitch.htmlBody,
          textContent: pitch.textBody,
        }),
      });
      if (!res.ok) {
        const errText = await res.text().catch(() => "");
        return NextResponse.json({ success: false, error: `Brevo ${res.status}`, detail: errText.slice(0, 300) }, { status: 502 });
      }
    } catch (err) {
      return NextResponse.json({ success: false, error: err instanceof Error ? err.message : "send_failed" }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    sent: send,
    slug: p.slug,
    garage_name: p.name,
    city: p.city,
    franchise_analysis: franchiseAnalysis,
    vehicles_total: vehicles.length,
    vehicles_with_image: vehiclesWithImage.length,
    top_brand: topBrand,
    palette,
    site_url: siteUrl,
    email_to: p.email || null,
    pitch_subject: pitch.subject,
    pitch_text_preview: pitch.textBody.slice(0, 400),
  });
}

export const GET = POST;
