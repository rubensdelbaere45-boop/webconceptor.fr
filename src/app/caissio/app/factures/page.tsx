"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FileText, Plus, Printer, Eye, Trash2, X,
  CheckCircle2, Clock, ArrowLeft, AlertCircle,
} from "lucide-react";
import {
  getSession,
  getInvoices,
  saveInvoice as storeInvoice,
  updateInvoice,
  deleteInvoice,
  getNextInvoiceNumber,
  getSales,
  getCustomers,
  getProducts,
  getStoreSettings,
  type Invoice,
  type InvoiceLine,
  type TvaBreakdown,
  type Sale,
  type Customer,
  type StoreSettings,
  type CaissioUser,
} from "@/lib/caissio-store";

/* ─── Helpers ─────────────────────────────────────────── */

const fmt = (n: number) =>
  n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString("fr-FR");

const PAYMENT_LABELS: Record<string, string> = {
  cash: "Espèces",
  card: "Carte bancaire",
  mixed: "Mixte (espèces + carte)",
  account: "Compte client",
};

function buildLines(
  sale: Sale,
  products: ReturnType<typeof getProducts>
): InvoiceLine[] {
  const productMap = new Map(products.map((p) => [p.id, p]));
  // ratio pour appliquer la remise proportionnellement sur chaque ligne
  const ratio = sale.subtotal > 0 ? sale.total / sale.subtotal : 1;

  return sale.items.map((item) => {
    const product = productMap.get(item.product_id);
    const tvaRate = product?.tva ?? 20;
    const totalTtc = +(item.price * item.qty * ratio).toFixed(4);
    const totalHt = +(totalTtc / (1 + tvaRate / 100)).toFixed(4);
    const tvaAmount = +(totalTtc - totalHt).toFixed(4);
    const unitPriceHt = item.qty > 0 ? totalHt / item.qty : 0;
    return {
      description: item.name,
      qty: item.qty,
      unit_price_ht: unitPriceHt,
      tva_rate: tvaRate,
      total_ht: totalHt,
      tva_amount: tvaAmount,
      total_ttc: totalTtc,
    };
  });
}

function buildTvaBreakdown(lines: InvoiceLine[]): TvaBreakdown[] {
  const map = new Map<number, { base_ht: number; tva_amount: number }>();
  lines.forEach((line) => {
    const ex = map.get(line.tva_rate) ?? { base_ht: 0, tva_amount: 0 };
    map.set(line.tva_rate, {
      base_ht: ex.base_ht + line.total_ht,
      tva_amount: ex.tva_amount + line.tva_amount,
    });
  });
  return Array.from(map.entries())
    .map(([rate, d]) => ({ rate, ...d }))
    .sort((a, b) => a.rate - b.rate);
}

/* ─── HTML de la facture pour impression ──────────────── */

