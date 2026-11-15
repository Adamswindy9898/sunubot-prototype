# Notes Techniques - SunuBot

## Comment lancer le projet

### 1. Lancer la base de données
- Ouvrir pgAdmin 4
- Verifier que PostgreSQL 14 tourne
- Base de donnees : sunubot (port 5433, user: postgres, password: Adams)

### 2. Lancer le backend NLP Python
```
cd C:/Users/DELL/OneDrive/Bureau/Memoire/prototype/nlp
python -m uvicorn src.api:app --host 0.0.0.0 --port 8000
```

### 3. Lancer le frontend
```
cd C:/Users/DELL/OneDrive/Bureau/Memoire/prototype/frontend
npx next dev -p 5000
```

### 4. Ouvrir dans le navigateur
http://localhost:5001

## Compte de test
- Email : moussa.diop@example.com
- Mot de passe : password123

## Variables importantes (.env)
- DATABASE_URL : postgresql://postgres:Adams@localhost:5433/sunubot
- MISTRAL_API_KEY : (voir fichier .env local)
- Next.js port : 5001 (pas 3000 = Baye Guiinaar, pas 4000/5000 = occupé par Windows)

## Versions stables
- Next.js : 15.3.3 (ne pas upgrader vers 16)
- PostgreSQL : 14 (pas 18, mot de passe different)
- Python : 3.13

## Problemes connus et solutions
1. "Erreur de connexion" au login : lancer pgAdmin et verifier que PostgreSQL 14 tourne
2. "Desole une erreur est survenue" dans le chat : relancer le serveur NLP Python
3. Le site amene Baye Guiinaar : utiliser le port 5000 pas 3000
4. Langue inversee : bug corrige dans page.tsx et route.ts le 24 juillet 2026
