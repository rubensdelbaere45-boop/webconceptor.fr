import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { computeClosureHash } from "@/lib/caissio-hash";

/* ══════════════════════════════════════════════════════════════════════════
   POST /api/caissio/closure
   Génère une clôture (Z-report) journalière, mensuelle ou annuelle.
   Conforme NF 525 — archivage immuable, hash enchaîné.

   Body: { user_email, type: "daily"|"monthly"|"annual" }
   ══════════════════════════════════════════════════════════════════════════ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL  || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export async function POST(req: NextRequest) {
  const { user_email, type = "daily" } = await req.json();
  if (!user_email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  const supabase = getSupabase();

  /* Store */
  const { data: store } = await supabase
    .from("caissio_stores")
    .select("id, store_name")
    .eq("user_email", user_email)
    .maybeSingle();

  if (!store) return NextResponse.json({ error: "Commerce non trouvé" }, { status: 404 });

  /* Calcule la période */
  const now        = new Date();
  let periodStart: Date;

  if (type === "annual") {
    periodStart = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
  } else if (type === "monthly") {
    periodStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
  } else {
    periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  }
  const periodEnd = now;

  /* Ventes de la période (mode live uniquement) */
  const { data: sales } = await supabase
    .from("caissio_sales")
    .select("total, pay_mode, record_hash, sequence_num")
    .eq("store_id", store.id)
    .eq("mode", "live")
    .gte("sale_date", periodStart.toISOString())
    .lte("sale_date", periodEnd.toISOString())
    .order("sequence_num", { ascending: true });

  const salesTotals = (sales || []).reduce(
    (acc, s) => {
      acc.count++;
      acc.total += Number(s.total);
      if (s.pay_mode === "cash")    acc.cash    += Number(s.total);
      if (s.pay_mode === "card")    acc.card    += Number(s.total);
      if (s.pay_mode === "account") acc.account += Number(s.total);
      return acc;
    },
    { count: 0, total: 0, cash: 0, card: 0, account: 0 }
  );

  const lastSaleHash = sales?.at(-1)?.record_hash ?? "NO_SALES";

  /* Hash de la dernière clôture */
  const { data: lastClosure } = await supabase
    .from("caissio_closures")
    .select("closure_hash")
    .eq("store_id", store.id)
    .eq("closure_type", type)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const previousClosureHash = lastClosure?.closure_hash ?? "CAISSIO-FIRST-CLOSURE";

  const closureHash = await computeClosureHash({
    previous_closure_hash: previousClosureHash,
    period_start:          periodStart.toISOString(),
    period_end:            periodEnd.toISOString(),
    total_sales:           salesTotals.count,
    total_amount:          salesTotals.total,
    last_sale_hash:        lastSaleHash,
  });

  /* Insère la clôture */
  const { data: closureRow, error } = await supabase
    .from("caissio_closures")
    .insert({
      store_id:             store.id,
      user_email,
      closure_type:         type,
      period_start:         periodStart.toISOString(),
      period_end:           periodEnd.toISOString(),
      total_sales:          salesTotals.count,
      total_amount:         parseFloat(salesTotals.total.toFixed(2)),
      total_cash:           parseFloat(salesTotals.cash.toFixed(2)),
      total_card:           parseFloat(salesTotals.card.toFixed(2)),
      total_account:        parseFloat(salesTotals.account.toFixed(2)),
      last_sale_hash:       lastSaleHash,
      previous_closure_hash: previousClosureHash,
      closure_hash:         closureHash,
    })
    .select("id")
    .single();

  if (error) {
    console.error("[closure]", error);
    return NextResponse.json({ error: "Erreur clôture" }, { status: 500 });
  }

  return NextResponse.json({
    ok:           true,
    closure_id:   closureRow.id,
    type,
    period_start: periodStart.toISOString(),
    period_end:   periodEnd.toISOString(),
    total_sales:  salesTotals.count,
    total_amount: salesTotals.total.toFixed(2),
    total_cash:   salesTotals.cash.toFixed(2),
    total_card:   salesTotals.card.toFixed(2),
    total_account: salesTotals.account.toFixed(2),
    closure_hash: closureHash,
  });
}

/* GET — liste les clôtures passées */
export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email") || "";
  if (!email) return NextResponse.json({ error: "Email requis" }, { status: 400 });

  const supabase = getSupabase();

  const { data: store } = await supabase
    .from("caissio_stores")
    .select("id")
    .eq("user_email", email)
    .maybeSingle();

  if (!store) return NextResponse.json({ closures: [] });

  const { data: closures } = await supabase
    .from("caissio_closures")
    .select("*")
    .eq("store_id", store.id)
    .order("created_at", { ascending: false })
    .limit(30);

  return NextResponse.json({ closures: closures || [] });
}
