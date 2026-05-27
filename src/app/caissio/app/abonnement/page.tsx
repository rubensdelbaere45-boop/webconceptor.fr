"use client";
import { useEffect, useState, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Crown, Star, Loader2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import {
  getSession,
  isTrialing,
  trialDaysLeft,
  updateSubscription,
  type CaissioUser,
} from "@/lib/caissio-store";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    price: 15,
    features: [
      "1 utilisateur",
      "Catalogue jusqu'à 500 produits",
      "Ticket PDF",
      "Dashboard de base",
      "Support email",
    ],
    popular: false,
    color: "#0f172a",
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
    color: "#4f46e5",
  },
  {
    id: "business",
    name: "Business",
    price: 59,
    features: [
      "Utilisateurs illimités",
      "Multi-magasins (bientôt)",
      "Gestion fournisseurs",
      "API & intégrations matériel",
      "Manager dédié",
      "SLA 99,9%",
    ],
    popular: false,
    color: "#0f172a",
  },
];

function AbonnementInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<CaissioUser | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; msg: string } | null>(null);
  const [verifying, setVerifying] = useState(false);

  const showToast = useCallback((type: "success" | "error" | "info", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 5000);
  }, []);

  // Vérification abonnement après retour Stripe
  const verifySession = useCallback(async (sessionId: string) => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/caissio/subscription?session_id=${sessionId}`);
      if (!res.ok) throw new Error("Erreur réseau");
      const data = await res.json() as {
        stripe_customer_id?: string;
        subscription_status?: CaissioUser["subscription_status"];
        subscription_plan?: CaissioUser["subscription_plan"];
        verified_at?: string;
        error?: string;
      };
      if (data.error) throw new Error(data.error);
      updateSubscription({
        stripe_customer_id: data.stripe_customer_id,
        subscription_status: data.subscription_status,
        subscription_plan: data.subscription_plan,
        subscription_verified_at: data.verified_at,
      });
      setUser(getSession());
      showToast("success", "Abonnement activé — bienvenue sur Caissio !");
    } catch {
      showToast("error", "Impossible de vérifier votre abonnement. Contactez le support.");
    } finally {
      setVerifying(false);
      // Nettoie les params URL
      router.replace("/caissio/app/abonnement");
    }
  }, [router, showToast]);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/caissio/login"); return; }
    setUser(s);

    // Retour depuis Stripe
    const success = searchParams.get("success");
    const cancelled = searchParams.get("cancelled");
    const sessionId = searchParams.get("session_id");

    if (success === "true" && sessionId) {
      verifySession(sessionId);
    } else if (cancelled === "true") {
      showToast("info", "Paiement annulé. Votre abonnement reste inchangé.");
      router.replace("/caissio/app/abonnement");
    }
  }, [router, searchParams, verifySession, showToast]);

  const handleSubscribe = async (planId: string) => {
    if (!user) return;
    const currentPlan = user.subscription_plan || user.plan;
    if (planId === currentPlan && user.subscription_status === "active") return;

    setLoading(planId);
    try {
      const res = await fetch("/api/caissio/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: planId,
          user_id: user.id,
          user_email: user.email,
          user_name: user.name,
        }),
      });

      const data = await res.json() as { url?: string; error?: string };

      if (!res.ok || data.error) {
        showToast("error", data.error || "Erreur lors de la création du paiement");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      showToast("error", "Erreur de connexion au serveur de paiement");
    } finally {
      setLoading(null);
    }
  };

  if (!user) return null;

  const trial = isTrialing(user);
  const daysLeft = trialDaysLeft(user);
  const activePlan = user.subscription_plan || user.plan || "starter";
  const subStatus = user.subscription_status;
  const isActive = subStatus === "active";

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'IBM Plex Sans',sans-serif", maxWidth: 1020, position: "relative" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');`}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "success" ? "#dcfce7" : toast.type === "error" ? "#fef2f2" : "#eff6ff",
          border: `1px solid ${toast.type === "success" ? "#86efac" : toast.type === "error" ? "#fecaca" : "#bfdbfe"}`,
          color: toast.type === "success" ? "#166534" : toast.type === "error" ? "#dc2626" : "#1d4ed8",
          borderRadius: 12, padding: "14px 18px", fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8, maxWidth: 360,
          boxShadow: "0 10px 25px rgba(0,0,0,.1)",
        }}>
          {toast.type === "success" && <CheckCircle2 style={{ width: 16, height: 16, flexShrink: 0 }} />}
          {toast.type === "error" && <AlertTriangle style={{ width: 16, height: 16, flexShrink: 0 }} />}
          {toast.type === "info" && <Star style={{ width: 16, height: 16, flexShrink: 0 }} />}
          {toast.msg}
        </div>
      )}

      {/* Overlay vérification */}
      {verifying && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9998, background: "rgba(255,255,255,.85)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
          <Loader2 style={{ width: 36, height: 36, color: "#4f46e5", animation: "spin 1s linear infinite" }} />
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 700, color: "#0f172a" }}>Confirmation de votre paiement…</div>
          <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 4 }}>ABONNEMENT</div>
        <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 36, fontWeight: 900, color: "#0f172a", margin: 0 }}>Votre plan</h1>
      </div>

      {/* Trial banner */}
      {trial && (
        <div style={{ background: daysLeft <= 2 ? "#fef2f2" : "#fffbeb", border: `1px solid ${daysLeft <= 2 ? "#fecaca" : "#fde68a"}`, borderRadius: 14, padding: "14px 18px", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: isActive ? 0 : 8 }}>
            <Clock style={{ width: 16, height: 16, color: daysLeft <= 2 ? "#dc2626" : "#d97706", flexShrink: 0 }} />
            <div style={{ fontSize: 13, color: daysLeft <= 2 ? "#991b1b" : "#92400e", fontWeight: 600 }}>
              {daysLeft > 0
                ? `Il vous reste ${daysLeft} jour${daysLeft > 1 ? "s" : ""} d'essai gratuit.`
                : "Votre période d'essai est terminée."}
            </div>
          </div>
          {!isActive && (
            <div style={{ fontSize: 12, color: "#92400e", marginLeft: 26, lineHeight: 1.6 }}>
              👉 Pour activer les <strong>7 jours offerts sur l&apos;abonnement Starter</strong>, cliquez sur <strong>« Choisir ce plan »</strong> ci-dessous et entrez votre carte sur Stripe.
              Aucun prélèvement pendant les 7 premiers jours — résiliez avant le 8ème jour pour ne rien payer.
            </div>
          )}
        </div>
      )}

      {/* Subscription status card */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "18px 20px", marginBottom: 28, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Crown style={{ width: 22, height: 22, color: "#4f46e5" }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 2 }}>PLAN ACTUEL</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 900, color: "#0f172a" }}>
              {PLANS.find((p) => p.id === activePlan)?.name || "Pro"}
            </div>
            {isActive && (
              <span style={{ background: "#dcfce7", color: "#166534", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, border: "1px solid #86efac" }}>ACTIF</span>
            )}
            {trial && (
              <span style={{ background: "#fffbeb", color: "#92400e", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, border: "1px solid #fde68a" }}>ESSAI</span>
            )}
            {subStatus === "past_due" && (
              <span style={{ background: "#fef2f2", color: "#dc2626", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, border: "1px solid #fecaca" }}>IMPAYÉ</span>
            )}
            {subStatus === "cancelled" && (
              <span style={{ background: "#f1f5f9", color: "#64748b", fontSize: 11, fontWeight: 700, padding: "2px 10px", borderRadius: 20, border: "1px solid #e2e8f0" }}>ANNULÉ</span>
            )}
          </div>
        </div>
        {user.stripe_customer_id && (
          <div style={{ fontSize: 11, color: "#94a3b8" }}>ID : {user.stripe_customer_id.slice(0, 14)}…</div>
        )}
      </div>

      {/* Plan cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
        {PLANS.map((plan) => {
          const isCurrent = plan.id === activePlan && isActive;
          const isLoading = loading === plan.id;

          return (
            <div
              key={plan.id}
              style={{
                background: "#fff",
                border: `2px solid ${plan.popular ? "#4f46e5" : "#e2e8f0"}`,
                borderRadius: 20,
                padding: 24,
                position: "relative",
                transition: "box-shadow .2s",
              }}
            >
              {/* POPULAIRE badge */}
              {plan.popular && (
                <div style={{
                  position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
                  background: "#4f46e5", color: "#fff", fontSize: 11, fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase", padding: "4px 16px", borderRadius: 20,
                }}>POPULAIRE</div>
              )}

              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: "#0f172a", marginBottom: 6, marginTop: plan.popular ? 8 : 0 }}>
                {plan.name}
              </div>

              <div style={{ marginBottom: 20 }}>
                <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 48, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.04em" }}>{plan.price}€</span>
                <span style={{ fontSize: 14, color: "#94a3b8", marginLeft: 4 }}>/mois</span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
                {plan.features.map((f) => (
                  <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#374151" }}>
                    <Check style={{ width: 15, height: 15, color: "#4f46e5", flexShrink: 0 }} />
                    {f}
                  </div>
                ))}
              </div>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={isCurrent || isLoading}
                style={{
                  width: "100%",
                  height: 46,
                  borderRadius: 12,
                  border: "none",
                  cursor: isCurrent || isLoading ? "default" : "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                  background: isCurrent ? "#f1f5f9" : plan.popular ? "#4f46e5" : "#0f172a",
                  color: isCurrent ? "#94a3b8" : "#fff",
                  opacity: isLoading ? 0.7 : 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "opacity .15s",
                }}
              >
                {isLoading
                  ? <><Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> Redirection…</>
                  : isCurrent
                  ? "Plan actuel"
                  : "Choisir ce plan"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Info facturation */}
      <div style={{ marginTop: 24, fontSize: 12, color: "#94a3b8", textAlign: "center", lineHeight: 1.6 }}>
        Paiement sécurisé par Stripe · Annulation à tout moment · TVA non incluse · Facture automatique par email
      </div>
    </div>
  );
}

export default function AbonnementPage() {
  return (
    <Suspense fallback={
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Loader2 style={{ width: 28, height: 28, color: "#4f46e5", animation: "spin 1s linear infinite" }} />
      </div>
    }>
      <AbonnementInner />
    </Suspense>
  );
}
