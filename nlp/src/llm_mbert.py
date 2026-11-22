"""
Module mBERT — Classification d'intentions multilingue via multilingual BERT.

Utilise bert-base-multilingual-cased fine-tuné sur le corpus wolof/français
pour la détection de langue et la classification d'intentions administratives.
"""

import os
import json
import numpy as np
from typing import Dict, Optional, List
from langue_detector import detect_language

try:
    import torch
    from transformers import BertTokenizer, BertForSequenceClassification, pipeline
    TORCH_AVAILABLE = True
except (ImportError, OSError):
    TORCH_AVAILABLE = False
    print("[mBERT] torch/transformers non disponible — mBERT désactivé")


class MBertClassifier:
    """
    Classifieur basé sur mBERT pour les intentions administratives wolof/français.
    Utilise le pipeline HuggingFace Transformers pour :
    - Détection de langue (wolof vs français)
    - Classification d'intention (demande_document, question_procedure, etc.)
    """

    def __init__(self):
        self.tokenizer = None
        self.model = None
        self.langue_classifier = None
        self.intent_labels = [
            "salutation", "demande_document", "demande_inscription",
            "question_procedure", "question_lieu", "question_cout",
            "question_statut", "suivi_demande", "remerciement", "au_revoir"
        ]
        self.domaine_labels = [
            "etat_civil", "dgid", "cnss", "education", "sante", "general"
        ]
        self._load_model()

    def _load_model(self):
        """Charge le modèle mBERT fine-tuné (ou zero-shot en fallback)."""
        if not TORCH_AVAILABLE:
            print("[mBERT] torch non disponible — skip")
            return

        try:
            finetuned_path = os.path.join(
                os.path.dirname(__file__), "..", "models", "mbert_finetuned"
            )
            finetuned_path = os.path.abspath(finetuned_path)

            if os.path.exists(os.path.join(finetuned_path, "config.json")):
                self.tokenizer = BertTokenizer.from_pretrained(finetuned_path)
                self.finetuned_model = BertForSequenceClassification.from_pretrained(finetuned_path)
                self.finetuned_model.eval()

                # Charger le mapping — compatible metriques.json et intent_mapping.json
                self.label2id = {}
                self.id2label = {}

                for fname in ("metriques.json", "intent_mapping.json"):
                    mapping_path = os.path.join(finetuned_path, fname)
                    if os.path.exists(mapping_path):
                        with open(mapping_path, encoding="utf-8") as f:
                            data = json.load(f)
                        self.label2id = data.get("label2id", data.get("intent2id", {}))
                        id2label_raw = data.get("id2label", data.get("id2intent", {}))
                        self.id2label = {int(k): v for k, v in id2label_raw.items()}
                        break

                # Fallback : lire depuis config.json si pas de mapping externe
                if not self.id2label:
                    with open(os.path.join(finetuned_path, "config.json"), encoding="utf-8") as f:
                        config = json.load(f)
                    id2label_raw = config.get("id2label", {})
                    if id2label_raw and not list(id2label_raw.values())[0].startswith("LABEL_"):
                        self.id2label = {int(k): v for k, v in id2label_raw.items()}
                        self.label2id = {v: int(k) for k, v in id2label_raw.items()}

                print(f"[mBERT] Modèle fine-tuné chargé : {finetuned_path}")
                print(f"[mBERT] Classes : {list(self.label2id.keys()) if self.label2id else 'config labels'}")
            else:
                self.finetuned_model = None
                self.langue_classifier = pipeline(
                    "zero-shot-classification",
                    model="joeddav/xlm-roberta-large-xnli",
                    device=-1,
                )
                print("[mBERT] Modèle fine-tuné non trouvé — zero-shot activé")

        except Exception as e:
            print(f"[mBERT] Erreur chargement : {e}")
            print("[mBERT] Fallback sur TF-IDF")

    def detect_langue(self, texte: str) -> Dict:
        """Détecte la langue avec mBERT/XLM-RoBERTa."""
        if not getattr(self, "langue_classifier", None):
            result = detect_language(texte)
            return {
                "langue": result["langue"],
                "confiance": result["confiance"],
                "mode": result["methode"],
            }

        try:
            result = self.langue_classifier(
                texte,
                candidate_labels=["français", "wolof", "mélange français-wolof"],
                hypothesis_template="Ce texte est en {}."
            )
            label = result["labels"][0]
            score = result["scores"][0]

            langue_map = {
                "français": "francais",
                "wolof": "wolof",
                "mélange français-wolof": "mixte",
            }

            return {
                "langue": langue_map.get(label, "francais"),
                "confiance": round(score, 3),
                "mode": "mbert_xlm",
            }
        except Exception as e:
            print(f"[mBERT langue] Erreur : {e}")
            return {"langue": "francais", "confiance": 0.5, "mode": "fallback"}

    def classify_intent(self, texte: str) -> Dict:
        """Classifie l'intention avec le modèle fine-tuné (ou zero-shot en fallback)."""
        # Utiliser le modèle fine-tuné si disponible
        if hasattr(self, "finetuned_model") and self.finetuned_model is not None:
            try:
                # Normaliser les variantes orthographiques wolof courantes
                texte_norm = texte.replace("begg", "bëgg").replace("kart", "kàrt").replace("Naata", "Ñaata").replace("naata", "ñaata")
                inputs = self.tokenizer(texte_norm, return_tensors="pt", truncation=True, padding=True, max_length=128)
                with torch.no_grad():
                    outputs = self.finetuned_model(**inputs)
                pred_id = torch.argmax(outputs.logits, dim=1).item()
                confiance = torch.softmax(outputs.logits, dim=1)[0][pred_id].item()
                intention = self.id2label.get(pred_id, "default")

                domaine = self._infer_domain(texte_norm)

                return {
                    "intention": intention,
                    "domaine": domaine,
                    "confiance": round(float(confiance), 3),
                    "mode": "mbert_finetuned",
                }
            except Exception as e:
                print(f"[mBERT finetuned] Erreur : {e}")

        if not self.langue_classifier:
            return {"intention": "default", "domaine": "general", "confiance": 0.5, "mode": "fallback"}

        try:
            # Classification intention
            intent_labels_fr = [
                "salutation ou bonjour",
                "demande de document officiel",
                "demande d'inscription à un service",
                "question sur une procédure administrative",
                "question sur un lieu ou une adresse",
                "question sur un coût ou un prix",
                "vérification de statut ou situation",
                "suivi d'une demande en cours",
                "remerciement",
                "au revoir",
            ]

            intent_result = self.langue_classifier(
                texte,
                candidate_labels=intent_labels_fr,
                hypothesis_template="L'utilisateur veut : {}."
            )

            intent_idx = intent_labels_fr.index(intent_result["labels"][0])
            intention = self.intent_labels[intent_idx] if intent_idx < len(self.intent_labels) else "default"
            intent_conf = intent_result["scores"][0]

            # Classification domaine
            domaine_labels_fr = [
                "état civil (naissance, mariage, décès)",
                "impôts et fiscalité (DGID, NINEA)",
                "sécurité sociale (CNSS, retraite)",
                "éducation et bourses",
                "santé et assurance maladie (CMU)",
                "autre sujet général",
            ]

            domaine_result = self.langue_classifier(
                texte,
                candidate_labels=domaine_labels_fr,
                hypothesis_template="Ce message concerne : {}."
            )

            domaine_idx = domaine_labels_fr.index(domaine_result["labels"][0])
            domaine = self.domaine_labels[domaine_idx] if domaine_idx < len(self.domaine_labels) else "general"

            return {
                "intention": intention,
                "domaine": domaine,
                "confiance": round(intent_conf, 3),
                "mode": "mbert_zero_shot",
            }
        except Exception as e:
            print(f"[mBERT intent] Erreur : {e}")
            return {"intention": "default", "domaine": "general", "confiance": 0.5, "mode": "fallback"}

    @staticmethod
    def _infer_domain(texte: str) -> str:
        """Infer the administrative domain from message terms."""
        text = texte.casefold()
        domain_keywords = {
            "etat_civil": ("naissance", "mariage", "deces", "acte", "kàrt", "bëccëg", "takk", "juddu", "mairie", "meeri"),
            "dgid": ("impot", "impôt", "fiscal", "taxe", "tva", "wàll", "ninea", "declaration", "déclaration", "patente", "centre fiscal"),
            "cnss": ("cnss", "retraite", "allocation", "pension", "cotisation"),
            "education": ("bourse", "universite", "université", "ecole", "école", "scolarite", "scolarité"),
            "sante": ("cmu", "sante", "santé", "hopital", "hôpital", "maladie"),
        }
        for domain, terms in domain_keywords.items():
            if any(term in text for term in terms):
                return domain
        return "general"

    def predict(self, texte: str) -> Dict:
        """Analyse complète : langue + intention + domaine."""
        langue = self.detect_langue(texte)
        intent = self.classify_intent(texte)

        return {
            "langue": langue,
            "intention": intent["intention"],
            "domaine": intent["domaine"],
            "confiance": intent["confiance"],
            "mode": intent["mode"],
        }


# Singleton
_mbert_instance: Optional[MBertClassifier] = None

def get_mbert_classifier() -> Optional[MBertClassifier]:
    """Retourne l'instance mBERT (chargé une seule fois)."""
    if not TORCH_AVAILABLE:
        return None
    global _mbert_instance
    if _mbert_instance is None:
        try:
            _mbert_instance = MBertClassifier()
        except Exception as e:
            print(f"[mBERT] Impossible de charger : {e}")
            return None
    return _mbert_instance
