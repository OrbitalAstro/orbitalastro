"""
Point d'entrée pour le déploiement sur Vercel
Importe l'application FastAPI depuis le fichier main.py
"""

import sys
import os

# Ajouter le répertoire parent au chemin Python pour importer main
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from main import app

# Exporter l'application pour Vercel
# Vercel détecte automatiquement l'application FastAPI via @vercel/python
__all__ = ["app"]

