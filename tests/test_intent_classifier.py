"""
Tests unitaires — Classification d'intention et extraction d'entités
"""
import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "nlp", "src"))
from intent_classifier import IntentClassifier, EntityExtractor


@pytest.fixture(scope="module")
def classifier():
    return IntentClassifier()


@pytest.fixture(scope="module")
def extractor():
    return EntityExtractor()


class TestIntentClassifier:
    def test_demande_document_acte(self, classifier):
        r = classifier.predict("Je veux mon acte de naissance")
        assert r["intention"] == "demande_document"
        assert r["confiance"] > 0.0

    def test_question_procedure_impot(self, classifier):
        r = classifier.predict("Comment payer mes impôts?")
        assert r["intention"] == "question_procedure"

    def test_demande_document_wolof(self, classifier):
        r = classifier.predict("Dama bëgg sama kàrt bëccëg")
        assert r["intention"] == "demande_document"

    def test_salutation_fr(self, classifier):
        r = classifier.predict("Bonjour, j'ai besoin d'aide")
        assert r["intention"] == "salutation"

    def test_salutation_wolof(self, classifier):
        r = classifier.predict("Na nga def, dama bëgg ndimbal")
        assert r["intention"] == "salutation"

    def test_question_delai_retraite(self, classifier):
        r = classifier.predict("Kañ laa man a jël sama retraite?")
        assert r["intention"] == "question_delai"

    def test_demande_inscription_cnss(self, classifier):
        r = classifier.predict("Je veux m'inscrire à la CNSS")
        assert r["intention"] == "demande_inscription"

    def test_domaine_dgid_impot(self, classifier):
        r = classifier.predict("Comment payer mes impôts?")
        assert r["domaine"] == "dgid"

    def test_domaine_etat_civil(self, classifier):
        r = classifier.predict("Je veux mon acte de naissance")
        assert r["domaine"] == "etat_civil"

    def test_domaine_cnss(self, classifier):
        r = classifier.predict("Je veux m'inscrire à la CNSS")
        assert r["domaine"] == "cnss"

    def test_retour_structure(self, classifier):
        r = classifier.predict("Bonjour")
        assert "intention" in r
        assert "confiance" in r
        assert "domaine" in r
        assert isinstance(r["confiance"], float)

    def test_payez_impots_dgid(self, classifier):
        r = classifier.predict("Payez vos impôts")
        assert r["domaine"] == "dgid"

    def test_ninea_domaine_ninea(self, classifier):
        r = classifier.predict("Je veux obtenir un NINEA pour mon entreprise")
        assert r["domaine"] == "ninea"

    def test_immatriculation_ninea(self, classifier):
        r = classifier.predict("Comment immatriculer mon entreprise?")
        assert r["domaine"] == "ninea"

    def test_renouvellement_cni(self, classifier):
        r = classifier.predict("Je veux renouveler ma carte d'identité nationale")
        assert r["domaine"] == "etat_civil"

    def test_question_procedure_ninea_wolof(self, classifier):
        r = classifier.predict("Naka laa def ngir bind sama entreprise?")
        assert r["intention"] == "question_procedure"


class TestEntityExtractor:
    def test_extrait_acte_naissance(self, extractor):
        e = extractor.extract("Je veux mon acte de naissance")
        assert "acte_naissance" in e["documents"]

    def test_extrait_carte_identite(self, extractor):
        e = extractor.extract("Ma carte d'identité est expirée")
        assert "carte_identite" in e["documents"]

    def test_extrait_ninea(self, extractor):
        e = extractor.extract("Je veux obtenir un NINEA")
        assert "ninea" in e["documents"]

    def test_extrait_cmu(self, extractor):
        e = extractor.extract("Je veux la carte CMU pour ma famille")
        assert "carte_cmu" in e["documents"]

    def test_extrait_lieu_mairie(self, extractor):
        e = extractor.extract("Quels sont les horaires de la mairie?")
        assert "mairie" in e["lieux"]

    def test_extrait_lieu_centre_fiscal(self, extractor):
        e = extractor.extract("Où se trouve le bureau des impôts?")
        assert "centre_fiscal" in e["lieux"]

    def test_extrait_montant(self, extractor):
        e = extractor.extract("Ça coûte 200 FCFA")
        assert len(e["montants"]) > 0

    def test_pas_entites(self, extractor):
        e = extractor.extract("Bonjour, j'ai besoin d'aide")
        assert isinstance(e["documents"], list)
        assert isinstance(e["lieux"], list)

    def test_structure_retour(self, extractor):
        e = extractor.extract("Texte quelconque")
        assert "documents" in e
        assert "lieux" in e
        assert "montants" in e
        assert "dates" in e
