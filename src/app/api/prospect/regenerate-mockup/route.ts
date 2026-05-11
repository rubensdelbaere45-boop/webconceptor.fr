import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { generateRestaurantMockupHtml, type RestaurantProspect, BUSINESS_TYPE_VIBE } from "@/lib/mockup-restaurant";
import { generateCustomMockupHtml, type CustomProspect } from "@/lib/mockup-custom";
import type { DeepAudit } from "@/lib/deep-audit";

/* ══════════════════════════════════════════
   POST /api/prospect/regenerate-mockup
   Auth : x-admin-key

   Régénère le mockup_html de prospects existants avec le template
   unifié (generateRestaurantMockupHtml) sans re-call Claude.
   Bénéfices immédiats :
     - Priorité aux website_photos (vraies URLs) vs proxy Google cassé
     - CTAs adaptés au métier (devis, RDV, commander…)
     - Thème visuel correct par métier

   Ne modifie PAS status / sent_at / opened_at.

   Query params :
   - ?priority=small  → mockups < 30 000 chars (défaut)
   - ?priority=all    → tous
   - ?priority=hot    → view_count >= 1 (les plus chauds d'abord)
   - ?limit=N         → max N par run (défaut 30)
   - ?slug=xxx        → régénère un seul prospect
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
      "Site livré en 5 jours ouvrés",
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

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const url = new URL(req.url);
  const priority = url.searchParams.get("priority") || "small";
  const limit    = Math.min(50, Math.max(1, parseInt(url.searchParams.get("limit") || "30", 10)));
  const slug     = url.searchParams.get("slug");
  const origin   = "https://webconceptor.fr";

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

  for (const p of prospects) {
    try {
      let html: string;

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
        const content = buildLocalContent(p);
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
    results,
  });
}

export async function GET(req: NextRequest) { return POST(req); }
