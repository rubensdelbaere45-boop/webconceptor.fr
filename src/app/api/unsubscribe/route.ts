import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════
   GET /api/unsubscribe?id=<uuid>&email=<email>
   POST /api/unsubscribe  (one-click, Gmail spec)

   Désabonnement "one-click" : requis par Gmail/Yahoo bulk sender policy
   (RFC 8058) pour les gros expéditeurs. Sans cet endpoint fonctionnel, les
   headers List-Unsubscribe des emails sont ignorés et la délivrabilité chute.

   Action :
   - Marque le prospect en "unsubscribed" dans la table
   - Bloque tous les futurs envois (blast, final-push, relances) pour ce prospect
   - Retourne une page HTML simple de confirmation (GET) ou 200 OK (POST)
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

function htmlPage(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
body{font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;background:#fafafa;color:#1a1a1a;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:20px}
.card{background:#fff;max-width:480px;padding:40px 32px;border-radius:16px;box-shadow:0 4px 24px rgba(0,0,0,0.06);text-align:center}
h1{font-size:22px;margin:0 0 14px;font-weight:600}
p{font-size:15px;color:#525252;line-height:1.6;margin:0 0 10px}
.logo{width:40px;height:40px;background:#0066ff;color:#fff;border-radius:8px;display:inline-flex;align-items:center;justify-content:center;font-weight:800;margin-bottom:20px}
.back{display:inline-block;margin-top:24px;color:#0066ff;text-decoration:none;font-size:14px;font-weight:500}
.back:hover{text-decoration:underline}
</style>
</head><body>
<div class="card">
<div class="logo">W</div>
${body}
<a class="back" href="https://klyora.fr">klyora.fr</a>
</div>
</body></html>`;
}

async function processUnsubscribe(id: string | null, email: string | null): Promise<{ ok: boolean; message: string }> {
  if (!id && !email) {
    return { ok: false, message: "Lien invalide (id ou email manquant)." };
  }

  const supabase = getSupabaseAdmin();

  try {
    // On accepte l'un OU l'autre : si on a l'id, on update par id ;
    // sinon par email (cas où l'utilisateur clique depuis un mail forwardé).
    let updated = false;
    const now = new Date().toISOString();

    if (id && /^[0-9a-f-]{36}$/i.test(id)) {
      const { error } = await supabase
        .from("prospects")
        .update({
          unsubscribed_at: now,
          status: "unsubscribed",
          notes: "Désabonné via one-click le " + now,
        })
        .eq("id", id);
      if (!error) updated = true;
    }

    if (!updated && email && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      const { error } = await supabase
        .from("prospects")
        .update({
          unsubscribed_at: now,
          status: "unsubscribed",
          notes: "Désabonné via one-click (par email) le " + now,
        })
        .eq("email", email.toLowerCase());
      if (!error) updated = true;
    }

    return updated
      ? { ok: true, message: "Votre adresse a bien été retirée de nos listes." }
      : { ok: false, message: "Nous n'avons pas trouvé votre adresse dans nos listes. Vous êtes déjà désabonné." };
  } catch {
    return { ok: false, message: "Erreur technique, réessayez dans quelques minutes ou écrivez à contact@klyora.fr." };
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const email = url.searchParams.get("email");
  const result = await processUnsubscribe(id, email);

  const body = result.ok
    ? `<h1>Désabonnement confirmé</h1>
       <p>${result.message}</p>
       <p>Vous ne recevrez plus de communications de Klyora Sites.</p>`
    : `<h1>Désabonnement</h1>
       <p>${result.message}</p>`;

  return new NextResponse(htmlPage("Désabonnement — Klyora Sites", body), {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

// POST pour la spec Gmail one-click (RFC 8058)
// https://datatracker.ietf.org/doc/html/rfc8058
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  let id = url.searchParams.get("id");
  let email = url.searchParams.get("email");

  // Tenter aussi le body form-encoded (certains clients Gmail envoient le
  // payload dans le body en application/x-www-form-urlencoded)
  if (!id && !email) {
    try {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/x-www-form-urlencoded")) {
        const text = await req.text();
        const params = new URLSearchParams(text);
        id = params.get("id");
        email = params.get("email");
      }
    } catch { /* ignore */ }
  }

  const result = await processUnsubscribe(id, email);
  return NextResponse.json({ success: result.ok, message: result.message }, { status: result.ok ? 200 : 400 });
}
