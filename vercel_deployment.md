# Vercel Deployment Guide

## Configuration

Le projet est configuré pour être déployé sur Vercel avec le frontend Next.js dans le dossier `web/`.

## Fichiers de configuration

- **`vercel.json`** (racine) : Configuration principale pointant vers le dossier `web/`
- **`web/vercel.json`** : Configuration spécifique pour Next.js

## Étapes de déploiement

### 1. Se connecter à Vercel

```bash
cd web
vercel login
```

Suivez les instructions pour vous authentifier via le navigateur.

### 2. Lier le projet à Vercel

```bash
cd web
vercel link
```

Cela vous demandera :
- **Set up and deploy?** → `Y`
- **Which scope?** → Sélectionnez votre compte/organisation
- **Link to existing project?** → `N` (pour créer un nouveau projet)
- **What's your project's name?** → `orbitalastro` (ou le nom de votre choix)
- **In which directory is your code located?** → `./` (car nous sommes déjà dans `web/`)

### 3. Déployer

#### Déploiement de production

```bash
cd web
vercel --prod
```

#### Déploiement de preview

```bash
cd web
vercel
```

### 4. Variables d'environnement

Si votre application nécessite des variables d'environnement (comme `API_URL` pour pointer vers votre backend), configurez-les via :

1. **Dashboard Vercel** : https://vercel.com/dashboard → Votre projet → Settings → Environment Variables
2. **CLI** :
   ```bash
   vercel env add API_URL production
   ```

Variables recommandées :
- `API_URL` : URL de votre backend API (ex: `https://your-backend.railway.app` ou `https://your-backend.render.com`)

### 5. Configuration automatique via GitHub

Pour activer le déploiement automatique à chaque push :

1. Allez sur https://vercel.com/dashboard
2. Importez votre repository GitHub
3. Vercel détectera automatiquement Next.js
4. Configurez :
   - **Root Directory** : `web`
   - **Build Command** : `npm run build`
   - **Output Directory** : `.next`
   - **Install Command** : `npm install`

### 6. Vérification

Après le déploiement, Vercel vous fournira une URL comme :
- Production : `https://orbitalastro.vercel.app`
- Preview : `https://orbitalastro-git-<branch>-yourteam.vercel.app`

## Structure du projet

```
orbitalastro/
├── vercel.json          # Configuration racine (pointe vers web/)
├── web/                 # Frontend Next.js
│   ├── vercel.json      # Configuration Next.js
│   ├── package.json
│   └── ...
└── ...
```

## Notes importantes

- Le backend FastAPI doit être déployé séparément (Railway, Render, etc.)
- Assurez-vous que `API_URL` dans les variables d'environnement pointe vers votre backend
- Les builds Next.js sont optimisés automatiquement par Vercel
- Les déploiements preview sont créés automatiquement pour chaque PR

## Commandes utiles

```bash
# Voir les logs de déploiement
vercel logs

# Voir les informations du projet
vercel inspect

# Supprimer le projet
vercel remove
```
