import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
import { safeFetch, isPrivateOrUnsafeUrl } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/audit-ia

   Deux modes :
   A) mode=checkout  → crée une session Stripe (49€ one-shot)
   B) mode=generate  → génère et envoie le rapport (appelé par webhook)

   Flow complet :
   1. Client paie 49€ sur Stripe
   2. Stripe webhook → POST /api/audit-ia { mode:"generate", order_id }
   3. On scrape GMB + analyse site + génère rapport IA
   4. Envoi PDF/HTML par email en < 5 min
   ══════════════════════════════════════════ */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const str = (v: unknown, max = 300): string => String(v ?? "").slice(0, max).trim();

// ─────────────────────────────────────────
// Scrape Google My Business via Places API
// ─────────────────────────────────────────
async function scrapeGMB(businessName: string, city: string): Promise<{
  rating: number | null;
  reviewCount: number | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  openNow: boolean | null;
  types: string[];
  placeId: string | null;
}> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY || "";
  if (!apiKey) return { rating: null, reviewCount: null, address: null, phone: null, website: null, openNow: null, types: [], placeId: null };

  try {
    const query = encodeURIComponent(`${businessName} ${city}`);
    const findRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${query}&inputtype=textquery&fields=place_id,name,rating,user_ratings_total,formatted_address&key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const findData = await findRes.json();
    const candidates = findData.candidates || [];
    if (!candidates.length) return { rating: null, reviewCount: null, address: null, phone: null, website: null, openNow: null, types: [], placeId: null };

    const placeId = candidates[0].place_id;
    const detailRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,formatted_address,formatted_phone_number,website,opening_hours,types&key=${apiKey}`,
      { signal: AbortSignal.timeout(8000) }
    );
    const detailData = await detailRes.json();
    const r = detailData.result || {};

    return {
      rating:      r.rating           ?? null,
      reviewCount: r.user_ratings_total ?? null,
      address:     r.formatted_address  ?? null,
      phone:       r.formatted_phone_number ?? null,
      website:     r.website           ?? null,
      openNow:     r.opening_hours?.open_now ?? null,
      types:       r.types            ?? [],
      placeId,
    };
  } catch {
    return { rating: null, reviewCount: null, address: null, phone: null, website: null, openNow: null, types: [], placeId: null };
  }
}

// ─────────────────────────────────────────
// Analyse basique du site web
// ─────────────────────────────────────────
async function analyzeWebsite(url: string): Promise<{
  exists: boolean;
  hasSSL: boolean;
  loadFast: boolean;
  hasMobile: boolean;
  score: number;
  issues: string[];
}> {
  if (!url) return { exists: false, hasSSL: false, loadFast: false, hasMobile: false, score: 0, issues: ["Aucun site web trouvé sur Google My Business"] };

  // 🛡️ SSRF guard : refuser URLs vers réseaux privés / metadata cloud avant tout fetch.
  if (isPrivateOrUnsafeUrl(url)) {
    return { exists: false, hasSSL: false, loadFast: false, hasMobile: false, score: 0, issues: ["URL invalide ou pointant vers un réseau privé"] };
  }

  const issues: string[] = [];
  let score = 40; // Score de base si le site existe

  try {
    const hasSSL = url.startsWith("https://");
    if (!hasSSL) { issues.push("Pas de HTTPS — Google pénalise les sites non sécurisés"); } else { score += 15; }

    const start = Date.now();
    // safeFetch vérifie chaque hop de redirection contre les réseaux privés
    const res = await safeFetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Klyora SitesAudit/1.0)" },
      timeoutMs: 8000,
      maxRedirects: 3,
    });
    const elapsed = Date.now() - start;
    const html = await res.text().catch(() => "");

    const loadFast = elapsed < 2000;
    if (!loadFast) { issues.push(`Temps de chargement lent (${(elapsed / 1000).toFixed(1)}s) — idéal < 2s`); } else { score += 15; }

    const hasMobile = html.toLowerCase().includes("viewport");
    if (!hasMobile) { issues.push("Pas adapté aux mobiles (no viewport) — 70% des recherches sont sur téléphone"); } else { score += 15; }

    const hasPhone = /\+33|0[1-9][ .-]?\d{2}/.test(html);
    if (!hasPhone) { issues.push("Numéro de téléphone non visible sur le site"); } else { score += 5; }

    const hasContact = /contact|formulaire|devis|reservation/i.test(html);
    if (!hasContact) { issues.push("Pas de formulaire de contact ou de bouton de réservation"); } else { score += 5; }

    const hasSocialProof = /avis|témoignage|note|étoile/i.test(html);
    if (!hasSocialProof) { score -= 5; issues.push("Pas d'avis clients visibles sur le site"); }

    return { exists: true, hasSSL, loadFast, hasMobile, score: Math.min(100, Math.max(0, score)), issues };
  } catch {
    return { exists: true, hasSSL: false, loadFast: false, hasMobile: false, score: 20, issues: ["Site inaccessible ou trop lent"] };
  }
}

// ─────────────────────────────────────────
// Génère le rapport HTML complet avec IA
// ─────────────────────────────────────────
async function generateAuditReport(order: {
  id: string;
  business_name: string;
  owner_name: string;
  owner_email: string;
  business_address?: string | null;
  website_url?: string | null;
}): Promise<void> {
  const supabase = getSupabase();

  await supabase.from("audit_orders").update({ status: "processing" }).eq("id", order.id);

  const city = (order.business_address || "").split(",").pop()?.trim() || "";

  // Scrape GMB d'abord pour récupérer l'URL du site si non fournie
  const gmbData = await scrapeGMB(order.business_name, city);
  const websiteUrl = order.website_url || gmbData.website || "";
  const siteData = await analyzeWebsite(websiteUrl);

  // Score global
  const gmbScore = (() => {
    let s = 0;
    if (gmbData.rating !== null)      s += Math.min(40, Math.round(gmbData.rating * 8));
    if ((gmbData.reviewCount || 0) > 10)  s += 15;
    if ((gmbData.reviewCount || 0) > 50)  s += 10;
    if (gmbData.phone)     s += 10;
    if (gmbData.website)   s += 10;
    if (gmbData.openNow !== null) s += 5;
    return Math.min(100, s);
  })();

  const globalScore = Math.round((gmbScore + siteData.score) / 2);

  // Génération IA du contenu du rapport
  const apiKey = process.env.OPENROUTER_API_KEY || "";
  const isOR = Boolean(apiKey);

  let aiAnalysis = "";
  try {
    const context = [
      `Entreprise : ${order.business_name}`,
      `Score Google My Business : ${gmbScore}/100`,
      `Note Google : ${gmbData.rating ?? "non trouvée"}/5 (${gmbData.reviewCount ?? 0} avis)`,
      `Score site web : ${siteData.score}/100`,
      `Site : ${websiteUrl || "aucun site trouvé"}`,
      `Problèmes détectés sur le site : ${siteData.issues.join("; ") || "aucun"}`,
    ].join("\n");

    const res = await fetch(isOR ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(isOR ? { "HTTP-Referer": "https://klyora.fr" } : {}),
      },
      body: JSON.stringify({
        model: isOR ? "anthropic/claude-haiku-4-5" : "claude-haiku-4-5",
        max_tokens: 600,
        system: "Tu es un expert en marketing digital pour les PME françaises. Tu rédiges des analyses de présence en ligne percutantes, directes et actionnables. Sois concret, pas générique.",
        messages: [{
          role: "user",
          content: `Analyse cette présence en ligne et donne 3 recommandations prioritaires et actionnables :\n${context}\n\nFormat : 3 points avec emoji, titre court, explication en 1-2 phrases. Pas d'introduction.`,
        }],
      }),
      signal: AbortSignal.timeout(15_000),
    });

    const data = await res.json();
    aiAnalysis = (data.choices?.[0]?.message?.content || data.content?.[0]?.text || "").trim();
  } catch {
    aiAnalysis = "• Améliorez votre note Google en demandant systématiquement des avis après chaque vente\n• Assurez-vous que votre site est optimisé pour les mobiles\n• Répondez à tous vos avis Google, positifs et négatifs";
  }

  // Construction du rapport HTML
  const scoreColor = globalScore >= 70 ? "#22c55e" : globalScore >= 45 ? "#f59e0b" : "#ef4444";
  const firstName = (order.owner_name || "").split(" ")[0] || "vous";

  const reportHtml = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Audit présence en ligne — ${order.business_name}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,'Segoe UI',sans-serif;background:#f8fafc;color:#1a1a1a;line-height:1.5}
