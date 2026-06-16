/**
 * /unsubscribe?slug=XXX  (ou ?id=UUID ou ?email=...)
 *
 * Page de désabonnement utilisateur final.
 * Lit le slug/id/email du query, appelle l'API /api/unsubscribe et
 * affiche une confirmation propre (compatible RGPD).
 *
 * Server component — RSC fetch direct vers la DB pour zéro flash de
 * "chargement" et zéro round-trip JS.
 */
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

type SearchParams = { [k: string]: string | string[] | undefined };

async function unsubscribeFromParams(params: SearchParams): Promise<{
  ok: boolean;
  alreadyDone?: boolean;
  prospectName?: string;
  email?: string;
  error?: string;
}> {
  const slug = typeof params.slug === "string" ? params.slug : null;
  const id = typeof params.id === "string" ? params.id : null;
  const email = typeof params.email === "string" ? params.email.toLowerCase() : null;

  if (!slug && !id && !email) {
    return { ok: false, error: "Aucun identifiant fourni dans le lien" };
  }

  const supabase = db();
  let q = supabase.from("prospects").select("id, name, email, unsubscribed_at");
  if (slug) q = q.eq("slug", slug);
  else if (id) q = q.eq("id", id);
  else if (email) q = q.eq("email", email);
  const { data, error } = await q.maybeSingle();

  if (error || !data) {
    // Pas trouvé n'est pas une erreur fatale : on confirme quand même
    // le désabonnement côté user (sécu RGPD + UX).
    return { ok: true, alreadyDone: true, email: email || undefined };
  }

  if (data.unsubscribed_at) {
    return { ok: true, alreadyDone: true, prospectName: data.name, email: data.email };
  }

  const { error: upErr } = await supabase
    .from("prospects")
    .update({
      unsubscribed_at: new Date().toISOString(),
      unsubscribe_reason: "manual: oneclick",
      status: "unsubscribed",
    })
    .eq("id", data.id);

  if (upErr) {
    return { ok: false, error: upErr.message };
  }

  return { ok: true, prospectName: data.name, email: data.email };
}

export default async function UnsubscribePage(props: { searchParams: Promise<SearchParams> }) {
  const params = await props.searchParams;
  const result = await unsubscribeFromParams(params);

  const recap = result.email ? ` (${result.email})` : "";
  const isOk = result.ok;
  const already = result.alreadyDone;

  return (
    <main style={mainStyle}>
      <div style={cardStyle}>
        <div style={logoStyle}>
          <span style={logoMarkStyle}>K</span>
          <span style={logoTextStyle}>
            Klyora<span style={{ color: "#0066ff" }}> Sites</span>
          </span>
        </div>

        {isOk && !already && (
          <>
            <div style={iconWrapStyle}>
              <span style={{ ...iconStyle, background: "#10b98115", color: "#10b981" }}>✓</span>
            </div>
            <h1 style={titleStyle}>Désabonnement confirmé{recap}</h1>
            <p style={subStyle}>
              Vous ne recevrez plus aucun mail de notre part. Désolé pour le dérangement, et
              merci de nous avoir laissé une chance.
            </p>
          </>
        )}

        {isOk && already && (
          <>
            <div style={iconWrapStyle}>
              <span style={{ ...iconStyle, background: "#0066ff15", color: "#0066ff" }}>ℹ</span>
            </div>
            <h1 style={titleStyle}>Déjà désabonné{recap}</h1>
            <p style={subStyle}>
              Vous étiez déjà désabonné de nos communications. Aucun nouveau mail ne vous sera
              envoyé.
            </p>
          </>
        )}

        {!isOk && (
          <>
            <div style={iconWrapStyle}>
              <span style={{ ...iconStyle, background: "#ef444415", color: "#ef4444" }}>!</span>
            </div>
            <h1 style={titleStyle}>Erreur</h1>
            <p style={subStyle}>
              {result.error ||
                "Une erreur est survenue. Écrivez-nous à contact@klyora.fr et nous traitons votre demande dans l'heure."}
            </p>
          </>
        )}

        <hr style={hrStyle} />
        <p style={legalStyle}>
          Conformément au RGPD, vous pouvez exercer à tout moment votre droit d'opposition, de
          rectification, ou de suppression en écrivant à{" "}
          <a href="mailto:contact@klyora.fr" style={linkStyle}>
            contact@klyora.fr
          </a>
          .
        </p>
        <p style={legalStyle}>
          <a href="https://klyora.fr" style={linkStyle}>
            ← Retour à Klyora Sites
          </a>
        </p>
      </div>
    </main>
  );
}

const mainStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  padding: "20px",
};

const cardStyle: React.CSSProperties = {
  background: "#ffffff",
  borderRadius: "16px",
  padding: "40px 36px 32px",
  maxWidth: "480px",
  width: "100%",
  boxShadow: "0 20px 60px rgba(0,0,0,0.08)",
  textAlign: "center",
};

const logoStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  marginBottom: "24px",
};

const logoMarkStyle: React.CSSProperties = {
  width: "28px",
  height: "28px",
  background: "#0066ff",
  borderRadius: "6px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontWeight: 800,
  fontSize: "14px",
};

const logoTextStyle: React.CSSProperties = {
  fontWeight: 700,
  fontSize: "16px",
  color: "#0a0a0a",
};

const iconWrapStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "center",
  marginBottom: "16px",
};

const iconStyle: React.CSSProperties = {
  width: "56px",
  height: "56px",
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "26px",
  fontWeight: 700,
};

const titleStyle: React.CSSProperties = {
  fontSize: "22px",
  fontWeight: 700,
  margin: "0 0 10px",
  color: "#0a0a0a",
  letterSpacing: "-0.01em",
};

const subStyle: React.CSSProperties = {
  fontSize: "14.5px",
  color: "#525252",
  lineHeight: 1.6,
  margin: "0 0 24px",
};

const hrStyle: React.CSSProperties = {
  border: "none",
  borderTop: "1px solid #e5e5e5",
  margin: "16px 0 12px",
};

const legalStyle: React.CSSProperties = {
  fontSize: "11.5px",
  color: "#94a3b8",
  lineHeight: 1.6,
  margin: "8px 0",
};

const linkStyle: React.CSSProperties = {
  color: "#0066ff",
  textDecoration: "none",
};
