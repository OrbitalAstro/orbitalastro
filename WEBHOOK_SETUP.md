# Configuration Manuelle du Webhook GitHub pour Vercel

## Informations du Projet
- **Project ID**: `prj_gbs8r4dSCMd9ljI1wWA14Ui8xEq6`
- **Team ID**: `team_w13zRMKarqnIn6wogvoxkPhV`
- **Repository**: `OrbitalAstro/orbitalastro`

## Configuration du Webhook sur GitHub

### Étape 1 : Accéder aux Webhooks
1. Allez sur : https://github.com/OrbitalAstro/orbitalastro/settings/hooks
2. Cliquez sur "Add webhook"

### Étape 2 : Remplir les Champs

**Payload URL:**
```
https://api.vercel.com/v1/integrations/deploy-hook/prj_gbs8r4dSCMd9ljI1wWA14Ui8xEq6
```

**Content type:**
- Sélectionnez : `application/json`

**Secret:**
- Laissez vide (Vercel n'utilise pas de secret pour les webhooks GitHub standard)

**SSL verification:**
- ✅ Enable SSL verification (recommandé)

**Which events would you like to trigger this webhook?**
- Sélectionnez : **Just the push event**

**Active:**
- ✅ Cochez la case (Active)

### Étape 3 : Sauvegarder
Cliquez sur "Add webhook"

## Alternative : URL avec Team ID
Si l'URL ci-dessus ne fonctionne pas, essayez :
```
https://api.vercel.com/v1/integrations/deploy-hook/prj_gbs8r4dSCMd9ljI1wWA14Ui8xEq6?teamId=team_w13zRMKarqnIn6wogvoxkPhV
```

## Vérification
Après avoir créé le webhook :
1. Faites un push sur `main`
2. Attendez 30-60 secondes
3. Vérifiez le dashboard Vercel pour un nouveau déploiement

## Note
Normalement, Vercel crée automatiquement le webhook lors de la connexion. Si vous devez le créer manuellement, cela peut indiquer un problème avec l'application Vercel sur GitHub. Vous pouvez aussi essayer de réinstaller l'application Vercel sur GitHub.



