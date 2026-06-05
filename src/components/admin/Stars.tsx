import React from "react";

export default function Stars({ value }: { value: number | null | undefined }) {
  if (!value || value <= 0) return <span style={{ color: "var(--txt-3)", fontSize: 12 }}>—</span>;
  const filled = Math.round(value);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
      <span style={{ color: "#FFD700", letterSpacing: 1.5 }}>
        {"★".repeat(filled)}<span style={{ color: "#3a3a3a" }}>{"★".repeat(5 - filled)}</span>
      </span>
      <span style={{ color: "var(--txt-2)", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{value.toFixed(1)}</span>
    </span>
  );
}
