import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { actesNaissance, actesMariage, actesDeces } from "./data.js";

const server = new McpServer({
  name: "etat-civil-senegal",
  version: "1.0.0",
  description:
    "Serveur MCP pour l'accès aux données d'état civil du Sénégal (naissances, mariages, décès)",
});

// === TOOLS (fonctions appelables par le chatbot) ===

// Tool 1 : Rechercher un citoyen par nom
server.tool(
  "rechercher_citoyen",
  "Recherche un citoyen dans les registres d'état civil par nom ou prénom",
  {
    query: z.string().describe("Nom ou prénom du citoyen à rechercher"),
  },
  async ({ query }) => {
    const queryLower = query.toLowerCase();

    const resultats = actesNaissance.filter(
      (acte) =>
        acte.nom.toLowerCase().includes(queryLower) ||
        acte.prenom.toLowerCase().includes(queryLower)
    );

    if (resultats.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Aucun citoyen trouvé pour la recherche "${query}".`,
          },
        ],
      };
    }

    const texte = resultats
      .map(
        (r) =>
          `- ${r.prenom} ${r.nom} | Né(e) le ${r.date_naissance} à ${r.lieu_naissance} | Acte n°${r.numero_acte}`
      )
      .join("\n");

    return {
      content: [
        {
          type: "text" as const,
          text: `${resultats.length} résultat(s) trouvé(s) :\n${texte}`,
        },
      ],
    };
  }
);

// Tool 2 : Obtenir un acte de naissance complet
server.tool(
  "get_acte_naissance",
  "Récupère les détails complets d'un acte de naissance par numéro d'acte ou ID",
  {
    identifiant: z
      .string()
      .describe("Numéro d'acte (ex: N-2024-001-THI) ou ID (ex: naiss-001)"),
  },
  async ({ identifiant }) => {
    const acte = actesNaissance.find(
      (a) => a.numero_acte === identifiant || a.id === identifiant
    );

    if (!acte) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Acte de naissance non trouvé pour l'identifiant "${identifiant}".`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              type: "Acte de Naissance",
              numero: acte.numero_acte,
              etat_civil: {
                nom: acte.nom,
                prenom: acte.prenom,
                date_naissance: acte.date_naissance,
                lieu_naissance: acte.lieu_naissance,
              },
              filiation: {
                pere: acte.nom_pere,
                mere: acte.nom_mere,
              },
              administration: {
                commune: acte.commune,
                centre: acte.centre_etat_civil,
                date_declaration: acte.date_declaration,
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

// Tool 3 : Obtenir un acte de mariage
server.tool(
  "get_acte_mariage",
  "Récupère les détails d'un acte de mariage par numéro d'acte ou ID",
  {
    identifiant: z
      .string()
      .describe("Numéro d'acte (ex: M-2024-001-THI) ou ID (ex: mar-001)"),
  },
  async ({ identifiant }) => {
    const acte = actesMariage.find(
      (a) => a.numero_acte === identifiant || a.id === identifiant
    );

    if (!acte) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Acte de mariage non trouvé pour l'identifiant "${identifiant}".`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              type: "Acte de Mariage",
              numero: acte.numero_acte,
              epoux: {
                nom: acte.epoux_nom,
                prenom: acte.epoux_prenom,
              },
              epouse: {
                nom: acte.epouse_nom,
                prenom: acte.epouse_prenom,
              },
              details: {
                date: acte.date_mariage,
                lieu: acte.lieu_mariage,
                regime: acte.regime_matrimonial,
              },
              administration: {
                commune: acte.commune,
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

// Tool 4 : Obtenir un acte de décès
server.tool(
  "get_acte_deces",
  "Récupère les détails d'un acte de décès par numéro d'acte ou ID",
  {
    identifiant: z
      .string()
      .describe("Numéro d'acte (ex: D-2024-001-STL) ou ID (ex: dec-001)"),
  },
  async ({ identifiant }) => {
    const acte = actesDeces.find(
      (a) => a.numero_acte === identifiant || a.id === identifiant
    );

    if (!acte) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Acte de décès non trouvé pour l'identifiant "${identifiant}".`,
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              type: "Acte de Décès",
              numero: acte.numero_acte,
              defunt: {
                nom: acte.nom,
                prenom: acte.prenom,
              },
              details: {
                date_deces: acte.date_deces,
                lieu: acte.lieu_deces,
                cause: acte.cause,
              },
              administration: {
                commune: acte.commune,
                date_declaration: acte.date_declaration,
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

// Tool 5 : Vérifier l'existence d'un citoyen (pour les démarches)
server.tool(
  "verifier_citoyen",
  "Vérifie si un citoyen existe dans les registres (utile pour les démarches administratives)",
  {
    nom: z.string().describe("Nom de famille du citoyen"),
    prenom: z.string().describe("Prénom du citoyen"),
    date_naissance: z
      .string()
      .optional()
      .describe("Date de naissance (format YYYY-MM-DD) pour affiner la recherche"),
  },
  async ({ nom, prenom, date_naissance }) => {
    const citoyen = actesNaissance.find((a) => {
      const matchNom = a.nom.toLowerCase() === nom.toLowerCase();
      const matchPrenom = a.prenom.toLowerCase() === prenom.toLowerCase();
      const matchDate = date_naissance
        ? a.date_naissance === date_naissance
        : true;
      return matchNom && matchPrenom && matchDate;
    });

    if (!citoyen) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              existe: false,
              message: `Aucun citoyen "${prenom} ${nom}" trouvé dans les registres.`,
            }),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            existe: true,
            citoyen: {
              nom_complet: `${citoyen.prenom} ${citoyen.nom}`,
              date_naissance: citoyen.date_naissance,
              lieu_naissance: citoyen.lieu_naissance,
              numero_acte: citoyen.numero_acte,
            },
            message: "Citoyen trouvé dans les registres d'état civil.",
          }),
        },
      ],
    };
  }
);

// === RESOURCES (données consultables par le chatbot) ===

// Resource : Liste des centres d'état civil
server.resource(
  "centres-etat-civil",
  "etat-civil://centres",
  async (uri) => {
    const centres = [
      {
        nom: "Centre Principal de Thiès",
        commune: "Thiès-Nord",
        region: "Thiès",
        horaires: "Lundi-Vendredi 8h-16h",
        telephone: "+221 33 951 XX XX",
      },
      {
        nom: "Centre d'État Civil de Dakar",
        commune: "Dakar-Plateau",
        region: "Dakar",
        horaires: "Lundi-Vendredi 8h-17h",
        telephone: "+221 33 821 XX XX",
      },
      {
        nom: "Centre d'État Civil de Saint-Louis",
        commune: "Saint-Louis",
        region: "Saint-Louis",
        horaires: "Lundi-Vendredi 8h-15h",
        telephone: "+221 33 961 XX XX",
      },
      {
        nom: "Centre d'État Civil de Ziguinchor",
        commune: "Ziguinchor",
        region: "Ziguinchor",
        horaires: "Lundi-Vendredi 8h-16h",
        telephone: "+221 33 991 XX XX",
      },
      {
        nom: "Centre d'État Civil de Kaolack",
        commune: "Kaolack",
        region: "Kaolack",
        horaires: "Lundi-Vendredi 8h-15h30",
        telephone: "+221 33 941 XX XX",
      },
    ];

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(centres, null, 2),
        },
      ],
    };
  }
);

// Resource : Statistiques d'état civil
server.resource(
  "statistiques",
  "etat-civil://statistiques",
  async (uri) => {
    const stats = {
      total_naissances: actesNaissance.length,
      total_mariages: actesMariage.length,
      total_deces: actesDeces.length,
      communes_couvertes: [
        ...new Set(actesNaissance.map((a) => a.commune)),
      ],
      derniere_mise_a_jour: "2024-06-15",
    };

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(stats, null, 2),
        },
      ],
    };
  }
);

// === DÉMARRAGE DU SERVEUR ===

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Serveur MCP État Civil démarré avec succès.");
}

main().catch((error) => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});
