/**
 * POST /api/admin/profiler — Agent 1 de la Fleet
 *
 * Mission : qualifier les nouveaux leads scrapés. Pour chaque prospect
 * sans sales_angle :
 *   1. Analyse contexte (business_type, website, google_rating, city)
 *   2. Détermine l'angle de vente :
 *      - "no_website"      → pas de site → angle visibilité
 *      - "low_rating"      → note < 3.8 → angle réputation
 *      - "restaurant_qr"   → resto → angle menu digital
 *      - "artisan_devis"   → artisan → angle devis 24/7
 *      - "new_business"    → entreprise récente → angle lancement
 *      - "generic"         → fallback
 *   3. Génère un custom_hook (1 phrase d'accroche ultra-personnalisée)
 *      via OpenRouter Kimi K2
 *   4. Met à jour Supabase : sales_angle + custom_hook
 *
 * Cadence : 30 prospects/run. N8N le call 4×/jour la journée.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, requireAdminGuard } from "@/lib/security";
import { llmCall } from "@/lib/ebook/llm-client";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

interface Prospect {
  id: string;
  name: string;
  city: string | null;
  business_type: string | null;
  website: string | null;
  google_rating: number | null;
  is_new_business: boolean | null;
  date_creation: string | null;
}

type Angle =
  | "no_website"
  | "low_rating"
  | "restaurant_qr"
  | "artisan_devis"
  | "new_business"          // < 6 mois (créée TRÈS récemment)
  | "young_business"        // 6 mois - 2 ans
  | "mature_business"       // 2-5 ans
  | "established_business"  // 5-15 ans
  | "historic_business"     // 15+ ans
  | "status_upgrade"        // passage en SAS/SARL/EURL (Intercepteur scénario B)
  | "generic";

/**
 * Calcule l'âge de l'entreprise en années (basé sur date_creation SIRENE).
 * Retourne null si pas de date dispo.
 */
function calcBusinessAgeYears(dateCreation: string | null): number | null {
  if (!dateCreation) return null;
  try {
    const created = new Date(dateCreation);
    const now = new Date();
    const years = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (Number.isFinite(years) && years >= 0 && years < 200) return years;
  } catch { /* ignore */ }
  return null;
}

function detectAngle(p: Prospect): Angle {
  // Priorité : signaux de douleur d'abord (pas-site, mauvaise note)
  if (!p.website || p.website.trim() === "") return "no_website";
  if (p.google_rating && p.google_rating > 0 && p.google_rating < 3.8) return "low_rating";

  // Ensuite : segmentation par âge depuis SIRENE (NOUVEAU)
  // Tom : "n'oublie pas les entreprises plus anciennes, juste avec un speech différent"
  const ageYears = calcBusinessAgeYears(p.date_creation);
  if (p.is_new_business || (ageYears !== null && ageYears < 0.5)) return "new_business";       // < 6 mois
  if (ageYears !== null && ageYears < 2)  return "young_business";       // 6m - 2 ans
  if (ageYears !== null && ageYears < 5)  return "mature_business";      // 2-5 ans
  if (ageYears !== null && ageYears < 15) return "established_business"; // 5-15 ans
  if (ageYears !== null && ageYears >= 15) return "historic_business";   // 15+ ans

  // Pas d'âge connu : fallback sur le métier
  const t = (p.business_type || "").toLowerCase();
  if (/restaur|brasser|bistr|pizz|crêper|creperie|café|cafe|glacier|fast.?food/.test(t)) return "restaurant_qr";
  if (/plomb|electrici|menuis|serrur|carrele|peintr|couvr|maçon|garage|chauffag/.test(t)) return "artisan_devis";
  return "generic";
}

