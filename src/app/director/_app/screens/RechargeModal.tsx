"use client";

import { useState } from "react";
import { Check, Lock, Sparkles, X } from "lucide-react";
import { MOCK_PACKS, Pack } from "../mockData";

/**
 * SCREEN 5 — Recharge modal
 * Polished pricing modal styled after Stripe's pricing tables.
 * In production: clicking a pack POSTs to /api/director/checkout-credits
 * and redirects to the returned Stripe URL.
 */
type Props = {
    open: boolean;
    onClose: () => void;
    onConfirm: (pack: Pack) => void;
    packs?: Pack[];
};

export function RechargeModal({ open, onClose, onConfirm, packs = MOCK_PACKS }: Props) {
    const initial = packs.find((p) => p.highlight)?.id ?? packs[0]?.id;
    const [selectedId, setSelectedId] = useState<string>(initial);

    if (!open) return null;
    const selected = packs.find((p) => p.id === selectedId) ?? packs[0];

    return (
        <div
            data-testid="director-recharge-modal"
            role="dialog"
            aria-label="Recharger vos crédits"
            onClick={onClose}
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 80,
                background: "rgba(10, 37, 64, 0.42)",
                backdropFilter: "blur(6px)",
                WebkitBackdropFilter: "blur(6px)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 24,
            }}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="wd-anim-zoom-in"
                style={{
                    width: "100%",
                    maxWidth: 760,
                    background: "var(--wd-surface)",
                    borderRadius: 18,
                    boxShadow: "var(--wd-shadow-xl)",
                    border: "1px solid var(--wd-border)",
                    overflow: "hidden",
                    display: "flex",
                    flexDirection: "column",
                    maxHeight: "90vh",
                }}
            >
                {/* Header */}
                <header
                    style={{
                        padding: "22px 26px 18px",
                        borderBottom: "1px solid var(--wd-border)",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 16,
                    }}
                >
                    <div style={{ flex: 1 }}>
                        <p className="wd-eyebrow" style={{ margin: 0 }}>
                            Crédits
                        </p>
                        <h2
                            style={{
                                margin: "4px 0 0",
                                fontSize: 22,
                                fontWeight: 600,
                                color: "var(--wd-text)",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            Rechargez votre solde
                        </h2>
                        <p
                            style={{
                                margin: "4px 0 0",
                                fontSize: 13.5,
                                color: "var(--wd-text-2)",
                                lineHeight: 1.5,
                            }}
                        >
                            Sans abonnement. Vous payez ce que vos agents
                            produisent — les crédits ne périment jamais.
                        </p>
                    </div>
                    <button
                        type="button"
                        aria-label="Fermer"
                        data-testid="director-recharge-close"
                        onClick={onClose}
                        style={{
                            width: 32,
                            height: 32,
                            borderRadius: "50%",
                            background: "var(--wd-surface-2)",
                            border: "1px solid var(--wd-border)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            color: "var(--wd-text-2)",
                        }}
                    >
                        <X size={15} strokeWidth={2.2} />
                    </button>
                </header>

                {/* Packs grid */}
                <div
                    data-testid="director-recharge-grid"
                    style={{
                        padding: "22px 26px",
                        display: "grid",
                        gridTemplateColumns: "repeat(2, 1fr)",
                        gap: 12,
                        overflowY: "auto",
                    }}
                    className="wd-recharge-grid"
                >
                    {packs.map((p) => {
                        const isSelected = p.id === selectedId;
                        return (
                            <button
                                key={p.id}
                                type="button"
                                data-testid={`director-recharge-pack-${p.id}`}
                                data-selected={isSelected}
                                onClick={() => setSelectedId(p.id)}
                                className="wd-card"
                                style={{
                                    textAlign: "left",
                                    padding: "16px 18px",
                                    display: "flex",
                                    flexDirection: "column",
                                    gap: 8,
                                    cursor: "pointer",
                                    transition:
                                        "border-color 180ms var(--wd-ease), box-shadow 180ms var(--wd-ease), transform 180ms var(--wd-ease)",
                                    borderColor: isSelected
                                        ? "var(--wd-accent)"
                                        : "var(--wd-border)",
                                    boxShadow: isSelected
                                        ? "0 0 0 3px var(--wd-accent-ring), var(--wd-shadow-sm)"
                                        : "var(--wd-shadow-xs)",
                                    background: "var(--wd-surface)",
                                    position: "relative",
                                }}
                            >
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                    }}
                                >
                                    <span
                                        className="wd-eyebrow"
                                        style={{ margin: 0 }}
                                    >
                                        {p.name}
                                    </span>
                                    {p.highlight && (
                                        <span
                                            className="wd-pill"
                                            data-tone="info"
                                            style={{
                                                background: "var(--wd-accent)",
                                                color: "#fff",
                                                border: "1px solid var(--wd-accent)",
                                            }}
                                        >
                                            <Sparkles size={10} strokeWidth={2.4} />
                                            Le + choisi
                                        </span>
                                    )}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "baseline",
                                        gap: 6,
                                    }}
                                >
                                    <span
                                        className="wd-num-tabular"
                                        style={{
                                            fontSize: 28,
                                            fontWeight: 600,
                                            color: "var(--wd-text)",
                                            letterSpacing: "-0.025em",
                                            lineHeight: 1,
                                        }}
                                    >
                                        {p.credits.toLocaleString("fr-FR")}
                                    </span>
                                    <span
                                        style={{
                                            fontSize: 13,
                                            color: "var(--wd-text-3)",
                                            fontWeight: 500,
                                        }}
                                    >
                                        crédits
                                    </span>
                                    {p.bonus > 0 && (
                                        <span
                                            className="wd-pill"
                                            data-tone="success"
                                            style={{ marginLeft: "auto" }}
                                        >
                                            +{p.bonus} offerts
                                        </span>
                                    )}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        marginTop: 4,
                                    }}
                                >
                                    <span
                                        className="wd-num-tabular"
                                        style={{
                                            fontSize: 15,
                                            fontWeight: 600,
                                            color: "var(--wd-text)",
                                        }}
                                    >
                                        {p.price.toLocaleString("fr-FR", {
                                            style: "currency",
                                            currency: "EUR",
                                        })}
                                    </span>
                                    {isSelected && (
                                        <span
                                            aria-hidden
                                            style={{
                                                width: 22,
                                                height: 22,
                                                borderRadius: "50%",
                                                background: "var(--wd-accent)",
                                                color: "#fff",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                            }}
                                        >
                                            <Check size={12} strokeWidth={3} />
                                        </span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>

                {/* Footer CTA */}
                <footer
                    style={{
                        padding: "16px 26px 22px",
                        borderTop: "1px solid var(--wd-border)",
                        background: "var(--wd-bg-alt)",
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                    }}
                >
                    <span
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                            fontSize: 12,
                            color: "var(--wd-text-3)",
                            fontWeight: 500,
                        }}
                    >
                        <Lock size={12} strokeWidth={2.2} />
                        Paiement sécurisé par Stripe
                    </span>
                    <div style={{ flex: 1 }} />
                    <button
                        type="button"
                        data-testid="director-recharge-confirm"
                        onClick={() => onConfirm(selected)}
                        className="wd-btn wd-btn-primary wd-btn-lg"
                    >
                        Payer{" "}
                        <span className="wd-num-tabular">
                            {selected.price.toLocaleString("fr-FR", {
                                style: "currency",
                                currency: "EUR",
                            })}
                        </span>
                    </button>
                </footer>
            </div>
            <style>{`
                @media (max-width: 640px) {
                    .wd-recharge-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}
