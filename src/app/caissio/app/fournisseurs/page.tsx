"use client";
import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, X, Truck, Check } from "lucide-react";
import { getSuppliers, saveSupplier, updateSupplier, deleteSupplier, type Supplier } from "@/lib/caissio-store";

type Form = Omit<Supplier, "id" | "created_at">;
const empty: Form = { name: "", contact_name: "", phone: "", email: "", address: "", notes: "" };

function Inp({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b" }}>{label}</span>
      <input type={type} value={value} onChange={onChange} style={{ height: 42, padding: "0 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff" }} />
    </label>
  );
}

export default function FournisseursPage() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Form>(empty);

  const reload = () => setItems(getSuppliers());
  useEffect(() => { reload(); }, []);

  const setF = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const openCreate = () => { setForm(empty); setEditing(null); setCreating(true); };
  const openEdit = (s: Supplier) => {
    setForm({ name: s.name, contact_name: s.contact_name || "", phone: s.phone || "", email: s.email || "", address: s.address || "", notes: s.notes || "" });
    setEditing(s);
    setCreating(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editing) updateSupplier(editing.id, form);
    else saveSupplier(form);
    reload();
    setCreating(false);
    setEditing(null);
  };

  const del = (s: Supplier) => {
    if (!confirm(`Supprimer "${s.name}" ?`)) return;
    deleteSupplier(s.id);
    reload();
  };

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'IBM Plex Sans',sans-serif", maxWidth: 1000 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 4 }}>Réseau</div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 32, fontWeight: 900, color: "#0f172a" }}>Fournisseurs</h1>
        </div>
        <button onClick={openCreate} style={{ height: 42, padding: "0 18px", borderRadius: 12, background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <Plus style={{ width: 16, height: 16 }} /> Nouveau fournisseur
        </button>
      </div>

      {/* Modal */}
      {creating && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(6px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 480, boxShadow: "0 32px 80px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{editing ? "Modifier" : "Nouveau"} fournisseur</h2>
              <button onClick={() => { setCreating(false); setEditing(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X style={{ width: 20, height: 20, color: "#94a3b8" }} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <Inp label="Nom *" value={form.name} onChange={setF("name")} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Inp label="Contact" value={form.contact_name || ""} onChange={setF("contact_name")} />
                <Inp label="Téléphone" value={form.phone || ""} onChange={setF("phone")} />
                <Inp label="Email" value={form.email || ""} onChange={setF("email")} type="email" />
                <Inp label="Adresse" value={form.address || ""} onChange={setF("address")} />
              </div>
              <Inp label="Notes" value={form.notes || ""} onChange={setF("notes")} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => { setCreating(false); setEditing(null); }} style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#64748b" }}>Annuler</button>
              <button onClick={save} style={{ flex: 2, height: 44, borderRadius: 12, border: "none", background: "#4f46e5", cursor: "pointer", fontWeight: 700, color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Check style={{ width: 16, height: 16 }} /> {editing ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards grid */}
      {items.length === 0 ? (
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 48, textAlign: "center", color: "#94a3b8" }}>
          <Truck style={{ width: 36, height: 36, margin: "0 auto 12px", color: "#cbd5e1" }} />
          <div style={{ fontSize: 14 }}>Aucun fournisseur enregistré.<br />Ajoutez vos fournisseurs pour suivre vos approvisionnements.</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {items.map((s) => (
            <div key={s.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Truck style={{ width: 18, height: 18, color: "#4f46e5" }} />
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => openEdit(s)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Pencil style={{ width: 13, height: 13, color: "#64748b" }} />
                  </button>
                  <button onClick={() => del(s)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 style={{ width: 13, height: 13, color: "#dc2626" }} />
                  </button>
                </div>
              </div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 17, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{s.name}</div>
              {s.contact_name && <div style={{ fontSize: 13, color: "#64748b", marginBottom: 8 }}>{s.contact_name}</div>}
              <div style={{ fontSize: 12, color: "#94a3b8", display: "flex", flexDirection: "column", gap: 3 }}>
                {s.phone && <div style={{ fontFamily: "monospace" }}>{s.phone}</div>}
                {s.email && <div>{s.email}</div>}
                {s.address && <div>{s.address}</div>}
                {s.notes && <div style={{ fontStyle: "italic", marginTop: 4 }}>{s.notes}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
      <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>{items.length} fournisseur(s)</div>
    </div>
  );
}
