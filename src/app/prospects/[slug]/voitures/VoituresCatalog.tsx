"use client";

import { useMemo, useState } from "react";

type Vehicle = { title: string; price?: string; year?: string; km?: string; fuel?: string; image?: string; url?: string };

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

type Prospect = { slug: string; name: string; city: string | null; phone: string | null; email: string | null; isGarage: boolean };
type Props = { prospect: Prospect; vehicles: EnrichedVehicle[]; primaryColor: string; accentColor: string; logoUrl: string | null; stockPhotos: string[] };

const CAR_BRANDS_DETECT = ["Mercedes", "BMW", "Audi", "Volkswagen", "Peugeot", "Renault", "Citroën", "DS", "Ford", "Opel", "Fiat", "Toyota", "Honda", "Nissan", "Hyundai", "Kia", "Mazda", "Mitsubishi", "Suzuki", "Skoda", "Seat", "Volvo", "Mini", "Smart", "Tesla", "Porsche", "Jeep", "Alfa Romeo", "Dacia", "Lexus", "Cupra", "Polestar", "MG"];

function detectBrand(title: string): string | null {
  for (const b of CAR_BRANDS_DETECT) if (new RegExp(`\\b${b}\\b`, "i").test(title)) return b;
  return null;
}
const parsePrice = (s?: string): number => { if (!s) return 0; const n = parseInt(s.replace(/[^\d]/g, ""), 10); return isNaN(n) ? 0 : n; };
const parseKm = (s?: string): number => { if (!s) return 0; const n = parseInt(s.replace(/[^\d]/g, ""), 10); return isNaN(n) ? 0 : n; };

