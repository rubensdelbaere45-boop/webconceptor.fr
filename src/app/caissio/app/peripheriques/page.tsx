"use client";
import { useState, useEffect, useRef } from "react";
import {
  ScanBarcode, Printer, Archive, Scale, Bluetooth,
  Plug, Wifi, Monitor, Cpu, Globe, CheckCircle,
  Zap, X, Loader2, Play, ChevronUp, AlertTriangle,
  Unplug, RefreshCw, Download,
} from "lucide-react";
import { detectQZ, loadQZScript, openDrawerQZ, printViaQZ } from "@/lib/caissio-printer";

/* ══ Types ═══════════════════════════════════════════════════════════════ */
type DeviceStatus = "connecting" | "connected" | "testing" | "error";
type DeviceType   = "printer" | "scanner" | "drawer" | "scale" | "bt";
type AuditState   = "idle" | "scanning" | "done";

interface ConnectedDevice {
  id:       string;
  type:     DeviceType;
  name:     string;
  protocol: string;
  status:   DeviceStatus;
  info?:    string;
  error?:   string;
  extra?:   string; // poids pour balance, etc.
}

interface SysInfo {
  screen:    { resolution: string; colorDepth: string; pixelRatio: string };
  cpu:       { cores: number | string; memory?: number };
  platform:  { os: string; browser: string; touchPoints: number; lang: string; timezone: string };
  network:   { online: boolean; type?: string; speed?: number };
  battery:   { level?: number; charging?: boolean };
  media:     { cameras: number; microphones: number };
  webApis:   Record<string, boolean>;
  portsCount:   number;
  hidCount:     number;
  usbCount:     number;
}

/* ══ ESC/POS command builder ═════════════════════════════════════════════ */
const ESC = 0x1B, GS = 0x1D;
const CMD = {
  INIT:      new Uint8Array([ESC, 0x40]),
  CUT:       new Uint8Array([GS,  0x56, 0x41, 0x10]),
  DRAWER0:   new Uint8Array([ESC, 0x70, 0x00, 0x32, 0xFF]),
  DRAWER1:   new Uint8Array([ESC, 0x70, 0x01, 0x32, 0xFF]),
  BOLD_ON:   new Uint8Array([ESC, 0x45, 0x01]),
  BOLD_OFF:  new Uint8Array([ESC, 0x45, 0x00]),
  CENTER:    new Uint8Array([ESC, 0x61, 0x01]),
  LEFT:      new Uint8Array([ESC, 0x61, 0x00]),
  DBLWIDTH:  new Uint8Array([ESC, 0x21, 0x20]),
  NORMAL:    new Uint8Array([ESC, 0x21, 0x00]),
  FEED:      (n: number) => new Uint8Array([ESC, 0x64, n]),
  TEXT:      (s: string) => new TextEncoder().encode(s + "\n"),
  LINE:      () => new TextEncoder().encode("--------------------------------\n"),
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function escWrite(port: any, ...chunks: Uint8Array[]) {
  const writer = port.writable.getWriter();
  try { for (const c of chunks) await writer.write(c); }
  finally { writer.releaseLock(); }
}

/* ══ Vendor IDs imprimantes thermiques ═══════════════════════════════════ */
const THERMAL_VENDORS: Record<number, string> = {
  0x04b8: "Epson", 0x0519: "Star Micronics", 0x1d90: "Citizen",
  0x1504: "Bixolon", 0x0dd4: "Custom", 0x0525: "Sewoo",
  0x6868: "SNBC", 0x0fe6: "IDS-POS", 0x154f: "SNBC",
};

/* ══ Audit steps ════════════════════════════════════════════════════════ */
const STEPS = [
  { label: "Initialisation de l'audit…",                icon: "🔍" },
  { label: "Analyse CPU, mémoire, architecture…",       icon: "🧠" },
  { label: "Lecture écran, résolution, capteurs…",      icon: "🖥️" },
  { label: "Scan ports USB & interfaces série…",        icon: "🔌" },
  { label: "Détection HID — scanners, périphériques…",  icon: "🖱️" },
  { label: "Analyse Bluetooth & réseau…",               icon: "📡" },
  { label: "Vérification caméras & microphones…",       icon: "📷" },
  { label: "Compilation du rapport complet…",           icon: "✅" },
];

/* ══ System detector ════════════════════════════════════════════════════ */
async function detectSystem(): Promise<SysInfo> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = navigator as any;

  const resolution = `${screen.width}×${screen.height}`;
  const cores      = navigator.hardwareConcurrency || "—";
  const memory     = nav.deviceMemory as number | undefined;

  const ua = navigator.userAgent;
  let os = "Inconnu";
  if      (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS / iPadOS";
  else if (ua.includes("Android"))                        os = "Android";
  else if (ua.includes("Mac"))                            os = ua.includes("Intel") ? "macOS Intel" : "macOS Apple Silicon";
  else if (ua.includes("Windows"))                        os = "Windows";
  else if (ua.includes("Linux"))                          os = "Linux";

  let browser = "Inconnu";
  if      (ua.includes("Edg/"))    browser = "Microsoft Edge";
  else if (ua.includes("Chrome/")) browser = "Google Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/")) browser = "Safari";

  // Network
  const conn = nav.connection as { effectiveType?: string; downlink?: number } | undefined;

  // Battery
  let battery: { level?: number; charging?: boolean } = {};
  try { if ("getBattery" in navigator) { const b = await nav.getBattery(); battery = { level: Math.round(b.level * 100), charging: b.charging }; } } catch { /* ignore */ }

  // Media devices
  let cameras = 0, microphones = 0;
  try {
    if ("mediaDevices" in navigator) {
      const devs = await navigator.mediaDevices.enumerateDevices();
      cameras      = devs.filter((d) => d.kind === "videoinput").length;
      microphones  = devs.filter((d) => d.kind === "audioinput").length;
    }
  } catch { /* ignore */ }

  // Already-authorized Web API devices
  let portsCount = 0, hidCount = 0, usbCount = 0;
  try { if ("serial"    in nav) { const p = await nav.serial.getPorts();    portsCount = p.length; } } catch { /* ignore */ }
  try { if ("hid"       in nav) { const d = await nav.hid.getDevices();     hidCount   = d.length; } } catch { /* ignore */ }
  try { if ("usb"       in nav) { const d = await nav.usb.getDevices();     usbCount   = d.length; } } catch { /* ignore */ }

  return {
    screen:   { resolution, colorDepth: `${screen.colorDepth} bits`, pixelRatio: `${devicePixelRatio}×` },
    cpu:      { cores, memory },
    platform: { os, browser, touchPoints: navigator.maxTouchPoints ?? 0, lang: navigator.language, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
    network:  { online: navigator.onLine, type: conn?.effectiveType, speed: conn?.downlink },
    battery,
    media:    { cameras, microphones },
    webApis:  {
      "Web Serial (imprimante/balance)": "serial"    in nav,
      "Web HID (scanner USB)":           "hid"       in nav,
      "Web USB":                         "usb"       in nav,
      "Web Bluetooth":                   "bluetooth" in nav,
      "MediaDevices (caméra)":           "mediaDevices" in navigator,
    },
    portsCount, hidCount, usbCount,
  };
}

