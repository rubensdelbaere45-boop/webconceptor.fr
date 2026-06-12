// src/components/admin/ui.tsx
// Composants réutilisables — portage exact du prototype
// Importer dans chaque page admin

'use client';

import React, { useState, createContext, useContext } from 'react';
import { IcCheck, IcX, IcBolt, IcTrendUp, IcTrendDown } from './icons';

// ─── Types ──────────────────────────────────────────────────
export type ProspectStatus = 'found' | 'sent' | 'opened' | 'replied' | 'paid';
export type ServiceStatus  = 'online' | 'offline' | 'pending';
export type MockupKind     = 'stitch' | 'template';
export type AccentKind     = 'gold' | 'blue' | 'green' | undefined;

export interface Prospect {
  id: string | number;
  name: string;
  city: string;
  type: string;
  rating: number;
  email: string;
  phone: string;
  status: ProspectStatus;
  mockup: MockupKind;
}

// ─── StatusBadge ────────────────────────────────────────────
const STATUS_CFG: Record<ProspectStatus, { label: string; cls: string }> = {
  found:   { label: 'Trouvé',  cls: 'b-found'   },
  sent:    { label: 'Envoyé',  cls: 'b-sent'    },
  opened:  { label: 'Ouvert',  cls: 'b-opened'  },
  replied: { label: 'Répondu', cls: 'b-replied' },
  paid:    { label: 'Payé',    cls: 'b-paid'    },
};

export function StatusBadge({ status }: { status: ProspectStatus }) {
  const s = STATUS_CFG[status] ?? { label: status, cls: 'b-found' };
  return (
    <span className={`badge-status ${s.cls}`}>
      <span className="dot"></span>{s.label}
    </span>
  );
}

// ─── ServiceDot ─────────────────────────────────────────────
export function ServiceDot({ status }: { status: ServiceStatus }) {
  const colors: Record<ServiceStatus, string> = {
    online:  'var(--green)',
    offline: 'var(--red)',
    pending: 'var(--amber)',
  };
  const shadows: Record<ServiceStatus, string> = {
    online:  'var(--green-soft)',
    offline: 'var(--red-soft)',
    pending: 'var(--amber-soft)',
  };
  return (
    <span style={{
      display: 'inline-block', width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
      background: colors[status],
      boxShadow: `0 0 0 3px ${shadows[status]}`,
      animation: status === 'online' ? 'pulse 2s ease-in-out infinite' : 'none',
    }} />
  );
}

// ─── Stars ──────────────────────────────────────────────────
export function Stars({ value }: { value: number }) {
  const full = Math.round(value);
  return (
    <span className="stars" title={value.toFixed(1)}>
      {[0,1,2,3,4].map(i => (
        <span key={i} className={i < full ? '' : 'empty'}>★</span>
      ))}
      <span style={{ color: 'var(--txt-3)', fontSize: 11, marginLeft: 5, letterSpacing: 0 }}>
        {value.toFixed(1)}
      </span>
    </span>
  );
}

// ─── MockupTag ──────────────────────────────────────────────
export function MockupTag({ kind }: { kind: MockupKind }) {
  return kind === 'stitch'
    ? <span className="tag tag-stitch"><IcBolt style={{ width: 11, height: 11 }} />Stitch</span>
    : <span className="tag tag-tpl">Template</span>;
}

// ─── StatsCard ──────────────────────────────────────────────
interface StatsCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  accent?: AccentKind;
}

export function StatsCard({ icon: Icon, label, value, sub, trend, accent }: StatsCardProps) {
  const tone = accent === 'gold' ? 'var(--gold)' : accent === 'blue' ? '#5b9bff' : accent === 'green' ? '#4ade80' : 'var(--txt-2)';
  const bg   = accent === 'gold' ? 'var(--gold-soft)' : accent === 'blue' ? 'var(--blue-soft)' : accent === 'green' ? 'var(--green-soft)' : 'var(--card-2)';
  return (
    <div className="card" style={{ padding: '15px 16px', display: 'flex', flexDirection: 'column', gap: 11 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ width: 34, height: 34, borderRadius: 9, background: bg, color: tone, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 17, height: 17 }} />
        </div>
        {trend != null && (
          <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12, fontWeight: 600, color: trend >= 0 ? '#4ade80' : '#f87171' }}>
            {trend >= 0 ? <IcTrendUp style={{ width: 13, height: 13 }} /> : <IcTrendDown style={{ width: 13, height: 13 }} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: '-0.03em', color: accent === 'gold' ? 'var(--gold)' : 'var(--txt)' }}>{value}</div>
        <div style={{ fontSize: 12.5, color: 'var(--txt-3)', marginTop: 2, fontWeight: 500 }}>{label}</div>
      </div>
      {sub && <div style={{ fontSize: 11.5, color: 'var(--txt-3)' }}>{sub}</div>}
    </div>
  );
}

