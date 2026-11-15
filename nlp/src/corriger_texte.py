"""
Correcteur de fautes — tolère les erreurs de frappe courantes en français et wolof.
Fonctionne par remplacement de mots et expressions connus dans le domaine administratif.
Pas besoin de dictionnaire complet : on cible les mots-clés que le chatbot utilise.
"""

import re
from difflib import get_close_matches

# Vocabulaire administratif de référence (mots que le chatbot doit reconnaître)
VOCABULAIRE = [
    # Actions
    "veux", "vouloir", "obtenir", "demander", "inscrire", "inscription",
    "payer", "consulter", "suivre", "renouveler", "vérifier",
    # Documents
    "acte", "naissance", "mariage", "décès", "certificat", "nationalité",
    "extrait", "document", "carte", "identité", "passeport",
    # Services
    "impôts", "impots", "fiscal", "fiscale", "contribuable",
    "bourse", "études", "retraite", "pension", "cotisation",
    "sécurité", "sociale",
    # Lieux
    "bureau", "centre", "adresse", "commune", "mairie",
    # Questions
    "comment", "combien", "quand", "délai", "coût", "prix",
    "procédure", "pièces", "requises",
    # Domaines
    "état", "civil",
    # Salutations
    "bonjour", "bonsoir", "salut", "merci",
]

# Corrections directes : faute fréquente → forme correcte
CORRECTIONS_FR = {
    # Verbes courants
    "veu": "veux", "veut": "veux", "vx": "veux", "je veu": "je veux",
    "veux": "veux", "veus": "veux",
    "obtenire": "obtenir", "optenir": "obtenir", "abtenir": "obtenir",
    "demande": "demande", "dmande": "demande", "demnde": "demande",
    "inscrire": "inscrire", "inscrir": "inscrire", "inscrirs": "inscrire",
    "inscrir": "inscrire", "inscire": "inscrire", "insrire": "inscrire",
    "inscrisption": "inscription", "inscrption": "inscription",
    "inscripion": "inscription", "insription": "inscription",
    "paye": "payer", "payé": "payer", "peyer": "payer", "pyer": "payer",
    "consulte": "consulter", "consuter": "consulter", "consultr": "consulter",
    "suivr": "suivre", "suive": "suivre", "suivi": "suivi",
    "renouvler": "renouveler", "renouveller": "renouveler", "renouvel": "renouveler",
    "verifie": "vérifier", "verifier": "vérifier", "verifié": "vérifier",

    # Documents — erreurs très fréquentes
    "naisance": "naissance", "naissence": "naissance", "naisence": "naissance",
    "naissane": "naissance", "nassance": "naissance", "naiscance": "naissance",
    "naissan": "naissance", "naissanc": "naissance", "naissanse": "naissance",
    "marriag": "mariage", "marige": "mariage", "mariage": "mariage",
    "mariag": "mariage", "marrage": "mariage", "mriage": "mariage",
    "deces": "décès", "déces": "décès", "decé": "décès", "dece": "décès",
    "déce": "décès", "dessais": "décès", "décé": "décès",
    "certifica": "certificat", "certificas": "certificat", "certifikat": "certificat",
    "certivicat": "certificat", "sertificat": "certificat",
    "nationalite": "nationalité", "nacionalité": "nationalité",
    "nantionalité": "nationalité", "nationalit": "nationalité",
    "extrais": "extrait", "exstrait": "extrait", "extrai": "extrait",
    "documant": "document", "documnet": "document", "documen": "document",
    "identite": "identité", "idantité": "identité", "identit": "identité",
    "passeport": "passeport", "pasport": "passeport", "passepor": "passeport",

    # Services / Domaines
    "impot": "impôts", "impôt": "impôts", "impo": "impôts", "impots": "impôts",
    "impôts": "impôts", "inpot": "impôts", "inpots": "impôts",
    "fiscale": "fiscale", "fical": "fiscal", "fiskal": "fiscal",
    "boursse": "bourse", "bors": "bourse", "bource": "bourse",
    "etude": "études", "etudes": "études", "étude": "études",
    "retrait": "retraite", "retraitte": "retraite",
    "securite": "sécurité", "sécurite": "sécurité",
    "sosiale": "sociale", "social": "sociale",

    # Lieux
    "burea": "bureau", "buro": "bureau", "burau": "bureau",
    "centr": "centre", "sant": "centre",
    "adrese": "adresse", "adress": "adresse", "addresse": "adresse",
    "comun": "commune", "commine": "commune", "comune": "commune",
    "mairi": "mairie", "meri": "mairie",

    # Questions
    "comen": "comment", "coment": "comment", "commant": "comment", "cmt": "comment",
    "combian": "combien", "conbien": "combien", "combein": "combien",
    "quan": "quand", "qand": "quand", "quant": "quand",
    "delai": "délai", "delais": "délai", "délay": "délai",
    "cout": "coût", "cou": "coût", "couts": "coût",
    "pris": "prix", "pri": "prix",
    "procedur": "procédure", "procedure": "procédure", "prosédure": "procédure",
    "prosedure": "procédure",
    "piece": "pièces", "piéces": "pièces", "pieces": "pièces",
    "requis": "requises", "reqise": "requises",

    # État civil
    "etat": "état", "eta": "état", "etats": "état",
    "civile": "civil", "sivil": "civil",

    # Salutations
    "bonour": "bonjour", "bonjou": "bonjour", "bonjr": "bonjour",
    "bnjour": "bonjour", "bjr": "bonjour", "bsr": "bonsoir",
    "merssi": "merci", "mersi": "merci", "merçi": "merci",

    # CNSS / DGID / NINEA
    "cns": "cnss", "css": "cnss", "cnns": "cnss",
    "dgd": "dgid", "dgi": "dgid",
    "ninéa": "ninea", "ninéa": "ninea", "niena": "ninea",
}

