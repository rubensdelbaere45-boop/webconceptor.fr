"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

const C = {
  ink: "#0B0B0D",
  slate: "#4A4A52",
  fog: "#C9C5BC",
  mist: "#E8E4DA",
  bone: "#F5F1E8",
  paper: "#FFFFFF",
  lime: "#C8FF3D",
  clay: "#E6533C",
} as const;

const F = {
  display: "'Instrument Serif', Georgia, serif",
  sans: "'Geist', 'Inter', system-ui, sans-serif",
  mono: "'Geist Mono', ui-monospace, monospace",
} as const;

type User = { email: string; name?: string; picture?: string };

const AGENTS = [
  { id: "astra",  name: "Astra",  job: "Saisie comptable",   metric: "412 tâches/sem",  status: "idle",   color: "#C8FF3D" },
  { id: "cassio", name: "Cassio", job: "Revue de contrats",  metric: "38 tâches/sem",   status: "idle",   color: "#C8FF3D" },
  { id: "mira",   name: "Mira",   job: "Hygiène CRM",        metric: "11 400 tâches/sem", status: "idle", color: "#C8FF3D" },
  { id: "orion",  name: "Orion",  job: "Triage du support",  metric: "1 820 tâches/sem",  status: "idle", color: "#C8FF3D" },
  { id: "halden", name: "Halden", job: "Recrutement",        metric: "240 tâches/sem",  status: "idle",   color: "#C8FF3D" },
];

const PACKS = [
  {
    id: "commerce",
    name: "Pack Commerce",
    desc: "Relances clients, gestion stock, rapports quotidiens automatiques.",
    price: "290 €/mois",
    saves: "18h / semaine",
    tasks: ["Relances clients inactifs", "Alertes rupture de stock", "Rapport de caisse quotidien", "Synchronisation comptable"],
    icon: "🏪",
  },
  {
    id: "artisan",
    name: "Pack Artisan",
    desc: "Devis automatiques, suivi chantiers, facturation en un clic.",
    price: "190 €/mois",
    saves: "12h / semaine",
    tasks: ["Génération de devis par email", "Relances impayés", "Planning chantier", "Facture PDF automatique"],
    icon: "🔧",
  },
  {
    id: "restaurant",
    name: "Pack Restauration",
    desc: "Commandes fournisseurs, gestion allergènes, réservations en ligne.",
    price: "240 €/mois",
    saves: "15h / semaine",
    tasks: ["Commande fournisseur automatique", "Gestion réservations", "Rapport hebdomadaire", "Fiches allergènes"],
    icon: "🍽️",
  },
];

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ padding: "20px 24px", background: C.paper, border: `1px solid ${C.mist}`, borderRadius: 8 }}>
      <div style={{ fontFamily: F.mono, fontSize: 11, color: C.slate, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: F.display, fontSize: 36, color: C.ink, lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: F.sans, fontSize: 12, color: C.fog, marginTop: 6 }}>{sub}</div>}
    </div>
  );
}

