import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  dictionnaire,
  phrasesAdmin,
  reglesGrammaire,
  indicateursWolof,
  indicateursFrancais,
} from "./corpus.js";

const server = new McpServer({
  name: "wolof-nlp",
  version: "1.0.0",
  description:
    "Serveur MCP pour le traitement du langage naturel wolof — détection de langue, traduction, tokenisation et analyse d'intention",
});

// === FONCTIONS UTILITAIRES NLP ===

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[?!.,;:'"()]/g, "")
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function detectLanguage(text: string): {
  langue: "wolof" | "francais" | "mixte";
  score_wolof: number;
  score_francais: number;
  confiance: number;
} {
  const tokens = tokenize(text);
  let scoreWolof = 0;
  let scoreFrancais = 0;

  for (const token of tokens) {
    if (indicateursWolof.includes(token)) scoreWolof++;
    if (indicateursFrancais.includes(token)) scoreFrancais++;
  }

  // Vérifier aussi dans le dictionnaire wolof
  for (const entry of dictionnaire) {
    const mots = entry.wolof.toLowerCase().split(/\s+/);
    for (const mot of mots) {
      if (tokens.includes(mot)) scoreWolof += 0.5;
    }
  }

  const total = scoreWolof + scoreFrancais;
  let langue: "wolof" | "francais" | "mixte";
  let confiance: number;

  if (total === 0) {
    langue = "francais";
    confiance = 0.3;
  } else if (scoreWolof > scoreFrancais * 1.5) {
    langue = "wolof";
    confiance = Math.min(scoreWolof / tokens.length, 1);
  } else if (scoreFrancais > scoreWolof * 1.5) {
    langue = "francais";
    confiance = Math.min(scoreFrancais / tokens.length, 1);
  } else {
    langue = "mixte";
    confiance = 0.5;
  }

  return {
    langue,
    score_wolof: Math.round(scoreWolof * 100) / 100,
    score_francais: Math.round(scoreFrancais * 100) / 100,
    confiance: Math.round(confiance * 100) / 100,
  };
}

function translateWolofToFrench(text: string): {
  traduction: string;
  mots_traduits: Array<{ wolof: string; francais: string }>;
  mots_non_traduits: string[];
} {
  // Chercher d'abord une phrase complète correspondante
  const textLower = text.toLowerCase().trim();
  const phraseMatch = phrasesAdmin.find(
    (p) => p.wolof.toLowerCase() === textLower
  );

  if (phraseMatch) {
    return {
      traduction: phraseMatch.francais,
      mots_traduits: [{ wolof: phraseMatch.wolof, francais: phraseMatch.francais }],
      mots_non_traduits: [],
    };
  }

  // Sinon, traduire mot par mot
  const tokens = tokenize(text);
  const motsTraduits: Array<{ wolof: string; francais: string }> = [];
  const motsNonTraduits: string[] = [];
  const traductionParts: string[] = [];

  for (const token of tokens) {
    const entry = dictionnaire.find(
      (d) => d.wolof.toLowerCase() === token
    );
    if (entry) {
      motsTraduits.push({ wolof: token, francais: entry.francais });
      traductionParts.push(entry.francais);
    } else {
      // Chercher dans les expressions multi-mots
      const multiWord = dictionnaire.find(
        (d) => d.wolof.toLowerCase().includes(token) && d.wolof.split(" ").length > 1
      );
      if (multiWord) {
        motsTraduits.push({ wolof: token, francais: `(partie de: ${multiWord.francais})` });
        traductionParts.push(`[${token}]`);
      } else {
        motsNonTraduits.push(token);
        traductionParts.push(`[${token}]`);
      }
    }
  }

  return {
    traduction: traductionParts.join(" "),
    mots_traduits: motsTraduits,
    mots_non_traduits: motsNonTraduits,
  };
}

function detectIntention(text: string): {
  intention: string;
  domaine: string;
  confiance: number;
} {
  const textLower = text.toLowerCase();

  // Chercher une correspondance dans les phrases admin
  let bestMatch = null;
  let bestScore = 0;

  for (const phrase of phrasesAdmin) {
    const phraseTokens = tokenize(phrase.wolof);
    const textTokens = tokenize(textLower);
    let matches = 0;

    for (const pt of phraseTokens) {
      if (textTokens.includes(pt)) matches++;
    }

    const score = phraseTokens.length > 0 ? matches / phraseTokens.length : 0;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = phrase;
    }
  }

  // Aussi tester avec le texte en français
  for (const phrase of phrasesAdmin) {
    const phraseTokens = tokenize(phrase.francais);
    const textTokens = tokenize(textLower);
    let matches = 0;

    for (const pt of phraseTokens) {
      if (textTokens.includes(pt)) matches++;
    }

    const score = phraseTokens.length > 0 ? matches / phraseTokens.length : 0;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = phrase;
    }
  }

  if (bestMatch && bestScore > 0.3) {
    return {
      intention: bestMatch.intention,
      domaine: bestMatch.domaine,
      confiance: Math.round(bestScore * 100) / 100,
    };
  }

  return {
    intention: "inconnue",
    domaine: "general",
    confiance: 0,
  };
}

