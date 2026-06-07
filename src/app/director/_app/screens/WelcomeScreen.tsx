"use client";

import { useEffect, useMemo, useState } from "react";
import {
    ArrowRight,
    Search,
    AlertTriangle,
    Globe2,
    PhoneOff,
    Sparkles,
    type LucideIcon,
} from "lucide-react";
import { AgentCharacter } from "../components/AgentCharacter";
import { MOCK_ACCOUNT, MOCK_AGENTS } from "../mockData";
import type { Agent } from "../mockData";

/**
 * SCREEN 3 — /director/welcome  (first-login experience)
 * ────────────────────────────────────────────────────────────
 * Apple-iCloud-style business scan:
 *   1. Business name fades in centred, scaled up
 *   2. Radar pulses sweep outward · "Analyse de votre présence
 *      numérique…" status fades in
 *   3. Three weak-spot findings pop into orbit around the name,
 *      each linked back with a dashed thread
 *   4. The matching AI agent (DiceBear character) flies in next
 *      to each finding with a "résoudra ça" tag
 *   5. Final CTA appears: "Activer ma console"
 *
 * The whole animation runs in ~7s and can be skipped at any time.
 */

type Finding = {
    id: string;
    icon: LucideIcon;
    title: string;
    detail: string;
    severity: "high" | "medium";
    angle: number; // degrees on the orbit
    agentId: string;
};

type Props = {
    firstName?: string;
    businessName?: string;
    city?: string;
    onContinue: () => void;
};

