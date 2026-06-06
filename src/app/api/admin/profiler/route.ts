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

type Angle = "no_website" | "low_rating" | "restaurant_qr" | "artisan_devis" | "new_business" | "generic";

function detectAngle(p: Prospect): Angle {
  // Priorité décroissante
  if (p.is_new_business) return "new_business";
  if (!p.website || p.website.trim() === "") return "no_website";
  if (p.google_rating && p.google_rating > 0 && p.google_rating < 3.8) return "low_rating";
  const t = (p.business_type || "").toLowerCase();
  if (/restaur|brasser|bistr|pizz|crêper|creperie|café|cafe|glacier|fast.?food/.test(t)) return "restaurant_qr";
  if (/plomb|electrici|menuis|serrur|carrele|peintr|couvr|maçon|garage|chauffag/.test(t)) return "artisan_devis";
  return "generic";
}

const HOOK_SYSTEM = `Tu rédiges UNE phrase d'accroche commerciale ultra-courte en français pour un email.

Règles :
- 1 seule phrase, max 130 caractères
- Tutoie pas, vouvoie
- Mentionne UN détail SPÉCIFIQUE du prospect (sa note Google, son métier, sa ville)
- Évite le "Bonjour", c'est déjà dans l'email
- Évite "Je vois que…", "J'ai vu…" — trop générique
- Tonalité : empathique, jamais agressive
- Pas de marketing, pas de superlatifs ("révolutionnaire", "incroyable")
- L'accroche doit ressembler à quelque chose qu'un humain écrirait

EXEMPLES BONS :
- "Avec un 3,4/5 sur Google, votre garagerie à Lyon laisse passer des clients qui filtrent les notes."
- "Sans site web visible, votre boulangerie à Aubenton est invisible pour 70% des recherches du quartier."
- "Pour une menuiserie qui vient d'ouvrir, un site qui apparaît sur Google fait la différence dès le 1er mois."

Réponds UNIQUEMENT avec la phrase, pas de guillemets, pas de préambule.`;

async function generateCustomHook(p: Prospect, angle: Angle): Promise<string> {
  const userPrompt = `Prospect :
- Nom : ${p.name}
- Ville : ${p.city || "(non renseignée)"}
- Métier : ${p.business_type || "(non renseigné)"}
- Site web : ${p.website ? "oui (" + p.website + ")" : "AUCUN"}
- Note Google : ${p.google_rating ? p.google_rating.toFixed(1) + "/5" : "(non renseignée)"}
- Entreprise récente : ${p.is_new_business ? `oui (créée ${p.date_creation || "<6mois"})` : "non"}

Angle commercial choisi : ${angle}

Écris UNE phrase d'accroche personnalisée.`;

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
  switch (angle) {
    case "no_website":     return `Sans site web visible, ${p.name}${cityTxt} laisse passer beaucoup de clients qui cherchent sur Google.`;
    case "low_rating":     return `Avec ${p.google_rating?.toFixed(1)}/5 sur Google, ${p.name} est filtrée par les clients qui ne regardent que les 4+ étoiles.`;
    case "restaurant_qr":  return `Un menu QR code en salle, plus de PDF à mettre à jour — c'est ce que je propose à ${p.name}.`;
    case "artisan_devis":  return `Un module de devis en ligne 24/7 pour ${p.name} — vos clients génèrent leur devis sans vous déranger.`;
    case "new_business":   return `Pour ${p.name} qui vient de se lancer, un site visible sur Google dès la 1ère semaine fait la différence.`;
    default:               return `Un site web pro pour ${p.name}, livré en 5 jours, à 50€/mois tout compris.`;
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
