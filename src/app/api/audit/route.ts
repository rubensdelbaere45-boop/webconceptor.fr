import { NextRequest, NextResponse } from "next/server";

interface AuditResult {
  performance: number;
  seo: number;
  accessibility: number;
  loadTime: string;
  mobileFriendly: boolean;
  issues: string[];
}

export async function POST(req: NextRequest) {
  const { url } = await req.json();

  if (!url) {
    return NextResponse.json({ error: "URL manquante" }, { status: 400 });
  }

  // Normalize URL
  let targetUrl = url.trim();
  if (!targetUrl.startsWith("http")) {
    targetUrl = "https://" + targetUrl;
  }

  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&category=performance&category=seo&category=accessibility&strategy=mobile`;

    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(30000) });

    if (!res.ok) {
      return NextResponse.json({
        error: "Impossible d'analyser ce site. Vérifiez l'URL.",
      }, { status: 400 });
    }

    const data = await res.json();

    const categories = data.lighthouseResult?.categories || {};
    const audits = data.lighthouseResult?.audits || {};

    const performance = Math.round((categories.performance?.score || 0) * 100);
    const seo = Math.round((categories.seo?.score || 0) * 100);
    const accessibility = Math.round((categories.accessibility?.score || 0) * 100);

    // Get load time
    const fcp = audits["first-contentful-paint"]?.displayValue || "";
    const lcp = audits["largest-contentful-paint"]?.displayValue || "";
    const loadTime = lcp || fcp || "N/A";

    // Check mobile friendly
    const viewportAudit = audits["viewport"]?.score === 1;
    const fontSizeAudit = audits["font-size"]?.score === 1;
    const mobileFriendly = viewportAudit && fontSizeAudit;

    // Collect key issues (failed audits)
    const issues: string[] = [];

    const importantAudits = [
      { key: "first-contentful-paint", label: "Temps de chargement trop lent" },
      { key: "largest-contentful-paint", label: "Contenu principal long à afficher" },
      { key: "cumulative-layout-shift", label: "Éléments qui bougent au chargement" },
      { key: "viewport", label: "Pas adapté au mobile" },
      { key: "document-title", label: "Titre de page manquant" },
      { key: "meta-description", label: "Description SEO manquante" },
      { key: "heading-order", label: "Structure des titres incorrecte" },
      { key: "image-alt", label: "Images sans description alternative" },
      { key: "link-name", label: "Liens sans texte descriptif" },
      { key: "font-size", label: "Texte trop petit sur mobile" },
      { key: "tap-targets", label: "Boutons trop petits sur mobile" },
      { key: "http-status-code", label: "Erreurs HTTP détectées" },
      { key: "is-crawlable", label: "Site bloqué pour Google" },
      { key: "robots-txt", label: "Fichier robots.txt manquant" },
      { key: "hreflang", label: "Balises de langue manquantes" },
      { key: "canonical", label: "URL canonique manquante" },
      { key: "structured-data", label: "Données structurées manquantes" },
      { key: "render-blocking-resources", label: "Ressources qui bloquent l'affichage" },
      { key: "uses-optimized-images", label: "Images non optimisées" },
      { key: "uses-text-compression", label: "Compression de texte désactivée" },
      { key: "color-contrast", label: "Contraste de couleurs insuffisant" },
    ];

    for (const audit of importantAudits) {
      const result = audits[audit.key];
      if (result && result.score !== null && result.score < 0.9) {
        issues.push(audit.label);
      }
    }

    // Limit to 8 most important issues
    const topIssues = issues.slice(0, 8);

    const result: AuditResult = {
      performance,
      seo,
      accessibility,
      loadTime,
      mobileFriendly,
      issues: topIssues,
    };

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({
      error: "Erreur lors de l'analyse. Vérifiez que l'URL est accessible.",
    }, { status: 500 });
  }
}
