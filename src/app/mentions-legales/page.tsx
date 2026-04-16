import Link from "next/link";

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="h-14 px-6 flex items-center border-b border-[#f5f5f5]">
        <Link href="/" className="flex items-center gap-2">
          <span className="w-6 h-6 bg-[#0a0a0a] rounded-md flex items-center justify-center">
            <span className="text-white text-[10px] font-bold">W</span>
          </span>
          <span className="text-[14px] font-semibold tracking-tight">WebConceptor</span>
        </Link>
      </nav>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold tracking-tight mb-8">Mentions legales</h1>
        <div className="prose prose-sm prose-gray max-w-none text-[14px] text-[#525252] leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Editeur du site</h2>
            <p>Le site webconceptor.fr est edite par WebConceptor, entreprise individuelle de creation de sites web professionnels.</p>
            <p>Responsable de la publication : Rubens Delbaere<br />Email : rubensdelbaere7@icloud.com</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Hebergement</h2>
            <p>Le site est heberge par Render Services, Inc.<br />525 Brannan Street, Suite 300, San Francisco, CA 94107, USA<br />Site : render.com</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Propriete intellectuelle</h2>
            <p>L&apos;ensemble des contenus presents sur le site webconceptor.fr (textes, images, logos, graphismes, icones) sont proteges par les lois relatives a la propriete intellectuelle. Toute reproduction, meme partielle, est interdite sans autorisation prealable.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Donnees personnelles</h2>
            <p>Les informations recueillies via le formulaire de demande sont destinees exclusivement a WebConceptor pour le traitement de votre demande. Conformement au RGPD, vous disposez d&apos;un droit d&apos;acces, de rectification et de suppression de vos donnees. Pour exercer ces droits, contactez-nous a rubensdelbaere7@icloud.com.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Cookies</h2>
            <p>Le site utilise uniquement des cookies techniques necessaires a son bon fonctionnement (authentification, session). Aucun cookie publicitaire ou de suivi n&apos;est utilise.</p>
          </section>
        </div>
        <div className="mt-12 pt-8 border-t border-[#f5f5f5]">
          <Link href="/" className="text-[13px] text-[#0066ff] hover:underline">← Retour a l&apos;accueil</Link>
        </div>
      </div>
    </div>
  );
}
