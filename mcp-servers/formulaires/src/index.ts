import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { formulaires, demandes } from "./data.js";

const server = new McpServer({
  name: "formulaires-admin-senegal",
  version: "1.0.0",
  description:
    "Serveur MCP pour les formulaires administratifs sénégalais — consultation, pré-remplissage et suivi des demandes",
});

// === TOOLS ===

// Tool 1 : Lister les formulaires disponibles par domaine
server.tool(
  "lister_formulaires",
  "Liste les formulaires administratifs disponibles, filtrés par domaine si spécifié",
  {
    domaine: z
      .enum(["etat_civil", "dgid", "cnss", "education", "sante", "tous"])
      .optional()
      .describe("Domaine administratif (etat_civil, dgid, cnss, education, sante) ou 'tous'"),
  },
  async ({ domaine }) => {
    let filtered = formulaires;
    if (domaine && domaine !== "tous") {
      filtered = formulaires.filter((f) => f.domaine === domaine);
    }

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              formulaires: filtered.map((f) => ({
                id: f.id,
                titre: f.titre,
                titre_wolof: f.titre_wolof,
                domaine: f.domaine,
                cout: f.cout,
                delai: f.delai_traitement,
              })),
              total: filtered.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 2 : Obtenir les détails d'un formulaire (champs, pièces requises)
server.tool(
  "get_formulaire",
  "Récupère les détails complets d'un formulaire (champs à remplir, pièces à fournir, coût, délai)",
  {
    formulaire_id: z
      .string()
      .describe("ID du formulaire (ex: form-001) ou mot-clé dans le titre"),
  },
  async ({ formulaire_id }) => {
    let form = formulaires.find((f) => f.id === formulaire_id);

    // Recherche par mot-clé si pas trouvé par ID
    if (!form) {
      const keyword = formulaire_id.toLowerCase();
      form = formulaires.find(
        (f) =>
          f.titre.toLowerCase().includes(keyword) ||
          f.titre_wolof.toLowerCase().includes(keyword)
      );
    }

    if (!form) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Formulaire non trouvé pour "${formulaire_id}". Utilisez 'lister_formulaires' pour voir les formulaires disponibles.`,
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
              formulaire: {
                id: form.id,
                titre: form.titre,
                titre_wolof: form.titre_wolof,
                domaine: form.domaine,
                description: form.description,
                description_wolof: form.description_wolof,
              },
              informations_pratiques: {
                cout: form.cout,
                delai_traitement: form.delai_traitement,
                lieu_depot: form.lieu_depot,
                pieces_requises: form.pieces_requises,
              },
              champs: form.champs.map((c) => ({
                id: c.id,
                label: c.label,
                label_wolof: c.label_wolof || null,
                type: c.type,
                obligatoire: c.obligatoire,
                options: c.options || null,
                placeholder: c.placeholder || null,
              })),
              nombre_champs: form.champs.length,
              champs_obligatoires: form.champs.filter((c) => c.obligatoire).length,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 3 : Pré-remplir un formulaire avec les données d'un citoyen
server.tool(
  "preremplir_formulaire",
  "Pré-remplit un formulaire avec les informations connues du citoyen",
  {
    formulaire_id: z.string().describe("ID du formulaire à pré-remplir"),
    donnees_citoyen: z
      .string()
      .describe(
        "Données du citoyen au format JSON (ex: {\"nom\": \"DIOP\", \"prenom\": \"Moussa\", \"date_naissance\": \"1995-03-15\"})"
      ),
  },
  async ({ formulaire_id, donnees_citoyen }) => {
    const form = formulaires.find((f) => f.id === formulaire_id);

    if (!form) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Formulaire "${formulaire_id}" non trouvé.`,
          },
        ],
      };
    }

    let donnees: Record<string, string>;
    try {
      donnees = JSON.parse(donnees_citoyen);
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: "Erreur: les données du citoyen doivent être au format JSON valide.",
          },
        ],
      };
    }

    // Pré-remplir les champs
    const champsRemplis = form.champs.map((champ) => {
      const valeur = donnees[champ.id] || null;
      return {
        id: champ.id,
        label: champ.label,
        valeur_preremplie: valeur,
        obligatoire: champ.obligatoire,
        statut: valeur ? "rempli" : champ.obligatoire ? "à_compléter" : "optionnel",
      };
    });

    const champsMissing = champsRemplis.filter(
      (c) => c.statut === "à_compléter"
    );

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              formulaire: form.titre,
              pre_remplissage: {
                champs: champsRemplis,
                resume: {
                  total_champs: champsRemplis.length,
                  champs_remplis: champsRemplis.filter((c) => c.statut === "rempli").length,
                  champs_manquants: champsMissing.length,
                  pret_a_soumettre: champsMissing.length === 0,
                },
                champs_a_completer: champsMissing.map((c) => c.label),
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

// Tool 4 : Soumettre un formulaire
server.tool(
  "soumettre_formulaire",
  "Soumet un formulaire rempli et crée une demande avec un numéro de suivi",
  {
    formulaire_id: z.string().describe("ID du formulaire à soumettre"),
    donnees: z
      .string()
      .describe("Données complètes du formulaire au format JSON"),
    citoyen_nom: z.string().describe("Nom du citoyen"),
    citoyen_prenom: z.string().describe("Prénom du citoyen"),
    citoyen_telephone: z.string().describe("Téléphone du citoyen"),
  },
  async ({ formulaire_id, donnees, citoyen_nom, citoyen_prenom, citoyen_telephone }) => {
    const form = formulaires.find((f) => f.id === formulaire_id);

    if (!form) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Formulaire "${formulaire_id}" non trouvé.`,
          },
        ],
      };
    }

    let donneesObj: Record<string, string>;
    try {
      donneesObj = JSON.parse(donnees);
    } catch {
      return {
        content: [
          {
            type: "text" as const,
            text: "Erreur: les données doivent être au format JSON valide.",
          },
        ],
      };
    }

    // Vérifier les champs obligatoires
    const champsManquants = form.champs
      .filter((c) => c.obligatoire && !donneesObj[c.id])
      .map((c) => c.label);

    if (champsManquants.length > 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify({
              succes: false,
              erreur: "Champs obligatoires manquants",
              champs_manquants: champsManquants,
              message: `Veuillez compléter les ${champsManquants.length} champ(s) obligatoire(s) manquant(s) avant de soumettre.`,
            }),
          },
        ],
      };
    }

    // Créer la demande
    const newId = `dem-${String(demandes.length + 1).padStart(3, "0")}`;
    const nouvelleDemande = {
      id: newId,
      formulaire_id,
      citoyen_nom,
      citoyen_prenom,
      citoyen_telephone,
      date_soumission: "2024-06-15",
      statut: "soumise" as const,
      donnees: donneesObj,
    };

    demandes.push(nouvelleDemande);

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              succes: true,
              demande: {
                numero_suivi: newId,
                formulaire: form.titre,
                date_soumission: nouvelleDemande.date_soumission,
                statut: "soumise",
                delai_estime: form.delai_traitement,
                lieu_retrait: form.lieu_depot,
              },
              message: `Votre demande a été soumise avec succès. Numéro de suivi : ${newId}. Délai estimé : ${form.delai_traitement}.`,
              pieces_a_fournir: form.pieces_requises,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Tool 5 : Suivre une demande
server.tool(
  "suivre_demande",
  "Vérifie le statut d'une demande soumise par son numéro de suivi ou par nom du citoyen",
  {
    identifiant: z
      .string()
      .describe("Numéro de suivi (ex: dem-001) ou nom du citoyen"),
  },
  async ({ identifiant }) => {
    let demandesTrouvees = demandes.filter(
      (d) => d.id === identifiant
    );

    if (demandesTrouvees.length === 0) {
      const id = identifiant.toLowerCase();
      demandesTrouvees = demandes.filter(
        (d) =>
          d.citoyen_nom.toLowerCase() === id ||
          d.citoyen_prenom.toLowerCase() === id ||
          `${d.citoyen_prenom} ${d.citoyen_nom}`.toLowerCase().includes(id)
      );
    }

    if (demandesTrouvees.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Aucune demande trouvée pour "${identifiant}".`,
          },
        ],
      };
    }

    const resultats = demandesTrouvees.map((d) => {
      const form = formulaires.find((f) => f.id === d.formulaire_id);
      return {
        numero_suivi: d.id,
        formulaire: form?.titre || d.formulaire_id,
        date_soumission: d.date_soumission,
        statut: d.statut,
        statut_description: getStatutDescription(d.statut),
        commentaire: d.commentaire || null,
      };
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              demandes: resultats,
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

// Tool 6 : Obtenir les pièces requises pour une démarche
server.tool(
  "get_pieces_requises",
  "Retourne la liste des pièces justificatives nécessaires pour un formulaire donné",
  {
    formulaire_id: z
      .string()
      .describe("ID du formulaire ou mot-clé (ex: 'naissance', 'NINEA', 'retraite')"),
  },
  async ({ formulaire_id }) => {
    let form = formulaires.find((f) => f.id === formulaire_id);

    if (!form) {
      const keyword = formulaire_id.toLowerCase();
      form = formulaires.find(
        (f) =>
          f.titre.toLowerCase().includes(keyword) ||
          f.titre_wolof.toLowerCase().includes(keyword) ||
          f.description.toLowerCase().includes(keyword)
      );
    }

    if (!form) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Formulaire non trouvé pour "${formulaire_id}".`,
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
              formulaire: form.titre,
              titre_wolof: form.titre_wolof,
              pieces_requises: form.pieces_requises.map((p, i) => ({
                numero: i + 1,
                document: p,
              })),
              cout: form.cout,
              lieu_depot: form.lieu_depot,
              conseil: "Assurez-vous d'avoir tous les documents originaux. Les photocopies doivent être certifiées conformes.",
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

function getStatutDescription(statut: string): string {
  const descriptions: Record<string, string> = {
    brouillon: "Le formulaire est en cours de rédaction, pas encore soumis",
    soumise: "Votre demande a été reçue et est en attente de traitement",
    en_traitement: "Votre demande est en cours de traitement par l'administration",
    validee: "Votre demande a été approuvée et validée",
    rejetee: "Votre demande a été rejetée — voir le commentaire pour les raisons",
    prete: "Votre document est prêt — vous pouvez venir le retirer",
  };
  return descriptions[statut] || "Statut inconnu";
}

// === RESOURCES ===

// Resource : Catalogue des formulaires
server.resource(
  "catalogue-formulaires",
  "formulaires://catalogue",
  async (uri) => {
    const catalogue = formulaires.map((f) => ({
      id: f.id,
      titre: f.titre,
      titre_wolof: f.titre_wolof,
      domaine: f.domaine,
      cout: f.cout,
      delai: f.delai_traitement,
      nombre_champs: f.champs.length,
    }));

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              total: catalogue.length,
              par_domaine: {
                etat_civil: catalogue.filter((f) => f.domaine === "etat_civil").length,
                dgid: catalogue.filter((f) => f.domaine === "dgid").length,
                cnss: catalogue.filter((f) => f.domaine === "cnss").length,
                education: catalogue.filter((f) => f.domaine === "education").length,
                sante: catalogue.filter((f) => f.domaine === "sante").length,
              },
              formulaires: catalogue,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

// Resource : Guide des démarches
server.resource(
  "guide-demarches",
  "formulaires://guide",
  async (uri) => {
    const guide = {
      titre: "Guide des démarches administratives au Sénégal",
      demarches: [
        {
          besoin: "Obtenir un acte de naissance",
          formulaire: "form-001",
          etapes: [
            "Se rendre au centre d'état civil de la commune de naissance",
            "Remplir le formulaire de demande",
            "Fournir une pièce d'identité et le timbre fiscal (200 FCFA)",
            "Attendre 3 à 5 jours ouvrables",
            "Retirer le document au guichet",
          ],
        },
        {
          besoin: "Déclarer une naissance",
          formulaire: "form-002",
          etapes: [
            "Se munir du certificat d'accouchement",
            "Se rendre à la mairie dans les 3 mois suivant la naissance",
            "Présenter les CNI des parents et le livret de famille",
            "L'acte est établi immédiatement et gratuitement",
          ],
        },
        {
          besoin: "Créer une entreprise (obtenir le NINEA)",
          formulaire: "form-005",
          etapes: [
            "Rassembler les documents (CNI, statuts, RC)",
            "Se rendre au centre fiscal de rattachement",
            "Remplir le formulaire d'immatriculation",
            "Déposer le dossier complet",
            "Attendre 5 à 10 jours pour l'attribution du NINEA",
          ],
        },
        {
          besoin: "Payer ses impôts (TVA)",
          formulaire: "form-006",
          etapes: [
            "Préparer les relevés de factures de la période",
            "Calculer la TVA collectée et déductible",
            "Remplir la déclaration (en ligne sur etax.dgid.sn ou au centre)",
            "Effectuer le paiement (virement, chèque, mobile money)",
            "Conserver la quittance de paiement",
          ],
        },
        {
          besoin: "Demander la retraite",
          formulaire: "form-010",
          etapes: [
            "Avoir 60 ans ou plus et avoir cessé toute activité",
            "Réunir les pièces (CNI, relevé de carrière, RIB)",
            "Déposer le dossier à l'agence CNSS du dernier lieu de travail",
            "Attendre 30 à 60 jours pour la liquidation",
            "La pension est versée mensuellement sur le compte bancaire",
          ],
        },
      ],
    };

    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(guide, null, 2),
        },
      ],
    };
  }
);

// Resource : Statistiques des demandes
server.resource(
  "statistiques-demandes",
  "formulaires://statistiques",
  async (uri) => {
    const stats = {
      total_demandes: demandes.length,
      par_statut: {
        brouillon: demandes.filter((d) => d.statut === "brouillon").length,
        soumise: demandes.filter((d) => d.statut === "soumise").length,
        en_traitement: demandes.filter((d) => d.statut === "en_traitement").length,
        validee: demandes.filter((d) => d.statut === "validee").length,
        rejetee: demandes.filter((d) => d.statut === "rejetee").length,
        prete: demandes.filter((d) => d.statut === "prete").length,
      },
      par_domaine: {
        etat_civil: demandes.filter((d) => {
          const f = formulaires.find((f) => f.id === d.formulaire_id);
          return f?.domaine === "etat_civil";
        }).length,
        dgid: demandes.filter((d) => {
          const f = formulaires.find((f) => f.id === d.formulaire_id);
          return f?.domaine === "dgid";
        }).length,
        cnss: demandes.filter((d) => {
          const f = formulaires.find((f) => f.id === d.formulaire_id);
          return f?.domaine === "cnss";
        }).length,
      },
      taux_validation: Math.round(
        (demandes.filter((d) => d.statut === "validee" || d.statut === "prete").length /
          demandes.length) *
          100
      ),
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
  console.error("Serveur MCP Formulaires démarré avec succès.");
}

main().catch((error) => {
  console.error("Erreur fatale:", error);
  process.exit(1);
});
