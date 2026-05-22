import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   CRON : prospection + envoi quotidien automatique.
   Split en 2 phases :
   - Phase FIND  : 3 queries × 60s max = ~180s → laisse de la marge
   - Phase SEND  : 60 emails × batch     = ~90s
   Total cible : < 280s sur 300s max Vercel.

   Auth : header "x-cron-secret" ou Bearer token (Vercel injecte automatiquement).
   ══════════════════════════════════════════ */

/* ─────────────────────────────────────────────────────────────────────────────
   LISTE DE QUERIES — 350+ villes françaises variées.
   Priorité aux villes moyennes (10k–100k hab) peu couvertes par les grandes bases :
   elles ont souvent des commerces sans site web ou avec site vieillissant.
   ───────────────────────────────────────────────────────────────────────────── */
const DEFAULT_QUERIES = [
  // ── Restaurants / petites villes ──
  "restaurant Albi", "restaurant Angoulême", "restaurant Arles", "restaurant Aubagne",
  "restaurant Avignon", "restaurant Bayonne", "restaurant Belfort", "restaurant Béziers",
  "restaurant Blois", "restaurant Brest", "restaurant Brive-la-Gaillarde", "restaurant Caen",
  "restaurant Calais", "restaurant Carcassonne", "restaurant Châlons-en-Champagne",
  "restaurant Chambéry", "restaurant Charleville-Mézières", "restaurant Chartres",
  "restaurant Châteauroux", "restaurant Cherbourg", "restaurant Clermont-Ferrand",
  "restaurant Colmar", "restaurant Creil", "restaurant Dunkerque",
  "restaurant Évreux", "restaurant Fréjus", "restaurant Gap", "restaurant Hyères",
  "restaurant La Rochelle", "restaurant Laval", "restaurant Le Mans", "restaurant Lens",
  "restaurant Limoges", "restaurant Lorient", "restaurant Mâcon", "restaurant Metz",
  "restaurant Mont-de-Marsan", "restaurant Montauban", "restaurant Mulhouse",
  "restaurant Niort", "restaurant Orléans", "restaurant Pau", "restaurant Perpignan",
  "restaurant Poitiers", "restaurant Quimper", "restaurant Roanne", "restaurant Rodez",
  "restaurant Saint-Brieuc", "restaurant Saint-Malo", "restaurant Saint-Nazaire",
  "restaurant Tarbes", "restaurant Thionville", "restaurant Troyes", "restaurant Valence",
  "restaurant Valenciennes", "restaurant Vannes", "restaurant Versailles", "restaurant Vichy",
  "restaurant Villeurbanne", "restaurant Vitry-sur-Seine",
  // ── Brasseries / villages ──
  "brasserie Auch", "brasserie Bagnols-sur-Cèze", "brasserie Bastia", "brasserie Bayeux",
  "brasserie Beauvais", "brasserie Bergerac", "brasserie Béziers", "brasserie Brive",
  "brasserie Cahors", "brasserie Castres", "brasserie Châtellerault", "brasserie Cholet",
  "brasserie Compiègne", "brasserie Dax", "brasserie Draguignan", "brasserie Elbeuf",
  "brasserie Épinal", "brasserie Flers", "brasserie Fontenay-le-Comte",
  // ── Coiffeurs ──
  "coiffeur Ajaccio", "coiffeur Alençon", "coiffeur Arras", "coiffeur Aurillac",
  "coiffeur Auxerre", "coiffeur Avignon", "coiffeur Bobigny", "coiffeur Boulogne-sur-Mer",
  "coiffeur Bourges", "coiffeur Brest", "coiffeur Caen", "coiffeur Cannes",
  "coiffeur Cergy", "coiffeur Chartres", "coiffeur Cherbourg", "coiffeur Colmar",
  "coiffeur Créteil", "coiffeur Dunkerque", "coiffeur Évreux", "coiffeur Foix",
  "coiffeur Guéret", "coiffeur La Roche-sur-Yon", "coiffeur Laon", "coiffeur Laval",
  "coiffeur Le Havre", "coiffeur Lens", "coiffeur Limoges", "coiffeur Lorient",
  "coiffeur Mâcon", "coiffeur Mende", "coiffeur Metz", "coiffeur Mont-de-Marsan",
  "coiffeur Montauban", "coiffeur Moulins", "coiffeur Mulhouse", "coiffeur Nancy",
  "coiffeur Nîmes", "coiffeur Niort", "coiffeur Orléans", "coiffeur Pau",
  "coiffeur Périgueux", "coiffeur Perpignan", "coiffeur Poitiers", "coiffeur Privas",
  "coiffeur Quimper", "coiffeur Rodez", "coiffeur Rouen", "coiffeur Saint-Brieuc",
  "coiffeur Saint-Étienne", "coiffeur Saint-Lô", "coiffeur Tarbes", "coiffeur Toulon",
  "coiffeur Troyes", "coiffeur Tulle", "coiffeur Valence", "coiffeur Vannes",
  "salon de coiffure Vesoul", "salon de coiffure Villefranche-sur-Saône",
  "barbier Annecy", "barbier Cannes", "barbier Clermont-Ferrand", "barbier Dijon",
  // ── Boulangeries / pâtisseries ──
  "boulangerie artisanale Aix-en-Provence", "boulangerie artisanale Amiens",
  "boulangerie artisanale Angers", "boulangerie artisanale Brest", "boulangerie artisanale Caen",
  "boulangerie artisanale Clermont-Ferrand", "boulangerie artisanale Dijon",
  "boulangerie artisanale Le Mans", "boulangerie artisanale Limoges",
  "boulangerie artisanale Metz", "boulangerie artisanale Orléans", "boulangerie artisanale Pau",
  "boulangerie artisanale Perpignan", "boulangerie artisanale Rennes",
  "boulangerie artisanale Rouen", "boulangerie artisanale Saint-Étienne",
  "boulangerie artisanale Toulon", "boulangerie artisanale Tours",
  "boulangerie artisanale Troyes", "boulangerie artisanale Valence",
  "pâtisserie artisanale Annecy", "pâtisserie artisanale Bayonne",
  "pâtisserie artisanale Béziers", "pâtisserie artisanale Bourges",
  "pâtisserie artisanale Caen", "pâtisserie artisanale Chartres",
  "pâtisserie artisanale Dunkerque", "pâtisserie artisanale Metz",
  "pâtisserie artisanale Perpignan", "pâtisserie artisanale Valenciennes",
  // ── Artisans / plombiers ──
  "plombier Albi", "plombier Amiens", "plombier Angers", "plombier Arles",
  "plombier Aurillac", "plombier Avignon", "plombier Bayonne", "plombier Belfort",
  "plombier Béziers", "plombier Brest", "plombier Caen", "plombier Calais",
  "plombier Chambéry", "plombier Chartres", "plombier Cherbourg", "plombier Colmar",
  "plombier Dunkerque", "plombier Évreux", "plombier La Rochelle", "plombier Laval",
  "plombier Le Mans", "plombier Lens", "plombier Limoges", "plombier Lorient",
  "plombier Metz", "plombier Montauban", "plombier Mulhouse", "plombier Nancy",
  "plombier Niort", "plombier Orléans", "plombier Pau", "plombier Perpignan",
  "plombier Poitiers", "plombier Quimper", "plombier Rennes", "plombier Rouen",
  "plombier Saint-Brieuc", "plombier Saint-Étienne", "plombier Saint-Nazaire",
  "plombier Tarbes", "plombier Toulon", "plombier Tours", "plombier Troyes",
  "plombier Valence", "plombier Vannes",
  "électricien Albi", "électricien Alençon", "électricien Amiens", "électricien Angers",
  "électricien Avignon", "électricien Bayonne", "électricien Belfort",
  "électricien Béziers", "électricien Brest", "électricien Caen",
  "électricien Chambéry", "électricien Chartres", "électricien Cherbourg",
  "électricien Clermont-Ferrand", "électricien Colmar", "électricien Dunkerque",
  "électricien La Rochelle", "électricien Le Mans", "électricien Lens",
  "électricien Limoges", "électricien Lorient", "électricien Metz",
  "électricien Montauban", "électricien Mulhouse", "électricien Nancy",
  "électricien Niort", "électricien Orléans", "électricien Pau",
  "électricien Poitiers", "électricien Quimper", "électricien Rouen",
  "électricien Saint-Étienne", "électricien Toulon", "électricien Troyes",
  "électricien Valence", "électricien Vannes",
  // ── Garages / auto ──
  "garage auto Albi", "garage auto Amiens", "garage auto Angers", "garage auto Avignon",
  "garage auto Bayonne", "garage auto Béziers", "garage auto Brest", "garage auto Caen",
  "garage auto Chambéry", "garage auto Chartres", "garage auto Cherbourg",
  "garage auto Clermont-Ferrand", "garage auto Colmar", "garage auto Dunkerque",
  "garage auto La Rochelle", "garage auto Le Mans", "garage auto Lens",
  "garage auto Limoges", "garage auto Lorient", "garage auto Metz",
  "garage auto Montauban", "garage auto Mulhouse", "garage auto Nancy",
  "garage auto Niort", "garage auto Orléans", "garage auto Pau",
  "garage auto Perpignan", "garage auto Poitiers", "garage auto Quimper",
  "garage auto Rouen", "garage auto Saint-Étienne", "garage auto Toulon",
  "garage auto Troyes", "garage auto Valence", "garage auto Vannes",
  "carrossier Amiens", "carrossier Angers", "carrossier Avignon",
  "carrossier Brest", "carrossier Caen", "carrossier Clermont-Ferrand",
  "carrossier Le Mans", "carrossier Limoges", "carrossier Metz",
  "carrossier Nancy", "carrossier Orléans", "carrossier Rouen",
  // ── Beauté / Bien-être ──
  "institut de beauté Albi", "institut de beauté Amiens", "institut de beauté Angers",
  "institut de beauté Avignon", "institut de beauté Bayonne", "institut de beauté Béziers",
  "institut de beauté Brest", "institut de beauté Caen", "institut de beauté Chambéry",
  "institut de beauté Chartres", "institut de beauté Cherbourg",
  "institut de beauté Clermont-Ferrand", "institut de beauté Colmar",
  "institut de beauté Dunkerque", "institut de beauté La Rochelle",
  "institut de beauté Le Mans", "institut de beauté Lens",
  "institut de beauté Limoges", "institut de beauté Lorient",
  "institut de beauté Metz", "institut de beauté Montauban",
  "institut de beauté Mulhouse", "institut de beauté Nancy",
  "institut de beauté Niort", "institut de beauté Orléans",
  "institut de beauté Pau", "institut de beauté Perpignan",
  "institut de beauté Poitiers", "institut de beauté Quimper",
  "institut de beauté Rouen", "institut de beauté Saint-Étienne",
  "institut de beauté Toulon", "institut de beauté Troyes",
  "institut de beauté Valence", "institut de beauté Vannes",
  "spa massage Albi", "spa massage Angers", "spa massage Avignon",
  "spa massage Béziers", "spa massage Brest", "spa massage Caen",
  "spa massage Chartres", "spa massage Clermont-Ferrand",
  "spa massage Le Mans", "spa massage Limoges", "spa massage Metz",
  "spa massage Nancy", "spa massage Orléans", "spa massage Rouen",
  "tatoueur piercing Albi", "tatoueur piercing Amiens", "tatoueur piercing Angers",
  "tatoueur piercing Avignon", "tatoueur piercing Brest", "tatoueur piercing Caen",
  "tatoueur piercing Clermont-Ferrand", "tatoueur piercing Limoges",
  "tatoueur piercing Nancy", "tatoueur piercing Orléans",
  // ── Fleuristes ──
  "fleuriste Albi", "fleuriste Amiens", "fleuriste Angers", "fleuriste Avignon",
  "fleuriste Bayonne", "fleuriste Béziers", "fleuriste Brest", "fleuriste Caen",
  "fleuriste Chambéry", "fleuriste Chartres", "fleuriste Cherbourg",
  "fleuriste Clermont-Ferrand", "fleuriste Colmar", "fleuriste Dunkerque",
  "fleuriste La Rochelle", "fleuriste Le Mans", "fleuriste Lens",
  "fleuriste Limoges", "fleuriste Lorient", "fleuriste Metz",
  "fleuriste Mulhouse", "fleuriste Nancy", "fleuriste Niort",
  "fleuriste Orléans", "fleuriste Pau", "fleuriste Perpignan",
  "fleuriste Poitiers", "fleuriste Quimper", "fleuriste Rouen",
  "fleuriste Saint-Étienne", "fleuriste Toulon", "fleuriste Troyes",
  "fleuriste Valence", "fleuriste Vannes",
  // ── Épiceries / Commerce de proximité ──
  "épicerie de proximité Amiens", "épicerie de proximité Angers",
  "épicerie de proximité Avignon", "épicerie de proximité Brest",
  "épicerie de proximité Caen", "épicerie de proximité Clermont-Ferrand",
  "épicerie de proximité Dijon", "épicerie de proximité Le Mans",
  "épicerie de proximité Limoges", "épicerie de proximité Metz",
  "épicerie de proximité Nancy", "épicerie de proximité Nice",
  "épicerie de proximité Orléans", "épicerie de proximité Rouen",
  "épicerie de proximité Saint-Étienne", "épicerie de proximité Toulon",
  "épicerie de proximité Troyes", "épicerie de proximité Valence",
  "supérette alimentation Amiens", "supérette alimentation Angers",
  "supérette alimentation Avignon", "supérette alimentation Brest",
  "supérette alimentation Caen", "supérette alimentation Clermont-Ferrand",
  "supérette alimentation Le Mans", "supérette alimentation Metz",
  "supérette alimentation Nancy", "supérette alimentation Orléans",
  "supérette alimentation Rouen", "supérette alimentation Toulon",
  "boucherie artisanale Amiens", "boucherie artisanale Angers",
  "boucherie artisanale Avignon", "boucherie artisanale Brest",
  "boucherie artisanale Caen", "boucherie artisanale Clermont-Ferrand",
  "boucherie artisanale Limoges", "boucherie artisanale Metz",
  "boucherie artisanale Nancy", "boucherie artisanale Orléans",
  "boucherie artisanale Rouen", "boucherie artisanale Toulon",
  "primeur fruits légumes Amiens", "primeur fruits légumes Angers",
  "primeur fruits légumes Avignon", "primeur fruits légumes Brest",
  "primeur fruits légumes Caen", "primeur fruits légumes Metz",
  "primeur fruits légumes Nancy", "primeur fruits légumes Orléans",
  // ── Auto-écoles ──
  "auto-école Albi", "auto-école Amiens", "auto-école Angers", "auto-école Avignon",
  "auto-école Bayonne", "auto-école Béziers", "auto-école Brest", "auto-école Caen",
  "auto-école Chambéry", "auto-école Chartres", "auto-école Cherbourg",
  "auto-école Clermont-Ferrand", "auto-école Colmar", "auto-école Dunkerque",
  "auto-école La Rochelle", "auto-école Le Mans", "auto-école Lens",
  "auto-école Limoges", "auto-école Lorient", "auto-école Metz",
  "auto-école Mulhouse", "auto-école Nancy", "auto-école Niort",
  "auto-école Orléans", "auto-école Pau", "auto-école Perpignan",
  "auto-école Poitiers", "auto-école Quimper", "auto-école Rouen",
  "auto-école Saint-Étienne", "auto-école Toulon", "auto-école Troyes",
  "auto-école Valence", "auto-école Vannes",
  // ── Ostéos / kiné ──
  "ostéopathe Albi", "ostéopathe Amiens", "ostéopathe Angers", "ostéopathe Avignon",
  "ostéopathe Bayonne", "ostéopathe Béziers", "ostéopathe Brest", "ostéopathe Caen",
  "ostéopathe Chambéry", "ostéopathe Chartres", "ostéopathe Clermont-Ferrand",
  "ostéopathe Colmar", "ostéopathe Dunkerque", "ostéopathe La Rochelle",
  "ostéopathe Le Mans", "ostéopathe Limoges", "ostéopathe Lorient",
  "ostéopathe Metz", "ostéopathe Mulhouse", "ostéopathe Nancy",
  "ostéopathe Niort", "ostéopathe Orléans", "ostéopathe Pau",
  "ostéopathe Perpignan", "ostéopathe Poitiers", "ostéopathe Quimper",
  "ostéopathe Rouen", "ostéopathe Saint-Étienne", "ostéopathe Toulon",
  "ostéopathe Troyes", "ostéopathe Valence", "ostéopathe Vannes",
  "kinésithérapeute Albi", "kinésithérapeute Amiens", "kinésithérapeute Angers",
  "kinésithérapeute Avignon", "kinésithérapeute Brest", "kinésithérapeute Caen",
  "kinésithérapeute Clermont-Ferrand", "kinésithérapeute Le Mans",
  "kinésithérapeute Limoges", "kinésithérapeute Metz", "kinésithérapeute Nancy",
  "kinésithérapeute Orléans", "kinésithérapeute Rouen", "kinésithérapeute Toulon",
];

