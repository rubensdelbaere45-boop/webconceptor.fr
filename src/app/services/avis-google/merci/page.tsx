export default function AvisGoogleMerciPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-10 text-center">
        <div className="text-6xl mb-6">⭐</div>
        <h1 className="text-2xl font-black mb-3">Paiement confirmé !</h1>
        <p className="text-gray-500 mb-6">
          Vous allez recevoir un email avec le <strong>lien pour connecter votre Google My Business</strong>.
          L&apos;activation prend moins de 2 minutes.
        </p>
        <div className="bg-yellow-50 rounded-2xl p-5 text-sm text-yellow-800 text-left mb-6">
          <p className="font-semibold mb-2">📧 Vérifiez votre boîte email</p>
          <p>L&apos;email de connexion arrive dans 1-2 minutes. Vérifiez vos spams si nécessaire.</p>
        </div>
        <a href="https://webconceptor.fr" className="text-blue-600 text-sm hover:underline">← Retour au site</a>
      </div>
    </div>
  );
}
