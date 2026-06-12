import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, isWithinSendingHours } from "@/lib/security";

/* ══════════════════════════════════════════
   TableFlow — Send emails personnalisés
   Envoie l'aperçu du menu digital de chaque restaurant.
   ══════════════════════════════════════════ */

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

interface Prospect {
  id: string;
  slug: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  website?: string;
  email?: string;
  google_rating?: number;
  google_reviews_count?: number;
  photos?: string[];
  hours?: string;
  cuisine_type?: string;
  menu_items?: Array<{ name: string; description?: string; price?: string; category?: string }> | null;
}

/* ─── Emoji par catégorie ─────────────────────────────────────────────────── */
function getCatEmoji(cat?: string): string {
  const c = (cat || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  if (/entree|salade|tapas/.test(c)) return "🥗";
  if (/plat|viande|poisson|grill/.test(c)) return "🍽️";
  if (/dessert|glace|patisserie/.test(c)) return "🍮";
  if (/boisson|vin|cocktail|biere/.test(c)) return "🥤";
  if (/pizza/.test(c)) return "🍕";
  if (/burger/.test(c)) return "🍔";
  if (/formule|menu/.test(c)) return "🎁";
  if (/pain|boulang/.test(c)) return "🥖";
  return "🍴";
}

/* ─── Génère le preview HTML des plats (3 catégories, 2 plats max/cat) ──── */
function buildMenuPreviewHtml(menuItems: Prospect["menu_items"]): string {
  if (!menuItems || menuItems.length === 0) return "";

  // Groupe par catégorie
  const groups: Record<string, typeof menuItems> = {};
  for (const item of menuItems) {
    const cat = item.category || "Carte";
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  }

  const cats = Object.keys(groups).slice(0, 3); // Max 3 catégories

  const catBlocks = cats.map((cat) => {
    const items = groups[cat].slice(0, 2); // Max 2 plats par cat
    const emoji = getCatEmoji(cat);
    const itemsHtml = items.map((item) => {
      const price = item.price
        ? `<span style="font-weight:700;color:#1a1310">${item.price.toString().replace(".", ",")} €</span>`
        : "";
      const desc = item.description
        ? `<div style="font-size:12px;color:#888;margin-top:2px;line-height:1.4">${item.description.slice(0, 80)}</div>`
        : "";
      return `
        <div style="padding:10px 0;border-bottom:1px solid #F0F0EC;display:flex;justify-content:space-between;align-items:flex-start;gap:12px">
          <div style="flex:1;min-width:0">
            <div style="font-size:13.5px;font-weight:600;color:#1a1310">${item.name}</div>
            ${desc}
          </div>
          ${price}
        </div>`;
    }).join("");

    return `
      <div style="margin-bottom:18px">
        <div style="font-size:11px;font-weight:700;color:#c19a56;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px">
          ${emoji} ${cat}
        </div>
        ${itemsHtml}
      </div>`;
  }).join("");

  return `
    <div style="background:#FAFAF8;border:1.5px solid #E8E4DC;border-radius:12px;padding:18px 20px;margin:20px 0">
      <div style="font-size:12px;font-weight:600;color:#888;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:14px">
        📱 Aperçu — ce que vos clients voient sur leur téléphone
      </div>
      ${catBlocks}
      <div style="font-size:11.5px;color:#AAA;margin-top:8px;text-align:center">… et l'intégralité de votre carte</div>
    </div>`;
}

/* ─── Extrait 2-3 plats emblématiques pour la personnalisation ───────────── */
function getHighlightDishes(menuItems: Prospect["menu_items"]): string[] {
  if (!menuItems || menuItems.length === 0) return [];
  // Privilégie les plats (pas les boissons ni desserts simples)
  const mainDishes = menuItems.filter((i) => {
    const cat = (i.category || "").toLowerCase();
    return /plat|viande|poisson|pizza|burger|galette|ramen|sushi|grillad/i.test(cat);
  });
  const source = mainDishes.length >= 2 ? mainDishes : menuItems;
  // Prend les plats avec un nom le plus expressif (> 5 chars)
  return source
    .filter((i) => i.name && i.name.length > 5)
    .slice(0, 3)
    .map((i) => i.name);
}

/* ─── Corps de l'email ────────────────────────────────────────────────────── */
function buildEmailBody(prospect: Prospect, demoUrl: string): string {
  const rating = prospect.google_rating
    ? `<span style="color:#F59E0B">★</span> ${prospect.google_rating.toFixed(1).replace(".", ",")} (${prospect.google_reviews_count} avis) · `
    : "";

  const menuPreview = buildMenuPreviewHtml(prospect.menu_items);
  const highlights  = getHighlightDishes(prospect.menu_items);

  // Phrase d'accroche personnalisée avec les vrais plats
  let dishLine = "";
  if (highlights.length >= 2) {
    const listed = highlights.slice(0, 2).map((d) => `<strong>${d}</strong>`).join(", ");
    dishLine = `Votre <span style="color:#c19a56">${listed}</span> — et toute votre carte — sera désormais visible en 3 secondes sur le téléphone de chaque client qui s'assoit à votre table.`;
  } else if (highlights.length === 1) {
    dishLine = `Votre <span style="color:#c19a56"><strong>${highlights[0]}</strong></span> — et toute votre carte — sera désormais visible en 3 secondes sur le téléphone de chaque client.`;
  } else {
    dishLine = `Toute votre carte sera visible en 3 secondes sur le téléphone de chaque client qui s'assoit à votre table.`;
  }

  const websiteNote = prospect.website
    ? `J'ai retrouvé votre site (${new URL(prospect.website).hostname}) et importé vos plats automatiquement.`
    : `J'ai reconstruit votre carte — vous pourrez la personnaliser en quelques clics depuis votre téléphone.`;

  const coverImg = prospect.photos?.[0]
    ? `<img src="${prospect.photos[0]}" alt="${prospect.name}" width="100%" style="width:100%;height:180px;object-fit:cover;border-radius:12px 12px 0 0;display:block" />`
    : `<div style="height:120px;background:linear-gradient(135deg,#1a1310,#c19a56);border-radius:12px 12px 0 0"></div>`;

  return `<div style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1310;line-height:1.65;background:#fff">

  <!-- Header -->
  <div style="margin-bottom:28px">
    <div style="display:inline-flex;align-items:center;gap:8px;margin-bottom:20px">
      <div style="width:28px;height:28px;background:linear-gradient(135deg,#1a1310,#2d1f0e);border-radius:8px;display:grid;place-items:center">
        <span style="color:#c19a56;font-size:14px;font-weight:700">TF</span>
      </div>
      <span style="font-weight:700;font-size:15px;color:#1a1310">TableFlow</span>
    </div>
    <p style="margin:0;font-size:14px;color:#888">Menu digital pour restaurateurs</p>
  </div>

  <!-- Accroche -->
  <p style="margin:0 0 20px;font-size:22px;font-weight:700;letter-spacing:-0.02em;color:#1a1310;line-height:1.25">
    Bonjour,<br/>j'ai créé le menu digital de <span style="color:#c19a56">${prospect.name}</span>.
  </p>

  <p style="margin:0 0 16px;font-size:15px;color:#4a4340;line-height:1.7">
    ${dishLine}
  </p>

  <p style="margin:0 0 16px;font-size:14px;color:#888;line-height:1.6">
    ${websiteNote} Il leur suffit de scanner le QR code posé sur la table — aucune appli à télécharger.
  </p>

  <!-- Preview carte restaurant -->
  <div style="border:1.5px solid #E8E4DC;border-radius:14px;overflow:hidden;margin:20px 0;box-shadow:0 4px 16px rgba(26,19,16,0.08)">
    ${coverImg}
    <div style="padding:16px 18px 8px">
      <div style="font-weight:700;font-size:17px;color:#1a1310">${prospect.name}</div>
      <div style="font-size:13px;color:#888;margin-top:3px">${rating}${prospect.city || prospect.address || ""}</div>
    </div>
    ${menuPreview}
    <div style="padding:0 18px 18px">
      <a href="${demoUrl}" style="display:block;background:#1a1310;color:#f9f5ef;padding:14px 20px;border-radius:10px;text-align:center;font-weight:700;font-size:14px;text-decoration:none">
        Voir mon menu complet →
      </a>
    </div>
  </div>

  <!-- Bénéfices -->
  <div style="background:#FAFAF8;border-radius:12px;padding:20px;margin:20px 0">
    <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.08em">Ce que ça vous apporte</p>
    <div style="display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;gap:10px;align-items:flex-start">
        <span style="font-size:18px;flex-shrink:0">📸</span>
        <div>
          <div style="font-weight:600;font-size:14px">Vos plats avec des visuels</div>
          <div style="font-size:12.5px;color:#888">Les clients voient le plat avant de commander → moins d'hésitation, plus de satisfaction</div>
        </div>
      </div>
      <div style="display:flex;gap:10px;align-items:flex-start">
        <span style="font-size:18px;flex-shrink:0">📱</span>
        <div>
          <div style="font-weight:600;font-size:14px">QR code à poser sur les tables</div>
          <div style="font-size:12.5px;color:#888">Imprimez-le une fois, vos clients scannent depuis leur propre téléphone</div>
        </div>
      </div>
      <div style="display:flex;gap:10px;align-items:flex-start">
        <span style="font-size:18px;flex-shrink:0">✏️</span>
        <div>
          <div style="font-weight:600;font-size:14px">Carte modifiable en 2 minutes</div>
          <div style="font-size:12.5px;color:#888">Changez un prix ou ajoutez un plat du jour depuis votre téléphone, sans technique</div>
        </div>
      </div>
      <div style="display:flex;gap:10px;align-items:flex-start">
        <span style="font-size:18px;flex-shrink:0">🌍</span>
        <div>
          <div style="font-weight:600;font-size:14px">Traduit automatiquement (EN, ES, DE…)</div>
          <div style="font-size:12.5px;color:#888">Vos clients étrangers voient la carte dans leur langue</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Prix -->
  <div style="background:linear-gradient(135deg,#1a1310,#2d1f0e);border-radius:12px;padding:20px;margin:20px 0;text-align:center">
    <p style="margin:0 0 4px;font-size:12px;color:rgba(249,245,239,0.6);text-transform:uppercase;letter-spacing:0.1em">Offre de lancement</p>
    <p style="margin:0 0 4px;font-size:32px;font-weight:700;color:#c19a56">49 €<span style="font-size:16px;font-weight:400;color:rgba(249,245,239,0.7)">/mois</span></p>
    <p style="margin:0 0 16px;font-size:13px;color:rgba(249,245,239,0.7)">Sans engagement · 14 jours gratuits · Résiliable en 1 clic</p>
    <a href="${demoUrl}" style="display:inline-block;background:#c19a56;color:#1a1310;padding:14px 32px;border-radius:10px;font-weight:700;font-size:15px;text-decoration:none">
      Activer mon menu digital →
    </a>
  </div>

  <!-- Footer -->
  <div style="margin-top:28px;padding-top:20px;border-top:1px solid #ECECEC">
    <p style="margin:0 0 8px;font-size:13px;color:#888;line-height:1.5">
      Cet email vous a été envoyé car ${prospect.name} n'a pas encore de menu digital.
      Si vous ne souhaitez plus recevoir nos messages :
      <a href="https://klyora.fr/api/unsubscribe?email={{EMAIL}}" style="color:#c19a56">se désabonner</a>.
    </p>
    <p style="margin:0;font-size:12px;color:#BBB">
      TableFlow — Klyora Sites · Menu digital pour restaurateurs
    </p>
  </div>
</div>`;
}

/* ─── Sujet email — personnalisé avec les vrais plats ────────────────────── */
function buildSubject(prospect: Prospect): string {
  const highlights = getHighlightDishes(prospect.menu_items);
  const dish = highlights[0]; // Premier plat emblématique

  if (dish) {
    const subjects = [
      `${dish} — sur le téléphone de vos clients dès ce soir`,
      `Votre ${dish} visible en 3 sec depuis n'importe quelle table`,
      `${prospect.name} · Menu QR créé — votre ${dish} est dedans`,
      `J'ai mis votre ${dish} sur smartphone (aperçu pour ${prospect.name})`,
    ];
    const idx = prospect.slug.charCodeAt(0) % subjects.length;
    return subjects[idx];
  }

  // Fallback sans plat connu
  const fallbacks = [
    `${prospect.name} — votre carte digitalisée avec QR code`,
    `Votre menu digital prêt pour ${prospect.name}`,
    `${prospect.name} : vos plats sur smartphone en 3 secondes`,
  ];
  return fallbacks[prospect.slug.charCodeAt(0) % fallbacks.length];
}

/* ─── Envoi Brevo ─────────────────────────────────────────────────────────── */
async function sendViaBrevo(
  to: string,
  subject: string,
  htmlBody: string,
  restaurantName: string,
  brevoKey: string
): Promise<{ ok: boolean; error?: string }> {
  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": brevoKey,
    },
    body: JSON.stringify({
      sender: { name: "Rubens de TableFlow", email: "contact@klyora.fr" },
      to: [{ email: to, name: restaurantName }],
      subject,
      htmlContent: htmlBody,
      headers: {
        "List-Unsubscribe": `<https://klyora.fr/api/unsubscribe?email=${encodeURIComponent(to)}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        "X-Campaign": "tableflow-menu-digital",
      },
    }),
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => String(res.status));
    return { ok: false, error: err.slice(0, 200) };
  }
  return { ok: true };
}

/* ─── Handler principal ──────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  // Couvre-feu : 9h–19h heure de Paris uniquement
  const body = await req.json().catch(() => ({}));
  const dry_run: boolean = body.dry_run === true;
  const batch_size: number = Math.min(80, Math.max(1, Number(body.batch_size) || 60));

  if (!dry_run && !isWithinSendingHours(9, 19)) {
    return NextResponse.json({ success: true, skipped: "outside_sending_hours", processed: 0 });
  }

  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) {
    return NextResponse.json({ error: "BREVO_API_KEY manquant" }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();
  const origin = "https://klyora.fr";

  // Récupère les prospects à envoyer (status = found)
  const { data: prospects, error: fetchErr } = await supabase
    .from("tableflow_prospects")
    .select("*")
    .eq("status", "found")
    .not("email", "is", null)
    .order("created_at", { ascending: true })
    .limit(batch_size);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const results: Array<{ id: string; name: string; status: string; error?: string }> = [];

  // Domain cooldown (même logique que Klyora Sites)
  const BIG_PROVIDERS = new Set([
    "gmail.com", "googlemail.com", "orange.fr", "wanadoo.fr",
    "free.fr", "laposte.net", "sfr.fr", "neuf.fr", "numericable.fr",
    "yahoo.fr", "yahoo.com", "hotmail.fr", "hotmail.com",
    "live.fr", "live.com", "outlook.fr", "outlook.com", "icloud.com",
  ]);
  const domainsBatch = new Map<string, number>();
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const { data: todaySent } = await supabase
    .from("tableflow_prospects")
    .select("email")
    .eq("status", "sent")
    .gte("sent_at", todayStart.toISOString())
    .not("email", "is", null);
  const domainsToday = new Map<string, number>();
  for (const row of (todaySent || [])) {
    const d = (row.email as string).split("@")[1]?.toLowerCase() || "";
    if (d) domainsToday.set(d, (domainsToday.get(d) || 0) + 1);
  }

  for (const p of (prospects || [])) {
    const emailDomain = (p.email || "").split("@")[1]?.toLowerCase() || "";
    if (emailDomain && !dry_run) {
      const isBig = BIG_PROVIDERS.has(emailDomain);
      const batchLimit = isBig ? 10 : 2;
      const dayLimit = isBig ? 50 : 5;
      if ((domainsBatch.get(emailDomain) || 0) >= batchLimit ||
          (domainsToday.get(emailDomain) || 0) >= dayLimit) {
        results.push({ id: p.id, name: p.name, status: "skipped_domain_cooldown" });
        continue;
      }
    }

    const demoUrl = `${origin}/restaurant/${p.slug}`;
    const subject = buildSubject(p);
    const htmlBody = buildEmailBody(p, demoUrl).replace("{{EMAIL}}", encodeURIComponent(p.email || ""));

    if (dry_run) {
      results.push({ id: p.id, name: p.name, status: "dry_run" });
      continue;
    }

    // Délai anti-spam
    await new Promise((r) => setTimeout(r, 2500));

    const sent = await sendViaBrevo(p.email!, subject, htmlBody, p.name, brevoKey);

    if (sent.ok) {
      await supabase.from("tableflow_prospects").update({
        status: "sent",
        sent_at: new Date().toISOString(),
        error: null,
      }).eq("id", p.id);

      domainsBatch.set(emailDomain, (domainsBatch.get(emailDomain) || 0) + 1);
      domainsToday.set(emailDomain, (domainsToday.get(emailDomain) || 0) + 1);
      results.push({ id: p.id, name: p.name, status: "sent" });
    } else {
      await supabase.from("tableflow_prospects").update({
        status: "error",
        error: `Brevo: ${sent.error}`,
      }).eq("id", p.id);
      results.push({ id: p.id, name: p.name, status: "error", error: sent.error });
    }
  }

  const sentCount = results.filter((r) => r.status === "sent").length;
  return NextResponse.json({
    success: true,
    processed: prospects?.length || 0,
    sent: sentCount,
    results,
  });
}
