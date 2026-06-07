"use client";

type Props = {
    value: number;
    label?: string;
    size?: number;
    testId?: string;
};

/**
 * Minimal "credit chip" — only used on the welcome screen now
 * (replaced by the topbar credit chip in the dashboard).
 */
export function CreditOrb({
    value,
    label = "Crédits offerts",
    size = 132,
    testId,
}: Props) {
    return (
        <div
            data-testid={testId}
            style={{
                width: size,
                height: size,
                borderRadius: "50%",
                background: "radial-gradient(circle at 30% 30%, #1A3A5C 0%, #0A2540 100%)",
                color: "#fff",
                display: "inline-flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                boxShadow:
                    "0 24px 48px -16px rgba(10, 37, 64, 0.45), inset 0 1px 0 rgba(255,255,255,0.18)",
            }}
        >
            <span
                className="wd-num-tabular"
                style={{
                    fontSize: Math.round(size * 0.32),
                    fontWeight: 600,
                    letterSpacing: "-0.025em",
                    lineHeight: 1,
                }}
            >
                {value}
            </span>
            {label && (
                <span
                    style={{
                        marginTop: 6,
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        color: "rgba(255,255,255,0.7)",
                        fontWeight: 500,
                    }}
                >
                    {label}
                </span>
            )}
        </div>
    );
}
