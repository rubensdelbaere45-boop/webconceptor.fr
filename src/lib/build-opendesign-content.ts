/**
 * Construit le MockupContent (heroTitle, services, etc.) à partir d'un
 * prospect Supabase, pour alimenter generateOpenDesignMockup().
 *
 * Pas d'appel IA — on s'appuie uniquement sur les données déjà scrapées
 * (menu_items, about_scraped, business_type, reviews).
 */
import type { MockupContent } from "@/lib/mockup-opendesign";

const BUSINESS_LABELS: Record<string, { metier: string; specialty: string; servicesIntro: string }> = {
  restaurant:   { metier: "restaurant",        specialty: "cuisine maison",                    servicesIntro: "Une carte travaillée avec des produits frais et locaux." },
  boulangerie:  { metier: "boulangerie artisanale", specialty: "pains et viennoiseries",       servicesIntro: "Pétri, façonné et cuit chaque jour dans notre fournil." },
  patisserie:   { metier: "pâtisserie",        specialty: "créations sucrées",                  servicesIntro: "Des pâtisseries fines, élaborées à la main." },
  cafe:         { metier: "café",              specialty: "moments de pause",                    servicesIntro: "Un café d'exception et une carte conviviale." },
  glacier:      { metier: "glacier artisanal", specialty: "glaces et sorbets",                  servicesIntro: "Des glaces fabriquées sur place, sans colorants ni arômes artificiels." },
  coiffeur:     { metier: "salon de coiffure", specialty: "coupes et soins",                    servicesIntro: "Une équipe formée aux dernières techniques de coiffure." },
  institut:     { metier: "institut de beauté",specialty: "soins du visage et du corps",        servicesIntro: "Un moment de détente et de bien-être sur mesure." },
  plombier:     { metier: "plombier",          specialty: "interventions plomberie",            servicesIntro: "Dépannage rapide, installation et entretien." },
  electricien:  { metier: "électricien",       specialty: "installations électriques",          servicesIntro: "Mise aux normes, dépannage et travaux neufs." },
  garage:       { metier: "garage automobile", specialty: "entretien et réparation auto",       servicesIntro: "Mécanique, carrosserie et entretien toutes marques." },
  menuisier:    { metier: "menuisier",         specialty: "menuiserie bois",                    servicesIntro: "Du sur-mesure pensé, dessiné et fabriqué dans notre atelier." },
  serrurier:    { metier: "serrurier",         specialty: "ouverture et sécurité",              servicesIntro: "Interventions rapides et installations sécurisées." },
  carreleur:    { metier: "carreleur",         specialty: "pose de carrelage",                  servicesIntro: "Finitions soignées pour vos sols et murs." },
  peintre:      { metier: "peintre en bâtiment", specialty: "peinture intérieure et extérieure", servicesIntro: "Préparation, application et finition impeccables." },
  couvreur:     { metier: "couvreur",          specialty: "travaux de toiture",                 servicesIntro: "Toiture, étanchéité et zinguerie." },
  macon:        { metier: "maçon",             specialty: "gros œuvre et rénovation",            servicesIntro: "Construction, extension et rénovation." },
  osteo:        { metier: "cabinet d'ostéopathie", specialty: "soins ostéopathiques",           servicesIntro: "Consultations sur rendez-vous, en cabinet ou à domicile." },
  dentiste:     { metier: "cabinet dentaire",  specialty: "soins dentaires",                    servicesIntro: "Soins courants, esthétique et prévention." },
  fleuriste:    { metier: "fleuriste",         specialty: "bouquets et compositions",           servicesIntro: "Fleurs fraîches et créations personnalisées." },
  salle_sport:  { metier: "salle de sport",    specialty: "remise en forme",                    servicesIntro: "Cours collectifs, musculation et coaching personnalisé." },
  auto_ecole:   { metier: "auto-école",        specialty: "permis de conduire",                 servicesIntro: "Formation B, AAC, conduite supervisée." },
  epicerie:     { metier: "épicerie",          specialty: "produits du quotidien",              servicesIntro: "Fruits, légumes, épicerie fine et produits locaux." },
};

interface Prospect {
  name: string;
  city?: string | null;
  business_type?: string | null;
  about_scraped?: string | null;
  menu_items?: Array<{ name?: string; price?: string; description?: string }> | null;
}

/**
 * Nettoie un texte scrapé (HTML, entités, menus de nav, espaces).
 * + supprime tout fragment de Lorem Ipsum ou placeholder résiduel
 *   (garantie zéro faux texte dans les maquettes).
 */
