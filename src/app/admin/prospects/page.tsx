// src/app/admin/prospects/page.tsx
// Prospects — Client Component (filtres réactifs + slide panel)
// Portage exact de prototype/prospects.jsx

'use client';

import { useState, useEffect, useMemo } from 'react';
import { StatusBadge, Stars, MockupTag, MockupPreview, StepCard, useToast } from '@/components/admin/ui';
import {
  IcSearch, IcFilter, IcPhone, IcSend, IcChevron,
  IcEye, IcExternal, IcSms, IcRefresh, IcX,
} from '@/components/admin/icons';

// ── Types ────────────────────────────────────────────────────
type ProspectStatus = 'found' | 'sent' | 'opened' | 'replied' | 'paid';
type MockupKind = 'stitch' | 'template';

interface Prospect {
  id: string;
  name: string;
  city: string;
  type: string;
  rating: number;
  email: string;
  phone: string;
  status: ProspectStatus;
  mockup: MockupKind;
  mockup_url?: string;
}

// ── Config types business ────────────────────────────────────
const BUSINESS_TYPES = [
  { id: 'restaurant',  label: 'Restaurant',      icon: '🍽️' },
  { id: 'boulangerie', label: 'Boulangerie',      icon: '🥐' },
  { id: 'institut',    label: 'Institut beauté',  icon: '💅' },
  { id: 'electricien', label: 'Électricien',      icon: '⚡' },
  { id: 'plombier',    label: 'Plombier',         icon: '🔧' },
  { id: 'garage',      label: 'Garage',           icon: '🚗' },
  { id: 'osteo',       label: 'Ostéo',            icon: '🦴' },
  { id: 'coiffeur',    label: 'Coiffeur',         icon: '✂️' },
  { id: 'glacier',     label: 'Glacier',          icon: '🍦' },
  { id: 'dentiste',    label: 'Dentiste',         icon: '🦷' },
  { id: 'fleuriste',   label: 'Fleuriste',        icon: '🌷' },
  { id: 'autoecole',   label: 'Auto-école',       icon: '🚙' },
];

const STATUS_OPTIONS: { value: ProspectStatus | 'all'; label: string }[] = [
  { value: 'all',     label: 'Tous'     },
  { value: 'found',   label: 'Trouvé'   },
  { value: 'sent',    label: 'Envoyé'   },
  { value: 'opened',  label: 'Ouvert'   },
  { value: 'replied', label: 'Répondu'  },
  { value: 'paid',    label: 'Payé'     },
];

const BREVO_CREDITS = 18056; // TODO: récupérer depuis l'API Brevo

// ── InfoCell (dans le slide panel) ──────────────────────────
function InfoCell({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--txt-3)', marginBottom: 3, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</div>
      <div style={{ fontSize: 12.5, fontWeight: 500, fontFamily: mono ? 'ui-monospace,monospace' : 'inherit', wordBreak: 'break-all' }}>{value}</div>
    </div>
  );
}

