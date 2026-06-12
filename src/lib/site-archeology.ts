/**
 * Site Archeology — détecte les sites obsolètes et "dinosaures" (pre-2015).
 *
 * Fait 2 missions à la fois :
 *   - V3 Rénovateur  : is_outdated (sites avec problèmes techniques généraux)
 *   - V3.1 Archéologue : is_pre_2015 (dinosaures à très haute valeur de conversion)
 *
 * Sources d'analyse :
 *   1. HTML scrapé (Scrapling ou fetch direct)
 *   2. Headers HTTP (Last-Modified, Server, etc.)
 *   3. RDAP gratuit (https://rdap.org) pour la date de création du domaine
 *      → équivalent du WHOIS sans avoir besoin de python-whois ni payer
 *
 * Calcule un obsolete_score 0-100 :
 *   0   = site moderne (HTTPS, responsive, récent)
 *   100 = dinosaure complet (HTTP, no-viewport, tables, jquery 1.x, < 2015)
 */

import { safeFetch } from "./security";

export interface ObsolescenceResult {
  is_outdated: boolean;       // au moins 2 signaux d'obsolescence
  is_pre_2015: boolean;       // critères "dinosaure" stricts
  obsolete_score: number;     // 0-100
  signals: ObsolescenceSignals;
  extracted_email: string | null;
}

export interface ObsolescenceSignals {
  no_https: boolean;
  no_viewport: boolean;
  old_doctype: boolean;          // HTML4 / HTML 4.01 / XHTML 1.0
  tables_for_layout: boolean;    // > 5 <table> au top-level → mise en page tableau
  uses_flash: boolean;           // .swf ou <object type="application/x-shockwave-flash">
  old_jquery: boolean;           // jQuery < 1.10
  uses_frames: boolean;          // <frameset> ou <iframe> en layout
  copyright_year: number | null; // année dans le footer (ex: "© 2014")
  copyright_too_old: boolean;    // copyright < 2022
  last_modified_year: number | null; // depuis header HTTP
  domain_created_year: number | null; // depuis RDAP
}

const FLASH_PATTERN = /\.swf\b|application\/x-shockwave-flash/i;
const TABLES_LAYOUT_THRESHOLD = 4;

/* ══════════════════════════════════════════════════════════════
   Récupère la création du domaine via RDAP (gratuit, illimité)
   ══════════════════════════════════════════════════════════════ */

const RDAP_ENDPOINTS: Record<string, string> = {
  fr: "https://rdap.nic.fr/domain/",
  com: "https://rdap.verisign.com/com/v1/domain/",
  net: "https://rdap.verisign.com/net/v1/domain/",
  org: "https://rdap.publicinterestregistry.org/rdap/domain/",
  eu: "https://rdap.eu.org/domain/",
  info: "https://rdap.afilias.net/rdap/info/domain/",
};

