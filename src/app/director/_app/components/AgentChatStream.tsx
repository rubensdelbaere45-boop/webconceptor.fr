"use client";

import { useEffect, useState } from "react";
import { Check, Sparkles, TrendingUp } from "lucide-react";
import { AgentCharacter } from "./AgentCharacter";
import type { AgentColor, ChatStep, ChatThread } from "../mockData";

type Props = {
    threads: ChatThread[];
};

/**
 * AgentChatStream — animated chat preview shown on the Login screen.
 * Cycles through real-world conversations between a business owner and
 * the WebDirector AI agents. Each thread plays:
 *   owner asks → agent answers (typing → message) → result card pops.
 * Designed to feel alive without any real chat backend.
 */
export function AgentChatStream({ threads }: Props) {
    const [threadIdx, setThreadIdx] = useState(0);
    const [stepIdx, setStepIdx] = useState(0);
    const [typing, setTyping] = useState(false);

    const thread = threads[threadIdx];
    const visibleSteps = thread.steps.slice(0, stepIdx + 1);

    useEffect(() => {
        // Show typing indicator before a fresh agent / result step shows up.
        const current = thread.steps[stepIdx];
        if (current && current.role !== "owner" && stepIdx > 0) {
            setTyping(true);
            const t = setTimeout(() => setTyping(false), 800);
            return () => clearTimeout(t);
        }
    }, [threadIdx, stepIdx, thread.steps]);

    useEffect(() => {
        // Advance step, or move to next thread once all steps are visible.
        if (stepIdx < thread.steps.length - 1) {
            const delay = 1600;
            const t = setTimeout(() => setStepIdx((i) => i + 1), delay);
            return () => clearTimeout(t);
        }
        // Hold the final state for a moment, then rotate.
        const t = setTimeout(() => {
            setStepIdx(0);
            setThreadIdx((i) => (i + 1) % threads.length);
        }, 3200);
        return () => clearTimeout(t);
    }, [stepIdx, threadIdx, thread.steps.length, threads.length]);

    return (
        <div
            data-testid="director-chat-stream"
            style={{
                position: "relative",
                width: "100%",
                maxWidth: 460,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                minHeight: 380,
                justifyContent: "flex-end",
            }}
        >
            {/* Thread header */}
            <div
                key={`hdr-${thread.id}`}
                className="wd-anim-fade-up"
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "10px 14px",
                    background: "var(--wd-surface)",
                    border: "1px solid var(--wd-border)",
                    borderRadius: 12,
                    boxShadow: "var(--wd-shadow-xs)",
                    color: "var(--wd-text)",
                    fontSize: 12,
                }}
            >
                <span
                    style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "#22c55e",
                        boxShadow: "0 0 10px rgba(34,197,94,0.7)",
                    }}
                />
                <span style={{ fontWeight: 700, color: "var(--wd-text)" }}>
                    {thread.business}
                </span>
                <span style={{ color: "var(--wd-text-3)" }}>· {thread.city}</span>
                <span
                    style={{
                        marginLeft: "auto",
                        fontSize: 10.5,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        color: "var(--wd-accent)",
                    }}
                >
                    Live
                </span>
            </div>

            {/* Steps */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                }}
            >
                {visibleSteps.map((s, i) => (
                    <ChatBubble key={`${thread.id}-${i}`} step={s} />
                ))}
                {typing && <TypingBubble color={lastAgentColor(thread.steps, stepIdx)} />}
            </div>
        </div>
    );
}

