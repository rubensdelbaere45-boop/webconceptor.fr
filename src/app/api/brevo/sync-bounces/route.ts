import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/brevo/sync-bounces
   Auth : x-admin-key
   Récupère tous les hard bounces Brevo des 90 derniers jours
   et marque email_bounced = true dans Supabase.
   À lancer une fois manuellement pour nettoyer la liste.
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const adminKey = req.headers.get("x-admin-key") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) return NextResponse.json({ error: "BREVO_API_KEY manquante" }, { status: 500 });

  const supabase = getSupabaseAdmin();
  const bouncedEmails = new Set<string>();
  const debugInfo: Record<string, unknown> = {};

  // Noms exacts des événements dans l'API Brevo v3
  // Doc : https://developers.brevo.com/reference/getemaileventreport
  const brevoEvents = ["hardBounces", "invalid", "blocked"];
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  for (const event of brevoEvents) {
    let offset = 0;
    const limit = 500;
    let totalForEvent = 0;

    while (true) {
      const url = `https://api.brevo.com/v3/smtp/statistics/events?event=${event}&startDate=${startDate}&limit=${limit}&offset=${offset}`;
      const res = await fetch(url, {
        headers: { "api-key": brevoKey, "Accept": "application/json" },
      });

      if (!res.ok) {
        debugInfo[event] = { status: res.status, error: await res.text().catch(() => "?") };
        break;
      }

      const data = await res.json().catch(() => null);

      // Brevo peut retourner un tableau direct ou { events: [...] }
      const list: unknown[] = Array.isArray(data) ? data : (Array.isArray(data?.events) ? data.events : []);

      if (list.length === 0) break;

      for (const e of list) {
        if (typeof e === "object" && e !== null) {
          const email = (e as Record<string, unknown>).email;
          if (typeof email === "string" && email.includes("@")) {
            bouncedEmails.add(email.toLowerCase().trim());
            totalForEvent++;
          }
        }
      }

      if (list.length < limit) break;
      offset += limit;
    }

    debugInfo[event] = totalForEvent;
  }

  if (bouncedEmails.size === 0) {
    return NextResponse.json({ ok: true, bounced_found: 0, updated: 0, debug: debugInfo });
  }

  // Mise à jour en batch Supabase — email_bounced doit exister dans la table prospects
  const emailList = Array.from(bouncedEmails);
  const { error, data: updated } = await supabase
    .from("prospects")
    .update({ email_bounced: true })
    .in("email", emailList)
    .select("id");

  return NextResponse.json({
    ok: true,
    bounced_found: emailList.length,
    updated: updated?.length ?? 0,
    supabase_error: error?.message,
    debug: debugInfo,
  });
}
