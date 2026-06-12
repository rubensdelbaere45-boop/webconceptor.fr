/**
 * Envoie l'e-book + cover par email avec TOUS les champs KDP prêts à coller.
 * Format optimisé pour copier/coller rapide depuis Gmail vers le formulaire KDP.
 */

import type { EbookOutline } from "./types";

interface EmailParams {
  to: string;
  outline: EbookOutline;
  pdfBuffer: Buffer;
  coverBuffer: Buffer;
  coverExt: "png" | "jpg" | "svg";
  coverMime: string;
  pdfUrl?: string | null;
  coverUrl?: string | null;
  totalWords: number;
  estimatedPages: number;
}

export async function sendEbookEmail(p: EmailParams): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return { ok: false, error: "BREVO_API_KEY manquante" };

  const subject = `📚 E-book du jour : ${p.outline.title} (${p.estimatedPages}p, prix ${p.outline.kdp.recommended_price_eur}€)`;
  const htmlBody = buildHtmlBody(p);

  const attachments = [
    { name: sanitize(`${p.outline.title}.pdf`), content: p.pdfBuffer.toString("base64") },
    { name: sanitize(`${p.outline.title}-cover.${p.coverExt}`), content: p.coverBuffer.toString("base64") },
  ];

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        sender: { name: "Klyora Sites — E-Books", email: "noreply@webconceptor.fr" },
        to: [{ email: p.to, name: "Tom" }],
        subject,
        htmlContent: htmlBody,
        attachment: attachments,
      }),
      signal: AbortSignal.timeout(45_000),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Brevo HTTP ${res.status} : ${text.slice(0, 200)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "network error" };
  }
}

