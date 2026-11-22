"""
Evaluation formelle du pipeline NLP SunuBot
Génère un rapport de performance avec métriques pour le mémoire M2.

Usage : cd nlp && python -m pytest tests/test_evaluation_formelle.py -v -s
"""

import sys
import os
import json
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from langue_detector import detect_language
from normaliser_wolof import normaliser_wolof
from intent_classifier import IntentClassifier, EntityExtractor
from corriger_texte import corriger_texte

try:
    from llm_mbert import get_mbert_classifier
    from api import corriger_intention_par_regles
    MBERT_AVAILABLE = True
except Exception:
    MBERT_AVAILABLE = False


# ═══════════════════════════════════════════════════════════════
# Jeu de test formel — 50 phrases bilingues annotées
# ═══════════════════════════════════════════════════════════════

JEU_DE_TEST = [
    # --- Salutations (6) ---
    {"texte": "Bonjour", "langue": "francais", "intent": "salutation", "domaine": "general"},
    {"texte": "Na nga def", "langue": "wolof", "intent": "salutation", "domaine": "general"},
    {"texte": "Asalaa maalekum", "langue": "wolof", "intent": "salutation", "domaine": "general"},
    {"texte": "Bonsoir, j'ai besoin d'aide", "langue": "francais", "intent": "salutation", "domaine": "general"},
    {"texte": "Jërejëf", "langue": "wolof", "intent": "salutation", "domaine": "general"},
    {"texte": "Au revoir", "langue": "francais", "intent": "salutation", "domaine": "general"},

    # --- Demande document état civil (8) ---
    {"texte": "Je veux mon acte de naissance", "langue": "francais", "intent": "demande_document", "domaine": "etat_civil"},
    {"texte": "Dama bëgg sama kàrt bëccëg", "langue": "wolof", "intent": "demande_document", "domaine": "etat_civil"},
    {"texte": "J'ai besoin d'un acte de mariage", "langue": "francais", "intent": "demande_document", "domaine": "etat_civil"},
    {"texte": "Dama bëgg certificat nationalité", "langue": "wolof", "intent": "demande_document", "domaine": "etat_civil"},
    {"texte": "Je veux un livret de famille", "langue": "francais", "intent": "demande_document", "domaine": "etat_civil"},
    {"texte": "Je veux ma carte d'identité", "langue": "francais", "intent": "demande_document", "domaine": "etat_civil"},
    {"texte": "Bëgg naa extrait acte de naissance", "langue": "wolof", "intent": "demande_document", "domaine": "etat_civil"},
    {"texte": "Je veux un casier judiciaire", "langue": "francais", "intent": "demande_document", "domaine": "etat_civil"},

    # --- Demande document DGID (4) ---
    {"texte": "Je veux mon NINEA", "langue": "francais", "intent": "demande_document", "domaine": "dgid"},
    {"texte": "Dama bëgg attestation fiscale", "langue": "wolof", "intent": "demande_document", "domaine": "dgid"},
    {"texte": "Il me faut un quitus fiscal", "langue": "francais", "intent": "demande_document", "domaine": "dgid"},
    {"texte": "Je veux ma carte de contribuable", "langue": "francais", "intent": "demande_document", "domaine": "dgid"},

    # --- Question procédure (8) ---
    {"texte": "Comment payer mes impôts?", "langue": "francais", "intent": "question_procedure", "domaine": "dgid"},
    {"texte": "Naka laa feyee sama wàll?", "langue": "wolof", "intent": "question_procedure", "domaine": "dgid"},
    {"texte": "Comment déclarer une naissance?", "langue": "francais", "intent": "question_procedure", "domaine": "etat_civil"},
    {"texte": "Naka laa def ngir jël kàrt bëccëg?", "langue": "wolof", "intent": "question_procedure", "domaine": "etat_civil"},
    {"texte": "Quels documents pour le NINEA?", "langue": "francais", "intent": "question_procedure", "domaine": "dgid"},
    {"texte": "Comment s'inscrire à la CNSS?", "langue": "francais", "intent": "question_procedure", "domaine": "cnss"},
    {"texte": "Quelle est la procédure pour un mariage civil?", "langue": "francais", "intent": "question_procedure", "domaine": "etat_civil"},
    {"texte": "Comment toucher ma pension de retraite?", "langue": "francais", "intent": "question_procedure", "domaine": "cnss"},

    # --- Question lieu (6) ---
    {"texte": "Où est la mairie de Thiès?", "langue": "francais", "intent": "question_lieu", "domaine": "etat_civil"},
    {"texte": "Fan la bureau CNSS bi nekk?", "langue": "wolof", "intent": "question_lieu", "domaine": "cnss"},
    {"texte": "Où se trouve le centre fiscal?", "langue": "francais", "intent": "question_lieu", "domaine": "dgid"},
    {"texte": "Fan la meeri bi nekk ci Thiès?", "langue": "wolof", "intent": "question_lieu", "domaine": "etat_civil"},
    {"texte": "Où est l'agence CNSS de Dakar?", "langue": "francais", "intent": "question_lieu", "domaine": "cnss"},
    {"texte": "Où se trouve le bureau de l'état civil?", "langue": "francais", "intent": "question_lieu", "domaine": "etat_civil"},

    # --- Question coût (6) ---
    {"texte": "Combien coûte l'acte de naissance?", "langue": "francais", "intent": "question_cout", "domaine": "etat_civil"},
    {"texte": "Ñaata lay jar kàrt bëccëg bi?", "langue": "wolof", "intent": "question_cout", "domaine": "etat_civil"},
    {"texte": "Combien coûte le NINEA?", "langue": "francais", "intent": "question_cout", "domaine": "dgid"},
    {"texte": "Quel est le prix de l'acte de mariage?", "langue": "francais", "intent": "question_cout", "domaine": "etat_civil"},
    {"texte": "Combien coûte l'inscription CNSS?", "langue": "francais", "intent": "question_cout", "domaine": "cnss"},
    {"texte": "Combien coûte le timbre fiscal?", "langue": "francais", "intent": "question_cout", "domaine": "etat_civil"},

    # --- Question délai (4) ---
    {"texte": "Quel est le délai pour l'acte de naissance?", "langue": "francais", "intent": "question_delai", "domaine": "etat_civil"},
    {"texte": "Ñaata bes la kàrt bëccëg bi jeex?", "langue": "wolof", "intent": "question_delai", "domaine": "etat_civil"},
    {"texte": "Quand vais-je recevoir mon NINEA?", "langue": "francais", "intent": "question_delai", "domaine": "dgid"},
    {"texte": "Combien de temps pour la carte d'identité?", "langue": "francais", "intent": "question_delai", "domaine": "etat_civil"},

    # --- Inscription (4) ---
    {"texte": "Je veux m'inscrire à la CNSS", "langue": "francais", "intent": "demande_inscription", "domaine": "cnss"},
    {"texte": "Dama bëgg bind ci CNSS", "langue": "wolof", "intent": "demande_inscription", "domaine": "cnss"},
    {"texte": "Comment enregistrer ma société à la DGID?", "langue": "francais", "intent": "demande_inscription", "domaine": "dgid"},
    {"texte": "Je veux déclarer mon enfant à l'état civil", "langue": "francais", "intent": "demande_inscription", "domaine": "etat_civil"},

    # --- Suivi demande (4) ---
    {"texte": "Je veux suivre ma demande", "langue": "francais", "intent": "suivi_demande", "domaine": "general"},
    {"texte": "Dama bëgg topp sama demande", "langue": "wolof", "intent": "suivi_demande", "domaine": "general"},
    {"texte": "Est-ce que mon dossier est prêt?", "langue": "francais", "intent": "suivi_demande", "domaine": "general"},
    {"texte": "Quel est le statut de ma demande?", "langue": "francais", "intent": "suivi_demande", "domaine": "general"},
]


