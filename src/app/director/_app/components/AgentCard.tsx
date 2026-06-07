"use client";

import { Flame, ArrowUpRight, Check, TrendingUp } from "lucide-react";
import { AgentCharacter } from "./AgentCharacter";
import type { Agent } from "../mockData";

type Props = {
    agent: Agent;
    canAfford: boolean;
    active?: boolean;
    onOpen: (agent: Agent) => void;
    onHire: (agent: Agent) => void;
};

/**
 * AgentCard — "Sport-card" for the marketplace.
 * Now optimised for clarity: each agent visibly states WHAT he/she
 * does (3 deliverables) directly on the card so the user doesn't
 * have to open the detail panel to understand the value.
 */
export function AgentCard({ agent, canAfford, active, onOpen, onHire }: Props) {
    const persona = personaKey(agent);
    const bullets = agent.deliverables.slice(0, 3);

    return (
        <article
            className="wd-card wd-card-interactive wd-star-card"
            data-testid={`director-agent-card-${agent.id}`}
            onClick={() => onOpen(agent)}
            style={{
                padding: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                position: "relative",
                background: "var(--wd-surface)",
            }}
        >
            {/* Persona-tinted hero band */}
            <div
                style={{
                    position: "relative",
                    padding: "22px 22px 18px",
                    background: `
                        radial-gradient(280px 180px at 85% 0%, var(--wd-agent-${persona}-from) 0%, transparent 65%),
                        var(--wd-surface)
                    `,
                    borderBottom: "1px solid var(--wd-border-soft)",
                }}
            >
                {/* Top pills row */}
                <div
                    style={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        display: "flex",
                        gap: 6,
                        zIndex: 2,
                    }}
                >
                    {agent.trending && (
                        <span
                            className="wd-pill"
                            data-testid={`director-agent-card-${agent.id}-hot`}
                            style={{
                                background:
                                    "linear-gradient(90deg, #FF5A1F 0%, #FF8A3A 100%)",
                                color: "#fff",
                                border: "1px solid rgba(255,255,255,0.5)",
                                fontWeight: 700,
                                letterSpacing: "0.03em",
                                boxShadow:
                                    "0 6px 16px -4px rgba(255,90,31,0.45)",
                            }}
                        >
                            <Flame size={11} strokeWidth={2.6} />
                            Hot
                        </span>
                    )}
                    {active && (
                        <span
                            className="wd-pill"
                            data-tone="success"
                            data-testid={`director-agent-card-${agent.id}-active`}
                        >
                            <span className="wd-live-dot" />
                            <span style={{ marginLeft: 4 }}>Actif</span>
                        </span>
                    )}
                </div>

                {/* Hero — character + name */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 16,
                    }}
                >
                    <AgentCharacter
                        agent={agent}
                        size={88}
                        ring
                        testId={`director-agent-card-${agent.id}-character`}
                    />
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <h3
                            style={{
                                margin: 0,
                                fontSize: 22,
                                fontWeight: 700,
                                color: "var(--wd-text)",
                                letterSpacing: "-0.025em",
                                lineHeight: 1.05,
                            }}
                        >
                            {agent.firstName}
                        </h3>
                        <p
                            style={{
                                margin: "3px 0 0",
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: `var(--wd-agent-${persona}-ink)`,
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                            }}
                        >
                            {agent.jobTitle}
                        </p>
                    </div>
                </div>
            </div>

            {/* What I do — explicit bullets */}
            <div
                data-testid={`director-agent-card-${agent.id}-bullets`}
                style={{
                    padding: "16px 22px 6px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    flex: 1,
                }}
            >
                <p
                    style={{
                        margin: 0,
                        fontSize: 10.5,
                        fontWeight: 700,
                        color: "var(--wd-text-3)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                    }}
                >
                    Ce que je fais
                </p>
                <ul
                    style={{
                        listStyle: "none",
                        margin: 0,
                        padding: 0,
                        display: "flex",
                        flexDirection: "column",
                        gap: 7,
                    }}
                >
                    {bullets.map((b, i) => (
                        <li
                            key={i}
                            style={{
                                display: "flex",
                                alignItems: "flex-start",
                                gap: 9,
                                fontSize: 12.5,
                                color: "var(--wd-text-2)",
                                lineHeight: 1.4,
                            }}
                        >
                            <span
                                aria-hidden
                                style={{
                                    width: 16,
                                    height: 16,
                                    borderRadius: "50%",
                                    background: "var(--wd-accent-soft)",
                                    color: "var(--wd-accent)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                    marginTop: 1,
                                }}
                            >
                                <Check size={9} strokeWidth={3.2} />
                            </span>
                            <span>{b}</span>
                        </li>
                    ))}
                </ul>

                {/* Result promise — single, large, the wow */}
                <div
                    data-testid={`director-agent-card-${agent.id}-result`}
                    style={{
                        marginTop: 10,
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: "var(--wd-accent-soft)",
                        border: "1px solid rgba(255, 90, 31, 0.18)",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
                    <span
                        aria-hidden
                        style={{
                            width: 24,
                            height: 24,
                            borderRadius: 7,
                            background: "var(--wd-accent)",
                            color: "#fff",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <TrendingUp size={12} strokeWidth={2.6} />
                    </span>
                    <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                            style={{
                                fontSize: 13.5,
                                fontWeight: 700,
                                color: "var(--wd-accent-ink)",
                                letterSpacing: "-0.015em",
                                lineHeight: 1.2,
                            }}
                        >
                            {agent.metric}
                        </div>
                        <div
                            style={{
                                fontSize: 11.5,
                                color: "var(--wd-text-3)",
                                marginTop: 2,
                                lineHeight: 1.4,
                            }}
                        >
                            {agent.metricDetail}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer CTA */}
            <div
                style={{
                    padding: "14px 22px 18px",
                    borderTop: "1px solid var(--wd-border-soft)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                }}
            >
                <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1 }}>
                    <span
                        style={{
                            fontSize: 10.5,
                            fontWeight: 600,
                            color: "var(--wd-text-3)",
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                        }}
                    >
                        À partir de
                    </span>
                    <span
                        className="wd-num-tabular"
                        style={{
                            fontSize: 18,
                            fontWeight: 700,
                            color: "var(--wd-text)",
                            letterSpacing: "-0.02em",
                            marginTop: 2,
                        }}
                    >
                        {agent.cost}{" "}
                        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--wd-text-3)" }}>
                            cr.
                        </span>
                    </span>
                </div>
                <button
                    type="button"
                    className={
                        canAfford
                            ? "wd-btn wd-btn-primary wd-btn-md wd-btn-pulse"
                            : "wd-btn wd-btn-secondary wd-btn-md"
                    }
                    data-testid={`director-agent-card-${agent.id}-hire`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onHire(agent);
                    }}
                >
                    {canAfford ? "Embaucher" : "Recharger"}
                    <ArrowUpRight size={13} strokeWidth={2.4} />
                </button>
            </div>
        </article>
    );
}

function personaKey(agent: Agent): string {
    const map: Record<Agent["color"], string> = {
        blue: "lea",
        purple: "maxime",
        amber: "sophie",
        green: "antoine",
        cyan: "camille",
        indigo: "pack",
    };
    return map[agent.color];
}
