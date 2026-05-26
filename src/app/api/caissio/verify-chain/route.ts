import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeSaleHash, genesisHash } from "@/lib/caissio-hash";

/* ══════════════════════════════════════════════════════════════════════════
   GET /api/caissio/verify-chain?email=xxx
   Vérifie l'intégrité complète de la chaîne de hachage NF 525.
   Recompute chaque hash et compare. Toute altération est détectée.
   ══════════════════════════════════════════════════════════════════════════ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL  || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") || "";
  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  const supabase = getSupabase();

  /* Récupère le store */
  const { data: store } = await supabase
    .from("caissio_stores")
    .select("id, store_name")
    .eq("user_email", email)
    .maybeSingle();

  if (!store) {
    return NextResponse.json({ ok: true, total: 0, broken: 0, message: "Aucune vente enregistrée" });
  }

  /* Charge toutes les ventes triées par séquence */
  const { data: sales, error } = await supabase
    .from("caissio_sales")
    .select("id, sequence_num, ticket_num, sale_date, total, pay_mode, previous_hash, record_hash")
    .eq("store_id", store.id)
    .order("sequence_num", { ascending: true });

  if (error) {
    return NextResponse.json({ error: "Erreur lecture" }, { status: 500 });
  }

  if (!sales || sales.length === 0) {
    return NextResponse.json({ ok: true, total: 0, broken: 0, message: "Aucune vente" });
  }

  /* Vérifie chaque hash */
  const genesis   = await genesisHash();
  const broken: Array<{ seq: number; ticket: string; reason: string }> = [];
  let expectedPrevHash = genesis;

  for (const sale of sales) {
    /* Charge les items pour recalculer */
    const { data: items } = await supabase
      .from("caissio_sale_items")
      .select("product_name, qty, unit_price")
      .eq("sale_id", sale.id);

    /* Vérifie la cohérence du previous_hash */
    if (sale.previous_hash !== expectedPrevHash) {
      broken.push({
        seq:    sale.sequence_num,
        ticket: sale.ticket_num,
        reason: `previous_hash rompu (attendu: ${expectedPrevHash.slice(0, 8)}…, trouvé: ${sale.previous_hash.slice(0, 8)}…)`,
      });
    }

    /* Recalcule le hash */
    const expected = await computeSaleHash({
      previous_hash: sale.previous_hash,
      ticket_num:    sale.ticket_num,
      sale_date:     sale.sale_date,
      total:         Number(sale.total),
      pay_mode:      sale.pay_mode,
      items:         (items || []).map((i: { product_name: string; qty: number; unit_price: number }) => ({
        name:       i.product_name,
        qty:        i.qty,
        unit_price: Number(i.unit_price),
      })),
    });

    if (expected !== sale.record_hash) {
      broken.push({
        seq:    sale.sequence_num,
        ticket: sale.ticket_num,
        reason: `hash altéré (attendu: ${expected.slice(0, 8)}…, trouvé: ${sale.record_hash.slice(0, 8)}…)`,
      });
    }

    expectedPrevHash = sale.record_hash;
  }

  return NextResponse.json({
    ok:          broken.length === 0,
    store:       store.store_name,
    total:       sales.length,
    broken:      broken.length,
    verified_at: new Date().toISOString(),
    errors:      broken.length > 0 ? broken : undefined,
    message:     broken.length === 0
      ? `✅ Chaîne intègre — ${sales.length} vente(s) vérifiée(s)`
      : `❌ ${broken.length} enregistrement(s) altéré(s) sur ${sales.length}`,
  });
}
