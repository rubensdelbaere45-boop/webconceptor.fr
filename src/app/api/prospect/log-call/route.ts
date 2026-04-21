import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/log-call
   Body :
     { prospect_id: string, action: "called" | "note" | "uncall", text?: string }

   Append une ligne timestampée dans la colonne 'notes' du prospect :
   - action "called" → "[2026-04-21 14:30] 📞 APPELÉ"
   - action "note"   → "[2026-04-21 15:45] 📝 {text}"
   - action "uncall" → supprime la ligne APPELÉ d'aujourd'hui (uncheck)

   Retourne la colonne notes mise à jour pour que le client rafraîchisse.
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

function parisTimestamp(): string {
  // "2026-04-21 14:30" en heure de Paris
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value || "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

function todayParisDate(): string {
  // "2026-04-21"
  return parisTimestamp().slice(0, 10);
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
  const action = body.action;
  const text = typeof body.text === "string" ? body.text.slice(0, 1000).trim() : "";

  if (!prospect_id) {
    return NextResponse.json({ error: "prospect_id invalide" }, { status: 400 });
  }
  if (action !== "called" && action !== "note" && action !== "uncall") {
    return NextResponse.json({ error: "action invalide (called | note | uncall)" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  const { data: prospect, error: selectErr } = await supabase
    .from("prospects")
    .select("id, notes")
    .eq("id", prospect_id)
    .maybeSingle();

  if (selectErr || !prospect) {
    return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  }

  const currentNotes = typeof prospect.notes === "string" ? prospect.notes : "";

  let newNotes = currentNotes;
  if (action === "called") {
    const line = `[${parisTimestamp()}] 📞 APPELÉ`;
    newNotes = currentNotes ? `${line}\n${currentNotes}` : line;
  } else if (action === "note") {
    if (!text) {
      return NextResponse.json({ error: "text manquant pour une note" }, { status: 400 });
    }
    const line = `[${parisTimestamp()}] 📝 ${text}`;
    newNotes = currentNotes ? `${line}\n${currentNotes}` : line;
  } else if (action === "uncall") {
    // Retire la 1re ligne APPELÉ d'AUJOURD'HUI (permet de décocher si clic par erreur)
    const today = todayParisDate();
    const lines = currentNotes.split("\n");
    const filtered: string[] = [];
    let removed = false;
    for (const ln of lines) {
      if (!removed && ln.startsWith(`[${today}`) && ln.includes("📞 APPELÉ")) {
        removed = true;
        continue;
      }
      filtered.push(ln);
    }
    newNotes = filtered.join("\n").trim();
  }

  const { error: updateErr } = await supabase
    .from("prospects")
    .update({ notes: newNotes })
    .eq("id", prospect_id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, notes: newNotes });
}
