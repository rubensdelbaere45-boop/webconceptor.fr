"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function MerciContent() {
  const params = useSearchParams();
  const agents = params.get("agents")?.split(",") ?? [];

  const ICONS: Record<string, string> = {
    chatbot: "🤖", reputation: "⭐", devis: "📝", contenu: "📱", fidelisation: "💌",
  };
  const NAMES: Record<string, string> = {
    chatbot: "Agent Chatbot", reputation: "Agent Réputation",
    devis: "Agent Devis", contenu: "Agent Contenu", fidelisation: "Agent Fidélisation",
  };

  return (
    <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center">
        <div className="text-7xl mb-6 animate-bounce">🎉</div>

        <h1 className="text-3xl font-black text-white mb-3">
          Vos agents sont en route !
        </h1>
        <p className="text-slate-400 mb-8 text-lg">
          Vous allez recevoir un email dans <strong className="text-white">moins de 60 secondes</strong> avec
          tout ce qu&apos;il faut pour activer vos agents.
        </p>

        {agents.length > 0 && (
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-8 text-left">
            <p className="text-slate-400 text-sm mb-4 font-medium">Agents commandés :</p>
            <div className="space-y-3">
              {agents.map((id) => (
                <div key={id} className="flex items-center gap-3">
                  <span className="text-2xl">{ICONS[id] ?? "🤖"}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">{NAMES[id] ?? id}</p>
                    <p className="text-green-400 text-xs">✓ En cours de livraison</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-5 mb-8 text-left">
          <p className="font-semibold text-violet-300 mb-2 text-sm">📧 Vérifiez votre boîte email</p>
          <p className="text-slate-400 text-sm">
            Si vous ne voyez rien dans 5 minutes, vérifiez vos spams ou contactez-nous :{" "}
            <a href="mailto:contact@klyora.fr" className="text-violet-400 hover:underline">
              contact@klyora.fr
            </a>
          </p>
        </div>

        <a
          href="https://klyora.fr/agentconceptor"
          className="text-slate-500 text-sm hover:text-slate-300 transition-colors"
        >
          ← Retour au store
        </a>
      </div>
    </div>
  );
}

export default function MerciPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a14]" />}>
      <MerciContent />
    </Suspense>
  );
}
