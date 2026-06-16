"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
}

export default function EnterCodePage() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [project, setProject] = useState<Project | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/auth/login");
      } else {
        setAuthed(true);
      }
      setLoading(false);
    });
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length !== 6) {
      setError("Le code doit contenir 6 chiffres.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/projects?code=${code}`);
      if (!res.ok) {
        setError("Code introuvable. Vérifiez le code reçu par email.");
        setSubmitting(false);
        return;
      }
      const data = await res.json();
      setProject(data);
    } catch {
      setError("Erreur de connexion. Réessayez.");
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!authed) return null;

  // PROJECT FOUND — show details
  if (project) {
    const priceFormatted = (project.price_cents / 100).toLocaleString("fr-FR", { style: "currency", currency: "EUR" });
    const statusLabels: Record<string, { label: string; color: string }> = {
      sent: { label: "En attente de paiement", color: "bg-yellow-100 text-yellow-700" },
      paid: { label: "Payé", color: "bg-green-100 text-green-700" },
      in_progress: { label: "En cours de création", color: "bg-blue-100 text-blue-700" },
      completed: { label: "Livré", color: "bg-green-100 text-green-700" },
      viewed: { label: "Consulté", color: "bg-gray-100 text-gray-700" },
      draft: { label: "Brouillon", color: "bg-gray-100 text-gray-500" },
    };
    const st = statusLabels[project.status] || statusLabels.draft;

    return (
      <div className="min-h-screen bg-gray-50">
        <nav className="h-16 px-6 flex items-center justify-between border-b border-gray-100 bg-white">
          <Link href="/dashboard" className="text-base font-bold tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-sm" />Klyora<span className="text-blue-600"> Sites</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-black transition">← Dashboard</Link>
        </nav>

        <div className="max-w-2xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-8">
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${st.color}`}>{st.label}</span>
            <span className="text-sm text-gray-400">Code : {project.code}</span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight mb-4 text-black">{project.title}</h1>

          {project.description && (
            <p className="text-gray-500 mb-8 leading-relaxed">{project.description}</p>
          )}

          {/* Price card */}
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
        </div>
      </div>
    );
  }

  // CODE INPUT
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight inline-flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-sm" />Klyora<span className="text-blue-600"> Sites</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mt-6">Entrer un code</h1>
          <p className="text-sm text-gray-500 mt-2">
            Saisissez le code à 6 chiffres reçu par email.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
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
                className="w-full px-4 py-4 border border-gray-200 rounded-lg text-center text-3xl font-bold tracking-[0.3em] bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder:text-gray-200"
                placeholder="000000"
                autoFocus
              />
              {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
            </div>
            <button
              type="submit"
              disabled={code.length !== 6 || submitting}
              className="w-full py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Vérification..." : "Valider le code"}
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          <Link href="/dashboard" className="text-blue-600 font-medium hover:underline">← Retour au dashboard</Link>
        </p>
      </div>
    </div>
  );
}
