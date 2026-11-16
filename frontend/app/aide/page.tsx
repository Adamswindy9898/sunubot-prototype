"use client";

import { useState } from "react";
import { ArrowLeft, ChevronDown, ChevronUp, MessageCircle, Globe, FileText, Shield, MapPin, Phone } from "lucide-react";

interface FAQ {
  question: string;
  question_wo: string;
  answer: string;
  answer_wo: string;
  category: string;
}

const FAQS: FAQ[] = [
  {
    category: "general",
    question: "Qu'est-ce que SunuBot ?",
    question_wo: "Lan la SunuBot ?",
    answer: "SunuBot est un assistant administratif intelligent qui vous aide a effectuer vos demarches administratives au Senegal. Il comprend le francais et le wolof, et peut vous guider pour les services de l'Etat Civil, la DGID (impots), la CNSS et bien d'autres.",
    answer_wo: "SunuBot mooy jaafarafa bu xarala bu la ndimbal ci sa demarches administratives ci Senegal. Mooy deg francais ak wolof, te man na la yoonne ci services yi nek ci Etat Civil, DGID (wall), CNSS ak yeneen.",
  },
  {
    category: "general",
    question: "Est-ce gratuit ?",
    question_wo: "Amul fey ?",
    answer: "Oui, l'utilisation de SunuBot est entierement gratuite. Seules les demarches administratives elles-memes peuvent avoir des frais (timbres fiscaux, etc.).",
    answer_wo: "Waaw, SunuBot deful fey. Li rekk war nga fey mooy frais yi ci demarches yi (timbres fiscaux, etc.).",
  },
  {
    category: "general",
    question: "En quelles langues puis-je utiliser SunuBot ?",
    question_wo: "Ci lan laa man a jokko ak SunuBot ?",
    answer: "SunuBot comprend le francais et le wolof. Vous pouvez ecrire dans les deux langues, et meme melanger les deux. La detection de langue est automatique.",
    answer_wo: "SunuBot deg na francais ak wolof. Man nga bind ci njaay yu 2 yi, te man nga sol njaay yu 2 yi. Detection langue bi automatique la.",
  },
  {
    category: "services",
    question: "Quels services sont disponibles ?",
    question_wo: "Lan yi services yi am ?",
    answer: "SunuBot couvre actuellement :\n• Etat Civil : actes de naissance, mariage, deces, certificats\n• DGID : impots, NINEA, situation fiscale, declarations\n• CNSS : inscription, retraite, cotisations\n• Formulaires : telechargement et pre-remplissage",
    answer_wo: "SunuBot moom nii :\n• Etat Civil : kart becceg, takk, dee, certificats\n• DGID : wall, NINEA, situation fiscale\n• CNSS : bind, retraite, cotisations\n• Formulaires : telecharger ak remplir",
  },
  {
    category: "services",
    question: "Comment suivre ma demande ?",
    question_wo: "Naka laa topp sama demande ?",
    answer: "1. Connectez-vous a votre compte SunuBot\n2. Cliquez sur votre nom en haut a droite\n3. Vous verrez toutes vos demandes avec leur statut actuel\n4. Vous pouvez aussi telecharger le recepisse PDF",
    answer_wo: "1. Dugg ci sa compte SunuBot\n2. Bes ci sa tur ci kaw-ndijoor\n3. Dinaa gis sa demandes yi ak seen statut\n4. Man nga telecharger recepisse PDF bi",
  },
  {
    category: "services",
    question: "Combien de temps prend une demande ?",
    question_wo: "Naata bees la dem ?",
    answer: "Les delais varient selon le service :\n• Acte de naissance : 3-5 jours ouvres\n• NINEA : 1-3 jours ouvres\n• Inscription CNSS : 15 jours\n• Attestation fiscale : 5-10 jours ouvres",
    answer_wo: "Delais yi bees la tuuti :\n• Kart becceg : 3-5 bees\n• NINEA : 1-3 bees\n• Bind CNSS : 15 bees\n• Attestation fiscale : 5-10 bees",
  },
  {
    category: "compte",
    question: "Comment creer un compte ?",
    question_wo: "Naka laa sossal compte ?",
    answer: "Cliquez sur le bouton 'Connexion' en haut a droite, puis sur 'Creer un compte'. Remplissez vos informations (nom, email, telephone) et choisissez un mot de passe.",
    answer_wo: "Bees ci bouton 'Dugg' ci kaw-ndijoor, te bees ci 'Sossal compte'. Remplir sa informations yi (tur, email, telephone) te tann mot de passe.",
  },
  {
    category: "compte",
    question: "Mes donnees sont-elles securisees ?",
    question_wo: "Sama donnees yi aar nanu ?",
    answer: "Oui. Vos donnees sont stockees dans une base PostgreSQL securisee. Les mots de passe sont hashes (bcrypt) et les sessions utilisent des tokens JWT. Nous ne partageons aucune donnee personnelle.",
    answer_wo: "Waaw. Sa donnees yi aar nanu ci base de donnees bu aar. Mots de passe yi hash nanu (bcrypt) te sessions yi jefandikoo tokens JWT. Nu partageewul donnees personnelles.",
  },
  {
    category: "technique",
    question: "Quelle technologie utilise SunuBot ?",
    question_wo: "Lan la SunuBot jefandikoo ?",
    answer: "SunuBot utilise :\n• mBERT (bert-base-multilingual-cased) pour la classification des intentions\n• Mistral LLM pour la generation de reponses\n• MCP (Model Context Protocol) pour acceder aux services\n• Next.js + FastAPI + PostgreSQL pour l'infrastructure",
    answer_wo: "SunuBot jefandikoo :\n• mBERT ngir classification intentions yi\n• Mistral LLM ngir generer reponses yi\n• MCP ngir acceder services yi\n• Next.js + FastAPI + PostgreSQL ngir infrastructure bi",
  },
];

