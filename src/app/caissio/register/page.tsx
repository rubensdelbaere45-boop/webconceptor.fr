"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Check } from "lucide-react";
import { register } from "@/lib/caissio-store";

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

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      register(form);
      router.push("/caissio/app/dashboard");
    } catch (ex: unknown) {
      setErr(ex instanceof Error ? ex.message : "Erreur lors de la création");
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg,#ede9fe 0%,#dbeafe 100%)", padding: 24, fontFamily: "'IBM Plex Sans',sans-serif" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap'); @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      <div style={{ width: "100%", maxWidth: 440, background: "#fff", borderRadius: 28, border: "1px solid #e2e8f0", padding: "40px", boxShadow: "0 24px 64px rgba(79,70,229,.15)" }}>
        <a href="/caissio" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none", marginBottom: 32 }}>
          <CaissioMark size={34} />
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Caissio</span>
        </a>

        <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 800, color: "#0f172a", marginBottom: 12 }}>Créer un compte</h1>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 28 }}>
          {["7 jours gratuits", "Sans carte bancaire", "Sans engagement"].map((s) => (
            <span key={s} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, color: "#475569" }}>
              <Check style={{ width: 13, height: 13, color: "#10b981" }} /> {s}
            </span>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {([
            ["store_name", "Nom du commerce", "text", "Épicerie Dupont"],
            ["name", "Votre nom", "text", "Marie Dupont"],
            ["email", "Email", "email", "vous@commerce.fr"],
            ["password", "Mot de passe", "password", "Au moins 6 caractères"],
          ] as const).map(([key, label, type, ph]) => (
            <label key={key} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#64748b" }}>{label}</span>
              <input type={type} required value={form[key]} onChange={set(key)} placeholder={ph} minLength={key === "password" ? 6 : undefined}
                style={{ height: 46, padding: "0 14px", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, color: "#0f172a", outline: "none", background: "#fff" }} />
            </label>
          ))}

          {err && <div style={{ fontSize: 13, color: "#dc2626", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8, padding: "10px 14px" }}>{err}</div>}

          <button type="submit" disabled={loading} style={{ height: 50, borderRadius: 14, background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 16, border: "none", cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: loading ? 0.7 : 1, marginTop: 4 }}>
            {loading ? <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> : <>Créer mon compte <ArrowRight style={{ width: 18, height: 18 }} /></>}
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
