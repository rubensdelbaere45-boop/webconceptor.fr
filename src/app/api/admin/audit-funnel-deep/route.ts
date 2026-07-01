/**
 * GET /api/admin/audit-funnel-deep
 *
 * Audit approfondi du funnel : comportement détaillé des prospects qui ont
 * saisi leur code d'accès (les plus chauds), état Stripe, et répartition
 * des pertes par étape.
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

export async function GET(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const supabase = db();

  // ─── Les prospects qui ont déverrouillé leur maquette (les plus chauds) ───
  const { data: unlockers } = await supabase
    .from("prospects")
    .select("slug, name, city, business_type, access_code_first_unlocked_at, view_count, cart_opened_at, opened_at, sent_at, status, unsubscribed_at")
    .not("access_code_first_unlocked_at", "is", null)
    .order("access_code_first_unlocked_at", { ascending: false });

  // ─── Prospects avec modal achat ouvert (cart_opened_at = colonne réellement écrite) ───
  const { data: modalOpeners } = await supabase
    .from("prospects")
    .select("slug, name, business_type, cart_opened_at, view_count, access_code_first_unlocked_at, status, email, phone")
    .not("cart_opened_at", "is", null)
    .order("cart_opened_at", { ascending: false })
    .limit(50);

  // ─── Pourquoi 55 % n'ont pas reçu le mail code ? ───
  const { count: sentNoCode } = await supabase
    .from("prospects")
    .select("*", { count: "exact", head: true })
    .not("sent_at", "is", null)
    .is("access_code_sent_at", null);

  // ─── Stripe : sessions checkout créées ───
  let stripeSummary: Record<string, unknown> = { error: "STRIPE_SECRET_KEY absent" };
  const sk = process.env.STRIPE_SECRET_KEY;
  if (sk) {
    try {
      const res = await fetch("https://api.stripe.com/v1/checkout/sessions?limit=100", {
        headers: { Authorization: `Bearer ${sk}` },
      });
      const j = await res.json();
      const sessions = (j.data || []) as Array<{
        id: string; status: string; payment_status: string; created: number;
        amount_total: number | null; customer_details?: { email?: string } | null;
      }>;
      stripeSummary = {
        total_sessions: sessions.length,
        complete: sessions.filter(s => s.status === "complete").length,
        open_abandoned: sessions.filter(s => s.status === "open" || s.status === "expired").length,
        paid: sessions.filter(s => s.payment_status === "paid").length,
        dernieres_5: sessions.slice(0, 5).map(s => ({
          date: new Date(s.created * 1000).toISOString().slice(0, 16),
          status: s.status,
          payment: s.payment_status,
          montant: s.amount_total ? s.amount_total / 100 : null,
          email: s.customer_details?.email || null,
        })),
      };
    } catch (e) {
      stripeSummary = { error: e instanceof Error ? e.message : "fetch fail" };
    }
  }

  // ─── Répartition par métier des ouvreurs (où le mail marche le mieux) ───
  const { data: openedByType } = await supabase
    .from("prospects")
    .select("business_type")
    .not("opened_at", "is", null);
  const typeCount: Record<string, number> = {};
  for (const r of openedByType || []) {
    const t = (r as { business_type: string | null }).business_type || "inconnu";
    typeCount[t] = (typeCount[t] || 0) + 1;
  }

  return NextResponse.json({
    unlockers_27: (unlockers || []).map(u => ({
      slug: u.slug,
      name: u.name,
      metier: u.business_type,
      ville: u.city,
      code_saisi_le: u.access_code_first_unlocked_at?.slice(0, 16),
      vues: u.view_count,
      modal_achat_ouvert: u.cart_opened_at ? u.cart_opened_at.slice(0, 16) : "JAMAIS",
      statut: u.status,
      desabonne: !!u.unsubscribed_at,
    })),
    modal_openers: (modalOpeners || []).map(m => ({
      slug: m.slug, name: m.name, metier: m.business_type,
      modal_le: m.cart_opened_at?.slice(0, 16), vues: m.view_count,
      statut: m.status, email: m.email, tel: m.phone,
    })),
    perte_mail_code: {
      envoyes_sans_mail_code: sentNoCode,
      note: "Prospects ayant reçu le mail initial mais jamais le mail code accès",
    },
    stripe: stripeSummary,
    ouvreurs_par_metier: Object.fromEntries(Object.entries(typeCount).sort((a, b) => b[1] - a[1]).slice(0, 15)),
  });
}
