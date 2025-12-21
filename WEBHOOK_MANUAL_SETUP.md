# Configuration Manuelle du Webhook GitHub → Vercel

## Informations Nécessaires
- **Project ID**: `prj_gbs8r4dSCMd9ljI1wWA14Ui8xEq6`
- **Team ID**: `team_w13zRMKarqnIn6wogvoxkPhV`
- **Repository**: `OrbitalAstro/orbitalastro`

## Configuration sur GitHub

### 1. Allez sur la Page Webhooks
https://github.com/OrbitalAstro/orbitalastro/settings/hooks

### 2. Cliquez sur "Add webhook"

### 3. Remplissez les Champs

**Payload URL:**
```
https://api.vercel.com/v1/integrations/deploy-hook/prj_gbs8r4dSCMd9ljI1wWA14Ui8xEq6
```

**Content type:**
- Sélectionnez : `application/json`

**Secret:**
- Laissez vide (ou utilisez un secret si vous en avez un de Vercel)

**SSL verification:**
- ✅ **Enable SSL verification** (recommandé)

**Which events would you like to trigger this webhook?**
- Sélectionnez : **Just the push event**

**Active:**
- ✅ Cochez la case

### 4. Cliquez sur "Add webhook"

## Alternative : Si l'URL ci-dessus ne fonctionne pas

Vercel utilise parfois une URL différente. Essayez aussi :

```
https://api.vercel.com/v1/integrations/deploy/prj_gbs8r4dSCMd9ljI1wWA14Ui8xEq6
```

Ou avec le Team ID :
```
https://api.vercel.com/v1/integrations/deploy-hook/prj_gbs8r4dSCMd9ljI1wWA14Ui8xEq6?teamId=team_w13zRMKarqnIn6wogvoxkPhV
```

## Vérification

Après avoir créé le webhook :
1. Faites un commit et push : `git push origin main`
2. Attendez 30-60 secondes
3. Vérifiez le dashboard Vercel : https://vercel.com/jo-divers-projects/orbitalastro-api/deployments

## Note Importante

Si le webhook ne fonctionne toujours pas, il est recommandé de :
1. Réinstaller l'application Vercel sur GitHub : https://github.com/settings/installations
2. Ou contacter le support Vercel pour obtenir l'URL exacte du webhook




