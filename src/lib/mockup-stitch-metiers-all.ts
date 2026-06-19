/**
 * Lib unique : génère une maquette Stitch FULL pour les 12 métiers restants.
 *
 * Structure identique à plombier-full/electricien-full/dentiste-full (déjà
 * validés par Tom), juste paramétrée par une config métier (couleur,
 * headline, services, image hero AIDA, etc.).
 *
 * Pixel-pixel inspiré des templates Stitch IA :
 * /Users/rubensdelbaere/Downloads/stitch_klyora_stitch_templates/
 *
 * Fixes appliqués partout :
 *  - Nav sticky top-[54px] z-40 (passe SOUS la sales-ui-bar de 54px)
 *  - Bandeau secondaire compact (py-2.5, plus de pt-24)
 *  - Horaires : table HTML structurée 1 jour par ligne
 */

export type MetierFullProspect = {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  hours?: string | null;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  reviews?: Array<{ author?: string; rating?: number; text?: string; timeAgo?: string }> | null;
};

type MetierConfig = {
  key: string;
  primary: string;     // hex
  accent: string;      // hex
  heroImage: string;   // AIDA Google URL
  badgeIcon: string;   // material symbol (filled)
  badgeText: string;   // "OSTÉOPATHIE D.O."
  headline: string;    // "Soulagez vos douleurs..."
  subheadline: string; // sous-titre hero
  ctaPrimary: string;  // bouton hero principal
  ctaSecondary: string;// bouton hero secondaire
  bannerIcon: string;  // material symbol pour le bandeau urgence
  bannerText: string;  // texte bandeau (uppercase)
  services: Array<{ icon: string; title: string; desc: string }>;
  pillars: Array<{ icon: string; title: string; desc: string }>;
  processSteps: Array<{ title: string; desc: string }>;
  sectionTitle: string;
  sectionIntro: string;
};

