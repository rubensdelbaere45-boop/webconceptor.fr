/**
 * caissio-printer.ts
 * Impression universelle — Caissio
 *
 * Méthodes par ordre de priorité :
 *  1. QZ Tray       → TOUTES navigateurs (Chrome, Firefox, Safari, Edge)
 *                     Requiert QZ Tray installé sur le PC/Mac
 *  2. Web Serial    → Chrome & Edge uniquement, connexion directe USB/COM
 *  3. window.print()→ Tous navigateurs & appareils (dialogue standard)
 *                     Fonctionne avec AirPrint sur iPad
 */

/* ── Types ─────────────────────────────────────────────────────────────── */
export type PrintMethod = "qz" | "serial" | "browser";

export interface PrinterConn {
  method: PrintMethod;
  label:  string;
  port?:  unknown;   // SerialPort (Web Serial)
}

export interface TicketItem {
  name:  string;
  qty:   number;
  price: number;
}

export interface TicketData {
  storeName:     string;
  storeAddress?: string;
  ticketNum:     string;
  dateStr:       string;
  items:         TicketItem[];
  subtotal:      number;
  discount:      number;
  total:         number;
  payMode:       string;
  cashGiven?:    number;
  change?:       number;
}

/* ── ESC/POS builder ────────────────────────────────────────────────────── */
const ESC = 0x1B, GS = 0x1D;
const C = {
  INIT:     [ESC, 0x40],
  CUT:      [GS,  0x56, 0x41, 0x10],
  DRAWER0:  [ESC, 0x70, 0x00, 0x32, 0xFF],
  CENTER:   [ESC, 0x61, 0x01],
  LEFT:     [ESC, 0x61, 0x00],
  BOLD1:    [ESC, 0x45, 0x01],
  BOLD0:    [ESC, 0x45, 0x00],
  DBLW:     [ESC, 0x21, 0x20],
  NORMAL:   [ESC, 0x21, 0x00],
  FEED:     (n: number) => [ESC, 0x64, n],
  TEXT:     (s: string) => [...new TextEncoder().encode(s + "\n")],
  LINE:     () => [...new TextEncoder().encode("--------------------------------\n")],
};

function concat(...arrays: number[][]): Uint8Array {
  const flat = arrays.flat();
  return new Uint8Array(flat);
}

export function buildTicketBytes(d: TicketData): Uint8Array {
  const PAY_LABEL: Record<string, string> = {
    cash: "Especes", card: "Carte", account: "Sur compte", mixed: "Mixte",
  };
  const chunks: number[][] = [
    C.INIT, C.CENTER, C.BOLD1, C.DBLW,
    C.TEXT(d.storeName.toUpperCase()),
    C.NORMAL, C.BOLD0,
    ...(d.storeAddress ? [C.TEXT(d.storeAddress)] : []),
    C.LINE(),
    C.LEFT,
    C.TEXT(`Date   : ${d.dateStr}`),
    C.TEXT(`Ticket : #${d.ticketNum}`),
    C.LINE(),
    ...d.items.map(i => {
      const label = (i.name + (i.qty > 1 ? ` x${i.qty}` : "")).slice(0, 20).padEnd(20);
      const price = (i.price * i.qty).toFixed(2).padStart(8);
      return C.TEXT(`${label}${price} EUR`);
    }),
    C.LINE(),
    ...(d.discount > 0 ? [C.TEXT(`Remise : -${d.discount.toFixed(2)} EUR`)] : []),
    C.CENTER, C.BOLD1,
    C.TEXT(`TOTAL : ${d.total.toFixed(2)} EUR`),
    C.BOLD0, C.LEFT,
    C.TEXT(`Reglement : ${PAY_LABEL[d.payMode] ?? d.payMode}`),
    ...(d.cashGiven ? [C.TEXT(`Remis  : ${d.cashGiven.toFixed(2)} EUR`)] : []),
    ...(d.change && d.change > 0 ? [C.TEXT(`Rendu  : ${d.change.toFixed(2)} EUR`)] : []),
    C.LINE(), C.CENTER,
    C.TEXT("Merci de votre visite !"),
    C.TEXT("Propulse par Caissio"),
    C.FEED(4), C.CUT,
  ];
  return concat(...chunks);
}

