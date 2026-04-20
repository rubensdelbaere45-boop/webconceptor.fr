import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, escapeTelegram } from "@/lib/security";

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "placeholder"
  );
}

/* ══════════════════════════════════════════
   POST /api/prospect/send-code
   Body : { prospect_id }
   - Génère un code PIN si pas déjà fait (idempotent avec generate-code)
   - Crée/récupère le projet Stripe associé
   - Envoie un email PREMIUM au client avec :
     · Code géant bien visible
     · Bouton CTA vers /code
     · Lien pour revoir la maquette
     · Timeline 5j / 7j (selon option hébergement)
     · Signature + contact
   ══════════════════════════════════════════ */

function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function generateUniqueCode(supabase: ReturnType<typeof getSupabaseAdmin>): Promise<string> {
  for (let tries = 0; tries < 10; tries++) {
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const { data } = await supabase.from("projects").select("id").eq("code", code).maybeSingle();
    if (!data) return code;
  }
  throw new Error("Impossible de générer un code unique");
}

function buildCodeEmailHtml(opts: {
  prospectName: string;
  code: string;
  codeUrl: string;
  mockupUrl: string;
}): string {
  const { prospectName, code, codeUrl, mockupUrl } = opts;

  // Split code into groups for visual spacing : 123 456
  const codeSpaced = code.split("").join(" ");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Votre code d'accès — WebConceptor</title>
</head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">

<div style="max-width:620px;margin:0 auto;background:#fdfaf5;padding:0">

  <!-- Header : logo + subtitle -->
  <div style="padding:40px 40px 32px;text-align:center;border-bottom:1px solid #e8dfd0">
    <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:12px">
      <span style="display:inline-block;width:28px;height:28px;background:#0066ff;border-radius:6px;color:#fff;font-weight:900;font-size:14px;line-height:28px;text-align:center">W</span>
      <span style="font-size:18px;font-weight:700;color:#1a1310;letter-spacing:-0.01em">Web<span style="color:#0066ff">Conceptor</span></span>
    </div>
    <p style="color:#8b7e6e;font-size:13px;margin:0;font-style:italic">Votre site web, prêt à être validé.</p>
  </div>

  <!-- Body -->
  <div style="padding:48px 40px 40px">

    <!-- Personal greeting -->
    <p style="font-size:16px;color:#1a1310;margin:0 0 20px;line-height:1.6">Bonjour,</p>
    <p style="font-size:15px;color:#4a4340;margin:0 0 16px;line-height:1.7">
      Suite à notre échange au sujet de la maquette de <strong style="color:#1a1310">${esc(prospectName)}</strong>, voici votre <strong>code d'accès personnel</strong> pour valider votre commande.
    </p>

    <!-- BIG CODE BLOCK -->
    <div style="background:linear-gradient(135deg,#1a1310 0%,#6b1f2a 100%);padding:48px 24px;border-radius:8px;text-align:center;margin:32px 0;box-shadow:0 8px 30px rgba(26,19,16,0.15)">
      <p style="color:#c19a56;font-size:11px;letter-spacing:0.35em;text-transform:uppercase;margin:0 0 20px;font-weight:700">Votre code d'accès</p>
      <p style="font-family:'Courier New',Georgia,serif;color:#fff;font-size:44px;font-weight:700;letter-spacing:0.25em;margin:0;line-height:1">${esc(codeSpaced)}</p>
      <p style="color:rgba(193,154,86,0.7);font-size:12px;margin:20px 0 0;letter-spacing:0.1em">Valide pour ${esc(prospectName)}</p>
    </div>

    <!-- CTA button -->
    <div style="text-align:center;margin:32px 0">
      <a href="${esc(codeUrl)}" style="display:inline-block;padding:18px 44px;background:#0066ff;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;font-size:13px;box-shadow:0 4px 20px rgba(0,102,255,0.25)">Entrer mon code →</a>
      <p style="margin:16px 0 0;font-size:12px;color:#8b7e6e">ou collez le code sur webconceptor.fr/code</p>
    </div>

    <!-- Link to view mockup again -->
    <div style="background:#fff;border:1px solid #e8dfd0;padding:20px 24px;border-radius:6px;margin:32px 0;text-align:center">
      <p style="font-size:13px;color:#4a4340;margin:0 0 8px">Vous souhaitez revoir la maquette ?</p>
      <a href="${esc(mockupUrl)}" style="color:#c19a56;font-weight:600;font-size:14px;text-decoration:none">→ Revoir ma maquette personnalisée</a>
    </div>

    <!-- What happens next -->
    <div style="margin:40px 0 32px">
      <h3 style="font-family:Georgia,serif;font-size:22px;font-weight:500;color:#1a1310;margin:0 0 20px;letter-spacing:-0.01em">Les prochaines étapes</h3>
      <div style="display:block">
        <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:18px">
          <div style="flex-shrink:0;width:28px;height:28px;background:#c19a56;color:#fff;border-radius:50%;font-weight:700;font-size:14px;line-height:28px;text-align:center">1</div>
          <div>
            <p style="margin:0;font-weight:600;color:#1a1310;font-size:14px">Vous saisissez votre code</p>
            <p style="margin:4px 0 0;color:#4a4340;font-size:13px;line-height:1.6">Sur <a href="${esc(codeUrl)}" style="color:#c19a56">webconceptor.fr/code</a>, vous voyez un aperçu détaillé du projet et choisissez votre nom de domaine.</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:18px">
          <div style="flex-shrink:0;width:28px;height:28px;background:#c19a56;color:#fff;border-radius:50%;font-weight:700;font-size:14px;line-height:28px;text-align:center">2</div>
          <div>
            <p style="margin:0;font-weight:600;color:#1a1310;font-size:14px">Vous validez le paiement</p>
            <p style="margin:4px 0 0;color:#4a4340;font-size:13px;line-height:1.6">Stripe sécurisé. <strong>599 € TTC</strong> (site) + prix du domaine. Paiement en <strong style="color:#c19a56">1× ou 3× sans frais</strong> (Klarna).</p>
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:14px">
          <div style="flex-shrink:0;width:28px;height:28px;background:#c19a56;color:#fff;border-radius:50%;font-weight:700;font-size:14px;line-height:28px;text-align:center">3</div>
          <div>
            <p style="margin:0;font-weight:600;color:#1a1310;font-size:14px">Nous livrons votre site</p>
            <p style="margin:4px 0 0;color:#4a4340;font-size:13px;line-height:1.6">Site fini et en ligne, avec tous les détails demandés.</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Delivery timeline block -->
    <div style="background:#1a1310;color:#f9f5ef;padding:28px 24px;border-radius:8px;margin:32px 0">
      <p style="font-size:11px;color:#c19a56;letter-spacing:0.3em;text-transform:uppercase;font-weight:700;margin:0 0 16px">⏱ Délais de livraison</p>
      <div style="padding:12px 0;border-bottom:1px solid rgba(193,154,86,0.2)">
        <p style="font-size:15px;color:#fff;font-weight:600;margin:0 0 4px">Site seul</p>
        <p style="font-size:14px;color:rgba(249,245,239,0.8);margin:0;line-height:1.5">
          <strong style="color:#c19a56">5 jours ouvrés maximum</strong> après paiement. Livré sur l'URL provisoire WebConceptor.
        </p>
      </div>
      <div style="padding:16px 0 0">
        <p style="font-size:15px;color:#fff;font-weight:600;margin:0 0 4px">Avec option Hébergement (Sérénité)</p>
        <p style="font-size:14px;color:rgba(249,245,239,0.8);margin:0;line-height:1.5">
          <strong style="color:#c19a56">7 jours grand maximum</strong>, comprend :
        </p>
        <ul style="margin:8px 0 0;padding-left:20px;color:rgba(249,245,239,0.8);font-size:13px;line-height:1.7">
          <li>Enregistrement du nom de domaine</li>
          <li>Configuration DNS complète</li>
          <li>Déploiement + mise en ligne sur votre domaine</li>
          <li>Hébergement et emails inclus à vie (50 €/mois)</li>
        </ul>
      </div>
    </div>

    <!-- Question block with contact info -->
    <div style="background:#fff;border-left:3px solid #c19a56;padding:20px 24px;margin:32px 0;border-radius:4px">
      <p style="font-size:14px;color:#1a1310;margin:0 0 12px;font-weight:600">Une question avant de valider ?</p>
      <p style="font-size:14px;color:#4a4340;margin:0 0 6px">📧 <a href="mailto:contact@webconceptor.fr" style="color:#c19a56;text-decoration:none"><strong>contact@webconceptor.fr</strong></a></p>
      <p style="font-size:14px;color:#4a4340;margin:0 0 12px">📞 <a href="tel:+33635592471" style="color:#c19a56;text-decoration:none"><strong>06 35 59 24 71</strong></a></p>
      <p style="font-size:12px;color:#8b7e6e;margin:0;font-style:italic">Merci de signaler à l'opérateur votre nom, prénom et le nom de votre enseigne (<strong style="color:#1a1310">${esc(prospectName)}</strong>) afin que votre dossier soit retrouvé rapidement.</p>
    </div>

    <!-- Final reassurance -->
    <p style="font-size:13px;color:#8b7e6e;margin:32px 0 0;line-height:1.6;font-style:italic">
      Votre code reste valable tant que la maquette est en ligne. Aucune limite de temps.
    </p>

    <!-- Signature -->
    <div style="border-top:1px solid #e8dfd0;padding-top:24px;margin-top:40px">
      <p style="margin:0 0 4px;font-size:14px"><strong style="color:#1a1310">Tom Bauer</strong></p>
      <p style="margin:0 0 4px;font-size:13px;color:#8b7e6e">Fondateur, WebConceptor</p>
      <p style="margin:0;font-size:12px;color:#8b7e6e">contact@webconceptor.fr &middot; 06 35 59 24 71 &middot; <a href="https://webconceptor.fr" style="color:#c19a56;text-decoration:none">webconceptor.fr</a></p>
    </div>

  </div>
</div>

</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const adminKey = req.headers.get("x-admin-key");
  if (!safeCompare(adminKey, process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const prospect_id = typeof body.prospect_id === "string" && /^[0-9a-f-]{10,64}$/i.test(body.prospect_id)
    ? body.prospect_id
    : null;

  if (!prospect_id) {
    return NextResponse.json({ error: "prospect_id manquant ou invalide" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Load prospect
  const { data: prospect, error: findErr } = await supabase
    .from("prospects")
    .select("id, name, slug, email, city, business_type, project_code, mockup_html")
    .eq("id", prospect_id)
    .maybeSingle();

  if (findErr || !prospect) {
    return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });
  }

  if (!prospect.email) {
    return NextResponse.json({ error: "Ce prospect n'a pas d'email — impossible d'envoyer" }, { status: 400 });
  }

  if (!prospect.mockup_html) {
    return NextResponse.json({ error: "Aucune maquette générée — générez-la d'abord" }, { status: 400 });
  }

  // Ensure code + project exist
  let code = prospect.project_code as string | null;

  if (!code) {
    // Generate code + create project in one shot
    try {
      code = await generateUniqueCode(supabase);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "unknown";
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const mockupUrl = `https://webconceptor.fr/prospects/${prospect.slug}`;
    const isResto = prospect.business_type === "restaurant";
    const title = `Site web ${isResto ? "restaurant" : "vitrine"} — ${prospect.name}`;

    const contractText =
      `Création du site web pour ${prospect.name}\n\n` +
      `Livrables :\n` +
      `• Site vitrine complet ${isResto ? "avec module de réservation en ligne" : "avec vos infos et produits"}\n` +
      `• Design responsive (PC, tablette, mobile)\n` +
      `• Hébergement 30 jours inclus\n` +
      `• Nom de domaine (facturé selon extension)\n\n` +
      `Délai : 5 jours ouvrés après paiement (7 jours grand max avec option Sérénité et nom de domaine).\n\n` +
      `Modifications incluses : jusqu'à 2 rounds de corrections.`;

    const { error: projErr } = await supabase
      .from("projects")
      .insert({
        code,
        title,
        description: `Site web personnalisé pour ${prospect.name}${prospect.city ? ` — ${prospect.city}` : ""}`,
        client_name: prospect.name,
        client_email: prospect.email,
        price_cents: 59900,
        preview_url: mockupUrl,
        contract_text: contractText,
        status: "sent",
      });

    if (projErr) {
      console.error("[send-code] project insert error:", projErr);
      return NextResponse.json({ error: "Impossible de créer le projet" }, { status: 500 });
    }

    await supabase.from("prospects").update({ project_code: code }).eq("id", prospect.id);
  }

  // Build email
  const codeUrl = `https://webconceptor.fr/code?c=${code}`;
  const mockupUrl = `https://webconceptor.fr/prospects/${prospect.slug}`;
  const emailHtml = buildCodeEmailHtml({
    prospectName: prospect.name,
    code,
    codeUrl,
    mockupUrl,
  });

  // Send via Brevo
  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) {
    return NextResponse.json({ error: "BREVO_API_KEY manquante" }, { status: 500 });
  }

  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": brevoKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { name: "WebConceptor", email: "contact@webconceptor.fr" },
        to: [{ email: prospect.email, name: prospect.name }],
        subject: `Votre code d'accès pour ${prospect.name} — WebConceptor`,
        htmlContent: emailHtml,
      }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[send-code] Brevo error:", res.status, errText.slice(0, 300));
      return NextResponse.json({ error: `Erreur Brevo (${res.status})` }, { status: 502 });
    }
  } catch (err) {
    console.error("[send-code] send error:", err);
    return NextResponse.json({ error: "Erreur réseau lors de l'envoi" }, { status: 500 });
  }

  // Notify Telegram
  const tgToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (tgToken && chatId) {
    const msg =
      `📧 <b>Code envoyé par email</b>\n\n` +
      `<b>${escapeTelegram(prospect.name)}</b>\n` +
      (prospect.city ? `📍 ${escapeTelegram(prospect.city)}\n` : "") +
      `✉️ ${escapeTelegram(prospect.email)}\n\n` +
      `<b>Code :</b> <code>${escapeTelegram(code)}</code>\n` +
      `<b>Prix :</b> 599 € TTC (ou 3× sans frais)\n\n` +
      `<a href="${escapeTelegram(codeUrl)}">Lien /code</a>`;
    fetch(`https://api.telegram.org/bot${tgToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: msg,
        parse_mode: "HTML",
        disable_web_page_preview: true,
        disable_notification: true,
      }),
    }).catch(() => { /* silent */ });
  }

  return NextResponse.json({
    success: true,
    code,
    code_url: codeUrl,
    mockup_url: mockupUrl,
    sent_to: prospect.email,
  });
}
