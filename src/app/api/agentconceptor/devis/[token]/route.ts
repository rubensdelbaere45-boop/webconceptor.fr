import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════
   POST /api/agentconceptor/devis/[token]

   Reçoit la demande de devis du client final,
   génère un devis professionnel par IA,
   l'envoie au client ET à l'entreprise.
   ══════════════════════════════════════════ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

const str = (v: unknown, max = 500): string => String(v ?? "").slice(0, max).trim();

// Génère un numéro de devis unique
function generateDevisNumber(): string {
  const now = new Date();
  const yy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const rand = Math.floor(Math.random() * 9000) + 1000;
  return `DEV-${yy}${mm}-${rand}`;
}

// Appel IA pour générer le contenu du devis
async function generateDevisContent(params: {
  businessName: string;
  businessType: string;
  clientName: string;
  projectType: string;
  projectDescription: string;
  projectAddress: string;
  budgetRange: string;
  desiredDate: string;
}): Promise<{ intro: string; items: Array<{ label: string; detail: string; amount: string }>; total: string; validity: string; conditions: string }> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  const isOR = Boolean(process.env.OPENROUTER_API_KEY);

  const systemPrompt = `Tu es un expert en rédaction de devis professionnels pour les PME françaises (type ${params.businessType}).
Tu génères des devis réalistes, détaillés et professionnels.
Réponds UNIQUEMENT en JSON valide, sans markdown, sans commentaires.
Format strict :
{
  "intro": "Phrase d'introduction personnalisée (2 lignes max)",
  "items": [
    { "label": "Intitulé de la prestation", "detail": "Description courte", "amount": "XXX€ HT" },
    ...
  ],
  "total": "Total estimé : XXX€ HT (XXX€ TTC avec TVA 20%)",
  "validity": "Ce devis est valable 30 jours",
  "conditions": "Acompte de 30% à la commande. Solde à la livraison."
}`;

  const userPrompt = `Génère un devis professionnel pour ${params.businessName}.

Client : ${params.clientName}
Projet : ${params.projectType || "Prestation de service"}
Description : ${params.projectDescription}
Adresse : ${params.projectAddress || "France"}
Budget indicatif : ${params.budgetRange || "À définir"}
Date souhaitée : ${params.desiredDate || "Dès que possible"}

Génère entre 2 et 5 lignes de devis réalistes et détaillées. Sois précis sur les montants.`;

  try {
    const res = await fetch(
      isOR ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...(isOR ? { "HTTP-Referer": "https://klyora.fr" } : {}),
        },
        body: JSON.stringify({
          model: isOR ? "anthropic/claude-haiku-4-5" : "claude-haiku-4-5",
          max_tokens: 800,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
        signal: AbortSignal.timeout(20_000),
      }
    );

    const data = await res.json();
    const text = (data.choices?.[0]?.message?.content || data.content?.[0]?.text || "").trim();

    // Parser le JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (err) {
    console.error("[devis] AI error:", err);
  }

  // Fallback si l'IA échoue
  return {
    intro: `Suite à votre demande, nous avons le plaisir de vous soumettre notre proposition pour votre projet.`,
    items: [
      { label: "Prestation principale", detail: params.projectDescription.slice(0, 100), amount: "À définir selon visite technique" },
      { label: "Déplacement et main d'œuvre", detail: "Temps estimé selon devis", amount: "Sur devis" },
    ],
    total: "Total : Sur devis — nous vous contacterons rapidement pour affiner l'estimation",
    validity: "Ce devis est valable 30 jours à compter de sa date d'émission",
    conditions: "Acompte de 30% à la commande. Solde à la livraison.",
  };
}

