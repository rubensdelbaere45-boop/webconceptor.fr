import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/cleanup-franchises
   Auth : x-admin-key

   Nettoie les prospects franchisés/chaînes déjà en base qui ont échappé à
   la blacklist d'origine (soit parce qu'ils ont été ajoutés avant la
   blacklist, soit parce que la blacklist a été durcie depuis).

   Approche :
   - On NE supprime PAS (préserve l'historique / analytics)
   - On marque `unsubscribed_at = now()` → filtré automatiquement de tous les
     sends futurs (blast, final-push, send, relances) car tous ces endpoints
     respectent `is("unsubscribed_at", null)`.
   - On ajoute une note "Franchise exclue (cleanup)" pour traçabilité.

   Query params :
   - ?dry_run=1 → liste les matches sans les modifier (défaut : false)
   - ?limit=N → max N prospects à traiter (défaut 500)
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

// Liste MEGA-FRANCHISES seulement : chaînes avec site corporate fort ET
// zéro autonomie locale. Garde ouvert pour Proxi/Vival/Utile/Spar/G20 etc.
// (petites franchises autonomes, souvent sans site → bonnes cibles).
// Doit rester synchro avec find/route.ts — factoriser dans un lib partagé V2.
const FRANCHISE_BLACKLIST = [
  // Sport / fitness
  "basic-fit", "basic fit", "basicfit", "fitness park", "on air fitness",
  "l'orange bleue", "keepcool", "keep cool", "magic form", "club med gym",
  "gymlib", "neoness", "cmg sports", "planet fitness",
  // Fast-food chaînes internationales
  "mcdonald", "mcdo", "burger king", "kfc", "quick", "subway", "starbucks",
  "five guys", "pizza hut", "domino", "pret a manger", "pret manger",
  "columbus café", "exki", "pomme de pain",
  // Restaurants chaînes intégrées
  "courtepaille", "buffalo grill", "memphis", "hippopotamus",
  "léon de bruxelles", "flunch", "bistro régent", "del arte",
  "la pizza de nico", "basilic & co", "la pataterie",
  // Supermarchés intégrés
  "franprix", "carrefour express", "carrefour city", "carrefour market",
  "monoprix", "lidl", "aldi", "leader price",
  "picard", "grand frais", "naturalia", "biocoop",
  // Beauté / parfumerie chaînes
  "yves rocher", "l'occitane", "marionnaud", "sephora", "nocibé",
  "body minute", "séphora", "the body shop", "lush", "kiko",
  // Coiffure chaînes nationales
  "jean louis david", "saint algue", "franck provost", "camille albane",
  "dessange", "coiff & co", "coiff&co", "coiff and co", "tchip",
  // Auto chaînes
  "speedy", "midas", "feu vert", "point s", "norauto", "roady", "euromaster",
  "vulco", "first stop", "ad expert", "carglass", "mondial pare-brise",
  // Auto-école grands réseaux
  "ecf", "auto école.com", "permisecolenet", "codes rousseau",
  "ornikar", "en voiture simone",
  // Optique chaînes
  "phone house", "generale optique", "optic 2000", "krys", "afflelou",
  "optical center", "grandoptical", "ekotiq", "acuitis",
  // Dentaire chaînes
  "dentilibre", "dentego", "générations dentaire",
  // Services franchisés multi-sites
  "elek maison", "plomberie.com", "ménage service",
];

function normalizeForMatch(s: string): string {
  return s.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isFranchiseName(name: string): { match: boolean; pattern?: string } {
  const normalized = ` ${normalizeForMatch(name)} `;
  for (const f of FRANCHISE_BLACKLIST) {
    const normF = normalizeForMatch(f);
    if (!normF) continue;
    if (normalized.includes(` ${normF} `)) {
      return { match: true, pattern: f };
    }
  }
  return { match: false };
}

async function handler(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dry_run") === "1" || url.searchParams.get("dry_run") === "true";
  const limit = Math.min(2000, Math.max(1, parseInt(url.searchParams.get("limit") || "500", 10)));

  const supabase = getSupabaseAdmin();

  // On fetch uniquement les prospects PAS déjà désabonnés pour ne pas re-traiter
  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, name, slug, city, status, unsubscribed_at")
    .is("unsubscribed_at", null)
    .limit(limit);

  if (error) {
    console.error("[cleanup-franchises] query error:", error);
    return NextResponse.json({ error: "DB query failed" }, { status: 500 });
  }

  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, matched: 0, message: "Aucun prospect à auditer" });
  }

  const matches = prospects
    .map((p) => ({ ...p, ...isFranchiseName(p.name || "") }))
    .filter((p) => p.match);

  if (matches.length === 0) {
    return NextResponse.json({
      success: true,
      scanned: prospects.length,
      matched: 0,
      message: "Aucune franchise détectée",
    });
  }

  if (dryRun) {
    return NextResponse.json({
      success: true,
      dry_run: true,
      scanned: prospects.length,
      matched: matches.length,
      franchises: matches.map((m) => ({
        id: m.id,
        name: m.name,
        slug: m.slug,
        city: m.city,
        status: m.status,
        matched_pattern: m.pattern,
      })),
    });
  }

  // Exécution : marque chaque franchise avec unsubscribed_at + note
  const now = new Date().toISOString();
  const results: Array<{ id: string; name: string; status: string }> = [];
  for (const m of matches) {
    const { error: updateErr } = await supabase
      .from("prospects")
      .update({
        unsubscribed_at: now,
        notes: `Franchise/chaîne exclue (cleanup auto) — pattern: ${m.pattern} — le ${now}`,
      })
      .eq("id", m.id);
    results.push({
      id: m.id,
      name: m.name,
      status: updateErr ? "error" : "excluded",
    });
  }

  const excluded = results.filter((r) => r.status === "excluded").length;
  return NextResponse.json({
    success: true,
    scanned: prospects.length,
    matched: matches.length,
    excluded,
    results,
  });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
