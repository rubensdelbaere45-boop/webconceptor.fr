/**
 * Applique le DNA visuel scrapé du site existant à une maquette Stitch
 * pixel-pixel déjà générée.
 *
 * Transformations :
 * 1. Couleur primaire → swap dans tailwind.config + utilités CSS hex
 * 2. Couleur accent → swap pareil
 * 3. Logo URL → inject dans nav (si présent)
 *
 * Le DESIGN Stitch reste pixel-pixel, on rebrand juste la palette
 * pour que la maquette ressemble visuellement au site existant
 * du prospect.
 */
import type { WebsiteDna } from "./scrape-prospect-site";

/**
 * Couleur "marque" de chaque template Stitch (réellement utilisée dans le
 * HTML rendu via classes Tailwind hardcodées type `bg-[#xxx]`).
 *
 * Pour les templates noir/blanc (peu/pas de couleur marque), on garde la
 * valeur d'origine mais le swap aura peu d'effet visuel — c'est OK, le
 * design Stitch est censé rester pixel-pixel.
 *
 * Valeurs validées par script Python sur les vrais code.html du dossier
 * stitch_klyora_stitch_templates/ (le 20/06/2026).
 */
const TEMPLATE_PRIMARY_COLORS: Record<string, { primary: string; accent: string }> = {
  "pixel:plombier":     { primary: "#1e40af", accent: "#0ea5e9" }, // bleu+cyan (vu 10x+4x)
  "pixel:electricien":  { primary: "#ca8a04", accent: "#000000" }, // or sur noir
  "pixel:dentiste":     { primary: "#000000", accent: "#ca8a04" }, // noir sur or
  "pixel:boulangerie":  { primary: "#c2410c", accent: "#f59e0b" }, // orange brûlé + ambre
  "pixel:osteo":        { primary: "#000000", accent: "#666666" }, // noir/gris (peu colorée)
  "pixel:garage":       { primary: "#b91c1c", accent: "#1f2937" }, // rouge sombre + gris
  "pixel:institut":     { primary: "#7e22ce", accent: "#fae8ff" }, // violet + lavande
  "pixel:cafe":         { primary: "#78350f", accent: "#fbbf24" }, // brun + ambre
  "pixel:menuisier":    { primary: "#78350f", accent: "#fde68a" }, // brun bois + jaune doré
  "pixel:fleuriste":    { primary: "#166534", accent: "#84cc16" }, // vert
  "pixel:coiffeur":     { primary: "#000000", accent: "#666666" }, // noir/gris
  "pixel:autoecole":    { primary: "#000000", accent: "#666666" }, // noir/gris
  "pixel:epicerie":     { primary: "#000000", accent: "#666666" }, // noir/gris
  "pixel:couvreur":     { primary: "#000000", accent: "#666666" }, // noir/gris
  "pixel:veterinaire":  { primary: "#0891b2", accent: "#666666" }, // cyan
};

/** Récupère la luminance d'une couleur hex (0-255). */
function luminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

/** Couleur primaire utilisable ? (pas trop claire/sombre, format hex valide) */
function isUsablePrimary(hex: string | null | undefined): boolean {
  if (!hex || !/^#[0-9a-f]{6}$/i.test(hex)) return false;
  const lum = luminance(hex);
  return lum >= 30 && lum <= 220;
}

/**
 * Remplace toutes les occurrences d'une couleur dans un HTML (Tailwind + CSS).
 * Robuste aux majuscules / minuscules / avec ou sans #.
 */
function replaceColor(html: string, fromHex: string, toHex: string): string {
  if (fromHex.toLowerCase() === toHex.toLowerCase()) return html;
  const from = fromHex.toLowerCase();
  const to = toHex.toLowerCase();
  // Replace #c2410c, #C2410C, c2410c (sans #)
  const noHashFrom = from.slice(1);
  return html
    .replace(new RegExp(from, "gi"), to)
    .replace(new RegExp(`(["'\\s:(])${noHashFrom}\\b`, "gi"), `$1${to.slice(1)}`);
}

/**
 * Applique le DNA scrapé sur un HTML pixel-pixel Stitch.
 * Retourne le HTML modifié.
 */
export function applyDnaToStitchHtml(
  html: string,
  templateUsed: string,
  dna: WebsiteDna | null | undefined,
): string {
  if (!dna || dna.error) return html;
  const originalColors = TEMPLATE_PRIMARY_COLORS[templateUsed];
  if (!originalColors) return html;

  let modified = html;

  // 1. Swap couleur primaire si scrapé valide
  if (isUsablePrimary(dna.primaryColor)) {
    modified = replaceColor(modified, originalColors.primary, dna.primaryColor!);
  }
  // 2. Swap couleur accent si scrapé valide ET différente de primary
  if (isUsablePrimary(dna.accentColor) && dna.accentColor !== dna.primaryColor) {
    modified = replaceColor(modified, originalColors.accent, dna.accentColor!);
  }

  // 3. Inject logo en haut si dispo (remplace le 1er <img> dans <header>/<nav>
  //    ou ajoute un attr data-dna-logo pour debug)
  if (dna.logoUrl) {
    // Try to add a data attribute on body for traceability (debug)
    modified = modified.replace(
      "<body ",
      `<body data-dna-applied="true" data-dna-logo="${dna.logoUrl.slice(0, 200)}" `,
    );
  }

  return modified;
}
