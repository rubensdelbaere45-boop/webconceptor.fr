/**
 * POST /api/public/not-interested
 *
 * Endpoint appelé par le bouton "Je ne suis pas intéressé" injecté en bas
 * de chaque maquette /prospects/[slug]. Supprime instantanément le prospect,
 * ajoute son domaine au blocklist, et retourne 200 pour que le JS lance
 * l'animation poubelle.
 *
 * Sécurité :
 *   - Si le prospect a un access_code → exige le cookie d'accès valide
 *     (set au passage du gate). Sans cookie : 401.
 *   - Rate-limit IP : 10 / 5min (un humain en clic légitime, pas un bot)
 *   - Pas d'auth admin requise (c'est un endpoint UX consenti)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { hasValidAccessCookie } from "@/lib/access-code";
import { addToBlocklist } from "@/lib/blocklist";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const RATE: Map<string, number[]> = new Map();
const RATE_WINDOW_MS = 5 * 60 * 1000;
const RATE_MAX = 10;

function checkRate(ip: string): boolean {
  const now = Date.now();
  const arr = (RATE.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) return false;
  arr.push(now);
  RATE.set(ip, arr);
  return true;
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const ua = req.headers.get("user-agent") || "";

  if (!checkRate(ip)) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  let body: { slug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const slug = (body.slug || "").trim();
  if (!slug || slug.length > 100) {
    return NextResponse.json({ ok: false, error: "slug_required" }, { status: 400 });
  }

  const supabase = db();
  const { data: p, error } = await supabase
    .from("prospects")
    .select("id, slug, name, email, website, access_code")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !p) {
    // On retourne 200 quand même : si le slug n'existe pas, c'est déjà "supprimé"
    return NextResponse.json({ ok: true, alreadyDeleted: true });
  }

  // Si le prospect a un access_code, on exige le cookie d'accès valide
  // (impossible pour un tiers de DELETE le prospect d'un concurrent sans le code).
  if (p.access_code) {
    const valid = hasValidAccessCookie(req, slug, p.access_code);
    if (!valid) {
      return NextResponse.json({ ok: false, error: "access_required" }, { status: 401 });
    }
  }

  // DELETE prospect
  const { error: delErr } = await supabase.from("prospects").delete().eq("id", p.id);
  if (delErr) {
    return NextResponse.json({ ok: false, error: "delete_failed", detail: delErr.message }, { status: 500 });
  }

  // Blocklist : domaine du website + domaine de l'email (si présent)
  const blocked: string[] = [];
  if (p.website) {
    const res = await addToBlocklist(supabase, {
      domain: p.website,
      reason: "opt_out_email",
      contactEmail: p.email,
      ip,
      userAgent: ua,
    });
    if (res.ok && res.domain) blocked.push(res.domain);
  }
  if (p.email && p.email.includes("@")) {
    const emailDomain = p.email.split("@")[1];
    if (emailDomain) {
      const res = await addToBlocklist(supabase, {
        domain: emailDomain,
        reason: "opt_out_email",
        contactEmail: p.email,
        ip,
        userAgent: ua,
      });
      if (res.ok && res.domain && !blocked.includes(res.domain)) blocked.push(res.domain);
    }
  }

  return NextResponse.json({
    ok: true,
    deleted_slug: slug,
    blocked_domains: blocked,
  });
}
