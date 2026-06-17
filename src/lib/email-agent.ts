/* ══════════════════════════════════════════
   EMAIL AGENT — autonome

   Lit les mails entrants sur contact@klyora.fr (IMAP IONOS),
   classifie l'intention via LLM (Kimi K2), et exécute :
     - UNSUBSCRIBE        → désabonne + reply confirmation
     - BROKEN_LINK        → check URL maquette, repair si réparable,
                            renvoie le code d'accès au prospect
     - REGEN_REQUEST      → reply "quels changements ?" + flag DB
     - REGEN_INSTRUCTION  → re-génération maquette + reply lien
     - PRICE_INQUIRY      → reply tarifs + lien maquette
     - DELAY_INQUIRY      → reply "livraison instantanée"
     - INTERESTED_LEAD    → escalade Telegram (sans auto-reply)
     - SPAM_OR_BOT        → ignore
     - OTHER              → escalade Telegram

   Idempotent : log dans prospect_email_messages, marque le mail IMAP SEEN.
   ══════════════════════════════════════════ */

import Imap from "imap";
import { simpleParser, type ParsedMail } from "mailparser";
import { createClient } from "@supabase/supabase-js";
import { llmCall } from "@/lib/ebook/llm-client";
import { sendBrevoEmail } from "@/lib/brevo-send";
import { getOrCreateAccessCode } from "@/lib/access-code";

export type EmailIntent =
  | "UNSUBSCRIBE"
  | "BROKEN_LINK"
  | "REGEN_REQUEST"
  | "REGEN_INSTRUCTION"
  | "PRICE_INQUIRY"
  | "DELAY_INQUIRY"
  | "INTERESTED_LEAD"
  | "SPAM_OR_BOT"
  | "OTHER";

interface ClassifiedEmail {
  intent: EmailIntent;
  confidence: number;
  reasoning: string;
  regen_instructions?: string;
}

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

/* ══════════════════════════════════════════
   IMAP — fetch unseen mails
   ══════════════════════════════════════════ */

interface FetchedMail {
  uid: number;
  from: string;
  fromName: string;
  subject: string;
  text: string;
  html: string;
  date: Date;
  inReplyTo?: string;
  references?: string[];
}

export async function fetchUnseenMails(limit = 30): Promise<FetchedMail[]> {
  const user = process.env.IONOS_IMAP_USER || process.env.IONOS_SMTP_USER || "";
  const password = process.env.IONOS_IMAP_PASSWORD || process.env.IONOS_SMTP_PASS || "";
  const host = process.env.IONOS_IMAP_HOST || "imap.ionos.fr";
  const port = parseInt(process.env.IONOS_IMAP_PORT || "993", 10);

  if (!user || !password) {
    throw new Error("IONOS_IMAP_USER/PASSWORD manquants");
  }

  return new Promise((resolve, reject) => {
    const imap = new Imap({
      user,
      password,
      host,
      port,
      tls: true,
      tlsOptions: { rejectUnauthorized: false },
      authTimeout: 15000,
    });

    const mails: FetchedMail[] = [];

    imap.once("error", (err) => reject(err));

    imap.once("ready", () => {
      imap.openBox("INBOX", false, (err) => {
        if (err) {
          imap.end();
          return reject(err);
        }
        imap.search(["UNSEEN"], (err2, uids) => {
          if (err2) {
            imap.end();
            return reject(err2);
          }
          if (!uids || uids.length === 0) {
            imap.end();
            return resolve([]);
          }
          const sliced = uids.slice(0, limit);
          const fetcher = imap.fetch(sliced, { bodies: "", markSeen: true });

          fetcher.on("message", (msg, seqno) => {
            const uid = sliced[seqno - 1] || 0;
            let raw = Buffer.alloc(0);
            msg.on("body", (stream) => {
              stream.on("data", (chunk: Buffer) => {
                raw = Buffer.concat([raw, chunk]);
              });
            });
            msg.once("end", async () => {
              try {
                const parsed: ParsedMail = await simpleParser(raw);
                const fromAddr = parsed.from?.value?.[0]?.address || "";
                const fromName = parsed.from?.value?.[0]?.name || "";
                mails.push({
                  uid,
                  from: fromAddr.toLowerCase(),
                  fromName,
                  subject: parsed.subject || "",
                  text: (parsed.text || "").slice(0, 8000),
                  html: (parsed.html || "").toString().slice(0, 16000),
                  date: parsed.date || new Date(),
                  inReplyTo: parsed.inReplyTo,
                  references: parsed.references
                    ? (Array.isArray(parsed.references) ? parsed.references : [parsed.references])
                    : undefined,
                });
              } catch {
                // ignore unparseable mails
              }
            });
          });

          fetcher.once("end", () => {
            setTimeout(() => {
              imap.end();
              resolve(mails);
            }, 1500);
          });

          fetcher.once("error", (errF) => {
            imap.end();
            reject(errF);
          });
        });
      });
    });

    imap.connect();
  });
}

