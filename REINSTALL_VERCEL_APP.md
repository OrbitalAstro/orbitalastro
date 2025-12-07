# Réinstaller l'Application Vercel pour Activer les Webhooks

## Problème
Aucun webhook Vercel n'est configuré sur GitHub, donc les déploiements automatiques ne fonctionnent pas.

## Solution : Réinstaller l'Application Vercel

### Étape 1 : Désinstaller l'Application Vercel (si nécessaire)
1. Allez sur : https://github.com/settings/installations
2. Cherchez "Vercel" dans la liste des applications
3. Si elle existe, cliquez dessus puis "Uninstall"

### Étape 2 : Déconnecter le Dépôt dans Vercel
1. Allez sur : https://vercel.com/jo-divers-projects/orbitalastro-api/settings/git
2. Cliquez sur "Disconnect" (si disponible)
3. Confirmez la déconnexion

### Étape 3 : Reconnecter le Dépôt
1. Toujours sur la page Git de Vercel
2. Cliquez sur "Connect Git Repository"
3. Vous serez redirigé vers GitHub
4. Cliquez sur "Authorize Vercel" ou "Install Vercel"
5. **IMPORTANT** : Sélectionnez l'organisation `OrbitalAstro` (pas seulement votre compte personnel)
6. Accordez l'accès au dépôt `orbitalastro`
7. Cliquez sur "Install" ou "Authorize"

### Étape 4 : Sélectionner le Dépôt
1. Retour sur Vercel, sélectionnez : `OrbitalAstro/orbitalastro`
2. Cliquez sur "Connect" ou "Import"

### Étape 5 : Vérifier que le Webhook est Créé
1. Allez sur : https://github.com/OrbitalAstro/orbitalastro/settings/hooks
2. Vous devriez maintenant voir un webhook Vercel automatiquement créé
3. Le webhook devrait pointer vers `https://api.vercel.com/v1/integrations/deploy/...`

## Après Réinstallation
Une fois le webhook créé, les prochains pushes sur `main` déclencheront automatiquement des déploiements Vercel.

## Test
1. Faites un petit changement
2. Commitez et poussez : `git push origin main`
3. Attendez 30-60 secondes
4. Vérifiez le dashboard Vercel pour un nouveau déploiement


