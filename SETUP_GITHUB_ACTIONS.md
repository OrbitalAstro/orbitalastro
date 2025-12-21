# Configuration GitHub Actions pour Déploiement Automatique

## ✅ Ce qui a été créé
Un workflow GitHub Actions (`.github/workflows/deploy.yml`) qui déclenchera un déploiement Vercel à chaque push sur `main`.

## 🔧 Configuration Nécessaire

### Étape 1 : Ajouter le Secret GitHub
1. Allez sur : https://github.com/OrbitalAstro/orbitalastro/settings/secrets/actions
2. Cliquez sur **"New repository secret"**
3. **Name** : `VERCEL_DEPLOY_HOOK`
4. **Secret** : Collez l'URL du Deploy Hook que vous avez créé sur Vercel
   - (L'URL ressemble à : `https://api.vercel.com/v1/integrations/deploy/prj_.../...`)
5. Cliquez sur **"Add secret"**

### Étape 2 : Commiter et Pousser
Le workflow est déjà créé, il suffit de le commiter :

```bash
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Actions workflow for automatic Vercel deployment"
git push origin main
```

## 🧪 Test
Après avoir ajouté le secret et poussé :
1. Faites un nouveau commit
2. Poussez sur `main`
3. Allez sur : https://github.com/OrbitalAstro/orbitalastro/actions
4. Vous devriez voir le workflow s'exécuter
5. Vérifiez Vercel pour le nouveau déploiement

## 📝 Note
Cette méthode utilise GitHub Actions comme intermédiaire entre GitHub et Vercel, ce qui est plus fiable que les webhooks directs.




