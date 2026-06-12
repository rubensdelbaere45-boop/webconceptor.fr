/**
 * KLYORA DIRECTOR — Mock data (marketplace edition)
 * --------------------------------------------------------------
 * Each agent has a first name, a job title, a personal pitch
 * written to the business owner, a concrete fake metric and a
 * testimonial-flavoured detail. All copy is in French.
 */

export const DEMO_CREDENTIALS = {
    email: "tom@plomberie-martin.fr",
    temporaryPassword: "Tom4283!",
} as const;

export type Account = {
    firstName: string;
    businessName: string;
    city: string;
    email: string;
    tokensBalance: number;
    isFirstLogin: boolean;
};

export const MOCK_ACCOUNT: Account = {
    firstName: "Jean-Marc",
    businessName: "Plomberie Martin",
    city: "Lyon",
    email: "contact@plomberie-martin.fr",
    tokensBalance: 100,
    isFirstLogin: false,
};

export type AgentColor =
    | "blue"
    | "purple"
    | "amber"
    | "green"
    | "cyan"
    | "indigo";

export type AgentCategory =
    | "Publicité"
    | "Réputation"
    | "SEO"
    | "Communication"
    | "Packs";

export type Agent = {
    id: string;
    firstName: string;
    jobTitle: string;
    iconName:
        | "Target"
        | "TrendingUp"
        | "Star"
        | "MapPin"
        | "MessageCircle"
        | "Layers";
    /** DiceBear seed — produces a consistent illustrated character avatar. */
    avatarSeed: string;
    color: AgentColor;
    category: AgentCategory;
    intro: string;
    pitch: string;
    /** Short one-liner used on cards (more punchy than `pitch`). */
    tagline: string;
    metric: string;
    metricDetail: string;
    deliverables: string[];
    /** Live banner shown on the card ("3 chantiers signés cette nuit"). */
    liveStat: string;
    /** Social proof — number of similar artisans who hired this week. */
    weeklyHires: number;
    /** Success rate badge. */
    successRate: number;
    /** Conversion accelerator — true → show on Featured / Hot. */
    trending?: boolean;
    testimonial?: { quote: string; author: string };
    faq?: { q: string; a: string }[];
    cost: number;
    cta: string;
    featured?: boolean;
};