function buildHtmlBody(p: EmailParams): string {
  const o = p.outline;
  const k = o.kdp;
  const niche = o.niche;

  // Bloc copier-coller : un par champ KDP
  const copyBlock = (label: string, value: string, color = "#fffbf0") => `
<div style="margin: 14px 0;">
  <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">${label}</div>
  <div style="background: ${color}; border-left: 3px solid #f59e0b; padding: 10px 14px; border-radius: 4px; font-family: 'Courier New', monospace; font-size: 13px; white-space: pre-wrap; word-break: break-word;">${escape(value)}</div>
</div>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 700px; margin: 0 auto; padding: 24px; color: #1a1a1a; background: #fff;">

<div style="background: linear-gradient(135deg, #1e3a8a, #7c3aed); color: white; padding: 24px; border-radius: 10px; margin-bottom: 24px;">
  <div style="font-size: 12px; opacity: 0.8; margin-bottom: 4px;">📚 EBOOK DU JOUR — prêt à publier KDP</div>
  <h1 style="font-size: 26px; margin: 6px 0;">${escape(o.title)}</h1>
  <div style="font-style: italic; opacity: 0.9;">${escape(o.subtitle)}</div>
  <div style="margin-top: 14px; font-size: 13px; opacity: 0.8;">
    par <b>${escape(o.author_name)}</b> · ${p.estimatedPages} pages · ${p.totalWords.toLocaleString()} mots
  </div>
</div>

<!-- Prix mis en avant -->
<div style="background: #ecfdf5; border: 2px solid #10b981; border-radius: 10px; padding: 18px; margin: 20px 0; text-align: center;">
  <div style="font-size: 12px; color: #047857; text-transform: uppercase; letter-spacing: 0.5px;">Prix recommandé KDP</div>
  <div style="font-size: 36px; font-weight: bold; color: #064e3b; margin: 6px 0;">${k.recommended_price_eur.toFixed(2)} €</div>
  <div style="font-size: 13px; color: #065f46;">
    Royalty <b>${k.royalty_percent}%</b> → gain net par vente : <b>${k.estimated_royalty_per_sale_eur.toFixed(2)} €</b><br>
    <span style="font-size: 11px; opacity: 0.7;">≈ ${Math.ceil(200 / k.estimated_royalty_per_sale_eur)} ventes/mois pour 200€</span>
  </div>
</div>

<h2 style="font-size: 16px; border-bottom: 2px solid #1a1a1a; padding-bottom: 6px;">✂️ Copier-coller dans Amazon KDP (dans l'ordre)</h2>

<p style="font-size: 13px; color: #555;">
  Ouvre <a href="https://kdp.amazon.com/fr_FR/title-setup">kdp.amazon.com</a> →
  <b>Créer un livre Kindle eBook</b>. Puis colle chaque champ ci-dessous dans son emplacement.
</p>

${copyBlock("1. Langue", k.language)}
${copyBlock("2. Titre du livre", k.title)}
${copyBlock("3. Sous-titre", k.subtitle)}
${copyBlock("4. Auteur (prénom + nom)", k.author)}
${copyBlock("5. Description Amazon (≤ 4000 caractères)", k.description_amazon, "#f0f9ff")}

<div style="margin: 14px 0;">
  <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">6. Droits de publication</div>
  <div style="padding: 8px 14px; background: #f5f5f5; border-radius: 4px; font-size: 13px;">
    Cocher : <b>« Je détiens les droits d'auteur et possède les droits de publication requis. »</b>
  </div>
</div>

<div style="margin: 14px 0;">
  <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">7. Public principal — contenu sexuel</div>
  <div style="padding: 8px 14px; background: #f5f5f5; border-radius: 4px; font-size: 13px;">
    Cocher : <b>« Non »</b> (pas de contenu sexuel)
  </div>
</div>

<div style="margin: 14px 0;">
  <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">8. Site de vente principal</div>
  <div style="padding: 8px 14px; background: #f5f5f5; border-radius: 4px; font-size: 13px;">
    Sélectionner : <b>Amazon.fr</b>
  </div>
</div>

<div style="margin: 14px 0;">
  <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">9. Rubriques (3 catégories) — copie chacune dans le champ catégorie</div>
  ${k.categories.map((c, i) => `<div style="background: #fef3c7; padding: 8px 14px; border-radius: 4px; margin: 4px 0; font-family: 'Courier New', monospace; font-size: 13px;"><b>Cat ${i + 1} :</b> ${escape(c.path)}</div>`).join("")}
</div>

<div style="margin: 14px 0;">
  <div style="font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">10. Mots-clés (7, un par champ KDP)</div>
  ${k.keywords.map((kw, i) => `<div style="display: inline-block; background: #ddd6fe; padding: 6px 12px; border-radius: 4px; margin: 3px; font-family: 'Courier New', monospace; font-size: 13px;"><b>${i + 1}.</b> ${escape(kw)}</div>`).join("")}
</div>

${copyBlock("11. Prix Kindle (€)", `${k.recommended_price_eur.toFixed(2)}`, "#ecfdf5")}

<h2 style="font-size: 16px; border-bottom: 2px solid #1a1a1a; padding-bottom: 6px; margin-top: 30px;">📊 Contexte de la niche</h2>

<table style="width: 100%; border-collapse: collapse; font-size: 13px; margin: 12px 0;">
  <tr style="background: #f9fafb;"><td style="padding: 10px;"><b>Sujet</b></td><td style="padding: 10px;">${escape(niche.topic)}</td></tr>
  <tr><td style="padding: 10px;"><b>Angle</b></td><td style="padding: 10px;">${escape(niche.angle)}</td></tr>
  <tr style="background: #f9fafb;"><td style="padding: 10px;"><b>Public cible</b></td><td style="padding: 10px;">${escape(niche.target_audience)}</td></tr>
  <tr><td style="padding: 10px;"><b>Concurrence</b></td><td style="padding: 10px;">${escape(niche.estimated_competition)}</td></tr>
  <tr style="background: #f9fafb;"><td style="padding: 10px; vertical-align: top;"><b>Pourquoi rentable</b></td><td style="padding: 10px;">${escape(niche.rationale)}</td></tr>
</table>

<h2 style="font-size: 16px; border-bottom: 2px solid #1a1a1a; padding-bottom: 6px; margin-top: 30px;">📎 Pièces jointes</h2>

<ul style="font-size: 14px;">
  <li><b>${escape(o.title)}.pdf</b> — le livre complet, prêt à uploader dans KDP (étape "Contenu de l'ebook Kindle")</li>
  <li><b>${escape(o.title)}-cover.${p.coverExt}</b> — la couverture, à uploader avec le PDF</li>
</ul>

${p.pdfUrl ? `<p><a href="${p.pdfUrl}" style="color: #1e40af;">📥 Re-télécharger le PDF</a></p>` : ""}
${p.coverUrl ? `<p><a href="${p.coverUrl}" style="color: #1e40af;">🖼️ Re-télécharger la couverture</a></p>` : ""}

<div style="margin-top: 30px; padding: 16px; background: #fef3c7; border-radius: 8px; font-size: 13px;">
  <b>⏱️ Temps estimé d'upload sur KDP :</b> 5 à 10 minutes (champs déjà préparés)<br>
  <b>🕐 Délai de mise en ligne :</b> ≤ 72h après soumission KDP<br>
  <b>🎯 Objectif 200€/mois :</b> ≈ ${Math.ceil(200 / k.estimated_royalty_per_sale_eur)} ventes/mois (soit ${Math.ceil(200 / k.estimated_royalty_per_sale_eur / 30 * 10) / 10} / jour)
</div>

<p style="margin-top: 24px; font-size: 11px; color: #888; text-align: center;">
Email automatique du pipeline KDP — Klyora Sites
</p>

</body></html>`;
}

function escape(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sanitize(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9-_. àâéèêëîïôùûç]/g, "").slice(0, 100);
}
