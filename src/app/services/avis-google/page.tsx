"use client";

import { useState } from "react";

export default function AvisGooglePage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_name: "", name: "", email: "", phone: "",
    business_type: "restaurant", city: "", response_tone: "professionnel",
  });

  const types = [
    { value: "restaurant", label: "Restaurant / Bar / Café" },
    { value: "coiffeur",   label: "Salon de coiffure" },
    { value: "beaute",     label: "Esthétique / Spa" },
    { value: "artisan",    label: "Artisan / BTP" },
    { value: "commerce",   label: "Commerce" },
    { value: "sante",      label: "Santé / Médecin" },
    { value: "general",    label: "Autre" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/gmb/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
      <div className="bg-gradient-to-br from-yellow-400 to-orange-500 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block bg-white/20 rounded-full px-4 py-1 text-sm font-medium mb-6">
            ⭐ Agent IA — Avis Google
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Vos avis Google,<br />répondus automatiquement
          </h1>
          <p className="text-xl text-yellow-100 mb-8 max-w-2xl mx-auto">
            Notre IA répond à chaque avis sous <strong>1 heure</strong>, 24h/24.
            Meilleure note Google = plus de clients. Fonctionne avec <strong>n'importe quel site</strong>.
          </p>
          <div className="flex flex-wrap justify-center gap-3 text-sm">
            {["⭐ +9% de CA par étoile gagnée", "✅ Réponses personnalisées", "✅ Ton adapté (positif/négatif)", "✅ Rapport mensuel inclus"].map((f) => (
              <span key={f} className="bg-white/20 px-4 py-2 rounded-full">{f}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-bold text-center mb-10">Comment ça fonctionne</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "1", title: "Vous commandez", desc: "Paiement sécurisé par Stripe. Vous recevez un email avec un lien de connexion." },
            { step: "2", title: "Vous connectez", desc: "Un clic pour connecter votre Google My Business. Prend moins de 2 minutes." },
            { step: "3", title: "L'IA prend le relais", desc: "Chaque nouvel avis reçoit une réponse personnalisée sous 1 heure, automatiquement." },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center text-xl font-black text-yellow-600 mx-auto mb-4">{s.step}</div>
              <h3 className="font-bold mb-2">{s.title}</h3>
              <p className="text-gray-500 text-sm">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gray-50 py-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="text-center mb-8">
              <span className="text-4xl font-black text-yellow-500">149€</span>
              <span className="text-gray-500"> / mois</span>
              <p className="text-gray-400 text-sm mt-1">Sans engagement · Résiliable à tout moment</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de votre établissement *</label>
                <input value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  placeholder="Boulangerie Dupont" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 focus:ring-2 focus:ring-yellow-100" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ton des réponses</label>
                <select value={form.response_tone} onChange={(e) => setForm({ ...form, response_tone: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400 bg-white">
                  <option value="professionnel">Professionnel</option>
                  <option value="chaleureux">Chaleureux et proche</option>
                  <option value="formel">Formel et soigné</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Votre prénom *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Thomas" required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Bordeaux"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="thomas@maboulangerie.fr" required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-yellow-400" />
              </div>
              <button type="submit" disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-4 rounded-xl text-base transition-colors disabled:opacity-50 mt-2">
                {loading ? "Redirection..." : "Commander — 149€/mois →"}
              </button>
              <p className="text-center text-xs text-gray-400 mt-2">
                Paiement sécurisé Stripe · Connexion Google en 2 minutes après paiement
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
