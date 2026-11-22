"""
API REST du module NLP — expose les fonctionnalités de traitement wolof/français
Sert de pont entre le frontend Next.js et le moteur NLP Python
"""

from dotenv import load_dotenv
import os
load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict

from langue_detector import detect_language
from intent_classifier import IntentClassifier, EntityExtractor
from normaliser_wolof import normaliser_wolof
from corriger_texte import corriger_texte
from llm_mistral import analyser_avec_mistral, generer_reponse_mistral, is_mistral_available
from llm_mbert import get_mbert_classifier

# === Initialisation ===
app = FastAPI(
    title="SunuBot NLP API",
    description="API de traitement du langage naturel wolof/français pour les services administratifs sénégalais",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "http://localhost:4000", "http://localhost:5000", "http://localhost:5001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Charger les modèles au démarrage
classifier = IntentClassifier()
extractor = EntityExtractor()
mbert = get_mbert_classifier()  # mBERT pour classification multilingue


# === Modèles de données ===
class TextInput(BaseModel):
    texte: str

class AnalyseComplete(BaseModel):
    texte: str
    langue: Optional[str] = None  # forcer une langue


# === Endpoints ===

@app.get("/")
async def root():
    return {
        "service": "SunuBot NLP API",
        "version": "1.0.0",
        "endpoints": [
            "/detecter-langue",
            "/classifier-intention",
            "/extraire-entites",
            "/analyser",
            "/health",
        ],
    }


@app.get("/health")
async def health():
    mode = "mbert+mistral" if (mbert and is_mistral_available()) else \
           "mistral" if is_mistral_available() else \
           "mbert" if mbert else "local_tfidf"
    return {
        "status": "ok",
        "modele_tfidf": classifier.model is not None,
        "modele_mbert": mbert is not None,
        "llm_mistral": is_mistral_available(),
        "mode": mode,
    }


@app.post("/detecter-langue")
async def detecter_langue(input: TextInput):
    """Détecte si le texte est en wolof, français ou mixte"""
    texte_n = normaliser_wolof(input.texte)
    result = detect_language(texte_n)
    return {
        "texte": input.texte,
        "texte_normalise": texte_n if texte_n != input.texte.lower() else None,
        **result,
    }


@app.post("/classifier-intention")
async def classifier_intention(input: TextInput):
    """Classifie l'intention de l'utilisateur (demande_document, question_lieu, etc.)"""
    texte_n = normaliser_wolof(input.texte)
    result = classifier.predict(texte_n)
    return {
        "texte": input.texte,
        "texte_normalise": texte_n if texte_n != input.texte.lower() else None,
        **result,
    }


@app.post("/extraire-entites")
async def extraire_entites(input: TextInput):
    """Extrait les entités (documents, lieux, montants, dates)"""
    texte_n = normaliser_wolof(input.texte)
    entities = extractor.extract(texte_n)
    return {
        "texte": input.texte,
        "texte_normalise": texte_n if texte_n != input.texte.lower() else None,
        "entites": entities,
    }


@app.post("/analyser")
async def analyser(input: AnalyseComplete):
    """
    Analyse complète d'un message — Pipeline NLP multi-modèle :

    1. mBERT (classification) : détection langue + intention + domaine
    2. Mistral (génération) : réponse contextuelle + entités fines
    3. Fallback TF-IDF : si aucun modèle n'est disponible
    """
    texte_corrige = corriger_texte(input.texte)
    texte_normalise = normaliser_wolof(texte_corrige)

    # ─── Mode 1 : mBERT + Mistral (pipeline complet) ───────────────────────
    if mbert and is_mistral_available():
        # mBERT : classification rapide (langue + intention + domaine)
        mbert_result = mbert.predict(texte_normalise)

        # Mistral : analyse fine + génération de réponse
        mistral_result = await analyser_avec_mistral(texte_normalise)

        langue = mbert_result["langue"]["langue"]
        intention = mbert_result["intention"]
        domaine = mbert_result["domaine"]
        confiance = mbert_result["confiance"]
        entites = mistral_result.get("entites", {}) if mistral_result else {}
        reponse_llm = mistral_result.get("reponse") if mistral_result else None

        # Si Mistral a une meilleure confiance, utiliser ses résultats
        if mistral_result and mistral_result.get("confiance", 0) > confiance:
            intention = mistral_result.get("intention", intention)
            domaine = mistral_result.get("domaine", domaine)
            confiance = mistral_result.get("confiance", confiance)

        # Correction par règles si le modèle se trompe
        intention, domaine = corriger_intention_par_regles(texte_normalise, intention, domaine)

        action = suggest_mcp_action(intention, domaine, entites)

        return {
            "texte": input.texte,
            "texte_corrige": texte_corrige if texte_corrige != input.texte.lower().strip() else None,
            "texte_normalise": texte_normalise if texte_normalise != texte_corrige else None,
            "mode": "mbert+mistral",
            "analyse": {
                "langue": {"langue": langue, "confiance": mbert_result["langue"]["confiance"]},
                "intention": {"intention": intention, "domaine": domaine, "confiance": confiance},
                "entites": entites,
                "action_mcp": action,
                "reponse_llm": reponse_llm,
            }
        }

    # ─── Mode 2 : Mistral seul ─────────────────────────────────────────────
    if is_mistral_available():
        mistral_result = await analyser_avec_mistral(texte_normalise)
        if mistral_result:
            langue = mistral_result.get("langue", "francais")
            intention = mistral_result.get("intention", "default")
            domaine = mistral_result.get("domaine", "general")
            entites = mistral_result.get("entites", {})
            confiance = mistral_result.get("confiance", 0.9)

            intention, domaine = corriger_intention_par_regles(texte_normalise, intention, domaine)
            action = suggest_mcp_action(intention, domaine, entites)

            return {
                "texte": input.texte,
                "texte_corrige": texte_corrige if texte_corrige != input.texte.lower().strip() else None,
            "texte_normalise": texte_normalise if texte_normalise != texte_corrige else None,
                "mode": "mistral",
                "analyse": {
                    "langue": {"langue": langue, "confiance": confiance},
                    "intention": {"intention": intention, "domaine": domaine, "confiance": confiance},
                    "entites": entites,
                    "action_mcp": action,
                    "reponse_llm": mistral_result.get("reponse"),
                }
            }

    # ─── Mode 3 : mBERT seul ───────────────────────────────────────────────
    if mbert:
        mbert_result = mbert.predict(texte_normalise)
        entities = extractor.extract(texte_normalise)
        intention_corrigee, domaine_corrige = corriger_intention_par_regles(texte_normalise, mbert_result["intention"], mbert_result["domaine"])
        action = suggest_mcp_action(intention_corrigee, domaine_corrige, entities)

        return {
            "texte": input.texte,
            "texte_corrige": texte_corrige if texte_corrige != input.texte.lower().strip() else None,
            "texte_normalise": texte_normalise if texte_normalise != texte_corrige else None,
            "mode": "mbert",
            "analyse": {
                "langue": mbert_result["langue"],
                "intention": {"intention": intention_corrigee, "domaine": domaine_corrige, "confiance": mbert_result["confiance"]},
                "entites": entities,
                "action_mcp": action,
            }
        }

    # ─── Mode 4 : Fallback TF-IDF + règles ─────────────────────────────────
    langue_result = detect_language(texte_normalise)
    intent_result = classifier.predict(texte_normalise)
    intent_result["intention"], intent_result["domaine"] = corriger_intention_par_regles(texte_normalise, intent_result["intention"], intent_result["domaine"])
    entities = extractor.extract(texte_normalise)
    action = suggest_mcp_action(intent_result["intention"], intent_result["domaine"], entities)

    return {
        "texte": input.texte,
        "texte_corrige": texte_corrige if texte_corrige != input.texte.lower().strip() else None,
            "texte_normalise": texte_normalise if texte_normalise != texte_corrige else None,
        "mode": "local_tfidf",
        "analyse": {
            "langue": langue_result,
            "intention": intent_result,
            "entites": entities,
            "action_mcp": action,
        }
    }


def corriger_domaine_par_regles(texte: str, domaine: str) -> str:
    """Corrige le domaine si le modèle se trompe — surtout pour le wolof."""
    t = texte.lower().strip()
    mots_dgid = ["impôt", "impot", "fiscal", "ninea", "wàll", "wall", "feyee", "fey", "taxe", "contribuable"]
    mots_etat_civil = ["naissance", "mariage", "décès", "deces", "kàrt bëccëg", "acte", "certificat"]
    mots_cnss = ["cnss", "retraite", "pension", "cotisation", "sécurité sociale", "securite sociale"]
    if any(kw in t for kw in mots_dgid):
        return "dgid"
    if any(kw in t for kw in mots_etat_civil):
        return "etat_civil"
    if any(kw in t for kw in mots_cnss):
        return "cnss"
    return domaine


def corriger_intention_par_regles(texte: str, intention: str, domaine: str):
    """Corrige l'intention et le domaine. Retourne (intention, domaine)."""
    t = texte.lower().strip()

    # Étape 0 : corriger le domaine d'abord (important pour le wolof)
    domaine = corriger_domaine_par_regles(t, domaine)

    # Salutations évidentes (français et wolof)
    salutations = [
        "bonjour", "bonsoir", "salut", "hello", "hi",
        "na nga def", "asalaa maalekum", "maalekum salaam",
        "mangi fi", "jërejëf", "nanga def",
    ]
    if any(t.startswith(s) or t == s for s in salutations):
        return "salutation", "general"

    # Inscription CNSS — avant la règle générique "veux/demande"
    if domaine == "cnss":
        if any(kw in t for kw in ["inscrire", "inscription", "bindu", "enregistrer"]):
            return "demande_inscription", domaine

    if domaine == "dgid":
        if any(kw in t for kw in ["comment", "naka", "payer", "fey", "feyee", "procédure", "procedure", "faire"]):
            return "question_procedure", domaine
        if any(kw in t for kw in ["où", "fan", "adresse", "bureau", "biro"]):
            return "question_lieu", domaine
        if any(kw in t for kw in ["combien", "ñaata", "coût", "cout", "prix"]):
            return "question_cout", domaine
    if domaine == "etat_civil":
        if any(kw in t for kw in ["combien", "ñaata", "coût", "cout", "coute", "prix"]):
            return "question_cout", domaine
        if any(kw in t for kw in ["bëgg", "begg", "veux", "obtenir", "demande"]) and intention not in ("demande_document", "question_procedure"):
            return "demande_document", domaine
    if domaine in ("dgid", "cnss"):
        if any(kw in t for kw in ["veux", "bëgg", "begg", "obtenir", "demande", "besoin"]) and intention not in ("demande_document", "demande_inscription", "question_procedure"):
            return "demande_document", domaine
    return intention, domaine


def suggest_mcp_action(intention: str, domaine: str, entities: Dict) -> Dict:
    """
    Suggère quelle action MCP appeler en fonction de l'analyse.
    C'est le routeur intelligent du chatbot.
    """
    actions = {
        ("demande_document", "etat_civil"): {
            "serveur": "etat-civil",
            "tools": ["rechercher_citoyen", "get_acte_naissance"],
            "formulaire": "form-001",
            "description": "Rechercher le citoyen puis proposer le formulaire de demande",
        },
        ("question_lieu", "etat_civil"): {
            "serveur": "etat-civil",
            "tools": ["centres-etat-civil"],
            "formulaire": None,
            "description": "Consulter la liste des centres d'état civil",
        },
        ("question_procedure", "etat_civil"): {
            "serveur": "formulaires",
            "tools": ["get_formulaire", "get_pieces_requises"],
            "formulaire": "form-001",
            "description": "Afficher la procédure et les pièces requises",
        },
        ("question_cout", "etat_civil"): {
            "serveur": "formulaires",
            "tools": ["get_formulaire"],
            "formulaire": "form-001",
            "description": "Indiquer le coût de la démarche",
        },
        ("question_procedure", "dgid"): {
            "serveur": "dgid",
            "tools": ["get_centre_fiscal", "rechercher_contribuable"],
            "formulaire": "form-006",
            "description": "Expliquer la procédure fiscale",
        },
        ("demande_document", "dgid"): {
            "serveur": "dgid",
            "tools": ["rechercher_contribuable", "get_statut_fiscal"],
            "formulaire": "form-005",
            "description": "Vérifier le statut et proposer l'immatriculation",
        },
        ("question_statut", "dgid"): {
            "serveur": "dgid",
            "tools": ["get_statut_fiscal", "check_declarations", "calculer_penalites"],
            "formulaire": None,
            "description": "Vérifier la situation fiscale du contribuable",
        },
        ("question_procedure", "cnss"): {
            "serveur": "formulaires",
            "tools": ["get_formulaire", "get_pieces_requises"],
            "formulaire": "form-008",
            "description": "Expliquer la procédure CNSS",
        },
        ("demande_inscription", "cnss"): {
            "serveur": "formulaires",
            "tools": ["preremplir_formulaire", "soumettre_formulaire"],
            "formulaire": "form-008",
            "description": "Aider à remplir le formulaire d'inscription CNSS",
        },
        ("salutation", "general"): {
            "serveur": None,
            "tools": [],
            "formulaire": None,
            "description": "Répondre à la salutation et proposer les services",
        },
        ("suivi_demande", "general"): {
            "serveur": "formulaires",
            "tools": ["suivre_demande"],
            "formulaire": None,
            "description": "Rechercher le statut de la demande",
        },
    }

    key = (intention, domaine)
    if key in actions:
        return actions[key]

    # Fallback par domaine
    domain_defaults = {
        "etat_civil": {
            "serveur": "etat-civil",
            "tools": ["rechercher_citoyen"],
            "formulaire": None,
            "description": "Rechercher dans les registres d'état civil",
        },
        "dgid": {
            "serveur": "dgid",
            "tools": ["rechercher_contribuable"],
            "formulaire": None,
            "description": "Rechercher dans les données fiscales",
        },
        "cnss": {
            "serveur": "formulaires",
            "tools": ["lister_formulaires"],
            "formulaire": None,
            "description": "Lister les formulaires CNSS disponibles",
        },
    }

    return domain_defaults.get(domaine, {
        "serveur": None,
        "tools": [],
        "formulaire": None,
        "description": "Demander des précisions à l'utilisateur",
    })


# === Lancement ===
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
