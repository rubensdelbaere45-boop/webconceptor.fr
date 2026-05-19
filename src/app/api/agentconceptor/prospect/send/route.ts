import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/agentconceptor/prospect/send

   Prospection froide AGENTConceptor.
   Cible les entreprises déjà dans la base
   (prospects table) et leur pitch les agents IA
   les plus pertinents pour leur métier.

   Stratégie de ciblage :
   - Artisans / Garages      → Agent Devis IA
   - Restaurants / Beauté    → Agent Contenu + Réputation
   - Tous secteurs           → Agent Chatbot + Pack

   Body : { batch_size?: number, dry_run?: boolean }
   Auth : x-admin-key ou x-cron-secret
   ══════════════════════════════════════════ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

// ── Quel(s) agent(s) pitcher selon le métier ──────────────────────────────────
interface AgentPitch {
  headline: string;
  subheadline: string;
  agents: Array<{
    id: string;
    name: string;
    price: string;
    emoji: string;
    benefit: string;
  }>;
  cta_label: string;
}

function getAgentPitch(businessType?: string): AgentPitch {
  const bt = (businessType || "restaurant").toLowerCase();

  // Artisans & services techniques → Agent Devis en priorité
  if (["plombier", "electricien", "menuisier", "peintre", "garage", "maçon", "couvreur", "serrurier"].includes(bt)) {
    return {
      headline: "Générez des devis professionnels en 30 secondes",
      subheadline: "Vos clients remplissent un formulaire, l'IA génère le devis instantanément. Vous recevez le PDF par email.",
      agents: [
        { id: "devis", name: "Agent Devis IA", price: "149€/mois", emoji: "📋", benefit: "Devis auto envoyé au client en moins d'une minute" },
        { id: "chatbot", name: "Agent Chatbot IA", price: "79€/mois", emoji: "💬", benefit: "Répond aux questions 24h/24 à votre place" },
        { id: "reputation", name: "Agent Réputation", price: "99€/mois", emoji: "⭐", benefit: "Répond à vos avis Google automatiquement" },
      ],
      cta_label: "Voir l'Agent Devis IA",
    };
  }

  // Restaurants, brasseries, cafés, boulangeries → Contenu + Réputation
  if (["restaurant", "brasserie", "bistrot", "gastronomique", "pizzeria", "creperie", "boulangerie", "patisserie", "chocolatier", "cafe", "salon_de_the", "glacier", "bar", "food_truck", "traiteur"].includes(bt)) {
    return {
      headline: "Vos réseaux sociaux et avis Google, pilotés par l'IA",
      subheadline: "Chaque lundi : 5 posts Instagram/Facebook prêts à publier. Chaque avis Google reçoit une réponse professionnelle automatique.",
      agents: [
        { id: "contenu", name: "Agent Contenu Réseaux", price: "99€/mois", emoji: "📱", benefit: "5 posts personnalisés envoyés chaque lundi" },
        { id: "reputation", name: "Agent Réputation Google", price: "99€/mois", emoji: "⭐", benefit: "Réponses automatiques à tous vos avis Google" },
        { id: "chatbot", name: "Agent Chatbot IA", price: "79€/mois", emoji: "💬", benefit: "Répond aux questions de vos clients 24h/24" },
      ],
      cta_label: "Voir l'Agent Contenu",
    };
  }

  // Beauté / Bien-être / Sport → Chatbot + Réputation
  if (["coiffeur", "spa", "institut", "fitness", "salle_sport"].includes(bt)) {
    return {
      headline: "Un assistant IA qui gère vos rendez-vous et vos avis",
      subheadline: "Répondez aux questions de vos clients à n'importe quelle heure, et soignez votre réputation Google automatiquement.",
      agents: [
        { id: "chatbot", name: "Agent Chatbot IA", price: "79€/mois", emoji: "💬", benefit: "Disponible 24h/24 pour répondre à vos clients" },
        { id: "reputation", name: "Agent Réputation Google", price: "99€/mois", emoji: "⭐", benefit: "Réponses professionnelles à tous vos avis" },
        { id: "contenu", name: "Agent Contenu Réseaux", price: "99€/mois", emoji: "📱", benefit: "Posts Instagram personnalisés chaque semaine" },
      ],
      cta_label: "Voir l'Agent Chatbot",
    };
  }

  // Santé / Para-médical → Chatbot
  if (["dentiste", "osteo", "kine", "medecin"].includes(bt)) {
    return {
      headline: "Un assistant IA qui répond à vos patients 24h/24",
      subheadline: "Horaires, disponibilités, informations pratiques — l'IA répond instantanément à la place de votre secrétariat.",
      agents: [
        { id: "chatbot", name: "Agent Chatbot IA", price: "79€/mois", emoji: "💬", benefit: "Réduit les appels entrants de 40%" },
        { id: "reputation", name: "Agent Réputation Google", price: "99€/mois", emoji: "⭐", benefit: "Valorise les avis de vos patients" },
      ],
      cta_label: "Voir l'Agent Chatbot",
    };
  }

  // Auto-école, fleuriste, épicerie, autres → Chatbot + Pack
  return {
    headline: "Gagnez 10h par semaine avec vos agents IA",
    subheadline: "Réponses automatiques, devis en 30 secondes, posts réseaux sociaux, avis Google gérés — tout en automatique.",
    agents: [
      { id: "chatbot", name: "Agent Chatbot IA", price: "79€/mois", emoji: "💬", benefit: "Répond à vos clients 24h/24" },
      { id: "reputation", name: "Agent Réputation Google", price: "99€/mois", emoji: "⭐", benefit: "Gère vos avis Google automatiquement" },
      { id: "contenu", name: "Agent Contenu Réseaux", price: "99€/mois", emoji: "📱", benefit: "5 posts prêts-à-publier chaque semaine" },
    ],
    cta_label: "Découvrir AGENTConceptor",
  };
}

