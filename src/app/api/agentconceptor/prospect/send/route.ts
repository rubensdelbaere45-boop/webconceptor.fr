/* ══════════════════════════════════════════
   POST /api/agentconceptor/prospect/send

   Prospection froide Klyora Director (ex-AGENTConceptor).

   v2 — 09/06/2026:
   - Rebrand AGENTConceptor → Klyora Director (sender, branding, URLs)
   - CTA → https://klyora.fr/director (au lieu de /agentconceptor)
   - Copy 100% personnalisé via IA Kimi K2 (gratuit OpenRouter)
   - Analyse des failles concrètes du prospect (note Google, nb avis, métier)
   - Ton accompagnant, pas commercial
   - Email court : 4-5 paragraphes max, pas d'images, pas de gros blocs

   Body : { batch_size?: number, dry_run?: boolean }
   Auth : x-admin-key ou x-cron-secret
   ══════════════════════════════════════════ */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { randomBytes } from "crypto";

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

interface Prospect {
  id: string;
  name: string;
  email: string | null;
  city: string | null;
  business_type: string | null;
  google_rating: number | null;
  google_reviews_count: number | null;
  site_quality: string | null;
  slug: string | null;
}

interface DetectedWeakness {
  code: string;
  label: string;        // courte description pour le LLM
  recommended_agent: string;
}

// ──────────────────────────────────────────────────────────────
// 1) DÉTECTION DES FAILLES — règles déterministes locales
// (ces failles sont injectées dans le prompt IA pour personnaliser)
// ──────────────────────────────────────────────────────────────
function detectWeaknesses(p: Prospect): DetectedWeakness[] {
  const issues: DetectedWeakness[] = [];
  const rating = p.google_rating || 0;
  const reviews = p.google_reviews_count || 0;
  const bt = (p.business_type || "").toLowerCase();

  if (rating > 0 && rating < 4) {
    issues.push({
      code: "low_rating",
      label: `note Google ${rating}/5 sur ${reviews} avis — clairement améliorable`,
      recommended_agent: "Agent Réputation Google",
    });
  } else if (reviews >= 50 && rating >= 4) {
    issues.push({
      code: "good_rating_no_replies",
      label: `${reviews} avis et ${rating}/5 — excellent, mais probablement peu de réponses du gérant aux avis (vu côté prospect : tiède)`,
      recommended_agent: "Agent Réputation Google",
    });
  } else if (reviews < 10 && rating > 0) {
    issues.push({
      code: "few_reviews",
      label: `seulement ${reviews} avis Google — clairement sous-exploité pour un ${bt || "commerce"} local`,
      recommended_agent: "Agent Réputation Google",
    });
  }

  // Failles métier-spécifiques
  if (["restaurant", "brasserie", "bistrot", "pizzeria", "boulangerie", "patisserie", "cafe", "salon_de_the", "glacier", "bar"].includes(bt)) {
    issues.push({
      code: "social_inactif",
      label: "réseaux sociaux probablement inactifs ou rares pour un restaurant — le bouche-à-oreille Instagram représente une part énorme de la fréquentation",
      recommended_agent: "Agent Contenu Réseaux",
    });
  }
  if (["plombier", "electricien", "menuisier", "peintre", "couvreur", "serrurier", "garage", "maçon"].includes(bt)) {
    issues.push({
      code: "manual_quote",
      label: "les devis sont probablement faits à la main — c'est entre 30 min et 2h par devis perdus dans la paperasse",
      recommended_agent: "Agent Devis IA",
    });
  }
  if (["coiffeur", "coiffeuse", "spa", "institut", "dentiste", "osteo", "kine"].includes(bt)) {
    issues.push({
      code: "missed_calls",
      label: "des appels entrants probablement manqués en soirée ou hors horaires — perte directe de rendez-vous",
      recommended_agent: "Agent Chatbot IA",
    });
  }

  // Cap à 2 failles max (sinon le mail devient trop lourd)
  return issues.slice(0, 2);
}

// ──────────────────────────────────────────────────────────────
// 2) GÉNÉRATION COPY VIA KIMI K2 FREE — 100% personnalisé
// ──────────────────────────────────────────────────────────────

interface MailCopy {
  subject: string;
  intro_paragraph: string;   // 2-3 phrases d'accroche, mentionne explicitement nom + ville
  diagnostic: string;        // 1-2 phrases, ce que tu observes (failles)
  proposition: string;       // 1-2 phrases, l'agent qui aide, prix
  closing: string;           // 1 phrase, call-to-action soft
}

