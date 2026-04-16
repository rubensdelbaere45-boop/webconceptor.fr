import Link from "next/link";

export default function Home() {
  return (
    <div className="bg-white text-black min-h-screen">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 px-6 flex items-center justify-between border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <Link href="/" className="text-base font-bold tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-sm" />
          Web<span className="text-blue-600">Conceptor</span>
        </Link>
        <div className="hidden md:flex gap-7 text-sm text-gray-500">
          <a href="#realisations" className="hover:text-black transition">Réalisations</a>
          <a href="#methode" className="hover:text-black transition">Méthode</a>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/login" className="text-sm text-gray-500 hover:text-black transition hidden sm:inline">
            Se connecter
          </Link>
          <Link
            href="/dashboard/enter-code"
            className="px-4 py-2 bg-black text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition"
          >
            Entrer un code
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="min-h-screen flex flex-col items-center justify-center text-center px-6 pt-32 pb-20 relative bg-white">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-gray-200 rounded-full text-sm text-gray-500 mb-10">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
          La référence web des professionnels
        </div>

        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tighter leading-none mb-8 max-w-3xl text-black">
          Des sites qui performent.
        </h1>

        <p className="text-lg text-gray-500 max-w-xl mb-12 leading-relaxed">
          WebConceptor crée des sites professionnels sur-mesure pour les TPE françaises. Design premium, livraison en 5 jours.
        </p>

        <div className="flex gap-3 flex-wrap justify-center">
          <Link
            href="/dashboard/enter-code"
            className="px-6 py-3 bg-black text-white text-base font-medium rounded-xl hover:bg-gray-800 transition flex items-center gap-2"
          >
            Créer mon site →
          </Link>
          <a
            href="#realisations"
            className="px-6 py-3 border border-gray-200 text-gray-600 text-base font-medium rounded-xl hover:border-black hover:text-black transition"
          >
            Voir nos réalisations
          </a>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="h-px bg-gray-100" />

      {/* RÉALISATIONS */}
      <section id="realisations" className="py-32 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-blue-600 font-medium text-sm mb-5">Nos réalisations</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black">
              Sites livrés.
            </h2>
            <p className="text-gray-500 mt-4 text-lg">Chaque site est conçu sur-mesure. Cliquez pour voir.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { name: "Maison Tête", type: "RESTAURANT · LYON", img: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=1200&q=80&auto=format&fit=crop", url: "https://conceptor.surge.sh/exemples/maison-tete.html" },
              { name: "Studio Lamarre", type: "ARCHITECTE · PARIS", img: "https://images.unsplash.com/photo-1618220179428-22790b461013?w=1200&q=80&auto=format&fit=crop", url: "https://conceptor.surge.sh/exemples/studio-lamarre.html" },
              { name: "Domaine Pontevès", type: "VIGNERON · PROVENCE", img: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?w=1200&q=80&auto=format&fit=crop", url: "https://conceptor.surge.sh/exemples/domaine-ponteves.html" },
              { name: "Clara Nové", type: "PHOTOGRAPHE · BORDEAUX", img: "https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format&fit=crop", url: "https://conceptor.surge.sh/exemples/clara-nove.html" },
            ].map((site) => (
              <a
                key={site.name}
                href={site.url}
                target="_blank"
                rel="noopener"
                className="group block bg-gray-50 border border-gray-100 rounded-xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={site.img}
                    alt={site.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <span className="absolute top-3 right-3 px-2 py-1 bg-black/50 backdrop-blur text-white text-[10px] font-semibold tracking-wider rounded">
                    WEBCONCEPTOR
                  </span>
                </div>
                <div className="p-5 flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-black">{site.name}</p>
                    <p className="text-xs text-gray-400 tracking-wider mt-1">{site.type}</p>
                  </div>
                  <span className="text-blue-600 text-sm font-medium group-hover:translate-x-1 transition-transform">
                    Voir →
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="h-px bg-gray-100" />

      {/* MÉTHODE */}
      <section id="methode" className="py-32 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-20">
            <p className="text-blue-600 font-medium text-sm mb-5">Méthode</p>
            <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-black">
              Comment ça marche.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-px bg-gray-100 border border-gray-100 rounded-xl overflow-hidden">
            {[
              { n: "01", t: "Vous décrivez.", d: "Remplissez le formulaire intelligent. Questions ciblées sur votre métier, vos besoins, votre style." },
              { n: "02", t: "Nous concevons.", d: "Notre équipe conçoit un site unique. Design, contenu, SEO, conformité RGPD — tout inclus." },
              { n: "03", t: "Vous validez.", d: "Site livré en 5 jours. Retours illimités jusqu'à satisfaction. Mise en ligne sur votre domaine." },
            ].map((s) => (
              <div key={s.n} className="bg-white p-10">
                <p className="text-5xl font-extrabold tracking-tighter text-gray-100 mb-5">{s.n}</p>
                <h3 className="text-xl font-bold tracking-tight mb-3 text-black">{s.t}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <div className="h-px bg-gray-100" />

      {/* CTA */}
      <section className="py-28 px-6 bg-white">
        <div className="max-w-3xl mx-auto text-center bg-gray-50 border border-gray-100 rounded-2xl p-20">
          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 text-black">
            Votre site. Simplement.
          </h2>
          <p className="text-gray-500 text-lg mb-10 max-w-md mx-auto">
            Contactez-nous ou entrez votre code projet pour commencer.
          </p>
          <Link
            href="/dashboard/enter-code"
            className="inline-flex items-center gap-2 px-8 py-4 bg-black text-white text-base font-medium rounded-xl hover:bg-gray-800 transition"
          >
            Créer mon site →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 border-t border-gray-100 bg-white">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-6">
          <p className="text-base font-bold tracking-tight flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-600 rounded-sm" />
            Web<span className="text-blue-600">Conceptor</span>
          </p>
          <div className="flex gap-7 text-sm text-gray-400 flex-wrap">
            <a href="#realisations" className="hover:text-black transition">Réalisations</a>
            <a href="#methode" className="hover:text-black transition">Méthode</a>
            <a href="#">Mentions légales</a>
          </div>
          <p className="text-xs text-gray-400">© 2026 WebConceptor · webconceptor.fr</p>
        </div>
      </footer>
    </div>
  );
}
