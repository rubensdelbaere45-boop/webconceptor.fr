"use client";

import { useCallback, useState } from "react";
import "./director.css";

import { LoginScreen } from "./screens/LoginScreen";
import { ChangePasswordScreen } from "./screens/ChangePasswordScreen";
import { WelcomeScreen } from "./screens/WelcomeScreen";
import { DashboardScreen } from "./screens/DashboardScreen";
import { RechargeModal } from "./screens/RechargeModal";

import { AgentDetailPanel } from "./components/AgentDetailPanel";
import { ToastViewport, ToastMsg, ToastTone } from "./components/Toast";
import { DevNav } from "./components/DevNav";
import { TomFloatingButton } from "./components/TomFloatingButton";

import {
    Activity,
    Agent,
    MOCK_ACCOUNT,
    MOCK_ACTIVITIES,
    MOCK_AGENTS,
    Pack,
} from "./mockData";

export type Screen =
    | "login"
    | "change-password"
    | "welcome"
    | "dashboard";

type Props = {
    showDevNav?: boolean;
};

/**
 * DirectorApp — Top-level orchestrator for the static preview.
 * Owns the screen state, the tokens balance, the toasts and the
 * agent slide-over panel. In production, each screen lives at
 * its own route (/director/login, /director/welcome, …) and the
 * shared state is handled by Supabase.
 */
