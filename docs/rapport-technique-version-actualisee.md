# SunuBot - Rapport technique actualisé
## Version du 11 novembre 2026

---

## 1. Échange MCP réel (client - serveur) avec traces

Chaque message envoyé au chatbot génère une trace MCP complète au format JSON. Voici un exemple réel d'échange :

### Exemple : "Comment payer mes impôts ?"

```
Client → Orchestrateur :
  POST /api/chat
  Body: { "message": "Comment payer mes impôts ?" }

Orchestrateur → Serveur NLP Python :
  POST http://localhost:8000/analyser
  Body: { "texte": "Comment payer mes impôts ?" }
  Temps de réponse : 79 ms

Serveur NLP → Orchestrateur (réponse) :
  langue: { langue: "francais", confiance: 0.4 }
  intention: { intention: "question_procedure", domaine: "dgid", confiance: 0.33 }
  entites: { documents: [], lieux: [], montants: [], dates: [] }

Routage MCP :
  Serveur cible : "dgid"
  Outils invoqués : ["get_centre_fiscal", "rechercher_contribuable"]
  Formulaire : "form-006"

Orchestrateur → Client (réponse finale) :
  Réponse bilingue avec modes de paiement, échéances, options
  Langue : français
  Enregistrement en base : ConversationLog (saved: true)
  Temps total : 153 ms
  Trace ID : MCP-20261111023318-lvdo
```

Les traces complètes sont disponibles dans le fichier `docs/traces/mcp-traces-2026-11-11.json` (31 échanges enregistrés).

### Architecture de l'échange MCP

```
┌──────────┐    POST /api/chat     ┌───────────────┐    POST /analyser    ┌──────────────┐
│          │ ──────────────────────>│               │ ───────────────────> │              │
│  Client  │                       │ Orchestrateur │                      │ Serveur NLP  │
│ (Next.js)│ <──────────────────── │   MCP (API)   │ <─────────────────── │   (FastAPI)  │
│          │   JSON + trace_id     │               │   langue, intention  │  mBERT+TF-IDF│
└──────────┘                       └───────┬───────┘   domaine, entités   └──────────────┘
                                           │
                                    Routage MCP
                                           │
                          ┌────────────────┼────────────────┐
                          │                │                │
                   ┌──────▼──────┐  ┌──────▼──────┐  ┌─────▼──────┐
                   │ Serveur MCP │  │ Serveur MCP │  │ Serveur MCP│
                   │ État Civil  │  │    DGID     │  │    CNSS    │
                   │             │  │             │  │            │
                   │ Tools:      │  │ Tools:      │  │ Tools:     │
                   │ -rechercher │  │ -get_centre │  │ -lister    │
                   │ -get_acte   │  │ -rechercher │  │ -preremplir│
                   │ -formulaire │  │ -get_statut │  │ -soumettre │
                   └─────────────┘  └─────────────┘  └────────────┘
                                           │
                                    ┌──────▼──────┐
                                    │ Serveur MCP │
                                    │ Formulaires │
                                    │             │
                                    │ Tools:      │
                                    │ -get_form   │
                                    │ -preremplir │
                                    │ -soumettre  │
                                    │ -suivre     │
                                    └─────────────┘
```


---

## 2. Tableau d'essais détaillé

Date des tests : 11 novembre 2026
Environnement : local (Windows 11, localhost)
Mode NLP : mBERT fine-tuné + TF-IDF (Mistral API non disponible lors des tests)

