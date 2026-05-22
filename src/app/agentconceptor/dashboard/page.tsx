"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Head from "next/head";

/* ─── Design tokens (miroir exact de site 3 / styles.css) ─── */
const C = {
  ink:     "#0B0B0D",
  slate:   "#4A4A52",
  fog:     "#C9C5BC",
  mist:    "#E8E4DA",
  bone:    "#F5F1E8",
  paper:   "#FFFFFF",
  lime:    "#C8FF3D",
  limeDeep:"#A8DD20",
  clay:    "#E6533C",
} as const;

const F = {
  display: "'Instrument Serif', 'Cormorant Garamond', Georgia, serif",
  sans:    "'Geist', 'Inter', system-ui, sans-serif",
  mono:    "'Geist Mono', 'JetBrains Mono', ui-monospace, monospace",
} as const;

/* ─── Agents (copie exacte depuis AgentRoster.js) ─── */
const AGENTS = [
  { id:"astra",  name:"Astra",  job:"Saisie comptable",   one:"Lit votre boîte mail partagée, code chaque facture sur le bon compte, route pour validation.", metric:"412 factures / semaine", stack:["Gmail","Pennylane","Slack"] },
  { id:"cassio", name:"Cassio", job:"Revue de contrats",  one:"Surveille DocuSign à l'arrivée des contrats, alerte sur les clauses inhabituelles selon votre playbook.", metric:"38 contrats / semaine", stack:["DocuSign","Notion","Slack"] },
  { id:"mira",   name:"Mira",   job:"Hygiène du CRM",     one:"Garde Salesforce propre. Déduplique les comptes, enrichit les leads, corrige les étapes stagnantes.", metric:"11 400 fiches / semaine", stack:["Salesforce","Apollo","Dropcontact"] },
  { id:"orion",  name:"Orion",  job:"Triage du support",  one:"Lit les tickets entrants, les catégorise, route vers la bonne équipe, rédige une première réponse.", metric:"1 820 tickets / semaine", stack:["Zendesk","Linear","Slack"] },
  { id:"halden", name:"Halden", job:"Recrutement",        one:"Filtre les candidatures selon votre grille, planifie les premiers entretiens, envoie les refus avec tact.", metric:"240 candidats / semaine", stack:["Greenhouse","Gmail","Calendly"] },
] as const;

/* ─── Packs (miroir de Pricing.js) ─── */
const PACKS = [
  { id:"solo",  name:"Solo",         price:"199 €", per:"/agent/mois",  accent:false, who:"Un agent. Une mission. Jusqu'à 2 000 tâches par mois.", features:["1 agent","2 000 tâches / mois","Support par e-mail","Audit log","Annulable à tout moment"],             cta:"Démarrer l'essai" },
  { id:"team",  name:"Équipe",       price:"1 200 €", per:"/mois",      accent:true,  who:"Jusqu'à 5 agents qui collaborent, boîtes partagées et transferts entre eux.", features:["Jusqu'à 5 agents","25 000 tâches / mois","Slack + audit log","Playbooks personnalisés","Support prioritaire 9-18h"], cta:"Embaucher mon premier agent" },
  { id:"org",   name:"Organisation", price:"Sur devis", per:"",         accent:false, who:"Agents illimités, SSO, VPC, infra dédiée, toute l'équipe.", features:["Agents illimités","Tâches illimitées","SSO + SCIM","Déploiement VPC","CSM dédié"],                   cta:"Parler à un commercial" },
] as const;

