/* ══════════════════════════════════════════
   MOCKUP STITCH ENGINE — 14 métiers Material 3

   Engine paramétrable qui génère une maquette pixel-pixel inspirée des
   templates Stitch fournis par Tom (juin 2026). Une seule fonction
   `generateStitchMetierMockupHtml(prospect, businessType)` dispatche
   vers la bonne config métier.

   Architecture :
   - `METIER_CONFIGS` : 14 configs (palette, icônes, services, baseline)
   - `renderMaterial3Mockup()` : moteur HTML commun
   - `generateStitchMetierMockupHtml()` : dispatcher + templating

   Tous les métiers partagent le DESIGN SYSTEM commun :
   - Material 3 (surface / primary / secondary / outline)
   - EB Garamond (titres) + Plus Jakarta Sans (corps)
   - Nav sticky + texture noise + paper-shadow
   - Sections : Hero / Bento services / Contact / Footer

   Politique NO-PEOPLE active (photos via resolveHeroPhoto/Secondary).
   ══════════════════════════════════════════ */

import { resolveHeroPhoto, resolveSecondaryPhotos } from "@/lib/photo-resolver";

export interface MetierProspect {
  id: string;
  slug: string;
  name: string;
  city?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website_photos?: string[] | null;
}

export interface MetierConfig {
  key: string;                 // ex: "electricien"
  detect: RegExp;              // pour matcher business_type ou nom
  metierLabel: string;         // ex: "Électricien"
  metierShort: string;         // ex: "Electricite" (sans accent dans nav)
  iconNav: string;             // Material Symbols name (ex: "electrical_services")
  navCtaText: string;          // ex: "DEVIS GRATUIT"
  bannerText?: string;         // bandeau urgence optionnel (texte uppercase)
  bannerColor?: string;        // couleur fond bannière (hex)
  bannerAccentIcon?: string;   // Material Symbols dans bannière
  heroBaseline: string;        // ex: "Précision et sécurité"
  heroSubtitle: string;        // template avec {{CITY}} possible
  heroCtaPrimary: string;      // ex: "DEMANDER UN DIAGNOSTIC"
  heroCtaSecondary: string;    // ex: "NOS PRESTATIONS"
  servicesTitle: string;       // ex: "Nos prestations"
  services: Array<{ icon: string; title: string; desc: string }>;
  footerTagline: string;       // ex: "Artisan électricien"
  primary: string;             // couleur primaire (hex) ex: "#ca8a04"
  primaryDark: string;         // version foncée pour hover
  accent: string;              // accent secondaire
  surface: string;             // fond principal
  surfaceContainer: string;    // fond carte
}

/* ══════════════════════════════════════════
   14 CONFIGS MÉTIER (palette dédiée par métier)
   ══════════════════════════════════════════ */

