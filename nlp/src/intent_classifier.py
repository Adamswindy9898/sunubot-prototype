"""
Module de classification d'intention et extraction d'entités
Utilise TF-IDF + un classifieur pour identifier ce que veut le citoyen
"""

import json
import os
import re
from typing import Dict, List, Tuple
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
import numpy as np


class IntentClassifier:
    """
    Classifieur d'intentions pour les requêtes administratives.
    Supporte le wolof et le français.
    """

    def __init__(self, corpus_path: str = None):
        self.model = None
        self.label_map = {}
        self.reverse_label_map = {}
        self.corpus = []

        if corpus_path is None:
            corpus_path = os.path.join(
                os.path.dirname(os.path.dirname(__file__)),
                "data", "corpus_wolof_admin.json"
            )

        self._load_corpus(corpus_path)
        self._train()

    def _load_corpus(self, path: str):
        """Charge le corpus d'entraînement"""
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.corpus = data["donnees"]

    def _train(self):
        """Entraîne le modèle de classification d'intention"""
        texts = [entry["texte"] for entry in self.corpus]
        labels = [entry["intention"] for entry in self.corpus]

        # Créer le mapping des labels
        unique_labels = sorted(set(labels))
        self.label_map = {label: i for i, label in enumerate(unique_labels)}
        self.reverse_label_map = {i: label for label, i in self.label_map.items()}

        y = [self.label_map[label] for label in labels]

        # Pipeline TF-IDF + Naive Bayes
        self.model = Pipeline([
            ("tfidf", TfidfVectorizer(
                analyzer="char_wb",
                ngram_range=(2, 5),
                max_features=5000,
                lowercase=True,
            )),
            ("clf", MultinomialNB(alpha=0.1))
        ])

        self.model.fit(texts, y)

    def predict(self, text: str) -> Dict:
        """
        Prédit l'intention d'un texte.

        Retourne:
            dict avec:
                - intention: str (label de l'intention)
                - confiance: float (probabilité)
                - top_3: list des 3 intentions les plus probables
                - domaine: str (domaine déduit)
        """
        if self.model is None:
            return {"intention": "inconnue", "confiance": 0.0, "domaine": "general"}

        # Prédiction
        pred = self.model.predict([text])[0]
        proba = self.model.predict_proba([text])[0]

        # Top 3 intentions
        top_indices = np.argsort(proba)[::-1][:3]
        top_3 = [
            {
                "intention": self.reverse_label_map[idx],
                "confiance": round(float(proba[idx]), 3)
            }
            for idx in top_indices
        ]

        intention = self.reverse_label_map[pred]
        confiance = float(proba[pred])

        # Déduire le domaine
        domaine = self._infer_domain(text, intention)

        return {
            "intention": intention,
            "confiance": round(confiance, 3),
            "top_3": top_3,
            "domaine": domaine,
        }

    def _infer_domain(self, text: str, intention: str) -> str:
        """Déduit le domaine administratif à partir du texte et de l'intention"""
        text_lower = text.lower()

        # Mots-clés par domaine
        domain_keywords = {
            "etat_civil": [
                "naissance", "mariage", "décès", "acte", "kàrt", "bëccëg",
                "takk", "dee", "juddu", "mairie", "meeri", "état civil",
                "carte d'identité", "kàrt boppam", "pàaspoor", "passeport"
            ],
            "ninea": [
                "ninea", "rccm", "immatricul", "registre de commerce",
                "registre.*commerce", "entreprise", "sarl", "gie", "association"
            ],
            "dgid": [
                "impôt", "impot", "fiscal", "taxe", "tva", "wàll", "feye",
                "déclaration", "contribuable", "patente", "centre fiscal",
                "attestation fiscale", "pénalité"
            ],
            "cnss": [
                "cnss", "retraite", "allocation", "pension", "cotisation",
                "sécurité sociale", "employeur", "salarié", "familial"
            ],
            "education": [
                "bourse", "étudiant", "école", "université", "njàng",
                "scolarité", "diplôme", "inscription"
            ],
            "sante": [
                "cmu", "santé", "maladie", "hôpital", "mutuelle",
                "médecin", "feebar", "wér"
            ],
        }

        # Compter les correspondances
        scores = {}
        for domain, keywords in domain_keywords.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            scores[domain] = score

        # Retourner le domaine avec le plus haut score
        best_domain = max(scores, key=scores.get)
        if scores[best_domain] > 0:
            return best_domain

        # Fallback : chercher dans le corpus
        for entry in self.corpus:
            if entry["intention"] == intention:
                return entry["domaine"]

        return "general"


