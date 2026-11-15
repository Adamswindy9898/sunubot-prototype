"""Premiere evaluation de mBERT sur un jeu tenu a part du corpus d'entrainement."""

import ast
import json
import re
import sys
import time
from collections import Counter
from pathlib import Path

SRC_DIR = Path(__file__).resolve().parent
NLP_DIR = SRC_DIR.parent
PROJECT_DIR = NLP_DIR.parent
DATASET_PATH = NLP_DIR / "data" / "jeu_test_mbert_initial.json"
TRAIN_SCRIPT = SRC_DIR / "finetune_mbert.py"
OUTPUT_PATH = NLP_DIR / "results" / "evaluation_mbert_initial.json"
sys.path.insert(0, str(SRC_DIR))


def normalize(text: str) -> str:
    return re.sub(r"\W+", " ", text.casefold(), flags=re.UNICODE).strip()


def get_training_texts():
    tree = ast.parse(TRAIN_SCRIPT.read_text(encoding="utf-8-sig"))
    assignment = next(
        node for node in tree.body
        if isinstance(node, ast.Assign)
        and any(isinstance(target, ast.Name) and target.id == "CORPUS_BRUT" for target in node.targets)
    )
    return {normalize(row[0]) for row in ast.literal_eval(assignment.value)}


def main():
    dataset = json.loads(DATASET_PATH.read_text(encoding="utf-8"))
    examples = dataset["donnees"]
    training_texts = get_training_texts()
    duplicates = [row["id"] for row in examples if normalize(row["texte"]) in training_texts]
    if duplicates:
        raise ValueError(f"Exemples deja presents dans le corpus brut: {duplicates}")

    from llm_mbert import get_mbert_classifier
    from sklearn.metrics import accuracy_score, f1_score, classification_report

    classifier = get_mbert_classifier()
    if classifier is None or getattr(classifier, "finetuned_model", None) is None:
        raise RuntimeError("Le modele mBERT fine-tune local n'a pas pu etre charge.")

    results = []
    for row in examples:
        start = time.perf_counter()
        prediction = classifier.classify_intent(row["texte"])
        elapsed_ms = (time.perf_counter() - start) * 1000
        language = classifier.detect_langue(row["texte"])
        results.append({
            "id": row["id"],
            "texte": row["texte"],
            "langue_annotee": row["langue"],
            "intention_attendue": row["intention_attendue"],
            "intention_predite": prediction["intention"],
            "domaine_infere": prediction["domaine"],
            "langue_predite_detecteur_separe": language["langue"],
            "mode_detection_langue": language["mode"],
            "confiance": prediction["confiance"],
            "latence_ms": round(elapsed_ms, 2),
            "correct": prediction["intention"] == row["intention_attendue"],
            "relecture_wolof": row.get("relecture_wolof", "non requise"),
        })

    expected = [row["intention_attendue"] for row in examples]
    predicted = [row["intention_predite"] for row in results]
    report = {
        "jeu_test": str(DATASET_PATH),
        "nombre_exemples": len(results),
        "corpus_brut_entrainement": len(get_training_texts()),
        "doublons_exacts_avec_corpus_brut": len(duplicates),
        "accuracy_intention": round(accuracy_score(expected, predicted), 4),
        "f1_macro_intention": round(f1_score(expected, predicted, average="macro", zero_division=0), 4),
        "latence_moyenne_ms": round(sum(row["latence_ms"] for row in results) / len(results), 2),
        "repartition_langue": dict(Counter(row["langue"] for row in examples)),
        "note": dataset["note_annotation"],
        "resultats": results,
        "rapport_par_classe": classification_report(expected, predicted, output_dict=True, zero_division=0),
    }
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Exemples: {len(results)} | doublons exacts entraînement: {len(duplicates)}")
    print(f"Accuracy intention: {report['accuracy_intention']:.1%} | F1 macro: {report['f1_macro_intention']:.3f}")
    print(f"Latence moyenne: {report['latence_moyenne_ms']:.2f} ms")
    for row in results:
        state = "OK" if row["correct"] else "ERREUR"
        print(f"{row['id']} {state} attendu={row['intention_attendue']} predit={row['intention_predite']} langue={row['langue_predite_detecteur_separe']}")
    print(f"Resultats detailles: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
