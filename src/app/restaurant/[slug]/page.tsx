import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";
import MenuClient from "./MenuClient";

interface MenuItem {
  name: string;
  description?: string;
  price?: string | number;
  category?: string;
}

interface Prospect {
  id: string;
  slug: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  google_rating?: number;
  google_reviews_count?: number;
  photos?: string[];
  hours?: string;
  cuisine_type?: string;
  menu_items?: MenuItem[] | null;
  editorial?: string | null;
  is_live?: boolean;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getProspect(slug: string): Promise<Prospect | null> {
  const { data } = await getSupabase()
    .from("tableflow_prospects")
    .select("*")
    .eq("slug", slug)
    .single();
  return data || null;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
function groupItems(items: MenuItem[]): Record<string, MenuItem[]> {
  const g: Record<string, MenuItem[]> = {};
  for (const item of items) {
    const c = item.category || "Carte";
    if (!g[c]) g[c] = [];
    g[c].push(item);
  }
  return g;
}

/* ─── Composant étoiles ──────────────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span style={{ color: "#F59E0B", fontSize: 14, letterSpacing: 1 }}>
      {"★".repeat(full)}{"☆".repeat(5 - full)}
    </span>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────── */
export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = await getProspect(slug);
  if (!p) notFound();

  const isDemo  = !p.is_live;
  const items   = p.menu_items || [];
  const groups  = groupItems(items);
  const cover   = p.photos?.[0] || null;
  const extraPhotos = (p.photos || []).slice(1, 5);

  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <title>{p.name} — Carte</title>
        <meta name="description" content={`La carte de ${p.name}${p.city ? ` à ${p.city}` : ""} — directement sur votre téléphone`} />
        <meta name="robots" content="noindex,nofollow" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html { -webkit-text-size-adjust: 100%; }
          body {
            font-family: 'Inter', -apple-system, sans-serif;
            background: #FAFAF8;
            color: #1a1310;
            min-height: 100vh;
            -webkit-font-smoothing: antialiased;
          }
          .page { max-width: 480px; margin: 0 auto; }
          .serif { font-family: 'Playfair Display', Georgia, serif; }

          /* Demo banner */
          .demo-bar {
            position: sticky; top: 0; z-index: 100;
            background: #1a1310;
            padding: 12px 20px;
            display: flex; align-items: center; justify-content: space-between; gap: 12px;
          }
          .demo-bar p { font-size: 12px; color: rgba(255,255,255,0.75); line-height: 1.4; }
          .demo-bar strong { color: #fff; display: block; font-size: 13px; }
          .demo-btn {
            flex-shrink: 0;
            background: #c19a56; color: #1a1310;
            padding: 9px 16px; border-radius: 30px;
            font-weight: 700; font-size: 12px; text-decoration: none;
            white-space: nowrap;
          }

          /* Hero */
          .hero { position: relative; height: 260px; overflow: hidden; }
          .hero-img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .hero-placeholder {
            width: 100%; height: 100%;
            background: linear-gradient(135deg, #1a1310 0%, #3d2a14 50%, #c19a56 130%);
          }
          .hero-overlay {
            position: absolute; inset: 0;
            background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.05) 100%);
          }
          .hero-content {
            position: absolute; bottom: 0; left: 0; right: 0;
            padding: 24px 20px 20px;
          }
          .hero-badge {
            display: inline-flex; align-items: center; gap: 5px;
            background: rgba(255,255,255,0.15);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.2);
            color: #fff; font-size: 11px; font-weight: 600;
            padding: 4px 10px; border-radius: 20px;
            margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.06em;
          }
          .hero-name {
            font-family: 'Playfair Display', Georgia, serif;
            font-size: 30px; font-weight: 700;
            color: #fff; line-height: 1.15;
            text-shadow: 0 2px 12px rgba(0,0,0,0.4);
            margin-bottom: 8px;
          }
          .hero-meta { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
          .hero-rating { display: flex; align-items: center; gap: 5px; }
          .hero-rating-num { color: #fff; font-weight: 700; font-size: 14px; }
          .hero-rating-count { color: rgba(255,255,255,0.65); font-size: 12px; }
          .hero-sep { color: rgba(255,255,255,0.3); }
          .hero-city { color: rgba(255,255,255,0.8); font-size: 13px; }

          /* Info strip */
          .info-strip {
            background: #fff;
            border-bottom: 1px solid #F0EDE8;
            padding: 14px 20px;
            display: flex; gap: 16px; flex-wrap: wrap; align-items: center;
          }
          .info-pill {
            display: flex; align-items: center; gap: 6px;
            font-size: 13px; color: #4B5563; font-weight: 500;
          }
          .info-pill a { color: #c19a56; text-decoration: none; font-weight: 600; }
          .cuisine-tag {
            background: #FFF8EE; border: 1px solid #F3E4C2;
            color: #8B5E1A; font-size: 11px; font-weight: 600;
            padding: 3px 10px; border-radius: 20px; text-transform: uppercase;
            letter-spacing: 0.05em;
          }

          /* Editorial */
          .editorial {
            padding: 16px 20px;
            font-size: 14px; color: #6B7280; line-height: 1.6; font-style: italic;
            border-bottom: 1px solid #F0EDE8;
            background: #fff;
          }

          /* Photos galerie */
          .gallery { padding: 24px 16px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
          .gallery img { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 12px; display: block; }

          /* Footer / CTA */
          .footer {
            margin-top: 32px;
            background: #fff;
            border-top: 1px solid #F0EDE8;
            padding: 24px 20px 40px;
          }
          .hours-block {
            display: flex; align-items: center; gap: 8px;
            font-size: 13px; color: #6B7280;
            padding-bottom: 20px; margin-bottom: 20px;
            border-bottom: 1px solid #F0EDE8;
          }
          .cta-box {
            background: linear-gradient(135deg, #1a1310 0%, #2d1f0e 100%);
            border-radius: 18px; padding: 24px 20px;
            text-align: center;
          }
          .cta-tagline { font-size: 11px; color: rgba(255,255,255,0.5); text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 6px; }
          .cta-price { font-size: 34px; font-weight: 700; color: #c19a56; margin-bottom: 2px; }
          .cta-price span { font-size: 16px; font-weight: 400; color: rgba(255,255,255,0.5); }
          .cta-sub { font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 18px; }
          .cta-btn {
            display: block;
            background: #c19a56; color: #1a1310;
            padding: 16px 24px; border-radius: 50px;
            font-weight: 700; font-size: 15px; text-decoration: none;
            box-shadow: 0 8px 24px rgba(193,154,86,0.35);
          }
          .cta-reassure { margin-top: 12px; font-size: 11px; color: rgba(255,255,255,0.35); }

          .powered {
            text-align: center; margin-top: 20px;
            font-size: 11px; color: #9CA3AF;
          }
          .powered strong { color: #6B7280; }
        `}</style>
      </head>

      <body>
        <div className="page">

          {/* ── BANNER DÉMO ─────────────────────────────────────────────── */}
          {isDemo && (
            <div className="demo-bar">
              <div>
                <strong>✨ Aperçu exclusif créé pour vous</strong>
                <p>Voici votre carte telle que vos clients la verront sur leur téléphone.</p>
              </div>
              <a href={`/api/tableflow/checkout?slug=${p.slug}`} className="demo-btn">
                Activer →
              </a>
            </div>
          )}

          {/* ── HERO ────────────────────────────────────────────────────── */}
          <div className="hero">
            {cover
              // eslint-disable-next-line @next/next/no-img-element
              ? <img src={cover} alt={p.name} className="hero-img" />
              : <div className="hero-placeholder" />
            }
            <div className="hero-overlay" />
            <div className="hero-content">
              {p.cuisine_type && (
                <div className="hero-badge">
                  🍽 {p.cuisine_type}
                </div>
              )}
              <h1 className="hero-name serif">{p.name}</h1>
              <div className="hero-meta">
                {p.google_rating && (
                  <div className="hero-rating">
                    <Stars rating={p.google_rating} />
                    <span className="hero-rating-num">{p.google_rating.toFixed(1).replace(".", ",")}</span>
                    {p.google_reviews_count && (
                      <span className="hero-rating-count">({p.google_reviews_count} avis)</span>
                    )}
                  </div>
                )}
                {p.city && <><span className="hero-sep">·</span><span className="hero-city">📍 {p.city}</span></>}
              </div>
            </div>
          </div>

          {/* ── INFO STRIP ──────────────────────────────────────────────── */}
          <div className="info-strip">
            {p.cuisine_type && <span className="cuisine-tag">{p.cuisine_type}</span>}
            {p.phone && (
              <div className="info-pill">
                📞 <a href={`tel:${p.phone}`}>{p.phone}</a>
              </div>
            )}
            {p.address && (
              <div className="info-pill">
                🗺 {p.address.split(",").slice(0, 2).join(",")}
              </div>
            )}
          </div>

          {/* ── DESCRIPTION ─────────────────────────────────────────────── */}
          {p.editorial && (
            <div className="editorial">
              &ldquo;{p.editorial}&rdquo;
            </div>
          )}

          {/* ── MENU (interactif, modal au clic) ───────────────────────── */}
          <MenuClient
            items={items}
            groups={groups}
            photos={p.photos || []}
            restaurantName={p.name}
            isDemo={isDemo}
          />

          {/* ── GALERIE PHOTOS ───────────────────────────────────────────── */}
          {extraPhotos.length >= 2 && (
            <div className="gallery">
              {extraPhotos.map((src, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={i} src={src} alt={`${p.name} ${i + 2}`} />
              ))}
            </div>
          )}

          {/* ── FOOTER ──────────────────────────────────────────────────── */}
          <div className="footer">
            {p.hours && (
              <div className="hours-block">
                <span style={{ fontSize: 18 }}>🕐</span>
                <span>{p.hours}</span>
              </div>
            )}

            {isDemo ? (
              <div className="cta-box">
                <p className="cta-tagline">Offre de lancement · 14 jours gratuits</p>
                <p className="cta-price">49 €<span>/mois</span></p>
                <p className="cta-sub">Sans engagement · Résiliable en 1 clic</p>
                <a href={`/api/tableflow/checkout?slug=${p.slug}`} className="cta-btn">
                  Activer mon menu digital →
                </a>
                <p className="cta-reassure">✓ Votre carte mise à jour en 2 min · ✓ QR code inclus · ✓ Paiement sécurisé Stripe</p>
              </div>
            ) : (
              <p className="powered">
                Menu propulsé par <strong>TableFlow</strong>
              </p>
            )}
          </div>

        </div>
      </body>
    </html>
  );
}

export const dynamic = "force-dynamic";
