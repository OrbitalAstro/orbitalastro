# ---- Étape 1 : base Python avec dépendances système ----
FROM python:3.11-slim AS base

WORKDIR /app

ENV PYTHONUNBUFFERED=1
ENV PIP_NO_CACHE_DIR=false
ENV PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    libssl-dev \
    libxml2-dev \
    libxslt1-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# ---- Étape 2 : builder (compile pyswisseph et dépendances) ----
FROM base AS builder

COPY requirements.txt ./

RUN python -m pip install --upgrade pip setuptools wheel && \
    python -m pip install -r requirements.txt

# ---- Étape 3 : image finale ----
FROM python:3.11-slim

WORKDIR /app

# ✅ Copie l’environnement Python complet (toutes les libs et .so)
COPY --from=builder /usr/local /usr/local

# Copie le code source
COPY . .

# ✅ Force Python à reconnaître le chemin des libs compilées
ENV PYTHONPATH=/usr/local/lib/python3.11/site-packages
ENV LD_LIBRARY_PATH=/usr/local/lib/python3.11/site-packages:$LD_LIBRARY_PATH
ENV PATH="/usr/local/bin:$PATH"

# Debug optionnel : vérifier que pyswisseph est bien importable
RUN python -c "import pyswisseph; print('✓ pyswisseph présent et fonctionnel dans Render')"

EXPOSE 10000
HEALTHCHECK CMD curl --fail http://localhost:10000/ || exit 0

CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "10000"]
