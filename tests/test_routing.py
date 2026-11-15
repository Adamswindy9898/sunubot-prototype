"""
Tests du routing frontend — simulation des règles de détection de SunuBot
Ces tests vérifient la logique de routing du chatbot (regex + priorités) telle
qu'implémentée dans prototype/frontend/app/page.tsx, reproduite ici en Python.
"""
import re
import pytest


def detect_routing(message: str) -> str:
    """
    Reproduit la logique de routing de page.tsx.
    Retourne le service qui serait activé.
    """
    lower = message.lower()

    is_wolof = bool(re.search(r'\b(dama|bëgg|sama|naka|ndax|jël|wàll|kàrt|bëccëg)\b', lower))
    is_consultation = bool(re.search(r'\b(consulter?|vérifier?|voir|ana|status)\b', lower))

    is_ninea = bool(re.search(r'\b(ninea|immatricul|registre.*commerce|rccm|dama begg ninea|entreprise)\b', lower))
    is_dgid_impots = bool(re.search(r'\b(dgid|impots?|taxe|tva|declaration|fey wall|centre fiscal|situation fiscale|patente|payer.*impot|comment.*payer)\b', lower))
    is_cnss = bool(re.search(r'\b(cnss|allocations?|retraite|cotisation|pension|sécurité sociale)\b', lower))
    is_cni = bool(re.search(r'\b(renouveler|renouvellement|cni|carte.*identit|kart boppam|expire)\b', lower))
    is_etat_civil = bool(re.search(r'\b(acte|naissance|mariage|décès|état civil|mairie|meeri|kàrt bëccëg)\b', lower))
    is_sante = bool(re.search(r'\b(cmu|santé|mutuelle|maladie|hôpital)\b', lower))
    is_education = bool(re.search(r'\b(bourse|étudiant|université|scolarité|njàng)\b', lower))

    # Priorités de routing (même ordre que page.tsx)
    if is_dgid_impots and not is_consultation and not is_ninea:
        return "dgid_impots"
    if is_ninea and not is_consultation:
        return "ninea"
    if is_cnss and not is_consultation:
        return "cnss"
    if is_cni:
        return "etat_civil_cni"
    if is_etat_civil:
        return "etat_civil"
    if is_sante:
        return "sante"
    if is_education:
        return "education"
    return "general"


class TestRoutingDGID:
    def test_payer_impots(self):
        assert detect_routing("payez vos impots") == "dgid_impots"

    def test_comment_payer_impots(self):
        assert detect_routing("comment payer mes impôts") == "dgid_impots"

    def test_declaration_tva(self):
        assert detect_routing("déclaration TVA") == "dgid_impots"

    def test_centre_fiscal(self):
        assert detect_routing("où est mon centre fiscal") == "dgid_impots"

    def test_situation_fiscale(self):
        assert detect_routing("ma situation fiscale") == "dgid_impots"

    def test_taxe(self):
        assert detect_routing("payer ma taxe") == "dgid_impots"

    def test_dgid_direct(self):
        assert detect_routing("DGID impôts") == "dgid_impots"

    def test_fey_wall_wolof(self):
        assert detect_routing("fey wall") == "dgid_impots"

    def test_patente(self):
        assert detect_routing("comment payer ma patente commerciale") == "dgid_impots"


class TestRoutingNINEA:
    def test_ninea_direct(self):
        assert detect_routing("Je veux un NINEA") == "ninea"

    def test_immatriculation_entreprise(self):
        assert detect_routing("immatriculer mon entreprise") == "ninea"

    def test_rccm(self):
        assert detect_routing("registre de commerce RCCM") == "ninea"

    def test_ninea_ne_va_pas_dgid(self):
        # NINEA ne doit pas déclencher DGID même si "taxe" mentionné
        result = detect_routing("NINEA pour déclarer mon entreprise")
        assert result == "ninea"

    def test_ninea_wolof(self):
        assert detect_routing("dama begg ninea") == "ninea"


class TestRoutingEtatCivil:
    def test_acte_naissance(self):
        assert detect_routing("Je veux mon acte de naissance") == "etat_civil"

    def test_kart_becceg(self):
        assert detect_routing("dama bëgg sama kàrt bëccëg") == "etat_civil"

    def test_acte_mariage(self):
        assert detect_routing("acte de mariage") == "etat_civil"

    def test_mairie(self):
        assert detect_routing("horaires de la mairie") == "etat_civil"

    def test_renouveler_cni(self):
        result = detect_routing("renouveler ma carte d'identité")
        assert result == "etat_civil_cni"

    def test_cni_expire(self):
        result = detect_routing("ma CNI a expiré")
        assert result == "etat_civil_cni"


class TestRoutingCNSS:
    def test_inscription_cnss(self):
        assert detect_routing("Je veux m'inscrire à la CNSS") == "cnss"

    def test_allocations(self):
        assert detect_routing("allocations familiales") == "cnss"

    def test_retraite(self):
        assert detect_routing("quand prendre ma retraite") == "cnss"

    def test_cotisation(self):
        assert detect_routing("taux de cotisation CNSS") == "cnss"


class TestRoutingPriorites:
    def test_ninea_avant_dgid(self):
        # "NINEA" + "taxe" doit router vers NINEA, pas DGID
        result = detect_routing("NINEA et taxe d'entreprise")
        assert result == "ninea"

    def test_dgid_avant_etat_civil(self):
        # "impots" (sans accent) doit router vers DGID prioritairement
        result = detect_routing("payer mes impots")
        assert result == "dgid_impots"

    def test_dgid_avant_etat_civil_tva(self):
        # TVA ne doit pas router vers état civil
        result = detect_routing("declaration tva annuelle")
        assert result == "dgid_impots"

    def test_general_si_inconnu(self):
        assert detect_routing("bonjour je veux de l'aide") == "general"
        assert detect_routing("salut") == "general"


class TestRoutingSante:
    def test_cmu(self):
        assert detect_routing("Je veux la carte CMU") == "sante"

    def test_mutuelle_sante(self):
        assert detect_routing("couverture maladie mutuelle") == "sante"


class TestRoutingEducation:
    def test_bourse_etudiant(self):
        assert detect_routing("bourse pour mon enfant étudiant") == "education"

    def test_inscription_universite(self):
        assert detect_routing("inscription université") == "education"
