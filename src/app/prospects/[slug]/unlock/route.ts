/**
 * POST /prospects/[slug]/unlock
 *
 * Reçoit le code soumis dans le formulaire de gate. Si OK :
 *   - Set cookie HttpOnly + Secure pour 30 jours
 *   - Redirige 302 vers /prospects/[slug]
 *   - Log l'ouverture en DB (avec IP, UA, referer)
 *   - Telegram alert sur 1ère ouverture (HOT LEAD réel = bon destinataire)
 * Si KO :
 *   - Re-render le gate avec message d'erreur
 *   - Log la tentative échouée (utile pour détecter bots/huissiers)
 */
import { NextRequest, NextResponse } from "next/server";
import { verifyAccessCode, buildAccessCookie, renderGatePage } from "@/lib/access-code";
import { createClient } from "@supabase/supabase-js";
import { getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function notifyTelegramHotLead(prospectId: string, slug: string, ip: string, userAgent: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
  const { data: p } = await supabase
    .from("prospects")
    .select("name, phone, email, business_type, city")
    .eq("id", prospectId)
    .maybeSingle();
  if (!p) return;

  const escape = (s: string) =>
    String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const text =
    `🔥🔓 <b>CODE VALIDÉ — VRAI HOT LEAD</b>\n\n` +
    `<b>${escape(p.name)}</b> · ${escape(p.business_type || "?")} · ${escape(p.city || "")}\n` +
    `📞 ${escape(p.phone || "?")}\n` +
    `✉️ ${escape(p.email || "?")}\n\n` +
    `🌐 <a href="https://klyora.fr/prospects/${escape(slug)}">Voir maquette</a>\n` +
    `🛰️ IP : <code>${escape(ip)}</code>\n` +
    `🖥️ UA : <code>${escape(userAgent.slice(0, 80))}</code>\n\n` +
    `<i>👉 Appelle maintenant — il est sur la maquette</i>`;

  fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

export async function POST(req: NextRequest, context: { params: Promise<{ slug: string }> }) {
  const { slug } = await context.params;
  if (!slug || slug.length > 100) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // Parse form data
  let codeTried = "";
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    if (form) codeTried = String(form.get("code") || "");
  } else if (ct.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.code === "string") codeTried = body.code;
  }

  const ip = getClientIp(req.headers) || "";
  const userAgent = req.headers.get("user-agent") || "";
  const referer = req.headers.get("referer") || "";

  const result = await verifyAccessCode({ slug, codeTried, ip, userAgent, referer });

  if (!result.ok) {
    // Re-render le formulaire avec une erreur
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );
    const { data } = await supabase
      .from("prospects")
      .select("name")
      .eq("slug", slug)
      .maybeSingle();
    return new NextResponse(renderGatePage({ slug, prospectName: data?.name, error: true }), {
      status: 401,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    });
  }

  // OK — set cookie + redirect + (si 1ère ouverture) notif Telegram
  if (result.firstUnlock && result.prospectId) {
    notifyTelegramHotLead(result.prospectId, slug, ip, userAgent).catch(() => {});
  }

  return new NextResponse(null, {
    status: 302,
    headers: {
      Location: `/prospects/${encodeURIComponent(slug)}`,
      "Set-Cookie": buildAccessCookie(slug, codeTried.toUpperCase().replace(/[\s_]/g, "")),
      "Cache-Control": "no-store",
    },
  });
}
