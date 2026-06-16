/**
 * POST /api/admin/fix-broken-images
 *
 * Scanne tous les mockup_html en DB et remplace les URLs d'images qui ne sont
 * PAS sur un host de confiance (Unsplash, klyora.fr, picsum…) par des URLs
 * Unsplash dynamiques basées sur le métier du prospect.
 *
 * → Élimine les images cassées (sites des prospects morts, CORS, 404, ou
 *   contenant des visages) en un seul run.
 *
 * Auth : x-admin-key
 * Query : ?dry_run=1, ?offset=0, ?limit=1000
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

// Hosts d'images acceptés (Unsplash + nos propres assets)
const SAFE_HOST = /^(?:https?:)?\/\/(?:images\.unsplash\.com|source\.unsplash\.com|klyora\.fr|picsum\.photos|placehold\.co|via\.placeholder\.com|fonts\.gstatic\.com|fonts\.googleapis\.com)/i;

// Image fallback par métier (toutes Unsplash, sans visages, intérieur/produit)
const FALLBACK_BY_TYPE: Record<string, string[]> = {
  restaurant:  [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1600&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1600&q=85&auto=format&fit=crop",
  ],
  pizzeria: [
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1600&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1600&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=1600&q=85&auto=format&fit=crop",
  ],
  boulangerie: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555507036-ab794f4afe5a?w=1600&q=85&auto=format&fit=crop",
  ],
  patisserie: [
    "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=1600&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=1600&q=85&auto=format&fit=crop",
  ],
  cafe: ["https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1600&q=85&auto=format&fit=crop"],
  glacier: ["https://images.unsplash.com/photo-1567206563114-c179900d7065?w=1600&q=85&auto=format&fit=crop"],
  coiffeur: [
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1600&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=85&auto=format&fit=crop",
  ],
  institut: ["https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1600&q=85&auto=format&fit=crop"],
  spa: [
    "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=1600&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1591343395082-e120087004b4?w=1600&q=85&auto=format&fit=crop",
  ],
  fleuriste: ["https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1600&q=85&auto=format&fit=crop"],
  dentiste: ["https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1600&q=85&auto=format&fit=crop"],
  garage: ["https://images.unsplash.com/photo-1632823471565-1ecdf5664c1e?w=1600&q=85&auto=format&fit=crop"],
  plombier: ["https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1600&q=85&auto=format&fit=crop"],
  electricien: ["https://images.unsplash.com/photo-1581094288338-2314dddb7ece?w=1600&q=85&auto=format&fit=crop"],
  menuisier: ["https://images.unsplash.com/photo-1601058268499-e52658b8bb88?w=1600&q=85&auto=format&fit=crop"],
  default: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=85&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1600&q=85&auto=format&fit=crop",
  ],
};

function pickFallback(type: string | null | undefined, idx: number): string {
  const t = (type || "").toLowerCase();
  const pool = FALLBACK_BY_TYPE[t] || FALLBACK_BY_TYPE.default;
  return pool[idx % pool.length];
}

function fixImagesInHtml(html: string, businessType: string | null): { html: string; replaced: number } {
  let count = 0;
  let idx = 0;

  // Pattern 1 : src="..." dans <img>, <source>, <link>
  let out = html.replace(/(\bsrc\s*=\s*)(["'])(https?:\/\/[^"']+)(\2)/gi, (m, prefix, q, url, q2) => {
    if (SAFE_HOST.test(url)) return m;
    count++;
    return `${prefix}${q}${pickFallback(businessType, idx++)}${q2}`;
  });

  // Pattern 2 : background-image: url("...") dans style inline ou <style>
  out = out.replace(/(background(?:-image)?\s*:\s*url\(\s*)(["']?)(https?:\/\/[^"')\s]+)(\2)(\s*\))/gi, (m, prefix, q, url, q2, suffix) => {
    if (SAFE_HOST.test(url)) return m;
    count++;
    return `${prefix}${q}${pickFallback(businessType, idx++)}${q2}${suffix}`;
  });

  // Pattern 3 : srcset="url1 1x, url2 2x"
  out = out.replace(/(\bsrcset\s*=\s*)(["'])([^"']+)(\2)/gi, (m, prefix, q, list, q2) => {
    const parts = list.split(",").map((p: string) => p.trim());
    let changed = false;
    const newParts = parts.map((p: string) => {
      const [u, descriptor] = p.split(/\s+/, 2);
      if (!u || SAFE_HOST.test(u)) return p;
      changed = true;
      count++;
      return `${pickFallback(businessType, idx++)}${descriptor ? " " + descriptor : ""}`;
    });
    return changed ? `${prefix}${q}${newParts.join(", ")}${q2}` : m;
  });

  return { html: out, replaced: count };
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
    .select("id, slug, business_type, mockup_html")
    .not("mockup_html", "is", null)
    .order("id", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const prospects = data || [];
  let mockupsModifies = 0;
  let totalReplaced = 0;
  const samples: Array<{ slug: string; replaced: number }> = [];

  for (const p of prospects) {
    if (!p.mockup_html) continue;
    const { html: newHtml, replaced } = fixImagesInHtml(p.mockup_html, p.business_type);
    if (replaced === 0) continue;
    totalReplaced += replaced;
    if (samples.length < 10) samples.push({ slug: p.slug, replaced });
    if (!dryRun) {
      const { error: upErr } = await supabase
        .from("prospects")
        .update({ mockup_html: newHtml })
        .eq("id", p.id);
      if (!upErr) mockupsModifies++;
    } else {
      mockupsModifies++;
    }
  }

  return NextResponse.json({
    dry_run: dryRun,
    offset,
    limit,
    scanned: prospects.length,
    images_remplacees: totalReplaced,
    mockups_modifies: mockupsModifies,
    samples,
  });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
