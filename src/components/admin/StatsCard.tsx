// KPI avec icône, valeur, label, sous-texte, tendance optionnelle.
import React from "react";

interface Props {
  Icon: React.ElementType;
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  accent?: "gold" | "blue" | "green";
}

const ACCENT_MAP = {
  gold:  { bg: "rgba(255,215,0,.12)",  color: "#FFD700" },
  blue:  { bg: "rgba(0,102,255,.14)",  color: "#5b9bff" },
  green: { bg: "rgba(22,163,74,.14)",  color: "#4ade80" },
};

export default function StatsCard({ Icon, label, value, sub, trend, accent }: Props) {
  const a = accent ? ACCENT_MAP[accent] : { bg: "#1a1a1a", color: "#a8a8a8" };
  return (
    <div style={{
      background: "var(--card)", border: "1px solid var(--border)",
      borderRadius: "var(--r)", padding: "16px 18px",
      display: "flex", flexDirection: "column", gap: 14,
      minHeight: 122,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{
          width: 34, height: 34, borderRadius: 9,
          background: a.bg, color: a.color,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={17} />
        </div>
        {typeof trend === "number" && (
          <span style={{
            fontSize: 11, fontWeight: 600,
            color: trend >= 0 ? "#4ade80" : "#fb7185",
            background: trend >= 0 ? "rgba(22,163,74,.14)" : "rgba(220,38,38,.14)",
            padding: "2px 7px", borderRadius: 100,
          }}>{trend >= 0 ? "+" : ""}{trend}%</span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 23, fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>{value}</div>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--txt-2)", marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11.5, color: "var(--txt-3)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}
