// === DICTIONNAIRE WOLOF-FRANÇAIS (termes administratifs et courants) ===

export interface DictionaryEntry {
  wolof: string;
  francais: string;
  categorie: "administratif" | "salutation" | "question" | "verbe" | "nom" | "adjectif" | "expression" | "nombre";
  exemple_wolof?: string;
  exemple_francais?: string;
}

export const dictionnaire: DictionaryEntry[] = [
  // --- SALUTATIONS ---
  { wolof: "na nga def", francais: "comment vas-tu / bonjour", categorie: "salutation" },
  { wolof: "mangi fi rekk", francais: "je vais bien", categorie: "salutation" },
  { wolof: "asalaa maalekum", francais: "bonjour (salutation islamique)", categorie: "salutation" },
  { wolof: "maalekum salaam", francais: "bonjour (réponse)", categorie: "salutation" },
  { wolof: "jërejëf", francais: "merci", categorie: "salutation" },
  { wolof: "baal ma", francais: "excusez-moi / pardon", categorie: "salutation" },
  { wolof: "ba beneen", francais: "au revoir / à bientôt", categorie: "salutation" },
  { wolof: "am na", francais: "il y a / c'est disponible", categorie: "salutation" },

  // --- TERMES ADMINISTRATIFS ---
  { wolof: "kàrt bëccëg", francais: "acte de naissance", categorie: "administratif", exemple_wolof: "Dama bëgg sama kàrt bëccëg", exemple_francais: "Je veux mon acte de naissance" },
  { wolof: "kàrt takk", francais: "acte de mariage", categorie: "administratif", exemple_wolof: "Fan laa man a jël sama kàrt takk?", exemple_francais: "Où puis-je obtenir mon acte de mariage?" },
  { wolof: "kàrt dee", francais: "acte de décès", categorie: "administratif" },
  { wolof: "kàrt pàcc", francais: "acte de divorce", categorie: "administratif" },
  { wolof: "kàrt boppam", francais: "carte d'identité", categorie: "administratif", exemple_wolof: "Sama kàrt boppam jeex na", exemple_francais: "Ma carte d'identité est expirée" },
  { wolof: "pàaspoor", francais: "passeport", categorie: "administratif" },
  { wolof: "séy", francais: "mariage", categorie: "administratif" },
  { wolof: "takk", francais: "se marier / mariage", categorie: "administratif" },
  { wolof: "juddu", francais: "naître / naissance", categorie: "administratif" },
  { wolof: "dee", francais: "mourir / décès", categorie: "administratif" },
  { wolof: "buur", francais: "état / gouvernement", categorie: "administratif" },
  { wolof: "gox", francais: "commune / quartier", categorie: "administratif" },
  { wolof: "meeri", francais: "mairie", categorie: "administratif" },
  { wolof: "préfe", francais: "préfecture", categorie: "administratif" },
  { wolof: "alkaati", francais: "officier d'état civil", categorie: "administratif" },
  { wolof: "njàng", francais: "scolarité / études", categorie: "administratif" },
  { wolof: "liggéey", francais: "travail / emploi", categorie: "administratif" },
  { wolof: "xaalis", francais: "argent", categorie: "administratif" },
  { wolof: "wàll", francais: "impôt / taxe", categorie: "administratif", exemple_wolof: "Naka laa feyee sama wàll?", exemple_francais: "Comment payer mes impôts?" },
  { wolof: "feye", francais: "payer", categorie: "administratif" },
  { wolof: "jëf", francais: "démarche / procédure", categorie: "administratif" },
  { wolof: "papye", francais: "document / papier", categorie: "administratif" },
  { wolof: "sañ-sañ", francais: "autorisation / permis", categorie: "administratif" },
  { wolof: "dossiye", francais: "dossier", categorie: "administratif" },
  { wolof: "ndimbal", francais: "aide / assistance", categorie: "administratif" },

  // --- VERBES COURANTS ---
  { wolof: "bëgg", francais: "vouloir", categorie: "verbe", exemple_wolof: "Dama bëgg ndimbal", exemple_francais: "Je veux de l'aide" },
  { wolof: "laaj", francais: "demander / poser une question", categorie: "verbe" },
  { wolof: "def", francais: "faire", categorie: "verbe" },
  { wolof: "jël", francais: "prendre / obtenir", categorie: "verbe" },
  { wolof: "am", francais: "avoir", categorie: "verbe" },
  { wolof: "nekk", francais: "être / se trouver", categorie: "verbe" },
  { wolof: "dem", francais: "aller", categorie: "verbe" },
  { wolof: "ñëw", francais: "venir", categorie: "verbe" },
  { wolof: "xam", francais: "savoir / connaître", categorie: "verbe" },
  { wolof: "gis", francais: "voir / consulter", categorie: "verbe" },
  { wolof: "bind", francais: "écrire / inscrire", categorie: "verbe" },
  { wolof: "jàng", francais: "lire / étudier", categorie: "verbe" },
  { wolof: "wax", francais: "dire / parler", categorie: "verbe" },
  { wolof: "dëgg", francais: "entendre / comprendre", categorie: "verbe" },
  { wolof: "naan", francais: "boire", categorie: "verbe" },
  { wolof: "lekk", francais: "manger", categorie: "verbe" },

  // --- QUESTIONS ---
  { wolof: "fan", francais: "où", categorie: "question", exemple_wolof: "Fan la meeri bi nekk?", exemple_francais: "Où se trouve la mairie?" },
  { wolof: "kañ", francais: "quand", categorie: "question", exemple_wolof: "Kañ laa man a ñëw?", exemple_francais: "Quand puis-je venir?" },
  { wolof: "naka", francais: "comment", categorie: "question", exemple_wolof: "Naka laa def?", exemple_francais: "Comment faire?" },
  { wolof: "lan", francais: "quoi / que", categorie: "question", exemple_wolof: "Lan mooy jëf yi?", exemple_francais: "Quelles sont les démarches?" },
  { wolof: "ñaata", francais: "combien", categorie: "question", exemple_wolof: "Ñaata lay jar?", exemple_francais: "Combien ça coûte?" },
  { wolof: "ku", francais: "qui", categorie: "question" },
  { wolof: "ndax", francais: "est-ce que", categorie: "question" },
  { wolof: "ana", francais: "où est", categorie: "question", exemple_wolof: "Ana sama dossiye?", exemple_francais: "Où est mon dossier?" },

  // --- NOMS COURANTS ---
  { wolof: "nit", francais: "personne / citoyen", categorie: "nom" },
  { wolof: "doom", francais: "enfant", categorie: "nom" },
  { wolof: "baay", francais: "père", categorie: "nom" },
  { wolof: "yaay", francais: "mère", categorie: "nom" },
  { wolof: "jabar", francais: "épouse", categorie: "nom" },
  { wolof: "jëkkër", francais: "époux / mari", categorie: "nom" },
  { wolof: "kër", francais: "maison / foyer", categorie: "nom" },
  { wolof: "dëkk", francais: "ville / pays", categorie: "nom" },
  { wolof: "réew", francais: "pays", categorie: "nom" },
  { wolof: "weer", francais: "mois", categorie: "nom" },
  { wolof: "at", francais: "année", categorie: "nom" },
  { wolof: "bés", francais: "jour", categorie: "nom" },
  { wolof: "tur", francais: "nom / prénom", categorie: "nom" },

  // --- NOMBRES ---
  { wolof: "benn", francais: "un (1)", categorie: "nombre" },
  { wolof: "ñaar", francais: "deux (2)", categorie: "nombre" },
  { wolof: "ñett", francais: "trois (3)", categorie: "nombre" },
  { wolof: "ñeent", francais: "quatre (4)", categorie: "nombre" },
  { wolof: "juróom", francais: "cinq (5)", categorie: "nombre" },
  { wolof: "juróom-benn", francais: "six (6)", categorie: "nombre" },
  { wolof: "juróom-ñaar", francais: "sept (7)", categorie: "nombre" },
  { wolof: "juróom-ñett", francais: "huit (8)", categorie: "nombre" },
  { wolof: "juróom-ñeent", francais: "neuf (9)", categorie: "nombre" },
  { wolof: "fukk", francais: "dix (10)", categorie: "nombre" },
  { wolof: "téeméer", francais: "cent (100)", categorie: "nombre" },
  { wolof: "junni", francais: "mille (1000)", categorie: "nombre" },
];

