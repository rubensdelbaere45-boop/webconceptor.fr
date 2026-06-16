/**
 * POST /api/admin/rebrand-mockups-html
 *
 * Rebranding INTERNE des mockup_html stockés en DB :
 * remplace toutes les variantes WebConceptor → Klyora Sites
 * et webconceptor.fr → klyora.fr dans le HTML déjà généré.
 *
 * Ne touche PAS aux noms d'entreprise des prospects.
 * Idempotent.
 *
 * Auth : x-admin-key
 * Query : ?dry_run=1 → ne modifie rien, compte les occurrences
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

function rebrand(html: string): { html: string; touched: number } {
  let count = 0;
  const replace = (s: string, from: RegExp, to: string) => {
    const matches = s.match(from);
    if (matches) count += matches.length;
    return s.replace(from, to);
  };

  let out = html;
  out = replace(out, /WebConceptor/g, "Klyora Sites");
  out = replace(out, /WEBCONCEPTOR/g, "KLYORA SITES");
  out = replace(out, /webconceptor\.fr/g, "klyora.fr");
  out = replace(out, /tom@klyora\.fr/g, "contact@klyora.fr"); // legacy
  out = replace(out, /tom@webconceptor\.fr/g, "contact@klyora.fr");
  out = replace(out, /contact@webconceptor\.fr/g, "contact@klyora.fr");
  out = replace(out, /noreply@webconceptor\.fr/g, "noreply@klyora.fr");
  out = replace(out, /unsubscribe@webconceptor\.fr/g, "unsubscribe@klyora.fr");

  // Cleanup du marqueur interne "Générique premium (fallback)" qui apparaissait
  // dans les titles pour signaler une maquette générée avec template fallback.
  // → ne doit JAMAIS être visible côté prospect.
  out = replace(out, / — Générique premium \(fallback\)/g, "");
  out = replace(out, /Générique premium \(fallback\)/g, "");

  return { html: out, touched: count };
}

async function handler(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dry_run") === "1";
  const offset = Math.max(0, parseInt(req.nextUrl.searchParams.get("offset") || "0", 10));
  const limit = Math.min(1000, parseInt(req.nextUrl.searchParams.get("limit") || "1000", 10));
  const supabase = db();

  const { data, error } = await supabase
    .from("prospects")
    .select("id, name, slug, mockup_html")
    .not("mockup_html", "is", null)
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const prospects = data || [];
  let totalTouched = 0;
  let updated = 0;
  let unchanged = 0;
  const samples: Array<{ slug: string; touched: number }> = [];

  for (const p of prospects) {
    if (!p.mockup_html) continue;
    const { html: newHtml, touched } = rebrand(p.mockup_html);
    if (touched === 0) {
      unchanged++;
      continue;
    }
    totalTouched += touched;
    if (samples.length < 10) samples.push({ slug: p.slug, touched });
    if (!dryRun) {
      const { error: upErr } = await supabase
        .from("prospects")
        .update({ mockup_html: newHtml })
        .eq("id", p.id);
      if (!upErr) updated++;
    }
  }

  return NextResponse.json({
    dry_run: dryRun,
    total_prospects_scanned: prospects.length,
    occurrences_remplacees: totalTouched,
    mockups_modifies: dryRun ? "—" : updated,
    mockups_deja_propres: unchanged,
    samples,
  });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