def test_evaluation_formelle():
    """
    Évalue le pipeline NLP complet et affiche un rapport détaillé.
    Ce test génère les métriques pour le mémoire.
    """
    classifier = IntentClassifier()
    mbert = get_mbert_classifier() if MBERT_AVAILABLE else None

    total = len(JEU_DE_TEST)
    results = {
        "langue": {"correct": 0, "total": total},
        "intent_tfidf": {"correct": 0, "total": total},
        "intent_mbert": {"correct": 0, "total": total},
        "intent_mbert_corr": {"correct": 0, "total": total},
        "domaine_tfidf": {"correct": 0, "total": total},
        "domaine_mbert": {"correct": 0, "total": total},
    }

    # Par intention
    intent_results = {}
    # Par langue source
    lang_results = {"wolof": {"correct": 0, "total": 0}, "francais": {"correct": 0, "total": 0}}

    errors = []
    latencies = []

    print("\n" + "=" * 70)
    print("  EVALUATION FORMELLE — Pipeline NLP SunuBot")
    print("  Jeu de test : {} phrases bilingues annotees".format(total))
    print("=" * 70)

    for i, test in enumerate(JEU_DE_TEST):
        texte = test["texte"]
        expected_lang = test["langue"]
        expected_intent = test["intent"]
        expected_domaine = test["domaine"]

        t0 = time.time()

        normalise = normaliser_wolof(texte)

        # Langue
        lang_result = detect_language(normalise)
        lang_ok = lang_result["langue"] == expected_lang
        results["langue"]["correct"] += lang_ok

        # Intent TF-IDF
        tfidf_result = classifier.predict(normalise)
        tfidf_ok = tfidf_result["intention"] == expected_intent
        results["intent_tfidf"]["correct"] += tfidf_ok
        domaine_tfidf_ok = tfidf_result["domaine"] == expected_domaine
        results["domaine_tfidf"]["correct"] += domaine_tfidf_ok

        # Intent mBERT
        mbert_ok = False
        mbert_corr_ok = False
        if mbert:
            mbert_result = mbert.predict(normalise)
            mbert_ok = mbert_result["intention"] == expected_intent
            results["intent_mbert"]["correct"] += mbert_ok

            domaine_mbert_ok = mbert_result["domaine"] == expected_domaine
            results["domaine_mbert"]["correct"] += domaine_mbert_ok

            # mBERT + corrections de règles
            if MBERT_AVAILABLE:
                corr_intent, corr_domaine = corriger_intention_par_regles(
                    normalise, mbert_result["intention"], mbert_result["domaine"]
                )
                mbert_corr_ok = corr_intent == expected_intent
                results["intent_mbert_corr"]["correct"] += mbert_corr_ok

        latency = (time.time() - t0) * 1000
        latencies.append(latency)

        # Tracking par intention
        if expected_intent not in intent_results:
            intent_results[expected_intent] = {"correct_tfidf": 0, "correct_mbert": 0, "total": 0}
        intent_results[expected_intent]["total"] += 1
        if tfidf_ok:
            intent_results[expected_intent]["correct_tfidf"] += 1
        if mbert_corr_ok:
            intent_results[expected_intent]["correct_mbert"] += 1

        # Tracking par langue
        if expected_lang in lang_results:
            lang_results[expected_lang]["total"] += 1
            if mbert_corr_ok or (not mbert and tfidf_ok):
                lang_results[expected_lang]["correct"] += 1

        # Log erreurs
        best_ok = mbert_corr_ok if mbert else tfidf_ok
        if not best_ok:
            errors.append({
                "texte": texte,
                "attendu": expected_intent,
                "predit_tfidf": tfidf_result["intention"],
                "predit_mbert": mbert_result["intention"] if mbert else "N/A",
                "predit_corr": corr_intent if mbert and MBERT_AVAILABLE else "N/A",
            })

    # -- Rapport ----------------------------------------------
    print("\n" + "-" * 70)
    print("  RESULTATS GLOBAUX")
    print("-" * 70)

    def pct(c, t):
        return f"{c}/{t} ({c/t:.1%})" if t > 0 else "N/A"

    print(f"  Detection langue      : {pct(results['langue']['correct'], total)}")
    print(f"  Intent TF-IDF         : {pct(results['intent_tfidf']['correct'], total)}")
    if mbert:
        print(f"  Intent mBERT brut     : {pct(results['intent_mbert']['correct'], total)}")
        print(f"  Intent mBERT+regles   : {pct(results['intent_mbert_corr']['correct'], total)}")
    print(f"  Domaine TF-IDF        : {pct(results['domaine_tfidf']['correct'], total)}")
    if mbert:
        print(f"  Domaine mBERT         : {pct(results['domaine_mbert']['correct'], total)}")

    print(f"\n  Latence moyenne       : {sum(latencies)/len(latencies):.1f} ms")
    print(f"  Latence max           : {max(latencies):.1f} ms")

    print("\n" + "-" * 70)
    print("  ACCURACY PAR INTENTION")
    print("-" * 70)
    print(f"  {'Intention':<25} {'TF-IDF':>10} {'mBERT+R':>10} {'N':>5}")
    print(f"  {'-'*25} {'-'*10} {'-'*10} {'-'*5}")
    for intent, data in sorted(intent_results.items()):
        t = data["total"]
        tf = data["correct_tfidf"]
        mb = data["correct_mbert"]
        print(f"  {intent:<25} {tf/t:>9.0%} {mb/t:>9.0%} {t:>5}")

    print("\n" + "-" * 70)
    print("  ACCURACY PAR LANGUE SOURCE")
    print("-" * 70)
    for lang, data in lang_results.items():
        t = data["total"]
        c = data["correct"]
        print(f"  {lang:<15} : {pct(c, t)}")

    if errors:
        print("\n" + "-" * 70)
        print(f"  ERREURS ({len(errors)} phrases mal classees)")
        print("-" * 70)
        for e in errors:
            print(f"  \"{e['texte']}\"")
            print(f"    attendu={e['attendu']}  tfidf={e['predit_tfidf']}  mbert+r={e['predit_corr']}")

    # Sauvegarder le rapport en JSON
    rapport = {
        "date": time.strftime("%Y-%m-%d %H:%M"),
        "jeu_de_test": total,
        "langue_accuracy": results["langue"]["correct"] / total,
        "tfidf_accuracy": results["intent_tfidf"]["correct"] / total,
        "mbert_accuracy": results["intent_mbert"]["correct"] / total if mbert else None,
        "mbert_corr_accuracy": results["intent_mbert_corr"]["correct"] / total if mbert else None,
        "latence_moyenne_ms": round(sum(latencies) / len(latencies), 1),
        "par_intention": {k: {"tfidf": v["correct_tfidf"]/v["total"], "mbert": v["correct_mbert"]/v["total"], "n": v["total"]} for k, v in intent_results.items()},
        "erreurs": errors,
    }
    rapport_path = os.path.join(os.path.dirname(__file__), "..", "results", "evaluation_formelle.json")
    os.makedirs(os.path.dirname(rapport_path), exist_ok=True)
    with open(rapport_path, "w", encoding="utf-8") as f:
        json.dump(rapport, f, indent=2, ensure_ascii=False)
    print(f"\n  Rapport sauvegarde : {rapport_path}")
    print("=" * 70)

    # Le test passe si l'accuracy globale du meilleur modèle >= 70%
    best_accuracy = (results["intent_mbert_corr"]["correct"] / total) if mbert else (results["intent_tfidf"]["correct"] / total)
    assert best_accuracy >= 0.70, f"Accuracy trop basse : {best_accuracy:.1%}"
