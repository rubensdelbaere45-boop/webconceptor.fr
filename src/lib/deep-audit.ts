/* ══════════════════════════════════════════
   DEEP AUDIT — analyse fine du site d'un prospect
   pour générer une maquette qui soit OBJECTIVEMENT meilleure que le leur.

   Stratégie coût :
     1. Parsing LOCAL (gratuit, instantané) : HTML du site + 2-3 sous-pages
        → extraction colors, fonts, images, textes, features présentes,
          navigation, meta tags, forms
     2. UN seul appel Claude Haiku 4.5 avec prompt caching du système
        → Claude reçoit l'extrait structuré (petit input) et produit un
          brief JSON de ce que la maquette WebConceptor doit contenir.
     3. Résultat stocké en DB (`rich_audit` JSONB) — ré-utilisable à
        chaque régénération sans re-auditer.

   Objectif : 0,05 € max / prospect au lieu des 0,20-0,50 € d'une
   génération HTML pleine Claude.
   ══════════════════════════════════════════ */

import { safeFetch } from "@/lib/security";

// ─── Types publics ───────────────────────────────────────────

export interface DeepAudit {
  // Identité visuelle réelle du prospect
  brand: {
    primaryColor: string;      // la plus dominante (ex: "#8B2332")
    secondaryColor: string;    // la 2e (accent)
    accentColor: string;       // 3e (facultatif)
    fonts: string[];           // polices détectées sur leur site
    keywords: string[];        // "traditionnel", "maritime", etc.
    tone: "chaleureux" | "pro" | "moderne" | "artisanal" | "luxe" | "simple";
  };

  // Contenu unique à préserver dans la maquette (ne PAS inventer, uniquement réutiliser)
  contentToKeep: {
    aboutText: string;         // leur vrai "à propos" (nettoyé)
    photos: string[];          // URLs images scrapées (absolues)
    headingsH1H2: string[];    // titres clés de leur site
    uniqueSellingPoints: string[]; // ce qui les rend uniques (extrait du site)
  };

  // Fonctionnalités présentes sur leur site actuel (à garder équivalents ou mieux)
  existingFeatures: string[];  // ex: "formulaire contact", "galerie", "menu PDF"

  // Fonctionnalités MANQUANTES qu'on peut apporter → arguments de vente
  missingFeatures: string[];   // ex: "pas de prise de RDV en ligne", "pas responsive"

  // Points FAIBLES objectifs du site actuel (problèmes techniques/UX)
  weaknesses: string[];        // ex: "design 2010", "images lentes", "pas HTTPS"

  // Ce que la maquette WebConceptor doit faire DIFFÉREMMENT/MIEUX
  improvementBrief: {
    heroConcept: string;        // description du hero idéal pour ce prospect
    featuredSections: string[]; // ordre des sections (ex: ["hero", "services", "booking", "reviews"])
    featuresToAdd: string[];    // ex: "RDV en ligne 0% commission", "chat IA"
    ctaStrategy: string;        // ce que le CTA principal doit viser
  };

  // Verdict qualité du site actuel (sert pour le ciblage commercial)
  verdict: {
    quality: "none" | "poor" | "average" | "good";
    summary: string;            // phrase courte pour l'admin
    confidence: "low" | "medium" | "high";
  };

  // Plats/prix scrapés du site actuel → injectés dans la maquette
  menuItems?: Array<{
    name: string;
    description: string;
    price: string;
    category: "entrée" | "plat" | "dessert" | "boisson" | "autre";
  }>;

  // Meta (debug / coût)
  _meta?: {
    tokensIn?: number;
    tokensOut?: number;
    cacheHitRate?: number;
    cost_usd?: number;
  };
}

// ─── 1. PARSING LOCAL ────────────────────────────────────────
// On fetch 3 pages max et on extrait tout ce qui peut être extrait
// sans Claude : c'est gratuit et instantané.

