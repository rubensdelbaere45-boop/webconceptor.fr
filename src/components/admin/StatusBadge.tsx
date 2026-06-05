// Pastille colorée selon le statut d'un prospect.
import React from "react";

type Status = "found" | "sent" | "opened" | "replied" | "paid" | string;

const MAP: Record<string, { bg: string; color: string; dot: string; label: string }> = {
  found:   { bg: "#1f1f1f",                color: "#a8a8a8", dot: "#777",     label: "Trouvé"  },
  sent:    { bg: "rgba(0,102,255,.14)",    color: "#5b9bff", dot: "#5b9bff",  label: "Envoyé"  },
  opened:  { bg: "rgba(245,158,11,.14)",   color: "#fbbf24", dot: "#fbbf24",  label: "Ouvert"  },
  replied: { bg: "rgba(168,85,247,.14)",   color: "#c084fc", dot: "#c084fc",  label: "Répondu" },
  paid:    { bg: "rgba(22,163,74,.14)",    color: "#4ade80", dot: "#4ade80",  label: "Payé"    },
};

export default function StatusBadge({ status }: { status: Status }) {
  const m = MAP[status] ?? MAP.found;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 9px 3px 7px", borderRadius: 100,
      background: m.bg, color: m.color,
      fontSize: 11.5, fontWeight: 600, lineHeight: 1.2,
      letterSpacing: "0.005em",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: m.dot,
        boxShadow: `0 0 0 2px ${m.bg}`,
      }} />
      {m.label}
    </span>
  );
}
