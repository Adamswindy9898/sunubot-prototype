"""
Évaluation comparative des modèles NLP pour SunuBot.
Compare : mBERT fine-tuné vs mBERT zero-shot vs TF-IDF

Métriques demandées par le sujet :
- Précision des réponses (accuracy, F1 par classe)
- Latence (temps de réponse en ms)
- Comparaison des approches
"""

import os
import sys
import json
import time
from pathlib import Path

sys.path.insert(0, os.path.dirname(__file__))

# Jeu de test indépendant (non vu pendant l'entraînement)
JEU_TEST = [
    ("Dama bëgg sama kàrt bëccëg", "demande_document", "etat_civil"),
    ("Je veux mon acte de naissance", "demande_document", "etat_civil"),
    ("Dama bëgg kàrt takk bi", "demande_document", "etat_civil"),
    ("Fan la centre fiscal bi nekk?", "question_lieu", "dgid"),
    ("Où se trouve la mairie?", "question_lieu", "etat_civil"),
    ("Naka laa feyee sama wàll?", "question_procedure", "dgid"),
    ("Comment obtenir mon NINEA?", "question_procedure", "dgid"),
    ("Ñaata lay jar kàrt bëccëg bi?", "question_cout", "etat_civil"),
    ("Combien coûte l'acte de naissance?", "question_cout", "etat_civil"),
    ("Ñaata bes la kàrt bi jeex?", "question_delai", "etat_civil"),
    ("Na nga def", "salutation", "general"),
    ("Bonjour SunuBot", "salutation", "general"),
    ("Dama bëgg bind ci CNSS", "inscription", "cnss"),
    ("Je veux m'inscrire à la CNSS", "inscription", "cnss"),
    ("Topp sama demande", "suivi_demande", "general"),
    ("Je veux suivre ma demande", "suivi_demande", "general"),
    # Wolof avec variations orthographiques
    ("Dama begg sama kart becceg", "demande_document", "etat_civil"),
    ("Naka laa feye sama wall?", "question_procedure", "dgid"),
    ("Fan la meeri bi?", "question_lieu", "etat_civil"),
    ("Jerejef", "salutation", "general"),
]


def evaluer_tfidf():
    """Évalue le modèle TF-IDF (baseline)."""
    try:
        from intent_classifier import IntentClassifier
        clf = IntentClassifier()

        correct = 0
        latences = []
        resultats = []

        for texte, intention_attendue, _ in JEU_TEST:
            debut = time.time()
            result = clf.predict(texte)
            latence = (time.time() - debut) * 1000

            pred = result["intention"]
            ok = pred == intention_attendue
            correct += int(ok)
            latences.append(latence)
            resultats.append({
                "texte": texte,
                "attendu": intention_attendue,
                "predit": pred,
                "confiance": result.get("confiance", 0),
                "correct": ok,
                "latence_ms": round(latence, 2),
            })

        accuracy = correct / len(JEU_TEST)
        return {
            "modele": "TF-IDF (baseline)",
            "accuracy": round(accuracy, 4),
            "latence_moy_ms": round(sum(latences) / len(latences), 2),
            "latence_max_ms": round(max(latences), 2),
            "resultats": resultats,
        }
    except Exception as e:
        return {"modele": "TF-IDF", "erreur": str(e)}


