/**
 * GET /api/admin/prospect-by-email?email=...
 * → Récupère le dossier COMPLET d'un prospect par son email :
 *   - Toutes les colonnes prospects
 *   - Historique emails envoyés (sniper, closer, blast, etc.)
 *   - Stats vues maquette
 *   - Status conversion
 *   - Compte Klyora Director lié (si existe)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function GET(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const email = (req.nextUrl.searchParams.get("email") || "").trim().toLowerCase();
  if (!email) return NextResponse.json({ error: "email param requis" }, { status: 400 });

  const supabase = db();
  const { data: prospect, error } = await supabase
    .from("prospects")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error || !prospect) {
    return NextResponse.json({
      found: false,
      email,
      message: "Prospect introuvable dans la base — peut-être un email perso, business sous un autre nom",
      error: error?.message,
    }, { status: 404 });
  }

  // Klyora Director account éventuellement lié
  const { data: directorAccount } = await supabase
    .from("director_accounts")
    .select("id, email, business_name, tokens_balance, is_subscribed, auto_provisioned, must_change_password, created_at")
    .eq("email", email)
    .maybeSingle();

  // URL publique maquette
  const mockupUrl = prospect.slug ? `https://webconceptor.fr/prospects/${prospect.slug}` : null;

  // Audit des emails envoyés
  const emailsSent: Array<{ type: string; at: string }> = [];
  if (prospect.sent_at)             emailsSent.push({ type: "initial",       at: prospect.sent_at });
  if (prospect.sniper_sent_at)      emailsSent.push({ type: "sniper",        at: prospect.sniper_sent_at });
  if (prospect.closer_sent_at)      emailsSent.push({ type: "closer-opened", at: prospect.closer_sent_at });
  if (prospect.outdated_blast_sent_at) emailsSent.push({ type: "outdated-blast", at: prospect.outdated_blast_sent_at });
  if (prospect.distress_sent_at)    emailsSent.push({ type: "distress-signals", at: prospect.distress_sent_at });
  if (prospect.followup_sent_at)    emailsSent.push({ type: "follow-up",     at: prospect.followup_sent_at });
  if (prospect.blast_flash_sent_at) emailsSent.push({ type: "blast-flash",   at: prospect.blast_flash_sent_at });
  if (prospect.final_push_sent_at)  emailsSent.push({ type: "final-push",    at: prospect.final_push_sent_at });
  if (prospect.agentconceptor_sent_at) emailsSent.push({ type: "agentconceptor/webdirector", at: prospect.agentconceptor_sent_at });

  // Tri par date
  emailsSent.sort((a, b) => (a.at < b.at ? -1 : 1));

  return NextResponse.json({
    found: true,
    prospect_id: prospect.id,

    // Identité business
    identity: {
      name: prospect.name,
      city: prospect.city,
      business_type: prospect.business_type,
      address: prospect.address,
      phone: prospect.phone,
      website: prospect.website,
      email: prospect.email,
    },

    // Présence numérique
    digital_presence: {
      google_rating: prospect.google_rating,
      google_reviews_count: prospect.google_reviews_count,
      site_quality: prospect.site_quality,
      website_photos: prospect.website_photos?.slice(0, 5) || [],
      mockup_url_public: mockupUrl,
      mockup_chars: prospect.mockup_html?.length || 0,
    },

    // Engagement
    engagement: {
      status: prospect.status,
      sales_angle: prospect.sales_angle,
      view_count: prospect.view_count || 0,
      opened_at: prospect.opened_at,
      last_seen_at: prospect.last_seen_at,
      converted_at: prospect.converted_at,
      unsubscribed_at: prospect.unsubscribed_at,
    },

    // Emails envoyés
    emails_sent_count: emailsSent.length,
    emails_history: emailsSent,

    // Klyora Director
    webdirector_account: directorAccount ? {
      account_id: directorAccount.id,
      created_at: directorAccount.created_at,
      tokens_balance: directorAccount.tokens_balance,
      is_subscribed: directorAccount.is_subscribed,
      auto_provisioned: directorAccount.auto_provisioned,
      must_change_password: directorAccount.must_change_password,
    } : null,

    // Hot lead = priorité
    is_hot_lead: !!prospect.opened_at && !prospect.converted_at && !prospect.unsubscribed_at,
  });
}