// 3 queries par run × 12 runs/jour = 36 queries/jour
// Chaque query renvoie ~20 places → ~720 places/jour → ~200 prospects avec email/jour
const QUERIES_PER_RUN = 3;

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
  return "restaurant";
}

export async function GET(req: NextRequest) {
  return runCron(req);
}

export async function POST(req: NextRequest) {
  return runCron(req);
}

async function runCron(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || "";
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET non configure" }, { status: 500 });
  }
  const sent = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!safeCompare(sent, cronSecret)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const query = req.nextUrl.searchParams.get("query")?.trim().slice(0, 200) || "";
  const batchParam = Number(req.nextUrl.searchParams.get("batch"));
  // 60 emails par run × 12 runs/jour = 720 emails/jour → ~18 720 en 26 jours (quota Brevo 20k) ✅
  const batch_size = Number.isFinite(batchParam) && batchParam > 0
    ? Math.min(80, Math.max(1, Math.floor(batchParam)))
    : 60;

  // Rotation par fenêtre de 2h (12 fois/jour) pour varier les requêtes
  const queries: string[] = query ? [query] : (() => {
    const runIndex = Math.floor(Date.now() / (2 * 60 * 60 * 1000));
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
    // ─── Phase 1 : FIND (timeout 55s par query) ───────────────────────────
    for (const q of queries) {
      const btype = inferBusinessType(q);
      log.push(`[find] "${q}" (type=${btype})`);
      try {
        const r = await fetch(`${origin}/api/prospect/find`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
          body: JSON.stringify({ query: q, business_type: btype }),
          signal: AbortSignal.timeout(55_000), // 55s max par query (budget total : 3×55=165s)
        });
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.stats) {
          results.found += Number(data.stats.found || 0);
          results.inserted += Number(data.stats.inserted || 0);
          log.push(`[find] ✓ ${data.stats.inserted}/${data.stats.found} insérés (${data.stats.withEmail} avec email, ${data.stats.skippedDuplicate} doublons)`);
        } else {
          const msg = `find failed "${q}": ${data.error || r.status}`;
          results.errors.push(msg);
          log.push(`[find] ✗ ${msg}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "unknown";
        results.errors.push(`find "${q}": ${msg}`);
        log.push(`[find] ✗ timeout/erreur: ${msg}`);
      }
    }

    // Petit délai pour que les inserts se propagent en DB
    await new Promise((res) => setTimeout(res, 1500));

    // ─── Phase 2 : SEND (batch_size emails) ──────────────────────────────
    log.push(`[send] batch_size=${batch_size}`);
    try {
      const r = await fetch(`${origin}/api/prospect/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ batch_size, dry_run: false }),
        signal: AbortSignal.timeout(110_000), // 110s max → total cron ≤ 280s
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        const ok = Array.isArray(data.results)
          ? data.results.filter((x: { status: string }) => x.status === "sent").length
          : 0;
        results.sent = ok;
        log.push(`[send] ✓ ${ok}/${data.processed || 0} emails envoyés`);
      } else {
        const msg = `send failed: ${data.error || r.status}`;
        results.errors.push(msg);
        log.push(`[send] ✗ ${msg}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      results.errors.push(`send: ${msg}`);
      log.push(`[send] ✗ ${msg}`);
    }

    // ─── Phase 3 : RELANCES EMAIL ─────────────────────────────────────────
    log.push(`[relances] email-reminders...`);
    try {
      const r = await fetch(`${origin}/api/prospect/email-reminders`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        signal: AbortSignal.timeout(30_000),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok) {
        log.push(`[relances] ✓ ${data.sent || 0}/${data.processed || 0} emails de relance`);
      } else {
        log.push(`[relances] ✗ ${data.error || r.status}`);
      }
    } catch { log.push(`[relances] ✗ timeout`); }

    // ─── Notification Telegram ─────────────────────────────────────────────
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;
    if (token && chatId) {
      const status = results.errors.length === 0 ? "✅" : "⚠️";
      const text =
        `${status} <b>Prospection auto</b>\n\n` +
        `<b>Nouveaux prospects :</b> ${results.inserted}\n` +
        `<b>Emails envoyés :</b> ${results.sent}\n` +
        (results.errors.length ? `<b>Erreurs :</b>\n${results.errors.map(e => "• " + e.slice(0, 120)).join("\n").slice(0, 600)}` : "");
      try {
        await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML", disable_web_page_preview: true, disable_notification: true }),
          signal: AbortSignal.timeout(8000),
        });
      } catch { /* silent */ }
    }

    return NextResponse.json({ success: results.errors.length === 0, results, log });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ success: false, error: msg, log }, { status: 500 });
  }
}