/* ── QZ Tray ────────────────────────────────────────────────────────────── */

/** Charge le script QZ Tray depuis le CDN si nécessaire */
export async function loadQZScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).qz) return true;
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/qz-tray@2.2.4/qz-tray.js";
    s.onload  = () => resolve(true);
    s.onerror = () => resolve(false);
    document.head.appendChild(s);
  });
}

/** Vérifie si QZ Tray est disponible et en cours d'exécution */
export async function detectQZ(): Promise<boolean> {
  const loaded = await loadQZScript();
  if (!loaded) return false;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qz = (window as any).qz;
    if (!qz) return false;
    // Setup unsigned / demo mode
    qz.security.setCertificatePromise((resolve: (v: string) => void) => resolve(""));
    qz.security.setSignatureAlgorithm("SHA512");
    qz.security.setSignaturePromise(
      () => (resolve: (v: null) => void) => resolve(null)
    );
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect({ retries: 1, delay: 0.5 });
    }
    return qz.websocket.isActive();
  } catch {
    return false;
  }
}

/** Imprime via QZ Tray (toutes navigateurs, zéro dialogue) */
export async function printViaQZ(data: TicketData): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qz = (window as any).qz;
  if (!qz) throw new Error("QZ Tray non disponible");

  qz.security.setCertificatePromise((resolve: (v: string) => void) => resolve(""));
  qz.security.setSignatureAlgorithm("SHA512");
  qz.security.setSignaturePromise(
    () => (resolve: (v: null) => void) => resolve(null)
  );

  if (!qz.websocket.isActive()) {
    await qz.websocket.connect({ retries: 2, delay: 0.5 });
  }

  const printer = await qz.printers.getDefault();
  const config  = qz.configs.create(printer);
  const bytes   = buildTicketBytes(data);
  const hex     = Array.from(bytes).map((b: number) => b.toString(16).padStart(2, "0")).join("");

  await qz.print(config, [{ type: "raw", format: "hex", data: hex }]);
}

/** Ouvre le tiroir via QZ Tray */
export async function openDrawerQZ(): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const qz = (window as any).qz;
  if (!qz || !qz.websocket.isActive()) throw new Error("QZ Tray non connecté");
  const printer = await qz.printers.getDefault();
  const config  = qz.configs.create(printer);
  const cmd     = [ESC, 0x70, 0x00, 0x32, 0xFF];
  const hex     = cmd.map((b) => b.toString(16).padStart(2, "0")).join("");
  await qz.print(config, [{ type: "raw", format: "hex", data: hex }]);
}

/* ── Web Serial ─────────────────────────────────────────────────────────── */

/** Imprime via un port série déjà ouvert */
export async function printViaSerial(port: unknown, data: TicketData): Promise<void> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = port as any;
  const writer = p.writable.getWriter();
  try { await writer.write(buildTicketBytes(data)); }
  finally { writer.releaseLock(); }
}

/** Connecte une imprimante série (demande le port au navigateur) */
export async function connectSerialPrinter(): Promise<{ port: unknown; label: string }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any;
  if (!("serial" in nav)) throw new Error("Web Serial non supporté (utilisez Chrome ou Edge)");
  const port = await nav.serial.requestPort();
  await port.open({ baudRate: 9600 });
  const info  = port.getInfo?.() ?? {};
  const VID: Record<number, string> = {
    0x04b8: "Epson", 0x0519: "Star", 0x1d90: "Citizen",
    0x1504: "Bixolon", 0x0dd4: "Custom",
  };
  const brand = VID[info.usbVendorId] ?? (info.usbVendorId ? `VID:${info.usbVendorId.toString(16).toUpperCase()}` : "Port COM");
  return { port, label: `Imprimante ${brand} (série)` };
}

/* ── Fallback navigateur ─────────────────────────────────────────────────── */

/**
 * Injection du CSS print 80mm dans le document (une seule fois)
 * Crée un div caché #caissio-print-target que window.print() rend visible seul
 */
