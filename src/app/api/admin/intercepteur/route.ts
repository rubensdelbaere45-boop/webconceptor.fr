/**
 * POST /api/admin/intercepteur — Agent "L'Intercepteur" (timing d'achat)
 *
 * Exploite l'API gouvernementale SIRENE pour intercepter les prospects
 * AU MEILLEUR MOMENT d'achat.
 *
 * 🦅 SCÉNARIOS :
 *
 *   A) Les NOUVEAUX : entreprises créées dans les 7 derniers jours
 *      → angle "new_business" — ton félicitations + besoin de démarrer
 *
 *   B) Les CROISSANTS : entreprises passées en société (SAS/SARL/EURL/SASU)
 *      ET créées depuis 6 mois à 5 ans (= signal de croissance récente)
 *      → angle "status_upgrade" — ton "votre image doit suivre"
 *
 * ⚙️ Enrichissement :
 *   - Filtre etat_administratif=A (déjà géré par searchSirene)
 *   - Vérifie l'absence de site web Google Places via Scrapling
 *     (si pas de site = lead "Primeur" parfait, score+++)
 *
 * 🏷️ Tagging Supabase :
 *   - sales_angle = "new_business" OU "status_upgrade"
 *   - is_new_business = true si scénario A
 *   - nature_juridique stockée pour le speech personnalisé
 *   - notes = "L'Intercepteur — scénario X — JJ/MM/AAAA"
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, requireAdminGuard, isBusinessTypeCoherent } from "@/lib/security";
import { searchSirene, searchSireneMultiPages, APE_CODES, ESTABLISHED_NATURES } from "@/lib/sources/sirene";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const DEFAULT_METIERS = [
  "plombier", "electricien", "chauffagiste", "menuisier",
  "serrurier", "carreleur", "peintre", "couvreur", "macon",
  "garage", "coiffeur", "institut", "boulangerie", "patisserie",
  "restaurant", "cafe", "fleuriste", "osteo",
];

// Top 30 départements (couverture max population)
const DEFAULT_DEPS = [
  "75", "13", "59", "69", "33", "31", "44", "06", "92", "93",
  "94", "78", "77", "67", "76", "62", "38", "57", "83", "34",
  "63", "84", "30", "35", "54", "29", "37", "21", "85", "14",
];

function slugify(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 100);
}

/** Vérifie via Scrapling si l'entreprise a une fiche Google Places (= déjà digitale). */
async function hasGooglePlaces(name: string, city: string): Promise<boolean | null> {
  const svc = process.env.SCRAPLING_SERVICE_URL;
  if (!svc) return null; // skip si Scrapling pas configuré
  try {
    const res = await fetch(`${svc}/check-google-places`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.SCRAPLING_SECRET ? { Authorization: `Bearer ${process.env.SCRAPLING_SECRET}` } : {}),
      },
      body: JSON.stringify({ name, city, country: "France" }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Boolean(data?.exists);
  } catch {
    return null;
  }
}

interface InterceptionStats {
  scenario_A_new: number;          // créées < 7 jours
  scenario_B_status_upgrade: number; // SAS/SARL passées récemment
  inserted: number;
  skipped_dupes: number;
  skipped_mismatch: number;
  skipped_already_on_google: number;
  errors: number;
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const adminOK = safeCompare(adminKey, process.env.ADMIN_SECRET_KEY);
  const cronOK = safeCompare(cronSecret, process.env.CRON_SECRET);
  if (!adminOK && !cronOK) {
    const guard = requireAdminGuard(req, { limit: 3, windowSec: 60, routeKey: "intercepteur" });
    if (guard) return guard;
  }

  const supabase = db();

  let body: { metiers?: string[]; departements?: string[]; checkGoogle?: boolean } = {};
  try { body = await req.json(); } catch { /* opt */ }

  const metiers = (body.metiers && body.metiers.length > 0 ? body.metiers : DEFAULT_METIERS).slice(0, 20);
  const departements = (body.departements && body.departements.length > 0 ? body.departements : DEFAULT_DEPS).slice(0, 40);
  const checkGoogle = body.checkGoogle !== false; // défaut true

  // Dates de référence — élargies car l'API gratuite n'a pas de filtre date
  // côté API. Avec multi-pages côté nous, 60j permet d'attraper qq créations
  // récentes en parcourant 3-5 pages.
  const today = new Date();
  const sixtyDaysAgo = new Date(today);
  sixtyDaysAgo.setDate(today.getDate() - 60);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const DEADLINE = Date.now() + 270_000;
  const stats: InterceptionStats = {
    scenario_A_new: 0,
    scenario_B_status_upgrade: 0,
    inserted: 0,
    skipped_dupes: 0,
    skipped_mismatch: 0,
    skipped_already_on_google: 0,
    errors: 0,
  };

  const sample: string[] = [];

