"use client";

import { Flame, Sparkles, TrendingUp, Users, ArrowUpRight } from "lucide-react";
import { AgentCharacter } from "./AgentCharacter";
import type { Agent } from "../mockData";

type Props = {
    agent: Agent;
    canAfford: boolean;
    cityLabel: string;
    onOpen: (agent: Agent) => void;
    onHire: (agent: Agent) => void;
};

/**
 * Featured Agent Hero — the centerpiece of the dashboard.
 * Massive character on the left, conversion stack on the right.
 * Engineered for irresistible CTA: big number, social proof,
 * scarcity-like indicators, animated pulse.
 */
export function FeaturedAgentHero({
    agent,
    canAfford,
    cityLabel,
    onOpen,
    onHire,
}: Props) {
    const persona = colorToPersona(agent.color);
    return (
        <article
            data-testid="director-featured-hero"
            className="wd-anim-fade-up"
            style={{
                position: "relative",
                borderRadius: 22,
                overflow: "hidden",
                background: `
                    radial-gradient(900px 420px at 10% 110%, rgba(10, 37, 64, 0.08), transparent 70%),
                    radial-gradient(900px 420px at 100% 0%, var(--wd-agent-${persona}-from), transparent 70%),
                    var(--wd-surface)
                `,
                border: "1px solid var(--wd-border)",
                boxShadow: "var(--wd-shadow-lg)",
                padding: "32px 36px",
                display: "grid",
                gridTemplateColumns: "minmax(260px, 360px) 1fr",
                gap: 36,
                alignItems: "center",
            }}
        >
            {/* Subtle decorative dots */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage:
                        "radial-gradient(rgba(17, 24, 39, 0.04) 1px, transparent 1px)",
                    backgroundSize: "16px 16px",
                    pointerEvents: "none",
                    opacity: 0.55,
                }}
            />

            {/* Character column */}
            <div
                style={{
                    position: "relative",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    flexDirection: "column",
                    gap: 14,
                    zIndex: 1,
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        top: -12,
                        right: -8,
                        zIndex: 2,
                        display: "flex",
                        flexDirection: "column",
                        gap: 6,
                        alignItems: "flex-end",
                    }}
                >
                    <span
                        className="wd-pill"
                        data-testid="director-featured-hot"
                        style={{
                            background:
                                "linear-gradient(90deg, #FB923C 0%, #EF4444 100%)",
                            color: "#fff",
                            border: "1px solid rgba(255,255,255,0.5)",
                            height: 26,
                            padding: "0 11px",
                            fontWeight: 700,
                            fontSize: 11.5,
                            letterSpacing: "0.03em",
                            boxShadow: "0 8px 18px -4px rgba(239, 68, 68, 0.45)",
                        }}
                    >
                        <Flame size={11} strokeWidth={2.6} />
                        #1 cette semaine
                    </span>
                </div>
                <AgentCharacter
                    agent={agent}
                    size={220}
                    ring
                    animate
                    testId="director-featured-character"
                />
                {/* Tag below avatar */}
                <span
                    className="wd-pill"
                    data-tone="info"
                    style={{
                        background: "var(--wd-surface)",
                        color: "var(--wd-text)",
                        border: "1px solid var(--wd-border)",
                        boxShadow: "var(--wd-shadow-xs)",
                        fontWeight: 600,
                        fontSize: 11.5,
                    }}
                >
                    <Sparkles size={10} strokeWidth={2.6} />
                    Recommandé pour {cityLabel}
                </span>
            </div>

            {/* Content column */}
            <div
                style={{
                    position: "relative",
                    zIndex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: 14,
                    minWidth: 0,
                }}
            >
                <p
                    className="wd-eyebrow"
                    style={{ margin: 0, color: "var(--wd-text-2)" }}
                >
                    Agent vedette · {agent.category}
                </p>
                <h2
                    style={{
                        margin: 0,
                        fontSize: 44,
                        fontWeight: 600,
                        letterSpacing: "-0.035em",
                        color: "var(--wd-text)",
                        lineHeight: 1.05,
                    }}
                >
                    {agent.firstName}
                    <span
                        style={{
                            display: "block",
                            fontSize: 18,
                            fontWeight: 500,
                            color: "var(--wd-text-3)",
                            letterSpacing: "-0.01em",
                            marginTop: 4,
                        }}
                    >
                        {agent.jobTitle}
                    </span>
                </h2>
                <p
                    style={{
                        margin: 0,
                        fontSize: 16,
                        color: "var(--wd-text-2)",
                        lineHeight: 1.5,
                        maxWidth: 540,
                    }}
                >
                    « {agent.tagline} »
                </p>

                {/* Stat row */}
                <div
                    style={{
                        display: "flex",
                        gap: 18,
                        marginTop: 6,
                        flexWrap: "wrap",
                    }}
                >
                    <Stat
                        icon={<TrendingUp size={13} strokeWidth={2.4} />}
                        label="Résultat moyen"
                        value={agent.metric}
                        tone="success"
                    />
                    <Stat
                        icon={<Users size={13} strokeWidth={2.4} />}
                        label="Artisans embauchés cette semaine"
                        value={`${agent.weeklyHires}`}
                    />
                    <Stat
                        icon={<Sparkles size={13} strokeWidth={2.4} />}
                        label="Taux de succès"
                        value={`${agent.successRate} %`}
                    />
                </div>

                {/* CTA row */}
                <div
                    style={{
                        marginTop: 14,
                        display: "flex",
                        gap: 10,
                        flexWrap: "wrap",
                        alignItems: "center",
                    }}
                >
                    <button
                        type="button"
                        data-testid="director-featured-hire"
                        onClick={() => onHire(agent)}
                        className="wd-btn wd-btn-primary wd-btn-lg"
                        style={{
                            height: 52,
                            padding: "0 26px",
                            fontSize: 15.5,
                            fontWeight: 600,
                            boxShadow:
                                "0 14px 32px -10px rgba(10, 37, 64, 0.55), 0 4px 10px -2px rgba(10, 37, 64, 0.18)",
                        }}
                    >
                        {canAfford
                            ? `${agent.cta} · ${agent.cost} cr.`
                            : "Recharger pour embaucher"}
                        <ArrowUpRight size={16} strokeWidth={2.4} />
                    </button>
                    <button
                        type="button"
                        data-testid="director-featured-discover"
                        onClick={() => onOpen(agent)}
                        className="wd-btn wd-btn-ghost wd-btn-lg"
                        style={{ height: 52, padding: "0 16px" }}
                    >
                        En savoir plus
                    </button>
                </div>
                <div
                    style={{
                        marginTop: 4,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12.5,
                        color: "var(--wd-text-3)",
                    }}
                >
                    <span className="wd-live-dot" />
                    <span style={{ marginLeft: 4 }}>{agent.liveStat}</span>
                </div>
            </div>
        </article>
    );
}

function Stat({
    icon,
    label,
    value,
    tone,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    tone?: "success";
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
                minWidth: 0,
            }}
        >
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11.5,
                    color: "var(--wd-text-3)",
                    fontWeight: 500,
                    letterSpacing: "0.01em",
                }}
            >
                {icon}
                {label}
            </span>
            <span
                className="wd-num-tabular"
                style={{
                    fontSize: 17,
                    fontWeight: 600,
                    color: tone === "success" ? "var(--wd-success)" : "var(--wd-text)",
                    letterSpacing: "-0.015em",
                }}
            >
                {value}
            </span>
        </div>
    );
}

function colorToPersona(c: Agent["color"]) {
    return { blue: "lea", purple: "maxime", amber: "sophie", green: "antoine", cyan: "camille", indigo: "pack" }[c];
}
