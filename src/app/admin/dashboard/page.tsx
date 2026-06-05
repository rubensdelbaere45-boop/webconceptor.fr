// Dashboard — Server Component avec KPIs en temps réel depuis Supabase
import { createClient } from "@supabase/supabase-js";
import StatsCard from "@/components/admin/StatsCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { Users, Send, MailOpen, Sparkles, Euro, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 30;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

async function countByStatus() {
  const supabase = db();
  const statuses = ["found", "sent", "opened", "replied", "paid", "unsubscribed", "error"];
  const counts: Record<string, number> = {};
  await Promise.all(
    statuses.map(async (s) => {
      const { count } = await supabase
        .from("prospects")
        .select("id", { count: "exact", head: true })
        .eq("status", s);
      counts[s] = count ?? 0;
    })
  );
  const { count: total } = await supabase.from("prospects").select("id", { count: "exact", head: true });
  const { count: withEmail } = await supabase
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .not("email", "is", null);
  const { count: stitchCount } = await supabase
    .from("prospects")
    .select("id", { count: "exact", head: true })
    .eq("stitch_generated", true);
  return { ...counts, total: total ?? 0, withEmail: withEmail ?? 0, stitchCount: stitchCount ?? 0 };
}

async function recentActivity() {
  const supabase = db();
  const { data } = await supabase
    .from("prospects")
    .select("id, slug, name, city, status, updated_at")
    .order("updated_at", { ascending: false })
    .limit(8);
  return data ?? [];
}

async function brevoCredits(): Promise<number | null> {
  try {
    const res = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": process.env.BREVO_API_KEY || "" },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const j = await res.json();
    const c = (j.plan || []).find((p: { credits?: number; type?: string }) => p.credits && p.type !== "sms")?.credits;
    return c ?? null;
  } catch { return null; }
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "à l'instant";
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
  return `il y a ${Math.floor(diff / 86400)} j`;
}

export default async function DashboardPage() {
  const [counts, activity, brevo] = await Promise.all([
    countByStatus(),
    recentActivity(),
    brevoCredits(),
  ]);

  const sentTotal = (counts.sent || 0) + (counts.opened || 0) + (counts.replied || 0) + (counts.paid || 0);
  const openRate = sentTotal > 0 ? Math.round(((counts.opened || 0) + (counts.replied || 0) + (counts.paid || 0)) / sentTotal * 100) : 0;

  return (
    <div style={{ padding: "28px 28px 60px", maxWidth: 1400, margin: "0 auto" }}>
      {/* ── KPIs ── */}
      <div style={{
        display: "grid", gap: 14,
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        marginBottom: 28,
      }}>
        <StatsCard Icon={Users}    label="Total prospects" value={counts.total.toLocaleString("fr")} sub={`${counts.withEmail.toLocaleString("fr")} avec email`} accent="blue" />
        <StatsCard Icon={Send}     label="Emails envoyés"  value={sentTotal.toLocaleString("fr")} sub={`Brevo : ${brevo?.toLocaleString("fr") ?? "?"} restants`} />
        <StatsCard Icon={MailOpen} label="Taux d'ouverture" value={`${openRate}%`} sub={`${(counts.opened ?? 0).toLocaleString("fr")} ouverts`} accent="green" />
        <StatsCard Icon={Sparkles} label="Maquettes Stitch" value={counts.stitchCount.toLocaleString("fr")} sub="Premium IA" accent="gold" />
        <StatsCard Icon={Euro}     label="Revenue"          value={`${(counts.paid * 320).toLocaleString("fr")} €`} sub={`${counts.paid} commande(s)`} accent="green" />
      </div>

      {/* ── Funnel ── */}
      <div style={{
        background: "var(--card)", border: "1px solid var(--border)",
        borderRadius: "var(--r)", padding: "20px 24px", marginBottom: 28,
      }}>
        <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 18, letterSpacing: "-0.01em" }}>Funnel de conversion</div>
        {(() => {
          const stages = [
            { label: "Trouvés",  value: counts.total,           color: "#777" },
            { label: "Envoyés",  value: sentTotal,              color: "#5b9bff" },
            { label: "Ouverts",  value: (counts.opened ?? 0) + (counts.replied ?? 0) + (counts.paid ?? 0), color: "#fbbf24" },
            { label: "Répondus", value: counts.replied ?? 0,    color: "#c084fc" },
            { label: "Payés",    value: counts.paid ?? 0,       color: "#4ade80" },
          ];
          const max = Math.max(...stages.map(s => s.value), 1);
          return stages.map((s) => (
            <div key={s.label} style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: "var(--txt-2)", fontWeight: 600 }}>{s.label}</span>
                <span style={{ color: "var(--txt)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{s.value.toLocaleString("fr")}</span>
              </div>
              <div style={{ height: 8, background: "var(--card-2)", borderRadius: 100, overflow: "hidden" }}>
                <div style={{
                  height: "100%", width: `${(s.value / max) * 100}%`,
                  background: s.color, borderRadius: 100, transition: "width .4s",
                }} />
              </div>
            </div>
          ));
        })()}
      </div>

      {/* ── Activité récente ── */}
      <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: "var(--r)", padding: "20px 24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, letterSpacing: "-0.01em" }}>Activité récente</div>
          <a href="/admin/prospects" style={{ fontSize: 12, color: "#5b9bff", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
            Tous les prospects <ArrowRight size={13} />
          </a>
        </div>
        <div>
          {activity.map((p) => (
            <a key={p.id} href={`/admin/prospects?focus=${p.id}`} style={{
              display: "grid", gridTemplateColumns: "1fr auto auto", alignItems: "center", gap: 14,
              padding: "10px 0", borderBottom: "1px solid var(--border)", textDecoration: "none", color: "inherit",
            }}>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
                <div style={{ fontSize: 11.5, color: "var(--txt-3)" }}>{p.city ?? "—"}</div>
              </div>
              <StatusBadge status={p.status ?? "found"} />
              <div style={{ fontSize: 11, color: "var(--txt-3)", minWidth: 90, textAlign: "right" }}>{timeAgo(p.updated_at)}</div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
