"""
Fine-tuning mBERT sur le corpus wolof/français administratif sénégalais.

Le sujet demande : "Fine-tuner un LLM (mBERT, CamemBERT, Mistral) sur le corpus
avec intégration MCP" — ce script réalise cette étape.

Stratégie :
1. Corpus de 36 phrases annotées → augmenté à ~200 par paraphrase
2. Fine-tuning bert-base-multilingual-cased (mBERT) sur la classification d'intention
3. Sauvegarde du modèle fine-tuné pour remplacement du zero-shot dans llm_mbert.py
4. Évaluation : précision, F1, rapport de classification
"""

import os
import json
import numpy as np
from pathlib import Path

try:
    import torch
    from torch.utils.data import Dataset, DataLoader
    from transformers import (
        BertTokenizer,
        BertForSequenceClassification,
        AdamW,
        get_linear_schedule_with_warmup,
    )
    from sklearn.model_selection import train_test_split
    from sklearn.metrics import classification_report, accuracy_score
    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    print("[finetune] torch/transformers non installé — impossible de fine-tuner")

# === CORPUS WOLOF/FRANÇAIS ANNOTÉ ===
# Source : corpus.ts du MCP Wolof NLP + augmentation manuelle
# Chaque exemple : (texte, intention, domaine)
# Intentions : demande_document, question_procedure, question_lieu,
#              question_cout, question_delai, salutation, inscription

