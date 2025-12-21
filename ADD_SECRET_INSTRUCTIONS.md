# Instructions pour Ajouter le Secret GitHub

## ⚠️ Important
Le workflow GitHub Actions a été créé, mais il a besoin de l'URL du Deploy Hook Vercel pour fonctionner.

## 📝 Étapes

### 1. Récupérer l'URL du Deploy Hook
1. Allez sur : https://vercel.com/jo-divers-projects/orbitalastro-api/settings/deploy-hooks
2. Trouvez le Deploy Hook que vous avez créé
3. **Copiez l'URL complète** (elle ressemble à : `https://api.vercel.com/v1/integrations/deploy/prj_.../...`)

### 2. Ajouter le Secret sur GitHub
1. Allez sur : https://github.com/OrbitalAstro/orbitalastro/settings/secrets/actions
2. Cliquez sur **"New repository secret"**
3. **Name** : `VERCEL_DEPLOY_HOOK` (exactement comme ça, en majuscules)
4. **Secret** : Collez l'URL du Deploy Hook que vous avez copiée
5. Cliquez sur **"Add secret"**

### 3. Tester
Après avoir ajouté le secret :
1. Faites un nouveau commit et push
2. Allez sur : https://github.com/OrbitalAstro/orbitalastro/actions
3. Vous devriez voir le workflow "Deploy to Vercel" s'exécuter
4. Vérifiez Vercel pour le nouveau déploiement

## ✅ Une fois configuré
Chaque push sur `main` déclenchera automatiquement :
1. GitHub Actions exécute le workflow
2. Le workflow appelle le Deploy Hook Vercel
3. Vercel déploie automatiquement




