"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import {
  ArrowRight, Check, Zap, Package, FileSpreadsheet, BarChart3,
  Users, ShieldCheck, ScanBarcode, Printer, DoorOpen, Scale,
  Bluetooth, Star, Plus, Minus, Receipt,
  Download, Monitor, Cpu, Wifi, Play,
  Clock, Shield, Sparkles, ChevronDown,
} from "lucide-react";

/* ─── DESIGN TOKENS ─────────────────────────────────── */
const C = {
  bg:       "#000000",
  surface:  "#0A0A0A",
  elevated: "#1A1A1A",
  active:   "#27272A",
  primary:  "#FF4400",
  primaryH: "#FF5E22",
  text:     "#FFFFFF",
  muted:    "#A1A1AA",
  border:   "#27272A",
  success:  "#10B981",
};
const F = {
  head: "'Outfit', sans-serif",
  body: "'IBM Plex Sans', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

/* ─── DATA ─────────────────────────────────────────── */
const FEATURES = [
  { Icon: Zap,             t: "Encaissement éclair",   d: "Scan, panier, paiement, ticket en 3 gestes. Même à l'heure de pointe." },
  { Icon: Package,         t: "Catalogue intelligent", d: "Prix d'achat, vente, marge auto, TVA, stock minimum alerté." },
  { Icon: FileSpreadsheet, t: "Import Excel/CSV",      d: "Glissez votre catalogue. Caissio détecte les colonnes, importe en masse." },
  { Icon: BarChart3,       t: "Dashboard temps réel",  d: "CA, marge, panier moyen, top ventes — tout instantanément." },
  { Icon: Users,           t: "Fidélité client",       d: "Base clients intégrée avec points automatiques à chaque achat." },
  { Icon: ShieldCheck,     t: "PIN + lock auto",       d: "Verrouillage 6 chiffres après inactivité. Vos données, protégées." },
];

const HARDWARE = [
  { Icon: ScanBarcode, label: "Scanner USB",        note: "WebHID" },
  { Icon: Printer,     label: "Imprimante ticket",  note: "WebUSB" },
  { Icon: DoorOpen,    label: "Tiroir caisse",      note: "ESC/POS" },
  { Icon: Scale,       label: "Balance",            note: "WebSerial" },
  { Icon: Bluetooth,   label: "Scanner Bluetooth",  note: "WebBluetooth" },
];

const PLAN_FEATURES = [
  "Utilisateurs illimités",
  "Catalogue de produits illimité",
  "Import Excel / CSV en masse",
  "Dashboard & rapports avancés",
  "Fidélité client intégrée",
  "Matériel reconnu automatiquement",
  "Ticket PDF écologique",
  "Support prioritaire par email",
  "Mises à jour incluses à vie",
  "Aucun frais caché",
];

const FAQ = [
  { q: "Combien de temps dure l'essai gratuit ?",        a: "7 jours, sans carte bancaire. Accès à toutes les fonctionnalités dès le premier jour." },
  { q: "Sur quel matériel ça fonctionne ?",              a: "Windows 10 et 11 via l'application de bureau. La version web tourne aussi sur tout navigateur moderne." },
  { q: "Comment fonctionne la détection du matériel ?",  a: "Un bouton « Audit complet » dans les Périphériques détecte vos appareils connectés grâce aux API natives. Aucun pilote, aucune installation." },
  { q: "Puis-je importer mon catalogue existant ?",      a: "Oui. Glissez votre fichier Excel ou CSV, prévisualisez, validez. Les catégories sont créées automatiquement." },
  { q: "Mes données sont-elles sécurisées ?",            a: "Authentification JWT, PIN 6 chiffres, verrouillage automatique, isolation complète. Vos données n'appartiennent qu'à vous." },
  { q: "Puis-je résilier à tout moment ?",               a: "Oui. Sans engagement, sans préavis, sans pénalité. Résiliez en un clic depuis votre espace." },
];

const TESTIMONIALS = [
  { q: "On encaisse deux fois plus vite. Les clients adorent.", a: "Sophie L.", role: "Épicerie fine, Lyon" },
  { q: "L'import de mes 800 références s'est fait en 2 minutes.", a: "Karim B.", role: "Boulangerie, Marseille" },
  { q: "Enfin une caisse claire, pas un truc d'usine à gaz.", a: "Marie D.", role: "Snack-Tabac, Bordeaux" },
];

const DEMO_PRODUCTS = [
  { id: "1", name: "Croissant",       price: 1.20, emoji: "🥐" },
  { id: "2", name: "Pain campagne",   price: 3.50, emoji: "🥖" },
  { id: "3", name: "Pain chocolat",   price: 1.40, emoji: "🍫" },
  { id: "4", name: "Café expresso",   price: 2.00, emoji: "☕" },
  { id: "5", name: "Eau plate 50cl",  price: 1.00, emoji: "💧" },
  { id: "6", name: "Coca-Cola 33cl",  price: 1.80, emoji: "🥤" },
  { id: "7", name: "Salade mixte",    price: 4.50, emoji: "🥗" },
  { id: "8", name: "Sandwich jambon", price: 3.90, emoji: "🥪" },
];

const STATS = [
  { value: "3 sec", label: "par transaction" },
  { value: "2 min", label: "pour démarrer" },
  { value: "800",   label: "produits importés" },
  { value: "0",     label: "driver à installer" },
];

/* ─── LOGO MARK ─────────────────────────────────────── */
function CaissioMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <rect width="32" height="32" rx="8" fill={C.primary} />
      <rect x="7" y="10" width="18" height="3" rx="1.5" fill="white" />
      <rect x="7" y="16" width="12" height="3" rx="1.5" fill="white" />
      <rect x="7" y="22" width="8"  height="3" rx="1.5" fill="white" />
    </svg>
  );
}