// === TOOLS MCP ===

// Tool 1 : Détecter la langue (wolof, français ou mixte)
server.tool(
  "detecter_langue",
  "Détecte si un texte est en wolof, en français, ou un mélange des deux",
  {
    texte: z.string().describe("Le texte à analyser"),
  },
  async ({ texte }) => {
    const result = detectLanguage(texte);
    const tokens = tokenize(texte);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              texte_original: texte,
              langue_detectee: result.langue,
              scores: {
                wolof: result.score_wolof,
                francais: result.score_francais,
              },
              confiance: result.confiance,
              nombre_tokens: tokens.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 2 : Traduire du wolof vers le français
server.tool(
  "traduire_wolof_francais",
  "Traduit un texte du wolof vers le français en utilisant le dictionnaire et le corpus de phrases",
  {
    texte: z.string().describe("Texte en wolof à traduire"),
  },
  async ({ texte }) => {
    const result = translateWolofToFrench(texte);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              texte_original: texte,
              traduction: result.traduction,
              details: {
                mots_traduits: result.mots_traduits,
                mots_non_traduits: result.mots_non_traduits,
                couverture: result.mots_non_traduits.length === 0
                  ? "complète"
                  : `partielle (${result.mots_non_traduits.length} mot(s) non reconnu(s))`,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 3 : Détecter l'intention de l'utilisateur
server.tool(
  "detecter_intention",
  "Analyse un message (wolof ou français) pour identifier l'intention et le domaine administratif concerné",
  {
    texte: z.string().describe("Message de l'utilisateur à analyser"),
  },
  async ({ texte }) => {
    const langue = detectLanguage(texte);
    const intention = detectIntention(texte);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              texte_original: texte,
              langue: langue.langue,
              intention: intention.intention,
              domaine: intention.domaine,
              confiance: intention.confiance,
              action_suggeree: getActionSuggeree(intention.intention, intention.domaine),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 4 : Tokeniser un texte wolof
server.tool(
  "tokeniser_wolof",
  "Découpe un texte wolof en tokens avec analyse morphologique basique",
  {
    texte: z.string().describe("Texte wolof à tokeniser"),
  },
  async ({ texte }) => {
    const tokens = tokenize(texte);
    const analyse = tokens.map((token) => {
      const entry = dictionnaire.find((d) => d.wolof.toLowerCase() === token);
      return {
        token,
        traduction: entry ? entry.francais : null,
        categorie: entry ? entry.categorie : "inconnu",
        est_indicateur_wolof: indicateursWolof.includes(token),
      };
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              texte_original: texte,
              nombre_tokens: tokens.length,
              tokens: analyse,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 5 : Chercher dans le dictionnaire
server.tool(
  "chercher_dictionnaire",
  "Recherche un mot ou une expression dans le dictionnaire wolof-français",
  {
    mot: z.string().describe("Mot à chercher (en wolof ou en français)"),
    langue_source: z
      .enum(["wolof", "francais"])
      .optional()
      .describe("Langue du mot recherché (par défaut: recherche dans les deux)"),
  },
  async ({ mot, langue_source }) => {
    const motLower = mot.toLowerCase();
    let resultats;

    if (langue_source === "wolof") {
      resultats = dictionnaire.filter((d) =>
        d.wolof.toLowerCase().includes(motLower)
      );
    } else if (langue_source === "francais") {
      resultats = dictionnaire.filter((d) =>
        d.francais.toLowerCase().includes(motLower)
      );
    } else {
      resultats = dictionnaire.filter(
        (d) =>
          d.wolof.toLowerCase().includes(motLower) ||
          d.francais.toLowerCase().includes(motLower)
      );
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              recherche: mot,
              resultats: resultats.map((r) => ({
                wolof: r.wolof,
                francais: r.francais,
                categorie: r.categorie,
                exemple: r.exemple_wolof
                  ? { wolof: r.exemple_wolof, francais: r.exemple_francais }
                  : undefined,
              })),
              total: resultats.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 6 : Normaliser un texte wolof
server.tool(
  "normaliser_wolof",
  "Normalise un texte wolof (correction orthographique basique, standardisation)",
  {
    texte: z.string().describe("Texte wolof à normaliser"),
  },
  async ({ texte }) => {
    // Règles de normalisation du wolof
    let normalise = texte;

    // Corrections courantes
    const corrections: Record<string, string> = {
      "naanga def": "na nga def",
      "nangadef": "na nga def",
      "jerejef": "jërejëf",
      "dieuredieuf": "jërejëf",
      "inchallah": "inshaa Allah",
      "ndeysan": "ndey san",
      "yalla": "Yàlla",
      "ndeysane": "ndey san",
      "dedet": "déedéet",
      "waaw": "waaw",
      "balma": "baal ma",
      "mangifii": "mangi fi",
      "damay": "dama -y",
    };

    for (const [incorrect, correct] of Object.entries(corrections)) {
      const regex = new RegExp(incorrect, "gi");
      normalise = normalise.replace(regex, correct);
    }

    // Standardiser les caractères spéciaux wolof
    normalise = normalise
      .replace(/e(?=[^ë])/g, (match, offset, str) => {
        // Ne pas remplacer les 'e' qui font partie de mots français
        return match;
      });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              texte_original: texte,
              texte_normalise: normalise,
              corrections_appliquees: Object.entries(corrections)
                .filter(([incorrect]) =>
                  texte.toLowerCase().includes(incorrect)
                )
                .map(([incorrect, correct]) => ({
                  avant: incorrect,
                  apres: correct,
                })),
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// === FONCTION HELPER ===

function getActionSuggeree(intention: string, domaine: string): string {
  const actions: Record<string, Record<string, string>> = {
    demande_document: {
      etat_civil: "Utiliser le serveur MCP État Civil pour rechercher/fournir le document",
      dgid: "Utiliser le serveur MCP DGID pour les documents fiscaux",
      cnss: "Utiliser le serveur MCP CNSS pour les documents sociaux",
      general: "Identifier le type de document demandé puis router vers le bon serveur",
    },
    question_lieu: {
      etat_civil: "Consulter la resource 'centres-etat-civil' pour localiser le centre",
      dgid: "Consulter la resource 'centres-fiscaux' pour localiser le bureau",
      cnss: "Fournir les coordonnées de l'agence CNSS la plus proche",
      general: "Déterminer le service concerné et fournir la localisation",
    },
    question_procedure: {
      etat_civil: "Expliquer les étapes pour obtenir le document d'état civil",
      dgid: "Expliquer la procédure fiscale (déclaration, paiement, immatriculation)",
      cnss: "Expliquer la procédure d'inscription ou de demande CNSS",
      general: "Identifier la procédure et donner les étapes",
    },
    question_cout: {
      etat_civil: "Fournir le tarif du document (timbre fiscal, frais)",
      dgid: "Calculer le montant de l'impôt ou de la pénalité",
      cnss: "Indiquer les cotisations ou montants",
      general: "Identifier le service et donner le tarif",
    },
    question_delai: {
      etat_civil: "Indiquer le délai de délivrance du document",
      dgid: "Consulter le calendrier fiscal pour les échéances",
      cnss: "Indiquer les délais de traitement CNSS",
      general: "Estimer le délai selon le service",
    },
    question_fiscale: {
      dgid: "Utiliser les tools DGID (get_statut_fiscal, calculer_penalites)",
      general: "Router vers le serveur DGID",
      etat_civil: "Router vers le serveur DGID",
      cnss: "Router vers le serveur DGID",
    },
    salutation: {
      general: "Répondre à la salutation en wolof ou français selon la langue détectée",
      etat_civil: "Répondre et demander comment aider",
      dgid: "Répondre et demander comment aider",
      cnss: "Répondre et demander comment aider",
    },
  };

  return actions[intention]?.[domaine] || "Demander des précisions à l'utilisateur";
}

// === RESOURCES ===

// Resource : Dictionnaire wolof-français complet
server.resource(
  "dictionnaire-wolof",
  "wolof-nlp://dictionnaire",
  async (uri) => {
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              total_entrees: dictionnaire.length,
              categories: {
                administratif: dictionnaire.filter((d) => d.categorie === "administratif").length,
                salutation: dictionnaire.filter((d) => d.categorie === "salutation").length,
                verbe: dictionnaire.filter((d) => d.categorie === "verbe").length,
                question: dictionnaire.filter((d) => d.categorie === "question").length,
                nom: dictionnaire.filter((d) => d.categorie === "nom").length,
                nombre: dictionnaire.filter((d) => d.categorie === "nombre").length,
              },
              entrees: dictionnaire,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Resource : Corpus de phrases administratives
server.resource(
  "phrases-admin",
  "wolof-nlp://phrases-admin",
  async (uri) => {
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              total_phrases: phrasesAdmin.length,
              par_domaine: {
                etat_civil: phrasesAdmin.filter((p) => p.domaine === "etat_civil").length,
                dgid: phrasesAdmin.filter((p) => p.domaine === "dgid").length,
                cnss: phrasesAdmin.filter((p) => p.domaine === "cnss").length,
                general: phrasesAdmin.filter((p) => p.domaine === "general").length,
              },
              par_intention: {
                demande_document: phrasesAdmin.filter((p) => p.intention === "demande_document").length,
                question_procedure: phrasesAdmin.filter((p) => p.intention === "question_procedure").length,
                question_lieu: phrasesAdmin.filter((p) => p.intention === "question_lieu").length,
                question_cout: phrasesAdmin.filter((p) => p.intention === "question_cout").length,
                question_delai: phrasesAdmin.filter((p) => p.intention === "question_delai").length,
                question_fiscale: phrasesAdmin.filter((p) => p.intention === "question_fiscale").length,
              },
              phrases: phrasesAdmin,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Resource : Règles de grammaire wolof
server.resource(
  "grammaire-wolof",
  "wolof-nlp://grammaire",
  async (uri) => {
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(reglesGrammaire, null, 2),
        },
      ],
    };
  }
);

// === DÉMARRAGE DU SERVEUR ===

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Serveur MCP Wolof NLP démarré avec succès.");
}

main().catch((error) => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});