const HOOK_SYSTEM = `Tu rédiges UNE phrase d'accroche commerciale ultra-courte en français pour un email.

Règles :
- 1 seule phrase, max 130 caractères
- Tutoie pas, vouvoie
- Mentionne UN détail SPÉCIFIQUE du prospect (sa note Google, son métier, sa ville, son âge d'entreprise)
- Évite le "Bonjour", c'est déjà dans l'email
- Évite "Je vois que…", "J'ai vu…" — trop générique
- Tonalité : empathique, jamais agressive
- Pas de marketing, pas de superlatifs ("révolutionnaire", "incroyable")
- L'accroche doit ressembler à quelque chose qu'un humain écrirait

ADAPTER LE TON SELON L'ANGLE :

▸ new_business (< 6 mois) — ton PROFESSIONNEL + EMPATHIQUE
  Esprit : "Vous venez de créer votre entreprise, vous ne pouvez pas tout gérer
  tout seul. Faites-vous connaître sur Internet et améliorez votre chiffre d'affaires."
  Ex : "Vous venez de lancer votre menuiserie à Toulon — un site web vous fera connaître plus vite que le bouche-à-oreille seul."
  Ex : "À ce stade, gérer la prospection et la production en parallèle est impossible — un site web travaille pour vous 24h/24."

▸ status_upgrade (passage en SAS/SARL/EURL) — ton CROISSANCE PROFESSIONNALISÉE
  Esprit : "Votre entreprise grandit, votre image en ligne doit suivre."
  Ex : "Votre passage récent en SAS à Lyon marque une étape — votre image en ligne mérite de refléter cette nouvelle structure."
  Ex : "Une SARL inspire plus confiance qu'une micro-entreprise — un site web pro consolide cette crédibilité auprès de vos clients."

▸ young_business (6m - 2 ans) — ton PHASE DE CROISSANCE + visibilité
  Ex : "À 1 an d'activité, votre plomberie à Lyon perd des clients qui Googlisent avant d'appeler."

▸ mature_business (2-5 ans) — ton PROFESSIONNALISATION + fidélisation
  Ex : "Après 3 ans à construire votre clientèle à Bordeaux, c'est le moment de transformer le bouche-à-oreille en visites Google."

▸ established_business (5-15 ans) — ton EXPÉRIENCE = CONFIANCE
  Ex : "8 ans à Rennes et vos clients vous connaissent — votre site web doit refléter cette expérience pour rassurer les nouveaux prospects."

▸ historic_business (15+ ans) — ton HÉRITAGE + MODERNITÉ RESPECTUEUSE
  Ex : "Une entreprise comme la vôtre, créée en 1998 à Strasbourg, mérite une vitrine digitale qui valorise ce parcours."

▸ no_website — angle URGENCE VISIBILITÉ
  Ex : "Sans site, votre fleuriste à Nantes est invisible pour 70 % des recherches Google du quartier."

▸ low_rating — angle RÉPUTATION RÉCUPÉRABLE
  Ex : "Avec 3,4/5, votre garage à Lyon est filtré par les clients qui n'affichent que les 4+ étoiles."

▸ restaurant_qr — angle MENU DIGITAL
  Ex : "Un menu QR code en salle, plus de PDF à mettre à jour — c'est ce que je propose à votre brasserie à Lille."

▸ artisan_devis — angle DEVIS 24/7
  Ex : "Un module devis en ligne 24/7 pour votre menuiserie : vos clients génèrent leur devis sans vous déranger."

Réponds UNIQUEMENT avec la phrase, pas de guillemets, pas de préambule.`;

