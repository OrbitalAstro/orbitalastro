# ---- Étape 1 : image complète Debian (plus fiable que slim) ----
FROM python:3.11-bullseye

WORKDIR /app
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=false PIP_DISABLE_PIP_VERSION_CHECK=1

# ---- Installer dépendances système ----
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libffi-dev libssl-dev libxml2-dev libxslt1-dev \
    libcurl4-openssl-dev libreadline-dev libncurses5-dev libz-dev curl git \
 && rm -rf /var/lib/apt/lists/*

# ---- Installer les dépendances Python ----
COPY requirements.txt ./
RUN python -m pip install --upgrade pip setuptools wheel \
 && python -m pip install -r requirements.txt \
 && python -m pip install pyswisseph==2.10.3.2 --prefer-binary

# ---- Copier le code source ----
COPY . .

# ---- Vérification ----
RUN echo "🔍 Vérification pyswisseph..." && \
    python -c "import importlib.util; spec = importlib.util.find_spec('pyswisseph'); print('pyswisseph trouvé à:', spec.origin if spec else '❌ non trouvé')" \
    && ls -l /usr/local/lib/python3.11/site-packages/pyswisseph/

EXPOSE 10000
HEALTHCHECK CMD curl --fail http://localhost:10000/ || exit 0

CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "10000"]
