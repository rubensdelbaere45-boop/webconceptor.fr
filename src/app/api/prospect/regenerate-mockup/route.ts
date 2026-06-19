import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { generateRestaurantMockupHtml, type RestaurantProspect, BUSINESS_TYPE_VIBE } from "@/lib/mockup-restaurant";
import { generateCustomMockupHtml, type CustomProspect } from "@/lib/mockup-custom";
import { generateStitchMockup, type StitchProspect } from "@/lib/stitch-mockup";
import { generateStitchPizzeriaMockupHtml } from "@/lib/mockup-stitch-pizzeria";
import { generateStitchPlombierMockupHtml } from "@/lib/mockup-stitch-plombier";
import { generateStitchPlombierFullMockupHtml } from "@/lib/mockup-stitch-plombier-full";
import { generateStitchElectricienMockupHtml } from "@/lib/mockup-stitch-electricien-full";
import { generateStitchDentisteFullMockupHtml } from "@/lib/mockup-stitch-dentiste-full";
import { generateStitchMetierMockupHtml, findMetierConfig } from "@/lib/mockup-stitch-engine";
import { generatePremiumDnaMockup, type DnaProspect } from "@/lib/mockup-dna";
import type { DeepAudit } from "@/lib/deep-audit";

/* ══════════════════════════════════════════
   POST /api/prospect/regenerate-mockup
   Auth : x-admin-key

   Régénère le mockup_html de prospects existants avec le template
   unifié (generateRestaurantMockupHtml) + copywriting IA via OpenRouter.
   Bénéfices immédiats :
     - Priorité aux website_photos (vraies URLs) vs proxy Google cassé
     - CTAs adaptés au métier (devis, RDV, commander…)
     - Thème visuel correct par métier
     - IA : accroches et textes personnalisés basés sur les vrais avis Google

   Ne modifie PAS status / sent_at / opened_at.

   Query params :
   - ?priority=small  → mockups < 30 000 chars (défaut)
   - ?priority=all    → tous
   - ?priority=hot    → view_count >= 1 (les plus chauds d'abord)
   - ?limit=N         → max N par run (défaut 30)
   - ?slug=xxx        → régénère un seul prospect
   - ?ai=false        → désactive la génération IA (fallback local uniquement)
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

interface MinimalProspect {
  id: string;
  slug: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  google_rating?: number;
  google_reviews_count?: number;
  photos?: string[];
  hours?: string;
  business_type?: string;
  menu_items?: Array<{ category: string; name: string; description: string; price: string }> | null;
  reviews?: Array<{ author: string; rating: number; text: string; timeAgo: string }> | null;
  about_scraped?: string | null;
  website_photos?: string[] | null;
  rich_audit?: DeepAudit | null;
  view_count?: number;
  mockup_html?: string | null;
}

/** Génère un contenu de base localement (sans Claude) pour la régénération. */
function buildLocalContent(p: MinimalProspect) {
  const vibeMap: Record<string, string> = BUSINESS_TYPE_VIBE as Record<string, string>;
  const vibe = (vibeMap[p.business_type || ""] ?? "classic") as "classic" | "rustic" | "coastal" | "modern" | "sunny";

  const cityStr = p.city ? ` à ${p.city}` : "";
  const heroTitle = p.name;
  const heroSubtitle = (() => {
    const m: Record<string, string> = {
      restaurant: "Cuisine authentique & saveurs du terroir",
      boulangerie: "Pain artisanal cuit chaque matin",
      patisserie: "Créations sucrées sur commande",
      glacier: "Glaces & sorbets artisanaux",
      cafe: `Votre café de quartier${cityStr}`,
      coiffeur: "Coiffure & colorations sur-mesure",
      institut: "Soins & beauté personnalisés",
      spa: "Bien-être & relaxation",
      fleuriste: "Fleurs fraîches & créations florales",
      plombier: `Plombier & chauffagiste${cityStr}`,
      electricien: `Électricien agréé${cityStr}`,
      garage: "Mécanique auto toutes marques",
      dentiste: "Cabinet dentaire & soins spécialisés",
      osteo: "Ostéopathie & thérapies manuelles",
      kine: "Kinésithérapie & rééducation",
      salle_sport: "Fitness & coaching personnalisé",
    };
    return m[p.business_type || ""] ?? `Bienvenue${cityStr}`;
  })();

  // Réutiliser le texte scrappé si disponible
  const aboutText = p.about_scraped
    ? p.about_scraped.slice(0, 600).replace(/<[^>]+>/g, "").trim()
    : `${p.name} vous accueille${cityStr} avec un savoir-faire reconnu et un service attentionné.`;

  // Menu/services : réutiliser si dispo, sinon fallback générique
  const menuItems = Array.isArray(p.menu_items) && p.menu_items.length >= 3
    ? p.menu_items
    : buildFallbackMenu(p.business_type);

  return {
    vibe,
    heroTitle,
    heroSubtitle,
    aboutText,
    menuItems,
    talkingPoints: [
      "Site livré instantanément",
      "Modifications illimitées incluses",
      "Compatible mobile et tablette",
    ],
    cuisineType: "",
    auditTeaser: "",
    emailOpening: "Bonjour,",
    emailSubject: `Votre maquette ${p.name}`,
    emailPitch: "Votre maquette personnalisée est prête.",
  };
}

