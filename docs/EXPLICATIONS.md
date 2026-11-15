# EXPLICATIONS — Réalisation du Prototype

## Serveur MCP État Civil — Explications détaillées

### Qu'est-ce qu'on a fait ?

On a créé le premier serveur MCP (Model Context Protocol) du projet : le serveur d'État Civil. Ce serveur permet au chatbot d'accéder aux données d'état civil (naissances, mariages, décès) de manière sécurisée et structurée.

### Pourquoi un serveur MCP ?

Le MCP (Model Context Protocol) est un protocole standardisé créé par Anthropic qui permet à un LLM (Large Language Model) d'interagir avec des sources de données externes de manière contrôlée. Au lieu que le chatbot accède directement à une base de données (ce qui serait dangereux), le serveur MCP expose uniquement des "Tools" (outils) et des "Resources" (ressources) bien définis.

**Avantages du MCP :**
- Sécurité : Le chatbot ne peut exécuter que les opérations prédéfinies
- Traçabilité : Chaque appel est loggé
- Standardisation : N'importe quel LLM compatible MCP peut utiliser ces serveurs
- Modularité : On peut ajouter/supprimer des serveurs sans toucher au chatbot

### Architecture du serveur

```
mcp-servers/etat-civil/
├── src/
│   ├── index.ts      ← Point d'entrée du serveur (définit les Tools et Resources)
│   └── data.ts       ← Base de données simulée (données fictives)
├── dist/             ← Code JavaScript compilé (généré automatiquement)
├── package.json      ← Configuration npm et dépendances
└── tsconfig.json     ← Configuration TypeScript
```

### Stack technique utilisée

