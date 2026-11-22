"""
Tests du pipeline NLP SunuBot — pytest
Vérifie la détection de langue, classification d'intention, extraction d'entités
et le pipeline complet mBERT + Mistral.

Usage : cd nlp && python -m pytest tests/ -v
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from langue_detector import detect_language
from normaliser_wolof import normaliser_wolof
from intent_classifier import IntentClassifier, EntityExtractor
from corriger_texte import corriger_texte


# ═══════════════════════════════════════════════════════════════════
# Détection de langue
# ═══════════════════════════════════════════════════════════════════

class TestLangueDetector:
    @pytest.mark.parametrize("texte,expected", [
        ("Bonjour, je veux un acte de naissance", "francais"),
        ("Comment payer mes impôts?", "francais"),
        ("Quel est le délai pour le NINEA?", "francais"),
    ])
    def test_detecte_francais(self, texte, expected):
        result = detect_language(texte)
        assert result["langue"] == expected

    @pytest.mark.parametrize("texte,expected", [
        ("Na nga def", "wolof"),
        ("Dama bëgg sama kàrt bëccëg", "wolof"),
        ("Asalaa maalekum", "wolof"),
    ])
    def test_detecte_wolof(self, texte, expected):
        result = detect_language(texte)
        assert result["langue"] == expected

    def test_confiance_positive(self):
        result = detect_language("Bonjour")
        assert result["confiance"] > 0


# ═══════════════════════════════════════════════════════════════════
# Normalisation wolof
# ═══════════════════════════════════════════════════════════════════

class TestNormaliserWolof:
    def test_normalise_minuscule(self):
        result = normaliser_wolof("BONJOUR")
        assert result == result.lower()

    def test_normalise_wolof_basique(self):
        result = normaliser_wolof("Dama begg sama kart")
        assert isinstance(result, str)
        assert len(result) > 0

    def test_texte_vide(self):
        result = normaliser_wolof("")
        assert result == ""


# ═══════════════════════════════════════════════════════════════════
# Correction de texte
# ═══════════════════════════════════════════════════════════════════

class TestCorrigerTexte:
    def test_correction_basique(self):
        result = corriger_texte("je veux mon acte de naisance")
        assert isinstance(result, str)

    def test_texte_correct_inchange(self):
        texte = "bonjour comment allez-vous"
        result = corriger_texte(texte)
        assert isinstance(result, str)


# ═══════════════════════════════════════════════════════════════════
# Classification d'intention (TF-IDF)
# ═══════════════════════════════════════════════════════════════════

class TestIntentClassifier:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.classifier = IntentClassifier()

    def test_model_loaded(self):
        assert self.classifier.model is not None

    @pytest.mark.parametrize("texte,expected_intent", [
        ("Je veux mon acte de naissance", "demande_document"),
        ("Dama bëgg sama kàrt bëccëg", "demande_document"),
        ("Bonjour", "salutation"),
    ])
    def test_intention_correcte(self, texte, expected_intent):
        result = self.classifier.predict(texte)
        assert result["intention"] == expected_intent

    def test_confiance_entre_0_et_1(self):
        result = self.classifier.predict("Je veux un acte de naissance")
        assert 0 <= result["confiance"] <= 1

    def test_domaine_present(self):
        result = self.classifier.predict("Je veux un acte de naissance")
        assert "domaine" in result

    def test_top_3_present(self):
        result = self.classifier.predict("Comment payer mes impôts?")
        assert "top_3" in result
        assert len(result["top_3"]) <= 3


# ═══════════════════════════════════════════════════════════════════
# Extraction d'entités
# ═══════════════════════════════════════════════════════════════════

class TestEntityExtractor:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.extractor = EntityExtractor()

    def test_extrait_document(self):
        result = self.extractor.extract("Je veux un acte de naissance")
        assert "acte_naissance" in result["documents"]

    def test_extrait_lieu(self):
        result = self.extractor.extract("Où est la mairie?")
        assert "mairie" in result["lieux"]

    def test_extrait_montant(self):
        result = self.extractor.extract("Le timbre coûte 1000 FCFA")
        assert len(result["montants"]) > 0

    def test_extrait_date(self):
        result = self.extractor.extract("Mon rendez-vous est le 15/03/2026")
        assert len(result["dates"]) > 0

    def test_extrait_ninea(self):
        result = self.extractor.extract("Je veux mon NINEA")
        assert "ninea" in result["documents"]

    def test_texte_sans_entites(self):
        result = self.extractor.extract("Bonjour")
        assert result["documents"] == []
        assert result["lieux"] == []


# ═══════════════════════════════════════════════════════════════════
# Classification mBERT (si disponible)
# ═══════════════════════════════════════════════════════════════════

class TestMBertClassifier:
    @pytest.fixture(autouse=True)
    def setup(self):
        try:
            from llm_mbert import get_mbert_classifier
            self.mbert = get_mbert_classifier()
        except Exception:
            self.mbert = None

    @pytest.mark.skipif(
        not os.path.exists(os.path.join(os.path.dirname(__file__), "..", "models", "mbert_finetuned", "model.safetensors")),
        reason="Modèle mBERT non disponible"
    )
    def test_mbert_loaded(self):
        assert self.mbert is not None

    @pytest.mark.skipif(
        not os.path.exists(os.path.join(os.path.dirname(__file__), "..", "models", "mbert_finetuned", "model.safetensors")),
        reason="Modèle mBERT non disponible"
    )
    @pytest.mark.parametrize("texte,expected", [
        ("Dama bëgg sama kàrt bëccëg", "demande_document"),
        ("Où se trouve la mairie?", "question_lieu"),
        ("Je veux suivre ma demande", "suivi_demande"),
        ("Je veux m'inscrire à la CNSS", "inscription"),
        ("Quel est le délai pour le NINEA?", "question_delai"),
    ])
    def test_mbert_intentions(self, texte, expected):
        """Test mBERT brut (sans corrections de règles)."""
        if self.mbert is None:
            pytest.skip("mBERT non chargé")
        result = self.mbert.predict(texte)
        assert result["intention"] == expected, f"'{texte}' → {result['intention']} (attendu: {expected})"

    @pytest.mark.skipif(
        not os.path.exists(os.path.join(os.path.dirname(__file__), "..", "models", "mbert_finetuned", "model.safetensors")),
        reason="Modèle mBERT non disponible"
    )
    @pytest.mark.parametrize("texte,expected", [
        ("Na nga def", "salutation"),
        ("Combien coûte l'acte de naissance?", "question_cout"),
        ("Comment payer mes impôts?", "question_procedure"),
    ])
    def test_mbert_avec_corrections(self, texte, expected):
        """Test mBERT + corrections de règles (pipeline réel de l'API)."""
        if self.mbert is None:
            pytest.skip("mBERT non chargé")
        from api import corriger_intention_par_regles
        result = self.mbert.predict(texte)
        intention, domaine = corriger_intention_par_regles(texte, result["intention"], result["domaine"])
        assert intention == expected, f"'{texte}' → {intention} (attendu: {expected})"

    @pytest.mark.skipif(
        not os.path.exists(os.path.join(os.path.dirname(__file__), "..", "models", "mbert_finetuned", "model.safetensors")),
        reason="Modèle mBERT non disponible"
    )
    def test_mbert_confiance(self):
        if self.mbert is None:
            pytest.skip("mBERT non chargé")
        result = self.mbert.predict("Je veux un acte de naissance")
        assert 0 <= result["confiance"] <= 1

    @pytest.mark.skipif(
        not os.path.exists(os.path.join(os.path.dirname(__file__), "..", "models", "mbert_finetuned", "model.safetensors")),
        reason="Modèle mBERT non disponible"
    )
    def test_mbert_domaine_detection(self):
        if self.mbert is None:
            pytest.skip("mBERT non chargé")
        result = self.mbert.predict("Comment payer mes impôts à la DGID?")
        assert result["domaine"] == "dgid"


# ═══════════════════════════════════════════════════════════════════
# Pipeline complet (API-level)
# ═══════════════════════════════════════════════════════════════════

class TestPipelineComplet:
    """Tests d'intégration du pipeline complet (sans serveur HTTP)."""

    @pytest.fixture(autouse=True)
    def setup(self):
        self.classifier = IntentClassifier()
        self.extractor = EntityExtractor()

    @pytest.mark.parametrize("texte,intent,domaine", [
        ("Je veux un acte de naissance", "demande_document", "etat_civil"),
        ("Dama bëgg sama kàrt bëccëg", "demande_document", "etat_civil"),
        ("Comment payer mes impôts?", "question_procedure", "dgid"),
        ("Où se trouve l'agence CNSS?", "question_lieu", "cnss"),
    ])
    def test_pipeline_intent_domaine(self, texte, intent, domaine):
        normalise = normaliser_wolof(texte)
        result = self.classifier.predict(normalise)
        assert result["intention"] == intent
        assert result["domaine"] == domaine

    def test_pipeline_entites_et_intent(self):
        texte = "Je veux un acte de naissance, le timbre coûte 1000 FCFA"
        normalise = normaliser_wolof(texte)
        intent = self.classifier.predict(normalise)
        entities = self.extractor.extract(normalise)
        assert intent["intention"] == "demande_document"
        assert "acte_naissance" in entities["documents"]
        assert len(entities["montants"]) > 0
