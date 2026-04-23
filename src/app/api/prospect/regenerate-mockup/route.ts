import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, escapeTelegram } from "@/lib/security";
import { generateAdaptiveMockupHtml, type AdaptiveProspect } from "@/lib/mockup-adaptive";
import { generateCustomMockupHtml, type CustomProspect } from "@/lib/mockup-custom";
import type { DeepAudit } from "@/lib/deep-audit";

/* ══════════════════════════════════════════
   POST /api/prospect/regenerate-mockup
   Auth : x-admin-key OU x-cron-secret

   Régénère les maquettes des prospects existants avec le nouveau générateur
   adaptatif (utilise site_style_dna, website_photos, about_scraped).

   N'envoie PAS d'email — met juste à jour mockup_html en base.

   Priorité : prospects view_count > 0 (déjà chauds, l'amélioration est
   immédiatement visible pour eux s'ils reviennent).

   Query params :
   - ?priority=hot     → uniquement view_count >= 1 (défaut)
   - ?priority=all     → tous les prospects avec mockup_html existant
   - ?limit=N          → max N par run (défaut 50)
   - ?slug=xxx         → régénère juste ce prospect

   Idempotent (écrase mockup_html). Pas d'envoi d'email déclenché.
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

// Content de secours si on ne re-call pas Claude — on réutilise ce qui est déjà
// en DB. Le générateur mockup-adaptive applique son propre cleanAboutText()
// sur prospect.about_scraped directement, donc on laisse aboutText vide ici
// (fallback métier) et le générateur choisira le meilleur texte.
function buildContentFromExisting(p: MinimalProspect): {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
} {
  const label = BUSINESS_LABELS[p.business_type || ""] || { descriptor: "un commerce local", metier: "activité" };
  return {
    heroTitle: p.name,
    heroSubtitle: `${label.descriptor.charAt(0).toUpperCase() + label.descriptor.slice(1)}${p.city ? ` à ${p.city}` : ""}`,
    // Fallback générique SANS revenir sur about_scraped : le générateur le traite
    // lui-même (cleanAboutText décode entités, vire nav, tronque proprement).
    aboutText: `Notre équipe vous accueille${p.city ? ` à ${p.city}` : ""} avec un service attentionné et un savoir-faire reconnu.`,
  };
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
  site_style_dna?: { dominantColors?: string[]; fontFamilies?: string[]; keywords?: string[] } | null;
  rich_audit?: DeepAudit | null;
  view_count?: number;
  mockup_html?: string | null;
}

const BUSINESS_LABELS: Record<string, { descriptor: string; metier: string }> = {
  restaurant:   { descriptor: "une table chaleureuse",           metier: "restauration" },
  boulangerie:  { descriptor: "une boulangerie de quartier",     metier: "boulangerie" },
  patisserie:   { descriptor: "une maison de créations sucrées", metier: "pâtisserie" },
  cafe:         { descriptor: "un café de proximité",            metier: "café" },
  glacier:      { descriptor: "un glacier artisanal",            metier: "glace artisanale" },
  coiffeur:     { descriptor: "un salon de coiffure",            metier: "coiffure" },
  institut:     { descriptor: "un institut de beauté",           metier: "esthétique" },
  fleuriste:    { descriptor: "une boutique de fleurs",          metier: "fleuriste" },
  plombier:     { descriptor: "un artisan plombier",             metier: "plomberie" },
  electricien:  { descriptor: "un artisan électricien",          metier: "électricité" },
  dentiste:     { descriptor: "un cabinet dentaire",             metier: "soins dentaires" },
  osteo:        { descriptor: "un cabinet d'ostéopathie",        metier: "ostéopathie" },
  salle_sport:  { descriptor: "une salle de sport",              metier: "fitness" },
  auto_ecole:   { descriptor: "une auto-école locale",           metier: "permis" },
  garage:       { descriptor: "un garage indépendant",           metier: "mécanique auto" },
  epicerie:     { descriptor: "une épicerie de proximité",       metier: "commerce" },
};

const FOOD_METIERS = new Set(["restaurant", "boulangerie", "patisserie", "cafe", "glacier"]);

async function handler(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY) && !safeCompare(cronSecret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const url = new URL(req.url);
  const priority = url.searchParams.get("priority") || "hot";
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
  const slug = url.searchParams.get("slug");

  const supabase = getSupabaseAdmin();
  const origin = url.origin;

  // Sélection des prospects à régénérer
  let query = supabase
    .from("prospects")
    .select("id, slug, name, city, address, phone, website, email, google_rating, google_reviews_count, photos, hours, business_type, menu_items, reviews, about_scraped, website_photos, site_style_dna, rich_audit, view_count, mockup_html")
    .not("mockup_html", "is", null);

  if (slug) {
    query = query.eq("slug", slug);
  } else if (priority === "hot") {
    query = query.gte("view_count", 1).order("view_count", { ascending: false });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  query = query.limit(limit);

  const { data: prospects, error } = await query;

  if (error) {
    console.error("[regenerate-mockup] query error:", error);
    return NextResponse.json({ error: "DB query failed" }, { status: 500 });
  }

  if (!prospects || prospects.length === 0) {
    return NextResponse.json({
      success: true,
      processed: 0,
      message: slug ? `Prospect ${slug} introuvable ou sans mockup` : "Aucun prospect à régénérer",
    });
  }

  const results: Array<{ id: string; slug: string; name: string; status: string; error?: string }> = [];

  let skippedRestaurants = 0;

  for (const p of prospects as MinimalProspect[]) {
    try {
      const isRestaurant = FOOD_METIERS.has(p.business_type || "");

      // Les restaurants ont déjà leur propre pipeline (mockup-restaurant.ts) qui
      // utilise menu_items + vibe + photos. Pour les régénérer proprement il
      // faudrait re-call Claude (chiffré en temps/coût). On les skippe ici —
      // la VRAIE urgence c'est les 15+ métiers non-food qui recevaient tous la
      // même maquette épicerie générique. On les corrige d'abord.
      if (isRestaurant) {
        skippedRestaurants++;
        continue;
      }

      let html: string;

      // Si on a un rich_audit (DeepAudit) en DB, on utilise le générateur
      // mockup-custom (maquette vraiment sur-mesure). Sinon fallback adaptive.
      if (p.rich_audit) {
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
        const content = buildContentFromExisting(p);
        const adaptive: AdaptiveProspect = {
          id: p.id, slug: p.slug, name: p.name,
          city: p.city, address: p.address, phone: p.phone,
          website: p.website, email: p.email,
          google_rating: p.google_rating, google_reviews_count: p.google_reviews_count,
          photos: p.photos, hours: p.hours, business_type: p.business_type,
          menu_items: p.menu_items, reviews: p.reviews,
          about_scraped: p.about_scraped,
          website_photos: p.website_photos,
          site_style_dna: p.site_style_dna,
        };
        html = generateAdaptiveMockupHtml(adaptive, content, origin);
      }

      await supabase
        .from("prospects")
        .update({ mockup_html: html, updated_at: new Date().toISOString() })
        .eq("id", p.id);

      results.push({ id: p.id, slug: p.slug, name: p.name, status: "regenerated" });
    } catch (err) {
      results.push({
        id: p.id,
        slug: p.slug,
        name: p.name,
        status: "error",
        error: err instanceof Error ? err.message : "unknown",
      });
    }
  }

  const regenerated = results.filter((r) => r.status === "regenerated").length;
  const errors = results.filter((r) => r.status === "error").length;

  // Notif Telegram silencieuse (événement non-critique mais utile)
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId && regenerated > 0) {
    const msg =
      `🔄 <b>Maquettes régénérées (${regenerated})</b>\n\n` +
      `Priorité : ${escapeTelegram(priority)}${slug ? ` · slug=${escapeTelegram(slug)}` : ""}\n` +
      `Résultat : ${regenerated} ok / ${errors} erreurs\n\n` +
      `<i>Les prospects qui reviennent sur leur maquette voient maintenant la version adaptative (couleurs de leur site, vraies photos, libellés du métier).</i>`;
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg, parse_mode: "HTML", disable_notification: true }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, processed: results.length, regenerated, skipped_restaurants: skippedRestaurants, errors, priority, results });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
