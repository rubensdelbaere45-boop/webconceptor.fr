// Commandes — clients payés via Stripe.
import { createClient } from "@supabase/supabase-js";
import { Euro, Globe, Mail, Phone } from "lucide-react";

export const dynamic = "force-dynamic";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

async function loadOrders() {
  const supabase = db();
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("paid", true)
    .order("paid_at", { ascending: false });
  if (error) return [];
  return data ?? [];
}

const PLAN_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  simple:   { label: "Simple 320 €",                 color: "#a8a8a8", bg: "#1f1f1f" },
  serenite: { label: "Sérénité 320 € + 50 €/mois",   color: "#5b9bff", bg: "rgba(0,102,255,.14)" },
  luxury:   { label: "Luxury 860 € + 75 €/mois",     color: "#FFD700", bg: "rgba(255,215,0,.12)" },
};

export default async function CommandesPage() {
  const orders = await loadOrders();

  return (
    <div style={{ padding: "28px 28px 60px", maxWidth: 1400, margin: "0 auto" }}>
      {/* Récap */}
      <div style={{
        display: "grid", gap: 14,
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        marginBottom: 28,
      }}>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "16px 18px" }}>
          <div style={{ fontSize: 11.5, color: "var(--txt-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Revenue total</div>
          <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.03em" }}>{(orders.length * 320).toLocaleString("fr")} €</div>
        </div>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "16px 18px" }}>
          <div style={{ fontSize: 11.5, color: "var(--txt-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Commandes</div>
          <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.03em" }}>{orders.length}</div>
        </div>
        <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "16px 18px" }}>
          <div style={{ fontSize: 11.5, color: "var(--txt-3)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 6 }}>Sites déployés</div>
          <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.03em" }}>{orders.filter((o) => o.deployed).length}</div>
        </div>
      </div>

      {/* Liste des commandes */}
      {orders.length === 0 ? (
        <div style={{
          background: "var(--card)", border: "1px dashed var(--border-strong)",
          borderRadius: "var(--r)", padding: "60px 40px", textAlign: "center",
        }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>Aucune commande pour le moment</div>
          <div style={{ fontSize: 13, color: "var(--txt-3)" }}>
            Les premières ventes apparaîtront ici dès qu'un prospect aura payé sur Stripe.
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {orders.map((o) => {
            const plan = PLAN_LABELS[o.plan] ?? PLAN_LABELS.simple;
            return (
              <div key={o.id} style={{
                background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)",
                padding: "20px 24px",
                display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center",
              }}>
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 700, marginBottom: 4 }}>{o.client}</div>
                  <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--txt-2)", flexWrap: "wrap", marginBottom: 10 }}>
                    {o.city && <span>📍 {o.city}</span>}
                    {o.email && <a href={`mailto:${o.email}`} style={{ color: "var(--txt-2)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}><Mail size={12}/> {o.email}</a>}
                    {o.phone && <a href={`tel:${o.phone.replace(/\s/g,"")}`} style={{ color: "#FFD700", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4, fontWeight: 600 }}><Phone size={12}/> {o.phone}</a>}
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ padding: "3px 9px", borderRadius: 6, background: plan.bg, color: plan.color, fontSize: 11.5, fontWeight: 600 }}>{plan.label}</span>
                    {o.domaine && <span style={{ fontSize: 11.5, color: "var(--txt-2)", display: "inline-flex", alignItems: "center", gap: 4 }}><Globe size={12}/> {o.domaine}</span>}
                    <span style={{ fontSize: 11, color: "var(--txt-3)" }}>{o.paid_at ? new Date(o.paid_at).toLocaleDateString("fr") : ""}</span>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: "50%",
                    background: o.deployed ? "#4ade80" : "#dc2626",
                    boxShadow: `0 0 0 3px ${o.deployed ? "rgba(22,163,74,.14)" : "rgba(220,38,38,.14)"}`,
                  }} />
                  <span style={{ fontSize: 12, color: "var(--txt-2)", fontWeight: 600 }}>{o.deployed ? "En ligne" : "À déployer"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
