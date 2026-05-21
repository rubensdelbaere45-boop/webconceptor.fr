"use client";
import { useState } from "react";
import {
  Monitor, Smartphone, Shield, Wifi, HardDrive,
  CheckCircle2, ChevronRight, Download, Lock,
  RefreshCw, Star, ArrowRight, ExternalLink,
} from "lucide-react";

/* ── helpers ─────────────────────────────────────────────── */
function Step({ n, title, desc, img }: { n: number; title: string; desc: string; img: React.ReactNode }) {
  return (
    <div style={{ display: "flex", gap: 20, alignItems: "flex-start", padding: "18px 0", borderBottom: "1px solid #f1f5f9" }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "#4f46e5", color: "#fff", fontFamily: "'Outfit',sans-serif", fontWeight: 900, fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{n}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4 }}>{title}</div>
        <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>{desc}</div>
      </div>
      <div style={{ flexShrink: 0, fontSize: 24 }}>{img}</div>
    </div>
  );
}

function FeaturePill({ icon: Icon, label, color }: { icon: React.ElementType; label: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 30, padding: "8px 16px" }}>
      <Icon style={{ width: 15, height: 15, color }} />
      <span style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{label}</span>
    </div>
  );
}

type Tab = "windows" | "mac" | "ipad";

/* ── Page ────────────────────────────────────────────────── */
export default function TelechargerPage() {
  const [tab, setTab] = useState<Tab>("windows");

  return (
    <div style={{ fontFamily: "'IBM Plex Sans',sans-serif", background: "#fff", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
      `}</style>

      {/* ── Header ── */}
      <header style={{ borderBottom: "1px solid #e2e8f0", padding: "0 24px" }}>
        <div style={{ maxWidth: 960, margin: "0 auto", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a href="/caissio" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <svg width="32" height="32" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="11" fill="#4F46E5"/>
              <rect x="14" y="6" width="14" height="6" rx="1.5" fill="white" opacity="0.95"/>
              <rect x="10" y="16" width="28" height="22" rx="3.5" fill="white"/>
              <rect x="14" y="20" width="20" height="6" rx="1.5" fill="#4F46E5" opacity="0.15"/>
              <rect x="14" y="28" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5"/>
              <rect x="21.5" y="28" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5"/>
              <rect x="29" y="28" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5"/>
              <rect x="29" y="33" width="5" height="3" rx="1" fill="#10B981"/>
            </svg>
            <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 20, color: "#0f172a" }}>Caissio</span>
          </a>
          <a href="/caissio/login" style={{ height: 40, padding: "0 20px", borderRadius: 10, background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", textDecoration: "none", display: "flex", alignItems: "center", gap: 6 }}>
            Se connecter <ArrowRight style={{ width: 14, height: 14 }} />
          </a>
        </div>
      </header>

      {/* ── Hero ── */}
      <section style={{ background: "linear-gradient(135deg,#ede9fe 0%,#e0e7ff 60%,#dbeafe 100%)", padding: "72px 24px 56px" }}>
        <div style={{ maxWidth: 780, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#fff", border: "1px solid #c4b5fd", borderRadius: 30, padding: "6px 16px", marginBottom: 24 }}>
            <Download style={{ width: 14, height: 14, color: "#4f46e5" }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5" }}>Installation gratuite — sans abonnement requis</span>
          </div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: "clamp(36px,6vw,64px)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 20 }}>
            Votre caisse,<br />
            <span style={{ color: "#4f46e5" }}>installée en 60 secondes.</span>
          </h1>
          <p style={{ fontSize: 18, color: "#475569", lineHeight: 1.7, marginBottom: 36, maxWidth: 560, margin: "0 auto 36px" }}>
            Caissio s&apos;installe comme une vraie application — sans passer par un store, sans droits admin.
            Vos données restent sur votre machine, même hors-ligne.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center" }}>
            <FeaturePill icon={HardDrive} label="Données 100 % locales" color="#10b981" />
            <FeaturePill icon={Wifi} label="Fonctionne hors-ligne" color="#4f46e5" />
            <FeaturePill icon={Lock} label="Protection PIN" color="#f59e0b" />
            <FeaturePill icon={Shield} label="Compte sécurisé" color="#ef4444" />
            <FeaturePill icon={RefreshCw} label="Mises à jour auto" color="#0ea5e9" />
          </div>
        </div>
      </section>

      {/* ── Platform tabs ── */}
      <section style={{ padding: "56px 24px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>

          {/* Tab bar */}
          <div style={{ display: "flex", gap: 8, marginBottom: 40, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 6 }}>
            {([
              { id: "windows" as Tab, icon: "🪟", label: "Windows 10 / 11" },
              { id: "mac" as Tab, icon: "🍎", label: "Mac / macOS" },
              { id: "ipad" as Tab, icon: "📱", label: "iPad / iPhone" },
            ] as const).map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ flex: 1, height: 48, borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all .15s",
                  background: tab === t.id ? "#fff" : "transparent",
                  color: tab === t.id ? "#0f172a" : "#64748b",
                  boxShadow: tab === t.id ? "0 2px 8px rgba(0,0,0,.08)" : "none",
                }}>
                <span style={{ fontSize: 18 }}>{t.icon}</span>
                <span style={{ display: "block" }}>{t.label}</span>
              </button>
            ))}
          </div>

          {/* ══ WINDOWS ══ */}
          {tab === "windows" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* ── CTA principal : télécharger le .exe ── */}
              <div style={{ background: "linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%)", borderRadius: 24, padding: "32px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,.7)", marginBottom: 8 }}>APPLICATION WINDOWS NATIVE</div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Caissio pour Windows</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,.8)", lineHeight: 1.6 }}>
                    Installateur Windows (.exe) — Windows 10 / 11 · 64-bit<br />
                    Vos données sauvegardées localement · Icône dans le menu Démarrer
                  </div>
                </div>
                <a
                  href="/api/caissio/download"
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    height: 56, padding: "0 28px", borderRadius: 16,
                    background: "#fff", color: "#4f46e5",
                    fontWeight: 800, fontSize: 16,
                    textDecoration: "none", whiteSpace: "nowrap",
                    boxShadow: "0 8px 24px rgba(0,0,0,.2)",
                    flexShrink: 0,
                  }}
                >
                  <Download style={{ width: 20, height: 20 }} />
                  Télécharger le .exe
                </a>
              </div>

              {/* ── Étapes d'installation ── */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: 28 }}>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
                  Comment installer Caissio sur Windows
                </div>
                <Step n={1} title="Téléchargez le fichier" desc='Cliquez sur "Télécharger le .exe" ci-dessus. Le fichier Caissio-Setup-1.0.0.exe se télécharge.' img="⬇️" />
                <Step n={2} title="Lancez l'installateur" desc='Double-cliquez sur le fichier téléchargé. Si Windows affiche un avertissement SmartScreen, cliquez "Informations complémentaires" → "Exécuter quand même".' img="🖱️" />
                <Step n={3} title="Choisissez le dossier" desc="L'installateur vous demande où installer Caissio. Laissez le dossier par défaut et cliquez Suivant." img="📁" />
                <Step n={4} title="Connectez-vous" desc="Caissio s'ouvre automatiquement. Connectez-vous avec votre compte Caissio ou créez-en un." img="🔑" />
                <div style={{ marginTop: 16, padding: "12px 16px", background: "#ede9fe", borderRadius: 12, fontSize: 13, color: "#4f46e5", fontWeight: 600 }}>
                  🎉 Caissio est dans votre menu Démarrer et sur votre Bureau. Vos données sont sauvegardées sur votre PC.
                </div>
              </div>

              {/* ── Méthode alternative : PWA ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌐</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Alternative : Chrome PWA</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Sans téléchargement</div>
                    </div>
                  </div>
                  <Step n={1} title="Ouvrir Chrome" desc="Allez sur webconceptor.fr/caissio dans Chrome." img="🌐" />
                  <Step n={2} title='Cliquer ⊕' desc='Icône ⊕ dans la barre d&apos;adresse → "Installer Caissio".' img="⊕" />
                </div>
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🔵</div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>Alternative : Edge PWA</div>
                      <div style={{ fontSize: 11, color: "#94a3b8" }}>Déjà sur Windows</div>
                    </div>
                  </div>
                  <Step n={1} title="Ouvrir Edge" desc="Allez sur webconceptor.fr/caissio dans Edge." img="🔵" />
                  <Step n={2} title="Menu ···" desc='Cliquez ··· → Applications → "Installer ce site comme app".' img="⋯" />
                </div>
              </div>

              {/* Full-width note */}
              <div style={{ background: "#fff7ed", border: "1px solid #fed7aa", borderRadius: 16, padding: "16px 20px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <span style={{ fontSize: 22 }}>🔒</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#c2410c", marginBottom: 4 }}>Protection anti-utilisation frauduleuse</div>
                  <div style={{ fontSize: 13, color: "#7c3aed", lineHeight: 1.6 }}>
                    Caissio vérifie votre compte à chaque ouverture. Sans abonnement actif, l&apos;accès est bloqué. Vos données locales ne peuvent pas être copiées vers un autre compte. Il n&apos;existe aucun &quot;crack&quot; fonctionnel : l&apos;application contacte nos serveurs pour valider la licence à chaque session.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══ MAC ══ */}
          {tab === "mac" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* ── CTA principal : télécharger le .dmg ── */}
              <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e293b 100%)", borderRadius: 24, padding: "32px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,.5)", marginBottom: 8 }}>APPLICATION MACOS NATIVE</div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Caissio pour Mac</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,.7)", lineHeight: 1.6 }}>
                    Image disque (.dmg) — macOS 12 Monterey ou supérieur · Apple Silicon &amp; Intel<br />
                    Glissez dans Applications · Icône dans le Dock · Données locales sur votre Mac
                  </div>
                </div>
                <a
                  href="/api/caissio/download/mac"
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    height: 56, padding: "0 28px", borderRadius: 16,
                    background: "#fff", color: "#0f172a",
                    fontWeight: 800, fontSize: 16,
                    textDecoration: "none", whiteSpace: "nowrap",
                    boxShadow: "0 8px 24px rgba(0,0,0,.35)",
                    flexShrink: 0,
                  }}
                >
                  <Download style={{ width: 20, height: 20 }} />
                  Télécharger le .dmg
                </a>
              </div>

              {/* ── Étapes .dmg ── */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: 28 }}>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 20 }}>
                  Comment installer Caissio sur Mac
                </div>
                <Step n={1} title="Téléchargez le fichier" desc='Cliquez sur "Télécharger le .dmg" ci-dessus. Le fichier Caissio.dmg se télécharge dans votre dossier Téléchargements.' img="⬇️" />
                <Step n={2} title="Ouvrez le .dmg" desc="Double-cliquez sur Caissio.dmg. Une fenêtre s'ouvre avec l'icône Caissio et votre dossier Applications." img="💿" />
                <Step n={3} title="Glissez dans Applications" desc='Faites glisser l&apos;icône Caissio dans le dossier Applications. Si macOS affiche "impossible de vérifier", allez dans Réglages → Confidentialité → Ouvrir quand même.' img="📁" />
                <Step n={4} title="Connectez-vous" desc="Lancez Caissio depuis le Launchpad ou le Dock. Connectez-vous avec votre compte Caissio ou créez-en un." img="🔑" />
                <div style={{ marginTop: 16, padding: "12px 16px", background: "#ede9fe", borderRadius: 12, fontSize: 13, color: "#4f46e5", fontWeight: 600 }}>
                  🎉 Caissio est dans votre Launchpad et votre Dock. Vos données sont sauvegardées sur votre Mac.
                </div>
              </div>

              {/* ── Chrome + Safari en alternatif ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {/* Chrome */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🌐</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Via Chrome (macOS)</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Recommandé</div>
                  </div>
                  <div style={{ marginLeft: "auto", background: "#10b981", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>⭐ Recommandé</div>
                </div>
                <Step n={1} title="Ouvrir Chrome sur Mac" desc="Lancez Chrome. Si besoin, téléchargez-le sur google.com/chrome." img="🌐" />
                <Step n={2} title="Accéder à Caissio" desc="Dans la barre d'adresse, tapez : webconceptor.fr/caissio" img="🔗" />
                <Step n={3} title='Icône d&apos;installation' desc="Dans la barre d'adresse, une icône ⊕ apparaît à droite. Cliquez dessus." img="⊕" />
                <Step n={4} title="Installer dans le Dock" desc='Cliquez "Installer". Caissio s&apos;ajoute à votre Launchpad et peut être glissé dans le Dock.' img="🖥️" />
                <div style={{ marginTop: 16, padding: "12px 16px", background: "#ede9fe", borderRadius: 12, fontSize: 13, color: "#4f46e5", fontWeight: 600 }}>
                  🎉 Caissio s&apos;ouvre comme une vraie application Mac, sans barre de navigation.
                </div>
              </div>

              {/* Safari */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🧭</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>Via Safari (macOS Sonoma+)</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>macOS 14 minimum</div>
                  </div>
                </div>
                <Step n={1} title="Ouvrir Safari" desc="Safari est le navigateur natif Apple, disponible dans votre Dock ou Launchpad." img="🧭" />
                <Step n={2} title="Accéder à Caissio" desc="Dans la barre d'adresse, tapez : webconceptor.fr/caissio" img="🔗" />
                <Step n={3} title="Menu Partage" desc='Cliquez sur l&apos;icône de partage (carré avec flèche ↑) dans la barre d&apos;outils.' img="⬆️" />
                <Step n={4} title="Ajouter au Dock" desc='"Ajouter au Dock" dans le menu. Caissio reçoit son icône dans votre Dock.' img="🍎" />
                <div style={{ marginTop: 16, padding: "12px 16px", background: "#f0fdf4", borderRadius: 12, fontSize: 13, color: "#166534", fontWeight: 600 }}>
                  💡 Sur macOS Ventura ou antérieur : utilisez Chrome à la place de Safari.
                </div>
              </div>

              </div>{/* end 2-col grid Chrome/Safari */}

              {/* Profiles section */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: 28 }}>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a", marginBottom: 16 }}>
                  🧑‍💼 Profils utilisateurs Mac
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                  {[
                    { emoji: "👤", title: "Caissier", desc: "Accès caisse uniquement. Données en lecture seule. Pas d'accès aux rapports." },
                    { emoji: "👨‍💼", title: "Manager", desc: "Caisse + dashboard + produits + clients. Peut modifier les prix et le stock." },
                    { emoji: "👑", title: "Admin", desc: "Accès complet. Paramètres, abonnement, fournisseurs, toutes les données." },
                  ].map((p) => (
                    <div key={p.title} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: 18 }}>
                      <div style={{ fontSize: 32, marginBottom: 10 }}>{p.emoji}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>{p.title}</div>
                      <div style={{ fontSize: 12, color: "#64748b", lineHeight: 1.6 }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 16, padding: "12px 16px", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, fontSize: 13, color: "#92400e" }}>
                  Les profils utilisateurs avec restrictions granulaires seront disponibles en version Pro dès juin 2026. Aujourd&apos;hui, chaque utilisateur a son propre compte avec PIN.
                </div>
              </div>
            </div>
          )}

          {/* ══ IPAD / IPHONE ══ */}
          {tab === "ipad" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* ── CTA principal : installer directement ── */}
              <div style={{ background: "linear-gradient(135deg,#4f46e5 0%,#0ea5e9 100%)", borderRadius: 24, padding: "32px 36px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(255,255,255,.7)", marginBottom: 8 }}>APPLICATION iPad · iPhone</div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 900, color: "#fff", marginBottom: 8 }}>Caissio sur iPad</div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,.8)", lineHeight: 1.6 }}>
                    Ouvrez Caissio dans Safari, puis ajoutez-le à votre écran d&apos;accueil.<br />
                    Plein écran · Fonctionne hors-ligne · Parfait en caisse
                  </div>
                </div>
                <a
                  href="/api/caissio/download/ipad"
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    height: 56, padding: "0 28px", borderRadius: 16,
                    background: "#fff", color: "#4f46e5",
                    fontWeight: 800, fontSize: 16,
                    textDecoration: "none", whiteSpace: "nowrap",
                    boxShadow: "0 8px 24px rgba(0,0,0,.2)",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: 20 }}>📲</span>
                  Installer sur iPad
                </a>
              </div>

              {/* ── guides iPad + iPhone en 2 colonnes ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📱</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>iPad (recommandé en caisse)</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Via Safari</div>
                  </div>
                  <div style={{ marginLeft: "auto", background: "#10b981", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 6 }}>⭐ Idéal</div>
                </div>
                <Step n={1} title="Ouvrir Safari sur iPad" desc="Safari est pré-installé sur tout iPad. Ouvrez-le depuis l'écran d'accueil." img="🧭" />
                <Step n={2} title="Aller sur Caissio" desc="Dans la barre d'adresse, tapez : webconceptor.fr/caissio/login" img="🔗" />
                <Step n={3} title="Icône Partager" desc="Appuyez sur l'icône ⬆️ en bas (ou en haut selon l'iPad) de Safari." img="⬆️" />
                <Step n={4} title="Sur l'écran d'accueil" desc='Appuyez sur "Sur l&apos;écran d&apos;accueil". Renommez en "Caissio" et appuyez sur "Ajouter".' img="🏠" />
                <div style={{ marginTop: 16, padding: "12px 16px", background: "#ede9fe", borderRadius: 12, fontSize: 13, color: "#4f46e5", fontWeight: 600 }}>
                  🎉 L&apos;app s&apos;ouvre plein écran sans barre Safari — comme une vraie app !
                </div>
              </div>

              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 20, padding: 28 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fff", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>📲</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>iPhone</div>
                    <div style={{ fontSize: 12, color: "#94a3b8" }}>Caisse mobile</div>
                  </div>
                </div>
                <Step n={1} title="Ouvrir Safari sur iPhone" desc="Lancez Safari (navigateur Apple par défaut sur iPhone)." img="🧭" />
                <Step n={2} title="Aller sur Caissio" desc="Dans la barre d'adresse, tapez : webconceptor.fr/caissio/login" img="🔗" />
                <Step n={3} title="Icône Partager" desc="Appuyez sur l'icône ⬆️ en bas de l'écran pour ouvrir le menu de partage." img="⬆️" />
                <Step n={4} title="Sur l'écran d'accueil" desc="Appuyez sur « Sur l&apos;écran d&apos;accueil » et validez. L'icône Caissio apparaît." img="🏠" />
                <div style={{ marginTop: 16, padding: "12px 16px", background: "#f0fdf4", borderRadius: 12, fontSize: 13, color: "#166534", fontWeight: 600 }}>
                  💡 L&apos;interface s&apos;adapte automatiquement à l&apos;écran de l&apos;iPhone en mode portrait.
                </div>
              </div>

              </div>{/* end 2-col grid iPad/iPhone */}

              {/* Note scanner */}
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 16, padding: "16px 20px", display: "flex", gap: 14 }}>
                <span style={{ fontSize: 22 }}>⚠️</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#dc2626", marginBottom: 4 }}>Important — Scanner de code-barres</div>
                  <div style={{ fontSize: 13, color: "#7f1d1d", lineHeight: 1.6 }}>
                    Sur iPad/iPhone, l&apos;accès à la caméra pour scanner est possible via Safari. Pour une utilisation intensive en caisse, un scanner Bluetooth ou USB est recommandé et se connecte directement à Caissio sans installation.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ background: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "56px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#4f46e5", marginBottom: 8, textAlign: "center" }}>FAQ</div>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 32, fontWeight: 900, color: "#0f172a", textAlign: "center", marginBottom: 36 }}>Questions fréquentes</h2>

          {[
            { q: "Est-ce que c'est vraiment gratuit à installer ?", a: "L'installation est gratuite. Un compte Caissio est nécessaire pour utiliser l'app. Un essai gratuit de 7 jours est disponible, sans carte bancaire." },
            { q: "Mes données sont-elles stockées sur votre serveur ?", a: "Non. Toutes vos données (produits, ventes, clients) sont stockées localement sur votre appareil (localStorage). Seule l'authentification de votre compte passe par nos serveurs." },
            { q: "L'app fonctionne-t-elle sans internet ?", a: "Oui, une fois installée, la caisse fonctionne hors-ligne. La connexion internet est nécessaire uniquement pour vérifier votre licence à l'ouverture de l'app (1 fois par session)." },
            { q: "Peut-on installer Caissio sur plusieurs appareils ?", a: "Oui. Connectez-vous avec le même compte sur chaque appareil. Chaque appareil a ses propres données locales. La synchronisation multi-appareils est en cours de développement." },
            { q: "Peut-on contourner la protection de licence ?", a: "Non. Caissio valide votre abonnement à chaque démarrage via une vérification serveur chiffrée. Sans connexion internet au démarrage, l'app fonctionne en mode hors-ligne pour la session en cours uniquement." },
            { q: "Mon antivirus bloque-t-il l'application ?", a: "Non. Caissio est une Progressive Web App — il ne s'installe pas comme un fichier .exe classique. Aucun pilote, aucune modification système. Les antivirus ne l'affectent pas." },
          ].map((item, i) => (
            <details key={i} style={{ borderBottom: "1px solid #e2e8f0", padding: "18px 0" }}>
              <summary style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", cursor: "pointer", listStyle: "none", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                {item.q}
                <ChevronRight style={{ width: 16, height: 16, color: "#94a3b8", flexShrink: 0 }} />
              </summary>
              <div style={{ fontSize: 14, color: "#475569", lineHeight: 1.7, marginTop: 10, paddingLeft: 0 }}>{item.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ── CTA ── */}
      <section style={{ padding: "72px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 600, margin: "0 auto" }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🚀</div>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 36, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>Prêt à démarrer ?</h2>
          <p style={{ fontSize: 16, color: "#64748b", marginBottom: 32 }}>
            Créez votre compte gratuitement et installez Caissio en 60 secondes sur votre appareil.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/caissio/register" style={{ height: 56, padding: "0 32px", borderRadius: 16, background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 16, border: "none", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              <Star style={{ width: 16, height: 16 }} /> Essai gratuit 7 jours
            </a>
            <a href="/caissio/login" style={{ height: 56, padding: "0 32px", borderRadius: 16, background: "#fff", color: "#0f172a", fontWeight: 700, fontSize: 16, border: "1px solid #e2e8f0", textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
              Se connecter <ExternalLink style={{ width: 14, height: 14 }} />
            </a>
          </div>

          <div style={{ marginTop: 32, display: "flex", gap: 20, justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { icon: CheckCircle2, text: "Sans carte bancaire" },
              { icon: CheckCircle2, text: "Aucun téléchargement .exe" },
              { icon: CheckCircle2, text: "Données sur votre machine" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#64748b" }}>
                <Icon style={{ width: 14, height: 14, color: "#10b981" }} />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ borderTop: "1px solid #e2e8f0", padding: "24px", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
          <Smartphone style={{ width: 14, height: 14, color: "#94a3b8" }} />
          <Monitor style={{ width: 14, height: 14, color: "#94a3b8" }} />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>Caissio • Windows • Mac • iPad • iPhone</span>
        </div>
        <div style={{ fontSize: 11, color: "#cbd5e1" }}>© 2026 WebConceptor. Tous droits réservés.</div>
      </footer>
    </div>
  );
}
