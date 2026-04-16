import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link href="/" className="text-lg font-bold tracking-tight inline-flex items-center gap-2 mb-6">
            <span className="w-2 h-2 bg-blue-600 rounded-sm" />Web<span className="text-blue-600">Conceptor</span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mt-4">Connexion</h1>
          <p className="text-sm text-gray-500 mt-2">Accédez à votre espace client</p>
        </div>
        <div className="bg-white border border-black/6 rounded-xl p-8 shadow-sm">
          <form className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
              <input type="email" className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="vous@entreprise.fr" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Mot de passe</label>
              <input type="password" className="w-full px-3 py-2.5 border border-black/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" placeholder="••••••••" />
            </div>
            <button type="submit" className="w-full py-3 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition mt-2">
              Se connecter
            </button>
          </form>
        </div>
        <p className="text-center text-sm text-gray-500 mt-6">
          Pas encore de compte ?{" "}
          <Link href="/auth/register" className="text-blue-600 font-medium hover:underline">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}
