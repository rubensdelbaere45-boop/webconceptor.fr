// src/app/admin/dashboard/DashboardClient.tsx
// Partie client du Dashboard : chart interactif, objectif, activité, funnel
// Portage exact de prototype/dashboard.jsx

'use client';

import { useState } from 'react';
import { ServiceDot } from '@/components/admin/ui';
import { IcUsers, IcSend, IcEye, IcRevenue } from '@/components/admin/icons';

// ── Types ────────────────────────────────────────────────────
interface Service { id: string; name: string; status: 'online' | 'offline' | 'pending'; detail: string }
interface ActivityItem { kind: 'found' | 'sent' | 'opened' | 'paid'; who: string; city: string; t: string }

interface Props {
  revenue: number;
  objectif: number;
  services: Service[];
  activity: ActivityItem[];
  totalProspects: number;
  envoyes: number;
  ouverts: number;
}

// ── Données graphique (30 jours) — à remplacer par vraies données ─
function generateChartData() {
  const rng = (s: number) => { const x = Math.sin(s + 1) * 10000; return x - Math.floor(x); };
  const sends: number[] = [], opens: number[] = [];
  for (let i = 0; i < 30; i++) {
    const base = 20 + Math.round(rng(i * 2) * 38) + (i > 20 ? 30 : 0);
    const s = i < 6 ? Math.round(base * 0.3) : base;
    sends.push(s);
    opens.push(Math.max(0, Math.round(s * (0.1 + rng(i * 3) * 0.12))));
  }
  return { sends, opens };
}
const CHART = generateChartData();

// ── AreaChart ────────────────────────────────────────────────
function AreaChart({ data }: { data: { sends: number[]; opens: number[] } }) {
  const W = 760, H = 200;
  const pad = { t: 14, r: 8, b: 22, l: 30 };
  const { sends, opens } = data;
  const max = Math.max(...sends) * 1.15;
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const x = (i: number) => pad.l + (i / (sends.length - 1)) * iw;
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const line = (arr: number[]) => arr.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ');
  const area = (arr: number[]) => `${line(arr)} L${x(arr.length-1)} ${pad.t+ih} L${pad.l} ${pad.t+ih} Z`;
  const [hover, setHover] = useState<number | null>(null);

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={e => {
          const r = e.currentTarget.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width * W;
          const i = Math.round(((px - pad.l) / iw) * (sends.length - 1));
          if (i >= 0 && i < sends.length) setHover(i);
        }}
      >
        <defs>
          <linearGradient id="gSend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gOpen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0066ff" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#0066ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((g, i) => {
          const gy = pad.t + ih - g * ih;
          return (
            <g key={i}>
              <line x1={pad.l} y1={gy} x2={W - pad.r} y2={gy} stroke="#1d1d1d" strokeWidth="1" />
              <text x={pad.l - 7} y={gy + 3} textAnchor="end" fontSize="9" fill="#5a5a5a">{Math.round(max * g)}</text>
            </g>
          );
        })}
        <path d={area(sends)} fill="url(#gSend)" />
        <path d={area(opens)} fill="url(#gOpen)" />
        <path d={line(sends)} fill="none" stroke="#FFD700" strokeWidth="2" strokeLinejoin="round" />
        <path d={line(opens)} fill="none" stroke="#0066ff" strokeWidth="2" strokeLinejoin="round" />
        {[0, 7, 14, 21, 29].map(i => (
          <text key={i} x={x(i)} y={H - 6} textAnchor="middle" fontSize="9" fill="#5a5a5a">J-{29 - i}</text>
        ))}
        {hover != null && (
          <g>
            <line x1={x(hover)} y1={pad.t} x2={x(hover)} y2={pad.t + ih} stroke="#3a3a3a" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx={x(hover)} cy={y(sends[hover])} r="4" fill="#FFD700" stroke="#0a0a0a" strokeWidth="2" />
            <circle cx={x(hover)} cy={y(opens[hover])} r="4" fill="#0066ff" stroke="#0a0a0a" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover != null && (
        <div style={{
          position: 'absolute', top: 6, left: `${(x(hover) / W) * 100}%`, transform: 'translateX(-50%)',
          background: 'var(--elevated)', border: '1px solid var(--border-strong)',
          borderRadius: 9, padding: '8px 11px', pointerEvents: 'none', whiteSpace: 'nowrap',
          boxShadow: 'var(--shadow)',
        }}>
          <div style={{ fontSize: 10.5, color: 'var(--txt-3)', marginBottom: 4 }}>Jour J-{29 - hover}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, background: '#FFD700', display: 'inline-block' }}></span>
            {sends[hover]} envois
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, marginTop: 2 }}>
            <span style={{ width: 7, height: 7, borderRadius: 2, background: '#0066ff', display: 'inline-block' }}></span>
            {opens[hover]} ouvertures
          </div>
        </div>
      )}
    </div>
  );
}

