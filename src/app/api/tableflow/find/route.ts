import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   TableFlow — Find restaurants + menu réel
   Stratégie : homepage → page "Carte/Menu" → LLM extract
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

/* ─── Google Places ──────────────────────────────────────────────────────── */
async function searchRestaurants(query: string, apiKey: string) {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": [
        "places.id", "places.displayName", "places.formattedAddress",
        "places.nationalPhoneNumber", "places.websiteUri",
        "places.rating", "places.userRatingCount",
        "places.regularOpeningHours", "places.photos",
        "places.primaryTypeDisplayName", "places.editorialSummary",
        "places.reviews",
      ].join(","),
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "fr",
      maxResultCount: 20,
    }),
    signal: AbortSignal.timeout(12000),
  });
  if (!res.ok) return [];
  const data = await res.json();
  return data.places || [];
}

async function getPlacePhotoUrl(photoName: string, apiKey: string): Promise<string> {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${apiKey}`;
}

/* ─── Scraping : trouve la page menu du restaurant ───────────────────────── */
const MENU_LINK_PATTERNS = [
  /\/(menu|carte|nos-plats|notre-carte|plats|food|dishes|speisekarte|repas|restauration|dining|eat)/i,
  /menu|carte|plats|food|dining/i,
];

async function fetchPage(url: string, timeoutMs = 7000): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "fr-FR,fr;q=0.9",
      },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return "";
    return await res.text();
  } catch {
    return "";
  }
}

function extractLinks(html: string, baseUrl: string): string[] {
  const links: string[] = [];
  const regex = /href="([^"#?]+)"/gi;
  let m;
  while ((m = regex.exec(html)) !== null) {
    try {
      const full = new URL(m[1], baseUrl).toString();
      if (full.startsWith(baseUrl.split("/").slice(0, 3).join("/"))) {
        links.push(full);
      }
    } catch { /* skip */ }
  }
  return [...new Set(links)];
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
    .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
    .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ").replace(/&#[0-9]+;/g, " ")
    .replace(/\s{3,}/g, "  ")
    .trim();
}

async function findMenuPage(websiteUrl: string): Promise<string> {
  const homepage = await fetchPage(websiteUrl, 8000);
  if (!homepage) return "";

  const links = extractLinks(homepage, websiteUrl);

  // Cherche un lien vers la page menu/carte
  for (const pattern of MENU_LINK_PATTERNS) {
    const menuLink = links.find((l) => pattern.test(l));
    if (menuLink && menuLink !== websiteUrl) {
      const menuPage = await fetchPage(menuLink, 7000);
      if (menuPage) return menuPage;
    }
  }

  // Fallback : retourner la homepage si elle contient des prix
  const hasPrices = /\d+[,\.]\d*\s*[€$£]|\b\d{1,2}\s*[€$£]/.test(homepage);
  return hasPrices ? homepage : "";
}

/* ─── LLM : extrait les plats d'une page ────────────────────────────────── */
interface MenuItem {
  name: string;
  description: string;
  price: string;
  category: string;
}

async function extractMenuWithLLM(pageText: string, restaurantName: string, orKey: string): Promise<MenuItem[]> {
  const cleaned = pageText.slice(0, 5000);

  const prompt = `Tu es un expert en extraction de données de restaurants.
Extrais TOUS les plats du menu de "${restaurantName}" depuis ce texte.

RÈGLES STRICTES :
- name : nom exact du plat (tel qu'écrit, garde les accents et la casse)
- description : description courte si présente, sinon ""
- price : prix en chiffres uniquement ex: "14,50" — "" si absent
- category : "Entrées" | "Plats" | "Desserts" | "Boissons" | "Pizzas" | "Formules" | "Vins" | "Tapas" | "Salades" | catégorie exacte trouvée
- Si le texte ne contient pas de menu clair, réponds []
- NE PAS inventer de plats, uniquement ce qui est dans le texte
- Max 50 plats

Réponds UNIQUEMENT avec du JSON valide, aucun markdown, aucun commentaire.
Format : [{"name":"...","description":"...","price":"...","category":"..."}]

Texte :
${cleaned}`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${orKey}`,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-v4-flash:free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 2000,
        temperature: 0.1,
      }),
      signal: AbortSignal.timeout(20000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "[]";
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const items = JSON.parse(match[0]);
    if (!Array.isArray(items)) return [];
    // Filtre les plats avec un nom valide
    return items
      .filter((x: Partial<MenuItem>) => x.name && typeof x.name === "string" && x.name.length > 1)
      .map((x: Partial<MenuItem>) => ({
        name: String(x.name || "").trim().slice(0, 80),
        description: String(x.description || "").trim().slice(0, 200),
        price: String(x.price || "").replace(/[^0-9,\.]/g, "").trim(),
        category: String(x.category || "Carte").trim(),
      }));
  } catch {
    return [];
  }
}

