"use client";

import type { Agent } from "../mockData";

/**
 * AgentCharacter — illustrated cartoon avatar.
 * Uses DiceBear (notionists style) so we get a unique
 * character face per agent seed without bundling images.
 * No network calls at build time — the SVG is loaded by the browser.
 */
const BG: Record<Agent["color"], string> = {
    blue:   "DBEAFE",
    purple: "EDE9FE",
    amber:  "FEF3C7",
    green:  "D1FAE5",
    cyan:   "CFFAFE",
    indigo: "E0E7FF",
};

const RING: Record<Agent["color"], string> = {
    blue:   "rgba(30, 58, 138, 0.18)",
    purple: "rgba(91, 33, 182, 0.18)",
    amber:  "rgba(146, 64, 14, 0.18)",
    green:  "rgba(6, 95, 70, 0.18)",
    cyan:   "rgba(21, 94, 117, 0.18)",
    indigo: "rgba(55, 48, 163, 0.18)",
};

type Props = {
    agent: Pick<Agent, "firstName" | "avatarSeed" | "color">;
    size?: number;
    /** Add a subtle ring around the character (default: true). */
    ring?: boolean;
    /** Tone of the persona gradient background. */
    variant?: "round" | "square";
    /** Render with a subtle floating animation. */
    animate?: boolean;
    testId?: string;
};

export function AgentCharacter({
    agent,
    size = 96,
    ring = true,
    variant = "round",
    animate = false,
    testId,
}: Props) {
    const bg = BG[agent.color] ?? "F1F5F9";
    const url = `https://api.dicebear.com/9.x/notionists/svg?seed=${encodeURIComponent(agent.avatarSeed)}&backgroundColor=${bg}&radius=${variant === "round" ? 50 : 18}&scale=110`;

    return (
        <span
            data-testid={testId ?? `director-character-${agent.firstName}`}
            style={{
                position: "relative",
                display: "inline-block",
                width: size,
                height: size,
                borderRadius: variant === "round" ? "50%" : Math.round(size * 0.22),
                background: `#${bg}`,
                boxShadow: ring
                    ? `0 0 0 2px #fff, 0 0 0 ${Math.max(3, Math.round(size * 0.04))}px ${RING[agent.color]}`
                    : "none",
                overflow: "hidden",
                flexShrink: 0,
                animation: animate ? "wd-float 5.5s var(--wd-ease) infinite" : undefined,
            }}
        >
            <img
                src={url}
                alt={agent.firstName}
                width={size}
                height={size}
                loading="eager"
                style={{
                    display: "block",
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                }}
            />
        </span>
    );
}
