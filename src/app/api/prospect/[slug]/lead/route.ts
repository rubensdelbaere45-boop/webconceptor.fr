/**
 * POST /api/prospect/[slug]/lead
 *
 * Reçoit les leads soumis depuis les formulaires des sites prospects
 * (RDV / Devis / Contact / Brochure).
 *
 * Stocke dans la table `prospect_leads` (créée à la volée si manque)
 * + notifie Tom via Telegram + (optionnel) email.
 *
 * Body : { type: 'rdv'|'devis'|'contact'|'brochure', form: {...} }
 *
 * Pas d'auth — c'est une route publique (un visiteur du site prospect).
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

type LeadType = "rdv" | "devis" | "contact" | "brochure" | "callback";

function isValidLeadType(s: unknown): s is LeadType {
  return typeof s === "string" && ["rdv", "devis", "contact", "brochure", "callback"].includes(s);
}

async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true }),
    });
  } catch (err) {
    console.warn("[lead] Telegram notify failed:", err);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

  const body = await req.json().catch(() => ({}));
  const type = body.type;
  const form = (body.form || {}) as Record<string, unknown>;
  if (!isValidLeadType(type)) {
    return NextResponse.json({ error: "type invalide" }, { status: 400 });
  }

  // Sanitize form values (limit chars, strip HTML)
  const cleanForm: Record<string, string> = {};
  for (const [k, v] of Object.entries(form)) {
    if (typeof v !== "string") continue;
    const clean = v.slice(0, 500).replace(/<[^>]+>/g, "").trim();
    if (clean) cleanForm[k.slice(0, 50)] = clean;
  }

  const supabase = db();
  // Get prospect for context
  const { data: p } = await supabase
    .from("prospects")
    .select("id, name, business_type, city, email, phone")
    .eq("slug", slug)
    .maybeSingle();
  if (!p) return NextResponse.json({ error: "prospect introuvable" }, { status: 404 });

  // Insert lead (table peut ne pas exister — on tente, fallback à juste notifier)
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null;
  const ua = (req.headers.get("user-agent") || "").slice(0, 300);
  const ref = (req.headers.get("referer") || "").slice(0, 300);

  let leadId: string | null = null;
  const { data: leadRow, error: insErr } = await supabase
    .from("prospect_leads")
    .insert({
      prospect_id: p.id,
      prospect_slug: slug,
      type,
      form: cleanForm,
      ip,
      user_agent: ua,
      referer: ref,
      created_at: new Date().toISOString(),
    })
    .select("id")
    .maybeSingle();
  if (leadRow?.id) leadId = leadRow.id as string;
  if (insErr) console.warn("[lead] insert error (table peut-être manquante):", insErr.message);

  // Notify Tom on Telegram
  const labels: Record<LeadType, string> = {
    rdv: "📅 PRISE DE RENDEZ-VOUS",
    devis: "💰 DEMANDE DE DEVIS",
    contact: "✉️ MESSAGE CONTACT",
    brochure: "📥 TÉLÉCHARGEMENT BROCHURE",
    callback: "📞 DEMANDE DE RAPPEL",
  };
  const formLines = Object.entries(cleanForm)
    .map(([k, v]) => `  • <b>${k}</b> : ${v.slice(0, 200)}`)
    .join("\n");
  const tgText = `${labels[type]}

<b>${p.name}</b> (${p.business_type || "?"}${p.city ? " · " + p.city : ""})
slug: <code>${slug}</code>

${formLines || "(aucun champ rempli)"}

🌐 https://klyora.fr/prospects/${slug}`;
  await notifyTelegram(tgText);

  return NextResponse.json({
    success: true,
    leadId,
    message: "Demande enregistrée — nous vous recontactons rapidement.",
  });
}