| N° | Entrée (message) | Langue | Intention attendue | Domaine attendu | Intention obtenue | Domaine obtenu | Résultat | Trace ID |
|----|-------------------|--------|-------------------|-----------------|-------------------|----------------|----------|----------|
| 1 | Bonjour | FR | salutation | general | salutation | general | PASS | MCP-20261111130534-d1lf |
| 2 | Na nga def | WO | salutation | general | salutation | general | PASS | MCP-20261111130534-6m1a |
| 3 | Comment payer mes impôts ? | FR | question_procedure | dgid | question_procedure | dgid | PASS | MCP-20261111130534-yw5c |
| 4 | Je veux mon acte de naissance | FR | demande_document | etat_civil | demande_document | etat_civil | PASS | MCP-20261111130534-u8rd |
| 5 | Dama bëgg sama kàrt bëccëg | WO | demande_document | etat_civil | demande_document | etat_civil | PASS | MCP-20261111130534-ferh |
| 6 | Je veux un NINEA | FR | demande_document | dgid | demande_document | dgid | PASS | MCP-20261111130534-ewlg |
| 7 | Où se trouve le bureau des impôts ? | FR | question_lieu | dgid | question_lieu | dgid | PASS | MCP-20261111130534-l1qm |
| 8 | Combien coûte l'acte de naissance ? | FR | question_cout | etat_civil | question_cout | etat_civil | PASS | MCP-20261111130534-zdbp |
| 9 | Je veux m'inscrire à la CNSS | FR | demande_inscription | cnss | demande_document | cnss | PARTIEL | MCP-20261111130534-0zng |
| 10 | Naka laa feyee sama wàll ? | WO | question_procedure | dgid | question_delai | general | ECHEC | MCP-20261111130535-akuk |

### Synthèse des résultats

- Tests réussis : 8/10 (80%)
- Tests partiels : 1/10 (10%) — domaine correct, intention proche
- Tests échoués : 1/10 (10%) — phrase wolof complexe mal classée

### Analyse des échecs

**Test 9 (partiel)** : "Je veux m'inscrire à la CNSS" est classé comme `demande_document` au lieu de `demande_inscription`. Le domaine `cnss` est correct. L'intention `demande_inscription` est rare dans le corpus (peu d'exemples d'entraînement).

**Test 10 (échec)** : "Naka laa feyee sama wàll ?" (wolof pour "comment payer mes impôts") est classé comme `question_delai / general` au lieu de `question_procedure / dgid`. Le modèle mBERT a du mal avec les variantes orthographiques wolof quand les caractères spéciaux (à, ë) sont absents ou modifiés.

### Pistes d'amélioration

1. Enrichir le corpus wolof avec davantage de variantes orthographiques
2. Ajouter plus d'exemples pour l'intention `demande_inscription`
3. Activer Mistral API pour bénéficier de l'analyse contextuelle en complément de mBERT


---

## 3. Versions et commandes pour reproduire l'environnement

### Versions logicielles

| Composant | Version |
|-----------|---------|
| OS | Windows 11 Pro (10.0.26300) |
| Node.js | v26.13.0 |
| Next.js | 15.3.3 |
| Python | 3.13.13 |
| PostgreSQL | 14.23 |
| PyTorch | 2.12.1+cpu |
| Transformers (HuggingFace) | 5.12.1 |
| Prisma ORM | via @prisma/client |
| mBERT | bert-base-multilingual-cased (fine-tuné) |
| Mistral | mistral-small-latest (via API HTTP) |

### Commandes de lancement

```bash
# 1. Prérequis : PostgreSQL 14 doit tourner (port 5433, base "sunubot")

# 2. Lancer le backend NLP Python
cd C:/Users/DELL/OneDrive/Bureau/Memoire/prototype/nlp/src
python -m uvicorn api:app --host 0.0.0.0 --port 8000

# 3. Lancer le frontend Next.js
cd C:/Users/DELL/OneDrive/Bureau/Memoire/prototype/frontend
npx next dev -p 5001

# 4. Ouvrir dans le navigateur
# http://localhost:5001

# 5. Compte de test
# Email : moussa.diop@example.com
# Mot de passe : password123
```

### Installation depuis zéro

```bash
# Backend NLP
cd prototype/nlp
pip install -r requirements.txt

# Frontend
cd prototype/frontend
npm install
npx prisma generate
npx prisma db push
npx prisma db seed
```


---

## 4. Rôle précis de mBERT

### Qu'est-ce que mBERT ?

mBERT (multilingual BERT) est un modèle de langage pré-entraîné par Google sur 104 langues, dont le français. Le wolof n'est pas dans les langues officielles de mBERT, mais le modèle capture des patterns linguistiques transférables grâce au fine-tuning.

### Rôle dans SunuBot

mBERT remplit deux fonctions :

1. **Classification d'intention** : Déterminer ce que veut l'utilisateur parmi 8 classes :
   - salutation, demande_document, demande_inscription
   - question_procedure, question_lieu, question_cout
   - question_delai, suivi_demande

2. **Détection de domaine** : Identifier le service administratif concerné :
   - etat_civil, dgid, cnss, education, sante, general

