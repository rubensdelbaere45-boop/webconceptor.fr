/**
 * POST /api/admin/preview-code-email?prospect_slug=XXX&to=email@test.fr
 *
 * Envoie le mail "votre maquette est prête" à une adresse arbitraire
 * (en simulant le prospect identifié par slug) pour tester visuellement
 * le rendu avant de le diffuser à 1000+ prospects.
 *
 * - Ne touche pas le projet Stripe (pas de generateUniqueCode)
 * - Ne touche pas le prospect en DB
 * - Utilise le vrai access_code du prospect (URL réelle, auto-unlock fonctionnel)
 *
 * Auth : x-admin-key
 */
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { safeCompare } from "@/lib/security";
import { getOrCreateAccessCode } from "@/lib/access-code";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function buildCodeEmailHtml(opts: { prospectName: string; code: string; codeUrl: string; mockupUrl: string }): string {
  const { prospectName, code, codeUrl, mockupUrl } = opts;
  const firstName = (prospectName.split(/[\s,—-]/)[0] || "").trim();
  return `<!DOCTYPE html>
<html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(prospectName)} — votre maquette est prête</title>
<style>.preheader{display:none!important;visibility:hidden;opacity:0;color:transparent;height:0;width:0;overflow:hidden;mso-hide:all;}</style></head>
<body style="margin:0;padding:0;background:#f5f3ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1310">
<div class="preheader">J'ai préparé un site complet pour ${esc(prospectName)}. Cliquez pour le voir — pas d'inscription, pas d'engagement.</div>
<div style="max-width:620px;margin:0 auto;background:#fdfaf5">
<div style="padding:32px 40px 24px;text-align:center;border-bottom:1px solid #e8dfd0"><div style="display:inline-flex;align-items:center;gap:10px"><span style="display:inline-block;width:32px;height:32px;background:#0066ff;border-radius:8px;color:#fff;font-weight:900;font-size:16px;line-height:32px;text-align:center">K</span><span style="font-size:19px;font-weight:700;letter-spacing:-0.01em">Klyora<span style="color:#0066ff"> Sites</span></span></div></div>
<div style="padding:44px 40px 32px">
<p style="font-size:16px;margin:0 0 16px;line-height:1.6">Bonjour${firstName ? " " + esc(firstName) : ""},</p>
<p style="font-size:16px;margin:0 0 12px;line-height:1.7">Je suis Tom, fondateur de Klyora Sites. J'ai conçu une maquette de site web sur-mesure pour <strong>${esc(prospectName)}</strong>.</p>
<p style="font-size:16px;margin:0 0 32px;line-height:1.7;color:#4a4340">Elle est prête. Un clic suffit pour la découvrir — pas d'inscription, pas de code à taper, ouverture directe.</p>
<div style="text-align:center;margin:32px 0 28px"><a href="${esc(mockupUrl)}" style="display:inline-block;padding:22px 56px;background:#0066ff;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:17px;letter-spacing:0.02em;box-shadow:0 8px 24px rgba(0,102,255,0.30)">Voir ma maquette →</a><p style="margin:14px 0 0;font-size:13px;color:#8b7e6e">Conçue rien que pour <strong style="color:#1a1310">${esc(prospectName)}</strong></p></div>
<div style="background:#fff;border:1px solid #e8dfd0;border-radius:8px;padding:24px;margin:32px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse"><tr><td width="33%" style="text-align:center;padding:8px 4px;vertical-align:top"><p style="font-size:24px;font-weight:800;color:#0066ff;margin:0 0 4px;letter-spacing:-0.02em">320€</p><p style="font-size:12px;color:#4a4340;margin:0;line-height:1.4">TTC tout compris<br/>ou 3× sans frais</p></td><td width="33%" style="text-align:center;padding:8px 4px;vertical-align:top;border-left:1px solid #e8dfd0;border-right:1px solid #e8dfd0"><p style="font-size:24px;font-weight:800;color:#0066ff;margin:0 0 4px;letter-spacing:-0.02em">5 min</p><p style="font-size:12px;color:#4a4340;margin:0;line-height:1.4">de livraison<br/>après paiement</p></td><td width="33%" style="text-align:center;padding:8px 4px;vertical-align:top"><p style="font-size:24px;font-weight:800;color:#0066ff;margin:0 0 4px;letter-spacing:-0.02em">14j</p><p style="font-size:12px;color:#4a4340;margin:0;line-height:1.4">satisfait<br/>ou remboursé</p></td></tr></table></div>
<div style="margin:32px 0 28px"><p style="font-size:15px;line-height:1.7;color:#4a4340;margin:0 0 12px"><strong style="color:#1a1310">Klyora Sites</strong> est une entreprise française. Nous créons depuis plusieurs années des sites web sur-mesure pour des artisans, commerçants et professionnels indépendants partout en France.</p><p style="font-size:15px;line-height:1.7;color:#4a4340;margin:0">Chaque maquette est dessinée à la main pour le métier du destinataire. Vous gardez la liberté totale : si elle ne vous plaît pas, vous nous le dites — pas un centime à débourser.</p></div>
<div style="background:#fdf6e9;border-left:3px solid #c19a56;padding:18px 22px;margin:24px 0;border-radius:0 6px 6px 0"><p style="font-size:14px;line-height:1.6;font-style:italic;color:#4a4340;margin:0 0 8px">« Maquette envoyée le mardi, site en ligne le vendredi. Tom est joignable au téléphone, ça change tout. »</p><p style="font-size:12px;color:#8b7e6e;margin:0">— Sébastien M., plombier (44)</p></div>
<div style="text-align:center;margin:36px 0 24px"><a href="${esc(mockupUrl)}" style="display:inline-block;padding:18px 44px;background:#1a1310;color:#fff;text-decoration:none;border-radius:6px;font-weight:700;font-size:15px;letter-spacing:0.05em">Découvrir ma maquette</a><p style="margin:12px 0 0;font-size:12px;color:#8b7e6e">Aucune information à saisir — accès direct depuis ce lien</p></div>
<div style="background:#fff;border:1px solid #e8dfd0;padding:20px 24px;margin:32px 0;border-radius:6px"><p style="font-size:14px;color:#1a1310;margin:0 0 10px;font-weight:600">Une question avant de regarder ?</p><p style="font-size:13px;color:#4a4340;margin:0 0 4px">📞 <a href="tel:+33635592471" style="color:#0066ff;text-decoration:none;font-weight:600">06 35 59 24 71</a> (Tom, directement)</p><p style="font-size:13px;color:#4a4340;margin:0">✉️ <a href="mailto:contact@klyora.fr" style="color:#0066ff;text-decoration:none;font-weight:600">contact@klyora.fr</a> — réponse sous 2h en moyenne</p></div>
<div style="border-top:1px solid #e8dfd0;padding-top:24px;margin-top:32px"><p style="margin:0 0 4px;font-size:15px;line-height:1.5">Au plaisir d'avoir votre retour,</p><p style="margin:0 0 2px;font-size:15px"><strong>Tom Bauer</strong></p><p style="margin:0;font-size:13px;color:#8b7e6e">Fondateur · Klyora Sites · <a href="https://klyora.fr" style="color:#0066ff;text-decoration:none">klyora.fr</a></p></div>
<details style="margin:32px 0 0;font-size:11px;color:#8b7e6e"><summary style="cursor:pointer;color:#8b7e6e;font-size:11px;outline:none">Lien ne fonctionne pas ? Cliquez ici</summary><div style="margin-top:10px;padding:12px;background:#f5f3ee;border-radius:4px"><p style="margin:0 0 6px;font-size:11px;color:#4a4340">Copiez ce code de secours : <code style="background:#fff;padding:3px 8px;border-radius:3px;font-weight:700;color:#1a1310;letter-spacing:0.1em">${esc(code)}</code></p><p style="margin:0;font-size:11px;color:#4a4340">Puis collez-le sur <a href="${esc(codeUrl)}" style="color:#0066ff">klyora.fr/code</a></p></div></details>
</div>
<div style="padding:20px 40px;text-align:center;border-top:1px solid #e8dfd0;background:#f5f3ee"><p style="margin:0;font-size:11px;color:#a89c8a;line-height:1.5">Klyora Sites — SIRET enregistré en France · Mail envoyé suite à votre activité publique sur Google Maps.<br/><a href="https://klyora.fr/api/unsubscribe" style="color:#a89c8a;text-decoration:underline">Ne plus recevoir de mail</a></p></div>
</div></body></html>`;
}

