import { createClient } from "@supabase/supabase-js";
import AdminClient from "./AdminClient";

/* ══════════════════════════════════════════════════════════════════
   Page admin restaurateur — auth via ?token=UUID
   URL : /restaurant/[slug]/admin?token=XXXX
   ══════════════════════════════════════════════════════════════════ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface MenuItem {
  name: string;
  description?: string;
  price?: string | number;
  category?: string;
  sold_out?: boolean;
}

interface Restaurant {
  slug: string;
  name: string;
  city?: string;
  cuisine_type?: string;
  google_rating?: number;
  google_reviews_count?: number;
  is_live?: boolean;
  photos?: string[];
  menu_items?: MenuItem[];
  admin_token: string;
  scan_count?: number;
}

/* ─── Auth error page ───────────────────────────────────────────────────── */
function Unauthorized({ reason }: { reason: string }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Accès refusé — TableFlow</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
        <style>{`
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Inter', sans-serif; background: #F9FAFB; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px; }
        `}</style>
      </head>
      <body>
        <div style={{ textAlign: "center", maxWidth: 360 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔒</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginBottom: 8 }}>Accès refusé</h1>
          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>{reason}</p>
          <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 20 }}>
            Contactez <a href="mailto:contact@klyora.fr" style={{ color: "#c19a56" }}>contact@klyora.fr</a> si vous avez besoin d&apos;aide.
          </p>
        </div>
      </body>
    </html>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default async function AdminPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { slug }  = await params;
  const { token } = await searchParams;

  if (!token) {
    return <Unauthorized reason="Lien d'administration invalide. Aucun token fourni." />;
  }

  const { data, error } = await getSupabase()
    .from("tableflow_prospects")
    .select("slug,name,city,cuisine_type,google_rating,google_reviews_count,is_live,photos,menu_items,admin_token")
    .eq("slug", slug)
    .eq("admin_token", token)
    .single<Restaurant>();

  if (error || !data) {
    return <Unauthorized reason="Token invalide ou expiré. Vérifiez le lien reçu par e-mail." />;
  }

  const restaurant = data;
  const initialItems: MenuItem[] = Array.isArray(restaurant.menu_items) ? restaurant.menu_items : [];

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <title>Gérer ma carte — {restaurant.name}</title>
        <meta name="robots" content="noindex,nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AdminClient
          restaurant={restaurant}
          initialItems={initialItems}
        />
      </body>
    </html>
  );
}

export const dynamic = "force-dynamic";
