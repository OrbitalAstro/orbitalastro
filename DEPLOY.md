# Déploiement sur Vercel - Guide rapide

## 📋 Prérequis

1. **Compte Vercel** : Créez un compte gratuit sur [vercel.com](https://vercel.com)
2. **Vercel CLI** (optionnel) : 
   ```bash
   npm install -g vercel
   ```

## 🚀 Déploiement rapide

### Méthode 1 : Via Vercel CLI

```bash
# 1. Installer les dépendances (si ce n'est pas déjà fait)
pip install -r requirements.txt

# 2. Se connecter à Vercel
vercel login

# 3. Déployer
vercel

# 4. Déployer en production
vercel --prod
```

### Méthode 2 : Via l'interface web (Recommandé)

1. Allez sur [vercel.com](https://vercel.com)
2. Cliquez sur **"Add New..."** → **"Project"**
3. Importez votre dépôt GitHub/GitLab/Bitbucket
4. Vercel détectera automatiquement :
   - Framework : Python
   - Build Command : Automatique
   - Output Directory : Automatique
5. Cliquez sur **"Deploy"**

## ⚙️ Configuration

Les fichiers suivants sont configurés pour Vercel :

- `vercel.json` : Configuration des routes et du builder Python
- `api/index.py` : Point d'entrée de l'API pour Vercel
- `requirements.txt` : Dépendances Python (incluant Mangum pour la compatibilité serverless)

## 📍 URL de l'API

Après le déploiement, votre API sera disponible à :

- **URL principale** : `https://votre-projet.vercel.app`
- **Documentation Swagger** : `https://votre-projet.vercel.app/docs`
- **Documentation ReDoc** : `https://votre-projet.vercel.app/redoc`

## ⚠️ Notes importantes

### Limitations de Vercel (Plan gratuit)

- **Timeout** : 10 secondes (hobby) / 60 secondes (pro)
- **Taille du package** : 50 MB maximum
- **Mémoire** : 1024 MB

### Compatibilité avec pyswisseph

`pyswisseph` nécessite des outils de compilation C++. Vercel devrait les gérer automatiquement lors du build, mais :

1. Si vous rencontrez des erreurs de build, vérifiez les logs Vercel
2. Assurez-vous que toutes les dépendances sont dans `requirements.txt`
3. Les fichiers d'éphémérides ne sont pas inclus par défaut - l'API utilisera les calculs internes de Swiss Ephemeris

## 🔄 Mise à jour du schéma OpenAPI

Après le déploiement, mettez à jour `openapi.json` avec votre URL Vercel :

```json
"servers": [
  {
    "url": "https://votre-projet.vercel.app",
    "description": "Serveur Vercel de production"
  }
]
```

## 🐛 Dépannage

### Erreurs de build

Si vous rencontrez des erreurs :

1. Vérifiez les logs : Dashboard Vercel → Deployments → [Votre déploiement] → Logs
2. Vérifiez que `requirements.txt` est à jour
3. Essayez de déployer avec `vercel --debug`

### Erreurs d'import

Si vous voyez des erreurs d'import :

- Vérifiez que `api/index.py` importe correctement depuis `main.py`
- Le chemin doit être relatif au dossier racine

### Timeout

Si l'API prend trop de temps :

- Optimisez vos calculs
- Utilisez un plan Pro pour des timeouts plus longs (60s)
- Considérez mettre en cache certains calculs

## 📚 Ressources

- [Documentation Vercel Python](https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/python)
- [Documentation FastAPI](https://fastapi.tiangolo.com/)
- [Mangum (adapter ASGI)](https://mangum.io/)

## ✨ Votre API est prête !

Une fois déployée, votre API sera accessible publiquement et pourra être utilisée par votre GPT personnalisé ! 🎉



