import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   TableFlow — Find restaurants
   Cherche des restaurants via Google Places, scrappe leur menu,
   et insère dans tableflow_prospects pour envoi d'email.
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

/* ─── Google Places : photos ─────────────────────────────────────────────── */
async function getPlacePhoto(photoName: string, apiKey: string): Promise<string> {
  return `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${apiKey}`;
}

/* ─── Google Places : cherche restaurants dans une ville ────────────────── */
async function searchRestaurants(query: string, apiKey: string) {
  const body = {
    textQuery: query,
    languageCode: "fr",
    maxResultCount: 20,
    locationBias: { circle: { center: { latitude: 46.603354, longitude: 1.888334 }, radius: 500000 } },
  };

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
        "places.primaryTypeDisplayName", "places.priceLevel",
        "places.editorialSummary",
      ].join(","),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(12000),
  });

  if (!res.ok) return [];
  const data = await res.json();
  return data.places || [];
}

/* ─── Scraping menu depuis le site web ───────────────────────────────────── */
async function scrapeMenuFromWebsite(url: string): Promise<Array<{
  name: string; description: string; price: string; category: string;
}>> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; TableFlow-Bot/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];

    const html = await res.text();
    // Cherche des patterns prix (ex: 12,50€ / 12.50 € / €12)
    const pricePatterns = html.match(/[\d,\.]+\s*[€$]/g) || [];
    if (pricePatterns.length < 3) return []; // Pas assez de prix → pas de menu

    // Extraction via LLM si OpenRouter disponible
    const orKey = process.env.OPENROUTER_API_KEY;
    if (!orKey) return [];

    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);

    const prompt = `Extrais les items du menu de ce restaurant depuis le texte suivant. Réponds UNIQUEMENT avec un JSON array, sans markdown.
Format: [{"name": "...", "description": "...", "price": "12,50", "category": "entrée|plat|dessert|boisson"}]
Si pas de menu clair, réponds [].

Texte: ${textContent}`;

    const llmRes = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${orKey}` },
      body: JSON.stringify({
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!llmRes.ok) return [];
    const llmData = await llmRes.json();
    const raw = llmData.choices?.[0]?.message?.content || "[]";
    // Extraire le JSON même si entouré de texte
    const match = raw.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const items = JSON.parse(match[0]);
    return Array.isArray(items) ? items.slice(0, 40) : [];
  } catch {
    return [];
  }
}

/* ─── Menu de secours par type de restaurant ─────────────────────────────── */
function getDefaultMenu(cuisineType?: string): Array<{
  name: string; description: string; price: string; category: string;
}> {
  const type = (cuisineType || "").toLowerCase();

  if (/pizza|pizz/.test(type)) return [
    { name: "Margherita", description: "Sauce tomate, mozzarella di bufala, basilic frais", price: "12", category: "Pizzas" },
    { name: "Reine", description: "Jambon blanc, champignons, mozzarella", price: "13,50", category: "Pizzas" },
    { name: "4 fromages", description: "Mozzarella, gorgonzola, chèvre, parmesan", price: "14", category: "Pizzas" },
    { name: "Calzone maison", description: "Farcie jambon, champignons, mozzarella", price: "14,50", category: "Pizzas" },
    { name: "Tiramisu", description: "Café, mascarpone, biscuits, cacao", price: "6,50", category: "Desserts" },
    { name: "Panna cotta", description: "Coulis de fruits rouges", price: "5,50", category: "Desserts" },
  ];

  if (/burger|fast|snack/.test(type)) return [
    { name: "Classic Burger", description: "Bœuf 180g, cheddar, salade, tomate, cornichons", price: "13", category: "Burgers" },
    { name: "Bacon Crispy", description: "Bœuf 180g, bacon, cheddar fondu, sauce BBQ maison", price: "15", category: "Burgers" },
    { name: "Végétalien", description: "Galette pois chiches, avocat, pousses, houmous", price: "13,50", category: "Burgers" },
    { name: "Frites maison", description: "Pommes de terre fraîches, fleur de sel", price: "4", category: "Accompagnements" },
    { name: "Cheese cake", description: "Coulis framboises maison", price: "6", category: "Desserts" },
  ];

  if (/brasserie|bistro|bistrot/.test(type)) return [
    { name: "Escargots de Bourgogne", description: "Beurre persillé, 6 pièces", price: "12", category: "Entrées" },
    { name: "Tartare de bœuf", description: "Couteau, câpres, échalotes, frites maison", price: "18", category: "Plats" },
    { name: "Entrecôte frites", description: "300g, beurre maître d'hôtel, frites fraîches", price: "26", category: "Plats" },
    { name: "Moules marinières", description: "Beurre blanc, frites, cidre breton", price: "17", category: "Plats" },
    { name: "Crème brûlée", description: "Vanille Bourbon, caramel à la flamme", price: "8", category: "Desserts" },
    { name: "Côtes du Rhône", description: "Verre 15cl, Domaine de la Janasse", price: "7", category: "Vins" },
  ];

  // Restaurant français générique
  return [
    { name: "Salade gourmande", description: "Lardons, œuf poché, croûtons, vinaigrette maison", price: "10,50", category: "Entrées" },
    { name: "Terrine maison", description: "Pain de campagne grillé, cornichons", price: "9", category: "Entrées" },
    { name: "Plat du jour", description: "Selon arrivage du marché — demandez-nous !", price: "15", category: "Plats" },
    { name: "Filet de poisson", description: "Légumes de saison, sauce vierge", price: "19", category: "Plats" },
    { name: "Pièce de bœuf", description: "Sauce au choix, frites ou légumes", price: "22", category: "Plats" },
    { name: "Fondant chocolat", description: "Cœur coulant, glace vanille", price: "8", category: "Desserts" },
    { name: "Tarte du moment", description: "Selon la saison", price: "7", category: "Desserts" },
    { name: "Café gourmand", description: "Expresso + 3 mignardises maison", price: "6", category: "Desserts" },
  ];
}

/* ─── Extraire email depuis le site web ──────────────────────────────────── */
async function extractEmailFromWebsite(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const text = await res.text();
    const match = text.match(/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/);
    if (!match) return null;
    const email = match[0].toLowerCase();
    // Filtrer les emails non pertinents
    if (email.includes("example") || email.includes("sentry") || email.includes("@2x")) return null;
    return email;
  } catch {
    return null;
  }
}

/* ─── Handler principal ──────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const query: string = (body.query || "restaurant Paris").slice(0, 200);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "GOOGLE_PLACES_API_KEY manquant" }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();
  const stats = { found: 0, inserted: 0, skippedDuplicate: 0, withEmail: 0, withMenu: 0 };
  const log: string[] = [];

  try {
    const places = await searchRestaurants(query, apiKey);
    stats.found = places.length;
    log.push(`[find] "${query}" → ${places.length} places`);

    for (const place of places) {
      const name: string = place.displayName?.text || "";
      if (!name) continue;

      const website: string = place.websiteUri || "";
      const phone: string = place.nationalPhoneNumber || "";
      const address: string = place.formattedAddress || "";
      const rating: number = place.rating || 0;
      const reviewCount: number = place.userRatingCount || 0;
      const cuisineType: string = place.primaryTypeDisplayName?.text || "Restaurant";

      // Heures d'ouverture (texte court)
      let hours = "";
      if (place.regularOpeningHours?.weekdayDescriptions) {
        hours = place.regularOpeningHours.weekdayDescriptions.slice(0, 3).join(" | ");
      }

      // Photos
      const photos: string[] = [];
      for (const ph of (place.photos || []).slice(0, 6)) {
        if (ph.name) {
          photos.push(await getPlacePhoto(ph.name, apiKey));
        }
      }

      // Slug
      const baseSlug = slugify(`${name}-${address.split(",")[1]?.trim() || ""}`.slice(0, 50));
      const slug = baseSlug || slugify(name) || place.id?.slice(0, 20) || "restaurant";

      // Vérifie doublon
      const { data: existing } = await supabase
        .from("tableflow_prospects")
        .select("id")
        .or(`slug.eq.${slug},name.eq.${name}`)
        .maybeSingle();

      if (existing) {
        stats.skippedDuplicate++;
        continue;
      }

      // Email
      let email: string | null = null;
      if (website) {
        email = await extractEmailFromWebsite(website);
      }
      if (email) stats.withEmail++;

      // Menu
      let menuItems: Array<{ name: string; description: string; price: string; category: string }> = [];
      if (website) {
        menuItems = await scrapeMenuFromWebsite(website);
      }
      if (menuItems.length < 3) {
        menuItems = getDefaultMenu(cuisineType);
        log.push(`[find] ${name}: menu de secours (${cuisineType})`);
      } else {
        stats.withMenu++;
        log.push(`[find] ${name}: ${menuItems.length} plats scrapés`);
      }

      // Ville depuis l'adresse
      const city = address.split(",").slice(-2)[0]?.trim() || "";

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
        place_id: place.id,
        status: email ? "found" : "no_email",
      });

      if (insertErr) {
        log.push(`[find] ✗ insert ${name}: ${insertErr.message}`);
      } else {
        stats.inserted++;
        log.push(`[find] ✓ inséré: ${name} (email=${email || "–"})`);
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: msg, stats, log }, { status: 500 });
  }

  return NextResponse.json({ success: true, stats, log });
}
