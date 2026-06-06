/**
 * Orchestrateur Stitch ↔ OpenDesign
 *
 * Logique :
 *   1. Appelle Stitch IA en priorité (qualité supérieure, customisé)
 *   2. Si Stitch renvoie null/quota/timeout/HTML trop court → fallback OpenDesign
 *      (gratuit, illimité, instantané)
 *   3. Valide le HTML final via le QA Gatekeeper avant retour
 *   4. Renvoie aussi la SOURCE utilisée pour tracking en DB
 *
 * Stats : un compteur en mémoire suit les ratios Stitch/OpenDesign sur
 * la session courante (visible via /api/admin/mockup-stats).
 */

import { generateStitchMockup, type StitchProspect } from "./stitch-mockup";
import { generateOpenDesignMockup, type OpenDesignProspect, type MockupContent } from "./mockup-opendesign";
import { buildContentFromProspect } from "./build-opendesign-content";
import { strictGatekeeper } from "./mockup-qa";

export type MockupSource = "stitch" | "opendesign" | "failed";

export interface MockupResult {
  html: string | null;
  source: MockupSource;
  gatekeeper_pass: boolean;
  gatekeeper_issues: string[];
  attempted: { stitch: boolean; opendesign: boolean };
  reason_stitch_skipped?: string;
}

// Compteur en mémoire (par instance Vercel — pas persistent)
const stats = {
  stitch_success: 0,
  stitch_failed: 0,
  opendesign_success: 0,
  opendesign_failed: 0,
  total_attempts: 0,
};

export function getMockupStats() {
  return { ...stats, ratio_stitch: stats.total_attempts === 0 ? 0 : stats.stitch_success / stats.total_attempts };
}

// Union des champs Stitch + OpenDesign (sans héritage double — types divergent légèrement)
export interface OrchestratorProspect {
  id: string;
  slug: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  business_type?: string;
  google_rating?: number | null;
  google_reviews_count?: number | null;
  about_scraped?: string | null;
  hours?: string;
  photos?: string[];
  menu_items?: Array<{ category?: string; name: string; description?: string; price?: string }> | null;
  reviews?: Array<{ author: string; rating: number; text: string; timeAgo?: string }> | null;
  site_style_dna?: { dominantColors?: string[]; fontFamilies?: string[]; keywords?: string[] } | null;
  rich_audit?: unknown;
}

/** Convertit OrchestratorProspect → OpenDesignProspect (normalise les types null/undefined). */
function toOpenDesignProspect(p: OrchestratorProspect): OpenDesignProspect {
  return {
    name: p.name,
    city: p.city,
    phone: p.phone,
    email: p.email,
    address: p.address,
    business_type: p.business_type,
    google_rating: p.google_rating ?? undefined,
    google_reviews_count: p.google_reviews_count ?? undefined,
    about_scraped: p.about_scraped ?? undefined,
    hours: p.hours,
    reviews: p.reviews?.filter(r => r.text)?.map(r => ({ author: r.author, rating: r.rating, text: r.text })) ?? undefined,
    photos: p.photos,
  };
}

/** Convertit OrchestratorProspect → StitchProspect (le type accepte les nulls). */
function toStitchProspect(p: OrchestratorProspect): StitchProspect {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    city: p.city,
    address: p.address,
    phone: p.phone,
    website: p.website,
    email: p.email,
    business_type: p.business_type,
    google_rating: p.google_rating,
    google_reviews_count: p.google_reviews_count,
    about_scraped: p.about_scraped,
    menu_items: p.menu_items?.map(m => ({
      category: m.category || "",
      name: m.name,
      description: m.description || "",
      price: m.price || "",
    })) ?? null,
    reviews: p.reviews?.map(r => ({ author: r.author, rating: r.rating, text: r.text, timeAgo: r.timeAgo || "" })) ?? null,
    photos: p.photos,
    hours: p.hours,
    site_style_dna: p.site_style_dna,
    rich_audit: null,
  };
}

interface OrchestratorOpts {
  isLuxury?: boolean;
  preferred?: "stitch" | "opendesign" | "auto"; // auto = défaut
  skipStitch?: boolean; // pour force OpenDesign en test
  origin?: string;
}

export async function generateMockup(
  prospect: OrchestratorProspect,
  opts: OrchestratorOpts = {}
): Promise<MockupResult> {
  stats.total_attempts++;

  const result: MockupResult = {
    html: null,
    source: "failed",
    gatekeeper_pass: false,
    gatekeeper_issues: [],
    attempted: { stitch: false, opendesign: false },
  };

  // ── 1. Stitch en priorité (sauf si forcé sur opendesign) ──
  const tryStitch = !opts.skipStitch && opts.preferred !== "opendesign";
  if (tryStitch) {
    result.attempted.stitch = true;
    try {
      const stitchHtml = await generateStitchMockup(toStitchProspect(prospect), opts.isLuxury);
      if (stitchHtml && stitchHtml.length > 1200) {
        // Validation rapide par le gatekeeper
        const qa = strictGatekeeper(stitchHtml, {
          name: prospect.name,
          city: prospect.city,
          business_type: prospect.business_type,
          phone: prospect.phone,
        });
        if (qa.pass) {
          stats.stitch_success++;
          result.html = stitchHtml;
          result.source = "stitch";
          result.gatekeeper_pass = true;
          result.gatekeeper_issues = qa.warnings;
          return result;
        }
        // Stitch a renvoyé du HTML mais cassé → on fallback OpenDesign
        result.reason_stitch_skipped = `Stitch HTML rejeté par QA: ${qa.blocking_issues.slice(0, 2).join(" / ")}`;
        stats.stitch_failed++;
      } else {
        result.reason_stitch_skipped = stitchHtml ? "HTML trop court" : "Quota/timeout/erreur Stitch";
        stats.stitch_failed++;
      }
    } catch (e) {
      result.reason_stitch_skipped = `Erreur Stitch: ${e instanceof Error ? e.message : "unknown"}`;
      stats.stitch_failed++;
    }
  } else {
    result.reason_stitch_skipped = "Stitch skippé par option";
  }

  // ── 2. Fallback OpenDesign ──
  result.attempted.opendesign = true;
  try {
    const odProspect = toOpenDesignProspect(prospect);
    const content: MockupContent = buildContentFromProspect({
      name: odProspect.name,
      city: odProspect.city,
      business_type: odProspect.business_type,
      about_scraped: odProspect.about_scraped,
      menu_items: prospect.menu_items?.map(m => ({ name: m.name, price: m.price, description: m.description })) || null,
    });
    const odHtml = generateOpenDesignMockup(odProspect, content, opts.origin || "https://webconceptor.fr");

    // Validation par le gatekeeper
    const qa = strictGatekeeper(odHtml, {
      name: prospect.name,
      city: prospect.city,
      business_type: prospect.business_type,
      phone: prospect.phone,
    });

    if (qa.pass) {
      stats.opendesign_success++;
      result.html = odHtml;
      result.source = "opendesign";
      result.gatekeeper_pass = true;
      result.gatekeeper_issues = qa.warnings;
      return result;
    }

    // OpenDesign aussi cassé : on renvoie le HTML mais signale le fail
    stats.opendesign_failed++;
    result.html = odHtml;
    result.source = "opendesign";
    result.gatekeeper_pass = false;
    result.gatekeeper_issues = qa.blocking_issues;
    return result;
  } catch (e) {
    stats.opendesign_failed++;
    result.reason_stitch_skipped = (result.reason_stitch_skipped || "") + ` | OpenDesign erreur: ${e instanceof Error ? e.message : "unknown"}`;
    return result;
  }
}