function buildFallbackMenu(businessType?: string) {
  const t = businessType || "restaurant";
  const menus: Record<string, Array<{ category: string; name: string; description: string; price: string }>> = {
    plombier:    [
      { category: "Dépannage", name: "Fuite & rupture de canalisation", description: "Intervention rapide 7j/7", price: "" },
      { category: "Dépannage", name: "Débouchage canalisation", description: "Haute pression ou furet", price: "" },
      { category: "Installation", name: "Remplacement chauffe-eau", description: "Toutes marques", price: "" },
      { category: "Installation", name: "Installation sanitaires", description: "WC, vasque, douche", price: "" },
    ],
    electricien: [
      { category: "Dépannage", name: "Panne électrique urgente", description: "Intervention en moins de 2h", price: "" },
      { category: "Installation", name: "Tableau électrique", description: "Mise aux normes NFC 15-100", price: "" },
      { category: "Installation", name: "Prise & interrupteur", description: "Pose et remplacement", price: "" },
      { category: "Rénovation", name: "Rénovation complète", description: "Maison, appartement, local", price: "" },
    ],
    garage:      [
      { category: "Entretien", name: "Vidange & filtres", description: "Toutes marques", price: "" },
      { category: "Entretien", name: "Révision complète", description: "Contrôle 30 points", price: "" },
      { category: "Pneus", name: "Montage & équilibrage", description: "4 saisons, été, hiver", price: "" },
      { category: "Carrosserie", name: "Réparation carrosserie", description: "Débosselage & peinture", price: "" },
    ],
    coiffeur:    [
      { category: "Coupes", name: "Coupe femme", description: "Shampoing, coupe, brushing", price: "" },
      { category: "Coupes", name: "Coupe homme", description: "Shampoing, coupe, coiffage", price: "" },
      { category: "Couleur", name: "Coloration", description: "Teinte, mèches, balayage", price: "" },
      { category: "Soins", name: "Soin profond", description: "Nutrition & brillance", price: "" },
    ],
    dentiste:    [
      { category: "Soins", name: "Détartrage", description: "Nettoyage complet", price: "" },
      { category: "Soins", name: "Soin caries", description: "Composite esthétique", price: "" },
      { category: "Esthétique", name: "Blanchiment", description: "Résultat en 1 séance", price: "" },
      { category: "Prothèse", name: "Couronne & bridge", description: "Zircone ou céramique", price: "" },
    ],
    osteo:       [
      { category: "Séances", name: "Consultation adulte", description: "1h de traitement complet", price: "" },
      { category: "Séances", name: "Consultation enfant", description: "Pédiatrie & nourrissons", price: "" },
      { category: "Spécialités", name: "Ostéo du sport", description: "Sportifs de tous niveaux", price: "" },
      { category: "Spécialités", name: "Douleurs chroniques", description: "Dos, nuque, articulations", price: "" },
    ],
    salle_sport: [
      { category: "Abonnements", name: "Mensuel sans engagement", description: "Accès illimité à la salle", price: "" },
      { category: "Abonnements", name: "Annuel", description: "Meilleur tarif garanti", price: "" },
      { category: "Cours", name: "Cours collectifs", description: "Yoga, HIIT, pilates…", price: "" },
      { category: "Coaching", name: "Coaching personnalisé", description: "Programme sur-mesure", price: "" },
    ],
    fleuriste:   [
      { category: "Bouquets", name: "Bouquet de saison", description: "Fleurs fraîches du jour", price: "" },
      { category: "Événements", name: "Mariage & cérémonie", description: "Sur devis", price: "" },
      { category: "Deuil", name: "Couronne & gerbe", description: "Livraison funéraire", price: "" },
      { category: "Plantes", name: "Plantes d'intérieur", description: "Large choix en boutique", price: "" },
    ],
    restaurant:  [
      { category: "Entrées", name: "Planche de saison", description: "Produits du terroir", price: "" },
      { category: "Plats", name: "Plat du jour", description: "Fait maison, change chaque midi", price: "" },
      { category: "Plats", name: "Spécialité maison", description: "La signature du chef", price: "" },
      { category: "Desserts", name: "Dessert du jour", description: "Fait maison", price: "" },
    ],
  };
  return menus[t] ?? menus.restaurant;
}

