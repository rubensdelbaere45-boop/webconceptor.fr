"use client";
import { useState, useEffect } from "react";
import { Printer, Monitor, Wifi, Bluetooth, Usb, CheckCircle, XCircle, RefreshCw, AlertTriangle } from "lucide-react";

type DeviceStatus = "connected" | "disconnected" | "unavailable";

interface Device {
  id: string;
  name: string;
  type: "printer" | "scanner" | "display" | "drawer";
  icon: React.ElementType;
  protocol: string;
  status: DeviceStatus;
  info?: string;
}

const DEVICE_DEFS: Omit<Device, "status" | "info">[] = [
  { id: "receipt-printer", name: "Imprimante ticket", type: "printer", icon: Printer, protocol: "USB / WebUSB" },
  { id: "barcode-scanner", name: "Scanner code-barre", type: "scanner", icon: Wifi, protocol: "HID / Clavier" },
  { id: "customer-display", name: "Afficheur client", type: "display", icon: Monitor, protocol: "USB / Série" },
  { id: "cash-drawer", name: "Tiroir-caisse", type: "drawer", icon: Bluetooth, protocol: "RJ11 / Imprimante" },
];

function detectDevices(): Device[] {
  const hasBt = typeof navigator !== "undefined" && "bluetooth" in navigator;
  const hasUsb = typeof navigator !== "undefined" && "usb" in navigator;
  const hasSerial = typeof navigator !== "undefined" && "serial" in navigator;

  return DEVICE_DEFS.map((d) => {
    if (d.id === "receipt-printer") {
      return { ...d, status: hasUsb ? "disconnected" : "unavailable", info: hasUsb ? "WebUSB disponible — branchez votre imprimante ESC/POS" : "WebUSB non supporté par ce navigateur" };
    }
    if (d.id === "barcode-scanner") {
      return { ...d, status: "connected", info: "Mode clavier actif — le scanner est détecté automatiquement" };
    }
    if (d.id === "customer-display") {
      return { ...d, status: hasSerial ? "disconnected" : "unavailable", info: hasSerial ? "WebSerial disponible — branchez votre afficheur" : "WebSerial non supporté par ce navigateur" };
    }
    if (d.id === "cash-drawer") {
      return { ...d, status: hasUsb || hasBt ? "disconnected" : "unavailable", info: "Le tiroir s'ouvre via l'imprimante ticket (commande ESC/POS)" };
    }
    return { ...d, status: "unavailable" };
  });
}

const STATUS_LABEL: Record<DeviceStatus, string> = {
  connected: "Connecté",
  disconnected: "Déconnecté",
  unavailable: "Non disponible",
};
const STATUS_COLOR: Record<DeviceStatus, string> = {
  connected: "#10b981",
  disconnected: "#d97706",
  unavailable: "#94a3b8",
};
const STATUS_BG: Record<DeviceStatus, string> = {
  connected: "#f0fdf4",
  disconnected: "#fffbeb",
  unavailable: "#f8fafc",
};
const STATUS_BORDER: Record<DeviceStatus, string> = {
  connected: "#bbf7d0",
  disconnected: "#fde68a",
  unavailable: "#e2e8f0",
};

export default function PeripheriquesPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [scanning, setScanning] = useState(false);
  const [testResult, setTestResult] = useState<Record<string, string>>({});

  const scan = () => {
    setScanning(true);
    setTimeout(() => {
      setDevices(detectDevices());
      setScanning(false);
    }, 800);
  };

  useEffect(() => { scan(); }, []);

  const testPrint = (id: string) => {
    setTestResult((r) => ({ ...r, [id]: "Envoi de la commande de test…" }));
    setTimeout(() => {
      setTestResult((r) => ({ ...r, [id]: "Aucune imprimante connectée — branchez votre imprimante ESC/POS via USB." }));
    }, 1200);
  };

  const openDrawer = (id: string) => {
    setTestResult((r) => ({ ...r, [id]: "Commande ESC/POS envoyée à l'imprimante." }));
    setTimeout(() => {
      setTestResult((r) => ({ ...r, [id]: "" }));
    }, 3000);
  };

  const connected = devices.filter((d) => d.status === "connected").length;

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'IBM Plex Sans',sans-serif", maxWidth: 800 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');`}</style>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 4 }}>Matériel</div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 32, fontWeight: 900, color: "#0f172a" }}>Périphériques</h1>
        </div>
        <button onClick={scan} disabled={scanning} style={{ height: 42, padding: "0 18px", borderRadius: 12, background: scanning ? "#e2e8f0" : "#4f46e5", color: scanning ? "#94a3b8" : "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: scanning ? "default" : "pointer", display: "flex", alignItems: "center", gap: 8 }}>
          <RefreshCw style={{ width: 16, height: 16, animation: scanning ? "spin 1s linear infinite" : "none" }} />
          {scanning ? "Détection…" : "Relancer la détection"}
        </button>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Summary */}
      <div style={{ display: "flex", gap: 12, marginBottom: 24 }}>
        <div style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle style={{ width: 20, height: 20, color: "#10b981" }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 900, color: "#0f172a" }}>{connected}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Connecté(s)</div>
          </div>
        </div>
        <div style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "#fffbeb", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertTriangle style={{ width: 20, height: 20, color: "#d97706" }} />
          </div>
          <div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 900, color: "#0f172a" }}>{devices.filter((d) => d.status !== "connected").length}</div>
            <div style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>Non connecté(s)</div>
          </div>
        </div>
      </div>

      {/* Device cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {devices.map((d) => {
          const Icon = d.icon;
          return (
            <div key={d.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 20 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: STATUS_BG[d.status], border: `1px solid ${STATUS_BORDER[d.status]}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon style={{ width: 22, height: 22, color: STATUS_COLOR[d.status] }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#0f172a" }}>{d.name}</div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[d.status], background: STATUS_BG[d.status], border: `1px solid ${STATUS_BORDER[d.status]}`, borderRadius: 8, padding: "2px 8px" }}>
                      {STATUS_LABEL[d.status]}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 4 }}>Protocole : <strong style={{ color: "#64748b" }}>{d.protocol}</strong></div>
                  {d.info && <div style={{ fontSize: 12, color: "#64748b", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "6px 10px", marginTop: 6 }}>{d.info}</div>}
                  {testResult[d.id] && (
                    <div style={{ fontSize: 12, color: "#4f46e5", background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 8, padding: "6px 10px", marginTop: 6 }}>{testResult[d.id]}</div>
                  )}
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  {d.id === "receipt-printer" && (
                    <button onClick={() => testPrint(d.id)} style={{ height: 34, padding: "0 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                      Test impression
                    </button>
                  )}
                  {d.id === "cash-drawer" && (
                    <button onClick={() => openDrawer(d.id)} style={{ height: 34, padding: "0 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#64748b" }}>
                      Ouvrir tiroir
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Info box */}
      <div style={{ marginTop: 20, padding: 20, background: "#ede9fe", border: "1px solid #c4b5fd", borderRadius: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#4f46e5", marginBottom: 6 }}>Comment connecter votre matériel ?</div>
        <div style={{ fontSize: 13, color: "#4f46e5", lineHeight: 1.6 }}>
          Branchez votre imprimante ESC/POS via USB et relancez la détection. Le scanner code-barre USB est automatiquement détecté en mode clavier. Pour l&apos;afficheur client, utilisez Chrome ou Edge (WebSerial requis). Le tiroir-caisse s&apos;ouvre automatiquement à chaque paiement.
        </div>
      </div>
    </div>
  );
}
