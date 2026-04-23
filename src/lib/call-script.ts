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
  businessType?: string | null; // "restaurant" | "epicerie" | etc.
  cuisineType?: string | null;
  googleRating?: number | null;
  googleReviewsCount?: number | null;
  siteQuality?: "none" | "poor" | "average" | "good" | null;
  address?: string | null;
  // SIGNAUX D'ENGAGEMENT — permettent au script de s'adapter : un prospect
  // qui a vu la maquette 7× ne doit pas entendre la même ouverture qu'un
  // prospect qui n'a jamais cliqué le lien email.
  viewCount?: number | null;      // Nombre d'ouvertures de la maquette
  cartOpenedAt?: string | null;   // Timestamp du clic sur "J'achète" (si abandonné paiement)
  openedAt?: string | null;       // Première ouverture du mail
  repliedAt?: string | null;      // A répondu au mail ?
}

export interface CallScript {
  opening: string; // Phrase d'ouverture à lire mot à mot (5-10 sec)
  discoveryQuestions: string[]; // Questions pro à poser pour qualifier (maquette plu ? choses à ajouter ? budget ? timing ?)
  hooks: string[]; // 3 accroches pour pousser vers le RDV si hésitation
  objectionHandlers: string[]; // Réponses aux objections probables
}

// Bénéfices concrets par type de métier — utilisé pour personnaliser le pitch
// de la présentation. Toujours un bénéfice VRAI et mesurable pour ce métier.
const BUSINESS_PITCH: Record<string, string> = {
  restaurant: "avec un module de réservation en ligne intégré, directement sur votre site — zéro commission contrairement à TheFork",
  boulangerie: "avec une vitrine claire de vos pains et viennoiseries, pensée pour attirer les clients du quartier",
  patisserie: "avec une boutique en ligne pour vos commandes sur-mesure (gâteaux, événements)",
  chocolatier: "avec une boutique en ligne pour vos tablettes et créations, livraison possible",
  cafe: "avec une vitrine claire sur votre carte et vos horaires, pensée pour le mobile",
  glacier: "avec la mise en avant de vos parfums du jour et la commande pour événements",
  coiffeur: "avec un module de prise de rendez-vous intégré, sans commission contrairement à Treatwell",
  institut: "avec un module de prise de rendez-vous direct, sans commission intermédiaire",
  fleuriste: "avec une boutique en ligne pour vos compositions et livraisons",
  plombier: "avec un formulaire de devis rapide intégré, GPS pour qu'ils viennent à vous",
  electricien: "avec un formulaire de devis clair et vos références en ligne",
  dentiste: "avec la prise de rendez-vous en ligne et votre équipe mise en valeur",
  osteo: "avec la prise de rendez-vous en ligne simple et claire",
  salle_sport: "avec les cours, les tarifs et l'inscription en ligne",
  auto_ecole: "avec les forfaits clairs et l'inscription en ligne",
  garage: "avec un formulaire de devis et la présentation de vos prestations",
  epicerie: "avec une vitrine claire de vos rayons et horaires",
};

// Construit une ouverture d'appel PERSONNALISÉE basée sur l'engagement réel
// du prospect. Respecte la structure voulue par Rubens :
// 1. Salutation polie + présentation rapide du correspondant
// 2. "Est-ce que je vous dérange ?" (respect du temps)
// 3. Self-pitch court (qui est WebConceptor, ce qu'on fait)
// 4. Présentation du motif (maquette préparée)
// 5. Question sur la réception
// 6. + PERSONNALISATION si engagement (vue X fois, panier abandonné...)
function buildFallbackOpening(input: CallScriptInput): string {
  const name = input.prospectName || "votre établissement";
  const bType = (input.businessType || "").toLowerCase();
  const pitch = BUSINESS_PITCH[bType] || "pensée pour améliorer votre visibilité et vos demandes entrantes";

  // Signaux d'engagement
  const vc = input.viewCount || 0;
  const hasCart = !!input.cartOpenedAt;

  // Début standard (respectueux, self-présentation)
  let opening =
    `Bonjour, Tom Bauer de WebConceptor à l'appareil. ` +
    `Est-ce que je vous dérange une minute ? ` +
    `\n\n` +
    `Je me présente rapidement : chez WebConceptor, nous créons et nous modernisons les sites internet pour les professionnels comme vous. ` +
    `J'ai préparé récemment une maquette sur-mesure pour ${name}, ${pitch}. ` +
    `Je vous l'ai envoyée par email. `;

  // Personnalisation selon l'engagement
  if (hasCart) {
    opening += `D'ailleurs, j'ai vu que vous étiez sur le point de valider la commande avant de quitter la page — je voulais justement vous appeler pour savoir s'il y avait eu un souci technique, ou une question qui vous a retenu ?`;
  } else if (vc >= 5) {
    opening += `D'ailleurs, j'ai vu que vous l'avez consultée plusieurs fois cette semaine — qu'en avez-vous pensé ? Y a-t-il des éléments qui vous freinent ?`;
  } else if (vc >= 2) {
    opening += `D'ailleurs, j'ai vu que vous y êtes revenu plusieurs fois — est-ce qu'elle vous plaît ? Ou est-ce que certains éléments sont à adapter ?`;
  } else if (vc >= 1) {
    opening += `Avez-vous eu le temps d'y jeter un œil ? J'aimerais avoir votre premier ressenti.`;
  } else {
    opening += `Avez-vous bien reçu ma maquette ? Si vous voulez, on peut la parcourir ensemble là tout de suite, ça prend 5 minutes.`;
  }

  return opening;
}

