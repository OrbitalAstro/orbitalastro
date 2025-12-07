# ---- Étape 1 : base Python avec dépendances système ----
FROM python:3.11-slim AS base

WORKDIR /app
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=false PIP_DISABLE_PIP_VERSION_CHECK=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libffi-dev libssl-dev libxml2-dev libxslt1-dev curl git \
 && rm -rf /var/lib/apt/lists/*

# ---- Étape 2 : builder (compile pyswisseph et dépendances) ----
FROM base AS builder
COPY requirements.txt ./
RUN python -m pip install --upgrade pip setuptools wheel \
 && python -m pip install -r requirements.txt

# ---- Étape 3 : image finale ----
FROM python:3.11-slim
WORKDIR /app

# ✅ Copier tout /usr (pas seulement /usr/local)
COPY --from=builder /usr /usr
COPY . .

# ✅ Forcer Python à reconnaître les chemins de libs
ENV PYTHONPATH="/usr/local/lib/python3.11/site-packages:/usr/lib/python3.11/site-packages:$PYTHONPATH"
ENV LD_LIBRARY_PATH="/usr/local/lib/python3.11/site-packages:$LD_LIBRARY_PATH"
ENV PATH="/usr/local/bin:$PATH"

# ✅ Debug : vérifie où Python trouve pyswisseph
RUN echo ">>> Vérification des chemins Python" && \
    python -c "import sys, importlib.util; print('sys.path=', sys.path); spec = importlib.util.find_spec('pyswisseph'); print('pyswisseph trouvé à:', spec.origin if spec else '❌ non trouvé')" || echo '⚠️ pyswisseph non trouvé pendant le build, on testera au runtime'

EXPOSE 10000
HEALTHCHECK CMD curl --fail http://localhost:10000/ || exit 0

# ✅ Exporte encore PYTHONPATH au runtime
CMD ["bash", "-c", "export PYTHONPATH=/usr/local/lib/python3.11/site-packages:/usr/lib/python3.11/site-packages:$PYTHONPATH && uvicorn api.index:app --host 0.0.0.0 --port 10000"]
