FROM python:3.11-slim

WORKDIR /app

# Installer les dépendances système nécessaires pour compiler pyswisseph
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    make \
    wget \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copier requirements
COPY requirements.txt ./

# Installer pyswisseph en premier (le plus critique)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir pyswisseph

# Installer les autres dépendances Python
RUN pip install --no-cache-dir -r requirements.txt

# Créer le dossier pour les fichiers éphémérides
RUN mkdir -p /app/api/ephe

# Copier tout le code de l'application (inclut api/ephe si présent)
COPY . .

# Si les fichiers éphémérides n'existent pas, les télécharger
RUN if [ ! -f /app/api/ephe/seas_18.se1 ]; then \
        cd /app/api/ephe && \
        wget -q https://www.astro.com/ftp/swisseph/ephe/seas_18.se1 || true; \
    fi && \
    if [ ! -f /app/api/ephe/semo_18.se1 ]; then \
        cd /app/api/ephe && \
        wget -q https://www.astro.com/ftp/swisseph/ephe/semo_18.se1 || true; \
    fi && \
    if [ ! -f /app/api/ephe/sepl_18.se1 ]; then \
        cd /app/api/ephe && \
        wget -q https://www.astro.com/ftp/swisseph/ephe/sepl_18.se1 || true; \
    fi

# Exposer le port (Fly.io utilise 8080 par défaut, mais on garde 10000 pour compatibilité)
EXPOSE 8080
EXPOSE 10000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl --fail http://localhost:8080/ || exit 1

# Commande de démarrage - utiliser le port depuis l'environnement ou 8080 par défaut
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}"]
