"use client";

import Link from "next/link";
import { useState, useMemo, useEffect } from "react";
import {
  ArrowRight, Check, Zap, Package, FileSpreadsheet, BarChart3,
  Users, ShieldCheck, ScanBarcode, Printer, DoorOpen, Scale,
  Bluetooth, Star, Trash2, Plus, Minus, Receipt,
  Download, Monitor, Cpu, Wifi, ChevronDown, Play,
  TrendingUp, Clock, Shield, Sparkles,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── DATA ─────────────────────────────────────────── */

const FEATURES = [
  { Icon: Zap,            t: "Encaissement éclair",     d: "Scan, panier, paiement, ticket en 3 gestes. Même à l'heure de pointe." },
  { Icon: Package,        t: "Catalogue intelligent",   d: "Prix d'achat, vente, marge auto, TVA, stock minimum alerté." },
  { Icon: FileSpreadsheet,t: "Import Excel/CSV",        d: "Glissez votre catalogue. Caissio détecte les colonnes, importe en masse." },
  { Icon: BarChart3,      t: "Dashboard temps réel",    d: "CA, marge, panier moyen, top ventes — tout instantanément." },
  { Icon: Users,          t: "Fidélité client",         d: "Base clients intégrée avec points automatiques à chaque achat." },
  { Icon: ShieldCheck,    t: "PIN + lock auto",         d: "Verrouillage 6 chiffres après inactivité. Vos données, protégées." },
];

const HARDWARE = [
  { Icon: ScanBarcode, label: "Scanner USB",         note: "WebHID" },
  { Icon: Printer,     label: "Imprimante ticket",   note: "WebUSB" },
  { Icon: DoorOpen,    label: "Tiroir caisse",       note: "ESC/POS" },
  { Icon: Scale,       label: "Balance",             note: "WebSerial" },
  { Icon: Bluetooth,   label: "Scanner Bluetooth",   note: "WebBluetooth" },
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
  { q: "Comment fonctionne la détection du matériel ?",  a: "Un bouton « Audit complet » détecte vos appareils connectés grâce aux API natives. Aucun pilote, aucune installation." },
  { q: "Puis-je importer mon catalogue existant ?",       a: "Oui. Glissez votre fichier Excel ou CSV, prévisualisez, validez. Les catégories sont créées automatiquement." },
  { q: "Mes données sont-elles sécurisées ?",            a: "Authentification JWT, PIN 6 chiffres, verrouillage automatique, isolation complète. Vos données n'appartiennent qu'à vous." },
  { q: "Puis-je résilier à tout moment ?",               a: "Oui. Sans engagement, sans préavis, sans pénalité. Résiliez en un clic depuis votre espace." },
];

const TESTIMONIALS = [
  { q: "On encaisse deux fois plus vite. Les clients adorent.",          a: "Sophie L.",  role: "Épicerie fine, Lyon" },
  { q: "L'import de mes 800 références s'est fait en 2 minutes.",       a: "Karim B.",   role: "Boulangerie, Marseille" },
  { q: "Enfin une caisse claire, pas un truc d'usine à gaz.",           a: "Marie D.",   role: "Snack-Tabac, Bordeaux" },
];

const DEMO_PRODUCTS = [
  { id: "1", name: "Croissant",        price: 1.20, emoji: "🥐" },
  { id: "2", name: "Pain de campagne", price: 3.50, emoji: "🥖" },
  { id: "3", name: "Pain au chocolat", price: 1.40, emoji: "🍫" },
  { id: "4", name: "Café expresso",    price: 2.00, emoji: "☕" },
  { id: "5", name: "Eau plate 50cl",   price: 1.00, emoji: "💧" },
  { id: "6", name: "Coca-Cola 33cl",   price: 1.80, emoji: "🥤" },
  { id: "7", name: "Salade mixte",     price: 4.50, emoji: "🥗" },
  { id: "8", name: "Sandwich jambon",  price: 3.90, emoji: "🥪" },
];

const STATS = [
  { value: "3 sec",  label: "par transaction" },
  { value: "2 min",  label: "pour démarrer" },
  { value: "800",    label: "produits importés" },
  { value: "0",      label: "driver à installer" },
];

type CartItem = { id: string; name: string; price: number; emoji: string; qty: number };

/* ─── FAQ ACCORDION ─────────────────────────────────── */
function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl px-5 overflow-hidden"
      style={{ background: "rgba(30,41,59,.4)", border: "1px solid rgba(148,163,184,.08)" }}
    >
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left text-white py-5 font-semibold text-base gap-4"
      >
        {q}
        <ChevronDown
          className="h-4 w-4 text-slate-400 shrink-0 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="text-slate-400 pb-5 text-sm leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── MAIN ───────────────────────────────────────────── */
export default function CaissioPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
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
    setToast(`✓ Vente démo encaissée : ${total.toFixed(2)} €`);
    setTimeout(() => { setCart([]); setPaid(false); setToast(null); }, 2500);
  };

  return (
    <div className="bg-slate-950 text-white min-h-screen overflow-x-hidden">
      <style>{`
        @keyframes glow-pulse { 0%,100%{opacity:.4} 50%{opacity:.9} }
        .glow-blob { filter:blur(80px); border-radius:50%; position:absolute; }
        .glow-blue { background:radial-gradient(circle,#2563eb88,transparent 70%); }
        .glow-purple { background:radial-gradient(circle,#7c3aed55,transparent 70%); }
        .glass-dark { background:rgba(15,23,42,.72); backdrop-filter:blur(24px); -webkit-backdrop-filter:blur(24px); }
        .card-dark { background:rgba(30,41,59,.5); border:1px solid rgba(148,163,184,.1); transition:all .25s cubic-bezier(.4,0,.2,1); }
        .card-dark:hover { border-color:rgba(59,130,246,.4); box-shadow:0 0 0 1px rgba(59,130,246,.15),0 20px 40px rgba(0,0,0,.3); }
        .btn-primary { background:linear-gradient(135deg,#2563eb,#4f46e5); box-shadow:0 0 30px rgba(37,99,235,.4); transition:all .25s cubic-bezier(.4,0,.2,1); }
        .btn-primary:hover { box-shadow:0 0 50px rgba(37,99,235,.6); transform:translateY(-1px); }
        .btn-windows { background:linear-gradient(135deg,#0ea5e9,#2563eb); box-shadow:0 0 30px rgba(14,165,233,.35); transition:all .25s cubic-bezier(.4,0,.2,1); }
        .btn-windows:hover { box-shadow:0 0 50px rgba(14,165,233,.55); transform:translateY(-1px); }
        .gradient-text { background:linear-gradient(135deg,#60a5fa,#a78bfa,#34d399); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .gradient-text-blue { background:linear-gradient(135deg,#60a5fa,#818cf8); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        .hero-grid { background-image:linear-gradient(rgba(59,130,246,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,.06) 1px,transparent 1px); background-size:60px 60px; }
        .windows-badge { background:linear-gradient(135deg,rgba(14,165,233,.15),rgba(37,99,235,.15)); border:1px solid rgba(14,165,233,.25); }
        .price-glow { box-shadow:0 0 60px rgba(37,99,235,.2),inset 0 1px 0 rgba(255,255,255,.06); }
        .feature-icon-wrap { background:linear-gradient(135deg,rgba(37,99,235,.2),rgba(79,70,229,.2)); border:1px solid rgba(99,102,241,.2); }
        .stat-card { background:linear-gradient(135deg,rgba(30,41,59,.8),rgba(15,23,42,.8)); border:1px solid rgba(148,163,184,.08); }
        .trial-badge { background:linear-gradient(135deg,rgba(52,211,153,.15),rgba(16,185,129,.1)); border:1px solid rgba(52,211,153,.3); color:#34d399; }
        .neon-border { box-shadow:0 0 0 1px rgba(59,130,246,.3),0 0 30px rgba(59,130,246,.1); }
      `}</style>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 px-5 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: "rgba(16,185,129,.9)", backdropFilter: "blur(12px)" }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── NAV ── */}
      <header className={`fixed top-0 inset-x-0 z-40 transition-all duration-300 ${scrolled ? "glass-dark border-b border-white/5" : ""}`}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/caissio" className="flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black">C</span>
            <span className="text-xl font-black text-white tracking-tight">Caissio</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-400">
            <a href="#demo"     className="hover:text-white font-medium transition-colors">Essayer</a>
            <a href="#features" className="hover:text-white font-medium transition-colors">Fonctionnalités</a>
            <a href="#windows"  className="hover:text-white font-medium transition-colors">Télécharger</a>
            <a href="#pricing"  className="hover:text-white font-medium transition-colors">Tarifs</a>
            <a href="#faq"      className="hover:text-white font-medium transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-sm text-slate-400 hover:text-white font-medium transition-colors">
              ← WebConceptor
            </Link>
            <a
              href="#pricing"
              className="btn-primary px-5 h-9 rounded-xl text-white text-sm font-bold inline-flex items-center gap-1.5"
            >
              Essai 7 jours gratuit
            </a>
          </div>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="relative pt-28 pb-24 hero-grid overflow-hidden">
        <div className="glow-blob glow-blue w-[600px] h-[500px] top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 opacity-60"
          style={{ animation: "glow-pulse 4s ease-in-out infinite" }} />
        <div className="glow-blob glow-purple w-[400px] h-[400px] bottom-0 right-0 opacity-40" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="max-w-5xl mx-auto text-center">
            <div className="inline-flex items-center gap-2.5 px-4 h-9 rounded-full windows-badge text-xs font-semibold text-blue-300 uppercase tracking-widest mb-8">
              <Monitor className="h-3.5 w-3.5" />
              Disponible sur Windows 10 &amp; 11
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            <h1 className="text-6xl md:text-8xl font-black leading-[0.9] tracking-tighter mb-8">
              La caisse qui fait<br />
              <span className="gradient-text">tout le travail.</span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-400 max-w-3xl mx-auto leading-relaxed mb-12">
              Encaissez plus vite, gérez votre stock en temps réel, fidélisez vos clients.{" "}
              <strong className="text-white">Sans installation, sans formation, sans prise de tête.</strong>
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-10">
              <a href="#pricing" className="btn-primary h-16 px-10 rounded-2xl text-white font-black text-lg inline-flex items-center gap-3">
                Commencer gratuitement
                <ArrowRight className="h-5 w-5" />
              </a>
              <a href="#windows" className="btn-windows h-16 px-10 rounded-2xl text-white font-black text-lg inline-flex items-center gap-3">
                <Download className="h-5 w-5" />
                Télécharger pour Windows
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-slate-500">
              {["7 jours gratuits, sans carte", "Configuration en 2 minutes", "Résiliation sans engagement"].map((t) => (
                <span key={t} className="inline-flex items-center gap-2">
                  <Check className="h-4 w-4 text-emerald-400" />{t}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label} className="stat-card rounded-2xl p-5 text-center">
                <div className="text-4xl font-black gradient-text-blue mb-1">{s.value}</div>
                <div className="text-xs text-slate-500 uppercase tracking-widest font-medium">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE DEMO ── */}
      <section id="demo" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-4">
              <Play className="h-3 w-3 fill-blue-400" />Essayez en direct
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Encaissez votre première vente{" "}
              <span className="gradient-text-blue">maintenant.</span>
            </h2>
            <p className="mt-4 text-slate-400 text-lg">Touchez les produits, ajustez les quantités, validez. Exactement comme dans la vraie caisse.</p>
          </div>

          <div
            className="grid lg:grid-cols-[1fr_380px] gap-4 max-w-6xl mx-auto rounded-3xl border border-white/[0.08] overflow-hidden neon-border"
            style={{ background: "rgba(15,23,42,.8)" }}
          >
            {/* Product grid */}
            <div className="p-6" style={{ background: "rgba(30,41,59,.3)" }}>
              <div className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-4">Choisissez un produit</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {DEMO_PRODUCTS.map((p) => (
                  <button
                    key={p.id} onClick={() => addToCart(p)}
                    className="card-dark rounded-2xl p-3 text-left flex flex-col cursor-pointer"
                  >
                    <div className="aspect-square rounded-xl flex items-center justify-center text-4xl mb-2"
                      style={{ background: "rgba(30,41,59,.8)" }}>
                      {p.emoji}
                    </div>
                    <div className="text-sm font-semibold text-slate-200 truncate">{p.name}</div>
                    <div className="text-base font-bold text-blue-400">{p.price.toFixed(2)} €</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Cart */}
            <div className="flex flex-col border-l border-white/5">
              <div className="px-5 h-14 border-b border-white/5 flex items-center justify-between">
                <div className="font-bold text-white">Ticket démo</div>
                {cart.length > 0 && (
                  <button onClick={() => setCart([])}
                    className="text-xs text-slate-500 hover:text-red-400 uppercase tracking-widest font-medium transition-colors">
                    Vider
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6 py-8 min-h-[200px]">
                    <Receipt className="h-10 w-10 text-slate-700 mb-3" />
                    <div className="text-sm text-slate-600">Touchez un produit pour commencer.</div>
                  </div>
                ) : cart.map((i) => (
                  <div key={i.id} className="rounded-xl p-3 flex items-center gap-2"
                    style={{ background: "rgba(30,41,59,.5)", border: "1px solid rgba(148,163,184,.08)" }}>
                    <div className="text-2xl">{i.emoji}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-slate-200 truncate">{i.name}</div>
                      <div className="text-xs text-slate-500">{i.price.toFixed(2)} € × {i.qty}</div>
                    </div>
                    <button onClick={() => removeOne(i.id)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                      <Minus className="h-3 w-3" />
                    </button>
                    <div className="font-mono text-sm w-5 text-center text-slate-300">{i.qty}</div>
                    <button onClick={() => addToCart(i)}
                      className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/5 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-widest text-slate-500 font-medium">Total</span>
                  <span className="text-3xl font-black text-blue-400">{total.toFixed(2)} €</span>
                </div>
                <button
                  onClick={checkout} disabled={cart.length === 0}
                  className={`w-full h-14 rounded-xl text-white font-bold text-base inline-flex items-center justify-center gap-2 disabled:opacity-25 transition-all ${paid ? "bg-emerald-600" : "btn-primary"}`}
                >
                  {paid ? <><Check className="h-4 w-4" /> Encaissé !</> : "Encaisser la démo"}
                </button>
                <div className="text-center text-xs text-slate-600">
                  👉 <a href="#pricing" className="text-blue-400 hover:underline font-medium">Créer mon compte</a> pour aller plus loin
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── WINDOWS DOWNLOAD ── */}
      <section id="windows" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="rounded-3xl p-12 md:p-16 relative overflow-hidden"
            style={{ background: "linear-gradient(135deg,rgba(14,165,233,.08),rgba(37,99,235,.12))", border: "1px solid rgba(14,165,233,.2)" }}>
            <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full opacity-30"
              style={{ background: "radial-gradient(circle,#0ea5e9,transparent 70%)", filter: "blur(60px)" }} />

            <div className="relative grid lg:grid-cols-[1fr_auto] gap-12 items-center">
              <div>
                <div className="inline-flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 grid grid-cols-2 gap-0.5">
                    {(["#f25022","#7fba00","#00a4ef","#ffb900"] as const).map((bg, i) => (
                      <div key={i} className="rounded-[2px]" style={{ background: bg }} />
                    ))}
                  </div>
                  <span className="text-lg font-bold text-white">Windows 10 / 11</span>
                </div>

                <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-6">
                  Votre caisse,<br />
                  <span className="gradient-text">en local sur votre PC.</span>
                </h2>

                <p className="text-xl text-slate-400 mb-8 max-w-xl leading-relaxed">
                  Téléchargez l'application de bureau pour Windows. Fonctionne même sans connexion internet.
                  Vos données restent sur votre machine.
                </p>

                <div className="flex flex-wrap gap-4 mb-10">
                  <a href="/download/Caissio-Setup.exe"
                    className="btn-windows h-16 px-10 rounded-2xl text-white font-black text-lg inline-flex items-center gap-3">
                    <Download className="h-5 w-5" />Télécharger (.exe)
                  </a>
                  <a href="#pricing"
                    className="h-16 px-10 rounded-2xl font-bold text-lg inline-flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
                    style={{ border: "1px solid rgba(148,163,184,.15)" }}>
                    Ou version web →
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-sm">
                  {([
                    { I: Shield, t: "Données locales", c: "text-emerald-400" },
                    { I: Wifi,   t: "Hors-ligne",      c: "text-blue-400" },
                    { I: Cpu,    t: "Ultra-léger",     c: "text-violet-400" },
                  ] as const).map(({ I, t, c }) => (
                    <div key={t} className="text-center">
                      <div className="h-10 w-10 mx-auto mb-2 rounded-xl feature-icon-wrap flex items-center justify-center">
                        <I className={`h-4 w-4 ${c}`} />
                      </div>
                      <div className="text-xs font-semibold text-slate-300">{t}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini mockup */}
              <div className="hidden lg:block">
                <div className="w-72 rounded-2xl overflow-hidden"
                  style={{ border: "1px solid rgba(148,163,184,.12)", background: "rgba(15,23,42,.9)", boxShadow: "0 40px 80px rgba(0,0,0,.5),0 0 0 1px rgba(14,165,233,.15)" }}>
                  <div className="h-8 flex items-center px-3 gap-2"
                    style={{ background: "rgba(30,41,59,.8)", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                    <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                    <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
                    <div className="mx-auto text-[10px] text-slate-600 font-mono">Caissio — Épicerie du Marché</div>
                  </div>
                  <div className="p-4 space-y-2">
                    {(["Tomate 500g","Eau Evian 1.5L","Pain complet"] as const).map((item, i) => (
                      <div key={item} className="flex items-center justify-between rounded-lg px-3 py-2"
                        style={{ background: "rgba(30,41,59,.6)" }}>
                        <span className="text-xs text-slate-300 font-medium">{item}</span>
                        <span className="text-xs font-bold text-blue-400">{["1.20 €","0.95 €","2.80 €"][i]}</span>
                      </div>
                    ))}
                    <div className="h-px my-2" style={{ background: "rgba(148,163,184,.1)" }} />
                    <div className="flex justify-between px-1">
                      <span className="text-xs text-slate-500">TOTAL</span>
                      <span className="text-lg font-black text-blue-400">4.95 €</span>
                    </div>
                    <div className="h-9 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                      style={{ background: "linear-gradient(135deg,#2563eb,#4f46e5)" }}>
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
      <section id="features" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="max-w-2xl mb-16">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-4">
              <Sparkles className="h-3.5 w-3.5" />Fonctionnalités
            </div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">
              Tout ce qu'il faut.<br />
              <span className="gradient-text-blue">Rien de trop.</span>
            </h2>
            <p className="mt-5 text-slate-400 text-xl">Un logiciel pensé pour les commerçants, pas pour les ingénieurs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f) => (
              <div key={f.t} className="card-dark rounded-2xl p-6">
                <div className="feature-icon-wrap h-12 w-12 rounded-xl flex items-center justify-center mb-5">
                  <f.Icon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="text-xl font-bold text-white mb-2">{f.t}</div>
                <div className="text-slate-400 leading-relaxed text-sm">{f.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HARDWARE ── */}
      <section className="py-20 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <div className="text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-4">Matériel compatible</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Plug &amp; Play.{" "}
              <span className="gradient-text-blue">Zéro pilote.</span>
            </h2>
            <p className="mt-4 text-slate-400 text-lg">Branchez. Cliquez sur <strong className="text-white">Audit complet</strong>. Tout est trouvé.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 max-w-4xl mx-auto">
            {HARDWARE.map((h) => (
              <div key={h.label} className="card-dark rounded-2xl p-5 text-center">
                <div className="feature-icon-wrap mx-auto h-12 w-12 rounded-xl flex items-center justify-center mb-3">
                  <h.Icon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="font-semibold text-slate-200 text-sm">{h.label}</div>
                <div className="text-[10px] uppercase tracking-widest text-slate-600 mt-1 font-medium">{h.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-24 border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-4">Avis clients</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">
              Des commerçants qui{" "}
              <span className="gradient-text">dorment mieux.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card-dark rounded-2xl p-6">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-200 font-medium leading-relaxed text-base">« {t.q} »</p>
                <div className="mt-5 pt-5 border-t border-white/5">
                  <div className="text-sm font-bold text-white">{t.a}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-4">Tarif</div>
            <h2 className="text-4xl md:text-6xl font-black tracking-tight">
              Un seul prix.{" "}
              <span className="gradient-text">Tout inclus.</span>
            </h2>
            <p className="mt-5 text-slate-400 text-xl">7 jours d'essai gratuit. Résiliez quand vous voulez.</p>
          </div>

          <div className="max-w-lg mx-auto">
            <div className="rounded-3xl p-10 price-glow relative overflow-hidden"
              style={{ background: "linear-gradient(135deg,rgba(37,99,235,.12),rgba(79,70,229,.08))", border: "1px solid rgba(99,102,241,.3)" }}>
              <div className="trial-badge inline-flex items-center gap-2 px-4 h-8 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
                <Clock className="h-3.5 w-3.5" />7 jours gratuits — sans carte
              </div>

              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-7xl font-black text-white">19€</span>
                <span className="text-slate-400 text-xl">/mois</span>
              </div>
              <p className="text-slate-400 mb-10 text-lg">Puis 19€/mois. Annulable à tout moment.</p>

              <ul className="space-y-3 mb-10">
                {PLAN_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-slate-300">
                    <div className="h-5 w-5 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center shrink-0">
                      <Check className="h-3 w-3 text-emerald-400" />
                    </div>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <a href="mailto:contact@webconceptor.fr?subject=Caissio%20-%20Essai%20gratuit"
                className="btn-primary w-full h-16 rounded-2xl font-black text-xl text-white inline-flex items-center justify-center gap-3">
                Démarrer mon essai gratuit
                <ArrowRight className="h-5 w-5" />
              </a>
              <p className="text-center text-sm text-slate-600 mt-4">Aucune carte requise. Aucun engagement.</p>
            </div>

            <div className="mt-6 rounded-2xl p-5 flex items-center gap-4 windows-badge">
              <div className="w-8 h-8 grid grid-cols-2 gap-0.5 shrink-0">
                {(["#f25022","#7fba00","#00a4ef","#ffb900"] as const).map((bg, i) => (
                  <div key={i} className="rounded-[1px]" style={{ background: bg }} />
                ))}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-white">Application Windows</div>
                <div className="text-xs text-slate-400">Fonctionne hors-ligne · Données locales</div>
              </div>
              <a href="/download/Caissio-Setup.exe"
                className="btn-windows px-4 h-9 rounded-xl text-white text-sm font-bold inline-flex items-center gap-2 shrink-0">
                <Download className="h-3.5 w-3.5" />.exe
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24 border-t border-white/5">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="text-xs uppercase tracking-[0.25em] text-blue-400 font-bold mb-4">FAQ</div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight">Questions fréquentes</h2>
          </div>
          <div className="space-y-2">
            {FAQ.map((f, i) => <FAQItem key={i} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-32 border-t border-white/5 relative overflow-hidden">
        <div className="glow-blob glow-blue w-[800px] h-[600px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-30" />
        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl md:text-8xl font-black tracking-tighter mb-8">
            Lancez votre caisse{" "}
            <span className="gradient-text">en 2 minutes</span>.
          </h2>
          <p className="text-slate-400 text-xl mb-12 max-w-xl mx-auto">
            Aucune carte bancaire. Aucun risque. 7 jours pour tomber amoureux du logiciel.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a href="mailto:contact@webconceptor.fr?subject=Caissio%20-%20Essai%20gratuit"
              className="btn-primary h-16 px-12 rounded-2xl text-white font-black text-xl inline-flex items-center gap-3">
              Commencer gratuitement<ArrowRight className="h-5 w-5" />
            </a>
            <a href="/download/Caissio-Setup.exe"
              className="btn-windows h-16 px-10 rounded-2xl text-white font-black text-xl inline-flex items-center gap-3">
              <Download className="h-5 w-5" />Télécharger Windows
            </a>
          </div>
          <p className="mt-6 text-sm text-slate-600">Sans engagement · Résiliation en 1 clic · Support 7j/7</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="py-10 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black">C</span>
            <span className="font-bold text-white">Caissio</span>
            <span className="text-slate-600 text-sm">© 2026</span>
          </div>
          <div className="text-xs text-slate-600 uppercase tracking-[0.25em]">La caisse intelligente pour les commerces</div>
          <div className="flex items-center gap-4 text-xs text-slate-600">
            <Link href="/cgu"            className="hover:text-slate-300 transition-colors">CGU</Link>
            <Link href="/confidentialite" className="hover:text-slate-300 transition-colors">Confidentialité</Link>
            <a href="mailto:contact@webconceptor.fr" className="hover:text-slate-300 transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
