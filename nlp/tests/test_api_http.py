"""
Tests HTTP de l'API NLP SunuBot — FastAPI TestClient
Teste les vrais endpoints sans avoir besoin d'un serveur lancé.

Usage : cd nlp && python -m pytest tests/test_api_http.py -v
"""

import sys
import os
import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from fastapi.testclient import TestClient
from api import app

client = TestClient(app)


class TestHealthEndpoint:
    def test_health_ok(self):
        r = client.get("/health")
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "ok"
        assert "modele_tfidf" in data
        assert "modele_mbert" in data
        assert "llm_mistral" in data
        assert "mode" in data

    def test_root(self):
        r = client.get("/")
        assert r.status_code == 200
        data = r.json()
        assert data["service"] == "SunuBot NLP API"
        assert "endpoints" in data


class TestDetecterLangue:
    def test_francais(self):
        r = client.post("/detecter-langue", json={"texte": "Bonjour je veux un acte"})
        assert r.status_code == 200
        assert r.json()["langue"] == "francais"

    def test_wolof(self):
        r = client.post("/detecter-langue", json={"texte": "Na nga def"})
        assert r.status_code == 200
        assert r.json()["langue"] == "wolof"

    def test_champ_texte_present(self):
        r = client.post("/detecter-langue", json={"texte": "test"})
        assert "texte" in r.json()


class TestClassifierIntention:
    def test_demande_document(self):
        r = client.post("/classifier-intention", json={"texte": "Je veux mon acte de naissance"})
        assert r.status_code == 200
        data = r.json()
        assert data["intention"] == "demande_document"
        assert 0 <= data["confiance"] <= 1

    def test_salutation(self):
        r = client.post("/classifier-intention", json={"texte": "Bonjour"})
        assert r.status_code == 200
        assert r.json()["intention"] == "salutation"


class TestExtraireEntites:
    def test_extrait_document(self):
        r = client.post("/extraire-entites", json={"texte": "Je veux un acte de naissance"})
        assert r.status_code == 200
        data = r.json()
        assert "entites" in data
        assert "acte_naissance" in data["entites"]["documents"]

    def test_extrait_montant(self):
        r = client.post("/extraire-entites", json={"texte": "Le timbre coute 500 FCFA"})
        assert r.status_code == 200
        assert len(r.json()["entites"]["montants"]) > 0


class TestAnalyser:
    def test_analyse_francais(self):
        r = client.post("/analyser", json={"texte": "Je veux mon acte de naissance"})
        assert r.status_code == 200
        data = r.json()
        assert "analyse" in data
        assert "langue" in data["analyse"]
        assert "intention" in data["analyse"]
        assert "entites" in data["analyse"]
        assert "action_mcp" in data["analyse"]
        assert data["mode"] in ("mbert+mistral", "mistral", "mbert", "local_tfidf")

    def test_analyse_wolof(self):
        r = client.post("/analyser", json={"texte": "Dama bëgg sama kàrt bëccëg"})
        assert r.status_code == 200
        data = r.json()
        assert data["analyse"]["intention"]["intention"] == "demande_document"
        assert data["analyse"]["intention"]["domaine"] == "etat_civil"

    def test_analyse_salutation(self):
        r = client.post("/analyser", json={"texte": "Bonjour SunuBot"})
        assert r.status_code == 200
        data = r.json()
        assert data["analyse"]["intention"]["intention"] == "salutation"

    def test_analyse_mcp_action(self):
        r = client.post("/analyser", json={"texte": "Je veux mon acte de naissance"})
        data = r.json()
        action = data["analyse"]["action_mcp"]
        assert action["serveur"] is not None
        assert isinstance(action["tools"], list)

    def test_analyse_texte_vide(self):
        r = client.post("/analyser", json={"texte": ""})
        assert r.status_code == 200

    def test_analyse_texte_long(self):
        r = client.post("/analyser", json={"texte": "Je veux " * 100 + "un acte de naissance"})
        assert r.status_code == 200


class TestValidation:
    def test_missing_texte(self):
        r = client.post("/analyser", json={})
        assert r.status_code == 422

    def test_wrong_method(self):
        r = client.get("/analyser")
        assert r.status_code == 405