/* ══════════════════════════════════════════
   LLM — classify intent
   ══════════════════════════════════════════ */

const SYSTEM_PROMPT = `Tu es un agent qui classifie des emails reçus sur contact@klyora.fr (agence web Klyora Sites).

Les emails entrants sont des réponses de prospects qui ont reçu une maquette personnalisée de leur futur site web. Klyora a envoyé un mail commercial avec un lien vers /prospects/[slug] protégé par un code d'accès à 8 caractères.

Tu dois retourner UN JSON STRICT avec ce schéma :
{
  "intent": "UNSUBSCRIBE | BROKEN_LINK | REGEN_REQUEST | REGEN_INSTRUCTION | PRICE_INQUIRY | DELAY_INQUIRY | INTERESTED_LEAD | SPAM_OR_BOT | OTHER",
  "confidence": 0.0-1.0,
  "reasoning": "<une phrase courte expliquant pourquoi>",
  "regen_instructions": "<si intent=REGEN_INSTRUCTION, résumé des changements demandés>"
}

Critères de classification :
- UNSUBSCRIBE       → "stop", "désabonnez", "ne plus recevoir", "spam", "pas intéressé", silence colérique
- BROKEN_LINK       → "404", "lien ne marche pas", "page introuvable", "erreur", "n'arrive pas à ouvrir"
- REGEN_REQUEST     → "c'est pas ce que je veux", "pas du tout ma boîte", "à refaire", sans détail
- REGEN_INSTRUCTION → comme REGEN_REQUEST mais AVEC des instructions concrètes (couleurs, textes, photos à changer)
- PRICE_INQUIRY     → "c'est combien", "quel est le prix", "votre tarif"
- DELAY_INQUIRY     → "combien de temps", "délai de livraison", "quand est-ce livré"
- INTERESTED_LEAD   → manifeste intérêt clair, pose questions concrètes, demande RDV/appel
- SPAM_OR_BOT       → newsletter automatique, OOO bounce, virus, contenu hors-sujet
- OTHER             → tout le reste (à escalader humain)

Sois STRICT sur le JSON. Pas de texte hors JSON.`;

/**
 * Pré-classification rule-based : détecte les intentions évidentes
 * sans appel LLM. Réduit drastiquement les "JSON parse fail" et économise
 * les tokens. Si aucune règle ne matche → fallback LLM.
 */
