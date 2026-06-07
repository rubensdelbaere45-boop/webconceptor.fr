"use client";

import { X, ArrowUpRight, Check, Quote, ChevronDown, Flame, Users, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AgentCharacter } from "./AgentCharacter";
import type { Agent } from "../mockData";

type Props = {
    agent: Agent | null;
    canAfford: boolean;
    onClose: () => void;
    onHire: (agent: Agent) => void;
};

/**
 * Side panel that slides in from the right.
 * Shows the agent persona band, pitch, metric, deliverables,
 * testimonial and an inline FAQ. Inspired by Stripe Dashboard
 * detail panels and Linear's issue side-overs.
 */
export function AgentDetailPanel({ agent, canAfford, onClose, onHire }: Props) {
    const [mounted, setMounted] = useState(false);
    const [openFaq, setOpenFaq] = useState<number | null>(0);

    useEffect(() => {
        if (agent) {
            setMounted(true);
            setOpenFaq(0);
        } else {
            const t = setTimeout(() => setMounted(false), 260);
            return () => clearTimeout(t);
        }
    }, [agent]);

    if (!agent && !mounted) return null;

    const visible = !!agent;
    const persona = agent ? personaKey(agent) : "lea";

    return (
        <>
            <div
                data-testid="director-detail-overlay"
                onClick={onClose}
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 60,
                    background: "rgba(10, 37, 64, 0.32)",
                    backdropFilter: "blur(4px)",
                    WebkitBackdropFilter: "blur(4px)",
                    opacity: visible ? 1 : 0,
                    transition: "opacity 240ms var(--wd-ease)",
                    pointerEvents: visible ? "auto" : "none",
                }}
            />
            <aside
                data-testid="director-detail-panel"
                role="dialog"
                aria-label={agent?.firstName}
                style={{
                    position: "fixed",
                    top: 0,
                    right: 0,
                    height: "100vh",
                    width: "min(520px, 100vw)",
                    background: "var(--wd-surface)",
                    borderLeft: "1px solid var(--wd-border)",
                    zIndex: 70,
                    transform: visible ? "translateX(0)" : "translateX(100%)",
                    transition: "transform 320ms var(--wd-ease)",
                    boxShadow: "var(--wd-shadow-xl)",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {agent && (
                    <>
                        {/* Persona header */}
                        <div
                            aria-hidden
                            style={{
                                position: "relative",
                                height: 168,
                                background: `linear-gradient(135deg, var(--wd-agent-${persona}-from) 0%, var(--wd-agent-${persona}-to) 100%)`,
                                overflow: "hidden",
                                flexShrink: 0,
                            }}
                        >
                            <div className="wd-grain" />
                            <button
                                type="button"
                                aria-label="Fermer"
                                data-testid="director-detail-close"
                                onClick={onClose}
                                style={{
                                    position: "absolute",
                                    top: 16,
                                    right: 16,
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    background: "rgba(255,255,255,0.85)",
                                    border: "1px solid rgba(0,0,0,0.04)",
                                    boxShadow: "var(--wd-shadow-sm)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    cursor: "pointer",
                                    color: "var(--wd-text-2)",
                                }}
                            >
                                <X size={15} strokeWidth={2.2} />
                            </button>
                            <div
                                style={{
                                    position: "absolute",
                                    bottom: -44,
                                    left: 28,
                                    display: "flex",
                                    alignItems: "flex-end",
                                    gap: 14,
                                }}
                            >
                                <AgentCharacter
                                    agent={agent}
                                    size={108}
                                    ring
                                    testId="director-detail-character"
                                />
                                {agent.trending && (
                                    <span
                                        className="wd-pill"
                                        style={{
                                            background:
                                                "linear-gradient(90deg, #FB923C 0%, #EF4444 100%)",
                                            color: "#fff",
                                            border: "1px solid rgba(255,255,255,0.5)",
                                            fontWeight: 700,
                                            letterSpacing: "0.03em",
                                            boxShadow:
                                                "0 8px 18px -4px rgba(239,68,68,0.45)",
                                            marginBottom: 8,
                                        }}
                                    >
                                        <Flame size={11} strokeWidth={2.6} />
                                        Hot cette semaine
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Title */}
                        <div style={{ padding: "56px 28px 0" }}>
                            <p className="wd-eyebrow" style={{ margin: 0 }}>
                                {agent.category}
                            </p>
                            <h2
                                style={{
                                    margin: "6px 0 0",
                                    fontSize: 28,
                                    fontWeight: 700,
                                    color: "var(--wd-text)",
                                    letterSpacing: "-0.025em",
                                    lineHeight: 1.1,
                                }}
                            >
                                {agent.firstName}
                            </h2>
                            <p
                                style={{
                                    margin: "4px 0 0",
                                    fontSize: 14,
                                    color: "var(--wd-text-3)",
                                    fontWeight: 500,
                                }}
                            >
                                {agent.jobTitle}
                            </p>

                            {/* Social proof row */}
                            <div
                                style={{
                                    marginTop: 14,
                                    display: "flex",
                                    gap: 18,
                                    flexWrap: "wrap",
                                }}
                            >
                                <SocialStat
                                    icon={<Users size={12} strokeWidth={2.4} />}
                                    label="Embauches /sem."
                                    value={`${agent.weeklyHires}`}
                                />
                                <SocialStat
                                    icon={<Sparkles size={12} strokeWidth={2.4} />}
                                    label="Taux de succès"
                                    value={`${agent.successRate} %`}
                                />
                                <SocialStat
                                    icon={
                                        <span
                                            style={{
                                                width: 6,
                                                height: 6,
                                                borderRadius: "50%",
                                                background: "var(--wd-success)",
                                                display: "inline-block",
                                            }}
                                        />
                                    }
                                    label="En direct"
                                    value={agent.liveStat}
                                    small
                                />
                            </div>
                        </div>

                        {/* Scrollable body */}
                        <div
                            style={{
                                flex: 1,
                                overflowY: "auto",
                                padding: "20px 28px 24px",
                                display: "flex",
                                flexDirection: "column",
                                gap: 22,
                            }}
                        >
                            <p
                                data-testid="director-detail-pitch"
                                style={{
                                    margin: 0,
                                    fontSize: 14.5,
                                    color: "var(--wd-text-2)",
                                    lineHeight: 1.6,
                                }}
                            >
                                <span style={{ fontWeight: 600, color: "var(--wd-text)" }}>
                                    {agent.intro}
                                </span>{" "}
                                {agent.pitch}
                            </p>

                            {/* Metric */}
                            <div
                                data-testid="director-detail-metric"
                                style={{
                                    padding: "14px 16px",
                                    background: "var(--wd-accent-soft)",
                                    border: "1px solid rgba(10, 37, 64, 0.08)",
                                    borderRadius: 12,
                                    display: "flex",
                                    gap: 12,
                                    alignItems: "flex-start",
                                }}
                            >
                                <span
                                    aria-hidden
                                    style={{
                                        width: 30,
                                        height: 30,
                                        borderRadius: 9,
                                        background: "var(--wd-accent)",
                                        color: "#fff",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexShrink: 0,
                                    }}
                                >
                                    <ArrowUpRight size={15} strokeWidth={2.4} />
                                </span>
                                <div>
                                    <div
                                        className="wd-num-tabular"
                                        style={{
                                            fontSize: 16,
                                            fontWeight: 600,
                                            color: "var(--wd-text)",
                                            letterSpacing: "-0.01em",
                                        }}
                                    >
                                        {agent.metric}
                                    </div>
                                    <p
                                        style={{
                                            margin: "4px 0 0",
                                            fontSize: 12.5,
                                            color: "var(--wd-text-2)",
                                            lineHeight: 1.5,
                                        }}
                                    >
                                        {agent.metricDetail}
                                    </p>
                                </div>
                            </div>

                            {/* Deliverables */}
                            <div>
                                <p className="wd-eyebrow" style={{ margin: "0 0 10px" }}>
                                    Ce que je fais pour vous
                                </p>
                                <ul
                                    data-testid="director-detail-deliverables"
                                    style={{
                                        margin: 0,
                                        padding: 0,
                                        listStyle: "none",
                                        display: "grid",
                                        gap: 8,
                                    }}
                                >
                                    {agent.deliverables.map((d) => (
                                        <li
                                            key={d}
                                            style={{
                                                display: "flex",
                                                alignItems: "flex-start",
                                                gap: 9,
                                                fontSize: 13.5,
                                                color: "var(--wd-text)",
                                                lineHeight: 1.5,
                                            }}
                                        >
                                            <span
                                                aria-hidden
                                                style={{
                                                    width: 18,
                                                    height: 18,
                                                    borderRadius: "50%",
                                                    background: "var(--wd-success-bg)",
                                                    color: "var(--wd-success)",
                                                    display: "inline-flex",
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    flexShrink: 0,
                                                    marginTop: 1,
                                                }}
                                            >
                                                <Check size={11} strokeWidth={3} />
                                            </span>
                                            {d}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Testimonial */}
                            {agent.testimonial && (
                                <figure
                                    data-testid="director-detail-testimonial"
                                    style={{
                                        margin: 0,
                                        padding: "16px 18px",
                                        border: "1px solid var(--wd-border)",
                                        borderRadius: 12,
                                        background: "var(--wd-bg-alt)",
                                        position: "relative",
                                    }}
                                >
                                    <Quote
                                        size={14}
                                        strokeWidth={2}
                                        style={{
                                            color: "var(--wd-text-4)",
                                            marginBottom: 8,
                                        }}
                                    />
                                    <blockquote
                                        style={{
                                            margin: 0,
                                            fontSize: 13.5,
                                            color: "var(--wd-text)",
                                            lineHeight: 1.55,
                                            fontStyle: "italic",
                                        }}
                                    >
                                        « {agent.testimonial.quote} »
                                    </blockquote>
                                    <figcaption
                                        style={{
                                            marginTop: 10,
                                            fontSize: 12,
                                            color: "var(--wd-text-3)",
                                            fontWeight: 500,
                                        }}
                                    >
                                        — {agent.testimonial.author}
                                    </figcaption>
                                </figure>
                            )}

                            {/* FAQ */}
                            {agent.faq && agent.faq.length > 0 && (
                                <div>
                                    <p className="wd-eyebrow" style={{ margin: "0 0 10px" }}>
                                        Questions fréquentes
                                    </p>
                                    <div
                                        data-testid="director-detail-faq"
                                        style={{
                                            border: "1px solid var(--wd-border)",
                                            borderRadius: 12,
                                            overflow: "hidden",
                                            background: "var(--wd-surface)",
                                        }}
                                    >
                                        {agent.faq.map((item, i) => {
                                            const open = openFaq === i;
                                            return (
                                                <div
                                                    key={i}
                                                    data-testid={`director-detail-faq-${i}`}
                                                    style={{
                                                        borderTop:
                                                            i === 0
                                                                ? "none"
                                                                : "1px solid var(--wd-border)",
                                                    }}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setOpenFaq(open ? null : i)
                                                        }
                                                        aria-expanded={open}
                                                        style={{
                                                            width: "100%",
                                                            background: "transparent",
                                                            border: "none",
                                                            cursor: "pointer",
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent:
                                                                "space-between",
                                                            gap: 10,
                                                            padding: "13px 16px",
                                                            textAlign: "left",
                                                            fontSize: 13.5,
                                                            fontWeight: 500,
                                                            color: "var(--wd-text)",
                                                            fontFamily: "inherit",
                                                        }}
                                                    >
                                                        {item.q}
                                                        <ChevronDown
                                                            size={14}
                                                            strokeWidth={2.2}
                                                            style={{
                                                                color: "var(--wd-text-3)",
                                                                transform: open
                                                                    ? "rotate(180deg)"
                                                                    : "rotate(0)",
                                                                transition:
                                                                    "transform 200ms var(--wd-ease)",
                                                            }}
                                                        />
                                                    </button>
                                                    {open && (
                                                        <div
                                                            style={{
                                                                padding: "0 16px 14px",
                                                                fontSize: 13,
                                                                color: "var(--wd-text-2)",
                                                                lineHeight: 1.55,
                                                            }}
                                                        >
                                                            {item.a}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer CTA */}
                        <div
                            style={{
                                padding: "16px 28px 24px",
                                borderTop: "1px solid var(--wd-border)",
                                background: "var(--wd-bg-alt)",
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                            }}
                        >
                            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.2 }}>
                                <span className="wd-eyebrow" style={{ margin: 0 }}>
                                    Coût
                                </span>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "baseline",
                                        gap: 4,
                                    }}
                                >
                                    <span
                                        className="wd-num-tabular"
                                        style={{
                                            fontSize: 22,
                                            fontWeight: 600,
                                            color: "var(--wd-text)",
                                            letterSpacing: "-0.02em",
                                        }}
                                    >
                                        {agent.cost}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 12.5,
                                            color: "var(--wd-text-3)",
                                            fontWeight: 500,
                                        }}
                                    >
                                        crédits / mois
                                    </span>
                                </div>
                            </div>
                            <div style={{ flex: 1 }} />
                            <button
                                type="button"
                                data-testid="director-detail-hire"
                                onClick={() => onHire(agent)}
                                className="wd-btn wd-btn-primary wd-btn-lg"
                            >
                                {canAfford ? agent.cta : "Recharger pour embaucher"}
                                <ArrowUpRight size={15} strokeWidth={2.4} />
                            </button>
                        </div>
                    </>
                )}
            </aside>
        </>
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

function SocialStat({
    icon,
    label,
    value,
    small,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    small?: boolean;
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
                minWidth: 0,
                maxWidth: small ? 220 : "auto",
            }}
        >
            <span
                style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    fontSize: 11,
                    color: "var(--wd-text-3)",
                    fontWeight: 500,
                    letterSpacing: "0.005em",
                }}
            >
                {icon}
                {label}
            </span>
            <span
                className={small ? undefined : "wd-num-tabular"}
                style={{
                    fontSize: small ? 12 : 15,
                    fontWeight: small ? 500 : 700,
                    color: "var(--wd-text)",
                    letterSpacing: "-0.015em",
                    lineHeight: 1.3,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: small ? "normal" : "nowrap",
                }}
            >
                {value}
            </span>
        </div>
    );
}
