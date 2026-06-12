import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, isWithinSendingHours } from "@/lib/security";

/* ══════════════════════════════════════════════════════════════════
   POST /api/caissio/prospect/send
   Envoie des emails de prospection Caissio aux commerces de proximité.
   Cible : épiceries, boulangeries, boucheries, supérettes, cafés.
   Règles anti-spam :
   - 1 email Caissio max par prospect (caissio_sent_at IS NULL)
   - 48h minimum depuis le dernier email Klyora Sites (sent_at)
   - Batch max 30/run (≤ 30 emails/jour)
   ══════════════════════════════════════════════════════════════════ */

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

// Types de commerce qui ont besoin d'un logiciel de caisse
const CAISSIO_TARGETS = [
  "epicerie", "boulangerie", "patisserie", "boucherie", "cafe",
  "restaurant", "glacier", "fleuriste", "salon_de_the", "cafe",
  "bar", "pizzeria", "creperie", "chocolatier", "coiffeur", "spa", "institut",
];

function isCaissioTarget(businessType?: string): boolean {
  if (!businessType) return false;
  return CAISSIO_TARGETS.includes(businessType.toLowerCase());
}

/* ─── Email HTML Caissio ──────────────────────────────────────────────────── */
function buildCaissioEmailHtml({
  name, city, businessType, appUrl,
}: {
  name: string;
  city: string;
  businessType: string;
  appUrl: string;
}) {
  const labels: Record<string, { metier: string; pain: string; benefit: string }> = {
    epicerie:    { metier: "épicerie",          pain: "gérer vos encaissements",                benefit: "caisse tactile + stock en temps réel" },
    boulangerie: { metier: "boulangerie",       pain: "accélérer vos encaissements",             benefit: "caisse rapide + tickets conformes NF 525" },
    patisserie:  { metier: "pâtisserie",        pain: "gérer votre caisse",                      benefit: "tickets personnalisés + suivi des ventes" },
    boucherie:   { metier: "boucherie",         pain: "gérer vos encaissements",                 benefit: "caisse tactile + gestion des clients" },
    cafe:        { metier: "café",              pain: "encaisser rapidement",                    benefit: "caisse iPad + tickets email instantanés" },
    restaurant:  { metier: "restaurant",        pain: "gérer votre caisse",                      benefit: "caisse tactile + rapports quotidiens" },
    glacier:     { metier: "glacier",           pain: "gérer vos encaissements",                 benefit: "caisse rapide + conformité fiscale" },
    fleuriste:   { metier: "fleuriste",         pain: "gérer votre caisse",                      benefit: "caisse tactile + tickets clients" },
    coiffeur:    { metier: "salon de coiffure", pain: "gérer votre caisse",                      benefit: "caisse professionnelle + rapports" },
    default:     { metier: "commerce",          pain: "gérer votre caisse",                      benefit: "logiciel de caisse professionnel" },
  };
  const l = labels[businessType] || labels.default;
  const trialUrl = `${appUrl}/caissio?utm_source=email&utm_campaign=prospect&utm_content=${encodeURIComponent(name)}`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:#F9FAFB;font-family:'Helvetica Neue',Arial,sans-serif}
  .wrap{max-width:560px;margin:40px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)}
  .hero{background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);padding:36px 32px 28px;text-align:center}
  .logo-mark{width:52px;height:52px;margin:0 auto 16px;display:block}
  .hero h1{color:#fff;font-size:24px;font-weight:700;margin:0 0 8px;line-height:1.3}
  .hero p{color:rgba(255,255,255,.65);font-size:14px;margin:0}
  .badge{display:inline-block;background:rgba(79,70,229,0.25);border:1px solid rgba(99,102,241,.45);color:#a5b4fc;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;padding:5px 14px;border-radius:30px;margin-bottom:18px}
  .body{padding:28px 32px}
  .body p{font-size:15px;color:#374151;line-height:1.7;margin:0 0 16px}
  .features{background:#f8fafc;border-radius:12px;padding:16px 20px;margin:20px 0}
  .feature{display:flex;align-items:center;gap:10px;padding:6px 0;font-size:14px;color:#374151}
  .feature-icon{font-size:18px;flex-shrink:0}
  .btn-primary{display:block;background:#4f46e5;color:#fff !important;text-decoration:none;padding:16px 24px;border-radius:12px;font-weight:700;font-size:15px;text-align:center;margin:24px 0}
  .trial-note{background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:12px 16px;margin:16px 0;font-size:13px;color:#92400e}
  .footer{background:#F9FAFB;border-top:1px solid #E5E7EB;padding:20px 32px;text-align:center;font-size:12px;color:#9CA3AF}
  .footer a{color:#4f46e5;text-decoration:none}
</style>
</head>
<body>
<div class="wrap">
  <div class="hero">
    <div class="badge">🖥️ Logiciel de caisse</div>
    <svg class="logo-mark" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="44" height="44" rx="11" fill="#4F46E5"/>
      <rect x="14" y="6" width="14" height="6" rx="1.5" fill="white" opacity="0.95"/>
      <rect x="10" y="16" width="28" height="22" rx="3.5" fill="white"/>
      <rect x="14" y="20" width="20" height="6" rx="1.5" fill="#4F46E5" opacity="0.15"/>
      <rect x="14" y="28" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5"/>
      <rect x="21.5" y="28" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5"/>
      <rect x="29" y="28" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5"/>
      <rect x="14" y="33" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5"/>
      <rect x="21.5" y="33" width="5" height="3" rx="1" fill="#4F46E5" opacity="0.5"/>
      <rect x="29" y="33" width="5" height="3" rx="1" fill="#10B981"/>
    </svg>
    <h1>Caissio — la caisse faite pour les commerces de ${city}</h1>
    <p>Simple, rapide, conforme aux obligations fiscales 2026</p>
  </div>
  <div class="body">
    <p>Bonjour,</p>
    <p>J'ai vu votre ${l.metier} à ${city} et je voulais vous présenter <strong>Caissio</strong>, un logiciel de caisse pensé pour les commerces indépendants comme le vôtre.</p>
    <p>En 2026, les logiciels de caisse doivent être conformes à la norme <strong>NF 525</strong>. Caissio l'est — et ça n'ajoute aucune complexité pour vous.</p>

    <div class="features">
      <div class="feature"><span class="feature-icon">📱</span><span>Fonctionne sur iPad, tablette ou PC — sans installation</span></div>
      <div class="feature"><span class="feature-icon">🧾</span><span>Tickets email + PDF conformes, imprimés en 1 seconde</span></div>
      <div class="feature"><span class="feature-icon">📊</span><span>Rapports journaliers automatiques (Z-report)</span></div>
      <div class="feature"><span class="feature-icon">🔒</span><span>Données sécurisées, chaîne d'intégrité NF 525</span></div>
      <div class="feature"><span class="feature-icon">💶</span><span><strong>15 €/mois</strong> — résiliable à tout moment</span></div>
    </div>

    <div class="trial-note">
      🎁 <strong>7 jours offerts</strong> sur le premier abonnement Starter — sans engagement, aucun prélèvement pendant l'essai.
    </div>

    <a href="${trialUrl}" class="btn-primary">
      Essayer Caissio gratuitement →
    </a>

    <p style="font-size:13px;color:#6B7280">La configuration prend moins de 5 minutes. Vous importez vos produits depuis un fichier Excel, ou vous les saisissez directement. Aucune formation nécessaire.</p>
  </div>
  <div class="footer">
    <p>Caissio par <a href="https://webconceptor.fr">Klyora Sites</a> · ${city}</p>
    <p style="margin-top:6px">Pour ne plus recevoir ces emails : <a href="mailto:contact@webconceptor.fr?subject=Désabonnement ${encodeURIComponent(name)}">se désabonner</a></p>
  </div>
</div>
</body>
</html>`;
}

/* ─── Handler principal ───────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key") || "";
  const cronKey  = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";

  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY) && !safeCompare(cronKey, process.env.CRON_SECRET)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  if (!isWithinSendingHours()) {
    return NextResponse.json({ skipped: true, reason: "Hors plage d'envoi (8h–19h)" });
  }

  const body = await req.json().catch(() => ({})) as { batch_size?: number; dry_run?: boolean };
  const batch_size = Math.min(30, Math.max(1, Number(body.batch_size) || 25));
  const dry_run    = Boolean(body.dry_run);

  const brevoKey  = process.env.BREVO_API_KEY;
  const appUrl    = process.env.NEXT_PUBLIC_APP_URL || "https://webconceptor.fr";
  if (!brevoKey) return NextResponse.json({ error: "BREVO_API_KEY manquant" }, { status: 500 });

  const supabase = getSupabase();

  // ── 48h cooldown : évite de spammer quelqu'un récemment contacté
  const cooldownDate = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  // ── Sélection des prospects ciblés ──────────────────────────────────────
  const { data: prospects, error } = await supabase
    .from("prospects")
    .select("id, name, city, email, business_type, sent_at, agentconceptor_sent_at")
    .is("caissio_sent_at", null)
    .not("email", "is", null)
    .or(`sent_at.is.null,sent_at.lt.${cooldownDate}`)
    .in("business_type", CAISSIO_TARGETS)
    .order("created_at", { ascending: true })
    .limit(batch_size);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!prospects || prospects.length === 0) {
    return NextResponse.json({ sent: 0, message: "Aucun prospect disponible pour Caissio" });
  }

  const results: Array<{ id: string; name: string; status: string; error?: string }> = [];

  // Cooldown par domaine email (anti-spam)
  const domainCount = new Map<string, number>();

  for (const p of prospects) {
    if (!p.email) { results.push({ id: p.id, name: p.name, status: "no_email" }); continue; }

    const domain = p.email.split("@")[1]?.toLowerCase() || "";
    if (domainCount.get(domain) && (domainCount.get(domain) ?? 0) >= 2) {
      results.push({ id: p.id, name: p.name, status: "skipped_domain" });
      continue;
    }

    if (!isCaissioTarget(p.business_type)) {
      results.push({ id: p.id, name: p.name, status: "skipped_type" });
      continue;
    }

    if (dry_run) {
      results.push({ id: p.id, name: p.name, status: "dry_run" });
      continue;
    }

    try {
      const html = buildCaissioEmailHtml({
        name: p.name, city: p.city || "votre ville",
        businessType: p.business_type || "epicerie", appUrl,
      });

      const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: { "api-key": brevoKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          sender:    { name: "Caissio", email: "contact@webconceptor.fr" },
          to:        [{ email: p.email, name: p.name }],
          subject:   `Caissio — la caisse pour les ${p.business_type || "commerces"} à ${p.city || "chez vous"} (7 jours offerts)`,
          htmlContent: html,
        }),
        signal: AbortSignal.timeout(12000),
      });

      const emailData = await emailRes.json().catch(() => ({})) as { messageId?: string; code?: string };

      if (emailRes.ok && emailData.messageId) {
        await supabase.from("prospects").update({ caissio_sent_at: new Date().toISOString() }).eq("id", p.id);
        domainCount.set(domain, (domainCount.get(domain) || 0) + 1);
        results.push({ id: p.id, name: p.name, status: "sent" });
      } else {
        results.push({ id: p.id, name: p.name, status: "error", error: emailData.code || String(emailRes.status) });
      }
    } catch (e) {
      results.push({ id: p.id, name: p.name, status: "error", error: e instanceof Error ? e.message : "unknown" });
    }
  }

  const sentCount  = results.filter((r) => r.status === "sent").length;
  const errorCount = results.filter((r) => r.status === "error").length;

  return NextResponse.json({ sent: sentCount, errors: errorCount, processed: results.length, results, dry_run });
}

export async function GET(req: NextRequest) {
  return NextResponse.json({ error: "Méthode non supportée — utilisez POST" }, { status: 405 });
}
