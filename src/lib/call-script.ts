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
    "Bonjour, Tom Bauer de WebConceptor à l'appareil. Je me permets de vous appeler : avez-vous eu le temps de regarder la maquette de site que nous avons préparée pour votre établissement ?",
  hooks: [
    "Vous avez déjà une belle clientèle, il vous manque juste une vitrine numérique à la hauteur",
    "La maquette inclut un module de réservation en ligne sans commission — vous gardez 100 % de vos couverts",
    "Nous pouvons vous mettre en ligne sous 5 jours ouvrés, 7 si vous souhaitez un nom de domaine dédié",
  ],
  objectionHandlers: [
    "« Je dois y réfléchir » → Bien sûr, je reste à votre disposition. Puis-je vous demander ce qui vous fait hésiter en particulier ?",
    "« C'est cher » → 599 € TTC pour un site complet, ou en 3 fois sans frais (3 × 199,67 €). C'est l'équivalent d'un week-end de service.",
    "« J'ai déjà un site » → Tout à fait, j'ai pris le temps de le regarder. J'ai relevé deux ou trois pistes concrètes qui pourraient vous intéresser, je peux vous les partager en 2 minutes ?",
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

  const prompt = `Tom Bauer (fondateur WebConceptor) va appeler un professionnel qui a reçu par email une maquette de site web. Génère-lui un script d'appel ULTRA EFFICACE, personnalisé, sobre et professionnel.

Infos prospect :
${infoLines}

Contexte offre WebConceptor :
- Site vitrine premium sur-mesure : 599 € TTC
- Paiement en 3× sans frais via Klarna (3 × 199,67 €)
- Livraison en 5 jours (7 avec nom de domaine)
- Module réservation en ligne intégré (0 commission vs TheFork 2,50 €/couvert)
- Espace admin simple pour mettre à jour la carte en 2 min
- Option Sérénité 50 €/mois : hébergement + modifications illimitées

RÈGLES IMPÉRATIVES :
1. VOUVOIEMENT OBLIGATOIRE dans TOUT le script — c'est un professionnel, on lui doit du respect (« vous », « votre établissement », « je me permets », jamais « tu »).
2. L'ouverture doit demander s'il A REÇU la maquette et s'il a pu la regarder — JAMAIS dire « j'ai vu que vous avez ouvert/regardé/cliqué » (effet surveillance qui fait fuir).
3. Ton professionnel, posé, rassurant. Pas de familiarité ni de « Salut », pas de ton de commercial pressé.
4. Personnalisation via un détail SPÉCIFIQUE au prospect (note Google, type d'établissement, ville) — mais sans donner l'impression qu'on l'espionne.

Génère un JSON avec EXACTEMENT ces 3 clés :
{
  "opening": "Phrase d'ouverture VOUVOYÉE (MAX 30 mots). Format impératif : 'Bonjour, Tom Bauer de WebConceptor. Je me permets de vous appeler : avez-vous eu le temps de regarder la maquette que nous avons préparée pour [nom/établissement] ?' — adapte la fin avec un détail propre au prospect.",
  "hooks": [3 accroches VOUVOYÉES (max 18 mots chacune), posées et concrètes, à utiliser si le prospect hésite. Chaque accroche = UN bénéfice lié à LUI. Toujours 'votre' et jamais 'ton'.],
  "objectionHandlers": [3 réponses VOUVOYÉES (max 30 mots) aux 3 objections probables : 'Je vais y réfléchir', 'C'est trop cher', et une 3ème adaptée au contexte. Toujours 'vous', jamais 'tu'.]
}

Ton : pro, rassurant, poli, maîtrisé. Francophone France standard. Tom est jeune (18 ans) mais parle comme un dirigeant posé. Réponds UNIQUEMENT avec le JSON valide.`;

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