# Expressions multi-mots
CORRECTIONS_EXPRESSIONS = {
    "acte de naisance": "acte de naissance",
    "acte naisance": "acte de naissance",
    "acte de naisence": "acte de naissance",
    "acte naissence": "acte de naissance",
    "acte de naissanse": "acte de naissance",
    "acte naissance": "acte de naissance",
    "extrait de naisance": "extrait de naissance",
    "extrait naisance": "extrait de naissance",
    "acte de marige": "acte de mariage",
    "acte marige": "acte de mariage",
    "acte de marriag": "acte de mariage",
    "carte d identite": "carte d'identité",
    "carte didentite": "carte d'identité",
    "carte identite": "carte d'identité",
    "carte identité": "carte d'identité",
    "je veu mon": "je veux mon",
    "je veu un": "je veux un",
    "je veu m": "je veux m",
    "je veut": "je veux",
    "coment payer": "comment payer",
    "coment faire": "comment faire",
    "combian ca coute": "combien ça coûte",
    "combien coute": "combien coûte",
    "combien ca coute": "combien ça coûte",
    "ou est le": "où est le",
    "ou se trouve": "où se trouve",
    "etat civil": "état civil",
    "securite sociale": "sécurité sociale",
    "je veu inscrire": "je veux m'inscrire",
    "je veu m inscrire": "je veux m'inscrire",
    "je veux m inscrire": "je veux m'inscrire",
    "inscrire cnss": "m'inscrire CNSS",
    "inscrire a la cnss": "m'inscrire à la CNSS",
    "payer mes impot": "payer mes impôts",
    "payer mes inpot": "payer mes impôts",
    "payer impot": "payer mes impôts",
    "mon ninea": "mon NINEA",
    "un ninea": "un NINEA",
    "demande de boursse": "demande de bourse",
    "demande bource": "demande de bourse",
}


MOTS_CORRECTS = set(VOCABULAIRE) | set(CORRECTIONS_FR.values())


def corriger_texte(texte: str) -> str:
    """
    Corrige les fautes courantes dans un message utilisateur.
    Fonctionne en 3 étapes :
    1. Correction des expressions multi-mots
    2. Correction mot par mot (dictionnaire)
    3. Correction floue (difflib) pour les mots proches du vocabulaire
    """
    resultat = texte.lower().strip()

    # Étape 1 : expressions multi-mots (triées par longueur décroissante)
    for faute, correct in sorted(CORRECTIONS_EXPRESSIONS.items(), key=lambda x: -len(x[0])):
        resultat = resultat.replace(faute, correct)

    # Étape 2 : mot par mot (ne pas re-corriger les mots déjà corrects)
    mots = resultat.split()
    mots_corriges = []
    for mot in mots:
        mot_clean = re.sub(r"[.,!?;:']$", "", mot)
        suffix = mot[len(mot_clean):]
        if mot_clean in MOTS_CORRECTS:
            mots_corriges.append(mot)
        elif mot_clean in CORRECTIONS_FR:
            mots_corriges.append(CORRECTIONS_FR[mot_clean] + suffix)
        else:
            # Étape 3 : correction floue si le mot est long et ressemble au vocabulaire
            if len(mot_clean) >= 4:
                matches = get_close_matches(mot_clean, VOCABULAIRE, n=1, cutoff=0.75)
                if matches:
                    mots_corriges.append(matches[0] + suffix)
                else:
                    mots_corriges.append(mot)
            else:
                mots_corriges.append(mot)

    return " ".join(mots_corriges)


if __name__ == "__main__":
    tests = [
        "je veu mon acte de naisance",
        "coment payer mes impot",
        "je veu m inscrire a la cnss",
        "combien coute un certifica de nationalite",
        "ou est le burea des impot",
        "je veu un ninea pour mon entreprise",
        "bonour je veu mon extrait de naisance",
        "je veut obtenir mon acte de marige",
        "je veu suivr ma demande",
        "demande de boursse d etudes",
        "Bonjour je veux mon acte de naissance",  # déjà correct
        "Na nga def dama begg sama kart becceg",  # wolof (ne pas casser)
    ]

    print("=" * 70)
    print("TEST — Correcteur de fautes SunuBot")
    print("=" * 70)

    for texte in tests:
        corrige = corriger_texte(texte)
        if texte.lower().strip() != corrige:
            print(f"\n  AVANT : \"{texte}\"")
            print(f"  APRÈS : \"{corrige}\"")
        else:
            print(f"\n  (inchangé) \"{texte}\"")
