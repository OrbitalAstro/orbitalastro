# Vérifier le Webhook GitHub

## ✅ Connexion Réussie
GitHub a été reconnecté avec succès via CLI : `OrbitalAstro/orbitalastro` est connecté.

## ⚠️ Important : Vérifier le Webhook
Même si la connexion a réussi, le webhook GitHub doit être créé pour que les déploiements automatiques fonctionnent.

### Vérification
1. Allez sur : https://github.com/OrbitalAstro/orbitalastro/settings/hooks
2. Vous devriez voir un webhook Vercel avec :
   - URL : `https://api.vercel.com/v1/integrations/deploy/...`
   - Événements : Push, etc.

### Si le Webhook n'Existe Pas
Le webhook devrait être créé automatiquement, mais parfois il faut :
1. Attendre quelques minutes
2. Ou réinstaller l'application Vercel sur GitHub :
   - https://github.com/settings/installations
   - Trouvez "Vercel"
   - Cliquez sur "Configure"
   - Vérifiez que `OrbitalAstro/orbitalastro` est sélectionné

## Test
Une fois le webhook vérifié, faites un nouveau push et attendez 30-60 secondes pour voir le déploiement apparaître dans Vercel.


