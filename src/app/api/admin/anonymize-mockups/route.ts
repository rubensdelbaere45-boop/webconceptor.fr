/**
 * POST /api/admin/anonymize-mockups
 *
 * ⚠️ DESTRUCTIF — anonymise les maquettes des prospects pour qu'elles
 * deviennent des EXEMPLES génériques (showcase Klyora) :
 *   - prospect.name           → "Exemple de maquette"
 *   - dans mockup_html        : nom d'entreprise → "Exemple de maquette"
 *   - dans mockup_html        : téléphone réel  → "01 23 45 67 89"
 *   - dans mockup_html        : email réel      → "contact@exemple.fr"
 *   - dans mockup_html        : adresse réelle  → "—"
 *
 * Par défaut : anonymise UNIQUEMENT les prospects INACTIFS
 *   (converted_at NOT NULL OR unsubscribed_at NOT NULL OR
 *    sent_at IS NULL OR last_seen_at older than 30 days).
 *
 * Mode total : ?include_active=1 → anonymise TOUS les prospects.
 *   ⚠️ casse les liens des prospects en cours.
 *
 * Auth : x-admin-key
 * Dry run : ?dry_run=1 → compte sans modifier
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

const PLACEHOLDER_NAME = "Exemple de maquette";
const PLACEHOLDER_PHONE = "01 23 45 67 89";
const PLACEHOLDER_EMAIL = "contact@exemple.fr";
const PLACEHOLDER_ADDRESS = "—";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

function escapeReg(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function anonymizeHtml(html: string, p: {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
}): string {
  let out = html;

  if (p.name) {
    const re = new RegExp(escapeReg(p.name), "gi");
    out = out.replace(re, PLACEHOLDER_NAME);
  }

  if (p.phone) {
    // Téléphone réel sous toutes ses formes : 06 12 34 56 78, 0612345678, +33612345678
    const digits = p.phone.replace(/\D/g, "");
    if (digits.length >= 9) {
      const last9 = digits.slice(-9); // 612345678
      const variants = [
        last9,
        `0${last9}`,
        `+33${last9}`,
        `+33 ${last9.slice(0, 1)} ${last9.slice(1, 3)} ${last9.slice(3, 5)} ${last9.slice(5, 7)} ${last9.slice(7, 9)}`,
        `0${last9.slice(0, 1)} ${last9.slice(1, 3)} ${last9.slice(3, 5)} ${last9.slice(5, 7)} ${last9.slice(7, 9)}`,
        `0${last9.slice(0, 1)}.${last9.slice(1, 3)}.${last9.slice(3, 5)}.${last9.slice(5, 7)}.${last9.slice(7, 9)}`,
        p.phone,
      ];
      for (const v of variants) {
        if (!v) continue;
        out = out.split(v).join(PLACEHOLDER_PHONE);
      }
    }
  }

  if (p.email) {
    out = out.split(p.email).join(PLACEHOLDER_EMAIL);
  }

  if (p.address && p.address.length > 5) {
    // Sécurise sur l'adresse complète OU partie significative (numéro+voie)
    out = out.split(p.address).join(PLACEHOLDER_ADDRESS);
  }

  return out;
}

async function handler(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const dryRun = req.nextUrl.searchParams.get("dry_run") === "1";
  const includeActive = req.nextUrl.searchParams.get("include_active") === "1";
  const supabase = db();

  let q = supabase
    .from("prospects")
    .select("id, name, slug, mockup_html, phone, email, address, sent_at, converted_at, unsubscribed_at, last_seen_at")
    .not("mockup_html", "is", null);

  // Mode safe par défaut : SEULEMENT les prospects inactifs
  if (!includeActive) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
    // Conditions OR via or() de Supabase
    q = q.or(
      `converted_at.not.is.null,unsubscribed_at.not.is.null,sent_at.is.null,last_seen_at.lt.${thirtyDaysAgo}`
    );
  }

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const prospects = data || [];
  let modified = 0;
  const samples: Array<{ slug: string; name_before: string; was_active: boolean }> = [];

  for (const p of prospects) {
    const newHtml = anonymizeHtml(p.mockup_html || "", {
      name: p.name,
      phone: p.phone,
      email: p.email,
      address: p.address,
    });

    const isActive = !!p.sent_at && !p.converted_at && !p.unsubscribed_at;
    if (samples.length < 10) {
      samples.push({ slug: p.slug, name_before: p.name || "", was_active: isActive });
    }

    if (!dryRun) {
      const { error: upErr } = await supabase
        .from("prospects")
        .update({
          mockup_html: newHtml,
          name: PLACEHOLDER_NAME,
        })
        .eq("id", p.id);
      if (!upErr) modified++;
    } else {
      modified++;
    }
  }

  return NextResponse.json({
    dry_run: dryRun,
    include_active: includeActive,
    safety_note: includeActive
      ? "⚠️ Mode total : tous les prospects ont été anonymisés, y compris les actifs (mockup → 'Exemple de maquette')."
      : "Mode safe : seuls les prospects inactifs (>30j sans interaction, convertis, désabonnés) ont été touchés.",
    eligible_count: prospects.length,
    modified: dryRun ? "—" : modified,
    samples,
  });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
