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

  // Récupère les événements de hard bounce des 90 derniers jours (max 2500)
  const events = ["hard_bounce", "invalid_email", "blocked"];
  const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  for (const event of events) {
    let offset = 0;
    const limit = 500;

    while (true) {
      const url = `https://api.brevo.com/v3/smtp/statistics/events?event=${event}&startDate=${startDate}&limit=${limit}&offset=${offset}`;
      const res = await fetch(url, {
        headers: { "api-key": brevoKey, "Accept": "application/json" },
      });
      if (!res.ok) break;

      const data = await res.json().catch(() => null);
      if (!data?.events || data.events.length === 0) break;

      for (const e of data.events) {
        if (typeof e.email === "string" && e.email.includes("@")) {
          bouncedEmails.add(e.email.toLowerCase().trim());
        }
      }

      if (data.events.length < limit) break;
      offset += limit;
    }
  }

  if (bouncedEmails.size === 0) {
    return NextResponse.json({ ok: true, bounced_found: 0, updated: 0 });
  }

  // Mise à jour en batch Supabase
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
    error: error?.message,
  });
}
