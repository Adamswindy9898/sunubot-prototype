import { NextRequest, NextResponse } from "next/server";
import { analyserMessage, checkNLPHealth } from "@/lib/nlp-client";
import { processMessage } from "@/lib/mcp-orchestrator";
import prisma from "@/lib/prisma";
import { logAccess } from "@/lib/access-log";
import { createTrace, addToSession } from "@/lib/mcp-tracer";

// Réponses enrichies basées sur l'analyse NLP + routage MCP
const RESPONSES_PAR_INTENTION: Record<string, Record<string, { fr: string; wo: string }>> = {
  demande_document: {
    etat_civil: {
      fr: "📋 **Demande d'acte d'état civil**\n\nVoici les informations :\n\n**Pièces requises :**\n1. Pièce d'identité (CNI ou passeport)\n2. Ancien acte (si disponible)\n3. Timbre fiscal de 200 FCFA\n\n**Coût :** 200 FCFA\n**Délai :** 3 à 5 jours ouvrables\n**Lieu :** Centre d'état civil de votre commune\n\n---\n\nVoulez-vous que je vous aide à remplir le formulaire ?",
      wo: "📋 **Laaj kàrt ci état civil**\n\n**Papye yi nga war a indil :**\n1. Kàrt boppam (CNI walla passeport)\n2. Kàrt bu yàgg (su am)\n3. Timbre fiscal 200 FCFA\n\n**Ñaata :** 200 FCFA\n**Ñaata bés :** 3 ba 5 bés\n**Fu la dem :** Centre d'état civil ci sa gox\n\n---\n\nBëgg nga ma ndimbal la remplir formulaire bi?",
    },
    dgid: {
      fr: "🏢 **Demande de document fiscal**\n\nPour obtenir votre attestation fiscale ou NINEA :\n\n**Pièces requises :**\n1. CNI du gérant\n2. Registre de commerce (RCCM)\n3. Statuts de la société\n4. Plan de localisation\n\n**Coût :** Gratuit (NINEA) / 1000 FCFA (attestation)\n**Délai :** 5 à 10 jours ouvrables\n**Lieu :** Centre fiscal de votre région\n\nVoulez-vous remplir le formulaire d'immatriculation ?",
      wo: "🏢 **Laaj papye ci wàll**\n\nNgir am sa attestation fiscale walla NINEA :\n\n**Papye yi :** CNI, registre de commerce, statuts\n**Ñaata :** Amul fey (NINEA) / 1000 FCFA (attestation)\n**Ñaata bés :** 5 ba 10 bés\n\nBëgg nga ma ndimbal la remplir formulaire bi?",
    },
    cnss: {
      fr: "🏥 **Demande de document CNSS**\n\nPour obtenir votre attestation ou carte CNSS :\n\n**Pièces requises :**\n1. CNI\n2. Bulletins de salaire (3 derniers mois)\n3. Contrat de travail\n\n**Lieu :** Agence CNSS la plus proche\n\nSouhaitez-vous localiser l'agence la plus proche ?",
      wo: "🏥 **Laaj papye ci CNSS**\n\nNgir am sa kàrt CNSS :\n\n**Papye yi :** CNI, bulletins de salaire, contrat\n**Fu la dem :** Agence CNSS bi gën a jege\n\nBëgg nga xam fan la agence bi nekk?",
    },
  },
  question_procedure: {
    etat_civil: {
      fr: "📝 **Procédure état civil**\n\n**Étapes :**\n1. Se rendre au centre d'état civil de votre commune\n2. Remplir le formulaire de demande\n3. Joindre les pièces justificatives\n4. Payer le timbre fiscal (200 FCFA)\n5. Retirer le document dans le délai indiqué\n\n**Horaires :** Lundi-Vendredi, 8h-16h\n\nQuelle démarche précise souhaitez-vous effectuer ?",
      wo: "📝 **Naka ngay def**\n\n**Étapes yi :**\n1. Dem ci centre d'état civil bi\n2. Remplir formulaire bi\n3. Indil papye yi\n4. Fey timbre fiscal (200 FCFA)\n5. Jël kàrt bi ci bés bu ñu la wax\n\n**Waxtu :** Altine-Àjjuma, 8h-16h\n\nLan la bëgg a def?",
    },
    dgid: {
      fr: "💰 **Procédure fiscale (DGID)**\n\n**Modes de paiement :**\n- 🏦 Virement bancaire\n- 📱 Mobile Money (Orange Money, Wave)\n- 💵 Espèces au guichet\n- 🌐 En ligne : etax.dgid.sn\n\n**Échéances principales :**\n- TVA : le 20 du mois suivant\n- IS : 30 avril\n- Patente : 31 janvier\n\nVoulez-vous :\n1. Vérifier votre situation fiscale ?\n2. Connaître votre centre fiscal ?\n3. Calculer vos pénalités de retard ?",
      wo: "💰 **Naka ngay fey wàll (DGID)**\n\n**Naka nga man a fey :**\n- 🏦 Virement bancaire\n- 📱 Orange Money / Wave\n- 💵 Xaalis ci guichet bi\n- 🌐 Internet : etax.dgid.sn\n\n**Dates limites :**\n- TVA : 20 weer wu toftal\n- IS : 30 avril\n- Patente : 31 janvier\n\nLan moo la bëgg?\n1. Gis ndax yaa ngi ci jamm?\n2. Xam fan la centre fiscal bi nekk?\n3. Calculer pénalités yi?",
    },
    cnss: {
      fr: "🏥 **Procédure CNSS**\n\n**Pour s'inscrire :**\n1. Remplir le formulaire d'immatriculation\n2. Fournir : CNI, contrat de travail, bulletins de paie\n3. L'employeur déclare le salarié\n4. Réception du numéro CNSS sous 15 jours\n\n**Cotisations :** 5.6% salarié + 18.5% employeur\n\nQuel type de prestation vous intéresse ?",
      wo: "🏥 **Naka ngay def ci CNSS**\n\n**Ngir bind :**\n1. Remplir formulaire bi\n2. Indil : CNI, contrat, bulletins de paie\n3. Sa boroom liggéey bi dina la bind\n4. Jël numéro CNSS ci 15 bés\n\nLan la bëgg xam?",
    },
  },
  question_lieu: {
    etat_civil: {
      fr: "📍 **Centres d'état civil**\n\nLes centres d'état civil sont situés dans :\n- Chaque mairie d'arrondissement\n- Les sous-préfectures (zones rurales)\n\n**Principaux centres à Dakar :**\n- Mairie de Dakar Plateau\n- Mairie de Parcelles Assainies\n- Mairie de Guédiawaye\n\n**Horaires :** Lundi-Vendredi, 8h-16h\n\nVoulez-vous l'adresse d'un centre précis ?",
      wo: "📍 **Fan lañu nekk (état civil)**\n\nCentres d'état civil yi nekk na ci :\n- Meeri bi ci sa quartier\n- Sous-préfecture (ci dëkk bi)\n\n**Ci Ndakaaru :**\n- Meeri Dakar Plateau\n- Meeri Parcelles Assainies\n- Meeri Guédiawaye\n\n**Waxtu :** Altine-Àjjuma, 8h-16h",
    },
    dgid: {
      fr: "📍 **Centres fiscaux (DGID)**\n\nLes centres des services fiscaux :\n- **Dakar :** Centre fiscal de Dakar, Plateau\n- **Thiès :** Centre fiscal régional de Thiès\n- **Saint-Louis :** Centre fiscal de Saint-Louis\n\n**Horaires :** Lundi-Vendredi, 8h-17h\n**Portail en ligne :** etax.dgid.sn\n\nDe quelle ville êtes-vous ?",
      wo: "📍 **Fan la biro wàll bi nekk (DGID)**\n\n- **Ndakaaru :** Centre fiscal ci Plateau\n- **Cees :** Centre fiscal ci Thiès\n- **Ndar :** Centre fiscal ci Saint-Louis\n\n**Waxtu :** Altine-Àjjuma, 8h-17h\n\nFan nga nekk?",
    },
    cnss: {
      fr: "📍 **Agences CNSS**\n\n- **Dakar :** Siège CNSS, Immeuble Seydi Djamil\n- **Thiès :** Agence régionale\n- **Kaolack :** Agence régionale\n- **Saint-Louis :** Point de service\n\n**Horaires :** Lundi-Vendredi, 8h-16h\n**Tél :** 33 889 82 00",
      wo: "📍 **Fan la CNSS nekk**\n\n- **Ndakaaru :** Siège CNSS\n- **Cees :** Agence ci Thiès\n- **Kawlack :** Agence ci Kaolack\n\n**Waxtu :** Altine-Àjjuma, 8h-16h",
    },
  },
  question_cout: {
    etat_civil: {
      fr: "💵 **Coûts état civil**\n\n| Document | Coût |\n|----------|------|\n| Acte de naissance | 200 FCFA |\n| Copie certifiée | 500 FCFA |\n| Acte de mariage | 2 000 FCFA |\n| Acte de décès | 200 FCFA |\n| Certificat de nationalité | 2 000 FCFA |\n\n*Timbre fiscal inclus*\n\nQuel document souhaitez-vous ?",
      wo: "💵 **Ñaata lay jar (état civil)**\n\n- Kàrt bëccëg : 200 FCFA\n- Copie certifiée : 500 FCFA\n- Kàrt takk : 2 000 FCFA\n- Kàrt dee : 200 FCFA\n\nLan la bëgg?",
    },
    dgid: {
      fr: "💵 **Coûts fiscaux**\n\n| Démarche | Coût |\n|----------|------|\n| NINEA | Gratuit |\n| Attestation de régularité | 1 000 FCFA |\n| Quitus fiscal | 2 000 FCFA |\n| Patente | Variable selon CA |\n\nVoulez-vous un détail sur un coût précis ?",
      wo: "💵 **Ñaata lay jar (wàll)**\n\n- NINEA : Dara (gratuit)\n- Attestation : 1 000 FCFA\n- Quitus fiscal : 2 000 FCFA\n\nLan moo la bëgg xam?",
    },
  },
  salutation: {
    general: {
      fr: "Bonjour ! 👋 Je suis **SunuBot**, votre assistant administratif.\n\nJe peux vous accompagner pour :\n- 📋 **État civil** : actes de naissance, mariage, décès\n- 💰 **Fiscalité (DGID)** : impôts, NINEA, déclarations\n- 🏥 **CNSS** : allocations, retraite\n- 📝 **Formulaires** : remplir et soumettre vos demandes\n\nVous pouvez aussi me parler en **wolof** ! (Man naa dégg wolof)",
      wo: "Jàmm rekk! 👋 Maa ngi **SunuBot**, sa ndimbalkat ci yoon wi.\n\nMan naa la ndimbal ci :\n- 📋 État civil (kàrt bëccëg, takk, dee)\n- 💰 Wàll (impôts, NINEA)\n- 🏥 CNSS (allocations, retraite)\n- 📝 Formulaires\n\nWax ma lan moo la bëgg!",
    },
  },
  question_statut: {
    dgid: {
      fr: "🔍 **Vérification du statut fiscal**\n\nPour vérifier votre situation :\n1. Communiquez votre **NINEA** ou nom/raison sociale\n2. Je vérifie vos déclarations et paiements\n3. Je vous indique si vous êtes à jour\n\nQuel est votre NINEA ou nom ?",
      wo: "🔍 **Gis sa situation fiscale**\n\nNgir xam ndax yaa ngi ci jamm :\n1. Wax ma sa NINEA walla sa tur\n2. Dinaa gis sa déclarations\n\nLan mooy sa NINEA?",
    },
  },
  suivi_demande: {
    general: {
      fr: "🔍 **Suivi de demande**\n\nPour suivre votre demande, j'ai besoin de votre **numéro de suivi** (ex: DEM-001) ou de votre **nom complet**.\n\nQuel est votre numéro de suivi ?",
      wo: "🔍 **Topp sa demande**\n\nNgir xam fan sa demande nekk, wax ma sa **numéro de suivi** (ex: DEM-001) walla sa **tur bu mat**.\n\nLan mooy sa numéro?",
    },
  },
  demande_inscription: {
    cnss: {
      fr: "📝 **Inscription CNSS**\n\nPour vous inscrire à la CNSS :\n\n**Si vous êtes employeur :**\n1. Formulaire d'immatriculation employeur\n2. NINEA + Registre de commerce\n3. Liste des salariés\n\n**Si vous êtes salarié :**\n1. Votre employeur fait la démarche\n2. CNI + contrat de travail\n\n**Délai :** 15 jours ouvrables\n\nÊtes-vous employeur ou salarié ?",
      wo: "📝 **Bind ci CNSS**\n\nNgir bind ci CNSS :\n\n**Su nga boroom liggéey :**\n1. Formulaire bi\n2. NINEA + Registre de commerce\n3. List salariés yi\n\n**Su nga liggéeykaat :**\n1. Sa boroom liggéey moo lay def\n2. CNI + contrat\n\nNdax boroom liggéey nga walla liggéeykaat?",
    },
  },
};

