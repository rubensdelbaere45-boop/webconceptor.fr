/**
 * POST /api/admin/scrape-sirene
 *
 * Prospection SIRENE — cible les entreprises CRÉÉES RÉCEMMENT (< N mois)
 * dans les métiers WebConceptor. Argumentaire imbattable :
 *   "Vous venez de créer votre entreprise — voici votre site offert"
 *
 * Pourquoi c'est mieux que Google Maps :
 *   - 11 M entreprises (vs ~300k commerces référencés Google)
 *   - Pas de quota, pas de clé API, gratuit illimité
 *   - Filtre par date de création → marché vierge, 0 concurrent contacté
 *   - Données officielles INSEE (à jour quotidiennement)
 *
 * Auth : x-admin-key
 *
 * Body :
 *   {
 *     metiers?: string[],     // ex: ["plombier","menuisier"] — défaut: artisans
 *     monthsBack?: number,    // âge max en mois (défaut 6)
 *     departements?: string[],// ex: ["75","69"] — défaut: top 30 dép.
 *     pagesPerQuery?: number, // 1-5, défaut 2 (= ~50 résultats)
 *     dryRun?: boolean
 *   }
 *
 * Retourne :
 *   { ok, queries_run, total_found, inserted, skipped_dupes, sample }
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, isBusinessTypeCoherent } from "@/lib/security";
import { searchSirene, APE_CODES } from "@/lib/sources/sirene";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

const DEFAULT_METIERS = [
  "plombier", "electricien", "chauffagiste", "menuisier",
  "serrurier", "carreleur", "peintre", "couvreur", "macon",
  "garage", "coiffeur", "institut",
];

// Top 30 départements les plus peuplés
const DEFAULT_DEPS = [
  "75", "13", "59", "69", "33", "31", "44", "06", "92", "93",
  "94", "78", "77", "67", "76", "62", "38", "57", "83", "34",
  "63", "84", "30", "35", "54", "29", "37", "21", "85", "14",
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

export async function POST(req: NextRequest) {
  // Auth
  const adminKey = req.headers.get("x-admin-key") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let raw: Record<string, unknown> = {};
  try { raw = await req.json(); } catch { /* body vide ok */ }

  const metiers = Array.isArray(raw.metiers) && raw.metiers.length > 0
    ? (raw.metiers as string[]).slice(0, 20)
    : DEFAULT_METIERS;
  const monthsBack = Math.min(24, Math.max(1, Math.floor(Number(raw.monthsBack) || 6)));
  const departements = Array.isArray(raw.departements) && raw.departements.length > 0
    ? (raw.departements as string[]).slice(0, 50)
    : DEFAULT_DEPS;
  const pagesPerQuery = Math.min(5, Math.max(1, Math.floor(Number(raw.pagesPerQuery) || 2)));
  const dryRun = Boolean(raw.dryRun);

  // Date de création minimum (entreprises créées il y a moins de N mois)
  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() - monthsBack);
  const minDateStr = minDate.toISOString().slice(0, 10);

  // Budget temps
  const DEADLINE = Date.now() + 270_000;
  const supabase = db();

  let queriesRun = 0;
  let totalFound = 0;
  let inserted = 0;
  let skippedDupes = 0;
  let skippedMismatch = 0;
  let errors = 0;
  const sample: string[] = [];

  outer: for (const metier of metiers) {
    const apeCodes = APE_CODES[metier];
    if (!apeCodes || apeCodes.length === 0) continue;

    for (const ape of apeCodes) {
      for (const dep of departements) {
        if (Date.now() > DEADLINE) break outer;

        for (let page = 1; page <= pagesPerQuery; page++) {
          if (Date.now() > DEADLINE) break outer;
          queriesRun++;

          try {
            const results = await searchSirene({
              codeNaf: ape,
              departement: dep,
              minDateCreation: minDateStr,
              perPage: 25,
              page,
            });

            if (results.length === 0) break; // pas plus de pages pour cette query
            totalFound += results.length;

            for (const r of results) {
              if (!r.name || r.name.length < 2) continue;

              // Garde-fou métier
              if (!isBusinessTypeCoherent(r.name, metier)) {
                skippedMismatch++;
                continue;
              }

              const slug = slugify(`${r.name}-${r.city || dep}-${r.siren.slice(0, 6)}`);

              // Dedup par slug ou siren
              const { data: existing } = await supabase
                .from("prospects")
                .select("id")
                .or(`slug.eq.${slug},siren.eq.${r.siren}`)
                .limit(1);

              if (existing && existing.length > 0) {
                skippedDupes++;
                continue;
              }

              if (!dryRun) {
                const { error: insErr } = await supabase.from("prospects").insert({
                  slug,
                  name: r.name.slice(0, 200),
                  siren: r.siren,
                  address: r.address?.slice(0, 200) || null,
                  city: r.city?.slice(0, 100) || null,
                  postal_code: r.postal_code?.slice(0, 10) || null,
                  business_type: metier,
                  ape_code: r.ape_code,
                  date_creation: r.date_creation,
                  source: "sirene_insee",
                  status: "found",
                  is_new_business: true, // marqueur pour le pitch "site offert"
                });
                if (insErr) {
                  errors++;
                  continue;
                }
              }

              inserted++;
              if (sample.length < 10) {
                sample.push(`${r.name} — ${r.city || dep} (créée ${r.date_creation})`);
              }
            }
          } catch {
            errors++;
          }

          // Petit délai entre pages (politesse API publique)
          await new Promise(r => setTimeout(r, 300));
        }
      }
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
    min_date_creation: minDateStr,
    sample,
  });
}
