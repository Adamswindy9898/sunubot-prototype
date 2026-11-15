"""
Tests unitaires — Détection de langue (wolof / français / mixte)
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "nlp", "src"))
from langue_detector import detect_language, is_wolof, is_french


class TestWolof:
    def test_salutation_wolof(self):
        r = detect_language("Na nga def, dama bëgg ndimbal")
        assert r["langue"] == "wolof"

    def test_acte_naissance_wolof(self):
        r = detect_language("Dama bëgg sama kàrt bëccëg")
        assert r["langue"] == "wolof"

    def test_impot_wolof(self):
        r = detect_language("Naka laa feyee sama wàll?")
        assert r["langue"] == "wolof"

    def test_retraite_wolof(self):
        r = detect_language("Kañ laa man a jël sama retraite?")
        assert r["langue"] == "wolof"

    def test_cni_wolof(self):
        r = detect_language("Sama kàrt boppam jeex na, naka laa def?")
        assert r["langue"] == "wolof"

    def test_is_wolof_helper(self):
        assert is_wolof("Dama bëgg sama kàrt bëccëg") is True
        assert is_wolof("Je veux mon acte de naissance") is False


class TestFrancais:
    def test_acte_naissance_fr(self):
        r = detect_language("Je veux mon acte de naissance")
        assert r["langue"] == "francais"

    def test_impot_fr(self):
        r = detect_language("Comment payer mes impôts?")
        assert r["langue"] == "francais"

    def test_ninea_fr(self):
        r = detect_language("Je veux obtenir un NINEA pour mon entreprise")
        assert r["langue"] == "francais"

    def test_cni_fr(self):
        r = detect_language("Je veux renouveler ma carte d'identité nationale")
        assert r["langue"] == "francais"

    def test_cnss_fr(self):
        r = detect_language("Je veux m'inscrire à la CNSS")
        assert r["langue"] == "francais"

    def test_salutation_fr(self):
        r = detect_language("Bonjour, j'ai besoin d'aide")
        assert r["langue"] == "francais"

    def test_is_french_helper(self):
        assert is_french("Comment payer mes impôts?") is True
        assert is_french("Dama bëgg sama kàrt bëccëg") is False


class TestMixte:
    def test_retard_declaration(self):
        r = detect_language("Dama am retard ci sama déclaration")
        assert r["langue"] in ("mixte", "wolof")

    def test_paiement_mobile(self):
        r = detect_language("Ndax man naa fey wàll ak Orange Money?")
        assert r["langue"] in ("mixte", "wolof")


class TestRetourStructure:
    def test_structure_retour(self):
        r = detect_language("Je veux mon acte de naissance")
        assert "langue" in r
        assert "score_wolof" in r
        assert "score_francais" in r
        assert "confiance" in r
        assert r["langue"] in ("wolof", "francais", "mixte")
        assert 0.0 <= r["confiance"] <= 1.0

    def test_texte_vide(self):
        r = detect_language("")
        assert r["langue"] in ("francais", "wolof", "mixte")
        assert r["confiance"] == 0.0
