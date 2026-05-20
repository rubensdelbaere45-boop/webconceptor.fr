"use client";
import { useEffect, useState } from "react";
import { TrendingUp, ShoppingBag, Receipt, AlertTriangle, DollarSign } from "lucide-react";
import { getDashboardStats } from "@/lib/caissio-store";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, BarChart, Bar,
} from "recharts";

function fmt(n: number) { return n.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }); }

type Stats = ReturnType<typeof getDashboardStats>;

function KpiCard({ label, value, hint, icon: Icon, green = false }: { label: string; value: string; hint?: string; icon: React.ElementType; green?: boolean }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#94a3b8" }}>{label}</div>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: green ? "#d1fae5" : "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon style={{ width: 16, height: 16, color: green ? "#059669" : "#4f46e5" }} />
        </div>
      </div>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 34, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

const tooltipStyle = {
  contentStyle: { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 8px 24px rgba(15,23,42,.08)", fontFamily: "'IBM Plex Sans',sans-serif", fontSize: 12 },
  labelStyle: { color: "#64748b" },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => { setStats(getDashboardStats()); }, []);

  if (!stats) return <div style={{ padding: 40, color: "#94a3b8", fontSize: 14 }}>Chargement…</div>;
  const k = stats.kpis;

  const hourlyData = stats.hourly.filter((_, i) => i >= 7 && i <= 22);

  return (
    <div style={{ padding: "32px 24px", maxWidth: 1400, fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');`}</style>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em", color: "#94a3b8", marginBottom: 4 }}>Vue d&apos;ensemble</div>
        <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 36, fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em" }}>Tableau de bord</h1>
        <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 4 }}>
          {new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 16, marginBottom: 20 }}>
        <KpiCard label="CA jour" value={fmt(k.day_revenue)} hint={`${k.day_tickets} ticket(s)`} icon={TrendingUp} />
        <KpiCard label="CA semaine" value={fmt(k.week_revenue)} icon={DollarSign} green />
        <KpiCard label="CA mois" value={fmt(k.month_revenue)} icon={ShoppingBag} />
        <KpiCard label="Panier moyen" value={fmt(k.avg_basket)} icon={Receipt} green />
      </div>

      {/* Charts row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16, marginBottom: 20 }}>

        {/* Area chart 7 days */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#94a3b8", marginBottom: 4 }}>7 derniers jours</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>Évolution du CA</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.last7} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradCA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" stroke="#94a3b8" tickFormatter={(d: string) => d.slice(5)} fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}€`} width={48} />
                <Tooltip
                  {...tooltipStyle}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [fmt(Number(v ?? 0)), "CA"]}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  labelFormatter={(l: any) => new Date(String(l ?? "")).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
                />
                <Area type="monotone" dataKey="revenue" stroke="#4f46e5" strokeWidth={2.5} fill="url(#gradCA)" dot={false} activeDot={{ r: 5, fill: "#4f46e5" }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart hourly */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#94a3b8", marginBottom: 4 }}>Aujourd&apos;hui</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>Ventes horaires</div>
          <div style={{ height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="hour" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}€`} width={40} />
                <Tooltip
                  {...tooltipStyle}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(v: any) => [fmt(Number(v ?? 0)), "CA"]}
                />
                <Bar dataKey="revenue" fill="#10b981" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 16 }}>
        {/* Top products */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#94a3b8", marginBottom: 4 }}>Best-sellers du mois</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>Top produits</div>
          {stats.topProducts.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13, padding: "24px 0", textAlign: "center" }}>Aucune vente ce mois-ci.<br />Faites votre première vente depuis la Caisse !</div>
          ) : stats.topProducts.map((p, i) => (
            <div key={p.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < stats.topProducts.length - 1 ? "1px solid #f1f5f9" : "none" }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 900, color: "#e2e8f0", width: 32 }}>#{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{p.qty} vendus</div>
              </div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: "#4f46e5", fontSize: 15 }}>{fmt(p.revenue)}</div>
            </div>
          ))}
        </div>

        {/* Stock alerts */}
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "#f59e0b" }} />
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.18em", color: "#94a3b8" }}>Alertes stock</div>
          </div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>À réapprovisionner</div>
          {stats.outOfStock.length === 0 && stats.lowStock.length === 0 ? (
            <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", paddingTop: 24 }}>✅ Tout est en ordre</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {stats.outOfStock.slice(0, 5).map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: "#0f172a" }}>{p.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#dc2626", textTransform: "uppercase" }}>Rupture</span>
                </div>
              ))}
              {stats.lowStock.slice(0, 5).map((p) => (
                <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 12px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10 }}>
                  <span style={{ fontSize: 13, color: "#0f172a" }}>{p.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706" }}>{p.stock} restant</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
