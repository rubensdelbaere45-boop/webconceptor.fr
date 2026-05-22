"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/* ─── Design tokens ─────────────────────────────────────── */
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

/* ─── Primitives ─────────────────────────────────────────── */
function Ico({ name, size = 18, style }: { name: string; size?: number; style?: React.CSSProperties }) {
  if (name === "x") return <span style={{ display: "inline-block", width: size, height: size, lineHeight: `${size}px`, textAlign: "center", fontSize: size * 0.75, ...style }}>✕</span>;
  if (name === "zap") return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline-block", verticalAlign: "middle", ...style }}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
  return <img src={`/ac-icons/${name}.svg`} width={size} height={size} alt="" style={{ display: "inline-block", verticalAlign: "middle", ...style }} />;
}

function Eyebrow({ children, color = C.slate, style }: { children: React.ReactNode; color?: string; style?: React.CSSProperties }) {
  return <div style={{ fontFamily: F.mono, fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color, ...style }}>{children}</div>;
}

function Container({ children, style, ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return <div style={{ maxWidth: 1240, margin: "0 auto", padding: "0 32px", ...style }} {...rest}>{children}</div>;
}

function Rule({ color = C.mist, style }: { color?: string; style?: React.CSSProperties }) {
  return <div style={{ borderTop: `1px solid ${color}`, ...style }} />;
}

/* ─── Data ───────────────────────────────────────────────── */
const AGENTS = [
  { id: "astra",  name: "Astra",  job: "Saisie comptable",  one: "Lit votre boîte mail partagée, code chaque facture sur le bon compte, route pour validation.", metric: "412 factures / semaine",  stack: ["Gmail", "Pennylane", "Slack"] },
  { id: "cassio", name: "Cassio", job: "Revue de contrats",  one: "Surveille DocuSign à l'arrivée des contrats, alerte sur les clauses inhabituelles selon votre playbook.", metric: "38 contrats / semaine",   stack: ["DocuSign", "Notion", "Slack"] },
  { id: "mira",   name: "Mira",   job: "Hygiène du CRM",    one: "Garde Salesforce propre. Déduplique les comptes, enrichit les leads, corrige les étapes stagnantes.", metric: "11 400 fiches / semaine", stack: ["Salesforce", "Apollo", "Dropcontact"] },
  { id: "orion",  name: "Orion",  job: "Triage du support", one: "Lit les tickets entrants, les catégorise, route vers la bonne équipe, rédige une première réponse.", metric: "1 820 tickets / semaine",  stack: ["Zendesk", "Linear", "Slack"] },
  { id: "halden", name: "Halden", job: "Recrutement",        one: "Filtre les candidatures selon votre grille, planifie les premiers entretiens, envoie les refus avec tact.", metric: "240 candidats / semaine", stack: ["Greenhouse", "Gmail", "Calendly"] },
];

type Agent = typeof AGENTS[0];
type User = { email: string; name?: string; picture?: string };

/* ─── AgentCard ─────────────────────────────────────────── */
function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <article
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)} onClick={onClick}
      style={{ background: C.paper, border: `1px solid ${hover ? "rgba(11,11,13,0.22)" : C.mist}`, borderRadius: 8, padding: 28, cursor: "pointer", transition: "border-color 200ms, transform 200ms", transform: hover ? "translateY(-2px)" : "none", display: "flex", flexDirection: "column", gap: 20, minHeight: 280 }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <img src={`/ac-agents/${agent.id}.svg`} width={56} height={56} alt="" />
        <Eyebrow>{agent.metric}</Eyebrow>
      </div>
      <div>
        <div style={{ fontFamily: F.display, fontSize: 40, lineHeight: 1.1, letterSpacing: "-0.015em", color: C.ink, marginBottom: 4 }}>{agent.name}</div>
        <div style={{ fontFamily: F.mono, fontSize: 11, color: C.slate, letterSpacing: "0.06em", textTransform: "uppercase" }}>§ {agent.job}</div>
      </div>
      <p style={{ fontFamily: F.sans, fontSize: 14, lineHeight: 1.55, color: C.slate, margin: 0, flexGrow: 1 }}>{agent.one}</p>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: `1px solid ${C.mist}` }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {agent.stack.map(s => <span key={s} style={{ fontFamily: F.mono, fontSize: 10, color: C.slate, padding: "2px 7px", border: `1px solid ${C.mist}`, borderRadius: 999, textTransform: "uppercase", letterSpacing: "0.04em" }}>{s}</span>)}
        </div>
        <span style={{ fontFamily: F.sans, fontSize: 13, color: C.ink, display: "inline-flex", alignItems: "center", gap: 4 }}>
          Embaucher <Ico name="arrow-right" size={14} />
        </span>
      </div>
    </article>
  );
}

