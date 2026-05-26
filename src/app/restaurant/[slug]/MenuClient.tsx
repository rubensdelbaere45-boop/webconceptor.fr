"use client";
import { useState, useEffect, useCallback } from "react";

/* ══════════════════════════════════════════
   MenuClient — Composant interactif côté client
   Gère : clic sur plat → modal immersif, fermeture, etc.
   ══════════════════════════════════════════ */

export interface MenuItem {
  name: string;
  description?: string;
  price?: string | number;
  category?: string;
}

interface MenuClientProps {
  items: MenuItem[];
  groups: Record<string, MenuItem[]>;
  photos: string[];         // photos du restaurant (Google Places)
  restaurantName: string;
  isDemo: boolean;
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const CATEGORY_CONFIG: Record<string, { emoji: string; g1: string; g2: string; text: string }> = {
  "Entrées":           { emoji: "🥗", g1: "#D8F3DC", g2: "#B7E4C7", text: "#1B4332" },
  "Plats":             { emoji: "🍽️", g1: "#FFE8E8", g2: "#FECDD3", text: "#881337" },
  "Desserts":          { emoji: "🍮", g1: "#FEF9C3", g2: "#FEF08A", text: "#713F12" },
  "Boissons":          { emoji: "🥤", g1: "#DBEAFE", g2: "#BFDBFE", text: "#1E3A8A" },
  "Vins":              { emoji: "🍷", g1: "#FCE7F3", g2: "#FBCFE8", text: "#831843" },
  "Pizzas":            { emoji: "🍕", g1: "#FFEDD5", g2: "#FED7AA", text: "#9A3412" },
  "Burgers":           { emoji: "🍔", g1: "#ECFCCB", g2: "#D9F99D", text: "#365314" },
  "Formules":          { emoji: "🎁", g1: "#EDE9FE", g2: "#DDD6FE", text: "#4C1D95" },
  "Mezze":             { emoji: "🫒", g1: "#ECFDF5", g2: "#A7F3D0", text: "#065F46" },
  "Sushis":            { emoji: "🍣", g1: "#FFF1F2", g2: "#FFE4E6", text: "#881337" },
  "Ramens":            { emoji: "🍜", g1: "#FFF7ED", g2: "#FED7AA", text: "#7C2D12" },
  "Galettes salées":   { emoji: "🫓", g1: "#FEF3C7", g2: "#FDE68A", text: "#78350F" },
  "Crêpes sucrées":    { emoji: "🥞", g1: "#FFFBEB", g2: "#FEF9C3", text: "#713F12" },
  "Salades":           { emoji: "🥙", g1: "#F0FDF4", g2: "#BBF7D0", text: "#14532D" },
  "Accompagnements":   { emoji: "🥔", g1: "#FEF9C3", g2: "#FDE68A", text: "#78350F" },
  "Tapas":             { emoji: "🫒", g1: "#ECFDF5", g2: "#A7F3D0", text: "#065F46" },
};
function getCat(cat?: string) {
  if (!cat) return { emoji: "🍴", g1: "#F3F4F6", g2: "#E5E7EB", text: "#111827" };
  return CATEGORY_CONFIG[cat] ?? { emoji: "🍴", g1: "#F3F4F6", g2: "#E5E7EB", text: "#111827" };
}

function fmtPrice(p?: string | number): string {
  if (!p && p !== 0) return "";
  const n = typeof p === "string" ? parseFloat(p.replace(",", ".")) : p;
  if (isNaN(n) || n === 0) return "";
  return n % 1 === 0 ? `${n} €` : `${n.toFixed(2).replace(".", ",")} €`;
}

/* ─── Image du plat : photo du restaurant ou dégradé coloré ─────────────── */
function getDishBg(item: MenuItem, photos: string[], index: number): { type: "photo" | "gradient"; value: string } {
  // Utilise les photos du restaurant en rotation
  if (photos.length > 0) {
    return { type: "photo", value: photos[index % photos.length] };
  }
  const gradients = [
    "linear-gradient(135deg,#1a1310 0%,#3d2a14 60%,#c19a56 130%)",
    "linear-gradient(135deg,#0f2027 0%,#203a43 50%,#2c5364 100%)",
    "linear-gradient(135deg,#1B4332 0%,#2D6A4F 60%,#74C69D 130%)",
    "linear-gradient(135deg,#581C87 0%,#7C3AED 60%,#A78BFA 130%)",
    "linear-gradient(135deg,#7F1D1D 0%,#991B1B 60%,#EF4444 130%)",
    "linear-gradient(135deg,#1E3A8A 0%,#1D4ED8 60%,#60A5FA 130%)",
  ];
  return { type: "gradient", value: gradients[index % gradients.length] };
}

/* ─── Modal plat ─────────────────────────────────────────────────────────── */
function DishModal({
  item, index, photos, restaurantName, onClose
}: {
  item: MenuItem;
  index: number;
  photos: string[];
  restaurantName: string;
  onClose: () => void;
}) {
  const bg = getDishBg(item, photos, index);
  const price = fmtPrice(item.price);
  const cfg = getCat(item.category);

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { transform:translateY(100%) } to { transform:translateY(0) } }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, margin: "0 auto",
          background: "#FAFAF8",
          borderRadius: "24px 24px 0 0",
          overflow: "hidden",
          animation: "slideUp 0.3s cubic-bezier(.2,.7,.2,1)",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        {/* Image / gradient */}
        <div style={{ position: "relative", height: 280 }}>
          {bg.type === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={bg.value}
              alt={item.name}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", background: bg.value }} />
          )}
          {/* Overlay gradient bas */}
          <div style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)",
          }} />
          {/* Bouton fermer */}
          <button
            onClick={onClose}
            style={{
              position: "absolute", top: 16, right: 16,
              width: 36, height: 36, borderRadius: "50%",
              background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff", fontSize: 18, fontWeight: 700,
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
          {/* Badge catégorie */}
          <div style={{
            position: "absolute", bottom: 16, left: 16,
            display: "flex", alignItems: "center", gap: 6,
            background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.25)",
            padding: "5px 12px", borderRadius: 20,
            color: "#fff", fontSize: 12, fontWeight: 600,
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>
            {cfg.emoji} {item.category || "Carte"}
          </div>
        </div>

        {/* Contenu */}
        <div style={{ padding: "24px 24px 40px" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 28, fontWeight: 700, color: "#111827",
            lineHeight: 1.2, marginBottom: 12,
          }}>
            {item.name}
          </h2>

          {item.description && (
            <p style={{
              fontSize: 15, color: "#6B7280",
              lineHeight: 1.7, marginBottom: 20,
            }}>
              {item.description}
            </p>
          )}

          {/* Prix + restaurant */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px",
            background: "#fff",
            borderRadius: 14,
            border: "1px solid #F0EDE8",
            marginBottom: 20,
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {restaurantName}
              </div>
              {price && (
                <div style={{ fontSize: 26, fontWeight: 700, color: "#111827", marginTop: 2 }}>
                  {price}
                </div>
              )}
              {!price && (
                <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>
                  Prix disponible en salle
                </div>
              )}
            </div>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `linear-gradient(135deg, ${cfg.g1}, ${cfg.g2})`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24,
            }}>
              {cfg.emoji}
            </div>
          </div>

          {/* Bouton fermer */}
          <button
            onClick={onClose}
            style={{
              width: "100%",
              background: "#111827", color: "#fff",
              padding: "16px 24px", borderRadius: 14,
              fontWeight: 700, fontSize: 15,
              border: "none", cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Retour à la carte
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Menu interactif principal ──────────────────────────────────────────── */
export default function MenuClient({ groups, photos, restaurantName, isDemo }: MenuClientProps) {
  const [selectedItem, setSelectedItem] = useState<{ item: MenuItem; index: number } | null>(null);
  const cats = Object.keys(groups);

  // Index global des plats pour varier les images
  let globalIndex = 0;

  const close = useCallback(() => setSelectedItem(null), []);

  return (
    <>
      {/* ── Liste des catégories + plats ────────────────────────────────── */}
      <div style={{ paddingBottom: 8 }}>
        {cats.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#9CA3AF" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍴</div>
            <p style={{ fontSize: 15 }}>La carte arrive bientôt…</p>
          </div>
        ) : cats.map((cat) => {
          const cfg = getCat(cat);
          const catItems = groups[cat];
          return (
            <div key={cat}>
              {/* Header catégorie */}
              <div style={{
                padding: "24px 20px 10px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  width: 38, height: 38, borderRadius: 12,
                  background: `linear-gradient(135deg,${cfg.g1},${cfg.g2})`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>
                  {cfg.emoji}
                </div>
                <h2 style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: 20, fontWeight: 700, color: cfg.text,
                  flex: 1,
                }}>
                  {cat}
                </h2>
                <span style={{ fontSize: 12, color: "#9CA3AF" }}>
                  {catItems.length} plat{catItems.length > 1 ? "s" : ""}
                </span>
              </div>

              {/* Items */}
              <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                {catItems.map((item) => {
                  const idx = globalIndex++;
                  const price = fmtPrice(item.price);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedItem({ item, index: idx })}
                      style={{
                        background: "#fff",
                        borderRadius: 14,
                        border: "1px solid #F0EDE8",
                        padding: "14px 16px",
                        display: "flex", gap: 12, alignItems: "flex-start",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        cursor: "pointer", textAlign: "left",
                        width: "100%", fontFamily: "inherit",
                        transition: "transform 0.15s, box-shadow 0.15s",
                      }}
                      onMouseDown={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)";
                      }}
                      onMouseUp={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = "";
                      }}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", marginTop: 5,
                        flexShrink: 0,
                        background: `linear-gradient(135deg,${cfg.g1},${cfg.g2})`,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14.5, color: "#111827", lineHeight: 1.35 }}>
                          {item.name}
                        </div>
                        {item.description && (
                          <div style={{
                            marginTop: 3, fontSize: 12.5, color: "#9CA3AF",
                            lineHeight: 1.45,
                            overflow: "hidden", textOverflow: "ellipsis",
                            display: "-webkit-box", WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          } as React.CSSProperties}>
                            {item.description}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, gap: 6 }}>
                        {price && <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{price}</div>}
                        {/* Icône "voir" */}
                        <div style={{
                          width: 24, height: 24, borderRadius: 8,
                          background: `linear-gradient(135deg,${cfg.g1},${cfg.g2})`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 12,
                        }}>
                          👁
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal plat ──────────────────────────────────────────────────── */}
      {selectedItem && (
        <DishModal
          item={selectedItem.item}
          index={selectedItem.index}
          photos={photos}
          restaurantName={restaurantName}
          onClose={close}
        />
      )}
    </>
  );
}
