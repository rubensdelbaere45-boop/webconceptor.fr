/* ══════════════════════════════════════════
   Génération de script d'appel personnalisé via Claude Haiku.
   Utilisé au moment où un prospect ouvre sa maquette → envoyé dans la
   notif Telegram HOT LEAD.

   STRATÉGIE : l'appel NE doit PAS closer la vente.
   Objectif = fixer un RENDEZ-VOUS TÉLÉPHONIQUE de 15-20 min
   pendant lequel Tom présente la maquette en détail et propose le devis.
   C'est bien plus facile de dire "oui à un appel de 15 min" que "oui à 599 €".
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
  discoveryQuestions: string[]; // Questions pro à poser pour qualifier (maquette plu ? choses à ajouter ? budget ? timing ?)
  hooks: string[]; // 3 accroches pour pousser vers le RDV si hésitation
  objectionHandlers: string[]; // Réponses aux objections probables
}

const FALLBACK_SCRIPT: CallScript = {
  opening:
    "Bonjour, Tom Bauer de WebConceptor à l'appareil. Je me permets de vous appeler au sujet de la maquette de site que je vous ai envoyée ce matin — avez-vous eu le temps d'y jeter un œil ?",
  discoveryQuestions: [
    "Qu'avez-vous pensé de la maquette dans l'ensemble ? Quel a été votre premier ressenti ?",
    "Y a-t-il des éléments que vous aimeriez modifier, enrichir ou voir apparaître différemment ?",
    "Comment gérez-vous votre présence en ligne aujourd'hui — avez-vous déjà un site, ou seulement une fiche Google / des réseaux sociaux ?",
    "Quels sont vos objectifs principaux avec ce nouveau site : plus de visibilité, plus de réservations, ou un outil de gestion pour vos équipes ?",
    "Si on avançait ensemble, quel serait le bon moment pour vous : une mise en ligne d'ici 1 semaine, 1 mois, ou plus tard ?",
  ],
  hooks: [
    "Je propose qu'on se rappelle 15-20 min au téléphone pour que je vous présente la maquette en détail — ça vous permet de poser toutes vos questions",
    "L'idée du rendez-vous, c'est de vous montrer concrètement comment le site s'intègrerait à votre activité au quotidien",
    "Je peux vous rappeler demain 14h ou jeudi 10h — quel créneau vous arrange ?",
  ],
  objectionHandlers: [
    "« Je dois y réfléchir » → Bien sûr. Justement, le rendez-vous téléphonique sert à ça : je vous détaille tout, vous prenez votre décision après, sans engagement. Demain ou jeudi ?",
    "« C'est trop cher » → C'est exactement pour ça que je propose qu'on en reparle au calme par téléphone — je vous détaille ce qui est inclus, le paiement en 3 fois sans frais, et vous voyez si ça tient la route pour vous.",
    "« Envoyez-moi plus d'infos par mail » → Avec plaisir, mais en 15 min au téléphone on gagne une semaine d'échanges — je vous propose demain 14h ?",
    "« Je veux le prendre maintenant » → Parfait ! Je peux vous envoyer le lien de paiement Stripe immédiatement — en une fois (599 €) ou en 3 fois sans frais via Klarna, comme vous préférez.",
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

  const prompt = `Tom Bauer (fondateur WebConceptor) va appeler un professionnel qui a reçu par email une maquette de site web. L'OBJECTIF PRINCIPAL de l'appel = FIXER UN RENDEZ-VOUS TÉLÉPHONIQUE de 15-20 min durant lequel Tom présentera la maquette en détail et proposera le devis. UNIQUEMENT téléphonique, PAS de visio.

EXCEPTION : si le prospect veut acheter directement pendant l'appel, Tom NE LE REFUSE PAS — il envoie le lien de paiement Stripe tout de suite. La règle = ne jamais bloquer une vente.

Génère un script d'appel orienté "prise de RDV avec fallback vente directe", personnalisé, sobre et professionnel.

Infos prospect :
${infoLines}

Contexte offre WebConceptor (à mentionner SEULEMENT si le prospect demande) :
- Site vitrine premium sur-mesure : 599 € TTC
- Paiement en 3× sans frais via Klarna (3 × 199,67 €)
- Livraison en 5 jours (7 avec nom de domaine)
- Module réservation en ligne intégré (0 commission vs TheFork 2,50 €/couvert)
- Espace admin simple
- Option Sérénité 50 €/mois : hébergement + modifications illimitées

RÈGLES IMPÉRATIVES :
1. VOUVOIEMENT OBLIGATOIRE partout (« vous », « votre établissement », jamais « tu »).
2. L'ouverture demande s'il A REÇU la maquette — JAMAIS « j'ai vu que vous avez ouvert/regardé/cliqué » (effet surveillance).
3. OBJECTIF = CALER UN RDV DE 15-20 MIN. Toujours proposer 2 créneaux concrets (« demain 14h ou jeudi 10h ? »).
4. Ton professionnel, posé, NON pressé. Pas d'urgence artificielle.
5. Si le prospect veut acheter direct → Tom lui envoie le lien Stripe immédiatement (gérer via un objectionHandler dédié).

Génère un JSON avec EXACTEMENT ces 4 clés :
{
  "opening": "Phrase d'ouverture VOUVOYÉE (MAX 35 mots). Format : 'Bonjour, Tom Bauer de WebConceptor à l'appareil. Je me permets de vous appeler au sujet de la maquette de site que je vous ai envoyée — avez-vous eu le temps d'y jeter un œil ?' — adapte légèrement.",
  "discoveryQuestions": [5 questions VOUVOYÉES (max 25 mots chacune) à poser pendant l'appel pour qualifier le besoin. Obligatoirement couvrir : (1) ressenti sur la maquette, (2) modifications souhaitées, (3) présence en ligne actuelle, (4) objectifs business du site (visibilité / réservations / autre), (5) timing souhaité pour lancer. Formulation professionnelle, ouverte, pas commerciale.],
  "hooks": [3 accroches VOUVOYÉES orientées PRISE DE RDV TÉLÉPHONIQUE (max 25 mots chacune). Exemple : 'Je propose qu'on se rappelle 15-20 min au téléphone pour que je vous présente la maquette — demain 14h ou jeudi 10h ?' Chaque hook pousse VERS le RDV téléphonique, pas vers la vente. JAMAIS 'visio'.],
  "objectionHandlers": [4 réponses VOUVOYÉES (max 40 mots) aux 4 situations : (1) 'Je vais y réfléchir' → rassurer + reproposer RDV téléphonique, (2) 'C'est trop cher' → le RDV téléphonique sert à détailler, 3× sans frais, (3) 'Envoyez-moi un mail avec plus d'infos' → 15 min au téléphone = une semaine gagnée, (4) 'Je veux l'acheter maintenant' → 'Parfait, je vous envoie le lien de paiement Stripe tout de suite, en une fois ou en 3× sans frais via Klarna, comme vous préférez'. Toujours VOUS. JAMAIS 'visio'.]
}

Ton : pro, rassurant, poli, jamais pressé. Francophone France standard. Tom est jeune (18 ans) mais parle comme un dirigeant posé. Réponds UNIQUEMENT avec le JSON valide.`;

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
    const discoveryQuestions = cleanArr(parsed.discoveryQuestions);
    const hooks = cleanArr(parsed.hooks);
    const objectionHandlers = cleanArr(parsed.objectionHandlers);

    return {
      opening,
      discoveryQuestions: discoveryQuestions.length >= 3 ? discoveryQuestions : FALLBACK_SCRIPT.discoveryQuestions,
      hooks: hooks.length >= 2 ? hooks : FALLBACK_SCRIPT.hooks,
      objectionHandlers: objectionHandlers.length >= 2 ? objectionHandlers : FALLBACK_SCRIPT.objectionHandlers,
    };
  } catch {
    return FALLBACK_SCRIPT;
  }
}
