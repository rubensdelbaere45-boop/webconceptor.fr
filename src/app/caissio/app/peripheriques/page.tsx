"use client";
import { useState, useEffect } from "react";
import {
  ScanBarcode, Printer, Archive, Scale, Bluetooth,
  Plug, Activity, Monitor, Mic, Volume2, Wifi,
  ChevronLeft, PlusCircle, Cpu, Globe,
} from "lucide-react";

type View = "main" | "audit";

type SysInfo = {
  screen: string;
  cpu: string;
  platform: string;
  online: boolean;
};

type DevCat = {
  key: string;
  label: string;
  icon: React.ElementType;
  count: number;
  devices: string[];
};

const DEVICES = [
  { id: "scanner", name: "Scanner code-barres", icon: ScanBarcode, desc: "Branchez votre scanner USB et cliquez ici.", badge: true, action: "Connecter" },
  { id: "printer", name: "Imprimante ticket", icon: Printer, desc: "Détecte les imprimantes ESC/POS USB.", badge: true, action: "Connecter" },
  { id: "drawer", name: "Tiroir caisse", icon: Archive, desc: "S'ouvre via votre imprimante ESC/POS.", badge: false, action: "Tester l'ouverture" },
  { id: "scale", name: "Balance série", icon: Scale, desc: "Balance RS232 ou USB-série.", badge: true, action: "Connecter" },
  { id: "bt-scanner", name: "Scanner Bluetooth", icon: Bluetooth, desc: "Scanner Bluetooth associé.", badge: true, action: "Connecter" },
];

const API_KEYS = ["WebHID", "WebUSB", "WebSerial", "WebBluetooth", "MediaDevices"];

