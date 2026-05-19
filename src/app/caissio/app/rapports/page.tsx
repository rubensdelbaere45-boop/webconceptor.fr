"use client";
import { useState, useEffect } from "react";
import { FileBarChart2, TrendingUp, ShoppingBag, Receipt, Download } from "lucide-react";
import { getSales, getProducts, type Sale } from "@/lib/caissio-store";

function fmt(n: number) { return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }); }

type Period = "today" | "week" | "month" | "all";

function filterByPeriod(sales: Sale[], period: Period): Sale[] {
  const now = new Date();
  const start = new Date();
  if (period === "today") { start.setHours(0, 0, 0, 0); }
  else if (period === "week") { start.setDate(now.getDate() - 7); start.setHours(0, 0, 0, 0); }
  else if (period === "month") { start.setDate(1); start.setHours(0, 0, 0, 0); }
  else return sales;
  return sales.filter((s) => new Date(s.created_at) >= start);
}

export default function RapportsPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [period, setPeriod] = useState<Period>("month");
  const [productMap, setProductMap] = useState<Record<string, string>>({});

  useEffect(() => {
    setSales(getSales().sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    const pm: Record<string, string> = {};
    getProducts().forEach((p) => { pm[p.id] = p.name; });
    setProductMap(pm);
  }, []);

  const filtered = filterByPeriod(sales, period);
  const totalCA = filtered.reduce((s, t) => s + t.total, 0);
  const totalTickets = filtered.length;
  const avgBasket = totalTickets > 0 ? totalCA / totalTickets : 0;
  const totalItems = filtered.reduce((s, t) => s + t.items.reduce((a, i) => a + i.qty, 0), 0);

  // Top products from filtered
  const prodAgg: Record<string, { name: string; qty: number; revenue: number }> = {};
  filtered.forEach((s) => {
    s.items.forEach((item) => {
      if (!prodAgg[item.product_id]) prodAgg[item.product_id] = { name: productMap[item.product_id] || item.product_id, qty: 0, revenue: 0 };
      prodAgg[item.product_id].qty += item.qty;
      prodAgg[item.product_id].revenue += item.qty * item.price;
    });
  });
  const topProds = Object.values(prodAgg).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

  const exportCSV = () => {
    const rows = [["Date", "N° ticket", "Articles", "Total", "Paiement"].join(";")];
    filtered.forEach((s) => {
      rows.push([
        new Date(s.created_at).toLocaleString("fr-FR"),
        s.id.slice(-8).toUpperCase(),
        s.items.map((i) => `${productMap[i.product_id] || "?"} x${i.qty}`).join(", "),
        s.total.toFixed(2).replace(".", ","),
        s.payment_method,
      ].join(";"));
    });
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `caissio-rapports-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const PERIODS: { key: Period; label: string }[] = [
    { key: "today", label: "Aujourd'hui" },
    { key: "week", label: "7 derniers jours" },
    { key: "month", label: "Ce mois" },
    { key: "all", label: "Tout" },
  ];

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'IBM Plex Sans',sans-serif", maxWidth: 1100 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 4 }}>Analytique</div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 32, fontWeight: 900, color: "#0f172a" }}>Rapports</h1>
        </div>
        <button onClick={exportCSV} style={{ height: 42, padding: "0 18px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", color: "#4f46e5", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <Download style={{ width: 16, height: 16 }} /> Exporter CSV
        </button>
      </div>

      {/* Period selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {PERIODS.map((p) => (
          <button key={p.key} onClick={() => setPeriod(p.key)} style={{
            height: 38, padding: "0 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid",
            background: period === p.key ? "#4f46e5" : "#fff",
            color: period === p.key ? "#fff" : "#64748b",
            borderColor: period === p.key ? "#4f46e5" : "#e2e8f0",
          }}>
            {p.label}
          </button>
        ))}
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Chiffre d'affaires", value: fmt(totalCA), icon: TrendingUp, color: "#4f46e5", bg: "#ede9fe" },
          { label: "Tickets", value: String(totalTickets), icon: Receipt, color: "#10b981", bg: "#d1fae5" },
          { label: "Panier moyen", value: fmt(avgBasket), icon: ShoppingBag, color: "#f59e0b", bg: "#fef3c7" },
          { label: "Articles vendus", value: String(totalItems), icon: FileBarChart2, color: "#6366f1", bg: "#e0e7ff" },
        ].map((k) => (
          <div key={k.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 18, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8" }}>{k.label}</div>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <k.icon style={{ width: 16, height: 16, color: k.color }} />
              </div>
            </div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 30, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Two columns: top products + sales list */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        {/* Top products */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 4 }}>Meilleures ventes</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>Top produits</div>
          {topProds.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "24px 0" }}>Aucune vente sur cette période.</div>
          ) : topProds.map((p, i) => (
            <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: i < topProds.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 900, color: "#e2e8f0", width: 28 }}>#{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.qty} vendu(s)</div>
              </div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: "#4f46e5", fontSize: 14, flexShrink: 0 }}>{fmt(p.revenue)}</div>
            </div>
          ))}
        </div>

        {/* Sales history */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden" }}>
          <div style={{ padding: "20px 20px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 4 }}>Historique</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Tickets de caisse</div>
          </div>
          <div style={{ borderTop: "1px solid #f1f5f9" }}>
            <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 80px 100px", padding: "8px 20px", background: "#f8fafc", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8" }}>
              <span>N° ticket</span><span>Produits</span><span style={{ textAlign: "right" }}>Mode</span><span style={{ textAlign: "right" }}>Total</span>
            </div>
            <div style={{ maxHeight: 420, overflow: "auto" }}>
              {filtered.length === 0 ? (
                <div style={{ padding: 32, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>Aucune vente sur cette période.</div>
              ) : filtered.map((s, i) => (
                <div key={s.id} style={{ display: "grid", gridTemplateColumns: "100px 1fr 80px 100px", padding: "11px 20px", borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", fontFamily: "monospace" }}>{s.id.slice(-8).toUpperCase()}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{new Date(s.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                  <div style={{ fontSize: 12, color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>
                    {s.items.map((item) => `${productMap[item.product_id] || "?"} ×${item.qty}`).join(", ")}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: s.payment_method === "card" ? "#ede9fe" : "#f0fdf4", color: s.payment_method === "card" ? "#4f46e5" : "#16a34a", border: `1px solid ${s.payment_method === "card" ? "#c4b5fd" : "#bbf7d0"}` }}>
                      {s.payment_method === "card" ? "CB" : "Espèces"}
                    </span>
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: "#0f172a", fontSize: 15 }}>{fmt(s.total)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
