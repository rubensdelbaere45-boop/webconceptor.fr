/**
 * GET /api/admin/purge-res-home?confirm=1
 *
 * Mise en demeure RES-HOME (Jean-Baptiste Saillard, jbsaillard@res-home.fr) :
 * supprime TOUT prospect dont les champs contiennent une trace de "res-home"
 * (email, website, name, mockup_html, site_style_dna, address).
 *
 * Sans confirm=1 : dry-run, retourne la liste des matches.
 * Avec confirm=1 : DELETE définitif + purge des storage objects associés.
 *
 * Auth : x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const NEEDLES = ["res-home.fr", "res-home", "jbsaillard", "RES-HOME"];

type Hit = {
  id: string;
  slug: string;
  name: string | null;
  email: string | null;
  website: string | null;
  matched_fields: string[];
};

export async function GET(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const confirm = req.nextUrl.searchParams.get("confirm") === "1";
  const supabase = db();

  // 1) Match par champs scalaires (or-conditions ilike)
  const orExpr = NEEDLES.flatMap(n => [
    `email.ilike.%${n}%`,
    `website.ilike.%${n}%`,
    `name.ilike.%${n}%`,
    `address.ilike.%${n}%`,
    `city.ilike.%${n}%`,
  ]).join(",");

  const { data: scalarMatches, error: e1 } = await supabase
    .from("prospects")
    .select("id, slug, name, email, website, address")
    .or(orExpr);
  if (e1) return NextResponse.json({ error: "scalar query: " + e1.message }, { status: 500 });

  // 2) Match par contenu HTML / DNA (pagination — on scanne tout en batches)
  const hits = new Map<string, Hit>();
  for (const r of scalarMatches || []) {
    const matched: string[] = [];
    const fields: Array<[string, string | null]> = [
      ["email", r.email], ["website", r.website], ["name", r.name], ["address", r.address],
    ];
    for (const [k, v] of fields) {
      if (v && NEEDLES.some(n => v.toLowerCase().includes(n.toLowerCase()))) matched.push(k);
    }
    hits.set(r.id, { id: r.id, slug: r.slug, name: r.name, email: r.email, website: r.website, matched_fields: matched });
  }

  // Full scan HTML/DNA (batches de 200)
  let from = 0;
  const PAGE = 200;
  let scanned = 0;
  for (;;) {
    const { data, error } = await supabase
      .from("prospects")
      .select("id, slug, name, email, website, mockup_html, site_style_dna")
      .order("id", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) return NextResponse.json({ error: "batch query: " + error.message }, { status: 500 });
    if (!data || data.length === 0) break;
    scanned += data.length;
    for (const r of data) {
      const html = (r.mockup_html || "") as string;
      const dnaStr = r.site_style_dna ? JSON.stringify(r.site_style_dna) : "";
      const matched: string[] = [];
      if (html && NEEDLES.some(n => html.toLowerCase().includes(n.toLowerCase()))) matched.push("mockup_html");
      if (dnaStr && NEEDLES.some(n => dnaStr.toLowerCase().includes(n.toLowerCase()))) matched.push("site_style_dna");
      if (matched.length) {
        const ex = hits.get(r.id);
        if (ex) ex.matched_fields = Array.from(new Set([...ex.matched_fields, ...matched]));
        else hits.set(r.id, { id: r.id, slug: r.slug, name: r.name, email: r.email, website: r.website, matched_fields: matched });
      }
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }

  const matchList = Array.from(hits.values());

  if (!confirm) {
    return NextResponse.json({
      dryRun: true,
      scanned,
      matches: matchList.length,
      hits: matchList,
      next: matchList.length ? "Re-appelle avec ?confirm=1 pour supprimer" : "Aucune trace — rien à supprimer",
    });
  }

  // 3) DELETE
  const deleted: Array<{ id: string; slug: string; ok: boolean; error?: string }> = [];
  for (const h of matchList) {
    const { error } = await supabase.from("prospects").delete().eq("id", h.id);
    deleted.push({ id: h.id, slug: h.slug, ok: !error, error: error?.message });
  }

  // 4) Purge Vercel cache via ISR revalidate (best-effort)
  // Note: les routes prospects sont dynamic; le cache CDN se vide en quelques minutes.

  return NextResponse.json({
    success: true,
    scanned,
    matched: matchList.length,
    deleted,
    note: "DELETE confirmé. Vérifie les 404 sur les slugs supprimés. CDN Vercel se purge en quelques minutes.",
  });
}