// ──────────────────────────────────────────────────────────────
// AUTO-PROVISIONING DU COMPTE KLYORA DIRECTOR
// → crée auth.users + director_accounts pré-rempli + mdp temporaire
// ──────────────────────────────────────────────────────────────
function generateTempPassword(): string {
  // 12 char base64-safe lisible : 'A7Kp9-mQ2vXz'
  return randomBytes(9).toString("base64").replace(/[+/=]/g, "").slice(0, 12);
}

async function provisionDirectorAccount(
  supabase: ReturnType<typeof getSupabase>,
  prospect: Prospect
): Promise<{ email: string; password: string; account_id: string } | null> {
  if (!prospect.email) return null;

  // Vérifie qu'on n'a pas déjà un compte pour cet email
  const { data: existing } = await supabase
    .from("director_accounts")
    .select("id, email")
    .eq("email", prospect.email)
    .maybeSingle();
  if (existing) {
    // Compte existe déjà → on ne re-provisionne pas
    return null;
  }

  const password = generateTempPassword();

  // 1) Créer l'auth.users via supabase auth admin
  let userId: string | null = null;
  try {
    const { data: u, error } = await supabase.auth.admin.createUser({
      email: prospect.email,
      password,
      email_confirm: true,  // skip email confirmation (on lui envoie nos credentials direct)
      user_metadata: {
        business_name: prospect.name,
        city: prospect.city,
        source: "auto_provision_cold_email",
      },
    });
    if (error || !u?.user?.id) {
      // Si l'user existe déjà côté auth (rare mais possible), on récupère
      const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
      const found = list?.users?.find((x: any) => x.email === prospect.email);
      userId = found?.id || null;
      if (!userId) return null;
    } else {
      userId = u.user.id;
    }
  } catch {
    return null;
  }
  if (!userId) return null;

  // 2) Créer director_accounts pré-rempli avec TOUT ce qu'on sait du prospect
  const { data: acc, error: accErr } = await supabase
    .from("director_accounts")
    .insert({
      auth_user_id: userId,
      email: prospect.email,
      business_name: prospect.name,
      business_type: prospect.business_type,
      city: prospect.city,
      google_rating: prospect.google_rating,
      google_reviews_count: prospect.google_reviews_count,
      tokens_balance: 0,
      total_tokens_purchased: 0,
      total_tokens_spent: 0,
      // flags de provisioning
      auto_provisioned: true,
      must_change_password: true,
      provisioned_from_prospect_id: prospect.id,
    } as any)
    .select("id")
    .single();
  if (accErr || !acc) return null;

  return { email: prospect.email, password, account_id: acc.id };
}