const CONFIGS: Record<string, MetierConfig> = {
  osteo: {
    key: "osteo",
    primary: "#0e7c3a",
    accent: "#84cc16",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCbK_050uEsko0yByJQV7zD630-9JBQ2y8mIPlYHPJZFii4dS7CrA_R3x2M1OVS7wPhWQpd4r1WigA3AROpj7jedQwc7VrHUxIdymXMteo05D6PFZ7iJGM6SfPaTjtgodZtVsHsjH2kKoD9DFCfD9ZsgKuBO94FsSUaxb-AukcvtsUYdyVMO0vMqhoyODux_N2tCBxH3GX78e26ZJiFmi693bKrNSUlUBlgGs0cSHz3e6EPN_kyYhIzpPGSZKWOoZjeZSORABr3-Sk",
    badgeIcon: "self_improvement",
    badgeText: "OSTÉOPATHIE D.O.",
    headline: "Soulagez vos douleurs durablement",
    subheadline: "Approche douce, manuelle et holistique. Du nourrisson au sportif, un soin personnalisé pour retrouver mobilité et bien-être.",
    ctaPrimary: "Prendre rendez-vous",
    ctaSecondary: "Découvrir l'approche",
    bannerIcon: "favorite",
    bannerText: "Consultations 6j/7 — Sur RDV — Conventionné mutuelles",
    services: [
      { icon: "psychology", title: "Cervicales & lombalgies", desc: "Traitement des douleurs du dos, du cou et des sciatiques par techniques manuelles douces." },
      { icon: "child_care", title: "Pédiatrie & nourrissons", desc: "Plagiocéphalie, troubles digestifs, sommeil agité : soin spécifique pour les tout-petits." },
      { icon: "directions_run", title: "Sportifs & blessures", desc: "Préparation, récupération, traumatismes : suivi adapté à votre pratique sportive." },
      { icon: "pregnant_woman", title: "Femmes enceintes", desc: "Accompagnement pré et post-partum pour soulager les tensions liées à la grossesse." },
    ],
    pillars: [
      { icon: "verified", title: "Diplôme d'État D.O.", desc: "5 ans de formation reconnue, registre des ostéopathes." },
      { icon: "favorite", title: "Approche bienveillante", desc: "Écoute, prise en charge globale, jamais de manipulation forcée." },
      { icon: "schedule", title: "Séances longues", desc: "45 min à 1h pour un soin approfondi et un vrai bilan." },
    ],
    processSteps: [
      { title: "Anamnèse complète", desc: "On comprend votre histoire, votre douleur, votre vie." },
      { title: "Examen & test", desc: "Tests palpatoires précis pour cibler la cause, pas le symptôme." },
      { title: "Soin manuel", desc: "Techniques douces adaptées à votre corps." },
      { title: "Conseils & suivi", desc: "Exercices, posture, retour à la mobilité." },
    ],
    sectionTitle: "Mes soins",
    sectionIntro: "Une ostéopathie sur-mesure pour chaque corps, chaque âge.",
  },
  garage: {
    key: "garage",
    primary: "#dc2626",
    accent: "#1f2937",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCIxWPEInypqdQ0PIq5DuB32L9p-8QTQzWn3VgVkusxnr5AeqjHpVElmhUF8lEM89TxVK87u_7lkhFPOrjkDEwk_OXjg7yk2izGzSbCzDknfxqYqivCf6QVXroUH1KkVBFcXBQHUpuCtOl687TuexY9eRFLsQPyAcky2JRlsba9A8JeOW3_5y31IWGXHlqgksMeYwuORQa1w-A5TL2VoucnedKfu_ZvOhyGj52vCx2ChwyNO8IumHo3-U4d1fS9gyOy2nRVymzJPlI",
    badgeIcon: "build_circle",
    badgeText: "GARAGE AUTOMOBILE",
    headline: "Votre voiture entre les mains d'experts",
    subheadline: "Mécanique, carrosserie, contrôle technique, pneus : on s'occupe de tout. Devis transparent, délais respectés, garantie écrite.",
    ctaPrimary: "Demander un devis",
    ctaSecondary: "Nos prestations",
    bannerIcon: "schedule",
    bannerText: "Devis gratuit en 24h — Véhicule de prêt disponible",
    services: [
      { icon: "construction", title: "Mécanique générale", desc: "Vidange, freins, embrayage, distribution, diagnostic électronique toutes marques." },
      { icon: "format_paint", title: "Carrosserie & peinture", desc: "Débosselage sans peinture, remplacement pare-chocs, peinture cabine pro." },
      { icon: "tire_repair", title: "Pneus & géométrie", desc: "Montage, équilibrage, parallélisme. Pneus toutes marques en stock." },
      { icon: "verified", title: "Contrôle technique", desc: "Pré-contrôle gratuit, contre-visite incluse, agréé centre auto." },
    ],
    pillars: [
      { icon: "engineering", title: "Mécaniciens certifiés", desc: "Équipe formée constructeur, mise à jour annuelle." },
      { icon: "receipt_long", title: "Devis transparent", desc: "Chaque pièce, chaque heure de main d'œuvre détaillée." },
      { icon: "shield", title: "Garantie 1 an", desc: "Pièces & main d'œuvre garanties, écrit." },
    ],
    processSteps: [
      { title: "Diagnostic offert", desc: "On identifie la panne avant tout devis." },
      { title: "Devis détaillé", desc: "Validation client avant la moindre intervention." },
      { title: "Réparation", desc: "Pièces d'origine ou équivalentes, au choix." },
      { title: "Restitution", desc: "Véhicule nettoyé, facture claire, garantie écrite." },
    ],
    sectionTitle: "Nos prestations",
    sectionIntro: "Tout pour votre véhicule, sous un même toit.",
  },
  institut: {
    key: "institut",
    primary: "#be185d",
    accent: "#fbcfe8",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDsZ4wmGWNbkMCswo2UjuFlzsPvQuqyBz2B9zCNHvaqjOTb9UkdXalTdzd_abW31QI3UxvibH1utP2ccZbuUUJzgdippGJAf5Afjtt-Ft91A14FsJxenLHAqazRWNhcbk_6NQMmNFiHWFz17SJZUObb1Lx0AYn5YOO3z6FueW1QBrTNcwj3dAKniMqjtb1ahKw-UoZ5vVkA2He8o7xjlB7tz9T6d1h9DH3X-tPSWsnuziXik0j8xlzYUtBxDFq37WZV5uKX4ZlWwvs",
    badgeIcon: "spa",
    badgeText: "INSTITUT DE BEAUTÉ",
    headline: "Votre parenthèse beauté & bien-être",
    subheadline: "Soins visage, épilations, massages, manucure : chaque protocole pensé pour révéler votre peau. Produits cosmétiques haute qualité.",
    ctaPrimary: "Réserver un soin",
    ctaSecondary: "Voir la carte",
    bannerIcon: "auto_awesome",
    bannerText: "Sur RDV — Carte cadeau disponible — Parking gratuit",
    services: [
      { icon: "face_retouching_natural", title: "Soins visage", desc: "Hydratation, anti-âge, peau grasse : protocole diagnostiqué par votre esthéticienne." },
      { icon: "spa", title: "Massages corps", desc: "Relaxant, drainant, californien : 30 à 90 min pour un vrai lâcher-prise." },
      { icon: "cut", title: "Épilations", desc: "Cire tiède orientale, électrique, ou définitive lumière pulsée." },
      { icon: "brush", title: "Manucure & pédicure", desc: "Pose vernis classique, semi-permanent, gel : finition impeccable." },
    ],
    pillars: [
      { icon: "school", title: "CAP esthétique +5 ans", desc: "Formation continue protocoles & matériels haut de gamme." },
      { icon: "spa", title: "Marques pro", desc: "Cosmétiques bio & laboratoires reconnus." },
      { icon: "favorite", title: "Hygiène irréprochable", desc: "Linge à usage unique, matériel stérilisé entre chaque cliente." },
    ],
    processSteps: [
      { title: "Bilan personnalisé", desc: "On analyse votre peau, vos attentes." },
      { title: "Protocole sur-mesure", desc: "Soin adapté à votre type de peau." },
      { title: "Moment d'évasion", desc: "Cabine cocon, ambiance feutrée." },
      { title: "Conseils maison", desc: "Routine adaptée, échantillons offerts." },
    ],
    sectionTitle: "La carte des soins",
    sectionIntro: "Une expérience sensorielle, des résultats visibles.",
  },
  cafe: {
    key: "cafe",
    primary: "#78350f",
    accent: "#fbbf24",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAM7ec9cTvoIf4Ow1Aocb-euegSRlLdEWhw_68RSjN008dDmDPERY2LM0K3OKM2v06ag5t8KSG33qWNJUCQy2ZNIiXlBvU8CAnWFWa5lxsYlgGVuwdd1Nppln04428UsmX-PcSV-fGdo6XMV52w1tq302mACqKcYvrWomqfxT_ya7d23_hnt0ixPhYcCXVoqzpvIqLjUZNeUvD55qKVCEBnF7DJyj5QOqNCLfERarJdDqWxQPjFY4ET0IEGFExwM40HW2fyVh_rsdM",
    badgeIcon: "local_cafe",
    badgeText: "CAFÉ DE QUARTIER",
    headline: "Votre café de quartier, votre seconde maison",
    subheadline: "Cafés de spécialité, pâtisseries maison, brunch du week-end : un lieu où on prend le temps. Wi-Fi, terrasse, ambiance cocooning.",
    ctaPrimary: "Voir la carte",
    ctaSecondary: "Réserver une table",
    bannerIcon: "schedule",
    bannerText: "Ouvert 7j/7 — Brunch tous les week-ends — Terrasse chauffée",
    services: [
      { icon: "local_cafe", title: "Cafés de spécialité", desc: "Grains torréfiés artisanalement, espresso, filtre V60, latte art." },
      { icon: "bakery_dining", title: "Pâtisseries maison", desc: "Cookies, banana bread, cheesecake : tout est fait sur place chaque matin." },
      { icon: "brunch_dining", title: "Brunch week-end", desc: "Œufs bénédicte, avocado toast, pancakes : sam-dim 10h-15h, sur réservation." },
      { icon: "free_breakfast", title: "Petit-déj rapide", desc: "Formule café + viennoiserie 5€, sur place ou à emporter." },
    ],
    pillars: [
      { icon: "eco", title: "Produits locaux", desc: "Lait fermier, farine bio, fruits de saison." },
      { icon: "wifi", title: "Wi-Fi & prises", desc: "Idéal pour télétravailler entre deux pauses." },
      { icon: "favorite", title: "Ambiance unique", desc: "Musique douce, plantes, banquettes velours." },
    ],
    processSteps: [
      { title: "Venez sans réserver", desc: "Sauf brunch : table toujours dispo en semaine." },
      { title: "Commandez au comptoir", desc: "Notre équipe vous guide sur la carte." },
      { title: "Installez-vous", desc: "Cosy à l'intérieur, ensoleillé en terrasse." },
      { title: "Repartez ressourcé", desc: "Carte fidélité : 10 cafés = 1 offert." },
    ],
    sectionTitle: "Notre carte",
    sectionIntro: "Du café d'exception aux pâtisseries maison.",
  },
  boulangerie: {
    key: "boulangerie",
    primary: "#92400e",
    accent: "#fbbf24",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCyabXdVsmaiXhTFJBZSIWuoqN8_BqcOg1vE_dX2ReL7oIpQp7Lpcg2RdZrbBZJMse5ggVWK9_3uqg5Nt2EpB_hz-_N2mqQ2jNGwv7xM7E6n5-9h1P8w6PIuPtG8C5PaC2dH-55YzF15IlKSP6XwSmNxE3TIxHgTQBmUG4fUdJM2Z2_sanaN_tzPTubFZ_kmNs2NEl0WrTH8ugMwSlgKW-nrcgrzypV1rxhatbHFi-smdM0mNw6dt6ZUxmGGqg68FY5gQ1uCJJc6Ug",
    badgeIcon: "bakery_dining",
    badgeText: "BOULANGERIE ARTISANALE",
    headline: "Le pain de tradition, au levain naturel",
    subheadline: "Pains au levain longue fermentation, viennoiseries pur beurre AOP, pâtisseries faites maison. Chaque produit naît dans notre fournil.",
    ctaPrimary: "Voir la carte",
    ctaSecondary: "Commander un gâteau",
    bannerIcon: "bakery_dining",
    bannerText: "Pétri chaque jour à 4h du matin — Fermé le lundi",
    services: [
      { icon: "bakery_dining", title: "Pains au levain", desc: "Tradition, complet, seigle, céréales : longue fermentation, croûte dorée." },
      { icon: "lunch_dining", title: "Viennoiseries pur beurre", desc: "Croissants, pains au chocolat, brioches : beurre AOP Charentes-Poitou." },
      { icon: "cake", title: "Pâtisseries fines", desc: "Tartes saison, éclairs, mille-feuilles : maîtrise chocolatière reconnue." },
      { icon: "icecream", title: "Gâteaux sur-commande", desc: "Anniversaire, baptême, mariage : pièces uniques sur devis." },
    ],
    pillars: [
      { icon: "verified", title: "Artisan boulanger", desc: "Diplôme + label Maître Restaurateur." },
      { icon: "eco", title: "Farines bio locales", desc: "Moulin partenaire à 15 km, blés français." },
      { icon: "schedule", title: "Cuit chaque jour", desc: "Pain frais matin & après-midi, jamais surgelé." },
    ],
    processSteps: [
      { title: "Choix des farines", desc: "Blé, seigle, épeautre du moulin local." },
      { title: "Pétrissage & repos", desc: "Levain mère, 24h de fermentation." },
      { title: "Façonnage main", desc: "Chaque pâton modelé à la main." },
      { title: "Cuisson four sole", desc: "Pierre chauffée à 240°C, croûte craquante." },
    ],
    sectionTitle: "Notre fournil",
    sectionIntro: "Le savoir-faire boulanger, au quotidien.",
  },
  menuisier: {
    key: "menuisier",
    primary: "#78350f",
    accent: "#d97706",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDXfmtm37jjyHhu838NIO7nJ6x2VwE0z2A9X2DJzRv-dxSOWp5kEGXv6_sIfxlSpFdfi-vWEcE0WxIP1UA4Gge6ACvFGYAOEG7bCbgHEFNHLl7s4TkZfIzHdYvPEIx8R2Xy6jcuIrAusSqBLb8GOI8b__vaF3QyM-FS-72nfcxsoeqQzmNA3WXpA8DqJceXO2CMfPXIF2HSCTERZo8gFS3VYpeFcSnzdgL7kYYElFi6rOUdc_O_YRh0F3GffpWJCTUuF-HtuNxPvDg",
    badgeIcon: "carpenter",
    badgeText: "MENUISERIE ARTISANALE",
    headline: "Le bois sur-mesure, façonné à la main",
    subheadline: "Cuisines, dressings, escaliers, mobilier unique : chaque pièce dessinée et fabriquée dans notre atelier. Bois français, finitions parfaites.",
    ctaPrimary: "Demander un devis",
    ctaSecondary: "Voir les réalisations",
    bannerIcon: "construction",
    bannerText: "Devis gratuit — Atelier visitable sur RDV — Livraison & pose incluses",
    services: [
      { icon: "kitchen", title: "Cuisines sur-mesure", desc: "Conception 3D, choix essences, électroménager intégré, pose comprise." },
      { icon: "checkroom", title: "Dressings & placards", desc: "Optimisation de chaque cm, aménagement intérieur modulable." },
      { icon: "stairs", title: "Escaliers bois", desc: "Droit, quart tournant, hélicoïdal : design contemporain ou classique." },
      { icon: "chair", title: "Mobilier unique", desc: "Tables, bibliothèques, bureaux : créations originales sur plans." },
    ],
    pillars: [
      { icon: "verified", title: "Compagnon menuisier", desc: "Tour de France des compagnons du Devoir." },
      { icon: "forest", title: "Bois PEFC français", desc: "Chêne, frêne, noyer : essences locales certifiées." },
      { icon: "shield", title: "Garantie 10 ans", desc: "Pièce maîtresse garantie décennale." },
    ],
    processSteps: [
      { title: "Rencontre & relevé", desc: "Visite sur place, mesures précises, écoute besoins." },
      { title: "Dessin & devis", desc: "Plans 3D, choix matériaux, devis détaillé." },
      { title: "Fabrication atelier", desc: "Chaque pièce assemblée à la main." },
      { title: "Pose chez vous", desc: "Installation soignée, ajustements, finitions." },
    ],
    sectionTitle: "Nos savoir-faire",
    sectionIntro: "Du croquis à la pose, tout fait main.",
  },
  fleuriste: {
    key: "fleuriste",
    primary: "#9d174d",
    accent: "#f9a8d4",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuC_zhS4WMkIeRLY9UMnlKlL8lEUhRx0evCaEa6ZQkF6e6ImKR9Rk6WbFLElLqtd77v_oQ9wrbrW8l-3NFbBz6NWY_YYxNBI8V_1PHnxVUdUE38dyeyMtxpuGO9pt6hXScL16r6c6f4GCjPMSc1LvQI84eC3nXO0f0X7jgOe2s1S41Nza0hzyhJHZLMJxm7CVrDRKr4shS2JYLcGB-cn9NRx4xH3U8WYUauJbEAyLhmO4zD7dklxig6lHYKSjeNi240VrQxPWLKDcoA",
    badgeIcon: "local_florist",
    badgeText: "ARTISAN FLEURISTE",
    headline: "Des fleurs qui racontent une histoire",
    subheadline: "Bouquets composés à la minute, mariages, deuil, abonnement bureau : fleurs fraîches du marché, savoir-faire artisanal, livraison rapide.",
    ctaPrimary: "Commander un bouquet",
    ctaSecondary: "Voir nos créations",
    bannerIcon: "local_florist",
    bannerText: "Livraison express 2h — Fleurs coupées du jour — Ouvert dimanche matin",
    services: [
      { icon: "card_giftcard", title: "Bouquets composés", desc: "Selon vos goûts, votre budget, l'occasion : composés sur place en quelques minutes." },
      { icon: "favorite", title: "Mariages & événements", desc: "Bouquet mariée, cérémonie, centres de table : devis sur-mesure." },
      { icon: "spa", title: "Deuil & sympathie", desc: "Couronnes, raquettes, gerbes : accompagnement délicat et professionnel." },
      { icon: "subscriptions", title: "Abonnement bureau", desc: "Composition fraîche livrée chaque semaine ou quinzaine, formules dès 30€." },
    ],
    pillars: [
      { icon: "school", title: "CAP fleuriste +10 ans", desc: "Formation continue tendances florales." },
      { icon: "eco", title: "Fleurs françaises", desc: "Producteurs locaux privilégiés, circuit court." },
      { icon: "schedule", title: "Arrivage 3×/sem", desc: "Toujours du frais, jamais plus de 48h en boutique." },
    ],
    processSteps: [
      { title: "On échange", desc: "Boutique, téléphone, web : on cerne votre besoin." },
      { title: "Composition main", desc: "Création unique selon saison & gamme." },
      { title: "Livraison soignée", desc: "Emballage protecteur, eau de fraîcheur." },
      { title: "Conseils tenue", desc: "Carte d'entretien pour fleurs longue durée." },
    ],
    sectionTitle: "Nos créations",
    sectionIntro: "Un bouquet, mille émotions.",
  },
  coiffeur: {
    key: "coiffeur",
    primary: "#1f2937",
    accent: "#fbbf24",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDMluk9R3koQVZ-vTqWOiSUqLYEP7cDnZMUuv7x8cdTg_Kfj9qHYNYWzf7LDIwV3OVEWNJtYkeqshJVFJok3zx5eN4B-8XitMrIxoAhlStsrTJAvGqQY-XUmywo490s7etISCipUfUAb6zbnysH7Wss74asuOA7JaHVA21Dj2R8opC0q8hrb-gfbjz_k2Jw_baFubWmfeHAqXZ2pZ5kucyeNuFimBNE22Lcld_q4p11q2Uxmeo4c5V5aRe9HY4gJfRW-9zX6dFvNbM",
    badgeIcon: "content_cut",
    badgeText: "SALON DE COIFFURE",
    headline: "Une coupe qui vous ressemble",
    subheadline: "Diagnostic capillaire personnalisé, coupes tendance ou classiques, colorations végétales : votre visage, votre style, notre expertise.",
    ctaPrimary: "Prendre RDV",
    ctaSecondary: "Voir les prestations",
    bannerIcon: "auto_awesome",
    bannerText: "Sur RDV ou sans — Carte fidélité — Conseils gratuits",
    services: [
      { icon: "content_cut", title: "Coupe femme & homme", desc: "Diagnostic visage, dégradés, carrés, dégradés américains : adapté à votre style." },
      { icon: "palette", title: "Coloration & balayage", desc: "Mèches, ombré, balayage californien : techniques pro pour un résultat naturel." },
      { icon: "auto_awesome", title: "Soins capillaires", desc: "Kératine, botox capillaire, rituels brillance : cheveux sublimés." },
      { icon: "favorite", title: "Coiffures mariée", desc: "Essai gratuit, déplacement possible : votre plus beau jour mérite la perfection." },
    ],
    pillars: [
      { icon: "school", title: "CAP/BP +8 ans", desc: "Formation continue tendances Paris/Milan." },
      { icon: "eco", title: "Produits respectueux", desc: "Marques pro sans sulfates, colorations végétales dispo." },
      { icon: "spa", title: "Moment cocon", desc: "Bac massant, café offert, ambiance détendue." },
    ],
    processSteps: [
      { title: "Diagnostic gratuit", desc: "Analyse cheveu, visage, attentes." },
      { title: "Proposition", desc: "Plusieurs options selon votre style." },
      { title: "Geste expert", desc: "Coupe, couleur, soin par votre coiffeur attitré." },
      { title: "Suivi maison", desc: "Conseils produits, prochaine prise de RDV." },
    ],
    sectionTitle: "Nos prestations",
    sectionIntro: "Coupe, couleur, soin : tout pour sublimer votre look.",
  },
  autoecole: {
    key: "autoecole",
    primary: "#1e40af",
    accent: "#fbbf24",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuAdzwmFZJ8c4XZs4wLrdHUEyEtqxUkW6Osm37Uz4RFPCQt6XJmXnd3EeTivTwzWtoFyXzQXxEp1bn4BS1o4OHB20J6_2RkvPrNB6X79zphERgI4nagg5k5Ufr5U6lzYPIXVx6cKJJIdi9FM6eFP4AHx4SB4MtDw3XdSfRP3nDV5LajAgwQcTYDZR6jnvAh1o0sBEEaxDlwevw1M-MY97Q6WNE6xYFH1pMSx9lihumupQPubita_PyKC8iNxX7TQKAffUz-n96W0au0",
    badgeIcon: "directions_car",
    badgeText: "AUTO-ÉCOLE AGRÉÉE",
    headline: "Votre permis, sans stress, à votre rythme",
    subheadline: "Code en ligne illimité, leçons individuelles, simulateur, conduite accompagnée : la formation qui s'adapte à vous, pas l'inverse.",
    ctaPrimary: "S'inscrire",
    ctaSecondary: "Tarifs & forfaits",
    bannerIcon: "verified",
    bannerText: "Agréée préfecture — Financement CPF & 1€/jour — Taux réussite 78%",
    services: [
      { icon: "directions_car", title: "Permis B (voiture)", desc: "Boîte manuelle ou auto, leçons 1h ou 2h, dispo soir & samedi." },
      { icon: "motorcycle", title: "Permis A (moto)", desc: "Plateau + circulation, 50 cm³ à 1000 cm³, formation 7h." },
      { icon: "school", title: "Code en ligne", desc: "Accès illimité 6 mois, tests illimités, suivi prof." },
      { icon: "family_restroom", title: "Conduite accompagnée", desc: "AAC dès 15 ans, accompagnement complet jusqu'à 18 ans." },
    ],
    pillars: [
      { icon: "verified", title: "Agrément préfectoral", desc: "Numéro affiché, contrôle annuel." },
      { icon: "favorite", title: "Bienveillance", desc: "Pédagogie patiente, jamais de jugement." },
      { icon: "schedule", title: "Flexibilité horaire", desc: "Soir, samedi, vacances scolaires." },
    ],
    processSteps: [
      { title: "Inscription rapide", desc: "Dossier en 15 min, NEPH livré sous 7j." },
      { title: "Code à votre rythme", desc: "En ligne 24/7 + cours en salle." },
      { title: "Conduite", desc: "20h min, plus selon besoin, jamais de pression." },
      { title: "Examen", desc: "Pré-examen blanc, accompagnement le jour J." },
    ],
    sectionTitle: "Nos formations",
    sectionIntro: "De l'inscription au permis en poche.",
  },
  epicerie: {
    key: "epicerie",
    primary: "#65a30d",
    accent: "#fbbf24",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuDWuHoOJ08J2l6VU_0uIKzgE7X_jC8JCs_fP28epRLLnizYv9Y1yTtLRL2x_TCjRWm9XUB6FellaL42x5R7ssJzW8SIeXGjxuAQIPAvMGEJAmD60O54c0n8FcU0_M4Iwf_I7uH1DvQiVvH_wcnnYvmpEiHxxEPYA31qkXpf-UioAB9GgHsmvuXipzw-AnbI9e8A20GzvDKfXGGdzcQQo0GcvBdoJ7mSbZDY9PhhUtK4Uq34Hkx2hvkhvEvucvYIOvXHaA4lum-UWHE",
    badgeIcon: "storefront",
    badgeText: "ÉPICERIE FINE",
    headline: "Le meilleur du terroir, sélectionné pour vous",
    subheadline: "Produits d'exception : fromages affinés, charcuteries de producteurs, huiles d'olive, vins natures. Des saveurs introuvables ailleurs.",
    ctaPrimary: "Découvrir la cave",
    ctaSecondary: "Coffrets cadeaux",
    bannerIcon: "eco",
    bannerText: "Producteurs sélectionnés — Coffrets cadeaux — Livraison locale",
    services: [
      { icon: "restaurant", title: "Fromages affinés", desc: "Plus de 80 références : AOP, fermiers, raretés. Conseils & dégustation." },
      { icon: "kebab_dining", title: "Charcuteries d'exception", desc: "Jambon ibérique 36 mois, saucissons artisanaux, terrines maison." },
      { icon: "wine_bar", title: "Vins natures", desc: "Vignerons engagés, bio & biodynamie, accord mets-vins offert." },
      { icon: "card_giftcard", title: "Coffrets cadeaux", desc: "Composés sur-mesure dès 35€, livraison Paris, France & Europe." },
    ],
    pillars: [
      { icon: "eco", title: "Producteurs choisis", desc: "Visite des fermes, sélection rigoureuse." },
      { icon: "favorite", title: "Conseil expert", desc: "Sommelier & maître-fromager à votre écoute." },
      { icon: "schedule", title: "Arrivages hebdo", desc: "Toujours du frais, rotation rapide." },
    ],
    processSteps: [
      { title: "Venez goûter", desc: "Dégustation gratuite chaque samedi." },
      { title: "Conseils", desc: "Accord mets-vins, idées cadeau." },
      { title: "Emballage soigné", desc: "Coffret bois ou kraft selon occasion." },
      { title: "Livraison", desc: "Express local, Chronofresh national." },
    ],
    sectionTitle: "Notre sélection",
    sectionIntro: "Des produits choisis avec passion.",
  },
  couvreur: {
    key: "couvreur",
    primary: "#1f2937",
    accent: "#dc2626",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuBrsGv3sB-uHMwfsv49HeoxbR6BCarAVB17fN43RCQyfH6C76X0K65SUWD9wt8q7WpSMtEQAqMaVbA6lEWmV-E1Fc97DVTWJMt6psWc72jAluy9G0asoygrudMeCa-TxZMFX8N_Vts_krqd7JOtMdYqL_NZ_PKbckzft2gQfVPSe0tGoKAkbt0-gDX2IGmaatWjQ9WthD5pGmyrfTefchB030WeA3IZ20y-Ycvds3F9IpcHjh3ZlB2uC9G10A67AouA6ey6Vkf3rx8",
    badgeIcon: "roofing",
    badgeText: "COUVREUR-ZINGUEUR",
    headline: "Votre toit, notre engagement",
    subheadline: "Réfection complète, dépannage urgent, isolation, zinguerie : 25 ans d'expertise pour des toitures qui durent. Devis gratuit, intervention rapide.",
    ctaPrimary: "Devis gratuit",
    ctaSecondary: "Urgence fuite",
    bannerIcon: "warning",
    bannerText: "Intervention urgence 24h — RGE Qualibat — Assurance décennale",
    services: [
      { icon: "roofing", title: "Réfection toiture", desc: "Tuile, ardoise, zinc : démontage, isolation, repose à neuf, garantie 10 ans." },
      { icon: "water_drop", title: "Dépannage fuites", desc: "Intervention sous 24h, recherche d'origine, réparation immédiate." },
      { icon: "thermostat", title: "Isolation combles", desc: "ITE, soufflage, sarking : aides MaPrimeRénov' éligibles." },
      { icon: "construction", title: "Zinguerie", desc: "Gouttières, chéneaux, noues : zinc & cuivre haute qualité." },
    ],
    pillars: [
      { icon: "verified", title: "RGE Qualibat", desc: "Certification artisan reconnu garant environnement." },
      { icon: "shield", title: "Décennale", desc: "Toutes interventions couvertes 10 ans." },
      { icon: "engineering", title: "25 ans métier", desc: "Équipe formée, sécurité au top." },
    ],
    processSteps: [
      { title: "Diagnostic offert", desc: "Inspection toiture, photos détaillées." },
      { title: "Devis chiffré", desc: "Détail par poste, options aides." },
      { title: "Intervention", desc: "Échafaudage sécurisé, chantier propre." },
      { title: "Réception", desc: "Visite finale, garantie écrite remise." },
    ],
    sectionTitle: "Nos interventions",
    sectionIntro: "Toiture neuve, dépannage ou isolation : on s'occupe de tout.",
  },
  veterinaire: {
    key: "veterinaire",
    primary: "#0e7c3a",
    accent: "#84cc16",
    heroImage: "https://lh3.googleusercontent.com/aida-public/AB6AXuCCgOthr7nPcMYeMqQ9qw4iPkFcNK-yPe1dJruOyIath30tJy43QEuhe9XPpB0jpmkMSbSVyCGxcWkn8aROGf67Th21aCbpvZ8dPYHP4GXb7xBwOWzmCs2dNAWy-YgxQzsKwRUTwC4NrN8Trug_NumIJNF-oCbXhb204NQcFMqKRWD0_1A73Glyllneufo5f6IJ7qB74vRtQP7hBXZfMz66SVttcwg8OkaJpWnHcXE4ib4aHL5BxQTL6QsPSjAA8DUd7D7g90FFFtI",
    badgeIcon: "pets",
    badgeText: "CABINET VÉTÉRINAIRE",
    headline: "Pour la santé de vos compagnons",
    subheadline: "Consultations, vaccins, chirurgie, urgences : votre clinique vétérinaire complète. Équipe bienveillante, équipement moderne, suivi personnalisé.",
    ctaPrimary: "Prendre rendez-vous",
    ctaSecondary: "Urgences 24/7",
    bannerIcon: "favorite",
    bannerText: "Urgences 24/7 — Hospitalisation — Carte de fidélité",
    services: [
      { icon: "vaccines", title: "Vaccins & prévention", desc: "Vaccination annuelle, vermifuges, anti-puces : plan santé personnalisé." },
      { icon: "stethoscope", title: "Consultations", desc: "Médecine générale, dermatologie, comportement : 30 min pour bien faire." },
      { icon: "monitor_heart", title: "Chirurgie", desc: "Stérilisation, tumeurs, traumatos : bloc opératoire moderne, anesthésie sécurisée." },
      { icon: "emergency", title: "Urgences 24/7", desc: "Ligne directe, vétérinaire sur place le week-end et les jours fériés." },
    ],
    pillars: [
      { icon: "school", title: "Docteurs vétérinaires", desc: "Diplôme d'État, formation continue chaque année." },
      { icon: "favorite", title: "Bienveillance animale", desc: "Manipulation douce, sans contention forcée, friandises pour calmer." },
      { icon: "medical_services", title: "Équipement moderne", desc: "Échographie, radio numérique, bloc op, laboratoire sur place." },
    ],
    processSteps: [
      { title: "Prise de RDV", desc: "Tél, en ligne, ou direct : sous 48h habituellement." },
      { title: "Consultation", desc: "Examen complet, dialogue avec maître." },
      { title: "Diagnostic & soin", desc: "Examens complémentaires si besoin, devis transparent." },
      { title: "Suivi", desc: "Appel post-soin, rappels vaccins automatiques." },
    ],
    sectionTitle: "Nos soins",
    sectionIntro: "Médecine, chirurgie, urgences : votre clinique complète.",
  },
};

