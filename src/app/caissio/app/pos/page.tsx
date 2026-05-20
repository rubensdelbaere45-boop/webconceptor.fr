"use client";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Search, Trash2, Plus, Minus, Percent, CreditCard, Banknote,
  Receipt, DoorOpen, X, Check, Leaf, Mail, Phone, Printer,
  PauseCircle, RotateCcw, Users, Delete, UserCheck, BookOpen,
  Pencil, GripVertical, Tag, Zap, ShoppingBag, ChevronDown,
} from "lucide-react";
import {
  getProducts, getCustomers, recordSale, getStoreSettings,
  type Product, type Customer,
} from "@/lib/caissio-store";

/* ────────────────── Types ───────────────────────── */
type CartItem = { id: string; name: string; price: number; qty: number };
type HeldTicket = { id: number; cart: CartItem[]; discount: number; customerId: string | null; ts: Date };
type PayMode = "cash" | "card" | "account";
type TileType = "product" | "discount" | "free_price";

type POSTile = {
  id: string;
  type: TileType;
  label: string;
  color: string;
  // product
  product_id?: string;
  qty?: number;
  // discount
  discount_type?: "%" | "€";
  discount_value?: number;
  // free_price
  default_price?: number;
};

/* ────────────────── Constants ───────────────────── */
const CAT_COLORS: Record<string, string> = {
  "Boulangerie": "#f59e0b", "Boissons": "#3b82f6", "Snacks": "#10b981",
  "Épicerie": "#8b5cf6", "Fruits & Légumes": "#22c55e",
  "Fromage": "#f97316", "Charcuterie": "#ef4444",
};
const PALETTE = [
  "#f59e0b","#f97316","#ef4444","#ec4899","#a855f7",
  "#8b5cf6","#3b82f6","#06b6d4","#10b981","#22c55e",
  "#84cc16","#0f172a","#64748b","#dc2626","#7c3aed",
];

const TILES_KEY = "caissio_pos_tiles_v3";

function loadTiles(): POSTile[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(TILES_KEY) || "[]"); } catch { return []; }
}
function saveTiles(tiles: POSTile[]): void {
  if (typeof window !== "undefined") localStorage.setItem(TILES_KEY, JSON.stringify(tiles));
}
function mkid() { return Math.random().toString(36).slice(2) + Date.now().toString(36); }
function fmt(n: number) { return n.toFixed(2) + " €"; }
function catColor(cat: string) { return CAT_COLORS[cat] ?? "#64748b"; }

function hex2rgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function defaultTiles(products: Product[]): POSTile[] {
  return products.filter((p) => p.active).slice(0, 20).map((p) => ({
    id: mkid(), type: "product" as const, label: p.name,
    color: catColor(p.category), product_id: p.id, qty: 1,
  }));
}

/* ────────────────── Numpad ──────────────────────── */
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

/* ────────────────── ThermalTicket ───────────────── */
function ThermalTicket({ cart, total, subtotal, discount, payMode, cashGiven, change, customer, ticketNum, settings }: {
  cart: CartItem[]; total: number; subtotal: number; discount: number;
  payMode: PayMode; cashGiven: number; change: number;
  customer?: Customer; ticketNum: string;
  settings: { name: string; address?: string; siret?: string; ticket_footer?: string };
}) {
  const now = new Date();
  const sep = "─".repeat(32);
  return (
    <div style={{ fontFamily: "'JetBrains Mono','Courier New',monospace", fontSize: 12, lineHeight: 1.7, color: "#111", maxWidth: 300, margin: "0 auto" }}>
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
          <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 4 }}>{item.qty > 1 ? `${item.name} ×${item.qty}` : item.name}</span>
          <span style={{ flexShrink: 0, fontWeight: 600 }}>{fmt(item.price * item.qty)}</span>
        </div>
      ))}
      <div style={{ fontSize: 10, color: "#888", margin: "4px 0" }}>{sep}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}><span>Sous-total</span><span>{fmt(subtotal)}</span></div>
      {discount > 0 && <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#059669" }}><span>Remise</span><span>-{fmt(discount)}</span></div>}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#888" }}><span>TVA (~10%)</span><span>{fmt(total * 0.1)}</span></div>
      <div style={{ fontSize: 10, color: "#888", margin: "4px 0" }}>{sep}</div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 16, fontWeight: 700 }}><span>TOTAL</span><span>{fmt(total)}</span></div>
      <div style={{ fontSize: 10, color: "#888", margin: "4px 0" }}>{sep}</div>
      <div style={{ fontSize: 11 }}>
        <div>Règlement : <strong>{payMode === "cash" ? "Espèces" : payMode === "card" ? "Carte bancaire" : "Sur compte"}</strong></div>
        {payMode === "cash" && cashGiven > 0 && <div>Remis : <strong>{fmt(cashGiven)}</strong></div>}
        {payMode === "cash" && change > 0 && <div>Rendu : <strong style={{ color: "#059669" }}>{fmt(change)}</strong></div>}
      </div>
      {customer && <div style={{ marginTop: 6, fontSize: 10, color: "#4f46e5" }}>+{Math.floor(total)} pts · Total : {customer.points + Math.floor(total)} pts</div>}
      <div style={{ fontSize: 10, color: "#888", margin: "6px 0" }}>{sep}</div>
      <div style={{ textAlign: "center", fontSize: 11, color: "#555" }}>{settings.ticket_footer || "Merci de votre visite !"}</div>
      <div style={{ textAlign: "center", fontSize: 9, color: "#aaa", marginTop: 4 }}>Caissio · caissio.fr</div>
    </div>
  );
}