let printCssInjected = false;
export function injectPrintCss() {
  if (printCssInjected || typeof document === "undefined") return;
  printCssInjected = true;
  const style = document.createElement("style");
  style.textContent = `
    @media print {
      @page { size: 80mm auto; margin: 2mm; }
      body * { visibility: hidden !important; }
      #caissio-print-target,
      #caissio-print-target * { visibility: visible !important; }
      #caissio-print-target {
        position: fixed !important;
        top: 0 !important; left: 0 !important;
        width: 76mm !important;
        font-family: 'Courier New', monospace !important;
        font-size: 12px !important;
        line-height: 1.6 !important;
        color: #000 !important;
        background: #fff !important;
        padding: 4mm !important;
        border: none !important;
        box-shadow: none !important;
      }
    }
    #caissio-print-target { display: none; }
    @media print { #caissio-print-target { display: block !important; } }
  `;
  document.head.appendChild(style);
}

/** Met à jour le contenu du div caché et lance window.print() */
export function printViaBrowser(data: TicketData) {
  injectPrintCss();

  const PAY_LABEL: Record<string, string> = {
    cash: "Especes", card: "Carte bancaire", account: "Sur compte", mixed: "Mixte",
  };

  let div = document.getElementById("caissio-print-target");
  if (!div) {
    div = document.createElement("div");
    div.id = "caissio-print-target";
    document.body.appendChild(div);
  }

  const sep = "–".repeat(32);
  const items = data.items
    .map(i => `<div style="display:flex;justify-content:space-between"><span>${i.name}${i.qty > 1 ? ` ×${i.qty}` : ""}</span><span>${(i.price * i.qty).toFixed(2)} €</span></div>`)
    .join("");

  div.innerHTML = `
    <div style="text-align:center;font-weight:bold;font-size:14px">${data.storeName}</div>
    ${data.storeAddress ? `<div style="text-align:center;font-size:10px">${data.storeAddress}</div>` : ""}
    <div style="margin:4px 0;font-size:10px;color:#555">${sep}</div>
    <div style="font-size:10px;display:flex;justify-content:space-between"><span>${data.dateStr}</span><span>#${data.ticketNum}</span></div>
    <div style="margin:4px 0;font-size:10px;color:#555">${sep}</div>
    ${items}
    <div style="margin:4px 0;font-size:10px;color:#555">${sep}</div>
    ${data.discount > 0 ? `<div style="display:flex;justify-content:space-between;color:green"><span>Remise</span><span>-${data.discount.toFixed(2)} €</span></div>` : ""}
    <div style="display:flex;justify-content:space-between;font-weight:bold;font-size:14px;margin-top:4px">
      <span>TOTAL TTC</span><span>${data.total.toFixed(2)} €</span>
    </div>
    <div style="margin:4px 0;font-size:10px;color:#555">${sep}</div>
    <div style="font-size:11px">Règlement : ${PAY_LABEL[data.payMode] ?? data.payMode}</div>
    ${data.cashGiven ? `<div style="font-size:11px">Remis  : ${data.cashGiven.toFixed(2)} €</div>` : ""}
    ${data.change && data.change > 0 ? `<div style="font-size:11px;font-weight:bold;color:green">Rendu  : ${data.change.toFixed(2)} €</div>` : ""}
    <div style="margin:4px 0;font-size:10px;color:#555">${sep}</div>
    <div style="text-align:center;font-size:11px">Merci de votre visite !</div>
    <div style="text-align:center;font-size:9px;color:#999;margin-top:2px">Caissio</div>
  `;

  setTimeout(() => window.print(), 100);
}

/* ── Fonction principale ────────────────────────────────────────────────── */

/**
 * Imprime avec la meilleure méthode disponible.
 * @param data   Données du ticket
 * @param conn   Connexion actuelle (null = browser fallback)
 */
export async function universalPrint(data: TicketData, conn: PrinterConn | null): Promise<void> {
  if (conn?.method === "qz") {
    await printViaQZ(data);
  } else if (conn?.method === "serial" && conn.port) {
    await printViaSerial(conn.port, data);
  } else {
    printViaBrowser(data);
  }
}