interface ParsedPages {
  mainHtml: string;            // HTML brut de la homepage
  subPages: Array<{ url: string; title: string; text: string }>;
  images: string[];            // URLs absolues uniques
  colors: string[];            // hex codes extraits du CSS inline + <style>
  fonts: string[];
  headings: string[];          // H1/H2/H3 texte
  aboutText: string;           // texte "à propos" scrapé si page trouvée
  metaDescription: string;
  hasHttps: boolean;
  hasViewportMeta: boolean;
  hasFavicon: boolean;
  hasStructuredData: boolean;
  hasOgImage: boolean;
  externalLinks: {             // liens sortants qui indiquent des features
    social: string[];          // facebook, insta, etc.
    booking: string[];         // TheFork, Treatwell, Doctolib...
    menu: string[];            // liens vers PDF menu
  };
  forms: string[];             // action URLs des <form> (contact? résa?)
  menuItems: Array<{ name: string; price: string; context: string }>; // plats scrapés localement
}

async function fetchKeyPages(siteUrl: string): Promise<{ html: string; subPages: Array<{ url: string; title: string; text: string }> } | null> {
  try {
    const mainRes = await safeFetch(siteUrl, {
      timeoutMs: 10000,
      maxRedirects: 3,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; WebConceptorAudit/1.0)" },
    });
    if (!mainRes.ok) return null;
    const mainHtml = (await mainRes.text()).slice(0, 200_000); // cap à 200 KB

    // Cherche 2-3 sous-pages typiques
    const base = new URL(siteUrl);
    const candidates = [
      "/a-propos", "/about", "/notre-histoire", "/qui-sommes-nous",
      "/menu", "/carte", "/la-carte", "/services", "/prestations",
      "/contact",
    ];
    const subPages: Array<{ url: string; title: string; text: string }> = [];
    for (const path of candidates) {
      if (subPages.length >= 3) break;
      try {
        const subUrl = new URL(path, base).toString();
        const subRes = await safeFetch(subUrl, { timeoutMs: 6000, maxRedirects: 2 });
        if (!subRes.ok) continue;
        const subHtml = (await subRes.text()).slice(0, 80_000);
        if (subHtml.length < 500) continue; // page vide
        const titleMatch = subHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
        const textOnly = stripHtml(subHtml).slice(0, 4000);
        subPages.push({
          url: subUrl,
          title: titleMatch ? decodeEntities(titleMatch[1]).slice(0, 150) : "",
          text: textOnly,
        });
      } catch { /* silent, page absente c'est OK */ }
    }
    return { html: mainHtml, subPages };
  } catch {
    return null;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ") // menus = bruit
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}

