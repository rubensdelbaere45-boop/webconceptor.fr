"use client";

import { useMemo, useState } from "react";
import { Search, Trophy, ArrowUpRight, Users } from "lucide-react";
import { TopNav, NavKey } from "../components/TopNav";
import { LiveTicker } from "../components/LiveTicker";
import { FeaturedAgentHero } from "../components/FeaturedAgentHero";
import { BusinessPanel } from "../components/BusinessPanel";
import { AgentCard } from "../components/AgentCard";
import { ActiveAgentChip } from "../components/ActiveAgentChip";
import {
    Activity,
    Agent,
    AgentCategory,
    AGENT_CATEGORIES,
    MOCK_ACCOUNT,
    MOCK_ACTIVITIES,
    MOCK_AGENTS,
    MOCK_PLATFORM_STATS,
    MOCK_TICKERS,
} from "../mockData";

/**
 * SCREEN 4 — /director/dashboard
 * High-conversion "betting-platform" layout:
 *   1. Top nav + LIVE ticker (FOMO)
 *   2. Featured Agent Hero + Business Panel (the user's company KPIs)
 *   3. Active team strip
 *   4. Marketplace as a wall of "star cards"
 *   5. Activity feed
 */
type Props = {
    firstName?: string;
    businessName?: string;
    city?: string;
    tokens: number;
    activities?: Activity[];
    activeAgentIds?: string[];
    onOpenAgent: (agent: Agent) => void;
    onHireAgent: (agent: Agent) => void;
    onOpenRecharge: () => void;
    onLogout: () => void;
};

type Filter = "Tous" | AgentCategory;