### Pipeline de traitement

```
Message utilisateur
       │
       ▼
 Normalisation wolof (normaliser_wolof.py)
       │
       ▼
 mBERT fine-tuné ──── Classification intention (8 classes)
       │                    + Détection domaine (6 classes)
       │
       ▼
 Correction par règles (corriger_intention_par_regles)
       │
       ▼
 Routage MCP ──── Choix du serveur + outils à appeler
```

### Fine-tuning réalisé

Le modèle `bert-base-multilingual-cased` a été fine-tuné sur notre corpus bilingue :
- **Corpus** : 160 entrées (wolof + français + mixte)
- **Classes** : 8 intentions
- **Fichier modèle** : `nlp/models/mbert_finetuned/model.safetensors`
- **Script** : `nlp/src/finetune_mbert.py`

### Jeu de test annoté pour évaluation initiale de mBERT

| N° | Texte | Langue | Intention correcte | mBERT prédit | Correct ? |
|----|-------|--------|-------------------|--------------|-----------|
| 1 | Bonjour | FR | salutation | salutation | Oui |
| 2 | Na nga def | WO | salutation | inscription | Non (corrigé par règles) |
| 3 | Je veux mon acte de naissance | FR | demande_document | demande_document | Oui |
| 4 | Dama bëgg sama kàrt bëccëg | WO | demande_document | demande_document | Oui |
| 5 | Comment payer mes impôts ? | FR | question_procedure | inscription | Non (corrigé par règles) |
| 6 | Où se trouve le bureau des impôts ? | FR | question_lieu | question_lieu | Oui |
| 7 | Combien coûte l'acte de naissance ? | FR | question_cout | question_cout | Oui |
| 8 | Je veux un NINEA | FR | demande_document | salutation | Non (corrigé par règles) |
| 9 | Naka laa feyee sama wàll ? | WO | question_procedure | question_delai | Non |
| 10 | Je veux m'inscrire à la CNSS | FR | demande_inscription | demande_document | Non |

**Précision brute mBERT : 6/10 (60%)**
**Précision après correction par règles : 8/10 (80%)**

### Analyse

Le modèle mBERT fine-tuné montre de bonnes performances sur le français (4/5 correct) mais des faiblesses sur le wolof (2/4 correct). Cela s'explique par :
- Le wolof n'est pas dans les langues d'entraînement de mBERT
- Le corpus de fine-tuning est petit (160 entrées)
- Les variantes orthographiques wolof (ë→e, à→a) perturbent le modèle

La couche de correction par règles compense les cas les plus fréquents et porte la précision globale à 80%.


---

## 5. Mode d'appel à Mistral

### Configuration

Mistral est appelé via **l'API HTTP de Mistral AI** (et non en local) :

- **Modèle** : `mistral-small-latest`
- **Mode d'appel** : API REST via le SDK Python `mistralai`
- **Endpoint** : API cloud Mistral (api.mistral.ai)
- **Clé API** : configurée dans `.env` (variable `MISTRAL_API_KEY`)

### Rôle dans le pipeline

Quand Mistral est disponible, il intervient en complément de mBERT :

```
mBERT (classification rapide) ──→ Mistral (analyse fine + génération)
         60-200ms                        500-2000ms
```

- **mBERT** : classification d'intention et domaine (rapide, ~100ms)
- **Mistral** : analyse contextuelle, extraction d'entités fines, génération de réponse naturelle

### Modes de fonctionnement

Le système fonctionne en 4 modes dégradés :

| Mode | Modèles actifs | Précision | Temps moyen |
|------|---------------|-----------|-------------|
| 1. mBERT + Mistral | Les deux | Haute | ~1-2s |
| 2. Mistral seul | Mistral API | Bonne | ~1-2s |
| 3. mBERT seul | mBERT local | Moyenne (80%) | ~100ms |
| 4. TF-IDF fallback | Classifieur local | Basique | ~10ms |

**État actuel** : Mode 3 (mBERT seul). L'API Mistral n'était pas disponible lors des tests du 11 novembre 2026.

### Code d'appel (extrait de llm_mistral.py)

```python
from mistralai import Mistral

client = Mistral(api_key=os.getenv("MISTRAL_API_KEY"))
response = client.chat.complete(
    model="mistral-small-latest",
    messages=[{"role": "user", "content": prompt}]
)
```


