import { NextRequest, NextResponse } from "next/server";
import { isPrivateOrUnsafeUrl, rateLimit, getClientIp, safeFetch } from "@/lib/security";

interface AuditResult {
  performance: number;
  seo: number;
  accessibility: number;
  loadTime: string;
  mobileFriendly: boolean;
  issues: string[];
}

function cleanUrl(raw: string): string | null {
  let u = raw.trim();
  // Remove leading @ or other weirdness
  u = u.replace(/^[^a-zA-Z0-9]*/, "");
  // Add protocol if missing
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  // Validate it's a plausible URL
  try {
    const parsed = new URL(u);
    if (!parsed.hostname.includes(".")) return null;
    // Remove trailing slash but keep root
    return parsed.origin + (parsed.pathname === "/" ? "" : parsed.pathname);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Rate limit : 20 audits/min per IP (PageSpeed is expensive — ~15s per call)
  const ip = getClientIp(req.headers);
  const rl = rateLimit(`audit:${ip}`, 20, 60);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Trop de demandes. Reessayez dans ${rl.retryAfter}s.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Requete invalide." }, { status: 400 });
  }
  const { url } = body;

  if (!url || typeof url !== "string" || url.length > 2000) {
    return NextResponse.json({ error: "Veuillez saisir une URL valide." }, { status: 400 });
  }

  const targetUrl = cleanUrl(url);
  if (!targetUrl) {
    return NextResponse.json({
      error: "URL invalide. Exemple : www.monsite.fr ou https://monsite.fr",
    }, { status: 400 });
  }

  // SSRF protection : block private IP / localhost / metadata endpoints
  if (isPrivateOrUnsafeUrl(targetUrl)) {
    return NextResponse.json({
      error: "URL non autorisee (adresse interne ou protocole non supporte).",
    }, { status: 400 });
  }

  // Pre-check: is the site reachable at all? Uses safeFetch which re-validates
  // each redirect hop against the SSRF blocklist.
  try {
    const head = await safeFetch(targetUrl, {
      method: "HEAD",
      timeoutMs: 10000,
      maxRedirects: 5,
    });
    if (!head.ok && head.status !== 405) {
      return NextResponse.json({
        error: `Le site ${targetUrl} n'est pas accessible (erreur ${head.status}). Verifiez l'URL.`,
      }, { status: 400 });
    }
  } catch {
    // HEAD may not be supported or redirected somewhere blocked → continue to PageSpeed
  }

  // Build PageSpeed API URL with optional key (more reliable with key, falls back to free tier)
  const googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_API_KEY || "";
  const params = new URLSearchParams({
    url: targetUrl,
    category: "performance",
    strategy: "mobile",
  });
  params.append("category", "seo");
  params.append("category", "accessibility");
  if (googleKey) params.set("key", googleKey);

  try {
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?${params.toString()}`;

    const res = await fetch(apiUrl, { signal: AbortSignal.timeout(45000) });

    if (!res.ok) {
      // Parse Google error if possible
      let errorDetail = "";
      try {
        const errData = await res.json();
        errorDetail = errData?.error?.message || "";
      } catch { /* ignore */ }

      if (res.status === 400 || errorDetail.toLowerCase().includes("url")) {
        return NextResponse.json({
          error: "Impossible d'analyser cette URL. Verifiez qu'elle est publique et accessible depuis Internet.",
        }, { status: 400 });
      }
      if (res.status === 429) {
        return NextResponse.json({
          error: "Trop de demandes simultanees. Reessayez dans quelques secondes.",
        }, { status: 429 });
      }
      if (res.status >= 500) {
        return NextResponse.json({
          error: "Le service d'analyse est temporairement indisponible. Reessayez dans 1 min.",
        }, { status: 502 });
      }
      return NextResponse.json({
        error: errorDetail || `Erreur d'analyse (${res.status}). Reessayez.`,
      }, { status: 400 });
    }

    const data = await res.json();
    const categories = data.lighthouseResult?.categories || {};
    const audits = data.lighthouseResult?.audits || {};

    const performance = Math.round((categories.performance?.score || 0) * 100);
    const seo = Math.round((categories.seo?.score || 0) * 100);
    const accessibility = Math.round((categories.accessibility?.score || 0) * 100);

    const fcp = audits["first-contentful-paint"]?.displayValue || "";
    const lcp = audits["largest-contentful-paint"]?.displayValue || "";
    const loadTime = lcp || fcp || "N/A";

    const viewportOk = audits["viewport"]?.score === 1;
    const fontOk = audits["font-size"]?.score === 1;
    const mobileFriendly = viewportOk && fontOk;

    const issues: string[] = [];
    const importantAudits = [
      { key: "first-contentful-paint", label: "Temps de chargement trop lent" },
      { key: "largest-contentful-paint", label: "Contenu principal long a afficher" },
      { key: "cumulative-layout-shift", label: "Elements qui bougent au chargement" },
      { key: "viewport", label: "Pas adapte au mobile" },
      { key: "document-title", label: "Titre de page manquant" },
      { key: "meta-description", label: "Description SEO manquante" },
      { key: "heading-order", label: "Structure des titres incorrecte" },
      { key: "image-alt", label: "Images sans description alternative" },
      { key: "link-name", label: "Liens sans texte descriptif" },
      { key: "font-size", label: "Texte trop petit sur mobile" },
      { key: "tap-targets", label: "Boutons trop petits sur mobile" },
      { key: "http-status-code", label: "Erreurs HTTP detectees" },
      { key: "is-crawlable", label: "Site bloque pour Google" },
      { key: "robots-txt", label: "Fichier robots.txt manquant" },
      { key: "canonical", label: "URL canonique manquante" },
      { key: "structured-data", label: "Donnees structurees manquantes" },
      { key: "render-blocking-resources", label: "Ressources qui bloquent l'affichage" },
      { key: "uses-optimized-images", label: "Images non optimisees" },
      { key: "uses-text-compression", label: "Compression de texte desactivee" },
      { key: "color-contrast", label: "Contraste de couleurs insuffisant" },
    ];
    for (const a of importantAudits) {
      const r = audits[a.key];
      if (r && r.score !== null && r.score < 0.9) issues.push(a.label);
    }

    const result: AuditResult = {
      performance, seo, accessibility,
      loadTime, mobileFriendly,
      issues: issues.slice(0, 8),
    };

    return NextResponse.json(result);
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "AbortError";
    return NextResponse.json({
      error: isTimeout
        ? "L'analyse a pris trop de temps (plus de 45 s). Verifiez que votre site charge correctement."
        : "Erreur reseau. Verifiez votre connexion et reessayez.",
    }, { status: 500 });
  }
}