export const METIER_CONFIGS: MetierConfig[] = [
  {
    key: "electricien",
    detect: /\b(electric|électrici|électrique)/i,
    metierLabel: "Électricien", metierShort: "ELECTRICITE",
    iconNav: "electrical_services", navCtaText: "DIAGNOSTIC GRATUIT",
    bannerText: "CERTIFIÉ QUALIFELEC · GARANTIE DÉCENNALE",
    bannerColor: "#ca8a04", bannerAccentIcon: "verified",
    heroBaseline: "Précision et sécurité.",
    heroSubtitle: "Installation et dépannage électrique{{CITY_CLAUSE}}. Mise aux normes, tableaux électriques, domotique, bornes véhicules électriques.",
    heroCtaPrimary: "DEMANDER UN DIAGNOSTIC",
    heroCtaSecondary: "NOS PRESTATIONS",
    servicesTitle: "Notre savoir-faire",
    services: [
      { icon: "electrical_services", title: "Mise aux normes", desc: "Audit complet de votre installation et mise en conformité avec les normes NFC 15-100. Sécurité garantie." },
      { icon: "bolt", title: "Tableaux électriques", desc: "Création et rénovation de tableaux électriques modernes. Disjoncteurs différentiels, modules intelligents." },
      { icon: "lightbulb", title: "Éclairage & domotique", desc: "LED design, variateurs, programmation, prises connectées. Confort et économie d'énergie." },
      { icon: "ev_station", title: "Bornes véhicules", desc: "Installation de bornes de recharge VE domestiques et tertiaires. Prime CEE éligible." },
    ],
    footerTagline: "Artisan électricien",
    primary: "#000000", primaryDark: "#1c1b1b", accent: "#ca8a04",
    surface: "#fdf8f8", surfaceContainer: "#f1edec",
  },
  {
    key: "garage",
    detect: /\bgarage|carross|mecaniq|méca|auto[ -]?repair/i,
    metierLabel: "Garage automobile", metierShort: "GARAGE",
    iconNav: "build", navCtaText: "PRENDRE RDV",
    bannerText: "AGRÉÉ TOUTES MARQUES · DEVIS CLAIR",
    bannerColor: "#b91c1c", bannerAccentIcon: "verified",
    heroBaseline: "Mécanique de confiance.",
    heroSubtitle: "Entretien et réparation toutes marques{{CITY_CLAUSE}}. Honnêteté tarifaire, réactivité et expertise.",
    heroCtaPrimary: "RÉSERVER UNE INTERVENTION",
    heroCtaSecondary: "NOS PRESTATIONS",
    servicesTitle: "Nos services",
    services: [
      { icon: "build", title: "Entretien & révision", desc: "Vidange, filtres, plaquettes, courroies. Suivi du carnet d'entretien constructeur respecté." },
      { icon: "tire_repair", title: "Pneus & freins", desc: "Montage, équilibrage, géométrie. Marques premium et budget, garantie constructeur." },
      { icon: "ac_unit", title: "Climatisation", desc: "Recharge gaz R134a/R1234yf, désinfection circuit. Contrôle annuel recommandé." },
      { icon: "search", title: "Diagnostic OBD", desc: "Lecture défauts moteur multimarques. Résolution voyants tableau de bord, devis transparent." },
    ],
    footerTagline: "Garage indépendant",
    primary: "#1f2937", primaryDark: "#111827", accent: "#b91c1c",
    surface: "#f8fafc", surfaceContainer: "#f1f5f9",
  },
  {
    key: "dentiste",
    detect: /\b(dentiste|dental|orthodont|chirurg.*dentaire)/i,
    metierLabel: "Cabinet dentaire", metierShort: "DENTAIRE",
    iconNav: "dentistry", navCtaText: "PRENDRE RENDEZ-VOUS",
    heroBaseline: "Sérénité au cœur du soin.",
    heroSubtitle: "Cabinet dentaire{{CITY_CLAUSE}}. Soins, esthétique, implantologie, urgences. Une équipe à votre écoute.",
    heroCtaPrimary: "PRENDRE RENDEZ-VOUS",
    heroCtaSecondary: "NOS SOINS",
    servicesTitle: "Nos soins",
    services: [
      { icon: "dentistry", title: "Soins courants", desc: "Caries, détartrage, dévitalisations. Matériel récent, anesthésie indolore, traçabilité totale." },
      { icon: "diamond", title: "Esthétique", desc: "Facettes céramiques, blanchiment doux, restauration invisible. Pour un sourire qui vous ressemble." },
      { icon: "build", title: "Implantologie", desc: "Implants dentaires titane, mise en charge selon protocole. Garantie 10 ans sur la prothèse." },
      { icon: "emergency", title: "Urgences", desc: "Consultations d'urgence sous 24h sur appel. Douleurs vives, traumatismes, prothèses cassées." },
    ],
    footerTagline: "Cabinet dentaire",
    primary: "#0f766e", primaryDark: "#115e59", accent: "#14b8a6",
    surface: "#f8fafc", surfaceContainer: "#f1f5f9",
  },
  {
    key: "osteo",
    detect: /\b(ostéo|osteo|kine|kiné|kinésithé|kinesithé|chiroprat)/i,
    metierLabel: "Ostéopathe", metierShort: "OSTEO",
    iconNav: "self_improvement", navCtaText: "RÉSERVER UNE SÉANCE",
    heroBaseline: "L'équilibre par les mains.",
    heroSubtitle: "Ostéopathie{{CITY_CLAUSE}}. Pour adultes, sportifs, nourrissons, femmes enceintes. Approche douce et personnalisée.",
    heroCtaPrimary: "RÉSERVER MA SÉANCE",
    heroCtaSecondary: "MES SPÉCIALITÉS",
    servicesTitle: "Mes spécialités",
    services: [
      { icon: "self_improvement", title: "Adultes", desc: "Douleurs lombaires, cervicales, articulaires, troubles digestifs, suites de traumatismes." },
      { icon: "fitness_center", title: "Sportifs", desc: "Préparation aux compétitions, récupération post-effort, prévention des blessures récurrentes." },
      { icon: "child_friendly", title: "Nourrissons", desc: "Plagiocéphalie, troubles du sommeil, coliques, suites de naissance. Manipulations très douces." },
      { icon: "pregnant_woman", title: "Femmes enceintes", desc: "Soulagement des tensions liées à la grossesse, préparation à l'accouchement, suivi post-partum." },
    ],
    footerTagline: "Ostéopathe DO",
    primary: "#475569", primaryDark: "#334155", accent: "#94a3b8",
    surface: "#f8fafc", surfaceContainer: "#f1f5f9",
  },
  {
    key: "cafe",
    detect: /\b(café|cafe|bistro|brasserie|coffee[ -]?shop)\b/i,
    metierLabel: "Café & Bistrot", metierShort: "CAFE",
    iconNav: "coffee", navCtaText: "VOIR NOS HORAIRES",
    heroBaseline: "Le goût du temps suspendu.",
    heroSubtitle: "Café & Bistrot{{CITY_CLAUSE}}. Petit-déjeuner, déjeuner du jour, pâtisseries maison, terrasse ensoleillée.",
    heroCtaPrimary: "VENIR EN TERRASSE",
    heroCtaSecondary: "VOIR LA CARTE",
    servicesTitle: "Notre carte",
    services: [
      { icon: "free_breakfast", title: "Petit-déjeuner", desc: "Viennoiseries du boulanger voisin, jus frais pressés, cafés de spécialité, brunch le week-end." },
      { icon: "restaurant", title: "Déjeuner du jour", desc: "Formule entrée + plat + café à 14€. Cuisine maison, produits frais, ardoise renouvelée chaque jour." },
      { icon: "cake", title: "Pâtisseries maison", desc: "Tartes du jour, mousses au chocolat, cookies tièdes. Pâtisserie maison, 100% sans additif." },
      { icon: "local_bar", title: "Apéros & cocktails", desc: "Bières artisanales locales, vins au verre, cocktails sans alcool. Service jusqu'à 22h." },
    ],
    footerTagline: "Café & Bistrot",
    primary: "#78350f", primaryDark: "#451a03", accent: "#fcd34d",
    surface: "#fef3c7", surfaceContainer: "#fde68a",
  },
  {
    key: "auto_ecole",
    detect: /\b(auto[ -]?écol|auto[ -]?ecol|driving[ -]?school|permis[ -]?de[ -]?conduire)/i,
    metierLabel: "Auto-école", metierShort: "AUTO-ECOLE",
    iconNav: "directions_car", navCtaText: "S'INSCRIRE",
    bannerText: "92 % DE RÉUSSITE AU CODE · MONITEURS DIPLÔMÉS",
    bannerColor: "#2563eb", bannerAccentIcon: "verified",
    heroBaseline: "Votre permis, votre liberté.",
    heroSubtitle: "Auto-école{{CITY_CLAUSE}}. Code en illimité, conduite individuelle, conduite accompagnée, boîte automatique.",
    heroCtaPrimary: "PRENDRE RENDEZ-VOUS",
    heroCtaSecondary: "NOS FORMULES",
    servicesTitle: "Nos formules",
    services: [
      { icon: "school", title: "Code en illimité", desc: "Accès plateforme en ligne 7j/7. Salle de code à l'agence, 5 séances/semaine encadrées." },
      { icon: "directions_car", title: "Permis B", desc: "20h de conduite minimum, moniteurs diplômés, véhicule récent. Forfait sans surprise." },
      { icon: "child_care", title: "Conduite accompagnée", desc: "Dès 15 ans. Permis dès 17 ans. Réduction d'assurance immédiate à la majorité." },
      { icon: "settings_suggest", title: "Boîte automatique", desc: "Permis B78 accessible en 13h de conduite minimum. Idéal pour citadins ou conducteurs anxieux." },
    ],
    footerTagline: "Auto-école agréée",
    primary: "#1e3a8a", primaryDark: "#1e40af", accent: "#fde047",
    surface: "#eff6ff", surfaceContainer: "#dbeafe",
  },
  {
    key: "epicerie_fine",
    detect: /\b(épicerie|epicerie|cave[ -]?à[ -]?vins|cave[ -]?a[ -]?vins|caviste|deli)/i,
    metierLabel: "Épicerie fine", metierShort: "EPICERIE",
    iconNav: "storefront", navCtaText: "VENIR EN BOUTIQUE",
    heroBaseline: "La sélection sans compromis.",
    heroSubtitle: "Épicerie fine{{CITY_CLAUSE}}. Producteurs locaux, vins de vignerons, fromages affinés, conserves artisanales.",
    heroCtaPrimary: "VOIR NOTRE SÉLECTION",
    heroCtaSecondary: "NOUS RENDRE VISITE",
    servicesTitle: "Notre sélection",
    services: [
      { icon: "agriculture", title: "Producteurs locaux", desc: "Confitures, miels, huiles d'olive, conserves. Sourcing rigoureux à moins de 100 km quand possible." },
      { icon: "wine_bar", title: "Vins & spiritueux", desc: "300 références de vignerons indépendants. Dégustation tous les samedis 17h-19h." },
      { icon: "card_giftcard", title: "Coffrets cadeaux", desc: "Coffrets à thème (Bourgogne, gastronomie, apéro). Personnalisables. Livraison Mondial Relay." },
      { icon: "soup_kitchen", title: "Plats traiteur", desc: "Foie gras, terrines, plats préparés frais. Idéal pour vos repas de fête sans cuisine." },
    ],
    footerTagline: "Épicerie fine de proximité",
    primary: "#3f6212", primaryDark: "#365314", accent: "#a16207",
    surface: "#fefce8", surfaceContainer: "#fef9c3",
  },
  {
    key: "boulangerie",
    detect: /\b(boulang|pâtiss|patiss|pain|baker)/i,
    metierLabel: "Boulangerie", metierShort: "BOULANGERIE",
    iconNav: "bakery_dining", navCtaText: "VOIR LA VITRINE",
    heroBaseline: "Le pain, le vrai.",
    heroSubtitle: "Boulangerie artisanale{{CITY_CLAUSE}}. Pains au levain naturel, viennoiseries pur beurre, pâtisseries maison.",
    heroCtaPrimary: "COMMANDER UN PAIN SPÉCIAL",
    heroCtaSecondary: "NOTRE GAMME",
    servicesTitle: "Notre fabrication",
    services: [
      { icon: "bakery_dining", title: "Pains au levain", desc: "Levain naturel rafraîchi quotidiennement. Tradition, complet, seigle, pain aux céréales, sans additif." },
      { icon: "cake", title: "Viennoiseries pur beurre", desc: "Croissants, pains au chocolat, brioches feuilletées. Beurre AOP Charentes, sans matière grasse hydrogénée." },
      { icon: "icecream", title: "Pâtisseries maison", desc: "Éclairs, mille-feuilles, tartes aux fruits de saison. Crème pâtissière vanille de Madagascar." },
      { icon: "lunch_dining", title: "Sandwichs du midi", desc: "Sandwich baguette tradition, salades composées, quiches lorraines. Service rapide 11h30-14h." },
    ],
    footerTagline: "Boulangerie artisanale",
    primary: "#7c2d12", primaryDark: "#431407", accent: "#f59e0b",
    surface: "#fef3c7", surfaceContainer: "#fde68a",
  },
  {
    key: "fleuriste",
    detect: /\b(fleurist|floral|bouquet|flower)/i,
    metierLabel: "Fleuriste", metierShort: "FLEURISTE",
    iconNav: "local_florist", navCtaText: "COMMANDER UN BOUQUET",
    heroBaseline: "Chaque émotion, sa fleur.",
    heroSubtitle: "Fleuriste artisan{{CITY_CLAUSE}}. Bouquets sur-mesure, compositions de mariage, livraison express en boutique et à domicile.",
    heroCtaPrimary: "COMMANDER UN BOUQUET",
    heroCtaSecondary: "NOS COMPOSITIONS",
    servicesTitle: "Nos créations",
    services: [
      { icon: "local_florist", title: "Bouquets du jour", desc: "Compositions colorées renouvelées chaque matin. Fleurs de saison, du producteur direct quand possible." },
      { icon: "favorite", title: "Mariages", desc: "Bouquet de mariée, centres de table, arches, voitures. Devis sur-mesure, dégustation florale en boutique." },
      { icon: "celebration", title: "Cérémonies & deuils", desc: "Compositions discrètes et élégantes pour vos hommages. Livraison directe au lieu de cérémonie." },
      { icon: "delivery_dining", title: "Livraison express", desc: "Livraison en boutique 2h, à domicile sous 4h dans un rayon de 15 km. Bouquet en main propre." },
    ],
    footerTagline: "Fleuriste artisan",
    primary: "#166534", primaryDark: "#14532d", accent: "#fde047",
    surface: "#f0fdf4", surfaceContainer: "#dcfce7",
  },
  {
    key: "menuisier",
    detect: /\b(menuis|ébénist|ebenist|carpent|woodwork)/i,
    metierLabel: "Menuisier ébéniste", metierShort: "MENUISERIE",
    iconNav: "handyman", navCtaText: "DEMANDER UN DEVIS",
    heroBaseline: "Le bois, sur-mesure.",
    heroSubtitle: "Menuiserie & ébénisterie{{CITY_CLAUSE}}. Cuisines, dressings, escaliers, fenêtres bois. Fabrication artisanale, essences nobles.",
    heroCtaPrimary: "DEMANDER UN DEVIS",
    heroCtaSecondary: "NOS RÉALISATIONS",
    servicesTitle: "Nos savoir-faire",
    services: [
      { icon: "kitchen", title: "Cuisines sur-mesure", desc: "Conception 3D, fabrication en atelier, pose chez vous. Bois massif, plan de travail céramique." },
      { icon: "checkroom", title: "Dressings & rangements", desc: "Optimisation millimétrée de vos espaces. Penderies, étagères, bureaux intégrés." },
      { icon: "stairs", title: "Escaliers", desc: "Quart-tournant, hélicoïdal, suspendu. Bois massif chêne, hêtre, noyer. Conformité norme NF." },
      { icon: "window", title: "Fenêtres & volets bois", desc: "Double vitrage Uw 1.3, essence durable, finition lasure ou peinture. Crédit d'impôt rénovation." },
    ],
    footerTagline: "Menuisier ébéniste",
    primary: "#78350f", primaryDark: "#451a03", accent: "#d97706",
    surface: "#fefce8", surfaceContainer: "#fef9c3",
  },
  {
    key: "couvreur",
    detect: /\b(couvreur|charpent|toiture|roof|zingu|étanché|etancheité)/i,
    metierLabel: "Couvreur charpentier", metierShort: "COUVREUR",
    iconNav: "home_work", navCtaText: "DEMANDER UN DEVIS",
    bannerText: "GARANTIE DÉCENNALE · DEVIS GRATUIT",
    bannerColor: "#57534e", bannerAccentIcon: "shield",
    heroBaseline: "Votre toit, notre serment.",
    heroSubtitle: "Couvreur charpentier{{CITY_CLAUSE}}. Tuiles, ardoises, zinguerie, démoussage, isolation toiture. Garantie décennale.",
    heroCtaPrimary: "DEMANDER UN DEVIS",
    heroCtaSecondary: "NOS PRESTATIONS",
    servicesTitle: "Nos prestations",
    services: [
      { icon: "home", title: "Tuiles & ardoises", desc: "Pose neuve, rénovation, remplacement à l'unité. Tous types : terre cuite, béton, ardoise naturelle." },
      { icon: "water_drop", title: "Zinguerie", desc: "Gouttières, chéneaux, descentes EP, raccords cheminée. Zinc traditionnel ou prélaqué teinté." },
      { icon: "spa", title: "Démoussage & traitement", desc: "Nettoyage haute pression, traitement anti-mousse longue durée. Évite l'infiltration et la dégradation." },
      { icon: "energy_savings_leaf", title: "Isolation combles", desc: "ITE et ITI, laine soufflée ou panneaux. R minimum 7. Éligible MaPrimeRénov' et CEE." },
    ],
    footerTagline: "Couvreur charpentier",
    primary: "#44403c", primaryDark: "#292524", accent: "#a8a29e",
    surface: "#f5f5f4", surfaceContainer: "#e7e5e4",
  },
  {
    key: "veterinaire",
    detect: /\b(vétér|veter|clinique[ -]?vét|veterinary)/i,
    metierLabel: "Vétérinaire", metierShort: "VETERINAIRE",
    iconNav: "pets", navCtaText: "PRENDRE RDV",
    heroBaseline: "Soin et bienveillance.",
    heroSubtitle: "Cabinet vétérinaire{{CITY_CLAUSE}}. Consultations, chirurgie, vaccins, urgences. Chats, chiens, NAC.",
    heroCtaPrimary: "PRENDRE RENDEZ-VOUS",
    heroCtaSecondary: "NOS SPÉCIALITÉS",
    servicesTitle: "Nos services",
    services: [
      { icon: "stethoscope", title: "Consultations", desc: "Suivi médical, vaccinations, vermifuges, identification. Plan santé annuel personnalisable." },
      { icon: "surgical", title: "Chirurgie", desc: "Stérilisation, chirurgies des tissus mous, dentaire. Bloc opératoire dédié, monitoring complet." },
      { icon: "emergency", title: "Urgences", desc: "Consultations d'urgence en journée, garde téléphonique le soir. Stabilisation avant transfert nuit." },
      { icon: "pets", title: "NAC", desc: "Lapins, rongeurs, oiseaux, reptiles. Connaissance approfondie des espèces non conventionnelles." },
    ],
    footerTagline: "Cabinet vétérinaire",
    primary: "#0e7490", primaryDark: "#155e75", accent: "#06b6d4",
    surface: "#ecfeff", surfaceContainer: "#cffafe",
  },
  {
    key: "coiffeur",
    detect: /\b(coiffeur|coiffure|salon|hair|barbier|barber)/i,
    metierLabel: "Salon de coiffure", metierShort: "COIFFURE",
    iconNav: "content_cut", navCtaText: "RÉSERVER EN LIGNE",
    heroBaseline: "Votre style, notre signature.",
    heroSubtitle: "Salon de coiffure{{CITY_CLAUSE}}. Coupe sur-mesure, couleur experte, soins haut de gamme, mariage.",
    heroCtaPrimary: "RÉSERVER EN LIGNE",
    heroCtaSecondary: "NOS PRESTATIONS",
    servicesTitle: "Nos prestations",
    services: [
      { icon: "content_cut", title: "Coupe & coiffage", desc: "Coupes femmes, hommes, enfants. Analyse morphologique, recommandation personnalisée, brushing inclus." },
      { icon: "palette", title: "Couleur experte", desc: "Mèches, balayage, ombré hair, couleur végétale, blond polaire. Patch test allergie systématique." },
      { icon: "spa", title: "Soins haut de gamme", desc: "Soins reconstructeurs Olaplex, masques nutrition, rituels personnalisés selon votre type de cheveu." },
      { icon: "favorite", title: "Coiffure mariage", desc: "Essai sur RDV, déplacement le jour J en option. Chignon, attaché, demi-attaché, accessoires." },
    ],
    footerTagline: "Salon de coiffure",
    primary: "#831843", primaryDark: "#500724", accent: "#f9a8d4",
    surface: "#fdf2f8", surfaceContainer: "#fce7f3",
  },
  {
    key: "institut",
    detect: /\b(institut|spa|beauté|beaute|esthét|estheti|massage|wellness)/i,
    metierLabel: "Institut de beauté", metierShort: "INSTITUT",
    iconNav: "spa", navCtaText: "RÉSERVER MON SOIN",
    heroBaseline: "Le rituel du bien-être.",
    heroSubtitle: "Institut de beauté{{CITY_CLAUSE}}. Soins visage, modelages corps, manucure, épilation, massages relaxants.",
    heroCtaPrimary: "RÉSERVER MON SOIN",
    heroCtaSecondary: "NOTRE CARTE DE SOINS",
    servicesTitle: "Notre carte",
    services: [
      { icon: "face", title: "Soins visage", desc: "Nettoyage profond, hydratation intense, anti-âge, peeling doux. Marques bio Yon-Ka et Esthederm." },
      { icon: "spa", title: "Modelages corps", desc: "Suédois, californien, balinais, drainage lymphatique. Cabines individuelles chauffées, musique d'ambiance." },
      { icon: "front_hand", title: "Manucure & pose", desc: "Manucure SPA, vernis semi-permanent, pose résine. Hygiène stricte, choix de 80 teintes." },
      { icon: "water_drop", title: "Épilation", desc: "Cire tiède sucre bio, épilation au fil pour les sourcils. Forfaits demi-jambes, maillot, aisselles." },
    ],
    footerTagline: "Institut de beauté & spa",
    primary: "#7e22ce", primaryDark: "#6b21a8", accent: "#e879f9",
    surface: "#faf5ff", surfaceContainer: "#f3e8ff",
  },
];

