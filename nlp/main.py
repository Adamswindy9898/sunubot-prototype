"""
SunuBot NLP — Point d'entrée principal
Lance l'API FastAPI pour le traitement du langage naturel wolof/français

Usage :
    python main.py              → Lance l'API sur le port 8000
    python main.py --train      → Entraîne les modèles
    python main.py --test       → Teste la détection de langue et l'intention
"""

import sys
import os

# Fix Windows console encoding for emojis
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# Charger les variables d'environnement (.env)
from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))

# Ajouter le dossier src au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "src"))


def run_api():
    """Lance l'API FastAPI"""
    import uvicorn
    from api import app
    print("🚀 Lancement de SunuBot NLP API...")
    print("   → http://localhost:8000")
    print("   → Documentation : http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000)


def run_training():
    """Lance l'entraînement des modèles"""
    from train_model import main as train_main
    train_main()


def run_tests():
    """Lance les tests de détection"""
    from langue_detector import detect_language
    from intent_classifier import IntentClassifier, EntityExtractor

    classifier = IntentClassifier()
    extractor = EntityExtractor()

    print("=" * 60)
    print("  SUNUBOT NLP — Tests de fonctionnement")
    print("=" * 60)

    tests = [
        # Wolof
        ("Dama bëgg sama kàrt bëccëg", "wolof"),
        ("Naka laa feyee sama wàll?", "wolof"),
        ("Na nga def, dama bëgg ndimbal", "wolof"),
        ("Kañ laa man a jël sama retraite?", "wolof"),
        # Français
        ("Je veux mon acte de naissance", "francais"),
        ("Comment payer mes impôts?", "francais"),
        ("Où se trouve le bureau des impôts?", "francais"),
        ("Je veux m'inscrire à la CNSS", "francais"),
        # Mixte
        ("Dama am retard ci sama déclaration", "mixte"),
        ("Ndax man naa fey ak Orange Money?", "mixte"),
    ]

    correct_lang = 0
    total = len(tests)

    for text, expected_lang in tests:
        lang_result = detect_language(text)
        intent_result = classifier.predict(text)
        entities = extractor.extract(text)

        is_correct = lang_result["langue"] == expected_lang
        correct_lang += int(is_correct)
        status = "✅" if is_correct else "❌"

        print(f"\n{status} \"{text}\"")
        print(f"   Langue: {lang_result['langue']} (attendu: {expected_lang}) — confiance: {lang_result['confiance']:.0%}")
        print(f"   Intention: {intent_result['intention']} ({intent_result['confiance']:.0%})")
        print(f"   Domaine: {intent_result['domaine']}")
        if entities["documents"]:
            print(f"   Entités docs: {entities['documents']}")

    print(f"\n{'='*60}")
    print(f"  Précision détection langue : {correct_lang}/{total} ({correct_lang/total:.0%})")
    print(f"{'='*60}")


if __name__ == "__main__":
    if len(sys.argv) > 1:
        if sys.argv[1] == "--train":
            run_training()
        elif sys.argv[1] == "--test":
            run_tests()
        else:
            print(f"Option inconnue: {sys.argv[1]}")
            print("Usage: python main.py [--train|--test]")
    else:
        run_api()
