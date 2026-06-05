// Settings — clés API, limites, services
import { createClient } from "@supabase/supabase-js";
import { Key, Mail, Phone, ServerIcon } from "lucide-react";

export const dynamic = "force-dynamic";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

async function fetchSettings() {
  const supabase = db();
  const { data } = await supabase.from("settings").select("key, value");
  const map: Record<string, string> = {};
  (data ?? []).forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
  return map;
}

async function fetchCredits() {
  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": process.env.BREVO_API_KEY || "" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return { email: null, sms: null };
    const j = await res.json();
    const email = (j.plan || []).find((p: { credits?: number; type?: string }) => p.credits && p.type !== "sms")?.credits ?? null;
    const sms = (j.plan || []).find((p: { credits?: number; type?: string }) => p.credits && p.type === "sms")?.credits ?? null;
    return { email, sms };
  } catch { return { email: null, sms: null }; }
}

function maskKey(v: string | undefined): string {
  if (!v) return "—";
  return v.length > 12 ? `${v.slice(0, 6)}…${v.slice(-4)}` : "•••••";
}

const KEY_ROWS = [
  { label: "Brevo API",        env: "BREVO_API_KEY"        },
  { label: "Stripe Secret",    env: "STRIPE_SECRET_KEY"    },
  { label: "Stitch API",       env: "STITCH_API_KEY"       },
  { label: "OpenRouter",       env: "OPENROUTER_API_KEY"   },
  { label: "Google Maps",      env: "GOOGLE_MAPS_API_KEY"  },
  { label: "Supabase Service", env: "SUPABASE_SERVICE_ROLE_KEY" },
];

export default async function SettingsPage() {
  const [settings, credits] = await Promise.all([fetchSettings(), fetchCredits()]);

  return (
    <div style={{ padding: "28px 28px 60px", maxWidth: 1100, margin: "0 auto" }}>
      {/* Quotas */}
      <Section title="Quotas providers">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          <Card icon={Mail} label="Crédits Brevo emails" value={credits.email?.toLocaleString("fr") ?? "—"} sub="Expire le 17 juin" />
          <Card icon={Phone} label="Crédits Brevo SMS" value={credits.sms?.toLocaleString("fr") ?? "—"} />
        </div>
      </Section>

      {/* Clés API */}
      <Section title="Clés API (masquées)" hint="Modifiables uniquement via les variables d'environnement Vercel/Railway">
        <div style={{ display: "grid", gap: 8 }}>
          {KEY_ROWS.map((row) => {
            const val = process.env[row.env];
            return (
              <div key={row.env} style={{
                background: "var(--card)", border: "1px solid var(--border)",
                borderRadius: "var(--r-sm)", padding: "11px 14px",
                display: "grid", gridTemplateColumns: "1fr auto auto", gap: 12, alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{row.label}</div>
                  <div style={{ fontSize: 11, color: "var(--txt-3)", fontFamily: "ui-monospace, monospace" }}>{row.env}</div>
                </div>
                <div style={{ fontSize: 12, color: "var(--txt-2)", fontFamily: "ui-monospace, monospace", letterSpacing: 1 }}>
                  {maskKey(val)}
                </div>
                <span style={{
                  fontSize: 10.5, fontWeight: 600, padding: "3px 8px", borderRadius: 100,
                  background: val ? "rgba(22,163,74,.14)" : "rgba(220,38,38,.14)",
                  color: val ? "#4ade80" : "#fb7185",
                }}>{val ? "configurée" : "manquante"}</span>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Settings DB */}
      <Section title="Limites d'envoi">
        <div style={{
          background: "var(--card)", border: "1px solid var(--border)",
          borderRadius: "var(--r-sm)", padding: "14px 16px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Batch size (emails / run)</div>
            <div style={{ fontSize: 11.5, color: "var(--txt-3)" }}>Stocké dans table <code style={{ fontFamily: "ui-monospace, monospace" }}>settings.batch_size</code></div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{settings.batch_size ?? "130"}</div>
        </div>
      </Section>

      {/* Telegram */}
      <Section title="Telegram (notifications)">
        <div style={{ display: "grid", gap: 8 }}>
          <Row label="Chat ID" value={settings.telegram_chat_id || process.env.TELEGRAM_CHAT_ID || "—"} mono />
          <Row label="Bot token" value={maskKey(process.env.TELEGRAM_BOT_TOKEN)} mono />
        </div>
      </Section>
    </div>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</div>
        {hint && <div style={{ fontSize: 12, color: "var(--txt-3)", marginTop: 2 }}>{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function Card({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "14px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <Icon size={15} color="var(--txt-3)" />
        <span style={{ fontSize: 11.5, color: "var(--txt-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</span>
      </div>
      <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--txt-3)", marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r-sm)", padding: "11px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 12, color: "var(--txt-2)", fontFamily: mono ? "ui-monospace, monospace" : "inherit" }}>{value}</span>
    </div>
  );
}
