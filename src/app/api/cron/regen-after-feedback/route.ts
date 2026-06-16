/**
 * GET|POST /api/cron/regen-after-feedback
 *
 * Cron qui régénère les maquettes des prospects qui ont demandé des
 * changements (flag regen_requested_at NOT NULL et plus récent que la
 * dernière régénération).
 *
 * Pour chaque prospect concerné :
 *   1. Récupère les instructions du prospect (regen_instructions)
 *   2. Appelle /api/prospect/regenerate-mockup
 *   3. Envoie le nouveau lien + code par mail
 *
 * Auth : Bearer CRON_SECRET OU x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { sendBrevoEmail } from "@/lib/brevo-send";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") || "";
  const cronOk = auth.startsWith("Bearer ") && safeCompare(auth.slice(7), process.env.CRON_SECRET || "");
  const adminOk = safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY);
  return cronOk || adminOk;
}

async function handler(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = db();
  const { data: pending } = await supabase
    .from("prospects")
    .select("id, name, email, slug, access_code, regen_instructions, regen_requested_at, regen_done_at")
    .not("regen_requested_at", "is", null)
    .limit(20);

  const todo = (pending || []).filter(
    (p: { regen_requested_at?: string | null; regen_done_at?: string | null }) =>
      !p.regen_done_at || (p.regen_requested_at && p.regen_done_at && p.regen_requested_at > p.regen_done_at)
  );

  let done = 0;
  let errors = 0;
  const adminKey = process.env.ADMIN_SECRET_KEY || "";

  for (const p of todo) {
    try {
      // Trigger regen via la route existante
      const regenRes = await fetch(`https://klyora.fr/api/prospect/regenerate-mockup`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          prospect_id: p.id,
          instructions: p.regen_instructions,
        }),
        signal: AbortSignal.timeout(120000),
      }).catch(() => null);

      if (!regenRes || !regenRes.ok) {
        errors++;
        continue;
      }

      // Mark done + envoie le nouveau lien
      await supabase
        .from("prospects")
        .update({ regen_done_at: new Date().toISOString() })
        .eq("id", p.id);

      const firstName = (p.name || "").split(" ")[0];
      const url = `https://klyora.fr/prospects/${p.slug}`;
      await sendBrevoEmail({
        to: p.email,
        toName: p.name,
        subject: `${firstName}, votre nouvelle maquette est prête`,
        htmlContent: `<p>Bonjour ${firstName},</p>
<p>J'ai bien refait votre maquette avec vos demandes :</p>
<p style="margin:24px 0">
  <a href="${url}" style="display:inline-block;background:#0a0a0a;color:#FFD700;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700">Voir ma nouvelle maquette →</a>
</p>
${p.access_code ? `<div style="background:#0F172A;color:#FFD700;padding:18px;border-radius:10px;text-align:center;margin:16px 0"><div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:6px">Votre code d'accès</div><div style="font-size:24px;font-weight:800;letter-spacing:0.25em;font-family:monospace">${p.access_code}</div></div>` : ""}
<p>Toujours pas ce que vous voulez ? Répondez simplement à ce mail, je relance.</p>
<p>Tom — Klyora Sites</p>`,
        textContent: `Bonjour ${firstName},\n\nVotre nouvelle maquette est prête :\n${url}\n${p.access_code ? `Code : ${p.access_code}\n` : ""}\nRépondez à ce mail si vous voulez d'autres modifs.\n\nTom — Klyora Sites`,
      });

      done++;
    } catch {
      errors++;
    }
  }

  return NextResponse.json({ success: true, pending: todo.length, done, errors });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
