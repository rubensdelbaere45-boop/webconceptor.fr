import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════
   POST /api/webhooks/brevo
   Réception des événements Brevo (bounces, plaintes, désabonnements).

   À configurer dans Brevo :
   Dashboard → Paramètres → Webhooks → Transactionnel
   URL : https://www.webconceptor.fr/api/webhooks/brevo
   Événements : hard_bounce, soft_bounce, complaint, unsubscribe, blocked

   Chaque événement Brevo contient :
   {
     event: "hard_bounce" | "soft_bounce" | "complaint" | "unsubscribe" | "blocked" | ...
     email: "contact@example.com"
     date: "2025-01-01T12:00:00Z"
     reason: "..."   (optionnel)
     ...
   }

   Action :
   - hard_bounce / complaint / blocked → unsubscribed_at + note dans error
   - soft_bounce / unsubscribe        → unsubscribed_at seulement
   - Notification Telegram si hard_bounce / complaint (silencieuse)
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

async function notifyTelegram(text: string): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        disable_notification: true, // silencieux
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch { /* silent */ }
}

// Événements qui nécessitent un blocage immédiat et définitif
const HARD_BLOCK_EVENTS = new Set(["hard_bounce", "complaint", "blocked"]);

export async function POST(req: NextRequest) {
  // Brevo ne supporte pas de signature HMAC sur les webhooks transactionnels —
  // on vérifie juste que l'env est OK et que le body est valide.
  // Pour sécuriser davantage : ajouter ?secret=BREVO_WEBHOOK_SECRET à l'URL Brevo
  // et vérifier ici : req.nextUrl.searchParams.get("secret") === process.env.BREVO_WEBHOOK_SECRET

  const webhookSecret = process.env.BREVO_WEBHOOK_SECRET;
  if (webhookSecret) {
    const provided = req.nextUrl.searchParams.get("secret");
    if (provided !== webhookSecret) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = (body.event as string) || "";
  const email = (body.email as string) || "";
  const reason = (body.reason as string) || (body.description as string) || "";

  if (!email || !event) {
    return NextResponse.json({ ok: true, skipped: "missing event or email" });
  }

  // Événements qu'on ignore (livraison OK, ouverture, clic…)
  const IGNORED_EVENTS = new Set(["delivered", "opened", "click", "request", "deferred"]);
  if (IGNORED_EVENTS.has(event)) {
    return NextResponse.json({ ok: true, skipped: `event ${event} ignored` });
  }

  const supabase = getSupabaseAdmin();
  const now = new Date().toISOString();
  const isHardBlock = HARD_BLOCK_EVENTS.has(event);

  // Mise à jour : cherche par email principal OU dans additional_emails
  const updatePayload: Record<string, unknown> = {
    unsubscribed_at: now,
  };

  if (isHardBlock) {
    // Pour les hard bounces / plaintes : on note aussi la raison dans le champ error
    updatePayload.error = `brevo:${event}${reason ? ` — ${reason}` : ""}`;
    // Pour les hard bounces on marque aussi le statut
    updatePayload.status = "error";
  }

  // 1. Mise à jour par email principal
  const { data: updatedMain, error: mainErr } = await supabase
    .from("prospects")
    .update(updatePayload)
    .eq("email", email)
    .is("unsubscribed_at", null) // évite d'écraser si déjà traité
    .select("id, name, city, status");

  if (mainErr) {
    console.error("[brevo/webhook] DB error (main email):", mainErr.message);
  }

  const updatedCount = updatedMain?.length ?? 0;

  // 2. Si pas trouvé par email principal, cherche dans additional_emails (JSONB array)
  if (updatedCount === 0) {
    const { error: altErr } = await supabase
      .from("prospects")
      .update(updatePayload)
      .contains("additional_emails", JSON.stringify([email]))
      .is("unsubscribed_at", null);

    if (altErr) {
      console.error("[brevo/webhook] DB error (additional_emails):", altErr.message);
    }
  }

  // 3. Telegram uniquement pour les événements graves (hard bounce / plainte)
  if (isHardBlock && updatedCount > 0 && updatedMain) {
    const prospect = updatedMain[0];
    const eventLabel =
      event === "hard_bounce" ? "🔴 Hard bounce" :
      event === "complaint"   ? "⚠️ Plainte spam" :
      event === "blocked"     ? "🚫 Bloqué" : event;

    await notifyTelegram(
      `${eventLabel}\n<code>${email}</code>\n` +
      `Prospect : ${prospect.name || "?"} (${prospect.city || "?"})\n` +
      `<i>Marqué comme désabonné + erreur</i>`
    );
  }

  return NextResponse.json({
    ok: true,
    event,
    email,
    updated: updatedCount,
  });
}

// Brevo envoie parfois des GET pour vérifier que l'URL répond
export async function GET() {
  return NextResponse.json({ ok: true, service: "brevo-webhook" });
}
