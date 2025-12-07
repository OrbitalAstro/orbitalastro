FROM python:3.11-slim

WORKDIR /app
COPY . /app

# Installer outils de compilation et dépendances
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        build-essential \
        wget \
        curl \
        libffi-dev \
        libssl-dev && \
    rm -rf /var/lib/apt/lists/*

# Télécharger et compiler la dernière version Swiss Ephemeris
RUN wget https://www.astro.com/ftp/swisseph/swe_unix_src_2.10.04.tar.gz && \
    tar xzf swe_unix_src_2.10.04.tar.gz && \
    cd swisseph && make libswe.a && make libswe.so && \
    cp libswe.* /usr/local/lib/ && \
    cd .. && rm -rf swisseph swe_unix_src_2.10.04.tar.gz

# Installer les dépendances Python
RUN python -m pip install --no-cache-dir --upgrade pip setuptools wheel
RUN python -m pip install --no-cache-dir -r requirements.txt

EXPOSE 10000
HEALTHCHECK CMD curl --fail http://localhost:10000/ || exit 1

CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "10000"]