// ── HTML email AGENTConceptor ─────────────────────────────────────────────────
function buildAgentEmail(params: {
  businessName: string;
  businessType: string;
  city: string;
  googleRating?: number;
  reviewsCount?: number;
  pitch: AgentPitch;
  unsubscribeUrl: string;
}): string {
  const { businessName, city, googleRating, reviewsCount, pitch, unsubscribeUrl } = params;

  const ratingBadge = googleRating && googleRating >= 3.5
    ? `<span style="display:inline-block;background:#fef3c7;color:#92400e;border-radius:20px;padding:3px 12px;font-size:12px;font-weight:700;margin-left:8px">⭐ ${googleRating}/5 (${reviewsCount ?? "?"} avis)</span>`
    : "";

  const agentCards = pitch.agents.map(agent => `
    <div style="display:flex;align-items:flex-start;gap:14px;padding:14px 16px;background:#f8f7ff;border-radius:10px;margin-bottom:10px;border-left:3px solid #7c3aed">
      <div style="font-size:28px;line-height:1;flex-shrink:0">${agent.emoji}</div>
      <div style="flex:1">
        <div style="font-size:14px;font-weight:700;color:#111;margin-bottom:2px">${agent.name} <span style="font-weight:400;color:#7c3aed">— ${agent.price}</span></div>
        <div style="font-size:13px;color:#525252;line-height:1.5">${agent.benefit}</div>
      </div>
    </div>`).join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>AGENTConceptor — ${businessName}</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,'Segoe UI',sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px 16px">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#1a0533 0%,#2d1b69 50%,#1e1b4b 100%);border-radius:16px;padding:32px 28px;text-align:center;margin-bottom:20px">
    <div style="display:inline-block;background:rgba(124,58,237,0.3);border:1px solid rgba(124,58,237,0.5);border-radius:20px;padding:5px 16px;font-size:11px;font-weight:700;color:#c4b5fd;letter-spacing:.08em;margin-bottom:16px;text-transform:uppercase">
      🤖 AGENTConceptor — Agents IA pour PME
    </div>
    <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0 0 8px;line-height:1.3">
      ${pitch.headline}
    </h1>
    <p style="color:#c4b5fd;font-size:14px;margin:0;line-height:1.6">
      ${pitch.subheadline}
    </p>
  </div>

  <!-- Intro personnalisée -->
  <div style="background:#fff;border-radius:12px;padding:22px 24px;margin-bottom:16px;border:1px solid #e5e7eb">
    <p style="font-size:15px;color:#1a1a1a;line-height:1.7;margin:0">
      Bonjour,
    </p>
    <p style="font-size:15px;color:#1a1a1a;line-height:1.7;margin:12px 0 0">
      Je suis Tom de <strong>WebConceptor</strong>. J'ai vu votre établissement <strong>${businessName}</strong>${city ? ` à ${city}` : ""}${ratingBadge} et je voulais vous présenter quelque chose qui peut vraiment faire la différence.
    </p>
    <p style="font-size:15px;color:#1a1a1a;line-height:1.7;margin:12px 0 0">
      Nous avons lancé <strong>AGENTConceptor</strong> — une suite d'agents IA autonomes qui travaillent pour votre commerce 24h/24, sans que vous ayez rien à faire.
    </p>
  </div>

  <!-- Agents recommandés -->
  <div style="background:#fff;border-radius:12px;padding:22px 24px;margin-bottom:16px;border:1px solid #e5e7eb">
    <h2 style="font-size:15px;font-weight:800;color:#111;margin:0 0 14px;text-transform:uppercase;letter-spacing:.04em">
      🎯 Agents recommandés pour vous
    </h2>
    ${agentCards}
  </div>

  <!-- Pack Complet -->
  <div style="background:linear-gradient(135deg,#7c3aed,#2563eb);border-radius:12px;padding:20px 24px;margin-bottom:16px;text-align:center">
    <div style="font-size:12px;font-weight:700;color:#e0e7ff;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">🔥 Offre spéciale</div>
    <div style="font-size:18px;font-weight:900;color:#fff;margin-bottom:4px">Pack Complet — 5 agents IA</div>
    <div style="font-size:14px;color:#c4b5fd;margin-bottom:12px">Chatbot + Réputation + Devis + Contenu + Fidélisation</div>
    <div style="display:inline-block">
      <span style="font-size:22px;font-weight:900;color:#fff">349€/mois</span>
      <span style="font-size:13px;color:#a5b4fc;margin-left:8px;text-decoration:line-through">505€ à l'unité</span>
    </div>
    <div style="font-size:12px;color:#c4b5fd;margin-top:4px">Économisez 156€/mois · Résiliation à tout moment</div>
  </div>

  <!-- CTA -->
  <div style="text-align:center;margin-bottom:20px">
    <a href="https://webconceptor.fr/agentconceptor" style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;text-decoration:none;font-size:16px;font-weight:800;padding:16px 40px;border-radius:12px;letter-spacing:.02em">
      ${pitch.cta_label} →
    </a>
    <p style="font-size:12px;color:#9ca3af;margin-top:10px">Sans engagement · Livraison immédiate après paiement</p>
  </div>

  <!-- Preuve sociale -->
  <div style="background:#fff;border-radius:12px;padding:18px 24px;margin-bottom:16px;border:1px solid #e5e7eb">
    <div style="display:flex;gap:16px;align-items:center">
      <div style="text-align:center;flex:1;border-right:1px solid #f3f4f6;padding-right:16px">
        <div style="font-size:22px;font-weight:900;color:#7c3aed">100%</div>
        <div style="font-size:11px;color:#6b7280;margin-top:2px">Automatique</div>
      </div>
      <div style="text-align:center;flex:1;border-right:1px solid #f3f4f6;padding-right:16px">
        <div style="font-size:22px;font-weight:900;color:#7c3aed">24/7</div>
        <div style="font-size:11px;color:#6b7280;margin-top:2px">Disponible</div>
      </div>
      <div style="text-align:center;flex:1">
        <div style="font-size:22px;font-weight:900;color:#7c3aed">0h</div>
        <div style="font-size:11px;color:#6b7280;margin-top:2px">De votre temps</div>
      </div>
    </div>
  </div>

  <!-- Footer -->
  <div style="text-align:center;font-size:11px;color:#9ca3af;padding-top:8px">
    <p style="margin:0">AGENTConceptor by <strong>WebConceptor</strong> · contact@webconceptor.fr</p>
    <p style="margin:6px 0 0">
      <a href="${unsubscribeUrl}" style="color:#9ca3af;text-decoration:underline">Se désinscrire</a>
    </p>
  </div>

</div>
</body>
</html>`;
}

// ── Handler principal ─────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const adminKey   = req.headers.get("x-admin-key")   || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const adminOK    = safeCompare(adminKey,   process.env.ADMIN_SECRET_KEY);
  const cronOK     = safeCompare(cronSecret, process.env.CRON_SECRET);

  if (!adminOK && !cronOK) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const batchSize = Math.min(20, Math.max(1, Number(body.batch_size) || 8));
  const dryRun    = Boolean(body.dry_run);

  const supabase = getSupabase();
  const brevoKey = process.env.BREVO_API_KEY || "";
  const baseUrl  = process.env.NEXT_PUBLIC_APP_URL || "https://webconceptor.fr";

  // ── Sélection des prospects à cibler ──
  // Priorité : ceux avec un site (site_quality good/average) car ils n'ont pas besoin de WebConceptor
  // et ceux avec des avis Google (bons candidats pour Agent Réputation)
  // Exclure : déjà reçu un email AGENTConceptor
  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, name, email, city, business_type, google_rating, google_reviews_count, site_quality, slug")
    .not("email", "is", null)
    .is("agentconceptor_sent_at", null)
    .in("site_quality", ["good", "average", "poor"]) // préférer ceux avec un site
    .order("google_reviews_count", { ascending: false }) // plus d'avis = plus actifs
    .limit(batchSize * 3); // fetch plus pour filtrer

  if (error || !prospects || prospects.length === 0) {
    // Fallback : chercher TOUS les prospects sans email AC, même sans site
    const { data: fallbackProspects } = await supabase
      .from("prospects")
      .select("id, name, email, city, business_type, google_rating, google_reviews_count, site_quality, slug")
      .not("email", "is", null)
      .is("agentconceptor_sent_at", null)
      .order("created_at", { ascending: false })
      .limit(batchSize);

    if (!fallbackProspects || fallbackProspects.length === 0) {
      return NextResponse.json({ success: true, sent: 0, processed: 0, message: "Aucun prospect disponible pour AGENTConceptor" });
    }
    prospects?.push(...(fallbackProspects || []));
  }

  // Déduplique et prend batchSize
  const uniqueProspects = (prospects || [])
    .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
    .slice(0, batchSize);

  let sent = 0;
  let errors = 0;
  const results: Array<{ id: string; name: string; status: string; error?: string }> = [];

  for (const prospect of uniqueProspects) {
    if (!prospect.email) continue;

    const pitch = getAgentPitch(prospect.business_type);
    const unsubUrl = `${baseUrl}/api/prospect/unsubscribe?email=${encodeURIComponent(prospect.email)}`;

    const htmlContent = buildAgentEmail({
      businessName:  prospect.name || "votre établissement",
      businessType:  prospect.business_type || "commerce",
      city:          prospect.city || "",
      googleRating:  prospect.google_rating,
      reviewsCount:  prospect.google_reviews_count,
      pitch,
      unsubscribeUrl: unsubUrl,
    });

    const subject = getSubjectLine(prospect.business_type, prospect.name);

    if (dryRun) {
      results.push({ id: prospect.id, name: prospect.name, status: "dry_run" });
      continue;
    }

    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender: { name: "Tom — AGENTConceptor", email: "contact@webconceptor.fr" },
          to: [{ email: prospect.email, name: prospect.name || "" }],
          subject,
          htmlContent,
          headers: {
            "List-Unsubscribe": `<${unsubUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            "X-Campaign": "agentconceptor-cold",
          },
        }),
        signal: AbortSignal.timeout(10_000),
      });

      if (res.ok) {
        sent++;
        // Marquer comme envoyé
        await supabase
          .from("prospects")
          .update({ agentconceptor_sent_at: new Date().toISOString() })
          .eq("id", prospect.id);
        results.push({ id: prospect.id, name: prospect.name, status: "sent" });
      } else {
        const errBody = await res.text().catch(() => "");
        errors++;
        results.push({ id: prospect.id, name: prospect.name, status: "error", error: errBody.slice(0, 200) });
      }
    } catch (err) {
      errors++;
      results.push({ id: prospect.id, name: prospect.name, status: "error", error: String(err).slice(0, 200) });
    }

    // Pause pour ne pas saturer Brevo
    await new Promise(r => setTimeout(r, 300));
  }

  // Notif Telegram
  if (sent > 0 && !dryRun) {
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId  = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && chatId) {
      fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `🤖 <b>AGENTConceptor — Prospection</b>\n\n<b>Envoyés :</b> ${sent}\n<b>Erreurs :</b> ${errors}`,
          parse_mode: "HTML",
          disable_notification: true,
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, processed: uniqueProspects.length, sent, errors, dry_run: dryRun, results });
}

