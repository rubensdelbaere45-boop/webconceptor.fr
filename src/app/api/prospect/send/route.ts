import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { escapeTelegram, safeCompare, isWithinSendingHours } from "@/lib/security";
import {
  generateRestaurantMockupHtml,
  BUSINESS_TYPE_VIBE,
  type RestaurantProspect,
  type RestaurantContent,
} from "@/lib/mockup-restaurant";
// generateAdaptiveMockupHtml supprimé — tous les métiers passent par generateRestaurantMockupHtml
import { generateCustomMockupHtml, type CustomProspect } from "@/lib/mockup-custom";
import type { DeepAudit } from "@/lib/deep-audit";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

/* ══════════════════════════════════════════
   Claude Haiku via OpenRouter — personalize content
   ══════════════════════════════════════════ */

interface Prospect {
  id: string;
  slug: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  additional_emails?: string[] | null;
  google_rating?: number;
  google_reviews_count?: number;
  photos?: string[];
  hours?: string;
  business_type?: string;
  menu_items?: Array<{ category: string; name: string; description: string; price: string }> | null;
  reviews?: Array<{ author: string; rating: number; text: string; timeAgo: string }> | null;
  about_scraped?: string | null;
  website_photos?: string[] | null;
  site_quality?: "none" | "poor" | "average" | "good" | null;
  site_audit_issues?: string[] | null;
  site_style_dna?: {
    dominantColors?: string[];
    fontFamilies?: string[];
    keywords?: string[];
  } | null;
  rich_audit?: DeepAudit | null;
}

// Libellés naturels par business_type — utilisés dans les prompts Claude et fallbacks.
// Couvre TOUS les métiers pris en charge par WebConceptor.
const BUSINESS_LABELS: Record<string, { name: string; descriptor: string; sector: string }> = {
  // ── Restauration ──────────────────────────────────────────────────────────
  restaurant:    { name: "restaurant",                descriptor: "une table chaleureuse",                sector: "restauration" },
  brasserie:     { name: "brasserie",                  descriptor: "une brasserie conviviale",             sector: "restauration" },
  bistrot:       { name: "bistrot",                    descriptor: "un bistrot de quartier",               sector: "restauration" },
  gastronomique: { name: "restaurant gastronomique",   descriptor: "une table gastronomique",              sector: "gastronomie" },
  pizzeria:      { name: "pizzeria",                   descriptor: "une pizzeria authentique",              sector: "restauration italienne" },
  creperie:      { name: "crêperie",                   descriptor: "une crêperie bretonne",                sector: "restauration bretonne" },
  food_truck:    { name: "food truck",                 descriptor: "un food truck gourmand",               sector: "restauration mobile" },
  bar:           { name: "bar",                        descriptor: "un bar convivial",                     sector: "bar / restauration" },
  // ── Café / Salon de thé / Glacier ────────────────────────────────────────
  cafe:          { name: "café",                       descriptor: "un café de proximité",                 sector: "café / restauration" },
  salon_de_the:  { name: "salon de thé",               descriptor: "un salon de thé",                     sector: "salon de thé" },
  glacier:       { name: "glacier artisanal",          descriptor: "un glacier artisanal",                 sector: "glace artisanale" },
  // ── Artisanat alimentaire ─────────────────────────────────────────────────
  boulangerie:   { name: "boulangerie artisanale",     descriptor: "une boulangerie de quartier",          sector: "boulangerie" },
  patisserie:    { name: "pâtisserie artisanale",      descriptor: "une maison de créations sucrées",      sector: "pâtisserie artisanale" },
  chocolatier:   { name: "chocolatier artisan",        descriptor: "une maison de chocolat",               sector: "chocolaterie artisanale" },
  // ── Beauté & bien-être ───────────────────────────────────────────────────
  coiffeur:      { name: "salon de coiffure",          descriptor: "un salon de coiffure",                 sector: "coiffure" },
  institut:      { name: "institut de beauté",         descriptor: "un institut de beauté",                sector: "esthétique et bien-être" },
  spa:           { name: "spa",                        descriptor: "un spa",                               sector: "spa et bien-être" },
  fitness:       { name: "salle de fitness",           descriptor: "une salle de fitness",                 sector: "fitness / sport" },
  // ── Santé ─────────────────────────────────────────────────────────────────
  dentiste:      { name: "cabinet dentaire",           descriptor: "un cabinet dentaire",                  sector: "soins dentaires" },
  osteo:         { name: "cabinet d'ostéopathie",      descriptor: "un cabinet d'ostéopathie",             sector: "ostéopathie" },
  kine:          { name: "cabinet de kinésithérapie",  descriptor: "un cabinet de kiné",                   sector: "kinésithérapie" },
  // ── Commerce ─────────────────────────────────────────────────────────────
  fleuriste:     { name: "fleuriste",                  descriptor: "une boutique de fleurs",               sector: "fleuriste" },
  epicerie:      { name: "épicerie de proximité",      descriptor: "une épicerie de proximité",            sector: "commerce de proximité" },
  // ── Artisans / Services techniques ──────────────────────────────────────
  plombier:      { name: "entreprise de plomberie",    descriptor: "un artisan plombier de confiance",     sector: "plomberie / chauffage" },
  electricien:   { name: "entreprise d'électricité",   descriptor: "un artisan électricien",               sector: "électricité" },
  garage:        { name: "garage automobile",          descriptor: "un garage indépendant",                sector: "mécanique auto" },
  menuisier:     { name: "menuiserie artisanale",      descriptor: "un menuisier artisan",                 sector: "menuiserie" },
  peintre:       { name: "peintre en bâtiment",        descriptor: "un peintre professionnel",             sector: "peinture bâtiment" },
  // ── Formation / Sport ────────────────────────────────────────────────────
  salle_sport:   { name: "salle de sport",             descriptor: "une salle de sport",                   sector: "fitness / sport" },
  auto_ecole:    { name: "auto-école",                  descriptor: "une auto-école locale",               sector: "permis de conduire" },
};

function getBusinessLabel(bt?: string) {
  return BUSINESS_LABELS[bt || ""] || { name: "commerce local", descriptor: "un commerce local", sector: "activité locale" };
}

/* ══════════════════════════════════════════
   Personalisation Haiku — tous les métiers
   ══════════════════════════════════════════ */

