"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

interface Prospect {
  id: string;
  slug: string;
  name: string;
  city: string;
  address: string;
  distance_km: number;
  phone: string;
  website: string;
  email: string;
  google_rating: number;
  google_reviews_count: number;
  status: string;
  sent_at: string;
  opened_at: string;
  replied_at: string;
  created_at: string;
  project_code?: string | null;
  business_type?: string | null;
  site_quality?: "none" | "poor" | "average" | "good" | null;
  site_audit_score?: number | null;
  site_audit_issues?: string[] | null;
}

// Traduction lisible des issues d'audit (même map que dans /api/prospect/send)
const AUDIT_ISSUE_LABELS: Record<string, string> = {
  no_viewport_mobile: "Site pas adapté au mobile (balise viewport manquante)",
  no_https: "Site pas en HTTPS (alerte sécurité dans les navigateurs)",
  no_meta_description: "Pas de meta description (mauvais référencement Google)",
  no_og_image: "Pas d'image Open Graph (lien moche quand partagé sur WhatsApp/Facebook)",
  no_structured_data: "Pas de données structurées Schema.org (moins bien référencé)",
  no_semantic_html: "HTML non sémantique (structure ancienne)",
  legacy_css: "CSS ancien (pas de Flexbox/Grid modernes)",
  no_favicon: "Pas de favicon (onglet navigateur sans icône)",
  deprecated_tags: "Tags HTML obsolètes (font, center, marquee) — site ancien",
  table_layout: "Layout en <table> (code des années 2000, non responsive)",
  too_many_inline_styles: "Trop de styles inline (généré par un vieil éditeur WYSIWYG)",
  deprecated_plugins: "Flash ou ActiveX détectés (obsolète, ne fonctionne plus)",
  unreachable: "Site injoignable lors de l'audit",
};

const statusColors: Record<string, string> = {
  found: "bg-blue-100 text-blue-700",
  no_email: "bg-gray-100 text-gray-500",
  ready: "bg-yellow-100 text-yellow-700",
  sent: "bg-green-100 text-green-700",
  opened: "bg-emerald-100 text-emerald-700",
  replied: "bg-purple-100 text-purple-700",
  converted: "bg-pink-100 text-pink-700",
  error: "bg-red-100 text-red-700",
};

