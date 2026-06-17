# Klyora Sites — Brief de génération pour Stitch

## Contexte business

Klyora Sites est une agence française qui crée des sites web personnalisés
pour des artisans et commerçants locaux (TPE/PME). Notre commercial envoie
une maquette pré-faite à chaque prospect par email, le prospect saisit un
code d'accès pour la consulter, et peut commander en 1 clic depuis la
maquette (320 € + 17,90 €/mois).

Le destinataire est le **gérant** de la boîte locale (souvent 40-60 ans,
faible appétence digitale, méfiant). La maquette doit lui inspirer
confiance immédiate, prouver qu'on connaît son métier, et déclencher
un achat impulsif (~30 secondes d'attention).

## Design system commun à TOUTES les maquettes

### Palette de base (variations par métier ci-dessous)

- `--surface` : fond principal (clair, jamais blanc pur)
- `--on-surface` : texte principal (noir profond)
- `--primary` : couleur métier (rouge sang pour resto, bleu acier pour
  plombier, vert sauge pour fleuriste, etc.)
- `--on-primary` : blanc cassé sur la couleur primaire
- `--secondary` : couleur d'accent (or, terre cuite, parchemin)
- `--outline` : gris bordures

### Typographies (DOIVENT être les mêmes partout)

- **Display** (titres hero) : `EB Garamond` 600 — élégant, serif, intemporel
- **Headline** (h2, h3) : `EB Garamond` 500
- **Body** (paragraphes) : `Plus Jakarta Sans` 400
- **Label** (CTA, mention) : `Plus Jakarta Sans` 700, letter-spacing 0.08em

### Layout commun

- `max-width container` : 1200 px
- `padding mobile` : 1.5 rem
- `padding desktop` : 4 rem
- Mobile-first OBLIGATOIRE
- `border-radius` : 8 px (boutons) / 12 px (cartes)
- Pas d'ombres lourdes (Material 3 élévation 1-2 max)
- Texture overlay subtile (SVG noise 4 % opacity) sur le fond

### Sections OBLIGATOIRES (toutes les maquettes)

1. **Nav sticky** : logo (nom du commerce en gros + petit point de
   couleur primaire), 3-4 liens d'ancrage, CTA "Réserver / Devis / Appeler"
2. **Hero** : 80vh, image bg pleine page (avec voile sombre 50%), titre
   géant en EB Garamond, baseline en 1 ligne, 1 CTA primaire centré.
   Animation fade-in-up sur les éléments (delays 100, 200, 300 ms).
3. **Section "Notre savoir-faire"** : 2 colonnes 50/50 (texte gauche +
   image droite), 2 paragraphes corps.
4. **Section "Nos services"** : grid 3 colonnes (cartes Material 3),
   chaque carte = icône Material Symbols + titre + 1 phrase descriptive.
5. **Section "Contact / Venir"** : adresse + tél + email + lien Google Maps,
   bouton "M'y rendre" qui ouvre l'app de nav du téléphone.
6. **Footer sobre** : 3 colonnes (coordonnées / navigation / mention légale).
7. **Bouton flottant "Réserver / Devis"** en bas à droite mobile.

### Contraintes ABSOLUES (non négociables)

- ❌ **AUCUN visage humain** dans les images — politique stricte juin 2026
  suite à un préjudice. Utiliser uniquement : intérieur de boutique,
  produit en gros plan, outils du métier, ambiance, texture matière.
  Mots-clés Unsplash : `empty-interior`, `tools-flat-lay`, `product-close-up`,
  `workshop-detail`, jamais `chef`, `hairdresser`, `mechanic`, etc.
- ❌ **Aucun lien externe** vers un site concurrent ou réseau social tiers.
- ❌ **Aucun stock photo cliché** (poignée de main générique, salle de
  réunion, etc.). On veut du métier spécifique.
- ✅ **Tout en français**, ton chaleureux + pro, jamais condescendant.
- ✅ Tagline en bas de hero : 1 ligne max 7 mots.

## Variations PAR MÉTIER

Pour chacun des 15 métiers ci-dessous, génère **une maquette dédiée**
(donc 15 screens distincts) en respectant la structure commune mais
en personnalisant : palette, ton, sections optionnelles, icônes, photos.

---

### 1. 🔧 PLOMBIER (priorité MAX — 265 prospects)

- **Vibe** : confiance, urgence maîtrisée, disponibilité 24/7
- **Palette** : `--primary: #1e40af` (bleu acier), `--secondary: #0ea5e9` (bleu eau)
- **Hero h1** : "Nom Du Plombier"
- **Hero baseline** : "Dépannage rapide et travaux propres à [Ville]"
- **CTA primaire** : "Devis en 1 min"
- **Section spéciale** : "Nos interventions" (urgence fuite, dépannage chauffe-eau,
  rénovation salle de bain, débouchage, installation sanitaire)
- **Bandeau urgence** : "Disponible 7j/7 — délai d'intervention 2h max"
- **Visuels** : tuyauterie cuivre, mitigeur design, salle de bain moderne vide,
  outils de plombier en flat lay, chaudière neuve

### 2. ⚡ ÉLECTRICIEN (priorité MAX — 88 prospects)

- **Vibe** : précision, sécurité, certifié Qualifelec
- **Palette** : `--primary: #ca8a04` (jaune électrique sobre), `--secondary: #1c1917` (noir)
- **Hero baseline** : "Installation et dépannage électrique à [Ville]"
- **CTA** : "Diagnostic gratuit"
- **Badges** : "Certifié Qualifelec" + "Devis gratuit" + "Garantie décennale"
- **Section** : "Mise aux normes / Tableaux électriques / Domotique / Bornes VE"
- **Visuels** : tableau électrique moderne, prise design, ampoule LED,
  installation propre, outils flat-lay

### 3. 🚗 GARAGE / MÉCANIQUE (15 prospects)

- **Vibe** : honnêteté tarifaire, réactivité, expert toutes marques
- **Palette** : `--primary: #b91c1c` (rouge mécanique), `--secondary: #1f2937` (gris atelier)
- **Hero baseline** : "Mécanique toutes marques à [Ville]"
- **CTA** : "Prendre RDV"
- **Section** : "Entretien / Révision / Pneus / Climatisation / Diagnostic OBD"
- **Visuels** : voiture sur pont élévateur (vide de personnage), moteur en gros plan,
  pneus alignés, atelier propre

### 4. 🦷 DENTISTE / CABINET DENTAIRE (7)

- **Vibe** : hygiène absolue, sérénité, expertise
- **Palette** : `--primary: #14b8a6` (turquoise apaisant), `--secondary: #f8fafc`
- **Hero baseline** : "Cabinet dentaire — [Ville]"
- **CTA** : "Prendre rendez-vous"
- **Section** : "Soins / Esthétique / Implantologie / Orthodontie / Urgences"
- **Section bonus** : "Doctolib" intégration (juste un bouton qui ouvre le lien)
- **Visuels** : cabinet vide moderne, fauteuil de soin design, instruments stérilisés
  sur plateau, vue détail céramique dentaire

### 5. 🌿 OSTÉOPATHE / KINÉSITHÉRAPEUTE (7)

- **Vibe** : bien-être, mains expertes, science + intuition
- **Palette** : `--primary: #64748b` (zen ardoise), `--secondary: #d6d3d1`
- **Hero baseline** : "Ostéopathie à [Ville]"
- **CTA** : "Réserver une séance"
- **Section** : "Adultes / Sportifs / Nourrissons / Femmes enceintes / Personnes âgées"
- **Visuels** : table de soin vide, pierres zen, bougies, plante verte, intérieur cabinet

### 6. ☕ CAFÉ / BISTROT (6)

- **Vibe** : ambiance parisienne, terrasse ensoleillée, second home
- **Palette** : `--primary: #78350f` (brun café), `--secondary: #fcd34d` (or)
- **Hero baseline** : "Café — [Ville]"
- **CTA** : "Voir nos horaires"
- **Section** : "Petit-déjeuner / Déjeuner / Boissons / Pâtisseries maison"
- **Visuels** : terrasse vide, espresso en gros plan, croissant + café, intérieur
  comptoir zinc

### 7. 🛒 ÉPICERIE FINE / CAVE À VINS (4)

- **Vibe** : circuit court, sélection rare, conseil personnalisé
- **Palette** : `--primary: #5a6333` (vert olive), `--secondary: #fef3c7`
- **Hero baseline** : "Épicerie fine à [Ville]"
- **CTA** : "Venir en boutique"
- **Section** : "Nos producteurs / Coffrets cadeaux / Vins / Conserves / Fromages"
- **Visuels** : étalage fruits, bouteilles de vin alignées, conserves vintage,
  fromages sur planche bois

### 8. 🥐 BOULANGERIE / PÂTISSERIE (1 mais futur volume)

- **Vibe** : artisanat français, pain à la française, vitrine gourmande
- **Palette** : `--primary: #c2410c` (terre cuite four), `--secondary: #fef3c7` (mie)
- **Hero baseline** : "Boulangerie artisanale à [Ville]"
- **CTA** : "Voir la vitrine du jour"
- **Section** : "Pains / Viennoiseries / Pâtisseries / Sandwichs / Commandes spéciales"
- **Visuels** : baguette en gros plan, viennoiseries, four en pierre, blé en épi

### 9. 💇 SALON DE COIFFURE (3 — déjà couvert mais on peut améliorer)

- **Vibe** : sur-mesure, écoute, soin du cheveu
- **Palette** : `--primary: #831843` (vieux rose), `--secondary: #fbcfe8`
- **Hero baseline** : "Salon de coiffure à [Ville]"
- **CTA** : "Réserver en ligne"
- **Section** : "Coupe / Couleur / Soins / Coiffure mariage"
- **Visuels** : salon vide design, fauteuil rose, ciseaux + peigne flat-lay,
  produits coiffure sur étagère

### 10. 💅 INSTITUT DE BEAUTÉ / SPA (futur)

- **Vibe** : cocon, détente, rituel
- **Palette** : `--primary: #7e22ce` (violet doux), `--secondary: #fae8ff`
- **Hero baseline** : "Institut de beauté à [Ville]"
- **CTA** : "Réserver mon soin"
- **Section** : "Visage / Corps / Manucure / Épilation / Massages"
- **Visuels** : pierres chaudes, bougies, table massage vide, huiles essentielles

### 11. 🌸 FLEURISTE

- **Vibe** : poésie, fraîcheur, occasions de la vie
- **Palette** : `--primary: #166534` (vert profond), `--secondary: #fde68a`
- **Hero baseline** : "Fleuriste artisan à [Ville]"
- **CTA** : "Commander un bouquet"
- **Section** : "Bouquets / Compositions / Mariages / Deuil / Livraison"
- **Visuels** : bouquet de roses, vitrine boutique, fleurs en gros plan, mariage déco

### 12. 🚙 AUTO-ÉCOLE

- **Vibe** : sérieux, taux de réussite, jeunesse
- **Palette** : `--primary: #2563eb` (bleu officiel), `--secondary: #fde047` (jaune permis)
- **Hero baseline** : "Auto-école — [Ville]"
- **CTA** : "S'inscrire"
- **Section** : "Code / Permis B / Conduite accompagnée / Boîte auto / Permis BE"
- **Stats** : "92 % de réussite au code" / "85 % à la conduite" (variables)
- **Visuels** : volant en gros plan, tableau de bord, voiture école devant école,
  panneaux routiers stylisés

### 13. 🐾 VÉTÉRINAIRE

- **Vibe** : douceur, écoute, expertise animale
- **Palette** : `--primary: #0891b2` (cyan apaisant), `--secondary: #ecfeff`
- **Hero baseline** : "Cabinet vétérinaire — [Ville]"
- **CTA** : "Prendre RDV"
- **Section** : "Consultations / Chirurgie / Vaccins / Urgences / Chats / Chiens / NAC"
- **Visuels** : table d'examen vide, stéthoscope, croquettes premium, salle d'attente
  cocon

### 14. 🛋️ MENUISIER / ÉBÉNISTE

- **Vibe** : sur-mesure, bois noble, savoir-faire ancestral
- **Palette** : `--primary: #78350f` (chêne brun), `--secondary: #fde68a` (chêne clair)
- **Hero baseline** : "Menuiserie sur mesure à [Ville]"
- **CTA** : "Demander un devis"
- **Section** : "Cuisines / Dressings / Escaliers / Terrasses / Fenêtres / Volets"
- **Visuels** : atelier bois copeaux, fibre du bois macro, dressing fini, escalier
  design

### 15. 🏠 COUVREUR / CHARPENTIER

- **Vibe** : robustesse, garantie décennale, expérience
- **Palette** : `--primary: #57534e` (ardoise), `--secondary: #e7e5e4`
- **Hero baseline** : "Couvreur — [Ville]"
- **CTA** : "Demander un devis"
- **Section** : "Tuiles / Ardoises / Zinguerie / Isolation toiture / Démoussage"
- **Visuels** : toit ardoises macro, charpente bois, gouttière zinc neuf

---

## Format de livrable attendu

Pour chacune des 15 maquettes :

1. Un fichier `index.html` autosuffisant (Tailwind via CDN OK)
2. Toutes les couleurs en variables CSS au top du <style>
3. JavaScript inline (pas de fichier séparé) pour :
   - Scroll-reveal des sections
   - Smooth scroll sur les ancres de nav
   - Bouton flottant CTA mobile
   - (Bonus) animation Three.js si le métier s'y prête (pizzeria → pizza qui
     tourne ; auto-école → volant ; fleuriste → fleur qui éclot)
