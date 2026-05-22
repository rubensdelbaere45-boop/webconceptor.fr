import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   CRON : prospection quotidienne automatique.
   Appelle /find puis /send en sequence, avec gestion d'erreur.
   Authentification : header "x-cron-secret" ou Bearer token.
   Utilisable depuis n8n (HTTP Request) ou Render Cron Job.
   ══════════════════════════════════════════ */

// Rotation de queries diversifiées — couvre tous les secteurs cibles.
// Grande liste : on sélectionne N queries par jour de la semaine (rotation).
// Objectif : trouver des commerces locaux avec un site nul ou inexistant.
const DEFAULT_QUERIES = [
  // ── Restaurants ──
  "restaurant Marseille",
  "restaurant Bordeaux",
  "restaurant Rennes",
  "restaurant Montpellier",
  "restaurant Reims",
  "restaurant Le Havre",
  "restaurant Saint-Étienne",
  "brasserie Strasbourg",
  "brasserie Nantes",
  "brasserie Grenoble",
  "pizzeria Lyon",
  "pizzeria Toulon",
  "pizzeria Aix-en-Provence",
  "bistrot Paris",
  "bistrot Lille",
  "crêperie Rennes",
  "crêperie Brest",
  "sushi restaurant Toulouse",
  "restaurant gastronomique Dijon",
  "restaurant libanais Montpellier",
  // ── Coiffeurs ──
  "coiffeur Toulouse",
  "coiffeur Nantes",
  "coiffeur Grenoble",
  "coiffeur Rouen",
  "salon de coiffure Bordeaux",
  "salon de coiffure Montpellier",
  "salon de coiffure Angers",
  "coiffeur afro Marseille",
  "barbier Lyon",
  "barbier Strasbourg",
  // ── Boulangeries / Pâtisseries ──
  "boulangerie artisanale Paris",
  "boulangerie artisanale Toulouse",
  "boulangerie Bordeaux",
  "boulangerie Montpellier",
  "boulangerie Reims",
  "pâtisserie Lyon",
  "pâtisserie Nantes",
  "pâtisserie Nice",
  "chocolatier Strasbourg",
  "glacier Marseille",
  // ── Artisans / Services ──
  "plombier chauffagiste Bordeaux",
  "plombier Lyon",
  "plombier Marseille",
  "électricien Nantes",
  "électricien Montpellier",
  "peintre en bâtiment Toulouse",
  "menuisier artisan Rennes",
  "maçon Grenoble",
  "couvreur charpentier Lille",
  "serrurier Paris",
  // ── Beauté / Bien-être ──
  "institut de beauté Toulouse",
  "institut de beauté Bordeaux",
  "spa bien-être Lyon",
  "spa massage Marseille",
  "manucure onglerie Nantes",
  "tatoueur piercing Montpellier",
  "tatoueur piercing Strasbourg",
  "centre esthétique Nice",
  // ── Santé / Para-médical ──
  "ostéopathe Bordeaux",
  "ostéopathe Rennes",
  "kinésithérapeute Nantes",
  "dentiste Montpellier",
  "dentiste Toulouse",
  "médecin généraliste Grenoble",
  "cabinet médical Lyon",
  // ── Fleuristes / Cadeaux ──
  "fleuriste Marseille",
  "fleuriste Bordeaux",
  "fleuriste Rennes",
  "fleuriste Nantes",
  // ── Garages / Auto ──
  "garage auto Toulouse",
  "garage mécanique Bordeaux",
  "carrossier peinture Lyon",
  "contrôle technique Nantes",
  // ── Auto-écoles ──
  "auto-école Marseille",
  "auto-école Toulouse",
  "auto-école Bordeaux",
  "auto-école Rennes",
  // ── Cafés / Bars ──
  "café bar Bordeaux",
  "café salon de thé Lyon",
  "bar restaurant Toulouse",
  "cave à vins Montpellier",
  // ── Divers ──
  "traiteur Marseille",
  "traiteur Lyon",
  "cave à bière artisanale Strasbourg",
  "pressing teinturier Toulouse",
  "photographe portrait Bordeaux",
  "agence immobilière artisan Nice",
  // ── Épiceries / Commerce de proximité (cible Caissio) ──
  "épicerie de proximité Paris",
  "épicerie de proximité Lyon",
  "épicerie de proximité Marseille",
  "épicerie de proximité Bordeaux",
  "supérette alimentation Toulouse",
  "supérette alimentation Nantes",
  "épicerie fine traiteur Montpellier",
  "épicerie asiatique Paris",
  "épicerie africaine Lyon",
  "alimentation générale Strasbourg",
  "commerce de proximité Rennes",
  "épicerie de nuit Paris",
  "tabac presse épicerie Bordeaux",
  "boucherie charcuterie Marseille",
  "boucherie artisanale Lyon",
  "boucherie halal Paris",
  "poissonnerie marché Nantes",
  "fromagerie épicerie fine Paris",
  "primeur fruits légumes Toulouse",
  "primeur fruits légumes Bordeaux",
  "supérette épicerie Grenoble",
  // ── PME / Entreprises (cible AgentConceptor) ──
  "cabinet comptable PME Paris",
  "agence immobilière Lyon",
  "agence immobilière Bordeaux",
  "agence de communication Toulouse",
  "agence web Nantes",
  "bureau d'études ingénierie Marseille",
  "cabinet de recrutement Paris",
  "grossiste importateur Lyon",
  "entreprise BTP Bordeaux",
  "société de nettoyage professionnel Paris",
];

