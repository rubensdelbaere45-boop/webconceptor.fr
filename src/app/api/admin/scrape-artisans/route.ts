/**
 * POST /api/admin/scrape-artisans
 *
 * Scrape massif Pages Jaunes via le service Scrapling Railway,
 * pour récupérer un maximum d'artisans dans toute la France.
 *
 * Auth : x-admin-key uniquement.
 *
 * Body :
 *   {
 *     metiers?: string[],     // ex: ["plombier", "menuisier"] — défaut : tous artisans
 *     villes?: string[],      // ex: ["Paris", "Lyon"] — défaut : top 30 villes France
 *     pagesPerQuery?: number, // 1-5, défaut 3 (= ~60 résultats par query)
 *     dryRun?: boolean        // ne sauvegarde rien, retourne juste les counts
 *   }
 *
 * Retourne :
 *   { ok, queries_run, total_found, inserted, skipped_dupes, errors }
 *
 * IMPORTANT : appelle Scrapling via SCRAPLING_SERVICE_URL.
 * Aucune limite Google API — illimité.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, isBusinessTypeCoherent } from "@/lib/security";

export const dynamic = "force-dynamic";
export const maxDuration = 300; // 5 min max sur Vercel

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

// 12 métiers d'artisanat par défaut (cible prioritaire — budget élevé)
const DEFAULT_METIERS = [
  "plombier",
  "électricien",
  "chauffagiste",
  "menuisier",
  "serrurier",
  "carreleur",
  "peintre en bâtiment",
  "couvreur",
  "maçon",
  "carrosserie auto",
  "garage automobile",
  "ramoneur",
];

// Map métier → business_type Supabase
function inferBusinessType(metier: string): string {
  const m = metier.toLowerCase();
  if (m.includes("plomb") || m.includes("chauffag")) return "plombier";
  if (m.includes("électri") || m.includes("electric")) return "electricien";
  if (m.includes("menuis") || m.includes("ébén")) return "menuisier";
  if (m.includes("serrur")) return "serrurier";
  if (m.includes("carrele")) return "carreleur";
  if (m.includes("peintr")) return "peintre";
  if (m.includes("couvr") || m.includes("toit")) return "couvreur";
  if (m.includes("maçon") || m.includes("macon")) return "macon";
  if (m.includes("garage") || m.includes("carross") || m.includes("auto")) return "garage";
  return "artisan";
}

// 30 plus grandes villes par défaut
const DEFAULT_VILLES = [
  "Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Montpellier", "Strasbourg",
  "Bordeaux", "Lille", "Rennes", "Reims", "Saint-Étienne", "Toulon", "Grenoble", "Dijon",
  "Angers", "Nîmes", "Aix-en-Provence", "Le Mans", "Brest", "Tours", "Amiens", "Limoges",
  "Annecy", "Perpignan", "Besançon", "Orléans", "Metz", "Rouen",
];

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 100);
}

interface ScrapedBusiness {
  name: string;
  address?: string | null;
  city?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  website?: string | null;
}

async function callScraplingPj(activity: string, location: string, pages: number): Promise<ScrapedBusiness[]> {
  const serviceUrl = process.env.SCRAPLING_SERVICE_URL;
  const secret = process.env.SCRAPLING_SECRET;
  if (!serviceUrl) return [];

  try {
    const res = await fetch(`${serviceUrl}/scrape-pj`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { Authorization: `Bearer ${secret}` } : {}),
      },
      body: JSON.stringify({ activity, location, pages }),
      signal: AbortSignal.timeout(60_000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.results) ? data.results : [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────
  const adminKey = req.headers.get("x-admin-key") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Body ──────────────────────────────────────────
  let raw: Record<string, unknown> = {};
  try { raw = await req.json(); } catch { /* body vide accepté */ }

  const metiers = Array.isArray(raw.metiers) && raw.metiers.length > 0
    ? (raw.metiers as string[]).slice(0, 30)
    : DEFAULT_METIERS;
  const villes = Array.isArray(raw.villes) && raw.villes.length > 0
    ? (raw.villes as string[]).slice(0, 50)
    : DEFAULT_VILLES;
  const pagesPerQuery = Math.min(5, Math.max(1, Math.floor(Number(raw.pagesPerQuery) || 3)));
  const dryRun = Boolean(raw.dryRun);

  if (!process.env.SCRAPLING_SERVICE_URL) {
    return NextResponse.json({
      error: "SCRAPLING_SERVICE_URL not configured — déployer le service Scrapling Railway d'abord",
    }, { status: 503 });
  }

  // ── Budget temps : 5min Vercel max ────────────────
  const DEADLINE = Date.now() + 270_000; // 4min30 (laisse 30s de marge)
  const supabase = db();

  let queriesRun = 0;
  let totalFound = 0;
  let inserted = 0;
  let skippedDupes = 0;
  let skippedMismatch = 0;
  let errors = 0;
  const sample: string[] = [];

  // ── Boucle queries ─────────────────────────────────
  // Combinaisons : metier × ville
  outer: for (const metier of metiers) {
    for (const ville of villes) {
      if (Date.now() > DEADLINE) break outer;

      queriesRun++;
      const businessType = inferBusinessType(metier);

      try {
        const results = await callScraplingPj(metier, ville, pagesPerQuery);
        totalFound += results.length;

        for (const r of results) {
          if (!r.name || r.name.length < 2) continue;

          // Garde-fou métier : si nom révèle un métier ≠ businessType → skip
          if (!isBusinessTypeCoherent(r.name, businessType)) {
            skippedMismatch++;
            continue;
          }

          const slug = slugify(`${r.name}-${r.city || ville}`);

          // Dedup par slug ou par nom+ville
          const { data: existing } = await supabase
            .from("prospects")
            .select("id")
            .or(`slug.eq.${slug},and(name.eq.${r.name.replace(/[,()]/g, "")},city.eq.${(r.city || ville).replace(/[,()]/g, "")})`)
            .limit(1);

          if (existing && existing.length > 0) {
            skippedDupes++;
            continue;
          }

          if (!dryRun) {
            const { error: insErr } = await supabase.from("prospects").insert({
              slug,
              name: r.name.slice(0, 200),
              address: r.address?.slice(0, 200) || null,
              city: (r.city || ville).slice(0, 100),
              postal_code: r.postal_code?.slice(0, 10) || null,
              phone: r.phone?.slice(0, 20) || null,
              website: r.website?.slice(0, 500) || null,
              business_type: businessType,
              source: "pages_jaunes_scrapling",
              status: "found",
            });
            if (insErr) {
              errors++;
              continue;
            }
          }

          inserted++;
          if (sample.length < 10) sample.push(`${r.name} — ${r.city || ville}`);
        }
      } catch {
        errors++;
      }

      // Petit délai entre queries pour éviter le rate-limit Pages Jaunes
      await new Promise(r => setTimeout(r, 800));
    }
  }

  return NextResponse.json({
    ok: true,
    queries_run: queriesRun,
    total_found: totalFound,
    inserted,
    skipped_dupes: skippedDupes,
    skipped_mismatch: skippedMismatch,
    errors,
    dry_run: dryRun,
    sample,
  });
}
