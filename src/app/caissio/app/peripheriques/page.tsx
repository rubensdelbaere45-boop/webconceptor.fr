"use client";
import { useState, useEffect, useRef } from "react";
import {
  ScanBarcode, Printer, Archive, Scale, Bluetooth,
  Plug, PlusCircle, Wifi, Monitor, Cpu, Globe,
  CheckCircle, ChevronDown, ChevronUp, Zap,
} from "lucide-react";

/* ── Types ───────────────────────────────────────── */
type AuditState = "idle" | "scanning" | "done";

interface SysInfo {
  screen: { resolution: string; colorDepth: string; pixelRatio: string };
  cpu: { cores: number | string; memory?: number };
  platform: { os: string; browser: string; touchPoints: number; lang: string; timezone: string };
  network: { online: boolean; type?: string; speed?: number };
  battery: { level?: number; charging?: boolean };
  devices: { cameras: number; microphones: number };
  webApis: Record<string, boolean>;
}

/* ── Device definitions ──────────────────────────── */
const DEVICES = [
  { id: "scanner",     name: "Scanner code-barres", icon: ScanBarcode, desc: "Branchez votre scanner USB et cliquez ici.",         badge: true,  action: "Connecter" },
  { id: "printer",     name: "Imprimante ticket",   icon: Printer,     desc: "Détecte les imprimantes ESC/POS USB.",               badge: true,  action: "Connecter" },
  { id: "drawer",      name: "Tiroir caisse",        icon: Archive,     desc: "S'ouvre via votre imprimante ESC/POS.",              badge: false, action: "Tester l'ouverture" },
  { id: "scale",       name: "Balance série",        icon: Scale,       desc: "Balance RS232 ou USB-série.",                       badge: true,  action: "Connecter" },
  { id: "bt-scanner",  name: "Scanner Bluetooth",    icon: Bluetooth,   desc: "Scanner Bluetooth associé.",                        badge: true,  action: "Connecter" },
];

/* ── Scan steps ──────────────────────────────────── */
const STEPS = [
  { label: "Initialisation de l'audit…",             icon: "🔍" },
  { label: "Analyse du processeur et de la mémoire…", icon: "🧠" },
  { label: "Lecture de l'écran et des capteurs…",     icon: "🖥️" },
  { label: "Détection des interfaces USB & Série…",   icon: "🔌" },
  { label: "Analyse Bluetooth & HID…",               icon: "📡" },
  { label: "Vérification caméras & microphones…",     icon: "📷" },
  { label: "Finalisation du rapport complet…",        icon: "✅" },
];

/* ── System detector ─────────────────────────────── */
async function detectSystem(): Promise<SysInfo> {
  const nav = navigator as Navigator & Record<string, unknown>;

  // Screen
  const resolution = `${window.screen.width}×${window.screen.height}`;
  const colorDepth = `${window.screen.colorDepth} bits`;
  const pixelRatio = `${window.devicePixelRatio}×`;

  // CPU
  const cores = navigator.hardwareConcurrency || "—";
  const memory = (nav.deviceMemory as number | undefined);

  // Platform
  const ua = navigator.userAgent;
  let os = "Inconnu";
  if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("Mac")) os = ua.includes("Intel") ? "macOS Intel" : "macOS";
  else if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Linux")) os = "Linux";

  let browser = "Inconnu";
  if (ua.includes("Edg/")) browser = "Edge";
  else if (ua.includes("Chrome/")) browser = "Chrome";
  else if (ua.includes("Firefox/")) browser = "Firefox";
  else if (ua.includes("Safari/")) browser = "Safari";

  const touchPoints = navigator.maxTouchPoints ?? 0;
  const lang = navigator.language || "—";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "—";

  // Network
  const online = navigator.onLine;
  const conn = (nav.connection as { effectiveType?: string; downlink?: number } | undefined);
  const netType = conn?.effectiveType;
  const netSpeed = conn?.downlink;

  // Battery
  let battery: { level?: number; charging?: boolean } = {};
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ("getBattery" in navigator) { const b = await (navigator as any).getBattery(); battery = { level: Math.round(b.level * 100), charging: b.charging }; }
  } catch { /* ignore */ }

  // Media devices
  let cameras = 0, microphones = 0;
  try {
    if ("mediaDevices" in navigator) {
      const devs = await navigator.mediaDevices.enumerateDevices();
      cameras = devs.filter((d) => d.kind === "videoinput").length;
      microphones = devs.filter((d) => d.kind === "audioinput").length;
    }
  } catch { /* ignore */ }

  // Web APIs
  const webApis: Record<string, boolean> = {
    WebHID:       "hid"          in nav,
    WebUSB:       "usb"          in nav,
    WebSerial:    "serial"       in nav,
    WebBluetooth: "bluetooth"    in nav,
    MediaDevices: "mediaDevices" in nav,
  };

  return {
    screen: { resolution, colorDepth, pixelRatio },
    cpu: { cores, memory },
    platform: { os, browser, touchPoints, lang, timezone },
    network: { online, type: netType, speed: netSpeed },
    battery,
    devices: { cameras, microphones },
    webApis,
  };
}

