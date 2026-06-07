"use client";

import {
    Target,
    TrendingUp,
    Star,
    MapPin,
    MessageCircle,
    Layers,
    PauseCircle,
    Settings2,
} from "lucide-react";
import type { Agent } from "../mockData";

const ICONS = {
    Target,
    TrendingUp,
    Star,
    MapPin,
    MessageCircle,
    Layers,
} as const;

type Props = {
    agent: Agent;
    onConfigure?: (agent: Agent) => void;
    onPause?: (agent: Agent) => void;
};

/**
 * Compact chip used inside the "Votre équipe" strip — shows
 * a hired agent's status and quick actions.
 */
export function ActiveAgentChip({ agent, onConfigure, onPause }: Props) {
    const Icon = ICONS[agent.iconName];
    const persona = personaKey(agent);

    return (
        <div
            className="wd-card"
            data-testid={`director-active-agent-${agent.id}`}
            style={{
                padding: "14px 16px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 260,
                flex: "0 0 auto",
            }}
        >
            <span
                aria-hidden
                style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    background: `linear-gradient(135deg, var(--wd-agent-${persona}-from) 0%, var(--wd-agent-${persona}-to) 100%)`,
                    color: `var(--wd-agent-${persona}-ink)`,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow:
                        "inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -1px 0 rgba(0,0,0,0.04)",
                    flexShrink: 0,
                }}
            >
                <Icon size={18} strokeWidth={2} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "var(--wd-text)",
                        letterSpacing: "-0.01em",
                    }}
                >
                    {agent.firstName}
                    <span className="wd-live-dot" style={{ marginLeft: 2 }} />
                </div>
                <div
                    style={{
                        fontSize: 11.5,
                        color: "var(--wd-text-3)",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {agent.jobTitle}
                </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
                {onConfigure && (
                    <button
                        type="button"
                        aria-label={`Configurer ${agent.firstName}`}
                        data-testid={`director-active-agent-${agent.id}-configure`}
                        onClick={() => onConfigure(agent)}
                        className="wd-btn wd-btn-ghost wd-btn-sm"
                        style={{ padding: 6, height: 28 }}
                    >
                        <Settings2 size={13} strokeWidth={2} />
                    </button>
                )}
                {onPause && (
                    <button
                        type="button"
                        aria-label={`Mettre en pause ${agent.firstName}`}
                        data-testid={`director-active-agent-${agent.id}-pause`}
                        onClick={() => onPause(agent)}
                        className="wd-btn wd-btn-ghost wd-btn-sm"
                        style={{ padding: 6, height: 28 }}
                    >
                        <PauseCircle size={13} strokeWidth={2} />
                    </button>
                )}
            </div>
        </div>
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
