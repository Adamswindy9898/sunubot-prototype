// Orchestrateur MCP — simule la connexion aux 4 serveurs MCP
// Dans un système réel, ceci communiquerait via le protocole MCP avec les serveurs

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  langue?: "wolof" | "francais" | "mixte";
  metadata?: {
    intention?: string;
    domaine?: string;
    tools_used?: string[];
  };
}

// --- Données simulées provenant des serveurs MCP ---

const WOLOF_INDICATORS = [
  "naa", "nga", "na", "laa", "lay", "ngi",
  "dama", "dinga", "dinaa", "dina",
  "sama", "sunu", "seen",
  "rekk", "lool", "ndax", "mooy",
  "bëgg", "def", "dem", "ñëw", "xam",
  "jërejëf", "waaw", "déedéet",
  "ci", "ak", "bi", "gi", "ji", "wi", "yi",
  "nekk", "am", "wax", "gis",
];

const PHRASES_WOLOF: Record<string, string> = {
  "na nga def": "Comment allez-vous ? / Bonjour",
  "dama bëgg sama kàrt bëccëg": "Je veux mon acte de naissance",
  "fan laa man a jël sama kàrt bëccëg": "Où puis-je obtenir mon acte de naissance ?",
  "naka laa def ngir am kàrt bëccëg": "Comment faire pour avoir un acte de naissance ?",
  "ñaata lay jar kàrt bëccëg bi": "Combien coûte l'acte de naissance ?",
  "dama bëgg bind sama doom": "Je veux déclarer mon enfant",
  "naka laa feyee sama wàll": "Comment payer mes impôts ?",
  "ndax mangi ci jamm ak sama wàll": "Est-ce que je suis en règle avec mes impôts ?",
  "fan la biro wàll bi nekk": "Où se trouve le bureau des impôts ?",
  "dama bëgg ninea": "Je veux un NINEA",
  "jërejëf": "Merci",
  "ndimbal ma": "Aidez-moi",
  "man naa wax ci wolof": "Est-ce que je peux parler en wolof ?",
  "dama bëgg ndimbal": "Je veux de l'aide",
  "lan mooy papye yi": "Quels sont les documents nécessaires ?",
};

