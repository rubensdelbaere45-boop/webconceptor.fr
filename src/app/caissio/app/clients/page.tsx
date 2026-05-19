"use client";
import { useState, useEffect } from "react";
import { Plus, Search, X, Check } from "lucide-react";
import { getCustomers, saveCustomer, type Customer } from "@/lib/caissio-store";

export default function ClientsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });

  useEffect(() => { setCustomers(getCustomers()); }, []);

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.phone || "").includes(search)
  );

  const setF = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = () => {
    if (!form.name.trim()) return;
    saveCustomer(form);
    setCustomers(getCustomers());
    setCreating(false);
    setForm({ name: "", email: "", phone: "" });
  };

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'IBM Plex Sans',sans-serif", maxWidth: 900 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 4 }}>Fidélité</div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 32, fontWeight: 900, color: "#0f172a" }}>Clients</h1>
        </div>
        <button onClick={() => setCreating(true)} style={{ height: 42, padding: "0 18px", borderRadius: 12, background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <Plus style={{ width: 16, height: 16 }} /> Nouveau client
        </button>
      </div>

      {creating && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(6px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 420, boxShadow: "0 32px 80px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>Nouveau client</h2>
              <button onClick={() => setCreating(false)} style={{ background: "none", border: "none", cursor: "pointer" }}><X style={{ width: 20, height: 20, color: "#94a3b8" }} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {([["name","Nom complet","text"],["email","Email","email"],["phone","Téléphone","tel"]] as const).map(([k, label, type]) => (
                <label key={k} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b" }}>{label}</span>
                  <input type={type} value={form[k]} onChange={setF(k)} style={{ height: 42, padding: "0 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" }} />
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => setCreating(false)} style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#64748b" }}>Annuler</button>
              <button onClick={save} style={{ flex: 2, height: 44, borderRadius: 12, border: "none", background: "#4f46e5", cursor: "pointer", fontWeight: 700, color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Check style={{ width: 16, height: 16 }} /> Créer
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: "relative", marginBottom: 20, maxWidth: 380 }}>
        <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un client…"
          style={{ width: "100%", height: 42, paddingLeft: 36, border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", background: "#fff" }} />
      </div>

      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 120px 80px", padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8" }}>
          <span>Client</span><span>Email</span><span>Téléphone</span><span style={{ textAlign: "right" }}>Points</span>
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>
            {customers.length === 0 ? "Aucun client enregistré — ajoutez des clients pour gérer leur fidélité." : "Aucun résultat."}
          </div>
        ) : filtered.map((c, i) => (
          <div key={c.id} style={{ display: "grid", gridTemplateColumns: "1fr 180px 120px 80px", padding: "14px 16px", borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#4f46e5", flexShrink: 0 }}>
                {c.name.slice(0, 1).toUpperCase()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{c.name}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>depuis {new Date(c.created_at).toLocaleDateString("fr-FR")}</div>
              </div>
            </div>
            <div style={{ fontSize: 13, color: "#64748b" }}>{c.email || "—"}</div>
            <div style={{ fontSize: 13, color: "#64748b" }}>{c.phone || "—"}</div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5", background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 8, padding: "3px 8px" }}>{c.points} pts</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>{filtered.length} client(s)</div>
    </div>
  );
}
