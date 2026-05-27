"use client";
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  Search, Trash2, Plus, Minus, Percent, CreditCard, Banknote,
  Receipt, DoorOpen, X, Check, Leaf, Mail, Phone, Printer,
  PauseCircle, RotateCcw, Users, Delete, UserCheck,
  ChevronLeft, BookOpen, PlusCircle, Edit2, Loader2,
} from "lucide-react";
import {
  getProducts, getCustomers, recordSale, getStoreSettings,
  saveProduct, updateProduct, deleteProduct,
  migrateMissingCategories, migrateV2,
  getCustomCategories, saveCustomCategory, deleteCustomCategory,
  type Product, type Customer, type CustomCategory,
} from "@/lib/caissio-store";
import { detectQZ, printViaQZ, openDrawerQZ, type TicketData } from "@/lib/caissio-printer";

/* ── Types ───────────────────────────────────────── */
type CartItem = { id: string; name: string; price: number; qty: number };
type HeldTicket = { id: number; cart: CartItem[]; discount: number; customerId: string | null; ts: Date };
type PayMode = "cash" | "card" | "account";

function fmt(n: number) { return n.toFixed(2) + " €"; }

/* ── Category definitions ────────────────────────── */
const CAT_DEF: { name: string; emoji: string; color: string; light: string }[] = [
  { name: "Boulangerie",  emoji: "🥐", color: "#f59e0b", light: "#fef3c7" },
  { name: "Boissons",     emoji: "🥤", color: "#3b82f6", light: "#dbeafe" },
  { name: "Snacks",       emoji: "🥪", color: "#10b981", light: "#d1fae5" },
  { name: "Épicerie",     emoji: "🛒", color: "#8b5cf6", light: "#ede9fe" },
  { name: "Fruits",       emoji: "🍎", color: "#f43f5e", light: "#ffe4e6" },
  { name: "Légumes",      emoji: "🥦", color: "#22c55e", light: "#dcfce7" },
  { name: "Fromage",      emoji: "🧀", color: "#f97316", light: "#ffedd5" },
  { name: "Charcuterie",  emoji: "🥩", color: "#ef4444", light: "#fee2e2" },
];

function getCatDef(name: string) {
  return CAT_DEF.find((c) => c.name === name) ?? { name, emoji: "📦", color: "#64748b", light: "#f1f5f9" };
}

const CAT_COLOR_PRESETS: { color: string; light: string }[] = [
  { color: "#ef4444", light: "#fee2e2" },
  { color: "#f97316", light: "#ffedd5" },
  { color: "#f59e0b", light: "#fef3c7" },
  { color: "#22c55e", light: "#dcfce7" },
  { color: "#3b82f6", light: "#dbeafe" },
  { color: "#8b5cf6", light: "#ede9fe" },
  { color: "#ec4899", light: "#fce7f3" },
  { color: "#06b6d4", light: "#cffafe" },
  { color: "#64748b", light: "#f1f5f9" },
  { color: "#0f172a", light: "#f8fafc" },
];
const CAT_EMOJIS = ["🥩","🧀","🥛","🐟","🥗","🥐","🛒","🥤","🍎","🥦","🧁","🍕","🧴","💊","🔧","📦","🌿","🫙","🍷","☕","🥚","🧅","🧄","🍋","🫧","🏷️"];

