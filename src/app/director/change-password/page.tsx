"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChangePassword() {
  const router = useRouter();
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (pwd !== confirm) {
      setError("Les deux mots de passe ne correspondent pas");
      return;
    }
    if (pwd.length < 8) {
      setError("8 caractères minimum");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/director/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_password: pwd }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur");
        return;
      }
      router.push("/director/welcome");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="d-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="d-card" style={{ width: "100%", maxWidth: 460, padding: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--d-gold)", marginBottom: 8 }}>
            ÉTAPE 1/2
          </div>
          <h1 className="d-display d-h2">Sécurisez votre compte</h1>
          <p style={{ color: "var(--d-text-3)", fontSize: 14 }}>Choisissez un mot de passe que vous retiendrez.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label className="d-label">Nouveau mot de passe</label>
            <input className="d-input" type="password" autoFocus minLength={8} value={pwd} onChange={(e) => setPwd(e.target.value)} placeholder="8 caractères minimum" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label className="d-label">Confirmation</label>
            <input className="d-input" type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Retapez votre mot de passe" />
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(255, 59, 107, 0.10)", border: "1px solid rgba(255, 59, 107, 0.30)", color: "var(--d-danger)", borderRadius: "var(--d-radius-md)", fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button type="submit" className="d-btn-primary" style={{ width: "100%" }} disabled={loading || !pwd || !confirm}>
            {loading ? "Enregistrement…" : "Valider mon mot de passe →"}
          </button>
        </form>
      </div>
    </div>
  );
}