// Menu fallback par type de métier — sans prix (on n'invente jamais de tarifs).
// La maquette affichera un bandeau "Tarifs confirmés lors de notre échange".
function generateFallbackMenuByType(businessType?: string) {
  type Item = { category: string; name: string; description: string; price: string };
  const menus: Record<string, Item[]> = {
    restaurant: [
      { category: "entrée", name: "Entrée du jour", description: "Au gré du marché et des saisons", price: "" },
      { category: "entrée", name: "Terrine maison", description: "Recette transmise de génération en génération", price: "" },
      { category: "entrée", name: "Salade gourmande", description: "Produits locaux, vinaigrette maison", price: "" },
      { category: "plat", name: "Plat du marché", description: "Selon l'arrivage du jour, cuisson soignée", price: "" },
      { category: "plat", name: "Poisson du pêcheur", description: "Arrivage frais, préparation selon le chef", price: "" },
      { category: "plat", name: "Viande à l'ardoise", description: "Pièce sélectionnée, cuisson au choix", price: "" },
      { category: "dessert", name: "Dessert maison", description: "Fait minute, selon inspiration du chef", price: "" },
      { category: "dessert", name: "Café gourmand", description: "Expresso et mignardises du jour", price: "" },
    ],
    brasserie: [
      { category: "entrée", name: "Salade brasserie", description: "Lardons, œuf poché, croûtons frits", price: "" },
      { category: "entrée", name: "Escargots de Bourgogne", description: "Beurre persillé, ail, herbes fraîches", price: "" },
      { category: "plat", name: "Steak-frites maison", description: "Frites fraîches taillées à la main", price: "" },
      { category: "plat", name: "Moules marinières", description: "Cuites minute, accompagnées de frites", price: "" },
      { category: "plat", name: "Tartare de bœuf", description: "Préparé devant vous, selon vos goûts", price: "" },
      { category: "dessert", name: "Crème brûlée", description: "Recette traditionnelle, caramel à la flamme", price: "" },
      { category: "dessert", name: "Fondant au chocolat", description: "Coulant, servi tiède avec glace vanille", price: "" },
    ],
    glacier: [
      { category: "crèmes glacées", name: "Vanille Bourbon", description: "Gousses sélectionnées, crème entière", price: "" },
      { category: "crèmes glacées", name: "Chocolat intense", description: "Cacao grand cru, texture veloutée", price: "" },
      { category: "crèmes glacées", name: "Caramel beurre salé", description: "Sel de Guérande, caramel maison", price: "" },
      { category: "sorbets", name: "Framboise du verger", description: "Fruits frais, sans colorants ni arômes", price: "" },
      { category: "sorbets", name: "Citron de Menton", description: "Acidulé et rafraîchissant", price: "" },
      { category: "sorbets", name: "Mangue passion", description: "Exotique et fruité, recette artisanale", price: "" },
      { category: "coupes spéciales", name: "Coupe maison", description: "3 boules, chantilly, coulis du moment", price: "" },
      { category: "coupes spéciales", name: "Banana split", description: "Banane fraîche, 3 parfums, amandes grillées", price: "" },
    ],
    boulangerie: [
      { category: "pains", name: "Baguette Tradition", description: "Mie alvéolée, croûte croustillante", price: "" },
      { category: "pains", name: "Pain au levain", description: "Levain naturel, fermentation longue", price: "" },
      { category: "pains", name: "Pain de campagne", description: "Farine de froment, mie serrée", price: "" },
      { category: "viennoiseries", name: "Croissant pur beurre", description: "Feuilletage au beurre AOP Charentes", price: "" },
      { category: "viennoiseries", name: "Pain au chocolat", description: "Deux barres de chocolat, pâte feuilletée", price: "" },
      { category: "viennoiseries", name: "Chausson aux pommes", description: "Compotée maison, pâte dorée", price: "" },
      { category: "pâtisseries", name: "Tarte du jour", description: "Selon la saison et l'inspiration", price: "" },
      { category: "pâtisseries", name: "Éclair maison", description: "Choux croustillant, crème pâtissière", price: "" },
    ],
    patisserie: [
      { category: "entremets", name: "Entremets du moment", description: "Création de saison, mousse légère", price: "" },
      { category: "entremets", name: "Bûche signature", description: "Design exclusif, saveurs actuelles", price: "" },
      { category: "chocolats", name: "Bonbons de chocolat", description: "Ganaches, pralinés, assemblage artisanal", price: "" },
      { category: "chocolats", name: "Tablette maison", description: "Chocolat de couverture, inclusions choisies", price: "" },
      { category: "commandes", name: "Gâteau sur mesure", description: "Design et saveurs selon vos souhaits", price: "" },
      { category: "commandes", name: "Pièce montée", description: "Mariage, anniversaire, événement", price: "" },
    ],
    creperie: [
      { category: "galettes salées", name: "Galette complète", description: "Jambon, emmental, œuf fermier", price: "" },
      { category: "galettes salées", name: "Galette bretonne", description: "Andouille de Guémené, pomme, camembert", price: "" },
      { category: "galettes salées", name: "Galette forestière", description: "Champignons, crème, comté râpé", price: "" },
      { category: "crêpes sucrées", name: "Crêpe au beurre", description: "Beurre demi-sel breton, sucre cristal", price: "" },
      { category: "crêpes sucrées", name: "Crêpe caramel-beurre", description: "Caramel breton maison, amandes", price: "" },
      { category: "boissons", name: "Cidre breton IGP", description: "Doux, brut ou extra-brut, en bolée", price: "" },
    ],
    cafe: [
      { category: "cafés & thés", name: "Expresso maison", description: "Blend sélectionné, extraction soignée", price: "" },
      { category: "cafés & thés", name: "Latte & cappuccino", description: "Lait entier, mousse veloutée", price: "" },
      { category: "cafés & thés", name: "Thé du moment", description: "Sélection de thés et infusions", price: "" },
      { category: "douceurs", name: "Cake du jour", description: "Fait maison, selon inspiration du chef", price: "" },
      { category: "douceurs", name: "Cookie fondant", description: "Chocolat noir, noix de pécan", price: "" },
      { category: "formules", name: "Formule brunch", description: "Boisson chaude + viennoiserie + jus", price: "" },
    ],
    coiffeur: [
      { category: "coupes", name: "Coupe femme", description: "Shampoing, coupe, brushing inclus", price: "" },
      { category: "coupes", name: "Coupe homme", description: "Shampoing, coupe, coiffage", price: "" },
      { category: "coupes", name: "Coupe enfant", description: "Jusqu'à 10 ans, shampoing inclus", price: "" },
      { category: "colorations", name: "Couleur complète", description: "Pose, développement, rinçage, coiffage", price: "" },
      { category: "colorations", name: "Balayage / mèches", description: "Technique personnalisée selon envie", price: "" },
      { category: "soins", name: "Soin nutritif", description: "Cheveux secs, brillance et douceur", price: "" },
      { category: "soins", name: "Lissage kératine", description: "Résultat durable, cheveux disciplinés", price: "" },
    ],
    spa: [
      { category: "soins visage", name: "Soin hydratant", description: "Peau éclat, 60 min, actifs naturels", price: "" },
      { category: "soins visage", name: "Soin anti-âge", description: "Liftant, 75 min, collagène marin", price: "" },
      { category: "massages", name: "Massage relaxant", description: "Corps entier, 60 min, huiles chaudes", price: "" },
      { category: "massages", name: "Massage sportif", description: "Récupération musculaire, 45 min", price: "" },
      { category: "épilations", name: "Épilation jambes", description: "Cire tiède ou froide, au choix", price: "" },
      { category: "épilations", name: "Épilation maillot", description: "Classique, semi-intégral ou intégral", price: "" },
    ],
  };
  const items = menus[businessType || ""] || menus.restaurant;
  return items;
}

/* ─── Helpers locaux ─────────────────────────────────────────────────────────
   Ces valeurs sont calculées localement — PAS envoyées à Claude.
   Gain : ~600 tokens de moins en sortie, soit 80% de l'économie totale.
   ─────────────────────────────────────────────────────────────────────────── */

