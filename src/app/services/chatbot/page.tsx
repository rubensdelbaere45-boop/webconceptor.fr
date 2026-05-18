"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChatbotServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    business_name: "", name: "", email: "", phone: "",
    business_type: "restaurant", city: "",
  });

  const types = [
    { value: "restaurant",  label: "Restaurant / Bar / Café" },
    { value: "coiffeur",    label: "Salon de coiffure / Barbier" },
    { value: "beaute",      label: "Esthétique / Spa / Massage" },
    { value: "artisan",     label: "Artisan / BTP" },
    { value: "commerce",    label: "Commerce de proximité" },
    { value: "sante",       label: "Médecin / Dentiste / Kiné" },
    { value: "garage",      label: "Garage / Auto" },
    { value: "general",     label: "Autre activité" },
  ];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.business_name || !form.email || !form.name) return;
    setLoading(true);
    try {
      const res = await fetch("/api/chatbot/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Erreur : " + (data.error || "Réessayez"));
        setLoading(false);
      }
    } catch {
      alert("Erreur réseau. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="bg-gradient-to-br from-blue-600 to-violet-700 text-white py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block bg-white/20 rounded-full px-4 py-1 text-sm font-medium mb-6">
            🤖 Nouveau — Chatbot IA
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">
            Votre assistant IA répond<br />à vos clients 24h/24
          </h1>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Fonctionne sur <strong>n'importe quel site</strong> ou en page standalone.
            Zéro maintenance, réponses instantanées, clients satisfaits.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            {["✅ Livré en 30 secondes", "✅ Aucun site requis", "✅ Personnalisable", "✅ Sans engagement"].map((f) => (
              <span key={f} className="bg-white/15 px-4 py-2 rounded-full">{f}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Bénéfices */}
      <div className="max-w-4xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-bold text-center mb-10">Ce que fait votre chatbot</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: "💬", title: "Répond aux questions", desc: "Horaires, prix, adresse, services — vos clients obtiennent une réponse immédiate à 3h du matin si besoin." },
            { icon: "📅", title: "Oriente vers les RDV", desc: "Le bot dirige les clients vers votre lien de réservation ou votre numéro de téléphone au bon moment." },
            { icon: "🌍", title: "Parle sur tous les canaux", desc: "Widget sur votre site ET page standalone partageable sur WhatsApp, Google My Business, réseaux sociaux." },
          ].map((b) => (
            <div key={b.title} className="bg-gray-50 rounded-2xl p-6">
              <div className="text-3xl mb-3">{b.icon}</div>
              <h3 className="font-bold mb-2">{b.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Formulaire de commande */}
      <div className="bg-gray-50 py-16 px-4">
        <div className="max-w-lg mx-auto">
          <div className="bg-white rounded-3xl shadow-lg p-8">
            <div className="text-center mb-8">
              <span className="text-4xl font-black text-blue-600">79€</span>
              <span className="text-gray-500"> / mois</span>
              <p className="text-gray-400 text-sm mt-1">Sans engagement · Résiliable à tout moment</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nom de votre établissement *</label>
                <input
                  value={form.business_name}
                  onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                  placeholder="Restaurant Le Provençal"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type d'activité *</label>
                <select
                  value={form.business_type}
                  onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 bg-white"
                >
                  {types.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Votre prénom *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Marie"
                    required
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ville</label>
                  <input
                    value={form.city}
                    onChange={(e) => setForm({ ...form, city: e.target.value })}
                    placeholder="Lyon"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="marie@monrestaurant.fr"
                  required
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="06 12 34 56 78"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl text-base transition-colors disabled:opacity-50 mt-2"
              >
                {loading ? "Redirection..." : "Commander mon chatbot — 79€/mois →"}
              </button>

              <p className="text-center text-xs text-gray-400 mt-3">
                Paiement sécurisé par Stripe · Votre chatbot est livré en 30 secondes après le paiement
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* FAQ rapide */}
      <div className="max-w-2xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-bold mb-8 text-center">Questions fréquentes</h2>
        {[
          { q: "Je n'ai pas de site web. Ça marche quand même ?", a: "Oui ! Vous recevez une page de chat standalone (lien URL) que vous pouvez partager partout : WhatsApp, fiche Google My Business, Instagram, etc." },
          { q: "Comment le chatbot connaît mes horaires et services ?", a: "Après le paiement, vous recevez un email avec les instructions. Répondez simplement avec vos informations et on configure tout en 24h." },
          { q: "Puis-je résilier à tout moment ?", a: "Oui, sans préavis ni frais. L'abonnement s'arrête à la fin du mois en cours." },
          { q: "Le chatbot est-il en français ?", a: "Oui, 100% en français. Il peut aussi répondre en anglais et espagnol si un client étranger l'interpelle." },
        ].map((faq) => (
          <div key={faq.q} className="border-b border-gray-100 py-5">
            <p className="font-semibold mb-2">{faq.q}</p>
            <p className="text-gray-500 text-sm">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
