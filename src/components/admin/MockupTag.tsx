import React from "react";

export default function MockupTag({ kind }: { kind: "stitch" | "template" | string }) {
  const isStitch = kind === "stitch";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "2px 8px", borderRadius: 6,
      background: isStitch ? "rgba(255,215,0,.12)" : "#1f1f1f",
      color: isStitch ? "#FFD700" : "#a8a8a8",
      fontSize: 11, fontWeight: 600, letterSpacing: "0.01em",
    }}>
      {isStitch && <span>⚡</span>}
      {isStitch ? "Stitch" : "Template"}
    </span>
  );
}
