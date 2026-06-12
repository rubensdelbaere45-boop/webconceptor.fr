// POST /api/admin/prospects/[id]/sms — envoie un SMS à 1 prospect via Brevo
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

function toE164(raw: string): string | null {
  const d = (raw || "").replace(/[^0-9+]/g, "");
  if (!d) return null;
  let n = d;
  if (n.startsWith("+33")) n = "0" + n.slice(3);
  else if (n.startsWith("33") && n.length === 11) n = "0" + n.slice(2);
  if (!/^0[67]\d{8}$/.test(n)) return null;
  return "+33" + n.slice(1);
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "id requis" }, { status: 400 });

  const { message } = await req.json().catch(() => ({} as { message?: string }));
  const supabase = db();
  const { data: p } = await supabase
    .from("prospects")
    .select("name, slug, phone")
    .eq("id", id)
    .maybeSingle();
  if (!p || !p.phone) return NextResponse.json({ error: "prospect/phone introuvable" }, { status: 404 });

  const mobile = toE164(p.phone);
  if (!mobile) return NextResponse.json({ error: "Numéro mobile invalide (06/07 requis)" }, { status: 400 });

  const text = (message && String(message).slice(0, 160)) ||
    `Bonjour, Tom de Klyora Sites. Votre maquette: klyora.fr/prospects/${p.slug}. Une question ? 06 35 59 24 71. Stop: STOP`;

  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "BREVO_API_KEY manquante" }, { status: 503 });

  try {
    const res = await fetch("https://api.brevo.com/v3/transactionalSMS/sms", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sender: "WebConcept", recipient: mobile, content: text.slice(0, 160), type: "transactional", unicodeEnabled: false }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      return NextResponse.json({ error: `Brevo HTTP ${res.status}: ${t.slice(0, 150)}` }, { status: 502 });
    }
    await supabase.from("prospects").update({ hot_sms_sent_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "error" }, { status: 500 });
  }
}
