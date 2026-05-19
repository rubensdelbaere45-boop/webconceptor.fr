"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

const ease = [0.25, 0.1, 0.25, 1] as const;

const features = [
  {
    icon: "🧾",
    title: "Caisse tactile intuitive",
    desc: "Interface pensée pour aller vite. Encaissez en 3 secondes, même sans connexion internet.",
  },
  {
    icon: "📦",
    title: "Gestion des stocks",
    desc: "Inventaire en temps réel. Alertes automatiques quand un article passe sous le seuil critique.",
  },
  {
    icon: "📊",
    title: "Statistiques du jour",
    desc: "CA, panier moyen, articles les plus vendus — un tableau de bord clair à chaque fin de journée.",
  },
  {
    icon: "🖨️",
    title: "Tickets & factures PDF",
    desc: "Impression thermique ou envoi par email. Les factures sont générées automatiquement.",
  },
  {
    icon: "☁️",
    title: "Synchronisation cloud",
    desc: "Toutes vos données sauvegardées en temps réel. Accessible depuis n'importe quel appareil.",
  },
  {
    icon: "🔌",
    title: "Mode hors-ligne",
    desc: "Continuez à encaisser même sans internet. La synchronisation reprend dès la reconnexion.",
  },
];

const steps = [
  { num: "01", title: "Téléchargez Caissio", desc: "Installation en 2 minutes sur Windows, Mac ou iPad." },
  { num: "02", title: "Configurez vos produits", desc: "Importez votre catalogue ou créez vos articles en quelques clics." },
  { num: "03", title: "Encaissez dès le premier jour", desc: "Interface prête à l'emploi. Aucune formation nécessaire." },
];

