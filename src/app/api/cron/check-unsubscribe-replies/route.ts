/**
 * GET /api/cron/check-unsubscribe-replies
 *
 * Scan la boîte IMAP IONOS de Tom toutes les 30 min :
 *   1. Récupère les emails non-lus reçus dans les 60 dernières min
 *   2. Pour chacun, parse le from + body
 *   3. Si le body contient un pattern "stop / pas intéressé / unsubscribe / spam"
 *      → désabonne le prospect en base (prospects.unsubscribed_at)
 *      → tagge avec la raison
 *   4. Marque le message comme lu
 *   5. Notif Telegram avec récap
 *
 * Auth :
 *   - Header Vercel: Authorization: Bearer $CRON_SECRET
 *   - OU x-admin-key (pour test)
 *
 * Env vars requises (à coller sur Vercel) :
 *   - IONOS_IMAP_HOST     = imap.ionos.fr
 *   - IONOS_IMAP_USER     = ton@adresse.ionos
 *   - IONOS_IMAP_PASSWORD = mot de passe IMAP IONOS
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const STOP_PATTERNS: Array<{ rx: RegExp; reason: string }> = [
  { rx: /\bstop\b/i,                                      reason: "stop" },
  { rx: /\bdésabonn(e?[rzs]?)\b/i,                        reason: "désabonner" },
  { rx: /\bdésinscri(re|ption|s|ption)\b/i,               reason: "désinscrire" },
  { rx: /\bunsubscribe\b/i,                               reason: "unsubscribe" },
  { rx: /\bopt[\s\-_]?out\b/i,                            reason: "opt-out" },
  { rx: /ne plus (rec[eo]voir|m'envoyer|envoyer)/i,       reason: "ne plus recevoir" },
  { rx: /pas (vraiment )?intéressé/i,                     reason: "pas intéressé" },
  { rx: /arrêt(ez|er) (les|le) (mail|envoi|spam)/i,       reason: "arrêter les mails" },
  { rx: /\bspam(s|mer)?\b/i,                              reason: "spam" },
  { rx: /supprim(ez|er) (mon|ma|moi|nous)/i,              reason: "supprimer" },
  { rx: /retir(ez|er|e) (moi|nous|mon|ma)/i,              reason: "retirer" },
  { rx: /ne me contactez? plus/i,                         reason: "ne plus contacter" },
];

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

function isAuthorized(req: NextRequest): boolean {
  const auth = req.headers.get("authorization") || "";
  const cronOk = auth.startsWith("Bearer ") && safeCompare(auth.slice(7), process.env.CRON_SECRET || "");
  const adminOk = safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY || "");
  return cronOk || adminOk;
}

function detectStopReason(text: string): string | null {
  const lower = text.toLowerCase();
  for (const { rx, reason } of STOP_PATTERNS) {
    if (rx.test(lower)) return reason;
  }
  return null;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const host = process.env.IONOS_IMAP_HOST || "imap.ionos.fr";
  const user = process.env.IONOS_IMAP_USER || "";
  const pass = process.env.IONOS_IMAP_PASSWORD || "";
  if (!user || !pass) {
    return NextResponse.json({
      error: "IONOS_IMAP_USER + IONOS_IMAP_PASSWORD doivent être configurés sur Vercel",
      help: "Settings → Env Vars → ajoute IONOS_IMAP_HOST + USER + PASSWORD",
    }, { status: 500 });
  }

  const client = new ImapFlow({
    host,
    port: 993,
    secure: true,
    auth: { user, pass },
    logger: false,
    socketTimeout: 30_000,
  });

  const results: Array<{ from: string; subject: string; reason: string; unsubscribed?: boolean; matched_prospect?: string }> = [];
  let totalScanned = 0;
  let totalUnsubscribed = 0;

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      // Recherche les non-lus depuis 24h
      const since = new Date(Date.now() - 24 * 3600 * 1000);
      const messageIds = await client.search({ seen: false, since });

      if (!messageIds || messageIds.length === 0) {
        await lock.release();
        await client.logout();
        return NextResponse.json({ success: true, scanned: 0, unsubscribed: 0, message: "Aucun mail non-lu récent" });
      }

      const supabase = db();

      // Limit batch pour ne pas dépasser 60s Vercel
      const toProcess = messageIds.slice(-30); // 30 derniers max
      totalScanned = toProcess.length;

      for (const uid of toProcess) {
        try {
          const msg = await client.fetchOne(uid as any, { source: true, envelope: true, uid: true } as any);
          if (!msg || !msg.source) continue;

          const parsed = await simpleParser(msg.source as Buffer);
          const fromAddr = (parsed.from?.value?.[0]?.address || "").toLowerCase().trim();
          const subject = parsed.subject || "";
          const bodyText = (parsed.text || "").slice(0, 5000); // limite à 5KB

          // Détection
          const fullText = `${subject}\n\n${bodyText}`;
          const reason = detectStopReason(fullText);

          if (!reason || !fromAddr) {
            // Pas de pattern stop → on laisse le mail comme non-lu pour que Tom le voie
            continue;
          }

          // Match prospect en base par email
          const { data: prospect } = await supabase
            .from("prospects")
            .select("id, name, email, unsubscribed_at")
            .eq("email", fromAddr)
            .maybeSingle();

          let unsubscribed = false;
          if (prospect && !prospect.unsubscribed_at) {
            await supabase.from("prospects").update({
              unsubscribed_at: new Date().toISOString(),
              unsubscribe_reason: `auto_reply: ${reason}`,
              updated_at: new Date().toISOString(),
            }).eq("id", prospect.id);
            unsubscribed = true;
            totalUnsubscribed++;
          }

          // Marque comme lu pour ne pas re-traiter
          try {
            await client.messageFlagsAdd(uid as any, ["\\Seen"]);
          } catch { /* tolère */ }

          results.push({
            from: fromAddr,
            subject: subject.slice(0, 80),
            reason,
            unsubscribed,
            matched_prospect: prospect?.name || undefined,
          });
        } catch (e) {
          console.warn("[check-unsubscribe] message error:", e);
          continue;
        }
      }
    } finally {
      lock.release();
    }
    await client.logout();
  } catch (e) {
    try { await client.logout(); } catch { /* tolère */ }
    return NextResponse.json({
      error: "IMAP connection failed",
      details: e instanceof Error ? e.message : "unknown",
    }, { status: 500 });
  }

  // Telegram récap
  const tg = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (tg && chat && totalUnsubscribed > 0) {
    const list = results.filter(r => r.unsubscribed)
      .map(r => `• ${r.matched_prospect || r.from} (${r.reason})`)
      .join("\n")
      .slice(0, 2000);
    fetch(`https://api.telegram.org/bot${tg}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        parse_mode: "HTML",
        disable_notification: true,
        text: `🚫 <b>Désabonnements auto (IONOS IMAP)</b>\n\n<b>Scannés :</b> ${totalScanned}\n<b>Désabonnés :</b> ${totalUnsubscribed}\n\n${list}`,
      }),
    }).catch(() => {});
  }

  return NextResponse.json({
    success: true,
    scanned: totalScanned,
    unsubscribed: totalUnsubscribed,
    results,
  });
}

export const POST = GET;