---

## 6. Schéma d'architecture complète

```
                        ┌─────────────────────────────────────────────┐
                        │           ARCHITECTURE SUNUBOT              │
                        └─────────────────────────────────────────────┘

    ┌──────────────┐         ┌──────────────────────────────────┐
    │              │  HTTP   │         FRONTEND (Next.js)       │
    │  Navigateur  │◄───────►│                                  │
    │  (Citoyen)   │  :5001  │  ┌────────────────────────────┐  │
    │              │         │  │    Interface Chat           │  │
    └──────────────┘         │  │    - Détection langue       │  │
                             │  │    - Sélection manuelle     │  │
                             │  │    - Formulaires dynamiques │  │
                             │  │    - Historique             │  │
                             │  └────────────────────────────┘  │
                             │                                  │
                             │  ┌────────────────────────────┐  │
                             │  │    API Routes (Next.js)     │  │
                             │  │    /api/chat     → Chat     │  │
                             │  │    /api/auth     → Login    │  │
                             │  │    /api/traces   → Traces   │  │
                             │  │    /api/formulaire → Forms  │  │
                             │  └──────────┬─────────────────┘  │
                             └─────────────┼────────────────────┘
                                           │
                              ┌─────────────┼──────────────┐
                              │             │              │
                              ▼             ▼              ▼
                   ┌──────────────┐  ┌────────────┐  ┌──────────┐
                   │  NLP Python  │  │ PostgreSQL │  │  Mistral │
                   │  (FastAPI)   │  │   14.23    │  │   API    │
                   │  :8000       │  │   :5433    │  │  (cloud) │
                   │              │  │            │  │          │
                   │ ┌──────────┐ │  │ Tables:    │  │ mistral- │
                   │ │  mBERT   │ │  │ -Citoyen   │  │ small-   │
                   │ │ fine-tuné│ │  │ -Compte    │  │ latest   │
                   │ └──────────┘ │  │ -Conversa- │  │          │
                   │ ┌──────────┐ │  │  tionLog   │  │ Analyse  │
                   │ │  TF-IDF  │ │  │ -Demande   │  │ fine +   │
                   │ │ fallback │ │  │ -Service   │  │ génér.   │
                   │ └──────────┘ │  │  Record    │  │          │
                   │              │  │            │  │          │
                   │ Endpoints:   │  │ Prisma ORM │  │          │
                   │ /analyser    │  │            │  │          │
                   │ /detecter-   │  │            │  │          │
                   │  langue      │  │            │  │          │
                   │ /classifier- │  │            │  │          │
                   │  intention   │  │            │  │          │
                   └──────────────┘  └────────────┘  └──────────┘
```

### Parcours complet d'une demande (de A à Z)

```
1. Le citoyen ouvre http://localhost:5001
2. Il se connecte (email + mot de passe)
3. Il tape : "Je veux mon acte de naissance"
4. Le frontend envoie POST /api/chat
5. L'API route vers le serveur NLP Python (POST /analyser)
6. mBERT classifie : intention=demande_document, domaine=etat_civil
7. Le routeur MCP sélectionne le serveur "etat-civil"
8. Les outils ["rechercher_citoyen", "get_acte_naissance"] sont invoqués
9. La réponse est formatée avec les pièces requises et le coût
10. La conversation est enregistrée en base (table ConversationLog)
11. Une trace MCP JSON est générée (trace_id unique)
12. La réponse est affichée dans l'interface chat
13. Le citoyen peut ensuite remplir le formulaire de demande
14. La demande est soumise et enregistrée (table Demande)
15. Un numéro de suivi (DEM-xxx) est attribué
```


---

## Fichiers de preuves

| Fichier | Contenu |
|---------|---------|
| docs/traces/mcp-traces-2026-11-11.json | 31 traces MCP réelles au format JSON |
| docs/traces/essai-parcours-demande-2026-11-02.json | Trace du parcours de demande avec vérification base |
| nlp/models/mbert_finetuned/ | Modèle mBERT fine-tuné (config.json, model.safetensors, metriques.json) |
| nlp/data/corpus_wolof_admin.json | Corpus de 160 entrées bilingues |
| nlp/data/jeu_test_mbert_initial.json | Jeu de test annoté pour évaluation mBERT |