/* ─── Menu de secours par cuisine — très détaillé ────────────────────────── */
function getFallbackMenu(cuisineType: string): MenuItem[] {
  const t = cuisineType.toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "");

  if (/pizza|pizz|ital/.test(t)) return [
    { name: "Margherita", description: "Sauce tomate maison, mozzarella fior di latte, basilic frais", price: "12", category: "Pizzas" },
    { name: "Quattro Formaggi", description: "Mozzarella, gorgonzola, chèvre, parmesan affiné", price: "14,50", category: "Pizzas" },
    { name: "Diavola", description: "Sauce tomate, mozzarella, salami piquant, olives noires", price: "13,50", category: "Pizzas" },
    { name: "Calzone Maison", description: "Farcie jambon cuit, champignons, mozzarella, sauce tomate", price: "14", category: "Pizzas" },
    { name: "Burrata & Tomates Anciennes", description: "Burrata crémeuse, tomates de saison, huile d'olive, basilic", price: "11", category: "Entrées" },
    { name: "Tiramisu Traditionnel", description: "Mascarpone, biscuits à la cuillère, café fort, cacao amer", price: "7,50", category: "Desserts" },
    { name: "Panna Cotta", description: "Coulis de fruits rouges du moment", price: "6,50", category: "Desserts" },
  ];

  if (/burger|fast|snack|americ/.test(t)) return [
    { name: "Classic Smash Burger", description: "Double steak haché 2×90g, cheddar fondu, sauce burger maison, cornichons", price: "13,50", category: "Burgers" },
    { name: "BBQ Bacon Crispy", description: "Steak 180g, bacon croustillant, oignons confits, sauce BBQ fumée", price: "15,50", category: "Burgers" },
    { name: "Le Végétalien", description: "Galette quinoa-pois chiches, avocat, roquette, sauce tahini", price: "13", category: "Burgers" },
    { name: "Frites Fraîches Maison", description: "Coupées à la main, fleur de sel, sauce aïoli", price: "4,50", category: "Accompagnements" },
    { name: "Onion Rings", description: "Panés à la bière, sauce ranch maison", price: "5", category: "Accompagnements" },
    { name: "Cheese Cake New-Yorkais", description: "Biscuit spéculoos, coulis fraises", price: "6,50", category: "Desserts" },
  ];

  if (/japonais|sushi|japan|ramen|asiat/.test(t)) return [
    { name: "Plateau Sushi 12 pièces", description: "Saumon, thon, crevette, avocat — riz vinaigré maison", price: "18", category: "Sushis" },
    { name: "Ramen Tonkotsu", description: "Bouillon de porc mijoté 12h, poitrine de porc, œuf mollet, nori", price: "16,50", category: "Ramens" },
    { name: "Gyozas Maison (6 pcs)", description: "Porc et ciboulette, sauce ponzu, huile de sésame grillé", price: "9", category: "Entrées" },
    { name: "Tataki de Saumon", description: "Saumon mi-cuit, sauce yuzu-gingembre, sésame noir", price: "13", category: "Entrées" },
    { name: "Mochi Glacé (3 pcs)", description: "Matcha, vanille et framboise", price: "7", category: "Desserts" },
  ];

  if (/libanais|liban|orient|kebab|grec/.test(t)) return [
    { name: "Houmous Maison", description: "Pois chiches, tahini, citron, paprika fumé, huile d'olive", price: "8", category: "Mezze" },
    { name: "Falafels Croustillants", description: "Pois chiches et herbes fraîches, sauce yaourt-menthe", price: "10,50", category: "Mezze" },
    { name: "Assiette Mixte Grillades", description: "Brochette d'agneau, poulet mariné, kefta, riz pilaf, salade", price: "19,50", category: "Plats" },
    { name: "Chawarma Poulet", description: "Marinade maison, pain pita, légumes croquants, sauce ail", price: "13", category: "Plats" },
    { name: "Baklava Maison", description: "Pâte filo, pistaches de Bronte, sirop d'eau de rose", price: "5,50", category: "Desserts" },
  ];

  if (/crepe|breton|galette/.test(t)) return [
    { name: "Galette Complète", description: "Jambon blanc, emmental râpé, œuf fermier bio, beurre breton", price: "9,50", category: "Galettes salées" },
    { name: "Galette Forestière", description: "Champignons des bois, crème fraîche, comté 18 mois, ail", price: "11", category: "Galettes salées" },
    { name: "Galette Andouille-Pomme", description: "Andouille de Guémené, pomme fondante, camembert, miel", price: "12", category: "Galettes salées" },
    { name: "Crêpe Beurre-Sucre", description: "Beurre demi-sel AOP Charentes, sucre cristal", price: "4", category: "Crêpes sucrées" },
    { name: "Crêpe Caramel Beurre Salé", description: "Caramel artisanal breton, amandes effilées grillées", price: "7", category: "Crêpes sucrées" },
    { name: "Cidre Breton Brut IGP", description: "Producteur local, servi en bolée", price: "5,50", category: "Boissons" },
  ];

  if (/brasserie|bistrot|bistro/.test(t)) return [
    { name: "Œuf Parfait Truffé", description: "Crème de champignons, mouillettes grillées, copeaux de truffe", price: "13", category: "Entrées" },
    { name: "Terrine de Campagne Maison", description: "Porc et herbes, cornichons, pain de campagne grillé", price: "10", category: "Entrées" },
    { name: "Entrecôte 300g Frites Maison", description: "Beurre maître d'hôtel, frites taillées à la main, sauce au choix", price: "28", category: "Plats" },
    { name: "Tartare de Bœuf au Couteau", description: "Câpres, échalotes, cornichons, moutarde — frites fraîches", price: "19,50", category: "Plats" },
    { name: "Moules de Bouchot Marinières", description: "Beurre blanc, crème, frites maison, cidre breton", price: "17", category: "Plats" },
    { name: "Risotto aux Champignons des Bois", description: "Parmesan 24 mois, persil plat, huile de truffe blanche", price: "18", category: "Plats" },
    { name: "Crème Brûlée Vanille Bourbon", description: "Caramel caramélisé à la flamme, vanille de Madagascar", price: "9", category: "Desserts" },
    { name: "Fondant au Chocolat Coulant", description: "Cœur coulant Valrhona 70%, glace vanille bourbon", price: "9,50", category: "Desserts" },
    { name: "Côtes du Rhône — verre", description: "Domaine de la Janasse, rouge charnu et équilibré", price: "7", category: "Vins" },
  ];

  if (/gastrono|gastro|bistr/.test(t)) return [
    { name: "Saint-Jacques Poêlées", description: "Fondue de poireaux, beurre noisette, émulsion au champagne", price: "22", category: "Entrées" },
    { name: "Foie Gras de Canard Maison", description: "Chutney figues-porto, brioche toastée, fleur de sel", price: "19", category: "Entrées" },
    { name: "Filet de Bar Sauvage", description: "Risotto citronné, fumet de homard réduit, micro-herbes", price: "34", category: "Plats" },
    { name: "Magret de Canard des Landes", description: "Jus au miel et thym, écrasé de pomme de terre à la truffe", price: "32", category: "Plats" },
    { name: "Ris de Veau Doré au Beurre", description: "Morilles en crème, tagliatelles fraîches maison", price: "36", category: "Plats" },
    { name: "Paris-Brest à la Noisette", description: "Craquelin, praliné noisette maison, éclats de noisette", price: "12", category: "Desserts" },
    { name: "Soufflé au Chocolat Grand Cru", description: "Valrhona Guanaja 70%, sauce crème anglaise vanille", price: "13", category: "Desserts" },
  ];

  // Restaurant français générique — plats typiques et bien nommés
  return [
    { name: "Salade de Lentilles du Puy", description: "Lardons fumés, œuf poché, vinaigrette moutarde à l'ancienne", price: "10,50", category: "Entrées" },
    { name: "Velouté de Légumes du Marché", description: "Selon arrivage, crème fraîche, croûtons maison", price: "8,50", category: "Entrées" },
    { name: "Terrine de Foie de Volaille", description: "Recette maison, chutney abricot-gingembre, pain de campagne", price: "10", category: "Entrées" },
    { name: "Filet de Saumon Grillé", description: "Écrasé de pommes de terre, beurre blanc citronnée, câpres", price: "22", category: "Plats" },
    { name: "Magret de Canard Rôti", description: "Sauce aux cerises et au Porto, gratin dauphinois", price: "26", category: "Plats" },
    { name: "Suprême de Volaille Fermière", description: "Jus de cuisson réduit, légumes de saison, purée maison", price: "20", category: "Plats" },
    { name: "Côte de Porc Ibérique", description: "Marinade herbes et citron, frites fraîches, sauce chimichurri", price: "23", category: "Plats" },
    { name: "Tarte Tatin Caramel", description: "Pommes fondantes, pâte feuilletée beurre, chantilly maison", price: "8,50", category: "Desserts" },
    { name: "Moelleux au Chocolat", description: "Cœur fondant Valrhona, glace vanille artisanale", price: "9", category: "Desserts" },
    { name: "Café Gourmand", description: "Expresso double + 3 mignardises maison du moment", price: "6,50", category: "Desserts" },
  ];
}