// === EXPRESSIONS ADMINISTRATIVES COMPLÈTES (wolof → français) ===

export interface AdminPhrase {
  id: string;
  wolof: string;
  francais: string;
  intention: "demande_document" | "question_lieu" | "question_procedure" | "question_cout" | "question_delai" | "salutation" | "remerciement" | "plainte" | "question_fiscale";
  domaine: "etat_civil" | "dgid" | "general" | "cnss";
}

export const phrasesAdmin: AdminPhrase[] = [
  // --- ÉTAT CIVIL ---
  { id: "ph-001", wolof: "Dama bëgg sama kàrt bëccëg", francais: "Je veux mon acte de naissance", intention: "demande_document", domaine: "etat_civil" },
  { id: "ph-002", wolof: "Fan laa man a jël sama kàrt bëccëg?", francais: "Où puis-je obtenir mon acte de naissance?", intention: "question_lieu", domaine: "etat_civil" },
  { id: "ph-003", wolof: "Naka laa def ngir am kàrt bëccëg?", francais: "Comment faire pour avoir un acte de naissance?", intention: "question_procedure", domaine: "etat_civil" },
  { id: "ph-004", wolof: "Ñaata lay jar kàrt bëccëg bi?", francais: "Combien coûte l'acte de naissance?", intention: "question_cout", domaine: "etat_civil" },
  { id: "ph-005", wolof: "Ñaata bés moy nettali ba mu jot?", francais: "Combien de jours faut-il attendre?", intention: "question_delai", domaine: "etat_civil" },
  { id: "ph-006", wolof: "Dama bëgg bind sama doom", francais: "Je veux déclarer (inscrire) mon enfant", intention: "demande_document", domaine: "etat_civil" },
  { id: "ph-007", wolof: "Kañ mooy waxtu meeri bi?", francais: "Quels sont les horaires de la mairie?", intention: "question_lieu", domaine: "etat_civil" },
  { id: "ph-008", wolof: "Lan mooy papye yi ci kàrt takk?", francais: "Quels sont les documents pour l'acte de mariage?", intention: "question_procedure", domaine: "etat_civil" },
  { id: "ph-009", wolof: "Sama kàrt boppam jeex na, naka laa def?", francais: "Ma carte d'identité est expirée, comment faire?", intention: "question_procedure", domaine: "etat_civil" },
  { id: "ph-010", wolof: "Dama bëgg yeesal sama kàrt bëccëg", francais: "Je veux mettre à jour mon acte de naissance", intention: "demande_document", domaine: "etat_civil" },
  { id: "ph-011", wolof: "Ana alkaati bi?", francais: "Où est l'officier d'état civil?", intention: "question_lieu", domaine: "etat_civil" },
  { id: "ph-012", wolof: "Dama bëgg kàrt dee ci sama baay", francais: "Je veux l'acte de décès de mon père", intention: "demande_document", domaine: "etat_civil" },

  // --- DGID / FISCALITÉ ---
  { id: "ph-013", wolof: "Naka laa feyee sama wàll?", francais: "Comment payer mes impôts?", intention: "question_fiscale", domaine: "dgid" },
  { id: "ph-014", wolof: "Ndax mangi ci jamm ak sama wàll?", francais: "Est-ce que je suis en règle avec mes impôts?", intention: "question_fiscale", domaine: "dgid" },
  { id: "ph-015", wolof: "Ñaata laa war a fey?", francais: "Combien dois-je payer?", intention: "question_cout", domaine: "dgid" },
  { id: "ph-016", wolof: "Fan la biro wàll bi nekk?", francais: "Où se trouve le bureau des impôts?", intention: "question_lieu", domaine: "dgid" },
  { id: "ph-017", wolof: "Kañ mooy limit fey wàll bi?", francais: "Quelle est la date limite de paiement des impôts?", intention: "question_delai", domaine: "dgid" },
  { id: "ph-018", wolof: "Dama bëgg NINEA", francais: "Je veux un NINEA (numéro d'identification)", intention: "demande_document", domaine: "dgid" },
  { id: "ph-019", wolof: "Naka laa def ngir bind sama entreprise?", francais: "Comment faire pour immatriculer mon entreprise?", intention: "question_procedure", domaine: "dgid" },
  { id: "ph-020", wolof: "Dama am retard ci sama déclaration", francais: "Je suis en retard pour ma déclaration", intention: "question_fiscale", domaine: "dgid" },
  { id: "ph-021", wolof: "Ñaata mooy pénalité bi?", francais: "Combien est la pénalité?", intention: "question_cout", domaine: "dgid" },
  { id: "ph-022", wolof: "Ndax man naa fey ak Orange Money?", francais: "Est-ce que je peux payer avec Orange Money?", intention: "question_procedure", domaine: "dgid" },

  // --- CNSS (Sécurité Sociale) ---
  { id: "ph-023", wolof: "Naka laa def ngir am allocations?", francais: "Comment faire pour avoir les allocations?", intention: "question_procedure", domaine: "cnss" },
  { id: "ph-024", wolof: "Dama bëgg bind ci CNSS", francais: "Je veux m'inscrire à la CNSS", intention: "demande_document", domaine: "cnss" },
  { id: "ph-025", wolof: "Ana sama numéro CNSS?", francais: "Où est mon numéro CNSS?", intention: "question_procedure", domaine: "cnss" },
  { id: "ph-026", wolof: "Kañ laa man a jël sama retraite?", francais: "Quand puis-je prendre ma retraite?", intention: "question_delai", domaine: "cnss" },

  // --- GÉNÉRAL ---
  { id: "ph-027", wolof: "Na nga def, dama bëgg ndimbal", francais: "Bonjour, je veux de l'aide", intention: "salutation", domaine: "general" },
  { id: "ph-028", wolof: "Jërejëf, yow dëgg nga lool", francais: "Merci, tu m'as beaucoup aidé", intention: "remerciement", domaine: "general" },
  { id: "ph-029", wolof: "Déedéet, duma dëgg li ngay wax", francais: "Non, je ne comprends pas ce que tu dis", intention: "plainte", domaine: "general" },
  { id: "ph-030", wolof: "Man naa wax ci wolof?", francais: "Est-ce que je peux parler en wolof?", intention: "salutation", domaine: "general" },
  { id: "ph-031", wolof: "Ndimbal ma ci jëf yi", francais: "Aide-moi avec les démarches", intention: "demande_document", domaine: "general" },
  { id: "ph-032", wolof: "Lii tax lool, war nañu ko wàññi", francais: "C'est trop cher, il faut réduire", intention: "plainte", domaine: "general" },
  { id: "ph-033", wolof: "Bu la neexee, jox ma informations yi", francais: "S'il te plaît, donne-moi les informations", intention: "demande_document", domaine: "general" },
  { id: "ph-034", wolof: "Xam naa ne amal na probleem", francais: "Je sais qu'il y a un problème", intention: "plainte", domaine: "general" },
  { id: "ph-035", wolof: "Dinga ma wax lan mooy étape yi?", francais: "Tu vas me dire quelles sont les étapes?", intention: "question_procedure", domaine: "general" },
];