export const MOCK_AGENTS: Agent[] = [
    {
        id: "google_ads",
        firstName: "Léa",
        jobTitle: "Spécialiste Google Ads",
        iconName: "Target",
        avatarSeed: "Lea-Lawson-2046",
        color: "blue",
        category: "Publicité",
        tagline: "Je vous mets en tête de Google. Avant vos concurrents.",
        liveStat: "47 appels générés ce mois pour les plombiers de Lyon",
        weeklyHires: 183,
        successRate: 94,
        trending: true,
        intro: "Bonjour, je suis Léa.",
        pitch:
            "Je lance pour Plomberie Martin une campagne Google Ads ciblée sur les recherches « plombier Lyon » et « urgence fuite Lyon ». Vos clients vous trouveront avant vos concurrents.",
        metric: "+47 % d'appels en 30 jours",
        metricDetail:
            "Sur les 12 derniers clients que j'ai aidés, j'ai généré en moyenne 47 % d'appels entrants supplémentaires dès la première semaine.",
        deliverables: [
            "5 campagnes Google Ads optimisées",
            "Ciblage local Lyon + 30 km",
            "Reporting hebdomadaire",
            "Ajustement budget en temps réel",
        ],
        testimonial: {
            quote: "Léa a transformé notre prospection. On reçoit deux fois plus d'appels qu'avant.",
            author: "Karim B., plombier à Villeurbanne",
        },
        faq: [
            {
                q: "Quand verrai-je les premiers résultats ?",
                a: "Les premières prises de contact arrivent en général dans les 7 jours suivant le lancement.",
            },
            {
                q: "Faut-il prévoir un budget pub en plus ?",
                a: "Oui, je conseille un budget média de 300 à 800 € / mois selon votre zone. Tom vous accompagne pour le caler.",
            },
            {
                q: "Puis-je m'arrêter quand je veux ?",
                a: "Bien sûr. Vous arrêtez les campagnes en un clic depuis le tableau de bord, sans pénalité.",
            },
        ],
        cost: 100,
        cta: "Embaucher Léa",
    },
    {
        id: "meta_ads",
        firstName: "Maxime",
        jobTitle: "Stratège Meta Ads",
        iconName: "TrendingUp",
        avatarSeed: "Maxime-Blanc-1809",
        color: "purple",
        category: "Publicité",
        tagline: "Je remplis votre carnet de RDV avec Instagram et Facebook.",
        liveStat: "12 RDV pris à Lyon dans les 24 dernières heures",
        weeklyHires: 147,
        successRate: 91,
        trending: true,
        intro: "Je suis Maxime, ravi de vous rencontrer.",
        pitch:
            "Pour Plomberie Martin, je crée des publicités Instagram et Facebook qui touchent les habitants de Lyon en train de chercher un plombier. Visuels professionnels inclus.",
        metric: "+82 % de prises de rendez-vous",
        metricDetail:
            "Un plombier à Bordeaux a doublé ses rendez-vous mensuels en 6 semaines grâce à mes campagnes Meta.",
        deliverables: [
            "Pubs Insta + Facebook géolocalisées",
            "3 visuels créés par mes soins",
            "Retargeting des visiteurs du site",
            "Optimisation quotidienne",
        ],
        testimonial: {
            quote: "Maxime a doublé nos demandes en moins de deux mois. Sérieux et créatif.",
            author: "Élodie M., artisan à Bordeaux",
        },
        faq: [
            {
                q: "Vous créez vous-même les visuels ?",
                a: "Oui. Je vous propose 3 créations et nous gardons celles qui performent le mieux.",
            },
            {
                q: "Et si je n'ai pas de compte Meta Business ?",
                a: "Je vous accompagne pour le créer gratuitement avant le lancement.",
            },
            {
                q: "Quel budget média prévoir ?",
                a: "À partir de 200 € / mois. Je conseille 400 € pour des résultats vraiment visibles.",
            },
        ],
        cost: 100,
        cta: "Embaucher Maxime",
    },
    {
        id: "reputation",
        firstName: "Sophie",
        jobTitle: "Manager Réputation",
        iconName: "Star",
        avatarSeed: "Sophie-Bernard-4291",
        color: "amber",
        category: "Réputation",
        tagline: "Je transforme vos clients heureux en machine à 5 étoiles.",
        liveStat: "+1,4 étoile moyenne sur 90 jours dans la plomberie",
        weeklyHires: 98,
        successRate: 96,
        intro: "Bonjour, je m'appelle Sophie.",
        pitch:
            "Votre note Google actuelle (3,4/5) vous coûte des clients. Je contacte vos clients satisfaits par SMS pour qu'ils laissent un avis, et je désamorce les avis négatifs avant qu'ils nuisent à Plomberie Martin.",
        metric: "De 3,4 à 4,6 étoiles en 4 mois",
        metricDetail:
            "Un garage à Toulouse est passé de 3,2 à 4,7 étoiles avec ma méthode, doublant ainsi ses appels entrants.",
        deliverables: [
            "Sollicitation SMS post-intervention",
            "Réponse automatique aux avis",
            "Détection précoce des clients mécontents",
            "Page témoignages sur votre site",
        ],
        testimonial: {
            quote: "Sophie m'a sauvé la mise. Je suis passé de 3,2 à 4,8 étoiles en quatre mois.",
            author: "Yann L., garagiste à Toulouse",
        },
        faq: [
            {
                q: "Comment évitez-vous les faux avis ?",
                a: "Je ne sollicite que vos clients réels via un lien unique envoyé par SMS après leur intervention.",
            },
            {
                q: "Et si je reçois un avis négatif ?",
                a: "Je vous alerte immédiatement et propose une réponse à valider en 1 clic.",
            },
            {
                q: "Cela respecte-t-il les règles Google ?",
                a: "Oui. La méthode est 100 % conforme aux politiques Google et au RGPD.",
            },
        ],
        cost: 60,
        cta: "Embaucher Sophie",
    },
    {
        id: "seo",
        firstName: "Antoine",
        jobTitle: "Expert SEO Local",
        iconName: "MapPin",
        avatarSeed: "Antoine-Leclerc-3372",
        color: "green",
        category: "SEO",
        tagline: "Je vous propulse dans le top 3 Google de votre ville.",
        liveStat: "8 fiches Google passées top 3 cette semaine",
        weeklyHires: 124,
        successRate: 89,
        intro: "Je suis Antoine.",
        pitch:
            "J'optimise la fiche Google Business de Plomberie Martin pour qu'elle apparaisse dans le pack des 3 premiers résultats locaux à Lyon. Je publie aussi 2 posts par semaine sur votre fiche.",
        metric: "+340 % de vues sur la fiche Google",
        metricDetail:
            "Une boulangerie à Nantes a vu sa fiche Google passer de 200 à 880 vues par mois grâce à mon optimisation.",
        deliverables: [
            "Optimisation fiche Google Business",
            "2 posts hebdomadaires",
            "Photos professionnelles intégrées",
            "Réponse aux questions clients",
        ],
        testimonial: {
            quote: "Antoine nous a fait gagner la première place sur « boulanger Nantes ». Du jamais vu.",
            author: "Hélène D., boulangère à Nantes",
        },
        faq: [
            {
                q: "Combien de temps pour figurer dans le top 3 ?",
                a: "En moyenne 6 à 10 semaines selon la concurrence sur votre zone.",
            },
            {
                q: "Qu'écrivez-vous dans les posts ?",
                a: "Des contenus utiles : promos, conseils, photos de chantier, actualité de votre métier.",
            },
            {
                q: "Et si je n'ai pas encore de fiche Google ?",
                a: "Je la crée pour vous, en bonne et due forme, avant de commencer l'optimisation.",
            },
        ],
        cost: 80,
        cta: "Embaucher Antoine",
    },
    {
        id: "chatbot",
        firstName: "Camille",
        jobTitle: "Assistante Virtuelle",
        iconName: "MessageCircle",
        avatarSeed: "Camille-Roy-7155",
        color: "cyan",
        category: "Communication",
        tagline: "Je réponds à vos clients la nuit pendant que vous dormez.",
        liveStat: "284 conversations gérées sur la plateforme cette nuit",
        weeklyHires: 76,
        successRate: 88,
        intro: "Bonjour, je suis Camille.",
        pitch:
            "Je vais répondre aux clients de Plomberie Martin 24 h / 24 sur votre site. Tarifs, disponibilités, demande de devis : je gère tout et je transmets les leads chauds directement à votre téléphone.",
        metric: "73 % de leads convertis en RDV",
        metricDetail:
            "Un électricien à Strasbourg ne ratait plus jamais un client la nuit grâce à moi. 73 % des conversations finissaient en rendez-vous.",
        deliverables: [
            "Chatbot intégré à votre site",
            "Réponses 24 h / 24 personnalisées",
            "Capture des coordonnées",
            "Alertes SMS pour leads chauds",
        ],
        testimonial: {
            quote: "Camille répond la nuit pendant que je dors. Le matin, j'ai 3 RDV qui m'attendent.",
            author: "Bertrand P., électricien à Strasbourg",
        },
        faq: [
            {
                q: "Comment je l'installe sur mon site ?",
                a: "Je vous envoie un petit code à coller, ou je le fais avec votre webmaster en 10 minutes.",
            },
            {
                q: "Apprend-elle mon métier ?",
                a: "Oui. Je suis nourrie de vos tarifs, de votre planning et de vos services dès le 1er jour.",
            },
            {
                q: "Et si elle ne sait pas répondre ?",
                a: "Je propose à votre client de vous laisser un message vocal ou un SMS — vous reprenez la main.",
            },
        ],
        cost: 70,
        cta: "Embaucher Camille",
    },
    {
        id: "pack_local",
        firstName: "L'Équipe Complète",
        jobTitle: "Pack Domination Locale",
        iconName: "Layers",
        avatarSeed: "Equipe-Domination-9999",
        color: "indigo",
        category: "Packs",
        tagline: "Léa, Maxime, Sophie et Antoine. Ensemble. Pour dominer Lyon.",
        liveStat: "× 3,2 sur le CA moyen des packs actifs ce trimestre",
        weeklyHires: 42,
        successRate: 97,
        trending: true,
        intro: "Léa, Maxime, Sophie et Antoine, ensemble.",
        pitch:
            "Pour Plomberie Martin, nous mobilisons toute l'équipe : Léa lance Google Ads, Maxime active Meta, Sophie gère votre réputation, Antoine optimise votre SEO local. Une domination complète de Lyon.",
        metric: "× 3 sur le chiffre d'affaires en 3 mois",
        metricDetail:
            "Une menuiserie à Rennes a triplé son CA en 3 mois en activant l'équipe complète. Le ROI est de 7 € pour chaque euro investi.",
        deliverables: [
            "Tous les agents ci-dessus",
            "Coordination entre eux",
            "Rapport mensuel consolidé",
            "Tom suit personnellement votre dossier",
        ],
        testimonial: {
            quote: "On a triplé notre CA en un trimestre. C'est presque trop. Mais on prend.",
            author: "Vincent R., menuisier à Rennes",
        },
        faq: [
            {
                q: "Puis-je désactiver un agent du pack ?",
                a: "Oui, vous gardez la main sur chaque agent individuellement à tout moment.",
            },
            {
                q: "Quel est le retour sur investissement moyen ?",
                a: "× 5 à × 7 sur l'investissement crédits selon les secteurs (artisanat, restauration, commerce).",
            },
            {
                q: "Tom est-il vraiment impliqué ?",
                a: "Oui. Tom vous appelle une fois par mois pour faire le point et ajuster la stratégie.",
            },
        ],
        cost: 200,
        cta: "Embaucher l'équipe",
        featured: true,
    },
];

