// src/app/admin/commandes/page.tsx
// Commandes — Client Component (actions de déploiement réactives)
// Portage exact de prototype/commandes.jsx

'use client';

import { useState, useEffect } from 'react';
import { StatsCard, MockupPreview, useToast } from '@/components/admin/ui';
import {
  IcRevenue, IcOrders, IcRocket, IcClock,
  IcBolt, IcTerminal, IcSend, IcExternal,
  IcGlobe, IcMail, IcPhone, IcRefresh, IcX,
} from '@/components/admin/icons';

// ── Types ────────────────────────────────────────────────────
type Plan = 'simple' | 'serenite' | 'luxury';

interface Order {
  id: string;
  client: string;
  email: string;
  phone: string;
  type: string;
  city: string;
  plan: Plan;
  domaine: string | null;
  date: string;       // ISO
  deployed: boolean;
  mockup: 'stitch' | 'template';
  mockup_url?: string;
  site_url?: string;
}

interface DeployLog { timestamp: string; level: 'info' | 'ok' | 'warn' | 'err'; message: string }

// ── Config plans ─────────────────────────────────────────────
const PLANS: Record<Plan, { label: string; price: number; recur: number; tone: 'gold' | 'blue' | 'ghost' }> = {
  simple:   { label: 'Simple',   price: 320, recur: 0,  tone: 'ghost' },
  serenite: { label: 'Sérénité', price: 320, recur: 50, tone: 'blue'  },
  luxury:   { label: 'Luxury',   price: 860, recur: 75, tone: 'gold'  },
};

// ── Types business (pour l'icône) ────────────────────────────
const ICONS: Record<string, string> = {
  restaurant: '🍽️', boulangerie: '🥐', institut: '💅', electricien: '⚡',
  plombier: '🔧', garage: '🚗', osteo: '🦴', coiffeur: '✂️',
  glacier: '🍦', dentiste: '🦷', fleuriste: '🌷', autoecole: '🚙',
};

// ── PlanTag ──────────────────────────────────────────────────
function PlanTag({ plan }: { plan: Plan }) {
  const p = PLANS[plan];
  const tone = {
    gold:  { bg: 'var(--gold-soft)',  c: 'var(--gold)', b: 'rgba(255,215,0,.3)'   },
    blue:  { bg: 'var(--blue-soft)',  c: '#5b9bff',     b: 'rgba(0,102,255,.3)'   },
    ghost: { bg: 'var(--card-2)',     c: 'var(--txt-2)', b: 'var(--border)'        },
  }[p.tone];
  return (
    <span className="tag" style={{ background: tone.bg, color: tone.c, borderColor: tone.b, fontWeight: 600, whiteSpace: 'nowrap' }}>
      {p.label} · {p.price}€{p.recur ? ` +${p.recur}€/mois` : ''}
    </span>
  );
}

// ── LogsModal (slide panel) ───────────────────────────────────
function LogsModal({ orderId, orderLabel, open, onClose }: { orderId: string | null; orderLabel: string; open: boolean; onClose: () => void }) {
  const [logs, setLogs] = useState<DeployLog[]>([]);

  useEffect(() => {
    if (!open || !orderId) return;
    fetch(`/api/admin/orders/${orderId}/logs`)
      .then(r => r.json())
      .then(d => setLogs(d.logs ?? []));
  }, [open, orderId]);

  if (!open) return null;
  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="slidepanel" style={{ width: 560 }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--card-2)', color: 'var(--txt-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IcTerminal style={{ width: 16, height: 16 }} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>Logs de déploiement</div>
            <div style={{ fontSize: 12, color: 'var(--txt-3)' }}>{orderLabel}</div>
          </div>
          <button className="icon-btn" onClick={onClose}><IcX /></button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 18 }}>
          <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12, lineHeight: 1.9, background: '#0b0b0b', border: '1px solid var(--border)', borderRadius: 10, padding: 16 }}>
            {logs.length === 0
              ? <div style={{ color: 'var(--txt-3)' }}>Aucun log disponible</div>
              : logs.map((l, i) => {
                  const c = l.level === 'ok' ? '#4ade80' : l.level === 'err' ? '#f87171' : l.level === 'warn' ? '#fbbf24' : '#5b9bff';
                  return <div key={i} style={{ color: c, whiteSpace: 'pre-wrap' }}>[{l.timestamp}] {l.message}</div>;
                })}
          </div>
        </div>
      </div>
    </>
  );
}