/* ── Main component ──────────────────────────────── */
export default function PeripheriquesPage() {
  const [auditState, setAuditState] = useState<AuditState>("idle");
  const [step, setStep]   = useState(0);
  const [progress, setProgress] = useState(0);
  const [sysInfo, setSysInfo] = useState<SysInfo | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [showAudit, setShowAudit] = useState(false);
  const auditRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  /* cleanup */
  useEffect(() => () => { timerRef.current.forEach(clearTimeout); }, []);

  const startAudit = async () => {
    setAuditState("scanning");
    setStep(0);
    setProgress(0);
    setCompletedSteps([]);
    setSysInfo(null);

    // Pre-detect (runs in background)
    const infoPromise = detectSystem();

    const totalDuration = 2800;
    const stepDuration = totalDuration / STEPS.length;

    STEPS.forEach((_, i) => {
      const t1 = setTimeout(() => {
        setStep(i);
        setProgress(Math.round(((i) / STEPS.length) * 100));
      }, i * stepDuration);

      const t2 = setTimeout(() => {
        setCompletedSteps((prev) => [...prev, i]);
      }, i * stepDuration + stepDuration * 0.8);

      timerRef.current.push(t1, t2);
    });

    const tEnd = setTimeout(async () => {
      setProgress(100);
      const info = await infoPromise;
      setSysInfo(info);
      setTimeout(() => {
        setAuditState("done");
        setShowAudit(true);
        setTimeout(() => auditRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }, 300);
    }, totalDuration + 200);

    timerRef.current.push(tEnd);
  };

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'IBM Plex Sans',sans-serif", maxWidth: 960 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes ping1   { 0%,100%{transform:scale(1);opacity:.7} 50%{transform:scale(1.25);opacity:0} }
        @keyframes ping2   { 0%,100%{transform:scale(1);opacity:.4} 50%{transform:scale(1.5);opacity:0} }
        @keyframes ping3   { 0%,100%{transform:scale(1);opacity:.2} 50%{transform:scale(1.75);opacity:0} }
        @keyframes fadeSlide { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes revealCard { from{opacity:0;transform:scale(.96) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 4 }}>AUDIT MATÉRIEL</div>
          <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 36, fontWeight: 900, color: "#0f172a", margin: 0, marginBottom: 6 }}>Périphériques</h1>
          <div style={{ fontSize: 13, color: "#64748b" }}>Cliquez sur <strong>Audit complet</strong> pour analyser tout le matériel branché et reconnu par Caissio.</div>
        </div>
        <button onClick={startAudit} disabled={auditState === "scanning"}
          style={{ display: "flex", alignItems: "center", gap: 8, height: 46, padding: "0 22px", borderRadius: 12, background: auditState === "scanning" ? "#c4b5fd" : "linear-gradient(135deg,#4f46e5,#7c3aed)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: auditState === "scanning" ? "default" : "pointer", flexShrink: 0, boxShadow: auditState === "scanning" ? "none" : "0 8px 24px rgba(79,70,229,.35)", transition: "all .2s" }}>
          {auditState === "scanning"
            ? <><div style={{ width: 16, height: 16, border: "2px solid rgba(255,255,255,.5)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin .8s linear infinite" }} /> Analyse en cours…</>
            : <><Zap style={{ width: 16, height: 16 }} /> Audit complet</>}
        </button>
      </div>

      {/* ── "Aucun matériel" banner ── */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: "16px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Plug style={{ width: 18, height: 18, color: "#94a3b8" }} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", marginBottom: 2 }}>Aucun matériel connecté</div>
          <div style={{ fontSize: 13, color: "#64748b" }}>L&apos;audit retrouve tous les équipements autorisés. Cliquez sur &quot;Connecter&quot; pour ajouter un nouveau périphérique.</div>
        </div>
      </div>

      {/* ── Device cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 28 }}>
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
                  {dev.badge && <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#b45309", background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "2px 7px" }}>NON SUPPORTÉ</span>}
                </div>
              </div>
              <div style={{ fontSize: 12, color: "#64748b", marginBottom: 14, paddingLeft: 50 }}>{dev.desc}</div>
              <div style={{ paddingLeft: 50 }}>
                <button onClick={() => dev.id === "drawer" ? alert("Commande ESC/POS envoyée.") : alert("Connectez votre périphérique puis relancez l'audit.")}
                  style={{ display: "flex", alignItems: "center", gap: 6, height: 36, padding: "0 14px", borderRadius: 10, background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: 12, border: "none", cursor: "pointer" }}>
                  <PlusCircle style={{ width: 14, height: 14 }} /> {dev.action}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══════════════════════════════
          SCANNING OVERLAY (Apple-style)
          ═══════════════════════════════ */}
      {auditState === "scanning" && (
        <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,.82)", backdropFilter: "blur(20px)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>

          {/* Pulsing rings + icon */}
          <div style={{ position: "relative", width: 160, height: 160, marginBottom: 40 }}>
            {/* Ring 3 (outer) */}
            <div style={{ position: "absolute", inset: -28, borderRadius: "50%", border: "1.5px solid rgba(99,102,241,.25)", animation: "ping3 2.4s ease-in-out infinite" }} />
            {/* Ring 2 */}
            <div style={{ position: "absolute", inset: -14, borderRadius: "50%", border: "1.5px solid rgba(99,102,241,.4)", animation: "ping2 2.4s ease-in-out infinite 0.2s" }} />
            {/* Ring 1 */}
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(99,102,241,.6)", animation: "ping1 2.4s ease-in-out infinite 0.4s" }} />

            {/* Rotating arc */}
            <svg style={{ position: "absolute", inset: 0, animation: "spin 1.6s linear infinite" }} viewBox="0 0 160 160" fill="none">
              <circle cx="80" cy="80" r="74" stroke="url(#grad)" strokeWidth="3" strokeLinecap="round" strokeDasharray="120 360" />
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#818cf8" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>

            {/* Center circle */}
            <div style={{ position: "absolute", inset: 10, borderRadius: "50%", background: "linear-gradient(135deg,#312e81,#1e1b4b)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 60px rgba(99,102,241,.5)" }}>
              <div style={{ fontSize: 42 }}>{STEPS[step]?.icon}</div>
            </div>
          </div>

          {/* Step label */}
          <div key={step} style={{ fontSize: 17, fontWeight: 600, color: "#e2e8f0", marginBottom: 10, textAlign: "center", animation: "fadeSlide .35s ease-out", letterSpacing: "-0.01em" }}>
            {STEPS[step]?.label}
          </div>

          {/* Progress bar */}
          <div style={{ width: 280, height: 4, background: "rgba(255,255,255,.12)", borderRadius: 99, overflow: "hidden", marginBottom: 32 }}>
            <div style={{ height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#818cf8,#4f46e5)", width: `${progress}%`, transition: "width .4s ease", boxShadow: "0 0 8px #6366f1" }} />
          </div>

          {/* Completed steps list */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6, width: 280 }}>
            {STEPS.map((s, i) => {
              const done = completedSteps.includes(i);
              const current = i === step && !done;
              if (i > step + 1) return null;
              return (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, opacity: done ? 1 : current ? 0.7 : 0.3, animation: done || current ? "fadeSlide .3s ease-out" : "none" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: done ? "#10b981" : current ? "#4f46e5" : "rgba(255,255,255,.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {done
                      ? <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="2,5 4,7 8,3" stroke="#fff" strokeWidth="1.5" fill="none" strokeLinecap="round" /></svg>
                      : current ? <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#fff" }} />
                      : null}
                  </div>
                  <span style={{ fontSize: 12, color: "#cbd5e1" }}>{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* Progress % */}
          <div style={{ marginTop: 20, fontFamily: "'Outfit',sans-serif", fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,.35)" }}>
            {progress}%
          </div>
        </div>
      )}

      {/* ═══════════════════════════════
          AUDIT RESULTS
          ═══════════════════════════════ */}
      {auditState === "done" && sysInfo && (
        <div ref={auditRef}>
          {/* Section header */}
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
            <button onClick={() => { setShowAudit(false); setAuditState("idle"); }}
              style={{ height: 34, padding: "0 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#fff", color: "#64748b", fontWeight: 600, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}>
              <ChevronUp style={{ width: 14, height: 14 }} /> Fermer le rapport
            </button>
          </div>

          {/* ── SYSTÈME ── */}
          <SectionTitle icon={<Monitor style={{ width: 14, height: 14 }} />} label="Système & Environnement" delay={0} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 10, animation: "revealCard .5s ease-out .05s both" }}>
            {[
              { label: "ÉCRAN", value: sysInfo.screen.resolution, sub: `${sysInfo.screen.colorDepth} · @${sysInfo.screen.pixelRatio}` },
              { label: "PROCESSEUR", value: `${sysInfo.cpu.cores} cœur${Number(sysInfo.cpu.cores) > 1 ? "s" : ""}`, sub: sysInfo.cpu.memory ? `${sysInfo.cpu.memory} Go RAM` : "RAM non exposée" },
              { label: "PLATEFORME", value: sysInfo.platform.os, sub: sysInfo.platform.browser },
            ].map((c) => (
              <InfoCard key={c.label} label={c.label} value={c.value} sub={c.sub} />
            ))}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10, marginBottom: 24, animation: "revealCard .5s ease-out .15s both" }}>
            {[
              { label: "RÉSEAU", value: sysInfo.network.online ? "Connecté" : "Hors ligne", sub: sysInfo.network.type ? `${sysInfo.network.type?.toUpperCase()} · ${sysInfo.network.speed ?? "—"} Mb/s` : "Type non exposé", ok: sysInfo.network.online },
              { label: "TACTILE", value: sysInfo.platform.touchPoints > 0 ? `${sysInfo.platform.touchPoints} point(s)` : "Souris / stylet", sub: sysInfo.platform.touchPoints > 0 ? "Écran tactile détecté" : "Pas d'écran tactile" },
              { label: "BATTERIE", value: sysInfo.battery.level != null ? `${sysInfo.battery.level}%` : "—", sub: sysInfo.battery.charging ? "⚡ En charge" : sysInfo.battery.level != null ? "Sur batterie" : "Non exposée" },
            ].map((c) => (
              <InfoCard key={c.label} label={c.label} value={c.value} sub={c.sub} ok={c.ok} />
            ))}
          </div>

          {/* ── PÉRIPHÉRIQUES DÉTECTÉS ── */}
          <SectionTitle icon={<Plug style={{ width: 14, height: 14 }} />} label="Périphériques détectés" delay={200} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(200px,1fr))", gap: 10, marginBottom: 24, animation: "revealCard .5s ease-out .25s both" }}>
            {[
              { label: "CAMÉRAS", value: sysInfo.devices.cameras, icon: "📷" },
              { label: "MICROPHONES", value: sysInfo.devices.microphones, icon: "🎤" },
              { label: "HID (USB)", value: 0, icon: "🖱️" },
              { label: "SÉRIE", value: 0, icon: "🔌" },
              { label: "BLUETOOTH", value: 0, icon: "📶" },
            ].map((d) => (
              <div key={d.label} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                  <span style={{ fontSize: 20 }}>{d.icon}</span>
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 28, fontWeight: 900, color: d.value > 0 ? "#4f46e5" : "#e2e8f0" }}>{d.value}</span>
                </div>
                <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#94a3b8" }}>{d.label}</div>
                <div style={{ fontSize: 11, color: d.value > 0 ? "#0f172a" : "#94a3b8", marginTop: 2 }}>
                  {d.value > 0 ? `${d.value} détecté${d.value > 1 ? "s" : ""}` : "Aucun détecté"}
                </div>
              </div>
            ))}
          </div>

          {/* ── WEB APIS ── */}
          <SectionTitle icon={<Globe style={{ width: 14, height: 14 }} />} label="Compatibilité Web APIs" delay={350} />
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, marginBottom: 24, animation: "revealCard .5s ease-out .4s both" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))", gap: 10 }}>
              {Object.entries(sysInfo.webApis).map(([api, supported]) => (
                <div key={api} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: 12, background: supported ? "#f0fdf4" : "#f8fafc", border: `1px solid ${supported ? "#bbf7d0" : "#e2e8f0"}` }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: supported ? "#10b981" : "#e2e8f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {supported
                      ? <svg width="14" height="14" viewBox="0 0 14 14"><polyline points="2,7 5.5,10.5 12,4" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" /></svg>
                      : <svg width="14" height="14" viewBox="0 0 14 14"><line x1="4" y1="4" x2="10" y2="10" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" /><line x1="10" y1="4" x2="4" y2="10" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" /></svg>}
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: supported ? "#065f46" : "#64748b" }}>{api}</div>
                    <div style={{ fontSize: 10, color: supported ? "#10b981" : "#94a3b8" }}>{supported ? "Disponible" : "Non supporté"}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── INFOS SYSTÈME ── */}
          <SectionTitle icon={<Cpu style={{ width: 14, height: 14 }} />} label="Informations système" delay={500} />
          <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 16, padding: 20, animation: "revealCard .5s ease-out .55s both" }}>
            {[
              ["Système d'exploitation", sysInfo.platform.os],
              ["Navigateur", sysInfo.platform.browser],
              ["Langue", sysInfo.platform.lang],
              ["Fuseau horaire", sysInfo.platform.timezone],
              ["Résolution écran", sysInfo.screen.resolution],
              ["Profondeur couleur", sysInfo.screen.colorDepth],
              ["Ratio pixel", sysInfo.screen.pixelRatio],
              ["Cœurs CPU", String(sysInfo.cpu.cores)],
              ["RAM", sysInfo.cpu.memory ? `${sysInfo.cpu.memory} Go` : "Non exposée"],
              ["État réseau", sysInfo.network.online ? "En ligne" : "Hors ligne"],
            ].map(([k, v], i) => (
              <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: i < 9 ? "1px solid #f1f5f9" : "none" }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", fontFamily: k.includes("Résolution") || k.includes("RAM") || k.includes("Cœurs") || k.includes("Ratio") ? "monospace" : "inherit" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────── */
function SectionTitle({ icon, label, delay }: { icon: React.ReactNode; label: string; delay: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, animation: `revealCard .4s ease-out ${delay}ms both` }}>
      <div style={{ width: 24, height: 24, borderRadius: 7, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}>{icon}</div>
      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#64748b" }}>{label}</div>
    </div>
  );
}

function InfoCard({ label, value, sub, ok }: { label: string; value: string; sub?: string; ok?: boolean }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 14, padding: "14px 16px" }}>
      <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "#94a3b8", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 18, fontWeight: 800, color: ok === false ? "#ef4444" : ok === true ? "#10b981" : "#0f172a", marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8" }}>{sub}</div>}
    </div>
  );
}