.wrap{max-width:640px;margin:0 auto;padding:32px 20px}
.header{background:linear-gradient(135deg,#0066ff,#7c3aed);color:#fff;border-radius:16px;padding:32px;margin-bottom:24px;text-align:center}
.header h1{font-size:22px;margin-bottom:8px}
.header p{font-size:14px;opacity:.85}
.score-circle{width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.15);display:inline-flex;align-items:center;justify-content:center;flex-direction:column;margin:16px auto;border:3px solid rgba(255,255,255,.3)}
.score-circle span{font-size:32px;font-weight:800;line-height:1}
.score-circle small{font-size:11px;opacity:.7}
.card{background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.card h2{font-size:16px;font-weight:700;margin-bottom:16px;display:flex;align-items:center;gap:8px}
.metric{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f3f4f6}
.metric:last-child{border-bottom:none}
.metric-label{font-size:14px;color:#4b5563}
.metric-value{font-size:14px;font-weight:600}
.badge{display:inline-block;padding:2px 10px;border-radius:100px;font-size:12px;font-weight:600}
.badge-green{background:#dcfce7;color:#15803d}
.badge-red{background:#fee2e2;color:#dc2626}
.badge-yellow{background:#fef9c3;color:#92400e}
.issue{display:flex;gap:8px;padding:10px 0;border-bottom:1px solid #f3f4f6;font-size:13px;color:#dc2626}
.issue:last-child{border-bottom:none}
.ai-block{background:linear-gradient(135deg,#eff6ff,#f5f3ff);border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #dbeafe}
.ai-block h2{font-size:16px;font-weight:700;margin-bottom:16px;color:#1d4ed8}
.ai-content{font-size:14px;line-height:1.7;color:#374151;white-space:pre-wrap}
.cta{background:#0066ff;color:#fff;border-radius:12px;padding:24px;text-align:center;margin-bottom:16px}
.cta h2{font-size:18px;font-weight:700;margin-bottom:8px}
.cta p{font-size:14px;opacity:.9;margin-bottom:20px}
.cta a{display:inline-block;background:#fff;color:#0066ff;padding:12px 28px;border-radius:100px;font-weight:700;font-size:14px;text-decoration:none}
.footer{text-align:center;font-size:12px;color:#9ca3af;padding-top:16px}
.stars{color:#f59e0b;font-size:20px;letter-spacing:2px}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <p style="font-size:12px;margin-bottom:16px;text-transform:uppercase;letter-spacing:.1em;opacity:.7">Audit Présence en Ligne</p>
    <h1>${order.business_name}</h1>
    <p>Généré le ${new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
    <div class="score-circle" style="border-color:${scoreColor}">
      <span style="color:${scoreColor}">${globalScore}</span>
      <small>/100</small>
    </div>
    <p style="font-size:13px;margin-top:4px">
      ${globalScore >= 70 ? "✅ Bonne présence en ligne" : globalScore >= 45 ? "⚠️ Présence à améliorer" : "🚨 Présence insuffisante"}
    </p>
  </div>

  <!-- Google My Business -->
  <div class="card">
    <h2>🗺️ Google My Business <span class="badge ${gmbScore >= 60 ? "badge-green" : gmbScore >= 30 ? "badge-yellow" : "badge-red"}">${gmbScore}/100</span></h2>
    ${gmbData.rating !== null ? `
    <div class="metric">
      <span class="metric-label">Note Google</span>
      <span class="metric-value">
        <span class="stars">${"★".repeat(Math.round(gmbData.rating))}${"☆".repeat(5 - Math.round(gmbData.rating))}</span>
        <strong> ${gmbData.rating}/5</strong>
      </span>
    </div>` : `<div class="metric"><span class="metric-label">Fiche Google</span><span class="badge badge-red">Non trouvée</span></div>`}
    ${gmbData.reviewCount !== null ? `
    <div class="metric">
      <span class="metric-label">Nombre d'avis</span>
      <span class="metric-value">${gmbData.reviewCount} avis</span>
    </div>` : ""}
    <div class="metric">
      <span class="metric-label">Téléphone visible</span>
      <span class="badge ${gmbData.phone ? "badge-green" : "badge-red"}">${gmbData.phone ? "✅ " + gmbData.phone : "❌ Absent"}</span>
    </div>
    <div class="metric">
      <span class="metric-label">Site web renseigné</span>
      <span class="badge ${gmbData.website ? "badge-green" : "badge-red"}">${gmbData.website ? "✅ Oui" : "❌ Non"}</span>
    </div>
  </div>

  <!-- Site web -->
  <div class="card">
    <h2>🌐 Site web <span class="badge ${siteData.score >= 60 ? "badge-green" : siteData.score >= 30 ? "badge-yellow" : "badge-red"}">${siteData.score}/100</span></h2>
    ${!siteData.exists ? `<p style="color:#dc2626;font-size:14px">❌ Aucun site web trouvé. Vous perdez des clients chaque jour.</p>` : `
    <div class="metric">
      <span class="metric-label">HTTPS (sécurisé)</span>
      <span class="badge ${siteData.hasSSL ? "badge-green" : "badge-red"}">${siteData.hasSSL ? "✅ Oui" : "❌ Non"}</span>
    </div>
    <div class="metric">
      <span class="metric-label">Adapté mobiles</span>
      <span class="badge ${siteData.hasMobile ? "badge-green" : "badge-red"}">${siteData.hasMobile ? "✅ Oui" : "❌ Non"}</span>
    </div>
    <div class="metric">
      <span class="metric-label">Vitesse de chargement</span>
      <span class="badge ${siteData.loadFast ? "badge-green" : "badge-yellow"}">${siteData.loadFast ? "✅ Rapide" : "⚠️ Lent"}</span>
    </div>
    `}
    ${siteData.issues.length > 0 ? `
    <div style="margin-top:12px">
      <p style="font-size:13px;font-weight:600;color:#dc2626;margin-bottom:8px">⚠️ Problèmes détectés :</p>
      ${siteData.issues.map((i) => `<div class="issue"><span>•</span><span>${i}</span></div>`).join("")}
    </div>` : ""}
  </div>

  <!-- Recommandations IA -->
  <div class="ai-block">
    <h2>🤖 Recommandations prioritaires</h2>
    <div class="ai-content">${aiAnalysis}</div>
  </div>

  <!-- CTA -->
  <div class="cta">
    <h2>Passez à l'action dès aujourd'hui</h2>
    <p>Klyora Sites peut corriger tous ces problèmes pour vous, rapidement et sans prise de tête.</p>
    <a href="https://klyora.fr">Voir nos services →</a>
  </div>

  <div class="footer">
    <p>Audit réalisé par <strong>Klyora Sites</strong> · contact@klyora.fr · klyora.fr</p>
    <p style="margin-top:4px">Rapport confidentiel généré automatiquement pour ${order.owner_name || order.owner_email}</p>
  </div>
</div>
</body>
</html>`;

  // Sauvegarder le rapport
  await supabase
    .from("audit_orders")
    .update({
      report_html:      reportHtml,
      gmb_rating:       gmbData.rating,
      gmb_reviews_count: gmbData.reviewCount,
      website_score:    siteData.score,
      report_sent_at:   new Date().toISOString(),
      status:           "done",
    })
    .eq("id", order.id);

  // Envoyer par email
  const apiKey2 = process.env.BREVO_API_KEY;
  if (apiKey2) {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey2, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "Tom Bauer — Klyora Sites", email: "contact@klyora.fr" },
        to: [{ email: order.owner_email, name: order.owner_name || order.owner_email }],
        subject: `📊 Votre audit présence en ligne — ${order.business_name} (score : ${globalScore}/100)`,
        htmlContent: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px;color:#111">
<p style="font-size:15px">Bonjour ${firstName},</p>
<p style="font-size:15px;margin:16px 0">Votre audit de présence en ligne pour <strong>${order.business_name}</strong> est prêt.</p>
<p style="font-size:15px;color:#525252;margin-bottom:24px">Score global : <strong style="color:${scoreColor};font-size:20px">${globalScore}/100</strong></p>
<p style="font-size:14px;color:#525252">Retrouvez votre rapport complet ci-joint. Il contient :</p>
<ul style="font-size:14px;color:#525252;margin:12px 0;padding-left:20px">
  <li>Analyse de votre fiche Google My Business</li>
  <li>Audit de votre site web</li>
  <li>3 recommandations prioritaires et actionnables</li>
</ul>
<p style="font-size:14px;color:#525252;margin-top:16px">Des questions ? Répondez simplement à cet email.</p>
<div style="border-top:1px solid #e5e5e5;margin-top:24px;padding-top:16px;font-size:13px;color:#737373">
<strong>Tom Bauer</strong> — Klyora Sites<br>contact@klyora.fr · 06 35 59 24 71
</div>
</div>`,
        attachment: [{
          content: Buffer.from(reportHtml).toString("base64"),
          name: `audit-${order.business_name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.html`,
        }],
      }),
    }).catch((err) => console.error("[audit-ia] email error:", err));
  }
}

// ─────────────────────────────────────────
// Handler principal
// ─────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const mode = str(body.mode) || "checkout";

    // Mode checkout : crée la session Stripe
    if (mode === "checkout") {
      const businessName = str(body.business_name, 200);
      const ownerEmail   = str(body.email, 200).toLowerCase();
      const ownerName    = str(body.name, 200);
      const businessAddr = str(body.address, 300);
      const websiteUrl   = str(body.website, 300);

      if (!businessName || !ownerEmail) {
        return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
      }

      const priceId = process.env.STRIPE_AUDIT_PRICE_ID || "price_audit_49";
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL   || "https://klyora.fr";

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        customer_email: ownerEmail,
        line_items: [{ price: priceId, quantity: 1 }],
        metadata: {
          source:         "audit_ia",
          business_name:  businessName.slice(0, 500),
          owner_name:     ownerName.slice(0, 500),
          owner_email:    ownerEmail.slice(0, 500),
          business_addr:  businessAddr.slice(0, 500),
          website_url:    websiteUrl.slice(0, 500),
        },
        success_url: `${baseUrl}/services/audit/merci`,
        cancel_url:  `${baseUrl}/services/audit`,
        locale: "fr",
      });

      return NextResponse.json({ url: session.url });
    }

    // Mode generate : génère le rapport (appelé par le webhook Stripe)
    if (mode === "generate") {
      const orderId = str(body.order_id, 50);
      if (!orderId) return NextResponse.json({ error: "order_id manquant" }, { status: 400 });

      const supabase = getSupabase();
      const { data: order } = await supabase
        .from("audit_orders")
        .select("*")
        .eq("id", orderId)
        .single();

      if (!order) return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
      if (order.status === "done") return NextResponse.json({ success: true, already_done: true });

      // Lancer la génération en arrière-plan (pas de await)
      generateAuditReport(order).catch((err) => {
        console.error("[audit-ia] generation error:", err);
        getSupabase()
          .from("audit_orders")
          .update({ status: "error", error_message: String(err).slice(0, 500) })
          .eq("id", orderId)
          .then(() => {});
      });

      return NextResponse.json({ success: true, message: "Génération lancée en arrière-plan" });
    }

    return NextResponse.json({ error: "Mode invalide" }, { status: 400 });
  } catch (err) {
    console.error("[audit-ia] error:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