export function WelcomeScreen({
    firstName = MOCK_ACCOUNT.firstName,
    businessName = MOCK_ACCOUNT.businessName,
    city = MOCK_ACCOUNT.city,
    onContinue,
}: Props) {
    const [phase, setPhase] = useState(0);

    const findings = useMemo<Finding[]>(
        () => [
            {
                id: "f1",
                icon: Globe2,
                title: "Invisible sur Google",
                detail:
                    "70 % des recherches « plombier Lyon » vont chez vos concurrents.",
                severity: "high",
                angle: -130,
                agentId: "seo",
            },
            {
                id: "f2",
                icon: AlertTriangle,
                title: "Note Google · 3,4 / 5",
                detail:
                    "En dessous de 4,0 — les clients filtrent et choisissent ailleurs.",
                severity: "high",
                angle: -50,
                agentId: "reputation",
            },
            {
                id: "f3",
                icon: PhoneOff,
                title: "47 % d'appels manqués",
                detail:
                    "Hors horaires, vos prospects ne laissent pas de message.",
                severity: "medium",
                angle: 90,
                agentId: "chatbot",
            },
        ],
        [],
    );

    const agentsById = useMemo(() => {
        const m = new Map<string, Agent>();
        for (const a of MOCK_AGENTS) m.set(a.id, a);
        return m;
    }, []);

    // Phase scheduler
    useEffect(() => {
        const timeline = [400, 1200, 2400, 4500, 6500];
        const timers = timeline.map((ms, i) =>
            setTimeout(() => setPhase(i + 1), ms),
        );
        return () => timers.forEach((t) => clearTimeout(t));
    }, []);

    const skipAnimation = () => setPhase(5);

    return (
        <div
            data-testid="director-welcome-screen"
            style={{
                minHeight: "100vh",
                background:
                    "radial-gradient(1000px 600px at 50% 35%, #FFFBF6 0%, #FFF6EC 35%, #FFFFFF 75%)",
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Top bar */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "20px 32px",
                    position: "relative",
                    zIndex: 5,
                }}
            >
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
                    <span
                        style={{
                            fontSize: 15,
                            fontWeight: 600,
                            color: "var(--wd-text)",
                            letterSpacing: "-0.01em",
                        }}
                    >
                        WebDirector
                    </span>
                </div>
                {phase < 5 && (
                    <button
                        type="button"
                        data-testid="director-welcome-skip"
                        onClick={skipAnimation}
                        className="wd-btn wd-btn-ghost wd-btn-sm"
                        style={{ color: "var(--wd-text-3)" }}
                    >
                        Passer l&apos;animation
                    </button>
                )}
            </div>

            {/* Stage */}
            <div
                style={{
                    flex: 1,
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "0 24px 60px",
                }}
            >
                {/* Stage canvas */}
                <div
                    style={{
                        position: "relative",
                        width: "min(880px, 100%)",
                        height: 480,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    {/* Radar rings */}
                    <RadarRings active={phase >= 1 && phase < 4} />

                    {/* Central business card */}
                    <div
                        data-testid="director-welcome-business"
                        style={{
                            position: "relative",
                            zIndex: 4,
                            textAlign: "center",
                            opacity: phase >= 1 ? 1 : 0,
                            transform:
                                phase >= 1
                                    ? "scale(1)"
                                    : "scale(0.92)",
                            transition: "opacity 700ms var(--wd-ease), transform 700ms var(--wd-ease)",
                        }}
                    >
                        <p
                            className="wd-eyebrow"
                            style={{
                                margin: 0,
                                color: "var(--wd-accent)",
                                opacity: phase >= 1 ? 1 : 0,
                                transition: "opacity 600ms 200ms var(--wd-ease)",
                            }}
                        >
                            Bonjour {firstName}
                        </p>
                        <h1
                            style={{
                                margin: "6px 0 0",
                                fontSize: "clamp(40px, 6vw, 64px)",
                                fontWeight: 700,
                                letterSpacing: "-0.04em",
                                color: "var(--wd-text)",
                                lineHeight: 1.05,
                                textShadow:
                                    "0 14px 40px rgba(255, 90, 31, 0.10)",
                            }}
                        >
                            {businessName}
                        </h1>
                        <p
                            style={{
                                margin: "8px 0 0",
                                fontSize: 14,
                                color: "var(--wd-text-3)",
                                fontWeight: 500,
                            }}
                        >
                            📍 {city}
                        </p>

                        {phase >= 1 && phase < 4 && (
                            <div
                                data-testid="director-welcome-status"
                                className="wd-anim-fade-up"
                                style={{
                                    marginTop: 18,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "7px 14px",
                                    borderRadius: 999,
                                    background: "var(--wd-surface)",
                                    border: "1px solid var(--wd-border)",
                                    boxShadow: "var(--wd-shadow-sm)",
                                    fontSize: 12.5,
                                    color: "var(--wd-text-2)",
                                    fontWeight: 500,
                                }}
                            >
                                <Search size={12} strokeWidth={2.4} />
                                <span>
                                    {phase < 2
                                        ? "Analyse de votre présence numérique…"
                                        : phase < 3
                                          ? "Recherche des points faibles…"
                                          : "Matching des agents IA…"}
                                </span>
                                <span
                                    className="wd-spinner-dot"
                                    style={{ marginLeft: 4 }}
                                />
                            </div>
                        )}

                        {phase >= 4 && (
                            <div
                                data-testid="director-welcome-summary"
                                className="wd-anim-fade-up"
                                style={{
                                    marginTop: 18,
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                    padding: "8px 16px",
                                    borderRadius: 999,
                                    background: "var(--wd-accent)",
                                    color: "#fff",
                                    fontSize: 13,
                                    fontWeight: 600,
                                    boxShadow:
                                        "0 12px 28px -10px rgba(255, 90, 31, 0.50)",
                                }}
                            >
                                <Sparkles size={13} strokeWidth={2.4} />
                                <span>3 agents recommandés pour vous</span>
                            </div>
                        )}
                    </div>

                    {/* Findings orbit */}
                    {findings.map((f, i) => (
                        <FindingChip
                            key={f.id}
                            finding={f}
                            visible={phase >= 2}
                            delay={i * 320}
                        />
                    ))}

                    {/* Agent recommendations (next to findings) */}
                    {findings.map((f, i) => {
                        const agent = agentsById.get(f.agentId);
                        if (!agent) return null;
                        return (
                            <AgentMatchBadge
                                key={`m-${f.id}`}
                                agent={agent}
                                angle={f.angle}
                                visible={phase >= 3}
                                delay={i * 320}
                            />
                        );
                    })}

                    {/* Dashed connector lines */}
                    <ConnectorLines findings={findings} visible={phase >= 2} />
                </div>

                {/* Final CTA */}
                <div
                    style={{
                        marginTop: 24,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 10,
                        opacity: phase >= 5 ? 1 : 0,
                        transform:
                            phase >= 5 ? "translateY(0)" : "translateY(16px)",
                        transition:
                            "opacity 600ms var(--wd-ease), transform 600ms var(--wd-ease)",
                        pointerEvents: phase >= 5 ? "auto" : "none",
                    }}
                >
                    <button
                        type="button"
                        data-testid="director-welcome-cta"
                        onClick={onContinue}
                        className="wd-btn wd-btn-primary wd-btn-lg wd-btn-pulse"
                        style={{ minWidth: 280 }}
                    >
                        Activer ma console
                        <ArrowRight size={15} strokeWidth={2.4} />
                    </button>
                    <p
                        style={{
                            margin: 0,
                            fontSize: 12,
                            color: "var(--wd-text-3)",
                        }}
                    >
                        100 crédits offerts · sans engagement
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes wd-radar-pulse {
                    0%   { transform: scale(0.4); opacity: 0.55; }
                    100% { transform: scale(1.6); opacity: 0; }
                }
                @keyframes wd-radar-sweep {
                    0%   { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .wd-spinner-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                    background: var(--wd-accent);
                    display: inline-block;
                    animation: wd-pulse 1.4s var(--wd-ease) infinite;
                }
            `}</style>
        </div>
    );
}

/* ─────────────────────── pieces ────────────────────────── */

function RadarRings({ active }: { active: boolean }) {
    if (!active) return null;
    return (
        <div
            aria-hidden
            style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
                zIndex: 1,
            }}
        >
            {[0, 1, 2, 3].map((i) => (
                <span
                    key={i}
                    style={{
                        position: "absolute",
                        width: 280,
                        height: 280,
                        borderRadius: "50%",
                        border: "1.5px solid var(--wd-accent)",
                        opacity: 0,
                        animation: `wd-radar-pulse 3.4s var(--wd-ease) ${i * 0.85}s infinite`,
                    }}
                />
            ))}
            {/* Rotating sweep */}
            <span
                style={{
                    position: "absolute",
                    width: 320,
                    height: 320,
                    borderRadius: "50%",
                    background:
                        "conic-gradient(from 0deg, transparent 80%, rgba(255,90,31,0.18) 95%, transparent 100%)",
                    animation: "wd-radar-sweep 3.2s linear infinite",
                }}
            />
        </div>
    );
}

function FindingChip({
    finding,
    visible,
    delay,
}: {
    finding: Finding;
    visible: boolean;
    delay: number;
}) {
    const Icon = finding.icon;
    const pos = polar(finding.angle, 230);
    const sevColor =
        finding.severity === "high" ? "var(--wd-accent)" : "#D97706";

    return (
        <div
            data-testid={`director-welcome-finding-${finding.id}`}
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) ${
                    visible ? "scale(1)" : "scale(0.6)"
                }`,
                opacity: visible ? 1 : 0,
                transition: `opacity 520ms ${delay}ms var(--wd-ease), transform 620ms ${delay}ms cubic-bezier(0.34, 1.4, 0.64, 1)`,
                width: 200,
                zIndex: 3,
            }}
        >
            <div
                className="wd-card"
                style={{
                    padding: "12px 14px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    boxShadow:
                        "0 18px 40px -12px rgba(20, 17, 15, 0.18), 0 0 0 1px rgba(255, 90, 31, 0.10)",
                    background: "var(--wd-surface)",
                    position: "relative",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                    }}
                >
                    <span
                        aria-hidden
                        style={{
                            width: 26,
                            height: 26,
                            borderRadius: 8,
                            background: "var(--wd-accent-soft)",
                            color: sevColor,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                        }}
                    >
                        <Icon size={13} strokeWidth={2.4} />
                    </span>
                    <span
                        style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: "var(--wd-text)",
                            letterSpacing: "-0.01em",
                            lineHeight: 1.2,
                        }}
                    >
                        {finding.title}
                    </span>
                </div>
                <p
                    style={{
                        margin: 0,
                        fontSize: 11.5,
                        color: "var(--wd-text-3)",
                        lineHeight: 1.45,
                    }}
                >
                    {finding.detail}
                </p>
            </div>
        </div>
    );
}

