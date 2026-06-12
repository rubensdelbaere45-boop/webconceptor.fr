"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function SuccessContent() {
  const params = useSearchParams();
  const slug = params.get("slug");

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fdfaf5] to-[#f9f5ef] flex items-center justify-center px-6 py-12">
      <div className="max-w-xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-emerald-500 rounded-full flex items-center justify-center animate-pulse">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4.5 12.75l6 6 9-13.5" />
            </svg>
          </div>

          <h1 className="font-serif text-3xl font-semibold text-[#1a1310] mb-3" style={{ fontFamily: "Georgia, serif" }}>
            Paiement reçu, merci !
          </h1>

          <p className="text-[#4a4340] leading-relaxed mb-8">
            Nous avons bien reçu votre commande. <br />
            Votre site web sera en ligne <strong className="text-[#c19a56]">dans les 5 à 7 jours</strong>.
          </p>

          <div className="bg-[#fff7ed] border border-[#fbbf24] rounded-lg p-5 text-left mb-8">
            <p className="font-semibold text-[#1a1310] mb-2 text-sm uppercase tracking-wider">Ce qui arrive maintenant :</p>
            <ol className="text-sm text-[#4a4340] space-y-2 list-decimal pl-5">
              <li>Vous recevez un email de confirmation avec votre reçu (Stripe)</li>
              <li>Je vous contacte sous 24h pour valider les derniers détails (logo, couleurs, photos spécifiques)</li>
              <li>Je finalise votre site, je déploie, je vous envoie l'URL</li>
              <li>Vous validez → mise en ligne officielle</li>
            </ol>
          </div>

          <div className="text-left bg-[#f9f5ef] rounded-lg p-5 mb-8">
            <p className="text-sm text-[#1a1310] font-semibold mb-2">Une question ? Contactez-moi :</p>
            <p className="text-sm text-[#4a4340] mb-1">
              📧 <a href="mailto:contact@webconceptor.fr" className="text-[#c19a56] font-semibold hover:underline">contact@webconceptor.fr</a>
            </p>
            <p className="text-sm text-[#4a4340]">
              📞 <a href="tel:+33635592471" className="text-[#c19a56] font-semibold hover:underline">06 35 59 24 71</a>
            </p>
            <p className="text-xs text-[#8b7e6e] italic mt-2">
              Merci de signaler le nom de votre enseigne pour retrouver votre dossier rapidement.
            </p>
          </div>

          {slug && (
            <Link
              href={`/prospects/${slug}`}
              className="text-sm text-[#c19a56] hover:underline"
            >
              ← Revoir votre maquette
            </Link>
          )}
        </div>

        <p className="text-center text-xs text-[#8b7e6e] mt-6">
          Tom Bauer · Fondateur Klyora Sites · <a href="https://webconceptor.fr" className="hover:text-[#c19a56]">webconceptor.fr</a>
        </p>
      </div>
    </div>
  );
}

export default function ProspectSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fdfaf5]" />}>
      <SuccessContent />
    </Suspense>
  );
}
