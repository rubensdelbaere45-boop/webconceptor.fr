import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { escapeTelegram, safeCompare } from "@/lib/security";
import {
  generateRestaurantMockupHtml,
  type RestaurantProspect,
  type RestaurantContent,
} from "@/lib/mockup-restaurant";

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
  google_rating?: number;
  google_reviews_count?: number;
  photos?: string[];
  hours?: string;
  business_type?: string;
  menu_items?: Array<{ category: "entrée" | "plat" | "dessert"; name: string; description: string; price: string }> | null;
}

interface PersonalizedContent {
  heroTitle: string;
  heroSubtitle: string;
  aboutText: string;
  emailSubject: string;
  emailOpening: string;
  emailPitch: string;
}

async function personalizeWithClaude(prospect: Prospect): Promise<PersonalizedContent> {
  const key = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || "";

  const fallback: PersonalizedContent = {
    heroTitle: `${prospect.name}`,
    heroSubtitle: `L'épicerie de proximité${prospect.city ? ` à ${prospect.city}` : ""}`,
    aboutText: `Un commerce de proximité au cœur de la vie du village. Découvrez nos produits frais, nos arrivages et nos spécialités.`,
    emailSubject: `Maquette de votre site web pour ${prospect.name}`,
    emailOpening: `Bonjour,`,
    emailPitch: `J'ai pris l'initiative de réaliser une maquette complète du site web de ${prospect.name}, en m'appuyant sur les informations publiques disponibles sur votre magasin.`,
  };

  if (!key) return fallback;

  const isOpenRouter = key.startsWith("sk-or-");
  const endpoint = isOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.anthropic.com/v1/messages";

  const infoLines = [
    `Nom du magasin : ${prospect.name}`,
    prospect.city ? `Ville : ${prospect.city}` : "",
    prospect.address ? `Adresse : ${prospect.address}` : "",
    prospect.google_rating ? `Note Google : ${prospect.google_rating}/5 (${prospect.google_reviews_count || 0} avis)` : "",
    prospect.website ? `Site web actuel : ${prospect.website}` : "Pas de site web",
    prospect.hours ? `Horaires : ${prospect.hours.slice(0, 200)}` : "",
  ].filter(Boolean).join("\n");

  const prompt = `Tu prépares une maquette de site web et un email professionnel cordial pour un magasin Proxi (épicerie de proximité française) que nous prospectons.

Infos du magasin :
${infoLines}

Génère un objet JSON avec ces 6 clés EXACTEMENT :
{
  "heroTitle": "titre du hero site, court (5-8 mots), évoque le commerce de proximité et le nom",
  "heroSubtitle": "sous-titre hero, 10-15 mots, évoque la ville ou le quartier",
  "aboutText": "paragraphe À propos de 40-60 mots, chaleureux, évoque les produits, l'ambiance, la proximité",
  "emailSubject": "objet de l'email, 50 caractères max, personnalisé avec le nom du magasin",
  "emailOpening": "salutation polie (Bonjour, ...), sans nom si inconnu",
  "emailPitch": "1-2 phrases professionnelles mentionnant que tu as préparé une maquette de leur site et que tu l'as adaptée à leur activité. Mentionne 1 détail réel du magasin (ville, note Google si >4, etc.)"
}

Ton : chaleureux, professionnel, francophone France. N'invente PAS d'information. Réponds UNIQUEMENT avec le JSON valide, sans texte avant ou après.`;

  try {
    const body = isOpenRouter
      ? {
          model: "anthropic/claude-haiku-4.5",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 600,
          response_format: { type: "json_object" },
        }
      : {
          model: "claude-haiku-4-5",
          max_tokens: 600,
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

    return {
      heroTitle: parsed.heroTitle || fallback.heroTitle,
      heroSubtitle: parsed.heroSubtitle || fallback.heroSubtitle,
      aboutText: parsed.aboutText || fallback.aboutText,
      emailSubject: parsed.emailSubject || fallback.emailSubject,
      emailOpening: parsed.emailOpening || fallback.emailOpening,
      emailPitch: parsed.emailPitch || fallback.emailPitch,
    };
  } catch {
    return fallback;
  }
}

/* ══════════════════════════════════════════
   Restaurant personalization — menu + content
   ══════════════════════════════════════════ */

async function personalizeRestaurantWithClaude(prospect: Prospect): Promise<RestaurantContent> {
  const key = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || "";

  const fallback: RestaurantContent = {
    heroTitle: prospect.name,
    heroSubtitle: `Une table${prospect.city ? ` à ${prospect.city}` : ""}, pensée pour vous faire vivre un moment.`,
    aboutText: `Nous vous accueillons dans un cadre chaleureux pour vous faire découvrir une cuisine généreuse, inspirée des produits de saison. Chaque plat est préparé avec soin et passion.`,
    menuItems: [
      { category: "entrée", name: "Salade de chèvre chaud", description: "Mesclun, toasts de chèvre, miel, noix grillées", price: "12€" },
      { category: "entrée", name: "Tartare de saumon", description: "Saumon label rouge, aneth, citron vert, toasts", price: "14€" },
      { category: "entrée", name: "Velouté du moment", description: "Légumes de saison mijotés, crème fraîche", price: "9€" },
      { category: "plat", name: "Entrecôte grillée", description: "Pièce maturée 300g, frites maison, sauce au poivre", price: "24€" },
      { category: "plat", name: "Filet de dorade", description: "Dorade rôtie, légumes de saison, huile d'olive", price: "22€" },
      { category: "plat", name: "Risotto aux champignons", description: "Arborio crémeux, champignons des bois, parmesan 24 mois", price: "18€" },
      { category: "plat", name: "Magret de canard", description: "Sauce au miel et épices douces, purée de patates douces", price: "23€" },
      { category: "dessert", name: "Moelleux au chocolat", description: "Cœur coulant, glace vanille de Madagascar", price: "9€" },
      { category: "dessert", name: "Tarte fine aux pommes", description: "Pâte feuilletée, pommes caramélisées, crème d'amande", price: "8€" },
      { category: "dessert", name: "Café gourmand", description: "Expresso, mignardises du jour", price: "9€" },
    ],
    cuisineType: "cuisine française traditionnelle",
    talkingPoints: [
      "Site vitrine personnalisé avec votre identité",
      "Module de réservation en ligne intégré (sans commission)",
      "Espace admin pour gérer la carte en 2 minutes",
      "Livraison en 5 jours pour 599 € HT",
      "Option Sérénité 50 €/mois : mises à jour illimitées",
    ],
    emailSubject: `Maquette de votre site pour ${prospect.name}`,
    emailOpening: `Bonjour,`,
    emailPitch: `J'ai pris l'initiative de préparer une maquette complète du site web de ${prospect.name}, avec une interface de réservation en ligne intégrée.`,
  };

  if (!key) return fallback;

  const isOpenRouter = key.startsWith("sk-or-");
  const endpoint = isOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.anthropic.com/v1/messages";

  const infoLines = [
    `Nom du restaurant : ${prospect.name}`,
    prospect.city ? `Ville : ${prospect.city}` : "",
    prospect.address ? `Adresse : ${prospect.address}` : "",
    prospect.google_rating ? `Note Google : ${prospect.google_rating}/5 (${prospect.google_reviews_count || 0} avis)` : "",
    prospect.website ? `Site web actuel : ${prospect.website}` : "Pas de site web",
    prospect.hours ? `Horaires : ${prospect.hours.slice(0, 200)}` : "",
  ].filter(Boolean).join("\n");

  // If we already have a scraped real menu, we don't need Claude to invent dishes
  const hasScrapedMenu = Array.isArray(prospect.menu_items) && prospect.menu_items.length >= 4;

  const prompt = `Tu prépares une maquette de site web premium pour un restaurant français que nous prospectons.

Infos du restaurant :
${infoLines}

Génère un objet JSON avec ces clés EXACTEMENT :
{
  "heroTitle": "titre hero élégant et court (4-8 mots), évoque l'adresse/la table, PAS le nom du restaurant (il est déjà dans le header)",
  "heroSubtitle": "phrase d'accroche 12-18 mots, évoque l'ambiance ou la cuisine",
  "aboutText": "paragraphe 50-80 mots pour la section 'À propos', chaleureux, évoque la cuisine, l'ambiance, la philosophie. Pas de mensonge, reste plausible.",${
    hasScrapedMenu
      ? ""
      : `
  "menuItems": [10 plats max, mélange 3-4 entrées, 4-5 plats, 2-3 desserts], chaque item = { "category": "entrée"|"plat"|"dessert", "name": "nom du plat", "description": "courte description 5-10 mots des ingrédients", "price": "XX€" } — choisis des plats PLAUSIBLES pour ce type de restaurant (si nom italien → italien, si brasserie → brasserie, sinon cuisine française classique). Prix réalistes.`
  }
  "cuisineType": "type de cuisine en 3-6 mots (ex: 'brasserie française traditionnelle', 'cuisine italienne', 'gastronomie française', 'bistro moderne')",
  "talkingPoints": [5 bullet points courts (max 12 mots chacun) que le fondateur peut dire au patron par téléphone. Ex: 'Réservations en ligne sans commission', 'Mise à jour de la carte en 2 min via admin'. Focus bénéfices concrets du site WebConceptor : création sur-mesure 599€, livraison 5j, module réservation, admin simple, option Sérénité 50€/mois.],
  "emailSubject": "objet email, 50 caractères max, personnalisé avec nom restaurant",
  "emailOpening": "salutation (Bonjour,)",
  "emailPitch": "1-2 phrases cordiales : tu as préparé une maquette avec système de réservation en ligne. Mentionne 1 détail réel (ville, note Google>4, etc.) si disponible."
}

Ton : professionnel, élégant, francophone France. Réponds UNIQUEMENT avec le JSON valide, rien d'autre.`;

  try {
    const body = isOpenRouter
      ? {
          model: "anthropic/claude-haiku-4.5",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 1500,
          response_format: { type: "json_object" },
        }
      : {
          model: "claude-haiku-4-5",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }],
        };

    const res = await fetch(endpoint, {
      method: "POST",
      headers: isOpenRouter
        ? { "Content-Type": "application/json", "Authorization": `Bearer ${key}` }
        : { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
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

    // Priorité 1 : si le menu a été scrapé en amont (find), on l'utilise
    // Priorité 2 : sinon ce que Claude a généré
    // Priorité 3 : fallback
    type MenuItem = { category: "entrée" | "plat" | "dessert"; name: string; description: string; price: string };
    let menuItems: MenuItem[] = fallback.menuItems;
    if (hasScrapedMenu) {
      menuItems = prospect.menu_items as MenuItem[];
    } else if (Array.isArray(parsed.menuItems) && parsed.menuItems.length >= 4) {
      const filtered = parsed.menuItems
        .filter((m: unknown): m is MenuItem =>
          typeof m === "object" && m !== null &&
          ["entrée", "plat", "dessert"].includes((m as { category?: unknown }).category as string) &&
          typeof (m as { name?: unknown }).name === "string" &&
          typeof (m as { description?: unknown }).description === "string" &&
          typeof (m as { price?: unknown }).price === "string"
        )
        .slice(0, 12)
        .map((m: MenuItem) => ({
          category: m.category,
          name: String(m.name).slice(0, 60),
          description: String(m.description).slice(0, 120),
          price: String(m.price).slice(0, 10),
        }));
      if (filtered.length >= 4) menuItems = filtered;
    }

    // Validate talkingPoints (array of strings)
    let talkingPoints = fallback.talkingPoints;
    if (Array.isArray(parsed.talkingPoints)) {
      const tp = parsed.talkingPoints
        .filter((t: unknown): t is string => typeof t === "string" && t.length > 0)
        .slice(0, 6)
        .map((t: string) => t.slice(0, 120));
      if (tp.length >= 2) talkingPoints = tp;
    }

    return {
      heroTitle: String(parsed.heroTitle || fallback.heroTitle).slice(0, 100),
      heroSubtitle: String(parsed.heroSubtitle || fallback.heroSubtitle).slice(0, 200),
      aboutText: String(parsed.aboutText || fallback.aboutText).slice(0, 500),
      menuItems,
      cuisineType: String(parsed.cuisineType || fallback.cuisineType).slice(0, 80),
      talkingPoints,
      emailSubject: String(parsed.emailSubject || fallback.emailSubject).slice(0, 100),
      emailOpening: String(parsed.emailOpening || fallback.emailOpening).slice(0, 50),
      emailPitch: String(parsed.emailPitch || fallback.emailPitch).slice(0, 500),
    };
  } catch {
    return fallback;
  }
}

/* ══════════════════════════════════════════
   Mockup HTML template (Proxi style, personnalisé)
   ══════════════════════════════════════════ */

function escape(s: string): string {
  return (s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generateMockupHtml(prospect: Prospect, content: PersonalizedContent, origin: string): string {
  // Photos: either a Google Places reference (proxied server-side) or fallback Unsplash.
  // Older records may still contain full URLs — we detect and re-proxy safely.
  const FALLBACK_PHOTO = "https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=1600&q=80&auto=format&fit=crop";
  let rawPhoto = prospect.photos?.[0] || "";
  let photoUrl = FALLBACK_PHOTO;
  if (rawPhoto) {
    if (/^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/.test(rawPhoto)) {
      // Clean reference -> proxy (no key exposed)
      photoUrl = `${origin}/api/prospect/photo?ref=${encodeURIComponent(rawPhoto)}`;
    } else if (/^https:\/\/images\.unsplash\.com\//.test(rawPhoto)) {
      // Safe external source
      photoUrl = rawPhoto;
    }
    // Any other shape (including legacy URLs with embedded API keys) falls back to the generic photo.
  }
  // Escape for safe HTML attribute embedding
  const photo = escape(photoUrl);
  const cityStr = prospect.city ? escape(prospect.city) : "";
  const addressStr = escape(prospect.address || "");
  const phoneStr = escape(prospect.phone || "");
  const websiteStr = escape(prospect.website || "");

  return `<!DOCTYPE html>
<!--
  ─────────────────────────────────────────────────────
  Design, code et intégration : WebConceptor
  https://webconceptor.fr
  Maquette générée pour ${escape(prospect.name)}
  Toute reproduction, même partielle, est interdite.
  ─────────────────────────────────────────────────────
-->
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="author" content="WebConceptor — https://webconceptor.fr">
<meta name="copyright" content="© WebConceptor — Reproduction interdite">
<meta name="robots" content="noindex,noarchive">
<title>${escape(prospect.name)} — Épicerie de proximité</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,wght@0,500;0,600;0,700&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Lilita+One&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{margin:0;padding:0;box-sizing:border-box}
:root{--purple:#872175;--purple-dark:#6b1a5d;--green:#4CAF50;--green-light:#B5CC18;--cream:#FBF7F2;--warm:#FFFDF8;--ink:#2A1B26;--gray:#8B8089;--serif:'Fraunces',Georgia,serif;--sans:'Plus Jakarta Sans',system-ui,sans-serif;--brand:'Lilita One',sans-serif}
html{scroll-behavior:smooth}
body{font-family:var(--sans);background:var(--warm);color:var(--ink);overflow-x:hidden;-webkit-font-smoothing:antialiased;position:relative}
::selection{background:var(--purple);color:#fff}
body::after{content:'WEBCONCEPTOR · DÉMO';position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-30deg);font-size:110px;font-weight:900;color:rgba(135,33,117,0.02);letter-spacing:0.1em;white-space:nowrap;pointer-events:none;z-index:0;user-select:none}
img{display:block;max-width:100%}
a{color:inherit;text-decoration:none}

.wc-demo-badge{position:fixed;top:14px;right:14px;z-index:9998;background:rgba(10,10,10,0.92);color:#fff;padding:7px 14px;border-radius:100px;font-size:10px;font-weight:800;letter-spacing:0.15em;text-transform:uppercase;backdrop-filter:blur(10px);pointer-events:none;display:inline-flex;align-items:center;gap:6px}
.wc-demo-badge::before{content:'';width:6px;height:6px;background:#ef4444;border-radius:50%;animation:pulse 2s infinite}
.wc-home-btn{position:fixed;top:14px;left:14px;z-index:9998;display:inline-flex;align-items:center;gap:8px;background:#fff;color:#0a0a0a;padding:8px 16px 8px 10px;border-radius:100px;font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.12);border:1px solid rgba(0,0,0,0.06);transition:all 0.2s;font-family:var(--sans)}
.wc-home-btn:hover{transform:translateY(-1px);box-shadow:0 8px 30px rgba(0,0,0,0.18)}
.wc-home-btn-logo{width:22px;height:22px;background:#0066ff;border-radius:5px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:11px}
.wc-watermark{position:fixed;bottom:0;left:0;right:0;z-index:9999;background:linear-gradient(90deg,#2A1B26,#872175);padding:9px 20px;display:flex;align-items:center;justify-content:center;gap:10px;font-size:11px;color:rgba(255,255,255,0.85);letter-spacing:0.08em;text-transform:uppercase;font-weight:600;font-family:var(--sans)}
.wc-watermark strong{color:#fff;letter-spacing:0.15em}
.wc-watermark a{color:#FFD700;font-weight:700}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}

.top-strip{background:var(--purple);color:#fff;text-align:center;padding:8px 20px;font-size:12px;font-weight:500;position:relative;z-index:2}
nav{position:sticky;top:0;z-index:100;height:76px;padding:0 40px;display:flex;align-items:center;justify-content:space-between;background:rgba(255,253,248,0.9);backdrop-filter:blur(20px);border-bottom:1px solid rgba(135,33,117,0.08)}
.logo{display:flex;align-items:center;gap:10px;font-family:var(--brand);font-size:22px;color:var(--purple)}
.logo-badge{background:var(--purple);color:#fff;padding:6px 14px 6px 18px;border-radius:12px;font-family:var(--brand);font-size:20px;position:relative}
.logo-badge::after{content:'';position:absolute;top:-5px;right:-5px;width:12px;height:12px;background:var(--green-light);border-radius:50%;border:2px solid var(--warm)}
.logo-name{font-family:var(--serif);font-size:14px;color:var(--ink);font-weight:600}
.nav-links{display:flex;gap:28px;list-style:none}
.nav-links a{color:var(--ink);font-size:14px;font-weight:500;transition:color 0.2s}
.nav-links a:hover{color:var(--purple)}
.nav-cta{padding:10px 24px;background:var(--ink);color:#fff;font-size:13px;font-weight:600;border-radius:100px;transition:background 0.2s}
.nav-cta:hover{background:var(--purple)}

.hero{position:relative;padding:80px 40px 100px;background:linear-gradient(180deg,var(--cream),var(--warm));overflow:hidden}
.hero::before{content:'';position:absolute;top:-150px;right:-100px;width:500px;height:500px;background:radial-gradient(circle,rgba(135,33,117,0.15),transparent 70%);border-radius:50%}
.hero::after{content:'';position:absolute;bottom:-100px;left:-80px;width:400px;height:400px;background:radial-gradient(circle,rgba(76,175,80,0.12),transparent 70%);border-radius:50%}
.hero-inner{max-width:1200px;margin:0 auto;display:grid;grid-template-columns:1.1fr 1fr;gap:60px;align-items:center;position:relative;z-index:2}
.hero-tag{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:rgba(135,33,117,0.1);color:var(--purple-dark);border-radius:100px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:24px}
.hero-tag .dot{width:8px;height:8px;background:var(--green);border-radius:50%;animation:pulse 2s infinite}
.hero h1{font-family:var(--serif);font-size:clamp(2.2rem,4.5vw,4rem);font-weight:600;line-height:1.05;letter-spacing:-0.035em;margin-bottom:24px}
.hero h1 em{font-style:italic;color:var(--purple)}
.hero p{font-size:17px;color:var(--gray);line-height:1.6;margin-bottom:36px;max-width:480px}
.hero-ctas{display:flex;gap:12px;flex-wrap:wrap}
.btn-primary{padding:14px 32px;background:var(--purple);color:#fff;font-weight:700;font-size:14px;border-radius:100px;transition:all 0.25s;display:inline-flex;align-items:center;gap:8px}
.btn-primary:hover{background:var(--purple-dark);transform:translateY(-2px)}
.btn-outline{padding:14px 32px;background:transparent;color:var(--ink);border:1.5px solid rgba(42,27,38,0.15);font-weight:600;font-size:14px;border-radius:100px;transition:all 0.25s}
.btn-outline:hover{border-color:var(--ink);background:var(--ink);color:#fff}
.hero-photo{width:100%;aspect-ratio:4/5;border-radius:24px;overflow:hidden;box-shadow:0 30px 60px -20px rgba(135,33,117,0.2)}
.hero-photo img{width:100%;height:100%;object-fit:cover}

.about{padding:100px 40px;max-width:1000px;margin:0 auto;text-align:center}
.about .section-tag{display:inline-block;font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;color:var(--purple);margin-bottom:16px}
.about h2{font-family:var(--serif);font-size:clamp(2rem,4vw,3rem);font-weight:500;line-height:1.15;margin-bottom:24px}
.about p{font-size:17px;color:var(--gray);line-height:1.7;max-width:680px;margin:0 auto}
.about-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:40px;max-width:700px;margin:56px auto 0;padding-top:48px;border-top:1px solid rgba(135,33,117,0.1)}
.stat-num{font-family:var(--serif);font-size:36px;color:var(--purple);font-weight:600;line-height:1}
.stat-label{font-size:12px;color:var(--gray);letter-spacing:0.05em;margin-top:8px}

.categories{padding:80px 40px;background:var(--cream)}
.cat-inner{max-width:1100px;margin:0 auto}
.cat-header{text-align:center;margin-bottom:48px}
.cat-header h2{font-family:var(--serif);font-size:clamp(1.8rem,3.5vw,2.6rem);font-weight:500}
.cat-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.cat-item{background:#fff;padding:28px 20px;border-radius:16px;text-align:center;border:1px solid rgba(135,33,117,0.06);transition:all 0.3s}
.cat-item:hover{transform:translateY(-4px);border-color:var(--purple);box-shadow:0 12px 32px rgba(135,33,117,0.08)}
.cat-emoji{font-size:36px;margin-bottom:12px;display:block;filter:grayscale(0.1)}
.cat-item h3{font-family:var(--serif);font-size:16px;font-weight:500;margin-bottom:4px}
.cat-item p{font-size:12px;color:var(--gray)}

.info{padding:100px 40px;max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center}
.info-visual{aspect-ratio:4/3;background:linear-gradient(135deg,var(--purple),var(--green));border-radius:24px;display:flex;align-items:center;justify-content:center;padding:40px;color:#fff;position:relative;overflow:hidden}
.info-visual::before{content:'';position:absolute;top:-50px;right:-50px;width:250px;height:250px;background:radial-gradient(circle,rgba(255,255,255,0.2),transparent 70%);border-radius:50%}
.info-visual-content{position:relative;z-index:1;text-align:center}
.info-visual-tag{font-size:11px;font-weight:700;letter-spacing:0.2em;text-transform:uppercase;margin-bottom:12px;opacity:0.85}
.info-visual h3{font-family:var(--serif);font-size:28px;font-weight:500;margin-bottom:8px}
.info-visual p{font-size:14px;opacity:0.9}
.info-text .section-tag{color:var(--purple);font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:16px;display:inline-block}
.info-text h2{font-family:var(--serif);font-size:clamp(1.8rem,3vw,2.4rem);font-weight:500;line-height:1.15;margin-bottom:20px}
.info-grid{display:grid;gap:16px;margin-top:24px}
.info-item{display:flex;gap:14px;align-items:flex-start}
.info-item-icon{width:36px;height:36px;background:rgba(135,33,117,0.08);color:var(--purple);border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.info-item-text{font-size:14px;line-height:1.6}
.info-item-text strong{display:block;color:var(--ink);font-weight:600;margin-bottom:2px}
.info-item-text span{color:var(--gray)}

.cta{padding:80px 40px 120px;background:var(--ink);color:#fff;text-align:center;position:relative;overflow:hidden}
.cta::before{content:'';position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:500px;height:500px;background:radial-gradient(circle,rgba(135,33,117,0.3),transparent 60%);border-radius:50%}
.cta-inner{position:relative;z-index:1;max-width:700px;margin:0 auto}
.cta .section-tag{color:var(--green-light);font-size:11px;font-weight:700;letter-spacing:0.25em;text-transform:uppercase;margin-bottom:16px;display:inline-block}
.cta h2{font-family:var(--serif);font-size:clamp(2rem,4vw,3rem);font-weight:500;margin-bottom:16px}
.cta p{font-size:16px;opacity:0.7;margin-bottom:32px}
.cta .btn-primary{background:#fff;color:var(--ink)}
.cta .btn-primary:hover{background:var(--cream);color:var(--purple)}

footer{padding:32px 40px 70px;background:var(--ink);color:rgba(255,255,255,0.5);text-align:center;font-size:12px}

@media(max-width:900px){
  nav{padding:0 20px;height:64px}.nav-links{display:none}
  .hero{padding:50px 20px 80px}.hero-inner{grid-template-columns:1fr;gap:32px}
  .about{padding:60px 20px}.about-stats{grid-template-columns:1fr;gap:20px}
  .categories{padding:60px 20px}.cat-grid{grid-template-columns:repeat(2,1fr)}
  .info{padding:60px 20px;grid-template-columns:1fr;gap:32px}
  .cta{padding:60px 20px 100px}
  body::after{font-size:60px}
}
</style>
</head>
<body>

<a href="https://webconceptor.fr" class="wc-home-btn" title="Retour WebConceptor">
  <span class="wc-home-btn-logo">W</span>
  <span>WebConceptor</span>
</a>
<div class="wc-demo-badge">Maquette</div>

<div class="top-strip">Arrivage de la semaine : fruits de saison · fromages régionaux · spécialités</div>

<nav>
  <div class="logo">
    <span class="logo-badge">Proxi</span>
    <span class="logo-name">${escape(prospect.name)}</span>
  </div>
  <ul class="nav-links">
    <li><a href="#propos">À propos</a></li>
    <li><a href="#categories">Rayons</a></li>
    <li><a href="#info">Nous trouver</a></li>
  </ul>
  <a href="#info" class="nav-cta">Nous contacter</a>
</nav>

<section class="hero">
  <div class="hero-inner">
    <div>
      <div class="hero-tag"><span class="dot"></span>Votre commerce de proximité${cityStr ? " &middot; " + cityStr : ""}</div>
      <h1>${escape(content.heroTitle)}</h1>
      <p>${escape(content.heroSubtitle)}</p>
      <div class="hero-ctas">
        <a href="#categories" class="btn-primary">Découvrir le magasin</a>
        <a href="#info" class="btn-outline">Horaires &amp; accès</a>
      </div>
    </div>
    <div class="hero-photo">
      <img src="${photo}" alt="${escape(prospect.name)}" loading="lazy">
    </div>
  </div>
</section>

<section id="propos" class="about">
  <span class="section-tag">Le magasin</span>
  <h2>${escape(prospect.name)}</h2>
  <p>${escape(content.aboutText)}</p>
  ${prospect.google_rating ? `
  <div class="about-stats">
    <div><div class="stat-num">${prospect.google_rating.toFixed(1)}/5</div><div class="stat-label">Note Google</div></div>
    <div><div class="stat-num">${prospect.google_reviews_count || 0}</div><div class="stat-label">Avis clients</div></div>
    <div><div class="stat-num">6j/7</div><div class="stat-label">Ouvert</div></div>
  </div>` : ""}
</section>

<section id="categories" class="categories">
  <div class="cat-inner">
    <div class="cat-header">
      <h2>Nos rayons</h2>
    </div>
    <div class="cat-grid">
      <div class="cat-item"><span class="cat-emoji">🧀</span><h3>Fromagerie</h3><p>Sélection locale</p></div>
      <div class="cat-item"><span class="cat-emoji">🥖</span><h3>Boulangerie</h3><p>Pain &amp; pâtisseries</p></div>
      <div class="cat-item"><span class="cat-emoji">🥩</span><h3>Boucherie</h3><p>Viandes sélectionnées</p></div>
      <div class="cat-item"><span class="cat-emoji">🍎</span><h3>Fruits &amp; Légumes</h3><p>De saison</p></div>
      <div class="cat-item"><span class="cat-emoji">🍷</span><h3>Cave à vins</h3><p>Vins &amp; spiritueux</p></div>
      <div class="cat-item"><span class="cat-emoji">🧺</span><h3>Épicerie</h3><p>Produits du quotidien</p></div>
      <div class="cat-item"><span class="cat-emoji">🥤</span><h3>Boissons</h3><p>Jus, sodas, eaux</p></div>
      <div class="cat-item"><span class="cat-emoji">🧼</span><h3>Entretien</h3><p>Maison &amp; hygiène</p></div>
    </div>
  </div>
</section>

<section id="info" class="info">
  <div class="info-visual">
    <div class="info-visual-content">
      <div class="info-visual-tag">Venez nous voir</div>
      <h3>À deux pas de chez vous</h3>
      <p>Un accueil chaleureux, des produits choisis</p>
    </div>
  </div>
  <div class="info-text">
    <span class="section-tag">Informations pratiques</span>
    <h2>Votre magasin${cityStr ? ` à ${cityStr}` : ""}</h2>
    <div class="info-grid">
      ${addressStr ? `<div class="info-item"><div class="info-item-icon">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"/></svg>
      </div><div class="info-item-text"><strong>Adresse</strong><span>${addressStr}</span></div></div>` : ""}
      ${phoneStr ? `<div class="info-item"><div class="info-item-icon">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
      </div><div class="info-item-text"><strong>Téléphone</strong><span>${phoneStr}</span></div></div>` : ""}
      ${websiteStr ? `<div class="info-item"><div class="info-item-icon">
        <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418"/></svg>
      </div><div class="info-item-text"><strong>Site actuel</strong><span>${websiteStr}</span></div></div>` : ""}
    </div>
  </div>
</section>

<section class="cta">
  <div class="cta-inner">
    <span class="section-tag">Rencontrons-nous</span>
    <h2>À très vite, au magasin</h2>
    <p>L&rsquo;équipe vous accueille avec le sourire.</p>
    <a href="#info" class="btn-primary">Voir nos horaires</a>
  </div>
</section>

<footer>&copy; 2026 — Maquette générée par WebConceptor</footer>

<div class="wc-watermark">
  Maquette conçue par <strong>WEBCONCEPTOR</strong> &middot;
  <a href="https://webconceptor.fr" target="_blank">webconceptor.fr</a> &middot;
  Toute reproduction interdite
</div>

</body>
</html>`;
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
        sender: { name: "WebConceptor", email: "contact@webconceptor.fr" },
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
      body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML", disable_web_page_preview: true }),
    });
  } catch { /* silent */ }
}

function buildEmailBody(prospect: Prospect, content: PersonalizedContent, mockupUrl: string): string {
  return `<div style="font-family:'Inter',system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0a0a0a;line-height:1.6">
  <p style="font-size:15px;margin-bottom:16px">${escape(content.emailOpening)}</p>
  <p style="font-size:15px;margin-bottom:16px">${escape(content.emailPitch)}</p>
  <div style="background:#fafafa;border-left:3px solid #872175;padding:20px;margin:24px 0;border-radius:6px">
    <p style="font-size:13px;color:#525252;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.1em;font-weight:700">Votre maquette est prête</p>
    <p style="font-size:18px;font-weight:700;color:#0a0a0a;margin-bottom:16px">${escape(prospect.name)}</p>
    <a href="${mockupUrl}" style="display:inline-block;padding:12px 24px;background:#0066ff;color:#fff;text-decoration:none;border-radius:100px;font-weight:600;font-size:14px">Voir ma maquette →</a>
  </div>
  <p style="font-size:14px;color:#525252;margin-bottom:16px"><strong>Ce qu&rsquo;elle contient</strong> :</p>
  <ul style="font-size:14px;color:#525252;padding-left:20px;margin-bottom:20px">
    <li>Une page d&rsquo;accueil avec vos infos</li>
    <li>Une section rayons &amp; produits</li>
    <li>Vos horaires, adresse et contact</li>
    <li>Un design responsive (PC, tablette, téléphone)</li>
  </ul>
  <p style="font-size:14px;color:#525252;margin-bottom:12px">Si la maquette vous convient, nous la livrons en 5 jours pour <strong>599&nbsp;€</strong>. Vous pouvez aussi choisir l&rsquo;option <strong>Sérénité</strong> (50&nbsp;€/mois) pour que nous mettions à jour votre site chaque semaine (promos, arrivages, actualités).</p>
  <p style="font-size:14px;color:#525252;margin-bottom:24px">Répondez simplement à cet email si vous êtes intéressé ou si vous voulez des modifications.</p>

  <div style="background:#f8f9fa;border-left:3px solid #0066ff;padding:18px 20px;margin:24px 0;border-radius:6px">
    <p style="font-size:14px;color:#0a0a0a;margin-bottom:10px;font-weight:600">Une question ? Contactez-moi directement :</p>
    <p style="font-size:14px;color:#525252;margin-bottom:6px">📧 <a href="mailto:contact@webconceptor.fr" style="color:#0066ff;text-decoration:none"><strong>contact@webconceptor.fr</strong></a></p>
    <p style="font-size:14px;color:#525252;margin-bottom:10px">📞 <a href="tel:+33635592471" style="color:#0066ff;text-decoration:none"><strong>06 35 59 24 71</strong></a></p>
    <p style="font-size:13px;color:#737373;margin:0;font-style:italic">Merci de vous présenter avec le nom de votre commerce (<strong style="color:#0a0a0a">${escape(prospect.name)}</strong>) pour que je retrouve votre dossier rapidement.</p>
  </div>

  <div style="border-top:1px solid #e5e5e5;padding-top:20px;font-size:13px;color:#737373">
    <p style="margin-bottom:4px"><strong style="color:#0a0a0a">Tom Bauer</strong></p>
    <p style="margin-bottom:4px">Fondateur, WebConceptor</p>
    <p style="margin-bottom:2px">contact@webconceptor.fr &middot; 06 35 59 24 71</p>
    <p><a href="https://webconceptor.fr" style="color:#0066ff;text-decoration:none">webconceptor.fr</a></p>
  </div>
  <p style="font-size:11px;color:#a3a3a3;margin-top:24px;border-top:1px solid #f5f5f5;padding-top:16px">Vous recevez cet email car votre commerce est référencé publiquement sur Google. Pour ne plus être contacté, répondez simplement avec le mot STOP.</p>
</div>`;
}

function buildRestaurantEmailBody(prospect: Prospect, content: RestaurantContent, mockupUrl: string): string {
  return `<div style="font-family:'Inter',system-ui,sans-serif;max-width:600px;margin:0 auto;padding:32px;color:#1a1310;line-height:1.6;background:#fdfaf5">
  <p style="font-size:15px;margin-bottom:16px">${escape(content.emailOpening)}</p>
  <p style="font-size:15px;margin-bottom:20px">${escape(content.emailPitch)}</p>

  <div style="background:#fff;border:1px solid #e8dfd0;padding:28px;margin:24px 0;border-radius:4px;text-align:center">
    <p style="font-size:12px;color:#8b7e6e;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.15em;font-weight:600">Votre maquette</p>
    <p style="font-family:Georgia,serif;font-size:24px;font-weight:500;color:#1a1310;margin-bottom:6px">${escape(prospect.name)}</p>
    ${prospect.city ? `<p style="font-size:13px;color:#8b7e6e;margin-bottom:20px;font-style:italic">${escape(prospect.city)}</p>` : ""}
    <a href="${mockupUrl}" style="display:inline-block;padding:14px 32px;background:#c19a56;color:#fff;text-decoration:none;border-radius:2px;font-weight:600;font-size:13px;letter-spacing:0.15em;text-transform:uppercase">Découvrir ma maquette →</a>
  </div>

  <p style="font-size:14px;color:#4a4340;margin-bottom:12px"><strong style="color:#1a1310">Ce que votre site inclut :</strong></p>
  <ul style="font-size:14px;color:#4a4340;padding-left:20px;margin-bottom:20px">
    <li><strong>Page d'accueil premium</strong> avec photos et ambiance</li>
    <li><strong>Carte complète</strong> avec entrées, plats et desserts</li>
    <li style="color:#c19a56;font-weight:600">Système de réservation en ligne intégré (le client choisit sa date, son heure, le nombre de couverts)</li>
    <li>Galerie d'ambiance et informations pratiques</li>
    <li>Design responsive mobile, tablette, ordinateur</li>
  </ul>

  <div style="background:#1a1310;color:#f9f5ef;padding:24px;border-radius:4px;margin:24px 0">
    <p style="font-size:13px;color:#c19a56;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.15em;font-weight:600">Votre espace admin</p>
    <p style="font-size:14px;line-height:1.7;color:rgba(249,245,239,0.9)">Chaque réservation vous arrive par email + notification. Vous confirmez d'un clic. Un tableau de bord privé vous permet de voir vos réservations à venir, modifier la carte en 2 minutes, et suivre la fréquentation.</p>
  </div>

  <p style="font-size:14px;color:#4a4340;margin-bottom:16px">Tarif clair : <strong>599 € HT</strong> pour la mise en ligne complète (livraison 5 jours). Option <strong>Sérénité 50 €/mois</strong> incluant hébergement, mises à jour de la carte, modifications illimitées.</p>

  <p style="font-size:14px;color:#4a4340;margin-bottom:24px">Répondez simplement à cet email si vous souhaitez discuter ou modifier quelque chose sur la maquette.</p>

  <div style="background:#fff;border-left:3px solid #c19a56;padding:20px 24px;margin:24px 0;border-radius:4px">
    <p style="font-size:14px;color:#1a1310;margin-bottom:12px;font-weight:600">Une question ? Contactez-moi directement :</p>
    <p style="font-size:14px;color:#4a4340;margin-bottom:6px">📧 <a href="mailto:contact@webconceptor.fr" style="color:#c19a56;text-decoration:none"><strong>contact@webconceptor.fr</strong></a></p>
    <p style="font-size:14px;color:#4a4340;margin-bottom:12px">📞 <a href="tel:+33635592471" style="color:#c19a56;text-decoration:none"><strong>06 35 59 24 71</strong></a></p>
    <p style="font-size:13px;color:#8b7e6e;margin:0;font-style:italic">Merci de vous présenter avec le nom de votre restaurant (<strong style="color:#1a1310">${escape(prospect.name)}</strong>) pour que je retrouve votre dossier rapidement.</p>
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

  const raw = await req.json().catch(() => ({}));

  // Validate + clamp inputs
  const prospect_id = typeof raw.prospect_id === "string" && /^[0-9a-f-]{10,64}$/i.test(raw.prospect_id)
    ? raw.prospect_id
    : null;
  const batch_size = Math.max(1, Math.min(50, Number.isFinite(Number(raw.batch_size)) ? Number(raw.batch_size) : 5));
  const dry_run = Boolean(raw.dry_run);

  const supabase = getSupabaseAdmin();
  let prospects: Prospect[] = [];

  if (prospect_id) {
    const { data } = await supabase.from("prospects").select("*").eq("id", prospect_id).limit(1);
    if (data) prospects = data as Prospect[];
  } else {
    const { data } = await supabase
      .from("prospects")
      .select("*")
      .eq("status", "found")
      .not("email", "is", null)
      .order("created_at", { ascending: true }) // oldest first → pas de prospect oublié
      .limit(batch_size);
    if (data) prospects = data as Prospect[];
  }

  if (prospects.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun prospect à traiter" });
  }

  // The email link must always point to the real site — never trust the Origin
  // header (an attacker with the admin key could otherwise craft phishing links).
  const origin = "https://webconceptor.fr";
  const results: Array<{ id: string; name: string; status: string; error?: string }> = [];

  for (const p of prospects) {
    if (!p.email) {
      results.push({ id: p.id, name: p.name, status: "no_email" });
      continue;
    }

    try {
      // Branch by business_type
      const isRestaurant = p.business_type === "restaurant";
      const mockupUrl = `${origin}/prospects/${p.slug}`;

      let html: string;
      let emailBody: string;
      let emailSubject: string;

      if (isRestaurant) {
        const restoContent = await personalizeRestaurantWithClaude(p);
        const restoProspect: RestaurantProspect = {
          id: p.id, slug: p.slug, name: p.name,
          city: p.city, address: p.address, phone: p.phone,
          website: p.website, email: p.email,
          google_rating: p.google_rating, google_reviews_count: p.google_reviews_count,
          photos: p.photos, hours: p.hours,
        };
        html = generateRestaurantMockupHtml(restoProspect, restoContent, origin);
        emailBody = buildRestaurantEmailBody(p, restoContent, mockupUrl);
        emailSubject = restoContent.emailSubject;
      } else {
        const content = await personalizeWithClaude(p);
        html = generateMockupHtml(p, content, origin);
        emailBody = buildEmailBody(p, content, mockupUrl);
        emailSubject = content.emailSubject;
      }

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
        const ok = await sendEmail(p.email, p.name, emailSubject, emailBody);
        if (!ok) {
          await supabase
            .from("prospects")
            .update({ status: "error", error: "Brevo send failed" })
            .eq("id", p.id);
          results.push({ id: p.id, name: p.name, status: "error", error: "Brevo failed" });
          continue;
        }

        if (isRestaurant) {
          // Rich restaurant notif with cuisine + talking points for phone follow-up
          const restoContent = await personalizeRestaurantWithClaude(p);
          const talkingPointsTxt = restoContent.talkingPoints
            .slice(0, 5)
            .map((t, i) => `${i + 1}. ${escapeTelegram(t)}`)
            .join("\n");
          await notifyTelegram(
            `🍽️ <b>Restaurant contacté</b>\n\n` +
            `<b>${escapeTelegram(p.name)}</b>\n` +
            `📍 ${escapeTelegram(p.address || p.city || "?")}\n` +
            `📞 <b>${escapeTelegram(p.phone || "pas de tél")}</b>\n` +
            `✉️ ${escapeTelegram(p.email)}\n` +
            `🍴 ${escapeTelegram(restoContent.cuisineType)}\n` +
            `⭐ ${p.google_rating ? escapeTelegram(String(p.google_rating)) : "?"}/5 (${p.google_reviews_count || 0} avis)\n\n` +
            `<b>💬 Grandes lignes pour l'appel :</b>\n${talkingPointsTxt}\n\n` +
            `<a href="${escapeTelegram(mockupUrl)}">→ Voir la maquette</a>`
          );
        } else {
          // Compact épicerie notif
          await notifyTelegram(
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
    results,
  });
}
