/**
 * Template email dédié aux entreprises nouvellement créées (source SIRENE).
 *
 * Différence vs pitch standard :
 *   - Tonalité bienveillante "félicitations + accompagnement"
 *   - Ne dit pas "votre site actuel n'est pas terrible" (ils n'en ont pas)
 *   - Met en avant "première impression numérique"
 *   - Hook "Sérénité 0€ aujourd'hui" mis en avant
 *
 * Utiliser ce template UNIQUEMENT si prospect.is_new_business === true
 * et prospect.source === "sirene_insee".
 */

interface NewBusinessPitchOptions {
  prospectName: string;
  city: string | null;
  businessType: string;        // ex: "plombier"
  dateCreation: string | null; // YYYY-MM-DD
  mockupUrl: string;
  unsubscribeUrl: string;
}

const METIER_FR: Record<string, { article: string; label: string }> = {
  plombier:     { article: "de", label: "plombier" },
  electricien:  { article: "d'", label: "électricien" },
  chauffagiste: { article: "de", label: "chauffagiste" },
  menuisier:    { article: "de", label: "menuisier" },
  serrurier:    { article: "de", label: "serrurier" },
  carreleur:    { article: "de", label: "carreleur" },
  peintre:      { article: "de", label: "peintre" },
  couvreur:     { article: "de", label: "couvreur" },
  macon:        { article: "de", label: "maçon" },
  garage:       { article: "de", label: "garagiste" },
  coiffeur:     { article: "de", label: "coiffeur" },
  institut:     { article: "d'", label: "institut de beauté" },
  restaurant:   { article: "de", label: "restaurateur" },
  boulangerie:  { article: "de", label: "boulanger" },
};

function formatAge(dateCreation: string | null): string {
  if (!dateCreation) return "votre récente activité";
  const d = new Date(dateCreation);
  const months = Math.max(1, Math.round((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 30)));
  if (months <= 1) return "votre création il y a quelques semaines";
  if (months <= 3) return `votre création il y a ${months} mois`;
  if (months <= 6) return `votre lancement il y a ${months} mois`;
  return `votre installation`;
}

export function buildNewBusinessEmail(opts: NewBusinessPitchOptions): { subject: string; html: string } {
  const metier = METIER_FR[opts.businessType] || { article: "", label: "professionnel" };
  const ville = opts.city || "votre ville";
  const ageText = formatAge(opts.dateCreation);

  const subject = `🎁 Votre site web ${ville} — offert si abonnement Sérénité`;

  const html = `
<div style="font-family:-apple-system,'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;color:#1a1a1a;line-height:1.6">

  <!-- Bandeau "Création offerte" -->
  <div style="background:#16a34a;color:#fff;padding:14px 20px;text-align:center;font-weight:700;font-size:15px;border-radius:8px 8px 0 0">
    🎁 Création de site OFFERTE avec l'abonnement Sérénité
  </div>

  <div style="padding:32px 24px;border:1px solid #eee;border-top:none;border-radius:0 0 8px 8px">

    <p style="font-size:16px;margin-top:0">Bonjour,</p>

    <p>
      Bravo pour ${ageText} en tant que ${metier.article}${metier.label}${ville !== "votre ville" ? ` à ${ville}` : ""}.
      C'est une étape qui demande beaucoup d'énergie — et je voulais vous accompagner sur un point souvent négligé au démarrage : <strong>votre présence en ligne</strong>.
    </p>

    <p>
      Aujourd'hui, <strong>8 clients sur 10 cherchent un ${metier.label} sur Google avant d'appeler</strong>.
      Sans site, ils tombent sur vos concurrents.
    </p>

    <div style="background:#f9f7f2;border-left:4px solid #16a34a;padding:18px 22px;border-radius:6px;margin:24px 0">
      <div style="font-weight:700;color:#16a34a;margin-bottom:6px">Notre offre lancement</div>
      <div style="font-size:14px;line-height:1.7">
        <strong>0&nbsp;€ aujourd'hui</strong> — la création de votre site est offerte.<br>
        <strong>50&nbsp;€/mois ensuite</strong> — hébergement, nom de domaine, modifications illimitées.<br>
        <strong>Sans engagement</strong> — résiliable en 1 clic à tout moment.
      </div>
    </div>

    <p>J'ai déjà préparé une maquette personnalisée pour vous :</p>

    <div style="text-align:center;margin:28px 0">
      <a href="${opts.mockupUrl}" style="background:#0a0a0a;color:#FFD700;padding:16px 32px;border-radius:100px;font-weight:800;text-decoration:none;display:inline-block;letter-spacing:0.02em">
        👁️ Voir ma maquette →
      </a>
    </div>

    <p style="font-size:14px;color:#666">
      Une question ? Répondez à cet email ou appelez-moi directement au <strong>06 35 59 24 71</strong>.
      Je réponds toujours sous 2&nbsp;heures.
    </p>

    <p style="margin-top:24px">
      Tom Bauer<br>
      <strong>Klyora Sites</strong><br>
      <a href="mailto:contact@klyora.fr" style="color:#0066ff">contact@klyora.fr</a>
    </p>

    <hr style="border:none;border-top:1px solid #eee;margin:20px 0">
    <p style="font-size:10px;color:#999;text-align:center;line-height:1.6">
      Vous recevez cet email car votre entreprise est référencée publiquement par l'INSEE (base SIRENE).
      <a href="${opts.unsubscribeUrl}" style="color:#999">Se désabonner en 1 clic</a>.
    </p>
  </div>
</div>`;

  return { subject, html };
}
