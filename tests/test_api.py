"""
Tests d'intégration — API FastAPI NLP (port 8000)
Ces tests nécessitent que le serveur soit démarré : python nlp/main.py
"""
import pytest
import requests

BASE_URL = "http://localhost:8000"


def api_disponible():
    try:
        r = requests.get(f"{BASE_URL}/health", timeout=2)
        return r.status_code == 200
    except Exception:
        return False


pytestmark = pytest.mark.skipif(
    not api_disponible(),
    reason="API NLP non démarrée (lancez: python nlp/main.py)"
)


class TestHealthEndpoint:
    def test_health(self):
        r = requests.get(f"{BASE_URL}/health")
        assert r.status_code == 200
        data = r.json()
        assert data.get("status") == "ok"


class TestAnalyzeEndpoint:
    def test_acte_naissance_fr(self):
        r = requests.post(f"{BASE_URL}/analyze", json={"texte": "Je veux mon acte de naissance"})
        assert r.status_code == 200
        data = r.json()
        assert "langue" in data
        assert "intention" in data
        assert data["langue"] == "francais"

    def test_impot_fr(self):
        r = requests.post(f"{BASE_URL}/analyze", json={"texte": "Comment payer mes impôts?"})
        assert r.status_code == 200
        data = r.json()
        assert data["langue"] == "francais"

    def test_wolof_text(self):
        r = requests.post(f"{BASE_URL}/analyze", json={"texte": "Dama bëgg sama kàrt bëccëg"})
        assert r.status_code == 200
        data = r.json()
        assert data["langue"] == "wolof"

    def test_texte_requis(self):
        r = requests.post(f"{BASE_URL}/analyze", json={})
        assert r.status_code in (400, 422)

    def test_ninea_domaine(self):
        r = requests.post(f"{BASE_URL}/analyze", json={"texte": "Je veux obtenir un NINEA"})
        assert r.status_code == 200
        data = r.json()
        assert data.get("domaine") in ("ninea", "dgid")

    def test_payez_impots_domaine(self):
        r = requests.post(f"{BASE_URL}/analyze", json={"texte": "Payez vos impôts"})
        assert r.status_code == 200
        data = r.json()
        assert data.get("domaine") == "dgid"


class TestLangueEndpoint:
    def test_detect_wolof(self):
        r = requests.post(f"{BASE_URL}/detect-langue", json={"texte": "Dama bëgg sama kàrt bëccëg"})
        assert r.status_code == 200
        data = r.json()
        assert data.get("langue") == "wolof"

    def test_detect_francais(self):
        r = requests.post(f"{BASE_URL}/detect-langue", json={"texte": "Bonjour, comment allez-vous?"})
        assert r.status_code == 200
        data = r.json()
        assert data.get("langue") == "francais"
