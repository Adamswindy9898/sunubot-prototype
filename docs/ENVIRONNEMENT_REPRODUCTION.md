# Environnement et commandes de reproduction de SunuBot

État relevé le 2 novembre 2026 sur le poste de développement. Les versions
doivent être revérifiées après toute mise à jour des dépendances.

## Versions relevées

| Composant | Version |
| --- | --- |
| Windows | Windows 11 (poste DELL) |
| Python | 3.13.13 |
| FastAPI | 0.115.0 |
| Uvicorn | 0.30.6 |
| PyTorch | 2.12.1+cpu |
| Transformers | 5.12.1 |
| scikit-learn | 1.9.0 |
| SDK Python Mistral | 2.4.12 |
| Node.js | 26.13.0 |
| npm | 11.16.0 |
| Next.js | 15.3.3 |
| React | 19.0.0 |
| Prisma / client Prisma | 5.22.0 |
| SDK MCP TypeScript | 1.29.0 |
| TypeScript (serveur DGID) | 6.0.3 |
| Zod (serveur DGID) | 4.4.3 |
| PostgreSQL utilisé par Prisma | 14, port 5433, base `sunubot` |

## Lancer les composants

### PostgreSQL

Démarrer le service Windows `postgresql-x64-14`. Le projet lit sa variable
`DATABASE_URL` depuis `frontend/.env`. Ne copier ni mot de passe ni clé API dans
un rapport, une capture ou un dépôt partagé.

### Frontend

```powershell
cd C:\Users\DELL\OneDrive\Bureau\Memoire\prototype\frontend
npm run dev -- -p 3001
```

Ouvrir ensuite `http://localhost:3001/`.

### API NLP et Mistral

```powershell
cd C:\Users\DELL\OneDrive\Bureau\Memoire\prototype\nlp
python main.py
```

`main.py` charge `nlp/.env`, ajoute `nlp/src` au chemin Python puis démarre
l'API sur le port 8000. Mistral est appelé par l'API distante au moyen du SDK
Python `mistralai`; le modèle configuré est `mistral-small-latest`. La clé est
requise pour que l'appel soit activé. L'intégration a été confirmée dans le
code et la configuration locale; une requête live Mistral n'est pas comprise
dans les résultats de cette vérification.

Pour contrôler l'état de l'API : `http://localhost:8000/health`.

### Vérifier l'état Prisma

```powershell
cd C:\Users\DELL\OneDrive\Bureau\Memoire\prototype\frontend
npx prisma migrate status
```

Résultat relevé le 2 novembre 2026 : `Database schema is up to date!`.

### Démonstration du client MCP DGID

```powershell
cd C:\Users\DELL\OneDrive\Bureau\Memoire\prototype\mcp-servers\dgid
npm run demo:mcp
```

La commande compile le serveur, ouvre une session MCP par transport `stdio`,
liste ses outils, appelle `get_centre_fiscal` pour Thiès et écrit les messages
JSON-RPC dans `mcp-servers/dgid/traces/`. Les données sont des fixtures locales
de démonstration, sans connexion aux systèmes officiels de la DGID.

### Évaluation initiale des intentions mBERT

```powershell
cd C:\Users\DELL\OneDrive\Bureau\Memoire\prototype\nlp
python src/evaluer_mbert_initial.py
```

Le script charge le modèle fine-tuné local et écrit les prédictions détaillées
dans `nlp/results/evaluation_mbert_initial.json`. Les phrases wolof du jeu
doivent être validées par un locuteur compétent avant de présenter ce résultat
comme une évaluation linguistiquement validée.

## Limites d'interprétation

- Le client de démonstration prouve un échange MCP réel avec le serveur local
  DGID. L'orchestration de la conversation web demeure simulée à ce stade.
- Le serveur DGID utilise des données de démonstration locales; les réponses ne
  doivent pas être présentées comme des informations officielles.
- Une soumission par l'API de formulaire a été retrouvée dans PostgreSQL. La
  capture visuelle du parcours complet depuis l'interface web reste à produire.
- Le score mBERT est une première mesure exploratoire, sur seulement 16
  exemples, dont les annotations wolof restent à faire relire.
