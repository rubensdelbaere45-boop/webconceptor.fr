import { createClient } from "@supabase/supabase-js";
import { notFound } from "next/navigation";

/* ══════════════════════════════════════════
   TableFlow — Page menu QR mobile-first
   URL : /restaurant/[slug]
   Visible par : le restaurateur (démo depuis l'email)
                 les clients du restaurant (QR code à table)
   ══════════════════════════════════════════ */

interface MenuItem {
  name: string;
  description?: string;
  price?: string | number;
  category?: string;
}

interface TableflowProspect {
  id: string;
  slug: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  google_rating?: number;
  google_reviews_count?: number;
  photos?: string[];
  hours?: string;
  cuisine_type?: string;
  menu_items?: MenuItem[] | null;
  status?: string;
  is_live?: boolean;
}

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function getProspect(slug: string): Promise<TableflowProspect | null> {
  const sb = getSupabase();
  const { data } = await sb
    .from("tableflow_prospects")
    .select("*")
    .eq("slug", slug)
    .single();
  return data || null;
}

// Catégories et leurs emojis / couleurs
const CATEGORY_META: Record<string, { emoji: string; color: string; bg: string }> = {
  "entrée":       { emoji: "🥗", color: "#2D6A4F", bg: "#D8F3DC" },
  "entrées":      { emoji: "🥗", color: "#2D6A4F", bg: "#D8F3DC" },
  "plat":         { emoji: "🍽️", color: "#9B2335", bg: "#FFE5E8" },
  "plats":        { emoji: "🍽️", color: "#9B2335", bg: "#FFE5E8" },
  "dessert":      { emoji: "🍮", color: "#7B5E00", bg: "#FFF3CD" },
  "desserts":     { emoji: "🍮", color: "#7B5E00", bg: "#FFF3CD" },
  "boisson":      { emoji: "🥤", color: "#1565A0", bg: "#DBEAFE" },
  "boissons":     { emoji: "🥤", color: "#1565A0", bg: "#DBEAFE" },
  "vins":         { emoji: "🍷", color: "#6B2737", bg: "#FCE7F3" },
  "formule":      { emoji: "🎁", color: "#5B21B6", bg: "#EDE9FE" },
  "formules":     { emoji: "🎁", color: "#5B21B6", bg: "#EDE9FE" },
  "pizza":        { emoji: "🍕", color: "#C2410C", bg: "#FFEDD5" },
  "pizzas":       { emoji: "🍕", color: "#C2410C", bg: "#FFEDD5" },
  "pâtes":        { emoji: "🍝", color: "#B45309", bg: "#FEF3C7" },
  "galettes":     { emoji: "🫓", color: "#92400E", bg: "#FEF3C7" },
  "galettes salées": { emoji: "🫓", color: "#92400E", bg: "#FEF3C7" },
  "crêpes":       { emoji: "🥞", color: "#D97706", bg: "#FEF9C3" },
  "crêpes sucrées": { emoji: "🥞", color: "#D97706", bg: "#FEF9C3" },
  "fromages":     { emoji: "🧀", color: "#854D0E", bg: "#FEF9C3" },
  "viandes":      { emoji: "🥩", color: "#991B1B", bg: "#FEE2E2" },
  "poissons":     { emoji: "🐟", color: "#075985", bg: "#E0F2FE" },
  "végétarien":   { emoji: "🥦", color: "#166534", bg: "#DCFCE7" },
  "végétariens":  { emoji: "🥦", color: "#166534", bg: "#DCFCE7" },
  "pains":        { emoji: "🥖", color: "#92400E", bg: "#FEF3C7" },
  "viennoiseries":{ emoji: "🥐", color: "#B45309", bg: "#FEF9C3" },
  "pâtisseries":  { emoji: "🍰", color: "#BE185D", bg: "#FCE7F3" },
  "sandwichs":    { emoji: "🥪", color: "#65A30D", bg: "#ECFCCB" },
  "burgers":      { emoji: "🍔", color: "#C2410C", bg: "#FFEDD5" },
  "salades":      { emoji: "🥙", color: "#15803D", bg: "#D1FAE5" },
  "tapas":        { emoji: "🫒", color: "#4D7C0F", bg: "#ECFCCB" },
};

