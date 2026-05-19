"use client";
import { useState, useMemo, useEffect } from "react";
import {
  ArrowRight, Check, Zap, Package, FileSpreadsheet, BarChart3,
  Users, ShieldCheck, ScanBarcode, Printer, DoorOpen, Scale,
  Bluetooth, Star, Leaf, Trash2, Plus, Minus, Receipt,
  Download, Monitor, Cpu, Wifi, ChevronDown, Play,
  Clock, Shield, Sparkles, Percent, CreditCard,
  Banknote, Mail, Phone, Search, ScanLine, LayoutDashboard,
  Boxes, FileBarChart2, Plug,
} from "lucide-react";

/* ─── DATA ─────────────────────────────────────────── */

const FEATURES = [
  { i: Zap, t: "Encaissement éclair", d: "Scan, panier, paiement, ticket en 3 gestes. Même à l'heure de pointe." },
  { i: Package, t: "Catalogue intelligent", d: "Prix d'achat, vente, marge auto, TVA, stock minimum alerté." },
  { i: FileSpreadsheet, t: "Import Excel/CSV", d: "Glissez votre catalogue. Caissio détecte les colonnes, importe en masse." },
  { i: BarChart3, t: "Dashboard temps réel", d: "CA, marge, panier moyen, top ventes — tout instantanément." },
  { i: Users, t: "Fidélité client", d: "Base clients intégrée avec points automatiques à chaque achat." },
  { i: ShieldCheck, t: "PIN + lock auto", d: "Verrouillage 6 chiffres après inactivité. Vos données, protégées." },
];

const HARDWARE = [
  { icon: ScanBarcode, label: "Scanner USB", note: "WebHID" },
  { icon: Printer, label: "Imprimante ticket", note: "WebUSB" },
  { icon: DoorOpen, label: "Tiroir caisse", note: "ESC/POS" },
  { icon: Scale, label: "Balance", note: "WebSerial" },
  { icon: Bluetooth, label: "Scanner Bluetooth", note: "WebBluetooth" },
];

const PLANS = [
  {
    name: "Starter",
    price: 15,
    badge: null,
    highlight: false,
    cta: "Démarrer",
    features: [
      "1 utilisateur",
      "500 produits",
      "Ticket PDF",
      "Dashboard de base",
      "Support email",
    ],
    apiKey: false,
  },
  {
    name: "Pro",
    price: 39,
    badge: "Populaire",
    highlight: true,
    cta: "Choisir Pro",
    features: [
      "5 utilisateurs",
      "Catalogue illimité",
      "Import Excel/CSV",
      "Fidélité clients",
      "Rapports avancés",
      "Support prioritaire",
    ],
    apiKey: false,
  },
  {
    name: "Business",
    price: 59,
    badge: null,
    highlight: false,
    cta: "Contacter",
    features: [
      "Utilisateurs illimités",
      "Multi-magasins (bientôt)",
      "Fournisseurs avancés",
      "API & matériel",
      "Manager dédié",
      "SLA 99,9%",
    ],
    apiKey: true,
  },
];

const FAQ_DATA = [
  { q: "Combien de temps dure l'essai gratuit ?", a: "7 jours, sans carte bancaire. Accès à toutes les fonctionnalités dès le premier jour." },
  { q: "Sur quel matériel ça fonctionne ?", a: "Windows 10 et 11 via l'application de bureau. La version web tourne aussi sur tout navigateur moderne." },
  { q: "Comment fonctionne la détection du matériel ?", a: "Un bouton « Audit complet » dans les Périphériques détecte vos appareils connectés grâce aux API natives. Aucun pilote, aucune installation." },
  { q: "Puis-je importer mon catalogue existant ?", a: "Oui. Glissez votre fichier Excel ou CSV, prévisualisez, validez. Les catégories sont créées automatiquement." },
  { q: "Mes données sont-elles sécurisées ?", a: "Authentification JWT, PIN 6 chiffres, verrouillage automatique, isolation complète. Vos données n'appartiennent qu'à vous." },
  { q: "Puis-je résilier à tout moment ?", a: "Oui. Sans engagement, sans préavis, sans pénalité. Résiliez en un clic depuis votre espace." },
];

const TESTIMONIALS = [
  { q: "On encaisse deux fois plus vite. Les clients adorent.", a: "Sophie L.", role: "Épicerie fine, Lyon" },
  { q: "L'import de mes 800 références s'est fait en 2 minutes.", a: "Karim B.", role: "Boulangerie, Marseille" },
  { q: "Enfin une caisse claire, pas un truc d'usine à gaz.", a: "Marie D.", role: "Snack-Tabac, Bordeaux" },
];

const STATS = [
  { value: "3 sec", label: "par transaction" },
  { value: "2 min", label: "pour démarrer" },
  { value: "800", label: "produits importés" },
  { value: "0", label: "driver à installer" },
];

const SCREENS = [
  { src: "/screen-pos.jpg", label: "Caisse", desc: "Interface POS épurée — scan, panier, encaissement en 3 gestes." },
  { src: "/screen-dashboard.jpg", label: "Dashboard", desc: "CA, marges, top produits et alertes stock en temps réel." },
  { src: "/screen-products.jpg", label: "Produits", desc: "Catalogue complet avec prix, TVA, stock et codes-barres." },
  { src: "/screen-import.jpg", label: "Import", desc: "Importez votre Excel ou CSV en quelques clics." },
  { src: "/screen-devices.jpg", label: "Périphériques", desc: "Audit complet — scanner, imprimante, tiroir, balance détectés auto." },
];

/* ─── DEMO POS ──────────────────────────────────────── */

