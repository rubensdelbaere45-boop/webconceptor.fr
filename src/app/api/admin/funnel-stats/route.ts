/**
 * GET /api/admin/funnel-stats
 *
 * Mesure le funnel complet de conversion Klyora :
 *   Mails envoyés → Opens → Code saisi → Modal achat → Checkout → Vente
 *
 * Permet de localiser EXACTEMENT où les prospects abandonnent.
 *
 * Auth : x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

async function count(q: ReturnType<ReturnType<typeof db>["from"]>): Promise<number> {
  const { count: c } = await (q as unknown as { select: (s: string, opts: object) => { count: number | null } })
    .select("*", { count: "exact", head: true });
  return c || 0;
}

export async function GET(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = db();

  // ─── Comptage par étape ─────────────────────────────────────────────
  const totalProspectsR = await supabase.from("prospects").select("*", { count: "exact", head: true });
  const totalProspects = totalProspectsR.count || 0;

  const hasMockupR = await supabase.from("prospects").select("*", { count: "exact", head: true }).not("mockup_html", "is", null);
  const hasMockup = hasMockupR.count || 0;

  const hasEmailR = await supabase.from("prospects").select("*", { count: "exact", head: true }).not("email", "is", null);
  const hasEmail = hasEmailR.count || 0;

  const sentR = await supabase.from("prospects").select("*", { count: "exact", head: true }).not("sent_at", "is", null);
  const sent = sentR.count || 0;

  const accessSentR = await supabase.from("prospects").select("*", { count: "exact", head: true }).not("access_code_sent_at", "is", null);
  const accessCodeMailSent = accessSentR.count || 0;

  const openedR = await supabase.from("prospects").select("*", { count: "exact", head: true }).not("opened_at", "is", null);
  const opened = openedR.count || 0;

  const codeUnlockedR = await supabase.from("prospects").select("*", { count: "exact", head: true }).not("access_code_first_unlocked_at", "is", null);
  const codeUnlocked = codeUnlockedR.count || 0;

  const convertedR = await supabase.from("prospects").select("*", { count: "exact", head: true }).eq("status", "converted");
  const converted = convertedR.count || 0;

  const unsubscribedR = await supabase.from("prospects").select("*", { count: "exact", head: true }).not("unsubscribed_at", "is", null);
  const unsubscribed = unsubscribedR.count || 0;

  // ─── Tentatives d'accès (codes saisis) ─────────────────────────────
  const accessAttemptsR = await supabase.from("prospect_access_attempts").select("*", { count: "exact", head: true });
  const totalAttempts = accessAttemptsR.count || 0;

  const successAttemptsR = await supabase.from("prospect_access_attempts").select("*", { count: "exact", head: true }).eq("success", true);
  const successAttempts = successAttemptsR.count || 0;

  // ─── Mails entrants traités par l'agent ────────────────────────────
  const totalIncomingR = await supabase.from("prospect_email_messages").select("*", { count: "exact", head: true });
  const totalIncoming = totalIncomingR.count || 0;

  // ─── Calcul des taux ───────────────────────────────────────────────
  const pct = (n: number, d: number) => (d === 0 ? "0%" : `${((n / d) * 100).toFixed(1)}%`);

  return NextResponse.json({
    funnel: {
      "1. Prospects en base":            { count: totalProspects },
      "2. Avec mockup généré":           { count: hasMockup,            taux_vs_total: pct(hasMockup, totalProspects) },
      "3. Avec email valide":            { count: hasEmail,             taux_vs_total: pct(hasEmail, totalProspects) },
      "4. Mail initial envoyé":          { count: sent,                 taux_vs_email: pct(sent, hasEmail) },
      "5. Mail code accès envoyé":       { count: accessCodeMailSent,   taux_vs_sent: pct(accessCodeMailSent, sent) },
      "6. Mail OUVERT (1ère fois)":      { count: opened,               taux_vs_sent: pct(opened, sent) },
      "7. CODE saisi avec succès":       { count: codeUnlocked,         taux_vs_opened: pct(codeUnlocked, opened) },
      "8. VENTE (status=converted)":     { count: converted,            taux_vs_codes: pct(converted, codeUnlocked) },
    },
    leakage: {
      desabonnes_total: unsubscribed,
      tentatives_code_total: totalAttempts,
      tentatives_code_reussies: successAttempts,
      tentatives_code_taux: pct(successAttempts, totalAttempts),
      mails_entrants_traites_agent: totalIncoming,
    },
    diagnostic: {
      "Goulot principal": (
        opened === 0 ? "Aucun open — vérifier deliverability Brevo + Spam"
        : codeUnlocked === 0 ? "Aucun code saisi — gate trop friction / mail code pas reçu"
        : converted === 0 ? "Codes saisis OK mais 0 vente — maquette pas convaincante OU CTA achat caché OU Stripe bug"
        : "Conversion en cours"
      ),
      "Taux open / sent": pct(opened, sent),
      "Taux code / open": pct(codeUnlocked, opened),
      "Taux vente / code": pct(converted, codeUnlocked),
    },
  });
}
