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
  notes?: string | null;
  view_count?: number | null;
  cart_opened_at?: string | null;
  unsubscribed_at?: string | null;
  hot_sms_sent_at?: string | null;
}

/**
 * Verdict APPEL / NE PAS APPELER basé sur site_quality.
 * Règle NON-NÉGOCIABLE : notre maquette template est une PROGRESSION pour les
 * prospects sans site ou avec un site vieux/moche, mais elle est INFÉRIEURE
 * à ce qu'a déjà un prospect qui a investi dans un vrai site pro (e-commerce
 * Wavy/Shopify, site designer, etc.). Les appeler = humiliation garantie.
 */
export type CallVerdict =
  | { level: "GO"; label: string; emoji: string; color: string; bg: string }
  | { level: "STOP"; label: string; emoji: string; color: string; bg: string }
  | { level: "CHECK"; label: string; emoji: string; color: string; bg: string };

function getCallVerdict(p: Prospect): CallVerdict {
  const q = p.site_quality;
  if (q === "none") {
    return { level: "GO", label: "OK — PAS DE SITE", emoji: "🟢", color: "text-emerald-800", bg: "bg-emerald-100 border-emerald-300" };
  }
  if (q === "poor") {
    return { level: "GO", label: "OK — SITE POURRI", emoji: "🟢", color: "text-emerald-800", bg: "bg-emerald-100 border-emerald-300" };
  }
  if (q === "average") {
    return { level: "STOP", label: "NE PAS APPELER — site correct", emoji: "🔴", color: "text-red-800", bg: "bg-red-100 border-red-300" };
  }
  if (q === "good") {
    return { level: "STOP", label: "NE PAS APPELER — site pro", emoji: "🔴", color: "text-red-800", bg: "bg-red-100 border-red-300" };
  }
  // null / pas audité → on vérifie d'abord
  return { level: "CHECK", label: "À VÉRIFIER — regarder son site d'abord", emoji: "🟡", color: "text-amber-800", bg: "bg-amber-100 border-amber-300" };
}

/**
 * Calcule un score de probabilité de conversion pour chaque prospect.
 * Plus le score est haut, plus on a de chances de closer au téléphone.
 *
 * Retourne -1 pour les prospects à EXCLURE (désabonnés, sans téléphone,
 * déjà convertis, déjà appelés aujourd'hui).
 */
function computeCallScore(p: Prospect): { score: number; signals: string[] } {
  const signals: string[] = [];

  // Exclusions dures
  if (p.unsubscribed_at) return { score: -1, signals: [] };
  if (!p.phone) return { score: -1, signals: [] };
  if (p.status === "converted") return { score: -1, signals: [] };
  if (wasCalledToday(p.notes)) return { score: -1, signals: [] };

  let score = 0;
  const vc = p.view_count || 0;

  // Engagement fort : chaque vue de la maquette = +15 pts (signal le plus fort)
  if (vc > 0) {
    score += vc * 15;
    signals.push(`vu ${vc}× sa maquette`);
  }

  // a cliqué sur "J'achète" puis abandonné = HOT (conversion à portée)
  if (p.cart_opened_at) {
    score += 40;
    signals.push("a cliqué J'achète");
  }

  // Réponse au mail = ultra hot
  if (p.replied_at) {
    score += 30;
    signals.push("a répondu au mail");
  }

  // Récence de l'ouverture mail
  if (p.opened_at) {
    const days = Math.floor((Date.now() - new Date(p.opened_at).getTime()) / 86400000);
    if (days >= 0 && days <= 3) {
      score += 10;
      signals.push(days === 0 ? "ouvert mail aujourd'hui" : `ouvert mail il y a ${days}j`);
    } else if (days <= 7) {
      score += 5;
      signals.push(`ouvert il y a ${days}j`);
    }
  }

  // Qualification : ils ont BESOIN d'un site
  if (p.site_quality === "none" || p.site_quality === "poor") {
    score += 15;
    if (p.site_quality === "none") signals.push("pas de site actuel");
    else signals.push("site actuel de mauvaise qualité");
  } else if (p.site_quality === "average") {
    score += 5;
  }

  // Qualité de la cible (google rating)
  if ((p.google_rating || 0) >= 4.0) score += 3;

  // Mobile direct = meilleur taux de réponse que fixe standard
  const phone = (p.phone || "").replace(/\s/g, "");
  if (phone.startsWith("06") || phone.startsWith("07")) {
    score += 3;
    signals.push("mobile direct");
  }

  return { score, signals };
}