async function generateAiCopy(p: Prospect, weaknesses: DetectedWeakness[]): Promise<MailCopy | null> {
  const apiKey = process.env.OPENROUTER_API_KEY_KIMI || process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const bt = p.business_type || "commerce";
  const failles = weaknesses.length > 0
    ? weaknesses.map(w => `- ${w.label} → propose ${w.recommended_agent}`).join("\n")
    : `- aucune faille flagrante détectée — propose simplement Klyora Director pour gagner du temps`;

  const systemPrompt = `Tu rédiges des emails de prospection B2B en français pour Tom de Klyora Sites.

OBJECTIF : présenter Klyora Director — une plateforme d'agents IA pour PME françaises.

CONTRAINTES STRICTES :
- Email TRÈS court : 4 paragraphes max, chaque paragraphe = 2-3 phrases
- Ton : amical, sincère, accompagnant. JAMAIS commercial agressif.
- Pas de phrases creuses : "n'hésitez pas", "à votre service", "satisfaire", "économisez X€"
- Pas de listes à puces, pas de gros blocs, pas d'emojis dans le texte (uniquement dans intro éventuelle)
- Le prospect ne connaît pas Tom — l'intro doit montrer que TU AS REGARDÉ son entreprise
- Pas de pression, pas d'urgence factice ("offre limitée")
- Doit donner envie de cliquer par curiosité, pas par peur

TU PRODUIS UN JSON STRICT avec :
{
  "subject": "objet court 5-8 mots, sans emoji, accroche perso si possible",
  "intro_paragraph": "2-3 phrases. Mentionne explicitement le nom de l'établissement, la ville, et UNE chose précise que tu as remarquée.",
  "diagnostic": "1-2 phrases. Dis ce que tu OBSERVES (pas ce que tu suppose). Reste factuel et bienveillant.",
  "proposition": "1-2 phrases. Présente UN seul agent IA qui aide concrètement. Mentionne le prix.",
  "closing": "1 phrase courte. Invite à découvrir, sans presser. Pas de 'Cliquez ici'."
}`;

  const userPrompt = `Prospect :
- Nom : ${p.name}
- Ville : ${p.city || "?"}
- Métier : ${bt}
- Note Google : ${p.google_rating || "?"}/5
- Avis Google : ${p.google_reviews_count || 0}
- Qualité site existant : ${p.site_quality || "?"}

Failles à mentionner (choisis 1 seule, la plus impactante) :
${failles}

Agents Klyora Director disponibles + tarifs (choisis UN seul agent qui résout la faille principale) :
- Agent Réputation Google (99€/mois) — répond aux avis Google automatiquement
- Agent Contenu Réseaux (99€/mois) — 5 posts Instagram/Facebook par semaine
- Agent Chatbot IA (79€/mois) — répond aux clients 24h/24
- Agent Devis IA (149€/mois) — devis PDF générés en 30 sec

Rédige le mail. JSON uniquement, rien d'autre.`;

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://klyora.fr",
        "X-Title": "Klyora Director — Prospection Cold",
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2.6:free",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.85,
        max_tokens: 600,
        response_format: { type: "json_object" },
      }),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    const json = JSON.parse(content);
    return {
      subject: String(json.subject || "").slice(0, 100),
      intro_paragraph: String(json.intro_paragraph || ""),
      diagnostic: String(json.diagnostic || ""),
      proposition: String(json.proposition || ""),
      closing: String(json.closing || ""),
    };
  } catch {
    return null;
  }
}

// ──────────────────────────────────────────────────────────────
// 3) FALLBACK DÉTERMINISTE (si Kimi indisponible ou rate-limit)
// ──────────────────────────────────────────────────────────────
function buildFallbackCopy(p: Prospect, weaknesses: DetectedWeakness[]): MailCopy {
  const name = p.name || "votre établissement";
  const city = p.city || "votre ville";
  const w = weaknesses[0];

  const subject = w
    ? `${name} — une observation rapide`
    : `${name} — quelques minutes pour vous`;

  return {
    subject,
    intro_paragraph: `Je suis Tom, je suis tombé sur ${name} en regardant les ${(p.business_type || "commerces")} de ${city}. Je voulais vous écrire vite fait parce que j'ai remarqué quelque chose qui vous coûte probablement plus que vous ne le pensez.`,
    diagnostic: w
      ? `En clair : ${w.label}.`
      : `Beaucoup de PME locales perdent 5-10h/semaine sur des tâches que des agents IA peuvent gérer automatiquement — réponses aux avis, posts réseaux, prises de RDV, devis.`,
    proposition: w
      ? `Chez Klyora Director, on a un ${w.recommended_agent} qui s'occupe de ça pour ~99€/mois. Il tourne tout seul, sans que vous ayez à toucher quoi que ce soit.`
      : `Klyora Director, c'est une plateforme qui héberge 30+ agents IA spécialisés pour PME françaises. Vous embauchez ceux dont vous avez besoin, ils travaillent en autonomie.`,
    closing: `Je vous laisse jeter un œil si ça vous parle — pas de relance, je sais qu'on est tous occupés.`,
  };
}

