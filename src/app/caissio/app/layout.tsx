"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSession, logout, validatePin, hasAccess, updateSubscription, switchToLive, type CaissioUser } from "@/lib/caissio-store";
import {
  ScanBarcode, LayoutDashboard, Package, Boxes, Users,
  Plug, FileBarChart2, Settings, LogOut, Menu, X,
  Truck, Lock, Delete, CreditCard,
} from "lucide-react";

const NAV = [
  { href: "/caissio/app/pos", icon: ScanBarcode, label: "Caisse" },
  { href: "/caissio/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/caissio/app/produits", icon: Package, label: "Produits" },
  { href: "/caissio/app/stock", icon: Boxes, label: "Stock" },
  { href: "/caissio/app/clients", icon: Users, label: "Clients" },
  { href: "/caissio/app/fournisseurs", icon: Truck, label: "Fournisseurs" },
  { href: "/caissio/app/peripheriques", icon: Plug, label: "Périphériques" },
  { href: "/caissio/app/rapports", icon: FileBarChart2, label: "Rapports" },
  { href: "/caissio/app/abonnement", icon: CreditCard, label: "Abonnement" },
  { href: "/caissio/app/parametres", icon: Settings, label: "Paramètres" },
];

function CaissioMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="2" y="2" width="44" height="44" rx="11" fill="#4F46E5" />
      <rect x="14" y="6" width="14" height="6" rx="1.5" fill="white" opacity="0.95" />
      <rect x="10" y="16" width="28" height="22" rx="3.5" fill="white" />
      <rect x="14" y="20" width="20" height="6" rx="1.5" fill="#4F46E5" opacity="0.15" />
      <rect x="14" y="28" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5" />
      <rect x="21.5" y="28" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5" />
      <rect x="29" y="28" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5" />
      <rect x="14" y="33" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5" />
      <rect x="21.5" y="33" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5" />
      <rect x="29" y="33" width="5" height="3" rx="1" fill="#10B981" />
    </svg>
  );
}

const LOCK_TIMEOUT = 10 * 60 * 1000; // 10 min