function parseKeyData(siteUrl: string, html: string, subPages: Array<{ url: string; title: string; text: string }>): ParsedPages {
  const base = new URL(siteUrl);
  const isAbsolute = (u: string) => /^https?:\/\//i.test(u);
  const toAbsolute = (u: string) => {
    try { return new URL(u, base).toString(); } catch { return ""; }
  };

  // Images (src= et srcset= + og:image)
  const imgSrcMatches = Array.from(html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)).map((m) => m[1]);
  const ogImageMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
  const twImageMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
  const imagesRaw = [ogImageMatch?.[1], twImageMatch?.[1], ...imgSrcMatches].filter(Boolean) as string[];
  const images: string[] = Array.from(new Set(
    imagesRaw
      .map((u) => isAbsolute(u) ? u : toAbsolute(u))
      .filter((u) => u && /\.(jpe?g|png|webp|gif|svg)/i.test(u))
      .filter((u) => !/logo|icon|favicon|pixel|tracker|spacer/i.test(u))
      .filter((u) => u.length < 500)
  )).slice(0, 10);

  // Colors : on cherche les hex codes dans le CSS inline et dans <style>
  const colorMatches = Array.from(html.matchAll(/#([0-9a-fA-F]{6})(?![0-9a-fA-F])/g)).map((m) => `#${m[1].toLowerCase()}`);
  // On ignore les couleurs trop courantes (blanc, noir pur, grises)
  const meaningfulColors = colorMatches.filter((c) => {
    const rgb = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
    const [r, g, b] = rgb;
    if (Math.abs(r - g) < 20 && Math.abs(g - b) < 20 && Math.abs(r - b) < 20) return false; // gris
    if (r + g + b > 720) return false; // quasi-blanc
    if (r + g + b < 30) return false; // quasi-noir
    return true;
  });
  const colorFreq: Record<string, number> = {};
  for (const c of meaningfulColors) colorFreq[c] = (colorFreq[c] || 0) + 1;
  const colors = Object.entries(colorFreq).sort(([, a], [, b]) => b - a).slice(0, 5).map(([c]) => c);

  // Fonts : font-family + Google Fonts URL
  const fonts: string[] = [];
  const ffMatches = Array.from(html.matchAll(/font-family\s*:\s*([^;}"']+)/gi));
  for (const m of ffMatches) {
    const first = m[1].split(",")[0].replace(/["']/g, "").trim();
    if (first && first.length < 40 && !/system|sans|serif|monospace|inherit|initial/i.test(first)) {
      if (!fonts.includes(first)) fonts.push(first);
    }
    if (fonts.length >= 3) break;
  }
  const googleFontsMatch = html.match(/fonts\.googleapis\.com\/css2?\?family=([^"']+)/);
  if (googleFontsMatch) {
    const gf = decodeURIComponent(googleFontsMatch[1].split("&")[0].replace(/\+/g, " ").split(":")[0]).slice(0, 40);
    if (gf && !fonts.includes(gf)) fonts.unshift(gf);
  }

  // Headings H1/H2
  const headings: string[] = [];
  for (const tag of ["h1", "h2", "h3"]) {
    const re = new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`, "gi");
    const matches = Array.from(html.matchAll(re));
    for (const m of matches) {
      const text = decodeEntities(m[1]).trim().replace(/\s+/g, " ");
      if (text.length >= 3 && text.length <= 120 && !headings.includes(text)) {
        headings.push(text);
      }
      if (headings.length >= 12) break;
    }
  }

  // About text : depuis les sous-pages
  const aboutSub = subPages.find((s) => /propos|about|histoire|qui/i.test(s.url));
  const aboutText = aboutSub?.text.slice(0, 2000) || "";

  // Meta description
  const metaDescMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i);
  const metaDescription = metaDescMatch ? decodeEntities(metaDescMatch[1]).slice(0, 300) : "";

  // Signaux techniques
  const hasHttps = siteUrl.startsWith("https:");
  const hasViewportMeta = /<meta[^>]+name=["']viewport["']/i.test(html);
  const hasFavicon = /<link[^>]+rel=["'](icon|shortcut icon)["']/i.test(html);
  const hasStructuredData = /<script[^>]+type=["']application\/ld\+json["']/i.test(html);
  const hasOgImage = !!ogImageMatch;

  // External links: social, booking, menu
  const allLinks = Array.from(html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)).map((m) => m[1]);
  const externalLinks = {
    social: allLinks.filter((l) => /facebook\.com|instagram\.com|twitter\.com|linkedin\.com|tiktok\.com|youtube\.com/i.test(l)).slice(0, 5),
    booking: allLinks.filter((l) => /thefork|lafourchette|treatwell|doctolib|opentable|planity|fresha|booksy/i.test(l)).slice(0, 3),
    menu: allLinks.filter((l) => /menu.*\.pdf|carte.*\.pdf/i.test(l)).slice(0, 2),
  };

  // Forms : présence de formulaires
  const formActions = Array.from(html.matchAll(/<form[^>]*action=["']([^"']*)["']/gi)).map((m) => m[1] || "(no action)");

  // ── EXTRACTION LOCALE DE MENU AVEC PRIX ─────────────────────────────────
  // On cherche les patterns prix dans toutes les pages scrapées : "12 €", "12,50€", "€12"
  // On extrait le texte environnant comme nom de plat.
  const menuItems = extractMenuItemsFromText(
    [html, ...subPages.map((p) => p.text)].join("\n\n").slice(0, 50_000)
  );

  return {
    mainHtml: html.slice(0, 20_000), // pour l'audit Claude, on pourra en envoyer un extrait
    subPages,
    images,
    colors,
    fonts,
    headings,
    aboutText,
    metaDescription,
    hasHttps,
    hasViewportMeta,
    hasFavicon,
    hasStructuredData,
    hasOgImage,
    externalLinks,
    forms: formActions.slice(0, 3),
    menuItems,
  };
}

// ── EXTRACTEUR PRIX/MENU LOCAL ──────────────────────────────────────────────
// Cherche les patterns de prix dans le texte brut d'un site restaurant,
// extrait le contexte comme nom de plat. Zéro API, instantané, gratuit.
interface LocalMenuItem {
  name: string;
  price: string;
  context: string;
}

function extractMenuItemsFromText(text: string): LocalMenuItem[] {
  const found: LocalMenuItem[] = [];
  const seen = new Set<string>();

  // Pattern : "Magret de canard ......... 28 €" ou "Tiramisu 6,50€" ou "€ 18"
  const priceRe = /([^.!?\n]{5,80}?)\s{0,5}(\d{1,2}[,.]?\d{0,2})\s*€(?![\d])/g;
  const priceRe2 = /€\s*(\d{1,2}[,.]?\d{0,2})\s{0,5}([^.!?\n]{5,80})/g;

  let m: RegExpExecArray | null;
  while ((m = priceRe.exec(text)) !== null && found.length < 20) {
    const rawName = m[1].replace(/[•\-–—*·|]+/g, " ").replace(/\s+/g, " ").trim();
    const price = m[2] + " €";
    if (rawName.length < 4 || rawName.length > 80) continue;
    if (/accueil|bienvenue|menu|carte|contact|email|tél|facebook|instagram|http/i.test(rawName)) continue;
    if (seen.has(rawName.toLowerCase())) continue;
    seen.add(rawName.toLowerCase());
    found.push({ name: rawName, price, context: m[0].trim() });
  }

  while ((m = priceRe2.exec(text)) !== null && found.length < 20) {
    const rawName = m[2].replace(/[•\-–—*·|]+/g, " ").replace(/\s+/g, " ").trim();
    const price = "€ " + m[1];
    if (rawName.length < 4 || rawName.length > 80) continue;
    if (seen.has(rawName.toLowerCase())) continue;
    seen.add(rawName.toLowerCase());
    found.push({ name: rawName, price, context: m[0].trim() });
  }

  return found.slice(0, 12);
}

// ─── 2. APPEL CLAUDE AVEC PROMPT CACHING ─────────────────────

// Le SYSTEM prompt est fixe pour tous les prospects → on le cache.
// Claude Haiku 4.5 via OpenRouter (Anthropic direct si ANTHROPIC_API_KEY).
// Anthropic prompt caching : cached reads = 0.10 $/MT au lieu de 1.25 $/MT
// (12× moins cher). Cache TTL 5 min → on bénéficie pour tous les prospects
// traités en rafale dans une campagne.

const AUDIT_SYSTEM_PROMPT = `Tu es un auditeur de sites web pro pour WebConceptor. Tu analyses le site actuel d'un commerçant/artisan français pour produire un brief qui permettra de générer une MAQUETTE SUR-MESURE qui sera objectivement meilleure que leur site actuel.

Ton travail : retourner un JSON structuré avec :
1. L'identité visuelle détectée (couleurs, polices, ton éditorial)
2. Le contenu à PRÉSERVER (textes, photos, leurs points uniques)
3. Les fonctionnalités présentes (ne pas faire moins)
4. Les fonctionnalités MANQUANTES (argument de vente pour nous)
5. Les faiblesses objectives (mobile, SEO, design daté, etc.)
6. Le brief d'amélioration : concept hero, sections, features à ajouter
7. Un verdict qualité du site (none/poor/average/good)

Règles strictes :
- Reste factuel : n'invente aucune information que tu n'as pas vue
- Si le prospect n'a pas de site (pas de data) : qualité = "none"
- Ton toujours respectueux (ce sont leurs sites, on ne juge pas)
- Priorise les améliorations qui apportent de la VRAIE valeur business (réservation sans commission, mobile, SEO local, formulaire de devis, chat, etc.)
- Le but final : que le prospect ouvre la maquette et se dise "ah oui, quand même, c'est mieux que le mien" — même s'il a un site cher.

Retourne UNIQUEMENT du JSON valide, sans préambule.`;

interface ClaudeAuditInput {
  prospectName: string;
  businessType?: string | null;
  city?: string | null;
  siteUrl?: string | null;
  parsed: ParsedPages;
}

async function callClaudeAudit(input: ClaudeAuditInput): Promise<DeepAudit | null> {
  const key = process.env.ANTHROPIC_API_KEY || process.env.OPENROUTER_API_KEY || "";
  if (!key) return null;

  const isOpenRouter = !process.env.ANTHROPIC_API_KEY && !!process.env.OPENROUTER_API_KEY;
  const endpoint = isOpenRouter
    ? "https://openrouter.ai/api/v1/chat/completions"
    : "https://api.anthropic.com/v1/messages";

  // Construit un USER message compact — on évite d'envoyer le HTML brut
  // (coûteux) et on ne passe que les données parsées.
  const userBrief = [
    `Prospect : ${input.prospectName}`,
    input.businessType ? `Activité : ${input.businessType}` : "",
    input.city ? `Ville : ${input.city}` : "",
    input.siteUrl ? `URL site actuel : ${input.siteUrl}` : "Aucun site actuel",
    "",
    "═══ DONNÉES PARSÉES DU SITE ═══",
    input.parsed.colors.length ? `Couleurs dominantes détectées : ${input.parsed.colors.join(", ")}` : "Aucune couleur détectée",
    input.parsed.fonts.length ? `Polices détectées : ${input.parsed.fonts.join(", ")}` : "Polices non détectées",
    `Images exploitables : ${input.parsed.images.length} trouvées`,
    input.parsed.images.length ? input.parsed.images.slice(0, 5).map((u, i) => `  ${i + 1}. ${u.slice(0, 120)}`).join("\n") : "",
    input.parsed.headings.length ? `Titres scrapés (H1-H3) :\n${input.parsed.headings.slice(0, 8).map((h) => `  • ${h.slice(0, 100)}`).join("\n")}` : "",
    input.parsed.metaDescription ? `Meta description : ${input.parsed.metaDescription}` : "",
    input.parsed.aboutText ? `Texte "À propos" scrapé :\n${input.parsed.aboutText.slice(0, 1500)}` : "Pas de page À propos trouvée",
    "",
    "═══ SIGNAUX TECHNIQUES ═══",
    `HTTPS : ${input.parsed.hasHttps ? "✅" : "❌ pas HTTPS"}`,
    `Viewport mobile : ${input.parsed.hasViewportMeta ? "✅" : "❌ pas responsive"}`,
    `Favicon : ${input.parsed.hasFavicon ? "✅" : "❌"}`,
    `Données structurées (Schema.org) : ${input.parsed.hasStructuredData ? "✅" : "❌"}`,
    `Image Open Graph : ${input.parsed.hasOgImage ? "✅" : "❌"}`,
    "",
    "═══ LIENS EXTERNES (indices features) ═══",
    input.parsed.externalLinks.booking.length ? `Réservation externe détectée (TheFork/Treatwell/etc.) : ${input.parsed.externalLinks.booking.join(", ")}` : "Aucune résa en ligne détectée",
    input.parsed.externalLinks.social.length ? `Réseaux sociaux : ${input.parsed.externalLinks.social.slice(0, 3).join(", ")}` : "Pas de réseaux sociaux liés",
    input.parsed.externalLinks.menu.length ? `Menu/carte PDF : ${input.parsed.externalLinks.menu[0]}` : "Pas de PDF menu détecté",
    input.parsed.forms.length ? `${input.parsed.forms.length} formulaire(s) détecté(s)` : "Aucun formulaire",
    "",
    input.parsed.menuItems.length
      ? `═══ PLATS / PRIX SCRAPÉS (à réutiliser dans la maquette) ═══\n${input.parsed.menuItems.slice(0, 10).map((m) => `  • ${m.name} — ${m.price}`).join("\n")}`
      : "Aucun prix détecté sur le site (menu générique à utiliser)",
    "",
    "Produis maintenant le JSON d'audit selon le schema demandé.",
  ].filter(Boolean).join("\n");

  // JSON schema attendu (on le met dans le user pour guidage)
  const schemaHint = `\n\nSCHEMA JSON ATTENDU :
{
  "brand": {
    "primaryColor": "#RRGGBB",
    "secondaryColor": "#RRGGBB",
    "accentColor": "#RRGGBB",
    "fonts": ["Nom Font 1", "Nom Font 2"],
    "keywords": ["chaleureux", "authentique", ...],
    "tone": "chaleureux|pro|moderne|artisanal|luxe|simple"
  },
  "contentToKeep": {
    "aboutText": "texte à propos nettoyé et raccourci à 300 caractères",
    "photos": ["url1", "url2", ...],
    "headingsH1H2": ["titre 1", "titre 2"],
    "uniqueSellingPoints": ["point 1", "point 2"]
  },
  "existingFeatures": ["feature 1 du site actuel", "feature 2"],
  "missingFeatures": ["feature qui leur manque 1", "feature 2"],
  "weaknesses": ["faiblesse technique 1", "faiblesse 2"],
  "improvementBrief": {
    "heroConcept": "description courte du hero idéal",
    "featuredSections": ["hero", "services", "booking", "reviews", "contact"],
    "featuresToAdd": ["feature à ajouter 1", "feature à ajouter 2"],
    "ctaStrategy": "ce que le CTA principal doit viser"
  },
  "menuItems": [
    {"name": "Nom du plat tel que scrapé", "description": "description courte (inventer si absent)", "price": "XX €", "category": "entrée|plat|dessert|boisson|autre"},
    {"name": "...", "description": "...", "price": "...", "category": "..."}
  ],
  "verdict": {
    "quality": "none|poor|average|good",
    "summary": "phrase courte",
    "confidence": "low|medium|high"
  }
}`;

  try {
    let body: Record<string, unknown>;
    if (isOpenRouter) {
      // OpenRouter proxy Claude Haiku, pas de prompt caching natif via OpenRouter
      body = {
        model: "meta-llama/llama-3.3-70b-instruct:free",
        messages: [
          { role: "system", content: AUDIT_SYSTEM_PROMPT },
          { role: "user", content: userBrief + schemaHint },
        ],
        max_tokens: 2000,
      };
    } else {
      // Anthropic direct — active le prompt caching sur le system prompt
      // Le cache est valide 5 min → tous les audits d'une même campagne
      // (9h matin) bénéficient du cache hit.
      body = {
        model: "claude-haiku-4-5",
        max_tokens: 2000,
        system: [
          {
            type: "text",
            text: AUDIT_SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [
          { role: "user", content: userBrief + schemaHint },
        ],
      };
    }

    const res = await fetch(endpoint, {
      method: "POST",
      headers: isOpenRouter
        ? { "Content-Type": "application/json", Authorization: `Bearer ${key}` }
        : {
            "Content-Type": "application/json",
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
          },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      console.error("[deep-audit] Claude HTTP", res.status, await res.text().catch(() => ""));
      return null;
    }

    const data = await res.json();
    const raw: string = isOpenRouter
      ? data.choices?.[0]?.message?.content || ""
      : data.content?.[0]?.text || "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    let parsed: Partial<DeepAudit>;
    try { parsed = JSON.parse(jsonMatch[0]); } catch { return null; }

    // Meta coût
    const usage = data.usage || {};
    const cacheCreation = Number(usage.cache_creation_input_tokens || 0);
    const cacheRead = Number(usage.cache_read_input_tokens || 0);
    const inputTokens = Number(usage.input_tokens || usage.prompt_tokens || 0);
    const outputTokens = Number(usage.output_tokens || usage.completion_tokens || 0);
    // Haiku 4.5 pricing (avr 2026, Anthropic) :
    //   input: 1.00 $/MT ; output: 5.00 $/MT
    //   cache write: 1.25 $/MT ; cache read: 0.10 $/MT
    const costUsd = (cacheCreation * 1.25 + cacheRead * 0.10 + inputTokens * 1.00 + outputTokens * 5.00) / 1_000_000;
    const cacheHitRate = cacheRead > 0 ? cacheRead / (cacheRead + cacheCreation + inputTokens) : 0;

    return {
      brand: parsed.brand as DeepAudit["brand"],
      contentToKeep: parsed.contentToKeep as DeepAudit["contentToKeep"],
      existingFeatures: Array.isArray(parsed.existingFeatures) ? parsed.existingFeatures : [],
      missingFeatures: Array.isArray(parsed.missingFeatures) ? parsed.missingFeatures : [],
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
      improvementBrief: parsed.improvementBrief as DeepAudit["improvementBrief"],
      verdict: parsed.verdict as DeepAudit["verdict"],
      _meta: { tokensIn: inputTokens, tokensOut: outputTokens, cacheHitRate, cost_usd: costUsd },
    };
  } catch (err) {
    console.error("[deep-audit] call failed:", err);
    return null;
  }
}

// ─── 3. FAÇADE PUBLIQUE ──────────────────────────────────────

export interface DeepAuditOptions {
  prospectName: string;
  siteUrl?: string | null;     // null si pas de site
  businessType?: string | null;
  city?: string | null;
}

/**
 * Audit complet (parsing local + appel Claude unique cached).
 * Retourne null si le site est injoignable ou Claude échoue → on utilisera
 * un fallback minimal côté appelant.
 */
export async function runDeepAudit(opts: DeepAuditOptions): Promise<DeepAudit | null> {
  // Cas "pas de site" : on produit un audit minimal pour guider la génération
  if (!opts.siteUrl || opts.siteUrl.trim().length === 0) {
    return buildNoSiteAudit(opts);
  }

  const fetched = await fetchKeyPages(opts.siteUrl);
  if (!fetched) return buildNoSiteAudit(opts, "Site injoignable");

  const parsed = parseKeyData(opts.siteUrl, fetched.html, fetched.subPages);

  const claudeAudit = await callClaudeAudit({
    prospectName: opts.prospectName,
    businessType: opts.businessType,
    city: opts.city,
    siteUrl: opts.siteUrl,
    parsed,
  });

  if (!claudeAudit) {
    // Fallback : on retourne un audit basé sur le parsing local uniquement,
    // sans les recommandations Claude. Mieux que rien.
    return buildParseOnlyAudit(opts, parsed);
  }

  // Merge : on préfère les URLs images parsées localement (plus fiables)
  // que celles que Claude a pu hallucinée
  if (parsed.images.length > 0) {
    claudeAudit.contentToKeep.photos = parsed.images;
  }
  return claudeAudit;
}

function buildNoSiteAudit(opts: DeepAuditOptions, summary = "Aucun site web actuel"): DeepAudit {
  return {
    brand: {
      primaryColor: "#0066ff",
      secondaryColor: "#1a1a1a",
      accentColor: "#FFD700",
      fonts: [],
      keywords: [],
      tone: "pro",
    },
    contentToKeep: { aboutText: "", photos: [], headingsH1H2: [], uniqueSellingPoints: [] },
    existingFeatures: [],
    missingFeatures: [
      "pas de site web du tout",
      "invisible sur Google quand clients cherchent localement",
      "pas de formulaire de contact / devis en ligne",
      "pas de crédibilité numérique",
    ],
    weaknesses: ["pas de présence web"],
    improvementBrief: {
      heroConcept: "Hero avec photo Google Places + proposition de valeur claire + CTA contact",
      featuredSections: ["hero", "services", "contact", "reviews"],
      featuresToAdd: [
        "formulaire de contact/devis simple",
        "intégration Google Maps avec boutons Waze/Plans",
        "galerie photos",
        opts.businessType === "restaurant" ? "module de réservation sans commission" : "prise de rendez-vous en ligne",
      ],
      ctaStrategy: "Faire appeler ou remplir un formulaire — simple et direct",
    },
    verdict: { quality: "none", summary, confidence: "high" },
  };
}

function buildParseOnlyAudit(opts: DeepAuditOptions, parsed: ParsedPages): DeepAudit {
  const weaknesses: string[] = [];
  if (!parsed.hasHttps) weaknesses.push("site non HTTPS (alerte sécurité)");
  if (!parsed.hasViewportMeta) weaknesses.push("pas responsive mobile");
  if (!parsed.hasFavicon) weaknesses.push("pas de favicon");
  if (!parsed.hasStructuredData) weaknesses.push("pas de données Schema.org (SEO)");
  if (!parsed.hasOgImage) weaknesses.push("pas d'image de partage réseaux sociaux");
  const missing: string[] = [];
  if (parsed.externalLinks.booking.length > 0) missing.push("réservation dépend de plateformes tierces payantes");
  else if (opts.businessType === "restaurant") missing.push("pas de réservation en ligne directe");
  const quality: DeepAudit["verdict"]["quality"] = weaknesses.length >= 3 ? "poor" : (weaknesses.length >= 1 ? "average" : "good");

  return {
    brand: {
      primaryColor: parsed.colors[0] || "#0066ff",
      secondaryColor: parsed.colors[1] || "#1a1a1a",
      accentColor: parsed.colors[2] || "#FFD700",
      fonts: parsed.fonts,
      keywords: [],
      tone: "pro",
    },
    contentToKeep: {
      aboutText: parsed.aboutText.slice(0, 400),
      photos: parsed.images,
      headingsH1H2: parsed.headings.slice(0, 5),
      uniqueSellingPoints: [],
    },
    existingFeatures: [],
    missingFeatures: missing,
    weaknesses,
    improvementBrief: {
      heroConcept: "Hero moderne avec photos existantes + nom + ville",
      featuredSections: ["hero", "about", "services", "gallery", "contact"],
      featuresToAdd: missing,
      ctaStrategy: "Contact direct",
    },
    verdict: { quality, summary: `Site détecté avec ${weaknesses.length} faiblesses techniques`, confidence: "medium" },
  };
}
