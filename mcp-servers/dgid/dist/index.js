import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { contribuables, declarations, paiements, centresFiscaux, } from "./data.js";
const server = new McpServer({
    name: "dgid-senegal",
    version: "1.0.0",
    description: "Serveur MCP pour la Direction Générale des Impôts et Domaines du Sénégal",
});
// === TOOLS ===
// Tool 1 : Consulter le statut fiscal d'un contribuable
server.tool("get_statut_fiscal", "Consulte le statut fiscal d'un contribuable par NINEA, NIF ou nom", {
    identifiant: z
        .string()
        .describe("NINEA (ex: 001234567-2A3), NIF (ex: NIF-2020-001-DKR) ou nom du contribuable"),
}, async ({ identifiant }) => {
    const id = identifiant.toLowerCase();
    const contribuable = contribuables.find((c) => c.ninea.toLowerCase() === id ||
        c.nif.toLowerCase() === id ||
        c.nom.toLowerCase() === id ||
        (c.raison_sociale && c.raison_sociale.toLowerCase().includes(id)));
    if (!contribuable) {
        return {
            content: [
                {
                    type: "text",
                    text: `Aucun contribuable trouvé pour "${identifiant}".`,
                },
            ],
        };
    }
    const declContrib = declarations.filter((d) => d.contribuable_id === contribuable.id);
    const enRetard = declContrib.filter((d) => d.statut === "en_retard" || d.statut === "non_deposee");
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    contribuable: {
                        ninea: contribuable.ninea,
                        nif: contribuable.nif,
                        nom: contribuable.raison_sociale || `${contribuable.prenom} ${contribuable.nom}`,
                        type: contribuable.type,
                        activite: contribuable.activite,
                        regime_fiscal: contribuable.regime_fiscal,
                        statut: contribuable.statut,
                    },
                    situation_fiscale: {
                        total_declarations: declContrib.length,
                        declarations_en_regle: declContrib.filter((d) => d.statut === "deposee" || d.statut === "verifiee").length,
                        declarations_en_retard: enRetard.length,
                        est_en_regle: enRetard.length === 0 && contribuable.statut === "actif",
                    },
                }, null, 2),
            },
        ],
    };
});
// Tool 2 : Vérifier les déclarations d'un contribuable
server.tool("check_declarations", "Vérifie les déclarations fiscales d'un contribuable (TVA, IS, IR, patente, etc.)", {
    contribuable_id: z
        .string()
        .describe("ID du contribuable (ex: contrib-001) ou NINEA"),
    type_declaration: z
        .string()
        .optional()
        .describe("Type de déclaration à filtrer (TVA, IR, IS, patente, CFCE, BRS)"),
}, async ({ contribuable_id, type_declaration }) => {
    const contrib = contribuables.find((c) => c.id === contribuable_id || c.ninea === contribuable_id);
    if (!contrib) {
        return {
            content: [
                {
                    type: "text",
                    text: `Contribuable non trouvé pour "${contribuable_id}".`,
                },
            ],
        };
    }
    let declFiltered = declarations.filter((d) => d.contribuable_id === contrib.id);
    if (type_declaration) {
        declFiltered = declFiltered.filter((d) => d.type_declaration === type_declaration.toUpperCase());
    }
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    contribuable: contrib.raison_sociale || `${contrib.prenom} ${contrib.nom}`,
                    ninea: contrib.ninea,
                    declarations: declFiltered.map((d) => ({
                        type: d.type_declaration,
                        periode: d.periode,
                        date_depot: d.date_depot || "Non déposée",
                        date_limite: d.date_limite,
                        montant_impot: `${d.montant_impot.toLocaleString("fr-FR")} FCFA`,
                        statut: d.statut,
                    })),
                }, null, 2),
            },
        ],
    };
});
// Tool 3 : Consulter l'historique des paiements
server.tool("get_paiements", "Consulte l'historique des paiements fiscaux d'un contribuable", {
    contribuable_id: z
        .string()
        .describe("ID du contribuable (ex: contrib-001) ou NINEA"),
}, async ({ contribuable_id }) => {
    const contrib = contribuables.find((c) => c.id === contribuable_id || c.ninea === contribuable_id);
    if (!contrib) {
        return {
            content: [
                {
                    type: "text",
                    text: `Contribuable non trouvé pour "${contribuable_id}".`,
                },
            ],
        };
    }
    const paieContrib = paiements.filter((p) => p.contribuable_id === contrib.id);
    const totalPaye = paieContrib
        .filter((p) => p.statut === "valide")
        .reduce((sum, p) => sum + p.montant, 0);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    contribuable: contrib.raison_sociale || `${contrib.prenom} ${contrib.nom}`,
                    ninea: contrib.ninea,
                    resume: {
                        total_paiements: paieContrib.length,
                        montant_total_paye: `${totalPaye.toLocaleString("fr-FR")} FCFA`,
                    },
                    paiements: paieContrib.map((p) => ({
                        reference: p.reference,
                        montant: `${p.montant.toLocaleString("fr-FR")} FCFA`,
                        date: p.date_paiement,
                        mode: p.mode_paiement,
                        statut: p.statut,
                    })),
                }, null, 2),
            },
        ],
    };
});
// Tool 4 : Calculer les pénalités de retard
server.tool("calculer_penalites", "Calcule les pénalités de retard pour les déclarations ou paiements en retard", {
    contribuable_id: z
        .string()
        .describe("ID du contribuable (ex: contrib-001) ou NINEA"),
}, async ({ contribuable_id }) => {
    const contrib = contribuables.find((c) => c.id === contribuable_id || c.ninea === contribuable_id);
    if (!contrib) {
        return {
            content: [
                {
                    type: "text",
                    text: `Contribuable non trouvé pour "${contribuable_id}".`,
                },
            ],
        };
    }
    const declEnRetard = declarations.filter((d) => d.contribuable_id === contrib.id &&
        (d.statut === "en_retard" || d.statut === "non_deposee"));
    if (declEnRetard.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: JSON.stringify({
                        contribuable: contrib.raison_sociale || `${contrib.prenom} ${contrib.nom}`,
                        penalites: [],
                        message: "Aucune pénalité — le contribuable est en règle.",
                    }),
                },
            ],
        };
    }
    // Calcul simplifié : 10% du montant + 1% par mois de retard (législation sénégalaise)
    const penalites = declEnRetard.map((d) => {
        const penaliteBase = d.montant_impot * 0.1; // 10% pénalité initiale
        const moisRetard = d.statut === "non_deposee" ? 3 : 1;
        const interetRetard = d.montant_impot * 0.01 * moisRetard;
        return {
            declaration: `${d.type_declaration} - ${d.periode}`,
            statut: d.statut,
            montant_initial: d.montant_impot,
            penalite_10_pourcent: penaliteBase,
            interet_retard: interetRetard,
            total_penalites: penaliteBase + interetRetard,
        };
    });
    const totalPenalites = penalites.reduce((sum, p) => sum + p.total_penalites, 0);
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    contribuable: contrib.raison_sociale || `${contrib.prenom} ${contrib.nom}`,
                    ninea: contrib.ninea,
                    penalites,
                    total_penalites: `${totalPenalites.toLocaleString("fr-FR")} FCFA`,
                    base_legale: "Article 183 du Code Général des Impôts - Pénalité de 10% + intérêt de retard de 1% par mois",
                }, null, 2),
            },
        ],
    };
});
// Tool 5 : Trouver le centre fiscal compétent
server.tool("get_centre_fiscal", "Trouve le centre fiscal compétent pour un contribuable selon sa région ou son régime", {
    region: z
        .string()
        .optional()
        .describe("Région du contribuable (ex: Dakar, Thiès, Saint-Louis)"),
    regime_fiscal: z
        .string()
        .optional()
        .describe("Régime fiscal (reel_normal, reel_simplifie, contribution_globale_unique)"),
}, async ({ region, regime_fiscal }) => {
    let centres = centresFiscaux;
    if (region) {
        centres = centres.filter((c) => c.region.toLowerCase() === region.toLowerCase());
    }
    if (regime_fiscal === "reel_normal") {
        centres = centres.filter((c) => c.type === "CIME" || c.type === "CDI");
    }
    if (centres.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: `Aucun centre fiscal trouvé pour la région "${region}".`,
                },
            ],
        };
    }
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    centres_fiscaux: centres.map((c) => ({
                        nom: c.nom,
                        type: c.type,
                        region: c.region,
                        adresse: c.adresse,
                        telephone: c.telephone,
                        horaires: c.horaires,
                        chef_centre: c.chef_centre,
                    })),
                }, null, 2),
            },
        ],
    };
});
// Tool 6 : Rechercher un contribuable
server.tool("rechercher_contribuable", "Recherche un contribuable par nom, NINEA ou activité", {
    query: z
        .string()
        .describe("Terme de recherche (nom, NINEA, raison sociale ou activité)"),
}, async ({ query }) => {
    const q = query.toLowerCase();
    const resultats = contribuables.filter((c) => c.nom.toLowerCase().includes(q) ||
        (c.prenom && c.prenom.toLowerCase().includes(q)) ||
        (c.raison_sociale && c.raison_sociale.toLowerCase().includes(q)) ||
        c.ninea.toLowerCase().includes(q) ||
        c.activite.toLowerCase().includes(q));
    if (resultats.length === 0) {
        return {
            content: [
                {
                    type: "text",
                    text: `Aucun contribuable trouvé pour "${query}".`,
                },
            ],
        };
    }
    return {
        content: [
            {
                type: "text",
                text: JSON.stringify({
                    resultats: resultats.map((c) => ({
                        id: c.id,
                        ninea: c.ninea,
                        nom: c.raison_sociale || `${c.prenom} ${c.nom}`,
                        type: c.type,
                        activite: c.activite,
                        region: c.region,
                        statut: c.statut,
                    })),
                    total: resultats.length,
                }, null, 2),
            },
        ],
    };
});
// === RESOURCES ===
// Resource : Liste des centres fiscaux
server.resource("centres-fiscaux", "dgid://centres", async (uri) => {
    return {
        contents: [
            {
                uri: uri.href,
                mimeType: "application/json",
                text: JSON.stringify(centresFiscaux, null, 2),
            },
        ],
    };
});
// Resource : Barème fiscal (taux d'imposition)
server.resource("bareme-fiscal", "dgid://bareme", async (uri) => {
    const bareme = {
        impot_sur_les_societes: {
            taux_normal: "30%",
            taux_reduit_pme: "25%",
            minimum_fiscal: "0.5% du chiffre d'affaires (min 500 000 FCFA)",
        },
        impot_sur_le_revenu: {
            tranches: [
                { de: 0, a: 630000, taux: "0%" },
                { de: 630001, a: 1500000, taux: "20%" },
                { de: 1500001, a: 4000000, taux: "30%" },
                { de: 4000001, a: 8000000, taux: "35%" },
                { de: 8000001, a: 13500000, taux: "37%" },
                { de: 13500001, a: null, taux: "40%" },
            ],
        },
        tva: {
            taux_normal: "18%",
            taux_reduit: "10% (hébergement touristique)",
            exonerations: [
                "Produits de première nécessité",
                "Matériel agricole",
                "Médicaments essentiels",
            ],
        },
        patente: {
            base: "Valeur locative des locaux + équipements",
            taux: "Entre 10% et 15% selon la commune",
        },
        contribution_globale_unique: {
            description: "Régime simplifié pour les petites entreprises (CA < 50M FCFA)",
            taux: "5% du chiffre d'affaires",
        },
    };
    return {
        contents: [
            {
                uri: uri.href,
                mimeType: "application/json",
                text: JSON.stringify(bareme, null, 2),
            },
        ],
    };
});
// Resource : Calendrier fiscal
server.resource("calendrier-fiscal", "dgid://calendrier", async (uri) => {
    const calendrier = {
        annee: 2024,
        echeances: [
            {
                impot: "Patente",
                echeance: "31 janvier",
                concerne: "Tous les contribuables soumis",
            },
            {
                impot: "CFCE (Contribution Globale Unique)",
                echeance: "31 mars",
                concerne: "Petites entreprises (CA < 50M FCFA)",
            },
            {
                impot: "TVA mensuelle",
                echeance: "20 du mois suivant",
                concerne: "Régime réel normal",
            },
            {
                impot: "TVA trimestrielle",
                echeance: "20 du mois suivant le trimestre",
                concerne: "Régime réel simplifié",
            },
            {
                impot: "IS (Impôt sur les Sociétés)",
                echeance: "30 avril (exercice clos au 31/12)",
                concerne: "Personnes morales",
            },
            {
                impot: "IR (Impôt sur le Revenu)",
                echeance: "30 avril",
                concerne: "Personnes physiques (BIC, BNC, BA)",
            },
            {
                impot: "BRS (Bordereau de Retenue à la Source)",
                echeance: "15 du mois suivant",
                concerne: "Employeurs (retenues sur salaires)",
            },
            {
                impot: "Acomptes IS",
                echeance: "15 février, 30 avril, 15 juin",
                concerne: "Sociétés soumises à l'IS",
            },
        ],
    };
    return {
        contents: [
            {
                uri: uri.href,
                mimeType: "application/json",
                text: JSON.stringify(calendrier, null, 2),
            },
        ],
    };
});
// === DÉMARRAGE DU SERVEUR ===
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Serveur MCP DGID démarré avec succès.");
}
main().catch((error) => {
    console.error("Erreur fatale:", error);
    process.exit(1);
});