/* ══════════════════════════════════════════
   AI COPY GENERATION
   Génère un copywriting personnalisé pour chaque prospect
   en s'appuyant sur ses vrais avis Google, ville, activité.
   Fallback transparent vers buildLocalContent() si erreur/timeout.
   ══════════════════════════════════════════ */

interface AICopyResult {
  heroSubtitle?: string;
  aboutText?: string;
  talkingPoints?: string[];
}

/** Appelle un modèle OpenRouter et retourne le résultat parsé + un score de complétude */
async function callModel(prompt: string, apiKey: string, model: string): Promise<{ result: AICopyResult; score: number } | null> {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
        temperature: 0.7,
      }),
      signal: AbortSignal.timeout(18000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) return null;
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);

    const result: AICopyResult = {
      heroSubtitle: typeof parsed.heroSubtitle === "string" && parsed.heroSubtitle.length > 5
        ? parsed.heroSubtitle.slice(0, 150) : undefined,
      aboutText: typeof parsed.aboutText === "string" && parsed.aboutText.length > 20
        ? parsed.aboutText.slice(0, 800) : undefined,
      talkingPoints: Array.isArray(parsed.talkingPoints) && parsed.talkingPoints.length >= 2
        ? parsed.talkingPoints.slice(0, 3).map((s: unknown) => String(s).slice(0, 80)) : undefined,
    };

    // Score de complétude : 1 pt heroSubtitle + 2 pts aboutText long + 2 pts 3 talkingPoints
    let score = 0;
    if (result.heroSubtitle) score += 1;
    if (result.aboutText && result.aboutText.length > 80) score += 2;
    if (result.talkingPoints && result.talkingPoints.length >= 3) score += 2;

    return { result, score };
  } catch {
    return null;
  }
}

