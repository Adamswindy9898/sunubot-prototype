"use client";

import { useState, useEffect } from "react";
import {
  Home, MessageCircle, FileText, User, Bell,
  ChevronRight, ArrowLeft, Send, Search,
  CheckCircle, Clock, MapPin, Phone, LogIn, LogOut
} from "lucide-react";

type Screen = "accueil" | "chat" | "services" | "profil" | "demande" | "suivi";

interface CompteInfo {
  id: string;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  token: string;
}

interface Message {
  id: string;
  from: "user" | "bot";
  text: string;
  time: string;
  buttons?: { label: string; action: string }[];
}

function now() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

// ── Ecran Accueil ─────────────────────────────────────────────────
function AccueilScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const services = [
    { icon: "📄", label: "État Civil", desc: "Actes, extraits", color: "bg-blue-500",   action: "services" },
    { icon: "🏛️", label: "DGID",       desc: "Impôts, NINEA",  color: "bg-amber-500",  action: "services" },
    { icon: "❤️", label: "CNSS",       desc: "Sécurité sociale",color: "bg-red-500",    action: "services" },
    { icon: "🏥", label: "CMU",        desc: "Santé",           color: "bg-green-500",  action: "services" },
    { icon: "🎓", label: "Bourse",     desc: "Études",          color: "bg-purple-500", action: "services" },
    { icon: "🔍", label: "Suivi",      desc: "Mes demandes",    color: "bg-teal-500",   action: "suivi" },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-[#1F5C99] px-4 pt-10 pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/70 text-xs">Bonjour 👋</p>
            <h1 className="text-white font-bold text-lg">SunuBot 🇸🇳</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-white" />
          </div>
        </div>
        {/* Search bar */}
        <div className="bg-white/20 rounded-2xl flex items-center gap-2 px-3 py-2">
          <Search className="w-4 h-4 text-white/70" />
          <span className="text-white/50 text-sm">Rechercher un service...</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {/* Bannière */}
        <div className="bg-gradient-to-r from-[#1F5C99] to-[#0f3d6e] rounded-2xl p-4 mb-4 text-white">
          <p className="text-xs text-white/70 mb-1">Assistant multilingue</p>
          <p className="font-bold text-sm">Effectuez vos démarches</p>
          <p className="text-xs text-white/80 mb-3">Français · Wolof · En ligne 24h/7j</p>
          <button
            onClick={() => onNavigate("chat")}
            className="bg-white text-[#1F5C99] text-xs font-bold px-4 py-2 rounded-xl"
          >
            Parler à SunuBot →
          </button>
        </div>

        {/* Services */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Services disponibles</p>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {services.map((s, i) => (
            <button
              key={i}
              onClick={() => onNavigate(s.action as Screen)}
              className="bg-white rounded-2xl p-3 flex flex-col items-center gap-1.5 shadow-sm hover:shadow-md transition"
            >
              <div className={`w-10 h-10 ${s.color} rounded-xl flex items-center justify-center text-xl`}>
                {s.icon}
              </div>
              <p className="text-[10px] font-bold text-gray-700">{s.label}</p>
              <p className="text-[9px] text-gray-400">{s.desc}</p>
            </button>
          ))}
        </div>

        {/* Actualités */}
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Informations utiles</p>
        {[
          { icon: "📢", title: "État civil numérique", desc: "Demandez vos actes en ligne sans vous déplacer", color: "border-blue-200 bg-blue-50" },
          { icon: "💡", title: "NINEA gratuit", desc: "Immatriculez votre entreprise gratuitement en ligne", color: "border-amber-200 bg-amber-50" },
        ].map((n, i) => (
          <div key={i} className={`flex items-start gap-3 p-3 rounded-2xl border mb-2 ${n.color}`}>
            <span className="text-2xl shrink-0">{n.icon}</span>
            <div>
              <p className="text-xs font-bold text-gray-800">{n.title}</p>
              <p className="text-[11px] text-gray-500">{n.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Ecran Chat ────────────────────────────────────────────────────
function ChatScreen({ onNavigate }: { onNavigate: (s: Screen) => void }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1", from: "bot",
      text: "Bonjour ! Je suis SunuBot 🇸🇳\n\nQue puis-je faire pour vous ?",
      time: now(),
      buttons: [
        { label: "📄 S'inscrire", action: "inscrire" },
        { label: "📋 Demander un document", action: "document" },
        { label: "🏛️ Impôts/DGID", action: "dgid" },
        { label: "🔍 Suivre ma demande", action: "suivi" },
      ],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const RESPONSES: Record<string, string> = {
    inscrire: "Pour vous inscrire à l'état civil, rendez-vous dans l'onglet **Services** et choisissez **État Civil**.",
    document: "Quel document souhaitez-vous ?\n\n1. Acte de naissance\n2. Acte de mariage\n3. Acte de décès\n4. Certificat de nationalité",
    dgid: "**DGID — Impôts et Domaines**\n\nJe peux vous aider avec :\n• Obtenir votre NINEA\n• Déclaration TVA\n• Localiser votre centre fiscal",
    suivi: "Entrez votre numéro de demande (ex: DEM-2024-001) pour suivre votre dossier.",
  };

  const sendMessage = (text?: string, action?: string) => {
    const msg = text || input.trim();
    if (!msg) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), from: "user", text: msg, time: now() };
    setMessages(prev => [...prev, userMsg]);

    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const responseText = action
        ? RESPONSES[action] || "Je vous aide avec ça !"
        : msg.toLowerCase().includes("bonjour") ? "Bonjour ! Comment puis-je vous aider ?"
        : "Je vous comprends. Utilisez les services de l'onglet **Services** pour effectuer vos démarches.";

      const botMsg: Message = {
        id: Date.now().toString() + "b",
        from: "bot",
        text: responseText,
        time: now(),
      };
      setMessages(prev => [...prev, botMsg]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="bg-[#1F5C99] px-4 pt-10 pb-4 flex items-center gap-3">
        <button onClick={() => onNavigate("accueil")} className="text-white/70">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-sm">SB</div>
        <div>
          <p className="text-white font-bold text-sm">SunuBot</p>
          <p className="text-green-300 text-[10px]">● En ligne</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
            <div className="flex flex-col gap-1 max-w-[80%]">
              <div className={`rounded-2xl px-3 py-2 text-sm ${
                msg.from === "user"
                  ? "bg-[#1F5C99] text-white rounded-tr-sm"
                  : "bg-white text-gray-800 rounded-tl-sm shadow-sm"
              }`}>
                {msg.text.split("\n").map((l, i) => (
                  <p key={i} className={l === "" ? "h-2" : "mb-0.5 leading-snug text-[12px]"}
                    dangerouslySetInnerHTML={{ __html: l.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />
                ))}
                <p className={`text-[9px] mt-1 ${msg.from === "user" ? "text-white/50 text-right" : "text-gray-300"}`}>{msg.time}</p>
              </div>
              {msg.buttons && (
                <div className="grid grid-cols-2 gap-1">
                  {msg.buttons.map((b, i) => (
                    <button key={i} onClick={() => sendMessage(b.label, b.action)}
                      className="bg-white border border-[#1F5C99]/30 text-[#1F5C99] text-[10px] font-semibold py-2 px-2 rounded-xl hover:bg-blue-50 transition text-left">
                      {b.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-2xl px-4 py-3 shadow-sm flex gap-1">
              {[0,1,2].map(i => <div key={i} className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i*0.2}s` }} />)}
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="bg-white px-3 py-2 flex items-center gap-2 border-t border-gray-100">
        <input
          type="text" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") sendMessage(); }}
          placeholder="Écrivez votre message..."
          className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-900 outline-none"
        />
        <button onClick={() => sendMessage()}
          className="w-9 h-9 rounded-full bg-[#1F5C99] flex items-center justify-center">
          <Send className="w-4 h-4 text-white" />
        </button>
      </div>
    </div>
  );
}

// ── Ecran Services ────────────────────────────────────────────────
function ServicesScreen({ onNavigate, compte, onSubmitted }: { onNavigate: (s: Screen) => void; compte: CompteInfo | null; onSubmitted?: () => void }) {
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");

  const services = [
    {
      id: "inscription", icon: "📄", title: "Inscription État Civil", color: "bg-blue-500",
      fields: [
        { id: "nom", label: "Nom de famille", placeholder: "Ex: DIOP" },
        { id: "prenom", label: "Prénom", placeholder: "Ex: Moussa" },
        { id: "date_naissance", label: "Date de naissance", placeholder: "JJ/MM/AAAA" },
        { id: "lieu_naissance", label: "Lieu de naissance", placeholder: "Ex: Thiès" },
        { id: "nom_pere", label: "Nom du père", placeholder: "Ex: DIOP Ibrahima" },
        { id: "nom_mere", label: "Nom de la mère", placeholder: "Ex: FALL Fatou" },
        { id: "telephone", label: "Téléphone", placeholder: "77 123 45 67" },
      ],
    },
    {
      id: "acte_naissance", icon: "📋", title: "Acte de naissance", color: "bg-green-500",
      fields: [
        { id: "nom", label: "Nom", placeholder: "Ex: DIOP" },
        { id: "prenom", label: "Prénom", placeholder: "Ex: Moussa" },
        { id: "date_naissance", label: "Date de naissance", placeholder: "JJ/MM/AAAA" },
        { id: "lieu_naissance", label: "Lieu de naissance", placeholder: "Ex: Thiès" },
        { id: "telephone", label: "Téléphone", placeholder: "77 123 45 67" },
      ],
    },
    {
      id: "ninea", icon: "🏛️", title: "Demande NINEA", color: "bg-amber-500",
      fields: [
        { id: "nom", label: "Nom du gérant", placeholder: "Ex: DIOP" },
        { id: "prenom", label: "Prénom", placeholder: "Ex: Moussa" },
        { id: "activite", label: "Secteur d'activité", placeholder: "Ex: Commerce, BTP..." },
        { id: "adresse", label: "Adresse", placeholder: "Ex: Marché central, Thiès" },
        { id: "telephone", label: "Téléphone", placeholder: "77 123 45 67" },
      ],
    },
    {
      id: "cnss", icon: "❤️", title: "Inscription CNSS", color: "bg-red-500",
      fields: [
        { id: "nom", label: "Nom", placeholder: "Ex: DIOP" },
        { id: "prenom", label: "Prénom", placeholder: "Ex: Moussa" },
        { id: "secteur", label: "Secteur d'activité", placeholder: "Ex: Commerce..." },
        { id: "telephone", label: "Téléphone", placeholder: "77 123 45 67" },
      ],
    },
    {
      id: "bourse", icon: "🎓", title: "Bourse d'études", color: "bg-purple-500",
      fields: [
        { id: "nom", label: "Nom", placeholder: "Ex: DIOP" },
        { id: "prenom", label: "Prénom", placeholder: "Ex: Moussa" },
        { id: "universite", label: "Université", placeholder: "Ex: UIDT, UCAD..." },
        { id: "filiere", label: "Filière", placeholder: "Ex: Informatique..." },
        { id: "telephone", label: "Téléphone", placeholder: "77 123 45 67" },
      ],
    },
  ];

  const authHeaders: Record<string, string> = { "Content-Type": "application/json" };
  if (compte) authHeaders["Authorization"] = `Bearer ${compte.token}`;

  const handleSubmit = async (serviceId: string) => {
    try {
      let ref = "";
      if (serviceId === "inscription") {
        const res = await fetch("/api/inscription", {
          method: "POST", headers: authHeaders,
          body: JSON.stringify(formData),
        });
        const result = await res.json();
        ref = result.citoyen?.numero_acte || `EC-${Date.now()}`;
      } else if (serviceId === "acte_naissance") {
        const res = await fetch("/api/formulaire", {
          method: "POST", headers: authHeaders,
          body: JSON.stringify({ action: "soumettre", nom: formData.nom, prenom: formData.prenom, type_document: "acte_naissance", donnees: formData }),
        });
        const result = await res.json();
        ref = result.demande?.numero_suivi || `DEM-${Date.now()}`;
      } else {
        const serviceMap: Record<string, string> = { ninea: "dgid", cnss: "cnss", bourse: "bourse" };
        const res = await fetch("/api/services", {
          method: "POST", headers: authHeaders,
          body: JSON.stringify({ action: "inscrire", service: serviceMap[serviceId] || serviceId, donnees: { ...formData, activite: formData.activite || formData.secteur || serviceId } }),
        });
        const result = await res.json();
        ref = result.data?.ninea || result.data?.numero_cnss || result.data?.numero_bourse || `REF-${Date.now()}`;
      }
      setReference(ref);
      setSubmitted(true);
      onSubmitted?.();
    } catch {
      setReference(`REF-${Date.now()}`);
      setSubmitted(true);
      onSubmitted?.();
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const { genererRecepissePDF } = await import("@/lib/pdf-generator");
      const service = selectedService || "demande";
      const typeLabels: Record<string, string> = {
        inscription: "Inscription État Civil", acte_naissance: "Acte de naissance",
        acte_mariage: "Acte de mariage", acte_deces: "Acte de décès",
        certificat_nationalite: "Certificat de nationalité", ninea: "Demande NINEA",
        cnss: "Inscription CNSS", cmu: "Inscription CMU", bourse: "Demande de bourse",
      };
      await genererRecepissePDF({
        reference,
        type: typeLabels[service] || service,
        service: "ETAT_CIVIL",
        nom: formData.nom || "",
        prenom: formData.prenom || "",
        telephone: formData.telephone,
        dateCreation: new Date().toLocaleDateString("fr-FR"),
        statut: "recu",
        details: { lieu_naissance: formData.lieu_naissance || "", date_naissance: formData.date_naissance || "" },
        langue: "francais",
      });
    } catch { alert("Erreur lors de la génération du PDF."); }
  };

  if (submitted) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-[#1F5C99] px-4 pt-10 pb-4 flex items-center gap-3">
          <button onClick={() => { setSubmitted(false); setSelectedService(null); setFormData({}); }} className="text-white/70">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <p className="text-white font-bold">Confirmation</p>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Demande soumise !</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4 mb-4 w-full">
            <p className="text-xs text-gray-500 mb-1">Numéro de référence</p>
            <p className="text-lg font-black text-[#1F5C99] font-mono">{reference}</p>
          </div>
          <p className="text-sm text-gray-500 mb-4">📧 Email de confirmation envoyé.<br />Consultez votre espace pour le suivi.</p>
          {/* Bouton PDF */}
          <button onClick={handleDownloadPDF}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 mb-2">
            📄 Télécharger le récépissé PDF
          </button>
          <button onClick={() => { setSubmitted(false); setSelectedService(null); setFormData({}); }}
            className="w-full bg-[#1F5C99] text-white py-3 rounded-2xl font-bold">
            Nouvelle demande
          </button>
          <button onClick={() => onNavigate("suivi")}
            className="w-full mt-2 border border-[#1F5C99] text-[#1F5C99] py-3 rounded-2xl font-bold">
            Suivre ma demande
          </button>
        </div>
      </div>
    );
  }

  if (selectedService) {
    const service = services.find(s => s.id === selectedService)!;
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className={`${service.color} px-4 pt-10 pb-4 flex items-center gap-3`}>
          <button onClick={() => setSelectedService(null)} className="text-white/70">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <p className="text-white font-bold">{service.icon} {service.title}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {service.fields.map(field => (
            <div key={field.id}>
              <p className="text-xs font-semibold text-gray-600 mb-1">{field.label}</p>
              <input
                type="text"
                placeholder={field.placeholder}
                value={formData[field.id] || ""}
                onChange={e => setFormData(prev => ({ ...prev, [field.id]: e.target.value }))}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#1F5C99]"
              />
            </div>
          ))}
          <button
            onClick={() => handleSubmit(selectedService)}
            className={`w-full ${service.color} text-white py-3 rounded-2xl font-bold text-sm mt-4`}
          >
            Soumettre la demande
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-[#1F5C99] px-4 pt-10 pb-4">
        <p className="text-white font-bold text-lg">Services</p>
        <p className="text-white/60 text-xs">Choisissez un service</p>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-2">
        {services.map(s => (
          <button key={s.id} onClick={() => setSelectedService(s.id)}
            className="w-full bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm hover:shadow-md transition">
            <div className={`w-12 h-12 ${s.color} rounded-2xl flex items-center justify-center text-2xl shrink-0`}>
              {s.icon}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-gray-800">{s.title}</p>
              <p className="text-xs text-gray-400">{s.fields.length} champs requis</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── Ecran Suivi ───────────────────────────────────────────────────
function SuiviScreen() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<{ nom: string; type_document: string; statut: string; date_prevue: string; lieu_retrait: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [erreur, setErreur] = useState("");

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setErreur("");
    try {
      const res = await fetch("/api/formulaire", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "suivre", numero_suivi: query.trim() }),
      });
      const data = await res.json();
      if (data.success) setResult(data.demande);
      else setErreur("Demande introuvable. Vérifiez votre numéro.");
    } catch { setErreur("Erreur de connexion."); }
    finally { setLoading(false); }
  };

  const ETAPES = ["Reçue", "En cours", "Disponible", "Retirée"];
  const etapeIndex = result ? (result.statut === "soumise" ? 0 : result.statut === "en_traitement" ? 1 : result.statut === "prete" ? 2 : 3) : -1;

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-[#1F5C99] px-4 pt-10 pb-4">
        <p className="text-white font-bold text-lg">Suivi de demande</p>
        <p className="text-white/60 text-xs">Entrez votre numéro de suivi</p>
      </div>
      <div className="px-4 py-4 space-y-4">
        <div className="flex gap-2">
          <input
            type="text" value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSearch(); }}
            placeholder="Ex: DEM-2024-001"
            className="flex-1 bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#1F5C99]"
          />
          <button onClick={handleSearch}
            className="bg-[#1F5C99] text-white px-4 py-3 rounded-2xl font-bold text-sm">
            {loading ? "..." : "Chercher"}
          </button>
        </div>
        {erreur && <p className="text-red-500 text-sm text-center">{erreur}</p>}
        {result && (
          <div className="bg-white rounded-2xl shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-400">Demandeur</p>
                <p className="font-bold text-gray-800">{result.nom}</p>
                <p className="text-xs text-[#1F5C99]">{result.type_document?.replace(/_/g, " ")}</p>
              </div>
              <span className="bg-blue-100 text-blue-700 text-xs font-bold px-3 py-1 rounded-full">{result.statut}</span>
            </div>
            {/* Progression */}
            <div>
              <p className="text-xs text-gray-400 mb-3">Progression</p>
              <div className="flex items-center">
                {ETAPES.map((e, i) => (
                  <div key={e} className="flex items-center flex-1">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        i === etapeIndex ? "bg-[#1F5C99] text-white ring-4 ring-blue-100" :
                        i < etapeIndex ? "bg-green-500 text-white" : "bg-gray-100 text-gray-400"
                      }`}>{i < etapeIndex ? "✓" : i + 1}</div>
                      <p className={`text-[8px] mt-1 text-center max-w-[40px] ${i <= etapeIndex ? "text-[#1F5C99] font-bold" : "text-gray-400"}`}>{e}</p>
                    </div>
                    {i < ETAPES.length - 1 && <div className={`flex-1 h-0.5 mx-0.5 mb-4 ${i < etapeIndex ? "bg-green-400" : "bg-gray-200"}`} />}
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Clock className="w-3.5 h-3.5" />
                <span>Date prévue : <strong className="text-gray-700">{result.date_prevue}</strong></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <MapPin className="w-3.5 h-3.5" />
                <span>Retrait : <strong className="text-gray-700">{result.lieu_retrait}</strong></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Ecran Profil ──────────────────────────────────────────────────
function ProfilScreen({ compte, onLogin, onLogout, demandes }: {
  compte: CompteInfo | null;
  onLogin: (c: CompteInfo) => void;
  onLogout: () => void;
  demandes: Array<{ id: string; reference: string; type: string; statut: string; dateCreation: string }>;
}) {
  const [mode, setMode] = useState<"view" | "login">("view");
  const [form, setForm] = useState({ email: "", password: "" });
  const [erreur, setErreur] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true); setErreur("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (data.success) {
        onLogin({ ...data.compte, token: data.token });
        setMode("view");
      } else {
        setErreur(data.error || "Email ou mot de passe incorrect.");
      }
    } catch { setErreur("Erreur de connexion."); }
    finally { setLoading(false); }
  };

  if (mode === "login") {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-[#1F5C99] px-4 pt-10 pb-4 flex items-center gap-3">
          <button onClick={() => setMode("view")} className="text-white/70"><ArrowLeft className="w-5 h-5" /></button>
          <p className="text-white font-bold">Connexion</p>
        </div>
        <div className="flex-1 px-4 py-6 space-y-4">
          <div className="text-center mb-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <LogIn className="w-8 h-8 text-[#1F5C99]" />
            </div>
            <p className="text-sm text-gray-500">Connectez-vous à votre compte SunuBot</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Email</p>
            <input type="email" placeholder="votre@email.com" value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#1F5C99]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-600 mb-1">Mot de passe</p>
            <input type="password" placeholder="••••••" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 outline-none focus:border-[#1F5C99]" />
          </div>
          {erreur && <p className="text-red-500 text-xs text-center">{erreur}</p>}
          <button onClick={handleLogin} disabled={loading}
            className="w-full bg-[#1F5C99] text-white py-3 rounded-2xl font-bold disabled:opacity-50">
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </div>
      </div>
    );
  }

  if (compte) {
    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-[#1F5C99] px-4 pt-10 pb-8 flex flex-col items-center">
          <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center font-bold text-white text-xl mb-2">
            {compte.prenom[0]}
          </div>
          <p className="text-white font-bold">{compte.prenom} {compte.nom}</p>
          <p className="text-white/60 text-xs">{compte.email}</p>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {/* Mes demandes */}
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mes demandes</p>
          {demandes.length === 0 ? (
            <p className="text-xs text-gray-400 italic text-center py-4">Aucune demande</p>
          ) : (
            demandes.slice(0, 5).map((d, i) => (
              <div key={i} className="bg-white rounded-2xl p-3 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#1F5C99] font-mono">{d.reference}</p>
                  <p className="text-[11px] text-gray-600">{d.type}</p>
                  <p className="text-[10px] text-gray-400">{d.dateCreation}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                  d.statut === "VALIDE" ? "bg-green-100 text-green-700" :
                  d.statut === "EN_COURS" ? "bg-yellow-100 text-yellow-700" :
                  "bg-blue-100 text-blue-700"
                }`}>{d.statut}</span>
              </div>
            ))
          )}
          <button onClick={() => { onLogout(); }}
            className="w-full flex items-center justify-center gap-2 border border-red-200 text-red-500 py-3 rounded-2xl font-bold text-sm mt-2">
            <LogOut className="w-4 h-4" /> Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="bg-[#1F5C99] px-4 pt-10 pb-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl mb-2">👤</div>
        <p className="text-white font-bold">Mon Profil</p>
        <p className="text-white/60 text-xs">Connectez-vous pour accéder à vos demandes</p>
      </div>
      <div className="px-4 py-6 space-y-3">
        <button onClick={() => setMode("login")}
          className="w-full bg-[#1F5C99] text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2">
          <LogIn className="w-4 h-4" /> Se connecter
        </button>
        <button onClick={() => window.location.href = "/"}
          className="w-full border border-[#1F5C99] text-[#1F5C99] py-3 rounded-2xl font-bold flex items-center justify-center gap-2">
          <Phone className="w-4 h-4" /> Accéder au site complet
        </button>
        {[
          { icon: "🌐", label: "Langue : Français / Wolof" },
          { icon: "ℹ️", label: "À propos de SunuBot" },
        ].map((item, i) => (
          <div key={i} className="bg-white rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <span className="text-xl">{item.icon}</span>
            <p className="text-sm font-medium text-gray-700 flex-1">{item.label}</p>
            <ChevronRight className="w-4 h-4 text-gray-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── App principale ────────────────────────────────────────────────
export default function MobilePage() {
  const [screen, setScreen] = useState<Screen>("accueil");
  const [compte, setCompte] = useState<CompteInfo | null>(null);
  const [demandes, setDemandes] = useState<Array<{ id: string; reference: string; type: string; statut: string; dateCreation: string }>>([]);

  const chargerDemandes = async (token: string) => {
    try {
      const res = await fetch("/api/auth/demandes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.demandes) setDemandes(data.demandes);
    } catch {}
  };

  const handleLogin = (c: CompteInfo) => {
    setCompte(c);
    chargerDemandes(c.token);
  };

  const handleDemandeSubmitted = () => {
    if (compte) chargerDemandes(compte.token);
  };

  const renderScreen = () => {
    switch (screen) {
      case "accueil":  return <AccueilScreen onNavigate={(s) => setScreen(s)} />;
      case "chat":     return <ChatScreen onNavigate={(s) => setScreen(s)} />;
      case "services": return <ServicesScreen onNavigate={(s) => setScreen(s)} compte={compte} onSubmitted={handleDemandeSubmitted} />;
      case "suivi":    return <SuiviScreen />;
      case "profil":   return <ProfilScreen compte={compte} onLogin={handleLogin} onLogout={() => { setCompte(null); setDemandes([]); }} demandes={demandes} />;
      default:         return <AccueilScreen onNavigate={setScreen} />;
    }
  };

  const tabs = [
    { id: "accueil",  icon: Home,          label: "Accueil" },
    { id: "chat",     icon: MessageCircle, label: "Chat" },
    { id: "services", icon: FileText,      label: "Services" },
    { id: "suivi",    icon: Search,        label: "Suivi" },
    { id: "profil",   icon: User,          label: "Profil" },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      {/* Frame téléphone */}
      <div className="relative">
        {/* Contour téléphone */}
        <div className="absolute inset-0 bg-gray-800 rounded-[3rem] border-4 border-gray-700 shadow-2xl" />
        {/* Encoche */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-5 bg-gray-800 rounded-full z-10" />
        {/* Bouton power */}
        <div className="absolute -right-1.5 top-24 w-1 h-10 bg-gray-600 rounded-r-lg" />
        {/* Boutons volume */}
        <div className="absolute -left-1.5 top-20 w-1 h-8 bg-gray-600 rounded-l-lg" />
        <div className="absolute -left-1.5 top-32 w-1 h-8 bg-gray-600 rounded-l-lg" />

        {/* Ecran */}
        <div className="relative w-[340px] h-[700px] bg-gray-50 rounded-[2.8rem] overflow-hidden border-4 border-gray-700">
          {/* Status bar */}
          <div className="absolute top-0 left-0 right-0 h-8 bg-transparent z-20 flex items-center justify-between px-8 pt-1">
            <span className="text-[10px] font-bold text-gray-600">9:41</span>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-gray-600">●●●</span>
              <span className="text-[10px] text-gray-600">WiFi</span>
              <span className="text-[10px] text-gray-600">🔋</span>
            </div>
          </div>

          {/* Contenu */}
          <div className="absolute inset-0 pt-8 pb-16">
            {renderScreen()}
          </div>

          {/* Bottom navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around py-2 px-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setScreen(tab.id as Screen)}
                className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-xl transition-all ${
                  screen === tab.id ? "text-[#1F5C99]" : "text-gray-400"
                }`}
              >
                <tab.icon className={`w-5 h-5 ${screen === tab.id ? "stroke-2" : "stroke-1"}`} />
                <span className="text-[9px] font-medium">{tab.label}</span>
                {screen === tab.id && <div className="w-1 h-1 bg-[#1F5C99] rounded-full" />}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
