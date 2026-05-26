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
  sold_out?: boolean;
}

interface MenuClientProps {
  items: MenuItem[];
  groups: Record<string, MenuItem[]>;
  photos: string[];
  restaurantName: string;
  isDemo: boolean;
  phone?: string;          // pour WhatsApp
  googlePlaceId?: string;  // pour avis Google
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

/* ─── Seed déterministe → même plat = même image (cache Pollinations) ───── */
function dishSeed(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) { h = Math.imul(31, h) + str.charCodeAt(i) | 0; }
  return Math.abs(h) % 9999999;
}

/* ─── Génère l'URL Pollinations FLUX pour un rendu hyperréaliste ─────────── */
function buildDishImageUrl(item: MenuItem): string {
  const prompt = [
    "hyperrealistic food photography",
    item.name,
    item.description ? item.description.slice(0, 100) : "",
    "michelin star plating, professional chef, studio lighting, shallow depth of field, 85mm lens, bokeh background, appetizing, award-winning food photo, 4k uhd",
  ].filter(Boolean).join(", ");

  const seed = dishSeed(item.name + (item.description || ""));

  return (
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?model=flux&width=1024&height=1024&nologo=true&enhance=true&seed=${seed}`
  );
}

/* ══════════════════════════════════════════════════════════════════
   ARView — Caméra + détection surface par gyroscope
   Le plat apparaît UNIQUEMENT quand le téléphone pointe vers la table.
   Utilise DeviceOrientationEvent (100% des smartphones).
   ══════════════════════════════════════════════════════════════════ */
function ARView({ item, onClose }: { item: MenuItem; onClose: () => void }) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camError, setCamError]         = useState<string | null>(null);
  const [imgLoaded, setImgLoaded]       = useState(false);
  const [closing, setClosing]           = useState(false);
  // null = pas encore de données gyroscope | true = sur table | false = mauvais angle
  const [onTable, setOnTable]           = useState<boolean | null>(null);
  const [needsPermission, setNeedsPermission] = useState(false);

  const imageUrl = buildDishImageUrl(item);
  const price    = fmtPrice(item.price);

  /* ── Caméra arrière ─────────────────────────────────────────────── */
  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then((s) => {
        if (!mounted) { s.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) { videoRef.current.srcObject = s; videoRef.current.play().catch(() => {}); }
      })
      .catch(() => { if (mounted) setCamError("Autorisez l'accès à la caméra"); });
    return () => { mounted = false; streamRef.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  /* ── Gyroscope — détection angle de la table ────────────────────── */
  useEffect(() => {
    /* beta = inclinaison avant/arrière du téléphone
       ~90° = téléphone vertical (mode lecture)
       ~20-70° = incliné vers l'avant/bas → pointe vers une table devant soi
       ~0-20°  = pointe vers le sol juste en dessous
       ~70-90° = trop droit, pointe niveau des yeux */
    const handler = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 90;
      setOnTable(beta > 22 && beta < 70);
    };

    // iOS 13+ exige une permission explicite pour DeviceOrientation
    type DOEWithPerm = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };
    const DOE = DeviceOrientationEvent as DOEWithPerm;

    if (typeof DOE.requestPermission === "function") {
      setNeedsPermission(true); // bouton affiché, permission demandée au clic
    } else {
      // Android + anciens iOS : écoute directe
      window.addEventListener("deviceorientation", handler);
      return () => window.removeEventListener("deviceorientation", handler);
    }
  }, []);

  async function askOrientationPermission() {
    type DOEWithPerm = typeof DeviceOrientationEvent & { requestPermission?: () => Promise<string> };
    const DOE = DeviceOrientationEvent as DOEWithPerm;
    if (typeof DOE.requestPermission !== "function") return;
    try {
      const perm = await DOE.requestPermission();
      if (perm === "granted") {
        setNeedsPermission(false);
        const handler = (e: DeviceOrientationEvent) => {
          const beta = e.beta ?? 90;
          setOnTable(beta > 22 && beta < 70);
        };
        window.addEventListener("deviceorientation", handler);
      }
    } catch { /* refus silencieux */ }
  }

  /* ── Fermer ─────────────────────────────────────────────────────── */
  function handleClose() {
    setClosing(true);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setTimeout(onClose, 300);
  }

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Le plat est visible si : gyro sur table, ou pas encore de données (fallback)
  const showDish = onTable === true || onTable === null;
  // Pas de données gyro = affiche comme avant (flottant)
  const hasGyro  = onTable !== null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000, background: "#000",
      opacity: closing ? 0 : 1, transition: "opacity 0.3s ease",
      overflow: "hidden",
    }}>
      <style>{`
        @keyframes spin      { to { transform: rotate(360deg) } }
        @keyframes shimmer   { 0%,100%{opacity:0.4} 50%{opacity:0.9} }
        @keyframes fadeUp    { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes popOnTable{ 0%{transform:perspective(600px) rotateX(68deg) scale(0);opacity:0}
                               70%{transform:perspective(600px) rotateX(68deg) scale(1.07);opacity:1}
                               100%{transform:perspective(600px) rotateX(68deg) scale(1);opacity:1} }
        @keyframes breathe   { 0%,100%{transform:perspective(600px) rotateX(68deg) scale(1)}
                               50%{transform:perspective(600px) rotateX(68deg) scale(1.03)} }
        @keyframes popFloat  { 0%{transform:scale(0);opacity:0} 70%{transform:scale(1.08);opacity:1}
                               100%{transform:scale(1);opacity:1} }
        @keyframes float     { 0%,100%{transform:scale(1) translateY(0)} 50%{transform:scale(1.02) translateY(-14px)} }
        @keyframes glow      { 0%,100%{box-shadow:0 0 40px rgba(193,154,86,0.5),0 0 80px rgba(193,154,86,0.2)}
                               50%{box-shadow:0 0 60px rgba(193,154,86,0.8),0 0 120px rgba(193,154,86,0.4)} }
        @keyframes scanPulse { 0%{transform:translateX(-50%) scale(0.95);opacity:0.5}
                               50%{transform:translateX(-50%) scale(1.05);opacity:1}
                               100%{transform:translateX(-50%) scale(0.95);opacity:0.5} }
        @keyframes arrowBounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(8px)} }
        @keyframes shadowPulse { 0%,100%{transform:translateX(-50%) scaleX(1);opacity:0.5}
                                 50%{transform:translateX(-50%) scaleX(1.08);opacity:0.7} }
      `}</style>

      {/* Flux caméra */}
      <video
        ref={videoRef} autoPlay playsInline muted
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
      />

      {/* Overlay très léger pour lisibilité */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.18)" }} />

      {/* ════ ÉTAT : chargement FLUX ═════════════════════════════════ */}
      {!imgLoaded && !camError && (
        <div style={{
          position: "absolute", top: "50%", left: "50%",
          transform: "translate(-50%,-50%)",
          textAlign: "center", animation: "fadeIn 0.4s ease",
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%",
            border: "3px solid rgba(193,154,86,0.3)",
            borderTopColor: "#c19a56",
            animation: "spin 1s linear infinite",
            margin: "0 auto 14px",
          }} />
          <p style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>Génération FLUX IA…</p>
          <p style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 4 }}>Rendu hyperréaliste</p>
        </div>
      )}

      {/* ════ ÉTAT : pas de caméra ═══════════════════════════════════ */}
      {camError && imgLoaded === false && (
        <div style={{
          position: "absolute", inset: 0, display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: "0 40px", textAlign: "center",
        }}>
          <div style={{ fontSize: 44, marginBottom: 12 }}>📷</div>
          <p style={{ color: "#fff", fontSize: 14, lineHeight: 1.6 }}>{camError}</p>
        </div>
      )}

      {/* ════ ÉTAT : permission gyroscope iOS ════════════════════════ */}
      {needsPermission && imgLoaded && (
        <div style={{
          position: "absolute", bottom: 160, left: "50%", transform: "translateX(-50%)",
          textAlign: "center", animation: "fadeUp 0.5s ease",
        }}>
          <button
            onClick={askOrientationPermission}
            style={{
              background: "rgba(255,255,255,0.15)", backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#fff", padding: "12px 24px", borderRadius: 30,
              fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
            }}
          >
            🔭 Activer la détection de table
          </button>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, marginTop: 8 }}>
            Nécessaire pour l&apos;AR sur iPhone
          </p>
        </div>
      )}

      {/* ════ ÉTAT : mauvais angle → guidage ═════════════════════════ */}
      {hasGyro && !showDish && imgLoaded && (
        <div style={{
          position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          animation: "fadeIn 0.3s ease",
        }}>
          {/* Ring de scan au bas de l'écran */}
          <div style={{
            position: "absolute", bottom: "22%", left: "50%",
            transform: "translateX(-50%)",
            width: 200, height: 60,
            border: "2px solid rgba(193,154,86,0.5)",
            borderRadius: "50%",
            animation: "scanPulse 2s ease-in-out infinite",
          }} />
          {/* Message */}
          <div style={{
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(12px)",
            border: "1px solid rgba(255,255,255,0.15)",
            padding: "16px 24px", borderRadius: 20,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 32, marginBottom: 8, animation: "arrowBounce 1.2s ease infinite" }}>
              ↓
            </div>
            <p style={{ color: "#fff", fontWeight: 700, fontSize: 15, margin: 0 }}>
              Pointez vers la table
            </p>
            <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 4 }}>
              Inclinez votre téléphone vers le bas
            </p>
          </div>
        </div>
      )}

      {/* ════ PLAT SUR LA TABLE ══════════════════════════════════════ */}
      {showDish && (
        <div style={{
          position: "absolute",
          bottom: hasGyro ? "18%" : "50%",   // Sur table : en bas | Sans gyro : centré
          left: "50%",
          transform: hasGyro ? "translateX(-50%)" : "translate(-50%, 50%)",
          display: "flex", flexDirection: "column", alignItems: "center",
        }}>
          {/* Ombre portée sous le plat */}
          {hasGyro && (
            <div style={{
              position: "absolute",
              bottom: -20, left: "50%",
              width: 220, height: 44,
              background: "radial-gradient(ellipse, rgba(0,0,0,0.55) 0%, transparent 70%)",
              borderRadius: "50%",
              animation: "shadowPulse 3s ease-in-out infinite",
            }} />
          )}

          {/* Image du plat */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt={item.name}
            onLoad={() => setImgLoaded(true)}
            style={{
              width: hasGyro ? 280 : 260,
              height: hasGyro ? 280 : 260,
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid rgba(193,154,86,0.7)",
              opacity: imgLoaded ? 1 : 0,
              transition: "opacity 0.5s",
              // Sur table : perspective pour effet "posé"
              // Sans gyro : flottant (comme avant)
              animation: imgLoaded
                ? hasGyro
                  ? "popOnTable 0.7s cubic-bezier(.2,.8,.2,1.2) forwards, breathe 4s ease-in-out 0.7s infinite"
                  : "popFloat 0.6s cubic-bezier(.2,.8,.2,1.2) forwards, float 4s ease-in-out 0.6s infinite, glow 3s ease-in-out 0.6s infinite"
                : "none",
            }}
          />
        </div>
      )}

      {/* ════ UI FIXES ═══════════════════════════════════════════════ */}

      {/* Bouton fermer */}
      <button onClick={handleClose} style={{
        position: "absolute", top: 20, right: 20,
        width: 42, height: 42, borderRadius: "50%",
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "#fff", fontSize: 18, fontWeight: 700,
        display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
      }}>✕</button>

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
        {hasGyro && showDish ? "📍 Sur la table" : "✨ Visualisation IA"}
      </div>

      {/* Infos plat en bas */}
      <div style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.6) 50%, transparent 100%)",
        padding: "40px 24px 40px",
        textAlign: "center",
        animation: "fadeUp 0.5s ease 0.2s both",
      }}>
        {showDish && (
          <>
            <h2 style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: 26, fontWeight: 700, color: "#fff",
              lineHeight: 1.2, marginBottom: 6,
            }}>
              {item.name}
            </h2>
            {price && (
              <div style={{
                display: "inline-block",
                background: "rgba(193,154,86,0.2)",
                border: "1px solid rgba(193,154,86,0.5)",
                backdropFilter: "blur(10px)",
                padding: "6px 18px", borderRadius: 30,
                color: "#c19a56", fontWeight: 700, fontSize: 18,
                marginBottom: 14,
              }}>
                {price}
              </div>
            )}
          </>
        )}
        <button onClick={handleClose} style={{
          display: "block", margin: "0 auto",
          background: "rgba(255,255,255,0.1)", backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#fff", padding: "11px 28px", borderRadius: 30,
          fontWeight: 600, fontSize: 14, cursor: "pointer", fontFamily: "inherit",
        }}>
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
  item, index, photos, restaurantName, phone, onClose, onAR,
}: {
  item: MenuItem;
  index: number;
  photos: string[];
  restaurantName: string;
  phone?: string;
  onClose: () => void;
  onAR: () => void;
}) {
  const bg    = getDishBg(item, photos, index);
  const price = fmtPrice(item.price);
  const cfg   = getCat(item.category);

  /* WhatsApp — numéro nettoyé */
  const waPhone = phone ? phone.replace(/\D/g, "").replace(/^0/, "33") : "";
  const waMsg   = encodeURIComponent(
    `Bonjour, je voudrais commander : ${item.name}${price ? ` (${price})` : ""} 🍽`
  );
  const waUrl   = waPhone ? `https://wa.me/${waPhone}?text=${waMsg}` : "";

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
          {/* Badge catégorie ou Épuisé */}
          {item.sold_out ? (
            <div style={{
              position: "absolute", bottom: 16, left: 16,
              background: "rgba(220,38,38,0.85)", backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.2)",
              padding: "5px 12px", borderRadius: 20,
              color: "#fff", fontSize: 12, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.05em",
            }}>
              🚫 Épuisé
            </div>
          ) : (
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
          )}
        </div>

        {/* Contenu */}
        <div style={{ padding: "24px 24px 40px" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 28, fontWeight: 700, color: item.sold_out ? "#9CA3AF" : "#111827",
            lineHeight: 1.2, marginBottom: 12,
          }}>
            {item.name}
            {item.sold_out && <span style={{ fontSize: 16, color: "#EF4444", marginLeft: 10 }}>Épuisé</span>}
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

          {/* ✨ Bouton AR — désactivé si épuisé */}
          {!item.sold_out && (
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
              Voir en réalité augmentée (IA)
            </button>
          )}

          {/* 💬 Commander via WhatsApp */}
          {waUrl && !item.sold_out && (
            <a
              href={waUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                width: "100%",
                background: "#25D366", color: "#fff",
                padding: "15px 24px", borderRadius: 14,
                fontWeight: 700, fontSize: 15, textDecoration: "none",
                marginBottom: 12,
              }}
            >
              <span style={{ fontSize: 20 }}>💬</span>
              Commander via WhatsApp
            </a>
          )}

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
export default function MenuClient({ groups, photos, restaurantName, isDemo, phone, googlePlaceId }: MenuClientProps) {
  const [selectedItem, setSelectedItem] = useState<{ item: MenuItem; index: number } | null>(null);
  const [arItem, setArItem]             = useState<MenuItem | null>(null);
  const cats = Object.keys(groups);

  let globalIndex = 0;

  const close   = useCallback(() => setSelectedItem(null), []);
  const closeAR = useCallback(() => setArItem(null), []);

  function openAR() {
    if (!selectedItem) return;
    setSelectedItem(null);
    setArItem(selectedItem.item);
  }

  /* Lien Google Reviews */
  const googleReviewUrl = googlePlaceId
    ? `https://search.google.com/local/writereview?placeid=${googlePlaceId}`
    : null;

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
                        background: item.sold_out ? "#F9FAFB" : "#fff",
                        borderRadius: 14,
                        border: item.sold_out ? "1px solid #E5E7EB" : "1px solid #F0EDE8",
                        padding: "14px 16px",
                        display: "flex", gap: 12, alignItems: "flex-start",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                        cursor: "pointer", textAlign: "left",
                        width: "100%", fontFamily: "inherit",
                        transition: "transform 0.15s, box-shadow 0.15s",
                        opacity: item.sold_out ? 0.65 : 1,
                      }}
                      onMouseDown={(e) => { if (!item.sold_out) (e.currentTarget as HTMLButtonElement).style.transform = "scale(0.98)"; }}
                      onMouseUp={(e)   => { (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: "50%", marginTop: 5, flexShrink: 0,
                        background: item.sold_out ? "#D1D5DB" : `linear-gradient(135deg,${cfg.g1},${cfg.g2})`,
                      }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: 14.5, color: item.sold_out ? "#9CA3AF" : "#111827", lineHeight: 1.35 }}>
                          {item.name}
                          {item.sold_out && (
                            <span style={{
                              marginLeft: 8, fontSize: 10, fontWeight: 700,
                              background: "#FEE2E2", color: "#DC2626",
                              padding: "2px 7px", borderRadius: 10,
                              verticalAlign: "middle",
                            }}>
                              ÉPUISÉ
                            </span>
                          )}
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
                        {price && <div style={{ fontWeight: 700, fontSize: 15, color: item.sold_out ? "#9CA3AF" : "#111827" }}>{price}</div>}
                        <div style={{
                          width: 24, height: 24, borderRadius: 8,
                          background: item.sold_out ? "#F3F4F6" : `linear-gradient(135deg,${cfg.g1},${cfg.g2})`,
                          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                        }}>{item.sold_out ? "🚫" : "👁"}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── CTA Google Reviews (si is_live et place_id connu) ────────── */}
      {!isDemo && googleReviewUrl && (
        <div style={{ margin: "24px 16px 8px" }}>
          <a
            href={googleReviewUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              background: "#fff",
              border: "1.5px solid #FDE68A",
              borderRadius: 16, padding: "16px 20px",
              textDecoration: "none",
              boxShadow: "0 2px 12px rgba(245,158,11,0.1)",
            }}
          >
            <span style={{ fontSize: 24 }}>⭐</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
                Vous avez apprécié votre repas ?
              </div>
              <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>
                Laissez un avis Google — 30 secondes →
              </div>
            </div>
          </a>
        </div>
      )}

      {/* ── Modal plat ────────────────────────────────────────────────── */}
      {selectedItem && !arItem && (
        <DishModal
          item={selectedItem.item}
          index={selectedItem.index}
          photos={photos}
          restaurantName={restaurantName}
          phone={phone}
          onClose={close}
          onAR={openAR}
        />
      )}

      {/* ── Vue AR ────────────────────────────────────────────────────── */}
      {arItem && (
        <ARView item={arItem} onClose={closeAR} />
      )}
    </>
  );
}
