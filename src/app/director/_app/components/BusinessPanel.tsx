"use client";

import { Star, MapPin, TrendingUp, Phone } from "lucide-react";
import { Sparkline } from "./Sparkline";
import {
    MOCK_BUSINESS_STATS,
    MOCK_ACCOUNT,
} from "../mockData";

type Props = {
    firstName?: string;
    businessName?: string;
    city?: string;
};

/**
 * "Mon entreprise" panel — the user's real business data at a
 * glance. Sits right of the Featured Agent on desktop. The point:
 * the user feels they're piloting their own company, not browsing
 * a marketplace.
 */
export function BusinessPanel({
    firstName = MOCK_ACCOUNT.firstName,
    businessName = MOCK_ACCOUNT.businessName,
    city = MOCK_ACCOUNT.city,
}: Props) {
    const s = MOCK_BUSINESS_STATS;
    return (
        <aside
            data-testid="director-business-panel"
            className="wd-card wd-anim-fade-up"
            style={{
                padding: "20px 22px",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                animationDelay: "120ms",
                background:
                    "linear-gradient(180deg, var(--wd-surface) 0%, var(--wd-bg-alt) 100%)",
            }}
        >
            <div>
                <p className="wd-eyebrow" style={{ margin: 0 }}>
                    Mon entreprise
                </p>
                <div
                    style={{
                        marginTop: 4,
                        fontSize: 17,
                        fontWeight: 600,
                        color: "var(--wd-text)",
                        letterSpacing: "-0.015em",
                    }}
                    data-testid="director-business-name"
                >
                    {businessName}
                </div>
                <div
                    style={{
                        fontSize: 12.5,
                        color: "var(--wd-text-3)",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        marginTop: 2,
                    }}
                >
                    <MapPin size={11} strokeWidth={2.2} />
                    {city}
                </div>
            </div>

            {/* Google rating tile */}
            <div
                style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--wd-border)",
                    background: "var(--wd-surface)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                }}
                data-testid="director-business-rating"
            >
                <span
                    aria-hidden
                    style={{
                        width: 36,
                        height: 36,
                        borderRadius: 11,
                        background: "var(--wd-warning-bg)",
                        color: "var(--wd-warning)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Star size={16} strokeWidth={2.2} fill="currentColor" />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        className="wd-num-tabular"
                        style={{
                            fontSize: 18,
                            fontWeight: 600,
                            color: "var(--wd-text)",
                            letterSpacing: "-0.015em",
                            lineHeight: 1.1,
                        }}
                    >
                        {s.googleRating.toLocaleString("fr-FR", {
                            minimumFractionDigits: 1,
                            maximumFractionDigits: 1,
                        })}
                        <span
                            style={{
                                fontSize: 12,
                                color: "var(--wd-text-3)",
                                fontWeight: 500,
                                marginLeft: 6,
                            }}
                        >
                            / 5
                        </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: "var(--wd-text-3)" }}>
                        Note Google · {s.googleReviewCount} avis
                    </div>
                </div>
                <span
                    className="wd-pill"
                    data-tone="success"
                    style={{ fontSize: 10.5 }}
                >
                    +0,3 sur 30j
                </span>
            </div>

            {/* Calls / Appointments tile */}
            <div
                style={{
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: "1px solid var(--wd-border)",
                    background: "var(--wd-surface)",
                }}
                data-testid="director-business-calls"
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 8,
                    }}
                >
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 6,
                            fontSize: 12,
                            color: "var(--wd-text-3)",
                            fontWeight: 500,
                        }}
                    >
                        <Phone size={11} strokeWidth={2.2} />
                        Appels reçus · 30 jours
                    </span>
                    <span
                        className="wd-num-tabular"
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "var(--wd-success)",
                        }}
                    >
                        +47 %
                    </span>
                </div>
                <div
                    style={{
                        display: "flex",
                        alignItems: "baseline",
                        gap: 6,
                        marginTop: 4,
                    }}
                >
                    <span
                        className="wd-num-tabular"
                        style={{
                            fontSize: 26,
                            fontWeight: 600,
                            letterSpacing: "-0.025em",
                            color: "var(--wd-text)",
                            lineHeight: 1,
                        }}
                    >
                        {s.newCalls}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--wd-text-3)" }}>
                        nouveaux
                    </span>
                </div>
                <Sparkline values={s.callsTrend} />
            </div>

            {/* Revenue impact */}
            <div
                style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    background:
                        "linear-gradient(135deg, var(--wd-accent) 0%, #1A3A5C 100%)",
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    boxShadow: "0 12px 24px -8px rgba(10, 37, 64, 0.35)",
                }}
                data-testid="director-business-revenue"
            >
                <span
                    aria-hidden
                    style={{
                        width: 34,
                        height: 34,
                        borderRadius: 10,
                        background: "rgba(255,255,255,0.16)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <TrendingUp size={15} strokeWidth={2.4} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                        style={{
                            fontSize: 11,
                            color: "rgba(255,255,255,0.72)",
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                            fontWeight: 600,
                        }}
                    >
                        Impact CA · 30j
                    </div>
                    <div
                        className="wd-num-tabular"
                        style={{
                            fontSize: 22,
                            fontWeight: 600,
                            letterSpacing: "-0.02em",
                            marginTop: 2,
                            lineHeight: 1,
                        }}
                    >
                        {s.revenueImpact.toLocaleString("fr-FR")} €
                    </div>
                </div>
            </div>
        </aside>
    );
}
