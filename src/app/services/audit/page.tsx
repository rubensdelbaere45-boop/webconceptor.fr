"use client";

import { useState } from "react";

export default function AuditIAPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_name: "", name: "", email: "", address: "", website: "",
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/audit-ia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "checkout", ...form }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erreur. Réessayez.");
        setLoading(false);
      }
    } catch {
      alert("Erreur réseau.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block bg-white/10 rounded-full px-4 py-1 text-sm font-medium mb-6">
            📊 Audit IA — One shot
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Votre présence en ligne<br />analysée en 5 minutes
          </h1>
          <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
            Recevez un rapport complet sur votre fiche Google, votre site web
            et 3 recommandations prioritaires pour attirer plus de clients.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {["📊 Rapport HTML complet", "🤖 Analyse IA personnalisée", "📧 Reçu par email en 5 min", "💶 49€ — paiement unique"].map((f) => (
              <span key={f} className="bg-white/10 px-4 py-2 rounded-full">{f}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-bold text-center mb-10">Ce que contient votre rapport</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "🗺️", title: "Audit Google My Business", desc: "Note, nombre d'avis, présence du téléphone, site web renseigné, score de complétude." },
            { icon: "🌐", title: "Audit site web", desc: "HTTPS, vitesse de chargement, adaptation mobile, formulaire de contact, présence des avis clients." },
            { icon: "🤖", title: "Recommandations IA", desc: "3 actions prioritaires et actionnables pour améliorer votre visibilité locale dès cette semaine." },
          ].map((b) => (
            <div key={b.title} className="bg-gray-50 rounded-2xl p-6">
              <div className="text-3xl mb-3">{b.icon}</div>
              <h3 className="font-bold mb-2">{b.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 py-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="text-center mb-8">
              <span className="text-4xl font-black text-slate-800">49€</span>
              <span className="text-gray-500"> — paiement unique</span>
              <p className="text-gray-400 text-sm mt-1">Rapport reçu par email en moins de 5 minutes</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de votre établissement *</label>
                <input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  placeholder="Café de la Mairie" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse (ville au minimum)</label>
                <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="12 rue de la Paix, Lyon"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-slate-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">URL de votre site (si vous en avez un)</label>
                <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })}
                  placeholder="https://mon-site.fr"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-slate-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Votre prénom *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Jean" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-slate-400" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email de réception du rapport *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="jean@moncafe.fr" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-slate-400" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl text-base transition-colors disabled:opacity-50 mt-2">
                {loading ? "Redirection..." : "Obtenir mon audit — 49€ →"}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                Paiement unique · Rapport par email en moins de 5 minutes
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
