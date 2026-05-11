import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, escapeTelegram, isWithinSendingHours } from "@/lib/security";

/* ══════════════════════════════════════════
   POST /api/prospect/follow-up
   Séquence de relance automatique — appelée quotidiennement par n8n.

   Règle 1 (J+3 après ouverture) :
     - Status = "opened" depuis 3 jours et pas "converted"
     - On envoie un mail DOUX qui rappelle la maquette et invite à discuter
     - Le prospect a regardé mais pas acheté → rassurer, lever objections

   Règle 2 (J+7 dernier rappel) :
     - Status = "opened" ou "sent" depuis 7 jours et pas "converted"
     - On envoie un DERNIER rappel avec urgence légère
     - Dernière chance avant oubli

   On marque les prospects avec notes datées pour ne pas re-envoyer 2× la même relance.
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false;
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "Tom Bauer", email: "contact@webconceptor.fr" },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function followUpDay3Email(prospectName: string, mockupUrl: string): string {
  return `<div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0a0a0a;line-height:1.6">
  <p style="font-size:15px;margin-bottom:16px">Bonjour,</p>
  <p style="font-size:15px;margin-bottom:16px">Je reviens vers vous car j'ai vu que vous aviez jeté un œil à la maquette que j'avais préparée pour <strong>${prospectName}</strong>.</p>
  <p style="font-size:15px;margin-bottom:16px">Est-ce que quelque chose vous plaît particulièrement ? Ou au contraire, avez-vous eu des réserves que je pourrais lever ?</p>
  <div style="background:#fafafa;border-left:3px solid #872175;padding:20px;margin:24px 0;border-radius:6px">
    <p style="font-size:13px;color:#525252;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.1em;font-weight:700">Voir ou revoir la maquette</p>
    <a href="${mockupUrl}" style="display:inline-block;margin-top:8px;padding:12px 24px;background:#0066ff;color:#fff;text-decoration:none;border-radius:100px;font-weight:600;font-size:14px">Voir ma maquette →</a>
  </div>
  <p style="font-size:14px;color:#525252;margin-bottom:16px"><strong>Pour rappel :</strong> 199 € TTC tout compris, livraison en 5 jours, ou en 3 fois sans frais via Klarna (3 × 66,33 €).</p>
  <p style="font-size:14px;color:#525252;margin-bottom:24px">Répondez-moi simplement à ce mail si vous avez la moindre question — je m'adapte à vos envies (photos, couleurs, textes).</p>
  <div style="border-top:1px solid #e5e5e5;padding-top:20px;font-size:13px;color:#737373">
    <p style="margin-bottom:4px"><strong style="color:#0a0a0a">Tom Bauer</strong></p>
    <p style="margin-bottom:4px">Fondateur, WebConceptor</p>
    <p style="margin-bottom:2px">contact@webconceptor.fr &middot; 06 35 59 24 71</p>
    <p><a href="https://webconceptor.fr" style="color:#0066ff;text-decoration:none">webconceptor.fr</a></p>
  </div>
</div>`;
}

function followUpDay7Email(prospectName: string, mockupUrl: string): string {
  return `<div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px;color:#0a0a0a;line-height:1.6">
  <p style="font-size:15px;margin-bottom:16px">Bonjour,</p>
  <p style="font-size:15px;margin-bottom:16px">Je me permets un dernier petit message — je ne veux pas encombrer votre boîte mail.</p>
  <p style="font-size:15px;margin-bottom:16px">La maquette que j'avais préparée pour <strong>${prospectName}</strong> est toujours en ligne. Si vous souhaitez avancer, je peux commencer la création de votre site dès cette semaine et la livrer en 5 jours.</p>
  <div style="background:#fffbeb;border-left:3px solid #f59e0b;padding:18px 20px;margin:24px 0;border-radius:6px">
    <p style="font-size:13px;color:#78350f;margin-bottom:6px;font-weight:600">Sans réponse de votre part, je retirerai la maquette de nos serveurs dans les prochains jours.</p>
    <p style="font-size:13px;color:#78350f;margin:0">C'est juste pour libérer l'espace — vous pouvez toujours revenir vers moi à tout moment.</p>
  </div>
  <div style="text-align:center;margin:28px 0">
    <a href="${mockupUrl}" style="display:inline-block;padding:14px 32px;background:#0066ff;color:#fff;text-decoration:none;border-radius:100px;font-weight:600;font-size:15px">Voir ma maquette une dernière fois →</a>
  </div>
  <p style="font-size:14px;color:#525252;margin-bottom:16px">199 € TTC tout compris — 3 fois sans frais via Klarna si besoin.</p>
  <p style="font-size:14px;color:#525252;margin-bottom:24px">Merci en tout cas d'avoir pris le temps de regarder — bonne continuation avec <strong>${prospectName}</strong> !</p>
  <div style="border-top:1px solid #e5e5e5;padding-top:20px;font-size:13px;color:#737373">
    <p style="margin-bottom:4px"><strong style="color:#0a0a0a">Tom Bauer</strong></p>
    <p style="margin-bottom:4px">Fondateur, WebConceptor</p>
    <p style="margin-bottom:2px">contact@webconceptor.fr &middot; 06 35 59 24 71</p>
  </div>
</div>`;
}

function hasFollowUp(notes: string | null | undefined, tag: string): boolean {
  if (!notes) return false;
  return notes.includes(tag);
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  // Pas d'envoi en dehors de la plage horaire (respect du prospect)
  if (!isWithinSendingHours(9, 19)) {
    return NextResponse.json({ success: true, processed: 0, skipped_curfew: true });
  }

  const supabase = getSupabaseAdmin();
  const now = new Date();
  const day3Cutoff = new Date(now.getTime() - 3 * 24 * 3600 * 1000).toISOString();
  const day7Cutoff = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();

  // J+3 : prospects "opened" depuis 3+ jours, pas encore relancés
  const { data: day3Candidates } = await supabase
    .from("prospects")
    .select("id, name, slug, email, notes, opened_at, status")
    .eq("status", "opened")
    .not("email", "is", null)
    .lt("opened_at", day3Cutoff)
    .limit(30);

  // J+7 : prospects "sent" ou "opened" depuis 7+ jours, pas encore relancés J+7
  const { data: day7Candidates } = await supabase
    .from("prospects")
    .select("id, name, slug, email, notes, sent_at, status")
    .in("status", ["sent", "opened"])
    .not("email", "is", null)
    .lt("sent_at", day7Cutoff)
    .limit(30);

  const origin = "https://webconceptor.fr";
  const results: Array<{ id: string; name: string; stage: string; status: "sent" | "skipped" | "failed" }> = [];
  let sentCount = 0;

  // === J+3 ===
  const TAG_DAY3 = "[FOLLOWUP_D3]";
  for (const p of day3Candidates || []) {
    if (hasFollowUp(p.notes, TAG_DAY3)) {
      results.push({ id: p.id, name: p.name, stage: "J+3", status: "skipped" });
      continue;
    }
    const mockupUrl = `${origin}/prospects/${p.slug}`;
    const subject = `Votre maquette pour ${p.name} — on en parle ?`;
    const ok = await sendEmail(p.email, subject, followUpDay3Email(p.name, mockupUrl));
    const newNote = `[${now.toISOString().slice(0, 16).replace("T", " ")}] 🔁 Relance J+3 envoyée ${TAG_DAY3}\n${p.notes || ""}`;
    await supabase.from("prospects").update({ notes: newNote }).eq("id", p.id);
    results.push({ id: p.id, name: p.name, stage: "J+3", status: ok ? "sent" : "failed" });
    if (ok) sentCount++;
  }

  // === J+7 ===
  const TAG_DAY7 = "[FOLLOWUP_D7]";
  for (const p of day7Candidates || []) {
    if (hasFollowUp(p.notes, TAG_DAY7)) {
      results.push({ id: p.id, name: p.name, stage: "J+7", status: "skipped" });
      continue;
    }
    const mockupUrl = `${origin}/prospects/${p.slug}`;
    const subject = `Dernier message — la maquette pour ${p.name}`;
    const ok = await sendEmail(p.email, subject, followUpDay7Email(p.name, mockupUrl));
    const newNote = `[${now.toISOString().slice(0, 16).replace("T", " ")}] 🔚 Relance J+7 envoyée ${TAG_DAY7}\n${p.notes || ""}`;
    await supabase.from("prospects").update({ notes: newNote }).eq("id", p.id);
    results.push({ id: p.id, name: p.name, stage: "J+7", status: ok ? "sent" : "failed" });
    if (ok) sentCount++;
  }

  // Telegram silencieux : rapport de la session de relances
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId && sentCount > 0) {
    const summary = `🔁 <b>Relances auto envoyées</b>\n\n<b>Total :</b> ${sentCount}\n<b>J+3 :</b> ${results.filter((r) => r.stage === "J+3" && r.status === "sent").length}\n<b>J+7 :</b> ${results.filter((r) => r.stage === "J+7" && r.status === "sent").length}`;
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: summary,
        parse_mode: "HTML",
        disable_notification: true,
      }),
    }).catch(() => { /* silent */ });
  }
  // évite un lint unused-var si escapeTelegram n'est utilisé nulle part
  void escapeTelegram;

  return NextResponse.json({
    success: true,
    processed: results.length,
    sent: sentCount,
    results,
  });
}