function generateInvoiceHtml(inv: Invoice): string {
  const vatMention = inv.seller_vat_number
    ? `N° TVA intracommunautaire : ${inv.seller_vat_number}`
    : `TVA non applicable, art. 293 B du CGI`;

  const statusLabel =
    inv.status === "paid" ? "PAYÉE" : inv.status === "sent" ? "ENVOYÉE" : "BROUILLON";
  const statusColor =
    inv.status === "paid"
      ? "background:#dcfce7;color:#166534"
      : inv.status === "sent"
      ? "background:#eff6ff;color:#1d4ed8"
      : "background:#f1f5f9;color:#64748b";

  const linesHtml = inv.lines
    .map(
      (l) => `
      <tr>
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9">${l.description}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;text-align:center">${l.qty}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;text-align:right">${fmt(l.unit_price_ht)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;text-align:center">${l.tva_rate}%</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;text-align:right">${fmt(l.total_ht)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;text-align:right">${fmt(l.tva_amount)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid #f1f5f9;text-align:right;font-weight:600">${fmt(l.total_ttc)}</td>
      </tr>`
    )
    .join("");

  const tvaHtml = inv.tva_breakdown
    .map(
      (t) => `
      <tr>
        <td style="padding:6px 10px">${fmt(t.base_ht)}</td>
        <td style="padding:6px 10px;text-align:center">${t.rate}%</td>
        <td style="padding:6px 10px;text-align:right">${fmt(t.tva_amount)}</td>
      </tr>`
    )
    .join("");

  const tvaRows = inv.tva_breakdown
    .map(
      (t) =>
        `<tr><td style="padding:4px 10px;color:#64748b;font-size:9pt">TVA ${t.rate}%</td><td style="padding:4px 10px;text-align:right;color:#64748b;font-size:9pt">${fmt(t.tva_amount)}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<title>Facture ${inv.number}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Helvetica Neue',Arial,sans-serif;font-size:10.5pt;color:#1e293b;background:#fff;padding:18mm 16mm}
table{width:100%;border-collapse:collapse}
@media print{body{padding:8mm}@page{margin:8mm;size:A4 portrait}}
</style>
</head>
<body>

<!-- EN-TÊTE -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #4f46e5;margin-bottom:24px">
  <div>
    <div style="font-size:20pt;font-weight:900;color:#4f46e5;letter-spacing:-0.5px">${inv.seller_name}</div>
    <div style="font-size:9.5pt;color:#475569;margin-top:6px;line-height:1.7">
      ${inv.seller_address ? inv.seller_address.replace(/\n/g, "<br>") + "<br>" : ""}
      ${inv.seller_siret ? `SIRET : ${inv.seller_siret}<br>` : ""}
      ${vatMention}<br>
      ${inv.seller_phone ? `Tél : ${inv.seller_phone}<br>` : ""}
      ${inv.seller_email ? inv.seller_email : ""}
    </div>
  </div>
  <div style="text-align:right">
    <div style="font-size:26pt;font-weight:900;color:#0f172a;letter-spacing:-1px">FACTURE</div>
    <div style="font-size:13pt;font-weight:700;color:#4f46e5;margin-top:4px">${inv.number}</div>
    <div style="font-size:9.5pt;color:#64748b;margin-top:4px">Émise le ${fmtDate(inv.date)}</div>
    ${inv.due_date ? `<div style="font-size:9.5pt;color:#64748b">Échéance : ${fmtDate(inv.due_date)}</div>` : ""}
    <div style="margin-top:8px;display:inline-block;padding:3px 10px;border-radius:12px;font-size:9pt;font-weight:700;${statusColor}">${statusLabel}</div>
  </div>
</div>

<!-- ÉMETTEUR / CLIENT -->
<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:28px">
  <div>
    <div style="font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;margin-bottom:6px">Émetteur</div>
    <div style="font-size:11pt;font-weight:700;color:#0f172a">${inv.seller_name}</div>
  </div>
  <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 16px">
    <div style="font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:0.15em;color:#94a3b8;margin-bottom:6px">Facturé à</div>
    <div style="font-size:11pt;font-weight:700;color:#0f172a">${inv.customer_name}</div>
    <div style="font-size:9.5pt;color:#475569;margin-top:4px;line-height:1.7">
      ${inv.customer_address ? inv.customer_address.replace(/\n/g, "<br>") + "<br>" : ""}
      ${inv.customer_email ? inv.customer_email + "<br>" : ""}
      ${inv.customer_phone ? inv.customer_phone : ""}
    </div>
  </div>
</div>

<!-- LIGNES -->
<table style="margin-bottom:20px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
  <thead>
    <tr style="background:#f1f5f9">
      <th style="padding:9px 10px;text-align:left;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;width:38%">Désignation</th>
      <th style="padding:9px 10px;text-align:center;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;width:7%">Qté</th>
      <th style="padding:9px 10px;text-align:right;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;width:13%">PU HT</th>
      <th style="padding:9px 10px;text-align:center;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;width:8%">TVA</th>
      <th style="padding:9px 10px;text-align:right;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;width:13%">Montant HT</th>
      <th style="padding:9px 10px;text-align:right;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;width:10%">TVA</th>
      <th style="padding:9px 10px;text-align:right;font-size:8.5pt;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#64748b;width:13%">Total TTC</th>
    </tr>
  </thead>
  <tbody>${linesHtml}</tbody>
</table>

<!-- TVA + TOTAUX -->
<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;gap:24px">
  <div style="flex:1">
    <div style="font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#94a3b8;margin-bottom:8px">Récapitulatif TVA</div>
    <table style="width:auto;min-width:260px;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      <thead>
        <tr style="background:#f1f5f9">
          <th style="padding:7px 10px;text-align:left;font-size:8pt;font-weight:700;text-transform:uppercase;color:#64748b">Base HT</th>
          <th style="padding:7px 10px;text-align:center;font-size:8pt;font-weight:700;text-transform:uppercase;color:#64748b">Taux</th>
          <th style="padding:7px 10px;text-align:right;font-size:8pt;font-weight:700;text-transform:uppercase;color:#64748b">Montant TVA</th>
        </tr>
      </thead>
      <tbody>${tvaHtml}</tbody>
    </table>
  </div>
  <div style="width:280px">
    <table style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
      <tr><td style="padding:7px 14px;font-size:10pt">Total HT</td><td style="padding:7px 14px;text-align:right;font-size:10pt">${fmt(inv.total_ht)}</td></tr>
      ${tvaRows}
      <tr style="background:#4f46e5">
        <td style="padding:11px 14px;font-size:12pt;font-weight:900;color:#fff">TOTAL TTC</td>
        <td style="padding:11px 14px;text-align:right;font-size:12pt;font-weight:900;color:#fff">${fmt(inv.total_ttc)}</td>
      </tr>
    </table>
  </div>
</div>

<!-- PAIEMENT -->
${
  inv.payment_method
    ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:16px">
    <div style="font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#94a3b8;margin-bottom:4px">Mode de paiement</div>
    <div style="font-size:11pt;font-weight:600;color:#0f172a">${inv.payment_method}</div>
  </div>`
    : ""
}

<!-- NOTES -->
${
  inv.notes
    ? `<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;margin-bottom:16px">
    <div style="font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#94a3b8;margin-bottom:4px">Notes</div>
    <div style="font-size:10pt;color:#374151">${inv.notes.replace(/\n/g, "<br>")}</div>
  </div>`
    : ""
}

<!-- MENTIONS LÉGALES -->
<div style="border-top:1px solid #e2e8f0;padding-top:16px;margin-top:4px">
  <div style="font-size:8pt;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#94a3b8;margin-bottom:8px">Conditions &amp; mentions légales</div>
  <p style="font-size:8.5pt;color:#64748b;line-height:1.65;margin-bottom:5px">
    <strong style="color:#475569">Conditions de paiement :</strong> Paiement à réception de facture.
  </p>
  <p style="font-size:8.5pt;color:#64748b;line-height:1.65;margin-bottom:5px">
    <strong style="color:#475569">Pénalités de retard :</strong> Tout retard de paiement entraîne, de plein droit et sans mise en demeure préalable, l'application de pénalités de retard calculées au taux de 3 fois le taux d'intérêt légal en vigueur (art. L. 441-10 du Code de commerce).
  </p>
  <p style="font-size:8.5pt;color:#64748b;line-height:1.65;margin-bottom:5px">
    <strong style="color:#475569">Indemnité forfaitaire de recouvrement :</strong> 40 € (art. D. 441-5 du Code de commerce).
  </p>
  <p style="font-size:8.5pt;color:#64748b;line-height:1.65;margin-bottom:5px">
    <strong style="color:#475569">Escompte :</strong> Aucun escompte accordé pour paiement anticipé.
  </p>
  ${
    !inv.seller_vat_number
      ? `<p style="font-size:8.5pt;color:#64748b;line-height:1.65">
    <strong style="color:#475569">Franchise en base de TVA :</strong> TVA non applicable, article 293 B du CGI.
  </p>`
      : ""
  }
</div>

<!-- PIED DE PAGE -->
<div style="border-top:1px solid #e2e8f0;padding-top:12px;margin-top:20px;font-size:8pt;color:#94a3b8;text-align:center">
  ${inv.seller_name}${inv.seller_siret ? ` — SIRET : ${inv.seller_siret}` : ""}${inv.seller_vat_number ? ` — N° TVA : ${inv.seller_vat_number}` : ""}
  &nbsp;·&nbsp; Facture générée avec Caissio
</div>

</body>
</html>`;
}

/* ─── Page principale ─────────────────────────────────── */

type ViewMode = "list" | "create" | "detail";
type CreateStep = "select-sale" | "customer";

export default function FacturesPage() {
  const router = useRouter();
  const [user, setUser] = useState<CaissioUser | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<ReturnType<typeof getProducts>>([]);
  const [settings, setSettings] = useState<StoreSettings | null>(null);

  const [view, setView] = useState<ViewMode>("list");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Create flow
  const [createStep, setCreateStep] = useState<CreateStep>("select-sale");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [invoiceNotes, setInvoiceNotes] = useState("");
  const [invoiceDueDate, setInvoiceDueDate] = useState("");

  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showToast = useCallback((type: "success" | "error", msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }, []);

  const reload = useCallback(() => {
    setInvoices(getInvoices().sort((a, b) => b.created_at.localeCompare(a.created_at)));
    setSales(getSales().sort((a, b) => b.created_at.localeCompare(a.created_at)));
    setCustomers(getCustomers());
    setProducts(getProducts());
    setSettings(getStoreSettings());
  }, []);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/caissio/login"); return; }
    setUser(s);
    reload();
  }, [router, reload]);

  /* ── Sales already having an invoice ── */
  const invoicedSaleIds = new Set(invoices.map((inv) => inv.sale_id).filter(Boolean));

  /* ── Open a sale in create flow ── */
  const handleSelectSale = (sale: Sale) => {
    setSelectedSale(sale);
    // Pre-fill customer info from linked customer
    if (sale.customer_id) {
      const cust = customers.find((c) => c.id === sale.customer_id);
      if (cust) {
        setCustomerName(cust.name);
        setCustomerEmail(cust.email || "");
        setCustomerPhone(cust.phone || "");
        setCustomerAddress("");
      }
    } else {
      setCustomerName("");
      setCustomerAddress("");
      setCustomerEmail("");
      setCustomerPhone("");
    }
    setInvoiceNotes("");
    setInvoiceDueDate("");
    setCreateStep("customer");
  };

  /* ── Generate invoice ── */
  const handleGenerateInvoice = () => {
    if (!selectedSale || !settings || !customerName.trim()) return;

    const lines = buildLines(selectedSale, products);
    const tvaBreakdown = buildTvaBreakdown(lines);

    const totalHt = lines.reduce((s, l) => s + l.total_ht, 0);
    const totalTva = lines.reduce((s, l) => s + l.tva_amount, 0);
    const totalTtc = lines.reduce((s, l) => s + l.total_ttc, 0);

    const paymentLabel =
      PAYMENT_LABELS[selectedSale.payment] || selectedSale.payment;

    const inv = storeInvoice({
      number: getNextInvoiceNumber(),
      date: new Date().toISOString(),
      due_date: invoiceDueDate || undefined,
      sale_id: selectedSale.id,
      seller_name: settings.name,
      seller_address: settings.address,
      seller_siret: settings.siret,
      seller_vat_number: settings.vat_number,
      seller_email: settings.email,
      seller_phone: settings.phone,
      customer_id: selectedSale.customer_id,
      customer_name: customerName.trim(),
      customer_address: customerAddress.trim() || undefined,
      customer_email: customerEmail.trim() || undefined,
      customer_phone: customerPhone.trim() || undefined,
      lines,
      total_ht: totalHt,
      total_tva: totalTva,
      total_ttc: totalTtc,
      tva_breakdown: tvaBreakdown,
      payment_method: paymentLabel,
      notes: invoiceNotes.trim() || undefined,
      status: "draft",
    });

    reload();
    setSelectedInvoice(inv);
    setView("detail");
    showToast("success", `Facture ${inv.number} générée`);
  };

  /* ── Print invoice ── */
  const handlePrint = (inv: Invoice) => {
    const html = generateInvoiceHtml(inv);
    const win = window.open("", "_blank");
    if (!win) { showToast("error", "Autorisez les pop-ups pour imprimer"); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
  };

  /* ── Delete invoice ── */
  const handleDelete = (id: string) => {
    if (!confirm("Supprimer cette facture ?")) return;
    deleteInvoice(id);
    reload();
    if (selectedInvoice?.id === id) { setSelectedInvoice(null); setView("list"); }
    showToast("success", "Facture supprimée");
  };

  /* ── Toggle status ── */
  const handleMarkPaid = (inv: Invoice) => {
    const newStatus = inv.status === "paid" ? "sent" : "paid";
    updateInvoice(inv.id, { status: newStatus });
    const updated = { ...inv, status: newStatus as Invoice["status"] };
    setSelectedInvoice(updated);
    reload();
  };

  if (!user) return null;

  const s = {
    fontFamily: "'IBM Plex Sans',sans-serif",
    padding: "28px 24px",
    maxWidth: 1020,
    position: "relative" as const,
  };

  /* ─── STATUS BADGE ─── */
  const StatusBadge = ({ status }: { status: Invoice["status"] }) => {
    const cfg = {
      paid:  { bg: "#dcfce7", color: "#166534", border: "#86efac", label: "Payée" },
      sent:  { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe", label: "Envoyée" },
      draft: { bg: "#f1f5f9", color: "#64748b", border: "#e2e8f0", label: "Brouillon" },
    }[status];
    return (
      <span style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 11, fontWeight: 700, padding: "2px 9px", borderRadius: 20 }}>
        {cfg.label}
      </span>
    );
  };

  /* ─── INVOICE VIEWER (in-page) ─── */
  const InvoiceViewer = ({ inv }: { inv: Invoice }) => {
    const vatMention = inv.seller_vat_number
      ? `N° TVA : ${inv.seller_vat_number}`
      : "TVA non applicable, art. 293 B du CGI";

    return (
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 32, fontFamily: "'IBM Plex Sans',sans-serif" }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');`}</style>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "3px solid #4f46e5", paddingBottom: 20, marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 900, color: "#4f46e5" }}>{inv.seller_name}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 6, lineHeight: 1.7 }}>
              {inv.seller_address && <>{inv.seller_address.split("\n").map((l, i) => <span key={i}>{l}<br /></span>)}</>}
              {inv.seller_siret && <><strong>SIRET :</strong> {inv.seller_siret}<br /></>}
              {vatMention}<br />
              {inv.seller_phone && <>Tél : {inv.seller_phone}<br /></>}
              {inv.seller_email}
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 900, color: "#0f172a", letterSpacing: "-1px" }}>FACTURE</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#4f46e5", marginTop: 4 }}>{inv.number}</div>
            <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>Émise le {fmtDate(inv.date)}</div>
            {inv.due_date && <div style={{ fontSize: 12, color: "#64748b" }}>Échéance : {fmtDate(inv.due_date)}</div>}
            <div style={{ marginTop: 8 }}><StatusBadge status={inv.status} /></div>
          </div>
        </div>

        {/* Parties */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 4 }}>Émetteur</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{inv.seller_name}</div>
          </div>
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 4 }}>Facturé à</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{inv.customer_name}</div>
            <div style={{ fontSize: 12, color: "#475569", marginTop: 4, lineHeight: 1.7 }}>
              {inv.customer_address && <>{inv.customer_address.split("\n").map((l, i) => <span key={i}>{l}<br /></span>)}</>}
              {inv.customer_email && <>{inv.customer_email}<br /></>}
              {inv.customer_phone}
            </div>
          </div>
        </div>

        {/* Lines table */}
        <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflow: "hidden", marginBottom: 20 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f1f5f9" }}>
                {["Désignation", "Qté", "PU HT", "TVA", "Montant HT", "TVA €", "Total TTC"].map((h, i) => (
                  <th key={h} style={{ padding: "9px 10px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.07em", color: "#64748b", textAlign: i > 0 ? "right" : "left", whiteSpace: "nowrap" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {inv.lines.map((line, i) => (
                <tr key={i}>
                  <td style={{ padding: "9px 10px", fontSize: 13, borderBottom: "1px solid #f1f5f9" }}>{line.description}</td>
                  <td style={{ padding: "9px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{line.qty}</td>
                  <td style={{ padding: "9px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{fmt(line.unit_price_ht)}</td>
                  <td style={{ padding: "9px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f1f5f9" }}>{line.tva_rate}%</td>
                  <td style={{ padding: "9px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{fmt(line.total_ht)}</td>
                  <td style={{ padding: "9px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f1f5f9", whiteSpace: "nowrap" }}>{fmt(line.tva_amount)}</td>
                  <td style={{ padding: "9px 10px", fontSize: 13, textAlign: "right", borderBottom: "1px solid #f1f5f9", fontWeight: 700, whiteSpace: "nowrap" }}>{fmt(line.total_ttc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* TVA + Totals */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 8 }}>Récapitulatif TVA</div>
            <table style={{ borderCollapse: "collapse", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
              <thead>
                <tr style={{ background: "#f1f5f9" }}>
                  <th style={{ padding: "7px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#64748b", textAlign: "left" }}>Base HT</th>
                  <th style={{ padding: "7px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#64748b", textAlign: "center" }}>Taux</th>
                  <th style={{ padding: "7px 12px", fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#64748b", textAlign: "right" }}>Montant TVA</th>
                </tr>
              </thead>
              <tbody>
                {inv.tva_breakdown.map((t) => (
                  <tr key={t.rate}>
                    <td style={{ padding: "7px 12px", fontSize: 12 }}>{fmt(t.base_ht)}</td>
                    <td style={{ padding: "7px 12px", fontSize: 12, textAlign: "center" }}>{t.rate}%</td>
                    <td style={{ padding: "7px 12px", fontSize: 12, textAlign: "right" }}>{fmt(t.tva_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ minWidth: 240 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e2e8f0", borderRadius: 8, overflow: "hidden" }}>
              <tbody>
                <tr>
                  <td style={{ padding: "8px 14px", fontSize: 13 }}>Total HT</td>
                  <td style={{ padding: "8px 14px", fontSize: 13, textAlign: "right", fontWeight: 600 }}>{fmt(inv.total_ht)}</td>
                </tr>
                {inv.tva_breakdown.map((t) => (
                  <tr key={t.rate}>
                    <td style={{ padding: "6px 14px", fontSize: 12, color: "#64748b" }}>TVA {t.rate}%</td>
                    <td style={{ padding: "6px 14px", fontSize: 12, color: "#64748b", textAlign: "right" }}>{fmt(t.tva_amount)}</td>
                  </tr>
                ))}
                <tr style={{ background: "#4f46e5" }}>
                  <td style={{ padding: "11px 14px", fontSize: 14, fontWeight: 900, color: "#fff" }}>TOTAL TTC</td>
                  <td style={{ padding: "11px 14px", fontSize: 14, fontWeight: 900, color: "#fff", textAlign: "right" }}>{fmt(inv.total_ttc)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment */}
        {inv.payment_method && (
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 4 }}>Mode de paiement</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{inv.payment_method}</div>
          </div>
        )}

        {inv.notes && (
          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "12px 16px", marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 4 }}>Notes</div>
            <div style={{ fontSize: 13, color: "#374151", whiteSpace: "pre-wrap" }}>{inv.notes}</div>
          </div>
        )}

        {/* Legal */}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 16, marginTop: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 8 }}>Conditions &amp; mentions légales</div>
          {[
            ["Conditions de paiement", "Paiement à réception de facture."],
            ["Pénalités de retard", "Tout retard de paiement entraîne, de plein droit et sans mise en demeure préalable, l'application de pénalités de retard calculées au taux de 3 fois le taux d'intérêt légal en vigueur (art. L. 441-10 du Code de commerce)."],
            ["Indemnité forfaitaire de recouvrement", "40 € (art. D. 441-5 du Code de commerce)."],
            ["Escompte", "Aucun escompte accordé pour paiement anticipé."],
            ...(!inv.seller_vat_number ? [["Franchise en base de TVA", "TVA non applicable, article 293 B du CGI."]] : []),
          ].map(([label, text]) => (
            <p key={label} style={{ fontSize: 11, color: "#64748b", lineHeight: 1.65, marginBottom: 5 }}>
              <strong style={{ color: "#475569" }}>{label} : </strong>{text}
            </p>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 12, marginTop: 20, fontSize: 11, color: "#94a3b8", textAlign: "center" }}>
          {inv.seller_name}{inv.seller_siret ? ` — SIRET : ${inv.seller_siret}` : ""}{inv.seller_vat_number ? ` — N° TVA : ${inv.seller_vat_number}` : ""}
          {" · "}Facture générée avec Caissio
        </div>
      </div>
    );
  };

  /* ─── RENDER ─── */

  return (
    <div style={s}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&family=IBM+Plex+Sans:wght@400;500;600;700&display=swap');`}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", top: 20, right: 20, zIndex: 9999,
          background: toast.type === "success" ? "#dcfce7" : "#fef2f2",
          border: `1px solid ${toast.type === "success" ? "#86efac" : "#fecaca"}`,
          color: toast.type === "success" ? "#166534" : "#dc2626",
          borderRadius: 12, padding: "12px 16px", fontSize: 13, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 8, boxShadow: "0 10px 25px rgba(0,0,0,.1)",
        }}>
          {toast.type === "success" ? <CheckCircle2 style={{ width: 16, height: 16 }} /> : <AlertCircle style={{ width: 16, height: 16 }} />}
          {toast.msg}
        </div>
      )}

      {/* ════════════════════ LIST VIEW ════════════════════ */}
      {view === "list" && (
        <>
          <div style={{ marginBottom: 24, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 4 }}>CAISSIO</div>
              <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 36, fontWeight: 900, color: "#0f172a", margin: 0 }}>Factures</h1>
            </div>
            <button
              onClick={() => { setCreateStep("select-sale"); setSelectedSale(null); setView("create"); }}
              style={{ display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", borderRadius: 12, border: "none", background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer" }}
            >
              <Plus style={{ width: 18, height: 18 }} /> Nouvelle facture
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 14, marginBottom: 24 }}>
            {[
              { label: "Total factures", value: String(invoices.length) },
              { label: "Payées", value: String(invoices.filter((i) => i.status === "paid").length) },
              { label: "CA facturé TTC", value: fmt(invoices.reduce((s, i) => s + i.total_ttc, 0)) },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 900, color: "#0f172a" }}>{value}</div>
              </div>
            ))}
          </div>

          {invoices.length === 0 ? (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "48px 24px", textAlign: "center" }}>
              <FileText style={{ width: 40, height: 40, color: "#cbd5e1", margin: "0 auto 12px" }} />
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Aucune facture</div>
              <div style={{ fontSize: 13, color: "#94a3b8", marginBottom: 20 }}>Générez votre première facture depuis une vente enregistrée.</div>
              <button
                onClick={() => { setCreateStep("select-sale"); setSelectedSale(null); setView("create"); }}
                style={{ height: 40, padding: "0 20px", borderRadius: 10, border: "none", background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
              >
                Créer une facture
              </button>
            </div>
          ) : (
            <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8fafc" }}>
                    {["N° Facture", "Date", "Client", "Total TTC", "Statut", "Actions"].map((h) => (
                      <th key={h} style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", textAlign: "left", borderBottom: "1px solid #e2e8f0" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#4f46e5" }}>{inv.number}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{fmtDate(inv.date)}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151" }}>{inv.customer_name}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, fontWeight: 700, color: "#0f172a", whiteSpace: "nowrap" }}>{fmt(inv.total_ttc)}</td>
                      <td style={{ padding: "12px 16px" }}><StatusBadge status={inv.status} /></td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button onClick={() => { setSelectedInvoice(inv); setView("detail"); }} title="Voir" style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Eye style={{ width: 15, height: 15, color: "#64748b" }} />
                          </button>
                          <button onClick={() => handlePrint(inv)} title="Imprimer" style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Printer style={{ width: 15, height: 15, color: "#4f46e5" }} />
                          </button>
                          <button onClick={() => handleDelete(inv.id)} title="Supprimer" style={{ width: 32, height: 32, borderRadius: 8, border: "1px solid #fee2e2", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Trash2 style={{ width: 15, height: 15, color: "#dc2626" }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div style={{ marginTop: 16, fontSize: 12, color: "#94a3b8", textAlign: "center" }}>
            Les factures incluent toutes les mentions légales obligatoires 2026 (art. L.441-10, D.441-5 C.com., art. 289 CGI)
          </div>
        </>
      )}

      {/* ════════════════════ CREATE VIEW ════════════════════ */}
      {view === "create" && (
        <>
          <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={() => setView("list")} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <ArrowLeft style={{ width: 16, height: 16, color: "#64748b" }} />
            </button>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8" }}>NOUVELLE FACTURE</div>
              <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 900, color: "#0f172a", margin: 0 }}>
                {createStep === "select-sale" ? "Choisir une vente" : "Informations client"}
              </h1>
            </div>
          </div>

          {/* Steps indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
            {(["select-sale", "customer"] as CreateStep[]).map((step, i) => (
              <div key={step} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 12, fontWeight: 700,
                  background: createStep === step ? "#4f46e5" : (i === 0 && createStep === "customer") ? "#dcfce7" : "#f1f5f9",
                  color: createStep === step ? "#fff" : (i === 0 && createStep === "customer") ? "#166534" : "#94a3b8",
                }}>
                  {i === 0 && createStep === "customer" ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: createStep === step ? "#4f46e5" : "#94a3b8" }}>
                  {step === "select-sale" ? "Vente" : "Client"}
                </span>
                {i === 0 && <div style={{ width: 24, height: 1, background: "#e2e8f0" }} />}
              </div>
            ))}
          </div>

          {/* STEP 1: Select sale */}
          {createStep === "select-sale" && (
            <div>
              {sales.length === 0 ? (
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 40, textAlign: "center" }}>
                  <Clock style={{ width: 36, height: 36, color: "#cbd5e1", margin: "0 auto 12px" }} />
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 6 }}>Aucune vente disponible</div>
                  <div style={{ fontSize: 13, color: "#94a3b8" }}>Enregistrez des ventes depuis la caisse avant de générer une facture.</div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sales.map((sale) => {
                    const cust = customers.find((c) => c.id === sale.customer_id);
                    const hasInvoice = invoicedSaleIds.has(sale.id);
                    return (
                      <div
                        key={sale.id}
                        style={{
                          background: "#fff",
                          border: `1px solid ${hasInvoice ? "#f1f5f9" : "#e2e8f0"}`,
                          borderRadius: 12,
                          padding: "14px 18px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: 16,
                          opacity: hasInvoice ? 0.55 : 1,
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a" }}>{fmtDate(sale.created_at)}</span>
                            {cust && <span style={{ fontSize: 12, color: "#4f46e5", fontWeight: 600 }}>{cust.name}</span>}
                            {hasInvoice && <span style={{ fontSize: 10, background: "#f1f5f9", color: "#94a3b8", padding: "1px 7px", borderRadius: 10, fontWeight: 700 }}>Facturée</span>}
                          </div>
                          <div style={{ fontSize: 12, color: "#64748b" }}>
                            {sale.items.slice(0, 3).map((it) => `${it.name} ×${it.qty}`).join(" · ")}
                            {sale.items.length > 3 && ` · +${sale.items.length - 3} autres`}
                          </div>
                          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                            {PAYMENT_LABELS[sale.payment] || sale.payment}
                            {sale.discount > 0 && ` · Remise −${fmt(sale.discount)}`}
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
                          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 900, color: "#0f172a" }}>{fmt(sale.total)}</span>
                          <button
                            onClick={() => handleSelectSale(sale)}
                            disabled={hasInvoice}
                            style={{
                              height: 36, padding: "0 16px", borderRadius: 10, border: "none",
                              background: hasInvoice ? "#f1f5f9" : "#4f46e5",
                              color: hasInvoice ? "#94a3b8" : "#fff",
                              fontWeight: 700, fontSize: 12, cursor: hasInvoice ? "default" : "pointer",
                            }}
                          >
                            {hasInvoice ? "Déjà facturée" : "Sélectionner →"}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Customer details */}
          {createStep === "customer" && selectedSale && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Sale recap */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "14px 16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 8 }}>Vente sélectionnée</div>
                  <div style={{ fontSize: 13, color: "#374151", marginBottom: 4 }}>{fmtDate(selectedSale.created_at)}</div>
                  {selectedSale.items.map((it, i) => (
                    <div key={i} style={{ fontSize: 12, color: "#64748b", marginBottom: 2 }}>{it.name} ×{it.qty} — {fmt(it.price * it.qty)}</div>
                  ))}
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginTop: 8, borderTop: "1px solid #e2e8f0", paddingTop: 8 }}>
                    Total TTC : {fmt(selectedSale.total)}
                  </div>
                </div>

                {/* Client fields */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 12 }}>Informations client</div>
                  {[
                    { label: "Nom / Raison sociale *", val: customerName, set: setCustomerName, placeholder: "Nom du client" },
                    { label: "Adresse", val: customerAddress, set: setCustomerAddress, placeholder: "Rue, Code postal, Ville", multiline: true },
                    { label: "Email", val: customerEmail, set: setCustomerEmail, placeholder: "email@exemple.fr" },
                    { label: "Téléphone", val: customerPhone, set: setCustomerPhone, placeholder: "06 12 34 56 78" },
                  ].map(({ label, val, set, placeholder, multiline }) => (
                    <div key={label} style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>{label}</div>
                      {multiline ? (
                        <textarea
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          placeholder={placeholder}
                          rows={3}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "'IBM Plex Sans',sans-serif", resize: "vertical", outline: "none" }}
                        />
                      ) : (
                        <input
                          type="text"
                          value={val}
                          onChange={(e) => set(e.target.value)}
                          placeholder={placeholder}
                          style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "'IBM Plex Sans',sans-serif", outline: "none" }}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Options */}
                <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, padding: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8", marginBottom: 12 }}>Options facture</div>
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Date d&apos;échéance (optionnel)</div>
                    <input
                      type="date"
                      value={invoiceDueDate}
                      onChange={(e) => setInvoiceDueDate(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, outline: "none" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#374151", marginBottom: 4 }}>Notes (optionnel)</div>
                    <textarea
                      value={invoiceNotes}
                      onChange={(e) => setInvoiceNotes(e.target.value)}
                      placeholder="Informations complémentaires, référence commande…"
                      rows={4}
                      style={{ width: "100%", padding: "8px 10px", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 13, fontFamily: "'IBM Plex Sans',sans-serif", resize: "vertical", outline: "none" }}
                    />
                  </div>
                </div>

                {/* Settings warning if SIRET missing */}
                {!settings?.siret && (
                  <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 12, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <AlertCircle style={{ width: 16, height: 16, color: "#d97706", flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 12, color: "#92400e", lineHeight: 1.5 }}>
                      Votre SIRET n&apos;est pas renseigné. Ajoutez-le dans{" "}
                      <a href="/caissio/app/parametres" style={{ color: "#4f46e5", fontWeight: 600 }}>Paramètres</a>{" "}
                      pour une facture complète et conforme.
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setCreateStep("select-sale")}
                    style={{ flex: 1, height: 44, borderRadius: 12, border: "1px solid #e2e8f0", background: "#fff", fontWeight: 700, fontSize: 14, color: "#64748b", cursor: "pointer" }}
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={handleGenerateInvoice}
                    disabled={!customerName.trim()}
                    style={{ flex: 2, height: 44, borderRadius: 12, border: "none", background: customerName.trim() ? "#4f46e5" : "#e2e8f0", color: customerName.trim() ? "#fff" : "#94a3b8", fontWeight: 700, fontSize: 14, cursor: customerName.trim() ? "pointer" : "default" }}
                  >
                    Générer la facture
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* ════════════════════ DETAIL VIEW ════════════════════ */}
      {view === "detail" && selectedInvoice && (
        <>
          <div style={{ marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <button onClick={() => setView("list")} style={{ width: 36, height: 36, borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <ArrowLeft style={{ width: 16, height: 16, color: "#64748b" }} />
              </button>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8" }}>FACTURE</div>
                <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 24, fontWeight: 900, color: "#0f172a", margin: 0 }}>{selectedInvoice.number}</h1>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => handleMarkPaid(selectedInvoice)}
                style={{ height: 40, padding: "0 16px", borderRadius: 10, border: `1px solid ${selectedInvoice.status === "paid" ? "#86efac" : "#e2e8f0"}`, background: selectedInvoice.status === "paid" ? "#dcfce7" : "#fff", color: selectedInvoice.status === "paid" ? "#166534" : "#374151", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                <CheckCircle2 style={{ width: 15, height: 15 }} />
                {selectedInvoice.status === "paid" ? "Marquer non payée" : "Marquer payée"}
              </button>
              <button
                onClick={() => handlePrint(selectedInvoice)}
                style={{ height: 40, padding: "0 16px", borderRadius: 10, border: "none", background: "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
              >
                <Printer style={{ width: 15, height: 15 }} /> Imprimer / PDF
              </button>
              <button
                onClick={() => handleDelete(selectedInvoice.id)}
                style={{ height: 40, width: 40, borderRadius: 10, border: "1px solid #fee2e2", background: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <Trash2 style={{ width: 15, height: 15, color: "#dc2626" }} />
              </button>
            </div>
          </div>

          <InvoiceViewer inv={selectedInvoice} />
        </>
      )}
    </div>
  );
}
