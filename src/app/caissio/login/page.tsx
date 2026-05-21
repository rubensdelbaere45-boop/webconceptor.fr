"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { login, getSession } from "@/lib/caissio-store";

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

export default function CaissioLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (getSession()) router.replace("/caissio/app/pos");
  }, [router]);

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
      `}</style>

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