export const AGENT_CATEGORIES: AgentCategory[] = [
    "Publicité",
    "Réputation",
    "SEO",
    "Communication",
    "Packs",
];

/* ── Pains shown on /welcome ─────────────────────────────── */
export type Pain = {
    id: string;
    iconName: "Globe" | "Star" | "MapPin";
    color: AgentColor;
    title: string;
    description: string;
    agentId: string;
};

export const MOCK_PAINS: Pain[] = [
    {
        id: "p1",
        iconName: "Globe",
        color: "blue",
        title: "Vous êtes invisible sur Google",
        description:
            "70 % des recherches « plombier Lyon » aboutissent chez vos concurrents.",
        agentId: "google_ads",
    },
    {
        id: "p2",
        iconName: "Star",
        color: "amber",
        title: "Votre note Google est 3,4 / 5",
        description:
            "En dessous de 4, les clients filtrent et passent à la concurrence.",
        agentId: "reputation",
    },
    {
        id: "p3",
        iconName: "MapPin",
        color: "purple",
        title: "Vos concurrents à Lyon captent vos clients",
        description:
            "Une fiche Google Business optimisée vous remettrait dans le pack local.",
        agentId: "seo",
    },
];

/* ── Credit packs ────────────────────────────────────────── */
export type Pack = {
    id: string;
    name: string;
    credits: number;
    bonus: number;
    price: number;
    highlight?: boolean;
};

