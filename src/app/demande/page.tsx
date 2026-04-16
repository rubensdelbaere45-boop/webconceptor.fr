"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Options ── */
const activites = [
  { id: "restaurant", label: "Restaurant", icon: "🍽" },
  { id: "avocat", label: "Avocat", icon: "⚖️" },
  { id: "medecin", label: "Médecin", icon: "🩺" },
  { id: "architecte", label: "Architecte", icon: "📐" },
  { id: "artisan", label: "Artisan", icon: "🔧" },
  { id: "commercant", label: "Commerçant", icon: "🏪" },
  { id: "autre", label: "Autre", icon: "✦" },
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

interface AuditData {
  performance: number;
  seo: number;
  accessibility: number;
  loadTime: string;
  mobileFriendly: boolean;
  issues: string[];
}

const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction > 0 ? -300 : 300, opacity: 0 }),
};

function ScoreCircle({ score, label }: { score: number; label: string }) {
  const color = score >= 90 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#f5f5f5" strokeWidth="6" />
          <circle cx="40" cy="40" r="36" fill="none" stroke={color} strokeWidth="6"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-1000"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold" style={{ color }}>
          {score}
        </span>
      </div>
      <span className="text-[12px] text-[#737373] font-medium">{label}</span>
    </div>
  );
}