// ── CommandeCard ─────────────────────────────────────────────
function CommandeCard({ order, onLogs }: { order: Order; onLogs: (id: string, label: string) => void }) {
  const toast = useToast();
  const [deployed, setDeployed] = useState(order.deployed);
  const [generating, setGenerating] = useState(false);
  const [deploying, setDeploying]   = useState(false);
  const icon = ICONS[order.type] ?? '🏢';

  const doGenerate = async () => {
    setGenerating(true);
    try {
      await fetch(`/api/admin/orders/${order.id}/generate`, { method: 'POST' });
      toast('Site complet généré (5 pages)');
    } finally {
      setGenerating(false);
    }
  };

  const doDeploy = async () => {
    setDeploying(true);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/deploy`, { method: 'POST' });
      if (res.ok) {
        setDeployed(true);
        toast('Site déployé — ' + (order.domaine ?? order.client));
      }
    } finally {
      setDeploying(false);
    }
  };

  const doDeliveryEmail = async () => {
    await fetch(`/api/admin/orders/${order.id}/delivery-email`, { method: 'POST' });
    toast('Email de livraison envoyé');
  };

  return (
    <div className="card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: 16, padding: 16 }}>
        {/* Preview maquette */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <MockupPreview name={order.client} mockupKind={order.mockup} mockupUrl={order.mockup_url} height={120} />
        </div>

        {/* Infos */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{icon}</span>
                <span style={{ fontSize: 15.5, fontWeight: 700, letterSpacing: '-0.02em' }}>{order.client}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--txt-3)', marginTop: 3 }}>
                {order.city} · payé le {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
              </div>
            </div>
            {/* Pastille 🟢/🔴 */}
            <span className="badge-status" style={{
              background: deployed ? 'var(--green-soft)' : 'var(--red-soft)',
              color: deployed ? '#4ade80' : '#f87171',
            }}>
              <span className="dot" style={{ background: deployed ? '#4ade80' : '#f87171' }}></span>
              {deployed ? 'En ligne' : 'Non déployé'}
            </span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 11 }}>
            <PlanTag plan={order.plan} />
            {order.domaine && (
              <span className="tag">
                <IcGlobe style={{ width: 12, height: 12 }} />{order.domaine}
              </span>
            )}
            <span className="tag">
              <IcMail style={{ width: 12, height: 12 }} />{order.email}
            </span>
            {/* ⚠️ Click-to-call : <a href="tel:..."> */}
            <a className="tag" href={`tel:${order.phone.replace(/\s/g, '')}`} style={{ color: 'var(--txt-2)' }} title="Appeler">
              <IcPhone style={{ width: 12, height: 12 }} />{order.phone}
            </a>
          </div>
        </div>
      </div>

      {/* Barre d'actions */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid var(--border)', background: 'var(--card-2)', flexWrap: 'wrap' }}>
        <button className="btn btn-sm btn-gold" onClick={doGenerate} disabled={generating}>
          {generating
            ? <><IcRefresh style={{ animation: 'spin 1s linear infinite' }} />Génération…</>
            : <><IcBolt />Générer site complet</>}
        </button>

        {!deployed ? (
          <button className="btn btn-sm btn-green" onClick={doDeploy} disabled={deploying}>
            {deploying
              ? <><IcRefresh style={{ animation: 'spin 1s linear infinite' }} />Déploiement…</>
              : <><IcRocket />Déployer</>}
          </button>
        ) : (
          <button className="btn btn-sm btn-ghost" onClick={doDeliveryEmail}>
            <IcSend />Envoyer email livraison
          </button>
        )}

        <button className="btn btn-sm btn-ghost" onClick={() => onLogs(order.id, `${order.client} · ${order.domaine ?? 'sous-domaine Klyora Sites'}`)}>
          <IcTerminal />Logs
        </button>

        {order.site_url && (
          <a className="btn btn-sm btn-ghost" href={order.site_url} target="_blank" rel="noreferrer" style={{ marginLeft: 'auto' }}>
            <IcExternal />Voir le site
          </a>
        )}
      </div>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────
export default function CommandesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [logsOrderId, setLogsOrderId]       = useState<string | null>(null);
  const [logsOrderLabel, setLogsOrderLabel] = useState('');

  useEffect(() => {
    fetch('/api/admin/orders')
      .then(r => r.json())
      .then(d => setOrders(d.orders ?? []));
  }, []);

  const revenue   = orders.reduce((s, o) => s + PLANS[o.plan].price, 0);
  const recur     = orders.reduce((s, o) => s + PLANS[o.plan].recur, 0);
  const deployed  = orders.filter(o => o.deployed).length;
  const enCours   = orders.length - deployed;
  const fmt = (n: number) => n.toLocaleString('fr-FR') + ' €';

  const openLogs = (id: string, label: string) => { setLogsOrderId(id); setLogsOrderLabel(label); };

  return (
    <div className="content fade-in">
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 16 }}>
        <StatsCard icon={IcRevenue} label="Revenue total"  value={fmt(revenue)} sub={recur ? `+ ${recur.toLocaleString('fr-FR')} €/mois` : 'paiements uniques'} accent="gold" />
        <StatsCard icon={IcOrders}  label="Commandes"      value={String(orders.length)} sub={`${enCours} en cours`} accent="blue" />
        <StatsCard icon={IcRocket}  label="Sites déployés" value={String(deployed)} sub={`sur ${orders.length} commandes`} accent="green" />
        <StatsCard icon={IcClock}   label="À déployer"     value={String(enCours)} sub="action requise" accent={enCours > 0 ? 'gold' : undefined} />
      </div>

      <div style={{ marginBottom: 12 }}>
        <div className="section-title">Commandes clients</div>
        <div className="section-hint">Clients ayant payé via Stripe</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {orders.map(o => <CommandeCard key={o.id} order={o} onLogs={openLogs} />)}
        {orders.length === 0 && (
          <div className="empty-state">
            <IcOrders /><div>Aucune commande pour l'instant</div>
          </div>
        )}
      </div>

      <LogsModal
        orderId={logsOrderId}
        orderLabel={logsOrderLabel}
        open={logsOrderId !== null}
        onClose={() => setLogsOrderId(null)}
      />
    </div>
  );
}
