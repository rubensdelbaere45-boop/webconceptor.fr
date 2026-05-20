"use client";
import { Check, Crown, Star } from "lucide-react";
import { getSession } from "@/lib/caissio-store";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 19,
    features: [
      "1 utilisateur",
      "Catalogue jusqu'à 500 produits",
      "Ticket PDF",
      "Dashboard de base",
      "Support email",
    ],
    popular: false,
    cta: "Choisir ce plan",
  },
  {
    id: "pro",
    name: "Pro",
    price: 39,
    features: [
      "5 utilisateurs",
      "Catalogue illimité",
      "Import Excel/CSV",
      "Fidélité clients",
      "Rapports avancés",
      "Support prioritaire",
    ],
    popular: true,
    cta: "Choisir ce plan",
  },
  {
    id: "business",
    name: "Business",
    price: 69,
    features: [
      "Utilisateurs illimités",
      "Multi-magasins (bientôt)",
      "Fournisseurs",
      "API & intégrations matériel",
      "Manager dédié",
      "SLA 99,9%",
    ],
    popular: false,
    cta: "Choisir ce plan",
  },
];

export default function AbonnementPage() {
  const user = getSession();
  const currentPlan = user?.plan || "pro";

  const currentPlanDef = PLANS.find((p) => p.id === currentPlan) || PLANS[1];

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'IBM Plex Sans',sans-serif", maxWidth: 980 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');`}</style>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 4 }}>ABONNEMENT</div>
        <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 36, fontWeight: 900, color: "#0f172a", margin: 0 }}>Votre plan</h1>
      </div>

      {/* Current plan card */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "18px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Crown style={{ width: 22, height: 22, color: "#4f46e5" }} />
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 2 }}>PLAN ACTUEL</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{currentPlanDef.name}</div>
        </div>
      </div>

      {/* Stripe notice */}
      <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "14px 18px", marginBottom: 28, display: "flex", alignItems: "center", gap: 10 }}>
        <Star style={{ width: 16, height: 16, color: "#d97706", flexShrink: 0 }} />
        <div style={{ fontSize: 13, color: "#92400e" }}>
          Le paiement Stripe sera activé prochainement. Pour l&apos;instant, vous pouvez naviguer entre les plans sans facturation.
        </div>
      </div>

      {/* Plan cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
        {PLANS.map((plan) => {
          const isCurrent = plan.id === currentPlan;
          return (
            <div
              key={plan.id}
              style={{
                background: "#fff",
                border: `2px solid ${plan.popular ? "#4f46e5" : "#e2e8f0"}`,
                borderRadius: 20,
                padding: 24,
                position: "relative",
              }}
            >
              {/* POPULAIRE badge */}
              {plan.popular && (
                <div style={{
                  position: "absolute",
                  top: -13,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#4f46e5",
                  color: "#fff",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "4px 16px",
                  borderRadius: 20,
                }}>
                  POPULAIRE
                </div>
              )}

              {/* Plan name */}
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 6, marginTop: plan.popular ? 8 : 0 }}>
                {plan.name}
              </div>

              {/* Price */}
              <div style={{ marginBottom: 20 }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 48, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em" }}>{plan.price}€</span>
                <span style={{ fontSize: 14, color: "#94a3b8", marginLeft: 4 }}>/mois</span>
              </div>

              {/* Features */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#374151" }}>
                    <Check style={{ width: 15, height: 15, color: "#4f46e5", flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => {
                  if (!isCurrent) alert("Stripe checkout — à intégrer.");
                }}
                style={{
                  width: "100%",
                  height: 46,
                  borderRadius: 12,
                  border: "none",
                  cursor: isCurrent ? "default" : "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                  background: isCurrent
                    ? "#f1f5f9"
                    : plan.popular
                    ? "#4f46e5"
                    : "#0f172a",
                  color: isCurrent ? "#94a3b8" : "#fff",
                  transition: "opacity .15s",
                }}
              >
                {isCurrent ? "Plan actuel" : plan.cta}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
