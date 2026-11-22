# SunuBot — Chatbot Administratif Multilingue pour le Senegal

![CI](https://github.com/Adamswindy9898/sunubot-prototype/actions/workflows/ci.yml/badge.svg)
![Python](https://img.shields.io/badge/Python-3.11+-blue)
![Next.js](https://img.shields.io/badge/Next.js-15.3-black)
![mBERT](https://img.shields.io/badge/mBERT-fine--tuned-orange)
![Tests](https://img.shields.io/badge/tests-41%2F41%20PASS-brightgreen)
![License](https://img.shields.io/badge/license-academic-lightgrey)

**SunuBot** est une plateforme intelligente de services administratifs numeriques pour les citoyens senegalais. Elle combine un chatbot multilingue (francais/wolof), le protocole MCP (Model Context Protocol), et des modeles NLP avances pour simplifier les demarches administratives.

## Fonctionnalites principales

- **Chatbot multilingue** : Interaction en francais et en wolof avec detection automatique de la langue
- **4 serveurs MCP** : Etat Civil, DGID (impots), CNSS (securite sociale), Formulaires
- **NLP avance** : mBERT fine-tune sur corpus 256 phrases + Mistral LLM avec 4 modes de fallback
- **Tolerance aux fautes** : Correcteur de 150+ fautes courantes + matching flou (difflib)
- **Dashboard admin** : Statistiques temps reel, gestion des demandes, export CSV
- **Suivi citoyen** : Timeline visuelle des demandes (RECU, EN COURS, VALIDE, DISPONIBLE)
- **Dark mode** : Theme sombre avec persistence localStorage
- **PWA** : Application installable avec service worker et mode hors-ligne
- **Accessibilite** : WCAG compliant (ARIA labels, skip-to-content, aria-live)
- **Onboarding** : Tutoriel interactif bilingue FR/Wolof
- **Reactions** : Pouce haut/bas + bouton copier sur chaque message
- **Raccourcis clavier** : Ctrl+K (focus), Escape (effacer)
- **Page statut** : Monitoring en temps reel des services (/status)
- **Documentation API** : 9 endpoints documentes (/api-docs)
- **Entree vocale** : Reconnaissance vocale pour le francais et le wolof

## Architecture technique

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│               Next.js 15.3.3 (PWA)                   │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│  │ Chatbot │ │  Statut  │ │API Docs  │ │  Admin  │  │
│  │  Page   │ │  Page    │ │  Page    │ │Dashboard│  │
│  └────┬────┘ └─────┬────┘ └────┬─────┘ └────┬────┘  │
│       └────────────┴───────────┴─────────────┘       │
│                        │                             │
│              Prisma ORM (PostgreSQL 14)               │
└──────────────────────────────────────────────────────┘
                         │
                    API Routes
                         │
┌──────────────────────────────────────────────────────┐
│                  BACKEND NLP                         │
│             FastAPI Python (port 8000)                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────┐  │
│  │ mBERT   │ │ Mistral │ │ TF-IDF  │ │Correcteur │  │
│  │fine-tune│ │  Cloud  │ │Fallback │ │  Fautes   │  │
│  └─────────┘ └─────────┘ └─────────┘ └───────────┘  │
└──────────────────────────────────────────────────────┘
                         │
┌──────────────────────────────────────────────────────┐
│                 SERVEURS MCP                         │
│  ┌───────────┐ ┌──────┐ ┌──────┐ ┌──────────────┐   │
│  │Etat Civil │ │ DGID │ │ CNSS │ │ Formulaires  │   │
│  │(wolof-nlp)│ │      │ │      │ │              │   │
│  └───────────┘ └──────┘ └──────┘ └──────────────┘   │
└──────────────────────────────────────────────────────┘
```

## Stack technique

| Composant | Technologie |
|-----------|-------------|
| Frontend | Next.js 15.3.3, React 19, TailwindCSS 4 |
| Backend NLP | Python 3.11+, FastAPI, Uvicorn |
| Base de donnees | PostgreSQL 14 (via Prisma ORM) |
| LLM | Mistral (mistral-small-latest) via API cloud |
| Classification | mBERT (bert-base-multilingual-cased) fine-tune |
| Corpus | 256 phrases brutes FR/Wolof, ~800+ augmentees |
| Protocole | MCP (Model Context Protocol) — 4 serveurs |
| Containerisation | Docker Compose (PostgreSQL + NLP + Frontend + MCP) |
| CI/CD | GitHub Actions (tests auto sur push) |
| Tests | Pytest — 41 tests (langue, intent, entites, mBERT, pipeline) |

## Installation

### Prerequis

- Node.js 18+
- Python 3.10+
- PostgreSQL 14
- Cle API Mistral

### Installation rapide

```bash
git clone https://github.com/Adamswindy9898/sunubot-prototype.git
cd sunubot-prototype
```

**Frontend :**
```bash
cd frontend
npm install
npx prisma generate
npx prisma migrate deploy
npx next dev -p 4000
```

**Backend NLP :**
```bash
cd nlp
pip install -r requirements.txt
cd src
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

### Docker (optionnel)

```bash
docker-compose up -d
```

Lance PostgreSQL 14, le backend NLP et le frontend automatiquement.

### Variables d'environnement (.env)

```env
DATABASE_URL=postgresql://postgres:VOTRE_MDP@localhost:5433/sunubot
MISTRAL_API_KEY=votre_cle_mistral
ADMIN_PASSWORD=admin2024
JWT_SECRET=votre_secret
```

## Tests

### Tests NLP (pytest)

```bash
cd nlp
python -m pytest tests/ -v
```

**Resultat : 41/41 PASS** couvrant :
- Detection de langue (wolof/francais)
- Normalisation wolof
- Correction de texte
- Classification TF-IDF
- Extraction d'entites (documents, lieux, montants, dates)
- Classification mBERT (brut + avec corrections)
- Pipeline complet

### Fine-tuning mBERT (Google Colab)

Le notebook `notebooks/SunuBot_FineTuning_mBERT.ipynb` permet de fine-tuner mBERT sur le corpus bilingue :
1. Ouvrir dans Google Colab (GPU T4)
2. Executer toutes les cellules
3. Telecharger le modele et le placer dans `nlp/models/mbert_finetuned/`

## Pipeline NLP (4 modes)

| Mode | Modeles | Quand ? |
|------|---------|---------|
| 1. mBERT + Mistral | Classification + Generation | Pipeline complet (par defaut) |
| 2. Mistral seul | LLM cloud | Si mBERT indisponible |
| 3. mBERT seul | Classification locale | Si Mistral indisponible |
| 4. TF-IDF | Fallback basique | Si aucun modele avance |

## Pages de l'application

| Page | URL | Acces | Description |
|------|-----|-------|-------------|
| Chatbot | `/` | Public | Interface principale du chatbot |
| Admin | `/admin` | Admin | Dashboard administrateur |
| Statistiques | `/stats` | Admin | Statistiques d'utilisation |
| Historique | `/historique` | Admin | Historique des conversations |
| Statut | `/status` | Public | Monitoring des services en temps reel |
| API Docs | `/api-docs` | Public | Documentation des 9 endpoints |

## Auteur

**Adama GAYE** — Etudiant Master 2 Intelligence Artificielle
Universite de Thies, Senegal
Memoire de fin d'etudes — 2025/2026

## Licence

Ce projet est developpe dans le cadre d'un memoire universitaire.