// ─── MockupPreview ──────────────────────────────────────────
interface MockupPreviewProps {
  name: string;
  mockupKind: MockupKind;
  mockupUrl?: string;  // si dispo, utiliser une vraie iframe
  height?: number;
}

export function MockupPreview({ name, mockupKind, mockupUrl, height = 240 }: MockupPreviewProps) {
  const accent = mockupKind === 'stitch' ? 'var(--gold)' : '#5b9bff';
  return (
    <div style={{ borderRadius: 'var(--r)', overflow: 'hidden', border: '1px solid var(--border)', background: '#0d0d0d', position: 'relative' }}>
      {/* Barre navigateur fictive */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 11px', background: 'var(--card-2)', borderBottom: '1px solid var(--border)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f57' }}></span>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#febc2e' }}></span>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#28c840' }}></span>
        <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--txt-3)', fontFamily: 'monospace' }}>
          maquette.klyora.fr/{name.toLowerCase().replace(/\s/g, '-').slice(0, 20)}
        </span>
      </div>

      {mockupUrl ? (
        /* En production : vraie iframe de la maquette */
        <iframe
          src={mockupUrl}
          style={{ width: '100%', height, border: 'none', display: 'block', pointerEvents: 'none' }}
          sandbox="allow-scripts allow-same-origin"
          title={`Maquette ${name}`}
        />
      ) : (
        /* Placeholder visuel si pas d'URL */
        <div style={{ height, padding: 16, display: 'flex', flexDirection: 'column', gap: 11, background: 'linear-gradient(180deg,#101010,#0c0c0c)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontWeight: 800, fontSize: 13, color: accent }}>{name}</div>
            <div style={{ display: 'flex', gap: 9 }}>
              {['Accueil','Services','Contact'].map(x => (
                <span key={x} style={{ fontSize: 9, color: 'var(--txt-3)' }}>{x}</span>
              ))}
            </div>
          </div>
          <div style={{ height: 64, borderRadius: 8, background: `linear-gradient(120deg,${accent}22,#1a1a1a)`, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: 14 }}>
            <div>
              <div style={{ width: 110, height: 8, borderRadius: 4, background: accent, opacity: .8 }}></div>
              <div style={{ width: 70, height: 6, borderRadius: 4, background: '#333', marginTop: 7 }}></div>
              <div style={{ width: 50, height: 14, borderRadius: 4, background: accent, marginTop: 9 }}></div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ height: 46, borderRadius: 7, background: '#161616', border: '1px solid var(--border)', padding: 8 }}>
                <div style={{ width: '70%', height: 5, borderRadius: 3, background: '#333' }}></div>
                <div style={{ width: '45%', height: 5, borderRadius: 3, background: '#262626', marginTop: 6 }}></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <span style={{
        position: 'absolute', top: 44, right: 10, fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6,
        background: mockupKind === 'stitch' ? 'var(--gold-soft)' : 'var(--blue-soft)',
        color: accent, border: `1px solid ${accent}44`,
      }}>
        {mockupKind === 'stitch' ? 'STITCH' : 'TEMPLATE'}
      </span>
    </div>
  );
}

// ─── StepCard ───────────────────────────────────────────────
interface StepCardProps {
  step: string | number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}

export function StepCard({ step, title, hint, children }: StepCardProps) {
  return (
    <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
        <span style={{
          width: 26, height: 26, borderRadius: 8, flexShrink: 0,
          background: 'var(--gold-soft)', color: 'var(--gold)',
          fontWeight: 800, fontSize: 13,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>{step}</span>
        <div>
          <div className="section-title">{title}</div>
          {hint && <div className="section-hint">{hint}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Toast ──────────────────────────────────────────────────
type ToastTone = 'ok' | 'info' | 'err';

interface ToastItem { id: number; msg: string; tone: ToastTone }

const ToastCtx = createContext<(msg: string, tone?: ToastTone) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = (msg: string, tone: ToastTone = 'ok') => {
    const id = Date.now();
    setToasts(t => [...t.slice(-2), { id, msg, tone }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800);
  };

  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <span style={{ color: t.tone === 'err' ? '#f87171' : t.tone === 'info' ? '#5b9bff' : '#4ade80', display: 'flex' }}>
              {t.tone === 'err' ? <IcX style={{ width: 17, height: 17 }} /> : <IcCheck style={{ width: 17, height: 17 }} />}
            </span>
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const useToast = () => useContext(ToastCtx);
