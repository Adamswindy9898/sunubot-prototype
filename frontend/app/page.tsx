"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Globe, FileText, Building2, Heart, GraduationCap, HelpCircle, LogIn, Shield, History, Moon, Sun } from "lucide-react";
import ChatMessage from "@/components/ChatMessage";
import ChatForm, { CitizenInfo, SubmissionResult, QuickSearch, DocumentGuideInfo, SuiviDemande } from "@/components/ChatForm";
import AuthModal, { Dashboard, type ComptePublic } from "@/components/AuthModal";
import { useAuth } from "@/lib/auth-context";
import VoiceInput, { TTSButton, TranslationHint } from "@/components/VoiceInput";
import GeoMap from "@/components/GeoMap";
import SatisfactionForm from "@/components/SatisfactionForm";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  langue?: string;
  tools_used?: string[];
  timestamp: Date;
  // Composants interactifs
  component?: "form" | "citizen_info" | "submission_result" | "search" | "doc_choice" | "menu_choice" | "suivi";
  componentData?: Record<string, unknown>;
}

const GUIDE_NINEA = {
  titre: "NINEA — Numéro d'Identification National des Entreprises et Associations",
  utilite: [
    "Obligatoire pour immatriculer une entreprise au Sénégal",
    "Requis pour ouvrir un compte bancaire professionnel",
    "Nécessaire pour effectuer des déclarations fiscales (TVA, IS, patente...)",
    "Indispensable pour signer des contrats avec l'État",
  ],
  utilite_wolof: [
    "War la ngir bind sa entreprise ci Sénégal",
    "Soxor ko ngir ubbi compte bancaire ci liggéey",
    "War la ngir bind déclarations fiscales yi (TVA, IS...)",
    "War la ngir sign contrats ak État bi",
  ],
  delai: "1 à 3 jours ouvrés",
  cout: "Gratuit",
  etapes: [
    { numero: 1, titre: "Remplir le formulaire", description: "Complétez le formulaire électronique avec vos informations personnelles et celles de votre activité." },
    { numero: 2, titre: "Uploader votre CNI", description: "Joignez une copie numérique de votre Carte Nationale d'Identité (format PDF ou image)." },
    { numero: 3, titre: "Soumettre la demande", description: "Envoyez votre dossier. Vous recevrez un numéro de suivi immédiatement." },
    { numero: 4, titre: "Recevoir le NINEA", description: "Le NINEA est délivré sous 1 à 3 jours ouvrés après validation du dossier complet." },
  ],
  pieces_requises: [
    { nom: "Carte Nationale d'Identité (CNI)", nom_wolof: "Kàrt boppam (CNI)", obligatoire: true },
    { nom: "Registre de Commerce (RCCM) si entreprise", nom_wolof: "Registre de commerce (su am entreprise)", obligatoire: false },
    { nom: "Statuts de la société (si personne morale)", nom_wolof: "Statuts société bi", obligatoire: false },
  ],
};

const GUIDE_ETAT_CIVIL: DocumentGuideInfo = {
  titre: "Acte de naissance — État Civil",
  utilite: [
    "Pièce d'identité fondamentale pour tout citoyen sénégalais",
    "Requis pour l'inscription scolaire, le mariage, le passeport",
    "Nécessaire pour les démarches CNSS, DGID et CMU",
  ],
  utilite_wolof: [
    "Papye bu njëkk bu identity ngir nit ku Sénégalais",
    "Soxor ko ngir njang, takk, ak passeport",
    "War la ngir CNSS, DGID ak CMU",
  ],
  delai: "3 à 5 jours ouvrables",
  cout: "200 FCFA (timbre fiscal)",
  etapes: [
    { numero: 1, titre: "Vérifier votre inscription", description: "Entrez votre nom pour vérifier si vous êtes déjà dans les registres d'état civil." },
    { numero: 2, titre: "Remplir le formulaire", description: "Si vous n'êtes pas encore enregistré, complétez le formulaire d'inscription." },
    { numero: 3, titre: "Uploader votre pièce d'identité", description: "Joignez une copie de votre CNI ou passeport en cours de validité." },
    { numero: 4, titre: "Retirer le document", description: "Récupérez votre acte au centre d'état civil de votre commune dans le délai indiqué." },
  ],
  pieces_requises: [
    { nom: "Ancienne pièce d'identité ou passeport", nom_wolof: "Kàrt boppam walla passeport", obligatoire: true },
    { nom: "Ancien acte (si disponible)", nom_wolof: "Kàrt bu yàgg (su am)", obligatoire: false },
    { nom: "Timbre fiscal 200 FCFA", nom_wolof: "Timbre fiscal 200 FCFA", obligatoire: true },
  ],
};

const GUIDE_CNSS: DocumentGuideInfo = {
  titre: "Inscription CNSS — Caisse Nationale de Sécurité Sociale",
  utilite: [
    "Accès aux allocations familiales pour vos enfants",
    "Couverture accident du travail et maladie professionnelle",
    "Droit à la retraite après cotisation",
    "Protection sociale obligatoire pour tout salarié",
  ],
  utilite_wolof: [
    "Jël allocations familiales ngir sa doom yi",
    "Couverture accident ci liggéey",
    "Droit ci retraite gannaaw cotisation",
    "Protection sociale war la ngir liggéeykaat",
  ],
  delai: "15 jours ouvrables",
  cout: "Gratuit",
  etapes: [
    { numero: 1, titre: "Remplir le formulaire", description: "Indiquez votre statut (salarié ou employeur) et vos informations." },
    { numero: 2, titre: "Joindre les pièces", description: "Uploader CNI + contrat de travail (salarié) ou NINEA + RCCM (employeur)." },
    { numero: 3, titre: "Soumettre", description: "Envoyez le dossier. L'employeur peut aussi faire la démarche pour le salarié." },
    { numero: 4, titre: "Recevoir le numéro CNSS", description: "Votre numéro CNSS vous sera attribué sous 15 jours ouvrables." },
  ],
  pieces_requises: [
    { nom: "Carte Nationale d'Identité", nom_wolof: "Kàrt boppam (CNI)", obligatoire: true },
    { nom: "Contrat de travail (si salarié)", nom_wolof: "Contrat liggéey", obligatoire: false },
    { nom: "NINEA + RCCM (si employeur)", nom_wolof: "NINEA + Registre de commerce", obligatoire: false },
  ],
};

const SERVICES = [
  {
    icon: FileText,
    label_fr: "Etat Civil",
    label_wo: "Kart yi",
    color: "from-blue-500 to-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    shortcuts_fr: [
      { label: "S'inscrire", message: "Je veux m'inscrire" },
      { label: "Acte de naissance", message: "Je veux mon acte de naissance" },
      { label: "Acte de mariage", message: "Je veux mon acte de mariage" },
      { label: "Renouveler ma CNI", message: "Je veux renouveler ma carte d'identite" },
      { label: "Suivre ma demande", message: "Suivre ma demande" },
    ],
    shortcuts_wo: [
      { label: "Bind", message: "Dama begg bind" },
      { label: "Kart becceg", message: "Dama begg sama kart becceg" },
      { label: "Kart takk", message: "Dama begg sama kart takk" },
      { label: "Renouveler CNI", message: "Dama begg renouveler sama kart boppam" },
      { label: "Topp demande", message: "Dama begg topp sama demande" },
    ],
  },
  {
    icon: Building2,
    label_fr: "NINEA — Registre commerce",
    label_wo: "NINEA (Bind entreprise)",
    color: "from-amber-500 to-orange-500",
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    shortcuts_fr: [
      { label: "Obtenir mon NINEA", message: "Je veux obtenir un NINEA pour mon entreprise" },
      { label: "Consulter mon NINEA", message: "Je veux consulter mon NINEA" },
    ],
    shortcuts_wo: [
      { label: "Laaj NINEA", message: "Dama begg NINEA ngir sama entreprise" },
      { label: "Seetal sama NINEA", message: "Dama begg seetal sama NINEA" },
    ],
  },
  {
    icon: Building2,
    label_fr: "Impots / DGID",
    label_wo: "Wàll / DGID",
    color: "from-orange-600 to-red-500",
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    shortcuts_fr: [
      { label: "Payer mes impots", message: "Comment payer mes impots a la DGID ?" },
      { label: "Declaration TVA", message: "Je veux faire ma declaration TVA" },
      { label: "Mon centre fiscal", message: "Ou se trouve mon centre fiscal ?" },
      { label: "Situation fiscale", message: "Je veux verifier ma situation fiscale" },
    ],
    shortcuts_wo: [
      { label: "Fey wall bi", message: "Naka laa feyee sama wall ci DGID ?" },
      { label: "Declaration TVA", message: "Dama begg def sama declaration TVA" },
      { label: "Centre fiscal", message: "Fan la centre fiscal bi nekk ?" },
    ],
  },
  {
    icon: Heart,
    label_fr: "CNSS",
    label_wo: "CNSS (Securite sociale)",
    color: "from-red-500 to-pink-500",
    bg: "bg-red-50",
    border: "border-red-200",
    text: "text-red-700",
    shortcuts_fr: [
      { label: "Inscription CNSS", message: "Je veux m'inscrire a la CNSS" },
      { label: "Consulter mon compte", message: "Je veux consulter mon compte CNSS" },
      { label: "Allocations familiales", message: "Comment obtenir les allocations familiales ?" },
    ],
    shortcuts_wo: [
      { label: "Bind ci CNSS", message: "Dama begg bind ci CNSS" },
      { label: "Seetal sama compte", message: "Dama begg seetal sama compte CNSS" },
      { label: "Allocations", message: "Naka laa am allocations familiales?" },
    ],
  },
  {
    icon: GraduationCap,
    label_fr: "Education",
    label_wo: "Njang",
    color: "from-green-500 to-emerald-500",
    bg: "bg-green-50",
    border: "border-green-200",
    text: "text-green-700",
    shortcuts_fr: [
      { label: "Demande de bourse", message: "Je veux m'inscrire pour une bourse d'etudes" },
      { label: "Consulter ma bourse", message: "Je veux consulter ma bourse" },
    ],
    shortcuts_wo: [
      { label: "Laaj bourse", message: "Dama begg bourse njang" },
      { label: "Seetal sama bourse", message: "Dama begg seetal sama bourse" },
    ],
  },
  {
    icon: HelpCircle,
    label_fr: "Sante / CMU",
    label_wo: "Wer gi / CMU",
    color: "from-purple-500 to-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    shortcuts_fr: [
      { label: "Inscription CMU", message: "Je veux m'inscrire a la CMU" },
      { label: "Consulter ma carte", message: "Je veux consulter ma carte CMU" },
    ],
    shortcuts_wo: [
      { label: "Bind ci CMU", message: "Dama begg bind ci CMU" },
      { label: "Seetal sama kart CMU", message: "Dama begg seetal sama kart CMU" },
    ],
  },
];

