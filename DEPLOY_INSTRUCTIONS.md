# Instructions de déploiement Vercel

## ⚠️ IMPORTANT : Redémarrez d'abord votre terminal PowerShell

Node.js vient d'être installé, mais le terminal actuel ne peut pas encore le voir. 

### Étape 1 : Redémarrer PowerShell

1. Fermez ce terminal PowerShell
2. Ouvrez un **nouveau** terminal PowerShell
3. Naviguez vers le dossier du projet :
   ```powershell
   cd C:\Users\josee\Documents\Projets\OrbitalAstro
   ```

### Étape 2 : Exécuter le script de déploiement

```powershell
.\deploy.ps1
```

Le script va :
1. Vérifier que Node.js et npm sont installés
2. Installer Vercel CLI globalement
3. Vous connecter à Vercel (ouvrira votre navigateur)
4. Lancer le déploiement

### Étape 3 : Répondre aux questions

Le script vous posera quelques questions :
- **Set up and deploy?** → Tapez `Y` et appuyez sur Entrée
- **Which scope?** → Sélectionnez votre compte Vercel
- **Link to existing project?** → Tapez `N` (nouveau projet)
- **What's your project's name?** → Tapez `orbitalastro-api` (ou votre choix)
- **In which directory is your code located?** → Tapez `./` ou `.\`

### Étape 4 : Déployer en production (optionnel)

Après le premier déploiement de test, pour déployer en production :

```powershell
vercel --prod
```

## 🚀 Déploiement manuel (alternative)

Si vous préférez déployer manuellement :

```powershell
# 1. Installer Vercel CLI
npm install -g vercel

# 2. Se connecter
vercel login

# 3. Déployer (test/preview)
vercel

# 4. Déployer en production
vercel --prod
```

## 📍 URLs après déploiement

Après le déploiement, votre API sera accessible à :

- **Preview/Test** : `https://orbitalastro-api-[hash].vercel.app`
- **Production** : `https://orbitalastro-api.vercel.app` (après `vercel --prod`)
- **Documentation Swagger** : `https://votre-url.vercel.app/docs`

## ⚙️ Mise à jour du schéma OpenAPI

Après le déploiement, mettez à jour `openapi.json` avec votre URL de production :

1. Ouvrez `openapi.json`
2. Remplacez l'URL dans la section `servers` :
   ```json
   "servers": [
     {
       "url": "https://orbitalastro-api.vercel.app",
       "description": "Serveur Vercel de production"
     }
   ]
   ```
3. Commitez et poussez les changements

## ✅ Vérification

Pour vérifier que tout fonctionne :

```powershell
# Tester l'API
curl https://votre-url.vercel.app/
# ou dans PowerShell :
Invoke-WebRequest -Uri https://votre-url.vercel.app/ | Select-Object -ExpandProperty Content
```

## 🆘 Problèmes ?

Si vous rencontrez des erreurs :

1. **npm non trouvé** : Redémarrez complètement PowerShell
2. **Erreur de build** : Vérifiez les logs dans le Dashboard Vercel
3. **Timeout** : Vérifiez que les calculs ne prennent pas trop de temps
4. **Erreur pyswisseph** : Vérifiez que les dépendances sont dans `requirements.txt`



