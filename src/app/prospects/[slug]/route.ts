import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { escapeTelegram } from "@/lib/security";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

/* ══════════════════════════════════════════
   GET /prospects/[slug]
   Sert le HTML de la maquette stocke dans la DB.
   Lien permanent tant que le prospect existe.
   ══════════════════════════════════════════ */

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (!slug || slug.length > 100) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("prospects")
    .select("mockup_html, name, id")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data || !data.mockup_html) {
    return new NextResponse(
      `<!DOCTYPE html><html><head><title>Maquette introuvable</title><meta charset="UTF-8"><style>body{font-family:system-ui,sans-serif;text-align:center;padding:60px 20px;color:#525252}h1{color:#0a0a0a}a{color:#0066ff}</style></head><body><h1>Maquette introuvable</h1><p>Cette maquette n'existe pas ou a été retirée.</p><p><a href="https://webconceptor.fr">Retour à WebConceptor</a></p></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }

  // Log the view (non-blocking)
  supabase
    .from("prospects")
    .update({
      opened_at: new Date().toISOString(),
      status: "opened",
    })
    .eq("id", data.id)
    .is("opened_at", null)
    .then(() => {});

  // Notify Telegram if first open (non-blocking)
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (token && chatId) {
    fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: `👀 <b>${escapeTelegram(data.name)}</b> vient d'ouvrir sa maquette.`,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    }).catch(() => {});
  }

  return new NextResponse(data.mockup_html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=300",
    },
  });
}
