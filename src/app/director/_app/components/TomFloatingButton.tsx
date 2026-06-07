"use client";

import { useEffect, useState } from "react";
import { MessageCircle, X, Send, Phone } from "lucide-react";

/**
 * Floating concierge button (Tom). Bottom-right.
 * Opens a tiny chat preview — purely cosmetic for the static preview.
 */
export function TomFloatingButton() {
    const [open, setOpen] = useState(false);
    const [pulse, setPulse] = useState(true);

    useEffect(() => {
        // The first-attention pulse dies down after 6 s.
        const t = setTimeout(() => setPulse(false), 6000);
        return () => clearTimeout(t);
    }, []);

    return (
        <div
            data-testid="director-tom-floating"
            style={{
                position: "fixed",
                right: 22,
                bottom: 22,
                zIndex: 50,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end",
                gap: 12,
            }}
        >
            {open && (
                <div
                    className="wd-anim-zoom-in"
                    data-testid="director-tom-panel"
                    style={{
                        width: 320,
                        background: "var(--wd-surface)",
                        borderRadius: 16,
                        boxShadow: "var(--wd-shadow-xl)",
                        border: "1px solid var(--wd-border)",
                        overflow: "hidden",
                        transformOrigin: "bottom right",
                    }}
                >
                    <header
                        style={{
                            padding: "14px 16px",
                            background:
                                "linear-gradient(135deg, var(--wd-accent) 0%, #1A3A5C 100%)",
                            color: "#fff",
                            display: "flex",
                            alignItems: "center",
                            gap: 11,
                        }}
                    >
                        <span
                            aria-hidden
                            style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: "rgba(255,255,255,0.16)",
                                border: "2px solid rgba(255,255,255,0.3)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: 14,
                            }}
                        >
                            T
                        </span>
                        <div style={{ flex: 1, lineHeight: 1.2 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600 }}>Tom</div>
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 6,
                                    fontSize: 11.5,
                                    color: "rgba(255,255,255,0.78)",
                                }}
                            >
                                <span
                                    style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: "50%",
                                        background: "#22c55e",
                                        boxShadow: "0 0 8px rgba(34,197,94,0.6)",
                                    }}
                                />
                                En ligne maintenant
                            </div>
                        </div>
                        <button
                            type="button"
                            aria-label="Fermer"
                            onClick={() => setOpen(false)}
                            style={{
                                background: "transparent",
                                color: "#fff",
                                border: "none",
                                cursor: "pointer",
                                padding: 2,
                                display: "inline-flex",
                            }}
                        >
                            <X size={15} strokeWidth={2.2} />
                        </button>
                    </header>
                    <div style={{ padding: "14px 16px 6px" }}>
                        <div
                            style={{
                                padding: "10px 12px",
                                borderRadius: 10,
                                background: "var(--wd-bg-alt)",
                                fontSize: 13,
                                lineHeight: 1.5,
                                color: "var(--wd-text)",
                                maxWidth: 240,
                            }}
                        >
                            Bonjour Jean-Marc 👋 — Léa a hâte de bosser pour vous.
                            Une question avant de l&apos;embaucher&nbsp;?
                        </div>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            console.log("TODO: POST /api/director/concierge/message");
                        }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 12px 14px",
                            borderTop: "1px solid var(--wd-border)",
                        }}
                    >
                        <input
                            placeholder="Écrivez à Tom…"
                            className="wd-input"
                            data-testid="director-tom-input"
                            style={{
                                padding: "8px 12px",
                                fontSize: 13,
                            }}
                        />
                        <button
                            type="submit"
                            data-testid="director-tom-send"
                            className="wd-btn wd-btn-primary wd-btn-sm"
                            style={{ padding: 8, height: 36 }}
                        >
                            <Send size={13} strokeWidth={2.4} />
                        </button>
                    </form>
                    <a
                        href="tel:0428291104"
                        data-testid="director-tom-call"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: 6,
                            padding: "10px 16px",
                            fontSize: 12,
                            color: "var(--wd-text-2)",
                            background: "var(--wd-bg-alt)",
                            borderTop: "1px solid var(--wd-border)",
                            textDecoration: "none",
                            fontWeight: 500,
                        }}
                    >
                        <Phone size={12} strokeWidth={2.2} />
                        04 28 29 11 04 · du lundi au samedi
                    </a>
                </div>
            )}
            <button
                type="button"
                aria-label="Parler à Tom"
                data-testid="director-tom-toggle"
                onClick={() => setOpen((v) => !v)}
                style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    background:
                        "linear-gradient(135deg, var(--wd-accent) 0%, #1A3A5C 100%)",
                    border: "none",
                    color: "#fff",
                    boxShadow:
                        "0 16px 32px -8px rgba(10, 37, 64, 0.4), 0 4px 12px -2px rgba(10, 37, 64, 0.2)",
                    cursor: "pointer",
                    position: "relative",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontFamily: "inherit",
                }}
            >
                {open ? (
                    <X size={20} strokeWidth={2.2} />
                ) : (
                    <MessageCircle size={20} strokeWidth={2} />
                )}
                {!open && pulse && (
                    <span
                        aria-hidden
                        style={{
                            position: "absolute",
                            inset: -4,
                            borderRadius: "50%",
                            border: "2px solid var(--wd-accent)",
                            opacity: 0.4,
                            animation: "wd-ping-tom 1.8s var(--wd-ease) infinite",
                        }}
                    />
                )}
                {!open && (
                    <span
                        aria-hidden
                        style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            width: 14,
                            height: 14,
                            borderRadius: "50%",
                            background: "#22c55e",
                            border: "2px solid #fff",
                        }}
                    />
                )}
            </button>
            <style>{`
                @keyframes wd-ping-tom {
                    0%   { transform: scale(1);   opacity: 0.4; }
                    80%  { transform: scale(1.35); opacity: 0; }
                    100% { transform: scale(1.35); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
