"use client";

import { useMemo, useState } from "react";

type Vehicle = {
  title: string;
  price?: string;
  year?: string;
  km?: string;
  fuel?: string;
  image?: string;
  url?: string;
};

type EnrichedVehicle = Vehicle & {
  brand?: string;
  fuelKind: string;
  description: string;
  highlights: string[];
  consumption: { value: number; unit: string };
  tankCapacity: { value: number; unit: string };
  fullPrice: { value: number; unit: string };
  rangeKm: number;
  costPer100km: number;
  cleanedTitle: string;
};

type Prospect = {
  slug: string;
  name: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  isGarage: boolean;
};

type Props = {
  prospect: Prospect;
  vehicles: EnrichedVehicle[];
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  stockPhotos: string[];
};

const CAR_BRANDS_DETECT = ["Mercedes", "BMW", "Audi", "Volkswagen", "Peugeot", "Renault", "Citroën", "DS", "Ford", "Opel", "Fiat", "Toyota", "Honda", "Nissan", "Hyundai", "Kia", "Mazda", "Mitsubishi", "Suzuki", "Skoda", "Seat", "Volvo", "Mini", "Smart", "Tesla", "Porsche", "Jeep", "Alfa Romeo", "Dacia", "Lexus", "Cupra", "Polestar", "MG"];

function detectBrand(title: string): string | null {
  for (const b of CAR_BRANDS_DETECT) {
    if (new RegExp(`\\b${b}\\b`, "i").test(title)) return b;
  }
  return null;
}