function getCategoryMeta(cat?: string) {
  if (!cat) return { emoji: "🍴", color: "#374151", bg: "#F3F4F6" };
  const key = cat.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const normalizedMap = Object.entries(CATEGORY_META).reduce((acc, [k, v]) => {
    const nk = k.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    acc[nk] = v;
    return acc;
  }, {} as Record<string, typeof CATEGORY_META[string]>);
  return normalizedMap[key] || { emoji: "🍴", color: "#374151", bg: "#F3F4F6" };
}

function groupByCategory(items: MenuItem[]): Record<string, MenuItem[]> {
  const groups: Record<string, MenuItem[]> = {};
  for (const item of items) {
    const cat = item.category || "Carte";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }
  return groups;
}

function formatPrice(price?: string | number): string {
  if (price === undefined || price === null || price === "") return "";
  const n = typeof price === "string" ? parseFloat(price.replace(",", ".")) : price;
  if (isNaN(n) || n === 0) return "";
  return `${n.toFixed(2).replace(".", ",")} €`;
}

function formatRating(rating?: number): string {
  if (!rating) return "";
  return rating.toFixed(1).replace(".", ",");
}

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const prospect = await getProspect(slug);
  if (!prospect) notFound();

  const isDemo = !prospect.is_live;
  const menuItems = prospect.menu_items || [];
  const groups = groupByCategory(menuItems);
  const categories = Object.keys(groups);
  const coverPhoto = prospect.photos?.[0] || null;
  const secondPhoto = prospect.photos?.[1] || null;

  return (
    <>
      <head>
        <title>{prospect.name} — Menu digital</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content={`Découvrez la carte de ${prospect.name} à ${prospect.city || ""}`} />
        <meta name="robots" content="noindex" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>

      <div style={{ fontFamily: "'Inter', system-ui, sans-serif", background: "#FAFAF8", minHeight: "100vh", maxWidth: 480, margin: "0 auto" }}>

        {/* BANNER DÉMO */}
        {isDemo && (
          <div style={{
            background: "linear-gradient(135deg, #1a1310, #2d1f0e)",
            color: "#f9f5ef",
            padding: "14px 20px",
            textAlign: "center",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>
              ✨ Aperçu TableFlow — Menu digital de {prospect.name}
            </p>
            <a
              href="https://webconceptor.fr/tableflow"
              style={{
                display: "inline-block", marginTop: 8,
                background: "#c19a56", color: "#1a1310",
                padding: "7px 18px", borderRadius: 20,
                fontWeight: 700, fontSize: 12, textDecoration: "none",
              }}
            >
              Activer ce menu — 49 €/mois →
            </a>
          </div>
        )}

        {/* HERO : Photo couverture */}
        <div style={{ position: "relative", height: 220, overflow: "hidden" }}>
          {coverPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverPhoto}
              alt={prospect.name}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <div style={{
              width: "100%", height: "100%",
              background: "linear-gradient(135deg, #1a1310 0%, #3d2a14 50%, #c19a56 130%)",
            }} />
          )}
          {/* Gradient overlay */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)",
          }} />
          {/* Nom restaurant */}
          <div style={{ position: "absolute", bottom: 18, left: 20, right: 20 }}>
            <h1 style={{
              margin: 0, color: "#fff",
              fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em",
              textShadow: "0 2px 8px rgba(0,0,0,0.5)",
            }}>
              {prospect.name}
            </h1>
            {prospect.city && (
              <p style={{ margin: "4px 0 0", color: "rgba(255,255,255,0.85)", fontSize: 13 }}>
                📍 {prospect.address || prospect.city}
              </p>
            )}
          </div>
        </div>

        {/* INFOS RAPIDES */}
        <div style={{
          background: "#fff",
          padding: "16px 20px",
          borderBottom: "1px solid #ECECEC",
          display: "flex", gap: 16, flexWrap: "wrap",
          alignItems: "center",
        }}>
          {prospect.google_rating && (
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ color: "#F59E0B", fontSize: 15 }}>★</span>
              <span style={{ fontWeight: 700, fontSize: 14 }}>{formatRating(prospect.google_rating)}</span>
              {prospect.google_reviews_count && (
                <span style={{ color: "#888", fontSize: 12 }}>({prospect.google_reviews_count} avis)</span>
              )}
            </div>
          )}
          {prospect.cuisine_type && (
            <span style={{
              background: "#F3F4F6", color: "#374151",
              padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 500,
            }}>
              {prospect.cuisine_type}
            </span>
          )}
          {prospect.phone && (
            <a href={`tel:${prospect.phone}`} style={{
              color: "#c19a56", fontWeight: 600, fontSize: 13, textDecoration: "none",
            }}>
              📞 {prospect.phone}
            </a>
          )}
        </div>

        {/* MENU */}
        <div style={{ padding: "8px 0 40px" }}>
          {categories.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#888" }}>
              <p style={{ fontSize: 32 }}>🍽️</p>
              <p style={{ fontSize: 15 }}>La carte arrive bientôt…</p>
            </div>
          ) : (
            categories.map((cat) => {
              const meta = getCategoryMeta(cat);
              const items = groups[cat];
              return (
                <div key={cat}>
                  {/* Header catégorie */}
                  <div style={{
                    padding: "20px 20px 10px",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{
                      fontSize: 20, width: 36, height: 36,
                      background: meta.bg, borderRadius: 10,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {meta.emoji}
                    </span>
                    <h2 style={{
                      margin: 0, fontSize: 17, fontWeight: 700,
                      color: meta.color, letterSpacing: "-0.01em",
                      textTransform: "capitalize",
                    }}>
                      {cat}
                    </h2>
                  </div>

                  {/* Items */}
                  <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 10 }}>
                    {items.map((item, i) => {
                      const price = formatPrice(item.price);
                      return (
                        <div key={i} style={{
                          background: "#fff",
                          borderRadius: 14,
                          padding: "14px 16px",
                          border: "1px solid #F0F0EC",
                          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
                          gap: 12,
                        }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{
                              fontWeight: 600, fontSize: 14, color: "#1a1310",
                              lineHeight: 1.3,
                            }}>
                              {item.name}
                            </div>
                            {item.description && (
                              <div style={{
                                marginTop: 4, fontSize: 12.5, color: "#6B7280",
                                lineHeight: 1.4,
                              }}>
                                {item.description}
                              </div>
                            )}
                          </div>
                          {price && (
                            <div style={{
                              fontWeight: 700, fontSize: 15, color: "#1a1310",
                              whiteSpace: "nowrap", flexShrink: 0,
                            }}>
                              {price}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PHOTOS SECONDAIRES */}
        {secondPhoto && (
          <div style={{ padding: "0 16px 24px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {prospect.photos?.slice(1, 5).map((photo, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={i}
                src={photo}
                alt={`${prospect.name} photo ${i + 2}`}
                style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 12 }}
              />
            ))}
          </div>
        )}

        {/* FOOTER */}
        <div style={{
          borderTop: "1px solid #ECECEC",
          padding: "20px 20px 40px",
          background: "#fff",
          textAlign: "center",
        }}>
          {prospect.hours && (
            <p style={{ margin: "0 0 12px", fontSize: 13, color: "#6B7280" }}>
              🕐 {prospect.hours}
            </p>
          )}

          {isDemo ? (
            <>
              <p style={{ margin: "0 0 14px", fontSize: 13, color: "#6B7280", lineHeight: 1.5 }}>
                Ce menu digital a été créé en quelques secondes pour {prospect.name}.<br />
                Vos clients le retrouvent en scannant un QR code à table.
              </p>
              <a
                href="https://webconceptor.fr/tableflow"
                style={{
                  display: "block",
                  background: "linear-gradient(135deg, #1a1310, #2d1f0e)",
                  color: "#f9f5ef",
                  padding: "16px 24px", borderRadius: 14,
                  fontWeight: 700, fontSize: 15, textDecoration: "none",
                  boxShadow: "0 4px 14px rgba(26,19,16,0.25)",
                }}
              >
                Activer mon menu digital — 49 €/mois
              </a>
              <p style={{ margin: "12px 0 0", fontSize: 11, color: "#9CA3AF" }}>
                14 jours gratuits · Sans engagement · Résiliable à tout moment
              </p>
            </>
          ) : (
            <p style={{ margin: 0, fontSize: 11, color: "#9CA3AF" }}>
              Menu digital propulsé par <strong>TableFlow</strong>
            </p>
          )}
        </div>
      </div>
    </>
  );
}

export const dynamic = "force-dynamic";
