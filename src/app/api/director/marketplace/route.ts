/**
 * GET /api/director/marketplace
 * → liste les 30 agents marketplace (catalog) avec leur prix en crédits
 *
 * Query params :
 *   ?division=marketing  (filtre)
 *   ?slug=...            (détail d'un agent — sans system_prompt)
 *
 * GET /api/director/marketplace/divisions
 * → liste des divisions avec count
 */
import { NextRequest, NextResponse } from "next/server";
import { listAgents, listDivisions, getAgentBySlug } from "@/lib/director/marketplace-loader";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const slug = sp.get("slug");
  const division = sp.get("division");

  if (slug) {
    const a = getAgentBySlug(slug);
    if (!a) return NextResponse.json({ error: "Agent introuvable" }, { status: 404 });
    // Retour sans system_prompt (peut être très long, pas pertinent côté UI)
    const { system_prompt, ...rest } = a;
    return NextResponse.json({ agent: rest });
  }

  let agents = listAgents();
  if (division) agents = agents.filter(a => a.division === division);

  return NextResponse.json({
    agents,
    count: agents.length,
    divisions: listDivisions(),
  });
}