/* ─── Modal "bientôt disponible" ─── */
function Modal({ agent, onClose }: { agent: typeof AGENTS[number] | null; onClose: () => void }) {
  if (!agent) return null;
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(11,11,13,0.55)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }} onClick={onClose}>
      <div style={{ background:C.paper, borderRadius:8, padding:"48px 40px", maxWidth:480, width:"100%", position:"relative" }} onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", cursor:"pointer", padding:4, color:C.slate, fontSize:20, lineHeight:1 }}>×</button>
        <div style={{ fontFamily:F.mono, fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", color:C.slate, marginBottom:16 }}>§ AGENT · {agent.job}</div>
        <h2 style={{ fontFamily:F.display, fontSize:40, lineHeight:1.1, letterSpacing:"-0.02em", color:C.ink, margin:"0 0 16px", fontWeight:400 }}>
          {agent.name} arrive <span style={{ fontStyle:"italic" }}>bientôt.</span>
        </h2>
        <p style={{ fontFamily:F.sans, fontSize:15, lineHeight:1.6, color:C.slate, margin:"0 0 32px" }}>
          Cet agent est en cours de configuration. Contactez-nous pour être notifié en priorité dès son lancement.
        </p>
        <a
          href="mailto:contact@agentconceptor.com?subject=Intéressé par l'agent"
          style={{ display:"inline-block", background:C.lime, color:C.ink, padding:"14px 28px", borderRadius:4, fontFamily:F.sans, fontSize:14, fontWeight:500, textDecoration:"none" }}
        >
          Être notifié en priorité →
        </a>
      </div>
    </div>
  );
}

