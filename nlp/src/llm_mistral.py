"""
Module LLM Mistral — Intégration du modèle Mistral pour la compréhension
multilingue français/wolof des requêtes administratives.

Utilise l'API Mistral (mistral-small-latest) avec un prompt système
spécialisé pour le contexte administratif sénégalais.
"""

import os
import json
from typing import Dict, Optional

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")
MISTRAL_MODEL = os.getenv("MISTRAL_MODEL", "mistral-small-latest")

SYSTEM_PROMPT = """Tu es SunuBot, un assistant administratif multilingue (français/wolof) pour les services publics du Sénégal.

Tu dois analyser le message de l'utilisateur et retourner un JSON avec :
- "langue": "francais" ou "wolof" ou "mixte"
- "intention": une parmi [salutation, demande_document, demande_inscription, question_procedure, question_lieu, question_cout, question_statut, suivi_demande, remerciement, au_revoir]
- "domaine": un parmi [etat_civil, dgid, cnss, education, sante, general]
- "entites": objet avec les entités détectées (document, lieu, nom, numero, montant)
- "confiance": nombre entre 0 et 1
- "reponse": une réponse courte et utile en français ou wolof (selon la langue détectée)

Contexte des services :
- État civil : acte de naissance, mariage, décès, certificat de nationalité
- DGID : NINEA, impôts, TVA, patente, centre fiscal, déclaration
- CNSS : inscription, allocations familiales, retraite, accident travail
- Éducation : bourses d'études
- Santé : CMU (Couverture Maladie Universelle)

Le wolof est une langue sénégalaise. Exemples :
- "dama begg sama kart becceg" = "je veux mon acte de naissance"
- "fan la centre fiscal bi nekk" = "où se trouve le centre fiscal"
- "naka laa feyee sama wall" = "comment payer mes impôts"
- "bind ci CNSS" = "s'inscrire à la CNSS"

Retourne UNIQUEMENT le JSON, sans texte autour."""


async def analyser_avec_mistral(texte: str) -> Optional[Dict]:
    """Analyse un message avec le LLM Mistral via l'API."""
    if not MISTRAL_API_KEY:
        return None

    try:
        from mistralai.client import Mistral

        client = Mistral(api_key=MISTRAL_API_KEY)

        response = await client.chat.complete_async(
            model=MISTRAL_MODEL,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": texte},
            ],
            temperature=0.1,
            max_tokens=500,
        )

        content = response.choices[0].message.content.strip()

        # Extraire le JSON de la réponse
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        content = content.strip()

        result = json.loads(content)
        return result

    except Exception as e:
        print(f"[Mistral Error] {e}")
        return None


async def generer_reponse_mistral(texte: str, contexte: str = "") -> Optional[str]:
    """Génère une réponse conversationnelle avec Mistral."""
    if not MISTRAL_API_KEY:
        return None

    try:
        from mistralai.client import Mistral

        client = Mistral(api_key=MISTRAL_API_KEY)

        system = """Tu es SunuBot, assistant administratif multilingue (français/wolof) du Sénégal.
Réponds de manière concise, utile et polie. Si l'utilisateur parle en wolof, réponds en wolof.
Si tu ne peux pas aider, oriente vers le service approprié."""

        if contexte:
            system += f"\n\nContexte actuel :\n{contexte}"

        response = await client.chat.complete_async(
            model=MISTRAL_MODEL,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": texte},
            ],
            temperature=0.3,
            max_tokens=300,
        )

        return response.choices[0].message.content.strip()

    except Exception as e:
        print(f"[Mistral Response Error] {e}")
        return None


def is_mistral_available() -> bool:
    """Vérifie si Mistral est configuré."""
    return bool(MISTRAL_API_KEY)
