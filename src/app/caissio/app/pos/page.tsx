"use client";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Search, Trash2, Plus, Minus, Percent, CreditCard, Banknote,
  Receipt, DoorOpen, X, Check, Leaf, Mail, Phone, Printer,
  PauseCircle, RotateCcw, Users, Delete, UserCheck, BookOpen,
} from "lucide-react";
import {
  getProducts, getCustomers, recordSale, getStoreSettings,
  type Product, type Customer,
} from "@/lib/caissio-store";

type CartItem = { id: string; name: string; price: number; qty: number; image_url?: string };
type HeldTicket = { id: number; cart: CartItem[]; discount: number; customerId: string | null; ts: Date };
type PayMode = "cash" | "card" | "account";

function fmt(n: number) { return n.toFixed(2) + " €"; }

/* ── Category colors ──────────────────────────────── */
const CAT_COLORS: Record<string, { bg: string; light: string; accent: string; text: string }> = {
  "Boulangerie":      { bg: "#f59e0b", light: "#fef3c7", accent: "#d97706", text: "#78350f" },
  "Boissons":         { bg: "#3b82f6", light: "#dbeafe", accent: "#2563eb", text: "#1e3a8a" },
  "Snacks":           { bg: "#10b981", light: "#d1fae5", accent: "#059669", text: "#064e3b" },
  "Épicerie":         { bg: "#8b5cf6", light: "#ede9fe", accent: "#7c3aed", text: "#3b0764" },
  "Fruits & Légumes": { bg: "#22c55e", light: "#dcfce7", accent: "#16a34a", text: "#14532d" },
  "Fromage":          { bg: "#f97316", light: "#ffedd5", accent: "#ea580c", text: "#7c2d12" },
  "Charcuterie":      { bg: "#ef4444", light: "#fee2e2", accent: "#dc2626", text: "#7f1d1d" },
};
const DEFAULT_CAT = { bg: "#64748b", light: "#f1f5f9", accent: "#475569", text: "#0f172a" };

function catCol(cat: string) { return CAT_COLORS[cat] ?? DEFAULT_CAT; }

/* ── Numpad ──────────────────────────────────────── */
function Numpad({ onPress, onBack }: { onPress: (k: string) => void; onBack: () => void }) {
  const keys = ["1","2","3","4","5","6","7","8","9",".","0","←"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
      {keys.map((k) => (
        <button key={k} onClick={() => k === "←" ? onBack() : onPress(k)}
          style={{ height: 56, borderRadius: 12, border: "1px solid #e2e8f0", background: k === "←" ? "#f8fafc" : "#fff", fontSize: k === "←" ? 14 : 22, fontWeight: 300, color: "#0f172a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 1px 3px rgba(0,0,0,.05)" }}>
          {k === "←" ? <Delete style={{ width: 18, height: 18, color: "#64748b" }} /> : k}
        </button>
      ))}
    </div>
  );
}

