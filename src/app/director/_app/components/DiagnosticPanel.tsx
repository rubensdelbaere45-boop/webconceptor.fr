"use client";

import { useState } from "react";
import { Sparkles, Loader2, AlertTriangle, Target, Zap } from "lucide-react";

/**
 * DiagnosticPanel
 *
 * Bouton "Lancer mon diagnostic" + affichage des failles détectées
 * par l'IA (Kimi K2) enrichie par Scrapling + INSEE.
 *
 * Apparaît en haut du dashboard. Si pas encore exécuté → CTA premium.
 * Si exécuté → liste des 5-8 failles avec agent recommandé.
 */

interface Faille {
  titre: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  evidence: string;
  agent_slug: string;
  agent_name: string;
  agent_emoji: string;
  agent_price_eur: string;
  gain_potentiel: string;
}

interface DiagnosticResult {
  failles: Faille[];
  agents_recommended_count: number;
  is_subscribed: boolean;
  enrichment: {
    scrapling_used: boolean;
    insee_used: boolean;
    emails_scrapped: number;
    photos_count: number;
    pj_listings: number;
    official_name: string | null;
    naf_code: string | null;
  };
  upsell?: {
    title: string;
    monthly_price_eur: number;
    yearly_price_eur: number;
    cta_url: string;
  };
}

const SEVERITY_STYLES: Record<Faille["severity"], { bg: string; fg: string; label: string }> = {
  critical: { bg: "#fee2e2", fg: "#991b1b", label: "🚨 CRITIQUE" },
  high:     { bg: "#fef3c7", fg: "#92400e", label: "⚠️ ÉLEVÉE" },
  medium:   { bg: "#dbeafe", fg: "#1e40af", label: "📊 MOYENNE" },
  low:      { bg: "#dcfce7", fg: "#166534", label: "✓ MINEURE" },
};

