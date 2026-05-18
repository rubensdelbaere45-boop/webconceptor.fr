export default function AuditMerciPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-lg p-10 text-center">
        <div className="text-6xl mb-6">📊</div>
        <h1 className="text-2xl font-black mb-3">Votre audit est en cours !</h1>
        <p className="text-gray-500 mb-6">
          Notre IA analyse votre présence en ligne. Vous recevrez votre rapport complet
          <strong> par email dans moins de 5 minutes</strong>.
        </p>
        <div className="bg-slate-50 rounded-2xl p-5 text-sm text-slate-700 text-left mb-6">
          <p className="font-semibold mb-2">📧 Vérifiez votre boîte email</p>
          <p>Si vous ne voyez rien dans 10 minutes, écrivez-nous à <strong>contact@webconceptor.fr</strong></p>
        </div>
        <a href="https://webconceptor.fr" className="text-blue-600 text-sm hover:underline">← Retour au site</a>
      </div>
    </div>
  );
}
