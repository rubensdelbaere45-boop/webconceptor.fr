// POST /api/admin/orders/[id]/deploy — déploie le site
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

async function log(orderId: string, level: string, message: string) {
  const supabase = db();
  await supabase.from("deploy_logs").insert({ order_id: orderId, level, message }).then(() => {});
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const supabase = db();
  const { data: order } = await supabase.from("orders").select("client, domaine, generated_at").eq("id", id).maybeSingle();
  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  if (!order.generated_at) return NextResponse.json({ error: "Site non encore généré — utiliser /generate d'abord" }, { status: 400 });

  await log(id, "info", `Déploiement de ${order.client}…`);

  // TODO : appeler l'API Vercel Deployments + IONOS domaine
  const siteUrl = order.domaine ? `https://${order.domaine}` : `https://${id}.klyora.fr`;
  const now = new Date().toISOString();
  await supabase.from("orders").update({ deployed: true, deployed_at: now, site_url: siteUrl }).eq("id", id);
  await log(id, "ok", `Site en ligne : ${siteUrl}`);

  return NextResponse.json({ ok: true, siteUrl, deployed_at: now });
}
