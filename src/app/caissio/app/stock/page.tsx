"use client";
import { useState, useEffect } from "react";
import { Search, Plus, Minus, RefreshCw, AlertTriangle } from "lucide-react";
import { getProducts, updateProduct, type Product } from "@/lib/caissio-store";

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [delta, setDelta] = useState<number>(0);
  const [filter, setFilter] = useState<"all" | "low" | "out">("all");

  const reload = () => setProducts(getProducts());
  useEffect(() => { reload(); }, []);

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || "").includes(search);
    if (filter === "low") return matchSearch && p.stock > 0 && p.stock <= (p.stock_min ?? 5);
    if (filter === "out") return matchSearch && p.stock === 0;
    return matchSearch;
  });

  const applyDelta = (p: Product) => {
    const newStock = Math.max(0, p.stock + delta);
    updateProduct(p.id, { stock: newStock });
    reload();
    setEditing(null);
    setDelta(0);
  };

  const setStockDirect = (p: Product, val: number) => {
    updateProduct(p.id, { stock: Math.max(0, val) });
    reload();
  };

  const outCount = products.filter((p) => p.stock === 0).length;
  const lowCount = products.filter((p) => p.stock > 0 && p.stock <= (p.stock_min ?? 5)).length;

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'IBM Plex Sans',sans-serif", maxWidth: 1000 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');`}</style>

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 4 }}>Inventaire</div>
        <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 32, fontWeight: 900, color: "#0f172a" }}>Stock</h1>
      </div>

      {/* Alert summary */}
      {(outCount > 0 || lowCount > 0) && (
        <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
          {outCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "#dc2626" }}>
              <AlertTriangle style={{ width: 15, height: 15 }} />
              {outCount} produit(s) en rupture
            </div>
          )}
          {lowCount > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, fontSize: 13, fontWeight: 600, color: "#d97706" }}>
              <AlertTriangle style={{ width: 15, height: 15 }} />
              {lowCount} produit(s) stock faible
            </div>
          )}
        </div>
      )}

      {/* Filters + search */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: "1 1 300px", maxWidth: 380 }}>
          <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit…"
            style={{ width: "100%", height: 42, paddingLeft: 36, border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", background: "#fff" }} />
        </div>
        {(["all", "low", "out"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} style={{
            height: 42, padding: "0 16px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer", border: "1px solid",
            background: filter === f ? "#4f46e5" : "#fff",
            color: filter === f ? "#fff" : "#64748b",
            borderColor: filter === f ? "#4f46e5" : "#e2e8f0",
          }}>
            {f === "all" ? "Tous" : f === "low" ? "Stock faible" : "Rupture"}
          </button>
        ))}
        <button onClick={reload} style={{ height: 42, width: 42, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <RefreshCw style={{ width: 15, height: 15, color: "#64748b" }} />
        </button>
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 80px 160px", padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8" }}>
          <span>Produit</span>
          <span style={{ textAlign: "center" }}>Stock actuel</span>
          <span style={{ textAlign: "center" }}>Stock min</span>
          <span style={{ textAlign: "center" }}>Statut</span>
          <span style={{ textAlign: "center" }}>Ajustement</span>
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            {products.length === 0 ? "Aucun produit — créez des produits depuis l'onglet Produits." : "Aucun résultat."}
          </div>
        ) : filtered.map((p, i) => {
          const isOut = p.stock === 0;
          const isLow = !isOut && p.stock <= (p.stock_min ?? 5);
          const statusColor = isOut ? "#dc2626" : isLow ? "#d97706" : "#10b981";
          const statusBg = isOut ? "#fef2f2" : isLow ? "#fffbeb" : "#f0fdf4";
          const statusBorder = isOut ? "#fecaca" : isLow ? "#fde68a" : "#bbf7d0";
          const statusLabel = isOut ? "Rupture" : isLow ? "Faible" : "OK";

          return (
            <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 120px 100px 80px 160px", padding: "12px 16px", borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.category}{p.barcode ? ` · ${p.barcode}` : ""}</div>
              </div>

              {/* Stock direct edit */}
              <div style={{ textAlign: "center" }}>
                {editing === p.id ? (
                  <input
                    type="number"
                    defaultValue={p.stock}
                    autoFocus
                    onBlur={(e) => { setStockDirect(p, parseInt(e.target.value) || 0); setEditing(null); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { setStockDirect(p, parseInt((e.target as HTMLInputElement).value) || 0); setEditing(null); } if (e.key === "Escape") setEditing(null); }}
                    style={{ width: 60, height: 32, textAlign: "center", border: "2px solid #4f46e5", borderRadius: 8, fontSize: 14, fontWeight: 700, outline: "none" }}
                  />
                ) : (
                  <span
                    onClick={() => setEditing(p.id)}
                    title="Cliquer pour modifier"
                    style={{ fontSize: 18, fontWeight: 800, color: isOut ? "#dc2626" : isLow ? "#d97706" : "#0f172a", cursor: "pointer", fontFamily: "'Outfit',sans-serif" }}
                  >
                    {p.stock}
                  </span>
                )}
              </div>

              <div style={{ textAlign: "center", fontSize: 13, color: "#94a3b8" }}>{p.stock_min ?? 5}</div>

              <div style={{ textAlign: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: statusColor, background: statusBg, border: `1px solid ${statusBorder}`, borderRadius: 8, padding: "3px 8px" }}>
                  {statusLabel}
                </span>
              </div>

              {/* +/- buttons */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                <button onClick={() => setStockDirect(p, p.stock - 1)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Minus style={{ width: 13, height: 13, color: "#dc2626" }} />
                </button>
                <button onClick={() => setStockDirect(p, p.stock + 1)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #bbf7d0", background: "#f0fdf4", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus style={{ width: 13, height: 13, color: "#16a34a" }} />
                </button>
                <button onClick={() => setStockDirect(p, p.stock + 10)} style={{ height: 30, padding: "0 10px", borderRadius: 8, border: "1px solid #c4b5fd", background: "#ede9fe", cursor: "pointer", fontSize: 11, fontWeight: 700, color: "#4f46e5" }}>
                  +10
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>{filtered.length} produit(s) · Cliquez sur le chiffre de stock pour le modifier directement</div>
    </div>
  );
}