// ── ProspectPanel (slide depuis la droite) ───────────────────
// ⚠️ CRITIQUE : le bouton Appeler DOIT être un <a href="tel:..."> pas un <button>
function ProspectPanel({ prospect, onClose }: { prospect: Prospect | null; onClose: () => void }) {
  const toast = useToast();
  if (!prospect) return null;
  const t = BUSINESS_TYPES.find(x => x.id === prospect.type);

  return (
    <>
      <div className="overlay" onClick={onClose} />
      <div className="slidepanel">
        {/* En-tête */}
        <div style={{ padding: '18px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 5 }}>
              <span style={{ fontSize: 18 }}>{t?.icon ?? '🏢'}</span>
              <h2 style={{ fontSize: 17, fontWeight: 700, letterSpacing: '-0.02em' }}>{prospect.name}</h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--txt-3)', fontSize: 12.5 }}>
              <span>{prospect.city}</span><span>·</span>
              <span>{t?.label ?? prospect.type}</span><span>·</span>
              <Stars value={prospect.rating} />
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} style={{ flexShrink: 0 }}><IcX /></button>
        </div>

        <div style={{ overflowY: 'auto', flex: 1, padding: 20, display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <StatusBadge status={prospect.status} />
            <MockupTag kind={prospect.mockup} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <InfoCell label="Email"    value={prospect.email}          mono />
            <InfoCell label="Téléphone" value={prospect.phone}         mono />
            <InfoCell label="Ville"    value={prospect.city} />
            <InfoCell label="Note Google" value={prospect.rating.toFixed(1) + ' ★'} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 9 }}>
              <span className="section-title" style={{ fontSize: 13, whiteSpace: 'nowrap' }}>Maquette générée</span>
              <button className="btn btn-sm btn-ghost" onClick={() => { if (prospect.mockup_url) window.open(prospect.mockup_url); else toast('Pas d\'URL de maquette', 'info'); }}>
                <IcExternal />Plein écran
              </button>
            </div>
            <MockupPreview name={prospect.name} mockupKind={prospect.mockup} mockupUrl={prospect.mockup_url} height={210} />
          </div>
        </div>

        {/* Boutons d'action */}
        <div style={{ padding: 16, borderTop: '1px solid var(--border)', background: 'var(--panel)', display: 'flex', flexDirection: 'column', gap: 9 }}>
          <div style={{ display: 'flex', gap: 9 }}>
            <button className="btn btn-sm btn-gold" style={{ flex: 1 }}
              onClick={() => { if (prospect.mockup_url) window.open(prospect.mockup_url); else toast('Pas d\'URL de maquette', 'info'); }}>
              <IcExternal />Voir maquette
            </button>
            <button className="btn btn-sm btn-ghost" style={{ flex: 1 }}
              onClick={async () => {
                await fetch(`/api/admin/prospects/${prospect.id}/resend`, { method: 'POST' });
                toast('Email renvoyé à ' + prospect.name);
              }}>
              <IcSend />Renvoyer email
            </button>
          </div>
          <div style={{ display: 'flex', gap: 9 }}>
            {/*
              ⚠️ CLICK-TO-CALL : DOIT être un <a href="tel:..."> pas un <button>
              Ceci déclenche l'application téléphone native (mobile + desktop)
            */}
            <a
              className="btn btn-sm btn-gold"
              style={{ flex: 1 }}
              href={`tel:${prospect.phone.replace(/\s/g, '')}`}
            >
              <IcPhone />{prospect.phone}
            </a>
            <button className="btn btn-sm btn-ghost" style={{ flex: 1 }}
              onClick={async () => {
                await fetch(`/api/admin/prospects/${prospect.id}/sms`, { method: 'POST' });
                toast('SMS envoyé');
              }}>
              <IcSms />Envoyer SMS
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── Page principale ──────────────────────────────────────────
export default function ProspectsPage() {
  const toast = useToast();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [query, setQuery]         = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeF, setTypeF]         = useState('all');
  const [statusF, setStatusF]     = useState<ProspectStatus | 'all'>('all');
  const [sel, setSel]             = useState<Prospect | null>(null);
  const [batch, setBatch]         = useState(50);
  const [searching, setSearching] = useState(false);
  const [sending, setSending]     = useState(false);

  const reload = async () => {
    const r = await fetch('/api/admin/prospects');
    const d = await r.json();
    setProspects(d.prospects ?? []);
  };

  // Charger les prospects depuis Supabase via fetch (ou server action)
  useEffect(() => {
    fetch('/api/admin/prospects')
      .then(r => r.json())
      .then(d => setProspects(d.prospects ?? []));
  }, []);

  // Fermeture panel avec Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setSel(null); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Compter par type
  const typeCounts = useMemo(() => {
    const m: Record<string, number> = {};
    prospects.forEach(p => { m[p.type] = (m[p.type] ?? 0) + 1; });
    return m;
  }, [prospects]);

  // Filtres front-end
  const filtered = useMemo(() => prospects.filter(p => {
    if (typeF !== 'all' && p.type !== typeF) return false;
    if (statusF !== 'all' && p.status !== statusF) return false;
    if (query) {
      const q = query.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.city.toLowerCase().includes(q) && !p.email.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [prospects, query, typeF, statusF]);

  const runSearch = async () => {
    if (!searchQuery.trim()) {
      toast('Saisis une requête (ex: "plombier Lyon")', 'err');
      return;
    }
    setSearching(true);
    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || 'Erreur scraping', 'err');
      } else {
        const found = data.results?.inserted ?? data.inserted ?? 0;
        toast(`Recherche terminée — ${found} nouveau${found > 1 ? 'x' : ''} prospect${found > 1 ? 's' : ''}`);
        await reload();
      }
    } catch {
      toast('Erreur réseau', 'err');
    } finally {
      setSearching(false);
    }
  };

  const runSend = async () => {
    setSending(true);
    try {
      await fetch('/api/admin/send-batch', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ batchSize: batch }) });
      toast(`${batch} emails envoyés via Brevo`);
    } finally {
      setSending(false);
    }
  };

  const fmt = (n: number) => n.toLocaleString('fr-FR');

  return (
    <div className="content fade-in">
      {/* ── Étapes 1 & 2 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <StepCard step="1" title="Chercher des prospects" hint="Scrapling enrichit automatiquement (note, email, téléphone)">
          <div style={{ display: 'flex', gap: 9 }}>
            <input
              className="input"
              placeholder="ex : restaurant Lyon, institut beauté Albi…"
              style={{ flex: 1 }}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !searching) runSearch(); }}
              disabled={searching}
            />
            <button className="btn btn-gold" onClick={runSearch} disabled={searching} style={{ minWidth: 130 }}>
              {searching
                ? <><IcRefresh style={{ animation: 'spin 1s linear infinite' }} />Recherche…</>
                : <><IcSearch />Lancer</>}
            </button>
          </div>
        </StepCard>

        <StepCard step="2" title="Envoyer les maquettes" hint={`${fmt(BREVO_CREDITS)} crédits Brevo restants · expire 17 juin`}>
          <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1 }}>
              <span style={{ fontSize: 12.5, color: 'var(--txt-2)', whiteSpace: 'nowrap' }}>Batch</span>
              <input type="range" min="10" max="200" step="10" value={batch}
                onChange={e => setBatch(Number(e.target.value))}
                style={{ flex: 1, accentColor: 'var(--gold)' }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--gold)', minWidth: 34, textAlign: 'right' }}>{batch}</span>
            </div>
            <button className="btn btn-gold" onClick={runSend} disabled={sending} style={{ minWidth: 130 }}>
              {sending
                ? <><IcRefresh style={{ animation: 'spin 1s linear infinite' }} />Envoi…</>
                : <><IcSend />Envoyer</>}
            </button>
          </div>
        </StepCard>
      </div>

      {/* ── Filtres ── */}
      <div className="card" style={{ marginBottom: 14, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderBottom: '1px solid var(--border)' }}>
          <div className="topbar-search" style={{ margin: 0, width: 320 }}>
            <IcSearch />
            <input placeholder="Rechercher nom, ville, email…" value={query} onChange={e => setQuery(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 7, marginLeft: 'auto', flexWrap: 'wrap' }}>
            {STATUS_OPTIONS.map(o => (
              <button key={o.value} className={`pill ${statusF === o.value ? 'active' : ''}`}
                onClick={() => setStatusF(o.value as ProspectStatus | 'all')}
                style={{ padding: '5px 12px' }}>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 7, padding: '12px 16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button className={`pill ${typeF === 'all' ? 'active' : ''}`} onClick={() => setTypeF('all')}>
            <IcFilter style={{ width: 13, height: 13 }} />Tous types
            <span className="cnt">{prospects.length}</span>
          </button>
          {BUSINESS_TYPES.filter(t => typeCounts[t.id]).map(t => (
            <button key={t.id} className={`pill ${typeF === t.id ? 'active' : ''}`} onClick={() => setTypeF(t.id)}>
              <span>{t.icon}</span>{t.label}
              <span className="cnt">{typeCounts[t.id]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', padding: '13px 16px' }}>
          <span style={{ fontSize: 13, color: 'var(--txt-3)' }}>
            <b style={{ color: 'var(--txt)' }}>{fmt(filtered.length)}</b> prospect{filtered.length > 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="tbl">
            <thead>
              <tr>
                <th>Nom</th><th>Ville</th><th>Type</th><th>Note</th><th>Email</th>
                <th>Status</th><th>Maquette</th><th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 40).map(p => {
                const bt = BUSINESS_TYPES.find(x => x.id === p.type);
                return (
                  <tr key={p.id} className={sel?.id === p.id ? 'sel' : ''} onClick={() => setSel(p)}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td style={{ color: 'var(--txt-2)' }}>{p.city}</td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--txt-2)' }}>
                        {bt?.icon} {bt?.label ?? p.type}
                      </span>
                    </td>
                    <td><Stars value={p.rating} /></td>
                    <td style={{ color: 'var(--txt-3)', fontFamily: 'ui-monospace,monospace', fontSize: 12 }}>{p.email}</td>
                    <td><StatusBadge status={p.status} /></td>
                    <td><MockupTag kind={p.mockup} /></td>
                    <td onClick={e => e.stopPropagation()} style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        {/* ⚠️ Click-to-call : <a> obligatoire, pas <button> */}
                        <a className="icon-btn" style={{ width: 30, height: 30, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                           title={p.phone} href={`tel:${p.phone.replace(/\s/g, '')}`}>
                          <IcPhone style={{ width: 14, height: 14 }} />
                        </a>
                        <button className="icon-btn" style={{ width: 30, height: 30 }} title="Renvoyer email"
                          onClick={async () => { await fetch(`/api/admin/prospects/${p.id}/resend`, { method: 'POST' }); toast('Email renvoyé'); }}>
                          <IcSend style={{ width: 14, height: 14 }} />
                        </button>
                        <button className="icon-btn" style={{ width: 30, height: 30 }} title="Détails" onClick={() => setSel(p)}>
                          <IcChevron style={{ width: 14, height: 14 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <IcSearch /><div>Aucun prospect ne correspond à ces filtres</div>
            </div>
          )}
        </div>
      </div>

      <ProspectPanel prospect={sel} onClose={() => setSel(null)} />
    </div>
  );
}
