# SunuBot — Chatbot Administratif Multilingue pour le Senegal

**SunuBot** est une plateforme intelligente de services administratifs numeriques pour les citoyens senegalais. Elle combine un chatbot multilingue (francais/wolof), le protocole MCP (Model Context Protocol), et des modeles NLP avances pour simplifier les demarches administratives.

## Fonctionnalites principales

- **Chatbot multilingue** : Interaction en francais et en wolof avec detection automatique de la langue
- **4 serveurs MCP** : Etat Civil, DGID (impots), CNSS (securite sociale), Formulaires
- **NLP avance** : mBERT fine-tune + Mistral LLM avec 4 modes de fallback
- **Tolerance aux fautes** : Correcteur de 150+ fautes courantes + matching flou (difflib)
- **Dashboard admin** : Statistiques temps reel, gestion des demandes, export CSV/PDF
- **Suivi citoyen** : Timeline visuelle des demandes (RECU, EN COURS, VALIDE, DISPONIBLE)
- **Notifications** : Email (Nodemailer) + WhatsApp (Meta Cloud API) + in-app
- **Satisfaction** : Enquete NPS/MOS integree avec analyse des resultats
- **Carte interactive** : Localisation des centres administratifs (Leaflet)
- **Entree vocale** : Reconnaissance vocale pour le francais et le wolof

## Architecture technique

```
┌──────────────────────────────────────────────────────┐
│                    FRONTEND                          │
│            Next.js 15.3.3 (port 5001)                │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐  │
│  │ Chatbot │ │Dashboard │ │Historique│ │  Admin  │  │
│  │  Page   │ │ Citoyen  │ │  Page    │ │Dashboard│  │
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
| Backend NLP | Python 3.13, FastAPI, Uvicorn |
| Base de donnees | PostgreSQL 14 (via Prisma ORM) |
| LLM | Mistral (mistral-small-latest) via API cloud |
| Classification | mBERT (bert-base-multilingual-cased) fine-tune |
| Protocole | MCP (Model Context Protocol) — 4 serveurs |
| Notifications | Nodemailer (email) + Meta WhatsApp Cloud API |
| Carte | Leaflet / OpenStreetMap |
| Tests | Pytest (NLP), test unitaires |

## Installation

### Prerequis

- Node.js 18+
- Python 3.10+
- PostgreSQL 14
- Cle API Mistral

### Configuration

1. Cloner le depot :
```bash
git clone https://github.com/Adamswindy9898/sunubot-prototype.git
cd sunubot-prototype
```

2. Configurer les variables d'environnement :
```bash
cp .env.example .env
# Editer .env avec vos propres valeurs
```

3. Installer le frontend :
```bash
cd frontend
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev -- -p 5001
```

4. Installer le backend NLP :
```bash
cd nlp
pip install -r requirements.txt
cd src
python -m uvicorn api:app --host 0.0.0.0 --port 8000
```

### Variables d'environnement (.env)

```env
DATABASE_URL=postgresql://postgres:VOTRE_MDP@localhost:5433/sunubot
MISTRAL_API_KEY=votre_cle_mistral
SMTP_HOST=smtp.gmail.com
SMTP_USER=votre_email
SMTP_PASS=votre_mdp_app
WHATSAPP_TOKEN=votre_token_meta
WHATSAPP_PHONE_ID=votre_phone_id
```

## Tests NLP

```bash
cd nlp/src
python -c "
import requests
tests = [
    ('Bonjour', 'salutation'),
    ('Je veux mon acte de naissance', 'demande_document'),
    ('Na nga def', 'salutation'),
    ('Dama begg sama kart becceg', 'demande_document'),
    ('Comment payer mes impots', 'question_procedure'),
    ('Naka lanu feyee alamaan bi', 'question_procedure'),
    ('Ou se trouve le bureau de letat civil', 'question_lieu'),
    ('Combien coute un acte de naissance', 'question_cout'),
    ('Je veux m inscrire a la CNSS', 'demande_inscription'),
    ('Dama begg feyee sama wall ci DGID', 'question_procedure'),
]
pass_count = 0
for texte, expected in tests:
    r = requests.post('http://localhost:8000/analyser', json={'texte': texte}).json()
    intention = r['analyse']['intention']['intention']
    ok = intention == expected
    pass_count += ok
    print(f'{'PASS' if ok else 'FAIL'} {texte} -> {intention} (attendu: {expected})')
print(f'Resultat: {pass_count}/{len(tests)}')
"
```

**Resultat : 10/10 tests PASS**

## Pages de l'application

| Page | URL | Description |
|------|-----|-------------|
| Chatbot | `/` | Interface principale du chatbot |
| Admin | `/admin` | Dashboard administrateur (mot de passe: admin2024) |
| Historique | `/historique` | Historique des conversations |
| Mobile | `/mobile` | Version mobile optimisee |
| WhatsApp | `/whatsapp` | Simulation interface WhatsApp |

## Pipeline NLP (4 modes)

1. **Mode 1 — mBERT + Mistral** : Classification rapide (mBERT) + analyse fine et generation (Mistral)
2. **Mode 2 — Mistral seul** : Si mBERT indisponible, Mistral gere tout
3. **Mode 3 — mBERT seul** : Classification locale sans LLM cloud
4. **Mode 4 — TF-IDF** : Fallback total si aucun modele avance disponible

## Auteur

**Adama GAYE** — Etudiant Master 2 Intelligence Artificielle  
Universite de Thies, Senegal  
Memoire de fin d'etudes — 2025/2026

## Licence

Ce projet est developpe dans le cadre d'un memoire universitaire.
