'use client';

import { useEffect, useState } from 'react';

interface SetupResult {
  ok: boolean;
  report: Array<{ step: string; ok: boolean; detail?: string }>;
  next_steps: string[];
}

interface MockupVideo {
  id: string;
  video_id: string;
  business_name: string;
  business_type: string | null;
  city: string | null;
  niche: string | null;
  status: string;
  download_url: string | null;
  posted_to_tiktok: boolean;
  created_at: string;
}

export default function TikTokAdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [setupResult, setSetupResult] = useState<SetupResult | null>(null);
  const [setupLoading, setSetupLoading] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genResult, setGenResult] = useState<unknown>(null);
  const [videos, setVideos] = useState<MockupVideo[]>([]);

  // Charge la clé depuis localStorage
  useEffect(() => {
    const saved = localStorage.getItem('admin_key') || '';
    setAdminKey(saved);
  }, []);

  // Charge la liste des vidéos
  async function loadVideos() {
    if (!adminKey) return;
    try {
      const res = await fetch('/api/admin/mockup-videos', { headers: { 'x-admin-key': adminKey } });
      if (res.ok) {
        const data = await res.json();
        setVideos(data.videos || []);
      }
    } catch { /* silent */ }
  }

  useEffect(() => { loadVideos(); /* eslint-disable-next-line */ }, [adminKey]);

  async function runSetup() {
    if (!adminKey) { alert('Renseigne la clé admin'); return; }
    setSetupLoading(true);
    setSetupResult(null);
    try {
      const res = await fetch('/api/admin/setup-tiktok-pipeline', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      setSetupResult(data);
    } catch (e) {
      setSetupResult({ ok: false, report: [{ step: 'network', ok: false, detail: String(e) }], next_steps: [] });
    } finally {
      setSetupLoading(false);
    }
  }

  async function generateOne(niche: 'creation' | 'transformation') {
    if (!adminKey) { alert('Renseigne la clé admin'); return; }
    setGenLoading(true);
    setGenResult(null);
    try {
      const res = await fetch('/api/admin/generate-tiktok-video', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ niche }),
      });
      const data = await res.json();
      setGenResult(data);
      await loadVideos();
    } catch (e) {
      setGenResult({ error: String(e) });
    } finally {
      setGenLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 1100 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>TikTok — Génération auto vidéos</h1>
      <p style={{ color: 'var(--txt-3)', fontSize: 13, marginBottom: 24 }}>
        Pipeline qui génère des vidéos courtes "création de site pour artisan fictif" 3×/jour.
        Tu reçois le MP4 par Telegram, tu uploads sur TikTok depuis ton iPhone aux heures de prime (12h, 19h, 21h).
      </p>

      {/* Clé admin */}
      <div style={{ background: 'var(--card)', padding: 16, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20 }}>
        <label style={{ fontSize: 12, color: 'var(--txt-3)', display: 'block', marginBottom: 6 }}>Clé admin (x-admin-key)</label>
        <input
          type="password"
          value={adminKey}
          onChange={(e) => { setAdminKey(e.target.value); localStorage.setItem('admin_key', e.target.value); }}
          placeholder="Rubens2026-Klyora Sites"
          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--txt)', fontSize: 13 }}
        />
      </div>

      {/* Setup */}
      <div style={{ background: 'var(--card)', padding: 20, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>1. Setup pipeline (1 clic)</h2>
        <p style={{ fontSize: 12, color: 'var(--txt-3)', marginBottom: 12 }}>
          Crée la table DB, importe le workflow N8N, active le cron, teste short-video-maker.
        </p>
        <button
          onClick={runSetup}
          disabled={setupLoading}
          style={{
            background: setupLoading ? '#666' : 'var(--gold)', color: '#0a0a0a',
            padding: '10px 18px', borderRadius: 8, border: 'none', fontWeight: 600,
            cursor: setupLoading ? 'wait' : 'pointer', fontSize: 13,
          }}
        >
          {setupLoading ? 'Setup en cours...' : '🚀 Setup pipeline'}
        </button>

        {setupResult && (
          <div style={{ marginTop: 16, padding: 14, background: 'var(--bg)', borderRadius: 8, fontSize: 12.5 }}>
            <div style={{ fontWeight: 600, marginBottom: 8, color: setupResult.ok ? '#22c55e' : '#ef4444' }}>
              {setupResult.ok ? '✅ Pipeline opérationnel' : '⚠️ Setup partiel — fix nécessaire'}
            </div>
            {setupResult.report.map((r, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <span>{r.ok ? '✅' : '❌'}</span>
                <span style={{ fontWeight: 600 }}>{r.step}</span>
                <span style={{ color: 'var(--txt-3)' }}>— {r.detail}</span>
              </div>
            ))}
            {setupResult.next_steps.length > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, marginBottom: 6 }}>Prochaines étapes :</div>
                {setupResult.next_steps.map((s, i) => <div key={i}>→ {s}</div>)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Génération manuelle */}
      <div style={{ background: 'var(--card)', padding: 20, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>2. Générer 1 vidéo maintenant</h2>
        <p style={{ fontSize: 12, color: 'var(--txt-3)', marginBottom: 12 }}>
          Test manuel. Une entreprise fictive sera générée. La vidéo prend ~3-5 min à rendre.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => generateOne('creation')}
            disabled={genLoading}
            style={{
              background: genLoading ? '#666' : '#3b82f6', color: '#fff',
              padding: '10px 18px', borderRadius: 8, border: 'none', fontWeight: 600,
              cursor: genLoading ? 'wait' : 'pointer', fontSize: 13,
            }}
          >
            {genLoading ? 'Génération...' : 'Création (nouvelle entreprise)'}
          </button>
          <button
            onClick={() => generateOne('transformation')}
            disabled={genLoading}
            style={{
              background: genLoading ? '#666' : '#8b5cf6', color: '#fff',
              padding: '10px 18px', borderRadius: 8, border: 'none', fontWeight: 600,
              cursor: genLoading ? 'wait' : 'pointer', fontSize: 13,
            }}
          >
            Transformation (avant/après)
          </button>
        </div>
        {genResult ? (
          <pre style={{ marginTop: 14, padding: 12, background: 'var(--bg)', borderRadius: 6, fontSize: 11, overflowX: 'auto' }}>
            {JSON.stringify(genResult, null, 2)}
          </pre>
        ) : null}
      </div>

      {/* Historique vidéos */}
      <div style={{ background: 'var(--card)', padding: 20, borderRadius: 10, border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>3. Vidéos générées ({videos.length})</h2>
        {videos.length === 0 ? (
          <div style={{ color: 'var(--txt-3)', fontSize: 13 }}>Aucune vidéo encore. Lance le setup ou génère-en une.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>Entreprise</th>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>Type</th>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>Niche</th>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>Statut</th>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>MP4</th>
                <th style={{ textAlign: 'left', padding: '8px 4px' }}>TikTok</th>
              </tr>
            </thead>
            <tbody>
              {videos.map((v) => (
                <tr key={v.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 4px' }}><b>{v.business_name}</b><div style={{ fontSize: 11, color: 'var(--txt-3)' }}>{v.city}</div></td>
                  <td style={{ padding: '8px 4px' }}>{v.business_type}</td>
                  <td style={{ padding: '8px 4px' }}>{v.niche}</td>
                  <td style={{ padding: '8px 4px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, background: v.status === 'ready' ? '#22c55e22' : v.status === 'failed' ? '#ef444422' : '#eab30822' }}>
                      {v.status}
                    </span>
                  </td>
                  <td style={{ padding: '8px 4px' }}>
                    {v.download_url ? <a href={v.download_url} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>⬇ télécharger</a> : '—'}
                  </td>
                  <td style={{ padding: '8px 4px' }}>{v.posted_to_tiktok ? '✅' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
