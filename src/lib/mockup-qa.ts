/**
 * QA Agent — Analyse et corrige les maquettes SANS régénérer
 *
 * Vérifie : longueur, images, texte, sections, langue, nom du commerce.
 * Corrige directement le HTML au lieu de consommer des crédits Stitch.
 *
 * Usage : const { html, fixes } = qualityCheck(rawHtml, prospect)
 */

// ── Images de remplacement par métier ────────────────────────────
const FALLBACK_HERO: Record<string, string> = {
  restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1600&q=80&auto=format&fit=crop",
  boulangerie: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=1600&q=80&auto=format&fit=crop",
  patisserie: "https://images.unsplash.com/photo-1587314168485-3236d6710814?w=1600&q=80&auto=format&fit=crop",
  glacier: "https://images.unsplash.com/photo-1567206563114-c179900d7065?w=1600&q=80&auto=format&fit=crop",
  coiffeur: "https://images.unsplash.com/photo-1560066984-138dadb4c035?w=1600&q=80&auto=format&fit=crop",
  institut: "https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=1600&q=80&auto=format&fit=crop",
  plombier: "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=1600&q=80&auto=format&fit=crop",
  electricien: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1600&q=80&auto=format&fit=crop",
  garage: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=1600&q=80&auto=format&fit=crop",
  osteo: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1600&q=80&auto=format&fit=crop",
  dentiste: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=1600&q=80&auto=format&fit=crop",
  fleuriste: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=1600&q=80&auto=format&fit=crop",
  default: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80&auto=format&fit=crop",
};

const JUNK_IMG_PATTERNS = [
  /banner/i, /240_240/i, /160x/i, /120x/i, /static\.pro\./i,
  /badge/i, /sprite/i, /avatar/i, /favicon/i, /logo.*\.(png|svg|ico)/i,
  /button/i, /btn/i, /icon.*\d+x\d+/i, /widget/i, /tracking/i,
  /pixel/i, /1x1/i, /spacer/i, /blank\./i, /transparent\./i,
  /adservice/i, /doubleclick/i, /googletagmanager/i, /analytics/i,
  /facebook.*pixel/i, /fbcdn/i, /twimg/i,
];

interface QAProspect {
  name: string;
  city?: string;
  business_type?: string;
  phone?: string;
  google_rating?: number;
}

interface QAResult {
  html: string;
  score: number; // 0-100
  fixes: string[];
  passed: boolean;
}

/* ══════════════════════════════════════════════════════════════════
   QA GATEKEEPER STRICT — rejette les maquettes cassées
   ══════════════════════════════════════════════════════════════════
   Contrairement à `qualityCheck()` qui corrige et donne un score,
   `strictGatekeeper()` ne TOUCHE PAS au HTML (Tom : "ne touche pas
   au design"). Il JUGE et retourne pass/fail.

   Maquette REJETÉE si :
   - HTML < 1200 caractères (vide)
   - Pas de <html> / <body> / <h1>
   - Balises HTML cassées (open sans close, pour tags critiques)
   - Placeholders non remplacés ({{name}}, {{city}}, [NOM], ${'$'}{x}, lorem ipsum, TODO, FIXME)
   - Aucune image (src="" ou data:image/svg vide)
   - Nom du commerce ABSENT
   - Incohérence métier (nom révèle un autre business_type)
   - HTML contient des erreurs JS (window.error, Uncaught)
   ══════════════════════════════════════════════════════════════════ */

import { isBusinessTypeCoherent } from "./security";

export interface GatekeeperResult {
  pass: boolean;
  blocking_issues: string[];    // bloquent l'envoi
  warnings: string[];           // n'empêchent pas l'envoi mais à noter
  word_count: number;
  image_count: number;
  has_h1: boolean;
  has_contact: boolean;
}

const PLACEHOLDERS = [
  /\{\{\s*[a-z_][a-z_0-9]*\s*\}\}/i,       // {{ name }} {{city}}
  /\$\{[a-z_][a-z_0-9]*\}/i,                // ${name}
  /\[NOM\]|\[NAME\]|\[CITY\]|\[VILLE\]/,    // [NOM] [VILLE]
  /lorem ipsum/i,
  /\bTODO\b|\bFIXME\b/,
  /Description du commerce/i,
  /Insérez ici/i,
  /\bxxx\b|\b___+\b/i,                      // placeholder XXX ou ____
];

const BROKEN_JS = [
  /Uncaught\s+(?:TypeError|ReferenceError|SyntaxError)/i,
  /window\.onerror/i,
  /undefined is not (?:a function|an object)/i,
];

const REQUIRED_TAGS = ["html", "body"];