async function generateAICopy(p: MinimalProspect, apiKey: string): Promise<AICopyResult | null> {
  // Contexte réel du prospect
  const businessType = p.business_type || "commerce";
  const cityStr = p.city ? ` à ${p.city}` : "";
  const ratingStr = p.google_rating ? `${p.google_rating}/5 (${p.google_reviews_count || 0} avis Google)` : "";

  const reviewsText = (p.reviews || [])
    .slice(0, 3)
    .filter(r => r.text && r.text.length > 20)
    .map(r => `• "${r.text.slice(0, 200)}" — ${r.author} (${r.rating}★)`)
    .join("\n");

  const aboutRaw = p.about_scraped
    ? p.about_scraped.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 500)
    : "";

  const prompt = `Tu es expert en copywriting pour des sites web de PME françaises.

Génère du contenu marketing PERSONNALISÉ et PERCUTANT pour ce ${businessType}${cityStr} :
Nom : ${p.name}
${ratingStr ? `Note : ${ratingStr}` : ""}
${reviewsText ? `\nAvis clients réels (utilise ces infos !):\n${reviewsText}` : ""}
${aboutRaw ? `\nDescription existante :\n${aboutRaw}` : ""}

RÈGLES :
- Sois SPÉCIFIQUE à cet établissement (mentionne la ville, des détails des avis si dispo)
- Évite les clichés ultra-génériques ("passion", "excellence", "savoir-faire" seuls)
- Ton humain, chaleureux, professionnel — pas robotique
- 100% en français

Réponds UNIQUEMENT avec ce JSON (aucun texte autour) :
{
  "heroSubtitle": "accroche courte 8-14 mots, unique à cet établissement",
  "aboutText": "2-3 phrases authentiques qui parlent vraiment de CE commerce (utilise les avis/infos si dispo)",
  "talkingPoints": ["point fort 1 (6-10 mots)", "point fort 2 (6-10 mots)", "point fort 3 (6-10 mots)"]
}`;

  // Collecte tous les modèles configurés (1 à 3)
  const models = [
    process.env.OPENROUTER_MODEL   || "meta-llama/llama-3.3-70b-instruct:free",
    process.env.OPENROUTER_MODEL_2,
    process.env.OPENROUTER_MODEL_3,
  ].filter(Boolean) as string[];

  // Appels parallèles — on garde le résultat le plus complet
  const settled = await Promise.allSettled(models.map(m => callModel(prompt, apiKey, m)));

  let best: { result: AICopyResult; score: number } | null = null;
  for (const s of settled) {
    if (s.status === "fulfilled" && s.value && s.value.score > (best?.score ?? -1)) {
      best = s.value;
    }
  }

  return best?.result ?? null;
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY) && !safeCompare(cronSecret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const url = new URL(req.url);

  // ⚠️ COUVRE-FEU NUIT — la génération lourde via Stitch IA tourne EXCLUSIVEMENT
  // entre 20h00 et 05h00 Paris (sauf override explicite ?force=true).
  // Cf. src/lib/night-window.ts pour la justification.
  const forceParam = url.searchParams.get("force") === "true";
  if (!forceParam) {
    const { isWithinNightGenerationWindow, nightWindowStatus } = await import("@/lib/night-window");
    if (!isWithinNightGenerationWindow()) {
      const st = nightWindowStatus();
      return NextResponse.json({
        success: true,
        processed: 0,
        skipped_curfew: true,
        message: `Couvre-feu — génération nocturne uniquement (${st.window}). Heure actuelle ${st.current_hour}h.`,
      });
    }
  }

  const priority = url.searchParams.get("priority") || "small";
  const limit    = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "30", 10)));
  const slug     = url.searchParams.get("slug");
  const useAI    = url.searchParams.get("ai") !== "false"; // AI activée par défaut
  const origin   = "https://klyora.fr";
  const aiApiKey = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || "";

  const supabase = getSupabaseAdmin();

  let query = supabase
    .from("prospects")
    .select("id, slug, name, city, address, phone, website, email, google_rating, google_reviews_count, photos, hours, business_type, menu_items, reviews, about_scraped, website_photos, rich_audit, view_count, mockup_html");

  if (slug) {
    query = query.eq("slug", slug);
  } else if (priority === "hot") {
    query = query.not("mockup_html", "is", null).gte("view_count", 1).order("view_count", { ascending: false });
  } else if (priority === "small") {
    // Mockups trop courts = template basique, priorité à régénérer
    query = query.not("mockup_html", "is", null).order("updated_at", { ascending: true });
  } else {
    query = query.not("mockup_html", "is", null).order("updated_at", { ascending: true });
  }

  query = query.limit(limit);

  const { data: rawProspects, error } = await query;
  if (error) return NextResponse.json({ error: "DB error" }, { status: 500 });
  if (!rawProspects?.length) return NextResponse.json({ success: true, processed: 0 });

  // Filtrer les petits mockups (<30k) si priority=small
  const prospects = (priority === "small" && !slug)
    ? (rawProspects as MinimalProspect[]).filter(p => (p.mockup_html?.length ?? 0) < 30_000)
    : (rawProspects as MinimalProspect[]);

  if (prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun petit mockup trouvé" });
  }

  const results: Array<{ slug: string; name: string; status: string; chars?: number; error?: string }> = [];

  // ?stitch=true → force génération Stitch pour tous les prospects du run
  const forceStitch = req.nextUrl.searchParams.get("stitch") === "true";

  for (const p of prospects) {
    // Protection : ne jamais écraser une maquette Stitch avec le template
    // sauf si ?stitch=true (régénération explicite) ou ?force=true
    const forceOverwrite = req.nextUrl.searchParams.get("force") === "true";
    if (!forceStitch && !forceOverwrite && p.mockup_html?.includes("STITCH_GENERATED")) {
      results.push({ slug: p.slug, name: p.name, status: "skipped_stitch" });
      continue;
    }
    try {
      let html: string;

      // ══════════════════════════════════════════
      // PRIORITÉ 0 — PIZZERIA STITCH (pixel-pixel Pupazzo + Three.js 3D)
      // Pour business_type=pizzeria, on shortcut tout le pipeline IA :
      // template visuel premium dédié, 100% local, instantané.
      // ══════════════════════════════════════════
      // ── ÉLECTRICIEN : template Stitch pixel-pixel intégral (Hero split,
      //    section dark "Précision Signature", section "Matériaux Nobles")
      const looksLikeElectricien = p.business_type === "electricien" ||
        /\b(electric|électrici|électrique)/i.test(p.name || "") ||
        /\b(electric|électrici|électrique)/i.test(p.slug || "");
      if (looksLikeElectricien) {
        try {
          const electHtml = generateStitchElectricienMockupHtml({
            id: p.id, slug: p.slug, name: p.name,
            city: p.city || null, address: p.address || null,
            phone: p.phone || null, email: p.email || null,
            website_photos: (p.website_photos as string[]) || (p.photos as string[]) || null,
          });
          if (electHtml && electHtml.length > 8000) {
            await supabase.from("prospects").update({ mockup_html: electHtml, updated_at: new Date().toISOString() }).eq("id", p.id);
            results.push({ slug: p.slug, name: p.name, status: "stitch_electricien_full_ok", chars: electHtml.length });
            continue;
          }
        } catch (eErr) {
          console.warn(`[regenerate] electricien-full failed for ${p.slug}:`, eErr);
        }
      }

      // ── STITCH METIER ENGINE : 14 métiers premium (électricien, garage,
      //    dentiste, ostéo, café, auto-école, épicerie fine, boulangerie,
      //    fleuriste, menuisier, couvreur, vétérinaire, coiffeur, institut)
      const metierConfig = findMetierConfig({
        name: p.name,
        slug: p.slug,
        business_type: p.business_type,
      });
      if (metierConfig && metierConfig.key !== "plombier") {
        try {
          const metierHtml = generateStitchMetierMockupHtml({
            id: p.id, slug: p.slug, name: p.name,
            city: p.city || null, address: p.address || null,
            phone: p.phone || null, email: p.email || null,
            website_photos: (p.website_photos as string[]) || (p.photos as string[]) || null,
          }, p.business_type);
          if (metierHtml && metierHtml.length > 8000) {
            await supabase.from("prospects").update({ mockup_html: metierHtml, updated_at: new Date().toISOString() }).eq("id", p.id);
            results.push({ slug: p.slug, name: p.name, status: `stitch_${metierConfig.key}_ok`, chars: metierHtml.length });
            continue;
          }
        } catch (mErr) {
          console.warn(`[regenerate] ${metierConfig.key} template failed for ${p.slug}:`, mErr);
        }
      }

      // ── DENTISTE : template Stitch FULL pixel-pixel + 4 sections vendeuses
      const looksLikeDentiste = p.business_type === "dentiste" ||
        /\b(dentiste|dental|orthodont|chirurg.*dentaire|cabinet[ -]dentaire)/i.test(p.name || "") ||
        /\b(dentiste|dental|orthodont|cabinet[ -]dentaire)/i.test(p.slug || "");
      if (looksLikeDentiste) {
        try {
          const dentisteHtml = generateStitchDentisteFullMockupHtml({
            id: p.id, slug: p.slug, name: p.name,
            city: p.city || null, address: p.address || null,
            phone: p.phone || null, email: p.email || null,
            hours: (p.hours as string) || null,
            google_rating: p.google_rating || null,
            google_reviews_count: p.google_reviews_count || null,
            reviews: (p.reviews as Array<{ author?: string; rating?: number; text?: string; timeAgo?: string }>) || null,
          });
          if (dentisteHtml && dentisteHtml.length > 8000) {
            await supabase.from("prospects").update({ mockup_html: dentisteHtml, updated_at: new Date().toISOString() }).eq("id", p.id);
            results.push({ slug: p.slug, name: p.name, status: "stitch_dentiste_full_ok", chars: dentisteHtml.length });
            continue;
          }
        } catch (dErr) {
          console.warn(`[regenerate] dentiste-full template failed for ${p.slug}:`, dErr);
        }
      }

      // ── PLOMBIER : template Stitch FULL pixel-pixel + 4 sections vendeuses
      const looksLikePlombier = p.business_type === "plombier" ||
        /\bplomb/i.test(p.name || "") || /\bplomb/i.test(p.slug || "");
      if (looksLikePlombier) {
        try {
          const plombierHtml = generateStitchPlombierFullMockupHtml({
            id: p.id, slug: p.slug, name: p.name,
            city: p.city || null, address: p.address || null,
            phone: p.phone || null, email: p.email || null,
            hours: (p.hours as string) || null,
            google_rating: p.google_rating || null,
            google_reviews_count: p.google_reviews_count || null,
            reviews: (p.reviews as Array<{ author?: string; rating?: number; text?: string; timeAgo?: string }>) || null,
          });
          if (plombierHtml && plombierHtml.length > 8000) {
            await supabase.from("prospects").update({ mockup_html: plombierHtml, updated_at: new Date().toISOString() }).eq("id", p.id);
            results.push({ slug: p.slug, name: p.name, status: "stitch_plombier_full_ok", chars: plombierHtml.length });
            continue;
          }
        } catch (plErr) {
          console.warn(`[regenerate] plombier-full template failed for ${p.slug}:`, plErr);
        }
      }

      // Détecte aussi pizzerias par nom (souvent classées 'restaurant')
      const looksLikePizzeria = p.business_type === "pizzeria" ||
        /pizz/i.test(p.name || "") || /pizz/i.test(p.slug || "");
      if (looksLikePizzeria) {
        try {
          const pizzaHtml = generateStitchPizzeriaMockupHtml({
            id: p.id, slug: p.slug, name: p.name,
            city: p.city || null, address: p.address || null,
            phone: p.phone || null, email: p.email || null,
            website_photos: (p.website_photos as string[]) || (p.photos as string[]) || null,
            reviews: (p.reviews as Array<{ author?: string; text?: string; rating?: number }>) || null,
          });
          if (pizzaHtml && pizzaHtml.length > 8000) {
            await supabase.from("prospects").update({ mockup_html: pizzaHtml, updated_at: new Date().toISOString() }).eq("id", p.id);
            results.push({ slug: p.slug, name: p.name, status: "stitch_pizzeria_ok", chars: pizzaHtml.length });
            continue;
          }
        } catch (pizzErr) {
          console.warn(`[regenerate] pizzeria template failed for ${p.slug}:`, pizzErr);
        }
      }

      // ══════════════════════════════════════════
      // PRIORITÉ 1 — DNA PREMIUM (pattern Stitch)
      // Lit design_dna Supabase pour générer une maquette au niveau Stitch
      // avec typo + palette + sections thématiques par métier.
      // Activé par défaut. Bypass via ?dna=false.
      // ══════════════════════════════════════════
      const useDna = req.nextUrl.searchParams.get("dna") !== "false";
      if (useDna) {
        try {
          const dnaProspect: DnaProspect = {
            id: p.id, slug: p.slug, name: p.name,
            city: p.city, address: p.address, phone: p.phone,
            email: p.email, website: p.website,
            business_type: p.business_type,
            google_rating: p.google_rating,
            google_reviews_count: p.google_reviews_count,
            photos: p.website_photos || p.photos || null,
            hours: p.hours,
            reviews: p.reviews,
            about_scraped: (p.about_scraped as string) || null,
          };
          const dnaHtml = await generatePremiumDnaMockup(dnaProspect);
          if (dnaHtml && dnaHtml.length > 8000) {
            await supabase.from("prospects").update({ mockup_html: dnaHtml, updated_at: new Date().toISOString() }).eq("id", p.id);
            results.push({ slug: p.slug, name: p.name, status: "dna_ok", chars: dnaHtml.length });
            continue;
          }
        } catch (dnaErr) {
          console.warn(`[regenerate] DNA failed for ${p.slug}:`, dnaErr);
          // Continue vers les autres voies
        }
      }

      // Stitch forcé via ?stitch=true (admin) ou prospect luxury avec clé dispo
      if (forceStitch && process.env.STITCH_API_KEY) {
        const stitchProspect: StitchProspect = {
          id: p.id, slug: p.slug, name: p.name,
          city: p.city, address: p.address, phone: p.phone,
          website: p.website, business_type: p.business_type,
          google_rating: p.google_rating, google_reviews_count: p.google_reviews_count,
          about_scraped: p.about_scraped,
          menu_items: p.menu_items,
          reviews: p.reviews,
          rich_audit: p.rich_audit,
        };
        const stitchHtml = await generateStitchMockup(stitchProspect);
        if (stitchHtml) {
          html = stitchHtml;
          await supabase.from("prospects").update({ mockup_html: html, updated_at: new Date().toISOString() }).eq("id", p.id);
          results.push({ slug: p.slug, name: p.name, status: "stitch_ok" });
          continue;
        }
        // Stitch a échoué → fallback template ci-dessous
      }

      if (p.rich_audit) {
        // Premium : template custom basé sur l'audit du site existant
        const custom: CustomProspect = {
          id: p.id, slug: p.slug, name: p.name,
          city: p.city, address: p.address, phone: p.phone,
          website: p.website, email: p.email,
          google_rating: p.google_rating, google_reviews_count: p.google_reviews_count,
          photos: p.photos, hours: p.hours, business_type: p.business_type,
          reviews: p.reviews,
        };
        html = generateCustomMockupHtml(custom, p.rich_audit, origin);
      } else {
        // Standard : template 5 thèmes unifié (tous métiers)
        // Étape 1 — contenu local (synchrone, garanti)
        const localContent = buildLocalContent(p);

        // Étape 2 — enrichissement IA (asynchrone, fallback gracieux)
        let aiContent: AICopyResult | null = null;
        if (useAI && aiApiKey) {
          aiContent = await generateAICopy(p, aiApiKey);
        }

        // Étape 3 — fusion : IA écrase le local uniquement si résultat valide
        const content = {
          ...localContent,
          ...(aiContent?.heroSubtitle ? { heroSubtitle: aiContent.heroSubtitle } : {}),
          ...(aiContent?.aboutText    ? { aboutText:    aiContent.aboutText    } : {}),
          ...(aiContent?.talkingPoints ? { talkingPoints: aiContent.talkingPoints } : {}),
        };

        const rProspect: RestaurantProspect = {
          id: p.id, slug: p.slug, name: p.name,
          city: p.city, address: p.address, phone: p.phone,
          website: p.website, email: p.email,
          google_rating: p.google_rating, google_reviews_count: p.google_reviews_count,
          photos: p.photos, hours: p.hours,
          website_photos: p.website_photos || undefined,
          business_type: p.business_type,
        };
        html = generateRestaurantMockupHtml(rProspect, {
          ...content,
          reviews: p.reviews || undefined,
        }, origin);
      }

      // Mise à jour UNIQUEMENT mockup_html — on ne touche pas status/sent_at
      await supabase
        .from("prospects")
        .update({ mockup_html: html, updated_at: new Date().toISOString() })
        .eq("id", p.id);

      results.push({ slug: p.slug, name: p.name, status: "ok", chars: html.length });
    } catch (err) {
      results.push({
        slug: p.slug,
        name: p.name,
        status: "error",
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  const ok  = results.filter(r => r.status === "ok").length;
  const err = results.filter(r => r.status === "error").length;
  const avgChars = ok > 0
    ? Math.round(results.filter(r => r.chars).reduce((s, r) => s + (r.chars ?? 0), 0) / ok)
    : 0;

  return NextResponse.json({
    success: true,
    processed: results.length,
    regenerated: ok,
    errors: err,
    avg_chars: avgChars,
    ai_enabled: useAI && !!aiApiKey,
    results,
  });
}

export async function GET(req: NextRequest) { return POST(req); }
