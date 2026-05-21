"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, Upload, Sparkles, CheckCircle2,
  FlaskConical, Zap, X, Loader2, Package, Trash2,
} from "lucide-react";
import {
  getSession, markOnboardingDone, switchToLive,
  seedDemoCatalog, seedDemoSales, saveProduct,
  type Product,
} from "@/lib/caissio-store";

/* ── Types ── */
type ImportedProduct = Omit<Product, "id"> & { _key: string };
type Step = 1 | 2 | 3;

function CaissioMark({ size = 36 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none">
      <rect x="2" y="2" width="44" height="44" rx="11" fill="#4F46E5" />
      <rect x="14" y="6" width="14" height="6" rx="1.5" fill="white" opacity="0.95" />
      <rect x="10" y="16" width="28" height="22" rx="3.5" fill="white" />
      <rect x="14" y="20" width="20" height="6" rx="1.5" fill="#4F46E5" opacity="0.15" />
      <rect x="14" y="28" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5" />
      <rect x="21.5" y="28" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5" />
      <rect x="29" y="28" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5" />
      <rect x="29" y="33" width="5" height="3" rx="1" fill="#10B981" />
    </svg>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const [user, setUser] = useState<ReturnType<typeof getSession>>(null);
  const [step, setStep] = useState<Step>(1);

  // Étape 2 — import IA
  const [dragOver, setDragOver] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importErr, setImportErr] = useState("");
  const [importedProducts, setImportedProducts] = useState<ImportedProduct[]>([]);
  const [savedCount, setSavedCount] = useState(0);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/caissio/login"); return; }
    if (s.onboarding_done) { router.replace("/caissio/app/pos"); return; }
    setUser(s);
  }, [router]);

  /* ── Lire le fichier ── */
  const readFile = (file: File): Promise<string> => new Promise((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(reader.result as string);
    reader.onerror = () => rej(new Error("Impossible de lire le fichier"));
    if (file.type === "application/pdf") {
      // PDF: on envoie le binaire en base64
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file, "utf-8");
    }
  });

  /* ── Parse CSV simple côté client (sans IA) ── */
  const parseCsv = (text: string): ImportedProduct[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2) return [];
    const header = lines[0].split(/[;,\t]/).map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));
    const colIdx = (names: string[]) => names.map((n) => header.indexOf(n)).find((i) => i >= 0) ?? -1;
    const nameIdx = colIdx(["nom","name","article","libelle","désignation","designation","produit"]);
    const priceIdx = colIdx(["prix","price","tarif","prix_vente","pvente","p.v.","p.v","pu"]);
    const catIdx = colIdx(["categorie","catégorie","category","famille","rayon"]);
    const stockIdx = colIdx(["stock","quantite","quantité","qty","qte"]);
    const barcodeIdx = colIdx(["barcode","code_barre","code-barre","ean","gtin","ref","reference","référence"]);
    if (nameIdx < 0) return [];

    return lines.slice(1).map((line, i) => {
      const cols = line.split(/[;,\t]/).map((c) => c.trim().replace(/^["']|["']$/g, ""));
      const name = cols[nameIdx] || "";
      if (!name) return null;
      const price = priceIdx >= 0 ? parseFloat(cols[priceIdx]?.replace(",", ".") || "0") : 0;
      return {
        _key: `csv_${i}`,
        name,
        price: isNaN(price) ? 0 : price,
        category: (catIdx >= 0 && cols[catIdx]) ? cols[catIdx] : "Import",
        stock: stockIdx >= 0 ? parseInt(cols[stockIdx]) || 0 : 0,
        stock_min: 5,
        tva: 20,
        active: true,
        barcode: barcodeIdx >= 0 ? cols[barcodeIdx] || undefined : undefined,
      } as ImportedProduct;
    }).filter(Boolean) as ImportedProduct[];
  };

  /* ── Import via IA ── */
  const importWithAI = useCallback(async (content: string, filename: string) => {
    setImporting(true);
    setImportErr("");
    try {
      const res = await fetch("/api/caissio/import-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur serveur");
      const products: ImportedProduct[] = (data.products || []).map((p: Partial<ImportedProduct>, i: number) => ({
        _key: `ai_${i}`,
        name: p.name || "Article",
        price: typeof p.price === "number" ? p.price : 0,
        category: p.category || "Import",
        stock: typeof p.stock === "number" ? p.stock : 0,
        stock_min: 5,
        tva: typeof p.tva === "number" ? p.tva : 20,
        active: true,
        barcode: p.barcode,
        image_url: p.image_url,
      }));
      setImportedProducts(products);
    } catch (e) {
      setImportErr(e instanceof Error ? e.message : "Erreur d'import");
    } finally {
      setImporting(false);
    }
  }, []);

  /* ── Gérer le drop / sélection de fichier ── */
  const handleFile = useCallback(async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    setImportedProducts([]);
    setImportErr("");

    if (ext === "csv" || (file.type.includes("text") && (ext === "txt" || ext === "csv"))) {
      const text = await readFile(file);
      const parsed = parseCsv(text);
      if (parsed.length > 0) {
        setImportedProducts(parsed);
        return;
      }
      // CSV incompréhensible → on envoie à l'IA
      await importWithAI(text, file.name);
      return;
    }

    // Tout le reste (PDF, Excel texte, image description) → IA
    const content = await readFile(file);
    await importWithAI(content.slice(0, 30000), file.name); // max 30k chars
  }, [importWithAI]);

  /* ── Sauvegarder les produits importés ── */
  const saveImported = () => {
    let count = 0;
    importedProducts.forEach((p) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { _key, ...rest } = p;
      saveProduct(rest);
      count++;
    });
    setSavedCount(count);
    setImportedProducts([]);
  };

  const removeImported = (key: string) => setImportedProducts((p) => p.filter((x) => x._key !== key));

  /* ── Fin d'onboarding ── */
  const finish = (mode: "test" | "live") => {
    if (mode === "live") switchToLive();
    markOnboardingDone();
    router.push("/caissio/app/pos");
  };

  if (!user) return null;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg,#f8fafc 0%,#ede9fe 100%)", fontFamily: "'IBM Plex Sans',sans-serif", display: "flex", flexDirection: "column" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>

      {/* Header */}
      <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CaissioMark size={32} />
          <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 18, color: "#0f172a" }}>Caissio</span>
        </div>
        {/* Étapes */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${step >= s ? "#4f46e5" : "#e2e8f0"}`, background: step > s ? "#4f46e5" : step === s ? "#ede9fe" : "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: step >= s ? (step > s ? "#fff" : "#4f46e5") : "#94a3b8", transition: "all .3s" }}>
                {step > s ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : s}
              </div>
              {s < 3 && <div style={{ width: 32, height: 2, background: step > s ? "#4f46e5" : "#e2e8f0", transition: "background .3s" }} />}
            </div>
          ))}
        </div>
        <div style={{ width: 120 }} />
      </div>

      {/* Contenu principal */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px 24px" }}>

        {/* ══ ÉTAPE 1 : Mode Test ou Live ══ */}
        {step === 1 && (
          <div style={{ maxWidth: 640, width: "100%", animation: "fadeUp .4s ease-out" }}>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>👋</div>
              <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 32, fontWeight: 900, color: "#0f172a", marginBottom: 10 }}>
                Bienvenue, {user.name.split(" ")[0]} !
              </h1>
              <p style={{ fontSize: 16, color: "#475569", lineHeight: 1.7 }}>
                Votre caisse <strong>{user.store_name}</strong> est prête.<br />
                Comment voulez-vous commencer ?
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
              {/* Mode Test */}
              <button onClick={() => setStep(2)}
                style={{ background: "#fff", border: "2px solid #e2e8f0", borderRadius: 20, padding: 24, cursor: "pointer", textAlign: "left", transition: "all .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#4f46e5"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(79,70,229,.12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#ede9fe", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <FlaskConical style={{ width: 24, height: 24, color: "#4f46e5" }} />
                </div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Mode Test</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 12 }}>
                  Explorez Caissio librement. Vos ventes de test sont séparées de la réalité. Passez en Mode Live quand vous êtes prêt.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {["Badge TEST visible partout", "Données test réinitialisables", "Catalogue demo inclus"].map((t) => (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#4f46e5", fontWeight: 600 }}>
                      <CheckCircle2 style={{ width: 12, height: 12 }} /> {t}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 16px", borderRadius: 10, background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 13 }}>
                  Commencer en test <ArrowRight style={{ width: 14, height: 14 }} />
                </div>
              </button>

              {/* Mode Live */}
              <button onClick={() => { switchToLive(); setStep(2); }}
                style={{ background: "#fff", border: "2px solid #e2e8f0", borderRadius: 20, padding: 24, cursor: "pointer", textAlign: "left", transition: "all .15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#10b981"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(16,185,129,.12)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.boxShadow = "none"; }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: "#d1fae5", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  <Zap style={{ width: 24, height: 24, color: "#059669" }} />
                </div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>Mode Live</div>
                <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 12 }}>
                  Démarrez directement en production. Vos ventes comptent pour vos rapports réels dès maintenant.
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {["Données réelles immédiatement", "Rapports et stats actifs", "Recommandé si déjà formé"].map((t) => (
                    <div key={t} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#059669", fontWeight: 600 }}>
                      <CheckCircle2 style={{ width: 12, height: 12 }} /> {t}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 16px", borderRadius: 10, background: "#059669", color: "#fff", fontWeight: 700, fontSize: 13 }}>
                  Passer en live <Zap style={{ width: 14, height: 14 }} />
                </div>
              </button>
            </div>

            <div style={{ textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
              Vous pourrez changer de mode à tout moment dans Paramètres.
            </div>
          </div>
        )}

        {/* ══ ÉTAPE 2 : Import catalogue ══ */}
        {step === 2 && (
          <div style={{ maxWidth: 680, width: "100%", animation: "fadeUp .4s ease-out" }}>
            <div style={{ textAlign: "center", marginBottom: 32 }}>
              <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 900, color: "#0f172a", marginBottom: 8 }}>
                Importez votre catalogue
              </h2>
              <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7 }}>
                Glissez vos fichiers ici — l&apos;IA comprend CSV, PDF, factures fournisseurs, ou même une photo de liste.
                Elle extrait automatiquement le nom, le prix, la catégorie et le stock.
              </p>
            </div>

            {/* Zone de drop */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              style={{
                border: `2px dashed ${dragOver ? "#4f46e5" : "#c4b5fd"}`,
                borderRadius: 20,
                padding: 40,
                textAlign: "center",
                background: dragOver ? "#ede9fe" : "#faf8ff",
                transition: "all .2s",
                marginBottom: 20,
                cursor: "pointer",
              }}
              onClick={() => document.getElementById("file-input")?.click()}
            >
              <input id="file-input" type="file" accept=".csv,.txt,.pdf,.xlsx,.xls" style={{ display: "none" }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ""; }} />
              {importing ? (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                  <Loader2 style={{ width: 40, height: 40, color: "#4f46e5", animation: "spin 1s linear infinite" }} />
                  <div style={{ fontSize: 15, fontWeight: 600, color: "#4f46e5" }}>L&apos;IA analyse votre fichier…</div>
                  <div style={{ fontSize: 12, color: "#94a3b8" }}>Extraction des articles, prix et catégories</div>
                </div>
              ) : (
                <>
                  <Upload style={{ width: 40, height: 40, color: "#a5b4fc", marginBottom: 12 }} />
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Glissez votre fichier ici</div>
                  <div style={{ fontSize: 13, color: "#64748b", marginBottom: 12 }}>CSV, PDF, Excel, factures fournisseur…</div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, height: 36, padding: "0 16px", borderRadius: 10, background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 13 }}>
                    <Upload style={{ width: 13, height: 13 }} /> Choisir un fichier
                  </div>
                </>
              )}
            </div>

            {importErr && (
              <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#dc2626", fontWeight: 600, marginBottom: 16 }}>
                ⚠ {importErr}
              </div>
            )}

            {/* Résultats import */}
            {importedProducts.length > 0 && (
              <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, overflow: "hidden", marginBottom: 16 }}>
                <div style={{ padding: "14px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 16, fontWeight: 800, color: "#0f172a" }}>
                    <Sparkles style={{ width: 16, height: 16, color: "#4f46e5", display: "inline", marginRight: 6 }} />
                    {importedProducts.length} articles détectés
                  </div>
                  <button onClick={saveImported} style={{ height: 36, padding: "0 16px", borderRadius: 10, background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer" }}>
                    ✓ Tout importer
                  </button>
                </div>
                <div style={{ maxHeight: 260, overflowY: "auto" }}>
                  {importedProducts.slice(0, 50).map((p) => (
                    <div key={p._key} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", borderBottom: "1px solid #f8fafc" }}>
                      <Package style={{ width: 14, height: 14, color: "#94a3b8", flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>{p.category} · TVA {p.tva}%</div>
                      </div>
                      <div style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#4f46e5", flexShrink: 0 }}>
                        {p.price > 0 ? `${p.price.toFixed(2)} €` : <span style={{ color: "#f59e0b" }}>Prix ?</span>}
                      </div>
                      <button onClick={() => removeImported(p._key)} style={{ width: 28, height: 28, borderRadius: 7, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Trash2 style={{ width: 12, height: 12, color: "#94a3b8" }} />
                      </button>
                    </div>
                  ))}
                  {importedProducts.length > 50 && (
                    <div style={{ padding: "10px 20px", fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
                      + {importedProducts.length - 50} articles supplémentaires seront aussi importés.
                    </div>
                  )}
                </div>
              </div>
            )}

            {savedCount > 0 && (
              <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#059669", fontWeight: 700, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <CheckCircle2 style={{ width: 16, height: 16 }} /> {savedCount} articles importés avec succès !
              </div>
            )}

            {/* Options catalogue */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
              <button onClick={() => { seedDemoCatalog(); seedDemoSales(); setSavedCount(60); }}
                style={{ padding: "14px 16px", borderRadius: 14, border: "1px solid #c4b5fd", background: "#faf8ff", cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>🛒</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>Catalogue de démo</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>60 articles (épicerie, boulangerie, boissons…) pour explorer</div>
              </button>
              <button onClick={() => setStep(3)}
                style={{ padding: "14px 16px", borderRadius: 14, border: "1px solid #e2e8f0", background: "#f8fafc", cursor: "pointer", textAlign: "left" }}>
                <div style={{ fontSize: 20, marginBottom: 6 }}>⏭</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>Passer cette étape</div>
                <div style={{ fontSize: 11, color: "#64748b" }}>Ajoutez vos articles plus tard depuis Produits</div>
              </button>
            </div>

            <button onClick={() => setStep(3)} disabled={importing}
              style={{ width: "100%", height: 52, borderRadius: 14, background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 16, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, opacity: importing ? 0.5 : 1 }}>
              Continuer <ArrowRight style={{ width: 18, height: 18 }} />
            </button>
          </div>
        )}

        {/* ══ ÉTAPE 3 : Prêt ! ══ */}
        {step === 3 && (
          <div style={{ maxWidth: 560, width: "100%", textAlign: "center", animation: "fadeUp .4s ease-out" }}>
            <div style={{ fontSize: 72, marginBottom: 16 }}>🚀</div>
            <h2 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 32, fontWeight: 900, color: "#0f172a", marginBottom: 12 }}>
              {user.store_name} est prêt !
            </h2>
            <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.8, marginBottom: 32, maxWidth: 440, margin: "0 auto 32px" }}>
              Votre caisse est configurée. Vous démarrez en <strong style={{ color: getSession()?.mode === "live" ? "#059669" : "#4f46e5" }}>
                mode {getSession()?.mode === "live" ? "Live" : "Test"}
              </strong>.
              {getSession()?.mode === "test" && " Quand vous serez prêt, passez en mode Live dans Paramètres."}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 32 }}>
              {[
                { emoji: "📦", label: "Produits", href: "/caissio/app/produits" },
                { emoji: "🖨️", label: "Périphériques", href: "/caissio/app/peripheriques" },
                { emoji: "⚙️", label: "Paramètres", href: "/caissio/app/parametres" },
              ].map((item) => (
                <a key={item.label} href={item.href}
                  style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 12px", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ fontSize: 28 }}>{item.emoji}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{item.label}</div>
                </a>
              ))}
            </div>

            <button onClick={() => finish(getSession()?.mode ?? "test")}
              style={{ width: "100%", height: 56, borderRadius: 16, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontWeight: 700, fontSize: 18, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, boxShadow: "0 8px 24px rgba(79,70,229,.35)" }}>
              Ouvrir la caisse <ArrowRight style={{ width: 20, height: 20 }} />
            </button>
            <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>Vous pouvez toujours revenir à cet écran via Aide.</div>
          </div>
        )}
      </div>
    </div>
  );
}
