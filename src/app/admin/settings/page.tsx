// src/app/admin/settings/page.tsx
// Settings — Client Component
// Portage exact de prototype/settings.jsx

'use client';

import { useState } from 'react';
import { useToast } from '@/components/admin/ui';
import {
  IcKey, IcEye, IcEyeOff, IcCopy, IcSend, IcCheck,
  IcTerminal, IcTelegram,
} from '@/components/admin/icons';

// ── Types ────────────────────────────────────────────────────
interface ApiKey { id: string; label: string; value: string; env: string }
interface SysLog { t: string; lvl: 'ok' | 'info' | 'warn' | 'err'; msg: string }

// ── Données (à remplacer par fetch sécurisé) ─────────────────
// ⚠️ NE JAMAIS exposer les vraies clés côté client.
// Utiliser une Server Action ou GET /api/admin/settings/keys
// protégé par auth admin.
const API_KEYS_PLACEHOLDER: ApiKey[] = [
  { id: 'stitch',     label: 'Stitch API',      value: 'stch_live_••••••••••••••••',     env: 'STITCH_API_KEY'     },
  { id: 'brevo',      label: 'Brevo API',        value: 'xkeysib-••••••••••••••••',       env: 'BREVO_API_KEY'      },
  { id: 'stripe',     label: 'Stripe (secret)',  value: 'sk_live_••••••••••••••••',       env: 'STRIPE_SECRET_KEY'  },
  { id: 'openrouter', label: 'OpenRouter',       value: 'sk-or-v1-••••••••••••••••',     env: 'OPENROUTER_API_KEY' },
];

const SYS_LOGS_PLACEHOLDER: SysLog[] = [
  { t: '16:02', lvl: 'ok',   msg: 'Batch envoi terminé — 50 emails (Brevo)'          },
  { t: '15:47', lvl: 'info', msg: 'Scrapling : 23 nouveaux prospects enrichis'        },
  { t: '15:30', lvl: 'ok',   msg: 'Stitch : maquette générée — Salon Bellevue'        },
  { t: '14:58', lvl: 'warn', msg: 'Brevo : seuil crédits < 20 000 atteint'           },
  { t: '14:12', lvl: 'ok',   msg: 'N8N : workflow \'prospection-resto\' exécuté'      },
  { t: '13:40', lvl: 'err',  msg: 'SMS : échec envoi 06 12 ** ** 45 (numéro invalide)' },
  { t: '12:05', lvl: 'ok',   msg: 'Déploiement réussi — massage-pastel.fr'            },
];

// ── Composants ───────────────────────────────────────────────
function SettingsSection({
  icon: Icon, title, hint, children,
}: {
  icon: React.ElementType; title: string; hint?: string; children: React.ReactNode;
}) {
  return (
    <div className="card card-pad">
      <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 16 }}>
        <span style={{ width: 32, height: 32, borderRadius: 9, background: 'var(--card-2)', color: 'var(--txt-2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon style={{ width: 16, height: 16 }} />
        </span>
        <div>
          <div className="section-title">{title}</div>
          {hint && <div className="section-hint">{hint}</div>}
        </div>
      </div>
      {children}
    </div>
  );
}

