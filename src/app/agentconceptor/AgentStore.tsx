"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ══════════════════════════════════════════
   AGENTConceptor — Store page client component
   Sélection multi-agents + panier + checkout
   ══════════════════════════════════════════ */

const AGENTS = [
  {
    id: "chatbot",
    icon: "🤖",
    name: "Agent Chatbot",
    tagline: "Répond à vos clients 24h/24",
    description:
      "Un assistant IA répond instantanément à toutes les questions de vos clients — disponible sur votre site web ou via un simple lien partageable.",
    benefits: [
      "Répond 24h/24, même à 3h du matin",
      "Fonctionne sans site web (lien standalone)",
      "Script à coller en 30 secondes",
      "Personnalisé : horaires, FAQ, réservation",
    ],
    price: 79,
    priceNote: "/mois",
    delivery: "Livré en 30 secondes ⚡",
    gradient: "from-blue-500 to-cyan-500",
    bgLight: "bg-blue-50",
    border: "border-blue-200",
    tag: "Le plus populaire",
    priceEnv: "NEXT_PUBLIC_STRIPE_CHATBOT_PRICE",
  },
  {
    id: "reputation",
    icon: "⭐",
    name: "Agent Réputation",
    tagline: "Vos avis Google, gérés automatiquement",
    description:
      "L'IA répond à chaque avis Google sous 1 heure. Ton adapté (positif/négatif). +1 étoile sur Google = +9% de chiffre d'affaires.",
    benefits: [
      "Réponse à chaque avis sous 1h",
      "Ton professionnel, chaleureux ou formel",
      "Gère les avis négatifs avec diplomatie",
      "Rapport mensuel de réputation inclus",
    ],
    price: 99,
    priceNote: "/mois",
    delivery: "Actif après connexion Google (2 min) ⚡",
    gradient: "from-yellow-400 to-orange-500",
    bgLight: "bg-yellow-50",
    border: "border-yellow-200",
    tag: "+9% CA par étoile",
    priceEnv: "NEXT_PUBLIC_STRIPE_GMB_PRICE",
  },
  {
    id: "devis",
    icon: "📝",
    name: "Agent Devis",
    tagline: "Un devis pro en 2 minutes, automatiquement",
    description:
      "Vos clients remplissent un formulaire en ligne → reçoivent un devis professionnel généré par IA en 2 minutes. Vous économisez 2h par devis.",
    benefits: [
      "Formulaire en ligne à votre image",
      "Devis PDF généré par IA en 2 min",
      "Envoyé automatiquement au client",
      "Vous recevez une notification immédiate",
    ],
    price: 149,
    priceNote: "/mois",
    delivery: "Lien formulaire livré en 60 secondes ⚡",
    gradient: "from-violet-500 to-purple-600",
    bgLight: "bg-violet-50",
    border: "border-violet-200",
    tag: "Idéal artisans",
    priceEnv: "NEXT_PUBLIC_STRIPE_DEVIS_PRICE",
  },
  {
    id: "contenu",
    icon: "📱",
    name: "Agent Contenu",
    tagline: "5 posts/semaine pour vos réseaux sociaux",
    description:
      "Chaque semaine, recevez 5 posts prêts-à-publier pour Instagram et Facebook — adaptés à votre activité, votre ville et la saison.",
    benefits: [
      "5 posts par semaine livrés par email",
      "Captions + hashtags + heure de publication",
      "Idées visuelles pour Canva incluses",
      "Personnalisés à votre secteur et ville",
    ],
    price: 99,
    priceNote: "/mois",
    delivery: "Premier envoi sous 24h ⚡",
    gradient: "from-pink-500 to-rose-500",
    bgLight: "bg-pink-50",
    border: "border-pink-200",
    tag: "Économisez 400€/mois d'agence",
    priceEnv: "NEXT_PUBLIC_STRIPE_CONTENU_PRICE",
  },
  {
    id: "fidelisation",
    icon: "💌",
    name: "Agent Fidélisation",
    tagline: "Vos clients reviennent automatiquement",
    description:
      "Emails et SMS automatiques pour fidéliser vos clients : anniversaires, promotions saisonnières, relances post-visite, demandes d'avis.",
    benefits: [
      "Campagnes automatiques toute l'année",
      "SMS anniversaire avec offre exclusive",
      "Relance J+30 pour redemander un avis",
      "Promo saisonnières sans rien faire",
    ],
    price: 79,
    priceNote: "/mois",
    delivery: "Configuration en 24h ⚡",
    gradient: "from-emerald-500 to-teal-500",
    bgLight: "bg-emerald-50",
    border: "border-emerald-200",
    tag: "Fidélité +40%",
    priceEnv: "NEXT_PUBLIC_STRIPE_FIDEL_PRICE",
  },
];

