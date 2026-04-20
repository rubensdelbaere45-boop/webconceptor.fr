"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

interface Prospect {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  distance_km: number;
  phone: string;
  website: string;
  email: string;
  google_rating: number;
  google_reviews_count: number;
  status: string;
  sent_at: string;
  opened_at: string;
  replied_at: string;
  created_at: string;
  project_code?: string | null;
  business_type?: string | null;
}

const statusColors: Record<string, string> = {
  found: "bg-blue-100 text-blue-700",
  no_email: "bg-gray-100 text-gray-500",
  ready: "bg-yellow-100 text-yellow-700",
  sent: "bg-green-100 text-green-700",
  opened: "bg-emerald-100 text-emerald-700",
  replied: "bg-purple-100 text-purple-700",
  converted: "bg-pink-100 text-pink-700",
  error: "bg-red-100 text-red-700",
};

export default function AdminProspectsPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("Proxi épicerie France");
  const [statusFilter, setStatusFilter] = useState("all");
  const [batchSize, setBatchSize] = useState(5);
  const [dryRun, setDryRun] = useState(true);
  const [log, setLog] = useState<string[]>([]);

  const addLog = (msg: string) => {
    setLog((l) => [`${new Date().toLocaleTimeString()} — ${msg}`, ...l].slice(0, 30));
  };

  const loadProspects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/prospect/list?status=${statusFilter}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (res.ok) {
        const data = await res.json();
        setProspects(data.prospects || []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, [adminKey, statusFilter]);

  useEffect(() => {
    if (authed) loadProspects();
  }, [authed, loadProspects]);

  const handleFind = async () => {
    setLoading(true);
    addLog(`Recherche : "${searchQuery}"...`);
    try {
      const res = await fetch("/api/prospect/find", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      if (!res.ok) {
        addLog(`❌ ${data.error || "Erreur"}`);
      } else {
        addLog(`✓ ${data.stats.inserted} nouveaux prospects (${data.stats.withEmail} avec email, ${data.stats.skippedNearby} trop proches, ${data.stats.skippedDuplicate} doublons)`);
        loadProspects();
      }
    } catch (err) {
      addLog(`❌ ${err instanceof Error ? err.message : "Erreur"}`);
    }
    setLoading(false);
  };

  const handleSend = async (prospectId?: string) => {
    setLoading(true);
    addLog(dryRun ? "Test (dry-run) — génération maquettes..." : "Envoi en cours...");
    try {
      const res = await fetch("/api/prospect/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          prospect_id: prospectId,
          batch_size: batchSize,
          dry_run: dryRun,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addLog(`❌ ${data.error || "Erreur"}`);
      } else {
        const sent = data.results?.filter((r: { status: string }) => r.status === "sent" || r.status === "ready").length || 0;
        addLog(`✓ ${sent}/${data.processed} ${dryRun ? "maquettes générées" : "emails envoyés"}`);
        loadProspects();
      }
    } catch (err) {
      addLog(`❌ ${err instanceof Error ? err.message : "Erreur"}`);
    }
    setLoading(false);
  };

  const handleExport = (p: Prospect) => {
    // Download the mockup HTML via the export endpoint.
    // We put the key in the URL param (safe because it's the user's own browser).
    const url = `/api/prospect/export?id=${encodeURIComponent(p.id)}&key=${encodeURIComponent(adminKey)}`;
    // Open in a same-tab navigation → triggers the Content-Disposition attachment
    const a = document.createElement("a");
    a.href = url;
    a.download = `mockup-${p.slug || p.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addLog(`📦 Export HTML lancé : ${p.name}`);
  };

  const handleGenerateCode = async (p: Prospect) => {
    if (p.project_code) {
      // Already has a code → copy it + show
      const msg =
        `Code existant pour ${p.name} :\n\n` +
        `CODE : ${p.project_code}\n` +
        `Lien : https://webconceptor.fr/code?c=${p.project_code}\n\n` +
        `(code copié dans le presse-papier)`;
      alert(msg);
      navigator.clipboard?.writeText(p.project_code).catch(() => {});
      return;
    }
    if (!confirm(`Générer un code PIN pour ${p.name} ?\n\nCela créera un projet Stripe à 599 € lié à sa maquette. Code seulement, pas d'email envoyé.`)) {
      return;
    }
    setLoading(true);
    addLog(`Génération code PIN pour ${p.name}...`);
    try {
      const res = await fetch("/api/prospect/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ prospect_id: p.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        addLog(`❌ ${data.error || "Erreur"}`);
        alert(`Erreur : ${data.error || "inconnue"}`);
      } else {
        addLog(`✅ Code ${data.code} généré pour ${p.name}`);
        navigator.clipboard?.writeText(data.code).catch(() => {});
        alert(
          `✅ Code PIN généré !\n\n` +
          `CODE : ${data.code}\n` +
          `(copié dans le presse-papier)\n\n` +
          `Lien client : ${data.code_url}`
        );
        loadProspects();
      }
    } catch (err) {
      addLog(`❌ ${err instanceof Error ? err.message : "Erreur"}`);
    }
    setLoading(false);
  };

  const handleSendCodeEmail = async (p: Prospect) => {
    const action = p.project_code ? "Renvoyer" : "Générer et envoyer";
    if (!p.email) {
      alert(`${p.name} n'a pas d'email. Impossible d'envoyer.`);
      return;
    }
    if (!confirm(`${action} l'email avec le code à ${p.name} (${p.email}) ?\n\nL'email premium sera envoyé depuis contact@webconceptor.fr.`)) {
      return;
    }
    setLoading(true);
    addLog(`Envoi email code à ${p.name}...`);
    try {
      const res = await fetch("/api/prospect/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ prospect_id: p.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        addLog(`❌ ${data.error || "Erreur"}`);
        alert(`Erreur : ${data.error || "inconnue"}`);
      } else {
        addLog(`📧 Code ${data.code} envoyé à ${data.sent_to}`);
        alert(
          `📧 Email envoyé !\n\n` +
          `Destinataire : ${data.sent_to}\n` +
          `Code : ${data.code}\n\n` +
          `Le client a reçu un email premium avec le code bien visible, ` +
          `le bouton vers /code, le lien pour revoir sa maquette, ` +
          `et le détail des délais (5j site seul / 7j avec option Sérénité).`
        );
        loadProspects();
      }
    } catch (err) {
      addLog(`❌ ${err instanceof Error ? err.message : "Erreur"}`);
    }
    setLoading(false);
  };

  const stats = {
    total: prospects.length,
    with_email: prospects.filter((p) => p.email).length,
    sent: prospects.filter((p) => p.status === "sent" || p.status === "opened" || p.status === "replied").length,
    opened: prospects.filter((p) => p.status === "opened" || p.status === "replied").length,
    replied: prospects.filter((p) => p.status === "replied" || p.status === "converted").length,
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link href="/" className="text-lg font-bold tracking-tight inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-sm" />Web<span className="text-blue-600">Conceptor</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight mt-6">Prospection</h1>
            <p className="text-sm text-gray-500 mt-2">Espace reserve</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <form onSubmit={(e) => { e.preventDefault(); setAuthed(true); }} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Cle admin</label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Votre cle secrete"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition">
                Acceder
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="h-14 px-6 flex items-center justify-between border-b border-[#f5f5f5] bg-white">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 bg-[#0066ff] rounded-md flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">W</span>
          </span>
          <span className="text-[14px] font-semibold tracking-tight">
            Web<span className="text-[#0066ff]">Conceptor</span>
            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">PROSPECTION</span>
          </span>
        </Link>
        <div className="flex gap-3 text-[13px]">
          <Link href="/admin" className="text-[#737373] hover:text-[#0a0a0a]">← Admin projets</Link>
          <button onClick={() => setAuthed(false)} className="text-[#a3a3a3] hover:text-[#0a0a0a]">Deconnexion</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Prospection automatisée</h1>
        <p className="text-[#737373] text-[14px] mb-8">Recherche Google Maps · filtre 350 km autour d&apos;Aubenton · maquettes personnalisées + emails automatiques</p>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total", val: stats.total, color: "text-black" },
            { label: "Avec email", val: stats.with_email, color: "text-blue-600" },
            { label: "Envoyés", val: stats.sent, color: "text-green-600" },
            { label: "Ouverts", val: stats.opened, color: "text-emerald-600" },
            { label: "Répondus", val: stats.replied, color: "text-purple-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5">
              <p className={`text-3xl font-extrabold tracking-tight ${s.color}`}>{s.val}</p>
              <p className="text-[12px] text-gray-400 mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Find */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h2 className="text-base font-semibold mb-4">1. Chercher de nouveaux prospects</h2>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full mb-3 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Ex: Proxi épicerie France"
            />
            <p className="text-[11px] text-gray-500 mb-4">
              Google Maps cherche jusqu&apos;a 20 résultats par requête. Les magasins à moins de 350&nbsp;km d&apos;Aubenton sont automatiquement exclus.
            </p>
            <button
              onClick={handleFind}
              disabled={loading || !searchQuery.trim()}
              className="w-full py-2.5 bg-[#0066ff] text-white rounded-lg text-sm font-semibold hover:bg-[#0052cc] transition disabled:opacity-50"
            >
              {loading ? "Recherche..." : "Lancer la recherche"}
            </button>
          </div>

          {/* Send */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h2 className="text-base font-semibold mb-4">2. Envoyer les emails</h2>
            <div className="flex items-center gap-3 mb-3">
              <label className="text-[13px] text-gray-700">Batch :</label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
              >
                {[1, 3, 5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n} prospect{n > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-[13px] text-gray-700 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="rounded"
              />
              <span>Mode test (génère la maquette mais n&apos;envoie pas l&apos;email)</span>
            </label>
            <p className="text-[11px] text-gray-500 mb-4">
              Traite les prospects au statut &laquo;&nbsp;found&nbsp;&raquo; qui ont un email. Generation de maquette via Claude Haiku, envoi via Brevo, notif Telegram.
            </p>
            <button
              onClick={() => handleSend()}
              disabled={loading}
              className="w-full py-2.5 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? "En cours..." : dryRun ? "Générer les maquettes (test)" : `Envoyer ${batchSize} emails`}
            </button>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 flex-wrap">
            {["all", "found", "no_email", "ready", "sent", "opened", "replied", "error"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition ${
                  statusFilter === s
                    ? "bg-[#0a0a0a] text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {s === "all" ? "Tous" : s}
              </button>
            ))}
          </div>
          <button
            onClick={loadProspects}
            disabled={loading}
            className="text-[13px] text-[#0066ff] hover:underline"
          >
            Rafraichir
          </button>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div className="bg-black text-green-400 font-mono text-[11px] rounded-lg p-4 mb-4 max-h-40 overflow-y-auto">
            {log.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        )}

        {/* Prospects list */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {prospects.length === 0 ? (
            <div className="p-12 text-center text-[#a3a3a3] text-[14px]">
              Aucun prospect. Lancez une recherche pour commencer.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {prospects.map((p) => {
                const colorClass = statusColors[p.status] || "bg-gray-100 text-gray-500";
                return (
                  <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-semibold truncate">{p.name}</p>
                        {p.business_type === "restaurant" ? (
                          <span className="text-[11px]">🍽️</span>
                        ) : p.business_type === "epicerie" ? (
                          <span className="text-[11px]">🛒</span>
                        ) : null}
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorClass}`}>
                          {p.status}
                        </span>
                        {p.google_rating && (
                          <span className="text-[11px] text-amber-600 flex items-center gap-0.5">
                            ★ {p.google_rating} ({p.google_reviews_count || 0})
                          </span>
                        )}
                        {p.project_code && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700">
                            PIN {p.project_code}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-gray-500 truncate">
                        {p.city} &middot; {p.distance_km} km &middot; {p.email || "pas d'email"}{p.phone ? ` · ${p.phone}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {p.slug && (
                        <a
                          href={`/prospects/${p.slug}`}
                          target="_blank"
                          rel="noopener"
                          className="px-2.5 py-1.5 text-[11px] font-medium border border-gray-200 rounded-lg hover:bg-gray-100 transition"
                          title="Voir la maquette en ligne"
                        >
                          Maquette →
                        </a>
                      )}
                      {p.email && p.status === "found" && (
                        <button
                          onClick={() => handleSend(p.id)}
                          disabled={loading}
                          className="px-2.5 py-1.5 text-[11px] font-semibold bg-[#0066ff] text-white rounded-lg hover:bg-[#0052cc] transition disabled:opacity-50"
                          title={dryRun ? "Générer la maquette sans envoyer" : "Envoyer l'email au prospect"}
                        >
                          {dryRun ? "Générer" : "Envoyer"}
                        </button>
                      )}
                      {/* Export HTML — disponible dès qu'une maquette existe */}
                      {["ready", "sent", "opened", "replied", "converted"].includes(p.status) && (
                        <button
                          onClick={() => handleExport(p)}
                          disabled={loading}
                          className="px-2.5 py-1.5 text-[11px] font-medium border border-gray-200 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                          title="Télécharger le HTML de la maquette"
                        >
                          📦 Exporter
                        </button>
                      )}
                      {/* Générer / afficher code PIN — disponible dès qu'une maquette existe */}
                      {["ready", "sent", "opened", "replied", "converted"].includes(p.status) && (
                        <button
                          onClick={() => handleGenerateCode(p)}
                          disabled={loading}
                          className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition disabled:opacity-50 ${
                            p.project_code
                              ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300"
                              : "bg-black text-white hover:bg-gray-800"
                          }`}
                          title={p.project_code ? `Afficher le code ${p.project_code}` : "Générer un code PIN sans email"}
                        >
                          {p.project_code ? `🔐 ${p.project_code}` : "🔐 Code"}
                        </button>
                      )}
                      {/* Envoyer code par email premium — dès qu'une maquette + email existent */}
                      {p.email && ["ready", "sent", "opened", "replied", "converted"].includes(p.status) && (
                        <button
                          onClick={() => handleSendCodeEmail(p)}
                          disabled={loading}
                          className="px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                          title={p.project_code
                            ? `Renvoyer l'email avec le code ${p.project_code} à ${p.email}`
                            : `Générer un code + envoyer email premium à ${p.email}`}
                        >
                          {p.project_code ? "📧 Renvoyer" : "📧 Envoyer code"}
                        </button>
                      )}
                      {p.website && (
                        <a
                          href={p.website}
                          target="_blank"
                          rel="noopener"
                          className="text-[11px] text-gray-400 hover:text-[#0066ff] ml-1"
                          title="Voir son site actuel"
                        >
                          site
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