CORPUS_BRUT = [
    # --- ÉTAT CIVIL — demande_document ---
    ("Dama bëgg sama kàrt bëccëg", "demande_document", "etat_civil"),
    ("Je veux mon acte de naissance", "demande_document", "etat_civil"),
    ("Man naa jël sama kàrt bëccëg?", "demande_document", "etat_civil"),
    ("Dama bëgg kàrt takk bi", "demande_document", "etat_civil"),
    ("Je veux mon acte de mariage", "demande_document", "etat_civil"),
    ("Dama bëgg kàrt dee", "demande_document", "etat_civil"),
    ("J'ai besoin d'un acte de décès", "demande_document", "etat_civil"),
    ("Sama kàrt boppam jeex na, dama bëgg renouveler", "demande_document", "etat_civil"),
    ("Ma carte d'identité est expirée, je veux la renouveler", "demande_document", "etat_civil"),
    ("Dama bëgg certificat nationalité", "demande_document", "etat_civil"),
    ("Je voudrais un certificat de nationalité", "demande_document", "etat_civil"),
    ("Laaj na kàrt bëccëg ngir sama doom", "demande_document", "etat_civil"),
    ("Demande d'acte de naissance pour mon enfant", "demande_document", "etat_civil"),
    ("Dama bëgg copie kàrt bëccëg bi", "demande_document", "etat_civil"),
    ("Je veux une copie de mon acte de naissance", "demande_document", "etat_civil"),

    # --- DGID — question_fiscale ---
    ("Naka laa feyee sama wàll?", "question_procedure", "dgid"),
    ("Comment payer mes impôts à la DGID?", "question_procedure", "dgid"),
    ("Dama bëgg def sama déclaration TVA", "question_procedure", "dgid"),
    ("Je veux faire ma déclaration TVA", "question_procedure", "dgid"),
    ("Naka laa def sama declaration NINEA?", "question_procedure", "dgid"),
    ("Comment obtenir mon NINEA?", "question_procedure", "dgid"),
    ("Dama bëgg NINEA ngir sama entreprise", "demande_document", "dgid"),
    ("Je veux immatriculer mon entreprise", "demande_document", "dgid"),
    ("Sama situation fiscale ban la?", "question_procedure", "dgid"),
    ("Quelle est ma situation fiscale?", "question_procedure", "dgid"),
    ("Dama am penalite ci DGID", "question_procedure", "dgid"),
    ("J'ai une pénalité à la DGID", "question_procedure", "dgid"),
    ("Naka laa def déclaration IS?", "question_procedure", "dgid"),
    ("Comment déclarer l'impôt sur les sociétés?", "question_procedure", "dgid"),

    # --- LOCALISATION — question_lieu ---
    ("Fan la centre fiscal bi nekk?", "question_lieu", "dgid"),
    ("Où se trouve le centre fiscal?", "question_lieu", "dgid"),
    ("Fan la meeri bi nekk ci Thiès?", "question_lieu", "etat_civil"),
    ("Où est la mairie de Thiès?", "question_lieu", "etat_civil"),
    ("Fan la bureau CNSS bi nekk?", "question_lieu", "cnss"),
    ("Où se trouve l'agence CNSS?", "question_lieu", "cnss"),
    ("Adresse bi fan la DGID bi?", "question_lieu", "dgid"),
    ("Quelle est l'adresse de la DGID Dakar?", "question_lieu", "dgid"),
    ("Fan la man a jël sama kàrt bëccëg?", "question_lieu", "etat_civil"),
    ("Où puis-je retirer mon acte de naissance?", "question_lieu", "etat_civil"),

    # --- COÛT — question_cout ---
    ("Ñaata lay jar kàrt bëccëg bi?", "question_cout", "etat_civil"),
    ("Combien coûte l'acte de naissance?", "question_cout", "etat_civil"),
    ("Ñaata xaalis la timbre fiscal bi?", "question_cout", "etat_civil"),
    ("Combien coûte le timbre fiscal?", "question_cout", "etat_civil"),
    ("Ñaata la CNSS bi jar?", "question_cout", "cnss"),
    ("Quel est le montant des cotisations CNSS?", "question_cout", "cnss"),
    ("Ñaata la penalite bi?", "question_cout", "dgid"),
    ("Quel est le montant de la pénalité?", "question_cout", "dgid"),

    # --- DÉLAI — question_delai ---
    ("Ñaata bes la kàrt bëccëg bi jeex?", "question_delai", "etat_civil"),
    ("Quel est le délai pour l'acte de naissance?", "question_delai", "etat_civil"),
    ("Kañ laa man a jël sama NINEA?", "question_delai", "dgid"),
    ("Quand vais-je recevoir mon NINEA?", "question_delai", "dgid"),
    ("Ñaata bes la CNSS bi delai?", "question_delai", "cnss"),
    ("Quel est le délai d'inscription à la CNSS?", "question_delai", "cnss"),

    # --- CNSS — inscription ---
    ("Dama bëgg bind ci CNSS", "inscription", "cnss"),
    ("Je veux m'inscrire à la CNSS", "inscription", "cnss"),
    ("Naka laa man a bind ci CNSS?", "inscription", "cnss"),
    ("Comment s'inscrire à la CNSS?", "inscription", "cnss"),
    ("Dama bëgg allocations familiales", "question_procedure", "cnss"),
    ("Je veux les allocations familiales", "question_procedure", "cnss"),
    ("Retraite bi, naka laa jël ko?", "question_procedure", "cnss"),
    ("Comment obtenir ma retraite CNSS?", "question_procedure", "cnss"),

    # --- SALUTATION ---
    ("Na nga def", "salutation", "general"),
    ("Bonjour, comment allez-vous?", "salutation", "general"),
    ("Asalaa maalekum", "salutation", "general"),
    ("Bonjour SunuBot", "salutation", "general"),
    ("Jërejëf", "salutation", "general"),
    ("Merci beaucoup", "salutation", "general"),
    ("Ba beneen", "salutation", "general"),
    ("Au revoir", "salutation", "general"),
    ("Mangi fi rekk, jërejëf", "salutation", "general"),
    ("Je vais bien merci", "salutation", "general"),

    # --- INSCRIPTION ÉTAT CIVIL ---
    ("Dama bëgg bind ci registre état civil", "inscription", "etat_civil"),
    ("Je veux m'inscrire à l'état civil", "inscription", "etat_civil"),
    ("Dama bëgg bind sama tur ci meeri bi", "inscription", "etat_civil"),
    ("Comment s'enregistrer à l'état civil?", "inscription", "etat_civil"),
    ("Bind ci système bi naka laa def?", "inscription", "etat_civil"),
    ("Comment créer mon dossier à la mairie?", "inscription", "etat_civil"),

    # --- SUIVI ---
    ("Dama bëgg topp sama demande", "suivi_demande", "general"),
    ("Je veux suivre ma demande", "suivi_demande", "general"),
    ("Status bi sama dossier bi?", "suivi_demande", "general"),
    ("Où en est ma demande DEM-2024-001?", "suivi_demande", "general"),
    ("Topp sama demande DEM-2024-001", "suivi_demande", "general"),
    ("Mon dossier a-t-il été traité?", "suivi_demande", "general"),
]


