/**
 * Dispatcher central pour les 12 templates Stitch PIXEL-PIXEL.
 *
 * Tom veut que TOUTES les maquettes soient des copies exactes des
 * templates Stitch officiels (dossier stitch_klyora_stitch_templates).
 *
 * Un seul point d'entrée : tryGenerateStitchPixel(metierKey, p)
 * → retourne le HTML pixel-pixel, ou null si métier non supporté.
 */
import { generateStitchBoulangeriePixelMockupHtml, type BoulangeriePixelProspect } from "./mockup-stitch-boulangerie-pixel";
import { generateStitchOsteoPixelMockupHtml } from "./mockup-stitch-osteo-pixel";
import { generateStitchGaragePixelMockupHtml } from "./mockup-stitch-garage-pixel";
import { generateStitchInstitutPixelMockupHtml } from "./mockup-stitch-institut-pixel";
import { generateStitchCafePixelMockupHtml } from "./mockup-stitch-cafe-pixel";
import { generateStitchMenuisierPixelMockupHtml } from "./mockup-stitch-menuisier-pixel";
import { generateStitchFleuristePixelMockupHtml } from "./mockup-stitch-fleuriste-pixel";
import { generateStitchCoiffeurPixelMockupHtml } from "./mockup-stitch-coiffeur-pixel";
import { generateStitchAutoecolePixelMockupHtml } from "./mockup-stitch-autoecole-pixel";
import { generateStitchEpiceriePixelMockupHtml } from "./mockup-stitch-epicerie-pixel";
import { generateStitchCouvreurPixelMockupHtml } from "./mockup-stitch-couvreur-pixel";
import { generateStitchVeterinairePixelMockupHtml } from "./mockup-stitch-veterinaire-pixel";
import { generateStitchPlombierPixelMockupHtml } from "./mockup-stitch-plombier-pixel";
import { generateStitchElectricienPixelMockupHtml } from "./mockup-stitch-electricien-pixel";
import { generateStitchDentistePixelMockupHtml } from "./mockup-stitch-dentiste-pixel";

export type StitchPixelProspect = BoulangeriePixelProspect;

export function detectStitchPixelMetier(p: { business_type?: string | null; name?: string | null; slug?: string | null }): string | null {
  const haystack = `${p.business_type || ""} ${p.name || ""} ${p.slug || ""}`.toLowerCase();
  if (/\b(electric|électrici|électrique)/.test(haystack)) return "electricien";
  if (/\b(dentiste|dental|orthodont|cabinet[ -]dentaire)/.test(haystack)) return "dentiste";
  if (/\bplomb/.test(haystack)) return "plombier";
  if (/\bost[eé]o/.test(haystack)) return "osteo";
  if (/\bgarage|garagi|m[eé]canicien|carrosseri/.test(haystack)) return "garage";
  if (/\binstitut|esth[eé]ti|beaut[eé]/.test(haystack)) return "institut";
  if (/\bcaf[eé](?!fer)/.test(haystack)) return "cafe";
  if (/\b(boulanger|p[aâ]tisser|p[aâ]tissi)/.test(haystack)) return "boulangerie";
  if (/\bmenuis/.test(haystack)) return "menuisier";
  if (/\bfleurist/.test(haystack)) return "fleuriste";
  if (/\bcoiffeu|salon\s*de\s*coiffure/.test(haystack)) return "coiffeur";
  if (/\bauto[\s-]*[eé]cole/.test(haystack)) return "autoecole";
  if (/\b[eé]picerie/.test(haystack)) return "epicerie";
  if (/\bcouvreur|toitur|zinguer/.test(haystack)) return "couvreur";
  if (/\bv[eé]t[eé]rinaire|clinique\s*animal/.test(haystack)) return "veterinaire";
  return null;
}

export function tryGenerateStitchPixel(metierKey: string | null, p: StitchPixelProspect): { html: string; templateUsed: string } | null {
  if (!metierKey) return null;
  try {
    switch (metierKey) {
      case "plombier":     return { html: generateStitchPlombierPixelMockupHtml(p),     templateUsed: "pixel:plombier" };
      case "electricien":  return { html: generateStitchElectricienPixelMockupHtml(p),  templateUsed: "pixel:electricien" };
      case "dentiste":     return { html: generateStitchDentistePixelMockupHtml(p),     templateUsed: "pixel:dentiste" };
      case "boulangerie":  return { html: generateStitchBoulangeriePixelMockupHtml(p),  templateUsed: "pixel:boulangerie" };
      case "osteo":        return { html: generateStitchOsteoPixelMockupHtml(p),        templateUsed: "pixel:osteo" };
      case "garage":       return { html: generateStitchGaragePixelMockupHtml(p),       templateUsed: "pixel:garage" };
      case "institut":     return { html: generateStitchInstitutPixelMockupHtml(p),     templateUsed: "pixel:institut" };
      case "cafe":         return { html: generateStitchCafePixelMockupHtml(p),         templateUsed: "pixel:cafe" };
      case "menuisier":    return { html: generateStitchMenuisierPixelMockupHtml(p),    templateUsed: "pixel:menuisier" };
      case "fleuriste":    return { html: generateStitchFleuristePixelMockupHtml(p),    templateUsed: "pixel:fleuriste" };
      case "coiffeur":     return { html: generateStitchCoiffeurPixelMockupHtml(p),     templateUsed: "pixel:coiffeur" };
      case "autoecole":    return { html: generateStitchAutoecolePixelMockupHtml(p),    templateUsed: "pixel:autoecole" };
      case "epicerie":     return { html: generateStitchEpiceriePixelMockupHtml(p),     templateUsed: "pixel:epicerie" };
      case "couvreur":     return { html: generateStitchCouvreurPixelMockupHtml(p),     templateUsed: "pixel:couvreur" };
      case "veterinaire":  return { html: generateStitchVeterinairePixelMockupHtml(p),  templateUsed: "pixel:veterinaire" };
      default: return null;
    }
  } catch (err) {
    console.warn(`[stitch-pixel] generator failed for ${metierKey}:`, err);
    return null;
  }
}
