"use client";

import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";

interface Project {
  id: string;
  code: string;
  title: string;
  description: string;
  status: string;
  price_cents: number;
  preview_url: string;
  contract_text: string;
  stripe_payment_link: string;
  site_url: string;
  client_name: string;
  client_email: string;
}

interface DomainCheck {
  domain: string;
  tld: string;
  available: boolean;
  price: number;
  priceCents: number;
  currency: string;
  duration: string;
}

interface BuyerInfo {
  nom: string;
  adresse: string;
  cp: string;
  ville: string;
  telephone: string;
  email: string;
}

const TLDS = ["fr", "com", "eu", "net", "org", "info", "shop", "store", "bio"];

const statusLabels: Record<string, { label: string; color: string }> = {
  sent: { label: "En attente de paiement", color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Paye — en cours de creation", color: "bg-green-100 text-green-700" },
  in_progress: { label: "En cours de creation", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Livre", color: "bg-green-100 text-green-700" },
  viewed: { label: "Consulte", color: "bg-gray-100 text-gray-700" },
  draft: { label: "Brouillon", color: "bg-gray-100 text-gray-500" },
};

function CodePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [code, setCode] = useState("");
  const [inputError, setInputError] = useState("");
  const [loading, setLoading] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [showCheckout, setShowCheckout] = useState(false);
  const [domainName, setDomainName] = useState("");
  const [domainTld, setDomainTld] = useState("fr");
  const [domainCheck, setDomainCheck] = useState<DomainCheck | null>(null);
  const [domainError, setDomainError] = useState("");
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [wantsSerenite, setWantsSerenite] = useState(false);
  const [buyerInfo, setBuyerInfo] = useState<BuyerInfo>({
    nom: "", adresse: "", cp: "", ville: "", telephone: "", email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      setCheckingAuth(false);

      const urlCode = searchParams.get("c");
      if (urlCode && urlCode.length === 6) {
        setCode(urlCode);
        setConfirmed(true);
        lookupCode(urlCode);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (project && authed) {
      setBuyerInfo((b) => ({
        ...b,
        nom: b.nom || project.client_name || "",
        email: b.email || project.client_email || "",
      }));
    }
  }, [project, authed]);

  const lookupCode = async (theCode: string) => {
    setLoading(true); setInputError("");
    try {
      const res = await fetch(`/api/projects?code=${theCode}`);
      if (!res.ok) {
        setInputError("Code introuvable. Verifiez le code recu par email.");
        setLoading(false);
        return;
      }
      setProject(await res.json());
    } catch {
      setInputError("Erreur de connexion. Reessayez.");
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) { setInputError("Le code doit contenir 6 chiffres."); return; }
    lookupCode(code);
  };

  const handleConfirmYes = () => {
    if (authed) setConfirmed(true);
    else { sessionStorage.setItem("pendingCode", code); router.push("/auth/login"); }
  };

  const handleBack = () => {
    setProject(null); setConfirmed(false); setCode(""); setShowCheckout(false);
  };

  const handleCheckDomain = async () => {
    if (!domainName.trim()) return;
    setCheckingDomain(true); setDomainError(""); setDomainCheck(null);
    const fullDomain = `${domainName.trim().toLowerCase()}.${domainTld}`;
    try {
      const res = await fetch("/api/domain-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullDomain }),
      });
      const data = await res.json();
      if (!res.ok) setDomainError(data.error || "Erreur de verification.");
      else setDomainCheck(data);
    } catch {
      setDomainError("Impossible de verifier. Reessayez.");
    }
    setCheckingDomain(false);
  };

  const handlePayment = async () => {
    if (!project || !domainCheck || !domainCheck.available) return;
    if (!buyerInfo.nom || !buyerInfo.adresse || !buyerInfo.cp || !buyerInfo.ville || !buyerInfo.email) {
      setCheckoutError("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSubmitting(true); setCheckoutError("");
    try {
      const res = await fetch("/api/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: project.code,
          domain: domainCheck.domain,
          domainPriceCents: domainCheck.priceCents,
          wantsSerenite,
          buyerInfo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setCheckoutError(data.error || "Erreur de creation du paiement.");
        setSubmitting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setCheckoutError("Erreur de connexion. Reessayez.");
      setSubmitting(false);
    }
  };

  // ── Loading auth check ──
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  // ══════════════════════════════════════════
  // STATE: Full project details (authed + confirmed)
  // ══════════════════════════════════════════
  if (project && confirmed && authed) {
    const basePriceFormatted = (project.price_cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
    const domainPriceFormatted = domainCheck ? domainCheck.price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" }) : null;
    const totalCents = project.price_cents + (domainCheck?.priceCents || 0) + (wantsSerenite ? 5000 : 0);
    const totalFormatted = (totalCents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
    const st = statusLabels[project.status] || statusLabels.draft;
    const canPay = project.status === "sent" || project.status === "viewed";

    // ── When showCheckout is true : premium experience with iframe background ──
    if (showCheckout && canPay) {
      return (
        <div className="min-h-screen relative overflow-hidden">
          {/* Iframe background (blurred preview of the site) */}
          {project.preview_url && (
            <div className="fixed inset-0 z-0 pointer-events-none">
              <iframe
                src={project.preview_url}
                className="w-full h-full border-0"
                style={{ filter: "blur(20px) brightness(0.3) saturate(1.4)", transform: "scale(1.1)" }}
                loading="lazy"
                aria-hidden="true"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a]/85 via-[#0a0a0a]/70 to-[#0a0a0a]/90" />
            </div>
          )}

          {/* Solid fallback if no preview */}
          {!project.preview_url && (
            <div className="fixed inset-0 z-0 bg-gradient-to-br from-[#0a0a0a] via-[#1a1a2e] to-[#0a0a0a]" />
          )}

          {/* Decorative orbs */}
          <div className="fixed top-[10%] left-[10%] w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="fixed bottom-[10%] right-[10%] w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none z-0" />

          {/* Content */}
          <div className="relative z-10">
            {/* Nav */}
            <nav className="h-14 px-6 flex items-center justify-between backdrop-blur-xl bg-white/5 border-b border-white/10">
              <Link href="/" className="flex items-center gap-2">
                <span className="w-6 h-6 bg-[#0066ff] rounded-md flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">W</span>
                </span>
                <span className="text-[14px] font-semibold tracking-tight text-white">Web<span className="text-[#0066ff]">Conceptor</span></span>
              </Link>
              <button
                onClick={() => setShowCheckout(false)}
                className="text-sm text-white/60 hover:text-white transition flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                Retour
              </button>
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="max-w-2xl mx-auto px-6 py-10 pb-24"
            >
              {/* Header */}
              <div className="text-center mb-10">
                <p className="text-[11px] font-bold text-[#0066ff] tracking-[0.2em] uppercase mb-3">Configuration</p>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
                  Finalisez votre site
                </h1>
                <p className="text-white/60 text-[15px]">
                  3 dernieres etapes avant la mise en ligne de <strong className="text-white">{project.title}</strong>
                </p>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center gap-2 mb-8 max-w-sm mx-auto">
                <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${domainCheck?.available ? "bg-[#0066ff]" : "bg-white/10"}`} />
                <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${domainCheck?.available ? "bg-[#0066ff]/60" : "bg-white/10"}`} />
                <div className={`flex-1 h-1 rounded-full transition-all duration-500 ${buyerInfo.nom && buyerInfo.email ? "bg-[#0066ff]/60" : "bg-white/10"}`} />
              </div>

              <div className="space-y-4">
                {/* ─── Etape 1 : Domaine ─── */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 p-6"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <span className="w-7 h-7 rounded-full bg-[#0066ff] text-white text-[12px] font-bold flex items-center justify-center">1</span>
                    <div>
                      <h3 className="text-[15px] font-semibold text-white">Votre nom de domaine</h3>
                      <p className="text-[12px] text-white/50">Inclus pour 1 an, prix selon extension</p>
                    </div>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={domainName}
                      onChange={(e) => { setDomainName(e.target.value.replace(/[^a-z0-9-]/gi, "")); setDomainCheck(null); }}
                      placeholder="monentreprise"
                      className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066ff] focus:bg-white/10 transition"
                    />
                    <select
                      value={domainTld}
                      onChange={(e) => { setDomainTld(e.target.value); setDomainCheck(null); }}
                      className="px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-[14px] text-white focus:outline-none focus:border-[#0066ff] transition"
                    >
                      {TLDS.map((t) => <option key={t} value={t} className="bg-[#0a0a0a]">.{t}</option>)}
                    </select>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCheckDomain}
                      disabled={!domainName.trim() || checkingDomain}
                      className="px-5 py-3 bg-[#0066ff] text-white text-[13px] font-semibold rounded-xl hover:bg-[#0052cc] transition disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                    >
                      {checkingDomain ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : "Verifier"}
                    </motion.button>
                  </div>

                  {domainError && (
                    <p className="text-[12px] text-red-300 mt-2">{domainError}</p>
                  )}

                  <AnimatePresence>
                    {domainCheck && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        className={`mt-3 p-4 rounded-xl border ${domainCheck.available ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}
                      >
                        {domainCheck.available ? (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                </svg>
                              </div>
                              <div>
                                <p className="text-[13px] font-semibold text-emerald-200">{domainCheck.domain}</p>
                                <p className="text-[11px] text-emerald-400/80">Disponible, reservable maintenant</p>
                              </div>
                            </div>
                            <span className="text-[18px] font-extrabold text-emerald-100">
                              {domainCheck.price.toLocaleString("fr-FR", { style: "currency", currency: "EUR" })}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 bg-red-500/20 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-[13px] font-semibold text-red-200">{domainCheck.domain}</p>
                              <p className="text-[11px] text-red-400/80">Deja pris — essayez une autre extension ou un autre nom</p>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* ─── Etape 2 : Serenite ─── */}
                <AnimatePresence>
                  {domainCheck?.available && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className={`rounded-2xl backdrop-blur-xl border-2 p-6 transition-all cursor-pointer ${
                        wantsSerenite
                          ? "bg-[#0066ff]/20 border-[#0066ff]"
                          : "bg-white/[0.06] border-white/10 hover:border-white/20"
                      }`}
                      onClick={() => setWantsSerenite(!wantsSerenite)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex items-center gap-3 flex-shrink-0">
                          <span className="w-7 h-7 rounded-full bg-[#0066ff] text-white text-[12px] font-bold flex items-center justify-center">2</span>
                          <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition ${wantsSerenite ? "bg-[#0066ff] border-[#0066ff]" : "border-white/30"}`}>
                            {wantsSerenite && (
                              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                            )}
                          </div>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-baseline gap-2 mb-1">
                            <h3 className="text-[15px] font-semibold text-white">Formule Serenite</h3>
                            <span className="text-[11px] font-bold text-[#0066ff] bg-[#0066ff]/20 px-2 py-0.5 rounded">Recommande</span>
                          </div>
                          <p className="text-[13px] text-white/70 leading-relaxed mb-2">
                            Votre site <strong className="text-white">reste vivant</strong>. Un email suffit pour modifier vos horaires, ajouter des promos ou des actualites. Hebergement, sauvegardes, SSL et support 24h inclus.
                          </p>
                          <p className="text-[15px] font-extrabold text-[#0066ff]">
                            50 €/mois <span className="text-[11px] font-normal text-white/40">sans engagement, resiliable a tout moment</span>
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ─── Etape 3 : Coordonnees ─── */}
                <AnimatePresence>
                  {domainCheck?.available && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4, delay: 0.2 }}
                      className="rounded-2xl bg-white/[0.06] backdrop-blur-xl border border-white/10 p-6"
                    >
                      <div className="flex items-center gap-3 mb-5">
                        <span className="w-7 h-7 rounded-full bg-[#0066ff] text-white text-[12px] font-bold flex items-center justify-center">3</span>
                        <div>
                          <h3 className="text-[15px] font-semibold text-white">Proprietaire du domaine</h3>
                          <p className="text-[12px] text-white/50">Ces infos enregistrent le domaine a votre nom</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="text-[12px] font-medium text-white/70 block mb-1.5">Nom complet / Raison sociale <span className="text-red-400">*</span></label>
                          <input type="text" value={buyerInfo.nom} onChange={(e) => setBuyerInfo({ ...buyerInfo, nom: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066ff] focus:bg-white/10 transition"
                            placeholder="Jean Dupont / SARL Dupont" />
                        </div>
                        <div>
                          <label className="text-[12px] font-medium text-white/70 block mb-1.5">Adresse <span className="text-red-400">*</span></label>
                          <input type="text" value={buyerInfo.adresse} onChange={(e) => setBuyerInfo({ ...buyerInfo, adresse: e.target.value })}
                            className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066ff] focus:bg-white/10 transition"
                            placeholder="12 rue de la Republique" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-[12px] font-medium text-white/70 block mb-1.5">CP <span className="text-red-400">*</span></label>
                            <input type="text" value={buyerInfo.cp} onChange={(e) => setBuyerInfo({ ...buyerInfo, cp: e.target.value })}
                              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066ff] focus:bg-white/10 transition"
                              placeholder="75001" />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[12px] font-medium text-white/70 block mb-1.5">Ville <span className="text-red-400">*</span></label>
                            <input type="text" value={buyerInfo.ville} onChange={(e) => setBuyerInfo({ ...buyerInfo, ville: e.target.value })}
                              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066ff] focus:bg-white/10 transition"
                              placeholder="Paris" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[12px] font-medium text-white/70 block mb-1.5">Telephone</label>
                            <input type="tel" value={buyerInfo.telephone} onChange={(e) => setBuyerInfo({ ...buyerInfo, telephone: e.target.value })}
                              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066ff] focus:bg-white/10 transition"
                              placeholder="06 12 34 56 78" />
                          </div>
                          <div>
                            <label className="text-[12px] font-medium text-white/70 block mb-1.5">Email <span className="text-red-400">*</span></label>
                            <input type="email" value={buyerInfo.email} onChange={(e) => setBuyerInfo({ ...buyerInfo, email: e.target.value })}
                              className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066ff] focus:bg-white/10 transition"
                              placeholder="vous@entreprise.fr" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ─── Recap & Pay ─── */}
                <AnimatePresence>
                  {domainCheck?.available && (
                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      className="rounded-2xl bg-gradient-to-br from-[#0066ff] to-[#4f46e5] p-6 text-white relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                      <div className="relative">
                        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-white/70 mb-3">Recapitulatif</p>

                        <div className="space-y-2.5 pb-4 border-b border-white/20">
                          <div className="flex justify-between items-center text-[14px]">
                            <span className="text-white/80">Site web {project.title}</span>
                            <span className="font-semibold">{basePriceFormatted}</span>
                          </div>
                          <div className="flex justify-between items-center text-[14px]">
                            <span className="text-white/80 font-mono text-[13px]">{domainCheck.domain}</span>
                            <span className="font-semibold">{domainPriceFormatted}</span>
                          </div>
                          {wantsSerenite && (
                            <div className="flex justify-between items-center text-[14px]">
                              <span className="text-white/80">Formule Serenite (1er mois)</span>
                              <span className="font-semibold">50,00 €</span>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-baseline mt-4 mb-5">
                          <div>
                            <p className="text-[11px] font-bold tracking-wider uppercase text-white/60">Total a payer</p>
                            {wantsSerenite && <p className="text-[10px] text-white/50 mt-0.5">Puis 50 €/mois</p>}
                          </div>
                          <span className="text-[32px] font-extrabold tracking-tight">{totalFormatted}</span>
                        </div>

                        {checkoutError && (
                          <div className="bg-red-500/20 border border-red-500/40 text-red-100 text-[13px] p-3 rounded-lg mb-4">
                            {checkoutError}
                          </div>
                        )}

                        <motion.button
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={handlePayment}
                          disabled={submitting}
                          className="w-full py-3.5 bg-white text-[#0066ff] rounded-full text-[15px] font-bold hover:bg-white/95 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl"
                        >
                          {submitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-blue-300 border-t-[#0066ff] rounded-full animate-spin" />
                              Redirection vers Stripe...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.95 7.66L11.17 15.5l-4.12-4.12a.75.75 0 011.06-1.06l3.06 3.05 4.72-4.72a.75.75 0 011.06 1.06z"/>
                              </svg>
                              Payer {totalFormatted} — Paiement securise
                            </>
                          )}
                        </motion.button>
                        <p className="text-[11px] text-white/60 text-center mt-3 flex items-center justify-center gap-1.5">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6z"/>
                          </svg>
                          Paiement securise Stripe — Chiffrement SSL
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      );
    }

    // ── Default view (contract display before clicking "Configurer") ──
    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="h-14 px-6 flex items-center justify-between border-b border-[#f5f5f5] bg-white">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-6 h-6 bg-[#0066ff] rounded-md flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">W</span>
            </span>
            <span className="text-[14px] font-semibold tracking-tight">Web<span className="text-[#0066ff]">Conceptor</span></span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-black transition">Mon espace</Link>
        </nav>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto px-6 py-12"
        >
          <div className="flex items-center gap-3 mb-8">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${st.color}`}>{st.label}</span>
            <span className="text-sm text-gray-400">Code : {project.code}</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-4 text-black">{project.title}</h1>
          {project.description && <p className="text-gray-500 mb-8 leading-relaxed">{project.description}</p>}

          <div className="bg-white border border-gray-100 rounded-xl p-8 mb-6">
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
              <span className="text-sm text-gray-500 font-medium">Prix du site</span>
              <span className="text-3xl font-bold tracking-tight text-black">{basePriceFormatted}</span>
            </div>

            {project.contract_text && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Details du contrat</h3>
                <p className="text-sm text-gray-500 leading-relaxed whitespace-pre-line">{project.contract_text}</p>
              </div>
            )}

            {project.preview_url && (
              <a
                href={project.preview_url}
                target="_blank"
                rel="noopener"
                className="block w-full py-3 border border-gray-200 rounded-lg text-sm font-medium text-center text-black hover:bg-gray-50 transition mb-3"
              >
                Voir l&apos;apercu du site →
              </a>
            )}

            {canPay && (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => setShowCheckout(true)}
                className="block w-full py-3.5 bg-[#0066ff] text-white rounded-lg text-sm font-semibold text-center hover:bg-[#0052cc] transition"
              >
                Configurer mon site et payer →
              </motion.button>
            )}

            {project.status === "paid" && (
              <div className="w-full py-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium text-center">
                ✓ Paiement recu — votre site est en cours de creation
              </div>
            )}

            {project.status === "completed" && project.site_url && (
              <a
                href={project.site_url}
                target="_blank"
                rel="noopener"
                className="block w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-medium text-center hover:bg-blue-700 transition"
              >
                Voir mon site en ligne →
              </a>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // STATE: Preview + confirmation
  // ══════════════════════════════════════════
  if (project && !confirmed) {
    const st = statusLabels[project.status] || statusLabels.draft;
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <nav className="h-14 px-6 flex items-center justify-between border-b border-[#f5f5f5]">
          <Link href="/" className="flex items-center gap-2">
            <span className="w-6 h-6 bg-[#0066ff] rounded-md flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">W</span>
            </span>
            <span className="text-[14px] font-semibold tracking-tight">Web<span className="text-[#0066ff]">Conceptor</span></span>
          </Link>
        </nav>
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-md"
          >
            <div className="text-center mb-6">
              <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-2">Code trouve !</h1>
              <p className="text-[#737373] text-[14px]">Confirmez que c&apos;est bien votre projet.</p>
            </div>
            <div className="bg-[#fafafa] border border-[#f5f5f5] rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.color}`}>{st.label}</span>
                <span className="text-[11px] text-[#a3a3a3]">Code : {project.code}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-1">{project.title}</h2>
              {project.client_name && (
                <p className="text-[13px] text-[#737373]">Projet pour <strong className="text-[#0a0a0a]">{project.client_name}</strong></p>
              )}
            </div>
            <p className="text-center text-[14px] font-medium text-[#0a0a0a] mb-5">Ce projet vous appartient-il ?</p>
            <div className="grid grid-cols-2 gap-3">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleConfirmYes}
                className="py-3.5 bg-[#0066ff] text-white text-[14px] font-semibold rounded-xl hover:bg-[#0052cc] transition">
                Oui, c&apos;est moi
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleBack}
                className="py-3.5 border border-[#e5e5e5] text-[#525252] text-[14px] font-medium rounded-xl hover:border-[#a3a3a3] transition">
                Non, retour
              </motion.button>
            </div>
            {!authed && (
              <p className="text-center text-[12px] text-[#a3a3a3] mt-5">
                Vous devrez vous connecter ou creer un compte pour acceder aux details complets.
              </p>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════
  // STATE: Code input
  // ══════════════════════════════════════════
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <nav className="h-14 px-6 flex items-center justify-between border-b border-[#f5f5f5]">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 bg-[#0066ff] rounded-md flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">W</span>
          </span>
          <span className="text-[14px] font-semibold tracking-tight">Web<span className="text-[#0066ff]">Conceptor</span></span>
        </Link>
        <Link href="/" className="text-[13px] text-[#737373] hover:text-[#0a0a0a] transition-colors">Retour</Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm"
          >
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold tracking-tight mb-2">J&apos;ai un code</h1>
              <p className="text-[#737373] text-[14px]">Saisissez le code a 6 chiffres recu par email.</p>
            </div>
            <form onSubmit={handleSubmit} className="bg-[#fafafa] border border-[#f5f5f5] rounded-2xl p-8">
              <label className="text-[13px] font-medium text-[#525252] block mb-2 text-center">Code projet</label>
              <input type="text" maxLength={6} value={code}
                onChange={(e) => { setCode(e.target.value.replace(/\D/g, "").slice(0, 6)); setInputError(""); }}
                className="w-full px-4 py-4 border border-[#e5e5e5] rounded-xl text-center text-3xl font-bold tracking-[0.3em] bg-white text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff] placeholder:text-[#e5e5e5]"
                placeholder="000000" autoFocus inputMode="numeric" />
              {inputError && <p className="text-red-500 text-[12px] mt-2 text-center">{inputError}</p>}
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                disabled={code.length !== 6 || loading}
                className="w-full mt-5 py-3 bg-[#0066ff] text-white rounded-full text-[14px] font-semibold hover:bg-[#0052cc] transition disabled:opacity-40 disabled:cursor-not-allowed">
                {loading ? "Verification..." : "Valider le code"}
              </motion.button>
            </form>
            <p className="text-center text-[13px] text-[#a3a3a3] mt-6">
              Pas de code ?{" "}
              <Link href="/demande" className="text-[#0066ff] font-medium hover:underline">Demandez un devis</Link>
            </p>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default function CodePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <CodePageContent />
    </Suspense>
  );
}