const CATEGORIES = [
  { key: "general", label: "General", label_wo: "Mbooleem", icon: MessageCircle },
  { key: "services", label: "Services", label_wo: "Services yi", icon: FileText },
  { key: "compte", label: "Mon compte", label_wo: "Sama compte", icon: Shield },
  { key: "technique", label: "Technique", label_wo: "Technique", icon: Globe },
];

export default function AidePage() {
  const [openId, setOpenId] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("general");
  const [lang, setLang] = useState<"fr" | "wo">("fr");

  const isWo = lang === "wo";
  const filtered = FAQS.filter((f) => f.category === activeCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0f4f8] to-[#e8f0fe]">
      {/* Header */}
      <header className="bg-gradient-to-r from-[#1F5C99] to-[#0f3d6e] text-white px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <a href="/" className="p-2 hover:bg-white/10 rounded-lg transition">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{isWo ? "Ndimbal" : "Aide & FAQ"}</h1>
            <p className="text-white/70 text-sm mt-0.5">
              {isWo ? "Laaj yi aju genn ci SunuBot" : "Questions frequemment posees"}
            </p>
          </div>
          <button
            onClick={() => setLang(lang === "fr" ? "wo" : "fr")}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg text-xs border border-white/20 transition"
          >
            <Globe className="w-3.5 h-3.5" />
            {isWo ? "Wolof" : "Francais"}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Contact rapide */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-sm font-bold text-gray-800">
              {isWo ? "Bëgg nga jokko ak nun ?" : "Besoin d'aide supplementaire ?"}
            </h2>
            <p className="text-xs text-gray-500 mt-1">
              {isWo ? "Jokko ak SunuBot ci chatbot bi" : "Posez votre question directement au chatbot"}
            </p>
          </div>
          <div className="flex gap-2">
            <a href="/" className="flex items-center gap-1.5 bg-[#1F5C99] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#174a7a] transition">
              <MessageCircle className="w-3.5 h-3.5" /> Chatbot
            </a>
            <a href="tel:+221338251234" className="flex items-center gap-1.5 border border-gray-300 text-gray-700 px-4 py-2 rounded-xl text-xs font-semibold hover:bg-gray-50 transition">
              <Phone className="w-3.5 h-3.5" /> Appeler
            </a>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                activeCategory === cat.key
                  ? "bg-[#1F5C99] text-white shadow-lg"
                  : "bg-white text-gray-600 border border-gray-200 hover:border-[#1F5C99]/30"
              }`}
            >
              <cat.icon className="w-3.5 h-3.5" />
              {isWo ? cat.label_wo : cat.label}
            </button>
          ))}
        </div>

        {/* FAQ items */}
        <div className="space-y-3">
          {filtered.map((faq, i) => {
            const globalIdx = FAQS.indexOf(faq);
            const isOpen = openId === globalIdx;
            return (
              <div key={globalIdx} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition">
                <button
                  onClick={() => setOpenId(isOpen ? null : globalIdx)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                >
                  <span className="text-sm font-semibold text-gray-800 flex-1 pr-4">
                    {isWo ? faq.question_wo : faq.question}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-[#1F5C99] shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="px-5 pb-4 border-t border-gray-100 pt-3">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                      {isWo ? faq.answer_wo : faq.answer}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-xs text-gray-400">
          <p><strong>SunuBot</strong> — {isWo ? "Jaafarafa bu xarala ci services administratifs yi ci Senegal" : "Plateforme de services administratifs intelligents du Senegal"}</p>
          <p className="mt-1">Memoire M2 IA — Universite de Thies — Adama GAYE</p>
        </div>
      </main>
    </div>
  );
}
