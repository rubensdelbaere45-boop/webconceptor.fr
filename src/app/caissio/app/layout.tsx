"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { getSession, logout, type CaissioUser } from "@/lib/caissio-store";
import {
  ScanBarcode, LayoutDashboard, Package, Boxes, Users,
  Plug, FileBarChart2, Settings, LogOut, Menu, X,
} from "lucide-react";

const NAV = [
  { href: "/caissio/app/pos", icon: ScanBarcode, label: "Caisse" },
  { href: "/caissio/app/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/caissio/app/produits", icon: Package, label: "Produits" },
  { href: "/caissio/app/stock", icon: Boxes, label: "Stock" },
  { href: "/caissio/app/clients", icon: Users, label: "Clients" },
  { href: "/caissio/app/peripheriques", icon: Plug, label: "Périphériques" },
  { href: "/caissio/app/rapports", icon: FileBarChart2, label: "Rapports" },
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

export default function CaissioAppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<CaissioUser | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/caissio/login"); return; }
    setUser(s);
  }, [router]);

  const handleLogout = () => { logout(); router.replace("/caissio/login"); };

  if (!user) return null;

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
      <div style={{ flex: 1, overflow: "auto", paddingTop: 0 }} className="cai-main">
        <style>{`@media (max-width: 768px) { .cai-main { padding-top: 56px !important; } }`}</style>
        {children}
      </div>
    </div>
  );
}
