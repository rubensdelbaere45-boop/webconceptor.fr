/* ══════════════════════════════════════════
   Site Publisher — orchestre la publication automatique d'un site Klyora

   Pipeline complet (déclenché par Stripe webhook après paiement) :

     1. Achat domaine IONOS (si demandé)
     2. Création projet Vercel + déploiement statique
     3. Attachement domaine au projet Vercel
     4. Pointage DNS IONOS → Vercel (record A + CNAME)
     5. Mail "votre site sera bientôt en ligne"
     6. Polling SSL Vercel (3-5 min)
     7. Mail "votre site est en ligne"

   Le pipeline est idempotent et reprend sur erreur partielle :
   chaque étape est tracée en DB (prospects.publish_*) pour reprendre
   un déploiement bloqué via /api/admin/retry-publish.
   ══════════════════════════════════════════ */

import { createClient } from "@supabase/supabase-js";
import { buyDomain, pointDomainToVercel, type IonosContactInfo } from "@/lib/ionos";
import { deployStaticSite, attachDomainToProject, getDomainStatus } from "@/lib/vercel-api";
import { sendBrevoEmail } from "@/lib/brevo-send";

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || ""
  );
}

export interface PublishOptions {
  prospectId: string;
  mockupHtml: string;
  prospectName: string;
  prospectEmail: string;
  domainName?: string;          // si null → vercel.app sous-domaine seulement
  buyerContact?: IonosContactInfo;  // requis si domainName défini
}

export interface PublishResult {
  success: boolean;
  steps: Record<string, { ok: boolean; detail?: unknown; error?: string }>;
  finalUrl?: string;
}

const PUB_FROM = "Klyora Sites";
const PUB_REPLY = "contact@klyora.fr";

/**
 * Pipeline complet publication.
 */
export async function publishSite(opts: PublishOptions): Promise<PublishResult> {
  const supabase = db();
  const steps: PublishResult["steps"] = {};
  const now = () => new Date().toISOString();

  // ─── Étape 1 : achat domaine IONOS (si requis) ──────────────────────
  if (opts.domainName && opts.buyerContact) {
    const buy = await buyDomain(opts.domainName, opts.buyerContact);
    steps.buy_domain = { ok: buy.success, detail: { orderId: buy.orderId }, error: buy.error };
    await supabase.from("prospects").update({
      publish_domain: opts.domainName,
      publish_buy_at: now(),
      publish_buy_ok: buy.success,
    }).eq("id", opts.prospectId);
    if (!buy.success) {
      await sendFailureMail(opts.prospectEmail, opts.prospectName, "achat du domaine", buy.error || "");
      return { success: false, steps };
    }
  } else {
    steps.buy_domain = { ok: true, detail: "skipped (pas de domaine demandé)" };
  }

  // ─── Étape 2 : déploiement Vercel ────────────────────────────────────
  const dep = await deployStaticSite(
    opts.prospectId,
    [{ file: "index.html", data: opts.mockupHtml }],
    undefined  // on attache le domaine en étape 3 séparée pour pouvoir gérer les erreurs
  );
  steps.deploy = {
    ok: dep.success,
    detail: { projectId: dep.projectId, projectName: dep.projectName, deploymentUrl: dep.deploymentUrl },
    error: dep.error,
  };
  await supabase.from("prospects").update({
    publish_vercel_project_id: dep.projectId,
    publish_vercel_url: dep.deploymentUrl,
    publish_deploy_at: now(),
    publish_deploy_ok: dep.success,
  }).eq("id", opts.prospectId);
  if (!dep.success || !dep.projectId) {
    await sendFailureMail(opts.prospectEmail, opts.prospectName, "déploiement du site", dep.error || "");
    return { success: false, steps };
  }

  // ─── Étape 3 : attache domaine au projet Vercel ──────────────────────
  if (opts.domainName) {
    const att = await attachDomainToProject(dep.projectId, opts.domainName);
    steps.attach_domain = { ok: att };
  }

  // ─── Étape 4 : pointage DNS IONOS → Vercel ───────────────────────────
  if (opts.domainName) {
    const dns = await pointDomainToVercel(opts.domainName);
    steps.dns = { ok: dns.ok, detail: { zoneId: dns.zoneId }, error: dns.error };
    await supabase.from("prospects").update({
      publish_dns_at: now(),
      publish_dns_ok: dns.ok,
    }).eq("id", opts.prospectId);
  }

  // ─── Étape 5 : mail "site bientôt en ligne" ──────────────────────────
  await sendPendingMail(opts.prospectEmail, opts.prospectName, opts.domainName, dep.deploymentUrl);
  steps.mail_pending = { ok: true };

  // ─── Étape 6 : on ne polling PAS ici (300s Vercel Hobby limit) ───────
  // Un cron séparé /api/cron/poll-published-sites checkera SSL et enverra
  // le mail "site en ligne" quand le domaine sera vérifié.

  const finalUrl = opts.domainName ? `https://${opts.domainName}` : dep.deploymentUrl;
  await supabase.from("prospects").update({
    publish_url: finalUrl,
    publish_pending: true,
  }).eq("id", opts.prospectId);

  return { success: true, steps, finalUrl };
}

