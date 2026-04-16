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

const statusLabels: Record<string, { label: string; color: string }> = {
  sent: { label: "En attente de paiement", color: "bg-yellow-100 text-yellow-700" },
  paid: { label: "Payé", color: "bg-green-100 text-green-700" },
  in_progress: { label: "En cours de création", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Livré", color: "bg-green-100 text-green-700" },
  viewed: { label: "Consulté", color: "bg-gray-100 text-gray-700" },
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

  // Check if user is authenticated on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setAuthed(!!data.user);
      setCheckingAuth(false);

      // If arriving with ?c=XXXXXX (from post-login redirect), auto-load
      const urlCode = searchParams.get("c");
      if (urlCode && urlCode.length === 6) {
        setCode(urlCode);
        setConfirmed(true);
        lookupCode(urlCode);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lookupCode = async (theCode: string) => {
    setLoading(true);
    setInputError("");
    try {
      const res = await fetch(`/api/projects?code=${theCode}`);
      if (!res.ok) {
        setInputError("Code introuvable. Vérifiez le code reçu par email.");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setProject(data);
    } catch {
      setInputError("Erreur de connexion. Réessayez.");
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setInputError("Le code doit contenir 6 chiffres.");
      return;
    }
    lookupCode(code);
  };

  const handleConfirmYes = () => {
    if (authed) {
      setConfirmed(true);
    } else {
      // Save code for redirect after login
      sessionStorage.setItem("pendingCode", code);
      router.push("/auth/login");
    }
  };

  const handleBack = () => {
    setProject(null);
    setConfirmed(false);
    setCode("");
  };

  // ── Loading auth check ──
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  // ── State 3: Full project details (only if authed and confirmed) ──
  if (project && confirmed && authed) {
    const priceFormatted = (project.price_cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
    const st = statusLabels[project.status] || statusLabels.draft;

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

          {project.description && (
            <p className="text-gray-500 mb-8 leading-relaxed">{project.description}</p>
          )}

          <div className="bg-white border border-gray-100 rounded-xl p-8 mb-6">
            <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100">
              <span className="text-sm text-gray-500 font-medium">Montant total</span>
              <span className="text-3xl font-bold tracking-tight text-black">{priceFormatted}</span>
            </div>

            {project.contract_text && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Détails du contrat</h3>
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
                Voir l&apos;aperçu du site →
              </a>
            )}

            {project.stripe_payment_link && project.status === "sent" && (
              <a
                href={project.stripe_payment_link}
                target="_blank"
                rel="noopener"
                className="block w-full py-3 bg-black text-white rounded-lg text-sm font-medium text-center hover:bg-gray-800 transition"
              >
                Payer {priceFormatted} →
              </a>
            )}

            {project.status === "paid" && (
              <div className="w-full py-3 bg-green-50 text-green-700 rounded-lg text-sm font-medium text-center">
                ✓ Paiement reçu — votre site est en cours de création
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

  // ── State 2: Project preview + "C'est bien vous ?" ──
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
              <h1 className="text-2xl font-bold tracking-tight mb-2">Code trouvé !</h1>
              <p className="text-[#737373] text-[14px]">Confirmez que c&apos;est bien votre projet.</p>
            </div>

            <div className="bg-[#fafafa] border border-[#f5f5f5] rounded-xl p-6 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${st.color}`}>{st.label}</span>
                <span className="text-[11px] text-[#a3a3a3]">Code : {project.code}</span>
              </div>
              <h2 className="text-xl font-bold tracking-tight mb-1">{project.title}</h2>
              {project.client_name && (
                <p className="text-[13px] text-[#737373]">
                  Projet pour <strong className="text-[#0a0a0a]">{project.client_name}</strong>
                </p>
              )}
            </div>

            <p className="text-center text-[14px] font-medium text-[#0a0a0a] mb-5">
              Ce projet vous appartient-il ?
            </p>

            <div className="grid grid-cols-2 gap-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleConfirmYes}
                className="py-3.5 bg-[#0066ff] text-white text-[14px] font-semibold rounded-xl hover:bg-[#0052cc] transition-colors"
              >
                Oui, c&apos;est moi
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleBack}
                className="py-3.5 border border-[#e5e5e5] text-[#525252] text-[14px] font-medium rounded-xl hover:border-[#a3a3a3] transition-colors"
              >
                Non, retour
              </motion.button>
            </div>

            {!authed && (
              <p className="text-center text-[12px] text-[#a3a3a3] mt-5">
                Vous devrez vous connecter ou créer un compte pour accéder aux détails complets.
              </p>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  // ── State 1: Code input ──
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
              <p className="text-[#737373] text-[14px]">
                Saisissez le code à 6 chiffres reçu par email.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="bg-[#fafafa] border border-[#f5f5f5] rounded-2xl p-8">
              <label className="text-[13px] font-medium text-[#525252] block mb-2 text-center">Code projet</label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setInputError("");
                }}
                className="w-full px-4 py-4 border border-[#e5e5e5] rounded-xl text-center text-3xl font-bold tracking-[0.3em] bg-white text-[#0a0a0a] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#0066ff] placeholder:text-[#e5e5e5]"
                placeholder="000000"
                autoFocus
                inputMode="numeric"
              />
              {inputError && <p className="text-red-500 text-[12px] mt-2 text-center">{inputError}</p>}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={code.length !== 6 || loading}
                className="w-full mt-5 py-3 bg-[#0066ff] text-white rounded-full text-[14px] font-semibold hover:bg-[#0052cc] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Vérification..." : "Valider le code"}
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
