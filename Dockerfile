# Utilise une image Python stable compatible avec pyswisseph
FROM python:3.11-slim

# Crée et positionne le répertoire de travail
WORKDIR /app

# Copie tous les fichiers du projet dans le conteneur
COPY . /app

# Installe les dépendances système nécessaires à pyswisseph
RUN apt-get update && apt-get install -y build-essential libssl-dev libffi-dev && rm -rf /var/lib/apt/lists/*

# Met à jour pip et installe les dépendances Python
RUN python -m pip install --no-cache-dir --upgrade pip setuptools wheel
RUN python -m pip install --no-cache-dir -r requirements.txt

# Expose le port que Render utilise
EXPOSE 10000

# Démarre ton app
CMD ["uvicorn", "api.index:app", "--host", "0.0.0.0", "--port", "10000"]