// Helpers pour parser les notes (format "[YYYY-MM-DD HH:MM] 📞 APPELÉ" ou "📝 xxx")
function getTodayParisDate(): string {
  const fmt = new Intl.DateTimeFormat("fr-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" });
  return fmt.format(new Date());
}
function wasCalledToday(notes: string | null | undefined): boolean {
  if (!notes) return false;
  const today = getTodayParisDate();
  return notes.split("\n").some((l) => l.startsWith(`[${today}`) && l.includes("📞 APPELÉ"));
}
function parseNoteLines(notes: string | null | undefined, limit = 5): string[] {
  if (!notes) return [];
  return notes
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && l.startsWith("["))
    .slice(0, limit);
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

  // State du panneau flottant du script d'appel — reste ouvert pendant que Rubens appelle
  interface ScriptData {
    opening: string;
    discoveryQuestions: string[];
    hooks: string[];
    objectionHandlers: string[];
  }
  interface ScriptAuditData {
    site_quality?: string | null;
    site_audit_score?: number | null;
    site_audit_issues?: string[] | null;
    website?: string | null;
  }
  const [scriptPanel, setScriptPanel] = useState<{
    open: boolean;
    prospect: Prospect | null;
    script: ScriptData | null;
    audit: ScriptAuditData | null;
    loading: boolean;
    error: string | null;
  }>({ open: false, prospect: null, script: null, audit: null, loading: false, error: null });

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
    if (!confirm(`Générer un code PIN pour ${p.name} ?\n\nCela créera un projet Stripe à 199 € lié à sa maquette. Code seulement, pas d'email envoyé.`)) {
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

  // Marque/démarque un prospect comme "appelé aujourd'hui"
  const handleToggleCalled = async (p: Prospect) => {
    const currentlyCalled = wasCalledToday(p.notes);
    const action = currentlyCalled ? "uncall" : "called";
    // Optimistic UI : met à jour localement avant la réponse serveur
    setProspects((prev) =>
      prev.map((x) => {
        if (x.id !== p.id) return x;
        if (currentlyCalled) {
          // retire la ligne d'aujourd'hui localement
          const today = getTodayParisDate();
          const filtered = (x.notes || "").split("\n").filter((l) => !(l.startsWith(`[${today}`) && l.includes("📞 APPELÉ"))).join("\n");
          return { ...x, notes: filtered };
        }
        const line = `[${getTodayParisDate()} --:--] 📞 APPELÉ`;
        return { ...x, notes: x.notes ? `${line}\n${x.notes}` : line };
      })
    );
    try {
      const res = await fetch("/api/prospect/log-call", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ prospect_id: p.id, action }),
      });
      const data = await res.json();
      if (!res.ok) {
        addLog(`❌ Log appel : ${data.error || "erreur"}`);
        loadProspects();
        return;
      }
      // Met à jour avec la vraie valeur notes du serveur (avec timestamp exact)
      setProspects((prev) => prev.map((x) => (x.id === p.id ? { ...x, notes: data.notes } : x)));
      addLog(currentlyCalled ? `↩️ Décoché ${p.name}` : `✅ Appelé ${p.name}`);
    } catch {
      addLog(`❌ Log appel : erreur réseau`);
      loadProspects();
    }
  };

  // Supprime définitivement un prospect (bouton poubelle)
  const handleDelete = async (p: Prospect) => {
    const confirmed = confirm(
      `🗑️ Supprimer définitivement ce prospect ?\n\n` +
      `${p.name}${p.city ? ` (${p.city})` : ""}\n` +
      `${p.phone || "pas de tel"} · ${p.email || "pas d'email"}\n\n` +
      `Cette action est IRRÉVERSIBLE — le prospect disparaît de la base et tu ne pourras plus le retrouver.`
    );
    if (!confirmed) return;

    // Optimistic UI : retire de la liste immédiatement
    const backup = prospects;
    setProspects((prev) => prev.filter((x) => x.id !== p.id));

    try {
      const res = await fetch("/api/prospect/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ id: p.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        // rollback UI si échec serveur
        setProspects(backup);
        alert(`Erreur suppression : ${data.error || "inconnue"}`);
        return;
      }
      addLog(`🗑️ Supprimé : ${p.name}`);
      // Si le script panel était ouvert sur ce prospect, le fermer
      if (scriptPanel.open && scriptPanel.prospect?.id === p.id) {
        setScriptPanel({ ...scriptPanel, open: false });
      }
    } catch {
      setProspects(backup);
      alert("Erreur réseau, suppression annulée.");
    }
  };

  // Ajoute une note datée sur un prospect (via un prompt)
  const handleAddNote = async (p: Prospect) => {
    const text = prompt(`📝 Note pour ${p.name} :\n\n(ex : "Pas dispo, rappeler vendredi 14h" / "Intéressé, envoi devis")`);
    if (!text || !text.trim()) return;
    try {
      const res = await fetch("/api/prospect/log-call", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ prospect_id: p.id, action: "note", text: text.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(`Erreur : ${data.error || "inconnue"}`);
        return;
      }
      setProspects((prev) => prev.map((x) => (x.id === p.id ? { ...x, notes: data.notes } : x)));
      addLog(`📝 Note ajoutée pour ${p.name}`);
    } catch {
      alert("Erreur réseau");
    }
  };

  const handleCallScript = async (p: Prospect) => {
    // Ouvre le panneau IMMÉDIATEMENT en mode loading pour feedback instantané
    setScriptPanel({ open: true, prospect: p, script: null, audit: null, loading: true, error: null });
    addLog(`Génération script d'appel pour ${p.name}...`);
    try {
      const res = await fetch("/api/prospect/call-script", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ prospect_id: p.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setScriptPanel({ open: true, prospect: p, script: null, audit: null, loading: false, error: data.error || "Erreur" });
        addLog(`❌ ${data.error || "Erreur"}`);
        return;
      }
      // Met le script dans le panneau flottant (qui reste ouvert jusqu'à fermeture manuelle)
      setScriptPanel({
        open: true,
        prospect: p,
        script: data.script,
        audit: data.audit || null,
        loading: false,
        error: null,
      });
      addLog(`🎬 Script affiché pour ${p.name}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erreur réseau";
      setScriptPanel({ open: true, prospect: p, script: null, audit: null, loading: false, error: msg });
      addLog(`❌ ${msg}`);
    }
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

        {/* 🎯 Dashboard d'appels quotidien — priorisé par statut */}
        {(() => {
          const callTargets = prospects.filter((p) => {
            if (!p.phone) return false;
            if (p.status === "converted" || p.status === "error") return false;
            if (p.unsubscribed_at) return false; // respecte la purge premium + franchises
            // Inclut "found" pour les cold call (pas encore de mail envoyé)
            return ["sent", "opened", "replied", "ready", "no_email", "found"].includes(p.status);
          });
          // Tri : verdict GO d'abord (site none/poor) > CHECK > STOP, puis par statut à l'intérieur
          const verdictRank: Record<string, number> = { GO: 0, CHECK: 1, STOP: 2 };
          const statusRank: Record<string, number> = { opened: 0, replied: 1, sent: 2, ready: 3, found: 4, no_email: 5 };
          callTargets.sort((a, b) => {
            const dv = verdictRank[getCallVerdict(a).level] - verdictRank[getCallVerdict(b).level];
            if (dv !== 0) return dv;
            return (statusRank[a.status] ?? 9) - (statusRank[b.status] ?? 9);
          });
          const todo = callTargets.filter((p) => !wasCalledToday(p.notes));
          const done = callTargets.filter((p) => wasCalledToday(p.notes));
          const total = callTargets.length;
          const doneCount = done.length;
          const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

          if (total === 0) return null;

          return (
            <div className="mb-6 rounded-xl bg-gradient-to-br from-[#0066ff] via-[#4c1d95] to-[#872175] p-[2px] shadow-lg">
              <div className="bg-white rounded-[10px] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h2 className="text-[18px] font-bold text-[#0a0a0a] flex items-center gap-2">
                      🎯 Appels du jour
                      <span className="text-[12px] font-normal text-gray-500">· {getTodayParisDate()}</span>
                    </h2>
                    <p className="text-[12px] text-gray-500 mt-0.5">
                      {todo.length} à appeler · {doneCount} faits · objectif {total}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-[28px] font-extrabold text-[#0066ff] leading-none">{pct}%</div>
                    <div className="text-[11px] text-gray-500 uppercase tracking-wider mt-1">Progression</div>
                  </div>
                </div>
                {/* Barre de progression */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-[#0066ff] via-[#4c1d95] to-[#872175] transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  ></div>
                </div>
                {/* Liste des prospects à appeler (max 8 en haut) */}
                <div className="space-y-2">
                  {todo.slice(0, 8).map((p) => {
                    const metier = p.business_type || "prospect";
                    const metierEmoji: Record<string, string> = {
                      restaurant: "🍽️", boulangerie: "🥖", patisserie: "🧁", cafe: "☕", glacier: "🍦",
                      coiffeur: "💇", institut: "💅", plombier: "🔧", electricien: "⚡", garage: "🚗",
                      dentiste: "🦷", osteo: "🤲", salle_sport: "🏋️", fleuriste: "🌸", auto_ecole: "🚘",
                      epicerie: "🛒",
                    };
                    const emoji = metierEmoji[metier] || "📞";
                    const telLink = p.phone.replace(/[^0-9+]/g, "");
                    const isHot = p.status === "opened" || p.status === "replied";
                    const v = getCallVerdict(p);
                    // Row tint selon verdict : vert (GO) / rouge (STOP) / jaune (CHECK)
                    const verdictBg =
                      v.level === "GO" ? "border-l-4 border-l-emerald-500 bg-emerald-50"
                      : v.level === "STOP" ? "border-l-4 border-l-red-500 bg-red-50 opacity-70"
                      : "border-l-4 border-l-amber-400 bg-amber-50";
                    return (
                      <div
                        key={p.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border border-gray-200 ${verdictBg} hover:shadow-sm transition`}
                      >
                        <input
                          type="checkbox"
                          checked={false}
                          onChange={() => handleToggleCalled(p)}
                          className="w-5 h-5 rounded border-gray-300 text-[#0066ff] focus:ring-[#0066ff] cursor-pointer"
                          title="Cocher quand appelé"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[14px]">{emoji}</span>
                            <span className="font-semibold text-[14px] text-[#0a0a0a] truncate">{p.name}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${v.bg} ${v.color}`} title={v.label}>
                              {v.emoji} {v.level === "GO" ? "APPELER" : v.level === "STOP" ? "NE PAS APPELER" : "À VÉRIFIER"}
                            </span>
                            {isHot && <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider px-1.5 py-0.5 bg-red-100 rounded">🔥 Ouvert</span>}
                            {p.google_rating ? <span className="text-[11px] text-gray-500">⭐ {p.google_rating}</span> : null}
                          </div>
                          <div className="text-[12px] text-gray-600 truncate flex items-center gap-2">
                            <span>{p.city} · {p.phone}</span>
                          </div>
                          {p.email && (
                            <div className="text-[12px] text-[#0066ff] font-mono truncate flex items-center gap-1.5 mt-0.5">
                              <span>✉️ {p.email}</span>
                            </div>
                          )}
                        </div>
                        <a
                          href={`tel:${telLink}`}
                          className="px-3 py-1.5 text-[11px] font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700 transition inline-flex items-center gap-1"
                          title="Appeler via FaceTime/Continuity"
                        >
                          📞 Appeler
                        </a>
                        <button
                          onClick={() => handleCallScript(p)}
                          className="px-3 py-1.5 text-[11px] font-semibold bg-gray-900 text-white rounded-lg hover:bg-black transition"
                          title="Voir le script d'appel"
                        >
                          🎬 Script
                        </button>
                        <button
                          onClick={() => handleAddNote(p)}
                          className="px-3 py-1.5 text-[11px] font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                          title="Ajouter une note"
                        >
                          📝
                        </button>
                      </div>
                    );
                  })}
                  {todo.length > 8 && (
                    <p className="text-[12px] text-center text-gray-500 pt-2">
                      … et {todo.length - 8} autres à appeler. Liste complète ci-dessous.
                    </p>
                  )}
                  {todo.length === 0 && (
                    <div className="text-center py-6 text-[14px] text-gray-500">
                      🎉 <strong>Bravo !</strong> Tu as appelé tous tes prospects du jour ({doneCount}/{total}).
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

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
                const verdict = getCallVerdict(p);
                // Row tint selon le verdict : vert = appeler, rouge = non, jaune = vérifier
                const rowTint =
                  verdict.level === "GO" ? "border-l-4 border-l-emerald-500 bg-emerald-50/40 hover:bg-emerald-50"
                  : verdict.level === "STOP" ? "border-l-4 border-l-red-500 bg-red-50/40 hover:bg-red-50 opacity-75"
                  : "border-l-4 border-l-amber-400 bg-amber-50/30 hover:bg-amber-50";
                return (
                  <div key={p.id} className={`p-4 flex items-center gap-4 transition ${rowTint}`}>
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
                        {wasCalledToday(p.notes) && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 text-green-700">
                            ✅ Appelé aujourd&apos;hui
                          </span>
                        )}
                        {(() => {
                          const v = getCallVerdict(p);
                          return (
                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${v.bg} ${v.color}`} title={v.label}>
                              {v.emoji} {v.level === "GO" ? "APPELER" : v.level === "STOP" ? "NE PAS APPELER" : "À VÉRIFIER"}
                            </span>
                          );
                        })()}
                      </div>
                      <p className="text-[12px] text-gray-500 truncate">
                        {p.city} &middot; {p.distance_km} km &middot; {p.email || "pas d'email"}{p.phone ? ` · ${p.phone}` : ""}
                      </p>
                      {/* Affiche les 3 dernières notes datées (appels + notes manuelles) */}
                      {p.notes && parseNoteLines(p.notes, 3).length > 0 && (
                        <div className="mt-1.5 space-y-0.5">
                          {parseNoteLines(p.notes, 3).map((line, i) => (
                            <div key={i} className="text-[11px] text-gray-600 font-mono truncate bg-amber-50 border-l-2 border-amber-400 pl-2 py-0.5">
                              {line}
                            </div>
                          ))}
                        </div>
                      )}
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
                      {/* Appeler directement — couleur adaptée au verdict GO/STOP/CHECK */}
                      {p.phone && (
                        <a
                          href={`tel:${p.phone.replace(/[^0-9+]/g, "")}`}
                          onClick={(e) => {
                            if (verdict.level === "STOP" && !confirm(`⛔ Ce prospect a un ${p.site_quality === "good" ? "SITE PRO" : "SITE CORRECT"}. Tu risques de te faire incendier comme avec LFLF.\n\nAppeler quand même ?`)) {
                              e.preventDefault();
                            }
                          }}
                          className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition inline-flex items-center gap-1 ${
                            verdict.level === "STOP"
                              ? "bg-red-200 text-red-900 hover:bg-red-300 border border-red-400"
                              : verdict.level === "CHECK"
                                ? "bg-amber-500 text-white hover:bg-amber-600"
                                : "bg-green-600 text-white hover:bg-green-700"
                          }`}
                          title={
                            verdict.level === "STOP"
                              ? "⛔ NE PAS APPELER — site déjà correct"
                              : verdict.level === "CHECK"
                                ? "🟡 À VÉRIFIER — regarde son site avant"
                                : `📞 Appeler ${p.phone}`
                          }
                        >
                          {verdict.level === "STOP" ? "⛔" : verdict.level === "CHECK" ? "🟡" : "📞"} Appeler
                        </a>
                      )}
                      {/* Checkbox Appelé aujourd'hui — marque ce prospect comme fait */}
                      {p.phone && (
                        <button
                          onClick={() => handleToggleCalled(p)}
                          disabled={loading}
                          className={`px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition disabled:opacity-50 ${
                            wasCalledToday(p.notes)
                              ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                              : "bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200"
                          }`}
                          title={wasCalledToday(p.notes) ? "Décocher (rappeler)" : "Marquer comme appelé"}
                        >
                          {wasCalledToday(p.notes) ? "✅ Fait" : "⬜ À faire"}
                        </button>
                      )}
                      {/* Note — prompt pour ajouter une note datée sur ce prospect */}
                      <button
                        onClick={() => handleAddNote(p)}
                        className="px-2.5 py-1.5 text-[11px] font-semibold bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition"
                        title="Ajouter une note (ex: pas dispo, rappeler vendredi)"
                      >
                        📝
                      </button>
                      {/* Supprimer — libère la place quand le prospect refuse */}
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={loading}
                        className="px-2.5 py-1.5 text-[11px] font-semibold bg-red-500 text-white rounded-lg hover:bg-red-600 transition disabled:opacity-50"
                        title="Supprimer définitivement ce prospect (pas intéressé)"
                      >
                        🗑️
                      </button>
                      {/* Script d'appel — disponible pour TOUT prospect avec téléphone
                          (y compris ceux en status=found / no_email = cold call) */}
                      {p.phone && p.status !== "converted" && p.status !== "error" && (
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

      {/* ═══════════════════════════════════════════════════════════════
          🎬 Panneau flottant SCRIPT D'APPEL
          — Persistant : reste ouvert pendant que Rubens appelle
          — Loading instantané dès clic
          — Se ferme UNIQUEMENT avec le bouton ✕ (pas au clic extérieur)
          ═══════════════════════════════════════════════════════════════ */}
      {scriptPanel.open && scriptPanel.prospect && (
        <div className="fixed bottom-4 right-4 w-[95vw] sm:w-[440px] max-h-[90vh] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[9998] flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#0066ff] via-[#4c1d95] to-[#872175] text-white flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wider opacity-80">🎬 Script d&apos;appel</div>
              <div className="text-[15px] font-bold truncate">{scriptPanel.prospect.name}</div>
              <div className="text-[12px] opacity-90 truncate">
                {scriptPanel.prospect.phone}
                {scriptPanel.prospect.email ? ` · ${scriptPanel.prospect.email}` : ""}
              </div>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              {scriptPanel.prospect.email && (
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(scriptPanel.prospect?.email || "").catch(() => {});
                    addLog(`📋 Email copié : ${scriptPanel.prospect?.email}`);
                  }}
                  className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-[14px]"
                  title="Copier l'email"
                >
                  📋
                </button>
              )}
              <button
                onClick={() => setScriptPanel({ ...scriptPanel, open: false })}
                className="w-9 h-9 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center text-[16px] font-bold"
                title="Fermer (manuel uniquement)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 text-[13px] text-gray-800 space-y-4">
            {scriptPanel.loading && (
              <div className="flex flex-col items-center justify-center py-12 gap-3">
                <div className="w-8 h-8 border-4 border-[#0066ff] border-t-transparent rounded-full animate-spin"></div>
                <div className="text-[13px] text-gray-500">Génération du script + audit du site...</div>
                <div className="text-[11px] text-gray-400">Ça peut prendre 5-15 secondes</div>
              </div>
            )}

            {scriptPanel.error && !scriptPanel.loading && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-[12px]">
                ❌ {scriptPanel.error}
              </div>
            )}

            {scriptPanel.script && !scriptPanel.loading && (
              <>
                {/* VERDICT — bannière géante en haut pour décider d'appeler ou pas */}
                {(() => {
                  const v = getCallVerdict(scriptPanel.prospect as Prospect);
                  const details =
                    v.level === "STOP" && scriptPanel.prospect?.site_quality === "good"
                      ? "Ce prospect a un SITE PRO MODERNE (e-commerce, design custom, etc.). Notre template va paraître moins bien que ce qu'il a déjà. Tu vas te faire incendier comme avec LFLF Fleuriste."
                      : v.level === "STOP" && scriptPanel.prospect?.site_quality === "average"
                      ? "Ce prospect a un site CORRECT. Notre template ne sera pas une progression claire. Risque d'humiliation."
                      : v.level === "CHECK"
                      ? "Son site n'a pas été audité. Clique sur « Son site actuel » dans les infos rapides et regarde 30 secondes AVANT d'appeler. Si ça a l'air pro/moderne → passe au suivant."
                      : "Pas de site ou site très daté. Notre maquette représente une vraie progression. Fonce.";
                  return (
                    <div className={`rounded-xl p-4 border-2 ${v.bg} ${v.color} flex items-start gap-3`}>
                      <span className="text-[32px] leading-none flex-shrink-0">{v.emoji}</span>
                      <div className="flex-1">
                        <div className={`text-[15px] font-extrabold ${v.color}`}>
                          {v.level === "GO" ? "✅ VAS-Y, APPELLE" : v.level === "STOP" ? "⛔ NE PAS APPELER" : "🟡 À VÉRIFIER AVANT"}
                        </div>
                        <div className={`text-[12px] mt-1 ${v.color}`}>{details}</div>
                        <div className={`text-[11px] mt-2 opacity-80 ${v.color}`}>Qualité site actuel : <strong>{scriptPanel.prospect?.site_quality || "non audité"}</strong></div>
                      </div>
                    </div>
                  );
                })()}

                {/* Infos rapides */}
                <div className="flex flex-wrap gap-2 pb-3 border-b border-gray-100">
                  {scriptPanel.prospect.city && (
                    <span className="px-2 py-1 bg-gray-100 rounded text-[11px]">📍 {scriptPanel.prospect.city}</span>
                  )}
                  {scriptPanel.prospect.google_rating && (
                    <span className="px-2 py-1 bg-amber-50 rounded text-[11px] text-amber-700">⭐ {scriptPanel.prospect.google_rating}/5 ({scriptPanel.prospect.google_reviews_count} avis)</span>
                  )}
                  {scriptPanel.prospect?.slug && (() => {
                    const slug = scriptPanel.prospect.slug;
                    return (
                      <a
                        href={`/prospects/${slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          window.open(`/prospects/${slug}`, "_blank", "noopener,noreferrer");
                        }}
                        className="px-2 py-1 bg-emerald-50 rounded text-[11px] text-emerald-700 hover:bg-emerald-100 font-semibold"
                        title="Ouvrir la maquette WebConceptor envoyée à ce prospect"
                      >
                        🎨 Ma maquette
                      </a>
                    );
                  })()}
                  {scriptPanel.audit?.website && (
                    <a href={scriptPanel.audit.website} target="_blank" rel="noopener noreferrer" className="px-2 py-1 bg-blue-50 rounded text-[11px] text-blue-700 hover:underline">🌐 Son site actuel</a>
                  )}
                </div>

                {/* Ouverture */}
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[#0066ff] mb-2">🎬 Ouverture (lis mot à mot)</div>
                  <div className="bg-blue-50 border-l-4 border-[#0066ff] rounded-r-lg p-3 italic text-[13px] leading-relaxed text-[#0a0a0a]">
                    « {scriptPanel.script.opening} »
                  </div>
                </div>

                {/* Audit du site */}
                {scriptPanel.audit && (
                  <>
                    {scriptPanel.audit.site_quality === "none" && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-green-700 mb-2">🆕 Prospect sans site</div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-[12px] leading-relaxed">
                          <strong>Argument clé :</strong> un commerce sans site, c&apos;est 3 clients sur 4 qui cherchent sur Google et ne vous trouvent pas. Notre maquette répond pile à ce besoin — visibilité, réservations, crédibilité.
                        </div>
                      </div>
                    )}
                    {Array.isArray(scriptPanel.audit.site_audit_issues) && scriptPanel.audit.site_audit_issues.length > 0 && (
                      <div>
                        <div className="text-[10px] font-bold uppercase tracking-wider text-red-700 mb-2">
                          🔍 Points faibles de son site actuel
                          {scriptPanel.audit.site_audit_score != null && ` (${scriptPanel.audit.site_audit_score}/100)`}
                        </div>
                        <ul className="bg-red-50 border border-red-200 rounded-lg p-3 text-[12px] leading-relaxed space-y-1 list-disc list-inside">
                          {scriptPanel.audit.site_audit_issues.slice(0, 8).map((key, i) => (
                            <li key={i}>{AUDIT_ISSUE_LABELS[key] || key}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {/* Questions */}
                {scriptPanel.script.discoveryQuestions && scriptPanel.script.discoveryQuestions.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 mb-2">❓ Questions à poser</div>
                    <ol className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-[12px] leading-relaxed space-y-2 list-decimal list-inside">
                      {scriptPanel.script.discoveryQuestions.map((q, i) => (
                        <li key={i}>{q}</li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Hooks */}
                {scriptPanel.script.hooks && scriptPanel.script.hooks.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-2">🎯 Si hésitation</div>
                    <ul className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-[12px] leading-relaxed space-y-2 list-disc list-inside">
                      {scriptPanel.script.hooks.map((h, i) => (
                        <li key={i}>{h}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Objections */}
                {scriptPanel.script.objectionHandlers && scriptPanel.script.objectionHandlers.length > 0 && (
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-700 mb-2">🛡 Objections</div>
                    <ul className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-[12px] leading-relaxed space-y-2">
                      {scriptPanel.script.objectionHandlers.map((o, i) => (
                        <li key={i} className="pb-2 border-b border-gray-200 last:border-0 last:pb-0">{o}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer : actions rapides */}
          {scriptPanel.prospect && (
            <div className="p-3 border-t border-gray-200 bg-gray-50 flex items-center gap-2">
              {scriptPanel.prospect.phone && (
                <a
                  href={`tel:${scriptPanel.prospect.phone.replace(/[^0-9+]/g, "")}`}
                  className="flex-1 px-3 py-2 bg-green-600 text-white text-[12px] font-semibold rounded-lg hover:bg-green-700 text-center"
                >
                  📞 Appeler
                </a>
              )}
              <button
                onClick={() => scriptPanel.prospect && handleToggleCalled(scriptPanel.prospect)}
                className={`flex-1 px-3 py-2 text-[12px] font-semibold rounded-lg ${
                  wasCalledToday(scriptPanel.prospect.notes)
                    ? "bg-green-100 text-green-700 border border-green-300"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                {wasCalledToday(scriptPanel.prospect.notes) ? "✅ Appelé" : "⬜ Cocher"}
              </button>
              <button
                onClick={() => scriptPanel.prospect && handleAddNote(scriptPanel.prospect)}
                className="px-3 py-2 bg-amber-500 text-white text-[12px] font-semibold rounded-lg hover:bg-amber-600"
              >
                📝 Note
              </button>
              <button
                onClick={() => scriptPanel.prospect && handleDelete(scriptPanel.prospect)}
                className="px-3 py-2 bg-red-500 text-white text-[12px] font-semibold rounded-lg hover:bg-red-600"
                title="Supprimer ce prospect (pas intéressé)"
              >
                🗑️
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