def augmenter_corpus(corpus):
    """
    Augmentation du corpus par variations linguistiques.
    Simule des reformulations courantes en wolof et français.
    """
    augmente = list(corpus)

    # Variations wolof — substitutions de formules équivalentes
    substitutions_wolof = [
        ("Dama bëgg", "Dëkk na ma"),
        ("Man naa", "Mën naa"),
        ("Naka laa", "Naka la"),
        ("sama", "sa"),
        ("bi", ""),
        ("Dama bëgg jël", "Dama bëgg am"),
    ]

    # Variations français — reformulations
    substitutions_fr = [
        ("Je veux", "J'aimerais"),
        ("Je veux", "Je souhaite"),
        ("Comment", "Quelle est la procédure pour"),
        ("Où se trouve", "Quelle est l'adresse de"),
        ("Combien coûte", "Quel est le prix de"),
        ("Je veux m'inscrire", "Comment s'inscrire"),
    ]

    for (texte, intention, domaine) in corpus:
        # Appliquer des substitutions pour créer des variantes
        for avant, apres in substitutions_wolof:
            if avant in texte:
                variante = texte.replace(avant, apres, 1).strip()
                if variante != texte and len(variante) > 3:
                    augmente.append((variante, intention, domaine))
        for avant, apres in substitutions_fr:
            if avant in texte:
                variante = texte.replace(avant, apres, 1).strip()
                if variante != texte and len(variante) > 3:
                    augmente.append((variante, intention, domaine))

    # Supprimer les doublons
    vus = set()
    corpus_final = []
    for item in augmente:
        if item[0] not in vus:
            vus.add(item[0])
            corpus_final.append(item)

    return corpus_final


# Labels d'intentions
INTENTIONS = [
    "demande_document",
    "question_procedure",
    "question_lieu",
    "question_cout",
    "question_delai",
    "salutation",
    "inscription",
    "suivi_demande",
]
LABEL2ID = {l: i for i, l in enumerate(INTENTIONS)}
ID2LABEL = {i: l for i, l in enumerate(INTENTIONS)}


class CorpusDataset(Dataset):
    """Dataset PyTorch pour le fine-tuning mBERT."""

    def __init__(self, textes, labels, tokenizer, max_length=128):
        self.encodings = tokenizer(
            textes,
            truncation=True,
            padding=True,
            max_length=max_length,
            return_tensors="pt",
        )
        self.labels = torch.tensor(labels, dtype=torch.long)

    def __len__(self):
        return len(self.labels)

    def __getitem__(self, idx):
        return {
            "input_ids": self.encodings["input_ids"][idx],
            "attention_mask": self.encodings["attention_mask"][idx],
            "labels": self.labels[idx],
        }