const CATS = [
  { id: "all", label: "Tous" },
  { id: "b", label: "Boulangerie" },
  { id: "d", label: "Boissons" },
  { id: "e", label: "Épicerie" },
  { id: "s", label: "Snacks" },
];

const PRODUCTS = [
  { id: "1", name: "Croissant", price: 1.20, cat: "b", img: "https://images.unsplash.com/photo-1623334044303-241021148842?w=300&q=80" },
  { id: "2", name: "Pain de campagne", price: 3.50, cat: "b", img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=300&q=80" },
  { id: "3", name: "Pain au chocolat", price: 1.40, cat: "b", img: "https://images.unsplash.com/photo-1623334044303-241021148842?w=300&q=80" },
  { id: "4", name: "Café expresso", price: 2.00, cat: "d", img: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=300&q=80" },
  { id: "5", name: "Eau Evian 50cl", price: 1.00, cat: "d", img: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=300&q=80" },
  { id: "6", name: "Coca-Cola 33cl", price: 1.80, cat: "d", img: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=300&q=80" },
  { id: "7", name: "Salade César", price: 4.50, cat: "s", img: "https://images.unsplash.com/photo-1546793665-c74683f339c1?w=300&q=80" },
  { id: "8", name: "Sandwich jambon", price: 3.90, cat: "s", img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=300&q=80" },
  { id: "9", name: "Pâtes Barilla 500g", price: 1.85, cat: "e", img: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=300&q=80" },
];

const SIDE_NAV = [
  { icon: ScanBarcode, label: "Caisse", active: true },
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: Package, label: "Produits" },
  { icon: Boxes, label: "Stock" },
  { icon: Users, label: "Clients" },
  { icon: Plug, label: "Périphériques" },
  { icon: FileBarChart2, label: "Rapports" },
];

type CartItem = { id: string; name: string; price: number; cat: string; img: string; qty: number };

function CaissioMarkSVG({ size = 32, color = "#2563eb" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Caissio">
      <rect x="2" y="2" width="44" height="44" rx="11" fill={color} />
      <rect x="14" y="6" width="14" height="6" rx="1.5" fill="white" opacity="0.95" />
      <rect x="16" y="8" width="6" height="1.2" rx="0.6" fill={color} opacity="0.4" />
      <rect x="16" y="9.8" width="9" height="1.2" rx="0.6" fill={color} opacity="0.4" />
      <rect x="10" y="16" width="28" height="22" rx="3.5" fill="white" />
      <rect x="14" y="20" width="20" height="6" rx="1.5" fill={color} opacity="0.15" />
      <rect x="14" y="28" width="5" height="3" rx="1" fill={color} opacity="0.5" />
      <rect x="21.5" y="28" width="5" height="3" rx="1" fill={color} opacity="0.5" />
      <rect x="29" y="28" width="5" height="3" rx="1" fill={color} opacity="0.5" />
      <rect x="14" y="33" width="5" height="3" rx="1" fill={color} opacity="0.5" />
      <rect x="21.5" y="33" width="5" height="3" rx="1" fill={color} opacity="0.5" />
      <rect x="29" y="33" width="5" height="3" rx="1" fill="#10B981" />
    </svg>
  );
}

function DemoPOS() {
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [stage, setStage] = useState<"pos"|"pay"|"ticket">("pos");
  const [paid, setPaid] = useState({ cash: 0, card: 0 });

  const filtered = useMemo(() => PRODUCTS.filter((p) => {
    if (cat !== "all" && p.cat !== cat) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [cat, search]);

  const add = (p: typeof PRODUCTS[0]) => setCart((c) => {
    const f = c.find((i) => i.id === p.id);
    if (f) return c.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
    return [...c, { ...p, qty: 1 }];
  });
  const dec = (id: string) => setCart((c) => c.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0));
  const remove = (id: string) => setCart((c) => c.filter((i) => i.id !== id));
  const clear = () => { setCart([]); setDiscount(0); setStage("pos"); setPaid({ cash: 0, card: 0 }); };

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = Math.max(0, subtotal - discount);
  const sumPaid = paid.cash + paid.card;
  const change = Math.max(0, sumPaid - total);

  return (
    <div style={{ borderRadius: 24, border: "1px solid rgba(148,163,184,.15)", background: "rgba(15,23,42,.9)", overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,.5)", position: "relative" }}>
      {/* Browser chrome */}
      <div style={{ height: 32, background: "rgba(30,41,59,.8)", borderBottom: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "center", padding: "0 12px", gap: 6 }}>
        <div style={{ height: 10, width: 10, borderRadius: "50%", background: "rgba(239,68,68,.6)" }} />
        <div style={{ height: 10, width: 10, borderRadius: "50%", background: "rgba(234,179,8,.6)" }} />
        <div style={{ height: 10, width: 10, borderRadius: "50%", background: "rgba(52,211,153,.6)" }} />
        <div style={{ margin: "0 auto", fontSize: 10, color: "#64748B", fontFamily: "monospace" }}>caissio.app · /caisse</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 300px", minHeight: 520 }}>
        {/* Sidebar */}
        <div style={{ background: "rgba(15,23,42,.95)", borderRight: "1px solid rgba(255,255,255,.06)", padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 12px" }}>
            <CaissioMarkSVG size={22} color="#2563eb" />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: "-0.02em" }}>Caissio</span>
          </div>
          {SIDE_NAV.map((n, i) => {
            const I = n.icon;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px", height: 36, borderRadius: 8, fontSize: 12, fontWeight: 500, marginBottom: 2, background: n.active ? "rgba(37,99,235,.15)" : "transparent", color: n.active ? "#60a5fa" : "#64748B" }}>
                <I style={{ width: 14, height: 14 }} />
                <span>{n.label}</span>
              </div>
            );
          })}
        </div>

        {/* Main */}
        <div style={{ background: "rgba(15,23,42,.7)", display: "flex", flexDirection: "column" }}>
          <div style={{ height: 48, background: "rgba(15,23,42,.9)", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 8, padding: "0 12px", flexShrink: 0 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#64748B" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit…" style={{ width: "100%", height: 34, paddingLeft: 32, paddingRight: 10, background: "rgba(30,41,59,.8)", border: "1px solid rgba(148,163,184,.1)", borderRadius: 8, fontSize: 12, color: "#e2e8f0", outline: "none" }} />
            </div>
            <button style={{ height: 34, padding: "0 12px", borderRadius: 8, background: "rgba(30,41,59,.8)", border: "1px solid rgba(148,163,184,.1)", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>
              <ScanLine style={{ width: 13, height: 13 }} /> Scan
            </button>
            <button style={{ height: 34, padding: "0 12px", borderRadius: 8, background: "rgba(30,41,59,.8)", border: "1px solid rgba(148,163,184,.1)", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#94a3b8", cursor: "pointer" }}>
              <DoorOpen style={{ width: 13, height: 13 }} /> Tiroir
            </button>
          </div>

          <div style={{ height: 44, background: "rgba(15,23,42,.9)", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 6, padding: "0 12px", overflowX: "auto", flexShrink: 0 }}>
            {CATS.map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)} style={{ height: 28, padding: "0 12px", borderRadius: 999, fontSize: 11, fontWeight: 500, whiteSpace: "nowrap", cursor: "pointer", border: "none", background: cat === c.id ? "rgba(37,99,235,.8)" : "rgba(30,41,59,.8)", color: cat === c.id ? "#fff" : "#94a3b8" }}>
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, padding: 12, overflowY: "auto", maxHeight: 440 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {filtered.map((p) => (
                <button key={p.id} onClick={() => add(p)} style={{ background: "rgba(30,41,59,.5)", border: "1px solid rgba(148,163,184,.1)", borderRadius: 12, padding: 8, textAlign: "left", cursor: "pointer" }}>
                  <div style={{ aspectRatio: "1", borderRadius: 8, overflow: "hidden", marginBottom: 6 }}>
                    <img src={p.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa", fontFamily: "monospace" }}>{p.price.toFixed(2)} €</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart */}
        <aside style={{ background: "rgba(15,23,42,.95)", borderLeft: "1px solid rgba(255,255,255,.06)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0 16px", height: 48, borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#fff" }}>Ticket en cours</span>
            {cart.length > 0 && <button onClick={clear} style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748B", background: "none", border: "none", cursor: "pointer" }}>Annuler</button>}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 10, maxHeight: 360 }}>
            {cart.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#475569", padding: "40px 16px", textAlign: "center" }}>
                <Receipt style={{ width: 32, height: 32, marginBottom: 8, opacity: 0.3 }} />
                <div style={{ fontSize: 11 }}>Touchez un produit pour commencer la vente.</div>
              </div>
            ) : cart.map((i) => (
              <div key={i.id} style={{ background: "rgba(30,41,59,.6)", border: "1px solid rgba(148,163,184,.08)", borderRadius: 10, padding: 10, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#e2e8f0", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.name}</div>
                    <div style={{ fontSize: 10, color: "#64748B" }}>{i.price.toFixed(2)} € × {i.qty}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#fff" }}>{(i.price * i.qty).toFixed(2)} €</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <button onClick={() => dec(i.id)} style={{ height: 26, width: 26, borderRadius: 6, background: "rgba(30,41,59,.8)", border: "1px solid rgba(148,163,184,.1)", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus style={{ width: 11, height: 11 }} /></button>
                  <div style={{ fontSize: 11, width: 20, textAlign: "center", color: "#e2e8f0" }}>{i.qty}</div>
                  <button onClick={() => add(i)} style={{ height: 26, width: 26, borderRadius: 6, background: "rgba(30,41,59,.8)", border: "1px solid rgba(148,163,184,.1)", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus style={{ width: 11, height: 11 }} /></button>
                  <button onClick={() => remove(i.id)} style={{ marginLeft: "auto", height: 26, width: 26, borderRadius: 6, background: "rgba(30,41,59,.8)", border: "1px solid rgba(148,163,184,.1)", color: "#64748B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 style={{ width: 11, height: 11 }} /></button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,.06)", padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748B", marginBottom: 6 }}>
              <span>Sous-total</span><span style={{ fontFamily: "monospace" }}>{subtotal.toFixed(2)} €</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#64748B" }}><Percent style={{ width: 11, height: 11 }} /> Remise</div>
              <input type="number" value={discount} onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} style={{ width: 64, height: 26, padding: "0 8px", background: "rgba(30,41,59,.8)", border: "1px solid rgba(148,163,184,.1)", borderRadius: 6, textAlign: "right", color: "#e2e8f0", fontFamily: "monospace", fontSize: 11, outline: "none" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,.06)", marginBottom: 10 }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#64748B" }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#60a5fa" }}>{total.toFixed(2)} €</span>
            </div>
            <button onClick={() => cart.length > 0 && setStage("pay")} disabled={cart.length === 0} style={{ width: "100%", height: 44, borderRadius: 12, background: cart.length === 0 ? "rgba(37,99,235,.3)" : "linear-gradient(135deg,#2563eb,#4f46e5)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: cart.length === 0 ? "not-allowed" : "pointer" }}>
              Encaisser
            </button>
          </div>
        </aside>
      </div>

      {/* Payment overlay */}
      {stage === "pay" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(2,6,23,.7)", backdropFilter: "blur(8px)", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "rgba(15,23,42,.98)", border: "1px solid rgba(148,163,184,.15)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 380 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#64748B", marginBottom: 4 }}>Total à payer</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: "#60a5fa", marginBottom: 16 }}>{total.toFixed(2)} €</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <button onClick={() => setPaid({ cash: total, card: 0 })} style={{ height: 60, borderRadius: 12, border: paid.cash > 0 ? "2px solid #2563eb" : "2px solid rgba(148,163,184,.15)", background: paid.cash > 0 ? "rgba(37,99,235,.15)" : "rgba(30,41,59,.5)", color: "#e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                <Banknote style={{ width: 16, height: 16 }} /> Espèces
              </button>
              <button onClick={() => setPaid({ cash: 0, card: total })} style={{ height: 60, borderRadius: 12, border: paid.card > 0 ? "2px solid #2563eb" : "2px solid rgba(148,163,184,.15)", background: paid.card > 0 ? "rgba(37,99,235,.15)" : "rgba(30,41,59,.5)", color: "#e2e8f0", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                <CreditCard style={{ width: 16, height: 16 }} /> Carte
              </button>
            </div>
            <div style={{ fontSize: 11, color: "#64748B", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Payé</span><span style={{ fontFamily: "monospace" }}>{sumPaid.toFixed(2)} €</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Rendu monnaie</span><span style={{ fontFamily: "monospace", color: "#34d399", fontWeight: 700 }}>{change.toFixed(2)} €</span></div>
            </div>
            <button disabled={sumPaid < total} onClick={() => setStage("ticket")} style={{ width: "100%", height: 44, borderRadius: 12, background: sumPaid < total ? "rgba(37,99,235,.3)" : "linear-gradient(135deg,#2563eb,#4f46e5)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: sumPaid < total ? "not-allowed" : "pointer" }}>
              Valider la vente
            </button>
          </div>
        </div>
      )}

      {/* Ticket overlay */}
      {stage === "ticket" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(2,6,23,.7)", backdropFilter: "blur(8px)", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "rgba(15,23,42,.98)", border: "1px solid rgba(148,163,184,.15)", borderRadius: 20, padding: 24, width: "100%", maxWidth: 380, textAlign: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "rgba(16,185,129,.15)", border: "1px solid rgba(16,185,129,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Check style={{ width: 24, height: 24, color: "#10B981" }} />
            </div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#64748B" }}>Ticket #DEMO-001</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#fff", margin: "4px 0 6px" }}>Vente validée</h3>
            <p style={{ fontSize: 13, color: "#94a3b8" }}>Encaissé : <strong style={{ color: "#fff" }}>{total.toFixed(2)} €</strong>{change > 0 && <> · Rendu : <strong style={{ color: "#fff" }}>{change.toFixed(2)} €</strong></>}</p>
            <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: "rgba(37,99,235,.1)", border: "1px solid rgba(37,99,235,.2)", textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#fff", marginBottom: 10 }}>Le client souhaite-t-il son ticket ?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {([["Imprimer", Printer],["Email", Mail],["SMS", Phone]] as const).map(([label, Icon]) => (
                  <button key={label} onClick={clear} style={{ height: 38, borderRadius: 10, background: "rgba(30,41,59,.8)", border: "1px solid rgba(148,163,184,.1)", color: "#e2e8f0", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                    <Icon style={{ width: 13, height: 13 }} /> {label}
                  </button>
                ))}
                <button onClick={clear} style={{ height: 38, borderRadius: 10, background: "rgba(16,185,129,.9)", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                  <Leaf style={{ width: 13, height: 13 }} /> Non merci
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── FAQ ITEM ──────────────────────────────────────── */

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div onClick={() => setOpen(!open)} style={{ borderRadius: 16, padding: "0 20px", background: "rgba(30,41,59,.4)", border: "1px solid rgba(148,163,184,.08)", cursor: "pointer", marginBottom: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", gap: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#fff" }}>{q}</span>
        <ChevronDown style={{ width: 16, height: 16, color: "#64748B", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
      </div>
      {open && <div style={{ paddingBottom: 18, fontSize: 14, color: "#94a3b8", lineHeight: 1.7 }}>{a}</div>}
    </div>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────── */

export default function CaissioPage() {
  const [scrolled, setScrolled] = useState(false);
  const [activeScreen, setActiveScreen] = useState(0);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div style={{ background: "#020617", color: "#fff", minHeight: "100vh", overflowX: "hidden", fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        @keyframes glow-pulse { 0%,100%{opacity:.4} 50%{opacity:.9} }
        .cai-nav-link { color:#94a3b8; font-size:14px; font-weight:500; text-decoration:none; transition:color .2s; }
        .cai-nav-link:hover { color:#fff; }
        .cai-card { background:rgba(30,41,59,.5); border:1px solid rgba(148,163,184,.1); border-radius:20px; transition:border-color .25s,box-shadow .25s; }
        .cai-card:hover { border-color:rgba(59,130,246,.4); box-shadow:0 0 0 1px rgba(59,130,246,.15),0 20px 40px rgba(0,0,0,.3); }
        .cai-btn-blue { background:linear-gradient(135deg,#2563eb,#4f46e5); box-shadow:0 0 30px rgba(37,99,235,.4); transition:all .25s; text-decoration:none; color:#fff; border:none; cursor:pointer; }
        .cai-btn-blue:hover { box-shadow:0 0 50px rgba(37,99,235,.6); transform:translateY(-1px); }
        .cai-btn-win { background:linear-gradient(135deg,#0ea5e9,#2563eb); box-shadow:0 0 30px rgba(14,165,233,.35); transition:all .25s; text-decoration:none; color:#fff; border:none; cursor:pointer; }
        .cai-btn-win:hover { box-shadow:0 0 50px rgba(14,165,233,.55); transform:translateY(-1px); }
        .cai-gt { background:linear-gradient(135deg,#60a5fa,#a78bfa,#34d399); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .cai-gt-blue { background:linear-gradient(135deg,#60a5fa,#818cf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .cai-hero-grid { background-image:linear-gradient(rgba(59,130,246,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.06) 1px,transparent 1px); background-size:60px 60px; }
        .cai-glow { filter:blur(80px); border-radius:50%; position:absolute; pointer-events:none; }
        .cai-screen-tab { transition:all .2s; cursor:pointer; }
        .cai-screen-tab.active { background:rgba(37,99,235,.15)!important; border-color:rgba(37,99,235,.4)!important; color:#60a5fa!important; }
      `}</style>

      {/* ── NAV ── */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, transition: "all .3s", background: scrolled ? "rgba(2,6,23,.85)" : "transparent", backdropFilter: scrolled ? "blur(24px)" : "none", borderBottom: scrolled ? "1px solid rgba(255,255,255,.05)" : "none" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CaissioMarkSVG size={30} />
            <span style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.03em" }}>Caissio</span>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {[["#demo","Essayer"],["#features","Fonctionnalités"],["#windows","Télécharger"],["#pricing","Tarifs"],["#faq","FAQ"]].map(([href,label]) => (
              <a key={href} href={href} className="cai-nav-link">{label}</a>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="#" style={{ fontSize: 14, color: "#94a3b8", textDecoration: "none", fontWeight: 500 }}>Connexion</a>
            <a href="#" className="cai-btn-blue" style={{ height: 36, padding: "0 20px", borderRadius: 12, fontSize: 14, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 6 }}>
              Essai 7 jours gratuit
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="cai-hero-grid" style={{ position: "relative", paddingTop: 112, paddingBottom: 96, overflow: "hidden" }}>
        <div className="cai-glow" style={{ background: "radial-gradient(circle,rgba(37,99,235,.5),transparent 70%)", width: 600, height: 500, top: 0, left: "50%", transform: "translateX(-50%) translateY(-25%)", opacity: 0.6, animation: "glow-pulse 4s ease-in-out infinite" }} />
        <div className="cai-glow" style={{ background: "radial-gradient(circle,rgba(124,58,237,.4),transparent 70%)", width: 400, height: 400, bottom: 0, right: 0, opacity: 0.4 }} />

        <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0 16px", height: 36, borderRadius: 999, background: "linear-gradient(135deg,rgba(14,165,233,.15),rgba(37,99,235,.15))", border: "1px solid rgba(14,165,233,.25)", fontSize: 11, fontWeight: 700, color: "#93c5fd", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 32 }}>
              <Monitor style={{ width: 14, height: 14 }} />
              Disponible sur Windows 10 &amp; 11
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#34d399", animation: "glow-pulse 2s infinite" }} />
            </div>

            <h1 style={{ fontSize: "clamp(48px,8vw,88px)", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.04em", marginBottom: 32 }}>
              La caisse qui fait<br />
              <span className="cai-gt">tout le travail.</span>
            </h1>

            <p style={{ fontSize: "clamp(17px,2vw,22px)", color: "#94a3b8", maxWidth: 700, margin: "0 auto 48px", lineHeight: 1.6 }}>
              Encaissez plus vite, gérez votre stock en temps réel, fidélisez vos clients.{" "}
              <strong style={{ color: "#fff" }}>Sans installation, sans formation, sans prise de tête.</strong>
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginBottom: 40 }}>
              <a href="#" className="cai-btn-blue" style={{ height: 64, padding: "0 40px", borderRadius: 20, fontWeight: 900, fontSize: 18, display: "inline-flex", alignItems: "center", gap: 12 }}>
                Commencer gratuitement <ArrowRight style={{ width: 20, height: 20 }} />
              </a>
              <a href="#windows" className="cai-btn-win" style={{ height: 64, padding: "0 40px", borderRadius: 20, fontWeight: 900, fontSize: 18, display: "inline-flex", alignItems: "center", gap: 12 }}>
                <Download style={{ width: 20, height: 20 }} /> Télécharger pour Windows
              </a>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px 32px", fontSize: 13, color: "#64748B" }}>
              {["7 jours gratuits, sans carte","Configuration en 2 minutes","Résiliation sans engagement"].map((t) => (
                <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Check style={{ width: 14, height: 14, color: "#34d399" }} /> {t}
                </span>
              ))}
            </div>
          </div>

          <div style={{ marginTop: 80, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, maxWidth: 900, margin: "80px auto 0" }}>
            {STATS.map((s) => (
              <div key={s.label} style={{ background: "linear-gradient(135deg,rgba(30,41,59,.8),rgba(15,23,42,.8))", border: "1px solid rgba(148,163,184,.08)", borderRadius: 20, padding: 20, textAlign: "center" }}>
                <div className="cai-gt-blue" style={{ fontSize: 36, fontWeight: 900, marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO ── */}
      <section id="demo" style={{ padding: "96px 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 56px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#60a5fa", fontWeight: 700, marginBottom: 16 }}>
              <Play style={{ width: 12, height: 12 }} /> Essayez en direct
            </div>
            <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 900, letterSpacing: "-0.03em" }}>
              Encaissez votre première vente{" "}
              <span className="cai-gt-blue">maintenant.</span>
            </h2>
            <p style={{ marginTop: 16, color: "#94a3b8", fontSize: 17 }}>Touchez les produits, ajustez les quantités, validez. Exactement comme dans la vraie caisse.</p>
          </div>
          <DemoPOS />
        </div>
      </section>

      {/* ── PRODUCT SCREENS ── */}
      <section style={{ padding: "96px 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 48px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#60a5fa", fontWeight: 700, marginBottom: 16 }}>Le produit</div>
            <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 900, letterSpacing: "-0.03em" }}>
              Tous vos modules,{" "}
              <span className="cai-gt-blue">une seule app.</span>
            </h2>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 32, flexWrap: "wrap" }}>
            {SCREENS.map((s, i) => (
              <button key={i} onClick={() => setActiveScreen(i)} className={`cai-screen-tab${activeScreen === i ? " active" : ""}`} style={{ height: 36, padding: "0 20px", borderRadius: 999, fontSize: 13, fontWeight: 600, border: "1px solid rgba(148,163,184,.12)", background: activeScreen === i ? "rgba(37,99,235,.15)" : "rgba(30,41,59,.5)", color: activeScreen === i ? "#60a5fa" : "#94a3b8" }}>
                {s.label}
              </button>
            ))}
          </div>
          <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(148,163,184,.12)", boxShadow: "0 40px 80px rgba(0,0,0,.5)" }}>
            <div style={{ background: "rgba(30,41,59,.8)", height: 32, display: "flex", alignItems: "center", padding: "0 12px", gap: 6 }}>
              <div style={{ height: 10, width: 10, borderRadius: "50%", background: "rgba(239,68,68,.5)" }} />
              <div style={{ height: 10, width: 10, borderRadius: "50%", background: "rgba(234,179,8,.5)" }} />
              <div style={{ height: 10, width: 10, borderRadius: "50%", background: "rgba(52,211,153,.5)" }} />
              <div style={{ marginLeft: 12, fontSize: 11, color: "#64748B", fontFamily: "monospace" }}>caissio.app · /{SCREENS[activeScreen].label.toLowerCase()}</div>
            </div>
            <img src={SCREENS[activeScreen].src} alt={SCREENS[activeScreen].label} style={{ width: "100%", display: "block", maxHeight: 520, objectFit: "cover", objectPosition: "top" }} />
          </div>
          <p style={{ textAlign: "center", marginTop: 16, color: "#94a3b8", fontSize: 15 }}>{SCREENS[activeScreen].desc}</p>
        </div>
      </section>

      {/* ── WINDOWS DOWNLOAD ── */}
      <section id="windows" style={{ padding: "96px 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ borderRadius: 28, padding: "64px", position: "relative", overflow: "hidden", background: "linear-gradient(135deg,rgba(14,165,233,.08),rgba(37,99,235,.12))", border: "1px solid rgba(14,165,233,.2)" }}>
            <div style={{ position: "absolute", right: -80, top: -80, width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,#0ea5e9,transparent 70%)", filter: "blur(60px)", opacity: 0.3 }} />
            <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr auto", gap: 48, alignItems: "center" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
                  <div style={{ width: 40, height: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    {(["#f25022","#7fba00","#00a4ef","#ffb900"] as const).map((c, i) => <div key={i} style={{ background: c, borderRadius: 2 }} />)}
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#fff" }}>Windows 10 / 11</span>
                </div>
                <h2 style={{ fontSize: "clamp(32px,4vw,56px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 24 }}>
                  Votre caisse,<br />
                  <span className="cai-gt">en local sur votre PC.</span>
                </h2>
                <p style={{ fontSize: 19, color: "#94a3b8", marginBottom: 32, maxWidth: 520, lineHeight: 1.6 }}>
                  Téléchargez l'application de bureau pour Windows. Fonctionne même sans connexion internet. Vos données restent sur votre machine.
                </p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
                  <a href="#" className="cai-btn-win" style={{ height: 64, padding: "0 40px", borderRadius: 20, fontWeight: 900, fontSize: 18, display: "inline-flex", alignItems: "center", gap: 12 }}>
                    <Download style={{ width: 20, height: 20 }} /> Télécharger (.exe)
                  </a>
                  <a href="#" style={{ height: 64, padding: "0 40px", borderRadius: 20, fontWeight: 700, fontSize: 18, display: "inline-flex", alignItems: "center", gap: 8, color: "#94a3b8", border: "1px solid rgba(148,163,184,.15)", textDecoration: "none" }}>
                    Ou version web →
                  </a>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: 340 }}>
                  {[{ i: Shield, t: "Données locales", c: "#34d399" },{ i: Wifi, t: "Hors-ligne", c: "#60a5fa" },{ i: Cpu, t: "Ultra-léger", c: "#a78bfa" }].map(({ i: Icon, t, c }) => (
                    <div key={t} style={{ textAlign: "center" }}>
                      <div style={{ width: 40, height: 40, margin: "0 auto 8px", borderRadius: 12, background: "rgba(37,99,235,.15)", border: "1px solid rgba(99,102,241,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon style={{ width: 16, height: 16, color: c }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#cbd5e1" }}>{t}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ width: 280, flexShrink: 0 }}>
                <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid rgba(148,163,184,.12)", background: "rgba(15,23,42,.9)", boxShadow: "0 40px 80px rgba(0,0,0,.5),0 0 0 1px rgba(14,165,233,.15)" }}>
                  <div style={{ height: 32, background: "rgba(30,41,59,.8)", borderBottom: "1px solid rgba(255,255,255,.05)", display: "flex", alignItems: "center", padding: "0 12px", gap: 6 }}>
                    <div style={{ height: 10, width: 10, borderRadius: "50%", background: "rgba(239,68,68,.5)" }} />
                    <div style={{ height: 10, width: 10, borderRadius: "50%", background: "rgba(234,179,8,.5)" }} />
                    <div style={{ height: 10, width: 10, borderRadius: "50%", background: "rgba(52,211,153,.5)" }} />
                    <div style={{ margin: "0 auto", fontSize: 10, color: "#64748B", fontFamily: "monospace" }}>Caissio — Épicerie du Marché</div>
                  </div>
                  <div style={{ padding: 16 }}>
                    {[["Tomate 500g","1.20 €"],["Eau Evian 1.5L","0.95 €"],["Pain complet","2.80 €"]].map(([name, price]) => (
                      <div key={name} style={{ display: "flex", justifyContent: "space-between", background: "rgba(30,41,59,.6)", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: "#cbd5e1", fontWeight: 500 }}>{name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#60a5fa" }}>{price}</span>
                      </div>
                    ))}
                    <div style={{ height: 1, background: "rgba(148,163,184,.1)", margin: "8px 0 12px" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px", marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: "#64748B" }}>TOTAL</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: "#60a5fa" }}>4.95 €</span>
                    </div>
                    <div style={{ height: 36, borderRadius: 10, background: "linear-gradient(135deg,#2563eb,#4f46e5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                      ✓ Encaisser
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "96px 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ maxWidth: 640, marginBottom: 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#60a5fa", fontWeight: 700, marginBottom: 16 }}>
              <Sparkles style={{ width: 14, height: 14 }} /> Fonctionnalités
            </div>
            <h2 style={{ fontSize: "clamp(32px,4vw,56px)", fontWeight: 900, letterSpacing: "-0.03em" }}>
              Tout ce qu'il faut.<br />
              <span className="cai-gt-blue">Rien de trop.</span>
            </h2>
            <p style={{ marginTop: 20, color: "#94a3b8", fontSize: 19 }}>Un logiciel pensé pour les commerçants, pas pour les ingénieurs.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {FEATURES.map((f) => {
              const Icon = f.i;
              return (
                <div key={f.t} className="cai-card" style={{ padding: 24 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg,rgba(37,99,235,.2),rgba(79,70,229,.2))", border: "1px solid rgba(99,102,241,.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                    <Icon style={{ width: 20, height: 20, color: "#60a5fa" }} />
                  </div>
                  <div style={{ fontSize: 19, fontWeight: 700, color: "#fff", marginBottom: 8 }}>{f.t}</div>
                  <div style={{ color: "#94a3b8", lineHeight: 1.6, fontSize: 14 }}>{f.d}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── HARDWARE ── */}
      <section style={{ padding: "80px 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 56px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#60a5fa", fontWeight: 700, marginBottom: 16 }}>Matériel compatible</div>
            <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 900, letterSpacing: "-0.03em" }}>
              Plug &amp; Play. <span className="cai-gt-blue">Zéro pilote.</span>
            </h2>
            <p style={{ marginTop: 16, color: "#94a3b8", fontSize: 17 }}>Branchez. Cliquez sur <strong style={{ color: "#fff" }}>Audit complet</strong>. Tout est trouvé.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, maxWidth: 900, margin: "0 auto" }}>
            {HARDWARE.map((h) => {
              const Icon = h.icon;
              return (
                <div key={h.label} className="cai-card" style={{ padding: 20, textAlign: "center" }}>
                  <div style={{ width: 48, height: 48, margin: "0 auto 12px", borderRadius: 14, background: "linear-gradient(135deg,rgba(37,99,235,.2),rgba(79,70,229,.2))", border: "1px solid rgba(99,102,241,.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon style={{ width: 20, height: 20, color: "#60a5fa" }} />
                  </div>
                  <div style={{ fontWeight: 600, color: "#cbd5e1", fontSize: 13 }}>{h.label}</div>
                  <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#475569", marginTop: 4, fontWeight: 500 }}>{h.note}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "96px 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#60a5fa", fontWeight: 700, marginBottom: 16 }}>Avis clients</div>
            <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 900, letterSpacing: "-0.03em" }}>
              Des commerçants qui <span className="cai-gt">dorment mieux.</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="cai-card" style={{ padding: 24 }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} style={{ width: 14, height: 14, color: "#f59e0b", fill: "#f59e0b" }} />)}
                </div>
                <p style={{ color: "#e2e8f0", fontWeight: 500, lineHeight: 1.6, fontSize: 15 }}>« {t.q} »</p>
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,.05)" }}>
                  <div style={{ fontWeight: 700, color: "#fff", fontSize: 14 }}>{t.a}</div>
                  <div style={{ fontSize: 12, color: "#64748B", marginTop: 2 }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "96px 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 64px" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#60a5fa", fontWeight: 700, marginBottom: 16 }}>Tarifs</div>
            <h2 style={{ fontSize: "clamp(32px,4vw,56px)", fontWeight: 900, letterSpacing: "-0.03em" }}>
              Choisissez votre plan. <span className="cai-gt">Sans surprise.</span>
            </h2>
            <p style={{ marginTop: 20, color: "#94a3b8", fontSize: 19 }}>7 jours d'essai gratuit sur tous les plans. Résiliez quand vous voulez.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: 1100, margin: "0 auto" }}>
            {PLANS.map((plan) => (
              <div key={plan.name} style={{
                borderRadius: 28, padding: 32, position: "relative", display: "flex", flexDirection: "column",
                background: plan.highlight
                  ? "linear-gradient(135deg,rgba(37,99,235,.18),rgba(79,70,229,.12))"
                  : "rgba(30,41,59,.4)",
                border: plan.highlight
                  ? "1px solid rgba(99,102,241,.45)"
                  : "1px solid rgba(148,163,184,.1)",
                boxShadow: plan.highlight
                  ? "0 0 60px rgba(37,99,235,.2),inset 0 1px 0 rgba(255,255,255,.06)"
                  : "none",
                transform: plan.highlight ? "scale(1.02)" : "none",
              }}>
                {/* Populaire badge */}
                {plan.badge && (
                  <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "linear-gradient(135deg,#2563eb,#4f46e5)", color: "#fff", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", padding: "4px 16px", borderRadius: 999, whiteSpace: "nowrap", boxShadow: "0 4px 12px rgba(37,99,235,.5)" }}>
                    {plan.badge}
                  </div>
                )}

                {/* Plan name */}
                <div style={{ fontSize: 13, fontWeight: 700, color: plan.highlight ? "#60a5fa" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>{plan.name}</div>

                {/* Price */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 56, fontWeight: 900, color: "#fff", letterSpacing: "-0.03em" }}>{plan.price}€</span>
                  <span style={{ color: "#64748B", fontSize: 16 }}>/mois</span>
                </div>
                <p style={{ color: "#64748B", fontSize: 14, marginBottom: 28 }}>Puis {plan.price}€/mois. Annulable à tout moment.</p>

                {/* Features */}
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 auto", display: "flex", flexDirection: "column", gap: 10 }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, color: "#cbd5e1", fontSize: 14 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(52,211,153,.2)", border: "1px solid rgba(52,211,153,.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <Check style={{ width: 10, height: 10, color: "#34d399" }} />
                      </div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* API key block (Business only) */}
                {plan.apiKey && (
                  <div style={{ marginTop: 24, padding: 14, borderRadius: 14, background: "rgba(79,70,229,.1)", border: "1px solid rgba(99,102,241,.25)" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>🔑 Clé API REST</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: "#818cf8", background: "rgba(15,23,42,.6)", borderRadius: 8, padding: "8px 12px", letterSpacing: "0.05em", wordBreak: "break-all" }}>
                      sk-caissio-xxxx-xxxx-xxxx
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: "#64748B" }}>Accès complet à l'API · Webhooks · Intégrations tierces</div>
                  </div>
                )}

                {/* CTA */}
                <a href="#" style={{
                  marginTop: 28, width: "100%", height: 52, borderRadius: 16,
                  fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  textDecoration: "none",
                  background: plan.highlight
                    ? "linear-gradient(135deg,#2563eb,#4f46e5)"
                    : "rgba(30,41,59,.8)",
                  color: "#fff",
                  border: plan.highlight ? "none" : "1px solid rgba(148,163,184,.15)",
                  boxShadow: plan.highlight ? "0 0 30px rgba(37,99,235,.4)" : "none",
                  transition: "all .2s",
                }}>
                  {plan.cta} {plan.highlight && <ArrowRight style={{ width: 16, height: 16 }} />}
                </a>
              </div>
            ))}
          </div>

          <p style={{ textAlign: "center", marginTop: 32, fontSize: 13, color: "#475569" }}>
            Aucune carte requise pour l'essai · Résiliation en 1 clic · TVA non incluse
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "96px 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 768, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", color: "#60a5fa", fontWeight: 700, marginBottom: 16 }}>FAQ</div>
            <h2 style={{ fontSize: "clamp(32px,4vw,48px)", fontWeight: 900, letterSpacing: "-0.03em" }}>Questions fréquentes</h2>
          </div>
          {FAQ_DATA.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "128px 0", borderTop: "1px solid rgba(255,255,255,.05)", position: "relative", overflow: "hidden" }}>
        <div className="cai-glow" style={{ background: "radial-gradient(circle,rgba(37,99,235,.4),transparent 70%)", width: 800, height: 600, top: "50%", left: "50%", transform: "translate(-50%,-50%)", opacity: 0.3 }} />
        <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(40px,7vw,80px)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 32 }}>
            Lancez votre caisse <span className="cai-gt">en 2 minutes</span>.
          </h2>
          <p style={{ color: "#94a3b8", fontSize: 19, marginBottom: 48, maxWidth: 480, margin: "0 auto 48px" }}>
            Aucune carte bancaire. Aucun risque. 7 jours pour tomber amoureux du logiciel.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
            <a href="#" className="cai-btn-blue" style={{ height: 64, padding: "0 48px", borderRadius: 20, fontWeight: 900, fontSize: 20, display: "inline-flex", alignItems: "center", gap: 12 }}>
              Commencer gratuitement <ArrowRight style={{ width: 20, height: 20 }} />
            </a>
            <a href="#windows" className="cai-btn-win" style={{ height: 64, padding: "0 40px", borderRadius: 20, fontWeight: 900, fontSize: 20, display: "inline-flex", alignItems: "center", gap: 12 }}>
              <Download style={{ width: 20, height: 20 }} /> Télécharger Windows
            </a>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: "#475569" }}>Sans engagement · Résiliation en 1 clic · Support 7j/7</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "40px 0", borderTop: "1px solid rgba(255,255,255,.05)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CaissioMarkSVG size={24} />
            <span style={{ fontWeight: 700, color: "#fff" }}>Caissio</span>
            <span style={{ color: "#475569", fontSize: 13 }}>© 2026</span>
          </div>
          <div style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.2em" }}>La caisse intelligente pour les commerces</div>
          <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
            {["CGU","Confidentialité","Contact"].map((l) => (
              <a key={l} href="#" style={{ color: "#475569", textDecoration: "none" }}>{l}</a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
