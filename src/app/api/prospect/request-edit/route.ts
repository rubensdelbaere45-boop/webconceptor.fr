import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/request-edit
   Déclenché automatiquement par le chat IA quand le prospect demande
   une modification complexe (couleurs, photos, nouvelle section…).

   - Enregistre la demande dans la DB (champ user_edits)
   - Envoie un email à contact@webconceptor.fr via Brevo
   Body : { slug, request }
   Rate-limit : 5 demandes / 10min / IP (anti-spam).
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`request-edit:${ip}`, 5, 600);
  if (!rl.ok) {
    return NextResponse.json({ error: "Trop de demandes." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const slug    = String(body.slug    || "").slice(0, 100).trim();
  const request = String(body.request || "").slice(0, 500).trim();

  if (!slug || !request) {
    return NextResponse.json({ error: "slug et request requis" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: prospect } = await supabase
    .from("prospects")
    .select("id, name, city, business_type, email, phone")
    .eq("slug", slug)
    .maybeSingle();

  if (!prospect) {
    return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  }

  // Sauvegarder la demande dans la DB (champ notes)
  await supabase
    .from("prospects")
    .update({
      notes: `[MODIF COMPLEXE ${new Date().toISOString().slice(0, 16)}] ${request.slice(0, 200)}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", prospect.id)
    .catch(() => {});

  // Envoyer un email à Tom via Brevo
  const brevoKey = process.env.BREVO_API_KEY;
  if (brevoKey) {
    const prospectUrl = `https://webconceptor.fr/prospects/${slug}`;
    const htmlBody = `
<h2>🎨 Demande de modification — ${prospect.name}</h2>
<table style="border-collapse:collapse;width:100%;font-family:system-ui,sans-serif;font-size:14px">
  <tr><td style="padding:8px;color:#666;width:140px">Établissement</td><td style="padding:8px;font-weight:600">${prospect.name}${prospect.city ? ` · ${prospect.city}` : ""}</td></tr>
  <tr style="background:#f9fafb"><td style="padding:8px;color:#666">Type</td><td style="padding:8px">${prospect.business_type || "—"}</td></tr>
  <tr><td style="padding:8px;color:#666">Téléphone</td><td style="padding:8px">${prospect.phone || "—"}</td></tr>
  <tr style="background:#f9fafb"><td style="padding:8px;color:#666">Email</td><td style="padding:8px">${prospect.email || "—"}</td></tr>
  <tr><td style="padding:8px;color:#666;vertical-align:top">Demande</td><td style="padding:8px;background:#fffbeb;border-left:4px solid #c19a56">${request}</td></tr>
</table>
<p style="margin-top:20px">
  <a href="${prospectUrl}" style="background:#0a0a0a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Voir la maquette →</a>
</p>
<p style="color:#999;font-size:12px;margin-top:16px">Envoyé automatiquement depuis le chat IA de la maquette.</p>
`.trim();

    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": brevoKey,
      },
      body: JSON.stringify({
        sender: { name: "WebConceptor Bot", email: "contact@webconceptor.fr" },
        to: [{ email: "contact@webconceptor.fr", name: "Tom Bauer" }],
        subject: `🎨 Modif demandée — ${prospect.name} (${prospect.city || "?"})`,
        htmlContent: htmlBody,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true });
}
