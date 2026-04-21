import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { generateCallScript } from "@/lib/call-script";
import { auditWebsite } from "@/lib/site-audit";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

/* ══════════════════════════════════════════
   POST /api/prospect/call-script
   Body : { prospect_id }
   Renvoie un script d'appel personnalisé Claude + les points d'audit
   du site actuel du prospect (issues, score, qualité).
   Si le prospect n'a PAS encore été audité (prospect ancien avant l'ajout
   des colonnes audit), on audite à la volée et on met à jour la DB.
   ══════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const prospect_id = typeof body.prospect_id === "string" && /^[0-9a-f-]{10,64}$/i.test(body.prospect_id)
    ? body.prospect_id
    : null;

  if (!prospect_id) {
    return NextResponse.json({ error: "prospect_id invalide" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("prospects")
    .select("id, name, city, business_type, google_rating, google_reviews_count, site_quality, site_audit_score, site_audit_issues, address, website")
    .eq("id", prospect_id)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  }

  // Si le prospect a un site ET que l'audit n'a PAS été fait (prospect ancien),
  // on audite à la volée et on met à jour la DB pour les prochains runs.
  let siteQuality = data.site_quality;
  let siteAuditScore = data.site_audit_score;
  let siteAuditIssues: string[] | null = Array.isArray(data.site_audit_issues) ? data.site_audit_issues : null;

  const needsLiveAudit = data.website
    && data.website.trim().length > 0
    && (!siteAuditIssues || siteAuditIssues.length === 0)
    && siteQuality !== "none";

  if (needsLiveAudit) {
    try {
      const audit = await auditWebsite(data.website);
      if (audit) {
        siteQuality = audit.quality;
        siteAuditScore = audit.score;
        siteAuditIssues = audit.issues;
        // Met à jour la DB pour ne plus avoir à refaire ce travail la prochaine fois
        await supabase
          .from("prospects")
          .update({
            site_quality: audit.quality,
            site_audit_score: audit.score,
            site_audit_issues: audit.issues.length ? audit.issues : null,
          })
          .eq("id", data.id);
      }
    } catch {
      // silent — on laisse les données telles quelles si l'audit échoue
    }
  }

  // Si pas de site du tout → quality = "none"
  if (!data.website || data.website.trim().length === 0) {
    siteQuality = "none";
  }

  const script = await generateCallScript({
    prospectName: data.name,
    city: data.city,
    businessType: data.business_type,
    googleRating: data.google_rating,
    googleReviewsCount: data.google_reviews_count,
    siteQuality: siteQuality,
    address: data.address,
  });

  return NextResponse.json({
    success: true,
    script,
    audit: {
      site_quality: siteQuality,
      site_audit_score: siteAuditScore,
      site_audit_issues: siteAuditIssues,
      website: data.website || null,
    },
  });
}