export default function VoituresCatalog({ prospect, vehicles, primaryColor, logoUrl }: Props) {
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState<string | null>(null);
  const [filterFuel, setFilterFuel] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "km-asc" | "year-desc">("price-asc");
  const [selectedVehicle, setSelectedVehicle] = useState<EnrichedVehicle | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

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
      if (filterBrand) { const b = v.brand || detectBrand(v.title); if (b !== filterBrand) return false; }
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

  function openEssaiModal(v: EnrichedVehicle) { setSelectedVehicle(v); setModalOpen(true); }
  function openDetailDrawer(v: EnrichedVehicle) { setSelectedVehicle(v); setDetailOpen(true); }

  async function submitEssai(formData: FormData) {
    const data: Record<string, string> = {};
    formData.forEach((v, k) => { if (typeof v === "string") data[k] = v; });
    if (selectedVehicle) data.vehicule = selectedVehicle.title;
    const res = await fetch(`/api/prospect/${prospect.slug}/lead`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "essai", form: data }),
    });
    const j = await res.json();
    if (j.success) { alert("Demande envoyée — nous vous recontactons sous 24h !"); setModalOpen(false); }
    else { alert("Erreur. Réessayez ou appelez " + (prospect.phone || "directement")); }
  }

  if (!prospect.isGarage) {
    return (
      <main style={{ padding: 60, textAlign: "center", background: "#fbfbfd", color: "#1d1d1f", minHeight: "100vh", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif" }}>
        <h1>Page non disponible</h1>
        <a href={`/prospects/${prospect.slug}`} style={{ color: primaryColor }}>← Retour au site</a>
      </main>
    );
  }

  return (
    <>
      <style>{`
        :root { --primary: ${primaryColor}; --apple-bg: #fbfbfd; --apple-text: #1d1d1f; --apple-muted: #6e6e73; --apple-border: rgba(0,0,0,0.08); }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Text', sans-serif; background: var(--apple-bg); color: var(--apple-text); -webkit-font-smoothing: antialiased; }
        .apple-display { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'SF Pro Display', sans-serif; font-weight: 700; letter-spacing: -0.03em; line-height: 1.05; }

        .apple-header { position: sticky; top: 54px; z-index: 40; background: rgba(251,251,253,0.72); backdrop-filter: saturate(180%) blur(20px); border-bottom: 1px solid var(--apple-border); }
        .apple-input { width: 100%; padding: 16px 20px; border-radius: 16px; border: 1px solid var(--apple-border); background: #fff; color: var(--apple-text); font-size: 15px; font-family: inherit; outline: none; transition: all .2s; }
        .apple-input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px ${primaryColor}22; }

        .apple-chip { padding: 10px 18px; border-radius: 99px; border: 1px solid var(--apple-border); background: #fff; cursor: pointer; font-size: 13px; font-weight: 600; color: var(--apple-text); transition: all .2s cubic-bezier(0.4, 0, 0.2, 1); }
        .apple-chip:hover { border-color: var(--primary); color: var(--primary); }
        .apple-chip.active { background: var(--apple-text); color: #fff; border-color: var(--apple-text); }

        .apple-card { background: #fff; border: 1px solid var(--apple-border); border-radius: 22px; overflow: hidden; transition: all .4s cubic-bezier(0.4, 0, 0.2, 1); cursor: pointer; display: flex; flex-direction: column; }
        .apple-card:hover { transform: translateY(-4px); box-shadow: 0 24px 60px -16px rgba(0,0,0,0.15); border-color: rgba(0,0,0,0.16); }
        .apple-card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; transition: transform .6s cubic-bezier(0.4, 0, 0.2, 1); }
        .apple-card:hover img { transform: scale(1.04); }

        .apple-btn-primary { background: var(--apple-text); color: #fff; padding: 14px 28px; border-radius: 99px; font-weight: 600; font-size: 15px; border: none; cursor: pointer; transition: all .2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .apple-btn-primary:hover { background: #000; transform: translateY(-1px); }

        .apple-btn-accent { background: var(--primary); color: #fff; padding: 14px 28px; border-radius: 99px; font-weight: 600; font-size: 15px; border: none; cursor: pointer; transition: all .2s; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .apple-btn-accent:hover { transform: translateY(-1px); box-shadow: 0 12px 32px ${primaryColor}44; }

        .apple-btn-ghost { background: rgba(0,0,0,0.04); color: var(--apple-text); padding: 14px 28px; border-radius: 99px; font-weight: 600; font-size: 15px; border: none; cursor: pointer; transition: all .2s; }
        .apple-btn-ghost:hover { background: rgba(0,0,0,0.08); }

        .apple-pill { display: inline-flex; align-items: center; gap: 6px; background: rgba(0,0,0,0.04); padding: 6px 14px; border-radius: 99px; font-size: 13px; font-weight: 500; color: var(--apple-muted); }
        .apple-pill-glow { background: ${primaryColor}11; color: var(--primary); }

        .stat-tile { background: rgba(0,0,0,0.03); padding: 16px 18px; border-radius: 14px; }
        .stat-tile-value { font-family: 'Inter', sans-serif; font-weight: 700; font-size: 22px; letter-spacing: -0.02em; color: var(--apple-text); }
        .stat-tile-label { font-size: 12px; color: var(--apple-muted); margin-top: 4px; }

        .drawer-bg { position: fixed; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(6px); z-index: 99; }
        .apple-drawer { position: fixed; top: 0; right: 0; bottom: 0; width: 100%; max-width: 540px; background: #fff; z-index: 100; overflow-y: auto; box-shadow: -20px 0 60px -20px rgba(0,0,0,0.2); }

        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in-up { animation: fade-in-up .5s cubic-bezier(0.4, 0, 0.2, 1) both; }
        section { scroll-margin-top: 80px; }
      `}</style>

      {/* HEADER glass Apple */}
      <header className="apple-header">
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a href={`/prospects/${prospect.slug}`} style={{ display: "flex", alignItems: "center", gap: 14, textDecoration: "none", color: "var(--apple-text)" }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: "rgba(0,0,0,0.06)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>←</span>
            {logoUrl ? <img src={logoUrl} alt={prospect.name} style={{ height: 24 }} /> : null}
            <span className="apple-display" style={{ fontSize: 17, fontWeight: 600 }}>{prospect.name}</span>
          </a>
          {phoneDigits ? <a href={`tel:${phoneDigits}`} className="apple-btn-primary" style={{ textDecoration: "none", padding: "10px 20px", fontSize: 14, whiteSpace: "nowrap" }}>📞 {prospect.phone}</a> : null}
        </div>
      </header>

      {/* HERO MONUMENTAL Apple style */}
      <section style={{ padding: "120px 24px 80px", textAlign: "center", maxWidth: 1100, margin: "0 auto" }}>
        <div className="fade-in-up">
          <p style={{ fontSize: 17, fontWeight: 500, color: "var(--primary)", marginBottom: 16, letterSpacing: "-0.01em" }}>Notre stock à {prospect.city || "votre disposition"}</p>
          <h1 className="apple-display" style={{ fontSize: "clamp(48px, 8vw, 96px)", margin: "0 0 24px" }}>
            {vehicles.length} véhicule{vehicles.length > 1 ? "s" : ""}.
            <br/>
            <span style={{ color: "var(--apple-muted)" }}>Sélectionné{vehicles.length > 1 ? "s" : ""} avec soin.</span>
          </h1>
          <p style={{ fontSize: 21, color: "var(--apple-muted)", maxWidth: 680, margin: "0 auto", lineHeight: 1.4 }}>
            Description complète, consommation, coût d&apos;un plein, autonomie. Tout pour décider en confiance.
          </p>
          <div style={{ marginTop: 40, display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="#stock" className="apple-btn-accent" style={{ textDecoration: "none", padding: "16px 32px", fontSize: 17 }}>Voir le stock →</a>
            {phoneDigits ? <a href={`tel:${phoneDigits}`} className="apple-btn-ghost" style={{ textDecoration: "none", padding: "16px 32px", fontSize: 17 }}>Nous appeler</a> : null}
          </div>
        </div>
      </section>

      {vehicles.length === 0 ? (
        <section style={{ maxWidth: 800, margin: "0 auto", padding: "60px 24px 120px", textAlign: "center" }}>
          <div style={{ fontSize: 80, marginBottom: 24 }}>🚗</div>
          <h2 className="apple-display" style={{ fontSize: 40, marginBottom: 16 }}>Catalogue à venir.</h2>
          <p style={{ fontSize: 19, color: "var(--apple-muted)", marginBottom: 40, lineHeight: 1.5 }}>
            Photos, prix, kilométrage, fiches détaillées. Vos clients réservent un essai en 1 clic.
          </p>
          <button className="apple-btn-accent" onClick={() => openEssaiModal({ title: "Mise en ligne du catalogue" } as EnrichedVehicle)} style={{ padding: "16px 32px", fontSize: 16 }}>
            Programmer la mise en ligne
          </button>
        </section>
      ) : (
        <>
          {/* FILTRES épurés */}
          <section id="stock" style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, marginBottom: 24 }}>
              <input
                type="text"
                placeholder="Rechercher un modèle…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="apple-input"
              />
              <select value={sortBy} onChange={e => setSortBy(e.target.value as never)} className="apple-input" style={{ cursor: "pointer", width: "auto", minWidth: 200 }}>
                <option value="price-asc">Prix : croissant</option>
                <option value="price-desc">Prix : décroissant</option>
                <option value="km-asc">Km : croissant</option>
                <option value="year-desc">Année : plus récente</option>
              </select>
            </div>
            {availableBrands.length > 0 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <button className={`apple-chip ${filterBrand === null ? "active" : ""}`} onClick={() => setFilterBrand(null)}>Toutes marques</button>
                {availableBrands.map(b => (
                  <button key={b} className={`apple-chip ${filterBrand === b ? "active" : ""}`} onClick={() => setFilterBrand(filterBrand === b ? null : b)}>{b}</button>
                ))}
              </div>
            ) : null}
            {availableFuels.length > 0 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button className={`apple-chip ${filterFuel === null ? "active" : ""}`} onClick={() => setFilterFuel(null)}>Tous carburants</button>
                {availableFuels.map(f => (
                  <button key={f} className={`apple-chip ${filterFuel === f ? "active" : ""}`} onClick={() => setFilterFuel(filterFuel === f ? null : f)}>{f}</button>
                ))}
              </div>
            ) : null}
            <p style={{ marginTop: 24, color: "var(--apple-muted)", fontSize: 15, fontWeight: 500 }}>
              {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
            </p>
          </section>

          {/* GRILLE CARTES Apple */}
          <section style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px 120px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
              {filtered.map((v, i) => (
                <article key={i} className="apple-card fade-in-up" style={{ animationDelay: `${(i % 6) * 50}ms` }} onClick={() => openDetailDrawer(v)}>
                  <div style={{ position: "relative", overflow: "hidden" }}>
                    {v.image ? <img src={v.image} alt={v.title} loading="lazy" /> : <div style={{ aspectRatio: "4/3", background: "rgba(0,0,0,0.04)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50 }}>🚗</div>}
                    {v.price ? <div style={{ position: "absolute", bottom: 14, right: 14, background: "rgba(255,255,255,0.95)", padding: "8px 18px", borderRadius: 99, fontWeight: 700, fontSize: 16, color: "var(--apple-text)", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>{v.price}</div> : null}
                  </div>
                  <div style={{ padding: "24px 24px 20px", display: "flex", flexDirection: "column", flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{v.brand || "Véhicule"}</p>
                    <h3 className="apple-display" style={{ fontSize: 22, margin: "0 0 12px", lineHeight: 1.15, minHeight: 52 }}>{v.cleanedTitle || v.title}</h3>
                    <p style={{ fontSize: 14, color: "var(--apple-muted)", lineHeight: 1.55, marginBottom: 18, minHeight: 64 }}>{v.description}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 18 }}>
                      {v.year ? <span className="apple-pill">{v.year}</span> : null}
                      {v.km ? <span className="apple-pill">{v.km}</span> : null}
                      {v.fuel ? <span className="apple-pill apple-pill-glow">{v.fuel}</span> : null}
                    </div>
                    {/* Plus-value : conso + plein */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
                      <div className="stat-tile">
                        <div className="stat-tile-value">{v.consumption.value} <span style={{ fontSize: 12, fontWeight: 500, color: "var(--apple-muted)" }}>{v.consumption.unit}</span></div>
                        <div className="stat-tile-label">Conso moyenne</div>
                      </div>
                      <div className="stat-tile">
                        <div className="stat-tile-value">~{v.fullPrice.value} €</div>
                        <div className="stat-tile-label">Plein {v.tankCapacity.value}{v.tankCapacity.unit}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginTop: "auto" }}>
                      <button onClick={(e) => { e.stopPropagation(); openEssaiModal(v); }} className="apple-btn-accent" style={{ flex: 1, padding: "12px 20px", fontSize: 14 }}>Réserver un essai</button>
                      <button onClick={(e) => { e.stopPropagation(); openDetailDrawer(v); }} className="apple-btn-ghost" style={{ padding: "12px 18px", fontSize: 14 }}>Détails</button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {/* DRAWER détail style Apple light */}
      {detailOpen && selectedVehicle ? (
        <>
          <div className="drawer-bg" onClick={() => setDetailOpen(false)} />
          <aside className="apple-drawer">
            <div style={{ position: "sticky", top: 0, zIndex: 5, background: "rgba(255,255,255,0.9)", backdropFilter: "blur(20px)", padding: "16px 20px", display: "flex", justifyContent: "flex-end", borderBottom: "1px solid var(--apple-border)" }}>
              <button onClick={() => setDetailOpen(false)} style={{ width: 36, height: 36, borderRadius: 99, background: "rgba(0,0,0,0.05)", border: "none", cursor: "pointer", fontSize: 18, color: "var(--apple-text)" }}>×</button>
            </div>
            {selectedVehicle.image ? <img src={selectedVehicle.image} alt={selectedVehicle.title} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} /> : null}
            <div style={{ padding: "32px 32px 40px" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "var(--primary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>{selectedVehicle.brand || "Véhicule disponible"}</p>
              <h2 className="apple-display" style={{ fontSize: 36, margin: "0 0 20px", lineHeight: 1.1 }}>{selectedVehicle.cleanedTitle || selectedVehicle.title}</h2>
              {selectedVehicle.price ? <div className="apple-display" style={{ fontSize: 40, color: "var(--apple-text)", marginBottom: 24 }}>{selectedVehicle.price}</div> : null}

              <p style={{ fontSize: 17, color: "var(--apple-muted)", lineHeight: 1.6, marginBottom: 32 }}>{selectedVehicle.description}</p>

              {selectedVehicle.highlights?.length > 0 ? (
                <div style={{ marginBottom: 32 }}>
                  {selectedVehicle.highlights.map((h, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "start", gap: 12, padding: "10px 0", color: "var(--apple-text)", fontSize: 15, borderBottom: i < selectedVehicle.highlights.length - 1 ? "1px solid var(--apple-border)" : "none" }}>
                      <span style={{ color: "var(--primary)", marginTop: 2 }}>✓</span>
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              <h3 className="apple-display" style={{ fontSize: 22, marginBottom: 16, marginTop: 8 }}>Fiche technique</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
                {selectedVehicle.year ? <div className="stat-tile"><div className="stat-tile-value">{selectedVehicle.year}</div><div className="stat-tile-label">Année</div></div> : null}
                {selectedVehicle.km ? <div className="stat-tile"><div className="stat-tile-value">{selectedVehicle.km}</div><div className="stat-tile-label">Kilométrage</div></div> : null}
                {selectedVehicle.fuel ? <div className="stat-tile"><div className="stat-tile-value" style={{ fontSize: 18 }}>{selectedVehicle.fuel}</div><div className="stat-tile-label">Carburant</div></div> : null}
              </div>

              <h3 className="apple-display" style={{ fontSize: 22, marginBottom: 16 }}>Combien ça coûte ?</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
                <div className="stat-tile">
                  <div className="stat-tile-value">{selectedVehicle.consumption.value} <span style={{ fontSize: 12, fontWeight: 500, color: "var(--apple-muted)" }}>{selectedVehicle.consumption.unit}</span></div>
                  <div className="stat-tile-label">Consommation moyenne</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile-value">~{selectedVehicle.fullPrice.value} €</div>
                  <div className="stat-tile-label">Plein {selectedVehicle.tankCapacity.value}{selectedVehicle.tankCapacity.unit}</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile-value">{selectedVehicle.rangeKm} <span style={{ fontSize: 12, fontWeight: 500, color: "var(--apple-muted)" }}>km</span></div>
                  <div className="stat-tile-label">Autonomie sur 1 plein</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile-value">{selectedVehicle.costPer100km.toFixed(2)} €</div>
                  <div className="stat-tile-label">Coût aux 100 km</div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <button onClick={() => { setDetailOpen(false); openEssaiModal(selectedVehicle); }} className="apple-btn-accent" style={{ padding: "16px 24px", fontSize: 16 }}>Réserver un essai</button>
                {phoneDigits ? <a href={`tel:${phoneDigits}`} className="apple-btn-primary" style={{ padding: "16px 24px", fontSize: 16, textDecoration: "none" }}>Appeler directement</a> : null}
                {selectedVehicle.url ? <a href={selectedVehicle.url} target="_blank" rel="noopener" className="apple-btn-ghost" style={{ padding: "14px 24px", fontSize: 15, textDecoration: "none", textAlign: "center", color: "var(--apple-text)" }}>↗ Fiche complète</a> : null}
              </div>
            </div>
          </aside>
        </>
      ) : null}

      {/* MODAL ESSAI Apple light */}
      {modalOpen ? (
        <div onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 110, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="fade-in-up" style={{ background: "#fff", borderRadius: 24, padding: 32, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto", border: "1px solid var(--apple-border)" }}>
            <button onClick={() => setModalOpen(false)} style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: 99, background: "rgba(0,0,0,0.05)", border: "none", cursor: "pointer", fontSize: 18, color: "var(--apple-text)" }}>×</button>
            <h3 className="apple-display" style={{ fontSize: 28, margin: "0 0 8px" }}>Réserver un essai</h3>
            <p style={{ color: "var(--apple-muted)", fontSize: 15, marginBottom: 24 }}>{selectedVehicle?.title}</p>
            <form onSubmit={e => { e.preventDefault(); submitEssai(new FormData(e.currentTarget)); }}>
              <input type="text" name="nom" required placeholder="Votre nom" className="apple-input" style={{ marginBottom: 12 }} />
              <input type="tel" name="telephone" required placeholder="Téléphone" className="apple-input" style={{ marginBottom: 12 }} />
              <input type="email" name="email" placeholder="Email" className="apple-input" style={{ marginBottom: 12 }} />
              <input type="date" name="date_souhaitee" className="apple-input" style={{ marginBottom: 12 }} />
              <textarea name="message" rows={3} placeholder="Précisez vos préférences…" className="apple-input" style={{ marginBottom: 16, fontFamily: "inherit" }} />
              <button type="submit" className="apple-btn-accent" style={{ width: "100%", padding: "16px 24px", fontSize: 16 }}>Envoyer ma demande</button>
              <p style={{ fontSize: 12, color: "var(--apple-muted)", textAlign: "center", marginTop: 12 }}>🔒 Confidentiel. Réponse sous 24h.</p>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
