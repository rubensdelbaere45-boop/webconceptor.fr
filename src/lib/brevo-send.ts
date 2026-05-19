/* ══════════════════════════════════════════
   Helper centralisé d'envoi email Brevo.

   Avantages d'un helper unique :
   - Header `X-Mailin-Trackclicks: 0` désactive le tracking de clic Brevo
     → les liens dans les mails ne sont plus wrappés (r.email-X.brevo.com)
     → score spam baisse de 1-2 points en moyenne
   - Header List-Unsubscribe + List-Unsubscribe-Post (RFC 8058 / Gmail bulk)
     toujours présent par défaut
   - Rate-limit global au niveau process : pause N ms entre chaque appel
     → spread des envois sur la journée, ESP voient une cadence humaine
   - Sender uniforme "Tom Bauer <contact@webconceptor.fr>"

   Tous les endpoints d'envoi (send, blast-flash, final-push, email-reminders,
   cart-abandon, follow-up, send-code) doivent utiliser sendBrevoEmail() au
   lieu d'appeler fetch directement.
   ══════════════════════════════════════════ */

export interface BrevoSendOptions {
  to: string;
  toName?: string;
  subject: string;
  htmlContent: string;
  textContent?: string;
  /** URL de désabonnement one-click (RFC 8058). Si fournie → header
   * List-Unsubscribe + List-Unsubscribe-Post automatiquement injectés. */
  unsubscribeUrl?: string;
  /** Nom de l'expéditeur affiché. Défaut : "Tom Bauer". */
  senderName?: string;
  /** Email de l'expéditeur. Défaut : contact@webconceptor.fr. */
  senderEmail?: string;
  /** Désactive le tracking de clic (= pas de wrapping des liens par Brevo).
   * Défaut : true (meilleure délivrabilité). */
  disableTracking?: boolean;
  /** Timeout en ms. Défaut : 10000. */
  timeoutMs?: number;
}

// Rate-limit global au niveau process : on garde la timestamp du dernier
// envoi pour spacer les requêtes Brevo. Pause minimale entre 2 envois = 200ms
// (suffisant pour ne pas saturer Brevo, sans ralentir trop les batches).
let _lastSendAt = 0;
const MIN_GAP_MS = Number(process.env.BREVO_MIN_GAP_MS || 200);

/**
 * Envoie un email via l'API Brevo SMTP transactionnel.
 * Retourne true si l'API a accepté (HTTP 2xx), false sinon.
 *
 * Side-effects :
 * - Injecte headers anti-spam (List-Unsubscribe, List-Unsubscribe-Post,
 *   X-Mailin-Trackclicks=0)
 * - Rate-limit global : si appelé en burst, espacement de MIN_GAP_MS entre
 *   chaque envoi (par défaut 200 ms = 5 emails/seconde max)
 */
export async function sendBrevoEmail(opts: BrevoSendOptions): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error("[brevo-send] BREVO_API_KEY missing");
    return false;
  }

  // Rate-limit global
  const now = Date.now();
  const wait = Math.max(0, _lastSendAt + MIN_GAP_MS - now);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  _lastSendAt = Date.now();

  const headers: Record<string, string> = {};

  // List-Unsubscribe (RFC 2369 + RFC 8058) — Gmail/Yahoo bulk policy depuis fév 2024
  if (opts.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${opts.unsubscribeUrl}>, <mailto:unsubscribe@webconceptor.fr?subject=unsubscribe>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }

  // Tracking de clic Brevo : désactive par défaut (préserve les liens en
  // clair dans les mails → délivrabilité améliorée)
  if (opts.disableTracking !== false) {
    headers["X-Mailin-Trackclicks"] = "0";
  }

  const body: Record<string, unknown> = {
    sender: {
      name: opts.senderName || "Tom Bauer",
      email: opts.senderEmail || "contact@webconceptor.fr",
    },
    to: [{ email: opts.to, name: opts.toName || opts.to }],
    subject: opts.subject,
    htmlContent: opts.htmlContent,
  };
  if (opts.textContent) body.textContent = opts.textContent;
  if (Object.keys(headers).length > 0) body.headers = headers;

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(opts.timeoutMs || 10_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error("[brevo-send] HTTP", res.status, detail.slice(0, 300));
      return false;
    }
    return true;
  } catch (err) {
    console.error("[brevo-send] fetch error:", err);
    return false;
  }
}