function ChatBubble({ step }: { step: ChatStep }) {
    if (step.role === "owner") {
        return (
            <div
                className="wd-anim-fade-up"
                style={{
                    alignSelf: "flex-end",
                    maxWidth: "84%",
                    background: "var(--wd-accent)",
                    color: "#fff",
                    border: "1px solid var(--wd-accent)",
                    borderRadius: "14px 14px 4px 14px",
                    padding: "10px 13px",
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    boxShadow: "0 10px 20px -8px rgba(255, 90, 31, 0.45)",
                }}
            >
                <div
                    style={{
                        fontSize: 10.5,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        fontWeight: 700,
                        opacity: 0.85,
                        marginBottom: 4,
                    }}
                >
                    {step.from}
                </div>
                {step.text}
            </div>
        );
    }

    if (step.role === "agent") {
        return (
            <div
                className="wd-anim-fade-up"
                style={{
                    alignSelf: "flex-start",
                    display: "flex",
                    alignItems: "flex-end",
                    gap: 9,
                    maxWidth: "92%",
                }}
            >
                <AgentCharacter
                    agent={{
                        firstName: step.agentName,
                        avatarSeed: step.agentSeed,
                        color: step.color,
                    }}
                    size={36}
                    ring
                />
                <div
                    style={{
                        background: "rgba(255,255,255,0.94)",
                        color: "#111827",
                        borderRadius: "14px 14px 14px 4px",
                        padding: "10px 13px",
                        fontSize: 13.5,
                        lineHeight: 1.5,
                        boxShadow: "0 10px 22px -10px rgba(0,0,0,0.45)",
                        maxWidth: 360,
                    }}
                >
                    <div
                        style={{
                            fontSize: 10.5,
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            fontWeight: 700,
                            color: "var(--wd-text-3)",
                            marginBottom: 4,
                        }}
                    >
                        {step.agentName} · agent
                    </div>
                    {step.text}
                </div>
            </div>
        );
    }

    // result
    return (
        <div
            className="wd-anim-zoom-in"
            style={{
                alignSelf: "flex-start",
                marginLeft: 45,
                display: "inline-flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 15px",
                background:
                    "linear-gradient(135deg, #ECFDF5 0%, #FFFFFF 100%)",
                border: "1px solid #A7F3D0",
                borderRadius: 14,
                color: "var(--wd-text)",
                boxShadow: "0 14px 28px -12px rgba(5, 150, 105, 0.30)",
                maxWidth: 360,
            }}
        >
            <span
                aria-hidden
                style={{
                    width: 30,
                    height: 30,
                    borderRadius: "50%",
                    background: "#10B981",
                    color: "#fff",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <Check size={15} strokeWidth={3} />
            </span>
            <div style={{ minWidth: 0 }}>
                <div
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 14.5,
                        fontWeight: 700,
                        letterSpacing: "-0.01em",
                        color: "#065F46",
                    }}
                >
                    <TrendingUp size={13} strokeWidth={2.6} />
                    {step.metric}
                </div>
                <div
                    style={{
                        fontSize: 12,
                        color: "var(--wd-text-3)",
                        marginTop: 2,
                    }}
                >
                    {step.detail}
                </div>
            </div>
            <Sparkles
                size={14}
                strokeWidth={2.2}
                style={{ color: "#10B981", marginLeft: 4 }}
            />
        </div>
    );
}

function TypingBubble({ color }: { color: AgentColor }) {
    return (
        <div
            className="wd-anim-fade-up"
            style={{
                alignSelf: "flex-start",
                marginLeft: 45,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "10px 14px",
                background: "rgba(255,255,255,0.94)",
                borderRadius: "14px 14px 14px 4px",
                boxShadow: "0 10px 22px -10px rgba(0,0,0,0.45)",
            }}
            data-color={color}
        >
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    style={{
                        width: 7,
                        height: 7,
                        borderRadius: "50%",
                        background: "var(--wd-text-3)",
                        animation: `wd-typing 1s var(--wd-ease) ${i * 0.15}s infinite`,
                    }}
                />
            ))}
            <style>{`
                @keyframes wd-typing {
                    0%, 100% { opacity: 0.35; transform: translateY(0); }
                    50%      { opacity: 1;    transform: translateY(-3px); }
                }
            `}</style>
        </div>
    );
}

function lastAgentColor(steps: ChatStep[], idx: number): AgentColor {
    for (let i = idx; i >= 0; i--) {
        const s = steps[i];
        if (s && s.role !== "owner") return s.color;
    }
    return "blue";
}
