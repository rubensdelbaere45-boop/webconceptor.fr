import { createClient } from "@supabase/supabase-js";

/* ══════════════════════════════════════════════════════════════════
   Page de confirmation post-paiement Stripe
   URL : /restaurant/[slug]/merci?session_id=xxx
   ══════════════════════════════════════════════════════════════════ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://webconceptor.fr";

export default async function MerciPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { slug }       = await params;
  const { session_id } = await searchParams;

  /* Fetch restaurant pour afficher les infos */
  const { data: restaurant } = await getSupabase()
    .from("tableflow_prospects")
    .select("name, city, cuisine_type, photos, admin_token")
    .eq("slug", slug)
    .single();

  const name       = restaurant?.name || "votre restaurant";
  const cover      = restaurant?.photos?.[0] || null;
  const adminToken = restaurant?.admin_token || "";
  const adminUrl   = `${BASE_URL}/restaurant/${slug}/admin?token=${adminToken}`;
  const menuUrl    = `/restaurant/${slug}`;
  const qrUrl      = `/api/tableflow/qrcode?slug=${slug}&size=500x500`;

  /* On logge le session_id (pas de vérif côté client pour sécurité) */
  void session_id;

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <title>Bienvenue sur TableFlow — {name}</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', -apple-system, sans-serif; background: #F9FAFB; min-height: 100vh; -webkit-font-smoothing: antialiased; }
          @keyframes popIn { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.1);opacity:1} 100%{transform:scale(1);opacity:1} }
          @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
          .serif { font-family: 'Playfair Display', Georgia, serif; }
        `}</style>
      </head>
      <body>
        <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 0 60px" }}>

          {/* Hero */}
          <div style={{
            position: "relative", height: 260, overflow: "hidden",
            background: "linear-gradient(135deg,#1a1310 0%,#2d1f0e 100%)",
          }}>
            {cover && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cover} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.4 }} />
            )}
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
              {/* Checkmark animé */}
              <div style={{
                width: 72, height: 72, borderRadius: "50%",
                background: "linear-gradient(135deg, #059669, #34d399)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 36, marginBottom: 16,
                animation: "popIn 0.6s cubic-bezier(.2,.8,.2,1.2) forwards",
                boxShadow: "0 8px 32px rgba(5,150,105,0.4)",
              }}>
                ✓
              </div>
              <h1 className="serif" style={{ color: "#fff", fontSize: 26, textAlign: "center", marginBottom: 8 }}>
                Paiement confirmé !
              </h1>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14, textAlign: "center" }}>
                {name} est maintenant sur TableFlow
              </p>
            </div>
          </div>

          {/* Content */}
          <div style={{ padding: "28px 20px", animation: "fadeUp 0.5s ease 0.3s both" }}>

            {/* Email check */}
            <div style={{
              background: "#fff", borderRadius: 16, border: "1px solid #F0EDE8",
              padding: "20px", marginBottom: 16,
              display: "flex", gap: 14, alignItems: "flex-start",
              boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
            }}>
              <span style={{ fontSize: 28 }}>📧</span>
              <div>
                <p style={{ fontWeight: 700, color: "#111827", marginBottom: 4 }}>Vérifiez vos emails</p>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>
                  Nous venons de vous envoyer votre lien d&apos;accès admin et votre QR code. Regardez aussi dans vos spams.
                </p>
              </div>
            </div>

            {/* Admin link */}
            {adminToken && (
              <a
                href={adminUrl}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  background: "linear-gradient(135deg,#1a1310 0%,#2d1f0e 100%)",
                  color: "#c19a56", padding: "18px 20px", borderRadius: 16,
                  textDecoration: "none", marginBottom: 12,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>🔧 Mon espace admin</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 3 }}>
                    Gérer ma carte · QR code · Modifications
                  </div>
                </div>
                <span style={{ fontSize: 20 }}>→</span>
              </a>
            )}

            {/* View menu */}
            <a
              href={menuUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#fff", border: "1.5px solid #E5E7EB",
                color: "#111827", padding: "16px 20px", borderRadius: 16,
                textDecoration: "none", marginBottom: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>👁 Voir ma carte</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>Comme vos clients la voient</div>
              </div>
              <span style={{ fontSize: 16, color: "#9CA3AF" }}>→</span>
            </a>

            {/* Download QR */}
            <a
              href={qrUrl}
              download={`qrcode-${slug}.png`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                background: "#fff", border: "1.5px solid #E5E7EB",
                color: "#111827", padding: "16px 20px", borderRadius: 16,
                textDecoration: "none", marginBottom: 28,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>⬇ Télécharger mon QR code</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 3 }}>À imprimer pour vos tables</div>
              </div>
              <span style={{ fontSize: 16, color: "#9CA3AF" }}>→</span>
            </a>

            {/* Étapes */}
            <p style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 16 }}>
              Prochaines étapes
            </p>
            {[
              { emoji: "🍽", text: "Vérifiez votre carte dans l'espace admin et ajoutez vos plats si besoin" },
              { emoji: "🖨", text: "Imprimez votre QR code et plastifiez-le pour vos tables" },
              { emoji: "📱", text: "Testez l'expérience client en scannant le QR depuis votre téléphone" },
            ].map(({ emoji, text }, i) => (
              <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "flex-start" }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "#F9FAFB", border: "1px solid #E5E7EB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 18, flexShrink: 0,
                }}>
                  {emoji}
                </div>
                <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, margin: 0, paddingTop: 6 }}>{text}</p>
              </div>
            ))}

            {/* Contact */}
            <div style={{
              background: "#F9FAFB", borderRadius: 12, padding: "16px 20px", marginTop: 24,
              border: "1px solid #E5E7EB", textAlign: "center",
            }}>
              <p style={{ fontSize: 13, color: "#9CA3AF" }}>
                Une question ? Répondez à l&apos;email de confirmation ou écrivez à{" "}
                <a href="mailto:contact@webconceptor.fr" style={{ color: "#c19a56", fontWeight: 600 }}>
                  contact@webconceptor.fr
                </a>
              </p>
            </div>
          </div>

        </div>
      </body>
    </html>
  );
}

export const dynamic = "force-dynamic";