export const MOCK_PACKS: Pack[] = [
    { id: "p1", name: "Démarrage", credits: 100, bonus: 0, price: 9.99 },
    { id: "p2", name: "Confort", credits: 500, bonus: 50, price: 39.99 },
    {
        id: "p3",
        name: "Performance",
        credits: 1500,
        bonus: 250,
        price: 99.99,
        highlight: true,
    },
    { id: "p4", name: "Domination", credits: 5000, bonus: 1000, price: 299.99 },
];

/* ── Recent activity ─────────────────────────────────────── */
export type Activity = {
    id: string;
    label: string;
    delta: number;
    when: string;
};

export const MOCK_ACTIVITIES: Activity[] = [
    { id: "a1", label: "Connexion", delta: 0, when: "Il y a 2 minutes" },
    { id: "a2", label: "Pack Confort rechargé", delta: 550, when: "Hier à 17:22" },
    {
        id: "a3",
        label: "Léa embauchée (Google Ads)",
        delta: -100,
        when: "Hier à 17:25",
    },
    {
        id: "a4",
        label: "Sophie embauchée (Réputation)",
        delta: -60,
        when: "Hier à 17:28",
    },
    { id: "a5", label: "Connexion", delta: 0, when: "Hier à 09:14" },
    {
        id: "a6",
        label: "Mot de passe modifié",
        delta: 0,
        when: "Avant-hier à 14:02",
    },
    { id: "a7", label: "Compte créé", delta: 100, when: "Avant-hier à 13:58" },
];

/* ── Live ticker (platform-wide activity) ────────────────── */
export type Ticker = {
    id: string;
    agentSeed: string;
    label: string;
};

export const MOCK_TICKERS: Ticker[] = [
    { id: "t1", agentSeed: "Lea-Lawson-2046",       label: "Léa vient de générer 14 appels pour Plomberie Garnier à Toulouse" },
    { id: "t2", agentSeed: "Antoine-Leclerc-3372",  label: "Antoine a fait passer Garage Lemoine top 1 sur « garage Reims »" },
    { id: "t3", agentSeed: "Sophie-Bernard-4291",   label: "Sophie a obtenu un 5★ pour Boulangerie Dupont (+0,3 ⭐ ce mois)" },
    { id: "t4", agentSeed: "Maxime-Blanc-1809",     label: "Maxime a planifié 7 RDV cette nuit pour Salon Aurélie" },
    { id: "t5", agentSeed: "Camille-Roy-7155",      label: "Camille a converti 4 conversations en devis pour Élec Plus" },
    { id: "t6", agentSeed: "Lea-Lawson-2046",       label: "Léa fait + 32 % de leads vs la semaine dernière à Lyon" },
    { id: "t7", agentSeed: "Equipe-Domination-9999",label: "Pack Domination · CA × 2,8 sur 30 jours pour Menuiserie Vincent" },
    { id: "t8", agentSeed: "Antoine-Leclerc-3372",  label: "Antoine vient de publier 3 posts Google Business pour Pharmacie Lou" },
];

