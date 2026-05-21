import { NextResponse } from "next/server";

/**
 * POST /api/caissio/import-products
 * Analyse un fichier (CSV, PDF texte, facture…) avec Claude
 * et retourne une liste structurée de produits.
 *
 * Body: { content: string, filename: string }
 * Response: { products: Array<{name,price,category,barcode?,tva,stock}> }
 */
export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "ANTHROPIC_API_KEY non configuré. Ajoutez-la dans les variables Vercel." }, { status: 503 });
  }

  let body: { content?: string; filename?: string };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Corps de requête invalide." }, { status: 400 });
  }

  const { content = "", filename = "fichier" } = body;
  if (!content.trim()) {
    return NextResponse.json({ error: "Fichier vide ou illisible." }, { status: 400 });
  }

  const prompt = `Tu es un assistant pour logiciel de caisse. Analyse ce document (${filename}) et extrais la liste de tous les articles/produits vendus.

Pour chaque article détecté, retourne un objet JSON avec ces champs :
- name (string) : nom de l'article tel qu'affiché en caisse
- price (number) : prix de vente TTC en euros (0 si inconnu)
- category (string) : catégorie la plus appropriée parmi : Boulangerie, Boissons, Snacks, Épicerie, Fruits, Légumes, Fromage, Charcuterie, ou toute autre catégorie pertinente
- tva (number) : taux de TVA en % : 5.5 (alimentaire de base), 10 (restauration/traiteur), ou 20 (autres). Déduis-le du type de produit si non indiqué.
- stock (number) : quantité en stock si mentionnée, sinon 0
- barcode (string, optionnel) : code-barres EAN si présent

Retourne UNIQUEMENT un tableau JSON valide, sans texte avant ou après, sans markdown, sans explications.
Format : [{"name":"...","price":1.20,"category":"...","tva":5.5,"stock":0}, ...]

Si le document ne contient pas de liste de produits exploitable, retourne [].

Voici le contenu du document :
---
${content.slice(0, 20000)}
---`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",
        max_tokens: 4096,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Anthropic API error:", err);
      return NextResponse.json({ error: "Erreur de l'IA. Réessayez." }, { status: 502 });
    }

    const data = await response.json();
    const text = (data.content?.[0]?.text || "").trim();

    // Extraire le JSON même si entouré de backticks
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
    const clean = Array.isArray(products) ? products
      .filter((p) => p && typeof p.name === "string" && p.name.trim())
      .map((p) => ({
        name: String(p.name).trim(),
        price: typeof p.price === "number" ? Math.round(p.price * 100) / 100 : parseFloat(p.price) || 0,
        category: String(p.category || "Import").trim(),
        tva: [5.5, 10, 20].includes(Number(p.tva)) ? Number(p.tva) : 20,
        stock: parseInt(p.stock) || 0,
        barcode: p.barcode ? String(p.barcode).trim() : undefined,
      })) : [];

    return NextResponse.json({ products: clean });
  } catch (e) {
    console.error("Import products error:", e);
    return NextResponse.json({ error: "Erreur interne." }, { status: 500 });
  }
}