function getLocalTalkingPoints(businessType?: string): string[] {
  const tp: Record<string, string[]> = {
    restaurant: [
      "Site vitrine avec votre carte et vos horaires",
      "Réservation en ligne intégrée (sans commission)",
      "Espace admin : changez la carte en 2 minutes",
      "199 € TTC ou 3× sans frais (Klarna)",
      "Option Sérénité 50 €/mois : mises à jour illimitées",
    ],
    brasserie: [
      "Site vitrine avec menu, horaires et photos",
      "Réservation en ligne sans commission tierce",
      "Mise à jour de l'ardoise en autonomie",
      "199 € TTC ou 3× sans frais",
      "Option Sérénité 50 €/mois : mises à jour illimitées",
    ],
    glacier: [
      "Vitrine en ligne pour vos parfums du moment",
      "Mise à jour des parfums disponibles en 1 clic",
      "Formulaire de commande pour grandes occasions",
      "199 € TTC ou 3× sans frais",
      "Option Sérénité 50 €/mois : mises à jour illimitées",
    ],
    boulangerie: [
      "Site avec vos spécialités et horaires d'ouverture",
      "Commandes spéciales en ligne (gâteaux, pièces)",
      "Actualité maison : produits du jour en direct",
      "199 € TTC ou 3× sans frais",
      "Option Sérénité 50 €/mois : mises à jour illimitées",
    ],
    patisserie: [
      "Portfolio de créations en ligne, photos pro",
      "Commandes personnalisées pour événements",
      "Galerie mise à jour facilement depuis votre téléphone",
      "199 € TTC ou 3× sans frais",
      "Option Sérénité 50 €/mois : mises à jour illimitées",
    ],
    creperie: [
      "Carte en ligne avec galettes et crêpes du moment",
      "Réservation ou commande à emporter en ligne",
      "Mise en avant des produits bretons authentiques",
      "199 € TTC ou 3× sans frais",
      "Option Sérénité 50 €/mois : mises à jour illimitées",
    ],
    cafe: [
      "Site avec horaires, carte et événements",
      "Réservation de la salle privatisable en ligne",
      "Mise en avant de vos formules et spécialités",
      "199 € TTC ou 3× sans frais",
      "Option Sérénité 50 €/mois : mises à jour illimitées",
    ],
    coiffeur: [
      "Prise de rendez-vous en ligne 24h/24, 7j/7",
      "Présentation de vos coiffeurs et spécialités",
      "Galerie avant/après pour rassurer les clients",
      "199 € TTC ou 3× sans frais",
      "Option Sérénité 50 €/mois : mises à jour illimitées",
    ],
    spa: [
      "Réservation des soins et massages en ligne",
      "Présentation immersive de votre univers bien-être",
      "Vente de bons cadeaux directement sur le site",
      "199 € TTC ou 3× sans frais",
      "Option Sérénité 50 €/mois : mises à jour illimitées",
    ],
    plombier: [
      "Formulaire de devis en ligne disponible 24h/24",
      "Présentation de vos interventions et zones",
      "Avis clients Google intégrés pour la confiance",
      "199 € TTC ou 3× sans frais",
      "Option Sérénité 50 €/mois : mises à jour illimitées",
    ],
    electricien: [
      "Formulaire de devis en ligne disponible 24h/24",
      "Présentation de vos domaines d'intervention",
      "Certifications et qualifications mises en avant",
      "199 € TTC ou 3× sans frais",
      "Option Sérénité 50 €/mois : mises à jour illimitées",
    ],
  };
  return tp[businessType || ""] || [
    "Site vitrine personnalisé avec votre identité",
    "Référencement local optimisé (Google Maps)",
    "Espace admin pour mises à jour en autonomie",
    "199 € TTC ou 3× sans frais",
    "Option Sérénité 50 €/mois : mises à jour illimitées",
  ];
}

function getLocalCuisineType(businessType?: string): string {
  const labels: Record<string, string> = {
    restaurant: "cuisine française",
    brasserie: "brasserie traditionnelle",
    bistrot: "bistrot de quartier",
    gastronomique: "gastronomie française",
    pizzeria: "pizzeria napolitaine",
    boulangerie: "boulangerie artisanale",
    patisserie: "pâtisserie artisanale",
    chocolatier: "chocolaterie artisanale",
    cafe: "café de proximité",
    glacier: "glacerie artisanale",
    creperie: "crêperie bretonne",
    salon_de_the: "salon de thé",
    food_truck: "restauration mobile",
    bar: "bar à cocktails",
    coiffeur: "salon de coiffure",
    spa: "spa et bien-être",
    institut: "institut de beauté",
    fleuriste: "fleuriste créateur",
    plombier: "plomberie et chauffage",
    electricien: "électricité et domotique",
    dentiste: "cabinet dentaire",
    osteo: "ostéopathie",
    salle_sport: "fitness et bien-être",
    auto_ecole: "auto-école",
    garage: "garage automobile",
  };
  return labels[businessType || ""] || BUSINESS_LABELS[businessType || ""]?.sector || "activité locale";
}

function buildLocalAuditTeaser(
  siteQuality?: string | null,
  auditIssues?: string[] | null
): string {
  if (!siteQuality || siteQuality === "none" || siteQuality === "good") return "";
  const count = (auditIssues || []).length;
  if (siteQuality === "poor") {
    if (count >= 4) return `notamment ${count} points critiques détectés sur votre site actuel`;
    return "notamment sur la refonte complète et la modernisation de votre présence en ligne";
  }
  // average
  if (auditIssues?.includes("no_viewport_mobile")) {
    return "notamment sur l'adaptation mobile et le référencement local";
  }
  if (count >= 3) return "notamment sur le référencement Google et l'expérience mobile";
  return "notamment sur la vitesse de chargement et l'expérience utilisateur";
}