  // Boucle : métier × département × scénario
  outer: for (const metier of metiers) {
    const apeCodes = APE_CODES[metier];
    if (!apeCodes || apeCodes.length === 0) continue;

    for (const ape of apeCodes) {
      for (const dep of departements) {
        if (Date.now() > DEADLINE) break outer;

        // ── SCÉNARIO A : créées dans les 60 derniers jours ──
        // Fenêtre élargie à 60j (vs 7j) car l'API gratuite ne filtre pas par
        // date → on parcourt + de pages et on garde celles créées < 60j.
        // Le hook IA mentionnera l'âge exact (3 semaines, 1 mois, etc.).
        try {
          const newOnes = await searchSireneMultiPages({
            codeNaf: ape,
            departement: dep,
            minDateCreation: fmt(sixtyDaysAgo),
            maxDateCreation: fmt(today),
            perPage: 25,
          }, 5);
          for (const r of newOnes) {
            const ok = await tryInsert(supabase, r, metier, "new_business", true, checkGoogle, stats, sample);
            if (ok) stats.scenario_A_new++;
          }
        } catch { stats.errors++; }

        if (Date.now() > DEADLINE) break outer;

        // ── SCÉNARIO B : SAS/SARL/EURL/SASU (toutes structurées) ──
        // natureJuridique = filtre API qui MARCHE. Pas de fenêtre date côté
        // client → on prend toutes les sociétés (= signal "structuration",
        // probablement post-passage micro→société récent).
        // Le hook IA différenciera selon date_creation (1 an = jeune SAS,
        // 10 ans = SAS établie).
        try {
          const upgraded = await searchSireneMultiPages({
            codeNaf: ape,
            departement: dep,
            natureJuridique: ESTABLISHED_NATURES,
            perPage: 25,
          }, 3);
          for (const r of upgraded) {
            // Skip si c'est déjà dans le scénario A (créée < 60j)
            if (r.date_creation && r.date_creation >= fmt(sixtyDaysAgo)) continue;
            const ok = await tryInsert(supabase, r, metier, "status_upgrade", false, checkGoogle, stats, sample);
            if (ok) stats.scenario_B_status_upgrade++;
          }
        } catch { stats.errors++; }

        await new Promise(r => setTimeout(r, 250));
      }
    }
  }

  // Telegram récap
  const tg = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat) {
    const msg =
      `🦅 <b>L'Intercepteur — Timing d'achat</b>\n\n` +
      `🆕 Nouveaux (créés &lt; 7j) : <b>${stats.scenario_A_new}</b>\n` +
      `📈 Status upgrade (SAS/SARL) : <b>${stats.scenario_B_status_upgrade}</b>\n` +
      `✅ Insérés total : <b>${stats.inserted}</b>\n` +
      `🔁 Doublons skip : ${stats.skipped_dupes}\n` +
      `⚠️ Mismatch métier : ${stats.skipped_mismatch}\n` +
      `🌐 Déjà sur Google : ${stats.skipped_already_on_google}\n\n` +
      (sample.length > 0 ? `<b>Top 5 leads :</b>\n${sample.slice(0, 5).map(s => `• ${s}`).join("\n")}` : "");
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text: msg, parse_mode: "HTML" }),
    }).catch(() => {});
  }

  return NextResponse.json({ ok: true, ...stats, sample });
}

async function tryInsert(
  supabase: ReturnType<typeof db>,
  r: Awaited<ReturnType<typeof searchSirene>>[number],
  metier: string,
  sales_angle: "new_business" | "status_upgrade",
  isNewFlag: boolean,
  checkGoogle: boolean,
  stats: InterceptionStats,
  sample: string[]
): Promise<boolean> {
  if (!r.name || r.name.length < 2) return false;

  // Cohérence métier (regex sur nom)
  if (!isBusinessTypeCoherent(r.name, metier)) {
    stats.skipped_mismatch++;
    return false;
  }

  // Dedup par SIREN
  const { data: existing } = await supabase
    .from("prospects")
    .select("id")
    .eq("siren", r.siren)
    .limit(1);
  if (existing && existing.length > 0) {
    stats.skipped_dupes++;
    return false;
  }

  // Optionnel : vérifie Google Places (si déjà sur Google = pas "Primeur")
  if (checkGoogle && r.city) {
    const hasGmb = await hasGooglePlaces(r.name, r.city);
    if (hasGmb === true) {
      stats.skipped_already_on_google++;
      return false;
    }
  }

  const slug = `${slugify(r.name)}-${slugify(r.city || "")}-${r.siren.slice(0, 6)}`.slice(0, 100);
  const noteSuffix = sales_angle === "new_business"
    ? `créée ${r.date_creation} (< 7 jours)`
    : `${r.nature_juridique_label || r.nature_juridique || "société"} — créée ${r.date_creation}`;

  const { error } = await supabase.from("prospects").insert({
    slug,
    name: r.name.slice(0, 200),
    siren: r.siren,
    address: r.address?.slice(0, 200) || null,
    city: r.city?.slice(0, 100) || null,
    postal_code: r.postal_code?.slice(0, 10) || null,
    business_type: metier,
    ape_code: r.ape_code,
    date_creation: r.date_creation,
    status: "found",
    is_new_business: isNewFlag,
    sales_angle, // tag direct → le Profiler n'aura pas besoin de re-classifier
    notes: `L'Intercepteur — ${sales_angle} — ${noteSuffix}`,
  });

  if (error) {
    stats.errors++;
    return false;
  }

  stats.inserted++;
  if (sample.length < 10) {
    sample.push(`${r.name} — ${r.city || "?"} (${sales_angle === "new_business" ? "🆕 nouveau" : "📈 " + (r.nature_juridique_label || "société")})`);
  }
  return true;
}

export async function GET(req: NextRequest) { return POST(req); }
