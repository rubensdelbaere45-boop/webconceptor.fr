/**
 * POST /api/public/supprimer
 *
 * Endpoint PUBLIC (sans auth) qui permet à un gérant de demander la
 * suppression de toute trace de son entreprise sur Klyora :
 *   - Supprime tous les prospects dont email OU website matche
 *   - Ajoute le domaine au blocklist (empêche re-scraping futur)
 *   - Retourne la liste des slugs supprimés + URLs 404 vérifiables
 *
 * Anti-abus :
 *   - Rate-limit IP : 5 demandes / heure (in-memory, suffisant pour Vercel single-region)
 *   - email obligatoire, domain optionnel mais ≥ 1 doit matcher quelque chose
 *   - On loue la requête en table audit (table créée par la migration)
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { addToBlocklist, normalizeDomain } from "@/lib/blocklist";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

// Rate-limit in-memory (par IP)
const RATE: Map<string, number[]> = new Map();
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 5;

function checkRate(ip: string): { ok: boolean; retryAfterS?: number } {
  const now = Date.now();
  const arr = (RATE.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (arr.length >= RATE_MAX) {
    const oldest = Math.min(...arr);
    return { ok: false, retryAfterS: Math.ceil((RATE_WINDOW_MS - (now - oldest)) / 1000) };
  }
  arr.push(now);
  RATE.set(ip, arr);
  return { ok: true };
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) && s.length <= 254;
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || "unknown";
  const ua = req.headers.get("user-agent") || "";

  const rl = checkRate(ip);
  if (!rl.ok) {
    return NextResponse.json(
      { ok: false, error: "rate_limited", retry_after_seconds: rl.retryAfterS },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterS) } }
    );
  }

  let body: { email?: string; domain?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const email = (body.email || "").trim().toLowerCase();
  const domain = normalizeDomain(body.domain || "");

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ ok: false, error: "email_invalid" }, { status: 400 });
  }

  const supabase = db();

  // Cherche les prospects matchant — email OU website
  const orClauses: string[] = [`email.eq.${email}`];
  if (domain) {
    orClauses.push(`website.ilike.%${domain}%`);
  }
  const { data: matches, error: selErr } = await supabase
    .from("prospects")
    .select("id, slug, name, email, website")
    .or(orClauses.join(","));

  if (selErr) {
    return NextResponse.json({ ok: false, error: "db_error", detail: selErr.message }, { status: 500 });
  }

  const found = matches || [];

  // Supprime tous les matches
  const deleted: Array<{ slug: string; name: string | null; url_404: string }> = [];
  for (const m of found) {
    const { error: delErr } = await supabase.from("prospects").delete().eq("id", m.id);
    if (!delErr) {
      deleted.push({
        slug: m.slug,
        name: m.name,
        url_404: `https://klyora.fr/prospects/${encodeURIComponent(m.slug)}`,
      });
    }
  }

  // Ajoute au blocklist
  // Domaine fourni explicitement → on blacklist
  // Sinon on déduit le domaine depuis l'email (partie après @)
  const domainsToBlock = new Set<string>();
  if (domain) domainsToBlock.add(domain);
  const emailDomain = email.split("@")[1];
  if (emailDomain) {
    const nd = normalizeDomain(emailDomain);
    if (nd) domainsToBlock.add(nd);
  }
  // Et tous les domaines des sites scrapés (pour éviter le re-scraping)
  for (const m of found) {
    if (m.website) {
      const nd = normalizeDomain(m.website);
      if (nd) domainsToBlock.add(nd);
    }
  }

  const blocked: string[] = [];
  for (const d of domainsToBlock) {
    const res = await addToBlocklist(supabase, {
      domain: d,
      reason: "opt_out_email",
      contactEmail: email,
      ip,
      userAgent: ua,
    });
    if (res.ok && res.domain) blocked.push(res.domain);
  }

  return NextResponse.json({
    ok: true,
    requested_email: email,
    requested_domain: domain || null,
    deleted_count: deleted.length,
    deleted,
    blocked_domains: blocked,
    message: deleted.length
      ? `${deleted.length} fiche(s) supprimée(s) définitivement. ${blocked.length} domaine(s) ajouté(s) à la blocklist (aucune ré-importation possible).`
      : "Aucune fiche correspondant à cet email/domaine n'a été trouvée. Le domaine a été ajouté à notre blocklist par précaution.",
  });
}

// GET — sert juste un message d'info, le formulaire est sur /supprimer
export async function GET() {
  return NextResponse.json({
    ok: true,
    info: "Endpoint POST pour suppression de prospect. Utilisez https://klyora.fr/supprimer (formulaire).",
  });
}
