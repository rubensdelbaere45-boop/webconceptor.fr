'use client';

import { useEffect, useState } from 'react';

interface Ebook {
  id: string;
  title: string;
  subtitle: string | null;
  author_pseudo: string;
  niche_topic: string;
  niche_angle: string | null;
  status: string;
  kdp_price_eur: number | null;
  kdp_royalty_percent: number | null;
  total_words: number | null;
  estimated_pages: number | null;
  pdf_url: string | null;
  cover_url: string | null;
  cover_source: string | null;
  sent_at: string | null;
  published_on_kdp: boolean;
  total_sales: number;
  total_revenue_eur: number;
  created_at: string;
}

interface SetupResult {
  ok: boolean;
  report: Array<{ step: string; ok: boolean; detail?: string }>;
  next_steps: string[];
}

export default function EbooksAdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<Record<string, unknown> | null>(null);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);

  useEffect(() => { setAdminKey(localStorage.getItem('admin_key') || ''); }, []);

  async function loadEbooks() {
    if (!adminKey) return;
    try {
      const res = await fetch('/api/admin/ebooks', { headers: { 'x-admin-key': adminKey } });
      if (res.ok) {
        const data = await res.json();
        setEbooks(data.ebooks || []);
      }
    } catch {}
  }
  useEffect(() => { loadEbooks(); /* eslint-disable-next-line */ }, [adminKey]);

  async function runSetup() {
    if (!adminKey) { alert('Renseigne la clé admin'); return; }
    setSetupLoading(true); setSetupResult(null);
    try {
      const res = await fetch('/api/admin/setup-ebook-pipeline', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey },
      });
      setSetupResult(await res.json());
    } catch (e) {
      setSetupResult({ ok: false, report: [{ step: 'network', ok: false, detail: String(e) }], next_steps: [] });
    } finally {
      setSetupLoading(false);
    }
  }

  async function generateNow(angle: 'histoire' | 'actualite') {
    if (!adminKey) { alert('Renseigne la clé admin'); return; }
    setGenLoading(true); setGenResult(null);
    try {
      const res = await fetch('/api/ebook/generate-one', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_angle: angle }),
      });
      setGenResult(await res.json());
      await loadEbooks();
    } catch (e) {
      setGenResult({ error: String(e) });
    } finally {
      setGenLoading(false);
    }
  }

  const totalSales = ebooks.reduce((s, e) => s + (e.total_sales || 0), 0);
  const totalRevenue = ebooks.reduce((s, e) => s + (Number(e.total_revenue_eur) || 0), 0);
  const publishedCount = ebooks.filter(e => e.published_on_kdp).length;

  return (
    <div style={{ padding: 24, maxWidth: 1200 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>📚 E-books KDP — pipeline auto</h1>
      <p style={{ color: 'var(--txt-3)', fontSize: 13, marginBottom: 24 }}>
        2 livres générés chaque matin (1 histoire + 1 actualité), envoyés par email avec tous les champs KDP prêts à coller.
        Cible : 200€/mois (≈ 60 ventes à 5€ de royalty).
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        <StatBox label="Livres générés" value={String(ebooks.length)} />
        <StatBox label="Publiés KDP" value={String(publishedCount)} color="#10b981" />
        <StatBox label="Ventes" value={String(totalSales)} />
        <StatBox label="Revenu" value={`${totalRevenue.toFixed(2)} €`} color="#f59e0b" />
      </div>

      {/* Clé admin */}
      <div style={{ background: 'var(--card)', padding: 16, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: 'var(--txt-3)', display: 'block', marginBottom: 6 }}>Clé admin (x-admin-key)</label>
        <input
          type="password"
          value={adminKey}
          onChange={(e) => { setAdminKey(e.target.value); localStorage.setItem('admin_key', e.target.value); }}
          placeholder="Rubens2026-WebConceptor"
          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--txt)', fontSize: 13 }}
        />
      </div>

      {/* Setup */}
      <div style={{ background: 'var(--card)', padding: 20, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>1. Setup pipeline (1 clic)</h2>
        <p style={{ fontSize: 12, color: 'var(--txt-3)', marginBottom: 12 }}>
          Crée table + bucket Supabase, importe workflow N8N, active le cron 6h, teste LLM/Brevo.
        </p>
        <button
          onClick={runSetup}
          disabled={setupLoading}
          style={{ background: setupLoading ? '#666' : 'var(--gold)', color: '#0a0a0a', padding: '10px 18px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: setupLoading ? 'wait' : 'pointer', fontSize: 13 }}
        >
          {setupLoading ? 'Setup en cours...' : '🚀 Setup pipeline'}
        </button>
        {setupResult && (
          <div style={{ marginTop: 16, padding: 14, background: 'var(--bg)', borderRadius: 8, fontSize: 12.5 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: setupResult.ok ? '#22c55e' : '#ef4444' }}>
              {setupResult.ok ? '✅ Pipeline opérationnel' : '⚠️ Setup partiel'}
            </div>
            {setupResult.report.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span>{r.ok ? '✅' : '❌'}</span>
                <span style={{ fontWeight: 600 }}>{r.step}</span>
                <span style={{ color: 'var(--txt-3)' }}>— {r.detail}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Génération manuelle */}
      <div style={{ background: 'var(--card)', padding: 20, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>2. Générer 1 e-book maintenant (test)</h2>
        <p style={{ fontSize: 12, color: 'var(--txt-3)', marginBottom: 12 }}>
          ~3-5 min de génération. Email envoyé automatiquement à la fin.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => generateNow('histoire')}
            disabled={genLoading}
            style={{ background: genLoading ? '#666' : '#8b5cf6', color: '#fff', padding: '10px 18px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: genLoading ? 'wait' : 'pointer', fontSize: 13 }}
          >
            {genLoading ? 'Génération...' : '📜 Livre Histoire'}
          </button>
          <button
            onClick={() => generateNow('actualite')}
            disabled={genLoading}
            style={{ background: genLoading ? '#666' : '#dc2626', color: '#fff', padding: '10px 18px', borderRadius: 8, border: 'none', fontWeight: 600, cursor: genLoading ? 'wait' : 'pointer', fontSize: 13 }}
          >
            {genLoading ? 'Génération...' : '📰 Livre Actualité'}
          </button>
        </div>
        {genResult ? (
          <pre style={{ marginTop: 14, padding: 12, background: 'var(--bg)', borderRadius: 6, fontSize: 11, overflowX: 'auto' }}>{JSON.stringify(genResult, null, 2)}</pre>
        ) : null}
      </div>

      {/* Liste */}
      <div style={{ background: 'var(--card)', padding: 20, borderRadius: 10, border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>3. E-books générés ({ebooks.length})</h2>
        {ebooks.length === 0 ? (
          <div style={{ color: 'var(--txt-3)', fontSize: 13 }}>Aucun livre encore. Lance le setup, puis attends 6h Paris ou clique "Générer".</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>Titre</th>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>Angle</th>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>Pages</th>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>Prix</th>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>Fichiers</th>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>KDP</th>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>Ventes</th>
              </tr>
            </thead>
            <tbody>
              {ebooks.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 4px', maxWidth: 240 }}>
                    <b>{e.title}</b>
                    <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>{e.author_pseudo}</div>
                    <div style={{ fontSize: 11, color: 'var(--txt-3)' }}>{e.niche_topic}</div>
                  </td>
                  <td style={{ padding: '8px 4px' }}>
                    {e.niche_angle === 'actualite' ? '📰' : '📜'} {e.niche_angle}
                  </td>
                  <td style={{ padding: '8px 4px' }}>{e.estimated_pages ?? '—'}</td>
                  <td style={{ padding: '8px 4px' }}>{e.kdp_price_eur ? `${e.kdp_price_eur}€` : '—'}</td>
                  <td style={{ padding: '8px 4px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: e.status === 'ready' ? '#22c55e22' : e.status === 'writing' ? '#3b82f622' : '#ef444422' }}>
                      {e.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 4px', whiteSpace: 'nowrap' }}>
                    {e.pdf_url ? <a href={e.pdf_url} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)', marginRight: 8 }}>📄</a> : '—'}
                    {e.cover_url ? <a href={e.cover_url} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>🖼️</a> : ''}
                  </td>
                  <td style={{ padding: '8px 4px' }}>{e.published_on_kdp ? '✅' : '—'}</td>
                  <td style={{ padding: '8px 4px' }}>{e.total_sales} · {Number(e.total_revenue_eur).toFixed(2)}€</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ background: 'var(--card)', padding: 14, borderRadius: 8, border: '1px solid var(--border)' }}>
      <div style={{ fontSize: 11, color: 'var(--txt-3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4, color: color || 'var(--txt)' }}>{value}</div>
    </div>
  );
}
