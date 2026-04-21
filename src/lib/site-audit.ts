/* ══════════════════════════════════════════
   Audit léger d'un site web (scraping HTML + heuristiques)
   Utilisé par /api/prospect/find lors du scraping initial ET par
   /api/prospect/call-script pour auditer à la volée les prospects
   anciens qui n'ont pas encore été auditées en DB.
   ══════════════════════════════════════════ */

import { isPrivateOrUnsafeUrl, safeFetch } from "@/lib/security";

export type SiteQuality = "none" | "poor" | "average" | "good";

export interface SiteAudit {
  score: number; // 0-100
  quality: SiteQuality;
  issues: string[];
}

async function fetchHtml(url: string, timeout = 8000): Promise<string | null> {
  try {
    const res = await safeFetch(url, {
      timeoutMs: timeout,
      maxRedirects: 5,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; WebConceptorBot/1.0)" },
    });
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 10 * 1024 * 1024);
  } catch {
    return null;
  }
}

export async function auditWebsite(website: string): Promise<SiteAudit | null> {
  try {
    if (isPrivateOrUnsafeUrl(website)) return null;
    const base = new URL(website);
    const html = await fetchHtml(base.origin, 8000);
    if (!html) return { score: 20, quality: "poor", issues: ["unreachable"] };

    let score = 50;
    const issues: string[] = [];

    if (base.protocol !== "https:") { score -= 15; issues.push("no_https"); }

    if (/<meta[^>]+name=["']viewport["']/i.test(html)) score += 15;
    else { score -= 25; issues.push("no_viewport_mobile"); }

    if (/<meta[^>]+name=["']description["']/i.test(html)) score += 10;
    else issues.push("no_meta_description");

    if (/<meta[^>]+property=["']og:image["']/i.test(html)) score += 8;
    else issues.push("no_og_image");

    if (/<meta[^>]+property=["']og:title["']/i.test(html)) score += 4;

    if (/<script[^>]+type=["']application\/ld\+json["']/i.test(html)) score += 10;
    else issues.push("no_structured_data");

    if (/<(header|main|footer|article|section|nav)[\s>]/i.test(html)) score += 5;
    else issues.push("no_semantic_html");

    if (/display\s*:\s*(grid|flex)/i.test(html) || /grid-template|flex-direction/i.test(html)) score += 5;
    else issues.push("legacy_css");

    if (/<link[^>]+rel=["'](?:shortcut )?icon["']/i.test(html)) score += 3;
    else issues.push("no_favicon");

    if (/<\b(font|marquee|center|blink|basefont)\b/i.test(html)) {
      score -= 25;
      issues.push("deprecated_tags");
    }

    const tablesCount = (html.match(/<table/gi) || []).length;
    if (tablesCount > 5) { score -= 15; issues.push("table_layout"); }

    const inlineStyleCount = (html.match(/style=/gi) || []).length;
    if (inlineStyleCount > 80) { score -= 10; issues.push("too_many_inline_styles"); }

    if (/<\b(object|embed|applet)[^>]+(flash|shockwave|activex)/i.test(html)) {
      score -= 30;
      issues.push("deprecated_plugins");
    }

    if (/fonts\.googleapis\.com|fonts\.bunny\.net/i.test(html)) score += 5;
    if (/__next|nextjs|__nuxt|gatsby|astro|sveltekit|webflow/i.test(html)) score += 10;
    if (/<picture|srcset=/i.test(html)) score += 5;

    score = Math.max(0, Math.min(100, score));

    let quality: SiteQuality;
    if (score < 40) quality = "poor";
    else if (score < 70) quality = "average";
    else quality = "good";

    return { score, quality, issues };
  } catch {
    return null;
  }
}
