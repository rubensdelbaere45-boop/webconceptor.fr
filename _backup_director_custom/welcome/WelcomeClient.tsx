"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Pain {
  icon: string;
  title: string;
  description: string;
  action_label: string;
  action_target: string;
  tokens_cost: number;
}

export default function WelcomeClient({ businessName, pains, tokens }: { businessName: string; pains: Pain[]; tokens: number }) {
  const router = useRouter();
  const [launching, setLaunching] = useState<string | null>(null);

  async function launch(target: string, cost: number) {
    setLaunching(target);
    try {
      const res = await fetch("/api/director/launch-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, tokens_cost: cost }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.need_credits) {
          router.push("/director/dashboard?recharge=true");
          return;
        }
        alert(data.error || "Erreur");
        return;
      }
      // Animation de succès → dashboard
      router.push("/director/dashboard?launched=" + target);
    } finally {
      setLaunching(null);
    }
  }

  return (
    <div className="d-container">
      {/* Header personnalisé */}
      <div style={{ textAlign: "center", marginBottom: 40, marginTop: 20 }}>
        <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--d-gold)", marginBottom: 12 }}>
          BIENVENUE DANS WEBDIRECTOR
        </div>
        <h1 className="d-display d-h1">Bonjour.</h1>
        <p style={{ fontSize: 19, color: "var(--d-text-2)", maxWidth: 640, margin: "0 auto", lineHeight: 1.5 }}>
          Tom m'a chargé d'analyser la présence numérique de{" "}
          <strong style={{ color: "var(--d-gold)" }}>{businessName}</strong>.
          <br />
          L'analyse est terminée. Voici ce que j'ai trouvé.
        </p>
      </div>

      {/* Solde crédits gamifié */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 48 }}>
        <div className="d-credits-orb">
          <div className="num">{tokens}</div>
          <div className="label">CRÉDITS</div>
        </div>
      </div>

      {/* 3 douleurs détectées */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, marginBottom: 40 }}>
        {pains.map((pain, i) => (
          <div key={i} className="d-card" style={{ position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: 16, right: 16, fontSize: 12, padding: "6px 12px", background: "rgba(255, 215, 0, 0.10)", border: "1px solid rgba(255, 215, 0, 0.30)", color: "var(--d-gold)", borderRadius: 100, fontWeight: 700 }}>
              {pain.tokens_cost} CR.
            </div>
            <div style={{ fontSize: 42, marginBottom: 14 }}>{pain.icon}</div>
            <h3 className="d-display" style={{ fontSize: 19, fontWeight: 700, marginBottom: 8 }}>{pain.title}</h3>
            <p style={{ color: "var(--d-text-2)", fontSize: 14, lineHeight: 1.55, marginBottom: 20, minHeight: 60 }}>{pain.description}</p>
            <button
              className="d-btn-primary"
              onClick={() => launch(pain.action_target, pain.tokens_cost)}
              disabled={launching !== null}
              style={{ width: "100%", fontSize: 12, padding: "12px 22px" }}
            >
              {launching === pain.action_target ? "Lancement…" : pain.action_label + " →"}
            </button>
          </div>
        ))}
      </div>

      {/* Lien dashboard */}
      <div style={{ textAlign: "center" }}>
        <button className="d-btn-ghost" onClick={() => router.push("/director/dashboard")}>
          Plus tard — voir le tableau de bord →
        </button>
      </div>
    </div>
  );
}
