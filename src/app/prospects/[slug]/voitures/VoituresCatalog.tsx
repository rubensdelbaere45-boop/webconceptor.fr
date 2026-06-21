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
  vehicles: Vehicle[];
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  stockPhotos: string[];
};

const CAR_BRANDS_DETECT = ["Mercedes", "BMW", "Audi", "Volkswagen", "Peugeot", "Renault", "Citroën", "DS", "Ford", "Opel", "Fiat", "Toyota", "Honda", "Nissan", "Hyundai", "Kia", "Mazda", "Mitsubishi", "Suzuki", "Skoda", "Seat", "Volvo", "Mini", "Smart", "Tesla", "Porsche", "Jeep", "Land Rover", "Range Rover", "Jaguar", "Alfa Romeo", "Dacia", "Lexus", "Cupra", "Polestar", "MG", "Yamaha", "Kawasaki", "Ducati"];

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

export default function VoituresCatalog({ prospect, vehicles, primaryColor, accentColor, logoUrl, stockPhotos }: Props) {
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState<string | null>(null);
  const [filterFuel, setFilterFuel] = useState<string | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [kmMax, setKmMax] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"price-asc" | "price-desc" | "km-asc" | "year-desc">("price-asc");
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"essai" | "info">("essai");

  const phoneDigits = (prospect.phone || "").replace(/[^\d+]/g, "");

  // Brands available
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    for (const v of vehicles) {
      const b = detectBrand(v.title);
      if (b) set.add(b);
    }
    return Array.from(set).sort();
  }, [vehicles]);

  // Fuels available
  const availableFuels = useMemo(() => {
    const set = new Set<string>();
    for (const v of vehicles) {
      if (v.fuel) set.add(v.fuel);
    }
    return Array.from(set).sort();
  }, [vehicles]);

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = vehicles.filter(v => {
      if (search && !v.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterBrand) {
        const b = detectBrand(v.title);
        if (b !== filterBrand) return false;
      }
      if (filterFuel && v.fuel !== filterFuel) return false;
      if (priceMax && parsePrice(v.price) > priceMax) return false;
      if (kmMax && parseKm(v.km) > kmMax) return false;
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
  }, [vehicles, search, filterBrand, filterFuel, priceMax, kmMax, sortBy]);

  function openEssaiModal(v: Vehicle) {
    setSelectedVehicle(v);
    setModalType("essai");
    setModalOpen(true);
  }
  function openInfoModal(v: Vehicle) {
    setSelectedVehicle(v);
    setModalType("info");
    setModalOpen(true);
  }
  async function submitEssai(formData: FormData) {
    const data: Record<string, string> = {};
    formData.forEach((v, k) => { if (typeof v === "string") data[k] = v; });
    if (selectedVehicle) data.vehicule = selectedVehicle.title;
    const res = await fetch(`/api/prospect/${prospect.slug}/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: modalType === "essai" ? "essai" : "contact", form: data }),
    });
    const j = await res.json();
    if (j.success) {
      alert("Demande envoyée — nous vous recontactons sous 24h !");
      setModalOpen(false);
    } else {
      alert("Erreur. Réessayez ou appelez " + (prospect.phone || "directement"));
    }
  }

  if (!prospect.isGarage) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h1 style={{ fontSize: 32, fontFamily: "EB Garamond, serif" }}>Page non disponible</h1>
        <p>Ce prospect n&apos;est pas un garage.</p>
        <a href={`/prospects/${prospect.slug}`} style={{ color: primaryColor }}>← Retour au site</a>
      </main>
    );
  }

  return (
    <>
      <style>{`
        :root { --primary: ${primaryColor}; --accent: ${accentColor}; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: "Plus Jakarta Sans", -apple-system, sans-serif; background: linear-gradient(180deg, #fafaf9 0%, #f4f4f5 100%); color: #1a1a1a; }
        .font-serif { font-family: "EB Garamond", Georgia, serif; }
        .gradient-text { background: linear-gradient(135deg, var(--primary), var(--accent)); -webkit-background-clip: text; background-clip: text; color: transparent; -webkit-text-fill-color: transparent; }
        .glass { background: rgba(255,255,255,0.7); backdrop-filter: blur(20px) saturate(180%); border: 1px solid rgba(255,255,255,0.5); }
        .hover-lift { transition: transform .3s, box-shadow .3s; }
        .hover-lift:hover { transform: translateY(-4px); box-shadow: 0 20px 40px -10px ${primaryColor}33; }
        .vh-card { background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e5e5; box-shadow: 0 4px 12px rgba(0,0,0,0.05); display: flex; flex-direction: column; }
        .vh-card img { width: 100%; aspect-ratio: 4/3; object-fit: cover; transition: transform .5s; }
        .vh-card:hover img { transform: scale(1.05); }
        .pill { display: inline-flex; align-items: center; gap: 4px; background: #f4f4f5; padding: 4px 10px; border-radius: 99px; font-size: 12px; font-weight: 600; }
        .btn-primary { background: var(--primary); color: #fff; padding: 10px 20px; border-radius: 12px; font-weight: 700; border: none; cursor: pointer; transition: opacity .2s; font-size: 14px; }
        .btn-primary:hover { opacity: 0.9; }
        .btn-secondary { background: #f4f4f5; color: #1a1a1a; padding: 10px 16px; border-radius: 12px; font-weight: 600; border: none; cursor: pointer; transition: background .2s; font-size: 14px; }
        .btn-secondary:hover { background: #e5e5e5; }
        .chip { padding: 8px 16px; border-radius: 99px; border: 1.5px solid #e5e5e5; background: #fff; cursor: pointer; font-size: 13px; font-weight: 600; transition: all .2s; }
        .chip.active { background: var(--primary); color: #fff; border-color: var(--primary); }
        .chip:hover:not(.active) { border-color: var(--primary); color: var(--primary); }
        .input-modal { width: 100%; padding: 12px 16px; border-radius: 10px; border: 2px solid #e5e5e5; font-size: 14px; outline: none; }
        .input-modal:focus { border-color: var(--primary); }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn .4s ease both; }
      `}</style>

      {/* HEADER */}
      <header style={{ position: "sticky", top: 54, zIndex: 40, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid #e5e5e5" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
          <a href={`/prospects/${prospect.slug}`} style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none", color: "#1a1a1a" }}>
            <span style={{ width: 36, height: 36, borderRadius: 8, background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 18 }}>←</span>
            <div>
              {logoUrl ? <img src={logoUrl} alt={prospect.name} style={{ height: 28, verticalAlign: "middle", marginRight: 8 }} /> : null}
              <span className="font-serif" style={{ fontSize: 20, fontWeight: 700 }}>{prospect.name}</span>
            </div>
          </a>
          {phoneDigits ? <a href={`tel:${phoneDigits}`} className="btn-primary" style={{ textDecoration: "none", whiteSpace: "nowrap" }}>📞 {prospect.phone}</a> : null}
        </div>
      </header>

      {/* HERO catalogue */}
      <section style={{ position: "relative", padding: "60px 24px 40px", background: `linear-gradient(135deg, ${primaryColor}11 0%, ${accentColor}1a 100%)`, overflow: "hidden" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", textAlign: "center" }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: primaryColor, letterSpacing: "0.2em", textTransform: "uppercase" }}>Catalogue véhicules</span>
          <h1 className="font-serif" style={{ fontSize: 48, lineHeight: 1.1, margin: "16px 0 12px" }}>
            <span className="gradient-text">{vehicles.length}</span> véhicule{vehicles.length > 1 ? "s" : ""} disponible{vehicles.length > 1 ? "s" : ""}
          </h1>
          <p style={{ fontSize: 18, color: "#525252", maxWidth: 600, margin: "0 auto" }}>
            Tous nos véhicules en stock{prospect.city ? ` à ${prospect.city}` : ""}. Réservez votre essai en 1 clic.
          </p>
        </div>
      </section>

      {vehicles.length === 0 ? (
        <section style={{ maxWidth: 800, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
          <div style={{ fontSize: 80, marginBottom: 20 }}>🚗</div>
          <h2 className="font-serif" style={{ fontSize: 32, marginBottom: 16 }}>Catalogue en cours de mise en ligne</h2>
          <p style={{ fontSize: 17, color: "#525252", marginBottom: 32, lineHeight: 1.6 }}>
            Ce catalogue est prêt à recevoir <strong>tout votre stock de véhicules</strong> : photos, prix, kilométrage, fiches techniques.
            <br />Les visiteurs réservent leur essai en 1 clic — vous recevez la demande directement par SMS et email.
          </p>
          <button className="btn-primary" style={{ padding: "16px 32px", fontSize: 16 }} onClick={() => openInfoModal({ title: "Mise en ligne du catalogue" })}>
            📥 Programmer la mise en ligne
          </button>
        </section>
      ) : (
        <>
          {/* BAR FILTRES */}
          <section style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 16px" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <input
                type="text"
                placeholder="🔍 Rechercher un modèle..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ flex: 1, minWidth: 240, padding: "12px 20px", borderRadius: 12, border: "2px solid #e5e5e5", fontSize: 14, outline: "none" }}
              />
              <select value={sortBy} onChange={e => setSortBy(e.target.value as never)} style={{ padding: "12px 16px", borderRadius: 12, border: "2px solid #e5e5e5", fontSize: 14, background: "#fff", cursor: "pointer" }}>
                <option value="price-asc">Prix croissant</option>
                <option value="price-desc">Prix décroissant</option>
                <option value="km-asc">Km croissant</option>
                <option value="year-desc">Année récente</option>
              </select>
            </div>
            {availableBrands.length > 0 ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                <button className={`chip ${filterBrand === null ? "active" : ""}`} onClick={() => setFilterBrand(null)}>Toutes les marques</button>
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
            <div style={{ marginTop: 16, color: "#525252", fontSize: 14 }}>
              <strong>{filtered.length}</strong> résultat{filtered.length > 1 ? "s" : ""}
              {filtered.length !== vehicles.length ? ` sur ${vehicles.length}` : ""}
            </div>
          </section>

          {/* GRILLE VÉHICULES */}
          <section style={{ maxWidth: 1280, margin: "0 auto", padding: "16px 24px 80px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 24 }}>
              {filtered.map((v, i) => (
                <article key={i} className="vh-card hover-lift fade-in">
                  <div style={{ position: "relative", overflow: "hidden" }}>
                    {v.image ? <img src={v.image} alt={v.title} loading="lazy" /> : <div style={{ aspectRatio: "4/3", background: `linear-gradient(135deg, ${primaryColor}22, ${accentColor}22)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 50 }}>🚗</div>}
                    {v.price ? <div style={{ position: "absolute", top: 12, right: 12, background: "#fff", padding: "6px 14px", borderRadius: 99, fontWeight: 700, fontSize: 14, color: primaryColor, boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>{v.price}</div> : null}
                  </div>
                  <div style={{ padding: 18, display: "flex", flexDirection: "column", flex: 1 }}>
                    <h3 className="font-serif" style={{ fontSize: 17, margin: "0 0 12px", lineHeight: 1.3, minHeight: 44 }}>{v.title}</h3>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
                      {v.year ? <span className="pill">📅 {v.year}</span> : null}
                      {v.km ? <span className="pill">🛣 {v.km}</span> : null}
                      {v.fuel ? <span className="pill">⛽ {v.fuel}</span> : null}
                    </div>
                    <div style={{ display: "flex", gap: 6, marginTop: "auto" }}>
                      <button className="btn-primary" style={{ flex: 1 }} onClick={() => openEssaiModal(v)}>🚗 Réserver un essai</button>
                      {v.url ? <a href={v.url} target="_blank" rel="noopener" className="btn-secondary" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }} title="Voir la fiche">↗</a> : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {/* MODAL ESSAI / INFO */}
      {modalOpen ? (
        <div onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div className="fade-in" style={{ background: "#fff", borderRadius: 24, padding: 32, maxWidth: 480, width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <button onClick={() => setModalOpen(false)} style={{ position: "absolute", top: 16, right: 16, width: 40, height: 40, borderRadius: 99, background: "#f4f4f5", border: "none", cursor: "pointer", fontSize: 20 }}>×</button>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg, ${primaryColor}, ${accentColor})`, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, fontSize: 24 }}>{modalType === "essai" ? "🚗" : "📥"}</div>
            <h3 className="font-serif" style={{ fontSize: 26, margin: "0 0 8px" }}>{modalType === "essai" ? "Réserver un essai" : "Programmer la mise en ligne"}</h3>
            <p style={{ color: "#525252", marginBottom: 24 }}>{selectedVehicle?.title}</p>
            <form onSubmit={e => { e.preventDefault(); submitEssai(new FormData(e.currentTarget)); }}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Votre nom *</label>
                <input type="text" name="nom" required className="input-modal" placeholder="Prénom Nom" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Téléphone *</label>
                <input type="tel" name="telephone" required className="input-modal" placeholder="06 XX XX XX XX" />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Email</label>
                <input type="email" name="email" className="input-modal" placeholder="vous@email.fr" />
              </div>
              {modalType === "essai" ? (
                <div style={{ marginBottom: 14 }}>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Date souhaitée</label>
                  <input type="date" name="date_souhaitee" className="input-modal" />
                </div>
              ) : null}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Message</label>
                <textarea name="message" rows={3} className="input-modal" placeholder="Précisez vos préférences..." />
              </div>
              <button type="submit" className="btn-primary" style={{ width: "100%", padding: "14px 24px", fontSize: 15 }}>{modalType === "essai" ? "Réserver cet essai" : "Envoyer ma demande"}</button>
              <p style={{ fontSize: 12, color: "#a0a0a0", textAlign: "center", marginTop: 12 }}>🔒 Vos informations restent confidentielles. Réponse sous 24h.</p>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
