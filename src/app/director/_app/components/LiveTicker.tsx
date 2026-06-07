"use client";

import { Radio } from "lucide-react";
import type { Ticker } from "../mockData";

type Props = {
    items: Ticker[];
};

/**
 * Live activity ticker — horizontal marquee streaming
 * platform-wide actions. The kind of "live now" UI used by
 * sports betting / trading apps to keep users engaged.
 */
export function LiveTicker({ items }: Props) {
    // Duplicate the list so the marquee can scroll seamlessly.
    const loop = [...items, ...items];
    return (
        <div
            data-testid="director-live-ticker"
            style={{
                display: "flex",
                alignItems: "center",
                background: "var(--wd-surface)",
                borderTop: "1px solid var(--wd-border)",
                borderBottom: "1px solid var(--wd-border)",
                height: 38,
                overflow: "hidden",
                fontSize: 13,
                color: "var(--wd-text-2)",
            }}
        >
            <div
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "0 14px",
                    height: "100%",
                    background:
                        "linear-gradient(90deg, var(--wd-danger) 0%, #B91C1C 100%)",
                    color: "#fff",
                    fontWeight: 600,
                    fontSize: 11,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    flexShrink: 0,
                    position: "relative",
                    zIndex: 2,
                    boxShadow: "0 0 16px rgba(220, 38, 38, 0.45)",
                }}
            >
                <Radio size={12} strokeWidth={2.4} />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    Live
                    <span
                        aria-hidden
                        style={{
                            width: 6,
                            height: 6,
                            borderRadius: "50%",
                            background: "#fff",
                            animation: "wd-pulse 1.4s var(--wd-ease) infinite",
                        }}
                    />
                </span>
            </div>
            <div
                style={{
                    flex: 1,
                    overflow: "hidden",
                    maskImage:
                        "linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)",
                    WebkitMaskImage:
                        "linear-gradient(90deg, transparent 0, #000 6%, #000 94%, transparent 100%)",
                }}
            >
                <div
                    style={{
                        display: "inline-flex",
                        gap: 28,
                        whiteSpace: "nowrap",
                        animation: "wd-marquee 38s linear infinite",
                        paddingLeft: 24,
                    }}
                >
                    {loop.map((t, i) => (
                        <span
                            key={`${t.id}-${i}`}
                            data-testid={`director-ticker-item-${t.id}`}
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 10,
                            }}
                        >
                            <span
                                aria-hidden
                                style={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: "50%",
                                    background: "var(--wd-success)",
                                    flexShrink: 0,
                                }}
                            />
                            <span style={{ fontWeight: 500, color: "var(--wd-text)" }}>
                                {t.label}
                            </span>
                        </span>
                    ))}
                </div>
            </div>
            <style>{`
                @keyframes wd-marquee {
                    0%   { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                @keyframes wd-pulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50%      { opacity: 0.6; transform: scale(0.85); }
                }
                @keyframes wd-float {
                    0%, 100% { transform: translateY(0); }
                    50%      { transform: translateY(-4px); }
                }
                @keyframes wd-count {
                    from { opacity: 0; transform: translateY(6px); }
                    to   { opacity: 1; transform: translateY(0);    }
                }
            `}</style>
        </div>
    );
}