async function generateCustomHook(p: Prospect, angle: Angle): Promise<string> {
  const ageYears = calcBusinessAgeYears(p.date_creation);
  const ageStr = ageYears !== null
    ? (ageYears < 1 ? `${Math.round(ageYears * 12)} mois` : `${Math.floor(ageYears)} ans`)
    : "(âge inconnu)";

  const userPrompt = `Prospect :
- Nom : ${p.name}
- Ville : ${p.city || "(non renseignée)"}
- Métier : ${p.business_type || "(non renseigné)"}
- Site web : ${p.website ? "oui (" + p.website + ")" : "AUCUN"}
- Note Google : ${p.google_rating ? p.google_rating.toFixed(1) + "/5" : "(non renseignée)"}
- Âge de l'entreprise : ${ageStr}${p.date_creation ? ` (créée ${p.date_creation})` : ""}

Angle commercial choisi : ${angle}

Écris UNE phrase d'accroche personnalisée qui MENTIONNE l'âge précis quand pertinent (ex: "À 3 ans", "Après 8 ans", "1998 à Strasbourg").`;

  try {
    const text = await llmCall({
      system: HOOK_SYSTEM,
      messages: [{ role: "user", content: userPrompt }],
      maxTokens: 200,
    });
    return text.trim().replace(/^["'«»]|["'«»]$/g, "").slice(0, 200);
  } catch {
    // Fallback statique si LLM down
    return fallbackHook(p, angle);
  }
}

function fallbackHook(p: Prospect, angle: Angle): string {
  const cityTxt = p.city ? ` à ${p.city}` : "";
  const ageYears = calcBusinessAgeYears(p.date_creation);
  const ageInt = ageYears !== null ? Math.floor(ageYears) : null;
  const createdYear = p.date_creation ? new Date(p.date_creation).getFullYear() : null;

  switch (angle) {
    case "no_website":          return `Sans site web visible, ${p.name}${cityTxt} laisse passer beaucoup de clients qui cherchent sur Google.`;
    case "low_rating":          return `Avec ${p.google_rating?.toFixed(1)}/5 sur Google, ${p.name} est filtrée par les clients qui ne regardent que les 4+ étoiles.`;
    case "restaurant_qr":       return `Un menu QR code en salle, plus de PDF à mettre à jour — c'est ce que je propose à ${p.name}.`;
    case "artisan_devis":       return `Un module de devis en ligne 24/7 pour ${p.name} — vos clients génèrent leur devis sans vous déranger.`;
    case "new_business":        return `Vous venez de lancer ${p.name}${cityTxt} — vous ne pouvez pas tout gérer seul, un site web travaille pour vous 24h/24 et améliore votre chiffre d'affaires.`;
    case "status_upgrade":      return `Le passage de ${p.name} en société à ${p.city || "votre ville"} marque une étape — votre image en ligne mérite de refléter cette nouvelle structure.`;
    case "young_business":      return `À ${ageInt || 1} an${ageInt && ageInt > 1 ? "s" : ""} d'activité, ${p.name}${cityTxt} perd 70 % des clients qui Googlisent avant d'appeler.`;
    case "mature_business":     return `Après ${ageInt || 3} ans à construire votre clientèle${cityTxt}, c'est le moment de transformer le bouche-à-oreille en visites Google.`;
    case "established_business":return `${ageInt || 8} ans${cityTxt} et vos clients vous connaissent — votre site doit refléter cette expérience pour rassurer les prospects.`;
    case "historic_business":   return `Une entreprise comme la vôtre, créée ${createdYear ? "en " + createdYear : "il y a plus de 15 ans"}${cityTxt}, mérite une vitrine digitale qui valorise ce parcours.`;
    default:                    return `Un site web pro pour ${p.name}, livré en 5 jours, à 50€/mois tout compris.`;
  }
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const adminOK = safeCompare(adminKey, process.env.ADMIN_SECRET_KEY);
  const cronOK = safeCompare(cronSecret, process.env.CRON_SECRET);
  if (!adminOK && !cronOK) {
    const guard = requireAdminGuard(req, { limit: 20, windowSec: 60, routeKey: "profiler" });
    if (guard) return guard;
  }

  const supabase = db();

  // Cible : prospects status=found avec sales_angle NULL
  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, name, city, business_type, website, google_rating, is_new_business, date_creation")
    .in("status", ["found", "ready"])
    .is("sales_angle", null)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun prospect à profiler" });
  }

  let enriched = 0;
  const results: Array<{ id: string; angle: Angle; hook: string }> = [];

  // On profile en parallèle limité (4 à la fois) pour pas saturer OpenRouter
  const CONC = 4;
  const queue = [...prospects];
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (queue.length > 0) {
      const p = queue.shift();
      if (!p) return;
      try {
        const angle = detectAngle(p as Prospect);
        const hook = await generateCustomHook(p as Prospect, angle);
        await supabase.from("prospects").update({
          sales_angle: angle,
          custom_hook: hook,
          profiled_at: new Date().toISOString(),
        }).eq("id", p.id);
        enriched++;
        results.push({ id: p.id, angle, hook });
      } catch { /* skip et continue */ }
    }
  }));

  return NextResponse.json({
    success: true,
    processed: prospects.length,
    enriched,
    by_angle: results.reduce((acc, r) => { acc[r.angle] = (acc[r.angle] || 0) + 1; return acc; }, {} as Record<string, number>),
    sample: results.slice(0, 5),
  });
}

export async function GET(req: NextRequest) { return POST(req); }