function getResponse(intention: string, domaine: string, langue: string): string {
  const intentResponses = RESPONSES_PAR_INTENTION[intention];
  if (intentResponses) {
    const domainResponse = intentResponses[domaine] || intentResponses["general"];
    if (domainResponse) {
      return langue === "wolof" ? domainResponse.wo : domainResponse.fr;
    }
  }

  // Fallback
  if (langue === "wolof") {
    return "Dégg naa sa laaj. Man naa la ndimbal ci :\n- 📋 État civil\n- 💰 Wàll (DGID)\n- 🏥 CNSS\n- 📝 Formulaires\n\nWax ma lu gën a leer lan la bëgg.";
  }
  return "Je comprends votre demande. Je peux vous aider avec :\n- 📋 État civil (naissance, mariage, décès)\n- 💰 Impôts / DGID\n- 🏥 CNSS (allocations, retraite)\n- 📝 Formulaires\n\nPouvez-vous préciser votre besoin ?";
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  // Rate limiting : 30 requetes/minute par IP
  const { rateLimit } = await import("@/lib/rate-limit");
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const { allowed, remaining } = rateLimit(`chat:${ip}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de requêtes. Veuillez patienter une minute." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    );
  }

  const { message, langue_forcee } = await req.json();

  if (!message || typeof message !== "string" || message.length > 2000) {
    logAccess(req, 400);
    return NextResponse.json(
      { error: "Message requis (max 2000 caractères)" },
      { status: 400 }
    );
  }

  // Créer la trace MCP pour cet échange
  const trace = createTrace(message, langue_forcee);

  // Tenter d'utiliser l'API NLP Python
  const nlpAvailable = await checkNLPHealth();

  if (nlpAvailable) {
    try {
      const nlpStart = Date.now();
      const analyse = await analyserMessage(message);
      const nlpTime = Date.now() - nlpStart;
      const { langue, intention, entites, action_mcp } = analyse.analyse;

      // Respecter la langue choisie manuellement par l'utilisateur
      const langueFinale = langue_forcee || langue.langue;

      const response = getResponse(
        intention.intention,
        intention.domaine,
        langueFinale
      );

      // Remplir la trace MCP — échange NLP
      trace.nlp_analysis = {
        mode: "python_api",
        request_to_nlp: {
          method: "POST",
          url: `${process.env.NLP_API_URL || "http://localhost:8000"}/analyser`,
          body: { texte: message },
        },
        response_from_nlp: {
          langue: { langue: langue.langue, confiance: langue.confiance, methode: langue.methode },
          intention: { intention: intention.intention, confiance: intention.confiance, domaine: intention.domaine },
          entites,
        },
        langue_finale: langueFinale,
        processing_time_ms: nlpTime,
      };

      // Trace MCP — routage vers le bon serveur
      trace.mcp_routing = {
        serveur_cible: action_mcp.serveur || "orchestrateur",
        tools_invoked: action_mcp.tools,
        description: action_mcp.description,
        formulaire: action_mcp.formulaire,
      };

      // Trace MCP — réponse
      trace.mcp_response = {
        status: "success",
        response_text: response.substring(0, 200) + (response.length > 200 ? "..." : ""),
        langue_reponse: langueFinale,
        intent_resolved: intention.intention,
        domaine_resolved: intention.domaine,
      };

      // Log conversation en base
      const dbSaved = await prisma.conversationLog.create({
        data: {
          message: message.substring(0, 500),
          langue: langue.langue,
          intent: intention.intention,
          domaine: intention.domaine,
          ip: req.headers.get("x-forwarded-for") || null,
        },
      }).then(() => true).catch(() => false);

      trace.db_log.saved = dbSaved;
      trace.total_processing_time_ms = Date.now() - startTime;

      // Sauvegarder la trace
      addToSession(trace);

      return NextResponse.json({
        response,
        langue: langueFinale,
        intent: intention.intention,
        domaine: intention.domaine,
        confiance: intention.confiance,
        tools_used: action_mcp.tools,
        serveur_mcp: action_mcp.serveur,
        entites: entites,
        nlp_mode: "python_api",
        trace_id: trace.trace_id,
      });
    } catch {
      // Fallback si erreur API
    }
  }

  // Fallback : orchestrateur simulé local
  const fallbackStart = Date.now();
  const result = processMessage(message, langue_forcee);
  const fallbackTime = Date.now() - fallbackStart;

  // Remplir la trace en mode fallback
  trace.nlp_analysis = {
    mode: "local_fallback",
    langue_finale: result.langue,
    processing_time_ms: fallbackTime,
  };
  trace.mcp_routing = {
    serveur_cible: "orchestrateur_local",
    tools_invoked: result.tools_used,
    description: `Fallback local — intent: ${result.intent}`,
  };
  trace.mcp_response = {
    status: "fallback",
    response_text: result.response.substring(0, 200) + (result.response.length > 200 ? "..." : ""),
    langue_reponse: result.langue,
    intent_resolved: result.intent,
  };

  // Log conversation en base (mode fallback)
  const dbSaved = await prisma.conversationLog.create({
    data: {
      message: message.substring(0, 500),
      langue: result.langue || "francais",
      intent: result.intent || null,
      domaine: null,
      ip: req.headers.get("x-forwarded-for") || null,
    },
  }).then(() => true).catch(() => false);

  trace.db_log.saved = dbSaved;
  trace.total_processing_time_ms = Date.now() - startTime;

  // Sauvegarder la trace
  addToSession(trace);

  logAccess(req, 200);

  return NextResponse.json({
    response: result.response,
    langue: result.langue,
    intent: result.intent,
    tools_used: result.tools_used,
    nlp_mode: "local_fallback",
    trace_id: trace.trace_id,
  });
}