export default function AgentConceptorDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"agents" | "packs" | "parametres">("agents");
  const [hireModal, setHireModal] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) {
        router.replace("/agentconceptor");
        return;
      }
      setUser({
        email: data.session.user.email!,
        name: data.session.user.user_metadata?.full_name,
        picture: data.session.user.user_metadata?.avatar_url,
      });
      setLoading(false);
    });
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/agentconceptor");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: C.bone, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');`}</style>
        <div style={{ fontFamily: F.mono, fontSize: 13, color: C.slate, letterSpacing: "0.06em" }}>Chargement…</div>
      </div>
    );
  }

  const initials = (user?.name || user?.email || "?")[0].toUpperCase();

  return (
    <div style={{ fontFamily: F.sans, background: C.bone, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');
        * { box-sizing: border-box; }
        ::selection { background: ${C.lime}; color: ${C.ink}; }
      `}</style>

      {/* ── SIDEBAR ── */}
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", minHeight: "100vh" }}>
        <aside style={{ background: C.ink, padding: "28px 0", display: "flex", flexDirection: "column", position: "fixed", top: 0, left: 0, width: 220, height: "100vh", overflowY: "auto" }}>
          <a href="/agentconceptor" style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 20px 28px", textDecoration: "none", borderBottom: `1px solid rgba(255,255,255,.08)` }}>
            <img src="/ac-mark.svg" width={28} height={28} alt="" />
            <span style={{ fontFamily: F.display, fontSize: 18, color: C.bone }}>AgentConceptor</span>
          </a>

          <nav style={{ padding: "20px 12px", display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
            {[
              { id: "agents" as const,     label: "Mes agents",        icon: "◈" },
              { id: "packs" as const,      label: "Packs automatisation", icon: "⚡" },
              { id: "parametres" as const, label: "Paramètres",        icon: "◎" },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                style={{
                  background: activeTab === item.id ? "rgba(200,255,61,.12)" : "transparent",
                  border: activeTab === item.id ? `1px solid rgba(200,255,61,.25)` : "1px solid transparent",
                  color: activeTab === item.id ? C.lime : C.fog,
                  borderRadius: 6, padding: "10px 12px",
                  display: "flex", alignItems: "center", gap: 12,
                  fontFamily: F.sans, fontSize: 14, fontWeight: 500,
                  cursor: "pointer", textAlign: "left", width: "100%",
                  transition: "all 150ms",
                }}
              >
                <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          {/* User info */}
          <div style={{ padding: "20px", borderTop: `1px solid rgba(255,255,255,.08)` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              {user?.picture
                ? <img src={user.picture} alt="" width={32} height={32} style={{ borderRadius: 999 }} />
                : <div style={{ width: 32, height: 32, borderRadius: 999, background: C.lime, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 16, color: C.ink }}>{initials}</div>
              }
              <div>
                <div style={{ fontFamily: F.sans, fontSize: 13, color: C.bone, fontWeight: 500 }}>{user?.name || "Utilisateur"}</div>
                <div style={{ fontFamily: F.mono, fontSize: 10, color: C.fog, textTransform: "uppercase", letterSpacing: "0.04em" }}>Plan Équipe</div>
              </div>
            </div>
            <button onClick={handleSignOut} style={{ width: "100%", background: "transparent", border: `1px solid rgba(255,255,255,.12)`, borderRadius: 4, padding: "8px 12px", color: C.fog, fontFamily: F.sans, fontSize: 12, cursor: "pointer" }}>
              Se déconnecter
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={{ marginLeft: 220, padding: "40px 40px" }}>

          {/* ── AGENTS TAB ── */}
          {activeTab === "agents" && (
            <div>
              {/* Header stats */}
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: C.slate, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>§ TABLEAU DE BORD · AGENTS</div>
                <h1 style={{ fontFamily: F.display, fontSize: 48, color: C.ink, margin: 0, fontWeight: 400 }}>
                  Bonjour, <span style={{ fontStyle: "italic" }}>{user?.name?.split(" ")[0] || "vous"}.</span>
                </h1>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 40 }}>
                <Stat label="Tâches ce mois" value="0" sub="Lancez votre premier agent" />
                <Stat label="Temps économisé" value="0h" sub="Cible : 40h/mois" />
                <Stat label="Agents actifs" value="0 / 5" sub="Disponibles à l'embauche" />
                <Stat label="Précision" value="—" sub="Sera calculée après 100 tâches" />
              </div>

              {/* Banner 7j gratuit */}
              <div style={{ background: C.lime, borderRadius: 8, padding: "20px 28px", marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontFamily: F.sans, fontSize: 16, fontWeight: 600, color: C.ink }}>7 jours d&apos;essai gratuit — sans carte bancaire</div>
                  <div style={{ fontFamily: F.sans, fontSize: 13, color: C.slate, marginTop: 4 }}>Embauchez un agent maintenant, validez chaque action pendant 7 jours, résiliez en un clic.</div>
                </div>
                <button onClick={() => {}} style={{ background: C.ink, color: C.bone, border: 0, padding: "12px 22px", borderRadius: 4, fontFamily: F.sans, fontSize: 14, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap" }}>
                  Choisir un agent →
                </button>
              </div>

              {/* Agent cards */}
              <div style={{ fontFamily: F.mono, fontSize: 11, color: C.slate, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 16 }}>§ L&apos;ÉQUIPE · 5 AGENTS DISPONIBLES</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
                {AGENTS.map(agent => (
                  <div
                    key={agent.id}
                    style={{ background: C.paper, border: `1px solid ${C.mist}`, borderRadius: 8, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <img src={`/ac-agents/${agent.id}.svg`} width={48} height={48} alt="" />
                      <span style={{ fontFamily: F.mono, fontSize: 10, color: C.slate, padding: "3px 8px", border: `1px solid ${C.mist}`, borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Disponible
                      </span>
                    </div>
                    <div>
                      <div style={{ fontFamily: F.display, fontSize: 32, lineHeight: 1.1, color: C.ink }}>{agent.name}</div>
                      <div style={{ fontFamily: F.mono, fontSize: 11, color: C.slate, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>§ {agent.job}</div>
                    </div>
                    <div style={{ fontFamily: F.mono, fontSize: 12, color: C.slate }}>Capacité : {agent.metric}</div>
                    <button
                      onClick={() => setHireModal(agent.id)}
                      style={{ background: C.lime, color: C.ink, border: 0, padding: "10px 16px", borderRadius: 4, fontFamily: F.sans, fontSize: 13, fontWeight: 500, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                    >
                      Embaucher {agent.name} →
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── PACKS TAB ── */}
          {activeTab === "packs" && (
            <div>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: C.slate, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>§ PACKS AUTOMATISATION · CLÉS EN MAIN</div>
                <h1 style={{ fontFamily: F.display, fontSize: 48, color: C.ink, margin: "0 0 16px", fontWeight: 400 }}>
                  Des packs <span style={{ fontStyle: "italic" }}>qui se paient seuls.</span>
                </h1>
                <p style={{ fontFamily: F.sans, fontSize: 16, color: C.slate, maxWidth: 620, lineHeight: 1.6 }}>
                  Chaque pack regroupe les automatisations les plus rentables pour votre secteur. Configuré, testé et opérationnel en 48h.
                </p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20, marginBottom: 40 }}>
                {PACKS.map(pack => (
                  <div key={pack.id} style={{ background: C.paper, border: `1px solid ${C.mist}`, borderRadius: 8, padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
                    <div style={{ fontSize: 40 }}>{pack.icon}</div>
                    <div>
                      <div style={{ fontFamily: F.display, fontSize: 28, color: C.ink, lineHeight: 1.1 }}>{pack.name}</div>
                      <div style={{ fontFamily: F.sans, fontSize: 14, color: C.slate, marginTop: 8, lineHeight: 1.5 }}>{pack.desc}</div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                      <div>
                        <div style={{ fontFamily: F.display, fontSize: 28, color: C.ink }}>{pack.price}</div>
                        <div style={{ fontFamily: F.mono, fontSize: 11, color: "#74A800", textTransform: "uppercase", letterSpacing: "0.06em" }}>Économise {pack.saves}</div>
                      </div>
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                      {pack.tasks.map(t => (
                        <li key={t} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: F.sans, fontSize: 13, color: C.ink }}>
                          <span style={{ width: 14, height: 14, borderRadius: 999, background: C.lime, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 8 }}>✓</span>
                          {t}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => setHireModal(pack.id)}
                      style={{ background: C.ink, color: C.bone, border: 0, padding: "12px 16px", borderRadius: 4, fontFamily: F.sans, fontSize: 14, fontWeight: 500, cursor: "pointer", marginTop: "auto" }}
                    >
                      Activer ce pack →
                    </button>
                  </div>
                ))}
              </div>

              {/* ROI calculator strip */}
              <div style={{ background: C.ink, borderRadius: 8, padding: "36px 40px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 40, alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: F.mono, fontSize: 11, color: C.fog, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 12 }}>§ RETOUR SUR INVESTISSEMENT MOYEN</div>
                  <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 32, color: C.bone, lineHeight: 1.2 }}>
                    Un pack se rembourse en moins d&apos;un mois.
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[{ label: "Temps gagné / sem", val: "15h" }, { label: "Coût évité / mois", val: "1 800 €" }, { label: "Délai de rentabilité", val: "< 3 sem" }].map(r => (
                    <div key={r.label} style={{ display: "flex", justifyContent: "space-between", borderBottom: `1px solid rgba(255,255,255,.08)`, paddingBottom: 12 }}>
                      <span style={{ fontFamily: F.sans, fontSize: 13, color: C.fog }}>{r.label}</span>
                      <span style={{ fontFamily: F.display, fontSize: 18, color: C.bone }}>{r.val}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <button
                    onClick={() => window.location.href = "mailto:contact@agentconceptor.com?subject=Demande%20pack%20automatisation"}
                    style={{ background: C.lime, color: C.ink, border: 0, padding: "14px 24px", borderRadius: 4, fontFamily: F.sans, fontSize: 14, fontWeight: 500, cursor: "pointer", width: "100%" }}
                  >
                    Parler à un expert →
                  </button>
                  <div style={{ fontFamily: F.mono, fontSize: 11, color: C.fog, marginTop: 12, textAlign: "center", letterSpacing: "0.04em" }}>Réponse sous 4h · Sans engagement</div>
                </div>
              </div>
            </div>
          )}

          {/* ── PARAMS TAB ── */}
          {activeTab === "parametres" && (
            <div>
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: F.mono, fontSize: 11, color: C.slate, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>§ PARAMÈTRES DU COMPTE</div>
                <h1 style={{ fontFamily: F.display, fontSize: 48, color: C.ink, margin: 0, fontWeight: 400 }}>Votre compte.</h1>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ background: C.paper, border: `1px solid ${C.mist}`, borderRadius: 8, padding: 28 }}>
                  <div style={{ fontFamily: F.mono, fontSize: 11, color: C.slate, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>§ PROFIL</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
                    {user?.picture
                      ? <img src={user.picture} alt="" width={56} height={56} style={{ borderRadius: 999 }} />
                      : <div style={{ width: 56, height: 56, borderRadius: 999, background: C.lime, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 24, color: C.ink }}>{initials}</div>
                    }
                    <div>
                      <div style={{ fontFamily: F.sans, fontSize: 16, fontWeight: 500, color: C.ink }}>{user?.name || "—"}</div>
                      <div style={{ fontFamily: F.sans, fontSize: 13, color: C.slate }}>{user?.email}</div>
                    </div>
                  </div>
                  <div style={{ padding: "12px 16px", background: C.bone, borderRadius: 4, fontFamily: F.mono, fontSize: 12, color: C.slate }}>
                    Connecté via Google · Authentification sécurisée Supabase
                  </div>
                </div>
                <div style={{ background: C.paper, border: `1px solid ${C.mist}`, borderRadius: 8, padding: 28 }}>
                  <div style={{ fontFamily: F.mono, fontSize: 11, color: C.slate, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 16 }}>§ ABONNEMENT</div>
                  <div style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 28, color: C.ink, marginBottom: 12 }}>Essai gratuit · 7 jours</div>
                  <div style={{ fontFamily: F.sans, fontSize: 14, color: C.slate, lineHeight: 1.6, marginBottom: 20 }}>
                    Accès complet. Aucune carte requise. Choisissez votre offre avant la fin de l&apos;essai.
                  </div>
                  <button
                    onClick={() => setActiveTab("agents")}
                    style={{ background: C.lime, color: C.ink, border: 0, padding: "12px 20px", borderRadius: 4, fontFamily: F.sans, fontSize: 14, fontWeight: 500, cursor: "pointer" }}
                  >
                    Voir les offres →
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── HIRE MODAL ── */}
      {hireModal && (
        <div onClick={() => setHireModal(null)} style={{ position: "fixed", inset: 0, background: "rgba(11,11,13,.55)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: C.paper, width: 500, maxWidth: "100%", borderRadius: 12, padding: 36, boxShadow: "0 24px 64px rgba(11,11,13,.2)" }}>
            <div style={{ fontFamily: F.display, fontSize: 32, color: C.ink, marginBottom: 12 }}>Bientôt disponible</div>
            <p style={{ fontFamily: F.sans, fontSize: 15, color: C.slate, lineHeight: 1.6, marginBottom: 24 }}>
              L&apos;activation des agents et packs sera disponible dès l&apos;ouverture officielle. En attendant, contactez-nous pour un déploiement sur mesure.
            </p>
            <div style={{ display: "flex", gap: 12 }}>
              <a
                href="mailto:contact@agentconceptor.com?subject=Demande%20d%27activation"
                style={{ background: C.lime, color: C.ink, padding: "12px 20px", borderRadius: 4, fontFamily: F.sans, fontSize: 14, fontWeight: 500, textDecoration: "none" }}
              >
                Contacter l&apos;équipe →
              </a>
              <button onClick={() => setHireModal(null)} style={{ background: "transparent", border: `1px solid ${C.mist}`, padding: "12px 20px", borderRadius: 4, fontFamily: F.sans, fontSize: 14, cursor: "pointer", color: C.slate }}>
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
