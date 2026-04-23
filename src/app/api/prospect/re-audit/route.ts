import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { runDeepAudit } from "@/lib/deep-audit";
import { generateCustomMockupHtml, type CustomProspect } from "@/lib/mockup-custom";

/* ══════════════════════════════════════════
   POST /api/prospect/re-audit
   Auth : x-admin-key

   Force un nouvel audit profond (DeepAudit) d'un prospect existant +
   régénère sa maquette avec mockup-custom. Utile pour :
     - Re-tester un prospect dont l'ancien rich_audit est trop vieux
     - Migrer un prospect legacy (pas encore de rich_audit) vers le
       nouveau système sans attendre la prochaine vague de prospection
     - Tester manuellement la qualité de la nouvelle génération

   Body : { prospect_id? | slug? }
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  let body: { prospect_id?: string; slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const origin = new URL(req.url).origin;

  let q = supabase
    .from("prospects")
    .select("id, slug, name, city, address, phone, website, email, google_rating, google_reviews_count, photos, hours, business_type, reviews");

  if (body.prospect_id) q = q.eq("id", body.prospect_id);
  else if (body.slug) q = q.eq("slug", body.slug);
  else return NextResponse.json({ error: "prospect_id ou slug requis" }, { status: 400 });

  const { data: prospect, error } = await q.maybeSingle();
  if (error || !prospect) {
    return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  }

  // 1. Run deep audit
  const audit = await runDeepAudit({
    prospectName: prospect.name,
    siteUrl: prospect.website || null,
    businessType: prospect.business_type,
    city: prospect.city,
  });

  if (!audit) {
    return NextResponse.json({ error: "Audit failed (site injoignable ou Claude KO)" }, { status: 502 });
  }

  // 2. Génère la maquette custom
  const custom: CustomProspect = {
    id: prospect.id, slug: prospect.slug, name: prospect.name,
    city: prospect.city, address: prospect.address, phone: prospect.phone,
    website: prospect.website, email: prospect.email,
    google_rating: prospect.google_rating, google_reviews_count: prospect.google_reviews_count,
    photos: prospect.photos, hours: prospect.hours, business_type: prospect.business_type,
    reviews: prospect.reviews,
  };
  const html = generateCustomMockupHtml(custom, audit, origin);

  // 3. Sauvegarde l'audit + la maquette en DB
  const { error: updateErr } = await supabase
    .from("prospects")
    .update({
      rich_audit: audit,
      mockup_html: html,
      site_quality: audit.verdict.quality,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prospect.id);

  if (updateErr) {
    return NextResponse.json({ error: "Update failed", detail: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    prospect_id: prospect.id,
    slug: prospect.slug,
    name: prospect.name,
    audit_summary: {
      quality: audit.verdict.quality,
      confidence: audit.verdict.confidence,
      summary: audit.verdict.summary,
      tone: audit.brand.tone,
      primaryColor: audit.brand.primaryColor,
      missingFeaturesCount: audit.missingFeatures.length,
      weaknessesCount: audit.weaknesses.length,
      featuresToAddCount: audit.improvementBrief.featuresToAdd.length,
      cost_usd: audit._meta?.cost_usd,
    },
    mockup_url: `${origin}/prospects/${prospect.slug}`,
  });
}

export async function GET(req: NextRequest) {
  // Pour facilité de test en navigateur : accepte GET avec ?slug=xxx
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return NextResponse.json({ error: "?slug=... requis" }, { status: 400 });
  return POST(new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify({ slug }),
  }));
}
