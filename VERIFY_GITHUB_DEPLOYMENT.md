# Vérification du Déploiement Automatique GitHub → Vercel

## Problème
Les commits ne déclenchent pas de déploiements automatiques sur Vercel.

## Points à Vérifier

### 1. Vérifier les Webhooks GitHub
1. Allez sur GitHub : https://github.com/OrbitalAstro/orbitalastro/settings/hooks
2. Vérifiez qu'il y a un webhook Vercel
3. Si absent, réinstallez l'application Vercel sur GitHub

### 2. Vérifier l'Email du Committer
L'email utilisé pour les commits doit correspondre à votre compte GitHub/Vercel.

Email actuel dans Git : `jodivers@outlook.com`

**Solution** : Vérifiez que cet email est bien associé à votre compte GitHub.

### 3. Vérifier les Paramètres Vercel
1. Allez sur : https://vercel.com/jo-divers-projects/orbitalastro-api/settings/git
2. Vérifiez :
   - ✅ Repository: `OrbitalAstro/orbitalastro`
   - ✅ Production Branch: `main`
   - ✅ Automatic deployments: **Enabled**

### 4. Vérifier les Webhooks GitHub (Important!)
1. Allez sur : https://github.com/OrbitalAstro/orbitalastro/settings/hooks
2. Cherchez un webhook de Vercel
3. Si absent :
   - Allez sur : https://github.com/settings/installations
   - Trouvez "Vercel" dans les applications installées
   - Vérifiez qu'elle a accès à l'organisation `OrbitalAstro`
   - Si nécessaire, réinstallez l'application

### 5. Test Manuel
Si tout est configuré, essayez de :
1. Faire un petit changement
2. Commiter et pousser
3. Attendre 30-60 secondes
4. Vérifier le dashboard Vercel

## Solution Alternative : Déploiement Manuel
En attendant que le déploiement automatique fonctionne, vous pouvez déployer manuellement via l'interface Vercel :
1. Allez sur le dashboard Vercel
2. Cliquez sur "Redeploy" sur le dernier déploiement
3. Ou utilisez : `vercel --prod` (mais cela échoue actuellement à cause de l'email)




