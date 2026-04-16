"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ══════════════════════════════════════════
   OPTIONS
   ══════════════════════════════════════════ */

const activites = [
  "Restaurant / Café",
  "Cabinet médical",
  "Cabinet juridique",
  "Architecte / Designer",
  "Artisan / Bâtiment",
  "Commerce / Boutique",
  "Consultant / Coach",
  "Hôtel / Hébergement",
  "Photographe / Créatif",
  "Services aux entreprises",
  "Association",
  "Autre",
];

const objectifs = [
  "Attirer de nouveaux clients",
  "Présenter mes services",
  "Prendre des rendez-vous en ligne",
  "Vendre des produits",
  "Montrer mon portfolio",
  "Développer ma notoriété",
  "Référencement Google (SEO)",
];

const pages = [
  { id: "accueil", label: "Accueil", required: true },
  { id: "apropos", label: "À propos" },
  { id: "services", label: "Services / Prestations" },
  { id: "tarifs", label: "Tarifs" },
  { id: "portfolio", label: "Portfolio / Réalisations" },
  { id: "equipe", label: "Équipe" },
  { id: "temoignages", label: "Témoignages" },
  { id: "blog", label: "Blog / Actualités" },
  { id: "faq", label: "FAQ" },
  { id: "contact", label: "Contact", required: true },
];

const fonctionnalites = [
  "Formulaire de contact",
  "Prise de rendez-vous en ligne",
  "Galerie photo",
  "Newsletter",
  "Intégration Google Maps",
  "Avis clients",
  "Réseaux sociaux",
  "Boutique en ligne",
  "Espace membre",
  "Multilingue (FR/EN)",
];

const styles = [
  { id: "elegant", label: "Élégant", desc: "Classique, premium, intemporel" },
  { id: "moderne", label: "Moderne", desc: "Minimal, épuré, contemporain" },
  { id: "colore", label: "Coloré", desc: "Vivant, dynamique, créatif" },
  { id: "sombre", label: "Sombre", desc: "Dark mode, haut de gamme" },
  { id: "professionnel", label: "Corporate", desc: "Sérieux, institutionnel" },
  { id: "pas_preference", label: "Sans préférence", desc: "Faites-moi des propositions" },
];

const couleurs = [
  "Neutres (noir, blanc, gris)",
  "Bleu professionnel",
  "Vert / naturel",
  "Rouge / orange",
  "Couleurs de ma marque",
  "À définir ensemble",
];

const timelines = [
  { id: "asap", label: "Dès que possible" },
  { id: "1mois", label: "Dans 1 mois" },
  { id: "3mois", label: "Dans 3 mois" },
  { id: "flexible", label: "Flexible" },
];

const budgets = [
  { id: "<500", label: "Moins de 500 €" },
  { id: "500-1000", label: "500 — 1 000 €" },
  { id: "1000-2000", label: "1 000 — 2 000 €" },
  { id: ">2000", label: "Plus de 2 000 €" },
  { id: "a_definir", label: "À définir" },
];

const contactTimes = [
  { id: "matin", label: "Le matin (9h-12h)" },
  { id: "apresmidi", label: "L'après-midi (12h-18h)" },
  { id: "soir", label: "En soirée (18h-20h)" },
  { id: "nimporte", label: "Peu importe" },
];

/* ══════════════════════════════════════════
   TYPES & VARIANTS
   ══════════════════════════════════════════ */

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

const ease = [0.16, 1, 0.3, 1] as const;

/* ══════════════════════════════════════════
   SCORE CIRCLE (audit)
   ══════════════════════════════════════════ */

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

/* ══════════════════════════════════════════
   REUSABLE UI
   ══════════════════════════════════════════ */

