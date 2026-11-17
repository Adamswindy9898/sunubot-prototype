"use client";

import { useState, useEffect } from "react";
import { MessageCircle, Globe, FileText, ArrowRight, X } from "lucide-react";

const STEPS = [
  {
    icon: MessageCircle,
    title_fr: "Bienvenue sur SunuBot !",
    title_wo: "Dalal jaamm ci SunuBot !",
    desc_fr: "Votre assistant administratif intelligent. Posez vos questions en français ou en wolof, SunuBot comprend les deux langues.",
    desc_wo: "Sa jaafarafa bu xarala. Laaj sa laaj yi ci français walla wolof, SunuBot deg njaay yu 2 yi.",
    color: "from-blue-500 to-blue-600",
  },
  {
    icon: Globe,
    title_fr: "Bilingue FR / Wolof",
    title_wo: "Njaay yu 2 FR / Wolof",
    desc_fr: "Écrivez dans la langue de votre choix. La détection est automatique grâce à notre modèle mBERT fine-tuné sur un corpus sénégalais.",
    desc_wo: "Bind ci njaay bi nga bëgg. Détection bi automatique la ndax sunu modèle mBERT fine-tuné ci corpus Sénégalais.",
    color: "from-green-500 to-emerald-600",
  },
  {
    icon: FileText,
    title_fr: "4 services connectés",
    title_wo: "4 services yi connecté",
    desc_fr: "État Civil, DGID (impôts), CNSS (sécurité sociale), et Formulaires. Chaque service est accessible via le protocole MCP.",
    desc_wo: "État Civil, DGID (wàll), CNSS, ak Formulaires. Service bu nekk connecté na via protocole MCP.",
    color: "from-purple-500 to-indigo-600",
  },
];

export default function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [lang, setLang] = useState<"fr" | "wo">("fr");

  useEffect(() => {
    if (!localStorage.getItem("sunubot-onboarded")) {
      setShow(true);
    }
  }, []);

  const close = () => {
    setShow(false);
    localStorage.setItem("sunubot-onboarded", "true");
  };

  if (!show) return null;

  const current = STEPS[step];
  const Icon = current.icon;
  const isWo = lang === "wo";
  const isLast = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header gradient */}
        <div className={`bg-gradient-to-br ${current.color} p-8 text-white text-center relative`}>
          <button onClick={close} className="absolute top-4 right-4 p-1 hover:bg-white/20 rounded-lg transition">
            <X className="w-5 h-5" />
          </button>
          <button onClick={() => setLang(lang === "fr" ? "wo" : "fr")}
            className="absolute top-4 left-4 text-[10px] bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-lg border border-white/30 transition font-semibold">
            {isWo ? "Wolof" : "Français"}
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 ring-4 ring-white/10">
            <Icon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold">{isWo ? current.title_wo : current.title_fr}</h2>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="text-sm text-gray-600 leading-relaxed text-center">
            {isWo ? current.desc_wo : current.desc_fr}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 my-5">
            {STEPS.map((_, i) => (
              <div key={i} className={`w-2.5 h-2.5 rounded-full transition-all ${i === step ? "bg-[#1F5C99] scale-125" : "bg-gray-200"}`} />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            {step > 0 && (
              <button onClick={() => setStep(step - 1)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
                {isWo ? "Dellu" : "Retour"}
              </button>
            )}
            <button onClick={isLast ? close : () => setStep(step + 1)}
              className="flex-1 py-2.5 bg-[#1F5C99] text-white rounded-xl text-sm font-semibold hover:bg-[#174a7a] transition flex items-center justify-center gap-2">
              {isLast ? (isWo ? "Tambali !" : "Commencer !") : (isWo ? "Topp" : "Suivant")}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
