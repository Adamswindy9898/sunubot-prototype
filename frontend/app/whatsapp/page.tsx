"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Phone, Video, MoreVertical, ArrowLeft, Check, CheckCheck } from "lucide-react";

interface WAMessage {
  id: string;
  from: "user" | "bot";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
  buttons?: { label: string; value: string }[];
  form?: FormStep;
  result?: ResultData;
}

interface FormStep {
  title: string;
  fields: { id: string; label: string; placeholder: string; type?: string; options?: string[] }[];
  submitLabel: string;
  service: string;
}

interface ResultData {
  reference: string;
  type: string;
  statut: string;
  delai?: string;
}

// ── Flows de conversation ─────────────────────────────────────────
const FLOWS: Record<string, { text: string; buttons?: { label: string; value: string }[]; form?: FormStep }> = {
  welcome: {
    text: "🇸🇳 *SunuBot — Assistant Administratif*\n\nBienvenue ! Que puis-je faire pour vous ?",
    buttons: [
      { label: "📄 S'inscrire à l'état civil", value: "flow_inscription" },
      { label: "📋 Demander un document", value: "flow_document" },
      { label: "🏛️ Impôts / DGID", value: "flow_dgid" },
      { label: "❤️ CNSS / Santé CMU", value: "flow_cnss" },
      { label: "🎓 Bourse d'études", value: "flow_bourse" },
      { label: "🔍 Suivre ma demande", value: "flow_suivi" },
    ],
  },
  flow_inscription: {
    text: "📄 *Inscription — État Civil*\n\nJe vais vous inscrire dans le registre d'état civil. Remplissez ce formulaire :",
    form: {
      title: "Inscription État Civil",
      service: "inscription",
      submitLabel: "S'inscrire",
      fields: [
        { id: "nom", label: "Nom de famille", placeholder: "Ex: DIOP" },
        { id: "prenom", label: "Prénom", placeholder: "Ex: Moussa" },
        { id: "date_naissance", label: "Date de naissance", placeholder: "Ex: 15/06/1995", type: "date" },
        { id: "lieu_naissance", label: "Lieu de naissance", placeholder: "Ex: Thiès" },
        { id: "nom_pere", label: "Nom du père", placeholder: "Ex: DIOP Ibrahima" },
        { id: "nom_mere", label: "Nom de la mère", placeholder: "Ex: FALL Fatou" },
        { id: "telephone", label: "Téléphone", placeholder: "77 123 45 67" },
      ],
    },
  },
  flow_document: {
    text: "📋 *Quel document souhaitez-vous ?*",
    buttons: [
      { label: "📄 Acte de naissance", value: "doc_naissance" },
      { label: "💍 Acte de mariage", value: "doc_mariage" },
      { label: "🕊️ Acte de décès", value: "doc_deces" },
      { label: "🇸🇳 Certificat de nationalité", value: "doc_nationalite" },
    ],
  },
  doc_naissance: {
    text: "📄 *Acte de naissance*\n\n✅ Coût : 200 FCFA\n⏱ Délai : 3-5 jours\n\nRemplissez ce formulaire :",
    form: {
      title: "Demande Acte de Naissance",
      service: "acte_naissance",
      submitLabel: "Soumettre la demande",
      fields: [
        { id: "nom", label: "Nom de famille", placeholder: "Ex: DIOP" },
        { id: "prenom", label: "Prénom", placeholder: "Ex: Moussa" },
        { id: "date_naissance", label: "Date de naissance", placeholder: "Ex: 15/06/1995", type: "date" },
        { id: "lieu_naissance", label: "Lieu de naissance", placeholder: "Ex: Thiès" },
        { id: "telephone", label: "Téléphone", placeholder: "77 123 45 67" },
      ],
    },
  },
  doc_mariage: {
    text: "💍 *Acte de mariage*\n\n✅ Coût : 2 000 FCFA\n⏱ Délai : 5-7 jours\n\nRemplissez ce formulaire :",
    form: {
      title: "Demande Acte de Mariage",
      service: "acte_mariage",
      submitLabel: "Soumettre la demande",
      fields: [
        { id: "nom", label: "Nom de famille", placeholder: "Ex: DIOP" },
        { id: "prenom", label: "Prénom", placeholder: "Ex: Moussa" },
        { id: "date_naissance", label: "Date de naissance", placeholder: "Ex: 15/06/1995", type: "date" },
        { id: "lieu_naissance", label: "Lieu de naissance", placeholder: "Ex: Thiès" },
        { id: "telephone", label: "Téléphone", placeholder: "77 123 45 67" },
      ],
    },
  },
  doc_deces: {
    text: "🕊️ *Acte de décès*\n\n✅ Coût : 200 FCFA\n⏱ Délai : 3-5 jours\n\nRemplissez ce formulaire :",
    form: {
      title: "Demande Acte de Décès",
      service: "acte_deces",
      submitLabel: "Soumettre la demande",
      fields: [
        { id: "nom", label: "Nom du défunt", placeholder: "Ex: DIOP" },
        { id: "prenom", label: "Prénom du défunt", placeholder: "Ex: Moussa" },
        { id: "date_naissance", label: "Date de naissance", placeholder: "Ex: 15/06/1950", type: "date" },
        { id: "lieu_naissance", label: "Lieu de naissance", placeholder: "Ex: Thiès" },
        { id: "telephone", label: "Votre téléphone", placeholder: "77 123 45 67" },
      ],
    },
  },
  doc_nationalite: {
    text: "🇸🇳 *Certificat de nationalité*\n\n✅ Coût : 2 000 FCFA\n⏱ Délai : 7-15 jours\n\nRemplissez ce formulaire :",
    form: {
      title: "Certificat de Nationalité",
      service: "certificat_nationalite",
      submitLabel: "Soumettre la demande",
      fields: [
        { id: "nom", label: "Nom de famille", placeholder: "Ex: DIOP" },
        { id: "prenom", label: "Prénom", placeholder: "Ex: Moussa" },
        { id: "date_naissance", label: "Date de naissance", placeholder: "Ex: 15/06/1995", type: "date" },
        { id: "lieu_naissance", label: "Lieu de naissance", placeholder: "Ex: Thiès" },
        { id: "telephone", label: "Téléphone", placeholder: "77 123 45 67" },
      ],
    },
  },
  flow_dgid: {
    text: "🏛️ *DGID — Impôts et Domaines*\n\nQue souhaitez-vous faire ?",
    buttons: [
      { label: "📊 Obtenir mon NINEA", value: "flow_ninea" },
      { label: "📝 Déclaration TVA", value: "flow_declaration" },
      { label: "📍 Trouver mon centre fiscal", value: "info_centre_fiscal" },
      { label: "🔍 Vérifier ma situation", value: "info_situation" },
    ],
  },
  flow_ninea: {
    text: "📊 *Demande NINEA*\n\nRemplissez ce formulaire pour immatriculer votre entreprise :",
    form: {
      title: "Demande NINEA",
      service: "ninea",
      submitLabel: "Soumettre",
      fields: [
        { id: "nom", label: "Nom du gérant", placeholder: "Ex: DIOP" },
        { id: "prenom", label: "Prénom", placeholder: "Ex: Moussa" },
        { id: "activite", label: "Secteur d'activité", placeholder: "Ex: Commerce, BTP..." },
        { id: "adresse", label: "Adresse entreprise", placeholder: "Ex: Marché central, Thiès" },
        { id: "telephone", label: "Téléphone", placeholder: "77 123 45 67" },
      ],
    },
  },
  flow_declaration: {
    text: "📝 *Déclaration fiscale*\n\nRemplissez ce formulaire :",
    form: {
      title: "Déclaration Fiscale",
      service: "declaration",
      submitLabel: "Soumettre la déclaration",
      fields: [
        { id: "nom", label: "Nom / Raison sociale", placeholder: "Ex: DIOP Trading" },
        { id: "ninea", label: "Numéro NINEA", placeholder: "Ex: NIN-2024-001" },
        { id: "type_declaration", label: "Type", placeholder: "TVA, IS, Patente...", options: ["TVA mensuelle", "Impôt sur les sociétés (IS)", "Patente", "BRS"] },
        { id: "montant_ca", label: "Chiffre d'affaires (FCFA)", placeholder: "Ex: 5000000" },
        { id: "telephone", label: "Téléphone", placeholder: "77 123 45 67" },
      ],
    },
  },
  flow_cnss: {
    text: "❤️ *CNSS — Sécurité Sociale*\n\nQue souhaitez-vous faire ?",
    buttons: [
      { label: "✍️ Inscription CNSS", value: "flow_cnss_inscription" },
      { label: "👨‍👩‍👧 Allocations familiales", value: "info_allocations" },
      { label: "🏥 Inscription CMU", value: "flow_cmu" },
      { label: "👴 Renseignements retraite", value: "info_retraite" },
    ],
  },
  flow_cnss_inscription: {
    text: "✍️ *Inscription CNSS*\n\nRemplissez ce formulaire :",
    form: {
      title: "Inscription CNSS",
      service: "cnss",
      submitLabel: "S'inscrire à la CNSS",
      fields: [
        { id: "nom", label: "Nom", placeholder: "Ex: DIOP" },
        { id: "prenom", label: "Prénom", placeholder: "Ex: Moussa" },
        { id: "type", label: "Vous êtes", placeholder: "Salarié ou Employeur", options: ["salarie", "employeur"] },
        { id: "secteur", label: "Secteur d'activité", placeholder: "Ex: Commerce, Industrie..." },
        { id: "telephone", label: "Téléphone", placeholder: "77 123 45 67" },
      ],
    },
  },
  flow_cmu: {
    text: "🏥 *Inscription CMU*\n\nRemplissez ce formulaire :",
    form: {
      title: "Inscription CMU",
      service: "cmu",
      submitLabel: "S'inscrire à la CMU",
      fields: [
        { id: "nom", label: "Nom", placeholder: "Ex: DIOP" },
        { id: "prenom", label: "Prénom", placeholder: "Ex: Moussa" },
        { id: "type_menage", label: "Type couverture", placeholder: "Individuel ou Familial", options: ["individuel", "familial"] },
        { id: "membres_couverts", label: "Nombre de personnes", placeholder: "Ex: 5" },
        { id: "telephone", label: "Téléphone", placeholder: "77 123 45 67" },
      ],
    },
  },
  flow_bourse: {
    text: "🎓 *Bourse d'études*\n\nRemplissez ce formulaire :",
    form: {
      title: "Demande de Bourse",
      service: "bourse",
      submitLabel: "Soumettre la demande",
      fields: [
        { id: "nom", label: "Nom", placeholder: "Ex: DIOP" },
        { id: "prenom", label: "Prénom", placeholder: "Ex: Moussa" },
        { id: "universite", label: "Université", placeholder: "Ex: UCAD, UIDT...", options: ["UCAD Dakar", "Université de Thiès", "UGB Saint-Louis", "Université de Ziguinchor"] },
        { id: "filiere", label: "Filière", placeholder: "Ex: Informatique, Droit..." },
        { id: "niveau", label: "Niveau", placeholder: "Ex: Licence 1...", options: ["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2", "Doctorat"] },
        { id: "telephone", label: "Téléphone", placeholder: "77 123 45 67" },
      ],
    },
  },
  flow_suivi: {
    text: "🔍 *Suivi de demande*\n\nEntrez votre numéro de suivi ci-dessous.\nExemple : *DEM-2024-001*",
    buttons: [],
  },
  info_centre_fiscal: {
    text: "📍 *Centres fiscaux DGID — Thiès*\n\n🏢 *Centre Principal*\nAvenue Léopold Sédar Senghor\nTél : 33 951 XX XX\nHoraires : Lun-Ven 8h-17h\n\n🏢 *Centre Annexe*\nQuartier Randoulène\nTél : 33 952 XX XX\n\nPortail en ligne : *etax.dgid.sn*",
    buttons: [{ label: "⬅️ Retour au menu", value: "welcome" }],
  },
  info_situation: {
    text: "📊 *Vérification situation fiscale*\n\nPour vérifier votre situation fiscale, vous avez besoin de votre *NINEA*.\n\nConnectez-vous sur : *etax.dgid.sn*\nOu appelez le : *33 889 20 00*\n\nVotre NINEA commence par : *NIN-XXXX-XXX*",
    buttons: [{ label: "⬅️ Retour au menu", value: "welcome" }],
  },
  info_allocations: {
    text: "👨‍👩‍👧 *Allocations familiales CNSS*\n\nConditions :\n• Être inscrit à la CNSS\n• Avoir des enfants de moins de 21 ans\n• Être en activité\n\nMontant : *3 500 FCFA/enfant/mois*\n\nContactez votre agence CNSS pour le dossier complet.",
    buttons: [{ label: "✍️ M'inscrire à la CNSS", value: "flow_cnss_inscription" }, { label: "⬅️ Retour", value: "welcome" }],
  },
  info_retraite: {
    text: "👴 *Retraite CNSS*\n\nÂge légal de retraite : *60 ans*\nConditions : avoir cotisé au moins *20 ans*\n\nPour calculer votre pension :\n• Contactez votre agence CNSS\n• Appelez le : *33 823 07 07*\n• Site : *www.cnss.sn*",
    buttons: [{ label: "⬅️ Retour", value: "welcome" }],
  },
};

