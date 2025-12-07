# Utilise une image Python stable compatible avec pyswisseph
FROM python:3.11-slim

# Crée et positionne le répertoire de travail
WORKDIR /app

# Copie tous les fichiers du projet
COPY . /app

# Installe les dépendances système nécessaires à la compilation
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        wget \
        curl \
        libffi-dev \
        libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Télécharge et compile la bibliothèque Swiss Ephemeris
RUN wget https://www.astro.com/ftp/swisseph/swe_unix_src_2.10.03.tar.gz && \
    tar xzf swe_unix_src_2.10.03.tar.gz && \
    cd swisseph && make libswe.a && make libswe.so && \
    cp libswe.* /usr/local/lib/ && \
    cd .. && rm -rf swisseph swe_unix_src_2.10.03.tar.gz

# Met à jour pip et installe les dépendances Python
RUN python -m pip install --no-cache-dir --upgrade pip setuptools wheel
RUN python -m pip install --no-cache-dir -r requirements.txt

# Expose le port utilisé par Render
EXPOSE 10000

# Vérifie la santé du service
HEALTHCHECK CMD curl --fail http://localhost:10000/ || exit 1

# Démarre ton app
CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "10000"]
