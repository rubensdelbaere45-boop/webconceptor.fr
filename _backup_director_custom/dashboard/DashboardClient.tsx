"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Account {
  id: string;
  email: string;
  business_name: string | null;
  tokens_balance: number;
}
interface Pack {
  id: string;
  name: string;
  credits: number;
  price_eur: number;
  bonus_credits: number;
  stripe_price_id: string | null;
}
interface Action {
  id: string;
  action_type: string;
  tokens_delta: number;
  details: Record<string, unknown> | null;
  created_at: string;
}

interface ServiceCard {
  id: string;
  icon: string;
  name: string;
  description: string;
  tokens_cost: number;
  cta: string;
}

const SERVICES: ServiceCard[] = [
  { id: "campaign_google_ads",  icon: "🎯", name: "Google Ads",         description: "Campagne ciblée locale, ROI tracé, 7 jours de boost.", tokens_cost: 100, cta: "Lancer" },
  { id: "campaign_meta_ads",    icon: "📱", name: "Meta Ads",            description: "Pubs Insta + Facebook géolocalisées sur votre zone.", tokens_cost: 100, cta: "Lancer" },
  { id: "agent_reputation",     icon: "⭐", name: "Agent Réputation",    description: "Sollicite vos clients pour avis Google, répond aux négatifs.", tokens_cost: 60, cta: "Activer" },
  { id: "agent_seo",            icon: "🔍", name: "Agent SEO local",     description: "Optimisation fiche Google Business + posts hebdo.", tokens_cost: 80, cta: "Activer" },
  { id: "agent_chatbot",        icon: "💬", name: "Agent Chatbot site",  description: "Répond aux questions clients 24/7, capture leads.", tokens_cost: 70, cta: "Activer" },
  { id: "campaign_local",       icon: "🏘️", name: "Pack Local",          description: "Google Ads + Meta + Agent SEO en bundle.", tokens_cost: 200, cta: "Tout lancer" },
];