// === RÈGLES DE GRAMMAIRE WOLOF (pour la tokenisation) ===

export interface GrammarRule {
  nom: string;
  description: string;
  pattern: string;
  exemple: string;
}

export const reglesGrammaire: GrammarRule[] = [
  {
    nom: "Marqueur sujet (emphase)",
    description: "En wolof, le sujet peut être mis en emphase avec des marqueurs comme 'maa' (moi), 'yaa' (toi), 'moo' (lui/elle)",
    pattern: "(maa|yaa|moo|ñoo|yeena) + verbe",
    exemple: "Maa ngi dem → C'est moi qui pars",
  },
  {
    nom: "Négation",
    description: "La négation en wolof se forme avec 'du' (ne...pas au présent) ou 'duma' (je ne...pas)",
    pattern: "du/duma/doo/dunu + verbe",
    exemple: "Duma dem → Je ne pars pas",
  },
  {
    nom: "Passé (narratif)",
    description: "Le passé narratif utilise le suffixe '-oon' ou le marqueur 'woon'",
    pattern: "verbe + -oon / na + verbe + -oon",
    exemple: "Dem naa woon → J'étais parti",
  },
  {
    nom: "Futur",
    description: "Le futur se forme avec 'dinaa' (je vais), 'dinga' (tu vas), 'dina' (il/elle va)",
    pattern: "dinaa/dinga/dina/dinañu + verbe",
    exemple: "Dinaa dem → Je vais partir",
  },
  {
    nom: "Question",
    description: "Les questions utilisent les mots interrogatifs en début ou fin de phrase",
    pattern: "fan/kañ/naka/lan/ñaata/ku/ndax + phrase",
    exemple: "Fan nga dem? → Où vas-tu?",
  },
  {
    nom: "Présent progressif",
    description: "Le présent progressif utilise 'maa ngi' (je suis en train de) avec le verbe",
    pattern: "maa ngi/yaa ngi/mu ngi + verbe",
    exemple: "Maa ngi liggéey → Je suis en train de travailler",
  },
  {
    nom: "Impératif",
    description: "L'impératif est la forme de base du verbe (sans marqueur)",
    pattern: "verbe + (complement)",
    exemple: "Dem! → Pars! / Kaay! → Viens!",
  },
  {
    nom: "Connecteur possessif",
    description: "Le possessif utilise 'sama' (mon), 'sa' (ton), 'am' (son), 'sunu' (notre)",
    pattern: "sama/sa/am/sunu/seen + nom",
    exemple: "Sama kër → Ma maison",
  },
];

// === INDICATEURS DE LANGUE (pour la détection wolof vs français) ===

export const indicateursWolof: string[] = [
  "naa", "nga", "na", "laa", "lay", "ngi",
  "dama", "dinga", "dinaa", "dina",
  "sama", "sunu", "seen",
  "rekk", "lool", "ndax", "mooy",
  "bëgg", "def", "dem", "ñëw", "xam",
  "wolof", "jërejëf", "waaw", "déedéet",
  "ci", "ak", "bi", "gi", "ji", "wi", "yi",
  "bu", "su", "mu", "lu", "gu", "ku",
  "nekk", "am", "wax", "gis",
];

export const indicateursFrancais: string[] = [
  "je", "tu", "il", "elle", "nous", "vous", "ils", "elles",
  "le", "la", "les", "un", "une", "des",
  "est", "suis", "sont", "avons", "avez",
  "de", "du", "au", "aux",
  "que", "qui", "quoi", "comment", "pourquoi", "quand",
  "pour", "avec", "dans", "sur", "par",
  "mon", "ton", "son", "notre", "votre", "leur",
  "ce", "cette", "ces", "cet",
  "pas", "ne", "plus", "jamais",
  "faire", "avoir", "être", "aller", "vouloir",
];
