// ============================================================
// WebConceptor Admin — layout.tsx
// src/app/admin/layout.tsx
//
// Layout racine de l'admin : sidebar fixe + topbar sticky.
// Tous les onglets sont des segments enfants (dashboard, prospects,
// commandes, settings). Ce fichier est un Client Component car
// usePathname() est nécessaire pour l'état actif du nav.
// ============================================================

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './admin-tokens.css'; // ou globals.css si tokens déjà importés
import {
  LayoutDashboard, Users, ShoppingBag, Settings,
  Search, Bell, RefreshCw,
} from 'lucide-react'; // ou vos propres SVG

// ─── Données nav ────────────────────────────────────────────
const NAV = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, section: 'pilotage' },
  { href: '/admin/prospects', label: 'Prospects',  icon: Users,           section: 'pilotage' },
  { href: '/admin/commandes', label: 'Commandes',  icon: ShoppingBag,     section: 'pilotage' },
  { href: '/admin/settings',  label: 'Settings',   icon: Settings,        section: 'systeme'  },
];

// ─── Types ──────────────────────────────────────────────────
interface Service { id: string; name: string; status: 'online' | 'offline' | 'pending' }

const SERVICES: Service[] = [
  { id: 'stitch',    name: 'Stitch Server', status: 'online' },
  { id: 'n8n',       name: 'N8N',           status: 'online' },
  { id: 'scrapling', name: 'Scrapling',      status: 'online' },
  { id: 'brevo',     name: 'Brevo',          status: 'online' },
];

// ─── Composant ──────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--txt)', fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside style={{
        width: 'var(--sidebar-w)', flexShrink: 0,
        background: 'var(--panel)', borderRight: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '22px 20px 20px' }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(145deg,var(--gold),#b8930f)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#0a0a0a', fontWeight: 800, fontSize: 18,
            boxShadow: '0 2px 10px rgba(255,215,0,.25)',
          }}>W</div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>WebConceptor</div>
            <div style={{ fontSize: 11, color: 'var(--txt-3)', fontWeight: 500, marginTop: 1 }}>Admin · Prospection</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2, flex: 1 }}>
          <NavLabel>Pilotage</NavLabel>
          {NAV.filter(n => n.section === 'pilotage').map(n => (
            <NavItem key={n.href} href={n.href} Icon={n.icon} label={n.label} active={path.startsWith(n.href)} />
          ))}
          <NavLabel>Système</NavLabel>
          {NAV.filter(n => n.section === 'systeme').map(n => (
            <NavItem key={n.href} href={n.href} Icon={n.icon} label={n.label} active={path.startsWith(n.href)} />
          ))}

          {/* Services mini-status */}
          <div style={{
            margin: '12px 0', padding: '12px 14px', borderRadius: 10,
            background: 'var(--card)', border: '1px solid var(--border)',
          }}>
            <div style={{ fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--txt-3)', marginBottom: 9 }}>Services</div>
            {SERVICES.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
                <ServiceDot status={s.status} />
                <span style={{ fontSize: 11.5, color: 'var(--txt-2)' }}>{s.name}</span>
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 8, borderRadius: 9 }}>
            <div style={{
              width: 30, height: 30, borderRadius: 8, background: '#262626',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 12, color: 'var(--txt-2)',
            }}>WC</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>Admin</div>
              <div style={{ fontSize: 11, color: 'var(--txt-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>admin@webconceptor.fr</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Topbar */}
        <header style={{
          display: 'flex', alignItems: 'center', gap: 16,
          padding: '0 28px', height: 'var(--topbar-h)', flexShrink: 0,
          borderBottom: '1px solid var(--border)',
          background: 'rgba(10,10,10,.7)', backdropFilter: 'blur(12px)',
          position: 'sticky', top: 0, zIndex: 20,
        }}>
          <PageMeta path={path} />
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 9 }}>
            <SearchBar />
            <IconBtn title="Notifications"><Bell size={18} /></IconBtn>
            <IconBtn title="Rafraîchir"><RefreshCw size={18} /></IconBtn>
          </div>
        </header>

        {/* Page content */}
        <main style={{ flex: 1, minHeight: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}

// ─── Sous-composants ────────────────────────────────────────
function NavLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      fontSize: 10.5, fontWeight: 600, textTransform: 'uppercase',
      letterSpacing: '.09em', color: 'var(--txt-3)', padding: '14px 12px 6px',
    }}>{children}</div>
  );
}

function NavItem({ href, Icon, label, active }: {
  href: string; Icon: React.ElementType; label: string; active: boolean;
}) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: 11,
      padding: '9px 12px', borderRadius: 9,
      color: active ? 'var(--txt)' : 'var(--txt-2)',
      fontWeight: active ? 600 : 500, fontSize: 13.5,
      background: active ? 'var(--card-2)' : 'transparent',
      textDecoration: 'none', position: 'relative',
      transition: 'background .15s, color .15s',
    }}>
      {active && (
        <span style={{
          position: 'absolute', left: -12, top: '50%', transform: 'translateY(-50%)',
          width: 3, height: 18, borderRadius: '0 3px 3px 0', background: 'var(--gold)',
        }} />
      )}
      <Icon size={18} />
      {label}
    </Link>
  );
}

function ServiceDot({ status }: { status: Service['status'] }) {
  const c = status === 'online' ? 'var(--green)' : status === 'offline' ? 'var(--red)' : 'var(--amber)';
  const s = status === 'online' ? 'var(--green-soft)' : status === 'offline' ? 'var(--red-soft)' : 'var(--amber-soft)';
  return <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: c, boxShadow: `0 0 0 3px ${s}` }} />;
}

function SearchBar() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9,
      background: 'var(--card)', border: '1px solid var(--border)',
      padding: '0 12px', height: 38, borderRadius: 9, width: 300,
    }}>
      <Search size={16} color="var(--txt-3)" />
      <input
        placeholder="Recherche globale…"
        style={{
          background: 'none', border: 'none', outline: 'none',
          color: 'var(--txt)', width: '100%', fontSize: 13.5,
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
}

function PageMeta({ path }: { path: string }) {
  const meta: Record<string, { title: string; sub: string }> = {
    '/admin/dashboard': { title: 'Dashboard', sub: "Vue d'ensemble de la prospection" },
    '/admin/prospects': { title: 'Prospects', sub: 'Recherche, envoi & suivi' },
    '/admin/commandes': { title: 'Commandes', sub: 'Clients payés & déploiements' },
    '/admin/settings':  { title: 'Paramètres', sub: 'Clés API, limites & logs' },
  };
  const m = Object.entries(meta).find(([k]) => path.startsWith(k))?.[1];
  if (!m) return null;
  return (
    <div>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em' }}>{m.title}</div>
      <div style={{ fontSize: 12.5, color: 'var(--txt-3)', marginTop: 1 }}>{m.sub}</div>
    </div>
  );
}

function IconBtn({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <button title={title} style={{
      width: 38, height: 38, borderRadius: 9,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--txt-2)', border: '1px solid var(--border)',
      background: 'var(--card)', cursor: 'pointer',
      transition: '.15s',
    }}>{children}</button>
  );
}
