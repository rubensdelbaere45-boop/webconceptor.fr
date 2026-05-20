"use client";
import { useState, useEffect } from "react";
import { KeyRound, Check, Store } from "lucide-react";
import { getStoreSettings, saveStoreSettings, getSession, validatePin, setUserPin, type StoreSettings } from "@/lib/caissio-store";

function Inp({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; type?: string; placeholder?: string }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#64748b" }}>{label}</span>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        style={{ height: 42, padding: "0 12px", border: "1px solid #e2e8f0", borderRadius: 10, fontSize: 14, outline: "none", background: "#fff", width: "100%", boxSizing: "border-box" }} />
    </label>
  );
}

export default function ParametresPage() {
  const [settings, setSettings] = useState<StoreSettings>({ name: "" });
  const [saved, setSaved] = useState(false);
  const [pin, setPin] = useState("");
  const [pinOk, setPinOk] = useState<null | boolean>(null);
  const user = getSession();

  useEffect(() => { setSettings(getStoreSettings()); }, []);

  const setS = (k: keyof StoreSettings) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setSettings((s) => ({ ...s, [k]: e.target.value }));

  const save = () => {
    saveStoreSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const savePin = () => {
    if (!/^\d{6}$/.test(pin)) { setPinOk(false); return; }
    setUserPin(pin);
    setPin("");
    setPinOk(true);
    setTimeout(() => setPinOk(null), 2500);
  };

  return (
    <div style={{ padding: "28px 24px", fontFamily: "'IBM Plex Sans',sans-serif", maxWidth: 720 }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@700;800;900&display=swap');`}</style>

      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "#94a3b8", marginBottom: 4 }}>Configuration</div>
        <h1 style={{ fontFamily: "'Outfit',sans-serif", fontSize: 32, fontWeight: 900, color: "#0f172a" }}>Paramètres</h1>
      </div>

      {/* Store identity */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <Store style={{ width: 18, height: 18, color: "#4f46e5" }} />
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Identité du commerce</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div style={{ gridColumn: "1/-1" }}>
            <Inp label="Nom du commerce *" value={settings.name} onChange={setS("name")} />
          </div>
          <Inp label="SIRET" value={settings.siret || ""} onChange={setS("siret")} placeholder="12345678901234" />
          <Inp label="N° TVA intracommunautaire" value={settings.vat_number || ""} onChange={setS("vat_number")} placeholder="FR12345678901" />
          <Inp label="Téléphone" value={settings.phone || ""} onChange={setS("phone")} type="tel" />
          <Inp label="Email" value={settings.email || ""} onChange={setS("email")} type="email" />
          <div style={{ gridColumn: "1/-1" }}>
            <Inp label="Adresse" value={settings.address || ""} onChange={setS("address")} />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <Inp label="URL du logo" value={settings.logo_url || ""} onChange={setS("logo_url")} placeholder="https://…" />
          </div>
          <div style={{ gridColumn: "1/-1" }}>
            <Inp label="Pied de ticket" value={settings.ticket_footer || ""} onChange={setS("ticket_footer")} placeholder="Merci de votre visite !" />
          </div>
        </div>
        <button onClick={save} style={{ marginTop: 20, height: 44, padding: "0 24px", borderRadius: 12, background: saved ? "#10b981" : "#4f46e5", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8, transition: "background .2s" }}>
          <Check style={{ width: 16, height: 16 }} /> {saved ? "Enregistré !" : "Enregistrer"}
        </button>
      </div>

      {/* PIN */}
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 20, padding: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <KeyRound style={{ width: 18, height: 18, color: "#4f46e5" }} />
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 800, color: "#0f172a" }}>Sécurité — PIN</div>
        </div>
        <p style={{ fontSize: 13, color: "#64748b", marginBottom: 16, lineHeight: 1.5 }}>
          Définissez un PIN à 6 chiffres pour le déverrouillage rapide de la caisse.{" "}
          Statut : {user?.pin
            ? <span style={{ color: "#10b981", fontWeight: 700 }}>PIN configuré</span>
            : <span style={{ color: "#d97706", fontWeight: 700 }}>Aucun PIN</span>}
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <input
            type="password" inputMode="numeric" maxLength={6}
            value={pin} onChange={(e) => { setPin(e.target.value.replace(/\D/g, "")); setPinOk(null); }}
            placeholder="••••••"
            style={{ width: 120, height: 48, padding: "0 12px", border: `2px solid ${pinOk === false ? "#fecaca" : "#e2e8f0"}`, borderRadius: 12, fontSize: 24, fontFamily: "monospace", textAlign: "center", letterSpacing: "0.4em", outline: "none", background: "#fff" }}
          />
          <button onClick={savePin} style={{ height: 48, padding: "0 20px", borderRadius: 12, background: "#0f172a", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: "pointer" }}>
            Définir le PIN
          </button>
          {pinOk === true && <span style={{ fontSize: 13, color: "#10b981", fontWeight: 600 }}>✓ PIN mis à jour</span>}
          {pinOk === false && <span style={{ fontSize: 13, color: "#dc2626", fontWeight: 600 }}>PIN invalide (6 chiffres requis)</span>}
        </div>
        <div style={{ marginTop: 12, fontSize: 12, color: "#94a3b8" }}>Le PIN est requis pour déverrouiller la caisse après une période d&apos;inactivité.</div>
      </div>

      {/* Account info */}
      <div style={{ marginTop: 16, padding: "16px 20px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, fontSize: 13, color: "#64748b" }}>
        <strong style={{ color: "#0f172a" }}>Compte :</strong> {user?.name} · {user?.email} · Plan <span style={{ fontWeight: 700, color: "#4f46e5", textTransform: "capitalize" }}>{user?.plan}</span>
      </div>
    </div>
  );
}