export function strictGatekeeper(html: string, prospect: QAProspect): GatekeeperResult {
  const blocking: string[] = [];
  const warnings: string[] = [];

  // 1) HTML vide / trop court
  if (!html || html.length < 1200) {
    blocking.push(`HTML trop court (${html?.length || 0} chars, min 1200)`);
  }

  // 2) Balises racines présentes
  for (const tag of REQUIRED_TAGS) {
    const reOpen = new RegExp(`<${tag}\\b`, "i");
    const reClose = new RegExp(`</${tag}\\s*>`, "i");
    if (!reOpen.test(html)) blocking.push(`Tag <${tag}> manquant`);
    if (!reClose.test(html)) blocking.push(`Tag </${tag}> manquant — HTML non fermé`);
  }

  // 3) Balance des balises critiques (équilibrage open/close)
  // On compte les ouvertures vs fermetures pour div, section, header, footer, main, nav, article
  const critical = ["div", "section", "header", "footer", "main", "nav", "article"];
  for (const tag of critical) {
    const opens = (html.match(new RegExp(`<${tag}\\b[^>]*>`, "gi")) || []).length;
    const closes = (html.match(new RegExp(`</${tag}\\s*>`, "gi")) || []).length;
    const diff = opens - closes;
    if (Math.abs(diff) >= 3) {
      blocking.push(`Balance <${tag}> cassée (${opens} ouvertures vs ${closes} fermetures)`);
    } else if (Math.abs(diff) >= 1) {
      warnings.push(`<${tag}> légèrement déséquilibré (${opens}/${closes})`);
    }
  }

  // 4) Pas de placeholder non remplacé
  for (const pat of PLACEHOLDERS) {
    const m = html.match(pat);
    if (m) blocking.push(`Placeholder non remplacé : ${m[0].slice(0, 40)}`);
  }

  // 5) Pas d'erreur JS visible dans le HTML
  for (const pat of BROKEN_JS) {
    if (pat.test(html)) blocking.push(`Erreur JS détectée dans le HTML`);
  }

  // 6) Au moins une image valide
  const allSrcs = Array.from(html.matchAll(/<img[^>]*src\s*=\s*["']([^"']*)["']/gi)).map((m) => m[1]);
  const validImages = allSrcs.filter(
    (s) => !!s && !s.startsWith("data:image/svg") && !/^javascript:|^about:|^undefined$/.test(s)
  );
  if (validImages.length === 0) {
    // Pas bloquant : un site peut être 100% CSS. Mais signaler.
    warnings.push("Aucune image valide trouvée");
  }
  if (allSrcs.length > validImages.length) {
    blocking.push(`${allSrcs.length - validImages.length} image(s) avec src vide ou cassée`);
  }

  // 7) Présence du nom du commerce
  const nameSnippet = (prospect.name || "").toLowerCase().slice(0, 15).trim();
  if (nameSnippet && !html.toLowerCase().includes(nameSnippet)) {
    blocking.push(`Nom du commerce "${prospect.name}" absent du HTML`);
  }

  // 8) Cohérence métier — le nom commercial doit matcher le business_type
  if (prospect.business_type && prospect.name) {
    if (!isBusinessTypeCoherent(prospect.name, prospect.business_type)) {
      blocking.push(`Incohérence métier : nom "${prospect.name}" ≠ type "${prospect.business_type}"`);
    }
  }

  // 9) h1 et contact présents
  const hasH1 = /<h1\b/i.test(html);
  const hasContact = /contact|t[éeè]l[éeè]phone|phone|adresse|horaires/i.test(html);
  if (!hasH1) blocking.push("Pas de <h1> trouvé");
  if (!hasContact) warnings.push("Pas de section contact évidente");

  // 10) Lien href cassé
  const brokenLinks = (html.match(/href\s*=\s*["'](undefined|null|javascript:void\(0\))["']/gi) || []).length;
  if (brokenLinks > 2) blocking.push(`${brokenLinks} liens cassés (href=undefined/null)`);

  // Stats
  const wordCount = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().split(" ").length;

  return {
    pass: blocking.length === 0,
    blocking_issues: blocking,
    warnings,
    word_count: wordCount,
    image_count: validImages.length,
    has_h1: hasH1,
    has_contact: hasContact,
  };
}

export function qualityCheck(rawHtml: string, prospect: QAProspect): QAResult {
  let html = rawHtml;
  const fixes: string[] = [];
  let score = 100;

  const bt = prospect.business_type || "default";
  const fallbackHero = FALLBACK_HERO[bt] || FALLBACK_HERO.default;

  // ═══════════════════════════════════════════════════════════════
  // 1. LONGUEUR MINIMUM
  // ═══════════════════════════════════════════════════════════════
  if (html.length < 2000) {
    score -= 40;
    fixes.push(`HTML trop court (${html.length} chars)`);
    // Pas de fix possible sans régénérer — on signale seulement
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. IMAGES JUNK → remplacer par Unsplash
  // ═══════════════════════════════════════════════════════════════
  const imgRegex = /src="([^"]+)"/g;
  let match;
  let imgFixed = 0;
  while ((match = imgRegex.exec(html)) !== null) {
    const src = match[1];
    if (JUNK_IMG_PATTERNS.some(p => p.test(src))) {
      html = html.replace(src, fallbackHero);
      imgFixed++;
    }
  }
  if (imgFixed > 0) {
    score -= imgFixed * 5;
    fixes.push(`${imgFixed} image(s) junk remplacée(s) par Unsplash`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. IMAGES CASSÉES (data:, blob:, chemins relatifs)
  // ═══════════════════════════════════════════════════════════════
  const brokenImgCount = (html.match(/src="(data:|blob:|\/(?!\/)|\.\/|\.\.\/)/g) || []).length;
  if (brokenImgCount > 0) {
    html = html.replace(/src="(data:|blob:)[^"]*"/g, `src="${fallbackHero}"`);
    html = html.replace(/src="(\.\/|\.\.\/)[^"]*"/g, `src="${fallbackHero}"`);
    score -= brokenImgCount * 5;
    fixes.push(`${brokenImgCount} image(s) cassée(s) corrigée(s)`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. NOM DU COMMERCE PRÉSENT
  // ═══════════════════════════════════════════════════════════════
  if (!html.toLowerCase().includes(prospect.name.toLowerCase().slice(0, 15))) {
    score -= 15;
    fixes.push("Nom du commerce absent du HTML");
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. ENTITÉS HTML NON DÉCODÉES
  // ═══════════════════════════════════════════════════════════════
  const entityCount = (html.match(/&(eacute|agrave|egrave|ccedil|ocirc|ucirc|icirc|acirc|euml|iuml|ouml|uuml|nbsp);/g) || []).length;
  if (entityCount > 5) {
    html = html
      .replace(/&eacute;/g, "é").replace(/&egrave;/g, "è").replace(/&agrave;/g, "à")
      .replace(/&ccedil;/g, "ç").replace(/&ocirc;/g, "ô").replace(/&ucirc;/g, "û")
      .replace(/&icirc;/g, "î").replace(/&acirc;/g, "â").replace(/&euml;/g, "ë")
      .replace(/&iuml;/g, "ï").replace(/&ouml;/g, "ö").replace(/&uuml;/g, "ü")
      .replace(/&nbsp;/g, " ");
    score -= 5;
    fixes.push(`${entityCount} entités HTML décodées`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. TEXTE COLLÉ — ajoute des espaces après les points
  // ═══════════════════════════════════════════════════════════════
  const stickyText = (html.match(/[a-zéèàçôûîâ][.!?][A-ZÉÈÀÇ]/g) || []).length;
  if (stickyText > 3) {
    html = html.replace(/([a-zéèàçôûîâ])([.!?])([A-ZÉÈÀÇ])/g, "$1$2 $3");
    score -= 5;
    fixes.push(`${stickyText} texte(s) collé(s) corrigé(s)`);
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. SECTIONS ESSENTIELLES PRÉSENTES
  // ═══════════════════════════════════════════════════════════════
  const hasHero = /hero|banner|jumbotron/i.test(html) || /<h1/i.test(html);
  const hasContact = /contact|téléphone|phone|adresse|horaires/i.test(html);
  if (!hasHero) { score -= 10; fixes.push("Pas de section hero détectée"); }
  if (!hasContact) { score -= 10; fixes.push("Pas de section contact détectée"); }

  // ═══════════════════════════════════════════════════════════════
  // 8. LANGUE FRANÇAISE
  // ═══════════════════════════════════════════════════════════════
  const frenchWords = (html.match(/(Bienvenue|Découvrir|Notre|Votre|Contactez|Réserver|Accueil|Horaires|Lundi|Mardi)/gi) || []).length;
  if (frenchWords < 2 && html.length > 5000) {
    score -= 10;
    fixes.push("Peu de contenu en français détecté");
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. LIENS MORTS / JAVASCRIPT VIDE
  // ═══════════════════════════════════════════════════════════════
  html = html.replace(/href="javascript:void\(0\)"/g, 'href="#"');
  html = html.replace(/href="undefined"/g, 'href="#"');
  html = html.replace(/href="null"/g, 'href="#"');

  // ═══════════════════════════════════════════════════════════════
  // 10. VIEWPORT META (responsive)
  // ═══════════════════════════════════════════════════════════════
  if (!html.includes("viewport")) {
    html = html.replace(/<head>/i, '<head><meta name="viewport" content="width=device-width, initial-scale=1.0">');
    fixes.push("Meta viewport ajouté");
  }

  // Score final
  score = Math.max(0, Math.min(100, score));

  return {
    html,
    score,
    fixes,
    passed: score >= 50,
  };
}