function preClassify(mail: FetchedMail): ClassifiedEmail | null {
  // On combine subject + texte (le subject est très révélateur)
  const subj = (mail.subject || "").toLowerCase();
  const body = (mail.text || mail.html.replace(/<[^>]+>/g, " ") || "").toLowerCase();
  const all = `${subj}\n${body}`.slice(0, 4000);

  // UNSUBSCRIBE — refus explicite ou demande d'arrêt (FR pluriel + politesse)
  if (
    /\b(stop|d[ée]sabonn|ne (?:plus|me) sollicite|me d[ée]sinscri|unsubscribe|retir[eè] de (?:vos|cette|votre|la) liste|ne (?:m'|nous )?envoy(?:ez|er) plus|cessez de m['e]?envoyer)\b/i.test(all) ||
    /\b(?:pas|non) int[ée]ress[ée]e?s?\b/i.test(all) ||
    /\b(?:nous )?ne (?:souhait(?:e|ons|ent|ez)|veu[xt]|voulons|voulez|d[eé]sirons|d[eé]sirez) pas\b/i.test(all) ||
    /\bne (?:souhait|d[eé]sir|veu[xt]|voul)\w* pas (?:modifier|changer|faire|prendre)\b/i.test(all) ||
    /\bd[ée]j[àa] (?:un|notre|mon|leur|une) (?:site|prestataire|agence)\b/i.test(all) ||
    /\bg[ée]r[ée] par (?:la franchise|notre franchise|un prestataire|une agence|notre groupe)\b/i.test(all) ||
    /\bmerci (?:de|pour) (?:votre|cette) (?:proposition|d[eé]marche|attention)[, ]+mais\b/i.test(all) ||
    /\bne (?:donne|donnez) (?:pas|aucune) suite\b/i.test(all)
  ) {
    return { intent: "UNSUBSCRIBE", confidence: 0.92, reasoning: "rule-based: refus ou demande de désabonnement" };
  }

  // BROKEN_LINK — lien cassé
  if (
    /\b(404|page introuvable|page introuvable|lien ne (?:marche|fonctionne) pas|n['e]arrive pas à (?:ouvrir|acc[eé]der)|erreur (?:404|sur le lien))\b/i.test(all)
  ) {
    return { intent: "BROKEN_LINK", confidence: 0.9, reasoning: "rule-based: mention d'erreur ou lien cassé" };
  }

  // PRICE_INQUIRY — demande de prix
  if (
    /\b(combien (?:[çc]a co[uû]te|est-ce|coûterait)|quel (?:est|serait) (?:le|votre) (?:prix|tarif)|votre tarif|prix \?|tarif \?|combien pour)\b/i.test(all)
  ) {
    return { intent: "PRICE_INQUIRY", confidence: 0.9, reasoning: "rule-based: demande de prix" };
  }

  // DELAY_INQUIRY — délai
  if (
    /\b(combien de temps|d[ée]lai (?:de )?livraison|quand (?:est-ce|sera|reçoit|aurais|aurai) (?:livr|fini|prêt))\b/i.test(all)
  ) {
    return { intent: "DELAY_INQUIRY", confidence: 0.88, reasoning: "rule-based: question sur le délai" };
  }

  // REGEN_REQUEST — pas du tout content sans instructions
  if (
    /(c['e]est|n['e]est) pas (?:du tout )?(?:ce que je|ma)\b|pas du tout ma (?:bo[iî]te|maquette)|(?:bof|moche|d[ée]gueulasse|nul|pas terrible)\b|[àa] refaire|tout est [àa] revoir/i.test(all)
  ) {
    return { intent: "REGEN_REQUEST", confidence: 0.78, reasoning: "rule-based: mécontent sans détails" };
  }

  // INTERESTED_LEAD — demande RDV / appel / informations concrètes
  if (
    /\b(je suis int[ée]ress|on (?:peut|pourrait) (?:en )?(?:discuter|parler|s'appeler)|m['e]appeler|me rappeler|(?:rendez[- ]vous|rdv)|envoyez[- ]moi (?:un|le) devis|j['e]aimerais (?:en savoir plus|discuter)|comment on (?:fait|proc[èe]de))\b/i.test(all) ||
    /\b(?:proposez|envoyez)[- ]moi (?:plus d['e]informations|un devis|un appel)\b/i.test(all)
  ) {
    return { intent: "INTERESTED_LEAD", confidence: 0.85, reasoning: "rule-based: signal d'intérêt explicite" };
  }

  return null;
}

export async function classifyEmail(mail: FetchedMail): Promise<ClassifiedEmail> {
  // 1) Pré-classification rule-based (cas évidents, sans LLM)
  const pre = preClassify(mail);
  if (pre) return pre;

  // 2) Fallback LLM pour les cas complexes
  const userPrompt = `From: ${mail.fromName} <${mail.from}>
Subject: ${mail.subject}

${mail.text || mail.html.replace(/<[^>]+>/g, " ").slice(0, 3000)}`;

  const result = await llmCall({
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 400,
    json: true,
  }).catch(() => "");

  try {
    const text = typeof result === "string" ? result : (result as { content?: string })?.content || "";
    // Retire les markdown fences éventuels (```json ... ```)
    const cleaned = text.replace(/```(?:json)?\s*/gi, "").replace(/```\s*$/g, "").trim();
    const match = cleaned.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : cleaned);
    return {
      intent: (parsed.intent || "OTHER") as EmailIntent,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      reasoning: String(parsed.reasoning || "").slice(0, 300),
      regen_instructions: parsed.regen_instructions ? String(parsed.regen_instructions).slice(0, 600) : undefined,
    };
  } catch {
    // Log le raw pour debug : on garde le 1er char de la réponse LLM
    const rawText = typeof result === "string" ? result : (result as { content?: string })?.content || "";
    const rawPreview = rawText.slice(0, 80).replace(/\s+/g, " ");
    return { intent: "OTHER", confidence: 0, reasoning: `JSON parse fail | raw="${rawPreview}"` };
  }
}

/* ══════════════════════════════════════════
   Match prospect by email
   ══════════════════════════════════════════ */

async function findProspectByEmail(email: string): Promise<{
  id: string;
  name: string;
  email: string;
  slug: string;
  access_code: string | null;
  unsubscribed_at: string | null;
} | null> {
  const supabase = db();
  const { data } = await supabase
    .from("prospects")
    .select("id, name, email, slug, access_code, unsubscribed_at")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return (data as { id: string; name: string; email: string; slug: string; access_code: string | null; unsubscribed_at: string | null } | null) || null;
}

/* ══════════════════════════════════════════
   Actions per intent
   ══════════════════════════════════════════ */

async function unsubscribeProspect(prospectId: string) {
  await db()
    .from("prospects")
    .update({
      unsubscribed_at: new Date().toISOString(),
      unsubscribe_reason: "auto_reply: classified by agent",
      status: "unsubscribed",
    })
    .eq("id", prospectId);
}

async function replyUnsubscribe(mail: FetchedMail, prospectName: string) {
  const firstName = prospectName.split(" ")[0] || "";
  await sendBrevoEmail({
    to: mail.from,
    toName: prospectName,
    subject: `Re: ${mail.subject}`,
    htmlContent: `<p>Bonjour ${firstName},</p>
<p>Je vous confirme votre désinscription. Vous ne recevrez plus aucun mail de notre part.</p>
<p>Désolé pour le dérangement, bonne continuation à vous,</p>
<p>Tom — Klyora Sites<br><a href="mailto:contact@klyora.fr">contact@klyora.fr</a></p>`,
    textContent: `Bonjour ${firstName},\n\nJe vous confirme votre désinscription. Vous ne recevrez plus aucun mail.\n\nBonne continuation,\nTom — Klyora Sites`,
  });
}

async function replyBrokenLink(mail: FetchedMail, prospect: { name: string; slug: string; access_code: string | null }) {
  const code = prospect.access_code || (await getOrCreateAccessCode((await findProspectByEmail(mail.from))?.id || ""));
  const firstName = prospect.name.split(" ")[0] || "";
  const url = `https://klyora.fr/prospects/${prospect.slug}`;
  await sendBrevoEmail({
    to: mail.from,
    toName: prospect.name,
    subject: `Re: ${mail.subject}`,
    htmlContent: `<p>Bonjour ${firstName},</p>
<p>Désolé pour ce désagrément. Voici le lien direct et votre code d'accès :</p>
<p style="text-align:center;margin:24px 0">
  <a href="${url}" style="display:inline-block;background:#0a0a0a;color:#FFD700;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700">Voir ma maquette →</a>
</p>
<div style="background:#0F172A;color:#FFD700;padding:18px;border-radius:10px;text-align:center;margin:16px 0">
  <div style="font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.55);margin-bottom:6px">Votre code d'accès</div>
  <div style="font-size:24px;font-weight:800;letter-spacing:0.25em;font-family:monospace">${code}</div>
</div>
<p style="font-size:13px">Si le souci persiste, répondez à ce mail.</p>
<p>Tom — Klyora Sites</p>`,
    textContent: `Bonjour ${firstName},\n\nDésolé. Voici le lien direct + votre code :\n\n${url}\nCode : ${code}\n\nTom — Klyora Sites`,
  });
}

async function replyRegenRequest(mail: FetchedMail, prospectName: string) {
  const firstName = prospectName.split(" ")[0] || "";
  await sendBrevoEmail({
    to: mail.from,
    toName: prospectName,
    subject: `Re: ${mail.subject}`,
    htmlContent: `<p>Bonjour ${firstName},</p>

<p>Merci pour votre retour, c'est précieux. Nous allons refaire votre maquette
pour qu'elle corresponde exactement à ce que vous voulez.</p>

<p>Pour bien la cibler, pouvez-vous répondre à ce mail avec les éléments suivants ?</p>

<ol style="line-height:1.8">
  <li><strong>Qu'est-ce qui ne vous a pas convenu</strong> dans la première version ?
      (Trop sobre, pas assez "vous", couleurs, photos, structure…)</li>

  <li><strong>Quel métier ou quel angle</strong> voulez-vous mettre en avant en premier ?
      (Le produit phare, votre savoir-faire, votre histoire, votre équipe, vos avis…)</li>

  <li><strong>Quelle ambiance de couleurs</strong> souhaitez-vous ?
      (Chaude/froide, sobre/colorée, claire/sombre — donnez-moi une couleur dominante
      si vous en avez une.)</li>

  <li><strong>Quelles fonctionnalités</strong> sont importantes pour votre activité ?
      (Réservation en ligne, formulaire de devis, prise de rendez-vous, click & collect,
      espace clients, blog, e-commerce…)</li>

  <li><strong>Avez-vous des photos ou des visuels</strong> à intégrer ?
      Envoyez-les nous en pièce jointe directement par mail, ou un lien
      Google Drive / WeTransfer / Dropbox — nous nous occupons du reste.</li>
</ol>

<p>Dès réception, <strong>notre équipe vous prépare la nouvelle maquette et vous la
retransmet rapidement</strong> (généralement sous 24h ouvrées). Aucune action de votre
part en dehors de la réponse à ce mail.</p>

<p>À très vite,<br>
L'équipe Klyora Sites<br>
<a href="mailto:contact@klyora.fr" style="color:#0066ff">contact@klyora.fr</a></p>`,
    textContent: `Bonjour ${firstName},

Merci pour votre retour. Nous allons refaire votre maquette pour qu'elle corresponde
exactement à ce que vous voulez.

Pour bien la cibler, pouvez-vous répondre à ce mail avec :

1. Ce qui ne vous a pas convenu dans la première version ?
2. Quel métier ou angle voulez-vous mettre en avant ?
3. Quelle ambiance de couleurs souhaitez-vous ?
4. Quelles fonctionnalités sont importantes (réservation, devis, e-commerce, etc.) ?
5. Avez-vous des photos à intégrer ? (Envoyez-les en pièce jointe ou un lien Drive/WeTransfer)

Dès réception, notre équipe vous prépare la nouvelle maquette et vous la retransmet
rapidement (sous 24h ouvrées).

À très vite,
L'équipe Klyora Sites
contact@klyora.fr`,
  });
}

async function replyRegenInstruction(mail: FetchedMail, prospect: { id: string; name: string; slug: string }, instructions: string) {
  const firstName = prospect.name.split(" ")[0] || "";
  // Flag dans la DB pour re-génération asynchrone
  await db()
    .from("prospects")
    .update({
      regen_requested_at: new Date().toISOString(),
      regen_instructions: instructions,
    })
    .eq("id", prospect.id);
  await sendBrevoEmail({
    to: mail.from,
    toName: prospect.name,
    subject: `Re: ${mail.subject}`,
    htmlContent: `<p>Bonjour ${firstName},</p>
<p>Bien noté vos demandes :</p>
<blockquote style="border-left:3px solid #0066ff;padding:8px 16px;color:#475569;margin:16px 0">${instructions.slice(0, 500).replace(/\n/g, "<br>")}</blockquote>
<p>Je lance la régénération de votre maquette maintenant. Vous recevrez le nouveau lien sous <strong>quelques minutes</strong>.</p>
<p>Tom — Klyora Sites</p>`,
    textContent: `Bonjour ${firstName},\n\nBien noté vos demandes :\n${instructions.slice(0, 500)}\n\nJe lance la régénération. Vous recevrez le nouveau lien sous quelques minutes.\n\nTom — Klyora Sites`,
  });
}

async function replyPrice(mail: FetchedMail, prospect: { name: string; slug: string; access_code: string | null }) {
  const firstName = prospect.name.split(" ")[0] || "";
  const url = `https://klyora.fr/prospects/${prospect.slug}`;
  await sendBrevoEmail({
    to: mail.from,
    toName: prospect.name,
    subject: `Re: ${mail.subject}`,
    htmlContent: `<p>Bonjour ${firstName},</p>
<p>Voici nos tarifs :</p>
<ul>
  <li><strong>Site sur-mesure</strong> : <strong>320 € TTC</strong> en paiement unique (ou 3× sans frais)</li>
  <li><strong>Option Sérénité</strong> (hébergement, sauvegardes, modifications illimitées) : <strong>17,90 €/mois</strong> — <strong>1<sup>er</sup> mois offert</strong></li>
</ul>
<p>Garantie satisfait ou remboursé 14 jours.</p>
<p>Pour commander, c'est en bas de votre maquette : <a href="${url}">${url}</a>${prospect.access_code ? ` (code <code>${prospect.access_code}</code>)` : ""}</p>
<p>Tom — Klyora Sites</p>`,
    textContent: `Bonjour ${firstName},\n\nTarifs :\n- Site sur-mesure : 320 € TTC (ou 3× sans frais)\n- Sérénité (hébergement + modifs illimitées) : 17,90 €/mois — 1er mois offert\n\nGarantie 14 jours.\nCommande sur votre maquette : ${url}${prospect.access_code ? `\nCode : ${prospect.access_code}` : ""}\n\nTom — Klyora Sites`,
  });
}

async function replyDelay(mail: FetchedMail, prospectName: string) {
  const firstName = prospectName.split(" ")[0] || "";
  await sendBrevoEmail({
    to: mail.from,
    toName: prospectName,
    subject: `Re: ${mail.subject}`,
    htmlContent: `<p>Bonjour ${firstName},</p>
<p>La <strong>livraison est instantanée</strong> : dès que vous validez le paiement Stripe, votre nom de domaine est enregistré et votre site mis en ligne automatiquement sous <strong>quelques minutes</strong>. Vous recevez un mail "votre site est en ligne" avec le lien.</p>
<p>Aucune attente, aucune intervention de votre part. Garantie satisfait ou remboursé 14 jours.</p>
<p>Tom — Klyora Sites</p>`,
    textContent: `Bonjour ${firstName},\n\nLivraison instantanée : dès paiement, votre domaine est acheté et le site mis en ligne sous quelques minutes. Mail de confirmation auto.\n\nTom — Klyora Sites`,
  });
}

/* ══════════════════════════════════════════
   Telegram alert
   ══════════════════════════════════════════ */

async function telegramAlert(text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  }).catch(() => {});
}

function escape(s: string): string {
  return String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* ══════════════════════════════════════════
   Test if a mockup URL is broken
   ══════════════════════════════════════════ */

async function checkMockupHealth(slug: string): Promise<{ ok: boolean; status: number }> {
  try {
    const res = await fetch(`https://klyora.fr/prospects/${encodeURIComponent(slug)}`, {
      method: "GET",
      headers: { "User-Agent": "klyora-email-agent/1.0" },
      signal: AbortSignal.timeout(10000),
    });
    return { ok: res.status === 200, status: res.status };
  } catch {
    return { ok: false, status: 0 };
  }
}

/* ══════════════════════════════════════════
   Main runner
   ══════════════════════════════════════════ */

export interface AgentRunResult {
  fetched: number;
  classified: number;
  auto_replied: number;
  escalated: number;
  errors: number;
  details: Array<{ from: string; intent: EmailIntent; action: string }>;
}

export async function runEmailAgent(opts?: { limit?: number }): Promise<AgentRunResult> {
  const limit = opts?.limit ?? 30;
  const result: AgentRunResult = {
    fetched: 0,
    classified: 0,
    auto_replied: 0,
    escalated: 0,
    errors: 0,
    details: [],
  };

  const mails = await fetchUnseenMails(limit);
  result.fetched = mails.length;

  for (const mail of mails) {
    try {
      // Skip our own bounces, out-of-office, et toutes auto-réponses connues
      const fromLow = mail.from.toLowerCase();
      const subjectLow = (mail.subject || "").toLowerCase();
      const isSystemSender =
        /postmaster|mailer-daemon|noreply|no-reply|donotreply|auto-reply|autoreply|do-not-reply|notification|newsletter|do_not_reply/i.test(fromLow) ||
        /^(auto.?reply|out of office|absence|hors bureau|i am out|absent|en cong[eé])/i.test(subjectLow) ||
        /^(re:.*automatic|automatic reply|réponse automatique)/i.test(subjectLow);
      if (isSystemSender) {
        await logMessage(null, mail, "SPAM_OR_BOT", `skipped (auto/system sender: ${fromLow})`);
        continue;
      }

      const prospect = await findProspectByEmail(mail.from);
      const classified = await classifyEmail(mail);
      result.classified++;

      // Log brut
      await logMessage(prospect?.id || null, mail, classified.intent, classified.reasoning);

      // Si déjà désabonné, n'agis plus
      if (prospect?.unsubscribed_at && classified.intent !== "INTERESTED_LEAD") {
        continue;
      }

      let action = "no-op";

      switch (classified.intent) {
        case "UNSUBSCRIBE":
          if (prospect) await unsubscribeProspect(prospect.id);
          await replyUnsubscribe(mail, prospect?.name || "");
          action = "unsubscribed + reply";
          result.auto_replied++;
          break;

        case "BROKEN_LINK":
          if (prospect) {
            const health = await checkMockupHealth(prospect.slug);
            if (health.ok) {
              await replyBrokenLink(mail, prospect);
              action = `link OK → reply with code (status ${health.status})`;
              result.auto_replied++;
            } else {
              await telegramAlert(
                `🛠️ <b>MAQUETTE CASSÉE</b> · ${escape(prospect.name)}\nstatus=${health.status} · slug=${escape(prospect.slug)}\nProspect : ${escape(mail.from)}`
              );
              action = `broken (status ${health.status}) → escalated`;
              result.escalated++;
            }
          } else {
            await telegramAlert(
              `🛠️ <b>BROKEN_LINK</b> mais prospect non trouvé\n${escape(mail.from)}\nSujet: ${escape(mail.subject)}`
            );
            result.escalated++;
          }
          break;

        case "REGEN_REQUEST":
          await replyRegenRequest(mail, prospect?.name || "");
          action = "asked for details";
          result.auto_replied++;
          break;

        case "REGEN_INSTRUCTION":
          if (prospect && classified.regen_instructions) {
            await replyRegenInstruction(mail, prospect, classified.regen_instructions);
            action = "regen flagged + reply";
            result.auto_replied++;
          } else {
            result.escalated++;
            await telegramAlert(`🔄 REGEN_INSTRUCTION mais data incomplet pour ${escape(mail.from)}`);
          }
          break;

        case "PRICE_INQUIRY":
          if (prospect) {
            await replyPrice(mail, prospect);
            action = "price reply";
            result.auto_replied++;
          }
          break;

        case "DELAY_INQUIRY":
          await replyDelay(mail, prospect?.name || "");
          action = "delay reply";
          result.auto_replied++;
          break;

        case "INTERESTED_LEAD":
          await telegramAlert(
            `🔥 <b>VRAI LEAD CHAUD</b>\nDe : ${escape(mail.fromName)} &lt;${escape(mail.from)}&gt;\nSujet : ${escape(mail.subject)}\n\n<i>${escape(classified.reasoning)}</i>\n\n📞 Rappelle-le maintenant !`
          );
          action = "escalated lead";
          result.escalated++;
          break;

        case "SPAM_OR_BOT":
          action = "ignored";
          break;

        default:
          await telegramAlert(
            `📧 <b>Mail à traiter manuellement</b>\nDe : ${escape(mail.from)}\nSujet : ${escape(mail.subject)}\n\nRaison : ${escape(classified.reasoning)}`
          );
          action = "escalated other";
          result.escalated++;
      }

      result.details.push({ from: mail.from, intent: classified.intent, action });
    } catch (err) {
      result.errors++;
      await logMessage(null, mail, "OTHER", `error: ${err instanceof Error ? err.message : "unknown"}`);
    }
  }

  return result;
}

/* ══════════════════════════════════════════
   DB log
   ══════════════════════════════════════════ */

async function logMessage(
  prospectId: string | null,
  mail: FetchedMail,
  intent: EmailIntent,
  reasoning: string
) {
  await db()
    .from("prospect_email_messages")
    .insert({
      prospect_id: prospectId,
      from_email: mail.from.slice(0, 200),
      from_name: mail.fromName.slice(0, 200),
      subject: mail.subject.slice(0, 500),
      body_text: mail.text.slice(0, 8000),
      intent,
      reasoning: reasoning.slice(0, 500),
      received_at: mail.date.toISOString(),
    });
}