function escapeHtml(s: string | null | undefined): string {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function applyTemplate(text: string, vars: { city: string; cityClause: string }): string {
  return text
    .replace(/\{\{CITY\}\}/g, vars.city)
    .replace(/\{\{CITY_CLAUSE\}\}/g, vars.cityClause);
}

/* ══════════════════════════════════════════
   Rendu HTML commun (Material 3 + EB Garamond + Plus Jakarta Sans)
   ══════════════════════════════════════════ */

function renderMaterial3Mockup(p: MetierProspect, c: MetierConfig): string {
  const name = escapeHtml(p.name);
  const nameUpper = name.toUpperCase();
  const city = escapeHtml(p.city || "");
  const cityClause = city ? ` à ${city}` : "";
  const address = escapeHtml(p.address || "");
  const phone = escapeHtml(p.phone || "");
  const phoneNoSpace = (p.phone || "").replace(/\s/g, "");
  const email = escapeHtml(p.email || "");

  const heroPhoto = resolveHeroPhoto(p.website_photos || null, c.key);
  const sec = resolveSecondaryPhotos(p.website_photos || null, c.key, 3, p.slug);
  const photo2 = sec[0] || heroPhoto;
  const photo3 = sec[1] || heroPhoto;

  const heroSub = applyTemplate(c.heroSubtitle, { city, cityClause });
  const navQuery = address ? encodeURIComponent(`${address}${city ? ", " + city : ""}`) : "";

  const bannerHtml = c.bannerText ? `
<div style="background:${c.bannerColor};color:#fff;padding-top:96px;padding-bottom:12px;text-align:center;box-shadow:0 4px 6px rgba(0,0,0,0.08)" class="px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto flex items-center justify-center gap-2">
    <span class="material-symbols-outlined animate-pulse" style="font-variation-settings: 'FILL' 1;">${c.bannerAccentIcon || "verified"}</span>
    <span class="font-label-lg tracking-widest uppercase text-sm">${escapeHtml(c.bannerText)}</span>
  </div>
</div>` : "";

  // Bento services (2 grandes + 2 petites alternées)
  const servicesHtml = c.services.map((s, i) => {
    const big = i === 0 || i === 3;
    const span = big ? "col-span-1 md:col-span-2" : "col-span-1";
    const bgImg = big ? `<div class="absolute inset-0 z-0"><img class="object-cover w-full h-full opacity-30 mix-blend-multiply" alt="" src="${i === 0 ? photo2 : photo3}"/></div>` : "";
    const minH = big ? "min-h-[280px]" : "";
    return `
<div class="${span} bg-surface rounded-xl p-8 border border-outline-variant paper-shadow group transition-colors relative overflow-hidden flex flex-col justify-end ${minH}" style="border-color:rgba(0,0,0,0.08)">
  ${bgImg}
  <div class="relative z-10">
    <div class="w-12 h-12 rounded-full flex items-center justify-center mb-6 shadow-md" style="background:${c.accent};color:#fff">
      <span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">${s.icon}</span>
    </div>
    <h3 class="font-headline-lg text-2xl leading-tight mb-2" style="color:${c.primary}">${escapeHtml(s.title)}</h3>
    <p class="text-on-surface-variant max-w-md">${escapeHtml(s.desc)}</p>
  </div>
</div>`;
  }).join("");

  return `<!DOCTYPE html>
<!--
  ─────────────────────────────────────────────────────
  Design, code et intégration : Klyora Sites
  https://klyora.fr
  Maquette personnalisée pour ${name}
  Toute reproduction, même partielle, est interdite.
  ─────────────────────────────────────────────────────
-->
<html class="light" lang="fr">
<head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<meta name="robots" content="noindex,noarchive">
<meta name="author" content="Klyora Sites">
<title>${name} — ${escapeHtml(c.metierLabel)}${city ? ` à ${city}` : ""}</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=EB+Garamond:wght@500;600&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap" rel="stylesheet"/>
<script>
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          "surface": "${c.surface}",
          "surface-container": "${c.surfaceContainer}",
          "surface-container-lowest": "#ffffff",
          "surface-container-low": "#f7f3f2",
          "surface-container-high": "#ebe7e6",
          "surface-container-highest": "#e5e2e1",
          "primary": "${c.primary}",
          "on-primary": "#ffffff",
          "primary-container": "${c.primaryDark}",
          "secondary": "#5e5e5e",
          "on-surface": "${c.primary}",
          "on-surface-variant": "#444748",
          "outline": "#747878",
          "outline-variant": "#c4c7c7",
          "background": "${c.surface}",
        },
        borderRadius: { DEFAULT: "0.25rem", lg: "0.5rem", xl: "0.75rem", full: "9999px" },
        spacing: { "desktop-padding": "4rem", "container-max": "1200px", "section-gap": "5rem", "mobile-padding": "1.5rem", "stack-gap": "1rem" },
        fontFamily: { "headline-display": ["EB Garamond"], "headline-lg": ["EB Garamond"], "label-sm": ["Plus Jakarta Sans"], "body-md": ["Plus Jakarta Sans"], "label-lg": ["Plus Jakarta Sans"] },
        fontSize: {
          "headline-display": ["48px", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
          "headline-lg": ["36px", { lineHeight: "1.3", fontWeight: "500" }],
          "label-sm": ["12px", { lineHeight: "1.2", letterSpacing: "0.05em", fontWeight: "600" }],
          "body-md": ["16px", { lineHeight: "1.6", fontWeight: "400" }],
          "label-lg": ["14px", { lineHeight: "1.2", letterSpacing: "0.08em", fontWeight: "700" }]
        }
      }
    }
  };
</script>
<style>
  body { background: ${c.surface}; color: ${c.primary}; font-family: "Plus Jakarta Sans", sans-serif; }
  .texture-overlay { position: fixed; inset: 0; pointer-events: none; z-index: 9999; opacity: 0.04;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
  .paper-shadow { box-shadow: 0 4px 8px -2px rgba(0,0,0,0.04); }
</style>
</head>
<body class="antialiased min-h-screen flex flex-col">
<div class="texture-overlay"></div>

<!-- Nav -->
<nav class="fixed top-0 w-full z-50 backdrop-blur-sm border-b border-outline-variant shadow-sm" style="background:${c.surface}f2" id="navbar">
  <div class="flex justify-between items-center h-20 px-mobile-padding md:px-desktop-padding max-w-container-max mx-auto">
    <a class="font-headline-lg text-2xl md:text-3xl tracking-tighter flex items-center gap-2" style="color:${c.primary}" href="#">
      <span class="material-symbols-outlined text-3xl" style="font-variation-settings: 'FILL' 1; color:${c.accent}">${c.iconNav}</span>
      ${nameUpper}
    </a>
    <div class="hidden md:flex items-center gap-8">
      <a class="font-label-lg text-on-surface-variant hover:opacity-80 transition-colors" href="#services">Services</a>
      <a class="font-label-lg text-on-surface-variant hover:opacity-80 transition-colors" href="#contact">Contact</a>
      ${phoneNoSpace ? `<a class="inline-flex items-center justify-center text-on-primary font-label-lg px-6 py-3 rounded transition-colors" style="background:${c.primary}" href="tel:${phoneNoSpace}">${escapeHtml(c.navCtaText)}</a>` : ""}
    </div>
    <button class="md:hidden p-2" style="color:${c.primary}"><span class="material-symbols-outlined text-2xl">menu</span></button>
  </div>
</nav>

${bannerHtml}

<main class="flex-grow${c.bannerText ? "" : " pt-20"}">
<!-- Hero -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding">
  <div class="max-w-container-max mx-auto flex flex-col md:flex-row items-center gap-12">
    <div class="flex-1 space-y-8">
      <h1 class="font-headline-display text-4xl md:text-5xl leading-tight" style="color:${c.primary}">
        ${escapeHtml(c.heroBaseline)}
      </h1>
      <p class="text-on-surface-variant max-w-lg text-lg">
        ${heroSub.replace(/\bà <span/g, "à <span")}
      </p>
      <div class="flex flex-col sm:flex-row gap-4 pt-4">
        ${phoneNoSpace ? `<a class="inline-flex items-center justify-center gap-2 text-white font-label-lg px-8 py-4 rounded transition-all shadow-md hover:shadow-lg" style="background:${c.accent}" href="tel:${phoneNoSpace}"><span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">call</span>${escapeHtml(c.heroCtaPrimary)}</a>` : `<a class="inline-flex items-center justify-center text-white font-label-lg px-8 py-4 rounded transition-all shadow-md hover:shadow-lg" style="background:${c.accent}" href="#contact">${escapeHtml(c.heroCtaPrimary)}</a>`}
        <a class="inline-flex items-center justify-center font-label-lg px-8 py-4 rounded transition-colors border" style="background:${c.surface};color:${c.primary};border-color:${c.primary}33" href="#services">${escapeHtml(c.heroCtaSecondary)}</a>
      </div>
    </div>
    <div class="flex-1 w-full aspect-[4/3] rounded-xl overflow-hidden relative paper-shadow border border-outline-variant bg-surface-container">
      <img class="object-cover w-full h-full absolute inset-0" alt="${name}" src="${heroPhoto}"/>
    </div>
  </div>
</section>

<!-- Services -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding border-t border-b border-outline-variant" style="background:${c.surfaceContainer}" id="services">
  <div class="max-w-container-max mx-auto">
    <div class="mb-12">
      <h2 class="font-headline-lg text-3xl md:text-4xl mb-4" style="color:${c.primary}">${escapeHtml(c.servicesTitle)}</h2>
      <div class="w-24 h-1" style="background:${c.accent}"></div>
    </div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      ${servicesHtml}
    </div>
  </div>
</section>

<!-- Contact -->
<section class="py-section-gap px-mobile-padding md:px-desktop-padding" id="contact">
  <div class="max-w-container-max mx-auto text-center">
    <h2 class="font-headline-lg text-3xl md:text-4xl mb-4" style="color:${c.primary}">Contactez-nous</h2>
    <div class="w-24 h-1 mx-auto mb-12" style="background:${c.accent}"></div>
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
      ${phoneNoSpace ? `<div class="bg-surface rounded-xl p-8 border border-outline-variant paper-shadow"><span class="material-symbols-outlined text-3xl mb-3" style="font-variation-settings: 'FILL' 1; color:${c.accent}">call</span><h3 class="font-headline-lg text-xl mb-2" style="color:${c.primary}">Téléphone</h3><a href="tel:${phoneNoSpace}" class="text-on-surface-variant hover:opacity-80">${phone}</a></div>` : ""}
      ${email ? `<div class="bg-surface rounded-xl p-8 border border-outline-variant paper-shadow"><span class="material-symbols-outlined text-3xl mb-3" style="font-variation-settings: 'FILL' 1; color:${c.accent}">mail</span><h3 class="font-headline-lg text-xl mb-2" style="color:${c.primary}">Email</h3><a href="mailto:${email}" class="text-on-surface-variant hover:opacity-80 text-sm break-all">${email}</a></div>` : ""}
      ${address ? `<div class="bg-surface rounded-xl p-8 border border-outline-variant paper-shadow"><span class="material-symbols-outlined text-3xl mb-3" style="font-variation-settings: 'FILL' 1; color:${c.accent}">location_on</span><h3 class="font-headline-lg text-xl mb-2" style="color:${c.primary}">Adresse</h3><p class="text-on-surface-variant text-sm">${address}${city ? `<br/>${city}` : ""}</p>${navQuery ? `<a href="https://www.google.com/maps/dir/?api=1&destination=${navQuery}" target="_blank" rel="noopener" class="inline-block mt-3 text-xs underline" style="color:${c.accent}">M'y rendre</a>` : ""}</div>` : ""}
    </div>
  </div>
</section>
</main>

<!-- Footer -->
<footer class="w-full mt-section-gap border-t border-outline-variant" style="background:${c.surfaceContainer}">
  <div class="flex flex-col md:flex-row justify-between items-center py-12 px-mobile-padding md:px-desktop-padding max-w-container-max mx-auto gap-stack-gap">
    <div class="flex flex-col items-center md:items-start gap-4">
      <span class="font-headline-lg text-2xl" style="color:${c.primary}">${nameUpper}</span>
      <span class="text-sm" style="color:${c.primary}">© 2026 ${nameUpper} · Site Klyora Sites · ${escapeHtml(c.footerTagline)}${city ? ` à ${city}` : ""}</span>
    </div>
    <div class="flex flex-wrap justify-center gap-6">
      <a class="font-label-sm text-on-surface-variant hover:opacity-80 underline decoration-1 underline-offset-4 transition-all uppercase text-xs" href="#services">Services</a>
      <a class="font-label-sm text-on-surface-variant hover:opacity-80 underline decoration-1 underline-offset-4 transition-all uppercase text-xs" href="#contact">Contact</a>
    </div>
  </div>
</footer>

<script>
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    if (nav) { window.scrollY > 10 ? nav.classList.add('shadow-md') : nav.classList.remove('shadow-md'); }
  });
</script>
</body>
</html>`;
}

/* ══════════════════════════════════════════
   Dispatcher principal
   ══════════════════════════════════════════ */

export function findMetierConfig(p: { name?: string | null; slug?: string | null; business_type?: string | null }): MetierConfig | null {
  const haystack = `${p.business_type || ""} ${p.name || ""} ${p.slug || ""}`;
  for (const config of METIER_CONFIGS) {
    if (config.detect.test(haystack)) return config;
  }
  return null;
}

export function generateStitchMetierMockupHtml(p: MetierProspect, businessTypeHint?: string | null): string | null {
  const config = findMetierConfig({ name: p.name, slug: p.slug, business_type: businessTypeHint });
  if (!config) return null;
  return renderMaterial3Mockup(p, config);
}