/* ── Numpad ──────────────────────────────────────── */
function Numpad({ onPress, onBack }: { onPress: (k: string) => void; onBack: () => void }) {
  const keys = ["1","2","3","4","5","6","7","8","9",".","0","←"];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
      {keys.map((k) => (
        <button key={k} onClick={() => k === "←" ? onBack() : onPress(k)}
          style={{ height: 56, borderRadius: 12, border: "1px solid #e2e8f0", background: k === "←" ? "#f8fafc" : "#fff", fontSize: k === "←" ? 14 : 22, fontWeight: 300, color: "#0f172a", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
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

/* ── Article search modal ────────────────────────── */
function ArticleModal({ products, onAdd, onClose, getCatFn }: { products: Product[]; onAdd: (p: Product) => void; onClose: () => void; getCatFn?: (name: string) => { name: string; emoji: string; color: string; light: string } }) {
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
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nom, catégorie, code-barres…"
            style={{ flex: 1, border: "none", outline: "none", fontSize: 16, color: "#0f172a", background: "transparent" }} />
          {q && <button onClick={() => setQ("")} style={{ background: "none", border: "none", cursor: "pointer" }}><X style={{ width: 16, height: 16, color: "#94a3b8" }} /></button>}
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X style={{ width: 15, height: 15, color: "#64748b" }} />
          </button>
        </div>
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {results.length === 0 ? (
            <div style={{ padding: "40px 0", textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Aucun article trouvé</div>
          ) : results.map((p) => {
            const cat = getCatFn ? getCatFn(p.category) : getCatDef(p.category);
            return (
              <button key={p.id} onClick={() => { onAdd(p); onClose(); }}
                style={{ width: "100%", padding: "13px 20px", border: "none", borderBottom: "1px solid #f8fafc", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 14, textAlign: "left" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <span style={{ fontSize: 22 }}>{cat.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.category}</div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 800, color: cat.color }}>{fmt(p.price)}</div>
                  <div style={{ fontSize: 10, color: p.stock === 0 ? "#ef4444" : "#94a3b8" }}>{p.stock === 0 ? "Rupture" : `${p.stock} en stock`}</div>
                </div>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: cat.light, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Plus style={{ width: 16, height: 16, color: cat.color }} />
                </div>
              </button>
            );
          })}
        </div>
        <div style={{ padding: "10px 20px", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between" }}>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{results.length} article{results.length > 1 ? "s" : ""}</span>
          <button onClick={onClose} style={{ height: 34, padding: "0 14px", borderRadius: 10, border: "none", background: "#f1f5f9", color: "#64748b", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Fermer</button>
        </div>
      </div>
    </div>
  );
}

/* ── Context-menu types ──────────────────────────── */
type CtxMenu = { type: "cat"; catName: string; x: number; y: number }
             | { type: "prod"; product: Product; x: number; y: number }
             | null;

/* ── Quick-add product modal ─────────────────────── */
function ProductFormModal({
  initialCat,
  initialProduct,
  extraCats,
  onSave,
  onClose,
}: {
  initialCat?: string;
  initialProduct?: Product;
  extraCats?: string[];
  onSave: (widget: boolean, category: string) => void;
  onClose: () => void;
}) {
  const cats = [...["Boulangerie","Boissons","Snacks","Épicerie","Fruits","Légumes","Fromage","Charcuterie","Autre"], ...(extraCats ?? [])];
  const [form, setForm] = useState({
    name: initialProduct?.name ?? "",
    price: initialProduct?.price?.toString() ?? "",
    category: initialProduct?.category ?? initialCat ?? "Autre",
    barcode: initialProduct?.barcode ?? "",
    stock: initialProduct?.stock?.toString() ?? "0",
    tva: initialProduct?.tva?.toString() ?? "20",
  });
  // widget = accès direct sur l'écran d'accueil ; sous-widget = dans sa catégorie (défaut)
  const [displayMode, setDisplayMode] = useState<"widget" | "subwidget">(
    initialProduct?.widget ? "widget" : "subwidget"
  );
  const [err, setErr] = useState("");

  const handleSave = () => {
    if (!form.name.trim()) { setErr("Nom requis"); return; }
    const price = parseFloat(form.price);
    if (isNaN(price) || price < 0) { setErr("Prix invalide"); return; }
    const isWidget = displayMode === "widget";
    const data = {
      name: form.name.trim(),
      price,
      category: form.category,
      barcode: form.barcode.trim() || undefined,
      stock: parseInt(form.stock) || 0,
      stock_min: 5,
      tva: parseFloat(form.tva) || 20,
      active: true,
      widget: isWidget,
    };
    if (initialProduct) {
      updateProduct(initialProduct.id, data);
    } else {
      saveProduct(data);
    }
    onSave(isWidget, form.category);
    onClose();
  };

  const field = (label: string, key: keyof typeof form, opts?: { type?: string; placeholder?: string }) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b" }}>{label}</span>
      <input
        type={opts?.type ?? "text"}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={opts?.placeholder}
        style={{ height: 40, padding: "0 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" }}
      />
    </label>
  );

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,23,42,.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420, boxShadow: "0 32px 80px rgba(0,0,0,.25)", overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>
            {initialProduct ? "Modifier l'article" : "Nouvel article"}
          </div>
          <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <X style={{ width: 14, height: 14, color: "#64748b" }} />
          </button>
        </div>
        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {field("Nom de l'article", "name", { placeholder: "ex: Café expresso" })}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {field("Prix (€)", "price", { type: "number", placeholder: "2.50" })}
            {field("Stock", "stock", { type: "number", placeholder: "0" })}
          </div>
          <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b" }}>Catégorie</span>
            <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              style={{ height: 40, padding: "0 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" }}>
              {cats.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {field("Code-barres", "barcode", { placeholder: "EAN13..." })}
            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b" }}>TVA (%)</span>
              <select value={form.tva} onChange={(e) => setForm((f) => ({ ...f, tva: e.target.value }))}
                style={{ height: 40, padding: "0 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" }}>
                <option value="5.5">5,5 %</option>
                <option value="10">10 %</option>
                <option value="20">20 %</option>
              </select>
            </label>
          </div>
          {/* Affichage : widget vs sous-widget */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b", marginBottom: 8 }}>Comment afficher cet article ?</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <button type="button" onClick={() => setDisplayMode("subwidget")}
                style={{ padding: "10px 8px", borderRadius: 10, border: `2px solid ${displayMode === "subwidget" ? "#4f46e5" : "#e2e8f0"}`, background: displayMode === "subwidget" ? "#ede9fe" : "#f8fafc", cursor: "pointer", textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>📂</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: displayMode === "subwidget" ? "#4f46e5" : "#64748b" }}>Sous-catégorie</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Dans &quot;{form.category}&quot;</div>
              </button>
              <button type="button" onClick={() => setDisplayMode("widget")}
                style={{ padding: "10px 8px", borderRadius: 10, border: `2px solid ${displayMode === "widget" ? "#f59e0b" : "#e2e8f0"}`, background: displayMode === "widget" ? "#fffbeb" : "#f8fafc", cursor: "pointer", textAlign: "center" }}>
                <div style={{ fontSize: 18, marginBottom: 4 }}>⚡</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: displayMode === "widget" ? "#d97706" : "#64748b" }}>Widget direct</div>
                <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>Accès rapide en accueil</div>
              </button>
            </div>
          </div>

          {err && <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>{err}</div>}
        </div>
        <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#64748b" }}>Annuler</button>
          <button onClick={handleSave} style={{ flex: 2, height: 44, borderRadius: 12, border: "none", background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            {initialProduct ? "Enregistrer" : "Créer l'article"}
          </button>
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
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showArticle, setShowArticle] = useState(false);
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
  const [ctxMenu, setCtxMenu] = useState<CtxMenu>(null);
  const [productForm, setProductForm] = useState<{ open: boolean; cat?: string; product?: Product }>({ open: false });
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "cat" | "prod"; catName?: string; product?: Product } | null>(null);
  const lpTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [customCatDefs, setCustomCatDefs] = useState<CustomCategory[]>([]);
  const [showAddCatForm, setShowAddCatForm] = useState(false);
  const [addCatForm, setAddCatForm] = useState({ name: "", emoji: "🏷️", color: "#8b5cf6", light: "#ede9fe" });

  /* Email ticket */
  const [emailStep, setEmailStep] = useState<null | "input" | "sending" | "done">(null);
  const [emailVal,  setEmailVal]  = useState("");
  const [smsToast,  setSmsToast]  = useState(false);

  /* Long-press helpers */
  const startLongPress = (e: React.MouseEvent | React.TouchEvent, menu: NonNullable<CtxMenu>) => {
    lpTimer.current = setTimeout(() => {
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setCtxMenu({ ...menu, x: rect.left + rect.width / 2, y: rect.top });
    }, 500);
  };
  const cancelLongPress = () => { if (lpTimer.current) clearTimeout(lpTimer.current); };

  const reloadProducts = () => setProducts(getProducts());

  useEffect(() => {
    migrateMissingCategories();
    migrateV2(); // add photos + new products
    const prods = getProducts();
    setProducts(prods);
    setCustomers(getCustomers());
    const s = getStoreSettings();
    setSettings({ name: s.name, address: s.address || "", siret: s.siret || "", ticket_footer: s.ticket_footer || "" });
    setCustomCatDefs(getCustomCategories());
  }, []);

  /* Barcode scanner */
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

  /* Categories that have products (or are custom) */
  const categories = useMemo(() => {
    const catOrder = CAT_DEF.map((c) => c.name);
    const existing = Array.from(new Set(products.map((p) => p.category)));
    const customNames = customCatDefs.map((c) => c.name);
    const all = Array.from(new Set([...existing, ...customNames]));
    return [
      ...catOrder.filter((c) => all.includes(c)),
      ...all.filter((c) => !catOrder.includes(c)),
    ];
  }, [products, customCatDefs]);

  /* Filtered products for selected category */
  const catProducts = useMemo(() => {
    if (!selectedCat) return [];
    return products.filter((p) => p.active && p.category === selectedCat &&
      (!search || p.name.toLowerCase().includes(search.toLowerCase())));
  }, [products, selectedCat, search]);

  /* Cart helpers */
  const addToCart = useCallback((p: Product) => {
    setCart((c) => {
      const ex = c.find((i) => i.id === p.id);
      if (ex) return c.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { id: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  }, []);

  const decCart = (id: string) => setCart((c) => c.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0));
  const incCart = (id: string) => setCart((c) => c.map((i) => i.id === id ? { ...i, qty: i.qty + 1 } : i));
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
    detectQZ().then((ok) => { if (ok) openDrawerQZ().catch(() => {}); }).catch(() => {});
  };

  const numpadPress = (k: string) => setCashInput((v) => k === "." ? (v.includes(".") ? v : (v || "0") + ".") : v + k);
  const numpadBack = () => setCashInput((v) => v.slice(0, -1));
  const selectedCustomer = customers.find((c) => c.id === customerId);

  const getCat = useCallback((name: string) => {
    const custom = customCatDefs.find((c) => c.name === name);
    return custom ?? getCatDef(name);
  }, [customCatDefs]);

  const activeCat = selectedCat ? getCat(selectedCat) : null;

  const handleAddCat = () => {
    if (!addCatForm.name.trim()) return;
    saveCustomCategory({
      name: addCatForm.name.trim(),
      emoji: addCatForm.emoji,
      color: addCatForm.color,
      light: addCatForm.light,
    });
    setCustomCatDefs(getCustomCategories());
    setShowAddCatForm(false);
    setAddCatForm({ name: "", emoji: "🏷️", color: "#8b5cf6", light: "#ede9fe" });
  };

  /* ── Impression ──────────────────────────────────── */
  const handlePrint = async () => {
    if (!completedSale) return;
    // ── Tentative QZ Tray : impression silencieuse sur toutes imprimantes thermiques ──
    try {
      const hasQZ = await detectQZ();
      if (hasQZ) {
        const ticketData: TicketData = {
          storeName:    settings.name,
          storeAddress: settings.address || undefined,
          ticketNum:    completedSale.ticketNum,
          dateStr:      new Date().toLocaleDateString("fr-FR") + " " + new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          items:        cart.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
          subtotal, discount, total, payMode,
          ...(payMode === "cash" && cashNum > 0 ? { cashGiven: cashNum } : {}),
          ...(completedSale.change > 0 ? { change: completedSale.change } : {}),
        };
        await printViaQZ(ticketData);
        setTimeout(clearAll, 500);
        return;
      }
    } catch { /* QZ non disponible, on continue vers le fallback navigateur */ }
    // ── Fallback : dialogue navigateur avec le ticket HTML déjà rendu ──
    setTimeout(() => {
      window.print();
      setTimeout(clearAll, 1000);
    }, 100);
  };

  /* ── Envoi email ticket ───────────────────────────── */
  const sendByEmail = async () => {
    if (!emailVal.trim() || !completedSale) return;
    setEmailStep("sending");
    try {
      await fetch("/api/caissio/send-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toEmail:      emailVal.trim(),
          storeName:    settings.name,
          storeAddress: settings.address || undefined,
          siret:        settings.siret   || undefined,
          ticketNum:    completedSale.ticketNum,
          items:        cart.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
          subtotal, discount, total, payMode,
          cashGiven:    payMode === "cash" ? cashNum : undefined,
          change:       completedSale.change > 0 ? completedSale.change : undefined,
          customerName: selectedCustomer?.name,
        }),
      });
      setEmailStep("done");
      setTimeout(() => { setEmailStep(null); setEmailVal(""); clearAll(); }, 1800);
    } catch {
      setEmailStep("input");
    }
  };

  /* ── Toast SMS ────────────────────────────────────── */
  const handleSms = () => {
    setSmsToast(true);
    setTimeout(() => setSmsToast(false), 2500);
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');
        * { box-sizing: border-box; }
        .cat-card:hover { transform: scale(1.03); filter: brightness(0.97); }
        .cat-card:active { transform: scale(0.97); }
        .prod-card:hover:not(:disabled) { transform: scale(0.97); filter: brightness(0.95); }
        .prod-card:active:not(:disabled) { transform: scale(0.93); }
        @media print {
          @page {
            size: 80mm auto;
            margin: 2mm;
          }
          body * { visibility: hidden !important; }
          #ticket-print, #ticket-print * { visibility: visible !important; }
          #ticket-print {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            width: 76mm !important;
            border: none !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            padding: 2mm !important;
            background: #fff !important;
          }
        }
      `}</style>

      {/* ══════════ LEFT: Categories / Products ══════════ */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#f1f5f9" }}>

        {/* Top bar */}
        <div style={{ background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "10px 14px", display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          {selectedCat ? (
            /* Category header with back button */
            <>
              <button onClick={() => { setSelectedCat(null); setSearch(""); }}
                style={{ height: 42, padding: "0 14px", borderRadius: 10, background: "#f1f5f9", border: "1px solid #e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", gap: 6, fontWeight: 600, fontSize: 13, color: "#64748b", flexShrink: 0 }}>
                <ChevronLeft style={{ width: 16, height: 16 }} /> Retour
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
                <span style={{ fontSize: 24 }}>{activeCat?.emoji}</span>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: activeCat?.color }}>{selectedCat}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginLeft: 4 }}>{catProducts.length} article{catProducts.length > 1 ? "s" : ""}</div>
              </div>
              <div style={{ position: "relative", width: 200 }}>
                <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#94a3b8" }} />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Filtrer ${selectedCat.toLowerCase()}…`}
                  style={{ width: "100%", height: 38, paddingLeft: 32, paddingRight: 10, border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 13, outline: "none", background: "#f8fafc" }} />
              </div>
              <button onClick={() => setProductForm({ open: true, cat: selectedCat })}
                title="Ajouter un article dans cette catégorie"
                style={{ height: 38, width: 38, borderRadius: 10, background: "#ede9fe", color: "#4f46e5", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <PlusCircle style={{ width: 18, height: 18 }} />
              </button>
            </>
          ) : (
            /* Default header */
            <>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a", flex: 1 }}>Caisse</div>
              <button onClick={() => setShowArticle(true)}
                style={{ height: 40, padding: "0 14px", borderRadius: 10, background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                <BookOpen style={{ width: 14, height: 14 }} /> Rechercher un article
              </button>
              <button onClick={() => setProductForm({ open: true })}
                style={{ height: 40, width: 40, borderRadius: 10, background: "#ede9fe", color: "#4f46e5", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <PlusCircle style={{ width: 18, height: 18 }} />
              </button>
            </>
          )}
        </div>

        {/* ── Accès rapide bar (horizontal scroll, always visible when widgets exist) ── */}
        {products.filter((p) => p.active && p.widget).length > 0 && (
          <div style={{ flexShrink: 0, background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "8px 14px 10px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 7 }}>⚡ Accès rapide</div>
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 2 }}>
              {products.filter((p) => p.active && p.widget).map((p) => {
                const wcat = getCat(p.category);
                const inCart = cart.filter((i) => i.id === p.id).reduce((s, i) => s + i.qty, 0);
                const outOfStock = p.stock === 0;
                return (
                  <button key={p.id} onClick={() => !outOfStock && addToCart(p)}
                    disabled={outOfStock}
                    style={{ position: "relative", flexShrink: 0, height: 52, padding: "0 16px", borderRadius: 13, border: `2px solid ${outOfStock ? "#e2e8f0" : wcat.color + "40"}`, background: outOfStock ? "#f8fafc" : wcat.light, cursor: outOfStock ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 9, opacity: outOfStock ? 0.55 : 1, transition: "all .12s" }}>
                    {inCart > 0 && (
                      <span style={{ position: "absolute", top: -5, right: -5, background: wcat.color, color: "#fff", fontSize: 10, fontWeight: 800, borderRadius: 9, minWidth: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>{inCart}</span>
                    )}
                    <span style={{ fontSize: 18 }}>{wcat.emoji}</span>
                    <div style={{ textAlign: "left" }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>{p.name}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: wcat.color }}>{p.price.toFixed(2)} €</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── CATEGORY GRID ── */}
        {!selectedCat && (
          <div style={{ flex: 1, overflowY: "auto", padding: 16, position: "relative" }}>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14 }}>
              {categories.map((catName) => {
                const cat = getCat(catName);
                const count = products.filter((p) => p.active && p.category === catName).length;
                return (
                  <button key={catName} className="cat-card"
                    onClick={() => setSelectedCat(catName)}
                    onMouseDown={(e) => startLongPress(e, { type: "cat", catName, x: 0, y: 0 })}
                    onMouseUp={cancelLongPress}
                    onMouseLeave={cancelLongPress}
                    onTouchStart={(e) => startLongPress(e, { type: "cat", catName, x: 0, y: 0 })}
                    onTouchEnd={cancelLongPress}
                    onTouchMove={cancelLongPress}
                    style={{
                      background: cat.light,
                      border: `2px solid ${cat.color}30`,
                      borderRadius: 20,
                      padding: 0,
                      cursor: "pointer",
                      overflow: "hidden",
                      transition: "all .15s",
                      display: "flex",
                      flexDirection: "column",
                      minHeight: 150,
                      position: "relative",
                    }}
                  >
                    {/* Color bar */}
                    <div style={{ height: 6, background: cat.color }} />
                    <div style={{ flex: 1, padding: "16px 18px 18px", display: "flex", flexDirection: "column", justifyContent: "space-between", textAlign: "left" }}>
                      <div style={{ fontSize: 48, lineHeight: 1, marginBottom: 10 }}>{cat.emoji}</div>
                      <div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 900, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.02em" }}>{cat.name}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: cat.color }}>{count} article{count > 1 ? "s" : ""}</div>
                      </div>
                    </div>
                    {/* Hint long-press */}
                    <div style={{ position: "absolute", top: 10, right: 10, width: 22, height: 22, borderRadius: "50%", background: `${cat.color}20`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 10, color: cat.color }}>⋯</span>
                    </div>
                  </button>
                );
              })}

              {/* ── Carte "+" pour ajouter un article ── */}
              <button className="cat-card"
                onClick={() => setProductForm({ open: true })}
                style={{ background: "#f8fafc", border: "2px dashed #e2e8f0", borderRadius: 20, padding: 0, cursor: "pointer", overflow: "hidden", transition: "all .15s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 150, gap: 8 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PlusCircle style={{ width: 24, height: 24, color: "#4f46e5" }} />
                </div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 800, color: "#4f46e5" }}>Nouvel article</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>Ou restez appuyé sur une case</div>
              </button>

              {/* ── Carte "Nouvelle catégorie" ── */}
              <button className="cat-card"
                onClick={() => setShowAddCatForm(true)}
                style={{ background: "#f0fdf4", border: "2px dashed #86efac", borderRadius: 20, padding: 0, cursor: "pointer", overflow: "hidden", transition: "all .15s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 150, gap: 8 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>🗂️</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 800, color: "#16a34a" }}>Nouvelle catégorie</div>
              </button>
            </div>

            {categories.length === 0 && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 60, color: "#94a3b8" }}>
                <Receipt style={{ width: 40, height: 40, opacity: 0.3 }} />
                <div style={{ fontSize: 14 }}>Aucun produit dans le catalogue</div>
                <button onClick={() => setProductForm({ open: true })} style={{ height: 40, padding: "0 20px", borderRadius: 10, background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  <Plus style={{ width: 14, height: 14 }} /> Ajouter un article
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── PRODUCT GRID (within a category) ── */}
        {selectedCat && activeCat && (
          <div style={{ flex: 1, overflowY: "auto", padding: 14 }}>
            {catProducts.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, paddingTop: 48, color: "#94a3b8" }}>
                <span style={{ fontSize: 40 }}>{activeCat.emoji}</span>
                <div style={{ fontSize: 14 }}>Aucun article trouvé</div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
                {catProducts.map((p) => {
                  const outOfStock = p.stock === 0;
                  const lowStock = !outOfStock && p.stock <= (p.stock_min ?? 5);
                  return (
                    <button key={p.id} className="prod-card"
                      onClick={() => !outOfStock && addToCart(p)}
                      onMouseDown={(e) => startLongPress(e, { type: "prod", product: p, x: 0, y: 0 })}
                      onMouseUp={cancelLongPress}
                      onMouseLeave={cancelLongPress}
                      onTouchStart={(e) => startLongPress(e, { type: "prod", product: p, x: 0, y: 0 })}
                      onTouchEnd={cancelLongPress}
                      onTouchMove={cancelLongPress}
                      disabled={false}
                      style={{
                        background: "#fff",
                        border: `2px solid ${outOfStock ? "#e2e8f0" : activeCat.color + "30"}`,
                        borderRadius: 18,
                        padding: 0,
                        cursor: outOfStock ? "not-allowed" : "pointer",
                        overflow: "hidden",
                        transition: "all .12s",
                        opacity: outOfStock ? 0.6 : 1,
                        display: "flex",
                        flexDirection: "column",
                        textAlign: "left",
                      }}
                    >
                      {/* ── Photo zone ── */}
                      <div style={{ position: "relative", height: 120, overflow: "hidden", background: activeCat.light, flexShrink: 0 }}>

                        {/* Color bar top */}
                        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: outOfStock ? "#e2e8f0" : activeCat.color, zIndex: 3 }} />

                        {/* Emoji fallback (always rendered behind image) */}
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 56 }}>
                          {activeCat.emoji}
                        </div>

                        {/* Photo on top — hides emoji when loaded */}
                        {p.image_url && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={p.image_url}
                            alt={p.name}
                            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: outOfStock ? 0.5 : 1 }}
                          />
                        )}

                        {/* Gradient bottom for readability */}
                        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 36, background: `linear-gradient(transparent, ${activeCat.light}cc)`, zIndex: 2 }} />

                        {/* Rupture / Stock faible badge */}
                        {outOfStock && (
                          <div style={{ position: "absolute", top: 10, right: 8, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 7px", borderRadius: 6, zIndex: 4, letterSpacing: "0.05em" }}>RUPTURE</div>
                        )}
                        {lowStock && (
                          <div style={{ position: "absolute", top: 10, right: 8, background: "#f59e0b", color: "#fff", fontSize: 9, fontWeight: 800, padding: "3px 7px", borderRadius: 6, zIndex: 4 }}>⚠ {p.stock}</div>
                        )}
                      </div>

                      {/* ── Info zone ── */}
                      <div style={{ padding: "10px 12px 13px", display: "flex", flexDirection: "column", gap: 5, flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: outOfStock ? "#94a3b8" : "#0f172a", lineHeight: 1.35, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                          {p.name}
                        </div>
                        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 900, color: outOfStock ? "#94a3b8" : activeCat.color, letterSpacing: "-0.02em" }}>
                          {fmt(p.price)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Bottom breadcrumb (when in category) */}
        {selectedCat && activeCat && (
          <div style={{ background: "#fff", borderTop: "1px solid #e2e8f0", padding: "8px 16px", display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            <button onClick={() => { setSelectedCat(null); setSearch(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "#94a3b8", display: "flex", alignItems: "center", gap: 4 }}>
              Caisse
            </button>
            <span style={{ color: "#e2e8f0" }}>›</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: activeCat.color }}>{activeCat.emoji} {selectedCat}</span>
          </div>
        )}
      </div>

      {/* ══════════ RIGHT: Cart ══════════ */}
      <aside style={{ width: 360, background: "#fff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column", overflow: "hidden", flexShrink: 0 }}>

        {/* Quick actions */}
        <div style={{ padding: "10px 12px", borderBottom: "1px solid #f1f5f9", display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, flexShrink: 0 }}>
          {[
            { icon: Users, label: selectedCustomer ? selectedCustomer.name.split(" ")[0] : "Client", active: !!customerId, onClick: () => setCustomerId(null) },
            { icon: PauseCircle, label: "Pause", active: false, onClick: holdTicket, disabled: cart.length === 0 },
            { icon: RotateCcw, label: `Reprendre${held.length > 0 ? ` (${held.length})` : ""}`, active: showHeld, onClick: () => setShowHeld((v) => !v), disabled: held.length === 0 },
            { icon: DoorOpen, label: "Tiroir", active: false, onClick: () => openDrawerQZ().catch(() => {}) },
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
                style={{ width: "100%", padding: "10px 14px", border: "none", borderBottom: "1px solid #f1f5f9", background: "transparent", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", textAlign: "left" }}>
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
              <div style={{ fontSize: 12, color: "#94a3b8", textAlign: "center" }}>Choisissez une catégorie<br />et touchez un article.</div>
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

      {/* Article modal */}
      {showArticle && <ArticleModal products={products} onAdd={addToCart} onClose={() => setShowArticle(false)} getCatFn={getCat} />}

      {/* ── Context menu (long-press) ── */}
      {ctxMenu && (
        <div style={{ position: "fixed", inset: 0, zIndex: 250 }} onClick={() => setCtxMenu(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: Math.min(ctxMenu.y, window.innerHeight - 200),
              left: Math.min(ctxMenu.x - 80, window.innerWidth - 200),
              background: "#fff",
              borderRadius: 16,
              boxShadow: "0 16px 48px rgba(0,0,0,.2)",
              border: "1px solid #e2e8f0",
              overflow: "hidden",
              minWidth: 180,
              zIndex: 251,
            }}
          >
            {ctxMenu.type === "cat" && (
              <>
                <div style={{ padding: "10px 16px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>Catégorie</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{ctxMenu.catName}</div>
                </div>
                <button onClick={() => { setCtxMenu(null); setProductForm({ open: true, cat: ctxMenu.catName }); }}
                  style={{ width: "100%", padding: "12px 16px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#0f172a" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <PlusCircle style={{ width: 15, height: 15, color: "#4f46e5" }} /> Ajouter un article
                </button>
                <button onClick={() => { setCtxMenu(null); setDeleteConfirm({ type: "cat", catName: ctxMenu.catName }); }}
                  style={{ width: "100%", padding: "12px 16px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#dc2626" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <Trash2 style={{ width: 15, height: 15 }} /> Supprimer la catégorie
                </button>
              </>
            )}
            {ctxMenu.type === "prod" && (
              <>
                <div style={{ padding: "10px 16px", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8" }}>Article</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{ctxMenu.product.name}</div>
                  <div style={{ fontSize: 12, color: "#64748b" }}>{ctxMenu.product.price.toFixed(2)} €</div>
                </div>
                <button onClick={() => { setCtxMenu(null); setProductForm({ open: true, product: ctxMenu.product }); }}
                  style={{ width: "100%", padding: "12px 16px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#0f172a" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f8fafc")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <Edit2 style={{ width: 15, height: 15, color: "#4f46e5" }} /> Modifier l&apos;article
                </button>
                <button onClick={() => { addToCart(ctxMenu.product); setCtxMenu(null); }}
                  style={{ width: "100%", padding: "12px 16px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#059669" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#f0fdf4")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <Plus style={{ width: 15, height: 15 }} /> Ajouter au ticket
                </button>
                <button onClick={() => { setCtxMenu(null); setDeleteConfirm({ type: "prod", product: ctxMenu.product }); }}
                  style={{ width: "100%", padding: "12px 16px", border: "none", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13, fontWeight: 600, color: "#dc2626" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#fef2f2")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                  <Trash2 style={{ width: 15, height: 15 }} /> Supprimer l&apos;article
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Confirmation suppression ── */}
      {deleteConfirm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 260, background: "rgba(15,23,42,.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, maxWidth: 380, width: "100%", padding: 24, boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
              <Trash2 style={{ width: 22, height: 22, color: "#dc2626" }} />
            </div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>
              {deleteConfirm.type === "cat" ? "Supprimer la catégorie ?" : "Supprimer l'article ?"}
            </div>
            <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 20 }}>
              {deleteConfirm.type === "cat"
                ? `Tous les articles de la catégorie "${deleteConfirm.catName}" seront supprimés définitivement.`
                : `"${deleteConfirm.product?.name}" sera supprimé du catalogue.`}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setDeleteConfirm(null)} style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#64748b" }}>Annuler</button>
              <button onClick={() => {
                if (deleteConfirm.type === "cat" && deleteConfirm.catName) {
                  products.filter((p) => p.category === deleteConfirm.catName).forEach((p) => deleteProduct(p.id));
                  const customCat = customCatDefs.find((c) => c.name === deleteConfirm.catName);
                  if (customCat) { deleteCustomCategory(customCat.id); setCustomCatDefs(getCustomCategories()); }
                } else if (deleteConfirm.type === "prod" && deleteConfirm.product) {
                  deleteProduct(deleteConfirm.product.id);
                }
                reloadProducts();
                setDeleteConfirm(null);
                if (deleteConfirm.type === "cat") setSelectedCat(null);
              }} style={{ flex: 1, height: 44, borderRadius: 12, border: "none", background: "#dc2626", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal email ticket ── */}
      {emailStep && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,23,42,.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 380, padding: 28, boxShadow: "0 32px 80px rgba(0,0,0,.25)" }}>
            {emailStep === "done" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <Check style={{ width: 28, height: 28, color: "#059669" }} />
                </div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Ticket envoyé !</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginTop: 6 }}>{emailVal}</div>
              </div>
            ) : (
              <>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Envoyer par email</div>
                <div style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Entrez l&apos;adresse email du client</div>
                <input
                  type="email"
                  value={emailVal}
                  onChange={(e) => setEmailVal(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendByEmail()}
                  placeholder="client@example.com"
                  autoFocus
                  style={{ width: "100%", height: 48, padding: "0 14px", border: "2px solid #4f46e5", borderRadius: 12, fontSize: 15, outline: "none", marginBottom: 14, boxSizing: "border-box" }}
                />
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => { setEmailStep(null); setEmailVal(""); }}
                    style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#64748b" }}>
                    Annuler
                  </button>
                  <button onClick={sendByEmail} disabled={emailStep === "sending" || !emailVal.trim()}
                    style={{ flex: 2, height: 44, borderRadius: 12, border: "none", background: emailVal.trim() ? "#4f46e5" : "#e0e7ff", color: emailVal.trim() ? "#fff" : "#a5b4fc", fontWeight: 700, fontSize: 14, cursor: emailVal.trim() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {emailStep === "sending"
                      ? <><Loader2 style={{ width: 16, height: 16 }} /> Envoi...</>
                      : <><Mail style={{ width: 16, height: 16 }} /> Envoyer</>}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Toast SMS ── */}
      {smsToast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 400, background: "#0f172a", color: "#fff", padding: "12px 20px", borderRadius: 30, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,.3)", whiteSpace: "nowrap" }}>
          📱 SMS disponible dans la prochaine version
        </div>
      )}

      {/* ── Formulaire article ── */}
      {productForm.open && (
        <ProductFormModal
          initialCat={productForm.cat}
          initialProduct={productForm.product}
          extraCats={customCatDefs.map((c) => c.name)}
          onSave={(isWidget, category) => {
            reloadProducts();
            // Si sous-catégorie → auto-naviguer vers la catégorie pour voir l'article immédiatement
            if (!isWidget) {
              setSelectedCat(category);
            }
            // Si widget → reste sur l'accueil pour le voir directement dans les widgets
          }}
          onClose={() => setProductForm({ open: false })}
        />
      )}

      {/* ── Modal nouvelle catégorie ── */}
      {showAddCatForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(15,23,42,.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 20, width: "100%", maxWidth: 420, boxShadow: "0 32px 80px rgba(0,0,0,.25)", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Nouvelle catégorie</div>
              <button onClick={() => setShowAddCatForm(false)} style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X style={{ width: 14, height: 14, color: "#64748b" }} />
              </button>
            </div>
            <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Nom + aperçu */}
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 64, height: 64, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, background: addCatForm.light, border: `2px solid ${addCatForm.color}40`, flexShrink: 0 }}>
                  {addCatForm.emoji}
                </div>
                <label style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b" }}>Nom de la catégorie</span>
                  <input value={addCatForm.name} onChange={(e) => setAddCatForm((f) => ({ ...f, name: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && handleAddCat()} placeholder="ex: Boissons chaudes"
                    autoFocus style={{ height: 40, padding: "0 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" }} />
                </label>
              </div>
              {/* Emoji */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b", marginBottom: 8 }}>Icône</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {CAT_EMOJIS.map((em) => (
                    <button key={em} onClick={() => setAddCatForm((f) => ({ ...f, emoji: em }))}
                      style={{ width: 38, height: 38, borderRadius: 9, border: `2px solid ${addCatForm.emoji === em ? addCatForm.color : "#e2e8f0"}`, background: addCatForm.emoji === em ? addCatForm.light : "#f8fafc", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {em}
                    </button>
                  ))}
                </div>
              </div>
              {/* Couleur */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b", marginBottom: 8 }}>Couleur</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {CAT_COLOR_PRESETS.map((preset) => (
                    <button key={preset.color} onClick={() => setAddCatForm((f) => ({ ...f, color: preset.color, light: preset.light }))}
                      style={{ width: 30, height: 30, borderRadius: 8, background: preset.color, border: addCatForm.color === preset.color ? "3px solid #0f172a" : "3px solid transparent", cursor: "pointer" }} />
                  ))}
                </div>
              </div>
            </div>
            <div style={{ padding: "12px 20px", borderTop: "1px solid #f1f5f9", display: "flex", gap: 10 }}>
              <button onClick={() => setShowAddCatForm(false)} style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", fontWeight: 600, fontSize: 14, cursor: "pointer", color: "#64748b" }}>Annuler</button>
              <button onClick={handleAddCat} disabled={!addCatForm.name.trim()}
                style={{ flex: 2, height: 44, borderRadius: 12, border: "none", background: addCatForm.name.trim() ? "#16a34a" : "#d1fae5", color: addCatForm.name.trim() ? "#fff" : "#86efac", fontWeight: 700, fontSize: 14, cursor: addCatForm.name.trim() ? "pointer" : "not-allowed" }}>
                Créer la catégorie
              </button>
            </div>
          </div>
        </div>
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
                      {[5,10,20,50,100].map((a) => <button key={a} onClick={() => setCashInput(String(a))} style={{ height: 36, padding: "0 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{a} €</button>)}
                      <button onClick={() => setCashInput(total.toFixed(2))} style={{ height: 36, padding: "0 14px", borderRadius: 10, border: "none", background: "#0f172a", fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer" }}>Exact</button>
                    </div>
                    <div style={{ background: "#f8fafc", borderRadius: 12, padding: "10px 14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13, color: "#64748b" }}><span>À payer</span><span style={{ fontFamily: "monospace", fontWeight: 600, color: "#0f172a" }}>{fmt(total)}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, fontSize: 13, color: "#64748b" }}><span>Remis</span><span style={{ fontFamily: "monospace", fontWeight: 600 }}>{cashNum > 0 ? fmt(cashNum) : "—"}</span></div>
                      <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 6, borderTop: "1px solid #e2e8f0" }}>
                        <span style={{ fontWeight: 700, fontSize: 13, color: change > 0 ? "#059669" : "#94a3b8" }}>Rendu</span>
                        <span style={{ fontFamily: "monospace", fontWeight: 800, fontSize: 18, color: change > 0 ? "#059669" : "#94a3b8" }}>{fmt(change)}</span>
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
                    {customerId
                      ? <><div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>Sur le compte de</div>
                          <div style={{ fontSize: 16, fontWeight: 800, color: "#d97706" }}>{selectedCustomer?.name}</div>
                          <div style={{ fontSize: 13, color: "#92400e", marginTop: 6 }}>{fmt(total)} ajouté à sa note.</div></>
                      : <div style={{ fontSize: 13, color: "#92400e" }}>⚠ Sélectionnez un client.</div>}
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
                    <div style={{ fontSize: 13, color: "#64748b", textAlign: "center" }}>{payMode === "card" ? "Validez sur le TPE" : customerId ? "Confirmer la mise sur compte" : "Choisissez un client"}</div>
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
              <div id="ticket-print" style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 20px" }}>
                <ThermalTicket cart={cart} total={total} subtotal={subtotal} discount={discount}
                  payMode={payMode} cashGiven={cashNum} change={completedSale.change}
                  customer={selectedCustomer} ticketNum={completedSale.ticketNum} settings={settings} />
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 12 }}>Le client souhaite-t-il son ticket ?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8 }}>
                <button onClick={handlePrint} style={{ height: 48, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}><Printer style={{ width: 14, height: 14 }} /> Imprimer</button>
                <button onClick={() => setEmailStep("input")} style={{ height: 48, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}><Mail style={{ width: 14, height: 14 }} /> Email</button>
                <button onClick={handleSms} style={{ height: 48, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}><Phone style={{ width: 14, height: 14 }} /> SMS</button>
                <button onClick={clearAll} style={{ height: 48, borderRadius: 12, border: "none", background: "#10b981", fontSize: 12, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}><Leaf style={{ width: 14, height: 14 }} /> Non merci</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
