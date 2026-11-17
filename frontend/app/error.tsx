"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("SunuBot error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#f0f7f4] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Oups ! Une erreur est survenue</h1>
        <p className="text-sm text-gray-500 mb-6">
          Le chatbot a rencontré un problème technique. Veuillez réessayer.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="bg-[#1F5C99] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#174a7a] transition"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-50 transition"
          >
            Accueil
          </a>
        </div>
        <p className="text-[10px] text-gray-400 mt-6">
          SunuBot — Mémoire M2 IA — Université de Thiès
        </p>
      </div>
    </div>
  );
}
