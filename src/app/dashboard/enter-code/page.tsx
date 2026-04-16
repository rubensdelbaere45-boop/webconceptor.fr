"use client";

import Link from "next/link";
import { useState } from "react";

export default function EnterCodePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Le code doit contenir 6 chiffres.");
      return;
    }
    // TODO: Validate code against Supabase
    setError("Code invalide. Vérifiez le code reçu par email.");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-lg font-bold tracking-tight inline-flex items-center gap-2 mb-6">
            <span className="w-2 h-2 bg-blue-600 rounded-sm" />Web<span className="text-blue-600">Conceptor</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mt-4">Entrer un code</h1>
          <p className="text-sm text-gray-500 mt-2">
            Saisissez le code à 6 chiffres reçu par email pour accéder à votre projet.
          </p>
        </div>
        <div className="bg-white border border-black/6 rounded-xl p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-2">Code projet</label>
              <input
                type="text"
                maxLength={6}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
                className="w-full px-4 py-4 border border-black/10 rounded-lg text-center text-3xl font-bold tracking-[0.3em] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-300 placeholder:tracking-[0.3em]"
                placeholder="000000"
                autoFocus
              />
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={code.length !== 6}
              className="w-full py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Valider le code
            </button>
          </form>
        </div>
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-gray-500">
            Pas encore de code ?{" "}
            <Link href="/#tarifs" className="text-blue-600 font-medium hover:underline">Voir nos offres</Link>
          </p>
          <p className="text-sm text-gray-500">
            <Link href="/dashboard" className="text-blue-600 font-medium hover:underline">← Retour au dashboard</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
