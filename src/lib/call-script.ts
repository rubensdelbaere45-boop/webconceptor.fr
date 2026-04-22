/* ══════════════════════════════════════════
   Génération de script d'appel personnalisé via Claude Haiku.
   Utilisé au moment où un prospect ouvre sa maquette → envoyé dans la
   notif Telegram HOT LEAD.

   STRATÉGIE : Rubens ET le prospect ont la maquette sous les yeux pendant l'appel.
   L'appel EST le rendez-vous — pas besoin d'en planifier un autre.
   But = parler de la maquette directement, discuter des ajustements, proposer
   un rappel plus tard si besoin (mais UNIQUEMENT téléphonique, PAS de visio).
   Si le prospect est chaud, on closer tout de suite avec le lien Stripe.
   ══════════════════════════════════════════ */

// Filtre de sécurité : purge toutes les mentions de 'visio' dans ce que Claude
// peut retourner (au cas où le modèle désobéirait au prompt). Remplace par
// 'téléphone' / 'au téléphone' selon le contexte.
function stripVisio(s: string): string {
  return s
    .replace(/en\s+visio(conférence|conference)?/gi, "au téléphone")
    .replace(/rendez-vous\s+visio/gi, "rendez-vous téléphonique")
    .replace(/rdv\s+visio/gi, "RDV téléphonique")
    .replace(/visio(conférence|conference)?/gi, "téléphone")
    .replace(/\bvisio\b/gi, "téléphone");
}

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
    "Bonjour, Tom Bauer de WebConceptor à l'appareil. J'espère que je ne vous dérange pas ? Je me permets de vous contacter parce que j'ai préparé ce matin une maquette de site internet personnalisée pour votre établissement, avec un module de réservation en ligne intégré. Je vous l'ai envoyée par email à l'adresse que vous utilisez pour votre établissement. Avez-vous eu le temps d'y jeter un œil, ou est-ce que c'est encore trop frais ?",
  discoveryQuestions: [
    "Qu'avez-vous pensé de la maquette dans son ensemble ? Quel a été votre premier ressenti ?",
    "Y a-t-il des éléments visuels que vous aimeriez modifier, enrichir ou voir apparaître différemment ?",
    "Comment gérez-vous votre présence en ligne aujourd'hui — site, fiche Google, réseaux sociaux ?",
    "Quels sont vos objectifs principaux avec ce nouveau site : plus de visibilité, plus de réservations, mieux informer vos clients ?",
    "Si on avançait ensemble, quel serait le bon moment pour vous : mise en ligne d'ici 1 semaine, 1 mois, ou plus tard ?",
  ],
  hooks: [
    "Prenons quelques minutes ensemble maintenant pour regarder la maquette en détail, vous me dites ce que vous en pensez",
    "Si vous préférez qu'on en rediscute à un moment plus calme, je peux vous rappeler demain 14 h ou jeudi 10 h, comme vous voulez",
    "On peut parcourir la maquette ensemble là tout de suite — vous avez 10 minutes devant vous ?",
  ],
  objectionHandlers: [
    "« Je dois y réfléchir » → Bien sûr. Je vous rappelle quand ? Demain matin ou jeudi après-midi vous conviennent ?",
    "« C'est trop cher » → Je comprends. Pour info c'est 320 € TTC tout compris, ou en 3 fois sans frais via Klarna (3 × 106,67 €). À l'usage vous récupérez ça en quelques mois de réservations.",
    "« Envoyez-moi plus d'infos par mail » → Je peux bien sûr, mais autant en parler directement maintenant qu'on est tous les deux sur la maquette. Qu'est-ce qui vous manque pour décider ?",
    "« Je veux le prendre maintenant » → Parfait ! Je vous envoie le lien de paiement Stripe dans la minute — en une fois (320 € TTC) ou en 3 fois sans frais via Klarna, comme vous préférez.",
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

  const prompt = `Tom Bauer (fondateur WebConceptor) va appeler UN PROFESSIONNEL qui a reçu par email une maquette de site web.

CONTEXTE IMPORTANT : Tom ET le prospect auront la maquette OUVERTE sous les yeux pendant l'appel (l'URL de la maquette a été envoyée par email). Donc l'appel EST le rendez-vous — PAS BESOIN de planifier un autre RDV pour présenter la maquette. On en parle directement là, tout de suite.

SEULE EXCEPTION : si le prospect dit "je ne peux pas parler maintenant", Tom propose UN RAPPEL TÉLÉPHONIQUE plus tard dans la journée ou le lendemain (demain 14 h ou jeudi 10 h). Jamais de visio, jamais de Zoom, jamais de Google Meet — UNIQUEMENT par téléphone.

Si le prospect veut acheter immédiatement → lien Stripe envoyé tout de suite (en 1× ou 3× Klarna).

Génère un script d'appel direct et conversationnel, personnalisé, sobre et professionnel.

Infos prospect :
${infoLines}

Contexte offre WebConceptor (à mentionner SEULEMENT si le prospect demande) :
- Site vitrine premium sur-mesure : 320 € TTC
- Paiement en 3× sans frais via Klarna (3 × 106,67 €)
- Livraison en 5 jours (7 avec nom de domaine)
- Module réservation en ligne intégré (0 commission vs TheFork 2,50 €/couvert)
- Espace admin simple
- Option Sérénité 50 €/mois : hébergement + modifications illimitées

RÈGLES IMPÉRATIVES :
1. VOUVOIEMENT OBLIGATOIRE partout (« vous », « votre établissement », jamais « tu »).
2. L'ouverture demande s'il A REÇU la maquette et s'il peut en parler maintenant — JAMAIS « j'ai vu que vous avez ouvert/regardé/cliqué ».
3. ❌ INTERDICTION ABSOLUE d'utiliser les mots "visio", "visioconférence", "Zoom", "Google Meet", "Teams", "en ligne" (au sens réunion), "via écran partagé". Tout échange = TÉLÉPHONIQUE uniquement, point. Si tu dis "visio" une seule fois, ton script sera rejeté.
4. L'appel EST le rendez-vous → on parle de la maquette DIRECTEMENT. Pas de « je propose qu'on programme un créneau pour... ».
5. Si le prospect ne peut pas parler : propose UN RAPPEL téléphonique (« je peux vous rappeler demain 14 h ? »).
6. Ton professionnel, posé, NON pressé.
7. Si le prospect veut acheter direct → lien Stripe immédiat.

Génère un JSON avec EXACTEMENT ces 4 clés :
{
  "opening": "Phrase d'ouverture VOUVOYÉE de 60 à 90 MOTS (prend le temps, ne bâcle pas la présentation — le prospect doit avoir le temps de se situer). Structure imposée : (1) Salutation + nom + entreprise, (2) courte courtoisie 'j'espère que je ne vous dérange pas', (3) raison de l'appel (maquette préparée ce matin pour son établissement, mentionner UN bénéfice concret comme module de réservation intégré), (4) confirmer qu'on a envoyé par email, (5) question ouverte sur s'il a eu le temps de regarder. Exemple : 'Bonjour, Tom Bauer de WebConceptor à l'appareil. J'espère que je ne vous dérange pas ? Je me permets de vous contacter parce que j'ai préparé ce matin une maquette de site internet personnalisée pour votre établissement, avec un module de réservation en ligne intégré. Je vous l'ai envoyée par email. Avez-vous eu le temps d'y jeter un œil ?' — adapte avec un détail propre au prospect (ville, type métier).",
  "discoveryQuestions": [5 questions VOUVOYÉES (max 25 mots chacune) à poser PENDANT L'APPEL, le prospect ayant la maquette sous les yeux. Obligatoirement couvrir : (1) ressenti sur la maquette, (2) modifications souhaitées (images, couleurs, textes), (3) présence en ligne actuelle, (4) objectifs du site (réservations, visibilité, etc.), (5) timing de lancement. Formulation pro, ouverte, pas commerciale.],
  "hooks": [3 phrases VOUVOYÉES (max 25 mots chacune) pour avancer la conversation pendant l'appel. Ex : 'On peut parcourir la maquette ensemble là tout de suite, vous avez 5 minutes ?' ou 'Si vous préférez un moment plus calme, je peux vous rappeler demain 14 h ou jeudi 10 h'. Ces phrases servent à gérer les prospects occupés — en proposant un RAPPEL TÉLÉPHONIQUE. INTERDIT : les mots "visio", "Zoom", "Meet", "Teams", "écran partagé". Uniquement TÉLÉPHONE.],
  "objectionHandlers": [4 réponses VOUVOYÉES (max 40 mots) aux 4 situations : (1) 'Je vais y réfléchir' → demander quand le rappeler par téléphone, (2) 'C'est trop cher' → rappeler le 3× sans frais et le ROI rapide, (3) 'Envoyez-moi un mail avec plus d'infos' → proposer d'en parler directement maintenant puisqu'il est déjà au téléphone avec Tom, (4) 'Je veux l'acheter maintenant' → envoi lien Stripe immédiat. Toujours VOUS. INTERDIT : "visio".]
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

    // Sanitize : on passe TOUT ce que Claude retourne dans stripVisio() pour
    // garantir qu'aucune mention de "visio" n'atteint Rubens, même si le modèle
    // désobéit au prompt.
    const clean = (s: unknown, max = 300) => stripVisio(String(s ?? "").slice(0, max).trim());
    const cleanArr = (a: unknown, maxItems = 5, maxChars = 250): string[] => {
      if (!Array.isArray(a)) return [];
      return a
        .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
        .slice(0, maxItems)
        .map((s) => stripVisio(s.slice(0, maxChars)));
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