/* ══════════════════════════════════════════
   Mails de notification
   ══════════════════════════════════════════ */

async function sendPendingMail(toEmail: string, name: string, domain?: string, vercelUrl?: string) {
  const firstName = name.split(" ")[0];
  const urlHint = domain ? `https://${domain}` : vercelUrl || "—";
  await sendBrevoEmail({
    to: toEmail,
    toName: name,
    senderName: PUB_FROM,
    senderEmail: PUB_REPLY,
    subject: `${firstName}, votre site Klyora est en cours de publication`,
    htmlContent: `<p>Bonjour ${firstName},</p>
<p>Merci pour votre confiance ! Votre site est en cours de mise en ligne.</p>
<p><strong>Adresse définitive :</strong> <a href="${urlHint}">${urlHint}</a></p>
<p>Le site sera accessible dans <strong>quelques minutes</strong> (le temps que le certificat SSL et la propagation DNS soient finalisés). Vous recevrez un email de confirmation dès qu'il sera consultable publiquement.</p>
<p>À très vite,<br>Tom — Klyora Sites<br><a href="mailto:contact@klyora.fr">contact@klyora.fr</a></p>`,
    textContent: `Bonjour ${firstName},\n\nMerci pour votre confiance ! Votre site est en cours de mise en ligne.\n\nAdresse définitive : ${urlHint}\n\nLe site sera accessible dans quelques minutes. Vous recevrez un email dès que tout est prêt.\n\nTom — Klyora Sites — contact@klyora.fr`,
  });
}

export async function sendLiveMail(toEmail: string, name: string, url: string) {
  const firstName = name.split(" ")[0];
  await sendBrevoEmail({
    to: toEmail,
    toName: name,
    senderName: PUB_FROM,
    senderEmail: PUB_REPLY,
    subject: `🎉 ${firstName}, votre site est en ligne !`,
    htmlContent: `<p>Bonjour ${firstName},</p>
<p>Excellente nouvelle : votre site est désormais accessible publiquement.</p>
<p style="margin:24px 0">
  <a href="${url}" style="display:inline-block;background:#0a0a0a;color:#FFD700;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700">Voir mon site en ligne →</a>
</p>
<p>Lien direct : <a href="${url}">${url}</a></p>
<p>Si vous souhaitez apporter une modification, répondez simplement à ce mail. Modifications incluses pendant la durée de la Sérénité.</p>
<p>Bonne suite,<br>Tom — Klyora Sites<br><a href="mailto:contact@klyora.fr">contact@klyora.fr</a></p>`,
    textContent: `Bonjour ${firstName},\n\nVotre site est en ligne :\n\n  ${url}\n\nPour toute modif, répondez à ce mail.\n\nTom — Klyora Sites`,
  });
}

async function sendFailureMail(toEmail: string, name: string, stepLabel: string, errorDetail: string) {
  const firstName = name.split(" ")[0];
  await sendBrevoEmail({
    to: toEmail,
    toName: name,
    senderName: PUB_FROM,
    senderEmail: PUB_REPLY,
    subject: `Votre commande Klyora — petit délai supplémentaire`,
    htmlContent: `<p>Bonjour ${firstName},</p>
<p>La publication automatique de votre site a rencontré un petit blocage sur l'étape <em>${stepLabel}</em>. Pas d'inquiétude, je m'en occupe manuellement dans les prochaines heures et je reviens vers vous dès que c'est résolu.</p>
<p>Votre commande est bien enregistrée, rien n'est perdu.</p>
<p>Tom — Klyora Sites<br><a href="mailto:contact@klyora.fr">contact@klyora.fr</a></p>
<!-- debug: ${errorDetail.slice(0, 200)} -->`,
    textContent: `Bonjour ${firstName},\n\nLa publication a rencontré un petit blocage. Je m'en occupe manuellement et reviens vers vous très vite.\n\nTom — Klyora Sites`,
  });
}

/* ══════════════════════════════════════════
   Polling : vérifie que les sites en attente sont devenus accessibles
   (à appeler via cron quotidien /api/cron/poll-published-sites)
   ══════════════════════════════════════════ */

export async function pollPendingSites(): Promise<{ checked: number; published: number; errors: number }> {
  const supabase = db();
  const { data: pending } = await supabase
    .from("prospects")
    .select("id, name, email, publish_url, publish_domain, publish_vercel_project_id")
    .eq("publish_pending", true)
    .not("publish_vercel_project_id", "is", null)
    .limit(50);

  let published = 0;
  let errors = 0;

  for (const p of pending || []) {
    if (!p.publish_domain || !p.publish_vercel_project_id) continue;
    const status = await getDomainStatus(p.publish_vercel_project_id, p.publish_domain);
    if (status.verified) {
      await sendLiveMail(p.email, p.name, p.publish_url || `https://${p.publish_domain}`);
      await supabase.from("prospects").update({
        publish_pending: false,
        publish_live_at: new Date().toISOString(),
      }).eq("id", p.id);
      published++;
    } else if (status.misconfigured) {
      errors++;
    }
  }

  return { checked: pending?.length || 0, published, errors };
}