// Fallback non-personnalisé (utilisé UNIQUEMENT si buildFallbackOpening n'est
// pas appelable, par exemple en lecture directe du fichier). Même structure.
const FALLBACK_SCRIPT: CallScript = {
  opening:
    "Bonjour, Tom Bauer de WebConceptor à l'appareil. Est-ce que je vous dérange une minute ?\n\n" +
    "Je me présente rapidement : chez WebConceptor, nous créons et modernisons les sites internet pour les professionnels comme vous. " +
    "J'ai préparé récemment une maquette sur-mesure pour votre établissement, pensée pour améliorer votre visibilité et vos demandes entrantes. " +
    "Je vous l'ai envoyée par email. Avez-vous bien reçu ma maquette ?",
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
    "« C'est trop cher » → Je comprends. Pour info c'est 199 € TTC tout compris, ou en 3 fois sans frais via Klarna (3 × 66,33 €). À l'usage vous récupérez ça en quelques mois de réservations.",
    "« Envoyez-moi plus d'infos par mail » → Je peux bien sûr, mais autant en parler directement maintenant qu'on est tous les deux sur la maquette. Qu'est-ce qui vous manque pour décider ?",
    "« Je veux le prendre maintenant » → Parfait ! Je vous envoie le lien de paiement Stripe dans la minute — en une fois (199 € TTC) ou en 3 fois sans frais via Klarna, comme vous préférez.",
  ],
};

