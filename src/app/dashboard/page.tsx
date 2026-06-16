"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const ADMIN_EMAIL = "rubensdelbaere7@icloud.com";

interface Demande {
  id: string;
  activite: string;
  besoin: string;
  has_site: boolean;
  details: string;
  style: string;
  exemples: string;
  nom: string;
  email: string;
  telephone: string;
  budget: string;
  statut: string;
  created_at: string;
}

const statutColors: Record<string, { label: string; bg: string; text: string }> = {
  nouveau: { label: "Nouveau", bg: "bg-blue-50", text: "text-blue-700" },
  contacte: { label: "Contacté", bg: "bg-yellow-50", text: "text-yellow-700" },
  en_cours: { label: "En cours", bg: "bg-orange-50", text: "text-orange-700" },
  termine: { label: "Terminé", bg: "bg-green-50", text: "text-green-700" },
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [demandes, setDemandes] = useState<Demande[]>([]);
  const [selectedDemande, setSelectedDemande] = useState<Demande | null>(null);
  const [loadingDemandes, setLoadingDemandes] = useState(false);
  const router = useRouter();

  const isAdmin = user?.email === ADMIN_EMAIL;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.push("/auth/login");
      } else {
        setUser(data.user);
        // Load demandes if admin
        if (data.user.email === ADMIN_EMAIL) {
          loadDemandes();
        }
      }
      setLoading(false);
    });
  }, [router]);

  const loadDemandes = async () => {
    setLoadingDemandes(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const res = await fetch("/api/demandes", {
        headers: { authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDemandes(data);
      }
    } catch {
      // silent
    }
    setLoadingDemandes(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return null;

  const name = user.user_metadata?.full_name || user.email;

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <nav className="h-14 px-6 flex items-center justify-between border-b border-[#f5f5f5] bg-white">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 bg-[#0a0a0a] rounded-md flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">K</span>
          </span>
          <span className="text-[14px] font-semibold tracking-tight">Klyora Sites</span>
          {isAdmin && <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-bold rounded">ADMIN</span>}
        </Link>
        <div className="flex items-center gap-4">
          {!isAdmin && (
            <Link href="/dashboard/enter-code" className="px-3 py-1.5 bg-[#0066ff] text-white text-[12px] font-medium rounded-lg hover:bg-blue-700 transition">
              Entrer un code
            </Link>
          )}
          <button onClick={handleLogout} className="text-[12px] text-[#a3a3a3] hover:text-[#0a0a0a] transition">
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Admin view — demandes */}
        {isAdmin ? (
          <>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Demandes reçues</h1>
            <p className="text-[#737373] text-[14px] mb-8">{demandes.length} demande{demandes.length !== 1 ? "s" : ""} au total</p>

            {loadingDemandes ? (
              <div className="flex justify-center py-20">
                <div className="w-6 h-6 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
              </div>
            ) : demandes.length === 0 ? (
              <div className="bg-white border border-[#f5f5f5] rounded-xl p-12 text-center">
                <p className="text-[#a3a3a3] text-[15px]">Aucune demande pour le moment.</p>
              </div>
            ) : selectedDemande ? (
              /* Detail view */
              <div className="bg-white border border-[#f5f5f5] rounded-xl p-8">
                <button onClick={() => setSelectedDemande(null)} className="text-[13px] text-[#0066ff] font-medium mb-6 hover:underline">
                  ← Retour à la liste
                </button>
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-xl font-bold">{selectedDemande.nom}</h2>
                  {(() => {
                    const s = statutColors[selectedDemande.statut] || statutColors.nouveau;
                    return <span className={`px-2.5 py-0.5 ${s.bg} ${s.text} text-[11px] font-semibold rounded-full`}>{s.label}</span>;
                  })()}
                </div>
                <div className="grid sm:grid-cols-2 gap-6 text-[14px]">
                  <div>
                    <p className="text-[#a3a3a3] text-[12px] uppercase tracking-wider mb-1">Email</p>
                    <p className="font-medium">{selectedDemande.email}</p>
                  </div>
                  <div>
                    <p className="text-[#a3a3a3] text-[12px] uppercase tracking-wider mb-1">Téléphone</p>
                    <p className="font-medium">{selectedDemande.telephone || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[#a3a3a3] text-[12px] uppercase tracking-wider mb-1">Activité</p>
                    <p className="font-medium capitalize">{selectedDemande.activite}</p>
                  </div>
                  <div>
                    <p className="text-[#a3a3a3] text-[12px] uppercase tracking-wider mb-1">Besoin</p>
                    <p className="font-medium capitalize">{selectedDemande.besoin || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[#a3a3a3] text-[12px] uppercase tracking-wider mb-1">Style</p>
                    <p className="font-medium capitalize">{selectedDemande.style || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[#a3a3a3] text-[12px] uppercase tracking-wider mb-1">Budget</p>
                    <p className="font-medium">{selectedDemande.budget || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[#a3a3a3] text-[12px] uppercase tracking-wider mb-1">Site existant</p>
                    <p className="font-medium">{selectedDemande.has_site ? "Oui" : "Non"}</p>
                  </div>
                  <div>
                    <p className="text-[#a3a3a3] text-[12px] uppercase tracking-wider mb-1">Date</p>
                    <p className="font-medium">{new Date(selectedDemande.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                </div>
                {selectedDemande.details && (
                  <div className="mt-6 pt-6 border-t border-[#f5f5f5]">
                    <p className="text-[#a3a3a3] text-[12px] uppercase tracking-wider mb-2">Détails du projet</p>
                    <p className="text-[14px] text-[#525252] leading-relaxed whitespace-pre-line">{selectedDemande.details}</p>
                  </div>
                )}
                {selectedDemande.exemples && (
                  <div className="mt-4">
                    <p className="text-[#a3a3a3] text-[12px] uppercase tracking-wider mb-2">Exemples cités</p>
                    <p className="text-[14px] text-[#525252] whitespace-pre-line">{selectedDemande.exemples}</p>
                  </div>
                )}
              </div>
            ) : (
              /* List view */
              <div className="space-y-2">
                {demandes.map((d) => {
                  const s = statutColors[d.statut] || statutColors.nouveau;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setSelectedDemande(d)}
                      className="w-full bg-white border border-[#f5f5f5] rounded-xl p-5 flex items-center justify-between hover:border-[#e5e5e5] transition-colors text-left"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-10 h-10 bg-[#f5f5f5] rounded-full flex items-center justify-center text-[14px] font-bold text-[#525252] flex-shrink-0">
                          {d.nom.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[14px] font-semibold truncate">{d.nom}</p>
                          <p className="text-[12px] text-[#a3a3a3] truncate capitalize">{d.activite} &middot; {d.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                        <span className={`px-2.5 py-0.5 ${s.bg} ${s.text} text-[11px] font-semibold rounded-full`}>{s.label}</span>
                        <span className="text-[12px] text-[#a3a3a3] hidden sm:block">
                          {new Date(d.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                        </span>
                        <svg className="w-4 h-4 text-[#a3a3a3]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          /* Regular user view */
          <>
            <h1 className="text-2xl font-bold tracking-tight mb-1">Bonjour{name ? `, ${typeof name === 'string' ? name.split(" ")[0] : ''}` : ""}</h1>
            <p className="text-[#737373] text-[14px] mb-10">Retrouvez vos projets Klyora Sites.</p>

            <div className="bg-white border border-[#f5f5f5] rounded-xl p-12 text-center">
              <div className="w-14 h-14 bg-[#fafafa] border border-[#f5f5f5] rounded-full flex items-center justify-center mx-auto mb-5">
                <svg className="w-7 h-7 text-[#a3a3a3]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 3v18M3 9h6" />
                </svg>
              </div>
              <h2 className="text-lg font-bold mb-2">Aucun projet</h2>
              <p className="text-[#a3a3a3] text-[14px] mb-6 max-w-xs mx-auto">
                Vous avez reçu un code à 6 chiffres ? Entrez-le ci-dessous.
              </p>
              <Link href="/dashboard/enter-code" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0a0a0a] text-white rounded-lg text-[13px] font-medium hover:bg-[#262626] transition">
                Entrer un code →
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
