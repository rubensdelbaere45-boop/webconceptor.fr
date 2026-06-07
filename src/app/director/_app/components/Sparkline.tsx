"use client";

type Props = {
    /** Series of values to plot (will be auto-scaled). */
    values: number[];
    /** Stroke color (defaults to brand accent). */
    color?: string;
    height?: number;
    /** Fill area under curve (subtle). */
    filled?: boolean;
    ariaLabel?: string;
};

/**
 * Tiny zero-dep SVG sparkline. No animations to keep render light.
 * Used inside KPI tiles to give a sense of activity without
 * pulling a charting library.
 */
export function Sparkline({
    values,
    color = "var(--wd-accent)",
    height = 36,
    filled = true,
    ariaLabel,
}: Props) {
    if (!values.length) return null;
    const w = 120;
    const h = height;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const step = w / (values.length - 1 || 1);
    const points = values.map((v, i) => {
        const x = i * step;
        const y = h - 4 - ((v - min) / range) * (h - 8);
        return [x, y] as const;
    });
    const path = points
        .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
        .join(" ");
    const area = `${path} L ${w} ${h} L 0 ${h} Z`;
    return (
        <svg
            className="wd-spark"
            viewBox={`0 0 ${w} ${h}`}
            preserveAspectRatio="none"
            role={ariaLabel ? "img" : "presentation"}
            aria-label={ariaLabel}
            style={{ height }}
        >
            {filled && (
                <>
                    <defs>
                        <linearGradient id="wd-spark-grad" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                        </linearGradient>
                    </defs>
                    <path d={area} fill="url(#wd-spark-grad)" />
                </>
            )}
            <path
                d={path}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
