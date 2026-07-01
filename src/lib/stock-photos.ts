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
    // ─── BOUQUETS (vérifiés via scrape Unsplash search "flower-bouquet") ───
    "https://images.unsplash.com/photo-1582794543139-8ac9cb0f7b11?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1523693916903-027d144a2b7d?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1572454591674-2739f30d8c40?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1589095181425-c038b3871b6a?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1567696153798-9111f9cd3d0d?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1533616688419-b7a585564566?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1622658641558-235f26dd270b?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1561848355-890d054dc55a?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1531120364508-a6b656c3e78d?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1587317996237-eddd7e834d84?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1615385639736-362b69696227?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1685613858397-64f79a0f3603?w=1400&auto=format&fit=crop&q=85",
    // ─── BOUTIQUES / ATELIERS (vérifiés via scrape Unsplash "florist-shop") ───
    "https://images.unsplash.com/photo-1589244159943-460088ed5c92?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1531058240690-006c446962d8?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1639696194673-67b86204b885?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1616614992443-72324b4f83c6?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1619707046314-e76ae25d5ab3?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1589243853654-393fcf7c870b?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1603912699214-92627f304eb6?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1560243563-62087d88da39?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1574060275293-559b9b6869f6?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1567696153410-7ae55f32e4dc?w=1400&auto=format&fit=crop&q=85",
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
    // ─── OSTÉOPATHIE (vérifiés via Unsplash "osteopathy") ──
    "https://images.unsplash.com/photo-1661779394380-e372d6a1f198?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1699523229208-be1e1dd9252d?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1699523229487-bddb965a3307?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1683133816393-b04d94c65872?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1699523229199-fce5aa6b0ec3?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1699523229212-c25a2fadeb12?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1699523229257-76f576d27eed?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1661779581951-eb3a2fe942bb?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1620051844584-15ac31d5fccd?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1699523229202-e9ec48a3ea68?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1699523229208-44963df7a087?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1661771960993-02db2120b719?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1620050382792-434b5828873d?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1699523229232-dce23cce2f22?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1620052079778-7d5b7509645c?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1661698465350-dab93e1b2df8?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1699523229921-ba6253ad0277?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1699523229373-b17fb654735a?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1671561038555-9011010fed6b?w=1400&auto=format&fit=crop&q=85",
  ],
  veterinaire: [
    "https://images.unsplash.com/photo-1535930891776-0c2dfb7fda1a?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1583511655826-05700a52f23b?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1576201836106-db1758fd1c97?w=1200&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1612531386530-97286d97c2d2?w=1200&auto=format&fit=crop",
  ],
  plombier: [
    // ─── PLOMBIERS / INTERVENTIONS (vérifiés via Unsplash "plumber") ──
    "https://images.unsplash.com/photo-1749532125405-70950966b0e5?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1676210134188-4c05dd172f89?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1542013936693-884638332954?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1620653713380-7a34b773fef8?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1676210133055-eab6ef033ce3?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1621207418485-99c705420785?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1650551182991-b07558247564?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1659353588842-891391e6fcd4?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1562159937-194305937c6a?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1669920282730-ab422e592f97?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=1400&auto=format&fit=crop&q=85",
    // ─── TUYAUX / PLOMBERIE (vérifiés via "plumbing-pipes") ──
    "https://images.unsplash.com/photo-1538474705339-e87de81450e8?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1607472586893-edb57bdc0e39?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1545193329-4a052e14eb8f?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1639600993675-2281b2c939f0?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1543674892-7d64d45df18b?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1646009445351-b8192e095f3a?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1586057285471-2f78bffaf074?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1596394723269-b2cbca4e6313?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1606340671662-27ee685dd111?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1642797735471-3e90055c5ff9?w=1400&auto=format&fit=crop&q=85",
  ],
  electricien: [
    // ─── ÉLECTRICIENS / TABLEAU ÉLECTRIQUE (vérifiés via Unsplash "electrician") ──
    "https://images.unsplash.com/photo-1682345262055-8f95f3c513ea?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1635335874521-7987db781153?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1555963966-b7ae5404b6ed?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1665242043190-0ef29390d289?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1544724569-5f546fd6f2b5?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1660330589693-99889d60181e?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1646640381839-02748ae8ddf0?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1683295083329-4d4738291f3a?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1597502310092-31cdaa35b46d?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1473308822086-710304d7d30c?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1581972327480-e3764d31e5e6?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1601462904263-f2fa0c851cb9?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1555961861337-386741f07ff2?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1641662541726-527734cb4708?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1682301197112-b1037d1c6205?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1682301236166-06dda3d0a654?w=1400&auto=format&fit=crop&q=85",
  ],
  dentiste: [
    // ─── CABINET / ÉQUIPEMENT (vérifié via Unsplash "dental-clinic") ───
    "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1677026010083-78ec7f1b84ed?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1593022356769-11f762e25ed9?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1606811856475-5e6fcdc6e509?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1588776814546-daab30f310ce?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1564420228450-d9a5bc8d6565?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1643660526741-094639fbe53a?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1600170311833-c2cf5280ce49?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1667133295352-ef4c83620e8e?w=1400&auto=format&fit=crop&q=85",
    // ─── PATIENTS SOURIANTS (vérifié via Unsplash "dentist-smile") ───
    "https://images.unsplash.com/photo-1489278353717-f64c6ee8a4d2?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1667133295315-820bb6481730?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1698749778813-ad5f2814e50f?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1548382131-e0ebb1f0cdea?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1631051103633-24959376b92d?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1667133295308-9ef24f71952e?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1567516364473-233c4b6fcfbe?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1611695434369-a8f5d76ceb7b?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1562337404-3044c84ac061?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1663755489920-5e09f66d011a?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1674775372058-c4c8813c6611?w=1400&auto=format&fit=crop&q=85",
    "https://images.unsplash.com/photo-1662837625421-5fd8ed6131a0?w=1400&auto=format&fit=crop&q=85",
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