// Sélectionne QUERIES_PER_RUN queries depuis la liste, en rotation par date+heure
// pour ne jamais envoyer les mêmes deux runs de suite.
const QUERIES_PER_RUN = 6; // 6 queries/run × 6 runs/jour = 36 queries/jour → ~200-400 nouveaux prospects/jour

// Déduit le business_type à envoyer à /find depuis le texte de la query.
// Sans ça, /find défaut sur "epicerie" → filtre 250km Aubenton appliqué partout.
function inferBusinessType(query: string): string {
  const q = query.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/restaurant|brasserie|pizzeria|bistrot|traiteur|sushi|creperie|gastronomique|libanais/.test(q)) return "restaurant";
  if (/coiffeur|salon de coiffure|barbier/.test(q)) return "coiffeur";
  if (/boulangerie|patisserie|viennoiserie|chocolatier/.test(q)) return "boulangerie";
  if (/glacier|glace/.test(q)) return "glacier";
  if (/cafe|bar |salon de the|cave a vins|cave a biere/.test(q)) return "cafe";
  if (/plombier|chauffagiste/.test(q)) return "plombier";
  if (/electricien/.test(q)) return "electricien";
  if (/garage|mecanique|carrossier|controle technique/.test(q)) return "garage";
  if (/fleuriste/.test(q)) return "fleuriste";
  if (/auto.ecole/.test(q)) return "auto_ecole";
  if (/osteopathe|kinesitherapeute/.test(q)) return "osteo";
  if (/dentiste|cabinet medical|medecin/.test(q)) return "dentiste";
  if (/institut de beaute|spa|massage|manucure|onglerie|tatoueur/.test(q)) return "institut";
  if (/proxi|epicerie|superette|alimentation|boucherie|poissonnerie|primeur|fromager|tabac|presse/.test(q)) return "epicerie";
  if (/cabinet comptable|agence immobiliere|agence web|agence de communication|cabinet de recrutement|bureau d.etudes|grossiste|nettoyage professionnel|societe de|entreprise btp/.test(q)) return "restaurant"; // pas de filtre distance pour PME
  return "restaurant"; // défaut sûr : pas de filtre distance
}

export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  return runCron(req);
}

