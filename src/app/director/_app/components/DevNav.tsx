"use client";

import type { Screen } from "../DirectorApp";

type Props = {
    current: Screen;
    onChange: (s: Screen) => void;
};

const ITEMS: { key: Screen; label: string }[] = [
    { key: "login",           label: "1 · Connexion" },
    { key: "change-password", label: "2 · Mot de passe" },
    { key: "welcome",         label: "3 · Bienvenue" },
    { key: "dashboard",       label: "4 · Console" },
];

/**
 * Floating dev selector — switch between screens without routing.
 * Remove in production by passing `showDevNav={false}` to DirectorApp.
 */
export function DevNav({ current, onChange }: Props) {
    return (
        <div
            data-testid="director-dev-nav"
            role="navigation"
            aria-label="Sélecteur d'écran (dev)"
            style={{
                position: "fixed",
                bottom: 16,
                left: 16,
                zIndex: 100,
                display: "inline-flex",
                alignItems: "center",
                gap: 2,
                padding: 4,
                background: "rgba(17, 24, 39, 0.92)",
                color: "#fff",
                borderRadius: 999,
                boxShadow: "0 12px 30px -10px rgba(0,0,0,0.4)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
            }}
        >
            <span
                style={{
                    padding: "4px 10px",
                    fontSize: 10.5,
                    fontWeight: 700,
                    letterSpacing: "0.12em",
                    color: "rgba(255,255,255,0.55)",
                    textTransform: "uppercase",
                }}
            >
                DEV
            </span>
            {ITEMS.map((it) => {
                const active = current === it.key;
                return (
                    <button
                        key={it.key}
                        type="button"
                        data-testid={`director-devnav-${it.key}`}
                        onClick={() => onChange(it.key)}
                        style={{
                            background: active ? "#fff" : "transparent",
                            color: active ? "#111" : "rgba(255,255,255,0.78)",
                            border: "none",
                            padding: "6px 12px",
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: active ? 600 : 500,
                            cursor: "pointer",
                            fontFamily: "inherit",
                            transition: "background-color 150ms var(--wd-ease)",
                        }}
                    >
                        {it.label}
                    </button>
                );
            })}
        </div>
    );
}
