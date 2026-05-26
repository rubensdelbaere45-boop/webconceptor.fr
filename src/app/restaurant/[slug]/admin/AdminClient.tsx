"use client";

import { useState, useCallback, useEffect } from "react";

/* ══════════════════════════════════════════════════════════════════
   AdminClient — Interface restaurateur pour gérer la carte
   Auth: admin_token (UUID) transmis par le Server Component
   ══════════════════════════════════════════════════════════════════ */

export interface MenuItem {
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
  admin_token: string;
  scan_count?: number;
}

interface AdminClientProps {
  restaurant: Restaurant;
  initialItems: MenuItem[];
}

const CATEGORIES = [
  "Entrées", "Plats", "Desserts", "Boissons", "Vins",
  "Pizzas", "Burgers", "Formules", "Mezze", "Sushis",
  "Ramens", "Galettes salées", "Crêpes sucrées", "Salades",
  "Tapas", "Accompagnements", "Spécialités",
];

const CAT_EMOJI: Record<string, string> = {
  "Entrées": "🥗", "Plats": "🍽️", "Desserts": "🍮", "Boissons": "🥤",
  "Vins": "🍷", "Pizzas": "🍕", "Burgers": "🍔", "Formules": "🎁",
  "Mezze": "🫒", "Sushis": "🍣", "Ramens": "🍜", "Galettes salées": "🫓",
  "Crêpes sucrées": "🥞", "Salades": "🥙", "Tapas": "🫒",
  "Accompagnements": "🥔", "Spécialités": "⭐",
};