export function DiagnosticPanel({ onUpsellClick }: { onUpsellClick?: () => void }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const launchDiagnostic = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/director/diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Erreur ${res.status}`);
      }
      const data: DiagnosticResult = await res.json();
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  // ÉTAT INITIAL — bouton CTA premium
  if (!result && !loading) {
    return (
      <section
        style={{
          background: "linear-gradient(135deg, #0a2540 0%, #1e3a8a 100%)",
          borderRadius: 16,
          padding: 24,
          color: "#fff",
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
          marginBottom: 32,
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fcd34d", marginBottom: 8 }}>
            <Sparkles size={14} /> Diagnostic IA + Scrapling + INSEE
          </div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: "-0.02em" }}>
            Lancez un audit complet de votre entreprise
          </h2>
          <p style={{ margin: "8px 0 0", fontSize: 14.5, color: "#cbd5e1", lineHeight: 1.55 }}>
            Notre IA + Scrapling + INSEE analysent votre site, vos avis Google, votre présence Pages Jaunes et votre fiche officielle pour identifier 5-8 failles concrètes — et les agents qui les corrigent.
          </p>
          {error && (
            <div style={{ marginTop: 12, padding: "10px 14px", background: "#7f1d1d", borderRadius: 8, fontSize: 13, color: "#fecaca" }}>
              ⚠️ {error}
            </div>
          )}
        </div>
        <button
          onClick={launchDiagnostic}
          style={{
            background: "#fcd34d",
            color: "#0a2540",
            border: "none",
            borderRadius: 10,
            padding: "14px 28px",
            fontSize: 15,
            fontWeight: 800,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <Zap size={18} /> Lancer mon diagnostic
        </button>
      </section>
    );
  }

  // ÉTAT LOADING — animation
  if (loading) {
    return (
      <section
        style={{
          background: "#0a2540",
          borderRadius: 16,
          padding: 32,
          color: "#fff",
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        <Loader2 size={32} style={{ animation: "spin 1.5s linear infinite", color: "#fcd34d", marginBottom: 12 }} />
        <h2 style={{ margin: "8px 0", fontSize: 18, fontWeight: 700 }}>
          Analyse en cours...
        </h2>
        <p style={{ margin: 0, fontSize: 13.5, color: "#cbd5e1", lineHeight: 1.55 }}>
          Scrapling scrape votre site • INSEE vérifie votre fiche officielle • Kimi K2 identifie vos failles
        </p>
        <style jsx>{`
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </section>
    );
  }

  // ÉTAT RÉSULTAT — failles + agents
  return (
    <section style={{ marginBottom: 32 }}>
      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0a2540 0%, #1e3a8a 100%)",
        borderRadius: "16px 16px 0 0",
        padding: "20px 24px",
        color: "#fff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 12,
      }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#fcd34d" }}>
            <Target size={14} /> Diagnostic terminé
          </div>
          <h2 style={{ margin: "6px 0 0", fontSize: 20, fontWeight: 800 }}>
            {result!.failles.length} failles détectées · {result!.agents_recommended_count} agents recommandés
          </h2>
          <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>
            {result!.enrichment.scrapling_used && "✓ Scrapling site "}
            {result!.enrichment.insee_used && "✓ INSEE officiel "}
            {result!.enrichment.naf_code && `· NAF ${result!.enrichment.naf_code}`}
          </div>
        </div>
        <button
          onClick={launchDiagnostic}
          style={{ background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
        >
          ↻ Relancer
        </button>
      </div>

      {/* Failles list */}
      <div style={{ background: "#fff", border: "1px solid #e5e7eb", borderTop: "none", borderRadius: "0 0 16px 16px", padding: 20 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {result!.failles.map((f, i) => {
            const s = SEVERITY_STYLES[f.severity];
            return (
              <div key={i} style={{
                display: "flex",
                gap: 16,
                padding: 16,
                background: "#f9fafb",
                borderRadius: 12,
                border: "1px solid #e5e7eb",
              }}>
                <div style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: s.bg,
                  color: s.fg,
                  borderRadius: 10,
                  padding: "10px 12px",
                  minWidth: 80,
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                }}>
                  {s.label}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>
                    {f.titre}
                  </div>
                  <div style={{ fontSize: 13.5, color: "#475569", lineHeight: 1.5, marginBottom: 6 }}>
                    {f.description}
                  </div>
                  {f.evidence && (
                    <div style={{ fontSize: 12, color: "#64748b", fontStyle: "italic", marginBottom: 10 }}>
                      <AlertTriangle size={12} style={{ display: "inline", marginRight: 4 }} />
                      Observation : {f.evidence}
                    </div>
                  )}
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    background: "#0f172a",
                    color: "#fff",
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                  }}>
                    <span style={{ fontSize: 16 }}>{f.agent_emoji}</span>
                    <span>{f.agent_name}</span>
                    <span style={{ opacity: 0.6 }}>·</span>
                    <span style={{ color: "#fcd34d" }}>{f.agent_price_eur}</span>
                    {f.gain_potentiel && (
                      <>
                        <span style={{ opacity: 0.6 }}>·</span>
                        <span style={{ color: "#86efac" }}>{f.gain_potentiel}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Upsell abonnement */}
        {result!.upsell && (
          <div style={{
            marginTop: 20,
            padding: 20,
            background: "linear-gradient(135deg, #fcd34d 0%, #f59e0b 100%)",
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#451a03", marginBottom: 4 }}>
                {result!.upsell.title}
              </div>
              <div style={{ fontSize: 13, color: "#78350f" }}>
                {result!.upsell.monthly_price_eur}€/mois · ou {result!.upsell.yearly_price_eur}€/an
              </div>
            </div>
            <button
              onClick={onUpsellClick}
              style={{
                background: "#0f172a",
                color: "#fcd34d",
                border: "none",
                borderRadius: 8,
                padding: "12px 20px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              S'abonner pour embaucher
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
