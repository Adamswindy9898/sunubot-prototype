# Tests SunuBot

## Lancer les tests

```bash
cd prototype
pip install pytest requests
pytest tests/ -v
```

## Structure

| Fichier | Description |
|---|---|
| `test_langue_detector.py` | Détection wolof / français / mixte |
| `test_intent_classifier.py` | Classification d'intention + extraction d'entités |
| `test_routing.py` | Logique de routing du chatbot (DGID, NINEA, CNSS...) |
| `test_api.py` | Tests d'intégration API FastAPI (nécessite serveur lancé) |

## Tests unitaires seulement (sans serveur)

```bash
pytest tests/ -v --ignore=tests/test_api.py
```

## Tests avec l'API

Démarrez d'abord le serveur :
```bash
python nlp/main.py
```
Puis :
```bash
pytest tests/test_api.py -v
```
