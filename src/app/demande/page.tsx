"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const activites = [
  { id: "restaurant", label: "Restaurant", icon: "🍽" },
  { id: "avocat", label: "Avocat", icon: "⚖️" },
  { id: "medecin", label: "Médecin", icon: "🩺" },
  { id: "architecte", label: "Architecte", icon: "📐" },
  { id: "artisan", label: "Artisan", icon: "🔧" },
  { id: "commercant", label: "Commerçant", icon: "🏪" },
  { id: "autre", label: "Autre", icon: "✦" },
];

const besoins = [
  { id: "creer", label: "Créer un site" },
  { id: "refondre", label: "Refondre mon site" },
  { id: "ne_sais_pas", label: "Je ne sais pas encore" },
];

const styles = [
  { id: "elegant", label: "Élégant / classique" },
  { id: "moderne", label: "Moderne / minimal" },
  { id: "colore", label: "Coloré / dynamique" },
  { id: "pas_preference", label: "Pas de préférence" },
];

const budgets = [
  { id: "<500", label: "Moins de 500 €" },
  { id: "500-1000", label: "500 — 1 000 €" },
  { id: ">1000", label: "Plus de 1 000 €" },
  { id: "a_definir", label: "À définir ensemble" },
];

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

export default function DemandePage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const [form, setForm] = useState({
    activite: "",
    activite_autre: "",
    besoin: "",
    has_site: false,
    details: "",
    style: "",
    exemples: "",
    nom: "",
    email: "",
    telephone: "",
    budget: "",
  });

  const totalSteps = 4;

  const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, totalSteps)); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  const canNext = () => {
    if (step === 0) return form.activite !== "";
    if (step === 1) return form.besoin !== "";
    if (step === 2) return form.style !== "";
    if (step === 3) return form.nom !== "" && form.email !== "";
    return false;
  };

  const handleSubmit = async () => {
    setSending(true);
    try {
      await fetch("/api/demandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activite: form.activite === "autre" ? form.activite_autre || "Autre" : form.activite,
          besoin: form.besoin,
          has_site: form.has_site,
          details: form.details,
          style: form.style,
          exemples: form.exemples,
          nom: form.nom,
          email: form.email,
          telephone: form.telephone,
          budget: form.budget,
        }),
      });
      setDone(true);
    } catch {
      alert("Erreur. Veuillez réessayer.");
    }
    setSending(false);
  };

  // Confirmation screen
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-white">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8"
          >
            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </motion.div>
          <h1 className="text-3xl font-bold tracking-tight mb-4">Formulaire envoyé !</h1>
          <p className="text-[#737373] text-lg mb-2">Merci pour votre confiance.</p>
          <p className="text-[#737373] mb-10">Vous serez recontacté sous <strong className="text-[#0a0a0a]">48 heures maximum</strong>.</p>
          <Link href="/" className="px-6 py-3 bg-[#0a0a0a] text-white text-[14px] font-medium rounded-full hover:bg-[#262626] transition-colors">
            Retour à l&apos;accueil
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="h-16 px-6 flex items-center justify-between border-b border-[#f5f5f5]">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="w-7 h-7 bg-[#0066ff] rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">W</span>
          </span>
          <span className="text-[15px] font-semibold tracking-tight">Web<span className="text-[#0066ff]">Conceptor</span></span>
        </Link>
        <Link href="/" className="text-[13px] text-[#737373] hover:text-[#0a0a0a] transition-colors">Retour</Link>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Progress bar */}
        <div className="w-full max-w-md mb-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] text-[#a3a3a3] font-medium">Étape {step + 1} sur {totalSteps}</span>
            <span className="text-[12px] text-[#a3a3a3]">{Math.round(((step + 1) / totalSteps) * 100)}%</span>
          </div>
          <div className="h-1 bg-[#f5f5f5] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#0066ff] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="w-full max-w-md overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>
            {/* Step 0: Activite */}
            {step === 0 && (
              <motion.div
                key="step0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-2xl font-bold tracking-tight mb-2">Quelle est votre activité ?</h2>
                <p className="text-[#737373] text-[15px] mb-8">Sélectionnez votre secteur pour personnaliser votre site.</p>
                <div className="grid grid-cols-2 gap-3">
                  {activites.map((a) => (
                    <button
                      key={a.id}
                      onClick={() => setForm({ ...form, activite: a.id })}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${form.activite === a.id ? "border-[#0066ff] bg-blue-50/50" : "border-[#f5f5f5] hover:border-[#e5e5e5]"}`}
                    >
                      <span className="text-2xl mb-2 block">{a.icon}</span>
                      <span className="text-[14px] font-medium">{a.label}</span>
                    </button>
                  ))}
                </div>
                {form.activite === "autre" && (
                  <input
                    type="text"
                    value={form.activite_autre}
                    onChange={(e) => setForm({ ...form, activite_autre: e.target.value })}
                    placeholder="Votre activité..."
                    className="w-full mt-4 px-4 py-3 border border-[#e5e5e5] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff]"
                  />
                )}
              </motion.div>
            )}

            {/* Step 1: Besoin */}
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-2xl font-bold tracking-tight mb-2">Que recherchez-vous ?</h2>
                <p className="text-[#737373] text-[15px] mb-8">Dites-nous en plus sur votre projet.</p>
                <div className="space-y-3 mb-6">
                  {besoins.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setForm({ ...form, besoin: b.id })}
                      className={`w-full p-4 rounded-xl border-2 text-left text-[14px] font-medium transition-all ${form.besoin === b.id ? "border-[#0066ff] bg-blue-50/50" : "border-[#f5f5f5] hover:border-[#e5e5e5]"}`}
                    >
                      {b.label}
                    </button>
                  ))}
                </div>
                <label className="flex items-center gap-3 mb-6 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.has_site}
                    onChange={(e) => setForm({ ...form, has_site: e.target.checked })}
                    className="w-5 h-5 rounded border-[#e5e5e5] text-[#0066ff] focus:ring-[#0066ff]"
                  />
                  <span className="text-[14px] text-[#525252]">J&apos;ai déjà un site web</span>
                </label>
                <textarea
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  placeholder="Décrivez votre projet en quelques mots (optionnel)..."
                  rows={3}
                  className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff]"
                />
              </motion.div>
            )}

            {/* Step 2: Style */}
            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-2xl font-bold tracking-tight mb-2">Quel style vous parle ?</h2>
                <p className="text-[#737373] text-[15px] mb-8">Choisissez l&apos;ambiance qui correspond à votre image.</p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {styles.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setForm({ ...form, style: s.id })}
                      className={`p-4 rounded-xl border-2 text-left text-[14px] font-medium transition-all ${form.style === s.id ? "border-[#0066ff] bg-blue-50/50" : "border-[#f5f5f5] hover:border-[#e5e5e5]"}`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <textarea
                  value={form.exemples}
                  onChange={(e) => setForm({ ...form, exemples: e.target.value })}
                  placeholder="Des exemples de sites qui vous plaisent ? (optionnel)"
                  rows={2}
                  className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff]"
                />
              </motion.div>
            )}

            {/* Step 3: Coordonnees */}
            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                <h2 className="text-2xl font-bold tracking-tight mb-2">Vos coordonnées</h2>
                <p className="text-[#737373] text-[15px] mb-8">Pour que nous puissions vous recontacter.</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Nom complet *</label>
                    <input
                      type="text"
                      value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      placeholder="Jean Dupont"
                      className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff]"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Email *</label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="vous@entreprise.fr"
                      className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff]"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Téléphone</label>
                    <input
                      type="tel"
                      value={form.telephone}
                      onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                      placeholder="06 12 34 56 78"
                      className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff]"
                    />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Budget envisagé</label>
                    <div className="grid grid-cols-2 gap-2">
                      {budgets.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => setForm({ ...form, budget: b.id })}
                          className={`py-2.5 px-3 rounded-lg border text-[13px] font-medium transition-all ${form.budget === b.id ? "border-[#0066ff] bg-blue-50/50 text-[#0066ff]" : "border-[#e5e5e5] text-[#525252] hover:border-[#d5d5d5]"}`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="w-full max-w-md flex items-center justify-between mt-10">
          {step > 0 ? (
            <button onClick={goBack} className="text-[14px] text-[#737373] hover:text-[#0a0a0a] transition-colors">
              ← Retour
            </button>
          ) : (
            <div />
          )}
          {step < totalSteps - 1 ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={goNext}
              disabled={!canNext()}
              className="px-6 py-3 bg-[#0a0a0a] text-white text-[14px] font-medium rounded-full hover:bg-[#262626] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continuer →
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!canNext() || sending}
              className="px-6 py-3 bg-[#0066ff] text-white text-[14px] font-medium rounded-full hover:bg-[#0052cc] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {sending ? "Envoi..." : "Envoyer ma demande"}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
