"use client";

import { useState } from "react";
import { Star, ThumbsUp, Send, X } from "lucide-react";

interface SatisfactionFormProps {
  langue?: string;
  service?: string;
  onClose: () => void;
}

export default function SatisfactionForm({ langue, service, onClose }: SatisfactionFormProps) {
  const [nps, setNps] = useState<number | null>(null);
  const [mos, setMos] = useState<number | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isWolof = langue === "wolof";

  const getNpsLabel = (score: number) => {
    if (score >= 9) return isWolof ? "Baax na lool! 🎉" : "Excellent ! 🎉";
    if (score >= 7) return isWolof ? "Baax na" : "Bien";
    if (score >= 5) return isWolof ? "Normal" : "Passable";
    return isWolof ? "Baaxul" : "À améliorer";
  };

  const getNpsColor = (score: number) => {
    if (score >= 9) return "bg-green-500 text-white";
    if (score >= 7) return "bg-blue-500 text-white";
    if (score >= 5) return "bg-yellow-500 text-white";
    return "bg-red-400 text-white";
  };

  const handleSubmit = async () => {
    if (nps === null || mos === null) return;
    setIsLoading(true);
    try {
      await fetch("/api/satisfaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nps, mos, commentaire, langue, service }),
      });
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white border border-blue-100 rounded-2xl shadow-lg p-6 max-w-sm text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <ThumbsUp className="w-7 h-7 text-green-600" />
        </div>
        <h3 className="font-bold text-gray-900 text-base mb-1">
          {isWolof ? "Jërejëf! 🙏" : "Merci pour votre retour !"}
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          {isWolof
            ? "Sa opinion bi dafa am solo ngir SunuBot bi yem."
            : "Votre avis nous aide à améliorer SunuBot pour tous les citoyens."}
        </p>
        <button
          onClick={onClose}
          className="bg-[#1F5C99] text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-[#174a7a] transition"
        >
          {isWolof ? "Fermer" : "Fermer"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white border border-blue-100 rounded-2xl shadow-lg overflow-hidden max-w-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#1F5C99] to-[#0f3d6e] px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white text-sm">
            {isWolof ? "📊 Na nga gis SunuBot?" : "📊 Comment évaluez-vous SunuBot ?"}
          </h3>
          <p className="text-white/70 text-[11px]">
            {isWolof ? "Yëgël ma sa xalaat" : "Votre avis compte pour nous"}
          </p>
        </div>
        <button onClick={onClose} className="text-white/60 hover:text-white transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* NPS — Score 0 à 10 */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {isWolof
              ? "Ndax danga recommander SunuBot ci sa xarit yi? (0-10)"
              : "Recommanderiez-vous SunuBot à un proche ? (0-10)"}
          </p>
          <div className="flex gap-1 flex-wrap">
            {Array.from({ length: 11 }, (_, i) => (
              <button
                key={i}
                onClick={() => setNps(i)}
                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                  nps === i
                    ? getNpsColor(i)
                    : "bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-[#1F5C99]"
                }`}
              >
                {i}
              </button>
            ))}
          </div>
          {nps !== null && (
            <p className="text-xs mt-1.5 font-medium text-[#1F5C99]">{getNpsLabel(nps)}</p>
          )}
        </div>

        {/* MOS — Facilité d'utilisation 1 à 5 */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">
            {isWolof
              ? "Naka la yomb ci jëfandikoo SunuBot? (1-5)"
              : "Facilité d'utilisation de SunuBot ? (1-5)"}
          </p>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                onClick={() => setMos(score)}
                className={`flex-1 flex flex-col items-center py-2 rounded-xl transition-all border ${
                  mos === score
                    ? "bg-[#1F5C99] border-[#1F5C99] text-white"
                    : "border-gray-200 hover:border-[#1F5C99] hover:bg-blue-50"
                }`}
              >
                <Star className={`w-4 h-4 mb-0.5 ${mos !== null && score <= mos ? "fill-current" : ""}`} />
                <span className="text-[10px] font-bold">{score}</span>
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 mt-1 px-1">
            <span>{isWolof ? "Doyuul" : "Difficile"}</span>
            <span>{isWolof ? "Yomb na lool" : "Très facile"}</span>
          </div>
        </div>

        {/* Commentaire */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-1.5">
            {isWolof ? "Xalaat bu bees? (amul sarax)" : "Un commentaire ? (optionnel)"}
          </p>
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder={isWolof ? "Bind fii..." : "Écrivez ici..."}
            rows={2}
            className="w-full text-sm text-gray-900 border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:border-[#1F5C99] focus:ring-2 focus:ring-[#1F5C99]/10 transition"
          />
        </div>

        {/* Bouton */}
        <button
          onClick={handleSubmit}
          disabled={nps === null || mos === null || isLoading}
          className="w-full bg-gradient-to-r from-[#1F5C99] to-[#0f3d6e] text-white py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md"
        >
          {isLoading ? (
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4" />
              {isWolof ? "Yonnee" : "Envoyer mon avis"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