async function personalizeRestaurantWithClaude(prospect: Prospect): Promise<RestaurantContent> {
  const key = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  const label = getBusinessLabel(prospect.business_type);

  /* ── Valeurs calculées LOCALEMENT (jamais envoyées à Claude) ─────────────
     Ces champs sont déterministes → pas besoin de LLM → économie de tokens.  */
  const vibe = (
    (prospect.business_type ? BUSINESS_TYPE_VIBE[prospect.business_type] : undefined) ?? "classic"
  ) as "classic" | "rustic" | "modern" | "coastal" | "sunny";
  const cuisineType    = getLocalCuisineType(prospect.business_type);
  const talkingPoints  = getLocalTalkingPoints(prospect.business_type);
  const auditTeaser    = buildLocalAuditTeaser(prospect.site_quality, prospect.site_audit_issues);
  const emailOpening   = "Bonjour,";

  // Menu : priorité scrapé > Claude > fallback par type
  const hasScrapedMenu = Array.isArray(prospect.menu_items) && prospect.menu_items.length >= 4;
  const localFallbackMenu = generateFallbackMenuByType(prospect.business_type);

  const fallback: RestaurantContent = {
    heroTitle: prospect.name,
    heroSubtitle: `${label.descriptor.charAt(0).toUpperCase() + label.descriptor.slice(1)}${prospect.city ? ` à ${prospect.city}` : ""}`,
    aboutText: `Bienvenue ${prospect.city ? `à ${prospect.city}` : "chez nous"} ! Notre équipe vous accueille avec un service attentionné et un savoir-faire reconnu dans notre métier. Nous sommes fiers de faire partie de votre quotidien.`,
    menuItems: hasScrapedMenu ? (prospect.menu_items as RestaurantContent["menuItems"]) : localFallbackMenu,
    cuisineType,
    vibe,
    auditTeaser,
    talkingPoints,
    emailSubject: `Maquette de votre site pour ${prospect.name}`,
    emailOpening,
    emailPitch: `J'ai préparé une maquette personnalisée pour votre ${label.name}${prospect.city ? ` à ${prospect.city}` : ""}. Elle reflète votre activité et peut être mise en ligne rapidement.`,
  };

  if (!key) return fallback;

  const isOpenRouter = key.startsWith("sk-or-");
  const endpoint = isOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.anthropic.com/v1/messages";

  /* ── Contexte minimal pour Claude ───────────────────────────────────────
     On ne donne que ce dont il a besoin pour personnaliser le TEXTE.
     Le design (vibe, talkingPoints, cuisineType, auditTeaser) est déjà fait. */
  const aboutExcerpt = (prospect.about_scraped || "").slice(0, 600);
  const reviewsSample = (prospect.reviews || [])
    .slice(0, 2)
    .map((r) => `${r.rating}★ "${r.text.slice(0, 150)}"`)
    .join(" | ");

  const infoLines = [
    `Métier : ${label.name}`,
    `Nom : ${prospect.name}`,
    prospect.city    ? `Ville : ${prospect.city}` : "",
    prospect.google_rating ? `Note Google : ${prospect.google_rating}/5 (${prospect.google_reviews_count || 0} avis)` : "",
    reviewsSample    ? `Avis réels : ${reviewsSample}` : "",
    aboutExcerpt     ? `Texte du site actuel : "${aboutExcerpt}"` : "",
  ].filter(Boolean).join("\n");

  /* ── Prompt ultra-court ─────────────────────────────────────────────────
     Claude génère UNIQUEMENT les champs créatifs.
     Tout le reste (vibe, talkingPoints, cuisineType, auditTeaser) est local.
     Cible : ~200 tokens input + ~500 tokens output → < 0,07 ct/appel.        */
  const menuKeySpec = hasScrapedMenu
    ? ""
    : `
"menuItems": [
  6-10 objets {"category":"...","name":"...","description":"5-8 mots","price":""}.
  Catégories OBLIGATOIRES selon le métier :
  glacier → "crèmes glacées" / "sorbets" / "coupes spéciales"
  boulangerie → "pains" / "viennoiseries" / "pâtisseries"
  patisserie → "entremets" / "chocolats" / "commandes"
  restaurant/brasserie/bistrot → "entrée" / "plat" / "dessert"
  creperie → "galettes salées" / "crêpes sucrées" / "boissons"
  cafe → "cafés & thés" / "douceurs" / "formules"
  coiffeur → "coupes" / "colorations" / "soins"
  spa/institut → "soins visage" / "massages" / "épilations"
  INTERDIT pour non-restaurant : "Entrée du jour", "Plat signature", "Dessert maison".
],`;

  const prompt = `Génère le texte JSON pour la maquette de site de ce ${label.name}.

${infoLines}

Réponds avec UNIQUEMENT ce JSON (clés exactes) :
{
"heroTitle": "4-7 mots évoquant LE MÉTIER PRÉCIS — pas le nom du lieu",
"heroSubtitle": "12-16 mots, spécifique au métier + ville",
"aboutText": "55-75 mots, SPÉCIFIQUE AU MÉTIER. glacier=glaces/sorbets/parfums artisanaux. boulangerie=pain/levain/four. coiffeur=coupe/style/soin. Si texte du site fourni, inspire-toi du ton sans recopier. JAMAIS cuisine/produits de saison pour un glacier ou coiffeur.",${menuKeySpec}
"emailSubject": "≤55 chars, inclut le nom, percutant",
"emailPitch": "2 phrases. Personnalisation prouvée (ville/note/avis cité). Vouvoiement. Pas opportunité."
}

JSON valide uniquement, aucun commentaire.`;

  try {
    const body = isOpenRouter
      ? {
          model: "anthropic/claude-haiku-4.5",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 800,
          response_format: { type: "json_object" },
        }
      : {
          model: "claude-haiku-4-5",
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }],
        };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: isOpenRouter
        ? { "Content-Type": "application/json", "Authorization": `Bearer ${key}` }
        : { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(20000),
    });

    if (!res.ok) return fallback;

    const data = await res.json();
    const raw = isOpenRouter
      ? data.choices?.[0]?.message?.content
      : data.content?.[0]?.text;
    if (!raw) return fallback;

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return fallback;
    const parsed = JSON.parse(jsonMatch[0]);

    // Menu : scrapé > Claude > fallback local par type
    type MenuItem = { category: string; name: string; description: string; price: string };
    let menuItems: MenuItem[] = localFallbackMenu;
    if (hasScrapedMenu) {
      menuItems = prospect.menu_items as MenuItem[];
    } else if (!hasScrapedMenu && Array.isArray(parsed.menuItems) && parsed.menuItems.length >= 4) {
      const filtered = (parsed.menuItems as unknown[])
        .filter((m): m is Record<string, unknown> =>
          typeof m === "object" && m !== null &&
          typeof (m as Record<string, unknown>).category === "string" &&
          String((m as Record<string, unknown>).category).trim().length > 0 &&
          typeof (m as Record<string, unknown>).name === "string"
        )
        .slice(0, 12)
        .map((m) => ({
          category: String(m.category).slice(0, 30).trim().toLowerCase(),
          name: String(m.name).slice(0, 60),
          description: String(m.description || "").slice(0, 120),
          price: String(m.price || "").slice(0, 10),
        }));
      if (filtered.length >= 4) menuItems = filtered;
    }

    return {
      heroTitle:    String(parsed.heroTitle    || fallback.heroTitle).slice(0, 100),
      heroSubtitle: String(parsed.heroSubtitle || fallback.heroSubtitle).slice(0, 200),
      aboutText:    String(parsed.aboutText    || fallback.aboutText).slice(0, 500),
      menuItems,
      cuisineType,          // local — ne vient jamais de Claude
      vibe,                 // local — BUSINESS_TYPE_VIBE a priorité absolue
      talkingPoints,        // local — tableau fixe par métier
      auditTeaser,          // local — dérivé de site_quality + audit_issues
      emailSubject: String(parsed.emailSubject || fallback.emailSubject).slice(0, 100),
      emailOpening,         // local — toujours "Bonjour,"
      emailPitch:   String(parsed.emailPitch   || fallback.emailPitch).slice(0, 500),
    };
  } catch {
    return fallback;
  }
}

/* ══════════════════════════════════════════
   Brevo email helpers
   ══════════════════════════════════════════ */

function escape(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/* ══════════════════════════════════════════
   Brevo email + Telegram
   ══════════════════════════════════════════ */

async function sendEmail(to: string, toName: string, subject: string, htmlBody: string): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "Tom Bauer", email: "contact@webconceptor.fr" },
        to: [{ email: to, name: toName || to }],
        subject,
        htmlContent: htmlBody,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

async function notifyTelegram(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      // disable_notification: true → arrive en silencieux sur l'iPhone
      // (HOT LEAD et paiement Stripe restent avec son).
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML", disable_web_page_preview: true, disable_notification: true }),
    });
  } catch { /* silent */ }
}