def entrainer_mbert(epochs=5, batch_size=8, lr=2e-5):
    """
    Fine-tune mBERT sur le corpus wolof/français administratif.
    Sauvegarde le modèle dans nlp/models/mbert_finetuned/
    """
    if not TORCH_AVAILABLE:
        print("[finetune] torch non disponible — arrêt")
        return None

    print("=" * 60)
    print("  FINE-TUNING mBERT — Corpus Wolof/Français Administratif")
    print("=" * 60)

    # 1. Préparer le corpus augmenté
    corpus = augmenter_corpus(CORPUS_BRUT)
    print(f"\n[corpus] {len(CORPUS_BRUT)} exemples bruts → {len(corpus)} après augmentation")

    textes = [c[0] for c in corpus]
    labels = [LABEL2ID[c[1]] for c in corpus]

    # Distribution des classes
    from collections import Counter
    distrib = Counter(c[1] for c in corpus)
    print("\n[distribution]")
    for intention, count in sorted(distrib.items()):
        print(f"  {intention:25s} : {count:3d} exemples")

    # 2. Split train/test (80/20)
    X_train, X_test, y_train, y_test = train_test_split(
        textes, labels, test_size=0.2, random_state=42, stratify=labels
    )
    print(f"\n[split] Train: {len(X_train)} | Test: {len(X_test)}")

    # 3. Tokenizer et modèle
    model_name = "bert-base-multilingual-cased"
    print(f"\n[modèle] Chargement {model_name}...")
    tokenizer = BertTokenizer.from_pretrained(model_name)
    model = BertForSequenceClassification.from_pretrained(
        model_name,
        num_labels=len(INTENTIONS),
        id2label=ID2LABEL,
        label2id=LABEL2ID,
    )

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[device] {device}")
    model.to(device)

    # 4. Datasets et DataLoaders
    train_dataset = CorpusDataset(X_train, y_train, tokenizer)
    test_dataset = CorpusDataset(X_test, y_test, tokenizer)
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)
    test_loader = DataLoader(test_dataset, batch_size=batch_size)

    # 5. Optimiseur et scheduler
    optimizer = AdamW(model.parameters(), lr=lr, weight_decay=0.01)
    total_steps = len(train_loader) * epochs
    scheduler = get_linear_schedule_with_warmup(
        optimizer,
        num_warmup_steps=total_steps // 10,
        num_training_steps=total_steps,
    )

    # 6. Boucle d'entraînement
    print(f"\n[training] {epochs} epochs, batch={batch_size}, lr={lr}")
    print("-" * 60)

    historique = []
    for epoch in range(epochs):
        model.train()
        total_loss = 0
        correct = 0
        total = 0

        for batch in train_loader:
            optimizer.zero_grad()
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels_batch = batch["labels"].to(device)

            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=labels_batch,
            )
            loss = outputs.loss
            logits = outputs.logits

            loss.backward()
            torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
            optimizer.step()
            scheduler.step()

            total_loss += loss.item()
            preds = torch.argmax(logits, dim=1)
            correct += (preds == labels_batch).sum().item()
            total += len(labels_batch)

        train_acc = correct / total
        avg_loss = total_loss / len(train_loader)
        historique.append({"epoch": epoch + 1, "loss": avg_loss, "train_acc": train_acc})
        print(f"  Epoch {epoch+1}/{epochs} | Loss: {avg_loss:.4f} | Train Acc: {train_acc:.2%}")

    # 7. Évaluation sur le jeu de test
    print("\n" + "=" * 60)
    print("  ÉVALUATION SUR LE JEU DE TEST")
    print("=" * 60)

    model.eval()
    all_preds = []
    all_true = []

    with torch.no_grad():
        for batch in test_loader:
            input_ids = batch["input_ids"].to(device)
            attention_mask = batch["attention_mask"].to(device)
            labels_batch = batch["labels"]

            outputs = model(input_ids=input_ids, attention_mask=attention_mask)
            preds = torch.argmax(outputs.logits, dim=1).cpu().numpy()
            all_preds.extend(preds)
            all_true.extend(labels_batch.numpy())

    accuracy = accuracy_score(all_true, all_preds)
    rapport = classification_report(
        all_true, all_preds,
        target_names=INTENTIONS,
        zero_division=0,
    )

    print(f"\n  Accuracy : {accuracy:.2%}")
    print(f"\n{rapport}")

    # 8. Sauvegarder le modèle fine-tuné
    model_dir = Path(__file__).parent.parent / "models" / "mbert_finetuned"
    model_dir.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(str(model_dir))
    tokenizer.save_pretrained(str(model_dir))

    # Sauvegarder les métriques
    metriques = {
        "modele": model_name,
        "corpus_brut": len(CORPUS_BRUT),
        "corpus_augmente": len(corpus),
        "train_size": len(X_train),
        "test_size": len(X_test),
        "epochs": epochs,
        "accuracy": round(accuracy, 4),
        "historique_training": historique,
        "intentions": INTENTIONS,
        "label2id": LABEL2ID,
    }
    with open(model_dir / "metriques.json", "w", encoding="utf-8") as f:
        json.dump(metriques, f, ensure_ascii=False, indent=2)

    print(f"\n[sauvegarde] Modèle sauvegardé → {model_dir}")
    print(f"[sauvegarde] Métriques → {model_dir / 'metriques.json'}")

    return str(model_dir), accuracy, rapport


