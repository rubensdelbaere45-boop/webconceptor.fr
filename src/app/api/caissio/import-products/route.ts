import { NextResponse } from "next/server";

/**
 * POST /api/caissio/import-products
 * Analyse un fichier (CSV, PDF texte, facture…) via OpenRouter
 * et retourne une liste structurée de produits.
 *
 * Body: { content: string, filename: string }
 * Response: { products: Array<{name,price,category,barcode?,tva,stock}> }
 *
 * Coût maîtrisé :
 *  - Modèle : google/gemini-flash-1.5-8b (ultra-cheap)
 *  - Input tronqué à 6 000 caractères max
 *  - max_tokens : 800 (suffisant pour ~40 articles)
 */
export async function POST(req: Request) {
  const apiKey = process.env.CAISSIO_AI_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "CAISSIO_AI_KEY non configuré dans les variables Vercel." },
      { status: 503 }
    );
  }

  let body: { content?: string; filename?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { content = "", filename = "fichier" } = body;
  if (!content.trim()) {
    return NextResponse.json({ error: "Fichier vide ou illisible." }, { status: 400 });
  }

  // Limiter l'input pour maîtriser les coûts (~6 000 chars ≈ 1 500 tokens)
  const truncated = content.slice(0, 6000);

  const prompt = `Extrais les articles de ce document (${filename}). Retourne UNIQUEMENT un tableau JSON, sans markdown ni texte autour.
Champs par article : name (string), price (number TTC €, 0 si inconnu), category (string), tva (5.5|10|20), stock (number, 0 si inconnu), barcode (string optionnel).
Si aucun article détectable, retourne [].
Document :
---
${truncated}
---`;

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": "https://webconceptor.fr",
        "X-Title": "Caissio Import",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        max_tokens: 800,
        temperature: 0,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("OpenRouter API error:", err);
      return NextResponse.json({ error: "Erreur de l'IA. Réessayez." }, { status: 502 });
    }

    const data = await response.json();
    const text = (data.choices?.[0]?.message?.content || "").trim();

    // Extraire le tableau JSON même si entouré de backticks
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return NextResponse.json({ products: [], warning: "Aucun article détecté dans ce fichier." });
    }

    let products;
    try {
      products = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ products: [], warning: "Format de réponse inattendu." });
    }

    // Valider et nettoyer
    const clean = Array.isArray(products)
      ? products
          .filter((p) => p && typeof p.name === "string" && p.name.trim())
          .slice(0, 200) // sécurité : jamais plus de 200 articles par import
          .map((p) => ({
            name: String(p.name).trim(),
            price:
              typeof p.price === "number"
                ? Math.round(p.price * 100) / 100
                : parseFloat(p.price) || 0,
            category: String(p.category || "Import").trim(),
            tva: [5.5, 10, 20].includes(Number(p.tva)) ? Number(p.tva) : 20,
            stock: parseInt(p.stock) || 0,
            barcode: p.barcode ? String(p.barcode).trim() : undefined,
          }))
      : [];

    return NextResponse.json({ products: clean });
  } catch (e) {
    console.error("Import products error:", e);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