/* ── Thermal receipt ─────────────────────────────── */
function ThermalTicket({ cart, total, subtotal, discount, payMode, cashGiven, change, customer, ticketNum, settings }: {
  cart: CartItem[]; total: number; subtotal: number; discount: number;
  payMode: PayMode; cashGiven: number; change: number;
  customer?: Customer; ticketNum: string;
  settings: { name: string; address?: string; siret?: string; ticket_footer?: string };
}) {
  const now = new Date();
  const sep = "─".repeat(32);
  const tva = total * 0.1;
  return (
    <div style={{ fontFamily: "'JetBrains Mono','Courier New',monospace", fontSize: 12, lineHeight: 1.7, color: "#111", maxWidth: 300, margin: "0 auto", padding: "0 4px" }}>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{settings.name}</div>
        {settings.address && <div style={{ fontSize: 10, color: "#555" }}>{settings.address}</div>}
        {settings.siret && <div style={{ fontSize: 10, color: "#555" }}>SIRET : {settings.siret}</div>}
      </div>
      <div style={{ borderTop: "1px dashed #ccc", borderBottom: "1px dashed #ccc", padding: "4px 0", marginBottom: 6, display: "flex", justifyContent: "space-between", fontSize: 10, color: "#555" }}>
        <span>{now.toLocaleDateString("fr-FR")}</span>
        <span>{now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
        <span>#{ticketNum}</span>
      </div>
      {customer && <div style={{ fontSize: 10, color: "#4f46e5", marginBottom: 4 }}>Client : {customer.name}</div>}
      <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>{sep}</div>
      {cart.map((item) => (
        <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 2 }}>
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 4 }}>
            {item.qty > 1 ? `${item.name} ×${item.qty}` : item.name}
          </span>
          <span style={{ flexShrink: 0, fontWeight: 600 }}>{fmt(item.price * item.qty)}</span>
        </div>
      ))}
      {cart.map((item) => item.qty > 1 && (
        <div key={item.id + "u"} style={{ fontSize: 10, color: "#888", marginLeft: 8, marginBottom: 1 }}>{item.qty} × {fmt(item.price)}</div>
      ))}
      <div style={{ fontSize: 10, color: "#888", margin: "4px 0" }}>{sep}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
      {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#059669" }}><span>Remise</span><span>-{fmt(discount)}</span></div>}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888" }}><span>TVA (~10%)</span><span>{fmt(tva)}</span></div>
      <div style={{ fontSize: 10, color: "#888", margin: "4px 0" }}>{sep}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700, marginBottom: 4 }}><span>TOTAL</span><span>{fmt(total)}</span></div>
      <div style={{ fontSize: 10, color: "#888", margin: "4px 0" }}>{sep}</div>
      <div style={{ fontSize: 11 }}>
        <div>Règlement : <strong>{payMode === "cash" ? "Espèces" : payMode === "card" ? "Carte bancaire" : "Sur compte"}</strong></div>
        {payMode === "cash" && cashGiven > 0 && <div>Remis : <strong>{fmt(cashGiven)}</strong></div>}
        {payMode === "cash" && change > 0 && <div>Rendu : <strong style={{ color: "#059669" }}>{fmt(change)}</strong></div>}
      </div>
      {customer && (
        <div style={{ marginTop: 6, fontSize: 10, color: "#4f46e5" }}>Points fidélité crédités : +{Math.floor(total)} pts (total : {customer.points + Math.floor(total)} pts)</div>
      )}
      <div style={{ fontSize: 10, color: "#888", margin: "6px 0" }}>{sep}</div>
      <div style={{ textAlign: "center", fontSize: 11, color: "#555" }}>{settings.ticket_footer || "Merci de votre visite !"}</div>
      <div style={{ textAlign: "center", fontSize: 9, color: "#aaa", marginTop: 4 }}>Caissio · caissio.fr</div>
    </div>
  );
}