const RESPONSES: Record<string, { response: string; tools: string[] }> = {
  // Salutations
  salutation_wolof: {
    response: "Jàmm rekk! 👋 Maa ngi fii ngir la dimbal. Lan moo la bëgg?\n\n(Bonjour ! Je suis là pour vous aider. Que souhaitez-vous ?)\n\nVous pouvez me parler en **wolof** ou en **français**. Je peux vous aider avec :\n- 📋 État civil (actes de naissance, mariage, décès)\n- 💰 Impôts et fiscalité (DGID)\n- 🏥 Sécurité sociale (CNSS)\n- 📝 Formulaires administratifs",
    tools: ["detecter_langue", "detecter_intention"],
  },
  salutation_francais: {
    response: "Bonjour ! 👋 Je suis votre assistant administratif. Comment puis-je vous aider ?\n\nJe peux vous accompagner pour :\n- 📋 **État civil** : actes de naissance, mariage, décès\n- 💰 **Fiscalité (DGID)** : impôts, NINEA, déclarations\n- 🏥 **CNSS** : allocations, retraite\n- 📝 **Formulaires** : remplir et soumettre vos demandes\n\nVous pouvez aussi me parler en **wolof** ! (Man naa dégg wolof)",
    tools: ["detecter_langue"],
  },

  // État civil
  acte_naissance: {
    response: "📋 **Demande d'acte de naissance**\n\nVoici les informations :\n\n**Pièces requises :**\n1. Pièce d'identité (CNI ou passeport)\n2. Ancien acte de naissance (si disponible)\n3. Timbre fiscal de 200 FCFA\n\n**Coût :** 200 FCFA\n**Délai :** 3 à 5 jours ouvrables\n**Lieu :** Centre d'état civil de votre commune de naissance\n\n---\n\nVoulez-vous que je vous aide à remplir le formulaire ? Je peux le pré-remplir avec vos informations.",
    tools: ["detecter_intention", "get_formulaire", "get_pieces_requises"],
  },
  acte_naissance_wolof: {
    response: "📋 **Laaj kàrt bëccëg** (Demande d'acte de naissance)\n\n**Papye yi nga war a indil :**\n1. Kàrt boppam (CNI walla passeport)\n2. Kàrt bëccëg bu yàgg (su am)\n3. Timbre fiscal 200 FCFA\n\n**Ñaata :** 200 FCFA\n**Ñaata bés :** 3 ba 5 bés\n**Fu la dem :** Centre d'état civil ci sa gox\n\n---\n\nBëgg nga ma ndimbal la remplir formulaire bi? Man naa ko def ak sa informations yi.",
    tools: ["detecter_langue", "traduire_wolof_francais", "detecter_intention", "get_formulaire"],
  },

  // Fiscalité
  impots: {
    response: "💰 **Paiement des impôts**\n\nPour payer vos impôts au Sénégal, voici les options :\n\n**Modes de paiement :**\n- 🏦 Virement bancaire\n- 📱 Mobile Money (Orange Money, Wave)\n- 💵 Espèces (au guichet du centre fiscal)\n- 🏧 Chèque certifié\n\n**En ligne :** etax.dgid.sn\n\n**Échéances principales :**\n- TVA : le 20 du mois suivant (mensuel) ou du trimestre\n- IS : 30 avril\n- Patente : 31 janvier\n\nVoulez-vous :\n1. Vérifier votre situation fiscale ?\n2. Connaître votre centre fiscal ?\n3. Calculer vos pénalités de retard ?",
    tools: ["detecter_intention", "get_centre_fiscal", "rechercher_contribuable"],
  },
  impots_wolof: {
    response: "💰 **Fey wàll** (Paiement des impôts)\n\n**Naka nga man a fey :**\n- 🏦 Virement bancaire\n- 📱 Orange Money / Wave\n- 💵 Xaalis (ci guichet bi)\n\n**Ci internet :** etax.dgid.sn\n\n**Dates limites :**\n- TVA : 20 weer wu toftal\n- IS : 30 avril\n- Patente : 31 janvier\n\nLan moo la bëgg?\n1. Gis ndax yaa ngi ci jamm ak sa wàll?\n2. Xam fan la sa centre fiscal nekk?\n3. Calculer sa pénalités?",
    tools: ["detecter_langue", "traduire_wolof_francais", "detecter_intention"],
  },

  // NINEA
  ninea: {
    response: "🏢 **Demande de NINEA** (Numéro d'Identification National des Entreprises)\n\n**Pièces requises :**\n1. CNI du gérant\n2. Statuts de la société (pour SARL/SA)\n3. Registre de commerce\n4. Plan de localisation\n5. 2 photos d'identité\n\n**Coût :** Gratuit\n**Délai :** 5 à 10 jours ouvrables\n**Lieu :** Centre fiscal de votre région\n\n**Régimes possibles :**\n- CGU (CA < 50M FCFA) — petit commerce\n- Réel Simplifié (50M-100M) — PME\n- Réel Normal (> 100M) — grandes entreprises\n\nVoulez-vous que je vous aide à remplir le formulaire d'immatriculation ?",
    tools: ["detecter_intention", "get_formulaire", "get_pieces_requises"],
  },

  // CNSS
  cnss: {
    response: "🏥 **Services CNSS** (Caisse Nationale de Sécurité Sociale)\n\nJe peux vous aider avec :\n\n1. **Immatriculation employeur** — pour déclarer vos salariés\n2. **Allocations familiales** — prestations pour vos enfants\n3. **Pension de retraite** — à partir de 60 ans\n\nQuelle démarche vous intéresse ?",
    tools: ["detecter_intention", "lister_formulaires"],
  },

  // Aide générale
  aide: {
    response: "Je suis votre assistant administratif pour les services publics du Sénégal. 🇸🇳\n\nVoici ce que je peux faire :\n\n📋 **État civil**\n- Obtenir un acte de naissance, mariage ou décès\n- Déclarer une naissance\n\n💰 **Fiscalité (DGID)**\n- Vérifier votre situation fiscale\n- Obtenir un NINEA\n- Payer vos impôts\n\n🏥 **CNSS**\n- Demander les allocations familiales\n- Préparer votre retraite\n\n📝 **Formulaires**\n- Consulter et remplir les formulaires\n- Suivre vos demandes\n\n🗣️ **Je parle français et wolof !**\n\nPosez-moi votre question ou dites-moi ce dont vous avez besoin.",
    tools: ["detecter_langue", "detecter_intention"],
  },

  // Suivi
  suivi: {
    response: "🔍 **Suivi de demande**\n\nPour suivre votre demande, j'ai besoin de votre **numéro de suivi** (ex: dem-001) ou de votre **nom complet**.\n\nQuel est votre numéro de suivi ?",
    tools: ["suivre_demande"],
  },

  // Default
  default: {
    response: "Je comprends votre demande. Pourriez-vous préciser ?\n\nJe peux vous aider avec :\n- 📋 État civil (naissance, mariage, décès)\n- 💰 Impôts / DGID\n- 🏥 CNSS (allocations, retraite)\n- 📝 Formulaires\n\nOu dites-moi simplement ce que vous cherchez !",
    tools: ["detecter_langue", "detecter_intention"],
  },
};