/* ─── FAQ ITEM ───────────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 16 }}
      className="overflow-hidden"
    >
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
        data-testid="faq-trigger"
      >
        <span style={{ fontFamily: F.body, fontWeight: 600, fontSize: 16, color: C.text }}>{q}</span>
        <ChevronDown
          size={18}
          style={{ color: C.muted, flexShrink: 0, transition: "transform 0.2s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      {open && (
        <div style={{ padding: "0 24px 20px", fontFamily: F.body, fontSize: 15, color: C.muted, lineHeight: 1.7 }}>
          {a}
        </div>
      )}
    </div>
  );
}

/* ─── TOAST (state-based) ────────────────────────────── */
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div style={{
      position: "fixed", bottom: 32, right: 32, zIndex: 9999,
      background: C.success, color: "#fff",
      fontFamily: F.body, fontWeight: 700, fontSize: 15,
      padding: "14px 24px", borderRadius: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    }}>
      ✓ {msg}
    </div>
  );
}

/* ─── PAGE ───────────────────────────────────────────── */
export default function CaissioPage() {
  const [cart, setCart] = useState<{ id: string; name: string; price: number; emoji: string; qty: number }[]>([]);
  const [paid, setPaid] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  const total = useMemo(() => cart.reduce((s, i) => s + i.price * i.qty, 0), [cart]);

  const addToCart = (p: typeof DEMO_PRODUCTS[0]) => {
    setPaid(false);
    setCart((c) => {
      const found = c.find((i) => i.id === p.id);
      if (found) return c.map((i) => i.id === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...c, { ...p, qty: 1 }];
    });
  };

  const removeOne = (id: string) =>
    setCart((c) => c.map((i) => i.id === id ? { ...i, qty: i.qty - 1 } : i).filter((i) => i.qty > 0));

  const checkout = () => {
    if (cart.length === 0) return;
    setPaid(true);
    setToast(`Vente démo encaissée : ${total.toFixed(2)} €`);
    setTimeout(() => { setCart([]); setPaid(false); }, 2500);
  };

  const HERO_BG = "https://images.unsplash.com/photo-1770795263316-f302a878ee64?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbWluaW1hbGlzdCUyMGJsYWNrJTIwdGV4dHVyZSUyMGJhY2tncm91bmR8ZW58MHx8fHwxNzc4NzAzMTA1fDA&ixlib=rb-4.1.0&q=85";

  return (
    <div style={{ background: C.bg, color: C.text, minHeight: "100vh", overflowX: "hidden", fontFamily: F.body }}>

      {/* ── FONTS ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=IBM+Plex+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { display: none; }
        html { scroll-behavior: smooth; }
        @keyframes glow-pulse { 0%,100%{opacity:.3} 50%{opacity:.7} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
      `}</style>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* ── NAV ── */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? "rgba(0,0,0,0.7)" : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.08)" : "1px solid transparent",
        transition: "all 0.3s",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/caissio" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }} data-testid="landing-logo">
            <CaissioMark size={30} />
            <span style={{ fontFamily: F.head, fontWeight: 800, fontSize: 20, color: C.text, letterSpacing: "-0.02em" }}>Caissio</span>
          </Link>
          <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
            {[["#demo","Essayer"],["#features","Fonctionnalités"],["#pricing","Tarifs"],["#faq","FAQ"]].map(([h,l]) => (
              <a key={h} href={h} style={{ fontFamily: F.body, fontSize: 14, fontWeight: 500, color: C.muted, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
                {l}
              </a>
            ))}
          </nav>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/login" style={{ fontFamily: F.body, fontSize: 14, fontWeight: 500, color: C.muted, textDecoration: "none", transition: "color 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.color = C.text)}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
              Connexion
            </Link>
            <Link href="/register" data-testid="nav-register-cta"
              style={{ fontFamily: F.body, fontWeight: 700, fontSize: 14, color: "#fff", background: C.primary, padding: "8px 20px", borderRadius: 8, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = C.primaryH)}
              onMouseLeave={e => (e.currentTarget.style.background = C.primary)}>
              Essai 7 jours gratuit
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section style={{
        position: "relative", paddingTop: 112, paddingBottom: 96,
        backgroundImage: `url(${HERO_BG})`,
        backgroundSize: "cover", backgroundPosition: "center",
        overflow: "hidden",
      }}>
        {/* Dark overlay */}
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.72)" }} />
        {/* Vermilion glow */}
        <div style={{ position: "absolute", top: -100, left: "50%", transform: "translateX(-50%)", width: 700, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,68,0,0.25), transparent 70%)", filter: "blur(60px)", animation: "glow-pulse 4s ease-in-out infinite" }} />

        <div style={{ position: "relative", maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ maxWidth: 900, margin: "0 auto", textAlign: "center" }}>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", background: "rgba(255,68,0,0.12)", border: `1px solid rgba(255,68,0,0.3)`, borderRadius: 999, marginBottom: 32 }}>
              <Monitor size={14} style={{ color: C.primary }} />
              <span style={{ fontFamily: F.body, fontSize: 12, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.18em" }}>
                Disponible sur Windows 10 &amp; 11
              </span>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: C.success, display: "inline-block" }} />
            </div>

            <h1 style={{ fontFamily: F.head, fontSize: "clamp(52px,8vw,96px)", fontWeight: 900, lineHeight: 0.92, letterSpacing: "-0.03em", color: C.text, marginBottom: 28 }}>
              La caisse qui fait<br />
              <span style={{ color: C.primary }}>tout le travail.</span>
            </h1>

            <p style={{ fontFamily: F.body, fontSize: 20, color: C.muted, maxWidth: 640, margin: "0 auto 40px", lineHeight: 1.65 }}>
              Encaissez plus vite, gérez votre stock en temps réel, fidélisez vos clients.{" "}
              <strong style={{ color: C.text }}>Sans installation, sans formation, sans prise de tête.</strong>
            </p>

            {/* CTAs */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center", marginBottom: 32 }}>
              <Link href="/register" data-testid="hero-cta-trial"
                style={{ fontFamily: F.head, fontWeight: 800, fontSize: 18, color: "#fff", background: C.primary, height: 64, padding: "0 40px", borderRadius: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 12, transition: "background 0.2s, transform 0.1s" }}
                onMouseEnter={e => (e.currentTarget.style.background = C.primaryH)}
                onMouseLeave={e => (e.currentTarget.style.background = C.primary)}>
                Commencer gratuitement <ArrowRight size={20} />
              </Link>
              <a href="#windows"
                style={{ fontFamily: F.head, fontWeight: 800, fontSize: 18, color: "#fff", background: C.elevated, border: `1px solid ${C.border}`, height: 64, padding: "0 40px", borderRadius: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 12, transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = C.active)}
                onMouseLeave={e => (e.currentTarget.style.background = C.elevated)}>
                <Download size={20} /> Télécharger Windows
              </a>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px 32px" }}>
              {["7 jours gratuits, sans carte", "Configuration en 2 minutes", "Résiliation sans engagement"].map(t => (
                <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: F.body, fontSize: 14, color: C.muted }}>
                  <Check size={15} style={{ color: C.success }} /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div style={{ marginTop: 80, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, maxWidth: 800, marginLeft: "auto", marginRight: "auto" }}>
            {STATS.map(s => (
              <div key={s.label} style={{ background: "rgba(10,10,10,0.8)", border: `1px solid ${C.border}`, borderRadius: 16, padding: "20px 16px", textAlign: "center", backdropFilter: "blur(12px)" }}>
                <div style={{ fontFamily: F.head, fontSize: 36, fontWeight: 900, color: C.primary, letterSpacing: "-0.02em", lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontFamily: F.body, fontSize: 11, color: C.muted, textTransform: "uppercase", letterSpacing: "0.18em", marginTop: 6, fontWeight: 600 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE DEMO ── */}
      <section id="demo" style={{ padding: "96px 0", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 600, margin: "0 auto 56px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: 16 }}>
              <Play size={12} style={{ fill: C.primary }} /> Essayez en direct
            </div>
            <h2 style={{ fontFamily: F.head, fontSize: "clamp(32px,4vw,52px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, color: C.text }}>
              Encaissez votre première vente{" "}
              <span style={{ color: C.primary }}>maintenant.</span>
            </h2>
            <p style={{ marginTop: 16, fontFamily: F.body, fontSize: 18, color: C.muted }}>
              Touchez les produits, ajustez les quantités, validez. Exactement comme dans la vraie caisse.
            </p>
          </div>

          {/* POS Demo */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 1, maxWidth: 1100, margin: "0 auto", background: C.border, border: `1px solid ${C.border}`, borderRadius: 20, overflow: "hidden" }}
            data-testid="demo-grid">
            {/* Products */}
            <div style={{ background: C.surface, padding: 24 }}>
              <div style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.18em", marginBottom: 16 }}>
                Choisissez un produit
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12 }}>
                {DEMO_PRODUCTS.map((p) => (
                  <button key={p.id} onClick={() => addToCart(p)} data-testid={`demo-product-${p.id}`}
                    style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 12, padding: 12, cursor: "pointer", textAlign: "left", transition: "background 0.15s, border-color 0.15s" }}
                    onMouseEnter={e => { e.currentTarget.style.background = C.active; e.currentTarget.style.borderColor = C.primary; }}
                    onMouseLeave={e => { e.currentTarget.style.background = C.elevated; e.currentTarget.style.borderColor = C.border; }}>
                    <div style={{ aspectRatio: "1", background: C.active, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, marginBottom: 8 }}>
                      {p.emoji}
                    </div>
                    <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                    <div style={{ fontFamily: F.head, fontSize: 15, fontWeight: 700, color: C.primary }}>{p.price.toFixed(2)} €</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cart */}
            <div style={{ background: C.surface, display: "flex", flexDirection: "column" }}>
              <div style={{ height: 56, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderBottom: `1px solid ${C.border}` }}>
                <span style={{ fontFamily: F.head, fontWeight: 700, fontSize: 16, color: C.text }}>Ticket démo</span>
                {cart.length > 0 && (
                  <button onClick={() => setCart([])} style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.15em", background: "none", border: "none", cursor: "pointer", transition: "color 0.2s" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#EF4444")}
                    onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
                    Vider
                  </button>
                )}
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: 12, display: "flex", flexDirection: "column", gap: 8 }} data-testid="demo-cart">
                {cart.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 48, textAlign: "center", minHeight: 200, gap: 12 }}>
                    <Receipt size={36} style={{ color: C.active }} />
                    <span style={{ fontFamily: F.body, fontSize: 14, color: "#3F3F46" }}>Touchez un produit pour commencer.</span>
                  </div>
                ) : cart.map((item) => (
                  <div key={item.id} style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 12px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 24 }}>{item.emoji}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 11, color: C.muted }}>{item.price.toFixed(2)} € × {item.qty}</div>
                    </div>
                    <button onClick={() => removeOne(item.id)} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: `1px solid ${C.border}`, cursor: "pointer", color: C.muted, transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.active; e.currentTarget.style.color = C.text; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.muted; }}>
                      <Minus size={12} />
                    </button>
                    <span style={{ fontFamily: F.mono, fontSize: 13, width: 20, textAlign: "center", color: C.text }}>{item.qty}</span>
                    <button onClick={() => addToCart(item)} style={{ width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: `1px solid ${C.border}`, cursor: "pointer", color: C.muted, transition: "all 0.15s" }}
                      onMouseEnter={e => { e.currentTarget.style.background = C.active; e.currentTarget.style.color = C.text; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = C.muted; }}>
                      <Plus size={12} />
                    </button>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: `1px solid ${C.border}`, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.muted, textTransform: "uppercase", letterSpacing: "0.18em" }}>Total</span>
                  <span style={{ fontFamily: F.head, fontSize: 36, fontWeight: 900, color: C.primary, letterSpacing: "-0.03em" }}>{total.toFixed(2)} €</span>
                </div>
                <button onClick={checkout} disabled={cart.length === 0} data-testid="demo-checkout"
                  style={{ width: "100%", height: 56, borderRadius: 10, border: "none", cursor: cart.length === 0 ? "not-allowed" : "pointer", fontFamily: F.head, fontWeight: 800, fontSize: 16, color: "#fff", background: paid ? C.success : C.primary, opacity: cart.length === 0 ? 0.3 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}>
                  {paid ? <><Check size={18} /> Encaissé !</> : "Encaisser la démo"}
                </button>
                <p style={{ fontFamily: F.body, fontSize: 12, color: "#3F3F46", textAlign: "center" }}>
                  👉 <Link href="/register" style={{ color: C.primary, textDecoration: "none", fontWeight: 600 }}>Créer mon compte</Link> pour aller plus loin
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WINDOWS DOWNLOAD ── */}
      <section id="windows" style={{ padding: "96px 0", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 24, padding: "64px 64px", display: "grid", gridTemplateColumns: "1fr auto", gap: 64, alignItems: "center", position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", right: -80, top: -80, width: 320, height: 320, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,68,0,0.15), transparent 70%)`, filter: "blur(60px)" }} />
            <div style={{ position: "relative" }}>
              {/* Windows badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
                <div style={{ width: 36, height: 36, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
                  {["#f25022","#7fba00","#00a4ef","#ffb900"].map(c => (
                    <div key={c} style={{ borderRadius: 2, background: c }} />
                  ))}
                </div>
                <span style={{ fontFamily: F.body, fontWeight: 700, fontSize: 16, color: C.text }}>Windows 10 / 11</span>
              </div>

              <h2 style={{ fontFamily: F.head, fontSize: "clamp(32px,4vw,56px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, color: C.text, marginBottom: 24 }}>
                Votre caisse,<br /><span style={{ color: C.primary }}>en local sur votre PC.</span>
              </h2>
              <p style={{ fontFamily: F.body, fontSize: 18, color: C.muted, marginBottom: 32, maxWidth: 480, lineHeight: 1.65 }}>
                Téléchargez l'application de bureau. Fonctionne même sans connexion internet. Vos données restent sur votre machine.
              </p>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 40 }}>
                <a href="/download/Caissio-Setup.exe"
                  style={{ fontFamily: F.head, fontWeight: 800, fontSize: 18, color: "#fff", background: C.primary, height: 64, padding: "0 40px", borderRadius: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 12, transition: "background 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.background = C.primaryH)}
                  onMouseLeave={e => (e.currentTarget.style.background = C.primary)}>
                  <Download size={20} /> Télécharger (.exe)
                </a>
                <Link href="/register"
                  style={{ fontFamily: F.head, fontWeight: 700, fontSize: 18, color: C.muted, border: `1px solid ${C.border}`, height: 64, padding: "0 32px", borderRadius: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 8, transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = C.text)}
                  onMouseLeave={e => (e.currentTarget.style.color = C.muted)}>
                  Ou version web →
                </Link>
              </div>

              <div style={{ display: "flex", gap: 24 }}>
                {[{ I: Shield, t: "Données locales" }, { I: Wifi, t: "Hors-ligne" }, { I: Cpu, t: "Ultra-léger" }].map(({ I, t }) => (
                  <div key={t} style={{ textAlign: "center" }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: "rgba(255,68,0,0.1)", border: `1px solid rgba(255,68,0,0.2)`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px" }}>
                      <I size={18} style={{ color: C.primary }} />
                    </div>
                    <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.muted }}>{t}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mini mockup */}
            <div style={{ width: 260, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: "hidden", boxShadow: `0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,68,0,0.15)` }}>
              <div style={{ height: 32, display: "flex", alignItems: "center", padding: "0 12px", gap: 6, background: C.elevated, borderBottom: `1px solid ${C.border}` }}>
                {["#EF4444","#F59E0B","#10B981"].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c, opacity: 0.7 }} />)}
                <span style={{ flex: 1, textAlign: "center", fontFamily: F.mono, fontSize: 10, color: "#3F3F46" }}>Caissio — Épicerie du Marché</span>
              </div>
              <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
                {[["Tomate 500g","1.20 €"],["Eau Evian 1.5L","0.95 €"],["Pain complet","2.80 €"]].map(([item, price]) => (
                  <div key={item} style={{ display: "flex", justifyContent: "space-between", background: C.elevated, borderRadius: 8, padding: "8px 12px" }}>
                    <span style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>{item}</span>
                    <span style={{ fontFamily: F.mono, fontSize: 12, fontWeight: 700, color: C.primary }}>{price}</span>
                  </div>
                ))}
                <div style={{ height: 1, background: C.border, margin: "4px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", padding: "0 4px" }}>
                  <span style={{ fontFamily: F.body, fontSize: 11, color: "#3F3F46" }}>TOTAL</span>
                  <span style={{ fontFamily: F.head, fontSize: 20, fontWeight: 900, color: C.primary }}>4.95 €</span>
                </div>
                <div style={{ height: 36, borderRadius: 8, background: C.primary, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.head, fontWeight: 800, fontSize: 13, color: "#fff" }}>
                  ✓ Encaisser
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: "96px 0", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ maxWidth: 600, marginBottom: 64 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: 16 }}>
              <Sparkles size={13} /> Fonctionnalités
            </div>
            <h2 style={{ fontFamily: F.head, fontSize: "clamp(32px,4vw,56px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, color: C.text }}>
              Tout ce qu'il faut.<br /><span style={{ color: C.primary }}>Rien de trop.</span>
            </h2>
            <p style={{ marginTop: 20, fontFamily: F.body, fontSize: 18, color: C.muted }}>Un logiciel pensé pour les commerçants, pas pour les ingénieurs.</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {FEATURES.map(({ Icon, t, d }) => (
              <div key={t} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28, transition: "border-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = C.primary)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,68,0,0.1)", border: "1px solid rgba(255,68,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
                  <Icon size={22} style={{ color: C.primary }} />
                </div>
                <div style={{ fontFamily: F.head, fontSize: 18, fontWeight: 700, color: C.text, marginBottom: 8 }}>{t}</div>
                <div style={{ fontFamily: F.body, fontSize: 14, color: C.muted, lineHeight: 1.65 }}>{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HARDWARE ── */}
      <section style={{ padding: "80px 0", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 580, margin: "0 auto 56px" }}>
            <div style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: 16 }}>Matériel compatible</div>
            <h2 style={{ fontFamily: F.head, fontSize: "clamp(28px,3.5vw,48px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, color: C.text }}>
              Plug &amp; Play.{" "}<span style={{ color: C.primary }}>Zéro pilote.</span>
            </h2>
            <p style={{ marginTop: 16, fontFamily: F.body, fontSize: 17, color: C.muted }}>Branchez. Cliquez sur <strong style={{ color: C.text }}>Audit complet</strong>. Tout est trouvé.</p>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, maxWidth: 800, margin: "0 auto" }}>
            {HARDWARE.map(({ Icon, label, note }) => (
              <div key={label} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, textAlign: "center", transition: "border-color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = C.primary)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(255,68,0,0.1)", border: "1px solid rgba(255,68,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                  <Icon size={22} style={{ color: C.primary }} />
                </div>
                <div style={{ fontFamily: F.body, fontSize: 13, fontWeight: 600, color: C.muted }}>{label}</div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: "#3F3F46", marginTop: 4, textTransform: "uppercase", letterSpacing: "0.12em" }}>{note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "96px 0", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: 16 }}>Avis clients</div>
            <h2 style={{ fontFamily: F.head, fontSize: "clamp(28px,3.5vw,48px)", fontWeight: 900, letterSpacing: "-0.03em", color: C.text }}>
              Des commerçants qui{" "}<span style={{ color: C.primary }}>dorment mieux.</span>
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {TESTIMONIALS.map((t, i) => (
              <div key={i} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 28 }}>
                <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
                  {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={14} style={{ color: "#F59E0B", fill: "#F59E0B" }} />)}
                </div>
                <p style={{ fontFamily: F.body, fontSize: 16, fontWeight: 500, color: C.muted, lineHeight: 1.65 }}>« {t.q} »</p>
                <div style={{ marginTop: 20, paddingTop: 20, borderTop: `1px solid ${C.border}` }}>
                  <div style={{ fontFamily: F.body, fontSize: 14, fontWeight: 700, color: C.text }}>{t.a}</div>
                  <div style={{ fontFamily: F.body, fontSize: 12, color: "#3F3F46", marginTop: 2 }}>{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: "96px 0", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 64px" }}>
            <div style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: 16 }}>Tarif</div>
            <h2 style={{ fontFamily: F.head, fontSize: "clamp(32px,4vw,60px)", fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1.05, color: C.text }}>
              Un seul prix.{" "}<span style={{ color: C.primary }}>Tout inclus.</span>
            </h2>
            <p style={{ marginTop: 20, fontFamily: F.body, fontSize: 18, color: C.muted }}>7 jours d'essai gratuit. Résiliez quand vous voulez.</p>
          </div>

          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div data-testid="pricing-pro"
              style={{ background: C.surface, border: `1px solid ${C.primary}`, borderRadius: 24, padding: 40, position: "relative", overflow: "hidden", boxShadow: `0 0 80px rgba(255,68,0,0.12)` }}>
              <div style={{ position: "absolute", top: -60, right: -60, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,68,0,0.15), transparent 70%)`, filter: "blur(40px)" }} />

              {/* Badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: 999, padding: "5px 14px", marginBottom: 28 }}>
                <Clock size={13} style={{ color: C.success }} />
                <span style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.success, textTransform: "uppercase", letterSpacing: "0.15em" }}>7 jours gratuits — sans carte</span>
              </div>

              {/* Price */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
                <span style={{ fontFamily: F.head, fontSize: 80, fontWeight: 900, color: C.text, lineHeight: 1, letterSpacing: "-0.04em" }}>19€</span>
                <span style={{ fontFamily: F.body, fontSize: 20, color: C.muted }}>/mois</span>
              </div>
              <p style={{ fontFamily: F.body, fontSize: 16, color: C.muted, marginBottom: 36 }}>Puis 19€/mois. Annulable à tout moment.</p>

              {/* Features */}
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 12, marginBottom: 36 }}>
                {PLAN_FEATURES.map(f => (
                  <li key={f} style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: F.body, fontSize: 15, color: C.muted }}>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Check size={11} style={{ color: C.success }} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link href="/register" data-testid="pricing-cta-pro"
                style={{ fontFamily: F.head, fontWeight: 900, fontSize: 18, color: "#fff", background: C.primary, height: 64, borderRadius: 12, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, transition: "background 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.background = C.primaryH)}
                onMouseLeave={e => (e.currentTarget.style.background = C.primary)}>
                Démarrer mon essai gratuit <ArrowRight size={20} />
              </Link>
              <p style={{ textAlign: "center", fontFamily: F.body, fontSize: 13, color: "#3F3F46", marginTop: 12 }}>Aucune carte requise. Aucun engagement.</p>
            </div>

            {/* Windows row */}
            <div style={{ marginTop: 16, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 32, height: 32, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, flexShrink: 0 }}>
                {["#f25022","#7fba00","#00a4ef","#ffb900"].map(c => <div key={c} style={{ borderRadius: 1, background: c }} />)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: F.body, fontSize: 14, fontWeight: 700, color: C.text }}>Application Windows</div>
                <div style={{ fontFamily: F.body, fontSize: 12, color: C.muted }}>Fonctionne hors-ligne · Données locales</div>
              </div>
              <a href="/download/Caissio-Setup.exe"
                style={{ fontFamily: F.body, fontWeight: 700, fontSize: 14, color: "#fff", background: C.primary, padding: "8px 16px", borderRadius: 8, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6, transition: "background 0.2s", flexShrink: 0 }}
                onMouseEnter={e => (e.currentTarget.style.background = C.primaryH)}
                onMouseLeave={e => (e.currentTarget.style.background = C.primary)}>
                <Download size={14} /> .exe
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" style={{ padding: "96px 0", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div style={{ fontFamily: F.body, fontSize: 11, fontWeight: 700, color: C.primary, textTransform: "uppercase", letterSpacing: "0.22em", marginBottom: 16 }}>FAQ</div>
            <h2 style={{ fontFamily: F.head, fontSize: "clamp(28px,3.5vw,48px)", fontWeight: 900, letterSpacing: "-0.03em", color: C.text }}>Questions fréquentes</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {FAQ.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: "120px 0", borderTop: `1px solid ${C.border}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 400, borderRadius: "50%", background: `radial-gradient(circle, rgba(255,68,0,0.2), transparent 70%)`, filter: "blur(80px)" }} />
        <div style={{ position: "relative", maxWidth: 860, margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <h2 style={{ fontFamily: F.head, fontSize: "clamp(40px,7vw,88px)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95, color: C.text, marginBottom: 28 }}>
            Lancez votre caisse{" "}<span style={{ color: C.primary }}>en 2 minutes</span>.
          </h2>
          <p style={{ fontFamily: F.body, fontSize: 18, color: C.muted, marginBottom: 48, maxWidth: 440, margin: "0 auto 48px" }}>
            Aucune carte bancaire. Aucun risque. 7 jours pour tomber amoureux du logiciel.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
            <Link href="/register" data-testid="footer-cta-trial"
              style={{ fontFamily: F.head, fontWeight: 900, fontSize: 20, color: "#fff", background: C.primary, height: 64, padding: "0 48px", borderRadius: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 12, transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = C.primaryH)}
              onMouseLeave={e => (e.currentTarget.style.background = C.primary)}>
              Commencer gratuitement <ArrowRight size={22} />
            </Link>
            <a href="/download/Caissio-Setup.exe"
              style={{ fontFamily: F.head, fontWeight: 900, fontSize: 20, color: C.text, background: C.elevated, border: `1px solid ${C.border}`, height: 64, padding: "0 40px", borderRadius: 12, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 12, transition: "background 0.2s" }}
              onMouseEnter={e => (e.currentTarget.style.background = C.active)}
              onMouseLeave={e => (e.currentTarget.style.background = C.elevated)}>
              <Download size={22} /> Télécharger Windows
            </a>
          </div>
          <p style={{ marginTop: 20, fontFamily: F.body, fontSize: 13, color: "#3F3F46" }}>Sans engagement · Résiliation en 1 clic · Support 7j/7</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ padding: "40px 0", borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <CaissioMark size={26} />
            <span style={{ fontFamily: F.head, fontWeight: 800, fontSize: 16, color: C.text }}>Caissio</span>
            <span style={{ fontFamily: F.body, fontSize: 13, color: "#3F3F46" }}>© 2026</span>
          </div>
          <div style={{ fontFamily: F.body, fontSize: 11, color: "#3F3F46", textTransform: "uppercase", letterSpacing: "0.2em" }}>La caisse intelligente pour les commerces</div>
          <div style={{ display: "flex", gap: 24 }}>
            {[["#","CGU"],["#","Confidentialité"],["mailto:contact@caissio.fr","Contact"]].map(([h,l]) => (
              <a key={l} href={h} style={{ fontFamily: F.body, fontSize: 13, color: "#3F3F46", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = C.muted)}
                onMouseLeave={e => (e.currentTarget.style.color = "#3F3F46")}>
                {l}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