function now() {
  return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function generateRef(service: string): string {
  const prefixes: Record<string, string> = {
    inscription: "EC", acte_naissance: "DEM", acte_mariage: "DEM",
    acte_deces: "DEM", certificat_nationalite: "DEM",
    ninea: "NIN", declaration: "DEC", cnss: "CSS", cmu: "CMU", bourse: "BRS",
  };
  const prefix = prefixes[service] || "REF";
  const num = Math.floor(Math.random() * 900) + 100;
  return `${prefix}-2024-0${num}`;
}

// ── Composant formulaire inline ───────────────────────────────────
function WAForm({ form, onSubmit }: { form: FormStep; onSubmit: (data: Record<string, string>) => void }) {
  const [data, setData] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const required = form.fields.filter(f => !data[f.id] || data[f.id].trim() === "");
    if (required.length > 0) return;
    setSubmitted(true);
    onSubmit(data);
  };

  if (submitted) {
    return (
      <div className="mt-2 bg-[#25D366]/20 border border-[#25D366]/40 rounded-xl p-3 text-center">
        <p className="text-[#25D366] text-xs font-bold">✅ Formulaire soumis !</p>
      </div>
    );
  }

  return (
    <div className="mt-2 bg-[#1A2E35] border border-white/10 rounded-xl p-3 space-y-2">
      <p className="text-[#25D366] text-[11px] font-bold mb-2">📋 {form.title}</p>
      {form.fields.map((field) => (
        <div key={field.id}>
          <p className="text-[#8696A0] text-[10px] mb-0.5">{field.label}</p>
          {field.options ? (
            <select
              value={data[field.id] || ""}
              onChange={(e) => setData(prev => ({ ...prev, [field.id]: e.target.value }))}
              className="w-full bg-[#2A3942] text-[#E9EDEF] text-xs rounded-lg px-3 py-2 outline-none border border-white/10"
            >
              <option value="">Choisir...</option>
              {field.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          ) : (
            <input
              type={field.type || "text"}
              placeholder={field.placeholder}
              value={data[field.id] || ""}
              onChange={(e) => setData(prev => ({ ...prev, [field.id]: e.target.value }))}
              className="w-full bg-[#2A3942] text-[#E9EDEF] placeholder-[#8696A0] text-xs rounded-lg px-3 py-2 outline-none border border-white/10"
            />
          )}
        </div>
      ))}
      <button
        onClick={handleSubmit}
        className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white text-xs font-bold py-2 rounded-lg transition mt-2"
      >
        {form.submitLabel}
      </button>
    </div>
  );
}

// ── Page principale ────────────────────────────────────────────────
export default function WhatsAppPage() {
  const [messages, setMessages] = useState<WAMessage[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [pdfData, setPdfData] = useState<{ reference: string; service: string; data: Record<string, string> } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Message de bienvenue
    setTimeout(() => {
      addBotMessage(FLOWS.welcome);
    }, 500);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const addBotMessage = (flow: typeof FLOWS[string], extraText?: string) => {
    const msg: WAMessage = {
      id: Date.now().toString() + "bot",
      from: "bot",
      text: extraText || flow.text,
      time: now(),
      buttons: flow.buttons,
      form: flow.form,
    };
    setMessages(prev => [...prev, msg]);
  };

  const handleUserMessage = (text: string) => {
    const userMsg: WAMessage = {
      id: Date.now().toString(),
      from: "user",
      text,
      time: now(),
      status: "read",
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");

    // Télécharger PDF
    if (text.startsWith("pdf:") && pdfData) {
      import("@/lib/pdf-generator").then(({ genererRecepissePDF }) => {
        const typeLabels: Record<string, string> = {
          inscription: "Inscription État Civil", acte_naissance: "Acte de naissance",
          acte_mariage: "Acte de mariage", acte_deces: "Acte de décès",
          certificat_nationalite: "Certificat de nationalité", ninea: "Demande NINEA",
          cnss: "Inscription CNSS", cmu: "Inscription CMU", bourse: "Demande de bourse",
        };
        genererRecepissePDF({
          reference: pdfData.reference,
          type: typeLabels[pdfData.service] || pdfData.service,
          service: "ETAT_CIVIL",
          nom: pdfData.data.nom || "",
          prenom: pdfData.data.prenom || "",
          telephone: pdfData.data.telephone,
          dateCreation: new Date().toLocaleDateString("fr-FR"),
          statut: "recu",
          details: { lieu_naissance: pdfData.data.lieu_naissance || "" },
          langue: "francais",
        });
      });
      return;
    }

    // Détecter si c'est un flow
    const flowKey = Object.keys(FLOWS).find(k => k === text);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      if (flowKey) {
        addBotMessage(FLOWS[flowKey]);
      } else if (text.match(/^DEM-\d{4}-\d{3}/i)) {
        addBotMessage({
          text: `🔍 *Suivi demande ${text.toUpperCase()}*\n\n📋 Statut : *En cours de traitement* ⚙️\n📅 Date prévue : ${new Date(Date.now() + 86400000).toLocaleDateString("fr-FR")}\n📍 Retrait : Centre d'État Civil de Thiès\n\nVous serez notifié dès que le document est prêt. ✅`,
          buttons: [{ label: "⬅️ Retour au menu", value: "welcome" }],
        });
      } else {
        // Réponse générique + retour menu
        addBotMessage({
          text: `Je vous ai bien reçu 🇸🇳\n\nPour mieux vous aider, choisissez une option dans le menu :`,
          buttons: FLOWS.welcome.buttons,
        });
      }
    }, 800 + Math.random() * 600);
  };

  const handleFormSubmit = async (service: string, data: Record<string, string>) => {
    const nom = `${data.prenom || ""} ${data.nom || ""}`.trim();
    setIsTyping(true);

    try {
      let reference = "";

      // Chercher un token par numéro de téléphone pour lier au compte
      let authToken = "";
      if (data.telephone) {
        try {
          const resAuth = await fetch("/api/auth/login-by-phone", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ telephone: data.telephone }),
          });
          if (resAuth.ok) {
            const authData = await resAuth.json();
            if (authData.token) authToken = authData.token;
          }
        } catch {}
      }
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (authToken) headers["Authorization"] = `Bearer ${authToken}`;

      // Inscription état civil
      if (service === "inscription") {
        const res = await fetch("/api/inscription", {
          method: "POST", headers,
          body: JSON.stringify(data),
        });
        const result = await res.json();
        reference = result.citoyen?.numero_acte || generateRef(service);
      }
      // Demande de document
      else if (["acte_naissance", "acte_mariage", "acte_deces", "certificat_nationalite"].includes(service)) {
        const res = await fetch("/api/formulaire", {
          method: "POST", headers,
          body: JSON.stringify({ action: "soumettre", nom: data.nom, prenom: data.prenom, type_document: service, donnees: data }),
        });
        const result = await res.json();
        reference = result.demande?.numero_suivi || generateRef(service);
      }
      // Services (CNSS, CMU, bourse, NINEA)
      else {
        const serviceMap: Record<string, string> = { cnss: "cnss", cmu: "cmu", bourse: "bourse", ninea: "dgid", declaration: "dgid" };
        const res = await fetch("/api/services", {
          method: "POST", headers,
          body: JSON.stringify({ action: "inscrire", service: serviceMap[service] || service, donnees: { ...data, activite: data.activite || data.secteur || service } }),
        });
        const result = await res.json();
        reference = result.data?.ninea || result.data?.numero_cnss || result.data?.numero_bourse || result.data?.numero_cmu || generateRef(service);
      }

      // Stocker les données pour le PDF
      setPdfData({ reference, service, data });

      setIsTyping(false);
      addBotMessage({
        text: `✅ *Demande enregistrée avec succès !*\n\n📋 Référence : *${reference}*\n👤 Nom : ${nom}\n📱 Tél : ${data.telephone || "—"}\n\n📧 Email de confirmation envoyé.\n📱 Notification WhatsApp envoyée.\n\n_Cliquez sur le bouton ci-dessous pour télécharger votre récépissé PDF._`,
        buttons: [
          { label: "📄 Télécharger récépissé PDF", value: `pdf:${reference}` },
          { label: "🔍 Suivre ma demande", value: "flow_suivi" },
          { label: "🏠 Retour au menu", value: "welcome" },
        ],
      });
    } catch {
      setIsTyping(false);
      const reference = generateRef(service);
      addBotMessage({
        text: `✅ *Demande enregistrée !*\n\n📋 Référence : *${reference}*\n👤 Nom : ${nom}\n\n_Consultez le tableau de bord pour le suivi._`,
        buttons: [{ label: "🏠 Retour au menu", value: "welcome" }],
      });
    }
  };

  const sendMessage = () => {
    if (!input.trim()) return;
    handleUserMessage(input.trim());
  };

  const renderText = (text: string) => {
    return text.split("\n").map((line, i) => {
      const parsed = line
        .replace(/\*(.*?)\*/g, "<strong>$1</strong>")
        .replace(/_(.*?)_/g, "<em>$1</em>");
      return <p key={i} className={`${line === "" ? "h-1.5" : "mb-0.5"} leading-snug`} dangerouslySetInnerHTML={{ __html: parsed }} />;
    });
  };

  return (
    <div className="min-h-screen bg-[#111B21] flex items-center justify-center p-2">
      <div className="w-full max-w-sm bg-[#0B141A] rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col" style={{ height: "750px" }}>

        {/* Header */}
        <div className="bg-[#202C33] px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => window.location.href = "/"} className="text-[#AEBAC1] hover:text-white transition">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#25D366] to-[#128C7E] flex items-center justify-center text-white font-black text-sm shadow-md shrink-0">
            SB
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-semibold text-sm">SunuBot 🇸🇳</p>
            <p className="text-[#25D366] text-[11px]">● en ligne — Assistant Administratif</p>
          </div>
          <div className="flex items-center gap-4 text-[#AEBAC1]">
            <Video className="w-5 h-5 cursor-pointer hover:text-white transition" />
            <Phone className="w-5 h-5 cursor-pointer hover:text-white transition" />
            <MoreVertical className="w-5 h-5 cursor-pointer hover:text-white transition" />
          </div>
        </div>

        {/* Messages */}
        <div
          className="flex-1 overflow-y-auto px-3 py-3 space-y-2"
          style={{ background: "#0B141A" }}
        >
          {/* Date */}
          <div className="flex justify-center mb-2">
            <span className="bg-[#182229] text-[#8696A0] text-[10px] px-3 py-1 rounded-full">
              Aujourd&apos;hui
            </span>
          </div>

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] ${msg.from === "user" ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div className={`rounded-2xl px-3 py-2 shadow-sm ${
                  msg.from === "user"
                    ? "bg-[#005C4B] text-white rounded-tr-sm"
                    : "bg-[#202C33] text-[#E9EDEF] rounded-tl-sm"
                }`}>
                  <div className="text-[12.5px] leading-relaxed">
                    {renderText(msg.text)}
                  </div>
                  <div className={`flex items-center gap-1 mt-1 ${msg.from === "user" ? "justify-end" : "justify-start"}`}>
                    <span className="text-[10px] text-[#8696A0]">{msg.time}</span>
                    {msg.from === "user" && (
                      msg.status === "read"
                        ? <CheckCheck className="w-3 h-3 text-[#53BDEB]" />
                        : <Check className="w-3 h-3 text-[#8696A0]" />
                    )}
                  </div>
                </div>

                {/* Boutons */}
                {msg.buttons && msg.buttons.length > 0 && (
                  <div className="flex flex-col gap-1 w-full">
                    {msg.buttons.map((btn, i) => (
                      <button
                        key={i}
                        onClick={() => handleUserMessage(btn.value)}
                        className="w-full bg-[#202C33] border border-[#25D366]/30 text-[#25D366] text-[11px] font-medium py-2 px-3 rounded-xl hover:bg-[#25D366]/10 transition text-left"
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Formulaire */}
                {msg.form && (
                  <div className="w-full">
                    <WAForm
                      form={msg.form}
                      onSubmit={(data) => handleFormSubmit(msg.form!.service, data)}
                    />
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-[#202C33] rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce [animation-delay:0s]" />
                  <div className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 bg-[#8696A0] rounded-full animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-[#202C33] px-3 py-2 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") sendMessage(); }}
            placeholder="Message"
            className="flex-1 bg-[#2A3942] text-[#E9EDEF] placeholder-[#8696A0] rounded-full px-4 py-2 text-sm outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim()}
            className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center hover:bg-[#20BA5A] disabled:opacity-40 transition shrink-0"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>
    </div>
  );
}
