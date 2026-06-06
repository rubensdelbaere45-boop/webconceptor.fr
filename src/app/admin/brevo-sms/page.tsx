'use client';

import { useEffect, useState } from 'react';

interface TestResult {
  sender_tested?: string;
  recipient?: string;
  account_info?: Record<string, unknown>;
  test_send?: Record<string, unknown>;
  diagnosis?: string;
  next_step?: string;
  brevo_dashboard_urls?: Record<string, string>;
}

interface RegisterResult {
  ok?: boolean;
  report?: Array<{ step: string; ok: boolean; detail: string }>;
  recommendation?: string;
  action_links?: Record<string, string>;
}

export default function BrevoSmsPage() {
  const [adminKey, setAdminKey] = useState('');
  const [phone, setPhone] = useState('0635592471');
  const [sender, setSender] = useState('WebConcept');
  const [testLoading, setTestLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [registerResult, setRegisterResult] = useState<RegisterResult | null>(null);

  useEffect(() => { setAdminKey(localStorage.getItem('admin_key') || ''); }, []);

  async function runTest() {
    if (!adminKey) { alert('Renseigne la clé admin'); return; }
    setTestLoading(true); setTestResult(null);
    try {
      const res = await fetch('/api/admin/brevo-sms-test', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phone, sender }),
      });
      setTestResult(await res.json());
    } catch (e) {
      setTestResult({ diagnosis: 'Erreur réseau: ' + String(e) });
    } finally {
      setTestLoading(false);
    }
  }

  async function runRegister() {
    if (!adminKey) { alert('Renseigne la clé admin'); return; }
    setRegisterLoading(true); setRegisterResult(null);
    try {
      const res = await fetch('/api/admin/brevo-sms-register-sender', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
      });
      setRegisterResult(await res.json());
    } catch (e) {
      setRegisterResult({ recommendation: 'Erreur réseau: ' + String(e) });
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 900 }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>📱 Brevo SMS — diagnostic & validation</h1>
      <p style={{ color: 'var(--txt-3)', fontSize: 13, marginBottom: 24 }}>
        Tom n&apos;arrive pas à trouver la page Senders SMS dans Brevo ? On contourne en testant l&apos;API directement.
      </p>

      <div style={{ background: 'var(--card)', padding: 16, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16 }}>
        <label style={{ fontSize: 12, color: 'var(--txt-3)', display: 'block', marginBottom: 6 }}>Clé admin</label>
        <input
          type="password"
          value={adminKey}
          onChange={(e) => { setAdminKey(e.target.value); localStorage.setItem('admin_key', e.target.value); }}
          style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--txt)', fontSize: 13 }}
        />
      </div>

      {/* ─── 1. Enregistrer sender via API ─── */}
      <div style={{ background: 'var(--card)', padding: 20, borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>1. Forcer enregistrement &quot;WebConcept&quot; via API Brevo</h2>
        <p style={{ fontSize: 12, color: 'var(--txt-3)', marginBottom: 12 }}>
          Tente l&apos;endpoint /v3/senders pour créer/lister les senders. Si Brevo refuse, recommande alternatives.
        </p>
        <button
          onClick={runRegister}
          disabled={registerLoading}
          style={{ background: registerLoading ? '#666' : 'var(--gold)', color: '#0a0a0a', padding: '10px 18px', borderRadius: 8, border: 'none', fontWeight: 700, cursor: registerLoading ? 'wait' : 'pointer', fontSize: 13 }}
        >
          {registerLoading ? 'Enregistrement…' : '⚡ Forcer création sender via API'}
        </button>
        {registerResult && (
          <div style={{ marginTop: 14, padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 12.5 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{registerResult.recommendation}</div>
            {(registerResult.report || []).map((r, i) => (
              <div key={i} style={{ marginBottom: 6 }}>
                <span style={{ marginRight: 6 }}>{r.ok ? '✅' : '❌'}</span>
                <b>{r.step}</b>
                <div style={{ fontSize: 11.5, color: 'var(--txt-3)', marginLeft: 22 }}>{r.detail}</div>
              </div>
            ))}
            {registerResult.action_links && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                {Object.entries(registerResult.action_links).map(([k, v]) => (
                  <a key={k} href={v} target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginRight: 12, color: 'var(--gold)', fontSize: 12 }}>↗ {k}</a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 2. Envoyer SMS test ─── */}
      <div style={{ background: 'var(--card)', padding: 20, borderRadius: 10, border: '1px solid var(--border)' }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>2. Envoyer un SMS test pour voir quel sender Brevo utilise</h2>
        <p style={{ fontSize: 12, color: 'var(--txt-3)', marginBottom: 12 }}>
          Si tu reçois le SMS sous &quot;WebConcept&quot; → c&apos;est validé.<br />
          Si sous &quot;BatiPilote&quot; ou un autre nom → pas encore validé.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt-3)', display: 'block', marginBottom: 4 }}>Numéro destinataire</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0635592471"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--txt)', fontSize: 13 }} />
          </div>
          <div>
            <label style={{ fontSize: 11, color: 'var(--txt-3)', display: 'block', marginBottom: 4 }}>Sender à tester (≤ 11 chars)</label>
            <input value={sender} onChange={(e) => setSender(e.target.value.slice(0, 11))} placeholder="WebConcept"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--txt)', fontSize: 13 }} />
          </div>
        </div>
        <button
          onClick={runTest}
          disabled={testLoading}
          style={{ background: testLoading ? '#666' : '#3b82f6', color: '#fff', padding: '10px 18px', borderRadius: 8, border: 'none', fontWeight: 700, cursor: testLoading ? 'wait' : 'pointer', fontSize: 13 }}
        >
          {testLoading ? 'Envoi…' : '📤 Envoyer SMS test'}
        </button>
        {testResult && (
          <div style={{ marginTop: 14, padding: 12, background: 'var(--bg)', borderRadius: 8, fontSize: 12.5 }}>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{testResult.diagnosis}</div>
            <div style={{ marginBottom: 10, fontSize: 12, color: 'var(--txt-3)' }}>{testResult.next_step}</div>
            <details>
              <summary style={{ cursor: 'pointer', fontSize: 11, color: 'var(--txt-3)' }}>Réponse Brevo complète</summary>
              <pre style={{ marginTop: 8, fontSize: 11, background: 'var(--card)', padding: 10, borderRadius: 6, overflowX: 'auto' }}>
                {JSON.stringify(testResult.test_send, null, 2)}
              </pre>
              <pre style={{ marginTop: 8, fontSize: 11, background: 'var(--card)', padding: 10, borderRadius: 6, overflowX: 'auto' }}>
                {JSON.stringify(testResult.account_info, null, 2)}
              </pre>
            </details>
          </div>
        )}
      </div>

      <div style={{ marginTop: 24, padding: 14, background: '#fef3c7', borderRadius: 8, fontSize: 12.5, color: '#92400e' }}>
        <b>💡 Solution garantie si Brevo te bloque :</b> on bascule sur <b>OVHcloud SMS</b> (1 €/mois, validation auto, sender alphanumeric autorisé sans demande, API REST simple). Dis-moi si tu veux que je code le switch — 30 min.
      </div>
    </div>
  );
}