function AgentMatchBadge({
    agent,
    angle,
    visible,
    delay,
}: {
    agent: Agent;
    angle: number;
    visible: boolean;
    delay: number;
}) {
    const pos = polar(angle, 360);
    return (
        <div
            data-testid={`director-welcome-agent-match-${agent.id}`}
            style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: `translate(calc(-50% + ${pos.x}px), calc(-50% + ${pos.y}px)) ${
                    visible ? "scale(1)" : "scale(0.5)"
                }`,
                opacity: visible ? 1 : 0,
                transition: `opacity 520ms ${delay + 240}ms var(--wd-ease), transform 720ms ${delay + 240}ms cubic-bezier(0.34, 1.4, 0.64, 1)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                zIndex: 3,
            }}
        >
            <AgentCharacter agent={agent} size={64} ring animate />
            <div
                style={{
                    background: "var(--wd-text)",
                    color: "#fff",
                    padding: "5px 10px",
                    borderRadius: 999,
                    fontSize: 11.5,
                    fontWeight: 600,
                    letterSpacing: "-0.005em",
                    whiteSpace: "nowrap",
                    boxShadow: "var(--wd-shadow-md)",
                }}
            >
                {agent.firstName} → résout ça
            </div>
        </div>
    );
}

function ConnectorLines({
    findings,
    visible,
}: {
    findings: Finding[];
    visible: boolean;
}) {
    return (
        <svg
            aria-hidden
            viewBox="-440 -240 880 480"
            style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: visible ? 1 : 0,
                transition: "opacity 800ms 220ms var(--wd-ease)",
                pointerEvents: "none",
                zIndex: 2,
            }}
        >
            {findings.map((f) => {
                const p = polar(f.angle, 230);
                return (
                    <line
                        key={f.id}
                        x1={0}
                        y1={0}
                        x2={p.x}
                        y2={p.y}
                        stroke="var(--wd-accent)"
                        strokeWidth={1}
                        strokeDasharray="4 6"
                        opacity={0.45}
                    />
                );
            })}
        </svg>
    );
}

function polar(angleDeg: number, radius: number) {
    const rad = (angleDeg * Math.PI) / 180;
    return { x: Math.cos(rad) * radius, y: Math.sin(rad) * radius };
}