function ApiKeyRow({ k }: { k: ApiKey }) {
  const toast = useToast();
  const [show, setShow] = useState(false);

  // En production : remplacer k.value par la vraie valeur récupérée depuis l'API
  const displayValue = show ? k.value : k.value.slice(0, 12) + '•'.repeat(16);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ width: 34, height: 34, borderRadius: 9, background: 'var(--gold-soft)', color: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <IcKey style={{ width: 16, height: 16 }} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{k.label}</div>
        <div style={{ fontSize: 11, color: 'var(--txt-3)', fontFamily: 'ui-monospace,monospace' }}>{k.env}</div>
      </div>
      <code style={{
        fontSize: 12.5, fontFamily: 'ui-monospace,monospace', color: 'var(--txt-2)',
        background: 'var(--card-2)', padding: '6px 11px', borderRadius: 8,
        border: '1px solid var(--border)', minWidth: 250, textAlign: 'left',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {displayValue}
      </code>
      <button className="icon-btn" style={{ width: 34, height: 34 }} title={show ? 'Masquer' : 'Révéler'} onClick={() => setShow(s => !s)}>
        {show ? <IcEyeOff style={{ width: 16, height: 16 }} /> : <IcEye style={{ width: 16, height: 16 }} />}
      </button>
      <button className="icon-btn" style={{ width: 34, height: 34 }} title="Copier"
        onClick={() => { navigator.clipboard.writeText(k.value); toast('Clé copiée', 'info'); }}>
        <IcCopy style={{ width: 15, height: 15 }} />
      </button>
    </div>
  );
}

// ── Page principale ──────────────────────────────────────────
export default function SettingsPage() {
  const toast = useToast();
  const [batch, setBatch]       = useState(50);
  const [botToken, setBotToken] = useState('');
  const [chatId, setChatId]     = useState('');
  const [showBot, setShowBot]   = useState(false);
  const [logs, setLogs]         = useState<SysLog[]>(SYS_LOGS_PLACEHOLDER);

  const saveSettings = async () => {
    await Promise.all([
      fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'batch_size', value: String(batch) }) }),
      fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'telegram_bot_token', value: botToken }) }),
      fetch('/api/admin/settings', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'telegram_chat_id', value: chatId }) }),
    ]);
    toast('Configuration sauvegardée');
  };

  const testTelegram = async () => {
    await fetch('/api/admin/telegram/test', { method: 'POST' });
    toast('Message test envoyé sur Telegram', 'info');
  };

  const logColors: Record<string, string> = { ok: '#4ade80', info: '#5b9bff', warn: '#fbbf24', err: '#f87171' };
  const logTags:   Record<string, string> = { ok: 'OK  ', info: 'INFO', warn: 'WARN', err: 'ERR ' };

  return (
    <div className="content fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 940 }}>

      {/* Clés API */}
      <SettingsSection icon={IcKey} title="Clés API" hint="Stockées en variables d'environnement — masquées par défaut">
        <div>
          {API_KEYS_PLACEHOLDER.map(k => <ApiKeyRow key={k.id} k={k} />)}
        </div>
        <p style={{ fontSize: 11.5, color: 'var(--txt-3)', marginTop: 12 }}>
          ⚠️ Les vraies valeurs sont dans <code style={{ fontFamily: 'ui-monospace,monospace', background: 'var(--card-2)', padding: '1px 6px', borderRadius: 4 }}>.env.local</code>. Ne jamais les exposer côté client.
        </p>
      </SettingsSection>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {/* Limites d'envoi */}
        <SettingsSection icon={IcSend} title="Limites d'envoi" hint="Contrôle des batchs Brevo">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="field">
              <label>Taille de batch <span className="hint">— {batch} emails / envoi</span></label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <input type="range" min="10" max="200" step="10" value={batch}
                  onChange={e => setBatch(Number(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--gold)' }} />
                <span style={{ fontWeight: 700, color: 'var(--gold)', minWidth: 34, textAlign: 'right' }}>{batch}</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 11 }}>
              <div style={{ flex: 1, background: 'var(--card-2)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Crédits Brevo</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--txt)', marginTop: 3 }}>18 056</div>
                <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 2 }}>expire le 17 juin</div>
              </div>
              <div style={{ flex: 1, background: 'var(--card-2)', borderRadius: 10, padding: '12px 14px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--txt-3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Crédits SMS</div>
                <div style={{ fontSize: 19, fontWeight: 800, color: 'var(--txt)', marginTop: 3 }}>191</div>
                <div style={{ fontSize: 11, color: 'var(--txt-3)', marginTop: 2 }}>via Brevo SMS</div>
              </div>
            </div>
          </div>
        </SettingsSection>

        {/* Telegram */}
        <SettingsSection icon={IcTelegram} title="Configuration Telegram" hint="Notifications paiements & alertes">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="field">
              <label>Bot Token</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="input" type={showBot ? 'text' : 'password'} value={botToken}
                  onChange={e => setBotToken(e.target.value)} placeholder="7841…:AAH-…"
                  style={{ flex: 1, fontFamily: 'ui-monospace,monospace', fontSize: 12 }} />
                <button className="icon-btn" style={{ flexShrink: 0 }} onClick={() => setShowBot(s => !s)}>
                  {showBot ? <IcEyeOff style={{ width: 16, height: 16 }} /> : <IcEye style={{ width: 16, height: 16 }} />}
                </button>
              </div>
            </div>
            <div className="field">
              <label>Chat ID</label>
              <input className="input" value={chatId} onChange={e => setChatId(e.target.value)}
                placeholder="-1002184559210"
                style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12 }} />
            </div>
            <div style={{ display: 'flex', gap: 9 }}>
              <button className="btn btn-ghost btn-sm" onClick={testTelegram}><IcSend />Tester</button>
              <button className="btn btn-gold btn-sm" onClick={saveSettings}><IcCheck />Enregistrer</button>
            </div>
          </div>
        </SettingsSection>
      </div>

      {/* Logs système */}
      <SettingsSection icon={IcTerminal} title="Logs système" hint="Activité récente des services">
        <div style={{ fontFamily: 'ui-monospace,monospace', fontSize: 12.5, background: '#0b0b0b', border: '1px solid var(--border)', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 7 }}>
          {logs.map((l, i) => (
            <div key={i} style={{ display: 'flex', gap: 11 }}>
              <span style={{ color: 'var(--txt-3)', flexShrink: 0 }}>{l.t}</span>
              <span style={{ color: logColors[l.lvl], fontWeight: 700, flexShrink: 0, width: 38 }}>{logTags[l.lvl]}</span>
              <span style={{ color: 'var(--txt-2)' }}>{l.msg}</span>
            </div>
          ))}
        </div>
      </SettingsSection>
    </div>
  );
}
