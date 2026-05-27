"use client";
import { useState, useEffect, useRef } from "react";
import { Plus, Search, Pencil, Trash2, Check, X, Upload, AlertCircle } from "lucide-react";
import { getProducts, saveProduct, updateProduct, deleteProduct, type Product } from "@/lib/caissio-store";

type CsvRow = { name: string; price: number; price_buy: number; category: string; barcode: string; stock: number; stock_min: number; tva: number; error?: string };

function parseCSV(text: string): CsvRow[] {
  const lines = text.trim().split(/\r?\n/);
  const sep = lines[0]?.includes(";") ? ";" : ",";
  const headers = lines[0]?.split(sep).map((h) => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
  return lines.slice(1).map((line) => {
    const cols = line.split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    const get = (keys: string[]) => cols[keys.map((k) => headers.indexOf(k)).find((i) => i >= 0) ?? -1] || "";
    const price = parseFloat(get(["price","prix","prix_vente"]).replace(",", ".")) || 0;
    const price_buy = parseFloat(get(["price_buy","prix_achat","achat"]).replace(",", ".")) || 0;
    const stock = parseInt(get(["stock","quantite","qty"])) || 0;
    const stock_min = parseInt(get(["stock_min","min","alerte"])) || 5;
    const tva = parseFloat(get(["tva","vat","taxe"]).replace(",", ".")) || 20;
    const name = get(["name","nom","produit","libelle"]);
    const row: CsvRow = { name, price, price_buy, category: get(["category","categorie","rayon"]) || "Divers", barcode: get(["barcode","code_barre","ean","code"]), stock, stock_min, tva };
    if (!name) row.error = "Nom manquant";
    return row;
  }).filter((r) => r.name || r.error);
}

type Form = Omit<Product, "id" | "active">;
const empty: Form = { name: "", price: 0, price_buy: 0, category: "", barcode: "", stock: 0, stock_min: 5, tva: 20, image_url: "" };

export default function ProduitsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Form>(empty);
  const [csvRows, setCsvRows] = useState<CsvRow[] | null>(null);
  const [csvDrag, setCsvDrag] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = () => setProducts(getProducts());
  useEffect(() => { reload(); }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode || "").includes(search) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const setF = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === "number" ? parseFloat(e.target.value) || 0 : e.target.value }));

  const openCreate = () => { setForm(empty); setEditing(null); setCreating(true); };
  const openEdit = (p: Product) => { setForm({ name: p.name, price: p.price, price_buy: p.price_buy ?? 0, category: p.category, barcode: p.barcode ?? "", stock: p.stock, stock_min: p.stock_min ?? 5, tva: p.tva, image_url: p.image_url ?? "" }); setEditing(p); setCreating(true); };

  const save = () => {
    if (!form.name.trim()) return;
    if (editing) updateProduct(editing.id, { ...form, active: true });
    else saveProduct({ ...form, active: true });
    reload(); setCreating(false); setEditing(null);
  };

  const del = (id: string) => { if (confirm("Supprimer ce produit ?")) { deleteProduct(id); reload(); } };

  const margin = (p: Product) => p.price_buy ? ((p.price - p.price_buy) / p.price * 100).toFixed(0) + "%" : "—";

  const handleFile = async (file: File) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";

    if (["xlsx", "xls", "ods"].includes(ext)) {
      try {
        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const wb = XLSX.read(buffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawRows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, defval: "" }) as unknown[][];
        if (!rawRows.length) { setCsvRows([]); return; }

        const headers = (rawRows[0] as string[]).map((h) => String(h ?? "").trim());
        const colIdx = (...keys: string[]) => {
          for (const k of keys) {
            const i = headers.findIndex((h) => h.toLowerCase().includes(k.toLowerCase()));
            if (i >= 0) return i;
          }
          return -1;
        };

        const nameIdx    = colIdx("nom de l'article", "nom", "name", "libelle");
        const catIdx     = colIdx("catégorie", "categorie", "category", "rayon");
        const priceIdx   = colIdx("prix de vente", "prix", "price");
        const barcodeIdx = colIdx("code-barres", "code_barre", "barcode", "ean");
        const tva5Idx    = colIdx("5.5");
        const tva10Idx   = colIdx("10%", "tva 10");

        const dataRows = rawRows.slice(1).filter((r) => {
          const first = String((r as unknown[])[0] ?? "").toLowerCase();
          return !first.includes("ne pas modifier");
        });

        const parsed: CsvRow[] = dataRows.map((r) => {
          const row = r as unknown[];
          const name     = nameIdx >= 0    ? String(row[nameIdx] ?? "").trim()   : "";
          const category = catIdx >= 0     ? String(row[catIdx] ?? "").trim()    : "Import";
          const price    = priceIdx >= 0   ? parseFloat(String(row[priceIdx] ?? "0").replace(",", ".")) || 0 : 0;
          const barcode  = barcodeIdx >= 0 ? String(row[barcodeIdx] ?? "").trim() : "";
          let tva = 20;
          if (tva5Idx >= 0  && String(row[tva5Idx] ?? "").toLowerCase() === "oui") tva = 5.5;
          else if (tva10Idx >= 0 && String(row[tva10Idx] ?? "").toLowerCase() === "oui") tva = 10;
          const out: CsvRow = { name, price, price_buy: 0, category: category || "Import", barcode, stock: 0, stock_min: 5, tva };
          if (!name) out.error = "Nom manquant";
          return out;
        }).filter((r) => r.name || r.error);

        setCsvRows(parsed);
      } catch {
        setCsvRows([]);
      }
      return;
    }

    // CSV / texte
    const reader = new FileReader();
    reader.onload = (e) => { const text = e.target?.result as string; setCsvRows(parseCSV(text)); };
    reader.readAsText(file, "utf-8");
  };

  const commitCSV = () => {
    if (!csvRows) return;
    csvRows.filter((r) => !r.error).forEach((r) => saveProduct({ ...r, active: true }));
    reload();
    setCsvRows(null);
  };

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'IBM Plex Sans',sans-serif", maxWidth: 1200 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 4 }}>Catalogue</div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 32, fontWeight: 900, color: "#0f172a" }}>Produits</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input ref={fileRef} type="file" accept="*" style={{ display: "none" }} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <button onClick={() => fileRef.current?.click()} style={{ height: 42, padding: "0 16px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", color: "#4f46e5", fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Upload style={{ width: 15, height: 15 }} /> Importer
          </button>
          <button onClick={openCreate} style={{ height: 42, padding: "0 18px", borderRadius: 12, background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
            <Plus style={{ width: 16, height: 16 }} /> Nouveau produit
          </button>
        </div>
      </div>

      {/* Modal */}
      {creating && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(6px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 500, boxShadow: "0 32px 80px rgba(0,0,0,.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, color: "#0f172a" }}>{editing ? "Modifier le produit" : "Nouveau produit"}</h2>
              <button onClick={() => { setCreating(false); setEditing(null); }} style={{ background: "none", border: "none", cursor: "pointer" }}><X style={{ width: 20, height: 20, color: "#94a3b8" }} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {([["name","Nom",false],["category","Catégorie",false],["barcode","Code-barre",false],["image_url","URL image",false]] as const).map(([k, label]) => (
                <label key={k} style={{ display: "flex", flexDirection: "column", gap: 5, gridColumn: k === "name" || k === "image_url" ? "1/-1" : undefined }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b" }}>{label}</span>
                  <input value={form[k] as string} onChange={setF(k)} style={{ height: 40, padding: "0 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" }} />
                </label>
              ))}
              {([["price","Prix vente (€)"],["price_buy","Prix achat (€)"],["stock","Stock"],["stock_min","Stock min"],["tva","TVA (%)"]] as const).map(([k, label]) => (
                <label key={k} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b" }}>{label}</span>
                  <input type="number" step="0.01" value={form[k] as number} onChange={setF(k)} style={{ height: 40, padding: "0 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none" }} />
                </label>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button onClick={() => { setCreating(false); setEditing(null); }} style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 600, fontSize: 14, color: "#64748b" }}>Annuler</button>
              <button onClick={save} style={{ flex: 2, height: 44, borderRadius: 12, border: "none", background: "#4f46e5", cursor: "pointer", fontWeight: 700, fontSize: 14, color: "#fff" }}>
                <Check style={{ width: 16, height: 16, display: "inline", marginRight: 6 }} />{editing ? "Enregistrer" : "Créer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CSV drag zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setCsvDrag(true); }}
        onDragLeave={() => setCsvDrag(false)}
        onDrop={(e) => { e.preventDefault(); setCsvDrag(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => fileRef.current?.click()}
        style={{ display: csvDrag ? "flex" : "flex", position: "fixed", inset: 0, zIndex: 40, background: "rgba(79,70,229,.12)", backdropFilter: "blur(4px)", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: csvDrag ? 1 : 0, pointerEvents: csvDrag ? "auto" : "none", transition: "opacity .2s" }}
      >
        <div style={{ background: "#fff", border: "2px dashed #4f46e5", borderRadius: 20, padding: "40px 60px", textAlign: "center", fontSize: 16, fontWeight: 700, color: "#4f46e5" }}>
          Déposez votre fichier ici
        </div>
      </div>

      {/* CSV preview modal */}
      {csvRows && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", backdropFilter: "blur(6px)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ background: "#fff", borderRadius: 24, padding: 28, width: "100%", maxWidth: 700, boxShadow: "0 32px 80px rgba(0,0,0,.2)", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Aperçu import — {csvRows.length} ligne(s)</h2>
              <button onClick={() => setCsvRows(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X style={{ width: 20, height: 20, color: "#94a3b8" }} /></button>
            </div>
            <div style={{ flex: 1, overflow: "auto", border: "1px solid #e2e8f0", borderRadius: 12 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px", padding: "8px 14px", background: "#f8fafc", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", position: "sticky", top: 0 }}>
                <span>Produit</span><span style={{ textAlign: "right" }}>Prix</span><span style={{ textAlign: "right" }}>Achat</span><span style={{ textAlign: "right" }}>Stock</span><span style={{ textAlign: "right" }}>TVA</span>
              </div>
              {csvRows.map((r, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 80px 80px", padding: "10px 14px", borderTop: "1px solid #f1f5f9", background: r.error ? "#fef2f2" : "#fff", alignItems: "center" }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: r.error ? "#dc2626" : "#0f172a" }}>{r.name || "—"}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.category}{r.error ? ` · ⚠ ${r.error}` : ""}</div>
                  </div>
                  <div style={{ textAlign: "right", fontSize: 13, color: "#4f46e5", fontWeight: 700 }}>{r.price.toFixed(2)} €</div>
                  <div style={{ textAlign: "right", fontSize: 13, color: "#64748b" }}>{r.price_buy ? r.price_buy.toFixed(2) + " €" : "—"}</div>
                  <div style={{ textAlign: "right", fontSize: 13, color: "#0f172a" }}>{r.stock}</div>
                  <div style={{ textAlign: "right", fontSize: 13, color: "#64748b" }}>{r.tva}%</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 16, alignItems: "center" }}>
              {csvRows.some((r) => r.error) && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#d97706", flex: 1 }}>
                  <AlertCircle style={{ width: 14, height: 14 }} />
                  {csvRows.filter((r) => r.error).length} ligne(s) avec erreurs seront ignorées
                </div>
              )}
              <button onClick={() => setCsvRows(null)} style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontWeight: 600, color: "#64748b" }}>Annuler</button>
              <button onClick={commitCSV} disabled={csvRows.filter((r) => !r.error).length === 0} style={{ flex: 2, height: 44, borderRadius: 12, border: "none", background: "#4f46e5", cursor: "pointer", fontWeight: 700, color: "#fff", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                <Check style={{ width: 16, height: 16 }} /> Importer {csvRows.filter((r) => !r.error).length} produit(s)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div style={{ position: "relative", marginBottom: 20, maxWidth: 400 }}>
        <Search style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#94a3b8" }} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit…"
          style={{ width: "100%", height: 42, paddingLeft: 36, border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 13, outline: "none", background: "#fff" }} />
      </div>

      {/* Table */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 80px 70px 80px 70px", padding: "10px 16px", background: "#f8fafc", borderBottom: "1px solid #e2e8f0", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8" }}>
          <span>Produit</span><span style={{ textAlign: "right" }}>Prix</span><span style={{ textAlign: "right" }}>Achat</span><span style={{ textAlign: "right" }}>Marge</span><span style={{ textAlign: "right" }}>Stock</span><span style={{ textAlign: "right" }}>TVA</span><span />
        </div>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#94a3b8", fontSize: 14 }}>Aucun produit — créez votre premier produit ou importez un CSV</div>
        ) : filtered.map((p, i) => (
          <div key={p.id} style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 80px 70px 80px 70px", padding: "12px 16px", borderBottom: i < filtered.length - 1 ? "1px solid #f1f5f9" : "none", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{p.name}</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.category}{p.barcode ? ` · ${p.barcode}` : ""}</div>
            </div>
            <div style={{ textAlign: "right", fontWeight: 700, color: "#4f46e5" }}>{p.price.toFixed(2)} €</div>
            <div style={{ textAlign: "right", color: "#64748b", fontSize: 13 }}>{p.price_buy ? p.price_buy.toFixed(2) + " €" : "—"}</div>
            <div style={{ textAlign: "right", color: "#10b981", fontWeight: 600, fontSize: 13 }}>{margin(p)}</div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: p.stock === 0 ? "#dc2626" : p.stock <= (p.stock_min ?? 5) ? "#d97706" : "#0f172a", background: p.stock === 0 ? "#fef2f2" : p.stock <= (p.stock_min ?? 5) ? "#fffbeb" : "#f8fafc", border: `1px solid ${p.stock === 0 ? "#fecaca" : p.stock <= (p.stock_min ?? 5) ? "#fde68a" : "#e2e8f0"}`, borderRadius: 6, padding: "2px 6px" }}>{p.stock}</span>
            </div>
            <div style={{ textAlign: "right", color: "#64748b", fontSize: 13 }}>{p.tva}%</div>
            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button onClick={() => openEdit(p)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Pencil style={{ width: 13, height: 13, color: "#64748b" }} /></button>
              <button onClick={() => del(p.id)} style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #fecaca", background: "#fef2f2", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}><Trash2 style={{ width: 13, height: 13, color: "#dc2626" }} /></button>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>{filtered.length} produit(s)</div>
    </div>
  );
}