export default function DemandePage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [auditError, setAuditError] = useState("");

  const [form, setForm] = useState({
    has_site: false,
    site_url: "",
    activite: "",
    activite_autre: "",
    details: "",
    style: "",
    exemples: "",
    nom: "",
    email: "",
    telephone: "",
    budget: "",
  });

  const totalSteps = 5;

  const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, totalSteps - 1)); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  const canNext = () => {
    if (step === 0) return true; // always can proceed (has_site is optional)
    if (step === 1) return form.activite !== "";
    if (step === 2) return true; // details is optional
    if (step === 3) return form.style !== "";
    if (step === 4) return form.nom !== "" && form.email !== "";
    return false;
  };

  const handleAudit = async () => {
    if (!form.site_url.trim()) return;
    setAuditing(true);
    setAuditError("");
    setAuditData(null);
    try {
      const res = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: form.site_url }),
      });
      if (!res.ok) {
        const err = await res.json();
        setAuditError(err.error || "Erreur lors de l'analyse.");
      } else {
        const data = await res.json();
        setAuditData(data);
      }
    } catch {
      setAuditError("Impossible de joindre le serveur d'analyse.");
    }
    setAuditing(false);
  };

  const handleSubmit = async () => {
    setSending(true);
    try {
      const besoin = form.has_site ? "refondre" : "creer";
      const auditStr = auditData ? JSON.stringify(auditData) : "";
      await fetch("/api/demandes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activite: form.activite === "autre" ? form.activite_autre || "Autre" : form.activite,
          besoin,
          has_site: form.has_site,
          details: form.details,
          style: form.style,
          exemples: form.exemples,
          nom: form.nom,
          email: form.email,
          telephone: form.telephone,
          budget: form.budget,
          site_url: form.site_url,
          audit_results: auditStr,
        }),
      });
      setDone(true);
    } catch {
      alert("Erreur. Veuillez réessayer.");
    }
    setSending(false);
  };

  // ── Confirmation screen ──
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

            {/* ── Step 0: Avez-vous déjà un site ? ── */}
            {step === 0 && (
              <motion.div key="step0" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Avez-vous déjà un site internet ?</h2>
                <p className="text-[#737373] text-[15px] mb-8">Nous pouvons créer votre site ou améliorer l&apos;existant.</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => { setForm({ ...form, has_site: false, site_url: "" }); setAuditData(null); }}
                    className={`p-5 rounded-xl border-2 text-center transition-all ${!form.has_site ? "border-[#0066ff] bg-blue-50/50" : "border-[#f5f5f5] hover:border-[#e5e5e5]"}`}
                  >
                    <span className="text-2xl block mb-2">🆕</span>
                    <span className="text-[14px] font-medium block">Non, créer un site</span>
                  </button>
                  <button
                    onClick={() => setForm({ ...form, has_site: true })}
                    className={`p-5 rounded-xl border-2 text-center transition-all ${form.has_site ? "border-[#0066ff] bg-blue-50/50" : "border-[#f5f5f5] hover:border-[#e5e5e5]"}`}
                  >
                    <span className="text-2xl block mb-2">🔄</span>
                    <span className="text-[14px] font-medium block">Oui, améliorer mon site</span>
                  </button>
                </div>

                {/* URL input + audit */}
                {form.has_site && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.3 }}>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">L&apos;URL de votre site actuel</label>
                    <div className="flex gap-2 mb-4">
                      <input
                        type="url"
                        value={form.site_url}
                        onChange={(e) => setForm({ ...form, site_url: e.target.value })}
                        placeholder="www.monsite.fr"
                        className="flex-1 px-4 py-3 border border-[#e5e5e5] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff]"
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleAudit}
                        disabled={!form.site_url.trim() || auditing}
                        className="px-4 py-3 bg-[#0066ff] text-white text-[13px] font-semibold rounded-xl hover:bg-[#0052cc] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                      >
                        {auditing ? "Analyse..." : "Analyser"}
                      </motion.button>
                    </div>

                    {/* Audit loading */}
                    {auditing && (
                      <div className="bg-[#fafafa] border border-[#f5f5f5] rounded-xl p-8 text-center">
                        <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0066ff] rounded-full animate-spin mx-auto mb-4" />
                        <p className="text-[14px] text-[#737373]">Analyse en cours...</p>
                        <p className="text-[12px] text-[#a3a3a3] mt-1">Cela peut prendre 10 à 20 secondes.</p>
                      </div>
                    )}

                    {/* Audit error */}
                    {auditError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <p className="text-[13px] text-red-600">{auditError}</p>
                      </div>
                    )}

                    {/* Audit results */}
                    {auditData && !auditing && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="bg-[#fafafa] border border-[#f5f5f5] rounded-xl p-6"
                      >
                        <p className="text-[13px] font-semibold text-[#0a0a0a] mb-5">Résultat de l&apos;analyse</p>

                        {/* Scores */}
                        <div className="flex justify-center gap-6 mb-6">
                          <ScoreCircle score={auditData.performance} label="Performance" />
                          <ScoreCircle score={auditData.seo} label="SEO" />
                          <ScoreCircle score={auditData.accessibility} label="Accessibilité" />
                        </div>

                        {/* Quick stats */}
                        <div className="flex items-center justify-center gap-4 text-[12px] text-[#737373] mb-5">
                          <span>Chargement : <strong className="text-[#0a0a0a]">{auditData.loadTime}</strong></span>
                          <span className="w-px h-3 bg-[#e5e5e5]" />
                          <span>Mobile : <strong className={auditData.mobileFriendly ? "text-emerald-600" : "text-red-500"}>{auditData.mobileFriendly ? "OK" : "Non adapté"}</strong></span>
                        </div>

                        {/* Issues */}
                        {auditData.issues.length > 0 && (
                          <div>
                            <p className="text-[12px] font-semibold text-red-500 mb-3">Problèmes détectés :</p>
                            <div className="space-y-2">
                              {auditData.issues.map((issue, i) => (
                                <div key={i} className="flex items-start gap-2">
                                  <svg className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                  <span className="text-[13px] text-[#525252]">{issue}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="mt-5 pt-4 border-t border-[#e5e5e5]">
                          <p className="text-[12px] text-[#0066ff] font-medium text-center">
                            Nous pouvons corriger tous ces problèmes pour vous.
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ── Step 1: Activité ── */}
            {step === 1 && (
              <motion.div key="step1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
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

            {/* ── Step 2: Projet ── */}
            {step === 2 && (
              <motion.div key="step2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Parlez-nous de votre projet</h2>
                <p className="text-[#737373] text-[15px] mb-8">
                  {form.has_site ? "Qu'aimeriez-vous changer ou améliorer sur votre site actuel ?" : "Décrivez ce que vous imaginez pour votre futur site."}
                </p>
                <textarea
                  value={form.details}
                  onChange={(e) => setForm({ ...form, details: e.target.value })}
                  placeholder={form.has_site ? "Ex : moderniser le design, ajouter un formulaire de contact, améliorer la vitesse..." : "Ex : je veux un site vitrine avec mes services, mes tarifs et un formulaire de contact..."}
                  rows={5}
                  className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff]"
                />
              </motion.div>
            )}

            {/* ── Step 3: Style ── */}
            {step === 3 && (
              <motion.div key="step3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
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

            {/* ── Step 4: Coordonnées ── */}
            {step === 4 && (
              <motion.div key="step4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Vos coordonnées</h2>
                <p className="text-[#737373] text-[15px] mb-8">Pour que nous puissions vous recontacter.</p>
                <div className="space-y-4">
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Nom complet *</label>
                    <input type="text" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })}
                      placeholder="Jean Dupont"
                      className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff]" />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Email *</label>
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="vous@entreprise.fr"
                      className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff]" />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Téléphone</label>
                    <input type="tel" value={form.telephone} onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                      placeholder="06 12 34 56 78"
                      className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff]" />
                  </div>
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-1.5">Budget envisagé</label>
                    <div className="grid grid-cols-2 gap-2">
                      {budgets.map((b) => (
                        <button key={b.id} onClick={() => setForm({ ...form, budget: b.id })}
                          className={`py-2.5 px-3 rounded-lg border text-[13px] font-medium transition-all ${form.budget === b.id ? "border-[#0066ff] bg-blue-50/50 text-[#0066ff]" : "border-[#e5e5e5] text-[#525252] hover:border-[#d5d5d5]"}`}>
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

        {/* Navigation */}
        <div className="w-full max-w-md flex items-center justify-between mt-10">
          {step > 0 ? (
            <button onClick={goBack} className="text-[14px] text-[#737373] hover:text-[#0a0a0a] transition-colors">← Retour</button>
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