/** Renvoie l'année de création du domaine via RDAP, null si introuvable. */
export async function getDomainCreationYear(domain: string): Promise<number | null> {
  try {
    const clean = domain.replace(/^https?:\/\//, "").split("/")[0].toLowerCase().replace(/^www\./, "");
    const tld = clean.split(".").pop() || "";
    const endpoint = RDAP_ENDPOINTS[tld] || `https://rdap.org/domain/`;
    const url = endpoint.endsWith("/") ? `${endpoint}${clean}` : `${endpoint}/${clean}`;

    const res = await safeFetch(url, {
      headers: { Accept: "application/rdap+json" },
      timeoutMs: 6000,
    });
    if (!res.ok) return null;
    const data = await res.json();

    // Cherche "registration" dans events
    const events: Array<{ eventAction?: string; eventDate?: string }> = data?.events || [];
    const reg = events.find((e) => e.eventAction === "registration");
    if (reg?.eventDate) {
      const y = new Date(reg.eventDate).getFullYear();
      if (y > 1990 && y < 2100) return y;
    }
    return null;
  } catch {
    return null;
  }
}

/* ══════════════════════════════════════════════════════════════
   Analyse statique du HTML
   ══════════════════════════════════════════════════════════════ */

function detectSignalsFromHtml(html: string, finalUrl: string): Omit<ObsolescenceSignals, "domain_created_year" | "last_modified_year"> {
  const lcHtml = html.toLowerCase();

  const no_https = finalUrl.startsWith("http://") && !finalUrl.startsWith("https://");

  // Viewport meta tag absent
  const no_viewport = !/<meta[^>]*name=["']viewport["']/i.test(html);

  // Doctype obsolète
  const old_doctype = /<!doctype\s+html\s+public/i.test(html) || /<!doctype\s+html\s+4/i.test(html)
                      || /\bxhtml\s+1\.0\b/i.test(html);

  // Mise en page avec tables (au moins 4 <table> top-level → suspect)
  const tableCount = (html.match(/<table\b/gi) || []).length;
  const tables_for_layout = tableCount >= TABLES_LAYOUT_THRESHOLD;

  // Flash
  const uses_flash = FLASH_PATTERN.test(html);

  // jQuery < 1.10
  let old_jquery = false;
  const jqMatch = html.match(/jquery[/.-]?(\d+)\.(\d+)(?:\.(\d+))?/i);
  if (jqMatch) {
    const major = parseInt(jqMatch[1], 10);
    const minor = parseInt(jqMatch[2], 10);
    if (major === 1 && minor < 10) old_jquery = true;
  }

  // Frames
  const uses_frames = /<frameset\b/i.test(html);

  // Copyright année (cherche "© 2014", "Copyright 2014", etc.)
  let copyright_year: number | null = null;
  const copyMatches = Array.from(html.matchAll(/(?:©|copyright|all rights reserved)[^\d]{0,30}(\d{4})/gi));
  if (copyMatches.length > 0) {
    const years = copyMatches.map((m) => parseInt(m[1], 10)).filter((y) => y >= 1995 && y <= 2030);
    if (years.length > 0) copyright_year = Math.max(...years);
  }
  // Fallback : "&copy; 20XX" plain
  if (copyright_year === null) {
    const altMatch = html.match(/&copy;\s*(\d{4})/);
    if (altMatch) {
      const y = parseInt(altMatch[1], 10);
      if (y >= 1995 && y <= 2030) copyright_year = y;
    }
  }
  const copyright_too_old = copyright_year !== null && copyright_year < 2022;

  void lcHtml;
  return {
    no_https,
    no_viewport,
    old_doctype,
    tables_for_layout,
    uses_flash,
    old_jquery,
    uses_frames,
    copyright_year,
    copyright_too_old,
  };
}

/** Extrait un email depuis le HTML (mailto: ou texte brut). */
export function extractEmailFromHtml(html: string): string | null {
  // Priorité : mailto:
  const mailtoMatch = html.match(/mailto:([^"'>\s?]+@[^"'>\s?]+)/i);
  if (mailtoMatch) return mailtoMatch[1].toLowerCase();

  // Fallback : email en texte brut (évite les obfusqués @ → at)
  const textMatch = html.match(/\b([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/);
  if (textMatch) {
    const e = textMatch[1].toLowerCase();
    // Filtre les emails techniques (no-reply, support, postmaster)
    if (/^(no-?reply|noreply|postmaster|webmaster|wordpress)/i.test(e)) return null;
    return e;
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════
   Analyse complète : HTML + headers + WHOIS
   ══════════════════════════════════════════════════════════════ */

/**
 * Analyse une URL : récupère le HTML + headers, calcule obsolescence + extrait email.
 *
 * Si on a déjà le HTML scrapé (via Scrapling), on peut passer html + headers
 * direct sans refaire le fetch.
 */
export async function analyzeSiteForObsolescence(
  url: string,
  prefetched?: { html: string; headers: Record<string, string> }
): Promise<ObsolescenceResult> {
  let html = prefetched?.html || "";
  let headers: Record<string, string> = prefetched?.headers || {};
  let finalUrl = url;

  if (!prefetched) {
    try {
      const res = await safeFetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Klyora SitesBot/1.0)" },
        timeoutMs: 12_000,
        maxRedirects: 3,
      });
      finalUrl = res.url || url;
      html = await res.text().catch(() => "");
      res.headers.forEach((v, k) => { headers[k.toLowerCase()] = v; });
    } catch {
      // Site injoignable → on considère comme "outdated" léger
      return {
        is_outdated: false,
        is_pre_2015: false,
        obsolete_score: 0,
        signals: emptySignals(),
        extracted_email: null,
      };
    }
  }

  // Analyse HTML
  const htmlSignals = detectSignalsFromHtml(html, finalUrl);

  // Last-Modified header
  let last_modified_year: number | null = null;
  const lm = headers["last-modified"];
  if (lm) {
    try {
      const y = new Date(lm).getFullYear();
      if (y > 2000 && y < 2100) last_modified_year = y;
    } catch { /* ignore */ }
  }

  // Domaine créé : RDAP (mais c'est lent, on ne le fait QUE si déjà beaucoup
  // de signaux d'obsolescence — économie d'appels réseau)
  const partialScore = scoreFromSignals({ ...htmlSignals, last_modified_year, domain_created_year: null });
  let domain_created_year: number | null = null;
  if (partialScore >= 30) {
    const domain = finalUrl.replace(/^https?:\/\//, "").split("/")[0];
    domain_created_year = await getDomainCreationYear(domain);
  }

  const signals: ObsolescenceSignals = {
    ...htmlSignals,
    last_modified_year,
    domain_created_year,
  };

  const obsolete_score = scoreFromSignals(signals);
  const is_pre_2015 = isPre2015(signals);
  const is_outdated = obsolete_score >= 35 || is_pre_2015;

  const extracted_email = extractEmailFromHtml(html);

  return {
    is_outdated,
    is_pre_2015,
    obsolete_score,
    signals,
    extracted_email,
  };
}

/* ══════════════════════════════════════════════════════════════
   Scoring
   ══════════════════════════════════════════════════════════════ */

function scoreFromSignals(s: ObsolescenceSignals): number {
  let score = 0;
  if (s.no_https)               score += 25; // gros signal
  if (s.no_viewport)            score += 20; // non-responsive = dramatique mobile
  if (s.old_doctype)            score += 15;
  if (s.tables_for_layout)      score += 15;
  if (s.uses_flash)             score += 20;
  if (s.old_jquery)             score += 10;
  if (s.uses_frames)            score += 15;
  if (s.copyright_too_old)      score += 10;
  if (s.last_modified_year && s.last_modified_year < 2020) score += 10;
  if (s.domain_created_year && s.domain_created_year < 2015) score += 15;
  return Math.min(100, score);
}

function isPre2015(s: ObsolescenceSignals): boolean {
  // Critères "dinosaure" : au moins 2 des 3 axes (WHOIS, no-viewport, old HTML)
  const oldDomain = s.domain_created_year !== null && s.domain_created_year < 2015;
  const oldHtml = s.old_doctype || s.tables_for_layout || s.uses_flash || s.uses_frames || s.old_jquery;
  const noMobile = s.no_viewport;
  const indicators = [oldDomain, oldHtml, noMobile].filter(Boolean).length;
  return indicators >= 2;
}

function emptySignals(): ObsolescenceSignals {
  return {
    no_https: false, no_viewport: false, old_doctype: false,
    tables_for_layout: false, uses_flash: false, old_jquery: false,
    uses_frames: false, copyright_year: null, copyright_too_old: false,
    last_modified_year: null, domain_created_year: null,
  };
}
