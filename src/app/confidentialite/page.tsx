import Link from "next/link";

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="h-14 px-6 flex items-center border-b border-[#f5f5f5]">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 bg-[#0a0a0a] rounded-md flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">W</span>
          </span>
          <span className="text-[14px] font-semibold tracking-tight">Klyora Sites</span>
        </Link>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Politique de confidentialite</h1>
        <div className="prose prose-sm prose-gray max-w-none text-[14px] text-[#525252] leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Responsable du traitement</h2>
            <p>Klyora Sites — Rubens Delbaere<br />Email : rubensdelbaere7@icloud.com</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Donnees collectees</h2>
            <p>Nous collectons les donnees suivantes uniquement dans le cadre de nos prestations :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Nom et prenom</li>
              <li>Adresse email</li>
              <li>Numero de telephone (optionnel)</li>
              <li>Type d&apos;activite professionnelle</li>
              <li>Details du projet et preferences</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Finalite du traitement</h2>
            <p>Les donnees sont collectees exclusivement pour :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Traiter votre demande de creation de site</li>
              <li>Vous recontacter pour etablir un devis</li>
              <li>Assurer le suivi de votre projet</li>
              <li>Gerer votre compte client</li>
            </ul>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Base legale</h2>
            <p>Le traitement est fonde sur votre consentement (envoi du formulaire) et sur l&apos;execution d&apos;un contrat (prestation de service).</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Duree de conservation</h2>
            <p>Vos donnees sont conservees pendant la duree de la relation commerciale et 3 ans apres la fin de celle-ci, conformement aux obligations legales.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Partage des donnees</h2>
            <p>Vos donnees ne sont jamais vendues ni cedees a des tiers. Elles peuvent etre traitees par nos sous-traitants techniques (Supabase pour la base de donnees, Render pour l&apos;hebergement) dans le strict cadre de la prestation.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Vos droits (RGPD)</h2>
            <p>Conformement au Reglement General sur la Protection des Donnees (RGPD), vous disposez des droits suivants :</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Droit d&apos;acces</strong> : obtenir une copie de vos donnees</li>
              <li><strong>Droit de rectification</strong> : corriger vos donnees</li>
              <li><strong>Droit de suppression</strong> : demander l&apos;effacement de vos donnees</li>
              <li><strong>Droit a la portabilite</strong> : recevoir vos donnees dans un format lisible</li>
              <li><strong>Droit d&apos;opposition</strong> : vous opposer au traitement de vos donnees</li>
            </ul>
            <p className="mt-2">Pour exercer ces droits, contactez-nous a rubensdelbaere7@icloud.com. Nous repondrons sous 30 jours.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Cookies</h2>
            <p>Le site utilise uniquement des cookies techniques essentiels (authentification, session utilisateur). Aucun cookie publicitaire, analytique ou de suivi n&apos;est utilise.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Contact</h2>
            <p>Pour toute question relative a la protection de vos donnees, contactez-nous a rubensdelbaere7@icloud.com.</p>
          </section>
        </div>
        <div className="mt-12 pt-8 border-t border-[#f5f5f5]">
          <Link href="/" className="text-[13px] text-[#0066ff] hover:underline">← Retour a l&apos;accueil</Link>
        </div>
      </div>
    </div>
  );
}
