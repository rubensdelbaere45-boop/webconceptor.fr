"use client";

import Link from "next/link";
import { useState } from "react";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    client_name: "",
    client_email: "",
    price: "",
    preview_url: "",
    contract_text: "",
    stripe_payment_link: "",
  });
  const [result, setResult] = useState<{ code?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-key": adminKey,
        },
        body: JSON.stringify({
          ...form,
          price_cents: Math.round(parseFloat(form.price || "0") * 100),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setResult({ error: data.error || "Erreur" });
      } else {
        setResult({ code: data.code });
        setForm({ title: "", description: "", client_name: "", client_email: "", price: "", preview_url: "", contract_text: "", stripe_payment_link: "" });
      }
    } catch {
      setResult({ error: "Erreur réseau" });
    }
    setLoading(false);
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link href="/" className="text-lg font-bold tracking-tight inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-sm" />Web<span className="text-blue-600">Conceptor</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight mt-6">Admin</h1>
            <p className="text-sm text-gray-500 mt-2">Espace réservé</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <form onSubmit={(e) => { e.preventDefault(); setAuthed(true); }} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Clé admin</label>
                <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Votre clé secrète" />
              </div>
              <button type="submit" className="w-full py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition">
                Accéder
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="h-16 px-6 flex items-center justify-between border-b border-gray-100 bg-white">
        <Link href="/" className="text-base font-bold tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-sm" />Web<span className="text-blue-600">Conceptor</span>
          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 text-[10px] font-semibold rounded">ADMIN</span>
        </Link>
        <button onClick={() => setAuthed(false)} className="text-sm text-gray-400 hover:text-black">Déconnexion</button>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2 text-black">Créer un projet</h1>
        <p className="text-gray-500 mb-10">Remplissez les infos. Un code à 6 chiffres sera généré automatiquement.</p>

        {result?.code && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8 text-center">
            <p className="text-green-700 font-medium mb-2">✓ Projet créé avec succès</p>
            <p className="text-4xl font-bold tracking-[0.3em] text-green-800 mb-2">{result.code}</p>
            <p className="text-sm text-green-600">Envoyez ce code au client par email</p>
          </div>
        )}

        {result?.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-8">
            <p className="text-red-600 text-sm">{result.error}</p>
          </div>
        )}

        <div className="bg-white border border-gray-100 rounded-xl p-8 shadow-sm">
          <form onSubmit={handleCreate} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Nom du client</label>
                <input type="text" value={form.client_name} onChange={e => setForm({ ...form, client_name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Jean Dupont" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Email du client</label>
                <input type="email" value={form.client_email} onChange={e => setForm({ ...form, client_email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="client@entreprise.fr" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Titre du projet *</label>
              <input type="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="Site vitrine — Le Fournil de Marie" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[80px] resize-y"
                placeholder="Refonte complète du site avec 11 pages, design moderne..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Prix (€) *</label>
                <input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="1490" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">URL de la maquette</label>
                <input type="url" value={form.preview_url} onChange={e => setForm({ ...form, preview_url: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="https://webconceptor.fr/prospects/xxx" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Détails du contrat</label>
              <textarea value={form.contract_text} onChange={e => setForm({ ...form, contract_text: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 min-h-[100px] resize-y"
                placeholder="- Design sur-mesure 11 pages&#10;- SEO local Paris/IDF&#10;- Hébergement 1 an inclus&#10;- Livraison 5 jours&#10;- Retours illimités" />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Lien Stripe Checkout</label>
              <input type="url" value={form.stripe_payment_link} onChange={e => setForm({ ...form, stripe_payment_link: e.target.value })}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                placeholder="https://buy.stripe.com/xxx" />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition disabled:opacity-50">
              {loading ? "Création..." : "Créer le projet + générer le code"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
