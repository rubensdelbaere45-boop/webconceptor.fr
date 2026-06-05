// POST /api/admin/orders/[id]/delivery-email — envoie "Votre site est en ligne"
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email-provider";

export const dynamic = "force-dynamic";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = db();
  const { data: order } = await supabase.from("orders").select("*").eq("id", id).maybeSingle();
  if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  if (!order.deployed || !order.site_url) {
    return NextResponse.json({ error: "Site pas encore déployé" }, { status: 400 });
  }

  const html = `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;line-height:1.6">
  <div style="background:#0a0a0a;color:#FFD700;padding:24px;text-align:center;border-radius:12px 12px 0 0">
    <div style="font-size:11px;font-weight:700;letter-spacing:0.25em">VOTRE SITE</div>
    <div style="font-size:26px;font-weight:800;margin-top:8px;color:#fff">est en ligne 🎉</div>
  </div>
  <div style="padding:28px 24px;border:1px solid #eee;border-top:none;border-radius:0 0 12px 12px">
    <p>Bonjour ${order.client},</p>
    <p>Votre site web est désormais accessible à cette adresse :</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${order.site_url}" style="background:#FFD700;color:#0a0a0a;padding:16px 32px;border-radius:100px;font-weight:800;text-decoration:none;display:inline-block">Voir mon site →</a>
    </div>
    <p style="font-size:13px;color:#666">Une question ou une modification ? Répondez à cet email ou appelez Tom au <strong>06 35 59 24 71</strong>.</p>
    <p>L'équipe WebConceptor</p>
  </div>
</div>`;

  const result = await sendEmail({
    to: order.email,
    toName: order.client,
    subject: `🎉 Votre site est en ligne — ${order.site_url}`,
    html,
    fromName: "Tom — WebConceptor",
    fromEmail: "contact@webconceptor.fr",
  });

  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 502 });
  await supabase.from("orders").update({ delivery_email_sent_at: new Date().toISOString() }).eq("id", id);
  return NextResponse.json({ ok: true, provider: result.provider, messageId: result.messageId });
}
