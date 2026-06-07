"use client";

import { useState, FormEvent } from "react";
import {
    ArrowRight,
    Eye,
    EyeOff,
    Lock,
    ShieldCheck,
    Zap,
    Flame,
} from "lucide-react";
import { DEMO_CREDENTIALS, MOCK_AGENTS, MOCK_CHAT_THREADS } from "../mockData";
import { AgentChatStream } from "../components/AgentChatStream";
import { AgentCharacter } from "../components/AgentCharacter";

/**
 * SCREEN 1 — /director/login
 * Split-screen: auth form on the left, immersive "live agents at
 * work" animation on the right. The right pane shows a rotating
 * chat between business owners and their AI agents, with floating
 * cartoon characters orbiting around — designed to make the user
 * feel they're entering a living platform full of stars.
 */
type Props = {
    onSuccess: () => void;
    onError: (msg: string) => void;
};

export function LoginScreen({ onSuccess, onError }: Props) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPwd, setShowPwd] = useState(false);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!email.includes("@")) return onError("Adresse email invalide.");
        if (!password) return onError("Le mot de passe est requis.");
        setLoading(true);
        try {
            const res = await fetch("/api/director/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
            });
            const data = await res.json().catch(() => ({}));
            setLoading(false);
            if (!res.ok) {
                onError(data.error || "Identifiants invalides.");
                return;
            }
            // ✅ Auth OK — store hint for app: if must_change_password, the
            // parent DirectorApp routes to /change-password
            (window as { __wdMustChangePassword?: boolean }).__wdMustChangePassword = !!data.must_change_password;
            onSuccess();
        } catch {
            setLoading(false);
            onError("Erreur réseau, réessayez.");
        }
    };

    // Pick 3 agents to float decoratively around the chat.
    const floats = [
        MOCK_AGENTS.find((a) => a.id === "google_ads")!,
        MOCK_AGENTS.find((a) => a.id === "reputation")!,
        MOCK_AGENTS.find((a) => a.id === "seo")!,
    ];

    return (
        <div
            data-testid="director-login-screen"
            style={{
                minHeight: "100vh",
                display: "grid",
                gridTemplateColumns: "1fr 1.1fr",
                background: "var(--wd-surface)",
            }}
            className="wd-login-grid"
        >
            {/* ── Left: form ──────────────────────────────────── */}
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    padding: "40px 56px",
                    minHeight: "100vh",
                }}
            >
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                    }}
                >
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
                            letterSpacing: "-0.01em",
                            color: "var(--wd-text)",
                        }}
                    >
                        WebDirector
                    </span>
                </div>

                <div
                    className="wd-anim-fade-up"
                    style={{
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        maxWidth: 420,
                        margin: "0 auto",
                        width: "100%",
                    }}
                >
                    <div
                        data-testid="director-login-hot-pill"
                        style={{
                            display: "inline-flex",
                            alignSelf: "flex-start",
                            alignItems: "center",
                            gap: 6,
                            padding: "5px 11px",
                            borderRadius: 999,
                            background:
                                "linear-gradient(90deg, #FB923C 0%, #EF4444 100%)",
                            color: "#fff",
                            fontSize: 11.5,
                            fontWeight: 700,
                            letterSpacing: "0.03em",
                            marginBottom: 14,
                            boxShadow: "0 8px 18px -6px rgba(239,68,68,0.45)",
                        }}
                    >
                        <Flame size={11} strokeWidth={2.6} />
                        4 823 entreprises actives en ce moment
                    </div>
                    <h1
                        style={{
                            margin: 0,
                            fontSize: 40,
                            fontWeight: 700,
                            color: "var(--wd-text)",
                            letterSpacing: "-0.03em",
                            lineHeight: 1.05,
                        }}
                    >
                        Embauchez votre première
                        <br />
                        <span
                            style={{
                                background:
                                    "linear-gradient(90deg, var(--wd-accent) 0%, #FF8A3A 100%)",
                                WebkitBackgroundClip: "text",
                                WebkitTextFillColor: "transparent",
                                backgroundClip: "text",
                            }}
                        >
                            star de l&apos;IA.
                        </span>
                    </h1>
                    <p
                        style={{
                            margin: "12px 0 0",
                            fontSize: 15,
                            color: "var(--wd-text-2)",
                            lineHeight: 1.55,
                        }}
                    >
                        Léa, Maxime, Sophie & Antoine attendent vos ordres.
                        Connectez-vous pour piloter votre équipe.
                    </p>

                    <form
                        onSubmit={handleSubmit}
                        data-testid="director-login-card"
                        style={{ marginTop: 32, display: "grid", gap: 16 }}
                    >
                        <div>
                            <label htmlFor="wd-login-email" className="wd-label">
                                Email
                            </label>
                            <input
                                id="wd-login-email"
                                data-testid="director-login-email-input"
                                type="email"
                                className="wd-input"
                                placeholder={DEMO_CREDENTIALS.email}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                                required
                            />
                        </div>

                        <div>
                            <div
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    marginBottom: 6,
                                }}
                            >
                                <label
                                    htmlFor="wd-login-pwd"
                                    className="wd-label"
                                    style={{ marginBottom: 0 }}
                                >
                                    Mot de passe
                                </label>
                                <a
                                    href="#recover"
                                    data-testid="director-login-recover-link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        console.log("TODO: route /director/recover");
                                    }}
                                    style={{
                                        fontSize: 12.5,
                                        color: "var(--wd-accent)",
                                        textDecoration: "none",
                                        fontWeight: 500,
                                    }}
                                >
                                    Mot de passe oublié ?
                                </a>
                            </div>
                            <div style={{ position: "relative" }}>
                                <input
                                    id="wd-login-pwd"
                                    data-testid="director-login-password-input"
                                    type={showPwd ? "text" : "password"}
                                    className="wd-input wd-mono"
                                    placeholder={DEMO_CREDENTIALS.temporaryPassword}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                    required
                                    style={{ paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPwd((v) => !v)}
                                    data-testid="director-login-toggle-pwd"
                                    aria-label={showPwd ? "Cacher" : "Voir"}
                                    style={{
                                        position: "absolute",
                                        top: "50%",
                                        right: 12,
                                        transform: "translateY(-50%)",
                                        background: "transparent",
                                        border: "none",
                                        color: "var(--wd-text-3)",
                                        cursor: "pointer",
                                        padding: 4,
                                        display: "inline-flex",
                                    }}
                                >
                                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            data-testid="director-login-submit"
                            className="wd-btn wd-btn-primary wd-btn-lg"
                            style={{ width: "100%", marginTop: 8 }}
                            disabled={loading}
                        >
                            {loading ? "Connexion…" : "Entrer dans la console"}
                            {!loading && <ArrowRight size={15} strokeWidth={2.4} />}
                        </button>
                    </form>

                    {/* Trust mini-row */}
                    <div
                        style={{
                            marginTop: 26,
                            display: "flex",
                            alignItems: "center",
                            gap: 14,
                            flexWrap: "wrap",
                            fontSize: 11.5,
                            color: "var(--wd-text-3)",
                        }}
                    >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <Zap size={11} strokeWidth={2.4} /> 7 jours pour des résultats
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <ShieldCheck size={11} strokeWidth={2.4} /> Sans engagement
                        </span>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                            <Lock size={11} strokeWidth={2.4} /> RGPD · UE
                        </span>
                    </div>
                </div>

                <p
                    style={{
                        margin: 0,
                        fontSize: 12,
                        color: "var(--wd-text-3)",
                    }}
                >
                    Tom est joignable au{" "}
                    <span className="wd-mono" style={{ color: "var(--wd-text-2)" }}>
                        04 28 29 11 04
                    </span>{" "}
                    · du lundi au samedi.
                </p>
            </div>

            {/* ── Right: animated agent stream ────────────────── */}
            <div
                aria-hidden
                className="wd-login-right"
                style={{
                    position: "relative",
                    overflow: "hidden",
                    background:
                        "radial-gradient(1100px 700px at 75% 30%, #FFE7D2 0%, #FFF4E8 35%, #FFFBF6 70%, #FFFFFF 100%)",
                    color: "var(--wd-text)",
                    padding: "44px 50px",
                    display: "flex",
                    flexDirection: "column",
                    gap: 20,
                    borderLeft: "1px solid var(--wd-border)",
                }}
            >
                {/* Decorative orange diagonal sport stripe */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: -160,
                        right: -200,
                        width: 540,
                        height: 540,
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, rgba(255, 90, 31, 0.18) 0%, rgba(255, 90, 31, 0) 70%)",
                        filter: "blur(8px)",
                    }}
                />
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        bottom: -200,
                        left: -120,
                        width: 460,
                        height: 460,
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, rgba(255, 138, 58, 0.16) 0%, rgba(255, 138, 58, 0) 65%)",
                        filter: "blur(18px)",
                    }}
                />
                {/* Subtle grid */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        inset: 0,
                        backgroundImage:
                            "linear-gradient(rgba(20,17,15,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(20,17,15,0.03) 1px, transparent 1px)",
                        backgroundSize: "32px 32px",
                        maskImage:
                            "radial-gradient(circle at 60% 40%, black 0%, transparent 75%)",
                    }}
                />

                {/* Floating characters */}
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: 60,
                        right: 36,
                        zIndex: 1,
                    }}
                    className="wd-orbit-a"
                >
                    <AgentCharacter agent={floats[0]} size={76} ring animate />
                </div>
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        bottom: 84,
                        right: 70,
                        zIndex: 1,
                    }}
                    className="wd-orbit-b"
                >
                    <AgentCharacter agent={floats[1]} size={64} ring animate />
                </div>
                <div
                    aria-hidden
                    style={{
                        position: "absolute",
                        top: "42%",
                        right: -16,
                        zIndex: 1,
                        opacity: 0.78,
                    }}
                    className="wd-orbit-a"
                >
                    <AgentCharacter agent={floats[2]} size={56} ring animate />
                </div>

                {/* Header copy */}
                <div style={{ position: "relative", zIndex: 2 }}>
                    <p
                        className="wd-eyebrow"
                        style={{
                            color: "var(--wd-accent)",
                            margin: 0,
                            marginBottom: 10,
                        }}
                    >
                        En direct sur la plateforme
                    </p>
                    <h2
                        style={{
                            margin: 0,
                            fontSize: 26,
                            fontWeight: 700,
                            letterSpacing: "-0.025em",
                            lineHeight: 1.2,
                            maxWidth: 480,
                            color: "var(--wd-text)",
                        }}
                    >
                        Regardez vos futurs agents bosser pour de vraies
                        entreprises locales.
                    </h2>
                </div>

                {/* Chat stream */}
                <div style={{ position: "relative", zIndex: 2, flex: 1 }}>
                    <AgentChatStream threads={MOCK_CHAT_THREADS} />
                </div>

                {/* Footer trust */}
                <div
                    style={{
                        position: "relative",
                        zIndex: 2,
                        display: "flex",
                        alignItems: "center",
                        gap: 14,
                        flexWrap: "wrap",
                        fontSize: 12,
                        color: "var(--wd-text-3)",
                        paddingTop: 12,
                        borderTop: "1px solid var(--wd-border)",
                    }}
                >
                    <span
                        className="wd-num-tabular"
                        style={{
                            fontWeight: 700,
                            color: "var(--wd-text)",
                            fontSize: 18,
                            letterSpacing: "-0.015em",
                        }}
                    >
                        2,84 M€
                    </span>
                    <span>de CA généré sur 30 jours pour nos clients</span>
                    <span style={{ marginLeft: "auto", opacity: 0.7 }}>
                        Mis à jour il y a 12 secondes
                    </span>
                </div>
            </div>

            <style>{`
                @media (max-width: 980px) {
                    .wd-login-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .wd-login-right {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
}
