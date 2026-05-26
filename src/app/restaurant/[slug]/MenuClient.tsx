"use client";
import { useState, useEffect, useCallback, useRef } from "react";

/* ══════════════════════════════════════════════════════════════════
   MenuClient — Composant interactif côté client
   Gère : clic plat → modal, fermeture, vue AR caméra
   ══════════════════════════════════════════════════════════════════ */

export interface MenuItem {
  name: string;
  description?: string;
  price?: string | number;
  category?: string;
}

interface MenuClientProps {
  items: MenuItem[];
  groups: Record<string, MenuItem[]>;
  photos: string[];
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
  if (photos.length > 0) return { type: "photo", value: photos[index % photos.length] };
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

/* ─── Génère l'URL Pollinations.ai pour une image IA du plat ────────────── */
function buildDishImageUrl(item: MenuItem): string {
  const parts = [
    "professional food photography",
    item.name,
    item.description ? item.description.slice(0, 80) : "",
    "appetizing, restaurant quality, elegant plating, dark background, cinematic lighting",
  ].filter(Boolean);
  const prompt = parts.join(", ");
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=512&height=512&nologo=true&enhance=true`;
}

/* ══════════════════════════════════════════════════════════════════
   ARView — Caméra arrière + plat généré par IA qui flotte
   ══════════════════════════════════════════════════════════════════ */
function ARView({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camError, setCamError]   = useState<string | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [closing, setClosing]     = useState(false);

  const imageUrl = buildDishImageUrl(item);
  const price    = fmtPrice(item.price);

  /* Démarrer la caméra */
  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then((s) => {
        if (!mounted) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.play().catch(() => {});
        }
      })
      .catch(() => {
        if (mounted) setCamError("Autorisez l'accès à la caméra pour voir ce plat en AR");
      });
    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  /* Fermer avec animation */
  function handleClose() {
    setClosing(true);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setTimeout(onClose, 300);
  }

  /* Escape */
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000, background: "#000",
      opacity: closing ? 0 : 1, transition: "opacity 0.3s ease",
    }}>
      <style>{`
        @keyframes popIn  { 0%{transform:scale(0) rotate(-10deg);opacity:0} 70%{transform:scale(1.08) rotate(2deg);opacity:1} 100%{transform:scale(1) rotate(0deg);opacity:1} }
        @keyframes float  { 0%,100%{transform:translateY(0px) scale(1)} 50%{transform:translateY(-18px) scale(1.02)} }
        @keyframes glow   { 0%,100%{box-shadow:0 0 40px rgba(193,154,86,0.5),0 0 80px rgba(193,154,86,0.2)} 50%{box-shadow:0 0 60px rgba(193,154,86,0.8),0 0 120px rgba(193,154,86,0.4)} }
        @keyframes spin   { to{transform:rotate(360deg)} }
        @keyframes shimmer{ 0%{opacity:0.3}50%{opacity:0.7}100%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* Flux caméra */}
      <video
        ref={videoRef}
        autoPlay playsInline muted
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Overlay sombre léger */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)" }} />

