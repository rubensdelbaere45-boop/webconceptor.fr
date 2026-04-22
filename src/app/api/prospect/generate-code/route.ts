import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

/* ══════════════════════════════════════════
   POST /api/prospect/generate-code
   Body : { prospect_id }
   - Crée (ou récupère) un projet Stripe pour ce prospect
   - Génère un code PIN 6 chiffres unique
   - Lie le code au prospect (project_code)
   - Retourne { code, project_id, code_url }
   - Idempotent : si déjà généré, renvoie le même code
   ══════════════════════════════════════════ */

async function generateUniqueCode(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<string> {
  for (let tries = 0; tries < 10; tries++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const { data } = await supabase.from("projects").select("id").eq("code", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("Impossible de générer un code unique (trop de collisions)");
}

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
    return NextResponse.json({ error: "prospect_id manquant ou invalide" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Load prospect
  const { data: prospect, error: findErr } = await supabase
    .from("prospects")
    .select("id, name, slug, email, city, business_type, project_code, mockup_html")
    .eq("id", prospect_id)
    .maybeSingle();

  if (findErr || !prospect) {
    return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  }

  if (!prospect.mockup_html) {
    return NextResponse.json({ error: "Aucune maquette générée pour ce prospect" }, { status: 400 });
  }

  // If a code already exists for this prospect, return it (idempotent)
  if (prospect.project_code) {
    const { data: existing } = await supabase
      .from("projects")
      .select("id, code")
      .eq("code", prospect.project_code)
      .maybeSingle();
    if (existing) {
      return NextResponse.json({
        success: true,
        already_existed: true,
        code: existing.code,
        project_id: existing.id,
        code_url: `https://webconceptor.fr/code?c=${existing.code}`,
      });
    }
  }

  // Generate new unique code
  let code: string;
  try {
    code = await generateUniqueCode(supabase);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const mockupUrl = `https://webconceptor.fr/prospects/${prospect.slug}`;
  const isResto = prospect.business_type === "restaurant";
  const title = `Site web ${isResto ? "restaurant" : "vitrine"} — ${prospect.name}`;

  const contractText =
    `Création du site web pour ${prospect.name}\n\n` +
    `Livrables :\n` +
    `• Site vitrine complet ${isResto ? "avec module de réservation en ligne" : "avec vos infos et produits"}\n` +
    `• Design responsive (PC, tablette, mobile)\n` +
    `• Hébergement 30 jours inclus\n` +
    `• Nom de domaine (facturé selon extension)\n\n` +
    `Délai : livraison en 5 jours ouvrés après réception du paiement.\n\n` +
    `Modifications incluses : jusqu'à 2 rounds de corrections.\n\n` +
    `Au-delà : option Formule Sérénité à 50 €/mois (hébergement + mises à jour illimitées).`;

  // Create project row (utilisé par /code pour afficher preview + payer via Stripe)
  const { data: project, error: insertErr } = await supabase
    .from("projects")
    .insert({
      code,
      title,
      description: `Site web personnalisé pour ${prospect.name}${prospect.city ? ` — ${prospect.city}` : ""}`,
      client_name: prospect.name,
      client_email: prospect.email || "",
      price_cents: 19900,
      preview_url: mockupUrl,
      contract_text: contractText,
      status: "sent",
    })
    .select()
    .single();

  if (insertErr || !project) {
    console.error("[generate-code] project insert error:", insertErr);
    return NextResponse.json({ error: "Impossible de créer le projet" }, { status: 500 });
  }

  // Link the code to the prospect
  await supabase
    .from("prospects")
    .update({ project_code: code, status: "converted" })
    .eq("id", prospect.id);

  // Optional Telegram notification
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId) {
    const msg =
      `🔐 <b>Code PIN généré</b>\n\n` +
      `<b>${prospect.name}</b>\n` +
      (prospect.city ? `📍 ${prospect.city}\n` : "") +
      (prospect.email ? `✉️ ${prospect.email}\n` : "") +
      `\n<b>Code :</b> <code>${code}</code>\n` +
      `<b>Prix :</b> 199 € TTC (ou 3× sans frais)\n\n` +
      `<a href="https://webconceptor.fr/code?c=${code}">Lien direct /code</a>`;
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        disable_notification: true,
      }),
    }).catch(() => { /* silent */ });
  }

  return NextResponse.json({
    success: true,
    already_existed: false,
    code,
    project_id: project.id,
    code_url: `https://webconceptor.fr/code?c=${code}`,
  });
}