const escape = (s: string | null | undefined): string =>
  (s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

function getConfig(metierKey: string): MetierConfig | null {
  return CONFIGS[metierKey] || null;
}

export function isMetierSupported(key: string): boolean {
  return key in CONFIGS;
}

export function generateStitchMetierFullMockupHtml(p: MetierFullProspect, metierKey: string): string {
  const config = getConfig(metierKey);
  if (!config) throw new Error(`Métier inconnu : ${metierKey}`);

  const name = escape(p.name);
  const city = escape(p.city || "");
  const address = escape(p.address || "");
  const phone = escape(p.phone || "");
  const phoneNoSpace = (p.phone || "").replace(/\s/g, "");
  const email = escape(p.email || "");
  const fullAddress = address ? `${address}${city ? `, ${city}` : ""}` : city;
  const navQuery = address ? encodeURIComponent(`${address} ${city}`) : encodeURIComponent(name);

  // Horaires : table HTML structurée (1 jour par ligne)
  const hoursLines = (p.hours || "")
    .split(/\s*\|\s*/)
    .map(s => s.trim())
    .filter(Boolean);
  const hoursHtml = hoursLines.length ? `
    <div class="bg-white border border-outline-variant p-8 paper-shadow text-left">
      <div class="flex items-center gap-3 mb-5">
        <span class="material-symbols-outlined text-[${config.primary}] text-3xl" style="font-variation-settings: 'FILL' 1;">schedule</span>
        <h3 class="font-headline-lg text-xl">Horaires</h3>
      </div>
      <table class="w-full text-sm">
        <tbody>
          ${hoursLines.map(line => {
            const m = line.match(/^([^:]+):\s*(.+)$/);
            if (!m) return `<tr><td colspan="2" class="py-1.5 text-on-surface-variant">${escape(line)}</td></tr>`;
            const day = escape(m[1].trim());
            const hrs = escape(m[2].trim());
            const isClosed = /ferm[ée]/i.test(hrs);
            return `<tr class="border-b border-outline-variant/40 last:border-0">
              <td class="py-2 capitalize font-medium text-on-surface w-1/3">${day}</td>
              <td class="py-2 text-on-surface-variant ${isClosed ? 'italic opacity-60' : ''}">${hrs}</td>
            </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>` : "";

  // Avis Google : top 3 avec étoiles
  const reviews = (p.reviews || []).filter(r => r.text && (r.text || "").length > 30).slice(0, 3);
  const ratingBadge = (p.google_rating && p.google_reviews_count) ? `
    <div class="inline-flex items-center gap-3 bg-[${config.primary}]/10 px-6 py-3 rounded-full mb-8">
      <div class="flex gap-0.5">
        ${[1,2,3,4,5].map(i => `<span class="material-symbols-outlined text-[${config.accent}] text-lg" style="font-variation-settings: 'FILL' 1;">star</span>`).join("")}
      </div>
      <span class="font-bold text-[${config.primary}]">${p.google_rating.toFixed(1)} / 5</span>
      <span class="text-on-surface-variant text-sm">— ${p.google_reviews_count} avis Google</span>
    </div>` : "";

  const reviewsHtml = reviews.length ? `
    <section class="bg-[${config.primary}]/5 py-section-padding px-mobile-padding md:px-desktop-padding">
      <div class="max-w-container-max mx-auto text-center">
        <span class="material-symbols-outlined text-[${config.primary}] text-5xl mb-4" style="font-variation-settings: 'FILL' 1;">verified</span>
        <h2 class="font-headline-lg text-4xl md:text-5xl mb-4">Ils nous font confiance</h2>
        ${ratingBadge}
        <div class="grid md:grid-cols-3 gap-8 mt-12 text-left">
          ${reviews.map(r => `
            <div class="bg-white p-8 paper-shadow rounded-lg">
              <div class="flex gap-0.5 mb-4">
                ${[1,2,3,4,5].map(i => `<span class="material-symbols-outlined text-[${config.accent}] text-base" style="font-variation-settings: 'FILL' 1;">star</span>`).join("")}
              </div>
              <p class="text-on-surface italic mb-6 leading-relaxed">"${escape((r.text || "").slice(0, 240))}${(r.text || "").length > 240 ? "…" : ""}"</p>
              <div class="flex items-center gap-3 pt-4 border-t border-outline-variant">
                <div class="w-10 h-10 rounded-full bg-[${config.primary}] text-white flex items-center justify-center font-bold">
                  ${escape((r.author || "?").charAt(0).toUpperCase())}
                </div>
                <div>
                  <div class="font-semibold text-sm">${escape(r.author || "Client")}</div>
                  ${r.timeAgo ? `<div class="text-xs text-on-surface-variant">${escape(r.timeAgo)}</div>` : ""}
                </div>
              </div>
            </div>`).join("")}
        </div>
      </div>
    </section>` : "";

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${name} — ${escape(config.badgeText)}</title>
<link rel="preconnect" href="https://fonts.gstatic.com/" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" />
<link href="https://fonts.googleapis.com/icon?family=Material+Symbols+Outlined" rel="stylesheet" />
<script src="https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio"></script>
<script>
tailwind.config = {
  theme: {
    extend: {
      colors: {
        'primary': '${config.primary}',
        'on-primary': '#FFFFFF',
        'primary-container': '${config.primary}1A',
        'on-primary-container': '${config.primary}',
        'secondary': '${config.accent}',
        'background': '#FFFBF7',
        'surface': '#FFFBF7',
        'on-surface': '#1f1d1c',
        'on-surface-variant': '#5b5957',
        'outline': '#88827e',
        'outline-variant': '#e8e2dd',
      },
      fontFamily: {
        'display': ['"EB Garamond"', 'serif'],
        'body': ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '4rem', letterSpacing: '-0.02em' }],
        'headline-lg': ['2.25rem', { lineHeight: '2.75rem', letterSpacing: '-0.01em' }],
      },
      maxWidth: { 'container-max': '1280px' },
      padding: {
        'section-padding': '5rem',
        'mobile-padding': '1.5rem',
        'desktop-padding': '3rem',
      }
    }
  }
}
</script>
<style>
body { font-family: 'Plus Jakarta Sans', sans-serif; background: #FFFBF7; color: #1f1d1c; }
.font-headline-lg { font-family: 'EB Garamond', serif; font-weight: 700; }
.font-display-lg { font-family: 'EB Garamond', serif; font-weight: 800; letter-spacing: -0.02em; }
.font-label-lg { font-family: 'Plus Jakarta Sans', sans-serif; font-weight: 600; }
.paper-shadow { box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06); }
.btn-primary { background:${config.primary}; color:#fff; padding:.85rem 1.75rem; border-radius:9999px; font-weight:600; transition:all .25s; display:inline-flex; align-items:center; gap:.5rem; }
.btn-primary:hover { background:${config.accent}; transform:translateY(-2px); box-shadow:0 8px 20px ${config.primary}40; }
.btn-secondary { background:transparent; color:${config.primary}; padding:.85rem 1.75rem; border-radius:9999px; font-weight:600; border:1.5px solid ${config.primary}; transition:all .25s; display:inline-flex; align-items:center; gap:.5rem; }
.btn-secondary:hover { background:${config.primary}; color:#fff; }
.hero-gradient { background:linear-gradient(135deg, ${config.primary}05 0%, ${config.accent}10 100%); }
.section-divider { background:linear-gradient(90deg, transparent, ${config.primary}30, transparent); height:1px; }
.material-symbols-outlined { font-variation-settings:'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24; }
</style>
</head>
<body class="bg-background text-on-surface">

<!-- NAV (sticky sous la sales-ui-bar 54px) -->
<nav class="sticky top-[54px] w-full z-40 bg-surface/95 backdrop-blur-sm border-b border-outline-variant shadow-sm">
  <div class="max-w-container-max mx-auto px-mobile-padding md:px-desktop-padding flex items-center justify-between h-20">
    <a href="#hero" class="flex items-center gap-3">
      <span class="material-symbols-outlined text-[${config.primary}] text-3xl" style="font-variation-settings: 'FILL' 1;">${config.badgeIcon}</span>
      <div>
        <div class="font-display-lg text-2xl text-on-surface leading-none">${name}</div>
        ${city ? `<div class="text-xs text-on-surface-variant tracking-wider uppercase mt-1">${city}</div>` : ""}
      </div>
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a href="#services" class="text-sm font-label-lg text-on-surface-variant hover:text-[${config.primary}] transition">${escape(config.sectionTitle)}</a>
      <a href="#process" class="text-sm font-label-lg text-on-surface-variant hover:text-[${config.primary}] transition">Comment ça marche</a>
      <a href="#avis" class="text-sm font-label-lg text-on-surface-variant hover:text-[${config.primary}] transition">Avis</a>
      <a href="#contact" class="text-sm font-label-lg text-on-surface-variant hover:text-[${config.primary}] transition">Contact</a>
      ${phoneNoSpace ? `<a href="tel:${phoneNoSpace}" class="btn-primary text-sm py-2.5">
        <span class="material-symbols-outlined text-base" style="font-variation-settings: 'FILL' 1;">call</span>
        ${phone}
      </a>` : ""}
    </div>
  </div>
</nav>

<!-- BANDEAU CONTEXTE (compact) -->
<div class="bg-[${config.primary}] text-white py-2.5 px-mobile-padding md:px-desktop-padding text-center shadow-md">
  <div class="max-w-container-max mx-auto flex items-center justify-center gap-2">
    <span class="material-symbols-outlined text-[${config.accent}] text-base" style="font-variation-settings: 'FILL' 1;">${config.bannerIcon}</span>
    <span class="font-label-lg tracking-widest uppercase text-xs md:text-sm">${escape(config.bannerText)}</span>
  </div>
</div>

<main>

<!-- HERO -->
<section id="hero" class="hero-gradient py-20 md:py-28 px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto grid md:grid-cols-2 gap-12 items-center">
    <div>
      <div class="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full mb-6 paper-shadow">
        <span class="material-symbols-outlined text-[${config.primary}] text-base" style="font-variation-settings: 'FILL' 1;">${config.badgeIcon}</span>
        <span class="text-xs font-label-lg tracking-widest uppercase text-on-surface-variant">${escape(config.badgeText)}</span>
      </div>
      <h1 class="font-display-lg text-5xl md:text-6xl lg:text-7xl text-on-surface leading-tight mb-6">
        ${escape(config.headline)}
      </h1>
      <p class="text-lg md:text-xl text-on-surface-variant leading-relaxed mb-10 max-w-xl">
        ${escape(config.subheadline)}
      </p>
      <div class="flex flex-wrap gap-4">
        ${phoneNoSpace ? `<a href="tel:${phoneNoSpace}" class="btn-primary">
          <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">call</span>
          ${escape(config.ctaPrimary)}
        </a>` : ""}
        <a href="#services" class="btn-secondary">
          ${escape(config.ctaSecondary)}
          <span class="material-symbols-outlined">arrow_forward</span>
        </a>
      </div>
      ${ratingBadge}
    </div>
    <div class="relative">
      <div class="aspect-[4/5] rounded-3xl overflow-hidden paper-shadow">
        <img src="${config.heroImage}" alt="${name}" class="w-full h-full object-cover" />
      </div>
      <div class="absolute -bottom-6 -left-6 bg-white p-5 rounded-2xl paper-shadow max-w-xs">
        <div class="flex items-center gap-3">
          <span class="material-symbols-outlined text-[${config.accent}] text-3xl" style="font-variation-settings: 'FILL' 1;">verified</span>
          <div>
            <div class="font-bold text-sm">Professionnel reconnu</div>
            <div class="text-xs text-on-surface-variant">${city ? `${city} — ` : ""}Engagement qualité</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- SERVICES BENTO -->
<section id="services" class="py-section-padding px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto">
    <div class="text-center mb-16">
      <span class="text-xs font-label-lg tracking-widest uppercase text-[${config.primary}]">Notre savoir-faire</span>
      <h2 class="font-headline-lg text-4xl md:text-5xl mt-2 mb-4">${escape(config.sectionTitle)}</h2>
      <p class="text-on-surface-variant max-w-2xl mx-auto">${escape(config.sectionIntro)}</p>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      ${config.services.map(s => `
        <div class="bg-white p-8 paper-shadow rounded-2xl border border-outline-variant hover:border-[${config.primary}] transition group">
          <div class="w-14 h-14 rounded-xl bg-[${config.primary}]/10 flex items-center justify-center mb-5 group-hover:bg-[${config.primary}] transition">
            <span class="material-symbols-outlined text-[${config.primary}] text-3xl group-hover:text-white transition" style="font-variation-settings: 'FILL' 1;">${s.icon}</span>
          </div>
          <h3 class="font-headline-lg text-xl mb-3">${escape(s.title)}</h3>
          <p class="text-sm text-on-surface-variant leading-relaxed">${escape(s.desc)}</p>
        </div>`).join("")}
    </div>
  </div>
</section>

<!-- COMMENT ÇA MARCHE -->
<section id="process" class="bg-[${config.primary}]/5 py-section-padding px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto">
    <div class="text-center mb-16">
      <span class="text-xs font-label-lg tracking-widest uppercase text-[${config.primary}]">Notre méthode</span>
      <h2 class="font-headline-lg text-4xl md:text-5xl mt-2 mb-4">Comment ça marche</h2>
      <p class="text-on-surface-variant max-w-2xl mx-auto">Un parcours clair, du premier contact à votre satisfaction.</p>
    </div>
    <div class="grid md:grid-cols-4 gap-6">
      ${config.processSteps.map((step, i) => `
        <div class="relative">
          <div class="bg-white p-8 paper-shadow rounded-2xl h-full">
            <div class="w-12 h-12 rounded-full bg-[${config.primary}] text-white flex items-center justify-center font-display-lg text-xl mb-5">${i + 1}</div>
            <h3 class="font-headline-lg text-lg mb-3">${escape(step.title)}</h3>
            <p class="text-sm text-on-surface-variant leading-relaxed">${escape(step.desc)}</p>
          </div>
          ${i < config.processSteps.length - 1 ? `<div class="hidden md:block absolute top-1/2 -right-3 w-6 h-px bg-[${config.primary}]/30"></div>` : ""}
        </div>`).join("")}
    </div>
  </div>
</section>

<!-- POURQUOI NOUS -->
<section class="py-section-padding px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto">
    <div class="text-center mb-16">
      <span class="text-xs font-label-lg tracking-widest uppercase text-[${config.primary}]">Nos engagements</span>
      <h2 class="font-headline-lg text-4xl md:text-5xl mt-2 mb-4">Pourquoi nous choisir</h2>
    </div>
    <div class="grid md:grid-cols-3 gap-8">
      ${config.pillars.map(p => `
        <div class="text-center">
          <div class="w-20 h-20 mx-auto rounded-full bg-[${config.primary}]/10 flex items-center justify-center mb-6">
            <span class="material-symbols-outlined text-[${config.primary}] text-4xl" style="font-variation-settings: 'FILL' 1;">${p.icon}</span>
          </div>
          <h3 class="font-headline-lg text-2xl mb-3">${escape(p.title)}</h3>
          <p class="text-on-surface-variant leading-relaxed">${escape(p.desc)}</p>
        </div>`).join("")}
    </div>
  </div>
</section>

${reviewsHtml ? `<div id="avis">${reviewsHtml}</div>` : ""}

<!-- CTA FINALE -->
<section class="bg-[${config.primary}] text-white py-section-padding px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto text-center">
    <h2 class="font-display-lg text-4xl md:text-6xl mb-6">Prêt à passer à l'action ?</h2>
    <p class="text-xl text-white/90 max-w-2xl mx-auto mb-10">
      Contactez ${name}${city ? ` à ${city}` : ""} dès aujourd'hui. Notre équipe vous répond rapidement.
    </p>
    <div class="flex flex-wrap justify-center gap-4">
      ${phoneNoSpace ? `<a href="tel:${phoneNoSpace}" class="bg-white text-[${config.primary}] px-8 py-4 rounded-full font-bold hover:bg-[${config.accent}] hover:text-white transition inline-flex items-center gap-2">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">call</span>
        ${phone}
      </a>` : ""}
      ${email ? `<a href="mailto:${email}" class="bg-white/10 backdrop-blur border border-white/30 text-white px-8 py-4 rounded-full font-bold hover:bg-white/20 transition inline-flex items-center gap-2">
        <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">mail</span>
        Nous écrire
      </a>` : ""}
    </div>
  </div>
</section>

<!-- CONTACT + HORAIRES -->
<section id="contact" class="py-section-padding px-mobile-padding md:px-desktop-padding bg-[#FFFBF7]">
  <div class="max-w-container-max mx-auto">
    <div class="text-center mb-12">
      <span class="text-xs font-label-lg tracking-widest uppercase text-[${config.primary}]">Nous trouver</span>
      <h2 class="font-headline-lg text-4xl md:text-5xl mt-2">Contact & horaires</h2>
    </div>
    <div class="grid md:grid-cols-2 lg:grid-cols-${hoursHtml ? '4' : '3'} gap-6">
      ${phoneNoSpace ? `<div class="bg-white border border-outline-variant p-8 paper-shadow text-center">
        <span class="material-symbols-outlined text-[${config.primary}] text-4xl mb-4 inline-block" style="font-variation-settings: 'FILL' 1;">call</span>
        <h3 class="font-headline-lg text-xl mb-2">Téléphone</h3>
        <a href="tel:${phoneNoSpace}" class="text-on-surface-variant hover:text-[${config.primary}] transition">${phone}</a>
      </div>` : ""}
      ${email ? `<div class="bg-white border border-outline-variant p-8 paper-shadow text-center">
        <span class="material-symbols-outlined text-[${config.primary}] text-4xl mb-4 inline-block" style="font-variation-settings: 'FILL' 1;">mail</span>
        <h3 class="font-headline-lg text-xl mb-2">Email</h3>
        <a href="mailto:${email}" class="text-on-surface-variant hover:text-[${config.primary}] transition break-all text-sm">${email}</a>
      </div>` : ""}
      ${fullAddress ? `<div class="bg-white border border-outline-variant p-8 paper-shadow text-center">
        <span class="material-symbols-outlined text-[${config.primary}] text-4xl mb-4 inline-block" style="font-variation-settings: 'FILL' 1;">location_on</span>
        <h3 class="font-headline-lg text-xl mb-2">Adresse</h3>
        <p class="text-on-surface-variant text-sm leading-relaxed">${fullAddress}</p>
        <a href="https://www.google.com/maps/search/?api=1&query=${navQuery}" target="_blank" class="inline-flex items-center gap-1 text-[${config.primary}] text-xs font-label-lg uppercase tracking-wider mt-3 hover:underline">M'y rendre →</a>
      </div>` : ""}
      ${hoursHtml}
    </div>
  </div>
</section>

</main>

<!-- FOOTER -->
<footer class="bg-[#1f1d1c] text-white py-12 px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto text-center">
    <div class="flex items-center justify-center gap-3 mb-3">
      <span class="material-symbols-outlined text-[${config.accent}] text-2xl" style="font-variation-settings: 'FILL' 1;">${config.badgeIcon}</span>
      <div class="font-display-lg text-2xl">${name}</div>
    </div>
    <p class="text-white/60 text-sm mb-4">${escape(config.badgeText)}${city ? ` — ${city}` : ""}</p>
    <p class="text-xs text-white/40">© ${new Date().getFullYear()} ${name}. Tous droits réservés.</p>
  </div>
</footer>

</body>
</html>`;
}