// ──────────────────────────────────────────────────────────────
// 4) RENDU HTML — clean, court, sans gros blocs marketing
// ──────────────────────────────────────────────────────────────
function buildHtmlEmail(
  copy: MailCopy,
  unsubUrl: string,
  credentials: { email: string; password: string } | null
): string {
  const esc = (s: string) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Bloc credentials (uniquement si compte créé)
  const credBlock = credentials ? `
  <div style="background:#f0f7ff;border:1px solid #bfdbfe;border-radius:10px;padding:18px 22px;margin:8px 0 22px">
    <div style="font-size:11.5px;font-weight:700;color:#0a2540;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:10px">🔑 Vos accès Klyora Director</div>
    <p style="font-size:14px;line-height:1.55;margin:0 0 6px;color:#1a1a1a">
      <strong>Email :</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;font-family:monospace">${esc(credentials.email)}</code>
    </p>
    <p style="font-size:14px;line-height:1.55;margin:0 0 6px;color:#1a1a1a">
      <strong>Mot de passe temporaire :</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;font-family:monospace">${esc(credentials.password)}</code>
    </p>
    <p style="font-size:12px;color:#6b7280;margin:8px 0 0;line-height:1.5">
      À la première connexion, vous serez invité à choisir votre propre mot de passe.
    </p>
  </div>
  <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:12px 16px;margin:0 0 22px;border-radius:6px">
    <p style="font-size:13.5px;color:#92400e;margin:0;line-height:1.55">
      💡 <strong>Une fois connecté</strong>, cliquez sur <strong>« Lancer mon diagnostic »</strong> en haut du tableau de bord. Nos agents IA analyseront votre entreprise et vous remonteront les failles concrètes à corriger en priorité.
    </p>
  </div>
  ` : "";

  const ctaText = credentials ? "Me connecter à Klyora Director →" : "Découvrir Klyora Director →";

  return `<!DOCTYPE html>
<html lang="fr"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(copy.subject)}</title>
</head>
<body style="margin:0;padding:0;background:#fafafa;font-family:-apple-system,'Segoe UI',Arial,sans-serif;color:#1a1a1a">
<div style="max-width:580px;margin:0 auto;padding:32px 24px;background:#ffffff">

  <p style="font-size:15.5px;line-height:1.65;margin:0 0 18px;color:#1a1a1a">Bonjour,</p>

  <p style="font-size:15.5px;line-height:1.65;margin:0 0 18px;color:#1a1a1a">${esc(copy.intro_paragraph)}</p>

  <p style="font-size:15.5px;line-height:1.65;margin:0 0 18px;color:#1a1a1a">${esc(copy.diagnostic)}</p>

  <p style="font-size:15.5px;line-height:1.65;margin:0 0 22px;color:#1a1a1a">${esc(copy.proposition)}</p>

  ${credBlock}

  <div style="margin:24px 0 18px">
    <a href="https://klyora.fr/director/login${credentials ? `?email=${encodeURIComponent(credentials.email)}` : ""}" style="display:inline-block;background:#0a2540;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;padding:13px 28px;border-radius:8px;letter-spacing:0.02em">
      ${ctaText}
    </a>
  </div>

  <p style="font-size:15.5px;line-height:1.65;margin:0 0 22px;color:#1a1a1a">${esc(copy.closing)}</p>

  <p style="font-size:15.5px;line-height:1.65;margin:0 0 4px;color:#1a1a1a">Tom</p>
  <p style="font-size:13.5px;color:#6b7280;margin:0">Klyora Sites — <a href="https://klyora.fr" style="color:#6b7280;text-decoration:underline">klyora.fr</a></p>

  <hr style="margin:32px 0 16px;border:none;border-top:1px solid #e5e7eb">
  <p style="font-size:11.5px;color:#9ca3af;margin:0;line-height:1.5">
    Si ce message ne vous concerne pas, <a href="${esc(unsubUrl)}" style="color:#9ca3af;text-decoration:underline">cliquez ici pour ne plus en recevoir</a>.
  </p>

</div>
</body></html>`;
}