export async function GET(req: NextRequest) {
  return POST(req);
}

// ── Lignes d'objet personnalisées ─────────────────────────────────────────────
function getSubjectLine(businessType?: string, businessName?: string): string {
  const bt = (businessType || "").toLowerCase();
  const name = businessName || "votre établissement";

  const subjects: Record<string, string[]> = {
    plombier:    ["Un agent IA qui génère vos devis automatiquement", "Fini les devis manuels — essayez l'Agent Devis IA", "Gagnez 5h/semaine avec l'Agent Devis pour artisans"],
    electricien: ["Un agent IA qui génère vos devis automatiquement", "Fini les devis manuels — essayez l'Agent Devis IA", "Automatisez vos devis en 30 secondes chrono"],
    garage:      ["Un agent IA qui répond à vos clients 24h/24", "Automatisez vos devis avec l'Agent IA Garage", "Plus aucun client sans réponse — Agent IA"],
    restaurant:  [`${name} — 5 posts Instagram prêts chaque lundi`, "Vos avis Google répondus automatiquement", "L'IA qui gère vos réseaux et votre réputation Google"],
    boulangerie: ["5 posts Instagram prêts chaque lundi pour votre boulangerie", "L'IA qui publie sur vos réseaux à votre place", "Automatisez votre présence sur les réseaux sociaux"],
    coiffeur:    ["Un chatbot IA pour répondre à vos clients 24h/24", "Vos avis Google soignés automatiquement", "Plus d'appels manqués avec l'Agent Chatbot"],
    coiffeuse:   ["Un chatbot IA pour répondre à vos clientes 24h/24", "Automatisez vos réponses Google et Instagram"],
    spa:         ["Un assistant IA pour votre spa — disponible 24h/24", "L'IA qui gère votre réputation et vos questions"],
    dentiste:    ["Un assistant IA pour répondre à vos patients 24h/24", "Réduisez vos appels entrants avec l'Agent Chatbot"],
  };

  const pool = subjects[bt] || [
    `${name} — découvrez AGENTConceptor`,
    "Gagnez 10h/semaine avec vos agents IA",
    "L'IA autonome qui travaille pour votre commerce",
  ];

  // Rotation déterministe basée sur le nom du business
  const hash = (businessName || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return pool[hash % pool.length];
}
