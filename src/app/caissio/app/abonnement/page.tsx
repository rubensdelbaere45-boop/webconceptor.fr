"use client";
import { useState } from "react";
import { Check, Zap, Star, Building2 } from "lucide-react";
import { getSession } from "@/lib/caissio-store";

const PLANS = [
  {
    name: "Starter",
    price: 19,
    icon: Zap,
    color: "#64748b",
    bg: "#f8fafc",
    border: "#e2e8f0",
    features: ["1 utilisateur", "500 produits max", "Ticket PDF", "Dashboard de base", "Support email"],
    cta: "Démarrer",
  },
  {
    name: "Pro",
    price: 39,
    icon: Star,
    color: "#4f46e5",
    bg: "#ede9fe",
    border: "#4f46e5",
    highlighted: true,
    features: ["5 utilisateurs", "Catalogue illimité", "Import Excel/CSV", "Fidélité clients", "Rapports avancés", "Support prioritaire"],
    cta: "Choisir Pro",
  },
  {
    name: "Business",
    price: 69,
    icon: Building2,
    color: "#0f172a",
    bg: "#f8fafc",
    border: "#e2e8f0",
    features: ["Utilisateurs illimités", "Multi-magasins (bientôt)", "Fournisseurs avancés", "API & matériel avancé", "Manager dédié", "SLA 99,9%"],
    cta: "Nous contacter",
    apiKey: "sk_live_caissio_••••••••••••••••",
  },
];

export default function AbonnementPage() {
  const user = getSession();
  const currentPlan = user?.plan || "pro";
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'IBM Plex Sans',sans-serif", maxWidth: 900 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');`}</style>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 4 }}>Facturation</div>
        <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 32, fontWeight: 900, color: "#0f172a" }}>Abonnement</h1>
      </div>

      {/* Current plan banner */}
      <div style={{ background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 16, padding: "14px 20px", marginBottom: 28, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, color: "#6d28d9", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>Plan actuel</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#4f46e5", textTransform: "capitalize" }}>{currentPlan} — 39€/mois</div>
        </div>
        <div style={{ fontSize: 13, color: "#6d28d9", fontWeight: 600 }}>Renouvellement le 20/06/2026</div>
      </div>

      {/* Billing toggle */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
        <div style={{ display: "flex", background: "#f1f5f9", borderRadius: 12, padding: 4, gap: 4 }}>
          {(["monthly", "annual"] as const).map((b) => (
            <button key={b} onClick={() => setBilling(b)} style={{
              height: 36, padding: "0 20px", borderRadius: 10, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
              background: billing === b ? "#fff" : "transparent",
              color: billing === b ? "#0f172a" : "#94a3b8",
              boxShadow: billing === b ? "0 1px 4px rgba(0,0,0,.1)" : "none",
              transition: "all .15s",
            }}>
              {b === "monthly" ? "Mensuel" : "Annuel −20%"}
            </button>
          ))}
        </div>
      </div>

      {/* Plans */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, marginBottom: 28 }}>
        {PLANS.map((plan) => {
          const price = billing === "annual" ? Math.round(plan.price * 0.8) : plan.price;
          const isCurrent = currentPlan === plan.name.toLowerCase();
          const Icon = plan.icon;
          return (
            <div key={plan.name} style={{
              background: plan.highlighted ? "#4f46e5" : "#fff",
              border: `2px solid ${plan.highlighted ? "#4f46e5" : "#e2e8f0"}`,
              borderRadius: 20, padding: 24, position: "relative",
              boxShadow: plan.highlighted ? "0 20px 48px rgba(79,70,229,.25)" : "none",
            }}>
              {plan.highlighted && (
                <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#10b981", color: "#fff", fontSize: 11, fontWeight: 700, padding: "4px 14px", borderRadius: 20, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Recommandé
                </div>
              )}
              <div style={{ width: 40, height: 40, borderRadius: 12, background: plan.highlighted ? "rgba(255,255,255,.15)" : plan.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                <Icon style={{ width: 20, height: 20, color: plan.highlighted ? "#fff" : plan.color }} />
              </div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: plan.highlighted ? "#fff" : "#0f172a", marginBottom: 6 }}>{plan.name}</div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 42, fontWeight: 900, color: plan.highlighted ? "#fff" : "#0f172a", letterSpacing: "-0.04em" }}>{price}€</span>
                <span style={{ fontSize: 13, color: plan.highlighted ? "rgba(255,255,255,.6)" : "#94a3b8" }}>/mois</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: plan.highlighted ? "rgba(255,255,255,.85)" : "#64748b" }}>
                    <Check style={{ width: 14, height: 14, color: plan.highlighted ? "#a5f3fc" : "#10b981", flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
                {plan.apiKey && (
                  <div style={{ marginTop: 6, background: "#0f172a", borderRadius: 8, padding: "8px 10px", fontFamily: "monospace", fontSize: 11, color: "#94a3b8" }}>
                    {plan.apiKey}
                  </div>
                )}
              </div>
              <button onClick={() => alert("Stripe checkout — à intégrer")} style={{
                width: "100%", height: 44, borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14,
                background: plan.highlighted ? "#fff" : isCurrent ? "#f1f5f9" : "#4f46e5",
                color: plan.highlighted ? "#4f46e5" : isCurrent ? "#94a3b8" : "#fff",
              }}>
                {isCurrent ? "Plan actuel" : plan.cta}
              </button>
            </div>
          );
        })}
      </div>

      {/* Invoice history placeholder */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24 }}>
        <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>Historique de facturation</div>
        <div style={{ fontSize: 13, color: "#94a3b8", textAlign: "center", padding: "24px 0" }}>
          Vos factures apparaîtront ici après la première transaction Stripe.
        </div>
      </div>
    </div>
  );
}