// ──────────────────────────────────────────────────────────────
// 5) HANDLER PRINCIPAL
// ──────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronSecret = req.headers.get("x-cron-secret") || "";
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY) && !safeCompare(cronSecret, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const batchSize = Math.min(20, Math.max(1, Number(body.batch_size) || 8));
  const dryRun = Boolean(body.dry_run);

  const supabase = getSupabase();
  const brevoKey = process.env.BREVO_API_KEY || "";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://klyora.fr";

  let columnExists = true;
  let selectedProspects: Prospect[] = [];

  try {
    const { data, error } = await supabase
      .from("prospects")
      .select("id, name, email, city, business_type, google_rating, google_reviews_count, site_quality, slug")
      .not("email", "is", null)
      .is("agentconceptor_sent_at", null)
      .in("site_quality", ["good", "average", "poor"])
      .order("google_reviews_count", { ascending: false })
      .limit(batchSize * 3);

    if (error) {
      if (String(error.message).includes("agentconceptor_sent_at") || String(error.code).includes("42703")) {
        columnExists = false;
      } else {
        throw error;
      }
    } else {
      selectedProspects = (data || []) as Prospect[];
    }
  } catch {
    columnExists = false;
  }

  if (!columnExists || selectedProspects.length === 0) {
    const { data: fallback } = await supabase
      .from("prospects")
      .select("id, name, email, city, business_type, google_rating, google_reviews_count, site_quality, slug")
      .not("email", "is", null)
      .order("google_reviews_count", { ascending: false })
      .limit(batchSize * 2);
    if (!fallback || fallback.length === 0) {
      return NextResponse.json({ success: true, sent: 0, processed: 0, message: "Aucun prospect disponible" });
    }
    selectedProspects = fallback as Prospect[];
  }

  const uniqueProspects = selectedProspects
    .filter((p, i, arr) => arr.findIndex(x => x.id === p.id) === i)
    .slice(0, batchSize);

  let sent = 0;
  let errors = 0;
  const results: Array<{ id: string; name: string; status: string; ai?: boolean; subject?: string; error?: string }> = [];

  for (const prospect of uniqueProspects) {
    if (!prospect.email) continue;

    const weaknesses = detectWeaknesses(prospect);

    // Génère le copy : IA Kimi K2 si possible, sinon fallback déterministe
    let copy = await generateAiCopy(prospect, weaknesses);
    const usedAi = !!copy;
    if (!copy) copy = buildFallbackCopy(prospect, weaknesses);

    // 🆕 AUTO-PROVISIONNE LE COMPTE KLYORA DIRECTOR (si pas déjà existant)
    let credentials: { email: string; password: string } | null = null;
    if (!dryRun) {
      const prov = await provisionDirectorAccount(supabase, prospect);
      if (prov) {
        credentials = { email: prov.email, password: prov.password };
      }
    } else {
      // En dry_run, on simule des credentials pour voir le rendu
      credentials = { email: prospect.email, password: "Demo123-test" };
    }

    const unsubUrl = `${baseUrl}/api/prospect/unsubscribe?email=${encodeURIComponent(prospect.email)}`;
    const htmlContent = buildHtmlEmail(copy, unsubUrl, credentials);

    if (dryRun) {
      results.push({ id: prospect.id, name: prospect.name, status: "dry_run", ai: usedAi, subject: copy.subject });
      continue;
    }

    try {
      const res = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": brevoKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          sender: { name: "Tom — Klyora Director", email: "contact@klyora.fr" },
          replyTo: { name: "Tom", email: "contact@klyora.fr" },
          to: [{ email: prospect.email, name: prospect.name || "" }],
          subject: copy.subject,
          htmlContent,
          headers: {
            "List-Unsubscribe": `<${unsubUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            "X-Campaign": "webdirector-cold",
          },
        }),
        signal: AbortSignal.timeout(15_000),
      });

      if (res.ok) {
        sent++;
        if (columnExists) {
          await supabase.from("prospects")
            .update({ agentconceptor_sent_at: new Date().toISOString() })
            .eq("id", prospect.id);
        }
        results.push({ id: prospect.id, name: prospect.name, status: "sent", ai: usedAi, subject: copy.subject });
      } else {
        const errBody = await res.text().catch(() => "");
        errors++;
        results.push({ id: prospect.id, name: prospect.name, status: "error", error: errBody.slice(0, 200) });
      }
    } catch (err) {
      errors++;
      results.push({ id: prospect.id, name: prospect.name, status: "error", error: String(err).slice(0, 200) });
    }

    // Petite pause anti-saturation Brevo + OpenRouter
    await new Promise(r => setTimeout(r, 400));
  }

  // Telegram
  if (sent > 0 && !dryRun) {
    const tg = process.env.TELEGRAM_BOT_TOKEN;
    const chat = process.env.TELEGRAM_CHAT_ID;
    if (tg && chat) {
      const aiCount = results.filter(r => r.ai).length;
      fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chat,
          parse_mode: "HTML",
          disable_notification: true,
          text: `🎯 <b>Klyora Director — Prospection cold</b>\n\n<b>Envoyés :</b> ${sent}\n<b>Personnalisés IA :</b> ${aiCount}/${sent}\n<b>Erreurs :</b> ${errors}`,
        }),
      }).catch(() => {});
    }
  }

  return NextResponse.json({ success: true, processed: uniqueProspects.length, sent, errors, dry_run: dryRun, results });
}

export async function GET(req: NextRequest) { return POST(req); }