/* ────────────────── Article modal ───────────────── */
function ArticleModal({ products, onAdd, onClose }: { products: Product[]; onAdd: (p: Product) => void; onClose: () => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const results = useMemo(() => {
    const active = products.filter((p) => p.active);
    if (!q.trim()) return active;
    const lq = q.toLowerCase();
    return active.filter((p) => p.name.toLowerCase().includes(lq) || (p.barcode || "").includes(q) || p.category.toLowerCase().includes(lq));
  }, [q, products]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(15,23,42,.65)", backdropFilter: "blur(8px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "48px 16px 16px" }}>
      <div style={{ width: "100%", maxWidth: 620, background: "#fff", borderRadius: 24, overflow: "hidden", boxShadow: "0 40px 100px rgba(0,0,0,.3)" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 12 }}>
          <Search style={{ width: 20, height: 20, color: "#4f46e5", flexShrink: 0 }} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un article, catégorie ou code-barres…" style={{ flex: 1, border: "none", outline: "none", fontSize: 16, color: "#0f172a", background: "transparent" }} />
          {q && <button onClick={() => setQ("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8" }}><X style={{ width: 16, height: 16 }} /></button>}
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X style={{ width: 15, height: 15, color: "#64748b" }} /></button>
        </div>
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {results.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Aucun article trouvé</div>
          ) : results.map((p) => {
            const col = catColor(p.category);
            return (
              <button key={p.id} onClick={() => { onAdd(p); onClose(); }}
                style={{ width: "100%", padding: "12px 20px", border: "none", borderBottom: "1px solid #f8fafc", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: col, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.category}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 800, color: col }}>{fmt(p.price)}</div>
                  <div style={{ fontSize: 10, color: p.stock === 0 ? "#ef4444" : "#94a3b8" }}>{p.stock === 0 ? "Rupture" : `${p.stock} en stock`}</div>
                </div>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: hex2rgba(col, 0.12), display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus style={{ width: 16, height: 16, color: col }} />
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ padding: "10px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 12, color: "#94a3b8" }}>{results.length} article{results.length > 1 ? "s" : ""}</div>
          <button onClick={onClose} style={{ height: 34, padding: "0 14px", borderRadius: 10, border: "none", background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────── Tile config modal ───────────── */
function TileConfigModal({ tile, products, onSave, onDelete, onClose }: {
  tile: Partial<POSTile> | null;
  products: Product[];
  onSave: (t: POSTile) => void;
  onDelete?: () => void;
  onClose: () => void;
}) {
  const isEdit = !!tile?.id;
  const [type, setType] = useState<TileType>(tile?.type ?? "product");
  const [label, setLabel] = useState(tile?.label ?? "");
  const [color, setColor] = useState(tile?.color ?? "#4f46e5");
  const [productId, setProductId] = useState(tile?.product_id ?? "");
  const [qty, setQty] = useState(tile?.qty ?? 1);
  const [discType, setDiscType] = useState<"%" | "€">(tile?.discount_type ?? "%");
  const [discVal, setDiscVal] = useState(tile?.discount_value ?? 10);
  const [defPrice, setDefPrice] = useState(tile?.default_price ?? 0);
  const [prodSearch, setProdSearch] = useState("");

  const filteredProds = useMemo(() => {
    const lq = prodSearch.toLowerCase();
    return products.filter((p) => p.active && (!prodSearch || p.name.toLowerCase().includes(lq)));
  }, [products, prodSearch]);

  const selectedProd = products.find((p) => p.id === productId);

  // auto-set label and color when product changes
  useEffect(() => {
    if (type === "product" && selectedProd && !isEdit) {
      setLabel(selectedProd.name);
      setColor(catColor(selectedProd.category));
    }
  }, [productId, type, selectedProd, isEdit]);

  const handleSave = () => {
    if (type === "product" && !productId) return;
    const t: POSTile = {
      id: tile?.id ?? mkid(), type, label: label.trim() || "Tuile", color,
      ...(type === "product" ? { product_id: productId, qty } : {}),
      ...(type === "discount" ? { discount_type: discType, discount_value: discVal } : {}),
      ...(type === "free_price" ? { default_price: defPrice } : {}),
    };
    onSave(t);
  };

  const TYPE_ICONS = { product: <Tag style={{ width: 15, height: 15 }} />, discount: <Percent style={{ width: 15, height: 15 }} />, free_price: <Zap style={{ width: 15, height: 15 }} /> };
  const TYPE_LABELS = { product: "Produit rapide", discount: "Remise auto", free_price: "Prix libre" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,23,42,.7)", backdropFilter: "blur(10px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 560, boxShadow: "0 40px 100px rgba(0,0,0,.3)", overflow: "hidden" }}>

        {/* Header */}
        <div style={{ padding: "18px 22px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{isEdit ? "Modifier la tuile" : "Nouvelle tuile"}</div>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><X style={{ width: 15, height: 15, color: "#64748b" }} /></button>
        </div>

        <div style={{ padding: 22, display: "flex", gap: 20 }}>
          {/* Left: Preview */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, flexShrink: 0 }}>
            <div style={{ width: 120, height: 120, borderRadius: 18, background: hex2rgba(color, 0.15), border: `2px solid ${color}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, textAlign: "center" }}>
              <div style={{ fontSize: 30, color, opacity: 0.5 }}>{TYPE_ICONS[type]}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", lineHeight: 1.3, wordBreak: "break-word" }}>{label || "Tuile"}</div>
              {type === "product" && selectedProd && <div style={{ fontSize: 11, fontWeight: 800, color, fontFamily: "'Outfit',sans-serif" }}>{fmt(selectedProd.price * (qty || 1))}</div>}
              {type === "discount" && discVal > 0 && <div style={{ fontSize: 13, fontWeight: 800, color }}>-{discVal}{discType}</div>}
              {type === "free_price" && <div style={{ fontSize: 11, fontWeight: 700, color }}>Prix libre</div>}
            </div>
            {/* Color palette */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 5, width: 120 }}>
              {PALETTE.map((c) => (
                <button key={c} onClick={() => setColor(c)} style={{ width: 20, height: 20, borderRadius: 5, background: c, border: color === c ? "3px solid #0f172a" : "2px solid transparent", cursor: "pointer", padding: 0 }} />
              ))}
            </div>
          </div>

          {/* Right: Config */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Type selector */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Type de tuile</div>
              <div style={{ display: "flex", gap: 6 }}>
                {(["product","discount","free_price"] as TileType[]).map((t) => (
                  <button key={t} onClick={() => setType(t)} style={{ flex: 1, height: 40, borderRadius: 10, border: `2px solid ${type === t ? color : "#e2e8f0"}`, background: type === t ? hex2rgba(color, 0.1) : "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5, fontSize: 11, fontWeight: 700, color: type === t ? color : "#64748b" }}>
                    {TYPE_ICONS[t]}{TYPE_LABELS[t].split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Label */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Étiquette</div>
              <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={24} placeholder="Nom de la tuile…"
                style={{ width: "100%", height: 38, padding: "0 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, color: "#0f172a", outline: "none" }} />
            </div>

            {/* Product config */}
            {type === "product" && (
              <>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Article</div>
                  <div style={{ position: "relative" }}>
                    <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#94a3b8" }} />
                    <input value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} placeholder="Rechercher…"
                      style={{ width: "100%", height: 36, paddingLeft: 30, paddingRight: 10, border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, outline: "none", marginBottom: 4 }} />
                  </div>
                  <select value={productId} onChange={(e) => setProductId(e.target.value)} size={4}
                    style={{ width: "100%", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 12, color: "#0f172a", outline: "none", padding: 4 }}>
                    <option value="">— Choisir un article —</option>
                    {filteredProds.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} · {fmt(p.price)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 5 }}>Quantité ajoutée</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus style={{ width: 13, height: 13 }} /></button>
                    <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, width: 36, textAlign: "center", color: "#0f172a" }}>{qty}</div>
                    <button onClick={() => setQty((q) => q + 1)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus style={{ width: 13, height: 13 }} /></button>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>article(s) ajouté(s) d'un coup</span>
                  </div>
                </div>
              </>
            )}

            {/* Discount config */}
            {type === "discount" && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Remise</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <input type="number" min="0" step="1" value={discVal} onChange={(e) => setDiscVal(Math.max(0, parseFloat(e.target.value) || 0))}
                    style={{ width: 80, height: 38, padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 16, fontWeight: 700, textAlign: "center", outline: "none" }} />
                  <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 10, padding: 3, gap: 3 }}>
                    {(["%","€"] as const).map((t) => (
                      <button key={t} onClick={() => setDiscType(t)} style={{ height: 32, padding: "0 14px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 14, fontWeight: 700, background: discType === t ? color : "transparent", color: discType === t ? "#fff" : "#64748b", transition: "all .15s" }}>{t}</button>
                    ))}
                  </div>
                  <span style={{ fontSize: 12, color: "#64748b" }}>appliquée automatiquement</span>
                </div>
              </div>
            )}

            {/* Free price config */}
            {type === "free_price" && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Prix par défaut (0 = demander à chaque fois)</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <input type="number" min="0" step="0.01" value={defPrice} onChange={(e) => setDefPrice(parseFloat(e.target.value) || 0)}
                    style={{ width: 100, height: 38, padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 16, fontWeight: 700, textAlign: "center", outline: "none" }} />
                  <span style={{ fontSize: 14, color: "#64748b" }}>€</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 8, justifyContent: "space-between" }}>
          {isEdit && onDelete ? (
            <button onClick={onDelete} style={{ height: 42, padding: "0 16px", borderRadius: 12, border: "1px solid #fecaca", background: "#fef2f2", color: "#dc2626", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>Supprimer</button>
          ) : <div />}
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={onClose} style={{ height: 42, padding: "0 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>Annuler</button>
            <button onClick={handleSave} style={{ height: 42, padding: "0 20px", borderRadius: 12, border: "none", background: color, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
              {isEdit ? "Enregistrer" : "Ajouter la tuile"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────── Free price modal ────────────── */
function FreePriceModal({ tile, onConfirm, onClose }: { tile: POSTile; onConfirm: (price: number, label: string) => void; onClose: () => void }) {
  const [price, setPrice] = useState(tile.default_price?.toFixed(2) ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handlePress = (k: string) => setPrice((v) => k === "." ? (v.includes(".") ? v : (v || "0") + ".") : v + k);
  const handleBack = () => setPrice((v) => v.slice(0, -1));

  const val = parseFloat(price) || 0;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 250, background: "rgba(15,23,42,.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 24, width: 360, boxShadow: "0 32px 80px rgba(0,0,0,.25)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>{tile.label} — Prix libre</div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }}><X style={{ width: 16, height: 16, color: "#94a3b8" }} /></button>
        </div>
        <div style={{ padding: 20 }}>
          <input ref={inputRef} type="text" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0,00"
            style={{ width: "100%", height: 56, padding: "0 16px", border: `2px solid ${tile.color}`, borderRadius: 14, fontSize: 28, fontFamily: "monospace", fontWeight: 700, textAlign: "right", outline: "none", marginBottom: 16 }} />
          <Numpad onPress={handlePress} onBack={handleBack} />
          <button onClick={() => val > 0 && onConfirm(val, tile.label)} disabled={val <= 0}
            style={{ width: "100%", height: 50, marginTop: 14, borderRadius: 14, border: "none", background: val > 0 ? tile.color : "#e0e7ff", color: val > 0 ? "#fff" : "#a5b4fc", fontWeight: 700, fontSize: 15, cursor: val > 0 ? "pointer" : "default" }}>
            Ajouter {val > 0 ? fmt(val) : ""}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────── Main POS ────────────────────── */
export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState({ name: "Mon Commerce", address: "", siret: "", ticket_footer: "" });
  const [tiles, setTiles] = useState<POSTile[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [configTile, setConfigTile] = useState<Partial<POSTile> | null>(null);
  const [freePriceTile, setFreePriceTile] = useState<POSTile | null>(null);
  const [showArticle, setShowArticle] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [held, setHeld] = useState<HeldTicket[]>([]);
  const [showHeld, setShowHeld] = useState(false);
  const [stage, setStage] = useState<"pos" | "pay" | "ticket">("pos");
  const [payMode, setPayMode] = useState<PayMode>("card");
  const [cashInput, setCashInput] = useState("");
  const [completedSale, setCompletedSale] = useState<{ ticketNum: string; total: number; change: number } | null>(null);
  const [scanBuffer, setScanBuffer] = useState("");

  /* Init */
  useEffect(() => {
    const prods = getProducts();
    setProducts(prods);
    setCustomers(getCustomers());
    const s = getStoreSettings();
    setSettings({ name: s.name, address: s.address || "", siret: s.siret || "", ticket_footer: s.ticket_footer || "" });
    const stored = loadTiles();
    if (stored.length > 0) setTiles(stored);
    else { const d = defaultTiles(prods); setTiles(d); saveTiles(d); }
  }, []);

  /* Barcode scanner */
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.tagName === "INPUT" || el.tagName === "TEXTAREA") return;
      if (e.key === "Enter" && scanBuffer.length > 3) {
        const found = products.find((p) => p.barcode === scanBuffer);
        if (found) addProductToCart(found, 1);
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

  /* Cart helpers */
  const addProductToCart = useCallback((p: Product, qty = 1) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === p.id);
      if (ex) return c.map((i) => i.id === p.id ? { ...i, qty: i.qty + qty } : i);
      return [...c, { id: p.id, name: p.name, price: p.price, qty }];
    });
  }, []);

  const addFreeItem = (id: string, name: string, price: number) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === id);
      if (ex) return c.map((i) => i.id === id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { id, name, price, qty: 1 }];
    });
  };

  const decCart = (id: string) => setCart((c) => c.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0));
  const incCart = (id: string) => setCart((c) => c.map((i) => i.id === id ? { ...i, qty: i.qty + 1 } : i));
  const removeCart = (id: string) => setCart((c) => c.filter((i) => i.id !== id));
  const clearAll = () => { setCart([]); setDiscount(0); setCustomerId(null); setStage("pos"); setCashInput(""); setCompletedSale(null); setProducts(getProducts()); setCustomers(getCustomers()); };

  /* Tile tap */
  const tapTile = (tile: POSTile) => {
    if (editMode) { setConfigTile(tile); return; }
    if (tile.type === "product") {
      const prod = products.find((p) => p.id === tile.product_id);
      if (prod) addProductToCart(prod, tile.qty ?? 1);
    } else if (tile.type === "discount") {
      const subtotalNow = cart.reduce((s, i) => s + i.price * i.qty, 0);
      const val = tile.discount_type === "%" ? (subtotalNow * (tile.discount_value ?? 0)) / 100 : (tile.discount_value ?? 0);
      setDiscount((d) => parseFloat((d + val).toFixed(2)));
    } else if (tile.type === "free_price") {
      if (tile.default_price && tile.default_price > 0) {
        addFreeItem("free_" + tile.id, tile.label, tile.default_price);
      } else {
        setFreePriceTile(tile);
      }
    }
  };

  /* Tile CRUD */
  const saveTileConfig = (t: POSTile) => {
    setTiles((prev) => {
      const exists = prev.find((x) => x.id === t.id);
      const next = exists ? prev.map((x) => x.id === t.id ? t : x) : [...prev, t];
      saveTiles(next);
      return next;
    });
    setConfigTile(null);
  };

  const deleteTile = (id: string) => {
    setTiles((prev) => { const next = prev.filter((t) => t.id !== id); saveTiles(next); return next; });
    setConfigTile(null);
  };

  /* Drag & drop */
  const onDragStart = (i: number) => setDragIdx(i);
  const onDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverIdx(i); };
  const onDrop = (targetIdx: number) => {
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...tiles];
    const [dragged] = next.splice(dragIdx, 1);
    next.splice(targetIdx, 0, dragged);
    setTiles(next);
    saveTiles(next);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  /* Hold / Recall */
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

  /* Payment */
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = Math.max(0, subtotal - discount);
  const cashNum = parseFloat(cashInput) || 0;
  const change = Math.max(0, cashNum - total);
  const canValidate = payMode === "card" || payMode === "account" || (payMode === "cash" && cashNum >= total - 0.005);

  const validateSale = () => {
    if (!canValidate || (payMode === "account" && !customerId)) return;
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
  const selectedCustomer = customers.find((c) => c.id === customerId);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');
        * { box-sizing: border-box; }
        @keyframes wobble { 0%,100%{transform:rotate(0deg)} 25%{transform:rotate(-1.5deg)} 75%{transform:rotate(1.5deg)} }
        .tile-wobble { animation: wobble 0.5s ease-in-out infinite; }
        .tile-btn:hover:not(:disabled) { filter: brightness(0.93); transform: scale(0.97); }
        .tile-btn:active:not(:disabled) { transform: scale(0.93); }
      `}</style>

      {/* ══════════ LEFT: Tile grid ══════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f1f5f9" }}>

        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 14px", display: "flex", gap: 8, flexShrink: 0, alignItems: "center" }}>
          <button onClick={() => setShowArticle(true)} style={{ height: 42, padding: "0 16px", borderRadius: 10, background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
            <BookOpen style={{ width: 15, height: 15 }} /> Article
          </button>
          <div style={{ flex: 1 }} />
          {editMode && (
            <button onClick={() => setConfigTile({})} style={{ height: 42, padding: "0 14px", borderRadius: 10, background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Plus style={{ width: 15, height: 15 }} /> Ajouter une tuile
            </button>
          )}
          <button onClick={() => setEditMode((v) => !v)} style={{ height: 42, padding: "0 14px", borderRadius: 10, border: `2px solid ${editMode ? "#4f46e5" : "#e2e8f0"}`, background: editMode ? "#ede9fe" : "#fff", color: editMode ? "#4f46e5" : "#64748b", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Pencil style={{ width: 14, height: 14 }} /> {editMode ? "Terminer" : "Personnaliser"}
          </button>
        </div>

        {/* Edit mode banner */}
        {editMode && (
          <div style={{ background: "#ede9fe", borderBottom: "1px solid #c4b5fd", padding: "8px 16px", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <Pencil style={{ width: 14, height: 14, color: "#4f46e5" }} />
            <span style={{ fontSize: 12, color: "#4f46e5", fontWeight: 600 }}>Mode personnalisation — Glissez pour réorganiser · Cliquez sur une tuile pour la modifier · × pour supprimer</span>
          </div>
        )}

        {/* Tile grid */}
        <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
            {tiles.map((tile, i) => {
              const prod = tile.type === "product" ? products.find((p) => p.id === tile.product_id) : null;
              const isDragging = dragIdx === i;
              const isDragOver = dragOverIdx === i;

              return (
                <div key={tile.id}
                  draggable={editMode}
                  onDragStart={() => onDragStart(i)}
                  onDragOver={(e) => onDragOver(e, i)}
                  onDrop={() => onDrop(i)}
                  onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                  style={{ opacity: isDragging ? 0.4 : 1, outline: isDragOver ? `3px dashed ${tile.color}` : "none", borderRadius: 16, transition: "opacity .15s" }}
                >
                  <button
                    className={`tile-btn${editMode ? " tile-wobble" : ""}`}
                    onClick={() => tapTile(tile)}
                    disabled={!editMode && tile.type === "product" && prod?.stock === 0}
                    style={{
                      width: "100%",
                      minHeight: 110,
                      borderRadius: 14,
                      border: `2px solid ${hex2rgba(tile.color, 0.3)}`,
                      background: hex2rgba(tile.color, 0.12),
                      padding: 0,
                      cursor: "pointer",
                      position: "relative",
                      transition: "all .1s",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                      opacity: (!editMode && tile.type === "product" && prod?.stock === 0) ? 0.45 : 1,
                    }}
                  >
                    {/* Top accent */}
                    <div style={{ height: 5, background: tile.color, flexShrink: 0 }} />

                    {/* Delete btn (edit mode) */}
                    {editMode && (
                      <button onClick={(e) => { e.stopPropagation(); deleteTile(tile.id); }}
                        style={{ position: "absolute", top: 8, right: 6, width: 22, height: 22, borderRadius: "50%", background: "#ef4444", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 5, boxShadow: "0 2px 6px rgba(239,68,68,.4)" }}>
                        <X style={{ width: 11, height: 11, color: "#fff" }} />
                      </button>
                    )}

                    {/* Drag handle (edit mode) */}
                    {editMode && (
                      <div style={{ position: "absolute", top: 8, left: 6, color: hex2rgba(tile.color, 0.6), zIndex: 5 }}>
                        <GripVertical style={{ width: 14, height: 14 }} />
                      </div>
                    )}

                    {/* Content */}
                    <div style={{ flex: 1, padding: "8px 10px 10px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      {/* Icon / type indicator */}
                      <div style={{ fontSize: 26, color: tile.color, opacity: 0.3, lineHeight: 1, fontFamily: "'Outfit',sans-serif", fontWeight: 900, marginBottom: 4 }}>
                        {tile.type === "product" ? (tile.label[0]?.toUpperCase()) : tile.type === "discount" ? "%" : "€"}
                      </div>

                      <div>
                        {/* Label */}
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", lineHeight: 1.3, marginBottom: 3, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {tile.label}
                        </div>

                        {/* Value */}
                        {tile.type === "product" && prod && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 900, color: tile.color }}>
                              {fmt(prod.price * (tile.qty ?? 1))}
                            </div>
                            {(tile.qty ?? 1) > 1 && <div style={{ fontSize: 9, color: tile.color, fontWeight: 700 }}>×{tile.qty}</div>}
                            {prod.stock === 0 && <div style={{ fontSize: 9, fontWeight: 800, color: "#ef4444", background: "#fee2e2", padding: "1px 4px", borderRadius: 3 }}>Rupture</div>}
                          </div>
                        )}
                        {tile.type === "discount" && (
                          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 14, fontWeight: 900, color: tile.color }}>-{tile.discount_value}{tile.discount_type}</div>
                        )}
                        {tile.type === "free_price" && (
                          <div style={{ fontSize: 10, color: tile.color, fontWeight: 700 }}>Prix libre</div>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}

            {/* Add tile button */}
            {editMode && (
              <button onClick={() => setConfigTile({})}
                style={{ minHeight: 110, borderRadius: 14, border: "2px dashed #c4b5fd", background: "#faf8ff", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, transition: "all .15s" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#ede9fe"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "#faf8ff"; }}
              >
                <Plus style={{ width: 22, height: 22, color: "#4f46e5" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5" }}>Ajouter</span>
              </button>
            )}

            {tiles.length === 0 && !editMode && (
              <div style={{ gridColumn: "1/-1", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, paddingTop: 48, color: "#94a3b8" }}>
                <ShoppingBag style={{ width: 36, height: 36, opacity: 0.3 }} />
                <div style={{ fontSize: 14, textAlign: "center" }}>Aucune tuile configurée.<br />Cliquez sur <strong>Personnaliser</strong> pour commencer.</div>
              </div>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "6px 14px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0 }}>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{tiles.length} tuile{tiles.length > 1 ? "s" : ""}</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>·</span>
          <span style={{ fontSize: 11, color: "#94a3b8" }}>{products.length} articles dans le catalogue</span>
          <div style={{ flex: 1 }} />
          <button onClick={() => setShowArticle(true)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "#4f46e5", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
            <Search style={{ width: 12, height: 12 }} /> Catalogue complet
          </button>
        </div>
      </div>

      {/* ══════════ RIGHT: Cart ══════════ */}
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
              <span style={{ fontSize: 9, fontWeight: 600, color: btn.active ? "#4f46e5" : "#64748b", textAlign: "center", maxWidth: 68, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 2px" }}>{btn.label}</span>
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

        {/* Customer */}
        <div style={{ padding: "8px 12px", borderBottom: "1px solid #f1f5f9", flexShrink: 0 }}>
          <select value={customerId ?? ""} onChange={(e) => setCustomerId(e.target.value || null)}
            style={{ width: "100%", height: 36, padding: "0 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#64748b", outline: "none", background: "#f8fafc" }}>
            <option value="">— Client anonyme —</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {c.points} pts{c.balance > 0 ? ` · Doit ${fmt(c.balance)}` : ""}</option>)}
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
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 10 }}>
              <Receipt style={{ width: 36, height: 36, color: "#e2e8f0" }} />
              <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>Touchez une tuile pour<br />commencer la vente.</div>
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
                <div style={{ fontSize: 13, fontWeight: 700, width: 26, textAlign: "center" }}>{item.qty}</div>
                <button onClick={() => incCart(item.id)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus style={{ width: 12, height: 12, color: "#64748b" }} /></button>
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
            style={{ width: "100%", height: 52, borderRadius: 14, background: cart.length === 0 ? "#e0e7ff" : "#4f46e5", color: cart.length === 0 ? "#a5b4fc" : "#fff", fontWeight: 700, fontSize: 16, border: "none", cursor: cart.length === 0 ? "not-allowed" : "pointer" }}>
            Encaisser →
          </button>
        </div>
      </aside>

      {/* ══════════ MODALS ══════════ */}
      {showArticle && <ArticleModal products={products} onAdd={(p) => addProductToCart(p, 1)} onClose={() => setShowArticle(false)} />}

      {configTile !== null && (
        <TileConfigModal
          tile={configTile}
          products={products}
          onSave={saveTileConfig}
          onDelete={configTile.id ? () => deleteTile(configTile.id!) : undefined}
          onClose={() => setConfigTile(null)}
        />
      )}

      {freePriceTile && (
        <FreePriceModal
          tile={freePriceTile}
          onConfirm={(price, label) => { addFreeItem("free_" + freePriceTile.id, label, price); setFreePriceTile(null); }}
          onClose={() => setFreePriceTile(null)}
        />
      )}

      {/* Payment modal */}
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
              <div style={{ padding: 24, borderRight: "1px solid #f1f5f9" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 20 }}>
                  {([["cash", Banknote, "Espèces"], ["card", CreditCard, "Carte"], ["account", UserCheck, "Sur compte"]] as const).map(([mode, Icon, lbl]) => (
                    <button key={mode} onClick={() => { setPayMode(mode); setCashInput(""); }}
                      style={{ height: 64, borderRadius: 14, border: `2px solid ${payMode === mode ? "#4f46e5" : "#e2e8f0"}`, background: payMode === mode ? "#ede9fe" : "#f8fafc", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 5 }}>
                      <Icon style={{ width: 18, height: 18, color: payMode === mode ? "#4f46e5" : "#64748b" }} />
                      <span style={{ fontSize: 11, fontWeight: 700, color: payMode === mode ? "#4f46e5" : "#64748b" }}>{lbl}</span>
                    </button>
                  ))}
                </div>
                {payMode === "cash" && (
                  <div>
                    <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Montant remis</div>
                    <input type="text" inputMode="decimal" value={cashInput} onChange={(e) => setCashInput(e.target.value.replace(/[^\d.]/g, ""))} placeholder="0,00" autoFocus
                      style={{ width: "100%", height: 52, padding: "0 14px", border: "2px solid #4f46e5", borderRadius: 12, fontSize: 22, fontFamily: "monospace", fontWeight: 700, textAlign: "right", outline: "none", marginBottom: 10 }} />
                    <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                      {[5,10,20,50,100].map((a) => <button key={a} onClick={() => setCashInput(String(a))} style={{ height: 36, padding: "0 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, color: "#0f172a", cursor: "pointer" }}>{a} €</button>)}
                      <button onClick={() => setCashInput(total.toFixed(2))} style={{ height: 36, padding: "0 14px", borderRadius: 10, border: "none", background: "#0f172a", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Exact</button>
                    </div>
                    <div style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 14px", fontSize: 13 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#64748b" }}><span>À payer</span><span style={{ fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>{fmt(total)}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, color: "#64748b" }}><span>Remis</span><span style={{ fontFamily: "monospace", fontWeight: 600 }}>{cashNum > 0 ? fmt(cashNum) : "—"}</span></div>
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
                    <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>Validez sur le TPE</div>
                  </div>
                )}
                {payMode === "account" && (
                  <div style={{ padding: 20, background: "#fffbeb", borderRadius: 14, border: "1px solid #fde68a" }}>
                    <UserCheck style={{ width: 28, height: 28, color: "#d97706", marginBottom: 10 }} />
                    {customerId ? (
                      <><div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Mise sur le compte de</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: "#d97706" }}>{selectedCustomer?.name}</div>
                        <div style={{ fontSize: 13, color: "#92400e", marginTop: 6 }}>{fmt(total)} sera ajouté à sa note.</div></>
                    ) : <div style={{ fontSize: 13, color: "#92400e" }}>⚠ Sélectionnez d&apos;abord un client.</div>}
                  </div>
                )}
              </div>
              <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
                {payMode === "cash" && <Numpad onPress={numpadPress} onBack={numpadBack} />}
                {payMode !== "cash" && (
                  <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
                    <div style={{ width: 80, height: 80, borderRadius: 20, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {payMode === "card" ? <CreditCard style={{ width: 36, height: 36, color: "#4f46e5" }} /> : <UserCheck style={{ width: 36, height: 36, color: "#4f46e5" }} />}
                    </div>
                    <div style={{ fontSize: 13, color: "#64748b", textAlign: "center" }}>{payMode === "card" ? "Validez sur le terminal puis confirmez" : customerId ? "Confirmez la mise sur compte" : "Choisissez un client"}</div>
                  </div>
                )}
                <button onClick={validateSale} disabled={!canValidate || (payMode === "account" && !customerId)}
                  style={{ width: "100%", height: 60, borderRadius: 16, background: canValidate && !(payMode === "account" && !customerId) ? "#4f46e5" : "#e0e7ff", color: canValidate && !(payMode === "account" && !customerId) ? "#fff" : "#a5b4fc", fontWeight: 700, fontSize: 18, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                  <Check style={{ width: 20, height: 20 }} /> Valider la vente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ticket modal */}
      {stage === "ticket" && completedSale && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.55)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 24, width: "100%", maxWidth: 560, boxShadow: "0 32px 80px rgba(0,0,0,.25)", overflow: "hidden" }}>
            <div style={{ padding: 20, background: "#f0fdf4", borderBottom: "1px solid #d1fae5", display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Check style={{ width: 24, height: 24, color: "#059669" }} />
              </div>
              <div>
                <div style={{ fontSize: 11, color: "#059669", fontWeight: 700, textTransform: "uppercase" }}>Vente validée · #{completedSale.ticketNum}</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Total encaissé : {fmt(completedSale.total)}</div>
                {payMode === "cash" && completedSale.change > 0 && <div style={{ fontSize: 14, color: "#059669", fontWeight: 600 }}>Rendu : {fmt(completedSale.change)}</div>}
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