export async function generateCallScript(input: CallScriptInput): Promise<CallScript> {
  const key = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || "";

  // Fallback personnalisé quand pas de clé API OU quand Claude échoue.
  // Construit une ouverture déjà adaptative basée sur les vrais signaux
  // d'engagement (view_count, cart_opened_at).
  const personalizedFallback: CallScript = {
    ...FALLBACK_SCRIPT,
    opening: buildFallbackOpening(input),
  };

  if (!key) return personalizedFallback;

  const isOpenRouter = key.startsWith("sk-or-");
  const endpoint = isOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.anthropic.com/v1/messages";

  // Construit la ligne d'engagement pour que Claude personnalise le script
  const engagementParts: string[] = [];
  if (input.viewCount && input.viewCount > 0) {
    engagementParts.push(`a consulté la maquette ${input.viewCount} fois`);
  }
  if (input.cartOpenedAt) {
    engagementParts.push("A CLIQUÉ sur le bouton 'J'achète' puis a abandonné avant paiement (cart abandon) — signal ultra fort, il hésite sur le dernier mètre");
  }
  if (input.repliedAt) {
    engagementParts.push("A RÉPONDU à notre email (rare — prospect très engagé)");
  }
  if (input.openedAt && !engagementParts.length) {
    const days = Math.floor((Date.now() - new Date(input.openedAt).getTime()) / 86400000);
    engagementParts.push(`a ouvert le mail il y a ${days} jour${days > 1 ? "s" : ""}`);
  }

  const engagementLine = engagementParts.length
    ? `SIGNAUX D'ENGAGEMENT (à utiliser dans l'ouverture pour personnaliser) : ${engagementParts.join(" · ")}`
    : "Aucun signal d'engagement connu — le prospect n'a pas encore cliqué la maquette.";

  const infoLines = [
    `Nom : ${input.prospectName}`,
    input.city ? `Ville : ${input.city}` : "",
    input.businessType ? `Type d'activité : ${input.businessType}` : "",
    input.cuisineType ? `Cuisine : ${input.cuisineType}` : "",
    input.googleRating
      ? `Note Google : ${input.googleRating}/5 (${input.googleReviewsCount || 0} avis)`
      : "",
    input.siteQuality
      ? `Qualité site actuel : ${input.siteQuality}${input.siteQuality === "none" ? " (pas de site !)" : ""}`
      : "",
    engagementLine,
  ].filter(Boolean).join("\n");

  const prompt = `Tom Bauer (fondateur WebConceptor, 18 ans mais très professionnel) va appeler UN PROFESSIONNEL qui a reçu par email une maquette de site web.

CONTEXTE : Tom ET le prospect auront la maquette OUVERTE sous les yeux pendant l'appel. L'appel EST le rendez-vous — PAS de planification d'un autre RDV. Si le prospect ne peut pas parler → proposer UN RAPPEL TÉLÉPHONIQUE. Jamais de visio/Zoom/Meet.

Si le prospect veut acheter → lien Stripe envoyé immédiatement (1× 199 € ou 3× Klarna 66,33 €).

Infos prospect :
${infoLines}

Contexte offre WebConceptor (à mentionner SEULEMENT si le prospect demande) :
- Site vitrine premium sur-mesure : 199 € TTC
- Paiement en 3× sans frais via Klarna (3 × 66,33 €)
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

RÈGLES IMPÉRATIVES (non négociables) :
1. VOUVOIEMENT partout (« vous », « votre », jamais « tu »).
2. ❌ INTERDICTION des mots : "visio", "visioconférence", "Zoom", "Google Meet", "Teams", "écran partagé", "en ligne" (au sens réunion). UNIQUEMENT téléphone.
3. TOUJOURS respectueux. TOUJOURS se présenter clairement (qui est Tom, ce qu'est WebConceptor). Pas de pitch agressif.
4. Si signaux d'engagement → les UTILISER dans l'ouverture pour personnaliser (ex: "j'ai vu que vous étiez sur le point de commander..."). PAS d'invention — uniquement les vrais signaux fournis.

STRUCTURE OBLIGATOIRE de l'ouverture (ordre strict en 4 étapes) :
  (1) SALUTATION + PRÉSENTATION DE TOM : "Bonjour, Tom Bauer de WebConceptor à l'appareil."
  (2) RESPECT DU TEMPS : "Est-ce que je vous dérange une minute ?" (laisse un blanc pour sa réponse mentale)
  (3) SELF-PRÉSENTATION DE L'ENTREPRISE + MOTIF : "Je me présente rapidement : chez WebConceptor, nous créons et nous modernisons les sites internet pour les professionnels comme vous. J'ai préparé récemment une maquette sur-mesure pour [NOM], [UN bénéfice concret vrai pour ce métier]. Je vous l'ai envoyée par email."
  (4) QUESTION SUR LA MAQUETTE (adaptée à l'engagement) :
      - Si cart abandon : "D'ailleurs, j'ai vu que vous étiez sur le point de valider la commande avant de quitter la page — je voulais savoir s'il y a eu un souci technique ou une question qui vous a retenu ?"
      - Si vu 5× ou + : "D'ailleurs, j'ai vu que vous l'avez consultée plusieurs fois cette semaine — qu'en avez-vous pensé ? Y a-t-il des éléments qui vous freinent ?"
      - Si vu 2-4× : "D'ailleurs, j'ai vu que vous y êtes revenu plusieurs fois — est-ce qu'elle vous plaît ?"
      - Si vu 1× : "Avez-vous eu le temps d'y jeter un œil ? J'aimerais avoir votre premier ressenti."
      - Si jamais vu : "Avez-vous bien reçu ma maquette ? Si vous voulez, on peut la parcourir ensemble là tout de suite, ça prend 5 minutes."

L'ouverture doit faire 80 à 130 mots (longue, respectueuse, pas bâclée).

Génère un JSON avec EXACTEMENT ces 4 clés :
{
  "opening": "L'ouverture complète en 4 étapes ci-dessus, VOUVOYÉE, adaptée au métier + engagement du prospect. Intègre un bénéfice concret lié au métier (réservation sans commission pour resto/coiffeur/esthé, formulaire de devis pour plombier/électricien, boutique en ligne pour chocolatier/fleuriste, etc.).",
  "discoveryQuestions": [5 questions VOUVOYÉES (max 25 mots) à poser après l'ouverture. Couvrir : (1) premier ressenti visuel, (2) éléments à adapter, (3) comment ils gèrent leur présence en ligne aujourd'hui, (4) objectifs principaux du site, (5) timing de lancement.],
  "hooks": [3 phrases VOUVOYÉES (max 25 mots) pour gérer les prospects occupés : proposer de regarder ensemble maintenant, OU proposer un rappel téléphonique demain/après-demain. INTERDIT : visio/Zoom/Meet/Teams.],
  "objectionHandlers": [4 réponses VOUVOYÉES (max 40 mots) : (1) "Je vais y réfléchir" → proposer un rappel téléphonique précis, (2) "Trop cher" → 3× sans frais Klarna + ROI rapide, (3) "Envoyez-moi un mail" → proposer d'en parler maintenant puisqu'on est déjà au téléphone et qu'il a la maquette, (4) "Je le prends maintenant" → lien Stripe immédiat.]
}

Ton : pro, calme, respectueux, posé. Francophone France. Réponds UNIQUEMENT avec le JSON valide.`;

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

    if (!res.ok) return personalizedFallback;
    const data = await res.json();
    const raw = isOpenRouter ? data.choices?.[0]?.message?.content : data.content?.[0]?.text;
    if (!raw) return personalizedFallback;

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return personalizedFallback;
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

    const opening = clean(parsed.opening, 800) || personalizedFallback.opening;
    const discoveryQuestions = cleanArr(parsed.discoveryQuestions);
    const hooks = cleanArr(parsed.hooks);
    const objectionHandlers = cleanArr(parsed.objectionHandlers);

    return {
      opening,
      discoveryQuestions: discoveryQuestions.length >= 3 ? discoveryQuestions : personalizedFallback.discoveryQuestions,
      hooks: hooks.length >= 2 ? hooks : personalizedFallback.hooks,
      objectionHandlers: objectionHandlers.length >= 2 ? objectionHandlers : personalizedFallback.objectionHandlers,
    };
  } catch {
    return personalizedFallback;
  }
}
