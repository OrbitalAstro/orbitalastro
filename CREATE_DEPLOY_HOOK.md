# Créer un Deploy Hook sur Vercel

## Étapes

1. **Allez sur Vercel Dashboard** : https://vercel.com/jo-divers-projects/orbitalastro-api/settings/deploy-hooks

2. **Cliquez sur "Create Hook"**

3. **Remplissez** :
   - **Name** : `GitHub Auto Deploy`
   - **Git Branch** : `main`
   - Cliquez sur **"Create Hook"**

4. **Copiez l'URL** qu'il vous donne (elle ressemble à : `https://api.vercel.com/v1/integrations/deploy/prj_.../...`)

5. **Retournez sur GitHub** : https://github.com/OrbitalAstro/orbitalastro/settings/hooks

6. **Modifiez le webhook existant** (ou créez-en un nouveau) :
   - **Payload URL** : Collez l'URL du Deploy Hook que vous venez de copier
   - **Content type** : `application/json`
   - **Events** : `Just the push event`
   - **Active** : ✅

7. **Sauvegardez**

## Test

Après avoir mis à jour le webhook avec la nouvelle URL :
- Faites un push
- Le webhook devrait déclencher un déploiement Vercel automatiquement



