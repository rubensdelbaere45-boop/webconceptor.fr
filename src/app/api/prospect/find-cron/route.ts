import { NextRequest, NextResponse } from "next/server";
import { safeCompare } from "@/lib/security";

/* ══════════════════════════════════════════
   FIND-CRON : prospection UNIQUEMENT (pas d'envoi).
   Tourne hors couvre-feu (19h–22h UTC) pour remplir
   la DB sans contrainte de sending hours.
   5 queries × 60s max = ~300s Vercel budget.
   ══════════════════════════════════════════ */

const FIND_QUERIES = [
  // ── ZONE AUBENTON (≤60km) — priorité haute : Laon, Vervins, Hirson, Guise, Fourmies, Charleville-Mézières ──
  "épicerie de proximité Laon", "épicerie de proximité Vervins", "épicerie de proximité Hirson",
  "épicerie de proximité Guise", "épicerie de proximité Fourmies",
  "supérette alimentation Laon", "supérette alimentation Vervins", "supérette alimentation Hirson",
  "boulangerie artisanale Laon", "boulangerie artisanale Vervins", "boulangerie artisanale Hirson",
  "boulangerie artisanale Guise", "boulangerie artisanale Fourmies",
  "boucherie artisanale Laon", "boucherie artisanale Vervins", "boucherie artisanale Hirson",
  "restaurant Laon", "restaurant Vervins", "restaurant Hirson", "restaurant Guise", "restaurant Fourmies",
  "brasserie Laon", "brasserie Charleville-Mézières", "pizzeria Laon", "pizzeria Fourmies",
  "café bar Laon", "café bar Vervins", "café bar Hirson", "café bar Guise",
  "coiffeur Laon", "coiffeur Vervins", "coiffeur Hirson", "coiffeur Fourmies",
  "fleuriste Laon", "fleuriste Charleville-Mézières", "fleuriste Fourmies",
  "primeur fruits légumes Laon", "primeur fruits légumes Vervins",
  "garage auto Laon", "garage auto Vervins", "garage auto Charleville-Mézières",
  "plombier Laon", "plombier Vervins", "plombier Hirson", "plombier Guise",
  "électricien Laon", "électricien Vervins", "électricien Charleville-Mézières",
  "menuisier Laon", "menuisier Vervins", "menuisier Charleville-Mézières",
  // ── Menuisiers ──
  "menuisier Albi", "menuisier Amiens", "menuisier Angers", "menuisier Avignon",
  "menuisier Bayonne", "menuisier Béziers", "menuisier Brest", "menuisier Caen",
  "menuisier Chambéry", "menuisier Chartres", "menuisier Cherbourg",
  "menuisier Clermont-Ferrand", "menuisier Colmar", "menuisier Dunkerque",
  "menuisier La Rochelle", "menuisier Le Mans", "menuisier Lens",
  "menuisier Limoges", "menuisier Lorient", "menuisier Metz",
  "menuisier Mulhouse", "menuisier Nancy", "menuisier Niort",
  "menuisier Orléans", "menuisier Pau", "menuisier Perpignan",
  "menuisier Poitiers", "menuisier Quimper", "menuisier Rouen",
  "menuisier Saint-Étienne", "menuisier Toulon", "menuisier Troyes",
  "menuisier Valence", "menuisier Vannes",
  // ── Peintres en bâtiment ──
  "peintre bâtiment Amiens", "peintre bâtiment Angers", "peintre bâtiment Avignon",
  "peintre bâtiment Brest", "peintre bâtiment Caen", "peintre bâtiment Chambéry",
  "peintre bâtiment Clermont-Ferrand", "peintre bâtiment Colmar",
  "peintre bâtiment La Rochelle", "peintre bâtiment Le Mans", "peintre bâtiment Lens",
  "peintre bâtiment Limoges", "peintre bâtiment Metz", "peintre bâtiment Nancy",
  "peintre bâtiment Orléans", "peintre bâtiment Rouen", "peintre bâtiment Saint-Étienne",
  "peintre bâtiment Toulon", "peintre bâtiment Troyes", "peintre bâtiment Valence",
  // ── Vétérinaires ──
  "vétérinaire Albi", "vétérinaire Amiens", "vétérinaire Angers", "vétérinaire Avignon",
  "vétérinaire Bayonne", "vétérinaire Béziers", "vétérinaire Brest", "vétérinaire Caen",
  "vétérinaire Chambéry", "vétérinaire Chartres", "vétérinaire Cherbourg",
  "vétérinaire Clermont-Ferrand", "vétérinaire Colmar", "vétérinaire Dunkerque",
  "vétérinaire La Rochelle", "vétérinaire Le Mans", "vétérinaire Limoges",
  "vétérinaire Lorient", "vétérinaire Metz", "vétérinaire Nancy",
  "vétérinaire Niort", "vétérinaire Orléans", "vétérinaire Pau",
  "vétérinaire Perpignan", "vétérinaire Poitiers", "vétérinaire Quimper",
  "vétérinaire Rouen", "vétérinaire Saint-Étienne", "vétérinaire Toulon",
  "vétérinaire Troyes", "vétérinaire Valence", "vétérinaire Vannes",
  // ── Pharmacies / Opticiens ──
  "pharmacie indépendante Amiens", "pharmacie indépendante Angers",
  "pharmacie indépendante Avignon", "pharmacie indépendante Brest",
  "pharmacie indépendante Caen", "pharmacie indépendante Clermont-Ferrand",
  "pharmacie indépendante Le Mans", "pharmacie indépendante Limoges",
  "pharmacie indépendante Metz", "pharmacie indépendante Nancy",
  "pharmacie indépendante Orléans", "pharmacie indépendante Rouen",
  "opticien indépendant Amiens", "opticien indépendant Angers",
  "opticien indépendant Avignon", "opticien indépendant Brest",
  "opticien indépendant Caen", "opticien indépendant Clermont-Ferrand",
  "opticien indépendant Le Mans", "opticien indépendant Limoges",
  "opticien indépendant Metz", "opticien indépendant Nancy",
  "opticien indépendant Orléans", "opticien indépendant Rouen",
  // ── Pressing / Cordonneries ──
  "pressing teinturerie Amiens", "pressing teinturerie Angers",
  "pressing teinturerie Avignon", "pressing teinturerie Brest",
  "pressing teinturerie Caen", "pressing teinturerie Clermont-Ferrand",
  "pressing teinturerie Le Mans", "pressing teinturerie Limoges",
  "pressing teinturerie Metz", "pressing teinturerie Nancy",
  "pressing teinturerie Orléans", "pressing teinturerie Rouen",
  // ── Cave à vins / Épiceries fines ──
  "cave à vins Angers", "cave à vins Avignon", "cave à vins Bayonne",
  "cave à vins Béziers", "cave à vins Brest", "cave à vins Caen",
  "cave à vins Chambéry", "cave à vins Clermont-Ferrand",
  "cave à vins Colmar", "cave à vins Dijon", "cave à vins La Rochelle",
  "cave à vins Le Mans", "cave à vins Limoges", "cave à vins Metz",
  "cave à vins Nancy", "cave à vins Orléans", "cave à vins Pau",
  "cave à vins Perpignan", "cave à vins Rouen", "cave à vins Toulon",
  "épicerie fine Amiens", "épicerie fine Angers", "épicerie fine Avignon",
  "épicerie fine Brest", "épicerie fine Caen", "épicerie fine Clermont-Ferrand",
  "épicerie fine Metz", "épicerie fine Nancy", "épicerie fine Orléans",
  "épicerie fine Rouen", "épicerie fine Toulon",
  // ── Pizzerias ──
  "pizzeria Albi", "pizzeria Amiens", "pizzeria Angers", "pizzeria Avignon",
  "pizzeria Bayonne", "pizzeria Béziers", "pizzeria Brest", "pizzeria Caen",
  "pizzeria Chambéry", "pizzeria Chartres", "pizzeria Cherbourg",
  "pizzeria Clermont-Ferrand", "pizzeria Colmar", "pizzeria Dunkerque",
  "pizzeria La Rochelle", "pizzeria Le Mans", "pizzeria Lens",
  "pizzeria Limoges", "pizzeria Lorient", "pizzeria Metz",
  "pizzeria Mulhouse", "pizzeria Nancy", "pizzeria Niort",
  "pizzeria Orléans", "pizzeria Pau", "pizzeria Perpignan",
  "pizzeria Rouen", "pizzeria Saint-Étienne", "pizzeria Toulon",
  "pizzeria Troyes", "pizzeria Valence", "pizzeria Vannes",
  // ── Traiteurs / Salons de thé ──
  "traiteur Amiens", "traiteur Angers", "traiteur Avignon", "traiteur Brest",
  "traiteur Caen", "traiteur Clermont-Ferrand", "traiteur Le Mans",
  "traiteur Limoges", "traiteur Metz", "traiteur Nancy",
  "traiteur Orléans", "traiteur Rouen", "traiteur Toulon",
  "salon de thé Amiens", "salon de thé Angers", "salon de thé Avignon",
  "salon de thé Brest", "salon de thé Caen", "salon de thé Clermont-Ferrand",
  "salon de thé Dijon", "salon de thé Le Mans", "salon de thé Limoges",
  "salon de thé Metz", "salon de thé Nancy", "salon de thé Orléans",
  "salon de thé Rouen", "salon de thé Toulon",
  // ── Médecins / Dentistes (cabinet indépendant) ──
  "dentiste cabinet Amiens", "dentiste cabinet Angers", "dentiste cabinet Avignon",
  "dentiste cabinet Brest", "dentiste cabinet Caen", "dentiste cabinet Clermont-Ferrand",
  "dentiste cabinet Le Mans", "dentiste cabinet Limoges", "dentiste cabinet Metz",
  "dentiste cabinet Nancy", "dentiste cabinet Orléans", "dentiste cabinet Rouen",
];

