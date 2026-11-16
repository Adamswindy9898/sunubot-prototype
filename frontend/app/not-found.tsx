import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e8f0fe] flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 bg-[#1F5C99] rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
          <span className="text-4xl text-white font-black">?</span>
        </div>
        <h1 className="text-6xl font-black text-[#1F5C99] mb-2">404</h1>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Page introuvable</h2>
        <p className="text-sm text-gray-500 mb-6">
          Cette page n&apos;existe pas sur SunuBot. Vous pouvez retourner au chatbot ou consulter les statistiques.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/"
            className="bg-[#1F5C99] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#174a7a] transition shadow-lg">
            Retour au chatbot
          </Link>
          <Link href="/stats"
            className="border border-[#1F5C99] text-[#1F5C99] px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-50 transition">
            Voir les statistiques
          </Link>
        </div>
        <p className="text-[10px] text-gray-400 mt-8">
          SunuBot — Plateforme de services administratifs du Senegal
        </p>
      </div>
    </div>
  );
}
