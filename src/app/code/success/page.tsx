"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { motion } from "framer-motion";

function SuccessContent() {
  const searchParams = useSearchParams();
  const code = searchParams.get("c");

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
        <h1 className="text-3xl font-bold tracking-tight mb-4">Paiement reussi !</h1>
        <p className="text-[#737373] text-lg mb-2">Merci pour votre confiance.</p>
        <p className="text-[#737373] mb-8">
          Nous lancons la creation de votre site <strong className="text-[#0a0a0a]">maintenant</strong>.
        </p>

        <div className="bg-[#fafafa] border border-[#f5f5f5] rounded-2xl p-6 mb-8 text-left">
          <p className="text-[13px] font-semibold text-[#0066ff] tracking-wider uppercase mb-4">Prochaines etapes</p>
          <div className="space-y-3 text-[14px] text-[#525252]">
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#0066ff] text-white rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0">1</span>
              <span>Nous achetons votre nom de domaine sous 24h</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#0066ff] text-white rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0">2</span>
              <span>Votre site est finalise (delai quelques minutes ouvres)</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-6 h-6 bg-[#0066ff] text-white rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0">3</span>
              <span>Mise en ligne sur votre domaine + email de confirmation</span>
            </div>
          </div>
        </div>

        <p className="text-[13px] text-[#a3a3a3] mb-6">
          Un email de confirmation vient d&apos;etre envoye. Vous pouvez suivre l&apos;avancement de votre projet dans votre espace.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={code ? `/code?c=${code}` : "/code"}
            className="px-6 py-3 bg-[#0a0a0a] text-white text-[14px] font-medium rounded-full hover:bg-[#262626] transition-colors"
          >
            Suivre mon projet
          </Link>
          <Link
            href="/"
            className="px-6 py-3 border border-[#e5e5e5] text-[#525252] text-[14px] font-medium rounded-full hover:border-[#0a0a0a] hover:text-[#0a0a0a] transition-all"
          >
            Retour accueil
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
