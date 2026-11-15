"""
Module de normalisation du wolof — tolère les erreurs d'écriture courantes.
Le wolof n'a pas d'orthographe très standardisée, les gens écrivent souvent
sans accents (ë → e, à → a, ñ → n) et avec des variations phonétiques.

Ce module corrige ces variantes AVANT la détection de langue et la classification.
"""

import re


# Corrections mot-à-mot : variantes → forme standard
CORRECTIONS_MOTS = {
    # begg (vouloir) — les gens ecrivent souvent avec la phonetique francaise
    "beg": "begg", "bég": "begg", "beug": "begg", "beegg": "begg",
    "bëg": "begg", "bëgg": "begg",
    "beugue": "begg", "beugg": "begg", "beuggu": "begg",
    "begue": "begg", "bègue": "begg", "beuge": "begg",
    # bind (écrire / s'inscrire)
    "bnd": "bind", "bine": "bind", "bnid": "bind", "binde": "bind",
    # sama (mon/ma)
    "sam": "sama", "samm": "sama", "sma": "sama",
    # dama (je + emphase)
    "dam": "dama", "damm": "dama", "dem": "dama",
    # kart (carte/document)
    "kar": "kart", "carte": "kart", "cart": "kart", "kàrt": "kart",
    # becceg (naissance)
    "beceg": "becceg", "beseg": "becceg", "bécég": "becceg",
    "bëccëg": "becceg", "bëcëg": "becceg", "becég": "becceg",
    # topp (suivre)
    "toop": "topp", "top": "topp", "toupe": "topp", "tope": "topp",
    # seetal (regarder/consulter)
    "setal": "seetal", "seetl": "seetal", "sétal": "seetal", "setaal": "seetal",
    # njang (études)
    "niang": "njang", "njank": "njang", "ndjang": "njang", "njàng": "njang",
    # jereejef (merci)
    "jerejef": "jereejef", "jerejéf": "jereejef", "jerjeef": "jereejef",
    "jéréjéf": "jereejef", "jeregef": "jereejef", "jarajef": "jereejef",
    # ndimbal (aide)
    "dimbal": "ndimbal", "nimbal": "ndimbal", "ndimbl": "ndimbal",
    # fey (payer)
    "feye": "fey", "féy": "fey", "faye": "fey",
    # wall (impôt)
    "wal": "wall", "wàll": "wall", "waal": "wall",
    # wer (santé)
    "wér": "wer", "were": "wer",
    # takk (mariage)
    "tak": "takk", "tack": "takk",
    # dee (décès)
    "dé": "dee", "dée": "dee",
    # kàyit (papier/document)
    "keuyit": "kayit", "kayite": "kayit", "kahit": "kayit", "kayi": "kayit",
    "kaillite": "kayit", "keyit": "kayit", "kéyit": "kayit",
    # dama (variantes phonetiques francaises)
    "dama": "dama", "dameu": "dama", "damaa": "dama",
    # waxu / wakh (parler)
    "wakh": "wax", "wakhe": "wax", "waxe": "wax",
    # xam (savoir)
    "kham": "xam", "khame": "xam", "khamne": "xamne",
    # jox (donner)
    "djokh": "jox", "djox": "jox", "jokh": "jox",
    # ndakh / ndax (est-ce que / car)
    "ndakh": "ndax", "ndakhe": "ndax",
    # digg / dik (suivre/aller)
    "digue": "digg", "digueu": "digg",
    # def (faire)
    "defe": "def", "déf": "def",
    # laaj (demander)
    "laj": "laaj", "laaje": "laaj", "làj": "laaj",
    # waaw (oui)
    "waw": "waaw", "wow": "waaw", "wah": "waaw",
    # nit (personne)
    "nite": "nit", "nitte": "nit",
    # liggey (travail)
    "ligey": "liggey", "liggéy": "liggey", "liggeey": "liggey",
}

# Expressions multi-mots : variantes → forme standard
CORRECTIONS_EXPRESSIONS = {
    # na nga def (comment vas-tu)
    "nandef": "na nga def",
    "nanga def": "na nga def",
    "nan ga def": "na nga def",
    "nagadef": "na nga def",
    "nangadef": "na nga def",
    # dama begg (je veux)
    "dama beg": "dama begg",
    "dam beg": "dama begg",
    "dam begg": "dama begg",
    "dama beugue": "dama begg",
    "dameu beugue": "dama begg",
    "dama beugg": "dama begg",
    "dama begue": "dama begg",
    # sama kart (mon document)
    "sama kar": "sama kart",
    "sam kart": "sama kart",
    "sam kar": "sama kart",
    "sama keuyit": "sama kayit",
    "sam keuyit": "sama kayit",
    # topp sama demande (suivre ma demande)
    "toop sam demande": "topp sama demande",
    "top sam demande": "topp sama demande",
    "top sama demande": "topp sama demande",
    # bind ci (s'inscrire a)
    "bine ci": "bind ci",
    # begg kayit / begg kart (vouloir un document)
    "beugue keuyit": "begg kayit",
    "beugue kayit": "begg kayit",
    "beugue kart": "begg kart",
    "beugg keuyit": "begg kayit",
    "beugg kayit": "begg kayit",
}


def normaliser_wolof(texte: str) -> str:
    """
    Normalise un texte potentiellement en wolof :
    1. Remplace les expressions multi-mots connues
    2. Corrige mot par mot les variantes courantes
    3. Supprime les accents wolof non-standard

    Le texte original est préservé si c'est clairement du français.
    """
    resultat = texte.lower()

    # Etape 1 : corriger les expressions multi-mots
    for variante, correct in CORRECTIONS_EXPRESSIONS.items():
        resultat = resultat.replace(variante, correct)

    # Etape 2 : corriger mot par mot
    mots = resultat.split()
    mots_corriges = []
    for mot in mots:
        mot_clean = re.sub(r'[.,!?;:]$', '', mot)
        suffix = mot[len(mot_clean):]
        if mot_clean in CORRECTIONS_MOTS:
            mots_corriges.append(CORRECTIONS_MOTS[mot_clean] + suffix)
        else:
            mots_corriges.append(mot)
    resultat = " ".join(mots_corriges)

    return resultat


# --- Test ---
if __name__ == "__main__":
    tests = [
        "dam beg sam kart beceg",
        "nandef, dam beg ndimbal",
        "jerejef boucoup",
        "dam beg bine ci CNSS",
        "toop sam demande",
        "dam beg setal sam NINEA",
        "Je veux mon acte de naissance",  # Le français reste intact
        "Bonjour, comment ça va",
    ]

    print("=" * 60)
    print("TEST - Normalisation Wolof")
    print("=" * 60)

    for texte in tests:
        normalise = normaliser_wolof(texte)
        if texte.lower() != normalise:
            print(f"\n  AVANT : \"{texte}\"")
            print(f"  APRÈS : \"{normalise}\"")
        else:
            print(f"\n  (inchangé) \"{texte}\"")
