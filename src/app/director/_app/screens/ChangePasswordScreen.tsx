"use client";

import { useMemo, useState, FormEvent } from "react";
import { Check, ArrowRight, ShieldCheck } from "lucide-react";

/**
 * SCREEN 2 — /director/change-password
 * Centered card with persistent step indicator and live rule
 * validation. Production: POST /api/director/auth/change-password.
 */
type Props = {
    onSuccess: () => void;
    onError: (msg: string) => void;
};

type Rule = { id: string; label: string; ok: boolean };

export function ChangePasswordScreen({ onSuccess, onError }: Props) {
    const [pwd, setPwd] = useState("");
    const [confirm, setConfirm] = useState("");
    const [loading, setLoading] = useState(false);

    const rules: Rule[] = useMemo(
        () => [
            { id: "len",   label: "Au moins 8 caractères",                       ok: pwd.length >= 8 },
            { id: "upper", label: "Une majuscule",                                ok: /[A-Z]/.test(pwd) },
            { id: "num",   label: "Un chiffre",                                   ok: /\d/.test(pwd) },
            { id: "match", label: "Les deux mots de passe sont identiques",       ok: pwd.length > 0 && pwd === confirm },
        ],
        [pwd, confirm],
    );

    const allValid = rules.every((r) => r.ok);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!allValid) return onError("Vérifiez les critères avant de valider.");
        setLoading(true);
        try {
            const res = await fetch("/api/director/auth/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ new_password: pwd }),
            });
            const data = await res.json().catch(() => ({}));
            setLoading(false);
            if (!res.ok) {
                onError(data.error || "Action impossible.");
                return;
            }
            onSuccess();
        } catch {
            setLoading(false);
            onError("Erreur réseau, réessayez.");
        }
    };

    return (
        <div
            data-testid="director-change-password-screen"
            style={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "56px 24px",
                background:
                    "radial-gradient(1100px 600px at 50% -10%, rgba(10, 37, 64, 0.06) 0%, rgba(247, 247, 248, 0) 60%)",
            }}
        >
            <div
                className="wd-anim-fade-up"
                style={{ width: "100%", maxWidth: 460 }}
            >
                {/* Step indicator */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        marginBottom: 26,
                    }}
                >
                    {[1, 2].map((s) => (
                        <span
                            key={s}
                            data-testid={`director-step-${s}`}
                            style={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                background: s === 1 ? "var(--wd-accent)" : "var(--wd-surface)",
                                color: s === 1 ? "#fff" : "var(--wd-text-3)",
                                border: s === 1 ? "none" : "1px solid var(--wd-border)",
                                display: "inline-flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: 12,
                                fontWeight: 600,
                            }}
                        >
                            {s}
                        </span>
                    ))}
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="wd-card"
                    data-testid="director-change-password-card"
                    style={{ padding: "32px 32px 28px", boxShadow: "var(--wd-shadow-md)" }}
                >
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 7,
                            padding: "4px 10px",
                            borderRadius: 999,
                            background: "var(--wd-accent-soft)",
                            color: "var(--wd-accent)",
                            fontSize: 11.5,
                            fontWeight: 600,
                            marginBottom: 16,
                        }}
                    >
                        <ShieldCheck size={12} strokeWidth={2.4} />
                        Sécurisation du compte
                    </div>

                    <h1
                        style={{
                            margin: 0,
                            fontSize: 26,
                            fontWeight: 600,
                            color: "var(--wd-text)",
                            letterSpacing: "-0.025em",
                            lineHeight: 1.15,
                        }}
                    >
                        Créez votre mot de passe
                    </h1>
                    <p
                        style={{
                            margin: "8px 0 0",
                            color: "var(--wd-text-2)",
                            fontSize: 14.5,
                            lineHeight: 1.55,
                        }}
                    >
                        Choisissez un mot de passe personnel — on ne vous le
                        redemandera plus.
                    </p>

                    <div style={{ marginTop: 24, display: "grid", gap: 14 }}>
                        <div>
                            <label htmlFor="wd-pwd-new" className="wd-label">
                                Nouveau mot de passe
                            </label>
                            <input
                                id="wd-pwd-new"
                                data-testid="director-new-password-input"
                                type="password"
                                className="wd-input wd-mono"
                                placeholder="••••••••"
                                value={pwd}
                                onChange={(e) => setPwd(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>
                        <div>
                            <label htmlFor="wd-pwd-confirm" className="wd-label">
                                Confirmation
                            </label>
                            <input
                                id="wd-pwd-confirm"
                                data-testid="director-confirm-password-input"
                                type="password"
                                className="wd-input wd-mono"
                                placeholder="••••••••"
                                value={confirm}
                                onChange={(e) => setConfirm(e.target.value)}
                                autoComplete="new-password"
                                required
                            />
                        </div>
                    </div>

                    <ul
                        data-testid="director-password-rules"
                        style={{
                            listStyle: "none",
                            padding: 14,
                            margin: "18px 0 0",
                            display: "grid",
                            gap: 9,
                            background: "var(--wd-bg-alt)",
                            border: "1px solid var(--wd-border)",
                            borderRadius: 10,
                        }}
                    >
                        {rules.map((r) => (
                            <li
                                key={r.id}
                                data-testid={`director-pwd-rule-${r.id}`}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 9,
                                    fontSize: 13,
                                    color: r.ok ? "var(--wd-text)" : "var(--wd-text-3)",
                                    transition: "color 200ms var(--wd-ease)",
                                }}
                            >
                                <span
                                    aria-hidden
                                    style={{
                                        width: 16,
                                        height: 16,
                                        borderRadius: "50%",
                                        background: r.ok
                                            ? "var(--wd-success)"
                                            : "transparent",
                                        color: "#fff",
                                        border: r.ok
                                            ? "none"
                                            : "1px solid var(--wd-border-strong)",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        transition: "all 200ms var(--wd-ease)",
                                    }}
                                >
                                    {r.ok && <Check size={10} strokeWidth={3} />}
                                </span>
                                {r.label}
                            </li>
                        ))}
                    </ul>

                    <button
                        type="submit"
                        data-testid="director-change-password-submit"
                        className="wd-btn wd-btn-primary wd-btn-lg"
                        style={{
                            width: "100%",
                            marginTop: 20,
                            opacity: allValid ? 1 : 0.55,
                            cursor: allValid ? "pointer" : "not-allowed",
                        }}
                        disabled={!allValid || loading}
                    >
                        {loading ? "Sécurisation…" : "Valider et continuer"}
                        {!loading && <ArrowRight size={15} strokeWidth={2.4} />}
                    </button>
                </form>

                <p
                    style={{
                        textAlign: "center",
                        margin: "18px 0 0",
                        fontSize: 12,
                        color: "var(--wd-text-3)",
                    }}
                >
                    Étape 1 sur 2 · suivante : découverte de votre équipe
                </p>
            </div>
        </div>
    );
}
