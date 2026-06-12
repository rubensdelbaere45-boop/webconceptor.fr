"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Share, Plus } from "lucide-react";
import { login, getSession } from "@/lib/caissio-store";
import { supabase } from "@/lib/supabase";

function CaissioMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="2" y="2" width="44" height="44" rx="11" fill="#4F46E5" />
      <rect x="14" y="6" width="14" height="6" rx="1.5" fill="white" opacity="0.95" />
      <rect x="10" y="16" width="28" height="22" rx="3.5" fill="white" />
      <rect x="14" y="20" width="20" height="6" rx="1.5" fill="#4F46E5" opacity="0.15" />
      <rect x="14" y="28" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5" />
      <rect x="21.5" y="28" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5" />
      <rect x="29" y="28" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5" />
      <rect x="14" y="33" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5" />
      <rect x="21.5" y="33" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5" />
      <rect x="29" y="33" width="5" height="3" rx="1" fill="#10B981" />
    </svg>
  );
}

function CaissioLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/caissio/auth/callback` },
    });
  };

  useEffect(() => {
    if (getSession()) router.replace("/caissio/app/pos");
  }, [router]);

  // Bannière d'installation PWA sur iPad/iPhone quand ?install=1
  useEffect(() => {
    if (searchParams.get("install") === "1") {
      setShowInstallBanner(true);
    }
  }, [searchParams]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    // Basic rate-limiting (client-side)
    if (attempts >= 5) {
      setErr("Trop de tentatives. Veuillez patienter quelques instants.");
      return;
    }

    if (!email.trim() || !password) {
      setErr("Veuillez remplir tous les champs.");
      return;
    }

    setLoading(true);
    try {
      login(email.trim(), password);
      router.push("/caissio/app/pos");
    } catch (ex: unknown) {
      setAttempts((a) => a + 1);
      setErr(ex instanceof Error ? ex.message : "Erreur de connexion");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr", fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input:focus { border-color: #4f46e5 !important; box-shadow: 0 0 0 3px rgba(79,70,229,.12); }
        @media (max-width: 768px) {
          .cai-login-grid { grid-template-columns: 1fr !important; }
          .cai-login-left { display: none !important; }
        }
        @keyframes slideDown { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }
      `}</style>

      {/* ── Bannière installation iPad/iPhone ── */}
      {showInstallBanner && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999,
          background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
          padding: "14px 20px", animation: "slideDown .3s ease",
          display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 15, color: "#fff", marginBottom: 2 }}>
              Installer Caissio sur votre iPad
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.85)", lineHeight: 1.5 }}>
              Dans Safari : appuyez sur <Share style={{ width: 12, height: 12, display: "inline", verticalAlign: "middle" }} /> Partager
              → <Plus style={{ width: 12, height: 12, display: "inline", verticalAlign: "middle" }} /> Sur l&apos;écran d&apos;accueil
            </div>
          </div>
          <button
            onClick={() => setShowInstallBanner(false)}
            style={{ background: "rgba(255,255,255,.2)", border: "none", color: "#fff", borderRadius: 8, padding: "6px 14px", fontWeight: 700, fontSize: 13, cursor: "pointer", flexShrink: 0 }}
          >
            OK
          </button>
        </div>
      )}

      {/* Left panel */}
      <div className="cai-login-left" style={{ background: "linear-gradient(135deg,#ede9fe 0%,#dbeafe 100%)", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "48px", borderRight: "1px solid #e2e8f0", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -80, right: -80, width: 300, height: 300, borderRadius: "50%", background: "radial-gradient(circle,#a5b4fc,transparent 70%)", filter: "blur(40px)", opacity: 0.6 }} />
        <a href="/caissio" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", position: "relative" }}>
          <CaissioMark size={36} />
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Caissio</span>
        </a>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.25em", color: "#4f46e5", marginBottom: 16 }}>Logiciel de caisse SaaS</div>
          <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 52, fontWeight: 900, lineHeight: 0.95, letterSpacing: "-0.04em", color: "#0f172a", marginBottom: 20 }}>
            Plus rapide.<br />Plus simple.<br /><span style={{ color: "#4f46e5" }}>Plus intelligent.</span>
          </h2>
          <p style={{ fontSize: 16, color: "#475569", maxWidth: 340, lineHeight: 1.6 }}>
            Le logiciel de caisse pensé pour les commerçants — pas pour les ingénieurs.
          </p>
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.2em", position: "relative" }}>© 2026 Caissio</div>
      </div>

      {/* Right panel */}
      <div className="cai-login-grid" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "48px", background: "#fff" }}>
        <div style={{ width: "100%", maxWidth: 360 }}>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 30, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Bon retour parmi nous</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 32 }}>
            Pas encore de compte ?{" "}
            <a href="/caissio/register" style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>Créer un compte gratuit</a>
          </p>

          {/* Bouton Google — via Supabase OAuth (même mécanisme que Klyora Sites) */}
          <button
            type="button"
            disabled={googleLoading}
            onClick={handleGoogle}
            style={{ width: "100%", height: 48, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: googleLoading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 4, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
            <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            {googleLoading ? "Connexion…" : "Continuer avec Google"}
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            <span style={{ fontSize: 12, color: "#94a3b8" }}>ou</span>
            <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          </div>

          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }} noValidate>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#64748b" }}>Email</span>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@commerce.fr"
                maxLength={254}
                style={{ height: 48, padding: "0 16px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, color: "#0f172a", outline: "none", background: "#fff", transition: "border-color .15s, box-shadow .15s" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#64748b" }}>Mot de passe</span>
                <a href="/caissio/reset-password" style={{ fontSize: 12, color: "#4f46e5", textDecoration: "none" }}>Mot de passe oublié ?</a>
              </div>
              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={128}
                style={{ height: 48, padding: "0 16px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, color: "#0f172a", outline: "none", background: "#fff", transition: "border-color .15s, box-shadow .15s" }}
              />
            </label>

            {err && (
              <div role="alert" style={{ fontSize: 13, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px" }}>
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{ height: 50, borderRadius: 14, background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 16, border: "none", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1, marginTop: 4 }}
            >
              {loading
                ? <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} />
                : <>Se connecter <ArrowRight style={{ width: 18, height: 18 }} /></>
              }
            </button>
          </form>

          <p style={{ marginTop: 28, fontSize: 12, color: "#94a3b8", textAlign: "center", lineHeight: 1.6 }}>
            En vous connectant, vous acceptez nos{" "}
            <a href="/caissio/cgu" style={{ color: "#64748b", textDecoration: "underline" }}>CGU</a>{" "}et notre{" "}
            <a href="/caissio/confidentialite" style={{ color: "#64748b", textDecoration: "underline" }}>politique de confidentialité</a>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CaissioLoginPage() {
  return (
    <Suspense>
      <CaissioLogin />
    </Suspense>
  );
}