class EntityExtractor:
    """
    Extracteur d'entités nommées pour les requêtes administratives.
    Extrait : documents, lieux, personnes, dates, montants
    """

    # Patterns d'entités
    DOCUMENT_PATTERNS = {
        "acte_naissance": [
            r"acte\s+de\s+naissance", r"extrait\s+de\s+naissance",
            r"kàrt\s+bëccëg", r"bëccëg"
        ],
        "acte_mariage": [
            r"acte\s+de\s+mariage", r"kàrt\s+takk", r"takk"
        ],
        "acte_deces": [
            r"acte\s+de\s+décès", r"kàrt\s+dee"
        ],
        "carte_identite": [
            r"carte\s+d'identité", r"cni", r"kàrt\s+boppam"
        ],
        "passeport": [
            r"passeport", r"pàaspoor"
        ],
        "ninea": [
            r"ninea", r"numéro.*entreprise"
        ],
        "attestation_fiscale": [
            r"attestation\s+fiscale", r"attestation.*régularité"
        ],
        "carte_cmu": [
            r"carte?\s+cmu", r"couverture\s+maladie"
        ],
    }

    LIEU_PATTERNS = {
        "mairie": [r"mairie", r"meeri"],
        "centre_fiscal": [r"centre\s+fiscal", r"bureau\s+des?\s+impôts?", r"biro\s+wàll"],
        "cnss": [r"cnss", r"agence\s+cnss"],
        "hopital": [r"hôpital", r"centre\s+de\s+santé"],
    }

    def extract(self, text: str) -> Dict:
        """
        Extrait les entités d'un texte.

        Retourne:
            dict avec:
                - documents: list de documents identifiés
                - lieux: list de lieux
                - montants: list de montants (FCFA)
                - dates: list de dates
        """
        text_lower = text.lower()
        entities = {
            "documents": [],
            "lieux": [],
            "montants": [],
            "dates": [],
        }

        # Extraire les documents
        for doc_type, patterns in self.DOCUMENT_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    if doc_type not in entities["documents"]:
                        entities["documents"].append(doc_type)
                    break

        # Extraire les lieux
        for lieu_type, patterns in self.LIEU_PATTERNS.items():
            for pattern in patterns:
                if re.search(pattern, text_lower):
                    if lieu_type not in entities["lieux"]:
                        entities["lieux"].append(lieu_type)
                    break

        # Extraire les montants (FCFA)
        montants = re.findall(r'(\d[\d\s]*(?:\.\d+)?)\s*(?:fcfa|francs?|f\s*cfa)', text_lower)
        entities["montants"] = [m.strip() for m in montants]

        # Extraire les dates
        dates = re.findall(r'\d{1,2}[/-]\d{1,2}[/-]\d{2,4}|\d{4}[/-]\d{2}[/-]\d{2}', text)
        entities["dates"] = dates

        return entities


# --- Test rapide ---
if __name__ == "__main__":
    print("=" * 60)
    print("TEST - Classification d'intention & Extraction d'entités")
    print("=" * 60)

    classifier = IntentClassifier()
    extractor = EntityExtractor()

    tests = [
        "Dama bëgg sama kàrt bëccëg",
        "Je veux mon acte de naissance",
        "Comment payer mes impôts?",
        "Naka laa feyee sama wàll?",
        "Je veux m'inscrire à la CNSS",
        "Où se trouve le bureau des impôts?",
        "Bonjour, j'ai besoin d'aide",
        "Combien coûte l'acte de naissance?",
    ]

    for text in tests:
        intent = classifier.predict(text)
        entities = extractor.extract(text)
        print(f"\n📝 \"{text}\"")
        print(f"   → Intention: {intent['intention']} ({intent['confiance']:.0%})")
        print(f"   → Domaine: {intent['domaine']}")
        if entities["documents"]:
            print(f"   → Documents: {entities['documents']}")
        if entities["lieux"]:
            print(f"   → Lieux: {entities['lieux']}")