function SelectCard({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border-2 transition-all ${
        selected ? "border-[#0066ff] bg-blue-50/40" : "border-[#eeeeee] hover:border-[#d1d1d1] bg-white"
      }`}
    >
      {children}
    </button>
  );
}

function Checkbox({ checked, onChange, label, disabled }: { checked: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`w-full flex items-center gap-3 p-3.5 rounded-lg border-2 transition-all text-left ${
        disabled ? "border-[#eeeeee] bg-[#fafafa] cursor-not-allowed opacity-60" :
        checked ? "border-[#0066ff] bg-blue-50/40" : "border-[#eeeeee] hover:border-[#d1d1d1] bg-white"
      }`}
    >
      <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-all ${
        checked ? "border-[#0066ff] bg-[#0066ff]" : "border-[#d1d1d1]"
      }`}>
        {checked && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        )}
      </div>
      <span className="text-[14px] font-medium text-[#0a0a0a]">{label}</span>
    </button>
  );
}

function Input({ label, required, ...props }: { label: string; required?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-[13px] font-medium text-[#525252] block mb-1.5">
        {label} {required && <span className="text-[#0066ff]">*</span>}
      </label>
      <input
        {...props}
        className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff] transition-colors"
      />
    </div>
  );
}

function Textarea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="text-[13px] font-medium text-[#525252] block mb-1.5">{label}</label>
      <textarea
        {...props}
        className="w-full px-4 py-3 border border-[#e5e5e5] rounded-xl text-[14px] resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff] transition-colors"
      />
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════ */