function parsePrice(s?: string): number {
  if (!s) return 0;
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

function parseKm(s?: string): number {
  if (!s) return 0;
  const n = parseInt(s.replace(/[^\d]/g, ""), 10);
  return isNaN(n) ? 0 : n;
}

export default function VoituresCatalog({ prospect, vehicles, primaryColor, accentColor, logoUrl }: Props) {
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState<string | null>(null);
  const [filterFuel, setFilterFuel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "km-asc" | "year-desc">("price-asc");
  const [selectedVehicle, setSelectedVehicle] = useState<EnrichedVehicle | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [modalType, setModalType] = useState<"essai" | "info">("essai");

  const phoneDigits = (prospect.phone || "").replace(/[^\d+]/g, "");

  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    for (const v of vehicles) { const b = v.brand || detectBrand(v.title); if (b) set.add(b); }
    return Array.from(set).sort();
  }, [vehicles]);

  const availableFuels = useMemo(() => {
    const set = new Set<string>();
    for (const v of vehicles) { if (v.fuel) set.add(v.fuel); }
    return Array.from(set).sort();
  }, [vehicles]);

  const filtered = useMemo(() => {
    let list = vehicles.filter(v => {
      if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterBrand) {
        const b = v.brand || detectBrand(v.title);
        if (b !== filterBrand) return false;
      }
      if (filterFuel && v.fuel !== filterFuel) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case "price-asc": return parsePrice(a.price) - parsePrice(b.price);
        case "price-desc": return parsePrice(b.price) - parsePrice(a.price);
        case "km-asc": return parseKm(a.km) - parseKm(b.km);
        case "year-desc": return (parseInt(b.year || "0", 10)) - (parseInt(a.year || "0", 10));
      }
    });
    return list;
  }, [vehicles, search, filterBrand, filterFuel, sortBy]);

  function openEssaiModal(v: EnrichedVehicle) { setSelectedVehicle(v); setModalType("essai"); setModalOpen(true); }
  function openDetailDrawer(v: EnrichedVehicle) { setSelectedVehicle(v); setDetailOpen(true); }
  function openInfoModal(v: EnrichedVehicle) { setSelectedVehicle(v); setModalType("info"); setModalOpen(true); }

  async function submitEssai(formData: FormData) {
    const data: Record<string, string> = {};
    formData.forEach((v, k) => { if (typeof v === "string") data[k] = v; });
    if (selectedVehicle) data.vehicule = selectedVehicle.title;
    const res = await fetch(`/api/prospect/${prospect.slug}/lead`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: modalType === "essai" ? "essai" : "contact", form: data }),
    });
    const j = await res.json();
    if (j.success) { alert("Demande envoyée — nous vous recontactons sous 24h !"); setModalOpen(false); }
    else { alert("Erreur. Réessayez ou appelez " + (prospect.phone || "directement")); }
  }

  if (!prospect.isGarage) {
    return (
      <main style={{ padding: 40, textAlign: "center", background: "#0a0a0a", color: "#fff", minHeight: "100vh" }}>
        <h1>Page non disponible</h1>
        <a href={`/prospects/${prospect.slug}`} style={{ color: primaryColor }}>← Retour au site</a>
      </main>
    );
  }

  return (
    <>
      <style>{`
        :root { --primary: ${primaryColor}; --accent: ${accentColor}; --dark: #0a0a0a; --dark-card: #171717; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Barlow', -apple-system, sans-serif; background: var(--dark); color: #fafafa; }
        .font-display { font-family: 'Barlow Condensed', sans-serif; font-weight: 800; letter-spacing: -0.02em; line-height: 1; text-transform: uppercase; }
        .gradient-text { background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; }

        .v-card { background: var(--dark-card); border-radius: 1rem; border: 1px solid rgba(255,255,255,0.08); overflow: hidden; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); display: flex; flex-direction: column; }
        .v-card:hover { border-color: var(--primary); transform: translateY(-4px); box-shadow: 0 24px 48px -12px ${primaryColor}66; }
        .v-card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; transition: transform 0.5s; }
        .v-card:hover img { transform: scale(1.08); }

        @keyframes border-beam-anim { 0% { background-position: 0% 0%; } 100% { background-position: 200% 0%; } }
        .border-beam-top { position: absolute; top: 0; left: 0; right: 0; height: 2px; background: linear-gradient(90deg, transparent, var(--primary), var(--accent), transparent); background-size: 200% 100%; animation: border-beam-anim 3s linear infinite; }

        .pill { display: inline-flex; align-items: center; gap: 4px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; color: #d4d4d4; }
        .pill-glow { background: ${primaryColor}22; border-color: ${primaryColor}88; color: #fff; }

        .btn-glow { background: var(--primary); color: #fff; box-shadow: 0 0 0 0 ${primaryColor}88, 0 10px 30px ${primaryColor}55; transition: all 0.3s; }
        .btn-glow:hover { transform: translateY(-2px); box-shadow: 0 0 30px ${primaryColor}aa, 0 18px 40px ${primaryColor}88; }
        .btn-ghost-dark { background: rgba(255,255,255,0.06); color: #fff; border: 1px solid rgba(255,255,255,0.15); backdrop-filter: blur(20px); transition: all 0.3s; }
        .btn-ghost-dark:hover { background: rgba(255,255,255,0.12); border-color: var(--primary); }

        .glass-dark { background: rgba(23, 23, 23, 0.8); backdrop-filter: blur(20px) saturate(180%); border: 1px solid rgba(255,255,255,0.08); }

        .chip { padding: 8px 16px; border-radius: 99px; border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.04); cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; color: #d4d4d4; }
        .chip.active { background: var(--primary); color: #fff; border-color: var(--primary); }
        .chip:hover:not(.active) { border-color: var(--primary); color: #fff; background: ${primaryColor}22; }

        .input-dark { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 12px 20px; border-radius: 12px; font-size: 14px; outline: none; transition: all 0.2s; }
        .input-dark::placeholder { color: rgba(255,255,255,0.4); }
        .input-dark:focus { border-color: var(--primary); background: rgba(255,255,255,0.08); }

        .hero-mesh-page { position: relative; background: radial-gradient(ellipse 80% 60% at top, ${primaryColor}33 0%, transparent 50%), radial-gradient(ellipse 70% 50% at bottom right, ${accentColor}26 0%, transparent 60%), linear-gradient(180deg, #0a0a0a 0%, #050505 100%); overflow: hidden; }
        .hero-mesh-page::before { content: ''; position: absolute; inset: 0; pointer-events: none; background-image: radial-gradient(circle at 1px 1px, ${primaryColor}20 1px, transparent 0); background-size: 40px 40px; opacity: 0.3; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn 0.5s ease both; }

        /* Drawer detail vehicle */
        .drawer-backdrop { position: fixed; inset: 0; z-index: 90; background: rgba(0,0,0,0.85); backdrop-filter: blur(12px); }
        .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 100%; max-width: 580px; background: var(--dark-card); z-index: 100; overflow-y: auto; transform: translateX(100%); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-left: 1px solid rgba(255,255,255,0.1); }
        .drawer.open { transform: translateX(0); }

        /* Stat tile in detail */
        .stat-tile { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); padding: 1rem; border-radius: 0.75rem; }
        .stat-tile-value { font-family: 'Barlow Condensed', sans-serif; font-size: 1.75rem; font-weight: 800; line-height: 1; }
        .stat-tile-label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.6); margin-top: 4px; }
      `}</style>

      {/* HEADER DARK */}
      <header style={{ position: "sticky", top: 54, zIndex: 40, background: "rgba(10,10,10,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a href={`/prospects/${prospect.slug}`} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "#fafafa" }}>
            <span style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18 }}>←</span>
            <div>
              {logoUrl ? <img src={logoUrl} alt={prospect.name} style={{ height: 28, verticalAlign: "middle", marginRight: 8 }} /> : null}
              <span className="font-display" style={{ fontSize: 20 }}>{prospect.name}</span>
            </div>
          </a>
          {phoneDigits ? <a href={`tel:${phoneDigits}`} className="btn-glow" style={{ textDecoration: "none", whiteSpace: "nowrap", padding: "10px 20px", borderRadius: 99, fontWeight: 700, fontSize: 13, textTransform: "uppercase", letterSpacing: "0.05em" }}>📞 {prospect.phone}</a> : null}
        </div>
      </header>

      {/* HERO catalogue DARK */}
      <section className="hero-mesh-page" style={{ padding: "60px 24px 40px", textAlign: "center", position: "relative" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", position: "relative", zIndex: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: primaryColor, letterSpacing: "0.2em", textTransform: "uppercase" }}>Nos véhicules</span>
          <h1 className="font-display" style={{ fontSize: 64, lineHeight: 1, margin: "16px 0 12px" }}>
            <span className="gradient-text">{vehicles.length}</span> voiture{vehicles.length > 1 ? "s" : ""} <span style={{ color: "#fff" }}>en stock</span>
          </h1>
          <p style={{ fontSize: 18, color: "rgba(255,255,255,0.7)", maxWidth: 600, margin: "0 auto" }}>
            Tous nos véhicules{prospect.city ? ` à ${prospect.city}` : ""}. Description complète, consommation, coût plein, autonomie. Réservez votre essai en 1 clic.
          </p>
        </div>
      </section>

      {vehicles.length === 0 ? (
        <section style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>🚗</div>
          <h2 className="font-display" style={{ fontSize: 40, marginBottom: 16 }}>Catalogue en cours de mise en ligne</h2>
          <p style={{ fontSize: 17, color: "rgba(255,255,255,0.7)", marginBottom: 32 }}>
            Ce catalogue est prêt à recevoir <strong>tout votre stock</strong> : photos, prix, kilométrage, consommation, coût plein, fiches détaillées. Vos clients réservent un essai en 1 clic.
          </p>
          <button className="btn-glow" style={{ padding: "16px 32px", fontSize: 15, fontWeight: 700, borderRadius: 99, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }} onClick={() => openInfoModal({ title: "Mise en ligne du catalogue" } as EnrichedVehicle)}>
            📥 Programmer la mise en ligne
          </button>
        </section>
      ) : (
        <>
          {/* BAR FILTRES DARK */}
          <section style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 16px" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <input
                type="text"
                placeholder="🔍 Rechercher un modèle..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="input-dark"
                style={{ flex: 1, minWidth: 240 }}
              />
              <select value={sortBy} onChange={e => setSortBy(e.target.value as never)} className="input-dark" style={{ cursor: "pointer" }}>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="km-asc">Km croissant</option>
                <option value="year-desc">Année récente</option>
              </select>
            </div>
            {availableBrands.length > 0 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <button className={`chip ${filterBrand === null ? "active" : ""}`} onClick={() => setFilterBrand(null)}>Toutes marques</button>
                {availableBrands.map(b => (
                  <button key={b} className={`chip ${filterBrand === b ? "active" : ""}`} onClick={() => setFilterBrand(filterBrand === b ? null : b)}>{b}</button>
                ))}
              </div>
            ) : null}
            {availableFuels.length > 0 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className={`chip ${filterFuel === null ? "active" : ""}`} onClick={() => setFilterFuel(null)}>Tous carburants</button>
                {availableFuels.map(f => (
                  <button key={f} className={`chip ${filterFuel === f ? "active" : ""}`} onClick={() => setFilterFuel(filterFuel === f ? null : f)}>{f}</button>
                ))}
              </div>
            ) : null}
            <div style={{ marginTop: 16, color: "rgba(255,255,255,0.6)", fontSize: 14 }}>
              <strong style={{ color: "#fff" }}>{filtered.length}</strong> résultat{filtered.length > 1 ? "s" : ""}
            </div>
          </section>

          {/* GRILLE VÉHICULES enrichis */}
          <section style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 24px 80px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
              {filtered.map((v, i) => (
                <article key={i} className="v-card fade-in" style={{ position: "relative" }}>
                  <div style={{ position: "relative", overflow: "hidden" }}>
                    {v.image ? <img src={v.image} alt={v.title} loading="lazy" /> : <div style={{ aspectRatio: "4/3", background: `linear-gradient(135deg, ${primaryColor}22, ${accentColor}22)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50 }}>🚗</div>}
                    {v.price ? <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(8px)", padding: "6px 14px", borderRadius: 99, fontWeight: 800, fontSize: 14, color: accentColor, fontFamily: "Barlow Condensed" }}>{v.price}</div> : null}
                  </div>
                  <div style={{ padding: 18, display: "flex", flexDirection: "column", flex: 1 }}>
                    <h3 className="font-display" style={{ fontSize: 18, margin: "0 0 8px", lineHeight: 1.2, minHeight: 44 }}>{v.title}</h3>
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, marginBottom: 14, minHeight: 60 }}>{v.description}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                      {v.year ? <span className="pill">📅 {v.year}</span> : null}
                      {v.km ? <span className="pill">🛣 {v.km}</span> : null}
                      {v.fuel ? <span className="pill pill-glow">⛽ {v.fuel}</span> : null}
                    </div>
                    {/* Stats enrichies coût */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14, padding: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Conso</div>
                        <div className="font-display" style={{ fontSize: 16, color: primaryColor }}>{v.consumption.value} <span style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>{v.consumption.unit}</span></div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Plein</div>
                        <div className="font-display" style={{ fontSize: 16, color: accentColor }}>~{v.fullPrice.value} €</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                      <button onClick={() => openEssaiModal(v)} className="btn-glow" style={{ flex: 1, padding: "10px 20px", borderRadius: 99, fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>🚗 Essai</button>
                      <button onClick={() => openDetailDrawer(v)} className="btn-ghost-dark" style={{ padding: "10px 16px", borderRadius: 99, fontWeight: 600, fontSize: 13, border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer" }}>Détails →</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {/* DRAWER détail véhicule (slide right) */}
      {detailOpen && selectedVehicle ? (
        <>
          <div className="drawer-backdrop fade-in" onClick={() => setDetailOpen(false)} />
          <aside className={`drawer ${detailOpen ? "open" : ""}`}>
            <button onClick={() => setDetailOpen(false)} style={{ position: "sticky", top: 0, marginLeft: "auto", display: "block", marginTop: 16, marginRight: 16, width: 40, height: 40, borderRadius: 99, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", fontSize: 20, zIndex: 5 }}>×</button>
            {selectedVehicle.image ? <img src={selectedVehicle.image} alt={selectedVehicle.title} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} /> : null}
            <div style={{ padding: "24px 28px 40px" }}>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 11, color: primaryColor, textTransform: "uppercase", letterSpacing: "0.15em", fontWeight: 700 }}>{selectedVehicle.brand || "Véhicule disponible"}</span>
                <h2 className="font-display" style={{ fontSize: 32, lineHeight: 1.1, margin: "8px 0 16px" }}>{selectedVehicle.cleanedTitle || selectedVehicle.title}</h2>
                {selectedVehicle.price ? <div className="font-display" style={{ fontSize: 36, color: accentColor }}>{selectedVehicle.price}</div> : null}
              </div>

              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.8)", lineHeight: 1.7, marginBottom: 24 }}>{selectedVehicle.description}</p>

              {selectedVehicle.highlights && selectedVehicle.highlights.length > 0 ? (
                <div style={{ marginBottom: 24 }}>
                  {selectedVehicle.highlights.map((h, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "start", gap: 10, padding: "8px 0", color: "rgba(255,255,255,0.9)", fontSize: 14 }}>{h}</div>
                  ))}
                </div>
              ) : null}

              {/* Stats grid */}
              <h3 className="font-display" style={{ fontSize: 18, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, marginTop: 8 }}>Fiche technique</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                {selectedVehicle.year ? <div className="stat-tile"><div className="stat-tile-value">{selectedVehicle.year}</div><div className="stat-tile-label">Année</div></div> : null}
                {selectedVehicle.km ? <div className="stat-tile"><div className="stat-tile-value">{selectedVehicle.km}</div><div className="stat-tile-label">Kilométrage</div></div> : null}
                {selectedVehicle.fuel ? <div className="stat-tile"><div className="stat-tile-value" style={{ fontSize: 16 }}>{selectedVehicle.fuel}</div><div className="stat-tile-label">Carburant</div></div> : null}
              </div>

              {/* Coûts */}
              <h3 className="font-display" style={{ fontSize: 18, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>Combien ça coûte ?</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 24 }}>
                <div className="stat-tile">
                  <div className="stat-tile-value" style={{ color: primaryColor }}>{selectedVehicle.consumption.value}</div>
                  <div className="stat-tile-label">Conso ({selectedVehicle.consumption.unit})</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile-value" style={{ color: accentColor }}>~{selectedVehicle.fullPrice.value} €</div>
                  <div className="stat-tile-label">Plein {selectedVehicle.tankCapacity.value}{selectedVehicle.tankCapacity.unit}</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile-value">{selectedVehicle.rangeKm}</div>
                  <div className="stat-tile-label">Km autonomie</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile-value">{selectedVehicle.costPer100km.toFixed(2)} €</div>
                  <div className="stat-tile-label">Coût / 100 km</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 24 }}>
                <button onClick={() => { setDetailOpen(false); openEssaiModal(selectedVehicle); }} className="btn-glow" style={{ padding: "16px 24px", borderRadius: 99, fontWeight: 700, fontSize: 15, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>🚗 Réserver un essai</button>
                {phoneDigits ? <a href={`tel:${phoneDigits}`} className="btn-ghost-dark" style={{ padding: "14px 24px", borderRadius: 99, fontWeight: 600, fontSize: 14, textDecoration: "none", textAlign: "center", color: "#fff" }}>📞 Appeler directement</a> : null}
                {selectedVehicle.url ? <a href={selectedVehicle.url} target="_blank" rel="noopener" className="btn-ghost-dark" style={{ padding: "14px 24px", borderRadius: 99, fontWeight: 600, fontSize: 14, textDecoration: "none", textAlign: "center", color: "#fff" }}>↗ Voir la fiche complète</a> : null}
              </div>
            </div>
          </aside>
        </>
      ) : null}

      {/* MODAL ESSAI / INFO */}
      {modalOpen ? (
        <div onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="fade-in" style={{ background: "#171717", borderRadius: 24, padding: 32, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto", border: "1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={() => setModalOpen(false)} style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: 99, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "#fff", cursor: "pointer", fontSize: 20 }}>×</button>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 24 }}>{modalType === "essai" ? "🚗" : "📥"}</div>
            <h3 className="font-display" style={{ fontSize: 26, margin: "0 0 8px" }}>{modalType === "essai" ? "Réserver un essai" : "Programmer la mise en ligne"}</h3>
            <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 24 }}>{selectedVehicle?.title}</p>
            <form onSubmit={e => { e.preventDefault(); submitEssai(new FormData(e.currentTarget)); }}>
              <input type="text" name="nom" required placeholder="Votre nom *" className="input-dark" style={{ width: "100%", marginBottom: 12 }} />
              <input type="tel" name="telephone" required placeholder="Téléphone *" className="input-dark" style={{ width: "100%", marginBottom: 12 }} />
              <input type="email" name="email" placeholder="Email" className="input-dark" style={{ width: "100%", marginBottom: 12 }} />
              {modalType === "essai" ? <input type="date" name="date_souhaitee" className="input-dark" style={{ width: "100%", marginBottom: 12 }} /> : null}
              <textarea name="message" rows={3} placeholder="Précisez vos préférences..." className="input-dark" style={{ width: "100%", marginBottom: 16 }} />
              <button type="submit" className="btn-glow" style={{ width: "100%", padding: "16px 24px", borderRadius: 99, fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em" }}>{modalType === "essai" ? "Réserver cet essai" : "Envoyer ma demande"}</button>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 10 }}>🔒 Confidentiel. Réponse sous 24h.</p>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