export async function POST(req: NextRequest) {
  if (!safeCompare(req.headers.get("x-admin-key") || "", process.env.ADMIN_SECRET_KEY)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const slug = req.nextUrl.searchParams.get("prospect_slug") || "";
  const to = req.nextUrl.searchParams.get("to") || "";
  if (!slug || !to) return NextResponse.json({ error: "Params requis : prospect_slug + to" }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return NextResponse.json({ error: "Email destinataire invalide" }, { status: 400 });

  const supabase = db();
  const { data: prospect } = await supabase
    .from("prospects")
    .select("id, name, slug, access_code, project_code")
    .eq("slug", slug)
    .maybeSingle();
  if (!prospect) return NextResponse.json({ error: "Prospect introuvable" }, { status: 404 });

  let accessCode = prospect.access_code as string | null;
  if (!accessCode) accessCode = await getOrCreateAccessCode(prospect.id);
  const code = (prospect.project_code as string) || "TEST00";
  const mockupUrl = accessCode
    ? `https://klyora.fr/prospects/${prospect.slug}?code=${encodeURIComponent(accessCode)}`
    : `https://klyora.fr/prospects/${prospect.slug}`;
  const codeUrl = `https://klyora.fr/code?c=${code}`;

  const brevoKey = process.env.BREVO_API_KEY;
  if (!brevoKey) return NextResponse.json({ error: "BREVO_API_KEY manquante" }, { status: 500 });

  const html = buildCodeEmailHtml({ prospectName: prospect.name, code, codeUrl, mockupUrl });

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: { "api-key": brevoKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      sender: { name: "Tom Bauer", email: "contact@klyora.fr" },
      to: [{ email: to, name: "Test Tom" }],
      replyTo: { email: "contact@klyora.fr", name: "Tom Bauer" },
      subject: `[TEST] ${prospect.name} — votre maquette est prête (regardez avant qu'on l'efface)`,
      htmlContent: html,
    }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => "");
    return NextResponse.json({ error: `Brevo ${res.status}`, detail: err.slice(0, 300) }, { status: 502 });
  }
  return NextResponse.json({ success: true, sent_to: to, simulated_prospect: prospect.name, mockup_url: mockupUrl });
}

export const GET = POST;