export default function DemandePage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [auditData, setAuditData] = useState<AuditData | null>(null);
  const [auditError, setAuditError] = useState("");

  const [form, setForm] = useState({
    // Step 0
    has_site: false,
    site_url: "",

    // Step 1 - Activité
    activite: "",
    activite_autre: "",
    nom_entreprise: "",
    ville: "",
    annees_activite: "",

    // Step 2 - Objectifs
    objectifs: [] as string[],
    cible: "",

    // Step 3 - Pages & fonctionnalités
    pages: ["accueil", "contact"] as string[],
    fonctionnalites: [] as string[],

    // Step 4 - Contenu & design
    a_logo: "",
    a_contenu: "",
    a_photos: "",
    style: "",
    couleurs: "",
    exemples: "",

    // Step 5 - Technique
    a_domaine: "",
    domaine_nom: "",
    veut_emails: "",
    interesse_serenite: "",
    timeline: "",

    // Step 6 - Coordonnées
    nom: "",
    email: "",
    telephone: "",
    budget: "",
    meilleur_moment: "",
    message_final: "",
  });

  const totalSteps = 7;

  const goNext = () => { setDirection(1); setStep((s) => Math.min(s + 1, totalSteps - 1)); };
  const goBack = () => { setDirection(-1); setStep((s) => Math.max(s - 1, 0)); };

  const canNext = () => {
    if (step === 0) return true;
    if (step === 1) return form.activite !== "" && form.nom_entreprise !== "";
    if (step === 2) return form.objectifs.length > 0;
    if (step === 3) return form.pages.length >= 2;
    if (step === 4) return form.style !== "";
    if (step === 5) return form.timeline !== "";
    if (step === 6) return form.nom !== "" && form.email !== "";
    return false;
  };

  const toggleArrayItem = (key: "objectifs" | "pages" | "fonctionnalites", item: string) => {
    setForm((f) => {
      const arr = f[key];
      return { ...f, [key]: arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item] };
    });
  };

  const handleAudit = async () => {
    if (!form.site_url.trim()) return;
    setAuditing(true); setAuditError(""); setAuditData(null);
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
        setAuditData(await res.json());
      }
    } catch {
      setAuditError("Impossible de joindre le serveur d'analyse.");
    }
    setAuditing(false);
  };

  const buildDetails = () => {
    const activite = form.activite === "Autre" ? form.activite_autre || "Autre" : form.activite;
    const lines = [
      "═══ ENTREPRISE ═══",
      `Activité : ${activite}`,
      `Nom de l'entreprise : ${form.nom_entreprise}`,
      form.ville ? `Ville : ${form.ville}` : "",
      form.annees_activite ? `Années d'activité : ${form.annees_activite}` : "",
      "",
      "═══ OBJECTIFS ═══",
      ...form.objectifs.map((o) => `• ${o}`),
      form.cible ? `\nCible : ${form.cible}` : "",
      "",
      "═══ PAGES SOUHAITÉES ═══",
      ...form.pages.map((p) => `• ${pages.find((x) => x.id === p)?.label || p}`),
      "",
      "═══ FONCTIONNALITÉS ═══",
      ...(form.fonctionnalites.length ? form.fonctionnalites.map((f) => `• ${f}`) : ["Aucune sélectionnée"]),
      "",
      "═══ CONTENU & DESIGN ═══",
      `Logo : ${form.a_logo || "—"}`,
      `Contenu texte : ${form.a_contenu || "—"}`,
      `Photos : ${form.a_photos || "—"}`,
      `Style : ${form.style || "—"}`,
      `Couleurs : ${form.couleurs || "—"}`,
      form.exemples ? `\nExemples de sites aimés :\n${form.exemples}` : "",
      "",
      "═══ TECHNIQUE ═══",
      `Nom de domaine : ${form.a_domaine || "—"}${form.domaine_nom ? ` (${form.domaine_nom})` : ""}`,
      `Emails @domaine : ${form.veut_emails || "—"}`,
      `Formule Sérénité (50€/mois) : ${form.interesse_serenite || "—"}`,
      `Timeline : ${timelines.find((t) => t.id === form.timeline)?.label || "—"}`,
      "",
      "═══ CONTACT ═══",
      `Téléphone : ${form.telephone || "—"}`,
      `Budget : ${budgets.find((b) => b.id === form.budget)?.label || "—"}`,
      `Meilleur moment pour contact : ${contactTimes.find((t) => t.id === form.meilleur_moment)?.label || "—"}`,
      form.message_final ? `\nMessage :\n${form.message_final}` : "",
    ];
    return lines.filter((l) => l !== "").join("\n");
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
          activite: form.activite === "Autre" ? form.activite_autre || "Autre" : form.activite,
          besoin,
          has_site: form.has_site,
          details: buildDetails(),
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
          transition={{ duration: 0.6, ease }}
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
          <h1 className="text-3xl font-bold tracking-tight mb-4">Demande envoyée</h1>
          <p className="text-[#737373] text-lg mb-2">Merci pour votre confiance.</p>
          <p className="text-[#737373] mb-10">
            Nous étudions votre projet et vous recontactons sous <strong className="text-[#0a0a0a]">48 heures maximum</strong>.
          </p>
          <Link href="/" className="px-6 py-3 bg-[#0a0a0a] text-white text-[14px] font-medium rounded-full hover:bg-[#262626] transition-colors">
            Retour à l&apos;accueil
          </Link>
        </motion.div>
      </div>
    );
  }

  const stepTitles = [
    "Avez-vous déjà un site ?",
    "Votre entreprise",
    "Vos objectifs",
    "Structure du site",
    "Contenu & design",
    "Technique & planning",
    "Vos coordonnées",
  ];

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

      <div className="flex-1 flex flex-col items-center px-6 py-12">
        {/* Progress */}
        <div className="w-full max-w-lg mb-12">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] text-[#a3a3a3] font-medium uppercase tracking-wider">
              Étape {step + 1} / {totalSteps}
            </span>
            <span className="text-[12px] text-[#737373] font-medium">{stepTitles[step]}</span>
          </div>
          <div className="h-1 bg-[#f5f5f5] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#0066ff] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.4, ease }}
            />
          </div>
        </div>

        {/* Steps */}
        <div className="w-full max-w-lg overflow-hidden">
          <AnimatePresence mode="wait" custom={direction}>

            {/* ═══ Step 0: Has site? ═══ */}
            {step === 0 && (
              <motion.div key="s0" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }}>
                <h2 className="text-[28px] font-bold tracking-tight mb-2">Avez-vous déjà un site internet ?</h2>
                <p className="text-[#737373] text-[15px] mb-8">Nous pouvons créer votre site de zéro ou améliorer l&apos;existant.</p>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <SelectCard selected={!form.has_site} onClick={() => { setForm({ ...form, has_site: false, site_url: "" }); setAuditData(null); }}>
                    <div className="p-5">
                      <p className="text-[15px] font-semibold text-[#0a0a0a] mb-1">Non, créer un site</p>
                      <p className="text-[12px] text-[#737373]">Je pars de zéro</p>
                    </div>
                  </SelectCard>
                  <SelectCard selected={form.has_site} onClick={() => setForm({ ...form, has_site: true })}>
                    <div className="p-5">
                      <p className="text-[15px] font-semibold text-[#0a0a0a] mb-1">Oui, améliorer mon site</p>
                      <p className="text-[12px] text-[#737373]">J&apos;ai déjà un site à refondre</p>
                    </div>
                  </SelectCard>
                </div>

                {form.has_site && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.3 }} className="overflow-hidden">
                    <div className="pt-2">
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
                          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          onClick={handleAudit}
                          disabled={!form.site_url.trim() || auditing}
                          className="px-5 py-3 bg-[#0066ff] text-white text-[13px] font-semibold rounded-xl hover:bg-[#0052cc] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                        >
                          {auditing ? "Analyse…" : "Analyser"}
                        </motion.button>
                      </div>

                      {auditing && (
                        <div className="bg-[#fafafa] border border-[#eeeeee] rounded-xl p-8 text-center">
                          <div className="w-8 h-8 border-2 border-[#e5e5e5] border-t-[#0066ff] rounded-full animate-spin mx-auto mb-4" />
                          <p className="text-[14px] text-[#737373]">Analyse en cours…</p>
                          <p className="text-[12px] text-[#a3a3a3] mt-1">10 à 20 secondes environ.</p>
                        </div>
                      )}

                      {auditError && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                          <p className="text-[13px] text-red-600">{auditError}</p>
                        </div>
                      )}

                      {auditData && !auditing && (
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="bg-[#fafafa] border border-[#eeeeee] rounded-xl p-6">
                          <p className="text-[13px] font-semibold text-[#0a0a0a] mb-5">Résultat de l&apos;analyse</p>
                          <div className="flex justify-center gap-6 mb-6">
                            <ScoreCircle score={auditData.performance} label="Performance" />
                            <ScoreCircle score={auditData.seo} label="SEO" />
                            <ScoreCircle score={auditData.accessibility} label="Accessibilité" />
                          </div>
                          <div className="flex items-center justify-center gap-4 text-[12px] text-[#737373] mb-5">
                            <span>Chargement : <strong className="text-[#0a0a0a]">{auditData.loadTime}</strong></span>
                            <span className="w-px h-3 bg-[#e5e5e5]" />
                            <span>Mobile : <strong className={auditData.mobileFriendly ? "text-emerald-600" : "text-red-500"}>{auditData.mobileFriendly ? "OK" : "Non adapté"}</strong></span>
                          </div>
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
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* ═══ Step 1: Entreprise ═══ */}
            {step === 1 && (
              <motion.div key="s1" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }}>
                <h2 className="text-[28px] font-bold tracking-tight mb-2">Parlez-nous de votre entreprise</h2>
                <p className="text-[#737373] text-[15px] mb-8">Ces informations nous aident à cadrer votre projet.</p>

                <div className="space-y-5">
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-2">
                      Votre secteur d&apos;activité <span className="text-[#0066ff]">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {activites.map((a) => (
                        <button
                          key={a}
                          type="button"
                          onClick={() => setForm({ ...form, activite: a })}
                          className={`p-3 rounded-lg border-2 text-left text-[13px] font-medium transition-all ${
                            form.activite === a ? "border-[#0066ff] bg-blue-50/40 text-[#0a0a0a]" : "border-[#eeeeee] text-[#525252] hover:border-[#d1d1d1]"
                          }`}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                    {form.activite === "Autre" && (
                      <input
                        type="text"
                        value={form.activite_autre}
                        onChange={(e) => setForm({ ...form, activite_autre: e.target.value })}
                        placeholder="Précisez votre activité"
                        className="w-full mt-3 px-4 py-3 border border-[#e5e5e5] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff]"
                      />
                    )}
                  </div>

                  <Input
                    label="Nom de votre entreprise ou marque"
                    required
                    type="text"
                    value={form.nom_entreprise}
                    onChange={(e) => setForm({ ...form, nom_entreprise: e.target.value })}
                    placeholder="Ex : Maison Dupont"
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label="Ville"
                      type="text"
                      value={form.ville}
                      onChange={(e) => setForm({ ...form, ville: e.target.value })}
                      placeholder="Lyon"
                    />
                    <Input
                      label="Années d'activité"
                      type="text"
                      value={form.annees_activite}
                      onChange={(e) => setForm({ ...form, annees_activite: e.target.value })}
                      placeholder="Ex : 5 ans"
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ Step 2: Objectifs ═══ */}
            {step === 2 && (
              <motion.div key="s2" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }}>
                <h2 className="text-[28px] font-bold tracking-tight mb-2">Que voulez-vous accomplir ?</h2>
                <p className="text-[#737373] text-[15px] mb-8">Sélectionnez tout ce qui correspond à vos objectifs.</p>

                <div className="grid gap-2 mb-6">
                  {objectifs.map((o) => (
                    <Checkbox
                      key={o}
                      checked={form.objectifs.includes(o)}
                      onChange={() => toggleArrayItem("objectifs", o)}
                      label={o}
                    />
                  ))}
                </div>

                <Textarea
                  label="Qui est votre clientèle cible ?"
                  value={form.cible}
                  onChange={(e) => setForm({ ...form, cible: e.target.value })}
                  placeholder="Ex : particuliers 30-50 ans en région lyonnaise, entreprises locales..."
                  rows={3}
                />
              </motion.div>
            )}

            {/* ═══ Step 3: Pages & Fonctionnalités ═══ */}
            {step === 3 && (
              <motion.div key="s3" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }}>
                <h2 className="text-[28px] font-bold tracking-tight mb-2">Structure de votre site</h2>
                <p className="text-[#737373] text-[15px] mb-8">Quelles pages et fonctionnalités souhaitez-vous ?</p>

                <div className="mb-6">
                  <label className="text-[13px] font-medium text-[#525252] block mb-2">Pages souhaitées</label>
                  <div className="grid grid-cols-2 gap-2">
                    {pages.map((p) => (
                      <Checkbox
                        key={p.id}
                        checked={form.pages.includes(p.id)}
                        onChange={() => toggleArrayItem("pages", p.id)}
                        label={p.label}
                        disabled={p.required}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-medium text-[#525252] block mb-2">Fonctionnalités souhaitées</label>
                  <div className="grid grid-cols-2 gap-2">
                    {fonctionnalites.map((f) => (
                      <Checkbox
                        key={f}
                        checked={form.fonctionnalites.includes(f)}
                        onChange={() => toggleArrayItem("fonctionnalites", f)}
                        label={f}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ Step 4: Contenu & Design ═══ */}
            {step === 4 && (
              <motion.div key="s4" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }}>
                <h2 className="text-[28px] font-bold tracking-tight mb-2">Contenu &amp; design</h2>
                <p className="text-[#737373] text-[15px] mb-8">Qu&apos;avez-vous déjà et que souhaitez-vous ?</p>

                <div className="space-y-5">
                  {/* Content availability */}
                  <div className="grid gap-3">
                    <div>
                      <label className="text-[13px] font-medium text-[#525252] block mb-2">Avez-vous un logo ?</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Oui, je l'ai", "Non, à créer", "En cours"].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setForm({ ...form, a_logo: v })}
                            className={`py-2.5 px-3 rounded-lg border text-[13px] font-medium transition-all ${
                              form.a_logo === v ? "border-[#0066ff] bg-blue-50/40 text-[#0066ff]" : "border-[#e5e5e5] text-[#525252] hover:border-[#d1d1d1]"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[13px] font-medium text-[#525252] block mb-2">Avez-vous le contenu texte ?</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Oui, prêt", "Partiel", "Non, à rédiger"].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setForm({ ...form, a_contenu: v })}
                            className={`py-2.5 px-3 rounded-lg border text-[13px] font-medium transition-all ${
                              form.a_contenu === v ? "border-[#0066ff] bg-blue-50/40 text-[#0066ff]" : "border-[#e5e5e5] text-[#525252] hover:border-[#d1d1d1]"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-[13px] font-medium text-[#525252] block mb-2">Avez-vous des photos ?</label>
                      <div className="grid grid-cols-3 gap-2">
                        {["Oui, je les ai", "Quelques-unes", "Non, à produire"].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setForm({ ...form, a_photos: v })}
                            className={`py-2.5 px-3 rounded-lg border text-[13px] font-medium transition-all ${
                              form.a_photos === v ? "border-[#0066ff] bg-blue-50/40 text-[#0066ff]" : "border-[#e5e5e5] text-[#525252] hover:border-[#d1d1d1]"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Style */}
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-2">
                      Style visuel souhaité <span className="text-[#0066ff]">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {styles.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setForm({ ...form, style: s.id })}
                          className={`p-3 rounded-lg border-2 text-left transition-all ${
                            form.style === s.id ? "border-[#0066ff] bg-blue-50/40" : "border-[#eeeeee] hover:border-[#d1d1d1]"
                          }`}
                        >
                          <p className="text-[13px] font-semibold text-[#0a0a0a]">{s.label}</p>
                          <p className="text-[11px] text-[#737373] mt-0.5">{s.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Couleurs */}
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-2">Palette de couleurs</label>
                    <div className="grid grid-cols-2 gap-2">
                      {couleurs.map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setForm({ ...form, couleurs: c })}
                          className={`py-2.5 px-3 rounded-lg border text-[13px] font-medium text-left transition-all ${
                            form.couleurs === c ? "border-[#0066ff] bg-blue-50/40 text-[#0066ff]" : "border-[#e5e5e5] text-[#525252] hover:border-[#d1d1d1]"
                          }`}
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    label="Exemples de sites qui vous plaisent (optionnel)"
                    value={form.exemples}
                    onChange={(e) => setForm({ ...form, exemples: e.target.value })}
                    placeholder="Collez les URLs ou nommez des sites dont vous aimez le style..."
                    rows={3}
                  />
                </div>
              </motion.div>
            )}

            {/* ═══ Step 5: Technique & Planning ═══ */}
            {step === 5 && (
              <motion.div key="s5" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }}>
                <h2 className="text-[28px] font-bold tracking-tight mb-2">Technique &amp; planning</h2>
                <p className="text-[#737373] text-[15px] mb-8">Les derniers détails pratiques.</p>

                <div className="space-y-5">
                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-2">Avez-vous déjà un nom de domaine ?</label>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {["Oui", "Non", "À acheter"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setForm({ ...form, a_domaine: v })}
                          className={`py-2.5 px-3 rounded-lg border text-[13px] font-medium transition-all ${
                            form.a_domaine === v ? "border-[#0066ff] bg-blue-50/40 text-[#0066ff]" : "border-[#e5e5e5] text-[#525252] hover:border-[#d1d1d1]"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                    {form.a_domaine === "Oui" && (
                      <input
                        type="text"
                        value={form.domaine_nom}
                        onChange={(e) => setForm({ ...form, domaine_nom: e.target.value })}
                        placeholder="www.monentreprise.fr"
                        className="w-full px-4 py-2.5 border border-[#e5e5e5] rounded-xl text-[14px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff]"
                      />
                    )}
                  </div>

                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-2">Souhaitez-vous des emails @votredomaine ?</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["Oui", "Non"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setForm({ ...form, veut_emails: v })}
                          className={`py-2.5 px-3 rounded-lg border text-[13px] font-medium transition-all ${
                            form.veut_emails === v ? "border-[#0066ff] bg-blue-50/40 text-[#0066ff]" : "border-[#e5e5e5] text-[#525252] hover:border-[#d1d1d1]"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-2">
                      Formule Sérénité (50 €/mois) — maintenance, mises à jour illimitées, hébergement
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {["Oui, intéressé", "Non merci", "À voir"].map((v) => (
                        <button
                          key={v}
                          type="button"
                          onClick={() => setForm({ ...form, interesse_serenite: v })}
                          className={`py-2.5 px-3 rounded-lg border text-[13px] font-medium transition-all ${
                            form.interesse_serenite === v ? "border-[#0066ff] bg-blue-50/40 text-[#0066ff]" : "border-[#e5e5e5] text-[#525252] hover:border-[#d1d1d1]"
                          }`}
                        >
                          {v}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-2">
                      Quand aimeriez-vous lancer votre site ? <span className="text-[#0066ff]">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {timelines.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setForm({ ...form, timeline: t.id })}
                          className={`py-2.5 px-3 rounded-lg border text-[13px] font-medium transition-all ${
                            form.timeline === t.id ? "border-[#0066ff] bg-blue-50/40 text-[#0066ff]" : "border-[#e5e5e5] text-[#525252] hover:border-[#d1d1d1]"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ═══ Step 6: Coordonnées ═══ */}
            {step === 6 && (
              <motion.div key="s6" custom={direction} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.4, ease }}>
                <h2 className="text-[28px] font-bold tracking-tight mb-2">Vos coordonnées</h2>
                <p className="text-[#737373] text-[15px] mb-8">Nous vous recontactons sous 48h maximum.</p>

                <div className="space-y-5">
                  <Input
                    label="Nom complet"
                    required
                    type="text"
                    value={form.nom}
                    onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    placeholder="Jean Dupont"
                  />
                  <Input
                    label="Email professionnel"
                    required
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="vous@entreprise.fr"
                  />
                  <Input
                    label="Téléphone"
                    type="tel"
                    value={form.telephone}
                    onChange={(e) => setForm({ ...form, telephone: e.target.value })}
                    placeholder="06 12 34 56 78"
                  />

                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-2">Budget envisagé</label>
                    <div className="grid grid-cols-2 gap-2">
                      {budgets.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => setForm({ ...form, budget: b.id })}
                          className={`py-2.5 px-3 rounded-lg border text-[13px] font-medium transition-all ${
                            form.budget === b.id ? "border-[#0066ff] bg-blue-50/40 text-[#0066ff]" : "border-[#e5e5e5] text-[#525252] hover:border-[#d1d1d1]"
                          }`}
                        >
                          {b.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[13px] font-medium text-[#525252] block mb-2">Meilleur moment pour vous contacter</label>
                    <div className="grid grid-cols-2 gap-2">
                      {contactTimes.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setForm({ ...form, meilleur_moment: t.id })}
                          className={`py-2.5 px-3 rounded-lg border text-[13px] font-medium transition-all ${
                            form.meilleur_moment === t.id ? "border-[#0066ff] bg-blue-50/40 text-[#0066ff]" : "border-[#e5e5e5] text-[#525252] hover:border-[#d1d1d1]"
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    label="Un message ou une précision ? (optionnel)"
                    value={form.message_final}
                    onChange={(e) => setForm({ ...form, message_final: e.target.value })}
                    placeholder="Tout ce que vous voulez nous dire de plus..."
                    rows={3}
                  />
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="w-full max-w-lg flex items-center justify-between mt-10">
          {step > 0 ? (
            <button onClick={goBack} className="text-[14px] text-[#737373] hover:text-[#0a0a0a] transition-colors">← Retour</button>
          ) : (
            <div />
          )}
          {step < totalSteps - 1 ? (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={goNext}
              disabled={!canNext()}
              className="px-6 py-3 bg-[#0a0a0a] text-white text-[14px] font-medium rounded-full hover:bg-[#262626] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Continuer →
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={handleSubmit}
              disabled={!canNext() || sending}
              className="px-6 py-3 bg-[#0066ff] text-white text-[14px] font-semibold rounded-full hover:bg-[#0052cc] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {sending ? "Envoi…" : "Envoyer ma demande"}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}