const PACK_PRICE = 349;
const PACK_NORMAL_PRICE = AGENTS.reduce((s, a) => s + a.price, 0); // 505

type CartItem = (typeof AGENTS)[number];

interface CheckoutForm {
  name: string;
  email: string;
  business_name: string;
  phone: string;
  city: string;
  business_type: string;
}

const BUSINESS_TYPES = [
  { value: "restaurant",  label: "Restaurant / Bar / Café" },
  { value: "coiffeur",    label: "Salon de coiffure / Barbier" },
  { value: "beaute",      label: "Esthétique / Spa / Massage" },
  { value: "artisan",     label: "Artisan / BTP / Rénovation" },
  { value: "commerce",    label: "Commerce de proximité" },
  { value: "sante",       label: "Médecin / Dentiste / Kiné" },
  { value: "garage",      label: "Garage / Auto" },
  { value: "immobilier",  label: "Immobilier / Agence" },
  { value: "general",     label: "Autre activité" },
];

export default function AgentStore() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [packSelected, setPackSelected] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<CheckoutForm>({
    name: "", email: "", business_name: "", phone: "", city: "", business_type: "restaurant",
  });

  const cartTotal = packSelected ? PACK_PRICE : cart.reduce((s, a) => s + a.price, 0);
  const savings = packSelected ? PACK_NORMAL_PRICE - PACK_PRICE : 0;

  function toggleAgent(agent: CartItem) {
    if (packSelected) {
      setPackSelected(false);
      setCart([agent]);
      return;
    }
    setCart((prev) =>
      prev.find((a) => a.id === agent.id)
        ? prev.filter((a) => a.id !== agent.id)
        : [...prev, agent]
    );
  }

  function selectPack() {
    setPackSelected(true);
    setCart([]);
  }

  const isInCart = (id: string) => packSelected || cart.some((a) => a.id === id);
  const totalItems = packSelected ? 5 : cart.length;

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.business_name) return;
    setLoading(true);

    const selectedIds = packSelected ? AGENTS.map((a) => a.id) : cart.map((a) => a.id);

    try {
      const res = await fetch("/api/agentconceptor/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agents: selectedIds,
          pack: packSelected,
          ...form,
        }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erreur. Réessayez.");
        setLoading(false);
      }
    } catch {
      alert("Erreur réseau. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a14]">

      {/* ── HERO ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/50 via-[#0a0a14] to-indigo-900/30" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-violet-600/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-4 py-20 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-violet-500/20 border border-violet-500/30 rounded-full px-4 py-1.5 text-violet-300 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-violet-400 rounded-full animate-pulse" />
              Agents IA autonomes — Travaillent pendant que vous dormez
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tight">
              AGENT
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-cyan-400">
                Conceptor
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-4 max-w-3xl mx-auto">
              Des agents IA qui gèrent votre entreprise à votre place.
            </p>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-10">
              Réservations, avis clients, devis, réseaux sociaux, fidélisation —
              <strong className="text-white"> tout automatique, livré en quelques secondes.</strong>
            </p>

            <div className="flex flex-wrap justify-center gap-3 text-sm text-slate-300">
              {[
                "⚡ Livraison immédiate",
                "🔒 Paiement sécurisé Stripe",
                "🔄 Sans engagement",
                "📧 Support inclus",
              ].map((f) => (
                <span key={f} className="bg-white/5 border border-white/10 px-4 py-2 rounded-full">
                  {f}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── PACK COMPLET (highlighted) ── */}
      <div className="max-w-6xl mx-auto px-4 mb-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          onClick={selectPack}
          className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all ${
            packSelected
              ? "border-violet-500 bg-violet-500/10"
              : "border-violet-500/30 bg-white/3 hover:border-violet-500/60 hover:bg-white/5"
          }`}
        >
          <div className="absolute -top-3 left-6">
            <span className="bg-gradient-to-r from-violet-500 to-cyan-500 text-white text-xs font-bold px-4 py-1 rounded-full">
              ⭐ MEILLEURE VALEUR — Économisez {PACK_NORMAL_PRICE - PACK_PRICE}€/mois
            </span>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black text-white mb-1">
                🔥 Pack Complet AGENTConceptor
              </h2>
              <p className="text-slate-400 text-sm">
                Tous les 5 agents inclus · Chatbot + Réputation + Devis + Contenu + Fidélisation
              </p>
            </div>
            <div className="flex items-center gap-4 flex-shrink-0">
              <div className="text-right">
                <div className="text-slate-400 line-through text-sm">{PACK_NORMAL_PRICE}€/mois</div>
                <div className="text-3xl font-black text-white">{PACK_PRICE}€<span className="text-lg font-normal text-slate-400">/mois</span></div>
              </div>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                packSelected ? "bg-violet-500 border-violet-500" : "border-slate-500"
              }`}>
                {packSelected && <span className="text-white text-sm">✓</span>}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── AGENT CARDS ── */}
      <div className="max-w-6xl mx-auto px-4 mb-16">
        <p className="text-slate-400 text-center mb-6 text-sm">
          Ou sélectionnez les agents un par un selon vos besoins
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {AGENTS.map((agent, i) => {
            const selected = isInCart(agent.id);
            return (
              <motion.div
                key={agent.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i + 0.3 }}
                onClick={() => toggleAgent(agent)}
                className={`relative cursor-pointer rounded-2xl border-2 p-6 transition-all ${
                  selected
                    ? `border-violet-500 bg-violet-500/10`
                    : `border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5`
                }`}
              >
                {/* Tag */}
                <div className="absolute -top-2.5 right-4">
                  <span className={`text-white text-[10px] font-bold px-3 py-0.5 rounded-full bg-gradient-to-r ${agent.gradient}`}>
                    {agent.tag}
                  </span>
                </div>

                {/* Checkbox */}
                <div className="absolute top-4 right-4">
                  <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                    selected ? "bg-violet-500 border-violet-500" : "border-slate-600"
                  }`}>
                    {selected && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                </div>

                <div className="text-4xl mb-3">{agent.icon}</div>
                <h3 className="text-lg font-black text-white mb-1">{agent.name}</h3>
                <p className={`text-xs font-semibold mb-3 bg-gradient-to-r ${agent.gradient} bg-clip-text text-transparent`}>
                  {agent.tagline}
                </p>
                <p className="text-slate-400 text-sm mb-4 leading-relaxed">{agent.description}</p>

                <ul className="space-y-1.5 mb-5">
                  {agent.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-slate-300">
                      <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <span className="text-2xl font-black text-white">{agent.price}€</span>
                    <span className="text-slate-400 text-sm">/mois</span>
                  </div>
                  <span className="text-xs text-green-400 font-medium">{agent.delivery}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* ── STICKY CART ── */}
      <AnimatePresence>
        {(cart.length > 0 || packSelected) && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-[#0a0a14]/95 backdrop-blur-md border-t border-white/10"
          >
            <div className="max-w-2xl mx-auto flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-white font-bold text-lg">
                  {packSelected ? (
                    <span>🔥 Pack Complet — 5 agents</span>
                  ) : (
                    <span>
                      {totalItems} agent{totalItems > 1 ? "s" : ""} sélectionné{totalItems > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-green-400 text-sm font-medium">Vous économisez {savings}€/mois</p>
                )}
                <div className="text-slate-400 text-sm">
                  {packSelected
                    ? AGENTS.map((a) => a.name).join(" · ")
                    : cart.map((a) => a.name).join(" · ")}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="text-2xl font-black text-white">{cartTotal}€<span className="text-sm font-normal text-slate-400">/mois</span></div>
              </div>

              <button
                onClick={() => setShowModal(true)}
                className="flex-shrink-0 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold px-6 py-3 rounded-xl transition-all text-sm whitespace-nowrap"
              >
                Commander →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MODAL CHECKOUT ── */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-[#13131f] border border-white/10 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-black text-white">Finaliser la commande</h2>
                  <p className="text-slate-400 text-sm">Livraison automatique après paiement</p>
                </div>
                <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white text-xl">✕</button>
              </div>

              {/* Résumé commande */}
              <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10">
                <div className="font-semibold text-white mb-2 text-sm">
                  {packSelected ? "🔥 Pack Complet AGENTConceptor" : "Votre sélection"}
                </div>
                <div className="space-y-1">
                  {(packSelected ? AGENTS : cart).map((a) => (
                    <div key={a.id} className="flex justify-between text-sm text-slate-300">
                      <span>{a.icon} {a.name}</span>
                      <span className="text-slate-400">{packSelected ? "inclus" : `${a.price}€/mois`}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-white/10 mt-3 pt-3 flex justify-between font-black text-white">
                  <span>Total mensuel</span>
                  <span className="text-violet-400">{cartTotal}€/mois</span>
                </div>
                {savings > 0 && (
                  <div className="text-green-400 text-xs mt-1 text-right">Économie : {savings}€/mois</div>
                )}
              </div>

              <form onSubmit={handleCheckout} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Prénom & nom *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Marie Dupont"
                      required
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Téléphone</label>
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      placeholder="06 12 34 56 78"
                      type="tel"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Email *</label>
                  <input
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="marie@monentreprise.fr"
                    type="email"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Nom de votre établissement *</label>
                  <input
                    value={form.business_name}
                    onChange={(e) => setForm({ ...form, business_name: e.target.value })}
                    placeholder="Restaurant Le Provençal"
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Type d'activité</label>
                    <select
                      value={form.business_type}
                      onChange={(e) => setForm({ ...form, business_type: e.target.value })}
                      className="w-full bg-[#1a1a2e] border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white outline-none focus:border-violet-500"
                    >
                      {BUSINESS_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Ville</label>
                    <input
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      placeholder="Lyon"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-slate-500 outline-none focus:border-violet-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || (!form.name || !form.email || !form.business_name)}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-40 text-white font-bold py-3.5 rounded-xl text-sm transition-all mt-2"
                >
                  {loading ? "Redirection vers Stripe..." : `Payer ${cartTotal}€/mois — Paiement sécurisé →`}
                </button>

                <p className="text-center text-xs text-slate-500 mt-2">
                  Sans engagement · Résiliable à tout moment · Paiement sécurisé par Stripe
                </p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── STATS / SOCIAL PROOF ── */}
      <div className="max-w-6xl mx-auto px-4 py-16 border-t border-white/5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: "< 60s", label: "Délai de livraison" },
            { value: "24/7", label: "Vos agents travaillent" },
            { value: "0€", label: "De maintenance" },
            { value: "ROI ×10", label: "En moyenne" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl md:text-4xl font-black text-white mb-1">{s.value}</div>
              <div className="text-slate-400 text-sm">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="max-w-2xl mx-auto px-4 pb-32">
        <h2 className="text-2xl font-bold text-white text-center mb-8">Questions fréquentes</h2>
        {[
          {
            q: "Est-ce que ça marche même si je n'ai pas de site web ?",
            a: "Oui ! L'Agent Chatbot fournit une page de chat standalone partageable. L'Agent Réputation gère vos avis Google. L'Agent Devis vous donne un lien formulaire. Aucun site requis.",
          },
          {
            q: "Combien de temps avant que les agents soient opérationnels ?",
            a: "Le Chatbot et le Devis sont livrés en 30 à 60 secondes après paiement. L'Agent Réputation nécessite une connexion Google de 2 minutes. L'Agent Contenu envoie son premier email sous 24h.",
          },
          {
            q: "Puis-je résiler à tout moment ?",
            a: "Oui, sans préavis et sans frais. L'abonnement s'arrête à la fin du mois en cours. Vous gardez les contenus générés.",
          },
          {
            q: "Puis-je prendre plusieurs agents séparément ?",
            a: "Oui ! Vous choisissez exactement ce dont vous avez besoin. Le Pack Complet vous fait économiser 156€/mois si vous prenez les 5.",
          },
        ].map((faq) => (
          <div key={faq.q} className="border-b border-white/10 py-5">
            <p className="font-semibold text-white mb-2">{faq.q}</p>
            <p className="text-slate-400 text-sm leading-relaxed">{faq.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