/* ─── HireModal ─────────────────────────────────────────── */
function HireModal({ agent, onClose, onProceed }: { agent: Agent | null; onClose: () => void; onProceed: () => void }) {
  const [step, setStep] = useState(0);
  useEffect(() => { setStep(0); }, [agent]);
  if (!agent) return null;
  const steps = ["Mission", "Outils", "Premier run"];
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(11,11,13,0.45)", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.paper, width: 580, maxWidth: "100%", borderRadius: 12, boxShadow: "0 24px 64px rgba(11,11,13,0.16)", padding: 36, display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            <img src={`/ac-agents/${agent.id}.svg`} width={60} height={60} alt="" />
            <div>
              <Eyebrow>§ EMBAUCHER · {agent.job.toUpperCase()}</Eyebrow>
              <div style={{ fontFamily: F.display, fontSize: 40, lineHeight: 1, marginTop: 6, letterSpacing: "-0.015em" }}>{agent.name}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: 0, cursor: "pointer", padding: 6, fontSize: 18, color: C.slate, lineHeight: 1 }}>✕</button>
        </div>
        <div style={{ display: "flex", fontFamily: F.mono, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1, padding: "10px 0", borderTop: `2px solid ${i <= step ? C.ink : C.mist}`, color: i <= step ? C.ink : C.fog }}>
              {String(i + 1).padStart(2, "0")} / {s}
            </div>
          ))}
        </div>
        {step === 0 && (
          <div>
            <p style={{ fontFamily: F.sans, fontSize: 15, lineHeight: 1.55, color: C.slate, margin: 0 }}>{agent.one}</p>
            <ul style={{ marginTop: 16, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
              {["Vous validez chaque action pendant les 7 premiers jours", "Roll-back de n'importe quel run, à tout moment", "Pause ou résiliation en un clic"].map(b => (
                <li key={b} style={{ display: "flex", gap: 10, alignItems: "center", fontFamily: F.sans, fontSize: 14, color: C.ink }}>
                  <Ico name="check" size={14} /> {b}
                </li>
              ))}
            </ul>
          </div>
        )}
        {step === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <p style={{ fontFamily: F.sans, fontSize: 14, color: C.slate, margin: 0 }}>{agent.name} a besoin d&apos;accéder à :</p>
            {agent.stack.map(s => (
              <div key={s} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", border: `1px solid ${C.mist}`, borderRadius: 6 }}>
                <span style={{ fontFamily: F.sans, fontSize: 14, color: C.ink }}>{s}</span>
                <button style={{ background: "transparent", border: `1px solid ${C.ink}`, padding: "6px 12px", borderRadius: 4, fontFamily: F.sans, fontSize: 12, fontWeight: 500, cursor: "pointer" }}>Connecter</button>
              </div>
            ))}
          </div>
        )}
        {step === 2 && (
          <div style={{ padding: 24, background: C.bone, borderRadius: 6, fontFamily: F.mono, fontSize: 13, color: C.ink, lineHeight: 1.7 }}>
            <div style={{ color: "#74A800" }}>$ ac hire {agent.id}</div>
            <div>→ Provisionnement de l&apos;agent…</div>
            <div>→ Connexion aux outils…</div>
            <div>→ Lecture des 50 premiers éléments pour contexte…</div>
            <div style={{ color: "#74A800" }}>✓ {agent.name} est prête.</div>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
          <button onClick={() => step > 0 ? setStep(step - 1) : onClose()} style={{ background: "transparent", border: 0, padding: "10px 0", fontFamily: F.sans, fontSize: 14, color: C.ink, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
            {step > 0 ? "Retour" : "Annuler"}
          </button>
          <button onClick={() => step < 2 ? setStep(step + 1) : onProceed()} style={{ background: C.lime, color: C.ink, border: 0, padding: "12px 22px", borderRadius: 4, fontFamily: F.sans, fontSize: 14, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
            {step < 2 ? "Continuer" : "Choisir une offre"} <Ico name="arrow-right" size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── SignInModal ────────────────────────────────────────── */
function SignInModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/agentconceptor/dashboard` } });
  };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(11,11,13,0.45)", backdropFilter: "blur(8px)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: C.paper, width: 460, maxWidth: "100%", borderRadius: 12, boxShadow: "0 24px 64px rgba(11,11,13,0.16)", padding: 36, position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: "transparent", border: 0, padding: 6, cursor: "pointer", fontSize: 16, color: C.slate, lineHeight: 1 }}>✕</button>
        <img src="/ac-mark.svg" width={40} height={40} alt="" style={{ marginBottom: 18 }} />
        <h3 style={{ fontFamily: F.display, fontSize: 36, lineHeight: 1, letterSpacing: "-0.015em", color: C.ink, margin: "0 0 12px", fontWeight: 400 }}>
          Bienvenue chez <span style={{ fontStyle: "italic" }}>AgentConceptor.</span>
        </h3>
        <p style={{ fontFamily: F.sans, fontSize: 14, lineHeight: 1.55, color: C.slate, margin: "0 0 28px" }}>
          Connectez-vous avec votre compte Google professionnel. Aucun mot de passe à créer, aucune carte à donner.
        </p>
        <button onClick={handleGoogle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 24px", background: C.bone, border: `1px solid ${C.mist}`, borderRadius: 6, fontFamily: F.sans, fontSize: 15, fontWeight: 500, cursor: "pointer", color: C.ink }}>
          <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
          </svg>
          Continuer avec Google
        </button>
        <div style={{ marginTop: 24, paddingTop: 24, borderTop: `1px solid ${C.mist}`, fontFamily: F.mono, fontSize: 11, color: C.slate, letterSpacing: "0.04em", textTransform: "uppercase", textAlign: "center" }}>
          En continuant, vous acceptez nos{" "}
          <a href="#" style={{ color: C.ink, textDecoration: "underline" }}>CGU</a>{" "}
          et notre{" "}
          <a href="#" style={{ color: C.ink, textDecoration: "underline" }}>politique de confidentialité</a>.
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ item ───────────────────────────────────────────── */
function FAQItem({ q, a, defaultOpen }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div style={{ borderTop: `1px solid ${C.mist}` }}>
      <button onClick={() => setOpen(!open)} style={{ width: "100%", background: "transparent", border: 0, padding: "24px 0", textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, fontFamily: F.sans, fontSize: 18, fontWeight: 500, color: C.ink, letterSpacing: "-0.005em" }}>
        <span>{q}</span>
        <Ico name={open ? "minus" : "plus"} size={18} style={{ flexShrink: 0 }} />
      </button>
      {open && <p style={{ fontFamily: F.sans, fontSize: 15, lineHeight: 1.65, color: C.slate, margin: "0 0 24px", maxWidth: 680 }}>{a}</p>}
    </div>
  );
}

/* ─── Main page ─────────────────────────────────────────── */
export default function AgentConceptorPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [hiring, setHiring] = useState<Agent | null>(null);
  const [signInOpen, setSignInOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [navHover, setNavHover] = useState<number | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        // Utilisateur déjà connecté → dashboard
        router.replace("/agentconceptor/dashboard");
        return;
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        router.replace("/agentconceptor/dashboard");
        return;
      }
      setUser(null);
    });
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => { subscription.unsubscribe(); window.removeEventListener("scroll", onScroll); };
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  const handleSignOut = () => supabase.auth.signOut();

  const navItems = [
    { l: "Agents", href: "#agents" },
    { l: "Capacités", href: "#capacites" },
    { l: "Intégrations", href: "#integrations" },
    { l: "Sécurité", href: "#securite" },
    { l: "Tarifs", href: "#tarifs" },
  ];

  const CAPS = [
    { n: "01", icon: "bot",      t: "Des agents, pas des automatisations.", b: "Chaque agent a un poste, une mission, un cadre. Il prend des décisions dans son périmètre — pas une liste de règles rigides." },
    { n: "02", icon: "shield",   t: "Vous gardez la main.",                  b: "Les 7 premiers jours, vous validez chaque action. Roll-back en un clic. Audit log complet, exportable." },
    { n: "03", icon: "workflow", t: "Ils s'enchaînent.",                     b: "Astra prépare la facture, Mira met à jour le CRM, Cassio vérifie le contrat lié. Le travail circule." },
    { n: "04", icon: "zap",     t: "Rapides. Honnêtes.",                    b: "Réponse en 1,2 s en moyenne. Si l'agent n'est pas sûr (< 70 % de confiance), il vous remonte la décision plutôt que de deviner." },
  ];

  const LOGOS = ["Quanta Logistics", "Pacific Sound Co.", "Halcyon Hosting", "Northwind Travel", "Bright Marketing", "Atelier Mercure", "Maison Verlaine", "Studio Cartier"];

  const INTEGRATIONS = [
    { h: "Email & Messagerie",       items: ["Gmail", "Outlook", "Slack", "Microsoft Teams", "Front"] },
    { h: "CRM & Ventes",             items: ["Salesforce", "HubSpot", "Pipedrive", "Apollo", "Lemlist"] },
    { h: "Comptabilité & ERP",       items: ["Pennylane", "Sage", "NetSuite", "QuickBooks", "Stripe"] },
    { h: "Support & Tickets",        items: ["Zendesk", "Intercom", "Linear", "Jira", "Notion"] },
    { h: "Recrutement",              items: ["Greenhouse", "Welcome to the Jungle", "LinkedIn", "Calendly"] },
    { h: "Documents & Signature",    items: ["DocuSign", "Yousign", "Google Drive", "Dropbox"] },
  ];

  const COMPARISON = [
    { l: "Délai de mise en route",        a: "7 minutes",       b: "6 à 12 semaines",   c: "3 à 9 mois" },
    { l: "Coût mensuel à 5 agents",       a: "1 200 €",         b: "15 000 € (1 ETP)",  c: "30 000 €+" },
    { l: "Capacité quand le volume double", a: "Instantanée",   b: "Embaucher / former", c: "Renégocier" },
    { l: "Décisions prises",              a: "Visible, auditée", b: "Visible",           c: "Boîte noire" },
    { l: "Évolutivité du périmètre",      a: "Modifiable en 5 min", b: "Trimestre suivant", c: "Avenant au contrat" },
    { l: "Vous pouvez l'arrêter…",        a: "En 7 secondes",   b: "3 mois de préavis", c: "Lettre + avocat" },
  ];

  const FAQS = [
    { q: "C'est différent d'un chatbot, vraiment ?", a: "Oui. Un chatbot répond. Un agent agit. Astra ne vous dit pas comment coder votre facture — elle la code, la route à la bonne personne, et la classe dans Pennylane. Vous voyez ce qui s'est passé après coup." },
    { q: "Que se passe-t-il si l'agent se trompe ?", a: "Pendant les 7 premiers jours, chaque action est en attente de votre validation, donc rien ne part à l'aveugle. Ensuite, l'audit log retrace tout, le rollback se fait en un clic, et l'agent apprend de la correction." },
    { q: "Mes données vont-elles servir à entraîner un modèle ?", a: "Non. Vos données restent vos données. Aucun ré-entraînement de modèle sur vos contenus. Aucun partage avec des tiers. Engagement contractuel sur l'offre Organisation." },
    { q: "Quels modèles d'IA utilisez-vous ?", a: "Un mix orchestré : modèles propriétaires pour les tâches structurées (codage comptable, extraction), Claude et GPT-4 pour les tâches nuancées (rédaction, raisonnement). Le routage est invisible pour vous." },
    { q: "Quelle est la différence avec Zapier ou n8n ?", a: "Zapier exécute des règles que vous avez écrites. Un agent prend des décisions dans un cadre que vous lui avez fixé. Si une facture inconnue arrive, Zapier plante. Astra vous demande quoi en faire." },
    { q: "Combien de temps pour démarrer ?", a: "Sept minutes pour le premier agent : créer le compte, connecter ses outils (OAuth), lancer le premier run sur des données fictives. Une journée pour un déploiement réel avec votre équipe." },
    { q: "Vous êtes basés où ?", a: "Paris. Données hébergées en France (Scaleway) et en Allemagne (AWS Frankfurt). Aucune donnée client ne quitte l'UE." },
    { q: "Peut-on parler à un humain ?", a: "Oui. contact@agentconceptor.com répond sous 4 heures ouvrées. L'offre Équipe et au-dessus a un canal Slack partagé avec nos ingénieurs." },
  ];

  const TIERS = [
    { id: "solo",  name: "Solo",         price: "199 €", per: "/ agent / mois", who: "Un agent. Une mission. Jusqu'à 2 000 tâches par mois.", features: ["1 agent", "2 000 tâches / mois", "Support par e-mail", "Audit log", "Annulable à tout moment"], cta: "Démarrer l'essai", accent: false },
    { id: "team",  name: "Équipe",       price: "1 200 €", per: "/ mois", who: "Jusqu'à 5 agents qui collaborent, boîtes partagées et transferts entre eux.", features: ["Jusqu'à 5 agents", "25 000 tâches / mois", "Slack + audit log", "Playbooks personnalisés", "Support prioritaire 9-18h"], cta: "Embaucher mon premier agent", accent: true },
    { id: "org",   name: "Organisation", price: "Sur devis", per: "", who: "Agents illimités, SSO, VPC, infra dédiée, toute l'équipe.", features: ["Agents illimités", "Tâches illimitées", "SSO + SCIM", "Déploiement VPC", "CSM dédié"], cta: "Parler à un commercial", accent: false },
  ];

  const FOOTER_COLS = [
    { h: "Agents",     items: [{ l: "Astra · Saisie comptable", href: "#agents" }, { l: "Cassio · Contrats", href: "#agents" }, { l: "Mira · CRM", href: "#agents" }, { l: "Orion · Support", href: "#agents" }, { l: "Halden · Recrutement", href: "#agents" }, { l: "Voir les 12 agents →", href: "#agents" }] },
    { h: "Produit",    items: [{ l: "Comment ça marche", href: "#fonctionnement" }, { l: "Capacités", href: "#capacites" }, { l: "Intégrations", href: "#integrations" }, { l: "Sécurité", href: "#securite" }, { l: "Tarifs", href: "#tarifs" }] },
    { h: "Entreprise", items: [{ l: "À propos", href: "#" }, { l: "Manifeste", href: "#" }, { l: "Carrières · 4 postes", href: "#" }, { l: "Contact", href: "mailto:contact@agentconceptor.com" }] },
    { h: "Légal",      items: [{ l: "Conditions générales", href: "#" }, { l: "Confidentialité", href: "#" }, { l: "DPA / RGPD", href: "#" }, { l: "Mentions légales", href: "#" }] },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap');
        #ac * { box-sizing: border-box; }
        #ac ::selection { background: #C8FF3D; color: #0B0B0D; }
        #ac a { color: inherit; }
        #ac button { font: inherit; }
        #ac :focus-visible { outline: 2px solid #0B0B0D; outline-offset: 2px; border-radius: 2px; }
        ::-webkit-scrollbar { width: 10px; } ::-webkit-scrollbar-thumb { background: rgba(11,11,13,.15); border-radius: 4px; }
      `}</style>
      <div id="ac" style={{ fontFamily: F.sans, background: C.bone, color: C.ink, minHeight: "100vh" }}>

        {/* ── HEADER ─────────────────────────────────────────── */}
        <header style={{ borderBottom: scrolled ? `1px solid ${C.mist}` : "1px solid transparent", background: scrolled ? "rgba(245,241,232,0.85)" : "transparent", position: "sticky", top: 0, zIndex: 50, backdropFilter: scrolled ? "blur(12px)" : "none", transition: "background 200ms, border-color 200ms" }}>
          <Container style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 68 }}>
            <Link href="/agentconceptor" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
              <img src="/ac-mark.svg" width={30} height={30} alt="" />
              <span style={{ fontFamily: F.display, fontSize: 24, color: C.ink, letterSpacing: "-0.01em" }}>AgentConceptor</span>
            </Link>
            <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
              {navItems.map((item, i) => (
                <a key={item.l} href={item.href} onMouseEnter={() => setNavHover(i)} onMouseLeave={() => setNavHover(null)} style={{ fontFamily: F.sans, fontSize: 14, color: C.ink, textDecoration: "none", borderBottom: navHover === i ? `1px solid ${C.ink}` : "1px solid transparent", paddingBottom: 2 }}>{item.l}</a>
              ))}
            </nav>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {user ? (
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  {user.picture
                    ? <img src={user.picture} alt="" width={30} height={30} style={{ borderRadius: 999 }} />
                    : <div style={{ width: 30, height: 30, borderRadius: 999, background: C.lime, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontStyle: "italic", fontSize: 16, color: C.ink }}>{(user.name || user.email || "?")[0]}</div>
                  }
                  <button onClick={handleSignOut} style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", fontFamily: F.sans, fontSize: 14, color: C.ink, textDecoration: "underline", textUnderlineOffset: 3 }}>Se déconnecter</button>
                </div>
              ) : (
                <>
                  <button onClick={() => setSignInOpen(true)} style={{ background: "transparent", border: 0, padding: 0, cursor: "pointer", fontFamily: F.sans, fontSize: 14, color: C.ink }}>Se connecter</button>
                  <button onClick={() => scrollTo("cta-final")} style={{ background: C.ink, color: C.bone, border: 0, padding: "9px 16px", borderRadius: 4, fontFamily: F.sans, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>Demander une démo</button>
                </>
              )}
            </div>
          </Container>
        </header>

        {/* ── HERO ──────────────────────────────────────────────── */}
        <section style={{ position: "relative", overflow: "hidden", background: C.bone }}>
          <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "url(/ac-blueprint-bg.svg)", backgroundSize: "900px 450px", backgroundPosition: "right -80px center", backgroundRepeat: "no-repeat", opacity: 0.55, pointerEvents: "none" }} />
          <Container style={{ position: "relative", padding: "120px 32px 80px" }}>
            <Eyebrow style={{ marginBottom: 28 }}>§ AGENTCONCEPTOR · LANCEMENT V4 · MAI 2026</Eyebrow>
            <h1 style={{ fontFamily: F.display, fontSize: 124, lineHeight: 1.02, letterSpacing: "-0.025em", color: C.ink, margin: 0, fontWeight: 400, maxWidth: 1100 }}>
              Embauchez des agents.<br />
              <span style={{ fontStyle: "italic" }}>Pas des ingénieurs.</span>
            </h1>
            <p style={{ fontFamily: F.sans, fontSize: 20, lineHeight: 1.55, color: C.slate, maxWidth: 640, marginTop: 120, marginBottom: 0 }}>
              AgentConceptor crée des agents IA qui s&apos;occupent du travail opérationnel qui freine vos équipes — saisie des factures, enrichissement de leads, revue de contrats, triage de tickets. Chaque agent est un collaborateur nommé avec un poste. Vous les gérez comme une équipe. Ils font le reste.
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 40, flexWrap: "wrap" }}>
              <button onClick={() => scrollTo("agents")} style={{ background: C.lime, color: C.ink, border: 0, padding: "15px 28px", borderRadius: 4, fontFamily: F.sans, fontSize: 15, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 10 }}>
                Découvrir l&apos;équipe <Ico name="arrow-right" size={16} />
              </button>
              <button onClick={() => scrollTo("cta-final")} style={{ background: "transparent", color: C.ink, border: `1px solid ${C.ink}`, padding: "14px 26px", borderRadius: 4, fontFamily: F.sans, fontSize: 15, fontWeight: 500, cursor: "pointer" }}>
                Réserver une démo · 30 min
              </button>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: C.slate, letterSpacing: "0.06em", textTransform: "uppercase", marginLeft: 6 }}>7 jours gratuits · sans CB</span>
            </div>
            <div style={{ marginTop: 72, paddingTop: 24, borderTop: `1px solid ${C.mist}`, display: "flex", alignItems: "center", gap: 48, fontFamily: F.mono, fontSize: 12, color: C.slate, textTransform: "uppercase", letterSpacing: "0.06em", flexWrap: "wrap", rowGap: 14 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: "#74A800", boxShadow: "0 0 0 4px rgba(116,168,0,.18)", display: "inline-block" }} />
                <span style={{ color: C.ink }}>2 341 tâches terminées cette heure</span>
              </span>
              <span>98,4 % de précision dès le premier passage</span>
              <span>140+ entreprises actives</span>
              <span style={{ marginLeft: "auto", color: C.fog }}>v 4.2 · Printemps 2026</span>
            </div>
          </Container>
        </section>

        {/* ── LOGO WALL ─────────────────────────────────────────── */}
        <section style={{ background: C.bone, padding: "48px 0 64px", borderTop: `1px solid ${C.mist}` }}>
          <Container>
            <Eyebrow style={{ marginBottom: 32, textAlign: "center" }}>§ ILS ONT FAIT CONFIANCE À AGENTCONCEPTOR · 140 ENTREPRISES · 5 PAYS</Eyebrow>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", borderTop: `1px solid ${C.mist}`, borderLeft: `1px solid ${C.mist}` }}>
              {LOGOS.map(l => (
                <div key={l} style={{ padding: "28px 24px", borderRight: `1px solid ${C.mist}`, borderBottom: `1px solid ${C.mist}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontStyle: "italic", fontSize: 22, color: C.slate, letterSpacing: "-0.005em", minHeight: 88, opacity: 0.85 }}>{l}</div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── AGENT ROSTER ──────────────────────────────────────── */}
        <section id="agents" style={{ background: C.bone, borderTop: `1px solid ${C.mist}`, padding: "112px 0" }}>
          <Container>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 56, gap: 32, flexWrap: "wrap" }}>
              <div>
                <Eyebrow style={{ marginBottom: 14 }}>§ L'ÉQUIPE · 5 AGENTS · DE NOUVEAUX CHAQUE MOIS</Eyebrow>
                <h2 style={{ fontFamily: F.display, fontSize: 72, lineHeight: 1.1, letterSpacing: "-0.02em", color: C.ink, margin: 0, fontWeight: 400, maxWidth: 800 }}>
                  Une petite équipe de spécialistes, <span style={{ fontStyle: "italic" }}>chacun nommé d&apos;après son métier.</span>
                </h2>
              </div>
              <a href="#" style={{ fontFamily: F.sans, fontSize: 14, color: C.ink, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", borderBottom: `1px solid ${C.ink}`, paddingBottom: 2, whiteSpace: "nowrap" }}>
                Voir les 12 agents <Ico name="arrow-up-right" size={14} />
              </a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
              {AGENTS.slice(0, 3).map(a => <AgentCard key={a.id} agent={a} onClick={() => setHiring(a)} />)}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20, marginTop: 20 }}>
              {AGENTS.slice(3).map(a => <AgentCard key={a.id} agent={a} onClick={() => setHiring(a)} />)}
            </div>
          </Container>
        </section>

        {/* ── CAPABILITIES ─────────────────────────────────────── */}
        <section id="capacites" style={{ background: C.paper, borderTop: `1px solid ${C.mist}`, padding: "112px 0" }}>
          <Container>
            <Eyebrow style={{ marginBottom: 14 }}>§ CE QUI REND NOS AGENTS DIFFÉRENTS</Eyebrow>
            <h2 style={{ fontFamily: F.display, fontSize: 64, lineHeight: 1.1, letterSpacing: "-0.015em", color: C.ink, margin: "0 0 64px", fontWeight: 400, maxWidth: 920 }}>
              Pas un chatbot. Un <span style={{ fontStyle: "italic" }}>collaborateur</span> avec un poste.
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 0, borderTop: `1px solid ${C.mist}` }}>
              {CAPS.map((c, i) => (
                <div key={c.n} style={{ padding: "36px 36px 36px 0", paddingLeft: i % 2 === 0 ? 0 : 36, borderRight: i % 2 === 0 ? `1px solid ${C.mist}` : "none", borderBottom: i < 2 ? `1px solid ${C.mist}` : "none", display: "flex", flexDirection: "column", gap: 26 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    <Ico name={c.icon} size={28} />
                    <span style={{ fontFamily: F.mono, fontSize: 12, color: C.fog, letterSpacing: "0.08em" }}>{c.n} / 04</span>
                  </div>
                  <h3 style={{ fontFamily: F.display, fontSize: 36, lineHeight: 1.1, letterSpacing: "-0.01em", color: C.ink, margin: 0, fontWeight: 400, maxWidth: 460 }}>{c.t}</h3>
                  <p style={{ fontFamily: F.sans, fontSize: 16, lineHeight: 1.6, color: C.slate, margin: 0, maxWidth: 480 }}>{c.b}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── HOW IT WORKS ──────────────────────────────────────── */}
        <section id="fonctionnement" style={{ background: C.bone, borderTop: `1px solid ${C.mist}`, padding: "112px 0" }}>
          <Container>
            <Eyebrow style={{ marginBottom: 14 }}>§ COMMENT ÇA MARCHE</Eyebrow>
            <h2 style={{ fontFamily: F.display, fontSize: 64, lineHeight: 1, letterSpacing: "-0.015em", color: C.ink, margin: "0 0 64px", fontWeight: 400, maxWidth: 800 }}>
              De l&apos;inscription au premier run, <span style={{ fontStyle: "italic" }}>sept minutes.</span>
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderTop: `1px solid ${C.mist}` }}>
              {[
                { n: "01", title: "Vous choisissez un agent", body: "Parcourez l'équipe. Lisez ce que chaque agent fait. Regardez une démo de 30 s sur des données fictives." },
                { n: "02", title: "Vous connectez ses outils", body: "Astra a besoin de Gmail et Pennylane. Mira de Salesforce. OAuth en un clic. Permissions cadrées. Audit log dès le départ." },
                { n: "03", title: "Vous regardez sa première journée", body: "Pendant 7 jours, chaque action est en attente de votre validation. Approuvez, modifiez, annulez. Ensuite, l'agent travaille seul." },
              ].map((s, i) => (
                <div key={s.n} style={{ padding: "32px 32px 32px 0", borderRight: i < 2 ? `1px solid ${C.mist}` : "none", paddingLeft: i === 0 ? 0 : 32 }}>
                  <div style={{ fontFamily: F.mono, fontSize: 12, color: C.fog, letterSpacing: "0.06em", marginBottom: 24 }}>{s.n} / 03</div>
                  <h3 style={{ fontFamily: F.sans, fontSize: 24, fontWeight: 500, color: C.ink, margin: "0 0 12px", letterSpacing: "-0.005em" }}>{s.title}</h3>
                  <p style={{ fontFamily: F.sans, fontSize: 15, lineHeight: 1.6, color: C.slate, margin: 0 }}>{s.body}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── INTEGRATIONS ─────────────────────────────────────── */}
        <section id="integrations" style={{ background: C.paper, borderTop: `1px solid ${C.mist}`, padding: "112px 0" }}>
          <Container>
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 56, gap: 32, flexWrap: "wrap" }}>
              <div>
                <Eyebrow style={{ marginBottom: 14 }}>§ INTÉGRATIONS · 200+ OUTILS</Eyebrow>
                <h2 style={{ fontFamily: F.display, fontSize: 64, lineHeight: 1.1, letterSpacing: "-0.015em", color: C.ink, margin: 0, fontWeight: 400, maxWidth: 760 }}>
                  Vos agents parlent <span style={{ fontStyle: "italic" }}>déjà</span> votre stack.
                </h2>
              </div>
              <a href="#" style={{ fontFamily: F.sans, fontSize: 14, color: C.ink, textDecoration: "none", borderBottom: `1px solid ${C.ink}`, paddingBottom: 2, whiteSpace: "nowrap" }}>Demander une intégration →</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", borderTop: `1px solid ${C.mist}`, borderLeft: `1px solid ${C.mist}` }}>
              {INTEGRATIONS.map(cat => (
                <div key={cat.h} style={{ padding: 28, borderRight: `1px solid ${C.mist}`, borderBottom: `1px solid ${C.mist}` }}>
                  <Eyebrow style={{ marginBottom: 16 }}>{cat.h}</Eyebrow>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                    {cat.items.map(i => (
                      <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: F.sans, fontSize: 14, color: C.ink }}>
                        <Ico name="check" size={14} style={{ opacity: 0.6 }} /> {i}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── COMPARISON ───────────────────────────────────────── */}
        <section style={{ background: C.bone, borderTop: `1px solid ${C.mist}`, padding: "112px 0" }}>
          <Container>
            <Eyebrow style={{ marginBottom: 14 }}>§ AGENTCONCEPTOR VS. LES ALTERNATIVES</Eyebrow>
            <h2 style={{ fontFamily: F.display, fontSize: 64, lineHeight: 1.1, letterSpacing: "-0.015em", color: C.ink, margin: "0 0 56px", fontWeight: 400, maxWidth: 920 }}>
              Le travail opérationnel, <span style={{ fontStyle: "italic" }}>trois façons</span> de le couvrir.
            </h2>
            <div style={{ background: C.paper, border: `1px solid ${C.mist}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", padding: "20px 24px", borderBottom: `1px solid ${C.mist}`, background: C.bone }}>
                <div />
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <img src="/ac-mark.svg" width={20} height={20} alt="" />
                  <span style={{ fontFamily: F.display, fontSize: 18, color: C.ink }}>AgentConceptor</span>
                </div>
                <div style={{ fontFamily: F.sans, fontSize: 14, color: C.slate }}>Embauche interne</div>
                <div style={{ fontFamily: F.sans, fontSize: 14, color: C.slate }}>Cabinet de conseil</div>
              </div>
              {COMPARISON.map((r, i) => (
                <div key={r.l} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", padding: "18px 24px", alignItems: "center", borderBottom: i < COMPARISON.length - 1 ? `1px solid ${C.mist}` : 0 }}>
                  <div style={{ fontFamily: F.sans, fontSize: 14, color: C.slate }}>{r.l}</div>
                  <div style={{ fontFamily: F.sans, fontSize: 15, color: C.ink, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <Ico name="check" size={14} /> {r.a}
                  </div>
                  <div style={{ fontFamily: F.sans, fontSize: 14, color: C.slate }}>{r.b}</div>
                  <div style={{ fontFamily: F.sans, fontSize: 14, color: C.slate }}>{r.c}</div>
                </div>
              ))}
            </div>
          </Container>
        </section>

        {/* ── PULL QUOTE ───────────────────────────────────────── */}
        <section style={{ background: C.ink, padding: "128px 0" }}>
          <Container>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2.4fr", gap: 64, alignItems: "start" }}>
              <div><Eyebrow color={C.fog}>§ CLIENT · 14 MOIS APRÈS</Eyebrow></div>
              <div>
                <blockquote style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 56, lineHeight: 1.1, letterSpacing: "-0.01em", color: C.bone, margin: 0 }}>
                  « On a remplacé trois prestataires par Astra. Six semaines plus tard, notre équipe compta ne fait plus de compta — ils font du contrôle de gestion, qui est le travail pour lequel on les avait embauchés. »
                </blockquote>
                <div style={{ marginTop: 36, display: "flex", alignItems: "center", gap: 16 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 999, background: C.lime, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontStyle: "italic", fontSize: 24, color: C.ink }}>R</div>
                  <div>
                    <div style={{ fontFamily: F.sans, fontSize: 15, color: C.bone }}>Rachel Quintero</div>
                    <div style={{ fontFamily: F.mono, fontSize: 11, color: C.fog, letterSpacing: "0.06em", textTransform: "uppercase" }}>Directrice administrative · Quanta Logistics · 240 personnes</div>
                  </div>
                </div>
              </div>
            </div>
          </Container>
        </section>

        {/* ── SECURITY ─────────────────────────────────────────── */}
        <section id="securite" style={{ background: C.paper, borderTop: `1px solid ${C.mist}`, padding: "112px 0" }}>
          <Container>
            <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.6fr", gap: 80, alignItems: "start" }}>
              <div>
                <Eyebrow style={{ marginBottom: 14 }}>§ SÉCURITÉ & CONFORMITÉ</Eyebrow>
                <h2 style={{ fontFamily: F.display, fontSize: 56, lineHeight: 1.1, letterSpacing: "-0.015em", color: C.ink, margin: "0 0 24px", fontWeight: 400 }}>
                  Construit pour les <span style={{ fontStyle: "italic" }}>directions financières</span> exigeantes.
                </h2>
                <p style={{ fontFamily: F.sans, fontSize: 15, lineHeight: 1.6, color: C.slate, margin: "0 0 32px" }}>Vous donnez accès à vos systèmes critiques. Vous méritez plus qu&apos;une page « sécurité » qui dit du vent.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {["SOC 2 Type II", "RGPD", "ISO 27001", "Hébergement UE"].map(b => (
                    <span key={b} style={{ padding: "6px 12px", border: `1px solid ${C.ink}`, borderRadius: 4, fontFamily: F.mono, fontSize: 11, color: C.ink, textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap" }}>{b}</span>
                  ))}
                </div>
                <a href="#" style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 28, fontFamily: F.sans, fontSize: 14, color: C.ink, textDecoration: "none", borderBottom: `1px solid ${C.ink}`, paddingBottom: 2 }}>
                  Télécharger le livre blanc sécurité <Ico name="external-link" size={13} />
                </a>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderTop: `1px solid ${C.mist}`, borderLeft: `1px solid ${C.mist}` }}>
                {[
                  { t: "Chiffrement de bout en bout", b: "AES-256 au repos, TLS 1.3 en transit. Vos données ne quittent jamais l'UE." },
                  { t: "Permissions cadrées",          b: "Chaque agent reçoit le minimum d'accès dont il a besoin. OAuth scoped, jamais de mot de passe partagé." },
                  { t: "Audit log immuable",           b: "Chaque action est tracée, horodatée, exportable. Conservée 7 ans par défaut." },
                  { t: "Effacement en un clic",        b: "Vous résiliez ? Vos données sont supprimées sous 30 jours. Certificat de destruction sur demande." },
                ].map(p => (
                  <div key={p.t} style={{ padding: 28, borderRight: `1px solid ${C.mist}`, borderBottom: `1px solid ${C.mist}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <Ico name="shield" size={18} />
                      <h3 style={{ fontFamily: F.sans, fontSize: 16, fontWeight: 500, color: C.ink, margin: 0 }}>{p.t}</h3>
                    </div>
                    <p style={{ fontFamily: F.sans, fontSize: 14, lineHeight: 1.6, color: C.slate, margin: 0 }}>{p.b}</p>
                  </div>
                ))}
              </div>
            </div>
          </Container>
        </section>

        {/* ── PRICING ──────────────────────────────────────────── */}
        <section id="tarifs" style={{ background: C.bone, borderTop: `1px solid ${C.mist}`, padding: "112px 0" }}>
          <Container>
            <Eyebrow style={{ marginBottom: 14 }}>§ TARIFS · SANS ENGAGEMENT · TVA EN SUS</Eyebrow>
            <h2 style={{ fontFamily: F.display, fontSize: 64, lineHeight: 1.1, letterSpacing: "-0.015em", color: C.ink, margin: "0 0 48px", fontWeight: 400 }}>
              Vous payez par <span style={{ fontStyle: "italic" }}>agent.</span> Ils paient <span style={{ fontStyle: "italic" }}>leurs</span> propres factures.
            </h2>
            <p style={{ fontFamily: F.sans, fontSize: 16, color: C.slate, margin: "0 0 56px", maxWidth: 620 }}>7 jours d&apos;essai gratuit sur toutes les offres. Aucune carte demandée pour commencer.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
              {TIERS.map(t => (
                <div key={t.id} style={{ background: t.accent ? C.ink : C.paper, color: t.accent ? C.bone : C.ink, border: t.accent ? `1px solid ${C.ink}` : `1px solid ${C.mist}`, borderRadius: 8, padding: 32, display: "flex", flexDirection: "column", gap: 24, minHeight: 500, position: "relative" }}>
                  {t.accent && <span style={{ position: "absolute", top: -10, right: 24, background: C.lime, color: C.ink, padding: "4px 10px", borderRadius: 999, fontFamily: F.mono, fontSize: 10, fontWeight: 500, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>Le plus populaire</span>}
                  <div>
                    <div style={{ fontFamily: F.mono, fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: t.accent ? C.fog : C.slate, marginBottom: 12 }}>{t.name}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: F.display, fontSize: t.price.includes("€") ? 56 : 44, lineHeight: 1.1, letterSpacing: "-0.02em", whiteSpace: "nowrap" }}>{t.price}</span>
                      <span style={{ fontFamily: F.mono, fontSize: 12, color: t.accent ? C.fog : C.slate, whiteSpace: "nowrap" }}>{t.per}</span>
                    </div>
                  </div>
                  <p style={{ fontFamily: F.sans, fontSize: 14, lineHeight: 1.55, color: t.accent ? C.bone : C.slate, margin: 0 }}>{t.who}</p>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10, flexGrow: 1 }}>
                    {t.features.map(f => (
                      <li key={f} style={{ display: "flex", alignItems: "flex-start", gap: 10, fontFamily: F.sans, fontSize: 14 }}>
                        <span style={{ marginTop: 4, width: 14, height: 14, borderRadius: 999, background: t.accent ? C.lime : C.ink, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <span style={{ width: 6, height: 6, borderRadius: 999, background: t.accent ? C.ink : C.bone, display: "block" }} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => t.id === "org" ? window.location.href = "mailto:contact@agentconceptor.com?subject=Demande%20devis%20Organisation" : setSignInOpen(true)} style={{ background: t.accent ? C.lime : "transparent", color: C.ink, border: t.accent ? 0 : `1px solid ${C.ink}`, padding: "12px 18px", borderRadius: 4, fontFamily: F.sans, fontSize: 14, fontWeight: 500, cursor: "pointer", marginTop: "auto", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {t.cta} <Ico name="arrow-right" size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 32, fontFamily: F.mono, fontSize: 11, color: C.slate, textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center" }}>
              Paiement sécurisé via Stripe · Annulable en un clic · Facture mensuelle
            </div>
          </Container>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────── */}
        <section id="faq" style={{ background: C.paper, borderTop: `1px solid ${C.mist}`, padding: "112px 0" }}>
          <Container>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.8fr", gap: 80, alignItems: "start" }}>
              <div style={{ position: "sticky", top: 100 }}>
                <Eyebrow style={{ marginBottom: 14 }}>§ FAQ · 8 QUESTIONS · 2 MIN</Eyebrow>
                <h2 style={{ fontFamily: F.display, fontSize: 56, lineHeight: 1.05, letterSpacing: "-0.015em", color: C.ink, margin: 0, fontWeight: 400 }}>
                  On vous voit <span style={{ fontStyle: "italic" }}>venir.</span>
                </h2>
                <p style={{ fontFamily: F.sans, fontSize: 15, color: C.slate, marginTop: 40 }}>
                  Une question qui n&apos;est pas là ?{" "}<br />
                  <a href="mailto:contact@agentconceptor.com" style={{ color: C.ink, textDecoration: "underline" }}>contact@agentconceptor.com</a>
                </p>
              </div>
              <div>
                {FAQS.map((it, i) => <FAQItem key={i} q={it.q} a={it.a} defaultOpen={i === 0} />)}
              </div>
            </div>
          </Container>
        </section>

        {/* ── FINAL CTA ────────────────────────────────────────── */}
        <section id="cta-final" style={{ background: C.ink, padding: "128px 0", position: "relative", overflow: "hidden" }}>
          <div aria-hidden style={{ position: "absolute", inset: 0, backgroundImage: "url(/ac-blueprint-bg.svg)", backgroundSize: "900px 450px", backgroundPosition: "right -100px center", backgroundRepeat: "no-repeat", opacity: 0.06, filter: "invert(1)", pointerEvents: "none" }} />
          <Container style={{ position: "relative" }}>
            <Eyebrow color={C.fog} style={{ marginBottom: 22 }}>§ ON Y VA ?</Eyebrow>
            <h2 style={{ fontFamily: F.display, fontSize: 112, lineHeight: 1.02, letterSpacing: "-0.025em", color: C.bone, margin: "0 0 28px", fontWeight: 400, maxWidth: 1080 }}>
              Sept minutes.<br /><span style={{ fontStyle: "italic" }}>Un agent qui travaille.</span>
            </h2>
            <p style={{ fontFamily: F.sans, fontSize: 20, lineHeight: 1.55, color: C.fog, maxWidth: 580, margin: "0 0 40px" }}>
              Connectez-vous avec Google, choisissez un agent, lancez son premier run sur des données fictives. Aucune carte demandée.
            </p>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <button onClick={() => setSignInOpen(true)} style={{ background: C.lime, color: C.ink, border: 0, padding: "15px 26px 15px 22px", borderRadius: 4, fontFamily: F.sans, fontSize: 15, fontWeight: 500, cursor: "pointer", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: 12 }}>
                <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z"/>
                </svg>
                Commencer avec Google
              </button>
              <a href="mailto:contact@agentconceptor.com?subject=Demande%20de%20d%C3%A9mo" style={{ background: "transparent", color: C.bone, border: `1px solid ${C.bone}`, padding: "14px 26px", borderRadius: 4, fontFamily: F.sans, fontSize: 15, fontWeight: 500, whiteSpace: "nowrap", textDecoration: "none" }}>
                Réserver une démo · 30 min
              </a>
              <span style={{ fontFamily: F.mono, fontSize: 11, color: C.fog, letterSpacing: "0.06em", textTransform: "uppercase", marginLeft: 8 }}>7 jours gratuits · Annulable en un clic</span>
            </div>
          </Container>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────── */}
        <footer style={{ background: C.bone, borderTop: `1px solid ${C.mist}` }}>
          <Container style={{ padding: "72px 32px 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "2.2fr 1fr 1fr 1fr 1fr", gap: 48 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}>
                  <img src="/ac-mark.svg" width={36} height={36} alt="" />
                  <span style={{ fontFamily: F.display, fontSize: 26, color: C.ink, letterSpacing: "-0.01em" }}>AgentConceptor</span>
                </div>
                <p style={{ fontFamily: F.display, fontStyle: "italic", fontSize: 22, lineHeight: 1.25, color: C.ink, margin: "0 0 22px", maxWidth: 360 }}>Des agents qui agissent.</p>
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: F.mono, fontSize: 11, color: C.slate, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>Recevez nos notes — 1× par mois.</div>
                  <form onSubmit={e => { e.preventDefault(); alert("Inscription enregistrée — merci."); }} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <input type="email" required placeholder="vous@entreprise.fr" style={{ flex: 1, padding: "10px 12px", border: `1px solid ${C.mist}`, borderRadius: 4, background: C.paper, fontFamily: F.sans, fontSize: 13, color: C.ink, outline: "none", maxWidth: 260 }} />
                    <button type="submit" style={{ background: C.ink, color: C.bone, border: 0, padding: "10px 16px", borderRadius: 4, fontFamily: F.sans, fontSize: 13, fontWeight: 500, cursor: "pointer" }}>S&apos;inscrire ↗</button>
                  </form>
                </div>
              </div>
              {FOOTER_COLS.map(col => (
                <div key={col.h}>
                  <Eyebrow style={{ marginBottom: 18 }}>{col.h}</Eyebrow>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
                    {col.items.map(i => (
                      <li key={i.l}><a href={i.href} style={{ fontFamily: F.sans, fontSize: 13, color: C.ink, textDecoration: "none" }}>{i.l}</a></li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <Rule style={{ marginTop: 64 }} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 24, fontFamily: F.mono, fontSize: 11, color: C.slate, textTransform: "uppercase", letterSpacing: "0.06em", flexWrap: "wrap", gap: 16 }}>
              <span>© AgentConceptor SAS · 2026 · Paris</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: "#74A800", display: "inline-block" }} />
                Tous les systèmes opérationnels
              </span>
            </div>
          </Container>
        </footer>

        {/* ── MODALS ───────────────────────────────────────────── */}
        <HireModal agent={hiring} onClose={() => setHiring(null)} onProceed={() => { setHiring(null); scrollTo("tarifs"); }} />
        <SignInModal open={signInOpen} onClose={() => setSignInOpen(false)} />
      </div>
    </>
  );
}
