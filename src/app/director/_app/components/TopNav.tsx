"use client";

import { Plus, Bell, Sparkles } from "lucide-react";

type NavKey = "marketplace" | "team" | "performance" | "activity";

type Props = {
    active: NavKey;
    onChange: (k: NavKey) => void;
    tokens: number;
    teamCount?: number;
    onOpenRecharge: () => void;
    onLogout: () => void;
};

const NAV: { key: NavKey; label: string }[] = [
    { key: "marketplace", label: "Marketplace" },
    { key: "team",        label: "Mon équipe" },
    { key: "performance", label: "Performance" },
    { key: "activity",    label: "Activité" },
];

/**
 * Compact top navigation — replaces the sidebar.
 * Lots of breathing room for the agents to take center stage.
 */
export function TopNav({
    active,
    onChange,
    tokens,
    teamCount = 0,
    onOpenRecharge,
    onLogout,
}: Props) {
    return (
        <header
            data-testid="director-topnav"
            style={{
                position: "sticky",
                top: 0,
                zIndex: 30,
                height: 60,
                background: "rgba(255, 255, 255, 0.84)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderBottom: "1px solid var(--wd-border)",
                display: "flex",
                alignItems: "center",
                gap: 18,
                padding: "0 28px",
            }}
        >
            {/* Brand */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                    aria-hidden
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        background: "var(--wd-accent)",
                        color: "#fff",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 16,
                    }}
                >
                    W
                </span>
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em" }}>
                    Klyora Director
                </span>
            </div>

            {/* Nav */}
            <nav
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    marginLeft: 18,
                }}
            >
                {NAV.map((n) => (
                    <button
                        key={n.key}
                        type="button"
                        data-testid={`director-topnav-${n.key}`}
                        data-active={n.key === active}
                        onClick={() => onChange(n.key)}
                        className="wd-nav-item"
                        style={{
                            padding: "7px 12px",
                            fontSize: 13.5,
                            width: "auto",
                        }}
                    >
                        {n.label}
                        {n.key === "team" && teamCount > 0 && (
                            <span
                                className="wd-num-tabular"
                                style={{
                                    marginLeft: 4,
                                    fontSize: 10.5,
                                    fontWeight: 700,
                                    padding: "1px 6px",
                                    borderRadius: 999,
                                    background: "var(--wd-accent)",
                                    color: "#fff",
                                }}
                            >
                                {teamCount}
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            <div style={{ flex: 1 }} />

            {/* Credits chip */}
            <div
                data-testid="director-topnav-credits"
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "6px 12px 6px 8px",
                    border: "1px solid var(--wd-border)",
                    borderRadius: 999,
                    background: "var(--wd-surface)",
                    boxShadow: "var(--wd-shadow-xs)",
                }}
            >
                <span
                    aria-hidden
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background:
                            "linear-gradient(135deg, var(--wd-accent) 0%, #1A3A5C 100%)",
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <Sparkles size={11} strokeWidth={2.4} />
                </span>
                <span
                    className="wd-num-tabular"
                    data-testid="director-topnav-balance"
                    style={{ fontSize: 14, fontWeight: 600, color: "var(--wd-text)" }}
                >
                    {tokens.toLocaleString("fr-FR")}
                </span>
                <span style={{ fontSize: 11.5, color: "var(--wd-text-3)" }}>cr.</span>
            </div>

            <button
                type="button"
                data-testid="director-topnav-recharge"
                onClick={onOpenRecharge}
                className="wd-btn wd-btn-primary wd-btn-md"
            >
                <Plus size={14} strokeWidth={2.6} />
                Recharger
            </button>

            <button
                type="button"
                aria-label="Notifications"
                className="wd-btn wd-btn-secondary wd-btn-md"
                onClick={() => console.log("TODO: open notifications")}
                style={{ padding: 9, position: "relative" }}
            >
                <Bell size={15} strokeWidth={2} />
                <span
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "var(--wd-danger)",
                        border: "2px solid var(--wd-surface)",
                    }}
                />
            </button>

            <button
                type="button"
                aria-label="Mon compte"
                data-testid="director-topnav-account"
                onClick={onLogout}
                style={{
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--wd-accent)",
                    color: "#fff",
                    fontSize: 12,
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: "inherit",
                }}
            >
                JM
            </button>
        </header>
    );
}

export type { NavKey };
