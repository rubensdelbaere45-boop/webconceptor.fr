import Link from "next/link";

export default function Home() {
  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 px-6 flex items-center justify-between border-b border-black/5 bg-white/80 backdrop-blur-xl">
        <Link href="/" className="text-base font-bold tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-sm" />
          Web<span className="text-blue-600">Conceptor</span>
        </Link>
        <div className="hidden md:flex gap-7 text-sm text-gray-500">
          <a href="#realisations" className="hover:text-black transition">Réalisations</a>
          <a href="#methode" className="hover:text-black transition">Méthode</a>
          <a href="#tarifs" className="hover:text-black transition">Tarifs</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-gray-500 hover:text-black transition hidden sm:inline">Se connecter</Link>
          <Link href="/dashboard/enter-code" className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition">
            Entrer un code
          </Link>
        </div>
      </nav>

      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-black/8 rounded-full text-sm text-gray-500 mb-10">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          La référence web des professionnels
        </div>
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-[120px] font-extrabold tracking-[-0.06em] leading-[0.9] mb-8 max-w-4xl">
          Des sites qui{" "}
          <span className="bg-gradient-to-b from-black to-gray-400 bg-clip-text text-transparent">performent.</span>
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mb-12 leading-relaxed">
          WebConceptor crée des sites professionnels sur-mesure pour les TPE françaises. Design premium, livraison rapide.
        </p>
        <div className="flex gap-3 flex-wrap justify-center">
          <Link href="/dashboard/enter-code" className="px-6 py-3 bg-black text-white text-base font-medium rounded-xl hover:bg-gray-800 transition flex items-center gap-2 shadow-lg shadow-black/10">
            Créer mon site →
          </Link>
          <a href="#realisations" className="px-6 py-3 border border-black/10 text-gray-600 text-base font-medium rounded-xl hover:border-black hover:text-black transition">
            Voir nos réalisations
          </a>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-black/8 to-transparent" />

      <section id="methode" className="py-32 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-blue-600 font-medium text-sm mb-5">Méthode</p>
            <h2 className="text-5xl sm:text-6xl font-extrabold tracking-[-0.04em]">
              <span className="bg-gradient-to-b from-black to-gray-400 bg-clip-text text-transparent">Comment ça marche.</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-black/6 border border-black/6 rounded-xl overflow-hidden">
            {[
              { n: "01", t: "Vous décrivez.", d: "Remplissez le formulaire intelligent. Questions ciblées sur votre métier, vos besoins, votre style." },
              { n: "02", t: "Nous concevons.", d: "Notre équipe conçoit un site unique. Design, contenu, SEO, RGPD — tout inclus." },
              { n: "03", t: "Vous validez.", d: "Site livré en 5 jours. Retours illimités. Mise en ligne sur votre domaine." },
            ].map((s) => (
              <div key={s.n} className="bg-gray-50 p-10">
                <p className="text-5xl font-extrabold tracking-[-0.04em] text-gray-200 mb-5">{s.n}</p>
                <h3 className="text-xl font-bold tracking-tight mb-3">{s.t}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-px bg-gradient-to-r from-transparent via-black/8 to-transparent" />

      <section id="tarifs" className="py-32 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-blue-600 font-medium text-sm mb-5">Tarifs</p>
          <h2 className="text-5xl sm:text-6xl font-extrabold tracking-[-0.04em] mb-5">
            <span className="bg-gradient-to-b from-black to-gray-400 bg-clip-text text-transparent">Prix clairs.</span>
          </h2>
          <p className="text-gray-500 text-lg mb-16">Tout inclus. Pas de surprise.</p>
          <div className="grid md:grid-cols-3 gap-4 text-left">
            <div className="bg-gray-50 border border-black/6 rounded-xl p-8 flex flex-col">
              <h3 className="text-xl font-bold mb-1">Essentiel</h3>
              <p className="text-sm text-gray-500 mb-7">Site simple.</p>
              <p className="text-5xl font-extrabold tracking-[-0.04em] mb-1">490<span className="text-sm text-gray-400 font-normal ml-1">€</span></p>
              <div className="border-b border-black/6 my-6" />
              <ul className="flex-1 space-y-3 mb-8 text-sm text-gray-500">
                <li>✓ 1–3 pages</li><li>✓ Design sur-mesure</li><li>✓ Responsive</li><li>✓ Livraison 5 jours</li>
              </ul>
              <Link href="/dashboard/enter-code" className="w-full py-3 border border-black/10 rounded-lg text-sm font-medium text-center hover:bg-black hover:text-white transition">Choisir →</Link>
            </div>
            <div className="bg-black text-white rounded-xl p-8 flex flex-col relative -translate-y-2 shadow-xl">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-xs font-semibold">Populaire</span>
              <h3 className="text-xl font-bold mb-1">Professionnel</h3>
              <p className="text-sm text-gray-400 mb-7">Site complet.</p>
              <p className="text-5xl font-extrabold tracking-[-0.04em] mb-1">1 490<span className="text-sm text-gray-500 font-normal ml-1">€</span></p>
              <div className="border-b border-white/10 my-6" />
              <ul className="flex-1 space-y-3 mb-8 text-sm text-gray-400">
                <li>✓ 5–8 pages</li><li>✓ Design premium</li><li>✓ SEO + Google Business</li><li>✓ Hébergement 1 an</li><li>✓ Retours illimités</li>
              </ul>
              <Link href="/dashboard/enter-code" className="w-full py-3 bg-white text-black rounded-lg text-sm font-medium text-center hover:bg-blue-600 hover:text-white transition">Choisir →</Link>
            </div>
            <div className="bg-gray-50 border border-black/6 rounded-xl p-8 flex flex-col">
              <h3 className="text-xl font-bold mb-1">Sur-mesure</h3>
              <p className="text-sm text-gray-500 mb-7">Projets complexes.</p>
              <p className="text-3xl font-extrabold tracking-[-0.03em] mb-1">Sur devis</p>
              <div className="border-b border-black/6 my-6" />
              <ul className="flex-1 space-y-3 mb-8 text-sm text-gray-500">
                <li>✓ Pages illimitées</li><li>✓ E-commerce</li><li>✓ Espace client</li><li>✓ Support dédié</li>
              </ul>
              <Link href="/dashboard/enter-code" className="w-full py-3 border border-black/10 rounded-lg text-sm font-medium text-center hover:bg-black hover:text-white transition">Nous contacter →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-28 px-6">
        <div className="max-w-4xl mx-auto text-center bg-gray-50 border border-black/6 rounded-2xl p-20 relative overflow-hidden">
          <div className="absolute top-[-40%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/8 rounded-full blur-[100px] pointer-events-none" />
          <h2 className="text-5xl sm:text-6xl font-extrabold tracking-[-0.04em] mb-6 relative z-10">
            Votre site. <span className="bg-gradient-to-b from-black to-gray-400 bg-clip-text text-transparent">Simplement.</span>
          </h2>
          <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto relative z-10">Remplissez le formulaire. Nous vous recontactons sous 24h.</p>
          <Link href="/dashboard/enter-code" className="relative z-10 inline-flex items-center gap-2 px-8 py-4 bg-black text-white text-base font-medium rounded-xl hover:bg-gray-800 transition shadow-lg">
            Créer mon site →
          </Link>
        </div>
      </section>

      <footer className="py-12 px-6 border-t border-black/5">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <p className="text-base font-bold tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-sm" />Web<span className="text-blue-600">Conceptor</span>
          </p>
          <div className="flex gap-7 text-sm text-gray-400 flex-wrap">
            <a href="#realisations">Réalisations</a>
            <a href="#methode">Méthode</a>
            <a href="#tarifs">Tarifs</a>
            <a href="#">Mentions légales</a>
          </div>
          <p className="text-xs text-gray-400">© 2026 WebConceptor · webconceptor.fr</p>
        </div>
      </footer>
    </>
  );
}
