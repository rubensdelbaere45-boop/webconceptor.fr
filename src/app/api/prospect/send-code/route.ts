import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare, escapeTelegram } from "@/lib/security";
import { getOrCreateAccessCode } from "@/lib/access-code";

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
  const firstName = (prospectName.split(/[\s,—-]/)[0] || "").trim();

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${esc(prospectName)} — votre maquette est prête</title>
<!-- Preheader (texte d'aperçu après le sujet dans la boîte de réception) -->
<style>
  .preheader { display:none !important; visibility:hidden; opacity:0; color:transparent; height:0; width:0; overflow:hidden; mso-hide:all; }
</style>
</head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1310">

<div class="preheader">J'ai préparé un site complet pour ${esc(prospectName)}. Cliquez pour le voir — pas d'inscription, pas d'engagement.</div>

<div style="max-width:620px;margin:0 auto;background:#fdfaf5">

  <!-- Header minimaliste -->
  <div style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #e8dfd0">
    <div style="display:inline-flex;align-items:center;gap:10px">
      <span style="display:inline-block;width:32px;height:32px;background:#0066ff;border-radius:8px;color:#fff;font-weight:900;font-size:16px;line-height:32px;text-align:center">K</span>
      <span style="font-size:19px;font-weight:700;letter-spacing:-0.01em">Klyora<span style="color:#0066ff"> Sites</span></span>
    </div>
  </div>

  <!-- Body : focus 100% sur le clic vers la maquette -->
  <div style="padding:44px 40px 32px">

    <!-- Salutation personnelle -->
    <p style="font-size:16px;margin:0 0 16px;line-height:1.6">Bonjour${firstName ? " " + esc(firstName) : ""},</p>
    <p style="font-size:16px;margin:0 0 12px;line-height:1.7">
      Je suis Tom, fondateur de Klyora Sites. J'ai conçu une maquette de site web sur-mesure pour <strong>${esc(prospectName)}</strong>.
    </p>
    <p style="font-size:16px;margin:0 0 32px;line-height:1.7;color:#4a4340">
      Elle est prête. Un clic suffit pour la découvrir — pas d'inscription, pas de code à taper, ouverture directe.
    </p>

    <!-- CTA HERO : énorme bouton vers la maquette (auto-unlock) -->
    <div style="text-align:center;margin:32px 0 28px">
      <a href="${esc(mockupUrl)}" style="display:inline-block;padding:22px 56px;background:#0066ff;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:17px;letter-spacing:0.02em;box-shadow:0 8px 24px rgba(0,102,255,0.30)">
        Voir ma maquette →
      </a>
      <p style="margin:14px 0 0;font-size:13px;color:#8b7e6e">Conçue rien que pour <strong style="color:#1a1310">${esc(prospectName)}</strong></p>
    </div>

    <!-- 3 réassurances clés (chiffres) -->
    <div style="background:#fff;border:1px solid #e8dfd0;border-radius:8px;padding:24px;margin:32px 0">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse">
        <tr>
          <td width="33%" style="text-align:center;padding:8px 4px;vertical-align:top">
            <p style="font-size:24px;font-weight:800;color:#0066ff;margin:0 0 4px;letter-spacing:-0.02em">320€</p>
            <p style="font-size:12px;color:#4a4340;margin:0;line-height:1.4">TTC tout compris<br/>ou 3× sans frais</p>
          </td>
          <td width="33%" style="text-align:center;padding:8px 4px;vertical-align:top;border-left:1px solid #e8dfd0;border-right:1px solid #e8dfd0">
            <p style="font-size:24px;font-weight:800;color:#0066ff;margin:0 0 4px;letter-spacing:-0.02em">5 min</p>
            <p style="font-size:12px;color:#4a4340;margin:0;line-height:1.4">de livraison<br/>après paiement</p>
          </td>
          <td width="33%" style="text-align:center;padding:8px 4px;vertical-align:top">
            <p style="font-size:24px;font-weight:800;color:#0066ff;margin:0 0 4px;letter-spacing:-0.02em">14j</p>
            <p style="font-size:12px;color:#4a4340;margin:0;line-height:1.4">satisfait<br/>ou remboursé</p>
          </td>
        </tr>
      </table>
    </div>

    <!-- Bloc rassurance "qui sommes-nous" -->
    <div style="margin:32px 0 28px">
      <p style="font-size:15px;line-height:1.7;color:#4a4340;margin:0 0 12px">
        <strong style="color:#1a1310">Klyora Sites</strong> est une entreprise française basée en région parisienne. Nous créons depuis plusieurs années des sites web sur-mesure pour des artisans, commerçants et professionnels indépendants partout en France.
      </p>
      <p style="font-size:15px;line-height:1.7;color:#4a4340;margin:0">
        Chaque maquette est dessinée à la main pour le métier du destinataire. Vous gardez la liberté totale : si elle ne vous plaît pas, vous nous le dites — pas un centime à débourser.
      </p>
    </div>

    <!-- Mini-témoignages crédibles -->
    <div style="background:#fdf6e9;border-left:3px solid #c19a56;padding:18px 22px;margin:24px 0;border-radius:0 6px 6px 0">
      <p style="font-size:14px;line-height:1.6;font-style:italic;color:#4a4340;margin:0 0 8px">
        « Maquette envoyée le mardi, site en ligne le vendredi. Tom est joignable au téléphone, ça change tout. »
      </p>
      <p style="font-size:12px;color:#8b7e6e;margin:0">— Sébastien M., plombier (44)</p>
    </div>

    <!-- CTA secondaire (au cas où on a scrollé) -->
    <div style="text-align:center;margin:36px 0 24px">
      <a href="${esc(mockupUrl)}" style="display:inline-block;padding:18px 44px;background:#1a1310;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;font-size:15px;letter-spacing:0.05em">
        Découvrir ma maquette
      </a>
      <p style="margin:12px 0 0;font-size:12px;color:#8b7e6e">Aucune information à saisir — accès direct depuis ce lien</p>
    </div>

    <!-- Question / contact direct -->
    <div style="background:#fff;border:1px solid #e8dfd0;padding:20px 24px;margin:32px 0;border-radius:6px">
      <p style="font-size:14px;color:#1a1310;margin:0 0 10px;font-weight:600">Une question avant de regarder ?</p>
      <p style="font-size:13px;color:#4a4340;margin:0 0 4px">
        📞 <a href="tel:+33635592471" style="color:#0066ff;text-decoration:none;font-weight:600">06 35 59 24 71</a> (Tom, directement)
      </p>
      <p style="font-size:13px;color:#4a4340;margin:0">
        ✉️ <a href="mailto:contact@klyora.fr" style="color:#0066ff;text-decoration:none;font-weight:600">contact@klyora.fr</a> — réponse sous 2h en moyenne
      </p>
    </div>

    <!-- Signature humaine -->
    <div style="border-top:1px solid #e8dfd0;padding-top:24px;margin-top:32px">
      <p style="margin:0 0 4px;font-size:15px;line-height:1.5">Au plaisir d'avoir votre retour,</p>
      <p style="margin:0 0 2px;font-size:15px"><strong>Tom Bauer</strong></p>
      <p style="margin:0;font-size:13px;color:#8b7e6e">Fondateur · Klyora Sites · <a href="https://klyora.fr" style="color:#0066ff;text-decoration:none">klyora.fr</a></p>
    </div>

    <!-- Code en backup discret (si auto-unlock cassé) -->
    <details style="margin:32px 0 0;font-size:11px;color:#8b7e6e">
      <summary style="cursor:pointer;color:#8b7e6e;font-size:11px;outline:none">Lien ne fonctionne pas ? Cliquez ici</summary>
      <div style="margin-top:10px;padding:12px;background:#f5f3ee;border-radius:4px">
        <p style="margin:0 0 6px;font-size:11px;color:#4a4340">Copiez ce code de secours : <code style="background:#fff;padding:3px 8px;border-radius:3px;font-weight:700;color:#1a1310;letter-spacing:0.1em">${esc(code)}</code></p>
        <p style="margin:0;font-size:11px;color:#4a4340">Puis collez-le sur <a href="${esc(codeUrl)}" style="color:#0066ff">klyora.fr/code</a></p>
      </div>
    </details>

  </div>

  <!-- Footer légal -->
  <div style="padding:20px 40px;text-align:center;border-top:1px solid #e8dfd0;background:#f5f3ee">
    <p style="margin:0;font-size:11px;color:#a89c8a;line-height:1.5">
      Klyora Sites — SIRET enregistré en France · Mail envoyé suite à votre activité publique sur Google Maps.<br/>
      <a href="https://klyora.fr/api/unsubscribe" style="color:#a89c8a;text-decoration:underline">Ne plus recevoir de mail</a>
    </p>
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
    .select("id, name, slug, email, city, business_type, project_code, mockup_html, access_code")
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

    // Génère un access_code si manquant (pour pré-fill l'URL et éviter
    // la friction du formulaire de saisie).
    let accessCode = prospect.access_code as string | null;
    if (!accessCode) accessCode = await getOrCreateAccessCode(prospect.id);
    const mockupUrl = accessCode
      ? `https://klyora.fr/prospects/${prospect.slug}?code=${encodeURIComponent(accessCode)}`
      : `https://klyora.fr/prospects/${prospect.slug}`;
    const isResto = prospect.business_type === "restaurant";
    const title = `Site web ${isResto ? "restaurant" : "vitrine"} — ${prospect.name}`;

    const contractText =
      `Création du site web pour ${prospect.name}\n\n` +
      `Livrables :\n` +
      `• Site vitrine complet ${isResto ? "avec module de réservation en ligne" : "avec vos infos et produits"}\n` +
      `• Design responsive (PC, tablette, mobile)\n` +
      `• Hébergement 30 jours inclus\n` +
      `• Nom de domaine (facturé selon extension)\n\n` +
      `Délai : quelques minutes après paiement (7 jours grand max avec option Sérénité et nom de domaine).\n\n` +
      `Modifications incluses : jusqu'à 2 rounds de corrections.`;

    const { error: projErr } = await supabase
      .from("projects")
      .insert({
        code,
        title,
        description: `Site web personnalisé pour ${prospect.name}${prospect.city ? ` — ${prospect.city}` : ""}`,
        client_name: prospect.name,
        client_email: prospect.email,
        price_cents: 19900,
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

  // Build email — mockupUrl pré-rempli avec access_code (auto-unlock + redirect 302)
  const codeUrl = `https://klyora.fr/code?c=${code}`;
  let accessCodeFinal = (prospect.access_code as string | null) || null;
  if (!accessCodeFinal) accessCodeFinal = await getOrCreateAccessCode(prospect.id);
  const mockupUrl = accessCodeFinal
    ? `https://klyora.fr/prospects/${prospect.slug}?code=${encodeURIComponent(accessCodeFinal)}`
    : `https://klyora.fr/prospects/${prospect.slug}`;
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
        sender: { name: "Tom Bauer", email: "contact@klyora.fr" },
        to: [{ email: prospect.email, name: prospect.name }],
        // Subject ciblé conversion : nom du business + curiosité + douceur.
        // Évite "code d'accès" qui sonne froid/technique.
        subject: `${prospect.name} — votre maquette est prête (regardez avant qu'on l'efface)`,
        replyTo: { email: "contact@klyora.fr", name: "Tom Bauer" },
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
      `<b>Prix :</b> 199 € TTC (ou 3× sans frais)\n\n` +
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