      {/* === Plat généré par IA === */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 24,
      }}>
        {/* Spinner pendant chargement */}
        {!imgLoaded && !camError && (
          <div style={{ textAlign: "center", animation: "fadeUp 0.5s ease" }}>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              border: "3px solid rgba(193,154,86,0.3)",
              borderTopColor: "#c19a56",
              animation: "spin 1s linear infinite",
              margin: "0 auto 16px",
            }} />
            <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: 600 }}>
              Génération du plat en cours…
            </p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 4 }}>
              Powered by IA · Pollinations
            </p>
          </div>
        )}

        {/* Image du plat — cercle flottant */}
        {!camError && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={item.name}
            onLoad={() => setImgLoaded(true)}
            style={{
              width: 260, height: 260, borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid rgba(193,154,86,0.6)",
              opacity: imgLoaded ? 1 : 0,
              animation: imgLoaded ? "popIn 0.6s cubic-bezier(.2,.8,.2,1.2) forwards, float 4s ease-in-out 0.6s infinite, glow 3s ease-in-out 0.6s infinite" : "none",
              transition: "opacity 0.4s",
            }}
          />
        )}

        {/* Erreur caméra → mode image seule */}
        {camError && (
          <div style={{ textAlign: "center", padding: "0 40px", animation: "fadeUp 0.5s ease" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📷</div>
            <p style={{ color: "#fff", fontSize: 15, lineHeight: 1.6 }}>{camError}</p>
            <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, marginTop: 8 }}>
              Voici quand même la visualisation IA du plat :
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt={item.name}
              onLoad={() => setImgLoaded(true)}
              style={{
                width: 220, height: 220, borderRadius: "50%",
                objectFit: "cover", marginTop: 20,
                border: "3px solid rgba(193,154,86,0.6)",
                opacity: imgLoaded ? 1 : 0,
                animation: imgLoaded ? "popIn 0.6s ease forwards, float 4s ease-in-out 0.6s infinite, glow 3s ease-in-out 0.6s infinite" : "none",
              }}
            />
          </div>
        )}
      </div>

      {/* Fermer */}
      <button
        onClick={handleClose}
        style={{
          position: "absolute", top: 20, right: 20,
          width: 42, height: 42, borderRadius: "50%",
          background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#fff", fontSize: 18, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
      >✕</button>

      {/* Badge AR */}
      <div style={{
        position: "absolute", top: 20, left: 20,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)",
        border: "1px solid rgba(193,154,86,0.4)",
        padding: "6px 14px", borderRadius: 30,
        color: "#c19a56", fontSize: 11, fontWeight: 700,
        textTransform: "uppercase", letterSpacing: "0.08em",
        animation: "shimmer 2s ease infinite",
      }}>
        ✨ Visualisation IA
      </div>

      {/* Info plat — bas de l'écran */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)",
        padding: "80px 24px 48px",
        textAlign: "center",
        animation: "fadeUp 0.5s ease 0.3s both",
      }}>
        <h2 style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontSize: 30, fontWeight: 700, color: "#fff",
          lineHeight: 1.2, marginBottom: 8,
          textShadow: "0 2px 12px rgba(0,0,0,0.5)",
        }}>
          {item.name}
        </h2>
        {item.description && (
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 14, lineHeight: 1.6, maxWidth: 320, margin: "0 auto 16px" }}>
            {item.description}
          </p>
        )}
        {price && (
          <div style={{
            display: "inline-block",
            background: "rgba(193,154,86,0.2)",
            border: "1px solid rgba(193,154,86,0.5)",
            backdropFilter: "blur(10px)",
            padding: "8px 20px", borderRadius: 30,
            color: "#c19a56", fontWeight: 700, fontSize: 20,
          }}>
            {price}
          </div>
        )}
        <button
          onClick={handleClose}
          style={{
            display: "block", margin: "20px auto 0",
            background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", padding: "12px 28px", borderRadius: 30,
            fontWeight: 600, fontSize: 14, cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          ← Retour à la carte
        </button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   DishModal — Slide-up au clic sur un plat
   ══════════════════════════════════════════════════════════════════ */
function DishModal({
  item, index, photos, restaurantName, onClose, onAR,
}: {
  item: MenuItem;
  index: number;
  photos: string[];
  restaurantName: string;
  onClose: () => void;
  onAR: () => void;
}) {
  const bg    = getDishBg(item, photos, index);
  const price = fmtPrice(item.price);
  const cfg   = getCat(item.category);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.75)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <style>{`
        @keyframes fadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes slideUp { from{transform:translateY(100%)} to{transform:translateY(0)} }
      `}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, margin: "0 auto",
          background: "#FAFAF8", borderRadius: "24px 24px 0 0",
          overflow: "hidden",
          animation: "slideUp 0.3s cubic-bezier(.2,.7,.2,1)",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        {/* Image / gradient */}
        <div style={{ position: "relative", height: 280 }}>
          {bg.type === "photo" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bg.value} alt={item.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: bg.value }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 60%)" }} />
          <button onClick={onClose} style={{
            position: "absolute", top: 16, right: 16,
            width: 36, height: 36, borderRadius: "50%",
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#fff", fontSize: 18, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}>✕</button>
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
            <p style={{ fontSize: 15, color: "#6B7280", lineHeight: 1.7, marginBottom: 20 }}>
              {item.description}
            </p>
          )}

          {/* Prix + restaurant */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", background: "#fff", borderRadius: 14,
            border: "1px solid #F0EDE8", marginBottom: 16,
          }}>
            <div>
              <div style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {restaurantName}
              </div>
              {price ? (
                <div style={{ fontSize: 26, fontWeight: 700, color: "#111827", marginTop: 2 }}>{price}</div>
              ) : (
                <div style={{ fontSize: 13, color: "#9CA3AF", marginTop: 2 }}>Prix disponible en salle</div>
              )}
            </div>
            <div style={{
              width: 48, height: 48, borderRadius: 14,
              background: `linear-gradient(135deg, ${cfg.g1}, ${cfg.g2})`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
            }}>
              {cfg.emoji}
            </div>
          </div>

          {/* ✨ Bouton AR */}
          <button
            onClick={onAR}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #1a1310 0%, #2d1f0e 100%)",
              color: "#c19a56",
              padding: "16px 24px", borderRadius: 14,
              fontWeight: 700, fontSize: 15,
              border: "1px solid rgba(193,154,86,0.3)",
              cursor: "pointer", fontFamily: "inherit",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              marginBottom: 12,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
            }}
          >
            <span style={{ fontSize: 20 }}>📷</span>
            Voir ce plat en réalité augmentée
          </button>

          {/* Retour */}
          <button
            onClick={onClose}
            style={{
              width: "100%", background: "#F3F4F6", color: "#6B7280",
              padding: "13px 24px", borderRadius: 14,
              fontWeight: 600, fontSize: 14,
              border: "none", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            Retour à la carte
          </button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MenuClient — composant principal
   ══════════════════════════════════════════════════════════════════ */
export default function MenuClient({ groups, photos, restaurantName, isDemo }: MenuClientProps) {
  const [selectedItem, setSelectedItem] = useState<{ item: MenuItem; index: number } | null>(null);
  const [arItem, setArItem]             = useState<MenuItem | null>(null);
  const cats = Object.keys(groups);

  let globalIndex = 0;

  const close    = useCallback(() => setSelectedItem(null), []);
  const closeAR  = useCallback(() => setArItem(null), []);

  function openAR() {
    if (!selectedItem) return;
    setSelectedItem(null);  // ferme le modal
    setArItem(selectedItem.item);
  }

  return (
    <>
      {/* ── Liste des catégories + plats ─────────────────────────────── */}
      <div style={{ paddingBottom: 8 }}>
        {cats.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "#9CA3AF" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🍴</div>
            <p style={{ fontSize: 15 }}>La carte arrive bientôt…</p>
          </div>
        ) : cats.map((cat) => {
          const cfg      = getCat(cat);
          const catItems = groups[cat];
          return (
            <div key={cat}>
              {/* Header catégorie */}
              <div style={{ padding: "24px 20px 10px", display: "flex", alignItems: "center", gap: 12 }}>
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
                  fontSize: 20, fontWeight: 700, color: cfg.text, flex: 1,
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
                  const idx   = globalIndex++;
                  const price = fmtPrice(item.price);
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedItem({ item, index: idx })}
                      style={{
                        background: "#fff", borderRadius: 14,
                        border: "1px solid #F0EDE8", padding: "14px 16px",
                        display: "flex", gap: 12, alignItems: "flex-start",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        cursor: "pointer", textAlign: "left",
                        width: "100%", fontFamily: "inherit",
                        transition: "transform 0.15s, box-shadow 0.15s",
                      }}
                      onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)"; }}
                      onMouseUp={(e)   => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                        background: `linear-gradient(135deg,${cfg.g1},${cfg.g2})`,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14.5, color: "#111827", lineHeight: 1.35 }}>
                          {item.name}
                        </div>
                        {item.description && (
                          <div style={{
                            marginTop: 3, fontSize: 12.5, color: "#9CA3AF", lineHeight: 1.45,
                            overflow: "hidden", textOverflow: "ellipsis",
                            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                          } as React.CSSProperties}>
                            {item.description}
                          </div>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", flexShrink: 0, gap: 6 }}>
                        {price && <div style={{ fontWeight: 700, fontSize: 15, color: "#111827" }}>{price}</div>}
                        <div style={{
                          width: 24, height: 24, borderRadius: 8,
                          background: `linear-gradient(135deg,${cfg.g1},${cfg.g2})`,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                        }}>👁</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Modal plat ────────────────────────────────────────────────── */}
      {selectedItem && !arItem && (
        <DishModal
          item={selectedItem.item}
          index={selectedItem.index}
          photos={photos}
          restaurantName={restaurantName}
          onClose={close}
          onAR={openAR}
        />
      )}

      {/* ── Vue AR ────────────────────────────────────────────────────── */}
      {arItem && (
        <ARView item={arItem} onClose={closeAR} />
      )}

      {/* Supprimer l'avertissement unused */}
      {isDemo && <></>}
    </>
  );
}