/* ── Article search modal ────────────────────────── */
function ArticleModal({ products, onAdd, onClose }: { products: Product[]; onAdd: (p: Product) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    const active = products.filter((p) => p.active);
    if (!q.trim()) return active;
    const lq = q.toLowerCase();
    return active.filter((p) =>
      p.name.toLowerCase().includes(lq) ||
      (p.barcode || "").includes(q) ||
      p.category.toLowerCase().includes(lq)
    );
  }, [q, products]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,.65)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 16px 16px" }}>
      <div style={{ width: "100%", maxWidth: 620, background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.3)" }}>

        {/* Header */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
          <Search style={{ width: 20, height: 20, color: "#4f46e5", flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Rechercher un article, catégorie ou code-barres…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 16, color: "#0f172a", background: "transparent" }}
          />
          {q && <button onClick={() => setQ("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X style={{ width: 16, height: 16 }} /></button>}
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X style={{ width: 15, height: 15, color: "#64748b" }} />
          </button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {results.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Aucun article trouvé pour « {q} »</div>
          ) : results.map((p) => {
            const col = catCol(p.category);
            return (
              <button key={p.id} onClick={() => { onAdd(p); onClose(); }}
                style={{ width: "100%", padding: "12px 20px", border: "none", borderBottom: "1px solid #f8fafc", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left", transition: "background .1s" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                {/* Category dot */}
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: col.bg, flexShrink: 0 }} />

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: col.text, background: col.light, padding: "1px 7px", borderRadius: 6 }}>{p.category}</span>
                    {p.barcode && <span style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>{p.barcode}</span>}
                  </div>
                </div>

                {/* Stock */}
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 800, color: col.bg }}>{fmt(p.price)}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: p.stock === 0 ? "#ef4444" : "#94a3b8", marginTop: 1 }}>
                    {p.stock === 0 ? "Rupture" : `${p.stock} en stock`}
                  </div>
                </div>

                {/* Add icon */}
                <div style={{ width: 32, height: 32, borderRadius: 8, background: col.light, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Plus style={{ width: 16, height: 16, color: col.bg }} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "10px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{results.length} article{results.length > 1 ? "s" : ""}</div>
          <button onClick={onClose} style={{ height: 34, padding: "0 14px", borderRadius: 10, border: "none", background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main POS ────────────────────────────────────── */
export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState({ name: "Mon Commerce", address: "", siret: "", ticket_footer: "" });
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Tous");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [held, setHeld] = useState<HeldTicket[]>([]);
  const [showHeld, setShowHeld] = useState(false);
  const [showArticle, setShowArticle] = useState(false);
  const [stage, setStage] = useState<"pos" | "pay" | "ticket">("pos");
  const [payMode, setPayMode] = useState<PayMode>("card");
  const [cashInput, setCashInput] = useState("");
  const [completedSale, setCompletedSale] = useState<{ ticketNum: string; total: number; change: number } | null>(null);
  const [scanBuffer, setScanBuffer] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProducts(getProducts());
    setCustomers(getCustomers());
    const s = getStoreSettings();
    setSettings({ name: s.name, address: s.address || "", siret: s.siret || "", ticket_footer: s.ticket_footer || "" });
  }, []);

  // Barcode scanner
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return;
      if (e.key === "Enter" && scanBuffer.length > 3) {
        const found = products.find((p) => p.barcode === scanBuffer);
        if (found) addToCart(found);
        setScanBuffer("");
        return;
      }
      if (e.key.length === 1 && /[\w\d]/.test(e.key)) {
        setScanBuffer((b) => b + e.key);
        clearTimeout(timer);
        timer = setTimeout(() => setScanBuffer(""), 250);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); clearTimeout(timer); };
  }, [scanBuffer, products]);

  const categories = useMemo(() => ["Tous", ...Array.from(new Set(products.map((p) => p.category)))], [products]);

  const filtered = useMemo(() => products.filter((p) => {
    if (!p.active) return false;
    if (cat !== "Tous" && p.category !== cat) return false;
    if (search) {
      const lq = search.toLowerCase();
      return p.name.toLowerCase().includes(lq) || (p.barcode || "").includes(search);
    }
    return true;
  }), [products, cat, search]);

  const addToCart = useCallback((p: Product) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === p.id);
      if (ex) return c.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { id: p.id, name: p.name, price: p.price, qty: 1, image_url: p.image_url }];
    });
  }, []);

  const decCart = (id: string) => setCart((c) => c.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0));
  const addCart = (id: string) => setCart((c) => c.map((i) => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  const removeCart = (id: string) => setCart((c) => c.filter((i) => i.id !== id));
  const clearAll = () => { setCart([]); setDiscount(0); setCustomerId(null); setStage("pos"); setCashInput(""); setCompletedSale(null); setProducts(getProducts()); setCustomers(getCustomers()); };

  const holdTicket = () => {
    if (cart.length === 0) return;
    setHeld((h) => [...h, { id: Date.now(), cart, discount, customerId, ts: new Date() }]);
    setCart([]); setDiscount(0); setCustomerId(null);
  };

  const recallTicket = (t: HeldTicket) => {
    setCart(t.cart); setDiscount(t.discount); setCustomerId(t.customerId);
    setHeld((h) => h.filter((x) => x.id !== t.id));
    setShowHeld(false);
  };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = Math.max(0, subtotal - discount);
  const cashNum = parseFloat(cashInput) || 0;
  const change = Math.max(0, cashNum - total);
  const canValidate = payMode === "card" || payMode === "account" || (payMode === "cash" && cashNum >= total - 0.005);

  const validateSale = () => {
    if (!canValidate) return;
    if (payMode === "account" && !customerId) return;
    const sale = recordSale({
      items: cart.map((i) => ({ product_id: i.id, name: i.name, price: i.price, qty: i.qty })),
      subtotal, discount, total, payment: payMode,
      cash_given: payMode === "cash" ? cashNum : undefined,
      change: payMode === "cash" ? change : undefined,
      customer_id: customerId ?? undefined,
    });
    setCompletedSale({ ticketNum: sale.id.slice(-6).toUpperCase(), total, change });
    setStage("ticket");
  };

  const numpadPress = (k: string) => setCashInput((v) => k === "." ? (v.includes(".") ? v : (v || "0") + ".") : v + k);
  const numpadBack = () => setCashInput((v) => v.slice(0, -1));
  const quickAmount = (a: number) => setCashInput(String(a));
  const exactAmount = () => setCashInput(total.toFixed(2));
  const selectedCustomer = customers.find((c) => c.id === customerId);

  // Active category color
  const activeCatCol = cat !== "Tous" ? catCol(cat) : null;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');
        * { box-sizing: border-box; }
        .prod-tile:hover { filter: brightness(0.96); transform: scale(0.98); }
        .prod-tile:active { transform: scale(0.95); }
        .cat-btn:hover { opacity: 0.85; }
      `}</style>

      {/* ══════ LEFT: Products ══════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f1f5f9" }}>

        {/* Top bar: search + Article button */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 14px", display: "flex", gap: 10, flexShrink: 0 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrer les articles…"
              style={{ width: "100%", height: 42, paddingLeft: 36, paddingRight: 12, border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, color: "#0f172a", outline: "none", background: "#f8fafc" }}
            />
          </div>
          <button
            onClick={() => setShowArticle(true)}
            style={{ height: 42, padding: "0 16px", borderRadius: 10, background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}
          >
            <BookOpen style={{ width: 15, height: 15 }} />
            Article
          </button>
        </div>

        {/* Category tabs */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 14px", display: "flex", gap: 6, overflowX: "auto", flexShrink: 0, alignItems: "center", height: 52 }}>
          {/* "Tous" tab */}
          <button className="cat-btn" onClick={() => setCat("Tous")} style={{
            height: 34, padding: "0 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", border: "none", cursor: "pointer", flexShrink: 0, transition: "all .15s",
            background: cat === "Tous" ? "#0f172a" : "#f1f5f9",
            color: cat === "Tous" ? "#fff" : "#64748b",
          }}>
            Tous ({products.length})
          </button>

          {/* Separator */}
          <div style={{ width: 1, height: 22, background: "#e2e8f0", flexShrink: 0 }} />

          {/* Category buttons with color */}
          {categories.filter((c) => c !== "Tous").map((c) => {
            const col = catCol(c);
            const count = products.filter((p) => p.category === c).length;
            const isActive = cat === c;
            return (
              <button key={c} className="cat-btn" onClick={() => setCat(c)} style={{
                height: 34, padding: "0 12px", borderRadius: 8, fontSize: 12, fontWeight: 700, whiteSpace: "nowrap", border: "none", cursor: "pointer", flexShrink: 0, transition: "all .15s", display: "flex", alignItems: "center", gap: 6,
                background: isActive ? col.bg : col.light,
                color: isActive ? "#fff" : col.text,
              }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: isActive ? "rgba(255,255,255,.7)" : col.bg, flexShrink: 0 }} />
                {c} ({count})
              </button>
            );
          })}
        </div>

        {/* Product grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: 12 }}>
          {filtered.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "#94a3b8" }}>
              <Search style={{ width: 32, height: 32, opacity: 0.3 }} />
              <div style={{ fontSize: 14 }}>Aucun article trouvé</div>
              <button onClick={() => setShowArticle(true)} style={{ height: 36, padding: "0 14px", borderRadius: 10, background: "#0f172a", color: "#fff", fontWeight: 600, fontSize: 12, border: "none", cursor: "pointer" }}>
                Rechercher dans le catalogue
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
              {filtered.map((p) => {
                const col = catCol(p.category);
                const outOfStock = p.stock === 0;
                return (
                  <button
                    key={p.id}
                    className="prod-tile"
                    onClick={() => addToCart(p)}
                    style={{
                      background: outOfStock ? "#f8fafc" : col.light,
                      border: `1.5px solid ${outOfStock ? "#e2e8f0" : col.bg + "60"}`,
                      borderRadius: 14,
                      padding: 0,
                      cursor: outOfStock ? "not-allowed" : "pointer",
                      textAlign: "left",
                      overflow: "hidden",
                      position: "relative",
                      transition: "all .12s",
                      opacity: outOfStock ? 0.55 : 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Color accent bar */}
                    <div style={{ height: 5, background: outOfStock ? "#e2e8f0" : col.bg, flexShrink: 0 }} />

                    {/* Content */}
                    <div style={{ padding: "10px 10px 10px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: 100 }}>
                      {/* Letter/image */}
                      <div style={{ fontSize: 32, fontWeight: 900, color: col.bg, opacity: outOfStock ? 0.2 : 0.25, lineHeight: 1, fontFamily: "'Outfit',sans-serif", marginBottom: 6 }}>
                        {p.image_url
                          ? <img src={p.image_url} alt="" style={{ width: 36, height: 36, objectFit: "cover", borderRadius: 6 }} />
                          : p.name[0]?.toUpperCase()
                        }
                      </div>

                      {/* Name */}
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: outOfStock ? "#94a3b8" : "#0f172a", lineHeight: 1.3, marginBottom: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {p.name}
                        </div>

                        {/* Price + stock */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 900, color: outOfStock ? "#94a3b8" : col.bg }}>
                            {fmt(p.price)}
                          </div>
                          {outOfStock ? (
                            <div style={{ fontSize: 9, fontWeight: 800, color: "#ef4444", background: "#fee2e2", padding: "1px 5px", borderRadius: 4, textTransform: "uppercase" }}>Rupture</div>
                          ) : (
                            <div style={{ fontSize: 9, color: col.accent, fontWeight: 700, opacity: 0.7 }}>{p.stock} st.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Category pill indicator (bottom) */}
        {activeCatCol && (
          <div style={{ padding: "6px 14px", background: "#fff", borderTop: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: activeCatCol.bg }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: activeCatCol.text }}>
              {cat} — {filtered.length} article{filtered.length > 1 ? "s" : ""}
            </span>
          </div>
        )}
      </div>

      {/* ══════ RIGHT: Cart ══════ */}
      <aside style={{ width: 360, background: "#fff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>

        {/* Quick actions */}
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, flexShrink: 0 }}>
          {[
            { icon: Users, label: selectedCustomer ? selectedCustomer.name.split(" ")[0] : "Client", active: !!customerId, onClick: () => setCustomerId(null) },
            { icon: PauseCircle, label: "Pause", active: false, onClick: holdTicket, disabled: cart.length === 0 },
            { icon: RotateCcw, label: `Reprendre${held.length > 0 ? ` (${held.length})` : ""}`, active: showHeld, onClick: () => setShowHeld((v) => !v), disabled: held.length === 0 },
            { icon: DoorOpen, label: "Tiroir", active: false, onClick: () => alert("Commande ESC/POS → tiroir") },
          ].map((btn) => (
            <button key={btn.label} onClick={btn.onClick} disabled={btn.disabled}
              style={{ height: 54, borderRadius: 12, border: `1px solid ${btn.active ? "#4f46e5" : "#e2e8f0"}`, background: btn.active ? "#ede9fe" : btn.disabled ? "#f8fafc" : "#fff", cursor: btn.disabled ? "default" : "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, opacity: btn.disabled ? 0.4 : 1 }}>
              <btn.icon style={{ width: 15, height: 15, color: btn.active ? "#4f46e5" : "#64748b" }} />
              <span style={{ fontSize: 9, fontWeight: 600, color: btn.active ? "#4f46e5" : "#64748b", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 68, padding: "0 2px" }}>{btn.label}</span>
            </button>
          ))}
        </div>

        {/* Held tickets */}
        {showHeld && held.length > 0 && (
          <div style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", flexShrink: 0 }}>
            {held.map((t) => (
              <button key={t.id} onClick={() => recallTicket(t)}
                style={{ width: "100%", padding: "10px 14px", textAlign: "left", border: "none", borderBottom: "1px solid #f1f5f9", background: "transparent", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a" }}>{t.cart.length} art. · {fmt(t.cart.reduce((s, i) => s + i.price * i.qty, 0))}</div>
                  <div style={{ fontSize: 10, color: "#94a3b8" }}>{t.ts.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
                <RotateCcw style={{ width: 13, height: 13, color: "#4f46e5" }} />
              </button>
            ))}
          </div>
        )}

        {/* Customer selector */}
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <select value={customerId ?? ""} onChange={(e) => setCustomerId(e.target.value || null)}
            style={{ width: "100%", height: 36, padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#64748b", outline: "none", background: "#f8fafc" }}>
            <option value="">— Client anonyme —</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} · {c.points} pts{c.balance > 0 ? ` · Doit ${fmt(c.balance)}` : ""}</option>
            ))}
          </select>
        </div>

        {/* Cart header */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>
            Ticket {cart.length > 0 && <span style={{ color: "#4f46e5", fontFamily: "'Outfit',sans-serif" }}>({cart.length})</span>}
          </span>
          {cart.length > 0 && (
            <button onClick={clearAll} style={{ fontSize: 11, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <X style={{ width: 13, height: 13 }} /> Annuler
            </button>
          )}
        </div>

        {/* Cart items */}
        <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
          {cart.length === 0 ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", color: "#cbd5e1", gap: 10 }}>
              <Receipt style={{ width: 36, height: 36 }} />
              <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>Touchez un produit<br />pour commencer la vente.</div>
            </div>
          ) : cart.map((item) => (
            <div key={item.id} style={{ background: "#f8fafc", border: "1px solid #f1f5f9", borderRadius: 12, padding: "10px 12px", marginBottom: 7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{fmt(item.price)} × {item.qty}</div>
                </div>
                <div style={{ fontWeight: 800, fontSize: 14, color: "#0f172a", marginLeft: 8, fontFamily: "'Outfit',sans-serif" }}>{fmt(item.price * item.qty)}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button onClick={() => decCart(item.id)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus style={{ width: 12, height: 12, color: "#64748b" }} /></button>
                <div style={{ fontSize: 13, fontWeight: 700, width: 26, textAlign: "center", color: "#0f172a" }}>{item.qty}</div>
                <button onClick={() => addCart(item.id)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus style={{ width: 12, height: 12, color: "#64748b" }} /></button>
                <button onClick={() => removeCart(item.id)} style={{ marginLeft: "auto", width: 28, height: 28, borderRadius: 7, border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 style={{ width: 12, height: 12, color: "#dc2626" }} /></button>
              </div>
            </div>
          ))}
        </div>

        {/* Totals + pay */}
        <div style={{ borderTop: "1px solid #e2e8f0", padding: "12px 14px", flexShrink: 0 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
            <span>Sous-total</span><span style={{ fontFamily: "monospace" }}>{fmt(subtotal)}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#94a3b8" }}><Percent style={{ width: 12, height: 12 }} /> Remise (€)</div>
            <input type="number" min="0" step="0.01" value={discount || ""} onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} placeholder="0"
              style={{ width: 72, height: 30, padding: "0 8px", border: "1px solid #e2e8f0", borderRadius: 8, textAlign: "right", fontSize: 12, fontFamily: "monospace", outline: "none" }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px solid #f1f5f9", marginBottom: 12 }}>
            <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8" }}>Total</span>
            <span style={{ fontSize: 30, fontWeight: 900, color: "#4f46e5", fontFamily: "'Outfit',sans-serif", letterSpacing: "-0.03em" }}>{fmt(total)}</span>
          </div>
          <button onClick={() => cart.length > 0 && setStage("pay")} disabled={cart.length === 0}
            style={{ width: "100%", height: 52, borderRadius: 14, background: cart.length === 0 ? "#e0e7ff" : "#4f46e5", color: cart.length === 0 ? "#a5b4fc" : "#fff", fontWeight: 700, fontSize: 16, border: "none", cursor: cart.length === 0 ? "not-allowed" : "pointer", letterSpacing: "0.02em" }}>
            Encaisser →
          </button>
        </div>
      </aside>

      {/* ══════ ARTICLE MODAL ══════ */}
      {showArticle && (
        <ArticleModal products={products} onAdd={addToCart} onClose={() => setShowArticle(false)} />
      )}

      {/* ══════ PAYMENT MODAL ══════ */}
      {stage === "pay" && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 680, boxShadow: "0 32px 80px rgba(0,0,0,.25)", overflow: "hidden" }}>

            <div style={{ padding: "18px 24px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 2 }}>Encaissement</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 42, fontWeight: 900, color: "#4f46e5", letterSpacing: "-0.04em", lineHeight: 1 }}>{fmt(total)}</div>
              </div>
              <button onClick={() => setStage("pos")} style={{ width: 38, height: 38, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X style={{ width: 16, height: 16, color: "#64748b" }} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0 }}>
              <div style={{ padding: 24, borderRight: "1px solid #f1f5f9" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
                  {([["cash", Banknote, "Espèces"], ["card", CreditCard, "Carte"], ["account", UserCheck, "Sur compte"]] as const).map(([mode, Icon, label]) => (
                    <button key={mode} onClick={() => { setPayMode(mode); setCashInput(""); }}
                      style={{ height: 64, borderRadius: 14, border: `2px solid ${payMode === mode ? "#4f46e5" : "#e2e8f0"}`, background: payMode === mode ? "#ede9fe" : "#f8fafc", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Icon style={{ width: 18, height: 18, color: payMode === mode ? "#4f46e5" : "#64748b" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: payMode === mode ? "#4f46e5" : "#64748b" }}>{label}</span>
                    </button>
                  ))}
                </div>

                {payMode === "cash" && (
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Montant remis</div>
                    <input type="text" inputMode="decimal" value={cashInput} onChange={(e) => setCashInput(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0,00" autoFocus
                      style={{ width: "100%", height: 52, padding: "0 14px", border: "2px solid #4f46e5", borderRadius: 12, fontSize: 22, fontFamily: "monospace", fontWeight: 700, color: "#0f172a", outline: "none", textAlign: "right", marginBottom: 10 }} />
                    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                      {[5, 10, 20, 50, 100].map((a) => (
                        <button key={a} onClick={() => quickAmount(a)} style={{ height: 36, padding: "0 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#0f172a", cursor: "pointer" }}>{a} €</button>
                      ))}
                      <button onClick={exactAmount} style={{ height: 36, padding: "0 14px", borderRadius: 10, border: "none", background: "#0f172a", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Exact</button>
                    </div>
                    <div style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 14px", fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#64748b" }}><span>À payer</span><span style={{ fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>{fmt(total)}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#64748b" }}><span>Remis</span><span style={{ fontFamily: "monospace", fontWeight: 600, color: cashNum > 0 ? "#0f172a" : "#94a3b8" }}>{cashNum > 0 ? fmt(cashNum) : "—"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid #e2e8f0" }}>
                        <span style={{ fontWeight: 700, color: change > 0 ? "#059669" : "#94a3b8" }}>Rendu monnaie</span>
                        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 16, color: change > 0 ? "#059669" : "#94a3b8" }}>{fmt(change)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {payMode === "card" && (
                  <div style={{ padding: 20, textAlign: "center", background: "#f8fafc", borderRadius: 14, border: "1px dashed #c4b5fd" }}>
                    <CreditCard style={{ width: 36, height: 36, color: "#4f46e5", margin: "0 auto 10px" }} />
                    <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a", marginBottom: 4 }}>Insérez ou présentez la carte</div>
                    <div style={{ fontSize: 28, fontWeight: 900, color: "#4f46e5", fontFamily: "'Outfit',sans-serif" }}>{fmt(total)}</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>Montant à valider sur le TPE</div>
                  </div>
                )}

                {payMode === "account" && (
                  <div style={{ padding: 20, background: "#fffbeb", borderRadius: 14, border: "1px solid #fde68a" }}>
                    <UserCheck style={{ width: 28, height: 28, color: "#d97706", marginBottom: 10 }} />
                    {customerId ? (
                      <>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Mise sur le compte de</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#d97706" }}>{selectedCustomer?.name}</div>
                        <div style={{ fontSize: 13, color: "#92400e", marginTop: 6 }}>{fmt(total)} sera ajouté à sa note.{(selectedCustomer?.balance ?? 0) > 0 && ` Solde actuel : ${fmt(selectedCustomer!.balance)}`}</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 13, color: "#92400e" }}>⚠ Sélectionnez d&apos;abord un client dans la liste pour mettre sur compte.</div>
                    )}
                  </div>
                )}
              </div>

              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                {payMode === "cash" && <Numpad onPress={numpadPress} onBack={numpadBack} />}
                {payMode !== "cash" && (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                    {payMode === "card" ? (
                      <>
                        <div style={{ width: 80, height: 80, borderRadius: 20, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <CreditCard style={{ width: 36, height: 36, color: "#4f46e5" }} />
                        </div>
                        <div style={{ fontSize: 13, color: "#64748b", textAlign: "center" }}>Validez sur le terminal de paiement puis confirmez ci-dessous</div>
                      </>
                    ) : (
                      <div style={{ fontSize: 13, color: "#64748b", textAlign: "center" }}>{customerId ? "Confirmez la mise sur compte" : "Choisissez un client à gauche"}</div>
                    )}
                  </div>
                )}
                <button onClick={validateSale} disabled={!canValidate || (payMode === "account" && !customerId)}
                  style={{ width: "100%", height: 60, borderRadius: 16, background: canValidate && !(payMode === "account" && !customerId) ? "#4f46e5" : "#e0e7ff", color: canValidate && !(payMode === "account" && !customerId) ? "#fff" : "#a5b4fc", fontWeight: 700, fontSize: 18, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Check style={{ width: 20, height: 20 }} />
                  Valider la vente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════ TICKET MODAL ══════ */}
      {stage === "ticket" && completedSale && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 560, boxShadow: "0 32px 80px rgba(0,0,0,.25)", overflow: "hidden" }}>
            <div style={{ padding: 20, background: "#f0fdf4", borderBottom: "1px solid #d1fae5", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Check style={{ width: 24, height: 24, color: "#059669" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#059669", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Vente validée · #{completedSale.ticketNum}</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Total encaissé : {fmt(completedSale.total)}</div>
                {payMode === "cash" && completedSale.change > 0 && (
                  <div style={{ fontSize: 14, color: "#059669", fontWeight: 600 }}>Rendu : {fmt(completedSale.change)}</div>
                )}
              </div>
            </div>
            <div style={{ padding: 20, maxHeight: 380, overflowY: "auto", background: "#fafafa", borderBottom: "1px solid #e2e8f0" }}>
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
                <ThermalTicket cart={cart} total={total} subtotal={subtotal} discount={discount}
                  payMode={payMode} cashGiven={cashNum} change={completedSale.change}
                  customer={selectedCustomer} ticketNum={completedSale.ticketNum} settings={settings} />
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Le client souhaite-t-il son ticket ?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                <button onClick={clearAll} style={{ height: 48, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}><Printer style={{ width: 14, height: 14 }} /> Imprimer</button>
                <button onClick={clearAll} style={{ height: 48, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}><Mail style={{ width: 14, height: 14 }} /> Email</button>
                <button onClick={clearAll} style={{ height: 48, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}><Phone style={{ width: 14, height: 14 }} /> SMS</button>
                <button onClick={clearAll} style={{ height: 48, borderRadius: 12, border: "none", background: "#10b981", fontSize: 12, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}><Leaf style={{ width: 14, height: 14 }} /> Non merci</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
