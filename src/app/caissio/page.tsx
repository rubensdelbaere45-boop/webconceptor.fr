"use client";
import { useState, useMemo, useEffect } from "react";
import {
  ArrowRight, Check, Zap, Package, FileSpreadsheet, BarChart3,
  Users, ShieldCheck, ScanBarcode, Printer, DoorOpen, Scale,
  Bluetooth, Star, Leaf, Trash2, Plus, Minus, Receipt,
  Download, Monitor, ChevronDown, Play,
  Percent, CreditCard, Banknote, Mail, Phone,
  Search, ScanLine, LayoutDashboard, Boxes, FileBarChart2, Plug,
  Cpu, Wifi, Shield,
} from "lucide-react";

/* ─── DATA ─────────────────────────────────────────── */

const FEATURE_SECTIONS = [
  {
    tag: "Encaissement",
    icon: Zap,
    title: "Encaissez en 3 gestes.\nMême au rush.",
    desc: "Scannez, ajustez le panier, encaissez. Caissio est pensé pour être rapide même quand la queue s'allonge.",
    bullets: ["Scan code-barre instantané", "Paiement espèces, CB ou mixte", "Ticket PDF, email ou SMS", "Rendu monnaie automatique"],
    img: "/screen-pos.jpg",
    imgLeft: false,
  },
  {
    tag: "Dashboard",
    icon: BarChart3,
    title: "Tout votre commerce,\nd'un coup d'œil.",
    desc: "CA du jour, marges, top produits, alertes stock — tout s'affiche en temps réel sans aucune saisie manuelle.",
    bullets: ["CA / marge / panier moyen", "Top 10 produits du jour", "Alertes stock automatiques", "Graphiques hebdo et mensuel"],
    img: "/screen-dashboard.jpg",
    imgLeft: true,
  },
  {
    tag: "Catalogue",
    icon: Package,
    title: "800 produits importés\nen 2 minutes.",
    desc: "Glissez votre fichier Excel ou CSV. Caissio détecte les colonnes, crée les catégories et valide les prix automatiquement.",
    bullets: ["Import Excel / CSV en glisser-déposer", "Prévisualisation avant validation", "Catégories créées automatiquement", "Prix d'achat, vente, marge et TVA"],
    img: "/screen-products.jpg",
    imgLeft: false,
  },
  {
    tag: "Import",
    icon: FileSpreadsheet,
    title: "Votre catalogue existant,\ndirectement dans Caissio.",
    desc: "Pas besoin de tout ressaisir. Importez depuis votre fournisseur ou votre ancien logiciel en quelques secondes.",
    bullets: ["Détection automatique des colonnes", "Gestion des doublons", "Support multi-format", "Annulation possible avant validation"],
    img: "/screen-import.jpg",
    imgLeft: true,
  },
  {
    tag: "Périphériques",
    icon: ScanBarcode,
    title: "Tous vos appareils,\ndétectés automatiquement.",
    desc: "Branchez votre scanner, imprimante ou tiroir-caisse. Cliquez sur « Audit complet ». Caissio s'occupe du reste — aucun pilote à installer.",
    bullets: ["Scanner USB / Bluetooth", "Imprimante ticket (ESC/POS)", "Tiroir-caisse", "Balance connectée"],
    img: "/screen-devices.jpg",
    imgLeft: false,
  },
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

function CaissioMarkSVG({ size = 32, color = "#4F46E5" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Caissio">
      <rect x="2" y="2" width="44" height="44" rx="11" fill={color} />
      <rect x="14" y="6" width="14" height="6" rx="1.5" fill="white" opacity="0.95" />
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
    <div style={{ borderRadius: 24, border: "1px solid #e2e8f0", background: "#f8fafc", overflow: "hidden", boxShadow: "0 24px 64px rgba(79,70,229,.12)", position: "relative" }}>
      <div style={{ height: 36, background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", padding: "0 14px", gap: 6 }}>
        <div style={{ height: 10, width: 10, borderRadius: "50%", background: "#fca5a5" }} />
        <div style={{ height: 10, width: 10, borderRadius: "50%", background: "#fcd34d" }} />
        <div style={{ height: 10, width: 10, borderRadius: "50%", background: "#86efac" }} />
        <div style={{ margin: "0 auto", fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>caissio.app · /caisse</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 300px", minHeight: 520 }}>
        <div style={{ background: "#fff", borderRight: "1px solid #e2e8f0", padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 14px" }}>
            <CaissioMarkSVG size={22} color="#4F46E5" />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", letterSpacing: "-0.02em" }}>Caissio</span>
          </div>
          {SIDE_NAV.map((n, i) => {
            const I = n.icon;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px", height: 36, borderRadius: 8, fontSize: 12, fontWeight: 500, marginBottom: 2, background: n.active ? "#ede9fe" : "transparent", color: n.active ? "#4f46e5" : "#64748b" }}>
                <I style={{ width: 14, height: 14 }} />
                <span>{n.label}</span>
              </div>
            );
          })}
        </div>

        <div style={{ background: "#f8fafc", display: "flex", flexDirection: "column" }}>
          <div style={{ height: 48, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8, padding: "0 12px", flexShrink: 0 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#94a3b8" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit…" style={{ width: "100%", height: 34, paddingLeft: 32, paddingRight: 10, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#0f172a", outline: "none" }} />
            </div>
            <button style={{ height: 34, padding: "0 12px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", cursor: "pointer" }}>
              <ScanLine style={{ width: 13, height: 13 }} /> Scan
            </button>
            <button style={{ height: 34, padding: "0 12px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", cursor: "pointer" }}>
              <DoorOpen style={{ width: 13, height: 13 }} /> Tiroir
            </button>
          </div>

          <div style={{ height: 44, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 6, padding: "0 12px", overflowX: "auto", flexShrink: 0 }}>
            {CATS.map((c) => (
              <button key={c.id} onClick={() => setCat(c.id)} style={{ height: 28, padding: "0 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer", border: "none", background: cat === c.id ? "#4f46e5" : "#f1f5f9", color: cat === c.id ? "#fff" : "#64748b" }}>
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, padding: 12, overflowY: "auto", maxHeight: 440 }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {filtered.map((p) => (
                <button key={p.id} onClick={() => add(p)} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 8, textAlign: "left", cursor: "pointer" }}>
                  <div style={{ aspectRatio: "1", borderRadius: 8, overflow: "hidden", marginBottom: 6 }}>
                    <img src={p.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", fontFamily: "monospace" }}>{p.price.toFixed(2)} €</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside style={{ background: "#fff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0 16px", height: 48, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Ticket en cours</span>
            {cart.length > 0 && <button onClick={clear} style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>Annuler</button>}
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 10, maxHeight: 360 }}>
            {cart.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#cbd5e1", padding: "40px 16px", textAlign: "center" }}>
                <Receipt style={{ width: 32, height: 32, marginBottom: 8, opacity: 0.4 }} />
                <div style={{ fontSize: 11 }}>Touchez un produit pour commencer la vente.</div>
              </div>
            ) : cart.map((i) => (
              <div key={i.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{i.name}</div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>{i.price.toFixed(2)} € × {i.qty}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 12, color: "#0f172a" }}>{(i.price * i.qty).toFixed(2)} €</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
                  <button onClick={() => dec(i.id)} style={{ height: 26, width: 26, borderRadius: 6, background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Minus style={{ width: 11, height: 11 }} /></button>
                  <div style={{ fontSize: 11, width: 20, textAlign: "center", color: "#0f172a" }}>{i.qty}</div>
                  <button onClick={() => add(i)} style={{ height: 26, width: 26, borderRadius: 6, background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Plus style={{ width: 11, height: 11 }} /></button>
                  <button onClick={() => remove(i.id)} style={{ marginLeft: "auto", height: 26, width: 26, borderRadius: 6, background: "#f1f5f9", border: "1px solid #e2e8f0", color: "#94a3b8", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 style={{ width: 11, height: 11 }} /></button>
                </div>
              </div>
            ))}
          </div>
          <div style={{ borderTop: "1px solid #e2e8f0", padding: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#94a3b8", marginBottom: 6 }}>
              <span>Sous-total</span><span style={{ fontFamily: "monospace" }}>{subtotal.toFixed(2)} €</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#94a3b8" }}><Percent style={{ width: 11, height: 11 }} /> Remise</div>
              <input type="number" value={discount} onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} style={{ width: 64, height: 26, padding: "0 8px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, textAlign: "right", color: "#0f172a", fontFamily: "monospace", fontSize: 11, outline: "none" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid #e2e8f0", marginBottom: 10 }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8" }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#4f46e5" }}>{total.toFixed(2)} €</span>
            </div>
            <button onClick={() => cart.length > 0 && setStage("pay")} disabled={cart.length === 0} style={{ width: "100%", height: 44, borderRadius: 12, background: cart.length === 0 ? "#e0e7ff" : "#4f46e5", color: cart.length === 0 ? "#a5b4fc" : "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: cart.length === 0 ? "not-allowed" : "pointer" }}>
              Encaisser
            </button>
          </div>
        </aside>
      </div>

      {stage === "pay" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(8px)", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24, width: "100%", maxWidth: 380, boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 4 }}>Total à payer</div>
            <div style={{ fontSize: 42, fontWeight: 900, color: "#4f46e5", marginBottom: 16 }}>{total.toFixed(2)} €</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <button onClick={() => setPaid({ cash: total, card: 0 })} style={{ height: 60, borderRadius: 12, border: paid.cash > 0 ? "2px solid #4f46e5" : "2px solid #e2e8f0", background: paid.cash > 0 ? "#ede9fe" : "#f8fafc", color: "#0f172a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                <Banknote style={{ width: 16, height: 16, color: paid.cash > 0 ? "#4f46e5" : "#64748b" }} /> Espèces
              </button>
              <button onClick={() => setPaid({ cash: 0, card: total })} style={{ height: 60, borderRadius: 12, border: paid.card > 0 ? "2px solid #4f46e5" : "2px solid #e2e8f0", background: paid.card > 0 ? "#ede9fe" : "#f8fafc", color: "#0f172a", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", fontSize: 11, fontWeight: 700 }}>
                <CreditCard style={{ width: 16, height: 16, color: paid.card > 0 ? "#4f46e5" : "#64748b" }} /> Carte
              </button>
            </div>
            <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Payé</span><span style={{ fontFamily: "monospace" }}>{sumPaid.toFixed(2)} €</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span>Rendu monnaie</span><span style={{ fontFamily: "monospace", color: "#10b981", fontWeight: 700 }}>{change.toFixed(2)} €</span></div>
            </div>
            <button disabled={sumPaid < total} onClick={() => setStage("ticket")} style={{ width: "100%", height: 44, borderRadius: 12, background: sumPaid < total ? "#e0e7ff" : "#4f46e5", color: sumPaid < total ? "#a5b4fc" : "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: sumPaid < total ? "not-allowed" : "pointer" }}>
              Valider la vente
            </button>
          </div>
        </div>
      )}

      {stage === "ticket" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(8px)", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24, width: "100%", maxWidth: 380, textAlign: "center", boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: "#d1fae5", border: "1px solid #6ee7b7", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
              <Check style={{ width: 24, height: 24, color: "#059669" }} />
            </div>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8" }}>Ticket #DEMO-001</div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "#0f172a", margin: "4px 0 6px" }}>Vente validée</h3>
            <p style={{ fontSize: 13, color: "#64748b" }}>Encaissé : <strong style={{ color: "#0f172a" }}>{total.toFixed(2)} €</strong>{change > 0 && <> · Rendu : <strong style={{ color: "#0f172a" }}>{change.toFixed(2)} €</strong></>}</p>
            <div style={{ marginTop: 16, padding: 14, borderRadius: 14, background: "#ede9fe", border: "1px solid #c4b5fd", textAlign: "left" }}>
              <div style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", marginBottom: 10 }}>Le client souhaite-t-il son ticket ?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                {([["Imprimer", Printer],["Email", Mail],["SMS", Phone]] as const).map(([label, Icon]) => (
                  <button key={label} onClick={clear} style={{ height: 38, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", color: "#0f172a", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                    <Icon style={{ width: 13, height: 13 }} /> {label}
                  </button>
                ))}
                <button onClick={clear} style={{ height: 38, borderRadius: 10, background: "#10b981", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
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
    <div onClick={() => setOpen(!open)} style={{ borderRadius: 16, padding: "0 20px", background: "#fff", border: "1px solid #e2e8f0", cursor: "pointer", marginBottom: 8, boxShadow: "0 1px 4px rgba(0,0,0,.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 0", gap: 16 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "#0f172a" }}>{q}</span>
        <ChevronDown style={{ width: 16, height: 16, color: "#94a3b8", transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
      </div>
      {open && <div style={{ paddingBottom: 18, fontSize: 14, color: "#64748b", lineHeight: 1.7 }}>{a}</div>}
    </div>
  );
}

/* ─── MAIN PAGE ─────────────────────────────────────── */

export default function CaissioPage() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <div style={{ background: "#fff", color: "#0f172a", minHeight: "100vh", overflowX: "hidden", fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        .cai-nav-link { color:#475569; font-size:14px; font-weight:500; text-decoration:none; transition:color .2s; }
        .cai-nav-link:hover { color:#4f46e5; }
        .cai-card { background:#fff; border:1px solid #e2e8f0; border-radius:20px; transition:border-color .25s,box-shadow .25s; }
        .cai-card:hover { border-color:#a5b4fc; box-shadow:0 8px 32px rgba(79,70,229,.1); }
        .cai-btn-indigo { background:#4f46e5; box-shadow:0 4px 16px rgba(79,70,229,.3); transition:all .25s; text-decoration:none; color:#fff; border:none; cursor:pointer; display:inline-flex; align-items:center; }
        .cai-btn-indigo:hover { background:#4338ca; box-shadow:0 8px 28px rgba(79,70,229,.45); transform:translateY(-1px); }
        .cai-btn-outline { background:#fff; border:2px solid #e2e8f0; transition:all .25s; text-decoration:none; color:#475569; cursor:pointer; display:inline-flex; align-items:center; }
        .cai-btn-outline:hover { border-color:#4f46e5; color:#4f46e5; transform:translateY(-1px); }
        .cai-btn-sky { background:#0ea5e9; box-shadow:0 4px 16px rgba(14,165,233,.3); transition:all .25s; text-decoration:none; color:#fff; border:none; cursor:pointer; display:inline-flex; align-items:center; }
        .cai-btn-sky:hover { background:#0284c7; transform:translateY(-1px); }
        .cai-hero-dots { background-image:radial-gradient(#e2e8f0 1px,transparent 1px); background-size:28px 28px; }
        .screen-shadow { border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 24px 64px rgba(79,70,229,.12); }
        .screen-chrome { height:32px; background:#f1f5f9; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; padding:0 12px; gap:6px; }
      `}</style>

      {/* ── NAV ── */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, transition: "all .3s", background: scrolled ? "rgba(255,255,255,.95)" : "#fff", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: "1px solid #e2e8f0", boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,.06)" : "none" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CaissioMarkSVG size={30} color="#4F46E5" />
            <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>Caissio</span>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {[["#demo","Essayer"],["#features","Fonctionnalités"],["#windows","Télécharger"],["#pricing","Tarifs"],["#faq","FAQ"]].map(([href,label]) => (
              <a key={href} href={href} className="cai-nav-link">{label}</a>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/signup" style={{ fontSize: 14, color: "#475569", textDecoration: "none", fontWeight: 500 }}>Connexion</a>
            <a href="/signup" className="cai-btn-indigo" style={{ height: 38, padding: "0 20px", borderRadius: 12, fontSize: 14, fontWeight: 700, gap: 6 }}>
              Essai 7 jours gratuit
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="cai-hero-dots" style={{ position: "relative", paddingTop: 120, paddingBottom: 96, overflow: "hidden", background: "#fafafe" }}>
        <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: 700, height: 400, background: "radial-gradient(ellipse at 50% 0%,rgba(79,70,229,.12),transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "0 16px", height: 36, borderRadius: 999, background: "#ede9fe", border: "1px solid #c4b5fd", fontSize: 12, fontWeight: 700, color: "#4f46e5", marginBottom: 32 }}>
              <Monitor style={{ width: 14, height: 14 }} />
              Disponible sur Windows 10 &amp; 11
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            </div>
            <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(48px,8vw,88px)", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.04em", color: "#0f172a", marginBottom: 32 }}>
              La caisse qui fait<br />
              <span style={{ color: "#4f46e5" }}>tout le travail.</span>
            </h1>
            <p style={{ fontSize: "clamp(17px,2vw,21px)", color: "#64748b", maxWidth: 680, margin: "0 auto 48px", lineHeight: 1.6 }}>
              Encaissez plus vite, gérez votre stock en temps réel, fidélisez vos clients.{" "}
              <strong style={{ color: "#0f172a" }}>Sans installation, sans formation, sans prise de tête.</strong>
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginBottom: 40 }}>
              <a href="/signup" className="cai-btn-indigo" style={{ height: 64, padding: "0 40px", borderRadius: 20, fontWeight: 900, fontSize: 18, gap: 12 }}>
                Commencer gratuitement <ArrowRight style={{ width: 20, height: 20 }} />
              </a>
              <a href="#windows" className="cai-btn-sky" style={{ height: 64, padding: "0 40px", borderRadius: 20, fontWeight: 900, fontSize: 18, gap: 12 }}>
                <Download style={{ width: 20, height: 20 }} /> Télécharger pour Windows
              </a>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px 32px", fontSize: 13, color: "#94a3b8" }}>
              {["7 jours gratuits, sans carte","Configuration en 2 minutes","Résiliation sans engagement"].map((t) => (
                <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                  <Check style={{ width: 14, height: 14, color: "#10b981" }} /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ marginTop: 72, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, maxWidth: 900, margin: "72px auto 0" }}>
            {STATS.map((s) => (
              <div key={s.label} className="cai-card" style={{ padding: "20px 16px", textAlign: "center" }}>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 36, fontWeight: 900, color: "#4f46e5", marginBottom: 4 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEMO ── */}
      <section id="demo" style={{ padding: "96px 0", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 56px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", color: "#4f46e5", fontWeight: 700, marginBottom: 16 }}>
              <Play style={{ width: 12, height: 12 }} /> Essayez en direct
            </div>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(32px,4vw,48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0f172a" }}>
              Encaissez votre première vente{" "}
              <span style={{ color: "#4f46e5" }}>maintenant.</span>
            </h2>
            <p style={{ marginTop: 16, color: "#64748b", fontSize: 17 }}>Touchez les produits, ajustez les quantités, validez. Exactement comme dans la vraie caisse.</p>
          </div>
          <DemoPOS />
        </div>
      </section>

      {/* ── FEATURES avec screenshots ── */}
      <section id="features" style={{ background: "#fff" }}>
        {FEATURE_SECTIONS.map((f, idx) => {
          const Icon = f.icon;
          const isEven = idx % 2 === 0;
          const textBlock = (
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon style={{ width: 18, height: 18, color: "#4f46e5" }} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#4f46e5" }}>{f.tag}</span>
              </div>
              <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(28px,3.5vw,44px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0f172a", marginBottom: 20, whiteSpace: "pre-line" }}>{f.title}</h2>
              <p style={{ fontSize: 17, color: "#64748b", lineHeight: 1.7, marginBottom: 28, maxWidth: 480 }}>{f.desc}</p>
              <ul style={{ listStyle: "none", padding: 0, margin: "0 0 36px", display: "flex", flexDirection: "column", gap: 10 }}>
                {f.bullets.map((b) => (
                  <li key={b} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 15, color: "#0f172a", fontWeight: 500 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check style={{ width: 12, height: 12, color: "#059669" }} />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
              <a href="/signup" className="cai-btn-indigo" style={{ height: 52, padding: "0 28px", borderRadius: 16, fontWeight: 700, fontSize: 15, gap: 8, alignSelf: "flex-start" }}>
                Essayer gratuitement <ArrowRight style={{ width: 16, height: 16 }} />
              </a>
            </div>
          );
          const imgBlock = (
            <div className="screen-shadow">
              <div className="screen-chrome">
                <div style={{ height: 10, width: 10, borderRadius: "50%", background: "#fca5a5" }} />
                <div style={{ height: 10, width: 10, borderRadius: "50%", background: "#fcd34d" }} />
                <div style={{ height: 10, width: 10, borderRadius: "50%", background: "#86efac" }} />
                <div style={{ marginLeft: 10, fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>caissio.app</div>
              </div>
              <img src={f.img} alt={f.tag} style={{ width: "100%", display: "block", objectFit: "cover", objectPosition: "top" }} />
            </div>
          );
          return (
            <div key={f.tag} style={{ padding: "96px 0", borderTop: idx === 0 ? "1px solid #e2e8f0" : "1px solid #f1f5f9", background: isEven ? "#fff" : "#fafafe" }}>
              <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, alignItems: "center" }}>
                {f.imgLeft ? <>{imgBlock}{textBlock}</> : <>{textBlock}{imgBlock}</>}
              </div>
            </div>
          );
        })}
      </section>

      {/* ── WINDOWS DOWNLOAD ── */}
      <section id="windows" style={{ padding: "96px 0", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ borderRadius: 28, padding: "64px", position: "relative", overflow: "hidden", background: "linear-gradient(135deg,#ede9fe,#dbeafe)", border: "1px solid #c4b5fd" }}>
            <div style={{ position: "absolute", right: -60, top: -60, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle,#a5b4fc,transparent 70%)", filter: "blur(40px)", opacity: 0.5 }} />
            <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr auto", gap: 48, alignItems: "center" }}>
              <div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
                  <div style={{ width: 40, height: 40, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                    {(["#f25022","#7fba00","#00a4ef","#ffb900"] as const).map((c, i) => <div key={i} style={{ background: c, borderRadius: 2 }} />)}
                  </div>
                  <span style={{ fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Windows 10 / 11</span>
                </div>
                <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(32px,4vw,56px)", fontWeight: 900, letterSpacing: "-0.03em", marginBottom: 20, color: "#0f172a" }}>
                  Votre caisse,<br />
                  <span style={{ color: "#4f46e5" }}>en local sur votre PC.</span>
                </h2>
                <p style={{ fontSize: 18, color: "#475569", marginBottom: 32, maxWidth: 520, lineHeight: 1.6 }}>
                  Fonctionne même sans connexion internet. Vos données restent sur votre machine.
                </p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
                  <a href="/signup" className="cai-btn-sky" style={{ height: 60, padding: "0 36px", borderRadius: 18, fontWeight: 900, fontSize: 17, gap: 12 }}>
                    <Download style={{ width: 18, height: 18 }} /> Télécharger (.exe)
                  </a>
                  <a href="/signup" className="cai-btn-outline" style={{ height: 60, padding: "0 36px", borderRadius: 18, fontWeight: 700, fontSize: 17, gap: 8 }}>
                    Ou version web →
                  </a>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, maxWidth: 320 }}>
                  {[{ i: Shield, t: "Données locales", c: "#10b981" },{ i: Wifi, t: "Hors-ligne", c: "#4f46e5" },{ i: Cpu, t: "Ultra-léger", c: "#0ea5e9" }].map(({ i: Ico, t, c }) => (
                    <div key={t} style={{ textAlign: "center" }}>
                      <div style={{ width: 40, height: 40, margin: "0 auto 8px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Ico style={{ width: 16, height: 16, color: c }} />
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600, color: "#475569" }}>{t}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ width: 260, flexShrink: 0 }}>
                <div style={{ borderRadius: 20, overflow: "hidden", border: "1px solid #e2e8f0", background: "#fff", boxShadow: "0 24px 64px rgba(79,70,229,.15)" }}>
                  <div style={{ height: 32, background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", padding: "0 12px", gap: 6 }}>
                    <div style={{ height: 10, width: 10, borderRadius: "50%", background: "#fca5a5" }} />
                    <div style={{ height: 10, width: 10, borderRadius: "50%", background: "#fcd34d" }} />
                    <div style={{ height: 10, width: 10, borderRadius: "50%", background: "#86efac" }} />
                    <div style={{ margin: "0 auto", fontSize: 10, color: "#94a3b8", fontFamily: "monospace" }}>Caissio</div>
                  </div>
                  <div style={{ padding: 16 }}>
                    {[["Tomate 500g","1.20 €"],["Eau Evian 1.5L","0.95 €"],["Pain complet","2.80 €"]].map(([name, price]) => (
                      <div key={name} style={{ display: "flex", justifyContent: "space-between", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "8px 12px", marginBottom: 8 }}>
                        <span style={{ fontSize: 12, color: "#0f172a", fontWeight: 500 }}>{name}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5" }}>{price}</span>
                      </div>
                    ))}
                    <div style={{ height: 1, background: "#e2e8f0", margin: "8px 0 12px" }} />
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px", marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>TOTAL</span>
                      <span style={{ fontSize: 20, fontWeight: 900, color: "#4f46e5" }}>4.95 €</span>
                    </div>
                    <div style={{ height: 36, borderRadius: 10, background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                      ✓ Encaisser
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "96px 0", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", color: "#4f46e5", fontWeight: 700, marginBottom: 16 }}>Avis clients</div>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(32px,4vw,48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0f172a" }}>
              Des commerçants qui dorment{" "}
              <span style={{ color: "#4f46e5" }}>mieux.</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="cai-card" style={{ padding: 28 }}>
                <div style={{ display: "flex", gap: 2, marginBottom: 16 }}>
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} style={{ width: 14, height: 14, color: "#f59e0b", fill: "#f59e0b" }} />)}
                </div>
                <p style={{ color: "#0f172a", fontWeight: 500, lineHeight: 1.6, fontSize: 15 }}>« {t.q} »</p>
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 14 }}>{t.a}</div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 2 }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "96px 0", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 64px" }}>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", color: "#4f46e5", fontWeight: 700, marginBottom: 16 }}>Tarifs</div>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(32px,4vw,56px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0f172a" }}>
              Choisissez votre plan.{" "}
              <span style={{ color: "#4f46e5" }}>Sans surprise.</span>
            </h2>
            <p style={{ marginTop: 20, color: "#64748b", fontSize: 18 }}>7 jours d'essai gratuit sur tous les plans. Résiliez quand vous voulez.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, maxWidth: 1060, margin: "0 auto" }}>
            {PLANS.map((plan) => (
              <div key={plan.name} style={{
                borderRadius: 24, padding: 32, position: "relative", display: "flex", flexDirection: "column",
                background: plan.highlight ? "#4f46e5" : "#fff",
                border: plan.highlight ? "2px solid #4f46e5" : "2px solid #e2e8f0",
                boxShadow: plan.highlight ? "0 20px 60px rgba(79,70,229,.35)" : "0 4px 20px rgba(0,0,0,.06)",
                transform: plan.highlight ? "scale(1.03)" : "none",
              }}>
                {plan.badge && (
                  <div style={{ position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)", background: "#fbbf24", color: "#78350f", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", padding: "4px 16px", borderRadius: 999, whiteSpace: "nowrap" }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, color: plan.highlight ? "rgba(255,255,255,.7)" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 56, fontWeight: 900, color: plan.highlight ? "#fff" : "#0f172a", letterSpacing: "-0.03em" }}>{plan.price}€</span>
                  <span style={{ color: plan.highlight ? "rgba(255,255,255,.6)" : "#94a3b8", fontSize: 16 }}>/mois</span>
                </div>
                <p style={{ color: plan.highlight ? "rgba(255,255,255,.55)" : "#94a3b8", fontSize: 13, marginBottom: 28 }}>Puis {plan.price}€/mois. Annulable à tout moment.</p>
                <div style={{ height: 1, background: plan.highlight ? "rgba(255,255,255,.15)" : "#f1f5f9", marginBottom: 24 }} />
                <ul style={{ listStyle: "none", padding: 0, margin: "0 0 auto", display: "flex", flexDirection: "column", gap: 12 }}>
                  {plan.features.map((feat) => (
                    <li key={feat} style={{ display: "flex", alignItems: "flex-start", gap: 10, color: plan.highlight ? "#e0e7ff" : "#475569", fontSize: 14 }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: plan.highlight ? "rgba(255,255,255,.2)" : "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                        <Check style={{ width: 11, height: 11, color: plan.highlight ? "#fff" : "#059669" }} />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
                {plan.apiKey && (
                  <div style={{ marginTop: 24, padding: 14, borderRadius: 14, background: "#ede9fe", border: "1px solid #c4b5fd" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>🔑 Clé API REST</div>
                    <div style={{ fontFamily: "monospace", fontSize: 12, color: "#6d28d9", background: "#fff", borderRadius: 8, padding: "8px 12px", border: "1px solid #ddd6fe", wordBreak: "break-all" }}>
                      sk-caissio-xxxx-xxxx-xxxx
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: "#7c3aed" }}>Accès complet à l'API · Webhooks · Intégrations tierces</div>
                  </div>
                )}
                <a href="/signup" style={{
                  marginTop: 28, width: "100%", height: 52, borderRadius: 16,
                  fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  textDecoration: "none",
                  background: plan.highlight ? "#fff" : "#4f46e5",
                  color: plan.highlight ? "#4f46e5" : "#fff",
                  border: "none",
                }}>
                  {plan.cta} {plan.highlight && <ArrowRight style={{ width: 16, height: 16 }} />}
                </a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 40, fontSize: 13, color: "#94a3b8" }}>
            Aucune carte requise pour l'essai · Résiliation en 1 clic · TVA non incluse
          </p>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "96px 0", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 768, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", color: "#4f46e5", fontWeight: 700, marginBottom: 16 }}>FAQ</div>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(32px,4vw,48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0f172a" }}>Questions fréquentes</h2>
          </div>
          {FAQ_DATA.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "128px 0", background: "#4f46e5", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 500, background: "radial-gradient(circle,rgba(99,102,241,.6),transparent 60%)", filter: "blur(60px)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: 900, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(40px,7vw,80px)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: 24, color: "#fff" }}>
            Lancez votre caisse en{" "}
            <span style={{ color: "#fbbf24" }}>2 minutes</span>.
          </h2>
          <p style={{ color: "rgba(255,255,255,.7)", fontSize: 19, marginBottom: 48, maxWidth: 480, margin: "0 auto 48px" }}>
            Aucune carte bancaire. Aucun risque. 7 jours pour tomber amoureux du logiciel.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
            <a href="/signup" style={{ height: 64, padding: "0 48px", borderRadius: 20, fontWeight: 900, fontSize: 20, display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", color: "#4f46e5", textDecoration: "none" }}>
              Commencer gratuitement <ArrowRight style={{ width: 20, height: 20 }} />
            </a>
            <a href="/signup" className="cai-btn-sky" style={{ height: 64, padding: "0 40px", borderRadius: 20, fontWeight: 900, fontSize: 20, gap: 12 }}>
              <Download style={{ width: 20, height: 20 }} /> Télécharger Windows
            </a>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: "rgba(255,255,255,.5)" }}>Sans engagement · Résiliation en 1 clic · Support 7j/7</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "40px 0", background: "#0f172a" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CaissioMarkSVG size={24} color="#4F46E5" />
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