export default function AdminProspectsPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authed, setAuthed] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("Proxi épicerie France");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchText, setSearchText] = useState("");
  const [batchSize, setBatchSize] = useState(5);
  const [dryRun, setDryRun] = useState(true);
  const [log, setLog] = useState<string[]>([]);

  // State supplémentaire pour Face/Touch ID
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricPrompting, setBiometricPrompting] = useState(false);
  const [biometricError, setBiometricError] = useState<string | null>(null);

  // Autoload : localStorage garde la clé après fermeture du navigateur.
  // Si une credential biométrique a été enregistrée, on la demande en plus.
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Détection support Face/Touch ID via WebAuthn platform authenticator
    if (window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable) {
      window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then((avail) => setBiometricAvailable(avail))
        .catch(() => setBiometricAvailable(false));
    }

    const credId = localStorage.getItem("wc_admin_cred_id");
    if (credId) setBiometricEnabled(true);

    const storedKey = localStorage.getItem("wc_admin_key");
    if (storedKey) {
      setAdminKey(storedKey);
      // Si Face/Touch ID actif → on demande biométrie avant d'auto-logger
      // Sinon → auto-login direct
      if (!credId) {
        setAuthed(true);
      }
      // Sinon on reste sur l'écran de login avec bouton "Se connecter avec Face ID"
    }
  }, []);

  // ═══ WebAuthn : enregistrer Face/Touch ID ═══════════════════════
  const enableBiometric = async () => {
    setBiometricError(null);
    setBiometricPrompting(true);
    try {
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const userId = new Uint8Array(16);
      crypto.getRandomValues(userId);

      const cred = (await navigator.credentials.create({
        publicKey: {
          challenge,
          rp: { name: "WebConceptor Admin", id: window.location.hostname },
          user: { id: userId, name: "admin", displayName: "Admin WebConceptor" },
          pubKeyCredParams: [
            { alg: -7, type: "public-key" },
            { alg: -257, type: "public-key" },
          ],
          authenticatorSelection: {
            authenticatorAttachment: "platform",
            userVerification: "required",
            residentKey: "preferred",
          },
          timeout: 60000,
        },
      })) as PublicKeyCredential | null;

      if (!cred) throw new Error("Pas de credential créée");

      const rawId = new Uint8Array(cred.rawId);
      const credIdBase64 = btoa(String.fromCharCode(...rawId));
      localStorage.setItem("wc_admin_cred_id", credIdBase64);
      setBiometricEnabled(true);
      addLog("✅ Face/Touch ID activé");
    } catch (err) {
      setBiometricError(err instanceof Error ? err.message : "Erreur WebAuthn");
    } finally {
      setBiometricPrompting(false);
    }
  };

  const disableBiometric = () => {
    localStorage.removeItem("wc_admin_cred_id");
    setBiometricEnabled(false);
  };

  // ═══ WebAuthn : authentifier avec Face/Touch ID ════════════════
  const loginBiometric = async () => {
    setBiometricError(null);
    setBiometricPrompting(true);
    try {
      const credIdBase64 = localStorage.getItem("wc_admin_cred_id");
      const storedKey = localStorage.getItem("wc_admin_key");
      if (!credIdBase64 || !storedKey) {
        throw new Error("Aucune credential enregistrée");
      }
      const rawId = Uint8Array.from(atob(credIdBase64), (c) => c.charCodeAt(0));

      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);

      const assertion = (await navigator.credentials.get({
        publicKey: {
          challenge,
          allowCredentials: [{ id: rawId, type: "public-key" }],
          userVerification: "required",
          timeout: 60000,
        },
      })) as PublicKeyCredential | null;

      if (!assertion) throw new Error("Authentification annulée");

      // Success → on active la session
      setAdminKey(storedKey);
      setAuthed(true);
    } catch (err) {
      setBiometricError(err instanceof Error ? err.message : "Erreur Face ID");
    } finally {
      setBiometricPrompting(false);
    }
  };

  const addLog = (msg: string) => {
    setLog((l) => [`${new Date().toLocaleTimeString()} — ${msg}`, ...l].slice(0, 30));
  };

  const loadProspects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/prospect/list?status=${statusFilter}`, {
        headers: { "x-admin-key": adminKey },
      });
      if (res.ok) {
        const data = await res.json();
        setProspects(data.prospects || []);
      }
    } catch {
      // silent
    }
    setLoading(false);
  }, [adminKey, statusFilter]);

  useEffect(() => {
    if (authed) loadProspects();
  }, [authed, loadProspects]);

  const handleFind = async () => {
    setLoading(true);
    addLog(`Recherche : "${searchQuery}"...`);
    try {
      const res = await fetch("/api/prospect/find", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ query: searchQuery }),
      });
      const data = await res.json();
      if (!res.ok) {
        addLog(`❌ ${data.error || "Erreur"}`);
      } else {
        addLog(`✓ ${data.stats.inserted} nouveaux prospects (${data.stats.withEmail} avec email, ${data.stats.skippedNearby} trop proches, ${data.stats.skippedDuplicate} doublons)`);
        loadProspects();
      }
    } catch (err) {
      addLog(`❌ ${err instanceof Error ? err.message : "Erreur"}`);
    }
    setLoading(false);
  };

  const handleSend = async (prospectId?: string) => {
    setLoading(true);
    addLog(dryRun ? "Test (dry-run) — génération maquettes..." : "Envoi en cours...");
    try {
      const res = await fetch("/api/prospect/send", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({
          prospect_id: prospectId,
          batch_size: batchSize,
          dry_run: dryRun,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        addLog(`❌ ${data.error || "Erreur"}`);
      } else {
        const sent = data.results?.filter((r: { status: string }) => r.status === "sent" || r.status === "ready").length || 0;
        addLog(`✓ ${sent}/${data.processed} ${dryRun ? "maquettes générées" : "emails envoyés"}`);
        loadProspects();
      }
    } catch (err) {
      addLog(`❌ ${err instanceof Error ? err.message : "Erreur"}`);
    }
    setLoading(false);
  };

  const handleExport = (p: Prospect) => {
    // Download the mockup HTML via the export endpoint.
    // We put the key in the URL param (safe because it's the user's own browser).
    const url = `/api/prospect/export?id=${encodeURIComponent(p.id)}&key=${encodeURIComponent(adminKey)}`;
    // Open in a same-tab navigation → triggers the Content-Disposition attachment
    const a = document.createElement("a");
    a.href = url;
    a.download = `mockup-${p.slug || p.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    addLog(`📦 Export HTML lancé : ${p.name}`);
  };

  const handleGenerateCode = async (p: Prospect) => {
    if (p.project_code) {
      // Already has a code → copy it + show
      const msg =
        `Code existant pour ${p.name} :\n\n` +
        `CODE : ${p.project_code}\n` +
        `Lien : https://webconceptor.fr/code?c=${p.project_code}\n\n` +
        `(code copié dans le presse-papier)`;
      alert(msg);
      navigator.clipboard?.writeText(p.project_code).catch(() => {});
      return;
    }
    if (!confirm(`Générer un code PIN pour ${p.name} ?\n\nCela créera un projet Stripe à 599 € lié à sa maquette. Code seulement, pas d'email envoyé.`)) {
      return;
    }
    setLoading(true);
    addLog(`Génération code PIN pour ${p.name}...`);
    try {
      const res = await fetch("/api/prospect/generate-code", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ prospect_id: p.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        addLog(`❌ ${data.error || "Erreur"}`);
        alert(`Erreur : ${data.error || "inconnue"}`);
      } else {
        addLog(`✅ Code ${data.code} généré pour ${p.name}`);
        navigator.clipboard?.writeText(data.code).catch(() => {});
        alert(
          `✅ Code PIN généré !\n\n` +
          `CODE : ${data.code}\n` +
          `(copié dans le presse-papier)\n\n` +
          `Lien client : ${data.code_url}`
        );
        loadProspects();
      }
    } catch (err) {
      addLog(`❌ ${err instanceof Error ? err.message : "Erreur"}`);
    }
    setLoading(false);
  };

  const handleCallScript = async (p: Prospect) => {
    setLoading(true);
    addLog(`Génération script d'appel pour ${p.name}...`);
    try {
      const res = await fetch("/api/prospect/call-script", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ prospect_id: p.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        addLog(`❌ ${data.error || "Erreur"}`);
        alert(`Erreur : ${data.error || "inconnue"}`);
        return;
      }
      const s = data.script;

      // Bloc audit : les points concrets à sortir pendant l'appel pour montrer
      // qu'on a regardé son site avant. On utilise les données RENVOYÉES par l'API
      // (qui inclut l'audit à la volée pour les prospects anciens), fallback sur
      // les données du state local si l'API ne les a pas.
      const audit = data.audit || {};
      const auditQuality: string = audit.site_quality ?? p.site_quality ?? null;
      const auditScore: number | null = audit.site_audit_score ?? p.site_audit_score ?? null;
      const auditIssues: string[] = Array.isArray(audit.site_audit_issues)
        ? audit.site_audit_issues
        : Array.isArray(p.site_audit_issues) ? p.site_audit_issues : [];
      const websiteUrl: string = audit.website || p.website || "";

      let auditBlock = "";
      if (auditQuality === "none") {
        auditBlock =
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🆕 CE PROSPECT N'A PAS DE SITE\n\n` +
          `Argument clé : aujourd'hui, un commerce sans site, c'est 3 clients\n` +
          `sur 4 qui cherchent sur Google ne vous trouvent pas. Notre maquette\n` +
          `répond à ce besoin pile — visibilité, réservations, crédibilité.\n\n`;
      } else if (auditIssues.length > 0) {
        const issueLines = auditIssues
          .map((key: string) => `• ${AUDIT_ISSUE_LABELS[key] || key}`)
          .slice(0, 8)
          .join("\n");
        const scoreLine = auditScore != null ? ` (score audit : ${auditScore}/100)` : "";
        auditBlock =
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `🔍 POINTS D'AMÉLIORATION DE SON SITE ACTUEL${scoreLine}\n` +
          `(à ressortir si la personne dit "j'ai déjà un site")\n\n` +
          issueLines +
          `\n\nSon site actuel : ${websiteUrl || "—"}\n\n`;
      } else if (websiteUrl) {
        // On a un site mais pas d'issues détectées → son site est correct.
        auditBlock =
          `━━━━━━━━━━━━━━━━━━━━\n` +
          `ℹ️ SITE ACTUEL : ${websiteUrl}\n` +
          `(Audit : ${auditQuality || "?"}${auditScore != null ? ` — ${auditScore}/100` : ""})\n` +
          `Aucun problème technique majeur détecté. Angle de vente : design plus moderne,\n` +
          `module de réservation sans commission, espace admin simple.\n\n`;
      }

      // Discovery questions : à poser pendant l'appel après l'ouverture
      const discoveryBlock = Array.isArray(s.discoveryQuestions) && s.discoveryQuestions.length > 0
        ? `━━━━━━━━━━━━━━━━━━━━\n` +
          `❓ QUESTIONS À POSER PENDANT L'APPEL\n\n` +
          s.discoveryQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join("\n") +
          `\n\n`
        : "";

      const fullScript =
        `🎬 SCRIPT D'APPEL — ${p.name}\n` +
        (p.phone ? `📞 ${p.phone}\n` : "") +
        (p.city ? `📍 ${p.city}\n` : "") +
        (p.google_rating ? `⭐ ${p.google_rating}/5 (${p.google_reviews_count || 0} avis)\n` : "") +
        `\n━━━━━━━━━━━━━━━━━━━━\n` +
        `OUVERTURE (lis mot à mot) :\n\n` +
        `« ${s.opening} »\n\n` +
        auditBlock +
        discoveryBlock +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `SI HÉSITATION :\n\n` +
        s.hooks.map((h: string, i: number) => `${i + 1}. ${h}`).join("\n") +
        `\n\n━━━━━━━━━━━━━━━━━━━━\n` +
        `OBJECTIONS :\n\n` +
        s.objectionHandlers.map((o: string) => `• ${o}`).join("\n") +
        `\n\n━━━━━━━━━━━━━━━━━━━━\n` +
        `✅ Copié dans le presse-papier.`;
      navigator.clipboard?.writeText(fullScript).catch(() => {});
      alert(fullScript);
      addLog(`🎬 Script généré pour ${p.name}`);
    } catch (err) {
      addLog(`❌ ${err instanceof Error ? err.message : "Erreur"}`);
    }
    setLoading(false);
  };

  const handleSendCodeEmail = async (p: Prospect) => {
    const action = p.project_code ? "Renvoyer" : "Générer et envoyer";
    if (!p.email) {
      alert(`${p.name} n'a pas d'email. Impossible d'envoyer.`);
      return;
    }
    if (!confirm(`${action} l'email avec le code à ${p.name} (${p.email}) ?\n\nL'email premium sera envoyé depuis contact@webconceptor.fr.`)) {
      return;
    }
    setLoading(true);
    addLog(`Envoi email code à ${p.name}...`);
    try {
      const res = await fetch("/api/prospect/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ prospect_id: p.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        addLog(`❌ ${data.error || "Erreur"}`);
        alert(`Erreur : ${data.error || "inconnue"}`);
      } else {
        addLog(`📧 Code ${data.code} envoyé à ${data.sent_to}`);
        alert(
          `📧 Email envoyé !\n\n` +
          `Destinataire : ${data.sent_to}\n` +
          `Code : ${data.code}\n\n` +
          `Le client a reçu un email premium avec le code bien visible, ` +
          `le bouton vers /code, le lien pour revoir sa maquette, ` +
          `et le détail des délais (5j site seul / 7j avec option Sérénité).`
        );
        loadProspects();
      }
    } catch (err) {
      addLog(`❌ ${err instanceof Error ? err.message : "Erreur"}`);
    }
    setLoading(false);
  };

  // Filtrage par type (client-side) : restaurant / epicerie / all
  // Filtrage par type
  const typeFiltered = typeFilter === "all"
    ? prospects
    : prospects.filter((p) => (p.business_type || "epicerie") === typeFilter);

  // Recherche texte intelligente : normalise accents + case, match dans plusieurs champs
  const normalize = (s: string): string =>
    s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const filteredProspects = (() => {
    const q = searchText.trim();
    if (!q) return typeFiltered;
    const terms = normalize(q).split(/\s+/).filter(Boolean);
    return typeFiltered.filter((p) => {
      const haystack = normalize(
        [
          p.name,
          p.city,
          p.address,
          p.email,
          p.phone,
          p.website,
          p.project_code || "",
          p.business_type || "",
          p.status,
        ].filter(Boolean).join(" ")
      );
      // Tous les termes doivent matcher (AND)
      return terms.every((t) => haystack.includes(t));
    });
  })();

  const stats = {
    total: filteredProspects.length,
    with_email: filteredProspects.filter((p) => p.email).length,
    sent: filteredProspects.filter((p) => p.status === "sent" || p.status === "opened" || p.status === "replied").length,
    opened: filteredProspects.filter((p) => p.status === "opened" || p.status === "replied").length,
    replied: filteredProspects.filter((p) => p.status === "replied" || p.status === "converted").length,
  };

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 bg-gray-50">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Link href="/" className="text-lg font-bold tracking-tight inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-sm" />Web<span className="text-blue-600">Conceptor</span>
            </Link>
            <h1 className="text-2xl font-bold tracking-tight mt-6">Prospection</h1>
            <p className="text-sm text-gray-500 mt-2">Espace reserve</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            {/* Face/Touch ID button si enregistré */}
            {biometricEnabled && (
              <>
                <button
                  onClick={loginBiometric}
                  disabled={biometricPrompting}
                  className="w-full py-4 mb-4 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-lg text-sm font-semibold hover:from-blue-700 hover:to-blue-800 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4"/>
                  </svg>
                  {biometricPrompting ? "Authentification..." : "Se connecter avec Face ID / Touch ID"}
                </button>
                <div className="text-center text-[11px] text-gray-400 mb-4">ou connexion classique</div>
              </>
            )}

            <form onSubmit={(e) => { e.preventDefault(); if (typeof window !== "undefined") localStorage.setItem("wc_admin_key", adminKey); setAuthed(true); }} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Cle admin</label>
                <input
                  type="password"
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm bg-white text-black focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  placeholder="Votre cle secrete"
                />
              </div>
              <button type="submit" className="w-full py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition">
                Acceder
              </button>
            </form>

            {biometricError && (
              <p className="mt-3 text-[12px] text-red-600 text-center">{biometricError}</p>
            )}
          </div>

          {biometricAvailable && !biometricEnabled && (
            <p className="text-center text-[11px] text-gray-500 mt-4">
              💡 Astuce : après connexion, activez Face ID / Touch ID pour un login instantané.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="h-14 px-6 flex items-center justify-between border-b border-[#f5f5f5] bg-white">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 bg-[#0066ff] rounded-md flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">W</span>
          </span>
          <span className="text-[14px] font-semibold tracking-tight">
            Web<span className="text-[#0066ff]">Conceptor</span>
            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded">PROSPECTION</span>
          </span>
        </Link>
        <div className="flex gap-3 text-[13px] items-center">
          <Link href="/admin" className="text-[#737373] hover:text-[#0a0a0a]">← Admin projets</Link>
          {biometricAvailable && !biometricEnabled && (
            <button
              onClick={enableBiometric}
              disabled={biometricPrompting}
              className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[12px] font-semibold hover:bg-blue-100 transition disabled:opacity-50"
              title="Active Face ID / Touch ID pour les prochaines connexions"
            >
              🔒 Activer Face ID
            </button>
          )}
          {biometricEnabled && (
            <button
              onClick={disableBiometric}
              className="text-[12px] text-green-700 border border-green-200 bg-green-50 px-2 py-1 rounded-lg font-medium"
              title="Face ID activé — cliquer pour désactiver"
            >
              ✓ Face ID actif
            </button>
          )}
          <button onClick={() => { if (typeof window !== "undefined") { localStorage.removeItem("wc_admin_key"); localStorage.removeItem("wc_admin_cred_id"); } setAuthed(false); setBiometricEnabled(false); }} className="text-[#a3a3a3] hover:text-[#0a0a0a]">Deconnexion</button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold tracking-tight mb-1">Prospection automatisée</h1>
        <p className="text-[#737373] text-[14px] mb-8">Recherche Google Maps · filtre 350 km autour d&apos;Aubenton · maquettes personnalisées + emails automatiques</p>

        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mb-8">
          {[
            { label: "Total", val: stats.total, color: "text-black" },
            { label: "Avec email", val: stats.with_email, color: "text-blue-600" },
            { label: "Envoyés", val: stats.sent, color: "text-green-600" },
            { label: "Ouverts", val: stats.opened, color: "text-emerald-600" },
            { label: "Répondus", val: stats.replied, color: "text-purple-600" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-5">
              <p className={`text-3xl font-extrabold tracking-tight ${s.color}`}>{s.val}</p>
              <p className="text-[12px] text-gray-400 mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="grid md:grid-cols-2 gap-4 mb-8">
          {/* Find */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h2 className="text-base font-semibold mb-4">1. Chercher de nouveaux prospects</h2>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full mb-3 px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              placeholder="Ex: Proxi épicerie France"
            />
            <p className="text-[11px] text-gray-500 mb-4">
              Google Maps cherche jusqu&apos;a 20 résultats par requête. Les magasins à moins de 350&nbsp;km d&apos;Aubenton sont automatiquement exclus.
            </p>
            <button
              onClick={handleFind}
              disabled={loading || !searchQuery.trim()}
              className="w-full py-2.5 bg-[#0066ff] text-white rounded-lg text-sm font-semibold hover:bg-[#0052cc] transition disabled:opacity-50"
            >
              {loading ? "Recherche..." : "Lancer la recherche"}
            </button>
          </div>

          {/* Send */}
          <div className="bg-white border border-gray-100 rounded-xl p-6">
            <h2 className="text-base font-semibold mb-4">2. Envoyer les emails</h2>
            <div className="flex items-center gap-3 mb-3">
              <label className="text-[13px] text-gray-700">Batch :</label>
              <select
                value={batchSize}
                onChange={(e) => setBatchSize(Number(e.target.value))}
                className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm"
              >
                {[1, 3, 5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>{n} prospect{n > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-[13px] text-gray-700 mb-4 cursor-pointer">
              <input
                type="checkbox"
                checked={dryRun}
                onChange={(e) => setDryRun(e.target.checked)}
                className="rounded"
              />
              <span>Mode test (génère la maquette mais n&apos;envoie pas l&apos;email)</span>
            </label>
            <p className="text-[11px] text-gray-500 mb-4">
              Traite les prospects au statut &laquo;&nbsp;found&nbsp;&raquo; qui ont un email. Generation de maquette via Claude Haiku, envoi via Brevo, notif Telegram.
            </p>
            <button
              onClick={() => handleSend()}
              disabled={loading}
              className="w-full py-2.5 bg-black text-white rounded-lg text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50"
            >
              {loading ? "En cours..." : dryRun ? "Générer les maquettes (test)" : `Envoyer ${batchSize} emails`}
            </button>
          </div>
        </div>

        {/* Barre de recherche intelligente */}
        <div className="mb-4 relative">
          <div className="relative">
            <svg
              width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round"
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            >
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.3-4.3"/>
            </svg>
            <input
              type="search"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Rechercher par nom, ville, email, téléphone, code PIN…"
              className="w-full pl-11 pr-10 py-3 border border-gray-200 rounded-xl text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
              autoComplete="off"
            />
            {searchText && (
              <button
                onClick={() => setSearchText("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center transition"
                title="Effacer"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
          {searchText && (
            <p className="mt-2 text-[12px] text-gray-500">
              <strong className="text-gray-700">{filteredProspects.length}</strong> résultat{filteredProspects.length !== 1 ? "s" : ""} pour &laquo;&nbsp;{searchText}&nbsp;&raquo;
            </p>
          )}
        </div>

        {/* Filter par type de commerce */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 mr-2">Type :</span>
          {[
            { value: "all", label: "Tous", emoji: "" },
            { value: "restaurant", label: "Restaurants", emoji: "🍽️" },
            { value: "boulangerie", label: "Boulangeries", emoji: "🥐" },
            { value: "patisserie", label: "Pâtisseries", emoji: "🧁" },
            { value: "cafe", label: "Cafés", emoji: "☕" },
            { value: "glacier", label: "Glaciers", emoji: "🍦" },
            { value: "coiffeur", label: "Coiffeurs", emoji: "💇" },
            { value: "institut", label: "Instituts beauté", emoji: "💅" },
            { value: "plombier", label: "Plombiers", emoji: "🔧" },
            { value: "electricien", label: "Électriciens", emoji: "⚡" },
            { value: "garage", label: "Garages", emoji: "🔩" },
            { value: "dentiste", label: "Dentistes", emoji: "🦷" },
            { value: "osteo", label: "Ostéos / Kinés", emoji: "🩺" },
            { value: "salle_sport", label: "Salles de sport", emoji: "💪" },
            { value: "fleuriste", label: "Fleuristes", emoji: "💐" },
            { value: "auto_ecole", label: "Auto-écoles", emoji: "🚗" },
            { value: "epicerie", label: "Épiceries (Proxi)", emoji: "🛒" },
          ].map((t) => (
            <button
              key={t.value}
              onClick={() => setTypeFilter(t.value)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition ${
                typeFilter === t.value
                  ? "bg-[#0066ff] text-white shadow-sm"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[#0066ff] hover:text-[#0066ff]"
              }`}
            >
              {t.emoji} {t.label}
            </button>
          ))}
        </div>

        {/* Filter par statut */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2 flex-wrap">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-gray-500 mr-2 self-center">Statut :</span>
            {["all", "found", "no_email", "ready", "sent", "opened", "replied", "error"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition ${
                  statusFilter === s
                    ? "bg-[#0a0a0a] text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-gray-400"
                }`}
              >
                {s === "all" ? "Tous" : s}
              </button>
            ))}
          </div>
          <button
            onClick={loadProspects}
            disabled={loading}
            className="text-[13px] text-[#0066ff] hover:underline"
          >
            Rafraichir
          </button>
        </div>

        {/* Log */}
        {log.length > 0 && (
          <div className="bg-black text-green-400 font-mono text-[11px] rounded-lg p-4 mb-4 max-h-40 overflow-y-auto">
            {log.map((l, i) => (
              <div key={i}>{l}</div>
            ))}
          </div>
        )}

        {/* Prospects list */}
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          {filteredProspects.length === 0 ? (
            <div className="p-12 text-center text-[#a3a3a3] text-[14px]">
              Aucun prospect. Lancez une recherche pour commencer.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredProspects.map((p) => {
                const colorClass = statusColors[p.status] || "bg-gray-100 text-gray-500";
                return (
                  <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-gray-50">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-[14px] font-semibold truncate">{p.name}</p>
                        <span className="text-[11px]">
                          {({
                            restaurant: "🍽️",
                            boulangerie: "🥐",
                            patisserie: "🧁",
                            cafe: "☕",
                            glacier: "🍦",
                            coiffeur: "💇",
                            institut: "💅",
                            plombier: "🔧",
                            electricien: "⚡",
                            garage: "🔩",
                            dentiste: "🦷",
                            osteo: "🩺",
                            salle_sport: "💪",
                            fleuriste: "💐",
                            auto_ecole: "🚗",
                            epicerie: "🛒",
                          } as Record<string, string>)[p.business_type || "epicerie"] || "•"}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${colorClass}`}>
                          {p.status}
                        </span>
                        {p.google_rating && (
                          <span className="text-[11px] text-amber-600 flex items-center gap-0.5">
                            ★ {p.google_rating} ({p.google_reviews_count || 0})
                          </span>
                        )}
                        {p.project_code && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-100 text-indigo-700">
                            PIN {p.project_code}
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-gray-500 truncate">
                        {p.city} &middot; {p.distance_km} km &middot; {p.email || "pas d'email"}{p.phone ? ` · ${p.phone}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {p.slug && (
                        <a
                          href={`/prospects/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => {
                            // Force l'ouverture en nouvel onglet via JS (certains
                            // navigateurs mobiles Safari ignorent target="_blank"
                            // sur les taps, ce qui navigue dans la MÊME fenêtre et
                            // déconnecte l'admin quand on fait "retour").
                            e.preventDefault();
                            window.open(`/prospects/${p.slug}`, "_blank", "noopener,noreferrer");
                          }}
                          className="px-2.5 py-1.5 text-[11px] font-medium border border-gray-200 rounded-lg hover:bg-gray-100 transition"
                          title="Voir la maquette en ligne (nouvel onglet)"
                        >
                          Maquette →
                        </a>
                      )}
                      {p.email && p.status === "found" && (
                        <button
                          onClick={() => handleSend(p.id)}
                          disabled={loading}
                          className="px-2.5 py-1.5 text-[11px] font-semibold bg-[#0066ff] text-white rounded-lg hover:bg-[#0052cc] transition disabled:opacity-50"
                          title={dryRun ? "Générer la maquette sans envoyer" : "Envoyer l'email au prospect"}
                        >
                          {dryRun ? "Générer" : "Envoyer"}
                        </button>
                      )}
                      {/* Appeler directement — link tel: lance FaceTime / Continuity sur Mac */}
                      {p.phone && (
                        <a
                          href={`tel:${p.phone.replace(/[^0-9+]/g, "")}`}
                          className="px-2.5 py-1.5 text-[11px] font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition inline-flex items-center gap-1"
                          title={`Appeler ${p.phone} (FaceTime/Continuity)`}
                        >
                          📞 Appeler
                        </a>
                      )}
                      {/* Script d'appel — dès qu'une maquette existe + tél disponible */}
                      {p.phone && ["ready", "sent", "opened", "replied", "converted"].includes(p.status) && (
                        <button
                          onClick={() => handleCallScript(p)}
                          disabled={loading}
                          className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition disabled:opacity-50 ${
                            p.status === "opened" || p.status === "replied"
                              ? "bg-red-100 text-red-700 border border-red-300 hover:bg-red-200"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                          title="Génère un script d'appel personnalisé IA pour ce prospect"
                        >
                          🎬 Script
                        </button>
                      )}
                      {/* Export HTML — disponible dès qu'une maquette existe */}
                      {["ready", "sent", "opened", "replied", "converted"].includes(p.status) && (
                        <button
                          onClick={() => handleExport(p)}
                          disabled={loading}
                          className="px-2.5 py-1.5 text-[11px] font-medium border border-gray-200 rounded-lg hover:bg-gray-100 transition disabled:opacity-50"
                          title="Télécharger le HTML de la maquette"
                        >
                          📦
                        </button>
                      )}
                      {/* Générer / afficher code PIN — disponible dès qu'une maquette existe */}
                      {["ready", "sent", "opened", "replied", "converted"].includes(p.status) && (
                        <button
                          onClick={() => handleGenerateCode(p)}
                          disabled={loading}
                          className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition disabled:opacity-50 ${
                            p.project_code
                              ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border border-indigo-300"
                              : "bg-black text-white hover:bg-gray-800"
                          }`}
                          title={p.project_code ? `Afficher le code ${p.project_code}` : "Générer un code PIN sans email"}
                        >
                          {p.project_code ? `🔐 ${p.project_code}` : "🔐 Code"}
                        </button>
                      )}
                      {/* Envoyer code par email premium — dès qu'une maquette + email existent */}
                      {p.email && ["ready", "sent", "opened", "replied", "converted"].includes(p.status) && (
                        <button
                          onClick={() => handleSendCodeEmail(p)}
                          disabled={loading}
                          className="px-2.5 py-1.5 text-[11px] font-semibold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition disabled:opacity-50"
                          title={p.project_code
                            ? `Renvoyer l'email avec le code ${p.project_code} à ${p.email}`
                            : `Générer un code + envoyer email premium à ${p.email}`}
                        >
                          {p.project_code ? "📧 Renvoyer" : "📧 Envoyer code"}
                        </button>
                      )}
                      {p.website && (
                        <a
                          href={p.website}
                          target="_blank"
                          rel="noopener"
                          className="text-[11px] text-gray-400 hover:text-[#0066ff] ml-1"
                          title="Voir son site actuel"
                        >
                          site
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
