"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DirectorLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/director/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur de connexion");
        return;
      }
      // Si is_first_login → forcer changement
      if (data.must_change_password) {
        router.push("/director/change-password");
      } else {
        router.push("/director/welcome");
      }
    } catch {
      setError("Erreur réseau, réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="d-container" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="d-card" style={{ width: "100%", maxWidth: 460, padding: 40 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--d-gold)", marginBottom: 8 }}>
            WEBCONCEPTOR DIRECTOR
          </div>
          <h1 className="d-display d-h2" style={{ marginBottom: 8 }}>Connexion à votre tableau de bord</h1>
          <p style={{ color: "var(--d-text-3)", fontSize: 14, margin: 0 }}>
            Utilisez les identifiants reçus par email
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 18 }}>
            <label className="d-label" htmlFor="email">Email</label>
            <input
              id="email"
              className="d-input"
              type="email"
              required
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.fr"
            />
          </div>

          <div style={{ marginBottom: 18 }}>
            <label className="d-label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              className="d-input"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe temporaire ou définitif"
            />
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "rgba(255, 59, 107, 0.10)", border: "1px solid rgba(255, 59, 107, 0.30)", color: "var(--d-danger)", borderRadius: "var(--d-radius-md)", fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="d-btn-primary"
            style={{ width: "100%" }}
            disabled={loading || !email || !password}
          >
            {loading ? "Connexion…" : "Se connecter →"}
          </button>
        </form>

        <p style={{ marginTop: 24, fontSize: 12, color: "var(--d-text-3)", textAlign: "center" }}>
          Première connexion ? Vous changerez votre mot de passe juste après.
        </p>
      </div>
    </div>
  );
}
