import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeSaleHash, genesisHash } from "@/lib/caissio-hash";

/* ══════════════════════════════════════════════════════════════════════════
   POST /api/caissio/record-sale
   Enregistre une vente de manière immuable dans Supabase.
   Conforme NF 525 : hash chain SHA-256, aucun UPDATE/DELETE autorisé.
   ══════════════════════════════════════════════════════════════════════════ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL  || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export interface RecordSaleBody {
  user_email:  string;
  store_name:  string;
  address?:    string;
  siret?:      string;
  ticket_num:  string;
  sale_date?:  string;   // ISO — défaut = now()
  subtotal:    number;
  discount:    number;
  total:       number;
  pay_mode:    string;   // "cash" | "card" | "account" | "mixed"
  cash_given?: number;
  change?:     number;
  customer_id?: string;
  mode:        "test" | "live";
  items: Array<{
    name:      string;
    qty:       number;
    unit_price: number;
    tva_rate?: number;
  }>;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as RecordSaleBody;

  if (!body.user_email || !body.store_name || !body.items?.length) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  const supabase = getSupabase();
  const saleDate = body.sale_date || new Date().toISOString();

  /* 1 ── Upsert du commerce ─────────────────────────────────────────────── */
  const { data: storeRow, error: storeErr } = await supabase
    .from("caissio_stores")
    .upsert(
      {
        user_email: body.user_email,
        store_name: body.store_name,
        address:    body.address    || null,
        siret:      body.siret      || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_email", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (storeErr || !storeRow) {
    console.error("[record-sale] store upsert:", storeErr);
    return NextResponse.json({ error: "Erreur commerce" }, { status: 500 });
  }

  const storeId = storeRow.id as string;

  /* 2 ── Récupère le dernier hash de la chaîne ──────────────────────────── */
  const { data: lastSale } = await supabase
    .from("caissio_sales")
    .select("record_hash, sequence_num")
    .eq("store_id", storeId)
    .order("sequence_num", { ascending: false })
    .limit(1)
    .maybeSingle();

  const previousHash  = lastSale?.record_hash   ?? await genesisHash();
  const sequenceNum   = (lastSale?.sequence_num ?? 0) + 1;

  /* 3 ── Calcule le hash NF 525 ─────────────────────────────────────────── */
  const recordHash = await computeSaleHash({
    previous_hash: previousHash,
    ticket_num:    body.ticket_num,
    sale_date:     saleDate,
    total:         body.total,
    pay_mode:      body.pay_mode,
    items:         body.items.map((i) => ({
      name:       i.name,
      qty:        i.qty,
      unit_price: i.unit_price,
    })),
  });

  /* 4 ── Insère la vente (jamais d'UPDATE sur cette table) ──────────────── */
  const { data: saleRow, error: saleErr } = await supabase
    .from("caissio_sales")
    .insert({
      store_id:      storeId,
      user_email:    body.user_email,
      ticket_num:    body.ticket_num,
      sequence_num:  sequenceNum,
      sale_date:     saleDate,
      subtotal:      body.subtotal,
      discount:      body.discount,
      total:         body.total,
      pay_mode:      body.pay_mode,
      cash_given:    body.cash_given  ?? null,
      change_given:  body.change      ?? null,
      customer_id:   body.customer_id ?? null,
      mode:          body.mode,
      previous_hash: previousHash,
      record_hash:   recordHash,
    })
    .select("id")
    .single();

  if (saleErr || !saleRow) {
    console.error("[record-sale] insert:", saleErr);
    return NextResponse.json({ error: "Erreur insertion vente" }, { status: 500 });
  }

  /* 5 ── Insère les lignes de vente ─────────────────────────────────────── */
  const items = body.items.map((i) => ({
    sale_id:      saleRow.id,
    product_name: i.name,
    qty:          i.qty,
    unit_price:   i.unit_price,
    tva_rate:     i.tva_rate ?? 20,
    line_total:   parseFloat((i.unit_price * i.qty).toFixed(2)),
  }));

  const { error: itemsErr } = await supabase
    .from("caissio_sale_items")
    .insert(items);

  if (itemsErr) {
    console.error("[record-sale] items insert:", itemsErr);
    // Non bloquant : la vente existe déjà, on logue l'erreur
  }

  return NextResponse.json({
    ok:           true,
    sale_id:      saleRow.id,
    sequence_num: sequenceNum,
    record_hash:  recordHash,
  });
}