export function DashboardScreen({
    firstName = MOCK_ACCOUNT.firstName,
    businessName = MOCK_ACCOUNT.businessName,
    city = MOCK_ACCOUNT.city,
    tokens,
    activities = MOCK_ACTIVITIES,
    activeAgentIds = [],
    onOpenAgent,
    onHireAgent,
    onOpenRecharge,
    onLogout,
}: Props) {
    const [section, setSection] = useState<NavKey>("marketplace");
    const [filter, setFilter] = useState<Filter>("Tous");

    const teamAgents = useMemo(
        () => MOCK_AGENTS.filter((a) => activeAgentIds.includes(a.id)),
        [activeAgentIds],
    );

    const featuredAgent = useMemo(
        () =>
            MOCK_AGENTS.find((a) => a.featured) ??
            MOCK_AGENTS.find((a) => a.trending) ??
            MOCK_AGENTS[0],
        [],
    );

    const filtered = useMemo(() => {
        if (filter === "Tous") return MOCK_AGENTS;
        return MOCK_AGENTS.filter((a) => a.category === filter);
    }, [filter]);

    const handleNav = (s: NavKey) => {
        setSection(s);
        if (s === "marketplace") scrollTo("section-marketplace");
        if (s === "team") scrollTo("section-team");
        if (s === "performance") scrollTo("section-hero");
        if (s === "activity") scrollTo("section-activity");
    };

    return (
        <div data-testid="director-dashboard-screen" style={{ minHeight: "100vh" }}>
            <TopNav
                active={section}
                onChange={handleNav}
                tokens={tokens}
                teamCount={teamAgents.length}
                onOpenRecharge={onOpenRecharge}
                onLogout={onLogout}
            />
            <LiveTicker items={MOCK_TICKERS} />

            {/* Platform pulse bar */}
            <div
                data-testid="director-platform-pulse"
                style={{
                    padding: "10px 28px",
                    background:
                        "linear-gradient(90deg, var(--wd-surface) 0%, var(--wd-bg-alt) 100%)",
                    borderBottom: "1px solid var(--wd-border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 24,
                    fontSize: 12,
                    color: "var(--wd-text-3)",
                    flexWrap: "wrap",
                }}
            >
                <Pulse
                    label="Actions en cours · 1h"
                    value={MOCK_PLATFORM_STATS.actionsLastHour.toLocaleString("fr-FR")}
                />
                <Pulse
                    label="Entreprises actives"
                    value={MOCK_PLATFORM_STATS.businessesActive.toLocaleString("fr-FR")}
                />
                <Pulse
                    label="CA généré · 30j"
                    value={`${(MOCK_PLATFORM_STATS.revenueGenerated / 1_000_000).toFixed(2)} M€`}
                />
                <Pulse
                    label="ROI moyen"
                    value={`×${MOCK_PLATFORM_STATS.averageRoi.toLocaleString("fr-FR")}`}
                />
            </div>

            <main
                style={{
                    padding: "32px 28px 100px",
                    maxWidth: "var(--wd-maxw)",
                    width: "100%",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: 40,
                }}
            >
                {/* ── Hero greeting ─────────────────────── */}
                <section
                    id="section-hero"
                    data-testid="director-section-hero"
                    style={{ marginTop: 8 }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                            gap: 16,
                            marginBottom: 20,
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <p className="wd-eyebrow" style={{ margin: 0 }}>
                                Console · {city}
                            </p>
                            <h1
                                style={{
                                    margin: "6px 0 0",
                                    fontSize: 32,
                                    fontWeight: 700,
                                    letterSpacing: "-0.03em",
                                    color: "var(--wd-text)",
                                    lineHeight: 1.1,
                                }}
                            >
                                Bonjour {firstName} 👋
                            </h1>
                            <p
                                style={{
                                    margin: "6px 0 0",
                                    fontSize: 14.5,
                                    color: "var(--wd-text-2)",
                                    lineHeight: 1.55,
                                }}
                            >
                                Choisissez l'agent qui va exploser{" "}
                                <span style={{ fontWeight: 600, color: "var(--wd-text)" }}>
                                    {businessName}
                                </span>{" "}
                                ce mois-ci.
                            </p>
                        </div>
                    </div>

                    <div
                        className="wd-dashboard-hero-grid"
                        style={{
                            display: "grid",
                            gridTemplateColumns: "minmax(0, 1.65fr) minmax(280px, 1fr)",
                            gap: 18,
                            alignItems: "stretch",
                        }}
                    >
                        <FeaturedAgentHero
                            agent={featuredAgent}
                            canAfford={tokens >= featuredAgent.cost}
                            cityLabel={city}
                            onOpen={onOpenAgent}
                            onHire={onHireAgent}
                        />
                        <BusinessPanel
                            firstName={firstName}
                            businessName={businessName}
                            city={city}
                        />
                    </div>
                </section>

                {/* ── Team strip ────────────────────────── */}
                <section id="section-team" data-testid="director-section-team">
                    <header
                        style={{
                            display: "flex",
                            alignItems: "baseline",
                            justifyContent: "space-between",
                            gap: 16,
                            marginBottom: 14,
                        }}
                    >
                        <div>
                            <h2
                                style={{
                                    margin: 0,
                                    fontSize: 18,
                                    fontWeight: 700,
                                    color: "var(--wd-text)",
                                    letterSpacing: "-0.015em",
                                }}
                            >
                                Votre équipe
                            </h2>
                            <p
                                style={{
                                    margin: "3px 0 0",
                                    fontSize: 12.5,
                                    color: "var(--wd-text-3)",
                                }}
                            >
                                Agents au travail pour {businessName}.
                            </p>
                        </div>
                        {teamAgents.length > 0 && (
                            <span
                                className="wd-pill"
                                data-tone="success"
                                data-testid="director-team-live-pill"
                            >
                                <span className="wd-live-dot" />
                                <span style={{ marginLeft: 4 }}>{teamAgents.length} en activité</span>
                            </span>
                        )}
                    </header>

                    {teamAgents.length === 0 ? (
                        <div
                            className="wd-card"
                            data-testid="director-team-empty"
                            style={{
                                padding: "22px 24px",
                                display: "flex",
                                alignItems: "center",
                                gap: 16,
                                background:
                                    "linear-gradient(90deg, var(--wd-surface) 0%, var(--wd-bg-alt) 100%)",
                            }}
                        >
                            <span
                                aria-hidden
                                style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: 12,
                                    background: "var(--wd-accent-soft)",
                                    color: "var(--wd-accent)",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexShrink: 0,
                                }}
                            >
                                <Users size={18} strokeWidth={2} />
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 14, fontWeight: 600 }}>
                                    Aucun agent embauché.
                                </div>
                                <p
                                    style={{
                                        margin: "3px 0 0",
                                        fontSize: 12.5,
                                        color: "var(--wd-text-2)",
                                        lineHeight: 1.5,
                                    }}
                                >
                                    En 2 clics, un agent travaille pour vous.
                                </p>
                            </div>
                            <button
                                type="button"
                                data-testid="director-team-empty-cta"
                                onClick={() => scrollTo("section-marketplace")}
                                className="wd-btn wd-btn-primary wd-btn-md"
                            >
                                Voir la marketplace
                                <ArrowUpRight size={13} strokeWidth={2.4} />
                            </button>
                        </div>
                    ) : (
                        <div
                            data-testid="director-team-strip"
                            style={{
                                display: "flex",
                                gap: 12,
                                overflowX: "auto",
                                paddingBottom: 6,
                                marginInline: -4,
                                paddingInline: 4,
                            }}
                        >
                            {teamAgents.map((a) => (
                                <ActiveAgentChip
                                    key={a.id}
                                    agent={a}
                                    onConfigure={() => onOpenAgent(a)}
                                    onPause={() =>
                                        console.log(
                                            "TODO: POST /api/director/agents/pause",
                                            { agent_id: a.id },
                                        )
                                    }
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Marketplace ───────────────────────── */}
                <section
                    id="section-marketplace"
                    data-testid="director-section-marketplace"
                >
                    <header
                        style={{
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "space-between",
                            gap: 16,
                            marginBottom: 18,
                            flexWrap: "wrap",
                        }}
                    >
                        <div>
                            <div
                                style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: 8,
                                }}
                            >
                                <span
                                    aria-hidden
                                    style={{
                                        width: 24,
                                        height: 24,
                                        borderRadius: 8,
                                        background:
                                            "linear-gradient(135deg, #FB923C 0%, #EF4444 100%)",
                                        color: "#fff",
                                        display: "inline-flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        boxShadow: "0 6px 16px -4px rgba(239,68,68,0.45)",
                                    }}
                                >
                                    <Trophy size={13} strokeWidth={2.4} />
                                </span>
                                <h2
                                    style={{
                                        margin: 0,
                                        fontSize: 22,
                                        fontWeight: 700,
                                        color: "var(--wd-text)",
                                        letterSpacing: "-0.025em",
                                    }}
                                >
                                    Marketplace des stars
                                </h2>
                            </div>
                            <p
                                style={{
                                    margin: "5px 0 0",
                                    fontSize: 13,
                                    color: "var(--wd-text-3)",
                                }}
                            >
                                {filtered.length} agent
                                {filtered.length > 1 ? "s" : ""} disponibles
                                {filter !== "Tous" ? ` dans « ${filter} »` : ""} ·
                                sans engagement
                            </p>
                        </div>
                        <div className="wd-segmented" role="tablist">
                            {(["Tous", ...AGENT_CATEGORIES] as Filter[]).map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    data-testid={`director-filter-${slug(f)}`}
                                    data-active={filter === f}
                                    onClick={() => setFilter(f)}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </header>

                    {filtered.length === 0 ? (
                        <div
                            className="wd-card"
                            style={{
                                padding: "40px 28px",
                                textAlign: "center",
                                color: "var(--wd-text-3)",
                            }}
                        >
                            <Search
                                size={18}
                                style={{ opacity: 0.5, marginBottom: 8 }}
                            />
                            <div style={{ fontSize: 14, color: "var(--wd-text-2)" }}>
                                Aucun agent dans cette catégorie pour l'instant.
                            </div>
                        </div>
                    ) : (
                        <div
                            data-testid="director-agents-grid"
                            className="wd-agents-grid"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "repeat(3, 1fr)",
                                gap: 18,
                            }}
                        >
                            {filtered.map((a) => (
                                <AgentCard
                                    key={a.id}
                                    agent={a}
                                    canAfford={tokens >= a.cost}
                                    active={activeAgentIds.includes(a.id)}
                                    onOpen={onOpenAgent}
                                    onHire={onHireAgent}
                                />
                            ))}
                        </div>
                    )}
                </section>

                {/* ── Activity ──────────────────────────── */}
                <section
                    id="section-activity"
                    data-testid="director-section-activity"
                >
                    <header style={{ marginBottom: 14 }}>
                        <h2
                            style={{
                                margin: 0,
                                fontSize: 18,
                                fontWeight: 700,
                                color: "var(--wd-text)",
                                letterSpacing: "-0.015em",
                            }}
                        >
                            Activité récente
                        </h2>
                        <p
                            style={{
                                margin: "3px 0 0",
                                fontSize: 12.5,
                                color: "var(--wd-text-3)",
                            }}
                        >
                            Le journal de votre compte.
                        </p>
                    </header>

                    <ul
                        className="wd-card"
                        data-testid="director-activity-list"
                        style={{
                            listStyle: "none",
                            margin: 0,
                            padding: 0,
                            overflow: "hidden",
                        }}
                    >
                        {activities.map((a, i) => (
                            <li
                                key={a.id}
                                data-testid={`director-activity-${a.id}`}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 14,
                                    padding: "13px 18px",
                                    borderBottom:
                                        i === activities.length - 1
                                            ? "none"
                                            : "1px solid var(--wd-border-soft)",
                                }}
                            >
                                <span
                                    aria-hidden
                                    style={{
                                        width: 8,
                                        height: 8,
                                        borderRadius: "50%",
                                        background:
                                            a.delta > 0
                                                ? "var(--wd-success)"
                                                : a.delta < 0
                                                  ? "var(--wd-accent)"
                                                  : "var(--wd-text-4)",
                                        flexShrink: 0,
                                    }}
                                />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div
                                        style={{
                                            fontSize: 13.5,
                                            fontWeight: 500,
                                            color: "var(--wd-text)",
                                        }}
                                    >
                                        {a.label}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: 12,
                                            color: "var(--wd-text-3)",
                                            marginTop: 2,
                                        }}
                                    >
                                        {a.when}
                                    </div>
                                </div>
                                {a.delta !== 0 && (
                                    <span
                                        className="wd-num-tabular"
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 600,
                                            color:
                                                a.delta > 0
                                                    ? "var(--wd-success)"
                                                    : "var(--wd-text-2)",
                                        }}
                                    >
                                        {a.delta > 0 ? "+" : ""}
                                        {a.delta} cr.
                                    </span>
                                )}
                            </li>
                        ))}
                    </ul>
                </section>
            </main>

            <style>{`
                @media (max-width: 1100px) {
                    .wd-dashboard-hero-grid {
                        grid-template-columns: 1fr !important;
                    }
                    .wd-agents-grid {
                        grid-template-columns: repeat(2, 1fr) !important;
                    }
                }
                @media (max-width: 720px) {
                    .wd-agents-grid {
                        grid-template-columns: 1fr !important;
                    }
                }
            `}</style>
        </div>
    );
}

function Pulse({ label, value }: { label: string; value: string }) {
    return (
        <div
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                minWidth: 0,
            }}
        >
            <span
                aria-hidden
                style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: "var(--wd-success)",
                    boxShadow: "0 0 8px rgba(5, 150, 105, 0.5)",
                    animation: "wd-pulse 1.8s var(--wd-ease) infinite",
                }}
            />
            <span style={{ fontSize: 11.5, color: "var(--wd-text-3)" }}>{label}</span>
            <span
                className="wd-num-tabular"
                style={{
                    fontSize: 12.5,
                    fontWeight: 700,
                    color: "var(--wd-text)",
                    letterSpacing: "-0.01em",
                }}
            >
                {value}
            </span>
        </div>
    );
}

function slug(s: string) {
    return s
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "-");
}

function scrollTo(id: string) {
    if (typeof window === "undefined") return;
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
}