/* ─── Carte agent ─── */
function AgentCard({ agent, onHire }: { agent: typeof AGENTS[number]; onHire: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <article
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onHire}
      style={{
        background: C.paper,
        border: `1px solid ${hover ? "rgba(11,11,13,0.22)" : C.mist}`,
        borderRadius: 8,
        padding: 28,
        cursor: "pointer",
        transition: "border-color 200ms ease, transform 200ms ease",
        transform: hover ? "translateY(-2px)" : "none",
        display: "flex",
        flexDirection: "column",
        gap: 20,
        minHeight: 260,
      }}
    >
      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <img src={`/agentconceptor/agents/${agent.id}.svg`} width={52} height={52} alt="" onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <span style={{ fontFamily:F.mono, fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase", color:C.slate, background:C.bone, padding:"4px 10px", borderRadius:999 }}>
          {agent.metric}
        </span>
      </div>
      {/* Name + job */}
      <div>
        <div style={{ fontFamily:F.display, fontSize:36, lineHeight:1.1, letterSpacing:"-0.015em", color:C.ink, marginBottom:4 }}>{agent.name}</div>
        <div style={{ fontFamily:F.mono, fontSize:10, color:C.slate, letterSpacing:"0.06em", textTransform:"uppercase" }}>§ {agent.job}</div>
      </div>
      {/* Description */}
      <p style={{ fontFamily:F.sans, fontSize:13, lineHeight:1.6, color:C.slate, margin:0, flexGrow:1 }}>{agent.one}</p>
      {/* Footer */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", paddingTop:16, borderTop:`1px solid ${C.mist}` }}>
        <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
          {agent.stack.map(s => (
            <span key={s} style={{ fontFamily:F.mono, fontSize:10, color:C.slate, padding:"2px 8px", border:`1px solid ${C.mist}`, borderRadius:999, letterSpacing:"0.04em", textTransform:"uppercase" }}>{s}</span>
          ))}
        </div>
        <span style={{ fontFamily:F.sans, fontSize:13, color:C.ink, fontWeight:500 }}>Embaucher →</span>
      </div>
    </article>
  );
}

/* ─── Carte pack ─── */
function PackCard({ pack, onSelect }: { pack: typeof PACKS[number]; onSelect: () => void }) {
  const dark = pack.accent;
  return (
    <div style={{
      background: dark ? C.ink : C.paper,
      color: dark ? C.bone : C.ink,
      border: `1px solid ${dark ? C.ink : C.mist}`,
      borderRadius: 8,
      padding: 32,
      display: "flex",
      flexDirection: "column",
      gap: 24,
      position: "relative",
    }}>
      {dark && (
        <span style={{ position:"absolute", top:-11, right:20, background:C.lime, color:C.ink, fontFamily:F.mono, fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase", padding:"4px 10px", borderRadius:2 }}>
          Recommandé
        </span>
      )}
      <div>
        <div style={{ fontFamily:F.mono, fontSize:10, letterSpacing:"0.08em", textTransform:"uppercase", color:dark ? C.fog : C.slate, marginBottom:12 }}>§ {pack.name.toUpperCase()}</div>
        <div style={{ fontFamily:F.display, fontSize:48, lineHeight:1, letterSpacing:"-0.02em", color:dark ? C.bone : C.ink, fontWeight:400 }}>{pack.price}</div>
        {pack.per && <div style={{ fontFamily:F.sans, fontSize:13, color:dark ? C.fog : C.slate, marginTop:4 }}>{pack.per}</div>}
      </div>
      <p style={{ fontFamily:F.sans, fontSize:13, lineHeight:1.6, color:dark ? C.fog : C.slate, margin:0 }}>{pack.who}</p>
      <ul style={{ listStyle:"none", margin:0, padding:0, display:"flex", flexDirection:"column", gap:10 }}>
        {pack.features.map(f => (
          <li key={f} style={{ fontFamily:F.sans, fontSize:13, color:dark ? C.bone : C.ink, display:"flex", gap:10, alignItems:"flex-start" }}>
            <span style={{ color:C.lime, flexShrink:0, marginTop:2 }}>✓</span> {f}
          </li>
        ))}
      </ul>
      <button
        onClick={onSelect}
        style={{
          marginTop:"auto",
          background: dark ? C.lime : "transparent",
          color: dark ? C.ink : C.ink,
          border: dark ? "none" : `1px solid ${C.mist}`,
          padding: "14px 20px",
          borderRadius: 4,
          fontFamily: F.sans,
          fontSize: 14,
          fontWeight: 500,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {pack.cta} →
      </button>
    </div>
  );
}

/* ─── Page principale ─── */
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; name?: string; avatar?: string } | null>(null);
  const [tab, setTab] = useState<"agents"|"packs"|"parametres">("agents");
  const [hiredAgent, setHiredAgent] = useState<typeof AGENTS[number] | null>(null);
  const [trialDaysLeft, setTrialDaysLeft] = useState(7);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* Charge les polices Google (Instrument Serif + Geist + Geist Mono) */
  useEffect(() => {
    const id = "agentconceptor-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Geist:wght@300;400;500;600;700&family=Geist+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);

  /* Auth guard */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session?.user) {
        router.replace("/agentconceptor");
        return;
      }
      const u = data.session.user;
      setUser({
        email: u.email || "",
        name: u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Vous",
        avatar: u.user_metadata?.avatar_url || u.user_metadata?.picture || undefined,
      });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session) router.replace("/agentconceptor");
    });
    return () => subscription.unsubscribe();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/agentconceptor");
  };

  if (!user) {
    return (
      <div style={{ minHeight:"100vh", background:C.bone, display:"flex", alignItems:"center", justifyContent:"center" }}>
        <img src="/agentconceptor/mark.svg" width={40} height={40} alt="" style={{ animation:"pulse 1.4s ease-in-out infinite", opacity:0.6 }} />
        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>
      </div>
    );
  }

  const NAV = [
    { id:"agents",    label:"Mes agents",           icon:"bot" },
    { id:"packs",     label:"Packs automatisation",  icon:"workflow" },
    { id:"parametres",label:"Paramètres",            icon:"settings" },
  ] as const;

  const SIDEBAR_W = 248;

  return (
    <div style={{ minHeight:"100vh", background:C.bone, display:"flex", fontFamily:F.sans }}>
      {/* ── SIDEBAR ── */}
      <aside style={{
        width: SIDEBAR_W,
        minWidth: SIDEBAR_W,
        background: C.ink,
        display: "flex",
        flexDirection: "column",
        position: "sticky",
        top: 0,
        height: "100vh",
        overflowY: "auto",
      }}>
        {/* Logo */}
        <div style={{ padding:"24px 24px 20px", borderBottom:`1px solid rgba(255,255,255,0.08)` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <img src="/agentconceptor/mark.svg" width={28} height={28} alt="AgentConceptor" onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
            <div>
              <div style={{ fontFamily:F.sans, fontSize:13, fontWeight:600, color:C.bone, letterSpacing:"-0.01em" }}>AgentConceptor</div>
              <div style={{ fontFamily:F.mono, fontSize:9, color:C.fog, letterSpacing:"0.06em", textTransform:"uppercase" }}>Dashboard</div>
            </div>
          </div>
        </div>

        {/* Trial banner */}
        <div style={{ margin:"16px 12px 0", background:"rgba(200,255,61,0.12)", border:"1px solid rgba(200,255,61,0.25)", borderRadius:6, padding:"10px 14px" }}>
          <div style={{ fontFamily:F.mono, fontSize:10, color:C.lime, letterSpacing:"0.06em", textTransform:"uppercase", marginBottom:4 }}>Essai gratuit</div>
          <div style={{ fontFamily:F.sans, fontSize:12, color:C.fog }}>
            <span style={{ color:C.lime, fontWeight:600 }}>{trialDaysLeft} jours</span> restants · Annulable à tout moment
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:"16px 12px" }}>
          {NAV.map(item => {
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id as typeof tab)}
                style={{
                  display:"flex", alignItems:"center", gap:10,
                  width:"100%", padding:"10px 12px", borderRadius:6, marginBottom:2,
                  background: active ? "rgba(255,255,255,0.08)" : "transparent",
                  border: "none", cursor:"pointer",
                  color: active ? C.bone : C.fog,
                  fontFamily: F.sans, fontSize:14,
                  textAlign:"left", transition:"background 150ms ease, color 150ms ease",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.05)"; (e.currentTarget as HTMLElement).style.color = C.bone; }}
                onMouseLeave={e => { if (!active) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = C.fog; } }}
              >
                <img src={`/agentconceptor/icons/${item.icon}.svg`} width={15} height={15} alt="" style={{ filter:"invert(1)", opacity: active ? 1 : 0.5 }} onError={e => { (e.target as HTMLImageElement).style.display="none"; }} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div style={{ padding:"16px 12px", borderTop:`1px solid rgba(255,255,255,0.08)` }}>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
            {user.avatar ? (
              <img src={user.avatar} width={32} height={32} style={{ borderRadius:"50%", border:"1px solid rgba(255,255,255,0.15)" }} alt="" />
            ) : (
              <div style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,0.12)", display:"flex", alignItems:"center", justifyContent:"center", color:C.bone, fontFamily:F.sans, fontSize:13, fontWeight:600 }}>
                {(user.name?.[0] || user.email[0]).toUpperCase()}
              </div>
            )}
            <div style={{ overflow:"hidden" }}>
              <div style={{ fontFamily:F.sans, fontSize:13, color:C.bone, fontWeight:500, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.name}</div>
              <div style={{ fontFamily:F.mono, fontSize:10, color:C.fog, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{user.email}</div>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            style={{ width:"100%", padding:"8px 12px", background:"transparent", border:`1px solid rgba(255,255,255,0.12)`, borderRadius:4, color:C.fog, fontFamily:F.sans, fontSize:12, cursor:"pointer", textAlign:"left" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.3)"; (e.currentTarget as HTMLElement).style.color = C.bone; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.12)"; (e.currentTarget as HTMLElement).style.color = C.fog; }}
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <main style={{ flex:1, overflowY:"auto" }}>
        {/* ── TAB: AGENTS ── */}
        {tab === "agents" && (
          <div>
            {/* Header */}
            <div style={{ padding:"48px 48px 0", borderBottom:`1px solid ${C.mist}`, paddingBottom:40 }}>
              <div style={{ fontFamily:F.mono, fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", color:C.slate, marginBottom:14 }}>§ L'ÉQUIPE · 5 AGENTS · DE NOUVEAUX CHAQUE MOIS</div>
              <h1 style={{ fontFamily:F.display, fontSize:64, lineHeight:1.05, letterSpacing:"-0.02em", color:C.ink, margin:0, fontWeight:400 }}>
                Votre équipe <span style={{ fontStyle:"italic" }}>IA.</span>
              </h1>
              <p style={{ fontFamily:F.sans, fontSize:16, color:C.slate, marginTop:20, marginBottom:0, maxWidth:560 }}>
                Chaque agent a un poste, une mission, un périmètre de décision. Cliquez sur un agent pour l'embaucher.
              </p>
            </div>

            {/* Stats strip */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4, 1fr)", borderBottom:`1px solid ${C.mist}` }}>
              {[
                { label:"Agents disponibles", value:"5" },
                { label:"Tâches /semaine", value:"14 000+" },
                { label:"Intégrations", value:"12" },
                { label:"Essai gratuit", value:"7 jours" },
              ].map((stat, i) => (
                <div key={stat.label} style={{ padding:"28px 48px", borderRight: i < 3 ? `1px solid ${C.mist}` : "none" }}>
                  <div style={{ fontFamily:F.display, fontSize:36, lineHeight:1.1, color:C.ink, fontWeight:400 }}>{stat.value}</div>
                  <div style={{ fontFamily:F.sans, fontSize:12, color:C.slate, marginTop:4 }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Agent cards grid (3 + 2) */}
            <div style={{ padding:"40px 48px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:20, marginBottom:20 }}>
                {AGENTS.slice(0, 3).map(a => (
                  <AgentCard key={a.id} agent={a} onHire={() => setHiredAgent(a)} />
                ))}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:20 }}>
                {AGENTS.slice(3).map(a => (
                  <AgentCard key={a.id} agent={a} onHire={() => setHiredAgent(a)} />
                ))}
              </div>
            </div>

            {/* How it works */}
            <div style={{ margin:"0 48px 48px", background:C.paper, border:`1px solid ${C.mist}`, borderRadius:8, overflow:"hidden" }}>
              <div style={{ padding:"32px 32px 24px", borderBottom:`1px solid ${C.mist}` }}>
                <div style={{ fontFamily:F.mono, fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", color:C.slate, marginBottom:12 }}>§ COMMENT ÇA MARCHE</div>
                <div style={{ fontFamily:F.display, fontSize:32, lineHeight:1.1, color:C.ink, fontWeight:400 }}>
                  De l'inscription au premier run, <span style={{ fontStyle:"italic" }}>sept minutes.</span>
                </div>
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)" }}>
                {[
                  { n:"01", t:"Vous choisissez un agent", b:"Parcourez l'équipe. Lisez ce que chaque agent fait. Regardez une démo de 30 s." },
                  { n:"02", t:"Vous connectez ses outils", b:"OAuth en un clic. Permissions cadrées. Audit log dès le départ." },
                  { n:"03", t:"Vous regardez sa première journée", b:"7 jours en mode validation. Ensuite, l'agent travaille seul." },
                ].map((step, i) => (
                  <div key={step.n} style={{ padding:"28px 32px", borderRight: i < 2 ? `1px solid ${C.mist}` : "none" }}>
                    <div style={{ fontFamily:F.mono, fontSize:11, color:C.fog, letterSpacing:"0.06em", marginBottom:16 }}>{step.n}</div>
                    <div style={{ fontFamily:F.sans, fontSize:14, fontWeight:500, color:C.ink, marginBottom:8 }}>{step.t}</div>
                    <div style={{ fontFamily:F.sans, fontSize:13, color:C.slate, lineHeight:1.6 }}>{step.b}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: PACKS ── */}
        {tab === "packs" && (
          <div>
            <div style={{ padding:"48px 48px 0", borderBottom:`1px solid ${C.mist}`, paddingBottom:40 }}>
              <div style={{ fontFamily:F.mono, fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", color:C.slate, marginBottom:14 }}>§ TARIFS · SANS ENGAGEMENT · TVA EN SUS</div>
              <h1 style={{ fontFamily:F.display, fontSize:64, lineHeight:1.05, letterSpacing:"-0.02em", color:C.ink, margin:0, fontWeight:400 }}>
                Vous payez par <span style={{ fontStyle:"italic" }}>agent.</span><br />
                Ils paient <span style={{ fontStyle:"italic" }}>leurs</span> propres factures.
              </h1>
              <p style={{ fontFamily:F.sans, fontSize:16, color:C.slate, marginTop:20, marginBottom:0, maxWidth:560 }}>
                7 jours d'essai gratuit sur toutes les offres. Aucune carte demandée pour commencer.
              </p>
            </div>

            <div style={{ padding:"40px 48px" }}>
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:16, marginBottom:48 }}>
                {PACKS.map(p => (
                  <PackCard
                    key={p.id}
                    pack={p}
                    onSelect={() => { if (p.id === "org") window.open("mailto:contact@agentconceptor.com?subject=Demande devis Organisation"); else setTab("agents"); }}
                  />
                ))}
              </div>

              {/* FAQ rapide */}
              <div style={{ borderTop:`1px solid ${C.mist}`, paddingTop:40 }}>
                <div style={{ fontFamily:F.mono, fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", color:C.slate, marginBottom:24 }}>§ QUESTIONS FRÉQUENTES</div>
                <div style={{ display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:0, borderTop:`1px solid ${C.mist}` }}>
                  {[
                    { q:"Que se passe-t-il après l'essai ?", r:"Vous recevez un e-mail 48h avant la fin. Si vous ne faites rien, l'agent s'arrête." },
                    { q:"Puis-je changer d'offre ?", r:"Oui, à tout moment. La différence est calculée au prorata de la période restante." },
                    { q:"Mes données sont-elles sécurisées ?", r:"Les agents fonctionnent sur votre infra Supabase. Aucune donnée n'est stockée chez nous." },
                    { q:"Combien d'intégrations sont disponibles ?", r:"12 à ce jour (Gmail, Slack, Salesforce, Notion…). Nouvelles intégrations chaque mois." },
                  ].map((faq, i) => (
                    <div key={faq.q} style={{ padding:"24px 0", paddingRight: i % 2 === 0 ? 32 : 0, paddingLeft: i % 2 === 1 ? 32 : 0, borderBottom:`1px solid ${C.mist}`, borderRight: i % 2 === 0 ? `1px solid ${C.mist}` : "none" }}>
                      <div style={{ fontFamily:F.sans, fontSize:14, fontWeight:500, color:C.ink, marginBottom:8 }}>{faq.q}</div>
                      <div style={{ fontFamily:F.sans, fontSize:13, color:C.slate, lineHeight:1.6 }}>{faq.r}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: PARAMÈTRES ── */}
        {tab === "parametres" && (
          <div>
            <div style={{ padding:"48px 48px 0", borderBottom:`1px solid ${C.mist}`, paddingBottom:40 }}>
              <div style={{ fontFamily:F.mono, fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", color:C.slate, marginBottom:14 }}>§ PARAMÈTRES</div>
              <h1 style={{ fontFamily:F.display, fontSize:64, lineHeight:1.05, letterSpacing:"-0.02em", color:C.ink, margin:0, fontWeight:400 }}>
                Votre <span style={{ fontStyle:"italic" }}>compte.</span>
              </h1>
            </div>

            <div style={{ padding:"40px 48px", display:"grid", gridTemplateColumns:"2fr 1fr", gap:32, alignItems:"start" }}>
              {/* Profil */}
              <div style={{ background:C.paper, border:`1px solid ${C.mist}`, borderRadius:8, overflow:"hidden" }}>
                <div style={{ padding:"24px 28px", borderBottom:`1px solid ${C.mist}` }}>
                  <div style={{ fontFamily:F.mono, fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", color:C.slate }}>§ PROFIL</div>
                </div>
                <div style={{ padding:"28px" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:20, marginBottom:32, paddingBottom:28, borderBottom:`1px solid ${C.mist}` }}>
                    {user.avatar ? (
                      <img src={user.avatar} width={64} height={64} style={{ borderRadius:"50%" }} alt="" />
                    ) : (
                      <div style={{ width:64, height:64, borderRadius:"50%", background:C.ink, display:"flex", alignItems:"center", justifyContent:"center", color:C.bone, fontFamily:F.display, fontSize:28 }}>
                        {(user.name?.[0] || user.email[0]).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div style={{ fontFamily:F.display, fontSize:28, color:C.ink, fontWeight:400 }}>{user.name}</div>
                      <div style={{ fontFamily:F.mono, fontSize:12, color:C.slate }}>{user.email}</div>
                    </div>
                  </div>
                  <div style={{ display:"grid", gap:16 }}>
                    {[
                      { label:"Nom", value:user.name || "—" },
                      { label:"Email", value:user.email },
                      { label:"Méthode de connexion", value:"Google OAuth" },
                    ].map(row => (
                      <div key={row.label} style={{ display:"grid", gridTemplateColumns:"160px 1fr", gap:16, alignItems:"start" }}>
                        <div style={{ fontFamily:F.mono, fontSize:11, color:C.slate, letterSpacing:"0.04em", textTransform:"uppercase", paddingTop:2 }}>{row.label}</div>
                        <div style={{ fontFamily:F.sans, fontSize:14, color:C.ink }}>{row.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Abonnement */}
              <div style={{ background:C.paper, border:`1px solid ${C.mist}`, borderRadius:8, overflow:"hidden" }}>
                <div style={{ padding:"24px 28px", borderBottom:`1px solid ${C.mist}` }}>
                  <div style={{ fontFamily:F.mono, fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", color:C.slate }}>§ ABONNEMENT</div>
                </div>
                <div style={{ padding:"28px", display:"flex", flexDirection:"column", gap:20 }}>
                  <div>
                    <div style={{ fontFamily:F.display, fontSize:24, color:C.ink, fontWeight:400, marginBottom:4 }}>Essai gratuit</div>
                    <div style={{ fontFamily:F.sans, fontSize:13, color:C.slate }}>
                      <span style={{ color:C.lime, fontWeight:600, background:C.ink, padding:"2px 8px", borderRadius:3 }}>{trialDaysLeft}j</span>
                      {" "}restants
                    </div>
                  </div>
                  <div style={{ borderTop:`1px solid ${C.mist}`, paddingTop:20 }}>
                    <div style={{ fontFamily:F.sans, fontSize:13, color:C.slate, marginBottom:16, lineHeight:1.5 }}>
                      Aucune carte bancaire requise pendant l'essai. Choisissez votre offre avant la fin pour continuer sans interruption.
                    </div>
                    <button
                      onClick={() => setTab("packs")}
                      style={{ width:"100%", background:C.lime, color:C.ink, border:"none", padding:"13px 16px", borderRadius:4, fontFamily:F.sans, fontSize:14, fontWeight:500, cursor:"pointer", textAlign:"left" }}
                    >
                      Voir les offres →
                    </button>
                  </div>
                </div>
              </div>

              {/* Déconnexion */}
              <div style={{ background:C.paper, border:`1px solid ${C.mist}`, borderRadius:8, overflow:"hidden" }}>
                <div style={{ padding:"24px 28px", borderBottom:`1px solid ${C.mist}` }}>
                  <div style={{ fontFamily:F.mono, fontSize:11, letterSpacing:"0.08em", textTransform:"uppercase", color:C.slate }}>§ COMPTE</div>
                </div>
                <div style={{ padding:"28px", display:"flex", gap:12 }}>
                  <button
                    onClick={handleSignOut}
                    style={{ background:"transparent", color:C.clay, border:`1px solid ${C.clay}`, padding:"11px 20px", borderRadius:4, fontFamily:F.sans, fontSize:13, cursor:"pointer" }}
                  >
                    Se déconnecter
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Modal embauche */}
      <Modal agent={hiredAgent} onClose={() => setHiredAgent(null)} />
    </div>
  );
}
