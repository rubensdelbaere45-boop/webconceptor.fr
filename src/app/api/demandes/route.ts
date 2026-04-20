import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/security";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

// Bound strings so an attacker can't OOM the server nor blow up the DB row.
function trim(s: unknown, max: number): string {
  return String(s ?? "").slice(0, max);
}

const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

// POST: create a new demande (public — from the form)
export async function POST(req: NextRequest) {
  // 5 submissions per IP per 10 min — enough for a retry, stops spam bots
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`demandes:${ip}`, 5, 600);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Trop de demandes. Reessayez dans ${rl.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requete invalide" }, { status: 400 });
  }

  const nom = trim(body.nom, 120);
  const email = trim(body.email, 200);
  const activite = trim(body.activite, 200);

  if (!nom || !email || !activite) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Adresse email invalide" }, { status: 400 });
  }

  const { data, error } = await getSupabaseAdmin().from("demandes").insert({
    activite,
    besoin: trim(body.besoin, 500),
    has_site: Boolean(body.has_site),
    details: trim(body.details, 4000),
    style: trim(body.style, 200),
    exemples: trim(body.exemples, 2000),
    nom,
    email,
    telephone: trim(body.telephone, 30),
    budget: trim(body.budget, 50),
    site_url: trim(body.site_url, 500),
    audit_results: trim(body.audit_results, 10000),
    statut: "nouveau",
  }).select().single();

  if (error) {
    // Log full error server-side, return generic message to client
    console.error("[demandes] insert error:", error);
    return NextResponse.json({ error: "Impossible d'enregistrer la demande. Reessayez." }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}

// GET: list all demandes (admin only)
export async function GET(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  const authHeader = req.headers.get("authorization");

  // Allow access via admin key OR via authenticated admin user
  if (!adminKey && !authHeader) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  if (adminKey && adminKey !== process.env.ADMIN_SECRET_KEY) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const { data, error } = await getSupabaseAdmin()
    .from("demandes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[demandes] list error:", error);
    return NextResponse.json({ error: "Impossible de charger les demandes" }, { status: 500 });
  }

  return NextResponse.json(data);
}
