import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="h-16 px-6 flex items-center justify-between border-b border-black/5 bg-white">
        <Link href="/" className="text-base font-bold tracking-tight flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-sm" />Web<span className="text-blue-600">Conceptor</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/dashboard/enter-code" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition">
            Entrer un code
          </Link>
          <button className="text-sm text-gray-500 hover:text-black transition">Déconnexion</button>
        </div>
      </nav>
      <div className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Mon espace</h1>
        <p className="text-gray-500 mb-10">Retrouvez tous vos projets WebConceptor.</p>

        <div className="bg-white border border-black/6 rounded-xl p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 3v18M3 9h6" />
            </svg>
          </div>
          <h2 className="text-xl font-bold mb-2">Aucun projet pour le moment</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Vous avez reçu un code à 6 chiffres par email ? Entrez-le pour accéder à votre projet.
          </p>
          <Link href="/dashboard/enter-code" className="inline-flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition">
            Entrer un code →
          </Link>
        </div>
      </div>
    </div>
  );
}
