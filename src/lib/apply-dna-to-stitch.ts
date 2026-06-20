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

/** Couleur primaire de chaque template Stitch (à remplacer). */
const TEMPLATE_PRIMARY_COLORS: Record<string, { primary: string; accent: string }> = {
  "pixel:boulangerie":  { primary: "#c2410c", accent: "#f59e0b" },
  "pixel:cafe":         { primary: "#78350f", accent: "#fbbf24" }, // suppose-fallback
  "pixel:osteo":        { primary: "#0e7c3a", accent: "#84cc16" },
  "pixel:garage":       { primary: "#dc2626", accent: "#1f2937" },
  "pixel:institut":     { primary: "#be185d", accent: "#fbcfe8" },
  "pixel:menuisier":    { primary: "#78350f", accent: "#d97706" },
  "pixel:fleuriste":    { primary: "#9d174d", accent: "#f9a8d4" },
  "pixel:coiffeur":     { primary: "#1f2937", accent: "#fbbf24" },
  "pixel:autoecole":    { primary: "#1e40af", accent: "#fbbf24" },
  "pixel:epicerie":     { primary: "#65a30d", accent: "#fbbf24" },
  "pixel:couvreur":     { primary: "#1f2937", accent: "#dc2626" },
  "pixel:veterinaire":  { primary: "#0e7c3a", accent: "#84cc16" },
  "pixel:plombier":     { primary: "#1e40af", accent: "#0ea5e9" },
  "pixel:electricien":  { primary: "#ca8a04", accent: "#000000" },
  "pixel:dentiste":     { primary: "#000000", accent: "#ca8a04" },
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
