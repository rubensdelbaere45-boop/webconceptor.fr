/**
 * GET /api/prospect/details?slug=xxx
 *
 * Endpoint PUBLIC (pas d'auth — ne renvoie QUE les données safe pour prefill).
 * Récupère les infos du prospect pour pré-remplir le formulaire de checkout
 * (zéro friction).
 *
 * Génère AUSSI une suggestion de nom de domaine basée sur nom + ville.
 *
 * Rate-limit pour éviter le scrape de notre base prospects.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { rateLimit, getClientIp } from "@/lib/security";

export const dynamic = "force-dynamic";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

/** Slugifie un nom + ville pour suggérer un domaine. */
function suggestDomain(name: string, city: string): string {
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  const n = norm(name).slice(0, 25);
  const c = norm(city).slice(0, 20);
  if (!n) return "";
  if (!c || n.includes(c) || c.includes(n)) return n;
  return `${n}-${c}`.slice(0, 50);
}

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`prospect-details:${ip}`, 30, 60);
  if (!rl.ok) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  const slug = (req.nextUrl.searchParams.get("slug") || "").slice(0, 100);
  if (!slug) return NextResponse.json({ error: "slug requis" }, { status: 400 });

  const supabase = db();
  const { data: p } = await supabase
    .from("prospects")
    .select("name, city, phone, email, address, postal_code, business_type, contact_first_name, contact_last_name")
    .eq("slug", slug)
    .maybeSingle();

  if (!p) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });

  // Sépare le nom complet en prénom/nom si on n'a pas de champs dédiés
  let prenom = (p as { contact_first_name?: string }).contact_first_name || "";
  let nom = (p as { contact_last_name?: string }).contact_last_name || "";
  if (!prenom && !nom && p.name) {
    // On NE pré-remplit PAS avec le nom commercial — c'est trop risqué (peut être ≠ du nom du dirigeant).
    // On laisse vide pour que le prospect remplisse.
  }

  return NextResponse.json({
    prefill: {
      prenom,
      nom,
      email: p.email || "",
      telephone: p.phone || "",
      adresse: p.address || "",
      cp: p.postal_code || "",
      ville: p.city || "",
      entreprise: p.name || "",
    },
    business_type: p.business_type || "",
    suggested_domain: suggestDomain(p.name || "", p.city || ""),
  });
}