def tester_modele_finetuned(textes_test=None):
    """
    Teste le modèle fine-tuné sur des exemples wolof/français.
    """
    if not TORCH_AVAILABLE:
        print("[test] torch non disponible")
        return

    model_dir = Path(__file__).parent.parent / "models" / "mbert_finetuned"
    if not model_dir.exists():
        print(f"[test] Modèle non trouvé dans {model_dir} — lancez d'abord l'entraînement")
        return

    print("\n" + "=" * 60)
    print("  TEST MODÈLE mBERT FINE-TUNÉ")
    print("=" * 60)

    tokenizer = BertTokenizer.from_pretrained(str(model_dir))
    model = BertForSequenceClassification.from_pretrained(str(model_dir))
    model.eval()

    if textes_test is None:
        textes_test = [
            ("Dama bëgg sama kàrt bëccëg", "demande_document"),
            ("Comment payer mes impôts?", "question_procedure"),
            ("Fan la centre fiscal bi?", "question_lieu"),
            ("Ñaata lay jar?", "question_cout"),
            ("Na nga def", "salutation"),
            ("Je veux m'inscrire à la CNSS", "inscription"),
            ("Topp sama demande", "suivi_demande"),
            ("Kañ la kàrt bi jeex?", "question_delai"),
            # Wolof avec fautes d'écriture
            ("Dama begg sama kart becceg", "demande_document"),
            ("Naka laa feye sama wall", "question_procedure"),
        ]

    correct = 0
    for texte, attendu in textes_test:
        inputs = tokenizer(texte, return_tensors="pt", truncation=True, padding=True)
        with torch.no_grad():
            outputs = model(**inputs)
        pred_id = torch.argmax(outputs.logits, dim=1).item()
        pred = ID2LABEL[pred_id]
        confiance = torch.softmax(outputs.logits, dim=1)[0][pred_id].item()
        ok = pred == attendu
        correct += int(ok)
        status = "OK" if ok else "ERREUR"
        print(f"  [{status}] \"{texte}\"")
        print(f"         Prédit: {pred} ({confiance:.0%}) | Attendu: {attendu}")

    print(f"\n  Précision : {correct}/{len(textes_test)} ({correct/len(textes_test):.0%})")


if __name__ == "__main__":
    import sys

    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        tester_modele_finetuned()
    else:
        result = entrainer_mbert(epochs=5, batch_size=8, lr=2e-5)
        if result:
            model_dir, accuracy, rapport = result
            print(f"\n[terminé] Fine-tuning terminé — Accuracy finale : {accuracy:.2%}")
            tester_modele_finetuned()