async function runCron(req: NextRequest) {
  // Auth : soit x-cron-secret (header), soit Authorization Bearer
  const cronSecret = process.env.CRON_SECRET || "";
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET non configure sur le serveur" },
      { status: 500 }
    );
  }
  const sent = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!safeCompare(sent, cronSecret)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  // Parametres : ?query= et ?batch= via URL (pour flexibilite n8n)
  const query = req.nextUrl.searchParams.get("query")?.trim().slice(0, 200) || "";
  const batchParam = Number(req.nextUrl.searchParams.get("batch"));
  const batch_size = Number.isFinite(batchParam) && batchParam > 0
    ? Math.min(50, Math.max(1, Math.floor(batchParam)))
    : 60; // 60 emails par run × 6 runs/jour = 360 emails/jour → 20 000 en 27 jours ✅

  // Rotation sur la grande liste : QUERIES_PER_RUN queries différentes par run
  // On utilise le numéro de jour depuis epoch pour avancer dans la liste chaque jour.
  const queries: string[] = query ? [query] : (() => {
    // Rotation par run (heure + jour) pour varier les requêtes à chaque exécution
    const runIndex = Math.floor(Date.now() / 7_200_000); // change toutes les 2h
    const offset = (runIndex * QUERIES_PER_RUN) % DEFAULT_QUERIES.length;
    const selected: string[] = [];
    for (let i = 0; i < QUERIES_PER_RUN; i++) {
      selected.push(DEFAULT_QUERIES[(offset + i) % DEFAULT_QUERIES.length]);
    }
    return selected;
  })();

  const origin = "https://webconceptor.fr";
  const adminKey = process.env.ADMIN_SECRET_KEY || "";

  const log: string[] = [];
  const results = { found: 0, inserted: 0, sent: 0, errors: [] as string[] };

  try {
    // ─── Étape 1 : chercher de nouveaux prospects ───
    for (const q of queries) {
      const btype = inferBusinessType(q);
      log.push(`[find] Recherche "${q}" (type=${btype})`);
      try {
        const r = await fetch(`${origin}/api/prospect/find`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
          body: JSON.stringify({ query: q, business_type: btype }),
          signal: AbortSignal.timeout(120000),
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.stats) {
          results.found += Number(data.stats.found || 0);
          results.inserted += Number(data.stats.inserted || 0);
          log.push(`[find] ${data.stats.inserted}/${data.stats.found} inserted (${data.stats.withEmail} emails, ${data.stats.skippedNearby} nearby, ${data.stats.skippedDuplicate} dup)`);
        } else {
          const msg = `find failed for "${q}": ${data.error || r.status}`;
          results.errors.push(msg);
          log.push(`[find] ERREUR: ${msg}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown";
        results.errors.push(`find "${q}": ${msg}`);
        log.push(`[find] EXCEPTION: ${msg}`);
      }
    }

    // ─── Laisse les inserts se propager ───
    await new Promise((res) => setTimeout(res, 2000));

    // ─── Étape 2 : envoyer les emails aux prospects "found" ───
    log.push(`[send] Envoi batch_size=${batch_size}, dry_run=false`);
    try {
      const r = await fetch(`${origin}/api/prospect/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ batch_size, dry_run: false }),
        signal: AbortSignal.timeout(300000),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        const ok = Array.isArray(data.results)
          ? data.results.filter((x: { status: string }) => x.status === "sent").length
          : 0;
        results.sent = ok;
        log.push(`[send] ${ok}/${data.processed || 0} emails envoyés`);
      } else {
        const msg = `send failed: ${data.error || r.status}`;
        results.errors.push(msg);
        log.push(`[send] ERREUR: ${msg}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      results.errors.push(`send: ${msg}`);
      log.push(`[send] EXCEPTION: ${msg}`);
    }

    // ─── Étape 3 : EMAIL de relance aux prospects ayant ouvert il y a 2+ jours ───
    log.push(`[email-reminders] Recherche prospects à relancer par email...`);
    try {
      const r = await fetch(`${origin}/api/prospect/email-reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        signal: AbortSignal.timeout(120000),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        log.push(`[email-reminders] ${data.sent || 0}/${data.processed || 0} emails envoyés (${data.errors || 0} erreurs)`);
      } else {
        const msg = `email-reminders failed: ${data.error || r.status}`;
        results.errors.push(msg);
        log.push(`[email-reminders] ERREUR: ${msg}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      results.errors.push(`email-reminders: ${msg}`);
      log.push(`[email-reminders] EXCEPTION: ${msg}`);
    }

    // ─── Étape 4 : SMS de relance (bonus, seulement si crédits SMS dispo) ───
    log.push(`[sms-reminders] Recherche prospects à relancer par SMS...`);
    try {
      const r = await fetch(`${origin}/api/prospect/sms-reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        signal: AbortSignal.timeout(120000),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        log.push(`[sms-reminders] ${data.sent || 0}/${data.processed || 0} SMS envoyés (${data.errors || 0} erreurs, ${data.skipped || 0} non mobiles)`);
        if (typeof data.remaining_credits === "number") {
          log.push(`[sms-reminders] Crédits restants : ${data.remaining_credits}`);
        }
      } else {
        const msg = `sms-reminders failed: ${data.error || r.status}`;
        results.errors.push(msg);
        log.push(`[sms-reminders] ERREUR: ${msg}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      results.errors.push(`sms-reminders: ${msg}`);
      log.push(`[sms-reminders] EXCEPTION: ${msg}`);
    }

    // ─── Notification Telegram de synthèse ───
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (token && chatId) {
      const status = results.errors.length === 0 ? "✅" : "⚠️";
      const text =
        `${status} <b>Prospection automatique</b>\n\n` +
        `<b>Ajoutés :</b> ${results.inserted}\n` +
        `<b>Emails envoyés :</b> ${results.sent}\n` +
        (results.errors.length ? `<b>Erreurs :</b>\n${results.errors.map(e => "• " + e.slice(0, 150)).join("\n").slice(0, 800)}` : "");
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "HTML",
            disable_web_page_preview: true,
            disable_notification: true,
          }),
          signal: AbortSignal.timeout(10000),
        });
      } catch { /* silent */ }
    }

    return NextResponse.json({
      success: results.errors.length === 0,
      results,
      log,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.error("[cron] fatal:", err);
    return NextResponse.json({ success: false, error: msg, log }, { status: 500 });
  }
}