/* ── Platform stats (real-time counters) ─────────────────── */
export const MOCK_PLATFORM_STATS = {
    actionsLastHour: 1247,
    revenueGenerated: 2_840_000,  // € over last 30d, across the whole platform
    businessesActive: 4823,
    averageRoi: 4.7,              // ×
};

/* ── Chat threads for the Login animation ────────────────── */
export type ChatStep =
    | { role: "owner"; from: string; text: string }
    | { role: "agent"; agentSeed: string; agentName: string; color: AgentColor; text: string }
    | { role: "result"; agentName: string; color: AgentColor; metric: string; detail: string };

export type ChatThread = {
    id: string;
    business: string;
    city: string;
    steps: ChatStep[];
};

export const MOCK_CHAT_THREADS: ChatThread[] = [
    {
        id: "thread-lea",
        business: "Plomberie Martin",
        city: "Lyon",
        steps: [
            {
                role: "owner",
                from: "Jean-Marc",
                text: "Léa, lance 3 campagnes Google Ads pour « plombier Lyon ». Budget 400 €.",
            },
            {
                role: "agent",
                agentSeed: "Lea-Lawson-2046",
                agentName: "Léa",
                color: "blue",
                text: "C'est parti, Jean-Marc. Je cible Lyon + 30 km, je rédige les annonces et je lance.",
            },
            {
                role: "result",
                agentName: "Léa",
                color: "blue",
                metric: "+47 appels reçus",
                detail: "3 campagnes actives · première semaine",
            },
        ],
    },
    {
        id: "thread-sophie",
        business: "Garage Lemoine",
        city: "Reims",
        steps: [
            {
                role: "owner",
                from: "Karim",
                text: "Sophie, ma note Google est tombée à 3,4. Aide-moi.",
            },
            {
                role: "agent",
                agentSeed: "Sophie-Bernard-4291",
                agentName: "Sophie",
                color: "amber",
                text: "Je contacte vos 84 clients du mois par SMS. Je désamorce les avis 1★ avant publication.",
            },
            {
                role: "result",
                agentName: "Sophie",
                color: "amber",
                metric: "Note · 4,6 ⭐",
                detail: "+38 avis 5★ collectés · 90 jours",
            },
        ],
    },
    {
        id: "thread-antoine",
        business: "Boulangerie Dupont",
        city: "Nantes",
        steps: [
            {
                role: "owner",
                from: "Hélène",
                text: "Antoine, ma fiche Google est invisible. Top 3 sur « boulanger Nantes » ?",
            },
            {
                role: "agent",
                agentSeed: "Antoine-Leclerc-3372",
                agentName: "Antoine",
                color: "green",
                text: "J'optimise la fiche, j'ajoute photos pro et je publie 2 posts par semaine.",
            },
            {
                role: "result",
                agentName: "Antoine",
                color: "green",
                metric: "Position #1",
                detail: "Fiche vue 880 fois · +340 %",
            },
        ],
    },
    {
        id: "thread-camille",
        business: "Élec Plus",
        city: "Strasbourg",
        steps: [
            {
                role: "owner",
                from: "Bertrand",
                text: "Camille, je rate des appels la nuit. Tu peux gérer ?",
            },
            {
                role: "agent",
                agentSeed: "Camille-Roy-7155",
                agentName: "Camille",
                color: "cyan",
                text: "Je m'installe sur votre site ce soir. Tarifs, planning, devis : je prends tout.",
            },
            {
                role: "result",
                agentName: "Camille",
                color: "cyan",
                metric: "73 % en RDV",
                detail: "284 conversations gérées la nuit",
            },
        ],
    },
];

/* ── Business performance (your business, last 30d) ──────── */
export const MOCK_BUSINESS_STATS = {
    newCalls: 47,
    appointments: 28,
    revenueImpact: 8_900,   // €
    googleRating: 4.6,
    googleReviewCount: 124,
    googleViewsTrend: [42, 56, 71, 65, 89, 102, 118, 136, 158, 174, 198, 222],
    callsTrend: [3, 5, 4, 6, 8, 7, 12, 14, 13, 16, 19, 22],
};