export default function DashboardClient({ account, packs, actions }: { account: Account; packs: Pack[]; actions: Action[] }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [busyService, setBusyService] = useState<string | null>(null);
  const [showRecharge, setShowRecharge] = useState(sp.get("recharge") === "true");
  const [flash, setFlash] = useState<string | null>(sp.get("launched"));

  // Auto-dismiss flash after 4s
  if (flash) setTimeout(() => setFlash(null), 4000);

  async function launchService(s: ServiceCard) {
    if (account.tokens_balance < s.tokens_cost) {
      setShowRecharge(true);
      return;
    }
    setBusyService(s.id);
    try {
      const res = await fetch("/api/director/launch-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: s.id, tokens_cost: s.tokens_cost }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.need_credits) { setShowRecharge(true); return; }
        alert(data.error || "Erreur");
        return;
      }
      router.refresh();
    } finally {
      setBusyService(null);
    }
  }

  async function recharge(pack: Pack) {
    try {
      const res = await fetch("/api/director/checkout-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack_id: pack.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch { /* ignore */ }
  }

  async function logout() {
    await fetch("/api/director/auth/logout", { method: "POST" });
    router.push("/director/login");
  }

  return (
    <div className="d-container">
      {/* Top bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--d-gold)" }}>
            WEBDIRECTOR
          </div>
          <h1 className="d-display" style={{ fontSize: 26, margin: "4px 0 0" }}>
            {account.business_name || "Tableau de bord"}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div className="d-credits-orb" style={{ width: 80, height: 80 }}>
            <div className="num" style={{ fontSize: 22 }}>{account.tokens_balance}</div>
            <div className="label" style={{ fontSize: 8 }}>CR.</div>
          </div>
          <button className="d-btn-primary" style={{ fontSize: 12, padding: "10px 20px" }} onClick={() => setShowRecharge(true)}>
            + Recharger
          </button>
          <button className="d-btn-ghost" style={{ fontSize: 12, padding: "9px 16px" }} onClick={logout}>
            Quitter
          </button>
        </div>
      </div>

      {/* Flash de succès */}
      {flash && (
        <div className="d-success-pulse" style={{ background: "linear-gradient(135deg, rgba(0,230,118,0.20) 0%, rgba(0,230,118,0.05) 100%)", border: "1px solid rgba(0,230,118,0.40)", padding: "16px 22px", borderRadius: "var(--d-radius-md)", color: "var(--d-win)", marginBottom: 24, fontSize: 15, fontWeight: 600 }}>
          ✅ Action lancée : <strong>{flash}</strong>. Vous recevrez la confirmation par email sous 24h.
        </div>
      )}

      {/* Modal recharge */}
      {showRecharge && (
        <div onClick={() => setShowRecharge(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 }}>
          <div className="d-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720, width: "100%", padding: 32 }}>
            <div style={{ textAlign: "center", marginBottom: 28 }}>
              <h2 className="d-display d-h2">Rechargez vos crédits</h2>
              <p style={{ color: "var(--d-text-3)", fontSize: 14 }}>Choisissez votre pack — bonus offerts dès 500 crédits.</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14 }}>
              {packs.map((p) => (
                <button key={p.id} onClick={() => recharge(p)} className="d-card" style={{ textAlign: "center", cursor: "pointer", padding: 18, background: "var(--d-elevated)", border: "1px solid var(--d-border-strong)" }}>
                  <div className="d-display" style={{ fontSize: 14, color: "var(--d-gold)", marginBottom: 6 }}>{p.name}</div>
                  <div className="d-display" style={{ fontSize: 32, fontWeight: 800, marginBottom: 2 }}>{p.credits + (p.bonus_credits || 0)}</div>
                  <div style={{ fontSize: 11, color: "var(--d-text-3)" }}>CRÉDITS</div>
                  {p.bonus_credits > 0 && (
                    <div className="d-payout-badge" style={{ marginTop: 8, fontSize: 10 }}>+{p.bonus_credits} BONUS</div>
                  )}
                  <div style={{ fontSize: 16, fontWeight: 700, marginTop: 12 }}>{p.price_eur.toFixed(2).replace(".", ",")} €</div>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 22, textAlign: "center" }}>
              <button className="d-btn-ghost" onClick={() => setShowRecharge(false)}>Plus tard</button>
            </div>
          </div>
        </div>
      )}

      {/* Cartes de services */}
      <h2 className="d-display d-h2" style={{ marginTop: 24, marginBottom: 16 }}>Lancez en 1 clic</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 18 }}>
        {SERVICES.map((s) => (
          <div key={s.id} className="d-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
              <div style={{ fontSize: 36 }}>{s.icon}</div>
              <div className="d-payout-badge" style={{ fontSize: 11 }}>{s.tokens_cost} CR.</div>
            </div>
            <h3 className="d-display" style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{s.name}</h3>
            <p style={{ color: "var(--d-text-2)", fontSize: 13, marginBottom: 18, minHeight: 44 }}>{s.description}</p>
            <button className="d-btn-primary" style={{ width: "100%", fontSize: 12, padding: "11px 20px" }} onClick={() => launchService(s)} disabled={busyService !== null}>
              {busyService === s.id ? "Lancement…" : s.cta}
            </button>
          </div>
        ))}
      </div>

      {/* Historique actions */}
      {actions.length > 0 && (
        <>
          <h2 className="d-display d-h2" style={{ marginTop: 40, marginBottom: 16 }}>Activité récente</h2>
          <div className="d-card">
            {actions.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid var(--d-border)", fontSize: 13 }}>
                <span style={{ color: "var(--d-text-2)" }}>{a.action_type}</span>
                <span style={{ color: a.tokens_delta > 0 ? "var(--d-win)" : a.tokens_delta < 0 ? "var(--d-token)" : "var(--d-text-3)", fontWeight: 700, fontFamily: "var(--d-font-display)" }}>
                  {a.tokens_delta > 0 ? "+" : ""}{a.tokens_delta} cr.
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