- **Langage** : TypeScript (JavaScript typé, plus sûr et maintenable)
- **Runtime** : Node.js
- **SDK MCP** : @modelcontextprotocol/sdk (SDK officiel d'Anthropic)
- **Validation** : Zod (librairie de validation de schémas)
- **Transport** : Stdio (communication par entrée/sortie standard)

### Les Tools (outils) exposés

Le serveur expose 5 outils que le chatbot peut appeler :

| Tool | Description | Paramètres |
|------|-------------|------------|
| `rechercher_citoyen` | Recherche par nom/prénom dans les registres | query (texte) |
| `get_acte_naissance` | Récupère un acte de naissance complet | identifiant (numéro ou ID) |
| `get_acte_mariage` | Récupère un acte de mariage complet | identifiant (numéro ou ID) |
| `get_acte_deces` | Récupère un acte de décès complet | identifiant (numéro ou ID) |
| `verifier_citoyen` | Vérifie l'existence d'un citoyen | nom, prénom, date_naissance (optionnel) |

### Les Resources (ressources) exposées

Le serveur expose 2 ressources consultables :

| Resource | URI | Description |
|----------|-----|-------------|
| `centres-etat-civil` | etat-civil://centres | Liste des centres d'état civil avec horaires |
| `statistiques` | etat-civil://statistiques | Statistiques globales des registres |

### Données simulées

Pour le prototype, on utilise des données fictives mais réalistes :
- **20 actes de naissance** — couvrant 14 régions du Sénégal
- **10 actes de mariage** — avec les deux régimes (monogamie/polygamie)
- **8 actes de décès** — avec différentes causes

Les noms utilisés sont des noms sénégalais courants (DIOP, NDIAYE, SOW, FALL, BA, GUEYE, etc.) et les lieux correspondent aux vraies communes et centres d'état civil du Sénégal.

### Comment ça fonctionne (flux d'une requête)

1. Le citoyen pose une question au chatbot : "Je veux mon acte de naissance"
2. Le chatbot (LLM) identifie qu'il doit utiliser le tool `rechercher_citoyen`
3. Le LLM envoie la requête au serveur MCP via le protocole standard
4. Le serveur MCP cherche dans sa base de données
5. Le serveur retourne les résultats au LLM
6. Le LLM formule une réponse en français ou wolof pour le citoyen

### Comment tester le serveur

Pour compiler et lancer :
```bash
cd prototype/mcp-servers/etat-civil
npm run build       # Compile TypeScript → JavaScript
npm run start       # Lance le serveur
```

---

## Serveur MCP DGID — Explications détaillées

### Qu'est-ce qu'on a fait ?

On a créé le deuxième serveur MCP : le serveur de la **DGID** (Direction Générale des Impôts et Domaines). Ce serveur permet au chatbot d'accéder aux informations fiscales des contribuables sénégalais : leurs déclarations, paiements, pénalités, et centres fiscaux compétents.

### Pourquoi la DGID ?

La DGID est l'administration fiscale du Sénégal. Les citoyens et entreprises ont souvent besoin de :
- Connaître leur situation fiscale (suis-je en règle ?)
- Savoir quand déposer leurs déclarations
- Comprendre les pénalités en cas de retard
- Trouver leur centre fiscal de rattachement

Notre chatbot va pouvoir répondre à toutes ces questions en interrogeant ce serveur MCP.

### Architecture du serveur

```
mcp-servers/dgid/
├── src/
│   ├── index.ts      ← Point d'entrée (Tools + Resources MCP)
│   └── data.ts       ← Base de données simulée (contribuables, déclarations, paiements)
├── dist/             ← Code compilé
├── package.json      ← Configuration
└── tsconfig.json     ← Configuration TypeScript
```

### Les données simulées

Le serveur contient des données réalistes basées sur le système fiscal sénégalais :

- **20 contribuables** — personnes physiques (commerçants, artisans) et personnes morales (SARL, SA)
- **30 déclarations fiscales** — TVA, IS, IR, patente, CFCE, BRS avec différents statuts
- **20 paiements** — par virement, chèque, espèces et mobile money
- **10 centres fiscaux** — CDI, CIME et CF répartis dans tout le Sénégal

**Types de contribuables :**
| Type | Régime fiscal | Exemple |
|------|--------------|---------|
| Personne physique | Contribution Globale Unique | Petit commerçant (CA < 50M FCFA) |
| Personne physique | Réel simplifié | Restaurant, hôtel |
| Personne morale | Réel normal | Grande entreprise (SA, SARL) |

**Types de déclarations :**
| Sigle | Signification | Qui est concerné |
|-------|--------------|-----------------|
| TVA | Taxe sur la Valeur Ajoutée (18%) | Toute entreprise au régime réel |
| IS | Impôt sur les Sociétés (30%) | Personnes morales (SARL, SA) |
| IR | Impôt sur le Revenu | Personnes physiques |
| Patente | Contribution des patentes | Entreprises selon locaux |
| CFCE | Contribution Forfaitaire | Petites entreprises (CGU) |
| BRS | Bordereau de Retenue à la Source | Employeurs (retenues salaires) |

### Les Tools (outils) exposés

Le serveur expose 6 outils :

| Tool | Description | Paramètres |
|------|-------------|------------|
| `get_statut_fiscal` | Statut fiscal global d'un contribuable | identifiant (NINEA, NIF ou nom) |
| `check_declarations` | Liste des déclarations avec statuts | contribuable_id, type_declaration (optionnel) |
| `get_paiements` | Historique des paiements | contribuable_id |
| `calculer_penalites` | Calcul des pénalités de retard | contribuable_id |
| `get_centre_fiscal` | Centre fiscal compétent | region, regime_fiscal |
| `rechercher_contribuable` | Recherche par nom/NINEA/activité | query |

### Les Resources (ressources) exposées

| Resource | URI | Description |
|----------|-----|-------------|
| `centres-fiscaux` | dgid://centres | Liste complète des centres fiscaux |
| `bareme-fiscal` | dgid://bareme | Taux d'imposition (IR, IS, TVA, etc.) |
| `calendrier-fiscal` | dgid://calendrier | Échéances fiscales de l'année |

### Particularités intéressantes

1. **Calcul automatique des pénalités** — basé sur l'article 183 du Code Général des Impôts sénégalais (10% + 1% par mois de retard)
2. **Barème IR progressif** — avec les tranches réelles utilisées au Sénégal
3. **NINEA** — le vrai format d'identification des entreprises sénégalaises
4. **Régimes fiscaux réalistes** — CGU pour les petits, réel simplifié pour les moyens, réel normal pour les grands

### Exemple de flux

Un citoyen demande : "Est-ce que je suis en règle avec mes impôts ?"
1. Le chatbot utilise `rechercher_contribuable` pour trouver le citoyen
2. Puis `get_statut_fiscal` pour vérifier sa situation
3. Si en retard, `calculer_penalites` pour connaître les montants dus
4. Le chatbot formule la réponse avec toutes les informations

### Comment tester

```bash
cd prototype/mcp-servers/dgid
npm run build       # Compile
npm run start       # Lance le serveur
```

---

## Serveur MCP Wolof NLP — Explications détaillées

### Qu'est-ce qu'on a fait ?

On a créé le troisième serveur MCP : le **serveur Wolof NLP**. C'est le cœur linguistique du projet — il permet au chatbot de comprendre et traiter la langue wolof. Il assure la détection de langue, la tokenisation, la traduction wolof→français, la normalisation et la détection d'intention.

### Pourquoi c'est le serveur le plus innovant ?

Le wolof est une langue peu dotée en ressources NLP (contrairement au français ou l'anglais). Ce serveur est innovant car :
- Il constitue un **corpus wolof administratif** spécifique (inexistant ailleurs)
- Il implémente un **détecteur de langue wolof/français/mixte**
- Il gère le **code-switching** (mélange wolof-français très courant au Sénégal)
- Il offre une **détection d'intention** directement depuis le wolof

### Architecture

```
mcp-servers/wolof-nlp/
├── src/
│   ├── index.ts      ← Serveur MCP (6 Tools + 3 Resources)
│   └── corpus.ts     ← Données linguistiques (dictionnaire, phrases, grammaire)
├── dist/             ← Code compilé
├── package.json
└── tsconfig.json
```

### Le corpus linguistique

Notre corpus contient :

**1. Dictionnaire wolof-français (75+ entrées)**
Organisé par catégories :
| Catégorie | Exemples | Nombre |
|-----------|----------|--------|
| Administratif | kàrt bëccëg (acte de naissance), wàll (impôt) | ~20 |
| Salutations | na nga def, jërejëf, asalaa maalekum | 8 |
| Verbes | bëgg (vouloir), def (faire), dem (aller) | 16 |
| Questions | fan (où), kañ (quand), naka (comment) | 8 |
| Noms | nit (personne), doom (enfant), kër (maison) | 13 |
| Nombres | benn (1), ñaar (2)... junni (1000) | 12 |

**2. Phrases administratives (35 phrases)**
Des phrases complètes wolof↔français couvrant 4 domaines :
- État civil (12 phrases) : demandes d'actes, questions sur les horaires
- DGID/Fiscalité (10 phrases) : paiement impôts, NINEA, déclarations
- CNSS (4 phrases) : allocations, inscription, retraite
- Général (9 phrases) : salutations, aide, plaintes

Chaque phrase est annotée avec son **intention** (ce que veut le citoyen) et son **domaine** (quel service est concerné).

**3. Règles de grammaire wolof (8 règles)**
Les structures grammaticales de base :
- Marqueurs de sujet (maa, yaa, moo)
- Négation (du, duma)
- Temps : passé (-oon), futur (dinaa), présent progressif (maa ngi)
- Questions (fan, kañ, naka...)
- Possessifs (sama, sa, am, sunu)

**4. Indicateurs linguistiques**
- 40+ indicateurs wolof (naa, nga, dama, bëgg, rekk...)
- 50+ indicateurs français (je, tu, le, est, pour...)
Utilisés pour la détection automatique de langue.

### Les Tools (outils) exposés

| Tool | Description | Paramètres |
|------|-------------|------------|
| `detecter_langue` | Détecte wolof/français/mixte avec score de confiance | texte |
| `traduire_wolof_francais` | Traduit du wolof vers le français | texte |
| `detecter_intention` | Identifie l'intention + domaine administratif | texte |
| `tokeniser_wolof` | Tokenise avec analyse morphologique | texte |
| `chercher_dictionnaire` | Recherche dans le dictionnaire bilingue | mot, langue_source |
| `normaliser_wolof` | Corrige l'orthographe wolof non standard | texte |

### Les Resources exposées

| Resource | URI | Description |
|----------|-----|-------------|
| `dictionnaire-wolof` | wolof-nlp://dictionnaire | Dictionnaire complet avec statistiques |
| `phrases-admin` | wolof-nlp://phrases-admin | Corpus de phrases annotées |
| `grammaire-wolof` | wolof-nlp://grammaire | Règles grammaticales |

### Exemple de flux complet

Un citoyen écrit : **"Dama bëgg sama kàrt bëccëg"**

1. `detecter_langue` → wolof (confiance: 0.85)
2. `traduire_wolof_francais` → "Je veux mon acte de naissance"
3. `detecter_intention` → intention: "demande_document", domaine: "etat_civil"
4. Le chatbot sait maintenant qu'il doit appeler le serveur MCP État Civil avec le tool `rechercher_citoyen`

### La normalisation (pourquoi c'est important)

Les Sénégalais écrivent le wolof de manière variable :
- "naangadef" → normalisé en "na nga def"
- "jerejef" → normalisé en "jërejëf"  
- "balma" → normalisé en "baal ma"

Le normaliseur corrige ces variations pour que la traduction et la détection fonctionnent mieux.

### Comment tester

```bash
cd prototype/mcp-servers/wolof-nlp
npm run build       # Compile
npm run start       # Lance le serveur
```

---

## Serveur MCP Formulaires — Explications détaillées

### Qu'est-ce qu'on a fait ?

On a créé le quatrième et dernier serveur MCP : le **serveur Formulaires**. Ce serveur gère tout le cycle de vie des formulaires administratifs — de la consultation du catalogue à la soumission de demandes avec suivi.

### Pourquoi un serveur Formulaires ?

C'est la couche "action" du système. Les 3 autres serveurs permettent de consulter des informations. Celui-ci permet au citoyen de **faire des démarches** directement via le chatbot :
- Consulter les formulaires disponibles
- Savoir quelles pièces fournir
- Pré-remplir automatiquement un formulaire
- Soumettre sa demande
- Suivre le traitement de sa demande

### Architecture

```
mcp-servers/formulaires/
├── src/
│   ├── index.ts      ← Serveur MCP (6 Tools + 3 Resources)
│   └── data.ts       ← Formulaires, champs, et demandes soumises
├── dist/             ← Code compilé
├── package.json
└── tsconfig.json
```

### Les données

**12 formulaires couvrant 5 domaines :**

| Domaine | Formulaires | Exemples |
|---------|-------------|----------|
| État civil (4) | form-001 à form-004 | Acte de naissance, déclaration naissance, mariage, décès |
| DGID (3) | form-005 à form-007 | Demande NINEA, déclaration TVA, attestation fiscale |
| CNSS (3) | form-008 à form-010 | Immatriculation employeur, allocations familiales, retraite |
| Éducation (1) | form-011 | Bourse d'études |
| Santé (1) | form-012 | Couverture Maladie Universelle (CMU) |

**Chaque formulaire contient :**
- Titre en français ET en wolof
- Description bilingue
- Liste des champs (avec types : texte, date, sélection, numéro, email, téléphone)
- Pièces justificatives requises
- Coût et délai de traitement
- Lieu de dépôt

**15 demandes soumises** avec différents statuts :
- Brouillon → Soumise → En traitement → Validée/Rejetée → Prête (à retirer)

### Les Tools (outils) exposés

| Tool | Description | Paramètres |
|------|-------------|------------|
| `lister_formulaires` | Catalogue des formulaires par domaine | domaine (optionnel) |
| `get_formulaire` | Détails complets d'un formulaire | formulaire_id ou mot-clé |
| `preremplir_formulaire` | Pré-remplit avec données connues | formulaire_id, donnees_citoyen (JSON) |
| `soumettre_formulaire` | Soumet et crée un numéro de suivi | formulaire_id, donnees, nom, prénom, tel |
| `suivre_demande` | Statut d'une demande | numéro de suivi ou nom |
| `get_pieces_requises` | Liste des pièces à fournir | formulaire_id ou mot-clé |

### Les Resources exposées

| Resource | URI | Description |
|----------|-----|-------------|
| `catalogue-formulaires` | formulaires://catalogue | Tous les formulaires avec métadonnées |
| `guide-demarches` | formulaires://guide | Guide étape par étape des démarches courantes |
| `statistiques-demandes` | formulaires://statistiques | Statistiques de traitement des demandes |

### Fonctionnalité clé : le pré-remplissage

Le pré-remplissage est une fonctionnalité majeure du chatbot. Voici comment ça fonctionne :

1. Le citoyen dit : "Je veux mon acte de naissance"
2. Le chatbot interroge le serveur État Civil pour récupérer ses données
3. Le chatbot appelle `preremplir_formulaire` avec ces données
4. Le formulaire est automatiquement rempli avec les infos connues
5. Le chatbot demande au citoyen de compléter les champs manquants
6. Le chatbot appelle `soumettre_formulaire`
7. Le citoyen reçoit un numéro de suivi

**Avantage :** Le citoyen n'a pas besoin de se déplacer ni de connaître les formulaires — le chatbot fait tout pour lui.

### Exemple de flux complet (de bout en bout)

Le citoyen écrit : **"Dama bëgg sama kàrt bëccëg"** (Je veux mon acte de naissance)

1. **Wolof NLP** : détecte wolof → traduit → intention = "demande_document", domaine = "etat_civil"
2. **État Civil** : `rechercher_citoyen("DIOP")` → trouve les données
3. **Formulaires** : `get_formulaire("form-001")` → montre les champs et pièces requises
4. **Formulaires** : `preremplir_formulaire("form-001", données)` → pré-remplit
5. Le chatbot demande les infos manquantes (motif, nombre de copies)
6. **Formulaires** : `soumettre_formulaire(...)` → numéro de suivi dem-016
7. Le chatbot répond en wolof : "Sa demande soumise na. Numéro suivi : dem-016. Dinaa am ci 3-5 bés."

### Comment tester

```bash
cd prototype/mcp-servers/formulaires
npm run build       # Compile
npm run start       # Lance le serveur
```

---

## Récapitulatif des 4 serveurs MCP

| Serveur | Tools | Resources | Données |
|---------|-------|-----------|---------|
| État Civil | 5 | 2 | 20 naissances, 10 mariages, 8 décès |
| DGID | 6 | 3 | 20 contribuables, 30 déclarations, 20 paiements, 10 centres |
| Wolof NLP | 6 | 3 | 75+ mots, 35 phrases, 8 règles grammaire |
| Formulaires | 6 | 3 | 12 formulaires (5 domaines), 15 demandes |
| **TOTAL** | **23** | **11** | — |

---

## Interface Frontend (SunuBot) — Explications détaillées

### Qu'est-ce qu'on a fait ?

On a créé **SunuBot** — l'interface web du chatbot. C'est une application Next.js avec un design inspiré de WhatsApp (familier pour les utilisateurs sénégalais). Le chatbot comprend le wolof et le français, détecte automatiquement la langue, et route les requêtes vers les bons serveurs MCP.

### Pourquoi "SunuBot" ?

"Sunu" signifie "notre" en wolof. SunuBot = "Notre Bot" — c'est le bot de tous les citoyens sénégalais.

### Architecture du frontend

```
frontend/
├── app/
│   ├── page.tsx          ← Page principale (interface de chat)
│   ├── layout.tsx        ← Layout global (titre, polices)
│   ├── globals.css       ← Styles globaux (Tailwind)
│   └── api/
│       └── chat/
│           └── route.ts  ← API endpoint (orchestre les serveurs MCP)
├── components/
│   └── ChatMessage.tsx   ← Composant bulle de message
├── lib/
│   └── mcp-orchestrator.ts  ← Orchestrateur MCP (routing intelligent)
└── package.json
```

### Stack technique

- **Framework** : Next.js 15 (App Router)
- **Langage** : TypeScript
- **Style** : Tailwind CSS
- **Icônes** : Lucide React
- **Architecture** : API Routes (serverless)

### Fonctionnalités de l'interface

1. **Design WhatsApp-like** — Bulles de chat vertes (utilisateur) et blanches (assistant)
2. **Détection de langue automatique** — Badge "Wolof" / "Français" / "Mixte" sur chaque message
3. **Réponses bilingues** — Le bot répond en wolof si on lui parle en wolof
4. **Boutons rapides** — Suggestions cliquables pour les démarches courantes
5. **Indicateur de chargement** — Animation pendant le traitement
6. **Tools affichés** — On voit quels outils MCP ont été utilisés pour chaque réponse
7. **Sélecteur de langue** — Possibilité de forcer wolof ou français
8. **Bouton micro** — Prévu pour l'ajout futur de la reconnaissance vocale

### L'orchestrateur MCP (le cerveau)

Le fichier `mcp-orchestrator.ts` est le cœur du système. Il :
1. Reçoit le message du citoyen
2. Détecte la langue (wolof/français/mixte)
3. Identifie l'intention (que veut le citoyen ?)
4. Route vers le bon domaine (état civil, DGID, CNSS, formulaires)
5. Appelle les tools MCP appropriés
6. Formule la réponse dans la bonne langue

### Comment ça détecte le wolof ?

L'orchestrateur utilise une liste de 40+ indicateurs wolof (mots-clés grammaticaux comme "dama", "bëgg", "ngi", etc.) et compare avec les indicateurs français. Si le score wolof est dominant → wolof. Si les deux sont présents → mixte.

### Exemples de conversations supportées

| Entrée utilisateur | Langue | Réponse |
|-------------------|--------|---------|
| "Na nga def" | Wolof | Salutation en wolof + menu |
| "Je veux mon acte de naissance" | Français | Guide complet (pièces, coût, délai) |
| "Dama bëgg sama kàrt bëccëg" | Wolof | Même guide mais en wolof |
| "Comment payer mes impôts ?" | Français | Options de paiement + échéances |
| "Naka laa feyee sama wàll?" | Wolof | Idem en wolof |

### Comment lancer le frontend

```bash
cd prototype/frontend
npm run dev         # Lance en mode développement (http://localhost:3000)
npm run build       # Build de production
npm run start       # Lance le build de production
```

---

## Module NLP Python — Explications détaillées

### Qu'est-ce qu'on a fait ?

On a créé le **module NLP Python** — le moteur de traitement du langage naturel de SunuBot. C'est le composant qui analyse les messages des citoyens pour détecter la langue, comprendre l'intention, et extraire les entités (documents, lieux, montants, dates). Il remplace l'orchestrateur JavaScript simulé par un vrai système de Machine Learning.

### Pourquoi Python ?

Python est le standard de l'industrie pour le NLP et le Machine Learning :
- **scikit-learn** : bibliothèque mature et performante pour la classification de texte
- **FastAPI** : framework web moderne, rapide et avec documentation automatique (Swagger)
- **Interopérabilité** : le module est exposé comme une API REST que n'importe quel frontend peut appeler

### Architecture du module

```
nlp/
├── data/
│   └── corpus_wolof_admin.json     ← Corpus d'entraînement bilingue (80 exemples)
├── models/
│   ├── intent_classifier.pkl       ← Modèle de classification d'intention (TF-IDF + SVM)
│   ├── domain_classifier.pkl       ← Modèle de classification de domaine (TF-IDF + NB)
│   └── langue_detector_ml.pkl      ← Modèle de détection de langue (TF-IDF + NB)
├── src/
│   ├── langue_detector.py          ← Détecteur de langue par marqueurs linguistiques
│   ├── intent_classifier.py        ← Classifieur d'intention + extracteur d'entités
│   ├── train_model.py              ← Script d'entraînement des modèles
│   └── api.py                      ← API REST FastAPI (pont frontend↔NLP)
├── main.py                         ← Point d'entrée (--train, --test, ou API)
└── requirements.txt                ← Dépendances Python
```

### Le corpus d'entraînement

Le fichier `corpus_wolof_admin.json` contient **80 exemples annotés** couvrant :
- **19 intentions** : demande_document, question_procedure, question_lieu, question_cout, salutation, suivi_demande, question_statut, demande_inscription, etc.
- **6 domaines** : etat_civil, dgid, cnss, education, sante, general
- **3 langues** : wolof, francais, mixte
- **Entités annotées** : documents (acte_naissance, ninea...), lieux (mairie, centre_fiscal...)

Chaque exemple est structuré ainsi :
```json
{
  "texte": "Dama bëgg sama kàrt bëccëg",
  "intention": "demande_document",
  "domaine": "etat_civil",
  "langue": "wolof",
  "entites": { "documents": ["acte_naissance"] }
}
```

### Approche technique : TF-IDF + Classification

**Pourquoi TF-IDF sur les n-grammes de caractères ?**

Le wolof est une langue agglutinante — les mots changent de forme selon le contexte. Par exemple :
- "bëgg" (vouloir) → "bëgga" (veut), "bëggoon" (voulait)
- "dem" (aller) → "dema" (est allé), "demoon" (allait)

Les n-grammes de caractères (`char_wb`, 2 à 5 grammes) capturent ces variations morphologiques sans avoir besoin d'un analyseur morphologique dédié. C'est plus robuste que les n-grammes de mots pour une langue peu dotée.

**Pipeline de classification :**

| Modèle | Algorithme | Paramètres | Rôle |
|--------|-----------|------------|------|
| intent_classifier | TF-IDF + LinearSVC | char_wb, 2-5 grams, 10000 features, balanced | Classifier l'intention (19 classes) |
| domain_classifier | TF-IDF + MultinomialNB | char_wb, 2-4 grams, 5000 features | Classifier le domaine (6 classes) |
| langue_detector_ml | TF-IDF + MultinomialNB | char_wb, 2-4 grams, 5000 features | Détecter la langue (3 classes) |

**Pourquoi LinearSVC pour l'intention ?** — Plus adapté aux problèmes multi-classes avec beaucoup de catégories. Il maximise la marge entre les classes.

**Pourquoi MultinomialNB pour le domaine et la langue ?** — Plus simple, rapide, et suffisant quand il y a peu de classes (6 et 3 respectivement).

### Détection de langue hybride

Le détecteur de langue utilise une approche **hybride** (pas uniquement du ML) :

1. **Score par marqueurs linguistiques** — 40+ mots-clés wolof (naa, dama, bëgg...) et 60+ mots-clés français (je, tu, est, pour...)
2. **Bonus n-grammes** — Séquences de caractères typiques du wolof (ëg, àr, mb, nd, ñ...)
3. **Bonus caractères spéciaux** — Lettres propres au wolof (ë, à, ñ) ajoutent du poids
4. **Seuil de décision** — wolof si score_wolof > 1.3 × score_français, mixte si les deux sont positifs

Cette approche hybride est plus robuste qu'un modèle seul car :
- Les marqueurs linguistiques sont fiables même sur du texte court (1-2 mots)
- Le ML prend le relais pour les cas ambigus
- Le code-switching (mélange wolof-français) est correctement détecté comme "mixte"

### Extraction d'entités (regex)

L'extracteur utilise des expressions régulières pour identifier :
- **Documents** : acte_naissance, acte_mariage, carte_identite, ninea, passeport, etc. — reconnaît les termes en wolof ET en français
- **Lieux** : mairie/meeri, centre fiscal/biro wàll, CNSS, hôpital
- **Montants** : patterns numériques suivis de FCFA/francs
- **Dates** : formats JJ/MM/AAAA et AAAA-MM-JJ

### L'API REST (FastAPI)

Le fichier `api.py` expose 5 endpoints :

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/health` | GET | Vérifie que le service est opérationnel |
| `/detecter-langue` | POST | Détecte la langue d'un texte |
| `/classifier-intention` | POST | Classifie l'intention avec le top-3 |
| `/extraire-entites` | POST | Extrait les entités nommées |
| `/analyser` | POST | **Analyse complète** (langue + intention + entités + action MCP) |

L'endpoint `/analyser` est le plus important — il fait tout en une seule requête et suggère quelle action MCP appeler :

```json
{
  "texte": "Dama bëgg sama kàrt bëccëg",
  "analyse": {
    "langue": { "langue": "wolof", "confiance": 0.85 },
    "intention": { "intention": "demande_document", "domaine": "etat_civil", "confiance": 0.92 },
    "entites": { "documents": ["acte_naissance"] },
    "action_mcp": {
      "serveur": "etat-civil",
      "tools": ["rechercher_citoyen", "get_acte_naissance"],
      "formulaire": "form-001"
    }
  }
}
```

### Routage intelligent (suggest_mcp_action)

La fonction `suggest_mcp_action` est le **routeur** du système. Elle prend l'intention + le domaine et détermine :
- Quel **serveur MCP** appeler (etat-civil, dgid, formulaires)
- Quels **tools** utiliser
- Quel **formulaire** proposer

C'est le lien entre l'analyse NLP et les serveurs MCP — le "cerveau" qui transforme la compréhension du langage en actions concrètes.

### Résultats d'évaluation

| Métrique | Intention | Domaine | Langue |
|----------|-----------|---------|--------|
| Précision sur corpus | 100% | 99% | 99% |
| F1-score (cross-validation 5-fold) | 0.378 | 0.724 | 0.746 |

Le F1 cross-validation est plus bas car le corpus est petit (80 exemples pour 19 classes d'intention = ~4 exemples/classe). Pour un prototype de mémoire, c'est normal et suffisant. En production, il faudrait 500+ exemples par classe.

### Comment lancer

```bash
# Entraîner les modèles
cd prototype/nlp
python main.py --train

# Tester la détection
python main.py --test

# Lancer l'API (port 8000)
python main.py
# Documentation : http://localhost:8000/docs
```

### Comment le frontend s'y connecte

L'API NLP est exposée sur `localhost:8000`. Le frontend Next.js (localhost:3000) appelle `/analyser` via la route `/api/chat`. Le flux est :

1. Utilisateur envoie un message
2. Next.js appelle `http://localhost:8000/analyser` (API Python)
3. Python détecte la langue, classifie l'intention, extrait les entités
4. Python suggère quelle action MCP appeler
5. Next.js utilise la suggestion pour formuler la réponse appropriée
6. Si l'API Python n'est pas disponible → fallback sur l'orchestrateur JavaScript local

Cette architecture **découplée** permet :
- De faire évoluer le NLP indépendamment du frontend
- De tester l'API Python seule via Swagger (localhost:8000/docs)
- De remplacer le modèle ML par un modèle plus puissant sans toucher au frontend

---

## Connexion Frontend ↔ API NLP — Architecture complète

### Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                     UTILISATEUR (Navigateur)                  │
│                     localhost:3000                            │
└────────────────────────────┬────────────────────────────────┘
                             │ Message texte
                             ▼
┌─────────────────────────────────────────────────────────────┐
│               FRONTEND (Next.js 15 + Tailwind)               │
│               app/api/chat/route.ts                          │
│                                                             │
│  1. Vérifie si l'API NLP est disponible (/health)           │
│  2. Si OUI → appelle /analyser (Python)                     │
│  3. Si NON → utilise l'orchestrateur local (fallback)       │
└─────────────────┬──────────────────────┬────────────────────┘
                  │ (mode principal)     │ (mode fallback)
                  ▼                      ▼
┌─────────────────────────────┐  ┌──────────────────────────┐
│    API NLP Python            │  │  Orchestrateur local TS  │
│    FastAPI (port 8000)       │  │  mcp-orchestrator.ts     │
│                              │  │  (regex + patterns)      │
│  • Détection langue (ML)     │  └──────────────────────────┘
│  • Classification intention  │
│  • Extraction entités        │
│  • Suggestion action MCP     │
└──────────────────────────────┘
                  │
                  ▼ (suggestion d'action)
┌─────────────────────────────────────────────────────────────┐
│                    SERVEURS MCP (4)                           │
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌───────────┐  │
│  │État Civil│  │   DGID   │  │Wolof NLP │  │Formulaires│  │
│  │ 5 tools  │  │ 6 tools  │  │ 6 tools  │  │  6 tools  │  │
│  └──────────┘  └──────────┘  └──────────┘  └───────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Fichiers clés de la connexion

| Fichier | Rôle |
|---------|------|
| `frontend/lib/nlp-client.ts` | Client HTTP pour appeler l'API Python |
| `frontend/app/api/chat/route.ts` | Route API qui orchestre NLP + réponses |
| `frontend/lib/mcp-orchestrator.ts` | Fallback si Python non disponible |
| `nlp/src/api.py` | Serveur FastAPI Python |

### Mode de fonctionnement

Le système a **deux modes** :

1. **Mode principal (Python API)** — Quand le serveur FastAPI est lancé (port 8000), le frontend l'utilise pour l'analyse NLP. C'est le mode le plus précis grâce au Machine Learning.

2. **Mode fallback (JavaScript local)** — Si l'API Python n'est pas disponible, le frontend bascule automatiquement sur l'orchestrateur TypeScript qui utilise des regex et des patterns. Moins précis mais toujours fonctionnel.

### Comment lancer le système complet

```bash
# Terminal 1 — API NLP Python
cd prototype/nlp
python main.py

# Terminal 2 — Frontend Next.js
cd prototype/frontend
npm run dev
```

Puis ouvrir http://localhost:3000 dans le navigateur.

---

## Récapitulatif technique complet

| Composant | Technologie | Port | Rôle |
|-----------|------------|------|------|
| Frontend | Next.js 15 + Tailwind | 3000 | Interface utilisateur |
| API NLP | Python + FastAPI | 8000 | Analyse du langage naturel |
| État Civil MCP | TypeScript + MCP SDK | stdio | Données état civil |
| DGID MCP | TypeScript + MCP SDK | stdio | Données fiscales |
| Wolof NLP MCP | TypeScript + MCP SDK | stdio | Ressources linguistiques |
| Formulaires MCP | TypeScript + MCP SDK | stdio | Gestion des formulaires |

---

## Système d'Inscription et Formulaires Interactifs — Explications détaillées

### Qu'est-ce qu'on a fait ?

On a ajouté le **flux complet d'inscription et de demande de documents** directement dans le chatbot. Le citoyen peut maintenant :
1. S'inscrire dans le système (en wolof ou français)
2. Demander un document (acte de naissance, mariage, etc.)
3. Recevoir un numéro de suivi
4. Suivre sa demande plus tard

Tout ça **sans se déplacer** — c'est le but du projet.

### Pourquoi c'est important ?

Au Sénégal, les démarches administratives nécessitent souvent :
- Se déplacer physiquement au centre d'état civil
- Faire la queue pendant des heures
- Revenir plusieurs fois (pièces manquantes, documents pas prêts)
- Parler français (ce qui exclut une partie de la population)

Notre chatbot résout ces 4 problèmes :
- Pas besoin de se déplacer (tout se fait en ligne)
- Pas de queue (réponse instantanée)
- Le bot vérifie tout avant de soumettre (pas de pièces manquantes)
- Le bot parle **wolof** (inclusion linguistique)

### Architecture des nouvelles API

```
frontend/app/api/
├── chat/route.ts           ← Chat principal (détection langue + intention)
├── inscription/route.ts    ← Inscription d'un nouveau citoyen
├── citoyen/route.ts        ← Recherche d'un citoyen (par nom ou numéro)
└── formulaire/route.ts     ← Soumission de formulaire + suivi de demande
```

```
frontend/lib/
├── data-citoyens.ts        ← Base de données simulée (20 citoyens + fonctions CRUD)
├── nlp-client.ts           ← Client API Python NLP
└── mcp-orchestrator.ts     ← Orchestrateur MCP (fallback)
```

```
frontend/components/
├── ChatMessage.tsx          ← Bulle de message
└── ChatForm.tsx             ← Formulaires interactifs (inscription, recherche, résultat)
```

### Les nouveaux composants interactifs

| Composant | Rôle | Quand il apparaît |
|-----------|------|-------------------|
| `ChatForm` | Formulaire à remplir dans le chat | Quand le citoyen veut s'inscrire |
| `CitizenInfo` | Affiche les infos d'un citoyen trouvé | Quand on recherche par nom/numéro |
| `SubmissionResult` | Confirmation avec numéro de suivi | Après soumission d'une demande |
| `QuickSearch` | Champ de recherche rapide | Quand le bot demande un nom/numéro |

### Les endpoints API

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/chat` | POST | Analyse le message et retourne la réponse du bot |
| `/api/inscription` | POST | Inscrit un nouveau citoyen dans les registres |
| `/api/citoyen` | POST | Recherche un citoyen par nom ou numéro d'acte |
| `/api/formulaire` | POST | Soumet une demande OU suit une demande existante |

### Flux complet : Inscription (en français)

1. Le citoyen écrit : **"Je veux m'inscrire"**
2. Le bot détecte l'intention `inscription` et affiche le **formulaire d'inscription** :
   - Nom de famille
   - Prénom
   - Date de naissance
   - Lieu de naissance
   - Nom complet du père
   - Nom complet de la mère
   - Téléphone
3. Le citoyen remplit et clique **"Soumettre la demande"**
4. Le système :
   - Vérifie que le citoyen n'existe pas déjà (détection de doublon)
   - Génère un **numéro d'acte** unique (ex: `N-2024-021-THI`)
   - Enregistre le citoyen dans la base
5. Le bot confirme : "Inscription réussie ! Votre numéro d'acte est **N-2024-021-THI**"
6. Le bot affiche les infos complètes du citoyen

### Flux complet : Inscription (en wolof)

1. Le citoyen écrit : **"Dama begg bind"** (Je veux m'inscrire)
2. Le bot détecte le wolof et affiche le **même formulaire mais avec les labels en wolof** :
   - Tur gu moom (sant) → Nom de famille
   - Tur gu njekk → Prénom
   - Bes bu juddu → Date de naissance
   - Fu juddu → Lieu de naissance
   - Tur baay bu mat → Nom du père
   - Tur yaay bu mat → Nom de la mère
   - Numero telefon → Téléphone
3. Le citoyen remplit et clique **"Yonnee"** (Soumettre)
4. Le bot confirme en wolof : "Inscription jot na! Sa numero acte mooy **N-2024-021-THI**"

### Flux complet : Demande de document

**Citoyen déjà inscrit :**
1. "Je veux mon acte de naissance" OU "Dama begg sama kart becceg"
2. Le bot demande le nom ou numéro d'acte (champ de recherche)
3. Le citoyen tape son nom (ex: "DIOP")
4. Le bot retrouve les infos et les affiche :
   - Nom complet, date/lieu de naissance, parents, commune, centre
   - Délai : **1 jour ouvrable**
   - Bouton : **"Confirmer la demande"** / **"Waaw, laaj kart bi"**
5. Le citoyen confirme
6. Le bot génère un **numéro de suivi** (ex: `DEM-2024-004`)
7. Le bot indique où retirer le document

**Citoyen PAS inscrit :**
1. "Je veux mon acte de naissance"
2. Le bot demande le nom
3. Le citoyen tape un nom inconnu (ex: "TRAORE")
4. Le bot dit : "Je n'ai pas trouvé votre nom. Vous devez d'abord vous inscrire."
   - En wolof : "Gisuma sa tur ci registre bi. War nga bind ci systeme bi."
5. Le citoyen doit d'abord s'inscrire, puis revenir demander son document

### Flux complet : Suivi de demande

1. "Suivre ma demande" OU "Dama begg topp sama demande"
2. Le bot demande le numéro de suivi
3. Le citoyen écrit : "DEM-2024-001"
4. Le bot affiche le statut :
   - `soumise` → "Soumise - En attente de traitement"
   - `en_traitement` → "En cours de traitement"
   - `prete` → **"Prête - À retirer"** au centre X
   - `retiree` → "Retirée"

### Recherche par numéro d'acte

Si le citoyen connaît son numéro d'acte (ex: `N-2024-001-THI`), il peut l'écrire directement dans le chat. Le bot retrouve immédiatement ses informations complètes sans avoir besoin du nom.

### Base de données simulée

Pour le prototype, les données sont stockées en mémoire (via `globalThis` pour persister entre les routes API). En production, ce serait une base Firebase ou PostgreSQL.

**Données initiales :**
- 20 citoyens inscrits (couvrant 14 régions du Sénégal)
- 3 demandes déjà soumises (avec différents statuts)

**Génération automatique :**
- Numéros d'acte : `N-2024-XXX-REG` (REG = 3 premières lettres de la ville)
- Numéros de suivi : `DEM-2024-XXX` (incrémenté automatiquement)
- Délai standard : 1 jour ouvrable
- Lieu de retrait : Centre d'état civil de la commune

### Le bilinguisme complet

Tout ce que le bot fait en français, il le fait en wolof :

| Élément | Français | Wolof |
|---------|----------|-------|
| Bouton inscription | "S'inscrire" | "Bind (S'inscrire)" |
| Commande inscription | "Je veux m'inscrire" | "Dama begg bind" |
| Label nom | "Nom de famille" | "Tur gu moom (sant)" |
| Label prénom | "Prénom" | "Tur gu njekk" |
| Label date naissance | "Date de naissance" | "Bes bu juddu" |
| Label lieu | "Lieu de naissance" | "Fu juddu" |
| Label père | "Nom du père" | "Tur baay bu mat" |
| Label mère | "Nom de la mère" | "Tur yaay bu mat" |
| Bouton soumettre | "Soumettre la demande" | "Yonnee" |
| Envoi en cours | "Envoi en cours..." | "Yonnee ngi..." |
| Choisir | "-- Choisir --" | "-- Tann --" |
| Confirmation inscription | "Inscription réussie !" | "Inscription jot na!" |
| Confirmation demande | "Demande soumise !" | "Sa demande yonnee na!" |
| Demander un document | "Je veux mon acte de naissance" | "Dama begg sama kart becceg" |
| Recherche | "Entrez votre nom" | "Bind sa tur" |
| Citoyen trouvé | "Vos informations" | "Sa informations yi" |
| Nom complet | "Nom complet" | "Tur" |
| Date naissance | "Date de naissance" | "Bes bu juddu" |
| Lieu naissance | "Lieu de naissance" | "Fu juddu" |
| Père | "Nom du père" | "Baay" |
| Mère | "Nom de la mère" | "Yaay" |
| Commune | "Commune" | "Gox" |
| Délai | "Votre document sera prêt dans 1 jour" | "Sa kart bi dina am ci 1 jour" |
| Confirmer | "Confirmer la demande" | "Waaw, laaj kart bi" |
| Numéro suivi | "Numéro de suivi" | "Numéro suivi" |
| Lieu retrait | "Lieu de retrait" | "Fu la jel" |
| Conserver numéro | "Conservez ce numéro" | "Baal sa numéro suivi bi" |
| Pas trouvé | "Vous devez d'abord vous inscrire" | "War nga bind ci systeme bi" |
| Suivre demande | "Suivre ma demande" | "Dama begg topp sama demande" |
| Statut | "Prête - À retirer" | "Prete - A retirer" |

### Détection automatique de la langue

Le système détecte automatiquement si le citoyen parle wolof ou français grâce à :
1. **L'API NLP Python** (si elle est lancée) — classification ML
2. **Les marqueurs linguistiques** (fallback) — mots wolof détectés : dama, begg, sama, bind, topp, kart...

Une fois la langue détectée, **toute l'interface s'adapte** : les labels du formulaire, les messages du bot, les boutons, les confirmations — tout passe en wolof.

### Comment tester

```bash
# Lancer le frontend
cd prototype/frontend
npm run dev

# Ouvrir http://localhost:3000

# Test en français :
# 1. Cliquer "S'inscrire" → Remplir → Soumettre
# 2. Cliquer "Acte de naissance" → Taper son nom → Confirmer
# 3. Écrire "DEM-2024-001" → Voir le statut

# Test en wolof :
# 1. Cliquer "Bind (S'inscrire)" → Remplir → Yonnee
# 2. Cliquer "Kart becceg" → Taper son nom → Confirmer
# 3. Écrire "Dama begg topp sama demande" → Donner le numéro
```

---

## Récapitulatif technique complet (mis à jour)

| Composant | Technologie | Port | Rôle |
|-----------|------------|------|------|
| Frontend | Next.js 15 + Tailwind | 3000 | Interface chatbot + formulaires |
| API NLP | Python + FastAPI | 8000 | Analyse du langage naturel |
| API Inscription | Next.js API Route | 3000 | Enregistrement des citoyens |
| API Citoyen | Next.js API Route | 3000 | Recherche dans les registres |
| API Formulaire | Next.js API Route | 3000 | Soumission + suivi de demandes |
| État Civil MCP | TypeScript + MCP SDK | stdio | Données état civil |
| DGID MCP | TypeScript + MCP SDK | stdio | Données fiscales |
| Wolof NLP MCP | TypeScript + MCP SDK | stdio | Ressources linguistiques |
| Formulaires MCP | TypeScript + MCP SDK | stdio | Gestion des formulaires |

### Sujet du mémoire

**"Chatbot multilingue (Français/Wolof) avec MCP pour les services administratifs sénégalais"**

Le prototype démontre les 4 piliers du sujet :
1. **Chatbot** — Interface conversationnelle accessible via navigateur web
2. **Multilingue** — Tout fonctionne en français ET en wolof (détection automatique)
3. **MCP** — 4 serveurs exposant 23 tools + 11 resources via le protocole standardisé
4. **Services administratifs** — Inscription, demande de documents, suivi de dossiers, informations fiscales

### Prochaine étape

Le prototype est complet et fonctionnel. L'étape suivante est la rédaction du **Chapitre 4 du mémoire** (Réalisation du prototype) basée sur tout ce qui a été implémenté.
