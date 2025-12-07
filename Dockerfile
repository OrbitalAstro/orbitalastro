FROM python:3.11-slim

WORKDIR /app
ENV PYTHONUNBUFFERED=1 PIP_NO_CACHE_DIR=false PIP_DISABLE_PIP_VERSION_CHECK=1

# Dépendances nécessaires à pyswisseph
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential libffi-dev libssl-dev libxml2-dev libxslt1-dev curl git \
 && rm -rf /var/lib/apt/lists/*

# Installe pyswisseph directement dans cette même image
COPY requirements.txt ./
RUN python -m pip install --upgrade pip setuptools wheel \
 && python -m pip install -r requirements.txt \
 && python -m pip install pyswisseph==2.10.3.2 --prefer-binary

# Copie le code source
COPY . .

# Vérifie pyswisseph
RUN python -c "import sys, import importlib.util; print('sys.path=', sys.path); spec = importlib.util.find_spec('pyswisseph'); print('pyswisseph trouvé à:', spec.origin if spec else '❌ non trouvé')"

EXPOSE 10000
HEALTHCHECK CMD curl --fail http://localhost:10000/ || exit 0

CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "10000"]
