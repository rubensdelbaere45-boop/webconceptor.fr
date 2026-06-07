/**
 * WebDirector — Public surface
 * --------------------------------------------------------------
 * Single import point for downstream apps (Next.js 16 + Supabase).
 *
 * Recommended usage in the host app:
 *
 *   import {
 *     DirectorApp,
 *     LoginScreen,
 *     ChangePasswordScreen,
 *     WelcomeScreen,
 *     DashboardScreen,
 *     RechargeModal,
 *     AgentDetailPanel,
 *     ToastViewport,
 *     MOCK_ACCOUNT,
 *     MOCK_AGENTS,
 *     MOCK_PACKS,
 *     type Agent,
 *     type Pack,
 *   } from "@/director";
 *
 *   // Don't forget to import the stylesheet once (e.g. in app/layout.tsx):
 *   //   import "@/director/director.css";
 */

// ── Orchestrator ────────────────────────────────────────────
export { DirectorApp, default as Director } from "./DirectorApp";
export type { Screen } from "./DirectorApp";

// ── Screens (use individually with your own routing) ────────
export { LoginScreen } from "./screens/LoginScreen";
export { ChangePasswordScreen } from "./screens/ChangePasswordScreen";
export { WelcomeScreen } from "./screens/WelcomeScreen";
export { DashboardScreen } from "./screens/DashboardScreen";
export { RechargeModal } from "./screens/RechargeModal";

// ── Reusable building blocks ────────────────────────────────
export { AgentCard } from "./components/AgentCard";
export { AgentCharacter } from "./components/AgentCharacter";
export { AgentChatStream } from "./components/AgentChatStream";
export { AgentDetailPanel } from "./components/AgentDetailPanel";
export { ActiveAgentChip } from "./components/ActiveAgentChip";
export { BusinessPanel } from "./components/BusinessPanel";
export { CreditOrb } from "./components/CreditOrb";
export { FeaturedAgentHero } from "./components/FeaturedAgentHero";
export { LiveTicker } from "./components/LiveTicker";
export { ToastViewport } from "./components/Toast";
export type { ToastMsg, ToastTone } from "./components/Toast";
export { TomFloatingButton } from "./components/TomFloatingButton";
export { TopNav } from "./components/TopNav";
export type { NavKey } from "./components/TopNav";
export { DevNav } from "./components/DevNav";
export { Sparkline } from "./components/Sparkline";

// ── Mock data & domain types ────────────────────────────────
export {
    DEMO_CREDENTIALS,
    MOCK_ACCOUNT,
    MOCK_AGENTS,
    MOCK_PAINS,
    MOCK_PACKS,
    MOCK_ACTIVITIES,
    MOCK_TICKERS,
    MOCK_CHAT_THREADS,
    MOCK_PLATFORM_STATS,
    MOCK_BUSINESS_STATS,
    AGENT_CATEGORIES,
} from "./mockData";

export type {
    Account,
    Agent,
    AgentCategory,
    AgentColor,
    Pain,
    Pack,
    Activity,
    Ticker,
    ChatThread,
    ChatStep,
} from "./mockData";