function cleanScraped(raw: string): string {
  return raw
    .replace(/&[a-z]+;/gi, " ")
    .replace(/&#x?[0-9a-f]+;/gi, " ")
    .replace(/<[^>]+>/g, " ")
    // Anti Lorem Ipsum strict
    .replace(/\b(lorem|ipsum|dolor|sit amet|consectetur|adipiscing|sed do|eiusmod|tempor|incididunt|exercitation|ullamco|laboris|nisi|aliquip|consequat|duis aute|reprehenderit|voluptate|esse cillum|dolore eu|fugiat|nulla pariatur)\b[\s,.;:!?-]*/gi, " ")
    // Placeholders type {{x}} ${x} [NOM]
    .replace(/\{\{\s*[a-z_][a-z_0-9]*\s*\}\}/gi, " ")
    .replace(/\$\{[a-z_][a-z_0-9]*\}/gi, " ")
    .replace(/\[NOM\]|\[NAME\]|\[CITY\]|\[VILLE\]/gi, " ")
    // Junk navigation
    .replace(/(Fermer|Recherche|Passer au contenu|Menu|Accueil|Contact|À propos|CGV|Mentions légales|Newsletter|Se connecter|Connexion|Panier|Mon compte|Cookies?|RGPD)[^\n.]{0,80}/gi, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Vrai si la chaîne contient encore du Lorem Ipsum, un placeholder résiduel,
 * OU une méta-instruction de design (bug observé "Hero moderne avec photos...").
 * Utilisé en post-validation pour rejeter les contenus pourris.
 */
function containsForbiddenText(s: string): boolean {
  if (!s) return false;
  // Lorem Ipsum + placeholders
  if (/lorem ipsum|dolor sit amet|consectetur adipiscing|\{\{[^}]+\}\}|\$\{[a-z_0-9]+\}|\[NOM\]|\[NAME\]|\[VILLE\]/i.test(s)) return true;
  // Méta-instructions de design qui se retrouvent comme contenu (bug Stitch/OpenDesign)
  if (/Hero\s+(?:moderne|élégant|premium|cinematic|sombre)\s+avec/i.test(s)) return true;
  if (/avec\s+(?:photos?\s+existantes?|nom\s+\+\s+ville)/i.test(s)) return true;
  if (/\+\s*nom\s*\+\s*ville/i.test(s)) return true;
  if (/(?:photos?|images?)\s+(?:scrap(?:p)?ées?|du\s+commerce|du\s+site)/i.test(s)) return true;
  if (/votre\s+(?:texte|contenu)\s+ici/i.test(s)) return true;
  if (/pas\s+de\s+(?:texte|description)\s+disponible/i.test(s)) return true;
  if (/\bN\/A\b|\bnot\s+available\b/i.test(s)) return true;
  return false;
}

/**
 * Construit le MockupContent à partir d'un prospect.
 * Pas d'IA — fallback déterministe basé sur les données scrapées.
 */
export function buildContentFromProspect(p: Prospect): MockupContent {
  const bt = p.business_type || "restaurant";
  const label = BUSINESS_LABELS[bt] || BUSINESS_LABELS.restaurant;
  const city = p.city || "France";

  // Hero — TOUJOURS du contenu pur (jamais une instruction de design).
  // Bug historique : certaines maquettes affichaient "Hero moderne avec photos
  // existantes + nom + ville" → c'était le commentaire de prompt qui fuyait.
  // Ici on force un sous-titre simple et lisible, basé sur les vraies données.
  const heroTitle = p.name;
  let heroSubtitle = `Votre ${label.metier} à ${city}`;
  // Safety net : si jamais quelque chose injecte une méta-instruction, on remet propre
  if (containsForbiddenText(heroSubtitle)) {
    heroSubtitle = `${label.metier.charAt(0).toUpperCase() + label.metier.slice(1)} à ${city}`;
  }

  // About
  const aboutTitle = `Le savoir-faire d'un ${label.metier} passionné`;
  let aboutText = "";
  if (p.about_scraped && p.about_scraped.length > 50) {
    const cleaned = cleanScraped(p.about_scraped);
    const sentences = cleaned.split(/(?<=[.!?])\s+/).filter(s => s.length > 30 && s.length < 250);
    aboutText = sentences.slice(0, 3).join(" ");
  }
  // ⚠️ Si aboutText contient encore du Lorem Ipsum résiduel, on rejette et fallback
  if (!aboutText || aboutText.length < 60 || containsForbiddenText(aboutText)) {
    aboutText = `${p.name} vous accueille à ${city} avec un savoir-faire éprouvé en ${label.specialty}. Notre équipe met son expertise au service de chaque client pour un résultat à la hauteur de vos attentes.`;
  }

  // Services
  let services: Array<{ name: string; description?: string; price?: string }> = [];
  if (p.menu_items && p.menu_items.length > 0) {
    services = p.menu_items
      .filter(m => m.name && m.name.length > 1 && m.name.length < 60 && !containsForbiddenText(m.name) && !containsForbiddenText(m.description || ""))
      .slice(0, 6)
      .map(m => ({
        name: m.name!,
        description: m.description?.slice(0, 100),
        price: m.price?.replace(/^(\d+)$/, "$1 €"),
      }));
  }
  // Fallback : 6 services génériques par métier
  if (services.length === 0) {
    services = generateFallbackServices(bt);
  }

  return {
    heroTitle,
    heroSubtitle,
    aboutTitle,
    aboutText,
    servicesIntro: label.servicesIntro,
    services,
  };
}

function generateFallbackServices(bt: string): Array<{ name: string; description?: string; price?: string }> {
  const FALLBACK: Record<string, Array<{ name: string; description?: string }>> = {
    plombier: [
      { name: "Dépannage urgence",  description: "Fuite, débouchage, chauffe-eau hors service." },
      { name: "Installation sanitaire", description: "Pose et rénovation salle de bain, WC, cuisine." },
      { name: "Chauffage", description: "Chaudière, radiateurs, plancher chauffant." },
      { name: "Détection de fuite", description: "Localisation précise sans casse." },
      { name: "Mise aux normes", description: "Conformité plomberie et gaz." },
      { name: "Entretien annuel", description: "Contrats d'entretien chaudière." },
    ],
    electricien: [
      { name: "Mise aux normes", description: "Tableau électrique, prises de terre, conformité." },
      { name: "Installation neuve", description: "Tirage de câbles, pose de tableaux." },
      { name: "Dépannage 24/7", description: "Panne de courant, court-circuit." },
      { name: "Domotique", description: "Volets, éclairage, alarme connectée." },
      { name: "Bornes de recharge", description: "Installation IRVE véhicule électrique." },
      { name: "Audit électrique", description: "Diagnostic complet de votre installation." },
    ],
    menuisier: [
      { name: "Escaliers sur mesure", description: "Bois massif, contraintes techniques maîtrisées." },
      { name: "Fenêtres bois", description: "Fenêtres standards et sur mesure." },
      { name: "Terrasses", description: "Bois ou composite, durables et esthétiques." },
      { name: "Meubles bois massif", description: "Tables, dressings et meubles uniques." },
      { name: "Installations & réparations", description: "Intervention pour vos menuiseries." },
      { name: "Ébénisterie d'art", description: "Pièces uniques, restauration de meubles." },
    ],
    garage: [
      { name: "Entretien périodique", description: "Vidange, freins, courroie de distribution." },
      { name: "Carrosserie", description: "Tôlerie, peinture, débosselage sans peinture." },
      { name: "Diagnostic électronique", description: "Lecture de codes défauts, expertise." },
      { name: "Climatisation auto", description: "Recharge, désinfection, étanchéité." },
      { name: "Pneumatiques", description: "Montage, équilibrage, géométrie." },
      { name: "Contrôle technique", description: "Pré-contrôle et contre-visite." },
    ],
    restaurant: [
      { name: "Menu du jour",      description: "Une formule courte changée chaque midi." },
      { name: "Carte de saison",   description: "Plats inspirés des produits du moment." },
      { name: "Plats signatures",  description: "Les incontournables de la maison." },
      { name: "Desserts maison",   description: "Pâtisseries et glaces préparées sur place." },
      { name: "Boissons & vins",   description: "Sélection de vins régionaux et boissons artisanales." },
      { name: "À emporter",        description: "Commande en avance, prête à l'heure." },
    ],
    coiffeur: [
      { name: "Coupe femme", description: "Coupe, brushing, conseil personnalisé." },
      { name: "Coupe homme", description: "Coupe et taille de barbe." },
      { name: "Coloration", description: "Couleurs naturelles, mèches, balayage." },
      { name: "Soins capillaires", description: "Rituels nourrissants et réparateurs." },
      { name: "Mariage & événement", description: "Coiffure et essai sur rendez-vous." },
      { name: "Coupe enfant", description: "Une première coupe en douceur." },
    ],
    institut: [
      { name: "Soin du visage", description: "Nettoyage, gommage, masque personnalisé." },
      { name: "Massage relaxant", description: "Détente musculaire et drainage." },
      { name: "Épilation", description: "Cire chaude, tiède ou laser selon besoins." },
      { name: "Manucure & pédicure", description: "Pose vernis, gel, décoration." },
      { name: "Maquillage", description: "Jour, soir, mariage, séance photo." },
      { name: "Cabines duo", description: "Soin à deux en cabine privée." },
    ],
    boulangerie: [
      { name: "Pain au levain", description: "Cuit au four à sole." },
      { name: "Baguette tradition", description: "Croûte croustillante et mie alvéolée." },
      { name: "Viennoiseries", description: "Croissants, pains au chocolat, brioches." },
      { name: "Pâtisseries maison", description: "Tartes, éclairs, mille-feuilles." },
      { name: "Sandwichs", description: "Frais, préparés chaque matin." },
      { name: "Commandes spéciales", description: "Pour vos événements, sur demande." },
    ],
    epicerie: [
      { name: "Fruits & légumes",    description: "Frais, locaux, de saison." },
      { name: "Épicerie sèche",      description: "Pâtes, riz, conserves, légumineuses." },
      { name: "Produits régionaux",  description: "Spécialités du terroir." },
      { name: "Boissons",            description: "Cave, soft drinks, jus pressés." },
      { name: "Crémerie",            description: "Fromages, yaourts, beurre." },
      { name: "Dépannage 7j/7",      description: "Service de proximité." },
    ],
  };
  return FALLBACK[bt] || FALLBACK.restaurant;
}
