# Utilise une image Python stable compatible avec pyswisseph
FROM python:3.11-slim

# Crée et positionne le répertoire de travail
WORKDIR /app

# Copie tous les fichiers du projet
COPY . /app

# Installe les dépendances système nécessaires à la compilation de modules Python
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        libffi-dev \
        libssl-dev \
        curl \
        git && \
    rm -rf /var/lib/apt/lists/*

# Met à jour pip
RUN python -m pip install --no-cache-dir --upgrade pip setuptools wheel

# Installe pyswisseph depuis GitHub (branche principale/master)
RUN python -m pip install --no-cache-dir git+https://github.com/astrorigin/pyswisseph.git

# Vérifie que pyswisseph est installé
RUN python -c "import pyswisseph; print('✓ pyswisseph installed successfully')" || \
    (echo "✗ ERROR: pyswisseph installation failed" && pip list && exit 1)

# Installe les autres dépendances de ton projet
RUN python -m pip install --no-cache-dir -r requirements.txt

# Expose le port utilisé par Render
EXPOSE 10000

# Vérifie la santé du service
HEALTHCHECK CMD curl --fail http://localhost:10000/ || exit 1

# Démarre ton app
CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "10000"]