/* ─── Extraction email depuis website ────────────────────────────────────── */
async function extractEmail(url: string): Promise<string | null> {
  try {
    const html = await fetchPage(url, 6000);
    if (!html) return null;
    const matches = html.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g) || [];
    const filtered = matches
      .map((e) => e.toLowerCase())
      .filter((e) =>
        !e.includes("example") && !e.includes("sentry") &&
        !e.includes("@2x") && !e.includes(".png") &&
        !e.includes("wixpress") && !e.includes("squarespace") &&
        !e.startsWith("no-reply") && !e.startsWith("noreply")
      );
    return filtered[0] || null;
  } catch {
    return null;
  }
}

/* ─── Handler ────────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const query: string = (body.query || "restaurant").slice(0, 200);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const orKey  = process.env.OPENROUTER_API_KEY;

  if (!apiKey) return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY manquant" }, { status: 500 });

  const supabase = getSupabaseAdmin();
  const stats = { found: 0, inserted: 0, skippedDuplicate: 0, withEmail: 0, withRealMenu: 0 };
  const log: string[] = [];

  const places = await searchRestaurants(query, apiKey);
  stats.found = places.length;
  log.push(`[find] "${query}" → ${places.length} places`);

  for (const place of places) {
    const name: string = place.displayName?.text || "";
    if (!name) continue;

    const website: string = place.websiteUri || "";
    const phone: string   = place.nationalPhoneNumber || "";
    const address: string = place.formattedAddress || "";
    const rating: number  = place.rating || 0;
    const reviewCount: number = place.userRatingCount || 0;
    const cuisineType: string = place.primaryTypeDisplayName?.text || "Restaurant";
    const editorial: string = place.editorialSummary?.text || "";

    // Heures
    let hours = "";
    if (place.regularOpeningHours?.weekdayDescriptions) {
      const days = place.regularOpeningHours.weekdayDescriptions as string[];
      hours = days.slice(0, 2).join(" · ");
    }

    // Photos
    const photos: string[] = [];
    for (const ph of (place.photos || []).slice(0, 6)) {
      if (ph.name) photos.push(await getPlacePhotoUrl(ph.name, apiKey));
    }

    // Slug
    const city = address.split(",").slice(-2, -1)[0]?.trim() || "";
    const baseSlug = slugify(`${name}-${city}`).slice(0, 55);
    const slug = baseSlug || slugify(name).slice(0, 55) || place.id?.slice(0, 20) || "r";

    // Doublon ?
    const { data: existing } = await supabase
      .from("tableflow_prospects")
      .select("id")
      .or(`slug.eq.${slug},name.eq.${name}`)
      .maybeSingle();
    if (existing) { stats.skippedDuplicate++; continue; }

    // Email
    let email: string | null = null;
    if (website) email = await extractEmail(website);
    if (email) stats.withEmail++;

    // MENU — essaie de scraper la vraie carte
    let menuItems: MenuItem[] = [];
    let menuSource = "fallback";

    if (website && orKey) {
      try {
        const menuPage = await findMenuPage(website);
        if (menuPage) {
          const text = stripHtml(menuPage);
          const extracted = await extractMenuWithLLM(text, name, orKey);
          if (extracted.length >= 3) {
            menuItems = extracted;
            menuSource = "scraped";
            stats.withRealMenu++;
            log.push(`[find] ✓ ${name}: ${extracted.length} plats réels extraits`);
          }
        }
      } catch (err) {
        log.push(`[find] scraping ${name}: ${err instanceof Error ? err.message : "err"}`);
      }
    }

    // Fallback si scraping insuffisant
    if (menuItems.length < 3) {
      menuItems = getFallbackMenu(cuisineType);
      log.push(`[find] ${name}: menu fallback (${cuisineType})`);
    }

    // Ajoute une description générale si editorial disponible
    const { error: insertErr } = await supabase.from("tableflow_prospects").insert({
      slug,
      name,
      city,
      address,
      phone,
      website,
      email,
      google_rating: rating || null,
      google_reviews_count: reviewCount || null,
      photos: photos.length ? photos : null,
      hours: hours || null,
      cuisine_type: cuisineType,
      menu_items: menuItems,
      editorial: editorial || null,
      place_id: place.id,
      menu_source: menuSource,
      status: email ? "found" : "no_email",
    });

    if (insertErr) {
      // Colonnes custom non encore migrées → retry sans les champs optionnels
      const { error: e2 } = await supabase.from("tableflow_prospects").insert({
        slug, name, city, address, phone, website, email,
        google_rating: rating || null,
        google_reviews_count: reviewCount || null,
        photos: photos.length ? photos : null,
        hours: hours || null,
        cuisine_type: cuisineType,
        menu_items: menuItems,
        place_id: place.id,
        status: email ? "found" : "no_email",
      });
      if (e2) { log.push(`[find] ✗ insert ${name}: ${e2.message}`); continue; }
    }
    stats.inserted++;
    log.push(`[find] ✓ ${name} (email=${email || "–"}, menu=${menuSource})`);
  }

  return NextResponse.json({ success: true, stats, log });
}