/* ─── Modal d'ajout / édition d'un plat ─────────────────────────────────── */
function DishModal({
  item, onSave, onClose,
}: {
  item: MenuItem | null;
  onSave: (dish: MenuItem) => void;
  onClose: () => void;
}) {
  const isNew = !item;
  const [name, setName]           = useState(item?.name || "");
  const [desc, setDesc]           = useState(item?.description || "");
  const [price, setPrice]         = useState(item?.price !== undefined ? String(item.price) : "");
  const [category, setCategory]   = useState(item?.category || "Plats");
  const [customCat, setCustomCat] = useState("");

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", h); document.body.style.overflow = ""; };
  }, [onClose]);

  function handleSave() {
    if (!name.trim()) return;
    const cat = category === "__custom__" ? customCat.trim() : category;
    const dish: MenuItem = {
      name: name.trim(),
      ...(desc.trim() ? { description: desc.trim() } : {}),
      ...(price.trim() ? { price: price.replace(",", ".") } : {}),
      ...(cat ? { category: cat } : {}),
    };
    onSave(dish);
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
        display: "flex", alignItems: "flex-end", justifyContent: "center",
        animation: "fadeIn 0.2s ease",
      }}
    >
      <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}} @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 520,
          background: "#fff", borderRadius: "24px 24px 0 0",
          padding: "28px 24px 40px",
          animation: "slideUp 0.3s cubic-bezier(.2,.7,.2,1)",
          maxHeight: "90vh", overflowY: "auto",
        }}
      >
        {/* Handle */}
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "#E5E7EB", margin: "0 auto 24px" }} />

        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", marginBottom: 24 }}>
          {isNew ? "Ajouter un plat" : "Modifier le plat"}
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Nom */}
          <label style={labelStyle}>
            <span style={labelText}>Nom du plat *</span>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex : Magret de canard"
              style={inputStyle}
            />
          </label>

          {/* Description */}
          <label style={labelStyle}>
            <span style={labelText}>Description <span style={{ color: "#9CA3AF" }}>(optionnel)</span></span>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Ex : Servi avec une sauce aux cerises et gratin dauphinois"
              rows={3}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </label>

          {/* Prix */}
          <label style={labelStyle}>
            <span style={labelText}>Prix <span style={{ color: "#9CA3AF" }}>(optionnel)</span></span>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ex : 18.50"
              type="text"
              inputMode="decimal"
              style={inputStyle}
            />
          </label>

          {/* Catégorie */}
          <label style={labelStyle}>
            <span style={labelText}>Catégorie</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ ...inputStyle, appearance: "auto" as React.CSSProperties["appearance"] }}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CAT_EMOJI[c] || "🍴"} {c}</option>
              ))}
              <option value="__custom__">✏️ Autre catégorie…</option>
            </select>
          </label>

          {category === "__custom__" && (
            <label style={labelStyle}>
              <span style={labelText}>Nom de la catégorie</span>
              <input
                value={customCat}
                onChange={(e) => setCustomCat(e.target.value)}
                placeholder="Ex : Spécialités du chef"
                style={inputStyle}
              />
            </label>
          )}
        </div>

        {/* Boutons */}
        <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
          <button onClick={onClose} style={cancelBtnStyle}>Annuler</button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            style={{
              ...saveBtnStyle,
              opacity: name.trim() ? 1 : 0.5,
              cursor: name.trim() ? "pointer" : "not-allowed",
            }}
          >
            {isNew ? "Ajouter →" : "Enregistrer →"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Styles partagés ────────────────────────────────────────────────────── */
const labelStyle: React.CSSProperties = { display: "flex", flexDirection: "column", gap: 6 };
const labelText: React.CSSProperties  = { fontSize: 13, fontWeight: 600, color: "#374151" };
const inputStyle: React.CSSProperties = {
  width: "100%", padding: "11px 14px", borderRadius: 10,
  border: "1.5px solid #E5E7EB", fontSize: 15, color: "#111827",
  fontFamily: "inherit", outline: "none",
  background: "#FAFAF8",
};
const cancelBtnStyle: React.CSSProperties = {
  flex: 1, padding: "14px 20px", borderRadius: 12,
  border: "1.5px solid #E5E7EB", background: "#fff",
  fontSize: 15, fontWeight: 600, color: "#6B7280",
  cursor: "pointer", fontFamily: "inherit",
};
const saveBtnStyle: React.CSSProperties = {
  flex: 2, padding: "14px 20px", borderRadius: 12,
  border: "none", background: "#1a1310",
  fontSize: 15, fontWeight: 700, color: "#fff",
  cursor: "pointer", fontFamily: "inherit",
};

/* ─── Toast ──────────────────────────────────────────────────────────────── */
function Toast({ msg, type }: { msg: string; type: "ok" | "err" }) {
  return (
    <div style={{
      position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
      background: type === "ok" ? "#059669" : "#DC2626",
      color: "#fff", padding: "12px 20px", borderRadius: 30,
      fontSize: 14, fontWeight: 600, zIndex: 999,
      boxShadow: "0 8px 24px rgba(0,0,0,0.2)",
      whiteSpace: "nowrap",
      animation: "fadeIn 0.2s ease",
    }}>
      {type === "ok" ? "✓" : "✗"} {msg}
    </div>
  );
}

/* ─── Composant principal ────────────────────────────────────────────────── */
export default function AdminClient({ restaurant, initialItems }: AdminClientProps) {
  const [items, setItems]         = useState<MenuItem[]>(initialItems);
  const [editItem, setEditItem]   = useState<{ item: MenuItem | null; index: number } | null>(null);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState<{ msg: string; type: "ok" | "err" } | null>(null);
  const [activeTab, setActiveTab] = useState<"menu" | "qrcode">("menu");

  const showToast = useCallback((msg: string, type: "ok" | "err") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  /* ── Sauvegarder via API ─────────────────────────────────────────────── */
  async function save(newItems: MenuItem[]) {
    setSaving(true);
    try {
      const res = await fetch("/api/tableflow/admin", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug:       restaurant.slug,
          token:      restaurant.admin_token,
          menu_items: newItems,
        }),
      });
      if (!res.ok) throw new Error("Erreur serveur");
      showToast("Carte enregistrée !", "ok");
    } catch {
      showToast("Erreur lors de la sauvegarde", "err");
    } finally {
      setSaving(false);
    }
  }

  /* ── CRUD ────────────────────────────────────────────────────────────── */
  function handleSaveItem(dish: MenuItem) {
    let newItems: MenuItem[];
    if (editItem!.index === -1) {
      newItems = [...items, dish];
    } else {
      newItems = items.map((it, i) => i === editItem!.index ? dish : it);
    }
    setItems(newItems);
    setEditItem(null);
    save(newItems);
  }

  function handleDelete(index: number) {
    if (!confirm("Supprimer ce plat ?")) return;
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    save(newItems);
  }

  function handleMoveUp(index: number) {
    if (index === 0) return;
    const newItems = [...items];
    [newItems[index - 1], newItems[index]] = [newItems[index], newItems[index - 1]];
    setItems(newItems);
    save(newItems);
  }

  function handleMoveDown(index: number) {
    if (index === items.length - 1) return;
    const newItems = [...items];
    [newItems[index], newItems[index + 1]] = [newItems[index + 1], newItems[index]];
    setItems(newItems);
    save(newItems);
  }

  /* ── Grouper par catégorie ───────────────────────────────────────────── */
  const groups: Record<string, { item: MenuItem; index: number }[]> = {};
  items.forEach((item, index) => {
    const cat = item.category || "Carte";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push({ item, index });
  });

  const qrUrl  = `/api/tableflow/qrcode?slug=${restaurant.slug}&size=500x500`;
  const menuUrl = `/restaurant/${restaurant.slug}`;

  return (
    <>
      <style>{`
        @keyframes fadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes pulse  { 0%,100%{opacity:1} 50%{opacity:.5} }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', -apple-system, sans-serif; background: #F9FAFB; }
        input:focus, textarea:focus, select:focus {
          border-color: #c19a56 !important; outline: none;
          box-shadow: 0 0 0 3px rgba(193,154,86,0.15);
        }
        button:active { transform: scale(0.97); }
      `}</style>

      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div style={{
        background: "linear-gradient(135deg, #1a1310 0%, #2d1f0e 100%)",
        padding: "20px 20px 0",
        maxWidth: 680, margin: "0 auto",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
              Tableau de bord
            </p>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: "#fff", margin: 0 }}>
              {restaurant.name}
            </h1>
            {restaurant.city && (
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>
                📍 {restaurant.city}
              </p>
            )}
          </div>
          <a
            href={menuUrl}
            target="_blank"
            rel="noreferrer"
            style={{
              background: "#c19a56", color: "#1a1310",
              padding: "9px 16px", borderRadius: 30,
              fontWeight: 700, fontSize: 12, textDecoration: "none",
              display: "flex", alignItems: "center", gap: 5,
              flexShrink: 0,
            }}
          >
            👁 Voir la carte
          </a>
        </div>

        {/* Stats bar */}
        <div style={{ display: "flex", gap: 8, marginBottom: 0 }}>
          {[
            { label: "Plats", value: items.length },
            { label: "Scans QR", value: restaurant.scan_count ?? 0 },
            { label: "Statut", value: restaurant.is_live ? "🟢 Live" : "🟡 Démo" },
          ].map(({ label, value }) => (
            <div key={label} style={{
              flex: 1, background: "rgba(255,255,255,0.08)", borderRadius: "12px 12px 0 0",
              padding: "10px 12px",
            }}>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── TABS ────────────────────────────────────────────────────────── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #F0EDE8", maxWidth: 680, margin: "0 auto" }}>
        <div style={{ display: "flex" }}>
          {(["menu", "qrcode"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: "14px 20px",
                border: "none", background: "transparent",
                fontSize: 14, fontWeight: 600, cursor: "pointer",
                color: activeTab === tab ? "#1a1310" : "#9CA3AF",
                borderBottom: activeTab === tab ? "2px solid #c19a56" : "2px solid transparent",
                fontFamily: "inherit",
                transition: "color 0.2s",
              }}
            >
              {tab === "menu" ? "🍽 Gérer la carte" : "📱 QR Code"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 0 120px" }}>

        {/* ════ TAB MENU ════ */}
        {activeTab === "menu" && (
          <>
            {/* Bouton ajouter */}
            <div style={{ padding: "20px 16px 8px" }}>
              <button
                onClick={() => setEditItem({ item: null, index: -1 })}
                style={{
                  width: "100%", padding: "14px 20px", borderRadius: 14,
                  background: "#1a1310", color: "#fff",
                  border: "none", fontSize: 15, fontWeight: 700,
                  cursor: "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                }}
              >
                <span style={{ fontSize: 18 }}>+</span> Ajouter un plat
              </button>
            </div>

            {/* Liste par catégorie */}
            {Object.keys(groups).length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 20px", color: "#9CA3AF" }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🍴</div>
                <p style={{ fontSize: 15 }}>Votre carte est vide.</p>
                <p style={{ fontSize: 13, marginTop: 6 }}>Ajoutez votre premier plat !</p>
              </div>
            ) : (
              Object.entries(groups).map(([cat, catItems]) => (
                <div key={cat} style={{ marginBottom: 8 }}>
                  {/* Category header */}
                  <div style={{
                    padding: "20px 20px 8px",
                    display: "flex", alignItems: "center", gap: 10,
                  }}>
                    <span style={{ fontSize: 20 }}>{CAT_EMOJI[cat] || "🍴"}</span>
                    <span style={{ fontWeight: 700, fontSize: 16, color: "#111827", flex: 1 }}>{cat}</span>
                    <span style={{ fontSize: 12, color: "#9CA3AF" }}>{catItems.length} plat{catItems.length > 1 ? "s" : ""}</span>
                  </div>

                  {/* Items */}
                  <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                    {catItems.map(({ item, index }) => (
                      <div key={index} style={{
                        background: "#fff", borderRadius: 12,
                        border: "1px solid #F0EDE8", padding: "12px 14px",
                        display: "flex", gap: 10, alignItems: "flex-start",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                      }}>
                        {/* Move up/down */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 3, paddingTop: 2 }}>
                          <button
                            onClick={() => handleMoveUp(index)}
                            title="Monter"
                            style={arrowBtnStyle}
                          >▲</button>
                          <button
                            onClick={() => handleMoveDown(index)}
                            title="Descendre"
                            style={arrowBtnStyle}
                          >▼</button>
                        </div>

                        {/* Content */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: 14, color: item.sold_out ? "#9CA3AF" : "#111827", display: "flex", alignItems: "center", gap: 6 }}>
                            {item.name}
                            {item.sold_out && (
                              <span style={{ fontSize: 10, fontWeight: 700, background: "#FEE2E2", color: "#DC2626", padding: "2px 6px", borderRadius: 8 }}>
                                ÉPUISÉ
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <div style={{
                              fontSize: 12, color: "#9CA3AF", marginTop: 2,
                              overflow: "hidden", textOverflow: "ellipsis",
                              display: "-webkit-box", WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            } as React.CSSProperties}>{item.description}</div>
                          )}
                        </div>

                        {/* Price */}
                        {item.price && (
                          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", flexShrink: 0 }}>
                            {String(item.price).replace(".", ",")} €
                          </div>
                        )}

                        {/* Épuisé toggle + Edit + Delete */}
                        <div style={{ display: "flex", gap: 6, flexShrink: 0, alignItems: "center" }}>
                          {/* Toggle épuisé */}
                          <button
                            onClick={() => {
                              const newItems = items.map((it, i) =>
                                i === index ? { ...it, sold_out: !it.sold_out } : it
                              );
                              setItems(newItems);
                              save(newItems);
                            }}
                            title={item.sold_out ? "Remettre en vente" : "Marquer épuisé"}
                            style={{
                              width: 32, height: 32, borderRadius: 8,
                              border: item.sold_out ? "1px solid #FCA5A5" : "1px solid #E5E7EB",
                              background: item.sold_out ? "#FEF2F2" : "#F9FAFB",
                              cursor: "pointer", fontSize: 14,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}
                          >{item.sold_out ? "✅" : "🚫"}</button>
                          <button
                            onClick={() => setEditItem({ item, index })}
                            style={editBtnStyle}
                            title="Modifier"
                          >✏️</button>
                          <button
                            onClick={() => handleDelete(index)}
                            style={deleteBtnStyle}
                            title="Supprimer"
                          >🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}

            {/* Save indicator */}
            {saving && (
              <div style={{
                position: "fixed", bottom: 24, right: 24,
                background: "#1a1310", color: "#c19a56",
                padding: "10px 18px", borderRadius: 30,
                fontSize: 13, fontWeight: 600,
                animation: "pulse 1s ease infinite",
                zIndex: 200,
              }}>
                ⟳ Enregistrement…
              </div>
            )}
          </>
        )}

        {/* ════ TAB QR CODE ════ */}
        {activeTab === "qrcode" && (
          <div style={{ padding: "32px 20px" }}>
            {/* QR Preview */}
            <div style={{
              background: "#fff", borderRadius: 20,
              border: "1px solid #F0EDE8",
              padding: 32, textAlign: "center",
              boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
              marginBottom: 20,
            }}>
              <p style={{ fontSize: 13, color: "#9CA3AF", marginBottom: 20, fontWeight: 500 }}>
                Imprimez ce QR code et placez-le sur vos tables
              </p>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrUrl}
                alt="QR Code TableFlow"
                style={{ width: 220, height: 220, borderRadius: 12 }}
              />
              <p style={{ fontSize: 12, color: "#9CA3AF", marginTop: 16 }}>
                Pointe vers :<br />
                <a href={menuUrl} target="_blank" rel="noreferrer" style={{ color: "#c19a56", fontWeight: 600, wordBreak: "break-all" }}>
                  webconceptor.fr{menuUrl}
                </a>
              </p>
            </div>

            {/* Download button */}
            <a
              href={qrUrl}
              download={`qrcode-${restaurant.slug}.png`}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: "#1a1310", color: "#fff",
                padding: "16px 24px", borderRadius: 14,
                fontWeight: 700, fontSize: 15, textDecoration: "none",
                marginBottom: 12,
              }}
            >
              ⬇ Télécharger le QR code (PNG)
            </a>

            {/* Instructions */}
            <div style={{
              background: "#fff", borderRadius: 16, border: "1px solid #F0EDE8",
              padding: "20px 20px",
            }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 12 }}>
                Comment l&apos;utiliser ?
              </p>
              {[
                "Téléchargez le QR code en PNG haute résolution",
                "Imprimez-le et plastifiez-le pour durabilité",
                "Posez-le sur chaque table avec un petit chevalet",
                "Vos clients scannent et voient votre carte instantanément !",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 10, alignItems: "flex-start" }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%",
                    background: "#1a1310", color: "#c19a56",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, fontWeight: 700, flexShrink: 0,
                  }}>{i + 1}</div>
                  <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.5, margin: 0 }}>{step}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Modal édition ───────────────────────────────────────────────── */}
      {editItem !== null && (
        <DishModal
          item={editItem.item}
          onSave={handleSaveItem}
          onClose={() => setEditItem(null)}
        />
      )}

      {/* ── Toast ───────────────────────────────────────────────────────── */}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </>
  );
}

/* ─── Boutons icône ──────────────────────────────────────────────────────── */
const arrowBtnStyle: React.CSSProperties = {
  width: 20, height: 16, border: "1px solid #E5E7EB", background: "#F9FAFB",
  borderRadius: 5, cursor: "pointer", fontSize: 8, color: "#6B7280",
  display: "flex", alignItems: "center", justifyContent: "center",
  lineHeight: 1, padding: 0, fontFamily: "inherit",
};
const editBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: "1px solid #E5E7EB",
  background: "#F9FAFB", cursor: "pointer", fontSize: 14,
  display: "flex", alignItems: "center", justifyContent: "center",
};
const deleteBtnStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8, border: "1px solid #FEE2E2",
  background: "#FFF5F5", cursor: "pointer", fontSize: 14,
  display: "flex", alignItems: "center", justifyContent: "center",
};
