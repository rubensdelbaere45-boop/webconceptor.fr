import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/admin/send-follow-up
   Auth : x-admin-key

   ENVOI POST-APPEL : quand Rubens a un prospect au téléphone qui lui donne
   son email en direct (lead qualifié, pas du cold), cet endpoint :
     1. Met à jour l'email du prospect en DB
     2. Remet le status en "ready" (re-éligible à l'envoi même si status=no_email)
     3. Déclenche le pipeline /api/prospect/send avec ce prospect_id
        → génère la maquette (Claude pour restaurants, adaptive pour autres)
        → envoie l'email Brevo au NOUVEL email

   Body :
     { prospect_id: string, email: string }

   Retourne le résultat de /api/prospect/send (succès + emails envoyés).
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  let body: { prospect_id?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 });
  }

  const prospect_id = typeof body.prospect_id === "string" ? body.prospect_id.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

  if (!prospect_id || !/^[0-9a-f-]{36}$/i.test(prospect_id)) {
    return NextResponse.json({ error: "prospect_id invalide" }, { status: 400 });
  }
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "email invalide" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // 1. Update email + reset status à "ready" pour que le send pipeline traite
  //    ce prospect (les status "no_email" sont skipés par le pipeline normal).
  //    On retire aussi unsubscribed_at au cas où (hot lead qualifié, on veut le
  //    recontacter peu importe l'historique).
  const { data: existing, error: fetchErr } = await supabase
    .from("prospects")
    .select("id, name, business_type, mockup_html, status")
    .eq("id", prospect_id)
    .maybeSingle();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  }

  // On remet le status à "found" si c'était no_email (pour que le pipeline
  // le traite). Sinon on garde le status (ready, sent, opened...).
  const newStatus = existing.status === "no_email" ? "found" : existing.status;

  const { error: updateErr } = await supabase
    .from("prospects")
    .update({
      email,
      status: newStatus,
      unsubscribed_at: null,
      notes: `[${new Date().toISOString().slice(0,16)}] ✉️ Email ajouté suite à appel : ${email}`,
    })
    .eq("id", prospect_id);

  if (updateErr) {
    console.error("[send-follow-up] update failed:", updateErr);
    return NextResponse.json({ error: "Update email échec" }, { status: 500 });
  }

  // 2. Déclencher le pipeline d'envoi interne via fetch
  const origin = new URL(req.url).origin;
  try {
    const sendRes = await fetch(`${origin}/api/prospect/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-key": adminKey,
      },
      body: JSON.stringify({ prospect_id, dry_run: false }),
    });
    const sendData = await sendRes.json().catch(() => ({}));

    return NextResponse.json({
      success: sendRes.ok,
      email_updated_to: email,
      prospect_name: existing.name,
      send_response: sendData,
    }, { status: sendRes.ok ? 200 : 502 });
  } catch (err) {
    return NextResponse.json({
      error: "Pipeline send a échoué",
      detail: err instanceof Error ? err.message : "unknown",
    }, { status: 500 });
  }
}