export function DirectorApp({ showDevNav = true }: Props) {
    const [screen, setScreen] = useState<Screen>("login");
    const [tokens, setTokens] = useState<number>(MOCK_ACCOUNT.tokensBalance);
    const [rechargeOpen, setRechargeOpen] = useState(false);
    const [openAgent, setOpenAgent] = useState<Agent | null>(null);
    const [activeAgentIds, setActiveAgentIds] = useState<string[]>([]);
    const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
    const [toasts, setToasts] = useState<ToastMsg[]>([]);

    const pushToast = (tone: ToastTone, title: string, message?: string) =>
        setToasts((prev) => [
            ...prev,
            { id: Date.now() + Math.random(), tone, title, message },
        ]);
    const dismissToast = useCallback(
        (id: number) =>
            setToasts((prev) => prev.filter((t) => t.id !== id)),
        [],
    );

    const prependActivity = (a: Activity) =>
        setActivities((prev) => [a, ...prev].slice(0, 14));

    // ── Auth flow ────────────────────────────────────────────
    const handleLoginSuccess = () => {
        const mustChange = (window as { __wdMustChangePassword?: boolean }).__wdMustChangePassword;
        if (mustChange) {
            pushToast("success", "Bienvenue", "Sécurisons votre compte.");
            setScreen("change-password");
        } else {
            pushToast("success", "Bienvenue", "Ravi de vous revoir, Jean-Marc.");
            setScreen("welcome");
        }
    };
    const handleLoginError = (msg: string) =>
        pushToast("error", "Échec de connexion", msg);

    const handlePasswordSuccess = () => {
        pushToast(
            "success",
            "Mot de passe modifié",
            "Votre compte est désormais sécurisé.",
        );
        prependActivity({
            id: `act-${Date.now()}`,
            label: "Mot de passe modifié",
            delta: 0,
            when: "À l'instant",
        });
        setTimeout(() => setScreen("welcome"), 500);
    };
    const handlePasswordError = (msg: string) =>
        pushToast("error", "Action impossible", msg);

    // ── Welcome flow ─────────────────────────────────────────
    const handleDiscoverAgent = (agentId: string) => {
        const agent = MOCK_AGENTS.find((a) => a.id === agentId);
        setScreen("dashboard");
        if (agent) {
            // Open the panel after the dashboard mounts
            setTimeout(() => setOpenAgent(agent), 220);
        }
    };

    // ── Dashboard flow ───────────────────────────────────────
    const handleHire = async (agent: Agent) => {
        if (tokens < agent.cost) {
            pushToast(
                "info",
                "Crédits insuffisants",
                "Choisissez un pack pour recharger votre solde.",
            );
            setOpenAgent(null);
            setRechargeOpen(true);
            return;
        }
        // Optimistic UI update first
        setTokens((t) => t - agent.cost);
        if (!activeAgentIds.includes(agent.id)) {
            setActiveAgentIds((ids) => [...ids, agent.id]);
        }
        pushToast(
            "success",
            `${agent.firstName} a rejoint votre équipe`,
            `−${agent.cost} crédits · ${agent.jobTitle}`,
        );
        prependActivity({
            id: `act-${Date.now()}`,
            label: `${agent.firstName} embauchée (${agent.jobTitle})`,
            delta: -agent.cost,
            when: "À l'instant",
        });
        setOpenAgent(null);

        // Real API call (debit credits + log + trigger N8N webhook)
        try {
            const res = await fetch("/api/director/launch-action", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ target: agent.id, tokens_cost: agent.cost }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                // Rollback optimistic update
                setTokens((t) => t + agent.cost);
                setActiveAgentIds((ids) => ids.filter((id) => id !== agent.id));
                if (data.need_credits) {
                    setRechargeOpen(true);
                    pushToast("info", "Crédits insuffisants", "Choisissez un pack.");
                } else {
                    pushToast("error", "Échec de l'embauche", data.error || "Réessayez.");
                }
            } else if (typeof data.new_balance === "number") {
                setTokens(data.new_balance);
            }
        } catch {
            // Réseau down — on garde l'état optimiste, l'utilisateur verra au prochain refresh
        }
    };

    const handleRechargeConfirm = async (pack: Pack) => {
        pushToast(
            "info",
            "Redirection en cours",
            `Paiement sécurisé pour le pack ${pack.name}…`,
        );
        try {
            const res = await fetch("/api/director/checkout-credits", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pack_id: pack.id }),
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok && data.url) {
                window.location.href = data.url;
                return;
            }
            pushToast("error", "Paiement indisponible", data.error || "Réessayez plus tard.");
            setRechargeOpen(false);
        } catch {
            pushToast("error", "Erreur réseau", "Vérifiez votre connexion.");
            setRechargeOpen(false);
        }
    };

    // ── Dev nav ─────────────────────────────────────────────
    const handleDevNav = (next: Screen) => {
        setRechargeOpen(false);
        setOpenAgent(null);
        setScreen(next);
    };

    return (
        <div className="director-root" data-testid="director-root">
            {screen === "login" && (
                <LoginScreen
                    onSuccess={handleLoginSuccess}
                    onError={handleLoginError}
                />
            )}
            {screen === "change-password" && (
                <ChangePasswordScreen
                    onSuccess={handlePasswordSuccess}
                    onError={handlePasswordError}
                />
            )}
            {screen === "welcome" && (
                <WelcomeScreen
                    onContinue={() => setScreen("dashboard")}
                />
            )}
            {screen === "dashboard" && (
                <DashboardScreen
                    tokens={tokens}
                    activities={activities}
                    activeAgentIds={activeAgentIds}
                    onOpenAgent={setOpenAgent}
                    onHireAgent={handleHire}
                    onOpenRecharge={() => setRechargeOpen(true)}
                    onLogout={() => {
                        setScreen("login");
                        setTokens(MOCK_ACCOUNT.tokensBalance);
                        setActiveAgentIds([]);
                        setActivities(MOCK_ACTIVITIES);
                        pushToast(
                            "info",
                            "Vous êtes déconnecté",
                            "À très vite, Jean-Marc.",
                        );
                    }}
                />
            )}

            {screen === "dashboard" && <TomFloatingButton />}

            <AgentDetailPanel
                agent={openAgent}
                canAfford={openAgent ? tokens >= openAgent.cost : false}
                onClose={() => setOpenAgent(null)}
                onHire={handleHire}
            />

            <RechargeModal
                open={rechargeOpen}
                onConfirm={handleRechargeConfirm}
                onClose={() => setRechargeOpen(false)}
            />

            <ToastViewport toasts={toasts} onDismiss={dismissToast} />

            {showDevNav && <DevNav current={screen} onChange={handleDevNav} />}
        </div>
    );
}

export default DirectorApp;