/* ── Bullets email adaptés par famille de métier ──────────────────────────── */
function getEmailFeatureBullets(businessType?: string): string[] {
  const t = (businessType || "restaurant").toLowerCase();
  if (["restaurant", "brasserie", "bistrot", "gastronomique", "bar"].includes(t)) return [
    "<strong>Page d'accueil premium</strong> avec photos et ambiance",
    "<strong>Carte complète</strong> avec vos plats et suggestions",
    "<strong style='color:#c19a56;font-weight:600'>Réservation en ligne intégrée</strong> (sans commission TheFork)",
    "Galerie d'ambiance et informations pratiques",
    "Design responsive mobile, tablette, ordinateur",
  ];
  if (t === "glacier") return [
    "<strong>Vitrine de vos parfums du moment</strong> mise à jour en 1 clic",
    "<strong>Coupes & spécialités</strong> présentées avec photos appétissantes",
    "<strong style='color:#c19a56;font-weight:600'>Formulaire de commande</strong> pour anniversaires et événements",
    "Horaires, adresse et plan intégrés",
    "Design responsive mobile, tablette, ordinateur",
  ];
  if (["boulangerie", "patisserie", "chocolatier"].includes(t)) return [
    "<strong>Vitrine de vos créations</strong> (pains, viennoiseries, pâtisseries)",
    "<strong>Mise à jour autonome</strong> des produits depuis votre téléphone",
    "<strong style='color:#c19a56;font-weight:600'>Commandes spéciales</strong> (gâteaux, pièces montées, occasions)",
    "Horaires, adresse et contact mis en avant",
    "Design responsive mobile, tablette, ordinateur",
  ];
  if (["cafe", "salon_de_the"].includes(t)) return [
    "<strong>Carte des boissons et formules</strong> présentée avec soin",
    "<strong>Présentation du lieu</strong> avec photos et ambiance",
    "<strong style='color:#c19a56;font-weight:600'>Événements & privatisations</strong> faciles à gérer",
    "Horaires, adresse et contact mis en avant",
    "Design responsive mobile, tablette, ordinateur",
  ];
  if (["pizzeria", "creperie", "food_truck"].includes(t)) return [
    "<strong>Carte complète</strong> avec vos spécialités et options",
    "<strong>Commande en ligne</strong> ou réservation à emporter",
    "<strong style='color:#c19a56;font-weight:600'>Mise à jour de la carte</strong> en 2 minutes",
    "Horaires, adresse et contact mis en avant",
    "Design responsive mobile, tablette, ordinateur",
  ];
  if (["coiffeur", "spa", "institut", "fitness"].includes(t)) return [
    "<strong>Prise de rendez-vous en ligne</strong> 24h/24, 7j/7",
    "<strong>Présentation de vos prestations</strong> avec photos",
    "<strong style='color:#c19a56;font-weight:600'>Galerie avant/après</strong> pour rassurer les nouveaux clients",
    "Présentation de l'équipe et de l'ambiance",
    "Design responsive mobile, tablette, ordinateur",
  ];
  if (["dentiste", "osteo", "kine"].includes(t)) return [
    "<strong>Prise de rendez-vous en ligne</strong> 24h/24",
    "<strong>Présentation des soins</strong> et du cabinet",
    "<strong style='color:#c19a56;font-weight:600'>Espace patient</strong> avec infos pratiques",
    "Adresse, horaires et accès mis en avant",
    "Design responsive mobile, tablette, ordinateur",
  ];
  if (["plombier", "electricien", "garage", "menuisier", "peintre"].includes(t)) return [
    "<strong>Formulaire de devis</strong> en ligne disponible 24h/24",
    "<strong>Présentation de vos interventions</strong> et zones géographiques",
    "<strong style='color:#c19a56;font-weight:600'>Avis Google intégrés</strong> pour renforcer la confiance",
    "Contact direct et numéro mis en avant",
    "Design responsive mobile, tablette, ordinateur",
  ];
  if (["salle_sport", "auto_ecole"].includes(t)) return [
    "<strong>Présentation de vos formules</strong> et tarifs",
    "<strong>Réservation de créneaux</strong> en ligne",
    "<strong style='color:#c19a56;font-weight:600'>Suivi et coaching</strong> intégrés",
    "Adresse, horaires et contact mis en avant",
    "Design responsive mobile, tablette, ordinateur",
  ];
  // Default
  return [
    "<strong>Page d'accueil</strong> personnalisée avec vos informations",
    "<strong>Présentation de vos services/produits</strong>",
    "<strong style='color:#c19a56;font-weight:600'>Formulaire de contact</strong> intégré",
    "Horaires, adresse et contact mis en avant",
    "Design responsive mobile, tablette, ordinateur",
  ];
}

/* ── Bloc admin adapté au métier ────────────────────────────────────────── */
function getEmailAdminBlock(businessType?: string): string {
  const t = (businessType || "restaurant").toLowerCase();
  if (["restaurant", "brasserie", "bistrot", "gastronomique", "bar"].includes(t)) {
    return `<div style="background:#1a1310;color:#f9f5ef;padding:24px;border-radius:4px;margin:24px 0">
    <p style="font-size:13px;color:#c19a56;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.15em;font-weight:600">Votre espace admin</p>
    <p style="font-size:14px;line-height:1.7;color:rgba(249,245,239,0.9)">Chaque réservation vous arrive par email + notification. Vous confirmez d'un clic. Modifiez la carte en 2 minutes depuis votre téléphone, et suivez la fréquentation dans votre tableau de bord privé.</p>
  </div>`;
  }
  if (["coiffeur", "spa", "institut", "dentiste", "osteo", "kine", "fitness", "salle_sport", "auto_ecole"].includes(t)) {
    return `<div style="background:#1a1310;color:#f9f5ef;padding:24px;border-radius:4px;margin:24px 0">
    <p style="font-size:13px;color:#c19a56;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.15em;font-weight:600">Votre espace admin</p>
    <p style="font-size:14px;line-height:1.7;color:rgba(249,245,239,0.9)">Chaque demande de rendez-vous vous arrive par email. Vous acceptez ou proposez un autre créneau en un clic. Vos disponibilités sont toujours à jour sur le site.</p>
  </div>`;
  }
  if (["plombier", "electricien", "garage", "menuisier", "peintre"].includes(t)) {
    return `<div style="background:#1a1310;color:#f9f5ef;padding:24px;border-radius:4px;margin:24px 0">
    <p style="font-size:13px;color:#c19a56;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.15em;font-weight:600">Votre espace admin</p>
    <p style="font-size:14px;line-height:1.7;color:rgba(249,245,239,0.9)">Chaque demande de devis vous arrive directement par email. Vous répondez depuis votre téléphone. Vos nouvelles réalisations sont ajoutées en 2 minutes.</p>
  </div>`;
  }
  // Fallback minimal
  return `<div style="background:#1a1310;color:#f9f5ef;padding:24px;border-radius:4px;margin:24px 0">
    <p style="font-size:13px;color:#c19a56;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.15em;font-weight:600">Votre espace admin</p>
    <p style="font-size:14px;line-height:1.7;color:rgba(249,245,239,0.9)">Mettez à jour votre site en autonomie depuis votre téléphone : textes, photos, horaires. Chaque demande client vous arrive par email.</p>
  </div>`;
}