export default function CaissioAppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CaissioUser | null>(null);
  const [open, setOpen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinErr, setPinErr] = useState("");

  useEffect(() => {
    let s = getSession();
    if (!s) { router.replace("/caissio/login"); return; }

    // Patch silencieux : backfill les champs manquants pour les vieux comptes
    // (comptes créés avant l'ajout de trial_ends_at / subscription_status)
    if (!s.trial_ends_at || !s.subscription_status || !s.mode) {
      const { updateSubscription: _u, ...rest } = { updateSubscription: null, ...s };
      void rest; // évite lint "unused"
      const patched = {
        ...s,
        trial_ends_at: s.trial_ends_at || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        subscription_status: s.subscription_status || ("trialing" as const),
        mode: s.mode || ("live" as const),
        onboarding_done: s.onboarding_done ?? true,
      };
      localStorage.setItem("caissio_session", JSON.stringify(patched));
      // Met aussi à jour le tableau users
      try {
        const users = JSON.parse(localStorage.getItem("caissio_users") || "[]") as typeof patched[];
        const updated = users.map((u) => u.id === patched.id ? patched : u);
        localStorage.setItem("caissio_users", JSON.stringify(updated));
      } catch { /* silencieux */ }
      s = patched;
    }

    setUser(s);
    // Redirige vers abonnement si l'accès est révoqué (trial expiré ou subscription annulée)
    if (!hasAccess(s) && pathname !== "/caissio/app/abonnement") {
      router.replace("/caissio/app/abonnement");
      return;
    }
    // Vérification Stripe une fois par 24h (fire & forget — ne bloque pas l'UI)
    if (s.stripe_customer_id) {
      const lastVerified = s.subscription_verified_at
        ? new Date(s.subscription_verified_at).getTime()
        : 0;
      const dayMs = 24 * 60 * 60 * 1000;
      if (Date.now() - lastVerified > dayMs) {
        fetch(`/api/caissio/subscription?customer_id=${s.stripe_customer_id}`)
          .then((r) => r.ok ? r.json() : null)
          .then((data: { subscription_status?: CaissioUser["subscription_status"]; subscription_plan?: CaissioUser["subscription_plan"]; verified_at?: string } | null) => {
            if (!data) return;
            updateSubscription({
              subscription_status: data.subscription_status,
              subscription_plan: data.subscription_plan,
              subscription_verified_at: data.verified_at,
            });
          })
          .catch(() => { /* silencieux — accès réseau non disponible */ });
      }
    }
  }, [router, pathname]);

  // auto-lock on inactivity
  useEffect(() => {
    if (!user) return;
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setLocked(true), LOCK_TIMEOUT);
    };
    const events = ["mousemove", "keydown", "pointerdown", "touchstart"];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, reset));
    };
  }, [user]);

  const handleUnlock = useCallback((code: string) => {
    const u = getSession();
    if (!u?.pin || validatePin(code)) {
      setLocked(false);
      setPinInput("");
      setPinErr("");
    } else {
      setPinErr("PIN incorrect");
      setPinInput("");
    }
  }, []);

  useEffect(() => {
    if (pinInput.length === 6) handleUnlock(pinInput);
  }, [pinInput, handleUnlock]);

  const pressPin = (d: string) => setPinInput((p) => p.length < 6 ? p + d : p);
  const backPin = () => { setPinInput((p) => p.slice(0, -1)); setPinErr(""); };

  const handleLogout = () => { logout(); router.replace("/caissio/login"); };

  if (!user) return null;

  // Lock screen overlay
  if (locked) return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, background: "linear-gradient(135deg,#ede9fe 0%,#e0e7ff 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');`}</style>
      <div style={{ width: "100%", maxWidth: 340, textAlign: "center" }}>
        <CaissioMark size={52} />
        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: "#0f172a", marginTop: 16 }}>Bonjour, {user.name.split(" ")[0]}</div>
        <div style={{ fontSize: 13, color: "#64748b", marginTop: 4, marginBottom: 28 }}>Entrez votre PIN pour reprendre</div>

        {/* PIN dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20 }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: i < pinInput.length ? "#4f46e5" : "#c4b5fd", transition: "background .15s, transform .15s", transform: i < pinInput.length ? "scale(1.15)" : "scale(1)" }} />
          ))}
        </div>
        {pinErr && <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, marginBottom: 12 }}>{pinErr}</div>}
        {!user.pin && <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>Aucun PIN configuré — appuyez sur n&apos;importe quelle touche pour continuer.</div>}

        {/* Numpad */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
          {["1","2","3","4","5","6","7","8","9"].map((d) => (
            <button key={d} onClick={() => pressPin(d)} style={{ height: 68, borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", fontSize: 26, fontWeight: 300, color: "#0f172a", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
              {d}
            </button>
          ))}
          <button onClick={handleLogout} style={{ height: 68, borderRadius: 16, border: "none", background: "transparent", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", cursor: "pointer" }}>Sortir</button>
          <button onClick={() => pressPin("0")} style={{ height: 68, borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", fontSize: 26, fontWeight: 300, color: "#0f172a", cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>0</button>
          <button onClick={backPin} style={{ height: 68, borderRadius: 16, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 8px rgba(0,0,0,.06)" }}>
            <Delete style={{ width: 20, height: 20, color: "#64748b" }} />
          </button>
        </div>
        {!user.pin && (
          <button onClick={() => handleUnlock("")} style={{ marginTop: 16, fontSize: 13, color: "#4f46e5", fontWeight: 600, background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Déverrouiller sans PIN
          </button>
        )}
        <div style={{ marginTop: 16, fontSize: 11, color: "#94a3b8" }}>Si vous n&apos;avez pas de PIN, appuyez sur Déverrouiller sans PIN.</div>
      </div>
    </div>
  );

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div style={{
      width: mobile ? "100%" : 220,
      background: "#fff",
      borderRight: mobile ? "none" : "1px solid #e2e8f0",
      display: "flex",
      flexDirection: "column",
      height: "100%",
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "20px 16px 16px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 10 }}>
        <CaissioMark size={28} />
        <div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 16, color: "#0f172a", letterSpacing: "-0.02em" }}>Caissio</div>
          <div style={{ fontSize: 11, color: "#94a3b8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 140 }}>{user.store_name}</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 10px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map((n) => {
          const active = pathname === n.href;
          const Icon = n.icon;
          return (
            <a key={n.href} href={n.href} onClick={() => setOpen(false)} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "0 10px", height: 40, borderRadius: 10,
              textDecoration: "none", fontSize: 13, fontWeight: 600,
              background: active ? "#ede9fe" : "transparent",
              color: active ? "#4f46e5" : "#64748b",
              transition: "all .15s",
            }}>
              <Icon style={{ width: 16, height: 16, flexShrink: 0 }} />
              {n.label}
            </a>
          );
        })}
      </nav>

      {/* User */}
      <div style={{ padding: "12px 10px", borderTop: "1px solid #f1f5f9" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 4, borderRadius: 10, background: "#f8fafc" }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#4f46e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.name}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>{user.plan}</div>
          </div>
        </div>
        <button onClick={() => { setLocked(true); setPinInput(""); setPinErr(""); }} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "0 10px", height: 36, width: "100%", borderRadius: 10,
          border: "none", background: "transparent", cursor: "pointer", fontSize: 12, color: "#94a3b8", fontWeight: 500,
        }}>
          <Lock style={{ width: 14, height: 14 }} /> Verrouiller
        </button>
        <button onClick={handleLogout} style={{
          display: "flex", alignItems: "center", gap: 8, padding: "0 10px", height: 36, width: "100%", borderRadius: 10,
          border: "none", background: "transparent", cursor: "pointer", fontSize: 12, color: "#94a3b8", fontWeight: 500,
        }}>
          <LogOut style={{ width: 14, height: 14 }} /> Se déconnecter
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f8fafc", fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @media (max-width: 768px) { .cai-sidebar-desktop { display: none !important; } .cai-mobile-bar { display: flex !important; } }
        @media (min-width: 769px) { .cai-sidebar-desktop { display: flex !important; } .cai-mobile-bar { display: none !important; } }
      `}</style>

      {/* Desktop sidebar */}
      <div className="cai-sidebar-desktop" style={{ display: "flex" }}>
        <Sidebar />
      </div>

      {/* Mobile top bar */}
      <div className="cai-mobile-bar" style={{ display: "none", position: "fixed", top: 0, left: 0, right: 0, height: 56, background: "#fff", borderBottom: "1px solid #e2e8f0", zIndex: 50, alignItems: "center", padding: "0 16px", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CaissioMark size={24} />
          <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 16, color: "#0f172a" }}>Caissio</span>
        </div>
        <button onClick={() => setOpen(!open)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
          {open ? <X style={{ width: 22, height: 22 }} /> : <Menu style={{ width: 22, height: 22 }} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {open && (
        <div style={{ position: "fixed", inset: 0, zIndex: 49, background: "rgba(0,0,0,.3)" }} onClick={() => setOpen(false)}>
          <div style={{ position: "absolute", top: 56, left: 0, bottom: 0, width: 240, background: "#fff", borderRight: "1px solid #e2e8f0" }} onClick={(e) => e.stopPropagation()}>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, overflow: "auto", paddingTop: 0, display: "flex", flexDirection: "column" }} className="cai-main">
        <style>{`@media (max-width: 768px) { .cai-main { padding-top: 56px !important; } }`}</style>

        {/* ── Banner MODE TEST ── */}
        {user.mode === "test" && (
          <div style={{ flexShrink: 0, background: "linear-gradient(90deg,#f59e0b,#d97706)", color: "#fff", padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, fontSize: 13, fontWeight: 700, zIndex: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ background: "rgba(0,0,0,.2)", borderRadius: 6, padding: "2px 8px", fontSize: 11, letterSpacing: "0.1em" }}>MODE TEST</span>
              <span style={{ fontWeight: 500, fontSize: 12 }}>Vos ventes ne comptent pas dans vos rapports réels.</span>
            </div>
            <button
              onClick={() => {
                if (confirm("Passer en mode Live ? Vos prochaines ventes seront réelles et comptabilisées.")) {
                  switchToLive();
                  window.location.reload();
                }
              }}
              style={{ height: 28, padding: "0 12px", borderRadius: 8, background: "rgba(255,255,255,.25)", border: "1px solid rgba(255,255,255,.4)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>
              ⚡ Passer en Live
            </button>
          </div>
        )}

        <div style={{ flex: 1, overflow: "auto" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