// --- Fonctions d'analyse ---

function detectLanguage(text: string): "wolof" | "francais" | "mixte" {
  const tokens = text.toLowerCase().split(/[\s?!.,;:'"()]+/).filter(Boolean);
  let wolofScore = 0;
  let frenchScore = 0;

  const frenchIndicators = ["je", "tu", "il", "nous", "vous", "est", "les", "des", "pour", "mon", "une", "que", "comment", "bonjour"];

  for (const token of tokens) {
    if (WOLOF_INDICATORS.includes(token)) wolofScore++;
    if (frenchIndicators.includes(token)) frenchScore++;
  }

  // Check full phrases
  const lower = text.toLowerCase().trim();
  for (const phrase of Object.keys(PHRASES_WOLOF)) {
    if (lower.includes(phrase)) wolofScore += 3;
  }

  if (wolofScore > frenchScore * 1.2) return "wolof";
  if (frenchScore > wolofScore * 1.2) return "francais";
  if (wolofScore > 0 && frenchScore > 0) return "mixte";
  return "francais";
}

function detectIntent(text: string): string {
  const lower = text.toLowerCase();

  // Salutations
  if (lower.match(/^(bonjour|salut|hello|bonsoir|hi)/)) return "salutation_francais";
  if (lower.match(/(na nga def|asalaa|maalekum|mangi fi)/)) return "salutation_wolof";

  // Acte de naissance
  if (lower.match(/(acte.*naissance|extrait.*naissance|naissance|kàrt bëccëg|bëccëg|juddu)/)) {
    return detectLanguage(text) === "wolof" ? "acte_naissance_wolof" : "acte_naissance";
  }

  // Impôts
  if (lower.match(/(imp[oô]t|fiscal|tva|payer.*imp|declaration|wàll|fey.*wàll|feyee)/)) {
    return detectLanguage(text) === "wolof" ? "impots_wolof" : "impots";
  }

  // NINEA
  if (lower.match(/(ninea|immatricul|crée?r.*entreprise|entreprise)/)) return "ninea";

  // CNSS
  if (lower.match(/(cnss|retraite|allocation|sécurité sociale|pension)/)) return "cnss";

  // Suivi
  if (lower.match(/(suivi|suivre|dem-\d|statut.*demande|où en est)/)) return "suivi";

  // Aide
  if (lower.match(/(aide|help|ndimbal|comment.*march|que.*faire|quoi)/)) return "aide";

  // Wolof général
  if (lower.match(/(dama bëgg|bëgg|laaj|ndimbal ma)/)) return "aide";

  return "default";
}

// --- Fonction principale d'orchestration ---

export function processMessage(text: string, langue_forcee?: string): {
  response: string;
  langue: "wolof" | "francais" | "mixte";
  intent: string;
  tools_used: string[];
} {
  const langueDetectee = detectLanguage(text);
  const langue = (langue_forcee as "wolof" | "francais" | "mixte") || langueDetectee;
  const intent = detectIntent(text);

  // Adapter la réponse selon la langue forcée
  let intentKey = intent;
  if (langue === "wolof" && !intent.includes("wolof")) {
    const wolofVersion = intent + "_wolof";
    if (RESPONSES[wolofVersion]) intentKey = wolofVersion;
  } else if (langue === "francais" && intent.includes("wolof")) {
    intentKey = intent.replace("_wolof", "");
  }

  const responseData = RESPONSES[intentKey] || RESPONSES[intent] || RESPONSES["default"];

  return {
    response: responseData.response,
    langue,
    intent,
    tools_used: responseData.tools,
  };
}