const QUERIES_PER_RUN = 5;

function inferBusinessType(query: string): string {
  const q = query.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/restaurant|brasserie|pizzeria|bistrot|traiteur|sushi|creperie|gastronomique/.test(q)) return "restaurant";
  if (/coiffeur|salon de coiffure|barbier/.test(q)) return "coiffeur";
  if (/boulangerie|patisserie|viennoiserie|chocolatier/.test(q)) return "boulangerie";
  if (/glacier|glace/.test(q)) return "glacier";
  if (/cafe|bar |salon de the|cave a vins|cave a biere|epicerie fine/.test(q)) return "cafe";
  if (/plombier|chauffagiste/.test(q)) return "plombier";
  if (/electricien/.test(q)) return "electricien";
  if (/garage|mecanique|carrossier|controle technique/.test(q)) return "garage";
  if (/fleuriste/.test(q)) return "fleuriste";
  if (/auto.ecole/.test(q)) return "auto_ecole";
  if (/osteopathe|kinesitherapeute/.test(q)) return "osteo";
  if (/dentiste|pharmacie|opticien|medecin|veterinaire/.test(q)) return "dentiste";
  if (/menuisier|peintre|charpentier|couvreur|macon|carreleur|platrier/.test(q)) return "plombier";
  if (/pressing|cordonnerie|retouche/.test(q)) return "epicerie";
  if (/institut de beaute|spa|massage|manucure|onglerie|tatoueur/.test(q)) return "institut";
  if (/proxi|epicerie|superette|alimentation|boucherie|primeur|fromager|tabac/.test(q)) return "epicerie";
  return "restaurant";
}

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET || "";
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET non configure" }, { status: 500 });
  }
  const sent = req.headers.get("x-cron-secret") || req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  if (!safeCompare(sent, cronSecret)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const origin = "https://klyora.fr";
  const adminKey = process.env.ADMIN_SECRET_KEY || "";
  const log: string[] = [];
  const results = { found: 0, inserted: 0, errors: [] as string[] };

  // Rotation horaire décalée de QUERIES_PER_RUN*12 pour ne pas répéter les queries du cron principal
  const runIndex = Math.floor(Date.now() / (1 * 60 * 60 * 1000));
  const offset = ((runIndex * QUERIES_PER_RUN) + 36) % FIND_QUERIES.length; // +36 = décalage vs cron principal
  const queries: string[] = [];
  for (let i = 0; i < QUERIES_PER_RUN; i++) {
    queries.push(FIND_QUERIES[(offset + i) % FIND_QUERIES.length]);
  }

  for (const q of queries) {
    const btype = inferBusinessType(q);
    log.push(`[find] "${q}" (type=${btype})`);
    try {
      const r = await fetch(`${origin}/api/prospect/find`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ query: q, business_type: btype }),
        signal: AbortSignal.timeout(55_000),
      });
      const data = await r.json().catch(() => ({}));
      if (r.ok && data.stats) {
        results.found += Number(data.stats.found || 0);
        results.inserted += Number(data.stats.inserted || 0);
        log.push(`[find] ✓ ${data.stats.inserted}/${data.stats.found} insérés`);
      } else {
        const msg = `find failed "${q}": ${data.error || r.status}`;
        results.errors.push(msg);
        log.push(`[find] ✗ ${msg}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      results.errors.push(`find "${q}": ${msg}`);
      log.push(`[find] ✗ timeout: ${msg}`);
    }
  }

  return NextResponse.json({ success: results.errors.length === 0, results, log });
}
