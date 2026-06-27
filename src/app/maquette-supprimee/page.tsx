/**
 * Page de confirmation après opt-out via le bouton "Pas intéressé"
 * du watermark sur /prospects/[slug].
 *
 * Pas de logique : la suppression a déjà eu lieu via POST /api/public/not-interested.
 * Cette page sert uniquement de landing rassurante après l'animation poubelle.
 */
export const dynamic = "force-static";

export const metadata = {
  title: "Maquette supprimée — Klyora",
  robots: { index: false, follow: false },
};

export default function MaquetteSupprimeePage() {
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
      <div style={{
        maxWidth: 520,
        width: "100%",
        background: "#fff",
        borderRadius: 22,
        padding: "44px 36px",
        boxShadow: "0 1px 3px rgba(0,0,0,.04), 0 12px 32px rgba(0,0,0,.06)",
        textAlign: "center",
      }}>
        <div style={{
          width: 72, height: 72, margin: "0 auto 20px",
          borderRadius: "50%",
          background: "#dcfce7",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <h1 style={{
          fontSize: 32,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          margin: "0 0 12px",
        }}>
          Votre maquette a bien été supprimée
        </h1>

        <p style={{
          fontSize: 16,
          lineHeight: 1.55,
          color: "#424245",
          margin: "0 auto 8px",
          maxWidth: 420,
        }}>
          La maquette de démonstration a été retirée définitivement de nos serveurs.
          Aucune copie n'est conservée.
        </p>

        <p style={{
          fontSize: 14,
          lineHeight: 1.5,
          color: "#6e6e73",
          margin: "0 auto 28px",
          maxWidth: 420,
        }}>
          Votre domaine a également été ajouté à notre liste d'exclusion : vous ne
          recevrez plus aucun message Klyora et aucune future maquette ne sera
          générée à partir de votre site.
        </p>

        <a
          href="https://klyora.fr"
          style={{
            display: "inline-block",
            padding: "12px 24px",
            borderRadius: 999,
            background: "#1d1d1f",
            color: "#fff",
            textDecoration: "none",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Retour à klyora.fr
        </a>

        <p style={{
          fontSize: 11,
          color: "#86868b",
          marginTop: 32,
          lineHeight: 1.5,
        }}>
          Demande traitée conformément au RGPD. Un audit horodaté (date, IP) est
          conservé à seule fin de preuve juridique de l'exécution.
        </p>
      </div>
    </div>
  );
}
