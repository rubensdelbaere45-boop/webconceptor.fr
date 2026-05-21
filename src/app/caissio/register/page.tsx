"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Check } from "lucide-react";
import { register, getSession, loginWithGoogle, registerWithGoogle } from "@/lib/caissio-store";

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

export default function CaissioRegister() {
  const router = useRouter();
  const [form, setForm] = useState({ store_name: "", name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [terms, setTerms] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    if (getSession()) router.replace("/caissio/app/dashboard");
  }, [router]);

  /* Google Sign-In */
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const g = (window as any).google;
      if (!g) return;
      g.accounts.id.initialize({
        client_id: clientId,
        callback: (resp: { credential: string }) => {
          setGoogleLoading(true);
          try {
            const payload = JSON.parse(atob(resp.credential.split(".")[1]));
            const { sub, email, name } = payload;
            const user = loginWithGoogle(sub, email) ?? registerWithGoogle({ name, email, google_sub: sub });
            if (!user.onboarding_done) { router.push("/caissio/onboarding"); }
            else { router.push("/caissio/app/pos"); }
          } catch { setErr("Connexion Google échouée. Réessayez."); }
          finally { setGoogleLoading(false); }
        },
      });
    };
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, [router]);

  const setField = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");

    if (attempts >= 10) {
      setErr("Trop de tentatives. Veuillez patienter quelques instants.");
      return;
    }

    if (!terms) {
      setErr("Vous devez accepter les CGU et la politique de confidentialité.");
      return;
    }

    setLoading(true);
    try {
      register(form);
      router.push("/caissio/onboarding");
    } catch (ex: unknown) {
      setAttempts((a) => a + 1);
      setErr(ex instanceof Error ? ex.message : "Erreur lors de la création");
      setLoading(false);
    }
  };

  const FIELDS: [keyof typeof form, string, string, string, string, number][] = [
    ["store_name", "Nom du commerce", "text", "Épicerie Dupont", "organization", 80],
    ["name", "Votre nom", "text", "Marie Dupont", "name", 100],
    ["email", "Email", "email", "vous@commerce.fr", "email", 254],
    ["password", "Mot de passe", "password", "Au moins 6 caractères", "new-password", 128],
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#ede9fe 0%,#dbeafe 100%)", padding: 24, fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        input:focus { border-color: #4f46e5 !important; box-shadow: 0 0 0 3px rgba(79,70,229,.12) !important; }
      `}</style>

      <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 28, border: "1px solid #e2e8f0", padding: "40px", boxShadow: "0 24px 64px rgba(79,70,229,.15)" }}>
        <a href="/caissio" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 32 }}>
          <CaissioMark size={34} />
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Caissio</span>
        </a>

        <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Créer un compte</h1>

        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          {["7 jours gratuits", "Sans carte bancaire", "Sans engagement"].map((s) => (
            <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#475569" }}>
              <Check style={{ width: 13, height: 13, color: "#10b981" }} /> {s}
            </span>
          ))}
        </div>

        {/* Bouton Google */}
        {process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID && (
          <>
            <button
              type="button"
              disabled={googleLoading}
              onClick={() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const g = (window as any).google;
                if (g) g.accounts.id.prompt();
              }}
              style={{ width: "100%", height: 48, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: googleLoading ? "wait" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 4, boxShadow: "0 1px 4px rgba(0,0,0,.06)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              {googleLoading ? "Connexion…" : "Continuer avec Google"}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
              <span style={{ fontSize: 12, color: "#94a3b8" }}>ou avec un email</span>
              <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
            </div>
          </>
        )}

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }} noValidate>
          {FIELDS.map(([key, label, type, ph, autoComplete, maxLength]) => (
            <label key={key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#64748b" }}>{label}</span>
              <input
                type={type}
                required
                value={form[key]}
                onChange={setField(key)}
                placeholder={ph}
                autoComplete={autoComplete}
                maxLength={maxLength}
                minLength={key === "password" ? 6 : key === "name" || key === "store_name" ? 2 : undefined}
                style={{ height: 46, padding: "0 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, color: "#0f172a", outline: "none", background: "#fff", transition: "border-color .15s, box-shadow .15s" }}
              />
            </label>
          ))}

          {/* Terms acceptance */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginTop: 4 }}>
            <input
              type="checkbox"
              checked={terms}
              onChange={(e) => setTerms(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0, accentColor: "#4f46e5", width: 16, height: 16 }}
            />
            <span style={{ fontSize: 12, color: "#64748b", lineHeight: 1.5 }}>
              J&apos;accepte les{" "}
              <a href="/caissio/cgu" target="_blank" rel="noopener noreferrer" style={{ color: "#4f46e5", textDecoration: "underline" }}>CGU</a>{" "}
              et la{" "}
              <a href="/caissio/confidentialite" target="_blank" rel="noopener noreferrer" style={{ color: "#4f46e5", textDecoration: "underline" }}>politique de confidentialité</a>.
            </span>
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
              : <>Créer mon compte <ArrowRight style={{ width: 18, height: 18 }} /></>}
          </button>
        </form>

        <p style={{ marginTop: 20, fontSize: 14, color: "#64748b", textAlign: "center" }}>
          Déjà un compte ?{" "}
          <a href="/caissio/login" style={{ color: "#4f46e5", fontWeight: 600, textDecoration: "none" }}>Se connecter</a>
        </p>
      </div>
    </div>
  );
}
