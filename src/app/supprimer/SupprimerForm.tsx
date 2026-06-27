/**
 * Page publique /supprimer
 *
 * Formulaire de demande de suppression sans authentification : un gérant
 * d'entreprise saisit son email (et optionnellement le domaine de son
 * site), POST sur /api/public/supprimer qui purge tout et blacklist
 * le domaine.
 *
 * Le lien est mis dans tous les cold emails Klyora et dans le footer des
 * maquettes publiques, afin de désamorcer les plaintes juridiques.
 */
"use client";
import { useState } from "react";

type Result = {
  ok: boolean;
  error?: string;
  retry_after_seconds?: number;
  deleted_count?: number;
  deleted?: Array<{ slug: string; name: string | null; url_404: string }>;
  blocked_domains?: string[];
  message?: string;
};

export default function SupprimerPage() {
  const [email, setEmail] = useState("");
  const [domain, setDomain] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/public/supprimer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), domain: domain.trim() || undefined }),
      });
      const data = (await res.json()) as Result;
      setResult(data);
    } catch {
      setResult({ ok: false, error: "Erreur réseau — réessayez dans un instant." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#fbfbfd",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: 'Inter, -apple-system, "SF Pro Text", system-ui, sans-serif',
      color: "#1d1d1f",
    }}>
      <div style={{ maxWidth: 560, width: "100%", background: "#fff", borderRadius: 22, padding: 36, boxShadow: "0 1px 3px rgba(0,0,0,.04), 0 12px 32px rgba(0,0,0,.06)" }}>
        <a href="https://klyora.fr" style={{ display: "inline-block", fontSize: 13, color: "#6e6e73", textDecoration: "none", marginBottom: 24 }}>
          ← klyora.fr
        </a>
        <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.02em", marginBottom: 12 }}>
          Suppression définitive
        </h1>
        <p style={{ fontSize: 16, lineHeight: 1.5, color: "#424245", marginBottom: 24 }}>
          Vous souhaitez que toute trace de votre entreprise soit retirée de notre
          base ? Renseignez votre email professionnel et nous purgeons l'ensemble
          dans la seconde, sans question ni délai.
        </p>

        {!result?.ok && (
          <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Email (obligatoire)</span>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="contact@votresite.fr"
                style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #d2d2d7", fontSize: 15, fontFamily: "inherit", outline: "none" }}
              />
            </label>

            <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Domaine du site (recommandé)</span>
              <input
                type="text"
                value={domain}
                onChange={e => setDomain(e.target.value)}
                placeholder="votresite.fr"
                style={{ padding: "12px 14px", borderRadius: 12, border: "1px solid #d2d2d7", fontSize: 15, fontFamily: "inherit", outline: "none" }}
              />
              <span style={{ fontSize: 12, color: "#86868b" }}>
                Pour bloquer définitivement toute future importation de votre site.
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !email}
              style={{
                marginTop: 8,
                padding: "14px 20px",
                borderRadius: 999,
                border: "none",
                background: loading || !email ? "#86868b" : "#1d1d1f",
                color: "#fff",
                fontSize: 15,
                fontWeight: 600,
                cursor: loading || !email ? "not-allowed" : "pointer",
                fontFamily: "inherit",
              }}
            >
              {loading ? "Suppression en cours…" : "Supprimer maintenant"}
            </button>
          </form>
        )}

        {result && (
          <div style={{
            marginTop: result.ok ? 0 : 16,
            padding: 20,
            borderRadius: 14,
            background: result.ok ? "#f0fdf4" : "#fef2f2",
            border: `1px solid ${result.ok ? "#bbf7d0" : "#fecaca"}`,
          }}>
            {result.ok ? (
              <>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#166534", marginBottom: 8 }}>
                  ✓ Demande traitée
                </p>
                <p style={{ fontSize: 14, color: "#15803d", lineHeight: 1.5 }}>
                  {result.message}
                </p>
                {result.deleted && result.deleted.length > 0 && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #bbf7d0" }}>
                    <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>URLs supprimées (vérifiables) :</p>
                    {result.deleted.map(d => (
                      <a key={d.slug} href={d.url_404} target="_blank" rel="noopener noreferrer"
                        style={{ display: "block", fontSize: 13, color: "#166534", marginBottom: 4, wordBreak: "break-all" }}>
                        {d.url_404} ↗
                      </a>
                    ))}
                  </div>
                )}
                {result.blocked_domains && result.blocked_domains.length > 0 && (
                  <p style={{ fontSize: 13, color: "#15803d", marginTop: 12 }}>
                    Domaines blacklistés : <strong>{result.blocked_domains.join(", ")}</strong>
                  </p>
                )}
              </>
            ) : (
              <>
                <p style={{ fontSize: 16, fontWeight: 600, color: "#991b1b", marginBottom: 4 }}>
                  Erreur
                </p>
                <p style={{ fontSize: 14, color: "#b91c1c" }}>
                  {result.error === "rate_limited"
                    ? `Trop de demandes — réessayez dans ${result.retry_after_seconds} secondes.`
                    : result.error === "email_invalid"
                    ? "L'adresse email est invalide."
                    : result.error || "Erreur inconnue."}
                </p>
              </>
            )}
          </div>
        )}

        <p style={{ fontSize: 11, color: "#86868b", marginTop: 24, lineHeight: 1.5 }}>
          Conformément au RGPD, cette demande est traitée immédiatement et sans
          condition. Un audit horodaté est conservé (IP, date) à seule fin de
          preuve juridique de l'exécution.
        </p>
      </div>
    </div>
  );
}
