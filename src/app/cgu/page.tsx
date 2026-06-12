import Link from "next/link";

export default function CGU() {
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
        <h1 className="text-3xl font-bold tracking-tight mb-8">Conditions generales d&apos;utilisation</h1>
        <div className="prose prose-sm prose-gray max-w-none text-[14px] text-[#525252] leading-relaxed space-y-6">
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Article 1 — Objet</h2>
            <p>Les presentes conditions generales d&apos;utilisation (CGU) regissent l&apos;acces et l&apos;utilisation du site webconceptor.fr ainsi que les prestations de creation de sites web proposees par Klyora Sites.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Article 2 — Prestations</h2>
            <p>Klyora Sites propose la creation de sites web professionnels sur-mesure. Le prix de base est a partir de 199 euros (paiement unique). Une formule d&apos;hebergement et de maintenance optionnelle est disponible a 50 euros par mois, sans engagement.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Article 3 — Processus de commande</h2>
            <p>Le client remplit le formulaire de demande en ligne. Klyora Sites s&apos;engage a recontacter le client sous 48 heures maximum. Un devis personnalise est etabli avant tout debut de prestation. Aucun paiement n&apos;est exige avant validation du devis par le client.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Article 4 — Livraison</h2>
            <p>Le delai moyen de livraison est de 5 jours ouvrables apres validation du devis et reception du paiement. Le client dispose de retours illimites jusqu&apos;a satisfaction complete du resultat.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Article 5 — Formule Serenite</h2>
            <p>La Formule Serenite (50 euros/mois) inclut l&apos;hebergement, la maintenance technique, les mises a jour de contenu sur simple demande par email, et le renouvellement du nom de domaine et du certificat SSL. Cette formule est sans engagement et resiliable a tout moment.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Article 6 — Propriete</h2>
            <p>A la livraison et apres paiement integral, le client devient proprietaire du site web. Les fichiers source lui sont remis sur demande. Klyora Sites conserve le droit de mentionner la realisation dans son portfolio sauf demande contraire ecrite.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Article 7 — Responsabilite</h2>
            <p>Klyora Sites met tout en oeuvre pour assurer la qualite des prestations. La responsabilite de Klyora Sites est limitee au montant de la prestation facturee. Klyora Sites ne saurait etre tenu responsable des contenus fournis par le client.</p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-[#0a0a0a] mb-2">Article 8 — Droit applicable</h2>
            <p>Les presentes CGU sont soumises au droit francais. Tout litige sera porte devant les tribunaux competents.</p>
          </section>
        </div>
        <div className="mt-12 pt-8 border-t border-[#f5f5f5]">
          <Link href="/" className="text-[13px] text-[#0066ff] hover:underline">← Retour a l&apos;accueil</Link>
        </div>
      </div>
    </div>
  );
}