/* ── Bullets "vous gagnez" adaptés au métier ────────────────────────────── */
function getEmailGainBullets(businessType?: string): string[] {
  const t = (businessType || "restaurant").toLowerCase();
  if (["restaurant", "brasserie", "bistrot", "gastronomique", "bar"].includes(t)) return [
    "Des <strong>réservations directes 24/7</strong> sans commission (0 € vs 2,50 € / couvert sur TheFork)",
    "Une <strong>première impression pro</strong> sur Google (75 % de vos clients cherchent en ligne)",
    "Un <strong>outil simple</strong> pour changer votre carte en 2 min depuis votre téléphone",
  ];
  if (["coiffeur", "spa", "institut", "fitness", "salle_sport"].includes(t)) return [
    "Des <strong>rendez-vous en ligne 24/7</strong> même quand vous êtes en cabine ou sur le sol",
    "Moins de temps au téléphone pour l'agenda, <strong>plus de temps pour vos clients</strong>",
    "De <strong>nouveaux clients</strong> qui vous trouvent en cherchant votre activité sur Google",
  ];
  if (["plombier", "electricien", "garage", "menuisier"].includes(t)) return [
    "Des <strong>demandes de devis automatiques</strong> directement dans votre boîte email",
    "Une <strong>crédibilité renforcée</strong> — les artisans avec un site pro convertissent 3× plus",
    "Du temps gagné : <strong>les clients qualifiés arrivent à vous</strong> sans démarchage",
  ];
  if (["boulangerie", "patisserie", "glacier"].includes(t)) return [
    "Des <strong>commandes spéciales</strong> (gâteaux, événements) reçues directement en ligne",
    "Une <strong>visibilité accrue</strong> dans les recherches Google Maps du quartier",
    "Un outil simple pour <strong>annoncer vos nouveautés</strong> et spécialités du moment",
  ];
  return [
    "Une <strong>présence professionnelle</strong> sur internet qui renvoie confiance",
    "De <strong>nouveaux clients</strong> qui vous trouvent en cherchant votre activité",
    "Un site que vous <strong>gérez en autonomie</strong> depuis votre téléphone",
  ];
}

function buildRestaurantEmailBody(prospect: Prospect, content: RestaurantContent, mockupUrl: string): string {
  const bt = prospect.business_type || "restaurant";

  // Bloc "audit mystérieux" uniquement si le site existe ET qualité poor/average
  const hasOutdatedSite = prospect.website
    && (prospect.site_quality === "poor" || prospect.site_quality === "average")
    && content.auditTeaser && content.auditTeaser.trim().length > 0;

  const auditBlock = hasOutdatedSite
    ? `
  <div style="background:linear-gradient(135deg,#fff4e6,#fef3c7);border:1px solid #fbbf24;border-radius:6px;padding:22px 24px;margin:24px 0">
    <p style="font-size:11px;color:#92400e;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.15em;font-weight:700">🔍 Audit de votre présence en ligne</p>
    <p style="font-size:14px;color:#78350f;margin:0 0 10px;line-height:1.6">J'ai jeté un œil à votre site actuel et identifié quelques opportunités d'amélioration, <strong>${escape(content.auditTeaser || "")}</strong>.</p>
    <p style="font-size:13px;color:#92400e;margin:0;font-style:italic">Je ne détaille pas tout ici par souci de clarté — j'ai directement appliqué plusieurs de ces axes dans la maquette ci-dessous. Vous verrez la différence.</p>
  </div>`
    : "";

  const featureBullets = getEmailFeatureBullets(bt);
  const gainBullets = getEmailGainBullets(bt);
  const adminBlock = getEmailAdminBlock(bt);

  return `<div style="font-family:'Inter',system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1310;line-height:1.6;background:#fdfaf5">
  <p style="font-size:15px;margin-bottom:16px">${escape(content.emailOpening)}</p>
  <p style="font-size:15px;margin-bottom:20px">${escape(content.emailPitch)}</p>

  ${auditBlock}

  <div style="background:#fff;border:1px solid #e8dfd0;padding:28px;margin:24px 0;border-radius:4px;text-align:center">
    <p style="font-size:12px;color:#8b7e6e;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.15em;font-weight:600">Votre maquette</p>
    <p style="font-family:Georgia,serif;font-size:24px;font-weight:500;color:#1a1310;margin-bottom:6px">${escape(prospect.name)}</p>
    ${prospect.city ? `<p style="font-size:13px;color:#8b7e6e;margin-bottom:20px;font-style:italic">${escape(prospect.city)}</p>` : ""}
    <a href="${mockupUrl}" style="display:inline-block;padding:14px 32px;background:#c19a56;color:#fff;text-decoration:none;border-radius:2px;font-weight:600;font-size:13px;letter-spacing:0.15em;text-transform:uppercase">Découvrir ma maquette →</a>
  </div>

  <p style="font-size:14px;color:#4a4340;margin-bottom:12px"><strong style="color:#1a1310">Ce que votre site inclut :</strong></p>
  <ul style="font-size:14px;color:#4a4340;padding-left:20px;margin-bottom:20px">
    ${featureBullets.map(b => `<li>${b}</li>`).join("\n    ")}
  </ul>

  ${adminBlock}

  <div style="background:linear-gradient(135deg,#fef3c7,#fde68a);border:2px solid #c19a56;border-radius:6px;padding:22px 26px;margin:24px 0;text-align:center">
    <p style="font-size:11px;color:#92400e;margin:0 0 6px;text-transform:uppercase;letter-spacing:0.2em;font-weight:800">🔥 -47% • Offre de lancement</p>
    <p style="margin:0 0 4px"><span style="text-decoration:line-through;opacity:0.5;font-size:18px;color:#78350f">599 €</span> <span style="font-family:Georgia,serif;font-size:28px;color:#1a1310;font-weight:700">199 € TTC</span></p>
    <p style="font-size:13px;color:#78350f;margin:0 0 10px">ou en <strong>3× sans frais</strong> via Klarna — 3 × 66,33 €</p>
    <p style="font-size:12px;color:#92400e;margin:0 0 14px;font-style:italic">✓ Livraison 5 jours • ✓ Propriétaire à vie • ✓ Satisfait ou remboursé 14 jours</p>
    <a href="${mockupUrl}" style="display:inline-block;padding:14px 32px;background:#c19a56;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;font-size:14px;letter-spacing:0.1em;text-transform:uppercase;box-shadow:0 4px 12px rgba(193,154,86,0.4)">Voir ma maquette →</a>
    <p style="font-size:11px;color:#92400e;margin:10px 0 0;font-weight:600">⏳ Offre valable 48 h</p>
  </div>

  <p style="font-size:14px;color:#4a4340;margin-bottom:14px;line-height:1.7"><strong>Concrètement, avec ce site vous gagnez :</strong></p>
  <ul style="font-size:14px;color:#4a4340;padding-left:20px;margin-bottom:20px;line-height:1.8">
    ${gainBullets.map(b => `<li>${b}</li>`).join("\n    ")}
  </ul>

  <p style="font-size:14px;color:#4a4340;margin-bottom:24px">Ouvrez votre maquette, un <strong>chat en bas à droite 💬</strong> répond à toutes vos questions. Si un détail ne vous convient pas (photo, couleur, texte), utilisez le bouton <em>"Demander une modification"</em> — je vous réponds dans la journée.</p>

  <div style="background:#fff;border-left:3px solid #c19a56;padding:20px 24px;margin:24px 0;border-radius:4px">
    <p style="font-size:14px;color:#1a1310;margin-bottom:12px;font-weight:600">Une question ? Contactez-moi directement :</p>
    <p style="font-size:14px;color:#4a4340;margin-bottom:6px">📧 <a href="mailto:contact@webconceptor.fr" style="color:#c19a56;text-decoration:none"><strong>contact@webconceptor.fr</strong></a></p>
    <p style="font-size:14px;color:#4a4340;margin-bottom:12px">📞 <a href="tel:+33635592471" style="color:#c19a56;text-decoration:none"><strong>06 35 59 24 71</strong></a></p>
    <p style="font-size:13px;color:#8b7e6e;margin:0;font-style:italic">Merci de signaler à l&rsquo;opérateur votre nom, prénom et le nom de votre enseigne (<strong style="color:#1a1310">${escape(prospect.name)}</strong>) afin que votre dossier soit retrouvé rapidement.</p>
  </div>

  <div style="border-top:1px solid #e8dfd0;padding-top:20px;font-size:13px;color:#8b7e6e">
    <p style="margin-bottom:4px"><strong style="color:#1a1310">Tom Bauer</strong></p>
    <p style="margin-bottom:4px">Fondateur, WebConceptor</p>
    <p style="margin-bottom:2px">contact@webconceptor.fr &middot; 06 35 59 24 71</p>
    <p><a href="https://webconceptor.fr" style="color:#c19a56;text-decoration:none">webconceptor.fr</a></p>
  </div>
  <p style="font-size:11px;color:#b5a894;margin-top:24px;border-top:1px solid #f0e9dc;padding-top:16px">Vous recevez cet email car votre établissement est référencé publiquement sur Google. Pour ne plus être contacté, répondez simplement avec le mot STOP.</p>
</div>`;
}