export default function CaissioPage() {
  const [form, setForm] = useState({ name: "", email: "", business: "", phone: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.email || !form.business) return;
    setLoading(true);
    try {
      await fetch("/api/demandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activite: form.business,
          besoin: "Logiciel de caisse Caissio",
          has_site: false,
          details: `Demande d'accès Caissio\nTéléphone: ${form.phone}`,
          style: "",
          exemples: "",
          nom: form.name,
          email: form.email,
          telephone: form.phone,
          budget: "caissio",
          statut: "nouveau",
        }),
      });
      setSent(true);
    } catch {
      setSent(true);
    }
    setLoading(false);
  }

  return (
    <div className="bg-white text-[#0a0a0a] min-h-screen">

      {/* ── NAV ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-black/[0.04]">
        <div className="max-w-6xl mx-auto h-14 px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-6 h-6 bg-[#0066ff] rounded-md flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">W</span>
            </span>
            <span className="text-[14px] font-semibold tracking-tight">Web<span className="text-[#0066ff]">Conceptor</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-[13px] text-[#737373] hover:text-[#0a0a0a] transition-colors hidden sm:block">
              ← Retour
            </Link>
            <a href="#demande" className="px-4 py-1.5 bg-[#059669] text-white text-[13px] font-medium rounded-full hover:bg-emerald-700 transition-colors">
              Accès anticipé
            </a>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 overflow-hidden pt-14">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-50/70 via-teal-50/30 to-white pointer-events-none" />
        <div className="absolute top-20 left-1/3 w-[500px] h-[500px] bg-gradient-to-r from-emerald-400/[0.15] to-teal-400/[0.1] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-teal-400/[0.1] to-cyan-400/[0.08] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#e5e5e5] rounded-full text-[13px] text-[#525252] mb-10 shadow-sm"
          >
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>Logiciel de caisse français &middot; Accès anticipé ouvert</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="text-[clamp(2.5rem,7vw,5rem)] font-extrabold leading-[0.92] tracking-[-0.04em] mb-8"
          >
            La caisse{" "}
            <span className="bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">
              intelligente
            </span>
            <br />
            pour votre commerce.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="text-[18px] text-[#525252] leading-relaxed mb-10 max-w-2xl mx-auto"
          >
            Caissio simplifie votre quotidien : encaissement rapide, gestion des stocks, factures automatiques
            et statistiques en temps réel. Conçu pour les commerçants français.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease }}
            className="flex flex-col sm:flex-row gap-3 justify-center"
          >
            <a
              href="#demande"
              className="px-8 py-3.5 bg-[#059669] text-white text-[15px] font-semibold rounded-full hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30"
            >
              Accès anticipé gratuit →
            </a>
            <a
              href="#fonctionnalites"
              className="px-8 py-3.5 bg-white border border-[#e5e5e5] text-[#0a0a0a] text-[15px] font-medium rounded-full hover:border-[#0a0a0a] transition-all"
            >
              Voir les fonctionnalités
            </a>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-[12px] text-[#a3a3a3] mt-6"
          >
            Windows · Mac · iPad &nbsp;·&nbsp; Fonctionne hors-ligne &nbsp;·&nbsp; Données hébergées en France
          </motion.p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="fonctionnalites" className="py-24 px-6 bg-[#fafafa]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-emerald-600 mb-3">Fonctionnalités</p>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold tracking-tight">
              Tout ce qu&apos;il vous faut,<br />rien de superflu.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.07, ease }}
                className="bg-white rounded-2xl p-6 border border-[#f0f0f0] hover:border-emerald-200 hover:shadow-sm transition-all"
              >
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-[16px] font-bold mb-2">{f.title}</h3>
                <p className="text-[14px] text-[#737373] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-emerald-600 mb-3">Démarrage</p>
            <h2 className="text-[clamp(1.8rem,4vw,3rem)] font-extrabold tracking-tight">
              Opérationnel en 10 minutes.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1, ease }}
                className="flex flex-col"
              >
                <span className="text-[40px] font-black text-emerald-100 leading-none mb-4">{s.num}</span>
                <h3 className="text-[17px] font-bold mb-2">{s.title}</h3>
                <p className="text-[14px] text-[#737373] leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING PREVIEW ── */}
      <section className="py-16 px-6 bg-[#fafafa]">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-white rounded-3xl border border-[#f0f0f0] p-10 shadow-sm">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-emerald-600 mb-3">Tarif</p>
            <div className="text-[56px] font-black tracking-tight leading-none mb-2">
              39€<span className="text-[24px] text-[#737373] font-normal">/mois</span>
            </div>
            <p className="text-[15px] text-[#737373] mb-6">Par point de vente · Sans engagement · Données en France</p>
            <ul className="text-left space-y-3 mb-8">
              {[
                "Nombre de transactions illimité",
                "Synchronisation cloud incluse",
                "Mises à jour automatiques",
                "Support par email 7j/7",
                "Données hébergées en France (RGPD)",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-[14px]">
                  <span className="w-5 h-5 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0">✓</span>
                  {item}
                </li>
              ))}
            </ul>
            <a
              href="#demande"
              className="block w-full py-3.5 bg-[#059669] text-white text-[15px] font-semibold rounded-xl hover:bg-emerald-700 transition-all text-center"
            >
              Rejoindre l&apos;accès anticipé
            </a>
            <p className="text-[12px] text-[#a3a3a3] mt-3">Accès gratuit pendant la bêta · Prix définitif annoncé au lancement</p>
          </div>
        </div>
      </section>

      {/* ── FORM ── */}
      <section id="demande" className="py-24 px-6">
        <div className="max-w-xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] font-bold tracking-[0.15em] uppercase text-emerald-600 mb-3">Accès anticipé</p>
            <h2 className="text-[clamp(1.8rem,4vw,2.5rem)] font-extrabold tracking-tight mb-4">
              Rejoignez la bêta.
            </h2>
            <p className="text-[15px] text-[#737373]">
              Accès gratuit pendant la phase de test. Nous vous contactons sous 24h.
            </p>
          </div>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center"
            >
              <div className="text-4xl mb-4">✅</div>
              <h3 className="text-[20px] font-bold mb-2">Demande reçue !</h3>
              <p className="text-[14px] text-[#737373]">
                Nous vous enverrons vos accès à <strong>{form.email}</strong> dans les 24h.
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-[#f0f0f0] rounded-2xl p-8">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[13px] font-medium text-[#0a0a0a] block mb-1.5">Votre prénom *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="Marie"
                    className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-[14px] focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 transition"
                  />
                </div>
                <div>
                  <label className="text-[13px] font-medium text-[#0a0a0a] block mb-1.5">Votre commerce *</label>
                  <input
                    type="text"
                    required
                    value={form.business}
                    onChange={e => setForm(p => ({ ...p, business: e.target.value }))}
                    placeholder="Boulangerie Martin"
                    className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-[14px] focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 transition"
                  />
                </div>
              </div>
              <div>
                <label className="text-[13px] font-medium text-[#0a0a0a] block mb-1.5">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="marie@boulangerie.fr"
                  className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-[14px] focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 transition"
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-[#0a0a0a] block mb-1.5">Téléphone</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="06 12 34 56 78"
                  className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-lg text-[14px] focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/10 transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#059669] text-white text-[15px] font-semibold rounded-xl hover:bg-emerald-700 transition-all disabled:opacity-60 mt-2"
              >
                {loading ? "Envoi en cours..." : "Demander l'accès anticipé →"}
              </button>
              <p className="text-[12px] text-[#a3a3a3] text-center">Aucune carte bancaire requise. Réponse sous 24h.</p>
            </form>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-[#f5f5f5] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[13px] text-[#a3a3a3]">
          <p>© 2026 Caissio by WebConceptor · Données hébergées en France</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-[#0a0a0a] transition-colors">webconceptor.fr</Link>
            <Link href="/confidentialite" className="hover:text-[#0a0a0a] transition-colors">Confidentialité</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