// Construit le HTML du devis
function buildDevisHTML(params: {
  devisNumber: string;
  businessName: string;
  businessType: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  projectType: string;
  projectDescription: string;
  projectAddress: string;
  budgetRange: string;
  desiredDate: string;
  intro: string;
  items: Array<{ label: string; detail: string; amount: string }>;
  total: string;
  validity: string;
  conditions: string;
}): string {
  const today = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Devis ${params.devisNumber}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,'Segoe UI',Arial,sans-serif;color:#1a1a1a;background:#fff;line-height:1.5}
.page{max-width:700px;margin:0 auto;padding:40px 32px}
.header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;padding-bottom:24px;border-bottom:2px solid #0066ff}
.logo{font-size:22px;font-weight:900;color:#0066ff}
.logo span{color:#7c3aed}
.devis-num{text-align:right}
.devis-num h2{font-size:24px;font-weight:900;color:#1a1a1a}
.devis-num p{font-size:12px;color:#6b7280;margin-top:2px}
.parties{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px}
.partie h3{font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;font-weight:700;margin-bottom:8px}
.partie p{font-size:14px;color:#1a1a1a;margin-bottom:2px}
.projet-box{background:#f8f9ff;border-left:3px solid #0066ff;padding:16px 20px;border-radius:8px;margin-bottom:28px}
.projet-box h3{font-size:12px;text-transform:uppercase;letter-spacing:.08em;color:#0066ff;font-weight:700;margin-bottom:8px}
.projet-box p{font-size:14px;color:#374151}
.intro{font-size:14px;color:#374151;margin-bottom:24px;line-height:1.7}
table{width:100%;border-collapse:collapse;margin-bottom:24px}
th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;font-weight:700;padding:10px 16px;text-align:left;background:#f9fafb;border-bottom:1px solid #e5e7eb}
td{padding:14px 16px;border-bottom:1px solid #f3f4f6;font-size:14px}
td:first-child{font-weight:600}
td:last-child{text-align:right;font-weight:700;white-space:nowrap;color:#1a1a1a}
td .detail{font-size:12px;color:#6b7280;font-weight:400;display:block;margin-top:2px}
.total-row{background:#f8f9ff}
.total-row td{font-size:15px;font-weight:900;color:#0066ff;border-bottom:none;padding:18px 16px}
.footer-info{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:28px}
.info-box{background:#f9fafb;border-radius:8px;padding:14px 16px}
.info-box h4{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#6b7280;font-weight:700;margin-bottom:6px}
.info-box p{font-size:13px;color:#374151}
.footer{border-top:1px solid #e5e7eb;padding-top:20px;text-align:center;font-size:12px;color:#9ca3af}
.stamp{display:inline-block;border:2px solid #22c55e;color:#22c55e;padding:4px 16px;border-radius:100px;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:8px}
@media print{body{background:#fff}.page{padding:20px}}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div>
      <div class="logo">AGENT<span>Conceptor</span></div>
      <p style="font-size:12px;color:#6b7280;margin-top:4px">Agent Devis IA — klyora.fr</p>
    </div>
    <div class="devis-num">
      <h2>${params.devisNumber}</h2>
      <p>Date : ${today}</p>
      <div class="stamp" style="display:block;margin-top:8px">Devis IA</div>
    </div>
  </div>

  <div class="parties">
    <div class="partie">
      <h3>Prestataire</h3>
      <p style="font-weight:700;font-size:16px">${params.businessName}</p>
      <p style="color:#6b7280;font-size:13px">Géré par AGENTConceptor</p>
    </div>
    <div class="partie">
      <h3>Client</h3>
      <p style="font-weight:700;font-size:16px">${params.clientName}</p>
      <p style="color:#6b7280;font-size:13px">${params.clientEmail}</p>
      ${params.clientPhone ? `<p style="color:#6b7280;font-size:13px">${params.clientPhone}</p>` : ""}
      ${params.projectAddress ? `<p style="color:#6b7280;font-size:13px">${params.projectAddress}</p>` : ""}
    </div>
  </div>

  <div class="projet-box">
    <h3>📋 Projet — ${params.projectType || "Demande de devis"}</h3>
    <p style="margin-top:4px">${params.projectDescription}</p>
    ${params.desiredDate ? `<p style="margin-top:8px;font-size:13px;color:#6b7280">Date souhaitée : <strong>${params.desiredDate}</strong></p>` : ""}
    ${params.budgetRange ? `<p style="font-size:13px;color:#6b7280">Budget indicatif : <strong>${params.budgetRange}</strong></p>` : ""}
  </div>

  <p class="intro">${params.intro}</p>

  <table>
    <thead>
      <tr>
        <th style="width:50%">Prestation</th>
        <th style="width:30%">Détail</th>
        <th style="width:20%">Montant</th>
      </tr>
    </thead>
    <tbody>
      ${params.items.map((item) => `
      <tr>
        <td>${item.label}</td>
        <td style="color:#6b7280;font-size:13px">${item.detail}</td>
        <td>${item.amount}</td>
      </tr>`).join("")}
      <tr class="total-row">
        <td colspan="2"><strong>${params.total.split(":")[0]}</strong></td>
        <td>${params.total.split(":")[1]?.trim() || params.total}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer-info">
    <div class="info-box">
      <h4>⏱️ Validité</h4>
      <p>${params.validity}</p>
    </div>
    <div class="info-box">
      <h4>💳 Conditions de paiement</h4>
      <p>${params.conditions}</p>
    </div>
  </div>

  <div class="footer">
    <p style="margin-bottom:4px">Devis généré automatiquement par AGENTConceptor · Agent Devis IA</p>
    <p>Ce document a valeur contractuelle une fois signé par les deux parties · <a href="https://klyora.fr" style="color:#0066ff">klyora.fr</a></p>
  </div>
</div>
</body>
</html>`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || !/^[a-f0-9]{32}$/i.test(token)) {
    return NextResponse.json({ error: "Token invalide" }, { status: 400 });
  }

  let body: Record<string, string>;
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Body invalide" }, { status: 400 }); }

  const clientName    = str(body.client_name, 200);
  const clientEmail   = str(body.client_email, 200).toLowerCase();
  const clientPhone   = str(body.client_phone, 30);
  const projectType   = str(body.project_type, 100);
  const projectDesc   = str(body.project_description, 2000);
  const projectAddr   = str(body.project_address, 300);
  const budgetRange   = str(body.budget_range, 100);
  const desiredDate   = str(body.desired_date, 100);

  if (!clientName || !clientEmail || !projectDesc) {
    return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(clientEmail)) {
    return NextResponse.json({ error: "Email invalide" }, { status: 400 });
  }

  const supabase = getSupabase();

  // Vérifier l'abonnement
  const { data: sub } = await supabase
    .from("agentconceptor_subscriptions")
    .select("id, business_name, business_type, owner_email, owner_name, has_devis, status")
    .eq("devis_token", token)
    .single();

  if (!sub || !sub.has_devis || sub.status !== "active") {
    return NextResponse.json({ error: "Service non disponible" }, { status: 404 });
  }

  // Générer le contenu du devis par IA
  const aiContent = await generateDevisContent({
    businessName: sub.business_name,
    businessType: sub.business_type || "general",
    clientName,
    projectType,
    projectDescription: projectDesc,
    projectAddress: projectAddr,
    budgetRange,
    desiredDate,
  });

  const devisNumber = generateDevisNumber();

  const devisHtml = buildDevisHTML({
    devisNumber,
    businessName: sub.business_name,
    businessType: sub.business_type || "general",
    clientName,
    clientEmail,
    clientPhone,
    projectType,
    projectDescription: projectDesc,
    projectAddress: projectAddr,
    budgetRange,
    desiredDate,
    ...aiContent,
  });

  // Sauvegarder en base
  await supabase.from("devis_requests").insert({
    subscription_id:    sub.id,
    devis_token:        token,
    client_name:        clientName,
    client_email:       clientEmail,
    client_phone:       clientPhone,
    project_type:       projectType,
    project_description: projectDesc,
    project_address:    projectAddr,
    budget_range:       budgetRange,
    desired_date:       desiredDate,
    devis_html:         devisHtml,
    devis_number:       devisNumber,
    devis_amount:       aiContent.total,
    status:             "generated",
    sent_at:            new Date().toISOString(),
  });

  const brevoKey = process.env.BREVO_API_KEY;

  // Email au CLIENT avec le devis
  if (brevoKey) {
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevoKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: sub.business_name, email: "contact@klyora.fr" },
        to: [{ email: clientEmail, name: clientName }],
        subject: `Votre devis ${devisNumber} — ${sub.business_name}`,
        htmlContent: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
<p style="font-size:15px">Bonjour ${clientName.split(" ")[0]},</p>
<p style="font-size:15px;margin:16px 0">Merci pour votre demande ! Votre devis <strong>${devisNumber}</strong> de <strong>${sub.business_name}</strong> est prêt.</p>
<p style="font-size:14px;color:#525252;margin-bottom:20px">Vous trouverez votre devis complet en pièce jointe ci-dessous.</p>
<p style="font-size:14px;color:#525252">Des questions ? Contactez-nous directement en répondant à cet email.</p>
</div>`,
        attachment: [{
          content: Buffer.from(devisHtml).toString("base64"),
          name: `devis-${devisNumber.toLowerCase().replace(/[^a-z0-9]/g, "-")}.html`,
        }],
      }),
    }).catch(() => {});

    // Email de notification au BUSINESS
    await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevoKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "AGENTConceptor", email: "contact@klyora.fr" },
        to: [{ email: sub.owner_email, name: sub.owner_name || sub.business_name }],
        subject: `📝 Nouveau devis généré — ${clientName} (${devisNumber})`,
        htmlContent: `<div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111">
<p style="font-size:15px">Votre Agent Devis vient de générer un devis !</p>
<div style="background:#f0fdf4;border-left:3px solid #22c55e;padding:16px 20px;border-radius:8px;margin:20px 0">
  <p style="font-weight:700;margin-bottom:8px">📋 Récapitulatif</p>
  <p style="font-size:14px;color:#374151">Client : <strong>${clientName}</strong> (${clientEmail})</p>
  <p style="font-size:14px;color:#374151">Projet : ${projectType || projectDesc.slice(0, 80)}</p>
  <p style="font-size:14px;color:#374151">Estimation : ${aiContent.total}</p>
  <p style="font-size:14px;color:#374151">Numéro devis : ${devisNumber}</p>
</div>
<p style="font-size:14px;color:#525252">Le devis a été envoyé automatiquement à ${clientEmail}. Vous en avez une copie en pièce jointe.</p>
</div>`,
        attachment: [{
          content: Buffer.from(devisHtml).toString("base64"),
          name: `devis-${devisNumber.toLowerCase().replace(/[^a-z0-9]/g, "-")}.html`,
        }],
      }),
    }).catch(() => {});
  }

  return NextResponse.json({ success: true, devis_number: devisNumber });
}
