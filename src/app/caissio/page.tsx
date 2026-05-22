"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ArrowRight, Check, Zap, Package, FileSpreadsheet, BarChart3,
  Users, ScanBarcode, Printer, DoorOpen,
  Bluetooth, Star, Leaf, Trash2, Plus, Minus, Receipt,
  ChevronDown, Play,
  Percent, CreditCard, Banknote, Mail, Phone,
  Search, ScanLine, LayoutDashboard, Boxes, FileBarChart2, Plug,
  Shield, Wifi, Cpu, FileText, RotateCcw, AlertCircle,
  Smartphone, Monitor, Apple,
} from "lucide-react";

/* ─── DEMO PRODUCTS ─────────────────────────────────── */

type DemoProduct = {
  id: string; name: string; price: number; cat: string;
  stock: number; featured?: boolean; img: string; tva: number;
};

const DEMO_PRODUCTS: DemoProduct[] = [
  // ─── Phares (affichés en grand) ───
  { id: "1",  name: "Nutella 400g",       price: 3.99, cat: "e", stock: 5,  featured: true,  img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80", tva: 5.5 },
  { id: "2",  name: "Croissant",          price: 1.20, cat: "b", stock: 12, featured: true,  img: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&q=80", tva: 5.5 },
  { id: "3",  name: "Coca-Cola 33cl",     price: 1.80, cat: "d", stock: 3,  featured: true,  img: "https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400&q=80", tva: 20  },
  // ─── Boulangerie ───
  { id: "4",  name: "Pain au chocolat",   price: 1.40, cat: "b", stock: 8,  img: "https://images.unsplash.com/photo-1604882941706-7adadb3cd688?w=400&q=80", tva: 5.5 },
  { id: "5",  name: "Baguette tradition", price: 1.10, cat: "b", stock: 15, img: "https://images.unsplash.com/photo-1549931319-a545dcf3bc7b?w=400&q=80", tva: 5.5 },
  { id: "6",  name: "Pain de campagne",   price: 3.50, cat: "b", stock: 6,  img: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80", tva: 5.5 },
  // ─── Boissons ───
  { id: "7",  name: "Café expresso",      price: 2.00, cat: "d", stock: 50, img: "https://images.unsplash.com/photo-1510707577719-ae7c14805e3a?w=400&q=80", tva: 10  },
  { id: "8",  name: "Eau Evian 50cl",     price: 1.00, cat: "d", stock: 24, img: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?w=400&q=80", tva: 5.5 },
  { id: "9",  name: "Jus d'orange 1L",    price: 2.50, cat: "d", stock: 8,  img: "https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80", tva: 5.5 },
  // ─── Épicerie ───
  { id: "10", name: "Pâtes Barilla 500g", price: 1.85, cat: "e", stock: 14, img: "https://images.unsplash.com/photo-1551462147-ff29053bfc14?w=400&q=80", tva: 5.5 },
  { id: "11", name: "Riz basmati 1kg",    price: 2.80, cat: "e", stock: 9,  img: "https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=400&q=80", tva: 5.5 },
  // ─── Snacks ───
  { id: "12", name: "Sandwich jambon",    price: 3.90, cat: "s", stock: 4,  img: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&q=80", tva: 10  },
  { id: "13", name: "Chips Lay's 150g",   price: 1.80, cat: "s", stock: 10, img: "https://images.unsplash.com/photo-1621955511577-8e92da25e7bc?w=400&q=80", tva: 20  },
  // ─── Fruits ───
  { id: "14", name: "Bananes 1kg",        price: 1.90, cat: "f", stock: 20, img: "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80", tva: 5.5 },
  { id: "15", name: "Pommes Golden 1kg",  price: 2.50, cat: "f", stock: 18, img: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=400&q=80", tva: 5.5 },
];

const INIT_STOCK = Object.fromEntries(DEMO_PRODUCTS.map((p) => [p.id, p.stock]));

const CATS = [
  { id: "all", label: "Tous" },
  { id: "b",   label: "Boulangerie" },
  { id: "d",   label: "Boissons" },
  { id: "e",   label: "Épicerie" },
  { id: "s",   label: "Snacks" },
  { id: "f",   label: "Fruits" },
];

/* ─── FEATURES ──────────────────────────────────────── */

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
    tag: "Factures légales",
    icon: FileText,
    title: "Factures conformes\nnormes 2026.",
    desc: "Générez des factures professionnelles depuis n'importe quelle vente. Toutes les mentions obligatoires 2026 sont incluses automatiquement.",
    bullets: [
      "Numérotation séquentielle FAC-2026-xxxx",
      "Calcul HT/TVA par taux (5,5% / 10% / 20%)",
      "Pénalités de retard & indemnité 40€ (art. L.441-10)",
      "Impression PDF ou envoi email en 1 clic",
      "Statuts : brouillon · envoyée · payée",
    ],
    img: "/screen-factures.jpg",
    imgLeft: true,
  },
  {
    tag: "Dashboard",
    icon: BarChart3,
    title: "Tout votre commerce,\nd'un coup d'œil.",
    desc: "CA du jour, marges, top produits, alertes stock — tout s'affiche en temps réel sans aucune saisie manuelle.",
    bullets: ["CA / marge / panier moyen", "Top 10 produits du jour", "Alertes stock automatiques", "Graphiques hebdo et mensuel"],
    img: "/screen-dashboard.jpg",
    imgLeft: false,
  },
  {
    tag: "Catalogue",
    icon: Package,
    title: "800 produits importés\nen 2 minutes.",
    desc: "Glissez votre fichier Excel ou CSV. Caissio détecte les colonnes, crée les catégories et valide les prix automatiquement.",
    bullets: ["Import Excel / CSV en glisser-déposer", "Prévisualisation avant validation", "Catégories créées automatiquement", "Prix d'achat, vente, marge et TVA"],
    img: "/screen-products.jpg",
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
    badge: "7 jours offerts",
    highlight: false,
    stripeLink: "https://buy.stripe.com/7sY3cu63vgJ8bLW7i90x200",
    cta: "Activer 7 jours gratuits",
    trialNote: "7 jours inclus · puis 15 €/mois · résiliez avant le 8ème jour pour ne rien payer",
    features: ["1 utilisateur", "500 produits", "Ticket PDF", "Dashboard de base", "Support email"],
  },
  {
    name: "Pro",
    price: 39,
    badge: "Populaire",
    highlight: true,
    stripeLink: null,
    cta: "Choisir Pro",
    trialNote: null,
    features: ["5 utilisateurs", "Catalogue illimité", "Import Excel/CSV", "Fidélité clients", "Rapports avancés", "Support prioritaire"],
  },
  {
    name: "Business",
    price: 59,
    badge: null,
    highlight: false,
    stripeLink: null,
    cta: "Contacter",
    trialNote: null,
    features: ["Utilisateurs illimités", "Multi-magasins (bientôt)", "Fournisseurs avancés", "API & matériel", "Manager dédié", "SLA 99,9%"],
  },
];

const FAQ_DATA = [
  { q: "Comment activer les 7 jours gratuits ?", a: "Cliquez sur « Activer 7 jours gratuits » sur le plan Starter. Vous entrez vos coordonnées bancaires pour réserver l'abonnement, mais aucun prélèvement n'est effectué avant le 8ème jour. Résiliez en 1 clic avant la fin de la période si vous ne souhaitez pas continuer." },
  { q: "Sur quel matériel fonctionne Caissio ?", a: "Caissio est une application web progressive (PWA) : elle fonctionne sur iPad, iPhone, Mac, Windows et tout navigateur moderne. Ajoutez-la à votre écran d'accueil pour une expérience identique à une application native." },
  { q: "Les factures sont-elles vraiment conformes aux normes 2026 ?", a: "Oui. Chaque facture inclut automatiquement la numérotation séquentielle, le SIRET, le récapitulatif TVA par taux, les pénalités de retard au taux légal (art. L.441-10), l'indemnité forfaitaire de 40€ (art. D.441-5) et la mention escompte. Conformes à l'article 289 du CGI." },
  { q: "Puis-je importer mon catalogue existant ?", a: "Oui. Glissez votre fichier Excel ou CSV, prévisualisez, validez. Les catégories sont créées automatiquement." },
  { q: "Mes données sont-elles sécurisées ?", a: "Authentification sécurisée, PIN 6 chiffres, verrouillage automatique après 10 min. Vos données vous appartiennent." },
  { q: "Puis-je résilier à tout moment ?", a: "Oui. Sans engagement, sans préavis, sans pénalité. Résiliez en un clic depuis votre espace Abonnement." },
];

const TESTIMONIALS = [
  { q: "On encaisse deux fois plus vite. Les clients adorent.", a: "Sophie L.", role: "Épicerie fine, Lyon" },
  { q: "L'import de mes 800 références s'est fait en 2 minutes.", a: "Karim B.", role: "Boulangerie, Marseille" },
  { q: "Les factures sont prêtes en 1 clic, vraiment conformes.", a: "Marie D.", role: "Snack-Tabac, Bordeaux" },
];

const STATS = [
  { value: "3 sec", label: "par transaction" },
  { value: "2 min", label: "pour démarrer" },
  { value: "100%", label: "normes 2026" },
  { value: "0", label: "installation requise" },
];

/* ─── SIDE NAV ──────────────────────────────────────── */

const SIDE_NAV = [
  { icon: ScanBarcode,    label: "Caisse",       active: true  },
  { icon: LayoutDashboard,label: "Dashboard",    active: false },
  { icon: Package,        label: "Produits",     active: false },
  { icon: Boxes,          label: "Stock",        active: false },
  { icon: Users,          label: "Clients",      active: false },
  { icon: FileText,       label: "Factures",     active: false },
  { icon: FileBarChart2,  label: "Rapports",     active: false },
  { icon: Plug,           label: "Périphériques",active: false },
];

/* ─── CAISSIO SVG ───────────────────────────────────── */

function CaissioMarkSVG({ size = 32, color = "#4F46E5" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-label="Caissio">
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

/* ─── DEMO POS ──────────────────────────────────────── */

type CartItem = DemoProduct & { qty: number };

function StockBadge({ stock }: { stock: number }) {
  if (stock === 0) return <span style={{ fontSize: 9, fontWeight: 700, color: "#dc2626", background: "#fee2e2", padding: "1px 5px", borderRadius: 4 }}>Rupture</span>;
  if (stock <= 3) return <span style={{ fontSize: 9, fontWeight: 700, color: "#d97706", background: "#fef3c7", padding: "1px 5px", borderRadius: 4 }}>Stock : {stock}</span>;
  return <span style={{ fontSize: 9, fontWeight: 700, color: "#059669", background: "#d1fae5", padding: "1px 5px", borderRadius: 4 }}>En stock : {stock}</span>;
}

function DemoPOS() {
  const [stockState, setStockState] = useState<Record<string, number>>({ ...INIT_STOCK });
  const [cat, setCat] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discount, setDiscount] = useState(0);
  const [stage, setStage] = useState<"pos" | "pay" | "ticket">("pos");
  const [payMethod, setPayMethod] = useState<"cash" | "card" | null>(null);
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [saleTime, setSaleTime] = useState("");

  const featured = DEMO_PRODUCTS.filter((p) => p.featured);
  const regular  = DEMO_PRODUCTS.filter((p) => !p.featured);

  const filtered = useMemo(() => {
    const pool = search || cat !== "all" ? DEMO_PRODUCTS : regular;
    return pool.filter((p) => {
      if (cat !== "all" && p.cat !== cat) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [cat, search]);

  const showFeatured = !search && cat === "all";

  const add = useCallback((p: DemoProduct) => {
    const avail = stockState[p.id] ?? 0;
    const inCart = cart.find((i) => i.id === p.id)?.qty ?? 0;
    if (inCart >= avail) return;
    setCart((c) => {
      const f = c.find((i) => i.id === p.id);
      if (f) return c.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { ...p, qty: 1 }];
    });
  }, [stockState, cart]);

  const dec = (id: string) => setCart((c) => c.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0));
  const remove = (id: string) => setCart((c) => c.filter((i) => i.id !== id));

  const reset = useCallback(() => {
    setCart([]); setDiscount(0); setStage("pos");
    setPayMethod(null); setCashGiven(0);
    setStockState({ ...INIT_STOCK });
    setCat("all"); setSearch("");
  }, []);

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total    = Math.max(0, subtotal - discount);
  const change   = payMethod === "cash" ? Math.max(0, cashGiven - total) : 0;
  const canPay   = payMethod === "card" || (payMethod === "cash" && cashGiven >= total);

  const handleValidate = () => {
    if (!canPay) return;
    const newStock = { ...stockState };
    cart.forEach((item) => { newStock[item.id] = Math.max(0, (newStock[item.id] ?? 0) - item.qty); });
    setStockState(newStock);
    setSaleTime(new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }));
    setStage("ticket");
  };

  const QUICK_AMOUNTS = [
    Math.ceil(total),
    Math.ceil(total / 5) * 5,
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 20) * 20,
  ].filter((v, i, a) => v >= total && a.indexOf(v) === i).slice(0, 4);

  return (
    <div style={{ borderRadius: 24, border: "1px solid #e2e8f0", background: "#f8fafc", overflow: "hidden", boxShadow: "0 24px 64px rgba(79,70,229,.12)", position: "relative" }}>
      {/* Browser chrome */}
      <div style={{ height: 36, background: "#f1f5f9", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", padding: "0 14px", gap: 6 }}>
        <div style={{ height: 10, width: 10, borderRadius: "50%", background: "#fca5a5" }} />
        <div style={{ height: 10, width: 10, borderRadius: "50%", background: "#fcd34d" }} />
        <div style={{ height: 10, width: 10, borderRadius: "50%", background: "#86efac" }} />
        <div style={{ margin: "0 auto", fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>caissio.app · /caisse</div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "160px 1fr 300px", minHeight: 560 }}>

        {/* ── Sidebar ── */}
        <div style={{ background: "#fff", borderRight: "1px solid #e2e8f0", padding: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 8px 14px" }}>
            <CaissioMarkSVG size={22} />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a", letterSpacing: "-0.02em" }}>Caissio</span>
          </div>
          {SIDE_NAV.map((n) => {
            const I = n.icon;
            return (
              <div key={n.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 8px", height: 36, borderRadius: 8, fontSize: 12, fontWeight: 500, marginBottom: 2, background: n.active ? "#ede9fe" : "transparent", color: n.active ? "#4f46e5" : "#64748b" }}>
                <I style={{ width: 14, height: 14 }} />
                <span>{n.label}</span>
              </div>
            );
          })}
        </div>

        {/* ── Product grid ── */}
        <div style={{ background: "#f8fafc", display: "flex", flexDirection: "column" }}>
          {/* Search + actions bar */}
          <div style={{ height: 48, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 8, padding: "0 12px", flexShrink: 0 }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
              <Search style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#94a3b8" }} />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); if (e.target.value) setCat("all"); }}
                placeholder="Rechercher un article…"
                style={{ width: "100%", height: 34, paddingLeft: 32, paddingRight: 10, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#0f172a", outline: "none" }}
              />
            </div>
            <button style={{ height: 34, padding: "0 12px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", cursor: "pointer" }}>
              <ScanLine style={{ width: 13, height: 13 }} /> Scan
            </button>
            <button style={{ height: 34, padding: "0 12px", borderRadius: 8, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#64748b", cursor: "pointer" }}>
              <DoorOpen style={{ width: 13, height: 13 }} /> Tiroir
            </button>
          </div>

          {/* Category tabs */}
          <div style={{ height: 44, background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", gap: 6, padding: "0 12px", overflowX: "auto", flexShrink: 0 }}>
            {CATS.map((c) => (
              <button key={c.id} onClick={() => { setCat(c.id); setSearch(""); }} style={{ height: 28, padding: "0 12px", borderRadius: 999, fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", cursor: "pointer", border: "none", background: cat === c.id && !search ? "#4f46e5" : "#f1f5f9", color: cat === c.id && !search ? "#fff" : "#64748b" }}>
                {c.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, padding: 12, overflowY: "auto", maxHeight: 480 }}>

            {/* 3 produits phares */}
            {showFeatured && (
              <>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 8 }}>⭐ Top ventes</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
                  {featured.map((p) => {
                    const avail = stockState[p.id] ?? 0;
                    const inCart = cart.find((i) => i.id === p.id)?.qty ?? 0;
                    const maxed = inCart >= avail;
                    return (
                      <button
                        key={p.id}
                        onClick={() => add(p)}
                        disabled={avail === 0}
                        style={{
                          background: "#fff",
                          border: `2px solid ${inCart > 0 ? "#4f46e5" : "#e2e8f0"}`,
                          borderRadius: 14, padding: 10, textAlign: "left", cursor: avail === 0 ? "not-allowed" : "pointer",
                          position: "relative", opacity: avail === 0 ? 0.5 : 1,
                        }}
                      >
                        {inCart > 0 && (
                          <div style={{ position: "absolute", top: -8, right: -8, width: 20, height: 20, borderRadius: "50%", background: "#4f46e5", color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{inCart}</div>
                        )}
                        <div style={{ aspectRatio: "4/3", borderRadius: 8, overflow: "hidden", marginBottom: 8 }}>
                          <img src={p.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                        </div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>{p.name}</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, fontWeight: 900, color: "#4f46e5" }}>{p.price.toFixed(2)} €</span>
                          <StockBadge stock={avail} />
                        </div>
                        {maxed && avail > 0 && <div style={{ fontSize: 9, color: "#f59e0b", marginTop: 2 }}>Stock max atteint</div>}
                      </button>
                    );
                  })}
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 8 }}>Tous les articles</div>
              </>
            )}

            {/* Reste des produits */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8 }}>
              {filtered.map((p) => {
                const avail = stockState[p.id] ?? 0;
                const inCart = cart.find((i) => i.id === p.id)?.qty ?? 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => add(p)}
                    disabled={avail === 0}
                    style={{
                      background: "#fff", border: `2px solid ${inCart > 0 ? "#4f46e5" : "#e2e8f0"}`,
                      borderRadius: 12, padding: 8, textAlign: "left", cursor: avail === 0 ? "not-allowed" : "pointer",
                      position: "relative", opacity: avail === 0 ? 0.5 : 1,
                    }}
                  >
                    {inCart > 0 && (
                      <div style={{ position: "absolute", top: -7, right: -7, width: 18, height: 18, borderRadius: "50%", background: "#4f46e5", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{inCart}</div>
                    )}
                    <div style={{ aspectRatio: "1", borderRadius: 6, overflow: "hidden", marginBottom: 5 }}>
                      <img src={p.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} loading="lazy" />
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 2 }}>{p.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#4f46e5" }}>{p.price.toFixed(2)} €</span>
                      <StockBadge stock={avail} />
                    </div>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <div style={{ gridColumn: "1/-1", textAlign: "center", padding: 24, color: "#94a3b8", fontSize: 13 }}>Aucun article trouvé</div>
              )}
            </div>
          </div>
        </div>

        {/* ── Panier ── */}
        <aside style={{ background: "#fff", borderLeft: "1px solid #e2e8f0", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "0 16px", height: 48, borderBottom: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>Ticket en cours</span>
            {cart.length > 0 && (
              <button onClick={reset} title="Annuler la vente" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8", background: "none", border: "none", cursor: "pointer" }}>Annuler</button>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 10, maxHeight: 400 }}>
            {cart.length === 0 ? (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#cbd5e1", padding: "40px 16px", textAlign: "center" }}>
                <Receipt style={{ width: 32, height: 32, marginBottom: 8, opacity: 0.4 }} />
                <div style={{ fontSize: 11 }}>Touchez un produit pour commencer la vente.</div>
              </div>
            ) : cart.map((i) => (
              <div key={i.id} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 10, marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <img src={i.img} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#94a3b8" }}><Percent style={{ width: 11, height: 11 }} /> Remise</div>
              <input type="number" value={discount} onChange={(e) => setDiscount(Math.max(0, parseFloat(e.target.value) || 0))} style={{ width: 64, height: 26, padding: "0 8px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 6, textAlign: "right", color: "#0f172a", fontFamily: "monospace", fontSize: 11, outline: "none" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid #e2e8f0", marginBottom: 10 }}>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8" }}>Total</span>
              <span style={{ fontSize: 22, fontWeight: 900, color: "#4f46e5" }}>{total.toFixed(2)} €</span>
            </div>
            <button
              onClick={() => cart.length > 0 && setStage("pay")}
              disabled={cart.length === 0}
              style={{ width: "100%", height: 44, borderRadius: 12, background: cart.length === 0 ? "#e0e7ff" : "#4f46e5", color: cart.length === 0 ? "#a5b4fc" : "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: cart.length === 0 ? "not-allowed" : "pointer" }}
            >
              Encaisser
            </button>
          </div>
        </aside>
      </div>

      {/* ── Overlay paiement ── */}
      {stage === "pay" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,.55)", backdropFilter: "blur(8px)", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 10 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24, width: "100%", maxWidth: 380, boxShadow: "0 24px 64px rgba(0,0,0,.2)" }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 4 }}>Total à encaisser</div>
            <div style={{ fontSize: 44, fontWeight: 900, color: "#4f46e5", marginBottom: 16, letterSpacing: "-2px" }}>{total.toFixed(2)} €</div>

            {/* Mode paiement */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 }}>
              <button
                onClick={() => { setPayMethod("cash"); setCashGiven(0); }}
                style={{ height: 60, borderRadius: 12, border: payMethod === "cash" ? "2px solid #4f46e5" : "2px solid #e2e8f0", background: payMethod === "cash" ? "#ede9fe" : "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#0f172a" }}
              >
                <Banknote style={{ width: 18, height: 18, color: payMethod === "cash" ? "#4f46e5" : "#64748b" }} />
                Espèces
              </button>
              <button
                onClick={() => { setPayMethod("card"); setCashGiven(total); }}
                style={{ height: 60, borderRadius: 12, border: payMethod === "card" ? "2px solid #4f46e5" : "2px solid #e2e8f0", background: payMethod === "card" ? "#ede9fe" : "#f8fafc", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer", fontSize: 12, fontWeight: 700, color: "#0f172a" }}
              >
                <CreditCard style={{ width: 18, height: 18, color: payMethod === "card" ? "#4f46e5" : "#64748b" }} />
                Carte
              </button>
            </div>

            {/* Cash given */}
            {payMethod === "cash" && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "#64748b", marginBottom: 6, fontWeight: 600 }}>Montant donné par le client</div>
                <input
                  type="number"
                  value={cashGiven || ""}
                  onChange={(e) => setCashGiven(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  style={{ width: "100%", height: 44, padding: "0 14px", border: "2px solid #4f46e5", borderRadius: 10, fontSize: 18, fontWeight: 700, textAlign: "right", fontFamily: "monospace", outline: "none" }}
                />
                <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                  {QUICK_AMOUNTS.map((a) => (
                    <button key={a} onClick={() => setCashGiven(a)} style={{ flex: 1, height: 32, borderRadius: 8, border: cashGiven === a ? "2px solid #4f46e5" : "1px solid #e2e8f0", background: cashGiven === a ? "#ede9fe" : "#f8fafc", fontSize: 12, fontWeight: 700, color: cashGiven === a ? "#4f46e5" : "#64748b", cursor: "pointer" }}>
                      {a.toFixed(2)} €
                    </button>
                  ))}
                </div>
                {cashGiven >= total && (
                  <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "#d1fae5", border: "1px solid #6ee7b7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#065f46" }}>Rendu monnaie</span>
                    <span style={{ fontSize: 18, fontWeight: 900, color: "#059669", fontFamily: "monospace" }}>{change.toFixed(2)} €</span>
                  </div>
                )}
              </div>
            )}

            {payMethod === "card" && (
              <div style={{ marginBottom: 14, padding: "10px 14px", borderRadius: 10, background: "#eff6ff", border: "1px solid #bfdbfe", display: "flex", alignItems: "center", gap: 8 }}>
                <CreditCard style={{ width: 14, height: 14, color: "#1d4ed8" }} />
                <span style={{ fontSize: 12, color: "#1d4ed8", fontWeight: 600 }}>Présentez le terminal de paiement au client</span>
              </div>
            )}

            <button
              disabled={!canPay}
              onClick={handleValidate}
              style={{ width: "100%", height: 48, borderRadius: 14, background: canPay ? "#4f46e5" : "#e0e7ff", color: canPay ? "#fff" : "#a5b4fc", fontWeight: 700, fontSize: 16, border: "none", cursor: canPay ? "pointer" : "not-allowed" }}
            >
              {canPay ? "✓ Valider la vente" : "Saisissez le montant"}
            </button>
            <button onClick={() => setStage("pos")} style={{ width: "100%", marginTop: 8, height: 36, borderRadius: 10, background: "none", border: "none", color: "#94a3b8", fontSize: 12, cursor: "pointer" }}>
              ← Retour au panier
            </button>
          </div>
        </div>
      )}

      {/* ── Overlay ticket ── */}
      {stage === "ticket" && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(15,23,42,.55)", backdropFilter: "blur(8px)", borderRadius: 24, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, zIndex: 10 }}>
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, width: "100%", maxWidth: 400, boxShadow: "0 24px 64px rgba(0,0,0,.2)", overflow: "hidden" }}>
            {/* Header ticket */}
            <div style={{ background: "linear-gradient(135deg,#4f46e5,#6366f1)", padding: "20px 24px 16px", textAlign: "center" }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                <Check style={{ width: 22, height: 22, color: "#fff" }} />
              </div>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#fff", letterSpacing: "-0.5px" }}>Vente enregistrée !</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.7)", marginTop: 2 }}>TICKET #DEMO-{Date.now().toString().slice(-4)}</div>
            </div>

            {/* Ticket body */}
            <div style={{ padding: "16px 20px", fontFamily: "monospace" }}>
              <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", marginBottom: 12 }}>
                CAISSIO DEMO · {new Date().toLocaleDateString("fr-FR")} {saleTime}
              </div>

              <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 12, marginBottom: 12 }}>
                {cart.map((item) => (
                  <div key={item.id} style={{ marginBottom: 8 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#0f172a", fontWeight: 600 }}>{item.name}</span>
                      <span style={{ color: "#0f172a" }}>{(item.price * item.qty).toFixed(2)} €</span>
                    </div>
                    <div style={{ fontSize: 10, color: "#94a3b8" }}>×{item.qty} × {item.price.toFixed(2)} €</div>
                  </div>
                ))}
              </div>

              {discount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#10b981", marginBottom: 8 }}>
                  <span>Remise</span><span>−{discount.toFixed(2)} €</span>
                </div>
              )}

              <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 10, marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 900, color: "#0f172a" }}>
                  <span>TOTAL TTC</span><span style={{ color: "#4f46e5" }}>{total.toFixed(2)} €</span>
                </div>
              </div>

              <div style={{ borderTop: "1px dashed #e2e8f0", paddingTop: 10, marginBottom: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginBottom: 4 }}>
                  <span>{payMethod === "card" ? "Carte bancaire" : "Espèces"}</span>
                  <span>{payMethod === "card" ? total.toFixed(2) : cashGiven.toFixed(2)} €</span>
                </div>
                {payMethod === "cash" && change > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 700, color: "#059669" }}>
                    <span>RENDU MONNAIE</span><span>{change.toFixed(2)} €</span>
                  </div>
                )}
              </div>

              <div style={{ fontSize: 10, color: "#94a3b8", textAlign: "center", marginBottom: 12 }}>
                Merci de votre achat !
              </div>

              <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "8px 12px", marginBottom: 12, display: "flex", gap: 8, alignItems: "flex-start" }}>
                <AlertCircle style={{ width: 14, height: 14, color: "#d97706", flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 10, color: "#92400e", lineHeight: 1.5 }}>
                  Stock mis à jour en temps réel — vérifiez les cartes produits dans la caisse !
                </div>
              </div>
            </div>

            {/* Ticket options */}
            <div style={{ padding: "0 20px 16px" }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: "#0f172a", marginBottom: 8 }}>Le client souhaite son ticket ?</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                {([["Imprimer", Printer], ["Email", Mail], ["SMS", Phone]] as const).map(([label, Icon]) => (
                  <button key={label} onClick={reset} style={{ height: 38, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, cursor: "pointer" }}>
                    <Icon style={{ width: 12, height: 12 }} /> {label}
                  </button>
                ))}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <button onClick={reset} style={{ height: 38, borderRadius: 10, background: "#d1fae5", border: "none", color: "#065f46", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                  <Leaf style={{ width: 12, height: 12 }} /> Non merci
                </button>
                <button onClick={reset} style={{ height: 38, borderRadius: 10, background: "#4f46e5", border: "none", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
                  <RotateCcw style={{ width: 12, height: 12 }} /> Nouvelle vente
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
    <div onClick={() => setOpen(!open)} style={{ borderRadius: 16, padding: "0 20px", background: "#fff", border: "1px solid #e2e8f0", cursor: "pointer", marginBottom: 8 }}>
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
        .cai-hero-dots { background-image:radial-gradient(#e2e8f0 1px,transparent 1px); background-size:28px 28px; }
        .screen-shadow { border-radius:16px; overflow:hidden; border:1px solid #e2e8f0; box-shadow:0 24px 64px rgba(79,70,229,.12); }
        .screen-chrome { height:32px; background:#f1f5f9; border-bottom:1px solid #e2e8f0; display:flex; align-items:center; padding:0 12px; gap:6px; }
        .pwa-step { display:flex; align-items:flex-start; gap:12px; margin-bottom:12px; }
        .pwa-step-num { width:24px; height:24px; border-radius:50%; background:#ede9fe; color:#4f46e5; font-size:11px; font-weight:700; display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }
      `}</style>

      {/* ── NAV ── */}
      <header style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 40, transition: "all .3s", background: scrolled ? "rgba(255,255,255,.95)" : "#fff", backdropFilter: scrolled ? "blur(20px)" : "none", borderBottom: "1px solid #e2e8f0", boxShadow: scrolled ? "0 4px 24px rgba(0,0,0,.06)" : "none" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CaissioMarkSVG size={30} />
            <span style={{ fontSize: 20, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.03em" }}>Caissio</span>
          </div>
          <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
            {[["#demo","Essayer"],["#features","Fonctionnalités"],["#installer","Installer"],["#pricing","Tarifs"],["#faq","FAQ"]].map(([href,label]) => (
              <a key={href} href={href} className="cai-nav-link">{label}</a>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/caissio/login" style={{ fontSize: 14, color: "#475569", textDecoration: "none", fontWeight: 500 }}>Connexion</a>
            <a href="https://buy.stripe.com/7sY3cu63vgJ8bLW7i90x200" className="cai-btn-indigo" style={{ height: 38, padding: "0 20px", borderRadius: 12, fontSize: 14, fontWeight: 700, gap: 6 }}>
              7 jours gratuits →
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
              <Smartphone style={{ width: 14, height: 14 }} />
              iPad · Mac · Windows · Sans installation
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
            </div>
            <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(48px,8vw,88px)", fontWeight: 900, lineHeight: 0.9, letterSpacing: "-0.04em", color: "#0f172a", marginBottom: 32 }}>
              La caisse qui fait<br />
              <span style={{ color: "#4f46e5" }}>tout le travail.</span>
            </h1>
            <p style={{ fontSize: "clamp(17px,2vw,21px)", color: "#64748b", maxWidth: 680, margin: "0 auto 48px", lineHeight: 1.6 }}>
              Encaissez plus vite, gérez le stock en temps réel, générez des{" "}
              <strong style={{ color: "#0f172a" }}>factures légales 2026</strong>{" "}
              en 1 clic. Fonctionne sur tous vos appareils.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginBottom: 40 }}>
              <a href="https://buy.stripe.com/7sY3cu63vgJ8bLW7i90x200" className="cai-btn-indigo" style={{ height: 64, padding: "0 40px", borderRadius: 20, fontWeight: 900, fontSize: 18, gap: 12 }}>
                7 jours gratuits <ArrowRight style={{ width: 20, height: 20 }} />
              </a>
              <a href="#demo" className="cai-btn-outline" style={{ height: 64, padding: "0 40px", borderRadius: 20, fontWeight: 900, fontSize: 18, gap: 12 }}>
                <Play style={{ width: 18, height: 18 }} /> Essayer sans compte
              </a>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px 32px", fontSize: 13, color: "#94a3b8" }}>
              {["7 jours gratuits (Starter)","Aucune installation","Factures légales 2026 incluses"].map((t) => (
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
          <div style={{ textAlign: "center", maxWidth: 680, margin: "0 auto 56px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", color: "#4f46e5", fontWeight: 700, marginBottom: 16 }}>
              <Play style={{ width: 12, height: 12 }} /> Démo interactive
            </div>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(32px,4vw,48px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0f172a" }}>
              Encaissez. Voyez le stock{" "}
              <span style={{ color: "#4f46e5" }}>baisser en temps réel.</span>
            </h2>
            <p style={{ marginTop: 16, color: "#64748b", fontSize: 17 }}>
              Ajoutez des articles, encaissez, et observez le stock se mettre à jour automatiquement. Exactement comme dans la vraie caisse.
            </p>
          </div>
          <DemoPOS />
          <p style={{ textAlign: "center", marginTop: 20, fontSize: 13, color: "#94a3b8" }}>
            Démo 100% fonctionnelle · Stock géré en temps réel · Ticket de caisse complet après paiement
          </p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ background: "#fff" }}>
        {FEATURE_SECTIONS.map((f, idx) => {
          const Icon = f.icon;
          const isEven = idx % 2 === 0;

          // Mock visuel pour "Factures" (pas de screenshot dispo)
          const isFact = f.tag === "Factures légales";
          const imgBlock = isFact ? (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden", boxShadow: "0 24px 64px rgba(79,70,229,.12)" }}>
              <div style={{ background: "#4f46e5", padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 800, color: "#fff" }}>FACTURE</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,.7)" }}>FAC-2026-0042</span>
              </div>
              <div style={{ padding: "16px 20px", fontFamily: "'IBM Plex Sans',sans-serif" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f1f5f9" }}>
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 3 }}>Émetteur</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>Épicerie du Centre</div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>SIRET : 123 456 789 00012</div>
                    <div style={{ fontSize: 10, color: "#64748b" }}>N° TVA : FR12345678901</div>
                  </div>
                  <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px" }}>
                    <div style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 3 }}>Client</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}>SARL Dupont</div>
                    <div style={{ fontSize: 10, color: "#64748b", marginTop: 2 }}>contact@dupont.fr</div>
                  </div>
                </div>
                {[["Nutella 400g ×3","11,47 €","5,5%"],["Coca-Cola 33cl ×6","9,00 €","20%"],["Café expresso ×2","3,33 €","10%"]].map(([n,p,t]) => (
                  <div key={n} style={{ display: "flex", justifyContent: "space-between", fontSize: 11, padding: "5px 0", borderBottom: "1px solid #f8fafc" }}>
                    <span style={{ color: "#374151" }}>{n}</span>
                    <span style={{ display: "flex", gap: 12 }}>
                      <span style={{ color: "#94a3b8", fontSize: 10, background: "#f1f5f9", padding: "1px 6px", borderRadius: 4 }}>{t}</span>
                      <span style={{ fontWeight: 600, color: "#0f172a" }}>{p}</span>
                    </span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "2px solid #4f46e5" }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#0f172a" }}>TOTAL TTC</span>
                  <span style={{ fontSize: 13, fontWeight: 900, color: "#4f46e5" }}>23,80 €</span>
                </div>
                <div style={{ marginTop: 10, padding: "8px 10px", background: "#fef3c7", borderRadius: 8, fontSize: 9, color: "#92400e", lineHeight: 1.5 }}>
                  <strong>Mentions légales :</strong> Pénalités de retard : 3× taux légal (art. L.441-10 C.com.) · Indemnité forfaitaire 40€ (art. D.441-5) · Aucun escompte consenti
                </div>
              </div>
            </div>
          ) : (
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
                  <li key={b} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontSize: 15, color: "#0f172a", fontWeight: 500 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      <Check style={{ width: 12, height: 12, color: "#059669" }} />
                    </div>
                    {b}
                  </li>
                ))}
              </ul>
              <a href={isFact ? "/caissio/app/factures" : "/caissio/register"} className="cai-btn-indigo" style={{ height: 52, padding: "0 28px", borderRadius: 16, fontWeight: 700, fontSize: 15, gap: 8, alignSelf: "flex-start" }}>
                {isFact ? "Voir les factures" : "Essayer gratuitement"} <ArrowRight style={{ width: 16, height: 16 }} />
              </a>
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

      {/* ── INSTALLER (remplace Windows download) ── */}
      <section id="installer" style={{ padding: "96px 0", background: "#f8fafc", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 56px" }}>
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.2em", color: "#4f46e5", fontWeight: 700, marginBottom: 16 }}>Installation</div>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(32px,4vw,52px)", fontWeight: 900, letterSpacing: "-0.03em", color: "#0f172a", marginBottom: 20 }}>
              Sur votre écran d&apos;accueil{" "}
              <span style={{ color: "#4f46e5" }}>en 30 secondes.</span>
            </h2>
            <p style={{ fontSize: 17, color: "#64748b", lineHeight: 1.6 }}>
              Caissio est une application web progressive (PWA). Ajoutez-la à votre appareil comme une vraie application — aucun téléchargement ni App Store requis.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 20, maxWidth: 1020, margin: "0 auto" }}>
            {/* iPad / iPhone */}
            <div className="cai-card" style={{ padding: 32 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Smartphone style={{ width: 26, height: 26, color: "#0ea5e9" }} />
              </div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>iPad · iPhone</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>Ajoutez Caissio à votre écran d&apos;accueil depuis Safari.</div>
              {[
                "Ouvrez Safari et allez sur caissio.fr",
                "Appuyez sur le bouton Partager ↑",
                "Choisissez « Sur l'écran d'accueil »",
                "Appuyez sur « Ajouter » — c'est tout !",
              ].map((step, i) => (
                <div key={i} className="pwa-step">
                  <div className="pwa-step-num">{i + 1}</div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{step}</div>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: "10px 14px", background: "#eff6ff", borderRadius: 10, fontSize: 12, color: "#0ea5e9", fontWeight: 600 }}>
                💡 L&apos;icône Caissio apparaît sur votre bureau — lancez-la comme une vraie app.
              </div>
            </div>

            {/* Mac */}
            <div className="cai-card" style={{ padding: 32 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Apple style={{ width: 26, height: 26, color: "#16a34a" }} />
              </div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Mac (macOS)</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>Ajoutez Caissio au Dock depuis Safari ou Chrome.</div>
              {[
                "Ouvrez Safari et allez sur caissio.fr",
                "Menu Fichier → « Ajouter au Dock… »",
                "Cliquez « Ajouter »",
                "Caissio s'ouvre en plein écran comme une app native",
              ].map((step, i) => (
                <div key={i} className="pwa-step">
                  <div className="pwa-step-num">{i + 1}</div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{step}</div>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: "10px 14px", background: "#f0fdf4", borderRadius: 10, fontSize: 12, color: "#16a34a", fontWeight: 600 }}>
                💡 Compatible macOS Ventura, Sonoma et Sequoia.
              </div>
            </div>

            {/* Windows */}
            <div className="cai-card" style={{ padding: 32 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: "#fef3c7", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                <Monitor style={{ width: 26, height: 26, color: "#d97706" }} />
              </div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Windows 10 / 11</div>
              <div style={{ fontSize: 13, color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>Installez Caissio comme une app depuis Chrome ou Edge.</div>
              {[
                "Ouvrez Chrome (ou Edge) et allez sur caissio.fr",
                "Cliquez sur l'icône ⊞ dans la barre d'adresse",
                "Sélectionnez « Installer Caissio »",
                "L'app s'ouvre dans sa propre fenêtre, sans navigateur",
              ].map((step, i) => (
                <div key={i} className="pwa-step">
                  <div className="pwa-step-num">{i + 1}</div>
                  <div style={{ fontSize: 13, color: "#374151", lineHeight: 1.5 }}>{step}</div>
                </div>
              ))}
              <div style={{ marginTop: 16, padding: "10px 14px", background: "#fef3c7", borderRadius: 10, fontSize: 12, color: "#d97706", fontWeight: 600 }}>
                💡 Fonctionne hors-ligne. Vos données restent sur votre machine.
              </div>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "14px 24px", borderRadius: 16, background: "#ede9fe", border: "1px solid #c4b5fd", fontSize: 14, color: "#4f46e5", fontWeight: 600 }}>
              <Shield style={{ width: 16, height: 16 }} />
              Données sécurisées · Fonctionne hors-ligne · Aucune installation requise
              <Wifi style={{ width: 16, height: 16 }} />
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
            <p style={{ marginTop: 20, color: "#64748b", fontSize: 18 }}>
              L&apos;offre Starter inclut <strong style={{ color: "#0f172a" }}>7 jours d&apos;essai gratuits</strong> via Stripe — vous activez l&apos;essai vous-même, en toute sécurité.
            </p>
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
                  <div style={{
                    position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                    background: plan.name === "Starter" ? "#10b981" : "#fbbf24",
                    color: plan.name === "Starter" ? "#fff" : "#78350f",
                    fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em",
                    padding: "4px 16px", borderRadius: 999, whiteSpace: "nowrap",
                  }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, color: plan.highlight ? "rgba(255,255,255,.7)" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12 }}>{plan.name}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 56, fontWeight: 900, color: plan.highlight ? "#fff" : "#0f172a", letterSpacing: "-0.03em" }}>{plan.price}€</span>
                  <span style={{ color: plan.highlight ? "rgba(255,255,255,.6)" : "#94a3b8", fontSize: 16 }}>/mois</span>
                </div>
                <p style={{ color: plan.highlight ? "rgba(255,255,255,.55)" : "#94a3b8", fontSize: 13, marginBottom: 20 }}>Puis {plan.price}€/mois. Annulable à tout moment.</p>

                {/* Trial note for Starter */}
                {plan.trialNote && (
                  <div style={{ background: "#ecfdf5", border: "1px solid #6ee7b7", borderRadius: 10, padding: "10px 12px", marginBottom: 16, fontSize: 12, color: "#065f46", lineHeight: 1.5 }}>
                    <strong>Comment ça marche :</strong> Cliquez « Activer 7 jours gratuits » → entrez votre carte sur Stripe → <strong>aucun prélèvement avant le 8ème jour</strong>. Résiliez avant pour ne rien payer.
                  </div>
                )}

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

                <a
                  href={plan.stripeLink ?? "/caissio/register"}
                  style={{
                    marginTop: 28, width: "100%", height: 52, borderRadius: 16,
                    fontWeight: 800, fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    textDecoration: "none",
                    background: plan.highlight ? "#fff" : plan.name === "Starter" ? "#10b981" : "#4f46e5",
                    color: plan.highlight ? "#4f46e5" : "#fff",
                    border: "none",
                  }}
                >
                  {plan.cta} {(plan.highlight || plan.name === "Starter") && <ArrowRight style={{ width: 16, height: 16 }} />}
                </a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", marginTop: 40, fontSize: 13, color: "#94a3b8" }}>
            Essai 7 jours sur l&apos;offre Starter · Résiliation en 1 clic · Aucun prélèvement pendant l&apos;essai · TVA non incluse
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
          <p style={{ color: "rgba(255,255,255,.7)", fontSize: 19, marginBottom: 48, maxWidth: 520, margin: "0 auto 48px" }}>
            7 jours offerts sur le plan Starter. Aucun prélèvement avant le 8ème jour.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
            <a href="https://buy.stripe.com/7sY3cu63vgJ8bLW7i90x200" style={{ height: 64, padding: "0 48px", borderRadius: 20, fontWeight: 900, fontSize: 20, display: "inline-flex", alignItems: "center", gap: 12, background: "#fff", color: "#4f46e5", textDecoration: "none" }}>
              Activer 7 jours gratuits <ArrowRight style={{ width: 20, height: 20 }} />
            </a>
            <a href="#demo" style={{ height: 64, padding: "0 40px", borderRadius: 20, fontWeight: 900, fontSize: 20, display: "inline-flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,.15)", color: "#fff", textDecoration: "none", border: "1px solid rgba(255,255,255,.3)" }}>
              <Play style={{ width: 18, height: 18 }} /> Essayer d&apos;abord
            </a>
          </div>
          <p style={{ marginTop: 24, fontSize: 13, color: "rgba(255,255,255,.5)" }}>Sans engagement · Résiliation en 1 clic · Support 7j/7</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "40px 0", background: "#0f172a" }}>
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
