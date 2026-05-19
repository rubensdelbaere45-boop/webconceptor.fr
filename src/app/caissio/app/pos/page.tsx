"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search, Trash2, Plus, Minus, Percent, CreditCard, Banknote,
  Receipt, DoorOpen, ScanLine, X, Check, Leaf, Mail, Phone, Printer,
} from "lucide-react";
import { getProducts, getCustomers, recordSale, type Product, type Customer } from "@/lib/caissio-store";

type CartItem = Product & { qty: number };

function fmt(n: number) { return n.toFixed(2) + " €"; }

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Tous");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [stage, setStage] = useState<"pos" | "pay" | "ticket">("pos");
  const [payMode, setPayMode] = useState<"cash" | "card" | null>(null);
  const [cashGiven, setCashGiven] = useState("");
  const [scanBuffer, setScanBuffer] = useState("");

  useEffect(() => {
    setProducts(getProducts());
    setCustomers(getCustomers());
  }, []);

  // Barcode scanner listener
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" && scanBuffer.length > 3) {
        const found = products.find((p) => p.barcode === scanBuffer);
        if (found) addToCart(found);
        setScanBuffer("");
        return;
      }
      if (e.key.length === 1) {
        setScanBuffer((b) => b + e.key);
        clearTimeout(timer);
        timer = setTimeout(() => setScanBuffer(""), 200);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scanBuffer, products]);

  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ["Tous", ...cats];
  }, [products]);

  const filtered = useMemo(() => products.filter((p) => {
    if (!p.active) return false;
    if (cat !== "Tous" && p.category !== cat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.barcode || "").includes(search)) return false;
    return true;
  }), [products, cat, search]);

  const addToCart = useCallback((p: Product) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === p.id);
      if (ex) return c.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { ...p, qty: 1 }];
    });
  }, []);

  const decCart = (id: string) => setCart((c) => c.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0));
  const removeCart = (id: string) => setCart((c) => c.filter((i) => i.id !== id));
  const clearAll = () => { setCart([]); setDiscount(0); setCustomerId(null); setStage("pos"); setPayMode(null); setCashGiven(""); };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = Math.max(0, subtotal - discount);
  const cashNum = parseFloat(cashGiven) || 0;
  const change = Math.max(0, cashNum - total);
  const canValidate = payMode === "card" || (payMode === "cash" && cashNum >= total);

  const validateSale = () => {
    if (!canValidate) return;
    recordSale({
      items: cart.map((i) => ({ product_id: i.id, name: i.name, price: i.price, qty: i.qty })),
      subtotal, discount, total,
      payment: payMode!,
      cash_given: payMode === "cash" ? cashNum : undefined,
      change: payMode === "cash" ? change : undefined,
      customer_id: customerId ?? undefined,
    });
    setStage("ticket");
    setProducts(getProducts()); // refresh stock
  };

  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", height: "100vh", overflow: "hidden", position: "relative" }}>

      {/* ── LEFT: Product grid ── */}
      <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#f8fafc" }}>
        {/* Search + filters bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10, flexShrink: 0 }}>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher ou scanner…"
                style={{ width: "100%", height: 40, paddingLeft: 36, paddingRight: 12, border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, color: "#0f172a", outline: "none", background: "#f8fafc" }} />
            </div>
            <button style={{ height: 40, padding: "0 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", cursor: "pointer" }}>
              <ScanLine style={{ width: 14, height: 14 }} /> Scan
            </button>
            <button style={{ height: 40, padding: "0 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", cursor: "pointer" }}>
              <DoorOpen style={{ width: 14, height: 14 }} /> Tiroir
            </button>
          </div>
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {categories.map((c) => (
              <button key={c} onClick={() => setCat(c)} style={{ height: 30, padding: "0 14px", borderRadius: 999, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", border: "none", cursor: "pointer", background: cat === c ? "#4f46e5" : "#f1f5f9", color: cat === c ? "#fff" : "#64748b" }}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Products */}
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "#94a3b8", paddingTop: 48, fontSize: 14 }}>Aucun produit trouvé</div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
              {filtered.map((p) => (
                <button key={p.id} onClick={() => addToCart(p)} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 12, textAlign: "left", cursor: "pointer", transition: "all .15s", position: "relative" }}>
                  {p.stock === 0 && <div style={{ position: "absolute", top: 8, right: 8, fontSize: 9, fontWeight: 700, textTransform: "uppercase", color: "#ef4444", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, padding: "1px 5px" }}>Rupture</div>}
                  {p.image_url && <div style={{ aspectRatio: "4/3", borderRadius: 8, overflow: "hidden", marginBottom: 8, background: "#f1f5f9" }}>
                    <img src={p.image_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>}
                  {!p.image_url && <div style={{ height: 48, borderRadius: 8, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 8, fontSize: 20 }}>🛍️</div>}
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: "#4f46e5", marginTop: 2 }}>{fmt(p.price)}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Stock: {p.stock}</div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT: Cart ── */}
      <aside style={{ background: "#fff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Ticket en cours</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {cart.length > 0 && (
              <button onClick={clearAll} style={{ fontSize: 11, color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        </div>

        {/* Customer selector */}
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <select value={customerId ?? ""} onChange={(e) => setCustomerId(e.target.value || null)}
            style={{ width: "100%", height: 34, padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#64748b", outline: "none", background: "#f8fafc" }}>
            <option value="">— Client anonyme —</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.points} pts)</option>)}
          </select>
        </div>

        {/* Cart items */}
        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {cart.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#cbd5e1", gap: 8 }}>
              <Receipt style={{ width: 36, height: 36, opacity: 0.3 }} />
              <div style={{ fontSize: 12 }}>Touchez un produit pour commencer</div>
            </div>
          ) : cart.map((i) => (
            <div key={i.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "10px 12px", marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{fmt(i.price)} × {i.qty}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 13, color: "#0f172a", marginLeft: 8 }}>{fmt(i.price * i.qty)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => decCart(i.id)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus style={{ width: 12, height: 12, color: "#64748b" }} /></button>
                <div style={{ fontSize: 13, fontWeight: 700, width: 24, textAlign: "center", color: "#0f172a" }}>{i.qty}</div>
                <button onClick={() => addToCart(i)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus style={{ width: 12, height: 12, color: "#64748b" }} /></button>
                <button onClick={() => removeCart(i.id)} style={{ marginLeft: "auto", width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 style={{ width: 12, height: 12, color: "#94a3b8" }} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Totals + pay */}
        <div style={{ borderTop: "1px solid #e2e8f0", padding: 14, flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 8 }}>
            <span>Sous-total</span><span style={{ fontFamily: "monospace" }}>{fmt(subtotal)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8" }}><Percent style={{ width: 12, height: 12 }} /> Remise (€)</div>
            <input type="number" min="0" step="0.01" value={discount || ""} onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="0"
              style={{ width: 70, height: 30, padding: "0 8px", border: "1px solid #e2e8f0", borderRadius: 8, textAlign: "right", fontSize: 12, fontFamily: "monospace", outline: "none" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #e2e8f0", marginBottom: 12 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8" }}>Total</span>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#4f46e5", fontFamily: "'Outfit',sans-serif" }}>{fmt(total)}</span>
          </div>
          <button onClick={() => cart.length > 0 && setStage("pay")} disabled={cart.length === 0}
            style={{ width: "100%", height: 48, borderRadius: 14, background: cart.length === 0 ? "#e0e7ff" : "#4f46e5", color: cart.length === 0 ? "#a5b4fc" : "#fff", fontWeight: 700, fontSize: 15, border: "none", cursor: cart.length === 0 ? "not-allowed" : "pointer" }}>
            Encaisser →
          </button>
        </div>
      </aside>

      {/* ── PAYMENT OVERLAY ── */}
      {stage === "pay" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 400, boxShadow: "0 32px 80px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 2 }}>Total à payer</div>
                <div style={{ fontSize: 44, fontWeight: 900, color: "#4f46e5", fontFamily: "'Outfit',sans-serif", letterSpacing: "-0.03em" }}>{fmt(total)}</div>
              </div>
              <button onClick={() => setStage("pos")} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X style={{ width: 16, height: 16, color: "#64748b" }} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <button onClick={() => setPayMode("cash")} style={{ height: 72, borderRadius: 14, border: payMode === "cash" ? "2px solid #4f46e5" : "2px solid #e2e8f0", background: payMode === "cash" ? "#ede9fe" : "#f8fafc", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Banknote style={{ width: 20, height: 20, color: payMode === "cash" ? "#4f46e5" : "#64748b" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: payMode === "cash" ? "#4f46e5" : "#64748b" }}>Espèces</span>
              </button>
              <button onClick={() => setPayMode("card")} style={{ height: 72, borderRadius: 14, border: payMode === "card" ? "2px solid #4f46e5" : "2px solid #e2e8f0", background: payMode === "card" ? "#ede9fe" : "#f8fafc", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <CreditCard style={{ width: 20, height: 20, color: payMode === "card" ? "#4f46e5" : "#64748b" }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: payMode === "card" ? "#4f46e5" : "#64748b" }}>Carte</span>
              </button>
            </div>

            {payMode === "cash" && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#64748b", marginBottom: 8 }}>Montant remis par le client</div>
                <input type="number" step="0.01" value={cashGiven} onChange={(e) => setCashGiven(e.target.value)} placeholder="0.00"
                  style={{ width: "100%", height: 48, padding: "0 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 18, fontFamily: "monospace", fontWeight: 700, outline: "none", textAlign: "right" }} autoFocus />
                {cashNum >= total && (
                  <div style={{ marginTop: 8, display: "flex", justifyContent: "space-between", padding: "10px 14px", background: "#d1fae5", borderRadius: 10 }}>
                    <span style={{ fontSize: 13, color: "#065f46", fontWeight: 600 }}>Rendu monnaie</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#059669", fontFamily: "monospace" }}>{fmt(change)}</span>
                  </div>
                )}
              </div>
            )}

            <button onClick={validateSale} disabled={!canValidate}
              style={{ width: "100%", height: 52, borderRadius: 14, background: canValidate ? "#4f46e5" : "#e0e7ff", color: canValidate ? "#fff" : "#a5b4fc", fontWeight: 700, fontSize: 16, border: "none", cursor: canValidate ? "pointer" : "not-allowed" }}>
              Valider la vente
            </button>
          </div>
        </div>
      )}

      {/* ── TICKET OVERLAY ── */}
      {stage === "ticket" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 400, textAlign: "center", boxShadow: "0 32px 80px rgba(0,0,0,.2)" }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "#d1fae5", border: "1px solid #6ee7b7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Check style={{ width: 28, height: 28, color: "#059669" }} />
            </div>
            <h3 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Vente validée !</h3>
            <p style={{ fontSize: 14, color: "#64748b", marginBottom: 4 }}>Total encaissé : <strong style={{ color: "#0f172a" }}>{fmt(total)}</strong></p>
            {payMode === "cash" && change > 0 && (
              <p style={{ fontSize: 14, color: "#64748b", marginBottom: 0 }}>Rendu : <strong style={{ color: "#059669" }}>{fmt(change)}</strong></p>
            )}
            {selectedCustomer && (
              <div style={{ margin: "12px 0 0", padding: "8px 14px", borderRadius: 10, background: "#ede9fe", fontSize: 12, color: "#4f46e5" }}>
                +{Math.floor(total)} points → {selectedCustomer.name}
              </div>
            )}

            <div style={{ marginTop: 20, padding: 16, borderRadius: 16, background: "#f8fafc", border: "1px solid #e2e8f0", textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 12 }}>Ticket client ?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {([["Imprimer", Printer], ["Email", Mail], ["SMS", Phone]] as const).map(([label, Icon]) => (
                  <button key={label} onClick={clearAll} style={{ height: 42, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                    <Icon style={{ width: 14, height: 14 }} /> {label}
                  </button>
                ))}
                <button onClick={clearAll} style={{ height: 42, borderRadius: 12, border: "none", background: "#10b981", fontSize: 13, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                  <Leaf style={{ width: 14, height: 14 }} /> Non merci
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
