# ── SunuBot NLP Backend ──────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

# Installer les dependances systeme
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Copier et installer les dependances Python
COPY requirements.txt .
# Installer torch CPU leger pour Docker (evite les 2GB de torch GPU)
RUN pip install --no-cache-dir torch==2.4.0 --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir transformers==4.45.0 sentencepiece==0.2.0 protobuf==5.28.0 \
    fastapi==0.115.0 uvicorn==0.30.0 pydantic==2.9.0 scikit-learn==1.5.0 \
    numpy==1.26.4 pandas==2.2.0 langdetect==1.0.9 python-Levenshtein==0.25.0 \
    "mistralai>=1.0.0" "python-dotenv>=1.0.0"

# Copier le code source
COPY . .

# Creer le dossier models si il n'existe pas
RUN mkdir -p models/mbert_finetuned

# Exposer le port FastAPI
EXPOSE 8000

# Variables d'environnement par defaut
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Lancer l'API
CMD ["python", "main.py"]
