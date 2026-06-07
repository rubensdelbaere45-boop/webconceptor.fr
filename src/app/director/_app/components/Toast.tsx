"use client";

import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";
import { useEffect } from "react";

export type ToastTone = "success" | "error" | "info";

export type ToastMsg = {
    id: number;
    tone: ToastTone;
    title: string;
    message?: string;
};

type ViewportProps = {
    toasts: ToastMsg[];
    onDismiss: (id: number) => void;
};

const TONE_MAP: Record<
    ToastTone,
    { icon: typeof CheckCircle2; color: string; bg: string }
> = {
    success: { icon: CheckCircle2,  color: "var(--wd-success)", bg: "var(--wd-success-bg)" },
    error:   { icon: AlertTriangle, color: "var(--wd-danger)",  bg: "var(--wd-danger-bg)" },
    info:    { icon: Info,          color: "var(--wd-info)",    bg: "var(--wd-info-bg)" },
};

export function ToastViewport({ toasts, onDismiss }: ViewportProps) {
    return (
        <div
            data-testid="director-toast-viewport"
            style={{
                position: "fixed",
                top: 20,
                right: 20,
                zIndex: 90,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                pointerEvents: "none",
                width: "min(360px, calc(100vw - 40px))",
            }}
        >
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
            ))}
        </div>
    );
}

function ToastItem({
    toast,
    onDismiss,
}: {
    toast: ToastMsg;
    onDismiss: (id: number) => void;
}) {
    const cfg = TONE_MAP[toast.tone];
    const Icon = cfg.icon;
    useEffect(() => {
        const t = setTimeout(() => onDismiss(toast.id), 4200);
        return () => clearTimeout(t);
    }, [toast.id, onDismiss]);

    return (
        <div
            className="wd-anim-fade-up"
            data-testid={`director-toast-${toast.tone}`}
            style={{
                pointerEvents: "auto",
                background: "var(--wd-surface)",
                border: "1px solid var(--wd-border)",
                borderRadius: 12,
                boxShadow: "var(--wd-shadow-lg)",
                padding: "13px 14px",
                display: "flex",
                gap: 12,
                alignItems: "flex-start",
            }}
        >
            <span
                aria-hidden
                style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: cfg.bg,
                    color: cfg.color,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                }}
            >
                <Icon size={15} strokeWidth={2.2} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div
                    style={{
                        fontSize: 13.5,
                        fontWeight: 600,
                        color: "var(--wd-text)",
                        letterSpacing: "-0.005em",
                    }}
                >
                    {toast.title}
                </div>
                {toast.message && (
                    <div
                        style={{
                            marginTop: 3,
                            fontSize: 12.5,
                            color: "var(--wd-text-2)",
                            lineHeight: 1.45,
                        }}
                    >
                        {toast.message}
                    </div>
                )}
            </div>
            <button
                type="button"
                aria-label="Fermer la notification"
                onClick={() => onDismiss(toast.id)}
                style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--wd-text-4)",
                    cursor: "pointer",
                    padding: 2,
                    display: "inline-flex",
                }}
            >
                <X size={14} strokeWidth={2} />
            </button>
        </div>
    );
}
