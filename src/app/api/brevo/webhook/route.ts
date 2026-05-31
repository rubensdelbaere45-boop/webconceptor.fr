import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════
   POST /api/brevo/webhook
   Reçoit les événements Brevo en temps réel.
   Config Brevo → Transactionnel → Webhooks :
     URL : https://webconceptor.fr/api/brevo/webhook
     Événements : hard_bounce, blocked, invalid_email, unsubscribed
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const HARD_BOUNCE_EVENTS = new Set([
  "hard_bounce", "invalid_email", "blocked", "error",
]);

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Vérification du token Brevo (configuré dans l'interface webhook)
  const token = req.headers.get("x-brevo-token") || req.headers.get("authorization") || "";
  const expectedToken = process.env.ADMIN_SECRET_KEY || "";
  if (expectedToken && !token.includes(expectedToken)) {
    return NextResponse.json({ ok: true }); // 200 silencieux — pas de 401 (Brevo abandonne en cas d'erreur)
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ ok: true });

    const events: unknown[] = Array.isArray(body) ? body : [body];
    const supabase = getSupabaseAdmin();
    let bounced = 0;
    let unsubscribed = 0;

    for (const evt of events) {
      if (typeof evt !== "object" || evt === null) continue;
      const e = evt as Record<string, unknown>;
      const email = typeof e.email === "string" ? e.email.toLowerCase().trim() : null;
      const event = typeof e.event === "string" ? e.event : null;
      if (!email || !event) continue;

      if (HARD_BOUNCE_EVENTS.has(event)) {
        const { error } = await supabase
          .from("prospects")
          .update({ email_bounced: true })
          .eq("email", email);
        if (!error) bounced++;
      } else if (event === "unsubscribed") {
        const { error } = await supabase
          .from("prospects")
          .update({ unsubscribed_at: new Date().toISOString() })
          .eq("email", email)
          .is("unsubscribed_at", null);
        if (!error) unsubscribed++;
      }
    }

    return NextResponse.json({ ok: true, bounced, unsubscribed });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