/* ══ Component ══════════════════════════════════════════════════════════ */
export default function PeripheriquesPage() {
  const [devices,      setDevices]      = useState<ConnectedDevice[]>([]);
  const [auditState,   setAuditState]   = useState<AuditState>("idle");
  const [auditStep,    setAuditStep]    = useState(0);
  const [auditPct,     setAuditPct]     = useState(0);
  const [doneSteps,    setDoneSteps]    = useState<number[]>([]);
  const [sysInfo,      setSysInfo]      = useState<SysInfo | null>(null);
  const [toast,        setToast]        = useState<{ msg: string; ok: boolean } | null>(null);
  const [qzStatus,     setQzStatus]     = useState<"idle" | "checking" | "connected" | "unavailable">("idle");

  const printerRef = useRef<unknown>(null);
  const scaleRef   = useRef<unknown>(null);
  const timers     = useRef<ReturnType<typeof setTimeout>[]>([]);
  const auditRef   = useRef<HTMLDivElement>(null);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nav = typeof navigator !== "undefined" ? navigator as any : null;
  const hasSerial = nav && "serial"    in nav;
  const hasHID    = nav && "hid"       in nav;
  const hasBT     = nav && "bluetooth" in nav;

  /* Helpers */
  const showToast = (msg: string, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 3500); };
  const upsert    = (d: ConnectedDevice) => setDevices((prev) => { const f = prev.filter((x) => x.id !== d.id); return [...f, d]; });
  const patch     = (id: string, p: Partial<ConnectedDevice>) => setDevices((prev) => prev.map((x) => x.id === id ? { ...x, ...p } : x));
  const remove    = (id: string) => setDevices((prev) => prev.filter((x) => x.id !== id));

  /* ── QZ Tray (impression silencieuse, tous navigateurs) ── */
  const connectQZ = async () => {
    setQzStatus("checking");
    try {
      await loadQZScript();
      const ok = await detectQZ();
      setQzStatus(ok ? "connected" : "unavailable");
      if (ok) showToast("✅ QZ Tray connecté — impression silencieuse activée !");
      else showToast("⚠️ QZ Tray non détecté — vérifiez qu'il est lancé", false);
    } catch {
      setQzStatus("unavailable");
      showToast("❌ Impossible de joindre QZ Tray", false);
    }
  };

  const testQZ = async () => {
    try {
      await printViaQZ({
        storeName: "Caissio", ticketNum: "TEST",
        dateStr: new Date().toLocaleDateString("fr-FR"),
        items: [{ name: "Ticket de test QZ Tray", qty: 1, price: 0 }],
        subtotal: 0, discount: 0, total: 0, payMode: "card",
      });
      showToast("✅ Ticket test imprimé via QZ Tray !");
    } catch (e: unknown) {
      showToast(`❌ ${e instanceof Error ? e.message : "Erreur impression QZ"}`, false);
    }
  };

  const openDrawerWithQZ = async () => {
    try {
      await openDrawerQZ();
      showToast("✅ Tiroir ouvert via QZ Tray !");
    } catch (e: unknown) {
      showToast(`❌ ${e instanceof Error ? e.message : "Erreur tiroir QZ"}`, false);
    }
  };

  /* ── Connecter imprimante ESC/POS via Web Serial ── */
  const connectPrinter = async () => {
    if (!hasSerial) { showToast("⚠️ Web Serial non supporté — utilisez Chrome ou Edge", false); return; }
    upsert({ id: "printer", type: "printer", name: "Connexion…", protocol: "Série USB/COM", status: "connecting" });
    try {
      const port = await nav.serial.requestPort();
      await port.open({ baudRate: 9600 });
      printerRef.current = port;
      const info  = port.getInfo?.() ?? {};
      const brand = THERMAL_VENDORS[info.usbVendorId] ?? (info.usbVendorId ? `VID ${info.usbVendorId.toString(16).toUpperCase()}` : "Port COM");
      const now   = new Date().toLocaleString("fr-FR");
      await escWrite(port,
        CMD.INIT, CMD.CENTER, CMD.BOLD_ON, CMD.DBLWIDTH,
        CMD.TEXT("CAISSIO"),
        CMD.NORMAL, CMD.BOLD_OFF,
        CMD.LINE(),
        CMD.TEXT("Imprimante connectee"),
        CMD.TEXT(now),
        CMD.LINE(),
        CMD.TEXT("Compatibilite ESC/POS OK"),
        CMD.TEXT(""),
        CMD.FEED(3), CMD.CUT,
      );
      patch("printer", { name: `Imprimante ${brand}`, status: "connected", info: `${brand} · 9600 baud · ESC/POS ✓` });
      showToast(`✅ Imprimante ${brand} connectée — ticket test imprimé !`);
      // Auto-add tiroir
      upsert({ id: "drawer", type: "drawer", name: "Tiroir-caisse", protocol: "Via imprimante (RJ11)", status: "connected", info: "Prêt — branché sur l'imprimante" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (!msg || msg.toLowerCase().includes("cancel") || msg.toLowerCase().includes("no port")) { remove("printer"); return; }
      patch("printer", { status: "error", name: "Imprimante", error: msg });
      showToast(`❌ ${msg}`, false);
    }
  };

  /* ── Test impression ── */
  const testPrint = async () => {
    if (!printerRef.current) { showToast("⚠️ Connectez d'abord une imprimante", false); return; }
    patch("printer", { status: "testing" });
    try {
      const now = new Date().toLocaleString("fr-FR");
      await escWrite(printerRef.current as object,
        CMD.INIT,
        CMD.CENTER, CMD.BOLD_ON,
        CMD.TEXT("=== TEST CAISSIO ==="),
        CMD.BOLD_OFF, CMD.LEFT,
        CMD.TEXT(`Date    : ${now}`),
        CMD.LINE(),
        CMD.TEXT("Cafe expresso        2.50"),
        CMD.TEXT("Pain au chocolat     1.20"),
        CMD.TEXT("Eau Evian 50cl       1.00"),
        CMD.LINE(),
        CMD.CENTER, CMD.BOLD_ON,
        CMD.TEXT("TOTAL           4.70 EUR"),
        CMD.BOLD_OFF,
        CMD.TEXT("Reglement : Carte bancaire"),
        CMD.TEXT(""),
        CMD.TEXT("Merci de votre visite !"),
        CMD.FEED(3), CMD.CUT,
      );
      patch("printer", { status: "connected", info: `ESC/POS ✓ · Dernier test ${new Date().toLocaleTimeString("fr-FR")}` });
      showToast("✅ Ticket de test imprimé !");
    } catch (e: unknown) {
      patch("printer", { status: "error", error: e instanceof Error ? e.message : "Erreur" });
      showToast("❌ Erreur impression", false);
    }
  };

  /* ── Ouvrir tiroir ── */
  const openDrawer = async () => {
    if (!printerRef.current) { showToast("⚠️ L'imprimante doit être connectée (le tiroir se branche sur l'imprimante)", false); return; }
    patch("drawer", { status: "testing" });
    try {
      await escWrite(printerRef.current as object, CMD.DRAWER0);
      setTimeout(async () => { try { await escWrite(printerRef.current as object, CMD.DRAWER1); } catch { /* ignore */ } }, 150);
      patch("drawer", { status: "connected", info: `ESC/POS p ✓ · Ouvert à ${new Date().toLocaleTimeString("fr-FR")}` });
      showToast("✅ Commande tiroir envoyée !");
    } catch (e: unknown) {
      patch("drawer", { status: "error", error: e instanceof Error ? e.message : "Erreur" });
      showToast("❌ Erreur tiroir-caisse", false);
    }
  };

  /* ── Connecter scanner HID ── */
  const connectScanner = async () => {
    if (!hasHID) { showToast("⚠️ WebHID non supporté — utilisez Chrome ou Edge", false); return; }
    upsert({ id: "scanner", type: "scanner", name: "Sélection scanner…", protocol: "HID USB", status: "connecting" });
    try {
      const devs = await nav.hid.requestDevice({ filters: [] });
      if (!devs.length) { remove("scanner"); return; }
      const d = devs[0];
      await d.open();
      const name = d.productName || "Scanner HID";
      const vid  = d.vendorId?.toString(16).toUpperCase().padStart(4, "0");
      const pid  = d.productId?.toString(16).toUpperCase().padStart(4, "0");
      patch("scanner", { name, status: "connected", info: `VID:${vid} PID:${pid} · HID ✓` });
      showToast(`✅ ${name} connecté — scannez n'importe quel code pour tester !`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (!msg) { remove("scanner"); return; }
      patch("scanner", { name: "Scanner HID", status: "error", error: msg });
      showToast(`❌ ${msg}`, false);
    }
  };

  /* ── Connecter balance série ── */
  const connectScale = async () => {
    if (!hasSerial) { showToast("⚠️ Web Serial non supporté — utilisez Chrome ou Edge", false); return; }
    upsert({ id: "scale", type: "scale", name: "Connexion balance…", protocol: "Série RS232 / USB", status: "connecting" });
    try {
      const port = await nav.serial.requestPort();
      await port.open({ baudRate: 9600, dataBits: 8, stopBits: 1, parity: "none" });
      scaleRef.current = port;
      patch("scale", { name: "Balance", status: "testing", info: "Lecture du poids…" });

      /* Lecture avec timeout 4s */
      const reader    = port.readable.getReader();
      let raw         = "";
      const timeout   = setTimeout(() => reader.cancel().catch(() => null), 4000);
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          raw += new TextDecoder().decode(value);
          if (raw.includes("\n") || raw.includes("\r")) break;
        }
      } finally { clearTimeout(timeout); try { reader.releaseLock(); } catch { /* ignore */ } }

      const weight = raw.trim() || "(aucune donnée)";
      patch("scale", { name: "Balance RS232", status: "connected", info: "9600 baud · N 8 1 ✓", extra: `Poids lu : ${weight}` });
      showToast(`✅ Balance connectée · poids : ${weight}`);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "";
      if (!msg || msg.toLowerCase().includes("cancel")) { remove("scale"); return; }
      patch("scale", { name: "Balance", status: "error", error: msg });
      showToast(`❌ ${msg}`, false);
    }
  };

  /* ── Connecter Bluetooth ── */
  const connectBluetooth = async () => {
    if (!hasBT) { showToast("⚠️ Web Bluetooth non supporté dans ce navigateur", false); return; }
    upsert({ id: "bt", type: "bt", name: "Recherche BT…", protocol: "Bluetooth LE", status: "connecting" });
    try {
      const d = await nav.bluetooth.requestDevice({ acceptAllDevices: true, optionalServices: [] });
      patch("bt", { name: d.name || "Périphérique Bluetooth", status: "connected", info: `BT LE ✓ · ${d.id?.slice(0, 12)}…` });
      showToast(`✅ ${d.name || "Bluetooth"} associé !`);
    } catch {
      remove("bt");
    }
  };

  /* ── Déconnecter ── */
  const disconnect = async (dev: ConnectedDevice) => {
    try {
      if (dev.id === "printer" && printerRef.current) { await (printerRef.current as { close(): Promise<void> }).close(); printerRef.current = null; remove("drawer"); }
      if (dev.id === "scale"   && scaleRef.current)   { await (scaleRef.current   as { close(): Promise<void> }).close(); scaleRef.current   = null; }
    } catch { /* ignore */ }
    remove(dev.id);
    showToast(`🔌 ${dev.name} déconnecté`);
  };

  /* ── Audit complet ── */
  const startAudit = async () => {
    setAuditState("scanning");
    setAuditStep(0); setAuditPct(0); setDoneSteps([]); setSysInfo(null);
    const infoP = detectSystem();
    const total = 3600, step = total / STEPS.length;

    STEPS.forEach((_, i) => {
      timers.current.push(
        setTimeout(() => { setAuditStep(i); setAuditPct(Math.round((i / STEPS.length) * 100)); }, i * step),
        setTimeout(() => setDoneSteps((p) => [...p, i]), i * step + step * 0.8),
      );
    });

    timers.current.push(setTimeout(async () => {
      setAuditPct(100);
      const info = await infoP;
      setSysInfo(info);
      setTimeout(() => { setAuditState("done"); setTimeout(() => auditRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100); }, 300);
    }, total + 200));
  };

  /* ══════════════════════════════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════════════════════════════ */
  const deviceCards = [
    { id: "printer", label: "Imprimante ESC/POS",  Icon: Printer,     proto: "USB / Série / Réseau",   action: connectPrinter,  needSerial: true  },
    { id: "scanner", label: "Scanner code-barres",  Icon: ScanBarcode, proto: "HID USB / Bluetooth",    action: connectScanner,  needHID: true     },
    { id: "drawer",  label: "Tiroir-caisse",         Icon: Archive,     proto: "Via imprimante (RJ11)",  action: openDrawer,      needPrinter: true },
    { id: "scale",   label: "Balance",               Icon: Scale,       proto: "RS232 / USB-Série",      action: connectScale,    needSerial: true  },
    { id: "bt",      label: "Périphérique Bluetooth",Icon: Bluetooth,   proto: "Bluetooth LE",           action: connectBluetooth,needBT: true      },
  ] as const;

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'IBM Plex Sans',sans-serif", maxWidth: 980 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes ping1    { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.25);opacity:0} }
        @keyframes ping2    { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.5);opacity:0} }
        @keyframes ping3    { 0%,100%{transform:scale(1);opacity:.2} 50%{transform:scale(1.75);opacity:0} }
        @keyframes fadeSlide{ from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes revealCard{ from{opacity:0;transform:scale(.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes pulse    { 0%,100%{opacity:1} 50%{opacity:.5} }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 28, left: "50%", transform: "translateX(-50%)", zIndex: 500, background: toast.ok ? "#0f172a" : "#dc2626", color: "#fff", padding: "12px 22px", borderRadius: 30, fontSize: 13, fontWeight: 600, boxShadow: "0 8px 28px rgba(0,0,0,.3)", whiteSpace: "nowrap", animation: "fadeSlide .3s ease-out" }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28, gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 4 }}>MATÉRIEL</div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 34, fontWeight: 900, color: "#0f172a", margin: 0, marginBottom: 6 }}>Périphériques</h1>
          <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
            Connectez votre matériel directement depuis le navigateur — imprimante, scanner, balance, tiroir-caisse. Compatible avec tout équipement ESC/POS, HID, RS232 ou Bluetooth.
          </p>
        </div>
        <button onClick={startAudit} disabled={auditState === "scanning"}
          style={{ display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 22px", borderRadius: 12, background: auditState === "scanning" ? "#c4b5fd" : "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: auditState === "scanning" ? "default" : "pointer", flexShrink: 0, boxShadow: "0 8px 24px rgba(79,70,229,.3)", whiteSpace: "nowrap" }}>
          {auditState === "scanning"
            ? <><div style={{ width: 15, height: 15, border: "2px solid rgba(255,255,255,.5)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} /> Analyse…</>
            : <><Zap style={{ width: 15, height: 15 }} /> Audit complet</>}
        </button>
      </div>

      {/* Compatibilité browser */}
      {!hasSerial && !hasHID && (
        <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 14, padding: "14px 18px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12 }}>
          <AlertTriangle style={{ width: 20, height: 20, color: "#d97706", flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#92400e" }}>Navigateur non compatible avec les Web APIs périphériques</div>
            <div style={{ fontSize: 12, color: "#a16207" }}>Pour connecter imprimantes, scanners et balances, utilisez <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong> sur PC/Mac/iPad.</div>
          </div>
        </div>
      )}

      {/* ── QZ Tray ── */}
      <div style={{
        background: qzStatus === "connected" ? "#f0fdf4" : "#f8fafc",
        border: `1.5px solid ${qzStatus === "connected" ? "#bbf7d0" : "#e2e8f0"}`,
        borderRadius: 18, padding: "18px 20px", marginBottom: 20,
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: qzStatus === "connected" ? "#d1fae5" : "#ede9fe", border: `1px solid ${qzStatus === "connected" ? "#6ee7b7" : "#c4b5fd"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Printer style={{ width: 22, height: 22, color: qzStatus === "connected" ? "#059669" : "#4f46e5" }} />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>QZ Tray</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: qzStatus === "connected" ? "#d1fae5" : "#ede9fe", color: qzStatus === "connected" ? "#065f46" : "#4f46e5", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                {qzStatus === "connected" ? "Connecté" : qzStatus === "checking" ? "Vérification…" : qzStatus === "unavailable" ? "Non détecté" : "Recommandé"}
              </span>
            </div>
            <div style={{ fontSize: 12, color: "#64748b" }}>
              Impression silencieuse sur <strong>tous navigateurs</strong> (Chrome, Firefox, Safari, Edge) — aucun dialogue d&apos;impression
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {qzStatus === "unavailable" && (
            <a href="https://qz.io/download/" target="_blank" rel="noopener"
              style={{ height: 36, padding: "0 14px", borderRadius: 10, background: "#fffbeb", border: "1px solid #fde68a", color: "#92400e", fontSize: 12, fontWeight: 700, textDecoration: "none", display: "flex", alignItems: "center", gap: 5 }}>
              <Download style={{ width: 13, height: 13 }} /> Télécharger QZ Tray
            </a>
          )}
          {qzStatus === "connected" && (
            <>
              <button onClick={testQZ} style={{ height: 36, padding: "0 12px", borderRadius: 10, background: "#ede9fe", color: "#4f46e5", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <Play style={{ width: 12, height: 12 }} /> Test impression
              </button>
              <button onClick={openDrawerWithQZ} style={{ height: 36, padding: "0 12px", borderRadius: 10, background: "#fef3c7", color: "#d97706", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                <Archive style={{ width: 12, height: 12 }} /> Ouvrir tiroir
              </button>
              <button onClick={() => setQzStatus("idle")} style={{ height: 36, width: 36, borderRadius: 10, background: "#f8fafc", color: "#94a3b8", fontSize: 12, border: "1px solid #e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X style={{ width: 14, height: 14 }} />
              </button>
            </>
          )}
          {(qzStatus === "idle" || qzStatus === "unavailable") && (
            <button onClick={connectQZ}
              style={{ height: 36, padding: "0 16px", borderRadius: 10, background: "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
              <Wifi style={{ width: 13, height: 13 }} /> {qzStatus === "unavailable" ? "Réessayer" : "Détecter QZ Tray"}
            </button>
          )}
          {qzStatus === "checking" && (
            <button disabled
              style={{ height: 36, padding: "0 16px", borderRadius: 10, background: "#c4b5fd", color: "#fff", fontWeight: 700, fontSize: 13, border: "none", cursor: "default", display: "flex", alignItems: "center", gap: 6 }}>
              <Loader2 style={{ width: 13, height: 13, animation: "spin .8s linear infinite" }} /> Vérification…
            </button>
          )}
        </div>
      </div>

      {/* Devices connectés */}
      {devices.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#64748b", marginBottom: 12 }}>Matériel connecté ({devices.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {devices.map((dev) => {
              const StatusIcon = dev.status === "connecting" || dev.status === "testing" ? Loader2 : dev.status === "connected" ? CheckCircle : AlertTriangle;
              const statusColor = dev.status === "connected" ? "#10b981" : dev.status === "error" ? "#ef4444" : "#4f46e5";
              return (
                <div key={dev.id} style={{ background: "#fff", border: `1.5px solid ${dev.status === "error" ? "#fecaca" : dev.status === "connected" ? "#bbf7d0" : "#e0e7ff"}`, borderRadius: 14, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, animation: "fadeSlide .3s ease-out" }}>
                  <StatusIcon style={{ width: 20, height: 20, color: statusColor, flexShrink: 0, animation: dev.status === "connecting" || dev.status === "testing" ? "spin .8s linear infinite" : "none" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{dev.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, background: dev.status === "connected" ? "#d1fae5" : dev.status === "error" ? "#fee2e2" : "#ede9fe", color: dev.status === "connected" ? "#065f46" : dev.status === "error" ? "#dc2626" : "#4f46e5", padding: "2px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {dev.status === "connecting" ? "Connexion…" : dev.status === "testing" ? "Test…" : dev.status === "connected" ? "Connecté" : "Erreur"}
                      </span>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{dev.protocol}{dev.info ? ` · ${dev.info}` : ""}</div>
                    {dev.extra  && <div style={{ fontSize: 12, fontWeight: 700, color: "#4f46e5", marginTop: 2 }}>{dev.extra}</div>}
                    {dev.error  && <div style={{ fontSize: 11, color: "#ef4444", marginTop: 2 }}>{dev.error}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    {dev.id === "printer" && dev.status === "connected" && (
                      <button onClick={testPrint} style={{ height: 34, padding: "0 12px", borderRadius: 9, background: "#ede9fe", color: "#4f46e5", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                        <Play style={{ width: 12, height: 12 }} /> Test
                      </button>
                    )}
                    {dev.id === "drawer" && dev.status === "connected" && (
                      <button onClick={openDrawer} style={{ height: 34, padding: "0 12px", borderRadius: 9, background: "#fef3c7", color: "#d97706", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                        <Archive style={{ width: 12, height: 12 }} /> Ouvrir
                      </button>
                    )}
                    {dev.id === "scale" && dev.status === "connected" && (
                      <button onClick={connectScale} style={{ height: 34, padding: "0 12px", borderRadius: 9, background: "#f0fdf4", color: "#10b981", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
                        <RefreshCw style={{ width: 12, height: 12 }} /> Peser
                      </button>
                    )}
                    <button onClick={() => disconnect(dev)} style={{ height: 34, width: 34, borderRadius: 9, background: "#f8fafc", color: "#94a3b8", fontWeight: 700, fontSize: 12, border: "1px solid #e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Unplug style={{ width: 14, height: 14 }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Cartes de connexion */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12, marginBottom: 32 }}>
        {deviceCards.map(({ id, label, Icon, proto, action }) => {
          const connected = devices.find((d) => d.id === id);
          const isConnected = connected?.status === "connected";
          return (
            <div key={id} style={{ background: "#fff", border: `1.5px solid ${isConnected ? "#bbf7d0" : "#e2e8f0"}`, borderRadius: 18, padding: "20px", transition: "border-color .2s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: isConnected ? "#d1fae5" : "#f8fafc", border: `1px solid ${isConnected ? "#6ee7b7" : "#e2e8f0"}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 20, height: 20, color: isConnected ? "#059669" : "#64748b" }} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{label}</div>
                  <div style={{ fontSize: 11, color: "#94a3b8" }}>{proto}</div>
                </div>
              </div>
              <button
                onClick={() => action()}
                disabled={connected?.status === "connecting" || connected?.status === "testing"}
                style={{ width: "100%", height: 38, borderRadius: 10, border: "none", background: isConnected ? "#0f172a" : "linear-gradient(135deg,#4f46e5,#6366f1)", color: "#fff", fontWeight: 700, fontSize: 13, cursor: (connected?.status === "connecting" || connected?.status === "testing") ? "default" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, opacity: (connected?.status === "connecting" || connected?.status === "testing") ? 0.6 : 1 }}>
                {connected?.status === "connecting" || connected?.status === "testing"
                  ? <><Loader2 style={{ width: 14, height: 14, animation: "spin .8s linear infinite" }} /> En cours…</>
                  : isConnected
                    ? <><RefreshCw style={{ width: 14, height: 14 }} /> Reconnecter</>
                    : <><Plug style={{ width: 14, height: 14 }} /> Connecter</>}
              </button>
            </div>
          );
        })}
      </div>

      {/* ══ Scanning overlay ════════════════════════════════════════════ */}
      {auditState === "scanning" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,.85)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ position: "relative", width: 160, height: 160, marginBottom: 40 }}>
            <div style={{ position: "absolute", inset: -28, borderRadius: "50%", border: "1.5px solid rgba(99,102,241,.2)", animation: "ping3 2.4s ease-in-out infinite" }} />
            <div style={{ position: "absolute", inset: -14, borderRadius: "50%", border: "1.5px solid rgba(99,102,241,.35)", animation: "ping2 2.4s ease-in-out infinite .2s" }} />
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(99,102,241,.55)", animation: "ping1 2.4s ease-in-out infinite .4s" }} />
            <svg style={{ position: "absolute", inset: 0, animation: "spin 1.5s linear infinite" }} viewBox="0 0 160 160" fill="none">
              <circle cx="80" cy="80" r="74" stroke="url(#g)" strokeWidth="3" strokeLinecap="round" strokeDasharray="120 360" />
              <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stopColor="#818cf8" /><stop offset="100%" stopColor="#4f46e5" stopOpacity="0" /></linearGradient></defs>
            </svg>
            <div style={{ position: "absolute", inset: 10, borderRadius: "50%", background: "linear-gradient(135deg,#312e81,#1e1b4b)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 60px rgba(99,102,241,.5)" }}>
              <div style={{ fontSize: 44 }}>{STEPS[auditStep]?.icon}</div>
            </div>
          </div>
          <div key={auditStep} style={{ fontSize: 16, fontWeight: 600, color: "#e2e8f0", marginBottom: 10, textAlign: "center", animation: "fadeSlide .3s ease-out" }}>{STEPS[auditStep]?.label}</div>
          <div style={{ width: 280, height: 4, background: "rgba(255,255,255,.1)", borderRadius: 99, overflow: "hidden", marginBottom: 28 }}>
            <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#818cf8,#4f46e5)", width: `${auditPct}%`, transition: "width .4s ease" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 280 }}>
            {STEPS.map((s, i) => {
              const done = doneSteps.includes(i);
              const cur  = i === auditStep && !done;
              if (i > auditStep + 1) return null;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, opacity: done ? 1 : cur ? 0.7 : 0.3 }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: done ? "#10b981" : cur ? "#4f46e5" : "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {done ? <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="2,5 4,7 8,3" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
                          : cur ? <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} /> : null}
                  </div>
                  <span style={{ fontSize: 12, color: "#cbd5e1" }}>{s.label}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 20, fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.3)" }}>{auditPct}%</div>
        </div>
      )}

      {/* ══ Rapport d'audit ════════════════════════════════════════════ */}
      {auditState === "done" && sysInfo && (
        <div ref={auditRef} style={{ animation: "revealCard .5s ease-out" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#4f46e5,#7c3aed)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <CheckCircle style={{ width: 18, height: 18, color: "#fff" }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Rapport d&apos;audit</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })} à {new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</div>
              </div>
            </div>
            <button onClick={() => setAuditState("idle")} style={{ height: 34, padding: "0 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <ChevronUp style={{ width: 14, height: 14 }} /> Fermer
            </button>
          </div>

          {/* Score compatibilité */}
          {(() => {
            const apiCount    = Object.values(sysInfo.webApis).filter(Boolean).length;
            const total       = Object.keys(sysInfo.webApis).length;
            const pct         = Math.round((apiCount / total) * 100);
            const color       = pct >= 80 ? "#10b981" : pct >= 50 ? "#f59e0b" : "#ef4444";
            const label       = pct >= 80 ? "Excellent" : pct >= 50 ? "Partiel" : "Limité";
            return (
              <div style={{ background: "#fff", border: "1.5px solid #e2e8f0", borderRadius: 18, padding: "20px 24px", marginBottom: 16, display: "flex", alignItems: "center", gap: 20, animation: "revealCard .5s ease-out .05s both" }}>
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${color}15`, border: `4px solid ${color}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{pct}%</div>
                </div>
                <div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Compatibilité <span style={{ color }}>{label}</span></div>
                  <div style={{ fontSize: 13, color: "#64748b", marginTop: 4 }}>
                    {apiCount}/{total} APIs périphériques disponibles · {sysInfo.portsCount} port(s) série autorisé(s) · {sysInfo.hidCount} HID · {sysInfo.usbCount} USB
                  </div>
                  {pct < 80 && <div style={{ fontSize: 12, color: "#d97706", marginTop: 6, fontWeight: 600 }}>💡 Passez sur Chrome ou Edge pour une compatibilité maximale</div>}
                </div>
              </div>
            );
          })()}

          {/* Système */}
          <AuditSection label="Système & Environnement" icon={<Monitor style={{ width: 13, height: 13 }} />} delay={0} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 10, animation: "revealCard .5s ease-out .1s both" }}>
            <InfoCard label="ÉCRAN"      value={sysInfo.screen.resolution}   sub={`${sysInfo.screen.colorDepth} · @${sysInfo.screen.pixelRatio}`} />
            <InfoCard label="PROCESSEUR" value={`${sysInfo.cpu.cores} cœurs`} sub={sysInfo.cpu.memory ? `${sysInfo.cpu.memory} Go RAM` : "RAM non exposée"} />
            <InfoCard label="PLATEFORME" value={sysInfo.platform.os}          sub={sysInfo.platform.browser} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24, animation: "revealCard .5s ease-out .18s both" }}>
            <InfoCard label="RÉSEAU"    value={sysInfo.network.online ? "En ligne" : "Hors ligne"} sub={sysInfo.network.type ? `${sysInfo.network.type.toUpperCase()} · ${sysInfo.network.speed ?? "—"} Mb/s` : "—"} ok={sysInfo.network.online} />
            <InfoCard label="TACTILE"   value={sysInfo.platform.touchPoints > 0 ? `${sysInfo.platform.touchPoints} points` : "Non tactile"} sub={sysInfo.platform.touchPoints > 0 ? "✓ Compatible tablette" : "Souris / pavé tactile"} />
            <InfoCard label="BATTERIE"  value={sysInfo.battery.level != null ? `${sysInfo.battery.level}%` : "—"} sub={sysInfo.battery.charging ? "⚡ En charge" : sysInfo.battery.level != null ? "Sur batterie" : "Non exposée"} />
          </div>

          {/* Périphériques détectés */}
          <AuditSection label="Périphériques détectés" icon={<Plug style={{ width: 13, height: 13 }} />} delay={200} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10, marginBottom: 24, animation: "revealCard .5s ease-out .25s both" }}>
            {[
              { label: "CAMÉRAS",    value: sysInfo.media.cameras,    icon: "📷" },
              { label: "MICROPHONES",value: sysInfo.media.microphones, icon: "🎤" },
              { label: "PORTS SÉRIE",value: sysInfo.portsCount,        icon: "🔌" },
              { label: "HID USB",    value: sysInfo.hidCount,          icon: "🖱️" },
              { label: "USB",        value: sysInfo.usbCount,          icon: "💾" },
            ].map((d) => (
              <div key={d.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>{d.icon}</span>
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 900, color: d.value > 0 ? "#4f46e5" : "#e2e8f0" }}>{d.value}</span>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8" }}>{d.label}</div>
                <div style={{ fontSize: 11, color: d.value > 0 ? "#0f172a" : "#94a3b8", marginTop: 2 }}>{d.value > 0 ? `${d.value} autorisé${d.value > 1 ? "s" : ""}` : "Aucun autorisé"}</div>
              </div>
            ))}
          </div>

          {/* Web APIs */}
          <AuditSection label="Compatibilité Web APIs" icon={<Globe style={{ width: 13, height: 13 }} />} delay={350} />
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, marginBottom: 24, animation: "revealCard .5s ease-out .4s both" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: 10 }}>
              {Object.entries(sysInfo.webApis).map(([api, ok]) => (
                <div key={api} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: ok ? "#f0fdf4" : "#f8fafc", border: `1px solid ${ok ? "#bbf7d0" : "#e2e8f0"}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: ok ? "#10b981" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {ok
                      ? <svg width="14" height="14" viewBox="0 0 14 14"><polyline points="2,7 5.5,10.5 12,4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
                      : <X style={{ width: 12, height: 12, color: "#94a3b8" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: ok ? "#065f46" : "#64748b" }}>{api}</div>
                    <div style={{ fontSize: 10, color: ok ? "#10b981" : "#94a3b8" }}>{ok ? "✓ Disponible" : "Non supporté"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Infos système détaillées */}
          <AuditSection label="Informations système" icon={<Cpu style={{ width: 13, height: 13 }} />} delay={500} />
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, animation: "revealCard .5s ease-out .55s both" }}>
            {([
              ["Système d'exploitation", sysInfo.platform.os],
              ["Navigateur", sysInfo.platform.browser],
              ["Langue", sysInfo.platform.lang],
              ["Fuseau horaire", sysInfo.platform.timezone],
              ["Résolution écran", sysInfo.screen.resolution],
              ["Profondeur couleur", sysInfo.screen.colorDepth],
              ["Ratio pixel", sysInfo.screen.pixelRatio],
              ["Cœurs CPU", String(sysInfo.cpu.cores)],
              ["RAM", sysInfo.cpu.memory ? `${sysInfo.cpu.memory} Go` : "Non exposée"],
              ["Points tactiles", String(sysInfo.platform.touchPoints)],
              ["État réseau", sysInfo.network.online ? "En ligne" : "Hors ligne"],
              ["Type réseau", sysInfo.network.type?.toUpperCase() || "—"],
              ["Ports série autorisés", String(sysInfo.portsCount)],
              ["Périphériques HID autorisés", String(sysInfo.hidCount)],
              ["Périphériques USB autorisés", String(sysInfo.usbCount)],
            ] as [string, string][]).map(([k, v], i, arr) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 0", borderBottom: i < arr.length - 1 ? "1px solid #f1f5f9" : "none" }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: /Résolution|RAM|Cœurs|Ratio|Ports|HID|USB/.test(k) ? "monospace" : "inherit" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function AuditSection({ label, icon, delay }: { label: string; icon: React.ReactNode; delay: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, animation: `revealCard .4s ease-out ${delay}ms both` }}>
      <div style={{ width: 24, height: 24, borderRadius: 7, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.15em", color: "#64748b" }}>{label}</div>
    </div>
  );
}

function InfoCard({ label, value, sub, ok }: { label: string; value: string; sub?: string; ok?: boolean }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: ok === false ? "#ef4444" : ok === true ? "#10b981" : "#0f172a", marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8" }}>{sub}</div>}
    </div>
  );
}