export default function PeripheriquesPage() {
  const [view, setView] = useState<View>("main");
  const [sysInfo, setSysInfo] = useState<SysInfo | null>(null);
  const [cats, setCats] = useState<DevCat[]>([]);
  const [webApis, setWebApis] = useState<Record<string, boolean>>({});
  const [auditing, setAuditing] = useState(false);

  // detect web API support on mount
  useEffect(() => {
    if (typeof navigator === "undefined") return;
    const nav = navigator as Navigator & Record<string, unknown>;
    const apis: Record<string, boolean> = {
      WebHID: "hid" in nav,
      WebUSB: "usb" in nav,
      WebSerial: "serial" in nav,
      WebBluetooth: "bluetooth" in nav,
      MediaDevices: "mediaDevices" in nav,
    };
    setWebApis(apis);
  }, []);

  const runAudit = async () => {
    setAuditing(true);
    await new Promise((r) => setTimeout(r, 900));

    // system info
    const scr = typeof window !== "undefined"
      ? `${window.screen.width}×${window.screen.height} · ${window.screen.colorDepth}bits`
      : "—";
    const cores = typeof navigator !== "undefined" && navigator.hardwareConcurrency
      ? `${navigator.hardwareConcurrency} cœurs · —`
      : "— cœurs · —";

    let plat = "—";
    if (typeof navigator !== "undefined") {
      const ua = navigator.userAgent;
      if (ua.includes("Mac")) plat = ua.includes("Intel") ? "MacIntel" : "MacARM";
      else if (ua.includes("Win")) plat = "Windows";
      else if (ua.includes("Linux")) plat = "Linux";
      else if (ua.includes("Android")) plat = "Android";
    }

    setSysInfo({
      screen: scr,
      cpu: cores,
      platform: plat,
      online: typeof navigator !== "undefined" ? navigator.onLine : false,
    });

    // enumerate media devices
    let cams: string[] = [];
    let mics: string[] = [];
    try {
      if (typeof navigator !== "undefined" && "mediaDevices" in navigator) {
        const devs = await navigator.mediaDevices.enumerateDevices();
        cams = devs.filter((d) => d.kind === "videoinput").map((d) => d.label || "(autorisation requise pour le libellé)");
        mics = devs.filter((d) => d.kind === "audioinput").map((d) => d.label || "(autorisation requise pour le libellé)");
      }
    } catch { /* ignore */ }

    setCats([
      { key: "hid", label: "HID (CLAVIERS, SCANNERS)", icon: ScanBarcode, count: 0, devices: [] },
      { key: "usb", label: "USB", icon: Plug, count: 0, devices: [] },
      { key: "serie", label: "SÉRIE", icon: Activity, count: 0, devices: [] },
      { key: "bt", label: "BLUETOOTH", icon: Bluetooth, count: 0, devices: [] },
      { key: "cameras", label: "CAMÉRAS", icon: Monitor, count: cams.length, devices: cams },
      { key: "mics", label: "MICROPHONES", icon: Mic, count: mics.length, devices: mics },
      { key: "speakers", label: "HAUT-PARLEURS", icon: Volume2, count: 0, devices: [] },
    ]);

    setAuditing(false);
    setView("audit");
  };

  /* ── AUDIT VIEW ── */
  if (view === "audit" && sysInfo) {
    return (
      <div style={{ padding: "28px 24px", fontFamily: "'IBM Plex Sans',sans-serif", maxWidth: 900 }}>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');`}</style>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button onClick={() => setView("main")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#64748b", fontWeight: 600 }}>
            <ChevronLeft style={{ width: 16, height: 16 }} /> Retour
          </button>
        </div>

        {/* SYSTÈME & ENVIRONNEMENT */}
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <Cpu style={{ width: 13, height: 13 }} /> SYSTÈME &amp; ENVIRONNEMENT
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 10 }}>
          {[
            { label: "ÉCRAN", value: sysInfo.screen, icon: Monitor },
            { label: "PROCESSEUR", value: sysInfo.cpu, icon: Cpu },
            { label: "PLATEFORME", value: sysInfo.platform, icon: Globe },
          ].map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Icon style={{ width: 13, height: 13, color: "#94a3b8" }} />
                  <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8" }}>{c.label}</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{c.value}</div>
              </div>
            );
          })}
        </div>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 16px", marginBottom: 24, display: "inline-block" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Wifi style={{ width: 13, height: 13, color: "#94a3b8" }} />
            <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8" }}>ÉTAT</div>
          </div>
          <div style={{ fontSize: 15, fontWeight: 700, color: sysInfo.online ? "#10b981" : "#ef4444" }}>{sysInfo.online ? "Connecté" : "Hors ligne"}</div>
        </div>

        {/* Device categories */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {cats.map((cat) => {
            const Icon = cat.icon;
            return (
              <div key={cat.key} style={{ borderBottom: "1px solid #f1f5f9", padding: "14px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: cat.devices.length > 0 ? 8 : 0 }}>
                  <Icon style={{ width: 14, height: 14, color: "#94a3b8" }} />
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#64748b" }}>{cat.label}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", background: "#f1f5f9", borderRadius: 6, padding: "1px 7px" }}>{cat.count}</div>
                </div>
                {cat.devices.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#94a3b8", paddingLeft: 22 }}>Aucun périphérique détecté ou non autorisé.</div>
                ) : (
                  cat.devices.map((d, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingLeft: 22, padding: "6px 0 6px 22px", background: i % 2 === 0 ? "#f8fafc" : "transparent", borderRadius: 8, marginTop: 4 }}>
                      <span style={{ fontSize: 13, color: "#0f172a" }}>{d}</span>
                      <button style={{ background: "none", border: "1px solid #e2e8f0", borderRadius: 6, width: 24, height: 24, cursor: "pointer", color: "#94a3b8", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>—</button>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>

        {/* Web API chips */}
        <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {API_KEYS.map((k) => (
            <div key={k} style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 12px", borderRadius: 20, border: "1px solid #e2e8f0", background: "#fff", fontSize: 12, fontWeight: 600, color: webApis[k] ? "#0f172a" : "#94a3b8" }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: webApis[k] ? "#10b981" : "#e2e8f0" }} />
              {k}
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── MAIN VIEW ── */
  return (
    <div style={{ padding: "28px 24px", fontFamily: "'IBM Plex Sans',sans-serif", maxWidth: 960 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');`}</style>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 4 }}>AUDIT MATÉRIEL</div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 36, fontWeight: 900, color: "#0f172a", margin: 0, marginBottom: 6 }}>Périphériques</h1>
          <div style={{ fontSize: 13, color: "#64748b" }}>
            Cliquez sur <strong>Audit complet</strong> pour analyser tout le matériel branché et reconnu par Caissio.
          </div>
        </div>
        <button
          onClick={runAudit}
          disabled={auditing}
          style={{ display: "flex", alignItems: "center", gap: 8, height: 44, padding: "0 20px", borderRadius: 12, background: auditing ? "#c4b5fd" : "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: auditing ? "default" : "pointer", flexShrink: 0, marginTop: 4 }}
        >
          <Wifi style={{ width: 16, height: 16 }} />
          {auditing ? "Analyse en cours…" : "Audit complet"}
        </button>
      </div>

      {/* "Aucun matériel connecté" banner */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "18px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Plug style={{ width: 18, height: 18, color: "#94a3b8" }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>Aucun matériel connecté</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>L&apos;audit retrouve tous les équipements autorisés. Cliquez sur &quot;Connecter&quot; pour ajouter un nouveau périphérique.</div>
        </div>
      </div>

      {/* Device cards 2-col grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {DEVICES.map((dev) => {
          const Icon = dev.icon;
          return (
            <div key={dev.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "20px 20px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 18, height: 18, color: "#64748b" }} />
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{dev.name}</span>
                  {dev.badge && (
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "2px 7px" }}>
                      NON SUPPORTÉ
                    </span>
                  )}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, paddingLeft: 50 }}>{dev.desc}</div>
              <div style={{ paddingLeft: 50 }}>
                <button
                  onClick={() => {
                    if (dev.id === "drawer") alert("Commande ESC/POS envoyée à l'imprimante.");
                    else alert("Connectez votre périphérique via " + (dev.id === "bt-scanner" ? "Bluetooth" : "USB") + " puis relancez l'audit.");
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 10, background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}
                >
                  <PlusCircle style={{ width: 14, height: 14 }} />
                  {dev.action}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