4. Mobile responsive obligatoire (testez à 375 px)
5. Toutes les images en placeholder Unsplash (URL `images.unsplash.com/photo-...`),
   identifiées par mot-clé métier

Le HTML doit utiliser des **placeholders en `{{NAME}}`, `{{CITY}}`, `{{ADDRESS}}`,
`{{PHONE}}`, `{{EMAIL}}`** pour que je puisse les templater côté serveur.

Exemple :
```html
<h1 class="font-display-lg text-white">{{NAME}}</h1>
<p>Notre boutique vous accueille à {{CITY}}</p>
```

---

## Ce qui m'évitera de revenir avec des corrections

- ❌ Pas de bibliothèque externe au-delà de Tailwind CDN, Google Fonts,
  Material Symbols, et Three.js (si bonus)
- ❌ Pas d'iframe (Maps, YouTube) — on remplacera par un bouton qui ouvre
  l'app native du téléphone
- ❌ Pas de JS jQuery / Bootstrap
- ✅ Code clean lisible, indentation 2 espaces
- ✅ Commentaires HTML pour séparer les sections (`<!-- Hero -->`, etc.)

Si une section ne marche pas pour un métier (ex: vétérinaire n'a pas de "menu"),
adapte-la intelligemment (ex: "Espèces traitées" à la place).

Merci !