def evaluer_mbert_finetuned():
    """Évalue le modèle mBERT fine-tuné."""
    try:
        import torch
        from transformers import BertTokenizer, BertForSequenceClassification

        model_dir = Path(__file__).parent.parent / "models" / "mbert_finetuned"
        if not model_dir.exists():
            return {"modele": "mBERT fine-tuné", "erreur": "Modèle non entraîné — lancez finetune_mbert.py"}

        tokenizer = BertTokenizer.from_pretrained(str(model_dir))
        model = BertForSequenceClassification.from_pretrained(str(model_dir))
        model.eval()

        # Charger le label mapping
        with open(model_dir / "metriques.json", encoding="utf-8") as f:
            metriques = json.load(f)
        id2label = {int(k): v for k, v in metriques.get("label2id", {}).items()}
        # Inverser
        id2label = {v: k for k, v in metriques.get("label2id", {}).items()}

        correct = 0
        latences = []
        resultats = []

        for texte, intention_attendue, _ in JEU_TEST:
            debut = time.time()
            inputs = tokenizer(texte, return_tensors="pt", truncation=True, padding=True)
            with torch.no_grad():
                outputs = model(**inputs)
            pred_id = torch.argmax(outputs.logits, dim=1).item()
            confiance = torch.softmax(outputs.logits, dim=1)[0][pred_id].item()
            latence = (time.time() - debut) * 1000

            pred = id2label.get(pred_id, str(pred_id))
            ok = pred == intention_attendue
            correct += int(ok)
            latences.append(latence)
            resultats.append({
                "texte": texte,
                "attendu": intention_attendue,
                "predit": pred,
                "confiance": round(float(confiance), 3),
                "correct": ok,
                "latence_ms": round(latence, 2),
            })

        accuracy = correct / len(JEU_TEST)
        return {
            "modele": "mBERT fine-tuné",
            "accuracy": round(accuracy, 4),
            "latence_moy_ms": round(sum(latences) / len(latences), 2),
            "latence_max_ms": round(max(latences), 2),
            "resultats": resultats,
        }
    except Exception as e:
        return {"modele": "mBERT fine-tuné", "erreur": str(e)}


def afficher_rapport(result):
    """Affiche un rapport lisible."""
    print(f"\n--- {result['modele']} ---")
    if "erreur" in result:
        print(f"  ERREUR : {result['erreur']}")
        return

    print(f"  Accuracy     : {result['accuracy']:.2%}")
    print(f"  Latence moy  : {result['latence_moy_ms']} ms")
    print(f"  Latence max  : {result['latence_max_ms']} ms")

    erreurs = [r for r in result.get("resultats", []) if not r["correct"]]
    if erreurs:
        print(f"  Erreurs ({len(erreurs)}) :")
        for e in erreurs[:5]:
            print(f"    - \"{e['texte']}\" → prédit: {e['predit']} | attendu: {e['attendu']}")


if __name__ == "__main__":
    print("=" * 60)
    print("  ÉVALUATION COMPARATIVE — SunuBot NLP")
    print("  Corpus : Wolof/Français administratif sénégalais")
    print("=" * 60)

    resultats = {}

    print("\n[1/2] Évaluation TF-IDF (baseline)...")
    r_tfidf = evaluer_tfidf()
    resultats["tfidf"] = r_tfidf
    afficher_rapport(r_tfidf)

    print("\n[2/2] Évaluation mBERT fine-tuné...")
    r_mbert = evaluer_mbert_finetuned()
    resultats["mbert_finetuned"] = r_mbert
    afficher_rapport(r_mbert)

    # Tableau comparatif
    print("\n" + "=" * 60)
    print("  TABLEAU COMPARATIF")
    print("=" * 60)
    print(f"  {'Modèle':<25} {'Accuracy':>10} {'Latence moy':>14}")
    print(f"  {'-'*25} {'-'*10} {'-'*14}")
    for key, r in resultats.items():
        if "erreur" not in r:
            print(f"  {r['modele']:<25} {r['accuracy']:>9.1%} {r['latence_moy_ms']:>12.1f}ms")

    # Sauvegarder
    rapport_path = Path(__file__).parent.parent / "models" / "rapport_evaluation.json"
    rapport_path.parent.mkdir(parents=True, exist_ok=True)
    with open(rapport_path, "w", encoding="utf-8") as f:
        json.dump(resultats, f, ensure_ascii=False, indent=2)
    print(f"\n[sauvegarde] Rapport → {rapport_path}")
