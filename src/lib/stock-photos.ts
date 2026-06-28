/**
 * Photos stock pré-curées Unsplash par métier.
 * URLs directes Unsplash (HTTP 200 stables, libre de droits, w=1200 optimisé).
 *
 * Utilisé en fallback quand le site du prospect n'a pas d'images de
 * qualité scrapées. Garantit que la maquette aura toujours de belles
 * photos pro qui correspondent au métier.
 */

export type Metier = "garage" | "boulangerie" | "patisserie" | "cafe" | "coiffeur" | "institut"
  | "fleuriste" | "menuisier" | "couvreur" | "epicerie" | "osteo" | "veterinaire"
  | "plombier" | "electricien" | "dentiste" | "autoecole" | "restaurant" | "default";

/** Galerie de photos stock par métier (URLs Unsplash directes, w=1200). */
const STOCK_PHOTOS: Record<Metier, string[]> = {
  garage: [
    "https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1493238792000-8113da705763?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542362567-b07e54358753?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&auto=format&fit=crop",
  ],
  boulangerie: [
    "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1568254183919-78a4f43a2877?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1608198093002-ad4e005484ec?w=1200&auto=format&fit=crop",
  ],
  patisserie: [
    "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1486427944299-d1955d23e34d?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1464195244916-405fa0a82545?w=1200&auto=format&fit=crop",
  ],
  cafe: [
    "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521017432531-fbd92d768814?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=1200&auto=format&fit=crop",
  ],
  coiffeur: [
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1599387737224-30f7ec1d3a9d?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1580618672591-eb180b1a973f?w=1200&auto=format&fit=crop",
  ],
  institut: [
    "https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1610705267928-1b9b3b6e0f8a?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1519415943484-9fa1873496d4?w=1200&auto=format&fit=crop",
  ],
  fleuriste: [
    "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1567696911980-2c30b6f93dee?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1508610048659-a06b669e3321?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542652694-40abf526446e?w=1200&auto=format&fit=crop",
  ],
  menuisier: [
    "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1572297705236-fbcfa53c84ec?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1565372595459-2b2c41f55e9f?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503602642458-232111445657?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1572297994559-13e3d05a8d24?w=1200&auto=format&fit=crop",
  ],
  couvreur: [
    "https://images.unsplash.com/photo-1632935190508-bc4f8f5e1f9d?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1605146768851-eda79da39897?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1542621334-a254cf47733d?w=1200&auto=format&fit=crop",
  ],
  epicerie: [
    "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604719312566-8912e9227c6a?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1473093226795-af9932fe5856?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1506617420156-8e4536971650?w=1200&auto=format&fit=crop",
  ],
  osteo: [
    "https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1571019613540-996a69725840?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1666887360742-974c8fce8e6b?w=1200&auto=format&fit=crop",
  ],
  veterinaire: [
    "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1583511655826-05700a52f23b?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=1200&auto=format&fit=crop",
  ],
  plombier: [
    "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1585147303207-8e8f5b66e8a8?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1604754742629-3e0498a8c75d?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1620421680010-0766ff230392?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1593618998160-e34014e67546?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1572883454114-1cf0031ede2a?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1581858726788-75bc0f6a952d?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1503602642458-232111445657?w=1200&auto=format&fit=crop",
  ],
  electricien: [
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1632862037389-4ec88080b1bd?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497436072909-60f360e1d4b1?w=1200&auto=format&fit=crop",
  ],
  dentiste: [
    "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1200&auto=format&fit=crop",
  ],
  autoecole: [
    "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=1200&auto=format&fit=crop",
  ],
  restaurant: [
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1559925393-8be0ec4767c8?w=1200&auto=format&fit=crop",
  ],
  default: [
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&auto=format&fit=crop",
  ],
};

/** Détecte le métier à partir du business_type + nom. */
export function detectMetierForStock(input: string): Metier {
  const s = input.toLowerCase();
  if (/garage|garagi|m[eé]canicien|carrosseri|concession|automobile|auto[^c]/.test(s)) return "garage";
  if (/p[aâ]tisser|p[aâ]tissi|chocolat/.test(s)) return "patisserie";
  if (/boulanger/.test(s)) return "boulangerie";
  if (/caf[eé](?!fer)/.test(s)) return "cafe";
  if (/coiffeu|salon\s*de\s*coiffure/.test(s)) return "coiffeur";
  if (/institut|esth[eé]ti|beaut[eé]/.test(s)) return "institut";
  if (/fleurist/.test(s)) return "fleuriste";
  if (/menuis/.test(s)) return "menuisier";
  if (/couvreur|toitur|zinguer/.test(s)) return "couvreur";
  if (/[eé]picerie/.test(s)) return "epicerie";
  if (/ost[eé]o/.test(s)) return "osteo";
  if (/v[eé]t[eé]rinaire|clinique\s*animal/.test(s)) return "veterinaire";
  if (/plomb/.test(s)) return "plombier";
  if (/electric|électrici|électrique/.test(s)) return "electricien";
  if (/dentiste|dental|orthodont|cabinet[ -]dentaire/.test(s)) return "dentiste";
  if (/auto[\s-]*[eé]cole/.test(s)) return "autoecole";
  if (/restaurant|bistro|brasseri|pizz/.test(s)) return "restaurant";
  return "default";
}

/** Récupère N photos stock pour un métier donné. Stable (pas de random). */
export function getStockPhotosForMetier(metier: Metier, count: number = 6): string[] {
  const photos = STOCK_PHOTOS[metier] || STOCK_PHOTOS.default;
  return photos.slice(0, count);
}

/** Récupère 1 hero image pour un métier (la 1ère de la liste). */
export function getHeroPhotoForMetier(metier: Metier): string {
  const photos = STOCK_PHOTOS[metier] || STOCK_PHOTOS.default;
  return photos[0];
}
