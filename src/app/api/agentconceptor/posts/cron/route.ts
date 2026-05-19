import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, isWithinSendingHours } from "@/lib/security";

/* ══════════════════════════════════════════
   GET|POST /api/agentconceptor/posts/cron

   Tourne chaque lundi matin (Vercel cron).
   Pour chaque abonné "Agent Contenu" actif :
   - Génère 5 posts Instagram/Facebook
   - Les envoie par email prêts-à-publier
   ══════════════════════════════════════════ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

// Saison courante pour contextualiser les posts
function getCurrentSeason(): string {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) return "printemps";
  if (month >= 6 && month <= 8) return "été";
  if (month >= 9 && month <= 11) return "automne";
  return "hiver";
}

function getCurrentMonth(): string {
  return new Date().toLocaleDateString("fr-FR", { month: "long" });
}

interface Post {
  theme: string;
  caption: string;
  hashtags: string;
  visual_idea: string;
  best_time: string;
}

// Génère 5 posts par IA
async function generatePosts(businessName: string, businessType: string, city: string, tone: string): Promise<Post[]> {
  const apiKey = process.env.OPENROUTER_API_KEY || process.env.ANTHROPIC_API_KEY || "";
  const isOR = Boolean(process.env.OPENROUTER_API_KEY);

  const season = getCurrentSeason();
  const month = getCurrentMonth();

  const systemPrompt = `Tu es un expert en marketing digital et en gestion des réseaux sociaux pour les PME françaises.
Tu crées du contenu Instagram et Facebook engageant, authentique et efficace.
RÉPONDS UNIQUEMENT EN JSON VALIDE. Pas de markdown, pas de commentaires.`;

  const userPrompt = `Génère 5 posts pour ${businessName} (${businessType}), basé à ${city}.
Saison : ${season} — Mois : ${month}
Ton souhaité : ${tone}

Retourne un JSON avec ce format exact :
[
  {
    "theme": "Titre court du thème du post",
    "caption": "Texte complet du post (3-5 phrases, naturel, engageant, avec emoji). Adapté à Instagram ET Facebook.",
    "hashtags": "#hashtag1 #hashtag2 ... (8-12 hashtags pertinents)",
    "visual_idea": "Description concrète de l'image/photo à utiliser (ce qu'on voit sur la photo)",
    "best_time": "Meilleur moment de publication (ex: Mardi 12h ou Vendredi 18h30)"
  }
]

Les 5 posts doivent couvrir des thèmes variés : promotion, coulisses, conseil, témoignage, offre spéciale.
Personnalise selon la saison ${season} et le mois de ${month}.`;

  try {
    const res = await fetch(
      isOR ? "https://openrouter.ai/api/v1/chat/completions" : "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          ...(isOR ? { "HTTP-Referer": "https://webconceptor.fr" } : {}),
        },
        body: JSON.stringify({
          model: isOR ? "anthropic/claude-haiku-4-5" : "claude-haiku-4-5",
          max_tokens: 2000,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
        signal: AbortSignal.timeout(25_000),
      }
    );

    const data = await res.json();
    const text = (data.choices?.[0]?.message?.content || data.content?.[0]?.text || "").trim();

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed.slice(0, 5);
    }
  } catch (err) {
    console.error("[posts/cron] AI error:", err);
  }

  // Fallback
  return [
    {
      theme: "Bienvenue",
      caption: `Bienvenue chez ${businessName} ! 👋 Nous sommes ravis de vous accueillir. Cette semaine, découvrez nos nouveautés et retrouvez-nous pour des moments inoubliables.`,
      hashtags: `#${businessName.replace(/\s/g, "")} #${businessType} #${city} #local #france`,
      visual_idea: "Photo de l'équipe souriante devant l'établissement",
      best_time: "Lundi 10h",
    },
  ];
}

// Construit l'email HTML avec les 5 posts
function buildPostsEmail(businessName: string, posts: Post[], weekLabel: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Vos 5 posts de la semaine — ${businessName}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,'Segoe UI',sans-serif;background:#f8f9fa;color:#1a1a1a}
.wrap{max-width:640px;margin:0 auto;padding:24px 16px}
.header{background:linear-gradient(135deg,#7c3aed,#2563eb);color:#fff;border-radius:16px;padding:28px;text-align:center;margin-bottom:20px}
.header h1{font-size:20px;font-weight:900;margin-bottom:4px}
.header p{font-size:14px;opacity:.85}
.badge{display:inline-block;background:rgba(255,255,255,.2);padding:4px 14px;border-radius:100px;font-size:12px;font-weight:600;margin-bottom:12px}
.post{background:#fff;border-radius:12px;padding:20px;margin-bottom:14px;border:1px solid #e5e7eb}
.post-num{display:inline-block;background:#7c3aed;color:#fff;font-size:11px;font-weight:700;padding:2px 10px;border-radius:100px;margin-bottom:10px}
.post-theme{font-size:16px;font-weight:700;margin-bottom:10px;color:#111}
.post-caption{font-size:14px;color:#374151;line-height:1.7;background:#f9fafb;border-radius:8px;padding:14px;margin-bottom:10px;white-space:pre-wrap}
.copy-hint{font-size:11px;color:#9ca3af;margin-bottom:10px}
.post-meta{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:8px}
.meta-item{background:#f0f4ff;border-radius:8px;padding:10px 12px}
.meta-label{font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#6b7280;font-weight:700;margin-bottom:3px}
.meta-val{font-size:12px;color:#374151;line-height:1.4}
.hashtags-block{grid-column:1/-1;background:#fdf4ff;border-radius:8px;padding:10px 12px}
.hashtags-val{font-size:12px;color:#7c3aed;word-break:break-word}
.cta{background:#1a1a2e;border-radius:12px;padding:20px;text-align:center;margin-top:20px}
.cta p{color:#9ca3af;font-size:13px;margin-bottom:12px}
.footer{text-align:center;font-size:11px;color:#9ca3af;padding-top:16px;margin-top:4px}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="badge">📱 Agent Contenu — AGENTConceptor</div>
    <h1>Vos 5 posts de la semaine</h1>
    <p>${businessName} · ${weekLabel}</p>
  </div>

  <p style="font-size:14px;color:#525252;margin-bottom:16px;text-align:center">
    5 posts prêts-à-publier, personnalisés pour votre établissement.
    Copiez-collez directement sur Instagram et Facebook.
  </p>

  ${posts.map((post, i) => `
  <div class="post">
    <div class="post-num">Post ${i + 1}</div>
    <div class="post-theme">${post.theme}</div>
    <div class="post-caption">${post.caption}</div>
    <div class="copy-hint">📋 Copiez ce texte directement sur Instagram / Facebook / LinkedIn</div>
    <div class="post-meta">
      <div class="meta-item">
        <div class="meta-label">🖼️ Idée visuelle</div>
        <div class="meta-val">${post.visual_idea}</div>
      </div>
      <div class="meta-item">
        <div class="meta-label">⏰ Meilleur moment</div>
        <div class="meta-val">${post.best_time}</div>
      </div>
      <div class="hashtags-block">
        <div class="meta-label">🏷️ Hashtags</div>
        <div class="hashtags-val">${post.hashtags}</div>
      </div>
    </div>
  </div>`).join("")}

  <div class="cta">
    <p>Besoin de modifier un post ou des questions ?<br>Répondez simplement à cet email.</p>
    <p style="color:#4b5563;font-size:12px">
      💡 Conseil : publiez 3-4 posts/semaine pour un engagement maximal.
      Espacez les publications de 1-2 jours.
    </p>
  </div>

  <div class="footer">
    <p>AGENTConceptor · Agent Contenu Réseaux Sociaux</p>
    <p style="margin-top:2px">contact@webconceptor.fr · <a href="https://webconceptor.fr" style="color:#7c3aed">webconceptor.fr</a></p>
  </div>
</div>
</body>
</html>`;
}

async function handler(req: NextRequest) {
  const adminKey   = req.headers.get("x-admin-key")   || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  const adminOK    = safeCompare(adminKey,   process.env.ADMIN_SECRET_KEY);
  const cronOK     = safeCompare(cronSecret, process.env.CRON_SECRET);

  if (!adminOK && !cronOK) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = getSupabase();

  const { data: subscriptions, error } = await supabase
    .from("contenu_subscriptions")
    .select("*")
    .eq("status", "active")
    .limit(30);

  if (error || !subscriptions || subscriptions.length === 0) {
    return NextResponse.json({ success: true, processed: 0, message: "Aucun abonnement contenu actif" });
  }

  const weekLabel = new Date().toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const brevoKey  = process.env.BREVO_API_KEY || "";

  let sent = 0;
  let errors = 0;

  for (const sub of subscriptions) {
    try {
      const posts = await generatePosts(sub.business_name, sub.business_type, sub.city || "France", sub.tone || "professionnel");
      const emailHtml = buildPostsEmail(sub.business_name, posts, weekLabel);

      if (brevoKey && sub.owner_email) {
        const res = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: { "api-key": brevoKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            sender: { name: "Tom — AGENTConceptor", email: "contact@webconceptor.fr" },
            to: [{ email: sub.owner_email, name: sub.owner_name || sub.business_name }],
            subject: `📱 Vos 5 posts de la semaine — ${sub.business_name}`,
            htmlContent: emailHtml,
          }),
          signal: AbortSignal.timeout(10_000),
        });

        if (res.ok) {
          sent++;
          await supabase
            .from("contenu_subscriptions")
            .update({ posts_sent: (sub.posts_sent || 0) + posts.length, last_send_at: new Date().toISOString() })
            .eq("id", sub.id);
        } else {
          errors++;
        }
      }
    } catch (err) {
      console.error(`[posts/cron] error for sub ${sub.id}:`, err);
      errors++;
    }

    // Petite pause entre chaque envoi
    await new Promise((r) => setTimeout(r, 500));
  }

  // Notif Telegram
  if (sent > 0) {
    const tgToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId  = process.env.TELEGRAM_CHAT_ID;
    if (tgToken && chatId) {
      fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `📱 <b>Agent Contenu — Posts hebdomadaires</b>\n\n<b>Envoyés :</b> ${sent}\n<b>Erreurs :</b> ${errors}`,
          parse_mode: "HTML",
          disable_notification: true,
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, processed: subscriptions.length, sent, errors });
}

export async function GET(req: NextRequest) { return handler(req); }
export async function POST(req: NextRequest) { return handler(req); }
