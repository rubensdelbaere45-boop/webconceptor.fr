/**
 * GET /api/director/campaigns
 * → liste l'historique des missions de l'utilisateur connecté.
 *   Renvoie les 20 dernières avec rapport + livrables.
 *
 * GET /api/director/campaigns?id=XXX
 * → détail d'une mission précise (avec report_md complet).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServiceClient, getSessionUser } from "@/lib/director/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const supabase = getServiceClient();
  const { data: acc } = await supabase
    .from("director_accounts")
    .select("id")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!acc) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  const campaignId = req.nextUrl.searchParams.get("id");

  // Détail d'une mission
  if (campaignId) {
    const { data: c, error } = await supabase
      .from("director_campaigns")
      .select("id, campaign_type, status, tokens_cost, config, launched_at, completed_at")
      .eq("id", campaignId)
      .eq("account_id", acc.id)
      .maybeSingle();
    if (error || !c) return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
    return NextResponse.json({ campaign: c });
  }

  // Liste les 20 dernières
  const { data: campaigns, error } = await supabase
    .from("director_campaigns")
    .select("id, campaign_type, status, tokens_cost, config, launched_at, completed_at")
    .eq("account_id", acc.id)
    .order("launched_at", { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Simplifie le retour : extrait agent_name et synthèse
  const lite = (campaigns || []).map(c => {
    const cfg = (c.config as any) || {};
    return {
      id: c.id,
      type: c.campaign_type,
      status: c.status,
      tokens: c.tokens_cost,
      agent_name: cfg.agent_name || null,
      summary: cfg.estimated_results || null,
      deliverables_count: (cfg.deliverables || []).length,
      source: cfg.source || null,
      launched_at: c.launched_at,
      completed_at: c.completed_at,
    };
  });

  return NextResponse.json({ campaigns: lite, count: lite.length });
}