// Traductions de l'interface
const UI_TEXT = {
  fr: {
    welcome: "Bienvenue sur SunuBot !",
    subtitle: "Votre assistant administratif multilingue",
    online: "En ligne - Francais / Wolof",
    placeholder: "Ecrivez votre message...",
    thinking: "SunuBot reflechit...",
    menu: "Menu principal",
    footer: "SunuBot - Assistant Administratif Multilingue (FR/Wolof) - Memoire M2 IA - Universite de Thies",
    hint: "Cliquez sur un raccourci ou ecrivez votre question ci-dessous",
    pieces: "Pieces requises",
    cout: "Cout",
    suivi: "Suivi demande",
    merci: "Merci",
    vocal: "Message vocal (bientot disponible)",
    wolof_section: "Parlez en wolof",
    wolof_desc: "Le bot comprend aussi le wolof !",
  },
  wo: {
    welcome: "Dalal jaamm ci SunuBot !",
    subtitle: "Sa ndimbalkat ci yoon wi - Wolof ak Francais",
    online: "Ngi ci ligne - Wolof / Francais",
    placeholder: "Bind sa laaj fii...",
    thinking: "SunuBot ngi xalaat...",
    menu: "Menu bu njekk",
    footer: "SunuBot - Ndimbalkat ci yoon wi (Wolof/FR) - Memoire M2 IA - Universite Thies",
    hint: "Teral ci raccourci walla bind sa laaj ci suuf",
    pieces: "Papye yi",
    cout: "Naata lay jar",
    suivi: "Topp demande",
    merci: "Jereejef",
    vocal: "Wax ak baat (dinaa am)",
    wolof_section: "Wax ci Francais",
    wolof_desc: "Bot bi degg na Francais itam !",
  },
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showServices, setShowServices] = useState(true);
  const [selectedLang, setSelectedLang] = useState<"auto" | "wolof" | "francais">("auto");
  const [currentLangue, setCurrentLangue] = useState<string>("francais");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auth
  const { compte, login, logout, ajouterDemande } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [showSatisfaction, setShowSatisfaction] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sunubot-dark");
    if (saved === "true") setDarkMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sunubot-dark", String(darkMode));
  }, [darkMode]);

  const handleAuthSuccess = (c: ComptePublic, token: string) => {
    login(c, token);
    setShowAuthModal(false);

    // Message de bienvenue avec confirmation notifications
    const isWolof = currentLangue === "wolof";
    const msg: Message = {
      id: Date.now().toString() + "auth",
      role: "assistant",
      content: isWolof
        ? `🎉 **Dalal jaamm, ${c.prenom} !**\n\nSa compte bind na ci jamm.\n\n📧 Email de bienvenue yonnee na ci **${c.email}**\n📱 WhatsApp notification yonnee na ci **${c.telephone}**\n\nLeegi man nga def sa demandes yi. Wax ma lan moo la bëgg!`
        : `🎉 **Bienvenue, ${c.prenom} !**\n\nVotre compte a été créé avec succès.\n\n📧 Un email de bienvenue a été envoyé à **${c.email}**\n📱 Une notification WhatsApp a été envoyée au **${c.telephone}**\n\nVous pouvez maintenant faire vos demandes administratives. Que souhaitez-vous ?`,
      timestamp: new Date(),
      langue: currentLangue,
      tools_used: ["creer_compte", "envoyer_email", "envoyer_whatsapp"],
    };
    setMessages((prev) => [...prev, msg]);
  };

  const handleLogout = async () => {
    await logout();
    setShowDashboard(false);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("chat-input")?.focus();
      }
      if (e.key === "Escape") {
        setInput("");
        (document.activeElement as HTMLElement)?.blur();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const addAssistantMessage = (content: string, extra?: Partial<Message>) => {
    const msg: Message = {
      id: Date.now().toString() + Math.random(),
      role: "assistant",
      content,
      timestamp: new Date(),
      langue: currentLangue,
      ...extra,
    };
    setMessages((prev) => [...prev, msg]);
    return msg;
  };

  const handleServiceInscription = async (service: string, data: Record<string, string>) => {
    // Vérifier si l'utilisateur est connecté avant de soumettre
    if (!compte) {
      const isWolof = currentLangue === "wolof";
      addAssistantMessage(
        isWolof
          ? "⚠️ **War nga connecter sa bopp gannaaw bu ngay man a bind !**\n\nNgir yonnee sa demande bi, war nga am compte.\n\n1. Teral ci **Connexion** ci kaw bi\n2. Bind walla connecter\n3. Gannaaw remplir formulaire bi kenn yeg\n\n_Sa informations yi dinañu leen sauvegarder ci sa espace._"
          : "⚠️ **Vous devez vous connecter pour soumettre une demande !**\n\nPour enregistrer votre inscription, vous devez avoir un compte.\n\n1. Cliquez sur **Connexion** en haut\n2. Inscrivez-vous ou connectez-vous\n3. Puis remplissez à nouveau le formulaire\n\n_Vos demandes seront sauvegardées dans votre espace personnel._",
        { tools_used: ["verifier_authentification"] }
      );
      setShowAuthModal(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "inscrire", service, donnees: data }),
      });
      const result = await res.json();

      if (result.success) {
        const d = result.data;
        const isWolof = currentLangue === "wolof";

        // Si c'est une déclaration fiscale → afficher le paiement simulé
        if (data.type_declaration) {
          const txnId = `TXN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9000) + 1000)}`;
          const montant = data.montant_ca ? `${Math.round(parseInt(data.montant_ca) * 0.18).toLocaleString()} FCFA` : "Calculé";
          const modePaiement = data.activite || "Orange Money";

          if (compte) {
            await ajouterDemande({
              type: `Déclaration ${data.type_declaration}`,
              service: "DGID",
              reference: d.ninea || d[Object.keys(d).find(k => k.includes("ninea")) || ""] || txnId,
              details: { periode: data.periode || "", montant, transaction: txnId },
            });
          }

          addAssistantMessage(
            isWolof
              ? `✅ **Sa déclaration bind na ci jamm !**\n\n📋 Type : ${data.type_declaration}\n📅 Periode : ${data.periode || "—"}\n💰 Montant TVA : **${montant}**\n\n---\n\n💳 **Paiement simulé**\nMode : ${modePaiement}\nTransaction : **${txnId}**\nStatut : ✅ Payé (simulation)\n\n📧 Récépissé yonnee na ci email.\n📱 Confirmation WhatsApp yonnee na.\n\n_Seetal sa espace personnel ngir topp._`
              : `✅ **Votre déclaration a été enregistrée avec succès !**\n\n📋 Type : ${data.type_declaration}\n📅 Période : ${data.periode || "—"}\n💰 Montant dû (TVA 18%) : **${montant}**\n\n---\n\n💳 **Paiement simulé**\nMode : ${modePaiement}\nN° transaction : **${txnId}**\nStatut : ✅ Payé (simulation)\n\n📧 Récépissé envoyé par email.\n📱 Confirmation WhatsApp envoyée.\n\n_Consultez votre espace personnel pour le suivi._`,
            {
              tools_used: ["declaration_fiscale", "simuler_paiement", "generer_recepisse"],
              component: "submission_result",
              componentData: {
                numero_suivi: txnId,
                delai: "Immédiat",
                lieu_retrait: "Centre fiscal DGID (ou téléchargement en ligne)",
                pdfData: {
                  type: `Déclaration ${data.type_declaration}`,
                  service: "DGID",
                  nom: data.nom || "",
                  prenom: data.prenom || "",
                  telephone: data.telephone,
                  details: { periode: data.periode || "", montant, transaction: txnId, ninea: data.ninea || "" },
                },
              },
            }
          );
          setIsLoading(false);
          return;
        }

        const labels: Record<string, { fr: string; wo: string; numField: string }> = {
          dgid: { fr: "Inscription DGID reussie ! Votre NINEA est", wo: "Inscription ci DGID jot na! Sa NINEA mooy", numField: "ninea" },
          cnss: { fr: "Inscription CNSS reussie ! Votre numero est", wo: "Inscription ci CNSS jot na! Sa numero mooy", numField: "numero_cnss" },
          bourse: { fr: "Demande de bourse enregistree ! Votre numero est", wo: "Sa demande bourse bind na! Sa numero mooy", numField: "numero_bourse" },
          cmu: { fr: "Inscription CMU reussie ! Votre numero est", wo: "Inscription ci CMU jot na! Sa numero mooy", numField: "numero_cmu" },
        };
        const lbl = labels[service];
        const numero = d[lbl.numField];

        // Sauvegarder dans le compte citoyen si connecté
        if (compte) {
          const serviceLabels: Record<string, string> = {
            dgid: "Immatriculation NINEA", cnss: "Inscription CNSS",
            bourse: "Demande de bourse", cmu: "Inscription CMU",
          };
          await ajouterDemande({
            type: serviceLabels[service] || service,
            service: service.toUpperCase(),
            reference: numero,
            details: { nom: d.nom, prenom: d.prenom },
          });
        }

        const serviceTypeLabels: Record<string, string> = {
          dgid: "Immatriculation NINEA", cnss: "Inscription CNSS",
          bourse: "Demande de bourse d'études", cmu: "Inscription CMU",
        };
        // Message 1 : succès + récépissé
        addAssistantMessage(
          isWolof
            ? `${lbl.wo} : **${numero}**\n\nTur : ${d.prenom} ${d.nom}\n\n✅ Demande sauvegardée.\n📧 Email de confirmation yonnee na.\n📱 WhatsApp notification yonnee na.`
            : `${lbl.fr} : **${numero}**\n\nNom : ${d.prenom} ${d.nom}\n\n✅ Demande enregistrée dans votre espace personnel.\n📧 Email de confirmation envoyé.\n📱 Notification WhatsApp envoyée.`,
          {
            tools_used: [`inscrire_${service}`, `generer_numero`],
            component: "submission_result",
            componentData: {
              numero_suivi: numero,
              delai: service === "cnss" ? "15 jours ouvrables" : service === "bourse" ? "30 jours" : "3 à 7 jours",
              lieu_retrait: service === "cnss" ? "Agence CNSS de votre région" : service === "bourse" ? "Ministère de l'Éducation" : service === "cmu" ? "Mutuelle de santé locale" : "Centre fiscal DGID",
              pdfData: {
                type: serviceTypeLabels[service] || service,
                service: service === "dgid" ? "NINEA" : service.toUpperCase(),
                nom: d.nom || "",
                prenom: d.prenom || "",
                telephone: d.telephone,
                details: { reference: numero, activite: d.activite || d.secteur || d.filiere || d.type_menage || "" },
              },
            },
          }
        );

        // Message 2 : menu principal
        setTimeout(() => {
          addAssistantMessage(
            isWolof
              ? "🏠 **Lan la bëgg def leegi ?** Teral ci bouton yi :"
              : "🏠 **Que souhaitez-vous faire maintenant ?** Cliquez sur votre choix :",
            {
              tools_used: ["menu_principal"],
              component: "menu_choice",
              componentData: {
                items: isWolof
                  ? [
                      { icon: "📋", label: "Laaj yeneen document", msg: "Je veux mon acte de naissance" },
                      { icon: "🔍", label: "Seetal sa demande", msg: "Je veux suivre ma demande" },
                      { icon: "📊", label: "Xam sa situation", msg: "Je veux consulter mon dossier" },
                      { icon: "✍️", label: "Bind ci yeneen service", msg: "Je veux m'inscrire" },
                    ]
                  : [
                      { icon: "📋", label: "Demander un document", msg: "Je veux mon acte de naissance" },
                      { icon: "🔍", label: "Suivre ma demande", msg: "Je veux suivre ma demande" },
                      { icon: "📊", label: "Consulter mon dossier", msg: "Je veux consulter mon dossier" },
                      { icon: "✍️", label: "S'inscrire à un service", msg: "Je veux m'inscrire" },
                    ],
              },
            }
          );
        }, 800);
      } else {
        addAssistantMessage(result.error || "Erreur lors de l'inscription.");
      }
    } catch {
      addAssistantMessage("Erreur de connexion. Veuillez reessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsulterNumero = async (numero: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rechercher_numero", query: numero }),
      });
      const result = await res.json();

      if (result.found) {
        const d = result.data;
        const isWolof = currentLangue === "wolof";
        let info = "";

        if (result.type === "dgid") {
          info = isWolof
            ? `**NINEA / DGID — Sa informations yi :**\n\n> Ce numero (NIN-...) correspond a un NINEA d'entreprise, pas a une bourse ou un compte CNSS.\n\nNINEA : ${d.ninea}\nTur : ${d.prenom} ${d.nom}\nActivite : ${d.activite}\nRegime : ${d.regime_fiscal}\nCentre fiscal : ${d.centre_fiscal}\nStatut : ${d.statut}\nChiffre d'affaires : ${d.chiffre_affaires}`
            : `**NINEA / DGID — Vos informations :**\n\n> Ce numero (NIN-...) est un **NINEA d'entreprise** (Direction des Impots). Si vous cherchez votre bourse, votre numero commence par **BRS-**. Si c'est votre CNSS, il commence par **CSS-**.\n\nNINEA : ${d.ninea}\nNom : ${d.prenom} ${d.nom}\nActivite : ${d.activite}\nRegime fiscal : ${d.regime_fiscal}\nCentre fiscal : ${d.centre_fiscal}\nStatut : ${d.statut}\nChiffre d'affaires : ${d.chiffre_affaires}`;
        } else if (result.type === "cnss") {
          info = isWolof
            ? `**CNSS — Sa informations yi :**\n\nNumero : ${d.numero_cnss}\nTur : ${d.prenom} ${d.nom}\nType : ${d.type}\nSecteur : ${d.secteur}\nStatut : ${d.statut}\nPrestations : ${d.prestations.join(", ")}`
            : `**CNSS — Vos informations :**\n\nNumero : ${d.numero_cnss}\nNom : ${d.prenom} ${d.nom}\nType : ${d.type}\nSecteur : ${d.secteur}\nStatut : ${d.statut}\nPrestations : ${d.prestations.join(", ")}`;
        } else if (result.type === "bourse") {
          info = isWolof
            ? `**Bourse — Sa informations yi :**\n\nNumero : ${d.numero_bourse}\nTur : ${d.prenom} ${d.nom}\nUniversite : ${d.universite}\nFiliere : ${d.filiere}\nNiveau : ${d.niveau}\nMontant : ${d.montant_mensuel}/weer\nStatut : ${d.statut}`
            : `**Bourse — Vos informations :**\n\nNumero : ${d.numero_bourse}\nNom : ${d.prenom} ${d.nom}\nUniversite : ${d.universite}\nFiliere : ${d.filiere}\nNiveau : ${d.niveau}\nMontant : ${d.montant_mensuel}/mois\nStatut : ${d.statut}`;
        } else if (result.type === "cmu") {
          info = isWolof
            ? `**CMU — Sa informations yi :**\n\nNumero : ${d.numero_cmu}\nTur : ${d.prenom} ${d.nom}\nType : ${d.type_menage}\nMembres : ${d.membres_couverts}\nMutuelle : ${d.mutuelle}\nCotisation : ${d.cotisation_annuelle}/at\nStatut : ${d.statut}`
            : `**CMU — Vos informations :**\n\nNumero : ${d.numero_cmu}\nNom : ${d.prenom} ${d.nom}\nType : ${d.type_menage}\nMembres couverts : ${d.membres_couverts}\nMutuelle : ${d.mutuelle}\nCotisation : ${d.cotisation_annuelle}/an\nStatut : ${d.statut}`;
        }

        addAssistantMessage(info, { tools_used: [`consulter_${result.type}`, "get_informations"] });
      } else {
        const isWolof = currentLangue === "wolof";
        addAssistantMessage(
          isWolof
            ? "Gisuma numero bii ci systeme bi. Seetal ndax bind nga ko bu baax."
            : "Ce numero n'a pas ete trouve dans le systeme. Verifiez qu'il est correct.",
          { tools_used: ["rechercher_numero"] }
        );
      }
    } catch {
      addAssistantMessage("Erreur de connexion.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInscription = async (data: Record<string, string>) => {
    if (!compte) {
      const isWolof = currentLangue === "wolof";
      addAssistantMessage(
        isWolof
          ? "⚠️ **War nga connecter sa bopp gannaaw bu ngay man a bind !**\n\nTeral ci **Connexion** ci kaw bi, bind walla connecter, gannaaw remplir formulaire bi."
          : "⚠️ **Vous devez vous connecter pour vous inscrire !**\n\nCliquez sur **Connexion** en haut, créez un compte ou connectez-vous, puis soumettez le formulaire.",
        { tools_used: ["verifier_authentification"] }
      );
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();

      if (result.success) {
        const c = result.citoyen;
        const isWolof = currentLangue === "wolof";
        // Message 1 : confirmation inscription
        addAssistantMessage(
          isWolof
            ? `✅ **Inscription jot na!**\n\nNumero acte : **${c.numero_acte}**\nTur : ${c.prenom} ${c.nom}\nFu juddu : ${c.lieu_naissance}`
            : `✅ **Inscription réussie !**\n\nNuméro d'acte : **${c.numero_acte}**\nNom : ${c.prenom} ${c.nom}\nLieu de naissance : ${c.lieu_naissance}`,
          { tools_used: ["inscrire_citoyen", "generer_numero_acte"] }
        );
        // Message 2 : menu choix document (après délai court)
        setTimeout(() => {
          addAssistantMessage(
            isWolof
              ? "📋 **Lan mooy document bi bëgg nga laaj ?** Teral ci bouton yi :"
              : "📋 **Quel document souhaitez-vous demander ?** Cliquez sur votre choix :",
            {
              langue: isWolof ? "wolof" : "francais",
              tools_used: ["get_documents_disponibles"],
              component: "menu_choice",
              componentData: {
                items: isWolof
                  ? [
                      { icon: "📄", label: "Kàrt bëccëg", msg: "Kàrt bëccëg" },
                      { icon: "💍", label: "Kàrt takk", msg: "Kàrt takk" },
                      { icon: "🕊️", label: "Kàrt dee", msg: "Kàrt dee" },
                      { icon: "🇸🇳", label: "Certificat nationalité", msg: "Certificat nationalité" },
                    ]
                  : [
                      { icon: "📄", label: "Acte de naissance", msg: "Acte de naissance" },
                      { icon: "💍", label: "Acte de mariage", msg: "Acte de mariage" },
                      { icon: "🕊️", label: "Acte de décès", msg: "Acte de décès" },
                      { icon: "🇸🇳", label: "Certificat de nationalité", msg: "Certificat de nationalité" },
                    ],
              },
            }
          );
        }, 500);
      } else if (result.error === "Ce citoyen est deja enregistre") {
        const c = result.citoyen;
        const isWolof = currentLangue === "wolof";
        // Message 1 : déjà enregistré
        addAssistantMessage(
          isWolof
            ? `ℹ️ **Yaa ngi ci registre bi !**\n\nNumero acte : **${c.numero_acte}**\nTur : ${c.prenom} ${c.nom}`
            : `ℹ️ **Vous êtes déjà enregistré !**\n\nNuméro d'acte : **${c.numero_acte}**\nNom : ${c.prenom} ${c.nom}`,
          { tools_used: ["rechercher_citoyen"] }
        );
        // Message 2 : menu choix document
        setTimeout(() => {
          addAssistantMessage(
            isWolof
              ? "📋 **Lan mooy document bi bëgg nga laaj ?** Teral ci bouton yi :"
              : "📋 **Quel document souhaitez-vous demander ?** Cliquez sur votre choix :",
            {
              langue: isWolof ? "wolof" : "francais",
              tools_used: ["get_documents_disponibles"],
              component: "menu_choice",
              componentData: {
                items: isWolof
                  ? [
                      { icon: "📄", label: "Kàrt bëccëg", msg: "Kàrt bëccëg" },
                      { icon: "💍", label: "Kàrt takk", msg: "Kàrt takk" },
                      { icon: "🕊️", label: "Kàrt dee", msg: "Kàrt dee" },
                      { icon: "🇸🇳", label: "Certificat nationalité", msg: "Certificat nationalité" },
                    ]
                  : [
                      { icon: "📄", label: "Acte de naissance", msg: "Acte de naissance" },
                      { icon: "💍", label: "Acte de mariage", msg: "Acte de mariage" },
                      { icon: "🕊️", label: "Acte de décès", msg: "Acte de décès" },
                      { icon: "🇸🇳", label: "Certificat de nationalité", msg: "Certificat de nationalité" },
                    ],
              },
            }
          );
        }, 500);
      } else {
        addAssistantMessage(result.error || "Erreur lors de l'inscription.");
      }
    } catch {
      addAssistantMessage("Erreur de connexion. Veuillez reessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchCitoyen = async (query: string) => {
    // Verifier si c'est un numero de service
    if (query.match(/^(NIN|CSS|BRS|CMU)-/i)) {
      await handleConsulterNumero(query);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/citoyen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();

      if (data.found && data.citoyens.length > 0) {
        const citoyen = data.citoyens[0];
        const isWolof = currentLangue === "wolof";

        addAssistantMessage(
          isWolof
            ? `Gis naa sa informations yi ci registre bi! Kart bi ${citoyen.numero_acte}.`
            : `J'ai trouve vos informations dans les registres ! Votre acte porte le numero ${citoyen.numero_acte}.`,
          {
            tools_used: ["rechercher_citoyen", "get_acte_naissance"],
            component: "citizen_info",
            componentData: {
              citoyen,
              delai: "1 jour ouvrable",
              showConfirm: true,
            },
          }
        );
      } else {
        const isWolof = currentLangue === "wolof";
        addAssistantMessage(
          isWolof
            ? `Gisuma sa tur ci registre bi. War nga **bind** ci systeme bi gannaaw bu ngay man a laaj sa kart yi.\n\nBind "Dama begg bind" walla teral ci bouton "Bind (S'inscrire)" ngir tambali.`
            : `Je n'ai pas trouve votre nom dans les registres. Vous devez d'abord **vous inscrire** dans le systeme avant de pouvoir demander des documents.\n\nEcrivez "Je veux m'inscrire" ou cliquez sur le bouton "S'inscrire".`,
          {
            tools_used: ["rechercher_citoyen"],
          }
        );
      }
    } catch {
      addAssistantMessage("Desole, une erreur est survenue lors de la recherche.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormSubmit = async (data: Record<string, string>) => {
    // Vérification auth pour toute soumission
    if (!compte) {
      const isWolof = currentLangue === "wolof";
      addAssistantMessage(
        isWolof
          ? "⚠️ **War nga connecter sa bopp gannaaw bu ngay yonnee formulaire bi !**\n\nTeral ci **Connexion** ci kaw bi, bind walla connecter."
          : "⚠️ **Vous devez vous connecter pour soumettre ce formulaire !**\n\nCliquez sur **Connexion** en haut, inscrivez-vous ou connectez-vous, puis resoumettez.",
        { tools_used: ["verifier_authentification"] }
      );
      setShowAuthModal(true);
      return;
    }

    // Si le formulaire contient nom_pere → afficher carte de vérification avant soumission
    if (data.nom_pere) {
      const isWolof = currentLangue === "wolof";
      addAssistantMessage(
        isWolof
          ? "👁️ **Seetal sa informations yi gannaaw bu ngay yonnee :**"
          : "👁️ **Vérifiez vos informations avant de soumettre :**",
        {
          tools_used: ["verifier_informations"],
          component: "citizen_info",
          componentData: {
            citoyen: {
              nom: data.nom?.toUpperCase(),
              prenom: data.prenom,
              date_naissance: data.date_naissance,
              lieu_naissance: data.lieu_naissance,
              nom_pere: data.nom_pere,
              nom_mere: data.nom_mere,
              telephone: data.telephone,
              numero_acte: "—",
              commune: data.lieu_naissance,
              centre_etat_civil: `Centre d'État Civil de ${data.lieu_naissance}`,
            },
            showConfirm: true,
            typeDocument: "inscription",
            formDataToSubmit: data,
          },
        }
      );
      setIsLoading(false);
      return;
    }

    // Si le formulaire contient ancienne_cni → Renouvellement CNI
    if (data.ancienne_cni) {
      await handleServiceInscription("dgid", { ...data, activite: "Renouvellement CNI", type: "personne_physique", adresse: data.adresse || "" });
      return;
    }

    // Si le formulaire contient type_declaration → Déclaration fiscale DGID
    if (data.type_declaration) {
      await handleServiceInscription("dgid", { ...data, activite: `Déclaration ${data.type_declaration}`, type: "personne_physique", adresse: "" });
      return;
    }

    // Si le formulaire contient activite → DGID (NINEA)
    if (data.activite) {
      await handleServiceInscription("dgid", data);
      return;
    }

    // Si le formulaire contient secteur (et pas activite) → CNSS
    if (data.secteur) {
      await handleServiceInscription("cnss", data);
      return;
    }

    // Si le formulaire contient universite → Bourse
    if (data.universite) {
      await handleServiceInscription("bourse", data);
      return;
    }

    // Si le formulaire contient type_menage → CMU
    if (data.type_menage) {
      await handleServiceInscription("cmu", { ...data, membres_couverts: parseInt(data.membres_couverts) || 1 } as unknown as Record<string, string>);
      return;
    }

    // Sinon c'est une demande de document
    // Récupérer le type de document depuis le dernier formulaire affiché
    const lastFormMsg = [...messages].reverse().find(m => m.componentData?.typeDocument);
    const typeDocumentDemande = (lastFormMsg?.componentData?.typeDocument as string) || "acte_naissance";

    // Afficher carte de vérification avant soumission
    const isWolofVerif = currentLangue === "wolof";
    addAssistantMessage(
      isWolofVerif
        ? "👁️ **Seetal sa informations yi gannaaw bu ngay yonnee :**"
        : "👁️ **Vérifiez vos informations avant de soumettre :**",
      {
        tools_used: ["verifier_informations"],
        component: "citizen_info",
        componentData: {
          citoyen: {
            nom: data.nom?.toUpperCase() || "",
            prenom: data.prenom || "",
            date_naissance: data.date_naissance || "",
            lieu_naissance: data.lieu_naissance || "",
            nom_pere: "—",
            nom_mere: "—",
            telephone: data.telephone || "",
            numero_acte: "—",
            commune: data.lieu_naissance || "",
            centre_etat_civil: `Centre d'État Civil de ${data.lieu_naissance || "votre commune"}`,
          },
          showConfirm: true,
          typeDocument: typeDocumentDemande,
          isInscription: false,
          formDataToSubmit: data,
          motif: data.motif || "",
        },
      }
    );
    setIsLoading(false);
  };

  const handleConfirmDemande = async (citoyen: Record<string, unknown>) => {
    if (!compte) {
      const isWolof = currentLangue === "wolof";
      addAssistantMessage(
        isWolof
          ? "⚠️ **War nga connecter sa bopp ngir laaj document bi !**\n\nTeral ci **Connexion** ci kaw bi."
          : "⚠️ **Vous devez vous connecter pour soumettre cette demande !**\n\nCliquez sur **Connexion** en haut à droite.",
        { tools_used: ["verifier_authentification"] }
      );
      setShowAuthModal(true);
      return;
    }

    // Récupérer le dernier message avec carte de vérification
    const lastMsg = [...messages].reverse().find(m => m.component === "citizen_info" && m.componentData?.showConfirm);

    // Cas 1 : confirmation d'une INSCRIPTION état civil
    if (lastMsg?.componentData?.typeDocument === "inscription" && lastMsg?.componentData?.formDataToSubmit) {
      await handleInscription(lastMsg.componentData.formDataToSubmit as Record<string, string>);
      return;
    }

    // Cas 2 : confirmation d'une DEMANDE de document — utiliser formDataToSubmit
    const formData = lastMsg?.componentData?.formDataToSubmit as Record<string, string> | undefined;
    const typeDocument = (lastMsg?.componentData?.typeDocument as string) || "acte_naissance";
    const typeLabels: Record<string, string> = {
      acte_naissance: "Demande d'acte de naissance",
      acte_mariage: "Demande d'acte de mariage",
      acte_deces: "Demande d'acte de décès",
      certificat_nationalite: "Demande de certificat de nationalité",
    };

    setIsLoading(true);
    try {
      const res = await fetch("/api/formulaire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "soumettre",
          nom: formData?.nom || citoyen.nom,
          prenom: formData?.prenom || citoyen.prenom,
          type_document: typeDocument,
          donnees: formData || { motif: "Demande standard", copies: "1" },
        }),
      });
      const result = await res.json();

      if (result.success) {
        const isWolof = currentLangue === "wolof";
        const reference = result.demande.numero_suivi;

        // Sauvegarder dans le compte du client
        const typeLabel = typeLabels[typeDocument] || "Demande de document";
        await ajouterDemande({
          type: typeLabel,
          service: "ETAT_CIVIL",
          reference,
          details: { nom: String(citoyen.nom || ""), prenom: String(citoyen.prenom || "") },
        });

        // Message 1 : succès + récépissé téléchargeable
        addAssistantMessage(
          isWolof
            ? `✅ **Sa demande bind na ci jamm !**\n\nNumero récépissé : **${reference}**\nDelai : ${result.demande.delai}\n\n📧 **Document officiel dinaa ko yonnee ci sa email** gannaaw validation bi.\n📱 WhatsApp notification yonnee na.\n\n💡 _Mën nga télécharger sa récépissé ci kanam._`
            : `✅ **Votre demande a été enregistrée avec succès !**\n\nNuméro de récépissé : **${reference}**\nDélai : ${result.demande.delai}\n\n📧 **Le document officiel vous sera envoyé par email** après validation par l'agent.\n📱 Notification WhatsApp envoyée.\n\n💡 _Vous n'avez pas besoin de vous déplacer — le document arrive dans votre boîte email._`,
          {
            tools_used: ["soumettre_formulaire", "generer_recepisse", "notifier_citoyen"],
            component: "submission_result",
            componentData: {
              numero_suivi: reference,
              delai: result.demande.delai,
              lieu_retrait: result.demande.lieu_retrait,
              pdfData: {
                type: typeLabel,
                service: "ETAT_CIVIL",
                nom: String(citoyen.nom || ""),
                prenom: String(citoyen.prenom || ""),
                telephone: compte?.telephone,
                details: { lieu_naissance: String(citoyen.lieu_naissance || ""), date_naissance: String(citoyen.date_naissance || "") },
              },
            },
          }
        );

        // Message 2 : menu principal après délai
        setTimeout(() => {
          addAssistantMessage(
            isWolof
              ? "🏠 **Lan la bëgg def leegi ?** Teral ci bouton yi :"
              : "🏠 **Que souhaitez-vous faire maintenant ?** Cliquez sur votre choix :",
            {
              tools_used: ["menu_principal"],
              component: "menu_choice",
              componentData: {
                items: isWolof
                  ? [
                      { icon: "📋", label: "Laaj yeneen document", msg: "Je veux mon acte de naissance" },
                      { icon: "🔍", label: "Seetal sa demande", msg: "Je veux suivre ma demande" },
                      { icon: "📊", label: "Xam sa situation", msg: "Je veux consulter mon dossier" },
                      { icon: "✍️", label: "Bind ci yeneen service", msg: "Je veux m'inscrire" },
                    ]
                  : [
                      { icon: "📋", label: "Demander un document", msg: "Je veux mon acte de naissance" },
                      { icon: "🔍", label: "Suivre ma demande", msg: "Je veux suivre ma demande" },
                      { icon: "📊", label: "Consulter mon dossier", msg: "Je veux consulter mon dossier" },
                      { icon: "✍️", label: "S'inscrire à un service", msg: "Je veux m'inscrire" },
                    ],
              },
            }
          );
        }, 800);
      }
    } catch {
      addAssistantMessage("Erreur lors de la soumission.");
    } finally {
      setIsLoading(false);
    }
  };

  // Normalisation des erreurs courantes en wolof pour la detection d'intentions
  const normaliserWolof = (texte: string): string => {
    const expressions: Record<string, string> = {
      "dama beugue": "dama begg", "dameu beugue": "dama begg",
      "dama beugg": "dama begg", "dama begue": "dama begg",
      "beugue keuyit": "begg kayit", "beugue kayit": "begg kayit",
      "beugue kart": "begg kart", "beugg keuyit": "begg kayit",
      "sama keuyit": "sama kayit", "sam keuyit": "sama kayit",
      "nandef": "na nga def", "nanga def": "na nga def", "nan ga def": "na nga def",
      "toop sam demande": "topp sama demande", "top sama demande": "topp sama demande",
    };
    const mots: Record<string, string> = {
      "beugue": "begg", "beugg": "begg", "begue": "begg", "beg": "begg", "bég": "begg", "beegg": "begg",
      "keuyit": "kayit", "keyit": "kayit", "kahit": "kayit", "kéyit": "kayit",
      "bnd": "bind", "bine": "bind", "bnid": "bind",
      "sam": "sama", "samm": "sama",
      "dameu": "dama", "damm": "dama",
      "kar": "kart", "carte": "kart", "cart": "kart",
      "dimbal": "ndimbal", "nimbal": "ndimbal",
      "toop": "topp", "toupe": "topp",
      "setal": "seetal", "seetl": "seetal",
      "niang": "njang", "njank": "njang",
      "jerejef": "jereejef", "jerjeef": "jereejef", "jéréjéf": "jereejef",
      "beceg": "becceg", "beseg": "becceg",
      "feye": "fey", "féy": "fey",
      "wakh": "wax", "wakhe": "wax",
      "kham": "xam", "djokh": "jox", "djox": "jox",
    };
    let normalise = texte.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    for (const [erreur, correct] of Object.entries(expressions)) {
      normalise = normalise.replace(new RegExp(erreur, "gi"), correct);
    }
    const words = normalise.split(/\s+/);
    normalise = words.map(w => {
      const clean = w.replace(/[.,!?;:]$/, "");
      const suffix = w.slice(clean.length);
      return (mots[clean] || clean) + suffix;
    }).join(" ");
    return normalise;
  };

  const sendMessage = async (text?: string) => {
    const messageText = text || input.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: messageText,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setShowServices(false);

    // Détection des réponses numériques (ex: "1", "option 2", "le 3", "je prends le 4")
    const numMatch = messageText.match(/^(?:option\s*|le\s*|choix\s*|numero\s*)?(\d)$/i) ||
                     messageText.match(/^(?:je\s+(?:veux|prends?|choisis?)\s*(?:l[ea']?\s*)?)?(?:option\s*|le\s*|choix\s*)?(\d)$/i);
    if (numMatch) {
      const choix = parseInt(numMatch[1] || numMatch[2]);
      const lastBotMsg = [...messages].reverse().find(m => m.role === "assistant");
      if (lastBotMsg?.content) {
        // Extraire automatiquement les options numérotées du dernier message
        const options: string[] = [];
        let match;
        const regexWithDash = /(?:^|\n)\s*\d+\.\s*\*{0,2}(.+?)\*{0,2}\s*(?:—|–|-|:)/gm;
        while ((match = regexWithDash.exec(lastBotMsg.content)) !== null) {
          options.push(match[1].replace(/\*+/g, "").trim());
        }
        if (options.length === 0) {
          const regexBold = /(?:^|\n)\s*\d+\.\s*\*\*(.+?)\*\*/gm;
          while ((match = regexBold.exec(lastBotMsg.content)) !== null) {
            options.push(match[1].trim());
          }
        }
        if (options.length === 0) {
          const regexSimple = /(?:^|\n)\s*\d+\.\s+(.+?)(?:\n|$)/gm;
          while ((match = regexSimple.exec(lastBotMsg.content)) !== null) {
            options.push(match[1].replace(/\*+/g, "").trim());
          }
        }

        if (choix >= 1 && choix <= options.length) {
          const selectedOption = options[choix - 1];
          // Ajouter le choix comme message utilisateur visible puis relancer
          const choixMsg: Message = {
            id: Date.now().toString() + "choice",
            role: "user",
            content: selectedOption,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, choixMsg]);
          setIsLoading(false);
          // Petit délai pour que le state se mette à jour avant le prochain sendMessage
          setTimeout(() => sendMessage(selectedOption), 100);
          return;
        }
      }
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageText, langue_forcee: selectedLang !== "auto" ? selectedLang : undefined }),
      });

      const data = await res.json();
      // Si l'utilisateur a choisi manuellement une langue, on la respecte
      const langue = selectedLang !== "auto" ? selectedLang : (data.langue || "francais");
      setCurrentLangue(langue);

      // Mettre a jour la langue du message utilisateur
      setMessages((prev) =>
        prev.map((m) =>
          m.id === userMessage.id ? { ...m, langue } : m
        )
      );

      const intent = data.intent || "";
      const domaine = data.domaine || "";

      // Determiner si on doit afficher un formulaire interactif
      // On utilise la version normalisee pour tolerer les erreurs d'ecriture en wolof
      const lowerMsg = normaliserWolof(messageText);

      // Vérifier si le dernier message bot proposait un choix de document dans le cadre d'une INSCRIPTION
      const lastBotMsgForCtx = [...messages].reverse().find(m => m.role === "assistant");
      const lastBotWasDocChoix = lastBotMsgForCtx?.content?.includes("Quel document souhaitez-vous demander") ||
                                  lastBotMsgForCtx?.content?.includes("Lan mooy document bi bëgg nga laaj");

      const isInscriptionRequest =
        intent === "demande_inscription" ||
        lowerMsg.match(/\b(inscrire|inscription|enregistrer)\b/) ||
        lowerMsg.match(/\b(bind|dama begg bind|begg bind)\b/) ||
        // Si on répondait au menu "quel document" dans le contexte d'une inscription
        (lastBotWasDocChoix && lowerMsg.match(/\b(acte|naissance|mariage|deces|nationalite|kart|becceg|takk|dee|certificat)\b/));

      const isDocumentRequest =
        !isInscriptionRequest && !lastBotWasDocChoix && (
          (intent === "demande_document" && domaine === "etat_civil") ||
          intent === "acte_naissance" ||
          intent === "acte_naissance_wolof" ||
          lowerMsg.match(/\b(kart becceg|kart takk|kart dee)\b/) ||
          lowerMsg.match(/\b(extrait|acte de naissance|acte naissance|certificat.*naissance|copie.*acte|mon acte|acte.*mariage|acte.*deces|certificat.*nationalite)\b/)
        );
      const isSuiviRequest =
        intent === "suivi_demande" ||
        intent === "suivi" ||
        lowerMsg.match(/\b(topp|topp sama demande|suivre|suivi)\b/);
      const isSearchByNumero = messageText.match(/N-\d{4}-\d{3}-[A-Z]{3}/i) || messageText.match(/DEM-\d{4}-\d{3}/i);
      const isServiceNumero = messageText.match(/NIN-\d{4}-\d{3}/i) || messageText.match(/CSS-\d{4}-\d{3}/i) || messageText.match(/BRS-\d{4}-\d{3}/i) || messageText.match(/CMU-\d{4}-\d{3}/i);

      // Renouvellement CNI
      const isCNIRenouvellement = lowerMsg.match(/\b(renouveler|renouvellement|renew|expire|kart boppam)\b/);

      // Inscription aux services specifiques
      const isNINEADemande = lowerMsg.match(/\b(ninea|immatricul|registre.*commerce|rccm|dama begg ninea|entreprise)\b/);
      const isDGIDImpots = lowerMsg.match(/\b(dgid|impots?|taxe|tva|declaration|fey wall|centre fiscal|situation fiscale|patente|payer.*impot|comment.*payer)\b/);
      const isCNSSInscription = lowerMsg.match(/\b(inscrire.*cnss|inscription.*cnss|cnss.*inscrire|bind.*cnss)\b/);
      const isBourseInscription = lowerMsg.match(/\b(bourse.*etud|inscrire.*bourse|demande.*bourse|njang)\b/);
      const isCMUInscription = lowerMsg.match(/\b(cmu|couverture.*maladie|inscrire.*cmu|bind.*cmu)\b/);
      const isConsultation = lowerMsg.match(/\b(consulter|situation|mon compte|mon ninea|ma bourse|ma carte|sama ninea|sama kart)\b/);

      // DGID impots en priorite (avant isInscriptionRequest qui peut mal capturer)
      if (isDGIDImpots && !isConsultation && !isNINEADemande) {
        const isWolof = langue === "wolof" || lowerMsg.match(/\b(dama|begg|sama|fey)\b/);
        if (isWolof) setCurrentLangue("wolof");

        // Répondre directement aux questions de paiement au lieu de renvoyer le menu DGID.
        const asksPayment = lowerMsg.match(/\b(payer|paiement|fey)\b/);
        if (asksPayment) {
          addAssistantMessage(
            isWolof
              ? "💳 **Naka ngay fey sa impôt yi**\n\n**Ci MAX IT :** ubbi l’application MAX IT, dem ci **Paiement**, tànn **FAY SAMA IMPÔT**, tànn sa démarche, bind xibaar yi lañu laaj, te fey. Denc reçu bi bu paiement bi jàll.\n\n**Ci SENTAX :** dem ci sentax.dgid.sn ngir teledeclarer ak telepayer. Su sa compte amul activation, laaj inscription ci eServices ji njëkk.\n\nNaka lañu lay fayee man na aju ci sa impôt ak sa statut. Bul yonnee sa mot de passe walla sa codes ci chat bi."
              : "💳 **Comment payer vos impôts et taxes**\n\n**Avec MAX IT :** ouvrez l’application MAX IT, allez dans **Paiement**, choisissez **FAY SAMA IMPÔT**, sélectionnez la démarche et renseignez les informations demandées. Effectuez le paiement, puis conservez le reçu.\n\n**Avec SENTAX :** rendez-vous sur sentax.dgid.sn pour la télédéclaration et le télépaiement. Si votre compte n’est pas encore activé, la DGID indique de demander d’abord votre inscription via eServices.\n\nLe parcours applicable dépend de votre situation fiscale. Pour les contribuables de la DGE, SENTAX est obligatoire depuis le 1er septembre 2026. Ne transmettez pas votre mot de passe ni vos codes dans ce chat.\n\nÊtes-vous un particulier ou une entreprise ? Je pourrai vous orienter vers le parcours adapté.",
            {
              langue: isWolof ? "wolof" : "francais",
            }
          );
          setIsLoading(false);
          return;
        }

        const asksCentreFiscal = lowerMsg.match(/\b(centre fiscal|fan la|ou se trouve|nekk fan|trouver.*centre)\b/);
        if (asksCentreFiscal) setShowMap(true);

        // Déclaration TVA / IS / Patente → formulaire
        const isDeclaration = lowerMsg.match(/\b(declaration|declarer|tva|patente|is\b)/);
        if (isDeclaration) {
          addAssistantMessage(
            isWolof
              ? "Waaw! Ngir def sa déclaration, remplir formulaire bii :"
              : "Pour effectuer votre déclaration fiscale, veuillez remplir ce formulaire :",
            {
              langue: isWolof ? "wolof" : "francais",
              tools_used: ["declaration_fiscale", "generer_recepisse"],
              component: "form",
              componentData: {
                titre: isWolof ? "Déclaration wàll" : "Déclaration fiscale — DGID",
                titre_wolof: "Formulaire déclaration",
                formType: "declaration_dgid",
                guide: {
                  titre: "Déclaration fiscale (TVA / IS / Patente)",
                  utilite: [
                    "Obligation legale pour tout contribuable immatricule",
                    "Eviter les penalites de retard (5% par mois)",
                    "Regulariser votre situation fiscale",
                    "Obtenir votre quitus fiscal pour les appels d'offres",
                  ],
                  utilite_wolof: [
                    "War la ngir contribuable bu bind",
                    "Ngir bañ pénalités (5% ci weer wu nekk)",
                    "Ngir yem sa situation fiscale",
                    "Ngir am quitus fiscal",
                  ],
                  delai: "Traitement immediat",
                  cout: "Variable selon le montant declare",
                  etapes: [
                    { numero: 1, titre: "Remplir le formulaire", description: "Indiquez votre NINEA, le type de declaration et le montant." },
                    { numero: 2, titre: "Calculer le montant", description: "Le systeme calcule automatiquement le montant a payer." },
                    { numero: 3, titre: "Choisir le mode de paiement", description: "Orange Money, Wave, virement bancaire ou guichet." },
                    { numero: 4, titre: "Recevoir le recepisse", description: "Un recepisse de declaration vous est delivre immediatement." },
                  ],
                  pieces_requises: [
                    { nom: "Numero NINEA", nom_wolof: "Numero NINEA", obligatoire: true },
                    { nom: "Montant du chiffre d'affaires", nom_wolof: "Montant chiffre d'affaires", obligatoire: true },
                  ],
                },
                fields: [
                  { id: "nom", label: "Nom / Raison sociale", label_wolof: "Tur / Raison sociale", type: "text", required: true, placeholder: "Ex: DIOP Moussa ou DIOP Trading SARL" },
                  { id: "prenom", label: "Prenom (si personne physique)", label_wolof: "Tur gu njekk", type: "text", required: false, placeholder: "Ex: Moussa" },
                  { id: "ninea", label: "Numero NINEA", label_wolof: "Numero NINEA", type: "text", required: true, placeholder: "Ex: NIN-2024-001" },
                  { id: "type_declaration", label: "Type de declaration", label_wolof: "Type déclaration", type: "select", required: true, options: ["TVA mensuelle", "Impot sur les societes (IS)", "Patente", "BRS (retenue a la source)"] },
                  { id: "periode", label: "Periode concernee", label_wolof: "Periode", type: "text", required: true, placeholder: "Ex: Janvier 2024, Annee 2023" },
                  { id: "montant_ca", label: "Chiffre d'affaires de la periode (FCFA)", label_wolof: "Chiffre d'affaires (FCFA)", type: "number", required: true, placeholder: "Ex: 5000000" },
                  { id: "activite", label: "Mode de paiement", label_wolof: "Naka ngay fey", type: "select", required: true, options: ["Orange Money", "Wave", "Virement bancaire", "Especes au guichet"] },
                  { id: "telephone", label: "Telephone", label_wolof: "Telefon", type: "tel", required: true, placeholder: "77 123 45 67" },
                ],
              },
            }
          );
          setIsLoading(false);
          return;
        }

        // Question centre fiscal → ouvrir la carte
        if (asksCentreFiscal) {
          addAssistantMessage(
            isWolof
              ? "📍 **Centre fiscal bi** — 🗺️ carte bi ubbee na ci kanam.\n\nTeral ci centre bu gën a jege ci sa gox ngir gis adresse bi ak waxtu yi."
              : "📍 **Votre centre fiscal** — 🗺️ La carte s'est ouverte automatiquement.\n\nCliquez sur le centre le plus proche de chez vous pour voir l'adresse et les horaires.",
            {
              langue: isWolof ? "wolof" : "francais",
              tools_used: ["get_centre_fiscal", "open_map"],
            }
          );
          setIsLoading(false);
          return;
        }

        // Message général DGID (payer, situation, etc.)
        addAssistantMessage(
          isWolof
            ? "**DGID — Sëriñ Wàll yi**\n\nLan moo la bëgg ? Teral ci bouton yi :"
            : "**DGID — Direction des Impôts et Domaines**\n\nQue souhaitez-vous faire ? Cliquez sur votre choix :",
          {
            langue: isWolof ? "wolof" : "francais",
            tools_used: ["get_centre_fiscal", "check_declarations"],
            component: "menu_choice",
            componentData: {
              items: isWolof
                ? [
                    { icon: "💳", label: "Fey wall bi", msg: "Comment payer mes impots?" },
                    { icon: "📝", label: "Bind déclaration TVA", msg: "Je veux faire ma declaration TVA" },
                    { icon: "📍", label: "Xam centre fiscal", msg: "Ou se trouve le centre fiscal?" },
                    { icon: "📊", label: "Seetal situation fiscale", msg: "Je veux verifier ma situation fiscale" },
                  ]
                : [
                    { icon: "💳", label: "Payer mes impôts", msg: "Comment payer mes impots?" },
                    { icon: "📝", label: "Faire une déclaration TVA", msg: "Je veux faire ma declaration TVA" },
                    { icon: "📍", label: "Trouver mon centre fiscal", msg: "Ou se trouve le centre fiscal?" },
                    { icon: "📊", label: "Vérifier ma situation", msg: "Je veux verifier ma situation fiscale" },
                  ],
            },
          }
        );
        setIsLoading(false);
        return;
      }

      // isInscriptionRequest = etat civil seulement, pas les autres services
      if (isInscriptionRequest && !isCNSSInscription && !isBourseInscription && !isCMUInscription && !isNINEADemande && !isConsultation) {
        const isWolof = langue === "wolof" || lowerMsg.match(/\b(bind|dama|begg|sama)\b/);
        if (isWolof) setCurrentLangue("wolof");

        // Si l'utilisateur a déjà choisi un document (ex: "acte de naissance" après le menu)
        const hasDocChoice = lowerMsg.match(/\b(acte.*naissance|naissance|kart becceg|extrait)\b/) ||
                             lowerMsg.match(/\b(acte.*mariage|mariage|kart takk)\b/) ||
                             lowerMsg.match(/\b(acte.*deces|deces|kart dee)\b/) ||
                             lowerMsg.match(/\b(certificat.*nationalite|nationalite)\b/) ||
                             lastBotWasDocChoix; // Réponse au menu de choix de document

        if (!hasDocChoice) {
          // D'abord demander quel document — texte + boutons cliquables
          addAssistantMessage(
            isWolof
              ? "Waaw! Lan mooy document bi bëgg nga laaj ? Teral ci bouton yi ci suuf :"
              : "Bien sûr ! Quel document souhaitez-vous demander ? Cliquez sur votre choix :",
            {
              langue: isWolof ? "wolof" : "francais",
              tools_used: ["get_documents_disponibles"],
              component: "doc_choice",
              componentData: { isWolof },
            }
          );
          setIsLoading(false);
          return;
        }

        // Déterminer quel document a été choisi
        let typeDocChoisi = "acte_naissance";
        if (lowerMsg.match(/\b(mariage|kart takk)\b/)) typeDocChoisi = "acte_mariage";
        else if (lowerMsg.match(/\b(deces|kart dee)\b/)) typeDocChoisi = "acte_deces";
        else if (lowerMsg.match(/\b(nationalite|certificat)\b/)) typeDocChoisi = "certificat_nationalite";

        // L'utilisateur a choisi un document → afficher le formulaire
        addAssistantMessage(
          isWolof
            ? "Waaw! Ngir bind ci systeme bi, remplir formulaire bii ak sa informations yi. Champs yi yep danu obligatoire :"
            : "Parfait ! Pour enregistrer votre demande, veuillez remplir ce formulaire avec vos informations :",
          {
            langue: isWolof ? "wolof" : "francais",
            tools_used: ["inscrire_citoyen"],
            component: "form",
            componentData: {
              titre: isWolof ? "Bind ci registre bi" : "Formulaire d'inscription — État Civil",
              titre_wolof: "Inscription ci systeme bi",
              formType: "inscription",
              typeDocument: typeDocChoisi,
              guide: GUIDE_ETAT_CIVIL,
              fields: [
                { id: "nom", label: "Nom de famille", label_wolof: "Tur gu moom (sant)", type: "text", required: true, placeholder: "Ex: DIOP" },
                { id: "prenom", label: "Prenom", label_wolof: "Tur gu njekk", type: "text", required: true, placeholder: "Ex: Moussa" },
                { id: "date_naissance", label: "Date de naissance", label_wolof: "Bes bu juddu", type: "date", required: true },
                { id: "lieu_naissance", label: "Lieu de naissance", label_wolof: "Fu juddu", type: "text", required: true, placeholder: "Ex: Thies, Dakar, Kaolack..." },
                { id: "nom_pere", label: "Nom complet du pere", label_wolof: "Tur baay bu mat", type: "text", required: true, placeholder: "Ex: DIOP Ibrahima" },
                { id: "nom_mere", label: "Nom complet de la mere", label_wolof: "Tur yaay bu mat", type: "text", required: true, placeholder: "Ex: FALL Fatou" },
                { id: "telephone", label: "Telephone", label_wolof: "Numero telefon", type: "tel", required: true, placeholder: "77 123 45 67" },
              ],
            },
          }
        );
        setIsLoading(false);
        return;
      }

      // Consultation par numero de service (NIN-, CSS-, BRS-, CMU-)
      if (isServiceNumero) {
        const num = (messageText.match(/(?:NIN|CSS|BRS|CMU)-\d{4}-\d{3}/i) || [""])[0];
        await handleConsulterNumero(num);
        setIsLoading(false);
        return;
      }

      // Renouvellement Carte d'Identité Nationale
      if (isCNIRenouvellement) {
        const isWolof = langue === "wolof" && lowerMsg.match(/\b(dama|begg|sama|kart boppam)\b/);
        if (isWolof) setCurrentLangue("wolof");
        addAssistantMessage(
          isWolof
            ? "Waaw! Ngir renouveler sa kàrt boppam, remplir formulaire bii. War nga upload sa kàrt bu mag (expirée) :"
            : "Pour renouveler votre carte d'identite, remplissez ce formulaire. Vous devez uploader votre ancienne carte expiree :",
          {
            langue: isWolof ? "wolof" : "francais",
            tools_used: ["renouveler_cni", "verifier_identite"],
            component: "form",
            componentData: {
              titre: isWolof ? "Renouveler Kàrt Boppam" : "Renouvellement Carte d'Identite Nationale",
              titre_wolof: "Renouvellement CNI",
              formType: "cni_renouvellement",
              guide: {
                titre: "Carte Nationale d'Identite (CNI)",
                utilite: [
                  "Piece d'identite officielle reconnue dans toute la CEDEAO",
                  "Requise pour voyager, voter, ouvrir un compte bancaire",
                  "Obligatoire pour toutes les demarches administratives",
                ],
                utilite_wolof: [
                  "Kàrt boppam bu officiel bu xam-xam ci CEDEAO yep",
                  "Soxor ko ngir jafe-jafe, voter, ubbi compte bancaire",
                  "War la ngir yoon wi yep ci administration",
                ],
                delai: "15 a 30 jours ouvrables",
                cout: "Gratuit",
                etapes: [
                  { numero: 1, titre: "Remplir le formulaire", description: "Complétez vos informations personnelles (nom, date de naissance, adresse actuelle)." },
                  { numero: 2, titre: "Uploader l'ancienne carte", description: "Joignez une photo ou scan de votre carte d'identite expiree." },
                  { numero: 3, titre: "Uploader une photo recente", description: "Joignez une photo d'identite recente (fond blanc, moins de 3 mois)." },
                  { numero: 4, titre: "Soumettre et se presenter", description: "Apres soumission, presentez-vous au centre d'etat civil avec vos originaux pour prise d'empreintes." },
                ],
                pieces_requises: [
                  { nom: "Ancienne CNI expiree (scan/photo)", nom_wolof: "Kàrt boppam bu mag (expirée)", obligatoire: true },
                  { nom: "Photo d'identite recente (fond blanc)", nom_wolof: "Photo yakkar (fond blanc)", obligatoire: true },
                  { nom: "Acte de naissance (copie)", nom_wolof: "Kàrt bëccëg (copie)", obligatoire: true },
                  { nom: "Justificatif de domicile", nom_wolof: "Papye adresse (facture, bail...)", obligatoire: false },
                ],
              },
              fields: [
                { id: "nom", label: "Nom de famille", label_wolof: "Tur gu moom (sant)", type: "text", required: true, placeholder: "Ex: DIOP" },
                { id: "prenom", label: "Prenom", label_wolof: "Tur gu njekk", type: "text", required: true, placeholder: "Ex: Moussa" },
                { id: "date_naissance", label: "Date de naissance", label_wolof: "Bes bu juddu", type: "date", required: true },
                { id: "adresse", label: "Adresse actuelle", label_wolof: "Fan ngay dëkk leegi", type: "text", required: true, placeholder: "Ex: Liberté 6, Dakar" },
                { id: "telephone", label: "Telephone", label_wolof: "Numero telefon", type: "tel", required: true, placeholder: "77 123 45 67" },
                { id: "ancienne_cni", label: "Ancienne CNI expiree (photo ou PDF)", label_wolof: "Kàrt boppam bu mag bi (upload)", type: "file", required: true, accepte: ".pdf,.jpg,.jpeg,.png" },
                { id: "photo_identite", label: "Photo d'identite recente (fond blanc)", label_wolof: "Sa wer gu mees bi (photo yakkar)", type: "file", required: true, accepte: ".jpg,.jpeg,.png" },
                { id: "acte_naissance", label: "Copie acte de naissance (PDF ou image)", label_wolof: "Copie kàrt bëccëg bi", type: "file", required: true, accepte: ".pdf,.jpg,.jpeg,.png" },
              ],
            },
          }
        );
        setIsLoading(false);
        return;
      }

      // Demande NINEA (immatriculation entreprise)
      if (isNINEADemande && !isConsultation) {
        const isWolof = langue === "wolof" || lowerMsg.match(/\b(dama|begg|sama)\b/);
        if (isWolof) setCurrentLangue("wolof");
        addAssistantMessage(
          isWolof
            ? "Waaw! Ngir am sa NINEA (immatriculation entreprise bi), remplir formulaire bii. War nga upload sa CNI ak registre de commerce bi :"
            : "Pour obtenir votre NINEA (immatriculation de votre entreprise), remplissez ce formulaire. Vous devez uploader votre CNI et votre registre de commerce :",
          {
            langue: isWolof ? "wolof" : "francais",
            tools_used: ["inscrire_contribuable", "generer_ninea"],
            component: "form",
            componentData: {
              titre: isWolof ? "Laaj NINEA — Bind Entreprise" : "Demande NINEA — Immatriculation Entreprise",
              titre_wolof: "Formulaire NINEA",
              formType: "ninea",
              guide: GUIDE_NINEA,
              fields: [
                { id: "nom", label: "Nom du gerant / responsable", label_wolof: "Tur bu boroom bi", type: "text", required: true, placeholder: "Ex: DIOP" },
                { id: "prenom", label: "Prenom", label_wolof: "Tur gu njekk", type: "text", required: true, placeholder: "Ex: Moussa" },
                { id: "nom_entreprise", label: "Nom de l'entreprise / raison sociale", label_wolof: "Tur entreprise bi", type: "text", required: true, placeholder: "Ex: DIOP Trading SARL" },
                { id: "type", label: "Forme juridique", label_wolof: "Type entreprise", type: "select", required: true, options: ["Personne physique (entreprise individuelle)", "SARL", "SA", "GIE", "Association"] },
                { id: "activite", label: "Secteur d'activite", label_wolof: "Domaine liggey", type: "text", required: true, placeholder: "Ex: Commerce general, BTP, Agriculture..." },
                { id: "adresse", label: "Adresse du siege social", label_wolof: "Adresse entreprise bi", type: "text", required: true, placeholder: "Ex: Marche central, Thies" },
                { id: "telephone", label: "Telephone", label_wolof: "Telefon", type: "tel", required: true, placeholder: "77 123 45 67" },
                { id: "cni_gerant", label: "CNI du gerant (scan/photo)", label_wolof: "CNI boroom bi (scan/photo)", type: "file", required: true, accepte: ".pdf,.jpg,.jpeg,.png" },
                { id: "registre_commerce", label: "Registre de commerce RCCM (si disponible)", label_wolof: "Registre de commerce (su am)", type: "file", required: false, accepte: ".pdf,.jpg,.jpeg,.png" },
              ],
            },
          }
        );
        setIsLoading(false);
        return;
      }


      // Inscription CNSS
      if (isCNSSInscription && !isConsultation) {
        const isWolof = langue === "wolof" || lowerMsg.match(/\b(dama|begg|bind)\b/);
        if (isWolof) setCurrentLangue("wolof");
        addAssistantMessage(
          isWolof
            ? "Waaw! Ngir bind ci CNSS, remplir formulaire bii :"
            : "Pour vous inscrire a la CNSS, veuillez remplir ce formulaire :",
          {
            langue: isWolof ? "wolof" : "francais",
            tools_used: ["inscrire_cnss", "generer_numero_cnss"],
            component: "form",
            componentData: {
              titre: isWolof ? "Bind ci CNSS" : "Inscription CNSS",
              titre_wolof: "Formulaire CNSS",
              formType: "cnss",
              guide: GUIDE_CNSS,
              fields: [
                { id: "nom", label: "Nom", label_wolof: "Tur gu moom", type: "text", required: true, placeholder: "Ex: DIOP" },
                { id: "prenom", label: "Prenom", label_wolof: "Tur gu njekk", type: "text", required: true, placeholder: "Ex: Moussa" },
                { id: "type", label: "Vous etes", label_wolof: "Yaa ngi", type: "select", required: true, options: ["salarie", "employeur"] },
                { id: "employeur", label: "Nom de l'employeur (si salarie)", label_wolof: "Tur boroom liggey bi", type: "text", required: false, placeholder: "Ex: Senegal Industries SA" },
                { id: "secteur", label: "Secteur d'activite", label_wolof: "Secteur liggey", type: "text", required: true, placeholder: "Ex: Industrie, Commerce, BTP..." },
                { id: "telephone", label: "Telephone", label_wolof: "Telefon", type: "tel", required: true, placeholder: "77 123 45 67" },
              ],
            },
          }
        );
        setIsLoading(false);
        return;
      }

      // Inscription Bourse
      if (isBourseInscription && !isConsultation) {
        const isWolof = langue === "wolof" || lowerMsg.match(/\b(njang|dama|begg)\b/);
        if (isWolof) setCurrentLangue("wolof");
        addAssistantMessage(
          isWolof
            ? "Waaw! Ngir laaj bourse bi, remplir formulaire bii :"
            : "Pour demander une bourse d'etudes, veuillez remplir ce formulaire :",
          {
            langue: isWolof ? "wolof" : "francais",
            tools_used: ["demande_bourse", "enregistrer_etudiant"],
            component: "form",
            componentData: {
              titre: isWolof ? "Laaj bourse njang" : "Demande de bourse d'etudes",
              titre_wolof: "Formulaire bourse",
              formType: "bourse",
              fields: [
                { id: "nom", label: "Nom", label_wolof: "Tur gu moom", type: "text", required: true, placeholder: "Ex: DIOP" },
                { id: "prenom", label: "Prenom", label_wolof: "Tur gu njekk", type: "text", required: true, placeholder: "Ex: Moussa" },
                { id: "universite", label: "Universite", label_wolof: "Universite", type: "select", required: true, options: ["UCAD Dakar", "Universite de Thies", "UGB Saint-Louis", "Universite de Ziguinchor", "Universite Amadou Mahtar Mbow"] },
                { id: "filiere", label: "Filiere", label_wolof: "Filiere", type: "text", required: true, placeholder: "Ex: Informatique, Droit, Medecine..." },
                { id: "niveau", label: "Niveau", label_wolof: "Niveau", type: "select", required: true, options: ["Licence 1", "Licence 2", "Licence 3", "Master 1", "Master 2", "Doctorat"] },
                { id: "telephone", label: "Telephone", label_wolof: "Telefon", type: "tel", required: true, placeholder: "77 123 45 67" },
              ],
            },
          }
        );
        setIsLoading(false);
        return;
      }

      // Inscription CMU
      if (isCMUInscription && !isConsultation) {
        const isWolof = langue === "wolof" || lowerMsg.match(/\b(dama|begg|bind)\b/);
        if (isWolof) setCurrentLangue("wolof");
        addAssistantMessage(
          isWolof
            ? "Waaw! Ngir bind ci CMU (Couverture Maladie), remplir formulaire bii :"
            : "Pour vous inscrire a la CMU (Couverture Maladie Universelle), veuillez remplir ce formulaire :",
          {
            langue: isWolof ? "wolof" : "francais",
            tools_used: ["inscrire_cmu", "generer_carte_cmu"],
            component: "form",
            componentData: {
              titre: isWolof ? "Bind ci CMU" : "Inscription CMU",
              titre_wolof: "Formulaire CMU",
              formType: "cmu",
              fields: [
                { id: "nom", label: "Nom", label_wolof: "Tur gu moom", type: "text", required: true, placeholder: "Ex: DIOP" },
                { id: "prenom", label: "Prenom", label_wolof: "Tur gu njekk", type: "text", required: true, placeholder: "Ex: Moussa" },
                { id: "type_menage", label: "Type de couverture", label_wolof: "Type couverture", type: "select", required: true, options: ["individuel", "familial"] },
                { id: "membres_couverts", label: "Nombre de personnes a couvrir", label_wolof: "Ñaata nit", type: "number", required: true, placeholder: "Ex: 5" },
                { id: "telephone", label: "Telephone", label_wolof: "Telefon", type: "tel", required: true, placeholder: "77 123 45 67" },
              ],
            },
          }
        );
        setIsLoading(false);
        return;
      }

      // Consultation d'un service (par nom)
      if (isConsultation) {
        const isWolof = langue === "wolof" || lowerMsg.match(/\b(sama|dama|begg)\b/);
        if (isWolof) setCurrentLangue("wolof");

        // Detecter quel service l'utilisateur veut consulter
        const consulteBourse = lowerMsg.match(/\b(bourse|sama bourse|seetal.*bourse)\b/);
        const consulteCNSS = lowerMsg.match(/\b(cnss|compte.*cnss|sama.*cnss|seetal.*cnss)\b/);
        const consulteCMU = lowerMsg.match(/\b(cmu|carte.*cmu|kart.*cmu|seetal.*cmu)\b/);
        const consulteNINEA = lowerMsg.match(/\b(ninea|sama.*ninea|seetal.*ninea|mon.*ninea)\b/);
        const consulteEtatCivil = lowerMsg.match(/\b(acte|naissance|etat.civil|kart.becceg|demande|situation|suivi)\b/);

        let exempleNumero = "NIN-2024-001 (NINEA), CSS-2024-001 (CNSS), BRS-2024-001 (Bourse), CMU-2024-001 (CMU)";
        let exempleNumeroWo = "NIN-2024-001 (NINEA), CSS-2024-001 (CNSS), BRS-2024-001 (Bourse), CMU-2024-001 (CMU)";
        let serviceNameFr = "vos informations";
        let serviceNameWo = "sa informations yi";

        if (consulteBourse) {
          exempleNumero = "BRS-2024-001";
          exempleNumeroWo = "BRS-2024-001";
          serviceNameFr = "votre bourse d'etudes";
          serviceNameWo = "sa bourse njang bi";
        } else if (consulteCNSS) {
          exempleNumero = "CSS-2024-001";
          exempleNumeroWo = "CSS-2024-001";
          serviceNameFr = "votre compte CNSS";
          serviceNameWo = "sa compte CNSS bi";
        } else if (consulteCMU) {
          exempleNumero = "CMU-2024-001";
          exempleNumeroWo = "CMU-2024-001";
          serviceNameFr = "votre carte CMU";
          serviceNameWo = "sa kart CMU bi";
        } else if (consulteNINEA) {
          exempleNumero = "NIN-2024-001";
          exempleNumeroWo = "NIN-2024-001";
          serviceNameFr = "votre NINEA";
          serviceNameWo = "sa NINEA bi";
        } else if (consulteEtatCivil) {
          exempleNumero = "N-2024-001-THI (acte) ou DEM-2024-001 (suivi demande)";
          exempleNumeroWo = "N-2024-001-THI (kàrt bëccëg) walla DEM-2024-001 (suivi)";
          serviceNameFr = "votre acte d'etat civil";
          serviceNameWo = "sa kàrt bëccëg bi";
        }

        // Determiner le serviceAttendu pour validation du prefixe
        const serviceAttendu: "bourse" | "cnss" | "cmu" | "ninea" | null =
          consulteBourse ? "bourse" :
          consulteCNSS ? "cnss" :
          consulteCMU ? "cmu" :
          consulteNINEA ? "ninea" : null;
        // Note: etat civil utilise un format different (N- ou DEM-), pas de validation de prefixe strict

        addAssistantMessage(
          isWolof
            ? `Ngir gis ${serviceNameWo}, wax ma sa **numero** bi ñu la jox waxtu bu nga binda.\n\nExemple : **${exempleNumeroWo}**`
            : `Pour consulter ${serviceNameFr}, donnez-moi le **numero** qui vous a ete attribue lors de votre inscription.\n\nExemple : **${exempleNumero}**`,
          {
            langue: isWolof ? "wolof" : "francais",
            tools_used: ["rechercher_numero"],
            component: "search",
            componentData: { serviceAttendu },
          }
        );
        setIsLoading(false);
        return;
      }

      if (isSearchByNumero) {
        // L'utilisateur a donne un numero d'acte ou de suivi
        const numero = messageText.match(/N-\d{4}-\d{3}-[A-Z]{3}/i)?.[0] || "";
        const numeroDem = messageText.match(/DEM-\d{4}-\d{3}/i)?.[0] || "";

        if (numero) {
          // Recherche par numero d'acte
          await handleSearchCitoyen(numero);
        } else if (numeroDem) {
          // Suivi de demande
          const resSuivi = await fetch("/api/formulaire", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "suivre", numero_suivi: numeroDem }),
          });
          const suiviData = await resSuivi.json();
          const wolof = currentLangue === "wolof";
          if (suiviData.success) {
            addAssistantMessage(
              wolof ? "Suivi sa demande bi :" : "Voici le suivi de votre demande :",
              {
                tools_used: ["suivre_demande"],
                component: "suivi",
                componentData: { numeroDemande: numeroDem },
              }
            );
          } else {
            addAssistantMessage(
              wolof
                ? "Gisuma demande bi ak numero bii."
                : "Aucune demande trouvee avec ce numero de suivi."
            );
          }
        }
        setIsLoading(false);
        return;
      }

      if (isDocumentRequest) {
        // Déterminer le type de document demandé
        let typeDoc = "acte_naissance";
        let docLabelFr = "Acte de naissance";
        let docLabelWo = "Kàrt bëccëg";
        let coutFr = "200 FCFA";
        let delaiFr = "3 à 5 jours ouvrables";
        if (lowerMsg.match(/\b(mariage|takk|kart takk)\b/)) { typeDoc = "acte_mariage"; docLabelFr = "Acte de mariage"; docLabelWo = "Kàrt takk"; coutFr = "2 000 FCFA"; delaiFr = "5 à 7 jours ouvrables"; }
        else if (lowerMsg.match(/\b(deces|dee|kart dee|mort)\b/)) { typeDoc = "acte_deces"; docLabelFr = "Acte de décès"; docLabelWo = "Kàrt dee"; coutFr = "200 FCFA"; delaiFr = "3 à 5 jours ouvrables"; }
        else if (lowerMsg.match(/\b(nationalite|certificat.*nationalite)\b/)) { typeDoc = "certificat_nationalite"; docLabelFr = "Certificat de nationalité"; docLabelWo = "Certificat nationalité"; coutFr = "2 000 FCFA"; delaiFr = "7 à 15 jours ouvrables"; }

        const isWolof = langue === "wolof" && lowerMsg.match(/\b(kart becceg|kart takk|kart dee|dama begg|begg kayit)\b/);
        if (isWolof) setCurrentLangue("wolof");

        // Afficher directement le formulaire de demande de document
        addAssistantMessage(
          isWolof
            ? `📋 **${docLabelWo}** — Remplir formulaire bii ngir laaj :`
            : `📋 **${docLabelFr}** — Veuillez remplir ce formulaire pour soumettre votre demande :`,
          {
            langue: isWolof ? "wolof" : "francais",
            tools_used: ["detecter_intention", "get_formulaire", "preremplir_formulaire"],
            component: "form",
            componentData: {
              titre: isWolof ? `Laaj ${docLabelWo}` : `Demande : ${docLabelFr}`,
              titre_wolof: `Formulaire ${docLabelWo}`,
              formType: "demande_document",
              typeDocument: typeDoc,
              guide: {
                titre: docLabelFr,
                utilite: [
                  "Pièce officielle délivrée par l'État Civil",
                  `Coût : ${coutFr} (timbre fiscal)`,
                  `Délai : ${delaiFr}`,
                  "Lieu de retrait : centre d'état civil de votre commune",
                ],
                utilite_wolof: [
                  "Papye officiel bu État Civil",
                  `Naata : ${coutFr}`,
                  `Ñaata bes : ${delaiFr}`,
                  "Fu la jël ko : centre état civil ci sa gox",
                ],
                delai: delaiFr,
                cout: coutFr,
                etapes: [
                  { numero: 1, titre: "Remplir le formulaire", description: "Indiquez votre nom, prénom, et informations de naissance." },
                  { numero: 2, titre: "Soumettre la demande", description: "Votre demande est enregistrée et un numéro de suivi vous est attribué." },
                  { numero: 3, titre: "Retirer le document", description: `Présentez-vous au centre d'état civil de votre commune dans ${delaiFr}.` },
                ],
                pieces_requises: [
                  { nom: "Pièce d'identité (CNI ou passeport)", nom_wolof: "Kàrt boppam (CNI walla passeport)", obligatoire: true },
                  { nom: `Timbre fiscal ${coutFr}`, nom_wolof: `Timbre fiscal ${coutFr}`, obligatoire: true },
                ],
              },
              fields: [
                { id: "nom", label: "Nom de famille", label_wolof: "Tur gu moom (sant)", type: "text", required: true, placeholder: "Ex: DIOP" },
                { id: "prenom", label: "Prénom", label_wolof: "Tur gu njekk", type: "text", required: true, placeholder: "Ex: Moussa" },
                { id: "date_naissance", label: "Date de naissance", label_wolof: "Bes bu juddu", type: "date", required: true },
                { id: "lieu_naissance", label: "Lieu de naissance", label_wolof: "Fu juddu", type: "text", required: true, placeholder: "Ex: Thiès, Dakar..." },
                { id: "telephone", label: "Téléphone", label_wolof: "Numero telefon", type: "tel", required: true, placeholder: "77 123 45 67" },
                { id: "motif", label: "Motif de la demande", label_wolof: "Liggéey bi", type: "select", required: false, options: ["Usage administratif", "Voyage / Passeport", "Mariage", "Scolarité", "Autre"] },
              ],
            },
          }
        );
        setIsLoading(false);
        return;
      }

      if (isSuiviRequest) {
        const isWolof = langue === "wolof" || lowerMsg.match(/\b(topp|dama|begg|sama)\b/);
        if (isWolof) setCurrentLangue("wolof");
        addAssistantMessage(
          isWolof
            ? "Waaw! Ngir topp sa demande, wax ma sa **numero de suivi** (ex: DEM-2024-001) walla sa **tur bu mat**."
            : "Pour suivre votre demande, donnez-moi votre **numero de suivi** (ex: DEM-2024-001) ou votre **nom complet**.",
          {
            langue: isWolof ? "wolof" : "francais",
            tools_used: ["suivre_demande"],
            component: "search",
            componentData: {},
          }
        );
        setIsLoading(false);
        return;
      }

      // Verifier si le message est un nom/prenom (recherche implicite)
      const isNameSearch =
        !isDocumentRequest &&
        !isSuiviRequest &&
        messages.length > 0 &&
        messages[messages.length - 1]?.component === "search" &&
        messageText.length > 2 &&
        !messageText.includes("?");

      if (isNameSearch) {
        await handleSearchCitoyen(messageText);
        setIsLoading(false);
        return;
      }

      // Reponse normale du chatbot
      addAssistantMessage(data.response, {
        tools_used: data.tools_used,
      });
    } catch {
      addAssistantMessage("Desole, une erreur est survenue. Veuillez reessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageComponent = (msg: Message) => {
    if (!msg.component || !msg.componentData) return null;

    switch (msg.component) {
      case "citizen_info":
        return (
          <div className="mt-3">
            <CitizenInfo
              citoyen={msg.componentData.citoyen as {nom: string; prenom: string; date_naissance: string; lieu_naissance: string; nom_pere: string; nom_mere: string; numero_acte: string; commune: string; centre_etat_civil: string; [key: string]: string}}
              langue={currentLangue}
              delai={msg.componentData.delai as string}
              isInscription={msg.componentData.typeDocument === "inscription"}
              onConfirm={
                msg.componentData.showConfirm
                  ? () => handleConfirmDemande(msg.componentData!.citoyen as Record<string, unknown>)
                  : undefined
              }
              onModifier={
                msg.componentData.typeDocument === "inscription"
                  ? () => sendMessage("Je veux modifier mes informations")
                  : undefined
              }
            />
          </div>
        );

      case "form":
        return (
          <div className="mt-3">
            <ChatForm
              titre={msg.componentData.titre as string}
              titre_wolof={msg.componentData.titre_wolof as string}
              fields={msg.componentData.fields as Array<{id: string; label: string; label_wolof?: string; type: "text" | "date" | "select" | "tel" | "email" | "number" | "file"; required: boolean; placeholder?: string; options?: string[]; value?: string; accepte?: string}>}
              onSubmit={handleFormSubmit}
              isSubmitting={isLoading}
              langue={currentLangue}
              guide={msg.componentData.guide as DocumentGuideInfo | undefined}
            />
          </div>
        );

      case "submission_result":
        return (
          <div className="mt-3">
            <SubmissionResult
              numero_suivi={msg.componentData.numero_suivi as string}
              delai={msg.componentData.delai as string}
              lieu_retrait={msg.componentData.lieu_retrait as string}
              langue={currentLangue}
              pdfData={msg.componentData.pdfData as {type: string; service: string; nom: string; prenom: string; telephone?: string; details?: Record<string, string>} | undefined}
            />
          </div>
        );

      case "search":
        return (
          <div className="mt-3">
            <QuickSearch
              onSearch={handleSearchCitoyen}
              langue={currentLangue}
              serviceAttendu={msg.componentData.serviceAttendu as "bourse" | "cnss" | "cmu" | "ninea" | null}
            />
          </div>
        );

      case "suivi":
        return (
          <div className="mt-3">
            <SuiviDemande
              numeroDemande={msg.componentData.numeroDemande as string}
              langue={currentLangue}
            />
          </div>
        );

      case "menu_choice": {
        const items = msg.componentData.items as Array<{ icon: string; label: string; msg: string }>;
        return (
          <div className="mt-3 flex flex-col gap-2 max-w-xs">
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => sendMessage(item.msg)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-left transition-all duration-150 hover:bg-blue-50 hover:border-[#1F5C99] hover:shadow-md hover:translate-x-1"
              >
                <span className="w-6 h-6 rounded-full bg-[#1F5C99] text-white text-[10px] font-black flex items-center justify-center shrink-0">{i + 1}</span>
                <span className="text-base shrink-0">{item.icon}</span>
                <span className="text-[11px] font-semibold text-gray-800">{item.label}</span>
                <span className="ml-auto text-gray-300 text-sm">›</span>
              </button>
            ))}
          </div>
        );
      }

      case "doc_choice": {
        const wo = msg.componentData.isWolof as boolean;
        const docs = [
          { num: "1", icon: "📄", label: wo ? "Kàrt bëccëg" : "Acte de naissance",           sub: wo ? "Acte de naissance" : "État Civil",         msg: wo ? "Kàrt bëccëg" : "Acte de naissance",           color: "border-blue-200 hover:bg-blue-50 hover:border-blue-400" },
          { num: "2", icon: "💍", label: wo ? "Kàrt takk" : "Acte de mariage",               sub: wo ? "Acte de mariage" : "État Civil",            msg: wo ? "Kàrt takk" : "Acte de mariage",               color: "border-pink-200 hover:bg-pink-50 hover:border-pink-400" },
          { num: "3", icon: "🕊️", label: wo ? "Kàrt dee" : "Acte de décès",                  sub: wo ? "Acte de décès" : "État Civil",              msg: wo ? "Kàrt dee" : "Acte de décès",                  color: "border-gray-200 hover:bg-gray-50 hover:border-gray-400" },
          { num: "4", icon: "🇸🇳", label: wo ? "Certificat nationalité" : "Certificat de nationalité", sub: wo ? "" : "État Civil", msg: wo ? "Certificat nationalité" : "Certificat de nationalité", color: "border-green-200 hover:bg-green-50 hover:border-green-400" },
        ];
        return (
          <div className="mt-3 flex flex-col gap-2 max-w-xs">
            {docs.map((d, i) => (
              <button
                key={i}
                onClick={() => sendMessage(d.msg)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-white text-left transition-all duration-150 hover:shadow-md hover:translate-x-1 ${d.color}`}
              >
                <span className="w-6 h-6 rounded-full bg-[#1F5C99] text-white text-[10px] font-black flex items-center justify-center shrink-0">{d.num}</span>
                <span className="text-base shrink-0">{d.icon}</span>
                <span className="text-[11px] font-semibold text-gray-800">{d.label}</span>
                <span className="ml-auto text-gray-300 text-sm">›</span>
              </button>
            ))}
          </div>
        );
      }

      default:
        return null;
    }
  };

  // Langue d'affichage de l'interface :
  // - "wolof" ou "francais" force : on utilise cette langue
  // - "auto" : on utilise currentLangue (detectee automatiquement par le NLP)
  const uiLang = selectedLang === "wolof" ? "wo" : selectedLang === "francais" ? "fr" : (currentLangue === "wolof" ? "wo" : "fr");
  const t = UI_TEXT[uiLang];

  const MCP_SERVERS = [
    { name: "Etat Civil", color: "bg-blue-500", status: "En ligne" },
    { name: "DGID", color: "bg-amber-500", status: "En ligne" },
    { name: "Wolof NLP", color: "bg-purple-500", status: "En ligne" },
    { name: "Formulaires", color: "bg-orange-500", status: "En ligne" },
  ];

  return (
    <div className={`flex flex-col h-screen transition-colors duration-300 ${darkMode ? "bg-[#1a1a2e] text-gray-100" : "bg-[#f0f7f4]"}`} role="application" aria-label="SunuBot — Assistant administratif du Sénégal">
      {/* Skip to content */}
      <a href="#chat-input" className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:bg-white focus:text-[#1F5C99] focus:px-4 focus:py-2 focus:rounded-lg focus:shadow-lg focus:text-sm focus:font-semibold">
        Aller au chat
      </a>
      {/* Header */}
      <header role="banner" aria-label="Navigation SunuBot" className={`${darkMode ? "bg-gradient-to-r from-[#0d1b2a] via-[#1b2838] to-[#0d1b2a] border-b border-white/10" : "bg-gradient-to-r from-[#1F5C99] via-[#1a54a0] to-[#0f3d6e]"} text-white px-5 py-3.5 shadow-xl flex items-center gap-3`}>
        {/* Logo */}
        <div className="w-10 h-10 rounded-2xl bg-white/20 border border-white/30 ring-2 ring-white/20 flex items-center justify-center font-black text-sm shadow-inner">
          SB
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-base tracking-tight flex items-center gap-1.5">
            🇸🇳 SunuBot
            <span className="text-[9px] bg-white/15 border border-white/20 px-1.5 py-0.5 rounded-full font-medium hidden sm:inline">M2 IA</span>
          </h1>
          <span className="text-[10px] text-white/70 truncate block">{t.subtitle}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Badge MCP */}
          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-white/10 border border-white/20 hidden lg:block tracking-wider uppercase">
            MCP · NLP · mBERT
          </span>
          {/* Navigation desktop */}
          <a href="/mobile" className="hidden sm:flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/10 px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-200" title="Mobile">
            <span className="text-sm">📱</span>
            <span className="hidden md:inline">Mobile</span>
          </a>
          <a href="/whatsapp" className="hidden sm:flex items-center gap-1 bg-[#25D366]/20 hover:bg-[#25D366]/30 border border-[#25D366]/30 px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-200 text-[#25D366]" title="WhatsApp">
            <span className="text-sm">💬</span>
            <span className="hidden md:inline">WhatsApp</span>
          </a>
          <a href="/historique" className="hidden sm:flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/10 px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-200" title="Historique">
            <History className="w-3 h-3" />
            <span className="hidden md:inline">Historique</span>
          </a>
          <a href="/aide" className="hidden sm:flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/10 px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-200" title="Aide">
            <HelpCircle className="w-3 h-3" />
            <span className="hidden md:inline">Aide</span>
          </a>
          <a href="/stats" className="hidden sm:flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/10 px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-200" title="Statistiques">
            <span className="text-sm">📊</span>
            <span className="hidden md:inline">Stats</span>
          </a>
          <a href="/admin" className="hidden sm:flex items-center gap-1 bg-white/10 hover:bg-white/20 border border-white/10 px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-200" title="Administration">
            <Shield className="w-3 h-3" />
            <span className="hidden md:inline">Admin</span>
          </a>
          {/* Menu mobile hamburger */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition"
            >
              <span className="text-sm">☰</span>
            </button>
            {showMobileMenu && (
              <div className="absolute right-0 top-10 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 w-48 z-50">
                {[
                  { href: "/mobile", icon: "📱", label: "Version Mobile" },
                  { href: "/whatsapp", icon: "💬", label: "WhatsApp" },
                  { href: "/historique", icon: "📋", label: "Historique" },
                  { href: "/aide", icon: "❓", label: "Aide & FAQ" },
                  { href: "/stats", icon: "📊", label: "Statistiques" },
                  { href: "/admin", icon: "🔒", label: "Administration" },
                ].map((item) => (
                  <a key={item.href} href={item.href}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    <span>{item.icon}</span> {item.label}
                  </a>
                ))}
              </div>
            )}
          </div>
          {/* Dark mode */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="flex items-center justify-center w-8 h-8 bg-white/10 hover:bg-white/20 rounded-lg border border-white/10 transition-all duration-200"
            title={darkMode ? "Mode clair" : "Mode sombre"}
          >
            {darkMode ? <Sun className="w-3.5 h-3.5 text-yellow-300" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          {/* Langue */}
          <button
            onClick={() => setSelectedLang(selectedLang === "auto" ? "wolof" : selectedLang === "wolof" ? "francais" : "auto")}
            className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-200 border border-white/10 font-medium"
          >
            <Globe className="w-3.5 h-3.5" />
            {selectedLang === "auto" ? "Auto" : selectedLang === "wolof" ? "WO" : "FR"}
          </button>
          {/* Auth */}
          {compte ? (
            <button
              onClick={() => setShowDashboard(true)}
              className="relative flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg text-[11px] transition-all duration-200 border border-white/10"
              title="Mon espace"
            >
              {compte.demandes.some((d) => d.statut === "disponible") && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-[#1F5C99] animate-pulse" />
              )}
              <div className="w-5 h-5 rounded-full bg-white/30 flex items-center justify-center text-[9px] font-bold">
                {compte.prenom[0]}
              </div>
              <span className="hidden sm:inline max-w-[70px] truncate font-medium">{compte.prenom}</span>
            </button>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-1.5 bg-white text-[#1F5C99] hover:bg-blue-50 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all duration-200 shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              {uiLang === "wo" ? "Dugg" : "Connexion"}
            </button>
          )}
        </div>
      </header>

      {/* Modals Auth */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleAuthSuccess}
          langue={currentLangue}
        />
      )}
      {showDashboard && compte && (
        <Dashboard
          compte={compte}
          onClose={() => setShowDashboard(false)}
          onLogout={handleLogout}
          langue={currentLangue}
        />
      )}

      {/* Modal Carte */}
      {showMap && (
        <GeoMap langue={currentLangue} onClose={() => setShowMap(false)} />
      )}

      {/* Body : Sidebar + Chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-[240px] ${darkMode ? "bg-[#1e1e36] border-r border-white/10" : "bg-white border-r border-gray-200"} flex-shrink-0 overflow-y-auto hidden md:flex flex-col`}>
          {/* MCP Servers */}
          <div className="p-3 border-b border-gray-100 bg-gradient-to-b from-green-50/50 to-white">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">
              {uiLang === "wo" ? "Serveurs MCP yi" : "Serveurs MCP"}
            </p>
            {MCP_SERVERS.map((srv, i) => (
              <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-gray-100 mb-1 hover:border-green-200 hover:bg-blue-50/50 transition-all duration-200">
                <span className={`w-2 h-2 rounded-full ${srv.color}`} />
                <span className="text-[11px] font-medium text-gray-700 flex-1">{srv.name}</span>
                <span className="text-[9px] text-green-600 font-medium">{srv.status}</span>
              </div>
            ))}
          </div>

          {/* Bouton carte géo */}
          <div className="p-3 border-b border-gray-100">
            <button
              onClick={() => setShowMap(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition text-left"
            >
              <span className="text-base">🗺️</span>
              <div>
                <p className="text-[11px] font-semibold text-emerald-800">
                  {uiLang === "wo" ? "Carte yi" : "Carte des services"}
                </p>
                <p className="text-[9px] text-emerald-600">
                  {uiLang === "wo" ? "Mairies, CNSS, Impôts..." : "Mairies, CNSS, Impôts..."}
                </p>
              </div>
            </button>
          </div>

          {/* Raccourcis services */}
          <div className="p-3 border-b border-gray-100 flex-1 overflow-y-auto">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">
              {uiLang === "wo" ? "Ndimbal yu gaw" : "Actions rapides"}
            </p>
            {SERVICES.map((service, i) => {
              const shortcuts = uiLang === "wo" ? service.shortcuts_wo : service.shortcuts_fr;
              const label = uiLang === "wo" ? service.label_wo : service.label_fr;
              return (
                <div key={i} className="mb-2">
                  <p className="text-[10px] text-gray-500 font-semibold mb-1 flex items-center gap-1">
                    <service.icon className="w-3 h-3" />
                    {label}
                  </p>
                  {shortcuts.map((s, j) => (
                    <button
                      key={j}
                      onClick={() => sendMessage(s.message)}
                      className="block w-full text-left px-2.5 py-1.5 text-[11px] text-gray-600 border border-gray-100 rounded-md mb-1 hover:bg-blue-50 hover:text-[#1F5C99] hover:border-blue-200 hover:translate-x-0.5 transition-all"
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Mes demandes */}
          <div className="p-3">
            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold mb-2">
              {uiLang === "wo" ? "Sama demandes yi" : "Mes demandes"}
            </p>
            {messages.filter(m => m.component === "submission_result").length === 0 ? (
              <p className="text-[10px] text-gray-300 italic">
                {uiLang === "wo" ? "Demande amul" : "Aucune demande"}
              </p>
            ) : (
              messages.filter(m => m.component === "submission_result").map((m, i) => (
                <div key={i} className="px-2 py-1.5 border border-gray-100 rounded-md mb-1 cursor-pointer hover:bg-green-50 hover:border-green-200 transition">
                  <p className="text-[9px] font-mono text-[#1F5C99] font-semibold">{(m.componentData?.numero_suivi as string) || "DEM-..."}</p>
                  <p className="text-[10px] text-green-600">
                    {uiLang === "wo" ? "Bind na" : "Enregistree"}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Liens rapides */}
          <div className="p-3 border-t border-gray-100 mt-auto">
            <div className="space-y-1">
              {[
                { href: "/aide", icon: "❓", label: uiLang === "wo" ? "Ndimbal" : "Aide & FAQ" },
                { href: "/stats", icon: "📊", label: uiLang === "wo" ? "Statistiques" : "Statistiques" },
                { href: "/admin", icon: "🔒", label: "Administration" },
              ].map((link) => (
                <a key={link.href} href={link.href}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] text-gray-500 hover:bg-blue-50 hover:text-[#1F5C99] transition">
                  <span>{link.icon}</span> {link.label}
                </a>
              ))}
            </div>
            <p className="text-[8px] text-gray-300 text-center mt-2">SunuBot v1.0 — M2 IA Thies</p>
          </div>
        </aside>

        {/* Zone chat principale */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Sous-header chat */}
          <div className="px-4 py-2 bg-white border-b border-gray-200 shadow-sm flex items-center gap-3">
            <div className="text-xs font-bold text-gray-700">
              {uiLang === "wo" ? "Ndimbalkat administratif" : "Assistant administratif"}
            </div>
            <div className="text-[11px] text-green-600 flex items-center gap-1">
              <span className="relative flex w-2 h-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full w-2 h-2 bg-green-500" />
              </span>
              {t.online}
            </div>
            <div className="ml-auto flex gap-1">
              {(["fr", "wo"] as const).map(l => (
                <button
                  key={l}
                  onClick={() => setSelectedLang(l === "fr" ? "francais" : "wolof")}
                  className={`px-3 py-1 text-[11px] rounded-full border transition ${
                    (uiLang === l) ? "bg-[#1F5C99] border-[#1F5C99] text-white" : "border-gray-300 text-gray-500 hover:border-[#1F5C99]"
                  }`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
              <button
                onClick={() => setSelectedLang("auto")}
                className={`px-3 py-1 text-[11px] rounded-full border transition ${
                  selectedLang === "auto" ? "bg-[#1F5C99] border-[#1F5C99] text-white" : "border-gray-300 text-gray-500 hover:border-[#1F5C99]"
                }`}
              >
                AUTO
              </button>
            </div>
          </div>

          {/* Messages area */}
          <div role="log" aria-live="polite" aria-label="Messages du chat" className={`flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-4 ${darkMode ? "bg-gradient-to-b from-[#1a1a2e] to-[#16213e]" : "bg-gradient-to-b from-slate-50 to-blue-50/30"}`}>
            {/* Welcome si pas de messages */}
            {showServices && messages.length === 0 && (
              <div className="flex gap-3 max-w-2xl">
                {/* Avatar bot */}
                <div className="shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1F5C99] to-[#0f3d6e] flex items-center justify-center text-[10px] font-black text-white shadow-lg ring-2 ring-white mt-1">SB</div>
                {/* Bulle de bienvenue */}
                <div className="bg-white border border-blue-100 rounded-2xl rounded-tl-sm px-5 py-4 shadow-lg flex-1">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-lg">🤖</div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">{t.welcome}</p>
                      <p className="text-[11px] text-gray-400">{t.subtitle}</p>
                    </div>
                  </div>
                  {/* Services — boutons cliquables colorés */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      {
                        icon: "📄", label: uiLang === "wo" ? "Bind" : "S'inscrire",
                        desc: uiLang === "wo" ? "État civil, DGID..." : "État civil, DGID...",
                        message: uiLang === "wo" ? "Dama begg bind" : "Je veux m'inscrire",
                        bg: "bg-blue-600", hover: "hover:bg-blue-700",
                      },
                      {
                        icon: "📋", label: uiLang === "wo" ? "Laaj kart" : "Document",
                        desc: uiLang === "wo" ? "Acte naissance..." : "Acte naissance...",
                        message: uiLang === "wo" ? "Dama begg sama kart becceg" : "Je veux mon acte de naissance",
                        bg: "bg-green-600", hover: "hover:bg-green-700",
                      },
                      {
                        icon: "🏛️", label: uiLang === "wo" ? "DGID/Wàll" : "Impôts/DGID",
                        desc: uiLang === "wo" ? "TVA, patente..." : "TVA, patente...",
                        message: uiLang === "wo" ? "Lan laa man a def ci DGID?" : "Afficher les options de la DGID",
                        bg: "bg-amber-600", hover: "hover:bg-amber-700",
                      },
                      {
                        icon: "❤️", label: uiLang === "wo" ? "CNSS/CMU" : "CNSS/Santé",
                        desc: uiLang === "wo" ? "Allocations..." : "Allocations...",
                        message: uiLang === "wo" ? "Dama begg bind ci CNSS" : "Je veux m'inscrire à la CNSS",
                        bg: "bg-red-500", hover: "hover:bg-red-600",
                      },
                      {
                        icon: "🎓", label: uiLang === "wo" ? "Bourse" : "Bourse études",
                        desc: uiLang === "wo" ? "Université..." : "Université...",
                        message: uiLang === "wo" ? "Dama begg bourse njang" : "Je veux demander une bourse d'études",
                        bg: "bg-emerald-600", hover: "hover:bg-emerald-700",
                      },
                      {
                        icon: "🔍", label: uiLang === "wo" ? "Seetal" : "Consulter",
                        desc: uiLang === "wo" ? "NINEA, CNSS..." : "NINEA, CNSS...",
                        message: uiLang === "wo" ? "Dama begg seetal sama informations" : "Je veux consulter mon dossier",
                        bg: "bg-purple-600", hover: "hover:bg-purple-700",
                      },
                    ].map((item, i) => (
                      <button
                        key={i}
                        onClick={() => sendMessage(item.message)}
                        className={`flex items-center gap-2 px-3 py-3 rounded-xl text-white text-left transition-all duration-150 shadow-sm hover:shadow-md hover:-translate-y-0.5 ${item.bg} ${item.hover}`}
                      >
                        <span className="text-xl shrink-0">{item.icon}</span>
                        <div className="min-w-0">
                          <p className="text-[11px] font-bold leading-tight">{item.label}</p>
                          <p className="text-[9px] text-white/70 leading-tight truncate">{item.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-gray-400 italic mb-3">{t.hint}</p>
                  {/* Badges MCP */}
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1.5">Serveurs MCP connectés</p>
                    <div className="flex flex-wrap gap-1">
                      {[
                        { name: "etat-civil", color: "bg-blue-50 text-blue-700 border-blue-200" },
                        { name: "dgid", color: "bg-amber-50 text-amber-700 border-amber-200" },
                        { name: "wolof-nlp", color: "bg-purple-50 text-purple-700 border-purple-200" },
                        { name: "formulaires", color: "bg-orange-50 text-orange-700 border-orange-200" },
                      ].map((s, i) => (
                        <span key={i} className={`${s.color} font-mono text-[10px] px-2.5 py-1 rounded-full border flex items-center gap-1`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 inline-block" />
                          {s.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Messages */}
            {messages.map((msg) => (
              <div key={msg.id}>
                <ChatMessage
                  role={msg.role}
                  content={msg.content}
                  langue={msg.langue}
                  tools_used={msg.tools_used}
                  timestamp={msg.timestamp}
                  darkMode={darkMode}
                />
                {/* Boutons TTS + traduction sous chaque message assistant */}
                {msg.role === "assistant" && msg.content.length > 5 && (
                  <div className="flex items-center gap-2 ml-10 mt-1">
                    <TTSButton text={msg.content} langue={msg.langue} />
                    <TranslationHint text={msg.content} sourceLangue={msg.langue || "francais"} />
                  </div>
                )}
                {msg.role === "assistant" && renderMessageComponent(msg)}
              </div>
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex gap-3">
                <div className="shrink-0 w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1F5C99] to-[#0f3d6e] flex items-center justify-center text-[10px] font-black text-white shadow-lg ring-2 ring-white mt-1">SB</div>
                <div className={`${darkMode ? "bg-[#252547] border border-white/10" : "bg-white border border-blue-100"} rounded-2xl rounded-tl-sm px-4 py-3 shadow-md`}>
                  <div className="flex items-center gap-2.5">
                    <div className="flex gap-1.5">
                      <div className="w-2 h-2 bg-[#1F5C99] rounded-full animate-bounce [animation-delay:0.1s] opacity-60" />
                      <div className="w-2 h-2 bg-[#1F5C99] rounded-full animate-bounce [animation-delay:0.25s] opacity-80" />
                      <div className="w-2 h-2 bg-[#1F5C99] rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span className="text-xs text-gray-400 italic">{t.thinking}</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <div className={`relative px-4 py-3 ${darkMode ? "bg-[#1e1e36] border-t border-white/10" : "bg-white border-t border-gray-100"} shadow-lg flex gap-2 items-center`}>
            <VoiceInput
              onTranscript={(text) => { setInput(text); setTimeout(() => sendMessage(text), 100); }}
              langue={currentLangue}
              disabled={isLoading}
            />
            <input
              id="chat-input"
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); sendMessage(); } }}
              placeholder={t.placeholder}
              aria-label="Tapez votre message"
              className={`flex-1 px-4 py-2.5 text-sm placeholder:text-gray-400 rounded-2xl outline-none transition-all duration-200 ${darkMode ? "text-gray-100 border border-white/15 bg-white/5 focus:border-blue-400 focus:bg-white/10 focus:ring-2 focus:ring-blue-400/20" : "text-gray-900 border border-gray-200 bg-gray-50 focus:border-[#1F5C99] focus:bg-white focus:ring-2 focus:ring-[#1F5C99]/10"}`}
              disabled={isLoading}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || isLoading}
              aria-label="Envoyer le message"
              className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1F5C99] to-[#0f3d6e] text-white flex items-center justify-center hover:from-[#174a7a] hover:to-[#0d3460] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 shrink-0 shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Stats bar */}
          <div className={`px-4 py-1.5 ${darkMode ? "bg-[#1e1e36] border-t border-white/10" : "bg-white border-t border-gray-100"} flex gap-4 items-center`}>
            <span className="text-[10px] text-gray-400">
              💬 <strong className="text-gray-600">{messages.length}</strong> messages
            </span>
            <span className="text-[10px] text-gray-400">
              ⚡ <strong className="text-gray-600">{messages.filter(m => m.tools_used && m.tools_used.length > 0).length}</strong> MCP
            </span>
            <span className="text-[10px] text-gray-400">
              📋 <strong className="text-gray-600">{messages.filter(m => m.component === "submission_result").length}</strong> {uiLang === "wo" ? "demandes" : "demandes"}
            </span>
            <span className="text-[10px] text-gray-400">
              {currentLangue === "wolof" ? "🗣️ Wolof" : "🇫🇷 Français"}
            </span>
            <a href="/stats" className="text-[10px] text-gray-400 hover:text-[#1F5C99] transition hidden sm:inline">
              📊 Stats
            </a>
            {/* Bouton satisfaction — apparaît après 3 messages */}
            {messages.length >= 3 && !showSatisfaction && (
              <button
                onClick={() => setShowSatisfaction(true)}
                className="ml-auto text-[10px] bg-blue-50 text-[#1F5C99] border border-blue-200 px-2.5 py-1 rounded-full hover:bg-blue-100 transition font-medium flex items-center gap-1"
              >
                ⭐ {uiLang === "wo" ? "Juge SunuBot" : "Évaluer"}
              </button>
            )}
          </div>

          {/* Formulaire satisfaction */}
          {showSatisfaction && (
            <div className="absolute bottom-20 right-4 z-50 shadow-2xl">
              <SatisfactionForm
                langue={currentLangue}
                service={messages.find(m => m.component === "submission_result")
                  ? (messages.find(m => m.component === "submission_result")?.componentData?.pdfData as {service?: string})?.service
                  : undefined}
                onClose={() => setShowSatisfaction(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
