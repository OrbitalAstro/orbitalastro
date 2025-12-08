# Guide de déploiement sur Vercel

## Prérequis

1. Installer Vercel CLI :
```bash
npm install -g vercel
```

2. Avoir un compte Vercel (gratuit sur https://vercel.com)

## Déploiement

### Option 1 : Via Vercel CLI

1. Installer les dépendances (si ce n'est pas déjà fait) :
```bash
pip install -r requirements.txt
```

2. Connecter votre projet à Vercel :
```bash
vercel login
```

3. Déployer :
```bash
vercel
```

4. Pour déployer en production :
```bash
vercel --prod
```

### Option 2 : Via l'interface web Vercel

1. Aller sur https://vercel.com
2. Cliquer sur "New Project"
3. Connecter votre dépôt GitHub/GitLab/Bitbucket
4. Vercel détectera automatiquement la configuration Python
5. Cliquer sur "Deploy"

## Configuration

Le fichier `vercel.json` configure :
- Les routes pour rediriger toutes les requêtes vers `api/index.py`
- Le builder Python (`@vercel/python`)
- Les variables d'environnement nécessaires

## Limites importantes

⚠️ **Attention** : Vercel a des limites pour les fonctions serverless :
- Timeout maximum : 60 secondes (plan gratuit) ou 300 secondes (plan Pro)
- Taille maximale du package : 50 MB (gratuit) ou 250 MB (Pro)

**Important** : `flatlib` ne nécessite pas de compilation native ni de fichiers externes. Si un build échoue, vérifiez que Vercel déploie bien la dernière révision contenant `flatlib` dans `requirements.txt`.

## Variables d'environnement

Si nécessaire, configurez des variables d'environnement via :
- Vercel Dashboard → Settings → Environment Variables
- Ou via CLI : `vercel env add VARIABLE_NAME`

## URLs

Après le déploiement, vous obtiendrez :
- URL de déploiement : `https://your-project.vercel.app`
- Documentation Swagger : `https://your-project.vercel.app/docs`

## Mise à jour du schéma OpenAPI

N'oubliez pas de mettre à jour `openapi.json` avec l'URL de production :

```json
"servers": [
  {
    "url": "https://your-project.vercel.app",
    "description": "Serveur de production Vercel"
  }
]
```

## Dépannage

Si vous rencontrez des erreurs :

1. Vérifier les logs : `vercel logs`
2. Vérifier que toutes les dépendances sont dans `requirements.txt`
3. Confirmer que l'instance déployée pointe sur la branche/commit attendu (sinon relancer le déploiement)

## Alternative : Utiliser un conteneur Docker sur Vercel

Si vous voulez contrôler finement l'environnement, vous pouvez utiliser Vercel avec Docker :
- Créer un `Dockerfile`
- Utiliser Vercel avec le runtime Docker (nécessite un plan Pro)

## Support

Pour plus d'informations :
- Documentation Vercel Python : https://vercel.com/docs/concepts/functions/serverless-functions/runtimes/python
- Documentation FastAPI : https://fastapi.tiangolo.com/



