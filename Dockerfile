# ---- Étape 1 : base Python avec cache pip ----
FROM python:3.11-slim AS base

WORKDIR /app

# Garde un cache pip local (pour builds plus rapides)
ENV PIP_NO_CACHE_DIR=false
ENV PIP_DISABLE_PIP_VERSION_CHECK=1
ENV PYTHONUNBUFFERED=1

# Installe dépendances système nécessaires à pyswisseph
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libffi-dev \
    libssl-dev \
    libxml2-dev \
    libxslt1-dev \
    curl \
    git \
    && rm -rf /var/lib/apt/lists/*

# ---- Étape 2 : installation des dépendances Python ----
FROM base AS builder

COPY requirements.txt ./

# ✅ Installe pyswisseph en version compilée (binaire si dispo)
RUN python -m pip install --upgrade pip setuptools wheel && \
    python -m pip install pyswisseph==2.10.3.2 --prefer-binary && \
    python -m pip install -r requirements.txt

# ---- Étape 3 : image finale légère ----
FROM python:3.11-slim

WORKDIR /app

# Copie les dépendances préinstallées depuis l’étape précédente
COPY --from=builder /usr/local/lib/python3.11 /usr/local/lib/python3.11
COPY --from=builder /usr/local/bin /usr/local/bin

# Copie le reste du projet
COPY . .

# Vérifie pyswisseph et le path Python (pour debug)
RUN python -m pip show pyswisseph && \
    python -c "import pyswisseph; print('✓ pyswisseph OK dans Render')"

# Expose le port (Render)
EXPOSE 10000

# Healthcheck
HEALTHCHECK CMD curl --fail http://localhost:10000/ || exit 1

# Commande de démarrage
CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "10000"]
