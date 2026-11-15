"""
Module de détection de langue Wolof / Français / Mixte
Utilise une approche hybride : indicateurs linguistiques + n-grammes + modèle statistique
"""

import re
from typing import Tuple

# Indicateurs grammaticaux wolof (morphèmes, marqueurs verbaux, particules)
WOLOF_MARKERS = {
    # Marqueurs verbaux
    "naa", "nga", "na", "nañu", "ngeen",
    "dama", "danga", "dafa", "dañu", "dangeen",
    "dinaa", "dinga", "dina", "dinañu",
    "maa", "yaa", "moo", "ñoo", "yeena",
    # Particules et connecteurs
    "ci", "ak", "bu", "su", "mu", "lu", "gu", "ku",
    "bi", "gi", "ji", "wi", "ki", "mi", "si",
    "yi", "ñi",
    # Pronoms et possessifs
    "sama", "sa", "sunu", "seen", "am",
    "man", "yow", "moom", "ñoom",
    # Adverbes et modificateurs
    "rekk", "lool", "tuuti", "lu", "ndax",
    "mooy", "lay", "laa", "ngi",
    # Négation
    "du", "duma", "doo", "dunu",
    # Vocabulaire courant wolof
    "bëgg", "begg", "def", "dem", "ñëw", "xam", "gis", "am",
    "nekk", "wax", "jël", "bind", "jàng", "feye",
    "nit", "doom", "kër", "dëkk", "réew",
    "waaw", "déedéet",
    "jërejëf", "jereejef", "ndimbal",
    # Variantes phonetiques (ecriture francisee)
    "beugue", "beugg", "keuyit", "kayit", "kart",
    "topp", "seetal", "laaj", "njang",
    "dama", "sama", "dinaa", "dameu",
}

# Indicateurs français
FRENCH_MARKERS = {
    # Pronoms sujets
    "je", "tu", "il", "elle", "nous", "vous", "ils", "elles", "on",
    # Déterminants
    "le", "la", "les", "un", "une", "des", "du", "au", "aux",
    # Prépositions courantes
    "de", "pour", "avec", "dans", "sur", "par", "en", "entre",
    # Conjonctions
    "et", "ou", "mais", "donc", "car", "que", "qui",
    # Verbes auxiliaires
    "est", "suis", "sont", "sommes", "êtes",
    "ai", "as", "avons", "avez", "ont",
    # Mots interrogatifs
    "comment", "pourquoi", "quand", "combien",
    # Possessifs
    "mon", "ton", "son", "notre", "votre", "leur",
    "ma", "ta", "sa", "mes", "tes", "ses",
    # Négation
    "ne", "pas", "plus", "jamais", "rien",
    # Autres
    "ce", "cette", "ces", "cet",
    "être", "avoir", "faire", "aller", "vouloir", "pouvoir",
    # Salutations et mots courants
    "bonjour", "bonsoir", "salut", "merci", "oui", "non",
    "aide", "besoin", "information", "document",
}

# N-grammes typiques du wolof (combinaisons de caractères fréquentes)
WOLOF_NGRAMS = [
    "ëg", "ëj", "ëf", "ël", "ëw", "ëc", "ëb",
    "àr", "àl", "àn", "ày",
    "oo", "ee", "aa",
    "mb", "nd", "ng", "nj", "ñ",
    "cc", "pp", "tt", "kk",
    "xam", "bëg", "wax", "ñëw",
]


def tokenize(text: str) -> list:
    """Tokenise un texte en mots (supprime la ponctuation)"""
    return re.findall(r'\b\w+\b', text.lower())


def detect_language(text: str) -> dict:
    """
    Détecte la langue d'un texte (wolof, francais, ou mixte).

    Retourne:
        dict avec:
            - langue: "wolof" | "francais" | "mixte"
            - score_wolof: float (0-1)
            - score_francais: float (0-1)
            - confiance: float (0-1)
            - methode: str (explication de la méthode utilisée)
    """
    tokens = tokenize(text)

    if not tokens:
        return {
            "langue": "francais",
            "score_wolof": 0.0,
            "score_francais": 0.0,
            "confiance": 0.0,
            "methode": "texte_vide"
        }

    # Score basé sur les marqueurs
    score_wolof = 0.0
    score_francais = 0.0

    for token in tokens:
        if token in WOLOF_MARKERS:
            score_wolof += 1.0
        if token in FRENCH_MARKERS:
            score_francais += 1.0

    # Bonus pour les n-grammes wolof dans le texte complet
    text_lower = text.lower()
    for ngram in WOLOF_NGRAMS:
        if ngram in text_lower:
            score_wolof += 0.3

    # Bonus pour les caractères spéciaux wolof (ë, à, ñ, é dans contexte wolof)
    wolof_chars = len(re.findall(r'[ëàñ]', text_lower))
    score_wolof += wolof_chars * 0.5

    # Normaliser les scores
    total = len(tokens)
    norm_wolof = score_wolof / total if total > 0 else 0
    norm_francais = score_francais / total if total > 0 else 0

    # Déterminer la langue
    if norm_wolof > norm_francais * 1.3:
        langue = "wolof"
        confiance = min(norm_wolof, 1.0)
    elif norm_francais > norm_wolof * 1.3:
        langue = "francais"
        confiance = min(norm_francais, 1.0)
    elif score_wolof > 0 and score_francais > 0:
        langue = "mixte"
        confiance = 0.6
    else:
        # Par défaut, considérer français si aucun indicateur
        langue = "francais"
        confiance = 0.3

    return {
        "langue": langue,
        "score_wolof": round(norm_wolof, 3),
        "score_francais": round(norm_francais, 3),
        "confiance": round(confiance, 3),
        "methode": "marqueurs_ngrams"
    }


def is_wolof(text: str) -> bool:
    """Raccourci : retourne True si le texte est principalement en wolof"""
    return detect_language(text)["langue"] == "wolof"


def is_french(text: str) -> bool:
    """Raccourci : retourne True si le texte est principalement en français"""
    return detect_language(text)["langue"] == "francais"


# --- Test rapide ---
if __name__ == "__main__":
    tests = [
        "Dama bëgg sama kàrt bëccëg",
        "Je veux mon acte de naissance",
        "Naka laa feyee sama wàll?",
        "Comment payer mes impôts?",
        "Dama am retard ci sama déclaration",
        "Na nga def",
        "Bonjour, je veux de l'aide",
    ]

    print("=" * 60)
    print("TEST - Détection de langue Wolof/Français")
    print("=" * 60)

    for text in tests:
        result = detect_language(text)
        print(f"\n📝 \"{text}\"")
        print(f"   → Langue: {result['langue']} (confiance: {result['confiance']:.0%})")
        print(f"   → Scores: wolof={result['score_wolof']:.2f}, français={result['score_francais']:.2f}")
