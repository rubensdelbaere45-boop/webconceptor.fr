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
import { callLlm } from "@/lib/ebook/llm-client";
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

export async function classifyEmail(mail: FetchedMail): Promise<ClassifiedEmail> {
  const userPrompt = `From: ${mail.fromName} <${mail.from}>
Subject: ${mail.subject}

${mail.text || mail.html.replace(/<[^>]+>/g, " ").slice(0, 3000)}`;

  const result = await callLlm({
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
    maxTokens: 400,
    json: true,
  }).catch(() => "");

  try {
    // Extraction robuste : trouve le 1er { … } du résultat
    const text = typeof result === "string" ? result : (result as { content?: string })?.content || "";
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : text);
    return {
      intent: (parsed.intent || "OTHER") as EmailIntent,
      confidence: typeof parsed.confidence === "number" ? parsed.confidence : 0.5,
      reasoning: String(parsed.reasoning || "").slice(0, 300),
      regen_instructions: parsed.regen_instructions ? String(parsed.regen_instructions).slice(0, 600) : undefined,
    };
  } catch {
    return { intent: "OTHER", confidence: 0, reasoning: "JSON parse fail" };
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
<p>Merci pour votre retour ! Je vais refaire la maquette selon vos goûts.</p>
<p>Pour bien la cibler, j'aurais besoin de quelques précisions — répondez simplement à ce mail :</p>
<ul>
  <li><strong>Couleurs</strong> : quelle ambiance (sobre, lumineuse, colorée…) ?</li>
  <li><strong>Sections</strong> : que voulez-vous mettre en avant (produits, services, équipe, photos…) ?</li>
  <li><strong>Photos</strong> : un lien Drive/Dropbox où vous mettriez vos photos, ou je continue avec des photos type ?</li>
  <li><strong>Inspiration</strong> : un site web qui vous plaît (même un concurrent) ?</li>
</ul>
<p>Dès réception, je relance la génération et je vous renvoie un nouveau lien sous 24h.</p>
<p>Tom — Klyora Sites</p>`,
    textContent: `Bonjour ${firstName},\n\nMerci pour votre retour. Pour refaire la maquette, j'ai besoin de :\n- Vos préférences de couleurs\n- Les sections à mettre en avant\n- Un lien Drive avec vos photos (ou j'utilise des photos type)\n- Un site qui vous inspire (même concurrent)\n\nRépondez à ce mail et je relance la génération sous 24h.\n\nTom — Klyora Sites`,
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
      // Skip our own bounces & out-of-office
      if (/postmaster|mailer-daemon|noreply|no-reply|donotreply/i.test(mail.from)) {
        await logMessage(null, mail, "SPAM_OR_BOT", "skipped (system sender)");
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
