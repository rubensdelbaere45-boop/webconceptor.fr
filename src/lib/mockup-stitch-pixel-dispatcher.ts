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
import { applyDnaToStitchHtml } from "./apply-dna-to-stitch";
import type { WebsiteDna } from "./scrape-prospect-site";

export type StitchPixelProspect = BoulangeriePixelProspect & {
  site_style_dna?: WebsiteDna | null;
};

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
    let result: { html: string; templateUsed: string } | null = null;
    switch (metierKey) {
      case "plombier":     result = { html: generateStitchPlombierPixelMockupHtml(p),     templateUsed: "pixel:plombier" }; break;
      case "electricien":  result = { html: generateStitchElectricienPixelMockupHtml(p),  templateUsed: "pixel:electricien" }; break;
      case "dentiste":     result = { html: generateStitchDentistePixelMockupHtml(p),     templateUsed: "pixel:dentiste" }; break;
      case "boulangerie":  result = { html: generateStitchBoulangeriePixelMockupHtml(p),  templateUsed: "pixel:boulangerie" }; break;
      case "osteo":        result = { html: generateStitchOsteoPixelMockupHtml(p),        templateUsed: "pixel:osteo" }; break;
      case "garage":       result = { html: generateStitchGaragePixelMockupHtml(p),       templateUsed: "pixel:garage" }; break;
      case "institut":     result = { html: generateStitchInstitutPixelMockupHtml(p),     templateUsed: "pixel:institut" }; break;
      case "cafe":         result = { html: generateStitchCafePixelMockupHtml(p),         templateUsed: "pixel:cafe" }; break;
      case "menuisier":    result = { html: generateStitchMenuisierPixelMockupHtml(p),    templateUsed: "pixel:menuisier" }; break;
      case "fleuriste":    result = { html: generateStitchFleuristePixelMockupHtml(p),    templateUsed: "pixel:fleuriste" }; break;
      case "coiffeur":     result = { html: generateStitchCoiffeurPixelMockupHtml(p),     templateUsed: "pixel:coiffeur" }; break;
      case "autoecole":    result = { html: generateStitchAutoecolePixelMockupHtml(p),    templateUsed: "pixel:autoecole" }; break;
      case "epicerie":     result = { html: generateStitchEpiceriePixelMockupHtml(p),     templateUsed: "pixel:epicerie" }; break;
      case "couvreur":     result = { html: generateStitchCouvreurPixelMockupHtml(p),     templateUsed: "pixel:couvreur" }; break;
      case "veterinaire":  result = { html: generateStitchVeterinairePixelMockupHtml(p),  templateUsed: "pixel:veterinaire" }; break;
      default: return null;
    }
    // Apply DNA scrapé du site existant (palette + logo) — design Stitch
    // pixel-pixel intact, juste rebrand aux couleurs du prospect
    if (result && p.site_style_dna) {
      result = { html: applyDnaToStitchHtml(result.html, result.templateUsed, p.site_style_dna), templateUsed: result.templateUsed + "+dna" };
    }
    return result;
  } catch (err) {
    console.warn(`[stitch-pixel] generator failed for ${metierKey}:`, err);
    return null;
  }
}
