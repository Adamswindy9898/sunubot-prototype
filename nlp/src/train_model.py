"""
Script d'entraînement du modèle NLP pour SunuBot
Fine-tuning d'un modèle de classification sur le corpus wolof/français

Ce script :
1. Charge le corpus bilingue
2. Entraîne un classifieur d'intention (TF-IDF + SVM)
3. Évalue les performances (précision, rappel, F1)
4. Sauvegarde le modèle entraîné
"""

import json
import os
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score, StratifiedKFold
from sklearn.metrics import classification_report
import numpy as np


def load_corpus(path: str) -> tuple:
    """Charge et prépare les données d'entraînement"""
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    texts = []
    intentions = []
    domaines = []
    langues = []

    for entry in data["donnees"]:
        texts.append(entry["texte"])
        intentions.append(entry["intention"])
        domaines.append(entry["domaine"])
        langues.append(entry["langue"])

    print(f"Corpus chargé : {len(texts)} exemples")
    print(f"  - Intentions uniques : {len(set(intentions))}")
    print(f"  - Domaines : {set(domaines)}")
    print(f"  - Langues : wolof={langues.count('wolof')}, français={langues.count('francais')}, mixte={langues.count('mixte')}")

    return texts, intentions, domaines, langues


def train_intent_model(texts: list, labels: list) -> Pipeline:
    """
    Entraîne le modèle de classification d'intention.
    Utilise TF-IDF sur les n-grammes de caractères (robuste au wolof)
    + LinearSVC (bon pour la classification multi-classe)
    """
    model = Pipeline([
        ("tfidf", TfidfVectorizer(
            analyzer="char_wb",      # N-grammes de caractères (meilleur pour le wolof)
            ngram_range=(2, 5),      # Bigrammes à 5-grammes
            max_features=10000,
            lowercase=True,
            sublinear_tf=True,       # Pondération logarithmique
        )),
        ("clf", LinearSVC(
            C=1.0,
            class_weight="balanced",  # Équilibrer les classes
            max_iter=10000,
        ))
    ])

    model.fit(texts, labels)
    return model


def train_domain_model(texts: list, labels: list) -> Pipeline:
    """Entraîne le modèle de classification de domaine"""
    model = Pipeline([
        ("tfidf", TfidfVectorizer(
            analyzer="char_wb",
            ngram_range=(2, 4),
            max_features=5000,
            lowercase=True,
        )),
        ("clf", MultinomialNB(alpha=0.1))
    ])

    model.fit(texts, labels)
    return model


def evaluate_model(model, texts: list, labels: list, model_name: str):
    """Évalue le modèle avec la validation croisée"""
    print(f"\n{'='*50}")
    print(f"ÉVALUATION : {model_name}")
    print(f"{'='*50}")

    # Validation croisée (5-fold)
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)

    try:
        scores = cross_val_score(model, texts, labels, cv=cv, scoring="f1_macro")
        print(f"\nValidation croisée (5-fold) :")
        print(f"  F1-score moyen : {scores.mean():.3f} (+/- {scores.std():.3f})")
        print(f"  Scores par fold : {[f'{s:.3f}' for s in scores]}")
    except Exception as e:
        print(f"  (Validation croisée non applicable : {e})")

    # Rapport de classification sur tout le corpus
    predictions = model.predict(texts)
    print(f"\nRapport de classification (sur le corpus complet) :")
    print(classification_report(labels, predictions, zero_division=0))


def save_model(model, path: str, name: str):
    """Sauvegarde le modèle entraîné"""
    filepath = os.path.join(path, f"{name}.pkl")
    with open(filepath, "wb") as f:
        pickle.dump(model, f)
    print(f"  [OK] Modele sauvegarde : {filepath}")


def main():
    print("=" * 60)
    print("  SUNUBOT - Entrainement du modele NLP")
    print("  Corpus Wolof/Francais pour services administratifs")
    print("=" * 60)

    # Chemins
    base_dir = os.path.dirname(os.path.dirname(__file__))
    corpus_path = os.path.join(base_dir, "data", "corpus_wolof_admin.json")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(models_dir, exist_ok=True)

    # 1. Charger le corpus
    print("\n[1] Chargement du corpus...")
    texts, intentions, domaines, langues = load_corpus(corpus_path)

    # 2. Entraîner le modele d'intention
    print("\n[2] Entrainement du modele d'INTENTION...")
    intent_model = train_intent_model(texts, intentions)
    evaluate_model(intent_model, texts, intentions, "Classification d'Intention")

    # 3. Entraîner le modele de domaine
    print("\n[3] Entrainement du modele de DOMAINE...")
    domain_model = train_domain_model(texts, domaines)
    evaluate_model(domain_model, texts, domaines, "Classification de Domaine")

    # 4. Entraîner le modele de langue
    print("\n[4] Entrainement du modele de LANGUE...")
    langue_model = train_domain_model(texts, langues)
    evaluate_model(langue_model, texts, langues, "Detection de Langue")

    # 5. Sauvegarder les modeles
    print("\n[5] Sauvegarde des modeles...")
    save_model(intent_model, models_dir, "intent_classifier")
    save_model(domain_model, models_dir, "domain_classifier")
    save_model(langue_model, models_dir, "langue_detector_ml")

    # 6. Test final
    print("\n" + "=" * 60)
    print("  TEST FINAL - Predictions sur des exemples")
    print("=" * 60)

    test_cases = [
        "Dama bëgg sama kàrt bëccëg",
        "Je veux mon acte de naissance",
        "Comment payer mes impôts?",
        "Naka laa feyee sama wàll?",
        "Je veux m'inscrire à la CNSS",
        "Kañ laa man a jël sama retraite?",
        "Bonjour, j'ai besoin d'aide",
        "Na nga def, dama bëgg ndimbal",
    ]

    for text in test_cases:
        intent = intent_model.predict([text])[0]
        domain = domain_model.predict([text])[0]
        langue = langue_model.predict([text])[0]
        print(f"\n  >> \"{text}\"")
        print(f"     Langue: {langue} | Intention: {intent} | Domaine: {domain}")

    print("\n[OK] Entrainement termine avec succes !")
    print(f"   Modeles sauvegardes dans : {models_dir}/")


if __name__ == "__main__":
    main()