/* ══════════════════════════════════════════
   POST
   ══════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  // Garde de sécurité ultime : toute exception inattendue renvoie 200 avec l'erreur
  // en body, pour que n8n ne plante JAMAIS son workflow à cause de /api/prospect/send.
  try {
    return await handleSend(req);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ success: false, error: msg, processed: 0, results: [] }, { status: 200 });
  }
}

async function handleSend(req: NextRequest) {
  const raw = await req.json().catch(() => ({}));

  // Validate + clamp inputs
  const prospect_id = typeof raw.prospect_id === "string" && /^[0-9a-f-]{10,64}$/i.test(raw.prospect_id)
    ? raw.prospect_id
    : null;
  const batch_size = Math.max(1, Math.min(50, Number.isFinite(Number(raw.batch_size)) ? Number(raw.batch_size) : 5));
  const dry_run = Boolean(raw.dry_run);

  // COUVRE-FEU : pas d'envoi d'email entre 19h et 9h (heure Paris)
  // Sauf override explicite (prospect_id = envoi ciblé manuel par admin) ou dry_run
  const override = Boolean(raw.force) || prospect_id !== null || dry_run;
  if (!override && !isWithinSendingHours(9, 19)) {
    return NextResponse.json({
      success: true,
      processed: 0,
      skipped_curfew: true,
      message: "Envoi bloqué — hors plage horaire (9h-19h heure Paris)",
    });
  }

  const supabase = getSupabaseAdmin();
  let prospects: Prospect[] = [];

  if (prospect_id) {
    const { data } = await supabase.from("prospects").select("*").eq("id", prospect_id).limit(1);
    if (data) prospects = data as Prospect[];
  } else {
    // On fetch LARGE (10× batch_size) pour garantir qu'on récupère TOUS les
    // no-site disponibles en DB, même s'ils sont anciens. Puis on trie côté JS
    // par priorité absolue au no-site (le meilleur public : ils n'ont même pas
    // de site donc PAS l'excuse 'j'ai déjà un site' quand on les appelle).
    const { data } = await supabase
      .from("prospects")
      .select("*")
      .eq("status", "found")
      .not("email", "is", null)
      .order("created_at", { ascending: true })
      .limit(batch_size * 10);
    if (data) {
      const QUALITY_PRIORITY: Record<string, number> = {
        none: 0,      // pas de site = MEILLEUR candidat (priorité absolue)
        poor: 1,      // site ancien/cassé = 2ème meilleur
        average: 2,   // site moyen = 3ème
        good: 3,      // site moderne = 4ème (on envoie quand même)
      };
      const sorted = [...(data as Prospect[])].sort((a, b) => {
        const qa = QUALITY_PRIORITY[a.site_quality || "poor"] ?? 3;
        const qb = QUALITY_PRIORITY[b.site_quality || "poor"] ?? 3;
        if (qa !== qb) return qa - qb;
        // Au même niveau de qualité : plus ancien d'abord
        return 0;
      });
      prospects = sorted.slice(0, batch_size);
    }
  }

  if (prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun prospect à traiter" });
  }

  // The email link must always point to the real site — never trust the Origin
  // header (an attacker with the admin key could otherwise craft phishing links).
  const origin = "https://webconceptor.fr";
  const results: Array<{ id: string; name: string; status: string; error?: string }> = [];

  // Hard deadline — Render free tier coupe à ~100 s. On s'arrête à 80 s pour
  // garantir une réponse 200 propre plutôt qu'un 502 qui tuerait le workflow n8n.
  // On traite autant de prospects que possible dans ce budget, les autres
  // resteront 'found' en DB et seront pris au prochain run.
  const SEND_DEADLINE_MS = 50_000; // 50 s (Vercel free coupe à 60 s)
  const sendStartedAt = Date.now();
  const sendTimeLeft = () => SEND_DEADLINE_MS - (Date.now() - sendStartedAt);
  let timedOut = 0;

  for (const p of prospects) {
    // Si on n'a plus assez de temps pour un cycle complet (Claude 10-25s + envoi Brevo + notif) → on arrête
    if (sendTimeLeft() < 12_000) {
      timedOut++;
      results.push({ id: p.id, name: p.name, status: "deferred_timeout" });
      continue;
    }

    if (!p.email) {
      results.push({ id: p.id, name: p.name, status: "no_email" });
      continue;
    }

    // Note : on NE skip PLUS les "good" sites — le tri par priorité gère déjà
    // l'ordre (no-site > poor > average > good), donc les bons prospects passent
    // en premier. Skipper les "good" faisait 0 envoi sur les campagnes premium
    // (ex : restaurants gastronomiques Paris où 99% ont un site moderne).
    // Pitch valide même pour un site moderne : module réservation sans commission,
    // 3× sans frais, et un design premium reste un argument.

    try {
      const mockupUrl = `${origin}/prospects/${p.slug}`;

      // Personnalisation texte via Haiku — valable pour TOUS les métiers.
      // La fonction calcule vibe/cuisineType/talkingPoints localement (0 token),
      // ne demande à Claude que : heroTitle, heroSubtitle, aboutText, menuItems, emailSubject, emailPitch.
      const restoContent = await personalizeRestaurantWithClaude(p);

      const restoProspect: RestaurantProspect = {
        id: p.id, slug: p.slug, name: p.name,
        city: p.city, address: p.address, phone: p.phone,
        website: p.website, email: p.email,
        google_rating: p.google_rating, google_reviews_count: p.google_reviews_count,
        photos: p.photos, hours: p.hours,
        website_photos: p.website_photos || undefined,
        business_type: p.business_type, // CTAs adaptés au métier via getBusinessLabels()
      };

      // Maquette HTML : priorité au rich_audit (couleurs/sections custom extraites du site actuel)
      // sinon on utilise le template 5-thèmes × business_type de mockup-restaurant.ts.
      let html: string;
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
        // Template principal : 5 thèmes visuels, CTAs adaptés au métier,
        // menus/services, reviews Google — couvre TOUS les business_type.
        const contentWithReviews = {
          ...restoContent,
          reviews: p.reviews || undefined,
        };
        html = generateRestaurantMockupHtml(restoProspect, contentWithReviews, origin);
      }

      const emailBody = buildRestaurantEmailBody(p, restoContent, mockupUrl);
      const emailSubject = restoContent.emailSubject;

      // Save mockup + email content to DB
      await supabase
        .from("prospects")
        .update({
          mockup_html: html,
          email_subject: emailSubject,
          email_body: emailBody,
          status: dry_run ? "ready" : "sent",
          sent_at: dry_run ? null : new Date().toISOString(),
        })
        .eq("id", p.id);

      if (!dry_run) {
        // ═══════════════════════════════════════════════════════════
        // ENVOI MULTI-ADRESSES
        // On envoie à l'email principal ET à 1 email additionnel (si différent)
        // → maximise les chances que le DÉCIDEUR lise le pitch (souvent le
        // mail perso du patron est plus regardé que le contact@entreprise).
        // Cap à 2 emails max pour ne pas exploser le budget Brevo (4775 crédits).
        // ═══════════════════════════════════════════════════════════
        const targetEmails: string[] = [p.email.toLowerCase()];
        if (Array.isArray(p.additional_emails)) {
          for (const extra of p.additional_emails) {
            if (typeof extra === "string" && extra.toLowerCase() !== p.email.toLowerCase() && targetEmails.length < 2) {
              targetEmails.push(extra.toLowerCase());
            }
          }
        }

        // Envoi en parallèle aux 1 ou 2 destinataires
        const sendResults = await Promise.all(
          targetEmails.map((addr) => sendEmail(addr, p.name, emailSubject, emailBody))
        );
        const successCount = sendResults.filter(Boolean).length;

        if (successCount === 0) {
          // Aucun des 2 mails n'est parti → vrai échec
          await supabase
            .from("prospects")
            .update({ status: "error", error: "Brevo send failed" })
            .eq("id", p.id);
          results.push({ id: p.id, name: p.name, status: "error", error: "Brevo failed" });
          continue;
        }

        // Au moins 1 sur 2 parti → on considère le prospect comme contacté.
        // Log dans les notes quels emails ont reçu / échoué pour debug.
        if (targetEmails.length > 1) {
          const reports = targetEmails.map((addr, i) => `${sendResults[i] ? "✅" : "❌"} ${addr}`).join(", ");
          await supabase
            .from("prospects")
            .update({
              notes: `[${new Date().toISOString().slice(0, 16).replace("T", " ")}] 📧 Emails envoyés: ${reports}`,
            })
            .eq("id", p.id);
        }

        // Badge "PAS DE SITE" — les prospects sans site convertissent mieux
        // (ils n'ont pas l'excuse "j'ai déjà un site"), donc on les met en avant
        // dans la notif Telegram pour que Rubens les rappelle en priorité.
        const noSiteBadge = p.site_quality === "none"
          ? `🆕 <b>PAS DE SITE — PRIO MAX POUR APPEL</b>\n\n`
          : "";

        // Libellé + emoji adapté au métier (plus de "Restaurant contacté" sur coiffeurs/plombiers/etc.)
        const metierMap: Record<string, { emoji: string; label: string }> = {
          restaurant:    { emoji: "🍽️", label: "Restaurant contacté" },
          boulangerie:   { emoji: "🥖", label: "Boulangerie contactée" },
          patisserie:    { emoji: "🧁", label: "Pâtisserie contactée" },
          cafe:          { emoji: "☕", label: "Café contacté" },
          glacier:       { emoji: "🍦", label: "Glacier contacté" },
          coiffeur:      { emoji: "💇", label: "Salon de coiffure contacté" },
          institut:      { emoji: "💅", label: "Institut de beauté contacté" },
          plombier:      { emoji: "🔧", label: "Plombier contacté" },
          electricien:   { emoji: "⚡", label: "Électricien contacté" },
          garage:        { emoji: "🚗", label: "Garage automobile contacté" },
          dentiste:      { emoji: "🦷", label: "Cabinet dentaire contacté" },
          osteo:         { emoji: "🤲", label: "Ostéopathe contacté" },
          salle_sport:   { emoji: "🏋️", label: "Salle de sport contactée" },
          fleuriste:     { emoji: "🌸", label: "Fleuriste contactée" },
          auto_ecole:    { emoji: "🚘", label: "Auto-école contactée" },
          epicerie:      { emoji: "🛒", label: "Épicerie contactée" },
        };
        const metierInfo = metierMap[p.business_type || ""] || { emoji: "📧", label: "Prospect contacté" };

        if (isRestaurant) {
          // Rich restaurant notif with cuisine + talking points for phone follow-up
          const restoContent = await personalizeRestaurantWithClaude(p);
          const talkingPointsTxt = restoContent.talkingPoints
            .slice(0, 5)
            .map((t, i) => `${i + 1}. ${escapeTelegram(t)}`)
            .join("\n");
          await notifyTelegram(
            noSiteBadge +
            `${metierInfo.emoji} <b>${metierInfo.label}</b>\n\n` +
            `<b>${escapeTelegram(p.name)}</b>\n` +
            `📍 ${escapeTelegram(p.address || p.city || "?")}\n` +
            `📞 <b>${escapeTelegram(p.phone || "pas de tél")}</b>\n` +
            `✉️ ${escapeTelegram(p.email)}\n` +
            `🏷️ ${escapeTelegram(restoContent.cuisineType)}\n` +
            `⭐ ${p.google_rating ? escapeTelegram(String(p.google_rating)) : "?"}/5 (${p.google_reviews_count || 0} avis)\n\n` +
            `<b>💬 Grandes lignes pour l'appel :</b>\n${talkingPointsTxt}\n\n` +
            `<a href="${escapeTelegram(mockupUrl)}">→ Voir la maquette</a>`
          );
        } else {
          // Compact épicerie notif
          await notifyTelegram(
            noSiteBadge +
            `📧 <b>Prospect contacté</b>\n\n` +
            `<b>${escapeTelegram(p.name)}</b>\n` +
            `📍 ${escapeTelegram(p.address || p.city || "?")}\n` +
            `📞 <b>${escapeTelegram(p.phone || "pas de tél")}</b>\n` +
            `✉️ ${escapeTelegram(p.email)}\n` +
            `⭐ ${p.google_rating ? escapeTelegram(String(p.google_rating)) : "?"}/5\n\n` +
            `<a href="${escapeTelegram(mockupUrl)}">→ Voir la maquette</a>`
          );
        }
      }

      results.push({ id: p.id, name: p.name, status: dry_run ? "ready" : "sent" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      await supabase.from("prospects").update({ status: "error", error: msg }).eq("id", p.id);
      results.push({ id: p.id, name: p.name, status: "error", error: msg });
    }
  }

  return NextResponse.json({
    success: true,
    processed: results.length,
    timed_out: timedOut,
    elapsed_ms: Date.now() - sendStartedAt,
    results,
  });
}