// ── ActivityRow ──────────────────────────────────────────────
function ActivityRow({ a }: { a: ActivityItem }) {
  const map = {
    found:  { ic: IcUsers,   c: 'var(--txt-2)', bg: 'var(--card-2)',   txt: 'Nouveau prospect' },
    sent:   { ic: IcSend,    c: '#5b9bff',      bg: 'var(--blue-soft)', txt: 'Email envoyé' },
    opened: { ic: IcEye,     c: '#fbbf24',      bg: 'var(--amber-soft)', txt: 'Email ouvert' },
    paid:   { ic: IcRevenue, c: '#4ade80',      bg: 'var(--green-soft)', txt: 'Paiement reçu' },
  };
  const m = map[a.kind] ?? map.found;
  const Icon = m.ic;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0' }}>
      <span style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, background: m.bg, color: m.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon style={{ width: 15, height: 15 }} />
      </span>
      <div style={{ minWidth: 0, flex: 1 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600 }}>{a.who}</div>
        <div style={{ fontSize: 11.5, color: 'var(--txt-3)' }}>{m.txt} · {a.city}</div>
      </div>
      <span style={{ fontSize: 11, color: 'var(--txt-3)', whiteSpace: 'nowrap' }}>{a.t}</span>
    </div>
  );
}

// ── Funnel ───────────────────────────────────────────────────
function Funnel({ totalProspects, envoyes, ouverts }: { totalProspects: number; envoyes: number; ouverts: number }) {
  const steps = [
    { label: 'Trouvés',  value: totalProspects, c: '#777' },
    { label: 'Envoyés',  value: envoyes,        c: '#5b9bff' },
    { label: 'Ouverts',  value: ouverts,        c: '#fbbf24' },
    { label: 'Répondus', value: 0,              c: '#c084fc' },
    { label: 'Payés',    value: 0,              c: '#4ade80' },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {steps.map((s, i) => {
        const pct = totalProspects ? (s.value / totalProspects) * 100 : 0;
        const conv = i > 0 && steps[i-1].value ? ((s.value / steps[i-1].value) * 100).toFixed(0) : null;
        return (
          <div key={i}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 5 }}>
              <span style={{ fontWeight: 600 }}>{s.label}</span>
              <span style={{ color: 'var(--txt-3)' }}>
                {s.value.toLocaleString('fr-FR')}
                {conv != null && <span style={{ marginLeft: 7, fontSize: 11 }}>· {conv}%</span>}
              </span>
            </div>
            <div style={{ height: 9, borderRadius: 20, background: 'var(--card-2)', overflow: 'hidden' }}>
              <div style={{ width: `${Math.max(pct, s.value > 0 ? 3 : 0)}%`, height: '100%', borderRadius: 20, background: s.c, opacity: .85 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Export principal ─────────────────────────────────────────
export function DashboardClient({ revenue, objectif, services, activity, totalProspects, envoyes, ouverts }: Props) {
  const progress = Math.min(100, objectif > 0 ? (revenue / objectif) * 100 : 0);

  return (
    <>
      {/* Graphique + objectif + services */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 14, marginBottom: 14 }}>
        <div className="card card-pad">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
            <div style={{ minWidth: 0 }}>
              <div className="section-title" style={{ whiteSpace: 'nowrap' }}>Envois &amp; ouvertures</div>
              <div className="section-hint">30 derniers jours</div>
            </div>
            <div style={{ display: 'flex', gap: 16, flexShrink: 0 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--txt-2)' }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--gold)', display: 'inline-block' }}></span>Envois
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--txt-2)' }}>
                <span style={{ width: 9, height: 9, borderRadius: 3, background: 'var(--blue)', display: 'inline-block' }}></span>Ouvertures
              </span>
            </div>
          </div>
          <AreaChart data={CHART} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Objectif juin */}
          <div className="card card-pad">
            <div className="section-title" style={{ marginBottom: 12 }}>Objectif juin</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span style={{ fontSize: 26, fontWeight: 800, color: 'var(--gold)', letterSpacing: '-0.03em' }}>{revenue.toLocaleString('fr-FR')} €</span>
              <span style={{ fontSize: 13, color: 'var(--txt-3)' }}>/ {objectif.toLocaleString('fr-FR')} €</span>
            </div>
            <div style={{ height: 8, borderRadius: 20, background: 'var(--card-2)', marginTop: 12, overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', borderRadius: 20, background: 'linear-gradient(90deg,#b8930f,var(--gold))', minWidth: progress === 0 ? 0 : 6 }} />
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--txt-3)', marginTop: 9 }}>
              {revenue === 0 ? `Aucune vente — ${progress.toFixed(0)}% de l'objectif` : `${progress.toFixed(0)}% de l'objectif atteint`}
            </div>
          </div>

          {/* Services */}
          <div className="card card-pad" style={{ flex: 1 }}>
            <div className="section-title" style={{ marginBottom: 4 }}>Status des services</div>
            {services.map((s, i) => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 0', borderBottom: i < services.length - 1 ? '1px solid var(--border)' : 'none' }}>
                <ServiceDot status={s.status} />
                <span style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{s.name}</span>
                <span style={{ marginLeft: 'auto', fontSize: 11.5, color: 'var(--txt-3)', whiteSpace: 'nowrap' }}>{s.detail}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activité + funnel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 6 }}>Activité récente</div>
          {activity.map((a, i) => <ActivityRow key={i} a={a} />)}
        </div>
        <div className="card card-pad">
          <div className="section-title" style={{ marginBottom: 16 }}>Funnel de conversion</div>
          <Funnel totalProspects={totalProspects} envoyes={envoyes} ouverts={ouverts} />
        </div>
      </div>
    </>
  );
}
