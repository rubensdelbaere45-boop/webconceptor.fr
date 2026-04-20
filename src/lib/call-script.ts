/* ══════════════════════════════════════════
   Génération de script d'appel personnalisé via Claude Haiku.
   Utilisé au moment où un prospect ouvre sa maquette → envoyé dans la
   notif Telegram HOT LEAD pour que Rubens puisse décrocher et closer.
   ══════════════════════════════════════════ */

export interface CallScriptInput {
  prospectName: string;
  city?: string | null;
  businessType?: string | null; // "restaurant" | "epicerie"
  cuisineType?: string | null;
  googleRating?: number | null;
  googleReviewsCount?: number | null;
  siteQuality?: "none" | "poor" | "average" | "good" | null;
  address?: string | null;
}

export interface CallScript {
  opening: string; // Phrase d'ouverture à lire mot à mot (5-10 sec)
  hooks: string[]; // 3 accroches spécifiques au prospect à utiliser si hésitation
  objectionHandlers: string[]; // Réponses aux 2-3 objections probables
}

const FALLBACK_SCRIPT: CallScript = {
  opening:
    "Bonjour, Tom Bauer de WebConceptor à l'appareil. J'ai vu que vous venez de regarder la maquette du site que j'ai préparée pour vous — qu'est-ce que vous en pensez ?",
  hooks: [
    "Vous avez déjà les clients, il vous manque juste un site à la hauteur",
    "La maquette inclut un module de réservation en ligne — zéro commission",
    "Je peux mettre en ligne en 5 jours, ou en 7 avec votre nom de domaine",
  ],
  objectionHandlers: [
    "« Je dois y réfléchir » → Bien sûr, je reste joignable ; qu'est-ce qui vous fait hésiter précisément ?",
    "« C'est cher » → 599 € TTC pour un site complet, ou 3× sans frais (200 €/mois), c'est moins cher qu'une serveuse un week-end",
    "« J'ai déjà un site » → Je l'ai audité, et j'ai repéré quelques axes d'amélioration précis dont on peut discuter",
  ],
};

export async function generateCallScript(input: CallScriptInput): Promise<CallScript> {
  const key = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  if (!key) return FALLBACK_SCRIPT;

  const isOpenRouter = key.startsWith("sk-or-");
  const endpoint = isOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.anthropic.com/v1/messages";

  const infoLines = [
    `Nom : ${input.prospectName}`,
    input.city ? `Ville : ${input.city}` : "",
    input.businessType ? `Type : ${input.businessType}` : "",
    input.cuisineType ? `Cuisine : ${input.cuisineType}` : "",
    input.googleRating
      ? `Note Google : ${input.googleRating}/5 (${input.googleReviewsCount || 0} avis)`
      : "",
    input.siteQuality
      ? `Qualité site actuel : ${input.siteQuality}${input.siteQuality === "none" ? " (pas de site !)" : ""}`
      : "",
  ].filter(Boolean).join("\n");

  const prompt = `Tom Bauer (fondateur WebConceptor) va appeler un prospect qui VIENT DE REGARDER sa maquette. Génère-lui un script d'appel ULTRA EFFICACE, personnalisé, à utiliser dans les 5 prochaines minutes.

Infos prospect :
${infoLines}

Contexte offre WebConceptor :
- Site vitrine premium sur-mesure : 599 € TTC
- Paiement en 3× sans frais via Klarna (3 × 199,67 €)
- Livraison en 5 jours (7 avec nom de domaine)
- Module réservation en ligne intégré (0 commission vs TheFork 2,50 €/couvert)
- Espace admin simple pour mettre à jour la carte en 2 min
- Option Sérénité 50 €/mois : hébergement + modifications illimitées

Génère un JSON avec EXACTEMENT ces 3 clés :
{
  "opening": "Phrase d'ouverture à lire mot à mot quand le prospect décroche (MAX 25 mots, finir par une question ouverte). Personnalisée avec un détail du prospect. PAS de 'Comment allez-vous ?', tout de suite au sujet.",
  "hooks": [3 accroches ultra-ciblées (max 15 mots chacune) à utiliser si le prospect hésite. Chaque accroche = UN bénéfice concret lié à LUI (sa note Google, son type d'établissement, son absence de site, etc.). Style impactant, pas de blabla marketing.],
  "objectionHandlers": [3 réponses courtes (max 25 mots) aux 3 objections les plus probables : 'Je vais y réfléchir', 'C'est trop cher', et UNE troisième objection spécifique au type de prospect (ex: 'j'ai déjà un site' si siteQuality=poor/average, 'je préfère attendre' si none, etc.)]
}

Ton : pro, direct, chaleureux, confiant. Francophone France. PAS de langue de bois. Tom est jeune (18 ans) mais pas un commercial classique. Réponds UNIQUEMENT avec le JSON valide.`;

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
        ? { "Content-Type": "application/json", Authorization: `Bearer ${key}` }
        : { "Content-Type": "application/json", "x-api-key": key, "anthropic-version": "2023-06-01" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) return FALLBACK_SCRIPT;
    const data = await res.json();
    const raw = isOpenRouter ? data.choices?.[0]?.message?.content : data.content?.[0]?.text;
    if (!raw) return FALLBACK_SCRIPT;

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return FALLBACK_SCRIPT;
    const parsed = JSON.parse(jsonMatch[0]);

    const clean = (s: unknown, max = 300) => String(s ?? "").slice(0, max).trim();
    const cleanArr = (a: unknown, maxItems = 5, maxChars = 250): string[] => {
      if (!Array.isArray(a)) return [];
      return a
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        .slice(0, maxItems)
        .map((s) => s.slice(0, maxChars));
    };

    const opening = clean(parsed.opening) || FALLBACK_SCRIPT.opening;
    const hooks = cleanArr(parsed.hooks);
    const objectionHandlers = cleanArr(parsed.objectionHandlers);

    return {
      opening,
      hooks: hooks.length >= 2 ? hooks : FALLBACK_SCRIPT.hooks,
      objectionHandlers: objectionHandlers.length >= 2 ? objectionHandlers : FALLBACK_SCRIPT.objectionHandlers,
    };
  } catch {
    return FALLBACK_SCRIPT;
  }
}
